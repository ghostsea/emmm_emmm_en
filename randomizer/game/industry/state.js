(function (root, factory) {
  "use strict";

  const api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.SetiIndustryState = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function () {
  "use strict";

  const ALIEN_LAB_PANEL_IDS = Object.freeze(["blue", "yellow", "pink"]);
  const ALIEN_LAB_TRACE_TO_PANEL = Object.freeze({
    blue: "blue",
    yellow: "yellow",
    pink: "pink",
  });
  const ALIEN_LAB_PANEL_LABELS = Object.freeze({
    blue: "蓝色",
    yellow: "黄色",
    pink: "粉色",
  });
  const FUTURE_SPAN_DELTAS_BY_COST = Object.freeze({
    1: 15,
    2: 25,
    3: 35,
    4: 45,
  });

  function cloneIndustryValue(value) {
    if (value == null) return value;
    if (typeof structuredClone === "function") {
      return structuredClone(value);
    }
    return JSON.parse(JSON.stringify(value));
  }

  function createAlienLabPanels() {
    return {
      blue: true,
      yellow: true,
      pink: true,
    };
  }

  function createFutureSpanState() {
    return {
      card: null,
      targetScore: null,
      playing: false,
    };
  }

  function ensurePlayerIndustryState(player) {
    if (!player) return null;
    if (!Number.isInteger(player.industryRoundMarkRound)) {
      player.industryRoundMarkRound = 0;
    }
    if (!Number.isInteger(player.industryRoundMarkTurn)) {
      player.industryRoundMarkTurn = 0;
    }
    if (!player.industryStrategyPassiveSlots) {
      player.industryStrategyPassiveSlots = {
        yellow: false,
        red: false,
        blue: false,
      };
    }
    ensureAlienLabPanels(player);
    ensureFutureSpanState(player);
    return player;
  }

  function ensureAlienLabPanels(player) {
    if (!player) return null;
    if (!player.industryAlienLabPanels || typeof player.industryAlienLabPanels !== "object") {
      player.industryAlienLabPanels = createAlienLabPanels();
    }
    for (const panelId of ALIEN_LAB_PANEL_IDS) {
      if (typeof player.industryAlienLabPanels[panelId] !== "boolean") {
        player.industryAlienLabPanels[panelId] = true;
      }
    }
    return player.industryAlienLabPanels;
  }

  function initializeAlienLabPanels(player) {
    const panels = ensureAlienLabPanels(player);
    if (!panels) {
      return { ok: false, message: "没有玩家" };
    }
    player.industryAlienLabInitialized = true;
    return {
      ok: true,
      player,
      message: "已初始化异星实验室板块",
    };
  }

  function isAlienLabPanelFaceUp(player, panelId) {
    const panels = ensureAlienLabPanels(player);
    if (!panels || !ALIEN_LAB_PANEL_IDS.includes(panelId)) return false;
    return panels[panelId] !== false;
  }

  function consumeAlienLabPanel(player, panelId) {
    const panels = ensureAlienLabPanels(player);
    if (!panels || !ALIEN_LAB_PANEL_IDS.includes(panelId)) {
      return { ok: false, player, changed: false, message: "未知异星实验室板块" };
    }
    if (panels[panelId] === false) {
      return { ok: true, player, changed: false, panelId, message: "异星实验室板块已为背面" };
    }
    panels[panelId] = false;
    return {
      ok: true,
      player,
      changed: true,
      panelId,
      message: `异星实验室${ALIEN_LAB_PANEL_LABELS[panelId]}板块已翻面`,
    };
  }

  function restoreAlienLabPanelForTrace(player, traceType) {
    const panelId = ALIEN_LAB_TRACE_TO_PANEL[traceType];
    const panels = ensureAlienLabPanels(player);
    if (!panels || !panelId) {
      return { ok: false, player, changed: false, message: "该痕迹不对应异星实验室板块" };
    }
    if (panels[panelId] === true) {
      return { ok: true, player, changed: false, panelId, message: "异星实验室板块已为正面" };
    }
    panels[panelId] = true;
    return {
      ok: true,
      player,
      changed: true,
      panelId,
      message: `异星实验室${ALIEN_LAB_PANEL_LABELS[panelId]}板块已恢复正面`,
    };
  }

  function createAlienLabPanelSnapshot(player) {
    return cloneIndustryValue(ensureAlienLabPanels(player));
  }

  function restoreAlienLabPanelSnapshot(player, snapshot) {
    if (!player) return player;
    player.industryAlienLabPanels = cloneIndustryValue(snapshot || createAlienLabPanels());
    return player;
  }

  function ensureFutureSpanState(player) {
    if (!player) return null;
    if (!player.industryFutureSpan || typeof player.industryFutureSpan !== "object") {
      player.industryFutureSpan = createFutureSpanState();
    }
    if (!Object.prototype.hasOwnProperty.call(player.industryFutureSpan, "card")) {
      player.industryFutureSpan.card = null;
    }
    if (!Number.isFinite(Number(player.industryFutureSpan.targetScore))) {
      player.industryFutureSpan.targetScore = null;
    } else {
      player.industryFutureSpan.targetScore = Math.round(Number(player.industryFutureSpan.targetScore));
    }
    player.industryFutureSpan.playing = Boolean(player.industryFutureSpan.playing);
    return player.industryFutureSpan;
  }

  function initializeFutureSpanState(player) {
    const futureState = ensureFutureSpanState(player);
    if (!futureState) {
      return { ok: false, message: "没有玩家" };
    }
    player.industryFutureSpanInitialized = true;
    return {
      ok: true,
      player,
      message: "已初始化未来跨度专属标记",
    };
  }

  function createFutureSpanSnapshot(player) {
    return cloneIndustryValue(ensureFutureSpanState(player));
  }

  function restoreFutureSpanSnapshot(player, snapshot) {
    if (!player) return player;
    player.industryFutureSpan = cloneIndustryValue(snapshot || createFutureSpanState());
    return player;
  }

  function hasFutureSpanCard(player) {
    return Boolean(ensureFutureSpanState(player)?.card);
  }

  function getFutureSpanCard(player) {
    return ensureFutureSpanState(player)?.card || null;
  }

  function getFutureSpanTargetScore(player) {
    const targetScore = ensureFutureSpanState(player)?.targetScore;
    return Number.isFinite(Number(targetScore)) ? Math.round(Number(targetScore)) : null;
  }

  function isFutureSpanCardReady(player) {
    const futureState = ensureFutureSpanState(player);
    if (!futureState?.card || futureState.playing) return false;
    const targetScore = getFutureSpanTargetScore(player);
    if (!Number.isFinite(Number(targetScore))) return false;
    return Number(player?.resources?.score || 0) >= targetScore;
  }

  function canParkFutureSpanCard(player) {
    const futureState = ensureFutureSpanState(player);
    if (!futureState) return { ok: false, message: "没有玩家" };
    if (futureState.card || futureState.playing) {
      return { ok: false, message: "未来跨度专属标记已有目标牌" };
    }
    return { ok: true, message: "可以放置未来跨度专属标记" };
  }

  function parkFutureSpanCard(player, card, targetScore) {
    const check = canParkFutureSpanCard(player);
    if (!check.ok) return { ...check, player };
    if (!card) return { ok: false, player, message: "未选择卡牌" };
    const score = Math.round(Number(targetScore));
    if (!Number.isFinite(score)) {
      return { ok: false, player, message: "目标分数无效" };
    }
    const futureState = ensureFutureSpanState(player);
    futureState.card = cloneIndustryValue(card);
    futureState.targetScore = score;
    futureState.playing = false;
    return {
      ok: true,
      player,
      card: futureState.card,
      targetScore: score,
      message: "已放置未来跨度专属标记",
    };
  }

  function advanceFutureSpanTarget(player, amount = 3) {
    const futureState = ensureFutureSpanState(player);
    if (!futureState?.card) {
      return { ok: false, player, message: "未来跨度专属标记尚未锁定目标牌" };
    }
    if (futureState.playing || isFutureSpanCardReady(player)) {
      return { ok: false, player, message: "未来跨度目标牌已可打出" };
    }
    const currentTarget = getFutureSpanTargetScore(player);
    if (!Number.isFinite(Number(currentTarget))) {
      return { ok: false, player, message: "未来跨度目标分数无效" };
    }
    const delta = Math.round(Number(amount) || 0);
    futureState.targetScore = currentTarget + delta;
    return {
      ok: true,
      player,
      targetScore: futureState.targetScore,
      message: `未来跨度目标分数已提高 ${delta}`,
    };
  }

  function markFutureSpanPlaying(player) {
    const futureState = ensureFutureSpanState(player);
    if (!futureState?.card) {
      return { ok: false, player, message: "未来跨度没有可打出的目标牌" };
    }
    futureState.playing = true;
    return {
      ok: true,
      player,
      card: futureState.card,
      message: "未来跨度目标牌进入打牌流程",
    };
  }

  function clearFutureSpanState(player) {
    if (!player) return player;
    player.industryFutureSpan = createFutureSpanState();
    return player;
  }

  function initializeStrategyPassiveMarkers(player) {
    const state = ensurePlayerIndustryState(player);
    if (!state) {
      return { ok: false, message: "没有玩家" };
    }
    state.industryStrategyPassiveInitialized = true;
    return {
      ok: true,
      player: state,
      message: "已初始化宇宙战略集团被动标记槽位",
    };
  }

  function canPlaceStrategyPassiveSlot(player, slotId) {
    const state = ensurePlayerIndustryState(player);
    if (!state) {
      return { ok: false, message: "没有玩家" };
    }
    if (!state.industryStrategyPassiveSlots[slotId]) {
      return { ok: true, message: "可以放置被动标记" };
    }
    return { ok: false, message: "该槽位已有标记" };
  }

  function placeStrategyPassiveSlot(player, slotId) {
    const check = canPlaceStrategyPassiveSlot(player, slotId);
    if (!check.ok) return { ...check, player };

    const state = ensurePlayerIndustryState(player);
    state.industryStrategyPassiveSlots[slotId] = true;
    return {
      ok: true,
      player: state,
      slotId,
      message: "已放置宇宙战略集团被动标记",
    };
  }

  function isStrategyPassiveSlotMarked(player, slotId) {
    return Boolean(ensurePlayerIndustryState(player)?.industryStrategyPassiveSlots?.[slotId]);
  }

  function normalizeRoundNumber(roundNumber) {
    return Math.max(0, Math.round(Number(roundNumber) || 0));
  }

  function normalizeTurnNumber(turnNumber) {
    return Math.max(0, Math.round(Number(turnNumber) || 0));
  }

  function resolveTurnNumber(input) {
    if (input && typeof input === "object") return normalizeTurnNumber(input.turnNumber);
    return normalizeTurnNumber(input == null ? 1 : input);
  }

  function isIndustryActionMarkedThisRound(player, roundNumber, turnNumber = 1) {
    const state = ensurePlayerIndustryState(player);
    if (!state) return false;
    const round = normalizeRoundNumber(roundNumber);
    return state.industryRoundMarkRound === round
      && round > 0;
  }

  function canMarkIndustryAction(player, roundNumber, options = {}) {
    if (!player) {
      return { ok: false, message: "没有玩家" };
    }
    if (options.requireIndustryCard && !options.industryCard) {
      return { ok: false, message: "未选择公司牌" };
    }
    if (options.hasMarker === false) {
      return { ok: false, message: "该公司没有 1x 行动标记位" };
    }
    const round = normalizeRoundNumber(roundNumber);
    if (round <= 0) {
      return { ok: false, message: "当前轮次无效" };
    }
    if (isIndustryActionMarkedThisRound(player, round)) {
      return { ok: false, message: "本轮已使用过公司 1x 行动标记" };
    }
    return { ok: true, message: "可以放置公司行动标记" };
  }

  function markIndustryAction(player, roundNumber, options = {}) {
    const check = canMarkIndustryAction(player, roundNumber, options);
    if (!check.ok) return { ...check, player };

    const state = ensurePlayerIndustryState(player);
    const round = Math.max(1, normalizeRoundNumber(roundNumber));
    const turn = Math.max(1, resolveTurnNumber(options));
    state.industryRoundMarkRound = round;
    state.industryRoundMarkTurn = turn;
    return {
      ok: true,
      player: state,
      roundNumber: round,
      turnNumber: turn,
      message: "已放置公司 1x 行动标记",
    };
  }

  function resetPlayerIndustryActionMark(player) {
    if (!player) return player;
    player.industryRoundMarkRound = 0;
    player.industryRoundMarkTurn = 0;
    resetRoundIndustryRuntimeState(player);
    return player;
  }

  function resetAllIndustryActionMarks(players) {
    (players || []).forEach(resetPlayerIndustryActionMark);
  }

  function clearTuringBorrowedTech(player) {
    if (!player) return { cleared: false };
    const cleared = Boolean(player.industryBorrowedTechTileId)
      || Boolean(player.industryBorrowedTechRound)
      || Boolean(player.industryBorrowedTechTurn);
    player.industryBorrowedTechTileId = null;
    player.industryBorrowedTechRound = 0;
    player.industryBorrowedTechTurn = 0;
    return { cleared };
  }

  function clearSentinelPlayCornerState(player) {
    if (!player) return { cleared: false };
    const cleared = Boolean(player.industrySentinelArmedRound)
      || Boolean(player.industrySentinelArmedTurn)
      || Boolean(player.industryPlayedCardThisRound)
      || Boolean(player.industryLastPlayedCardThisRound)
      || Boolean(player.industryPlayedCardRound)
      || Boolean(player.industryPlayedCardTurn);
    player.industrySentinelArmedRound = 0;
    player.industrySentinelArmedTurn = 0;
    player.industryPlayedCardThisRound = false;
    player.industryLastPlayedCardThisRound = null;
    player.industryPlayedCardRound = 0;
    player.industryPlayedCardTurn = 0;
    return { cleared };
  }

  function resetRoundIndustryRuntimeState(player) {
    if (!player) return player;
    clearTuringBorrowedTech(player);
    clearSentinelPlayCornerState(player);
    player.industryHuanyuFreeMoveRound = 0;
    player.industryHuanyuFreeMoveTurn = 0;
    player.industryHuanyuFreeMovesLeft = 0;
    player.industryHuanyuMovedRocketIds = [];
    // 仅清除「打牌触发的虚线交互」；industryStrategyPassiveSlots 跨轮保留，直到 1x 清槽
    player.industryStrategyPlayInteractionRound = 0;
    player.industryStrategyPlayScanCode = null;
    player.industryStrategyPlayInteractionPending = false;
    return player;
  }

  function resetAllRoundIndustryRuntimeState(players) {
    (players || []).forEach(resetRoundIndustryRuntimeState);
  }

  function createIndustryMarkUndoCommand(player, previousRoundMark, previousTurnMark = 0, label) {
    const snapshot = Number.isInteger(previousRoundMark) ? previousRoundMark : 0;
    const turnSnapshot = Number.isInteger(previousTurnMark) ? previousTurnMark : 0;
    return {
      label: label || "撤销公司 1x 行动标记",
      undo() {
        if (!player) return;
        player.industryRoundMarkRound = snapshot;
        player.industryRoundMarkTurn = turnSnapshot;
      },
    };
  }

  return Object.freeze({
    ALIEN_LAB_PANEL_IDS,
    ALIEN_LAB_TRACE_TO_PANEL,
    ALIEN_LAB_PANEL_LABELS,
    FUTURE_SPAN_DELTAS_BY_COST,
    createAlienLabPanels,
    createFutureSpanState,
    ensurePlayerIndustryState,
    isIndustryActionMarkedThisRound,
    canMarkIndustryAction,
    markIndustryAction,
    resetPlayerIndustryActionMark,
    resetAllIndustryActionMarks,
    resetRoundIndustryRuntimeState,
    resetAllRoundIndustryRuntimeState,
    clearTuringBorrowedTech,
    clearSentinelPlayCornerState,
    createIndustryMarkUndoCommand,
    initializeStrategyPassiveMarkers,
    canPlaceStrategyPassiveSlot,
    placeStrategyPassiveSlot,
    isStrategyPassiveSlotMarked,
    ensureAlienLabPanels,
    initializeAlienLabPanels,
    isAlienLabPanelFaceUp,
    consumeAlienLabPanel,
    restoreAlienLabPanelForTrace,
    createAlienLabPanelSnapshot,
    restoreAlienLabPanelSnapshot,
    ensureFutureSpanState,
    initializeFutureSpanState,
    createFutureSpanSnapshot,
    restoreFutureSpanSnapshot,
    hasFutureSpanCard,
    getFutureSpanCard,
    getFutureSpanTargetScore,
    isFutureSpanCardReady,
    canParkFutureSpanCard,
    parkFutureSpanCard,
    advanceFutureSpanTarget,
    markFutureSpanPlaying,
    clearFutureSpanState,
  });
});
