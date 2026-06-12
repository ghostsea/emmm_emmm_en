const assert = require("node:assert/strict");
require("../card-catalog");
require("../cards/deck");
require("../players");
require("./quick-trades");

const players = require("../players");
const quickTrades = require("./quick-trades");

function createContext(overrides = {}) {
  const context = {
    playerState: players.createPlayerState({
      currentPlayer: {
        color: "white",
        resources: { credits: 10, energy: 1, publicity: 3, handSize: 4 },
      },
    }),
    selectionRequests: [],
    beginCardSelection(pending) {
      context.selectionRequests.push(pending);
      return { ok: true, message: "精选：从公共牌区选一张牌" };
    },
    beginDiscardSelection(count, pending) {
      const player = pending.player || players.getCurrentPlayer(context.playerState);
      for (let index = 0; index < count; index += 1) {
        player.hand.pop();
      }
      player.resources.handSize = player.hand.length;
      return quickTrades.finalizeTradeAfterDiscard(pending.tradeId, context, player);
    },
    ...overrides,
  };
  return context;
}

const context = createContext();

const energyTrade = quickTrades.executeTrade("credits-for-energy", context);
assert.equal(energyTrade.ok, true);
assert.equal(players.getCurrentPlayer(context.playerState).resources.credits, 8);
assert.equal(players.getCurrentPlayer(context.playerState).resources.energy, 2);

const cardTrade = quickTrades.executeTrade("credits-for-card", context);
assert.equal(cardTrade.ok, true);
assert.equal(cardTrade.awaitingCardSelection, true);
assert.equal(players.getCurrentPlayer(context.playerState).resources.credits, 6);
assert.equal(players.getCurrentPlayer(context.playerState).resources.handSize, 4);
assert.equal(context.selectionRequests.at(-1).tradeId, "credits-for-card");
assert.equal(context.selectionRequests.at(-1).allowBlindDraw, false);

const creditTrade = quickTrades.executeTrade("cards-for-credit", context);
assert.equal(creditTrade.ok, true);
assert.equal(players.getCurrentPlayer(context.playerState).resources.credits, 7);
assert.equal(players.getCurrentPlayer(context.playerState).resources.handSize, 2);

const energyForCard = quickTrades.executeTrade("energy-for-card", context);
assert.equal(energyForCard.ok, true);
assert.equal(energyForCard.awaitingCardSelection, true);
assert.equal(players.getCurrentPlayer(context.playerState).resources.energy, 0);
assert.equal(players.getCurrentPlayer(context.playerState).resources.handSize, 2);
assert.equal(context.selectionRequests.at(-1).tradeId, "energy-for-card");
assert.equal(context.selectionRequests.at(-1).allowBlindDraw, false);

const publicityForCard = quickTrades.executeTrade("publicity-for-card", context);
assert.equal(publicityForCard.ok, true);
assert.equal(publicityForCard.awaitingCardSelection, true);
assert.equal(players.getCurrentPlayer(context.playerState).resources.publicity, 0);
assert.equal(context.selectionRequests.at(-1).tradeId, "publicity-for-card");
assert.equal(context.selectionRequests.at(-1).allowBlindDraw, false);

const energyCreditContext = createContext({
  playerState: players.createPlayerState({
    currentPlayer: {
      color: "white",
      resources: { credits: 0, energy: 4, handSize: 0 },
    },
  }),
});
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
