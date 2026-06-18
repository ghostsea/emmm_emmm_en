(function (root, factory) {
  "use strict";

  const api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.SetiFinalScoring = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function () {
  "use strict";

  const FINAL_SCORE_THRESHOLDS = Object.freeze([25, 50, 70]);
  const DEFAULT_TILE_IDS = Object.freeze(["a", "b", "c", "d"]);
  let markSequence = 0;

  function normalizeTileId(tileId) {
    return String(tileId || "").trim().toLowerCase();
  }

  function createTileState(tileId) {
    return {
      id: normalizeTileId(tileId),
      marks: [],
    };
  }

  function normalizeTileVariant(variant) {
    const value = Math.round(Number(variant));
    return value === 2 ? 2 : 1;
  }

  function createDefaultTileVariants(tileIds = DEFAULT_TILE_IDS) {
    const variants = {};
    for (const tileId of tileIds) {
      const normalized = normalizeTileId(tileId);
      if (!normalized) continue;
      variants[normalized] = 1;
    }
    return variants;
  }

  function createFinalScoringState(tileIds = DEFAULT_TILE_IDS) {
    const state = {
      thresholds: [...FINAL_SCORE_THRESHOLDS],
      tiles: {},
      pendingMarks: [],
      tileVariants: createDefaultTileVariants(tileIds),
    };
    ensureFinalScoringState(state, tileIds);
    return state;
  }

  function ensureFinalScoringState(state, tileIds = DEFAULT_TILE_IDS) {
    if (!state.tiles || typeof state.tiles !== "object") state.tiles = {};
    if (!Array.isArray(state.pendingMarks)) state.pendingMarks = [];
    if (!Array.isArray(state.thresholds)) state.thresholds = [...FINAL_SCORE_THRESHOLDS];
    if (!state.tileVariants || typeof state.tileVariants !== "object") {
      state.tileVariants = createDefaultTileVariants(tileIds);
    }

    for (const tileId of tileIds) {
      const normalized = normalizeTileId(tileId);
      if (!normalized) continue;
      if (!state.tiles[normalized]) {
        state.tiles[normalized] = createTileState(normalized);
      } else if (!Array.isArray(state.tiles[normalized].marks)) {
        state.tiles[normalized].marks = [];
      }
      if (!state.tileVariants[normalized]) {
        state.tileVariants[normalized] = 1;
      } else {
        state.tileVariants[normalized] = normalizeTileVariant(state.tileVariants[normalized]);
      }
    }

    return state;
  }

  function setTileVariants(state, variants = {}, tileIds = DEFAULT_TILE_IDS) {
    ensureFinalScoringState(state, tileIds);
    for (const tileId of tileIds) {
      const normalized = normalizeTileId(tileId);
      if (!normalized) continue;
      if (variants[normalized] != null || variants[tileId] != null) {
        state.tileVariants[normalized] = normalizeTileVariant(
          variants[normalized] ?? variants[tileId],
        );
      }
    }
    return state.tileVariants;
  }

  function getTileVariant(state, tileId) {
    ensureFinalScoringState(state, [tileId]);
    return normalizeTileVariant(state.tileVariants?.[normalizeTileId(tileId)]);
  }

  function randomizeTileVariants(state, tileIds = DEFAULT_TILE_IDS, randomFn = Math.random) {
    const variants = {};
    for (const tileId of tileIds) {
      const normalized = normalizeTileId(tileId);
      if (!normalized) continue;
      variants[normalized] = randomFn() < 0.5 ? 1 : 2;
    }
    return setTileVariants(state, variants, tileIds);
  }

  function getPlayerId(player) {
    return player?.id || player?.color || null;
  }

  function getPlayerScore(player) {
    return Number(player?.resources?.score) || 0;
  }

  function getReachedThresholds(score, thresholds = FINAL_SCORE_THRESHOLDS) {
    const value = Number(score) || 0;
    return thresholds.filter((threshold) => value >= threshold);
  }

  function listMarks(state) {
    ensureFinalScoringState(state);
    return Object.values(state.tiles).flatMap((tile) => tile.marks || []);
  }

  function hasPlayerClaimedThreshold(state, playerId, threshold) {
    return listMarks(state).some((mark) => (
      mark.playerId === playerId && Number(mark.threshold) === Number(threshold)
    ));
  }

  function hasPendingThreshold(state, playerId, threshold) {
    return (state.pendingMarks || []).some((pending) => (
      pending.playerId === playerId && Number(pending.threshold) === Number(threshold)
    ));
  }

  function cleanupPendingMarks(state, playerList = []) {
    const playersById = new Map(playerList.map((player) => [getPlayerId(player), player]));
    state.pendingMarks = (state.pendingMarks || []).filter((pending) => {
      const player = playersById.get(pending.playerId);
      if (!player) return false;
      if (getPlayerScore(player) < Number(pending.threshold)) return false;
      return !hasPlayerClaimedThreshold(state, pending.playerId, pending.threshold);
    });
  }

  function syncPendingMarks(state, playerList = []) {
    ensureFinalScoringState(state);
    cleanupPendingMarks(state, playerList);

    const added = [];
    for (const player of playerList) {
      const playerId = getPlayerId(player);
      if (!playerId) continue;
      for (const threshold of getReachedThresholds(getPlayerScore(player), state.thresholds)) {
        if (hasPlayerClaimedThreshold(state, playerId, threshold)) continue;
        if (hasPendingThreshold(state, playerId, threshold)) continue;

        const pending = {
          id: `final-pending-${playerId}-${threshold}`,
          playerId,
          playerColor: player.color || null,
          playerLabel: player.colorLabel || player.name || playerId,
          threshold,
        };
        state.pendingMarks.push(pending);
        added.push(pending);
      }
    }

    state.pendingMarks.sort((a, b) => (
      Number(a.threshold) - Number(b.threshold)
        || String(a.playerId).localeCompare(String(b.playerId))
    ));

    return { ok: true, added, pendingMarks: [...state.pendingMarks] };
  }

  function getPendingMarksForPlayer(state, playerId) {
    ensureFinalScoringState(state);
    return (state.pendingMarks || [])
      .filter((pending) => pending.playerId === playerId)
      .sort((a, b) => Number(a.threshold) - Number(b.threshold));
  }

  function getNextPendingMarkForPlayer(state, playerId) {
    return getPendingMarksForPlayer(state, playerId)[0] || null;
  }

  function hasPlayerMarkedTile(state, tileId, playerId) {
    ensureFinalScoringState(state, [tileId]);
    const tile = state.tiles[normalizeTileId(tileId)];
    return Boolean(tile?.marks?.some((mark) => mark.playerId === playerId));
  }

  function getNextSlotIndex(tile) {
    const marks = tile?.marks || [];
    if (!marks.some((mark) => Number(mark.slotIndex) === 1)) return 1;
    if (!marks.some((mark) => Number(mark.slotIndex) === 2)) return 2;
    return 3;
  }

  function canMarkTile(state, tileId, player) {
    ensureFinalScoringState(state, [tileId]);
    const normalizedTileId = normalizeTileId(tileId);
    const playerId = getPlayerId(player);
    const tile = state.tiles[normalizedTileId];

    if (!tile) return { ok: false, message: "未找到终局计分板块" };
    if (!playerId) return { ok: false, message: "未找到玩家" };
    if (!getNextPendingMarkForPlayer(state, playerId)) {
      return { ok: false, message: "该玩家没有待标记的终局计分门槛" };
    }
    if (hasPlayerMarkedTile(state, normalizedTileId, playerId)) {
      return { ok: false, message: "该玩家已经标记过这个终局计分板块" };
    }

    return { ok: true, slotIndex: getNextSlotIndex(tile) };
  }

  function markTile(state, tileId, player, options = {}) {
    const normalizedTileId = normalizeTileId(tileId);
    ensureFinalScoringState(state, [normalizedTileId]);

    const check = canMarkTile(state, normalizedTileId, player);
    if (!check.ok) return check;

    const pending = getNextPendingMarkForPlayer(state, getPlayerId(player));
    const tile = state.tiles[normalizedTileId];
    const slotIndex = check.slotIndex;
    const slot3Order = slotIndex === 3
      ? tile.marks.filter((mark) => Number(mark.slotIndex) === 3).length + 1
      : null;

    markSequence += 1;
    const mark = {
      id: `final-mark-${markSequence}`,
      tileId: normalizedTileId,
      playerId: getPlayerId(player),
      playerColor: player.color || null,
      playerLabel: player.colorLabel || player.name || getPlayerId(player),
      tokenSrc: options.tokenSrc || options.playerTokenSrc || null,
      threshold: pending.threshold,
      slotIndex,
      slot3Order,
      placedAt: options.placedAt || new Date().toISOString(),
    };

    tile.marks.push(mark);
    state.pendingMarks = state.pendingMarks.filter((item) => item.id !== pending.id);

    return {
      ok: true,
      mark,
      tile,
      message: `${mark.playerLabel}玩家以 ${pending.threshold} 分门槛标记终局板块 ${normalizedTileId.toUpperCase()} 的第 ${slotIndex} 位`,
    };
  }

  function getReadoutLines(state) {
    ensureFinalScoringState(state);
    const lines = ["终局计分"];

    for (const tile of Object.values(state.tiles)) {
      const variant = getTileVariant(state, tile.id);
      const markText = (tile.marks || []).length
        ? tile.marks
          .map((mark) => `${mark.playerLabel || mark.playerColor || mark.playerId}@${mark.slotIndex}(${mark.threshold})`)
          .join("、")
        : "无";
      lines.push(`${tile.id.toUpperCase()}${variant}：${markText}`);
    }

    const pending = (state.pendingMarks || []).length
      ? state.pendingMarks
        .map((mark) => `${mark.playerLabel || mark.playerColor || mark.playerId}(${mark.threshold})`)
        .join("、")
      : "无";
    lines.push(`待标记：${pending}`);
    return lines;
  }

  return Object.freeze({
    FINAL_SCORE_THRESHOLDS,
    DEFAULT_TILE_IDS,
    createFinalScoringState,
    ensureFinalScoringState,
    getReachedThresholds,
    syncPendingMarks,
    getPendingMarksForPlayer,
    getNextPendingMarkForPlayer,
    hasPlayerMarkedTile,
    canMarkTile,
    markTile,
    listMarks,
    getReadoutLines,
    normalizeTileVariant,
    createDefaultTileVariants,
    setTileVariants,
    getTileVariant,
    randomizeTileVariants,
  });
});
