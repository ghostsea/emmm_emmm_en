(function (root, factory) {
  "use strict";

  let finalScoringModule = root.SetiFinalScoring;
  let jiuzheModule = root.SetiAlienJiuzhe;
  let yichangdianModule = root.SetiAlienYichangdian;
  let fangzhouModule = root.SetiAlienFangzhou;
  let banrenmaModule = root.SetiAlienBanrenma;
  let chongModule = root.SetiAlienChong;
  let amibaModule = root.SetiAlienAmiba;
  let aomomoModule = root.SetiAlienAomomo;
  let runezuModule = root.SetiAlienRunezu;
  if (typeof require === "function") {
    finalScoringModule = finalScoringModule || require("./final-scoring");
    jiuzheModule = jiuzheModule || require("./aliens/jiuzhe");
    yichangdianModule = yichangdianModule || require("./aliens/yichangdian");
    fangzhouModule = fangzhouModule || require("./aliens/fangzhou");
    banrenmaModule = banrenmaModule || require("./aliens/banrenma");
    chongModule = chongModule || require("./aliens/chong");
    amibaModule = amibaModule || require("./aliens/amiba");
    aomomoModule = aomomoModule || require("./aliens/aomomo");
    runezuModule = runezuModule || require("./aliens/runezu");
  }

  const api = factory(finalScoringModule, jiuzheModule, yichangdianModule, fangzhouModule, banrenmaModule, chongModule, amibaModule, aomomoModule, runezuModule);

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.SetiEndGameScoring = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function (finalScoring, jiuzhe, yichangdian, fangzhou, banrenma, chong, amiba, aomomo, runezu) {
  "use strict";

  const NEBULA_IDS_BY_COLOR = Object.freeze({
    yellow: Object.freeze(["sector-4-a", "sector-3-a"]),
    red: Object.freeze(["sector-2-b", "sector-3-b"]),
    blue: Object.freeze(["sector-2-a", "sector-1-a"]),
    black: Object.freeze(["sector-1-b", "sector-4-b"]),
  });

  const FORMULA_MULTIPLIERS = Object.freeze({
    a1: Object.freeze({ 1: 5, 2: 4, 3: 3 }),
    a2: Object.freeze({ 1: 11, 2: 8, 3: 5 }),
    b1: Object.freeze({ 1: 8, 2: 6, 3: 4 }),
    b2: Object.freeze({ 1: 8, 2: 6, 3: 4 }),
    c1: Object.freeze({ 1: 4, 2: 3, 3: 2 }),
    c2: Object.freeze({ 1: 8, 2: 6, 3: 4 }),
    d1: Object.freeze({ 1: 11, 2: 8, 3: 5 }),
    d2: Object.freeze({ 1: 7, 2: 5, 3: 3 }),
  });

  const CARD_END_GAME_RULES = Object.freeze({
    "b_14.webp": Object.freeze({ kind: "sectorWinsByColor", color: "red", scorePer: 3 }),
    "b_30.webp": Object.freeze({ kind: "traceCount", traceType: "blue", scorePer: 2 }),
    "b_33.webp": Object.freeze({ kind: "techCount", techType: "blue", scorePer: 2 }),
    "b_45.webp": Object.freeze({ kind: "distinctSignalSectors", scorePer: 1 }),
    "b_63.webp": Object.freeze({ kind: "sectorWinsByColor", color: "yellow", scorePer: 3 }),
    "b_34.webp": Object.freeze({ kind: "planetOrbitOrLand", planetId: "jupiter", scorePer: 3 }),
    "b_74.webp": Object.freeze({ kind: "planetOrbitOrLand", planetId: "mars", scorePer: 4 }),
    "b_82.webp": Object.freeze({ kind: "probeLocation", locationType: "asteroid", score: 13 }),
    "b_86.webp": Object.freeze({ kind: "traceCount", traceType: "pink", scorePer: 2 }),
    "b_100.webp": Object.freeze({ kind: "sectorWinsByColor", color: "blue", scorePer: 3 }),
    "b_113.webp": Object.freeze({ kind: "traceCount", traceType: "yellow", scorePer: 2 }),
    "b_115.webp": Object.freeze({ kind: "unmarkedFinalRightmost" }),
    "b_128.webp": Object.freeze({ kind: "sectorWinsByColor", color: "black", scorePer: 3 }),
    "dlc_8.png": Object.freeze({ kind: "remainingResource", resource: "availableData", scorePer: 3 }),
    "dlc_10.png": Object.freeze({ kind: "remainingResource", resource: "publicity", scorePer: 1 }),
    "dlc_31.png": Object.freeze({ kind: "planetLandingPairs", count: 2, scorePer: 6 }),
    "dlc_39.png": Object.freeze({ kind: "allOrbitOrLand", scorePer: 2 }),
  });

  function getJiuzheModule() {
    if (jiuzhe) return jiuzhe;
    if (typeof globalThis !== "undefined" && globalThis.SetiAlienJiuzhe) {
      jiuzhe = globalThis.SetiAlienJiuzhe;
      return jiuzhe;
    }
    if (typeof require === "function") {
      try {
        jiuzhe = require("./aliens/jiuzhe");
        return jiuzhe;
      } catch (_error) {
        return null;
      }
    }
    return null;
  }

  function getYichangdianModule() {
    if (yichangdian) return yichangdian;
    if (typeof globalThis !== "undefined" && globalThis.SetiAlienYichangdian) {
      yichangdian = globalThis.SetiAlienYichangdian;
      return yichangdian;
    }
    if (typeof require === "function") {
      try {
        yichangdian = require("./aliens/yichangdian");
        return yichangdian;
      } catch (_error) {
        return null;
      }
    }
    return null;
  }

  function getFangzhouModule() {
    if (fangzhou) return fangzhou;
    if (typeof globalThis !== "undefined" && globalThis.SetiAlienFangzhou) {
      fangzhou = globalThis.SetiAlienFangzhou;
      return fangzhou;
    }
    if (typeof require === "function") {
      try {
        fangzhou = require("./aliens/fangzhou");
        return fangzhou;
      } catch (_error) {
        return null;
      }
    }
    return null;
  }

  function getBanrenmaModule() {
    if (banrenma) return banrenma;
    if (typeof globalThis !== "undefined" && globalThis.SetiAlienBanrenma) {
      banrenma = globalThis.SetiAlienBanrenma;
      return banrenma;
    }
    if (typeof require === "function") {
      try {
        banrenma = require("./aliens/banrenma");
        return banrenma;
      } catch (_error) {
        return null;
      }
    }
    return null;
  }

  function getChongModule() {
    if (chong) return chong;
    if (typeof globalThis !== "undefined" && globalThis.SetiAlienChong) {
      chong = globalThis.SetiAlienChong;
      return chong;
    }
    if (typeof require === "function") {
      try {
        chong = require("./aliens/chong");
        return chong;
      } catch (_error) {
        return null;
      }
    }
    return null;
  }

  function getAmibaModule() {
    if (amiba) return amiba;
    if (typeof globalThis !== "undefined" && globalThis.SetiAlienAmiba) {
      amiba = globalThis.SetiAlienAmiba;
      return amiba;
    }
    if (typeof require === "function") {
      try {
        amiba = require("./aliens/amiba");
        return amiba;
      } catch (_error) {
        return null;
      }
    }
    return null;
  }

  function getAomomoModule() {
    if (aomomo) return aomomo;
    if (typeof globalThis !== "undefined" && globalThis.SetiAlienAomomo) {
      aomomo = globalThis.SetiAlienAomomo;
      return aomomo;
    }
    if (typeof require === "function") {
      try {
        aomomo = require("./aliens/aomomo");
        return aomomo;
      } catch (_error) {
        return null;
      }
    }
    return null;
  }

  function getRunezuModule() {
    if (runezu) return runezu;
    if (typeof globalThis !== "undefined" && globalThis.SetiAlienRunezu) {
      runezu = globalThis.SetiAlienRunezu;
      return runezu;
    }
    if (typeof require === "function") {
      try {
        runezu = require("./aliens/runezu");
        return runezu;
      } catch (_error) {
        return null;
      }
    }
    return null;
  }

  function getPlayerKeys(player) {
    return new Set([player?.id, player?.playerId, player?.color, player?.playerColor].filter(Boolean));
  }

  function getPlayerId(player) {
    return player?.id || player?.color || null;
  }

  function getBaseScore(player) {
    return Number(player?.resources?.score) || 0;
  }

  function countSectorWinsByColor(player, nebulaDataState, color) {
    const sectorIds = color === "any"
      ? Object.values(NEBULA_IDS_BY_COLOR).flat()
      : (NEBULA_IDS_BY_COLOR[color] || []);
    const playerKeys = getPlayerKeys(player);
    const wins = nebulaDataState?.sectorSettlements?.winsByPlayerId || {};
    let count = 0;
    for (const key of playerKeys) {
      for (const win of wins[key] || []) {
        if (sectorIds.includes(win.sectorId)) count += 1;
      }
    }
    return count;
  }

  function countSectorWins(player, nebulaDataState) {
    const playerKeys = getPlayerKeys(player);
    const wins = nebulaDataState?.sectorSettlements?.winsByPlayerId || {};
    let count = 0;
    for (const key of playerKeys) {
      count += (wins[key] || []).length;
    }
    return count;
  }

  function stateTraceBelongsToPlayer(traceSlot, playerKeys) {
    return playerKeys.has(traceSlot?.ownerPlayerId)
      || playerKeys.has(traceSlot?.playerId)
      || playerKeys.has(traceSlot?.ownerPlayerColor)
      || playerKeys.has(traceSlot?.playerColor)
      || playerKeys.has(traceSlot?.color);
  }

  function countStateTraceMarkersForPlayer(slot, traceType, playerKeys) {
    const traceSlot = slot?.traces?.[traceType];
    if (!traceSlot?.firstPlaced) return 0;
    let count = stateTraceBelongsToPlayer(traceSlot, playerKeys) ? 1 : 0;
    const extraCount = Math.max(0, Math.round(Number(traceSlot.extraCount) || 0));
    const markers = Array.isArray(traceSlot.extraMarkers) ? traceSlot.extraMarkers : [];
    for (let index = 0; index < extraCount; index += 1) {
      const marker = markers[index] || { ownerPlayerColor: traceSlot.ownerPlayerColor || null };
      if (stateTraceBelongsToPlayer(marker, playerKeys)) count += 1;
    }
    return count;
  }

  function countTraceMarkers(player, alienGameState, traceType) {
    const playerKeys = getPlayerKeys(player);
    let count = 0;
    const jiuzheModule = getJiuzheModule();
    const jiuzheSlotId = alienGameState?.jiuzhe?.revealedSlotId;
    const yichangdianModule = getYichangdianModule();
    const yichangdianSlotId = alienGameState?.yichangdian?.revealedSlotId;
    const fangzhouModule = getFangzhouModule();
    const fangzhouSlotId = alienGameState?.fangzhou?.revealedSlotId;
    const banrenmaModule = getBanrenmaModule();
    const banrenmaSlotId = alienGameState?.banrenma?.revealedSlotId;
    const chongModule = getChongModule();
    const chongSlotId = alienGameState?.chong?.revealedSlotId;
    const amibaModule = getAmibaModule();
    const amibaSlotId = alienGameState?.amiba?.revealedSlotId;
    const aomomoModule = getAomomoModule();
    const aomomoSlotId = alienGameState?.aomomo?.revealedSlotId;
    const runezuModule = getRunezuModule();
    const runezuSlotId = alienGameState?.runezu?.revealedSlotId;
    for (const [slotId, slot] of Object.entries(alienGameState?.aliens || {})) {
      const stateTraceCount = countStateTraceMarkersForPlayer(slot, traceType, playerKeys);
      if (jiuzheModule && jiuzheSlotId != null && Number(slotId) === Number(jiuzheSlotId)) {
        count += stateTraceCount;
        const grid = jiuzheModule.getTraceGrid(alienGameState, jiuzheSlotId);
        for (const position of jiuzheModule.TRACE_POSITIONS || []) {
          const entry = grid?.[traceType]?.[position];
          if (entry && markerBelongsToPlayer(entry, playerKeys)) count += 1;
        }
        continue;
      }
      if (yichangdianModule && yichangdianSlotId != null && Number(slotId) === Number(yichangdianSlotId)) {
        count += stateTraceCount;
        const entries = yichangdianModule.listTraceEntries(alienGameState, yichangdianSlotId, traceType);
        count += entries.filter((entry) => markerBelongsToPlayer(entry, playerKeys)).length;
        continue;
      }
      if (fangzhouModule && fangzhouSlotId != null && Number(slotId) === Number(fangzhouSlotId)) {
        count += stateTraceCount;
        const entries = fangzhouModule.listTraceEntries(alienGameState, fangzhouSlotId, traceType);
        count += entries.filter((entry) => markerBelongsToPlayer(entry, playerKeys)).length;
        continue;
      }
      if (banrenmaModule && banrenmaSlotId != null && Number(slotId) === Number(banrenmaSlotId)) {
        count += stateTraceCount;
        const entries = banrenmaModule.listTraceEntries(alienGameState, banrenmaSlotId, traceType);
        count += entries.filter((entry) => markerBelongsToPlayer(entry, playerKeys)).length;
        continue;
      }
      if (chongModule && chongSlotId != null && Number(slotId) === Number(chongSlotId)) {
        count += stateTraceCount;
        const entries = chongModule.listTraceEntries(alienGameState, chongSlotId, traceType);
        count += entries.filter((entry) => markerBelongsToPlayer(entry, playerKeys)).length;
        continue;
      }
      if (amibaModule && amibaSlotId != null && Number(slotId) === Number(amibaSlotId)) {
        count += stateTraceCount;
        const entries = amibaModule.listTraceEntries(alienGameState, amibaSlotId, traceType);
        count += entries.filter((entry) => markerBelongsToPlayer(entry, playerKeys)).length;
        continue;
      }
      if (aomomoModule && aomomoSlotId != null && Number(slotId) === Number(aomomoSlotId)) {
        count += stateTraceCount;
        const entries = aomomoModule.listTraceEntries(alienGameState, aomomoSlotId, traceType);
        count += entries.filter((entry) => markerBelongsToPlayer(entry, playerKeys)).length;
        continue;
      }
      if (runezuModule && runezuSlotId != null && Number(slotId) === Number(runezuSlotId)) {
        count += stateTraceCount;
        const entries = runezuModule.listTraceEntries(alienGameState, runezuSlotId, traceType);
        count += entries.filter((entry) => markerBelongsToPlayer(entry, playerKeys)).length;
        continue;
      }
      count += stateTraceCount;
    }
    return count;
  }

  function countOwnedTech(player, techType) {
    const ownedTiles = player?.techState?.ownedTiles || {};
    return Object.keys(ownedTiles)
      .filter((tileId) => ownedTiles[tileId]
        && String(tileId).startsWith(techType))
      .length;
  }

  function countTotalOwnedTech(player) {
    const ownedTiles = player?.techState?.ownedTiles || {};
    return Object.keys(ownedTiles).filter((tileId) => ownedTiles[tileId]).length;
  }

  function markerBelongsToPlayer(marker, playerKeys) {
    return playerKeys.has(marker?.playerId)
      || playerKeys.has(marker?.ownerPlayerId)
      || playerKeys.has(marker?.color)
      || playerKeys.has(marker?.playerColor)
      || playerKeys.has(marker?.ownerPlayerColor);
  }

  function countPlutoMarkers(player, context = {}, kind = "all") {
    const playerKeys = getPlayerKeys(player);
    return (context?.plutoMarkers || []).filter((marker) => {
      if (!markerBelongsToPlayer(marker, playerKeys)) return false;
      if (kind === "orbit") return marker.kind === "orbit";
      if (kind === "land") return marker.kind === "land";
      return marker.kind === "orbit" || marker.kind === "land";
    }).length;
  }

  function isAomomoPlanetId(planetId) {
    const aomomoModule = getAomomoModule();
    return planetId === (aomomoModule?.PLANET_ID || "aomomo");
  }

  function countPlanetRecordMarkers(player, record, kind = "all") {
    const playerKeys = getPlayerKeys(player);
    let count = 0;
    if (kind === "all" || kind === "orbit") {
      count += (record?.orbitMarkers || []).filter((marker) => (
        markerBelongsToPlayer(marker, playerKeys)
      )).length;
    }
    if (kind === "all" || kind === "land") {
      count += (record?.landingMarkers || []).filter((marker) => (
        markerBelongsToPlayer(marker, playerKeys)
      )).length;
      count += (record?.satelliteLandings || []).filter((marker) => (
        markerBelongsToPlayer(marker, playerKeys)
      )).length;
    }
    return count;
  }

  function countAomomoMarkers(player, context = {}, kind = "all") {
    const aomomoModule = getAomomoModule();
    if (!aomomoModule || !context?.alienGameState) return 0;
    const playerKeys = aomomoModule.getPlayerKeys
      ? aomomoModule.getPlayerKeys(player)
      : getPlayerKeys(player);
    const markerMatches = (marker) => (
      aomomoModule.markerBelongsToPlayer
        ? aomomoModule.markerBelongsToPlayer(marker, playerKeys)
        : markerBelongsToPlayer(marker, playerKeys)
    );
    let count = 0;
    if (kind === "all" || kind === "orbit") {
      count += (aomomoModule.listOrbitMarkers?.(context.alienGameState) || []).filter(markerMatches).length;
    }
    if (kind === "all" || kind === "land") {
      count += (aomomoModule.listLandingMarkers?.(context.alienGameState) || []).filter(markerMatches).length;
    }
    return count;
  }

  function countAomomoOrLegacyPlanetRecordMarkers(player, planetStatsState, context = {}, kind = "all") {
    const panelCount = countAomomoMarkers(player, context, kind);
    if (panelCount > 0) return panelCount;
    const aomomoModule = getAomomoModule();
    const planetId = aomomoModule?.PLANET_ID || "aomomo";
    return countPlanetRecordMarkers(player, planetStatsState?.planets?.[planetId], kind);
  }

  function countPlanetOrbitOrLand(player, planetStatsState, planetId, context = {}) {
    if (planetId === "pluto") return countPlutoMarkers(player, context, "all");
    if (isAomomoPlanetId(planetId)) {
      return countAomomoOrLegacyPlanetRecordMarkers(player, planetStatsState, context, "all");
    }
    const record = planetStatsState?.planets?.[planetId];
    return countPlanetRecordMarkers(player, record, "all");
  }

  function countOrbitOrLandMarkers(player, planetStatsState, context = {}) {
    const planets = planetStatsState?.planets || {};
    return Object.keys(planets).reduce((total, planetId) => {
      if (isAomomoPlanetId(planetId)) return total;
      return total + countPlanetOrbitOrLand(player, planetStatsState, planetId, context);
    }, countPlutoMarkers(player, context, "all")
      + countAomomoOrLegacyPlanetRecordMarkers(player, planetStatsState, context, "all"));
  }

  function countPlanetLandingPairs(player, planetStatsState, minCount = 2, context = {}) {
    const planets = planetStatsState?.planets || {};
    const playerKeys = getPlayerKeys(player);
    const required = Math.max(1, Math.round(Number(minCount) || 2));
    let count = countPlutoMarkers(player, context, "land") >= required ? 1 : 0;
    if (countAomomoOrLegacyPlanetRecordMarkers(player, planetStatsState, context, "land") >= required) count += 1;
    for (const [planetId, record] of Object.entries(planets)) {
      if (isAomomoPlanetId(planetId)) continue;
      const landingCount = (record?.landingMarkers || []).filter((marker) => (
        markerBelongsToPlayer(marker, playerKeys)
      )).length;
      if (landingCount >= required) count += 1;
    }
    return count;
  }

  function countDistinctSignalSectors(player, nebulaDataState) {
    const playerKeys = getPlayerKeys(player);
    const sectorIds = new Set();
    for (const [nebulaId, bucket] of Object.entries(nebulaDataState?.nebulae || {})) {
      const hasToken = (bucket?.tokens || []).some((token) => (
        playerKeys.has(token.replacedByPlayerId)
        || playerKeys.has(token.playerId)
        || playerKeys.has(token.replacedByPlayerColor)
        || playerKeys.has(token.playerColor)
      ));
      if (hasToken) sectorIds.add(nebulaId);
    }
    for (const [sectorId, marks] of Object.entries(nebulaDataState?.sectorExtraMarks || {})) {
      const hasExtra = (marks || []).some((mark) => (
        playerKeys.has(mark.replacedByPlayerId)
        || playerKeys.has(mark.playerId)
        || playerKeys.has(mark.replacedByPlayerColor)
        || playerKeys.has(mark.playerColor)
      ));
      if (hasExtra) sectorIds.add(sectorId);
    }
    return sectorIds.size;
  }

  function playerHasProbeLocation(player, context, locationType) {
    const playerKeys = getPlayerKeys(player);
    const locations = context?.probeLocations || {};
    for (const key of playerKeys) {
      if ((locations[key] || []).includes(locationType)) return true;
    }
    for (const detail of context?.probeLocationDetails || []) {
      if (!playerKeys.has(detail.playerId) && !playerKeys.has(detail.color)) continue;
      if (detail.locationType === locationType) return true;
    }
    return false;
  }

  function scoreUnmarkedFinalRightmost(player, context) {
    if (!finalScoring || !context?.finalScoringState) return 0;
    finalScoring.ensureFinalScoringState(context.finalScoringState);
    const playerId = getPlayerId(player);
    let total = 0;
    for (const tile of Object.values(context.finalScoringState.tiles || {})) {
      const marked = (tile.marks || []).some((entry) => entry.playerId === playerId);
      if (marked) continue;
      const variant = finalScoring.getTileVariant(context.finalScoringState, tile.id);
      const formulaId = getFormulaId(tile.id, variant);
      const baseValue = getFormulaBaseValue(formulaId, player, context, {
        getCardTypeCode: context.getCardTypeCode,
      });
      total += baseValue * getSlotMultiplier(formulaId, 3);
    }
    return total;
  }

  function countType3Cards(player, getCardTypeCode) {
    let count = 0;
    for (const card of player?.reservedCards || []) {
      const typeCode = getCardTypeCode ? getCardTypeCode(card) : Number(card?.cardTypeCode);
      if (Math.round(Number(typeCode)) === 3) count += 1;
    }
    return count;
  }

  function getFormulaId(tileId, variant) {
    const normalizedTileId = String(tileId || "").trim().toLowerCase();
    const normalizedVariant = Number(variant) === 2 ? 2 : 1;
    return `${normalizedTileId}${normalizedVariant}`;
  }

  function getSlotMultiplier(formulaId, slotIndex) {
    const multipliers = FORMULA_MULTIPLIERS[formulaId];
    if (!multipliers) return 0;
    const slot = Math.max(1, Math.round(Number(slotIndex) || 3));
    return multipliers[slot >= 3 ? 3 : slot] || 0;
  }

  function normalizeIncomeFormulaValue(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return 0;
    return Math.max(0, Math.round(number));
  }

  function getMappedCompanyBaseIncome(player, context = {}) {
    const maps = [
      context.companyBaseIncomeByPlayerId,
      context.companyBaseIncomeByPlayer,
      context.companyBaseIncomeByColor,
    ].filter((source) => source && typeof source === "object");
    if (!maps.length) return null;

    const playerKeys = getPlayerKeys(player);
    for (const map of maps) {
      for (const key of playerKeys) {
        if (map[key] && typeof map[key] === "object") return map[key];
      }
    }
    return null;
  }

  function getPlayerCompanyBaseIncome(player, context = {}, helpers = {}) {
    const resolver = helpers.getPlayerCompanyBaseIncome
      || context.getPlayerCompanyBaseIncome
      || context.getCompanyBaseIncome;
    if (typeof resolver === "function") {
      const resolved = resolver(player);
      if (resolved && typeof resolved === "object") return resolved;
    }

    const mapped = getMappedCompanyBaseIncome(player, context);
    if (mapped) return mapped;

    const candidates = [
      player?.companyBaseIncome,
      player?.baseIncome,
      player?.industryBaseIncome,
      player?.industryEffect?.baseIncome,
      player?.industry?.baseIncome,
      player?.initialSelection?.industryBaseIncome,
      player?.initialSelection?.industryEffect?.baseIncome,
      player?.initialSelection?.industry?.baseIncome,
    ];
    return candidates.find((candidate) => candidate && typeof candidate === "object") || {};
  }

  function getIncomeIncreaseValue(player, incomeKey, context = {}, helpers = {}) {
    const total = normalizeIncomeFormulaValue(player?.income?.[incomeKey]);
    const companyBaseIncome = getPlayerCompanyBaseIncome(player, context, helpers);
    const configuredBase = normalizeIncomeFormulaValue(companyBaseIncome?.[incomeKey]);
    const base = Math.min(total, configuredBase);
    return Math.max(0, total - base);
  }

  function getFormulaBaseValue(formulaId, player, context, helpers = {}) {
    const getType3Count = helpers.getType3CardCount
      || ((currentPlayer) => countType3Cards(currentPlayer, helpers.getCardTypeCode));

    switch (formulaId) {
      case "a1":
        return Math.max(
          getIncomeIncreaseValue(player, "credits", context, helpers),
          getIncomeIncreaseValue(player, "energy", context, helpers),
        );
      case "a2":
        return Math.min(
          getIncomeIncreaseValue(player, "credits", context, helpers),
          getIncomeIncreaseValue(player, "energy", context, helpers),
          getIncomeIncreaseValue(player, "handSize", context, helpers),
        );
      case "b1":
        return Math.min(
          countTraceMarkers(player, context.alienGameState, "yellow"),
          countTraceMarkers(player, context.alienGameState, "pink"),
          countTraceMarkers(player, context.alienGameState, "blue"),
        );
      case "b2":
        return Math.min(
          countOrbitOrLandMarkers(player, context.planetStatsState, context),
          countSectorWins(player, context.nebulaDataState),
        );
      case "c1":
        return Math.max(0, Math.round(Number(player?.completedTaskCount) || 0));
      case "c2":
        return Math.floor((
          Math.max(0, Math.round(Number(player?.completedTaskCount) || 0))
          + getType3Count(player)
        ) / 2);
      case "d1":
        return Math.min(
          countOwnedTech(player, "orange"),
          countOwnedTech(player, "purple"),
          countOwnedTech(player, "blue"),
        );
      case "d2":
        return Math.floor(countTotalOwnedTech(player) / 2);
      default:
        return 0;
    }
  }

  function getCardId(card) {
    return card?.cardId || card?.image || card?.id || null;
  }

  function isChongEcosystemStudyCard(card) {
    return Boolean(
      card?.chongCard
      && (Number(card.alienCardId) === 2 || getCardId(card) === "chong_2.webp")
    );
  }

  function isAmibaFinalTraceCard(card) {
    if (!card?.amibaCard && card?.set !== "alien:阿米巴" && !String(card?.cardId || "").startsWith("amiba_")) {
      return null;
    }
    const amibaModule = getAmibaModule();
    if (!amibaModule?.getFinalTraceTypeForCard) return null;
    return amibaModule.getFinalTraceTypeForCard(card);
  }

  function getRunezuFinalRule(card) {
    if (!card?.runezuCard && card?.set !== "alien:符文族" && !String(card?.cardId || "").startsWith("runezu_")) {
      return null;
    }
    const runezuModule = getRunezuModule();
    if (!runezuModule?.getFinalCardRule) return null;
    return runezuModule.getFinalCardRule(card);
  }

  function resolveCardEndGameRule(card, cardEffects) {
    const cardId = getCardId(card);
    if (!cardId) return null;
    if (isChongEcosystemStudyCard(card)) {
      return { kind: "chongTraceCount", scorePer: 1 };
    }
    const amibaTraceType = isAmibaFinalTraceCard(card);
    if (amibaTraceType) {
      return { kind: "amibaTraceCount", traceType: amibaTraceType, scorePer: 2 };
    }
    const runezuRule = getRunezuFinalRule(card);
    if (runezuRule) return { kind: runezuRule.type, multiplier: Number(runezuRule.multiplier) || 1 };
    const model = cardEffects?.getCardModel?.(card);
    if (model?.endGameScoring) return model.endGameScoring;
    const deferred = cardEffects?.getDeferredCardModel?.(card);
    if (deferred?.endGameScoring) return deferred.endGameScoring;
    return CARD_END_GAME_RULES[cardId] || null;
  }

  function scoreCardEndGameRule(rule, player, context) {
    if (!rule) return 0;
    const scorePer = Number(rule.scorePer) || 0;

    switch (rule.kind) {
      case "sectorWinsByColor":
        if (!scorePer) return 0;
        return scorePer * countSectorWinsByColor(player, context.nebulaDataState, rule.color);
      case "traceCount":
        if (!scorePer) return 0;
        return scorePer * countTraceMarkers(player, context.alienGameState, rule.traceType);
      case "techCount":
        if (!scorePer) return 0;
        return scorePer * countOwnedTech(player, rule.techType);
      case "distinctSignalSectors":
        if (!scorePer) return 0;
        return scorePer * countDistinctSignalSectors(player, context.nebulaDataState);
      case "planetOrbitOrLand":
        if (!scorePer) return 0;
        return scorePer * countPlanetOrbitOrLand(player, context.planetStatsState, rule.planetId, context);
      case "remainingResource":
        if (!scorePer) return 0;
        return scorePer * Math.max(0, Math.round(Number(player?.resources?.[rule.resource]) || 0));
      case "planetLandingPairs":
        if (!scorePer) return 0;
        return scorePer * countPlanetLandingPairs(player, context.planetStatsState, rule.count, context);
      case "allOrbitOrLand":
        if (!scorePer) return 0;
        return scorePer * countOrbitOrLandMarkers(player, context.planetStatsState, context);
      case "probeLocation":
        return playerHasProbeLocation(player, context, rule.locationType) ? Number(rule.score) || 0 : 0;
      case "unmarkedFinalRightmost":
        return scoreUnmarkedFinalRightmost(player, context);
      case "chongTraceCount": {
        if (!scorePer) return 0;
        const chongModule = getChongModule();
        if (!chongModule || !context.alienGameState) return 0;
        return scorePer * chongModule.countTraceMarkers(context.alienGameState, player, null);
      }
      case "amibaTraceCount": {
        if (!scorePer) return 0;
        const amibaModule = getAmibaModule();
        if (!amibaModule || !context.alienGameState) return 0;
        return scorePer * amibaModule.countTraceMarkers(context.alienGameState, player, rule.traceType);
      }
      case "aomomoTraceCount": {
        if (!scorePer) return 0;
        const aomomoModule = getAomomoModule();
        if (!aomomoModule || !context.alienGameState) return 0;
        return scorePer * aomomoModule.countTraceMarkers(context.alienGameState, player, null);
      }
      case "runezuMaxSameSymbolCount": {
        const runezuModule = getRunezuModule();
        if (!runezuModule) return 0;
        return (Number(rule.multiplier) || 1) * runezuModule.getMaxSameSymbolCount(player);
      }
      case "runezuMaxSetSize": {
        const runezuModule = getRunezuModule();
        if (!runezuModule) return 0;
        return (Number(rule.multiplier) || 1) * runezuModule.getMaxSetSize(player);
      }
      default:
        return 0;
    }
  }

  function computePlayerTileScore(finalScoringState, player, context = {}) {
    if (!finalScoring) {
      return { total: 0, tiles: [] };
    }

    finalScoring.ensureFinalScoringState(finalScoringState);
    const playerId = getPlayerId(player);
    const tiles = [];
    let total = 0;

    for (const tile of Object.values(finalScoringState.tiles || {})) {
      const mark = (tile.marks || []).find((entry) => entry.playerId === playerId);
      if (!mark) continue;

      const variant = finalScoring.getTileVariant(finalScoringState, tile.id);
      const formulaId = getFormulaId(tile.id, variant);
      const baseValue = getFormulaBaseValue(formulaId, player, context, {
        getCardTypeCode: context.getCardTypeCode,
      });
      const multiplier = getSlotMultiplier(formulaId, mark.slotIndex);
      const score = baseValue * multiplier;
      total += score;
      tiles.push({
        tileId: tile.id,
        variant,
        formulaId,
        slotIndex: mark.slotIndex,
        baseValue,
        multiplier,
        score,
      });
    }

    return { total, tiles };
  }

  function computePlayerCardScore(player, context = {}) {
    const cards = [];
    let total = 0;
    const cardEffects = context.cardEffects;

    for (const card of player?.reservedCards || []) {
      const typeCode = context.getCardTypeCode
        ? context.getCardTypeCode(card)
        : Number(card?.cardTypeCode);
      if (Math.round(Number(typeCode)) !== 3) continue;

      const rule = resolveCardEndGameRule(card, cardEffects);
      const score = scoreCardEndGameRule(rule, player, context);
      total += score;
      cards.push({
        cardId: getCardId(card),
        rule,
        score,
      });
    }

    return { total, cards };
  }

  function computePlayerJiuzheScore(player, context = {}) {
    const jiuzheModule = getJiuzheModule();
    if (!jiuzheModule || !context.alienGameState) return { total: 0, cards: [] };
    return jiuzheModule.scorePlayedCards(context.alienGameState, player, context);
  }

  function computePlayerRunezuSymbolScore(player, context = {}) {
    const runezuModule = getRunezuModule();
    if (!runezuModule || !context.alienGameState?.runezu?.revealInitialized) return 0;
    return runezuModule.scorePlayerSymbols(player);
  }

  function shouldApplyJiuzheThreatPenalty(player, context = {}) {
    const jiuzheModule = getJiuzheModule();
    if (!jiuzheModule || !context.alienGameState) return false;
    const allPlayers = context.players || context.playerState?.players || [player];
    return jiuzheModule.shouldApplyThreatPenalty(context.alienGameState, player, allPlayers);
  }

  function computePlayerFinalScore(context = {}, player = context.currentPlayer) {
    const baseScore = getBaseScore(player);
    const tileResult = computePlayerTileScore(context.finalScoringState, player, context);
    const cardResult = computePlayerCardScore(player, context);
    const jiuzheResult = computePlayerJiuzheScore(player, context);
    const runezuSymbolScore = computePlayerRunezuSymbolScore(player, context);
    const tileScore = tileResult.total;
    const cardScore = cardResult.total;
    const jiuzheCardScore = jiuzheResult.total;
    const prePenaltyTotalScore = baseScore + tileScore + cardScore + jiuzheCardScore + runezuSymbolScore;
    const jiuzheModule = getJiuzheModule();
    const jiuzheThreat = jiuzheModule?.getThreat?.(context.alienGameState, player) || 0;
    const jiuzhePenaltyApplied = shouldApplyJiuzheThreatPenalty(player, context);
    const totalScore = jiuzhePenaltyApplied
      ? Math.ceil(prePenaltyTotalScore * 0.9)
      : prePenaltyTotalScore;
    const tileScoresById = { a: 0, b: 0, c: 0, d: 0 };
    for (const tile of tileResult.tiles) {
      tileScoresById[tile.tileId] = (tileScoresById[tile.tileId] || 0) + (Number(tile.score) || 0);
    }
    const jiuzhePenaltyScore = totalScore - prePenaltyTotalScore;

    return {
      playerId: getPlayerId(player),
      baseScore,
      tileScore,
      cardScore,
      jiuzheCardScore,
      runezuSymbolScore,
      jiuzheThreat,
      jiuzhePenaltyApplied,
      jiuzhePenaltyScore,
      prePenaltyTotalScore,
      totalScore,
      tileScoresById,
      tiles: tileResult.tiles,
      cards: cardResult.cards,
      jiuzheCards: jiuzheResult.cards,
    };
  }

  return Object.freeze({
    NEBULA_IDS_BY_COLOR,
    FORMULA_MULTIPLIERS,
    CARD_END_GAME_RULES,
    getPlayerKeys,
    countSectorWinsByColor,
    countSectorWins,
    countTraceMarkers,
    countOwnedTech,
    countTotalOwnedTech,
    countPlanetOrbitOrLand,
    countOrbitOrLandMarkers,
    countPlanetLandingPairs,
    countDistinctSignalSectors,
    countType3Cards,
    getFormulaId,
    getSlotMultiplier,
    getPlayerCompanyBaseIncome,
    getIncomeIncreaseValue,
    getFormulaBaseValue,
    resolveCardEndGameRule,
    scoreCardEndGameRule,
    computePlayerTileScore,
    computePlayerCardScore,
    computePlayerJiuzheScore,
    computePlayerRunezuSymbolScore,
    shouldApplyJiuzheThreatPenalty,
    computePlayerFinalScore,
  });
});
