"use strict";
const assert = require("node:assert/strict");
const { analyzeRun, summarize } = require("./analyze_ai_scan_transactions");

const event = (entryId, stepIndex, pace, sourceCategory, resourceDeltas, extra = {}) => ({
  entryId, stepIndex, pace, sourceCategory, resourceDeltas, playerId: "p", playerLabel: "P",
  roundNumber: 3, turnNumber: 8, mainActionType: "scan", incomeDeltas: {}, techIds: [], cards: [],
  sourceDetail: sourceCategory === "cost" ? "扫描费用：扫描消耗" : "奖励", ...extra,
});
const decision = (id, action, rawTurn) => ({ id, playerId: "p", roundNumber: 3, turnNumber: 8, rawTurnNumber: rawTurn,
  type: "turn-action", playerResources: {}, details: { action: { id: action, kind: "main" } } });
const run = { summary: { ok: true, gameEnded: true, bugCount: 0 }, result: {
  logs: [decision(1, "scan", 30), decision(2, "launch", 31), decision(3, "scan", 32), decision(4, "analyze", 33)],
  resourceFlow: { players: [{ playerId: "p", industryId: "test" }], events: [
    event(0, 0, "main", "tech", {}, { techIds: ["blue1", "blue2"] }),
    event(10, 0, "quick", "data_placement", { credits: 5 }, { isDataPlacement: true }),
    event(10, 1, "main", "cost", { credits: -1, energy: -2 }),
    event(10, 2, "main", "planet_board", { availableData: 2 }),
    event(10, 3, "quick", "data_placement", { credits: 1, handSize: -1 }, { isDataPlacement: true, incomeDeltas: { credits: 1 } }),
    event(10, 4, "quick", "data_placement", { credits: 1 }, { isDataPlacement: true }),
    event(11, 0, "main", "cost", { energy: -2 }),
    event(11, 1, "main", "planet_board", { availableData: 3 }),
    event(11, 2, "quick", "data_placement", { energy: 1 }, { isDataPlacement: true }),
  ] },
} };
const rows = analyzeRun(run, 1, "candidate");
assert.deepEqual(rows.map(r => r.entryId), [10, 11], "repeated display turns pair distinct transactions by ordinal");
assert.deepEqual(rows.map(r => r.rawTurn), [30, 32]);
assert.deepEqual(rows.map(r => r.mainResources.nonIncomeGain.availableData), [2, 3]);
assert.deepEqual(rows.map(r => r.mainResources.spent.energy), [2, 2], "payments are not aggregated across display turns");
assert.equal(rows[0].mainResources.nonIncomeGain.credits, 0, "separate quick rewards are not direct scan rewards");
assert.equal(rows[0].sameTransactionBlueRewardsAfterPayment.blue1CreditGain, 1, "exclude prepayment rewards and income");
assert.equal(rows[1].sameTransactionBlueRewardsAfterPayment.blue2EnergyGain, 1, "retain previous technology ownership");
const totals = summarize(rows).candidate.test;
assert.equal(totals.laterSameRoundAnalysis, 2);
assert.equal(totals.distinctLaterAnalyses, 1, "one later analysis is not counted twice as independent conversions");
assert.equal(totals.nextMainAnalysis, 1);
const missing = structuredClone(run);
missing.result.resourceFlow.events = missing.result.resourceFlow.events.filter(e => !(e.entryId === 11 && e.sourceCategory === "cost"));
assert.throws(() => analyzeRun(missing, 1, "candidate"), /scan decision\/payment count/);
const duplicate = structuredClone(run);
duplicate.result.resourceFlow.events.push(duplicate.result.resourceFlow.events[2]);
assert.throws(() => analyzeRun(duplicate, 1, "candidate"), /duplicate scan payment/);
console.log("Scan transaction audit tests passed");
