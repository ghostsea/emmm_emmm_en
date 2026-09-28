// Run from the repository root after the complete fresh three-arm validation.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { comparePairs } = require('../../tools/compare_ai_score_reports.js');
const dir = path.resolve('tmp/ai-20260905');
const read = name => JSON.parse(fs.readFileSync(path.join(dir, name)));
const readScores = name => {
  const run = read(name);
  return { options: run.options, summary: run.summary,
    result: { playerResults: run.result.playerResults } };
};
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
assert(fs.existsSync(path.join(dir, 'probefresh-triple-queue-complete.json')),
  'Full192-game queue has not completed; no partial score report is permitted.');
const queue = read('probefresh-triple-queue-complete.json');
assert.equal(queue.completed.length, 192);
assert.equal(queue.failures.length, 0);
assert.equal(queue.pending.length, 0);
const original = read('probeabsolute64-suite.json');
const current = read('probeincremental64-suite.json');
assert.equal(original.pairs.length, 64);
assert.equal(current.pairs.length, 64);
for (const suite of [original, current]) {
  for (const [file, expected] of Object.entries(suite.models.base.hashes)) {
    assert.equal(hash(path.join(dir, suite.models.base.root, file)), expected);
  }
  for (const [file, expected] of Object.entries(suite.harnessHashes)) {
    assert.equal(hash(file), expected);
  }
}
const manifest = [];
const pairs = original.pairs.map((before, index) => {
  const after = current.pairs[index];
  assert.equal(before.seed, after.seed);
  assert.equal(before.alienSeed, after.alienSeed);
  const baseline = readScores(before.baseline);
  const candidate = readScores(after.baseline);
  for (const run of [baseline, candidate]) {
    assert.equal(run.options.alienSeed, before.alienSeed);
    assert.equal(run.options.alienRandomMode, 'independent-slots-v1');
  }
  manifest.push({ seed: before.seed, alienSeed: before.alienSeed,
    baseline: before.baseline, candidate: after.baseline,
    baselineSha256: hash(path.join(dir, before.baseline)),
    candidateSha256: hash(path.join(dir, after.baseline)) });
  return { seed: before.seed, baseline, candidate };
});
const report = comparePairs(pairs);
assert.deepEqual(report.baseline, read('probeabsolute64-complete.json').report.baseline);
assert.deepEqual(report.candidate, read('probeincremental64-complete.json').report.baseline);
const result = {
  scope: 'Direct original-safe versus current-default comparison on all64 fresh seed triples. Reuses128 of the192 games; no additional games and no addition of historical effect estimates.',
  models: { baseline: original.models.base.commit, candidate: current.models.base.commit },
  frozenAt: original.frozenAt, seedGeneratedAt: original.seedGeneratedAt,
  limitations: [
    'Current7124816d includes accepted8f launch/Rune/credit policy plus the separately validated income-discard type fix and newer runtime/reporting corrections.',
    'It is not byte-identical to8f. Do not pool this result with the previous creditabsolute64 result as an identical-policy replication.',
    'Candidate-probe results are evaluated separately. This report neither changes policy nor declares the+10 goal achieved.'
  ], manifest, report
};
fs.writeFileSync('docs/ai-validation/2026-09-28-current-default-replication.json', JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify({ pairs: pairs.length, delta: report.delta,
  standardError: report.pairedGameMeanDeltaStandardError, companies: report.companies }, null, 2));
