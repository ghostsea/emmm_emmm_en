"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const runezu = require("./runezu");
const yichangdian = require("./yichangdian");

function assertRunezuTaskRewardEffect(result, symbolIds) {
  if (Object.hasOwn(result, "ok")) assert.equal(result.ok, true);
  if (Object.hasOwn(result, "symbolIds")) assert.deepEqual(result.symbolIds, symbolIds);
  assert.equal(result.effects.length, symbolIds.length);
  result.effects.forEach((effect, index) => {
    const symbolId = symbolIds[index];
    assert.equal(effect.type, runezu.EFFECT_TYPES.SYMBOL_REWARD);
    assert.equal(effect.icon, symbolId);
    assert.equal(effect.options.symbolId, symbolId);
    assert.match(effect.label, new RegExp(`${runezu.formatSymbolLabel(symbolId)}奖励`));
  });
}

function assertRunezuSymbolAssetExists(symbolId) {
  const relativeSrc = runezu.getSymbolSrc(symbolId).replace(/^\.\.\//, "");
  const assetPath = path.resolve(__dirname, "..", "..", "..", relativeSrc);
  assert.equal(fs.existsSync(assetPath), true, `${symbolId} icon asset should exist at ${assetPath}`);
}

function assertRunezuCardTaskCanonical(card) {
  assert.deepEqual(card.runezuTask, runezu.getCardTask(card));
}

runezu.SYMBOL_IDS.forEach(assertRunezuSymbolAssetExists);

const card = runezu.createAlienCard(5, 1);

const yichangdianResult = runezu.consumeTaskEvents(card, [{
  type: "alienTrace",
  alienId: "异常点",
}]);
assertRunezuTaskRewardEffect(yichangdianResult, ["symbol_6"]);
assert.equal(card.runezuTaskProgress.length, 1);

const runezuStateTraceResult = runezu.consumeTaskEvents(card, [{
  type: "alienTrace",
  alienId: runezu.ALIEN_ID,
  source: "alien_trace",
}]);
assertRunezuTaskRewardEffect(runezuStateTraceResult, ["symbol_5"]);
assert.equal(card.runezuTaskProgress.length, 2);

const runezuFaceTraceResult = runezu.consumeTaskEvents(card, [{
  type: "alienTrace",
  alienId: runezu.ALIEN_ID,
}]);
assertRunezuTaskRewardEffect(runezuFaceTraceResult, ["symbol_2"]);
assert.equal(card.runezuTaskProgress.length, 3);

const staleTraceCard = runezu.createAlienCard(5, 2);
staleTraceCard.runezuTask.steps = staleTraceCard.runezuTask.steps.map((step) => ({
  ...step,
  event: "runezuTrace",
}));
const migratedTraceStep = runezu.consumeTaskEvents(staleTraceCard, [{ type: "alienTrace" }]);
assertRunezuTaskRewardEffect(migratedTraceStep, ["symbol_6"]);
assertRunezuCardTaskCanonical(staleTraceCard);
assert.deepEqual(runezu.getTaskProgressIndexes(staleTraceCard), [1]);

const yichangdianCard = yichangdian.createAlienCard(5, 1);
assert.equal(runezu.isRunezuCard(yichangdianCard), false);
assert.equal(runezu.getCardDefinition(yichangdianCard), null);
assert.equal(runezu.getCardTask(yichangdianCard), null);

const launchCard = runezu.createAlienCard(6, 1);
const launchResult = runezu.consumeTaskEvents(launchCard, [{ type: "launch" }]);
assertRunezuTaskRewardEffect(launchResult, ["symbol_1"]);

const orbitLandCard = runezu.createAlienCard(2, 1);
assert.equal(orbitLandCard.runezuTask.id, "runezu-2-orbit-land");
assert.deepEqual(
  orbitLandCard.runezuTask.steps.map((step) => step.event),
  ["orbitOrLand", "orbitOrLand", "orbitOrLand"],
);

const orbitLandStep1 = runezu.consumeTaskEvents(orbitLandCard, [{ type: "orbit" }]);
assertRunezuTaskRewardEffect(orbitLandStep1, ["symbol_4"]);
assert.equal(orbitLandStep1.completed, false);
assert.equal(orbitLandCard.runezuTaskProgress.length, 1);

const orbitLandNoMatch = runezu.consumeTaskEvents(orbitLandCard, [{ type: "launch" }]);
assert.equal(orbitLandNoMatch, null);
assert.equal(orbitLandCard.runezuTaskProgress.length, 1);

const orbitLandStep2 = runezu.consumeTaskEvents(orbitLandCard, [{ type: "land" }]);
assertRunezuTaskRewardEffect(orbitLandStep2, ["symbol_5"]);
assert.equal(orbitLandStep2.completed, false);
assert.equal(orbitLandCard.runezuTaskProgress.length, 2);

const orbitLandStep3 = runezu.consumeTaskEvents(orbitLandCard, [{ type: "orbit" }]);
assertRunezuTaskRewardEffect(orbitLandStep3, ["symbol_3"]);
assert.equal(orbitLandStep3.completed, true);
assert.equal(orbitLandCard.runezuTaskProgress.length, 3);
assert.equal(orbitLandCard.runezuTaskCompleted, true);
assert.equal(runezu.isTaskUnfinished(orbitLandCard), false);

const staleOrbitOnlyCard = runezu.createAlienCard(2, 2);
staleOrbitOnlyCard.runezuTask.steps = staleOrbitOnlyCard.runezuTask.steps.map((step) => ({
  ...step,
  event: "orbit",
}));
const migratedLandStep = runezu.consumeTaskEvents(staleOrbitOnlyCard, [{ type: "land" }]);
assertRunezuTaskRewardEffect(migratedLandStep, ["symbol_4"]);
assert.deepEqual(
  staleOrbitOnlyCard.runezuTask.steps.map((step) => step.event),
  ["orbitOrLand", "orbitOrLand", "orbitOrLand"],
);
assertRunezuCardTaskCanonical(staleOrbitOnlyCard);
assert.deepEqual(runezu.getTaskProgressIndexes(staleOrbitOnlyCard), [1]);
assert.equal(runezu.isTaskUnfinished(staleOrbitOnlyCard), true);

const techCard = runezu.createAlienCard(3, 1);
assert.equal(techCard.runezuTask.id, "runezu-3-tech");
assert.deepEqual(
  techCard.runezuTask.steps.map((step) => [step.event, step.techType]),
  [["researchTech", "orange"], ["researchTech", "purple"], ["researchTech", "blue"]],
);
assert.equal(runezu.consumeTaskEvents(techCard, [{ type: "researchTech", techType: "blue" }]), null);
assert.equal(techCard.runezuTaskProgress.length, 0);
const techStep1 = runezu.consumeTaskEvents(techCard, [{ type: "researchTech", techType: "orange" }]);
assertRunezuTaskRewardEffect(techStep1, ["symbol_4"]);
assert.equal(techStep1.completed, false);
const techStep2 = runezu.consumeTaskEvents(techCard, [{ type: "researchTech", techType: "purple" }]);
assertRunezuTaskRewardEffect(techStep2, ["symbol_1"]);
assert.equal(techStep2.completed, false);
const techStep3 = runezu.consumeTaskEvents(techCard, [{ type: "researchTech", techType: "blue" }]);
assertRunezuTaskRewardEffect(techStep3, ["symbol_6"]);
assert.equal(techStep3.completed, true);
assert.equal(techCard.runezuTaskCompleted, true);

const staleTechCard = runezu.createAlienCard(3, 2);
staleTechCard.runezuTask.steps = staleTechCard.runezuTask.steps.map((step) => ({
  ...step,
  event: "research",
}));
const migratedTechStep = runezu.consumeTaskEvents(staleTechCard, [{ type: "researchTech", techType: "orange" }]);
assertRunezuTaskRewardEffect(migratedTechStep, ["symbol_4"]);
assertRunezuCardTaskCanonical(staleTechCard);
assert.deepEqual(runezu.getTaskProgressIndexes(staleTechCard), [1]);

const scanCard = runezu.createAlienCard(4, 1);
assert.equal(scanCard.runezuTask.id, "runezu-4-scan");
assert.deepEqual(
  scanCard.runezuTask.steps.map((step) => step.event),
  ["scanAction", "scanAction"],
);
assert.equal(runezu.consumeTaskEvents(scanCard, [{ type: "signalMarked" }]), null);
assert.equal(scanCard.runezuTaskProgress.length, 0);
const scanStep1 = runezu.consumeTaskEvents(scanCard, [{ type: "scanAction" }]);
assertRunezuTaskRewardEffect(scanStep1, ["symbol_4"]);
assert.equal(scanStep1.completed, false);
const scanStep2 = runezu.consumeTaskEvents(scanCard, [{ type: "scanAction" }]);
assertRunezuTaskRewardEffect(scanStep2, ["symbol_2"]);
assert.equal(scanStep2.completed, true);
assert.equal(scanCard.runezuTaskCompleted, true);

const legacyScanCard = runezu.createAlienCard(4, 2);
legacyScanCard.runezuTask.steps = legacyScanCard.runezuTask.steps.map((step) => ({ ...step, event: "scan" }));
assert.equal(runezu.consumeTaskEvents(legacyScanCard, [{ type: "signalMarked" }]), null);
const legacyScanStep = runezu.consumeTaskEvents(legacyScanCard, [{ type: "scanAction" }]);
assertRunezuTaskRewardEffect(legacyScanStep, ["symbol_4"]);
assertRunezuCardTaskCanonical(legacyScanCard);
assert.deepEqual(runezu.getTaskProgressIndexes(legacyScanCard), [1]);

const fullLaunchCard = runezu.createAlienCard(6, 2);
const launchStep1 = runezu.consumeTaskEvents(fullLaunchCard, [{ type: "launch" }]);
assertRunezuTaskRewardEffect(launchStep1, ["symbol_1"]);
assert.equal(launchStep1.completed, false);
const launchStep2 = runezu.consumeTaskEvents(fullLaunchCard, [{ type: "launch" }]);
assertRunezuTaskRewardEffect(launchStep2, ["symbol_7"]);
assert.equal(launchStep2.completed, true);
assert.equal(fullLaunchCard.runezuTaskCompleted, true);

const staleLaunchCard = runezu.createAlienCard(6, 3);
staleLaunchCard.runezuTask.steps = staleLaunchCard.runezuTask.steps.map((step) => ({
  ...step,
  event: "launchProbe",
}));
const migratedLaunchStep = runezu.consumeTaskEvents(staleLaunchCard, [{ type: "launch" }]);
assertRunezuTaskRewardEffect(migratedLaunchStep, ["symbol_1"]);
assertRunezuCardTaskCanonical(staleLaunchCard);
assert.deepEqual(runezu.getTaskProgressIndexes(staleLaunchCard), [1]);

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

const rewardLookupState = { aliens: { 1: { revealed: true, alienId: runezu.ALIEN_ID } } };
const rewardRunezuState = runezu.ensureRunezuState(rewardLookupState);
rewardRunezuState.faceSymbolSlots = {
  1: { position: 1, symbolId: "symbol_4" },
  2: { position: 2, symbolId: "symbol_5" },
  3: { position: 3, symbolId: "symbol_3" },
  4: { position: 4, symbolId: "symbol_1" },
  5: { position: 5, symbolId: "symbol_6" },
  6: { position: 6, symbolId: "symbol_2" },
  7: { position: 7, symbolId: "symbol_7" },
};
const rewardBySymbol = Object.fromEntries(runezu.SYMBOL_IDS.map((symbolId) => {
  const lookup = runezu.getTraceFaceRewardForSymbol(rewardLookupState, symbolId);
  assert.equal(lookup.ok, true);
  return [symbolId, { position: lookup.position, reward: lookup.reward }];
}));
assert.equal(rewardBySymbol.symbol_4.position, 1);
assert.deepEqual(rewardBySymbol.symbol_4.reward.gain, { energy: 1 });
assert.equal(rewardBySymbol.symbol_5.position, 2);
assert.deepEqual(rewardBySymbol.symbol_5.reward.gain, { additionalPublicScan: 1 });
assert.equal(rewardBySymbol.symbol_3.position, 3);
assert.deepEqual(rewardBySymbol.symbol_3.reward.gain, { credits: 1 });
assert.equal(rewardBySymbol.symbol_1.position, 4);
assert.equal(rewardBySymbol.symbol_1.reward.drawCards, 1);
assert.equal(rewardBySymbol.symbol_6.position, 5);
assert.deepEqual(rewardBySymbol.symbol_6.reward.gain, { publicity: 1 });
assert.equal(rewardBySymbol.symbol_2.position, 6);
assert.equal(rewardBySymbol.symbol_2.reward.dataCount, 1);
assert.equal(rewardBySymbol.symbol_7.position, 7);
assert.deepEqual(rewardBySymbol.symbol_7.reward.gain, { score: 3 });

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
assertRunezuTaskRewardEffect(readyThreeTraceTask, ["symbol_6", "symbol_3"]);
assert.equal(runezu.countTraceMarkers(stateTraceAlienState, player, "blue"), 2);

const staleThreeTraceCard = runezu.createAlienCard(9, 2);
staleThreeTraceCard.runezuTask.rewards = ["symbol_1"];
const migratedThreeTraceTask = runezu.getReadyThreeTraceTask(staleThreeTraceCard, stateTraceAlienState, player);
assertRunezuTaskRewardEffect(migratedThreeTraceTask, ["symbol_6", "symbol_3"]);
assertRunezuCardTaskCanonical(staleThreeTraceCard);
assert.equal(runezu.isTaskUnfinished(staleThreeTraceCard), true);

console.log("runezu.test.js: all tests passed");
