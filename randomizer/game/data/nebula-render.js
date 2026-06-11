(function (root, factory) {
  "use strict";

  let state = root.SetiDataState;
  let placement = root.SetiDataPlacement;
  let nebulaPlacement = root.SetiNebulaDataPlacement;
  let nebulaState = root.SetiNebulaDataState;

  if (typeof require === "function") {
    state = state || require("./state");
    placement = placement || require("./placement");
    nebulaPlacement = nebulaPlacement || require("./nebula-placement");
    nebulaState = nebulaState || require("./nebula-state");
  }

  const api = factory(state, placement, nebulaPlacement, nebulaState);

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.SetiNebulaDataRender = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function (state, placement, nebulaPlacement, nebulaState) {
  "use strict";

  const tokenElements = new Map();
  const slotLayoutOverrides = new Map();
  let dragState = null;
  let dragHandlers = {};
  let dragListenersBound = false;

  function roundPercent(value) {
    return Math.round(value * 100) / 100;
  }

  function getOverrideKey(nebulaId, slotIndex) {
    return `${nebulaId}:${slotIndex}`;
  }

  function getEffectiveNebulaSlotLayout(nebulaId, slotIndex, token) {
    const base = nebulaPlacement.getNebulaDataSlotLayout(nebulaId, slotIndex);
    if (!base) return null;

    const override = slotLayoutOverrides.get(getOverrideKey(nebulaId, slotIndex));
    const percentX = token?.percentX ?? override?.percentX ?? base.percentX;
    const percentY = token?.percentY ?? override?.percentY ?? base.percentY;

    return {
      ...base,
      percentX,
      percentY,
    };
  }

  function clientToSectorImagePercent(sectorElement, clientX, clientY) {
    const boardSlot = Number(sectorElement?.dataset?.boardSlot) || 1;
    const rotation = nebulaPlacement.getBoardSlotRotation(boardSlot);
    const rect = sectorElement.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    const dx = clientX - cx;
    const dy = clientY - cy;
    const rad = (-rotation * Math.PI) / 180;
    const ux = dx * Math.cos(rad) - dy * Math.sin(rad);
    const uy = dx * Math.sin(rad) + dy * Math.cos(rad);

    const width = sectorElement.offsetWidth;
    const height = sectorElement.offsetHeight;
    const localX = ux + width / 2;
    const localY = uy + height / 2;

    return {
      percentX: roundPercent((localX / width) * 100),
      percentY: roundPercent((localY / height) * 100),
    };
  }

  function clientToNebulaLocalPercent(nebulaLayer, clientX, clientY) {
    const sector = nebulaLayer?.closest(".sector");
    if (!sector) {
      return { percentX: 0, percentY: 0 };
    }

    const nebulaId = nebulaLayer.dataset.nebulaId;
    const sectorPosition = clientToSectorImagePercent(sector, clientX, clientY);
    return nebulaPlacement.sectorImageToNebulaLocal(
      nebulaId,
      sectorPosition.percentX,
      sectorPosition.percentY,
    );
  }

  function applyNebulaTokenStyle(element, layout) {
    element.classList.add("nebula-data-token-positioned");
    element.style.position = "absolute";
    element.style.left = `${layout.percentX}%`;
    element.style.top = `${layout.percentY}%`;
    const scale = (layout.scalePercent / 100) * placement.DATA_TOKEN_DISPLAY_SCALE;
    element.style.setProperty("--data-scale", String(scale));
    element.style.transform = "translate(-50%, -50%) scale(var(--data-scale, 1))";
    element.style.transformOrigin = "center center";
    element.dataset.dataPercentX = String(layout.percentX);
    element.dataset.dataPercentY = String(layout.percentY);
  }

  function getTokenElementKey(nebulaId, tokenId) {
    return `${nebulaId}:${tokenId}`;
  }

  function setDraggingElement(element, dragging) {
    if (!element) return;
    element.classList.toggle("is-dragging", dragging);
  }

  function handleNebulaTokenPointerDown(event) {
    if (event.button !== 0) return;

    const element = event.target.closest(".nebula-data-token-positioned");
    if (!element) return;

    const layer = element.closest(".nebula-data-layer");
    if (!layer) return;

    event.preventDefault();
    dragState = {
      element,
      layer,
      nebulaId: element.dataset.nebulaId,
      slotIndex: Number(element.dataset.nebulaSlotIndex),
      tokenIndex: Number(element.dataset.dataIndex),
      pointerId: event.pointerId,
    };

    setDraggingElement(element, true);
    if (element.setPointerCapture) {
      element.setPointerCapture(event.pointerId);
    }
  }

  function handleNebulaTokenPointerMove(event) {
    if (!dragState || event.pointerId !== dragState.pointerId) return;

    const position = clientToNebulaLocalPercent(dragState.layer, event.clientX, event.clientY);
    dragState.element.style.left = `${position.percentX}%`;
    dragState.element.style.top = `${position.percentY}%`;
    dragState.element.dataset.dataPercentX = String(position.percentX);
    dragState.element.dataset.dataPercentY = String(position.percentY);
  }

  function handleNebulaTokenPointerUp(event) {
    if (!dragState || event.pointerId !== dragState.pointerId) return;

    const { element, layer, nebulaId, slotIndex, tokenIndex } = dragState;
    const position = clientToNebulaLocalPercent(layer, event.clientX, event.clientY);

    if (element.releasePointerCapture) {
      try {
        element.releasePointerCapture(event.pointerId);
      } catch {
        // ignore stale capture
      }
    }

    setDraggingElement(element, false);

    if (nebulaId && Number.isInteger(slotIndex) && slotIndex > 0) {
      slotLayoutOverrides.set(getOverrideKey(nebulaId, slotIndex), position);
    }

    const label = nebulaPlacement.getNebulaLabel(nebulaId);
    const payload = {
      nebulaId,
      slotIndex,
      tokenIndex,
      percentX: position.percentX,
      percentY: position.percentY,
      message:
        `星云数据 ${label} 序号${tokenIndex} 槽位${slotIndex}`
        + ` 拖动至 局部${position.percentX}%,${position.percentY}%`,
    };

    dragState = null;

    if (dragHandlers.onPositionChange) {
      dragHandlers.onPositionChange(payload);
    }
  }

  function bindNebulaDataDragging(handlers = {}) {
    dragHandlers = handlers;
    if (dragListenersBound) return;

    document.addEventListener("pointerdown", handleNebulaTokenPointerDown);
    window.addEventListener("pointermove", handleNebulaTokenPointerMove);
    window.addEventListener("pointerup", handleNebulaTokenPointerUp);
    window.addEventListener("pointercancel", handleNebulaTokenPointerUp);
    dragListenersBound = true;
  }

  function ensureNebulaDataLayer(sectorElement, nebulaId) {
    let panel = sectorElement.querySelector(`.nebula-panel[data-nebula-id="${nebulaId}"]`);
    if (!panel) {
      const region = nebulaPlacement.getNebulaPanelRegion(nebulaId);
      panel = document.createElement("div");
      panel.className = "nebula-panel";
      panel.dataset.nebulaId = nebulaId;
      panel.style.position = "absolute";
      panel.style.left = `${region.originX}%`;
      panel.style.top = `${region.originY}%`;
      panel.style.width = `${region.widthPercent}%`;
      panel.style.height = `${region.heightPercent}%`;
      sectorElement.appendChild(panel);
    }

    let layer = panel.querySelector(".nebula-data-layer");
    if (!layer) {
      layer = document.createElement("div");
      layer.className = "nebula-data-layer";
      layer.dataset.nebulaId = nebulaId;
      panel.appendChild(layer);
    }

    return layer;
  }

  function mountNebulaToken(nebulaId, token, layer, activeKeys) {
    const key = getTokenElementKey(nebulaId, token.id);
    activeKeys.add(key);

    let element = tokenElements.get(key);
    if (!element) {
      element = document.createElement("img");
      element.className = "data-token nebula-data-token nebula-data-token-positioned";
      element.draggable = false;
      element.dataset.dataKind = "nebula";
      element.src = state.DATA_TOKEN_SRC;
      tokenElements.set(key, element);
      layer.appendChild(element);
    }

    const layout = getEffectiveNebulaSlotLayout(nebulaId, token.slotIndex, token);
    if (!layout) return;

    if (dragState?.element === element) return;

    applyNebulaTokenStyle(element, layout);
    const label = nebulaPlacement.getNebulaLabel(nebulaId);
    element.alt = `${label} 数据 ${token.index}`;
    element.dataset.dataTokenId = token.id;
    element.dataset.dataIndex = String(token.index);
    element.dataset.nebulaId = nebulaId;
    element.dataset.nebulaSlotIndex = String(token.slotIndex);
    element.title =
      `${label} 序号${token.index} @槽位${token.slotIndex} 局部(${layout.percentX}%,${layout.percentY}%)`;
  }

  function renderSectorNebulaData(sectorId, sectorElement, nebulaDataState) {
    if (!sectorElement) return null;

    const nebulaIds = nebulaPlacement.listNebulaIdsForSector(sectorId);
    const activeKeys = new Set();

    for (const nebulaId of nebulaIds) {
      const layer = ensureNebulaDataLayer(sectorElement, nebulaId);
      for (const token of nebulaState.listNebulaTokens(nebulaDataState, nebulaId)) {
        mountNebulaToken(nebulaId, token, layer, activeKeys);
      }
    }

    for (const [key, element] of tokenElements.entries()) {
      const [nebulaId] = key.split(":");
      const sectorNebulaIds = nebulaPlacement.listNebulaIdsForSector(sectorId);
      if (!sectorNebulaIds.includes(nebulaId) || activeKeys.has(key)) continue;
      element.remove();
      tokenElements.delete(key);
    }

    return sectorElement;
  }

  function renderAllSectorNebulaData(getSectorElement, nebulaDataState) {
    for (const sectorId of [1, 2, 3, 4]) {
      const sectorElement = getSectorElement(sectorId);
      if (sectorElement) {
        renderSectorNebulaData(sectorId, sectorElement, nebulaDataState);
      }
    }
  }

  function listNebulaSlotLayoutOverrides() {
    return [...slotLayoutOverrides.entries()]
      .map(([key, position]) => {
        const [nebulaId, slotIndex] = key.split(":");
        return {
          nebulaId,
          slotIndex: Number(slotIndex),
          percentX: position.percentX,
          percentY: position.percentY,
        };
      })
      .sort((a, b) => {
        if (a.nebulaId !== b.nebulaId) return a.nebulaId.localeCompare(b.nebulaId);
        return a.slotIndex - b.slotIndex;
      });
  }

  function resetNebulaDataTokens() {
    for (const element of tokenElements.values()) {
      element.remove();
    }
    tokenElements.clear();
    slotLayoutOverrides.clear();
    dragState = null;
  }

  return Object.freeze({
    bindNebulaDataDragging,
    getEffectiveNebulaSlotLayout,
    clientToSectorImagePercent,
    clientToNebulaLocalPercent,
    listNebulaSlotLayoutOverrides,
    ensureNebulaDataLayer,
    renderSectorNebulaData,
    renderAllSectorNebulaData,
    resetNebulaDataTokens,
  });
});
