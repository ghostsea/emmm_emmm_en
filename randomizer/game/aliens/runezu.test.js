"use strict";

const assert = require("node:assert/strict");
const runezu = require("./runezu");

const card = runezu.createAlienCard(5, 1);

const yichangdianResult = runezu.consumeTaskEvents(card, [{
  type: "alienTrace",
  alienId: "异常点",
  alienTraceOrigin: "yichangdian-face",
}]);
assert.equal(yichangdianResult, null);
assert.deepEqual(card.runezuTaskProgress, []);

const runezuStateTraceResult = runezu.consumeTaskEvents(card, [{
  type: "alienTrace",
  alienId: runezu.ALIEN_ID,
  source: "alien_trace",
}]);
assert.equal(runezuStateTraceResult, null);
assert.deepEqual(card.runezuTaskProgress, []);

const runezuFaceTraceResult = runezu.consumeTaskEvents(card, [{
  type: "alienTrace",
  alienId: runezu.ALIEN_ID,
  alienTraceOrigin: runezu.TRACE_EVENT_ORIGIN,
}]);
assert.equal(runezuFaceTraceResult.ok, true);
assert.deepEqual(runezuFaceTraceResult.symbolIds, ["symbol_6"]);
assert.equal(card.runezuTaskProgress.length, 1);

const launchCard = runezu.createAlienCard(6, 1);
const launchResult = runezu.consumeTaskEvents(launchCard, [{ type: "launch" }]);
assert.equal(launchResult.ok, true);
assert.deepEqual(launchResult.symbolIds, ["symbol_1"]);

console.log("runezu.test.js: all tests passed");
