"use strict";

const assert = require("node:assert/strict");
const yichangdian = require("./yichangdian");
const state = require("./state");

const alienState = state.createDefaultAlienState();
alienState.aliens[2].assignedAlienId = yichangdian.ALIEN_ID;
alienState.aliens[2].alienId = yichangdian.ALIEN_ID;
alienState.aliens[2].revealed = true;

const white = {
  id: "player-white",
  color: "white",
  colorLabel: "白色",
  resources: { score: 10, credits: 2, energy: 2, publicity: 0, availableData: 0 },
};
const blue = {
  id: "player-blue",
  color: "blue",
  colorLabel: "蓝色",
  resources: { score: 5, credits: 0, energy: 0, publicity: 0, availableData: 0 },
};

const revealResult = yichangdian.initializeYichangdianReveal(alienState, 2, white, 4, () => 0);
assert.equal(revealResult.ok, true);
assert.deepEqual(
  revealResult.anomalies.map((anomaly) => [anomaly.markerId, anomaly.sectorX, anomaly.y, anomaly.traceType]),
  [
    ["a_1", 4, 4, "pink"],
    ["b_1", 1, 4, "yellow"],
    ["c_1", 7, 4, "blue"],
  ],
);
assert.deepEqual(
  revealResult.anomalies.map((anomaly) => anomaly.src),
  [
    "../assets/aliens/异常点/a_1.png",
    "../assets/aliens/异常点/b_1.png",
    "../assets/aliens/异常点/c_1.png",
  ],
);
assert.equal(yichangdian.getAnomalyMarkerSrc("a_2"), "../assets/aliens/异常点/a_2.png");
assert.equal(revealResult.nextAnomalySectorX, 1, "earth x=4 should next trigger sector 1 while x decreases");

let result = yichangdian.placeYichangdianTrace(alienState, 2, "pink", 1, white);
assert.equal(result.ok, true);
assert.equal(result.reward.gain.score, 2);
result = yichangdian.placeYichangdianTrace(alienState, 2, "pink", 1, blue);
assert.equal(result.ok, true, "position 1 can stack");
assert.equal(
  yichangdian.getTopTraceEntry(alienState, 2, "pink").playerColor,
  "blue",
  "later position 1 marker should be higher",
);

result = yichangdian.placeYichangdianTrace(alienState, 2, "yellow", 4, white);
assert.equal(result.ok, true);
assert.equal(result.reward.pickAlienCard, true);
result = yichangdian.placeYichangdianTrace(alienState, 2, "yellow", 4, blue);
assert.equal(result.ok, false, "positions 2-5 cannot be occupied twice");

const anomalyReward = yichangdian.getAnomalyReward("b_2");
assert.equal(anomalyReward.traceType, "yellow");
assert.equal(anomalyReward.pickCard, true);

const debugState = state.createDefaultAlienState();
debugState.aliens[1].assignedAlienId = yichangdian.ALIEN_ID;
debugState.aliens[1].alienId = yichangdian.ALIEN_ID;
debugState.aliens[1].revealed = true;
yichangdian.seedDebugTraceGrid(debugState, 1, white);
assert.equal(yichangdian.listTraceEntries(debugState, 1).length, 15, "debug grid should place 3x5 tokens");
assert.equal(yichangdian.getTraceGrid(debugState, 1).pink[1].length, 1, "debug only places one position-1 token");

const displayed = yichangdian.takeDisplayedCard(alienState, () => 0);
assert.equal(displayed.ok, true);
assert.equal(displayed.card.set, "alien:异常点");
assert.equal(displayed.card.yichangdianCard, true);
assert.match(displayed.card.src, /assets\/aliens\/异常点\/cards\/\d\.webp/);
const blind = yichangdian.blindDrawCard(alienState, () => 0);
assert.equal(blind.ok, true);
assert.equal(blind.card.cardId.startsWith("yichangdian_"), true);

console.log("aliens/yichangdian.test.js ok");
