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
}), [2]);
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
}), [2, 0]);
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
