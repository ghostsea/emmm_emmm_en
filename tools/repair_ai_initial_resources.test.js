"use strict";
const assert = require("node:assert/strict");
const { repairInitialResources } = require("./repair_ai_initial_resources");

function fixture(gain = { credits: 1 }) {
  const opening = { playerId: "p1", credits: 2, energy: 0, publicity: 0, availableData: 0, handSize: 2 };
  const after = { ...opening, credits: 2 + (gain.credits || 0), handSize: 1 + (gain.handSize || 0) };
  return { summary: { gameEnded: true, blocked: false, bugCount: 0 }, result: {
    playerResults: [{ playerId: "p1", playerLabel: "白色", companyLabel: "测试公司", finalScore: 200 }],
    logs: [{ id: 1, type: "discard", playerId: "p1", playerResources: { ...opening }, scoreboard: [opening],
      details: { pendingType: "initial_income", selectedIndexes: [0], incomeGainByIndex: [gain] } },
    { id: 2, type: "turn-action", scoreboard: [after] }],
    resourceFlow: { players: [{ gameId: "test", playerId: "p1", endingInventory: after }],
      events: [{ gameId: "test", playerId: "p1", roundNumber: 1, sourceCategory: "setup",
        sourceDetail: "旧开局记录", resourceDeltas: { credits: 2, handSize: 1 } }] },
  } };
}

const run = fixture(), original = JSON.stringify(run);
const repaired = repairInitialResources(run);
assert.equal(repaired.verifiedInitialDiscards, 1);
assert.equal(repaired.players[0].setupGain.handSize, 2);
assert.equal(repaired.players[0].incomeGain.credits, 1);
assert.equal(repaired.players[0].spent.handSize, 1);
assert.equal(repaired.players[0].initialIncomeGain.credits, 1);
assert.equal(repaired.players[0].initialIncomeCardCost, 1);
assert.deepEqual(repaired.players[0].balanceResiduals, {});
assert.equal(JSON.stringify(run), original, "repair must preserve the original report");
const draw = repairInitialResources(fixture({ handSize: 1 })).players[0];
assert.equal(draw.incomeGain.handSize, 1);
assert.equal(draw.spent.handSize, 1);
assert.deepEqual(draw.balanceResiduals, {});
const mismatch = fixture();
mismatch.result.logs[1].scoreboard[0].credits += 1;
assert.throws(() => repairInitialResources(mismatch), /Unverified credits/);
const alreadyRecorded = fixture();
alreadyRecorded.result.resourceFlow.events[0].sourceDetail = "白色 初始收入增加";
assert.throws(() => repairInitialResources(alreadyRecorded), /already recorded/);
const unfinished = fixture();
unfinished.summary.gameEnded = false;
assert.throws(() => repairInitialResources(unfinished), /completed/);
console.log("repair_ai_initial_resources.test.js: all tests passed");
