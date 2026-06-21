(function (root, factory) {
  "use strict";

  let catalog = root.SetiAlienCatalog;
  let placement = root.SetiAlienPlacement;
  let state = root.SetiAlienState;
  let jiuzhe = root.SetiAlienJiuzhe;
  let yichangdian = root.SetiAlienYichangdian;
  let fangzhou = root.SetiAlienFangzhou;
  let banrenma = root.SetiAlienBanrenma;
  let chong = root.SetiAlienChong;
  let amiba = root.SetiAlienAmiba;
  let aomomo = root.SetiAlienAomomo;
  let runezu = root.SetiAlienRunezu;

  if (typeof require === "function") {
    catalog = catalog || require("./catalog");
    placement = placement || require("./placement");
    state = state || require("./state");
    jiuzhe = jiuzhe || require("./jiuzhe");
    yichangdian = yichangdian || require("./yichangdian");
    fangzhou = fangzhou || require("./fangzhou");
    banrenma = banrenma || require("./banrenma");
    chong = chong || require("./chong");
    amiba = amiba || require("./amiba");
    aomomo = aomomo || require("./aomomo");
    runezu = runezu || require("./runezu");
  }

  const api = factory(catalog, placement, state, jiuzhe, yichangdian, fangzhou, banrenma, chong, amiba, aomomo, runezu);

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.SetiAlienRender = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function (catalog, placement, state, jiuzhe, yichangdian, fangzhou, banrenma, chong, amiba, aomomo, runezu) {
  "use strict";

  const TRACE_KIND_FIRST = "first";
  const TRACE_KIND_EXTRA = "extra";
  const TRACE_KIND_JIUZHE = "jiuzhe";
  const TRACE_KIND_YICHANGDIAN = "yichangdian";
  const TRACE_KIND_FANGZHOU = "fangzhou";
  const TRACE_KIND_BANRENMA = "banrenma";
  const TRACE_KIND_CHONG = "chong";
  const TRACE_KIND_AMIBA = "amiba";
  const TRACE_KIND_AMIBA_SYMBOL = "amiba-symbol";
  const TRACE_KIND_AOMOMO = "aomomo";
  const TRACE_KIND_AOMOMO_ORBIT = "aomomo-orbit";
  const TRACE_KIND_AOMOMO_LANDING = "aomomo-landing";
  const TRACE_KIND_RUNEZU = "runezu";
  const TRACE_KIND_RUNEZU_PANEL_SYMBOL = "runezu-panel-symbol";
  const TRACE_KIND_RUNEZU_FACE_SYMBOL = "runezu-face-symbol";
  const YICHANGDIAN_SLOT_DISPLAY_SCALE = 0.5;
  const CHONG_FOSSIL_MARKER_DISPLAY_SCALE = 1.75;

  const tokenElements = new Map();
  const stateTraceSlotElements = new Map();
  const jiuzheSlotElements = new Map();
  const yichangdianSlotElements = new Map();
  const fangzhouSlotElements = new Map();
  const banrenmaSlotElements = new Map();
  const chongSlotElements = new Map();
  const chongFossilElements = new Map();
  const amibaSlotElements = new Map();
  const amibaSymbolElements = new Map();
  const aomomoSlotElements = new Map();
  const runezuSlotElements = new Map();
  const runezuPanelSymbolElements = new Map();
  const runezuFaceSymbolElements = new Map();
  const firstLayoutOverrides = new Map();
  const extraLayoutOverrides = new Map();
  const jiuzheLayoutOverrides = new Map();
  const yichangdianLayoutOverrides = new Map();
  const fangzhouLayoutOverrides = new Map();
  const banrenmaLayoutOverrides = new Map();
  const chongLayoutOverrides = new Map();
  const amibaLayoutOverrides = new Map();
  const amibaSymbolLayoutOverrides = new Map();
  const aomomoLayoutOverrides = new Map();
  const aomomoOrbitLayoutOverrides = new Map();
  const aomomoLandingLayoutOverrides = new Map();
  const runezuLayoutOverrides = new Map();
  const runezuPanelSymbolLayoutOverrides = new Map();
  const runezuFaceSymbolLayoutOverrides = new Map();
  let dragState = null;
  let dragHandlers = {};
  let dragListenersBound = false;

  function roundPercent(value) {
    return Math.round(value * 100) / 100;
  }

  function getFirstOverrideKey(alienSlotId, traceType) {
    return `first:${alienSlotId}:${traceType}`;
  }

  function getExtraOverrideKey(alienSlotId, traceType) {
    return `extra:${alienSlotId}:${traceType}`;
  }

  function getJiuzheOverrideKey(alienSlotId, traceType, position) {
    return `jiuzhe:${alienSlotId}:${traceType}:${position}`;
  }

  function getYichangdianOverrideKey(alienSlotId, traceType, position) {
    return `yichangdian:${alienSlotId}:${traceType}:${position}`;
  }

  function getFangzhouOverrideKey(alienSlotId, traceType, position) {
    return `fangzhou:${alienSlotId}:${traceType}:${position}`;
  }

  function getBanrenmaOverrideKey(alienSlotId, traceType, position) {
    return `banrenma:${alienSlotId}:${traceType}:${position}`;
  }

  function getChongOverrideKey(alienSlotId, traceType, position) {
    return `chong:${alienSlotId}:${traceType}:${position}`;
  }

  function getAmibaOverrideKey(alienSlotId, traceType, position) {
    return `amiba:${alienSlotId}:${traceType}:${position}`;
  }

  function getAmibaSymbolOverrideKey(alienSlotId, slotId) {
    return `amiba-symbol:${alienSlotId}:${slotId}`;
  }

  function getAomomoOverrideKey(alienSlotId, traceType, position) {
    return `aomomo:${alienSlotId}:${traceType}:${position}`;
  }

  function getAomomoOrbitOverrideKey(alienSlotId, position) {
    return `aomomo-orbit:${alienSlotId}:${position}`;
  }

  function getAomomoLandingOverrideKey(alienSlotId, position) {
    return `aomomo-landing:${alienSlotId}:${position}`;
  }

  function getRunezuOverrideKey(alienSlotId, traceType, position) {
    return `runezu:${alienSlotId}:${traceType}:${position}`;
  }

  function getRunezuPanelSymbolOverrideKey(alienSlotId, slotId) {
    return `runezu-panel-symbol:${alienSlotId}:${slotId}`;
  }

  function getRunezuFaceSymbolOverrideKey(alienSlotId, position) {
    return `runezu-face-symbol:${alienSlotId}:${position}`;
  }

  function getEffectiveTraceMarkerLayout(alienSlotId, traceType) {
    const base = placement.getAlienTraceMarkerLayout(alienSlotId, traceType);
    if (!base) return null;

    const override = firstLayoutOverrides.get(getFirstOverrideKey(alienSlotId, traceType));
    return {
      ...base,
      percentX: override?.percentX ?? base.percentX,
      percentY: override?.percentY ?? base.percentY,
    };
  }

  function getEffectiveExtraTraceAnchorLayout(alienSlotId, traceType) {
    const base = placement.getAlienExtraTraceMarkerLayout(alienSlotId, traceType);
    if (!base) return null;

    const override = extraLayoutOverrides.get(getExtraOverrideKey(alienSlotId, traceType));
    return {
      ...base,
      percentX: override?.percentX ?? base.percentX,
      percentY: override?.percentY ?? base.percentY,
    };
  }

  function getEffectiveExtraTraceGridLayout(alienSlotId, traceType, extraIndex) {
    const anchorLayout = getEffectiveExtraTraceAnchorLayout(alienSlotId, traceType);
    if (!anchorLayout) return null;
    return placement.getExtraTraceGridCenter(anchorLayout, extraIndex);
  }

  function getEffectiveJiuzheTraceMarkerLayout(alienSlotId, traceType, position) {
    const base = placement.getJiuzheTraceMarkerLayout?.(alienSlotId, traceType, position);
    if (!base) return null;

    const override = jiuzheLayoutOverrides.get(getJiuzheOverrideKey(alienSlotId, traceType, position));
    return {
      ...base,
      percentX: override?.percentX ?? base.percentX,
      percentY: override?.percentY ?? base.percentY,
    };
  }

  function getEffectiveYichangdianTraceMarkerLayout(alienSlotId, traceType, position, stackIndex = 0) {
    const base = placement.getYichangdianTraceMarkerLayout?.(alienSlotId, traceType, position);
    if (!base) return null;

    const override = yichangdianLayoutOverrides.get(getYichangdianOverrideKey(alienSlotId, traceType, position));
    const effectiveBase = {
      ...base,
      percentX: override?.percentX ?? base.percentX,
      percentY: override?.percentY ?? base.percentY,
    };
    if (Number(position) !== 1) return effectiveBase;
    return placement.getYichangdianStackTraceMarkerLayout?.(effectiveBase, stackIndex) || effectiveBase;
  }

  function getEffectiveFangzhouTraceMarkerLayout(alienSlotId, traceType, position, stackIndex = 0) {
    const base = placement.getFangzhouTraceMarkerLayout?.(alienSlotId, traceType, position);
    if (!base) return null;

    const override = fangzhouLayoutOverrides.get(getFangzhouOverrideKey(alienSlotId, traceType, position));
    return {
      ...base,
      percentX: override?.percentX ?? base.percentX,
      percentY: override?.percentY ?? base.percentY,
    };
  }

  function getEffectiveBanrenmaTraceMarkerLayout(alienSlotId, traceType, position, stackIndex = 0) {
    const base = placement.getBanrenmaTraceMarkerLayout?.(alienSlotId, traceType, position);
    if (!base) return null;

    const override = banrenmaLayoutOverrides.get(getBanrenmaOverrideKey(alienSlotId, traceType, position));
    const effectiveBase = {
      ...base,
      percentX: override?.percentX ?? base.percentX,
      percentY: override?.percentY ?? base.percentY,
    };
    if (Number(position) !== 1) return effectiveBase;
    return placement.getBanrenmaStackTraceMarkerLayout?.(effectiveBase, stackIndex) || effectiveBase;
  }

  function getEffectiveChongTraceMarkerLayout(alienSlotId, traceType, position) {
    const base = placement.getChongTraceMarkerLayout?.(alienSlotId, traceType, position);
    if (!base) return null;

    const override = chongLayoutOverrides.get(getChongOverrideKey(alienSlotId, traceType, position));
    return {
      ...base,
      percentX: override?.percentX ?? base.percentX,
      percentY: override?.percentY ?? base.percentY,
    };
  }

  function getEffectiveAmibaTraceMarkerLayout(alienSlotId, traceType, position) {
    const base = placement.getAmibaTraceMarkerLayout?.(alienSlotId, traceType, position);
    if (!base) return null;

    const override = amibaLayoutOverrides.get(getAmibaOverrideKey(alienSlotId, traceType, position));
    return {
      ...base,
      percentX: override?.percentX ?? base.percentX,
      percentY: override?.percentY ?? base.percentY,
    };
  }

  function getEffectiveAmibaSymbolMarkerLayout(alienSlotId, slotId) {
    const base = placement.getAmibaSymbolMarkerLayout?.(alienSlotId, slotId);
    if (!base) return null;

    const override = amibaSymbolLayoutOverrides.get(getAmibaSymbolOverrideKey(alienSlotId, slotId));
    return {
      ...base,
      percentX: override?.percentX ?? base.percentX,
      percentY: override?.percentY ?? base.percentY,
    };
  }

  function getEffectiveAomomoTraceMarkerLayout(alienSlotId, traceType, position, stackIndex = 0) {
    const base = placement.getAomomoTraceMarkerLayout?.(alienSlotId, traceType, position);
    if (!base) return null;

    const override = aomomoLayoutOverrides.get(getAomomoOverrideKey(alienSlotId, traceType, position));
    const effectiveBase = {
      ...base,
      percentX: override?.percentX ?? base.percentX,
      percentY: override?.percentY ?? base.percentY,
    };
    if (Number(position) !== 1) return effectiveBase;
    return placement.getAomomoStackTraceMarkerLayout?.(effectiveBase, stackIndex) || effectiveBase;
  }

  function getEffectiveAomomoOrbitMarkerLayout(alienSlotId, position = 1) {
    const base = placement.getAomomoOrbitMarkerLayout?.(alienSlotId, position);
    if (!base) return null;

    const override = aomomoOrbitLayoutOverrides.get(getAomomoOrbitOverrideKey(alienSlotId, position));
    return {
      ...base,
      percentX: override?.percentX ?? base.percentX,
      percentY: override?.percentY ?? base.percentY,
    };
  }

  function getEffectiveAomomoLandingMarkerLayout(alienSlotId, position) {
    const base = placement.getAomomoLandingMarkerLayout?.(alienSlotId, position);
    if (!base) return null;

    const override = aomomoLandingLayoutOverrides.get(getAomomoLandingOverrideKey(alienSlotId, position));
    return {
      ...base,
      percentX: override?.percentX ?? base.percentX,
      percentY: override?.percentY ?? base.percentY,
    };
  }

  function getEffectiveRunezuTraceMarkerLayout(alienSlotId, traceType, position, stackIndex = 0) {
    const base = placement.getRunezuTraceMarkerLayout?.(alienSlotId, traceType, position);
    if (!base) return null;

    const override = runezuLayoutOverrides.get(getRunezuOverrideKey(alienSlotId, traceType, position));
    const effectiveBase = {
      ...base,
      percentX: override?.percentX ?? base.percentX,
      percentY: override?.percentY ?? base.percentY,
    };
    if (Number(position) !== 1) return effectiveBase;
    return placement.getRunezuStackTraceMarkerLayout?.(effectiveBase, stackIndex) || effectiveBase;
  }

  function getEffectiveRunezuPanelSymbolMarkerLayout(alienSlotId, slotId) {
    const base = placement.getRunezuPanelSymbolMarkerLayout?.(alienSlotId, slotId);
    if (!base) return null;

    const override = runezuPanelSymbolLayoutOverrides.get(getRunezuPanelSymbolOverrideKey(alienSlotId, slotId));
    return {
      ...base,
      percentX: override?.percentX ?? base.percentX,
      percentY: override?.percentY ?? base.percentY,
    };
  }

  function getEffectiveRunezuFaceSymbolSlotMarkerLayout(alienSlotId, position) {
    const base = placement.getRunezuFaceSymbolSlotMarkerLayout?.(alienSlotId, position);
    if (!base) return null;

    const override = runezuFaceSymbolLayoutOverrides.get(getRunezuFaceSymbolOverrideKey(alienSlotId, position));
    return {
      ...base,
      percentX: override?.percentX ?? base.percentX,
      percentY: override?.percentY ?? base.percentY,
    };
  }

  function clientToAlienStatePercent(wrap, clientX, clientY) {
    const rect = wrap.getBoundingClientRect();
    const localX = clientX - rect.left;
    const localY = clientY - rect.top;
    const width = wrap.offsetWidth || rect.width;
    const height = wrap.offsetHeight || rect.height;

    return {
      percentX: roundPercent((localX / width) * 100),
      percentY: roundPercent((localY / height) * 100),
    };
  }

  function applyTraceTokenStyle(element, layout, displayScale) {
    element.classList.add("alien-trace-token-positioned");
    element.style.position = "absolute";
    element.style.left = `${layout.percentX}%`;
    element.style.top = `${layout.percentY}%`;
    const scale = (layout.scalePercent / 100) * displayScale;
    element.style.setProperty("--alien-trace-scale", String(scale));
    element.style.transform = "translate(-50%, -50%) scale(var(--alien-trace-scale, 1))";
    element.style.transformOrigin = "center center";
    element.dataset.tracePercentX = String(layout.percentX);
    element.dataset.tracePercentY = String(layout.percentY);
  }

  function getTokenElementKey(traceKind, alienSlotId, traceType, extraIndex = 0) {
    if (
      traceKind === TRACE_KIND_EXTRA
      || traceKind === TRACE_KIND_JIUZHE
      || traceKind === TRACE_KIND_YICHANGDIAN
      || traceKind === TRACE_KIND_FANGZHOU
      || traceKind === TRACE_KIND_BANRENMA
      || traceKind === TRACE_KIND_CHONG
      || traceKind === TRACE_KIND_AMIBA
      || traceKind === TRACE_KIND_AOMOMO
      || traceKind === TRACE_KIND_AOMOMO_ORBIT
      || traceKind === TRACE_KIND_AOMOMO_LANDING
      || traceKind === TRACE_KIND_RUNEZU
    ) {
      return `${traceKind}:${alienSlotId}:${traceType}:${extraIndex}`;
    }
    return `${traceKind}:${alienSlotId}:${traceType}`;
  }

  function setDraggingElement(element, dragging) {
    if (!element) return;
    element.classList.toggle("is-dragging", dragging);
  }

  function isRunezuDragElement(element) {
    const traceKind = element?.dataset?.traceKind;
    return traceKind === TRACE_KIND_RUNEZU
      || traceKind === TRACE_KIND_RUNEZU_PANEL_SYMBOL
      || traceKind === TRACE_KIND_RUNEZU_FACE_SYMBOL;
  }

  function isAomomoDragElement(element) {
    const traceKind = element?.dataset?.traceKind;
    return traceKind === TRACE_KIND_AOMOMO
      || traceKind === TRACE_KIND_AOMOMO_ORBIT
      || traceKind === TRACE_KIND_AOMOMO_LANDING;
  }

  function isBlockedDragElement(element) {
    return isRunezuDragElement(element) || isAomomoDragElement(element);
  }

  function findDraggableTraceElement(event) {
    const direct = event.target?.closest?.(".alien-trace-token.alien-trace-token-positioned") || null;
    if (direct && !isBlockedDragElement(direct)) return direct;
    const elements = typeof document.elementsFromPoint === "function"
      ? document.elementsFromPoint(event.clientX, event.clientY)
      : [];
    return elements.find((element) => (
      element?.classList?.contains("alien-trace-token")
      && element.classList.contains("alien-trace-token-positioned")
      && !isBlockedDragElement(element)
    )) || null;
  }

  function handleTraceTokenPointerDown(event) {
    if (typeof event.button === "number" && event.button !== 0) return;
    if (event.type === "mousedown" && dragState) return;

    const element = findDraggableTraceElement(event);
    if (!element) return;

    const layer = element.closest(".alien-trace-layer, .alien-jiuzhe-trace-layer");
    const wrap = layer?.closest(".alien-state-wrap, .alien-face-wrap");
    if (!layer || !wrap) return;

    event.preventDefault();
    dragState = {
      element,
      layer,
      wrap,
      alienSlotId: Number(element.dataset.alienSlot),
      traceType: element.dataset.traceType,
      traceKind: element.dataset.traceKind || TRACE_KIND_FIRST,
      extraIndex: Number(element.dataset.extraIndex || 0),
      jiuzhePosition: Number(element.dataset.jiuzhePosition || 0),
      yichangdianPosition: Number(element.dataset.yichangdianPosition || 0),
      yichangdianStackIndex: Number(element.dataset.yichangdianStackIndex || 0),
      fangzhouPosition: Number(element.dataset.fangzhouPosition || 0),
      fangzhouStackIndex: Number(element.dataset.fangzhouStackIndex || 0),
      banrenmaPosition: Number(element.dataset.banrenmaPosition || 0),
      banrenmaStackIndex: Number(element.dataset.banrenmaStackIndex || 0),
      chongPosition: Number(element.dataset.chongPosition || 0),
      amibaPosition: Number(element.dataset.amibaPosition || 0),
      amibaSymbolSlot: element.dataset.amibaSymbolSlot || null,
      aomomoPosition: Number(element.dataset.aomomoPosition || 0),
      aomomoStackIndex: Number(element.dataset.aomomoStackIndex || 0),
      aomomoOrbitPosition: Number(element.dataset.aomomoOrbitPosition || 0),
      aomomoLandingPosition: Number(element.dataset.aomomoLandingPosition || 0),
      runezuPosition: Number(element.dataset.runezuPosition || 0),
      runezuStackIndex: Number(element.dataset.runezuStackIndex || 0),
      runezuPanelSymbolSlot: element.dataset.runezuPanelSymbolSlot || null,
      runezuFaceSymbolPosition: Number(element.dataset.runezuFaceSymbolPosition || 0),
      pointerId: typeof event.pointerId === "number" ? event.pointerId : null,
    };

    setDraggingElement(element, true);
    if (element.setPointerCapture && dragState.pointerId != null) {
      element.setPointerCapture(event.pointerId);
    }
  }

  function handleTraceTokenPointerMove(event) {
    if (!dragState) return;
    const eventPointerId = typeof event.pointerId === "number" ? event.pointerId : null;
    if (dragState.pointerId != null && eventPointerId != null && eventPointerId !== dragState.pointerId) return;

    const position = clientToAlienStatePercent(dragState.wrap, event.clientX, event.clientY);
    dragState.element.style.left = `${position.percentX}%`;
    dragState.element.style.top = `${position.percentY}%`;
    dragState.element.dataset.tracePercentX = String(position.percentX);
    dragState.element.dataset.tracePercentY = String(position.percentY);
  }

  function handleTraceTokenPointerUp(event) {
    if (!dragState) return;
    const eventPointerId = typeof event.pointerId === "number" ? event.pointerId : null;
    if (dragState.pointerId != null && eventPointerId != null && eventPointerId !== dragState.pointerId) return;

    const { element, wrap, alienSlotId, traceType, traceKind } = dragState;
    const position = clientToAlienStatePercent(wrap, event.clientX, event.clientY);

    if (element.releasePointerCapture && dragState.pointerId != null) {
      try {
        element.releasePointerCapture(event.pointerId);
      } catch {
        // ignore stale capture
      }
    }

    setDraggingElement(element, false);

    if (alienSlotId && traceKind === TRACE_KIND_AMIBA_SYMBOL) {
      const slotId = element.dataset.amibaSymbolSlot;
      if (slotId) {
        amibaSymbolLayoutOverrides.set(getAmibaSymbolOverrideKey(alienSlotId, slotId), position);
      }
    } else if (alienSlotId && traceKind === TRACE_KIND_RUNEZU_PANEL_SYMBOL) {
      const slotId = element.dataset.runezuPanelSymbolSlot;
      if (slotId) {
        runezuPanelSymbolLayoutOverrides.set(getRunezuPanelSymbolOverrideKey(alienSlotId, slotId), position);
      }
    } else if (alienSlotId && traceKind === TRACE_KIND_RUNEZU_FACE_SYMBOL) {
      const facePosition = Number(element.dataset.runezuFaceSymbolPosition || 0);
      if (facePosition) {
        runezuFaceSymbolLayoutOverrides.set(getRunezuFaceSymbolOverrideKey(alienSlotId, facePosition), position);
      }
    } else if (alienSlotId && traceKind === TRACE_KIND_AOMOMO_ORBIT) {
      const orbitPosition = Number(element.dataset.aomomoOrbitPosition || 0);
      if (orbitPosition) {
        aomomoOrbitLayoutOverrides.set(getAomomoOrbitOverrideKey(alienSlotId, orbitPosition), position);
      }
    } else if (alienSlotId && traceKind === TRACE_KIND_AOMOMO_LANDING) {
      const landingPosition = Number(element.dataset.aomomoLandingPosition || 0);
      if (landingPosition) {
        aomomoLandingLayoutOverrides.set(getAomomoLandingOverrideKey(alienSlotId, landingPosition), position);
      }
    } else if (alienSlotId && traceType) {
      if (traceKind === TRACE_KIND_JIUZHE) {
        const positionIndex = Number(element.dataset.jiuzhePosition || 0);
        jiuzheLayoutOverrides.set(getJiuzheOverrideKey(alienSlotId, traceType, positionIndex), position);
      } else if (traceKind === TRACE_KIND_YICHANGDIAN) {
        const positionIndex = Number(element.dataset.yichangdianPosition || 0);
        const stackIndex = Number(element.dataset.yichangdianStackIndex || 0);
        const basePosition = positionIndex === 1
          ? placement.getYichangdianBaseFromStackTraceMarkerLayout?.(position, stackIndex) || position
          : position;
        yichangdianLayoutOverrides.set(
          getYichangdianOverrideKey(alienSlotId, traceType, positionIndex),
          basePosition,
        );
      } else if (traceKind === TRACE_KIND_FANGZHOU) {
        const positionIndex = Number(element.dataset.fangzhouPosition || 0);
        fangzhouLayoutOverrides.set(
          getFangzhouOverrideKey(alienSlotId, traceType, positionIndex),
          position,
        );
      } else if (traceKind === TRACE_KIND_BANRENMA) {
        const positionIndex = Number(element.dataset.banrenmaPosition || 0);
        const stackIndex = Number(element.dataset.banrenmaStackIndex || 0);
        const basePosition = positionIndex === 1
          ? placement.getBanrenmaBaseFromStackTraceMarkerLayout?.(position, stackIndex) || position
          : position;
        banrenmaLayoutOverrides.set(
          getBanrenmaOverrideKey(alienSlotId, traceType, positionIndex),
          basePosition,
        );
      } else if (traceKind === TRACE_KIND_CHONG) {
        const positionIndex = Number(element.dataset.chongPosition || 0);
        chongLayoutOverrides.set(
          getChongOverrideKey(alienSlotId, traceType, positionIndex),
          position,
        );
      } else if (traceKind === TRACE_KIND_AMIBA) {
        const positionIndex = Number(element.dataset.amibaPosition || 0);
        amibaLayoutOverrides.set(
          getAmibaOverrideKey(alienSlotId, traceType, positionIndex),
          position,
        );
      } else if (traceKind === TRACE_KIND_AOMOMO) {
        const positionIndex = Number(element.dataset.aomomoPosition || 0);
        const stackIndex = Number(element.dataset.aomomoStackIndex || 0);
        const basePosition = positionIndex === 1
          ? placement.getAomomoBaseFromStackTraceMarkerLayout?.(position, stackIndex) || position
          : position;
        aomomoLayoutOverrides.set(
          getAomomoOverrideKey(alienSlotId, traceType, positionIndex),
          basePosition,
        );
      } else if (traceKind === TRACE_KIND_RUNEZU) {
        const positionIndex = Number(element.dataset.runezuPosition || 0);
        const stackIndex = Number(element.dataset.runezuStackIndex || 0);
        const basePosition = positionIndex === 1
          ? placement.getRunezuBaseFromStackTraceMarkerLayout?.(position, stackIndex) || position
          : position;
        runezuLayoutOverrides.set(
          getRunezuOverrideKey(alienSlotId, traceType, positionIndex),
          basePosition,
        );
      } else if (traceKind === TRACE_KIND_EXTRA) {
        const anchorLayout = getEffectiveExtraTraceAnchorLayout(alienSlotId, traceType);
        const extraIndex = Number(element.dataset.extraIndex || 0);
        const anchorPosition = anchorLayout
          ? placement.getExtraTraceAnchorFromGridCenter(position, extraIndex, anchorLayout)
          : position;
        extraLayoutOverrides.set(getExtraOverrideKey(alienSlotId, traceType), anchorPosition);
      } else {
        firstLayoutOverrides.set(getFirstOverrideKey(alienSlotId, traceType), position);
      }
    }

    const label = placement.getAlienSlotLabel(alienSlotId);
    const isAmibaSymbol = traceKind === TRACE_KIND_AMIBA_SYMBOL;
    const isRunezuSymbol = traceKind === TRACE_KIND_RUNEZU_PANEL_SYMBOL || traceKind === TRACE_KIND_RUNEZU_FACE_SYMBOL;
    const traceLabel = isAmibaSymbol || isRunezuSymbol ? "" : placement.getTraceTypeLabel(traceType);
    const kindLabel = traceKind === TRACE_KIND_JIUZHE
      ? `九折${Number(element.dataset.jiuzhePosition || 0)}号位`
      : traceKind === TRACE_KIND_YICHANGDIAN
        ? `异常点${Number(element.dataset.yichangdianPosition || 0)}号位`
      : traceKind === TRACE_KIND_FANGZHOU
        ? `方舟${Number(element.dataset.fangzhouPosition || 0)}号位`
      : traceKind === TRACE_KIND_BANRENMA
        ? `半人马${Number(element.dataset.banrenmaPosition || 0)}号位`
      : traceKind === TRACE_KIND_CHONG
        ? `虫族${Number(element.dataset.chongPosition || 0)}号位`
      : traceKind === TRACE_KIND_AMIBA
        ? `阿米巴${Number(element.dataset.amibaPosition || 0)}号位`
      : traceKind === TRACE_KIND_AMIBA_SYMBOL
        ? `阿米巴symbol ${amiba?.formatSymbolSlotLabel?.(element.dataset.amibaSymbolSlot) || element.dataset.amibaSymbolSlot || ""}`
      : traceKind === TRACE_KIND_RUNEZU
        ? `符文族${Number(element.dataset.runezuPosition || 0)}号位`
      : traceKind === TRACE_KIND_RUNEZU_PANEL_SYMBOL
        ? `符文族symbol ${runezu?.formatPanelSymbolSlotLabel?.(element.dataset.runezuPanelSymbolSlot) || element.dataset.runezuPanelSymbolSlot || ""}`
      : traceKind === TRACE_KIND_RUNEZU_FACE_SYMBOL
        ? `符文族黑圈 ${runezu?.formatFaceSymbolSlotLabel?.(element.dataset.runezuFaceSymbolPosition) || element.dataset.runezuFaceSymbolPosition || ""}`
      : traceKind === TRACE_KIND_EXTRA
        ? "非首标记网格锚点"
        : "首标记";
    const payload = {
      alienSlotId,
      traceType,
      traceKind,
      extraIndex: traceKind === TRACE_KIND_EXTRA ? Number(element.dataset.extraIndex || 0) : null,
      jiuzhePosition: traceKind === TRACE_KIND_JIUZHE ? Number(element.dataset.jiuzhePosition || 0) : null,
      yichangdianPosition: traceKind === TRACE_KIND_YICHANGDIAN ? Number(element.dataset.yichangdianPosition || 0) : null,
      yichangdianStackIndex: traceKind === TRACE_KIND_YICHANGDIAN ? Number(element.dataset.yichangdianStackIndex || 0) : null,
      fangzhouPosition: traceKind === TRACE_KIND_FANGZHOU ? Number(element.dataset.fangzhouPosition || 0) : null,
      fangzhouStackIndex: traceKind === TRACE_KIND_FANGZHOU ? Number(element.dataset.fangzhouStackIndex || 0) : null,
      banrenmaPosition: traceKind === TRACE_KIND_BANRENMA ? Number(element.dataset.banrenmaPosition || 0) : null,
      banrenmaStackIndex: traceKind === TRACE_KIND_BANRENMA ? Number(element.dataset.banrenmaStackIndex || 0) : null,
      chongPosition: traceKind === TRACE_KIND_CHONG ? Number(element.dataset.chongPosition || 0) : null,
      amibaPosition: traceKind === TRACE_KIND_AMIBA ? Number(element.dataset.amibaPosition || 0) : null,
      amibaSymbolSlot: traceKind === TRACE_KIND_AMIBA_SYMBOL ? (element.dataset.amibaSymbolSlot || null) : null,
      aomomoPosition: traceKind === TRACE_KIND_AOMOMO ? Number(element.dataset.aomomoPosition || 0) : null,
      aomomoStackIndex: traceKind === TRACE_KIND_AOMOMO ? Number(element.dataset.aomomoStackIndex || 0) : null,
      aomomoOrbitPosition: traceKind === TRACE_KIND_AOMOMO_ORBIT ? Number(element.dataset.aomomoOrbitPosition || 0) : null,
      aomomoLandingPosition: traceKind === TRACE_KIND_AOMOMO_LANDING ? Number(element.dataset.aomomoLandingPosition || 0) : null,
      runezuPosition: traceKind === TRACE_KIND_RUNEZU ? Number(element.dataset.runezuPosition || 0) : null,
      runezuStackIndex: traceKind === TRACE_KIND_RUNEZU ? Number(element.dataset.runezuStackIndex || 0) : null,
      runezuPanelSymbolSlot: traceKind === TRACE_KIND_RUNEZU_PANEL_SYMBOL ? (element.dataset.runezuPanelSymbolSlot || null) : null,
      runezuFaceSymbolPosition: traceKind === TRACE_KIND_RUNEZU_FACE_SYMBOL ? Number(element.dataset.runezuFaceSymbolPosition || 0) : null,
      percentX: position.percentX,
      percentY: position.percentY,
      message: traceKind === TRACE_KIND_AMIBA_SYMBOL
        ? `${label} 阿米巴 symbol ${element.dataset.amibaSymbolId || ""}`
          + ` @ ${amiba?.formatSymbolSlotLabel?.(element.dataset.amibaSymbolSlot) || element.dataset.amibaSymbolSlot || ""}`
          + ` 拖动至 ${position.percentX}%,${position.percentY}%`
      : traceKind === TRACE_KIND_RUNEZU_PANEL_SYMBOL
        ? `${label} 符文族白框 symbol ${element.dataset.runezuSymbolId || ""}`
          + ` @ ${runezu?.formatPanelSymbolSlotLabel?.(element.dataset.runezuPanelSymbolSlot) || element.dataset.runezuPanelSymbolSlot || ""}`
          + ` 拖动至 ${position.percentX}%,${position.percentY}%`
      : traceKind === TRACE_KIND_RUNEZU_FACE_SYMBOL
        ? `${label} 符文族黑圈 ${runezu?.formatFaceSymbolSlotLabel?.(element.dataset.runezuFaceSymbolPosition) || element.dataset.runezuFaceSymbolPosition || ""}`
          + ` symbol ${element.dataset.runezuSymbolId || ""} 拖动至 ${position.percentX}%,${position.percentY}%`
      : traceKind === TRACE_KIND_EXTRA
        ? `${label} ${traceLabel} 非首标记 #${Number(element.dataset.extraIndex || 0) + 1} 拖动至 ${position.percentX}%,${position.percentY}%`
        : traceKind === TRACE_KIND_JIUZHE
          ? `${label} ${traceLabel} 九折${Number(element.dataset.jiuzhePosition || 0)}号位 拖动至 ${position.percentX}%,${position.percentY}%`
        : traceKind === TRACE_KIND_YICHANGDIAN
          ? `${label} ${traceLabel} 异常点${Number(element.dataset.yichangdianPosition || 0)}号位`
            + `${Number(element.dataset.yichangdianPosition || 0) === 1 ? `#${Number(element.dataset.yichangdianStackIndex || 0) + 1}` : ""}`
            + ` 拖动至 ${position.percentX}%,${position.percentY}%`
        : traceKind === TRACE_KIND_FANGZHOU
          ? `${label} ${traceLabel} 方舟${Number(element.dataset.fangzhouPosition || 0)}号位`
            + ` 拖动至 ${position.percentX}%,${position.percentY}%`
        : traceKind === TRACE_KIND_BANRENMA
          ? `${label} ${traceLabel} 半人马${Number(element.dataset.banrenmaPosition || 0)}号位`
            + `${Number(element.dataset.banrenmaPosition || 0) === 1 ? `#${Number(element.dataset.banrenmaStackIndex || 0) + 1}` : ""}`
            + ` 拖动至 ${position.percentX}%,${position.percentY}%`
        : traceKind === TRACE_KIND_CHONG
          ? `${label} ${traceLabel} 虫族${Number(element.dataset.chongPosition || 0)}号位`
            + ` 拖动至 ${position.percentX}%,${position.percentY}%`
      : traceKind === TRACE_KIND_AMIBA
        ? `${label} ${traceLabel} 阿米巴${Number(element.dataset.amibaPosition || 0)}号位`
          + ` 拖动至 ${position.percentX}%,${position.percentY}%`
      : traceKind === TRACE_KIND_AOMOMO
        ? `${label} ${traceLabel} 奥陌陌${Number(element.dataset.aomomoPosition || 0)}号位`
          + `${Number(element.dataset.aomomoPosition || 0) === 1 ? `#${Number(element.dataset.aomomoStackIndex || 0) + 1}` : ""}`
          + ` 拖动至 ${position.percentX}%,${position.percentY}%`
      : traceKind === TRACE_KIND_AOMOMO_ORBIT
        ? `${label} 奥陌陌环绕${Number(element.dataset.aomomoOrbitPosition || 0)}号位`
          + ` 拖动至 ${position.percentX}%,${position.percentY}%`
      : traceKind === TRACE_KIND_AOMOMO_LANDING
        ? `${label} 奥陌陌登陆${Number(element.dataset.aomomoLandingPosition || 0)}号位`
          + ` 拖动至 ${position.percentX}%,${position.percentY}%`
      : traceKind === TRACE_KIND_RUNEZU
          ? `${label} ${traceLabel} 符文族${Number(element.dataset.runezuPosition || 0)}号位`
            + `${Number(element.dataset.runezuPosition || 0) === 1 ? `#${Number(element.dataset.runezuStackIndex || 0) + 1}` : ""}`
            + ` 拖动至 ${position.percentX}%,${position.percentY}%`
        : `${label} ${traceLabel} ${kindLabel} 拖动至 ${position.percentX}%,${position.percentY}%`,
    };

    dragState = null;

    if (dragHandlers.onPositionChange) {
      dragHandlers.onPositionChange(payload);
    }
  }

  function bindAlienTraceDragging(handlers = {}) {
    dragHandlers = handlers;
    if (dragListenersBound) return;

    document.addEventListener("pointerdown", handleTraceTokenPointerDown);
    window.addEventListener("pointermove", handleTraceTokenPointerMove);
    window.addEventListener("pointerup", handleTraceTokenPointerUp);
    window.addEventListener("pointercancel", handleTraceTokenPointerUp);
    document.addEventListener("mousedown", handleTraceTokenPointerDown);
    window.addEventListener("mousemove", handleTraceTokenPointerMove);
    window.addEventListener("mouseup", handleTraceTokenPointerUp);
    dragListenersBound = true;
  }

  function resolvePlayerTokenAsset(playerColor, options = {}) {
    if (!playerColor || !options.getPlayerTokenAsset) {
      return options.tokenSrc || placement.ALIEN_TRACE_TOKEN_SRC;
    }
    return options.getPlayerTokenAsset(playerColor) || placement.ALIEN_TRACE_TOKEN_SRC;
  }

  function mountFirstTraceToken(alienSlotId, traceType, layer, alienSlot, options, activeKeys) {
    const traceSlot = alienSlot?.traces?.[traceType] || null;
    const key = getTokenElementKey(TRACE_KIND_FIRST, alienSlotId, traceType);

    if (!traceSlot?.firstPlaced) {
      const existing = tokenElements.get(key);
      if (existing) {
        existing.remove();
        tokenElements.delete(key);
      }
      return;
    }

    activeKeys.add(key);

    let element = tokenElements.get(key);
    if (!element) {
      element = document.createElement("img");
      element.className = "alien-trace-token alien-trace-token-positioned alien-trace-token-first is-first-trace-placed";
      element.draggable = false;
      tokenElements.set(key, element);
      layer.appendChild(element);
    }

    const layout = getEffectiveTraceMarkerLayout(alienSlotId, traceType);
    if (!layout) return;

    if (dragState?.element === element) return;

    applyTraceTokenStyle(element, layout, placement.ALIEN_TRACE_TOKEN_DISPLAY_SCALE);
    element.src = resolvePlayerTokenAsset(traceSlot.ownerPlayerColor, options);
    element.alt = `${placement.getAlienSlotLabel(alienSlotId)} ${placement.getTraceTypeLabel(traceType)} 首标记`;
    element.dataset.alienSlot = String(alienSlotId);
    element.dataset.traceType = traceType;
    element.dataset.traceKind = TRACE_KIND_FIRST;
    delete element.dataset.extraIndex;
    element.title = `${placement.getTraceTypeLabel(traceType)} 首标记 ${
      options.getPlayerLabel?.(traceSlot.ownerPlayerColor) || traceSlot.ownerPlayerColor || "未知"
    } @(${layout.percentX}%,${layout.percentY}%)`;
  }

  function getStateTraceSlotKey(alienSlotId, traceType, kind) {
    return `state-slot:${alienSlotId}:${traceType}:${kind}`;
  }

  function mountStateTracePlacementSlot(alienSlotId, traceType, kind, layout, layer, options, activeKeys) {
    const key = getStateTraceSlotKey(alienSlotId, traceType, kind);
    activeKeys.add(key);

    let slot = stateTraceSlotElements.get(key);
    if (!slot) {
      slot = document.createElement("button");
      slot.type = "button";
      slot.className = "alien-state-trace-slot alien-trace-token-positioned";
      slot.dataset.stateTraceSlot = "true";
      stateTraceSlotElements.set(key, slot);
      layer.appendChild(slot);
    }

    const displayScale = kind === "first"
      ? placement.ALIEN_TRACE_TOKEN_DISPLAY_SCALE
      : placement.ALIEN_EXTRA_TRACE_TOKEN_DISPLAY_SCALE;
    applyTraceTokenStyle(slot, layout, displayScale);
    slot.dataset.alienSlot = String(alienSlotId);
    slot.dataset.traceType = traceType;
    slot.dataset.stateTraceKind = kind;
    const canPlace = options.canPlaceStateTrace?.(alienSlotId, traceType, kind) !== false;
    slot.classList.toggle("is-placeable", canPlace);
    const kindLabel = kind === "first" ? "首标记" : "额外痕迹";
    slot.title = `${placement.getTraceTypeLabel(traceType)} ${kindLabel} @(${layout.percentX}%,${layout.percentY}%)`;
    slot.setAttribute("aria-label", `${placement.getAlienSlotLabel(alienSlotId)} ${slot.title}`);
  }

  function renderStateTracePlacementSlots(alienSlotId, layer, alienState, options, activeKeys) {
    if (!options.showStateTraceSlots) return;

    const alienSlot = state.getAlienSlot(alienState, alienSlotId);
    if (!alienSlot || alienSlot.revealed) return;

    const allowedTraceTypes = options.allowedTraceTypes || placement.TRACE_TYPES;
    for (const traceType of allowedTraceTypes) {
      const traceSlot = alienSlot.traces?.[traceType];
      if (!traceSlot) continue;

      if (!traceSlot.firstPlaced) {
        const layout = getEffectiveTraceMarkerLayout(alienSlotId, traceType);
        if (!layout) continue;
        mountStateTracePlacementSlot(alienSlotId, traceType, "first", layout, layer, options, activeKeys);
        continue;
      }

      const extraIndex = traceSlot.extraCount || 0;
      const layout = getEffectiveExtraTraceGridLayout(alienSlotId, traceType, extraIndex);
      if (!layout) continue;
      mountStateTracePlacementSlot(alienSlotId, traceType, "extra", layout, layer, options, activeKeys);
    }
  }

  function mountExtraTraceToken(alienSlotId, traceType, extraIndex, layer, alienSlot, options, activeKeys) {
    const traceSlot = alienSlot?.traces?.[traceType];
    if (!traceSlot?.firstPlaced || extraIndex >= traceSlot.extraCount) {
      const key = getTokenElementKey(TRACE_KIND_EXTRA, alienSlotId, traceType, extraIndex);
      const existing = tokenElements.get(key);
      if (existing) {
        existing.remove();
        tokenElements.delete(key);
      }
      return;
    }

    const key = getTokenElementKey(TRACE_KIND_EXTRA, alienSlotId, traceType, extraIndex);
    activeKeys.add(key);

    let element = tokenElements.get(key);
    if (!element) {
      element = document.createElement("img");
      element.className = "alien-trace-token alien-trace-token-positioned alien-trace-token-extra";
      element.draggable = false;
      tokenElements.set(key, element);
      layer.appendChild(element);
    }

    const layout = getEffectiveExtraTraceGridLayout(alienSlotId, traceType, extraIndex);
    if (!layout) return;

    if (dragState?.element === element) return;

    const { row, col } = placement.getExtraTraceGridCellIndex(extraIndex);
    applyTraceTokenStyle(element, layout, placement.ALIEN_EXTRA_TRACE_TOKEN_DISPLAY_SCALE);
    element.src = resolvePlayerTokenAsset(traceSlot.ownerPlayerColor, options);
    element.alt = `${placement.getAlienSlotLabel(alienSlotId)} ${placement.getTraceTypeLabel(traceType)} 非首标记`;
    element.dataset.alienSlot = String(alienSlotId);
    element.dataset.traceType = traceType;
    element.dataset.traceKind = TRACE_KIND_EXTRA;
    element.dataset.extraIndex = String(extraIndex);
    element.title = `${placement.getTraceTypeLabel(traceType)} 非首标记 #${extraIndex + 1}`
      + ` 第${row + 1}行第${col + 1}列 @(${layout.percentX}%,${layout.percentY}%)`;
  }

  function renderAlienTraceMarkers(alienSlotId, layer, alienState, options = {}) {
    if (!layer) return;

    const alienSlot = state.getAlienSlot(alienState, alienSlotId);
    const activeKeys = new Set();

    for (const traceType of placement.TRACE_TYPES) {
      mountFirstTraceToken(alienSlotId, traceType, layer, alienSlot, options, activeKeys);

      const extraCount = alienSlot?.traces?.[traceType]?.extraCount || 0;
      for (let extraIndex = 0; extraIndex < extraCount; extraIndex += 1) {
        mountExtraTraceToken(alienSlotId, traceType, extraIndex, layer, alienSlot, options, activeKeys);
      }
    }

    renderStateTracePlacementSlots(alienSlotId, layer, alienState, options, activeKeys);

    for (const [key, element] of tokenElements.entries()) {
      const parts = key.split(":");
      const slotId = Number(parts[1]);
      if (slotId !== alienSlotId || activeKeys.has(key)) continue;
      element.remove();
      tokenElements.delete(key);
    }
    for (const [key, element] of stateTraceSlotElements.entries()) {
      const parts = key.split(":");
      const slotId = Number(parts[1]);
      if (slotId !== alienSlotId || activeKeys.has(key)) continue;
      element.remove();
      stateTraceSlotElements.delete(key);
    }
  }

  function renderAllAlienTraceMarkers(getLayerForSlot, alienState, options = {}) {
    for (const alienSlotId of placement.ALIEN_SLOT_IDS) {
      const layer = getLayerForSlot(alienSlotId);
      if (layer) {
        renderAlienTraceMarkers(alienSlotId, layer, alienState, options);
      }
    }
  }

  function getJiuzheSlotElementKey(alienSlotId, traceType, position) {
    return `jiuzhe-slot:${alienSlotId}:${traceType}:${position}`;
  }

  function mountJiuzheTraceSlot(alienSlotId, traceType, position, layer, alienState, options, activeKeys) {
    const grid = jiuzhe?.getTraceGrid?.(alienState, alienSlotId);
    const entry = grid?.[traceType]?.[position] || null;
    const key = getJiuzheSlotElementKey(alienSlotId, traceType, position);
    const tokenKey = getTokenElementKey(TRACE_KIND_JIUZHE, alienSlotId, traceType, position);
    const layout = getEffectiveJiuzheTraceMarkerLayout(alienSlotId, traceType, position);
    if (!layout) return;

    const visible = Boolean(entry)
      || Boolean(jiuzhe?.isJiuzheRevealedSlot?.(alienState, alienSlotId));
    if (!visible) {
      const existingSlot = jiuzheSlotElements.get(key);
      const existingToken = tokenElements.get(tokenKey);
      if (existingSlot) {
        existingSlot.remove();
        jiuzheSlotElements.delete(key);
      }
      if (existingToken) {
        existingToken.remove();
        tokenElements.delete(tokenKey);
      }
      return;
    }

    if (entry) {
      activeKeys.add(tokenKey);
      const existingSlot = jiuzheSlotElements.get(key);
      if (existingSlot) {
        existingSlot.remove();
        jiuzheSlotElements.delete(key);
      }

      let element = tokenElements.get(tokenKey);
      if (!element) {
        element = document.createElement("img");
        element.className = "alien-trace-token alien-trace-token-positioned alien-trace-token-jiuzhe";
        element.draggable = false;
        tokenElements.set(tokenKey, element);
        layer.appendChild(element);
      }

      if (dragState?.element === element) return;

      applyTraceTokenStyle(element, layout, placement.JIUZHE_TRACE_TOKEN_DISPLAY_SCALE || 1);
      element.src = resolvePlayerTokenAsset(entry.playerColor, options);
      element.alt = `${jiuzhe.formatTraceLabel?.(traceType, position) || traceType}`;
      element.dataset.alienSlot = String(alienSlotId);
      element.dataset.traceType = traceType;
      element.dataset.traceKind = TRACE_KIND_JIUZHE;
      element.dataset.jiuzhePosition = String(position);
      delete element.dataset.extraIndex;
      element.title = `${placement.getAlienSlotLabel(alienSlotId)} ${jiuzhe.formatTraceLabel?.(traceType, position) || traceType}`
        + ` ${options.getPlayerLabel?.(entry.playerColor) || entry.playerColor || "未知"}`
        + ` @(${layout.percentX}%,${layout.percentY}%)`;
      return;
    }

    activeKeys.add(key);
    const existingToken = tokenElements.get(tokenKey);
    if (existingToken) {
      existingToken.remove();
      tokenElements.delete(tokenKey);
    }

    let slot = jiuzheSlotElements.get(key);
    if (!slot) {
      slot = document.createElement("button");
      slot.type = "button";
      slot.className = "alien-jiuzhe-slot alien-trace-token-positioned";
      jiuzheSlotElements.set(key, slot);
      layer.appendChild(slot);
    }

    applyTraceTokenStyle(slot, layout, placement.JIUZHE_TRACE_TOKEN_DISPLAY_SCALE || 1);
    slot.dataset.alienSlot = String(alienSlotId);
    slot.dataset.traceType = traceType;
    slot.dataset.jiuzhePosition = String(position);
    slot.dataset.jiuzheTraceSlot = "true";
    slot.classList.toggle("is-placeable", options.canPlaceJiuzheTrace?.(alienSlotId, traceType, position) !== false);
    slot.title = `${jiuzhe.formatTraceLabel?.(traceType, position) || traceType} @(${layout.percentX}%,${layout.percentY}%)`;
    slot.setAttribute("aria-label", `${placement.getAlienSlotLabel(alienSlotId)} ${slot.title}`);
  }

  function renderJiuzheTraceMarkers(alienSlotId, layer, alienState, options = {}) {
    if (!layer || !jiuzhe) return;
    const activeKeys = new Set();

    for (const traceType of jiuzhe.TRACE_TYPES) {
      for (const position of jiuzhe.TRACE_POSITIONS) {
        mountJiuzheTraceSlot(alienSlotId, traceType, position, layer, alienState, options, activeKeys);
      }
    }

    for (const [key, element] of tokenElements.entries()) {
      const parts = key.split(":");
      if (parts[0] !== TRACE_KIND_JIUZHE) continue;
      const slotId = Number(parts[1]);
      if (slotId !== alienSlotId || activeKeys.has(key)) continue;
      element.remove();
      tokenElements.delete(key);
    }
    for (const [key, element] of jiuzheSlotElements.entries()) {
      const parts = key.split(":");
      const slotId = Number(parts[1]);
      if (slotId !== alienSlotId || activeKeys.has(key)) continue;
      element.remove();
      jiuzheSlotElements.delete(key);
    }
  }

  function renderAllJiuzheTraceMarkers(getLayerForSlot, alienState, options = {}) {
    if (!jiuzhe) return;
    for (const alienSlotId of placement.ALIEN_SLOT_IDS) {
      const layer = getLayerForSlot(alienSlotId);
      if (layer) renderJiuzheTraceMarkers(alienSlotId, layer, alienState, options);
    }
  }

  function getYichangdianSlotElementKey(alienSlotId, traceType, position) {
    return `yichangdian-slot:${alienSlotId}:${traceType}:${position}`;
  }

  function getYichangdianTokenKey(alienSlotId, traceType, position, stackIndex = 0) {
    return getTokenElementKey(
      TRACE_KIND_YICHANGDIAN,
      alienSlotId,
      traceType,
      Number(position) === 1 ? `1-${stackIndex}` : position,
    );
  }

  function getYichangdianTraceEntries(grid, traceType, position) {
    const value = grid?.[traceType]?.[position];
    if (Number(position) === 1) return Array.isArray(value) ? value : [];
    return value ? [value] : [];
  }

  function applyYichangdianTraceSlotStyle(slot, layout, position) {
    if (Number(position) !== 1) {
      applyTraceTokenStyle(slot, layout, placement.YICHANGDIAN_TRACE_TOKEN_DISPLAY_SCALE || 1);
      slot.classList.remove("alien-yichangdian-slot-stack-hotzone");
      slot.style.removeProperty("width");
      slot.style.removeProperty("height");
      slot.style.removeProperty("aspect-ratio");
      slot.style.removeProperty("border-radius");
      delete slot.dataset.hotzoneTopPercent;
      delete slot.dataset.hotzoneBottomPercent;
      return;
    }

    const slotDisplayScale = (placement.YICHANGDIAN_TRACE_TOKEN_DISPLAY_SCALE || 1) * YICHANGDIAN_SLOT_DISPLAY_SCALE;
    applyTraceTokenStyle(slot, layout, slotDisplayScale);
    const tokenSize = placement.getYichangdianTraceTokenSize?.(layout);
    if (!tokenSize) return;
    const stackStepY = placement.getYichangdianStackStepY?.(layout) || tokenSize.radiusXPercent;
    const hotzoneHeight = stackStepY * 7;
    const hotzoneCenterY = layout.percentY - stackStepY * 2.5;
    slot.classList.add("alien-yichangdian-slot-stack-hotzone");
    slot.style.left = `${layout.percentX}%`;
    slot.style.top = `${hotzoneCenterY}%`;
    slot.style.width = `${tokenSize.widthPercent * YICHANGDIAN_SLOT_DISPLAY_SCALE}%`;
    slot.style.height = `${hotzoneHeight}%`;
    slot.style.aspectRatio = "auto";
    slot.style.transform = "translate(-50%, -50%)";
    slot.dataset.hotzoneTopPercent = String(Math.round((layout.percentY - stackStepY * 6) * 100) / 100);
    slot.dataset.hotzoneBottomPercent = String(Math.round((layout.percentY + stackStepY) * 100) / 100);
  }

  function mountYichangdianTraceToken(alienSlotId, traceType, position, stackIndex, entry, layer, options, activeKeys) {
    const key = getYichangdianTokenKey(alienSlotId, traceType, position, stackIndex);
    activeKeys.add(key);

    let element = tokenElements.get(key);
    if (!element) {
      element = document.createElement("img");
      element.className = "alien-trace-token alien-trace-token-positioned alien-trace-token-yichangdian";
      element.draggable = false;
      tokenElements.set(key, element);
      layer.appendChild(element);
    }

    const layout = getEffectiveYichangdianTraceMarkerLayout(alienSlotId, traceType, position, stackIndex);
    if (!layout || dragState?.element === element) return;

    applyTraceTokenStyle(element, layout, placement.YICHANGDIAN_TRACE_TOKEN_DISPLAY_SCALE || 1);
    element.src = resolvePlayerTokenAsset(entry.playerColor, options);
    element.alt = `${yichangdian?.formatTraceLabel?.(traceType, position, stackIndex) || traceType}`;
    element.dataset.alienSlot = String(alienSlotId);
    element.dataset.traceType = traceType;
    element.dataset.traceKind = TRACE_KIND_YICHANGDIAN;
    element.dataset.yichangdianPosition = String(position);
    element.dataset.yichangdianStackIndex = String(stackIndex);
    element.classList.toggle(
      "is-placeable",
      Number(position) === 1 && options.canPlaceYichangdianTrace?.(alienSlotId, traceType, position) !== false,
    );
    if (Number(position) === 1) {
      element.dataset.yichangdianTraceSlot = "true";
    } else {
      delete element.dataset.yichangdianTraceSlot;
    }
    delete element.dataset.extraIndex;
    delete element.dataset.jiuzhePosition;
    element.title = `${placement.getAlienSlotLabel(alienSlotId)} ${yichangdian?.formatTraceLabel?.(traceType, position, stackIndex) || traceType}`
      + ` ${options.getPlayerLabel?.(entry.playerColor) || entry.playerColor || "未知"}`
      + ` @(${layout.percentX}%,${layout.percentY}%)`;
  }

  function mountYichangdianTraceSlot(alienSlotId, traceType, position, layer, alienState, options, activeKeys) {
    const grid = yichangdian?.getTraceGrid?.(alienState, alienSlotId);
    const entries = getYichangdianTraceEntries(grid, traceType, position);
    const slotKey = getYichangdianSlotElementKey(alienSlotId, traceType, position);
    const visible = Boolean(entries.length)
      || Boolean(yichangdian?.isYichangdianRevealedSlot?.(alienState, alienSlotId));
    if (!visible) {
      const existingSlot = yichangdianSlotElements.get(slotKey);
      if (existingSlot) {
        existingSlot.remove();
        yichangdianSlotElements.delete(slotKey);
      }
      return;
    }

    entries.forEach((entry, stackIndex) => {
      mountYichangdianTraceToken(alienSlotId, traceType, position, stackIndex, entry, layer, options, activeKeys);
    });

    const canPlace = options.canPlaceYichangdianTrace?.(alienSlotId, traceType, position) !== false;
    const shouldShowSlot = !entries.length || Number(position) === 1;
    if (!shouldShowSlot) {
      const existingSlot = yichangdianSlotElements.get(slotKey);
      if (existingSlot) {
        existingSlot.remove();
        yichangdianSlotElements.delete(slotKey);
      }
      return;
    }

    activeKeys.add(slotKey);
    let slot = yichangdianSlotElements.get(slotKey);
    if (!slot) {
      slot = document.createElement("button");
      slot.type = "button";
      slot.className = "alien-yichangdian-slot alien-trace-token-positioned";
      yichangdianSlotElements.set(slotKey, slot);
      layer.appendChild(slot);
    }

    const layout = getEffectiveYichangdianTraceMarkerLayout(alienSlotId, traceType, position, 0);
    if (!layout) return;
    applyYichangdianTraceSlotStyle(slot, layout, position);
    slot.dataset.alienSlot = String(alienSlotId);
    slot.dataset.traceType = traceType;
    slot.dataset.yichangdianPosition = String(position);
    slot.dataset.yichangdianTraceSlot = "true";
    slot.classList.toggle("is-placeable", canPlace);
    slot.title = `${yichangdian?.formatTraceLabel?.(traceType, position) || traceType} @(${layout.percentX}%,${layout.percentY}%)`;
    slot.setAttribute("aria-label", `${placement.getAlienSlotLabel(alienSlotId)} ${slot.title}`);
  }

  function renderYichangdianTraceMarkers(alienSlotId, layer, alienState, options = {}) {
    if (!layer || !yichangdian) return;
    const activeKeys = new Set();

    for (const traceType of yichangdian.TRACE_TYPES) {
      for (const position of yichangdian.TRACE_POSITIONS) {
        mountYichangdianTraceSlot(alienSlotId, traceType, position, layer, alienState, options, activeKeys);
      }
    }

    for (const [key, element] of tokenElements.entries()) {
      const parts = key.split(":");
      if (parts[0] !== TRACE_KIND_YICHANGDIAN) continue;
      const slotId = Number(parts[1]);
      if (slotId !== alienSlotId || activeKeys.has(key)) continue;
      element.remove();
      tokenElements.delete(key);
    }
    for (const [key, element] of yichangdianSlotElements.entries()) {
      const parts = key.split(":");
      const slotId = Number(parts[1]);
      if (slotId !== alienSlotId || activeKeys.has(key)) continue;
      element.remove();
      yichangdianSlotElements.delete(key);
    }
  }

  function renderAllYichangdianTraceMarkers(getLayerForSlot, alienState, options = {}) {
    if (!yichangdian) return;
    for (const alienSlotId of placement.ALIEN_SLOT_IDS) {
      const layer = getLayerForSlot(alienSlotId);
      if (layer) renderYichangdianTraceMarkers(alienSlotId, layer, alienState, options);
    }
  }

  function getFangzhouSlotElementKey(alienSlotId, traceType, position) {
    return `fangzhou-slot:${alienSlotId}:${traceType}:${position}`;
  }

  function getFangzhouTokenKey(alienSlotId, traceType, position, stackIndex = 0) {
    return getTokenElementKey(
      TRACE_KIND_FANGZHOU,
      alienSlotId,
      traceType,
      position,
    );
  }

  function applyFangzhouTraceSlotStyle(slot, layout) {
    applyTraceTokenStyle(slot, layout, placement.FANGZHOU_TRACE_TOKEN_DISPLAY_SCALE || 1);
    slot.classList.remove("alien-fangzhou-slot-stack-hotzone");
    slot.style.removeProperty("width");
    slot.style.removeProperty("height");
    slot.style.removeProperty("aspect-ratio");
    slot.style.removeProperty("border-radius");
    delete slot.dataset.hotzoneTopPercent;
    delete slot.dataset.hotzoneBottomPercent;
  }

  function mountFangzhouTraceToken(alienSlotId, traceType, position, stackIndex, entry, layer, options, activeKeys) {
    const key = getFangzhouTokenKey(alienSlotId, traceType, position, stackIndex);
    activeKeys.add(key);

    let element = tokenElements.get(key);
    if (!element) {
      element = document.createElement("img");
      element.className = "alien-trace-token alien-trace-token-positioned alien-trace-token-fangzhou";
      element.draggable = false;
      tokenElements.set(key, element);
      layer.appendChild(element);
    }

    const layout = getEffectiveFangzhouTraceMarkerLayout(alienSlotId, traceType, position, stackIndex);
    if (!layout || dragState?.element === element) return;

    applyTraceTokenStyle(element, layout, placement.FANGZHOU_TRACE_TOKEN_DISPLAY_SCALE || 1);
    element.src = resolvePlayerTokenAsset(entry.playerColor, options);
    element.alt = `${fangzhou?.formatTraceLabel?.(traceType, position, stackIndex) || traceType}`;
    element.dataset.alienSlot = String(alienSlotId);
    element.dataset.traceType = traceType;
    element.dataset.traceKind = TRACE_KIND_FANGZHOU;
    element.dataset.fangzhouPosition = String(position);
    element.dataset.fangzhouStackIndex = String(stackIndex);
    element.classList.remove("is-placeable");
    delete element.dataset.fangzhouTraceSlot;
    delete element.dataset.extraIndex;
    delete element.dataset.jiuzhePosition;
    delete element.dataset.yichangdianPosition;
    element.title = `${placement.getAlienSlotLabel(alienSlotId)} ${fangzhou?.formatTraceLabel?.(traceType, position, stackIndex) || traceType}`
      + ` ${options.getPlayerLabel?.(entry.playerColor) || entry.playerColor || "未知"}`
      + ` @(${layout.percentX}%,${layout.percentY}%)`;
  }

  function mountFangzhouTraceSlot(alienSlotId, traceType, position, layer, alienState, options, activeKeys) {
    const grid = fangzhou?.getTraceGrid?.(alienState, alienSlotId);
    const entries = fangzhou?.getTraceEntries?.(grid, traceType, position) || [];
    const slotKey = getFangzhouSlotElementKey(alienSlotId, traceType, position);
    const visible = Boolean(entries.length)
      || Boolean(fangzhou?.isFangzhouRevealedSlot?.(alienState, alienSlotId));
    if (!visible) {
      const existingSlot = fangzhouSlotElements.get(slotKey);
      if (existingSlot) {
        existingSlot.remove();
        fangzhouSlotElements.delete(slotKey);
      }
      return;
    }

    entries.forEach((entry, stackIndex) => {
      mountFangzhouTraceToken(alienSlotId, traceType, position, stackIndex, entry, layer, options, activeKeys);
    });

    const canPlace = options.canPlaceFangzhouTrace?.(alienSlotId, traceType, position) !== false;
    const shouldShowSlot = !entries.length;
    if (!shouldShowSlot) {
      const existingSlot = fangzhouSlotElements.get(slotKey);
      if (existingSlot) {
        existingSlot.remove();
        fangzhouSlotElements.delete(slotKey);
      }
      return;
    }

    activeKeys.add(slotKey);
    let slot = fangzhouSlotElements.get(slotKey);
    if (!slot) {
      slot = document.createElement("button");
      slot.type = "button";
      slot.className = "alien-fangzhou-slot alien-trace-token-positioned";
      fangzhouSlotElements.set(slotKey, slot);
      layer.appendChild(slot);
    }

    const layout = getEffectiveFangzhouTraceMarkerLayout(alienSlotId, traceType, position, 0);
    if (!layout) return;
    applyFangzhouTraceSlotStyle(slot, layout);
    slot.dataset.alienSlot = String(alienSlotId);
    slot.dataset.traceType = traceType;
    slot.dataset.fangzhouPosition = String(position);
    slot.dataset.fangzhouTraceSlot = "true";
    slot.classList.toggle("is-placeable", canPlace);
    slot.title = `${fangzhou?.formatTraceLabel?.(traceType, position) || traceType} @(${layout.percentX}%,${layout.percentY}%)`;
    slot.setAttribute("aria-label", `${placement.getAlienSlotLabel(alienSlotId)} ${slot.title}`);
  }

  function renderFangzhouTraceMarkers(alienSlotId, layer, alienState, options = {}) {
    if (!layer || !fangzhou) return;
    const activeKeys = new Set();

    for (const traceType of fangzhou.TRACE_TYPES) {
      for (const position of fangzhou.TRACE_POSITIONS) {
        mountFangzhouTraceSlot(alienSlotId, traceType, position, layer, alienState, options, activeKeys);
      }
    }

    for (const [key, element] of tokenElements.entries()) {
      const parts = key.split(":");
      if (parts[0] !== TRACE_KIND_FANGZHOU) continue;
      const slotId = Number(parts[1]);
      if (slotId !== alienSlotId || activeKeys.has(key)) continue;
      element.remove();
      tokenElements.delete(key);
    }
    for (const [key, element] of fangzhouSlotElements.entries()) {
      const parts = key.split(":");
      const slotId = Number(parts[1]);
      if (slotId !== alienSlotId || activeKeys.has(key)) continue;
      element.remove();
      fangzhouSlotElements.delete(key);
    }
  }

  function renderAllFangzhouTraceMarkers(getLayerForSlot, alienState, options = {}) {
    if (!fangzhou) return;
    for (const alienSlotId of placement.ALIEN_SLOT_IDS) {
      const layer = getLayerForSlot(alienSlotId);
      if (layer) renderFangzhouTraceMarkers(alienSlotId, layer, alienState, options);
    }
  }

  function getBanrenmaSlotElementKey(alienSlotId, traceType, position) {
    return `banrenma-slot:${alienSlotId}:${traceType}:${position}`;
  }

  function getBanrenmaTokenKey(alienSlotId, traceType, position, stackIndex = 0) {
    return getTokenElementKey(
      TRACE_KIND_BANRENMA,
      alienSlotId,
      traceType,
      Number(position) === 1 ? `1-${stackIndex}` : position,
    );
  }

  function applyBanrenmaTraceSlotStyle(slot, layout, position) {
    if (Number(position) !== 1) {
      applyTraceTokenStyle(slot, layout, placement.BANRENMA_TRACE_TOKEN_DISPLAY_SCALE || 1);
      slot.classList.remove("alien-banrenma-slot-stack-hotzone");
      slot.style.removeProperty("width");
      slot.style.removeProperty("height");
      slot.style.removeProperty("aspect-ratio");
      slot.style.removeProperty("border-radius");
      delete slot.dataset.hotzoneTopPercent;
      delete slot.dataset.hotzoneBottomPercent;
      return;
    }

    const slotDisplayScale = (placement.BANRENMA_TRACE_TOKEN_DISPLAY_SCALE || 1) * YICHANGDIAN_SLOT_DISPLAY_SCALE;
    applyTraceTokenStyle(slot, layout, slotDisplayScale);
    const tokenSize = placement.getBanrenmaTraceTokenSize?.(layout);
    if (!tokenSize) return;
    const stackStepY = placement.getBanrenmaStackStepY?.(layout) || tokenSize.radiusXPercent;
    const hotzoneHeight = stackStepY * 7;
    const hotzoneCenterY = layout.percentY - stackStepY * 2.5;
    slot.classList.add("alien-banrenma-slot-stack-hotzone");
    slot.style.left = `${layout.percentX}%`;
    slot.style.top = `${hotzoneCenterY}%`;
    slot.style.width = `${tokenSize.widthPercent * YICHANGDIAN_SLOT_DISPLAY_SCALE}%`;
    slot.style.height = `${hotzoneHeight}%`;
    slot.style.aspectRatio = "auto";
    slot.style.transform = "translate(-50%, -50%)";
    slot.dataset.hotzoneTopPercent = String(Math.round((layout.percentY - stackStepY * 6) * 100) / 100);
    slot.dataset.hotzoneBottomPercent = String(Math.round((layout.percentY + stackStepY) * 100) / 100);
  }

  function mountBanrenmaTraceToken(alienSlotId, traceType, position, stackIndex, entry, layer, options, activeKeys) {
    const key = getBanrenmaTokenKey(alienSlotId, traceType, position, stackIndex);
    activeKeys.add(key);

    let element = tokenElements.get(key);
    if (!element) {
      element = document.createElement("img");
      element.className = "alien-trace-token alien-trace-token-positioned alien-trace-token-banrenma";
      element.draggable = false;
      tokenElements.set(key, element);
      layer.appendChild(element);
    }

    const layout = getEffectiveBanrenmaTraceMarkerLayout(alienSlotId, traceType, position, stackIndex);
    if (!layout || dragState?.element === element) return;

    applyTraceTokenStyle(element, layout, placement.BANRENMA_TRACE_TOKEN_DISPLAY_SCALE || 1);
    element.src = resolvePlayerTokenAsset(entry.playerColor, options);
    element.alt = `${banrenma?.formatTraceLabel?.(traceType, position, stackIndex) || traceType}`;
    element.dataset.alienSlot = String(alienSlotId);
    element.dataset.traceType = traceType;
    element.dataset.traceKind = TRACE_KIND_BANRENMA;
    element.dataset.banrenmaPosition = String(position);
    element.dataset.banrenmaStackIndex = String(stackIndex);
    element.classList.toggle(
      "is-placeable",
      Number(position) === 1 && options.canPlaceBanrenmaTrace?.(alienSlotId, traceType, position) !== false,
    );
    if (Number(position) === 1) {
      element.dataset.banrenmaTraceSlot = "true";
    } else {
      delete element.dataset.banrenmaTraceSlot;
    }
    delete element.dataset.extraIndex;
    delete element.dataset.jiuzhePosition;
    delete element.dataset.yichangdianPosition;
    delete element.dataset.fangzhouPosition;
    element.title = `${placement.getAlienSlotLabel(alienSlotId)} ${banrenma?.formatTraceLabel?.(traceType, position, stackIndex) || traceType}`
      + ` ${options.getPlayerLabel?.(entry.playerColor) || entry.playerColor || "未知"}`
      + ` @(${layout.percentX}%,${layout.percentY}%)`;
  }

  function mountBanrenmaTraceSlot(alienSlotId, traceType, position, layer, alienState, options, activeKeys) {
    const grid = banrenma?.getTraceGrid?.(alienState, alienSlotId);
    const entries = banrenma?.getTraceEntries?.(grid, traceType, position) || [];
    const slotKey = getBanrenmaSlotElementKey(alienSlotId, traceType, position);
    const visible = Boolean(entries.length)
      || Boolean(banrenma?.isBanrenmaRevealedSlot?.(alienState, alienSlotId));
    if (!visible) {
      const existingSlot = banrenmaSlotElements.get(slotKey);
      if (existingSlot) {
        existingSlot.remove();
        banrenmaSlotElements.delete(slotKey);
      }
      return;
    }

    entries.forEach((entry, stackIndex) => {
      mountBanrenmaTraceToken(alienSlotId, traceType, position, stackIndex, entry, layer, options, activeKeys);
    });

    const canPlace = options.canPlaceBanrenmaTrace?.(alienSlotId, traceType, position) !== false;
    const shouldShowSlot = !entries.length || Number(position) === 1;
    if (!shouldShowSlot) {
      const existingSlot = banrenmaSlotElements.get(slotKey);
      if (existingSlot) {
        existingSlot.remove();
        banrenmaSlotElements.delete(slotKey);
      }
      return;
    }

    activeKeys.add(slotKey);
    let slot = banrenmaSlotElements.get(slotKey);
    if (!slot) {
      slot = document.createElement("button");
      slot.type = "button";
      slot.className = "alien-banrenma-slot alien-trace-token-positioned";
      banrenmaSlotElements.set(slotKey, slot);
      layer.appendChild(slot);
    }

    const layout = getEffectiveBanrenmaTraceMarkerLayout(alienSlotId, traceType, position, 0);
    if (!layout) return;
    applyBanrenmaTraceSlotStyle(slot, layout, position);
    slot.dataset.alienSlot = String(alienSlotId);
    slot.dataset.traceType = traceType;
    slot.dataset.banrenmaPosition = String(position);
    slot.dataset.banrenmaTraceSlot = "true";
    slot.classList.toggle("is-placeable", canPlace);
    slot.title = `${banrenma?.formatTraceLabel?.(traceType, position) || traceType} @(${layout.percentX}%,${layout.percentY}%)`;
    slot.setAttribute("aria-label", `${placement.getAlienSlotLabel(alienSlotId)} ${slot.title}`);
  }

  function renderBanrenmaTraceMarkers(alienSlotId, layer, alienState, options = {}) {
    if (!layer || !banrenma) return;
    const activeKeys = new Set();

    for (const traceType of banrenma.TRACE_TYPES) {
      for (const position of banrenma.TRACE_POSITIONS) {
        mountBanrenmaTraceSlot(alienSlotId, traceType, position, layer, alienState, options, activeKeys);
      }
    }

    for (const [key, element] of tokenElements.entries()) {
      const parts = key.split(":");
      if (parts[0] !== TRACE_KIND_BANRENMA) continue;
      const slotId = Number(parts[1]);
      if (slotId !== alienSlotId || activeKeys.has(key)) continue;
      element.remove();
      tokenElements.delete(key);
    }
    for (const [key, element] of banrenmaSlotElements.entries()) {
      const parts = key.split(":");
      const slotId = Number(parts[1]);
      if (slotId !== alienSlotId || activeKeys.has(key)) continue;
      element.remove();
      banrenmaSlotElements.delete(key);
    }
  }

  function renderAllBanrenmaTraceMarkers(getLayerForSlot, alienState, options = {}) {
    if (!banrenma) return;
    for (const alienSlotId of placement.ALIEN_SLOT_IDS) {
      const layer = getLayerForSlot(alienSlotId);
      if (layer) renderBanrenmaTraceMarkers(alienSlotId, layer, alienState, options);
    }
  }

  function getChongSlotElementKey(alienSlotId, traceType, position) {
    return `chong-slot:${alienSlotId}:${traceType}:${position}`;
  }

  function getChongTokenKey(alienSlotId, traceType, position) {
    return getTokenElementKey(TRACE_KIND_CHONG, alienSlotId, traceType, position);
  }

  function getChongFossilKey(alienSlotId, position) {
    return `chong-fossil:${alienSlotId}:${position}`;
  }

  function applyChongTraceSlotStyle(slot, layout) {
    applyTraceTokenStyle(slot, layout, placement.CHONG_TRACE_TOKEN_DISPLAY_SCALE || 1);
  }

  function mountChongFossilMarker(alienSlotId, position, fossilId, layer, activeKeys) {
    const key = getChongFossilKey(alienSlotId, position);
    activeKeys.add(key);

    let element = chongFossilElements.get(key);
    if (!element) {
      element = document.createElement("img");
      element.className = "alien-trace-token-positioned alien-chong-fossil-marker";
      element.draggable = false;
      chongFossilElements.set(key, element);
      layer.appendChild(element);
    }

    const layout = getEffectiveChongTraceMarkerLayout(alienSlotId, "blue", position);
    if (!layout) return;
    applyTraceTokenStyle(element, layout, CHONG_FOSSIL_MARKER_DISPLAY_SCALE);
    element.src = chong.getFossilSrc(fossilId);
    element.alt = `虫族化石 ${fossilId}`;
    element.dataset.alienSlot = String(alienSlotId);
    element.dataset.chongFossilPosition = String(position);
    element.dataset.chongFossilId = fossilId;
    element.title = `${placement.getAlienSlotLabel(alienSlotId)} 虫族化石 ${fossilId} @蓝${position}`;
  }

  function mountChongFossilMarkers(alienSlotId, layer, alienState, activeKeys) {
    const slot = state.getAlienSlot(alienState, alienSlotId);
    if (!slot?.revealed || slot.alienId !== chong?.ALIEN_ID) return;
    const fossilSlots = alienState?.chong?.panelFossilSlots || {};
    for (const [position, fossilId] of Object.entries(fossilSlots)) {
      if (!fossilId) continue;
      mountChongFossilMarker(alienSlotId, Number(position), fossilId, layer, activeKeys);
    }
  }

  function mountChongTraceToken(alienSlotId, traceType, position, entry, layer, options, activeKeys) {
    const key = getChongTokenKey(alienSlotId, traceType, position);
    activeKeys.add(key);

    let element = tokenElements.get(key);
    if (!element) {
      element = document.createElement("img");
      element.className = "alien-trace-token alien-trace-token-positioned alien-trace-token-chong";
      element.draggable = false;
      tokenElements.set(key, element);
      layer.appendChild(element);
    }

    const layout = getEffectiveChongTraceMarkerLayout(alienSlotId, traceType, position);
    if (!layout || dragState?.element === element) return;

    applyTraceTokenStyle(element, layout, placement.CHONG_TRACE_TOKEN_DISPLAY_SCALE || 1);
    element.src = resolvePlayerTokenAsset(entry.playerColor, options);
    element.alt = `${chong?.formatTraceLabel?.(traceType, position) || traceType}`;
    element.dataset.alienSlot = String(alienSlotId);
    element.dataset.traceType = traceType;
    element.dataset.traceKind = TRACE_KIND_CHONG;
    element.dataset.chongPosition = String(position);
    element.classList.remove("is-placeable");
    delete element.dataset.chongTraceSlot;
    delete element.dataset.extraIndex;
    delete element.dataset.jiuzhePosition;
    delete element.dataset.yichangdianPosition;
    delete element.dataset.fangzhouPosition;
    delete element.dataset.banrenmaPosition;
    element.title = `${placement.getAlienSlotLabel(alienSlotId)} ${chong?.formatTraceLabel?.(traceType, position) || traceType}`
      + ` ${options.getPlayerLabel?.(entry.playerColor) || entry.playerColor || "未知"}`
      + ` @(${layout.percentX}%,${layout.percentY}%)`;
  }

  function mountChongTraceSlot(alienSlotId, traceType, position, layer, alienState, options, activeKeys) {
    const grid = chong?.getTraceGrid?.(alienState, alienSlotId);
    const entries = chong?.getTraceEntries?.(grid, traceType, position) || [];
    const slotKey = getChongSlotElementKey(alienSlotId, traceType, position);
    const visible = Boolean(entries.length)
      || Boolean(chong?.isChongRevealedSlot?.(alienState, alienSlotId));
    if (!visible) {
      const existingSlot = chongSlotElements.get(slotKey);
      if (existingSlot) {
        existingSlot.remove();
        chongSlotElements.delete(slotKey);
      }
      return;
    }

    entries.forEach((entry) => {
      mountChongTraceToken(alienSlotId, traceType, position, entry, layer, options, activeKeys);
    });

    const canPlace = options.canPlaceChongTrace?.(alienSlotId, traceType, position) !== false;
    const shouldShowSlot = !entries.length;
    if (!shouldShowSlot) {
      const existingSlot = chongSlotElements.get(slotKey);
      if (existingSlot) {
        existingSlot.remove();
        chongSlotElements.delete(slotKey);
      }
      return;
    }

    activeKeys.add(slotKey);
    let slot = chongSlotElements.get(slotKey);
    if (!slot) {
      slot = document.createElement("button");
      slot.type = "button";
      slot.className = "alien-chong-slot alien-trace-token-positioned";
      chongSlotElements.set(slotKey, slot);
      layer.appendChild(slot);
    }

    const layout = getEffectiveChongTraceMarkerLayout(alienSlotId, traceType, position);
    if (!layout) return;
    applyChongTraceSlotStyle(slot, layout);
    slot.dataset.alienSlot = String(alienSlotId);
    slot.dataset.traceType = traceType;
    slot.dataset.chongPosition = String(position);
    slot.dataset.chongTraceSlot = "true";
    slot.classList.toggle("is-placeable", canPlace);
    slot.title = `${chong?.formatTraceLabel?.(traceType, position) || traceType} @(${layout.percentX}%,${layout.percentY}%)`;
    slot.setAttribute("aria-label", `${placement.getAlienSlotLabel(alienSlotId)} ${slot.title}`);
  }

  function renderChongTraceMarkers(alienSlotId, layer, alienState, options = {}) {
    if (!layer || !chong) return;
    const activeKeys = new Set();

    mountChongFossilMarkers(alienSlotId, layer, alienState, activeKeys);

    for (const traceType of chong.TRACE_TYPES) {
      for (const position of chong.getPositionsForTraceType(traceType)) {
        mountChongTraceSlot(alienSlotId, traceType, position, layer, alienState, options, activeKeys);
      }
    }

    for (const [key, element] of tokenElements.entries()) {
      const parts = key.split(":");
      if (parts[0] !== TRACE_KIND_CHONG) continue;
      const slotId = Number(parts[1]);
      if (slotId !== alienSlotId || activeKeys.has(key)) continue;
      element.remove();
      tokenElements.delete(key);
    }
    for (const [key, element] of chongSlotElements.entries()) {
      const parts = key.split(":");
      const slotId = Number(parts[1]);
      if (slotId !== alienSlotId || activeKeys.has(key)) continue;
      element.remove();
      chongSlotElements.delete(key);
    }
    for (const [key, element] of chongFossilElements.entries()) {
      const parts = key.split(":");
      const slotId = Number(parts[1]);
      if (slotId !== alienSlotId || activeKeys.has(key)) continue;
      element.remove();
      chongFossilElements.delete(key);
    }
  }

  function renderAllChongTraceMarkers(getLayerForSlot, alienState, options = {}) {
    if (!chong) return;
    for (const alienSlotId of placement.ALIEN_SLOT_IDS) {
      const layer = getLayerForSlot(alienSlotId);
      if (layer) renderChongTraceMarkers(alienSlotId, layer, alienState, options);
    }
  }

  function getAmibaSlotElementKey(alienSlotId, traceType, position) {
    return `amiba-slot:${alienSlotId}:${traceType}:${position}`;
  }

  function getAmibaTokenKey(alienSlotId, traceType, position) {
    return getTokenElementKey(TRACE_KIND_AMIBA, alienSlotId, traceType, position);
  }

  function getAmibaSymbolKey(alienSlotId, slotId) {
    return `amiba-symbol:${alienSlotId}:${slotId}`;
  }

  function applyAmibaTraceSlotStyle(slot, layout) {
    applyTraceTokenStyle(slot, layout, placement.AMIBA_TRACE_TOKEN_DISPLAY_SCALE || 1);
  }

  function mountAmibaSymbolMarker(alienSlotId, symbolEntry, layer, activeKeys) {
    const slotId = symbolEntry?.slotId;
    const symbolId = symbolEntry?.symbolId;
    if (!slotId || !symbolId) return;
    const key = getAmibaSymbolKey(alienSlotId, slotId);
    activeKeys.add(key);

    let element = amibaSymbolElements.get(key);
    if (!element) {
      element = document.createElement("img");
      element.className = "alien-trace-token alien-trace-token-positioned alien-amiba-symbol-marker";
      element.draggable = false;
      amibaSymbolElements.set(key, element);
      layer.appendChild(element);
    }

    const layout = getEffectiveAmibaSymbolMarkerLayout(alienSlotId, slotId);
    if (!layout) return;
    applyTraceTokenStyle(element, layout, placement.AMIBA_SYMBOL_DISPLAY_SCALE || 1);
    element.src = amiba.getSymbolSrc(symbolId);
    element.alt = `阿米巴 ${symbolId}`;
    element.dataset.alienSlot = String(alienSlotId);
    element.dataset.traceKind = TRACE_KIND_AMIBA_SYMBOL;
    element.dataset.amibaSymbolSlot = slotId;
    element.dataset.amibaSymbolId = symbolId;
    element.title = `${placement.getAlienSlotLabel(alienSlotId)} 阿米巴 ${symbolId} @ ${amiba?.formatSymbolSlotLabel?.(slotId) || slotId}`
      + ` (${layout.percentX}%,${layout.percentY}%)`;
  }

  function mountAmibaSymbols(alienSlotId, layer, alienState, activeKeys) {
    const slot = state.getAlienSlot(alienState, alienSlotId);
    if (!slot?.revealed || slot.alienId !== amiba?.ALIEN_ID) return;
    for (const symbol of amiba.listSymbols?.(alienState) || []) {
      mountAmibaSymbolMarker(alienSlotId, symbol, layer, activeKeys);
    }
  }

  function mountAmibaTraceToken(alienSlotId, traceType, position, entry, layer, options, activeKeys) {
    const key = getAmibaTokenKey(alienSlotId, traceType, position);
    activeKeys.add(key);

    let element = tokenElements.get(key);
    if (!element) {
      element = document.createElement("img");
      element.className = "alien-trace-token alien-trace-token-positioned alien-trace-token-amiba";
      element.draggable = false;
      tokenElements.set(key, element);
      layer.appendChild(element);
    }

    const layout = getEffectiveAmibaTraceMarkerLayout(alienSlotId, traceType, position);
    if (!layout || dragState?.element === element) return;

    applyTraceTokenStyle(element, layout, placement.AMIBA_TRACE_TOKEN_DISPLAY_SCALE || 1);
    element.src = resolvePlayerTokenAsset(entry.playerColor, options);
    element.alt = `${amiba?.formatTraceLabel?.(traceType, position) || traceType}`;
    element.dataset.alienSlot = String(alienSlotId);
    element.dataset.traceType = traceType;
    element.dataset.traceKind = TRACE_KIND_AMIBA;
    element.dataset.amibaPosition = String(position);
    element.classList.remove("is-placeable");
    delete element.dataset.amibaTraceSlot;
    delete element.dataset.extraIndex;
    delete element.dataset.jiuzhePosition;
    delete element.dataset.yichangdianPosition;
    delete element.dataset.fangzhouPosition;
    delete element.dataset.banrenmaPosition;
    delete element.dataset.chongPosition;
    element.title = `${placement.getAlienSlotLabel(alienSlotId)} ${amiba?.formatTraceLabel?.(traceType, position) || traceType}`
      + ` ${options.getPlayerLabel?.(entry.playerColor) || entry.playerColor || "未知"}`
      + ` @(${layout.percentX}%,${layout.percentY}%)`;
  }

  function mountAmibaTraceSlot(alienSlotId, traceType, position, layer, alienState, options, activeKeys) {
    const grid = amiba?.getTraceGrid?.(alienState, alienSlotId);
    const entries = amiba?.getTraceEntries?.(grid, traceType, position) || [];
    const slotKey = getAmibaSlotElementKey(alienSlotId, traceType, position);
    const visible = Boolean(entries.length)
      || Boolean(amiba?.isAmibaRevealedSlot?.(alienState, alienSlotId));
    if (!visible) {
      const existingSlot = amibaSlotElements.get(slotKey);
      if (existingSlot) {
        existingSlot.remove();
        amibaSlotElements.delete(slotKey);
      }
      return;
    }

    entries.forEach((entry) => {
      mountAmibaTraceToken(alienSlotId, traceType, position, entry, layer, options, activeKeys);
    });

    const canPlace = options.canPlaceAmibaTrace?.(alienSlotId, traceType, position) !== false;
    const shouldShowSlot = !entries.length;
    if (!shouldShowSlot) {
      const existingSlot = amibaSlotElements.get(slotKey);
      if (existingSlot) {
        existingSlot.remove();
        amibaSlotElements.delete(slotKey);
      }
      return;
    }

    activeKeys.add(slotKey);
    let slot = amibaSlotElements.get(slotKey);
    if (!slot) {
      slot = document.createElement("button");
      slot.type = "button";
      slot.className = "alien-amiba-slot alien-trace-token-positioned";
      amibaSlotElements.set(slotKey, slot);
      layer.appendChild(slot);
    }

    const layout = getEffectiveAmibaTraceMarkerLayout(alienSlotId, traceType, position);
    if (!layout) return;
    applyAmibaTraceSlotStyle(slot, layout);
    slot.dataset.alienSlot = String(alienSlotId);
    slot.dataset.traceType = traceType;
    slot.dataset.amibaPosition = String(position);
    slot.dataset.amibaTraceSlot = "true";
    slot.classList.toggle("is-placeable", canPlace);
    slot.title = `${amiba?.formatTraceLabel?.(traceType, position) || traceType} @(${layout.percentX}%,${layout.percentY}%)`;
    slot.setAttribute("aria-label", `${placement.getAlienSlotLabel(alienSlotId)} ${slot.title}`);
  }

  function renderAmibaTraceMarkers(alienSlotId, layer, alienState, options = {}) {
    if (!layer || !amiba) return;
    const activeKeys = new Set();

    mountAmibaSymbols(alienSlotId, layer, alienState, activeKeys);

    for (const traceType of amiba.TRACE_TYPES) {
      for (const position of amiba.TRACE_POSITIONS) {
        mountAmibaTraceSlot(alienSlotId, traceType, position, layer, alienState, options, activeKeys);
      }
    }

    for (const [key, element] of tokenElements.entries()) {
      const parts = key.split(":");
      if (parts[0] !== TRACE_KIND_AMIBA) continue;
      const slotId = Number(parts[1]);
      if (slotId !== alienSlotId || activeKeys.has(key)) continue;
      element.remove();
      tokenElements.delete(key);
    }
    for (const [key, element] of amibaSlotElements.entries()) {
      const parts = key.split(":");
      const slotId = Number(parts[1]);
      if (slotId !== alienSlotId || activeKeys.has(key)) continue;
      element.remove();
      amibaSlotElements.delete(key);
    }
    for (const [key, element] of amibaSymbolElements.entries()) {
      const parts = key.split(":");
      const slotId = Number(parts[1]);
      if (slotId !== alienSlotId || activeKeys.has(key)) continue;
      element.remove();
      amibaSymbolElements.delete(key);
    }
  }

  function renderAllAmibaTraceMarkers(getLayerForSlot, alienState, options = {}) {
    if (!amiba) return;
    for (const alienSlotId of placement.ALIEN_SLOT_IDS) {
      const layer = getLayerForSlot(alienSlotId);
      if (layer) renderAmibaTraceMarkers(alienSlotId, layer, alienState, options);
    }
  }

  function getAomomoTraceTokenKey(alienSlotId, traceType, position, stackIndex = 0) {
    return `${TRACE_KIND_AOMOMO}:${alienSlotId}:${traceType}:${position}:${stackIndex}`;
  }

  function getAomomoSlotElementKey(alienSlotId, traceType, position) {
    return `aomomo-slot:${alienSlotId}:${traceType}:${position}`;
  }

  function getAomomoOrbitTokenKey(alienSlotId, marker) {
    return `${TRACE_KIND_AOMOMO_ORBIT}:${alienSlotId}:${marker?.id || marker?.sequence || 1}`;
  }

  function getAomomoLandingTokenKey(alienSlotId, marker, position) {
    return `${TRACE_KIND_AOMOMO_LANDING}:${alienSlotId}:${marker?.id || marker?.sequence || position}`;
  }

  function applyAomomoTraceSlotStyle(slot, layout, position) {
    if (Number(position) !== 1) {
      applyTraceTokenStyle(slot, layout, placement.AOMOMO_TRACE_TOKEN_DISPLAY_SCALE || 1);
      slot.classList.remove("alien-aomomo-slot-stack-hotzone");
      return;
    }
    applyTraceTokenStyle(slot, layout, placement.AOMOMO_TRACE_TOKEN_DISPLAY_SCALE || 1);
    slot.classList.add("alien-aomomo-slot-stack-hotzone");
  }

  function resolvePlayerOrbitAsset(playerColor, options = {}) {
    if (!playerColor || !options.getPlayerOrbitAsset) {
      return resolvePlayerTokenAsset(playerColor, options);
    }
    return options.getPlayerOrbitAsset(playerColor) || resolvePlayerTokenAsset(playerColor, options);
  }

  function resolvePlayerLandingAsset(playerColor, options = {}) {
    if (!playerColor || !options.getPlayerLandingAsset) {
      return resolvePlayerTokenAsset(playerColor, options);
    }
    return options.getPlayerLandingAsset(playerColor) || resolvePlayerTokenAsset(playerColor, options);
  }

  function mountAomomoPanelMarker(alienSlotId, marker, kind, position, layer, options, activeKeys) {
    const key = kind === "orbit"
      ? getAomomoOrbitTokenKey(alienSlotId, marker)
      : getAomomoLandingTokenKey(alienSlotId, marker, position);
    activeKeys.add(key);
    let element = tokenElements.get(key);
    if (!element) {
      element = document.createElement("img");
      element.className = "alien-trace-token alien-trace-token-aomomo alien-trace-token-positioned alien-aomomo-panel-marker";
      element.draggable = false;
      tokenElements.set(key, element);
      layer.appendChild(element);
    } else if (element.parentElement !== layer) {
      layer.appendChild(element);
    }

    const layout = kind === "orbit"
      ? getEffectiveAomomoOrbitMarkerLayout(alienSlotId, position)
      : getEffectiveAomomoLandingMarkerLayout(alienSlotId, position);
    if (!layout || dragState?.element === element) return;

    applyTraceTokenStyle(element, layout, placement.AOMOMO_PANEL_MARKER_DISPLAY_SCALE || 1);
    element.src = kind === "orbit"
      ? resolvePlayerOrbitAsset(marker.playerColor, options)
      : resolvePlayerLandingAsset(marker.playerColor, options);
    element.alt = kind === "orbit" ? "奥陌陌环绕标记" : "奥陌陌登陆标记";
    element.dataset.alienSlot = String(alienSlotId);
    element.dataset.traceKind = kind === "orbit" ? TRACE_KIND_AOMOMO_ORBIT : TRACE_KIND_AOMOMO_LANDING;
    element.dataset.traceType = "";
    if (kind === "orbit") {
      element.dataset.aomomoOrbitPosition = String(position);
      delete element.dataset.aomomoLandingPosition;
    } else {
      element.dataset.aomomoLandingPosition = String(position);
      delete element.dataset.aomomoOrbitPosition;
    }
    element.title = `${placement.getAlienSlotLabel(alienSlotId)} ${element.alt}`
      + ` ${options.getPlayerLabel?.(marker.playerColor) || marker.playerColor || "未知"}`
      + ` @(${layout.percentX}%,${layout.percentY}%)`;
  }

  function mountAomomoTraceToken(alienSlotId, traceType, position, entry, stackIndex, layer, options, activeKeys) {
    const key = getAomomoTraceTokenKey(alienSlotId, traceType, position, stackIndex);
    activeKeys.add(key);
    let element = tokenElements.get(key);
    if (!element) {
      element = document.createElement("img");
      element.className = "alien-trace-token alien-trace-token-aomomo alien-trace-token-positioned";
      element.draggable = false;
      tokenElements.set(key, element);
      layer.appendChild(element);
    } else if (element.parentElement !== layer) {
      layer.appendChild(element);
    }

    const layout = getEffectiveAomomoTraceMarkerLayout(alienSlotId, traceType, position, stackIndex);
    if (!layout || dragState?.element === element) return;

    applyTraceTokenStyle(element, layout, placement.AOMOMO_TRACE_TOKEN_DISPLAY_SCALE || 1);
    element.src = resolvePlayerTokenAsset(entry.playerColor, options);
    element.alt = `${aomomo?.formatTraceLabel?.(traceType, position, stackIndex) || traceType}`;
    element.dataset.alienSlot = String(alienSlotId);
    element.dataset.traceType = traceType;
    element.dataset.traceKind = TRACE_KIND_AOMOMO;
    element.dataset.aomomoPosition = String(position);
    element.dataset.aomomoStackIndex = String(stackIndex);
    element.classList.remove("is-placeable");
    delete element.dataset.aomomoTraceSlot;
    element.title = `${placement.getAlienSlotLabel(alienSlotId)} ${aomomo?.formatTraceLabel?.(traceType, position, stackIndex) || traceType}`
      + ` ${options.getPlayerLabel?.(entry.playerColor) || entry.playerColor || "未知"}`
      + ` @(${layout.percentX}%,${layout.percentY}%)`;
  }

  function mountAomomoTraceSlot(alienSlotId, traceType, position, layer, alienState, options, activeKeys) {
    const grid = aomomo?.getTraceGrid?.(alienState, alienSlotId);
    const entries = aomomo?.getTraceEntries?.(grid, traceType, position) || [];
    const slotKey = getAomomoSlotElementKey(alienSlotId, traceType, position);
    const visible = Boolean(entries.length)
      || Boolean(aomomo?.isAomomoRevealedSlot?.(alienState, alienSlotId));
    if (!visible) {
      const existingSlot = aomomoSlotElements.get(slotKey);
      if (existingSlot) {
        existingSlot.remove();
        aomomoSlotElements.delete(slotKey);
      }
      return;
    }

    entries.forEach((entry, stackIndex) => {
      mountAomomoTraceToken(alienSlotId, traceType, position, entry, stackIndex, layer, options, activeKeys);
    });

    const canPlace = options.canPlaceAomomoTrace?.(alienSlotId, traceType, position) !== false;
    const shouldShowSlot = Number(position) === 1 || !entries.length;
    if (!shouldShowSlot) {
      const existingSlot = aomomoSlotElements.get(slotKey);
      if (existingSlot) {
        existingSlot.remove();
        aomomoSlotElements.delete(slotKey);
      }
      return;
    }

    activeKeys.add(slotKey);
    let slot = aomomoSlotElements.get(slotKey);
    if (!slot) {
      slot = document.createElement("button");
      slot.type = "button";
      slot.className = "alien-banrenma-slot alien-aomomo-slot alien-trace-token-positioned";
      aomomoSlotElements.set(slotKey, slot);
      layer.appendChild(slot);
    }

    const layout = getEffectiveAomomoTraceMarkerLayout(alienSlotId, traceType, position, 0);
    if (!layout) return;
    applyAomomoTraceSlotStyle(slot, layout, position);
    slot.dataset.alienSlot = String(alienSlotId);
    slot.dataset.traceType = traceType;
    slot.dataset.aomomoPosition = String(position);
    slot.dataset.aomomoTraceSlot = "true";
    slot.classList.toggle("is-placeable", canPlace);
    slot.classList.toggle("is-stack-hotzone", Number(position) === 1 && entries.length > 0);
    slot.title = `${aomomo?.formatTraceLabel?.(traceType, position) || traceType} @(${layout.percentX}%,${layout.percentY}%)`;
    slot.setAttribute("aria-label", `${placement.getAlienSlotLabel(alienSlotId)} ${slot.title}`);
  }

  function renderAomomoTraceMarkers(alienSlotId, layer, alienState, options = {}) {
    if (!layer || !aomomo) return;
    const activeKeys = new Set();
    const slot = state.getAlienSlot(alienState, alienSlotId);
    if (slot?.revealed && slot.alienId === aomomo.ALIEN_ID) {
      const orbitMarkers = aomomo.listOrbitMarkers?.(alienState) || [];
      orbitMarkers.forEach((marker, index) => {
        mountAomomoPanelMarker(alienSlotId, marker, "orbit", index + 1, layer, options, activeKeys);
      });
      const landingMarkers = aomomo.listLandingMarkers?.(alienState) || [];
      landingMarkers.forEach((marker, index) => {
        mountAomomoPanelMarker(alienSlotId, marker, "landing", index + 1, layer, options, activeKeys);
      });
      for (const traceType of aomomo.TRACE_TYPES) {
        for (const position of aomomo.TRACE_POSITIONS) {
          mountAomomoTraceSlot(alienSlotId, traceType, position, layer, alienState, options, activeKeys);
        }
      }
    }

    for (const [key, element] of tokenElements.entries()) {
      const kind = key.split(":")[0];
      if (kind !== TRACE_KIND_AOMOMO && kind !== TRACE_KIND_AOMOMO_ORBIT && kind !== TRACE_KIND_AOMOMO_LANDING) continue;
      const parts = key.split(":");
      const slotId = Number(parts[1]);
      if (slotId !== alienSlotId || activeKeys.has(key)) continue;
      element.remove();
      tokenElements.delete(key);
    }
    for (const [key, element] of aomomoSlotElements.entries()) {
      const parts = key.split(":");
      const slotId = Number(parts[1]);
      if (slotId !== alienSlotId || activeKeys.has(key)) continue;
      element.remove();
      aomomoSlotElements.delete(key);
    }
  }

  function renderAllAomomoTraceMarkers(getLayerForSlot, alienState, options = {}) {
    if (!aomomo) return;
    for (const alienSlotId of placement.ALIEN_SLOT_IDS) {
      const layer = getLayerForSlot(alienSlotId);
      if (layer) renderAomomoTraceMarkers(alienSlotId, layer, alienState, options);
    }
  }

  function getRunezuSlotElementKey(alienSlotId, traceType, position) {
    return `runezu-slot:${alienSlotId}:${traceType}:${position}`;
  }

  function getRunezuTokenKey(alienSlotId, traceType, position, stackIndex = 0) {
    return getTokenElementKey(TRACE_KIND_RUNEZU, alienSlotId, traceType, `${position}-${stackIndex}`);
  }

  function getRunezuPanelSymbolKey(alienSlotId, slotId) {
    return `runezu-panel-symbol:${alienSlotId}:${slotId}`;
  }

  function getRunezuFaceSymbolKey(alienSlotId, position) {
    return `runezu-face-symbol:${alienSlotId}:${position}`;
  }

  function applyRunezuTraceSlotStyle(slot, layout, position, hasStackEntries) {
    if (Number(position) !== 1 || !hasStackEntries) {
      applyTraceTokenStyle(slot, layout, placement.RUNEZU_TRACE_TOKEN_DISPLAY_SCALE || 1);
      slot.classList.remove("is-stack-hotzone");
      slot.style.removeProperty("width");
      slot.style.removeProperty("height");
      slot.style.removeProperty("aspect-ratio");
      slot.style.removeProperty("border-radius");
      delete slot.dataset.hotzoneTopPercent;
      delete slot.dataset.hotzoneBottomPercent;
      return;
    }

    const tokenSize = placement.getRunezuTraceTokenSize?.(layout);
    if (!tokenSize) {
      applyTraceTokenStyle(slot, layout, placement.RUNEZU_TRACE_TOKEN_DISPLAY_SCALE || 1);
      return;
    }

    const stackStepY = placement.getRunezuStackStepY?.(layout) || tokenSize.radiusXPercent;
    const hotzoneHeight = tokenSize.heightPercent + stackStepY * 4;
    const hotzoneBottomY = layout.percentY + tokenSize.radiusYPercent;
    const hotzoneCenterY = hotzoneBottomY - hotzoneHeight / 2;

    slot.classList.add("is-stack-hotzone");
    slot.style.position = "absolute";
    slot.style.left = `${layout.percentX}%`;
    slot.style.top = `${roundPercent(hotzoneCenterY)}%`;
    slot.style.width = `${tokenSize.widthPercent}%`;
    slot.style.height = `${roundPercent(hotzoneHeight)}%`;
    slot.style.aspectRatio = "auto";
    slot.style.transform = "translate(-50%, -50%)";
    slot.style.transformOrigin = "center center";
    slot.dataset.tracePercentX = String(layout.percentX);
    slot.dataset.tracePercentY = String(layout.percentY);
    slot.dataset.hotzoneTopPercent = String(roundPercent(hotzoneBottomY - hotzoneHeight));
    slot.dataset.hotzoneBottomPercent = String(roundPercent(hotzoneBottomY));
  }

  function mountRunezuPanelSymbolMarker(alienSlotId, symbolEntry, layer, activeKeys) {
    const slotId = symbolEntry?.slotId;
    const symbolId = symbolEntry?.symbolId;
    if (!slotId || !symbolId) return;
    const key = getRunezuPanelSymbolKey(alienSlotId, slotId);
    activeKeys.add(key);

    let element = runezuPanelSymbolElements.get(key);
    if (!element) {
      element = document.createElement("img");
      element.className = "alien-trace-token alien-trace-token-positioned alien-runezu-symbol-marker";
      element.draggable = false;
      runezuPanelSymbolElements.set(key, element);
      layer.appendChild(element);
    }

    const layout = getEffectiveRunezuPanelSymbolMarkerLayout(alienSlotId, slotId);
    if (!layout || dragState?.element === element) return;
    applyTraceTokenStyle(element, layout, placement.RUNEZU_SYMBOL_DISPLAY_SCALE || 1);
    element.src = runezu.getSymbolSrc(symbolId);
    element.alt = `符文族 ${symbolId}`;
    element.dataset.alienSlot = String(alienSlotId);
    element.dataset.traceKind = TRACE_KIND_RUNEZU_PANEL_SYMBOL;
    element.dataset.runezuPanelSymbolSlot = slotId;
    element.dataset.runezuSymbolId = symbolId;
    element.title = `${placement.getAlienSlotLabel(alienSlotId)} 符文族 ${runezu.formatSymbolLabel?.(symbolId) || symbolId}`
      + ` @ ${runezu.formatPanelSymbolSlotLabel?.(slotId) || slotId} (${layout.percentX}%,${layout.percentY}%)`;
  }

  function mountRunezuPanelSymbols(alienSlotId, layer, alienState, activeKeys) {
    const slot = state.getAlienSlot(alienState, alienSlotId);
    if (!slot?.revealed || slot.alienId !== runezu?.ALIEN_ID) return;
    for (const symbol of runezu.listPanelSymbols?.(alienState) || []) {
      mountRunezuPanelSymbolMarker(alienSlotId, symbol, layer, activeKeys);
    }
  }

  function mountRunezuFaceSymbolMarker(alienSlotId, position, symbolEntry, layer, options, activeKeys) {
    const key = getRunezuFaceSymbolKey(alienSlotId, position);
    const hasSymbol = Boolean(symbolEntry?.symbolId);
    const canPlace = options.canPlaceRunezuFaceSymbol?.(alienSlotId, position) !== false;

    if (hasSymbol) {
      activeKeys.add(key);
      let element = runezuFaceSymbolElements.get(key);
      if (!element || element.tagName !== "IMG") {
        element?.remove();
        element = document.createElement("img");
        element.className = "alien-trace-token alien-trace-token-positioned alien-runezu-symbol-marker alien-runezu-face-symbol-marker";
        element.draggable = false;
        runezuFaceSymbolElements.set(key, element);
        layer.appendChild(element);
      }
      const layout = getEffectiveRunezuFaceSymbolSlotMarkerLayout(alienSlotId, position);
      if (!layout || dragState?.element === element) return;
      applyTraceTokenStyle(element, layout, placement.RUNEZU_SYMBOL_DISPLAY_SCALE || 1);
      element.src = runezu.getSymbolSrc(symbolEntry.symbolId);
      element.alt = `符文族 ${symbolEntry.symbolId}`;
      element.dataset.alienSlot = String(alienSlotId);
      element.dataset.traceKind = TRACE_KIND_RUNEZU_FACE_SYMBOL;
      element.dataset.runezuFaceSymbolPosition = String(position);
      element.dataset.runezuSymbolId = symbolEntry.symbolId;
      element.title = `${placement.getAlienSlotLabel(alienSlotId)} 符文族黑圈 ${position}`
        + ` ${runezu.formatSymbolLabel?.(symbolEntry.symbolId) || symbolEntry.symbolId}`
        + ` (${layout.percentX}%,${layout.percentY}%)`;
      return;
    }

    if (!runezu?.isRunezuRevealedSlot?.(options.alienState || null, alienSlotId)) {
      const existing = runezuFaceSymbolElements.get(key);
      if (existing) {
        existing.remove();
        runezuFaceSymbolElements.delete(key);
      }
      return;
    }

    activeKeys.add(key);
    let slot = runezuFaceSymbolElements.get(key);
    if (!slot || slot.tagName !== "BUTTON") {
      slot?.remove();
      slot = document.createElement("button");
      slot.type = "button";
      slot.className = "alien-runezu-face-symbol-slot alien-trace-token-positioned";
      runezuFaceSymbolElements.set(key, slot);
      layer.appendChild(slot);
    }
    const layout = getEffectiveRunezuFaceSymbolSlotMarkerLayout(alienSlotId, position);
    if (!layout) return;
    applyTraceTokenStyle(slot, layout, placement.RUNEZU_SYMBOL_DISPLAY_SCALE || 1);
    slot.dataset.alienSlot = String(alienSlotId);
    slot.dataset.runezuFaceSymbolPosition = String(position);
    slot.dataset.runezuFaceSymbolSlot = "true";
    slot.classList.toggle("is-placeable", canPlace);
    slot.title = `${runezu.formatFaceSymbolSlotLabel?.(position) || `黑圈${position}`} @(${layout.percentX}%,${layout.percentY}%)`;
    slot.setAttribute("aria-label", `${placement.getAlienSlotLabel(alienSlotId)} ${slot.title}`);
  }

  function mountRunezuFaceSymbols(alienSlotId, layer, alienState, options, activeKeys) {
    const slot = state.getAlienSlot(alienState, alienSlotId);
    if (!slot?.revealed || slot.alienId !== runezu?.ALIEN_ID) return;
    const placedByPosition = new Map((runezu.listFaceSymbolSlots?.(alienState) || [])
      .map((entry) => [Number(entry.position), entry]));
    for (const position of runezu.FACE_SYMBOL_POSITIONS || []) {
      const symbolEntry = placedByPosition.get(Number(position));
      mountRunezuFaceSymbolMarker(alienSlotId, position, symbolEntry, layer, {
        ...options,
        alienState,
      }, activeKeys);
    }
  }

  function mountRunezuTraceToken(alienSlotId, traceType, position, entry, stackIndex, layer, options, activeKeys) {
    const key = getRunezuTokenKey(alienSlotId, traceType, position, stackIndex);
    activeKeys.add(key);

    let element = tokenElements.get(key);
    if (!element) {
      element = document.createElement("img");
      element.className = "alien-trace-token alien-trace-token-positioned alien-trace-token-runezu";
      element.draggable = false;
      tokenElements.set(key, element);
      layer.appendChild(element);
    }

    const layout = getEffectiveRunezuTraceMarkerLayout(alienSlotId, traceType, position, stackIndex);
    if (!layout || dragState?.element === element) return;

    applyTraceTokenStyle(element, layout, placement.RUNEZU_TRACE_TOKEN_DISPLAY_SCALE || 1);
    element.src = resolvePlayerTokenAsset(entry.playerColor, options);
    element.alt = `${runezu?.formatTraceLabel?.(traceType, position) || traceType}`;
    element.dataset.alienSlot = String(alienSlotId);
    element.dataset.traceType = traceType;
    element.dataset.traceKind = TRACE_KIND_RUNEZU;
    element.dataset.runezuPosition = String(position);
    element.dataset.runezuStackIndex = String(stackIndex);
    element.classList.remove("is-placeable");
    delete element.dataset.runezuTraceSlot;
    delete element.dataset.amibaPosition;
    delete element.dataset.amibaSymbolSlot;
    delete element.dataset.chongPosition;
    element.title = `${placement.getAlienSlotLabel(alienSlotId)} ${runezu?.formatTraceLabel?.(traceType, position) || traceType}`
      + ` ${options.getPlayerLabel?.(entry.playerColor) || entry.playerColor || "未知"}`
      + ` @(${layout.percentX}%,${layout.percentY}%)`;
  }

  function mountRunezuTraceSlot(alienSlotId, traceType, position, layer, alienState, options, activeKeys) {
    const grid = runezu?.getTraceGrid?.(alienState, alienSlotId);
    const entries = runezu?.getTraceEntries?.(grid, traceType, position) || [];
    const slotKey = getRunezuSlotElementKey(alienSlotId, traceType, position);
    const visible = Boolean(entries.length)
      || Boolean(runezu?.isRunezuRevealedSlot?.(alienState, alienSlotId));
    if (!visible) {
      const existingSlot = runezuSlotElements.get(slotKey);
      if (existingSlot) {
        existingSlot.remove();
        runezuSlotElements.delete(slotKey);
      }
      return;
    }

    entries.forEach((entry, stackIndex) => {
      mountRunezuTraceToken(alienSlotId, traceType, position, entry, stackIndex, layer, options, activeKeys);
    });

    const canPlace = options.canPlaceRunezuTrace?.(alienSlotId, traceType, position) !== false;
    const shouldShowSlot = Number(position) === 1 || !entries.length;
    if (!shouldShowSlot) {
      const existingSlot = runezuSlotElements.get(slotKey);
      if (existingSlot) {
        existingSlot.remove();
        runezuSlotElements.delete(slotKey);
      }
      return;
    }

    activeKeys.add(slotKey);
    let slot = runezuSlotElements.get(slotKey);
    if (!slot) {
      slot = document.createElement("button");
      slot.type = "button";
      slot.className = "alien-runezu-slot alien-trace-token-positioned";
      runezuSlotElements.set(slotKey, slot);
      layer.appendChild(slot);
    }

    const layout = getEffectiveRunezuTraceMarkerLayout(alienSlotId, traceType, position, 0);
    if (!layout) return;
    applyRunezuTraceSlotStyle(slot, layout, position, entries.length > 0);
    slot.dataset.alienSlot = String(alienSlotId);
    slot.dataset.traceType = traceType;
    slot.dataset.runezuPosition = String(position);
    slot.dataset.runezuTraceSlot = "true";
    slot.classList.toggle("is-placeable", canPlace);
    slot.title = `${runezu?.formatTraceLabel?.(traceType, position) || traceType} @(${layout.percentX}%,${layout.percentY}%)`;
    slot.setAttribute("aria-label", `${placement.getAlienSlotLabel(alienSlotId)} ${slot.title}`);
  }

  function renderRunezuTraceMarkers(alienSlotId, layer, alienState, options = {}) {
    if (!layer || !runezu) return;
    const activeKeys = new Set();

    mountRunezuPanelSymbols(alienSlotId, layer, alienState, activeKeys);
    mountRunezuFaceSymbols(alienSlotId, layer, alienState, options, activeKeys);

    for (const traceType of runezu.TRACE_TYPES) {
      for (const position of runezu.TRACE_POSITIONS) {
        mountRunezuTraceSlot(alienSlotId, traceType, position, layer, alienState, options, activeKeys);
      }
    }

    for (const [key, element] of tokenElements.entries()) {
      const parts = key.split(":");
      if (parts[0] !== TRACE_KIND_RUNEZU) continue;
      const slotId = Number(parts[1]);
      if (slotId !== alienSlotId || activeKeys.has(key)) continue;
      element.remove();
      tokenElements.delete(key);
    }
    for (const [key, element] of runezuSlotElements.entries()) {
      const parts = key.split(":");
      const slotId = Number(parts[1]);
      if (slotId !== alienSlotId || activeKeys.has(key)) continue;
      element.remove();
      runezuSlotElements.delete(key);
    }
    for (const [key, element] of runezuPanelSymbolElements.entries()) {
      const parts = key.split(":");
      const slotId = Number(parts[1]);
      if (slotId !== alienSlotId || activeKeys.has(key)) continue;
      element.remove();
      runezuPanelSymbolElements.delete(key);
    }
    for (const [key, element] of runezuFaceSymbolElements.entries()) {
      const parts = key.split(":");
      const slotId = Number(parts[1]);
      if (slotId !== alienSlotId || activeKeys.has(key)) continue;
      element.remove();
      runezuFaceSymbolElements.delete(key);
    }
  }

  function renderAllRunezuTraceMarkers(getLayerForSlot, alienState, options = {}) {
    if (!runezu) return;
    for (const alienSlotId of placement.ALIEN_SLOT_IDS) {
      const layer = getLayerForSlot(alienSlotId);
      if (layer) renderRunezuTraceMarkers(alienSlotId, layer, alienState, options);
    }
  }

  function renderAlienBackImage(alienSlotId, backElement, alienState) {
    if (!backElement) return;

    const alienSlot = state.getAlienSlot(alienState, alienSlotId);
    const slotLabel = placement.getAlienSlotLabel(alienSlotId);

    if (alienSlot?.revealed && alienSlot.alienId) {
      const faceSrc = catalog.getAlienFaceSrc(alienSlot.alienId);
      const alienLabel = catalog.getAlienLabel(alienSlot.alienId);
      backElement.src = faceSrc;
      backElement.alt = `${slotLabel} ${alienLabel}`;
      backElement.classList.add("is-revealed");
      return;
    }

    backElement.src = catalog.ALIEN_BACK_SRC;
    backElement.alt = `${slotLabel} 牌背`;
    backElement.classList.remove("is-revealed");
  }

  function renderAllAlienBackImages(getBackImageForSlot, alienState) {
    for (const alienSlotId of placement.ALIEN_SLOT_IDS) {
      const backElement = getBackImageForSlot(alienSlotId);
      if (backElement) {
        renderAlienBackImage(alienSlotId, backElement, alienState);
      }
    }
  }

  function listTraceMarkerLayoutOverrides() {
    return [...firstLayoutOverrides.entries()]
      .map(([key, position]) => {
        const [, alienSlotId, traceType] = key.split(":");
        return {
          traceKind: TRACE_KIND_FIRST,
          alienSlotId: Number(alienSlotId),
          traceType,
          percentX: position.percentX,
          percentY: position.percentY,
        };
      })
      .sort((a, b) => {
        if (a.alienSlotId !== b.alienSlotId) return a.alienSlotId - b.alienSlotId;
        return placement.TRACE_TYPES.indexOf(a.traceType) - placement.TRACE_TYPES.indexOf(b.traceType);
      });
  }

  function listExtraTraceMarkerLayoutOverrides() {
    return [...extraLayoutOverrides.entries()]
      .map(([key, position]) => {
        const [, alienSlotId, traceType] = key.split(":");
        return {
          traceKind: TRACE_KIND_EXTRA,
          alienSlotId: Number(alienSlotId),
          traceType,
          percentX: position.percentX,
          percentY: position.percentY,
        };
      })
      .sort((a, b) => {
        if (a.alienSlotId !== b.alienSlotId) return a.alienSlotId - b.alienSlotId;
        return placement.TRACE_TYPES.indexOf(a.traceType) - placement.TRACE_TYPES.indexOf(b.traceType);
      });
  }

  function listJiuzheTraceMarkerLayoutOverrides() {
    return [...jiuzheLayoutOverrides.entries()]
      .map(([key, position]) => {
        const [, alienSlotId, traceType, tracePosition] = key.split(":");
        return {
          traceKind: TRACE_KIND_JIUZHE,
          alienSlotId: Number(alienSlotId),
          traceType,
          position: Number(tracePosition),
          percentX: position.percentX,
          percentY: position.percentY,
        };
      })
      .sort((a, b) => {
        if (a.alienSlotId !== b.alienSlotId) return a.alienSlotId - b.alienSlotId;
        const typeDiff = (jiuzhe?.TRACE_TYPES || placement.TRACE_TYPES).indexOf(a.traceType)
          - (jiuzhe?.TRACE_TYPES || placement.TRACE_TYPES).indexOf(b.traceType);
        if (typeDiff !== 0) return typeDiff;
        return a.position - b.position;
      });
  }

  function listYichangdianTraceMarkerLayoutOverrides() {
    return [...yichangdianLayoutOverrides.entries()]
      .map(([key, position]) => {
        const [, alienSlotId, traceType, tracePosition] = key.split(":");
        return {
          traceKind: TRACE_KIND_YICHANGDIAN,
          alienSlotId: Number(alienSlotId),
          traceType,
          position: Number(tracePosition),
          percentX: position.percentX,
          percentY: position.percentY,
        };
      })
      .sort((a, b) => {
        if (a.alienSlotId !== b.alienSlotId) return a.alienSlotId - b.alienSlotId;
        const typeDiff = (yichangdian?.TRACE_TYPES || placement.TRACE_TYPES).indexOf(a.traceType)
          - (yichangdian?.TRACE_TYPES || placement.TRACE_TYPES).indexOf(b.traceType);
        if (typeDiff !== 0) return typeDiff;
        return a.position - b.position;
      });
  }

  function listFangzhouTraceMarkerLayoutOverrides() {
    return [...fangzhouLayoutOverrides.entries()]
      .map(([key, position]) => {
        const [, alienSlotId, traceType, tracePosition] = key.split(":");
        return {
          traceKind: TRACE_KIND_FANGZHOU,
          alienSlotId: Number(alienSlotId),
          traceType,
          position: Number(tracePosition),
          percentX: position.percentX,
          percentY: position.percentY,
        };
      })
      .sort((a, b) => {
        if (a.alienSlotId !== b.alienSlotId) return a.alienSlotId - b.alienSlotId;
        const typeDiff = (fangzhou?.TRACE_TYPES || placement.TRACE_TYPES).indexOf(a.traceType)
          - (fangzhou?.TRACE_TYPES || placement.TRACE_TYPES).indexOf(b.traceType);
        if (typeDiff !== 0) return typeDiff;
        return a.position - b.position;
      });
  }

  function listBanrenmaTraceMarkerLayoutOverrides() {
    return [...banrenmaLayoutOverrides.entries()]
      .map(([key, position]) => {
        const [, alienSlotId, traceType, tracePosition] = key.split(":");
        return {
          traceKind: TRACE_KIND_BANRENMA,
          alienSlotId: Number(alienSlotId),
          traceType,
          position: Number(tracePosition),
          percentX: position.percentX,
          percentY: position.percentY,
        };
      })
      .sort((a, b) => {
        if (a.alienSlotId !== b.alienSlotId) return a.alienSlotId - b.alienSlotId;
        const typeDiff = (banrenma?.TRACE_TYPES || placement.TRACE_TYPES).indexOf(a.traceType)
          - (banrenma?.TRACE_TYPES || placement.TRACE_TYPES).indexOf(b.traceType);
        if (typeDiff !== 0) return typeDiff;
        return a.position - b.position;
      });
  }

  function listChongTraceMarkerLayoutOverrides() {
    return [...chongLayoutOverrides.entries()]
      .map(([key, position]) => {
        const [, alienSlotId, traceType, tracePosition] = key.split(":");
        return {
          traceKind: TRACE_KIND_CHONG,
          alienSlotId: Number(alienSlotId),
          traceType,
          position: Number(tracePosition),
          percentX: position.percentX,
          percentY: position.percentY,
        };
      })
      .sort((a, b) => {
        if (a.alienSlotId !== b.alienSlotId) return a.alienSlotId - b.alienSlotId;
        const typeDiff = (chong?.TRACE_TYPES || placement.TRACE_TYPES).indexOf(a.traceType)
          - (chong?.TRACE_TYPES || placement.TRACE_TYPES).indexOf(b.traceType);
        if (typeDiff !== 0) return typeDiff;
        return a.position - b.position;
      });
  }

  function listAmibaTraceMarkerLayoutOverrides() {
    return [...amibaLayoutOverrides.entries()]
      .map(([key, position]) => {
        const [, alienSlotId, traceType, tracePosition] = key.split(":");
        return {
          traceKind: TRACE_KIND_AMIBA,
          alienSlotId: Number(alienSlotId),
          traceType,
          position: Number(tracePosition),
          percentX: position.percentX,
          percentY: position.percentY,
        };
      })
      .sort((a, b) => {
        if (a.alienSlotId !== b.alienSlotId) return a.alienSlotId - b.alienSlotId;
        const typeDiff = (amiba?.TRACE_TYPES || placement.TRACE_TYPES).indexOf(a.traceType)
          - (amiba?.TRACE_TYPES || placement.TRACE_TYPES).indexOf(b.traceType);
        if (typeDiff !== 0) return typeDiff;
        return a.position - b.position;
      });
  }

  function listAmibaSymbolMarkerLayoutOverrides() {
    return [...amibaSymbolLayoutOverrides.entries()]
      .map(([key, position]) => {
        const [, alienSlotId, slotId] = key.split(":");
        return {
          traceKind: TRACE_KIND_AMIBA_SYMBOL,
          alienSlotId: Number(alienSlotId),
          slotId,
          percentX: position.percentX,
          percentY: position.percentY,
        };
      })
      .sort((a, b) => {
        if (a.alienSlotId !== b.alienSlotId) return a.alienSlotId - b.alienSlotId;
        return String(a.slotId).localeCompare(String(b.slotId));
      });
  }

  function listAomomoTraceMarkerLayoutOverrides() {
    return [...aomomoLayoutOverrides.entries()]
      .map(([key, position]) => {
        const [, alienSlotId, traceType, tracePosition] = key.split(":");
        return {
          traceKind: TRACE_KIND_AOMOMO,
          alienSlotId: Number(alienSlotId),
          traceType,
          position: Number(tracePosition),
          percentX: position.percentX,
          percentY: position.percentY,
        };
      })
      .sort((a, b) => {
        if (a.alienSlotId !== b.alienSlotId) return a.alienSlotId - b.alienSlotId;
        const typeDiff = (aomomo?.TRACE_TYPES || placement.TRACE_TYPES).indexOf(a.traceType)
          - (aomomo?.TRACE_TYPES || placement.TRACE_TYPES).indexOf(b.traceType);
        if (typeDiff !== 0) return typeDiff;
        return a.position - b.position;
      });
  }

  function listAomomoOrbitMarkerLayoutOverrides() {
    return [...aomomoOrbitLayoutOverrides.entries()]
      .map(([key, position]) => {
        const [, alienSlotId, markerPosition] = key.split(":");
        return {
          traceKind: TRACE_KIND_AOMOMO_ORBIT,
          alienSlotId: Number(alienSlotId),
          position: Number(markerPosition),
          percentX: position.percentX,
          percentY: position.percentY,
        };
      })
      .sort((a, b) => a.alienSlotId - b.alienSlotId || a.position - b.position);
  }

  function listAomomoLandingMarkerLayoutOverrides() {
    return [...aomomoLandingLayoutOverrides.entries()]
      .map(([key, position]) => {
        const [, alienSlotId, markerPosition] = key.split(":");
        return {
          traceKind: TRACE_KIND_AOMOMO_LANDING,
          alienSlotId: Number(alienSlotId),
          position: Number(markerPosition),
          percentX: position.percentX,
          percentY: position.percentY,
        };
      })
      .sort((a, b) => a.alienSlotId - b.alienSlotId || a.position - b.position);
  }

  function listRunezuTraceMarkerLayoutOverrides() {
    return [...runezuLayoutOverrides.entries()]
      .map(([key, position]) => {
        const [, alienSlotId, traceType, tracePosition] = key.split(":");
        return {
          traceKind: TRACE_KIND_RUNEZU,
          alienSlotId: Number(alienSlotId),
          traceType,
          position: Number(tracePosition),
          percentX: position.percentX,
          percentY: position.percentY,
        };
      })
      .sort((a, b) => {
        if (a.alienSlotId !== b.alienSlotId) return a.alienSlotId - b.alienSlotId;
        const typeDiff = (runezu?.TRACE_TYPES || placement.TRACE_TYPES).indexOf(a.traceType)
          - (runezu?.TRACE_TYPES || placement.TRACE_TYPES).indexOf(b.traceType);
        if (typeDiff !== 0) return typeDiff;
        return a.position - b.position;
      });
  }

  function listRunezuPanelSymbolMarkerLayoutOverrides() {
    return [...runezuPanelSymbolLayoutOverrides.entries()]
      .map(([key, position]) => {
        const [, alienSlotId, slotId] = key.split(":");
        return {
          traceKind: TRACE_KIND_RUNEZU_PANEL_SYMBOL,
          alienSlotId: Number(alienSlotId),
          slotId,
          percentX: position.percentX,
          percentY: position.percentY,
        };
      })
      .sort((a, b) => {
        if (a.alienSlotId !== b.alienSlotId) return a.alienSlotId - b.alienSlotId;
        return String(a.slotId).localeCompare(String(b.slotId));
      });
  }

  function listRunezuFaceSymbolMarkerLayoutOverrides() {
    return [...runezuFaceSymbolLayoutOverrides.entries()]
      .map(([key, position]) => {
        const [, alienSlotId, facePosition] = key.split(":");
        return {
          traceKind: TRACE_KIND_RUNEZU_FACE_SYMBOL,
          alienSlotId: Number(alienSlotId),
          position: Number(facePosition),
          percentX: position.percentX,
          percentY: position.percentY,
        };
      })
      .sort((a, b) => {
        if (a.alienSlotId !== b.alienSlotId) return a.alienSlotId - b.alienSlotId;
        return a.position - b.position;
      });
  }

  function resetAlienTraceTokens() {
    for (const element of tokenElements.values()) {
      element.remove();
    }
    for (const element of stateTraceSlotElements.values()) {
      element.remove();
    }
    for (const element of jiuzheSlotElements.values()) {
      element.remove();
    }
    for (const element of yichangdianSlotElements.values()) {
      element.remove();
    }
    for (const element of fangzhouSlotElements.values()) {
      element.remove();
    }
    for (const element of banrenmaSlotElements.values()) {
      element.remove();
    }
    for (const element of chongSlotElements.values()) {
      element.remove();
    }
    for (const element of chongFossilElements.values()) {
      element.remove();
    }
    for (const element of amibaSlotElements.values()) {
      element.remove();
    }
    for (const element of amibaSymbolElements.values()) {
      element.remove();
    }
    for (const element of aomomoSlotElements.values()) {
      element.remove();
    }
    for (const element of runezuSlotElements.values()) {
      element.remove();
    }
    for (const element of runezuPanelSymbolElements.values()) {
      element.remove();
    }
    for (const element of runezuFaceSymbolElements.values()) {
      element.remove();
    }
    tokenElements.clear();
    stateTraceSlotElements.clear();
    jiuzheSlotElements.clear();
    yichangdianSlotElements.clear();
    fangzhouSlotElements.clear();
    banrenmaSlotElements.clear();
    chongSlotElements.clear();
    chongFossilElements.clear();
    amibaSlotElements.clear();
    amibaSymbolElements.clear();
    aomomoSlotElements.clear();
    runezuSlotElements.clear();
    runezuPanelSymbolElements.clear();
    runezuFaceSymbolElements.clear();
    firstLayoutOverrides.clear();
    extraLayoutOverrides.clear();
    jiuzheLayoutOverrides.clear();
    yichangdianLayoutOverrides.clear();
    fangzhouLayoutOverrides.clear();
    banrenmaLayoutOverrides.clear();
    chongLayoutOverrides.clear();
    amibaLayoutOverrides.clear();
    amibaSymbolLayoutOverrides.clear();
    aomomoLayoutOverrides.clear();
    aomomoOrbitLayoutOverrides.clear();
    aomomoLandingLayoutOverrides.clear();
    runezuLayoutOverrides.clear();
    runezuPanelSymbolLayoutOverrides.clear();
    runezuFaceSymbolLayoutOverrides.clear();
    dragState = null;
  }

  return Object.freeze({
    bindAlienTraceDragging,
    clientToAlienStatePercent,
    getEffectiveTraceMarkerLayout,
    getEffectiveExtraTraceAnchorLayout,
    getEffectiveExtraTraceGridLayout,
    getEffectiveJiuzheTraceMarkerLayout,
    getEffectiveYichangdianTraceMarkerLayout,
    getEffectiveFangzhouTraceMarkerLayout,
    getEffectiveBanrenmaTraceMarkerLayout,
    getEffectiveChongTraceMarkerLayout,
    getEffectiveAmibaTraceMarkerLayout,
    getEffectiveAmibaSymbolMarkerLayout,
    getEffectiveAomomoTraceMarkerLayout,
    getEffectiveAomomoOrbitMarkerLayout,
    getEffectiveAomomoLandingMarkerLayout,
    getEffectiveRunezuTraceMarkerLayout,
    getEffectiveRunezuPanelSymbolMarkerLayout,
    getEffectiveRunezuFaceSymbolSlotMarkerLayout,
    listTraceMarkerLayoutOverrides,
    listExtraTraceMarkerLayoutOverrides,
    listJiuzheTraceMarkerLayoutOverrides,
    listYichangdianTraceMarkerLayoutOverrides,
    listFangzhouTraceMarkerLayoutOverrides,
    listBanrenmaTraceMarkerLayoutOverrides,
    listChongTraceMarkerLayoutOverrides,
    listAmibaTraceMarkerLayoutOverrides,
    listAmibaSymbolMarkerLayoutOverrides,
    listAomomoTraceMarkerLayoutOverrides,
    listAomomoOrbitMarkerLayoutOverrides,
    listAomomoLandingMarkerLayoutOverrides,
    listRunezuTraceMarkerLayoutOverrides,
    listRunezuPanelSymbolMarkerLayoutOverrides,
    listRunezuFaceSymbolMarkerLayoutOverrides,
    renderAlienTraceMarkers,
    renderAllAlienTraceMarkers,
    renderJiuzheTraceMarkers,
    renderAllJiuzheTraceMarkers,
    renderYichangdianTraceMarkers,
    renderAllYichangdianTraceMarkers,
    renderFangzhouTraceMarkers,
    renderAllFangzhouTraceMarkers,
    renderBanrenmaTraceMarkers,
    renderAllBanrenmaTraceMarkers,
    renderChongTraceMarkers,
    renderAllChongTraceMarkers,
    renderAmibaTraceMarkers,
    renderAllAmibaTraceMarkers,
    renderAomomoTraceMarkers,
    renderAllAomomoTraceMarkers,
    renderRunezuTraceMarkers,
    renderAllRunezuTraceMarkers,
    renderAlienBackImage,
    renderAllAlienBackImages,
    resetAlienTraceTokens,
  });
});
