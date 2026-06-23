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

  root.SetiAlienAomomo = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function (placement) {
  "use strict";

  const ALIEN_ID = "奥陌陌";
  const PLANET_ID = "aomomo";
  const NEBULA_ID = "aomomo";
  const CARD_BACK_SRC = "../assets/aliens/奥陌陌/cards/back.png";
  const CARD_BASE_PATH = "../assets/aliens/奥陌陌/cards";
  const FOSSIL_SRC = "../assets/aliens/奥陌陌/fossil.webp";
  const WHEEL3_AMM_SRC = "../assets/aliens/奥陌陌/wheel3_amm.png";
  const TRACE_TYPES = Object.freeze(["pink", "yellow", "blue"]);
  const TRACE_POSITIONS = Object.freeze([1, 2, 3, 4, 5]);
  const TRACE_POSITION_COUNT = 5;
  const ORBIT_CAPACITY = 1;
  const LANDING_CAPACITY = 3;

  const EFFECT_GAIN_FOSSILS = "aomomo_gain_fossils";
  const EFFECT_SCAN_AOMOMO_X = "aomomo_scan_x";
  const EFFECT_SCAN_AOMOMO_X_GAIN_FOSSIL = "aomomo_scan_x_gain_fossil";
  const EFFECT_SCAN_AOMOMO_X_SCORE = "aomomo_scan_x_score";
  const EFFECT_LAND_SCORE_IF_AOMOMO = "aomomo_land_score";
  const EFFECT_FOSSIL_FOR_DATA = "aomomo_fossil_for_data";
  const EFFECT_FOSSIL_FOR_MOVE_AND_LAND = "aomomo_fossil_move_land";
  const EFFECT_FOSSIL_FOR_ANY_SCAN = "aomomo_fossil_any_scan";
  const EFFECT_SPEND_FOSSILS_GAIN_SCORE = "aomomo_spend_fossils_gain_score";

  const CARD_DEFINITIONS = Object.freeze([
    Object.freeze({ index: 0, cardId: "aomomo_0.webp", asset: "0.webp", cardName: "奥陌陌 0", price: 1, cardTypeCode: 2, discardActionCode: 3, scanActionCode: 1, incomeCode: 0 }),
    Object.freeze({ index: 1, cardId: "aomomo_1.webp", asset: "1.webp", cardName: "奥陌陌 1", price: 1, cardTypeCode: 1, discardActionCode: 4, scanActionCode: 0, incomeCode: 0 }),
    Object.freeze({ index: 2, cardId: "aomomo_2.webp", asset: "2.webp", cardName: "奥陌陌 2", price: 1, cardTypeCode: 2, discardActionCode: 3, scanActionCode: 1, incomeCode: 0 }),
    Object.freeze({ index: 3, cardId: "aomomo_3.webp", asset: "3.webp", cardName: "奥陌陌 3", price: 1, cardTypeCode: 2, discardActionCode: 5, scanActionCode: 0, incomeCode: 0 }),
    Object.freeze({ index: 4, cardId: "aomomo_4.webp", asset: "4.webp", cardName: "奥陌陌 4", price: 1, cardTypeCode: 0, discardActionCode: 3, scanActionCode: 0, incomeCode: 0 }),
    Object.freeze({ index: 5, cardId: "aomomo_5.webp", asset: "5.webp", cardName: "奥陌陌 5", price: 1, cardTypeCode: 0, discardActionCode: 3, scanActionCode: 0, incomeCode: 0 }),
    Object.freeze({ index: 6, cardId: "aomomo_6.webp", asset: "6.webp", cardName: "奥陌陌 6", price: 1, cardTypeCode: 0, discardActionCode: 3, scanActionCode: 0, incomeCode: 0 }),
    Object.freeze({ index: 7, cardId: "aomomo_7.webp", asset: "7.webp", cardName: "奥陌陌 7", price: 1, cardTypeCode: 0, discardActionCode: 5, scanActionCode: 0, incomeCode: 0 }),
    Object.freeze({ index: 8, cardId: "aomomo_8.webp", asset: "8.webp", cardName: "奥陌陌 8", price: 2, cardTypeCode: 3, discardActionCode: 3, scanActionCode: 1, incomeCode: 0 }),
    Object.freeze({ index: 9, cardId: "aomomo_9.webp", asset: "9.webp", cardName: "奥陌陌 9", price: 1, cardTypeCode: 2, discardActionCode: 3, scanActionCode: 1, incomeCode: 0 }),
  ]);

  const CARD_BY_INDEX = Object.freeze(Object.fromEntries(CARD_DEFINITIONS.map((card) => [card.index, card])));
  const CARD_BY_ID = Object.freeze(Object.fromEntries(CARD_DEFINITIONS.map((card) => [card.cardId, card])));

  const TRACE_REWARDS = Object.freeze(Object.fromEntries(TRACE_TYPES.map((traceType) => [
    traceType,
    Object.freeze({
      1: Object.freeze({ payFossils: 1, gain: Object.freeze({ score: 6 }), pickAlienCard: false }),
      2: Object.freeze({ payFossils: 0, gain: Object.freeze({ score: 2, aomomoFossils: 1 }), pickAlienCard: false }),
      3: Object.freeze({ payFossils: 0, gain: Object.freeze({ score: 3 }), pickAlienCard: true }),
      4: Object.freeze({ payFossils: 0, gain: Object.freeze({ score: 3, aomomoFossils: 1 }), pickAlienCard: true }),
      5: Object.freeze({ payFossils: 4, gain: Object.freeze({ score: 25 }), pickAlienCard: false }),
    }),
  ])));

  function effect(id, type, label, icon, options = {}) {
    return { id, type, label, icon, options: { ...options }, status: "pending" };
  }

  function gainFossilEffect(id, label, count = 1) {
    return effect(id, EFFECT_GAIN_FOSSILS, label, "aomomoFossil", { count });
  }

  function createTraceGrid() {
    const grid = {};
    for (const traceType of TRACE_TYPES) {
      grid[traceType] = {};
      for (const position of TRACE_POSITIONS) {
        grid[traceType][position] = position === 1 ? [] : null;
      }
    }
    return grid;
  }

  function createAomomoState() {
    return {
      revealedSlotId: null,
      revealedByPlayerId: null,
      revealedByPlayerColor: null,
      traceSlotsByAlienSlotId: {},
      nextTraceSequence: 1,
      displayedCardIndex: null,
      cardDeck: CARD_DEFINITIONS.map((card) => card.index),
      nextCardSequence: 1,
      orbitMarkers: [],
      landingMarkers: [],
      nextOrbitSequence: 1,
      nextLandingSequence: 1,
      revealInitialized: false,
    };
  }

  function ensureAomomoState(alienState) {
    if (!alienState.aomomo || typeof alienState.aomomo !== "object") {
      alienState.aomomo = createAomomoState();
    }
    const aomomo = alienState.aomomo;
    if (!aomomo.traceSlotsByAlienSlotId) aomomo.traceSlotsByAlienSlotId = {};
    if (!Array.isArray(aomomo.cardDeck)) aomomo.cardDeck = CARD_DEFINITIONS.map((card) => card.index);
    if (!Array.isArray(aomomo.orbitMarkers)) aomomo.orbitMarkers = [];
    if (!Array.isArray(aomomo.landingMarkers)) aomomo.landingMarkers = [];
    if (!Number.isFinite(Number(aomomo.nextTraceSequence))) aomomo.nextTraceSequence = 1;
    if (!Number.isFinite(Number(aomomo.nextCardSequence))) aomomo.nextCardSequence = 1;
    if (!Number.isFinite(Number(aomomo.nextOrbitSequence))) aomomo.nextOrbitSequence = 1;
    if (!Number.isFinite(Number(aomomo.nextLandingSequence))) aomomo.nextLandingSequence = 1;
    if (typeof aomomo.revealInitialized !== "boolean") aomomo.revealInitialized = false;
    return aomomo;
  }

  function ensureTraceGrid(alienState, alienSlotId) {
    const aomomo = ensureAomomoState(alienState);
    const key = String(alienSlotId);
    if (!aomomo.traceSlotsByAlienSlotId[key]) {
      aomomo.traceSlotsByAlienSlotId[key] = createTraceGrid();
    }
    return aomomo.traceSlotsByAlienSlotId[key];
  }

  function getTraceGrid(alienState, alienSlotId) {
    return alienState?.aomomo?.traceSlotsByAlienSlotId?.[String(alienSlotId)] || null;
  }

  function getPlayerKey(player) {
    return player?.id || player?.playerId || player?.color || player?.playerColor || null;
  }

  function getPlayerColor(player) {
    return player?.color || player?.playerColor || null;
  }

  function getPlayerKeys(player) {
    return new Set([player?.id, player?.playerId, player?.color, player?.playerColor].filter(Boolean));
  }

  function markerBelongsToPlayer(marker, playerKeys) {
    return playerKeys.has(marker?.playerId) || playerKeys.has(marker?.playerColor) || playerKeys.has(marker?.color);
  }

  function isAomomoAlienSlot(alienState, alienSlotId) {
    const slot = alienState?.aliens?.[alienSlotId];
    return slot?.alienId === ALIEN_ID || slot?.assignedAlienId === ALIEN_ID;
  }

  function isAomomoRevealedSlot(alienState, alienSlotId) {
    const slot = alienState?.aliens?.[alienSlotId];
    return Boolean(slot?.revealed && slot.alienId === ALIEN_ID);
  }

  function normalizePosition(position) {
    const value = Math.round(Number(position));
    return TRACE_POSITIONS.includes(value) ? value : null;
  }

  function validateTraceTarget(traceType, position) {
    const normalizedPosition = normalizePosition(position);
    if (!TRACE_TYPES.includes(traceType)) {
      return { ok: false, message: `奥陌陌不支持的痕迹颜色 ${traceType}` };
    }
    if (!normalizedPosition) {
      return { ok: false, message: `奥陌陌不支持的痕迹位置 ${position}` };
    }
    return { ok: true, position: normalizedPosition };
  }

  function createTraceEntry(alienState, player, traceType, position, options = {}) {
    const aomomo = ensureAomomoState(alienState);
    const sequence = options.sequence || aomomo.nextTraceSequence;
    aomomo.nextTraceSequence = Math.max(aomomo.nextTraceSequence, sequence + 1);
    return {
      traceType,
      position,
      sequence,
      playerId: player?.id || player?.playerId || null,
      playerColor: getPlayerColor(player),
      playerLabel: player?.colorLabel || player?.name || player?.playerLabel || null,
      debugOnly: Boolean(options.debugOnly),
      rewardApplied: Boolean(options.rewardApplied),
      placedAt: options.placedAt || Date.now(),
    };
  }

  function cloneReward(reward) {
    if (!reward) return null;
    return {
      payFossils: Math.max(0, Math.round(Number(reward.payFossils) || 0)),
      gain: { ...(reward.gain || {}) },
      pickAlienCard: Boolean(reward.pickAlienCard),
    };
  }

  function getTraceReward(traceType, position) {
    return cloneReward(TRACE_REWARDS[traceType]?.[position]);
  }

  function canPlaceAomomoTrace(alienState, alienSlotId, traceType, position, player, options = {}) {
    if (!isAomomoRevealedSlot(alienState, alienSlotId) && !options.debugOnly) {
      return { ok: false, message: "奥陌陌尚未揭示，不能放置奥陌陌痕迹" };
    }
    const validation = validateTraceTarget(traceType, position);
    if (!validation.ok) return validation;
    const grid = ensureTraceGrid(alienState, alienSlotId);
    const normalizedPosition = validation.position;
    if (normalizedPosition !== 1 && grid[traceType][normalizedPosition]) {
      return {
        ok: false,
        message: `${placement.getTraceTypeLabel(traceType)} ${normalizedPosition} 号位已经有痕迹`,
      };
    }
    const reward = getTraceReward(traceType, normalizedPosition);
    if (!options.debugOnly && reward?.payFossils && getFossils(player) < reward.payFossils) {
      return {
        ok: false,
        message: `化石不足：需要 ${reward.payFossils} 化石`,
      };
    }
    return { ok: true, reward };
  }

  function placeAomomoTrace(alienState, alienSlotId, traceType, position, player, options = {}) {
    if (!isAomomoRevealedSlot(alienState, alienSlotId) && !options.debugOnly) {
      return { ok: false, message: "奥陌陌尚未揭示，不能放置奥陌陌痕迹" };
    }

    const validation = validateTraceTarget(traceType, position);
    if (!validation.ok) return validation;

    const grid = ensureTraceGrid(alienState, alienSlotId);
    const normalizedPosition = validation.position;
    if (normalizedPosition !== 1 && grid[traceType][normalizedPosition]) {
      return {
        ok: false,
        message: `${placement.getTraceTypeLabel(traceType)} ${normalizedPosition} 号位已经有痕迹`,
      };
    }

    const reward = options.debugOnly ? null : getTraceReward(traceType, normalizedPosition);
    const entry = createTraceEntry(alienState, player, traceType, normalizedPosition, {
      debugOnly: options.debugOnly,
      rewardApplied: Boolean(!options.debugOnly && reward),
      placedAt: options.placedAt,
      sequence: options.sequence,
    });

    if (normalizedPosition === 1) {
      grid[traceType][1].push(entry);
    } else {
      grid[traceType][normalizedPosition] = entry;
    }

    return {
      ok: true,
      entry,
      reward,
      traceType,
      position: normalizedPosition,
      message: `奥陌陌：放置${placement.getTraceTypeLabel(traceType)} ${normalizedPosition} 号位`,
    };
  }

  function getTraceEntries(grid, traceType, position) {
    const value = grid?.[traceType]?.[position];
    if (Number(position) === 1) return Array.isArray(value) ? value : [];
    return value ? [value] : [];
  }

  function listTraceEntries(alienState, alienSlotId = alienState?.aomomo?.revealedSlotId, traceType = null) {
    const grid = getTraceGrid(alienState, alienSlotId);
    const entries = [];
    const types = traceType ? [traceType] : TRACE_TYPES;
    for (const type of types) {
      for (const position of TRACE_POSITIONS) {
        entries.push(...getTraceEntries(grid, type, position));
      }
    }
    return entries;
  }

  function countTraceMarkers(alienState, player, alienSlotId = alienState?.aomomo?.revealedSlotId) {
    const playerKeys = getPlayerKeys(player);
    return listTraceEntries(alienState, alienSlotId)
      .filter((entry) => markerBelongsToPlayer(entry, playerKeys))
      .length;
  }

  function countTraceMarkersByType(alienState, player, traceType, alienSlotId = alienState?.aomomo?.revealedSlotId) {
    const playerKeys = getPlayerKeys(player);
    return listTraceEntries(alienState, alienSlotId, traceType)
      .filter((entry) => markerBelongsToPlayer(entry, playerKeys))
      .length;
  }

  function playerHasAllTraceTypes(alienState, player, alienSlotId = alienState?.aomomo?.revealedSlotId) {
    return TRACE_TYPES.every((traceType) => countTraceMarkersByType(alienState, player, traceType, alienSlotId) > 0);
  }

  function playerHasFossilSpendingTrace(alienState, player, alienSlotId = alienState?.aomomo?.revealedSlotId) {
    const playerKeys = getPlayerKeys(player);
    return listTraceEntries(alienState, alienSlotId).some((entry) => (
      markerBelongsToPlayer(entry, playerKeys)
      && (Number(entry.position) === 1 || Number(entry.position) === 5)
    ));
  }

  function getFossils(player) {
    return Math.max(0, Math.round(Number(player?.resources?.aomomoFossils) || 0));
  }

  function canSpendFossils(player, count = 1) {
    return getFossils(player) >= Math.max(0, Math.round(Number(count) || 0));
  }

  function gainFossils(player, count = 1) {
    if (!player) return 0;
    if (!player.resources) player.resources = {};
    const normalized = Math.max(0, Math.round(Number(count) || 0));
    player.resources.aomomoFossils = getFossils(player) + normalized;
    return player.resources.aomomoFossils;
  }

  function spendFossils(player, count = 1) {
    const normalized = Math.max(0, Math.round(Number(count) || 0));
    if (!canSpendFossils(player, normalized)) {
      return { ok: false, message: `化石不足，需要 ${normalized} 化石` };
    }
    player.resources.aomomoFossils = getFossils(player) - normalized;
    return { ok: true, remaining: player.resources.aomomoFossils };
  }

  function createPanelMarker(alienState, player, kind, options = {}) {
    const aomomo = ensureAomomoState(alienState);
    const sequenceKey = kind === "orbit" ? "nextOrbitSequence" : "nextLandingSequence";
    const sequence = options.sequence || aomomo[sequenceKey];
    aomomo[sequenceKey] = Math.max(aomomo[sequenceKey], sequence + 1);
    return {
      id: options.id || `aomomo-${kind}-${sequence}`,
      kind,
      sequence,
      playerId: player?.id || player?.playerId || null,
      playerColor: getPlayerColor(player),
      playerLabel: player?.colorLabel || player?.name || player?.playerLabel || null,
      debugOnly: Boolean(options.debugOnly),
      placedAt: options.placedAt || Date.now(),
    };
  }

  function canAddOrbitMarker(alienState) {
    return (ensureAomomoState(alienState).orbitMarkers || []).length < ORBIT_CAPACITY;
  }

  function addOrbitMarker(alienState, player, options = {}) {
    const aomomo = ensureAomomoState(alienState);
    if (!canAddOrbitMarker(alienState) && !options.debugOnly) {
      return { ok: false, message: "奥陌陌环绕槽已满" };
    }
    const marker = createPanelMarker(alienState, player, "orbit", options);
    aomomo.orbitMarkers.push(marker);
    return { ok: true, marker, message: "奥陌陌：放置环绕标记" };
  }

  function canAddLandingMarker(alienState) {
    return (ensureAomomoState(alienState).landingMarkers || []).length < LANDING_CAPACITY;
  }

  function addLandingMarker(alienState, player, options = {}) {
    const aomomo = ensureAomomoState(alienState);
    if (!canAddLandingMarker(alienState) && !options.debugOnly) {
      return { ok: false, message: "奥陌陌登陆槽已满" };
    }
    const marker = createPanelMarker(alienState, player, "landing", options);
    aomomo.landingMarkers.push(marker);
    return { ok: true, marker, message: "奥陌陌：放置登陆标记" };
  }

  function listOrbitMarkers(alienState) {
    return [...(ensureAomomoState(alienState).orbitMarkers || [])];
  }

  function listLandingMarkers(alienState) {
    return [...(ensureAomomoState(alienState).landingMarkers || [])];
  }

  function countOrbitMarkers(alienState, player = null) {
    const markers = listOrbitMarkers(alienState);
    if (!player) return markers.length;
    const playerKeys = getPlayerKeys(player);
    return markers.filter((marker) => markerBelongsToPlayer(marker, playerKeys)).length;
  }

  function countLandingMarkers(alienState, player = null) {
    const markers = listLandingMarkers(alienState);
    if (!player) return markers.length;
    const playerKeys = getPlayerKeys(player);
    return markers.filter((marker) => markerBelongsToPlayer(marker, playerKeys)).length;
  }

  function shuffle(items, random = Math.random) {
    const result = [...items];
    for (let index = result.length - 1; index > 0; index -= 1) {
      const pickIndex = Math.floor(random() * (index + 1));
      [result[index], result[pickIndex]] = [result[pickIndex], result[index]];
    }
    return result;
  }

  function getCardSrc(index) {
    return `${CARD_BASE_PATH}/${Math.round(Number(index))}.webp`;
  }

  function getCardDefinition(cardOrIndex) {
    if (cardOrIndex == null) return null;
    if (typeof cardOrIndex === "number") return CARD_BY_INDEX[Math.round(cardOrIndex)] || null;
    const cardId = typeof cardOrIndex === "string" ? cardOrIndex : cardOrIndex?.cardId || cardOrIndex?.id || "";
    const byId = CARD_BY_ID[cardId] || CARD_DEFINITIONS.find((card) => card.cardId === cardId || card.asset === cardId) || null;
    if (byId) return byId;
    if (isAomomoCard(cardOrIndex) && Number.isFinite(Number(cardOrIndex?.alienCardId))) {
      return CARD_BY_INDEX[Math.round(Number(cardOrIndex.alienCardId))] || null;
    }
    return null;
  }

  function createAlienCard(index, sequence = 0) {
    const definition = CARD_BY_INDEX[Math.round(Number(index))];
    if (!definition) return null;
    return {
      id: `alien-aomomo-${definition.index}-${sequence}`,
      cardId: definition.cardId,
      alienCardId: definition.index,
      set: "alien:奥陌陌",
      cardName: definition.cardName,
      src: getCardSrc(definition.index),
      faceUp: true,
      price: definition.price,
      cardTypeCode: definition.cardTypeCode,
      discardActionCode: definition.discardActionCode,
      scanActionCode: definition.scanActionCode,
      incomeCode: definition.incomeCode,
      aomomoCard: true,
    };
  }

  function drawDisplayedCardIndex(alienState, random = Math.random) {
    const aomomo = ensureAomomoState(alienState);
    if (!aomomo.cardDeck.length) aomomo.cardDeck = shuffle(CARD_DEFINITIONS.map((card) => card.index), random);
    const index = aomomo.cardDeck.shift();
    aomomo.displayedCardIndex = index;
    return index;
  }

  function takeDisplayedCard(alienState, random = Math.random) {
    const aomomo = ensureAomomoState(alienState);
    if (aomomo.displayedCardIndex == null) drawDisplayedCardIndex(alienState, random);
    const card = createAlienCard(aomomo.displayedCardIndex, aomomo.nextCardSequence);
    aomomo.nextCardSequence += 1;
    drawDisplayedCardIndex(alienState, random);
    return { ok: Boolean(card), card, message: card ? `获得奥陌陌牌：${card.cardName}` : "没有可获得的奥陌陌牌" };
  }

  function blindDrawCard(alienState, random = Math.random) {
    const aomomo = ensureAomomoState(alienState);
    if (!aomomo.cardDeck.length) aomomo.cardDeck = shuffle(CARD_DEFINITIONS.map((card) => card.index), random);
    const pickIndex = Math.floor(random() * aomomo.cardDeck.length);
    const [index] = aomomo.cardDeck.splice(pickIndex, 1);
    const card = createAlienCard(index, aomomo.nextCardSequence);
    aomomo.nextCardSequence += 1;
    if (aomomo.displayedCardIndex == null) drawDisplayedCardIndex(alienState, random);
    return { ok: Boolean(card), card, message: card ? `盲抽奥陌陌牌：${card.cardName}` : "没有可盲抽的奥陌陌牌" };
  }

  function initializeAomomoReveal(alienState, alienSlotId, triggerPlayer, random = Math.random) {
    const aomomo = ensureAomomoState(alienState);

    if (aomomo.revealInitialized) {
      return {
        ok: true,
        alreadyInitialized: true,
        displayedCardIndex: aomomo.displayedCardIndex,
        message: "奥陌陌已初始化",
      };
    }

    aomomo.revealedSlotId = Number(alienSlotId);
    aomomo.revealedByPlayerId = triggerPlayer?.id || null;
    aomomo.revealedByPlayerColor = getPlayerColor(triggerPlayer);
    aomomo.revealInitialized = true;
    delete aomomo.traceSlotsByAlienSlotId[String(alienSlotId)];
    ensureTraceGrid(alienState, alienSlotId);
    aomomo.cardDeck = shuffle(CARD_DEFINITIONS.map((card) => card.index), random);
    aomomo.displayedCardIndex = drawDisplayedCardIndex(alienState, random);
    aomomo.orbitMarkers = [];
    aomomo.landingMarkers = [];

    return {
      ok: true,
      displayedCardIndex: aomomo.displayedCardIndex,
      message: "奥陌陌已揭示：第3轮盘切换为奥陌陌板块",
    };
  }

  function isAomomoCard(card) {
    return Boolean(card?.aomomoCard || card?.set === "alien:奥陌陌" || String(card?.cardId || "").startsWith("aomomo_"));
  }

  function buildImmediateEffects(cardOrIndex) {
    const index = getCardDefinition(cardOrIndex)?.index;
    switch (index) {
      case 0:
        return [effect("aomomo-0-scan", EFFECT_SCAN_AOMOMO_X_GAIN_FOSSIL, "奥陌陌0：扫描奥陌陌所在扇区；若扫描奥陌陌得1化石", "scan", { gainData: true })];
      case 1:
        return [gainFossilEffect("aomomo-1-fossil", "奥陌陌1：1化石", 1)];
      case 2:
        return [effect("aomomo-2-scan", EFFECT_SCAN_AOMOMO_X, "奥陌陌2：扫描奥陌陌所在扇区", "scan", { gainData: true })];
      case 3:
        return [effect("aomomo-3-land", EFFECT_LAND_SCORE_IF_AOMOMO, "奥陌陌3：登陆；若登陆奥陌陌得3分", "land", { score: 3 })];
      case 4:
        return [
          effect("aomomo-4-blue-tech", "card_research_tech", "奥陌陌4：蓝色科技", "research_tech", { skipCost: true, techTypes: Object.freeze(["blue"]) }),
          effect("aomomo-4-fossil-data", EFFECT_FOSSIL_FOR_DATA, "奥陌陌4：可移除1化石得1数据", "aomomoFossil", { cost: 1, dataCount: 1, optional: true }),
        ];
      case 5:
        return [];
      case 6:
        return [effect("aomomo-6-move-land", EFFECT_FOSSIL_FOR_MOVE_AND_LAND, "奥陌陌6：可移除1化石移动2并登陆", "movement", { cost: 1, movement: 2 })];
      case 7:
        return [
          effect("aomomo-7-launch", "launch", "奥陌陌7：发射", "launch", { skipCost: true, cost: {}, source: "aomomo" }),
          gainFossilEffect("aomomo-7-fossil", "奥陌陌7：1化石", 1),
        ];
      case 8:
        return [
          effect("aomomo-8-yellow", "card_color_scan", "奥陌陌8：黄色扇区扫描", "yellow_scan", { color: "yellow", gainData: true }),
          effect("aomomo-8-red", "card_color_scan", "奥陌陌8：红色扇区扫描", "red_scan", { color: "red", gainData: true }),
          effect("aomomo-8-blue", "card_color_scan", "奥陌陌8：蓝色扇区扫描", "blue_scan", { color: "blue", gainData: true }),
          effect("aomomo-8-fossil-any-scan", EFFECT_FOSSIL_FOR_ANY_SCAN, "奥陌陌8：可移除1化石扫描任意扇区", "aomomoFossil", { cost: 1, gainData: true, optional: true }),
        ];
      case 9:
        return [effect("aomomo-9-scan", EFFECT_SCAN_AOMOMO_X_SCORE, "奥陌陌9：扫描奥陌陌所在扇区；奥陌陌数据+2分", "scan", { gainData: true, score: 2 })];
      default:
        return [];
    }
  }

  function formatTraceLabel(traceType, position, stackIndex = null) {
    const suffix = Number(position) === 1 && stackIndex != null ? `#${stackIndex + 1}` : "";
    return `${placement.getTraceTypeLabel(traceType)} ${position}号位${suffix}`;
  }

  return Object.freeze({
    ALIEN_ID,
    PLANET_ID,
    NEBULA_ID,
    CARD_BACK_SRC,
    CARD_BASE_PATH,
    FOSSIL_SRC,
    WHEEL3_AMM_SRC,
    TRACE_TYPES,
    TRACE_POSITIONS,
    TRACE_POSITION_COUNT,
    TRACE_REWARDS,
    ORBIT_CAPACITY,
    LANDING_CAPACITY,
    EFFECT_GAIN_FOSSILS,
    EFFECT_SCAN_AOMOMO_X,
    EFFECT_SCAN_AOMOMO_X_GAIN_FOSSIL,
    EFFECT_SCAN_AOMOMO_X_SCORE,
    EFFECT_LAND_SCORE_IF_AOMOMO,
    EFFECT_FOSSIL_FOR_DATA,
    EFFECT_FOSSIL_FOR_MOVE_AND_LAND,
    EFFECT_FOSSIL_FOR_ANY_SCAN,
    EFFECT_SPEND_FOSSILS_GAIN_SCORE,
    CARD_DEFINITIONS,
    CARD_BY_INDEX,
    CARD_BY_ID,
    createAomomoState,
    ensureAomomoState,
    ensureTraceGrid,
    getTraceGrid,
    isAomomoAlienSlot,
    isAomomoRevealedSlot,
    getTraceReward,
    canPlaceAomomoTrace,
    placeAomomoTrace,
    getTraceEntries,
    listTraceEntries,
    countTraceMarkers,
    countTraceMarkersByType,
    playerHasAllTraceTypes,
    playerHasFossilSpendingTrace,
    getFossils,
    canSpendFossils,
    gainFossils,
    spendFossils,
    canAddOrbitMarker,
    addOrbitMarker,
    canAddLandingMarker,
    addLandingMarker,
    listOrbitMarkers,
    listLandingMarkers,
    countOrbitMarkers,
    countLandingMarkers,
    initializeAomomoReveal,
    getCardSrc,
    getCardDefinition,
    createAlienCard,
    takeDisplayedCard,
    blindDrawCard,
    drawDisplayedCardIndex,
    isAomomoCard,
    buildImmediateEffects,
    markerBelongsToPlayer,
    getPlayerKeys,
    getPlayerKey,
    formatTraceLabel,
  });
});
