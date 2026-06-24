"use strict";

const assert = require("node:assert/strict");
const players = require("../players");
const playerTech = require("../tech/player-tech");
const scanEffects = require("./scan-effects");

const basePlayer = players.createPlayer({ color: "white" });

const noPurpleQueue = scanEffects.buildScanEffectQueue(basePlayer);
assert.equal(noPurpleQueue.length, 2);
assert.equal(noPurpleQueue[0].type, scanEffects.EFFECT_TYPES.EARTH_SECTOR_SCAN);
assert.equal(noPurpleQueue[0].icon, "earth_scan");
assert.equal(noPurpleQueue[1].type, scanEffects.EFFECT_TYPES.PUBLIC_CARD_SCAN);
assert.match(scanEffects.EFFECT_ICONS.scan_cost, /cost\.webp$/);

const fullNoPurpleQueue = scanEffects.buildScanEffectQueue(basePlayer, {
  includeFinalize: true,
  fullScanAction: true,
  scanRunId: "scan-test",
});
assert.equal(fullNoPurpleQueue.length, 2);
assert.equal(fullNoPurpleQueue[1].type, scanEffects.EFFECT_TYPES.PUBLIC_CARD_SCAN);
assert.equal(fullNoPurpleQueue[1].options.scanRunId, "scan-test");
assert.equal(fullNoPurpleQueue[1].options.fullScanAction, true);

const purplePlayer = players.createPlayer({ color: "blue" });
purplePlayer.techState = playerTech.createPlayerTechState({
  ownedTiles: { purple1: true, purple2: true, purple3: true, purple4: true },
});
const fullPurpleQueue = scanEffects.buildScanEffectQueue(purplePlayer);
assert.equal(fullPurpleQueue.length, 5);
assert.equal(fullPurpleQueue[0].type, scanEffects.EFFECT_TYPES.IMPROVED_SECTOR_SCAN);
assert.equal(fullPurpleQueue[1].type, scanEffects.EFFECT_TYPES.PUBLIC_CARD_SCAN);
assert.equal(fullPurpleQueue[2].type, scanEffects.EFFECT_TYPES.MERCURY_SECTOR_SCAN);
assert.deepEqual(fullPurpleQueue[2].options.cost, { publicity: 1 });
assert.equal(fullPurpleQueue[3].type, scanEffects.EFFECT_TYPES.HAND_SCAN);
assert.equal(fullPurpleQueue[4].type, scanEffects.EFFECT_TYPES.SCAN_ACTION_4);

const completePurpleQueue = scanEffects.buildScanEffectQueue(purplePlayer, {
  includeFinalize: true,
  fullScanAction: true,
  scanRunId: "purple-scan-test",
});
assert.equal(completePurpleQueue.length, 5);
assert.equal(completePurpleQueue[1].options.scanRunId, "purple-scan-test");
assert.equal(completePurpleQueue[4].type, scanEffects.EFFECT_TYPES.SCAN_ACTION_4);
assert.equal(completePurpleQueue[4].options.fullScanAction, true);

const borrowedPurpleCases = [
  ["purple1", scanEffects.EFFECT_TYPES.IMPROVED_SECTOR_SCAN],
  ["purple2", scanEffects.EFFECT_TYPES.MERCURY_SECTOR_SCAN],
  ["purple3", scanEffects.EFFECT_TYPES.HAND_SCAN],
  ["purple4", scanEffects.EFFECT_TYPES.SCAN_ACTION_4],
];
for (const [tileId, expectedType] of borrowedPurpleCases) {
  const borrowedPlayer = players.createPlayer({ color: "brown" });
  borrowedPlayer.industryBorrowedTechTileId = tileId;
  borrowedPlayer.industryBorrowedTechRound = 3;
  borrowedPlayer.industryBorrowedTechTurn = 2;
  const level = Number(tileId.replace("purple", ""));
  assert.equal(scanEffects.playerOwnsPurpleTech(borrowedPlayer, level, { roundNumber: 3, turnNumber: 2 }), true);
  assert.equal(scanEffects.playerOwnsPurpleTech(borrowedPlayer, level, { roundNumber: 3, turnNumber: 3 }), false);
  assert.equal(
    scanEffects.buildScanEffectQueue(borrowedPlayer, { roundNumber: 3, turnNumber: 2 })
      .some((effect) => effect.type === expectedType),
    true,
  );
  assert.equal(
    scanEffects.buildScanEffectQueue(borrowedPlayer, { roundNumber: 3, turnNumber: 3 })
      .some((effect) => effect.type === expectedType),
    false,
  );
}

const brokePlayer = players.createPlayer({ color: "green" });
brokePlayer.resources.credits = 0;
brokePlayer.resources.energy = 0;
const poorCheck = scanEffects.canExecuteScan(brokePlayer);
assert.equal(poorCheck.ok, false);

const richCheck = scanEffects.canExecuteScan(basePlayer);
assert.equal(richCheck.ok, true);

console.log("scan-effects.test.js: all tests passed");
