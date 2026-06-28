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

  root.SetiAlienFangzhou = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function (placement, state) {
  "use strict";

  const ALIEN_ID = "方舟";
  const CARD1_BACK_SRC = "../assets/aliens/方舟/cards/back.jpg";
  const CARD1_BASE_PATH = "../assets/aliens/方舟/cards";
  const CARD2_BASE_PATH = "../assets/aliens/方舟/cards2";
  const TRACE_TYPES = Object.freeze(["pink", "yellow", "blue"]);
  const TRACE_POSITIONS = Object.freeze([1, 2, 3, 4]);
  const TRACE_POSITION_COUNT = 4;
  const CARD1_RESHUFFLE_THRESHOLD = 5;
  const CARD2_VARIANTS_PER_COLOR = 4;
  const CARD2_PLAY_COST = Object.freeze({ credits: 2 });
  const CARD2_DISCARD_ACTION_CODE = "fangzhou_basic";
  const CARD2_UNLOCK_TRACE_REWARD = Object.freeze({ gain: Object.freeze({ score: 3 }) });
  const CARD2_CORNER_CODES = Object.freeze({
    pink: Object.freeze({
      1: Object.freeze({ scanActionCode: 1, incomeCode: 2 }),
      2: Object.freeze({ scanActionCode: 2, incomeCode: 1 }),
      3: Object.freeze({ scanActionCode: 0, incomeCode: 0 }),
      4: Object.freeze({ scanActionCode: 3, incomeCode: 1 }),
    }),
    yellow: Object.freeze({
      1: Object.freeze({ scanActionCode: 0, incomeCode: 2 }),
      2: Object.freeze({ scanActionCode: 1, incomeCode: 1 }),
      3: Object.freeze({ scanActionCode: 2, incomeCode: 0 }),
      4: Object.freeze({ scanActionCode: 3, incomeCode: 0 }),
    }),
    blue: Object.freeze({
      1: Object.freeze({ scanActionCode: 2, incomeCode: 2 }),
      2: Object.freeze({ scanActionCode: 0, incomeCode: 1 }),
      3: Object.freeze({ scanActionCode: 3, incomeCode: 2 }),
      4: Object.freeze({ scanActionCode: 1, incomeCode: 0 }),
    }),
  });

  const TRACE_REWARDS = Object.freeze({
    pink: Object.freeze({
      1: Object.freeze({ gain: Object.freeze({ score: 2 }), basicRewardCount: 1 }),
      2: Object.freeze({ gain: Object.freeze({}), basicRewardCount: 2 }),
      3: Object.freeze({ gain: Object.freeze({ score: 5 }), basicRewardCount: 1 }),
      4: Object.freeze({ gain: Object.freeze({ score: 7 }), basicRewardCount: 1 }),
    }),
    yellow: Object.freeze({
      1: Object.freeze({ gain: Object.freeze({ score: 2 }), basicRewardCount: 1 }),
      2: Object.freeze({ gain: Object.freeze({}), basicRewardCount: 2 }),
      3: Object.freeze({ gain: Object.freeze({ score: 5 }), basicRewardCount: 1 }),
      4: Object.freeze({ gain: Object.freeze({ score: 7 }), basicRewardCount: 1 }),
    }),
    blue: Object.freeze({
      1: Object.freeze({ gain: Object.freeze({ score: 2 }), basicRewardCount: 1 }),
      2: Object.freeze({ gain: Object.freeze({}), basicRewardCount: 2 }),
      3: Object.freeze({ gain: Object.freeze({ score: 5 }), basicRewardCount: 1 }),
      4: Object.freeze({ gain: Object.freeze({ score: 7 }), basicRewardCount: 1 }),
    }),
  });

  const UNLOCK_REQUIRED_BY_POSITION = Object.freeze({
    1: 0,
    2: 1,
    3: 2,
    4: 3,
  });

  const CARD1_DEFINITIONS = Object.freeze([
    Object.freeze({
      index: 0,
      label: "方舟奖励 0",
      basic: Object.freeze({ gain: Object.freeze({ score: 1, energy: 1 }) }),
      advanced: Object.freeze({ gain: Object.freeze({ energy: 2 }), alienTrace: "yellow" }),
    }),
    Object.freeze({
      index: 1,
      label: "方舟奖励 1",
      basic: Object.freeze({ gain: Object.freeze({ score: 1 }), blindDraw: 1 }),
      advanced: Object.freeze({ blindDraw: 2, scanAction: true }),
    }),
    Object.freeze({
      index: 2,
      label: "方舟奖励 2",
      basic: Object.freeze({ gain: Object.freeze({ publicity: 2 }) }),
      advanced: Object.freeze({ gain: Object.freeze({ publicity: 3 }), alienTrace: "blue" }),
    }),
    Object.freeze({
      index: 3,
      label: "方舟奖励 3",
      basic: Object.freeze({ gain: Object.freeze({ score: 1 }), additionalPublicScan: 1 }),
      advanced: Object.freeze({
        sectorScans: Object.freeze(["yellow", "red", "blue"]),
        extraSectorScan: true,
      }),
    }),
    Object.freeze({
      index: 4,
      label: "方舟奖励 4",
      basic: Object.freeze({ gain: Object.freeze({ score: 4 }) }),
      advanced: Object.freeze({ dataCount: 1, techAction: true }),
    }),
    Object.freeze({
      index: 5,
      label: "方舟奖励 5",
      basic: Object.freeze({ gain: Object.freeze({ score: 1, energy: 1 }) }),
      advanced: Object.freeze({ gain: Object.freeze({ energy: 4 }), additionalPublicScan: 1 }),
    }),
    Object.freeze({
      index: 6,
      label: "方舟奖励 6",
      basic: Object.freeze({ gain: Object.freeze({ score: 1, credits: 1 }) }),
      advanced: Object.freeze({ launchIgnoreLimit: true, alienTrace: "pink" }),
    }),
    Object.freeze({
      index: 7,
      label: "方舟奖励 7",
      basic: Object.freeze({ gain: Object.freeze({ score: 1 }), blindDraw: 1 }),
      advanced: Object.freeze({
        gain: Object.freeze({ publicity: 1, energy: 1, credits: 1 }),
        dataCount: 1,
        pickCard: true,
      }),
    }),
    Object.freeze({
      index: 8,
      label: "方舟奖励 8",
      basic: Object.freeze({ gain: Object.freeze({ score: 2, publicity: 1 }) }),
      advanced: Object.freeze({ launchIgnoreLimit: true, freeMoves: 3 }),
    }),
  ]);

  const CARD1_BY_INDEX = Object.freeze(Object.fromEntries(CARD1_DEFINITIONS.map((card) => [card.index, card])));

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

  function createPlayerCard2State() {
    const cards = {};
    for (const traceType of TRACE_TYPES) {
      cards[traceType] = {
        variant: null,
        status: "locked",
        unlocked: false,
      };
    }
    return {
      cards,
      unlockCount: 0,
    };
  }

  function createFangzhouState() {
    return {
      revealedSlotId: null,
      revealedByPlayerId: null,
      revealedByPlayerColor: null,
      traceSlotsByAlienSlotId: {},
      nextTraceSequence: 1,
      playerCard2ById: {},
      unlockCountByPlayerId: {},
      card1Deck: CARD1_DEFINITIONS.map((card) => card.index),
      card1Revealed: [],
      card1RevealedSinceShuffle: 0,
      displayedCard1Index: null,
      revealInitialized: false,
      pendingRevealBasicRewards: [],
    };
  }

  function ensureFangzhouState(alienState) {
    if (!alienState.fangzhou || typeof alienState.fangzhou !== "object") {
      alienState.fangzhou = createFangzhouState();
    }
    const fangzhou = alienState.fangzhou;
    if (!fangzhou.traceSlotsByAlienSlotId) fangzhou.traceSlotsByAlienSlotId = {};
    if (!fangzhou.playerCard2ById) fangzhou.playerCard2ById = {};
    if (!fangzhou.unlockCountByPlayerId) fangzhou.unlockCountByPlayerId = {};
    if (!Array.isArray(fangzhou.card1Deck)) fangzhou.card1Deck = CARD1_DEFINITIONS.map((card) => card.index);
    if (!Array.isArray(fangzhou.card1Revealed)) fangzhou.card1Revealed = [];
    if (!Number.isFinite(Number(fangzhou.card1RevealedSinceShuffle))) fangzhou.card1RevealedSinceShuffle = 0;
    if (!Number.isFinite(Number(fangzhou.nextTraceSequence))) fangzhou.nextTraceSequence = 1;
    if (!Array.isArray(fangzhou.pendingRevealBasicRewards)) fangzhou.pendingRevealBasicRewards = [];
    if (typeof fangzhou.revealInitialized !== "boolean") fangzhou.revealInitialized = false;
    return fangzhou;
  }

  function ensureTraceGrid(alienState, alienSlotId) {
    const fangzhou = ensureFangzhouState(alienState);
    const key = String(alienSlotId);
    if (!fangzhou.traceSlotsByAlienSlotId[key]) {
      fangzhou.traceSlotsByAlienSlotId[key] = createTraceGrid();
    }
    return fangzhou.traceSlotsByAlienSlotId[key];
  }

  function getTraceGrid(alienState, alienSlotId) {
    return alienState?.fangzhou?.traceSlotsByAlienSlotId?.[String(alienSlotId)] || null;
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

  function countStateTraceMarkers(alienState, player, traceType = null, alienSlotId = alienState?.fangzhou?.revealedSlotId) {
    if (!state?.countTraceMarkersForPlayerOnSlot || alienSlotId == null) return 0;
    return state.countTraceMarkersForPlayerOnSlot(alienState, alienSlotId, player, traceType);
  }

  function isFangzhouAlienSlot(alienState, alienSlotId) {
    const slot = alienState?.aliens?.[alienSlotId];
    return slot?.alienId === ALIEN_ID || slot?.assignedAlienId === ALIEN_ID;
  }

  function isFangzhouRevealedSlot(alienState, alienSlotId) {
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
      return { ok: false, message: `方舟不支持的痕迹颜色 ${traceType}` };
    }
    if (!normalizedPosition) {
      return { ok: false, message: `方舟不支持的痕迹位置 ${position}` };
    }
    return { ok: true, position: normalizedPosition };
  }

  function getUnlockCount(alienState, player) {
    const key = getPlayerKey(player);
    if (!key) return 0;
    return Number(alienState?.fangzhou?.unlockCountByPlayerId?.[key]) || 0;
  }

  function canPlaceFangzhouTrace(alienState, alienSlotId, traceType, position, player) {
    const validation = validateTraceTarget(traceType, position);
    if (!validation.ok) return validation;

    const normalizedPosition = validation.position;
    const requiredUnlock = UNLOCK_REQUIRED_BY_POSITION[normalizedPosition] || 0;
    const unlockCount = getUnlockCount(alienState, player);
    if (unlockCount < requiredUnlock) {
      return {
        ok: false,
        message: `${placement.getTraceTypeLabel(traceType)} ${normalizedPosition} 号位需要解锁数目 ${requiredUnlock}（当前 ${unlockCount}）`,
      };
    }

    const grid = getTraceGrid(alienState, alienSlotId) || ensureTraceGrid(alienState, alienSlotId);
    if (grid[traceType][normalizedPosition]) {
      return {
        ok: false,
        message: `${placement.getTraceTypeLabel(traceType)} ${normalizedPosition} 号位已经有痕迹`,
      };
    }

    return { ok: true, position: normalizedPosition };
  }

  function createTraceEntry(alienState, player, traceType, position, options = {}) {
    const fangzhou = ensureFangzhouState(alienState);
    const sequence = options.sequence || fangzhou.nextTraceSequence;
    fangzhou.nextTraceSequence = Math.max(fangzhou.nextTraceSequence, sequence + 1);
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
      basicRewardCount: Number(reward.basicRewardCount) || 0,
    };
  }

  function getTraceReward(traceType, position) {
    return cloneReward(TRACE_REWARDS[traceType]?.[position]);
  }

  function getCard2UnlockTraceReward() {
    return cloneReward(CARD2_UNLOCK_TRACE_REWARD);
  }

  function placeFangzhouTrace(alienState, alienSlotId, traceType, position, player, options = {}) {
    if (!isFangzhouRevealedSlot(alienState, alienSlotId) && !options.debugOnly) {
      return { ok: false, message: "方舟尚未揭示，不能放置方舟痕迹" };
    }

    if (!options.debugOnly) {
      const placementCheck = canPlaceFangzhouTrace(alienState, alienSlotId, traceType, position, player);
      if (!placementCheck.ok) return placementCheck;
    } else {
      const validation = validateTraceTarget(traceType, position);
      if (!validation.ok) return validation;
      const grid = ensureTraceGrid(alienState, alienSlotId);
      if (grid[traceType][validation.position]) {
        return {
          ok: false,
          message: `${placement.getTraceTypeLabel(traceType)} ${validation.position} 号位已经有痕迹`,
        };
      }
    }

    const validation = validateTraceTarget(traceType, position);
    const normalizedPosition = validation.position;
    const grid = ensureTraceGrid(alienState, alienSlotId);
    const reward = options.debugOnly ? null : getTraceReward(traceType, normalizedPosition);
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
      message: `方舟：放置${placement.getTraceTypeLabel(traceType)} ${normalizedPosition} 号位`,
    };
  }

  function getTraceEntries(grid, traceType, position) {
    const value = grid?.[traceType]?.[position];
    if (Array.isArray(value)) return value.length ? [value[0]] : [];
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

  function shuffle(items, random = Math.random) {
    const result = [...items];
    for (let index = result.length - 1; index > 0; index -= 1) {
      const pickIndex = Math.floor(random() * (index + 1));
      [result[index], result[pickIndex]] = [result[pickIndex], result[index]];
    }
    return result;
  }

  function pickRandomVariant(random = Math.random) {
    return 1 + Math.floor(random() * CARD2_VARIANTS_PER_COLOR);
  }

  function getCard2Src(traceType, variant) {
    return `${CARD2_BASE_PATH}/${traceType}_${variant}.png`;
  }

  function getCard1Src(index) {
    return `${CARD1_BASE_PATH}/${index}.webp`;
  }

  function getCard2CornerCodes(traceType, variant) {
    const normalizedVariant = Math.round(Number(variant) || 0);
    return CARD2_CORNER_CODES[traceType]?.[normalizedVariant] || {
      scanActionCode: 0,
      incomeCode: 0,
    };
  }

  function createCard2Definition(traceType, variant) {
    const cornerCodes = getCard2CornerCodes(traceType, variant);
    return {
      traceType,
      variant,
      cardId: `fangzhou_${traceType}_${variant}`,
      src: getCard2Src(traceType, variant),
      label: `方舟${placement.getTraceTypeLabel(traceType)} ${variant}`,
      cardName: `方舟${placement.getTraceTypeLabel(traceType)} ${variant}`,
      price: CARD2_PLAY_COST.credits,
      cardTypeCode: 0,
      discardActionCode: CARD2_DISCARD_ACTION_CODE,
      scanActionCode: cornerCodes.scanActionCode,
      incomeCode: cornerCodes.incomeCode,
      set: `alien:方舟:card2`,
      faceUp: false,
    };
  }

  function ensurePlayerCard2State(alienState, player) {
    const fangzhou = ensureFangzhouState(alienState);
    const key = getPlayerKey(player);
    if (!key) return null;
    if (!fangzhou.playerCard2ById[key]) {
      fangzhou.playerCard2ById[key] = createPlayerCard2State();
    }
    return fangzhou.playerCard2ById[key];
  }

  function dealPlayerCard2(alienState, player, random = Math.random) {
    const playerState = ensurePlayerCard2State(alienState, player);
    if (!playerState) return [];
    const dealt = [];
    for (const traceType of TRACE_TYPES) {
      const variant = pickRandomVariant(random);
      playerState.cards[traceType] = {
        variant,
        status: "locked",
        unlocked: false,
      };
      dealt.push(createCard2Definition(traceType, variant));
    }
    return dealt;
  }

  function getPlayerCard2Reserved(alienState, player) {
    const key = getPlayerKey(player);
    const playerState = alienState?.fangzhou?.playerCard2ById?.[key];
    if (!playerState) return [];
    return TRACE_TYPES.map((traceType) => {
      const entry = playerState.cards[traceType];
      if (!entry?.variant || entry.unlocked) return null;
      return {
        ...createCard2Definition(traceType, entry.variant),
        status: entry.status,
        unlocked: false,
      };
    }).filter(Boolean);
  }

  function canUnlockCard2ForTrace(alienState, player, traceType) {
    const key = getPlayerKey(player);
    if (!key || !TRACE_TYPES.includes(traceType)) return false;
    const entry = alienState?.fangzhou?.playerCard2ById?.[key]?.cards?.[traceType];
    return Boolean(entry?.variant && !entry.unlocked);
  }

  function canPlaceAnyFangzhouTrace(alienState, alienSlotId, traceType, player) {
    if (!isFangzhouRevealedSlot(alienState, alienSlotId)) return false;
    return TRACE_POSITIONS.some((position) => (
      canPlaceFangzhouTrace(alienState, alienSlotId, traceType, position, player).ok
    ));
  }

  function createCard2HandCard(alienState, player, traceType) {
    const key = getPlayerKey(player);
    const entry = alienState?.fangzhou?.playerCard2ById?.[key]?.cards?.[traceType];
    if (!entry?.variant || !entry.unlocked) return null;
    return {
      ...createCard2Definition(traceType, entry.variant),
      id: `fangzhou-card2-${key}-${traceType}-${entry.variant}`,
      faceUp: true,
      fangzhouCard2: true,
      fangzhouTraceType: traceType,
    };
  }

  function unlockCard2(alienState, player, traceType) {
    const fangzhou = ensureFangzhouState(alienState);
    const key = getPlayerKey(player);
    if (!key || !TRACE_TYPES.includes(traceType)) {
      return { ok: false, message: "无法解锁方舟卡牌" };
    }
    const playerState = ensurePlayerCard2State(alienState, player);
    const entry = playerState.cards[traceType];
    if (!entry?.variant) {
      return { ok: false, message: "没有对应的方舟解锁牌" };
    }
    if (entry.unlocked) {
      return { ok: false, message: `${placement.getTraceTypeLabel(traceType)} 方舟牌已解锁`, alreadyUnlocked: true };
    }

    entry.unlocked = true;
    entry.status = "unlocked";
    playerState.unlockCount += 1;
    fangzhou.unlockCountByPlayerId[key] = playerState.unlockCount;
    const handCard = createCard2HandCard(alienState, player, traceType);
    return {
      ok: true,
      traceType,
      unlockCount: playerState.unlockCount,
      handCard,
      message: `解锁方舟${placement.getTraceTypeLabel(traceType)}牌，解锁数目 ${playerState.unlockCount}`,
    };
  }

  function isFangzhouCard2(card) {
    return Boolean(card?.fangzhouCard2 || card?.set === "alien:方舟:card2" || String(card?.cardId || "").startsWith("fangzhou_"));
  }

  function getCard1Effect(index, tier = "basic") {
    const definition = CARD1_BY_INDEX[Math.round(Number(index))];
    if (!definition) return null;
    return tier === "advanced" ? definition.advanced : definition.basic;
  }

  function reshuffleCard1DeckIfNeeded(alienState, random = Math.random) {
    const fangzhou = ensureFangzhouState(alienState);
    if (fangzhou.card1RevealedSinceShuffle < CARD1_RESHUFFLE_THRESHOLD) return false;
    fangzhou.card1Deck = shuffle(CARD1_DEFINITIONS.map((card) => card.index), random);
    fangzhou.card1Revealed = [];
    fangzhou.card1RevealedSinceShuffle = 0;
    fangzhou.displayedCard1Index = null;
    return true;
  }

  function flipCard1Reward(alienState, tier = "basic", random = Math.random) {
    const fangzhou = ensureFangzhouState(alienState);
    const reshuffled = reshuffleCard1DeckIfNeeded(alienState, random);
    if (!fangzhou.card1Deck.length) {
      fangzhou.card1Deck = shuffle(CARD1_DEFINITIONS.map((card) => card.index), random);
    }
    const index = fangzhou.card1Deck.shift();
    fangzhou.card1Revealed.push(index);
    fangzhou.card1RevealedSinceShuffle += 1;
    fangzhou.displayedCard1Index = index;
    const effect = getCard1Effect(index, tier);
    const definition = CARD1_BY_INDEX[index];
    return {
      ok: true,
      index,
      tier,
      effect,
      definition,
      src: getCard1Src(index),
      label: definition?.label || `方舟奖励 ${index}`,
      message: `方舟${tier === "advanced" ? "高级" : "基础"}奖励：${definition?.label || index}`,
      reshuffled,
    };
  }

  function countFirstTracesForPlayerOnSlot(alienState, alienSlotId, player) {
    const slot = alienState?.aliens?.[alienSlotId];
    if (!slot?.traces) return 0;
    const playerKeys = getPlayerKeys(player);
    let count = 0;
    for (const traceType of TRACE_TYPES) {
      const trace = slot.traces[traceType];
      if (trace?.firstPlaced && markerBelongsToPlayer({ playerColor: trace.ownerPlayerColor }, playerKeys)) {
        count += 1;
      }
    }
    return count;
  }

  function buildRevealBasicRewardQueue(alienState, alienSlotId, players) {
    const queue = [];
    for (const player of players || []) {
      const count = countFirstTracesForPlayerOnSlot(alienState, alienSlotId, player);
      for (let index = 0; index < count; index += 1) {
        queue.push({
          playerId: getPlayerKey(player),
          playerColor: getPlayerColor(player),
          reason: "reveal_first_trace",
        });
      }
    }
    return queue;
  }

  function initializeFangzhouReveal(alienState, alienSlotId, triggerPlayer, players, random = Math.random) {
    const fangzhou = ensureFangzhouState(alienState);

    if (fangzhou.revealInitialized) {
      return {
        ok: true,
        alreadyInitialized: true,
        message: "方舟已初始化",
      };
    }

    fangzhou.revealedSlotId = Number(alienSlotId);
    fangzhou.revealedByPlayerId = triggerPlayer?.id || null;
    fangzhou.revealedByPlayerColor = getPlayerColor(triggerPlayer);
    fangzhou.revealInitialized = true;
    delete fangzhou.traceSlotsByAlienSlotId[String(alienSlotId)];
    ensureTraceGrid(alienState, alienSlotId);
    fangzhou.card1Deck = shuffle(CARD1_DEFINITIONS.map((card) => card.index), random);
    fangzhou.card1Revealed = [];
    fangzhou.card1RevealedSinceShuffle = 0;
    fangzhou.displayedCard1Index = null;

    for (const player of players || []) {
      dealPlayerCard2(alienState, player, random);
    }

    fangzhou.pendingRevealBasicRewards = buildRevealBasicRewardQueue(alienState, alienSlotId, players);

    return {
      ok: true,
      pendingBasicRewardCount: fangzhou.pendingRevealBasicRewards.length,
      message: `方舟已揭示：已发解锁牌，待结算基础奖励 ${fangzhou.pendingRevealBasicRewards.length} 次`,
    };
  }

  function takeNextRevealBasicReward(alienState) {
    const fangzhou = ensureFangzhouState(alienState);
    const next = fangzhou.pendingRevealBasicRewards.shift();
    if (!next) return { ok: false, message: "没有待结算的揭示基础奖励" };
    return { ok: true, entry: next };
  }

  function seedDebugTraceGrid(alienState, alienSlotId, player) {
    ensureFangzhouState(alienState);
    delete alienState.fangzhou.traceSlotsByAlienSlotId[String(alienSlotId)];
    ensureTraceGrid(alienState, alienSlotId);
    const placed = [];
    for (const traceType of TRACE_TYPES) {
      for (const position of TRACE_POSITIONS) {
        const result = placeFangzhouTrace(alienState, alienSlotId, traceType, position, player, {
          debugOnly: true,
          placedAt: 0,
        });
        if (result.ok) placed.push(result.entry);
      }
    }
    return placed;
  }

  function formatTraceLabel(traceType, position) {
    return `${placement.getTraceTypeLabel(traceType)} ${position}号位`;
  }

  function countTraceMarkers(alienState, player, alienSlotId = alienState?.fangzhou?.revealedSlotId) {
    const playerKeys = getPlayerKeys(player);
    const faceCount = listTraceEntries(alienState, alienSlotId)
      .filter((entry) => markerBelongsToPlayer(entry, playerKeys))
      .length;
    return countStateTraceMarkers(alienState, player, null, alienSlotId) + faceCount;
  }

  return Object.freeze({
    ALIEN_ID,
    CARD1_BACK_SRC,
    CARD1_BASE_PATH,
    CARD2_BASE_PATH,
    CARD2_PLAY_COST,
    CARD2_DISCARD_ACTION_CODE,
    CARD2_CORNER_CODES,
    TRACE_TYPES,
    TRACE_POSITIONS,
    TRACE_POSITION_COUNT,
    TRACE_REWARDS,
    UNLOCK_REQUIRED_BY_POSITION,
    CARD2_UNLOCK_TRACE_REWARD,
    CARD1_DEFINITIONS,
    CARD1_BY_INDEX,
    CARD1_RESHUFFLE_THRESHOLD,
    createFangzhouState,
    ensureFangzhouState,
    ensureTraceGrid,
    getTraceGrid,
    isFangzhouAlienSlot,
    isFangzhouRevealedSlot,
    getUnlockCount,
    canPlaceFangzhouTrace,
    getTraceReward,
    getCard2UnlockTraceReward,
    placeFangzhouTrace,
    listTraceEntries,
    getTraceEntries,
    dealPlayerCard2,
    getPlayerCard2Reserved,
    createCard2HandCard,
    unlockCard2,
    canUnlockCard2ForTrace,
    canPlaceAnyFangzhouTrace,
    isFangzhouCard2,
    getCard1Effect,
    getCard1Src,
    flipCard1Reward,
    reshuffleCard1DeckIfNeeded,
    buildRevealBasicRewardQueue,
    initializeFangzhouReveal,
    takeNextRevealBasicReward,
    seedDebugTraceGrid,
    markerBelongsToPlayer,
    getPlayerKeys,
    getPlayerKey,
    formatTraceLabel,
    countStateTraceMarkers,
    countTraceMarkers,
    createCard2Definition,
    getCard2CornerCodes,
  });
});
