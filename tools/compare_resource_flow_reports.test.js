"use strict";

const assert = require("node:assert/strict");
const {
  compareResourceFlowReports,
  renderMarkdown,
  summarizePlayers,
} = require("./compare_resource_flow_reports");

const humanPlayers = [
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
];
const reference = {
  humanSummary: { players: humanPlayers },
  summary: { players: [
    ...humanPlayers,
    { playerId: "computer-seat", finalScore: 999, industryId: "日志内电脑" },
  ] },
};
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
assert.equal(comparison.reference.playerCount, 2);
assert.equal(comparison.referenceSource, "humanSummary");
assert.deepEqual(comparison.warnings, []);
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
const derivedAiBlueRewards = compareResourceFlowReports(reference, {
  result: { samples: [{ resourceFlow: {
    players: [{
      playerId: "blue-derived", finalScore: 100, weightedActionCost: 10,
      blue1CreditGain: 0, blue2EnergyGain: 0,
    }],
    events: [
      {
        entryId: 1, playerId: "blue-derived", sourceCategory: "tech_bonus_other",
        sourceDetail: "选择科技：blue1", resourceDeltas: {}, techIds: ["blue1"],
      },
      {
        entryId: 2, playerId: "blue-derived", sourceCategory: "data_placement",
        sourceDetail: "放置数据：资源：信用点+1", resourceDeltas: { credits: 1 },
        isDataPlacement: true,
      },
      {
        entryId: 3, playerId: "blue-derived", sourceCategory: "tech_bonus_other",
        sourceDetail: "选择科技：blue2", resourceDeltas: {}, techIds: ["blue2"],
      },
      {
        entryId: 4, playerId: "blue-derived", sourceCategory: "card",
        sourceDetail: "放置数据：资源：能量+1", resourceDeltas: { energy: 1 },
        isDataPlacement: true,
      },
    ],
  } }] },
});
assert.equal(derivedAiBlueRewards.ai.allPlayers.blue1CreditGain, 1);
assert.equal(derivedAiBlueRewards.ai.allPlayers.blue2EnergyGain, 1);
const unavailableMetrics = summarizePlayers([{
  playerId: "missing",
  finalScore: 1,
  utilizationRate: { publicity: null },
  alienCardToPlayRate: null,
}]);
const runtimeCounts = compareResourceFlowReports(reference, { result: {
  resourceFlow: { players: [{ playerId: "p", finalScore: 100, weightedActionCost: 20,
    mainActionsPerWeightedCost: 0.4 }] },
  logs: [
    { playerId: "p", type: "turn-action", details: { action: { id: "playCard", kind: "main" } } },
    { playerId: "p", type: "turn-action", details: { action: { id: "pass", kind: "pass" } } },
    { playerId: "p", type: "turn-action", details: { action: { id: "placeData", kind: "quick" } } },
  ],
} });
assert.equal(runtimeCounts.ai.allPlayers.mainActionsPerWeightedCost, 0.05);
assert.equal(unavailableMetrics.utilizationPublicity, null);
assert.equal(unavailableMetrics.alienCardToPlayRate, null);

const legacyComparison = compareResourceFlowReports({ summary: { players: humanPlayers } }, ai);
assert.equal(legacyComparison.referenceSource, "legacy_summary");
assert.match(legacyComparison.warnings[0], /humanSummary/);
assert.match(renderMarkdown(legacyComparison), /口径告警/);

{
  const migrated = summarizePlayers([{
    finalScore: 300,
    setupGain: { credits: 2, score: 20 }, setupGainWeighted: 26,
    incomeGain: { energy: 2 }, incomeGainWeighted: 6,
    nonIncomeGain: { credits: 4, score: 90 }, nonIncomeGainWeighted: 102,
    sameRoundReinvestment: { credits: 2 },
  }]);
  assert.equal(migrated.setupGainWeighted, 6);
  assert.equal(migrated.nonIncomeGainWeighted, 12);
  assert.equal(migrated.sameRoundReinvestmentRate, 0.5);
  const migratedFlow = compareResourceFlowReports(reference, { resourceFlow: {
    players: [{ playerId: "p", finalScore: 90 }],
    groups: { byRound: { 1: { nonIncomeGainWeighted: 102 } } },
    events: [{ playerId: "p", roundNumber: 1, sourceCategory: "card",
      resourceDeltas: { credits: 4, score: 90 } }],
  } });
  assert.equal(migratedFlow.ai.byRound[1].nonIncomeGainWeighted, 12);
}

console.log("compare_resource_flow_reports.test.js: all tests passed");
