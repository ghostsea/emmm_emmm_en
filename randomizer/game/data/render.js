(function (root, factory) {
  "use strict";

  let state = root.SetiDataState;
  let placement = root.SetiDataPlacement;

  if (typeof require === "function") {
    state = state || require("./state");
    placement = placement || require("./placement");
  }

  const api = factory(state, placement);

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.SetiDataRender = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function (state, placement) {
  "use strict";

  const tokenElements = new Map();
  const slotLayoutOverrides = new Map();
  let boundLayer = null;
  let dragHandlers = {};
  let dragState = null;
  let dragListenersBound = false;

  function roundPercent(value) {
    return Math.round(value * 100) / 100;
  }

  function getEffectivePoolSlotLayout(slotIndex) {
    const base = placement.getDataPoolSlotLayout(slotIndex);
    if (!base) return null;

    const override = slotLayoutOverrides.get(Number(slotIndex));
    if (!override) return base;

    return {
      ...base,
      percentX: override.percentX,
      percentY: override.percentY,
    };
  }

  function getEffectiveSlotLayout(slotIndex) {
    return getEffectivePoolSlotLayout(slotIndex);
  }

  function clientToLayerPercent(layer, clientX, clientY) {
    const rect = layer.getBoundingClientRect();
    if (!rect.width || !rect.height) {
      return { percentX: 0, percentY: 0 };
    }

    return {
      percentX: roundPercent(((clientX - rect.left) / rect.width) * 100),
      percentY: roundPercent(((clientY - rect.top) / rect.height) * 100),
    };
  }

  function applyDataTokenStyle(element, layout) {
    element.classList.add("data-token-positioned");
    element.style.position = "absolute";
    element.style.left = `${layout.percentX}%`;
    element.style.top = `${layout.percentY}%`;
    const scale = (layout.scalePercent / 100) * placement.DATA_TOKEN_DISPLAY_SCALE;
    element.style.setProperty("--data-scale", String(scale));
    element.style.transform = "translate(-50%, -50%) scale(var(--data-scale, 1))";
    element.style.transformOrigin = "center center";
    element.dataset.dataScale = String(roundPercent(layout.scalePercent * placement.DATA_TOKEN_DISPLAY_SCALE));
    element.dataset.dataPercentX = String(layout.percentX);
    element.dataset.dataPercentY = String(layout.percentY);
  }

  function getTokenElementKey(playerId, tokenId) {
    return `${playerId}:${tokenId}`;
  }

  function appendTokenElement(layer, element) {
    if (!layer || !element || element.parentNode === layer) return;
    if (element.parentNode) element.remove();
    layer.appendChild(element);
  }

  function setTokenElementMode(element, mode, options = {}) {
    const isPool = mode === "pool";
    const isBlueBonus = options.isBlueBonus === true;
    element.className = isPool
      ? "data-token data-token-positioned data-token-pool"
      : isBlueBonus
        ? "data-token data-token-positioned data-token-placed data-token-blue-bonus"
        : "data-token data-token-positioned data-token-placed";
    element.draggable = false;
    element.dataset.dataKind = isPool ? "pool" : "placed";

    if (isPool) {
      delete element.dataset.dataPlacementSlot;
      delete element.dataset.dataBlueSlot;
    } else {
      delete element.dataset.dataSlotIndex;
    }
  }

  function setDraggingElement(element, dragging) {
    if (!element) return;
    element.classList.toggle("is-dragging", dragging);
  }

  function handleDataTokenPointerDown(event) {
    if (!boundLayer || event.button !== 0) return;

    const element = event.target.closest(".data-token-positioned");
    if (!element || !boundLayer.contains(element)) return;
    if (element.dataset.dataKind !== "pool") return;

    event.preventDefault();
    dragState = {
      element,
      slotIndex: Number(element.dataset.dataSlotIndex),
      tokenIndex: Number(element.dataset.dataIndex),
      pointerId: event.pointerId,
    };

    setDraggingElement(element, true);
    if (element.setPointerCapture) {
      element.setPointerCapture(event.pointerId);
    }
  }

  function handleDataTokenPointerMove(event) {
    if (!dragState || event.pointerId !== dragState.pointerId || !boundLayer) return;

    const position = clientToLayerPercent(boundLayer, event.clientX, event.clientY);
    dragState.element.style.left = `${position.percentX}%`;
    dragState.element.style.top = `${position.percentY}%`;
    dragState.element.dataset.dataPercentX = String(position.percentX);
    dragState.element.dataset.dataPercentY = String(position.percentY);
  }

  function handleDataTokenPointerUp(event) {
    if (!dragState || event.pointerId !== dragState.pointerId) return;

    const { element, slotIndex, tokenIndex } = dragState;
    const position = clientToLayerPercent(boundLayer, event.clientX, event.clientY);

    if (element.releasePointerCapture) {
      try {
        element.releasePointerCapture(event.pointerId);
      } catch {
        // ignore stale capture
      }
    }

    setDraggingElement(element, false);

    if (Number.isInteger(slotIndex) && slotIndex > 0) {
      slotLayoutOverrides.set(slotIndex, position);
    }

    const payload = {
      slotIndex,
      tokenIndex,
      percentX: position.percentX,
      percentY: position.percentY,
      message: `数据 序号${tokenIndex} 槽位${slotIndex} 拖动至 ${position.percentX}%,${position.percentY}%`,
    };

    dragState = null;

    if (dragHandlers.onPositionChange) {
      dragHandlers.onPositionChange(payload);
    }
  }

  function bindDataTokenDragging(layer, handlers = {}) {
    boundLayer = layer;
    dragHandlers = handlers;

    if (!layer || dragListenersBound) return;

    layer.addEventListener("pointerdown", handleDataTokenPointerDown);
    window.addEventListener("pointermove", handleDataTokenPointerMove);
    window.addEventListener("pointerup", handleDataTokenPointerUp);
    window.addEventListener("pointercancel", handleDataTokenPointerUp);
    dragListenersBound = true;
  }

  function mountPoolToken(playerId, token, layer, activeKeys) {
    const key = getTokenElementKey(playerId, token.id);
    activeKeys.add(key);

    let element = tokenElements.get(key);
    if (!element) {
      element = document.createElement("img");
      element.src = state.DATA_TOKEN_SRC;
      tokenElements.set(key, element);
    }
    setTokenElementMode(element, "pool");
    appendTokenElement(layer, element);

    const layout = getEffectivePoolSlotLayout(token.slotIndex);
    if (!layout) return;

    if (dragState?.element === element) return;

    applyDataTokenStyle(element, layout);
    element.alt = `数据池 ${token.index}`;
    element.dataset.dataTokenId = token.id;
    element.dataset.dataIndex = String(token.index);
    element.dataset.dataSlotIndex = String(token.slotIndex);
    element.title = `数据池 ${token.index} @(${layout.percentX}%,${layout.percentY}%)`;
  }

  function getPlacedTokenLayout(token) {
    if (token.placementKind === "blueBonus") {
      return placement.getBlueBonusDataSlotLayout(token.blueSlot);
    }
    return placement.getComputerDataSlotLayout(token.placementSlot);
  }

  function mountPlacedToken(playerId, token, layer, activeKeys) {
    const key = getTokenElementKey(playerId, token.id);
    activeKeys.add(key);

    const isBlueBonus = token.placementKind === "blueBonus";
    let element = tokenElements.get(key);
    if (!element) {
      element = document.createElement("img");
      element.src = state.DATA_TOKEN_SRC;
      tokenElements.set(key, element);
    }
    setTokenElementMode(element, "placed", { isBlueBonus });
    appendTokenElement(layer, element);

    const layout = getPlacedTokenLayout(token);
    if (!layout) return;

    applyDataTokenStyle(element, layout);
    element.alt = isBlueBonus ? `蓝色科技位数据 ${token.index}` : `已放置数据 ${token.index}`;
    element.dataset.dataTokenId = token.id;
    element.dataset.dataIndex = String(token.index);
    if (isBlueBonus) {
      const positionLabel = placement.getBlueBonusDataPositionLabel(token.blueSlot);
      element.dataset.dataBlueSlot = String(token.blueSlot);
      element.alt = `${positionLabel}数据 ${token.index}`;
      element.title = `已放置 ${token.index} @${positionLabel} (${layout.percentX}%,${layout.percentY}%)`;
    } else {
      delete element.dataset.dataBlueSlot;
      element.dataset.dataPlacementSlot = String(token.placementSlot);
      element.title = `已放置 ${token.index} @第一排放置位${token.placementSlot} (${layout.percentX}%,${layout.percentY}%)`;
    }
  }

  function applyDropZoneStyle(element, layout) {
    element.classList.add("data-blue-bonus-drop-zone");
    element.style.position = "absolute";
    element.style.left = `${layout.percentX}%`;
    element.style.top = `${layout.percentY}%`;
    const scale = (layout.scalePercent / 100) * placement.DATA_TOKEN_DISPLAY_SCALE;
    element.style.setProperty("--data-scale", String(scale));
    element.style.transform = "translate(-50%, -50%) scale(var(--data-scale, 1))";
    element.style.transformOrigin = "center center";
  }

  function renderBlueBonusDropZones(player, layer, options = {}) {
    if (!layer) return;

    for (const element of layer.querySelectorAll(".data-blue-bonus-drop-zone")) {
      element.remove();
    }

    const eligible = new Set(state.listEligibleBlueBonusSlots(player));
    const hasPoolData = state.listPoolTokens(player).length > 0;

    for (const blueSlot of placement.BLUE_BONUS_DATA_SLOT_IDS) {
      if (!state.hasBlueTechInBoardSlot(player, blueSlot)) continue;
      if (state.listBlueBonusPlacedTokens(player).some((token) => token.blueSlot === blueSlot)) continue;

      const layout = placement.getBlueBonusDataSlotLayout(blueSlot);
      if (!layout) continue;

      const requiredComputerSlot = placement.getRequiredComputerSlotForBlueBonus(blueSlot);
      const positionLabel = placement.getBlueBonusDataPositionLabel(blueSlot);
      const canPlace = eligible.has(blueSlot) && hasPoolData;

      const button = document.createElement("button");
      button.type = "button";
      button.className = "data-blue-bonus-drop-zone";
      button.dataset.blueSlot = String(blueSlot);
      button.disabled = !canPlace;
      applyDropZoneStyle(button, layout);
      button.title = canPlace
        ? `放置数据到${positionLabel}`
        : hasPoolData
          ? `需先在第一排第 ${requiredComputerSlot} 位放置数据`
          : "数据池没有可放置的数据";
      button.setAttribute("aria-label", button.title);

      if (canPlace && options.onPlace) {
        button.addEventListener("click", (event) => {
          event.stopPropagation();
          options.onPlace(blueSlot);
        });
      }

      layer.appendChild(button);
    }
  }

  function renderPlayerDataTokens(player, layer, options = {}) {
    if (!layer) return;

    const playerId = player?.id || "player";
    const activeKeys = new Set();

    for (const token of state.listPoolTokens(player)) {
      mountPoolToken(playerId, token, layer, activeKeys);
    }

    for (const token of state.listPlacedTokens(player)) {
      mountPlacedToken(playerId, token, layer, activeKeys);
    }

    for (const [key, element] of tokenElements.entries()) {
      if (activeKeys.has(key)) continue;
      if (element.parentNode && element.parentNode !== layer) continue;
      element.remove();
      tokenElements.delete(key);
    }

    renderBlueBonusDropZones(player, layer, options);
  }

  function listSlotLayoutOverrides() {
    return [...slotLayoutOverrides.entries()]
      .sort(([a], [b]) => a - b)
      .map(([slotIndex, position]) => ({
        slotIndex,
        percentX: position.percentX,
        percentY: position.percentY,
      }));
  }

  function resetPlayerDataTokens() {
    for (const element of tokenElements.values()) {
      element.remove();
    }
    tokenElements.clear();
    slotLayoutOverrides.clear();
    dragState = null;
  }

  return Object.freeze({
    bindDataTokenDragging,
    getEffectiveSlotLayout,
    getEffectivePoolSlotLayout,
    listSlotLayoutOverrides,
    renderBlueBonusDropZones,
    renderPlayerDataTokens,
    resetPlayerDataTokens,
  });
});
