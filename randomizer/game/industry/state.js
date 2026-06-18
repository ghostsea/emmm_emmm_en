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
    return player;
  }

  function isIndustryActionMarkedThisRound(player, roundNumber) {
    const state = ensurePlayerIndustryState(player);
    if (!state) return false;
    const round = Math.max(0, Math.round(Number(roundNumber) || 0));
    return state.industryRoundMarkRound === round && round > 0;
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
    const round = Math.max(0, Math.round(Number(roundNumber) || 0));
    if (round <= 0) {
      return { ok: false, message: "当前轮次无效" };
    }
    if (isIndustryActionMarkedThisRound(player, round)) {
      return { ok: false, message: "本轮已使用过公司 1x 行动标记" };
    }
    return { ok: true, message: "可以放置公司行动标记" };
  }

  function markIndustryAction(player, roundNumber) {
    const check = canMarkIndustryAction(player, roundNumber);
    if (!check.ok) return { ...check, player };

    const state = ensurePlayerIndustryState(player);
    const round = Math.max(1, Math.round(Number(roundNumber) || 1));
    state.industryRoundMarkRound = round;
    return {
      ok: true,
      player: state,
      roundNumber: round,
      message: "已放置公司 1x 行动标记",
    };
  }

  function resetPlayerIndustryActionMark(player) {
    if (!player) return player;
    player.industryRoundMarkRound = 0;
    return player;
  }

  function resetAllIndustryActionMarks(players) {
    (players || []).forEach(resetPlayerIndustryActionMark);
  }

  function createIndustryMarkUndoCommand(player, previousRoundMark, label) {
    const snapshot = Number.isInteger(previousRoundMark) ? previousRoundMark : 0;
    return {
      label: label || "撤销公司 1x 行动标记",
      undo() {
        if (!player) return;
        player.industryRoundMarkRound = snapshot;
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
    createIndustryMarkUndoCommand,
  });
});
