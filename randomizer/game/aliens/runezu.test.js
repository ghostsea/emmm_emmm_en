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

const orbitLandCard = runezu.createAlienCard(2, 1);
assert.equal(orbitLandCard.runezuTask.id, "runezu-2-orbit-land");
assert.deepEqual(
  orbitLandCard.runezuTask.steps.map((step) => step.event),
  ["orbitOrLand", "orbitOrLand", "orbitOrLand"],
);

const orbitLandStep1 = runezu.consumeTaskEvents(orbitLandCard, [{ type: "orbit" }]);
assert.equal(orbitLandStep1.ok, true);
assert.deepEqual(orbitLandStep1.symbolIds, ["symbol_4"]);
assert.equal(orbitLandStep1.completed, false);
assert.equal(orbitLandCard.runezuTaskProgress.length, 1);

const orbitLandNoMatch = runezu.consumeTaskEvents(orbitLandCard, [{ type: "launch" }]);
assert.equal(orbitLandNoMatch, null);
assert.equal(orbitLandCard.runezuTaskProgress.length, 1);

const orbitLandStep2 = runezu.consumeTaskEvents(orbitLandCard, [{ type: "land" }]);
assert.equal(orbitLandStep2.ok, true);
assert.deepEqual(orbitLandStep2.symbolIds, ["symbol_5"]);
assert.equal(orbitLandStep2.completed, false);
assert.equal(orbitLandCard.runezuTaskProgress.length, 2);

const orbitLandStep3 = runezu.consumeTaskEvents(orbitLandCard, [{ type: "orbit" }]);
assert.equal(orbitLandStep3.ok, true);
assert.deepEqual(orbitLandStep3.symbolIds, ["symbol_3"]);
assert.equal(orbitLandStep3.completed, true);
assert.equal(orbitLandCard.runezuTaskProgress.length, 3);
assert.equal(orbitLandCard.runezuTaskCompleted, true);

const techCard = runezu.createAlienCard(3, 1);
assert.equal(techCard.runezuTask.id, "runezu-3-tech");
assert.deepEqual(
  techCard.runezuTask.steps.map((step) => [step.event, step.techType]),
  [["researchTech", "orange"], ["researchTech", "purple"], ["researchTech", "blue"]],
);
assert.equal(runezu.consumeTaskEvents(techCard, [{ type: "researchTech", techType: "blue" }]), null);
assert.equal(techCard.runezuTaskProgress.length, 0);
const techStep1 = runezu.consumeTaskEvents(techCard, [{ type: "researchTech", techType: "orange" }]);
assert.equal(techStep1.ok, true);
assert.deepEqual(techStep1.symbolIds, ["symbol_4"]);
assert.equal(techStep1.completed, false);
const techStep2 = runezu.consumeTaskEvents(techCard, [{ type: "researchTech", techType: "purple" }]);
assert.equal(techStep2.ok, true);
assert.deepEqual(techStep2.symbolIds, ["symbol_1"]);
assert.equal(techStep2.completed, false);
const techStep3 = runezu.consumeTaskEvents(techCard, [{ type: "researchTech", techType: "blue" }]);
assert.equal(techStep3.ok, true);
assert.deepEqual(techStep3.symbolIds, ["symbol_6"]);
assert.equal(techStep3.completed, true);
assert.equal(techCard.runezuTaskCompleted, true);

const scanCard = runezu.createAlienCard(4, 1);
assert.equal(scanCard.runezuTask.id, "runezu-4-scan");
assert.deepEqual(
  scanCard.runezuTask.steps.map((step) => step.event),
  ["scanAction", "scanAction"],
);
assert.equal(runezu.consumeTaskEvents(scanCard, [{ type: "signalMarked" }]), null);
assert.equal(scanCard.runezuTaskProgress.length, 0);
const scanStep1 = runezu.consumeTaskEvents(scanCard, [{ type: "scanAction" }]);
assert.equal(scanStep1.ok, true);
assert.deepEqual(scanStep1.symbolIds, ["symbol_4"]);
assert.equal(scanStep1.completed, false);
const scanStep2 = runezu.consumeTaskEvents(scanCard, [{ type: "scanAction" }]);
assert.equal(scanStep2.ok, true);
assert.deepEqual(scanStep2.symbolIds, ["symbol_2"]);
assert.equal(scanStep2.completed, true);
assert.equal(scanCard.runezuTaskCompleted, true);

const legacyScanCard = runezu.createAlienCard(4, 2);
legacyScanCard.runezuTask.steps = legacyScanCard.runezuTask.steps.map((step) => ({ ...step, event: "scan" }));
assert.equal(runezu.consumeTaskEvents(legacyScanCard, [{ type: "signalMarked" }]), null);
const legacyScanStep = runezu.consumeTaskEvents(legacyScanCard, [{ type: "scanAction" }]);
assert.equal(legacyScanStep.ok, true);
assert.deepEqual(legacyScanStep.symbolIds, ["symbol_4"]);

const fullLaunchCard = runezu.createAlienCard(6, 2);
const launchStep1 = runezu.consumeTaskEvents(fullLaunchCard, [{ type: "launch" }]);
assert.equal(launchStep1.ok, true);
assert.deepEqual(launchStep1.symbolIds, ["symbol_1"]);
assert.equal(launchStep1.completed, false);
const launchStep2 = runezu.consumeTaskEvents(fullLaunchCard, [{ type: "launch" }]);
assert.equal(launchStep2.ok, true);
assert.deepEqual(launchStep2.symbolIds, ["symbol_7"]);
assert.equal(launchStep2.completed, true);
assert.equal(fullLaunchCard.runezuTaskCompleted, true);

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
