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
  let nebulaReplacementSequence = 0;
  const NEBULA_SECOND_SLOT_INDEX = 2;
  const NEBULA_SECOND_SLOT_SCORE = 2;

  function getNebulaSecondSlotScoreReward(slotIndex) {
    return Number(slotIndex) === NEBULA_SECOND_SLOT_INDEX ? NEBULA_SECOND_SLOT_SCORE : 0;
  }

  function createDefaultNebulaDataState() {
    return {
      nebulae: {},
      sectorExtraMarks: {},
      sectorSettlements: createDefaultSectorSettlementState(),
    };
  }

  function createDefaultSectorSettlementState() {
    return {
      sectors: {},
      winsByPlayerId: {},
    };
  }

  function ensureSectorSettlementState(state) {
    if (!state.sectorSettlements || typeof state.sectorSettlements !== "object") {
      state.sectorSettlements = createDefaultSectorSettlementState();
    }
    if (!state.sectorSettlements.sectors || typeof state.sectorSettlements.sectors !== "object") {
      state.sectorSettlements.sectors = {};
    }
    if (!state.sectorSettlements.winsByPlayerId || typeof state.sectorSettlements.winsByPlayerId !== "object") {
      state.sectorSettlements.winsByPlayerId = {};
    }
    return state.sectorSettlements;
  }

  function ensureSectorSettlementRecord(state, sectorId) {
    const settlements = ensureSectorSettlementState(state);
    const key = normalizeSettlementSectorId(sectorId);
    if (!settlements.sectors[key]) {
      settlements.sectors[key] = {
        sectorId: key,
        settlementCount: 0,
        winners: [],
      };
    }
    if (!Array.isArray(settlements.sectors[key].winners)) {
      settlements.sectors[key].winners = [];
    }
    return settlements.sectors[key];
  }

  function createEmptyPlayerTokenCounts() {
    return {};
  }

  function ensureSectorExtraMarkList(state, sectorId) {
    if (!state.sectorExtraMarks || typeof state.sectorExtraMarks !== "object") {
      state.sectorExtraMarks = {};
    }
    const key = normalizeSettlementSectorId(sectorId);
    if (!Array.isArray(state.sectorExtraMarks[key])) {
      state.sectorExtraMarks[key] = [];
    }
    return state.sectorExtraMarks[key];
  }

  function normalizeSettlementSectorId(sectorId) {
    const key = String(sectorId || "");
    return nebulaPlacement.getNebulaCapacity(key) ? key : "";
  }

  function listSettlementSectorIds(sectorIds) {
    const source = Array.isArray(sectorIds) && sectorIds.length
      ? sectorIds
      : nebulaPlacement.NEBULA_IDS;
    return source
      .map(normalizeSettlementSectorId)
      .filter(Boolean);
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
      replacementOrder: Number.isFinite(Number(token?.replacementOrder)) ? Number(token.replacementOrder) : null,
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
    const normalized = {
      nebulae,
      sectorSettlements: createDefaultSectorSettlementState(),
    };
    const sourceSettlements = source?.sectorSettlements;
    if (sourceSettlements && typeof sourceSettlements === "object") {
      normalized.sectorSettlements.sectors = structuredClone(sourceSettlements.sectors || {});
      normalized.sectorSettlements.winsByPlayerId = structuredClone(sourceSettlements.winsByPlayerId || {});
    }
    normalized.sectorExtraMarks = structuredClone(source?.sectorExtraMarks || {});
    return normalized;
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
      if (state.sectorExtraMarks?.[nebulaId]) {
        state.sectorExtraMarks[nebulaId] = [];
      }
      return;
    }
    state.nebulae = {};
    state.sectorExtraMarks = {};
    state.sectorSettlements = createDefaultSectorSettlementState();
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

  function getTokenReplacementRank(token) {
    if (Number.isFinite(Number(token?.replacementOrder))) return Number(token.replacementOrder);
    const parsedTime = Date.parse(token?.replacedAt || "");
    return Number.isFinite(parsedTime) ? parsedTime : 0;
  }

  function addPlayerCountEntry(countsByPlayer, mark) {
    const color = mark?.replacedByPlayerColor || mark?.playerColor || null;
    if (!color) return;
    const key = mark.replacedByPlayerId || mark.playerId || color;
    const rank = getTokenReplacementRank(mark);
    if (!countsByPlayer[key]) {
      countsByPlayer[key] = {
        playerKey: key,
        playerId: mark.replacedByPlayerId || mark.playerId || null,
        playerColor: color,
        playerLabel: mark.replacedByPlayerLabel || mark.playerLabel || color,
        playerTokenSrc: mark.playerTokenSrc || null,
        count: 0,
        latestReplacementOrder: rank,
      };
    }
    countsByPlayer[key].count += 1;
    if (rank >= countsByPlayer[key].latestReplacementOrder) {
      countsByPlayer[key].latestReplacementOrder = rank;
      countsByPlayer[key].playerId = mark.replacedByPlayerId || mark.playerId || countsByPlayer[key].playerId;
      countsByPlayer[key].playerColor = color;
      countsByPlayer[key].playerLabel = mark.replacedByPlayerLabel || mark.playerLabel || countsByPlayer[key].playerLabel;
      countsByPlayer[key].playerTokenSrc = mark.playerTokenSrc || countsByPlayer[key].playerTokenSrc;
    }
  }

  function listSectorExtraMarks(state, sectorId) {
    const key = normalizeSettlementSectorId(sectorId);
    const marks = state?.sectorExtraMarks?.[key];
    return Array.isArray(marks) ? [...marks] : [];
  }

  function getSectorTokenStats(state, sectorId) {
    const countsByPlayer = {};
    const nebulaId = normalizeSettlementSectorId(sectorId);
    if (!nebulaId) return countsByPlayer;

    for (const token of listNebulaTokens(state, nebulaId)) {
      addPlayerCountEntry(countsByPlayer, token);
    }
    for (const mark of listSectorExtraMarks(state, nebulaId)) {
      addPlayerCountEntry(countsByPlayer, mark);
    }

    return countsByPlayer;
  }

  function addSectorExtraMark(state, sectorId, player, options = {}) {
    if (!player) {
      return { ok: false, message: "没有当前玩家" };
    }
    const normalizedSectorId = normalizeSettlementSectorId(sectorId);
    if (!normalizedSectorId) {
      return { ok: false, message: `未知扇区 ${sectorId}` };
    }

    nebulaReplacementSequence += 1;
    const playerColor = options.playerColor || player.color || null;
    const playerLabel = options.playerLabel || player.colorLabel || player.name || playerColor || "玩家";
    const mark = {
      id: options.id || `sector-extra-mark-${normalizedSectorId}-${nebulaReplacementSequence}`,
      sectorId: normalizedSectorId,
      replacedByPlayerId: player.id || null,
      replacedByPlayerColor: playerColor,
      replacedByPlayerLabel: playerLabel,
      playerTokenSrc: options.playerTokenSrc || options.tokenSrc || null,
      replacedAt: options.replacedAt || new Date().toISOString(),
      replacementOrder: options.replacementOrder || nebulaReplacementSequence,
    };
    ensureSectorExtraMarkList(state, normalizedSectorId).push(mark);
    return {
      ok: true,
      sectorId: normalizedSectorId,
      extra: true,
      mark,
      player,
      stats: getSectorTokenStats(state, normalizedSectorId),
      message: `扇区${normalizedSectorId} 额外标记已添加为${playerLabel}token`,
    };
  }

  function removeSectorExtraMark(state, sectorId, markId) {
    const key = normalizeSettlementSectorId(sectorId);
    const marks = state?.sectorExtraMarks?.[key];
    if (!Array.isArray(marks)) return { ok: false, message: `扇区${sectorId}没有额外标记` };
    const index = marks.findIndex((mark) => mark.id === markId);
    if (index < 0) return { ok: false, message: `未找到额外标记 ${markId}` };
    const [mark] = marks.splice(index, 1);
    return { ok: true, sectorId: key, mark };
  }

  function isSectorReadyToSettle(state, sectorId) {
    const nebulaId = normalizeSettlementSectorId(sectorId);
    if (!nebulaId) return false;
    const capacity = nebulaPlacement.getNebulaCapacity(nebulaId);
    const tokens = listNebulaTokens(state, nebulaId);
    if (!capacity || tokens.length !== capacity) return false;
    if (tokens.some((token) => !getTokenOwnerColor(token))) return false;
    return true;
  }

  function findPlayerForSettlement(participant, options = {}) {
    const allPlayers = Array.isArray(options.players) ? options.players : [];
    return allPlayers.find((player) => player.id === participant?.playerId)
      || allPlayers.find((player) => player.color === participant?.playerColor)
      || null;
  }

  function getSettlementPlayerTokenSrc(participant, options = {}) {
    const player = findPlayerForSettlement(participant, options);
    if (typeof options.getPlayerTokenSrc === "function") {
      return options.getPlayerTokenSrc(player || participant);
    }
    return participant?.playerTokenSrc || player?.playerTokenSrc || null;
  }

  function createRetainedSectorToken(state, nebulaId, participant, options = {}) {
    const layout = nebulaPlacement.getNebulaDataSlotLayout(nebulaId, 1);
    if (!layout || !participant) return null;

    nebulaTokenSequence += 1;
    return normalizeNebulaToken({
      id: `nebula-data-${nebulaTokenSequence}`,
      index: getNextNebulaDataIndex(state),
      slotIndex: 1,
      replacedByPlayerId: participant.playerId,
      replacedByPlayerColor: participant.playerColor,
      replacedByPlayerLabel: participant.playerLabel,
      playerTokenSrc: getSettlementPlayerTokenSrc(participant, options),
      replacedAt: options.settledAt || new Date().toISOString(),
      replacementOrder: participant.latestReplacementOrder,
    }, nebulaId, 0);
  }

  function resetSectorNebulaData(state, sectorId, retainedParticipant, options = {}) {
    const nebulaId = normalizeSettlementSectorId(sectorId);
    if (!nebulaId) return [];
    const bucket = ensureNebulaBucket(state, nebulaId);
    bucket.tokens = [];
    rebuildNebulaStats(bucket);
    if (state.sectorExtraMarks) {
      state.sectorExtraMarks[nebulaId] = [];
    }

    if (retainedParticipant) {
      const token = createRetainedSectorToken(state, nebulaId, retainedParticipant, options);
      if (token) {
        bucket.tokens.push(token);
        rebuildNebulaStats(bucket);
      }
    }

    const fillResults = [];
    const fillResult = fillNebulaData(state, nebulaId, {
      source: options.source || "sectorSettlement",
    });
    if (fillResult.ok) fillResults.push(fillResult);
    return fillResults;
  }

  function getSectorRanking(state, sectorId) {
    return Object.values(getSectorTokenStats(state, sectorId))
      .sort((a, b) => (
        b.count - a.count
        || b.latestReplacementOrder - a.latestReplacementOrder
        || String(a.playerKey).localeCompare(String(b.playerKey))
      ));
  }

  function settleSector(state, sectorId, options = {}) {
    const normalizedSectorId = normalizeSettlementSectorId(sectorId);
    if (!isSectorReadyToSettle(state, normalizedSectorId)) {
      return {
        ok: false,
        sectorId: normalizedSectorId || sectorId,
        message: `扇区${sectorId}尚未满足结算条件`,
      };
    }

    const ranking = getSectorRanking(state, normalizedSectorId);
    const participants = ranking.filter((item) => item.count > 0);
    const winner = participants[0] || null;
    const second = participants[1] || null;
    if (!winner) {
      return {
        ok: false,
        sectorId: normalizedSectorId,
        message: `扇区${sectorId}没有玩家标记`,
      };
    }

    const sectorRecord = ensureSectorSettlementRecord(state, normalizedSectorId);
    sectorRecord.settlementCount += 1;
    const settlementNumber = sectorRecord.settlementCount;
    const winnerRecord = {
      sectorId: normalizedSectorId,
      settlementNumber,
      playerId: winner.playerId,
      playerColor: winner.playerColor,
      playerLabel: winner.playerLabel,
    };
    sectorRecord.winners.push(winnerRecord);
    sectorRecord.lastWinner = winnerRecord;

    const winnerKey = winner.playerId || winner.playerColor;
    const settlements = ensureSectorSettlementState(state);
    if (!settlements.winsByPlayerId[winnerKey]) settlements.winsByPlayerId[winnerKey] = [];
    settlements.winsByPlayerId[winnerKey].push({
      sectorId: normalizedSectorId,
      settlementNumber,
    });

    const fillResults = resetSectorNebulaData(state, normalizedSectorId, second, {
      ...options,
      settledAt: options.settledAt || new Date().toISOString(),
    });

    return {
      ok: true,
      sectorId: normalizedSectorId,
      settlementNumber,
      winner,
      second,
      participants,
      fillResults,
      message: `${nebulaPlacement.getNebulaLabel(normalizedSectorId)}第${settlementNumber}次结算：${winner.playerLabel}获胜`
        + (second ? `，${second.playerLabel}保留1枚标记` : "，无第二名保留标记"),
    };
  }

  function settleCompletedSectors(state, options = {}) {
    const settlements = [];
    for (const sectorId of listSettlementSectorIds(options.sectorIds)) {
      if (!isSectorReadyToSettle(state, sectorId)) continue;
      const result = settleSector(state, sectorId, options);
      if (result.ok) settlements.push(result);
    }

    return {
      ok: settlements.length > 0,
      settlements,
      message: settlements.length
        ? settlements.map((item) => item.message).join("；")
        : "没有需要结算的扇区",
    };
  }

  function getSectorSettlementReadoutLines(state) {
    const settlements = ensureSectorSettlementState(state || createDefaultNebulaDataState());
    const lines = ["扇区结算"];
    for (const sectorId of nebulaPlacement.NEBULA_IDS) {
      const record = settlements.sectors[sectorId];
      const count = record?.settlementCount || 0;
      const winners = (record?.winners || [])
        .map((winner) => `#${winner.settlementNumber}:${winner.playerLabel || winner.playerColor}`)
        .join(" ");
      const marks = getSectorRanking(state, sectorId)
        .map((item) => `${item.playerLabel || item.playerColor}:${item.count}`)
        .join(" ");
      const extraCount = listSectorExtraMarks(state, sectorId).length;
      lines.push(
        `${nebulaPlacement.getNebulaLabel(sectorId)} 结算${count}次${winners ? ` ${winners}` : ""}`
        + ` 标记=${marks || "无"}${extraCount ? ` 额外=${extraCount}` : ""}`,
      );
    }
    const playerLines = Object.entries(settlements.winsByPlayerId || {})
      .map(([playerKey, wins]) => `${playerKey}:${
        (wins || []).map((win) => `${nebulaPlacement.getNebulaLabel(win.sectorId)}#${win.settlementNumber}`).join(",")
      }`);
    lines.push(`玩家胜利 ${playerLines.length ? playerLines.join("  ") : "无"}`);
    return lines;
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
    token.replacementOrder = before.replacementOrder ?? null;
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
    nebulaReplacementSequence += 1;
    token.replacementOrder = options.replacementOrder || nebulaReplacementSequence;
    rebuildNebulaStats(bucket);

    const label = nebulaPlacement.getNebulaLabel(nebulaId);
    const secondSlotScore = getNebulaSecondSlotScoreReward(token.slotIndex);
    if (secondSlotScore && options.awardSecondSlotScore !== false) {
      if (!player.resources) player.resources = {};
      player.resources.score = (Number(player.resources.score) || 0) + secondSlotScore;
    }
    return {
      ok: true,
      nebulaId,
      token,
      slotIndex: token.slotIndex,
      secondSlotScore,
      scoreAwarded: options.awardSecondSlotScore === false ? 0 : secondSlotScore,
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
    createDefaultSectorSettlementState,
    normalizeNebulaDataState,
    listNebulaTokens,
    listAllNebulaTokens,
    fillNebulaData,
    fillAllNebulaData,
    clearNebulaData,
    updateNebulaTokenPosition,
    addSectorExtraMark,
    removeSectorExtraMark,
    listSectorExtraMarks,
    isSectorReadyToSettle,
    getSectorTokenStats,
    getSectorRanking,
    settleSector,
    settleCompletedSectors,
    getSectorSettlementReadoutLines,
    getNebulaReplacementStats,
    getNextReplaceableNebulaToken,
    revertNebulaTokenReplacement,
    replaceNextNebulaDataToken,
  });
});
