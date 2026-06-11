const assert = require("node:assert/strict");
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

const claimed = cards.collectClaimedCardIds(cardState, playerState);
assert.equal(claimed.size, cards.PUBLIC_CARD_COUNT + 5);
assert.equal(cards.getAvailablePool(cardState, playerState).length, cards.getCatalogSize() - claimed.size);

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
