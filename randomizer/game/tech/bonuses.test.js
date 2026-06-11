const assert = require("node:assert/strict");

require("../basic-cards");
require("../players");
require("./catalog");
require("./bonuses");

const basicCards = require("../basic-cards");
const players = require("../players");
const bonuses = require("./bonuses");

function createPlayer(overrides = {}) {
  return players.createPlayer({
    color: "white",
    resources: {
      credits: 10,
      energy: 5,
      publicity: 4,
      score: 7,
      handSize: 0,
      ...overrides.resources,
    },
    hand: overrides.hand || [],
  });
}

function createDrawHelper() {
  return {
    drawBasicCardToPlayer(player) {
      return basicCards.drawRandomBasicCardToHand(player.hand);
    },
  };
}

const scorePlayer = createPlayer();
const scoreResult = bonuses.applyBonusReward(scorePlayer, "bonus_3f", createDrawHelper());
assert.equal(scoreResult.ok, true);
assert.equal(scorePlayer.resources.score, 10);

const energyPlayer = createPlayer();
const energyResult = bonuses.applyBonusReward(energyPlayer, "bonus_1p", createDrawHelper());
assert.equal(energyResult.ok, true);
assert.equal(energyPlayer.resources.energy, 6);

const publicityPlayer = createPlayer({ resources: { publicity: 8 } });
const publicityResult = bonuses.applyBonusReward(publicityPlayer, "bonus_1m", createDrawHelper());
assert.equal(publicityResult.ok, true);
assert.equal(publicityPlayer.resources.publicity, 9);

const cardPlayer = createPlayer();
const cardResult = bonuses.applyBonusReward(cardPlayer, "bonus_1c", createDrawHelper());
assert.equal(cardResult.ok, true);
assert.equal(cardResult.awaitingCardSelection, true);
assert.equal(cardResult.rewards.cardSelection, 1);
assert.equal(cardPlayer.hand.length, 0);

console.log("bonuses.test.js passed");
