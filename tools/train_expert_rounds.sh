#!/usr/bin/env bash
set -euo pipefail

if [[ "$#" -ne 2 && "$#" -ne 3 ]]; then
  echo "Usage: $0 <rounds> <concurrency> [completed_round]" >&2
  exit 1
fi

ROUNDS="$1"
CONCURRENCY="$2"

if [[ "$#" -eq 3 ]]; then
  COMPLETED_ROUND="$3"
else
  COMPLETED_ROUND="0"
fi

if ! [[ "${ROUNDS}" =~ ^[1-9][0-9]*$ ]]; then
  echo "Invalid rounds: ${ROUNDS}. It must be a positive integer." >&2
  exit 1
fi

if ! [[ "${CONCURRENCY}" =~ ^[1-9][0-9]*$ ]]; then
  echo "Invalid concurrency: ${CONCURRENCY}. It must be a positive integer." >&2
  exit 1
fi

if ! [[ "${COMPLETED_ROUND}" =~ ^[0-9]+$ ]]; then
  echo "Invalid completed_round: ${COMPLETED_ROUND}. It must be a non-negative integer." >&2
  exit 1
fi

if (( COMPLETED_ROUND > ROUNDS )); then
  echo "Invalid completed_round: ${COMPLETED_ROUND}. It cannot be greater than rounds (${ROUNDS})." >&2
  exit 1
fi

if (( COMPLETED_ROUND == ROUNDS )); then
  echo "Nothing to run: completed_round (${COMPLETED_ROUND}) already equals rounds (${ROUNDS})."
  exit 0
fi

if (( COMPLETED_ROUND == 0 )); then
  RESUME="0"
  START_ROUND="1"
else
  RESUME="1"
  START_ROUND="$((COMPLETED_ROUND + 1))"
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${REPO_ROOT}"

# Keep iterative runs reproducible from a clean state.
if [[ "${RESUME}" != "1" ]]; then
  rm -rf tools/_iterative_expert
fi

MODE=expert \
MODEL_FAMILY="${MODEL_FAMILY:-entity-transformer}" \
ENTITY_DIM="${ENTITY_DIM:-128}" \
ENTITY_LAYERS="${ENTITY_LAYERS:-4}" \
ENTITY_HEADS="${ENTITY_HEADS:-4}" \
ENTITY_FF_DIM="${ENTITY_FF_DIM:-384}" \
ENTITY_DROPOUT="${ENTITY_DROPOUT:-0.10}" \
MAX_STATE_ENTITIES="${MAX_STATE_ENTITIES:-192}" \
MAX_CANDIDATE_ACTIONS="${MAX_CANDIDATE_ACTIONS:-40}" \
ENTITY_MAX_SAMPLES="${ENTITY_MAX_SAMPLES:-250000}" \
EXPERT_TRAIN_EPOCHS="${EXPERT_TRAIN_EPOCHS:-3}" \
EXPERT_TRAIN_BATCH_SIZE="${EXPERT_TRAIN_BATCH_SIZE:-48}" \
EXPERT_TRAIN_LEARNING_RATE="${EXPERT_TRAIN_LEARNING_RATE:-8e-5}" \
EXPERT_TRAIN_VISIT_LOSS_WEIGHT="${EXPERT_TRAIN_VISIT_LOSS_WEIGHT:-0.40}" \
EXPERT_SELF_PLAY_SIMULATIONS="${EXPERT_SELF_PLAY_SIMULATIONS:-128}" \
EXPERT_SELF_PLAY_MAX_DEPTH="${EXPERT_SELF_PLAY_MAX_DEPTH:-6}" \
EXPERT_SELF_PLAY_CPUCT="${EXPERT_SELF_PLAY_CPUCT:-1.2}" \
EXPERT_SELF_PLAY_ROLLOUT_DEPTH="${EXPERT_SELF_PLAY_ROLLOUT_DEPTH:-0}" \
MIX_NEW_RATIO="${MIX_NEW_RATIO:-0.5}" \
MIX_RECENT_RATIO="${MIX_RECENT_RATIO:-0.3}" \
MIX_CURATED_RATIO="${MIX_CURATED_RATIO:-0.2}" \
EXPERT_SELF_PLAY_MCTS_ROOT_NOISE_ALPHA="${EXPERT_SELF_PLAY_MCTS_ROOT_NOISE_ALPHA:-0.24}" \
EXPERT_SELF_PLAY_MCTS_ROOT_NOISE_WEIGHT="${EXPERT_SELF_PLAY_MCTS_ROOT_NOISE_WEIGHT:-0.22}" \
ROUNDS="${ROUNDS}" START_ROUND="${START_ROUND}" CONCURRENCY="${CONCURRENCY}" \
RESET_REPLAY_ON_FRESH_START="${RESET_REPLAY_ON_FRESH_START:-1}" \
SETI_ENTITY_MODEL_BATCH_SIZE=8 \
SETI_ENTITY_MODEL_MAX_CONCURRENT_BATCHES=1 \
SETI_ENTITY_MODEL_BATCH_DELAY_MS=1 \
SETI_ENTITY_MODEL_SERVER_COUNT=5 \
./tools/iterative_self_play_training.sh

