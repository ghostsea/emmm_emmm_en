"use strict";

const assert = require("node:assert/strict");

const state = require("./state");
const strategyPassive = require("./strategy-passive");

const player = {
  id: "white",
  initialSelection: { industry: { label: "宇宙战略集团" } },
  industryStrategyPassiveSlots: { yellow: false, red: false, blue: false },
};

state.initializeStrategyPassiveMarkers(player);

const activation = strategyPassive.activateStrategyPlayInteraction(
  player,
  { scanActionCode: 0 },
  2,
);
assert.equal(activation.ok, true);
assert.equal(strategyPassive.isStrategyPlayInteractionActive(player, 2), true);
assert.deepEqual(strategyPassive.getStrategyPlayEligibleSlotIds(player, 2), ["yellow"]);

assert.equal(strategyPassive.canInteractStrategyPlaySlot(player, "red", 2).ok, false);
assert.equal(strategyPassive.canInteractStrategyPlaySlot(player, "yellow", 2).ok, true);

state.placeStrategyPassiveSlot(player, "yellow");
strategyPassive.completeStrategyPlayInteraction(player);
assert.equal(strategyPassive.isStrategyPlayInteractionActive(player, 2), false);
assert.equal(player.industryStrategyPassiveSlots.yellow, true);

const redActivation = strategyPassive.activateStrategyPlayInteraction(
  player,
  { scanActionCode: 1 },
  2,
);
assert.equal(redActivation.ok, true);
assert.equal(strategyPassive.isStrategyPlayInteractionActive(player, 2), true);
assert.deepEqual(strategyPassive.getStrategyPlayEligibleSlotIds(player, 2), ["red"]);

state.placeStrategyPassiveSlot(player, "red");
strategyPassive.completeStrategyPlayInteraction(player);

const blueActivation = strategyPassive.activateStrategyPlayInteraction(
  player,
  { scanActionCode: 2 },
  2,
);
assert.equal(blueActivation.ok, true);
assert.deepEqual(strategyPassive.getStrategyPlayEligibleSlotIds(player, 2), ["blue"]);

strategyPassive.activateStrategyPlayInteraction(player, { scanActionCode: 1 }, 2);
assert.equal(strategyPassive.isStrategyPlayInteractionActive(player, 2), false);

strategyPassive.resetStrategyPlayInteractionForRoundReset(player);
assert.equal(player.industryStrategyPassiveSlots.yellow, true);
assert.equal(player.industryStrategyPassiveSlots.red, true);
assert.equal(strategyPassive.isStrategyPlayInteractionActive(player, 3), false);

const roundThreeBlue = strategyPassive.activateStrategyPlayInteraction(
  player,
  { scanActionCode: 2 },
  3,
);
assert.equal(roundThreeBlue.ok, true);
assert.deepEqual(strategyPassive.getStrategyPlayEligibleSlotIds(player, 3), ["blue"]);

strategyPassive.clearStrategyPassiveSlots(player);
const roundThreeRed = strategyPassive.activateStrategyPlayInteraction(
  player,
  { scanActionCode: 1 },
  3,
);
assert.equal(roundThreeRed.ok, true);
assert.deepEqual(strategyPassive.getStrategyPlayEligibleSlotIds(player, 3), ["red"]);

player.industryStrategyPassiveSlots = { yellow: false, red: false, blue: false };
strategyPassive.clearStrategyPlayInteraction(player);
strategyPassive.activateStrategyPlayInteraction(player, { scanActionCode: 3 }, 2);
assert.deepEqual(
  strategyPassive.getStrategyPlayEligibleSlotIds(player, 2).sort(),
  ["blue", "red", "yellow"],
);
assert.equal(strategyPassive.getAutomaticStrategyPlaySlotId(player, 2), "yellow");

strategyPassive.clearStrategyPassiveSlots(player);
assert.equal(player.industryStrategyPassiveSlots.yellow, false);

assert.equal(strategyPassive.getStrategySlotReward("yellow").credits, 1);
assert.equal(strategyPassive.getStrategySlotReward("red").publicity, 1);
assert.equal(strategyPassive.getStrategySlotReward("blue").data, 1);

const zeroScanPlayer = {
  id: "white",
  initialSelection: { industry: { label: "宇宙战略集团" } },
  industryStrategyPassiveSlots: { yellow: false, red: false, blue: false },
};
strategyPassive.activateStrategyPlayInteraction(zeroScanPlayer, { scanActionCode: 0 }, 1);
assert.deepEqual(strategyPassive.getStrategyPlayEligibleSlotIds(zeroScanPlayer, 1), ["yellow"]);

strategyPassive.activateStrategyPlayInteraction(player, { scanActionCode: 0 }, 2);
assert.equal(strategyPassive.isStrategyPlayInteractionActive(player, 2), true);
const expired = strategyPassive.expireStrategyPlayInteractionOnTurnEnd(player, 2);
assert.equal(expired.cleared, true);
assert.equal(strategyPassive.isStrategyPlayInteractionActive(player, 2), false);
const reactivated = strategyPassive.activateStrategyPlayInteraction(player, { scanActionCode: 0 }, 2);
assert.equal(reactivated.ok, true);
assert.equal(strategyPassive.isStrategyPlayInteractionActive(player, 2), true);

console.log("strategy-passive.test.js: all tests passed");
