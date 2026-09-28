"use strict";
const assert = require("node:assert/strict");
const { repairIncomeFormulaClassification: repair } = require("./repair_ai_income_formula_classification");
const base = { gameId: "g", entryId: 1, playerId: "p", playerLabel: "白色", finalScore: 0, cards: [] };
const input = { summary: { ok: true, gameEnded: true, bugCount: 0 }, result: { resourceFlow: {
  reconciliation: { residualMagnitude: 0, baselineMissingCount: 0 },
  players: [{ playerId: "p", endingInventory: { energy: 8 }, productiveMainActionCount: 9 }],
  events: [
    { ...base, stepIndex: 0, sourceCategory: "card", sourceDetail: "当前每个能量收入：1能量：高于公司默认 7 个，能量+7", resourceDeltas: {}, incomeDeltas: { energy: 7 } },
    { ...base, stepIndex: 1, sourceCategory: "card", sourceDetail: "将本卡放入收入区：能量+1", resourceDeltas: { energy: 1 }, incomeDeltas: {} },
    { ...base, stepIndex: 90, sourceCategory: "card", sourceDetail: "snapshot inference: card", resourceDeltas: { energy: 7 }, incomeDeltas: {}, syntheticSnapshotInference: true },
    { ...base, stepIndex: 91, sourceCategory: "unclassified", sourceDetail: "snapshot inference: unclassified", resourceDeltas: {}, incomeDeltas: { energy: -6 }, syntheticSnapshotInference: true },
  ],
} } };
const before = JSON.stringify(input), result = repair(input);
assert.equal(JSON.stringify(input), before);
assert.equal(result.resourceFlow.players[0].incomeGain.energy, 1);
assert.equal(result.resourceFlow.players[0].nonIncomeGain.energy, 7);
assert.equal(result.resourceFlow.players[0].productiveMainActionCount, 9);
assert.equal(result.resourceFlow.events[0].resourceDeltas.energy, undefined, "original resource attribution is explicitly retained");
assert.equal(result.compensations[0].after, 0);
assert.deepEqual(result.resourceFlow.players[0].balanceResiduals, {});
for (const modify of [
  x => { x.result.resourceFlow.events[3].incomeDeltas.energy = -5; },
  x => { x.result.resourceFlow.events[3].entryId = 2; },
  x => { x.result.resourceFlow.events.push(structuredClone(x.result.resourceFlow.events[3])); },
]) {
  const bad = structuredClone(input); modify(bad);
  assert.throws(() => repair(bad), /No unique income snapshot compensation/);
}
assert.throws(() => repair({ ...input, summary: { ...input.summary, gameEnded: false } }), /completed zero-bug/);
console.log("income formula classification repair tests passed");
