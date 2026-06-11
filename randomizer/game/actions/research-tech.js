(function (root, factory) {
  "use strict";

  let players = root.SetiPlayers;
  let catalog = root.SetiTechCatalog;
  let resolver = root.SetiTechResolver;

  if (typeof require === "function") {
    players = players || require("../players");
    catalog = catalog || require("../tech/catalog");
    resolver = resolver || require("../tech/resolver");
  }

  const api = factory(players, catalog, resolver);

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.SetiActionResearchTech = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function (players, catalog, resolver) {
  "use strict";

  const ACTION_ID = "researchTech";
  const ACTION_LABEL = "科技";

  function getPlayerTechState(context) {
    const currentPlayer = players.getCurrentPlayer(context.playerState);
    if (!currentPlayer) return { ok: false, message: "没有当前玩家" };

    if (!currentPlayer.techState && context.ensurePlayerTechState) {
      context.ensurePlayerTechState(currentPlayer);
    }

    if (!currentPlayer.techState) {
      return { ok: false, message: "玩家科技状态未初始化" };
    }

    return { ok: true, currentPlayer };
  }

  function canExecute(context) {
    const playerResult = getPlayerTechState(context);
    if (!playerResult.ok) return playerResult;

    const board = context.techBoardState;
    if (!board) return { ok: false, message: "科技版图状态未初始化" };

    const cheatMode = Boolean(context.techUiState?.cheatModeEnabled);
    if (!cheatMode && !players.canAfford(playerResult.currentPlayer, { publicity: catalog.RESEARCH_PUBLICITY_COST })) {
      return {
        ok: false,
        message: `宣传不足，研究科技需要 ${catalog.RESEARCH_PUBLICITY_COST} 宣传`,
      };
    }

    const takeable = resolver.listTakeableTiles(board, playerResult.currentPlayer.techState);
    if (!takeable.length) {
      return { ok: false, message: "没有可研究的科技板块" };
    }

    return { ok: true, message: null, takeable };
  }

  function execute(context, options = {}) {
    if (options.tileId) {
      return resolver.executeTakeTech(context, {
        tileId: options.tileId,
        blueSlot: options.blueSlot,
      });
    }

    const check = canExecute(context);
    if (!check.ok) {
      if (context.techUiState) context.techUiState.statusNote = check.message;
      return { ok: false, actionId: ACTION_ID, message: check.message };
    }

    if (context.techUiState) {
      context.techUiState.techSelectionActive = true;
      context.techUiState.statusNote = "请选择要研究的科技板块";
    }

    return {
      ok: true,
      actionId: ACTION_ID,
      awaitingTileSelection: true,
      takeable: check.takeable,
      message: "请选择要研究的科技板块",
    };
  }

  return Object.freeze({
    id: ACTION_ID,
    label: ACTION_LABEL,
    canExecute,
    execute,
  });
});
