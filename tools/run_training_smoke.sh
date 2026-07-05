#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${REPO_ROOT}"

PYTHON_BIN="${PYTHON_BIN:-${REPO_ROOT}/.venv/bin/python}"
SAMPLES_FILE="tools/_tmp_bc_samples.jsonl"
MODEL_FILE="tools/_tmp_bc_model.json"

printf '[1/6] Preparing deterministic BC sample file...\n'
cat > "${SAMPLES_FILE}" <<'EOF'
{"sampleId":"s1","logType":"turn-action","roundNumber":1,"turnNumber":1,"policyTarget":{"id":"launch"},"candidates":[{"id":"launch","available":true},{"id":"pass","available":true},{"id":"scan","available":true}]}
{"sampleId":"s2","logType":"turn-action","roundNumber":1,"turnNumber":2,"policyTarget":{"id":"pass"},"candidates":[{"id":"launch","available":true},{"id":"pass","available":true}]}
{"sampleId":"s3","logType":"turn-action","roundNumber":2,"turnNumber":3,"policyTarget":{"id":"scan"},"candidates":[{"id":"scan","available":true},{"id":"pass","available":true}]}
{"sampleId":"s4","logType":"turn-action","roundNumber":2,"turnNumber":4,"policyTarget":{"id":"scan"},"candidates":[{"id":"scan","available":true},{"id":"launch","available":true}]}
{"sampleId":"s5","logType":"turn-action","roundNumber":3,"turnNumber":5,"policyTarget":{"id":"researchTech"},"candidates":[{"id":"researchTech","available":true},{"id":"pass","available":true}]}
{"sampleId":"s6","logType":"turn-action","roundNumber":3,"turnNumber":6,"policyTarget":{"id":"playCard"},"candidates":[{"id":"playCard","available":true},{"id":"launch","available":true}]}
EOF

printf '[2/6] Running behavior-cloning trainer...\n'
"${PYTHON_BIN}" tools/train_bc_policy.py \
  --input "${SAMPLES_FILE}" \
  --output "${MODEL_FILE}" \
  --seed smoke-test \
  --validation-ratio 0.25 \
  --round-bucket-size 2

printf '[3/6] Printing model metrics summary...\n'
jq '{totalRecords, trainRecordCount, validationRecordCount, metrics}' "${MODEL_FILE}"

printf '[4/6] Running JS behavior-cloning smoke check...\n'
node - <<'NODE'
const bc = require('./randomizer/game/ai/behavior-cloning');
const samples = [
  { sampleId:'s1', logType:'turn-action', roundNumber:1, turnNumber:1, policyTarget:{id:'launch'}, candidates:[{id:'launch',available:true},{id:'pass',available:true}] },
  { sampleId:'s2', logType:'turn-action', roundNumber:1, turnNumber:2, policyTarget:{id:'pass'}, candidates:[{id:'launch',available:true},{id:'pass',available:true}] },
  { sampleId:'s3', logType:'turn-action', roundNumber:2, turnNumber:3, policyTarget:{id:'scan'}, candidates:[{id:'scan',available:true},{id:'pass',available:true}] },
  { sampleId:'s4', logType:'turn-action', roundNumber:2, turnNumber:4, policyTarget:{id:'scan'}, candidates:[{id:'scan',available:true},{id:'launch',available:true}] }
];
const records = bc.extractBehaviorCloneRecords(samples, { roundBucketSize: 2 });
const train = bc.trainBehaviorCloneModel(records, { validationRatio: 0, seed: 'smoke' });
const evalRes = bc.evaluateBehaviorCloneModel(train.model, records);
console.log(JSON.stringify({recordCount: records.length, trainAcc: train.metrics.trainAccuracy, evalAcc: evalRes.accuracy}));
NODE

printf '[5/6] Running JS self-play smoke check...\n'
node - <<'NODE'
const selfPlay = require('./randomizer/game/ai/self-play');
const result = selfPlay.runSelfPlayBatch({
  runEpisode({ seed, episodeIndex }) {
    return {
      lastSummary: { seed, steps: 2 + episodeIndex, ok: true, blocked: false, gameEnded: true },
      logs: [{
        type:'turn-action',
        playerId:'player-white',
        roundNumber:1,
        turnNumber:1,
        details:{
          action:{id:'launch',kind:'main'},
          candidates:[{id:'launch',available:true},{id:'pass',available:true}]
        }
      }],
      playerResults: [
        { playerId:'player-white', finalScore: 10 + episodeIndex },
        { playerId:'player-blue', finalScore: 8 + episodeIndex }
      ],
    };
  }
}, { seed:'sp-smoke', episodeCount:3, generatedAt:'2026-01-01T00:00:00.000Z' });
console.log(JSON.stringify({episodeCount: result.episodeCount, completedCount: result.summary.completedCount, totalSamples: result.summary.totalSamples}));
NODE

printf '[6/6] Running syntax checks...\n'
node --check randomizer/game/ai/behavior-cloning.js
node --check randomizer/game/ai/self-play.js
"${PYTHON_BIN}" -m py_compile tools/train_bc_policy.py

printf 'Training smoke suite passed.\n'
