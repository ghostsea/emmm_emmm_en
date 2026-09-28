"use strict";
const assert = require("node:assert/strict");
const { repairTracePaymentResources } = require("./repair_ai_trace_payment_resources");
const { summarizeResourceEvents } = require("../randomizer/game/ai/resource-flow");
const event = (stepIndex, text, deltas, synthetic = false) => ({ gameId: "g", entryId: 1, playerId: "p", stepIndex,
  sourceDetail: text, sourceCategory: "alien", resourceDeltas: deltas, incomeDeltas: {}, cards: [], techIds: [], syntheticSnapshotInference: synthetic });
const events = [{ ...event(-1, "setup", { availableData: 3 }), sourceCategory: "setup" },
  event(0, "赢家奖励：半人马粉色痕迹 2号位：支付 3 数据、分数+15", { availableData: 3, score: 15 }),
  event(1, "snapshot inference: alien", { availableData: -6 }, true)];
const ledger = { ...summarizeResourceEvents(events, { endingInventories: { p: { availableData: 0, score: 15 } } }), events };
const run = { summary: { ok: true, gameEnded: true, bugCount: 0 }, result: { resourceFlow: ledger } };
const before = JSON.stringify(run), fixed = repairTracePaymentResources(run);
assert.equal(JSON.stringify(run), before);
assert.equal(fixed.changes.length, 1);
assert.equal(fixed.resourceFlow.players[0].grossGain.availableData, 0);
assert.equal(fixed.resourceFlow.players[0].spent.availableData, 3);
assert.equal(fixed.resourceFlow.events.filter(e => e.syntheticSnapshotInference).length, 0);
assert.equal(repairTracePaymentResources({ ...run, result: { resourceFlow: fixed.resourceFlow } }).changes.length, 0);
const ambiguous = structuredClone(run); ambiguous.result.resourceFlow.events.push(event(2, "other", { availableData: -6 }, true));
assert.throws(() => repairTracePaymentResources(ambiguous), /No unique sufficient/);
const insufficient = structuredClone(run); insufficient.result.resourceFlow.events[2].resourceDeltas.availableData = -5;
assert.throws(() => repairTracePaymentResources(insufficient), /No unique sufficient/);
console.log("repair_ai_trace_payment_resources.test.js ok");
