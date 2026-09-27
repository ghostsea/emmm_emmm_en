"use strict";
const assert = require("node:assert/strict");
const { analyzeRun, summarize } = require("./analyze_ai_scan_followup");

function action(id, kind, logId, round = 1, extra = {}) {
  return { id: logId, type: "turn-action", playerId: "p", roundNumber: round,
    details: { action: { id, kind, ...extra }, candidates: [{ id: "analyze", available: true }] } };
}
const scan = id => action("scan", "main", id, 1,
  { valueBreakdown: { scanDataProjection: { canOpenAnalyze: true, canPayAnalyzeAfterScan: true } } });
const run = logs => ({ summary: { ok: true, gameEnded: true, bugCount: 0 },
  result: { playerResults: [{ playerId: "p", companyLabel: "公司" }], logs } });

// Two forecasts can precede one analysis; intervening productive actions are
// legitimate delays, and must not be counted as two realized cycles.
const result = analyzeRun(run([
  scan(1), action("placeData", "quick", 2, 1, { target: "computer", placementSlot: 6 }),
  action("placeData", "quick", 3, 1, { target: "blueBonus" }), scan(4),
  action("researchTech", "main", 5), action("analyze", "main", 6),
]), 1);
assert.equal(result.length, 2);
assert.equal(result[0].filledSixBeforeNextMain, true);
assert.equal(result[0].bluePlacementBeforeNextMain, true);
assert.equal(result[0].interveningMainActions, 2);
assert.equal(result[1].interveningMainActions, 1);
assert.equal(summarize(result)["公司"].laterSameRoundAnalyze, 2);
assert.equal(summarize(result)["公司"].distinctLaterAnalyses, 1);

const laterRound = analyzeRun(run([scan(1), action("pass", "pass", 2), action("analyze", "main", 3, 2)]), 1);
assert.equal(laterRound[0].laterSameRoundAnalyze, false, "next-round analysis is not same-round conversion");
assert.equal(laterRound[0].firstMain.id, "pass");
const unaffordable = scan(1);
unaffordable.details.action.valueBreakdown.scanDataProjection.canPayAnalyzeAfterScan = false;
assert.equal(analyzeRun(run([unaffordable]), 1).length, 0);
assert.throws(() => analyzeRun({ ...run([]), summary: { ok: true, gameEnded: false } }, 1), /未正常结束/);
console.log("scan follow-up audit tests passed");
