(function (root, factory) {
  "use strict";

  const api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.SetiIndustryState = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function () {
  "use strict";

  function ensurePlayerIndustryState(player) {
    if (!player) return null;
    if (!Number.isInteger(player.industryRoundMarkRound)) {
      player.industryRoundMarkRound = 0;
    }
    if (!Number.isInteger(player.industryRoundMarkTurn)) {
      player.industryRoundMarkTurn = 0;
    }
    return player;
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

  function resetRoundIndustryRuntimeState(player) {
    if (!player) return player;
    player.industryBorrowedTechTileId = null;
    player.industryBorrowedTechRound = 0;
    player.industryBorrowedTechTurn = 0;
    player.industrySentinelArmedRound = 0;
    player.industrySentinelArmedTurn = 0;
    player.industryHuanyuFreeMoveRound = 0;
    player.industryHuanyuFreeMoveTurn = 0;
    player.industryHuanyuFreeMovesLeft = 0;
    player.industryHuanyuMovedRocketIds = [];
    player.industryPlayedCardThisRound = false;
    player.industryLastPlayedCardThisRound = null;
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
    ensurePlayerIndustryState,
    isIndustryActionMarkedThisRound,
    canMarkIndustryAction,
    markIndustryAction,
    resetPlayerIndustryActionMark,
    resetAllIndustryActionMarks,
    resetRoundIndustryRuntimeState,
    resetAllRoundIndustryRuntimeState,
    createIndustryMarkUndoCommand,
  });
});
