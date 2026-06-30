(function (root, factory) {
  "use strict";

  let placement = root.SetiAlienPlacement;
  let state = root.SetiAlienState;

  if (typeof require === "function") {
    placement = placement || require("./placement");
    state = state || require("./state");
  }

  const api = factory(placement, state);

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.SetiAlienChong = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function (placement, state) {
  "use strict";

  const ALIEN_ID = "虫";
  const CARD_BACK_SRC = "../assets/aliens/虫/cards/back.png";
  const CARD_BASE_PATH = "../assets/aliens/虫/cards";
  const FOSSIL_BASE_PATH = "../assets/aliens/虫";
  const FOSSIL_BACK_SRC = "../assets/aliens/虫/fossil_back.webp";
  const FOSSIL_OK_SRC = "../assets/aliens/虫/fossil_ok.webp";
  const TRACE_TYPES = Object.freeze(["pink", "yellow", "blue"]);
  const TRACE_POSITIONS_BY_TYPE = Object.freeze({
    pink: Object.freeze([1, 2, 3, 4]),
    yellow: Object.freeze([1, 2, 3, 4]),
    blue: Object.freeze([1, 2, 3, 4, 5, 6, 7, 8, 9]),
  });
  const TRACE_POSITIONS = Object.freeze([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  const INITIAL_BLUE_POSITIONS = Object.freeze([7, 8, 9]);
  const LOCKED_BLUE_POSITIONS = Object.freeze([1, 2, 3, 4, 5, 6]);
  const PANEL_FOSSIL_INITIAL_POSITION = 7;
  const FOSSIL_IDS = Object.freeze([
    "fossil_01",
    "fossil_02",
    "fossil_03",
    "fossil_04",
    "fossil_05",
    "fossil_06",
    "fossil_07",
  ]);

  const FOSSIL_REWARDS = Object.freeze({
    fossil_01: Object.freeze({ gain: Object.freeze({ publicity: 3 }) }),
    fossil_02: Object.freeze({ gain: Object.freeze({ score: 7 }) }),
    fossil_03: Object.freeze({ gain: Object.freeze({ score: 3 }), pickCard: true }),
    fossil_04: Object.freeze({ drawCards: 2 }),
    fossil_05: Object.freeze({ dataCount: 2 }),
    fossil_06: Object.freeze({ gain: Object.freeze({ energy: 2 }) }),
    fossil_07: Object.freeze({ gain: Object.freeze({ credits: 2 }) }),
  });

  const TRACE_REWARDS = Object.freeze({
    pink: Object.freeze({
      1: Object.freeze({ gain: Object.freeze({ score: 4 }) }),
      2: Object.freeze({ gain: Object.freeze({ score: 5 }) }),
      3: Object.freeze({ gain: Object.freeze({ score: 3 }), pickAlienCard: true }),
      4: Object.freeze({ gain: Object.freeze({ score: 5 }), pickAlienCard: true }),
    }),
    yellow: Object.freeze({
      1: Object.freeze({ gain: Object.freeze({ score: 4 }) }),
      2: Object.freeze({ gain: Object.freeze({ score: 5 }) }),
      3: Object.freeze({ gain: Object.freeze({ score: 3 }), pickAlienCard: true }),
      4: Object.freeze({ gain: Object.freeze({ score: 5 }), pickAlienCard: true }),
    }),
    blue: Object.freeze({
      7: Object.freeze({ fossilPanel: true }),
      8: Object.freeze({ gain: Object.freeze({ score: 3 }), pickAlienCard: true }),
      9: Object.freeze({ gain: Object.freeze({ score: 5 }), pickAlienCard: true }),
    }),
  });

  const CARD_DEFINITIONS = Object.freeze([
    Object.freeze({ index: 0, cardId: "chong_0.webp", asset: "0.webp", cardName: "繁殖样本", price: 1, cardTypeCode: 2, discardActionCode: 3, scanActionCode: 1, incomeCode: 1 }),
    Object.freeze({ index: 1, cardId: "chong_1.webp", asset: "1.webp", cardName: "计算机模拟", price: 3, cardTypeCode: 1, discardActionCode: 4, scanActionCode: 0, incomeCode: 2 }),
    Object.freeze({ index: 2, cardId: "chong_2.webp", asset: "2.webp", cardName: "生态系统研究", price: 1, cardTypeCode: 3, discardActionCode: 5, scanActionCode: 2, incomeCode: 2 }),
    Object.freeze({ index: 3, cardId: "chong_3.webp", asset: "3.webp", cardName: "首次接触", price: 1, cardTypeCode: 2, discardActionCode: 3, scanActionCode: 2, incomeCode: 2 }),
    Object.freeze({ index: 4, cardId: "chong_4.webp", asset: "4.webp", cardName: "蜂巢样本", price: 3, cardTypeCode: 1, discardActionCode: 5, scanActionCode: 2, incomeCode: 1 }),
    Object.freeze({ index: 5, cardId: "chong_5.webp", asset: "5.webp", cardName: "火星隔离实验室", price: 1, cardTypeCode: 2, discardActionCode: 4, scanActionCode: 1, incomeCode: 0 }),
    Object.freeze({ index: 6, cardId: "chong_6.webp", asset: "6.webp", cardName: "样本大量采集", price: 1, cardTypeCode: 2, discardActionCode: 4, scanActionCode: 0, incomeCode: 1 }),
    Object.freeze({ index: 7, cardId: "chong_7.webp", asset: "7.webp", cardName: "轨道监测", price: 3, cardTypeCode: 1, discardActionCode: 5, scanActionCode: 0, incomeCode: 0 }),
    Object.freeze({ index: 8, cardId: "chong_8.webp", asset: "8.webp", cardName: "探测车探索", price: 2, cardTypeCode: 2, discardActionCode: 3, scanActionCode: 3, incomeCode: 1 }),
    Object.freeze({ index: 9, cardId: "chong_9.webp", asset: "9.webp", cardName: "虫", price: 2, cardTypeCode: 2, discardActionCode: 5, scanActionCode: 1, incomeCode: 0 }),
  ]);

  const CARD_BY_INDEX = Object.freeze(Object.fromEntries(CARD_DEFINITIONS.map((card) => [card.index, card])));
  const CARD_BY_ID = Object.freeze(Object.fromEntries(CARD_DEFINITIONS.map((card) => [card.cardId, card])));

  const CARD_TASKS = Object.freeze({
    0: Object.freeze({ kind: "transport", destinationPlanetId: "earth", fossilRewardRepeat: 2 }),
    1: Object.freeze({ kind: "trace", traceType: "blue", count: 2, chooseFossilRewardOnly: true }),
    3: Object.freeze({ kind: "transport", destinationPlanetId: "earth", fossilRewardRepeat: 1, gain: Object.freeze({}), dataCount: 2 }),
    4: Object.freeze({ kind: "trace", traceType: "yellow", count: 2, chooseFossilRewardOnly: true }),
    5: Object.freeze({ kind: "transport", destinationPlanetId: "mars", fossilRewardRepeat: 1, gain: Object.freeze({ score: 2 }), pickCard: true }),
    6: Object.freeze({ kind: "transport", destinationPlanetId: "earth", fossilRewardRepeat: 1, gain: Object.freeze({ score: 3, credits: 1 }) }),
    7: Object.freeze({ kind: "trace", traceType: "pink", count: 2, chooseFossilRewardOnly: true }),
    8: Object.freeze({ kind: "transport", destinationPlanetId: "earth", fossilRewardRepeat: 1, gain: Object.freeze({ score: 3 }), dataCount: 3 }),
    9: Object.freeze({ kind: "transport", destinationPlanetId: "earth", fossilRewardRepeat: 1, gain: Object.freeze({ score: 6, publicity: 2 }) }),
  });

  const EFFECT_TYPES = Object.freeze({
    CHONG_LAND_FOR_PICKUP: "chong_land_for_pickup",
    CHONG_ORBIT_OR_LAND_FOR_PICKUP: "chong_orbit_or_land_for_pickup",
    CHONG_PICKUP_FOSSIL: "chong_pickup_fossil",
    CHONG_PICKUP_AFTER_LAND: "chong_pickup_after_land",
    CHONG_PICKUP_AFTER_ORBIT_OR_LAND: "chong_pickup_after_orbit_or_land",
    CHONG_PROBE_PLANET_FOSSIL_REWARD: "chong_probe_planet_fossil_reward",
    CHONG_CHOOSE_PLANET_FOSSIL_REWARD: "chong_choose_planet_fossil_reward",
    CHONG_TASK_CLEANUP: "chong_task_cleanup",
  });

  function effect(id, type, label, icon, options = {}) {
    return { id, type, label, icon, options: { ...options }, status: "pending" };
  }

  function gainResourcesEffect(id, label, gain) {
    return effect(id, "gain_resources", label, gain.score ? "score" : gain.energy ? "energy" : "publicity", { gain });
  }

  function researchTechEffect(id, label, techTypes) {
    return effect(id, "card_research_tech", label, "research_tech", {
      skipCost: true,
      techTypes: Object.freeze([...techTypes]),
    });
  }

  function cardMoveEffect(id, label, movementPoints = 1) {
    return effect(id, "card_move", label, "movement", { movementPoints });
  }

  function pickupEffects(prefix, labelPrefix, options = {}) {
    const cardIndex = Math.round(Number(options.cardIndex));
    const effectOptions = { ...options, cardIndex };
    const actionType = options.orbitOrLand
      ? EFFECT_TYPES.CHONG_ORBIT_OR_LAND_FOR_PICKUP
      : EFFECT_TYPES.CHONG_LAND_FOR_PICKUP;
    const actionIcon = options.orbitOrLand ? "orbitOrLand" : "land";
    const actionLabel = options.orbitOrLand
      ? `${labelPrefix}：环绕或登陆`
      : `${labelPrefix}：登陆`;
    return [
      effect(`${prefix}-action`, actionType, actionLabel, actionIcon, effectOptions),
      effect(`${prefix}-pickup`, EFFECT_TYPES.CHONG_PICKUP_FOSSIL, `${labelPrefix}：拾取木星/土星化石`, "chongFossilBack", effectOptions),
    ];
  }

  function buildImmediateEffects(cardOrIndex) {
    const index = getCardDefinition(cardOrIndex)?.index;
    switch (index) {
      case 0:
        return pickupEffects("chong-0", "虫族0", { cardIndex: 0 });
      case 1:
        return [
          gainResourcesEffect("chong-1-publicity", "虫族1：1宣传", { publicity: 1 }),
          researchTechEffect("chong-1-blue-tech", "虫族1：蓝色科技", ["blue"]),
        ];
      case 2:
        return [effect("chong-2-probe-fossil", EFFECT_TYPES.CHONG_PROBE_PLANET_FOSSIL_REWARD, "虫族2：查看探测器所在星球化石并结算奖励", "chongFossilOk", { cardIndex: 2 })];
      case 3:
        return [
          cardMoveEffect("chong-3-move", "虫族3：1移动", 1),
          ...pickupEffects("chong-3", "虫族3", { cardIndex: 3 }),
        ];
      case 4:
        return [
          gainResourcesEffect("chong-4-publicity", "虫族4：1宣传", { publicity: 1 }),
          researchTechEffect("chong-4-orange-tech", "虫族4：橙色科技", ["orange"]),
        ];
      case 5:
        return pickupEffects("chong-5", "虫族5", { cardIndex: 5 });
      case 6:
        return pickupEffects("chong-6", "虫族6", { cardIndex: 6, orbitOrLand: true });
      case 7:
        return [
          gainResourcesEffect("chong-7-publicity", "虫族7：1宣传", { publicity: 1 }),
          researchTechEffect("chong-7-purple-tech", "虫族7：粉紫科技", ["purple"]),
        ];
      case 8:
        return pickupEffects("chong-8", "虫族8", { cardIndex: 8, allowSatellite: true });
      case 9:
        return pickupEffects("chong-9", "虫族9", { cardIndex: 9, allowSatellite: true });
      default:
        return [];
    }
  }

  function createTraceGrid() {
    const grid = {};
    for (const traceType of TRACE_TYPES) {
      grid[traceType] = {};
      for (const position of TRACE_POSITIONS_BY_TYPE[traceType]) {
        grid[traceType][position] = null;
      }
    }
    return grid;
  }

  function createChongState() {
    return {
      revealedSlotId: null,
      revealedByPlayerId: null,
      revealedByPlayerColor: null,
      traceSlotsByAlienSlotId: {},
      nextTraceSequence: 1,
      displayedCardIndex: null,
      cardDeck: CARD_DEFINITIONS.map((card) => card.index),
      nextCardSequence: 1,
      revealInitialized: false,
      fossilsById: {},
      planetFossilIds: {
        jupiter: [],
        saturn: [],
      },
      panelFossilSlots: {},
      unlockedBluePositions: [...INITIAL_BLUE_POSITIONS],
      transportTasksByRocketId: {},
      completedTransports: [],
    };
  }

  function ensureChongState(alienState) {
    if (!alienState.chong || typeof alienState.chong !== "object") {
      alienState.chong = createChongState();
    }
    const chong = alienState.chong;
    if (!chong.traceSlotsByAlienSlotId) chong.traceSlotsByAlienSlotId = {};
    if (!Array.isArray(chong.cardDeck)) chong.cardDeck = CARD_DEFINITIONS.map((card) => card.index);
    if (!Number.isFinite(Number(chong.nextTraceSequence))) chong.nextTraceSequence = 1;
    if (!Number.isFinite(Number(chong.nextCardSequence))) chong.nextCardSequence = 1;
    if (typeof chong.revealInitialized !== "boolean") chong.revealInitialized = false;
    if (!chong.fossilsById) chong.fossilsById = {};
    if (!chong.planetFossilIds) chong.planetFossilIds = { jupiter: [], saturn: [] };
    if (!Array.isArray(chong.planetFossilIds.jupiter)) chong.planetFossilIds.jupiter = [];
    if (!Array.isArray(chong.planetFossilIds.saturn)) chong.planetFossilIds.saturn = [];
    if (!chong.panelFossilSlots) chong.panelFossilSlots = {};
    if (!Array.isArray(chong.unlockedBluePositions)) chong.unlockedBluePositions = [...INITIAL_BLUE_POSITIONS];
    if (!chong.transportTasksByRocketId) chong.transportTasksByRocketId = {};
    if (!Array.isArray(chong.completedTransports)) chong.completedTransports = [];
    return chong;
  }

  function ensureTraceGrid(alienState, alienSlotId) {
    const chong = ensureChongState(alienState);
    const key = String(alienSlotId);
    if (!chong.traceSlotsByAlienSlotId[key]) {
      chong.traceSlotsByAlienSlotId[key] = createTraceGrid();
    }
    return chong.traceSlotsByAlienSlotId[key];
  }

  function getTraceGrid(alienState, alienSlotId) {
    return alienState?.chong?.traceSlotsByAlienSlotId?.[String(alienSlotId)] || null;
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

  function countStateTraceMarkers(alienState, player, traceType = null, alienSlotId = alienState?.chong?.revealedSlotId) {
    if (!state?.countTraceMarkersForPlayerOnSlot || alienSlotId == null) return 0;
    return state.countTraceMarkersForPlayerOnSlot(alienState, alienSlotId, player, traceType);
  }

  function isChongAlienSlot(alienState, alienSlotId) {
    const slot = alienState?.aliens?.[alienSlotId];
    return slot?.alienId === ALIEN_ID || slot?.assignedAlienId === ALIEN_ID;
  }

  function isChongRevealedSlot(alienState, alienSlotId) {
    const slot = alienState?.aliens?.[alienSlotId];
    return Boolean(slot?.revealed && slot.alienId === ALIEN_ID);
  }

  function getPositionsForTraceType(traceType) {
    return TRACE_POSITIONS_BY_TYPE[traceType] || [];
  }

  function normalizePosition(traceType, position) {
    const value = Math.round(Number(position));
    return getPositionsForTraceType(traceType).includes(value) ? value : null;
  }

  function validateTraceTarget(traceType, position) {
    const normalizedPosition = normalizePosition(traceType, position);
    if (!TRACE_TYPES.includes(traceType)) {
      return { ok: false, message: `虫族不支持的痕迹颜色 ${traceType}` };
    }
    if (!normalizedPosition) {
      return { ok: false, message: `虫族不支持的痕迹位置 ${position}` };
    }
    return { ok: true, position: normalizedPosition };
  }

  function isBluePositionUnlocked(alienState, position) {
    const chong = ensureChongState(alienState);
    return chong.unlockedBluePositions.includes(Number(position));
  }

  function hasPanelFossilAtPosition(alienState, position) {
    const chong = ensureChongState(alienState);
    return Boolean(chong.panelFossilSlots?.[Number(position)]);
  }

  function canPlaceChongTrace(alienState, alienSlotId, traceType, position, player, options = {}) {
    const validation = validateTraceTarget(traceType, position);
    if (!validation.ok) return validation;
    const normalizedPosition = validation.position;
    if (traceType === "blue" && LOCKED_BLUE_POSITIONS.includes(normalizedPosition) && !hasPanelFossilAtPosition(alienState, normalizedPosition)) {
      return { ok: false, message: `虫族蓝色 ${normalizedPosition} 号位没有化石` };
    }
    if (traceType === "blue" && !options.debugOnly && !isBluePositionUnlocked(alienState, normalizedPosition)) {
      return { ok: false, message: `虫族蓝色 ${normalizedPosition} 号位尚未解锁` };
    }
    const grid = getTraceGrid(alienState, alienSlotId) || ensureTraceGrid(alienState, alienSlotId);
    if (grid[traceType][normalizedPosition]) {
      return { ok: false, message: `${placement.getTraceTypeLabel(traceType)} ${normalizedPosition} 号位已经有痕迹` };
    }
    return { ok: true, position: normalizedPosition };
  }

  function createTraceEntry(alienState, player, traceType, position, options = {}) {
    const chong = ensureChongState(alienState);
    const sequence = options.sequence || chong.nextTraceSequence;
    chong.nextTraceSequence = Math.max(chong.nextTraceSequence, sequence + 1);
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
      gain: { ...(reward.gain || {}) },
      dataCount: Math.max(0, Math.round(Number(reward.dataCount) || 0)),
      drawCards: Math.max(0, Math.round(Number(reward.drawCards) || 0)),
      pickCard: Boolean(reward.pickCard),
      pickAlienCard: Boolean(reward.pickAlienCard),
      fossilPanel: Boolean(reward.fossilPanel),
      chooseFossilRewardOnly: Boolean(reward.chooseFossilRewardOnly),
    };
  }

  function getFossilReward(fossilId) {
    return cloneReward(FOSSIL_REWARDS[fossilId]);
  }

  function getTraceReward(alienState, traceType, position) {
    const normalizedPosition = normalizePosition(traceType, position);
    if (traceType === "blue" && LOCKED_BLUE_POSITIONS.includes(normalizedPosition)) {
      const fossilId = alienState?.chong?.panelFossilSlots?.[normalizedPosition];
      return fossilId ? { ...getFossilReward(fossilId), fossilId, fossilPanel: false } : null;
    }
    const reward = cloneReward(TRACE_REWARDS[traceType]?.[normalizedPosition]);
    if (reward?.fossilPanel) {
      const fossilId = alienState?.chong?.panelFossilSlots?.[normalizedPosition];
      reward.fossilId = fossilId || null;
    }
    return reward;
  }

  function placeChongTrace(alienState, alienSlotId, traceType, position, player, options = {}) {
    if (!isChongRevealedSlot(alienState, alienSlotId) && !options.debugOnly) {
      return { ok: false, message: "虫族尚未揭示，不能放置虫族痕迹" };
    }

    const placementCheck = canPlaceChongTrace(alienState, alienSlotId, traceType, position, player, options);
    if (!placementCheck.ok) return placementCheck;

    const normalizedPosition = placementCheck.position;
    const grid = ensureTraceGrid(alienState, alienSlotId);
    const reward = options.debugOnly ? null : getTraceReward(alienState, traceType, normalizedPosition);
    const entry = createTraceEntry(alienState, player, traceType, normalizedPosition, {
      debugOnly: options.debugOnly,
      rewardApplied: Boolean(!options.debugOnly && reward),
      placedAt: options.placedAt,
      sequence: options.sequence,
    });
    grid[traceType][normalizedPosition] = entry;
    return {
      ok: true,
      entry,
      reward,
      traceType,
      position: normalizedPosition,
      message: `虫族：放置${placement.getTraceTypeLabel(traceType)} ${normalizedPosition} 号位`,
    };
  }

  function getTraceEntries(grid, traceType, position) {
    const value = grid?.[traceType]?.[position];
    return value ? [value] : [];
  }

  function listTraceEntries(alienState, alienSlotId, traceType = null) {
    const grid = getTraceGrid(alienState, alienSlotId);
    const entries = [];
    const types = traceType ? [traceType] : TRACE_TYPES;
    for (const type of types) {
      for (const position of getPositionsForTraceType(type)) {
        entries.push(...getTraceEntries(grid, type, position));
      }
    }
    return entries;
  }

  function shuffle(items, random = Math.random) {
    const result = [...items];
    for (let index = result.length - 1; index > 0; index -= 1) {
      const pickIndex = Math.floor(random() * (index + 1));
      [result[index], result[pickIndex]] = [result[pickIndex], result[index]];
    }
    return result;
  }

  function getCardDefinition(cardOrIndex) {
    if (cardOrIndex == null) return null;
    if (typeof cardOrIndex === "number") return CARD_BY_INDEX[Math.round(cardOrIndex)] || null;
    const cardId = typeof cardOrIndex === "string" ? cardOrIndex : cardOrIndex?.cardId || cardOrIndex?.id || "";
    const byId = CARD_BY_ID[cardId] || CARD_DEFINITIONS.find((card) => card.cardId === cardId || card.asset === cardId) || null;
    if (byId) return byId;
    if (isChongCard(cardOrIndex) && Number.isFinite(Number(cardOrIndex?.alienCardId))) {
      return CARD_BY_INDEX[Math.round(Number(cardOrIndex.alienCardId))] || null;
    }
    return null;
  }

  function getCardSrc(index) {
    return `${CARD_BASE_PATH}/${Math.round(Number(index))}.webp`;
  }

  function getFossilSrc(fossilId) {
    return `${FOSSIL_BASE_PATH}/${fossilId}.png`;
  }

  function createAlienCard(index, sequence = 0) {
    const definition = CARD_BY_INDEX[Math.round(Number(index))];
    if (!definition) return null;
    return {
      id: `alien-chong-${definition.index}-${sequence}`,
      cardId: definition.cardId,
      alienCardId: definition.index,
      set: "alien:虫",
      cardName: definition.cardName,
      src: getCardSrc(definition.index),
      faceUp: true,
      price: definition.price,
      cardTypeCode: definition.cardTypeCode,
      discardActionCode: definition.discardActionCode,
      scanActionCode: definition.scanActionCode,
      incomeCode: definition.incomeCode,
      chongCard: true,
      chongTask: cloneTask(CARD_TASKS[definition.index]),
    };
  }

  function drawDisplayedCardIndex(alienState, random = Math.random) {
    const chong = ensureChongState(alienState);
    if (!chong.cardDeck.length) chong.cardDeck = shuffle(CARD_DEFINITIONS.map((card) => card.index), random);
    const index = chong.cardDeck.shift();
    chong.displayedCardIndex = index;
    return index;
  }

  function takeDisplayedCard(alienState, random = Math.random) {
    const chong = ensureChongState(alienState);
    if (chong.displayedCardIndex == null) drawDisplayedCardIndex(alienState, random);
    const card = createAlienCard(chong.displayedCardIndex, chong.nextCardSequence);
    chong.nextCardSequence += 1;
    drawDisplayedCardIndex(alienState, random);
    return { ok: Boolean(card), card, message: card ? `获得虫族牌：${card.cardName}` : "没有可获得的虫族牌" };
  }

  function blindDrawCard(alienState, random = Math.random) {
    const chong = ensureChongState(alienState);
    if (!chong.cardDeck.length) chong.cardDeck = shuffle(CARD_DEFINITIONS.map((card) => card.index), random);
    const pickIndex = Math.floor(random() * chong.cardDeck.length);
    const [index] = chong.cardDeck.splice(pickIndex, 1);
    const card = createAlienCard(index, chong.nextCardSequence);
    chong.nextCardSequence += 1;
    if (chong.displayedCardIndex == null) drawDisplayedCardIndex(alienState, random);
    return { ok: Boolean(card), card, message: card ? `盲抽虫族牌：${card.cardName}` : "没有可盲抽的虫族牌" };
  }

  function createFossil(fossilId, location, planetId = null) {
    return {
      fossilId,
      location,
      planetId,
      status: location === "panel" ? "panel" : "available",
      visibleToPlayerIds: [],
      carriedByPlayerId: null,
      carriedByPlayerColor: null,
      rocketId: null,
      taskCardId: null,
      destinationPlanetId: null,
    };
  }

  function initializeFossils(chong, random = Math.random) {
    const ids = shuffle(FOSSIL_IDS, random);
    const jupiter = ids.slice(0, 3);
    const saturn = ids.slice(3, 6);
    const panel = ids[6];
    chong.fossilsById = {};
    chong.planetFossilIds = { jupiter: [], saturn: [] };
    chong.panelFossilSlots = {};
    chong.unlockedBluePositions = [...INITIAL_BLUE_POSITIONS];
    for (const fossilId of jupiter) {
      chong.fossilsById[fossilId] = createFossil(fossilId, "planet", "jupiter");
      chong.planetFossilIds.jupiter.push(fossilId);
    }
    for (const fossilId of saturn) {
      chong.fossilsById[fossilId] = createFossil(fossilId, "planet", "saturn");
      chong.planetFossilIds.saturn.push(fossilId);
    }
    chong.fossilsById[panel] = createFossil(panel, "panel", null);
    chong.panelFossilSlots[PANEL_FOSSIL_INITIAL_POSITION] = panel;
    return { jupiter, saturn, panel };
  }

  function initializeChongReveal(alienState, alienSlotId, triggerPlayer, random = Math.random) {
    const chong = ensureChongState(alienState);
    if (chong.revealInitialized) {
      return {
        ok: true,
        alreadyInitialized: true,
        displayedCardIndex: chong.displayedCardIndex,
        message: "虫族已初始化",
      };
    }
    chong.revealedSlotId = Number(alienSlotId);
    chong.revealedByPlayerId = triggerPlayer?.id || null;
    chong.revealedByPlayerColor = getPlayerColor(triggerPlayer);
    chong.revealInitialized = true;
    delete chong.traceSlotsByAlienSlotId[String(alienSlotId)];
    ensureTraceGrid(alienState, alienSlotId);
    chong.cardDeck = shuffle(CARD_DEFINITIONS.map((card) => card.index), random);
    chong.displayedCardIndex = drawDisplayedCardIndex(alienState, random);
    chong.transportTasksByRocketId = {};
    chong.completedTransports = [];
    const fossils = initializeFossils(chong, random);
    return {
      ok: true,
      displayedCardIndex: chong.displayedCardIndex,
      fossils,
      message: `虫族已揭示：木星/土星各放置 3 枚化石，面板展示 ${fossils.panel}`,
    };
  }

  function seedDebugTraceGrid(alienState, alienSlotId, player) {
    ensureChongState(alienState);
    delete alienState.chong.traceSlotsByAlienSlotId[String(alienSlotId)];
    ensureTraceGrid(alienState, alienSlotId);
    const placed = [];
    for (const traceType of TRACE_TYPES) {
      for (const position of getPositionsForTraceType(traceType)) {
        const result = placeChongTrace(alienState, alienSlotId, traceType, position, player, {
          debugOnly: true,
          placedAt: 0,
        });
        if (result.ok) placed.push(result.entry);
      }
    }
    return placed;
  }

  function isChongCard(card) {
    return Boolean(card?.chongCard || card?.set === "alien:虫" || String(card?.cardId || "").startsWith("chong_"));
  }

  function cloneTask(task) {
    if (!task) return null;
    return {
      ...task,
      gain: { ...(task.gain || {}) },
    };
  }

  function getCardTask(cardOrIndex) {
    const index = getCardDefinition(cardOrIndex)?.index;
    return cloneTask(CARD_TASKS[index]);
  }

  function countTraceMarkers(alienState, player, traceType = null, alienSlotId = alienState?.chong?.revealedSlotId) {
    const playerKeys = getPlayerKeys(player);
    const faceCount = listTraceEntries(alienState, alienSlotId, traceType)
      .filter((entry) => markerBelongsToPlayer(entry, playerKeys))
      .length;
    return countStateTraceMarkers(alienState, player, traceType, alienSlotId) + faceCount;
  }

  function isTraceTaskReady(alienState, player, task) {
    if (!task || task.kind !== "trace") return false;
    return countTraceMarkers(alienState, player, task.traceType) >= Number(task.count || 1);
  }

  function getAvailablePlanetFossils(alienState, planetId = null) {
    const chong = ensureChongState(alienState);
    const planetIds = planetId ? [planetId] : ["jupiter", "saturn"];
    const fossils = [];
    for (const id of planetIds) {
      for (const fossilId of chong.planetFossilIds?.[id] || []) {
        const fossil = chong.fossilsById?.[fossilId];
        if (!fossil || fossil.status !== "available" || fossil.location !== "planet") continue;
        fossils.push(fossil);
      }
    }
    return fossils;
  }

  function revealPlanetFossilsToPlayer(alienState, planetId, player) {
    const playerKey = getPlayerKey(player);
    const fossils = getAvailablePlanetFossils(alienState, planetId);
    if (!playerKey) return fossils;
    for (const fossil of fossils) {
      if (!Array.isArray(fossil.visibleToPlayerIds)) fossil.visibleToPlayerIds = [];
      if (!fossil.visibleToPlayerIds.includes(playerKey)) fossil.visibleToPlayerIds.push(playerKey);
    }
    return fossils;
  }

  function pickUpFossil(alienState, fossilId, player, task = {}, options = {}) {
    const chong = ensureChongState(alienState);
    const fossil = chong.fossilsById?.[fossilId];
    if (!fossil || fossil.status !== "available" || fossil.location !== "planet") {
      return { ok: false, message: "该化石不可拾取" };
    }
    fossil.status = "transported";
    fossil.location = "transported";
    fossil.carriedByPlayerId = getPlayerKey(player);
    fossil.carriedByPlayerColor = getPlayerColor(player);
    fossil.taskCardId = options.cardId || null;
    fossil.taskCardLabel = options.cardLabel || null;
    fossil.destinationPlanetId = task.destinationPlanetId || options.destinationPlanetId || null;
    fossil.suggestedDestinationPlanetId = fossil.destinationPlanetId;
    fossil.fossilRewardRepeat = Math.max(0, Math.round(Number(task.fossilRewardRepeat) || 0));
    fossil.taskGain = { ...(task.gain || {}) };
    fossil.taskDataCount = Math.max(0, Math.round(Number(task.dataCount) || 0));
    fossil.taskPickCard = Boolean(task.pickCard);
    fossil.taskCompleted = false;
    return { ok: true, fossil, message: `拾取 ${fossilId}，推荐目的地 ${fossil.destinationPlanetId || "无"}` };
  }

  function attachTransportRocket(alienState, fossilId, rocketId) {
    const chong = ensureChongState(alienState);
    const fossil = chong.fossilsById?.[fossilId];
    if (!fossil) return { ok: false, message: "化石不存在" };
    fossil.rocketId = Number(rocketId);
    chong.transportTasksByRocketId[String(rocketId)] = {
      fossilId,
      destinationPlanetId: fossil.destinationPlanetId,
      cardId: fossil.taskCardId,
      cardLabel: fossil.taskCardLabel,
    };
    return { ok: true, fossil };
  }

  function buildTransportTaskFromFossil(fossil) {
    if (!fossil) return null;
    return {
      destinationPlanetId: fossil.destinationPlanetId,
      fossilRewardRepeat: fossil.fossilRewardRepeat,
      gain: { ...(fossil.taskGain || {}) },
      dataCount: fossil.taskDataCount,
      pickCard: Boolean(fossil.taskPickCard),
    };
  }

  function markTransportedFossilDelivered(alienState, rocketId, planetId = null) {
    const chong = ensureChongState(alienState);
    const key = String(rocketId);
    const task = chong.transportTasksByRocketId?.[key];
    if (!task) return { ok: false, message: "没有虫族化石搬运任务" };
    const fossil = chong.fossilsById?.[task.fossilId];
    if (!fossil) return { ok: false, message: "搬运化石不存在" };
    if (fossil.status !== "transported" && fossil.status !== "delivered") {
      return { ok: false, message: "该化石不在搬运中" };
    }
    fossil.lastVisitedPlanetId = planetId || null;
    task.lastVisitedPlanetId = planetId || null;
    return {
      ok: true,
      fossil,
      task: buildTransportTaskFromFossil(fossil),
      rocketId: Number(rocketId),
      message: `${fossil.fossilId} 到达 ${planetId || "星球"}，若有匹配虫族任务可点击保留牌完成`,
    };
  }

  function findNextLockedBluePosition(alienState) {
    const chong = ensureChongState(alienState);
    return LOCKED_BLUE_POSITIONS.find((position) => (
      !chong.unlockedBluePositions.includes(position)
      && !chong.panelFossilSlots[position]
    )) || null;
  }

  function unlockBluePositionWithFossil(alienState, fossilId) {
    const chong = ensureChongState(alienState);
    const position = findNextLockedBluePosition(alienState);
    if (!position) return { ok: false, message: "虫族蓝色化石位已满" };
    chong.panelFossilSlots[position] = fossilId;
    if (!chong.unlockedBluePositions.includes(position)) chong.unlockedBluePositions.push(position);
    chong.unlockedBluePositions.sort((a, b) => a - b);
    return { ok: true, position };
  }

  function completeTransportedFossil(alienState, rocketId, options = {}) {
    const chong = ensureChongState(alienState);
    const task = chong.transportTasksByRocketId?.[String(rocketId)];
    if (!task) return { ok: false, message: "没有虫族化石搬运任务" };
    const fossil = chong.fossilsById?.[task.fossilId];
    if (!fossil) return { ok: false, message: "搬运化石不存在" };
    if (fossil.status !== "delivered" && fossil.status !== "transported") {
      return { ok: false, message: "该化石尚未送达" };
    }
    fossil.status = "panel";
    fossil.location = "panel";
    fossil.rocketId = null;
    fossil.deliveredRocketId = null;
    fossil.readyToComplete = false;
    fossil.taskCompleted = true;
    fossil.completedByCardId = options.cardId || fossil.taskCardId || null;
    fossil.completedDestinationPlanetId = options.destinationPlanetId || fossil.lastVisitedPlanetId || fossil.destinationPlanetId || null;
    delete chong.transportTasksByRocketId[String(rocketId)];
    const unlock = unlockBluePositionWithFossil(alienState, fossil.fossilId);
    chong.completedTransports.push({
      fossilId: fossil.fossilId,
      destinationPlanetId: fossil.completedDestinationPlanetId,
      cardId: fossil.completedByCardId,
      bluePosition: unlock.position || null,
      completedAt: Date.now(),
    });
    return {
      ok: true,
      fossil,
      task: options.task || buildTransportTaskFromFossil(fossil),
      bluePosition: unlock.position || null,
      message: `${fossil.fossilId} 已用于 ${fossil.completedDestinationPlanetId || "虫族任务"}，解锁虫族蓝色 ${unlock.position || "无"} 号位`,
    };
  }

  function getTransportTaskForRocket(alienState, rocketId) {
    return ensureChongState(alienState).transportTasksByRocketId?.[String(rocketId)] || null;
  }

  function getDeliveredTransportForCard(alienState, cardId) {
    if (!cardId) return null;
    const chong = ensureChongState(alienState);
    for (const [rocketId, task] of Object.entries(chong.transportTasksByRocketId || {})) {
      if (task.cardId !== cardId) continue;
      const fossil = chong.fossilsById?.[task.fossilId];
      if (!fossil || fossil.status !== "delivered" || !fossil.readyToComplete) continue;
      return {
        rocketId: Number(rocketId),
        fossil,
        task: buildTransportTaskFromFossil(fossil),
      };
    }
    return null;
  }

  function getActiveTransportForCard(alienState, cardId) {
    if (!cardId) return null;
    const chong = ensureChongState(alienState);
    for (const [rocketId, task] of Object.entries(chong.transportTasksByRocketId || {})) {
      if (task.cardId !== cardId) continue;
      const fossil = chong.fossilsById?.[task.fossilId];
      if (!fossil || fossil.taskCompleted) continue;
      if (fossil.status !== "transported" && fossil.status !== "delivered") continue;
      return {
        rocketId: Number(rocketId),
        fossil,
        task: buildTransportTaskFromFossil(fossil),
        delivered: fossil.status === "delivered" || Boolean(task.delivered),
      };
    }
    return null;
  }

  function getRocketSectorCoordinate(rocket) {
    if (!rocket) return null;
    const coordinate = rocket.sectorCoordinate || rocket.sector || rocket.coordinate || null;
    if (coordinate && Number.isFinite(Number(coordinate.x)) && Number.isFinite(Number(coordinate.y))) {
      return { x: Math.round(Number(coordinate.x)), y: Math.round(Number(coordinate.y)) };
    }
    if (Number.isFinite(Number(rocket.sectorX)) && Number.isFinite(Number(rocket.sectorY))) {
      return { x: Math.round(Number(rocket.sectorX)), y: Math.round(Number(rocket.sectorY)) };
    }
    return null;
  }

  function sameCoordinate(left, right) {
    if (!left || !right) return false;
    return Math.round(Number(left.x)) === Math.round(Number(right.x))
      && Math.round(Number(left.y)) === Math.round(Number(right.y));
  }

  function listTransportArrivalEvents(alienState, rockets = [], getDestinationCoordinate = null, options = {}) {
    if (!alienState || typeof getDestinationCoordinate !== "function") return [];
    const chong = ensureChongState(alienState);
    const requiredKind = options.chongFossilKind || null;
    const source = options.source || "chong-transport-position";
    const events = [];
    for (const rocket of rockets || []) {
      if (!rocket || (requiredKind && rocket.kind !== requiredKind)) continue;
      const rocketId = Number(rocket.id);
      if (!Number.isFinite(rocketId)) continue;
      const task = chong.transportTasksByRocketId?.[String(rocketId)];
      if (!task || !task.destinationPlanetId || task.delivered) continue;
      const fossil = chong.fossilsById?.[task.fossilId];
      if (!fossil || fossil.status !== "transported" || fossil.taskCompleted) continue;
      const rocketCoordinate = getRocketSectorCoordinate(rocket);
      let destinationCoordinate = null;
      try {
        destinationCoordinate = getDestinationCoordinate(task.destinationPlanetId, task, fossil, rocket);
      } catch (_error) {
        destinationCoordinate = null;
      }
      if (!sameCoordinate(rocketCoordinate, destinationCoordinate)) continue;
      events.push({
        type: "visitPlanet",
        planetId: task.destinationPlanetId,
        rocketId,
        playerId: rocket.playerId || fossil.carriedByPlayerId || null,
        playerColor: rocket.color || fossil.carriedByPlayerColor || null,
        tokenKind: rocket.kind || requiredKind || null,
        fossilId: fossil.fossilId,
        source,
        synthetic: true,
      });
    }
    return events;
  }

  function transportBelongsToPlayer(fossil, player = null) {
    if (!player) return true;
    const keys = getPlayerKeys(player);
    return keys.has(fossil?.carriedByPlayerId)
      || keys.has(fossil?.carriedByPlayerColor);
  }

  function listActiveTransports(alienState, player = null) {
    const chong = ensureChongState(alienState);
    const transports = [];
    for (const [rocketId, task] of Object.entries(chong.transportTasksByRocketId || {})) {
      const fossil = chong.fossilsById?.[task.fossilId];
      if (!fossil || fossil.taskCompleted) continue;
      if (fossil.status !== "transported" && fossil.status !== "delivered") continue;
      if (!transportBelongsToPlayer(fossil, player)) continue;
      transports.push({
        rocketId: Number(rocketId),
        fossil,
        task: buildTransportTaskFromFossil(fossil),
        originCardId: task.cardId || fossil.taskCardId || null,
        delivered: fossil.status === "delivered" || Boolean(task.delivered),
      });
    }
    return transports;
  }

  function formatTraceLabel(traceType, position) {
    return `${placement.getTraceTypeLabel(traceType)} ${position}号位`;
  }

  return Object.freeze({
    ALIEN_ID,
    CARD_BACK_SRC,
    CARD_BASE_PATH,
    FOSSIL_BASE_PATH,
    TRACE_TYPES,
    TRACE_POSITIONS,
    TRACE_POSITIONS_BY_TYPE,
    INITIAL_BLUE_POSITIONS,
    LOCKED_BLUE_POSITIONS,
    PANEL_FOSSIL_INITIAL_POSITION,
    FOSSIL_IDS,
    FOSSIL_REWARDS,
    TRACE_REWARDS,
    CARD_DEFINITIONS,
    CARD_BY_INDEX,
    CARD_BY_ID,
    FOSSIL_BACK_SRC,
    FOSSIL_OK_SRC,
    CARD_TASKS,
    EFFECT_TYPES,
    createChongState,
    ensureChongState,
    ensureTraceGrid,
    getTraceGrid,
    isChongAlienSlot,
    isChongRevealedSlot,
    canPlaceChongTrace,
    placeChongTrace,
    getTraceReward,
    getFossilReward,
    listTraceEntries,
    getTraceEntries,
    getPositionsForTraceType,
    initializeChongReveal,
    seedDebugTraceGrid,
    getCardSrc,
    getFossilSrc,
    createAlienCard,
    takeDisplayedCard,
    blindDrawCard,
    drawDisplayedCardIndex,
    getCardDefinition,
    buildImmediateEffects,
    isChongCard,
    getCardTask,
    isTraceTaskReady,
    countTraceMarkers,
    getAvailablePlanetFossils,
    revealPlanetFossilsToPlayer,
    pickUpFossil,
    attachTransportRocket,
    markTransportedFossilDelivered,
    completeTransportedFossil,
    getTransportTaskForRocket,
    getDeliveredTransportForCard,
    getActiveTransportForCard,
    listTransportArrivalEvents,
    listActiveTransports,
    unlockBluePositionWithFossil,
    markerBelongsToPlayer,
    getPlayerKeys,
    getPlayerKey,
    formatTraceLabel,
  });
});
