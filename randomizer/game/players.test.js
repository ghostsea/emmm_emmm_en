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
assert.equal(currentPlayer.resources.score, 12);
assert.equal(currentPlayer.orbitCount, 0);
assert.equal(players.getPlayerColorDefinition("green").rocketAsset, "../assets/tokens/rocket-green.png");

const spender = players.createPlayer({ resources: { credits: 5, energy: 4 } });
assert.equal(players.canAfford(spender, { credits: 2, energy: 1 }), true);
const spent = players.spendResources(spender, { credits: 2, energy: 1 });
assert.equal(spent.ok, true);
assert.equal(spender.resources.credits, 3);
assert.equal(spender.resources.energy, 3);
assert.equal(players.spendResources(spender, { credits: 99 }).ok, false);

console.log("player tests passed");
