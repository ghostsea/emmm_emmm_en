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

console.log("runezu.test.js: all tests passed");
