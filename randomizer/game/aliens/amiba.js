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

  root.SetiAlienAmiba = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function (placement) {
  "use strict";

  const ALIEN_ID = "阿米巴";
  const CARD_BACK_SRC = "../assets/aliens/阿米巴/cards/back.jpg";
  const CARD_BASE_PATH = "../assets/aliens/阿米巴/cards";
  const SYMBOL_BASE_PATH = "../assets/aliens/阿米巴";
  const TRACE_TYPES = Object.freeze(["pink", "yellow", "blue"]);
  const TRACE_POSITIONS = Object.freeze([1, 2, 3, 4]);
  const SYMBOL_IDS = Object.freeze(["symbol_1", "symbol_2", "symbol_3", "symbol_4", "symbol_5"]);
  const OUTER_SYMBOL_SLOTS = Object.freeze([
    "orange_1",
    "orange_2",
    "blue_1",
    "blue_2",
    "red_1",
    "red_2",
  ]);
  const INNER_SYMBOL_SLOTS = Object.freeze(["orange_3", "blue_3", "red_3"]);
  const INITIAL_SYMBOL_SLOTS = Object.freeze([
    "orange_1",
    "orange_2",
    "blue_3",
    "red_1",
    "red_2",
  ]);
  const REGION_SYMBOL_SLOTS = Object.freeze({
    orange: Object.freeze(["orange_1", "orange_2", "orange_3"]),
    red: Object.freeze(["red_1", "red_2", "red_3"]),
    blue: Object.freeze(["blue_1", "blue_2", "blue_3"]),
  });
  const SYMBOL_SLOT_LABELS = Object.freeze({
    orange_1: "橙1",
    orange_2: "橙2",
    orange_3: "橙3",
    blue_1: "蓝1",
    blue_2: "蓝2",
    blue_3: "蓝3",
    red_1: "红1",
    red_2: "红2",
    red_3: "红3",
  });
  const TRACE_REGION_BY_TYPE = Object.freeze({
    pink: "red",
    yellow: "orange",
    blue: "blue",
  });

  const SYMBOL_REWARDS = Object.freeze({
    symbol_1: Object.freeze({ gain: Object.freeze({ publicity: 1 }) }),
    symbol_2: Object.freeze({ dataCount: 1 }),
    symbol_3: Object.freeze({ gain: Object.freeze({ score: 4 }) }),
    symbol_4: Object.freeze({ drawCards: 1 }),
    symbol_5: Object.freeze({ gain: Object.freeze({ score: 2 }) }),
  });

  const TRACE_REWARDS = Object.freeze({
    pink: Object.freeze({
      1: Object.freeze({ region: "red" }),
      2: Object.freeze({ gain: Object.freeze({ score: 1 }), region: "red" }),
      3: Object.freeze({ pickAlienCard: true, region: "red" }),
      4: Object.freeze({ gain: Object.freeze({ score: 1 }), pickAlienCard: true, region: "red" }),
    }),
    yellow: Object.freeze({
      1: Object.freeze({ region: "orange" }),
      2: Object.freeze({ gain: Object.freeze({ score: 1 }), region: "orange" }),
      3: Object.freeze({ pickAlienCard: true, region: "orange" }),
      4: Object.freeze({ gain: Object.freeze({ score: 1 }), pickAlienCard: true, region: "orange" }),
    }),
    blue: Object.freeze({
      1: Object.freeze({ region: "blue" }),
      2: Object.freeze({ gain: Object.freeze({ score: 1 }), region: "blue" }),
      3: Object.freeze({ pickAlienCard: true, region: "blue" }),
      4: Object.freeze({ gain: Object.freeze({ score: 1 }), pickAlienCard: true, region: "blue" }),
    }),
  });

  const CARD_DEFINITIONS = Object.freeze([
    Object.freeze({ index: 0, cardId: "amiba_0.webp", asset: "0.webp", cardName: "自动分析", price: 2, cardTypeCode: 1, discardActionCode: 3, scanActionCode: 2, incomeCode: 2 }),
    Object.freeze({ index: 1, cardId: "amiba_1.webp", asset: "1.webp", cardName: "安全协议", price: 1, cardTypeCode: 1, discardActionCode: 5, scanActionCode: 1, incomeCode: 0 }),
    Object.freeze({ index: 2, cardId: "amiba_2.webp", asset: "2.webp", cardName: "科学论文", price: 1, cardTypeCode: 1, discardActionCode: 4, scanActionCode: 2, incomeCode: 0 }),
    Object.freeze({ index: 3, cardId: "amiba_3.webp", asset: "3.webp", cardName: "极端条件测试", price: 0, cardTypeCode: 0, discardActionCode: 3, scanActionCode: 3, incomeCode: 1 }),
    Object.freeze({ index: 4, cardId: "amiba_4.webp", asset: "4.webp", cardName: "起源地", price: 1, cardTypeCode: 0, discardActionCode: 5, scanActionCode: 0, incomeCode: 1 }),
    Object.freeze({ index: 5, cardId: "amiba_5.webp", asset: "5.webp", cardName: "生物特征筛选", price: 1, cardTypeCode: 3, discardActionCode: 4, scanActionCode: 1, incomeCode: 1 }),
    Object.freeze({ index: 6, cardId: "amiba_6.webp", asset: "6.webp", cardName: "物理表征", price: 1, cardTypeCode: 3, discardActionCode: 4, scanActionCode: 0, incomeCode: 2 }),
    Object.freeze({ index: 7, cardId: "amiba_7.webp", asset: "7.webp", cardName: "基因组表征", price: 1, cardTypeCode: 3, discardActionCode: 4, scanActionCode: 2, incomeCode: 0 }),
    Object.freeze({ index: 8, cardId: "amiba_8.webp", asset: "8.webp", cardName: "突破性理论", price: 1, cardTypeCode: 2, discardActionCode: 5, scanActionCode: 1, incomeCode: 2 }),
    Object.freeze({ index: 9, cardId: "amiba_9.webp", asset: "9.webp", cardName: "低重力研究", price: 2, cardTypeCode: 1, discardActionCode: 3, scanActionCode: 0, incomeCode: 1 }),
  ]);

  const CARD_BY_INDEX = Object.freeze(Object.fromEntries(CARD_DEFINITIONS.map((card) => [card.index, card])));
  const CARD_BY_ID = Object.freeze(Object.fromEntries(CARD_DEFINITIONS.map((card) => [card.cardId, card])));
  const CARD_TASKS = Object.freeze({
    8: Object.freeze({ id: "amiba-8-theory", kind: "three-traces-empty-slots" }),
  });
  const FINAL_TRACE_CARDS = Object.freeze({
    5: "pink",
    6: "yellow",
    7: "blue",
  });
  const EFFECT_TYPES = Object.freeze({
    CHOOSE_SYMBOL_REWARD: "amiba_choose_symbol_reward",
    REMOVE_TRACE_FOR_REGION_REWARD: "amiba_remove_trace_for_region_reward",
  });

  function effect(id, type, label, icon, options = {}) {
    return { id, type, label, icon, options: { ...options }, status: "pending" };
  }

  function gainResourcesEffect(id, label, gain) {
    return effect(id, "gain_resources", label, gain.score ? "score" : gain.energy ? "energy" : "publicity", { gain });
  }

  function gainDataEffect(id, label, count) {
    return effect(id, "gain_data", label, "data", { count });
  }

  function drawCardsEffect(id, label, count) {
    return effect(id, "draw_cards", label, "blind_card", { count });
  }

  function pickCardEffect(id, label) {
    return effect(id, "pick_card", label || "精选 1 张卡牌", "pick_card", { count: 1 });
  }

  function launchEffect(id, label) {
    return effect(id, "launch", label || "发射", "launch", { skipCost: true, cost: {}, source: "amiba" });
  }

  function symbolChoiceEffect(id, label, region) {
    return effect(id, EFFECT_TYPES.CHOOSE_SYMBOL_REWARD, label, "alien_trace", { region });
  }

  function removeTraceEffect(id, label) {
    return effect(id, EFFECT_TYPES.REMOVE_TRACE_FOR_REGION_REWARD, label, "alien_trace", {});
  }

  function buildImmediateEffects(cardOrIndex) {
    const index = getCardDefinition(cardOrIndex)?.index;
    switch (index) {
      case 0:
        return [
          gainDataEffect("amiba-0-data", "阿米巴0：3数据", 3),
          symbolChoiceEffect("amiba-0-blue-symbol", "阿米巴0：蓝色区域 symbol 奖励", "blue"),
        ];
      case 1:
        return [gainResourcesEffect("amiba-1-publicity", "阿米巴1：1宣传", { publicity: 1 })];
      case 2:
        return [drawCardsEffect("amiba-2-draw", "阿米巴2：2盲抽", 2)];
      case 3:
        return [removeTraceEffect("amiba-3-remove-trace", "阿米巴3：移除自己的 1 个阿米巴痕迹并结算区域奖励")];
      case 4:
        return [
          gainResourcesEffect("amiba-4-resources", "阿米巴4：1额外公共扫描，1宣传", { additionalPublicScan: 1, publicity: 1 }),
          symbolChoiceEffect("amiba-4-red-symbol", "阿米巴4：红色区域 symbol 奖励", "red"),
        ];
      case 5:
        return [
          pickCardEffect("amiba-5-pick", "阿米巴5：精选1张牌"),
          symbolChoiceEffect("amiba-5-red-symbol", "阿米巴5：红色区域 symbol 奖励", "red"),
        ];
      case 6:
        return [
          pickCardEffect("amiba-6-pick", "阿米巴6：精选1张牌"),
          symbolChoiceEffect("amiba-6-orange-symbol", "阿米巴6：橙色区域 symbol 奖励", "orange"),
        ];
      case 7:
        return [
          pickCardEffect("amiba-7-pick", "阿米巴7：精选1张牌"),
          symbolChoiceEffect("amiba-7-blue-symbol", "阿米巴7：蓝色区域 symbol 奖励", "blue"),
        ];
      case 8:
        return [gainResourcesEffect("amiba-8-publicity", "阿米巴8：3宣传", { publicity: 3 })];
      case 9:
        return [
          launchEffect("amiba-9-launch", "阿米巴9：发射"),
          symbolChoiceEffect("amiba-9-orange-symbol", "阿米巴9：橙色区域 symbol 奖励", "orange"),
        ];
      default:
        return [];
    }
  }

  function createTraceGrid() {
    const grid = {};
    for (const traceType of TRACE_TYPES) {
      grid[traceType] = {};
      for (const position of TRACE_POSITIONS) {
        grid[traceType][position] = null;
      }
    }
    return grid;
  }

  function createAmibaState() {
    return {
      revealedSlotId: null,
      revealedByPlayerId: null,
      revealedByPlayerColor: null,
      traceSlotsByAlienSlotId: {},
      nextTraceSequence: 1,
      symbolSlots: {},
      symbolsById: {},
      displayedCardIndex: null,
      cardDeck: CARD_DEFINITIONS.map((card) => card.index),
      nextCardSequence: 1,
      revealInitialized: false,
    };
  }

  function ensureAmibaState(alienState) {
    if (!alienState.amiba || typeof alienState.amiba !== "object") {
      alienState.amiba = createAmibaState();
    }
    const amiba = alienState.amiba;
    if (!amiba.traceSlotsByAlienSlotId) amiba.traceSlotsByAlienSlotId = {};
    if (!Number.isFinite(Number(amiba.nextTraceSequence))) amiba.nextTraceSequence = 1;
    if (!amiba.symbolSlots) amiba.symbolSlots = {};
    if (!amiba.symbolsById) amiba.symbolsById = {};
    if (!Array.isArray(amiba.cardDeck)) amiba.cardDeck = CARD_DEFINITIONS.map((card) => card.index);
    if (!Number.isFinite(Number(amiba.nextCardSequence))) amiba.nextCardSequence = 1;
    if (typeof amiba.revealInitialized !== "boolean") amiba.revealInitialized = false;
    return amiba;
  }

  function ensureTraceGrid(alienState, alienSlotId) {
    const amiba = ensureAmibaState(alienState);
    const key = String(alienSlotId);
    if (!amiba.traceSlotsByAlienSlotId[key]) {
      amiba.traceSlotsByAlienSlotId[key] = createTraceGrid();
    }
    return amiba.traceSlotsByAlienSlotId[key];
  }

  function getTraceGrid(alienState, alienSlotId) {
    return alienState?.amiba?.traceSlotsByAlienSlotId?.[String(alienSlotId)] || null;
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

  function isAmibaAlienSlot(alienState, alienSlotId) {
    const slot = alienState?.aliens?.[alienSlotId];
    return slot?.alienId === ALIEN_ID || slot?.assignedAlienId === ALIEN_ID;
  }

  function isAmibaRevealedSlot(alienState, alienSlotId) {
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
      return { ok: false, message: `阿米巴不支持的痕迹颜色 ${traceType}` };
    }
    if (!normalizedPosition) {
      return { ok: false, message: `阿米巴不支持的痕迹位置 ${position}` };
    }
    return { ok: true, position: normalizedPosition };
  }

  function canPlaceAmibaTrace(alienState, alienSlotId, traceType, position, _player, options = {}) {
    if (!isAmibaRevealedSlot(alienState, alienSlotId) && !options.debugOnly) {
      return { ok: false, message: "阿米巴尚未揭示，不能放置阿米巴痕迹" };
    }
    const validation = validateTraceTarget(traceType, position);
    if (!validation.ok) return validation;
    const grid = getTraceGrid(alienState, alienSlotId) || ensureTraceGrid(alienState, alienSlotId);
    if (grid[traceType][validation.position]) {
      return { ok: false, message: `${placement.getTraceTypeLabel(traceType)} ${validation.position} 号位已经有痕迹` };
    }
    return { ok: true, position: validation.position };
  }

  function createTraceEntry(alienState, player, traceType, position, options = {}) {
    const amiba = ensureAmibaState(alienState);
    const sequence = options.sequence || amiba.nextTraceSequence;
    amiba.nextTraceSequence = Math.max(amiba.nextTraceSequence, sequence + 1);
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
      region: reward.region || null,
    };
  }

  function getSymbolReward(symbolId) {
    return cloneReward(SYMBOL_REWARDS[symbolId]);
  }

  function getTraceReward(_alienState, traceType, position) {
    return cloneReward(TRACE_REWARDS[traceType]?.[normalizePosition(position)]);
  }

  function placeAmibaTrace(alienState, alienSlotId, traceType, position, player, options = {}) {
    const placementCheck = canPlaceAmibaTrace(alienState, alienSlotId, traceType, position, player, options);
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
      message: `阿米巴：放置${placement.getTraceTypeLabel(traceType)} ${normalizedPosition} 号位`,
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
      for (const position of TRACE_POSITIONS) {
        entries.push(...getTraceEntries(grid, type, position));
      }
    }
    return entries;
  }

  function removePlayerTrace(alienState, alienSlotId, traceType, position, player) {
    const normalizedPosition = normalizePosition(position);
    const grid = getTraceGrid(alienState, alienSlotId);
    const entry = grid?.[traceType]?.[normalizedPosition];
    if (!entry) return { ok: false, message: "该阿米巴痕迹位为空" };
    if (player && !markerBelongsToPlayer(entry, getPlayerKeys(player))) {
      return { ok: false, message: "只能移除自己的阿米巴痕迹" };
    }
    grid[traceType][normalizedPosition] = null;
    const region = TRACE_REGION_BY_TYPE[traceType] || null;
    return {
      ok: true,
      entry,
      traceType,
      position: normalizedPosition,
      reward: { region },
      message: `移除阿米巴${placement.getTraceTypeLabel(traceType)} ${normalizedPosition}号位`,
    };
  }

  function listPlayerTraceOptions(alienState, alienSlotId, player) {
    const playerKeys = getPlayerKeys(player);
    return listTraceEntries(alienState, alienSlotId)
      .filter((entry) => markerBelongsToPlayer(entry, playerKeys))
      .map((entry) => ({
        traceType: entry.traceType,
        position: entry.position,
        region: TRACE_REGION_BY_TYPE[entry.traceType],
        label: formatTraceLabel(entry.traceType, entry.position),
      }));
  }

  function shuffle(items, random = Math.random) {
    const result = [...items];
    for (let index = result.length - 1; index > 0; index -= 1) {
      const pickIndex = Math.floor(random() * (index + 1));
      [result[index], result[pickIndex]] = [result[pickIndex], result[index]];
    }
    return result;
  }

  function initializeSymbols(amibaState, random = Math.random) {
    amibaState.symbolSlots = {};
    amibaState.symbolsById = {};
    const shuffledSymbols = shuffle(SYMBOL_IDS, random);
    INITIAL_SYMBOL_SLOTS.forEach((slotId, index) => {
      const symbolId = shuffledSymbols[index];
      amibaState.symbolSlots[slotId] = symbolId;
      amibaState.symbolsById[symbolId] = {
        symbolId,
        slotId,
        sequence: index + 1,
      };
    });
    return Object.values(amibaState.symbolsById);
  }

  function initializeAmibaReveal(alienState, alienSlotId, triggerPlayer, random = Math.random) {
    const amiba = ensureAmibaState(alienState);
    if (amiba.revealInitialized) {
      return {
        ok: true,
        alreadyInitialized: true,
        displayedCardIndex: amiba.displayedCardIndex,
        message: "阿米巴已初始化",
      };
    }
    amiba.revealedSlotId = Number(alienSlotId);
    amiba.revealedByPlayerId = triggerPlayer?.id || null;
    amiba.revealedByPlayerColor = getPlayerColor(triggerPlayer);
    amiba.revealInitialized = true;
    delete amiba.traceSlotsByAlienSlotId[String(alienSlotId)];
    ensureTraceGrid(alienState, alienSlotId);
    amiba.cardDeck = shuffle(CARD_DEFINITIONS.map((card) => card.index), random);
    amiba.displayedCardIndex = drawDisplayedCardIndex(alienState, random);
    const symbols = initializeSymbols(amiba, random);
    return {
      ok: true,
      displayedCardIndex: amiba.displayedCardIndex,
      symbols,
      message: "阿米巴已揭示：5 个 symbol 已随机放置",
    };
  }

  function seedDebugSymbols(alienState) {
    const amiba = ensureAmibaState(alienState);
    amiba.symbolSlots = {};
    amiba.symbolsById = {};
    INITIAL_SYMBOL_SLOTS.forEach((slotId, index) => {
      const symbolId = SYMBOL_IDS[index];
      amiba.symbolSlots[slotId] = symbolId;
      amiba.symbolsById[symbolId] = { symbolId, slotId, sequence: index + 1, debugOnly: true };
    });
    return Object.values(amiba.symbolsById);
  }

  function seedDebugTraceGrid(alienState, alienSlotId, player) {
    ensureAmibaState(alienState);
    delete alienState.amiba.traceSlotsByAlienSlotId[String(alienSlotId)];
    ensureTraceGrid(alienState, alienSlotId);
    const placed = [];
    for (const traceType of TRACE_TYPES) {
      for (const position of TRACE_POSITIONS) {
        const result = placeAmibaTrace(alienState, alienSlotId, traceType, position, player, {
          debugOnly: true,
          placedAt: 0,
        });
        if (result.ok) placed.push(result.entry);
      }
    }
    return placed;
  }

  function getCardDefinition(cardOrIndex) {
    if (cardOrIndex == null) return null;
    if (typeof cardOrIndex === "number") return CARD_BY_INDEX[Math.round(cardOrIndex)] || null;
    const cardId = typeof cardOrIndex === "string" ? cardOrIndex : cardOrIndex?.cardId || cardOrIndex?.id || "";
    const byId = CARD_BY_ID[cardId] || CARD_DEFINITIONS.find((card) => card.cardId === cardId || card.asset === cardId) || null;
    if (byId) return byId;
    if (isAmibaCard(cardOrIndex) && Number.isFinite(Number(cardOrIndex?.alienCardId))) {
      return CARD_BY_INDEX[Math.round(Number(cardOrIndex.alienCardId))] || null;
    }
    return null;
  }

  function getCardSrc(index) {
    return `${CARD_BASE_PATH}/${Math.round(Number(index))}.webp`;
  }

  function getSymbolSrc(symbolId) {
    return `${SYMBOL_BASE_PATH}/${String(symbolId).replace("_", "-")}.png`;
  }

  function createAlienCard(index, sequence = 0) {
    const definition = CARD_BY_INDEX[Math.round(Number(index))];
    if (!definition) return null;
    return {
      id: `alien-amiba-${definition.index}-${sequence}`,
      cardId: definition.cardId,
      alienCardId: definition.index,
      set: "alien:阿米巴",
      cardName: definition.cardName,
      src: getCardSrc(definition.index),
      faceUp: true,
      price: definition.price,
      cardTypeCode: definition.cardTypeCode,
      discardActionCode: definition.discardActionCode,
      scanActionCode: definition.scanActionCode,
      incomeCode: definition.incomeCode,
      amibaCard: true,
      amibaTask: cloneTask(CARD_TASKS[definition.index]),
    };
  }

  function drawDisplayedCardIndex(alienState, random = Math.random) {
    const amiba = ensureAmibaState(alienState);
    if (!amiba.cardDeck.length) amiba.cardDeck = shuffle(CARD_DEFINITIONS.map((card) => card.index), random);
    const index = amiba.cardDeck.shift();
    amiba.displayedCardIndex = index;
    return index;
  }

  function takeDisplayedCard(alienState, random = Math.random) {
    const amiba = ensureAmibaState(alienState);
    if (amiba.displayedCardIndex == null) drawDisplayedCardIndex(alienState, random);
    const card = createAlienCard(amiba.displayedCardIndex, amiba.nextCardSequence);
    amiba.nextCardSequence += 1;
    drawDisplayedCardIndex(alienState, random);
    return { ok: Boolean(card), card, message: card ? `获得阿米巴牌：${card.cardName}` : "没有可获得的阿米巴牌" };
  }

  function blindDrawCard(alienState, random = Math.random) {
    const amiba = ensureAmibaState(alienState);
    if (!amiba.cardDeck.length) amiba.cardDeck = shuffle(CARD_DEFINITIONS.map((card) => card.index), random);
    const pickIndex = Math.floor(random() * amiba.cardDeck.length);
    const [index] = amiba.cardDeck.splice(pickIndex, 1);
    const card = createAlienCard(index, amiba.nextCardSequence);
    amiba.nextCardSequence += 1;
    if (amiba.displayedCardIndex == null) drawDisplayedCardIndex(alienState, random);
    return { ok: Boolean(card), card, message: card ? `盲抽阿米巴牌：${card.cardName}` : "没有可盲抽的阿米巴牌" };
  }

  function getSymbolEntry(alienState, slotId) {
    const amiba = ensureAmibaState(alienState);
    const symbolId = amiba.symbolSlots?.[slotId] || null;
    return symbolId ? amiba.symbolsById?.[symbolId] || null : null;
  }

  function listSymbols(alienState) {
    const amiba = ensureAmibaState(alienState);
    return Object.values(amiba.symbolsById || {}).sort((a, b) => (a.sequence || 0) - (b.sequence || 0));
  }

  function listSymbolsInRegion(alienState, region) {
    const slots = REGION_SYMBOL_SLOTS[region] || [];
    return slots
      .map((slotId) => getSymbolEntry(alienState, slotId))
      .filter(Boolean)
      .map((entry) => ({
        ...entry,
        reward: getSymbolReward(entry.symbolId),
        region,
      }));
  }

  function getSymbolResolutionOrder(slotIds) {
    const outer = slotIds
      .filter((slotId) => OUTER_SYMBOL_SLOTS.includes(slotId))
      .sort((a, b) => OUTER_SYMBOL_SLOTS.indexOf(b) - OUTER_SYMBOL_SLOTS.indexOf(a));
    const inner = slotIds
      .filter((slotId) => INNER_SYMBOL_SLOTS.includes(slotId))
      .sort((a, b) => INNER_SYMBOL_SLOTS.indexOf(a) - INNER_SYMBOL_SLOTS.indexOf(b));
    return [...outer, ...inner];
  }

  function getNextSymbolSlot(slotId) {
    const outerIndex = OUTER_SYMBOL_SLOTS.indexOf(slotId);
    if (outerIndex >= 0) {
      return OUTER_SYMBOL_SLOTS[(outerIndex + 1) % OUTER_SYMBOL_SLOTS.length];
    }
    const innerIndex = INNER_SYMBOL_SLOTS.indexOf(slotId);
    if (innerIndex >= 0) {
      return INNER_SYMBOL_SLOTS[(innerIndex - 1 + INNER_SYMBOL_SLOTS.length) % INNER_SYMBOL_SLOTS.length];
    }
    return null;
  }

  function moveSymbolFromSlot(alienState, slotId) {
    const amiba = ensureAmibaState(alienState);
    const symbolId = amiba.symbolSlots?.[slotId];
    if (!symbolId) return null;
    let nextSlotId = getNextSymbolSlot(slotId);
    const visited = new Set([slotId]);
    while (nextSlotId && amiba.symbolSlots[nextSlotId] && !visited.has(nextSlotId)) {
      visited.add(nextSlotId);
      nextSlotId = getNextSymbolSlot(nextSlotId);
    }
    if (!nextSlotId || nextSlotId === slotId || amiba.symbolSlots[nextSlotId]) {
      return { symbolId, fromSlotId: slotId, toSlotId: slotId, moved: false };
    }
    delete amiba.symbolSlots[slotId];
    amiba.symbolSlots[nextSlotId] = symbolId;
    if (!amiba.symbolsById[symbolId]) amiba.symbolsById[symbolId] = { symbolId };
    amiba.symbolsById[symbolId].slotId = nextSlotId;
    return { symbolId, fromSlotId: slotId, toSlotId: nextSlotId, moved: true };
  }

  function resolveSymbolAtSlot(alienState, slotId) {
    const entry = getSymbolEntry(alienState, slotId);
    if (!entry) return { ok: false, message: "该位置没有可结算的阿米巴 symbol" };
    const reward = getSymbolReward(entry.symbolId);
    const move = moveSymbolFromSlot(alienState, slotId);
    return {
      ok: true,
      symbolId: entry.symbolId,
      slotId,
      reward,
      move,
      message: `结算 ${entry.symbolId} 并移动至 ${move?.toSlotId || slotId}`,
    };
  }

  function resolveRegionReward(alienState, region) {
    const slots = REGION_SYMBOL_SLOTS[region] || [];
    const orderedSlots = getSymbolResolutionOrder(slots)
      .filter((slotId) => Boolean(getSymbolEntry(alienState, slotId)));
    const results = [];
    for (const slotId of orderedSlots) {
      const result = resolveSymbolAtSlot(alienState, slotId);
      if (result.ok) results.push(result);
    }
    return {
      ok: true,
      region,
      results,
      message: `${formatRegionLabel(region)}区域结算 ${results.length} 个 symbol`,
    };
  }

  function countTraceMarkers(alienState, player, traceType = null, alienSlotId = alienState?.amiba?.revealedSlotId) {
    const playerKeys = getPlayerKeys(player);
    return listTraceEntries(alienState, alienSlotId, traceType)
      .filter((entry) => markerBelongsToPlayer(entry, playerKeys))
      .length;
  }

  function countAllPanelTraceMarkers(alienState, alienSlotId = alienState?.amiba?.revealedSlotId) {
    return listTraceEntries(alienState, alienSlotId).length;
  }

  function hasPlayerTraceType(alienState, player, traceType) {
    return countTraceMarkers(alienState, player, traceType) > 0;
  }

  function isTheoryTaskReady(alienState, player) {
    return TRACE_TYPES.every((traceType) => hasPlayerTraceType(alienState, player, traceType));
  }

  function getTheoryTaskReward(alienState) {
    const occupied = countAllPanelTraceMarkers(alienState);
    const emptyCount = Math.max(0, TRACE_TYPES.length * TRACE_POSITIONS.length - occupied);
    return {
      emptyCount,
      effects: emptyCount > 0
        ? [gainResourcesEffect("amiba-8-task-score", `阿米巴8：空痕迹位 ${emptyCount} 分`, { score: emptyCount })]
        : [],
    };
  }

  function isAmibaCard(card) {
    return Boolean(card?.amibaCard || card?.set === "alien:阿米巴" || String(card?.cardId || "").startsWith("amiba_"));
  }

  function cloneTask(task) {
    return task ? { ...task } : null;
  }

  function getCardTask(cardOrIndex) {
    const index = getCardDefinition(cardOrIndex)?.index;
    return cloneTask(CARD_TASKS[index]);
  }

  function getFinalTraceTypeForCard(cardOrIndex) {
    const index = getCardDefinition(cardOrIndex)?.index;
    return FINAL_TRACE_CARDS[index] || null;
  }

  function formatTraceLabel(traceType, position) {
    return `${placement.getTraceTypeLabel(traceType)} ${position}号位`;
  }

  function formatRegionLabel(region) {
    const labels = { orange: "橙色", red: "红色", blue: "蓝色" };
    return labels[region] || region || "未知";
  }

  function formatSymbolReward(symbolId) {
    const reward = getSymbolReward(symbolId);
    const parts = [];
    if (reward?.gain?.score) parts.push(`${reward.gain.score}分`);
    if (reward?.gain?.credits) parts.push(`${reward.gain.credits}信用点`);
    if (reward?.gain?.energy) parts.push(`${reward.gain.energy}能量`);
    if (reward?.gain?.publicity) parts.push(`${reward.gain.publicity}宣传`);
    if (reward?.dataCount) parts.push(`${reward.dataCount}数据`);
    if (reward?.drawCards) parts.push(`${reward.drawCards}盲抽`);
    return parts.join(" + ") || "无奖励";
  }

  function formatSymbolSlotLabel(slotId) {
    return SYMBOL_SLOT_LABELS[slotId] || slotId || "";
  }

  return Object.freeze({
    ALIEN_ID,
    CARD_BACK_SRC,
    CARD_BASE_PATH,
    SYMBOL_BASE_PATH,
    TRACE_TYPES,
    TRACE_POSITIONS,
    SYMBOL_IDS,
    OUTER_SYMBOL_SLOTS,
    INNER_SYMBOL_SLOTS,
    INITIAL_SYMBOL_SLOTS,
    REGION_SYMBOL_SLOTS,
    SYMBOL_SLOT_LABELS,
    TRACE_REGION_BY_TYPE,
    SYMBOL_REWARDS,
    TRACE_REWARDS,
    CARD_DEFINITIONS,
    CARD_BY_INDEX,
    CARD_BY_ID,
    CARD_TASKS,
    EFFECT_TYPES,
    createAmibaState,
    ensureAmibaState,
    ensureTraceGrid,
    getTraceGrid,
    isAmibaAlienSlot,
    isAmibaRevealedSlot,
    canPlaceAmibaTrace,
    placeAmibaTrace,
    getTraceReward,
    getSymbolReward,
    listTraceEntries,
    getTraceEntries,
    removePlayerTrace,
    listPlayerTraceOptions,
    initializeAmibaReveal,
    seedDebugSymbols,
    seedDebugTraceGrid,
    getCardSrc,
    getSymbolSrc,
    createAlienCard,
    takeDisplayedCard,
    blindDrawCard,
    drawDisplayedCardIndex,
    getCardDefinition,
    buildImmediateEffects,
    isAmibaCard,
    getCardTask,
    getFinalTraceTypeForCard,
    isTheoryTaskReady,
    getTheoryTaskReward,
    countTraceMarkers,
    countAllPanelTraceMarkers,
    listSymbols,
    listSymbolsInRegion,
    getSymbolEntry,
    resolveSymbolAtSlot,
    resolveRegionReward,
    formatTraceLabel,
    formatRegionLabel,
    formatSymbolReward,
    formatSymbolSlotLabel,
    markerBelongsToPlayer,
    getPlayerKeys,
  });
});
