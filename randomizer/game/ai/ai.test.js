const assert = require("assert");

const valuation = require("./valuation");
const goals = require("./goals");
const actionGraph = require("./action-graph");
const planner = require("./planner");
const evaluator = require("./evaluator");
const policy = require("./policy");
const analytics = require("./battle-analytics");
const appConstants = require("../../app/constants");
const players = require("../players");
const initialCards = require("../initial-cards");
const rocketActions = require("../rockets");
const planetReferenceLayout = require("../planet-reference-layout");

const constants = appConstants.createAppConstants({
  aliens: {},
  players,
  rocketActions,
  planetReferenceLayout,
  initialCards,
});
assert.equal(constants.DEFAULT_ACTIVE_PLAYER_COUNT, 4);

const lowRoundTailDiagnostic = analytics.analyzeBattleReport({
  lastSummary: { gameEnded: true, steps: 6 },
  playerResults: [
    { playerId: "p-low", playerLabel: "低分", finalScore: 120 },
    { playerId: "p-high", playerLabel: "高分", finalScore: 320 },
  ],
  logs: [
    {
      type: "turn-action",
      playerId: "p-low",
      playerLabel: "低分",
      roundNumber: 1,
      turnNumber: 1,
      rawTurnNumber: 1,
      playerResources: { credits: 0, energy: 0, publicity: 0, handSize: 2, availableData: 0 },
      details: {
        action: { id: "cardCorner", kind: "quick", score: 1, label: "整理资源" },
        candidates: [
          { id: "cardCorner", kind: "quick", available: true, score: 1, label: "整理资源" },
          { id: "pass", kind: "pass", available: true, score: -2 },
        ],
      },
    },
    {
      type: "turn-action",
      playerId: "p-low",
      playerLabel: "低分",
      roundNumber: 1,
      turnNumber: 2,
      rawTurnNumber: 2,
      playerResources: { credits: 0, energy: 0, publicity: 0, handSize: 2, availableData: 0 },
      details: {
        action: { id: "pass", kind: "pass", score: -2 },
        candidates: [
          { id: "playCard", kind: "main", available: false, score: 12, reason: "没有资源可支付" },
          { id: "scan", kind: "main", available: false, score: 8, reason: "能量不足" },
          { id: "pass", kind: "pass", available: true, score: -2 },
        ],
      },
    },
    {
      type: "turn-action",
      playerId: "p-high",
      playerLabel: "高分",
      roundNumber: 1,
      turnNumber: 1,
      rawTurnNumber: 1,
      playerResources: { credits: 3, energy: 3, publicity: 2, handSize: 4, availableData: 2 },
      details: {
        action: { id: "researchTech", kind: "main", score: 40 },
        candidates: [
          { id: "researchTech", kind: "main", available: true, score: 40 },
          { id: "pass", kind: "pass", available: true, score: -2 },
        ],
      },
    },
    {
      type: "turn-action",
      playerId: "p-high",
      playerLabel: "高分",
      roundNumber: 1,
      turnNumber: 2,
      rawTurnNumber: 2,
      playerResources: { credits: 2, energy: 2, publicity: 1, handSize: 4, availableData: 4 },
      details: {
        action: { id: "scan", kind: "main", score: 35 },
        candidates: [
          { id: "scan", kind: "main", available: true, score: 35 },
          { id: "pass", kind: "pass", available: true, score: -2 },
        ],
      },
    },
  ],
});
const lowRoundTailSample = lowRoundTailDiagnostic.lowRoundActionTailSamples.find((sample) => sample.playerId === "p-low");
assert.ok(lowRoundTailSample, "low-round tail diagnostic should include the low-score player");
assert.equal(lowRoundTailSample.mainActionCount, 0);
assert.equal(lowRoundTailSample.actionTail.at(-1).selected.id, "pass");
assert.equal(lowRoundTailSample.lastPassCandidateProfile.reasonTag, "resource-locked-hand");
assert.deepStrictEqual(lowRoundTailSample.tailSummary.actionIds, ["cardCorner", "pass"]);
assert.equal(lowRoundTailSample.tailSummary.lastPassReasonTag, "resource-locked-hand");
assert.equal(lowRoundTailSample.tailSummary.playCardReason, "没有资源可支付");
assert.deepStrictEqual(lowRoundTailSample.tailResourceDelta, {
  score: 0,
  credits: 0,
  energy: 0,
  publicity: 0,
  availableData: 0,
  handSize: 0,
});
assert.ok(lowRoundTailSample.tailTags.includes("zero-credit-tail"));
assert.ok(lowRoundTailSample.tailTags.includes("zero-energy-tail"));
assert.ok(lowRoundTailSample.tailTags.includes("zero-data-tail"));
assert.ok(lowRoundTailSample.tailTags.includes("pass-resource-locked-hand"));
assert.ok(lowRoundTailSample.tailTags.includes("play-card-resource-lock"));
assert.equal(
  analytics.summarizeBattleAnalyses([lowRoundTailDiagnostic]).lowRoundActionTailSamples[0].playerId,
  "p-low",
);
assert.deepStrictEqual(
  analytics.summarizeBattleAnalyses([lowRoundTailDiagnostic]).lowRoundActionTailSamples[0].tailSummary.actionIds,
  ["cardCorner", "pass"],
);
assert.ok(
  analytics.summarizeBattleAnalyses([lowRoundTailDiagnostic]).lowRoundActionTailSamples[0].tailTags.includes("zero-credit-tail"),
);

const midgameRouteEnergyTradeDiagnostic = analytics.analyzeBattleReport({
  lastSummary: { gameEnded: true, steps: 8 },
  playerResults: [
    { playerId: "p-low", playerLabel: "低分", finalScore: 170 },
  ],
  logs: [
    {
      type: "turn-action",
      playerId: "p-low",
      playerLabel: "低分",
      roundNumber: 3,
      turnNumber: 1,
      rawTurnNumber: 1,
      playerResources: { score: 80, credits: 2, energy: 1, publicity: 4, handSize: 7, availableData: 0 },
      scoreboard: [
        {
          playerId: "p-low",
          score: 80,
          credits: 2,
          energy: 1,
          publicity: 4,
          availableData: 0,
          handSize: 7,
          techCount: 3,
          reservedCount: 2,
        },
      ],
      details: {
        action: {
          id: "quickTrade",
          kind: "quick",
          tradeId: "credits-for-energy",
          label: "2信用点 -> 1能量",
          score: 34,
          reason: "路线兑现：信用点换能量准备环绕/登陆",
          valueBreakdown: {
            lateResourceRecoveryTrade: true,
            currentScore: 80,
            finalMarkCount: 3,
            nextFinalMarkThreshold: null,
            canReachAnalyze: false,
            planetCashoutRecoveryScore: 33,
            planetCashoutRecoveryPlan: {
              kind: "land",
              planetId: "mars",
              planetName: "火星",
              targetEnergy: 2,
              directScore: 6,
              rewardValue: 25,
              energyAfterTrade: 2,
              afterTradeGap: 0,
              reachesNextThreshold: false,
              score: 33,
            },
          },
        },
        candidates: [
          {
            id: "quickTrade",
            kind: "quick",
            tradeId: "credits-for-energy",
            label: "2信用点 -> 1能量",
            available: true,
            score: 34,
          },
          { id: "pass", kind: "pass", available: true, score: -4 },
        ],
      },
    },
    {
      type: "turn-action",
      playerId: "p-low",
      playerLabel: "低分",
      roundNumber: 3,
      turnNumber: 2,
      rawTurnNumber: 2,
      playerResources: { score: 88, credits: 0, energy: 2, publicity: 4, handSize: 7, availableData: 0 },
      details: {
        action: { id: "land", kind: "main", score: 22 },
        candidates: [
          { id: "land", kind: "main", available: true, score: 22 },
          { id: "pass", kind: "pass", available: true, score: -4 },
        ],
      },
    },
    {
      type: "turn-action",
      playerId: "p-low",
      playerLabel: "低分",
      roundNumber: 3,
      turnNumber: 3,
      rawTurnNumber: 3,
      playerResources: { score: 100, credits: 0, energy: 1, publicity: 5, handSize: 5, availableData: 0 },
      details: {
        action: { id: "researchTech", kind: "main", score: 18 },
        candidates: [
          { id: "researchTech", kind: "main", available: true, score: 18 },
          { id: "pass", kind: "pass", available: true, score: -4 },
        ],
      },
    },
    {
      type: "turn-action",
      playerId: "p-low",
      playerLabel: "低分",
      roundNumber: 3,
      turnNumber: 4,
      rawTurnNumber: 4,
      playerResources: { score: 100, credits: 0, energy: 1, publicity: 5, handSize: 4, availableData: 0 },
      details: {
        action: { id: "pass", kind: "pass", score: -4 },
        candidates: [
          { id: "playCard", kind: "main", available: false, score: 12, reason: "没有资源可支付" },
          { id: "scan", kind: "main", available: false, score: 8, reason: "能量不足" },
          { id: "researchTech", kind: "main", available: false, score: 18, reason: "宣传不足" },
          { id: "pass", kind: "pass", available: true, score: -4 },
        ],
      },
    },
  ],
});
assert.equal(midgameRouteEnergyTradeDiagnostic.midgameLowTechRouteEnergyTradeSamples.length, 1);
const midgameRouteEnergyTradeSample = midgameRouteEnergyTradeDiagnostic.midgameLowTechRouteEnergyTradeSamples[0];
assert.deepStrictEqual(midgameRouteEnergyTradeSample.followup.actionIds, ["land", "researchTech", "pass"]);
assert.equal(midgameRouteEnergyTradeSample.followup.firstPlanetCashoutActionId, "land");
assert.equal(midgameRouteEnergyTradeSample.followup.firstEngineActionId, "researchTech");
assert.equal(midgameRouteEnergyTradeSample.followup.lastPassReasonTag, "resource-locked-hand");
assert.ok(midgameRouteEnergyTradeSample.followup.tags.includes("engine-followup"));
assert.ok(midgameRouteEnergyTradeSample.followup.tags.includes("planet-cashout-before-engine"));
assert.ok(midgameRouteEnergyTradeSample.followup.tags.includes("tail-pass-resource-locked-hand"));

assert.equal(evaluator.getResourceValue({ credits: 1, energy: 1, publicity: 1 }), 7);
assert.equal(evaluator.getRemainingIncomeMultiplier(1), 3);
assert.equal(evaluator.getRemainingIncomeMultiplier(4), 0);
assert.equal(valuation.getIncomeRawValue({ credits: 1 }, { roundNumber: 1 }), 9);
assert.equal(valuation.getIncomeNetValue({ credits: 1 }, {
  roundNumber: 1,
  hand: [{ label: "low" }, { label: "alien:strong", alienCard: true }],
}), 6);
assert.equal(valuation.getPhaseResourceValues(1).credits, 5);
assert.equal(valuation.getPhaseResourceValues(1).energy, 5);
assert.equal(valuation.getPhaseResourceValues(3).energy, 3);
assert.equal(valuation.getIncomeNetValue({ credits: 1 }, {
  roundNumber: 1,
  usePhaseResourceValues: true,
  hand: [{ label: "low" }, { label: "alien:strong", alienCard: true }],
}), 12);
const earlyCreditIncomeFit = valuation.estimateIncomeStrategicAdjustment({ credits: 1 }, {
  roundNumber: 1,
  currentIncome: { credits: 2, energy: 1, handSize: 2 },
  currentResources: { credits: 1, energy: 2, handSize: 3 },
});
const earlyExtraHandIncomeFit = valuation.estimateIncomeStrategicAdjustment({ handSize: 1 }, {
  roundNumber: 1,
  currentIncome: { credits: 2, energy: 1, handSize: 2 },
  currentResources: { credits: 1, energy: 2, handSize: 3 },
});
const firstHandIncomeFit = valuation.estimateIncomeStrategicAdjustment({ handSize: 1 }, {
  roundNumber: 1,
  currentIncome: { credits: 4, energy: 2, handSize: 0 },
  currentResources: { credits: 4, energy: 2, handSize: 1 },
});
assert.ok(earlyCreditIncomeFit > 0);
assert.ok(earlyExtraHandIncomeFit < 0);
assert.ok(earlyCreditIncomeFit > earlyExtraHandIncomeFit + 8);
assert.ok(firstHandIncomeFit > earlyExtraHandIncomeFit + 5);
const zeroIncomeFirstMarkPenalty = valuation.estimateFinalTileZeroBasePenalty({
  formulaId: "a2",
  baseValue: 0,
  threshold: 25,
  roundNumber: 2,
  finalRoundNumber: 4,
  slotIndex: 1,
});
assert.ok(
  zeroIncomeFirstMarkPenalty >= 8,
  "zero-base A2 first mark should be penalized even at the 25-point threshold",
);
assert.equal(
  valuation.estimateFinalTileZeroBasePenalty({
    formulaId: "b1",
    baseValue: 0,
    threshold: 25,
    roundNumber: 2,
    finalRoundNumber: 4,
    slotIndex: 1,
  }),
  0,
  "non-income first marks keep the old early zero-base behavior",
);
assert.equal(
  valuation.estimateFinalTileZeroBasePenalty({
    formulaId: "a1",
    baseValue: 1,
    threshold: 25,
    roundNumber: 2,
    finalRoundNumber: 4,
    slotIndex: 1,
  }),
  0,
  "income formulas with real post-company income growth are not penalized",
);
const earlyHighCostScorePenalty = valuation.estimateHighCostPointConversionPenalty({
  roundNumber: 1,
  currentScore: 10,
  finalMarkCount: 0,
  currentResources: { credits: 1, energy: 1, handSize: 2 },
  directScore: 15,
  payData: 3,
});
const lateHighCostScorePenalty = valuation.estimateHighCostPointConversionPenalty({
  roundNumber: 4,
  currentScore: 60,
  finalMarkCount: 2,
  currentResources: { credits: 4, energy: 4, handSize: 4 },
  directScore: 15,
  payData: 3,
});
const crossingHighCostScorePenalty = valuation.estimateHighCostPointConversionPenalty({
  roundNumber: 3,
  currentScore: 47,
  finalMarkCount: 1,
  currentResources: { credits: 3, energy: 3, handSize: 4 },
  directScore: 15,
  payData: 3,
});
assert.ok(earlyHighCostScorePenalty > 12);
assert.equal(lateHighCostScorePenalty, 0);
assert.ok(crossingHighCostScorePenalty < earlyHighCostScorePenalty);
assert.deepStrictEqual(valuation.getLaunchPaymentCost(), { credits: 2 });
assert.deepStrictEqual(valuation.getLaunchPaymentCost({ skipCost: true }), {});
assert.deepStrictEqual(valuation.getLaunchPaymentCost({ cost: { energy: 1, credits: 0 } }), { energy: 1 });
assert.equal(valuation.getMovePaymentCost({
  requiredMovePoints: 1,
  availableEnergy: 1,
  resourceValues: { energy: 5, handSize: 3 },
}), 5);
assert.equal(valuation.getMovePaymentCost({
  requiredMovePoints: 1,
  availableEnergy: 1,
  movePaymentCards: [{ label: "cheap move", movePayment: true, aiValue: 2 }],
  resourceValues: { energy: 5, handSize: 3 },
}), 2);
assert.equal(valuation.getMovePaymentCost({
  requiredMovePoints: 2,
  availableEnergy: 1,
  movePaymentCards: [{ label: "cheap move", movePayment: true, aiValue: 2 }],
  resourceValues: { energy: 5, handSize: 3 },
}), 7);
assert.equal(evaluator.getIncomeValue({ credits: 1 }, { roundNumber: 1 }), 9);
assert.equal(evaluator.getIncomeValue({ credits: 1 }, { roundNumber: 1, discardedCardValue: 3 }), 6);

const inferredGoals = goals.inferGoals({
  turnState: { roundNumber: 1 },
  playerState: { players: [{ id: "p1", resources: { score: 12, availableData: 4 } }] },
}, "p1");
assert.ok(inferredGoals.some((goal) => goal.id === goals.GOAL_IDS.FIRST_ROUND_SCORE_25));
assert.ok(inferredGoals.some((goal) => goal.id === goals.GOAL_IDS.OPENING_INCOME));
assert.ok(goals.scoreCandidateForGoals({ id: "scan" }, inferredGoals) > 0);
const contestedTraceGoals = goals.inferGoals({
  turnState: { roundNumber: 1 },
  playerState: { players: [{ id: "p1", resources: { score: 8, credits: 2, energy: 2, availableData: 1 } }] },
}, "p1", {
  traceCompetition: {
    firstTrace: {
      yellow: { open: 0, own: 0, takenByOthers: 2, revealed: 0 },
      pink: { open: 2, own: 0, takenByOthers: 0, revealed: 0 },
      blue: { open: 2, own: 0, takenByOthers: 0, revealed: 0 },
    },
    yellowLandingPressure: 1,
  },
});
const contestedYellowGoal = contestedTraceGoals.find((goal) => goal.id === goals.GOAL_IDS.GRAB_TRACE_YELLOW);
const contestedPinkGoal = contestedTraceGoals.find((goal) => goal.id === goals.GOAL_IDS.GRAB_TRACE_PINK);
assert.ok(contestedYellowGoal.feasibility < contestedPinkGoal.feasibility);
const openYellowSupport = goals.scoreCandidateForGoals(
  { id: "land", plan: { actionId: "land" } },
  [{ id: goals.GOAL_IDS.GRAB_TRACE_YELLOW, value: 10, priority: 1, feasibility: 1 }],
  {},
  "p1",
  { traceCompetition: { firstTrace: { yellow: { open: 2, revealed: 0 } }, yellowLandingPressure: 0 } },
);
const pressuredYellowSupport = goals.scoreCandidateForGoals(
  { id: "land", plan: { actionId: "land" } },
  [{ id: goals.GOAL_IDS.GRAB_TRACE_YELLOW, value: 10, priority: 1, feasibility: 1 }],
  {},
  "p1",
  { traceCompetition: { firstTrace: { yellow: { open: 0, revealed: 0 } }, yellowLandingPressure: 1 } },
);
assert.ok(pressuredYellowSupport < openYellowSupport * 0.5);
assert.equal(policy.chooseAlienUseOption([
  { choice: "12", label: "拥有3个橙色科技 · 14分 · 威胁6" },
  { choice: "0", label: "九折有6个痕迹 · 7分 · 威胁0" },
  { choice: "2", label: "完成2个蓝色扇区 · 12分 · 威胁4" },
])?.choice, "12");

const graph = actionGraph.buildActionGraph([
  { id: "researchTech", kind: "main", available: true, score: 5, valueBreakdown: { costValue: 2 } },
], {}, "p1", {
  goals: [{ id: goals.GOAL_IDS.FINAL_TILE_FOCUS, value: 4, priority: 1, feasibility: 1 }],
  markedFormulas: [{ formulaId: "d2", multiplier: 7 }],
});
assert.equal(graph.length, 1);
assert.ok(graph[0].finalMarginal > 0);
assert.ok(graph[0].net > 5);
assert.equal(graph[0].breakdown.cost, 2);
const plainC2PlayCardGraph = actionGraph.buildActionGraph([
  { id: "playCard", kind: "main", available: true, score: 0 },
], {}, "p1", {
  goals: [],
  markedFormulas: [{ formulaId: "c2", multiplier: 8 }],
});
assert.equal(plainC2PlayCardGraph[0].finalMarginal, 0);
const c2ProgressPlayCardGraph = actionGraph.buildActionGraph([
  { id: "playCard", kind: "main", available: true, score: 0, finalFormulaDeltas: { c2: 1 } },
], {}, "p1", {
  goals: [],
  markedFormulas: [{ formulaId: "c2", multiplier: 8 }],
});
assert.ok(c2ProgressPlayCardGraph[0].finalMarginal > 0);
const finalTileGoal = [{ id: goals.GOAL_IDS.FINAL_TILE_FOCUS, value: 10, priority: 1, feasibility: 1 }];
assert.equal(goals.scoreCandidateForGoals(
  { id: "playCard", kind: "main", available: true, score: 0 },
  finalTileGoal,
), 0);
assert.ok(goals.scoreCandidateForGoals(
  { id: "playCard", kind: "main", available: true, score: 0, finalFormulaDeltas: { c2: 1 } },
  finalTileGoal,
) > 0);
assert.ok(goals.scoreCandidateForGoals(
  { id: "playCard", kind: "main", available: true, score: 0, valueBreakdown: { c2Type3ProgressValue: 3 } },
  finalTileGoal,
) > 0);
const cornerGraph = actionGraph.buildActionGraph([
  { id: "cardCorner", kind: "quick", available: true, gain: 4, cost: 2 },
], {}, "p1", {
  markedFormulas: [{ formulaId: "a1", multiplier: 6 }],
});
assert.ok(cornerGraph[0].finalMarginal > 0);
assert.ok(cornerGraph[0].net > 2);
assert.equal(valuation.getNextMissingFinalScoreThreshold(47, 1), 50);
assert.equal(valuation.getNextMissingFinalScoreThreshold(51, 2), 70);
assert.equal(valuation.getNextMissingFinalScoreThreshold(72, 3), null);
const lateWeakTechPenalty = valuation.estimateMissingFinalMarkPenalty(
  { id: "researchTech", directScoreGain: 2 },
  { currentScore: 47, finalMarkCount: 1, roundNumber: 4 },
);
const lateScanPenalty = valuation.estimateMissingFinalMarkPenalty(
  { id: "scan", directScoreGain: 0 },
  { currentScore: 47, finalMarkCount: 1, roundNumber: 4 },
);
const lateCrossingTechPenalty = valuation.estimateMissingFinalMarkPenalty(
  { id: "researchTech", directScoreGain: 3 },
  { currentScore: 47, finalMarkCount: 1, roundNumber: 4 },
);
assert.ok(lateWeakTechPenalty > lateScanPenalty);
assert.equal(lateCrossingTechPenalty, 0);
assert.ok(valuation.estimateMissingFinalMarkPenalty(
  { id: "researchTech", directScoreGain: 2 },
  { currentScore: 50, finalMarkCount: 2, roundNumber: 4 },
) > 30);
assert.equal(valuation.estimateFinalMarkCashoutValue(3, {
  currentScore: 47,
  finalMarkCount: 1,
  roundNumber: 4,
}), 12);
const thirdMarkCrossingValue = valuation.estimateFinalMarkCashoutValue(6, {
  currentScore: 64,
  finalMarkCount: 2,
  roundNumber: 4,
});
const thirdMarkNearValue = valuation.estimateFinalMarkCashoutValue(3, {
  currentScore: 64,
  finalMarkCount: 2,
  roundNumber: 4,
});
assert.ok(thirdMarkCrossingValue > 20);
assert.ok(thirdMarkCrossingValue > thirdMarkNearValue);
assert.equal(valuation.estimateFinalTileZeroBasePenalty({
  baseValue: 0,
  threshold: 25,
  roundNumber: 4,
  slotIndex: 1,
}), 0);
assert.equal(valuation.estimateFinalTileZeroBasePenalty({
  baseValue: 2,
  threshold: 70,
  roundNumber: 4,
  slotIndex: 1,
}), 0);
const zeroBaseSecondMarkPenalty = valuation.estimateFinalTileZeroBasePenalty({
  baseValue: 0,
  threshold: 50,
  roundNumber: 4,
  slotIndex: 1,
});
const zeroBaseThirdMarkPenalty = valuation.estimateFinalTileZeroBasePenalty({
  baseValue: 0,
  threshold: 70,
  roundNumber: 4,
  slotIndex: 1,
});
const earlyZeroBaseThirdMarkPenalty = valuation.estimateFinalTileZeroBasePenalty({
  baseValue: 0,
  threshold: 70,
  roundNumber: 2,
  slotIndex: 1,
});
assert.ok(zeroBaseSecondMarkPenalty >= 9);
assert.ok(zeroBaseThirdMarkPenalty > zeroBaseSecondMarkPenalty);
assert.ok(earlyZeroBaseThirdMarkPenalty < zeroBaseThirdMarkPenalty);
const finalRoundPassBeforeSecondMarkPenalty = valuation.estimateFinalRoundPassPenalty({
  currentScore: 28,
  finalMarkCount: 1,
  roundNumber: 4,
});
const finalRoundPassBeforeThirdMarkPenalty = valuation.estimateFinalRoundPassPenalty({
  currentScore: 66,
  finalMarkCount: 2,
  roundNumber: 4,
});
const preFinalRoundPassPenalty = valuation.estimateFinalRoundPassPenalty({
  currentScore: 28,
  finalMarkCount: 1,
  roundNumber: 3,
});
assert.ok(finalRoundPassBeforeSecondMarkPenalty > 25);
assert.ok(finalRoundPassBeforeSecondMarkPenalty > finalRoundPassBeforeThirdMarkPenalty);
assert.equal(preFinalRoundPassPenalty, 0);
assert.equal(valuation.estimateSecondMarkAnalyzeEnergyTradeValue({
  currentScore: 47,
  finalMarkCount: 1,
  energy: 0,
  credits: 2,
  roundNumber: 4,
  turnNumber: 6,
  canReachAnalyze: true,
  hasIncomeFormula: true,
  hasAnalyzeReadyDataSlot: true,
  bestRevealedBlueTraceScore: 2,
  placedComputerData: 4,
}), 0);
assert.ok(valuation.estimateSecondMarkAnalyzeEnergyTradeValue({
  currentScore: 47,
  finalMarkCount: 1,
  energy: 0,
  credits: 2,
  roundNumber: 4,
  turnNumber: 6,
  hasAnalyzeReadyDataSlot: true,
  bestRevealedBlueTraceScore: 3,
  placedComputerData: 4,
}) > 0);
assert.ok(valuation.estimateSecondMarkAnalyzeEnergyTradeValue({
  currentScore: 49,
  finalMarkCount: 1,
  energy: 0,
  credits: 2,
  roundNumber: 4,
  turnNumber: 6,
  canReachAnalyze: true,
  hasIncomeFormula: true,
  placedComputerData: 5,
}) > 0);
assert.ok(valuation.estimateSecondMarkAnalyzeEnergyTradeValue({
  currentScore: 49,
  finalMarkCount: 1,
  energy: 0,
  credits: 0,
  handSize: 2,
  roundNumber: 4,
  turnNumber: 6,
  canReachAnalyze: true,
  hasIncomeFormula: true,
  placedComputerData: 5,
}) > 0);
const finalCashoutGraph = actionGraph.buildActionGraph([
  { id: "researchTech", kind: "main", available: true, score: 7, directScoreGain: 6 },
  { id: "scan", kind: "main", available: true, score: 10, directScoreGain: 0 },
], {
  turnState: { roundNumber: 4 },
  currentPlayer: { id: "p1", resources: { score: 64 } },
  aiMarkedFinalFormulas: [{ formulaId: "a1" }, { formulaId: "b1" }],
}, "p1");
assert.ok(finalCashoutGraph[0].finalMarkCashout > 20);
assert.equal(finalCashoutGraph[0].missingFinalMarkPenalty, 0);
assert.ok(finalCashoutGraph[1].missingFinalMarkPenalty > 0);
assert.ok(finalCashoutGraph[0].net > finalCashoutGraph[1].net);
const cashoutIncludedGraph = actionGraph.buildActionGraph([
  { id: "land", kind: "main", available: true, score: 30, directScoreGain: 6, finalMarkCashoutIncluded: true },
], {
  turnState: { roundNumber: 4 },
  currentPlayer: { id: "p1", resources: { score: 64 } },
  aiMarkedFinalFormulas: [{ formulaId: "a1" }, { formulaId: "b1" }],
}, "p1");
assert.equal(cashoutIncludedGraph[0].finalMarkCashout, 0);
const weakTechGraph = actionGraph.buildActionGraph([
  { id: "researchTech", kind: "main", available: true, score: 16, directScoreGain: 2 },
  { id: "playCard", kind: "main", available: true, score: 9, directScoreGain: 3 },
], {
  turnState: { roundNumber: 4 },
  currentPlayer: { id: "p1", resources: { score: 47 } },
  aiMarkedFinalFormulas: [{ formulaId: "d2" }],
}, "p1");
assert.ok(weakTechGraph[0].missingFinalMarkPenalty > 0);
assert.equal(weakTechGraph[1].missingFinalMarkPenalty, 0);
assert.ok(weakTechGraph[1].net > weakTechGraph[0].net);
const lateProgressGraph = actionGraph.buildActionGraph([
  { id: "placeData", kind: "quick", available: true, score: 2, directScoreGain: 2 },
  { id: "end-turn", kind: "end-turn", available: true, score: -24 },
], {
  turnState: { roundNumber: 4 },
  currentPlayer: { id: "p1", resources: { score: 21 } },
  aiMarkedFinalFormulas: [],
}, "p1");
assert.ok(lateProgressGraph[0].finalMarkCashout > 0);
assert.ok(lateProgressGraph[0].missingFinalMarkPenalty > 0);
assert.ok(lateProgressGraph[0].net > lateProgressGraph[1].net);
const thirdMarkRecoveryGraph = actionGraph.buildActionGraph([
  { id: "researchTech", kind: "main", available: true, score: 17, directScoreGain: 2 },
  { id: "quickTrade", kind: "quick", available: true, tradeId: "publicity-for-card", score: 16 },
], {
  turnState: { roundNumber: 4 },
  currentPlayer: { id: "p1", resources: { score: 50 } },
  aiMarkedFinalFormulas: [{ formulaId: "a1" }, { formulaId: "b1" }],
}, "p1");
assert.ok(thirdMarkRecoveryGraph[0].missingFinalMarkPenalty > 30);
assert.ok(thirdMarkRecoveryGraph[1].net > thirdMarkRecoveryGraph[0].net);

const hiddenTraceState = {
  aliens: {
    1: {
      revealed: false,
      traces: {
        yellow: { firstPlaced: false, ownerPlayerColor: null, extraCount: 0 },
        pink: { firstPlaced: true, ownerPlayerColor: "blue", extraCount: 0 },
        blue: { firstPlaced: true, ownerPlayerColor: "green", extraCount: 0 },
      },
    },
    2: {
      revealed: false,
      assignedAlienId: "jiuzhe",
      traces: {
        yellow: { firstPlaced: false, ownerPlayerColor: null, extraCount: 0 },
        pink: { firstPlaced: true, ownerPlayerColor: "blue", extraCount: 0 },
        blue: { firstPlaced: true, ownerPlayerColor: "green", extraCount: 0 },
      },
    },
  },
};
const firstTraceValue = valuation.estimateAlienTraceValue({
  alienGameState: hiddenTraceState,
  alienSlotId: 1,
  traceType: "yellow",
});
const repeatedTraceValue = valuation.estimateAlienTraceValue({
  alienGameState: hiddenTraceState,
  alienSlotId: 1,
  traceType: "pink",
  player: { color: "white" },
});
const jiuzheTraceValue = valuation.estimateAlienTraceValue({
  alienGameState: hiddenTraceState,
  alienSlotId: 2,
  traceType: "yellow",
});
const competitiveTraceValue = valuation.estimateAlienTraceValue({
  alienGameState: hiddenTraceState,
  alienSlotId: 1,
  traceType: "yellow",
  activeOpponentCount: 3,
});
const revealedTraceAfterStolenFirstValue = valuation.estimateAlienTraceValue({
  revealed: true,
  mode: "banrenma-grid",
  traceType: "pink",
  position: 2,
  reward: { gain: { score: 3 } },
});
const hiddenBackupAfterStolenFirstValue = valuation.estimateAlienTraceValue({
  alienGameState: {
    aliens: {
      1: {
        revealed: false,
        traces: {
          pink: { firstPlaced: true, ownerPlayerColor: "blue", extraCount: 0 },
        },
      },
      2: {
        revealed: false,
        traces: {
          pink: { firstPlaced: false, ownerPlayerColor: null, extraCount: 0 },
        },
      },
    },
  },
  alienSlotId: 2,
  traceType: "pink",
  player: { color: "white" },
  activeOpponentCount: 3,
});
assert.ok(firstTraceValue >= 10);
assert.ok(firstTraceValue > repeatedTraceValue);
assert.ok(repeatedTraceValue < 2);
assert.ok(revealedTraceAfterStolenFirstValue > repeatedTraceValue + 3);
assert.ok(revealedTraceAfterStolenFirstValue > hiddenBackupAfterStolenFirstValue + 3);
assert.ok(jiuzheTraceValue < firstTraceValue);
assert.ok(competitiveTraceValue > firstTraceValue + 4);

assert.equal(
  valuation.estimateJiuzheThreatPenaltyMarginal({
    currentThreat: 0,
    otherThreats: [0, 0, 0],
    addedThreat: 1,
    currentPrePenaltyScore: 95,
  }),
  9,
  "0 -> positive threat must become penalized when every opponent remains at 0",
);
assert.equal(
  valuation.estimateJiuzheThreatPenaltyMarginal({
    currentThreat: 2,
    otherThreats: [5, 1, 0],
    addedThreat: 3,
    currentPrePenaltyScore: 95,
  }),
  9,
  "tying the highest opponent must incur the real Jiuzhe score penalty",
);
assert.equal(
  valuation.estimateJiuzheThreatPenaltyMarginal({
    currentThreat: 2,
    otherThreats: [5, 1, 0],
    addedThreat: 4,
    currentPrePenaltyScore: 95,
  }),
  9,
  "becoming the unique highest threat must incur the same real score penalty",
);
assert.equal(
  valuation.estimateJiuzheThreatPenaltyMarginal({
    currentThreat: 2,
    otherThreats: [6, 1, 0],
    addedThreat: 3,
    currentPrePenaltyScore: 95,
  }),
  0,
  "remaining below the highest opponent must not invent a threat penalty",
);
assert.equal(
  valuation.estimateJiuzheThreatPenaltyMarginal({
    currentThreat: 5,
    otherThreats: [5, 2, 0],
    addedThreat: 2,
    currentPrePenaltyScore: 95,
  }),
  0,
  "an already penalized tied leader should not pay the same penalty twice",
);
assert.equal(
  valuation.estimateJiuzheThreatPenaltyMarginal({
    currentThreat: 6,
    otherThreats: [5, 2, 0],
    addedThreat: 3,
    currentPrePenaltyScore: 95,
  }),
  0,
  "an already unique leader normally has zero marginal threat penalty",
);
assert.equal(
  valuation.estimateJiuzheThreatPenaltyMarginal({
    currentThreat: 6,
    otherThreats: [5, 2, 0],
    addedThreat: 3,
    currentPrePenaltyScore: 100,
    scoreGain: 10,
  }),
  1,
  "an existing leader should only pay the exact incremental penalty on newly projected score",
);

const safeJiuzheRewardValue = valuation.estimateAlienTraceValue({
  revealed: true,
  mode: "jiuzhe-grid",
  traceType: "yellow",
  position: 2,
  reward: { gain: { score: 4, credits: 1 }, threat: 2 },
  jiuzheThreatContext: {
    currentThreat: 0,
    otherThreats: [8, 0, 0],
    currentPrePenaltyScore: 95,
  },
});
const exposedJiuzheRewardValue = valuation.estimateAlienTraceValue({
  revealed: true,
  mode: "jiuzhe-grid",
  traceType: "yellow",
  position: 2,
  reward: { gain: { score: 4, credits: 1 }, threat: 2 },
  jiuzheThreatContext: {
    currentThreat: 0,
    otherThreats: [0, 0, 0],
    currentPrePenaltyScore: 95,
  },
});
assert.equal(
  safeJiuzheRewardValue - exposedJiuzheRewardValue,
  9,
  "Jiuzhe trace reward valuation must reuse the exact threat penalty marginal",
);

const neutralHiddenTraceState = {
  aliens: {
    1: {
      revealed: false,
      traces: {
        yellow: { firstPlaced: false, ownerPlayerColor: null, extraCount: 0 },
      },
    },
    2: {
      revealed: false,
      traces: {
        yellow: { firstPlaced: false, ownerPlayerColor: null, extraCount: 0 },
      },
    },
  },
};
const slot1FirstTraceValue = valuation.estimateAlienTraceValue({
  alienGameState: neutralHiddenTraceState,
  alienSlotId: 1,
  traceType: "yellow",
  activeOpponentCount: 3,
});
const slot2FirstTraceValue = valuation.estimateAlienTraceValue({
  alienGameState: neutralHiddenTraceState,
  alienSlotId: 2,
  traceType: "yellow",
  activeOpponentCount: 3,
});
assert.ok(slot1FirstTraceValue > slot2FirstTraceValue + 1);
const slot1FallbackTraceValue = valuation.estimateAlienTraceValue({
  alienGameState: { aliens: { 1: { revealed: false } } },
  alienSlotId: 1,
  activeOpponentCount: 3,
});
const slot2FallbackTraceValue = valuation.estimateAlienTraceValue({
  alienGameState: { aliens: { 2: { revealed: false } } },
  alienSlotId: 2,
  activeOpponentCount: 3,
});
assert.ok(slot1FallbackTraceValue > slot2FallbackTraceValue + 1);
const highRewardTraceValue = valuation.estimateAlienTraceValue({
  revealed: true,
  mode: "banrenma-grid",
  traceType: "pink",
  position: 2,
  reward: { payData: 3, gain: { score: 15 } },
});
const lowerRewardTraceValue = valuation.estimateAlienTraceValue({
  revealed: true,
  mode: "banrenma-grid",
  traceType: "pink",
  position: 4,
  reward: { gain: { score: 3 }, pickAlienCard: true },
});
assert.ok(highRewardTraceValue > lowerRewardTraceValue);
const earlyAlienCardTraceValue = valuation.estimateAlienTraceValue({
  revealed: true,
  mode: "banrenma-grid",
  traceType: "pink",
  position: 4,
  reward: { gain: { score: 3 }, pickAlienCard: true },
  alienCardExpectedValue: 5.5,
});
const lateAlienCardTraceValue = valuation.estimateAlienTraceValue({
  revealed: true,
  mode: "banrenma-grid",
  traceType: "pink",
  position: 4,
  reward: { gain: { score: 3 }, pickAlienCard: true },
  alienCardExpectedValue: 1.5,
});
assert.ok(earlyAlienCardTraceValue > lateAlienCardTraceValue + 3);
const revealedPosition1Value = valuation.estimateAlienTraceValue({
  revealed: true,
  mode: "aomomo-grid",
  traceType: "blue",
  position: 1,
  reward: { pickAlienCard: true },
});
const revealedPosition3Value = valuation.estimateAlienTraceValue({
  revealed: true,
  mode: "aomomo-grid",
  traceType: "blue",
  position: 3,
  reward: { pickAlienCard: true },
});
const revealedPosition5Value = valuation.estimateAlienTraceValue({
  revealed: true,
  mode: "aomomo-grid",
  traceType: "blue",
  position: 5,
  reward: { pickAlienCard: true },
});
assert.ok(revealedPosition5Value > revealedPosition3Value);
assert.ok(revealedPosition3Value > revealedPosition1Value);
const aomomoFossilBuilderTraceValue = valuation.estimateAlienTraceValue({
  revealed: true,
  mode: "aomomo-grid",
  traceType: "blue",
  position: 2,
  reward: { gain: { score: 2, aomomoFossils: 1 } },
});
const aomomoScoreOnlyTraceValue = valuation.estimateAlienTraceValue({
  revealed: true,
  mode: "aomomo-grid",
  traceType: "blue",
  position: 2,
  reward: { gain: { score: 2 } },
});
const aomomoCashoutTraceValue = valuation.estimateAlienTraceValue({
  revealed: true,
  mode: "aomomo-grid",
  traceType: "blue",
  position: 5,
  reward: { payFossils: 4, gain: { score: 25 } },
});
const aomomoSmallSpendTraceValue = valuation.estimateAlienTraceValue({
  revealed: true,
  mode: "aomomo-grid",
  traceType: "blue",
  position: 1,
  reward: { payFossils: 1, gain: { score: 6 } },
});
assert.ok(aomomoFossilBuilderTraceValue > aomomoScoreOnlyTraceValue + 3);
assert.ok(aomomoCashoutTraceValue > aomomoSmallSpendTraceValue + 8);
const amibaStaticRegionTraceValue = valuation.estimateAlienTraceValue({
  revealed: true,
  mode: "amiba-grid",
  traceType: "pink",
  position: 1,
  reward: { region: "red" },
});
const amibaDynamicRegionTraceValue = valuation.estimateAlienTraceValue({
  revealed: true,
  mode: "amiba-grid",
  traceType: "pink",
  position: 1,
  reward: { region: "red", regionValue: 9 },
});
const runezuDefaultPanelTraceValue = valuation.estimateAlienTraceValue({
  revealed: true,
  mode: "runezu-grid",
  traceType: "yellow",
  position: 1,
  reward: { panelSymbol: true },
});
const runezuDynamicPanelTraceValue = valuation.estimateAlienTraceValue({
  revealed: true,
  mode: "runezu-grid",
  traceType: "yellow",
  position: 1,
  reward: { panelSymbol: true, panelSymbolValue: 8 },
});
assert.ok(amibaDynamicRegionTraceValue > amibaStaticRegionTraceValue + 5);
assert.ok(runezuDynamicPanelTraceValue > runezuDefaultPanelTraceValue + 4);

const movementGraph = actionGraph.buildActionGraph([
  { id: "move", kind: "quick", available: true, score: 99, gain: 2, cost: 12 },
  { id: "move", kind: "quick", available: true, score: 1, gain: 8, cost: 2 },
], {}, "p1", { goals: [] });
assert.equal(policy.chooseTurnAction(movementGraph)?.gain, 8);

const planned = planner.chooseTurnPlan([
  { id: "move", kind: "quick", available: true, score: 3 },
  { id: "land", kind: "main", available: true, score: 8, plan: { quickActionId: "move", score: 4 } },
  { id: "pass", kind: "pass", available: true, score: -10 },
], {}, "p1");
assert.ok(planned);
assert.equal(planned.key, "land>move");
assert.equal(planned.firstAction.id, "land");

const quickOnlyPlan = planner.chooseTurnPlan([
  { id: "placeData", kind: "quick", available: true, score: 7 },
  { id: "end-turn", kind: "end-turn", available: true, score: -2 },
], {}, "p1");
assert.ok(quickOnlyPlan);
assert.equal(quickOnlyPlan.key, "placeData");
assert.equal(quickOnlyPlan.firstAction.id, "placeData");

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
assert.ok(decision.openingPlan);
assert.ok(Object.keys(decision.openingPlan.goals || {}).length > 0);

const forcedIndustryOffer = {
  industryOptions: [
    { id: "industry:turing.png", label: "图灵系统" },
    { id: "industry:cheat.png", label: "作弊实验室" },
  ],
  initialOptions: [
    { id: "initial:5", label: "初始牌 5" },
    { id: "initial:20", label: "初始牌 20" },
  ],
};
const unforcedOpening = policy.chooseInitialSelection(forcedIndustryOffer, { roundNumber: 1 });
assert.equal(unforcedOpening.industry.label, "作弊实验室");
const forcedOpening = policy.chooseInitialSelection(forcedIndustryOffer, {
  roundNumber: 1,
  forcedIndustryCard: forcedIndustryOffer.industryOptions[1],
});
assert.equal(forcedOpening.industry.label, "作弊实验室");
assert.equal(forcedOpening.openingPlan.summary.hand, 5);
assert.equal(forcedOpening.openingPlan.summary.credits, 3);
assert.equal(forcedOpening.openingPlan.summary.energy, 2);
assert.equal(forcedOpening.openingPlan.summary.baseIncomeCredits, 2);
assert.equal(forcedOpening.openingPlan.summary.longTermCredits, 5);
assert.ok(forcedOpening.openingPlan.topPlans.every((plan) => plan.industryLabel === "作弊实验室"));
const weakForcedOpening = policy.chooseInitialSelection(forcedIndustryOffer, {
  roundNumber: 1,
  forcedIndustryCard: forcedIndustryOffer.industryOptions[1],
  aiDifficulty: "weak_start",
});
assert.equal(weakForcedOpening.openingPlan.summary.incomeIncreases, 4);
assert.equal(weakForcedOpening.openingPlan.summary.credits, 2);
assert.equal(weakForcedOpening.openingPlan.goals.OPENING_INCOME, 6);
assert.ok(weakForcedOpening.openingPlan.topPlans.every((plan) => plan.summary.incomeIncreases === 4));

const weakResearchOpeningOffer = {
  industryOptions: [{ id: "industry:cheat-lab", label: "作弊实验室" }],
  initialOptions: [
    { id: "initial:6", label: "初始牌 6" },
    { id: "initial:2", label: "初始牌 2" },
    { id: "initial:16", label: "初始牌 16" },
  ],
};
const weakResearchOpening = policy.chooseInitialSelection(weakResearchOpeningOffer, {
  roundNumber: 1,
  forcedIndustryCard: weakResearchOpeningOffer.industryOptions[0],
  aiDifficulty: "weak_start",
});
assert.deepEqual(
  weakResearchOpening.openingPlan.topPlans[0].initialNumbers,
  [2, 16],
  "weak_start opening should recognize the first research publicity threshold over a generic scan tie",
);

const huanyuOpeningOffer = {
  industryOptions: [{ id: "industry:huanyu.png", label: "寰宇超动力" }],
  initialOptions: [
    { id: "initial:7", label: "初始牌 7" },
    { id: "initial:11", label: "初始牌 11" },
    { id: "initial:18", label: "初始牌 18" },
  ],
};
const huanyuOpening = policy.chooseInitialSelection(huanyuOpeningOffer, {
  roundNumber: 1,
  forcedIndustryCard: huanyuOpeningOffer.industryOptions[0],
});
assert.deepEqual(
  huanyuOpening.openingPlan.topPlans[0].initialNumbers,
  [7, 18],
  "Huanyu should prefer the data-income orbit plus scan opening over thin trace openings",
);

const huanyuResourceOpeningOffer = {
  industryOptions: [{ id: "industry:huanyu.png", label: "寰宇超动力" }],
  initialOptions: [
    { id: "initial:13", label: "初始牌 13" },
    { id: "initial:11", label: "初始牌 11" },
    { id: "initial:2", label: "初始牌 2" },
  ],
};
const huanyuResourceOpening = policy.chooseInitialSelection(huanyuResourceOpeningOffer, {
  roundNumber: 1,
  forcedIndustryCard: huanyuResourceOpeningOffer.industryOptions[0],
});
assert.deepEqual(
  huanyuResourceOpening.openingPlan.topPlans[0].initialNumbers,
  [11, 2],
  "Huanyu should preserve the full strategic value of an opening trace instead of using only its immediate state reward",
);

const huanyuUnsupportedSecondOrbitOffer = {
  industryOptions: [{ id: "industry:huanyu.png", label: "寰宇超动力" }],
  initialOptions: [
    { id: "initial:8", label: "初始牌 8" },
    { id: "initial:5", label: "初始牌 5" },
    { id: "initial:14", label: "初始牌 14" },
  ],
};
const huanyuUnsupportedSecondOrbitOpening = policy.chooseInitialSelection(huanyuUnsupportedSecondOrbitOffer, {
  roundNumber: 1,
  forcedIndustryCard: huanyuUnsupportedSecondOrbitOffer.industryOptions[0],
  aiDifficulty: "weak_start",
});
assert.deepEqual(
  huanyuUnsupportedSecondOrbitOpening.openingPlan.topPlans[0].initialNumbers,
  [8, 14],
  "Huanyu should prefer an energy-and-card engine over a second unsupported opening orbit",
);
const huanyuUnsupportedSecondOrbitPlan = huanyuUnsupportedSecondOrbitOpening.openingPlan.topPlans.find(
  (plan) => plan.initialNumbers.includes(8) && plan.initialNumbers.includes(5),
);
assert.equal(huanyuUnsupportedSecondOrbitPlan?.summary?.huanyuUnsupportedSecondOrbitPenalty, 3.5);

assert.equal(policy.chooseTurnAction([
  { id: "orbit", available: true, score: 20, actionGraph: { net: 2 } },
  { id: "playCard", available: true, score: 1, actionGraph: { net: 9 } },
])?.id, "playCard");
assert.equal(policy.chooseTurnAction([
  { id: "pass", available: true, score: 0, actionGraph: { net: -1 } },
  { id: "cardCorner", available: true, score: -2, actionGraph: { net: 4 } },
])?.id, "cardCorner");
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
  { id: "scan", available: true, score: 4 },
  { id: "analyze", available: true, score: 12 },
])?.id, "analyze");
assert.equal(policy.chooseTurnAction([
  { id: "end-turn", available: true },
  { id: "placeData", available: true, score: 8 },
])?.id, "placeData");
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
  preserveEnergy: false,
  roundNumber: 3,
}), [1]);
assert.deepEqual(policy.chooseMovePaymentIndexes([
  { label: "普通牌" },
  { label: "移动牌 A" },
], {
  requiredMovePoints: 1,
  availableEnergy: 2,
  moveCardIndexes: [1],
  preserveEnergy: true,
}), [1]);
assert.deepEqual(policy.chooseMovePaymentIndexes([
  { label: "普通牌" },
  { label: "移动牌 A" },
], {
  requiredMovePoints: 1,
  availableEnergy: 3,
  moveCardIndexes: [1],
  preserveEnergy: false,
  roundNumber: 3,
}), []);
assert.deepEqual(policy.chooseMovePaymentIndexes([
  { label: "普通牌" },
  { label: "高价值移动牌" },
  { label: "低价值移动牌" },
], {
  requiredMovePoints: 1,
  availableEnergy: 2,
  moveCardIndexes: [1, 2],
  moveCardOpportunityCosts: { 1: 11.2, 2: 3.5 },
  preserveEnergy: true,
}), [2]);
assert.deepEqual(policy.chooseDiscardIndexes([{ label: "b" }, { label: "a" }], 1), [1]);
assert.deepEqual(policy.chooseDiscardIndexes([
  { label: "energy income" },
  { label: "credit income" },
  { label: "hand income" },
], 1, {
  pendingType: "planet_reward_income",
  incomeGainByIndex: [
    { energy: 1 },
    { credits: 1 },
    { handSize: 1 },
  ],
}), [1]);
assert.deepEqual(policy.chooseDiscardIndexes([
  { label: "energy income" },
  { label: "credit income" },
  { label: "hand income" },
], 2, {
  pendingType: "income",
  incomeGainByIndex: {
    0: { energy: 1 },
    1: { credits: 1 },
    2: { handSize: 1 },
  },
}), [1, 0]);
assert.equal(policy.chooseAlienUseOption([
  { choice: "displayed", disabled: true },
  { choice: "blind" },
  { choice: "cancel" },
])?.choice, "blind");
assert.equal(policy.chooseAlienUseOption([
  { choice: "skip" },
  { choice: "2" },
  { choice: "0" },
])?.choice, "0");
assert.equal(policy.chooseAlienUseOption([
  { choice: "cancel" },
])?.choice, "cancel");

const sampleBattleReport = {
  lastSummary: { ok: false, blocked: true, gameEnded: false, steps: 4, message: "sample" },
  logs: [
    {
      type: "initial-selection",
      playerId: "player-white",
      playerLabel: "白色",
      details: {
        aiStyle: "route",
        industryCard: { label: "寰宇超动力" },
        initialCards: [
          { id: "initial:18", label: "初始牌 18" },
          { id: "initial:11", label: "初始牌 11" },
        ],
        openingPlan: {
          score: 100.5,
          summary: { scan: 2, traces: 1, orbits: 0, data: 0 },
          goals: { GRAB_TRACE_PINK: 2 },
          topPlans: [
            {
              score: 100.5,
              industryLabel: "寰宇超动力",
              initialNumbers: [18, 11],
              summary: { scan: 2, traces: 1, orbits: 0, data: 0 },
              goals: { GRAB_TRACE_PINK: 2 },
            },
            {
              score: 100.2,
              industryLabel: "寰宇超动力",
              initialNumbers: [7, 11],
              summary: { scan: 0, traces: 1, orbits: 1, data: 1 },
              goals: { GRAB_TRACE_YELLOW: 1.35 },
            },
          ],
        },
      },
    },
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
      type: "pass-reserve",
      playerId: "player-blue",
      playerLabel: "蓝色",
      roundNumber: 1,
      turnNumber: 3,
      rawTurnNumber: 7,
      playerResources: { score: 18, credits: 2, energy: 0, handSize: 2 },
      details: {
        card: { id: "reserve-low", cardId: "b_1.webp", cardName: "低续航牌", price: 1, cardTypeCode: 1 },
        passReserveResourcePressure: { active: false, reasons: [], score: 0 },
        passReserveResourcePressurePreview: {
          active: true,
          reasons: ["energy"],
          score: 1.5,
          incomeCandidates: [
            { cardId: "b_2.webp", cardLabel: "补能量牌", incomeGain: { energy: 1 } },
          ],
        },
        passReserveResourcePressureMiss: true,
        selectedScore: null,
        candidates: [],
      },
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
    { playerId: "player-white", playerLabel: "白色", companyLabel: "作弊实验室", finalScore: 24, resources: { score: 18 }, techCount: 1 },
    { playerId: "player-blue", playerLabel: "蓝色", companyLabel: "宇宙大战略集团", finalScore: 19, resources: { score: 15 }, techCount: 0 },
  ],
};
const battleAnalysis = analytics.analyzeBattleReport(sampleBattleReport);
assert.equal(battleAnalysis.turnActionCount, 2);
assert.equal(battleAnalysis.actionCounts.launch, 1);
assert.equal(battleAnalysis.actionCounts.pass, 1);
assert.equal(battleAnalysis.candidateStats.playCard.availableNotSelected, 1);
assert.equal(battleAnalysis.opportunities.passWithAvailableMain, 1);
assert.equal(battleAnalysis.opportunities.openingPlanNearMiss, 1);
assert.equal(battleAnalysis.openingPlanNearMissSamples[0].bestAlternativeGap, 0.3);
assert.deepEqual(battleAnalysis.openingPlanNearMissSamples[0].alternatives[0].initialNumbers, [7, 11]);
assert.equal(battleAnalysis.opportunities.openingPlanConversionGap, 1);
assert.equal(battleAnalysis.openingPlanConversionSamples[0].playerId, "player-white");
assert.ok(battleAnalysis.openingPlanConversionSamples[0].reasons.includes("scan-plan-unconverted"));
assert.ok(battleAnalysis.openingPlanConversionSamples[0].reasons.includes("trace-plan-unconverted"));
assert.equal(battleAnalysis.openingPlanConversionSamples[0].earlyWindow.actual.scanCount, 0);
assert.equal(battleAnalysis.opportunities.passReserveResourcePressureMiss, 1);
assert.equal(battleAnalysis.passReserveResourcePressureMissSamples[0].playerId, "player-blue");
assert.deepEqual(battleAnalysis.passReserveResourcePressureMissSamples[0].previewReasons, ["energy"]);
assert.equal(battleAnalysis.passReserveResourcePressureMissSamples[0].previewIncomeCandidates[0].cardId, "b_2.webp");
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
assert.equal(battleAnalysis.playerProfiles[0].metrics.mainActionCount, 1);
assert.equal(battleAnalysis.playerProfiles[0].metrics.idleTurnCount, 0);
assert.equal(battleAnalysis.playerProfiles[1].metrics.idleTurnCount, 1);
assert.equal(battleAnalysis.scoreActionCorrelations.sampleCount, 2);
assert.equal(battleAnalysis.scoreActionCorrelations.mainActionCount, 1);
assert.equal(battleAnalysis.companyPerformance.highestAverage.companyLabel, "作弊实验室");
assert.equal(battleAnalysis.companyPerformance.highestAverage.averageScore, 24);
assert.equal(battleAnalysis.companyPerformance.lowestAverage.companyLabel, "宇宙大战略集团");
assert.equal(battleAnalysis.companyPerformance.lowestAverage.averageScore, 19);
assert.equal(battleAnalysis.companyPerformance.ranking[0].averageMainActionCount, 1);
assert.equal(battleAnalysis.paceSummary.lowTail.playerId, "player-blue");
assert.equal(battleAnalysis.playerProfiles[0].metrics.engineRatio, 0);
assert.equal(battleAnalysis.winnerProfileDeltas.finalScore, 5);
assert.ok(battleAnalysis.strategyTuning.weights.tech > 1);
assert.ok(battleAnalysis.strategyTuning.weights.playCard > 1);
assert.ok(battleAnalysis.strategyTuning.weights.pass < 1);
assert.ok(battleAnalysis.recommendations.some((entry) => entry.id === "score-pass-opportunity-cost"));
assert.ok(battleAnalysis.recommendations.some((entry) => entry.id === "inspect-score-gap"));
assert.ok(battleAnalysis.recommendations.some((entry) => entry.id === "inspect-card-score-gap"));
assert.ok(battleAnalysis.recommendations.some((entry) => entry.id === "inspect-opening-plan-conversion"));
assert.ok(battleAnalysis.recommendations.some((entry) => entry.id === "inspect-pass-reserve-resource-pressure"));
const sampleBattleSummary = analytics.summarizeBattleReports([sampleBattleReport]);
assert.equal(sampleBattleSummary.scoreActionCorrelations.sampleCount, 2);
assert.equal(sampleBattleSummary.scoreActionCorrelations.mainActionCount, 1);
assert.equal(sampleBattleSummary.companyPerformance.sampleCount, 2);
assert.equal(sampleBattleSummary.companyPerformance.highestAverage.companyLabel, "作弊实验室");
assert.equal(sampleBattleSummary.companyPerformance.lowestAverage.companyLabel, "宇宙大战略集团");
assert.equal(sampleBattleSummary.openingPlanNearMissSamples[0].playerLabel, "白色");
assert.equal(sampleBattleSummary.openingPlanConversionSamples[0].playerLabel, "白色");
assert.equal(sampleBattleSummary.passReserveResourcePressureMissSamples[0].playerLabel, "蓝色");

const selectedIncomePassReserveReport = {
  lastSummary: { ok: true, blocked: false, gameEnded: true, steps: 1 },
  logs: [{
    type: "pass-reserve",
    playerId: "player-blue",
    playerLabel: "蓝色",
    roundNumber: 1,
    turnNumber: 3,
    rawTurnNumber: 7,
    playerResources: { score: 18, credits: 0, energy: 0, handSize: 1 },
    details: {
      card: { id: "b_2.webp", cardId: "b_2.webp", cardName: "补能量牌", price: 1, cardTypeCode: 1 },
      passReserveResourcePressure: { active: false, reasons: [], score: 0 },
      passReserveResourcePressurePreview: {
        active: true,
        reasons: ["energy", "hand"],
        score: 2.5,
        incomeCandidates: [
          { cardId: "b_2.webp", cardLabel: "补能量牌", incomeGain: { energy: 1 } },
        ],
      },
      passReserveResourcePressureMiss: true,
      selectedScore: null,
      candidates: [],
    },
  }],
  playerResults: [{ playerId: "player-blue", playerLabel: "蓝色", finalScore: 19 }],
};
const selectedIncomePassReserveAnalysis = analytics.analyzeBattleReport(selectedIncomePassReserveReport);
assert.equal(selectedIncomePassReserveAnalysis.opportunities.passReserveResourcePressureMiss, 0);
assert.equal(selectedIncomePassReserveAnalysis.passReserveResourcePressureMissSamples.length, 0);

const criticalRoundThreePassReserveReport = {
  lastSummary: { ok: true, blocked: false, gameEnded: true, steps: 1 },
  logs: [{
    type: "pass-reserve",
    playerId: "player-green",
    playerLabel: "绿色",
    roundNumber: 3,
    turnNumber: 8,
    rawTurnNumber: 30,
    playerResources: { score: 86, credits: 0, energy: 0, publicity: 2, handSize: 1 },
    details: {
      card: { id: "b_1.webp", cardId: "b_1.webp", cardName: "低收益保留", price: 1, cardTypeCode: 1 },
      passReserveResourcePressure: { active: false, reasons: [], score: 0 },
      passReserveResourcePressurePreview: {
        active: true,
        reasons: ["credits", "energy", "hand"],
        score: 2.2,
        incomeCandidates: [
          { cardId: "b_25.webp", cardLabel: "资源收入牌", incomeGain: { credits: 1, energy: 1 } },
        ],
      },
      passReserveResourcePressureMiss: true,
      selectedScore: null,
      candidates: [],
    },
  }],
  playerResults: [{ playerId: "player-green", playerLabel: "绿色", finalScore: 209 }],
};
const criticalRoundThreePassReserveAnalysis = analytics.analyzeBattleReport(criticalRoundThreePassReserveReport);
assert.equal(criticalRoundThreePassReserveAnalysis.opportunities.passReserveResourcePressureMiss, 1);
assert.equal(criticalRoundThreePassReserveAnalysis.opportunities.passReserveCriticalRoundThreeMiss, 1);
assert.equal(criticalRoundThreePassReserveAnalysis.passReserveCriticalRoundThreeMissSamples[0].selectedCard.cardId, "b_1.webp");
assert.deepEqual(criticalRoundThreePassReserveAnalysis.passReserveCriticalRoundThreeMissSamples[0].previewReasons, [
  "credits",
  "energy",
  "hand",
]);
assert.ok(
  criticalRoundThreePassReserveAnalysis.recommendations.some(
    (entry) => entry.id === "classify-pass-reserve-critical-r3",
  ),
);
const criticalRoundThreePassReserveSummary = analytics.summarizeBattleReports([criticalRoundThreePassReserveReport]);
assert.equal(criticalRoundThreePassReserveSummary.opportunities.passReserveCriticalRoundThreeMiss, 1);
assert.equal(criticalRoundThreePassReserveSummary.passReserveCriticalRoundThreeMissSamples[0].playerLabel, "绿色");

const negativePassOpportunityReport = {
  lastSummary: { ok: true, blocked: false, gameEnded: true, steps: 1 },
  logs: [{
    type: "turn-action",
    roundNumber: 4,
    turnNumber: 9,
    playerId: "player-white",
    playerLabel: "白色",
    playerResources: { score: 126, credits: 1, energy: 0, publicity: 2, handSize: 1 },
    details: {
      action: { id: "pass", kind: "pass", score: -2.3 },
      candidates: [
        { id: "pass", kind: "pass", available: true, score: -2.3 },
        { id: "launch", kind: "main", available: true, score: -10.5 },
      ],
    },
  }],
  playerResults: [{ playerId: "player-white", playerLabel: "白色", finalScore: 126 }],
};
const negativePassOpportunityAnalysis = analytics.analyzeBattleReport(negativePassOpportunityReport);
assert.equal(negativePassOpportunityAnalysis.opportunities.passWithAvailableMain, 1);
assert.equal(negativePassOpportunityAnalysis.passOpportunitySamples[0].bestMain.policyScore, -6.5);
assert.ok(!negativePassOpportunityAnalysis.recommendations.some((entry) => entry.id === "score-pass-opportunity-cost"));
assert.ok(negativePassOpportunityAnalysis.recommendations.some((entry) => entry.id === "classify-negative-pass-opportunity"));
const negativePassOpportunitySummary = analytics.summarizeBattleReports([negativePassOpportunityReport]);
assert.ok(!negativePassOpportunitySummary.recommendations.some((entry) => entry.id === "score-pass-opportunity-cost"));
assert.ok(negativePassOpportunitySummary.recommendations.some((entry) => entry.id === "classify-negative-pass-opportunity"));

const endTurnMoveReport = {
  lastSummary: { ok: true, blocked: false, gameEnded: true, steps: 1 },
  logs: [{
    type: "turn-action",
    roundNumber: 3,
    turnNumber: 5,
    playerId: "player-blue",
    playerLabel: "蓝色",
    playerResources: { score: 90, credits: 1, energy: 1, handSize: 2 },
    details: {
      action: { id: "end-turn", kind: "quick", score: -0.5 },
      candidates: [
        { id: "end-turn", kind: "quick", available: true, score: -0.5 },
        { id: "move", kind: "quick", available: true, score: 7.25, direction: "clockwise", directScoreGain: 0 },
      ],
    },
  }],
  playerResults: [{ playerId: "player-blue", playerLabel: "蓝色", finalScore: 90 }],
};
const endTurnMoveAnalysis = analytics.analyzeBattleReport(endTurnMoveReport);
assert.equal(endTurnMoveAnalysis.opportunities.endTurnWithAvailableMove, 1);
assert.equal(endTurnMoveAnalysis.opportunities.endTurnWithPositiveMove, 1);
assert.equal(endTurnMoveAnalysis.endTurnMoveOpportunitySamples[0].bestMove.score, 7.25);
assert.equal(endTurnMoveAnalysis.endTurnMoveOpportunitySamples[0].bestMovePositive, true);
assert.equal(endTurnMoveAnalysis.endTurnMoveOpportunitySamples[0].resources.energy, 1);
const endTurnMoveSummary = analytics.summarizeBattleReports([endTurnMoveReport]);
assert.equal(endTurnMoveSummary.endTurnMoveOpportunitySamples[0].bestMove.score, 7.25);
assert.equal(endTurnMoveSummary.opportunities.endTurnWithPositiveMove, 1);

const negativeEndTurnMoveReport = {
  lastSummary: { ok: true, blocked: false, gameEnded: true, steps: 1 },
  logs: [{
    type: "turn-action",
    roundNumber: 4,
    turnNumber: 11,
    playerId: "player-green",
    playerLabel: "绿色",
    playerResources: { score: 151, credits: 0, energy: 1, handSize: 2 },
    details: {
      action: { id: "end-turn", kind: "quick", score: -0.5 },
      candidates: [
        { id: "end-turn", kind: "quick", available: true, score: -0.5 },
        { id: "move", kind: "quick", available: true, score: -3.25, direction: "inward" },
      ],
    },
  }],
  playerResults: [{ playerId: "player-green", playerLabel: "绿色", finalScore: 151 }],
};
const negativeEndTurnMoveAnalysis = analytics.analyzeBattleReport(negativeEndTurnMoveReport);
assert.equal(negativeEndTurnMoveAnalysis.opportunities.endTurnWithAvailableMove, 1);
assert.equal(negativeEndTurnMoveAnalysis.opportunities.endTurnWithPositiveMove, 0);
assert.equal(negativeEndTurnMoveAnalysis.endTurnMoveOpportunitySamples[0].bestMovePositive, false);
assert.ok(!negativeEndTurnMoveAnalysis.recommendations.some((entry) => entry.id === "targeted-post-action-move"));
assert.ok(negativeEndTurnMoveAnalysis.recommendations.some((entry) => entry.id === "classify-negative-end-turn-move"));

const passResourceLockReport = {
  lastSummary: { ok: true, blocked: false, gameEnded: true, steps: 1 },
  logs: [{
    type: "turn-action",
    roundNumber: 4,
    turnNumber: 6,
    playerId: "player-green",
    playerLabel: "绿色",
    playerResources: { score: 132, credits: 0, energy: 1, publicity: 4, handSize: 4 },
    details: {
      action: { id: "pass", kind: "main", score: -3 },
      candidates: [
        { id: "pass", kind: "main", available: true, score: -3 },
        { id: "playCard", kind: "main", available: false, score: 0, reason: "没有资源可支付的普通手牌" },
        { id: "researchTech", kind: "main", available: false, score: 0, reason: "宣传不足" },
        { id: "launch", kind: "main", available: false, score: 0, reason: "信用点不足" },
        { id: "publicity-for-card", kind: "quick", available: true, score: 1.25 },
      ],
      resourceLockTradePreviews: [{
        tradeId: "cards-for-credit",
        label: "2张牌 → 1信用点",
        bestAction: { actionId: "playCard", score: 11.5, cardId: "b_135.webp" },
        unlockedActions: [{ actionId: "playCard", score: 11.5, cardId: "b_135.webp" }],
      }],
    },
  }],
  playerResults: [{ playerId: "player-green", playerLabel: "绿色", finalScore: 132 }],
};
const passResourceLockAnalysis = analytics.analyzeBattleReport(passResourceLockReport);
assert.equal(passResourceLockAnalysis.opportunities.passWithResourceLockedHand, 1);
assert.equal(passResourceLockAnalysis.passResourceLockSamples[0].playCard.reason, "没有资源可支付的普通手牌");
assert.equal(passResourceLockAnalysis.passResourceLockSamples[0].resources.handSize, 4);
assert.equal(passResourceLockAnalysis.passResourceLockSamples[0].unavailableMain.length, 3);
assert.equal(passResourceLockAnalysis.passResourceLockSamples[0].resourceLockTradePreviews[0].tradeId, "cards-for-credit");
assert.equal(passResourceLockAnalysis.passResourceLockSamples[0].resourceLockTradePreviews[0].bestAction.actionId, "playCard");
const passResourceLockSummary = analytics.summarizeBattleReports([passResourceLockReport]);
assert.equal(passResourceLockSummary.passResourceLockSamples[0].playCard.reason, "没有资源可支付的普通手牌");
assert.equal(passResourceLockSummary.passResourceLockSamples[0].resourceLockTradePreviews[0].bestAction.cardId, "b_135.webp");

const finalLowHandPassRecoveryReport = {
  lastSummary: { ok: true, blocked: false, gameEnded: true, steps: 1 },
  logs: [{
    type: "turn-action",
    roundNumber: 4,
    turnNumber: 7,
    playerId: "player-white",
    playerLabel: "白色",
    playerResources: { score: 115, credits: 0, energy: 1, publicity: 4, handSize: 1 },
    details: {
      action: { id: "pass", kind: "pass", score: -2.3 },
      finalLowHandPassRecoveryDiagnostic: {
        currentScore: 115,
        finalMarkCount: 3,
        nextFinalMarkThreshold: null,
        handSize: 1,
        bestPublicTradeCardScore: 1.75,
        topPublicTradeCards: [{ cardId: "b_87.webp", cardLabel: "引力弹弓", tradeScore: 1.75 }],
        cardsForPickCardPreview: {
          ok: false,
          reason: "资源不足，需要 2张牌",
          handCost: 2,
          handAfterTrade: 0,
          discardCost: null,
          bestPublicTradeCardScore: 1.75,
          bestPublicTradeCard: { cardId: "b_87.webp", cardLabel: "引力弹弓", tradeScore: 1.75 },
          net: null,
        },
        tradeChecks: [{ tradeId: "publicity-for-card", ok: true }],
        availableQuick: [],
        unavailableMain: [{ id: "playCard", reason: "没有资源可支付的普通手牌" }],
      },
    },
  }],
  playerResults: [{ playerId: "player-white", playerLabel: "白色", finalScore: 163 }],
};
const finalLowHandPassRecoveryAnalysis = analytics.analyzeBattleReport(finalLowHandPassRecoveryReport);
assert.equal(finalLowHandPassRecoveryAnalysis.opportunities.finalLowHandPassNoRecovery, 1);
assert.equal(finalLowHandPassRecoveryAnalysis.opportunities.finalPublicRefillShortfall, 0);
assert.equal(finalLowHandPassRecoveryAnalysis.finalLowHandPassRecoverySamples[0].bestPublicTradeCardScore, 1.75);
assert.equal(finalLowHandPassRecoveryAnalysis.finalLowHandPassRecoverySamples[0].topPublicTradeCards[0].cardId, "b_87.webp");
assert.equal(finalLowHandPassRecoveryAnalysis.finalLowHandPassRecoverySamples[0].cardsForPickCardPreview.handCost, 2);
const finalLowHandPassRecoverySummary = analytics.summarizeBattleReports([finalLowHandPassRecoveryReport]);
assert.equal(finalLowHandPassRecoverySummary.finalLowHandPassRecoverySamples[0].tradeChecks[0].tradeId, "publicity-for-card");

const finalPublicRefillShortfallReport = {
  lastSummary: { ok: true, blocked: false, gameEnded: true, steps: 1 },
  logs: [{
    type: "turn-action",
    roundNumber: 4,
    turnNumber: 11,
    playerId: "player-brown",
    playerLabel: "棕色",
    playerResources: { score: 137, credits: 1, energy: 0, publicity: 1, handSize: 0 },
    details: {
      action: { id: "pass", kind: "pass", score: -4.2 },
      finalLowHandPassRecoveryDiagnostic: {
        currentScore: 137,
        finalMarkCount: 3,
        nextFinalMarkThreshold: null,
        handSize: 0,
        bestPublicTradeCardScore: 40.15,
        topPublicTradeCards: [{
          cardId: "b_3.webp",
          cardLabel: "阿尔冈金射电天文台",
          tradeScore: 40.15,
          playScore: 40.04,
        }],
        cardsForPickCardPreview: {
          ok: false,
          reason: "资源不足，需要 2张牌",
          handCost: 2,
          handAfterTrade: 0,
          discardCost: null,
          bestPublicTradeCardScore: 40.15,
          bestPublicTradeCard: { cardId: "b_3.webp", cardLabel: "阿尔冈金射电天文台", tradeScore: 40.15 },
          net: null,
        },
        tradeChecks: [
          { tradeId: "credits-for-card", ok: false, reason: "资源不足，需要 2信用点", cost: { credits: 2 }, gain: { handSize: 1 } },
          { tradeId: "energy-for-card", ok: false, reason: "资源不足，需要 2能量", cost: { energy: 2 }, gain: { handSize: 1 } },
          { tradeId: "publicity-for-card", ok: false, reason: "资源不足，需要 3宣传", cost: { publicity: 3 }, gain: { handSize: 1 } },
          { tradeId: "cards-for-pick-card", ok: false, reason: "资源不足，需要 2张牌", cost: { handSize: 2 }, gain: { handSize: 1 } },
        ],
        availableQuick: [],
        unavailableMain: [{ id: "playCard", reason: "没有手牌" }],
      },
    },
  }],
  playerResults: [{ playerId: "player-brown", playerLabel: "棕色", finalScore: 223 }],
};
const finalPublicRefillShortfallAnalysis = analytics.analyzeBattleReport(finalPublicRefillShortfallReport);
assert.equal(finalPublicRefillShortfallAnalysis.opportunities.finalLowHandPassNoRecovery, 1);
assert.equal(finalPublicRefillShortfallAnalysis.opportunities.finalPublicRefillShortfall, 1);
assert.equal(finalPublicRefillShortfallAnalysis.finalPublicRefillShortfallSamples[0].bestPublicTradeCard.cardId, "b_3.webp");
assert.equal(finalPublicRefillShortfallAnalysis.finalPublicRefillShortfallSamples[0].shortfalls[0].tradeId, "credits-for-card");
assert.equal(finalPublicRefillShortfallAnalysis.finalPublicRefillShortfallSamples[0].shortfalls[0].missing[0].missing, 1);
assert(finalPublicRefillShortfallAnalysis.recommendations.some((item) => item.id === "inspect-final-public-refill-shortfall"));
const finalPublicRefillShortfallSummary = analytics.summarizeBattleReports([finalPublicRefillShortfallReport]);
assert.equal(finalPublicRefillShortfallSummary.finalPublicRefillShortfallSamples[0].shortfalls.length, 4);
assert.equal(finalPublicRefillShortfallSummary.opportunities.finalPublicRefillShortfall, 1);

const finalHighScorePassRecoveryReport = {
  lastSummary: { ok: true, blocked: false, gameEnded: true, steps: 1 },
  logs: [{
    type: "turn-action",
    roundNumber: 4,
    turnNumber: 11,
    playerId: "player-green",
    playerLabel: "绿色",
    playerResources: { score: 190, credits: 0, energy: 0, publicity: 6, handSize: 2 },
    details: {
      action: { id: "pass", kind: "pass", score: -2.1 },
      finalHighScorePassRecoveryDiagnostic: {
        currentScore: 190,
        projectedScore: 288,
        scoreTo300: 12,
        finalMarkCount: 3,
        finalFormulas: ["a2", "c2", "d1"],
        handSize: 2,
        credits: 0,
        energy: 0,
        publicity: 6,
        highScoreStrength: 1.1,
        highScorePlayableHandScore: 2.5,
        playableHandCards: [
          { cardId: "b_119.webp", cardLabel: "星舰", price: 4, score: 2.5, reason: "信用点不足" },
        ],
        bestPublicTradeCardScore: 3.75,
        topPublicTradeCards: [{ cardId: "b_87.webp", cardLabel: "引力弹弓", tradeScore: 3.75 }],
        tradeChecks: [{ tradeId: "publicity-for-card", ok: true, cost: { publicity: 3 }, gain: { handSize: 1 } }],
        highScoreGate: {
          finalHighScoreCandidateWindow: true,
          finalHighScoreNeedsCardRefill: true,
          finalHighScorePublicRefillBase: false,
          finalHighScorePublicRefill: false,
          publicRefillScoreThreshold: 5,
        },
        lateRecoveryPreviewCandidates: [],
        unavailableMain: [{ id: "playCard", reason: "没有资源可支付的普通手牌" }],
      },
    },
  }],
  playerResults: [{ playerId: "player-green", playerLabel: "绿色", finalScore: 288 }],
};
const finalHighScorePassRecoveryAnalysis = analytics.analyzeBattleReport(finalHighScorePassRecoveryReport);
assert.equal(finalHighScorePassRecoveryAnalysis.opportunities.finalHighScorePassNoRecovery, 1);
assert.equal(finalHighScorePassRecoveryAnalysis.finalHighScorePassRecoverySamples[0].scoreTo300, 12);
assert.equal(finalHighScorePassRecoveryAnalysis.finalHighScorePassRecoverySamples[0].highScoreGate.publicRefillScoreThreshold, 5);
assert.equal(finalHighScorePassRecoveryAnalysis.finalHighScorePassRecoverySamples[0].playableHandCards[0].cardId, "b_119.webp");
assert(finalHighScorePassRecoveryAnalysis.recommendations.some((item) => item.id === "inspect-final-high-score-pass-recovery"));
const finalHighScorePassRecoverySummary = analytics.summarizeBattleReports([finalHighScorePassRecoveryReport]);
assert.equal(finalHighScorePassRecoverySummary.opportunities.finalHighScorePassNoRecovery, 1);
assert.equal(finalHighScorePassRecoverySummary.finalHighScorePassRecoverySamples[0].projectedScore, 288);

const paceReport = {
  lastSummary: { ok: true, blocked: false, gameEnded: true, steps: 5 },
  logs: [
    {
      type: "turn-action",
      roundNumber: 2,
      turnNumber: 1,
      playerId: "player-white",
      playerLabel: "白色",
      details: { action: { id: "playCard", kind: "main", score: 20 }, candidates: [] },
    },
    {
      type: "turn-action",
      roundNumber: 2,
      turnNumber: 1,
      playerId: "player-white",
      playerLabel: "白色",
      details: { action: { id: "industry", kind: "quick", score: 12 }, candidates: [] },
    },
    {
      type: "turn-action",
      roundNumber: 2,
      turnNumber: 1,
      playerId: "player-white",
      playerLabel: "白色",
      details: { action: { id: "cardCorner", kind: "quick", score: 4 }, candidates: [] },
    },
    {
      type: "turn-action",
      roundNumber: 2,
      turnNumber: 1,
      playerId: "player-white",
      playerLabel: "白色",
      details: { action: { id: "quickTrade", kind: "quick", tradeId: "cards-for-energy", score: 6 }, candidates: [] },
    },
    {
      type: "turn-action",
      roundNumber: 2,
      turnNumber: 1,
      playerId: "player-white",
      playerLabel: "白色",
      details: { action: { id: "placeData", kind: "quick", score: 3 }, candidates: [] },
    },
    {
      type: "turn-action",
      roundNumber: 2,
      turnNumber: 1,
      playerId: "player-white",
      playerLabel: "白色",
      details: { action: { id: "end-turn", kind: "quick", score: -0.5 }, candidates: [] },
    },
  ],
  playerResults: [{ playerId: "player-white", playerLabel: "白色", finalScore: 120 }],
};
const paceAnalysis = analytics.analyzeBattleReport(paceReport);
assert.equal(paceAnalysis.playerProfiles[0].metrics.mainActionCount, 1);
assert.equal(paceAnalysis.playerProfiles[0].metrics.quickStepCount, 4);
assert.equal(paceAnalysis.playerProfiles[0].metrics.resourceQuickStepCount, 3);
assert.equal(paceAnalysis.playerProfiles[0].metrics.idleTurnCount, 1);
assert.equal(paceAnalysis.playerProfiles[0].metrics.quickToMainRatio, 4);
assert.equal(paceAnalysis.playerProfiles[0].metrics.productiveActionRatio, 0.833);
assert.equal(paceAnalysis.playerProfiles[0].metrics.idleTurnRatio, 0.167);
assert.equal(paceAnalysis.playerProfiles[0].roundPace[0].roundNumber, 2);
assert.equal(paceAnalysis.playerProfiles[0].roundPace[0].mainActionCount, 1);
assert.equal(paceAnalysis.playerProfiles[0].roundPace[0].resourceQuickStepCount, 3);
assert.equal(paceAnalysis.paceSummary.averageQuickStepCount, 4);
assert.equal(paceAnalysis.roundPaceSummary.rounds[0].averageMainActionCount, 1);
assert.equal(paceAnalysis.roundPaceSummary.rounds[0].averageResourceQuickStepCount, 3);
assert.equal(paceAnalysis.lowRoundPaceSamples[0].roundNumber, 2);
assert.equal(paceAnalysis.lowRoundPaceSamples[0].mainActionGap, 0);
const paceSummary = analytics.summarizeBattleReports([paceReport]);
assert.equal(paceSummary.paceSummary.averageMainActionCount, 1);
assert.equal(paceSummary.paceSummary.lowTail.quickStepCount, 4);
assert.equal(paceSummary.roundPaceSummary.lowRoundPaceSamples[0].resourceQuickStepCount, 3);
assert.equal(paceSummary.lowRoundPaceSamples[0].playCardCount, 1);

const earlyPassReport = {
  logs: [
    {
      type: "turn-action",
      roundNumber: 1,
      turnNumber: 1,
      rawTurnNumber: 1,
      playerId: "player-white",
      playerLabel: "白色",
      playerResources: { score: 8, credits: 1, energy: 0, publicity: 2, handSize: 2 },
      details: { action: { id: "playCard", kind: "main", score: 12 }, candidates: [] },
    },
    {
      type: "turn-action",
      roundNumber: 1,
      turnNumber: 2,
      rawTurnNumber: 2,
      playerId: "player-white",
      playerLabel: "白色",
      playerResources: { score: 12, credits: 0, energy: 0, publicity: 1, handSize: 2 },
      details: {
        action: { id: "pass", kind: "pass", score: -2 },
        candidates: [
          { id: "pass", kind: "pass", available: true, score: -2 },
          { id: "launch", kind: "main", available: false, score: 0, reason: "信用点不足" },
          { id: "scan", kind: "main", available: false, score: 0, reason: "能量不足" },
          { id: "playCard", kind: "main", available: false, score: 0, reason: "没有资源可支付的普通手牌" },
        ],
        resourceLockTradePreviews: [{
          tradeId: "cards-for-credit",
          label: "2张牌 → 1信用点",
          bestAction: { actionId: "playCard", score: 9.5, cardId: "b_19.webp" },
          unlockedActions: [{ actionId: "playCard", score: 9.5, cardId: "b_19.webp" }],
        }],
      },
    },
    {
      type: "turn-action",
      roundNumber: 2,
      turnNumber: 1,
      rawTurnNumber: 3,
      playerId: "player-white",
      playerLabel: "白色",
      playerResources: { score: 18, credits: 0, energy: 1, publicity: 1, handSize: 1 },
      details: { action: { id: "cardCorner", kind: "quick", score: 3 }, candidates: [] },
    },
    {
      type: "turn-action",
      roundNumber: 2,
      turnNumber: 1,
      rawTurnNumber: 3,
      playerId: "player-white",
      playerLabel: "白色",
      playerResources: { score: 18, credits: 0, energy: 1, publicity: 1, handSize: 1 },
      details: {
        action: { id: "pass", kind: "pass", score: -2 },
        candidates: [
          { id: "pass", kind: "pass", available: true, score: -2 },
          { id: "researchTech", kind: "main", available: true, score: -8 },
          { id: "launch", kind: "main", available: false, score: 0, reason: "信用点不足" },
        ],
      },
    },
  ],
  playerResults: [{ playerId: "player-white", playerLabel: "白色", finalScore: 88 }],
};
const earlyPassAnalysis = analytics.analyzeBattleReport(earlyPassReport);
assert.equal(earlyPassAnalysis.opportunities.earlyPassNoMain, 2);
assert.equal(earlyPassAnalysis.opportunities.resourceLockMainUnlock, 1);
assert.equal(earlyPassAnalysis.opportunities.resourceLockWeakLaunchUnlock, 0);
assert.equal(earlyPassAnalysis.opportunities.quickBeforePassNoMain, 1);
assert.equal(earlyPassAnalysis.opportunities.preNoMainPassResourceDrain, 1);
assert.equal(earlyPassAnalysis.opportunities.postPassQuickNoMain, 0);
assert.equal(earlyPassAnalysis.earlyPassNoMainSamples[0].rawTurnNumber, 2);
assert.equal(earlyPassAnalysis.earlyPassNoMainSamples[0].reasonTag, "resource-trade-unlocks-main");
assert.equal(earlyPassAnalysis.earlyPassNoMainSamples[0].candidateProfile.unavailableMainCount, 3);
assert.equal(earlyPassAnalysis.earlyPassNoMainSamples[0].candidateProfile.bestResourceLockTrade.tradeId, "cards-for-credit");
assert.equal(earlyPassAnalysis.resourceLockMainUnlockSamples[0].bestResourceLockTrade.tradeId, "cards-for-credit");
assert.equal(earlyPassAnalysis.resourceLockMainUnlockSamples[0].bestResourceLockTrade.bestAction.cardId, "b_19.webp");
assert.deepEqual(earlyPassAnalysis.earlyPassNoMainSamples[1].actionIds, ["cardCorner", "pass"]);
assert.deepEqual(earlyPassAnalysis.quickBeforePassNoMainSamples[0].actionIds, ["cardCorner", "pass"]);
assert.equal(earlyPassAnalysis.quickBeforePassNoMainSamples[0].quickBeforePassCount, 1);
assert.equal(earlyPassAnalysis.quickBeforePassNoMainSamples[0].quickAfterPassCount, 0);
assert.equal(earlyPassAnalysis.preNoMainPassResourceDrainSamples[0].previousAction.id, "playCard");
assert.equal(earlyPassAnalysis.preNoMainPassResourceDrainSamples[0].resourceDeltaToPass.credits, 1);
assert.equal(earlyPassAnalysis.preNoMainPassResourceDrainSamples[0].resourceDeltaToPass.publicity, 1);
assert.equal(earlyPassAnalysis.earlyPassNoMainSamples[1].reasonTag, "negative-main-only");
assert.equal(earlyPassAnalysis.earlyPassNoMainSamples[1].candidateProfile.bestMain.id, "researchTech");
assert.deepEqual(earlyPassAnalysis.earlyPassNoMainReasonCounts, {
  "resource-trade-unlocks-main": 1,
  "negative-main-only": 1,
});
const earlyPassSummary = analytics.summarizeBattleReports([earlyPassReport]);
assert.deepEqual(earlyPassSummary.earlyPassNoMainReasonCounts, earlyPassAnalysis.earlyPassNoMainReasonCounts);
assert.equal(earlyPassSummary.opportunities.resourceLockMainUnlock, 1);
assert.equal(earlyPassSummary.opportunities.quickBeforePassNoMain, 1);
assert.equal(earlyPassSummary.resourceLockMainUnlockSamples[0].bestResourceLockTrade.tradeId, "cards-for-credit");
assert.equal(earlyPassSummary.preNoMainPassResourceDrainSamples[0].previousAction.id, "playCard");
assert.ok(earlyPassSummary.recommendations.some((entry) => entry.id === "inspect-resource-lock-main-unlock"));
assert.ok(earlyPassSummary.recommendations.some((entry) => entry.id === "inspect-quick-before-pass-no-main"));
assert.ok(earlyPassSummary.recommendations.some((entry) => entry.id === "inspect-pre-no-main-resource-drain"));

const resourceLockWeakLaunchReport = {
  lastSummary: { ok: true, blocked: false, gameEnded: true, steps: 1 },
  logs: [{
    type: "turn-action",
    roundNumber: 4,
    turnNumber: 9,
    rawTurnNumber: 36,
    playerId: "player-white",
    playerLabel: "白色",
    playerResources: { score: 143, credits: 1, energy: 0, publicity: 3, handSize: 2 },
    details: {
      action: { id: "pass", kind: "pass", score: -2.3 },
      candidates: [
        { id: "pass", kind: "pass", available: true, score: -2.3 },
        { id: "launch", kind: "main", available: false, score: 0, reason: "信用点不足" },
      ],
      resourceLockTradePreviews: [{
        tradeId: "cards-for-credit",
        label: "2张牌 → 1信用点",
        bestAction: { actionId: "launch", score: 27.5, planScore: 0, directScoreGain: 0 },
        unlockedActions: [{ actionId: "launch", score: 27.5, planScore: 0, directScoreGain: 0 }],
      }],
    },
  }],
  playerResults: [{ playerId: "player-white", playerLabel: "白色", finalScore: 233 }],
};
const resourceLockWeakLaunchAnalysis = analytics.analyzeBattleReport(resourceLockWeakLaunchReport);
assert.equal(resourceLockWeakLaunchAnalysis.opportunities.resourceLockMainUnlock, 1);
assert.equal(resourceLockWeakLaunchAnalysis.opportunities.resourceLockWeakLaunchUnlock, 1);
assert.equal(resourceLockWeakLaunchAnalysis.resourceLockWeakLaunchUnlockSamples[0].bestResourceLockTrade.bestAction.actionId, "launch");
assert(resourceLockWeakLaunchAnalysis.recommendations.some((entry) => entry.id === "classify-resource-lock-weak-launch"));
const resourceLockWeakLaunchSummary = analytics.summarizeBattleReports([resourceLockWeakLaunchReport]);
assert.equal(resourceLockWeakLaunchSummary.resourceLockWeakLaunchUnlockSamples[0].bestResourceLockTrade.tradeId, "cards-for-credit");
assert.equal(resourceLockWeakLaunchSummary.opportunities.resourceLockWeakLaunchUnlock, 1);

const resourceLockNoDirectScanReport = {
  lastSummary: { ok: true, blocked: false, gameEnded: true, steps: 1 },
  logs: [{
    type: "turn-action",
    roundNumber: 3,
    turnNumber: 6,
    rawTurnNumber: 24,
    playerId: "player-blue",
    playerLabel: "蓝色",
    playerResources: { score: 64, credits: 0, energy: 5, publicity: 0, handSize: 1 },
    details: {
      action: { id: "pass", kind: "pass", score: -2.3 },
      candidates: [
        { id: "pass", kind: "pass", available: true, score: -2.3 },
        { id: "playCard", kind: "main", available: false, score: 0, reason: "没有资源可支付" },
      ],
      resourceLockTradePreviews: [{
        tradeId: "energy-for-credit",
        label: "2能量 → 1信用点",
        bestAction: { actionId: "scan", score: 53.588, directScoreGain: 0 },
        unlockedActions: [{ actionId: "scan", score: 53.588, directScoreGain: 0 }],
      }],
    },
  }],
  playerResults: [{ playerId: "player-blue", playerLabel: "蓝色", finalScore: 153 }],
};
const resourceLockNoDirectScanAnalysis = analytics.analyzeBattleReport(resourceLockNoDirectScanReport);
assert.equal(resourceLockNoDirectScanAnalysis.opportunities.resourceLockMainUnlock, 1);
assert.equal(resourceLockNoDirectScanAnalysis.opportunities.resourceLockNoDirectScanUnlock, 1);
assert.equal(
  resourceLockNoDirectScanAnalysis.resourceLockNoDirectScanUnlockSamples[0].bestResourceLockTrade.tradeId,
  "energy-for-credit",
);
assert.equal(
  resourceLockNoDirectScanAnalysis.resourceLockNoDirectScanUnlockSamples[0].bestResourceLockTrade.bestAction.actionId,
  "scan",
);
assert(
  resourceLockNoDirectScanAnalysis.recommendations.some(
    (entry) => entry.id === "classify-resource-lock-no-direct-scan",
  ),
);
const resourceLockNoDirectScanSummary = analytics.summarizeBattleReports([resourceLockNoDirectScanReport]);
assert.equal(resourceLockNoDirectScanSummary.opportunities.resourceLockNoDirectScanUnlock, 1);
assert.equal(
  resourceLockNoDirectScanSummary.resourceLockNoDirectScanUnlockSamples[0].bestResourceLockTrade.tradeId,
  "energy-for-credit",
);

const resourceLockNoDiscardAnalyzeReport = {
  lastSummary: { ok: true, blocked: false, gameEnded: true, steps: 1 },
  logs: [{
    type: "turn-action",
    roundNumber: 2,
    turnNumber: 9,
    rawTurnNumber: 36,
    playerId: "player-green",
    playerLabel: "绿色",
    playerResources: { score: 54, credits: 2, energy: 0, publicity: 3, handSize: 1, availableData: 0 },
    details: {
      action: { id: "pass", kind: "pass", score: -2.3 },
      candidates: [
        { id: "pass", kind: "pass", available: true, score: -2.3 },
        { id: "launch", kind: "main", available: true, score: -21.247 },
        { id: "playCard", kind: "main", available: false, score: 0, reason: "没有资源可支付的普通手牌" },
      ],
      resourceLockTradePreviews: [{
        tradeId: "credits-for-energy",
        label: "2信用点 → 1能量",
        cost: { credits: 2 },
        gain: { energy: 1 },
        discardPlan: { ok: true, handCost: 0, totalCost: 12, selectedCards: [] },
        resourcesAfterTrade: { credits: 0, energy: 1, publicity: 3, handSize: 1 },
        bestAction: { actionId: "analyze", score: 35.109, directScoreGain: 0 },
        unlockedActions: [{ actionId: "analyze", score: 35.109, directScoreGain: 0 }],
      }],
    },
  }],
  playerResults: [{ playerId: "player-green", playerLabel: "绿色", finalScore: 172 }],
};
const resourceLockNoDiscardAnalyzeAnalysis = analytics.analyzeBattleReport(resourceLockNoDiscardAnalyzeReport);
assert.equal(resourceLockNoDiscardAnalyzeAnalysis.opportunities.resourceLockMainUnlock, 1);
assert.equal(resourceLockNoDiscardAnalyzeAnalysis.opportunities.resourceLockNoDiscardAnalyzeUnlock, 1);
assert.equal(
  resourceLockNoDiscardAnalyzeAnalysis.resourceLockNoDiscardAnalyzeUnlockSamples[0].bestResourceLockTrade.tradeId,
  "credits-for-energy",
);
assert.equal(
  resourceLockNoDiscardAnalyzeAnalysis.resourceLockNoDiscardAnalyzeUnlockSamples[0].bestResourceLockTrade.bestAction.actionId,
  "analyze",
);
assert(
  resourceLockNoDiscardAnalyzeAnalysis.recommendations.some(
    (entry) => entry.id === "classify-resource-lock-no-discard-analyze",
  ),
);
const resourceLockNoDiscardAnalyzeSummary = analytics.summarizeBattleReports([resourceLockNoDiscardAnalyzeReport]);
assert.equal(resourceLockNoDiscardAnalyzeSummary.opportunities.resourceLockNoDiscardAnalyzeUnlock, 1);
assert.equal(
  resourceLockNoDiscardAnalyzeSummary.resourceLockNoDiscardAnalyzeUnlockSamples[0].bestResourceLockTrade.tradeId,
  "credits-for-energy",
);

const postPassQuickReport = {
  lastSummary: { ok: true, blocked: false, gameEnded: true, steps: 1 },
  logs: [
    {
      type: "turn-action",
      roundNumber: 2,
      turnNumber: 6,
      rawTurnNumber: 24,
      playerId: "player-white",
      playerLabel: "白色",
      playerResources: { score: 25, credits: 0, energy: 0, publicity: 4, handSize: 1 },
      details: { action: { id: "pass", kind: "pass", score: -2.3 }, candidates: [] },
    },
    {
      type: "turn-action",
      roundNumber: 2,
      turnNumber: 6,
      rawTurnNumber: 24,
      playerId: "player-white",
      playerLabel: "白色",
      playerResources: { score: 25, credits: 0, energy: 0, publicity: 4, handSize: 2 },
      details: {
        action: {
          id: "move",
          kind: "quick",
          score: 5.6,
          routeTarget: { kind: "planet", id: "mars", planetId: "mars", newDistance: 0 },
          valueBreakdown: {
            requiredMovePoints: 1,
            moveCardSpent: 1,
            moveEnergySpent: 0,
            followupScore: 0,
            routeScore: 25.2,
            routeScoreForGain: 14,
            paymentCost: 5.4,
            movementCost: 5.4,
          },
        },
        candidates: [],
      },
    },
    {
      type: "move-payment",
      roundNumber: 2,
      turnNumber: 6,
      rawTurnNumber: 24,
      playerId: "player-white",
      playerLabel: "白色",
      details: {
        requiredMovePoints: 1,
        selectedHandIndices: [1],
        energyCost: 0,
      },
    },
    {
      type: "turn-action",
      roundNumber: 2,
      turnNumber: 6,
      rawTurnNumber: 24,
      playerId: "player-white",
      playerLabel: "白色",
      playerResources: { score: 25, credits: 0, energy: 0, publicity: 5, handSize: 1 },
      details: { action: { id: "end-turn", kind: "end-turn", score: -0.5 }, candidates: [] },
    },
  ],
  playerResults: [{ playerId: "player-white", playerLabel: "白色", finalScore: 184 }],
};
const postPassQuickAnalysis = analytics.analyzeBattleReport(postPassQuickReport);
assert.equal(postPassQuickAnalysis.opportunities.quickBeforePassNoMain, 0);
assert.equal(postPassQuickAnalysis.opportunities.postPassQuickNoMain, 1);
assert.equal(postPassQuickAnalysis.opportunities.postPassQuickAfterPass, 1);
assert.equal(postPassQuickAnalysis.opportunities.postPassPaidMoveNoFollowup, 1);
assert.equal(postPassQuickAnalysis.opportunities.postPassThinHandNoFollowupMove, 1);
assert.equal(postPassQuickAnalysis.postPassQuickSamples[0].postAction.payment.handAfterMovePayment, 1);
assert.equal(postPassQuickAnalysis.postPassQuickSamples[0].postAction.routeTarget.planetId, "mars");
assert.equal(postPassQuickAnalysis.postPassQuickSamples[0].postAction.flags.thinHandNoFollowupMove, true);
const postPassQuickSummary = analytics.summarizeBattleReports([postPassQuickReport]);
assert.equal(postPassQuickSummary.postPassQuickNoMainSamples[0].quickAfterPassCount, 1);
assert.equal(postPassQuickSummary.postPassQuickSamples[0].postAction.flags.paidMoveNoFollowup, true);
assert.ok(postPassQuickSummary.recommendations.some((entry) => entry.id === "inspect-post-pass-quick-no-main"));
assert.ok(postPassQuickSummary.recommendations.some((entry) => entry.id === "classify-route-payment-risk"));
assert.ok(!postPassQuickSummary.recommendations.some((entry) => entry.id === "route-planner"));

function appendRepeatedTurnActions(logs, playerId, playerLabel, counts) {
  for (const [actionId, count] of Object.entries(counts || {})) {
    for (let index = 0; index < count; index += 1) {
      logs.push({
        type: "turn-action",
        playerId,
        playerLabel,
        details: { action: { id: actionId, score: 1 } },
      });
    }
  }
}

const lowEngineLogs = [];
appendRepeatedTurnActions(lowEngineLogs, "winner", "Winner", {
  playCard: 13,
  researchTech: 11,
  scan: 9,
  analyze: 6,
  placeData: 48,
  cardCorner: 5,
  quickTrade: 4,
  pass: 4,
});
appendRepeatedTurnActions(lowEngineLogs, "low", "Low", {
  playCard: 5,
  researchTech: 4,
  scan: 2,
  analyze: 1,
  placeData: 14,
  cardCorner: 4,
  quickTrade: 1,
  pass: 4,
});
const lowEngineReport = {
  lastSummary: { ok: true, blocked: false, gameEnded: true, steps: 1 },
  logs: lowEngineLogs,
  playerResults: [
    { playerId: "winner", playerLabel: "Winner", finalScore: 320, baseScore: 205, techCount: 12, completedTaskCount: 5 },
    { playerId: "low", playerLabel: "Low", finalScore: 190, baseScore: 120, techCount: 6, completedTaskCount: 1 },
  ],
};
const lowEngineAnalysis = analytics.analyzeBattleReport(lowEngineReport);
assert.equal(lowEngineAnalysis.lowEngineThroughputSamples[0].playerId, "low");
assert.ok(lowEngineAnalysis.lowEngineThroughputSamples[0].reasons.includes("low-place-data"));
assert.ok(lowEngineAnalysis.lowEngineThroughputSamples[0].reasons.includes("low-scan"));
assert.ok(lowEngineAnalysis.lowEngineThroughputSamples[0].reasons.includes("low-analyze"));
assert.ok(lowEngineAnalysis.lowEngineThroughputSamples[0].reasons.includes("low-tech"));
assert.ok(lowEngineAnalysis.lowEngineThroughputSamples[0].referenceGaps.placeData >= 30);
assert.ok(lowEngineAnalysis.recommendations.some((entry) => entry.id === "inspect-low-engine-throughput"));
const lowEngineSummary = analytics.summarizeBattleReports([lowEngineReport]);
assert.equal(lowEngineSummary.lowEngineThroughputSamples[0].playerId, "low");
assert.ok(lowEngineSummary.recommendations.some((entry) => entry.id === "inspect-low-engine-throughput"));

const highScoreNearMissLogs = [];
appendRepeatedTurnActions(highScoreNearMissLogs, "winner", "Winner", {
  playCard: 15,
  researchTech: 11,
  scan: 8,
  analyze: 5,
  placeData: 42,
  cardCorner: 6,
  quickTrade: 5,
  pass: 3,
});
appendRepeatedTurnActions(highScoreNearMissLogs, "near", "Near", {
  playCard: 8,
  researchTech: 7,
  scan: 5,
  analyze: 3,
  placeData: 28,
  cardCorner: 4,
  quickTrade: 2,
  pass: 4,
});
highScoreNearMissLogs.push({
  type: "turn-action",
  roundNumber: 3,
  turnNumber: 7,
  rawTurnNumber: 25,
  playerId: "near",
  playerLabel: "Near",
  playerResources: { score: 132, credits: 2, energy: 1, publicity: 5, handSize: 3 },
  details: {
    action: { id: "cardCorner", kind: "quick", score: 8 },
    candidates: [
      { id: "researchTech", kind: "main", available: false, score: 0, reason: "宣传不足，研究科技需要 6 宣传" },
      { id: "cardCorner", kind: "quick", available: true, score: 8, directScoreGain: 0 },
      { id: "move", kind: "quick", available: true, score: 5, directScoreGain: 0 },
      { id: "pass", kind: "pass", available: true, score: -2 },
    ],
  },
});
highScoreNearMissLogs.push({
  type: "turn-action",
  roundNumber: 4,
  turnNumber: 9,
  rawTurnNumber: 31,
  playerId: "near",
  playerLabel: "Near",
  playerResources: { score: 188, credits: 1, energy: 1, publicity: 6, handSize: 1 },
  details: {
    action: { id: "end-turn", kind: "quick", score: -0.5 },
    candidates: [
      { id: "researchTech", kind: "main", available: true, score: 12, directScoreGain: 0 },
      { id: "pass", kind: "pass", available: true, score: -2 },
      { id: "end-turn", kind: "quick", available: true, score: -0.5 },
    ],
  },
});
const highScoreNearMissReport = {
  lastSummary: { ok: true, blocked: false, gameEnded: true, steps: 1 },
  logs: highScoreNearMissLogs,
  playerResults: [
    {
      playerId: "winner",
      playerLabel: "Winner",
      finalScore: 320,
      baseScore: 205,
      tileScore: 95,
      cardScore: 20,
      techCount: 12,
      completedTaskCount: 5,
      finalMarkCount: 3,
    },
    {
      playerId: "near",
      playerLabel: "Near",
      finalScore: 293,
      baseScore: 206,
      tileScore: 81,
      cardScore: 6,
      techCount: 10,
      completedTaskCount: 3,
      finalMarkCount: 3,
      finalFormulas: ["a1", "b2", "d2"],
      finalFormulaProgress: {
        entries: [
          { formulaId: "a1", multiplier: 4, baseValue: 3, score: 12 },
          { formulaId: "b2", multiplier: 6, baseValue: 2, score: 12 },
          { formulaId: "d2", multiplier: 7, baseValue: 5, score: 35 },
        ],
      },
      b2Progress: { sectorWins: 2, orbitLandCount: 5, sectorWinDeficit: 2, orbitLandDeficit: 0, bottleneck: "sectorWins" },
      resources: { credits: 0, energy: 1, publicity: 4, handSize: 2 },
      handCards: [
        { id: "near-task-1", cardId: "near-task.webp", label: "Near task", price: 2, typeCode: 3, taskCount: 1, endGameScoring: true },
      ],
      reservedCards: [
        { id: "near-final-1", cardId: "near-final.webp", label: "Near final", price: 1, typeCode: 2, endGameScoring: true },
      ],
    },
  ],
};
const highScoreNearMissAnalysis = analytics.analyzeBattleReport(highScoreNearMissReport);
assert.equal(highScoreNearMissAnalysis.highScoreNearMissSamples[0].playerId, "near");
assert.equal(highScoreNearMissAnalysis.highScoreNearMissSamples[0].scoreTo300, 7);
assert.ok(highScoreNearMissAnalysis.highScoreNearMissSamples[0].reasons.includes("near-300"));
assert.ok(highScoreNearMissAnalysis.highScoreNearMissSamples[0].reasons.includes("b2-sector"));
assert.ok(highScoreNearMissAnalysis.highScoreNearMissSamples[0].reasons.includes("card-score-gap"));
assert.ok(highScoreNearMissAnalysis.highScoreNearMissSamples[0].referenceGaps.cardScore >= 14);
assert.equal(highScoreNearMissAnalysis.highScoreNearMissSamples[0].cards[0].cardId, "near-task.webp");
assert.equal(highScoreNearMissAnalysis.highScoreNearMissSamples[0].dTechPlan.hasD2, true);
assert.equal(highScoreNearMissAnalysis.highScoreNearMissSamples[0].dTechPlan.d2NextTwoTechScore, 7);
assert.equal(highScoreNearMissAnalysis.highScoreNearMissSamples[0].dTechPlan.techsToNextD2Step, 2);
assert.equal(highScoreNearMissAnalysis.highScoreNearMissSamples[0].recentTurnTail.at(-1).selected.id, "end-turn");
assert.equal(highScoreNearMissAnalysis.highScoreNearMissSamples[0].recentTurnTail.at(-1).bestMain.id, "researchTech");
assert.equal(highScoreNearMissAnalysis.highScoreNearMissSamples[0].dTechSetupWindows[0].researchTech.reason, "宣传不足，研究科技需要 6 宣传");
assert.equal(highScoreNearMissAnalysis.highScoreNearMissSamples[0].dTechSetupWindows[0].bestSetupQuick.id, "cardCorner");
assert.equal(highScoreNearMissAnalysis.highScoreNearMissSamples[0].dTechSetupWindows.at(-1).selected.id, "end-turn");
assert.ok(highScoreNearMissAnalysis.recommendations.some((entry) => entry.id === "inspect-high-score-near-miss"));
const highScoreNearMissSummary = analytics.summarizeBattleReports([highScoreNearMissReport]);
assert.equal(highScoreNearMissSummary.highScoreNearMissSamples[0].playerId, "near");
assert.equal(highScoreNearMissSummary.highScoreNearMissSamples[0].cards[1].zone, "reserved");
assert.equal(highScoreNearMissSummary.highScoreNearMissSamples[0].dTechPlan.d2NextTwoTechScore, 7);
assert.equal(highScoreNearMissSummary.highScoreNearMissSamples[0].dTechSetupWindows[0].bestSetupQuick.id, "cardCorner");
assert.ok(highScoreNearMissSummary.recommendations.some((entry) => entry.id === "inspect-high-score-near-miss"));

const b2TerminalReopenReport = {
  lastSummary: { gameEnded: true, steps: 6 },
  playerResults: [{
    playerId: "near-b2",
    playerLabel: "近300 B2",
    finalScore: 298,
    baseScore: 158,
    tileScore: 100,
    cardScore: 17,
    finalMarkCount: 3,
    finalFormulas: ["a1", "b2", "d2"],
    b2Progress: {
      sectorWins: 7,
      orbitLandCount: 8,
      baseValue: 7,
      multiplier: 6,
      score: 42,
      sectorWinDeficit: 1,
      orbitLandDeficit: 0,
      bottleneck: "sectorWins",
    },
    resources: { score: 158, credits: 0, energy: 0, publicity: 2, handSize: 1 },
  }],
  logs: [
    {
      type: "scan-target",
      roundNumber: 4,
      turnNumber: 10,
      rawTurnNumber: 40,
      playerId: "near-b2",
      playerLabel: "近300 B2",
      playerResources: { score: 137, credits: 2, energy: 0, publicity: 3, handSize: 3 },
      details: {
        pendingType: "sector_scan",
        nebulaId: "sector-2-b",
        sectorX: "0",
        label: "扇区 0：巴纳德下一次替换槽位 4",
        selectedScore: 19.946,
        topChoices: [{
          nebulaId: "sector-2-b",
          sectorX: "0",
          label: "扇区 0：巴纳德下一次替换槽位 4",
          score: 19.946,
          directScoreGain: 0,
          b2: {
            focus: 5.893,
            active: true,
            marked: true,
            sectorWins: 6,
            orbitLandCount: 7,
            deficit: 1,
            multiplier: 6,
            ownCount: 3,
            openCount: 2,
            markedCount: 3,
            maxOtherCount: 0,
            winsAfterScan: true,
          },
        }],
      },
    },
    {
      type: "turn-action",
      roundNumber: 4,
      turnNumber: 11,
      rawTurnNumber: 43,
      playerId: "near-b2",
      playerLabel: "近300 B2",
      playerResources: { score: 142, credits: 0, energy: 1, publicity: 5, handSize: 1 },
      details: {
        action: {
          id: "land",
          kind: "main",
          score: 60.055,
          directScoreGain: 12,
          label: "水星",
          actionGraph: { net: 86.285, finalMarginal: 6, goalBonus: 15.2 },
        },
        candidates: [{
          id: "land",
          kind: "main",
          available: true,
          score: 60.055,
          directScoreGain: 12,
          label: "水星",
          actionGraph: { net: 86.285, finalMarginal: 6, goalBonus: 15.2 },
        }],
      },
    },
  ],
};
const b2TerminalReopenAnalysis = analytics.analyzeBattleReport(b2TerminalReopenReport);
assert.equal(b2TerminalReopenAnalysis.highScoreNearMissSamples[0].playerId, "near-b2");
assert.equal(b2TerminalReopenAnalysis.highScoreNearMissSamples[0].b2TerminalReopenWindows[0].closingScan.choice.nebulaId, "sector-2-b");
assert.equal(b2TerminalReopenAnalysis.highScoreNearMissSamples[0].b2TerminalReopenWindows[0].reopeningAction.selected.id, "land");
assert.equal(b2TerminalReopenAnalysis.highScoreNearMissSamples[0].b2TerminalReopenWindows[0].finalSectorWinDeficit, 1);
assert.ok(b2TerminalReopenAnalysis.highScoreNearMissSamples[0].reasons.includes("b2-reopened-after-scan"));
const b2TerminalReopenSummary = analytics.summarizeBattleReports([b2TerminalReopenReport]);
assert.equal(b2TerminalReopenSummary.highScoreNearMissSamples[0].b2TerminalReopenWindows[0].reopeningAction.actionGraph.finalMarginal, 6);

const d1TechBalanceReport = {
  lastSummary: { ok: true, blocked: false, gameEnded: true, steps: 1 },
  logs: [
    {
      type: "tech-placement",
      roundNumber: 1,
      turnNumber: 1,
      rawTurnNumber: 1,
      playerId: "low-d1",
      playerLabel: "Low D1",
      details: { selected: { tileId: "orange4", techType: "orange", score: 42 } },
    },
    {
      type: "tech-placement",
      roundNumber: 2,
      turnNumber: 3,
      rawTurnNumber: 7,
      playerId: "low-d1",
      playerLabel: "Low D1",
      details: { selected: { tileId: "blue1", techType: "blue", score: 38 } },
    },
    {
      type: "tech-placement",
      roundNumber: 2,
      turnNumber: 6,
      rawTurnNumber: 10,
      playerId: "low-d1",
      playerLabel: "Low D1",
      details: { selected: { tileId: "purple1", techType: "purple", score: 35 } },
    },
    {
      type: "turn-action",
      roundNumber: 3,
      turnNumber: 5,
      rawTurnNumber: 13,
      playerId: "low-d1",
      playerLabel: "Low D1",
      playerResources: { score: 92, credits: 3, energy: 2, publicity: 6, handSize: 4 },
      details: {
        action: { id: "researchTech", kind: "main", score: 76 },
        candidates: [{
          id: "researchTech",
          kind: "main",
          available: true,
          score: 76,
          techType: "orange",
          takeable: [
            { tileId: "orange2", techType: "orange", score: 76, directScoreGain: 2 },
            { tileId: "blue2", techType: "blue", score: 67, directScoreGain: 2 },
            { tileId: "purple2", techType: "purple", score: 66, directScoreGain: 2 },
          ],
        }],
      },
    },
    {
      type: "tech-placement",
      roundNumber: 3,
      turnNumber: 5,
      rawTurnNumber: 13,
      playerId: "low-d1",
      playerLabel: "Low D1",
      details: {
        selected: { tileId: "orange2", techType: "orange", score: 76 },
        candidates: [
          { tileId: "orange2", techType: "orange", score: 76, directScoreGain: 2 },
          { tileId: "blue2", techType: "blue", score: 67, directScoreGain: 2 },
          { tileId: "purple2", techType: "purple", score: 66, directScoreGain: 2 },
        ],
      },
    },
    {
      type: "tech-placement",
      roundNumber: 4,
      turnNumber: 2,
      rawTurnNumber: 18,
      playerId: "low-d1",
      playerLabel: "Low D1",
      details: { selected: { tileId: "purple3", techType: "purple", score: 58 } },
    },
    {
      type: "tech-placement",
      roundNumber: 4,
      turnNumber: 6,
      rawTurnNumber: 22,
      playerId: "low-d1",
      playerLabel: "Low D1",
      details: { selected: { tileId: "orange1", techType: "orange", score: 54 } },
    },
  ],
  playerResults: [
    {
      playerId: "winner",
      playerLabel: "Winner",
      finalScore: 320,
      baseScore: 210,
      tileScore: 90,
      cardScore: 20,
      techCount: 11,
      completedTaskCount: 5,
      finalMarkCount: 3,
    },
    {
      playerId: "low-d1",
      playerLabel: "Low D1",
      finalScore: 184,
      baseScore: 125,
      tileScore: 26,
      cardScore: 9,
      techCount: 6,
      completedTaskCount: 3,
      finalMarkCount: 3,
      finalFormulas: ["a1", "c1", "d1"],
      finalFormulaProgress: {
        entries: [
          { formulaId: "d1", multiplier: 5, baseValue: 1, score: 5, slotIndex: 3 },
        ],
      },
      resources: { credits: 0, energy: 0, publicity: 6, handSize: 1 },
      handCards: [{
        id: "tech-card-1",
        cardId: "b_135.webp",
        label: "Tech route",
        price: 3,
        typeCode: 2,
        effectTypes: ["card_research_tech"],
      }],
      reservedCards: [],
    },
  ],
};
const d1TechBalanceAnalysis = analytics.analyzeBattleReport(d1TechBalanceReport);
assert.equal(d1TechBalanceAnalysis.opportunities.d1TechBalanceBottleneck, 1);
assert.deepEqual(d1TechBalanceAnalysis.d1TechBalanceBottleneckSamples[0].techTypeCounts, { orange: 3, blue: 1, purple: 2 });
assert.deepEqual(d1TechBalanceAnalysis.d1TechBalanceBottleneckSamples[0].missingTechTypesForNextD1, ["blue"]);
assert.equal(d1TechBalanceAnalysis.d1TechBalanceBottleneckSamples[0].nextD1StepScore, 5);
assert.equal(d1TechBalanceAnalysis.d1TechBalanceBottleneckSamples[0].techCardOptions[0].researchTechEffect, true);
assert.equal(d1TechBalanceAnalysis.d1TechBalanceBottleneckSamples[0].researchTechChoices[3].missingTypeCandidates[0].techType, "blue");
assert.equal(d1TechBalanceAnalysis.d1TechBalanceBottleneckSamples[0].researchTechWindows[0].researchTech.bestByType.blue.tileId, "blue2");
assert.ok(d1TechBalanceAnalysis.recommendations.some((entry) => entry.id === "inspect-d1-tech-chain-closure"));
const d1TechBalanceSummary = analytics.summarizeBattleReports([d1TechBalanceReport]);
assert.equal(d1TechBalanceSummary.d1TechBalanceBottleneckSamples[0].playerId, "low-d1");
assert.equal(d1TechBalanceSummary.opportunities.d1TechBalanceBottleneck, 1);
assert.ok(d1TechBalanceSummary.recommendations.some((entry) => entry.id === "inspect-d1-tech-chain-closure"));

const highHandDrainEnergyTradeReport = {
  lastSummary: { ok: true, blocked: false, gameEnded: true, steps: 1 },
  logs: [
    {
      type: "turn-action",
      roundNumber: 3,
      turnNumber: 4,
      rawTurnNumber: 12,
      playerId: "player-white",
      playerLabel: "白色",
      playerResources: { score: 96, credits: 0, energy: 0, publicity: 4, handSize: 5 },
      details: {
        action: {
          id: "quickTrade",
          kind: "quick",
          tradeId: "cards-for-energy",
          score: 21.4,
          valueBreakdown: { cardsForEnergyHandDrainPenalty: 0 },
        },
        candidates: [],
      },
    },
    {
      type: "turn-action",
      roundNumber: 3,
      turnNumber: 4,
      rawTurnNumber: 12,
      playerId: "player-white",
      playerLabel: "白色",
      playerResources: { score: 96, credits: 0, energy: 1, publicity: 4, handSize: 3 },
      details: {
        action: {
          id: "quickTrade",
          kind: "quick",
          tradeId: "cards-for-energy",
          score: 15.4,
          valueBreakdown: {
            cardsForEnergyHandDrainPenalty: 11.5,
            currentScore: 96,
            finalMarkCount: 3,
            canReachAnalyze: false,
            planetCashoutRecoveryScore: 32,
            launchMoveRecoveryScore: 0,
            planetCashoutRecoveryPlan: {
              kind: "land",
              planetId: "mars",
              targetEnergy: 2,
              directScore: 6,
              rewardValue: 24,
              energyAfterTrade: 2,
              afterTradeGap: 0,
              reachesNextThreshold: false,
              score: 32,
            },
          },
        },
        candidates: [],
      },
    },
    {
      type: "turn-action",
      roundNumber: 3,
      turnNumber: 4,
      rawTurnNumber: 12,
      playerId: "player-white",
      playerLabel: "白色",
      playerResources: { score: 96, credits: 0, energy: 2, publicity: 4, handSize: 1 },
      details: {
        action: {
          id: "move",
          kind: "quick",
          score: 6.1,
          routeTarget: { kind: "planet", id: "jupiter", planetId: "jupiter", newDistance: 0 },
          followupMainAction: {
            actionId: "land",
            planetId: "jupiter",
            timing: "next_turn",
            score: 33.3,
            directScoreGain: 10,
            rewardValue: 0,
            energyCost: 2,
          },
          valueBreakdown: {
            preserveEnergyForRouteCashout: true,
            requiredMovePoints: 1,
            moveCardSpent: 1,
            moveEnergySpent: 0,
            energyAfterMovePayment: 2,
            paymentCost: 4.3,
            routeScore: 18.01,
            routeScoreForGain: 5.76,
            followupScore: 33.3,
            followupTiming: "next_turn",
          },
        },
        candidates: [],
      },
    },
  ],
  playerResults: [{ playerId: "player-white", playerLabel: "白色", finalScore: 180 }],
};
const highHandDrainAnalysis = analytics.analyzeBattleReport(highHandDrainEnergyTradeReport);
assert.equal(highHandDrainAnalysis.opportunities.highHandDrainEnergyTrade, 1);
assert.equal(highHandDrainAnalysis.highHandDrainEnergyTradeSamples[0].handDrainPenalty, 11.5);
assert.equal(highHandDrainAnalysis.highHandDrainEnergyTradeSamples[0].priorCardsForEnergyThisRawTurn, 1);
assert.equal(highHandDrainAnalysis.highHandDrainEnergyTradeSamples[0].planetPlan.planetId, "mars");
assert.equal(highHandDrainAnalysis.highHandDrainEnergyTradeSamples[0].predictedPlan.kind, "planetCashout");
assert.equal(highHandDrainAnalysis.highHandDrainEnergyTradeSamples[0].planFollowup.status, "deferred-route");
assert.equal(
  highHandDrainAnalysis.highHandDrainEnergyTradeSamples[0].laterLastCardPreserveEnergyMove.followupMainAction.actionId,
  "land",
);
assert.equal(highHandDrainAnalysis.opportunities.highHandDrainEnergyTradeUnfollowedPlan, 0);
const highHandDrainSummary = analytics.summarizeBattleReports([highHandDrainEnergyTradeReport]);
assert.equal(highHandDrainSummary.highHandDrainEnergyTradeSamples[0].planetPlan.score, 32);
assert.equal(highHandDrainSummary.highHandDrainEnergyTradeSamples[0].priorCardsForEnergyThisRawTurn, 1);

const highHandDrainUnfollowedPlanReport = {
  lastSummary: { ok: true, blocked: false, gameEnded: true, steps: 1 },
  logs: [
    {
      type: "turn-action",
      roundNumber: 4,
      turnNumber: 9,
      rawTurnNumber: 35,
      playerId: "player-green",
      playerLabel: "绿色",
      playerResources: { score: 83, credits: 1, energy: 0, publicity: 3, handSize: 3 },
      details: {
        action: {
          id: "quickTrade",
          kind: "quick",
          tradeId: "cards-for-energy",
          reason: "路线兑现：弃牌换能量准备环绕/登陆",
          score: 28.89,
          valueBreakdown: {
            cardsForEnergyHandDrainPenalty: 10.69,
            currentScore: 83,
            finalMarkCount: 3,
            canReachAnalyze: false,
            planetCashoutRecoveryScore: 33.375,
            launchMoveRecoveryScore: 0,
            planetCashoutRecoveryPlan: {
              kind: "land",
              planetId: "mars",
              targetEnergy: 1,
              directScore: 6,
              rewardValue: 24,
              energyAfterTrade: 1,
              afterTradeGap: 0,
              reachesNextThreshold: false,
              score: 33.375,
            },
          },
        },
        candidates: [],
      },
    },
    {
      type: "turn-action",
      roundNumber: 4,
      turnNumber: 9,
      rawTurnNumber: 35,
      playerId: "player-green",
      playerLabel: "绿色",
      playerResources: { score: 83, credits: 1, energy: 1, publicity: 3, handSize: 1 },
      details: {
        action: {
          id: "quickTrade",
          kind: "quick",
          tradeId: "publicity-for-card",
          reason: "终局低手牌：宣传精选恢复打牌",
          score: 31.2,
        },
        candidates: [],
      },
    },
    {
      type: "turn-action",
      roundNumber: 4,
      turnNumber: 9,
      rawTurnNumber: 35,
      playerId: "player-green",
      playerLabel: "绿色",
      playerResources: { score: 83, credits: 1, energy: 1, publicity: 0, handSize: 2 },
      details: {
        action: {
          id: "playCard",
          kind: "main",
          cardId: "b_3.webp",
          cardLabel: "替代主行动",
          score: 52.5,
        },
        candidates: [],
      },
    },
  ],
  playerResults: [{ playerId: "player-green", playerLabel: "绿色", finalScore: 160 }],
};
const highHandDrainUnfollowedAnalysis = analytics.analyzeBattleReport(highHandDrainUnfollowedPlanReport);
assert.equal(highHandDrainUnfollowedAnalysis.opportunities.highHandDrainEnergyTrade, 1);
assert.equal(highHandDrainUnfollowedAnalysis.opportunities.highHandDrainEnergyTradeUnfollowedPlan, 1);
assert.equal(highHandDrainUnfollowedAnalysis.highHandDrainEnergyTradeSamples[0].planFollowup.status, "rerouted-before-plan");
assert.equal(
  highHandDrainUnfollowedAnalysis.highHandDrainEnergyTradeUnfollowedPlanSamples[0].planFollowup.firstBlockingAction.id,
  "playCard",
);
assert.equal(
  highHandDrainUnfollowedAnalysis.highHandDrainEnergyTradeUnfollowedPlanSamples[0].laterSameRawTurnActions[0].tradeId,
  "publicity-for-card",
);
const highHandDrainUnfollowedSummary = analytics.summarizeBattleReports([highHandDrainUnfollowedPlanReport]);
assert.equal(highHandDrainUnfollowedSummary.highHandDrainEnergyTradeUnfollowedPlanSamples[0].playerId, "player-green");
assert.ok(highHandDrainUnfollowedSummary.recommendations.some(
  (entry) => entry.id === "classify-high-hand-energy-trade-unfollowed-plan",
));

const lastCardPreserveEnergyMoveReport = {
  lastSummary: { ok: true, blocked: false, gameEnded: true, steps: 1 },
  logs: [{
    type: "turn-action",
    roundNumber: 3,
    turnNumber: 4,
    playerId: "player-white",
    playerLabel: "白色",
    playerResources: { score: 96, credits: 0, energy: 2, publicity: 4, handSize: 1 },
    details: {
      action: {
        id: "move",
        kind: "quick",
        score: 12.2,
        routeTarget: { kind: "planet", id: "mars", planetId: "mars", newDistance: 0, score: 24 },
        followupMainAction: {
          actionId: "land",
          planetId: "mars",
          timing: "next_turn",
          score: 33.3,
          directScoreGain: 6,
          rewardValue: 24,
          energyCost: 2,
        },
        valueBreakdown: {
          preserveEnergyForRouteCashout: true,
          requiredMovePoints: 1,
          moveCardSpent: 1,
          moveEnergySpent: 0,
          energyAfterMovePayment: 2,
          paymentCost: 3,
          pathPenalty: 1.5,
          routeScore: 24,
          routeScoreForGain: 9.12,
          followupScore: 33.3,
          followupTiming: "next_turn",
        },
      },
      candidates: [],
    },
  }],
  playerResults: [{ playerId: "player-white", playerLabel: "白色", finalScore: 184 }],
};
const lastCardMoveAnalysis = analytics.analyzeBattleReport(lastCardPreserveEnergyMoveReport);
assert.equal(lastCardMoveAnalysis.opportunities.lastCardPreserveEnergyMove, 1);
assert.equal(lastCardMoveAnalysis.lastCardPreserveEnergyMoveSamples[0].moveCardSpent, 1);
assert.equal(lastCardMoveAnalysis.lastCardPreserveEnergyMoveSamples[0].routeTarget.planetId, "mars");
assert.equal(lastCardMoveAnalysis.lastCardPreserveEnergyMoveSamples[0].followupMainAction.actionId, "land");
const lastCardMoveSummary = analytics.summarizeBattleReports([lastCardPreserveEnergyMoveReport]);
assert.equal(lastCardMoveSummary.lastCardPreserveEnergyMoveSamples[0].followupTiming, "next_turn");

const negativeCardCornerGraphLiftReport = {
  lastSummary: { ok: true, blocked: false, gameEnded: true, steps: 1 },
  logs: [{
    type: "turn-action",
    roundNumber: 2,
    turnNumber: 7,
    playerId: "player-blue",
    playerLabel: "蓝色",
    playerResources: { score: 56, credits: 2, energy: 1, publicity: 2, handSize: 6 },
    details: {
      action: {
        id: "cardCorner",
        kind: "quick",
        score: -3.25,
        cardId: "b_90.webp",
        cardInstanceId: "card-b90",
        cardLabel: "MUREP创意竞赛",
        actionKind: "resource",
        actionGraph: { gain: -2.4, cost: 3, finalMarginal: 2, goalBonus: 11.2, net: 8.8 },
        breakdown: {
          rewardValue: -2.4,
          discardCost: 3,
          handPressure: 1.1,
          followupMainActionScore: 0,
          moveFollowupScore: 0,
          noCashoutMovePenalty: 0,
        },
      },
      candidates: [],
    },
  }],
  playerResults: [{ playerId: "player-blue", playerLabel: "蓝色", finalScore: 56 }],
};
const negativeCardCornerGraphLiftAnalysis = analytics.analyzeBattleReport(negativeCardCornerGraphLiftReport);
assert.equal(negativeCardCornerGraphLiftAnalysis.opportunities.negativeCardCornerGraphLift, 1);
assert.equal(negativeCardCornerGraphLiftAnalysis.negativeCardCornerGraphLiftSamples[0].rawScore, -3.25);
assert.equal(negativeCardCornerGraphLiftAnalysis.negativeCardCornerGraphLiftSamples[0].graphNet, 8.8);
assert.equal(negativeCardCornerGraphLiftAnalysis.negativeCardCornerGraphLiftSamples[0].goalBonus, 11.2);
const negativeCardCornerGraphLiftSummary = analytics.summarizeBattleReports([negativeCardCornerGraphLiftReport]);
assert.equal(negativeCardCornerGraphLiftSummary.negativeCardCornerGraphLiftSamples[0].cardId, "b_90.webp");

const negativeCardCornerBeforeNoMainPassReport = {
  lastSummary: { ok: true, blocked: false, gameEnded: true, steps: 1 },
  logs: [
    {
      type: "turn-action",
      roundNumber: 3,
      turnNumber: 4,
      rawTurnNumber: 12,
      playerId: "player-blue",
      playerLabel: "蓝色",
      playerResources: { score: 35, credits: 0, energy: 1, publicity: 2, handSize: 2 },
      details: {
        action: {
          id: "cardCorner",
          kind: "quick",
          score: -1.25,
          cardId: "b_11.webp",
          cardLabel: "飞掠小行星",
          actionGraph: { goalBonus: 7.4, net: 6.15 },
        },
        candidates: [],
      },
    },
    {
      type: "turn-action",
      roundNumber: 3,
      turnNumber: 4,
      rawTurnNumber: 12,
      playerId: "player-blue",
      playerLabel: "蓝色",
      playerResources: { score: 35, credits: 0, energy: 1, publicity: 3, handSize: 1 },
      details: {
        action: { id: "pass", kind: "pass", score: -2.3 },
        candidates: [
          { id: "pass", kind: "pass", available: true, score: -2.3 },
          { id: "playCard", kind: "main", available: false, score: 0, reason: "没有资源可支付的普通手牌" },
          { id: "scan", kind: "main", available: false, score: 0, reason: "资源不足，扫描需要 1信用点 + 2能量" },
        ],
      },
    },
  ],
  playerResults: [{ playerId: "player-blue", playerLabel: "蓝色", finalScore: 153 }],
};
const negativeCardCornerBeforeNoMainPassAnalysis = analytics.analyzeBattleReport(
  negativeCardCornerBeforeNoMainPassReport,
);
assert.equal(negativeCardCornerBeforeNoMainPassAnalysis.opportunities.preNoMainPassResourceDrain, 1);
assert.equal(negativeCardCornerBeforeNoMainPassAnalysis.opportunities.negativeCardCornerBeforeNoMainPass, 1);
assert.equal(
  negativeCardCornerBeforeNoMainPassAnalysis.negativeCardCornerBeforeNoMainPassSamples[0].previousAction.cardId,
  "b_11.webp",
);
assert(
  negativeCardCornerBeforeNoMainPassAnalysis.recommendations.some(
    (entry) => entry.id === "classify-negative-card-corner-before-no-main-pass",
  ),
);
const negativeCardCornerBeforeNoMainPassSummary = analytics.summarizeBattleReports([
  negativeCardCornerBeforeNoMainPassReport,
]);
assert.equal(negativeCardCornerBeforeNoMainPassSummary.opportunities.negativeCardCornerBeforeNoMainPass, 1);
assert.equal(
  negativeCardCornerBeforeNoMainPassSummary.negativeCardCornerBeforeNoMainPassSamples[0].previousAction.cardLabel,
  "飞掠小行星",
);

const nonPositivePublicRefillReport = {
  lastSummary: { ok: true, blocked: false, gameEnded: true, steps: 1 },
  logs: [{
    type: "pick-card",
    roundNumber: 4,
    turnNumber: 10,
    playerId: "player-brown",
    playerLabel: "棕色",
    playerResources: { score: 149, credits: 0, energy: 1, publicity: 6, handSize: 2 },
    details: {
      pendingType: "trade",
      slotIndex: 1,
      score: -11.96,
      card: {
        id: "card-163-0",
        cardId: "dlc_2.png",
        cardName: "跟踪与数据中继卫星",
        price: 1,
        cardTypeCode: 0,
        discardActionCode: 1,
        scanActionCode: 1,
        incomeCode: 2,
      },
    },
  }],
  playerResults: [{ playerId: "player-brown", playerLabel: "棕色", finalScore: 290 }],
};
const nonPositivePublicRefillAnalysis = analytics.analyzeBattleReport(nonPositivePublicRefillReport);
assert.equal(nonPositivePublicRefillAnalysis.opportunities.nonPositivePublicRefill, 1);
assert.equal(nonPositivePublicRefillAnalysis.nonPositivePublicRefillSamples[0].score, -11.96);
assert.equal(nonPositivePublicRefillAnalysis.nonPositivePublicRefillSamples[0].cardId, "dlc_2.png");
const nonPositivePublicRefillSummary = analytics.summarizeBattleReports([nonPositivePublicRefillReport]);
assert.equal(nonPositivePublicRefillSummary.nonPositivePublicRefillSamples[0].cardLabel, "跟踪与数据中继卫星");

const compoundTechCardReport = {
  lastSummary: { ok: true, blocked: false, gameEnded: true, steps: 1 },
  logs: [{
    type: "turn-action",
    roundNumber: 4,
    turnNumber: 2,
    playerId: "player-white",
    playerLabel: "白色",
    playerResources: { score: 114, credits: 3, energy: 6, publicity: 6, handSize: 6 },
    details: {
      action: { id: "researchTech", kind: "main", score: 109 },
      candidates: [
        {
          id: "researchTech",
          kind: "main",
          available: true,
          score: 109,
          takeable: [{ tileId: "purple1", techType: "purple", score: 71, directScoreGain: 3 }],
        },
        {
          id: "playCard",
          kind: "main",
          available: true,
          score: 79,
          playableCards: [{
            id: "playCard",
            kind: "main",
            available: true,
            cardId: "b_135.webp",
            cardInstanceId: "card-b135",
            cardLabel: "韦断特v克综合孔径射电|远锐",
            price: 3,
            typeCode: 2,
            score: 79,
            directScoreGain: 3,
            effectTypes: ["card_research_tech"],
            valueBreakdown: { cFinalTaskProgressValue: 0, lateCardEnginePressure: 8 },
          }],
        },
      ],
    },
  }],
  playerResults: [{ playerId: "player-white", playerLabel: "白色", finalScore: 185 }],
};
const compoundTechCardAnalysis = analytics.analyzeBattleReport(compoundTechCardReport);
assert.equal(compoundTechCardAnalysis.opportunities.researchTechOverCompoundTechCard, 1);
assert.equal(compoundTechCardAnalysis.researchTechCompoundCardSamples[0].compoundCard.cardId, "b_135.webp");
assert.equal(compoundTechCardAnalysis.researchTechCompoundCardSamples[0].bestTechTile.tileId, "purple1");
const compoundTechCardSummary = analytics.summarizeBattleReports([compoundTechCardReport]);
assert.equal(compoundTechCardSummary.researchTechCompoundCardSamples[0].compoundCard.cardId, "b_135.webp");

const orange4RaceSensitiveReport = {
  lastSummary: { ok: true, blocked: false, gameEnded: true, steps: 1 },
  logs: [
    {
      type: "turn-action",
      roundNumber: 1,
      turnNumber: 2,
      rawTurnNumber: 6,
      playerId: "player-blue",
      playerLabel: "蓝色",
      playerResources: { score: 18, credits: 1, energy: 1, publicity: 5, handSize: 3 },
      details: {
        action: {
          id: "researchTech",
          kind: "main",
          score: 28,
          valueBreakdown: { bestTechTileId: "orange4" },
          takeable: [
            {
              tileId: "orange4",
              techType: "orange",
              bonusId: "bonus_1c",
              available: true,
              score: 26,
              valueBreakdown: {
                orange4SatelliteProfile: {
                  potential: 36,
                  rawPotential: 42,
                  racePenalty: 6,
                  rawRacePenalty: 6,
                  routeDistance: 99,
                  launchRouteDistance: 99,
                  launchRoutePlanScore: 5.2,
                  launchRouteCardId: "b_129.webp",
                  planetId: "mars",
                  satelliteId: "phobos-deimos",
                },
              },
            },
            {
              tileId: "blue1",
              techType: "blue",
              bonusId: "bonus_1p",
              available: true,
              score: 25,
            },
          ],
        },
        candidates: [],
      },
    },
    {
      type: "turn-action",
      roundNumber: 1,
      turnNumber: 3,
      rawTurnNumber: 9,
      playerId: "player-green",
      playerLabel: "绿色",
      details: {
        action: {
          id: "land",
          choices: [{ planetId: "mars", target: { type: "satellite", satelliteId: "phobos-deimos" } }],
        },
      },
    },
    {
      type: "land-target",
      roundNumber: 1,
      turnNumber: 3,
      rawTurnNumber: 10,
      playerId: "player-green",
      playerLabel: "绿色",
      details: {
        selectedIndex: 0,
        selected: { target: { type: "satellite", satelliteId: "phobos-deimos" }, score: 25 },
      },
    },
  ],
  playerResults: [{ playerId: "player-blue", playerLabel: "蓝色", finalScore: 170 }],
};
const orange4RaceSensitiveAnalysis = analytics.analyzeBattleReport(orange4RaceSensitiveReport);
assert.equal(orange4RaceSensitiveAnalysis.opportunities.orange4RaceSensitiveTech, 1);
assert.ok(orange4RaceSensitiveAnalysis.orange4RaceSensitiveTechSamples[0].riskTags.includes("target-taken-by-other"));
assert.ok(orange4RaceSensitiveAnalysis.orange4RaceSensitiveTechSamples[0].riskTags.includes("no-current-route"));
assert.ok(orange4RaceSensitiveAnalysis.orange4RaceSensitiveTechSamples[0].riskTags.includes("launch-card-route-only"));
assert.ok(orange4RaceSensitiveAnalysis.orange4RaceSensitiveTechTagCounts.some((entry) => entry.key === "target-taken-by-other" && entry.count === 1));
assert.ok(orange4RaceSensitiveAnalysis.orange4RaceSensitiveTechTagCounts.some((entry) => entry.key === "launch-card-route-only" && entry.count === 1));
assert.equal(orange4RaceSensitiveAnalysis.orange4RaceActionableCounterfactualSamples.length, 1);
assert.equal(orange4RaceSensitiveAnalysis.orange4RaceActionableCounterfactualSamples[0].replacementTech.tileId, "blue1");
assert.ok(orange4RaceSensitiveAnalysis.orange4RaceActionableCounterfactualSamples[0].riskTags.includes("target-taken-by-other"));
const orange4RaceSensitiveSummary = analytics.summarizeBattleReports([orange4RaceSensitiveReport]);
assert.ok(orange4RaceSensitiveSummary.orange4RaceSensitiveTechTagCounts.some((entry) => entry.key === "target-taken-by-other" && entry.count === 1));
assert.equal(orange4RaceSensitiveSummary.orange4RaceActionableCounterfactualSamples[0].replacementTech.tileId, "blue1");

const orange4RedirectedBeforeTargetLossReport = {
  lastSummary: { ok: true, blocked: false, gameEnded: true, steps: 1 },
  logs: [
    {
      type: "turn-action",
      roundNumber: 1,
      turnNumber: 1,
      rawTurnNumber: 2,
      playerId: "player-blue",
      playerLabel: "蓝色",
      playerResources: { score: 7, credits: 5, energy: 3, publicity: 6, handSize: 4 },
      details: {
        action: {
          id: "researchTech",
          kind: "main",
          score: 38,
          valueBreakdown: { bestTechTileId: "orange4" },
          takeable: [
            {
              tileId: "orange4",
              techType: "orange",
              bonusId: "bonus_1c",
              available: true,
              score: 34,
              valueBreakdown: {
                orange4SatelliteProfile: {
                  potential: 65,
                  rawPotential: 69,
                  racePenalty: 4,
                  rawRacePenalty: 4,
                  routeDistance: 99,
                  launchRouteDistance: 99,
                  planetId: "mars",
                  satelliteId: "phobos-deimos",
                },
              },
            },
            {
              tileId: "orange1",
              techType: "orange",
              bonusId: "bonus_1p",
              available: true,
              score: 31,
            },
          ],
        },
        candidates: [],
      },
    },
    {
      type: "turn-action",
      roundNumber: 1,
      turnNumber: 4,
      rawTurnNumber: 14,
      playerId: "player-blue",
      playerLabel: "蓝色",
      details: {
        action: {
          id: "land",
          choices: [{ planetId: "card-pluto-land", target: { type: "satellite", satelliteId: "titan" } }],
        },
      },
    },
    {
      type: "land-target",
      roundNumber: 1,
      turnNumber: 4,
      rawTurnNumber: 15,
      playerId: "player-blue",
      playerLabel: "蓝色",
      details: {
        selectedIndex: 0,
        selected: { target: { type: "satellite", satelliteId: "titan" }, score: 38 },
      },
    },
    {
      type: "turn-action",
      roundNumber: 2,
      turnNumber: 2,
      rawTurnNumber: 7,
      playerId: "player-green",
      playerLabel: "绿色",
      details: {
        action: {
          id: "land",
          choices: [{ planetId: "mars", target: { type: "satellite", satelliteId: "phobos-deimos" } }],
        },
      },
    },
    {
      type: "land-target",
      roundNumber: 2,
      turnNumber: 2,
      rawTurnNumber: 8,
      playerId: "player-green",
      playerLabel: "绿色",
      details: {
        selectedIndex: 0,
        selected: { target: { type: "satellite", satelliteId: "phobos-deimos" }, score: 48 },
      },
    },
  ],
  playerResults: [{ playerId: "player-blue", playerLabel: "蓝色", finalScore: 153 }],
};
const orange4RedirectedBeforeTargetLossAnalysis = analytics.analyzeBattleReport(orange4RedirectedBeforeTargetLossReport);
assert.equal(orange4RedirectedBeforeTargetLossAnalysis.opportunities.orange4RaceSensitiveTech, 1);
assert.ok(orange4RedirectedBeforeTargetLossAnalysis.orange4RaceSensitiveTechSamples[0].riskTags.includes("target-taken-by-other"));
assert.ok(orange4RedirectedBeforeTargetLossAnalysis.orange4RaceSensitiveTechSamples[0].riskTags.includes("orange4-redirected-before-target-loss"));
assert.equal(orange4RedirectedBeforeTargetLossAnalysis.orange4RaceActionableCounterfactualSamples.length, 0);

const playCardNearMissReport = {
  lastSummary: { ok: true, blocked: false, gameEnded: true, steps: 1 },
  logs: [{
    type: "turn-action",
    roundNumber: 3,
    turnNumber: 5,
    playerId: "player-white",
    playerLabel: "白色",
    playerResources: { score: 101, credits: 3, energy: 4, publicity: 6, handSize: 5 },
    details: {
      action: { id: "land", kind: "main", score: 80, actionGraph: { net: 80 } },
      candidates: [
        { id: "land", kind: "main", available: true, score: 80, actionGraph: { net: 80 } },
        {
          id: "playCard",
          kind: "main",
          available: true,
          score: 68,
          actionGraph: { net: 72 },
          playableCards: [{
            id: "playCard",
            kind: "main",
            available: true,
            cardId: "b_135.webp",
            cardInstanceId: "card-b135",
            cardLabel: "韦断特v克综合孔径射电|远锐",
            price: 3,
            typeCode: 2,
            score: 64,
            directScoreGain: 3,
            effectTypes: ["card_research_tech"],
            plan: { type: "card-route", actionId: "researchTech", score: 21, label: "紫色科技" },
            valueBreakdown: {
              planScore: 21,
              lateCardEnginePressure: 8,
              playCardConversionPressure: 9,
              cFinalTaskProgressValue: 4,
              c2Type3ProgressValue: 0,
              endGameExpectedScore: 3,
              standardActionPremium: 6,
              finalSecondMarkNoDirectSetupPenalty: -2,
            },
          }],
        },
      ],
    },
  }],
  playerResults: [{
    playerId: "player-white",
    playerLabel: "白色",
    finalScore: 185,
    handCards: [{
      id: "card-b135",
      cardId: "b_135.webp",
      label: "韦断特v克综合孔径射电|远锐",
      price: 3,
      typeCode: 2,
      taskCount: 1,
      remainingTaskCount: 1,
      tasks: [{
        id: "b135-same-color-sectors-task",
        completed: false,
        condition: {
          type: "completedSameSectorColor",
          targetCount: 2,
          currentCount: 1,
          missingCount: 1,
          met: false,
        },
        rewardDirectScore: 9,
        rewardValue: 9,
      }],
      effectTypes: ["card_research_tech"],
    }],
    reservedCards: [{ id: "card-b30", cardId: "b_30.webp", label: "深部地下中微子实验", price: 3, typeCode: 3, taskCount: 0, endGameScoring: true }],
  }],
};
const playCardNearMissAnalysis = analytics.analyzeBattleReport(playCardNearMissReport);
assert.equal(playCardNearMissAnalysis.opportunities.playCardNearMiss, 1);
assert.equal(playCardNearMissAnalysis.opportunities.engineActionNearMiss, 1);
assert.equal(playCardNearMissAnalysis.playCardNearMissSamples[0].bestCard.cardId, "b_135.webp");
assert.equal(playCardNearMissAnalysis.playCardNearMissSamples[0].policyScoreGap, 8);
assert.equal(playCardNearMissAnalysis.playCardNearMissSamples[0].finalScore, 185);
assert.equal(playCardNearMissAnalysis.playCardNearMissSamples[0].bestCard.valueBreakdown.playCardConversionPressure, 9);
assert.equal(playCardNearMissAnalysis.engineActionNearMissSamples[0].target.id, "playCard");
assert(playCardNearMissAnalysis.engineActionNearMissSamples[0].nearMissTags.includes("target-playCard"));
assert.equal(playCardNearMissAnalysis.lowPlayerCandidateStats[0].playerId, "player-white");
assert.equal(
  playCardNearMissAnalysis.lowPlayerCandidateStats[0].focusedCandidateRows.find((row) => row.actionId === "playCard").availableNotSelected,
  1,
);
assert.equal(playCardNearMissAnalysis.lowUnplayedCardSamples[0].cards[0].cardId, "b_135.webp");
assert.equal(playCardNearMissAnalysis.lowUnplayedCardSamples[0].cards[0].remainingTaskCount, 1);
assert.equal(playCardNearMissAnalysis.lowUnplayedCardSamples[0].cards[0].tasks[0].condition.missingCount, 1);
assert.equal(playCardNearMissAnalysis.lowUnplayedCardSamples[0].cards[1].zone, "reserved");
assert.equal(playCardNearMissAnalysis.opportunities.nearCompleteTaskPressure, 1);
assert.equal(playCardNearMissAnalysis.nearCompleteTaskPressureSamples[0].card.cardId, "b_135.webp");
assert.equal(playCardNearMissAnalysis.nearCompleteTaskPressureSamples[0].task.id, "b135-same-color-sectors-task");
assert(playCardNearMissAnalysis.nearCompleteTaskPressureSamples[0].task.routeActions.includes("scan"));
assert(playCardNearMissAnalysis.nearCompleteTaskPressureSamples[0].task.routeActions.includes("land"));
assert(playCardNearMissAnalysis.nearCompleteTaskPressureSamples[0].task.routeActions.includes("playCard"));
assert.equal(playCardNearMissAnalysis.nearCompleteTaskPressureSamples[0].routeCandidateTurnCount, 1);
assert.equal(playCardNearMissAnalysis.nearCompleteTaskPressureSamples[0].routeSelectedCount, 1);
assert.equal(playCardNearMissAnalysis.nearCompleteTaskPressureSamples[0].bestRouteTurn.selected.id, "land");
const playCardNearMissSummary = analytics.summarizeBattleReports([playCardNearMissReport]);
assert.equal(playCardNearMissSummary.playCardNearMissSamples[0].bestCard.cardId, "b_135.webp");
assert.equal(playCardNearMissSummary.engineActionNearMissCounts.byTransition[0].key, "land->playCard");
assert.equal(playCardNearMissSummary.lowPlayerCandidateStats[0].topMissedCandidates[0].actionId, "playCard");
assert.equal(playCardNearMissSummary.lowUnplayedCardSamples[0].cards[0].tasks[0].rewardDirectScore, 9);
assert.equal(playCardNearMissSummary.lowUnplayedCardSamples[0].cards[1].endGameScoring, true);
assert.equal(playCardNearMissSummary.opportunities.nearCompleteTaskPressure, 1);
assert.equal(playCardNearMissSummary.nearCompleteTaskPressureSamples[0].task.rewardDirectScore, 9);
assert(playCardNearMissSummary.recommendations.some((entry) => entry.id === "inspect-near-complete-task-pressure"));

const nearCompleteTaskTargetReport = {
  lastSummary: { ok: true, blocked: false, gameEnded: true, steps: 1 },
  logs: [{
    type: "turn-action",
    roundNumber: 2,
    turnNumber: 5,
    rawTurnNumber: 5,
    playerId: "player-blue",
    playerLabel: "蓝色",
    playerResources: { score: 55, credits: 3, energy: 2, publicity: 1, availableData: 0, handSize: 2 },
    details: {
      action: {
        id: "land",
        kind: "main",
        planetId: "jupiter",
        planetName: "木星",
        score: 35,
        directScoreGain: 8,
        actionGraph: { net: 35 },
      },
      candidates: [{
        id: "land",
        kind: "main",
        available: true,
        planetId: "jupiter",
        planetName: "木星",
        score: 35,
        directScoreGain: 8,
        actionGraph: { net: 35 },
      }],
    },
  }, {
    type: "pick-card",
    roundNumber: 3,
    turnNumber: 1,
    rawTurnNumber: 6,
    playerId: "player-blue",
    playerLabel: "蓝色",
    details: {
      card: {
        id: "card-jupiter-task",
        cardId: "b_jupiter_test.webp",
        cardName: "木星任务测试",
      },
    },
  }, {
    type: "turn-action",
    roundNumber: 3,
    turnNumber: 2,
    rawTurnNumber: 8,
    playerId: "player-blue",
    playerLabel: "蓝色",
    playerResources: { score: 82, credits: 3, energy: 2, publicity: 1, availableData: 0, handSize: 2 },
    details: {
      action: {
        id: "land",
        kind: "main",
        planetId: "mars",
        planetName: "火星",
        score: 20,
        directScoreGain: 6,
        actionGraph: { net: 20 },
      },
      candidates: [
        {
          id: "land",
          kind: "main",
          available: true,
          planetId: "jupiter",
          routeTarget: {
            id: "jupiter",
            kind: "planet",
            taskRouteCashout: { value: 12, directScore: 4, count: 1 },
            nearCompleteTaskRouteCashout: { value: 12, directScore: 4, count: 1 },
          },
          planetName: "木星",
          score: 42,
          directScoreGain: 10,
          actionGraph: { net: 42 },
        },
        {
          id: "land",
          kind: "main",
          available: true,
          planetId: "mars",
          planetName: "火星",
          score: 20,
          directScoreGain: 6,
          actionGraph: { net: 20 },
        },
      ],
    },
  }, {
    type: "turn-action",
    roundNumber: 3,
    turnNumber: 3,
    rawTurnNumber: 12,
    playerId: "player-blue",
    playerLabel: "蓝色",
    playerResources: { score: 88, credits: 1, energy: 1, publicity: 1, availableData: 0, handSize: 2 },
    details: {
      action: {
        id: "land",
        kind: "main",
        planetId: "mars",
        planetName: "火星",
        score: 18,
        directScoreGain: 6,
        actionGraph: { net: 18 },
      },
      candidates: [{
        id: "land",
        kind: "main",
        available: true,
        planetId: "mars",
        planetName: "火星",
        score: 18,
        directScoreGain: 6,
        actionGraph: { net: 18 },
      }, {
        id: "move",
        kind: "quick",
        available: true,
        routeTarget: {
          id: "jupiter",
          kind: "planet",
        },
        score: 24,
        actionGraph: { net: 24 },
      }],
    },
  }],
  playerResults: [{
    playerId: "player-blue",
    playerLabel: "蓝色",
    finalScore: 180,
    baseScore: 120,
    tileScore: 40,
    cardScore: 20,
    completedTaskCount: 1,
    techCount: 6,
    finalMarkCount: 3,
    resources: { credits: 0, energy: 0, publicity: 0, availableData: 0, handSize: 0 },
    handCards: [],
    reservedCards: [{
      cardId: "b_jupiter_test.webp",
      cardInstanceId: "card-jupiter-task",
      label: "木星任务测试",
      price: 2,
      typeCode: 2,
      taskCount: 1,
      remainingTaskCount: 1,
      effectTypes: ["launch"],
      tasks: [{
        id: "jupiter-task-test",
        completed: false,
        condition: {
          type: "planetOrbitOrLand",
          planetId: "jupiter",
          targetCount: 1,
          currentCount: 0,
          missingCount: 1,
          met: false,
        },
        rewardDirectScore: 4,
        rewardValue: 7,
      }],
    }],
  }],
};
const nearCompleteTaskTargetAnalysis = analytics.analyzeBattleReport(nearCompleteTaskTargetReport);
const nearCompleteTaskTargetSample = nearCompleteTaskTargetAnalysis.nearCompleteTaskPressureSamples[0];
assert.equal(nearCompleteTaskTargetSample.routeCandidateTurnCount, 2);
assert.equal(nearCompleteTaskTargetSample.routeSelectedCount, 2);
assert.equal(nearCompleteTaskTargetSample.card.cardInstanceId, "card-jupiter-task");
assert.equal(nearCompleteTaskTargetSample.cardAvailableFrom.logIndex, 1);
assert.equal(nearCompleteTaskTargetSample.cardAvailableFrom.sourceType, "pick-card");
assert.equal(nearCompleteTaskTargetSample.bestRouteTurn.roundNumber, 3);
assert.equal(nearCompleteTaskTargetSample.taskTarget.key, "planet:jupiter");
assert.equal(nearCompleteTaskTargetSample.taskTarget.candidateTurnCount, 1);
assert.equal(nearCompleteTaskTargetSample.taskTarget.selectedCount, 0);
assert.equal(nearCompleteTaskTargetSample.taskTarget.bestTurn.bestRouteCandidate.planetId, "jupiter");
assert.equal(nearCompleteTaskTargetSample.taskTarget.bestTurn.bestRouteCandidate.nearCompleteTaskRouteCashout.count, 1);
const nearCompleteTaskTargetSummary = analytics.summarizeBattleReports([nearCompleteTaskTargetReport]);
assert.equal(nearCompleteTaskTargetSummary.nearCompleteTaskPressureSamples[0].taskTarget.key, "planet:jupiter");
assert.equal(nearCompleteTaskTargetSummary.nearCompleteTaskPressureSamples[0].taskTarget.selectedCount, 0);

const engineActionNearMissReport = {
  lastSummary: { ok: true, blocked: false, gameEnded: true, steps: 1 },
  logs: [{
    type: "turn-action",
    roundNumber: 3,
    turnNumber: 6,
    rawTurnNumber: 18,
    playerId: "player-blue",
    playerLabel: "蓝色",
    playerResources: { score: 122, credits: 2, energy: 2, publicity: 4, availableData: 6, handSize: 3 },
    details: {
      action: { id: "researchTech", kind: "main", score: 34.5, actionGraph: { net: 34.5 } },
      candidates: [
        {
          id: "researchTech",
          kind: "main",
          available: true,
          score: 34.5,
          actionGraph: { net: 34.5 },
          takeable: [{ tileId: "blue2", techType: "blue", bonusId: "bonus_1e", score: 31, directScoreGain: 4 }],
        },
        {
          id: "analyze",
          kind: "main",
          available: true,
          score: 31,
          directScoreGain: 10,
          actionGraph: { net: 31 },
          valueBreakdown: {
            currentScore: 122,
            finalMarkCount: 3,
            placedCount: 6,
            requiredSlot: 6,
            availableData: 6,
            dataRoom: 0,
            energyCost: 1,
            analyzeBestBlueTraceScore: 10,
            readyAnalyzeWindowValue: 13.5,
            lateFullDataAnalyzeRecovery: 0,
            thresholdCashoutPressure: 2.2,
            rawScore: 31,
            weightedScore: 31,
          },
        },
        {
          id: "placeData",
          kind: "quick",
          available: true,
          score: 25,
          directScoreGain: 0,
          actionGraph: { net: 25 },
          valueBreakdown: { currentScore: 122, canReachAnalyze: true },
        },
      ],
    },
  }, {
    type: "turn-action",
    roundNumber: 3,
    turnNumber: 7,
    rawTurnNumber: 19,
    playerId: "player-blue",
    playerLabel: "蓝色",
    playerResources: { score: 122, credits: 2, energy: 2, publicity: 4, availableData: 6, handSize: 3 },
    details: {
      action: { id: "end-turn", kind: "pass", score: 0, actionGraph: { net: 0 } },
      candidates: [],
    },
  }, {
    type: "turn-action",
    roundNumber: 3,
    turnNumber: 8,
    rawTurnNumber: 20,
    playerId: "player-blue",
    playerLabel: "蓝色",
    playerResources: { score: 132, credits: 2, energy: 1, publicity: 4, availableData: 0, handSize: 3 },
    details: {
      action: { id: "analyze", kind: "main", score: 31, directScoreGain: 10, actionGraph: { net: 31 } },
      candidates: [],
    },
  }, {
    type: "turn-action",
    roundNumber: 3,
    turnNumber: 9,
    rawTurnNumber: 21,
    playerId: "player-blue",
    playerLabel: "蓝色",
    playerResources: { score: 132, credits: 2, energy: 1, publicity: 4, availableData: 0, handSize: 3 },
    details: {
      action: { id: "placeData", kind: "quick", score: 25, actionGraph: { net: 25 } },
      candidates: [],
    },
  }],
  playerResults: [{ playerId: "player-blue", playerLabel: "蓝色", finalScore: 214 }],
};
const engineActionNearMissAnalysis = analytics.analyzeBattleReport(engineActionNearMissReport);
assert.equal(engineActionNearMissAnalysis.opportunities.engineActionNearMiss, 2);
assert.equal(engineActionNearMissAnalysis.engineActionNearMissSamples[0].target.id, "analyze");
assert.equal(engineActionNearMissAnalysis.engineActionNearMissSamples[0].target.valueBreakdown.analyzePlacedCount, 6);
assert.equal(engineActionNearMissAnalysis.engineActionNearMissSamples[0].target.valueBreakdown.analyzeBestBlueTraceScore, 10);
assert.equal(engineActionNearMissAnalysis.engineActionNearMissSamples[0].target.valueBreakdown.readyAnalyzeWindowValue, 13.5);
assert(engineActionNearMissAnalysis.engineActionNearMissSamples[0].nearMissTags.includes("data-cashout"));
assert.equal(engineActionNearMissAnalysis.engineActionNearMissSamples[0].followup.targetSeenWithin, 2);
assert.equal(engineActionNearMissAnalysis.engineActionNearMissSamples[0].followup.targetSearch.targetSeenWithin, 2);
assert(engineActionNearMissAnalysis.engineActionNearMissSamples[0].nearMissTags.includes("target-delayed-hit"));
assert(engineActionNearMissAnalysis.engineActionNearMissSamples[0].nearMissTags.includes("idle-before-target"));
assert.equal(engineActionNearMissAnalysis.engineActionNearMissSamples[1].target.id, "placeData");
assert(engineActionNearMissAnalysis.engineActionNearMissSamples[1].nearMissTags.includes("data-placement"));
assert.equal(engineActionNearMissAnalysis.engineActionNearMissSamples[1].followup.targetSeenWithin, 3);
assert.equal(engineActionNearMissAnalysis.engineActionNearMissSamples[1].followup.targetSearch.targetSeenWithin, 3);
assert.equal(engineActionNearMissAnalysis.engineActionNearMissSamples[1].followup.firstEngineActionId, "analyze");
assert(engineActionNearMissAnalysis.engineActionNearMissSamples[1].nearMissTags.includes("different-engine-before-target"));
assert.equal(engineActionNearMissAnalysis.engineActionUnrecoveredNearMissSamples.length, 0);
const engineActionNearMissSummary = analytics.summarizeBattleReports([engineActionNearMissReport]);
assert.equal(engineActionNearMissSummary.engineActionNearMissCounts.byTarget.length, 2);
assert.equal(engineActionNearMissSummary.engineActionNearMissCounts.byTransition[0].key, "researchTech->analyze");
assert.equal(engineActionNearMissSummary.engineActionUnrecoveredNearMissSamples.length, 0);

const engineActionUnrecoveredNearMissReport = {
  lastSummary: { ok: true, blocked: false, gameEnded: true, steps: 1 },
  logs: [
    {
      type: "turn-action",
      roundNumber: 3,
      turnNumber: 1,
      rawTurnNumber: 4,
      playerId: "player-green",
      playerLabel: "绿色",
      playerResources: { score: 60, credits: 1, energy: 3, publicity: 5, availableData: 1, handSize: 5 },
      details: {
        action: { id: "scan", kind: "main", score: 45, directScoreGain: 2, actionGraph: { net: 45 } },
        candidates: [
          { id: "scan", kind: "main", available: true, score: 45, directScoreGain: 2, actionGraph: { net: 45 } },
          {
            id: "researchTech",
            kind: "main",
            available: true,
            score: 42,
            directScoreGain: 0,
            actionGraph: { net: 42 },
            takeable: [{ tileId: "purple1", techType: "purple", bonusId: "bonus_1c", score: 38, directScoreGain: 0 }],
          },
        ],
      },
    },
    {
      type: "turn-action",
      roundNumber: 3,
      turnNumber: 1,
      rawTurnNumber: 4,
      playerId: "player-green",
      playerLabel: "绿色",
      details: {
        action: { id: "placeData", kind: "quick", score: 12, actionGraph: { net: 12 } },
        candidates: [],
      },
    },
    {
      type: "turn-action",
      roundNumber: 3,
      turnNumber: 1,
      rawTurnNumber: 4,
      playerId: "player-green",
      playerLabel: "绿色",
      details: {
        action: { id: "placeData", kind: "quick", score: 11, actionGraph: { net: 11 } },
        candidates: [],
      },
    },
    {
      type: "turn-action",
      roundNumber: 3,
      turnNumber: 1,
      rawTurnNumber: 4,
      playerId: "player-green",
      playerLabel: "绿色",
      details: {
        action: { id: "end-turn", kind: "end-turn", score: -0.5, actionGraph: { net: -0.5 } },
        candidates: [],
      },
    },
    {
      type: "turn-action",
      roundNumber: 3,
      turnNumber: 2,
      rawTurnNumber: 8,
      playerId: "player-green",
      playerLabel: "绿色",
      details: {
        action: { id: "pass", kind: "pass", score: -2, actionGraph: { net: -2 } },
        candidates: [],
      },
    },
  ],
  playerResults: [{ playerId: "player-green", playerLabel: "绿色", finalScore: 180 }],
};
const engineActionUnrecoveredNearMissAnalysis = analytics.analyzeBattleReport(engineActionUnrecoveredNearMissReport);
assert.equal(engineActionUnrecoveredNearMissAnalysis.opportunities.engineActionNearMiss, 1);
assert.equal(engineActionUnrecoveredNearMissAnalysis.engineActionNearMissSamples[0].target.id, "researchTech");
assert.equal(engineActionUnrecoveredNearMissAnalysis.engineActionUnrecoveredNearMissSamples.length, 1);
assert.equal(engineActionUnrecoveredNearMissAnalysis.engineActionUnrecoveredNearMissSamples[0].target.bestTechTile.tileId, "purple1");
assert.deepEqual(
  engineActionUnrecoveredNearMissAnalysis.engineActionUnrecoveredNearMissSamples[0].followup.targetSearch.actionIds,
  ["end-turn", "pass"],
);
assert(engineActionUnrecoveredNearMissAnalysis.engineActionUnrecoveredNearMissSamples[0].nearMissTags.includes("target-not-seen"));
const engineActionUnrecoveredNearMissSummary = analytics.summarizeBattleReports([engineActionUnrecoveredNearMissReport]);
assert.equal(engineActionUnrecoveredNearMissSummary.engineActionUnrecoveredNearMissSamples[0].target.id, "researchTech");

const analyzeLowResourceReadyCashoutNearMissReport = {
  lastSummary: { ok: true, blocked: false, gameEnded: true, steps: 1 },
  logs: [
    {
      type: "turn-action",
      roundNumber: 3,
      turnNumber: 5,
      rawTurnNumber: 17,
      playerId: "player-green",
      playerLabel: "绿色",
      playerResources: { score: 71, credits: 0, energy: 3, publicity: 3, availableData: 1, handSize: 3 },
      details: {
        action: { id: "scan", kind: "main", score: 45, directScoreGain: 0, actionGraph: { net: 45 } },
        candidates: [
          { id: "scan", kind: "main", available: true, score: 45, directScoreGain: 0, actionGraph: { net: 45 } },
          {
            id: "analyze",
            kind: "main",
            available: true,
            score: 43.4,
            directScoreGain: 6,
            actionGraph: { net: 44.6 },
            valueBreakdown: {
              analyzePlacedCount: 6,
              analyzeAvailableData: 1,
              analyzeEnergyCost: 1,
              analyzeBestBlueTraceScore: 6,
              readyAnalyzeWindowValue: 7.95,
              analyzeLowEngineCatchupValue: 6.6,
              lowResourceReadyAnalyzeCashout: 1.4,
            },
          },
        ],
      },
    },
    {
      type: "turn-action",
      roundNumber: 3,
      turnNumber: 5,
      rawTurnNumber: 18,
      playerId: "player-green",
      playerLabel: "绿色",
      details: {
        action: { id: "end-turn", kind: "end-turn", score: -1, actionGraph: { net: -1 } },
        candidates: [],
      },
    },
    {
      type: "turn-action",
      roundNumber: 3,
      turnNumber: 6,
      rawTurnNumber: 21,
      playerId: "player-green",
      playerLabel: "绿色",
      details: {
        action: { id: "pass", kind: "pass", score: -2, actionGraph: { net: -2 } },
        candidates: [],
      },
    },
  ],
  playerResults: [{ playerId: "player-green", playerLabel: "绿色", finalScore: 212 }],
};
const analyzeLowResourceReadyCashoutNearMissAnalysis = analytics.analyzeBattleReport(analyzeLowResourceReadyCashoutNearMissReport);
assert.equal(analyzeLowResourceReadyCashoutNearMissAnalysis.opportunities.engineActionNearMiss, 1);
assert.equal(analyzeLowResourceReadyCashoutNearMissAnalysis.opportunities.analyzeLowResourceReadyCashoutNearMiss, 1);
assert.equal(
  analyzeLowResourceReadyCashoutNearMissAnalysis.analyzeLowResourceReadyCashoutNearMissSamples[0].target.valueBreakdown.lowResourceReadyAnalyzeCashout,
  1.4,
);
assert(
  analyzeLowResourceReadyCashoutNearMissAnalysis.recommendations.some(
    (entry) => entry.id === "classify-low-resource-ready-analyze-cashout",
  ),
);
const analyzeLowResourceReadyCashoutNearMissSummary = analytics.summarizeBattleReports([
  analyzeLowResourceReadyCashoutNearMissReport,
]);
assert.equal(analyzeLowResourceReadyCashoutNearMissSummary.opportunities.analyzeLowResourceReadyCashoutNearMiss, 1);
assert.equal(analyzeLowResourceReadyCashoutNearMissSummary.analyzeLowResourceReadyCashoutNearMissSamples[0].playerLabel, "绿色");

const finalReadyTaskCreditShortfallReport = {
  lastSummary: { ok: true, blocked: false, gameEnded: true, steps: 1 },
  logs: [],
  playerResults: [
    {
      playerId: "player-blue",
      playerLabel: "蓝色",
      finalScore: 227,
      baseScore: 143,
      cardScore: 17,
      resources: { score: 143, credits: 1, energy: 0, publicity: 3, availableData: 0, handSize: 3 },
      completedTaskCount: 5,
      techCount: 12,
      handSize: 3,
      handCards: [
        {
          id: "card-b117",
          cardId: "b_117.webp",
          label: "航天飞机",
          price: 3,
          typeCode: 2,
          taskCount: 1,
          remainingTaskCount: 1,
          tasks: [{
            id: "b117-orbit-land-count-task",
            completed: false,
            condition: { type: "orbitOrLandCount", targetCount: 5, currentCount: 6, missingCount: 0, met: true },
            rewardDirectScore: 3,
            rewardValue: 7.5,
          }],
          effectTypes: ["launch", "gain_resources"],
        },
        {
          id: "card-b12",
          cardId: "b_12.webp",
          label: "超环面仪器",
          price: 3,
          typeCode: 2,
          taskCount: 1,
          remainingTaskCount: 1,
          tasks: [{
            id: "b12-blue-trace-task",
            completed: false,
            condition: { type: "traceCount", targetCount: 3, currentCount: 5, missingCount: 0, met: true },
            rewardDirectScore: 3,
            rewardValue: 4.5,
          }],
          effectTypes: ["card_research_tech"],
        },
        { id: "card-b68", cardId: "b_68.webp", label: "洛弗尔望远锐", price: 3, typeCode: 2, taskCount: 0, effectTypes: [] },
      ],
      reservedCards: [],
    },
    {
      playerId: "player-white",
      playerLabel: "白色",
      finalScore: 228,
      resources: { score: 140, credits: 2, energy: 0, publicity: 1, availableData: 0, handSize: 3 },
      handSize: 3,
      handCards: [
        {
          id: "card-ready-recoverable",
          cardId: "b_135.webp",
          label: "韦断特v克综合孔径射电|远锐",
          price: 3,
          typeCode: 2,
          taskCount: 1,
          tasks: [{
            id: "b135-same-color-sectors-task",
            completed: true,
            condition: { type: "completedSameSectorColor", targetCount: 2, currentCount: 2, missingCount: 0, met: true },
            rewardDirectScore: 9,
            rewardValue: 9,
          }],
          effectTypes: ["card_research_tech"],
        },
        { id: "card-filler-1", cardId: "b_2.webp", label: "高级导航系统", price: 1, typeCode: 1, taskCount: 0 },
        { id: "card-filler-2", cardId: "dlc_28.png", label: "重组", price: 1, typeCode: 2, taskCount: 0 },
      ],
      reservedCards: [],
    },
  ],
};
const finalReadyTaskCreditShortfallAnalysis = analytics.analyzeBattleReport(finalReadyTaskCreditShortfallReport);
assert.equal(finalReadyTaskCreditShortfallAnalysis.opportunities.finalReadyTaskCreditShortfall, 1);
assert.equal(finalReadyTaskCreditShortfallAnalysis.finalReadyTaskCreditShortfallSamples[0].playerId, "player-blue");
assert.equal(finalReadyTaskCreditShortfallAnalysis.finalReadyTaskCreditShortfallSamples[0].cards.length, 2);
assert.equal(finalReadyTaskCreditShortfallAnalysis.finalReadyTaskCreditShortfallSamples[0].cards[0].cardId, "b_117.webp");
assert.equal(finalReadyTaskCreditShortfallAnalysis.finalReadyTaskCreditShortfallSamples[0].cards[0].creditsMissingAfterCardsForCredit, 1);
assert(finalReadyTaskCreditShortfallAnalysis.recommendations.some((entry) => entry.id === "inspect-final-ready-task-credit-shortfall"));
assert.equal(finalReadyTaskCreditShortfallAnalysis.opportunities.finalReadyTaskTradeUnlockMiss, 1);
assert.equal(finalReadyTaskCreditShortfallAnalysis.finalReadyTaskTradeUnlockMissSamples[0].playerId, "player-white");
assert.equal(finalReadyTaskCreditShortfallAnalysis.finalReadyTaskTradeUnlockMissSamples[0].cards[0].cardId, "b_135.webp");
assert.equal(finalReadyTaskCreditShortfallAnalysis.finalReadyTaskTradeUnlockMissSamples[0].cards[0].cardsForCreditTradesNeeded, 1);
assert(finalReadyTaskCreditShortfallAnalysis.recommendations.some((entry) => entry.id === "inspect-final-ready-task-trade-unlock"));
const finalReadyTaskCreditShortfallSummary = analytics.summarizeBattleReports([finalReadyTaskCreditShortfallReport]);
assert.equal(finalReadyTaskCreditShortfallSummary.finalReadyTaskCreditShortfallSamples[0].maxCreditsAfterCardsForCredit, 2);
assert.equal(finalReadyTaskCreditShortfallSummary.opportunities.finalReadyTaskCreditShortfall, 1);
assert.equal(finalReadyTaskCreditShortfallSummary.opportunities.finalReadyTaskTradeUnlockMiss, 1);
assert.equal(finalReadyTaskCreditShortfallSummary.finalReadyTaskTradeUnlockMissSamples[0].cards[0].readyTaskDirectScore, 9);

const b2ScanNearMissReport = {
  lastSummary: { ok: true, blocked: false, gameEnded: true, steps: 1 },
  logs: [{
    type: "turn-action",
    roundNumber: 4,
    turnNumber: 10,
    playerId: "player-white",
    playerLabel: "白色",
    playerResources: { score: 142, credits: 4, energy: 3, publicity: 2, handSize: 2 },
    details: {
      action: { id: "researchTech", kind: "main", score: 105.6, actionGraph: { net: 105.6 } },
      candidates: [
        { id: "researchTech", kind: "main", available: true, score: 105.6, actionGraph: { net: 105.6 } },
        {
          id: "scan",
          kind: "main",
          available: true,
          score: 54.5,
          directScoreGain: 2,
          scoreCapReason: "优先兑现数据分析",
          actionGraph: { net: 54.5 },
          targetPreview: {
            effectCount: 1,
            effects: [{
              effectType: "earth_sector_scan",
              pendingType: "sector_scan",
              topChoices: [{
                effectType: "earth_sector_scan",
                pendingType: "sector_scan",
                nebulaId: "sector-3-a",
                sectorX: 3,
                score: 22.7,
                directScoreGain: 2,
                b2: {
                  focus: 12.4,
                  active: true,
                  marked: true,
                  sectorWins: 2,
                  orbitLandCount: 8,
                  deficit: 6,
                  multiplier: 4,
                  ownCount: 1,
                  openCount: 1,
                  markedCount: 3,
                  maxOtherCount: 1,
                  winsAfterScan: true,
                },
              }],
            }],
            topChoices: [{
              effectType: "earth_sector_scan",
              pendingType: "sector_scan",
              nebulaId: "sector-3-a",
              sectorX: 3,
              score: 22.7,
              directScoreGain: 2,
              b2: {
                focus: 12.4,
                active: true,
                marked: true,
                sectorWins: 2,
                orbitLandCount: 8,
                deficit: 6,
                multiplier: 4,
                ownCount: 1,
                openCount: 1,
                markedCount: 3,
                maxOtherCount: 1,
                winsAfterScan: true,
              },
            }],
          },
        },
      ],
    },
  }],
  playerResults: [{
    playerId: "player-white",
    playerLabel: "白色",
    finalScore: 184,
    b2Progress: {
      formulaId: "b2",
      sectorWins: 2,
      orbitLandCount: 8,
      deficit: 6,
      bottleneck: "sectorWins",
    },
  }],
};
const b2ScanNearMissAnalysis = analytics.analyzeBattleReport(b2ScanNearMissReport);
assert.equal(b2ScanNearMissAnalysis.opportunities.b2ScanNearMiss, 1);
assert.equal(b2ScanNearMissAnalysis.b2ScanNearMissSamples[0].finalScore, 184);
assert.equal(b2ScanNearMissAnalysis.b2ScanNearMissSamples[0].selected.id, "researchTech");
assert.equal(b2ScanNearMissAnalysis.b2ScanNearMissSamples[0].scan.scoreCapReason, "优先兑现数据分析");
assert.equal(b2ScanNearMissAnalysis.b2ScanNearMissSamples[0].topChoices[0].targetRank, 1);
assert.equal(b2ScanNearMissAnalysis.b2ScanNearMissSamples[0].topChoices[0].b2.winsAfterScan, true);
assert.equal(b2ScanNearMissAnalysis.b2ScanNearMissSamples[0].bestB2Choice.nebulaId, "sector-3-a");
assert.equal(b2ScanNearMissAnalysis.b2ScanNearMissSamples[0].b2Progress.bottleneck, "sectorWins");
const b2ScanNearMissSummary = analytics.summarizeBattleReports([b2ScanNearMissReport]);
assert.equal(b2ScanNearMissSummary.b2ScanNearMissSamples[0].topChoices[0].nebulaId, "sector-3-a");

const b2TradeNearMissReport = {
  lastSummary: { ok: true, blocked: false, gameEnded: true, steps: 1 },
  logs: [{
    type: "turn-action",
    roundNumber: 4,
    turnNumber: 2,
    playerId: "player-brown",
    playerLabel: "棕色",
    playerResources: { score: 172, credits: 6, energy: 3, publicity: 1, handSize: 3 },
    details: {
      action: { id: "researchTech", kind: "main", score: 49.547, actionGraph: { net: 95.914 } },
      candidates: [
        { id: "researchTech", kind: "main", available: true, score: 49.547, actionGraph: { net: 95.914 } },
        {
          id: "quickTrade",
          kind: "quick",
          available: true,
          tradeId: "credits-for-energy",
          label: "2信用点 -> 1能量",
          reason: "B2兑现：信用点换能量准备完成扇区",
          score: 48.51,
          actionGraph: { net: 51.421 },
          valueBreakdown: {
            lateResourceRecoveryTrade: true,
            b2SectorScanUnlockByTrade: { "credits-for-energy": 24.5 },
            highScoreProjectedScore: 249,
            currentScore: 172,
          },
        },
      ],
    },
  }],
  playerResults: [{
    playerId: "player-brown",
    playerLabel: "棕色",
    finalScore: 299,
    b2Progress: {
      formulaId: "b2",
      sectorWins: 6,
      orbitLandCount: 7,
      sectorWinDeficit: 1,
      bottleneck: "sectorWins",
    },
  }],
};
const b2TradeNearMissAnalysis = analytics.analyzeBattleReport(b2TradeNearMissReport);
assert.equal(b2TradeNearMissAnalysis.opportunities.b2TradeNearMiss, 1);
assert.equal(b2TradeNearMissAnalysis.b2TradeNearMissSamples[0].playerId, "player-brown");
assert.equal(b2TradeNearMissAnalysis.b2TradeNearMissSamples[0].scoreTo300, 1);
assert.equal(b2TradeNearMissAnalysis.b2TradeNearMissSamples[0].selected.id, "researchTech");
assert.equal(b2TradeNearMissAnalysis.b2TradeNearMissSamples[0].bestTrade.tradeId, "credits-for-energy");
assert.equal(b2TradeNearMissAnalysis.b2TradeNearMissSamples[0].actionGraphNetGap, 44.493);
assert.ok(b2TradeNearMissAnalysis.recommendations.some((entry) => entry.id === "inspect-b2-trade-near-miss"));
const b2TradeNearMissSummary = analytics.summarizeBattleReports([b2TradeNearMissReport]);
assert.equal(b2TradeNearMissSummary.b2TradeNearMissSamples[0].bestTrade.tradeId, "credits-for-energy");
assert.ok(b2TradeNearMissSummary.recommendations.some((entry) => entry.id === "inspect-b2-trade-near-miss"));

const mainUnlockLowConcretePlayReport = {
  lastSummary: { ok: true, blocked: false, gameEnded: true, steps: 1 },
  logs: [{
    type: "turn-action",
    roundNumber: 4,
    turnNumber: 7,
    playerId: "player-white",
    playerLabel: "白色",
    playerResources: { score: 139, credits: 2, energy: 1, publicity: 1, handSize: 3 },
    details: {
      action: {
        id: "quickTrade",
        kind: "quick",
        tradeId: "cards-for-credit",
        score: 15.975,
        reason: "主行动前：交易信用点解锁高价值打牌",
        valueBreakdown: {
          mainUnlockTrade: true,
          bestPlayCard: {
            handIndex: 0,
            cardId: "b_135.webp",
            cardLabel: "韦断特v克综合孔径射电|远锐",
            score: 22.121,
            continuationValue: 22.121,
            directScoreGain: 0,
            finalDeltaValue: 0,
            c2Type3ProgressValue: 0,
            cFinalTaskProgressValue: 0,
            endGameExpectedScore: 0,
          },
          currentBestPlayScore: 4.92,
          concreteFinalValue: 18.675,
          discardCost: 3,
          finalMarkCount: 3,
          nextFinalMarkThreshold: null,
          thresholdBonus: 0,
          finalLowTailOneCreditUnlock: true,
          finalHighScoreOneCreditUnlock: false,
          highScoreProjectedScore: 194,
        },
      },
      candidates: [],
    },
  }],
  playerResults: [{ playerId: "player-white", playerLabel: "白色", finalScore: 187 }],
};
const mainUnlockLowConcretePlayAnalysis = analytics.analyzeBattleReport(mainUnlockLowConcretePlayReport);
assert.equal(mainUnlockLowConcretePlayAnalysis.opportunities.mainUnlockLowConcretePlay, 1);
assert.equal(mainUnlockLowConcretePlayAnalysis.mainUnlockLowConcretePlaySamples[0].bestPlayCard.cardId, "b_135.webp");
assert.equal(mainUnlockLowConcretePlayAnalysis.mainUnlockLowConcretePlaySamples[0].concreteFinalValue, 18.675);
const mainUnlockLowConcretePlaySummary = analytics.summarizeBattleReports([mainUnlockLowConcretePlayReport]);
assert.equal(mainUnlockLowConcretePlaySummary.mainUnlockLowConcretePlaySamples[0].bestPlayCard.cardId, "b_135.webp");

const actionGraphAlignedAnalysis = analytics.analyzeBattleReport({
  lastSummary: { ok: true, blocked: false, gameEnded: true, steps: 1 },
  logs: [{
    type: "turn-action",
    playerId: "player-white",
    details: {
      action: { id: "launch", kind: "main", actionGraph: { net: 9 } },
      candidates: [
        { id: "launch", kind: "main", available: true, score: 1, actionGraph: { net: 9 } },
        { id: "playCard", kind: "main", available: true, score: 20, actionGraph: { net: 4 } },
      ],
    },
  }],
  bugs: [],
  playerResults: [{ playerId: "player-white", playerLabel: "白色", finalScore: 1 }],
});
assert.equal(actionGraphAlignedAnalysis.opportunities.selectedBelowBestScore, 0);
assert.equal(actionGraphAlignedAnalysis.candidateScoreStats.launch.selected, 1);
assert.equal(actionGraphAlignedAnalysis.candidateScoreStats.playCard.missedAsBest, 0);

const compactActionGraphAlignedAnalysis = analytics.analyzeBattleReport({
  lastSummary: { ok: true, blocked: false, gameEnded: true, steps: 1 },
  logs: [{
    type: "turn-action",
    playerId: "player-white",
    details: {
      action: { id: "pass", score: -2.7, breakdown: { net: -2.7 } },
      candidates: [
        { id: "pass", available: true, score: -2.7, breakdown: { net: -2.7 } },
        { id: "launch", available: true, score: -5.58, breakdown: { net: -5.58 } },
      ],
    },
  }],
  bugs: [],
  playerResults: [{ playerId: "player-white", playerLabel: "白色", finalScore: 1 }],
});
assert.equal(
  compactActionGraphAlignedAnalysis.opportunities.selectedBelowBestScore,
  0,
  "compact action-graph scores must not receive policy action bias twice",
);
assert.equal(compactActionGraphAlignedAnalysis.candidateScoreStats.pass.averageSelectedScore, -2.7);
assert.equal(compactActionGraphAlignedAnalysis.candidateScoreStats.launch.missedAsBest, 0);

const compactDuplicateActionAnalysis = analytics.analyzeBattleReport({
  lastSummary: { ok: true, blocked: false, gameEnded: true, steps: 1 },
  logs: [{
    type: "turn-action",
    playerId: "player-blue",
    details: {
      action: { id: "move", score: 16.966 },
      candidates: [
        { id: "playCard", available: true, score: 11.999 },
        { id: "move", available: true, score: 16.966 },
        { id: "move", available: true, score: 4.615 },
      ],
    },
  }],
  bugs: [],
  playerResults: [{ playerId: "player-blue", playerLabel: "蓝色", finalScore: 227 }],
});
assert.equal(compactDuplicateActionAnalysis.opportunities.selectedBelowBestScore, 1);
assert.equal(compactDuplicateActionAnalysis.scoreOpportunities.totalGap, 0.033);
assert.equal(compactDuplicateActionAnalysis.candidateScoreStats.move.averageSelectedScore, 16.966);

const quickTradeIdentityAnalysis = analytics.analyzeBattleReport({
  lastSummary: { ok: true, blocked: false, gameEnded: true, steps: 1 },
  logs: [{
    type: "turn-action",
    playerId: "player-green",
    details: {
      action: {
        id: "quickTrade",
        kind: "quick",
        available: true,
        tradeId: "cards-for-energy",
        score: 20,
      },
      candidates: [
        {
          id: "quickTrade",
          kind: "quick",
          available: false,
          tradeId: "cards-for-credit",
          score: 26,
        },
        {
          id: "quickTrade",
          kind: "quick",
          available: true,
          tradeId: "cards-for-energy",
          score: 20,
        },
      ],
    },
  }],
  bugs: [],
  playerResults: [{ playerId: "player-green", playerLabel: "绿色", finalScore: 100 }],
});
assert.equal(
  quickTradeIdentityAnalysis.opportunities.selectedUnavailableCandidate,
  0,
  "a selected quick trade must not match an unavailable candidate with another tradeId",
);
assert.equal(quickTradeIdentityAnalysis.candidateStats.quickTrade.selected, 1);

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

const negativeThirdFinalMarkReport = {
  logs: [{
    type: "final-score-mark",
    roundNumber: 3,
    turnNumber: 1,
    playerId: "player-white",
    playerLabel: "白色",
    playerResources: { score: 72, credits: 5, energy: 4, publicity: 5, handSize: 2 },
    details: {
      pending: { threshold: 70 },
      selected: {
        tileId: "b",
        formulaId: "b2",
        threshold: 70,
        baseValue: 0,
        multiplier: 4,
        immediateScore: 0,
        score: -23.26,
        scoreBreakdown: {
          zeroBaseLatePenalty: 8.32,
          b2FeasibilityPenalty: 13.39,
          b2OrbitLandCount: 4,
          b2SectorWins: 0,
        },
      },
      candidates: [
        {
          tileId: "b",
          formulaId: "b2",
          available: true,
          threshold: 70,
          baseValue: 0,
          multiplier: 4,
          immediateScore: 0,
          score: -23.26,
          scoreBreakdown: {
            zeroBaseLatePenalty: 8.32,
            b2FeasibilityPenalty: 13.39,
            b2OrbitLandCount: 4,
            b2SectorWins: 0,
          },
        },
        {
          tileId: "c",
          formulaId: "c1",
          available: true,
          threshold: 70,
          baseValue: 0,
          multiplier: 2,
          immediateScore: 0,
          score: -55.85,
          scoreBreakdown: {
            zeroBaseLatePenalty: 8.24,
            weakCFormulaPenalty: 26,
          },
        },
      ],
    },
  }],
  playerResults: [{ playerId: "player-white", playerLabel: "白色", finalScore: 185 }],
};
const negativeThirdFinalMarkAnalysis = analytics.analyzeBattleReport(negativeThirdFinalMarkReport);
assert.equal(negativeThirdFinalMarkAnalysis.opportunities.negativeThirdFinalMark, 1);
assert.equal(negativeThirdFinalMarkAnalysis.negativeThirdFinalMarkSamples[0].selected.formulaId, "b2");
assert.equal(negativeThirdFinalMarkAnalysis.negativeThirdFinalMarkSamples[0].selected.b2FeasibilityPenalty, 13.39);
assert.equal(negativeThirdFinalMarkAnalysis.negativeThirdFinalMarkSamples[0].candidates[1].weakCFormulaPenalty, 26);
const negativeThirdFinalMarkSummary = analytics.summarizeBattleReports([negativeThirdFinalMarkReport]);
assert.equal(negativeThirdFinalMarkSummary.negativeThirdFinalMarkSamples[0].selected.tileId, "b");

const sequenceLogs = Array.from({ length: 7 }, (_item, index) => ({
  type: "turn-action",
  roundNumber: 1,
  turnNumber: index + 1,
  playerId: "player-white",
  playerLabel: "白色",
  details: {
    action: {
      id: index % 2 === 0 ? "launch" : "scan",
      kind: "main",
      plan: index === 1 ? { type: "main-then-quick", mainActionId: "scan", quickActionId: "move" } : null,
    },
    candidates: [],
  },
}));
sequenceLogs.splice(2, 0, {
  type: "scan-target",
  roundNumber: 1,
  turnNumber: 2,
  playerId: "player-white",
  playerLabel: "白色",
  details: { pendingType: "sector_scan", nebulaId: "sector-1-a" },
});
sequenceLogs.splice(3, 0, {
  type: "alien-use",
  roundNumber: 1,
  turnNumber: 2,
  playerId: "player-white",
  playerLabel: "白色",
  details: { pendingType: "runezu-card", selected: { choice: "displayed" } },
});
sequenceLogs.splice(4, 0, {
  type: "data-placement",
  roundNumber: 1,
  turnNumber: 2,
  playerId: "player-white",
  playerLabel: "白色",
  details: { selected: { target: "computer", placementSlot: 6 } },
});
const sequenceReport = {
  logs: sequenceLogs,
  playerResults: [
    { playerId: "player-white", playerLabel: "白色", finalScore: 35, tileScore: 10, completedTaskCount: 3, techCount: 4, cardScore: 6 },
    { playerId: "player-blue", playerLabel: "蓝色", finalScore: 20, tileScore: 0, completedTaskCount: 0, techCount: 1, cardScore: 0 },
  ],
};
const sequenceAnalysisDefault = analytics.analyzeBattleReport(sequenceReport);
const whiteDefaultSequence = sequenceAnalysisDefault.actionSequences.playerSequences.find((entry) => entry.playerId === "player-white");
assert.equal(sequenceAnalysisDefault.sequenceWindowTurns, 6);
assert.equal(whiteDefaultSequence.turnCount, 7);
assert.equal(whiteDefaultSequence.mainActionTokens.length, 6);
assert.ok(whiteDefaultSequence.tokens.some((token) => token.includes("scan-target|sector_scan:sector-1-a")));
assert.ok(whiteDefaultSequence.tokens.some((token) => token.includes("alien-use|runezu-card:displayed")));
assert.ok(whiteDefaultSequence.tokens.some((token) => token.includes("data-placement|computer:6")));
assert.ok(sequenceAnalysisDefault.actionSequences.winnerTopSequences.length > 0);
assert.equal(sequenceAnalysisDefault.scoreBuckets.highTotalScore[0].playerId, "player-white");
assert.equal(sequenceAnalysisDefault.scoreBuckets.highTileScore[0].playerId, "player-white");
const sequenceAnalysisEight = analytics.analyzeBattleReport(sequenceReport, { sequenceWindowTurns: 8 });
const whiteEightSequence = sequenceAnalysisEight.actionSequences.playerSequences.find((entry) => entry.playerId === "player-white");
assert.equal(sequenceAnalysisEight.sequenceWindowTurns, 8);
assert.equal(whiteEightSequence.mainActionTokens.length, 7);
const sequenceAnalysisAll = analytics.analyzeBattleReport(sequenceReport, { sequenceWindowTurns: "all" });
assert.equal(sequenceAnalysisAll.sequenceWindowTurns, "all");
assert.equal(sequenceAnalysisAll.actionSequences.playerSequences.find((entry) => entry.playerId === "player-white").mainActionTokens.length, 7);
const sequenceSummary = analytics.summarizeBattleReports([sequenceReport], { sequenceWindowTurns: 8 });
assert.equal(sequenceSummary.actionSequences.windowTurns, 8);
assert.ok(sequenceSummary.winnerTopSequences.length > 0);
assert.equal(sequenceSummary.scoreBuckets.highTechScore[0].playerId, "player-white");

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
assert.equal(battleSummary.incompleteGames, 1);
assert.equal(battleSummary.bugCount, 1);
assert.equal(battleSummary.averagePlayerScore, 24.333);
assert.equal(battleSummary.averageMinimumPlayerScore, 24.5);
assert.equal(battleSummary.p25PlayerScore, 19);
assert.equal(battleSummary.playersAtLeast270, 0);
assert.equal(battleSummary.gamesWinnerAtLeast270, 0);
assert.equal(battleSummary.maxScore, 30);
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
      incompleteGames: 0,
      bugCount: 0,
      completionRate: 1,
      averageWinnerScore: 30,
      averagePlayerScore: 25,
      averageMinimumPlayerScore: 20,
      p25PlayerScore: 22,
      playersAtLeast270: 1,
      gamesWinnerAtLeast270: 1,
      maxScore: 280,
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
      incompleteGames: 0,
      bugCount: 0,
      completionRate: 1,
      averageWinnerScore: 34,
      averagePlayerScore: 30,
      averageMinimumPlayerScore: 23,
      p25PlayerScore: 24,
      playersAtLeast270: 2,
      gamesWinnerAtLeast270: 2,
      maxScore: 290,
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
assert.equal(comparison.deltas.averagePlayerScore, 5);
assert.equal(comparison.deltas.averageMinimumPlayerScore, 3);
assert.equal(comparison.deltas.p25PlayerScore, 2);
assert.equal(comparison.deltas.playersAtLeast270, 1);
assert.equal(comparison.deltas.gamesWinnerAtLeast270, 1);
assert.equal(comparison.deltas.maxScore, 10);
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
assert.equal(comparison.verdict.metricsComplete, true);
assert.equal(comparison.verdict.allSeatMeanImproved, true);
assert.equal(comparison.verdict.lowTailPreserved, true);
assert.equal(comparison.verdict.highScorePreserved, true);
assert.equal(comparison.verdict.reliabilityPreserved, true);

const winnerOnlyImprovementComparison = analytics.compareStrategyBatchResults(
  {
    summary: {
      gameCount: 2,
      completedGames: 2,
      blockedGames: 0,
      incompleteGames: 0,
      bugCount: 0,
      completionRate: 1,
      averageWinnerScore: 300,
      averagePlayerScore: 240,
      averageMinimumPlayerScore: 190,
      p25PlayerScore: 210,
      playersAtLeast270: 2,
      gamesWinnerAtLeast270: 2,
      maxScore: 310,
    },
  },
  {
    summary: {
      gameCount: 2,
      completedGames: 2,
      blockedGames: 0,
      incompleteGames: 0,
      bugCount: 0,
      completionRate: 1,
      averageWinnerScore: 310,
      averagePlayerScore: 230,
      averageMinimumPlayerScore: 175,
      p25PlayerScore: 190,
      playersAtLeast270: 2,
      gamesWinnerAtLeast270: 2,
      maxScore: 320,
    },
  },
);
assert.equal(winnerOnlyImprovementComparison.verdict.improved, false);
assert.equal(winnerOnlyImprovementComparison.verdict.allSeatMeanImproved, false);
assert.equal(winnerOnlyImprovementComparison.verdict.lowTailPreserved, false);

const highScoreRegressionComparison = analytics.compareStrategyBatchResults(
  {
    summary: {
      gameCount: 2,
      completedGames: 2,
      blockedGames: 0,
      incompleteGames: 0,
      bugCount: 0,
      completionRate: 1,
      averageWinnerScore: 280,
      averagePlayerScore: 220,
      averageMinimumPlayerScore: 180,
      p25PlayerScore: 195,
      playersAtLeast270: 3,
      gamesWinnerAtLeast270: 2,
      maxScore: 290,
    },
  },
  {
    summary: {
      gameCount: 2,
      completedGames: 2,
      blockedGames: 0,
      incompleteGames: 0,
      bugCount: 0,
      completionRate: 1,
      averageWinnerScore: 282,
      averagePlayerScore: 225,
      averageMinimumPlayerScore: 185,
      p25PlayerScore: 200,
      playersAtLeast270: 2,
      gamesWinnerAtLeast270: 1,
      maxScore: 295,
    },
  },
);
assert.equal(highScoreRegressionComparison.verdict.improved, false);
assert.equal(highScoreRegressionComparison.verdict.highScorePreserved, false);

const reliabilityRegressionComparison = analytics.compareStrategyBatchResults(
  {
    summary: {
      gameCount: 2,
      completedGames: 2,
      blockedGames: 0,
      incompleteGames: 0,
      bugCount: 0,
      completionRate: 1,
      averageWinnerScore: 280,
      averagePlayerScore: 220,
      averageMinimumPlayerScore: 180,
      p25PlayerScore: 195,
      playersAtLeast270: 2,
      gamesWinnerAtLeast270: 2,
      maxScore: 290,
    },
  },
  {
    summary: {
      gameCount: 2,
      completedGames: 2,
      blockedGames: 0,
      incompleteGames: 0,
      bugCount: 1,
      completionRate: 1,
      averageWinnerScore: 282,
      averagePlayerScore: 225,
      averageMinimumPlayerScore: 185,
      p25PlayerScore: 200,
      playersAtLeast270: 2,
      gamesWinnerAtLeast270: 2,
      maxScore: 295,
    },
  },
);
assert.equal(reliabilityRegressionComparison.verdict.improved, false);
assert.equal(reliabilityRegressionComparison.verdict.reliabilityPreserved, false);
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
      incompleteGames: 0,
      bugCount: 0,
      completionRate: 1,
      averageWinnerScore: 34,
      averagePlayerScore: 29,
      averageMinimumPlayerScore: 22,
      p25PlayerScore: 24,
      playersAtLeast270: 0,
      gamesWinnerAtLeast270: 0,
      maxScore: 34,
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
      incompleteGames: 0,
      bugCount: 0,
      completionRate: 1,
      averageWinnerScore: 30,
      averagePlayerScore: 28,
      averageMinimumPlayerScore: 21,
      p25PlayerScore: 23,
      playersAtLeast270: 0,
      gamesWinnerAtLeast270: 0,
      maxScore: 30,
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
