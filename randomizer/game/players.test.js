const assert = require("node:assert/strict");
const players = require("./players");

assert.deepEqual(players.PLAYER_COLOR_IDS, ["blue", "green", "brown", "white"]);
assert.equal(players.normalizePlayerColor("WHITE"), "white");
assert.equal(players.normalizePlayerColor("unknown"), "white");

const playerState = players.createPlayerState({
  currentPlayer: {
    color: "white",
    resources: {
      credits: 3,
      energy: 2,
      publicity: 99,
      availableData: 9,
      handSize: 5,
      score: 12,
    },
  },
});

const currentPlayer = players.getCurrentPlayer(playerState);
assert.equal(currentPlayer.id, "player-white");
assert.equal(currentPlayer.color, "white");
assert.equal(currentPlayer.colorLabel, "白色");
assert.equal(currentPlayer.resources.credits, 3);
assert.equal(currentPlayer.resources.energy, 2);
assert.equal(currentPlayer.resources.publicity, players.RESOURCE_LIMITS.publicity);
assert.equal(currentPlayer.resources.availableData, players.RESOURCE_LIMITS.availableData);
assert.equal(currentPlayer.resources.handSize, 5);
assert.equal(currentPlayer.hand.length, 5);
assert.equal(currentPlayer.hand[0].src, players.CARD_BACK_SRC);
assert.deepEqual(currentPlayer.reservedCards, []);
assert.equal(currentPlayer.resources.score, 12);
assert.deepEqual(currentPlayer.income, players.DEFAULT_INCOME);
assert.equal(currentPlayer.orbitCount, 0);
assert.equal(players.getPlayerColorDefinition("green").rocketAsset, "../assets/tokens/rocket-green.png");
assert.equal(players.getPlayerColorDefinition("green").satelliteAsset, "../assets/tokens/satellite-green.png");
assert.equal(players.getPlayerColorDefinition("green").landdingAsset, "../assets/tokens/landding-green.png");

const multiPlayerState = players.createPlayerState({
  players: players.PLAYER_COLOR_IDS.map((color) => ({ color })),
  currentPlayerColor: "green",
});
assert.equal(multiPlayerState.players.length, 4);
assert.equal(multiPlayerState.currentPlayerId, "player-green");
assert.equal(players.getCurrentPlayer(multiPlayerState).color, "green");
multiPlayerState.currentPlayerId = "player-blue";
assert.equal(players.getCurrentPlayer(multiPlayerState).color, "blue");

const spender = players.createPlayer({ resources: { credits: 5, energy: 4 } });
assert.equal(players.canAfford(spender, { credits: 2, energy: 1 }), true);
const spent = players.spendResources(spender, { credits: 2, energy: 1 });
assert.equal(spent.ok, true);
assert.equal(spender.resources.credits, 3);
assert.equal(spender.resources.energy, 3);
assert.equal(players.spendResources(spender, { credits: 99 }).ok, false);

const reservedPlayer = players.createPlayer({
  reservedCards: [{ id: "reserved-1", cardId: "b_1.webp", price: 2, cardTypeCode: 1 }],
});
assert.equal(reservedPlayer.reservedCards.length, 1);
assert.equal(reservedPlayer.reservedCards[0].price, 2);
assert.equal(reservedPlayer.reservedCards[0].cardTypeCode, 1);

const receiver = players.createPlayer({
  resources: { credits: 1, energy: 2, publicity: 3, availableData: 4 },
});
players.gainResources(receiver, {
  credits: 100,
  energy: 100,
  publicity: 10,
  availableData: 6,
});
assert.equal(receiver.resources.credits, 101);
assert.equal(receiver.resources.energy, 102);
assert.equal(receiver.resources.publicity, players.RESOURCE_LIMITS.publicity);
assert.equal(receiver.resources.availableData, players.RESOURCE_LIMITS.availableData);

const handPlayer = players.createPlayer({ resources: { handSize: 0 } });
players.gainResources(handPlayer, { handSize: 2 });
assert.equal(handPlayer.resources.handSize, 2);
assert.equal(handPlayer.hand.length, 2);
const handSpend = players.spendResources(handPlayer, { handSize: 1 });
assert.equal(handSpend.ok, true);
assert.equal(handPlayer.resources.handSize, 1);
assert.equal(handPlayer.hand.length, 1);

players.gainIncome(handPlayer, { credits: 1, energy: 2, handSize: 3, publicity: 4, availableData: 5 });
assert.deepEqual(handPlayer.income, {
  credits: 1,
  energy: 2,
  handSize: 3,
  publicity: 4,
  availableData: 5,
  additionalPublicScan: 0,
});
assert.equal(handPlayer.resources.credits, players.DEFAULT_RESOURCES.credits + 1);
assert.equal(handPlayer.resources.energy, players.DEFAULT_RESOURCES.energy + 2);
assert.equal(handPlayer.hand.length, 4);
assert.equal(handPlayer.resources.publicity, 4);
assert.equal(handPlayer.resources.availableData, 5);

const callbackIncomePlayer = players.createPlayer({ resources: { handSize: 0 } });
let immediateBlindDraws = 0;
players.gainIncome(callbackIncomePlayer, { handSize: 1 }, {
  blindDraw: (targetPlayer) => {
    immediateBlindDraws += 1;
    targetPlayer.hand.push({
      id: `income-draw-${immediateBlindDraws}`,
      src: players.CARD_BACK_SRC,
      faceUp: false,
    });
    targetPlayer.resources.handSize = targetPlayer.hand.length;
  },
});
assert.equal(callbackIncomePlayer.income.handSize, 1);
assert.equal(immediateBlindDraws, 1);
assert.equal(callbackIncomePlayer.hand.length, 1);
assert.equal(callbackIncomePlayer.resources.handSize, 1);

console.log("player tests passed");
