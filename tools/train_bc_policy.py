#!/usr/bin/env python3
"""PyTorch tiny-resnet behavior cloning trainer for SETI AI turn-action samples."""

from __future__ import annotations

import argparse
import hashlib
import json
import math
import random
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable, Iterator

import torch
import torch.nn.functional as F


LINEAR_FALLBACK_MODEL_TYPE = "pytorch-linear-v1"
TINY_RESNET_MODEL_TYPE = "pytorch-tiny-resnet-v1"


def numeric(value: Any, fallback: float = 0.0) -> float:
    try:
        number = float(value)
    except (TypeError, ValueError):
        return fallback
    if number != number or number in (float("inf"), float("-inf")):
        return fallback
    return number


def clamp(value: float, min_value: float, max_value: float) -> float:
    return max(min_value, min(max_value, value))


def format_duration(seconds: float) -> str:
    total_seconds = max(0, int(round(seconds)))
    hours, remainder = divmod(total_seconds, 3600)
    minutes, seconds = divmod(remainder, 60)
    if hours > 0:
        return f"{hours}h{minutes:02d}m{seconds:02d}s"
    if minutes > 0:
        return f"{minutes}m{seconds:02d}s"
    return f"{seconds}s"


def set_global_seed(seed_text: str) -> int:
    digest = hashlib.sha256(seed_text.encode("utf-8")).digest()
    seed_value = int.from_bytes(digest[:8], "big") % (2**31)
    random.seed(seed_value)
    torch.manual_seed(seed_value)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed_value)
    return seed_value


def normalize_candidate_ids(candidates: Iterable[dict]) -> list[str]:
    ids: list[str] = []
    for candidate in candidates or []:
        if not isinstance(candidate, dict):
            continue
        if candidate.get("available") is False:
            continue
        action_id = str(candidate.get("id") or candidate.get("actionId") or "").strip()
        if not action_id:
            continue
        ids.append(action_id)
    ids.sort()
    return ids


def iter_samples(path: Path) -> Iterator[dict]:
    if not path.exists():
        return

    preview: list[str] = []
    with path.open("r", encoding="utf-8") as handle:
        for raw in handle:
            line = raw.strip()
            if not line:
                continue
            preview.append(line)
            if len(preview) >= 2:
                break

    if not preview:
        return

    first_line = preview[0]
    if first_line.startswith("["):
        text = path.read_text(encoding="utf-8").strip()
        if not text:
            return
        parsed = json.loads(text)
        if isinstance(parsed, list):
            for entry in parsed:
                if isinstance(entry, dict):
                    yield entry
        return

    if first_line.startswith("{"):
        first_obj: dict[str, Any] | None = None
        second_obj: dict[str, Any] | None = None
        try:
            parsed_first = json.loads(first_line)
            if isinstance(parsed_first, dict):
                first_obj = parsed_first
        except json.JSONDecodeError:
            first_obj = None

        if len(preview) >= 2:
            try:
                parsed_second = json.loads(preview[1])
                if isinstance(parsed_second, dict):
                    second_obj = parsed_second
            except json.JSONDecodeError:
                second_obj = None

        if first_obj is not None and second_obj is not None:
            with path.open("r", encoding="utf-8") as handle:
                for raw in handle:
                    line = raw.strip()
                    if not line:
                        continue
                    payload = json.loads(line)
                    if isinstance(payload, dict):
                        yield payload
            return

        if first_obj is not None and "samples" not in first_obj:
            yield first_obj
            return

        text = path.read_text(encoding="utf-8").strip()
        if not text:
            return
        parsed = json.loads(text)
        if isinstance(parsed, dict):
            samples = parsed.get("samples")
            if isinstance(samples, list):
                for entry in samples:
                    if isinstance(entry, dict):
                        yield entry
        return

    with path.open("r", encoding="utf-8") as handle:
        for raw in handle:
            line = raw.strip()
            if not line:
                continue
            payload = json.loads(line)
            if isinstance(payload, dict):
                yield payload


def split_records(records: list[dict], validation_ratio: float, seed: str) -> tuple[list[dict], list[dict]]:
    train: list[dict] = []
    valid: list[dict] = []
    ratio = max(0.0, min(0.5, validation_ratio))
    if ratio <= 0:
        return records, valid

    for record in records:
        digest = hashlib.sha256(f"{seed}:{record['recordId']}".encode("utf-8")).digest()
        value = int.from_bytes(digest[:4], "big") / 4294967295
        if value < ratio:
            valid.append(record)
        else:
            train.append(record)
    return train, valid


def hash_to_unit_float(text: str) -> float:
    digest = hashlib.sha256(text.encode("utf-8")).digest()
    return int.from_bytes(digest[:8], "big") / float(2**64 - 1)


def parse_action_set(csv_value: str) -> set[str]:
    return {
        token.strip()
        for token in str(csv_value or "").split(",")
        if token and token.strip()
    }


def apply_frequency_balancing(
    train_records: list[dict],
    *,
    seed: str,
    downsample_power: float,
    min_keep_prob: float,
    low_freq_weight_alpha: float,
    critical_actions: set[str],
    critical_action_boost: float,
) -> tuple[list[dict], dict]:
    if not train_records:
        return [], {
            "initialTrainRecords": 0,
            "balancedTrainRecords": 0,
        }

    action_counts: dict[str, int] = {}
    for record in train_records:
        action_id = str(record.get("targetActionId") or "")
        if not action_id:
            continue
        action_counts[action_id] = action_counts.get(action_id, 0) + 1

    non_zero_counts = [count for count in action_counts.values() if count > 0]
    min_count = min(non_zero_counts) if non_zero_counts else 1

    kept_records: list[dict] = []
    dropped = 0
    weights: list[float] = []

    for record in train_records:
        action_id = str(record.get("targetActionId") or "")
        count = max(1, action_counts.get(action_id, 1))
        keep_prob = 1.0
        if downsample_power > 0:
            keep_prob = max(min_keep_prob, (min_count / count) ** downsample_power)

        keep_draw = hash_to_unit_float(f"{seed}:downsample:{record.get('recordId')}")
        if keep_draw > keep_prob:
            dropped += 1
            continue

        sample_weight = 1.0
        if low_freq_weight_alpha > 0:
            sample_weight *= (min_count / count) ** low_freq_weight_alpha
        if action_id in critical_actions:
            sample_weight *= max(1.0, critical_action_boost)

        kept = {**record, "sampleWeight": float(sample_weight)}
        kept_records.append(kept)
        weights.append(float(sample_weight))

    return kept_records, {
        "initialTrainRecords": len(train_records),
        "balancedTrainRecords": len(kept_records),
        "droppedTrainRecords": dropped,
        "retentionRatio": (len(kept_records) / len(train_records)) if train_records else 0.0,
        "downsamplePower": float(max(0.0, downsample_power)),
        "minKeepProb": float(max(0.0, min(1.0, min_keep_prob))),
        "lowFreqWeightAlpha": float(max(0.0, low_freq_weight_alpha)),
        "criticalActions": sorted(critical_actions),
        "criticalActionBoost": float(max(1.0, critical_action_boost)),
        "avgSampleWeight": (sum(weights) / len(weights)) if weights else 0.0,
        "maxSampleWeight": max(weights) if weights else 0.0,
        "minSampleWeight": min(weights) if weights else 0.0,
        "actionCountsBeforeBalancing": action_counts,
    }


def extract_records(samples: Iterable[dict], round_bucket_size: int) -> list[dict]:
    records: list[dict] = []
    for index, sample in enumerate(samples):
        if not isinstance(sample, dict):
            continue
        target_action = sample.get("policyTarget") or {}
        target_action_id = str(target_action.get("id") or "").strip()
        if sample.get("logType") != "turn-action" or not target_action_id:
            continue
        candidate_ids = normalize_candidate_ids(sample.get("candidates") or [])
        if not candidate_ids or target_action_id not in candidate_ids:
            continue

        final_score = numeric(sample.get("finalScore"), 0)
        final_rank = numeric(sample.get("finalRank"), 0)
        score_label = clamp(final_score / 100.0, -1.5, 1.5)
        rank_penalty = clamp(final_rank / 6.0, 0.0, 1.0)
        value_target = clamp(score_label - rank_penalty, -1.0, 1.0)

        visit_distribution = None
        details = sample.get("details") if isinstance(sample.get("details"), dict) else {}
        action_details = details.get("action") if isinstance(details, dict) else {}
        decision_plan = action_details.get("decisionPlan") if isinstance(action_details, dict) else {}
        mcts_result = decision_plan.get("mcts") if isinstance(decision_plan, dict) else None
        policy_entries = mcts_result.get("policy") if isinstance(mcts_result, dict) else None
        if isinstance(policy_entries, list):
            visit_pairs: list[tuple[str, float]] = []
            total_visits = 0.0
            for entry in policy_entries:
                if not isinstance(entry, dict):
                    continue
                action_id = str(entry.get("actionId") or "").strip()
                visits = max(0.0, numeric(entry.get("visits"), 0.0))
                if not action_id or visits <= 0:
                    continue
                visit_pairs.append((action_id, visits))
                total_visits += visits
            if total_visits > 0 and visit_pairs:
                visit_distribution = {
                    action_id: visits / total_visits
                    for action_id, visits in visit_pairs
                }

        records.append(
            {
                "recordId": sample.get("sampleId") or f"record-{index+1}",
                "targetActionId": target_action_id,
                "candidateIds": candidate_ids,
                "roundNumber": int(max(0, round(numeric(sample.get("roundNumber"), 0)))),
                "turnNumber": int(max(0, round(numeric(sample.get("turnNumber"), 0)))),
                "finalScore": final_score,
                "finalRank": final_rank,
                "valueTarget": value_target,
                "visitDistribution": visit_distribution,
            }
        )
    return records


def build_vocab(records: list[dict], round_bucket_size: int) -> dict:
    action_ids: set[str] = set()
    candidate_ids: set[str] = set()
    max_round_bucket = 0
    action_counts: dict[str, int] = {}

    for record in records:
        target = str(record.get("targetActionId") or "")
        if target:
            action_ids.add(target)
            action_counts[target] = action_counts.get(target, 0) + 1
        for candidate in record.get("candidateIds") or []:
            candidate_ids.add(candidate)
            action_ids.add(candidate)
        round_number = int(max(0, round(numeric(record.get("roundNumber"), 0))))
        max_round_bucket = max(max_round_bucket, round_number // max(1, round_bucket_size))

    action_vocab = sorted(action_ids)
    candidate_vocab = sorted(candidate_ids)
    return {
        "actionVocab": action_vocab,
        "candidateVocab": candidate_vocab,
        "actionToIndex": {action_id: index for index, action_id in enumerate(action_vocab)},
        "candidateToIndex": {candidate_id: index for index, candidate_id in enumerate(candidate_vocab)},
        "roundBucketCount": max(1, max_round_bucket + 1),
        "actionCounts": action_counts,
    }


def encode_records(records: list[dict], vocab: dict, round_bucket_size: int) -> list[dict]:
    encoded: list[dict] = []
    action_to_index = vocab["actionToIndex"]
    candidate_to_index = vocab["candidateToIndex"]

    for record in records:
        target_action_id = record.get("targetActionId")
        if target_action_id not in action_to_index:
            continue
        round_number = int(max(0, round(numeric(record.get("roundNumber"), 0))))
        round_bucket = min(vocab["roundBucketCount"] - 1, round_number // max(1, round_bucket_size))

        candidate_ids = list(record.get("candidateIds") or [])
        candidate_feature_indexes = [candidate_to_index[cid] for cid in candidate_ids if cid in candidate_to_index]
        allowed_action_indexes = [action_to_index[cid] for cid in candidate_ids if cid in action_to_index]
        target_index = action_to_index[target_action_id]
        if not allowed_action_indexes or target_index not in allowed_action_indexes:
            continue

        visit_distribution = record.get("visitDistribution") if isinstance(record.get("visitDistribution"), dict) else None
        visit_target_indexes: list[int] = []
        visit_target_weights: list[float] = []
        if visit_distribution:
            for action_id, weight in visit_distribution.items():
                if action_id not in action_to_index:
                    continue
                normalized_weight = max(0.0, float(weight))
                if normalized_weight <= 0:
                    continue
                visit_target_indexes.append(action_to_index[action_id])
                visit_target_weights.append(normalized_weight)

        encoded.append(
            {
                "recordId": record.get("recordId"),
                "targetActionId": target_action_id,
                "targetIndex": target_index,
                "roundBucket": round_bucket,
                "roundNumber": round_number,
                "turnNumber": int(max(0, round(numeric(record.get("turnNumber"), 0)))),
                "candidateFeatureIndexes": candidate_feature_indexes,
                "allowedActionIndexes": allowed_action_indexes,
                "sampleWeight": float(record.get("sampleWeight", 1.0)),
                "valueTarget": float(record.get("valueTarget", 0.0)),
                "visitTargetIndexes": visit_target_indexes,
                "visitTargetWeights": visit_target_weights,
            }
        )
    return encoded


def build_input_vector(sample: dict, candidate_count: int, round_bucket_count: int, device: torch.device) -> torch.Tensor:
    vector = torch.zeros(candidate_count + round_bucket_count + 4, dtype=torch.float32, device=device)
    for idx in sample.get("candidateFeatureIndexes", []) or []:
        if 0 <= idx < candidate_count:
            vector[idx] += 1.0
    round_bucket = int(sample.get("roundBucket", 0))
    if 0 <= round_bucket < round_bucket_count:
        vector[candidate_count + round_bucket] = 1.0
    allowed = sample.get("allowedActionIndexes", []) or []
    vector[candidate_count + round_bucket_count + 0] = len(allowed) / 32.0
    vector[candidate_count + round_bucket_count + 1] = len(sample.get("candidateFeatureIndexes", []) or []) / 32.0
    vector[candidate_count + round_bucket_count + 2] = int(max(0, round(numeric(sample.get("roundNumber"), 0)))) / 10.0
    vector[candidate_count + round_bucket_count + 3] = int(max(0, round(numeric(sample.get("turnNumber"), 0)))) / 120.0
    return vector


class TinyResidualBlock(torch.nn.Module):
    def __init__(self, channels: int, dropout: float) -> None:
        super().__init__()
        self.norm1 = torch.nn.LayerNorm(channels)
        self.fc1 = torch.nn.Linear(channels, channels)
        self.norm2 = torch.nn.LayerNorm(channels)
        self.fc2 = torch.nn.Linear(channels, channels)
        self.dropout = torch.nn.Dropout(dropout)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        residual = x
        y = self.fc1(torch.relu(self.norm1(x)))
        y = self.dropout(y)
        y = self.fc2(torch.relu(self.norm2(y)))
        return residual + y


class TinyPolicyValueResNet(torch.nn.Module):
    def __init__(self, input_dim: int, action_count: int, channels: int, blocks: int, dropout: float) -> None:
        super().__init__()
        self.input_proj = torch.nn.Linear(input_dim, channels)
        self.blocks = torch.nn.ModuleList(TinyResidualBlock(channels, dropout) for _ in range(max(1, blocks)))
        self.shared_norm = torch.nn.LayerNorm(channels)
        self.policy_head = torch.nn.Linear(channels, action_count)
        self.value_head = torch.nn.Sequential(
            torch.nn.Linear(channels, channels // 2),
            torch.nn.ReLU(),
            torch.nn.Dropout(dropout),
            torch.nn.Linear(channels // 2, 1),
            torch.nn.Tanh(),
        )

    def forward(self, x: torch.Tensor) -> tuple[torch.Tensor, torch.Tensor]:
        h = self.input_proj(x)
        for block in self.blocks:
            h = block(h)
        h = torch.relu(self.shared_norm(h))
        policy_logits = self.policy_head(h)
        value = self.value_head(h).squeeze(-1)
        return policy_logits, value


def compute_masked_policy_logits(policy_logits: torch.Tensor, sample: dict) -> torch.Tensor:
    masked = torch.full_like(policy_logits, -1e9)
    allowed = sample.get("allowedActionIndexes", []) or []
    if allowed:
        masked[allowed] = policy_logits[allowed]
    return masked


def predict_encoded(
    model: TinyPolicyValueResNet,
    sample: dict,
    action_vocab: list[str],
    candidate_count: int,
    round_bucket_count: int,
    device: torch.device,
) -> tuple[str | None, float]:
    allowed = sample.get("allowedActionIndexes", []) or []
    if not allowed:
        return None, 0.0
    with torch.no_grad():
        x = build_input_vector(sample, candidate_count, round_bucket_count, device).unsqueeze(0)
        policy_logits, value = model(x)
        masked = compute_masked_policy_logits(policy_logits.squeeze(0), sample)
        best_index = int(torch.argmax(masked).item())
    if best_index < 0 or best_index >= len(action_vocab):
        return None, float(value.item())
    return action_vocab[best_index], float(value.item())


def evaluate_encoded(
    model: TinyPolicyValueResNet,
    encoded_records: list[dict],
    action_vocab: list[str],
    candidate_count: int,
    round_bucket_count: int,
    device: torch.device,
) -> dict:
    count = 0
    correct = 0
    value_loss_sum = 0.0
    for sample in encoded_records:
        predicted, value_pred = predict_encoded(
            model,
            sample,
            action_vocab,
            candidate_count,
            round_bucket_count,
            device,
        )
        if not predicted:
            continue
        count += 1
        if predicted == action_vocab[sample["targetIndex"]]:
            correct += 1
        target_value = float(sample.get("valueTarget", 0.0))
        value_loss_sum += abs(value_pred - target_value)
    return {
        "count": count,
        "correct": correct,
        "accuracy": (correct / count) if count else 0.0,
        "mae": (value_loss_sum / count) if count else 0.0,
    }


def train_tiny_resnet_model(
    encoded_train: list[dict],
    *,
    action_count: int,
    candidate_count: int,
    round_bucket_count: int,
    learning_rate: float,
    weight_decay: float,
    batch_size: int,
    epochs: int,
    grad_clip: float,
    seed: str,
    channels: int,
    blocks: int,
    dropout: float,
    value_loss_weight: float,
    visit_loss_weight: float,
    label_smoothing: float,
) -> tuple[TinyPolicyValueResNet, list[dict], torch.device]:
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    input_dim = candidate_count + round_bucket_count + 4
    model = TinyPolicyValueResNet(
        input_dim=input_dim,
        action_count=action_count,
        channels=channels,
        blocks=blocks,
        dropout=dropout,
    ).to(device)

    optimizer = torch.optim.AdamW(model.parameters(), lr=learning_rate, weight_decay=weight_decay)
    epoch_summaries: list[dict] = []
    start_time = time.perf_counter()
    total_epochs = max(1, int(epochs))

    for epoch_index in range(total_epochs):
        model.train()
        shuffled = list(encoded_train)
        random.Random(f"{seed}:epoch:{epoch_index + 1}").shuffle(shuffled)
        running_policy_loss = 0.0
        running_visit_loss = 0.0
        running_value_loss = 0.0
        running_total_loss = 0.0
        total_items = 0

        step = max(1, int(batch_size))
        for offset in range(0, len(shuffled), step):
            batch = shuffled[offset:offset + step]
            if not batch:
                continue

            vectors = torch.stack([
                build_input_vector(sample, candidate_count, round_bucket_count, device)
                for sample in batch
            ])
            policy_logits, value_pred = model(vectors)

            losses: list[torch.Tensor] = []
            policy_acc = 0.0
            visit_acc = 0.0
            value_acc = 0.0
            for row_index, sample in enumerate(batch):
                masked = compute_masked_policy_logits(policy_logits[row_index], sample)
                target = torch.tensor([sample["targetIndex"]], dtype=torch.long, device=device)
                weight = max(0.0, float(sample.get("sampleWeight", 1.0)))
                p_loss = F.cross_entropy(
                    masked.unsqueeze(0),
                    target,
                    label_smoothing=label_smoothing,
                ) * weight
                visit_indexes = sample.get("visitTargetIndexes") or []
                visit_weights = sample.get("visitTargetWeights") or []
                visit_loss = torch.tensor(0.0, dtype=torch.float32, device=device)
                if visit_indexes and visit_weights:
                    visit_target = torch.zeros_like(masked)
                    for visit_index, visit_weight in zip(visit_indexes, visit_weights):
                        index = int(visit_index)
                        if 0 <= index < visit_target.shape[0]:
                            visit_target[index] = float(visit_weight)
                    visit_sum = float(visit_target.sum().item())
                    if visit_sum > 0:
                        visit_target = visit_target / visit_sum
                        log_probs = torch.log_softmax(masked, dim=-1)
                        visit_loss = -(visit_target * log_probs).sum() * weight
                target_value = torch.tensor(float(sample.get("valueTarget", 0.0)), dtype=torch.float32, device=device)
                v_loss = F.smooth_l1_loss(value_pred[row_index], target_value) * weight
                losses.append(p_loss + (visit_loss_weight * visit_loss) + (value_loss_weight * v_loss))
                policy_acc += float(p_loss.item())
                visit_acc += float(visit_loss.item())
                value_acc += float(v_loss.item())

            loss = torch.stack(losses).mean()
            optimizer.zero_grad()
            loss.backward()
            if grad_clip > 0:
                torch.nn.utils.clip_grad_norm_(model.parameters(), grad_clip)
            optimizer.step()

            running_total_loss += float(loss.item()) * len(batch)
            running_policy_loss += policy_acc
            running_visit_loss += visit_acc
            running_value_loss += value_acc
            total_items += len(batch)

        epoch_summaries.append(
            {
                "epoch": epoch_index + 1,
                "records": len(encoded_train),
                "avgLoss": (running_total_loss / total_items) if total_items else 0.0,
                "avgPolicyLoss": (running_policy_loss / total_items) if total_items else 0.0,
                "avgVisitLoss": (running_visit_loss / total_items) if total_items else 0.0,
                "avgValueLoss": (running_value_loss / total_items) if total_items else 0.0,
            }
        )

        elapsed = time.perf_counter() - start_time
        avg_epoch_seconds = elapsed / float(epoch_index + 1)
        eta_seconds = avg_epoch_seconds * float(total_epochs - epoch_index - 1)
        last_epoch = epoch_summaries[-1]
        print(
            (
                f"[epoch {epoch_index + 1}/{total_epochs}] "
                f"avgLoss={last_epoch['avgLoss']:.4f} "
                f"avgPolicyLoss={last_epoch['avgPolicyLoss']:.4f} "
                f"avgVisitLoss={last_epoch['avgVisitLoss']:.4f} "
                f"avgValueLoss={last_epoch['avgValueLoss']:.4f} "
                f"elapsed={format_duration(elapsed)} "
                f"eta={format_duration(eta_seconds)}"
            ),
            flush=True,
        )

    return model, epoch_summaries, device


def export_tiny_resnet_weights(model: TinyPolicyValueResNet) -> dict:
    state = model.state_dict()
    return {
        key: torch.flatten(value.detach().cpu()).tolist()
        for key, value in state.items()
    }


def export_tiny_resnet_onnx(model: TinyPolicyValueResNet, output_path: Path, input_dim: int) -> None:
    model_cpu = model.to("cpu")
    model_cpu.eval()
    dummy_input = torch.zeros((1, input_dim), dtype=torch.float32)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    torch.onnx.export(
        model_cpu,
        dummy_input,
        str(output_path),
        input_names=["input"],
        output_names=["policy_logits", "value"],
        dynamic_axes={
            "input": {0: "batch"},
            "policy_logits": {0: "batch"},
            "value": {0: "batch"},
        },
        opset_version=17,
    )


def build_payload(
    *,
    model: TinyPolicyValueResNet,
    records: list[dict],
    train_records: list[dict],
    valid_records: list[dict],
    encoded_train: list[dict],
    encoded_valid: list[dict],
    vocab: dict,
    round_bucket_size: int,
    learning_rate: float,
    weight_decay: float,
    batch_size: int,
    epochs: int,
    grad_clip: float,
    input_path: Path,
    seed: str,
    validation_ratio: float,
    epoch_summaries: list[dict],
    balancing_summary: dict,
    network_channels: int,
    network_blocks: int,
    network_dropout: float,
    value_loss_weight: float,
    visit_loss_weight: float,
    label_smoothing: float,
    device: torch.device,
    onnx_file_name: str | None,
) -> dict:
    candidate_count = max(1, len(vocab["candidateVocab"]))
    train_metrics = evaluate_encoded(
        model,
        encoded_train,
        vocab["actionVocab"],
        candidate_count,
        vocab["roundBucketCount"],
        device,
    )
    valid_metrics = evaluate_encoded(
        model,
        encoded_valid,
        vocab["actionVocab"],
        candidate_count,
        vocab["roundBucketCount"],
        device,
    )

    return {
        "version": 3,
        "modelType": TINY_RESNET_MODEL_TYPE,
        "trainedAt": datetime.now(timezone.utc).isoformat(),
        "input": str(input_path),
        "seed": seed,
        "roundBucketSize": max(1, int(round_bucket_size)),
        "roundBucketCount": max(1, int(vocab["roundBucketCount"])),
        "validationRatio": max(0.0, min(0.5, float(validation_ratio))),
        "trainingEpochs": max(1, int(epochs)),
        "batchSize": max(1, int(batch_size)),
        "learningRate": float(learning_rate),
        "weightDecay": float(weight_decay),
        "gradClip": float(grad_clip),
        "totalRecords": len(records),
        "trainRecordCount": len(train_records),
        "validationRecordCount": len(valid_records),
        "network": {
            "family": "tiny-resnet",
            "channels": int(network_channels),
            "blocks": int(network_blocks),
            "dropout": float(network_dropout),
            "valueLossWeight": float(value_loss_weight),
            "visitLossWeight": float(visit_loss_weight),
            "labelSmoothing": float(label_smoothing),
            "inputDim": int(candidate_count + vocab["roundBucketCount"] + 4),
        },
        "metrics": {
            "trainAccuracy": train_metrics["accuracy"],
            "validationAccuracy": valid_metrics["accuracy"],
            "trainCount": train_metrics["count"],
            "validationCount": valid_metrics["count"],
            "trainValueMae": train_metrics["mae"],
            "validationValueMae": valid_metrics["mae"],
        },
        "actionVocab": vocab["actionVocab"],
        "candidateVocab": vocab["candidateVocab"],
        "actionCounts": vocab["actionCounts"],
        "weights": {
            "format": "flattened-state-dict-v1",
            "state": export_tiny_resnet_weights(model),
        },
        "onnx": {
            "fileName": onnx_file_name,
            "inputName": "input",
            "outputNames": ["policy_logits", "value"],
        },
        "epochSummaries": epoch_summaries,
        "balancing": balancing_summary,
    }


def build_linear_fallback_payload(*, records: list[dict], input_path: Path, seed: str) -> dict:
    action_ids = sorted({str(record.get("targetActionId") or "").strip() for record in records if str(record.get("targetActionId") or "").strip()})
    action_count = max(1, len(action_ids))
    return {
        "version": 2,
        "modelType": LINEAR_FALLBACK_MODEL_TYPE,
        "trainedAt": datetime.now(timezone.utc).isoformat(),
        "input": str(input_path),
        "seed": seed,
        "roundBucketSize": 1,
        "roundBucketCount": 1,
        "validationRatio": 0,
        "trainingEpochs": 0,
        "batchSize": 0,
        "learningRate": 0,
        "weightDecay": 0,
        "gradClip": 0,
        "totalRecords": len(records),
        "trainRecordCount": len(records),
        "validationRecordCount": 0,
        "metrics": {
            "trainAccuracy": 0,
            "validationAccuracy": 0,
            "trainCount": 0,
            "validationCount": 0,
        },
        "actionVocab": action_ids,
        "candidateVocab": action_ids,
        "actionCounts": {},
        "weights": {
            "actionBias": [0.0 for _ in range(action_count)],
            "roundWeights": [[0.0] for _ in range(action_count)],
            "candidateWeights": [[0.0 for _ in range(action_count)] for _ in range(action_count)],
        },
        "epochSummaries": [],
        "balancing": {
            "initialTrainRecords": len(records),
            "balancedTrainRecords": len(records),
        },
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Train a Tiny-ResNet behavior cloning model from AI logs")
    parser.add_argument("--input", required=True, help="Path to JSONL samples or JSON dataset file")
    parser.add_argument("--output", required=True, help="Output model JSON path")
    parser.add_argument("--output-js", default=None, help="Optional output JS module path for browser runtime")
    parser.add_argument("--output-onnx", default=None, help="Optional output ONNX path for Node GPU inference")
    parser.add_argument("--model-name", default="HARD_BEHAVIOR_CLONE_MODEL", help="Exported model constant name in JS module")
    parser.add_argument("--global-name", default="SetiAITrainedModels", help="Exported global name in the JS module")
    parser.add_argument("--getter-name", default="getHardBehaviorCloneModel", help="Exported getter name in the JS module")
    parser.add_argument("--seed", default="seti-bc-split", help="Deterministic split seed")
    parser.add_argument("--validation-ratio", type=float, default=0.25, help="Validation split ratio in [0, 0.5]")
    parser.add_argument("--round-bucket-size", type=int, default=2, help="Round bucket size for input feature")
    parser.add_argument("--epochs", type=int, default=36, help="Training epochs")
    parser.add_argument("--batch-size", type=int, default=192, help="Training batch size")
    parser.add_argument("--learning-rate", type=float, default=1.5e-4, help="Optimizer learning rate")
    parser.add_argument("--weight-decay", type=float, default=3e-4, help="AdamW weight decay")
    parser.add_argument("--grad-clip", type=float, default=0.8, help="Gradient clipping norm")
    parser.add_argument(
        "--high-freq-downsample-power",
        type=float,
        default=0.55,
        help="Downsample strength for high-frequency actions; 0 disables downsampling",
    )
    parser.add_argument(
        "--high-freq-min-keep-prob",
        type=float,
        default=0.15,
        help="Minimum keep probability for high-frequency actions",
    )
    parser.add_argument(
        "--low-freq-weight-alpha",
        type=float,
        default=0.65,
        help="Weighting exponent for low-frequency actions; 0 disables weighting",
    )
    parser.add_argument(
        "--critical-actions",
        default="launch,orbit,land,scan,researchTech,industry,playCard,placeData",
        help="Comma-separated action ids that receive extra training weight",
    )
    parser.add_argument(
        "--critical-action-boost",
        type=float,
        default=1.5,
        help="Multiplicative boost for actions listed in --critical-actions",
    )
    parser.add_argument("--tiny-resnet-channels", type=int, default=96, help="Tiny-ResNet hidden channels")
    parser.add_argument("--tiny-resnet-blocks", type=int, default=4, help="Tiny-ResNet residual block count")
    parser.add_argument("--tiny-resnet-dropout", type=float, default=0.1, help="Tiny-ResNet dropout rate")
    parser.add_argument("--value-loss-weight", type=float, default=0.35, help="Value head loss weight")
    parser.add_argument("--visit-loss-weight", type=float, default=0.30, help="Optional MCTS visit distillation loss weight")
    parser.add_argument("--label-smoothing", type=float, default=0.03, help="Policy label smoothing")
    parser.add_argument("--augmentation-copies", type=int, default=1, help="Deprecated legacy option (ignored)")
    args = parser.parse_args()

    set_global_seed(args.seed)
    input_path = Path(args.input)
    output_path = Path(args.output)
    round_bucket_size = max(1, int(args.round_bucket_size))

    samples = iter_samples(input_path)
    records = extract_records(samples, round_bucket_size)
    if not records:
        payload = build_linear_fallback_payload(records=records, input_path=input_path, seed=args.seed)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
        print(json.dumps(payload["metrics"], ensure_ascii=False))
        return 0

    train_records, valid_records = split_records(records, args.validation_ratio, args.seed)
    balanced_train_records, balancing_summary = apply_frequency_balancing(
        train_records,
        seed=args.seed,
        downsample_power=max(0.0, float(args.high_freq_downsample_power)),
        min_keep_prob=max(0.0, min(1.0, float(args.high_freq_min_keep_prob))),
        low_freq_weight_alpha=max(0.0, float(args.low_freq_weight_alpha)),
        critical_actions=parse_action_set(args.critical_actions),
        critical_action_boost=max(1.0, float(args.critical_action_boost)),
    )
    vocab = build_vocab(records, round_bucket_size)
    candidate_count = max(1, len(vocab["candidateVocab"]))

    encoded_train = encode_records(balanced_train_records, vocab, round_bucket_size)
    encoded_valid = encode_records(valid_records, vocab, round_bucket_size)

    if not encoded_train:
        raise SystemExit("No valid training records after preprocessing")

    model, epoch_summaries, device = train_tiny_resnet_model(
        encoded_train,
        action_count=len(vocab["actionVocab"]),
        candidate_count=max(1, len(vocab["candidateVocab"])),
        round_bucket_count=vocab["roundBucketCount"],
        learning_rate=max(1e-8, float(args.learning_rate)),
        weight_decay=max(0.0, float(args.weight_decay)),
        batch_size=max(1, int(args.batch_size)),
        epochs=max(1, int(args.epochs)),
        grad_clip=max(0.0, float(args.grad_clip)),
        seed=args.seed,
        channels=max(32, int(args.tiny_resnet_channels)),
        blocks=max(1, int(args.tiny_resnet_blocks)),
        dropout=clamp(float(args.tiny_resnet_dropout), 0.0, 0.6),
        value_loss_weight=max(0.0, float(args.value_loss_weight)),
        visit_loss_weight=max(0.0, float(args.visit_loss_weight)),
        label_smoothing=clamp(float(args.label_smoothing), 0.0, 0.2),
    )

    payload = build_payload(
        model=model,
        records=records,
        train_records=train_records,
        valid_records=valid_records,
        encoded_train=encoded_train,
        encoded_valid=encoded_valid,
        vocab=vocab,
        round_bucket_size=round_bucket_size,
        learning_rate=max(1e-8, float(args.learning_rate)),
        weight_decay=max(0.0, float(args.weight_decay)),
        batch_size=max(1, int(args.batch_size)),
        epochs=max(1, int(args.epochs)),
        grad_clip=max(0.0, float(args.grad_clip)),
        input_path=input_path,
        seed=args.seed,
        validation_ratio=args.validation_ratio,
        epoch_summaries=epoch_summaries,
        balancing_summary=balancing_summary,
        network_channels=max(32, int(args.tiny_resnet_channels)),
        network_blocks=max(1, int(args.tiny_resnet_blocks)),
        network_dropout=clamp(float(args.tiny_resnet_dropout), 0.0, 0.6),
        value_loss_weight=max(0.0, float(args.value_loss_weight)),
        visit_loss_weight=max(0.0, float(args.visit_loss_weight)),
        label_smoothing=clamp(float(args.label_smoothing), 0.0, 0.2),
        device=device,
        onnx_file_name=(Path(args.output_onnx).name if args.output_onnx else None),
    )

    if args.output_onnx:
        export_tiny_resnet_onnx(
            model,
            Path(args.output_onnx),
            candidate_count + vocab["roundBucketCount"] + 4,
        )

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")

    if args.output_js:
        js_output = Path(args.output_js)
        model_name = str(args.model_name or "HARD_BEHAVIOR_CLONE_MODEL").strip() or "HARD_BEHAVIOR_CLONE_MODEL"
        global_name = str(args.global_name or "SetiAITrainedModels").strip() or "SetiAITrainedModels"
        getter_name = str(args.getter_name or "getHardBehaviorCloneModel").strip() or "getHardBehaviorCloneModel"
        js_payload = json.dumps(payload, ensure_ascii=False, indent=2)
        js_content = (
            "(function (root, factory) {\n"
            "  \"use strict\";\n\n"
            "  const api = factory();\n\n"
            "  if (typeof module === \"object\" && module.exports) {\n"
            "    module.exports = api;\n"
            "  }\n\n"
            f"  root.{global_name} = api;\n"
            "})(typeof globalThis !== \"undefined\" ? globalThis : window, function () {\n"
            "  \"use strict\";\n\n"
            f"  const {model_name} = Object.freeze({js_payload});\n\n"
            "  return Object.freeze({\n"
            f"    {model_name},\n"
            f"    {getter_name}: () => {model_name},\n"
            "  });\n"
            "});\n"
        )
        js_output.parent.mkdir(parents=True, exist_ok=True)
        js_output.write_text(js_content, encoding="utf-8")

    print(json.dumps(payload["metrics"], ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
