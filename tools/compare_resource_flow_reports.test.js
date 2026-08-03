"use strict";

const assert = require("node:assert/strict");
const {
  compareResourceFlowReports,
  renderMarkdown,
} = require("./compare_resource_flow_reports");

const reference = { summary: { players: [
  {
    playerId: "h1", finalScore: 300,
    setupGainWeighted: 20, incomeGainWeighted: 12, nonIncomeGainWeighted: 30,
    weightedActionCost: 25, mainActionsPerWeightedCost: 0.20,
    fullDataCycleCount: 3, dataTurnoverCount: 4,
    drawToPlayRate: 0.8, incomeCardConversionRate: 0.5,
    alienCardToPlayRate: 0.75, blue1CreditGain: 4, blue2EnergyGain: 3,
    industryId: "真人公司A", alienIds: ["虫"],
  },
  {
    playerId: "h2", finalScore: 200,
    setupGainWeighted: 18, incomeGainWeighted: 10, nonIncomeGainWeighted: 20,
    weightedActionCost: 20, mainActionsPerWeightedCost: 0.10,
    fullDataCycleCount: 1, dataTurnoverCount: 2,
    drawToPlayRate: 0.4, incomeCardConversionRate: 0.25,
    alienCardToPlayRate: 0.25, blue1CreditGain: 2, blue2EnergyGain: 1,
    industryId: "真人公司B", alienIds: ["虫"],
  },
] } };
const ai = { result: { samples: [{ resourceFlow: {
  coverage: { weighted: 1 },
  reconciliation: { residualMagnitude: 0 },
  players: [
    {
      playerId: "a1", finalScore: 280,
      setupGainWeighted: 40, incomeGainWeighted: 12, nonIncomeGainWeighted: 40,
      weightedActionCost: 30, mainActionsPerWeightedCost: 0.15,
      fullDataCycleCount: 2, dataTurnoverCount: 3,
      drawToPlayRate: 0.6, incomeCardConversionRate: 0.3,
      alienCardToPlayRate: 0.5, blue1CreditGain: 3, blue2EnergyGain: 4,
      industryId: "电脑公司A", alienIds: ["虫"],
    },
    {
      playerId: "a2", finalScore: 180,
      setupGainWeighted: 35, incomeGainWeighted: 8, nonIncomeGainWeighted: 35,
      weightedActionCost: 18, mainActionsPerWeightedCost: 0.08,
      fullDataCycleCount: 0, dataTurnoverCount: 1,
      drawToPlayRate: 0.2, incomeCardConversionRate: 0.1,
      alienCardToPlayRate: 0, blue1CreditGain: 1, blue2EnergyGain: 2,
      industryId: "电脑公司B", alienIds: ["虫"],
    },
  ],
} }] } };

const comparison = compareResourceFlowReports(reference, ai);
assert.equal(comparison.reference.topQuartile.averageFinalScore, 300);
assert.equal(comparison.ai.topQuartile.averageFinalScore, 280);
assert.equal(comparison.deltas.topQuartile.fullDataCycleCount, 1);
assert.equal(comparison.deltas.topQuartile.nonIncomeGainWeighted, -10);
assert.equal(comparison.reference.bottomQuartile.averageFinalScore, 200);
assert.equal(comparison.ai.bottomQuartile.averageFinalScore, 180);
assert.ok(comparison.reference.byIndustry["真人公司A"]);
assert.ok(comparison.ai.byAlien["虫"]);
assert.ok(comparison.largestGaps.some((entry) => (
  entry.group === "topQuartile"
  && entry.metric === "fullDataCycleCount"
  && entry.delta === 1
)));

const markdown = renderMarkdown(comparison);
assert.match(markdown, /资源更多但完整数据循环更少/);
assert.match(markdown, /高分四分位/);
assert.match(markdown, /公司/);
assert.match(markdown, /按外星人/);
assert.match(markdown, /按轮次/);
assert.equal(
  comparison.largestGaps.some((entry) => [
    "setupGainWeighted",
    "incomeGainWeighted",
    "nonIncomeGainWeighted",
    "sameRoundReinvestmentWeighted",
  ].includes(entry.metric)),
  false,
);

const derivedAiMainActions = compareResourceFlowReports(reference, {
  result: { samples: [{ resourceFlow: {
    players: [{ playerId: "derived", finalScore: 100, weightedActionCost: 10 }],
    events: [
      { entryId: 1, playerId: "derived", pace: "main", sourceCategory: "cost" },
      { entryId: 1, playerId: "derived", pace: "main", sourceCategory: "planet_board" },
      { entryId: 2, playerId: "derived", pace: "main", sourceCategory: "pass_income" },
    ],
  } }] },
});
assert.equal(derivedAiMainActions.ai.allPlayers.mainActionsPerWeightedCost, 0.1);

console.log("compare_resource_flow_reports.test.js: all tests passed");
