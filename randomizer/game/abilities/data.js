(function (root, factory) {
  "use strict";

  let players = root.SetiPlayers;
  let data = root.SetiData;
  let historyCommands = root.SetiHistoryCommands;

  if ((!players || !data || !historyCommands) && typeof require === "function") {
    players = players || require("../players");
    data = data || require("../data");
    historyCommands = historyCommands || require("../history/commands");
  }

  const api = factory(players, data, historyCommands);

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.SetiAbilityData = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function (
  players,
  data,
  historyCommands,
) {
  "use strict";

  function analyzeData(context, options = {}) {
    const player = players.getCurrentPlayer(context.playerState);
    if (!player) return { ok: false, abilityId: "analyzeData", message: "没有当前玩家" };

    const check = data.canAnalyzeData(player);
    if (!check.ok) return { ok: false, abilityId: "analyzeData", message: check.message };

    const snapshot = structuredClone(player);
    const result = data.analyzeData(player);
    if (!result.ok) return { ok: false, abilityId: "analyzeData", message: result.message };

    const message = options.message || result.message;
    return {
      ok: true,
      abilityId: "analyzeData",
      message,
      undoable: true,
      commands: [
        historyCommands.createRestorePlayerCommand(player, snapshot, "恢复分析前玩家状态"),
      ],
      cost: { energy: data.ANALYZE_ENERGY_COST },
      payload: {
        clearedCount: result.clearedCount,
      },
      events: [],
    };
  }

  return Object.freeze({
    analyzeData,
  });
});
