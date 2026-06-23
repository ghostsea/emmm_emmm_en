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

  root.SetiAlienBanrenma = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function (placement) {
  "use strict";

  const ALIEN_ID = "半人马";
  const CARD_BACK_SRC = "../assets/aliens/半人马/cards/back.png";
  const CARD_BASE_PATH = "../assets/aliens/半人马/cards";
  const TOKEN_SRC = "../assets/aliens/半人马/token.webp";
  const MARK_BASE_PATH = "../assets/aliens/半人马";
  const TRACE_TYPES = Object.freeze(["pink", "yellow", "blue"]);
  const TRACE_POSITIONS = Object.freeze([1, 2, 3, 4, 5]);
  const TRACE_POSITION_COUNT = 5;
  const SCORE_MARK_DELTA = 15;
  const BONUS_POSITIONS = Object.freeze([1, 2, 3, 4]);
  const EFFECT_GAIN_INCOME = "banrenma_gain_income";

  const CARD_DEFINITIONS = Object.freeze([
    Object.freeze({ index: 0, cardId: "banrenma_0.webp", asset: "0.webp", cardName: "半人马 0", price: 1, cardTypeCode: 4, discardActionCode: 5, scanActionCode: 1, incomeCode: 1 }),
    Object.freeze({ index: 1, cardId: "banrenma_1.webp", asset: "1.webp", cardName: "半人马 1", price: 1, cardTypeCode: 4, discardActionCode: 4, scanActionCode: 2, incomeCode: 0 }),
    Object.freeze({ index: 2, cardId: "banrenma_2.webp", asset: "2.webp", cardName: "半人马 2", price: 1, cardTypeCode: 4, discardActionCode: 5, scanActionCode: 1, incomeCode: 3 }),
    Object.freeze({ index: 3, cardId: "banrenma_3.webp", asset: "3.webp", cardName: "半人马 3", price: 2, cardTypeCode: 4, discardActionCode: 3, scanActionCode: 2, incomeCode: 3 }),
    Object.freeze({ index: 4, cardId: "banrenma_4.webp", asset: "4.webp", cardName: "半人马 4", price: 1, cardTypeCode: 4, discardActionCode: 3, scanActionCode: 0, incomeCode: 4 }),
    Object.freeze({ index: 5, cardId: "banrenma_5.webp", asset: "5.webp", cardName: "半人马 5", price: 2, cardTypeCode: 4, discardActionCode: 4, scanActionCode: 3, incomeCode: 1 }),
    Object.freeze({ index: 6, cardId: "banrenma_6.webp", asset: "6.webp", cardName: "半人马 6", price: 1, cardTypeCode: 4, discardActionCode: 3, scanActionCode: 0, incomeCode: 2 }),
    Object.freeze({ index: 7, cardId: "banrenma_7.webp", asset: "7.webp", cardName: "半人马 7", price: 2, cardTypeCode: 4, discardActionCode: 5, scanActionCode: 1, incomeCode: 4 }),
    Object.freeze({ index: 8, cardId: "banrenma_8.webp", asset: "8.webp", cardName: "半人马 8", price: 2, cardTypeCode: 4, discardActionCode: 3, scanActionCode: 0, incomeCode: 3 }),
    Object.freeze({ index: 9, cardId: "banrenma_9.webp", asset: "9.webp", cardName: "半人马 9", price: 1, cardTypeCode: 4, discardActionCode: 4, scanActionCode: 2, incomeCode: 4 }),
  ]);

  const CARD_BY_INDEX = Object.freeze(Object.fromEntries(CARD_DEFINITIONS.map((card) => [card.index, card])));
  const CARD_BY_ID = Object.freeze(Object.fromEntries(CARD_DEFINITIONS.map((card) => [card.cardId, card])));

  const TRACE_REWARDS = Object.freeze({
    pink: Object.freeze({
      1: Object.freeze({ payData: 1, gain: Object.freeze({ score: 6 }), pickAlienCard: false }),
      2: Object.freeze({ payData: 3, gain: Object.freeze({ score: 15 }), pickAlienCard: false }),
      3: Object.freeze({ payData: 0, gain: Object.freeze({ score: 5 }), pickAlienCard: false }),
      4: Object.freeze({ payData: 0, gain: Object.freeze({ score: 3 }), pickAlienCard: true }),
      5: Object.freeze({ payData: 0, gain: Object.freeze({ score: 5 }), pickAlienCard: true }),
    }),
    yellow: Object.freeze({
      1: Object.freeze({ payData: 1, gain: Object.freeze({ score: 6 }), pickAlienCard: false }),
      2: Object.freeze({ payData: 3, gain: Object.freeze({ score: 15 }), pickAlienCard: false }),
      3: Object.freeze({ payData: 0, gain: Object.freeze({ score: 5 }), pickAlienCard: false }),
      4: Object.freeze({ payData: 0, gain: Object.freeze({ score: 3 }), pickAlienCard: true }),
      5: Object.freeze({ payData: 0, gain: Object.freeze({ score: 5 }), pickAlienCard: true }),
    }),
    blue: Object.freeze({
      1: Object.freeze({ payData: 1, gain: Object.freeze({ score: 6 }), pickAlienCard: false }),
      2: Object.freeze({ payData: 3, gain: Object.freeze({ score: 15 }), pickAlienCard: false }),
      3: Object.freeze({ payData: 0, gain: Object.freeze({ score: 5 }), pickAlienCard: false }),
      4: Object.freeze({ payData: 0, gain: Object.freeze({ score: 3 }), pickAlienCard: true }),
      5: Object.freeze({ payData: 0, gain: Object.freeze({ score: 5 }), pickAlienCard: true }),
    }),
  });

  const BONUS_REWARDS = Object.freeze({
    1: Object.freeze({ alienTrace: true, label: "任意外星人痕迹" }),
    2: Object.freeze({ pickAlienCard: true, gain: Object.freeze({ energy: 1 }), label: "外星人牌和1能量" }),
    3: Object.freeze({ gain: Object.freeze({ publicity: 3 }), label: "3宣传" }),
    4: Object.freeze({ gain: Object.freeze({ score: 8 }), label: "8分" }),
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

  function gainIncomeEffect(id, label, gain) {
    return effect(id, EFFECT_GAIN_INCOME, label, "income", { gain });
  }

  function drawCardsEffect(id, label, count) {
    return effect(id, "draw_cards", label, "blind_card", { count });
  }

  function pickCardEffect(id, label) {
    return effect(id, "pick_card", label || "精选1张牌", "pick_card", { count: 1 });
  }

  function launchEffect(id, label) {
    return effect(id, "launch", label || "发射", "launch", { skipCost: true, cost: {}, source: "banrenma" });
  }

  function researchTechEffect(id, label, techTypes) {
    return effect(id, "card_research_tech", label, "research_tech", {
      skipCost: true,
      techTypes: Object.freeze([...techTypes]),
    });
  }

  function alienTraceEffect(id, label, traceType = null) {
    return effect(id, "alien_trace", label, traceType ? `alien_${traceType}` : "alien_trace", {
      traceType,
    });
  }

  function buildImmediateEffects(cardOrIndex) {
    const index = getCardDefinition(cardOrIndex)?.index;
    switch (index) {
      case 0:
        return [drawCardsEffect("banrenma-0-draw", "半人马0：1盲抽", 1)];
      case 1:
        return [gainResourcesEffect("banrenma-1-publicity", "半人马1：2宣传", { publicity: 2 })];
      case 2:
        return [gainDataEffect("banrenma-2-data", "半人马2：2数据", 2)];
      case 3:
        return [researchTechEffect("banrenma-3-blue-tech", "半人马3：蓝色科技", ["blue"])];
      case 4:
        return [gainResourcesEffect("banrenma-4-resources", "半人马4：1宣传，1信用点", { publicity: 1, credits: 1 })];
      case 5:
        return [pickCardEffect("banrenma-5-pick", "半人马5：精选1张牌")];
      case 6:
        return [gainDataEffect("banrenma-6-data", "半人马6：1数据", 1)];
      case 7:
        return [researchTechEffect("banrenma-7-purple-tech", "半人马7：粉紫科技", ["purple"])];
      case 8:
        return [
          effect("banrenma-8-scan-1", "card_any_sector_scan", "半人马8：选择扇区扫描 1/2", "scan", { gainData: true }),
          effect("banrenma-8-scan-2", "card_any_sector_scan", "半人马8：选择扇区扫描 2/2", "scan", { gainData: true }),
        ];
      case 9:
        return [launchEffect("banrenma-9-launch", "半人马9：发射")];
      default:
        return [];
    }
  }

  function buildConditionEffects(cardOrIndex) {
    const index = getCardDefinition(cardOrIndex)?.index;
    switch (index) {
      case 0:
        return [alienTraceEffect("banrenma-0-pink-trace", "半人马0：粉色外星人痕迹", "pink")];
      case 1:
        return [alienTraceEffect("banrenma-1-blue-trace", "半人马1：蓝色外星人痕迹", "blue")];
      case 2:
      case 3:
      case 8:
        return [gainIncomeEffect(`banrenma-${index}-income-data`, `半人马${index}：收入增加1数据`, { availableData: 1 })];
      case 4:
      case 7:
      case 9:
        return [gainIncomeEffect(`banrenma-${index}-income-publicity`, `半人马${index}：收入增加1宣传`, { publicity: 1 })];
      case 5:
        return [
          gainResourcesEffect("banrenma-5-credit", "半人马5：1信用点", { credits: 1 }),
          alienTraceEffect("banrenma-5-any-trace", "半人马5：任意外星人痕迹"),
        ];
      case 6:
        return [alienTraceEffect("banrenma-6-yellow-trace", "半人马6：黄色外星人痕迹", "yellow")];
      default:
        return [];
    }
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

  function createBanrenmaState() {
    return {
      revealedSlotId: null,
      revealedByPlayerId: null,
      revealedByPlayerColor: null,
      traceSlotsByAlienSlotId: {},
      nextTraceSequence: 1,
      scoreMarksByPlayerId: {},
      bonusSlots: {},
      displayedCardIndex: null,
      cardDeck: CARD_DEFINITIONS.map((card) => card.index),
      nextCardSequence: 1,
      nextScoreMarkId: 1,
      revealInitialized: false,
    };
  }

  function ensureBanrenmaState(alienState) {
    if (!alienState.banrenma || typeof alienState.banrenma !== "object") {
      alienState.banrenma = createBanrenmaState();
    }
    const banrenma = alienState.banrenma;
    if (!banrenma.traceSlotsByAlienSlotId) banrenma.traceSlotsByAlienSlotId = {};
    if (!banrenma.scoreMarksByPlayerId) banrenma.scoreMarksByPlayerId = {};
    if (!banrenma.bonusSlots) banrenma.bonusSlots = {};
    if (!Array.isArray(banrenma.cardDeck)) banrenma.cardDeck = CARD_DEFINITIONS.map((card) => card.index);
    if (!Number.isFinite(Number(banrenma.nextTraceSequence))) banrenma.nextTraceSequence = 1;
    if (!Number.isFinite(Number(banrenma.nextCardSequence))) banrenma.nextCardSequence = 1;
    if (!Number.isFinite(Number(banrenma.nextScoreMarkId))) banrenma.nextScoreMarkId = 1;
    if (typeof banrenma.revealInitialized !== "boolean") banrenma.revealInitialized = false;
    return banrenma;
  }

  function ensureTraceGrid(alienState, alienSlotId) {
    const banrenma = ensureBanrenmaState(alienState);
    const key = String(alienSlotId);
    if (!banrenma.traceSlotsByAlienSlotId[key]) {
      banrenma.traceSlotsByAlienSlotId[key] = createTraceGrid();
    }
    return banrenma.traceSlotsByAlienSlotId[key];
  }

  function getTraceGrid(alienState, alienSlotId) {
    return alienState?.banrenma?.traceSlotsByAlienSlotId?.[String(alienSlotId)] || null;
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

  function isBanrenmaAlienSlot(alienState, alienSlotId) {
    const slot = alienState?.aliens?.[alienSlotId];
    return slot?.alienId === ALIEN_ID || slot?.assignedAlienId === ALIEN_ID;
  }

  function isBanrenmaRevealedSlot(alienState, alienSlotId) {
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
      return { ok: false, message: `半人马不支持的痕迹颜色 ${traceType}` };
    }
    if (!normalizedPosition) {
      return { ok: false, message: `半人马不支持的痕迹位置 ${position}` };
    }
    return { ok: true, position: normalizedPosition };
  }

  function createTraceEntry(alienState, player, traceType, position, options = {}) {
    const banrenma = ensureBanrenmaState(alienState);
    const sequence = options.sequence || banrenma.nextTraceSequence;
    banrenma.nextTraceSequence = Math.max(banrenma.nextTraceSequence, sequence + 1);
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
      payData: Math.max(0, Math.round(Number(reward.payData) || 0)),
      gain: { ...(reward.gain || {}) },
      pickAlienCard: Boolean(reward.pickAlienCard),
      alienTrace: Boolean(reward.alienTrace),
      label: reward.label || null,
    };
  }

  function getTraceReward(traceType, position) {
    return cloneReward(TRACE_REWARDS[traceType]?.[position]);
  }

  function getBonusReward(position) {
    return cloneReward(BONUS_REWARDS[Math.round(Number(position))]);
  }

  function placeBanrenmaTrace(alienState, alienSlotId, traceType, position, player, options = {}) {
    if (!isBanrenmaRevealedSlot(alienState, alienSlotId) && !options.debugOnly) {
      return { ok: false, message: "半人马尚未揭示，不能放置半人马痕迹" };
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
      message: `半人马：放置${placement.getTraceTypeLabel(traceType)} ${normalizedPosition} 号位`,
    };
  }

  function getTraceEntries(grid, traceType, position) {
    const value = grid?.[traceType]?.[position];
    if (Number(position) === 1) return Array.isArray(value) ? value : [];
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

  function getCardDefinition(cardOrIndex) {
    if (cardOrIndex == null) return null;
    if (typeof cardOrIndex === "number") return CARD_BY_INDEX[Math.round(cardOrIndex)] || null;
    const cardId = typeof cardOrIndex === "string" ? cardOrIndex : cardOrIndex?.cardId || cardOrIndex?.id || "";
    const byId = CARD_BY_ID[cardId] || CARD_DEFINITIONS.find((card) => card.cardId === cardId || card.asset === cardId) || null;
    if (byId) return byId;
    if (isBanrenmaCard(cardOrIndex) && Number.isFinite(Number(cardOrIndex?.alienCardId))) {
      return CARD_BY_INDEX[Math.round(Number(cardOrIndex.alienCardId))] || null;
    }
    return null;
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

  function getPlayerMarkSrc(playerColor) {
    return `${MARK_BASE_PATH}/mark_${playerColor || "white"}.png`;
  }

  function createAlienCard(index, sequence = 0) {
    const definition = CARD_BY_INDEX[Math.round(Number(index))];
    if (!definition) return null;
    return {
      id: `alien-banrenma-${definition.index}-${sequence}`,
      cardId: definition.cardId,
      alienCardId: definition.index,
      set: "alien:半人马",
      cardName: definition.cardName,
      src: getCardSrc(definition.index),
      faceUp: true,
      price: definition.price,
      cardTypeCode: definition.cardTypeCode,
      discardActionCode: definition.discardActionCode,
      scanActionCode: definition.scanActionCode,
      incomeCode: definition.incomeCode,
      banrenmaCard: true,
    };
  }

  function drawDisplayedCardIndex(alienState, random = Math.random) {
    const banrenma = ensureBanrenmaState(alienState);
    if (!banrenma.cardDeck.length) banrenma.cardDeck = shuffle(CARD_DEFINITIONS.map((card) => card.index), random);
    const index = banrenma.cardDeck.shift();
    banrenma.displayedCardIndex = index;
    return index;
  }

  function takeDisplayedCard(alienState, random = Math.random) {
    const banrenma = ensureBanrenmaState(alienState);
    if (banrenma.displayedCardIndex == null) drawDisplayedCardIndex(alienState, random);
    const card = createAlienCard(banrenma.displayedCardIndex, banrenma.nextCardSequence);
    banrenma.nextCardSequence += 1;
    drawDisplayedCardIndex(alienState, random);
    return { ok: Boolean(card), card, message: card ? `获得半人马牌：${card.cardName}` : "没有可获得的半人马牌" };
  }

  function blindDrawCard(alienState, random = Math.random) {
    const banrenma = ensureBanrenmaState(alienState);
    if (!banrenma.cardDeck.length) banrenma.cardDeck = shuffle(CARD_DEFINITIONS.map((card) => card.index), random);
    const pickIndex = Math.floor(random() * banrenma.cardDeck.length);
    const [index] = banrenma.cardDeck.splice(pickIndex, 1);
    const card = createAlienCard(index, banrenma.nextCardSequence);
    banrenma.nextCardSequence += 1;
    if (banrenma.displayedCardIndex == null) drawDisplayedCardIndex(alienState, random);
    return { ok: Boolean(card), card, message: card ? `盲抽半人马牌：${card.cardName}` : "没有可盲抽的半人马牌" };
  }

  function getPlayerScoreMarks(alienState, player) {
    const key = getPlayerKey(player);
    if (!key) return [];
    const marks = alienState?.banrenma?.scoreMarksByPlayerId?.[key] || [];
    return marks.filter((mark) => !mark.resolved);
  }

  function addScoreMark(alienState, player, threshold, source = "panel", options = {}) {
    const banrenma = ensureBanrenmaState(alienState);
    const key = getPlayerKey(player);
    if (!key) return null;
    if (!Array.isArray(banrenma.scoreMarksByPlayerId[key])) banrenma.scoreMarksByPlayerId[key] = [];
    const id = options.id || `banrenma-mark-${banrenma.nextScoreMarkId++}`;
    const entry = {
      id,
      source,
      threshold: Math.max(0, Math.round(Number(threshold) || 0)),
      playerId: player?.id || player?.playerId || null,
      playerColor: getPlayerColor(player),
      playerLabel: player?.colorLabel || player?.name || player?.playerLabel || null,
      cardInstanceId: options.cardInstanceId || null,
      cardIndex: options.cardIndex ?? null,
      resolved: false,
      createdAt: options.createdAt || Date.now(),
    };
    banrenma.scoreMarksByPlayerId[key].push(entry);
    return entry;
  }

  function resolveScoreMark(alienState, player, markId) {
    const mark = getPlayerScoreMarks(alienState, player).find((item) => item.id === markId);
    if (!mark) return { ok: false, message: "找不到半人马分数标记" };
    mark.resolved = true;
    mark.resolvedAt = Date.now();
    return { ok: true, mark, message: `清除半人马分数标记 ${mark.threshold}` };
  }

  function getPendingPanelMark(alienState, player) {
    const score = Number(player?.resources?.score) || 0;
    return getPlayerScoreMarks(alienState, player)
      .filter((mark) => mark.source === "panel" && score >= Number(mark.threshold || 0))
      .sort((a, b) => a.threshold - b.threshold || String(a.id).localeCompare(String(b.id)))[0] || null;
  }

  function getPendingCardMarks(alienState, player) {
    const score = Number(player?.resources?.score) || 0;
    const marks = getPlayerScoreMarks(alienState, player)
      .filter((mark) => mark.source === "card" && score >= Number(mark.threshold || 0));
    return marks.sort((a, b) => a.threshold - b.threshold || String(a.id).localeCompare(String(b.id)));
  }

  function markBonusSlotUsed(alienState, player, position, markId) {
    const banrenma = ensureBanrenmaState(alienState);
    const normalizedPosition = Math.round(Number(position));
    if (!BONUS_POSITIONS.includes(normalizedPosition)) {
      return { ok: false, message: `半人马奖励位 ${position} 不存在` };
    }
    if (banrenma.bonusSlots[normalizedPosition]) {
      return { ok: false, message: `半人马 ${normalizedPosition} 号奖励位已使用` };
    }
    const entry = {
      position: normalizedPosition,
      markId: markId || null,
      playerId: player?.id || player?.playerId || null,
      playerColor: getPlayerColor(player),
      playerLabel: player?.colorLabel || player?.name || player?.playerLabel || null,
      usedAt: Date.now(),
    };
    banrenma.bonusSlots[normalizedPosition] = entry;
    return { ok: true, entry, reward: getBonusReward(normalizedPosition), message: `半人马：选择 ${normalizedPosition} 号奖励位` };
  }

  function getAvailableBonusPositions(alienState) {
    const slots = alienState?.banrenma?.bonusSlots || {};
    return BONUS_POSITIONS.filter((position) => !slots[position]);
  }

  function initializeBanrenmaReveal(alienState, alienSlotId, triggerPlayer, players, random = Math.random) {
    const banrenma = ensureBanrenmaState(alienState);

    if (banrenma.revealInitialized) {
      return {
        ok: true,
        alreadyInitialized: true,
        displayedCardIndex: banrenma.displayedCardIndex,
        message: "半人马已初始化",
      };
    }

    banrenma.revealedSlotId = Number(alienSlotId);
    banrenma.revealedByPlayerId = triggerPlayer?.id || null;
    banrenma.revealedByPlayerColor = getPlayerColor(triggerPlayer);
    banrenma.revealInitialized = true;
    delete banrenma.traceSlotsByAlienSlotId[String(alienSlotId)];
    ensureTraceGrid(alienState, alienSlotId);
    banrenma.cardDeck = shuffle(CARD_DEFINITIONS.map((card) => card.index), random);
    banrenma.displayedCardIndex = drawDisplayedCardIndex(alienState, random);
    banrenma.bonusSlots = {};

    for (const player of players || []) {
      addScoreMark(alienState, player, (Number(player?.resources?.score) || 0) + SCORE_MARK_DELTA, "panel");
    }

    return {
      ok: true,
      displayedCardIndex: banrenma.displayedCardIndex,
      message: `半人马已揭示：每名玩家记录当前分数 +${SCORE_MARK_DELTA}`,
    };
  }

  function seedDebugTraceGrid(alienState, alienSlotId, player) {
    ensureBanrenmaState(alienState);
    delete alienState.banrenma.traceSlotsByAlienSlotId[String(alienSlotId)];
    ensureTraceGrid(alienState, alienSlotId);
    const placed = [];
    for (const traceType of TRACE_TYPES) {
      for (const position of TRACE_POSITIONS) {
        const result = placeBanrenmaTrace(alienState, alienSlotId, traceType, position, player, {
          debugOnly: true,
          placedAt: 0,
        });
        if (result.ok) placed.push(result.entry);
      }
    }
    return placed;
  }

  function isBanrenmaCard(card) {
    return Boolean(card?.banrenmaCard || card?.set === "alien:半人马" || String(card?.cardId || "").startsWith("banrenma_"));
  }

  function formatTraceLabel(traceType, position, stackIndex = null) {
    const suffix = Number(position) === 1 && stackIndex != null ? `#${stackIndex + 1}` : "";
    return `${placement.getTraceTypeLabel(traceType)} ${position}号位${suffix}`;
  }

  function formatScoreMark(mark) {
    if (!mark) return "无";
    return `${mark.playerColor || mark.playerId || "?"}:${mark.threshold}`;
  }

  return Object.freeze({
    ALIEN_ID,
    CARD_BACK_SRC,
    CARD_BASE_PATH,
    TOKEN_SRC,
    TRACE_TYPES,
    TRACE_POSITIONS,
    TRACE_POSITION_COUNT,
    TRACE_REWARDS,
    BONUS_POSITIONS,
    BONUS_REWARDS,
    SCORE_MARK_DELTA,
    EFFECT_GAIN_INCOME,
    CARD_DEFINITIONS,
    CARD_BY_INDEX,
    CARD_BY_ID,
    createBanrenmaState,
    ensureBanrenmaState,
    ensureTraceGrid,
    getTraceGrid,
    isBanrenmaAlienSlot,
    isBanrenmaRevealedSlot,
    getTraceReward,
    getBonusReward,
    placeBanrenmaTrace,
    listTraceEntries,
    getTraceEntries,
    initializeBanrenmaReveal,
    seedDebugTraceGrid,
    getCardSrc,
    getPlayerMarkSrc,
    createAlienCard,
    takeDisplayedCard,
    blindDrawCard,
    drawDisplayedCardIndex,
    getCardDefinition,
    isBanrenmaCard,
    buildImmediateEffects,
    buildConditionEffects,
    addScoreMark,
    resolveScoreMark,
    getPlayerScoreMarks,
    getPendingPanelMark,
    getPendingCardMarks,
    markBonusSlotUsed,
    getAvailableBonusPositions,
    markerBelongsToPlayer,
    getPlayerKeys,
    getPlayerKey,
    formatTraceLabel,
    formatScoreMark,
  });
});
