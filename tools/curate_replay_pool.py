#!/usr/bin/env python3
"""Curate replay pool and assemble mixed training dataset.

This script supports two modes:
1) legacy mode: mixed = new + sampled old rows by MIX_OLD_RATIO.
2) three-source mode: mixed = new + recent-window + curated-history.

Outputs also include replay candidate pool and a JSON report for observability.
"""

from __future__ import annotations

import argparse
import json
import math
import random
import re
import tempfile
from collections import Counter, defaultdict
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Iterable

REQUIRED_SCHEMA_VERSION = 3

SAMPLE_ID_STEP_RE = re.compile(r":s\d+$")
ROUND_IN_SAMPLE_RE = re.compile(r":round-(\d+):")
ROUND_IN_SEED_RE = re.compile(r":round-(\d+):")


@dataclass
class GameBucket:
    key: str
    source: str
    source_round: int | None
    action_counts: Counter = field(default_factory=Counter)
    row_count: int = 0
    steps: int = 0
    blocked: bool = False
    ok_false: bool = False
    has_game_end: bool = False
    pass_count: int = 0
    final_score_sum: float = 0.0
    final_score_count: int = 0


@dataclass
class CurateConfig:
    current_round: int
    max_steps: int
    max_pass_ratio: float
    replay_max_rows: int
    replay_max_games: int
    replay_max_games_per_round: int
    replay_anchor_games_per_round: int
    replay_recent_rounds: int
    replay_age_half_life_rounds: float
    shift_alert_threshold: float
    single_source_ratio_alert: float
    mix_new_ratio: float | None
    mix_recent_ratio: float | None
    mix_curated_ratio: float | None
    mix_old_ratio: float
    seed: str


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Curate replay pool and build mixed dataset")
    parser.add_argument("--new-dataset", required=True)
    parser.add_argument("--replay-dataset", required=True)
    parser.add_argument("--mixed-out", required=True)
    parser.add_argument("--replay-candidate-out", required=True)
    parser.add_argument("--recent-window-out", required=True)
    parser.add_argument("--curated-pool-out", required=True)
    parser.add_argument("--report-out", required=True)
    parser.add_argument("--current-round", type=int, required=True)
    parser.add_argument("--max-steps", type=int, default=10000)
    parser.add_argument("--max-pass-ratio", type=float, default=0.65)
    parser.add_argument("--replay-max-rows", type=int, default=220000)
    parser.add_argument("--replay-max-games", type=int, default=2400)
    parser.add_argument("--replay-max-games-per-round", type=int, default=180)
    parser.add_argument("--replay-anchor-games-per-round", type=int, default=8)
    parser.add_argument("--replay-recent-rounds", type=int, default=6)
    parser.add_argument("--replay-age-half-life-rounds", type=float, default=6.0)
    parser.add_argument("--shift-alert-threshold", type=float, default=0.18)
    parser.add_argument("--single-source-ratio-alert", type=float, default=0.7)
    parser.add_argument("--mix-new-ratio", type=float)
    parser.add_argument("--mix-recent-ratio", type=float)
    parser.add_argument("--mix-curated-ratio", type=float)
    parser.add_argument("--mix-old-ratio", type=float, default=0.5)
    parser.add_argument("--seed", default="iterative-self-play")
    return parser.parse_args()


def parse_jsonl(path: Path) -> Iterable[tuple[str, dict[str, Any]]]:
    if not path.exists():
        return
    with path.open("r", encoding="utf-8") as handle:
        for raw in handle:
            line = raw.strip()
            if not line:
                continue
            try:
                obj = json.loads(line)
            except json.JSONDecodeError:
                continue
            if isinstance(obj, dict):
                yield line, obj


def schema_stats(path: Path, schema_version: int = REQUIRED_SCHEMA_VERSION) -> dict[str, int]:
    stats = {
        "seen": 0,
        "kept": 0,
        "droppedWrongSchema": 0,
    }
    for _, sample in parse_jsonl(path):
        stats["seen"] += 1
        if int(sample.get("schemaVersion") or 0) != schema_version:
            stats["droppedWrongSchema"] += 1
            continue
        stats["kept"] += 1
    return stats


def count_jsonl_rows(path: Path) -> int:
    count = 0
    if not path.exists():
        return 0
    with path.open("r", encoding="utf-8") as handle:
        for raw in handle:
            if raw.strip():
                count += 1
    return count


def sample_to_game_key(sample: dict[str, Any]) -> str | None:
    sample_id = str(sample.get("sampleId") or "").strip()
    if not sample_id:
        return None
    return SAMPLE_ID_STEP_RE.sub("", sample_id)


def parse_source_round(sample: dict[str, Any]) -> int | None:
    sample_id = str(sample.get("sampleId") or "")
    match = ROUND_IN_SAMPLE_RE.search(sample_id)
    if match:
        return int(match.group(1))
    seed = str(sample.get("seed") or "")
    match = ROUND_IN_SEED_RE.search(seed)
    if match:
        return int(match.group(1))
    return None


def parse_action_id(sample: dict[str, Any]) -> str:
    target = sample.get("policyTarget") or {}
    action_id = str(target.get("id") or "unknown")
    return action_id or "unknown"


def update_bucket(bucket: GameBucket, sample: dict[str, Any]) -> None:
    bucket.row_count += 1
    step_idx = int(sample.get("stepIndex") or 0)
    if step_idx > bucket.steps:
        bucket.steps = step_idx
    bucket.blocked = bucket.blocked or bool(sample.get("blocked"))
    bucket.ok_false = bucket.ok_false or (sample.get("ok") is False)
    bucket.has_game_end = bucket.has_game_end or bool(sample.get("gameEnded"))
    action_id = parse_action_id(sample)
    bucket.action_counts[action_id] += 1
    if action_id == "pass":
        bucket.pass_count += 1
    score = sample.get("finalScore")
    try:
        score_v = float(score)
    except (TypeError, ValueError):
        score_v = 0.0
    bucket.final_score_sum += score_v
    bucket.final_score_count += 1


def build_buckets(path: Path, source: str) -> dict[str, GameBucket]:
    buckets: dict[str, GameBucket] = {}
    for row, sample in parse_jsonl(path):
        if int(sample.get("schemaVersion") or 0) != REQUIRED_SCHEMA_VERSION:
            continue
        key = sample_to_game_key(sample)
        if not key:
            continue
        if key not in buckets:
            buckets[key] = GameBucket(
                key=key,
                source=source,
                source_round=parse_source_round(sample),
            )
        update_bucket(buckets[key], sample)
    return buckets


def action_entropy(counter: Counter) -> float:
    total = sum(counter.values())
    if total <= 0:
        return 0.0
    entropy = 0.0
    for count in counter.values():
        p = count / total
        if p > 0:
            entropy -= p * math.log(p)
    if len(counter) > 1:
        entropy /= math.log(len(counter))
    return entropy


def game_quality(bucket: GameBucket) -> float:
    if bucket.final_score_count <= 0:
        return 0.0
    return bucket.final_score_sum / bucket.final_score_count


def age_decay(source_round: int | None, current_round: int, half_life: float) -> float:
    if source_round is None:
        return 1.0
    if source_round >= current_round:
        return 1.0
    age = max(0, current_round - source_round)
    if half_life <= 0:
        return 1.0
    return math.pow(0.5, age / half_life)


def l1_distance(counter_a: Counter, counter_b: Counter) -> float:
    total_a = sum(counter_a.values())
    total_b = sum(counter_b.values())
    if total_a <= 0 and total_b <= 0:
        return 0.0
    keys = set(counter_a.keys()) | set(counter_b.keys())
    dist = 0.0
    for key in keys:
        pa = counter_a.get(key, 0) / total_a if total_a > 0 else 0.0
        pb = counter_b.get(key, 0) / total_b if total_b > 0 else 0.0
        dist += abs(pa - pb)
    return 0.5 * dist


def js_divergence(counter_a: Counter, counter_b: Counter) -> float:
    total_a = sum(counter_a.values())
    total_b = sum(counter_b.values())
    if total_a <= 0 and total_b <= 0:
        return 0.0
    keys = set(counter_a.keys()) | set(counter_b.keys())
    m = {}
    for key in keys:
        pa = counter_a.get(key, 0) / total_a if total_a > 0 else 0.0
        pb = counter_b.get(key, 0) / total_b if total_b > 0 else 0.0
        m[key] = 0.5 * (pa + pb)

    def kl(counter: Counter, total: int) -> float:
        if total <= 0:
            return 0.0
        value = 0.0
        for key in keys:
            p = counter.get(key, 0) / total
            q = m[key]
            if p > 0 and q > 0:
                value += p * math.log(p / q)
        return value

    return 0.5 * kl(counter_a, total_a) + 0.5 * kl(counter_b, total_b)


def filter_games(
    games: dict[str, GameBucket],
    config: CurateConfig,
) -> tuple[list[GameBucket], dict[str, int]]:
    kept: list[GameBucket] = []
    reasons = Counter()
    for game in games.values():
        if game.blocked:
            reasons["blocked"] += 1
            continue
        if game.ok_false:
            reasons["ok_false"] += 1
            continue
        if not game.has_game_end:
            reasons["not_game_ended"] += 1
            continue
        if game.steps >= config.max_steps:
            reasons["max_steps"] += 1
            continue
        pass_ratio = game.pass_count / game.steps if game.steps > 0 else 0.0
        if pass_ratio > config.max_pass_ratio:
            reasons["pass_ratio"] += 1
            continue
        kept.append(game)
    return kept, dict(reasons)


def score_games(games: list[GameBucket], config: CurateConfig) -> list[tuple[float, GameBucket]]:
    scored: list[tuple[float, GameBucket]] = []
    for game in games:
        entropy = action_entropy(game.action_counts)
        quality = game_quality(game)
        decay = age_decay(game.source_round, config.current_round, config.replay_age_half_life_rounds)
        recent_bonus = 0.15 if (game.source_round is not None and game.source_round >= config.current_round - config.replay_recent_rounds + 1) else 0.0
        score = quality * 0.65 + entropy * 20.0 * 0.2 + decay * 10.0 * 0.15 + recent_bonus
        scored.append((score, game))
    scored.sort(key=lambda item: item[0], reverse=True)
    return scored


def choose_with_round_quotas(
    scored_games: list[tuple[float, GameBucket]],
    config: CurateConfig,
    rng: random.Random,
) -> list[GameBucket]:
    by_round: dict[int | None, list[tuple[float, GameBucket]]] = defaultdict(list)
    for score, game in scored_games:
        by_round[game.source_round].append((score, game))

    selected: list[GameBucket] = []

    for round_id, items in by_round.items():
        if round_id is None:
            continue
        anchors = [game for _, game in items[: config.replay_anchor_games_per_round]]
        selected.extend(anchors)

    selected_keys = {g.key for g in selected}

    for round_id, items in by_round.items():
        per_round_limit = config.replay_max_games_per_round
        current_for_round = sum(1 for g in selected if g.source_round == round_id)
        for _, game in items:
            if game.key in selected_keys:
                continue
            if current_for_round >= per_round_limit:
                break
            selected.append(game)
            selected_keys.add(game.key)
            current_for_round += 1

    if len(selected) > config.replay_max_games:
        selected = selected[: config.replay_max_games]

    # Reseed order lightly to reduce deterministic overfitting while keeping score priority.
    if selected:
        head = selected[: max(1, len(selected) // 3)]
        tail = selected[max(1, len(selected) // 3) :]
        rng.shuffle(tail)
        selected = head + tail

    return selected


def flatten_rows(games: list[GameBucket], max_rows: int) -> list[str]:
    raise NotImplementedError("Use collect_rows_for_keys() instead of cached game rows")


def sample_rows(rows: list[str], take: int, rng: random.Random) -> list[str]:
    if take <= 0 or not rows:
        return []
    if take >= len(rows):
        out = list(rows)
        rng.shuffle(out)
        return out
    return rng.sample(rows, take)


def count_filtered_rows(path: Path, schema_version: int = REQUIRED_SCHEMA_VERSION) -> int:
    count = 0
    for _, sample in parse_jsonl(path):
        if int(sample.get("schemaVersion") or 0) != schema_version:
            continue
        count += 1
    return count


def reservoir_sample_filtered_rows(path: Path, take: int, rng: random.Random, schema_version: int = REQUIRED_SCHEMA_VERSION) -> list[str]:
    if take <= 0:
        return []
    reservoir: list[str] = []
    seen = 0
    for row, sample in parse_jsonl(path):
        if int(sample.get("schemaVersion") or 0) != schema_version:
            continue
        seen += 1
        if len(reservoir) < take:
            reservoir.append(row)
            continue
        idx = rng.randint(0, seen - 1)
        if idx < take:
          reservoir[idx] = row
    if len(reservoir) > take:
        return reservoir[:take]
    return reservoir


def collect_rows_for_keys(path: Path, selected_keys: set[str], max_rows: int | None = None) -> list[str]:
    rows: list[str] = []
    if not selected_keys:
        return rows
    for row, sample in parse_jsonl(path):
        if int(sample.get("schemaVersion") or 0) != REQUIRED_SCHEMA_VERSION:
            continue
        key = sample_to_game_key(sample)
        if not key or key not in selected_keys:
            continue
        rows.append(row)
        if max_rows is not None and len(rows) >= max_rows:
            break
    return rows


def sample_remaining_rows(rows: list[str], taken_rows: set[str], take: int, rng: random.Random) -> list[str]:
    if take <= 0:
        return []
    reservoir: list[str] = []
    seen = 0
    for row in rows:
        if row in taken_rows:
            continue
        seen += 1
        if len(reservoir) < take:
            reservoir.append(row)
            continue
        idx = rng.randint(0, seen - 1)
        if idx < take:
            reservoir[idx] = row
    return reservoir


def write_jsonl(path: Path, rows: Iterable[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    wrote = False
    with path.open("w", encoding="utf-8") as handle:
        for row in rows:
            handle.write(row)
            handle.write("\n")
            wrote = True
    if not wrote:
        path.write_text("", encoding="utf-8")


def total_game_rows(games: Iterable[GameBucket]) -> int:
    return sum(max(0, int(game.row_count or 0)) for game in games)


def select_games_by_row_quota(
    games: list[GameBucket],
    target_rows: int,
    rng: random.Random,
    excluded_keys: set[str] | None = None,
) -> list[GameBucket]:
    if target_rows <= 0:
        return []
    excluded = excluded_keys or set()
    pool = [game for game in games if game.key not in excluded]
    rng.shuffle(pool)
    selected: list[GameBucket] = []
    rows = 0
    for game in pool:
        if rows >= target_rows:
            break
        selected.append(game)
        rows += max(0, int(game.row_count or 0))
    return selected


def stream_rows_for_keys(
    input_path: Path,
    selected_keys: set[str],
    handle,
    *,
    max_rows: int | None = None,
    action_counts: Counter | None = None,
) -> int:
    if not selected_keys:
        return 0
    written = 0
    for row, sample in parse_jsonl(input_path):
        if int(sample.get("schemaVersion") or 0) != REQUIRED_SCHEMA_VERSION:
            continue
        key = sample_to_game_key(sample)
        if not key or key not in selected_keys:
            continue
        handle.write(row)
        handle.write("\n")
        written += 1
        if action_counts is not None:
            action_counts[parse_action_id(sample)] += 1
        if max_rows is not None and written >= max_rows:
            break
    return written


def write_rows_for_keys(
    input_path: Path,
    selected_keys: set[str],
    out_path: Path,
    *,
    max_rows: int | None = None,
    action_counts: Counter | None = None,
) -> int:
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with out_path.open("w", encoding="utf-8") as handle:
        return stream_rows_for_keys(
            input_path,
            selected_keys,
            handle,
            max_rows=max_rows,
            action_counts=action_counts,
        )


def stream_rows_to_shards(
    input_path: Path,
    selected_keys: set[str],
    shard_handles: list[Any],
    rng: random.Random,
    *,
    action_counts: Counter | None = None,
) -> int:
    if not selected_keys:
        return 0
    written = 0
    shard_count = max(1, len(shard_handles))
    for row, sample in parse_jsonl(input_path):
        if int(sample.get("schemaVersion") or 0) != REQUIRED_SCHEMA_VERSION:
            continue
        key = sample_to_game_key(sample)
        if not key or key not in selected_keys:
            continue
        handle = shard_handles[rng.randrange(shard_count)]
        handle.write(row)
        handle.write("\n")
        written += 1
        if action_counts is not None:
            action_counts[parse_action_id(sample)] += 1
    return written


def shuffle_shards_to_output(shard_paths: list[Path], out_path: Path, rng: random.Random) -> int:
    out_path.parent.mkdir(parents=True, exist_ok=True)
    written = 0
    with out_path.open("w", encoding="utf-8") as out_handle:
        shard_order = list(shard_paths)
        rng.shuffle(shard_order)
        for shard_path in shard_order:
            if not shard_path.exists():
                continue
            rows = [line.rstrip("\n") for line in shard_path.read_text(encoding="utf-8").splitlines() if line.strip()]
            rng.shuffle(rows)
            for row in rows:
                out_handle.write(row)
                out_handle.write("\n")
                written += 1
    return written


def source_round_hist(games: list[GameBucket]) -> dict[str, int]:
    hist: Counter = Counter()
    for game in games:
        key = "unknown" if game.source_round is None else str(game.source_round)
        hist[key] += 1
    return dict(sorted(hist.items(), key=lambda item: item[0]))


def source_ratio(rows_by_source: dict[str, list[str]]) -> dict[str, float]:
    total = sum(len(rows) for rows in rows_by_source.values())
    if total <= 0:
        return {key: 0.0 for key in rows_by_source.keys()}
    return {key: len(rows) / total for key, rows in rows_by_source.items()}


def count_actions_from_rows(rows: list[str]) -> Counter:
    counts = Counter()
    for row in rows:
        try:
            sample = json.loads(row)
        except json.JSONDecodeError:
            continue
        counts[parse_action_id(sample)] += 1
    return counts


def run_legacy_mode(
    new_path: Path,
    old_path: Path,
    schema_filter: dict[str, Any],
    config: CurateConfig,
    out_mixed: Path,
    out_replay_candidate: Path,
    out_recent: Path,
    out_curated: Path,
    out_report: Path,
) -> None:
    rng = random.Random(config.seed)
    new_count = count_filtered_rows(new_path)
    old_count = count_filtered_rows(old_path)
    old_take = min(old_count, int(round(new_count * max(0.0, config.mix_old_ratio))))
    sampled_old = reservoir_sample_filtered_rows(old_path, old_take, rng)

    out_mixed.parent.mkdir(parents=True, exist_ok=True)
    with out_mixed.open("w", encoding="utf-8") as mixed_handle, out_replay_candidate.open("w", encoding="utf-8") as replay_handle:
        for row, sample in parse_jsonl(new_path):
            if int(sample.get("schemaVersion") or 0) != REQUIRED_SCHEMA_VERSION:
                continue
            mixed_handle.write(row)
            mixed_handle.write("\n")
            replay_handle.write(row)
            replay_handle.write("\n")
        for row in sampled_old:
            mixed_handle.write(row)
            mixed_handle.write("\n")
            replay_handle.write(row)
            replay_handle.write("\n")

    write_jsonl(out_recent, sampled_old)
    write_jsonl(out_curated, sampled_old)

    report = {
        "mode": "legacy",
        "schema": schema_filter,
        "inputs": {
            "newRows": new_count,
            "replayRows": old_count,
            "mixOldRatio": config.mix_old_ratio,
        },
        "outputs": {
            "mixedRows": new_count + len(sampled_old),
            "replayCandidateRows": new_count + len(sampled_old),
            "recentRows": len(sampled_old),
            "curatedRows": len(sampled_old),
        },
    }
    out_report.parent.mkdir(parents=True, exist_ok=True)
    out_report.write_text(json.dumps(report, ensure_ascii=True, indent=2) + "\n", encoding="utf-8")


def build_three_source(
    new_games_raw: dict[str, GameBucket],
    replay_games_raw: dict[str, GameBucket],
    config: CurateConfig,
    rng: random.Random,
    new_path: Path,
    replay_path: Path,
) -> dict[str, Any]:
    filtered_new, new_filter_reasons = filter_games(new_games_raw, config)
    filtered_replay, replay_filter_reasons = filter_games(replay_games_raw, config)

    recent_min_round = max(1, config.current_round - config.replay_recent_rounds + 1)

    recent_games = [
        g for g in filtered_replay
        if g.source_round is not None and g.source_round >= recent_min_round
    ]
    curated_candidates = [
        g for g in filtered_replay
        if (g.source_round is None or g.source_round < recent_min_round)
    ]

    scored_curated = score_games(curated_candidates, config)
    curated_games = choose_with_round_quotas(scored_curated, config, rng)

    replay_candidate_games = []
    replay_candidate_games.extend(recent_games)
    replay_candidate_games.extend(curated_games)

    # Keep replay candidate bounded.
    if len(replay_candidate_games) > config.replay_max_games:
        replay_candidate_games = replay_candidate_games[: config.replay_max_games]

    recent_keys = {g.key for g in recent_games}
    curated_keys = {g.key for g in curated_games}
    replay_candidate_keys = recent_keys | curated_keys

    replay_candidate_rows = collect_rows_for_keys(replay_path, replay_candidate_keys, config.replay_max_rows)
    recent_rows_all = collect_rows_for_keys(replay_path, recent_keys, config.replay_max_rows)
    curated_rows_all = collect_rows_for_keys(replay_path, curated_keys, config.replay_max_rows)

    new_rows_total = count_filtered_rows(new_path)

    target_total = new_rows_total
    target_new = int(round(target_total * (config.mix_new_ratio or 0.0)))
    target_recent = int(round(target_total * (config.mix_recent_ratio or 0.0)))
    target_curated = int(round(target_total * (config.mix_curated_ratio or 0.0)))

    taken_new = reservoir_sample_filtered_rows(new_path, target_new, rng)
    taken_recent = sample_rows(recent_rows_all, target_recent, rng)
    taken_curated = sample_rows(curated_rows_all, target_curated, rng)

    # Minimum guarantees for recent/curated when data is available.
    if target_recent > 0 and not taken_recent and recent_rows_all:
        taken_recent = sample_rows(recent_rows_all, min(target_recent, len(recent_rows_all)), rng)
    if target_curated > 0 and not taken_curated and curated_rows_all:
        taken_curated = sample_rows(curated_rows_all, min(target_curated, len(curated_rows_all)), rng)

    current_total = len(taken_new) + len(taken_recent) + len(taken_curated)
    gap = max(0, target_total - current_total)

    taken_new_set = set(taken_new)
    taken_recent_set = set(taken_recent)
    taken_curated_set = set(taken_curated)

    if gap > 0:
        fill_recent = sample_remaining_rows(recent_rows_all, taken_recent_set, gap, rng)
        taken_recent.extend(fill_recent)
        taken_recent_set.update(fill_recent)
        gap -= len(fill_recent)

    if gap > 0:
        fill_curated = sample_remaining_rows(curated_rows_all, taken_curated_set, gap, rng)
        taken_curated.extend(fill_curated)
        taken_curated_set.update(fill_curated)
        gap -= len(fill_curated)

    mixed_rows = taken_new + taken_recent + taken_curated
    rng.shuffle(mixed_rows)

    mixed_actions = count_actions_from_rows(mixed_rows)
    replay_actions = count_actions_from_rows(replay_candidate_rows)

    ratios_actual = source_ratio({
        "new": taken_new,
        "recent": taken_recent,
        "curated": taken_curated,
    })

    warnings: list[str] = []
    if any(r > config.single_source_ratio_alert for r in ratios_actual.values()):
        warnings.append("single_source_ratio_exceeded")
    l1 = l1_distance(mixed_actions, replay_actions)
    jsd = js_divergence(mixed_actions, replay_actions)
    if l1 > config.shift_alert_threshold:
        warnings.append("action_shift_l1_exceeded")
    recent_round_count = len({g.source_round for g in recent_games if g.source_round is not None})
    min_recent_round_expectation = 2 if config.replay_recent_rounds >= 2 else 1
    if recent_round_count < min_recent_round_expectation:
        warnings.append("recent_coverage_insufficient")

    return {
        "new_filter_reasons": new_filter_reasons,
        "replay_filter_reasons": replay_filter_reasons,
        "filtered_new_games": filtered_new,
        "filtered_replay_games": filtered_replay,
        "recent_games": recent_games,
        "curated_games": curated_games,
        "replay_candidate_rows": replay_candidate_rows,
        "recent_rows": recent_rows_all,
        "curated_rows": curated_rows_all,
        "mixed_rows": mixed_rows,
        "taken_new": taken_new,
        "taken_recent": taken_recent,
        "taken_curated": taken_curated,
        "ratios_actual": ratios_actual,
        "l1_shift": l1,
        "jsd_shift": jsd,
        "recent_round_count": recent_round_count,
        "min_recent_round_expectation": min_recent_round_expectation,
        "warnings": warnings,
    }


def build_three_source_streaming(
    new_games_raw: dict[str, GameBucket],
    replay_games_raw: dict[str, GameBucket],
    config: CurateConfig,
    rng: random.Random,
    new_path: Path,
    replay_path: Path,
    mixed_out: Path,
    replay_candidate_out: Path,
    recent_out: Path,
    curated_out: Path,
) -> dict[str, Any]:
    filtered_new, new_filter_reasons = filter_games(new_games_raw, config)
    filtered_replay, replay_filter_reasons = filter_games(replay_games_raw, config)

    recent_min_round = max(1, config.current_round - config.replay_recent_rounds + 1)
    recent_games = [
        game for game in filtered_replay
        if game.source_round is not None and game.source_round >= recent_min_round
    ]
    curated_candidates = [
        game for game in filtered_replay
        if game.source_round is None or game.source_round < recent_min_round
    ]

    scored_curated = score_games(curated_candidates, config)
    curated_games = choose_with_round_quotas(scored_curated, config, rng)

    replay_candidate_games = []
    replay_candidate_games.extend(recent_games)
    replay_candidate_games.extend(curated_games)
    if len(replay_candidate_games) > config.replay_max_games:
        replay_candidate_games = replay_candidate_games[: config.replay_max_games]

    recent_keys = {game.key for game in recent_games}
    curated_keys = {game.key for game in curated_games}
    replay_candidate_keys = {game.key for game in replay_candidate_games}

    replay_actions = Counter()
    replay_candidate_rows_written = write_rows_for_keys(
        replay_path,
        replay_candidate_keys,
        replay_candidate_out,
        max_rows=config.replay_max_rows,
        action_counts=replay_actions,
    )
    recent_rows_written = write_rows_for_keys(
        replay_path,
        recent_keys,
        recent_out,
        max_rows=config.replay_max_rows,
    )
    curated_rows_written = write_rows_for_keys(
        replay_path,
        curated_keys,
        curated_out,
        max_rows=config.replay_max_rows,
    )

    target_total = total_game_rows(filtered_new)
    target_new = int(round(target_total * (config.mix_new_ratio or 0.0)))
    target_recent = int(round(target_total * (config.mix_recent_ratio or 0.0)))
    target_curated = int(round(target_total * (config.mix_curated_ratio or 0.0)))

    mixed_new_games = select_games_by_row_quota(filtered_new, target_new, rng)
    mixed_new_keys = {game.key for game in mixed_new_games}
    mixed_recent_games = select_games_by_row_quota(recent_games, target_recent, rng)
    mixed_recent_keys = {game.key for game in mixed_recent_games}
    mixed_curated_games = select_games_by_row_quota(curated_games, target_curated, rng)
    mixed_curated_keys = {game.key for game in mixed_curated_games}

    current_rows = total_game_rows(mixed_new_games) + total_game_rows(mixed_recent_games) + total_game_rows(mixed_curated_games)
    gap = max(0, target_total - current_rows)

    if gap > 0:
        fill_new_games = select_games_by_row_quota(filtered_new, gap, rng, mixed_new_keys)
        mixed_new_games.extend(fill_new_games)
        mixed_new_keys.update(game.key for game in fill_new_games)
        gap = max(0, target_total - (total_game_rows(mixed_new_games) + total_game_rows(mixed_recent_games) + total_game_rows(mixed_curated_games)))

    if gap > 0:
        fill_recent_games = select_games_by_row_quota(recent_games, gap, rng, mixed_recent_keys)
        mixed_recent_games.extend(fill_recent_games)
        mixed_recent_keys.update(game.key for game in fill_recent_games)
        gap = max(0, target_total - (total_game_rows(mixed_new_games) + total_game_rows(mixed_recent_games) + total_game_rows(mixed_curated_games)))

    if gap > 0:
        fill_curated_games = select_games_by_row_quota(curated_games, gap, rng, mixed_curated_keys)
        mixed_curated_games.extend(fill_curated_games)
        mixed_curated_keys.update(game.key for game in fill_curated_games)

    estimated_mixed_rows = total_game_rows(mixed_new_games) + total_game_rows(mixed_recent_games) + total_game_rows(mixed_curated_games)
    shard_count = max(1, min(512, math.ceil(max(1, estimated_mixed_rows) / 5000)))
    mixed_actions = Counter()
    mixed_source_counts = {"new": 0, "recent": 0, "curated": 0}

    with tempfile.TemporaryDirectory(prefix="seti-curate-") as temp_dir:
        temp_root = Path(temp_dir)
        shard_paths = [temp_root / f"mixed-{index:04d}.jsonl" for index in range(shard_count)]
        shard_handles = [path.open("w", encoding="utf-8") for path in shard_paths]
        try:
            mixed_source_counts["new"] = stream_rows_to_shards(
                new_path,
                mixed_new_keys,
                shard_handles,
                rng,
                action_counts=mixed_actions,
            )
            mixed_source_counts["recent"] = stream_rows_to_shards(
                replay_path,
                mixed_recent_keys,
                shard_handles,
                rng,
                action_counts=mixed_actions,
            )
            mixed_source_counts["curated"] = stream_rows_to_shards(
                replay_path,
                mixed_curated_keys,
                shard_handles,
                rng,
                action_counts=mixed_actions,
            )
        finally:
            for handle in shard_handles:
                handle.close()
        mixed_rows_written = shuffle_shards_to_output(shard_paths, mixed_out, rng)

    total_mixed = sum(mixed_source_counts.values())
    ratios_actual = {
        key: (value / total_mixed if total_mixed > 0 else 0.0)
        for key, value in mixed_source_counts.items()
    }

    warnings: list[str] = []
    if any(ratio > config.single_source_ratio_alert for ratio in ratios_actual.values()):
        warnings.append("single_source_ratio_exceeded")
    l1 = l1_distance(mixed_actions, replay_actions)
    jsd = js_divergence(mixed_actions, replay_actions)
    if l1 > config.shift_alert_threshold:
        warnings.append("action_shift_l1_exceeded")
    recent_round_count = len({game.source_round for game in recent_games if game.source_round is not None})
    min_recent_round_expectation = 2 if config.replay_recent_rounds >= 2 else 1
    if recent_round_count < min_recent_round_expectation:
        warnings.append("recent_coverage_insufficient")

    return {
        "new_filter_reasons": new_filter_reasons,
        "replay_filter_reasons": replay_filter_reasons,
        "filtered_new_games": filtered_new,
        "filtered_replay_games": filtered_replay,
        "recent_games": recent_games,
        "curated_games": curated_games,
        "ratios_actual": ratios_actual,
        "l1_shift": l1,
        "jsd_shift": jsd,
        "recent_round_count": recent_round_count,
        "min_recent_round_expectation": min_recent_round_expectation,
        "warnings": warnings,
        "outputs": {
            "mixedRows": mixed_rows_written,
            "replayCandidateRows": replay_candidate_rows_written,
            "recentWindowRows": recent_rows_written,
            "curatedPoolRows": curated_rows_written,
            "taken": mixed_source_counts,
        },
    }


def main() -> None:
    args = parse_args()

    config = CurateConfig(
        current_round=max(1, args.current_round),
        max_steps=max(1, args.max_steps),
        max_pass_ratio=max(0.0, min(1.0, args.max_pass_ratio)),
        replay_max_rows=max(1, args.replay_max_rows),
        replay_max_games=max(1, args.replay_max_games),
        replay_max_games_per_round=max(1, args.replay_max_games_per_round),
        replay_anchor_games_per_round=max(0, args.replay_anchor_games_per_round),
        replay_recent_rounds=max(1, args.replay_recent_rounds),
        replay_age_half_life_rounds=max(0.0001, args.replay_age_half_life_rounds),
        shift_alert_threshold=max(0.0, args.shift_alert_threshold),
        single_source_ratio_alert=max(0.0, min(1.0, args.single_source_ratio_alert)),
        mix_new_ratio=args.mix_new_ratio,
        mix_recent_ratio=args.mix_recent_ratio,
        mix_curated_ratio=args.mix_curated_ratio,
        mix_old_ratio=max(0.0, args.mix_old_ratio),
        seed=args.seed,
    )

    new_path = Path(args.new_dataset)
    replay_path = Path(args.replay_dataset)
    mixed_out = Path(args.mixed_out)
    replay_candidate_out = Path(args.replay_candidate_out)
    recent_out = Path(args.recent_window_out)
    curated_out = Path(args.curated_pool_out)
    report_out = Path(args.report_out)

    new_rows_count = count_jsonl_rows(new_path)
    replay_rows_count = count_jsonl_rows(replay_path)

    new_schema_stats = schema_stats(new_path)
    replay_schema_stats = schema_stats(replay_path)
    schema_filter = {
        "requiredSchemaVersion": REQUIRED_SCHEMA_VERSION,
        "new": new_schema_stats,
        "replay": replay_schema_stats,
    }

    using_three_source = all(
        value is not None for value in (config.mix_new_ratio, config.mix_recent_ratio, config.mix_curated_ratio)
    )

    if using_three_source:
        ratio_sum = (config.mix_new_ratio or 0.0) + (config.mix_recent_ratio or 0.0) + (config.mix_curated_ratio or 0.0)
        if abs(ratio_sum - 1.0) > 1e-6:
            raise SystemExit(f"Three-source ratios must sum to 1.0, got {ratio_sum}")

        rng = random.Random(config.seed)
        new_games_raw = build_buckets(new_path, source="new")
        replay_games_raw = build_buckets(replay_path, source="replay")

        result = build_three_source_streaming(
            new_games_raw,
            replay_games_raw,
            config,
            rng,
            new_path,
            replay_path,
            mixed_out,
            replay_candidate_out,
            recent_out,
            curated_out,
        )

        report = {
            "mode": "three-source",
            "schema": schema_filter,
            "inputs": {
                "newRows": new_rows_count,
                "replayRows": replay_rows_count,
                "newGamesRaw": len(new_games_raw),
                "replayGamesRaw": len(replay_games_raw),
                "currentRound": config.current_round,
                "recentMinRound": max(1, config.current_round - config.replay_recent_rounds + 1),
            },
            "filters": {
                "new": {
                    "keptGames": len(result["filtered_new_games"]),
                    "reasons": result["new_filter_reasons"],
                },
                "replay": {
                    "keptGames": len(result["filtered_replay_games"]),
                    "reasons": result["replay_filter_reasons"],
                },
            },
            "pools": {
                "recentGames": len(result["recent_games"]),
                "curatedGames": len(result["curated_games"]),
                "recentRounds": source_round_hist(result["recent_games"]),
                "curatedRounds": source_round_hist(result["curated_games"]),
            },
            "ratios": {
                "target": {
                    "new": config.mix_new_ratio,
                    "recent": config.mix_recent_ratio,
                    "curated": config.mix_curated_ratio,
                },
                "actual": result["ratios_actual"],
            },
            "outputs": {
                **result["outputs"],
            },
            "shift": {
                "l1": result["l1_shift"],
                "jsd": result["jsd_shift"],
                "threshold": config.shift_alert_threshold,
            },
            "coverage": {
                "recentRoundCount": result["recent_round_count"],
                "recentRoundMinExpectation": result["min_recent_round_expectation"],
            },
            "alerts": result["warnings"],
        }

        report_out.parent.mkdir(parents=True, exist_ok=True)
        report_out.write_text(json.dumps(report, ensure_ascii=True, indent=2) + "\n", encoding="utf-8")

        print(
            "mode=three-source "
            f"mixed_rows={result['outputs']['mixedRows']} "
            f"replay_candidate_rows={result['outputs']['replayCandidateRows']} "
            f"ratios_actual={json.dumps(result['ratios_actual'], ensure_ascii=True)}"
        )
        return

    run_legacy_mode(
        new_path=new_path,
        old_path=replay_path,
        schema_filter=schema_filter,
        config=config,
        out_mixed=mixed_out,
        out_replay_candidate=replay_candidate_out,
        out_recent=recent_out,
        out_curated=curated_out,
        out_report=report_out,
    )
    print(
        "mode=legacy "
        f"mixed_rows={new_rows_count}+old_ratio({config.mix_old_ratio})"
    )


if __name__ == "__main__":
    main()
