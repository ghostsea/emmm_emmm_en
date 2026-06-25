(function (root, factory) {
  "use strict";

  let catalog = root.SetiCardCatalog;

  if (!catalog && typeof require === "function") {
    try {
      catalog = require("../../../assets/cards/card_model.json");
    } catch (_error) {
      catalog = [];
    }
  }

  const api = factory(Array.isArray(catalog) ? catalog : []);

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.SetiCards = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function (CARD_CATALOG) {
  "use strict";

  const PUBLIC_CARD_COUNT = 3;
  const CARD_BASE_PATH = "../assets/cards";
  const INCOME_CODE_GAINS = Object.freeze({
    0: Object.freeze({ credits: 1 }),
    1: Object.freeze({ energy: 1 }),
    2: Object.freeze({ handSize: 1 }),
    3: Object.freeze({ availableData: 1 }),
    4: Object.freeze({ publicity: 1 }),
  });
  const DISCARD_ACTION_REWARDS = Object.freeze({
    0: Object.freeze({
      code: 0,
      label: "弃牌换1宣传",
      gain: Object.freeze({ publicity: 1 }),
      dataCount: 0,
    }),
    1: Object.freeze({
      code: 1,
      label: "弃牌换1数据",
      gain: Object.freeze({}),
      dataCount: 1,
    }),
    3: Object.freeze({
      code: 3,
      label: "弃牌换2宣传",
      gain: Object.freeze({ publicity: 2 }),
      dataCount: 0,
    }),
    4: Object.freeze({
      code: 4,
      label: "弃牌换1数据+1分",
      gain: Object.freeze({ score: 1 }),
      dataCount: 1,
    }),
  });
  const DISCARD_ACTION_MOVE_REWARDS = Object.freeze({
    2: Object.freeze({
      code: 2,
      label: "弃牌换1移动",
      movementPoints: 1,
      gain: Object.freeze({}),
    }),
    5: Object.freeze({
      code: 5,
      label: "弃牌换1移动+1分",
      movementPoints: 1,
      gain: Object.freeze({ score: 1 }),
    }),
  });
  const CARD_CATALOG_BY_ID = new Map(CARD_CATALOG.map((entry) => [entry.card_id, entry]));

  let cardInstanceSequence = 0;

  function getCardSrc(entry) {
    return `${CARD_BASE_PATH}/${entry.set}/split/${entry.card_id}`;
  }

  function normalizeBasicCardInput(input) {
    const text = String(input ?? "").trim().toLowerCase();
    if (!text) return null;
    const match = text.match(/^(?:b_?)?(\d{1,3})(?:\.webp)?$/);
    if (!match) return null;
    const index = Number(match[1]);
    if (!Number.isInteger(index) || index < 1 || index > 140) return null;
    return `b_${index}.webp`;
  }

  function normalizeDlcCardInput(input) {
    const text = String(input ?? "").trim().toLowerCase();
    if (!text) return null;
    const match = text.match(/^dlc_?(\d{1,2})(?:\.png)?$/);
    if (!match) return null;
    const index = Number(match[1]);
    if (!Number.isInteger(index) || index < 1 || index > 42) return null;
    return `dlc_${index}.png`;
  }

  function normalizeDebugCardInput(input) {
    return normalizeBasicCardInput(input) || normalizeDlcCardInput(input);
  }

  function parseDebugCardInput(input) {
    const text = String(input ?? "").trim().toLowerCase();
    if (!text) return null;

    const basicMatch = text.match(/^(?:b_?)?(\d{1,3})(?:\.webp)?$/);
    if (basicMatch) {
      const index = Number(basicMatch[1]);
      if (Number.isInteger(index) && index >= 1 && index <= 140) {
        return { prefix: "b_", extension: ".webp", start: index, max: 140 };
      }
    }

    const dlcMatch = text.match(/^dlc_?(\d{1,2})(?:\.png)?$/);
    if (dlcMatch) {
      const index = Number(dlcMatch[1]);
      if (Number.isInteger(index) && index >= 1 && index <= 42) {
        return { prefix: "dlc_", extension: ".png", start: index, max: 42 };
      }
    }

    return null;
  }

  function normalizeDebugCardInputRange(input, count = 5) {
    const parsed = parseDebugCardInput(input);
    if (!parsed) return [];
    const targetCount = Math.max(1, Math.round(Number(count) || 5));
    const cardIds = [];
    for (let index = parsed.start; index <= parsed.max && cardIds.length < targetCount; index += 1) {
      cardIds.push(`${parsed.prefix}${index}${parsed.extension}`);
    }
    return cardIds;
  }

  function getCardId(value) {
    if (!value) return null;
    if (typeof value === "string") return value;
    if (value.card_id) return value.card_id;
    if (value.cardId) return value.cardId;
    if (Number.isInteger(value.cardIndex)) return `b_${value.cardIndex}.webp`;
    return null;
  }

  function getCatalogEntryByCardId(cardId) {
    if (!cardId) return null;
    return CARD_CATALOG_BY_ID.get(String(cardId)) || null;
  }

  function getBasicCatalogEntryByInput(input) {
    const cardId = normalizeBasicCardInput(input);
    if (!cardId) return null;
    return CARD_CATALOG.find((entry) => entry.set === "basic" && entry.card_id === cardId) || null;
  }

  function getCatalogEntryByInput(input) {
    const cardId = normalizeDebugCardInput(input);
    if (!cardId) return null;
    return CARD_CATALOG.find((entry) => entry.card_id === cardId) || null;
  }

  function getCatalogEntriesByInputRange(input, count = 5) {
    return normalizeDebugCardInputRange(input, count)
      .map((cardId) => CARD_CATALOG.find((entry) => entry.card_id === cardId) || null)
      .filter(Boolean);
  }

  function createCardInstance(entry, sequence) {
    cardInstanceSequence += 1;
    return {
      id: `card-${cardInstanceSequence}-${sequence ?? 0}`,
      cardId: entry.card_id,
      set: entry.set,
      cardName: entry.card_name,
      src: getCardSrc(entry),
      faceUp: true,
      price: entry.price,
      cardTypeCode: entry.card_type_code,
      discardActionCode: entry.discard_action_code,
      scanActionCode: entry.scan_action_code,
      incomeCode: entry.income_code,
    };
  }

  function getCatalogEntryForCard(card) {
    if (!card) return null;
    const cardId = getCardId(card);
    if (!cardId) return null;
    return getCatalogEntryByCardId(cardId);
  }

  function getIncomeCodeForCard(card) {
    if (Number.isInteger(card?.incomeCode)) return card.incomeCode;
    const entry = getCatalogEntryForCard(card);
    return Number.isInteger(entry?.income_code) ? entry.income_code : null;
  }

  function getIncomeGainForCard(card) {
    const incomeCode = getIncomeCodeForCard(card);
    const gain = INCOME_CODE_GAINS[incomeCode];
    return gain ? { ...gain } : null;
  }

  function getDiscardActionCodeForCard(card) {
    if (Number.isInteger(card?.discardActionCode)) return card.discardActionCode;
    const entry = getCatalogEntryForCard(card);
    return Number.isInteger(entry?.discard_action_code) ? entry.discard_action_code : null;
  }

  function getDiscardActionRewardForCard(card) {
    const actionCode = getDiscardActionCodeForCard(card);
    const reward = DISCARD_ACTION_REWARDS[actionCode];
    if (!reward) return null;
    return {
      code: reward.code,
      label: reward.label,
      gain: { ...reward.gain },
      dataCount: reward.dataCount,
    };
  }

  function getDiscardActionMoveRewardForCard(card) {
    const actionCode = getDiscardActionCodeForCard(card);
    const reward = DISCARD_ACTION_MOVE_REWARDS[actionCode];
    if (!reward) return null;
    return {
      code: reward.code,
      label: reward.label,
      movementPoints: reward.movementPoints,
      gain: { ...reward.gain },
    };
  }

  function createCardState() {
    return {
      publicCards: Array.from({ length: PUBLIC_CARD_COUNT }, () => null),
      discardPile: [],
      drawPileCardIds: [],
      passReservePiles: {},
      ui: {
        selectionActive: false,
        discardSelectionActive: false,
        discardRemaining: 0,
        playCardSelectionActive: false,
      },
    };
  }

  function collectPlayerCardIds(playerState) {
    const ids = new Set();
    if (!playerState || !Array.isArray(playerState.players)) return ids;

    for (const player of playerState.players) {
      for (const cardList of [player.hand, player.reservedCards]) {
        if (!Array.isArray(cardList)) continue;
        for (const card of cardList) {
          const cardId = getCardId(card);
          if (cardId) ids.add(cardId);
        }
      }
      const futureSpanCard = player.industryFutureSpan?.card;
      const futureSpanCardId = getCardId(futureSpanCard);
      if (futureSpanCardId) ids.add(futureSpanCardId);
    }

    return ids;
  }

  function collectPassReserveCardIds(cardState) {
    const ids = new Set();
    const piles = cardState?.passReservePiles;
    if (!piles || typeof piles !== "object") return ids;

    for (const pile of Object.values(piles)) {
      if (!Array.isArray(pile)) continue;
      for (const card of pile) {
        const cardId = getCardId(card);
        if (cardId) ids.add(cardId);
      }
    }

    return ids;
  }

  function collectLiveCardIds(cardState, playerState) {
    const ids = collectPlayerCardIds(playerState);

    if (cardState?.publicCards) {
      for (const card of cardState.publicCards) {
        const cardId = getCardId(card);
        if (cardId) ids.add(cardId);
      }
    }

    for (const cardId of collectPassReserveCardIds(cardState)) {
      ids.add(cardId);
    }

    return ids;
  }

  function collectDiscardCardIds(cardState) {
    const ids = new Set();
    if (Array.isArray(cardState?.discardPile)) {
      for (const card of cardState.discardPile) {
        const cardId = getCardId(card);
        if (cardId) ids.add(cardId);
      }
    }
    return ids;
  }

  function collectClaimedCardIds(cardState, playerState) {
    const ids = collectLiveCardIds(cardState, playerState);
    for (const cardId of collectDiscardCardIds(cardState)) {
      ids.add(cardId);
    }
    return ids;
  }

  function ensureDrawPileCardIds(cardState) {
    if (!Array.isArray(cardState.drawPileCardIds)) cardState.drawPileCardIds = [];
    return cardState.drawPileCardIds;
  }

  function getDrawPileCardIds(cardState) {
    return Array.isArray(cardState?.drawPileCardIds)
      ? cardState.drawPileCardIds.slice()
      : [];
  }

  function sanitizeDrawPileCardIds(cardState, playerState) {
    const drawPile = ensureDrawPileCardIds(cardState);
    const live = collectLiveCardIds(cardState, playerState);
    const seen = new Set();
    const sanitized = [];

    for (const rawCardId of drawPile) {
      const cardId = String(rawCardId || "");
      if (!cardId || seen.has(cardId) || live.has(cardId) || !getCatalogEntryByCardId(cardId)) continue;
      seen.add(cardId);
      sanitized.push(cardId);
    }

    if (sanitized.length !== drawPile.length || sanitized.some((cardId, index) => cardId !== drawPile[index])) {
      cardState.drawPileCardIds = sanitized;
    }
    return cardState.drawPileCardIds;
  }

  function removeCardIdFromDrawPile(cardState, cardId) {
    if (!cardId || !Array.isArray(cardState?.drawPileCardIds)) return;
    cardState.drawPileCardIds = cardState.drawPileCardIds.filter((item) => item !== cardId);
  }

  function getActiveDrawPool(cardState, playerState) {
    const drawPile = sanitizeDrawPileCardIds(cardState, playerState);
    return drawPile
      .map((cardId) => getCatalogEntryByCardId(cardId))
      .filter(Boolean);
  }

  function getFreshAvailablePool(cardState, playerState) {
    const unavailable = collectClaimedCardIds(cardState, playerState);
    for (const cardId of getDrawPileCardIds(cardState)) {
      unavailable.add(cardId);
    }
    return CARD_CATALOG.filter((entry) => !unavailable.has(entry.card_id));
  }

  function getDiscardRecycleCardIds(cardState, playerState) {
    const live = collectLiveCardIds(cardState, playerState);
    const activeDrawPile = new Set(getDrawPileCardIds(cardState));
    const seen = new Set();
    const cardIds = [];

    if (!Array.isArray(cardState?.discardPile)) return cardIds;
    for (const card of cardState.discardPile) {
      const cardId = getCardId(card);
      if (!cardId || seen.has(cardId) || live.has(cardId) || activeDrawPile.has(cardId)) continue;
      if (!getCatalogEntryByCardId(cardId)) continue;
      seen.add(cardId);
      cardIds.push(cardId);
    }
    return cardIds;
  }

  function getDiscardRecyclePool(cardState, playerState) {
    return getDiscardRecycleCardIds(cardState, playerState)
      .map((cardId) => getCatalogEntryByCardId(cardId))
      .filter(Boolean);
  }

  function getAvailablePool(cardState, playerState) {
    const activeDrawPool = getActiveDrawPool(cardState, playerState);
    if (activeDrawPool.length) return activeDrawPool;

    const freshPool = getFreshAvailablePool(cardState, playerState);
    if (freshPool.length) return freshPool;

    return getDiscardRecyclePool(cardState, playerState);
  }

  function pickRandomEntry(pool, random = Math.random) {
    if (!pool.length) return null;
    return pool[Math.floor(random() * pool.length)];
  }

  function takeRandomEntryFromDrawPile(cardState, playerState, random = Math.random) {
    const drawPile = sanitizeDrawPileCardIds(cardState, playerState);
    if (!drawPile.length) return null;

    const index = Math.floor(random() * drawPile.length);
    const [cardId] = drawPile.splice(index, 1);
    return getCatalogEntryByCardId(cardId);
  }

  function recycleDiscardPileIntoDrawPile(cardState, playerState) {
    const cardIds = getDiscardRecycleCardIds(cardState, playerState);
    if (!cardIds.length) return false;

    const recycled = new Set(cardIds);
    cardState.discardPile = (cardState.discardPile || [])
      .filter((card) => !recycled.has(getCardId(card)));
    cardState.drawPileCardIds = cardIds;
    return true;
  }

  function takeRandomEntryForDraw(cardState, playerState, random = Math.random) {
    const activeEntry = takeRandomEntryFromDrawPile(cardState, playerState, random);
    if (activeEntry) return { entry: activeEntry, reshuffled: false };

    const freshPool = getFreshAvailablePool(cardState, playerState);
    const freshEntry = pickRandomEntry(freshPool, random);
    if (freshEntry) return { entry: freshEntry, reshuffled: false };

    if (!recycleDiscardPileIntoDrawPile(cardState, playerState)) return null;
    const recycledEntry = takeRandomEntryFromDrawPile(cardState, playerState, random);
    return recycledEntry ? { entry: recycledEntry, reshuffled: true } : null;
  }

  function addCardToHand(player, card) {
    if (!Array.isArray(player.hand)) player.hand = [];
    player.hand.push(card);
    player.resources.handSize = player.hand.length;
    return card;
  }

  function normalizePassReserveRounds(rounds) {
    const source = Array.isArray(rounds) && rounds.length ? rounds : [1, 2, 3];
    return [...new Set(source
      .map((round) => Math.round(Number(round)))
      .filter((round) => Number.isInteger(round) && round > 0))]
      .sort((a, b) => a - b);
  }

  function ensurePassReservePiles(cardState) {
    if (!cardState.passReservePiles || typeof cardState.passReservePiles !== "object") {
      cardState.passReservePiles = {};
    }
    return cardState.passReservePiles;
  }

  function preparePassReservePiles(cardState, playerState, options = {}) {
    const rounds = normalizePassReserveRounds(options.rounds);
    const activePlayerCount = Math.max(1, Math.round(Number(options.activePlayerCount) || 1));
    const cardsPerPile = activePlayerCount + 1;
    const random = options.random || Math.random;

    cardState.passReservePiles = {};
    const piles = ensurePassReservePiles(cardState);

    for (const roundNumber of rounds) {
      const pile = [];
      for (let index = 0; index < cardsPerPile; index += 1) {
        const result = takeRandomEntryForDraw(cardState, playerState, random);
        if (!result?.entry) break;
        pile.push(createCardInstance(result.entry, `pass-${roundNumber}-${index + 1}`));
      }
      piles[String(roundNumber)] = pile;
    }

    return {
      ok: true,
      rounds,
      cardsPerPile,
      piles,
    };
  }

  function getPassReservePile(cardState, roundNumber) {
    const round = Math.round(Number(roundNumber));
    if (!Number.isInteger(round) || round <= 0) return [];
    const pile = cardState?.passReservePiles?.[String(round)];
    return Array.isArray(pile) ? pile : [];
  }

  function pickPassReserveCard(cardState, player, roundNumber, cardId) {
    if (!player) {
      return { ok: false, message: "没有当前玩家", card: null };
    }

    const pile = getPassReservePile(cardState, roundNumber);
    if (!pile.length) {
      return { ok: false, message: "本轮没有可选 PASS 预留牌", card: null };
    }

    const targetId = String(cardId || "");
    const index = pile.findIndex((card) => card?.id === targetId || card?.cardId === targetId);
    if (index < 0) {
      return { ok: false, message: "请选择一张本轮 PASS 预留牌", card: null };
    }

    const [card] = pile.splice(index, 1);
    addCardToHand(player, card);
    return {
      ok: true,
      card,
      remaining: pile.slice(),
      message: `PASS 精选：${getCardLabel(card)}`,
    };
  }

  function discardUnusedPassReserveCards(cardState, roundNumber) {
    const pile = getPassReservePile(cardState, roundNumber);
    if (!pile.length) {
      return { ok: true, cards: [], message: "本轮没有剩余 PASS 预留牌" };
    }

    const discarded = pile.splice(0);
    for (const card of discarded) {
      addToDiscardPile(cardState, card);
    }
    return {
      ok: true,
      cards: discarded,
      message: `弃置剩余 PASS 预留牌：${discarded.map(getCardLabel).join("、")}`,
    };
  }

  function blindDraw(cardState, playerState, player, random = Math.random) {
    if (!player) {
      return { ok: false, message: "没有当前玩家", card: null };
    }

    const result = takeRandomEntryForDraw(cardState, playerState, random);
    if (!result?.entry) {
      return { ok: false, message: "牌库已无可用卡牌", card: null };
    }

    const card = createCardInstance(result.entry);
    addCardToHand(player, card);
    return { ok: true, message: null, card, reshuffled: Boolean(result.reshuffled) };
  }

  function replenishPublicSlot(cardState, playerState, slotIndex, random = Math.random) {
    const result = takeRandomEntryForDraw(cardState, playerState, random);
    cardState.publicCards[slotIndex] = result?.entry ? createCardInstance(result.entry) : null;
    return cardState.publicCards[slotIndex];
  }

  function pickFromPublic(cardState, playerState, player, slotIndex, random = Math.random) {
    if (!player) {
      return { ok: false, message: "没有当前玩家", card: null };
    }

    const index = Number(slotIndex);
    if (!Number.isInteger(index) || index < 0 || index >= PUBLIC_CARD_COUNT) {
      return { ok: false, message: "无效的公共牌位置", card: null };
    }

    const card = cardState.publicCards[index];
    if (!card) {
      return { ok: false, message: "该公共牌位没有卡牌", card: null };
    }

    addCardToHand(player, card);
    const replenished = replenishPublicSlot(cardState, playerState, index, random);

    return {
      ok: true,
      message: null,
      card,
      replenished,
      publicCards: cardState.publicCards.slice(),
    };
  }

  function countPublicCards(cardState) {
    if (!Array.isArray(cardState?.publicCards)) return 0;
    return cardState.publicCards.filter(Boolean).length;
  }

  function normalizeSkipSlotIndexes(options = {}) {
    return new Set((options.skipSlotIndexes || [])
      .map((slotIndex) => Number(slotIndex))
      .filter((slotIndex) => Number.isInteger(slotIndex)));
  }

  function fillPublicCards(cardState, playerState, random = Math.random, options = {}) {
    const skipSlotIndexes = normalizeSkipSlotIndexes(options);
    for (let index = 0; index < PUBLIC_CARD_COUNT; index += 1) {
      if (skipSlotIndexes.has(index)) continue;
      if (!cardState.publicCards[index]) {
        replenishPublicSlot(cardState, playerState, index, random);
      }
    }
    return cardState.publicCards.slice();
  }

  function ensurePublicCardsFilled(cardState, playerState, random = Math.random, options = {}) {
    return fillPublicCards(cardState, playerState, random, options);
  }

  function drawCardsToHand(cardState, playerState, player, count, random = Math.random) {
    const drawn = [];
    const target = Math.max(0, Math.round(count));

    for (let index = 0; index < target; index += 1) {
      const result = blindDraw(cardState, playerState, player, random);
      if (!result.ok) {
        return {
          ok: drawn.length > 0,
          message: result.message,
          cards: drawn,
        };
      }
      drawn.push(result.card);
    }

    return { ok: true, message: null, cards: drawn };
  }

  function discardFromHand(player, cardIndexFromEnd = 0) {
    if (!player || !Array.isArray(player.hand) || !player.hand.length) {
      return { ok: false, message: "手牌为空，无法弃牌", card: null };
    }

    const removeIndex = player.hand.length - 1 - Math.max(0, Math.round(cardIndexFromEnd));
    return discardFromHandAtIndex(player, removeIndex);
  }

  function discardFromHandAtIndex(player, handIndex) {
    if (!player || !Array.isArray(player.hand) || !player.hand.length) {
      return { ok: false, message: "手牌为空，无法弃牌", card: null };
    }

    const removeIndex = Math.round(handIndex);
    if (removeIndex < 0 || removeIndex >= player.hand.length) {
      return { ok: false, message: "无效的手牌位置", card: null };
    }

    const [discarded] = player.hand.splice(removeIndex, 1);
    player.resources.handSize = player.hand.length;
    return { ok: true, message: null, card: discarded };
  }

  function addToDiscardPile(cardState, card) {
    if (!card) return;
    if (!Array.isArray(cardState.discardPile)) cardState.discardPile = [];
    removeCardIdFromDrawPile(cardState, getCardId(card));
    cardState.discardPile.push(card);
  }

  function setSelectionActive(cardState, active) {
    cardState.ui.selectionActive = Boolean(active);
    return cardState.ui.selectionActive;
  }

  function isSelectionActive(cardState) {
    return Boolean(cardState?.ui?.selectionActive);
  }

  function setDiscardSelectionActive(cardState, active, remaining = 0) {
    cardState.ui.discardSelectionActive = Boolean(active);
    cardState.ui.discardRemaining = active
      ? Math.max(0, Math.round(remaining))
      : 0;
    return cardState.ui.discardSelectionActive;
  }

  function isDiscardSelectionActive(cardState) {
    return Boolean(cardState?.ui?.discardSelectionActive);
  }

  function setPlayCardSelectionActive(cardState, active) {
    cardState.ui.playCardSelectionActive = Boolean(active);
    return cardState.ui.playCardSelectionActive;
  }

  function isPlayCardSelectionActive(cardState) {
    return Boolean(cardState?.ui?.playCardSelectionActive);
  }

  function getDiscardRemaining(cardState) {
    return Math.max(0, Math.round(cardState?.ui?.discardRemaining || 0));
  }

  function decrementDiscardRemaining(cardState) {
    cardState.ui.discardRemaining = Math.max(0, getDiscardRemaining(cardState) - 1);
    return cardState.ui.discardRemaining;
  }

  function initializeDeck(cardState, playerState, options = {}) {
    const random = options.random || Math.random;
    const handCount = Math.max(0, Math.round(options.handCount ?? 0));
    const player = options.player;

    if (player && handCount > 0) {
      drawCardsToHand(cardState, playerState, player, handCount, random);
    }

    ensurePublicCardsFilled(cardState, playerState, random);

    return cardState;
  }

  function getCatalogSize() {
    return CARD_CATALOG.length;
  }

  function getCardLabel(card) {
    if (!card) return "";
    return card.cardName || card.cardId || card.src?.split("/").pop() || card.id || "";
  }

  return Object.freeze({
    CARD_CATALOG,
    PUBLIC_CARD_COUNT,
    CARD_BASE_PATH,
    INCOME_CODE_GAINS,
    DISCARD_ACTION_REWARDS,
    DISCARD_ACTION_MOVE_REWARDS,
    getCardSrc,
    normalizeBasicCardInput,
    normalizeDlcCardInput,
    normalizeDebugCardInput,
    normalizeDebugCardInputRange,
    getBasicCatalogEntryByInput,
    getCatalogEntryByInput,
    getCatalogEntriesByInputRange,
    createCardInstance,
    getCatalogEntryForCard,
    getIncomeCodeForCard,
    getIncomeGainForCard,
    getDiscardActionCodeForCard,
    getDiscardActionRewardForCard,
    getDiscardActionMoveRewardForCard,
    createCardState,
    collectClaimedCardIds,
    getDrawPileCardIds,
    getAvailablePool,
    addCardToHand,
    preparePassReservePiles,
    getPassReservePile,
    pickPassReserveCard,
    discardUnusedPassReserveCards,
    blindDraw,
    pickFromPublic,
    replenishPublicSlot,
    countPublicCards,
    fillPublicCards,
    ensurePublicCardsFilled,
    drawCardsToHand,
    discardFromHand,
    discardFromHandAtIndex,
    addToDiscardPile,
    setSelectionActive,
    isSelectionActive,
    setDiscardSelectionActive,
    isDiscardSelectionActive,
    setPlayCardSelectionActive,
    isPlayCardSelectionActive,
    getDiscardRemaining,
    decrementDiscardRemaining,
    initializeDeck,
    getCatalogSize,
    getCardLabel,
  });
});
