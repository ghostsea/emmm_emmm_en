const assert = require("node:assert/strict");
const finalScoring = require("./final-scoring");

function player(color, score) {
  return {
    id: `player-${color}`,
    color,
    colorLabel: color,
    resources: { score },
  };
}

const state = finalScoring.createFinalScoringState(["a", "b"]);
const white = player("white", 24);
let sync = finalScoring.syncPendingMarks(state, [white]);
assert.equal(sync.added.length, 0);
assert.equal(finalScoring.getPendingMarksForPlayer(state, white.id).length, 0);

white.resources.score = 70;
sync = finalScoring.syncPendingMarks(state, [white]);
assert.deepEqual(sync.added.map((item) => item.threshold), [25, 50, 70]);

let first = finalScoring.markTile(state, "a", white, { tokenSrc: "white.png" });
assert.equal(first.ok, true);
assert.equal(first.mark.threshold, 25);
assert.equal(first.mark.slotIndex, 1);

const duplicateTile = finalScoring.markTile(state, "a", white, { tokenSrc: "white.png" });
assert.equal(duplicateTile.ok, false);

const blue = player("blue", 25);
finalScoring.syncPendingMarks(state, [white, blue]);
const second = finalScoring.markTile(state, "a", blue, { tokenSrc: "blue.png" });
assert.equal(second.ok, true);
assert.equal(second.mark.slotIndex, 2);

const green = player("green", 25);
finalScoring.syncPendingMarks(state, [white, blue, green]);
const third = finalScoring.markTile(state, "a", green, { tokenSrc: "green.png" });
assert.equal(third.ok, true);
assert.equal(third.mark.slotIndex, 3);
assert.equal(third.mark.slot3Order, 1);

const brown = player("brown", 25);
finalScoring.syncPendingMarks(state, [white, blue, green, brown]);
const fourth = finalScoring.markTile(state, "a", brown, { tokenSrc: "brown.png" });
assert.equal(fourth.ok, true);
assert.equal(fourth.mark.slotIndex, 3);
assert.equal(fourth.mark.slot3Order, 2);

assert.equal(finalScoring.getTileVariant(state, "a"), 1);
finalScoring.setTileVariants(state, { a: 2, b: 1 });
assert.equal(finalScoring.getTileVariant(state, "a"), 2);

const whiteSecondTile = finalScoring.markTile(state, "b", white, { tokenSrc: "white.png" });
assert.equal(whiteSecondTile.ok, true);
assert.equal(whiteSecondTile.mark.threshold, 50);
assert.equal(finalScoring.getPendingMarksForPlayer(state, white.id).length, 1);

white.resources.score = 40;
finalScoring.syncPendingMarks(state, [white, blue, green, brown]);
assert.equal(finalScoring.getPendingMarksForPlayer(state, white.id).length, 0);

console.log("final-scoring tests passed");
