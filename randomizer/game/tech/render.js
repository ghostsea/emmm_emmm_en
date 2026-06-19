(function (root, factory) {
  "use strict";

  let catalog = root.SetiTechCatalog;
  let boardState = root.SetiTechBoardState;
  let placement = root.SetiTechPlacement;
  let playerTech = root.SetiPlayerTech;

  if (typeof require === "function") {
    catalog = catalog || require("./catalog");
    boardState = boardState || require("./board-state");
    placement = placement || require("./placement");
    playerTech = playerTech || require("./player-tech");
  }

  const api = factory(catalog, boardState, placement, playerTech);

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.SetiTechRender = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function (catalog, boardState, placement, playerTech) {
  "use strict";

  const playerBoardTileElements = new Map();

  function applyPlayerBoardTileStyle(element, layout) {
    element.classList.add("tech-tile-positioned");
    element.style.position = "absolute";
    element.style.left = `${layout.percentX}%`;
    element.style.top = `${layout.percentY}%`;
    element.style.setProperty("--tech-scale", String(layout.scalePercent / 100));
    element.style.transform = "translate(-50%, -50%) scale(var(--tech-scale, 1))";
    element.style.transformOrigin = "center center";
    element.dataset.techScale = String(layout.scalePercent);
  }

  function clearSupplyTileInlineStyles(element) {
    element.style.removeProperty("position");
    element.style.removeProperty("left");
    element.style.removeProperty("top");
    element.style.removeProperty("transform");
    element.style.removeProperty("z-index");
    element.style.removeProperty("--tech-scale");
    element.classList.remove("tech-tile-positioned", "is-takable", "is-selected-tech", "is-muted");
    element.removeAttribute("data-tech-scale");
    element.removeAttribute("title");
    element.hidden = false;
    element.style.removeProperty("display");
  }

  function getSupplySlotElement(context, tileId) {
    return context.supplySlots?.[tileId] || null;
  }

  function getSupplyStackElement(context, tileId) {
    const slot = getSupplySlotElement(context, tileId);
    return slot?.querySelector(".tech-slot-stack") || slot;
  }

  function getSupplyTileWrapElement(context, tileId) {
    const stack = getSupplyStackElement(context, tileId);
    return stack?.querySelector(".tech-tile-wrap") || stack;
  }

  function mountTileInSupplySlot(element, tileId, context) {
    const stack = getSupplyStackElement(context, tileId);
    if (!stack) return false;

    const wrap = getSupplyTileWrapElement(context, tileId);
    const mountTarget = wrap || stack;
    const bonusElement = stack.querySelector(".tech-bonus");

    if (element.parentElement !== mountTarget) {
      const overlay = mountTarget.querySelector?.(".tech-first-take-overlay");
      if (overlay) mountTarget.insertBefore(element, overlay);
      else if (mountTarget === stack && bonusElement) stack.insertBefore(element, bonusElement);
      else mountTarget.appendChild(element);
    }
    return true;
  }

  function renderSupplySlot(board, ui, context, tileId) {
    const slot = getSupplySlotElement(context, tileId);
    const bonusElement = slot?.querySelector(".tech-bonus");
    const overlayElement = slot?.querySelector(".tech-first-take-overlay");
    if (!slot) return;

    const stack = boardState.getStack(board, tileId);
    const available = boardState.isSlotAvailable(board, tileId);
    const techType = catalog.getTechType(tileId);

    slot.classList.toggle("is-taken", !available);

    if (overlayElement) {
      const showFirstTake = available && boardState.isFirstTakeAvailable(board, tileId);
      overlayElement.hidden = !showFirstTake;
    }

    if (!bonusElement) return;

    if (available && stack?.bonusId) {
      bonusElement.src = `../assets/tech_tile/${stack.bonusId}.png`;
      bonusElement.alt = catalog.BONUS_LABELS[stack.bonusId] || stack.bonusId;
      bonusElement.hidden = false;
      bonusElement.title = catalog.BONUS_LABELS[stack.bonusId] || stack.bonusId;
      return;
    }

    bonusElement.hidden = true;
    bonusElement.removeAttribute("src");
    bonusElement.removeAttribute("alt");
    bonusElement.removeAttribute("title");
  }

  function getPlayerBoardElementKey(playerId, tileId) {
    return `${playerId}:${tileId}`;
  }

  function renderPlayerOwnedTiles(player, context, tileElements) {
    const layer = context.playerBoardTechLayer;
    if (!layer) return;

    const ownedTileIds = player?.techState
      ? new Set(playerTech.listOwnedTileIds(player.techState))
      : new Set();

    for (const [key, element] of playerBoardTileElements.entries()) {
      const tileId = key.split(":").slice(1).join(":");
      if (!ownedTileIds.has(tileId)) {
        element.remove();
        playerBoardTileElements.delete(key);
      }
    }

    for (const tileId of ownedTileIds) {
      const key = getPlayerBoardElementKey(player?.id || "player", tileId);
      let element = playerBoardTileElements.get(key);
      const disabled = playerTech.isTileDisabled(player.techState, tileId);

      if (!element) {
        element = document.createElement("img");
        element.className = "tech-tile tech-tile-positioned tech-tile-owned";
        element.draggable = false;
        element.dataset.playerTechTileId = tileId;
        playerBoardTileElements.set(key, element);
        layer.appendChild(element);
      }

      element.classList.toggle("is-disabled", disabled);

      const sourceElement = tileElements.find((item) => item.dataset.techId === tileId);
      element.src = sourceElement?.getAttribute("src")
        || `../assets/tech_tile/${tileId}.png`;
      element.alt = sourceElement?.alt || tileId;

      const blueSlot = catalog.getTechType(tileId) === "blue"
        ? playerTech.getBlueBoardSlot(player.techState, tileId)
        : null;
      const layout = placement.getPlacementLayout(tileId, blueSlot);
      if (!layout) continue;

      applyPlayerBoardTileStyle(element, layout);
      const slotLabel = blueSlot ? ` 槽位${blueSlot}` : "";
      element.title = disabled
        ? `${tileId}（已失效）@玩家版图${slotLabel}`
        : `${tileId} @玩家版图${slotLabel}`;
    }
  }

  function isSupplySelectionActive(ui) {
    return Boolean(ui.techSelectionActive && (!ui.selectedTileId || ui.pendingTileId));
  }

  function renderAll(gameState, context, tileElements, options = {}) {
    const board = gameState.board;
    const ui = gameState.ui;
    const { supplyStage, playerBoardTechLayer } = context;
    const currentPlayer = options.currentPlayer || null;

    if (!supplyStage || !playerBoardTechLayer || !board) return;

    const selectionActive = isSupplySelectionActive(ui);
    supplyStage.classList.toggle("tech-selection-active", selectionActive);

    for (const element of tileElements) {
      const tileId = element.dataset.techId;
      if (!tileId) continue;

      clearSupplyTileInlineStyles(element);

      if (boardState.isSlotAvailable(board, tileId)) {
        mountTileInSupplySlot(element, tileId, context);
        const canTake = selectionActive && options.canTakeTile?.(tileId);
        if (canTake) {
          element.classList.add("is-takable");
          element.title = `点击研究 ${tileId}`;
          if (ui.selectedTileId === tileId) {
            element.classList.add("is-selected-tech");
          }
        } else if (selectionActive) {
          element.classList.add("is-muted");
          element.title = "当前不可研究";
        } else if (ui.selectedTileId === tileId) {
          element.classList.add("is-selected-tech");
          element.title = `已选择 ${tileId}`;
        }
        continue;
      }

      element.hidden = true;
    }

    if (currentPlayer) {
      renderPlayerOwnedTiles(currentPlayer, context, tileElements);
    }

    for (const tileId of catalog.TECH_TILE_IDS) {
      renderSupplySlot(board, ui, context, tileId);
    }
  }

  function bindSupplyTileClicks(gameState, context, tileElements, handlers = {}) {
    for (const element of tileElements) {
      element.draggable = false;
      element.addEventListener("click", () => {
        const tileId = element.dataset.techId;
        if (!tileId || !isSupplySelectionActive(gameState.ui)) return;
        if (handlers.onTileClick) handlers.onTileClick(tileId);
      });
    }
  }

  function resetPlayerBoardTiles() {
    for (const element of playerBoardTileElements.values()) {
      element.remove();
    }
    playerBoardTileElements.clear();
  }

  return Object.freeze({
    renderAll,
    bindSupplyTileClicks,
    isSupplySelectionActive,
    resetPlayerBoardTiles,
  });
});
