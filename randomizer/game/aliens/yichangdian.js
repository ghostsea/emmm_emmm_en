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

  root.SetiAlienYichangdian = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function (placement) {
  "use strict";

  const ALIEN_ID = "异常点";
  const CARD_BACK_SRC = "../assets/aliens/异常点/cards/back.png";
  const CARD_BASE_PATH = "../assets/aliens/异常点/cards";
  const TRACE_TYPES = Object.freeze(["pink", "yellow", "blue"]);
  const TRACE_POSITIONS = Object.freeze([1, 2, 3, 4, 5]);
  const TRACE_POSITION_COUNT = 5;

  const TRACE_REWARDS = Object.freeze({
    pink: Object.freeze({
      1: Object.freeze({ gain: Object.freeze({ score: 2 }), dataCount: 0, pickAlienCard: false }),
      2: Object.freeze({ gain: Object.freeze({ score: 3 }), dataCount: 0, pickAlienCard: false }),
      3: Object.freeze({ gain: Object.freeze({ score: 2, publicity: 1 }), dataCount: 0, pickAlienCard: false }),
      4: Object.freeze({ gain: Object.freeze({ score: 2 }), dataCount: 0, pickAlienCard: true }),
      5: Object.freeze({ gain: Object.freeze({ score: 4 }), dataCount: 0, pickAlienCard: true }),
    }),
    yellow: Object.freeze({
      1: Object.freeze({ gain: Object.freeze({ score: 2 }), dataCount: 0, pickAlienCard: false }),
      2: Object.freeze({ gain: Object.freeze({ score: 3 }), dataCount: 0, pickAlienCard: false }),
      3: Object.freeze({ gain: Object.freeze({ score: 2, publicity: 1 }), dataCount: 0, pickAlienCard: false }),
      4: Object.freeze({ gain: Object.freeze({ score: 2 }), dataCount: 0, pickAlienCard: true }),
      5: Object.freeze({ gain: Object.freeze({ score: 4 }), dataCount: 0, pickAlienCard: true }),
    }),
    blue: Object.freeze({
      1: Object.freeze({ gain: Object.freeze({ score: 2 }), dataCount: 0, pickAlienCard: false }),
      2: Object.freeze({ gain: Object.freeze({ score: 3 }), dataCount: 0, pickAlienCard: false }),
      3: Object.freeze({ gain: Object.freeze({ score: 2, publicity: 1 }), dataCount: 0, pickAlienCard: false }),
      4: Object.freeze({ gain: Object.freeze({ score: 2 }), dataCount: 0, pickAlienCard: true }),
      5: Object.freeze({ gain: Object.freeze({ score: 4 }), dataCount: 0, pickAlienCard: true }),
    }),
  });

  const ANOMALY_GROUPS = Object.freeze([
    Object.freeze({ prefix: "a", traceType: "pink", assetColor: "pink" }),
    Object.freeze({ prefix: "b", traceType: "yellow", assetColor: "yellow" }),
    Object.freeze({ prefix: "c", traceType: "blue", assetColor: "blue" }),
  ]);

  const ANOMALY_GROUP_BY_PREFIX = Object.freeze(
    Object.fromEntries(ANOMALY_GROUPS.map((entry) => [entry.prefix, entry])),
  );

  const ANOMALY_REWARDS = Object.freeze({
    a_1: Object.freeze({ traceType: "pink", gain: Object.freeze({ credits: 1 }), dataCount: 0, pickCard: false }),
    a_2: Object.freeze({ traceType: "pink", gain: Object.freeze({ score: 4 }), dataCount: 0, pickCard: false }),
    b_1: Object.freeze({ traceType: "yellow", gain: Object.freeze({ publicity: 2 }), dataCount: 0, pickCard: false }),
    b_2: Object.freeze({ traceType: "yellow", gain: Object.freeze({}), dataCount: 0, pickCard: true }),
    c_1: Object.freeze({ traceType: "blue", gain: Object.freeze({}), dataCount: 1, pickCard: false }),
    c_2: Object.freeze({ traceType: "blue", gain: Object.freeze({ energy: 1 }), dataCount: 0, pickCard: false }),
  });

  const CARD_DEFINITIONS = Object.freeze([
    Object.freeze({ index: 0, cardId: "yichangdian_0.webp", cardName: "不可思议", price: 1, cardTypeCode: 1, discardActionCode: 3, scanActionCode: 0, incomeCode: 1 }),
    Object.freeze({ index: 1, cardId: "yichangdian_1.webp", cardName: "我们被监视了?", price: 1, cardTypeCode: 2, discardActionCode: 5, scanActionCode: 0, incomeCode: 2 }),
    Object.freeze({ index: 2, cardId: "yichangdian_2.webp", cardName: "近距离观察", price: 1, cardTypeCode: 0, discardActionCode: 3, scanActionCode: 1, incomeCode: 0 }),
    Object.freeze({ index: 3, cardId: "yichangdian_3.webp", cardName: "吃瓜群众", price: 1, cardTypeCode: 1, discardActionCode: 4, scanActionCode: 0, incomeCode: 0 }),
    Object.freeze({ index: 4, cardId: "yichangdian_4.webp", cardName: "全网热搜", price: 1, cardTypeCode: 0, discardActionCode: 4, scanActionCode: 1, incomeCode: 0 }),
    Object.freeze({ index: 5, cardId: "yichangdian_5.webp", cardName: "仔细倾听", price: 2, cardTypeCode: 0, discardActionCode: 5, scanActionCode: 1, incomeCode: 2 }),
    Object.freeze({ index: 6, cardId: "yichangdian_6.webp", cardName: "信息胶囊", price: 2, cardTypeCode: 0, discardActionCode: 5, scanActionCode: 2, incomeCode: 0 }),
    Object.freeze({ index: 7, cardId: "yichangdian_7.webp", cardName: "新物理学", price: 1, cardTypeCode: 0, discardActionCode: 3, scanActionCode: 3, incomeCode: 1 }),
    Object.freeze({ index: 8, cardId: "yichangdian_8.webp", cardName: "生活常态", price: 1, cardTypeCode: 0, discardActionCode: 5, scanActionCode: 2, incomeCode: 1 }),
    Object.freeze({ index: 9, cardId: "yichangdian_9.webp", cardName: "生命迹象", price: 1, cardTypeCode: 0, discardActionCode: 3, scanActionCode: 2, incomeCode: 2 }),
  ]);

  const CARD_BY_INDEX = Object.freeze(Object.fromEntries(CARD_DEFINITIONS.map((card) => [card.index, card])));
  const CARD_BY_ID = Object.freeze(Object.fromEntries(CARD_DEFINITIONS.map((card) => [card.cardId, card])));

  function mod8(value) {
    return ((Number(value) % 8) + 8) % 8;
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

  function createYichangdianState() {
    return {
      revealedSlotId: null,
      revealedByPlayerId: null,
      revealedByPlayerColor: null,
      revealEarthX: null,
      traceSlotsByAlienSlotId: {},
      nextTraceSequence: 1,
      anomalies: [],
      nextAnomalySectorX: null,
      displayedCardIndex: null,
      cardDeck: CARD_DEFINITIONS.map((card) => card.index),
      nextCardSequence: 1,
      revealInitialized: false,
    };
  }

  function ensureYichangdianState(alienState) {
    if (!alienState.yichangdian || typeof alienState.yichangdian !== "object") {
      alienState.yichangdian = createYichangdianState();
    }
    const yichangdian = alienState.yichangdian;
    if (!yichangdian.traceSlotsByAlienSlotId) yichangdian.traceSlotsByAlienSlotId = {};
    if (!Array.isArray(yichangdian.anomalies)) yichangdian.anomalies = [];
    if (!Array.isArray(yichangdian.cardDeck)) yichangdian.cardDeck = CARD_DEFINITIONS.map((card) => card.index);
    if (!Number.isFinite(Number(yichangdian.nextTraceSequence))) yichangdian.nextTraceSequence = 1;
    if (!Number.isFinite(Number(yichangdian.nextCardSequence))) yichangdian.nextCardSequence = 1;
    if (typeof yichangdian.revealInitialized !== "boolean") yichangdian.revealInitialized = false;
    return yichangdian;
  }

  function ensureTraceGrid(alienState, alienSlotId) {
    const yichangdian = ensureYichangdianState(alienState);
    const key = String(alienSlotId);
    if (!yichangdian.traceSlotsByAlienSlotId[key]) {
      yichangdian.traceSlotsByAlienSlotId[key] = createTraceGrid();
    }
    return yichangdian.traceSlotsByAlienSlotId[key];
  }

  function getTraceGrid(alienState, alienSlotId) {
    return alienState?.yichangdian?.traceSlotsByAlienSlotId?.[String(alienSlotId)] || null;
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

  function isYichangdianAlienSlot(alienState, alienSlotId) {
    const slot = alienState?.aliens?.[alienSlotId];
    return slot?.alienId === ALIEN_ID || slot?.assignedAlienId === ALIEN_ID;
  }

  function isYichangdianRevealedSlot(alienState, alienSlotId) {
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
      return { ok: false, message: `异常点不支持的痕迹颜色 ${traceType}` };
    }
    if (!normalizedPosition) {
      return { ok: false, message: `异常点不支持的痕迹位置 ${position}` };
    }
    return { ok: true, position: normalizedPosition };
  }

  function createTraceEntry(alienState, player, traceType, position, options = {}) {
    const yichangdian = ensureYichangdianState(alienState);
    const sequence = options.sequence || yichangdian.nextTraceSequence;
    yichangdian.nextTraceSequence = Math.max(yichangdian.nextTraceSequence, sequence + 1);
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
      traceType: reward.traceType || null,
      gain: { ...(reward.gain || {}) },
      dataCount: reward.dataCount || 0,
      pickAlienCard: Boolean(reward.pickAlienCard),
      pickCard: Boolean(reward.pickCard),
    };
  }

  function getTraceReward(traceType, position) {
    return cloneReward(TRACE_REWARDS[traceType]?.[position]);
  }

  function placeYichangdianTrace(alienState, alienSlotId, traceType, position, player, options = {}) {
    if (!isYichangdianRevealedSlot(alienState, alienSlotId) && !options.debugOnly) {
      return { ok: false, message: "异常点尚未揭示，不能放置异常点痕迹" };
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
      message: `异常点：放置${placement.getTraceTypeLabel(traceType)} ${normalizedPosition} 号位`,
    };
  }

  function getTraceEntries(grid, traceType, position) {
    const value = grid?.[traceType]?.[position];
    if (position === 1) return Array.isArray(value) ? value : [];
    return value ? [value] : [];
  }

  function listTraceEntries(alienState, alienSlotId, traceType = null) {
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

  function getTopTraceEntry(alienState, alienSlotId, traceType) {
    const grid = getTraceGrid(alienState, alienSlotId);
    const firstStack = getTraceEntries(grid, traceType, 1);
    if (firstStack.length) return firstStack[firstStack.length - 1];
    for (const position of [2, 3, 4, 5]) {
      const entry = grid?.[traceType]?.[position];
      if (entry) return entry;
    }
    return null;
  }

  function countTraceMarkers(alienState, player, alienSlotId = alienState?.yichangdian?.revealedSlotId) {
    const playerKeys = getPlayerKeys(player);
    return listTraceEntries(alienState, alienSlotId)
      .filter((entry) => markerBelongsToPlayer(entry, playerKeys))
      .length;
  }

  function countTraceMarkersByType(alienState, player, traceType, alienSlotId = alienState?.yichangdian?.revealedSlotId) {
    const playerKeys = getPlayerKeys(player);
    return listTraceEntries(alienState, alienSlotId, traceType)
      .filter((entry) => markerBelongsToPlayer(entry, playerKeys))
      .length;
  }

  function playerHasAllTraceTypes(alienState, player, alienSlotId = alienState?.yichangdian?.revealedSlotId) {
    return TRACE_TYPES.every((traceType) => countTraceMarkersByType(alienState, player, traceType, alienSlotId) > 0);
  }

  function shuffle(items, random = Math.random) {
    const result = [...items];
    for (let index = result.length - 1; index > 0; index -= 1) {
      const pickIndex = Math.floor(random() * (index + 1));
      [result[index], result[pickIndex]] = [result[pickIndex], result[index]];
    }
    return result;
  }

  function getAnomalyMarkerSrc(markerId) {
    const [prefix, variant] = String(markerId || "").split("_");
    const group = ANOMALY_GROUP_BY_PREFIX[prefix];
    if (!group || !variant) return "";
    return `../assets/aliens/异常点/${prefix}_${variant}.png`;
  }

  function parseAnomalyMarkerId(markerId) {
    const [prefix, variantText] = String(markerId || "").split("_");
    const variant = Math.round(Number(variantText));
    const group = ANOMALY_GROUP_BY_PREFIX[prefix];
    if (!group || ![1, 2].includes(variant)) return null;
    return { ...group, variant, markerId: `${prefix}_${variant}` };
  }

  function createAnomaly(prefix, sectorX, random = Math.random) {
    const variant = random() < 0.5 ? 1 : 2;
    const group = ANOMALY_GROUP_BY_PREFIX[prefix];
    const markerId = `${prefix}_${variant}`;
    return {
      prefix,
      markerId,
      traceType: group.traceType,
      sectorX: mod8(sectorX),
      y: 4,
      src: getAnomalyMarkerSrc(markerId),
      triggeredCount: 0,
    };
  }

  function getAnomalyReward(markerId) {
    return cloneReward(ANOMALY_REWARDS[markerId]);
  }

  function getAnomalyBySectorX(alienState, sectorX) {
    return (alienState?.yichangdian?.anomalies || []).find((anomaly) => (
      mod8(anomaly.sectorX) === mod8(sectorX)
    )) || null;
  }

  function getNextAnomalySectorX(alienState, currentEarthX) {
    const anomalies = alienState?.yichangdian?.anomalies || [];
    if (!anomalies.length) return null;
    let best = null;
    for (const anomaly of anomalies) {
      const steps = mod8(currentEarthX - anomaly.sectorX) || 8;
      if (!best || steps < best.steps) {
        best = { sectorX: mod8(anomaly.sectorX), steps };
      }
    }
    return best?.sectorX ?? null;
  }

  function initializeYichangdianReveal(alienState, alienSlotId, triggerPlayer, earthX, random = Math.random) {
    const yichangdian = ensureYichangdianState(alienState);
    const normalizedEarthX = mod8(earthX);

    if (yichangdian.revealInitialized) {
      yichangdian.nextAnomalySectorX = getNextAnomalySectorX(alienState, normalizedEarthX);
      return {
        ok: true,
        alreadyInitialized: true,
        anomalies: yichangdian.anomalies,
        nextAnomalySectorX: yichangdian.nextAnomalySectorX,
        message: "异常点已初始化",
      };
    }

    yichangdian.revealedSlotId = Number(alienSlotId);
    yichangdian.revealedByPlayerId = triggerPlayer?.id || null;
    yichangdian.revealedByPlayerColor = getPlayerColor(triggerPlayer);
    yichangdian.revealEarthX = normalizedEarthX;
    yichangdian.revealInitialized = true;
    delete yichangdian.traceSlotsByAlienSlotId[String(alienSlotId)];
    ensureTraceGrid(alienState, alienSlotId);
    yichangdian.anomalies = [
      createAnomaly("a", normalizedEarthX, random),
      createAnomaly("b", normalizedEarthX - 3, random),
      createAnomaly("c", normalizedEarthX + 3, random),
    ];
    yichangdian.nextAnomalySectorX = getNextAnomalySectorX(alienState, normalizedEarthX);
    yichangdian.cardDeck = shuffle(CARD_DEFINITIONS.map((card) => card.index), random);
    yichangdian.displayedCardIndex = drawDisplayedCardIndex(alienState, random);

    return {
      ok: true,
      anomalies: yichangdian.anomalies,
      nextAnomalySectorX: yichangdian.nextAnomalySectorX,
      displayedCardIndex: yichangdian.displayedCardIndex,
      message: `异常点已展示：异常扇区 ${yichangdian.anomalies.map((item) => item.sectorX).join("、")}`,
    };
  }

  function updateNextAnomaly(alienState, currentEarthX) {
    const yichangdian = ensureYichangdianState(alienState);
    yichangdian.nextAnomalySectorX = getNextAnomalySectorX(alienState, currentEarthX);
    return yichangdian.nextAnomalySectorX;
  }

  function drawDisplayedCardIndex(alienState, random = Math.random) {
    const yichangdian = ensureYichangdianState(alienState);
    if (!yichangdian.cardDeck.length) yichangdian.cardDeck = shuffle(CARD_DEFINITIONS.map((card) => card.index), random);
    const index = yichangdian.cardDeck.shift();
    yichangdian.displayedCardIndex = index;
    return index;
  }

  function getCardSrc(index) {
    return `${CARD_BASE_PATH}/${index}.webp`;
  }

  function createAlienCard(index, sequence = 0) {
    const definition = CARD_BY_INDEX[Math.round(Number(index))];
    if (!definition) return null;
    return {
      id: `alien-yichangdian-${definition.index}-${sequence}`,
      cardId: definition.cardId,
      alienCardId: definition.index,
      set: "alien:异常点",
      cardName: definition.cardName,
      src: getCardSrc(definition.index),
      faceUp: true,
      price: definition.price,
      cardTypeCode: definition.cardTypeCode,
      discardActionCode: definition.discardActionCode,
      scanActionCode: definition.scanActionCode,
      incomeCode: definition.incomeCode,
      yichangdianCard: true,
    };
  }

  function takeDisplayedCard(alienState, random = Math.random) {
    const yichangdian = ensureYichangdianState(alienState);
    if (yichangdian.displayedCardIndex == null) drawDisplayedCardIndex(alienState, random);
    const card = createAlienCard(yichangdian.displayedCardIndex, yichangdian.nextCardSequence);
    yichangdian.nextCardSequence += 1;
    drawDisplayedCardIndex(alienState, random);
    return { ok: Boolean(card), card, message: card ? `获得异常点牌：${card.cardName}` : "没有可获得的异常点牌" };
  }

  function blindDrawCard(alienState, random = Math.random) {
    const yichangdian = ensureYichangdianState(alienState);
    if (!yichangdian.cardDeck.length) yichangdian.cardDeck = shuffle(CARD_DEFINITIONS.map((card) => card.index), random);
    const pickIndex = Math.floor(random() * yichangdian.cardDeck.length);
    const [index] = yichangdian.cardDeck.splice(pickIndex, 1);
    const card = createAlienCard(index, yichangdian.nextCardSequence);
    yichangdian.nextCardSequence += 1;
    if (yichangdian.displayedCardIndex == null) drawDisplayedCardIndex(alienState, random);
    return { ok: Boolean(card), card, message: card ? `盲抽异常点牌：${card.cardName}` : "没有可盲抽的异常点牌" };
  }

  function seedDebugTraceGrid(alienState, alienSlotId, player) {
    ensureYichangdianState(alienState);
    delete alienState.yichangdian.traceSlotsByAlienSlotId[String(alienSlotId)];
    ensureTraceGrid(alienState, alienSlotId);
    const placed = [];
    for (const traceType of TRACE_TYPES) {
      for (const position of TRACE_POSITIONS) {
        const result = placeYichangdianTrace(alienState, alienSlotId, traceType, position, player, {
          debugOnly: true,
          placedAt: 0,
        });
        if (result.ok) placed.push(result.entry);
      }
    }
    return placed;
  }

  function formatTraceLabel(traceType, position, stackIndex = null) {
    const suffix = position === 1 && stackIndex != null ? `#${stackIndex + 1}` : "";
    return `${placement.getTraceTypeLabel(traceType)} ${position}号位${suffix}`;
  }

  function formatAnomalyLabel(anomaly) {
    if (!anomaly) return "无异常";
    return `${anomaly.markerId} 扇区${mod8(anomaly.sectorX)}（${placement.getTraceTypeLabel(anomaly.traceType)}）`;
  }

  return Object.freeze({
    ALIEN_ID,
    CARD_BACK_SRC,
    CARD_BASE_PATH,
    TRACE_TYPES,
    TRACE_POSITIONS,
    TRACE_POSITION_COUNT,
    TRACE_REWARDS,
    ANOMALY_GROUPS,
    ANOMALY_REWARDS,
    CARD_DEFINITIONS,
    CARD_BY_INDEX,
    CARD_BY_ID,
    createYichangdianState,
    ensureYichangdianState,
    ensureTraceGrid,
    getTraceGrid,
    isYichangdianAlienSlot,
    isYichangdianRevealedSlot,
    getTraceReward,
    placeYichangdianTrace,
    listTraceEntries,
    getTopTraceEntry,
    countTraceMarkers,
    countTraceMarkersByType,
    playerHasAllTraceTypes,
    getAnomalyMarkerSrc,
    parseAnomalyMarkerId,
    getAnomalyReward,
    getAnomalyBySectorX,
    getNextAnomalySectorX,
    initializeYichangdianReveal,
    updateNextAnomaly,
    drawDisplayedCardIndex,
    getCardSrc,
    createAlienCard,
    takeDisplayedCard,
    blindDrawCard,
    seedDebugTraceGrid,
    markerBelongsToPlayer,
    getPlayerKeys,
    formatTraceLabel,
    formatAnomalyLabel,
  });
});
