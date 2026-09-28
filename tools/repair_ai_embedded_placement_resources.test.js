const assert = require("node:assert/strict");
const { summarizeResourceEvents } = require("../randomizer/game/ai/resource-flow");
const { repairEmbeddedPlacementResources } = require("./repair_ai_embedded_placement_resources");
const base = { gameId: "g", playerId: "p", roundNumber: 4, entryId: 1, pace: "quick", cards: [], incomeDeltas: {}, techIds: [] };
const text = "奖励：白色获得 1/1 个数据；放置数据：序号 15 自数据池槽位1 → 第三列第二行 (63.88%,81.29%)，额外获得 1 能量；获得 1 能量";
const events = [
  { ...base, entryId: 0, stepIndex: 0, sourceCategory: "setup", resourceDeltas: { availableData: 6 } },
  { ...base, stepIndex: 0, sourceCategory: "card", resourceDeltas: {}, techIds: ["blue2"] },
  { ...base, stepIndex: 1, sourceCategory: "card", sourceDetail: text, resourceDeltas: { energy: 2, availableData: 1 } },
  { ...base, stepIndex: 999, sourceCategory: "cost", sourceDetail: "snapshot inference: cost", syntheticSnapshotInference: true, resourceDeltas: { energy: -1, availableData: -1 } },
];
const ledger = summarizeResourceEvents(events, { endingInventories: { p: { availableData: 6, energy: 1 } }, productiveMainActionCounts: { p: 1 } });
const run = { summary: { ok: true, gameEnded: true, bugCount: 0 }, result: { resourceFlow: { ...ledger, events } } };
const before = JSON.stringify(run), r = repairEmbeddedPlacementResources(run), p = r.resourceFlow.players[0];
assert.equal(JSON.stringify(run), before);
assert.equal(r.changes.length, 1);
assert.equal(p.blue2EnergyGain, 1);
assert.equal(p.nonIncomeGain.energy, 1);
assert.equal(p.spent.energy, 0);
assert.equal(p.nonIncomeGain.availableData, 1);
assert.equal(p.spent.availableData, 1);
assert.deepEqual(p.balanceResiduals, {});
const fixedRun = { ...run, result: { resourceFlow: r.resourceFlow } };
assert.equal(repairEmbeddedPlacementResources(fixedRun).changes.length, 0, "idempotent");
const ambiguous = structuredClone(run);
ambiguous.result.resourceFlow.events.push({ ...events[3], stepIndex: 1000 });
assert.throws(() => repairEmbeddedPlacementResources(ambiguous), /unique snapshot compensation/);

{
  const scoreEvents = structuredClone(events);
  scoreEvents[2].sourceDetail = text.replaceAll("1 能量", "2 分");
  scoreEvents[2].sourceCategory = "data_placement";
  scoreEvents[2].resourceDeltas = { availableData: 1, score: 4 };
  scoreEvents[3].resourceDeltas = { availableData: -1 };
  const scoreLedger = summarizeResourceEvents(scoreEvents, { endingInventories: { p: { availableData: 6 } } });
  const fixed = repairEmbeddedPlacementResources({ ...run, result: { resourceFlow: { ...scoreLedger, events: scoreEvents } } });
  assert.equal(fixed.resourceFlow.events.reduce((n, e) => n + (e.resourceDeltas.score || 0), 0), 2,
    "score does not get an invented resource compensation");
  assert.equal(fixed.resourceFlow.players[0].finalScore, scoreLedger.players[0].finalScore);
  assert.notEqual(fixed.changes[0].replacementEvents[0].sourceCategory, "data_placement",
    "the original compound source must not turn the preceding reward into a second placement");
}
console.log("repair_ai_embedded_placement_resources.test.js ok");
