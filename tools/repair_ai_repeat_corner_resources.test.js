"use strict";
const assert = require("node:assert/strict");
const { repairRepeatedCornerResources: repair } = require("./repair_ai_repeat_corner_resources");
const base = { gameId: "g", playerId: "p", playerLabel: "白色", finalScore: 0, incomeDeltas: {}, cards: [] };
const input = { summary: { ok: true, gameEnded: true, blocked: false, bugCount: 0 }, result: { resourceFlow: {
  players: [{ playerId: "p", productiveMainActionCount: 7, endingInventory: { publicity: 4, handSize: 0 } }],
  events: [
    { ...base, entryId: 0, sourceCategory: "setup", resourceDeltas: { publicity: 1, handSize: 1 } },
    { ...base, entryId: 1, stepIndex: 0, sourceCategory: "card", resourceDeltas: { publicity: 1, handSize: -1 },
      sourceDetail: "弃非外星人卡并结算其左上角奖励3次：弃掉 测试牌；宣传+1；宣传+1；宣传+1；资源：宣传+3、手牌-1" },
    { ...base, entryId: 1, stepIndex: 99, sourceCategory: "card", resourceDeltas: { publicity: 2 }, syntheticSnapshotInference: true },
  ],
} } };
const before = JSON.stringify(input), result = repair(input);
assert.equal(JSON.stringify(input), before);
assert.equal(result.changes.length, 1);
assert.equal(result.resourceFlow.events[1].resourceDeltas.publicity, 3);
assert.equal(result.resourceFlow.events.length, 2);
assert.deepEqual(result.resourceFlow.players[0].balanceResiduals, {});
assert.equal(result.resourceFlow.players[0].productiveMainActionCount, 7);
assert.equal(repair({ ...input, result: { resourceFlow: result.resourceFlow } }).changes.length, 0);
for (const mutate of [
  run => { run.result.resourceFlow.events[2].resourceDeltas.publicity = 1; },
  run => { run.result.resourceFlow.events[2].entryId = 2; },
  run => { run.result.resourceFlow.events.push(structuredClone(run.result.resourceFlow.events[2])); },
]) {
  const invalid = structuredClone(input); mutate(invalid);
  assert.throws(() => repair(invalid), /No unique snapshot compensation/);
}
assert.throws(() => repair({ ...input, summary: { ...input.summary, gameEnded: false } }), /completed zero-bug/);
console.log("repeat-corner resource repair tests passed");
