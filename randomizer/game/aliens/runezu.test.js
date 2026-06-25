"use strict";

const assert = require("node:assert/strict");
const runezu = require("./runezu");
const yichangdian = require("./yichangdian");

const card = runezu.createAlienCard(5, 1);

const yichangdianResult = runezu.consumeTaskEvents(card, [{
  type: "alienTrace",
  alienId: "异常点",
}]);
assert.equal(yichangdianResult.ok, true);
assert.deepEqual(yichangdianResult.symbolIds, ["symbol_6"]);
assert.equal(card.runezuTaskProgress.length, 1);

const runezuStateTraceResult = runezu.consumeTaskEvents(card, [{
  type: "alienTrace",
  alienId: runezu.ALIEN_ID,
  source: "alien_trace",
}]);
assert.equal(runezuStateTraceResult.ok, true);
assert.deepEqual(runezuStateTraceResult.symbolIds, ["symbol_5"]);
assert.equal(card.runezuTaskProgress.length, 2);

const runezuFaceTraceResult = runezu.consumeTaskEvents(card, [{
  type: "alienTrace",
  alienId: runezu.ALIEN_ID,
}]);
assert.equal(runezuFaceTraceResult.ok, true);
assert.deepEqual(runezuFaceTraceResult.symbolIds, ["symbol_2"]);
assert.equal(card.runezuTaskProgress.length, 3);

const yichangdianCard = yichangdian.createAlienCard(5, 1);
assert.equal(runezu.isRunezuCard(yichangdianCard), false);
assert.equal(runezu.getCardDefinition(yichangdianCard), null);
assert.equal(runezu.getCardTask(yichangdianCard), null);

const launchCard = runezu.createAlienCard(6, 1);
const launchResult = runezu.consumeTaskEvents(launchCard, [{ type: "launch" }]);
assert.equal(launchResult.ok, true);
assert.deepEqual(launchResult.symbolIds, ["symbol_1"]);

const alienState = { aliens: { 1: { revealed: true, alienId: runezu.ALIEN_ID } } };
const player = { id: "p1", color: "blue", runezuSymbols: {} };
runezu.ensureRunezuState(alienState);

assert.equal(runezu.canPlaceFaceSymbol(alienState, 4, player).ok, false);
runezu.gainPlayerSymbol(player, "symbol_4");
assert.equal(runezu.canPlaceFaceSymbol(alienState, 4, player).ok, true);
assert.equal(runezu.canPlaceFaceSymbol(alienState, 1, player).ok, false);

let faceResult = runezu.placePlayerSymbolOnFace(alienState, 4, player, "symbol_4");
assert.equal(faceResult.ok, true);
assert.deepEqual(faceResult.reward, {
  gain: {},
  dataCount: 0,
  drawCards: 1,
  pickCard: false,
  pickAlienCard: false,
  panelSymbol: false,
  refillPanelSymbol: false,
  panelSymbolSlotId: null,
  symbolId: null,
});

runezu.gainPlayerSymbol(player, "symbol_4");
assert.equal(
  runezu.listPlaceablePlayerSymbolsForFace(alienState, player).some((choice) => choice.symbolId === "symbol_4"),
  false,
);

runezu.gainPlayerSymbol(player, "symbol_5");
faceResult = runezu.placePlayerSymbolOnFace(alienState, 5, player, "symbol_5");
assert.equal(faceResult.ok, true);
assert.deepEqual(faceResult.reward.gain, { publicity: 1 });

runezu.gainPlayerSymbol(player, "symbol_1");
assert.equal(runezu.canPlaceFaceSymbol(alienState, 1, player).ok, true);
faceResult = runezu.placePlayerSymbolOnFace(alienState, 1, player, "symbol_1");
assert.equal(faceResult.ok, true);
assert.deepEqual(faceResult.reward.gain, { energy: 1 });

const threeTraceCard = runezu.createAlienCard(9, 1);
const stateTraceAlienState = {
  aliens: {
    1: {
      revealed: true,
      alienId: runezu.ALIEN_ID,
      assignedAlienId: runezu.ALIEN_ID,
      traces: {
        pink: { firstPlaced: true, ownerPlayerColor: "blue", extraCount: 0 },
        yellow: { firstPlaced: true, ownerPlayerColor: "blue", extraCount: 0 },
        blue: { firstPlaced: true, ownerPlayerColor: "blue", extraCount: 1 },
      },
    },
  },
  runezu: runezu.createRunezuState(),
};
runezu.ensureRunezuState(stateTraceAlienState).revealedSlotId = 1;
const readyThreeTraceTask = runezu.getReadyThreeTraceTask(threeTraceCard, stateTraceAlienState, player);
assert.equal(readyThreeTraceTask.task.id, "runezu-9-three-traces");
assert.equal(runezu.countTraceMarkers(stateTraceAlienState, player, "blue"), 2);

console.log("runezu.test.js: all tests passed");
