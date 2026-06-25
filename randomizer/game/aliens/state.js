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

  const FIRST_TRACE_REWARDS_BY_ALIEN_SLOT_ID = Object.freeze({
    1: Object.freeze({ gain: Object.freeze({ score: 5, publicity: 1 }) }),
    2: Object.freeze({ gain: Object.freeze({ score: 3, publicity: 1 }) }),
  });

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
      assignedAlienId: null,
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

  function firstTraceBelongsToPlayer(traceSlot, player) {
    if (!traceSlot?.firstPlaced || !player) return false;
    const playerIds = new Set([player.id, player.playerId].filter(Boolean).map(String));
    const playerColors = new Set([player.color, player.playerColor].filter(Boolean).map(String));
    return (
      [traceSlot.ownerPlayerId, traceSlot.playerId].filter(Boolean).some((value) => playerIds.has(String(value)))
      || [traceSlot.ownerPlayerColor, traceSlot.playerColor].filter(Boolean).some((value) => playerColors.has(String(value)))
    );
  }

  function countFirstTracesForPlayerOnSlot(alienState, alienSlotId, player) {
    const alienSlot = getAlienSlot(alienState, alienSlotId);
    if (!alienSlot?.traces || !player) return 0;
    let count = 0;
    for (const traceType of placement.TRACE_TYPES) {
      if (firstTraceBelongsToPlayer(alienSlot.traces[traceType], player)) {
        count += 1;
      }
    }
    return count;
  }

  function countTraceMarkersForPlayerOnSlot(alienState, alienSlotId, player, traceType = null) {
    const alienSlot = getAlienSlot(alienState, alienSlotId);
    if (!alienSlot?.traces || !player) return 0;
    const traceTypes = traceType == null
      ? placement.TRACE_TYPES
      : (placement.TRACE_TYPES.includes(traceType) ? [traceType] : []);
    let count = 0;
    for (const type of traceTypes) {
      const traceSlot = alienSlot.traces[type];
      if (!firstTraceBelongsToPlayer(traceSlot, player)) continue;
      count += 1 + Math.max(0, Math.round(Number(traceSlot.extraCount) || 0));
    }
    return count;
  }

  function countFirstTracesByPlayerOnSlot(alienState, alienSlotId, players = []) {
    return (players || []).map((player) => ({
      player,
      playerId: player?.id || player?.playerId || null,
      playerColor: player?.color || player?.playerColor || null,
      count: countFirstTracesForPlayerOnSlot(alienState, alienSlotId, player),
    })).filter((entry) => entry.count > 0);
  }

  function getFirstTraceRewardForSlot(alienSlotId) {
    const reward = FIRST_TRACE_REWARDS_BY_ALIEN_SLOT_ID[Number(alienSlotId)] || null;
    if (!reward) return null;
    return {
      gain: { ...(reward.gain || {}) },
    };
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

    if (alienSlot.revealed) {
      return {
        ok: false,
        message: `${placement.getAlienSlotLabel(alienSlotId)} 已揭示，无法再放置首标记`,
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

    const resolvedAlienId = alienId || alienSlot.assignedAlienId || null;
    if (!resolvedAlienId) {
      return { ok: false, message: `${placement.getAlienSlotLabel(alienSlotId)} 尚未分配外星人类型` };
    }

    alienSlot.revealed = true;
    alienSlot.alienId = resolvedAlienId;

    return {
      ok: true,
      message: `${placement.getAlienSlotLabel(alienSlotId)} 已揭示（${resolvedAlienId}）`,
      alienId: resolvedAlienId,
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
    countFirstTracesForPlayerOnSlot,
    countTraceMarkersForPlayerOnSlot,
    countFirstTracesByPlayerOnSlot,
    getFirstTraceRewardForSlot,
    isAlienReadyToReveal,
    placeFirstTrace,
    addExtraTrace,
    revealAlien,
    formatAlienSlotLine,
  });
});
