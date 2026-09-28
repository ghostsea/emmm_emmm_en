const fs = require('node:fs'), assert = require('node:assert/strict');
const source = 'tmp/ai-20260905/strategyreserve-';
const target = 'docs/ai-validation/2026-09-28-strategyreserve-';
const read = name => JSON.parse(fs.readFileSync(source + name + '.json'));
const queue = read('queue-complete'), complete = read('complete'), followup = read('decision-followup');
assert.equal(queue.completed.length, 48);
assert.equal(queue.failures.length, 0);
assert.equal(queue.pending.length, 0);
assert.equal(complete.report.baseline.games, 24);
assert.equal(complete.report.candidate.games, 24);
assert.equal(followup.summary.identicalResourceEvents, 23);
assert.equal(followup.summary.identicalFinalScores, 23);
assert.deepEqual(followup.rows.filter(r => !r.resourceDiff.same).map(r => r.case), [6]);
for (const name of ['complete', 'accounting-audit', 'runtime-audit', 'configuration-audit',
  'paired-cohorts', 'aid-audit', 'payment-amounts', 'resource-matrix', 'baseline-replay',
  'decision-followup', 'queue-complete', 'case6-action']) {
  fs.copyFileSync(source + name + '.json', target + name + '.json');
}
fs.copyFileSync(source + 'resource-matrix.md', target + 'resource-matrix.md');
const cards = read('case6-action').map(r => ({ side: r.side, resources: r.resources,
  selected: r.selected.cardId || r.selected.id,
  candidates: r.candidates.filter(c => ['scan', 'playCard'].includes(c.id)).map(c => ({
    id: c.id, card: c.cardId, score: c.score, graph: c.actionGraph,
    playable: c.playableCards?.map(p => ({card: p.cardId, score: p.score,
      penalty: p.valueBreakdown?.grandStrategyCreditBottleneckPenalty, plan: p.plan?.actionId}))
  }))
}));
assert.deepEqual(cards[0].resources, cards[1].resources);
assert.equal(cards[0].selected, 'b_90.webp');
assert.equal(cards[1].selected, 'scan');
const b90 = row => row.candidates.find(c => c.id === 'playCard').playable.find(c => c.card === 'b_90.webp');
assert.deepEqual(b90(cards[0]), b90(cards[1]));
fs.writeFileSync(target + 'assessment.json', JSON.stringify({
  decision: 'reject-fixed-development-no-fresh-validation',
  baseline: '0fc957021a4c6e1af19e378121dfaa9a62f020e9',
  candidate: 'd6c4b2619c52e65c9678180375792d75041e9695',
  report: complete.report, followup: followup.summary, case6: cards,
  goal: { target: 10, achieved: false, latestDirectFresh64Gain: 6.703125 },
  limitations: [
    'Previously seen fixed seeds; no estimate of fresh generalization.',
    'Only case6 changes actual recorded resource events and scores; metadata changes are not actions.',
    'Raw preselection hides b90 after increasing another card score; its unchanged raw value and baseline graph are diagnostic, not a counterfactual replay of all graph state.',
    'Full-game differences include shared trajectories; do not attribute all -28 Grand Strategy points to its first changed decision.',
    'Keep the existing credit reserve in the next independent card-ranking experiment.'
  ]
}, null, 2) + '\n');
console.log('Archived all48 fixed games; negative reserve ablation rejected; +10 remains unmet.');
