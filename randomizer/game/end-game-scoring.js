(function (root, factory) {
  "use strict";

  let finalScoringModule = root.SetiFinalScoring;
  let jiuzheModule = root.SetiAlienJiuzhe;
  let yichangdianModule = root.SetiAlienYichangdian;
  let chongModule = root.SetiAlienChong;
  let amibaModule = root.SetiAlienAmiba;
  let runezuModule = root.SetiAlienRunezu;
  if (typeof require === "function") {
    finalScoringModule = finalScoringModule || require("./final-scoring");
    jiuzheModule = jiuzheModule || require("./aliens/jiuzhe");
    yichangdianModule = yichangdianModule || require("./aliens/yichangdian");
    chongModule = chongModule || require("./aliens/chong");
    amibaModule = amibaModule || require("./aliens/amiba");
    runezuModule = runezuModule || require("./aliens/runezu");
  }

  const api = factory(finalScoringModule, jiuzheModule, yichangdianModule, chongModule, amibaModule, runezuModule);

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.SetiEndGameScoring = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function (finalScoring, jiuzhe, yichangdian, chong, amiba, runezu) {
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
    return new Set([player?.id, player?.color].filter(Boolean));
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

  function countTraceMarkers(player, alienGameState, traceType) {
    const playerKeys = getPlayerKeys(player);
    let count = 0;
    const jiuzheModule = getJiuzheModule();
    const jiuzheSlotId = alienGameState?.jiuzhe?.revealedSlotId;
    const yichangdianModule = getYichangdianModule();
    const yichangdianSlotId = alienGameState?.yichangdian?.revealedSlotId;
    const chongModule = getChongModule();
    const chongSlotId = alienGameState?.chong?.revealedSlotId;
    const amibaModule = getAmibaModule();
    const amibaSlotId = alienGameState?.amiba?.revealedSlotId;
    const runezuModule = getRunezuModule();
    const runezuSlotId = alienGameState?.runezu?.revealedSlotId;
    for (const [slotId, slot] of Object.entries(alienGameState?.aliens || {})) {
      if (jiuzheModule && jiuzheSlotId != null && Number(slotId) === Number(jiuzheSlotId)) {
        const grid = jiuzheModule.getTraceGrid(alienGameState, jiuzheSlotId);
        for (const position of jiuzheModule.TRACE_POSITIONS || []) {
          const entry = grid?.[traceType]?.[position];
          if (entry && markerBelongsToPlayer(entry, playerKeys)) count += 1;
        }
        continue;
      }
      if (yichangdianModule && yichangdianSlotId != null && Number(slotId) === Number(yichangdianSlotId)) {
        const entries = yichangdianModule.listTraceEntries(alienGameState, yichangdianSlotId, traceType);
        count += entries.filter((entry) => markerBelongsToPlayer(entry, playerKeys)).length;
        continue;
      }
      if (chongModule && chongSlotId != null && Number(slotId) === Number(chongSlotId)) {
        const entries = chongModule.listTraceEntries(alienGameState, chongSlotId, traceType);
        count += entries.filter((entry) => markerBelongsToPlayer(entry, playerKeys)).length;
        continue;
      }
      if (amibaModule && amibaSlotId != null && Number(slotId) === Number(amibaSlotId)) {
        const entries = amibaModule.listTraceEntries(alienGameState, amibaSlotId, traceType);
        count += entries.filter((entry) => markerBelongsToPlayer(entry, playerKeys)).length;
        continue;
      }
      if (runezuModule && runezuSlotId != null && Number(slotId) === Number(runezuSlotId)) {
        const entries = runezuModule.listTraceEntries(alienGameState, runezuSlotId, traceType);
        count += entries.filter((entry) => markerBelongsToPlayer(entry, playerKeys)).length;
        continue;
      }
      const traceSlot = slot?.traces?.[traceType];
      if (!traceSlot?.firstPlaced || !playerKeys.has(traceSlot.ownerPlayerColor)) continue;
      count += 1 + Math.max(0, Math.round(Number(traceSlot.extraCount) || 0));
    }
    return count;
  }

  function countOwnedTech(player, techType) {
    const ownedTiles = player?.techState?.ownedTiles || {};
    const disabledTiles = player?.techState?.disabledTiles || {};
    return Object.keys(ownedTiles)
      .filter((tileId) => ownedTiles[tileId]
        && !disabledTiles[tileId]
        && String(tileId).startsWith(techType))
      .length;
  }

  function countTotalOwnedTech(player) {
    const ownedTiles = player?.techState?.ownedTiles || {};
    const disabledTiles = player?.techState?.disabledTiles || {};
    return Object.keys(ownedTiles).filter((tileId) => ownedTiles[tileId] && !disabledTiles[tileId]).length;
  }

  function markerBelongsToPlayer(marker, playerKeys) {
    return playerKeys.has(marker?.playerId) || playerKeys.has(marker?.color) || playerKeys.has(marker?.playerColor);
  }

  function countPlanetOrbitOrLand(player, planetStatsState, planetId) {
    const record = planetStatsState?.planets?.[planetId];
    if (!record) return 0;
    const playerKeys = getPlayerKeys(player);
    const orbitCount = (record.orbitMarkers || []).filter((marker) => (
      markerBelongsToPlayer(marker, playerKeys)
    )).length;
    const landingCount = (record.landingMarkers || []).filter((marker) => (
      markerBelongsToPlayer(marker, playerKeys)
    )).length;
    const satelliteCount = (record.satelliteLandings || []).filter((marker) => (
      markerBelongsToPlayer(marker, playerKeys)
    )).length;
    return orbitCount + landingCount + satelliteCount;
  }

  function countOrbitOrLandMarkers(player, planetStatsState) {
    const planets = planetStatsState?.planets || {};
    return Object.keys(planets).reduce((total, planetId) => (
      total + countPlanetOrbitOrLand(player, planetStatsState, planetId)
    ), 0);
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

  function getFormulaBaseValue(formulaId, player, context, helpers = {}) {
    const income = player?.income || {};
    const getType3Count = helpers.getType3CardCount
      || ((currentPlayer) => countType3Cards(currentPlayer, helpers.getCardTypeCode));

    switch (formulaId) {
      case "a1":
        return Math.max(Number(income.credits) || 0, Number(income.energy) || 0);
      case "a2":
        return Math.min(
          Number(income.credits) || 0,
          Number(income.energy) || 0,
          Number(income.handSize) || 0,
        );
      case "b1":
        return Math.min(
          countTraceMarkers(player, context.alienGameState, "yellow"),
          countTraceMarkers(player, context.alienGameState, "pink"),
          countTraceMarkers(player, context.alienGameState, "blue"),
        );
      case "b2":
        return Math.min(
          countOrbitOrLandMarkers(player, context.planetStatsState),
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
        return scorePer * countPlanetOrbitOrLand(player, context.planetStatsState, rule.planetId);
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

    return {
      playerId: getPlayerId(player),
      baseScore,
      tileScore,
      cardScore,
      jiuzheCardScore,
      runezuSymbolScore,
      jiuzheThreat,
      jiuzhePenaltyApplied,
      prePenaltyTotalScore,
      totalScore,
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
    countDistinctSignalSectors,
    countType3Cards,
    getFormulaId,
    getSlotMultiplier,
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
