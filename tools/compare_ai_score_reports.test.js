"use strict";
const assert = require("node:assert/strict");
const { comparePairs } = require("./compare_ai_score_reports");
const run = (seed, scores) => ({
  options: { seed, activePlayerCount: scores.length },
  summary: { ok: true, gameEnded: true, blocked: false, bugCount: 0 },
  result: { playerResults: scores.map((finalScore, index) => ({ playerId: `p${index}`, companyLabel: `c${index}`, finalScore })) },
});
const pair = { seed: "fixed:1", baseline: run("fixed:1", [300, 100]), candidate: run("fixed:1", [290, 150]) };
pair.candidate.result.playerResults.reverse();
const report = comparePairs([pair]);
assert.equal(report.delta.mean, 20);
assert.equal(report.delta.max, -10);
assert.equal(report.delta.min, 50);
assert.equal(report.pairs[0].seats[0].delta, -10, "pair by identity, not sorted score position");
assert.equal(report.pairedGameMeanDeltaStandardError, null);
const swappedCompanyPair = { seed: "swapped", baseline: run("swapped", [160, 320]), candidate: run("swapped", [180, 330]) };
for (const result of [swappedCompanyPair.baseline, swappedCompanyPair.candidate]) {
  result.result.playerResults[0].companyLabel = "c1";
  result.result.playerResults[1].companyLabel = "c0";
}
assert.deepEqual(comparePairs([pair, swappedCompanyPair]).companies, {
  c0: { seats: 2, baseline: 310, candidate: 310, meanDelta: 0, minimumDelta: -10 },
  c1: { seats: 2, baseline: 130, candidate: 165, meanDelta: 35, minimumDelta: 50 },
}, "company summaries must follow each game's actual company assignment, not seat positions");
const pair2 = { seed: "fixed:2", baseline: run("fixed:2", [200, 100]), candidate: run("fixed:2", [190, 90]) };
assert.equal(comparePairs([pair, pair2]).pairedGameMeanDeltaStandardError, 15);
assert.throws(() => comparePairs([pair, pair]), /重复种子/);
assert.throws(() => comparePairs([{ ...pair, seed: "wrong-seed" }]), /种子不一致/);
for (const change of [{ gameEnded: false }, { blocked: true }, { bugCount: 1 }, { ok: false }]) {
  const candidate = run("fixed:1", [290, 150]);
  Object.assign(candidate.summary, change);
  assert.throws(() => comparePairs([{ ...pair, candidate }]), /未正常完成/);
}
const wrongCompany = run("fixed:1", [300, 150]);
wrongCompany.result.playerResults[0].companyLabel = "different";
assert.throws(() => comparePairs([{ ...pair, candidate: wrongCompany }]), /公司或席位/);
console.log("compare_ai_score_reports.test.js: all tests passed");
