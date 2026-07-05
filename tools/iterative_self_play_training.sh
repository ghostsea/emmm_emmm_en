#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${REPO_ROOT}"
source "${REPO_ROOT}/tools/cuda_env.sh"
seti_export_cuda_library_path "${REPO_ROOT}"

MODE="${MODE:-hard}"
ROUNDS="${ROUNDS:-3}"
START_ROUND="${START_ROUND:-1}"
CONCURRENCY="${CONCURRENCY:-20}"
SELF_PLAY_BACKEND="${SELF_PLAY_BACKEND:-app-full}"
SELF_PLAY_MAX_STEPS="${SELF_PLAY_MAX_STEPS:-10000}"
SELF_PLAY_EVAL_MAX_STEPS="${SELF_PLAY_EVAL_MAX_STEPS:-${SELF_PLAY_MAX_STEPS}}"
TRAIN_GAMES="${TRAIN_GAMES:-0}"
EVAL_GAMES="${EVAL_GAMES:-100}"
EXPLORATION_EPSILON="${EXPLORATION_EPSILON:-0.08}"
EXPLORATION_TEMPERATURE="${EXPLORATION_TEMPERATURE:-1.1}"
MIX_OLD_RATIO="${MIX_OLD_RATIO:-0.5}"
MIX_NEW_RATIO="${MIX_NEW_RATIO:-0.5}"
MIX_RECENT_RATIO="${MIX_RECENT_RATIO:-0.3}"
MIX_CURATED_RATIO="${MIX_CURATED_RATIO:-0.2}"
REPLAY_MAX_ROWS="${REPLAY_MAX_ROWS:-220000}"
REPLAY_MAX_GAMES="${REPLAY_MAX_GAMES:-2400}"
REPLAY_MAX_GAMES_PER_ROUND="${REPLAY_MAX_GAMES_PER_ROUND:-180}"
REPLAY_ANCHOR_GAMES_PER_ROUND="${REPLAY_ANCHOR_GAMES_PER_ROUND:-8}"
REPLAY_RECENT_ROUNDS="${REPLAY_RECENT_ROUNDS:-6}"
REPLAY_AGE_HALF_LIFE_ROUNDS="${REPLAY_AGE_HALF_LIFE_ROUNDS:-6}"
REPLAY_MAX_PASS_RATIO="${REPLAY_MAX_PASS_RATIO:-0.65}"
REPLAY_SHIFT_ALERT_THRESHOLD="${REPLAY_SHIFT_ALERT_THRESHOLD:-0.18}"
REPLAY_SINGLE_SOURCE_RATIO_ALERT="${REPLAY_SINGLE_SOURCE_RATIO_ALERT:-0.7}"
SEED_BASE="${SEED_BASE:-iterative-self-play}"
PYTHON_BIN="${PYTHON_BIN:-${REPO_ROOT}/.venv/bin/python}"
MODEL_FAMILY="${MODEL_FAMILY:-entity-transformer}"
ENTITY_DIM="${ENTITY_DIM:-128}"
ENTITY_LAYERS="${ENTITY_LAYERS:-4}"
ENTITY_HEADS="${ENTITY_HEADS:-4}"
ENTITY_FF_DIM="${ENTITY_FF_DIM:-384}"
ENTITY_DROPOUT="${ENTITY_DROPOUT:-0.10}"
MAX_STATE_ENTITIES="${MAX_STATE_ENTITIES:-192}"
MAX_CANDIDATE_ACTIONS="${MAX_CANDIDATE_ACTIONS:-40}"
ENTITY_MAX_SAMPLES="${ENTITY_MAX_SAMPLES:-250000}"
RESET_REPLAY_ON_FRESH_START="${RESET_REPLAY_ON_FRESH_START:-0}"
ENTITY_ACCEPT_WARMUP_ROUNDS="${ENTITY_ACCEPT_WARMUP_ROUNDS:-3}"
ENTITY_ACCEPT_MIN_SCORE="${ENTITY_ACCEPT_MIN_SCORE:-8}"
ENTITY_ACCEPT_MAX_REGRESSION="${ENTITY_ACCEPT_MAX_REGRESSION:-12}"
ENTITY_ACCEPT_SCORE_TOLERANCE="${ENTITY_ACCEPT_SCORE_TOLERANCE:-1.0}"
ENTITY_FRESH_START_BASELINE="${ENTITY_FRESH_START_BASELINE:-legacy}"
ENTITY_FRESH_START_BASELINE_JSON="${ENTITY_FRESH_START_BASELINE_JSON:-}"

if [[ "${MODE}" != "hard" && "${MODE}" != "expert" ]]; then
  echo "MODE must be hard or expert" >&2
  exit 1
fi

if ! [[ "${START_ROUND}" =~ ^[1-9][0-9]*$ ]]; then
  echo "START_ROUND must be a positive integer" >&2
  exit 1
fi

if (( START_ROUND > ROUNDS )); then
  echo "START_ROUND (${START_ROUND}) cannot be greater than ROUNDS (${ROUNDS})" >&2
  exit 1
fi

if ! [[ "${EVAL_GAMES}" =~ ^[1-9][0-9]*$ ]]; then
  echo "EVAL_GAMES must be a positive integer (>=1). Got: ${EVAL_GAMES}" >&2
  exit 1
fi

USE_LEGACY_MIX=0
RATIO_CHECK_OUT="$(${PYTHON_BIN} - <<'PY' "${MIX_NEW_RATIO}" "${MIX_RECENT_RATIO}" "${MIX_CURATED_RATIO}"
import sys
values = [float(sys.argv[1]), float(sys.argv[2]), float(sys.argv[3])]
if any(v < 0 for v in values):
    print("ERR:ratio must be non-negative")
    raise SystemExit(1)
total = sum(values)
if abs(total - 1.0) > 1e-6:
    print(f"ERR:three-source ratios must sum to 1.0, got {total}")
    raise SystemExit(1)
print("OK")
PY
)" || {
  echo "${RATIO_CHECK_OUT}" >&2
  exit 1
}

if [[ "${MODE}" == "hard" ]]; then
  MODEL_JS="randomizer/game/ai/trained-models.js"
  MODEL_JSON="tools/_tmp_bc_model.json"
  MODEL_NAME="HARD_BEHAVIOR_CLONE_MODEL"
  GLOBAL_NAME="SetiAITrainedModels"
  GETTER_NAME="getHardBehaviorCloneModel"
  ROUND_BUCKET_SIZE="${HARD_TRAIN_ROUND_BUCKET_SIZE:-2}"
  EPOCHS="${HARD_TRAIN_EPOCHS:-40}"
  BATCH_SIZE="${HARD_TRAIN_BATCH_SIZE:-256}"
  LEARNING_RATE="${HARD_TRAIN_LEARNING_RATE:-2e-4}"
  WEIGHT_DECAY="${HARD_TRAIN_WEIGHT_DECAY:-1e-4}"
  GRAD_CLIP="${HARD_TRAIN_GRAD_CLIP:-1.0}"
  VALID_RATIO="${HARD_TRAIN_VALIDATION_RATIO:-0.25}"
  HIGH_FREQ_DOWNSAMPLE_POWER="${HARD_TRAIN_HIGH_FREQ_DOWNSAMPLE_POWER:-0.45}"
  HIGH_FREQ_MIN_KEEP_PROB="${HARD_TRAIN_HIGH_FREQ_MIN_KEEP_PROB:-0.2}"
  LOW_FREQ_WEIGHT_ALPHA="${HARD_TRAIN_LOW_FREQ_WEIGHT_ALPHA:-0.5}"
  CRITICAL_ACTIONS="${HARD_TRAIN_CRITICAL_ACTIONS:-launch,orbit,land,scan,researchTech,industry,playCard}"
  CRITICAL_ACTION_BOOST="${HARD_TRAIN_CRITICAL_ACTION_BOOST:-1.35}"
  VISIT_LOSS_WEIGHT="${HARD_TRAIN_VISIT_LOSS_WEIGHT:-0.30}"
  SELF_PLAY_EXPLORATION_EPSILON="${HARD_SELF_PLAY_EXPLORATION_EPSILON:-0.10}"
  SELF_PLAY_EXPLORATION_TEMPERATURE="${HARD_SELF_PLAY_EXPLORATION_TEMPERATURE:-1.15}"
  SELF_PLAY_MCTS_ROOT_NOISE_ENABLED="${HARD_SELF_PLAY_MCTS_ROOT_NOISE_ENABLED:-1}"
  SELF_PLAY_MCTS_ROOT_NOISE_ALPHA="${HARD_SELF_PLAY_MCTS_ROOT_NOISE_ALPHA:-0.30}"
  SELF_PLAY_MCTS_ROOT_NOISE_WEIGHT="${HARD_SELF_PLAY_MCTS_ROOT_NOISE_WEIGHT:-0.25}"
  DIFFICULTY="${DIFFICULTY:-hard}"
  DEFAULT_GAMES=200
else
  MODEL_JS="randomizer/game/ai/expert-trained-models.js"
  MODEL_JSON="tools/_tmp_expert_bc_model.json"
  MODEL_NAME="EXPERT_BEHAVIOR_CLONE_MODEL"
  GLOBAL_NAME="SetiAIExpertTrainedModels"
  GETTER_NAME="getExpertBehaviorCloneModel"
  ROUND_BUCKET_SIZE="${EXPERT_TRAIN_ROUND_BUCKET_SIZE:-1}"
  EPOCHS="${EXPERT_TRAIN_EPOCHS:-10}"
  BATCH_SIZE="${EXPERT_TRAIN_BATCH_SIZE:-384}"
  LEARNING_RATE="${EXPERT_TRAIN_LEARNING_RATE:-1.5e-4}"
  WEIGHT_DECAY="${EXPERT_TRAIN_WEIGHT_DECAY:-1e-4}"
  GRAD_CLIP="${EXPERT_TRAIN_GRAD_CLIP:-1.0}"
  VALID_RATIO="${EXPERT_TRAIN_VALIDATION_RATIO:-0.2}"
  HIGH_FREQ_DOWNSAMPLE_POWER="${EXPERT_TRAIN_HIGH_FREQ_DOWNSAMPLE_POWER:-0.5}"
  HIGH_FREQ_MIN_KEEP_PROB="${EXPERT_TRAIN_HIGH_FREQ_MIN_KEEP_PROB:-0.15}"
  LOW_FREQ_WEIGHT_ALPHA="${EXPERT_TRAIN_LOW_FREQ_WEIGHT_ALPHA:-0.6}"
  CRITICAL_ACTIONS="${EXPERT_TRAIN_CRITICAL_ACTIONS:-launch,orbit,land,scan,researchTech,industry,playCard,finalScoreMark}"
  CRITICAL_ACTION_BOOST="${EXPERT_TRAIN_CRITICAL_ACTION_BOOST:-1.45}"
  VISIT_LOSS_WEIGHT="${EXPERT_TRAIN_VISIT_LOSS_WEIGHT:-0.30}"
  SELF_PLAY_EXPLORATION_EPSILON="${EXPERT_SELF_PLAY_EXPLORATION_EPSILON:-0.06}"
  SELF_PLAY_EXPLORATION_TEMPERATURE="${EXPERT_SELF_PLAY_EXPLORATION_TEMPERATURE:-1.08}"
  SELF_PLAY_MCTS_ROOT_NOISE_ENABLED="${EXPERT_SELF_PLAY_MCTS_ROOT_NOISE_ENABLED:-1}"
  SELF_PLAY_MCTS_ROOT_NOISE_ALPHA="${EXPERT_SELF_PLAY_MCTS_ROOT_NOISE_ALPHA:-0.20}"
  SELF_PLAY_MCTS_ROOT_NOISE_WEIGHT="${EXPERT_SELF_PLAY_MCTS_ROOT_NOISE_WEIGHT:-0.18}"
  SELF_PLAY_SIMULATIONS="${EXPERT_SELF_PLAY_SIMULATIONS:-128}"
  SELF_PLAY_MAX_DEPTH="${EXPERT_SELF_PLAY_MAX_DEPTH:-6}"
  SELF_PLAY_CPUCT="${EXPERT_SELF_PLAY_CPUCT:-1.2}"
  SELF_PLAY_ROLLOUT_DEPTH="${EXPERT_SELF_PLAY_ROLLOUT_DEPTH:-0}"
  DIFFICULTY="${DIFFICULTY:-expert}"
  DEFAULT_GAMES=400
fi

if [[ "${TRAIN_GAMES}" == "0" ]]; then
  TRAIN_GAMES="${DEFAULT_GAMES}"
fi

WORK_DIR="tools/_iterative_${MODE}"
mkdir -p "${WORK_DIR}"

ACCEPTED_JS="${WORK_DIR}/accepted-model.js"
ACCEPTED_JSON="${WORK_DIR}/accepted-model.json"
REPLAY_DATASET="${WORK_DIR}/replay-dataset.jsonl"
RUNTIME_BACKUP_JS="${WORK_DIR}/runtime-model.backup.js"
RUNTIME_BACKUP_JSON="${WORK_DIR}/runtime-model.backup.json"
RUNTIME_MODEL_DIR="$(dirname "${MODEL_JS}")"

create_legacy_fresh_start_baseline() {
  local source_json="${ENTITY_FRESH_START_BASELINE_JSON}"
  if [[ -z "${source_json}" ]]; then
    if [[ -f "tools/_iterative_hard/round-4.candidate.json" ]]; then
      source_json="tools/_iterative_hard/round-4.candidate.json"
    elif [[ -f "tools/_tmp_bc_model.json" ]]; then
      source_json="tools/_tmp_bc_model.json"
    fi
  fi

  if [[ -z "${source_json}" || ! -f "${source_json}" ]]; then
    echo "Missing legacy fresh-start baseline JSON; set ENTITY_FRESH_START_BASELINE_JSON=/path/to/non-ONNX-model.json" >&2
    return 1
  fi

  "${PYTHON_BIN}" - <<'PY' "${source_json}" "${ACCEPTED_JSON}" "${ACCEPTED_JS}" "${MODEL_NAME}" "${GLOBAL_NAME}" "${GETTER_NAME}" "${MODE}"
import json
import sys
from pathlib import Path

source_json, accepted_json, accepted_js, model_name, global_name, getter_name, mode = sys.argv[1:]
with open(source_json, 'r', encoding='utf-8') as f:
    model = json.load(f)

if model.get('modelType') == 'pytorch-entity-transformer-v1':
    raise SystemExit(f"Fresh-start legacy baseline must not be an entity-transformer model: {source_json}")

model['modelFamily'] = f'legacy-{mode}-fresh-start-baseline'
model['fallbackSource'] = source_json
model.pop('onnx', None)

json_text = json.dumps(model, ensure_ascii=False, indent=2)
Path(accepted_json).parent.mkdir(parents=True, exist_ok=True)
Path(accepted_json).write_text(json_text + '\n', encoding='utf-8')

js_text = (
    '(function (root, factory) {\n'
    '  "use strict";\n\n'
    '  const api = factory();\n\n'
    '  if (typeof module === "object" && module.exports) {\n'
    '    module.exports = api;\n'
    '  }\n\n'
    f'  root.{global_name} = api;\n'
    '})(typeof globalThis !== "undefined" ? globalThis : window, function () {\n'
    '  "use strict";\n\n'
    f'  const {model_name} = Object.freeze({json_text});\n\n'
    '  return Object.freeze({\n'
    f'    {model_name},\n'
    f'    {getter_name}: () => {model_name},\n'
    '  });\n'
    '});\n'
)
Path(accepted_js).parent.mkdir(parents=True, exist_ok=True)
Path(accepted_js).write_text(js_text, encoding='utf-8')
print(f"Fresh-start baseline: source={source_json} modelType={model.get('modelType')}")
PY
}

cp "${MODEL_JS}" "${RUNTIME_BACKUP_JS}"
cp "${MODEL_JSON}" "${RUNTIME_BACKUP_JSON}"

if (( START_ROUND == 1 )); then
  if [[ "${MODEL_FAMILY}" == "entity-transformer" && "${ENTITY_FRESH_START_BASELINE}" == "legacy" ]]; then
    create_legacy_fresh_start_baseline
  else
    cp "${MODEL_JS}" "${ACCEPTED_JS}"
    cp "${MODEL_JSON}" "${ACCEPTED_JSON}"
  fi
else
  if [[ ! -f "${ACCEPTED_JS}" || ! -f "${ACCEPTED_JSON}" ]]; then
    echo "Resume requested from round ${START_ROUND}, but accepted model is missing in ${WORK_DIR}" >&2
    echo "Expected files: ${ACCEPTED_JS}, ${ACCEPTED_JSON}" >&2
    exit 1
  fi
  echo "Resuming iterative training from round ${START_ROUND}/${ROUNDS} using ${WORK_DIR}"
fi

if (( START_ROUND == 1 )) && [[ "${RESET_REPLAY_ON_FRESH_START}" == "1" ]]; then
  : > "${REPLAY_DATASET}"
  echo "Replay dataset reset for fresh start: ${REPLAY_DATASET}"
fi

restore_runtime() {
  cp "${RUNTIME_BACKUP_JS}" "${MODEL_JS}"
  cp "${RUNTIME_BACKUP_JSON}" "${MODEL_JSON}"
}

trap restore_runtime EXIT

copy_model_onnx_to_runtime() {
  local model_json="$1"
  local source_dir="$2"
  local meta model_type file_name source_path target_path source_data_path target_data_path
  meta="$(${PYTHON_BIN} - <<'PY' "${model_json}"
import json
import sys
path = sys.argv[1]
try:
    with open(path, 'r', encoding='utf-8') as f:
        model = json.load(f)
except Exception:
    print("\t")
    raise SystemExit(0)
print(f"{model.get('modelType') or ''}\t{((model.get('onnx') or {}).get('fileName') or '')}")
PY
)"
  model_type="${meta%%$'\t'*}"
  file_name="${meta#*$'\t'}"
  if [[ "${model_type}" != "pytorch-entity-transformer-v1" || -z "${file_name}" ]]; then
    return 0
  fi

  source_path=""
  if [[ -f "${source_dir}/${file_name}" ]]; then
    source_path="${source_dir}/${file_name}"
  elif [[ -f "$(dirname "${model_json}")/${file_name}" ]]; then
    source_path="$(dirname "${model_json}")/${file_name}"
  elif [[ -f "${WORK_DIR}/${file_name}" ]]; then
    source_path="${WORK_DIR}/${file_name}"
  elif [[ -f "${RUNTIME_MODEL_DIR}/${file_name}" ]]; then
    source_path="${RUNTIME_MODEL_DIR}/${file_name}"
  fi

  if [[ -z "${source_path}" ]]; then
    echo "Missing ONNX artifact for entity model: ${file_name} (model=${model_json})" >&2
    return 1
  fi

  target_path="${RUNTIME_MODEL_DIR}/${file_name}"
  if [[ "$(realpath -m "${source_path}")" != "$(realpath -m "${target_path}")" ]]; then
    cp "${source_path}" "${target_path}"
  fi

  source_data_path="${source_path}.data"
  target_data_path="${target_path}.data"
  if [[ -f "${source_data_path}" && "$(realpath -m "${source_data_path}")" != "$(realpath -m "${target_data_path}")" ]]; then
    cp "${source_data_path}" "${target_data_path}"
  fi
}

promote_candidate_onnx_to_accepted() {
  local accepted_json="$1"
  local accepted_js="$2"
  local candidate_onnx="$3"
  if [[ ! -f "${candidate_onnx}" ]]; then
    return 0
  fi

  local accepted_onnx="${WORK_DIR}/accepted-model.onnx"
  cp "${candidate_onnx}" "${accepted_onnx}"
  if [[ -f "${candidate_onnx}.data" ]]; then
    cp "${candidate_onnx}.data" "${accepted_onnx}.data"
  fi

  "${PYTHON_BIN}" - <<'PY' "${accepted_json}" "${accepted_js}"
import json
import sys
json_path, js_path = sys.argv[1], sys.argv[2]
with open(json_path, 'r', encoding='utf-8') as f:
    model = json.load(f)
onnx = model.get('onnx') if isinstance(model.get('onnx'), dict) else None
if not onnx:
    raise SystemExit(0)
old_name = str(onnx.get('fileName') or '')
onnx['fileName'] = 'accepted-model.onnx'
with open(json_path, 'w', encoding='utf-8') as f:
    json.dump(model, f, ensure_ascii=False, indent=2)
    f.write('\n')
if old_name:
    with open(js_path, 'r', encoding='utf-8') as f:
        text = f.read()
    text = text.replace(old_name, 'accepted-model.onnx')
    with open(js_path, 'w', encoding='utf-8') as f:
        f.write(text)
PY
}

extract_avg_score() {
  local summary_file="$1"
  "${PYTHON_BIN}" - <<'PY' "${summary_file}"
import json
import sys
p = sys.argv[1]
with open(p, 'r', encoding='utf-8') as f:
    data = json.load(f)
summary = data.get('summary', {}) or {}
ok = summary.get('ok') is not False
if not ok:
  print(-1000000000.0)
  raise SystemExit(0)
value = summary.get('averageFinalScore', 0)
print(float(value or 0.0))
PY
}

collect_stage8_checks() {
  local summary_file="$1"
  local report_file="$2"
  local train_json="$3"
  "${PYTHON_BIN}" - <<'PY' "${summary_file}" "${report_file}" "${train_json}"
import json
import math
import sys
summary_file, report_file, train_file = sys.argv[1], sys.argv[2], sys.argv[3]

def load_json(path):
  try:
    with open(path, 'r', encoding='utf-8') as f:
      return json.load(f)
  except Exception:
    return {}

summary = load_json(summary_file)
report = load_json(report_file)
train = load_json(train_file)

obs_missing = int(((summary.get('summary') or {}).get('observationMissingCount') or 0))
ingest = train.get('ingestSummary') or {}
candidate_trunc = int((ingest.get('candidateTruncationCount') or 0))
entity_trunc = int((ingest.get('stateTruncationCount') or 0))
samples = max(1, int((ingest.get('seenSamples') or 0)) )
candidate_trunc_rate = candidate_trunc / samples
entity_trunc_rate = entity_trunc / samples
target_missing = int((ingest.get('targetMissingFromCandidates') or 0))

metrics = train.get('metrics') or {}
policy_loss = float(metrics.get('trainPolicyLoss') or 0.0)
visit_loss = float(metrics.get('trainVisitLoss') or 0.0)
value_loss = float(metrics.get('trainValueLoss') or 0.0)
entropy = float(metrics.get('trainPolicyEntropy') or 0.0)

is_finite = all(math.isfinite(x) for x in [policy_loss, visit_loss, value_loss])
entropy_ok = entropy > 1e-6

checks = {
  'observationMissingCount': obs_missing,
  'targetMissingFromCandidates': target_missing,
  'candidateTruncationRate': candidate_trunc_rate,
  'stateEntityTruncationRate': entity_trunc_rate,
  'lossFinite': is_finite,
  'policyEntropyNotCollapsed': entropy_ok,
}
print(json.dumps(checks, ensure_ascii=True))
PY
}

render_self_play_progress() {
  local round_label="$1"
  local done_games="$2"
  local total_games="$3"
  local width=30
  local done_safe=$(( done_games < 0 ? 0 : done_games ))
  local total_safe=$(( total_games < 1 ? 1 : total_games ))
  if (( done_safe > total_safe )); then
    done_safe=$total_safe
  fi
  local filled=$(( done_safe * width / total_safe ))
  local empty=$(( width - filled ))
  local bar_fill bar_empty
  bar_fill="$(printf '%*s' "${filled}" '' | tr ' ' '#')"
  bar_empty="$(printf '%*s' "${empty}" '' | tr ' ' '-')"
  printf '\r[%s] self-play %3d/%-3d [%s%s]' "${round_label}" "${done_safe}" "${total_safe}" "${bar_fill}" "${bar_empty}"
}

count_game_done_tokens() {
  local progress_log="$1"
  if [[ ! -f "${progress_log}" ]]; then
    echo 0
    return
  fi
  local count
  count="$(grep -c '^\[SELF_PLAY_GAME_DONE\] ' "${progress_log}" 2>/dev/null || true)"
  echo "${count:-0}"
}

run_round_self_play_with_progress() {
  local round_label="$1"
  local train_games="$2"
  shift 2

  local progress_tmp_root="${WORK_DIR}/.progress-tmp"
  local progress_log="${WORK_DIR}/.progress-${round_label//\//-}.log"
  mkdir -p "${progress_tmp_root}"

  SETI_SELF_PLAY_PROGRESS=1 TMPDIR="${progress_tmp_root}" node tools/generate_self_play_dataset.js "$@" >/dev/null 2>"${progress_log}" &
  local worker_pid=$!
  local shown=0
  local last_done=-1

  echo "[${round_label}] progress tracking started (prints once per completed game)."

  while kill -0 "${worker_pid}" 2>/dev/null; do
    local done_games
    done_games="$(count_game_done_tokens "${progress_log}")"
    if (( done_games != last_done )); then
      render_self_play_progress "${round_label}" "${done_games}" "${train_games}"
      printf '\n'
      last_done=${done_games}
      shown=1
    fi
    sleep 0.5
  done

  local exit_code=0
  if ! wait "${worker_pid}"; then
    exit_code=$?
  fi

  if [[ "${shown}" == "1" ]]; then
    render_self_play_progress "${round_label}" "${train_games}" "${train_games}"
    printf '\n'
  fi

  if [[ "${exit_code}" -ne 0 ]]; then
    echo "[${round_label}] self-play generation failed (exit=${exit_code})." >&2
    if [[ -f "${progress_log}" ]]; then
      tail -n 60 "${progress_log}" >&2 || true
    fi
    return "${exit_code}"
  fi

  return 0
}

evaluate_model() {
  local model_js="$1"
  local model_json="$2"
  local seed="$3"
  local summary_out="$4"
  local out_jsonl="$5"

  cp "${model_js}" "${MODEL_JS}"
  cp "${model_json}" "${MODEL_JSON}"
  copy_model_onnx_to_runtime "${model_json}" "$(dirname "${model_json}")"

  node tools/generate_self_play_dataset.js \
    --backend "${SELF_PLAY_BACKEND}" \
    --seed "${seed}" \
    --games "${EVAL_GAMES}" \
    --maxSteps "${SELF_PLAY_EVAL_MAX_STEPS}" \
    --concurrency "${CONCURRENCY}" \
    --difficulty "${DIFFICULTY}" \
    --explorationEpsilon 0 \
    --explorationTemperature 1 \
    --mctsRootNoiseEnabled false \
    --mctsRootNoiseAlpha 0.3 \
    --mctsRootNoiseWeight 0 \
    --out "${out_jsonl}" \
    --summaryOut "${summary_out}" >/dev/null

  extract_avg_score "${summary_out}"
}

for round in $(seq "${START_ROUND}" "${ROUNDS}"); do
  echo "[Round ${round}/${ROUNDS}] generating new self-play data..."

  cp "${ACCEPTED_JS}" "${MODEL_JS}"
  cp "${ACCEPTED_JSON}" "${MODEL_JSON}"
  copy_model_onnx_to_runtime "${ACCEPTED_JSON}" "${WORK_DIR}"

  ROUND_PREFIX="${WORK_DIR}/round-${round}"
  NEW_DATASET="${ROUND_PREFIX}.new.jsonl"
  MIXED_DATASET="${ROUND_PREFIX}.mixed.jsonl"
  RECENT_WINDOW_DATASET="${ROUND_PREFIX}.recent.window.jsonl"
  CURATED_POOL_DATASET="${ROUND_PREFIX}.curated.pool.jsonl"
  REPLAY_CANDIDATE_DATASET="${ROUND_PREFIX}.replay.candidate.jsonl"
  REPLAY_REPORT="${ROUND_PREFIX}.replay.report.json"
  NEW_SUMMARY="${ROUND_PREFIX}.new.summary.json"

  run_round_self_play_with_progress "Round ${round}/${ROUNDS}" "${TRAIN_GAMES}" \
    --backend "${SELF_PLAY_BACKEND}" \
    --seed "${SEED_BASE}:${MODE}:round-${round}:train" \
    --games "${TRAIN_GAMES}" \
    --maxSteps "${SELF_PLAY_MAX_STEPS}" \
    --concurrency "${CONCURRENCY}" \
    --difficulty "${DIFFICULTY}" \
    --explorationEpsilon "${SELF_PLAY_EXPLORATION_EPSILON}" \
    --explorationTemperature "${SELF_PLAY_EXPLORATION_TEMPERATURE}" \
    --mctsRootNoiseEnabled "${SELF_PLAY_MCTS_ROOT_NOISE_ENABLED}" \
    --mctsRootNoiseAlpha "${SELF_PLAY_MCTS_ROOT_NOISE_ALPHA}" \
    --mctsRootNoiseWeight "${SELF_PLAY_MCTS_ROOT_NOISE_WEIGHT}" \
    --simulations "${SELF_PLAY_SIMULATIONS:-192}" \
    --maxDepth "${SELF_PLAY_MAX_DEPTH:-6}" \
    --cpuct "${SELF_PLAY_CPUCT:-1.5}" \
    --rolloutDepth "${SELF_PLAY_ROLLOUT_DEPTH:-0}" \
    --out "${NEW_DATASET}" \
    --summaryOut "${NEW_SUMMARY}"

  CURATE_ARGS=(
    --new-dataset "${NEW_DATASET}"
    --replay-dataset "${REPLAY_DATASET}"
    --mixed-out "${MIXED_DATASET}"
    --replay-candidate-out "${REPLAY_CANDIDATE_DATASET}"
    --recent-window-out "${RECENT_WINDOW_DATASET}"
    --curated-pool-out "${CURATED_POOL_DATASET}"
    --report-out "${REPLAY_REPORT}"
    --current-round "${round}"
    --max-steps "${SELF_PLAY_MAX_STEPS}"
    --max-pass-ratio "${REPLAY_MAX_PASS_RATIO}"
    --replay-max-rows "${REPLAY_MAX_ROWS}"
    --replay-max-games "${REPLAY_MAX_GAMES}"
    --replay-max-games-per-round "${REPLAY_MAX_GAMES_PER_ROUND}"
    --replay-anchor-games-per-round "${REPLAY_ANCHOR_GAMES_PER_ROUND}"
    --replay-recent-rounds "${REPLAY_RECENT_ROUNDS}"
    --replay-age-half-life-rounds "${REPLAY_AGE_HALF_LIFE_ROUNDS}"
    --shift-alert-threshold "${REPLAY_SHIFT_ALERT_THRESHOLD}"
    --single-source-ratio-alert "${REPLAY_SINGLE_SOURCE_RATIO_ALERT}"
    --mix-old-ratio "${MIX_OLD_RATIO}"
    --seed "${SEED_BASE}:${MODE}:round-${round}:mix"
  )

  if [[ "${USE_LEGACY_MIX}" -eq 0 ]]; then
    CURATE_ARGS+=(
      --mix-new-ratio "${MIX_NEW_RATIO}"
      --mix-recent-ratio "${MIX_RECENT_RATIO}"
      --mix-curated-ratio "${MIX_CURATED_RATIO}"
    )
  fi

  "${PYTHON_BIN}" tools/curate_replay_pool.py "${CURATE_ARGS[@]}"

  MIXED_ROWS="$(${PYTHON_BIN} - <<'PY' "${MIXED_DATASET}"
import sys
from pathlib import Path
p = Path(sys.argv[1])
if not p.exists():
    print(0)
else:
    c = 0
    with p.open('r', encoding='utf-8') as f:
        for line in f:
            if line.strip():
                c += 1
    print(c)
PY
)"

  if [[ "${MIXED_ROWS}" == "0" ]]; then
    echo "[Round ${round}/${ROUNDS}] three-source mixed dataset is empty; fallback to legacy replay mix."
    "${PYTHON_BIN}" tools/curate_replay_pool.py \
      --new-dataset "${NEW_DATASET}" \
      --replay-dataset "${REPLAY_DATASET}" \
      --mixed-out "${MIXED_DATASET}" \
      --replay-candidate-out "${REPLAY_CANDIDATE_DATASET}" \
      --recent-window-out "${RECENT_WINDOW_DATASET}" \
      --curated-pool-out "${CURATED_POOL_DATASET}" \
      --report-out "${REPLAY_REPORT}" \
      --current-round "${round}" \
      --max-steps "${SELF_PLAY_MAX_STEPS}" \
      --max-pass-ratio "${REPLAY_MAX_PASS_RATIO}" \
      --replay-max-rows "${REPLAY_MAX_ROWS}" \
      --replay-max-games "${REPLAY_MAX_GAMES}" \
      --replay-max-games-per-round "${REPLAY_MAX_GAMES_PER_ROUND}" \
      --replay-anchor-games-per-round "${REPLAY_ANCHOR_GAMES_PER_ROUND}" \
      --replay-recent-rounds "${REPLAY_RECENT_ROUNDS}" \
      --replay-age-half-life-rounds "${REPLAY_AGE_HALF_LIFE_ROUNDS}" \
      --shift-alert-threshold "${REPLAY_SHIFT_ALERT_THRESHOLD}" \
      --single-source-ratio-alert "${REPLAY_SINGLE_SOURCE_RATIO_ALERT}" \
      --mix-old-ratio "${MIX_OLD_RATIO}" \
      --seed "${SEED_BASE}:${MODE}:round-${round}:mix:legacy-fallback"
  fi

  echo "[Round ${round}/${ROUNDS}] curation completed: mixed_rows=${MIXED_ROWS} report=${REPLAY_REPORT}"
  "${PYTHON_BIN}" - <<'PY' "${REPLAY_REPORT}" || true
import json
import sys
path = sys.argv[1]
try:
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)
except Exception as exc:
    print(f"[curation-report] unavailable: {exc}")
    raise SystemExit(0)
outputs = data.get('outputs') or {}
ratios = (data.get('ratios') or {}).get('actual') or {}
schema = data.get('schema') or {}
print(f"[curation-report] mode={data.get('mode')} outputs={json.dumps(outputs, ensure_ascii=True)} ratios={json.dumps(ratios, ensure_ascii=True)}")
print(f"[curation-report] schema={json.dumps(schema, ensure_ascii=True)} alerts={json.dumps(data.get('alerts') or [], ensure_ascii=True)}")
PY

  CANDIDATE_JSON="${ROUND_PREFIX}.candidate.json"
  CANDIDATE_JS="${ROUND_PREFIX}.candidate.js"
  CANDIDATE_ONNX="${ROUND_PREFIX}.candidate.onnx"

  echo "[Round ${round}/${ROUNDS}] training candidate model (family=${MODEL_FAMILY})..."
  if [[ "${MODEL_FAMILY}" == "entity-transformer" ]]; then
    "${PYTHON_BIN}" tools/train_entity_transformer_policy.py \
      --input "${MIXED_DATASET}" \
      --output "${CANDIDATE_JSON}" \
      --output-js "${CANDIDATE_JS}" \
      --output-onnx "${CANDIDATE_ONNX}" \
      --model-name "${MODEL_NAME}" \
      --global-name "${GLOBAL_NAME}" \
      --getter-name "${GETTER_NAME}" \
      --seed "${SEED_BASE}:${MODE}:round-${round}:train" \
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
      --value-loss-weight "${VALUE_LOSS_WEIGHT:-0.35}" \
      --visit-loss-weight "${VISIT_LOSS_WEIGHT}" \
      --label-smoothing "${LABEL_SMOOTHING:-0.02}"
  else
    "${PYTHON_BIN}" tools/train_bc_policy.py \
      --input "${MIXED_DATASET}" \
      --output "${CANDIDATE_JSON}" \
      --output-js "${CANDIDATE_JS}" \
      --model-name "${MODEL_NAME}" \
      --global-name "${GLOBAL_NAME}" \
      --getter-name "${GETTER_NAME}" \
      --seed "${SEED_BASE}:${MODE}:round-${round}:train" \
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
      --visit-loss-weight "${VISIT_LOSS_WEIGHT}"
  fi

  BASELINE_SUMMARY="${ROUND_PREFIX}.eval.baseline.summary.json"
  BASELINE_OUT="${ROUND_PREFIX}.eval.baseline.jsonl"
  CANDIDATE_SUMMARY="${ROUND_PREFIX}.eval.candidate.summary.json"
  CANDIDATE_OUT="${ROUND_PREFIX}.eval.candidate.jsonl"
  EVAL_SEED="${SEED_BASE}:${MODE}:round-${round}:eval-fixed"

  echo "[Round ${round}/${ROUNDS}] evaluating baseline (fixed 100-game standard)..."
  BASELINE_SCORE="$(evaluate_model "${ACCEPTED_JS}" "${ACCEPTED_JSON}" "${EVAL_SEED}" "${BASELINE_SUMMARY}" "${BASELINE_OUT}")"

  echo "[Round ${round}/${ROUNDS}] evaluating candidate (fixed 100-game standard)..."
  CANDIDATE_SCORE="$(evaluate_model "${CANDIDATE_JS}" "${CANDIDATE_JSON}" "${EVAL_SEED}" "${CANDIDATE_SUMMARY}" "${CANDIDATE_OUT}")"

  echo "[Round ${round}/${ROUNDS}] baseline_avg_final_score=${BASELINE_SCORE} candidate_avg_final_score=${CANDIDATE_SCORE}"

  STAGE8_CHECKS="$(collect_stage8_checks "${NEW_SUMMARY}" "${REPLAY_REPORT}" "${CANDIDATE_JSON}")"
  echo "[Round ${round}/${ROUNDS}] stage8_checks=${STAGE8_CHECKS}"

  ACCEPT_DECISION="$(${PYTHON_BIN} - <<'PY' \
    "${MODEL_FAMILY}" \
    "${round}" \
    "${ENTITY_ACCEPT_WARMUP_ROUNDS}" \
    "${ENTITY_ACCEPT_MIN_SCORE}" \
    "${ENTITY_ACCEPT_MAX_REGRESSION}" \
    "${ENTITY_ACCEPT_SCORE_TOLERANCE}" \
    "${BASELINE_SCORE}" \
    "${CANDIDATE_SCORE}" \
    "${CANDIDATE_SUMMARY}" \
    "${STAGE8_CHECKS}"
import json
import math
import sys

(
    model_family,
    round_text,
    warmup_text,
    min_score_text,
    max_regression_text,
    tolerance_text,
    baseline_text,
    candidate_text,
    candidate_summary_path,
    stage8_text,
) = sys.argv[1:]

def as_float(value, fallback=0.0):
    try:
        out = float(value)
    except Exception:
        return fallback
    return out if math.isfinite(out) else fallback

def as_int(value, fallback=0):
    try:
        return int(value)
    except Exception:
        return fallback

baseline = as_float(baseline_text, -1e9)
candidate = as_float(candidate_text, -1e9)
round_index = as_int(round_text, 0)
warmup_rounds = max(0, as_int(warmup_text, 0))
min_score = as_float(min_score_text, 8.0)
max_regression = max(0.0, as_float(max_regression_text, 12.0))
tolerance = max(0.0, as_float(tolerance_text, 1.0))

summary = {}
try:
    with open(candidate_summary_path, 'r', encoding='utf-8') as f:
        summary = (json.load(f).get('summary') or {})
except Exception:
    summary = {}

try:
    checks = json.loads(stage8_text)
except Exception:
    checks = {}

hard_ok = True
reasons = []
if not math.isfinite(candidate) or candidate <= -1e8:
    hard_ok = False
    reasons.append('candidate_eval_failed')
if summary.get('ok') is False:
    hard_ok = False
    reasons.append('candidate_summary_not_ok')
if int(checks.get('observationMissingCount') or 0) != 0:
    hard_ok = False
    reasons.append('observation_missing')
if int(checks.get('targetMissingFromCandidates') or 0) != 0:
    hard_ok = False
    reasons.append('target_missing')
if float(checks.get('candidateTruncationRate') or 0.0) != 0.0:
    hard_ok = False
    reasons.append('candidate_truncated')
if checks.get('lossFinite') is not True:
    hard_ok = False
    reasons.append('loss_not_finite')
if checks.get('policyEntropyNotCollapsed') is not True:
    hard_ok = False
    reasons.append('policy_entropy_collapsed')

if not hard_ok:
    print('0\thard_check_failed:' + ','.join(reasons))
    raise SystemExit(0)

if model_family != 'entity-transformer':
    accepted = candidate > baseline
    print(('1' if accepted else '0') + '\tlegacy_score_comparison')
    raise SystemExit(0)

if round_index <= warmup_rounds:
    accepted = candidate >= min_score and candidate >= baseline - max_regression
    reason = f"entity_warmup round={round_index} min_score={min_score} max_regression={max_regression}"
    print(('1' if accepted else '0') + '\t' + reason)
    raise SystemExit(0)

accepted = candidate >= baseline - tolerance
reason = f"entity_tolerance tolerance={tolerance}"
print(('1' if accepted else '0') + '\t' + reason)
PY
)"
  SHOULD_ACCEPT="${ACCEPT_DECISION%%$'\t'*}"
  ACCEPT_REASON="${ACCEPT_DECISION#*$'\t'}"
  echo "[Round ${round}/${ROUNDS}] accept_decision=${SHOULD_ACCEPT} reason=${ACCEPT_REASON}"

  if [[ "${SHOULD_ACCEPT}" == "1" ]]; then
    echo "[Round ${round}/${ROUNDS}] candidate accepted."
    cp "${CANDIDATE_JS}" "${ACCEPTED_JS}"
    cp "${CANDIDATE_JSON}" "${ACCEPTED_JSON}"
    promote_candidate_onnx_to_accepted "${ACCEPTED_JSON}" "${ACCEPTED_JS}" "${CANDIDATE_ONNX}"
    cp "${ACCEPTED_JS}" "${MODEL_JS}"
    cp "${ACCEPTED_JSON}" "${MODEL_JSON}"
    copy_model_onnx_to_runtime "${ACCEPTED_JSON}" "${WORK_DIR}"
    cp "${REPLAY_CANDIDATE_DATASET}" "${REPLAY_DATASET}"
  else
    echo "[Round ${round}/${ROUNDS}] candidate rejected."
    cp "${ACCEPTED_JS}" "${MODEL_JS}"
    cp "${ACCEPTED_JSON}" "${MODEL_JSON}"
    copy_model_onnx_to_runtime "${ACCEPTED_JSON}" "${WORK_DIR}"
  fi

done

echo "Iterative training completed: mode=${MODE}, rounds=${ROUNDS}"