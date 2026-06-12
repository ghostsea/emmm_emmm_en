(function (root, factory) {
  "use strict";

  let placement = root.SetiAlienPlacement;

  if (typeof require === "function") {
    placement = placement || require("./placement");
  }

  const api = factory(placement);

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.SetiAlienState = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function (placement) {
  "use strict";

  function createDefaultTraceSlot() {
    return {
      firstPlaced: false,
      ownerPlayerColor: null,
      extraCount: 0,
    };
  }

  function createDefaultAlienSlotState() {
    return {
      revealed: false,
      alienId: null,
      traces: {
        yellow: createDefaultTraceSlot(),
        pink: createDefaultTraceSlot(),
        blue: createDefaultTraceSlot(),
      },
    };
  }

  function createDefaultAlienState() {
    return {
      aliens: {
        1: createDefaultAlienSlotState(),
        2: createDefaultAlienSlotState(),
      },
    };
  }

  function getAlienSlot(alienState, alienSlotId) {
    return alienState?.aliens?.[alienSlotId] || null;
  }

  function countPlacedFirstTraces(alienSlot) {
    if (!alienSlot?.traces) return 0;
    return placement.TRACE_TYPES.filter((traceType) => alienSlot.traces[traceType]?.firstPlaced).length;
  }

  function isAlienReadyToReveal(alienSlot) {
    if (!alienSlot || alienSlot.revealed) return false;
    return countPlacedFirstTraces(alienSlot) >= placement.TRACE_TYPES.length;
  }

  function addExtraTrace(alienState, alienSlotId, traceType) {
    const alienSlot = getAlienSlot(alienState, alienSlotId);
    if (!alienSlot) {
      return { ok: false, message: `未知外星人槽位 ${alienSlotId}` };
    }
    if (alienSlot.revealed) {
      return { ok: false, message: `${placement.getAlienSlotLabel(alienSlotId)} 已揭示` };
    }
    if (!placement.TRACE_TYPES.includes(traceType)) {
      return { ok: false, message: `未知痕迹类型 ${traceType}` };
    }

    const traceSlot = alienSlot.traces[traceType];
    if (!traceSlot.firstPlaced) {
      return {
        ok: false,
        message: `${placement.getAlienSlotLabel(alienSlotId)} ${placement.getTraceTypeLabel(traceType)} 尚未放置首标记`,
      };
    }

    traceSlot.extraCount += 1;
    return {
      ok: true,
      message: `${placement.getAlienSlotLabel(alienSlotId)} ${placement.getTraceTypeLabel(traceType)} 额外 +1（共 ${traceSlot.extraCount}）`,
      extraOnly: true,
    };
  }

  function placeFirstTrace(alienState, alienSlotId, traceType, playerColor) {
    const alienSlot = getAlienSlot(alienState, alienSlotId);
    if (!alienSlot) {
      return { ok: false, message: `未知外星人槽位 ${alienSlotId}` };
    }
    if (alienSlot.revealed) {
      return { ok: false, message: `${placement.getAlienSlotLabel(alienSlotId)} 已揭示` };
    }
    if (!placement.TRACE_TYPES.includes(traceType)) {
      return { ok: false, message: `未知痕迹类型 ${traceType}` };
    }

    const traceSlot = alienSlot.traces[traceType];
    if (traceSlot.firstPlaced) {
      traceSlot.extraCount += 1;
      return {
        ok: true,
        message: `${placement.getAlienSlotLabel(alienSlotId)} ${placement.getTraceTypeLabel(traceType)} 额外 +1（共 ${traceSlot.extraCount}）`,
        extraOnly: true,
      };
    }

    traceSlot.firstPlaced = true;
    traceSlot.ownerPlayerColor = playerColor || null;

    const ready = isAlienReadyToReveal(alienSlot);
    return {
      ok: true,
      message: `${placement.getAlienSlotLabel(alienSlotId)} 放置${placement.getTraceTypeLabel(traceType)}`
        + `${ready ? "，三种首标记已满，可揭示" : ""}`,
      extraOnly: false,
      readyToReveal: ready,
    };
  }

  function revealAlien(alienState, alienSlotId, alienId) {
    const alienSlot = getAlienSlot(alienState, alienSlotId);
    if (!alienSlot) {
      return { ok: false, message: `未知外星人槽位 ${alienSlotId}` };
    }
    if (alienSlot.revealed) {
      return { ok: false, message: `${placement.getAlienSlotLabel(alienSlotId)} 已揭示` };
    }
    if (!isAlienReadyToReveal(alienSlot)) {
      return { ok: false, message: `${placement.getAlienSlotLabel(alienSlotId)} 尚未集齐三种首标记` };
    }

    alienSlot.revealed = true;
    alienSlot.alienId = alienId || null;

    return {
      ok: true,
      message: `${placement.getAlienSlotLabel(alienSlotId)} 已揭示${alienId ? `（${alienId}）` : ""}`,
    };
  }

  function formatAlienSlotLine(alienSlotId, alienSlot) {
    if (!alienSlot) return `${placement.getAlienSlotLabel(alienSlotId)} 无状态`;

    const status = alienSlot.revealed
      ? `已揭示${alienSlot.alienId ? ` ${alienSlot.alienId}` : ""}`
      : `未揭示 首标记 ${countPlacedFirstTraces(alienSlot)}/3`;

    const traceParts = placement.TRACE_TYPES.map((traceType) => {
      const traceSlot = alienSlot.traces[traceType];
      if (!traceSlot.firstPlaced) return `${traceType}=无`;
      const owner = traceSlot.ownerPlayerColor || "?";
      const extra = traceSlot.extraCount > 0 ? `+${traceSlot.extraCount}` : "";
      return `${traceType}=${owner}${extra}`;
    });

    return `[${placement.getAlienSlotLabel(alienSlotId)}] ${status} ${traceParts.join(" ")}`;
  }

  return Object.freeze({
    createDefaultAlienState,
    createDefaultAlienSlotState,
    createDefaultTraceSlot,
    getAlienSlot,
    countPlacedFirstTraces,
    isAlienReadyToReveal,
    placeFirstTrace,
    addExtraTrace,
    revealAlien,
    formatAlienSlotLine,
  });
});
