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

  function createDefaultNebulaDataState() {
    return { nebulae: {} };
  }

  function ensureNebulaBucket(state, nebulaId) {
    if (!state.nebulae[nebulaId]) {
      state.nebulae[nebulaId] = { tokens: [] };
    } else if (!Array.isArray(state.nebulae[nebulaId].tokens)) {
      state.nebulae[nebulaId].tokens = [];
    }
    return state.nebulae[nebulaId];
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
    };
  }

  function normalizeNebulaDataState(source) {
    const nebulae = {};
    const sourceNebulae = source?.nebulae && typeof source.nebulae === "object" ? source.nebulae : {};
    for (const nebulaId of nebulaPlacement.NEBULA_IDS) {
      const bucket = sourceNebulae[nebulaId];
      if (!bucket) continue;
      const tokens = Array.isArray(bucket.tokens) ? bucket.tokens : [];
      nebulae[nebulaId] = {
        tokens: tokens.map((token, index) => normalizeNebulaToken(token, nebulaId, index)),
      };
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

    if (!added.length) {
      return {
        ok: false,
        message: `${nebulaPlacement.getNebulaLabel(nebulaId)} 数据已满（${capacity}/${capacity}）`,
      };
    }

    const label = nebulaPlacement.getNebulaLabel(nebulaId);
    const sourceLabel = options.source === "debug" ? "调试填充" : "填充";
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
    return {
      ok: true,
      results,
      totalAdded,
      message: `调试填充星云数据共 ${totalAdded} 个`,
    };
  }

  function clearNebulaData(state, nebulaId) {
    if (nebulaId) {
      if (state.nebulae[nebulaId]) {
        state.nebulae[nebulaId].tokens = [];
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

  return Object.freeze({
    createDefaultNebulaDataState,
    normalizeNebulaDataState,
    listNebulaTokens,
    listAllNebulaTokens,
    fillNebulaData,
    fillAllNebulaData,
    clearNebulaData,
    updateNebulaTokenPosition,
  });
});
