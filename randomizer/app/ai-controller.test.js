"use strict";

const assert = require("node:assert/strict");
const { createAiController } = require("./ai-controller");
const banrenma = require("../game/aliens/banrenma");
const chong = require("../game/aliens/chong");
const fangzhou = require("../game/aliens/fangzhou");
const runezu = require("../game/aliens/runezu");
const yichangdian = require("../game/aliens/yichangdian");
const alienCore = require("../game/aliens");

function datasetKeyForSelector(selector) {
  const match = String(selector || "").match(/\[data-([a-z0-9-]+)\]/i);
  if (!match) return null;
  return match[1].replace(/-([a-z0-9])/g, (_all, char) => char.toUpperCase());
}

function makeButton(dataset = {}, textContent = "", disabled = false, onClick = null, className = "scan-target-option-button is-placeable") {
  const button = {
    dataset,
    textContent,
    disabled,
    className,
    matches: (selector) => String(selector || "").split(",").some((part) => {
      const item = part.trim();
      const key = datasetKeyForSelector(item);
      const dataMatches = !key || Object.prototype.hasOwnProperty.call(dataset || {}, key);
      const classMatches = (item.match(/\.[a-z0-9_-]+/gi) || [])
        .every((classToken) => String(button.className || "").split(/\s+/).includes(classToken.slice(1)));
      return dataMatches && classMatches;
    }),
  };
  button.click = () => {
    if (typeof onClick === "function") onClick(button);
  };
  return button;
}

function makeActionList(buttons = []) {
  return {
    querySelectorAll: (selector) => {
      if (selector === ".scan-target-option-button") return buttons;
      const key = datasetKeyForSelector(selector);
      if (!key) return [];
      return buttons.filter((button) => Object.prototype.hasOwnProperty.call(button.dataset || {}, key));
    },
  };
}

function createAiControllerHarness(pendingPlayerColor, options = {}) {
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
    hand: options.blueHand || [],
    reservedCards: [],
    resources: { credits: 5, energy: 5, ...(options.blueResources || {}) },
    income: { ...(options.blueIncome || {}) },
    companyBaseIncome: options.blueCompanyBaseIncome || null,
    techState: options.blueTechState || { ownedTiles: { ...(options.blueOwnedTechTiles || {}) } },
    techCounts: { ...(options.blueTechCounts || {}) },
    runezuSymbols: options.blueRunezuSymbols || {},
  };
  const allPlayers = [white, blue];
  const currentPlayer = options.currentPlayerColor === "blue" ? blue : white;
  const playerState = {
    players: allPlayers,
    currentPlayerId: currentPlayer.id,
  };
  const turnState = {
    activePlayerIds: allPlayers.map((player) => player.id),
    turnOrderPlayerIds: allPlayers.map((player) => player.id),
    activePlayerCount: allPlayers.length,
    roundNumber: options.roundNumber || 1,
    turnNumber: options.turnNumber || 1,
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
  let pendingPassReserveSelection = options.pendingPassReserveSelection || null;
  const pendingDiscardAction = options.pendingDiscardAction
    || (options.currentPlayerDiscardPending
      ? {
        player: white,
        selectedIndexes: [],
        type: options.pendingDiscardType || null,
      }
      : null);
  let handled = null;
  const handledEvents = [];
  const scheduledTimers = [];
  const noteHandled = (event) => {
    handled = event;
    handledEvents.push(event);
  };
  const takeableTechIds = options.takeableTechIds || [];
  const techStacks = options.techStacks || {};
  const inferTechType = (tileId) => {
    const id = String(tileId || "");
    if (id.startsWith("orange")) return "orange";
    if (id.startsWith("purple")) return "purple";
    if (id.startsWith("blue")) return "blue";
    return null;
  };
  const getTechStack = (tileId) => {
    const stack = techStacks[tileId] || {};
    return {
      techType: stack.techType || inferTechType(tileId),
      bonusId: stack.bonusId || null,
      firstTakeClaimedBy: stack.firstTakeClaimedBy ?? null,
      remaining: stack.remaining ?? 1,
      stackIndex: stack.stackIndex || null,
    };
  };
  const quickTradeActions = options.quickTrades || (options.enableQuickTrades ? {
    "cards-for-credit": {
      id: "cards-for-credit",
      label: "2 cards -> 1 credit",
      cost: { handSize: 2 },
      gain: { credits: 1 },
    },
  } : null);
  const canAffordResources = (player, cost = {}) => Object.entries(cost || {}).every(([key, value]) => {
    const required = Math.max(0, Number(value || 0));
    if (required <= 0) return true;
    if (key === "handSize") {
      const handSize = Number(player?.resources?.handSize ?? (player?.hand || []).length);
      return handSize >= required;
    }
    return Number(player?.resources?.[key] || 0) >= required;
  });

  const state = {
    get pendingJiuzheCardPlay() { return pendingJiuzheCardPlay; },
    get pendingAlienTraceAction() { return options.pendingAlienTraceAction || null; },
    get pendingScanTargetAction() { return options.scanTargetPending || null; },
    get pendingProbeSectorScanAction() { return options.probeSectorPending || null; },
    get pendingProbeLocationRewardAction() { return options.probeLocationPending || null; },
    get pendingLandTargetAction() { return options.landTargetPending || null; },
    get pendingDataPlaceAction() { return options.dataPlacePending || null; },
    get pendingDiscardAction() { return pendingDiscardAction; },
    get pendingPassReserveSelection() { return pendingPassReserveSelection; },
    get pendingMovePayment() { return options.pendingMovePayment || null; },
    get pendingActionExecuted() { return Boolean(options.pendingActionExecuted); },
    get pendingActionEffectFlow() { return options.pendingActionEffectFlow || null; },
    get pendingRunezuFaceSymbolPlacement() { return null; },
    alienTracePickerState: options.alienTracePickerState || null,
  };
  const alienGameState = options.alienGameState || (
    options.runezuQuick
      ? {
      aliens: {
        1: { revealed: true, alienId: runezu.ALIEN_ID, assignedAlienId: runezu.ALIEN_ID },
      },
      runezu: runezu.createRunezuState(),
    }
      : {}
  );
  if (options.runezuQuick && options.runezuFaceSymbolSlots) {
    const runezuState = runezu.ensureRunezuState(alienGameState);
    for (const [position, symbolId] of Object.entries(options.runezuFaceSymbolSlots)) {
      runezuState.faceSymbolSlots[position] = {
        position: Number(position),
        symbolId,
        playerId: blue.id,
        playerColor: blue.color,
        placedAt: 1,
      };
    }
  }

  const context = {
    window: {
      setTimeout: (callback, delay) => {
        const entry = { callback, delay };
        scheduledTimers.push(entry);
        if (typeof options.onSetTimeout === "function") {
          options.onSetTimeout(entry);
        }
        return scheduledTimers.length;
      },
      localStorage: null,
    },
    state,
    players: {
      PLAYER_COLOR_IDS: allPlayers.map((player) => player.color),
      canAfford: options.realisticCanAfford ? canAffordResources : () => true,
      formatResourceCost: (cost = {}) => Object.entries(cost)
        .filter(([, value]) => Number(value || 0) > 0)
        .map(([key, value]) => `${value} ${key}`)
        .join(", "),
      normalizeIncome: (income = {}) => ({ ...(income || {}) }),
      playerOwnsTech: () => false,
    },
    solar: {
      mod8: (value) => ((Math.round(Number(value) || 0) % 8) + 8) % 8,
      createSolarSnapshot: () => ({ planetLocations: [] }),
      collectVisibleCoordinateGroups: () => ({ asteroids: [], comets: [] }),
      collectVisibleCoordinateReport: () => [],
    },
    rocketActions: {
      ROCKET_KIND: { STANDARD: "standard", CHONG_FOSSIL: "chong-fossil" },
      getRocketsForPlayer: () => [],
      getRocketSectorCoordinate: (rocket) => rocket?.sector || null,
      canMoveRocket: (_rocketState, rocketId, deltaX, deltaY) => {
        const rocket = (options.movableTokens || []).find((item) => Number(item.id) === Number(rocketId));
        if (!rocket) return { ok: false, message: "rocket not found" };
        if (Array.isArray(options.allowedMoveDeltas)
          && !options.allowedMoveDeltas.some((delta) => (
            Number(delta?.deltaX || 0) === Number(deltaX || 0)
            && Number(delta?.deltaY || 0) === Number(deltaY || 0)
          ))) {
          return { ok: false, message: "move direction disabled by test" };
        }
        const sector = rocket.sector || null;
        if (!sector) return { ok: false, message: "rocket has no sector" };
        const y = sector.y + Number(deltaY || 0);
        if (y < 1 || y > 4) return { ok: false, message: "out of bounds" };
        if (!Number(deltaX || 0) && !Number(deltaY || 0)) return { ok: false, message: "no movement" };
        return { ok: true, rocket, message: null };
      },
      SECTOR_RING_MIN: 1,
      SECTOR_RING_MAX: 4,
    },
    planetRewards: {
      EFFECT_TYPES: {
        GAIN_RESOURCES: "gain_resources",
        GAIN_DATA: "gain_data",
        ALIEN_TRACE: "alien_trace",
        DRAW_CARDS: "draw_cards",
        PICK_CARD: "pick_card",
        INCOME: "income",
      },
    },
    aliens: {
      ALIEN_SLOT_IDS: options.alienSlotIds || [1],
      TRACE_TYPES: alienCore.TRACE_TYPES,
      getAlienSlot: (stateToRead, alienSlotId) => (
        stateToRead?.aliens?.[String(alienSlotId)]
        || stateToRead?.aliens?.[Number(alienSlotId)]
        || null
      ),
    },
    banrenma,
    chong,
    fangzhou,
    runezu,
    yichangdian,
    cards: {
      getCardLabel: (card) => card?.cardName || card?.label || card?.cardId || card?.id || "card",
      getDiscardRemaining: () => Math.max(0, Math.round(Number(options.discardCount ?? pendingDiscardAction?.count ?? 1) || 0)),
      getIncomeCodeForCard: (card) => card?.incomeCode ?? null,
      getIncomeGainForCard: (card) => card?.incomeGain || null,
      getDiscardActionMoveRewardForCard: (card) => card?.moveReward || null,
      getDiscardActionRewardForCard: (card) => card?.resourceReward || null,
    },
    abilities: {
      planet: {
        DEFAULT_ORBIT_COST: { credits: 1, energy: 1 },
        BASE_LAND_ENERGY_COST: 3,
        getLandEnergyCost: () => 3,
        getLandOptions: () => ({ ok: false, message: "land disabled in harness" }),
        getOrbitOptions: () => ({ ok: false, message: "orbit disabled in harness" }),
      },
      rocket: {
        ORANGE1_ROCKET_LIMIT: 4,
        getRocketLimitForPlayer: () => 3,
      },
    },
    actions: options.actions || {
      canExecute: (actionId) => {
        const configured = options.actionChecks?.[actionId];
        if (configured) return typeof configured === "function" ? configured() : configured;
        if (actionId === "researchTech" && takeableTechIds.length) {
          return { ok: true, takeable: takeableTechIds };
        }
        return { ok: false, message: `${actionId} disabled in harness` };
      },
    },
    scanEffects: options.scanEffects || {
      SCAN_COST: { credits: 1, energy: 2 },
      canExecuteScan: () => ({ ok: false, message: "scan disabled in harness" }),
      getStandardScanCost: () => ({ credits: 1, energy: 2 }),
    },
    quickTrades: quickTradeActions ? {
      getTradeAction: (tradeId) => quickTradeActions[tradeId] || null,
      canExecuteTrade: (tradeId) => {
        const trade = quickTradeActions[tradeId] || null;
        if (!trade) return { ok: false, message: "trade missing" };
        return canAffordResources(currentPlayer, trade.cost)
          ? { ok: true }
          : { ok: false, message: "trade unaffordable" };
      },
    } : null,
    data: options.data || {},
    ai: {
      policy: {
        choosePlayCard: (candidates) => (
          candidates
            .slice()
            .sort((left, right) => Number(right.score || 0) - Number(left.score || 0))[0]
          || null
        ),
        chooseTurnAction: (candidates) => {
          const selected = options.chooseTurnAction
            ? options.chooseTurnAction(candidates)
            : (
              candidates.find((candidate) => candidate.id === "runezuFaceSymbol")
              || candidates.find((candidate) => candidate.available !== false)
              || null
            );
          if (typeof options.onChooseTurnAction === "function") {
            options.onChooseTurnAction(candidates, selected);
          }
          return selected;
        },
      },
    },
    cardEffects: {
      EFFECT_TYPES: {
        CARD_MOVE: "card_move",
        FREE_MOVE: "free_move",
        RESEARCH_TECH: "card_research_tech",
      },
      buildPlayEffects: (card) => card?.playEffects || [],
      getCardModel: (card) => card?.model || null,
      ensureCardEffectState: () => null,
    },
    finalScoring: {
      ensureFinalScoringState: (stateToEnsure) => {
        if (!stateToEnsure.tiles) stateToEnsure.tiles = {};
      },
      getTileVariant: (_stateToRead, tileId) => options.finalTileVariants?.[tileId] || "a",
      hasPlayerMarkedTile: (stateToRead, tileId, playerId) => (
        stateToRead?.tiles?.[tileId]?.marks || []
      ).some((mark) => mark?.playerId === playerId),
    },
    endGameScoring: {
      countOwnedTech: (player, techType) => Math.max(0, Number(player?.techCounts?.[techType] || 0)),
      getFormulaId: (tileId) => options.finalFormulaIds?.[tileId] || tileId,
      getSlotMultiplier: (formulaId, slotIndex) => (
        options.finalSlotMultipliers?.[formulaId]?.[slotIndex]
        ?? options.finalSlotMultipliers?.[formulaId]
        ?? 1
      ),
    },
    tech: options.tech || {
      getStack: (_board, tileId) => getTechStack(tileId),
      getStackIndex: (tileId) => getTechStack(tileId).stackIndex || 1,
      getTechType: (tileId) => getTechStack(tileId).techType,
      getAvailableBlueSlots: () => [1],
      listTakeableTiles: (_board, _techState, filter = {}) => {
        const allowed = Array.isArray(filter.techTypes) ? new Set(filter.techTypes) : null;
        return takeableTechIds.filter((tileId) => (
          !allowed || allowed.has(getTechStack(tileId).techType)
        ));
      },
      resolver: {
        normalizeTechTypeFilter: (filter = {}) => (
          Array.isArray(filter.techTypes) && filter.techTypes.length ? filter.techTypes : null
        ),
        canTakeTile: (_board, _techState, tileId, filter = {}) => {
          const stack = getTechStack(tileId);
          const allowed = Array.isArray(filter.techTypes) ? new Set(filter.techTypes) : null;
          if (allowed && !allowed.has(stack.techType)) return { ok: false, message: "tech type disabled" };
          return takeableTechIds.includes(tileId)
            ? { ok: true }
            : { ok: false, message: "tech tile unavailable" };
        },
      },
    },
    playerState,
    turnState,
    rocketState: options.rocketState || {},
    solarState: {},
    nebulaDataState: {},
    alienGameState,
    finalScoringState: options.finalScoringState || {},
    planetStatsState: {},
    techGameState: { board: options.techBoard || {}, ui: { ...(options.techUi || {}) } },
    cardState: {},
    cardTaskState: {},
    historyStepOrder: {},
    els: {
      scanTargetOverlay: { hidden: options.scanTargetHidden ?? false },
      scanTargetActions: makeActionList(options.scanTargetButtons || []),
      landTargetOverlay: {
        hidden: !options.landTargetPending,
        dataset: options.landTargetDataset || { planetId: "mars" },
      },
      landTargetSelect: {
        options: options.landTargetSelectOptions || [{}, {}],
        value: String(options.landTargetSelectedIndex || 0),
        focus: () => null,
      },
      dataPlaceOverlay: { hidden: !options.dataPlacePending },
      dataPlaceActions: makeActionList(options.dataPlaceButtons || []),
      alienTraceActions: makeActionList(options.alienPickerButtons || []),
      alienJiuzheTraceLayers: [makeActionList(options.alienTraceButtons || [])],
      alienTraceLayers: [makeActionList(options.alienStateTraceButtons || [])],
    },
    DEFAULT_ACTIVE_PLAYER_COUNT: allPlayers.length,
    DEFAULT_INITIAL_HAND_COUNT: 5,
    DEFAULT_INITIAL_PLAYER_COLOR: "white",
    FINAL_ROUND_NUMBER: 5,
    FINAL_SCORE_IDS: options.finalScoreIds || [],
    INITIAL_SELECTION_REQUIRED: { initial: 0 },
    MOVE_ENERGY_COST: 1,
    createActionContext: () => ({
      ensurePlayerTechState: (player) => {
        if (player && !player.techState) player.techState = { ownedTiles: {} };
        return player?.techState || null;
      },
    }),
    createTurnState: () => ({}),
    computePlayerFinalScoreBreakdown: () => ({}),
    formatRocketLabel: () => "",
    getActivePlayers: () => allPlayers,
    getAlienTraceActionPlayer: (pending) => {
      const playerId = pending?.targetPlayerId || pending?.playerId || options.alienTracePlayerId || null;
      const playerColor = pending?.targetPlayerColor || pending?.playerColor || options.alienTracePlayerColor || null;
      return allPlayers.find((player) => player.id === playerId || player.color === playerColor) || null;
    },
    getCardPlayCost: (card) => (card?.price ? { credits: card.price } : {}),
    getCardPrice: (card) => card?.price || 0,
    getCardTypeCode: (card) => (typeof options.getCardTypeCode === "function"
      ? options.getCardTypeCode(card)
      : (card?.typeCode || 1)),
    getCurrentActionEffect: () => options.currentActionEffect || null,
    getCurrentPlayer: () => currentPlayer,
    getEarthSectorCoordinate: () => options.earthCoordinate || { x: 1, y: 1 },
    getEffectOwnerPlayer: (effect) => {
      if (effect?.playerId) return allPlayers.find((player) => player.id === effect.playerId) || null;
      if (effect?.playerColor) return allPlayers.find((player) => player.color === effect.playerColor) || null;
      if (effect?.options?.playerId) return allPlayers.find((player) => player.id === effect.options.playerId) || null;
      if (effect?.options?.playerColor) return allPlayers.find((player) => player.color === effect.options.playerColor) || null;
      if (effect?.options?.targetPlayerId) return allPlayers.find((player) => player.id === effect.options.targetPlayerId) || null;
      if (effect?.options?.targetPlayerColor) return allPlayers.find((player) => player.color === effect.options.targetPlayerColor) || null;
      if (options.effectOwnerColor) return allPlayers.find((player) => player.color === options.effectOwnerColor) || null;
      return null;
    },
    getInitialSelectionOffer: () => null,
    getPendingPlayCardSelection: () => null,
    getPlanetSectorCoordinate: () => ({ x: 1, y: 1 }),
    getPlayerByColor: (color) => allPlayers.find((player) => player.color === color) || null,
    getPlayerById: (id) => allPlayers.find((player) => player.id === id) || null,
    getPlayerLabelById: (id) => allPlayers.find((player) => player.id === id)?.colorLabel || id,
    getRequiredMovePointsForUi: () => 1,
    getSectorContentForMove: () => null,
    handleJiuzheCardChoice: (choice) => {
      noteHandled({ type: "card", choice });
      return { ok: true, progressed: true };
    },
    handleJiuzheOpportunitySkip: () => {
      noteHandled({ type: "skip" });
      pendingJiuzheCardPlay = null;
      return { ok: true, progressed: true };
    },
    hasActivePendingSubFlow: () => Boolean(
      pendingJiuzheCardPlay
      || options.pendingAlienTraceAction
      || options.scanTargetPending
      || options.probeSectorPending
      || options.probeLocationPending
      || options.landTargetPending
      || options.dataPlacePending
    ),
    openBanrenmaReadyOpportunityForPlayer: (player, openOptions = {}) => {
      if (!options.readyBanrenmaPlayerColor || player?.color !== options.readyBanrenmaPlayerColor) return null;
      noteHandled({
        type: "banrenma-ready",
        playerColor: player.color,
        includeCards: openOptions.includeCards,
      });
      return { ok: true, message: "opened banrenma opportunity" };
    },
    openRunezuFaceSymbolPlacement: (alienSlotId, position) => {
      noteHandled({
        type: "runezu-face-symbol-open",
        alienSlotId: Number(alienSlotId),
        position: Number(position),
      });
      return { ok: true, progressed: true, awaitingChoice: true };
    },
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

  context.finalizePendingDiscardSelection = () => {
    noteHandled({
      type: "discard",
      pendingType: pendingDiscardAction?.type || null,
      selectedIndexes: [...(pendingDiscardAction?.selectedIndexes || [])],
    });
    return { ok: true, progressed: true };
  };

  context.confirmDataPlacement = (target, blueSlot) => {
    noteHandled({ type: "data-placement", target, blueSlot });
    return { ok: true, progressed: true };
  };
  context.confirmLandTargetPicker = () => {
    noteHandled({ type: "land-target", selectedIndex: Number(context.els.landTargetSelect.value) });
    return { ok: true, progressed: true };
  };
  context.handlePayCreditChoice = (choice) => {
    noteHandled({ type: "pay-credit", choice });
    return { ok: true, progressed: true };
  };
  context.handleDiscardIncomeCardChoice = (cardId) => {
    noteHandled({ type: "discard-income-card", cardId });
    return { ok: true, progressed: true };
  };
  context.confirmDiscardAnyForIncome = () => {
    noteHandled({ type: "discard-income-confirm" });
    return { ok: true, progressed: true };
  };
  context.handleRemoveOrbitToProbeChoice = (choiceId) => {
    noteHandled({ type: "remove-orbit-to-probe", choiceId });
    return { ok: true, progressed: true };
  };
  context.handleReturnUnfinishedTaskChoice = (cardId) => {
    noteHandled({ type: "return-task", cardId });
    return { ok: true, progressed: true };
  };
  context.handleDiscardCornerRepeatChoice = (cardId) => {
    noteHandled({ type: "discard-corner-repeat", cardId });
    return { ok: true, progressed: true };
  };
  context.handleProbeSectorScanChoice = (rocketId) => {
    noteHandled({ type: "probe-sector-choice", rocketId: Number(rocketId) });
    return { ok: true, progressed: true };
  };
  context.confirmProbeSectorScanSelection = () => {
    noteHandled({ type: "probe-sector-confirm" });
    return { ok: true, progressed: true };
  };
  context.handleProbeLocationRewardChoice = (rocketId) => {
    noteHandled({ type: "probe-location", rocketId: Number(rocketId) });
    return { ok: true, progressed: true };
  };
  context.handleRemovePlanetMarkerChoice = (choiceId) => {
    noteHandled({ type: "remove-marker", choiceId });
    return { ok: true, progressed: true };
  };
  context.handleHandCornerChoice = (choice) => {
    noteHandled({ type: "hand-corner", choice });
    return { ok: true, progressed: true };
  };

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
  if (options.canStartMainAction) {
    context.canStartMainAction = () => true;
  }
  if (options.techTilePickingActive) {
    context.isTechTilePickingActive = () => true;
  }
  if (options.actionEffectFlowActive) {
    context.isActionEffectFlowActive = () => true;
  }
  if (options.currentPlayerDiscardPending || options.pendingDiscardAction) {
    context.isDiscardSelectionActive = () => true;
  }
  if (options.playCardSelectionActive) {
    context.isPlayCardSelectionActive = () => true;
    context.handlePlayCardSelect = (handIndex) => {
      noteHandled({ type: "play-card", handIndex: Number(handIndex), confirmed: false });
      return { ok: true, progressed: true };
    };
    context.confirmPlayCardSelection = () => {
      noteHandled({ ...(handled || { type: "play-card" }), confirmed: true });
      return { ok: true, progressed: true };
    };
  }
  if (options.pendingMovePayment) {
    context.isMovePaymentSelectionActive = () => true;
    context.isMovePaymentCard = (card) => Boolean(card?.movePayment);
    context.confirmMovePayment = (confirmOptions = {}) => {
      noteHandled({
        type: "move-payment",
        automated: confirmOptions.automated === true,
        playerId: options.pendingMovePayment.player?.id || null,
        selectedHandIndices: [...(options.pendingMovePayment.selectedHandIndices || [])],
      });
      return { ok: true, progressed: true };
    };
  }
  if (options.canPayForMove) {
    context.canPayForMove = () => ({ ok: true });
  }
  if (options.recordEffectMove) {
    context.executeCardMoveForEffect = (deltaX, deltaY, rocketId) => {
      noteHandled({
        type: "effect-move",
        deltaX: Number(deltaX),
        deltaY: Number(deltaY),
        rocketId: Number(rocketId),
      });
      return { ok: true, progressed: true };
    };
  }
  if (options.recordSkipCurrentActionEffect) {
    context.skipCurrentActionEffect = () => {
      noteHandled({ type: "skip-effect" });
      return { ok: true, progressed: true, skipped: true };
    };
  }
  if (options.recordResearchTech) {
    context.researchTechForCurrentPlayer = () => {
      noteHandled({ type: "research-tech" });
      return { ok: true, progressed: true };
    };
  }
  if (options.recordSupplyTechSelection) {
    context.handleSupplyTechTileClick = (tileId) => {
      noteHandled({ type: "supply-tech", tileId });
      return { ok: true, progressed: true };
    };
  }
  if (options.recordAnalyze) {
    context.analyzeDataForCurrentPlayer = () => {
      noteHandled({ type: "analyze" });
      return { ok: true, progressed: true };
    };
  }
  if (options.recordQuickTrade) {
    context.runQuickTrade = (tradeId) => {
      noteHandled({ type: "quick-trade", tradeId });
      return { ok: true, progressed: true };
    };
  }
  if (options.recordExecuteActionEffect) {
    context.executeActionEffect = (effect) => {
      noteHandled({
        type: "effect",
        effectId: effect?.id || null,
        effectType: effect?.type || null,
      });
      return { ok: true, progressed: true };
    };
  }
  if (options.recordBeginPlayCard) {
    context.beginPlayCardSelection = () => {
      noteHandled({ type: "begin-play-card" });
      return { ok: true, progressed: true };
    };
  }
  if (options.recordOpenCardTask) {
    context.openCardTaskCompletionPicker = (card) => {
      noteHandled({ type: "open-card-task", cardId: card?.id || null });
      return { ok: true, progressed: true };
    };
  }

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
  if (options.readyCardTasks) {
    context.getReadyCardTasks = () => options.readyCardTasks;
  }
  if (options.passReserveCards) {
    context.getPassReserveSelectionCards = () => options.passReserveCards;
    context.selectPassReserveCard = (cardId) => {
      if (pendingPassReserveSelection) pendingPassReserveSelection.selectedCardId = cardId;
      noteHandled({ type: "pass-reserve-select", cardId });
    };
    context.confirmPassReserveSelection = () => {
      const cardId = pendingPassReserveSelection?.selectedCardId || null;
      noteHandled({ type: "pass-reserve", cardId });
      pendingPassReserveSelection = null;
      return { ok: true, progressed: true, cardId };
    };
  }
  context.getMovableTokensForPlayer = (playerId) => (options.movableTokens || [])
    .filter((token) => !playerId || token.playerId === playerId);
  if (options.recordMove) {
    context.moveRocket = (deltaX, deltaY, rocketId) => {
      noteHandled({
        type: "move",
        deltaX: Number(deltaX),
        deltaY: Number(deltaY),
        rocketId: Number(rocketId),
      });
      return { ok: true, progressed: true };
    };
  }

  return {
    white,
    blue,
    controller: createAiController(context),
    getHandled: () => handled,
    getHandledEvents: () => handledEvents.slice(),
    getScheduledTimers: () => scheduledTimers.slice(),
  };
}

function makeHiddenAlienSlot(traceOwners = {}) {
  const traces = {};
  for (const traceType of ["yellow", "pink", "blue"]) {
    const owner = traceOwners[traceType] || null;
    traces[traceType] = {
      firstPlaced: Boolean(owner),
      ownerPlayerId: owner?.id || null,
      ownerPlayerColor: owner?.color || owner || null,
      extraCount: 0,
    };
  }
  return { revealed: false, traces };
}

function makeChongTransportAlienState(options = {}) {
  const rocketId = String(options.rocketId || 77);
  const fossilId = options.fossilId || "fossil_02";
  const destinationPlanetId = options.destinationPlanetId || "earth";
  const chongState = chong.createChongState();
  chongState.fossilsById[fossilId] = {
    fossilId,
    status: "transported",
    location: "transported",
    destinationPlanetId,
    fossilRewardRepeat: options.fossilRewardRepeat ?? 1,
    taskGain: { ...(options.taskGain || {}) },
    taskDataCount: options.taskDataCount || 0,
    taskPickCard: Boolean(options.taskPickCard),
  };
  chongState.transportTasksByRocketId[rocketId] = {
    fossilId,
    destinationPlanetId,
    cardId: options.cardId || "chong-test",
  };
  return {
    aliens: {
      1: { revealed: true, alienId: chong.ALIEN_ID, assignedAlienId: chong.ALIEN_ID },
    },
    chong: chongState,
  };
}

function makeBanrenmaAlienState() {
  const alienGameState = {
    aliens: {
      1: { revealed: true, alienId: banrenma.ALIEN_ID, assignedAlienId: banrenma.ALIEN_ID },
    },
    banrenma: banrenma.createBanrenmaState(),
  };
  banrenma.ensureTraceGrid(alienGameState, 1);
  return alienGameState;
}

{
  const harness = createAiControllerHarness("blue", { currentPlayerDiscardPending: true });
  assert.equal(
    harness.controller.configureAiAutoBattle({
      playerIds: [harness.blue.id],
      suppressAutoSchedule: true,
    }).ok,
    true,
  );

  const result = harness.controller.runAiAutomationStep();
  assert.equal(result.ok, true, "color-owned Jiuzhe pending should be handled before current-player subflows");
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

{
  const harness = createAiControllerHarness(null, {
    scanTargetPending: {
      type: "pay_credit_reward",
      playerColor: "blue",
      effect: {
        id: "pay-credit-test",
        options: { reward: { type: "gain_resources", options: { gain: { score: 2, publicity: 2 } } } },
      },
    },
  });
  assert.equal(
    harness.controller.configureAiAutoBattle({
      playerIds: [harness.blue.id],
      suppressAutoSchedule: true,
    }).ok,
    true,
  );

  const result = harness.controller.runAiAutomationStep();
  assert.equal(result.ok, true, "AI-owned pay-credit pending should resolve even when current player is human");
  assert.deepEqual(harness.getHandled(), { type: "pay-credit", choice: "pay" });
}

{
  const harness = createAiControllerHarness(null, {
    scanTargetPending: {
      type: "pay_credit_reward",
      playerColor: "white",
      effect: {
        id: "human-pay-credit-test",
        options: { reward: { type: "gain_resources", options: { gain: { score: 2, publicity: 2 } } } },
      },
    },
  });
  assert.equal(
    harness.controller.configureAiAutoBattle({
      playerIds: [harness.blue.id],
      suppressAutoSchedule: true,
    }).ok,
    true,
  );

  const result = harness.controller.runAiAutomationStep();
  assert.equal(result.blocked, true, "human-owned rare pending should wait for the human player");
  assert.equal(harness.getHandled(), null);
}

{
  const harness = createAiControllerHarness(null, {
    blueHand: [
      { id: "income-card", incomeGain: { credits: 1 } },
      { id: "blank-card" },
    ],
    scanTargetPending: {
      type: "discard_any_income",
      playerColor: "blue",
      effect: { id: "discard-income-test" },
      selectedCardIds: [],
    },
  });
  assert.equal(
    harness.controller.configureAiAutoBattle({
      playerIds: [harness.blue.id],
      suppressAutoSchedule: true,
    }).ok,
    true,
  );

  const result = harness.controller.runAiAutomationStep();
  assert.equal(result.ok, true, "AI-owned discard-income pending should confirm safely");
  assert.equal(harness.getHandled().type, "discard-income-confirm");
}

{
  const pendingDiscardAction = { type: "initial_income", selectedIndexes: [] };
  const harness = createAiControllerHarness(null, {
    currentPlayerColor: "blue",
    pendingDiscardAction,
    discardCount: 4,
    blueResources: { credits: 2, energy: 1, handSize: 6, score: 0 },
    blueIncome: { credits: 2, energy: 1, handSize: 1 },
    blueHand: [
      { id: "credit-income-1", incomeGain: { credits: 1 } },
      { id: "credit-income-2", incomeGain: { credits: 1 } },
      { id: "credit-income-3", incomeGain: { credits: 1 } },
      { id: "credit-income-4", incomeGain: { credits: 1 } },
      { id: "energy-income", incomeGain: { energy: 1 } },
      { id: "hand-income", incomeGain: { handSize: 1 } },
    ],
  });
  assert.equal(
    harness.controller.configureAiAutoBattle({
      playerIds: [harness.blue.id],
      suppressAutoSchedule: true,
    }).ok,
    true,
  );

  const result = harness.controller.runAiAutomationStep();
  assert.equal(result.ok, true, "AI should resolve multi-income discard selection");
  const selectedGains = pendingDiscardAction.selectedIndexes
    .map((index) => harness.blue.hand[index]?.incomeGain || {});
  assert.equal(
    selectedGains.some((gain) => Number(gain.energy || 0) > 0),
    true,
    "multi-income selection should include energy after simulating earlier credit gains",
  );
  assert.equal(
    selectedGains.some((gain) => Number(gain.handSize || 0) > 0),
    true,
    "multi-income selection should include hand income after simulating earlier gains",
  );
  assert.ok(
    selectedGains.filter((gain) => Number(gain.credits || 0) > 0).length <= 2,
    "multi-income selection should not spend all four choices on credit income",
  );
}

{
  const pendingDiscardAction = { type: "initial_income", selectedIndexes: [] };
  const harness = createAiControllerHarness(null, {
    currentPlayerColor: "blue",
    roundNumber: 3,
    pendingDiscardAction,
    discardCount: 1,
    blueResources: { credits: 0, energy: 5, handSize: 6, score: 52 },
    blueIncome: { credits: 2, energy: 1, handSize: 1 },
    blueCompanyBaseIncome: { credits: 2, energy: 1, handSize: 1 },
    blueHand: [
      { id: "credit-after-base", incomeGain: { credits: 1 } },
      { id: "hand-after-base", incomeGain: { handSize: 1 } },
    ],
    finalScoringState: {
      tiles: {
        a: {
          id: "a",
          marks: [{ playerId: "player-blue", slotIndex: 1, threshold: 50 }],
        },
      },
    },
    finalTileVariants: { a: 2 },
  });
  assert.equal(
    harness.controller.configureAiAutoBattle({
      playerIds: [harness.blue.id],
      suppressAutoSchedule: true,
    }).ok,
    true,
  );

  const result = harness.controller.runAiAutomationStep();
  assert.equal(result.ok, true, "AI should resolve income discard with company base income excluded from final scoring");
  const [selectedIndex] = pendingDiscardAction.selectedIndexes;
  assert.equal(
    harness.blue.hand[selectedIndex]?.id,
    "credit-after-base",
    "a2 income-final fit should use income increases, not company base income",
  );
}

{
  const pendingDiscardAction = { type: "initial_income", selectedIndexes: [] };
  const harness = createAiControllerHarness(null, {
    currentPlayerColor: "blue",
    roundNumber: 2,
    pendingDiscardAction,
    discardCount: 2,
    blueResources: { credits: 1, energy: 2, handSize: 1, score: 18 },
    blueIncome: { credits: 5, energy: 3, handSize: 2 },
    blueHand: [
      { id: "credit-income-surplus-1", incomeGain: { credits: 1 } },
      { id: "credit-income-surplus-2", incomeGain: { credits: 1 } },
      { id: "hand-income-engine", incomeGain: { handSize: 1 } },
      { id: "task-engine-card", model: { tasks: [{ id: "task-a", rewards: [{ type: "gain_resources", options: { gain: { score: 6 } } }] }] } },
      { id: "tech-engine-card", playEffects: [{ type: "card_research_tech", options: { techTypes: ["orange"] } }] },
    ],
  });
  assert.equal(
    harness.controller.configureAiAutoBattle({
      playerIds: [harness.blue.id],
      suppressAutoSchedule: true,
    }).ok,
    true,
  );

  const result = harness.controller.runAiAutomationStep();
  assert.equal(result.ok, true, "AI should resolve engine-aware income discard selection");
  const selectedGains = pendingDiscardAction.selectedIndexes
    .map((index) => harness.blue.hand[index]?.incomeGain || {});
  assert.equal(
    selectedGains.some((gain) => Number(gain.handSize || 0) > 0),
    true,
    "hand income should stay valuable at income 2 when a task/card engine needs fuel",
  );
  assert.ok(
    selectedGains.filter((gain) => Number(gain.credits || 0) > 0).length <= 1,
    "engine backlog should not spend both choices on surplus credit income",
  );
}

{
  const harness = createAiControllerHarness(null, {
    scanTargetPending: {
      type: "remove_orbit_to_probe",
      playerColor: "blue",
      effect: { id: "remove-orbit-test" },
      choices: [{ id: "mars:1" }],
    },
  });
  assert.equal(
    harness.controller.configureAiAutoBattle({
      playerIds: [harness.blue.id],
      suppressAutoSchedule: true,
    }).ok,
    true,
  );

  const result = harness.controller.runAiAutomationStep();
  assert.equal(result.ok, true, "AI-owned remove-orbit pending should pick a legal choice");
  assert.deepEqual(harness.getHandled(), { type: "remove-orbit-to-probe", choiceId: "mars:1" });
}

{
  const harness = createAiControllerHarness(null, {
    scanTargetPending: {
      type: "return_unfinished_task",
      playerColor: "blue",
      effect: { id: "return-task-test" },
      choices: [{ id: "task-expensive", price: 4 }, { id: "task-cheap", price: 1 }],
    },
  });
  assert.equal(
    harness.controller.configureAiAutoBattle({
      playerIds: [harness.blue.id],
      suppressAutoSchedule: true,
    }).ok,
    true,
  );

  const result = harness.controller.runAiAutomationStep();
  assert.equal(result.ok, true, "AI-owned return-task pending should pick a legal task");
  assert.deepEqual(harness.getHandled(), { type: "return-task", cardId: "task-cheap" });
}

{
  const harness = createAiControllerHarness(null, {
    probeSectorPending: {
      playerColor: "blue",
      effect: { id: "probe-sector-test", options: { maxTargets: 2 } },
      choices: [
        { rocket: { id: 1 }, sector: { x: 2, y: 3 } },
        { rocket: { id: 2 }, sector: { x: 4, y: 3 } },
      ],
    },
  });
  assert.equal(
    harness.controller.configureAiAutoBattle({
      playerIds: [harness.blue.id],
      suppressAutoSchedule: true,
    }).ok,
    true,
  );

  const result = harness.controller.runAiAutomationStep();
  assert.equal(result.ok, true, "AI-owned probe-sector pending should select legal rockets and confirm");
  assert.deepEqual(harness.getHandledEvents().map((event) => event.type), [
    "probe-sector-choice",
    "probe-sector-choice",
    "probe-sector-confirm",
  ]);
}

{
  const harness = createAiControllerHarness(null, {
    probeLocationPending: {
      playerColor: "blue",
      effect: { id: "probe-location-test" },
      choices: [{ rocket: { id: 1 } }, { rocket: { id: 2 } }],
    },
    scanTargetButtons: [
      makeButton({ probeLocationRewardRocketId: "1" }, "R1 0 数据"),
      makeButton({ probeLocationRewardRocketId: "2" }, "R2 3 数据"),
    ],
  });
  assert.equal(
    harness.controller.configureAiAutoBattle({
      playerIds: [harness.blue.id],
      suppressAutoSchedule: true,
    }).ok,
    true,
  );

  const result = harness.controller.runAiAutomationStep();
  assert.equal(result.ok, true, "AI-owned probe-location pending should select the best legal rocket");
  assert.deepEqual(harness.getHandled(), { type: "probe-location", rocketId: 2 });
}

{
  const harness = createAiControllerHarness(null, {
    landTargetPending: {
      playerColor: "blue",
      getOptions: () => ({ ok: false, message: "skip scoring in harness" }),
    },
    landTargetSelectOptions: [{}, {}],
  });
  assert.equal(
    harness.controller.configureAiAutoBattle({
      playerIds: [harness.blue.id],
      suppressAutoSchedule: true,
    }).ok,
    true,
  );

  const result = harness.controller.runAiAutomationStep();
  assert.equal(result.ok, true, "AI-owned land-target pending should resolve while current player is human");
  assert.deepEqual(harness.getHandled(), { type: "land-target", selectedIndex: 0 });
}

{
  const harness = createAiControllerHarness(null, {
    dataPlacePending: {
      playerColor: "blue",
      effect: { id: "data-place-test" },
    },
    dataPlaceButtons: [
      makeButton({ placeTarget: "computer" }, "放置位 2"),
    ],
  });
  assert.equal(
    harness.controller.configureAiAutoBattle({
      playerIds: [harness.blue.id],
      suppressAutoSchedule: true,
    }).ok,
    true,
  );

  const result = harness.controller.runAiAutomationStep();
  assert.equal(result.ok, true, "AI-owned data placement should resolve while current player is human");
  assert.deepEqual(harness.getHandled(), { type: "data-placement", target: "computer", blueSlot: null });
}

{
  const pendingMovePayment = {
    player: null,
    rocketId: 7,
    deltaX: 1,
    deltaY: 0,
    requiredMovePoints: 1,
    selectedHandIndices: [],
  };
  const harness = createAiControllerHarness(null, {
    currentPlayerColor: "white",
    pendingMovePayment,
    rocketState: {
      rockets: [{ id: 7, playerId: "player-blue", sector: { x: 2, y: 2 } }],
    },
  });
  pendingMovePayment.player = harness.blue;
  assert.equal(
    harness.controller.configureAiAutoBattle({
      playerIds: [harness.blue.id],
      suppressAutoSchedule: true,
    }).ok,
    true,
  );

  const result = harness.controller.runAiAutomationStep();
  assert.equal(result.ok, true, "AI-owned move payment should resolve while current interface player is human");
  assert.deepEqual(harness.getHandled(), {
    type: "move-payment",
    automated: true,
    playerId: harness.blue.id,
    selectedHandIndices: [],
  });
}

{
  const harness = createAiControllerHarness(null, {
    currentPlayerDiscardPending: true,
    readyBanrenmaPlayerColor: "blue",
  });
  assert.equal(
    harness.controller.configureAiAutoBattle({
      playerIds: [harness.blue.id],
      suppressAutoSchedule: true,
    }).ok,
    true,
  );

  const result = harness.controller.runAiAutomationStep();
  assert.equal(result.ok, true, "AI should open ready Banrenma panel marks before current-player subflows");
  assert.deepEqual(harness.getHandled(), {
    type: "banrenma-ready",
    playerColor: "blue",
    includeCards: false,
  });
}

{
  const harness = createAiControllerHarness(null, {
    currentPlayerColor: "blue",
    readyBanrenmaPlayerColor: "blue",
  });
  assert.equal(
    harness.controller.configureAiAutoBattle({
      playerIds: [harness.blue.id],
      suppressAutoSchedule: true,
    }).ok,
    true,
  );

  const result = harness.controller.runAiAutomationStep();
  assert.equal(result.ok, true, "AI should open current player's ready Banrenma card conditions");
  assert.deepEqual(harness.getHandled(), {
    type: "banrenma-ready",
    playerColor: "blue",
    includeCards: true,
  });
}

{
  const harness = createAiControllerHarness(null, {
    currentPlayerColor: "blue",
    pendingActionExecuted: true,
    runezuQuick: true,
    blueRunezuSymbols: { symbol_4: 1 },
  });
  assert.equal(
    harness.controller.configureAiAutoBattle({
      playerIds: [harness.blue.id],
      suppressAutoSchedule: true,
    }).ok,
    true,
  );

  const result = harness.controller.runAiAutomationStep();
  assert.equal(result.ok, true, "AI should open Runezu face symbol quick action after reveal");
  assert.equal(harness.getHandled().type, "runezu-face-symbol-open");
  assert.equal(harness.getHandled().alienSlotId, 1);
  assert.ok([4, 5, 6, 7].includes(harness.getHandled().position));
}

{
  const yState = yichangdian.createYichangdianState();
  yState.revealedSlotId = 1;
  yState.revealInitialized = true;
  yState.anomalies = [
    { markerId: "b_1", traceType: "yellow", sectorX: 7, y: 4, triggeredCount: 0 },
    { markerId: "c_2", traceType: "blue", sectorX: 0, y: 4, triggeredCount: 0 },
  ];
  const alienGameState = {
    aliens: {
      1: { revealed: true, alienId: yichangdian.ALIEN_ID, assignedAlienId: yichangdian.ALIEN_ID },
    },
    yichangdian: yState,
  };
  yichangdian.ensureTraceGrid(alienGameState, 1);
  const selected = [];
  const harness = createAiControllerHarness(null, {
    currentPlayerColor: "blue",
    alienGameState,
    pendingAlienTraceAction: { targetPlayerId: "player-blue" },
    alienTracePickerState: {
      mode: "yichangdian-grid",
      selectedAlienSlotId: 1,
      allowedTraceTypes: ["yellow", "blue"],
    },
    alienTraceButtons: [
      makeButton(
        { alienSlot: "1", yichangdianTraceType: "yellow", yichangdianTraceSlot: "2", yichangdianPosition: "2" },
        "异常点黄色 2号位",
        false,
        () => selected.push("yellow-2"),
      ),
      makeButton(
        { alienSlot: "1", yichangdianTraceType: "blue", yichangdianTraceSlot: "1", yichangdianPosition: "1" },
        "异常点蓝色 1号位",
        false,
        () => selected.push("blue-1"),
      ),
    ],
  });
  assert.equal(
    harness.controller.configureAiAutoBattle({
      playerIds: [harness.blue.id],
      suppressAutoSchedule: true,
    }).ok,
    true,
  );

  const result = harness.controller.runAiAutomationStep();
  assert.equal(result.ok, true, "AI should resolve Yichangdian trace picker");
  assert.deepEqual(selected, ["blue-1"], "AI should claim the soon energy anomaly color over the old fixed yellow-2 preference");
}

{
  const harness = createAiControllerHarness(null, {
    currentPlayerColor: "white",
    alienTracePickerState: {
      mode: "fangzhou-use",
      targetPlayerId: "player-blue",
      selectedAlienSlotId: 1,
      selectedTraceType: "blue",
      allowedTraceTypes: ["blue"],
    },
    alienPickerButtons: [
      makeButton(
        { alienPickerStep: "fangzhou-use", alienSlot: "1", traceType: "blue", fangzhouUse: "unlock" },
        "解锁蓝色方舟牌",
      ),
    ],
  });
  assert.equal(
    harness.controller.configureAiAutoBattle({
      playerIds: [harness.blue.id],
      suppressAutoSchedule: true,
    }).ok,
    true,
  );

  harness.controller.scheduleAiAutoStepIfNeeded();
  assert.equal(
    harness.getScheduledTimers().length,
    1,
    "AI-owned Fangzhou trace-use picker should schedule even when the current interface player is human",
  );
}

{
  const selected = [];
  const alienGameState = {
    aliens: {
      1: makeHiddenAlienSlot({ blue: "blue" }),
      2: makeHiddenAlienSlot({ yellow: "green", pink: "white" }),
    },
  };
  const harness = createAiControllerHarness(null, {
    currentPlayerColor: "blue",
    roundNumber: 3,
    alienSlotIds: [1, 2],
    alienGameState,
    pendingAlienTraceAction: { targetPlayerId: "player-blue" },
    alienTracePickerState: { mode: "basic", allowedTraceTypes: ["blue"] },
    alienPickerButtons: [
      makeButton(
        { alienPickerStep: "basic", alienSlot: "1", traceType: "blue" },
        "外星人 1 蓝色痕迹 额外 +1",
        false,
        () => selected.push("slot-1-blue"),
      ),
      makeButton(
        { alienPickerStep: "basic", alienSlot: "2", traceType: "blue" },
        "外星人 2 放置蓝色痕迹，首标记 2/3",
        false,
        () => selected.push("slot-2-blue"),
      ),
    ],
  });
  assert.equal(
    harness.controller.configureAiAutoBattle({
      playerIds: [harness.blue.id],
      suppressAutoSchedule: true,
    }).ok,
    true,
  );

  const result = harness.controller.runAiAutomationStep();
  assert.equal(result.ok, true, "AI should resolve hidden alien trace picker");
  assert.deepEqual(selected, ["slot-2-blue"], "AI should complete alien 2 reveal setup before farming old hidden extra traces");
}

{
  const selected = [];
  const alienGameState = makeBanrenmaAlienState();
  const harness = createAiControllerHarness(null, {
    currentPlayerColor: "blue",
    roundNumber: 4,
    alienGameState,
    pendingAlienTraceAction: { targetPlayerId: "player-blue" },
    alienTracePickerState: {
      mode: "banrenma-grid",
      selectedAlienSlotId: 1,
      allowedTraceTypes: ["blue"],
    },
    alienTraceButtons: [
      makeButton(
        { alienSlot: "1", banrenmaTraceType: "blue", banrenmaTraceSlot: "4", banrenmaPosition: "4" },
        "半人马蓝色痕迹 4号位：3分，外星人牌",
        false,
        () => selected.push("alien-card"),
      ),
      makeButton(
        { alienSlot: "1", banrenmaTraceType: "blue", banrenmaTraceSlot: "3", banrenmaPosition: "3" },
        "半人马蓝色痕迹 3号位：5分",
        false,
        () => selected.push("score-5"),
      ),
    ],
  });
  assert.equal(
    harness.controller.configureAiAutoBattle({
      playerIds: [harness.blue.id],
      suppressAutoSchedule: true,
    }).ok,
    true,
  );

  const result = harness.controller.runAiAutomationStep();
  assert.equal(result.ok, true, "AI should resolve late Banrenma trace picker");
  assert.deepEqual(selected, ["score-5"], "AI should discount late alien-card rewards when direct score is available");
}

{
  const selected = [];
  const harness = createAiControllerHarness(null, {
    currentPlayerColor: "blue",
    roundNumber: 3,
    blueResources: { availableData: 3, score: 30 },
    blueTechCounts: { blue: 3 },
    alienGameState: makeBanrenmaAlienState(),
    pendingAlienTraceAction: { targetPlayerId: "player-blue" },
    alienTracePickerState: {
      mode: "banrenma-grid",
      selectedAlienSlotId: 1,
      allowedTraceTypes: ["blue"],
    },
    alienTraceButtons: [
      makeButton(
        { alienSlot: "1", banrenmaTraceType: "blue", banrenmaTraceSlot: "2", banrenmaPosition: "2" },
        "半人马蓝色痕迹 2号位：支付 3 数据，15分",
        false,
        () => selected.push("pay-data-score"),
      ),
      makeButton(
        { alienSlot: "1", banrenmaTraceType: "blue", banrenmaTraceSlot: "5", banrenmaPosition: "5" },
        "半人马蓝色痕迹 5号位：5分，外星人牌",
        false,
        () => selected.push("card-5"),
      ),
    ],
  });
  assert.equal(
    harness.controller.configureAiAutoBattle({
      playerIds: [harness.blue.id],
      suppressAutoSchedule: true,
    }).ok,
    true,
  );

  const result = harness.controller.runAiAutomationStep();
  assert.equal(result.ok, true, "AI should resolve Banrenma blue-tech trace picker");
  assert.deepEqual(
    selected,
    ["card-5"],
    "AI should delay Banrenma 3-data score conversion when blue tech already covers the data route",
  );
}

{
  const selected = [];
  const harness = createAiControllerHarness(null, {
    currentPlayerColor: "blue",
    roundNumber: 3,
    blueResources: { availableData: 4, score: 44 },
    blueTechCounts: { blue: 0 },
    alienGameState: makeBanrenmaAlienState(),
    pendingAlienTraceAction: { targetPlayerId: "player-blue" },
    alienTracePickerState: {
      mode: "banrenma-grid",
      selectedAlienSlotId: 1,
      allowedTraceTypes: ["blue"],
    },
    alienTraceButtons: [
      makeButton(
        { alienSlot: "1", banrenmaTraceType: "blue", banrenmaTraceSlot: "2", banrenmaPosition: "2" },
        "半人马蓝色痕迹 2号位：支付 3 数据，15分",
        false,
        () => selected.push("pay-data-score"),
      ),
      makeButton(
        { alienSlot: "1", banrenmaTraceType: "blue", banrenmaTraceSlot: "5", banrenmaPosition: "5" },
        "半人马蓝色痕迹 5号位：5分，外星人牌",
        false,
        () => selected.push("card-5"),
      ),
    ],
  });
  assert.equal(
    harness.controller.configureAiAutoBattle({
      playerIds: [harness.blue.id],
      suppressAutoSchedule: true,
    }).ok,
    true,
  );

  const result = harness.controller.runAiAutomationStep();
  assert.equal(result.ok, true, "AI should resolve Banrenma threshold trace picker");
  assert.deepEqual(
    selected,
    ["pay-data-score"],
    "AI should still take Banrenma 3-data score conversion when it crosses a final-score threshold",
  );
}

{
  const turnChoices = [];
  const harness = createAiControllerHarness(null, {
    currentPlayerColor: "blue",
    pendingActionExecuted: true,
    recordMove: true,
    canPayForMove: true,
    onChooseTurnAction: (candidates) => turnChoices.push(candidates),
    chooseTurnAction: (candidates) => candidates
      .slice()
      .filter((candidate) => candidate.available !== false)
      .sort((left, right) => Number(right.score || 0) - Number(left.score || 0))[0] || null,
    earthCoordinate: { x: 1, y: 1 },
    alienGameState: makeChongTransportAlienState({ rocketId: 77 }),
    movableTokens: [
      {
        id: 77,
        kind: "chong-fossil",
        playerId: "player-blue",
        color: "blue",
        sector: { x: 1, y: 3 },
        sectorX: 1,
        sectorY: 3,
      },
    ],
  });
  assert.equal(
    harness.controller.configureAiAutoBattle({
      playerIds: [harness.blue.id],
      suppressAutoSchedule: true,
    }).ok,
    true,
  );

  const result = harness.controller.runAiAutomationStep();
  assert.equal(result.ok, true, "AI should choose a Chong fossil transport move");
  assert.ok(
    turnChoices.some((candidates) => candidates.some((candidate) => candidate.id === "move")),
    "AI should enumerate a legal Chong fossil move candidate",
  );
  assert.deepEqual(
    harness.getHandled(),
    { type: "move", deltaX: 0, deltaY: -1, rocketId: 77 },
    "AI should move transported Chong fossils only closer to Earth",
  );
}

{
  const moveEffect = { id: "test-chong-card-move", type: "card_move", options: { movementPoints: 1 } };
  const harness = createAiControllerHarness(null, {
    currentPlayerColor: "blue",
    recordEffectMove: true,
    canPayForMove: true,
    allowedMoveDeltas: [{ deltaX: 0, deltaY: -1 }],
    earthCoordinate: { x: 1, y: 1 },
    pendingActionEffectFlow: {
      currentIndex: 0,
      effects: [moveEffect],
      cardMoveEffect: { effect: moveEffect, poolRemaining: 1 },
    },
    alienGameState: makeChongTransportAlienState({ rocketId: 77 }),
    movableTokens: [
      {
        id: 77,
        kind: "chong-fossil",
        playerId: "player-blue",
        color: "blue",
        sector: { x: 1, y: 3 },
        sectorX: 1,
        sectorY: 3,
      },
    ],
  });
  assert.equal(
    harness.controller.configureAiAutoBattle({
      playerIds: [harness.blue.id],
      suppressAutoSchedule: true,
    }).ok,
    true,
  );

  const result = harness.controller.runAiAutomationStep();
  assert.equal(result.ok, true, "AI should move Chong fossil during card movement when the step gets closer");
  assert.deepEqual(
    harness.getHandled(),
    { type: "effect-move", deltaX: 0, deltaY: -1, rocketId: 77 },
    "AI card movement should move transported Chong fossils only inward toward Earth",
  );
}

{
  const moveEffect = { id: "test-chong-card-move-away", type: "card_move", options: { movementPoints: 1 } };
  const harness = createAiControllerHarness(null, {
    currentPlayerColor: "blue",
    recordEffectMove: true,
    recordSkipCurrentActionEffect: true,
    canPayForMove: true,
    allowedMoveDeltas: [{ deltaX: 0, deltaY: 1 }],
    earthCoordinate: { x: 1, y: 1 },
    pendingActionEffectFlow: {
      currentIndex: 0,
      effects: [moveEffect],
      cardMoveEffect: { effect: moveEffect, poolRemaining: 1 },
    },
    alienGameState: makeChongTransportAlienState({ rocketId: 77 }),
    movableTokens: [
      {
        id: 77,
        kind: "chong-fossil",
        playerId: "player-blue",
        color: "blue",
        sector: { x: 1, y: 3 },
        sectorX: 1,
        sectorY: 3,
      },
    ],
  });
  assert.equal(
    harness.controller.configureAiAutoBattle({
      playerIds: [harness.blue.id],
      suppressAutoSchedule: true,
    }).ok,
    true,
  );

  const result = harness.controller.runAiAutomationStep();
  assert.equal(result.ok, true, "AI should skip Chong fossil card movement when every legal step moves away from Earth");
  assert.equal(result.skipped, true, "away-from-Earth Chong fossil effect movement should be skipped");
  assert.deepEqual(
    harness.getHandled(),
    { type: "skip-effect" },
    "AI should not spend card movement pushing transported Chong fossils outward",
  );
}

{
  const harness = createAiControllerHarness(null, {
    currentPlayerColor: "blue",
    playCardSelectionActive: true,
    blueHand: [chong.createAlienCard(2, 1)],
  });
  assert.equal(
    harness.controller.configureAiAutoBattle({
      playerIds: [harness.blue.id],
      suppressAutoSchedule: true,
    }).ok,
    true,
  );

  const result = harness.controller.runAiAutomationStep();
  assert.equal(result.ok, true, "AI should select a playable Chong alien card from hand");
  assert.deepEqual(harness.getHandled(), { type: "play-card", handIndex: 0, confirmed: true });
}

{
  const harness = createAiControllerHarness(null, {
    currentPlayerColor: "blue",
    playCardSelectionActive: true,
    runezuQuick: true,
    blueHand: [runezu.createAlienCard(4, 1)],
  });
  assert.equal(
    harness.controller.configureAiAutoBattle({
      playerIds: [harness.blue.id],
      suppressAutoSchedule: true,
    }).ok,
    true,
  );

  const result = harness.controller.runAiAutomationStep();
  assert.equal(result.blocked, true, "AI should wait on Runezu task cards until the next task symbol has a face reward");
  assert.equal(harness.getHandled(), null);
}

{
  const harness = createAiControllerHarness(null, {
    currentPlayerColor: "blue",
    playCardSelectionActive: true,
    runezuQuick: true,
    runezuFaceSymbolSlots: { 4: "symbol_4" },
    blueHand: [runezu.createAlienCard(4, 1)],
  });
  assert.equal(
    harness.controller.configureAiAutoBattle({
      playerIds: [harness.blue.id],
      suppressAutoSchedule: true,
    }).ok,
    true,
  );

  const result = harness.controller.runAiAutomationStep();
  assert.equal(result.ok, true, "AI should play Runezu task cards once the next task symbol has a face reward");
  assert.deepEqual(harness.getHandled(), { type: "play-card", handIndex: 0, confirmed: true });
}

{
  const harness = createAiControllerHarness(null, {
    currentPlayerColor: "blue",
    playCardSelectionActive: true,
    blueHand: [{
      ...fangzhou.createCard2Definition("pink", 1),
      id: "fangzhou-card2-ai-test",
      faceUp: true,
      fangzhouCard2: true,
      fangzhouTraceType: "pink",
    }],
  });
  assert.equal(
    harness.controller.configureAiAutoBattle({
      playerIds: [harness.blue.id],
      suppressAutoSchedule: true,
    }).ok,
    true,
  );

  const result = harness.controller.runAiAutomationStep();
  assert.equal(result.ok, true, "AI should select a playable Fangzhou card2 from hand");
  assert.deepEqual(harness.getHandled(), { type: "play-card", handIndex: 0, confirmed: true });
}

{
  const harness = createAiControllerHarness(null, {
    currentPlayerColor: "blue",
    playCardSelectionActive: true,
    blueHand: [
      { id: "low-value-blank", cardName: "低价值空牌", price: 0 },
      {
        ...fangzhou.createCard2Definition("blue", 4),
        id: "fangzhou-card2-priority-test",
        faceUp: true,
        fangzhouCard2: true,
        fangzhouTraceType: "blue",
      },
    ],
  });
  assert.equal(
    harness.controller.configureAiAutoBattle({
      playerIds: [harness.blue.id],
      suppressAutoSchedule: true,
    }).ok,
    true,
  );

  const result = harness.controller.runAiAutomationStep();
  assert.equal(result.ok, true, "AI should prefer Fangzhou card2 advanced reward over a low-value blank card");
  assert.deepEqual(harness.getHandled(), { type: "play-card", handIndex: 1, confirmed: true });
}

{
  const harness = createAiControllerHarness(null);
  assert.equal(
    harness.controller.configureAiAutoBattle({
      playerIds: [harness.blue.id],
      stepDelayMs: 25,
      maxBugRepeats: 5,
      maxMovesPerTurn: 2,
      strategyWeights: { scan: 1.3, pass: 0.7 },
      suppressAutoSchedule: true,
    }).ok,
    true,
  );

  const snapshot = harness.controller.createAiControlSnapshot();
  assert.equal(snapshot.enabled, true);
  assert.deepEqual(snapshot.playerIds, [harness.blue.id]);
  assert.equal(snapshot.stepDelayMs, 25);
  assert.equal(snapshot.maxBugRepeats, 5);
  assert.equal(snapshot.maxMovesPerTurn, 2);
  assert.equal(snapshot.strategyWeights.scan, 1.3);

  const restored = createAiControllerHarness(null);
  const result = restored.controller.restoreAiControlSnapshot({
    ...snapshot,
    running: true,
    pausedOnBug: true,
  });
  assert.equal(result.ok, true, "valid AI control snapshot should restore");
  assert.equal(restored.controller.isAiAutoBattlePlayer(restored.blue.id), true);
  assert.equal(restored.controller.isAiAutoBattlePlayer(restored.white.id), false);
  assert.equal(restored.controller.isAiAutomationPaused(), false);
  assert.equal(result.clearedPausedOnBug, true);
  assert.equal(restored.controller.getAiStrategyWeights().scan, 1.3);
  assert.equal(restored.controller.getAiAutoBattleReport().running, false, "running state is never restored");

  const pausedRestore = createAiControllerHarness(null);
  const pausedResult = pausedRestore.controller.restoreAiControlSnapshot({
    ...snapshot,
    pausedOnBug: true,
  }, { restorePausedOnBug: true });
  assert.equal(pausedResult.ok, true);
  assert.equal(pausedRestore.controller.isAiAutomationPaused(), true);
}

{
  const harness = createAiControllerHarness(null);
  assert.equal(
    harness.controller.configureAiAutoBattle({
      playerIds: [harness.blue.id],
      suppressAutoSchedule: true,
    }).ok,
    true,
  );

  const missing = harness.controller.restoreAiControlSnapshot(null);
  assert.equal(missing.ok, true);
  assert.equal(missing.defaulted, true);
  assert.equal(missing.missing, true);
  assert.equal(harness.controller.isAiAutoBattlePlayer(harness.blue.id), true);
  assert.equal(harness.controller.isAiAutoBattlePlayer(harness.white.id), false);

  const manual = harness.controller.restoreAiControlSnapshot({
    enabled: false,
    playerIds: [],
  });
  assert.equal(manual.ok, true);
  assert.equal(manual.disabled, true);
  assert.equal(harness.controller.isAiAutoBattlePlayer(harness.blue.id), false);

  const invalid = harness.controller.restoreAiControlSnapshot({
    enabled: true,
    playerIds: ["missing-player"],
  });
  assert.equal(invalid.ok, true);
  assert.equal(invalid.defaulted, true);
  assert.equal(invalid.invalidPlayerIds, true);
  assert.equal(harness.controller.isAiAutoBattlePlayer(harness.blue.id), true);
  assert.equal(harness.controller.isAiAutoBattlePlayer(harness.white.id), false);
}

{
  const turnChoices = [];
  const harness = createAiControllerHarness(null, {
    currentPlayerColor: "blue",
    roundNumber: 5,
    canStartMainAction: true,
    recordResearchTech: true,
    blueResources: { score: 98, credits: 6, energy: 4, handSize: 0 },
    blueOwnedTechTiles: {
      orange1: true,
      purple1: true,
      blue1: true,
      blue2: true,
    },
    blueTechCounts: { orange: 1, purple: 1, blue: 2 },
    finalScoringState: {
      tiles: {
        final_b1: {
          id: "final_b1",
          marks: [{ playerId: "player-blue", slotIndex: 1, threshold: 25 }],
        },
        final_c2: {
          id: "final_c2",
          marks: [{ playerId: "player-blue", slotIndex: 1, threshold: 50 }],
        },
        final_d1: {
          id: "final_d1",
          marks: [{ playerId: "player-blue", slotIndex: 1, threshold: 70 }],
        },
      },
    },
    finalFormulaIds: {
      final_b1: "b1",
      final_c2: "c2",
      final_d1: "d1",
    },
    finalSlotMultipliers: {
      b1: { 1: 6 },
      c2: { 1: 6 },
      d1: { 1: 8 },
    },
    takeableTechIds: ["orange2", "purple2", "blue3"],
    techStacks: {
      orange2: { techType: "orange", stackIndex: 2 },
      purple2: { techType: "purple", stackIndex: 2 },
      blue3: { techType: "blue", stackIndex: 3 },
    },
    onChooseTurnAction: (candidates) => turnChoices.push(candidates),
    chooseTurnAction: (candidates) => candidates
      .slice()
      .filter((candidate) => candidate.available !== false)
      .sort((left, right) => Number(right.score || 0) - Number(left.score || 0))[0] || null,
  });
  assert.equal(
    harness.controller.configureAiAutoBattle({
      playerIds: [harness.blue.id],
      suppressAutoSchedule: true,
    }).ok,
    true,
  );

  const result = harness.controller.runAiAutomationStep();
  assert.equal(result.ok, true, "AI should execute the low-tech catch-up research action");
  assert.deepEqual(harness.getHandled(), { type: "research-tech" });
  const researchCandidate = turnChoices
    .flat()
    .find((candidate) => candidate.id === "researchTech");
  assert.ok(researchCandidate, "researchTech candidate should be enumerated");
  assert.ok(
    researchCandidate.takeable.some((candidate) => (
      Number(candidate.valueBreakdown?.lowTechCatchupValue || 0) > 0
    )),
    "low-tech D1 tail should receive an explicit lowTechCatchupValue",
  );
  const passCandidate = turnChoices.flat().find((candidate) => candidate.id === "pass");
  assert.ok(
    Number(researchCandidate.score || 0) > Number(passCandidate?.score || -Infinity),
    "low-tech catch-up research should outrank PASS",
  );
}

{
  const turnChoices = [];
  const placedTokens = Array.from({ length: 6 }, (_item, index) => ({ placementSlot: index + 1 }));
  const harness = createAiControllerHarness(null, {
    currentPlayerColor: "blue",
    roundNumber: 5,
    canStartMainAction: true,
    recordAnalyze: true,
    blueResources: { score: 75, credits: 1, energy: 1, publicity: 1, availableData: 0, handSize: 3 },
    finalScoringState: {
      tiles: {
        final_a2: {
          id: "final_a2",
          marks: [{ playerId: "player-blue", slotIndex: 1, threshold: 25 }],
        },
        final_b2: {
          id: "final_b2",
          marks: [{ playerId: "player-blue", slotIndex: 1, threshold: 50 }],
        },
        final_d2: {
          id: "final_d2",
          marks: [{ playerId: "player-blue", slotIndex: 1, threshold: 70 }],
        },
      },
    },
    finalFormulaIds: {
      final_a2: "a2",
      final_b2: "b2",
      final_d2: "d2",
    },
    data: {
      ANALYZE_REQUIRED_COMPUTER_SLOT: 6,
      ANALYZE_ENERGY_COST: 1,
      canAnalyzeData: () => ({ ok: true }),
      listComputerPlacedTokens: () => placedTokens,
    },
    onChooseTurnAction: (candidates) => turnChoices.push(candidates),
    chooseTurnAction: (candidates) => candidates.find((candidate) => candidate.id === "analyze") || null,
  });
  assert.equal(
    harness.controller.configureAiAutoBattle({
      playerIds: [harness.blue.id],
      suppressAutoSchedule: true,
    }).ok,
    true,
  );

  const result = harness.controller.runAiAutomationStep();
  assert.equal(result.ok, true, "AI should execute the capped analyze action in the harness");
  assert.deepEqual(harness.getHandled(), { type: "analyze" });
  const analyzeCandidate = turnChoices
    .flat()
    .find((candidate) => candidate.id === "analyze");
  assert.ok(analyzeCandidate, "analyze candidate should be enumerated");
  assert.ok(
    Number(analyzeCandidate.score || 0) <= 8,
    "final low-value analyze should be capped instead of scoring like a high-value cashout",
  );
}

{
  const passCards = [
    {
      id: "reserve-low",
      cardName: "Reserve low",
      typeCode: 1,
      price: 1,
    },
    {
      id: "reserve-type3",
      cardName: "Reserve type 3",
      typeCode: 3,
      price: 2,
    },
  ];
  const harness = createAiControllerHarness(null, {
    currentPlayerColor: "blue",
    roundNumber: 2,
    blueResources: { score: 39, credits: 1, energy: 0, publicity: 1, availableData: 0, handSize: 4 },
    pendingPassReserveSelection: {
      playerId: "player-blue",
      roundNumber: 2,
      effectId: "pass-reserve-pick",
      selectedCardId: null,
    },
    passReserveCards: passCards,
    finalScoringState: {
      tiles: {
        final_c2: {
          id: "final_c2",
          marks: [{ playerId: "player-blue", slotIndex: 1, threshold: 25 }],
        },
      },
    },
    finalFormulaIds: {
      final_c2: "c2",
    },
    finalSlotMultipliers: {
      c2: { 1: 6 },
    },
  });
  assert.equal(
    harness.controller.configureAiAutoBattle({
      playerIds: [harness.blue.id],
      suppressAutoSchedule: true,
    }).ok,
    true,
  );

  const result = harness.controller.runAiAutomationStep();
  assert.equal(result.ok, true, "AI should resolve PASS reserve selection without entering full action scoring");
  assert.deepEqual(harness.getHandled(), { type: "pass-reserve", cardId: "reserve-type3" });
}

{
  const harness = createAiControllerHarness(null, {
    currentPlayerColor: "blue",
    actionEffectFlowActive: true,
    recordExecuteActionEffect: true,
    currentActionEffect: {
      id: "research-tech-bonus",
      type: "research_tech_bonus",
      label: "获取3 分",
      status: "active",
      playerId: "player-blue",
    },
    pendingActionEffectFlow: {
      playerId: "player-blue",
      currentIndex: 0,
      effects: [],
    },
  });
  assert.equal(
    harness.controller.configureAiAutoBattle({
      playerIds: [harness.blue.id],
      suppressAutoSchedule: true,
    }).ok,
    true,
  );

  const result = harness.controller.runAiAutomationStep();
  assert.equal(result.ok, true, "AI should execute active research tech bonus before optional opportunity scans");
  assert.deepEqual(harness.getHandled(), {
    type: "effect",
    effectId: "research-tech-bonus",
    effectType: "research_tech_bonus",
  });
}

{
  const harness = createAiControllerHarness(null, {
    currentPlayerColor: "blue",
    readyBanrenmaPlayerColor: "blue",
    actionEffectFlowActive: true,
    recordExecuteActionEffect: true,
    currentActionEffect: {
      id: "research-tech-bonus",
      type: "research_tech_bonus",
      label: "获取1 能量",
      status: "active",
      playerId: "player-blue",
    },
    pendingActionEffectFlow: {
      playerId: "player-blue",
      currentIndex: 0,
      effects: [],
    },
  });
  assert.equal(
    harness.controller.configureAiAutoBattle({
      playerIds: [harness.blue.id],
      suppressAutoSchedule: true,
    }).ok,
    true,
  );

  const result = harness.controller.runAiAutomationStep();
  assert.equal(result.ok, true, "AI should execute active effects before opening ready Banrenma opportunities");
  assert.deepEqual(harness.getHandled(), {
    type: "effect",
    effectId: "research-tech-bonus",
    effectType: "research_tech_bonus",
  });
}

{
  const purpleTechEffect = {
    id: "b31-purple-tech",
    type: "card_research_tech",
    label: "科技（只能选择紫色）",
    status: "active",
    playerId: "player-blue",
    options: { techTypes: ["purple"], skipCost: true },
  };
  const harness = createAiControllerHarness(null, {
    currentPlayerColor: "blue",
    actionEffectFlowActive: true,
    recordSupplyTechSelection: true,
    currentActionEffect: purpleTechEffect,
    pendingActionEffectFlow: {
      playerId: "player-blue",
      currentIndex: 0,
      effects: [purpleTechEffect],
    },
    takeableTechIds: ["orange2", "purple2", "blue3"],
    techStacks: {
      orange2: { techType: "orange", stackIndex: 2 },
      purple2: { techType: "purple", stackIndex: 2 },
      blue3: { techType: "blue", stackIndex: 3 },
    },
  });
  assert.equal(
    harness.controller.configureAiAutoBattle({
      playerIds: [harness.blue.id],
      suppressAutoSchedule: true,
    }).ok,
    true,
  );

  const result = harness.controller.runAiAutomationStep();
  assert.equal(result.ok, true, "AI should choose a tile for active card research-tech effects");
  assert.deepEqual(harness.getHandled(), { type: "supply-tech", tileId: "purple2" });
}

{
  const harness = createAiControllerHarness(null, {
    currentPlayerColor: "blue",
    pendingActionExecuted: true,
    blueResources: { score: 50, credits: 1, energy: 0, publicity: 2, availableData: 1, handSize: 1 },
    data: {
      PLACEMENT_KIND_COMPUTER: "computer",
      PLACEMENT_KIND_BLUE_BONUS: "blueBonus",
      canPlaceAnyData: () => ({
        ok: true,
        choices: [{
          target: "computer",
          placementSlot: 4,
          label: "第一排放置位 4",
          description: "按从左到右放入第一排第 4 位",
        }],
      }),
    },
  });
  assert.equal(
    harness.controller.configureAiAutoBattle({
      playerIds: [harness.blue.id],
      suppressAutoSchedule: true,
    }).ok,
    true,
  );

  const result = harness.controller.runAiAutomationStep();
  assert.equal(result.ok, true, "AI should directly confirm data placement quick candidates");
  assert.deepEqual(harness.getHandled(), {
    type: "data-placement",
    target: "computer",
    blueSlot: null,
  });
}

{
  const chongTransportTask = {
    kind: "transport",
    destinationPlanetId: "earth",
    fossilRewardRepeat: 1,
    gain: { score: 3 },
  };
  const harness = createAiControllerHarness(null, {
    currentPlayerColor: "blue",
    recordOpenCardTask: true,
    readyCardTasks: [
      {
        card: { id: "normal-ready", cardName: "Normal ready" },
        task: { id: "normal-task" },
        effects: [{ type: "gain_resources", options: { gain: { score: 1 } } }],
      },
      {
        chongTask: true,
        card: {
          id: "chong-ready",
          cardName: "Chong ready",
          chongCard: true,
          chongTask: chongTransportTask,
        },
        task: chongTransportTask,
        deliveredTransport: {
          rocketId: 77,
          fossil: { fossilId: "fossil_02" },
          task: { fossilId: "fossil_02" },
        },
        effects: [],
      },
    ],
  });
  assert.equal(
    harness.controller.configureAiAutoBattle({
      playerIds: [harness.blue.id],
      suppressAutoSchedule: true,
    }).ok,
    true,
  );

  const result = harness.controller.runAiAutomationStep();
  assert.equal(result.ok, true, "AI should open delivered Chong transport tasks aggressively");
  assert.deepEqual(harness.getHandled(), { type: "open-card-task", cardId: "chong-ready" });
}

{
  const turnChoices = [];
  const harness = createAiControllerHarness(null, {
    currentPlayerColor: "blue",
    roundNumber: 5,
    canStartMainAction: true,
    recordBeginPlayCard: true,
    blueResources: { score: 75, credits: 2, energy: 0, publicity: 1, availableData: 0, handSize: 1 },
    blueHand: [{
      id: "loose-final-task",
      cardName: "Loose final task",
      price: 0,
      model: {
        tasks: [{
          id: "loose-task",
          condition: { type: "unreachableInHarness" },
          rewards: [{ type: "gain_resources", options: { gain: { score: 5 } } }],
        }],
      },
    }],
    finalScoringState: {
      tiles: {
        final_a2: {
          id: "final_a2",
          marks: [{ playerId: "player-blue", slotIndex: 1, threshold: 25 }],
        },
        final_b2: {
          id: "final_b2",
          marks: [{ playerId: "player-blue", slotIndex: 1, threshold: 50 }],
        },
        final_d2: {
          id: "final_d2",
          marks: [{ playerId: "player-blue", slotIndex: 1, threshold: 70 }],
        },
      },
    },
    finalFormulaIds: {
      final_a2: "a2",
      final_b2: "b2",
      final_d2: "d2",
    },
    onChooseTurnAction: (candidates) => turnChoices.push(candidates),
    chooseTurnAction: (candidates) => candidates.find((candidate) => candidate.id === "playCard") || null,
  });
  assert.equal(
    harness.controller.configureAiAutoBattle({
      playerIds: [harness.blue.id],
      suppressAutoSchedule: true,
    }).ok,
    true,
  );

  const result = harness.controller.runAiAutomationStep();
  assert.equal(result.ok, true, "AI should execute the loose task play-card harness action");
  assert.deepEqual(harness.getHandled(), { type: "begin-play-card" });
  const playCardCandidate = turnChoices
    .flat()
    .find((candidate) => candidate.id === "playCard");
  const looseTaskCandidate = playCardCandidate?.playableCards?.[0] || null;
  assert.ok(looseTaskCandidate, "loose task play-card candidate should be enumerated");
  assert.equal(
    Number(looseTaskCandidate.valueBreakdown?.playCardConversionPressure || 0),
    0,
    "final loose task with no route/C-final value should not receive conversion pressure",
  );
}

{
  const turnChoices = [];
  const harness = createAiControllerHarness(null, {
    currentPlayerColor: "blue",
    roundNumber: 5,
    canStartMainAction: true,
    realisticCanAfford: true,
    enableQuickTrades: true,
    recordQuickTrade: true,
    blueResources: { score: 145, credits: 1, energy: 0, publicity: 1, availableData: 0, handSize: 4 },
    blueHand: [
      {
        id: "tail-score-card",
        cardName: "Tail score card",
        price: 2,
        playEffects: [{ type: "gain_resources", options: { gain: { score: 16 } } }],
      },
      { id: "filler-a", cardName: "Filler A", price: 2 },
      { id: "filler-b", cardName: "Filler B", price: 2 },
      { id: "filler-c", cardName: "Filler C", price: 2 },
    ],
    finalScoringState: {
      tiles: {
        final_a1: {
          id: "final_a1",
          marks: [{ playerId: "player-blue", slotIndex: 1, threshold: 25 }],
        },
        final_b1: {
          id: "final_b1",
          marks: [{ playerId: "player-blue", slotIndex: 1, threshold: 50 }],
        },
        final_d1: {
          id: "final_d1",
          marks: [{ playerId: "player-blue", slotIndex: 1, threshold: 70 }],
        },
      },
    },
    finalFormulaIds: {
      final_a1: "a1",
      final_b1: "b1",
      final_d1: "d1",
    },
    onChooseTurnAction: (candidates) => turnChoices.push(candidates),
    chooseTurnAction: (candidates) => candidates
      .slice()
      .filter((candidate) => candidate.available !== false)
      .sort((left, right) => Number(right.score || 0) - Number(left.score || 0))[0] || null,
  });
  assert.equal(
    harness.controller.configureAiAutoBattle({
      playerIds: [harness.blue.id],
      suppressAutoSchedule: true,
    }).ok,
    true,
  );

  const result = harness.controller.runAiAutomationStep();
  assert.equal(result.ok, true, "AI should trade cards for a credit to unlock a concrete tail scoring card");
  assert.deepEqual(harness.getHandled(), { type: "quick-trade", tradeId: "cards-for-credit" });
  const tradeCandidate = turnChoices
    .flat()
    .find((candidate) => candidate.id === "quickTrade" && candidate.tradeId === "cards-for-credit");
  assert.ok(tradeCandidate, "cards-for-credit unlock candidate should be enumerated");
  assert.ok(
    Number(tradeCandidate.valueBreakdown?.concreteFinalValue || 0) > 0,
    "tail unlock trade should still require concrete score/final value",
  );
}

console.log("app/ai-controller.test.js ok");
