const fs = require('node:fs'), assert = require('node:assert/strict');
const dir = 'docs/ai-validation/2026-09-28-';
const read = name => JSON.parse(fs.readFileSync(dir + name + '.json'));
const results = read('probefresh-triple-results'), integration = read('probe-default-integration');
assert.equal(results.uniqueNewGames, 192);
assert.equal(integration.source.length, 149);
assert.equal(integration.replay.bugs, 0);
assert.equal(Object.values(integration.browser).reduce((n,x) => n+x.cases,0), 13);
for (const prefix of ['probeabsolute64','probeincremental64']) {
  const value = results.comparisons[prefix];
  assert.equal(value.pairs, 64);
  assert.equal(value.probe.dataMismatches, 0);
  assert.equal(value.probe.scoreMismatches, 0);
  const report = {
    decision: 'adopt-small-positive-probe-coverage-after-main-verification',
    comparison: prefix, ...value,
    approximate95Interval: [value.meanDelta - 1.96*value.pairedGameStandardError,
      value.meanDelta + 1.96*value.pairedGameStandardError],
    validation: { uniqueNewGamesAcrossBothComparisons: 192, ledgerSeatsPerComparison: 512,
      candidateUniquePaidPlays: value.uniquePaidPlays, nodeTestFiles: 54,
      mainIntegration: '2026-09-28-probe-default-integration.json' },
    goal: { targetMeanGain: 10, achieved: false },
    rationale: 'Fixed24 and fresh64 incremental means are both slightly positive; fresh high-score distribution improves. Adopt supported legal probe-scan coverage under mean-first/high-score-second priorities, not as statistically established improvement.',
    risks: ['Incremental+0.3984375 with game-paired SE1.461399 includes zero in its approximate95 interval.',
      'Grand Strategy incremental mean falls2.90625; per-game minimum falls1.53125 and baseline-selected high seats fall6.234375.',
      'Resource conversion is not improved consistently: Huanyu and Grand Strategy main actions and all-company analyses decline.',
      'Absolute+6.703125 is measured directly against the original safe policy on this same64; do not add earlier effect estimates.',
      'Repeat scan preview fixes targets and excludes payment/arrival triggers;46 observed move previews agree but unobserved states remain an approximation.']
  };
  fs.writeFileSync(dir + prefix + '-assessment.json',JSON.stringify(report,null,2)+'\n');
}
results.status = 'adopted-after-main-verification-goal-not-achieved';
results.assessmentFiles = ['2026-09-28-probeabsolute64-assessment.json','2026-09-28-probeincremental64-assessment.json'];
results.integrationProof = '2026-09-28-probe-default-integration.json';
fs.writeFileSync(dir + 'probefresh-triple-results.json',JSON.stringify(results,null,2)+'\n');
console.log('Archived complete192 and verified main integration; +10 goal remains active.');
