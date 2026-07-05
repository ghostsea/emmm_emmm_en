#!/usr/bin/env python3
"""Streamed schema-v3 entity dataset inspector (16GB-safe)."""

from __future__ import annotations

import argparse
import json
from collections import Counter
from pathlib import Path


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Inspect schema-v3 entity dataset with bounded streaming")
    parser.add_argument("--input", required=True, help="Input JSONL dataset")
    parser.add_argument("--max-samples", type=int, default=5000, help="Max samples to scan")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    input_path = Path(args.input)
    if not input_path.exists():
        raise SystemExit(f"Input not found: {input_path}")

    scanned = 0
    wrong_schema = 0
    missing_observation = 0
    missing_entities = 0
    target_missing_from_candidates = 0
    entity_count_total = 0
    entity_count_max = 0
    type_counts = Counter()

    with input_path.open("r", encoding="utf-8") as handle:
        for raw in handle:
            if scanned >= max(1, int(args.max_samples)):
                break
            line = raw.strip()
            if not line:
                continue
            try:
                sample = json.loads(line)
            except json.JSONDecodeError:
                continue
            if not isinstance(sample, dict):
                continue

            scanned += 1
            if int(sample.get("schemaVersion") or 0) != 3:
                wrong_schema += 1
                continue

            env = sample.get("observationEnvelope") if isinstance(sample.get("observationEnvelope"), dict) else None
            obs = env.get("observation") if isinstance(env, dict) else None
            if not isinstance(obs, dict):
                missing_observation += 1
                continue

            entities = obs.get("compactEntities") if isinstance(obs.get("compactEntities"), list) else None
            if entities is None:
                missing_entities += 1
                continue

            entity_count = len(entities)
            entity_count_total += entity_count
            entity_count_max = max(entity_count_max, entity_count)

            for entity in entities:
                if not isinstance(entity, dict):
                    continue
                type_counts[str(entity.get("type") or "UNKNOWN")] += 1

            target_id = str(((sample.get("policyTargetV2") or {}).get("id") or "")).strip()
            candidates = sample.get("candidates") if isinstance(sample.get("candidates"), list) else []
            candidate_ids = {
                str((c.get("id") if isinstance(c, dict) else "") or "").strip()
                for c in candidates
                if isinstance(c, dict)
            }
            if target_id and target_id not in candidate_ids:
                target_missing_from_candidates += 1

    valid_obs = scanned - wrong_schema - missing_observation - missing_entities
    summary = {
        "scanned": scanned,
        "wrongSchema": wrong_schema,
        "missingObservation": missing_observation,
        "missingCompactEntities": missing_entities,
        "validObservationSamples": max(0, valid_obs),
        "targetMissingFromCandidates": target_missing_from_candidates,
        "avgEntityCount": (entity_count_total / valid_obs) if valid_obs > 0 else 0.0,
        "maxEntityCount": entity_count_max,
        "entityTypeCounts": dict(type_counts),
    }

    print(json.dumps(summary, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
