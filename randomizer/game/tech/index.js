(function (root, factory) {
  "use strict";

  let catalog = root.SetiTechCatalog;
  let boardState = root.SetiTechBoardState;
  let playerTech = root.SetiPlayerTech;
  let placement = root.SetiTechPlacement;
  let bonuses = root.SetiTechBonuses;
  let resolver = root.SetiTechResolver;
  let render = root.SetiTechRender;

  if (typeof require === "function") {
    catalog = catalog || require("./catalog");
    boardState = boardState || require("./board-state");
    playerTech = playerTech || require("./player-tech");
    placement = placement || require("./placement");
    bonuses = bonuses || require("./bonuses");
    resolver = resolver || require("./resolver");
    render = render || require("./render");
  }

  const api = factory(catalog, boardState, playerTech, placement, bonuses, resolver, render);

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.SetiTech = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function (
  catalog,
  boardState,
  playerTech,
  placement,
  bonuses,
  resolver,
  render,
) {
  "use strict";

  function createUiState(source = {}) {
    return {
      cheatModeEnabled: Boolean(source.cheatModeEnabled ?? source.takeTechDebugEnabled),
      techSelectionActive: false,
      pendingTileId: null,
      selectedTileId: source.selectedTileId || null,
      selectedBlueSlot: source.selectedBlueSlot || null,
      statusNote: "",
    };
  }

  function createState() {
    const board = boardState.createBoardState();
    boardState.setupBoardBonuses(board);
    return {
      board,
      ui: createUiState(),
    };
  }

  function setupBoardBonuses(gameState, random) {
    boardState.setupBoardBonuses(gameState.board, random);
    return gameState;
  }

  function setCheatModeEnabled(gameState, enabled) {
    gameState.ui.cheatModeEnabled = enabled;
    return enabled;
  }

  function setTechSelectionActive(gameState, active) {
    gameState.ui.techSelectionActive = active;
    if (!active) {
      gameState.ui.pendingTileId = null;
      gameState.ui.selectedTileId = null;
      gameState.ui.selectedBlueSlot = null;
    }
    return active;
  }

  function cancelPendingTake(gameState) {
    gameState.ui.pendingTileId = null;
    gameState.ui.selectedTileId = null;
    gameState.ui.selectedBlueSlot = null;
    return { ok: true };
  }

  function requestTakeTech(context, gameState, tileId, options = {}) {
    const skipCost = Boolean(gameState.ui.cheatModeEnabled || options.skipCost);
    const skipRotation = Boolean(options.skipRotation);

    return resolver.executeTakeTech(context, {
      tileId,
      blueSlot: options.blueSlot,
      skipCost,
      skipRotation,
    });
  }

  function confirmBlueSlotChoice(context, gameState, tileId, blueSlot) {
    if (gameState.ui.pendingTileId !== tileId) {
      return { ok: false, message: "当前没有待放置的蓝色科技" };
    }
    return requestTakeTech(context, gameState, tileId, { blueSlot });
  }

  function getReadoutLines(gameState, playerState) {
    const board = gameState.board;
    const ui = gameState.ui;
    const currentPlayer = playerState?.players?.find((p) => p.id === playerState.currentPlayerId)
      || playerState?.players?.[0]
      || null;

    const supplyStacks = boardState.listSupplyStacks(board);
    const hasOwned = currentPlayer?.techState
      ? playerTech.listOwnedTileIds(currentPlayer.techState).length > 0
      : false;

    if (!supplyStacks.length && !hasOwned && !ui.statusNote) {
      return [];
    }

    const lines = ["科技状态"];

    lines.push("[槽位供给]");
    for (const tileId of catalog.TECH_TILE_IDS) {
      const stack = board.stacks[tileId];
      const remaining = boardState.getRemainingForSlot(board, tileId);
      const claimer = stack?.firstTakeClaimedBy;
      lines.push(
        `${tileId} 剩余 ${remaining}/${catalog.PIECES_PER_SLOT}`
        + ` ${claimer ? `首拿 ${claimer}` : "首拿未领"}`,
      );
    }

    if (currentPlayer?.techState) {
      const ownedTileIds = playerTech.listOwnedTileIds(currentPlayer.techState);
      lines.push(`[当前玩家科技] ${ownedTileIds.length}/${catalog.TECH_TILE_IDS.length}`);
      if (ownedTileIds.length) {
        lines.push(...ownedTileIds);
      } else {
        lines.push("无");
      }
    }

    if (hasOwned && currentPlayer?.techState) {
      lines.push("[玩家版图]");
      for (const tileId of playerTech.listOwnedTileIds(currentPlayer.techState)) {
        const blueSlot = playerTech.getBlueBoardSlot(currentPlayer.techState, tileId);
        const layout = placement.getPlacementLayout(tileId, blueSlot);
        if (!layout) continue;
        const slotLabel = blueSlot ? ` 槽位${blueSlot}` : "";
        lines.push(`${tileId} @玩家版图${slotLabel} 中心 ${layout.percentX}%,${layout.percentY}%`);
      }
    }

    if (supplyStacks.length) {
      lines.push("[待拿取科技信息]");
      lines.push(...supplyStacks.map((stack) => {
        const bonusLabel = catalog.BONUS_LABELS[stack.bonusId] || stack.bonusId;
        const remaining = boardState.getRemainingForSlot(board, stack.tileId);
        const firstTake = boardState.isFirstTakeAvailable(board, stack.tileId) ? " 可首拿+2分" : "";
        return `${stack.tileId} 剩${remaining} 奖励 ${bonusLabel}${firstTake}`;
      }));
    }

    if (ui.statusNote) lines.push(ui.statusNote);

    return lines;
  }

  function getSnapshot(gameState) {
    return {
      board: boardState.getSnapshot(gameState.board),
      ui: structuredClone(gameState.ui),
    };
  }

  return Object.freeze({
    ...catalog,
    PLAYER_BOARD_LAYOUT: placement.PLAYER_BOARD_LAYOUT,
    createState,
    createUiState,
    setupBoardBonuses,
    setCheatModeEnabled,
    setTechSelectionActive,
    cancelPendingTake,
    requestTakeTech,
    confirmBlueSlotChoice,
    getAvailableBlueSlots: resolver.getAvailableBlueSlots,
    getPlacementLayout: placement.getPlacementLayout,
    listTakeableTiles: resolver.listTakeableTiles,
    listAvailableTypes: resolver.listAvailableTypes,
    renderAll: render.renderAll,
    bindSupplyTileClicks: render.bindSupplyTileClicks,
    isSupplySelectionActive: render.isSupplySelectionActive,
    resetPlayerBoardTiles: render.resetPlayerBoardTiles,
    getReadoutLines,
    getSnapshot,
    isInSupply: boardState.isInSupply,
    isSlotAvailable: boardState.isSlotAvailable,
    getStack: boardState.getStack,
    getRemainingForSlot: boardState.getRemainingForSlot,
    getRemainingForType: boardState.getRemainingForType,
    boardState,
    playerTech,
    resolver,
    bonuses,
  });
});
