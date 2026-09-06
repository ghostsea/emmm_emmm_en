"use strict";
const assert = require("node:assert/strict");
const { summarizeCardReturns } = require("./analyze_card_resource_returns");
const play = { playerId: "p", entryId: 1, pace: "main", cards: [{ change: "play", label: "income card" }], resourceDeltas: { credits: -2, handSize: -1 } };
const events = [play,
  { playerId: "p", entryId: 1, pace: "main", resourceDeltas: { energy: 2, score: 5 }, incomeDeltas: { energy: 1 } },
  { playerId: "p", entryId: 1, pace: "quick", resourceDeltas: { credits: 9 } },
  { playerId: "p", entryId: 1, pace: "playCard", syntheticSnapshotInference: true, resourceDeltas: { energy: -1, credits: 2 } },
  { playerId: "p", entryId: 1, pace: "quick", syntheticSnapshotInference: true, resourceDeltas: { energy: -99 } },
  { playerId: "other", entryId: 1, pace: "main", resourceDeltas: { credits: 99 } },
  { playerId: "p", entryId: 2, pace: "main", resourceDeltas: { credits: 99 } }];
const report = summarizeCardReturns([
  { gameId: "one", players: [{ playerId: "p", company: "c" }, { playerId: "unused", company: "c" }], events },
  { gameId: "two", players: [{ playerId: "p", company: "d" }], events: [play] },
]);
assert.equal(report.actions.length, 2, "entry ids belong to a game and player, and unrelated main actions are excluded");
assert.deepEqual(report.actions[0].gain, { credits: 0, energy: 2, publicity: 0, availableData: 0, handSize: 0 });
assert.equal(report.actions[0].gainWeighted, 6, "score and future income are not immediate spendable resources");
assert.equal(report.actions[0].costWeighted, 9, "played hand card belongs in the resource cost");
assert.equal(report.actions[0].snapshotCost.energy, 1, "entry snapshot residual must be visible without attributing it to the card");
assert.equal(report.actions[0].snapshotGain.credits, 2);
assert.equal(report.byCompany.c.perPlayer.snapshotCostWeighted, 1.5);
assert.equal(report.actions[0].directScore, 5);
assert.equal(report.actions[0].hasIncomeIncrease, true);
assert.equal(report.byCompany.c.perPlayer.cardMainActions, 0.5, "players with no card play remain in the denominator");
assert.equal(report.actions[1].hasResourceReturn, false, "paying to play does not itself count as a resource reward");
console.log("analyze_card_resource_returns.test.js: all tests passed");
