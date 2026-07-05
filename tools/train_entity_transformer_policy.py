#!/usr/bin/env python3
"""Train an entity-transformer behavior cloning model from schema-v3 JSONL."""

from __future__ import annotations

import argparse
import hashlib
import json
import math
import random
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from collections import defaultdict

import torch
import torch.nn.functional as F

try:
    from tools import entity_observation_encoder as encoder
except ModuleNotFoundError:
    import entity_observation_encoder as encoder


MODEL_TYPE = "pytorch-entity-transformer-v1"
SCHEMA_VERSION = 3


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


def finite(value: float, fallback: float = 0.0) -> float:
    try:
        number = float(value)
    except (TypeError, ValueError):
        return fallback
    if not math.isfinite(number):
        return fallback
    return number


def set_global_seed(seed_text: str) -> int:
    digest = hashlib.sha256(seed_text.encode("utf-8")).digest()
    seed_value = int.from_bytes(digest[:8], "big") % (2**31)
    random.seed(seed_value)
    torch.manual_seed(seed_value)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed_value)
    return seed_value


def parse_action_id(payload: dict[str, Any]) -> str:
    return encoder.parse_action_id(payload)


def parse_visit_distribution(payload: dict[str, Any]) -> dict[str, float] | None:
    return encoder.parse_visit_distribution(payload)


def iter_jsonl(path: Path):
    return encoder.iter_jsonl(path)


def normalize_candidate_ids(candidates: list[dict[str, Any]]) -> list[str]:
    return encoder.normalize_candidate_ids(candidates)


def hash_to_unit_float(text: str) -> float:
    digest = hashlib.sha256(text.encode("utf-8")).digest()
    return int.from_bytes(digest[:8], "big") / float(2**64 - 1)


def should_use_validation(sample_id: str, seed: str, validation_ratio: float) -> bool:
    return encoder.should_use_validation(sample_id, seed, validation_ratio)


def entity_type_key(entity: dict[str, Any]) -> str:
    return str(entity.get("type") or "UNKNOWN").strip().upper() or "UNKNOWN"


def owner_key(entity: dict[str, Any]) -> str:
    return str(entity.get("ownerId") or "NONE").strip() or "NONE"


def zone_key(entity: dict[str, Any]) -> str:
    return str(entity.get("zone") or "global").strip().lower() or "global"


def slot_key(entity: dict[str, Any]) -> str:
    return str(entity.get("slotId") or "none").strip() or "none"


def collect_vocab(input_path: Path, *, max_samples: int) -> tuple[dict[str, Any], dict[str, Any]]:
    vocab_obj, summary = encoder.collect_vocab(input_path, max_samples=max_samples, schema_version=SCHEMA_VERSION)
    vocab = {
        "entityTypeVocab": vocab_obj.entity_type_vocab,
        "ownerVocab": vocab_obj.owner_vocab,
        "zoneVocab": vocab_obj.zone_vocab,
        "slotVocab": vocab_obj.slot_vocab,
        "actionVocab": vocab_obj.action_vocab,
        "numericDim": 24,
        "flagDim": 0,
    }
    return vocab, summary


def index_map(values: list[str]) -> dict[str, int]:
    return {value: idx for idx, value in enumerate(values)}


def build_numeric_vector(entity: dict[str, Any], numeric_dim: int, flag_dim: int) -> list[float]:
    del flag_dim
    return encoder.build_numeric_vector(entity, numeric_dim=max(4, numeric_dim))


def encode_record(
    record: dict[str, Any],
    vocab: dict[str, Any],
    *,
    max_state_entities: int,
    max_candidate_actions: int,
) -> dict[str, Any] | None:
    del record, vocab, max_state_entities, max_candidate_actions
    return None


def build_records(
    input_path: Path,
    *,
    seed: str,
    validation_ratio: float,
    max_samples: int,
) -> tuple[list[dict[str, Any]], list[dict[str, Any]], dict[str, Any]]:
    del input_path, seed, validation_ratio, max_samples
    return [], [], {}


class EntityTransformerModel(torch.nn.Module):
    def __init__(
        self,
        *,
        entity_type_count: int,
        owner_count: int,
        zone_count: int,
        slot_count: int,
        action_count: int,
        numeric_dim: int,
        d_model: int,
        nhead: int,
        ff_dim: int,
        num_layers: int,
        dropout: float,
        max_candidate_actions: int,
    ) -> None:
        super().__init__()
        self.max_candidate_actions = max_candidate_actions
        self.action_count = action_count

        self.entity_type_embed = torch.nn.Embedding(max(1, entity_type_count), d_model)
        self.owner_embed = torch.nn.Embedding(max(1, owner_count), d_model)
        self.zone_embed = torch.nn.Embedding(max(1, zone_count), d_model)
        self.slot_embed = torch.nn.Embedding(max(1, slot_count), d_model)
        self.numeric_proj = torch.nn.Linear(numeric_dim, d_model)
        self.position_proj = torch.nn.Linear(4, d_model)

        encoder_layer = torch.nn.TransformerEncoderLayer(
            d_model=d_model,
            nhead=max(1, nhead),
            dim_feedforward=max(d_model, ff_dim),
            dropout=dropout,
            batch_first=True,
            activation="gelu",
        )
        self.encoder = torch.nn.TransformerEncoder(encoder_layer, num_layers=max(1, num_layers))

        self.action_embed = torch.nn.Embedding(max(1, action_count), d_model)
        self.policy_head = torch.nn.Linear(d_model, 1)
        self.value_head = torch.nn.Sequential(
            torch.nn.Linear(d_model, d_model // 2),
            torch.nn.GELU(),
            torch.nn.Dropout(dropout),
            torch.nn.Linear(d_model // 2, 1),
            torch.nn.Tanh(),
        )

    def forward(
        self,
        entity_type_ids: torch.Tensor,
        owner_ids: torch.Tensor,
        zone_ids: torch.Tensor,
        slot_ids: torch.Tensor,
        numeric_features: torch.Tensor,
        entity_mask: torch.Tensor,
        candidate_action_indexes: torch.Tensor,
        candidate_mask: torch.Tensor,
    ) -> tuple[torch.Tensor, torch.Tensor]:
        token_embed = (
            self.entity_type_embed(entity_type_ids)
            + self.owner_embed(owner_ids)
            + self.zone_embed(zone_ids)
            + self.slot_embed(slot_ids)
            + self.numeric_proj(numeric_features)
            + self.position_proj(self._build_position_features(numeric_features))
        )

        src_key_padding_mask = entity_mask <= 0
        hidden = self.encoder(token_embed, src_key_padding_mask=src_key_padding_mask)

        pooled_mask = entity_mask.unsqueeze(-1)
        pooled_sum = (hidden * pooled_mask).sum(dim=1)
        pooled_denom = pooled_mask.sum(dim=1).clamp(min=1.0)
        pooled = pooled_sum / pooled_denom

        action_emb = self.action_embed(candidate_action_indexes)
        expanded_state = pooled.unsqueeze(1).expand_as(action_emb)
        action_hidden = action_emb + expanded_state
        policy_logits = self.policy_head(action_hidden).squeeze(-1)
        policy_logits = policy_logits.masked_fill(candidate_mask <= 0, -1e9)

        value = self.value_head(pooled).squeeze(-1)
        return policy_logits, value

    @staticmethod
    def _build_position_features(numeric_features: torch.Tensor) -> torch.Tensor:
        ring = numeric_features[..., -2]
        sector = numeric_features[..., -1]
        ring = torch.clamp(ring, min=-16.0, max=16.0)
        sector = torch.clamp(sector, min=-16.0, max=16.0)
        angle = sector * (math.pi / 4.0)
        radius = ring / 8.0
        sin_v = torch.sin(angle)
        cos_v = torch.cos(angle)
        return torch.stack((ring, sector, sin_v * radius, cos_v * radius), dim=-1)


def tensorize_batch(batch: list[dict[str, Any]], device: torch.device) -> dict[str, torch.Tensor]:
    def to_long(name: str) -> torch.Tensor:
        return torch.tensor([row[name] for row in batch], dtype=torch.long, device=device)

    def to_float(name: str) -> torch.Tensor:
        return torch.tensor([row[name] for row in batch], dtype=torch.float32, device=device)

    return {
        "entity_type_ids": to_long("entityTypeIds"),
        "owner_ids": to_long("ownerIds"),
        "zone_ids": to_long("zoneIds"),
        "slot_ids": to_long("slotIds"),
        "numeric_features": to_float("numericFeatures"),
        "entity_mask": to_float("entityMask"),
        "candidate_action_indexes": to_long("candidateActionIndexes"),
        "candidate_mask": to_float("candidateMask"),
        "target_candidate_indexes": torch.tensor([row["targetCandidateIndex"] for row in batch], dtype=torch.long, device=device),
        "visit_target": to_float("visitTarget"),
        "value_target": torch.tensor([row["valueTarget"] for row in batch], dtype=torch.float32, device=device),
        "sample_weight": torch.tensor([row["sampleWeight"] for row in batch], dtype=torch.float32, device=device),
        "target_action_ids": [row.get("targetActionId") for row in batch],
    }


def masked_label_smoothed_cross_entropy(
    logits: torch.Tensor,
    candidate_mask: torch.Tensor,
    target_index: torch.Tensor,
    label_smoothing: float,
) -> torch.Tensor:
    valid = candidate_mask > 0
    valid_logits = logits[valid]
    valid_indexes = torch.nonzero(valid, as_tuple=False).squeeze(-1)
    target_matches = valid_indexes == target_index
    if valid_logits.numel() <= 0 or not bool(target_matches.any().item()):
        return F.cross_entropy(logits.unsqueeze(0), target_index.unsqueeze(0), label_smoothing=0.0)

    target_pos = torch.nonzero(target_matches, as_tuple=False).squeeze(-1)[0]
    log_probs = torch.log_softmax(valid_logits, dim=-1)
    smoothing = clamp(float(label_smoothing), 0.0, 0.2)
    valid_count = int(valid_logits.numel())
    if smoothing <= 0.0 or valid_count <= 1:
        return -log_probs[target_pos]

    target_dist = torch.full_like(valid_logits, smoothing / float(valid_count - 1))
    target_dist[target_pos] = 1.0 - smoothing
    return -(target_dist * log_probs).sum()


def evaluate(
    model: EntityTransformerModel,
    records: list[dict[str, Any]],
    *,
    batch_size: int,
    device: torch.device,
) -> dict[str, float]:
    if not records:
        return {"count": 0.0, "accuracy": 0.0, "mae": 0.0, "entropy": 0.0, "perActionRecall": {}}

    model.eval()
    count = 0
    correct = 0
    mae_sum = 0.0
    entropy_sum = 0.0
    recall_hits: dict[str, int] = defaultdict(int)
    recall_total: dict[str, int] = defaultdict(int)

    with torch.no_grad():
        for offset in range(0, len(records), max(1, batch_size)):
            batch = records[offset:offset + max(1, batch_size)]
            tensors = tensorize_batch(batch, device)
            logits, value = model(
                tensors["entity_type_ids"],
                tensors["owner_ids"],
                tensors["zone_ids"],
                tensors["slot_ids"],
                tensors["numeric_features"],
                tensors["entity_mask"],
                tensors["candidate_action_indexes"],
                tensors["candidate_mask"],
            )
            pred = torch.argmax(logits, dim=-1)
            probs = torch.softmax(logits, dim=-1)
            probs = torch.nan_to_num(probs, nan=0.0, posinf=0.0, neginf=0.0)
            count += len(batch)
            correct += int((pred == tensors["target_candidate_indexes"]).sum().item())
            mae_sum += finite(float(torch.abs(value - tensors["value_target"]).sum().item()), 0.0)
            entropy_sum += finite(float((-(probs * torch.log(probs.clamp(min=1e-9))).sum(dim=-1)).sum().item()), 0.0)
            for row_idx in range(len(batch)):
                action_id = str(tensors["target_action_ids"][row_idx] or "unknown")
                recall_total[action_id] += 1
                if int(pred[row_idx].item()) == int(tensors["target_candidate_indexes"][row_idx].item()):
                    recall_hits[action_id] += 1

    return {
        "count": float(count),
        "accuracy": (correct / count) if count > 0 else 0.0,
        "mae": (mae_sum / count) if count > 0 else 0.0,
        "entropy": (entropy_sum / count) if count > 0 else 0.0,
        "perActionRecall": {
            action_id: (recall_hits.get(action_id, 0) / total if total > 0 else 0.0)
            for action_id, total in sorted(recall_total.items(), key=lambda item: item[0])
        },
    }


def stream_encoded_records(
    input_path: Path,
    *,
    vocab: dict[str, Any],
    split: str,
    seed: str,
    validation_ratio: float,
    max_samples: int,
    max_state_entities: int,
    max_candidate_actions: int,
    numeric_dim: int,
    stats: encoder.EncoderStats,
) -> list[dict[str, Any]]:
    cfg = encoder.EncoderConfig(
        max_state_entities=max_state_entities,
        max_candidate_actions=max_candidate_actions,
        numeric_dim=numeric_dim,
    )
    vocab_obj = encoder.Vocab(
        entity_type_vocab=vocab["entityTypeVocab"],
        owner_vocab=vocab["ownerVocab"],
        zone_vocab=vocab["zoneVocab"],
        slot_vocab=vocab["slotVocab"],
        action_vocab=vocab["actionVocab"],
    )
    out: list[dict[str, Any]] = []
    for record in encoder.encode_stream(
        input_path,
        vocab=vocab_obj,
        config=cfg,
        seed=seed,
        validation_ratio=validation_ratio,
        split=split,
        max_samples=max_samples,
        stats=stats,
    ):
        out.append(record)
    return out


def export_onnx(
    model: EntityTransformerModel,
    output_path: Path,
    *,
    max_state_entities: int,
    max_candidate_actions: int,
    numeric_dim: int,
) -> None:
    model_cpu = model.to("cpu")
    model_cpu.eval()

    export_batch_size = 2
    dummy = {
        "entity_type_ids": torch.zeros((export_batch_size, max_state_entities), dtype=torch.long),
        "owner_ids": torch.zeros((export_batch_size, max_state_entities), dtype=torch.long),
        "zone_ids": torch.zeros((export_batch_size, max_state_entities), dtype=torch.long),
        "slot_ids": torch.zeros((export_batch_size, max_state_entities), dtype=torch.long),
        "numeric_features": torch.zeros((export_batch_size, max_state_entities, numeric_dim), dtype=torch.float32),
        "entity_mask": torch.ones((export_batch_size, max_state_entities), dtype=torch.float32),
        "candidate_action_indexes": torch.zeros((export_batch_size, max_candidate_actions), dtype=torch.long),
        "candidate_mask": torch.ones((export_batch_size, max_candidate_actions), dtype=torch.float32),
    }

    output_path.parent.mkdir(parents=True, exist_ok=True)
    input_names = [
        "entity_type_ids",
        "owner_ids",
        "zone_ids",
        "slot_ids",
        "numeric_features",
        "entity_mask",
        "candidate_action_indexes",
        "candidate_mask",
    ]
    inputs = tuple(dummy[name] for name in input_names)
    dynamic_axes = {
        "entity_type_ids": {0: "batch"},
        "owner_ids": {0: "batch"},
        "zone_ids": {0: "batch"},
        "slot_ids": {0: "batch"},
        "numeric_features": {0: "batch"},
        "entity_mask": {0: "batch"},
        "candidate_action_indexes": {0: "batch"},
        "candidate_mask": {0: "batch"},
        "policy_logits": {0: "batch"},
        "value": {0: "batch"},
    }
    try:
        from torch.export import Dim

        batch_dim = Dim("batch", min=1)
        dynamic_shapes = {name: {0: batch_dim} for name in input_names}
        torch.onnx.export(
            model_cpu,
            args=(),
            kwargs=dummy,
            f=str(output_path),
            input_names=input_names,
            output_names=["policy_logits", "value"],
            dynamic_shapes=dynamic_shapes,
            opset_version=18,
            dynamo=True,
        )
    except Exception as exc:
        print(f"[entity-train] dynamo onnx export failed, falling back to legacy exporter: {exc}", flush=True)
        torch.onnx.export(
            model_cpu,
            inputs,
            str(output_path),
            input_names=input_names,
            output_names=["policy_logits", "value"],
            dynamic_axes=dynamic_axes,
            opset_version=17,
        )


def export_state_dict(model: EntityTransformerModel) -> dict[str, list[float]]:
    state = model.state_dict()
    return {
        key: torch.flatten(value.detach().cpu()).tolist()
        for key, value in state.items()
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Train entity-transformer behavior model from schema-v3 JSONL")
    parser.add_argument("--input", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--output-js", default=None)
    parser.add_argument("--output-onnx", default=None)
    parser.add_argument("--model-name", default="EXPERT_BEHAVIOR_CLONE_MODEL")
    parser.add_argument("--global-name", default="SetiAIExpertTrainedModels")
    parser.add_argument("--getter-name", default="getExpertBehaviorCloneModel")
    parser.add_argument("--seed", default="entity-transformer")
    parser.add_argument("--validation-ratio", type=float, default=0.2)
    parser.add_argument("--max-samples", type=int, default=250000)
    parser.add_argument("--chunk-size", type=int, default=50000)
    parser.add_argument("--max-state-entities", type=int, default=192)
    parser.add_argument("--max-candidate-actions", type=int, default=40)
    parser.add_argument("--entity-dim", type=int, default=128)
    parser.add_argument("--entity-layers", type=int, default=4)
    parser.add_argument("--entity-heads", type=int, default=4)
    parser.add_argument("--entity-ff-dim", type=int, default=384)
    parser.add_argument("--dropout", type=float, default=0.1)
    parser.add_argument("--epochs", type=int, default=24)
    parser.add_argument("--batch-size", type=int, default=48)
    parser.add_argument("--learning-rate", type=float, default=8e-5)
    parser.add_argument("--weight-decay", type=float, default=1e-4)
    parser.add_argument("--grad-clip", type=float, default=1.0)
    parser.add_argument("--value-loss-weight", type=float, default=0.35)
    parser.add_argument("--visit-loss-weight", type=float, default=0.40)
    parser.add_argument("--label-smoothing", type=float, default=0.02)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    set_global_seed(args.seed)

    input_path = Path(args.input)
    output_path = Path(args.output)

    print(
        "[entity-train] start "
        f"input={input_path} max_samples={max(1, int(args.max_samples))} "
        f"max_entities={max(1, int(args.max_state_entities))} "
        f"max_candidates={max(1, int(args.max_candidate_actions))}",
        flush=True,
    )
    print("[entity-train] collecting vocab...", flush=True)
    vocab, vocab_summary = collect_vocab(input_path, max_samples=max(1, int(args.max_samples)))
    if not vocab["actionVocab"]:
        raise SystemExit("No usable schema-v3 records with compactEntities")
    print(
        "[entity-train] vocab ready "
        f"entity_types={len(vocab['entityTypeVocab'])} owners={len(vocab['ownerVocab'])} "
        f"zones={len(vocab['zoneVocab'])} slots={len(vocab['slotVocab'])} "
        f"actions={len(vocab['actionVocab'])} summary={json.dumps(vocab_summary, ensure_ascii=True)}",
        flush=True,
    )

    ingest_stats = encoder.EncoderStats()
    print("[entity-train] encoding train split...", flush=True)
    encoded_train = stream_encoded_records(
        input_path,
        vocab=vocab,
        split="train",
        seed=args.seed,
        validation_ratio=max(0.0, min(0.5, float(args.validation_ratio))),
        max_samples=max(1, int(args.max_samples)),
        max_state_entities=max(1, int(args.max_state_entities)),
        max_candidate_actions=max(1, int(args.max_candidate_actions)),
        numeric_dim=vocab["numericDim"],
        stats=ingest_stats,
    )
    print(f"[entity-train] train records={len(encoded_train)}", flush=True)
    print("[entity-train] encoding validation split...", flush=True)
    encoded_valid = stream_encoded_records(
        input_path,
        vocab=vocab,
        split="validation",
        seed=args.seed,
        validation_ratio=max(0.0, min(0.5, float(args.validation_ratio))),
        max_samples=max(1, int(args.max_samples)),
        max_state_entities=max(1, int(args.max_state_entities)),
        max_candidate_actions=max(1, int(args.max_candidate_actions)),
        numeric_dim=vocab["numericDim"],
        stats=ingest_stats,
    )
    print(
        "[entity-train] validation records="
        f"{len(encoded_valid)} ingest={json.dumps(encoder.build_ingest_summary(ingest_stats), ensure_ascii=True)}",
        flush=True,
    )

    if not encoded_train:
        raise SystemExit("No encoded train records after entity/candidate truncation")

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"[entity-train] building model device={device}", flush=True)

    model = EntityTransformerModel(
        entity_type_count=len(vocab["entityTypeVocab"]),
        owner_count=len(vocab["ownerVocab"]),
        zone_count=len(vocab["zoneVocab"]),
        slot_count=len(vocab["slotVocab"]),
        action_count=len(vocab["actionVocab"]),
        numeric_dim=vocab["numericDim"],
        d_model=max(32, int(args.entity_dim)),
        nhead=max(1, int(args.entity_heads)),
        ff_dim=max(64, int(args.entity_ff_dim)),
        num_layers=max(1, int(args.entity_layers)),
        dropout=clamp(float(args.dropout), 0.0, 0.5),
        max_candidate_actions=max(1, int(args.max_candidate_actions)),
    ).to(device)

    optimizer = torch.optim.AdamW(
        model.parameters(),
        lr=max(1e-8, float(args.learning_rate)),
        weight_decay=max(0.0, float(args.weight_decay)),
    )

    epoch_summaries: list[dict[str, Any]] = []
    start_time = time.perf_counter()

    for epoch in range(max(1, int(args.epochs))):
        model.train()
        shuffled = list(encoded_train)
        random.Random(f"{args.seed}:epoch:{epoch + 1}").shuffle(shuffled)

        total_loss_sum = 0.0
        policy_loss_sum = 0.0
        visit_loss_sum = 0.0
        value_loss_sum = 0.0
        entropy_sum = 0.0
        total_count = 0

        step = max(1, int(args.batch_size))
        for offset in range(0, len(shuffled), step):
            batch = shuffled[offset:offset + step]
            if not batch:
                continue

            tensors = tensorize_batch(batch, device)
            logits, value = model(
                tensors["entity_type_ids"],
                tensors["owner_ids"],
                tensors["zone_ids"],
                tensors["slot_ids"],
                tensors["numeric_features"],
                tensors["entity_mask"],
                tensors["candidate_action_indexes"],
                tensors["candidate_mask"],
            )
            logits = torch.nan_to_num(logits, nan=-1e6, posinf=1e6, neginf=-1e6)
            value = torch.nan_to_num(value, nan=0.0, posinf=1.0, neginf=-1.0)

            losses: list[torch.Tensor] = []
            p_acc = 0.0
            v_acc = 0.0
            visit_acc = 0.0

            for row_idx in range(len(batch)):
                weight = max(0.0, float(tensors["sample_weight"][row_idx].item()))
                target = tensors["target_candidate_indexes"][row_idx]
                p_loss = masked_label_smoothed_cross_entropy(
                    logits[row_idx],
                    tensors["candidate_mask"][row_idx],
                    target,
                    float(args.label_smoothing),
                ) * weight

                valid = tensors["candidate_mask"][row_idx] > 0
                valid_logits = logits[row_idx][valid]
                visit_target = tensors["visit_target"][row_idx][valid]
                visit_mass = float(visit_target.sum().item())
                visit_loss = torch.tensor(0.0, dtype=torch.float32, device=device)
                if visit_mass > 0 and valid_logits.numel() > 0:
                    normalized_visit = visit_target / visit_mass
                    log_probs = torch.log_softmax(valid_logits, dim=-1)
                    visit_loss = -(normalized_visit * log_probs).sum() * weight

                v_target = tensors["value_target"][row_idx]
                v_loss = F.smooth_l1_loss(value[row_idx], v_target) * weight

                total = p_loss + (max(0.0, float(args.visit_loss_weight)) * visit_loss) + (max(0.0, float(args.value_loss_weight)) * v_loss)
                losses.append(total)

                p_acc += finite(float(p_loss.item()), 0.0)
                visit_acc += finite(float(visit_loss.item()), 0.0)
                v_acc += finite(float(v_loss.item()), 0.0)

            batch_loss = torch.stack(losses).mean()
            batch_loss = torch.nan_to_num(batch_loss, nan=0.0, posinf=1e6, neginf=-1e6)
            probs = torch.softmax(logits, dim=-1)
            probs = torch.nan_to_num(probs, nan=0.0, posinf=0.0, neginf=0.0)
            entropy_sum += finite(float((-(probs * torch.log(probs.clamp(min=1e-9))).sum(dim=-1)).sum().item()), 0.0)
            optimizer.zero_grad()
            batch_loss.backward()
            if float(args.grad_clip) > 0:
                torch.nn.utils.clip_grad_norm_(model.parameters(), float(args.grad_clip))
            optimizer.step()

            total_loss_sum += finite(float(batch_loss.item()), 0.0) * len(batch)
            policy_loss_sum += p_acc
            visit_loss_sum += visit_acc
            value_loss_sum += v_acc
            total_count += len(batch)

        epoch_summary = {
            "epoch": epoch + 1,
            "records": len(encoded_train),
            "avgLoss": (total_loss_sum / total_count) if total_count else 0.0,
            "avgPolicyLoss": (policy_loss_sum / total_count) if total_count else 0.0,
            "avgVisitLoss": (visit_loss_sum / total_count) if total_count else 0.0,
            "avgValueLoss": (value_loss_sum / total_count) if total_count else 0.0,
            "avgPolicyEntropy": (entropy_sum / total_count) if total_count else 0.0,
        }
        epoch_summaries.append(epoch_summary)

        elapsed = time.perf_counter() - start_time
        print(
            f"[epoch {epoch + 1}/{max(1, int(args.epochs))}] "
            f"avgLoss={epoch_summary['avgLoss']:.4f} "
            f"avgPolicyLoss={epoch_summary['avgPolicyLoss']:.4f} "
            f"avgVisitLoss={epoch_summary['avgVisitLoss']:.4f} "
            f"avgValueLoss={epoch_summary['avgValueLoss']:.4f} "
            f"elapsed={elapsed:.1f}s",
            flush=True,
        )

    print("[entity-train] evaluating train split...", flush=True)
    train_metrics = evaluate(model, encoded_train, batch_size=max(1, int(args.batch_size)), device=device)
    print("[entity-train] evaluating validation split...", flush=True)
    valid_metrics = evaluate(model, encoded_valid, batch_size=max(1, int(args.batch_size)), device=device)

    payload = {
        "version": 1,
        "modelType": MODEL_TYPE,
        "trainedAt": datetime.now(timezone.utc).isoformat(),
        "input": str(input_path),
        "seed": args.seed,
        "schemaVersion": SCHEMA_VERSION,
        "validationRatio": max(0.0, min(0.5, float(args.validation_ratio))),
        "totalRecords": len(encoded_train) + len(encoded_valid),
        "trainRecordCount": len(encoded_train),
        "validationRecordCount": len(encoded_valid),
        "ingestSummary": {
            **vocab_summary,
            **encoder.build_ingest_summary(ingest_stats),
            "schemaVersionRequired": SCHEMA_VERSION,
            "observationEnvelopeVersionRequired": encoder.OBSERVATION_ENVELOPE_VERSION,
        },
        "vocab": {
            "entityTypeVocab": vocab["entityTypeVocab"],
            "ownerVocab": vocab["ownerVocab"],
            "zoneVocab": vocab["zoneVocab"],
            "slotVocab": vocab["slotVocab"],
            "actionVocab": vocab["actionVocab"],
        },
        "network": {
            "entityDim": max(32, int(args.entity_dim)),
            "entityLayers": max(1, int(args.entity_layers)),
            "entityHeads": max(1, int(args.entity_heads)),
            "entityFfDim": max(64, int(args.entity_ff_dim)),
            "dropout": clamp(float(args.dropout), 0.0, 0.5),
            "maxStateEntities": max(1, int(args.max_state_entities)),
            "maxCandidateActions": max(1, int(args.max_candidate_actions)),
            "numericDim": vocab["numericDim"],
            "valueLossWeight": max(0.0, float(args.value_loss_weight)),
            "visitLossWeight": max(0.0, float(args.visit_loss_weight)),
            "labelSmoothing": clamp(float(args.label_smoothing), 0.0, 0.2),
        },
        "metrics": {
            "trainAccuracy": finite(train_metrics["accuracy"], 0.0),
            "validationAccuracy": finite(valid_metrics["accuracy"], 0.0),
            "trainCount": finite(train_metrics["count"], 0.0),
            "validationCount": finite(valid_metrics["count"], 0.0),
            "trainValueMae": finite(train_metrics["mae"], 0.0),
            "validationValueMae": finite(valid_metrics["mae"], 0.0),
            "trainPolicyEntropy": finite(train_metrics.get("entropy", 0.0), 0.0),
            "validationPolicyEntropy": finite(valid_metrics.get("entropy", 0.0), 0.0),
            "trainPerActionRecall": train_metrics.get("perActionRecall", {}),
            "validationPerActionRecall": valid_metrics.get("perActionRecall", {}),
            "trainPolicyLoss": finite(epoch_summaries[-1]["avgPolicyLoss"], 0.0) if epoch_summaries else 0.0,
            "trainVisitLoss": finite(epoch_summaries[-1]["avgVisitLoss"], 0.0) if epoch_summaries else 0.0,
            "trainValueLoss": finite(epoch_summaries[-1]["avgValueLoss"], 0.0) if epoch_summaries else 0.0,
        },
        "weights": {
            "format": "flattened-state-dict-v1",
            "state": export_state_dict(model),
        },
        "streaming": {
            "enabled": True,
            "chunkSize": max(1, int(args.chunk_size)),
            "maxSamples": max(1, int(args.max_samples)),
        },
        "onnx": {
            "fileName": Path(args.output_onnx).name if args.output_onnx else None,
            "inputNames": [
                "entity_type_ids",
                "owner_ids",
                "zone_ids",
                "slot_ids",
                "numeric_features",
                "entity_mask",
                "candidate_action_indexes",
                "candidate_mask",
            ],
            "outputNames": ["policy_logits", "value"],
        },
        "epochSummaries": epoch_summaries,
    }

    output_path.parent.mkdir(parents=True, exist_ok=True)
    print(f"[entity-train] writing json={output_path}", flush=True)
    output_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")

    if args.output_js:
        js_output = Path(args.output_js)
        js_payload = json.dumps(payload, ensure_ascii=False, indent=2)
        js_output.parent.mkdir(parents=True, exist_ok=True)
        print(f"[entity-train] writing js={js_output}", flush=True)
        js_output.write_text(
            "(function (root, factory) {\n"
            "  \"use strict\";\n"
            "  const api = factory();\n"
            "  if (typeof module === \"object\" && module.exports) module.exports = api;\n"
            f"  root.{args.global_name} = api;\n"
            "})(typeof globalThis !== \"undefined\" ? globalThis : window, function () {\n"
            "  \"use strict\";\n"
            f"  const {args.model_name} = Object.freeze({js_payload});\n"
            "  return Object.freeze({\n"
            f"    {args.model_name},\n"
            f"    {args.getter_name}: () => {args.model_name},\n"
            "  });\n"
            "});\n",
            encoding="utf-8",
        )

    if args.output_onnx:
        print(f"[entity-train] exporting onnx={args.output_onnx}", flush=True)
        export_onnx(
            model,
            Path(args.output_onnx),
            max_state_entities=max(1, int(args.max_state_entities)),
            max_candidate_actions=max(1, int(args.max_candidate_actions)),
            numeric_dim=vocab["numericDim"],
        )
        print(f"[entity-train] onnx exported={args.output_onnx}", flush=True)

    print("[entity-train] metrics", flush=True)
    print(json.dumps(payload["metrics"], ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
