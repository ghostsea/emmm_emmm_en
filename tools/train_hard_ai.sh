#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${REPO_ROOT}"
source "${REPO_ROOT}/tools/cuda_env.sh"
seti_export_cuda_library_path "${REPO_ROOT}"

PYTHON_BIN="${PYTHON_BIN:-${REPO_ROOT}/.venv/bin/python}"
MODEL_FAMILY="${MODEL_FAMILY:-tiny-resnet}"
INPUT_DATASET="${1:-tools/_self_play_hard_samples.jsonl}"
MODEL_JSON="${2:-tools/_tmp_bc_model.json}"
MODEL_JS="${3:-randomizer/game/ai/trained-models.js}"
MODEL_ONNX="${4:-randomizer/game/ai/trained-models.onnx}"
USE_SELF_PLAY_DATASET="${USE_SELF_PLAY_DATASET:-1}"
SELF_PLAY_BACKEND="${SELF_PLAY_BACKEND:-app-full}"
SELF_PLAY_GAMES="${SELF_PLAY_GAMES:-200}"
SELF_PLAY_SEED="${SELF_PLAY_SEED:-hard-self-play}"
SELF_PLAY_ACTIVE_PLAYER_COUNT="${SELF_PLAY_ACTIVE_PLAYER_COUNT:-4}"
SELF_PLAY_MAX_STEPS="${SELF_PLAY_MAX_STEPS:-10000}"
SELF_PLAY_CONCURRENCY="${SELF_PLAY_CONCURRENCY:-1}"
SELF_PLAY_EXPLORATION_EPSILON="${SELF_PLAY_EXPLORATION_EPSILON:-0.10}"
SELF_PLAY_EXPLORATION_TEMPERATURE="${SELF_PLAY_EXPLORATION_TEMPERATURE:-1.15}"
SELF_PLAY_MCTS_ROOT_NOISE_ENABLED="${SELF_PLAY_MCTS_ROOT_NOISE_ENABLED:-1}"
SELF_PLAY_MCTS_ROOT_NOISE_ALPHA="${SELF_PLAY_MCTS_ROOT_NOISE_ALPHA:-0.30}"
SELF_PLAY_MCTS_ROOT_NOISE_WEIGHT="${SELF_PLAY_MCTS_ROOT_NOISE_WEIGHT:-0.25}"
SELF_PLAY_SIMULATIONS="${SELF_PLAY_SIMULATIONS:-192}"
SELF_PLAY_MAX_DEPTH="${SELF_PLAY_MAX_DEPTH:-6}"
SELF_PLAY_CPUCT="${SELF_PLAY_CPUCT:-1.5}"
SELF_PLAY_ROLLOUT_DEPTH="${SELF_PLAY_ROLLOUT_DEPTH:-5}"
SEED="${HARD_TRAIN_SEED:-hard-bootstrap}"
VALID_RATIO="${HARD_TRAIN_VALIDATION_RATIO:-0.25}"
ROUND_BUCKET_SIZE="${HARD_TRAIN_ROUND_BUCKET_SIZE:-2}"
EPOCHS="${HARD_TRAIN_EPOCHS:-36}"
BATCH_SIZE="${HARD_TRAIN_BATCH_SIZE:-192}"
LEARNING_RATE="${HARD_TRAIN_LEARNING_RATE:-1.5e-4}"
WEIGHT_DECAY="${HARD_TRAIN_WEIGHT_DECAY:-3e-4}"
GRAD_CLIP="${HARD_TRAIN_GRAD_CLIP:-0.8}"
HIGH_FREQ_DOWNSAMPLE_POWER="${HARD_TRAIN_HIGH_FREQ_DOWNSAMPLE_POWER:-0.55}"
HIGH_FREQ_MIN_KEEP_PROB="${HARD_TRAIN_HIGH_FREQ_MIN_KEEP_PROB:-0.15}"
LOW_FREQ_WEIGHT_ALPHA="${HARD_TRAIN_LOW_FREQ_WEIGHT_ALPHA:-0.65}"
CRITICAL_ACTIONS="${HARD_TRAIN_CRITICAL_ACTIONS:-launch,orbit,land,scan,researchTech,industry,playCard}"
CRITICAL_ACTION_BOOST="${HARD_TRAIN_CRITICAL_ACTION_BOOST:-1.50}"
TINY_RESNET_CHANNELS="${HARD_TRAIN_TINY_RESNET_CHANNELS:-96}"
TINY_RESNET_BLOCKS="${HARD_TRAIN_TINY_RESNET_BLOCKS:-4}"
TINY_RESNET_DROPOUT="${HARD_TRAIN_TINY_RESNET_DROPOUT:-0.10}"
VALUE_LOSS_WEIGHT="${HARD_TRAIN_VALUE_LOSS_WEIGHT:-0.35}"
VISIT_LOSS_WEIGHT="${HARD_TRAIN_VISIT_LOSS_WEIGHT:-0.30}"
LABEL_SMOOTHING="${HARD_TRAIN_LABEL_SMOOTHING:-0.03}"
ENTITY_DIM="${ENTITY_DIM:-96}"
ENTITY_LAYERS="${ENTITY_LAYERS:-3}"
ENTITY_HEADS="${ENTITY_HEADS:-4}"
ENTITY_FF_DIM="${ENTITY_FF_DIM:-256}"
ENTITY_DROPOUT="${ENTITY_DROPOUT:-0.10}"
MAX_STATE_ENTITIES="${MAX_STATE_ENTITIES:-160}"
MAX_CANDIDATE_ACTIONS="${MAX_CANDIDATE_ACTIONS:-32}"
ENTITY_MAX_SAMPLES="${ENTITY_MAX_SAMPLES:-220000}"

if [[ "${USE_SELF_PLAY_DATASET}" == "1" ]]; then
  echo "[0/4] Generating self-play dataset for hard training..."
  SELF_PLAY_ARGS=(
    --backend "${SELF_PLAY_BACKEND}"
    --seed "${SELF_PLAY_SEED}"
    --games "${SELF_PLAY_GAMES}"
    --activePlayerCount "${SELF_PLAY_ACTIVE_PLAYER_COUNT}"
    --maxSteps "${SELF_PLAY_MAX_STEPS}"
    --concurrency "${SELF_PLAY_CONCURRENCY}"
    --explorationEpsilon "${SELF_PLAY_EXPLORATION_EPSILON}"
    --explorationTemperature "${SELF_PLAY_EXPLORATION_TEMPERATURE}"
    --mctsRootNoiseEnabled "${SELF_PLAY_MCTS_ROOT_NOISE_ENABLED}"
    --mctsRootNoiseAlpha "${SELF_PLAY_MCTS_ROOT_NOISE_ALPHA}"
    --mctsRootNoiseWeight "${SELF_PLAY_MCTS_ROOT_NOISE_WEIGHT}"
    --simulations "${SELF_PLAY_SIMULATIONS}"
    --maxDepth "${SELF_PLAY_MAX_DEPTH}"
    --cpuct "${SELF_PLAY_CPUCT}"
    --rolloutDepth "${SELF_PLAY_ROLLOUT_DEPTH}"
    --out "${INPUT_DATASET}"
    --summaryOut "tools/_self_play_hard_summary.json"
  )
  node tools/generate_self_play_dataset.js \
    "${SELF_PLAY_ARGS[@]}"
fi

if [[ ! -f "${INPUT_DATASET}" ]]; then
  echo "Input dataset not found: ${INPUT_DATASET}" >&2
  exit 1
fi

echo "[1/4] Training hard behavior clone model..."
if [[ "${MODEL_FAMILY}" == "entity-transformer" ]]; then
  "${PYTHON_BIN}" tools/train_entity_transformer_policy.py \
    --input "${INPUT_DATASET}" \
    --output "${MODEL_JSON}" \
    --output-js "${MODEL_JS}" \
    --output-onnx "${MODEL_ONNX}" \
    --model-name HARD_BEHAVIOR_CLONE_MODEL \
    --global-name SetiAITrainedModels \
    --getter-name getHardBehaviorCloneModel \
    --seed "${SEED}" \
    --validation-ratio "${VALID_RATIO}" \
    --max-samples "${ENTITY_MAX_SAMPLES}" \
    --max-state-entities "${MAX_STATE_ENTITIES}" \
    --max-candidate-actions "${MAX_CANDIDATE_ACTIONS}" \
    --entity-dim "${ENTITY_DIM}" \
    --entity-layers "${ENTITY_LAYERS}" \
    --entity-heads "${ENTITY_HEADS}" \
    --entity-ff-dim "${ENTITY_FF_DIM}" \
    --dropout "${ENTITY_DROPOUT}" \
    --epochs "${EPOCHS}" \
    --batch-size "${BATCH_SIZE}" \
    --learning-rate "${LEARNING_RATE}" \
    --weight-decay "${WEIGHT_DECAY}" \
    --grad-clip "${GRAD_CLIP}" \
    --value-loss-weight "${VALUE_LOSS_WEIGHT}" \
    --visit-loss-weight "${VISIT_LOSS_WEIGHT}" \
    --label-smoothing "${LABEL_SMOOTHING}"
else
  "${PYTHON_BIN}" tools/train_bc_policy.py \
    --input "${INPUT_DATASET}" \
    --output "${MODEL_JSON}" \
    --output-js "${MODEL_JS}" \
    --output-onnx "${MODEL_ONNX}" \
    --model-name HARD_BEHAVIOR_CLONE_MODEL \
    --seed "${SEED}" \
    --validation-ratio "${VALID_RATIO}" \
    --round-bucket-size "${ROUND_BUCKET_SIZE}" \
    --epochs "${EPOCHS}" \
    --batch-size "${BATCH_SIZE}" \
    --learning-rate "${LEARNING_RATE}" \
    --weight-decay "${WEIGHT_DECAY}" \
    --grad-clip "${GRAD_CLIP}" \
    --high-freq-downsample-power "${HIGH_FREQ_DOWNSAMPLE_POWER}" \
    --high-freq-min-keep-prob "${HIGH_FREQ_MIN_KEEP_PROB}" \
    --low-freq-weight-alpha "${LOW_FREQ_WEIGHT_ALPHA}" \
    --critical-actions "${CRITICAL_ACTIONS}" \
    --critical-action-boost "${CRITICAL_ACTION_BOOST}" \
    --tiny-resnet-channels "${TINY_RESNET_CHANNELS}" \
    --tiny-resnet-blocks "${TINY_RESNET_BLOCKS}" \
    --tiny-resnet-dropout "${TINY_RESNET_DROPOUT}" \
    --value-loss-weight "${VALUE_LOSS_WEIGHT}" \
    --visit-loss-weight "${VISIT_LOSS_WEIGHT}" \
    --label-smoothing "${LABEL_SMOOTHING}"
fi

echo "[2/4] Model summary"
jq '{totalRecords, trainRecordCount, validationRecordCount, trainAccuracy: .metrics.trainAccuracy, validationAccuracy: .metrics.validationAccuracy}' "${MODEL_JSON}"

echo "[3/4] Syntax checks"
node --check randomizer/game/ai/trained-models.js
node --check randomizer/game/ai/index.js
node --check randomizer/app/ai-controller.js
test -f "${MODEL_ONNX}"
"${PYTHON_BIN}" -m py_compile tools/train_bc_policy.py

echo "[4/4] AI regression tests"
node --check randomizer/game/ai/ai.test.js
node randomizer/game/ai/ai.test.js

echo "Hard AI training + runtime integration completed."
