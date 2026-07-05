#!/usr/bin/env python3
"""Schema-v3 entity observation encoder utilities.

This module is intentionally streaming-friendly for 16GB environments.
It provides:
- JSONL streaming helpers
- Vocabulary collection
- Deterministic split assignment
- Truncation-aware record encoding
"""

from __future__ import annotations

from dataclasses import dataclass
import hashlib
import json
import math
from pathlib import Path
from typing import Any, Iterable, Iterator

SCHEMA_VERSION = 3
OBSERVATION_ENVELOPE_VERSION = 2


@dataclass
class EncoderConfig:
    max_state_entities: int = 192
    max_candidate_actions: int = 40
    numeric_dim: int = 24


@dataclass
class EncoderStats:
    seen_samples: int = 0
    wrong_schema_samples: int = 0
    wrong_envelope_samples: int = 0
    missing_observation_samples: int = 0
    missing_compact_entities_samples: int = 0
    missing_target_samples: int = 0
    target_missing_from_candidates: int = 0
    dropped_by_state_truncation: int = 0
    dropped_by_candidate_truncation: int = 0
    encoded_samples: int = 0
    state_truncation_count: int = 0
    candidate_truncation_count: int = 0


@dataclass
class Vocab:
    entity_type_vocab: list[str]
    owner_vocab: list[str]
    zone_vocab: list[str]
    slot_vocab: list[str]
    action_vocab: list[str]


def numeric(value: Any, fallback: float = 0.0) -> float:
    try:
        number = float(value)
    except (TypeError, ValueError):
        return fallback
    if math.isnan(number) or math.isinf(number):
        return fallback
    return number


def clamp(value: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, value))


def iter_jsonl(path: Path) -> Iterator[dict[str, Any]]:
    if not path.exists():
        return
    with path.open("r", encoding="utf-8") as handle:
        for raw in handle:
            line = raw.strip()
            if not line:
                continue
            try:
                payload = json.loads(line)
            except json.JSONDecodeError:
                continue
            if isinstance(payload, dict):
                yield payload


def hash_to_unit_float(text: str) -> float:
    digest = hashlib.sha256(text.encode("utf-8")).digest()
    return int.from_bytes(digest[:8], "big") / float(2**64 - 1)


def should_use_validation(record_id: str, seed: str, validation_ratio: float) -> bool:
    ratio = max(0.0, min(0.5, validation_ratio))
    if ratio <= 0:
        return False
    return hash_to_unit_float(f"{seed}:{record_id}") < ratio


def parse_action_id(sample: dict[str, Any]) -> str:
    policy_target_v2 = sample.get("policyTargetV2") if isinstance(sample.get("policyTargetV2"), dict) else {}
    policy_target = sample.get("policyTarget") if isinstance(sample.get("policyTarget"), dict) else {}
    return str(policy_target_v2.get("id") or policy_target.get("id") or "").strip()


def normalize_candidate_ids(candidates: list[dict[str, Any]]) -> list[str]:
    ids: list[str] = []
    for candidate in candidates or []:
        if not isinstance(candidate, dict):
            continue
        if candidate.get("available") is False:
            continue
        action_id = str(candidate.get("id") or candidate.get("actionId") or "").strip()
        if action_id:
            ids.append(action_id)
    ids.sort()
    return ids


def parse_visit_distribution(sample: dict[str, Any]) -> dict[str, float] | None:
    details = sample.get("details") if isinstance(sample.get("details"), dict) else {}
    action_details = details.get("action") if isinstance(details, dict) else {}
    decision_plan = action_details.get("decisionPlan") if isinstance(action_details, dict) else {}
    mcts = decision_plan.get("mcts") if isinstance(decision_plan, dict) else None
    policy_entries = mcts.get("policy") if isinstance(mcts, dict) else None
    if not isinstance(policy_entries, list):
        return None

    visits_by_action: dict[str, float] = {}
    total = 0.0
    for entry in policy_entries:
        if not isinstance(entry, dict):
            continue
        action_id = str(entry.get("actionId") or "").strip()
        visits = max(0.0, numeric(entry.get("visits"), 0.0))
        if not action_id or visits <= 0:
            continue
        visits_by_action[action_id] = visits_by_action.get(action_id, 0.0) + visits
        total += visits
    if total <= 0:
        return None
    return {k: v / total for k, v in visits_by_action.items()}


def entity_priority(entity: dict[str, Any], current_player_id: str | None) -> tuple[int, int, int, int]:
    entity_type = str(entity.get("type") or "UNKNOWN").upper()
    zone = str(entity.get("zone") or "global").lower()
    flags = entity.get("flags") if isinstance(entity.get("flags"), dict) else {}
    numeric_obj = entity.get("numeric") if isinstance(entity.get("numeric"), dict) else {}

    if entity_type == "GLOBAL":
        p0 = 0
    elif entity_type == "PLAYER":
        p0 = 1
    elif entity_type == "ACTION":
        p0 = 2
    elif entity_type == "ROCKET" and str(entity.get("ownerId") or "") == str(current_player_id or ""):
        p0 = 3
    else:
        p0 = 4

    p1 = 0 if bool(flags.get("isCurrentPlayer")) else 1
    p2 = 0 if bool(flags.get("candidateAvailable")) else 1
    p3 = int(abs(numeric(numeric_obj.get("score"), 0.0)) + abs(numeric(numeric_obj.get("net"), 0.0)))
    return (p0, p1, p2, -p3 if zone == "actions" else p3)


def _entity_type_key(entity: dict[str, Any]) -> str:
    return str(entity.get("type") or "UNKNOWN").strip().upper() or "UNKNOWN"


def _owner_key(entity: dict[str, Any]) -> str:
    return str(entity.get("ownerId") or "NONE").strip() or "NONE"


def _zone_key(entity: dict[str, Any]) -> str:
    return str(entity.get("zone") or "global").strip().lower() or "global"


def _slot_key(entity: dict[str, Any]) -> str:
    return str(entity.get("slotId") or "none").strip() or "none"


def collect_vocab(
    input_path: Path,
    *,
    max_samples: int,
    schema_version: int = SCHEMA_VERSION,
) -> tuple[Vocab, dict[str, Any]]:
    entity_types: set[str] = set()
    owners: set[str] = set()
    zones: set[str] = set()
    slots: set[str] = set()
    actions: set[str] = set()
    seen = 0
    wrong_schema = 0
    wrong_envelope = 0
    missing_obs = 0

    for sample in iter_jsonl(input_path):
        if seen >= max(1, max_samples):
            break
        seen += 1

        if int(sample.get("schemaVersion") or 0) != schema_version:
            wrong_schema += 1
            continue

        env = sample.get("observationEnvelope") if isinstance(sample.get("observationEnvelope"), dict) else None
        if int((env or {}).get("version") or 0) != OBSERVATION_ENVELOPE_VERSION:
            wrong_envelope += 1
            continue

        obs = env.get("observation") if isinstance(env, dict) else None
        entities = obs.get("compactEntities") if isinstance(obs, dict) and isinstance(obs.get("compactEntities"), list) else None
        if not entities:
            missing_obs += 1
            continue

        for entity in entities:
            if not isinstance(entity, dict):
                continue
            entity_types.add(_entity_type_key(entity))
            owners.add(_owner_key(entity))
            zones.add(_zone_key(entity))
            slots.add(_slot_key(entity))

        candidates = sample.get("candidates") if isinstance(sample.get("candidates"), list) else []
        for action_id in normalize_candidate_ids(candidates):
            actions.add(action_id)
        target_action = parse_action_id(sample)
        if target_action:
            actions.add(target_action)

    vocab = Vocab(
        entity_type_vocab=sorted(entity_types),
        owner_vocab=sorted(owners),
        zone_vocab=sorted(zones),
        slot_vocab=sorted(slots),
        action_vocab=sorted(actions),
    )
    summary = {
        "seenSamples": seen,
        "wrongSchemaSamples": wrong_schema,
        "wrongEnvelopeVersionSamples": wrong_envelope,
        "missingObservationSamples": missing_obs,
    }
    return vocab, summary


def index_map(values: list[str]) -> dict[str, int]:
    return {value: index for index, value in enumerate(values)}


def build_numeric_vector(entity: dict[str, Any], *, numeric_dim: int) -> list[float]:
    numeric_obj = entity.get("numeric") if isinstance(entity.get("numeric"), dict) else {}
    flags_obj = entity.get("flags") if isinstance(entity.get("flags"), dict) else {}
    position = entity.get("position") if isinstance(entity.get("position"), dict) else {}

    vector = [0.0 for _ in range(max(4, numeric_dim))]
    cursor = 0

    for key in sorted(numeric_obj.keys()):
        if cursor >= len(vector):
            break
        vector[cursor] = clamp(numeric(numeric_obj.get(key), 0.0), -100.0, 100.0)
        cursor += 1

    for key in sorted(flags_obj.keys()):
        if cursor >= len(vector):
            break
        value = flags_obj.get(key)
        if isinstance(value, str):
            value_l = value.lower()
            vector[cursor] = 1.0 if value_l in ("true", "yes", "self", "next", "opponent") else 0.0
        else:
            vector[cursor] = 1.0 if bool(value) else 0.0
        cursor += 1

    if len(vector) >= 2:
        vector[-2] = clamp(numeric(position.get("ring"), 0.0), -16.0, 16.0)
        vector[-1] = clamp(numeric(position.get("sector"), 0.0), -16.0, 16.0)

    return vector


def _prepare_base_record(sample: dict[str, Any], stats: EncoderStats) -> dict[str, Any] | None:
    stats.seen_samples += 1

    if int(sample.get("schemaVersion") or 0) != SCHEMA_VERSION:
        stats.wrong_schema_samples += 1
        return None

    env = sample.get("observationEnvelope") if isinstance(sample.get("observationEnvelope"), dict) else None
    if int((env or {}).get("version") or 0) != OBSERVATION_ENVELOPE_VERSION:
        stats.wrong_envelope_samples += 1
        return None

    obs = env.get("observation") if isinstance(env, dict) else None
    entities = obs.get("compactEntities") if isinstance(obs, dict) and isinstance(obs.get("compactEntities"), list) else None
    if entities is None:
        stats.missing_observation_samples += 1
        return None
    if not entities:
        stats.missing_compact_entities_samples += 1
        return None

    candidates_raw = sample.get("candidates") if isinstance(sample.get("candidates"), list) else []
    candidate_ids = normalize_candidate_ids(candidates_raw)
    target_action_id = parse_action_id(sample)
    if not target_action_id:
        stats.missing_target_samples += 1
        return None
    if target_action_id not in candidate_ids:
        stats.target_missing_from_candidates += 1
        return None

    final_score = numeric(sample.get("finalScore"), 0.0)
    final_rank = numeric(sample.get("finalRank"), 0.0)
    score_label = clamp(final_score / 100.0, -1.5, 1.5)
    rank_penalty = clamp(final_rank / 6.0, 0.0, 1.0)
    value_target = clamp(score_label - rank_penalty, -1.0, 1.0)

    record_id = str(sample.get("sampleId") or f"record-{stats.seen_samples}")
    current_player_id = str(((obs or {}).get("globalFeatures") or {}).get("currentPlayerId") or "")

    return {
        "recordId": record_id,
        "entities": entities,
        "candidateIds": candidate_ids,
        "targetActionId": target_action_id,
        "visitDistribution": parse_visit_distribution(sample),
        "valueTarget": value_target,
        "sampleWeight": 1.0,
        "currentPlayerId": current_player_id,
    }


def encode_stream(
    input_path: Path,
    *,
    vocab: Vocab,
    config: EncoderConfig,
    seed: str,
    validation_ratio: float,
    split: str,
    max_samples: int,
    stats: EncoderStats | None = None,
) -> Iterator[dict[str, Any]]:
    if split not in ("train", "validation"):
        raise ValueError(f"Unknown split: {split}")

    stats_ref = stats if stats is not None else EncoderStats()
    entity_type_to_index = index_map(vocab.entity_type_vocab)
    owner_to_index = index_map(vocab.owner_vocab)
    zone_to_index = index_map(vocab.zone_vocab)
    slot_to_index = index_map(vocab.slot_vocab)
    action_to_index = index_map(vocab.action_vocab)

    for sample in iter_jsonl(input_path):
        if stats_ref.seen_samples >= max(1, max_samples):
            break

        base = _prepare_base_record(sample, stats_ref)
        if base is None:
            continue

        use_validation = should_use_validation(base["recordId"], seed, validation_ratio)
        if split == "train" and use_validation:
            continue
        if split == "validation" and not use_validation:
            continue

        entities = [e for e in base["entities"] if isinstance(e, dict)]
        entities.sort(key=lambda e: entity_priority(e, base.get("currentPlayerId")))

        if len(entities) > config.max_state_entities:
            stats_ref.state_truncation_count += 1
            entities = entities[: config.max_state_entities]

        candidate_ids = [cid for cid in base["candidateIds"] if cid in action_to_index]
        if len(candidate_ids) > config.max_candidate_actions:
            stats_ref.candidate_truncation_count += 1
            candidate_ids = candidate_ids[: config.max_candidate_actions]

        target_action_id = base["targetActionId"]
        if target_action_id not in action_to_index:
            stats_ref.missing_target_samples += 1
            continue
        if target_action_id not in candidate_ids:
            stats_ref.dropped_by_candidate_truncation += 1
            continue

        type_ids: list[int] = []
        owner_ids: list[int] = []
        zone_ids: list[int] = []
        slot_ids: list[int] = []
        numeric_features: list[list[float]] = []
        entity_mask: list[float] = []

        for entity in entities:
            type_ids.append(entity_type_to_index.get(_entity_type_key(entity), 0))
            owner_ids.append(owner_to_index.get(_owner_key(entity), 0))
            zone_ids.append(zone_to_index.get(_zone_key(entity), 0))
            slot_ids.append(slot_to_index.get(_slot_key(entity), 0))
            numeric_features.append(build_numeric_vector(entity, numeric_dim=config.numeric_dim))
            entity_mask.append(1.0)

        while len(type_ids) < config.max_state_entities:
            type_ids.append(0)
            owner_ids.append(0)
            zone_ids.append(0)
            slot_ids.append(0)
            numeric_features.append([0.0 for _ in range(max(4, config.numeric_dim))])
            entity_mask.append(0.0)

        candidate_action_indexes = [action_to_index[cid] for cid in candidate_ids]
        candidate_mask = [1.0 for _ in candidate_action_indexes]
        while len(candidate_action_indexes) < config.max_candidate_actions:
            candidate_action_indexes.append(0)
            candidate_mask.append(0.0)

        visit_target = [0.0 for _ in range(config.max_candidate_actions)]
        visit_dist = base["visitDistribution"] if isinstance(base.get("visitDistribution"), dict) else None
        if visit_dist:
            total = 0.0
            for idx, action_id in enumerate(candidate_ids):
                weight = max(0.0, numeric(visit_dist.get(action_id), 0.0))
                visit_target[idx] = weight
                total += weight
            if total > 0:
                visit_target = [w / total for w in visit_target]

        stats_ref.encoded_samples += 1
        yield {
            "recordId": base["recordId"],
            "entityTypeIds": type_ids,
            "ownerIds": owner_ids,
            "zoneIds": zone_ids,
            "slotIds": slot_ids,
            "numericFeatures": numeric_features,
            "entityMask": entity_mask,
            "candidateActionIndexes": candidate_action_indexes,
            "candidateMask": candidate_mask,
            "actionTokenIndexes": list(candidate_action_indexes),
            "targetActionIndex": action_to_index[target_action_id],
            "targetCandidateIndex": candidate_ids.index(target_action_id),
            "visitTarget": visit_target,
            "valueTarget": float(base["valueTarget"]),
            "sampleWeight": float(base["sampleWeight"]),
            "targetActionId": target_action_id,
        }


def build_ingest_summary(stats: EncoderStats) -> dict[str, Any]:
    return {
        "seenSamples": stats.seen_samples,
        "wrongSchemaSamples": stats.wrong_schema_samples,
        "wrongEnvelopeVersionSamples": stats.wrong_envelope_samples,
        "missingObservationSamples": stats.missing_observation_samples,
        "missingCompactEntitiesSamples": stats.missing_compact_entities_samples,
        "missingTargetSamples": stats.missing_target_samples,
        "targetMissingFromCandidates": stats.target_missing_from_candidates,
        "droppedByStateTruncation": stats.dropped_by_state_truncation,
        "droppedByCandidateTruncation": stats.dropped_by_candidate_truncation,
        "encodedSamples": stats.encoded_samples,
        "stateTruncationCount": stats.state_truncation_count,
        "candidateTruncationCount": stats.candidate_truncation_count,
    }
