const assert = require("node:assert/strict");
require("../card-catalog");
const cards = require("./deck");

const cardState = cards.createCardState();
const player = {
  id: "player-white",
  hand: [],
  resources: { handSize: 0 },
};

const playerState = {
  players: [player],
  currentPlayerId: player.id,
};

cards.initializeDeck(cardState, playerState, {
  player,
  handCount: 5,
  random: () => 0,
});

assert.equal(cardState.publicCards.filter(Boolean).length, cards.PUBLIC_CARD_COUNT);
assert.equal(player.hand.length, 5);
assert.equal(player.hand[0].incomeCode, cards.CARD_CATALOG[0].income_code);
assert.equal(cards.getIncomeCodeForCard(player.hand[0]), cards.CARD_CATALOG[0].income_code);

const catalogSetCounts = cards.CARD_CATALOG.reduce((counts, entry) => {
  counts[entry.set] = (counts[entry.set] || 0) + 1;
  return counts;
}, {});
assert.equal(catalogSetCounts.basic, 140);
assert.equal(catalogSetCounts["space-agency"], 42);

const openingHandState = cards.createCardState();
const openingHandPlayers = ["white", "blue", "green", "brown"].map((color) => ({
  id: `player-${color}`,
  hand: [],
  reservedCards: [],
  resources: { handSize: 0 },
}));
const openingHandPlayerState = {
  players: openingHandPlayers,
  currentPlayerId: openingHandPlayers[0].id,
};
for (const openingPlayer of openingHandPlayers) {
  const result = cards.drawCardsToHand(openingHandState, openingHandPlayerState, openingPlayer, 4, () => 0.999999);
  assert.equal(result.ok, true);
  assert.equal(openingPlayer.hand.length, 4);
  assert.equal(openingPlayer.resources.handSize, 4);
}
const openingCardIds = openingHandPlayers.flatMap((openingPlayer) => (
  openingPlayer.hand.map((card) => card.cardId)
));
assert.equal(new Set(openingCardIds).size, openingCardIds.length);
assert.ok(openingCardIds.some((cardId) => cardId.startsWith("dlc_")));
assert.notDeepEqual(openingHandPlayers[0].hand.map((card) => card.cardId), [
  "b_1.webp",
  "b_2.webp",
  "b_3.webp",
  "b_4.webp",
]);

assert.deepEqual(
  cards.getIncomeGainForCard(cards.createCardInstance(cards.CARD_CATALOG.find((entry) => entry.income_code === 0), 0)),
  { credits: 1 },
);
assert.deepEqual(
  cards.getIncomeGainForCard(cards.createCardInstance(cards.CARD_CATALOG.find((entry) => entry.income_code === 1), 1)),
  { energy: 1 },
);
assert.deepEqual(
  cards.getIncomeGainForCard(cards.createCardInstance(cards.CARD_CATALOG.find((entry) => entry.income_code === 2), 2)),
  { handSize: 1 },
);
assert.equal(cards.normalizeBasicCardInput("25"), "b_25.webp");
assert.equal(cards.normalizeBasicCardInput("b_25"), "b_25.webp");
assert.equal(cards.normalizeBasicCardInput("b_25.webp"), "b_25.webp");
assert.equal(cards.normalizeBasicCardInput("B25.WEBP"), "b_25.webp");
assert.equal(cards.normalizeBasicCardInput("b_0"), null);
assert.equal(cards.normalizeBasicCardInput("b_141"), null);
assert.equal(cards.normalizeBasicCardInput("aomomo_1.webp"), null);
assert.equal(cards.normalizeDlcCardInput("dlc_1"), "dlc_1.png");
assert.equal(cards.normalizeDlcCardInput("dlc1"), "dlc_1.png");
assert.equal(cards.normalizeDlcCardInput("dlc_1.png"), "dlc_1.png");
assert.equal(cards.normalizeDlcCardInput("DLC42.PNG"), "dlc_42.png");
assert.equal(cards.normalizeDlcCardInput("1"), null);
assert.equal(cards.normalizeDlcCardInput("dlc_0"), null);
assert.equal(cards.normalizeDlcCardInput("dlc_43"), null);
assert.equal(cards.normalizeDebugCardInput("1"), "b_1.webp");
assert.equal(cards.normalizeDebugCardInput("dlc_1"), "dlc_1.png");
assert.deepEqual(cards.normalizeDebugCardInputRange("1"), [
  "b_1.webp",
  "b_2.webp",
  "b_3.webp",
  "b_4.webp",
  "b_5.webp",
]);
assert.deepEqual(cards.normalizeDebugCardInputRange("b_138"), [
  "b_138.webp",
  "b_139.webp",
  "b_140.webp",
]);
assert.deepEqual(cards.normalizeDebugCardInputRange("dlc_39"), [
  "dlc_39.png",
  "dlc_40.png",
  "dlc_41.png",
  "dlc_42.png",
]);
assert.deepEqual(cards.normalizeDebugCardInputRange("dlc_43"), []);
assert.equal(cards.getBasicCatalogEntryByInput("25").card_id, "b_25.webp");
assert.equal(cards.getBasicCatalogEntryByInput("b_25").set, "basic");
assert.equal(cards.getBasicCatalogEntryByInput("b_141"), null);
assert.equal(cards.getCatalogEntryByInput("1").card_id, "b_1.webp");
assert.equal(cards.getCatalogEntryByInput("dlc_1").card_id, "dlc_1.png");
assert.equal(cards.getCatalogEntryByInput("dlc_1.png").set, "space-agency");
assert.equal(cards.getCatalogEntryByInput("dlc_43"), null);
assert.deepEqual(cards.getCatalogEntriesByInputRange("b_1").map((entry) => entry.card_id), [
  "b_1.webp",
  "b_2.webp",
  "b_3.webp",
  "b_4.webp",
  "b_5.webp",
]);
assert.deepEqual(cards.getCatalogEntriesByInputRange("dlc_1").map((entry) => entry.card_id), [
  "dlc_1.png",
  "dlc_2.png",
  "dlc_3.png",
  "dlc_4.png",
  "dlc_5.png",
]);

function cardWithDiscardActionCode(code) {
  const entry = cards.CARD_CATALOG.find((item) => item.discard_action_code === code);
  return entry
    ? cards.createCardInstance(entry, code)
    : { id: `synthetic-discard-${code}`, cardId: `synthetic-${code}.webp`, discardActionCode: code };
}

assert.deepEqual(cards.getDiscardActionRewardForCard(cardWithDiscardActionCode(0)), {
  code: 0,
  label: "弃牌换1宣传",
  gain: { publicity: 1 },
  dataCount: 0,
});
assert.deepEqual(cards.getDiscardActionRewardForCard(cardWithDiscardActionCode(1)), {
  code: 1,
  label: "弃牌换1数据",
  gain: {},
  dataCount: 1,
});
assert.deepEqual(cards.getDiscardActionRewardForCard(cardWithDiscardActionCode(3)), {
  code: 3,
  label: "弃牌换2宣传",
  gain: { publicity: 2 },
  dataCount: 0,
});
assert.deepEqual(cards.getDiscardActionRewardForCard(cardWithDiscardActionCode(4)), {
  code: 4,
  label: "弃牌换1数据+1分",
  gain: { score: 1 },
  dataCount: 1,
});
assert.equal(cards.getDiscardActionRewardForCard(cardWithDiscardActionCode(2)), null);
assert.equal(cards.getDiscardActionRewardForCard(cardWithDiscardActionCode(5)), null);
assert.deepEqual(cards.getDiscardActionMoveRewardForCard(cardWithDiscardActionCode(2)), {
  code: 2,
  label: "弃牌换1移动",
  movementPoints: 1,
  gain: {},
});
assert.deepEqual(cards.getDiscardActionMoveRewardForCard(cardWithDiscardActionCode(5)), {
  code: 5,
  label: "弃牌换1移动+1分",
  movementPoints: 1,
  gain: { score: 1 },
});
assert.equal(cards.getDiscardActionMoveRewardForCard(cardWithDiscardActionCode(0)), null);
const clonedReward = cards.getDiscardActionRewardForCard(cardWithDiscardActionCode(0));
clonedReward.gain.publicity = 99;
assert.deepEqual(cards.getDiscardActionRewardForCard(cardWithDiscardActionCode(0)).gain, { publicity: 1 });

const claimed = cards.collectClaimedCardIds(cardState, playerState);
assert.equal(claimed.size, cards.PUBLIC_CARD_COUNT + 5);
assert.equal(cards.getAvailablePool(cardState, playerState).length, cards.getCatalogSize() - claimed.size);

player.reservedCards = [cards.createCardInstance(cards.CARD_CATALOG[8], 8)];
const claimedWithReserved = cards.collectClaimedCardIds(cardState, playerState);
assert.equal(claimedWithReserved.size, claimed.size + 1);
assert.equal(claimedWithReserved.has(cards.CARD_CATALOG[8].card_id), true);
player.reservedCards = [];

const blindResult = cards.blindDraw(cardState, playerState, player, () => 0);
assert.equal(blindResult.ok, true);
assert.equal(player.hand.length, 6);

const publicCard = cardState.publicCards[0];
const pickResult = cards.pickFromPublic(cardState, playerState, player, 0, () => 0);
assert.equal(pickResult.ok, true);
assert.equal(pickResult.card.cardId, publicCard.cardId);
assert.equal(player.hand.length, 7);
assert.ok(cardState.publicCards[0]);
assert.notEqual(cardState.publicCards[0].cardId, publicCard.cardId);
assert.equal(cards.countPublicCards(cardState), cards.PUBLIC_CARD_COUNT);
assert.equal(pickResult.publicCards.filter(Boolean).length, cards.PUBLIC_CARD_COUNT);
assert.ok(pickResult.replenished);

const uniqueIds = new Set(player.hand.map((card) => card.cardId));
assert.equal(uniqueIds.size, player.hand.length);
const delayedFillState = cards.createCardState();
const delayedFillPlayer = { id: "player-blue", hand: [], resources: { handSize: 0 } };
const delayedFillPlayerState = { players: [delayedFillPlayer], currentPlayerId: delayedFillPlayer.id };
delayedFillState.publicCards = Array.from({ length: cards.PUBLIC_CARD_COUNT }, () => null);
cards.ensurePublicCardsFilled(delayedFillState, delayedFillPlayerState, () => 0, { skipSlotIndexes: [1] });
assert.ok(delayedFillState.publicCards[0]);
assert.equal(delayedFillState.publicCards[1], null);
assert.ok(delayedFillState.publicCards[2]);
assert.equal(cards.countPublicCards(delayedFillState), cards.PUBLIC_CARD_COUNT - 1);

const passReserveState = cards.createCardState();
const passReservePlayer = { id: "player-pass", hand: [], reservedCards: [], resources: { handSize: 0 } };
const passReservePlayerState = { players: [passReservePlayer], currentPlayerId: passReservePlayer.id };
cards.ensurePublicCardsFilled(passReserveState, passReservePlayerState, () => 0);
const passReserveResult = cards.preparePassReservePiles(passReserveState, passReservePlayerState, {
  activePlayerCount: 2,
  rounds: [1, 2, 3],
  random: () => 0,
});
assert.equal(passReserveResult.cardsPerPile, 3);
assert.deepEqual(Object.keys(passReserveState.passReservePiles).sort(), ["1", "2", "3"]);
assert.equal(cards.getPassReservePile(passReserveState, 1).length, 3);
assert.equal(cards.getPassReservePile(passReserveState, 2).length, 3);
assert.equal(cards.getPassReservePile(passReserveState, 3).length, 3);

const reserveCardIds = new Set(Object.values(passReserveState.passReservePiles).flat().map((card) => card.cardId));
const availableAfterReserve = cards.getAvailablePool(passReserveState, passReservePlayerState);
assert.equal(availableAfterReserve.some((entry) => reserveCardIds.has(entry.card_id)), false);

const passPickCard = cards.getPassReservePile(passReserveState, 1)[1];
const passPickResult = cards.pickPassReserveCard(passReserveState, passReservePlayer, 1, passPickCard.id);
assert.equal(passPickResult.ok, true);
assert.equal(passReservePlayer.hand.length, 1);
assert.equal(passReservePlayer.hand[0].id, passPickCard.id);
assert.equal(cards.getPassReservePile(passReserveState, 1).length, 2);

const discardReserveResult = cards.discardUnusedPassReserveCards(passReserveState, 1);
assert.equal(discardReserveResult.ok, true);
assert.equal(discardReserveResult.cards.length, 2);
assert.equal(cards.getPassReservePile(passReserveState, 1).length, 0);
assert.equal(passReserveState.discardPile.length, 2);

cards.setDiscardSelectionActive(cardState, true, 1);
assert.equal(cards.isDiscardSelectionActive(cardState), true);
assert.equal(cards.getDiscardRemaining(cardState), 1);
cards.setDiscardSelectionActive(cardState, false, 0);
assert.equal(cards.isDiscardSelectionActive(cardState), false);

const indexedDiscardPlayer = {
  hand: [
    cards.createCardInstance(cards.CARD_CATALOG[0], 0),
    cards.createCardInstance(cards.CARD_CATALOG[1], 1),
  ],
  resources: { handSize: 2 },
};
const indexedDiscard = cards.discardFromHandAtIndex(indexedDiscardPlayer, 0);
assert.equal(indexedDiscard.ok, true);
assert.equal(indexedDiscard.card.incomeCode, cards.CARD_CATALOG[0].income_code);
assert.equal(indexedDiscardPlayer.hand.length, 1);
assert.equal(indexedDiscardPlayer.hand[0].cardId, cards.CARD_CATALOG[1].card_id);

console.log("card deck tests passed");
