"use strict";

const assert = require("node:assert/strict");
const players = require("../players");
const nebulaState = require("../data/nebula-state");
const commands = require("./commands");

const nebulaDataState = nebulaState.createDefaultNebulaDataState();
nebulaState.fillNebulaData(nebulaDataState, "sector-1-a", { source: "setup" });

const player = players.createPlayer({ color: "white" });
const nextToken = nebulaState.getNextReplaceableNebulaToken(nebulaDataState, "sector-1-a");
const before = commands.snapshotNebulaToken(nextToken);

const replace = nebulaState.replaceNextNebulaDataToken(nebulaDataState, "sector-1-a", player, {
  playerColor: player.color,
  playerLabel: player.colorLabel,
});
assert.equal(replace.ok, true);
assert.ok(replace.token.replacedByPlayerColor);

const undo = commands.createNebulaReplaceCommand(
  nebulaDataState,
  "sector-1-a",
  replace.token.id,
  before,
);
undo.undo();

const restored = nebulaState.getNextReplaceableNebulaToken(nebulaDataState, "sector-1-a");
assert.equal(restored?.id, replace.token.id);
assert.equal(restored?.replacedByPlayerColor, null);

const spend = commands.createResourceSpendCommand(player, { credits: 2, energy: 1 }, "测试消耗");
player.resources.credits = 5;
player.resources.energy = 3;
spend.undo();
assert.equal(player.resources.credits, 7);
assert.equal(player.resources.energy, 4);

const cardState = { publicCards: [null, null], discardPile: [] };
const tradePlayer = players.createPlayer({ color: "blue" });
tradePlayer.hand = [{ id: "c1", cardName: "A" }];
tradePlayer.resources.credits = 3;
const tradeSnapshot = commands.captureTradeState(tradePlayer, cardState);
tradePlayer.resources.credits = 1;
tradePlayer.hand = [];
commands.createRestoreTradeStateCommand(tradePlayer, cardState, tradeSnapshot).undo();
assert.equal(tradePlayer.resources.credits, 3);
assert.equal(tradePlayer.hand.length, 1);

console.log("commands.test.js: all tests passed");
