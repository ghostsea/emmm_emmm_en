const assert = require("assert");

const evaluator = require("./evaluator");
const policy = require("./policy");
const analytics = require("./battle-analytics");

assert.equal(evaluator.getResourceValue({ credits: 1, energy: 1, publicity: 1 }), 7);
assert.equal(evaluator.getRemainingIncomeMultiplier(1), 4);
assert.equal(evaluator.getRemainingIncomeMultiplier(4), 1);

const offer = {
  industryOptions: [
    { id: "industry:a.png", label: "异星实验室" },
    { id: "industry:b.png", label: "赫利昂联合体" },
  ],
  initialOptions: [
    { id: "initial:1", label: "初始牌 1" },
    { id: "initial:16", label: "初始牌 16" },
    { id: "initial:21", label: "初始牌 21" },
  ],
};
const decision = policy.chooseInitialSelection(offer, { roundNumber: 1 });
assert.ok(decision.industry);
assert.equal(decision.initialCards.length, 2);

assert.equal(policy.chooseTurnAction([
  { id: "pass", available: true },
  { id: "launch", available: true },
])?.id, "launch");
assert.equal(policy.chooseTurnAction([
  { id: "pass", available: true },
  { id: "researchTech", available: true, takeable: [{ tileId: "purple1" }] },
])?.id, "researchTech");
assert.equal(policy.chooseTurnAction([
  { id: "end-turn", available: true },
])?.id, "end-turn");
assert.equal(policy.chooseTurnAction([
  { id: "end-turn", available: true },
  { id: "move", available: true, score: 2 },
])?.id, "move");
assert.equal(policy.chooseTurnAction([
  { id: "end-turn", available: true },
  { id: "move", available: true, score: -1 },
])?.id, "end-turn");
assert.equal(policy.chooseTurnAction([
  { id: "move", available: true, score: 5 },
  { id: "orbit", available: true },
])?.id, "orbit");
assert.equal(policy.chooseTurnAction([
  { id: "pass", available: true },
  { id: "scan", available: true },
])?.id, "scan");
assert.equal(policy.chooseTurnAction([
  { id: "scan", available: true },
  { id: "playCard", available: true, playableCards: [{ price: 2, score: 4 }] },
])?.id, "playCard");
assert.equal(policy.chooseResearchTechTile([
  { tileId: "blue4", techType: "blue", bonusId: "bonus_1m", firstTake: false },
  { tileId: "orange1", techType: "orange", bonusId: "bonus_3f", firstTake: true },
])?.tileId, "orange1");
assert.equal(policy.chooseResearchTechTile([
  { tileId: "orange1", techType: "orange", score: 3 },
  { tileId: "purple4", techType: "purple", score: 9 },
])?.tileId, "purple4");
assert.equal(policy.chooseResearchTechTile([
  { tileId: "orange1", techType: "orange", score: 99, available: false },
  { tileId: "purple4", techType: "purple", score: 9, available: true },
])?.tileId, "purple4");
assert.equal(policy.choosePlayCard([
  { cardId: "low.webp", price: 1, score: 1 },
  { cardId: "better.webp", price: 4, score: 5 },
])?.cardId, "better.webp");
assert.equal(policy.chooseBlueTechSlot([3, 1, 2]), 1);
assert.equal(policy.chooseBlueTechSlot([2, 0]), 0);
assert.deepEqual(policy.chooseMovePaymentIndexes([
  { label: "普通牌" },
  { label: "移动牌 A" },
  { label: "移动牌 B" },
], {
  requiredMovePoints: 2,
  availableEnergy: 1,
  moveCardIndexes: [2, 1],
}), [1]);
assert.deepEqual(policy.chooseDiscardIndexes([{ label: "b" }, { label: "a" }], 1), [1]);

const sampleBattleReport = {
  lastSummary: { ok: false, blocked: true, gameEnded: false, steps: 4, message: "sample" },
  logs: [
    {
      type: "turn-action",
      playerId: "player-white",
      details: {
        action: {
          id: "launch",
          kind: "main",
          plan: {
            type: "main-then-quick",
            mainActionId: "launch",
            quickActionId: "move",
          },
        },
        candidates: [
          { id: "launch", kind: "main", available: true },
          { id: "playCard", kind: "main", available: true, score: 7 },
          { id: "pass", kind: "pass", available: true },
        ],
      },
    },
    {
      type: "turn-action",
      playerId: "player-blue",
      details: {
        action: { id: "pass", kind: "pass" },
        candidates: [
          { id: "scan", kind: "main", available: true },
          { id: "pass", kind: "pass", available: true },
        ],
      },
    },
    {
      type: "play-card",
      playerId: "player-white",
      details: { selected: { cardLabel: "控制中心", cardId: "b_25.webp" } },
    },
    {
      type: "move-payment",
      playerId: "player-white",
      details: { requiredMovePoints: 2, energyCost: 1, selectedHandIndices: [1] },
    },
    {
      type: "move-path",
      playerId: "player-white",
      details: {
        selected: {
          direction: "out",
          routeTarget: { kind: "probe-location", locationType: "asteroid" },
          followupMainAction: { actionId: "land", planetId: "mars" },
        },
      },
    },
    {
      type: "tech-placement",
      playerId: "player-white",
      details: { tileId: "orange1" },
    },
    {
      type: "scan-target",
      playerId: "player-blue",
      details: { pendingType: "sector_scan", nebulaId: "sector-1-a" },
    },
    {
      type: "effect",
      playerId: "player-white",
      details: { effectType: "gain_resources" },
    },
  ],
  bugs: [{ message: "AI sample bug" }],
  playerResults: [
    { playerId: "player-white", playerLabel: "白色", finalScore: 24, resources: { score: 18 }, techCount: 1 },
    { playerId: "player-blue", playerLabel: "蓝色", finalScore: 19, resources: { score: 15 }, techCount: 0 },
  ],
};
const battleAnalysis = analytics.analyzeBattleReport(sampleBattleReport);
assert.equal(battleAnalysis.turnActionCount, 2);
assert.equal(battleAnalysis.actionCounts.launch, 1);
assert.equal(battleAnalysis.actionCounts.pass, 1);
assert.equal(battleAnalysis.candidateStats.playCard.availableNotSelected, 1);
assert.equal(battleAnalysis.opportunities.passWithAvailableMain, 1);
assert.equal(battleAnalysis.opportunities.selectedBelowBestScore, 2);
assert.equal(battleAnalysis.scoreOpportunities.selectedBelowBest, 2);
assert.equal(battleAnalysis.scoreOpportunities.averageGap, 10.75);
assert.equal(battleAnalysis.candidateScoreStats.playCard.missedAsBest, 1);
assert.equal(battleAnalysis.candidateScoreStats.playCard.averageMissedGap, 8);
assert.equal(battleAnalysis.candidateScoreStats.scan.missedAsBest, 1);
assert.equal(battleAnalysis.topScoreGaps[0].actionId, "scan");
assert.equal(battleAnalysis.movePayment.energyCost, 1);
assert.equal(battleAnalysis.movePayment.discardedMoveCards, 1);
assert.equal(battleAnalysis.routeTargets[0].key, "probe-location:asteroid");
assert.equal(battleAnalysis.moveFollowups[0].key, "land:mars");
assert.equal(battleAnalysis.turnPlans[0].key, "main-then-quick:launch->move");
assert.equal(battleAnalysis.turnPlanTypes[0].key, "main-then-quick");
assert.equal(battleAnalysis.turnPlanActions[0].key, "move");
assert.equal(battleAnalysis.playerProfiles[0].metrics.routeTargetCount, 1);
assert.equal(battleAnalysis.playerProfiles[0].metrics.moveFollowupCount, 1);
assert.equal(battleAnalysis.playerProfiles[0].metrics.turnPlanCount, 1);
assert.equal(battleAnalysis.playerProfiles[0].metrics.mainThenQuickCount, 1);
assert.equal(battleAnalysis.playerProfiles[0].metrics.planMoveCount, 1);
assert.equal(battleAnalysis.winner.playerId, "player-white");
assert.equal(battleAnalysis.playerProfiles.length, 2);
assert.equal(battleAnalysis.playerProfiles[0].playerId, "player-white");
assert.equal(battleAnalysis.playerProfiles[0].metrics.engineRatio, 0);
assert.equal(battleAnalysis.winnerProfileDeltas.finalScore, 5);
assert.ok(battleAnalysis.strategyTuning.weights.tech > 1);
assert.ok(battleAnalysis.strategyTuning.weights.playCard > 1);
assert.ok(battleAnalysis.strategyTuning.weights.pass < 1);
assert.ok(battleAnalysis.recommendations.some((entry) => entry.id === "score-pass-opportunity-cost"));
assert.ok(battleAnalysis.recommendations.some((entry) => entry.id === "inspect-score-gap"));
assert.ok(battleAnalysis.recommendations.some((entry) => entry.id === "inspect-card-score-gap"));

const finalMarkReport = {
  logs: [
    {
      type: "final-score-mark",
      playerId: "player-white",
      details: {
        selected: {
          tileId: "c",
          formulaId: "c1",
          immediateScore: 6,
          score: 14,
        },
        candidates: [
          { tileId: "c", formulaId: "c1", immediateScore: 6, score: 14 },
          { tileId: "d", formulaId: "d2", immediateScore: 3, score: 11 },
        ],
      },
    },
  ],
  playerResults: [
    { playerId: "player-white", playerLabel: "白色", finalScore: 30 },
    { playerId: "player-blue", playerLabel: "蓝色", finalScore: 24 },
  ],
};
const finalMarkAnalysis = analytics.analyzeBattleReport(finalMarkReport);
assert.equal(finalMarkAnalysis.finalScoreMarks[0].key, "c:c1");
assert.equal(finalMarkAnalysis.finalScoreFormulas[0].key, "c1");
assert.equal(finalMarkAnalysis.playerProfiles[0].metrics.finalScoreMarkCount, 1);
assert.equal(finalMarkAnalysis.playerProfiles[0].metrics.finalScoreImmediateValue, 6);
assert.equal(finalMarkAnalysis.winnerProfileDeltas.finalScoreImmediateValue, 6);
assert.ok(finalMarkAnalysis.strategyTuning.weights.final > 1);
const finalMarkSummary = analytics.summarizeBattleReports([finalMarkReport]);
assert.equal(finalMarkSummary.finalScoreMarks[0].key, "c:c1");
assert.equal(finalMarkSummary.finalScoreFormulas[0].key, "c1");

const routeDedupAnalysis = analytics.analyzeBattleReport({
  logs: [
    {
      type: "turn-action",
      playerId: "player-white",
      details: {
        action: {
          id: "move",
          kind: "quick",
          direction: "cw",
          routeTarget: { kind: "planet", id: "venus" },
          followupMainAction: { actionId: "orbit", planetId: "venus" },
        },
        candidates: [],
      },
    },
    {
      type: "move",
      playerId: "player-white",
      details: {
        action: {
          id: "move",
          kind: "quick",
          direction: "cw",
          routeTarget: { kind: "planet", id: "venus" },
          followupMainAction: { actionId: "orbit", planetId: "venus" },
        },
      },
    },
  ],
  playerResults: [{ playerId: "player-white", finalScore: 0 }],
});
assert.equal(routeDedupAnalysis.routeTargets[0].key, "planet:venus");
assert.equal(routeDedupAnalysis.routeTargets[0].count, 1);
assert.equal(routeDedupAnalysis.moveFollowups[0].key, "orbit:venus");
assert.equal(routeDedupAnalysis.moveFollowups[0].count, 1);
const techPlanAnalysis = analytics.analyzeBattleReport({
  logs: [{
    type: "turn-action",
    playerId: "player-white",
    details: {
      action: {
        id: "researchTech",
        kind: "main",
        plan: {
          type: "tech-synergy",
          mainActionId: "researchTech",
          actionId: "land",
          tileId: "orange3",
        },
      },
      candidates: [],
    },
  }],
  playerResults: [{ playerId: "player-white", finalScore: 0 }],
});
assert.equal(techPlanAnalysis.turnPlans[0].key, "tech-synergy:researchTech->land");
assert.equal(techPlanAnalysis.turnPlanTypes[0].key, "tech-synergy");
assert.equal(techPlanAnalysis.turnPlanActions[0].key, "land");
assert.equal(techPlanAnalysis.playerProfiles[0].metrics.turnPlanCount, 1);
assert.equal(techPlanAnalysis.playerProfiles[0].metrics.techSynergyCount, 1);
assert.equal(techPlanAnalysis.playerProfiles[0].metrics.planOrbitLandCount, 1);
const cardPlanAnalysis = analytics.analyzeBattleReport({
  logs: [{
    type: "turn-action",
    playerId: "player-white",
    details: {
      action: {
        id: "playCard",
        kind: "main",
        plan: {
          type: "card-synergy",
          mainActionId: "playCard",
          actionId: "scan",
          cardId: "b_19.webp",
        },
      },
      candidates: [],
    },
  }],
  playerResults: [{ playerId: "player-white", finalScore: 0 }],
});
assert.equal(cardPlanAnalysis.turnPlans[0].key, "card-synergy:playCard->scan");
assert.equal(cardPlanAnalysis.turnPlanTypes[0].key, "card-synergy");
assert.equal(cardPlanAnalysis.turnPlanActions[0].key, "scan");
assert.equal(cardPlanAnalysis.playerProfiles[0].metrics.turnPlanCount, 1);
assert.equal(cardPlanAnalysis.playerProfiles[0].metrics.cardSynergyCount, 1);
assert.equal(cardPlanAnalysis.playerProfiles[0].metrics.planScanCount, 1);

const battleSummary = analytics.summarizeBattleReports([
  sampleBattleReport,
  {
    lastSummary: { ok: true, blocked: false, gameEnded: true, steps: 6 },
    logs: [{ type: "turn-action", playerId: "player-white", details: { action: { id: "playCard" }, candidates: [] } }],
    bugs: [],
    playerResults: [{ playerId: "player-white", finalScore: 30 }],
  },
]);
assert.equal(battleSummary.gameCount, 2);
assert.equal(battleSummary.completedGames, 1);
assert.equal(battleSummary.blockedGames, 1);
assert.equal(battleSummary.actionCounts.playCard, 1);
assert.equal(battleSummary.actionCategoryRatios.basicMain, 0.333);
assert.equal(battleSummary.actionCategoryRatios.engine, 0.333);
assert.equal(battleSummary.opportunities.passWithAvailableMain, 1);
assert.equal(battleSummary.opportunities.selectedBelowBestScore, 2);
assert.equal(battleSummary.scoreOpportunities.averageGap, 10.75);
assert.equal(battleSummary.candidateScoreStats.playCard.missedAsBest, 1);
assert.equal(battleSummary.topScoreGaps[0].actionId, "scan");
assert.equal(battleSummary.candidateStats.playCard.availableNotSelected, 1);
assert.equal(battleSummary.routeTargets[0].key, "probe-location:asteroid");
assert.equal(battleSummary.moveFollowups[0].key, "land:mars");
assert.equal(battleSummary.turnPlans[0].key, "main-then-quick:launch->move");
assert.equal(battleSummary.turnPlanTypes[0].key, "main-then-quick");
assert.equal(battleSummary.turnPlanActions[0].key, "move");
assert.equal(battleSummary.winnerProfileDeltas.routeTargetCount, 0.5);
assert.equal(battleSummary.winnerProfileDeltas.moveFollowupCount, 0.5);
assert.equal(battleSummary.winnerProfileDeltas.turnPlanCount, 0.5);
assert.equal(battleSummary.winnerProfileDeltas.mainThenQuickCount, 0.5);
assert.equal(battleSummary.winnerProfileDeltas.planMoveCount, 0.5);
assert.equal(battleSummary.averageWinnerProfile.finalScore, 27);
assert.equal(battleSummary.winnerProfileDeltas.finalScore, 8);
assert.equal(battleSummary.winnerProfileDeltas.engineRatio, 0.5);
assert.ok(battleSummary.strategyTuning.weights.engine > 1);
assert.ok(battleSummary.strategyTuning.weights.pass < 1);
assert.ok(battleSummary.strategyTuning.rationale.length > 0);
const directTuning = analytics.deriveStrategyTuning({
  actionCategoryRatios: { basicMain: 0.5, engine: 0.1 },
  winnerProfileDeltas: { engineRatio: 0.1, techCount: 1, scanTargetCount: 2 },
  opportunities: { passWithAvailableMain: 1 },
  candidateStats: {},
  gameCount: 4,
  completionRate: 1,
});
assert.ok(directTuning.weights.engine > 1);
assert.ok(directTuning.weights.tech > 1);
assert.ok(directTuning.weights.scan > 1);
assert.ok(directTuning.weights.pass < 1);
const routeTuning = analytics.deriveStrategyTuning({
  actionCategoryRatios: { quick: 0.2, basicMain: 0.3 },
  winnerProfileDeltas: { routeTargetCount: 2, moveFollowupCount: 1, turnPlanCount: 1 },
  opportunities: {},
  candidateStats: {},
  gameCount: 4,
  completionRate: 1,
});
assert.ok(routeTuning.weights.route > 1);
assert.ok(routeTuning.weights.move > 1);
assert.ok(routeTuning.weights.orbitLand > 1);
assert.ok(routeTuning.rationale.some((entry) => entry.key === "route" && entry.reason.includes("明确路线目标")));
assert.ok(routeTuning.rationale.some((entry) => entry.key === "orbitLand" && entry.reason.includes("环绕/登陆")));
assert.ok(routeTuning.rationale.some((entry) => entry.key === "engine" && entry.reason.includes("组合计划")));
const planSpecificTuning = analytics.deriveStrategyTuning({
  actionCategoryRatios: { engine: 0.3 },
  winnerProfileDeltas: {
    cardSynergyCount: 2,
    techSynergyCount: 1,
    planScanCount: 1,
    planTaskCount: 1,
    planFinalCount: 1,
  },
  opportunities: {},
  candidateStats: {},
  gameCount: 4,
  completionRate: 1,
});
assert.ok(planSpecificTuning.weights.playCard > 1);
assert.ok(planSpecificTuning.weights.tech > 1);
assert.ok(planSpecificTuning.weights.scan > 1);
assert.ok(planSpecificTuning.weights.task > 1);
assert.ok(planSpecificTuning.weights.final > 1);
assert.ok(planSpecificTuning.rationale.some((entry) => entry.key === "playCard" && entry.reason.includes("打牌组合计划")));
const scoreGapTuning = analytics.deriveStrategyTuning({
  actionCategoryRatios: { engine: 0.2 },
  winnerProfileDeltas: {},
  opportunities: {},
  candidateStats: {},
  candidateScoreStats: {
    playCard: { missedAsBest: 2, averageMissedGap: 5 },
    researchTech: { missedAsBest: 1, averageMissedGap: 4 },
    scan: { missedAsBest: 1, averageMissedGap: 3 },
  },
  gameCount: 4,
  completionRate: 1,
});
assert.ok(scoreGapTuning.weights.playCard > 1);
assert.ok(scoreGapTuning.weights.tech > 1);
assert.ok(scoreGapTuning.weights.scan > 1);
assert.ok(scoreGapTuning.rationale.some((entry) => entry.reason.includes("高分打牌候选")));
const tuningHistory = analytics.summarizeStrategyTuningHistory([
  { label: "sample-a", summary: battleSummary },
  {
    label: "sample-b",
    summary: {
      gameCount: 4,
      completedGames: 4,
      blockedGames: 0,
      completionRate: 1,
      averageWinnerScore: 42,
      actionCategoryRatios: { basicMain: 0.5, engine: 0.1 },
      opportunities: { passWithAvailableMain: 1 },
      candidateStats: {},
      winnerProfileDeltas: { engineRatio: 0.1, techCount: 1, scanTargetCount: 2 },
      strategyTuning: directTuning,
    },
  },
], {
  baseWeights: analytics.DEFAULT_STRATEGY_WEIGHTS,
  learningRate: 0.5,
});
assert.equal(tuningHistory.entryCount, 2);
assert.equal(tuningHistory.totalGames, 6);
assert.ok(tuningHistory.targetWeights.tech > 1);
assert.ok(tuningHistory.weights.tech > 1);
assert.ok(tuningHistory.weights.tech < tuningHistory.targetWeights.tech);
assert.ok(tuningHistory.weights.pass < 1);
assert.ok(tuningHistory.rationale.length > 0);
const comparison = analytics.compareStrategyBatchResults(
  {
    summary: {
      gameCount: 2,
      completedGames: 2,
      blockedGames: 0,
      completionRate: 1,
      averageWinnerScore: 30,
      actionCategoryRatios: { engine: 0.2, basicMain: 0.3 },
      scoreOpportunities: { selectedBelowBest: 2, totalGap: 10, maxGap: 6, averageGap: 5 },
      candidateScoreStats: {
        playCard: { missedAsBest: 1, missedGapTotal: 4, averageMissedGap: 4, maxMissedGap: 4 },
      },
      winnerProfileDeltas: { techCount: 0.5 },
      routeTargetCounts: { "planet:mars": 1 },
      moveFollowupCounts: { "land:mars": 1 },
      turnPlanCounts: { "main-then-quick:launch->move": 1 },
      turnPlanTypeCounts: { "main-then-quick": 1 },
      turnPlanActionCounts: { move: 1 },
    },
    strategyWeights: analytics.DEFAULT_STRATEGY_WEIGHTS,
  },
  {
    summary: {
      gameCount: 2,
      completedGames: 2,
      blockedGames: 0,
      completionRate: 1,
      averageWinnerScore: 34,
      actionCategoryRatios: { engine: 0.3, basicMain: 0.2 },
      scoreOpportunities: { selectedBelowBest: 1, totalGap: 3, maxGap: 3, averageGap: 3 },
      candidateScoreStats: {
        playCard: { missedAsBest: 0, missedGapTotal: 0, averageMissedGap: 0, maxMissedGap: 0 },
      },
      winnerProfileDeltas: { techCount: 1.5 },
      routeTargetCounts: { "planet:mars": 3, "probe-location:asteroid": 1 },
      moveFollowupCounts: { "land:mars": 2 },
      turnPlanCounts: { "main-then-quick:launch->move": 3, "card-synergy:playCard->scan": 2 },
      turnPlanTypeCounts: { "main-then-quick": 3, "card-synergy": 2 },
      turnPlanActionCounts: { move: 3, scan: 2 },
    },
    strategyWeights: { ...analytics.DEFAULT_STRATEGY_WEIGHTS, tech: 1.12 },
  },
  { seed: "sample-ab" },
);
assert.equal(comparison.deltas.averageWinnerScore, 4);
assert.equal(comparison.deltas.actionCategoryRatios.engine, 0.1);
assert.equal(comparison.deltas.scoreOpportunities.selectedBelowBest, -1);
assert.equal(comparison.deltas.scoreOpportunities.totalGap, -7);
assert.equal(comparison.deltas.candidateScoreStats.playCard.missedAsBest, -1);
assert.equal(comparison.deltas.candidateScoreStats.playCard.missedGapTotal, -4);
assert.equal(comparison.deltas.winnerProfileDeltas.techCount, 1);
assert.equal(comparison.deltas.routeTargetCounts["planet:mars"], 2);
assert.equal(comparison.deltas.routeTargetCounts["probe-location:asteroid"], 1);
assert.equal(comparison.deltas.moveFollowupCounts["land:mars"], 1);
assert.equal(comparison.deltas.turnPlanCounts["main-then-quick:launch->move"], 2);
assert.equal(comparison.deltas.turnPlanCounts["card-synergy:playCard->scan"], 2);
assert.equal(comparison.deltas.turnPlanTypeCounts["main-then-quick"], 2);
assert.equal(comparison.deltas.turnPlanTypeCounts["card-synergy"], 2);
assert.equal(comparison.deltas.turnPlanActionCounts.move, 2);
assert.equal(comparison.deltas.turnPlanActionCounts.scan, 2);
assert.equal(comparison.verdict.improved, true);
const improvedAbTuning = {
  id: "ab-tuned-v1",
  confidence: 0.7,
  weights: { ...analytics.DEFAULT_STRATEGY_WEIGHTS, tech: 1.2 },
  deltas: comparison.deltas.winnerProfileDeltas,
  rationale: [{ key: "ab-tuned", delta: 4, reason: "same-seed tuned improved" }],
};
const improvedAbHistory = analytics.summarizeStrategyTuningHistory([{
  kind: "ab-test",
  selectedVariant: "tuned",
  label: "ab-improved",
  summary: {
    gameCount: comparison.gameCount,
    completedGames: comparison.tuned.completedGames,
    blockedGames: comparison.tuned.blockedGames,
    completionRate: comparison.tuned.completionRate,
    averageWinnerScore: comparison.tuned.averageWinnerScore,
    strategyTuning: improvedAbTuning,
  },
  strategyTuning: improvedAbTuning,
  abComparison: comparison,
}], {
  baseWeights: analytics.DEFAULT_STRATEGY_WEIGHTS,
  learningRate: 1,
});
assert.equal(improvedAbHistory.entries[0].kind, "ab-test");
assert.equal(improvedAbHistory.entries[0].selectedVariant, "tuned");
assert.equal(improvedAbHistory.entries[0].abVerdict.improved, true);
assert.ok(improvedAbHistory.targetWeights.tech > 1);
const losingComparison = analytics.compareStrategyBatchResults(
  {
    summary: {
      gameCount: 2,
      completedGames: 2,
      blockedGames: 0,
      completionRate: 1,
      averageWinnerScore: 34,
      actionCategoryRatios: { engine: 0.2 },
      winnerProfileDeltas: { techCount: 1 },
    },
    strategyWeights: analytics.DEFAULT_STRATEGY_WEIGHTS,
  },
  {
    summary: {
      gameCount: 2,
      completedGames: 2,
      blockedGames: 0,
      completionRate: 1,
      averageWinnerScore: 30,
      actionCategoryRatios: { engine: 0.3 },
      winnerProfileDeltas: { techCount: 1.5 },
    },
    strategyWeights: { ...analytics.DEFAULT_STRATEGY_WEIGHTS, tech: 1.3 },
  },
  { seed: "sample-ab-losing" },
);
assert.equal(losingComparison.verdict.improved, false);
const tunedOnlyTuning = {
  id: "batch-tuned",
  confidence: 0.8,
  weights: { ...analytics.DEFAULT_STRATEGY_WEIGHTS, tech: 1.3 },
  deltas: { techCount: 1.5 },
  rationale: [{ key: "tech", delta: 0.3, reason: "batch favored tech" }],
};
const tunedOnlyHistory = analytics.summarizeStrategyTuningHistory([{
  label: "batch-tuned",
  summary: {
    gameCount: 4,
    completedGames: 4,
    blockedGames: 0,
    completionRate: 1,
    averageWinnerScore: 30,
    strategyTuning: tunedOnlyTuning,
  },
  strategyTuning: tunedOnlyTuning,
}], {
  baseWeights: analytics.DEFAULT_STRATEGY_WEIGHTS,
  learningRate: 1,
});
const baselineAbTuning = {
  id: "ab-baseline-v1",
  confidence: 0.75,
  weights: analytics.DEFAULT_STRATEGY_WEIGHTS,
  deltas: losingComparison.deltas.winnerProfileDeltas,
  rationale: [{ key: "ab-baseline", delta: -4, reason: "same-seed tuned did not improve" }],
};
const pulledBackHistory = analytics.summarizeStrategyTuningHistory([{
  label: "batch-tuned",
  summary: {
    gameCount: 4,
    completedGames: 4,
    blockedGames: 0,
    completionRate: 1,
    averageWinnerScore: 30,
    strategyTuning: tunedOnlyTuning,
  },
  strategyTuning: tunedOnlyTuning,
}, {
  kind: "ab-test",
  selectedVariant: "baseline",
  label: "ab-losing",
  summary: {
    gameCount: losingComparison.gameCount,
    completedGames: losingComparison.baseline.completedGames,
    blockedGames: losingComparison.baseline.blockedGames,
    completionRate: losingComparison.baseline.completionRate,
    averageWinnerScore: losingComparison.baseline.averageWinnerScore,
    strategyTuning: baselineAbTuning,
  },
  strategyTuning: baselineAbTuning,
  abComparison: losingComparison,
}], {
  baseWeights: analytics.DEFAULT_STRATEGY_WEIGHTS,
  learningRate: 1,
});
assert.equal(pulledBackHistory.entries[1].selectedVariant, "baseline");
assert.equal(pulledBackHistory.entries[1].abVerdict.improved, false);
assert.ok(pulledBackHistory.targetWeights.tech < tunedOnlyHistory.targetWeights.tech);
assert.ok(battleSummary.recommendations.some((entry) => entry.id === "score-pass-opportunity-cost"));

console.log("ai.test.js: all tests passed");
