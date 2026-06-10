const assert = require("node:assert/strict");
require("../players");
require("./quick-trades");

const players = require("../players");
const quickTrades = require("./quick-trades");

const context = {
  playerState: players.createPlayerState({
    currentPlayer: {
      color: "white",
      resources: { credits: 10, energy: 1, handSize: 4 },
    },
  }),
};

const energyTrade = quickTrades.executeTrade("credits-for-energy", context);
assert.equal(energyTrade.ok, true);
assert.equal(players.getCurrentPlayer(context.playerState).resources.credits, 8);
assert.equal(players.getCurrentPlayer(context.playerState).resources.energy, 2);

const cardTrade = quickTrades.executeTrade("credits-for-card", context);
assert.equal(cardTrade.ok, true);
assert.equal(players.getCurrentPlayer(context.playerState).resources.handSize, 5);

const creditTrade = quickTrades.executeTrade("cards-for-credit", context);
assert.equal(creditTrade.ok, true);
assert.equal(players.getCurrentPlayer(context.playerState).resources.credits, 7);
assert.equal(players.getCurrentPlayer(context.playerState).resources.handSize, 3);

const energyForCard = quickTrades.executeTrade("energy-for-card", context);
assert.equal(energyForCard.ok, true);
assert.equal(players.getCurrentPlayer(context.playerState).resources.energy, 0);
assert.equal(players.getCurrentPlayer(context.playerState).resources.handSize, 4);

const energyCreditContext = {
  playerState: players.createPlayerState({
    currentPlayer: {
      color: "white",
      resources: { credits: 0, energy: 4, handSize: 0 },
    },
  }),
};
const energyCreditTrade = quickTrades.executeTrade("energy-for-credit", energyCreditContext);
assert.equal(energyCreditTrade.ok, true);
assert.equal(players.getCurrentPlayer(energyCreditContext.playerState).resources.credits, 1);
assert.equal(players.getCurrentPlayer(energyCreditContext.playerState).resources.energy, 2);

const blocked = quickTrades.executeTrade("cards-for-energy", {
  playerState: players.createPlayerState({
    currentPlayer: {
      color: "white",
      resources: { credits: 0, energy: 0, handSize: 1 },
    },
  }),
});
assert.equal(blocked.ok, false);
assert.match(blocked.message, /资源不足/);

console.log("quick trade tests passed");
