"use strict";

const assert = require("node:assert/strict");

const heliosPassive = require("./helios-passive");

const player = {
  id: "white",
  initialSelection: { industry: { label: "赫利昂联合体" } },
  industryHeliosPassiveSlots: { orange: false, purple: false, blue: false },
};

heliosPassive.initializeHeliosPassiveMarkers(player);

assert.equal(heliosPassive.canGrantHeliosPassiveReward(player, "orange").ok, true);
assert.equal(heliosPassive.buildHeliosPassiveRewardEffect(player, "orange", "orange1")?.type, "industry_helios_passive_reward");

heliosPassive.placeHeliosPassiveSlot(player, "orange");
assert.equal(heliosPassive.canGrantHeliosPassiveReward(player, "orange").ok, false);
assert.equal(heliosPassive.canGrantHeliosPassiveReward(player, "purple").ok, true);

heliosPassive.clearHeliosPassiveSlots(player);
assert.equal(heliosPassive.canGrantHeliosPassiveReward(player, "orange").ok, true);
assert.equal(heliosPassive.getHeliosSlotReward("purple").additionalPublicScan, 1);

console.log("helios-passive.test.js: all tests passed");
