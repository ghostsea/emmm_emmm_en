const assert = require("node:assert/strict");
const finalScoring = require("./final-scoring");
const actionHistory = require("./history/action-history");
const historyCommands = require("./history/commands");

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

const preservedPendingState = finalScoring.createFinalScoringState(["a", "b"]);
const preservedWhite = player("preserved-white", 25);
const preservedBlue = player("preserved-blue", 50);
finalScoring.syncPendingMarks(preservedPendingState, [preservedWhite, preservedBlue]);
preservedWhite.resources.score = 70;
const preservedSync = finalScoring.syncPendingMarks(
  preservedPendingState,
  [preservedWhite],
  { preserveOtherPlayers: true },
);
assert.deepEqual(
  preservedSync.added.map((item) => item.threshold),
  [50, 70],
  "turn-end sync should add every newly reached threshold for the ending player",
);
assert.deepEqual(
  finalScoring.getPendingMarksForPlayer(preservedPendingState, preservedBlue.id)
    .map((item) => item.threshold),
  [25, 50],
  "syncing one ending player should not discard another player's existing pending marks",
);

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

const startup = finalScoring.placeDirectMarkAtSlot(state, "c", white, 3, { tokenSrc: "white.png" });
assert.equal(startup.ok, true);
assert.equal(startup.mark.slotIndex, 3);
assert.equal(startup.mark.source, "direct");

const undoState = finalScoring.createFinalScoringState(["a", "b"]);
const undoPlayer = player("undo", 25);
finalScoring.syncPendingMarks(undoState, [undoPlayer]);
const beforeUndoableMark = structuredClone(undoState);
const undoHistory = actionHistory.createActionHistory();
undoHistory.beginSession("quick", "快速行动");
undoHistory.beginStep({ source: "quick", type: "final_score_mark", label: "标记终局" });
const undoableMark = finalScoring.markTile(undoState, "a", undoPlayer, { tokenSrc: "undo.png" });
assert.equal(undoableMark.ok, true);
undoHistory.record(historyCommands.createRestoreObjectCommand(
  undoState,
  beforeUndoableMark,
  "恢复终局标记前状态",
));
undoHistory.endStep();
assert.equal(undoHistory.hasUndoableStep(), true);
assert.equal(undoState.tiles.a.marks.length, 1);
assert.equal(finalScoring.getPendingMarksForPlayer(undoState, undoPlayer.id).length, 0);
const undoResult = undoHistory.undoLastStep();
assert.equal(undoResult.ok, true);
assert.equal(undoState.tiles.a.marks.length, 0);
assert.deepEqual(
  finalScoring.getPendingMarksForPlayer(undoState, undoPlayer.id).map((item) => item.threshold),
  [25],
);

console.log("final-scoring tests passed");
