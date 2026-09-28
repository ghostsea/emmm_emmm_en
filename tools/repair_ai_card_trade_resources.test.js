"use strict";
const assert = require("node:assert/strict");
const { repairCardTradeResources } = require("./repair_ai_card_trade_resources");
const { summarizeResourceEvents } = require("../randomizer/game/ai/resource-flow");
const event = (stepIndex, text, deltas, synthetic = false) => ({ gameId: "g", entryId: 1, playerId: "p", stepIndex,
  sourceDetail: text, sourceCategory: synthetic ? "alien" : "trade_conversion", resourceDeltas: deltas,
  incomeDeltas: {}, cards: [], techIds: [], syntheticSnapshotInference: synthetic });
const events = [event(0, "快速交易：2张牌 → 1能量", {}), event(1, "snapshot inference: alien", { energy: 1 }, true),
  event(2, "snapshot inference: card", { handSize: -2 }, true),
  { ...event(-1, "setup", { handSize: 2 }), sourceCategory: "setup" }];
const ledger = { ...summarizeResourceEvents(events, { endingInventories: { p: { energy: 1, handSize: 0 } } }), events };
const run = { summary: { ok: true, gameEnded: true, bugCount: 0 }, result: { resourceFlow: ledger } };
const before = JSON.stringify(run), repaired = repairCardTradeResources(run);
assert.equal(JSON.stringify(run), before);
assert.equal(repaired.changes.length, 1);
assert.deepEqual(repaired.resourceFlow.events[0].resourceDeltas, { handSize: -2, energy: 1 });
assert.equal(repaired.resourceFlow.events[0].sourceCategory, "trade_conversion");
assert.equal(repaired.resourceFlow.events.filter(e => e.syntheticSnapshotInference).length, 0);
assert.equal(repairCardTradeResources({ ...run, result: { resourceFlow: repaired.resourceFlow } }).changes.length, 0);
const ambiguous = structuredClone(run);ambiguous.result.resourceFlow.events.push(event(3, "second compensation", { energy: 1 }, true));
assert.throws(() => repairCardTradeResources(ambiguous), /No unique sufficient compensation/);
const insufficient = structuredClone(run);insufficient.result.resourceFlow.events[2].resourceDeltas.handSize = -1;
assert.throws(() => repairCardTradeResources(insufficient), /No unique sufficient compensation/);
assert.throws(() => repairCardTradeResources({ ...run, summary: { ok: true, gameEnded: false } }), /Completed/);
console.log("repair_ai_card_trade_resources.test.js ok");
