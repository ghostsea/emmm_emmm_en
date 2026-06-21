"use strict";

const assert = require("node:assert/strict");
const players = require("../players");
const playerTech = require("../tech/player-tech");
const scanEffects = require("./scan-effects");

const basePlayer = players.createPlayer({ color: "white" });

const noPurpleQueue = scanEffects.buildScanEffectQueue(basePlayer);
assert.equal(noPurpleQueue.length, 3);
assert.equal(noPurpleQueue[0].type, scanEffects.EFFECT_TYPES.PAY_SCAN_COST);
assert.equal(noPurpleQueue[0].abilityId, "payScanCost");
assert.equal(noPurpleQueue[0].icon, "scan_cost");
assert.match(scanEffects.EFFECT_ICONS.scan_cost, /cost\.webp$/);
assert.equal(noPurpleQueue[1].type, scanEffects.EFFECT_TYPES.EARTH_SECTOR_SCAN);
assert.equal(noPurpleQueue[1].icon, "earth_scan");
assert.equal(noPurpleQueue[2].type, scanEffects.EFFECT_TYPES.PUBLIC_CARD_SCAN);

const purplePlayer = players.createPlayer({ color: "blue" });
purplePlayer.techState = playerTech.createPlayerTechState({
  ownedTiles: { purple1: true, purple2: true, purple3: true, purple4: true },
});
const fullPurpleQueue = scanEffects.buildScanEffectQueue(purplePlayer);
assert.equal(fullPurpleQueue.length, 6);
assert.equal(fullPurpleQueue[0].type, scanEffects.EFFECT_TYPES.PAY_SCAN_COST);
assert.equal(fullPurpleQueue[1].type, scanEffects.EFFECT_TYPES.IMPROVED_SECTOR_SCAN);
assert.equal(fullPurpleQueue[2].type, scanEffects.EFFECT_TYPES.PUBLIC_CARD_SCAN);
assert.equal(fullPurpleQueue[3].type, scanEffects.EFFECT_TYPES.MERCURY_SECTOR_SCAN);
assert.equal(fullPurpleQueue[4].type, scanEffects.EFFECT_TYPES.HAND_SCAN);
assert.equal(fullPurpleQueue[5].type, scanEffects.EFFECT_TYPES.SCAN_ACTION_4);

const brokePlayer = players.createPlayer({ color: "green" });
brokePlayer.resources.credits = 0;
brokePlayer.resources.energy = 0;
const poorCheck = scanEffects.canExecuteScan(brokePlayer);
assert.equal(poorCheck.ok, false);

const richCheck = scanEffects.canExecuteScan(basePlayer);
assert.equal(richCheck.ok, true);

console.log("scan-effects.test.js: all tests passed");
