(function (root, factory) {
  "use strict";

  let nebulaPlacement = root.SetiNebulaDataPlacement;

  if (typeof require === "function") {
    nebulaPlacement = nebulaPlacement || require("./nebula-placement");
  }

  const api = factory(nebulaPlacement);

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.SetiNebulaDataState = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function (nebulaPlacement) {
  "use strict";

  let nebulaTokenSequence = 0;
  const NEBULA_SECOND_SLOT_INDEX = 2;
  const NEBULA_SECOND_SLOT_SCORE = 2;

  function getNebulaSecondSlotScoreReward(slotIndex) {
    return Number(slotIndex) === NEBULA_SECOND_SLOT_INDEX ? NEBULA_SECOND_SLOT_SCORE : 0;
  }

  function createDefaultNebulaDataState() {
    return { nebulae: {} };
  }

  function createEmptyPlayerTokenCounts() {
    return {};
  }

  function getTokenOwnerColor(token) {
    return token?.replacedByPlayerColor || token?.playerColor || null;
  }

  function rebuildNebulaStats(bucket) {
    const counts = createEmptyPlayerTokenCounts();
    let lastReplacedPlayerId = null;
    let lastReplacedPlayerColor = null;
    let lastReplacedPlayerLabel = null;

    for (const token of bucket.tokens || []) {
      const color = getTokenOwnerColor(token);
      if (!color) continue;
      counts[color] = (counts[color] || 0) + 1;
      lastReplacedPlayerId = token.replacedByPlayerId || token.playerId || null;
      lastReplacedPlayerColor = color;
      lastReplacedPlayerLabel = token.replacedByPlayerLabel || token.playerLabel || null;
    }

    bucket.playerTokenCounts = counts;
    bucket.lastReplacedPlayerId = lastReplacedPlayerId;
    bucket.lastReplacedPlayerColor = lastReplacedPlayerColor;
    bucket.lastReplacedPlayerLabel = lastReplacedPlayerLabel;
    return bucket;
  }

  function ensureNebulaBucket(state, nebulaId) {
    if (!state.nebulae[nebulaId]) {
      state.nebulae[nebulaId] = {
        tokens: [],
        playerTokenCounts: createEmptyPlayerTokenCounts(),
        lastReplacedPlayerId: null,
        lastReplacedPlayerColor: null,
        lastReplacedPlayerLabel: null,
      };
    } else if (!Array.isArray(state.nebulae[nebulaId].tokens)) {
      state.nebulae[nebulaId].tokens = [];
    }
    return rebuildNebulaStats(state.nebulae[nebulaId]);
  }

  function normalizeNebulaToken(token, nebulaId, index) {
    const slotIndex = Number(token?.slotIndex);
    const layout = nebulaPlacement.getNebulaDataSlotLayout(nebulaId, slotIndex);
    return {
      id: token?.id || `nebula-data-${nebulaId}-${index + 1}`,
      index: Number.isInteger(token?.index) ? token.index : index + 1,
      nebulaId,
      slotIndex,
      percentX: token?.percentX ?? layout?.percentX ?? null,
      percentY: token?.percentY ?? layout?.percentY ?? null,
      replacedByPlayerId: token?.replacedByPlayerId || token?.playerId || null,
      replacedByPlayerColor: token?.replacedByPlayerColor || token?.playerColor || null,
      replacedByPlayerLabel: token?.replacedByPlayerLabel || token?.playerLabel || null,
      playerTokenSrc: token?.playerTokenSrc || token?.tokenSrc || null,
      replacedAt: token?.replacedAt || null,
    };
  }

  function normalizeNebulaDataState(source) {
    const nebulae = {};
    const sourceNebulae = source?.nebulae && typeof source.nebulae === "object" ? source.nebulae : {};
    for (const nebulaId of nebulaPlacement.NEBULA_IDS) {
      const bucket = sourceNebulae[nebulaId];
      if (!bucket) continue;
      const tokens = Array.isArray(bucket.tokens) ? bucket.tokens : [];
      nebulae[nebulaId] = rebuildNebulaStats({
        tokens: tokens.map((token, index) => normalizeNebulaToken(token, nebulaId, index)),
      });
    }
    return { nebulae };
  }

  function listNebulaTokens(state, nebulaId) {
    const bucket = state?.nebulae?.[nebulaId];
    return bucket ? [...bucket.tokens] : [];
  }

  function listAllNebulaTokens(state) {
    const all = [];
    for (const nebulaId of nebulaPlacement.NEBULA_IDS) {
      for (const token of listNebulaTokens(state, nebulaId)) {
        all.push(token);
      }
    }
    return all;
  }

  function getNextNebulaDataIndex(state) {
    const all = listAllNebulaTokens(state);
    if (!all.length) return 1;
    return Math.max(...all.map((token) => token.index)) + 1;
  }

  function findOpenNebulaSlotIndex(state, nebulaId) {
    const occupied = new Set(listNebulaTokens(state, nebulaId).map((token) => token.slotIndex));
    const layouts = nebulaPlacement.listNebulaSlotLayouts(nebulaId);
    for (const layout of layouts) {
      if (!occupied.has(layout.slotIndex)) return layout.slotIndex;
    }
    return null;
  }

  function fillNebulaData(state, nebulaId, options = {}) {
    const capacity = nebulaPlacement.getNebulaCapacity(nebulaId);
    if (!capacity) {
      return { ok: false, message: `未知星云 ${nebulaId}` };
    }

    const bucket = ensureNebulaBucket(state, nebulaId);
    const added = [];

    while (bucket.tokens.length < capacity) {
      const slotIndex = findOpenNebulaSlotIndex(state, nebulaId);
      const layout = nebulaPlacement.getNebulaDataSlotLayout(nebulaId, slotIndex);
      if (!slotIndex || !layout) break;

      nebulaTokenSequence += 1;
      const token = normalizeNebulaToken({
        id: `nebula-data-${nebulaTokenSequence}`,
        index: getNextNebulaDataIndex(state),
        slotIndex,
      }, nebulaId, bucket.tokens.length);

      bucket.tokens.push(token);
      added.push({ token, layout });
    }

    rebuildNebulaStats(bucket);

    if (!added.length) {
      return {
        ok: false,
        message: `${nebulaPlacement.getNebulaLabel(nebulaId)} 数据已满（${capacity}/${capacity}）`,
      };
    }

    const label = nebulaPlacement.getNebulaLabel(nebulaId);
    const sourceLabel = options.source === "debug"
      ? "调试填充"
      : options.source === "setup"
        ? "设置填充"
        : "填充";
    const coordLines = added.map(({ token, layout }) =>
      `序号${token.index} 槽位${token.slotIndex} (${layout.percentX}%,${layout.percentY}%)`,
    );

    return {
      ok: true,
      nebulaId,
      added,
      message: `${sourceLabel} ${label} +${added.length}：${coordLines.join("；")}`,
    };
  }

  function fillAllNebulaData(state, options = {}) {
    const results = [];
    for (const nebulaId of nebulaPlacement.NEBULA_IDS) {
      const result = fillNebulaData(state, nebulaId, options);
      if (result.ok) results.push(result);
    }

    if (!results.length) {
      return { ok: false, message: "所有星云数据槽位均已填满" };
    }

    const totalAdded = results.reduce((sum, result) => sum + result.added.length, 0);
    const batchLabel = options.source === "setup" ? "设置填充" : "调试填充";
    return {
      ok: true,
      results,
      totalAdded,
      message: `${batchLabel}星云数据共 ${totalAdded} 个`,
    };
  }

  function clearNebulaData(state, nebulaId) {
    if (nebulaId) {
      if (state.nebulae[nebulaId]) {
        state.nebulae[nebulaId].tokens = [];
        rebuildNebulaStats(state.nebulae[nebulaId]);
      }
      return;
    }
    state.nebulae = {};
  }

  function updateNebulaTokenPosition(state, nebulaId, slotIndex, position) {
    const bucket = ensureNebulaBucket(state, nebulaId);
    const token = bucket.tokens.find((item) => item.slotIndex === Number(slotIndex));
    if (!token) return null;
    token.percentX = position.percentX;
    token.percentY = position.percentY;
    return token;
  }

  function getNebulaReplacementStats(state, nebulaId) {
    const bucket = state?.nebulae?.[nebulaId];
    if (!bucket) {
      return {
        playerTokenCounts: createEmptyPlayerTokenCounts(),
        lastReplacedPlayerId: null,
        lastReplacedPlayerColor: null,
        lastReplacedPlayerLabel: null,
      };
    }
    rebuildNebulaStats(bucket);
    return {
      playerTokenCounts: { ...(bucket.playerTokenCounts || {}) },
      lastReplacedPlayerId: bucket.lastReplacedPlayerId || null,
      lastReplacedPlayerColor: bucket.lastReplacedPlayerColor || null,
      lastReplacedPlayerLabel: bucket.lastReplacedPlayerLabel || null,
    };
  }

  function getNextReplaceableNebulaToken(state, nebulaId) {
    return listNebulaTokens(state, nebulaId)
      .filter((token) => !getTokenOwnerColor(token))
      .sort((a, b) => a.slotIndex - b.slotIndex || a.index - b.index)[0] || null;
  }

  function revertNebulaTokenReplacement(state, nebulaId, tokenId, before = {}) {
    const bucket = state?.nebulae?.[nebulaId];
    if (!bucket) return { ok: false, message: `未知星云 ${nebulaId}` };

    const token = bucket.tokens.find((item) => item.id === tokenId);
    if (!token) return { ok: false, message: `未找到星云数据 ${tokenId}` };

    token.replacedByPlayerId = before.replacedByPlayerId ?? null;
    token.replacedByPlayerColor = before.replacedByPlayerColor ?? null;
    token.replacedByPlayerLabel = before.replacedByPlayerLabel ?? null;
    token.playerTokenSrc = before.playerTokenSrc ?? null;
    token.replacedAt = before.replacedAt ?? null;
    rebuildNebulaStats(bucket);

    return { ok: true, nebulaId, tokenId, token };
  }

  function replaceNextNebulaDataToken(state, nebulaId, player, options = {}) {
    const capacity = nebulaPlacement.getNebulaCapacity(nebulaId);
    if (!capacity) {
      return { ok: false, message: `未知星云 ${nebulaId}` };
    }

    if (!player) {
      return { ok: false, message: "没有当前玩家" };
    }

    const bucket = ensureNebulaBucket(state, nebulaId);
    if (!bucket.tokens.length) {
      return {
        ok: false,
        message: `${nebulaPlacement.getNebulaLabel(nebulaId)} 没有可替换的数据`,
      };
    }

    const next = getNextReplaceableNebulaToken(state, nebulaId);
    if (!next) {
      return {
        ok: false,
        message: `${nebulaPlacement.getNebulaLabel(nebulaId)} 已没有未替换的数据`,
      };
    }

    const token = bucket.tokens.find((item) => item.id === next.id);
    const playerColor = options.playerColor || player.color || null;
    const playerLabel = options.playerLabel || player.colorLabel || player.name || playerColor || "玩家";
    const tokenSrc = options.playerTokenSrc || options.tokenSrc || null;
    token.replacedByPlayerId = player.id || null;
    token.replacedByPlayerColor = playerColor;
    token.replacedByPlayerLabel = playerLabel;
    token.playerTokenSrc = tokenSrc;
    token.replacedAt = options.replacedAt || new Date().toISOString();
    rebuildNebulaStats(bucket);

    const label = nebulaPlacement.getNebulaLabel(nebulaId);
    const secondSlotScore = getNebulaSecondSlotScoreReward(token.slotIndex);
    return {
      ok: true,
      nebulaId,
      token,
      slotIndex: token.slotIndex,
      secondSlotScore,
      player,
      stats: getNebulaReplacementStats(state, nebulaId),
      message: `${label} 槽位${token.slotIndex} 数据已替换为${playerLabel}token`
        + (secondSlotScore ? `；第二格 +${secondSlotScore}分` : ""),
    };
  }

  return Object.freeze({
    NEBULA_SECOND_SLOT_INDEX,
    NEBULA_SECOND_SLOT_SCORE,
    getNebulaSecondSlotScoreReward,
    createDefaultNebulaDataState,
    normalizeNebulaDataState,
    listNebulaTokens,
    listAllNebulaTokens,
    fillNebulaData,
    fillAllNebulaData,
    clearNebulaData,
    updateNebulaTokenPosition,
    getNebulaReplacementStats,
    getNextReplaceableNebulaToken,
    revertNebulaTokenReplacement,
    replaceNextNebulaDataToken,
  });
});
