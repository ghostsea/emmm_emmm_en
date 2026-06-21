(function (root, factory) {
  "use strict";

  let state = root.SetiDataState;
  let placement = root.SetiDataPlacement;
  let nebulaPlacement = root.SetiNebulaDataPlacement;
  let nebulaState = root.SetiNebulaDataState;
  let solar = root.SetiSolarSystem;

  if (typeof require === "function") {
    state = state || require("./state");
    placement = placement || require("./placement");
    nebulaPlacement = nebulaPlacement || require("./nebula-placement");
    nebulaState = nebulaState || require("./nebula-state");
    solar = solar || require("../../solar-system/core");
  }

  const api = factory(state, placement, nebulaPlacement, nebulaState, solar);

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.SetiNebulaDataRender = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function (state, placement, nebulaPlacement, nebulaState, solar) {
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

  function getAomomoDisplayX(solarState, solarApi = solar) {
    if (!solarApi) return null;
    const snapshot = solarApi.createSolarSnapshot?.(solarState);
    const location = snapshot?.planetLocations?.find((planet) => planet.planetId === "aomomo");
    if (location) return location.x;
    return solarApi.toDisplayX?.(5, 3, solarState?.rotation || solarState) ?? null;
  }

  function roundAomomoFraction(value) {
    return Math.round(Number(value) * 10000) / 10000;
  }

  function unwrapAngleForBoundary(angleDegrees, startAngle, endAngle) {
    let best = Number(angleDegrees);
    let bestDistance = Number.POSITIVE_INFINITY;
    for (let offset = -720; offset <= 720; offset += 360) {
      const candidate = Number(angleDegrees) + offset;
      if (candidate >= startAngle && candidate <= endAngle) return candidate;
      const distance = candidate < startAngle ? startAngle - candidate : candidate - endAngle;
      if (distance < bestDistance) {
        best = candidate;
        bestDistance = distance;
      }
    }
    return best;
  }

  function getAomomoRelativePositionFromBoard(position, displayX, solarApi = solar) {
    if (!position || displayX == null || !solarApi) return null;
    const boundary = solarApi.getSectorCoordinateBoundary?.(displayX, 3);
    if (!boundary) return null;
    const boardPercentX = Number(position.boardPercentX ?? position.percentX);
    const boardPercentY = Number(position.boardPercentY ?? position.percentY);
    const point = {
      x: roundPercent(boardPercentX * 10),
      y: roundPercent(boardPercentY * 10),
    };
    const polar = solarApi.globalPointToPolarPoint?.(point);
    if (!polar) return null;
    const radialSpan = boundary.polarBoundary.outerRadius - boundary.polarBoundary.innerRadius;
    const angleSpan = boundary.polarBoundary.endAngleDegrees - boundary.polarBoundary.startAngleDegrees;
    const angleDegrees = unwrapAngleForBoundary(
      polar.angleDegrees,
      boundary.polarBoundary.startAngleDegrees,
      boundary.polarBoundary.endAngleDegrees,
    );
    return {
      percentX: boardPercentX,
      percentY: boardPercentY,
      boardPercentX,
      boardPercentY,
      radialFraction: roundAomomoFraction((polar.radius - boundary.polarBoundary.innerRadius) / radialSpan),
      angularFraction: roundAomomoFraction((angleDegrees - boundary.polarBoundary.startAngleDegrees) / angleSpan),
    };
  }

  function getAomomoBoardPoint(slot, solarState, solarApi = solar) {
    if (!slot || !solarApi) return null;
    const displayX = getAomomoDisplayX(solarState, solarApi);
    if (displayX == null) return null;
    const boundary = solarApi.getSectorCoordinateBoundary?.(displayX, 3);
    if (!boundary) return null;
    const override = slotLayoutOverrides.get(getOverrideKey("aomomo", slot.slotIndex));
    const radialSpan = boundary.polarBoundary.outerRadius - boundary.polarBoundary.innerRadius;
    const angleSpan = boundary.polarBoundary.endAngleDegrees - boundary.polarBoundary.startAngleDegrees;
    const radialFraction = Number(override?.radialFraction ?? slot.radialFraction ?? 0.55);
    const angularFraction = Number(override?.angularFraction ?? slot.angularFraction ?? 0.5);
    const radius = boundary.polarBoundary.innerRadius + radialSpan * radialFraction;
    const angleDegrees = boundary.polarBoundary.startAngleDegrees + angleSpan * angularFraction;
    const point = solarApi.polarToGlobalPoint(radius, angleDegrees);
    return {
      percentX: roundPercent(point.x / 10),
      percentY: roundPercent(point.y / 10),
      boardX: point.x,
      boardY: point.y,
      radialFraction,
      angularFraction,
      displayX,
    };
  }

  function getEffectiveAomomoBoardSlotLayout(slotIndex, token = null, solarState = null, solarApi = solar) {
    const base = nebulaPlacement.getNebulaDataSlotLayout("aomomo", slotIndex);
    if (!base) return null;
    const boardPoint = getAomomoBoardPoint(base, solarState, solarApi);
    if (!boardPoint) return null;
    const override = slotLayoutOverrides.get(getOverrideKey("aomomo", slotIndex));
    return {
      ...base,
      percentX: boardPoint.percentX,
      percentY: boardPoint.percentY,
      boardX: boardPoint.boardX,
      boardY: boardPoint.boardY,
      radialFraction: boardPoint.radialFraction,
      angularFraction: boardPoint.angularFraction,
      displayX: boardPoint.displayX,
      localPercentX: token?.percentX ?? override?.localPercentX ?? base.percentX,
      localPercentY: token?.percentY ?? override?.localPercentY ?? base.percentY,
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
    if (nebulaLayer?.classList?.contains("aomomo-nebula-data-layer")) {
      const rect = nebulaLayer.getBoundingClientRect();
      return {
        percentX: roundPercent(((clientX - rect.left) / rect.width) * 100),
        percentY: roundPercent(((clientY - rect.top) / rect.height) * 100),
        boardPercentX: roundPercent(((clientX - rect.left) / rect.width) * 100),
        boardPercentY: roundPercent(((clientY - rect.top) / rect.height) * 100),
      };
    }

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

    const layer = element.closest(".nebula-data-layer, .aomomo-nebula-data-layer");
    if (!layer) return;

    event.preventDefault();
    dragState = {
      element,
      layer,
      nebulaId: element.dataset.nebulaId,
      slotIndex: Number(element.dataset.nebulaSlotIndex),
      tokenIndex: Number(element.dataset.dataIndex),
      isAomomo: element.dataset.dataKind === "aomomo-nebula",
      aomomoDisplayX: Number(element.dataset.aomomoDisplayX),
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

    const { element, layer, nebulaId, slotIndex, tokenIndex, isAomomo, aomomoDisplayX } = dragState;
    const position = clientToNebulaLocalPercent(layer, event.clientX, event.clientY);

    if (element.releasePointerCapture) {
      try {
        element.releasePointerCapture(event.pointerId);
      } catch {
        // ignore stale capture
      }
    }

    setDraggingElement(element, false);

    const overridePosition = isAomomo
      ? getAomomoRelativePositionFromBoard(position, aomomoDisplayX)
      : null;

    if (nebulaId && Number.isInteger(slotIndex) && slotIndex > 0) {
      slotLayoutOverrides.set(
        getOverrideKey(nebulaId, slotIndex),
        overridePosition || {
          percentX: position.percentX,
          percentY: position.percentY,
          boardPercentX: position.boardPercentX,
          boardPercentY: position.boardPercentY,
        },
      );
    }

    const label = nebulaPlacement.getNebulaLabel(nebulaId);
    const displayPosition = overridePosition || position;
    const payload = {
      nebulaId,
      slotIndex,
      tokenIndex,
      percentX: displayPosition.percentX,
      percentY: displayPosition.percentY,
      boardPercentX: displayPosition.boardPercentX,
      boardPercentY: displayPosition.boardPercentY,
      radialFraction: displayPosition.radialFraction,
      angularFraction: displayPosition.angularFraction,
      message:
        `星云数据 ${label} 序号${tokenIndex} 槽位${slotIndex}`
        + ` 拖动至 ${nebulaId === "aomomo" ? "盘面" : "局部"}${displayPosition.percentX}%,${displayPosition.percentY}%`
        + (displayPosition.radialFraction != null && displayPosition.angularFraction != null
          ? ` radial=${displayPosition.radialFraction} angular=${displayPosition.angularFraction}`
          : ""),
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
      tokenElements.set(key, element);
      layer.appendChild(element);
    } else if (element.parentElement !== layer) {
      layer.appendChild(element);
    }

    const layout = getEffectiveNebulaSlotLayout(nebulaId, token.slotIndex, token);
    if (!layout) return;

    if (dragState?.element === element) return;

    applyNebulaTokenStyle(element, layout);
    const label = nebulaPlacement.getNebulaLabel(nebulaId);
    const ownerLabel = token.replacedByPlayerLabel || token.replacedByPlayerColor || "";
    element.src = token.playerTokenSrc || state.DATA_TOKEN_SRC;
    element.alt = ownerLabel
      ? `${label} ${ownerLabel}扫描标记 ${token.index}`
      : `${label} 数据 ${token.index}`;
    element.dataset.dataTokenId = token.id;
    element.dataset.dataIndex = String(token.index);
    element.dataset.nebulaId = nebulaId;
    element.dataset.nebulaSlotIndex = String(token.slotIndex);
    if (token.replacedByPlayerColor) {
      element.dataset.replacedByPlayerColor = token.replacedByPlayerColor;
    } else {
      delete element.dataset.replacedByPlayerColor;
    }
    element.title =
      `${label} 序号${token.index} @槽位${token.slotIndex}`
      + `${ownerLabel ? ` 已替换为${ownerLabel}token` : ""}`
      + ` 局部(${layout.percentX}%,${layout.percentY}%)`;
  }

  function applyAomomoBoardTokenStyle(element, layout) {
    element.classList.add("nebula-data-token-positioned");
    element.style.position = "absolute";
    element.style.left = `${layout.percentX}%`;
    element.style.top = `${layout.percentY}%`;
    element.style.width = `${roundPercent((layout.scalePercent || 8.5) * 0.35)}%`;
    element.style.height = "auto";
    element.style.transform = "translate(-50%, -50%)";
    element.style.transformOrigin = "center center";
    element.style.zIndex = "470";
    element.style.pointerEvents = "auto";
    element.dataset.dataPercentX = String(layout.percentX);
    element.dataset.dataPercentY = String(layout.percentY);
    element.dataset.boardX = String(layout.boardX);
    element.dataset.boardY = String(layout.boardY);
    element.dataset.aomomoDisplayX = String(layout.displayX ?? "");
    element.dataset.aomomoRadialFraction = String(layout.radialFraction ?? "");
    element.dataset.aomomoAngularFraction = String(layout.angularFraction ?? "");
  }

  function ensureAomomoDataLayer(boardLayer) {
    if (!boardLayer) return null;
    let layer = boardLayer.querySelector(".aomomo-nebula-data-layer");
    if (!layer) {
      layer = document.createElement("div");
      layer.className = "aomomo-nebula-data-layer";
      layer.dataset.nebulaId = "aomomo";
      layer.style.position = "absolute";
      layer.style.inset = "0";
      layer.style.pointerEvents = "none";
      boardLayer.appendChild(layer);
    }
    return layer;
  }

  function mountAomomoBoardToken(token, layer, solarState, options, activeKeys) {
    const nebulaId = "aomomo";
    const key = getTokenElementKey(nebulaId, token.id);
    activeKeys.add(key);

    let element = tokenElements.get(key);
    if (!element) {
      element = document.createElement("img");
      element.className = "data-token nebula-data-token aomomo-nebula-data-token nebula-data-token-positioned";
      element.draggable = false;
      element.dataset.dataKind = "aomomo-nebula";
      tokenElements.set(key, element);
      layer.appendChild(element);
    } else if (element.parentElement !== layer) {
      layer.appendChild(element);
    }

    const layout = getEffectiveAomomoBoardSlotLayout(token.slotIndex, token, solarState, options.solarApi || solar);
    if (!layout) return;
    if (dragState?.element === element) return;

    applyAomomoBoardTokenStyle(element, layout);
    const ownerLabel = token.replacedByPlayerLabel || token.replacedByPlayerColor || "";
    element.src = token.playerTokenSrc || state.DATA_TOKEN_SRC;
    element.alt = ownerLabel
      ? `奥陌陌 ${ownerLabel}扫描标记 ${token.index}`
      : `奥陌陌 数据 ${token.index}`;
    element.dataset.dataTokenId = token.id;
    element.dataset.dataIndex = String(token.index);
    element.dataset.nebulaId = nebulaId;
    element.dataset.nebulaSlotIndex = String(token.slotIndex);
    element.title =
      `奥陌陌 序号${token.index} @槽位${token.slotIndex}`
      + `${ownerLabel ? ` 已替换为${ownerLabel}token` : ""}`
      + ` 盘面(${layout.percentX}%,${layout.percentY}%)`;
  }

  function renderAomomoNebulaData(boardLayer, nebulaDataState, solarState = null, options = {}) {
    const layer = ensureAomomoDataLayer(boardLayer);
    if (!layer) return null;
    const active = Boolean(solarState?.aomomoActive || options.forceVisible);
    const activeKeys = new Set();
    if (active) {
      for (const token of nebulaState.listNebulaTokens(nebulaDataState, "aomomo")) {
        mountAomomoBoardToken(token, layer, solarState, options, activeKeys);
      }
    }

    for (const [key, element] of tokenElements.entries()) {
      const [nebulaId] = key.split(":");
      if (nebulaId !== "aomomo") continue;
      if (activeKeys.has(key)) continue;
      element.remove();
      tokenElements.delete(key);
    }
    return layer;
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
          boardPercentX: position.boardPercentX,
          boardPercentY: position.boardPercentY,
          radialFraction: position.radialFraction,
          angularFraction: position.angularFraction,
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
    getEffectiveAomomoBoardSlotLayout,
    getAomomoRelativePositionFromBoard,
    clientToSectorImagePercent,
    clientToNebulaLocalPercent,
    listNebulaSlotLayoutOverrides,
    ensureNebulaDataLayer,
    renderSectorNebulaData,
    renderAllSectorNebulaData,
    renderAomomoNebulaData,
    resetNebulaDataTokens,
  });
});
