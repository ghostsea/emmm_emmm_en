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

  root.SetiAlienRunezu = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function (placement, state) {
  "use strict";

  const ALIEN_ID = "符文族";
  const CARD_BACK_SRC = "../assets/aliens/符文族/cards/back.jpg";
  const CARD_BASE_PATH = "../assets/aliens/符文族/cards";
  const SYMBOL_BASE_PATH = "../assets/aliens/符文族";
  const TRACE_TYPES = Object.freeze(["pink", "yellow", "blue"]);
  const TRACE_POSITIONS = Object.freeze([1, 2, 3, 4]);
  const SYMBOL_IDS = Object.freeze([
    "symbol_1",
    "symbol_2",
    "symbol_3",
    "symbol_4",
    "symbol_5",
    "symbol_6",
    "symbol_7",
  ]);
  const SYMBOL_LABELS = Object.freeze({
    symbol_1: "符文1",
    symbol_2: "符文2",
    symbol_3: "符文3",
    symbol_4: "符文4",
    symbol_5: "符文5",
    symbol_6: "符文6",
    symbol_7: "符文7",
  });
  const SYMBOL_COPIES_PER_TYPE = 5;
  const PLANET_SOURCE_IDS = Object.freeze(["mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune"]);
  const SECTOR_SOURCE_IDS = Object.freeze([
    "sector-1-a",
    "sector-1-b",
    "sector-2-a",
    "sector-2-b",
    "sector-3-a",
    "sector-3-b",
    "sector-4-a",
    "sector-4-b",
  ]);
  const TECH_SOURCE_IDS = Object.freeze([
    "orange1",
    "orange2",
    "orange3",
    "orange4",
    "purple1",
    "purple2",
    "purple3",
    "purple4",
    "blue1",
    "blue2",
    "blue3",
    "blue4",
  ]);
  const PANEL_SYMBOL_SLOTS = Object.freeze(["panel_1", "panel_2", "panel_3", "panel_4", "panel_5", "panel_6"]);
  const FACE_SYMBOL_POSITIONS = Object.freeze([1, 2, 3, 4, 5, 6, 7]);
  const PANEL_SYMBOL_SLOT_BY_TRACE_POSITION = Object.freeze({
    pink: Object.freeze({ 1: "panel_1", 4: "panel_4" }),
    yellow: Object.freeze({ 1: "panel_2", 4: "panel_5" }),
    blue: Object.freeze({ 1: "panel_3", 4: "panel_6" }),
  });
  const FACE_SYMBOL_DEPENDENCIES = Object.freeze({
    1: Object.freeze([4, 5]),
    2: Object.freeze([5, 6]),
    3: Object.freeze([6, 7]),
  });
  const FACE_REWARDS = Object.freeze({
    1: Object.freeze({ gain: Object.freeze({ energy: 1 }) }),
    2: Object.freeze({ gain: Object.freeze({ additionalPublicScan: 1 }) }),
    3: Object.freeze({ gain: Object.freeze({ credits: 1 }) }),
    4: Object.freeze({ drawCards: 1 }),
    5: Object.freeze({ gain: Object.freeze({ publicity: 1 }) }),
    6: Object.freeze({ dataCount: 1 }),
    7: Object.freeze({ gain: Object.freeze({ score: 3 }) }),
  });
  const TRACE_REWARDS = Object.freeze({
    1: Object.freeze({ panelSymbol: true, refillPanelSymbol: true }),
    2: Object.freeze({ gain: Object.freeze({ score: 2 }), pickAlienCard: true }),
    3: Object.freeze({ gain: Object.freeze({ score: 3 }), pickAlienCard: true }),
    4: Object.freeze({ gain: Object.freeze({ score: 7 }), panelSymbol: true }),
  });
  const SET_SCORES = Object.freeze({
    1: 1,
    2: 3,
    3: 5,
    4: 8,
    5: 11,
    6: 15,
    7: 20,
  });
  const EFFECT_TYPES = Object.freeze({
    SYMBOL_REWARD: "runezu_symbol_reward",
    SYMBOL_BRANCH: "runezu_symbol_branch",
  });

  const CARD_DEFINITIONS = Object.freeze([
    Object.freeze({
      index: 0,
      cardId: "runezu_0.webp",
      asset: "0.webp",
      cardName: "0",
      price: 1,
      cardTypeCode: 3,
      discardActionCode: "s_1",
      scanActionCode: 3,
      incomeCode: 2,
      finalRule: Object.freeze({ type: "runezuMaxSameSymbolCount", multiplier: 3 }),
    }),
    Object.freeze({
      index: 1,
      cardId: "runezu_1.webp",
      asset: "1.webp",
      cardName: "1",
      price: 1,
      cardTypeCode: 0,
      discardActionCode: "s_1",
      scanActionCode: 2,
      incomeCode: 1,
    }),
    Object.freeze({
      index: 2,
      cardId: "runezu_2.webp",
      asset: "2.webp",
      cardName: "2",
      price: 0,
      cardTypeCode: 1,
      discardActionCode: "s_7",
      scanActionCode: 0,
      incomeCode: 0,
      task: Object.freeze({
        id: "runezu-2-orbit-land",
        kind: "sequential-events",
        steps: Object.freeze([
          Object.freeze({ event: "orbitOrLand", symbolId: "symbol_4" }),
          Object.freeze({ event: "orbitOrLand", symbolId: "symbol_5" }),
          Object.freeze({ event: "orbitOrLand", symbolId: "symbol_3" }),
        ]),
      }),
    }),
    Object.freeze({
      index: 3,
      cardId: "runezu_3.webp",
      asset: "3.webp",
      cardName: "3",
      price: 0,
      cardTypeCode: 1,
      discardActionCode: "s_5",
      scanActionCode: 1,
      incomeCode: 2,
      task: Object.freeze({
        id: "runezu-3-tech",
        kind: "tech-types",
        steps: Object.freeze([
          Object.freeze({ event: "researchTech", techType: "orange", symbolId: "symbol_4" }),
          Object.freeze({ event: "researchTech", techType: "purple", symbolId: "symbol_1" }),
          Object.freeze({ event: "researchTech", techType: "blue", symbolId: "symbol_6" }),
        ]),
      }),
    }),
    Object.freeze({
      index: 4,
      cardId: "runezu_4.webp",
      asset: "4.webp",
      cardName: "4",
      price: 1,
      cardTypeCode: 1,
      discardActionCode: "s_5",
      scanActionCode: 0,
      incomeCode: 1,
      task: Object.freeze({
        id: "runezu-4-scan",
        kind: "sequential-events",
        steps: Object.freeze([
          Object.freeze({ event: "scanAction", symbolId: "symbol_4" }),
          Object.freeze({ event: "scanAction", symbolId: "symbol_2" }),
        ]),
      }),
    }),
    Object.freeze({
      index: 5,
      cardId: "runezu_5.webp",
      asset: "5.webp",
      cardName: "5",
      price: 1,
      cardTypeCode: 1,
      discardActionCode: "s_3",
      scanActionCode: 1,
      incomeCode: 2,
      task: Object.freeze({
        id: "runezu-5-trace",
        kind: "sequential-events",
        steps: Object.freeze([
          Object.freeze({ event: "alienTrace", symbolId: "symbol_6" }),
          Object.freeze({ event: "alienTrace", symbolId: "symbol_5" }),
          Object.freeze({ event: "alienTrace", symbolId: "symbol_2" }),
        ]),
      }),
    }),
    Object.freeze({
      index: 6,
      cardId: "runezu_6.webp",
      asset: "6.webp",
      cardName: "6",
      price: 1,
      cardTypeCode: 1,
      discardActionCode: "s_2",
      scanActionCode: 1,
      incomeCode: 0,
      task: Object.freeze({
        id: "runezu-6-launch",
        kind: "sequential-events",
        steps: Object.freeze([
          Object.freeze({ event: "launch", symbolId: "symbol_1" }),
          Object.freeze({ event: "launch", symbolId: "symbol_7" }),
        ]),
      }),
    }),
    Object.freeze({
      index: 7,
      cardId: "runezu_7.webp",
      asset: "7.webp",
      cardName: "7",
      price: 1,
      cardTypeCode: 0,
      discardActionCode: "s_4",
      scanActionCode: 2,
      incomeCode: 1,
    }),
    Object.freeze({
      index: 8,
      cardId: "runezu_8.webp",
      asset: "8.webp",
      cardName: "8",
      price: 1,
      cardTypeCode: 3,
      discardActionCode: "s_7",
      scanActionCode: 0,
      incomeCode: 0,
      finalRule: Object.freeze({ type: "runezuMaxSetSize", multiplier: 1 }),
    }),
    Object.freeze({
      index: 9,
      cardId: "runezu_9.webp",
      asset: "9.webp",
      cardName: "9",
      price: 2,
      cardTypeCode: 2,
      discardActionCode: "s_6",
      scanActionCode: 2,
      incomeCode: 2,
      task: Object.freeze({
        id: "runezu-9-three-traces",
        kind: "three-trace-colors",
        rewards: Object.freeze(["symbol_6", "symbol_3"]),
      }),
    }),
  ]);

  const CARD_BY_INDEX = Object.freeze(Object.fromEntries(CARD_DEFINITIONS.map((card) => [card.index, card])));
  const CARD_BY_ID = Object.freeze(Object.fromEntries(CARD_DEFINITIONS.map((card) => [card.cardId, card])));

  function effect(id, type, label, icon, options = {}) {
    return { id, type, label, icon, options: { ...options }, status: "pending" };
  }

  function gainResourcesEffect(id, label, gain) {
    return effect(id, "gain_resources", label, gain.score ? "score" : gain.energy ? "energy" : "publicity", { gain });
  }

  function gainDataEffect(id, label, count) {
    return effect(id, "gain_data", label, "data", { count });
  }

  function pickCardEffect(id, label) {
    return effect(id, "pick_card", label || "精选 1 张卡牌", "pick_card", { count: 1 });
  }

  function launchEffect(id, label) {
    return effect(id, "launch", label || "发射", "launch", { skipCost: true, cost: {}, source: "runezu" });
  }

  function symbolRewardEffect(id, symbolId, label = null) {
    return effect(id, EFFECT_TYPES.SYMBOL_REWARD, label || `${formatSymbolLabel(symbolId)}奖励`, symbolId, { symbolId });
  }

  function symbolBranchEffect(id, label, branches) {
    return effect(id, EFFECT_TYPES.SYMBOL_BRANCH, label, "runezuSymbolBack", {
      branches: branches.map((branch, index) => ({
        id: `${id}-branch-${index + 1}`,
        label: branch.map(formatSymbolLabel).join("+"),
        symbolIds: [...branch],
      })),
    });
  }

  function buildImmediateEffects(cardOrIndex) {
    const index = getCardDefinition(cardOrIndex)?.index;
    switch (index) {
      case 0:
        return [symbolBranchEffect("runezu-0-branch", "符文族0：选择一组符文奖励", [
          ["symbol_4", "symbol_7"],
          ["symbol_3", "symbol_2"],
        ])];
      case 1:
        return [symbolBranchEffect("runezu-1-branch", "符文族1：选择一组符文奖励", [
          ["symbol_2", "symbol_2", "symbol_6"],
          ["symbol_3", "symbol_3", "symbol_7"],
        ])];
      case 4:
        return [gainResourcesEffect("runezu-4-public-scan", "符文族4：1额外公共扫描", { additionalPublicScan: 1 })];
      case 5:
        return [pickCardEffect("runezu-5-pick", "符文族5：精选1张牌")];
      case 6:
        return [
          gainResourcesEffect("runezu-6-publicity", "符文族6：1宣传", { publicity: 1 }),
          gainDataEffect("runezu-6-data", "符文族6：1数据", 1),
        ];
      case 7:
        return [symbolBranchEffect("runezu-7-branch", "符文族7：选择一组符文奖励", [
          ["symbol_7", "symbol_7", "symbol_6"],
          ["symbol_5", "symbol_5", "symbol_1"],
        ])];
      case 8:
        return [symbolBranchEffect("runezu-8-branch", "符文族8：选择一组符文奖励", [
          ["symbol_4", "symbol_2"],
          ["symbol_3", "symbol_1"],
        ])];
      case 9:
        return [
          launchEffect("runezu-9-launch", "符文族9：发射"),
          symbolRewardEffect("runezu-9-s7", "symbol_7", "符文族9：符文7奖励"),
        ];
      default:
        return [];
    }
  }

  function cloneTask(task) {
    if (!task) return null;
    return structuredClone(task);
  }

  function tasksEqual(left, right) {
    return JSON.stringify(left || null) === JSON.stringify(right || null);
  }

  function ensureCardTask(card) {
    if (!card || typeof card !== "object") return getCardTask(card);
    const definitionTask = getCardDefinition(card)?.task;
    if (!definitionTask) return null;
    const canonicalTask = cloneTask(definitionTask);
    if (!tasksEqual(card.runezuTask, canonicalTask)) {
      card.runezuTask = canonicalTask;
    }
    return card.runezuTask;
  }

  function cloneReward(reward) {
    if (!reward) return null;
    return {
      gain: { ...(reward.gain || {}) },
      dataCount: Math.max(0, Math.round(Number(reward.dataCount) || 0)),
      drawCards: Math.max(0, Math.round(Number(reward.drawCards) || 0)),
      pickCard: Boolean(reward.pickCard),
      pickAlienCard: Boolean(reward.pickAlienCard),
      panelSymbol: Boolean(reward.panelSymbol),
      refillPanelSymbol: Boolean(reward.refillPanelSymbol),
      panelSymbolSlotId: reward.panelSymbolSlotId || null,
      symbolId: reward.symbolId || null,
    };
  }

  function getSymbolSrc(symbolId) {
    const id = String(symbolId || "");
    if (id === "symbol_2") return `${SYMBOL_BASE_PATH}/symbol_2.png`;
    return `${SYMBOL_BASE_PATH}/${id.replace("_", "-")}.png`;
  }

  function formatSymbolLabel(symbolId) {
    return SYMBOL_LABELS[symbolId] || symbolId || "符文";
  }

  function formatTraceLabel(traceType, position) {
    return `${placement.getTraceTypeLabel(traceType)} ${position}号位`;
  }

  function formatPanelSymbolSlotLabel(slotId) {
    const index = PANEL_SYMBOL_SLOTS.indexOf(slotId);
    return index >= 0 ? `白框${index + 1}` : slotId;
  }

  function formatFaceSymbolSlotLabel(position) {
    return `黑圈${Number(position) || position}`;
  }

  function shuffle(items, random = Math.random) {
    const result = [...items];
    for (let index = result.length - 1; index > 0; index -= 1) {
      const pickIndex = Math.floor(random() * (index + 1));
      [result[index], result[pickIndex]] = [result[pickIndex], result[index]];
    }
    return result;
  }

  function buildSymbolBag(random = Math.random) {
    const bag = [];
    for (const symbolId of SYMBOL_IDS) {
      for (let index = 0; index < SYMBOL_COPIES_PER_TYPE; index += 1) {
        bag.push(symbolId);
      }
    }
    return shuffle(bag, random);
  }

  function drawSymbol(runezuState, random = Math.random) {
    if (!Array.isArray(runezuState.availableSymbols)) runezuState.availableSymbols = buildSymbolBag(random);
    if (!runezuState.availableSymbols.length) {
      const pick = Math.floor(random() * SYMBOL_IDS.length);
      return SYMBOL_IDS[pick] || SYMBOL_IDS[0];
    }
    return runezuState.availableSymbols.shift();
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

  function createRunezuState() {
    return {
      revealedSlotId: null,
      revealedByPlayerId: null,
      revealedByPlayerColor: null,
      traceSlotsByAlienSlotId: {},
      nextTraceSequence: 1,
      availableSymbols: [],
      sourceSymbolSlots: {},
      panelSymbolSlots: {},
      faceSymbolSlots: {},
      displayedCardIndex: null,
      cardDeck: CARD_DEFINITIONS.map((card) => card.index),
      nextCardSequence: 1,
      revealInitialized: false,
    };
  }

  function ensureRunezuState(alienState) {
    if (!alienState.runezu || typeof alienState.runezu !== "object") {
      alienState.runezu = createRunezuState();
    }
    const runezu = alienState.runezu;
    if (!runezu.traceSlotsByAlienSlotId) runezu.traceSlotsByAlienSlotId = {};
    if (!Number.isFinite(Number(runezu.nextTraceSequence))) runezu.nextTraceSequence = 1;
    if (!Array.isArray(runezu.availableSymbols)) runezu.availableSymbols = [];
    if (!runezu.sourceSymbolSlots) runezu.sourceSymbolSlots = {};
    if (!runezu.panelSymbolSlots) runezu.panelSymbolSlots = {};
    if (!runezu.faceSymbolSlots) runezu.faceSymbolSlots = {};
    if (!Array.isArray(runezu.cardDeck)) runezu.cardDeck = CARD_DEFINITIONS.map((card) => card.index);
    if (!Number.isFinite(Number(runezu.nextCardSequence))) runezu.nextCardSequence = 1;
    if (typeof runezu.revealInitialized !== "boolean") runezu.revealInitialized = false;
    return runezu;
  }

  function ensurePlayerRunezuState(player) {
    if (!player) return null;
    if (!player.runezuSymbols || typeof player.runezuSymbols !== "object") {
      player.runezuSymbols = {};
    }
    for (const symbolId of SYMBOL_IDS) {
      player.runezuSymbols[symbolId] = Math.max(0, Math.round(Number(player.runezuSymbols[symbolId]) || 0));
    }
    return player.runezuSymbols;
  }

  function getPlayerSymbolCounts(player) {
    const symbols = ensurePlayerRunezuState(player) || {};
    return Object.fromEntries(SYMBOL_IDS.map((symbolId) => [symbolId, Math.max(0, Math.round(Number(symbols[symbolId]) || 0))]));
  }

  function gainPlayerSymbol(player, symbolId, count = 1) {
    if (!SYMBOL_IDS.includes(symbolId) || !player) return false;
    const symbols = ensurePlayerRunezuState(player);
    symbols[symbolId] = Math.max(0, Math.round(Number(symbols[symbolId]) || 0)) + Math.max(1, Math.round(Number(count) || 1));
    return true;
  }

  function spendPlayerSymbol(player, symbolId) {
    if (!SYMBOL_IDS.includes(symbolId) || !player) return false;
    const symbols = ensurePlayerRunezuState(player);
    if (symbols[symbolId] <= 0) return false;
    symbols[symbolId] -= 1;
    return true;
  }

  function getPlayerKeys(player) {
    return new Set([player?.id, player?.playerId, player?.color, player?.playerColor].filter(Boolean));
  }

  function markerBelongsToPlayer(marker, playerKeys) {
    return playerKeys.has(marker?.playerId) || playerKeys.has(marker?.playerColor) || playerKeys.has(marker?.color);
  }

  function countStateTraceMarkers(alienState, player, traceType = null, alienSlotId = alienState?.runezu?.revealedSlotId) {
    if (!state?.countTraceMarkersForPlayerOnSlot || alienSlotId == null) return 0;
    return state.countTraceMarkersForPlayerOnSlot(alienState, alienSlotId, player, traceType);
  }

  function isRunezuAlienSlot(alienState, alienSlotId) {
    const slot = alienState?.aliens?.[alienSlotId];
    return slot?.alienId === ALIEN_ID || slot?.assignedAlienId === ALIEN_ID;
  }

  function isRunezuRevealedSlot(alienState, alienSlotId) {
    const slot = alienState?.aliens?.[alienSlotId];
    return Boolean(slot?.revealed && slot.alienId === ALIEN_ID);
  }

  function ensureTraceGrid(alienState, alienSlotId) {
    const runezu = ensureRunezuState(alienState);
    const key = String(alienSlotId);
    if (!runezu.traceSlotsByAlienSlotId[key]) {
      runezu.traceSlotsByAlienSlotId[key] = createTraceGrid();
    }
    return runezu.traceSlotsByAlienSlotId[key];
  }

  function getTraceGrid(alienState, alienSlotId) {
    return alienState?.runezu?.traceSlotsByAlienSlotId?.[String(alienSlotId)] || null;
  }

  function normalizePosition(position) {
    const value = Math.round(Number(position));
    return TRACE_POSITIONS.includes(value) ? value : null;
  }

  function validateTraceTarget(traceType, position) {
    const normalizedPosition = normalizePosition(position);
    if (!TRACE_TYPES.includes(traceType)) return { ok: false, message: `符文族不支持的痕迹颜色 ${traceType}` };
    if (!normalizedPosition) return { ok: false, message: `符文族不支持的痕迹位置 ${position}` };
    return { ok: true, position: normalizedPosition };
  }

  function canPlaceRunezuTrace(alienState, alienSlotId, traceType, position, _player, options = {}) {
    if (!isRunezuRevealedSlot(alienState, alienSlotId) && !options.debugOnly) {
      return { ok: false, message: "符文族尚未揭示，不能放置符文族痕迹" };
    }
    const validation = validateTraceTarget(traceType, position);
    if (!validation.ok) return validation;
    const grid = getTraceGrid(alienState, alienSlotId) || ensureTraceGrid(alienState, alienSlotId);
    if (validation.position !== 1 && grid[traceType][validation.position]) {
      return { ok: false, message: `${placement.getTraceTypeLabel(traceType)} ${validation.position} 号位已经有痕迹` };
    }
    return { ok: true, position: validation.position };
  }

  function createTraceEntry(alienState, player, traceType, position, options = {}) {
    const runezu = ensureRunezuState(alienState);
    const sequence = options.sequence || runezu.nextTraceSequence;
    runezu.nextTraceSequence = Math.max(runezu.nextTraceSequence, sequence + 1);
    return {
      traceType,
      position,
      sequence,
      playerId: player?.id || player?.playerId || null,
      playerColor: player?.color || player?.playerColor || null,
      playerLabel: player?.colorLabel || player?.name || player?.playerLabel || null,
      debugOnly: Boolean(options.debugOnly),
      rewardApplied: Boolean(options.rewardApplied),
      placedAt: options.placedAt || Date.now(),
    };
  }

  function getTraceReward(_alienState, traceType, position) {
    const normalizedPosition = normalizePosition(position);
    const reward = cloneReward(TRACE_REWARDS[normalizedPosition]);
    if (!reward) return null;
    reward.panelSymbolSlotId = PANEL_SYMBOL_SLOT_BY_TRACE_POSITION[traceType]?.[normalizedPosition] || null;
    return reward;
  }

  function placeRunezuTrace(alienState, alienSlotId, traceType, position, player, options = {}) {
    const placementCheck = canPlaceRunezuTrace(alienState, alienSlotId, traceType, position, player, options);
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
    if (normalizedPosition === 1) {
      if (!Array.isArray(grid[traceType][1])) grid[traceType][1] = [];
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
      message: `符文族：放置${placement.getTraceTypeLabel(traceType)} ${normalizedPosition} 号位`,
    };
  }

  function getTraceEntries(grid, traceType, position) {
    const normalizedPosition = normalizePosition(position);
    const value = grid?.[traceType]?.[normalizedPosition];
    if (normalizedPosition === 1) return Array.isArray(value) ? value : [];
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

  function countTraceMarkers(alienState, player, traceType = null, alienSlotId = alienState?.runezu?.revealedSlotId) {
    const playerKeys = getPlayerKeys(player);
    const faceCount = listTraceEntries(alienState, alienSlotId, traceType)
      .filter((entry) => markerBelongsToPlayer(entry, playerKeys))
      .length;
    return countStateTraceMarkers(alienState, player, traceType, alienSlotId) + faceCount;
  }

  function playerHasAllTraceColors(alienState, player, alienSlotId = alienState?.runezu?.revealedSlotId) {
    return TRACE_TYPES.every((traceType) => countTraceMarkers(alienState, player, traceType, alienSlotId) > 0);
  }

  function createSourceKey(sourceType, sourceId) {
    return `${sourceType}:${sourceId}`;
  }

  function assignSourceSymbol(runezuState, sourceType, sourceId, random = Math.random) {
    const key = createSourceKey(sourceType, sourceId);
    if (runezuState.sourceSymbolSlots[key]) return runezuState.sourceSymbolSlots[key];
    const symbolId = drawSymbol(runezuState, random);
    const slot = {
      key,
      sourceType,
      sourceId,
      symbolId,
      claimedByPlayerId: null,
      claimedByPlayerColor: null,
      claimedAt: null,
    };
    runezuState.sourceSymbolSlots[key] = slot;
    return slot;
  }

  function listAvailableFirstTakeTechTileIds(techBoardState) {
    const stacks = techBoardState?.stacks || {};
    const result = [];
    for (const tileId of TECH_SOURCE_IDS) {
      const stack = stacks[tileId];
      if (!stack || stack.depleted || Number(stack.remaining) <= 0) continue;
      if (stack.firstTakeClaimedBy != null) continue;
      result.push(tileId);
    }
    return result;
  }

  function initializeSourceSymbols(runezuState, options = {}) {
    const random = options.random || Math.random;
    runezuState.sourceSymbolSlots = {};
    for (const planetId of PLANET_SOURCE_IDS) {
      assignSourceSymbol(runezuState, "planet", planetId, random);
    }
    for (const sectorId of SECTOR_SOURCE_IDS) {
      assignSourceSymbol(runezuState, "sector", sectorId, random);
    }
    const techIds = Array.isArray(options.techTileIds)
      ? options.techTileIds
      : listAvailableFirstTakeTechTileIds(options.techBoardState);
    for (const tileId of techIds) {
      if (TECH_SOURCE_IDS.includes(tileId)) assignSourceSymbol(runezuState, "tech", tileId, random);
    }
    return Object.values(runezuState.sourceSymbolSlots);
  }

  function initializePanelSymbols(runezuState, random = Math.random) {
    runezuState.panelSymbolSlots = {};
    PANEL_SYMBOL_SLOTS.forEach((slotId, index) => {
      runezuState.panelSymbolSlots[slotId] = {
        slotId,
        symbolId: drawSymbol(runezuState, random),
        sequence: index + 1,
      };
    });
    return Object.values(runezuState.panelSymbolSlots);
  }

  function initializeRunezuReveal(alienState, alienSlotId, triggerPlayer, options = {}) {
    const runezu = ensureRunezuState(alienState);
    if (runezu.revealInitialized) {
      return {
        ok: true,
        alreadyInitialized: true,
        displayedCardIndex: runezu.displayedCardIndex,
        message: "符文族已初始化",
      };
    }
    const random = options.random || Math.random;
    runezu.revealedSlotId = Number(alienSlotId);
    runezu.revealedByPlayerId = triggerPlayer?.id || null;
    runezu.revealedByPlayerColor = triggerPlayer?.color || triggerPlayer?.playerColor || null;
    runezu.revealInitialized = true;
    runezu.availableSymbols = buildSymbolBag(random);
    runezu.faceSymbolSlots = {};
    delete runezu.traceSlotsByAlienSlotId[String(alienSlotId)];
    ensureTraceGrid(alienState, alienSlotId);
    runezu.cardDeck = shuffle(CARD_DEFINITIONS.map((card) => card.index), random);
    runezu.displayedCardIndex = drawDisplayedCardIndex(alienState, random);
    const sources = initializeSourceSymbols(runezu, options);
    const panelSymbols = initializePanelSymbols(runezu, random);
    return {
      ok: true,
      displayedCardIndex: runezu.displayedCardIndex,
      sources,
      panelSymbols,
      message: `符文族已揭示：放置 ${sources.length} 个版图/科技 symbol 与 ${panelSymbols.length} 个面板 symbol`,
    };
  }


  function listPanelSymbols(alienState) {
    const runezu = ensureRunezuState(alienState);
    return PANEL_SYMBOL_SLOTS
      .map((slotId) => runezu.panelSymbolSlots?.[slotId])
      .filter(Boolean)
      .map((entry) => ({ ...entry }));
  }

  function listFaceSymbolSlots(alienState) {
    const runezu = ensureRunezuState(alienState);
    return FACE_SYMBOL_POSITIONS
      .map((position) => runezu.faceSymbolSlots?.[position])
      .filter(Boolean)
      .map((entry) => ({ ...entry, position: Number(entry.position) }));
  }


  function listSourceSymbols(alienState, sourceType = null) {
    const runezu = ensureRunezuState(alienState);
    return Object.values(runezu.sourceSymbolSlots || {})
      .filter((slot) => !sourceType || slot.sourceType === sourceType)
      .map((slot) => ({ ...slot }));
  }

  function claimSourceSymbol(alienState, sourceType, sourceId, player) {
    const runezu = ensureRunezuState(alienState);
    const key = createSourceKey(sourceType, sourceId);
    const slot = runezu.sourceSymbolSlots?.[key];
    if (!slot) return { ok: false, message: "该位置没有符文族 symbol" };
    if (slot.claimedByPlayerId || slot.claimedByPlayerColor) {
      return { ok: false, alreadyClaimed: true, message: "该符文族 symbol 已被获取" };
    }
    gainPlayerSymbol(player, slot.symbolId);
    slot.claimedByPlayerId = player?.id || null;
    slot.claimedByPlayerColor = player?.color || player?.playerColor || null;
    slot.claimedAt = Date.now();
    return {
      ok: true,
      sourceType,
      sourceId,
      symbolId: slot.symbolId,
      message: `获得${formatSymbolLabel(slot.symbolId)}`,
    };
  }

  function claimPlanetSymbol(alienState, planetId, player) {
    return claimSourceSymbol(alienState, "planet", planetId, player);
  }

  function claimSectorSymbol(alienState, sectorId, player) {
    return claimSourceSymbol(alienState, "sector", sectorId, player);
  }

  function claimTechSymbol(alienState, tileId, player) {
    return claimSourceSymbol(alienState, "tech", tileId, player);
  }

  function takePanelSymbol(alienState, slotId, player, options = {}) {
    const runezu = ensureRunezuState(alienState);
    const entry = runezu.panelSymbolSlots?.[slotId];
    if (!entry?.symbolId) return { ok: false, message: "该符文位置没有 symbol" };
    const symbolId = entry.symbolId;
    gainPlayerSymbol(player, symbolId);
    if (options.refill) {
      entry.symbolId = drawSymbol(runezu, options.random || Math.random);
      entry.sequence = Math.max(1, Math.round(Number(entry.sequence) || 1));
    } else {
      delete runezu.panelSymbolSlots[slotId];
    }
    return {
      ok: true,
      slotId,
      symbolId,
      refilledSymbolId: options.refill ? entry.symbolId : null,
      message: `获得${formatSymbolLabel(symbolId)}${options.refill ? "，已补充新 symbol" : ""}`,
    };
  }

  function getFaceReward(position) {
    return cloneReward(FACE_REWARDS[Math.round(Number(position))]);
  }

  function getTraceFaceRewardForSymbol(alienState, symbolId) {
    const runezu = ensureRunezuState(alienState);
    const entry = Object.values(runezu.faceSymbolSlots || {}).find((slot) => slot?.symbolId === symbolId);
    if (!entry) return {
      ok: false,
      message: `${formatSymbolLabel(symbolId)}尚未放入符文族黑圈，无法结算 s 奖励`,
    };
    return {
      ok: true,
      position: Number(entry.position),
      symbolId,
      reward: getFaceReward(entry.position),
      message: `${formatSymbolLabel(symbolId)}位于${formatFaceSymbolSlotLabel(entry.position)}`,
    };
  }

  function canPlaceFaceSymbol(alienState, position, player) {
    const runezu = ensureRunezuState(alienState);
    const normalizedPosition = Math.round(Number(position));
    if (!FACE_SYMBOL_POSITIONS.includes(normalizedPosition)) {
      return { ok: false, message: "无效的符文族黑圈位置" };
    }
    if (runezu.faceSymbolSlots?.[normalizedPosition]) {
      return { ok: false, message: `${formatFaceSymbolSlotLabel(normalizedPosition)}已经放置 symbol` };
    }
    const dependencies = FACE_SYMBOL_DEPENDENCIES[normalizedPosition] || [];
    const missing = dependencies.filter((dependency) => !runezu.faceSymbolSlots?.[dependency]);
    if (missing.length) {
      return { ok: false, message: `${formatFaceSymbolSlotLabel(normalizedPosition)}需要先放置 ${missing.map(formatFaceSymbolSlotLabel).join("、")}` };
    }
    const choices = listPlaceablePlayerSymbolsForFace(alienState, player);
    if (!choices.length) return { ok: false, message: "没有可放置到符文族黑圈的 symbol" };
    return { ok: true, position: normalizedPosition, choices };
  }

  function listPlaceablePlayerSymbolsForFace(alienState, player) {
    const runezu = ensureRunezuState(alienState);
    const placedSymbols = new Set(Object.values(runezu.faceSymbolSlots || {}).map((slot) => slot?.symbolId).filter(Boolean));
    const counts = getPlayerSymbolCounts(player);
    return SYMBOL_IDS
      .filter((symbolId) => counts[symbolId] > 0 && !placedSymbols.has(symbolId))
      .map((symbolId) => ({ symbolId, count: counts[symbolId], label: formatSymbolLabel(symbolId) }));
  }

  function placePlayerSymbolOnFace(alienState, position, player, symbolId) {
    const check = canPlaceFaceSymbol(alienState, position, player);
    if (!check.ok) return check;
    if (!SYMBOL_IDS.includes(symbolId)) return { ok: false, message: "无效的 symbol" };
    const allowed = check.choices.some((choice) => choice.symbolId === symbolId);
    if (!allowed) return { ok: false, message: "该 symbol 已放置或数量不足" };
    if (!spendPlayerSymbol(player, symbolId)) return { ok: false, message: "symbol 数量不足" };
    const runezu = ensureRunezuState(alienState);
    runezu.faceSymbolSlots[check.position] = {
      position: check.position,
      symbolId,
      playerId: player?.id || null,
      playerColor: player?.color || player?.playerColor || null,
      placedAt: Date.now(),
    };
    return {
      ok: true,
      position: check.position,
      symbolId,
      reward: getFaceReward(check.position),
      message: `将${formatSymbolLabel(symbolId)}放入${formatFaceSymbolSlotLabel(check.position)}`,
    };
  }

  function getCardDefinition(cardOrIndex) {
    if (cardOrIndex == null) return null;
    if (typeof cardOrIndex === "number") return CARD_BY_INDEX[Math.round(cardOrIndex)] || null;
    const cardId = typeof cardOrIndex === "string" ? cardOrIndex : cardOrIndex?.cardId || cardOrIndex?.id || "";
    const byId = CARD_BY_ID[cardId] || CARD_DEFINITIONS.find((card) => card.cardId === cardId || card.asset === cardId) || null;
    if (byId) return byId;
    if (isRunezuCard(cardOrIndex) && Number.isFinite(Number(cardOrIndex?.alienCardId))) {
      return CARD_BY_INDEX[Math.round(Number(cardOrIndex.alienCardId))] || null;
    }
    return null;
  }

  function getCardSrc(index) {
    return `${CARD_BASE_PATH}/${Math.round(Number(index))}.webp`;
  }

  function createAlienCard(index, sequence = 0) {
    const definition = CARD_BY_INDEX[Math.round(Number(index))];
    if (!definition) return null;
    return {
      id: `alien-runezu-${definition.index}-${sequence}`,
      cardId: definition.cardId,
      alienCardId: definition.index,
      set: "alien:符文族",
      cardName: definition.cardName,
      src: getCardSrc(definition.index),
      faceUp: true,
      price: definition.price,
      cardTypeCode: definition.cardTypeCode,
      discardActionCode: definition.discardActionCode,
      scanActionCode: definition.scanActionCode,
      incomeCode: definition.incomeCode,
      runezuCard: true,
      runezuTask: cloneTask(definition.task),
      runezuFinalRule: definition.finalRule ? { ...definition.finalRule } : null,
    };
  }

  function drawDisplayedCardIndex(alienState, random = Math.random) {
    const runezu = ensureRunezuState(alienState);
    if (!runezu.cardDeck.length) runezu.cardDeck = shuffle(CARD_DEFINITIONS.map((card) => card.index), random);
    const index = runezu.cardDeck.shift();
    runezu.displayedCardIndex = index;
    return index;
  }

  function takeDisplayedCard(alienState, random = Math.random) {
    const runezu = ensureRunezuState(alienState);
    if (runezu.displayedCardIndex == null) drawDisplayedCardIndex(alienState, random);
    const card = createAlienCard(runezu.displayedCardIndex, runezu.nextCardSequence);
    runezu.nextCardSequence += 1;
    drawDisplayedCardIndex(alienState, random);
    return { ok: Boolean(card), card, message: card ? `获得符文族牌：${card.cardName}` : "没有可获得的符文族牌" };
  }

  function blindDrawCard(alienState, random = Math.random) {
    const runezu = ensureRunezuState(alienState);
    if (!runezu.cardDeck.length) runezu.cardDeck = shuffle(CARD_DEFINITIONS.map((card) => card.index), random);
    const pickIndex = Math.floor(random() * runezu.cardDeck.length);
    const [index] = runezu.cardDeck.splice(pickIndex, 1);
    const card = createAlienCard(index, runezu.nextCardSequence);
    runezu.nextCardSequence += 1;
    if (runezu.displayedCardIndex == null) drawDisplayedCardIndex(alienState, random);
    return { ok: Boolean(card), card, message: card ? `盲抽符文族牌：${card.cardName}` : "没有可盲抽的符文族牌" };
  }

  function getCardTask(cardOrIndex) {
    return cloneTask(getCardDefinition(cardOrIndex)?.task);
  }

  function getFinalCardRule(cardOrIndex) {
    const rule = getCardDefinition(cardOrIndex)?.finalRule || cardOrIndex?.runezuFinalRule;
    return rule ? { ...rule } : null;
  }

  function isRunezuCard(card) {
    return Boolean(card?.runezuCard || card?.set === "alien:符文族" || String(card?.cardId || "").startsWith("runezu_"));
  }

  function getTaskProgress(card) {
    if (!card) return [];
    if (!Array.isArray(card.runezuTaskProgress)) card.runezuTaskProgress = [];
    return card.runezuTaskProgress;
  }

  function getTaskProgressIndexes(card) {
    if (!card || typeof card !== "object") return [];
    const task = ensureCardTask(card);
    if (!task || task.kind === "three-trace-colors") return [];
    const stepCount = Array.isArray(task.steps) ? task.steps.length : 0;
    return getTaskProgress(card)
      .map((_, index) => index + 1)
      .filter((index) => index <= stepCount);
  }

  function isTaskUnfinished(card) {
    const task = ensureCardTask(card);
    return Boolean(task && !card?.runezuTaskCompleted);
  }

  function eventMatchesTaskStep(event, step) {
    if (!event || !step) return false;
    if (step.event === "orbitOrLand") return event.type === "orbit" || event.type === "land" || event.type === "orbitOrLand";
    if (step.event === "researchTech") return event.type === "researchTech" && (!step.techType || event.techType === step.techType);
    if (step.event === "scan") return event.type === "scanAction";
    return event.type === step.event;
  }

  function consumeTaskEvents(card, events = []) {
    if (!card || typeof card !== "object") return null;
    const task = ensureCardTask(card);
    if (!task || card.runezuTaskCompleted) return null;
    const progress = getTaskProgress(card);
    if (task.kind === "three-trace-colors") return null;
    if (!Array.isArray(task.steps) || progress.length >= task.steps.length) return null;

    const rewards = [];
    for (const event of events || []) {
      const step = task.steps[progress.length];
      if (!eventMatchesTaskStep(event, step)) continue;
      progress.push({
        event: event.type,
        symbolId: step.symbolId,
        consumedAt: Date.now(),
      });
      rewards.push(step.symbolId);
      if (progress.length >= task.steps.length) break;
    }
    if (!rewards.length) return null;
    if (progress.length >= task.steps.length) card.runezuTaskCompleted = true;
    return {
      ok: true,
      card,
      task,
      symbolIds: rewards,
      completed: Boolean(card.runezuTaskCompleted),
      effects: rewards.map((symbolId, index) => symbolRewardEffect(
        `${card.id || card.cardId || "runezu-task"}-${progress.length}-${index}`,
        symbolId,
        `符文族任务：${formatSymbolLabel(symbolId)}奖励`,
      )),
    };
  }

  function getReadyThreeTraceTask(card, alienState, player) {
    const task = ensureCardTask(card);
    if (!task || task.kind !== "three-trace-colors" || card?.runezuTaskCompleted) return null;
    if (!playerHasAllTraceColors(alienState, player)) return null;
    const effects = (task.rewards || []).map((symbolId, index) => symbolRewardEffect(
      `${card.id || card.cardId || "runezu-three"}-${index}`,
      symbolId,
      `符文族任务：${formatSymbolLabel(symbolId)}奖励`,
    ));
    return {
      runezuTask: true,
      card,
      task,
      effects,
    };
  }

  function completeRunezuTask(card) {
    if (!card) return false;
    card.runezuTaskCompleted = true;
    return true;
  }

  function scorePlayerSymbols(player) {
    const counts = getPlayerSymbolCounts(player);
    const working = SYMBOL_IDS.map((symbolId) => counts[symbolId] || 0);
    let score = 0;
    while (working.some((count) => count > 0)) {
      const setSize = working.filter((count) => count > 0).length;
      score += SET_SCORES[setSize] || 0;
      for (let index = 0; index < working.length; index += 1) {
        if (working[index] > 0) working[index] -= 1;
      }
    }
    return score;
  }

  function getMaxSameSymbolCount(player) {
    const counts = getPlayerSymbolCounts(player);
    return Math.max(0, ...SYMBOL_IDS.map((symbolId) => counts[symbolId] || 0));
  }

  function getMaxSetSize(player) {
    const counts = getPlayerSymbolCounts(player);
    return SYMBOL_IDS.filter((symbolId) => (counts[symbolId] || 0) > 0).length;
  }

  function getPlayerSymbolSummary(player) {
    const counts = getPlayerSymbolCounts(player);
    return SYMBOL_IDS
      .filter((symbolId) => counts[symbolId] > 0)
      .map((symbolId) => `${formatSymbolLabel(symbolId)}x${counts[symbolId]}`)
      .join(" / ");
  }

  return Object.freeze({
    ALIEN_ID,
    CARD_BACK_SRC,
    TRACE_TYPES,
    TRACE_POSITIONS,
    SYMBOL_IDS,
    PANEL_SYMBOL_SLOTS,
    FACE_SYMBOL_POSITIONS,
    PLANET_SOURCE_IDS,
    SECTOR_SOURCE_IDS,
    TECH_SOURCE_IDS,
    EFFECT_TYPES,
    CARD_DEFINITIONS,
    createRunezuState,
    ensureRunezuState,
    ensurePlayerRunezuState,
    getPlayerSymbolCounts,
    gainPlayerSymbol,
    spendPlayerSymbol,
    getPlayerSymbolSummary,
    isRunezuAlienSlot,
    isRunezuRevealedSlot,
    ensureTraceGrid,
    getTraceGrid,
    canPlaceRunezuTrace,
    placeRunezuTrace,
    getTraceEntries,
    listTraceEntries,
    countTraceMarkers,
    playerHasAllTraceColors,
    initializeRunezuReveal,
    listPanelSymbols,
    listFaceSymbolSlots,
    listSourceSymbols,
    claimSourceSymbol,
    claimPlanetSymbol,
    claimSectorSymbol,
    claimTechSymbol,
    takePanelSymbol,
    canPlaceFaceSymbol,
    listPlaceablePlayerSymbolsForFace,
    placePlayerSymbolOnFace,
    getFaceReward,
    getTraceFaceRewardForSymbol,
    getCardDefinition,
    getCardSrc,
    getSymbolSrc,
    formatSymbolLabel,
    formatTraceLabel,
    formatPanelSymbolSlotLabel,
    formatFaceSymbolSlotLabel,
    createAlienCard,
    drawDisplayedCardIndex,
    takeDisplayedCard,
    blindDrawCard,
    getCardTask,
    ensureCardTask,
    getFinalCardRule,
    isRunezuCard,
    buildImmediateEffects,
    getTaskProgressIndexes,
    isTaskUnfinished,
    consumeTaskEvents,
    getReadyThreeTraceTask,
    completeRunezuTask,
    scorePlayerSymbols,
    getMaxSameSymbolCount,
    getMaxSetSize,
  });
});
