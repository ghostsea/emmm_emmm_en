"use strict";

const assert = require("node:assert/strict");
const { createAiController } = require("./ai-controller");

function createAiControllerHarness(pendingPlayerColor) {
  const white = {
    id: "player-white",
    color: "white",
    colorLabel: "White",
    resources: {},
  };
  const blue = {
    id: "player-blue",
    color: "blue",
    colorLabel: "Blue",
    resources: {},
  };
  const allPlayers = [white, blue];
  const playerState = {
    players: allPlayers,
    currentPlayerId: white.id,
  };
  const turnState = {
    activePlayerIds: allPlayers.map((player) => player.id),
    turnOrderPlayerIds: allPlayers.map((player) => player.id),
    activePlayerCount: allPlayers.length,
    roundNumber: 1,
    turnNumber: 1,
    startPlayerId: white.id,
  };
  let pendingJiuzheCardPlay = pendingPlayerColor
    ? {
      playerColor: pendingPlayerColor,
      reason: "reveal",
      cost: {},
      label: "Jiuzhe reveal",
    }
    : null;
  let handled = null;

  const state = {
    get pendingJiuzheCardPlay() { return pendingJiuzheCardPlay; },
    get pendingActionExecuted() { return false; },
    get pendingActionEffectFlow() { return null; },
  };

  const context = {
    window: { setTimeout: () => 1, localStorage: null },
    state,
    players: {
      PLAYER_COLOR_IDS: allPlayers.map((player) => player.color),
      canAfford: () => true,
    },
    ai: { policy: {} },
    cardEffects: { EFFECT_TYPES: { RESEARCH_TECH: "card_research_tech" } },
    tech: {},
    playerState,
    turnState,
    rocketState: {},
    solarState: {},
    nebulaDataState: {},
    alienGameState: {},
    finalScoringState: {},
    planetStatsState: {},
    techGameState: { ui: {} },
    cardState: {},
    cardTaskState: {},
    historyStepOrder: {},
    els: { scanTargetActions: { querySelectorAll: () => [] } },
    DEFAULT_ACTIVE_PLAYER_COUNT: allPlayers.length,
    DEFAULT_INITIAL_HAND_COUNT: 5,
    DEFAULT_INITIAL_PLAYER_COLOR: "white",
    FINAL_ROUND_NUMBER: 5,
    FINAL_SCORE_IDS: [],
    INITIAL_SELECTION_REQUIRED: { initial: 0 },
    MOVE_ENERGY_COST: 1,
    createActionContext: () => ({}),
    createTurnState: () => ({}),
    computePlayerFinalScoreBreakdown: () => ({}),
    formatRocketLabel: () => "",
    getActivePlayers: () => allPlayers,
    getAlienTraceActionPlayer: () => null,
    getCardPlayCost: () => ({}),
    getCardPrice: () => ({}),
    getCardTypeCode: () => 1,
    getCurrentActionEffect: () => null,
    getCurrentPlayer: () => white,
    getEarthSectorCoordinate: () => ({ x: 1, y: 1 }),
    getEffectOwnerPlayer: () => null,
    getInitialSelectionOffer: () => null,
    getPendingPlayCardSelection: () => null,
    getPlanetSectorCoordinate: () => ({ x: 1, y: 1 }),
    getPlayerByColor: (color) => allPlayers.find((player) => player.color === color) || null,
    getPlayerById: (id) => allPlayers.find((player) => player.id === id) || null,
    getPlayerLabelById: (id) => allPlayers.find((player) => player.id === id)?.colorLabel || id,
    getRequiredMovePointsForUi: () => 1,
    getSectorContentForMove: () => null,
    handleJiuzheCardChoice: (choice) => {
      handled = { type: "card", choice };
      return { ok: true, progressed: true };
    },
    handleJiuzheOpportunitySkip: () => {
      handled = { type: "skip" };
      pendingJiuzheCardPlay = null;
      return { ok: true, progressed: true };
    },
    hasActivePendingSubFlow: () => Boolean(pendingJiuzheCardPlay),
  };

  const noopNames = [
    "allowsBlindDrawInSelection",
    "analyzeDataForCurrentPlayer",
    "beginPlayCardSelection",
    "beginScanAction",
    "cancelTechSelection",
    "clearTransientStateForRecovery",
    "confirmCardTaskCompletion",
    "confirmCardCornerQuickAction",
    "confirmDataPlacement",
    "confirmInitialSelectionForCurrentPlayer",
    "confirmLandTargetPicker",
    "confirmMovePayment",
    "confirmPassReserveSelection",
    "confirmPlayCardSelection",
    "confirmPublicScanSelection",
    "confirmScanTarget",
    "confirmStrategyPassiveSlotChoice",
    "confirmTechBlueSlotChoice",
    "drawCardForCurrentPlayer",
    "endCurrentTurn",
    "executeActionEffect",
    "executeCardMoveForEffect",
    "executeFreeMoveForCardCorner",
    "executeFreeMoveForCardTrigger",
    "executeFreeMoveForScanAction4",
    "executeIndustryFreeMove",
    "finalizePendingDiscardSelection",
    "finishIndustryAbilityFlow",
    "handleAmibaCardGainChoice",
    "handleAmibaSymbolChoice",
    "handleAmibaTraceRemovalChoice",
    "handleAomomoCardGainChoice",
    "handleBanrenmaBonusChoice",
    "handleBanrenmaCardConditionChoice",
    "handleBanrenmaCardGainChoice",
    "handleCardTriggerChoice",
    "handleChongCardGainChoice",
    "handleChongFossilChoice",
    "handleChongTaskCompletionChoice",
    "handleConditionalSectorChoice",
    "handleCompanyActionMarkerClick",
    "handleHandCardCornerQuickAction",
    "handleHandScanCardClick",
    "handleOptionalHandScanChoice",
    "handlePlayCardSelect",
    "handlePublicCardClick",
    "handlePublicScanCardClick",
    "handleIndustryDeepspaceHandClick",
    "handleRunezuCardGainChoice",
    "handleRunezuFaceSymbolChoice",
    "handleRunezuSymbolBranchChoice",
    "handleScanAction4Choice",
    "handleSupplyTechTileClick",
    "handleYichangdianCardGainChoice",
    "handleYichangdianCornerChoice",
    "initializeCardGame",
    "landForCurrentPlayer",
    "moveRocket",
    "orbitForCurrentPlayer",
    "openCardTaskCompletionPicker",
    "passForCurrentPlayer",
    "pickPublicCardForCurrentPlayer",
    "randomizeAll",
    "renderStateReadout",
    "researchTechForCurrentPlayer",
    "resetActionLog",
    "resetScanRunSequence",
    "restoreMutableObject",
    "runAction",
    "runPlaceDataToComputer",
    "runQuickTrade",
    "runAiFinalScoreMarkDecision",
    "selectPassReserveCard",
    "setTurnStatePlayerOrder",
    "skipCurrentActionEffect",
    "startInitialSelection",
    "updateActionButtons",
  ];
  for (const name of noopNames) context[name] = () => null;

  const falseNames = [
    "canBlindDraw",
    "canPayForMove",
    "canStartMainAction",
    "isActionEffectFlowActive",
    "isAsteroidContent",
    "isCardSelectionActive",
    "isDiscardSelectionActive",
    "isGameEnded",
    "isHandScanSelectionActive",
    "isIndustryHandSelectionActive",
    "isInitialSelectionActive",
    "isMovePaymentCard",
    "isMovePaymentSelectionActive",
    "isPlayCardSelectionActive",
    "isPublicScanMultiSelectActive",
    "isTechTileOwnedByOtherPlayer",
    "isTechTilePickingActive",
    "sectorXHasAvailableScanTarget",
  ];
  for (const name of falseNames) context[name] = () => false;

  const emptyArrayNames = [
    "buildSectorScanChoicesForX",
    "buildSectorScanChoicesForXs",
    "getMovableTokensForPlayer",
    "getPassReserveSelectionCards",
    "getPublicScanChoicesForCard",
    "getReadyCardTasks",
    "getResearchTechSelectionOptions",
    "getSectorXsMatchingCondition",
  ];
  for (const name of emptyArrayNames) context[name] = () => [];

  return {
    blue,
    controller: createAiController(context),
    getHandled: () => handled,
  };
}

{
  const harness = createAiControllerHarness("blue");
  assert.equal(
    harness.controller.configureAiAutoBattle({
      playerIds: [harness.blue.id],
      suppressAutoSchedule: true,
    }).ok,
    true,
  );

  const result = harness.controller.runAiAutomationStep();
  assert.equal(result.ok, true, "color-owned Jiuzhe pending should be handled by that AI player");
  assert.deepEqual(harness.getHandled(), { type: "skip" });
}

{
  const harness = createAiControllerHarness("white");
  assert.equal(
    harness.controller.configureAiAutoBattle({
      playerIds: [harness.blue.id],
      suppressAutoSchedule: true,
    }).ok,
    true,
  );

  const result = harness.controller.runAiAutomationStep();
  assert.equal(result.blocked, true, "human-owned Jiuzhe pending should not be handled by AI");
  assert.equal(harness.getHandled(), null);
}

console.log("app/ai-controller.test.js ok");
