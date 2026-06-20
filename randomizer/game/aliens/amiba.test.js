const assert = require("node:assert/strict");

globalThis.SetiAlienPlacement = require("./placement");
const amiba = require("./amiba");

function createState() {
  return {
    aliens: {
      1: {
        revealed: true,
        alienId: amiba.ALIEN_ID,
        assignedAlienId: amiba.ALIEN_ID,
        traces: {},
      },
    },
    amiba: amiba.createAmibaState(),
  };
}

const white = { id: "player-white", color: "white", colorLabel: "白色" };
const state = createState();
amiba.initializeAmibaReveal(state, 1, white, () => 0);
amiba.seedDebugSymbols(state);

assert.equal(state.amiba.symbolSlots.orange_1, "symbol_1");
assert.equal(state.amiba.symbolSlots.orange_2, "symbol_2");
assert.equal(state.amiba.symbolSlots.blue_3, "symbol_3");
assert.equal(state.amiba.symbolSlots.red_1, "symbol_4");
assert.equal(state.amiba.symbolSlots.red_2, "symbol_5");
assert.equal(amiba.formatSymbolSlotLabel("blue_3"), "蓝3");

const orangeReward = amiba.resolveRegionReward(state, "orange");
assert.equal(orangeReward.results.length, 2);
assert.equal(state.amiba.symbolSlots.orange_2, "symbol_1");
assert.equal(state.amiba.symbolSlots.blue_1, "symbol_2");

const traceState = createState();
amiba.initializeAmibaReveal(traceState, 1, white, () => 0);
const placedPink = amiba.placeAmibaTrace(traceState, 1, "pink", 1, white);
const placedYellow = amiba.placeAmibaTrace(traceState, 1, "yellow", 1, white);
const placedBlue = amiba.placeAmibaTrace(traceState, 1, "blue", 1, white);
assert.equal(placedPink.reward.region, "red");
assert.equal(placedYellow.reward.region, "orange");
assert.equal(placedBlue.reward.region, "blue");
assert.equal(amiba.countTraceMarkers(traceState, white, null), 3);
assert.equal(amiba.isTheoryTaskReady(traceState, white), true);
assert.equal(amiba.getTheoryTaskReward(traceState).emptyCount, 9);

const removed = amiba.removePlayerTrace(traceState, 1, "pink", 1, white);
assert.equal(removed.ok, true);
assert.equal(removed.reward.region, "red");
assert.equal(amiba.countTraceMarkers(traceState, white, "pink"), 0);

const debugState = createState();
amiba.initializeAmibaReveal(debugState, 1, white, () => 0);
const debugPlaced = amiba.seedDebugTraceGrid(debugState, 1, white);
assert.equal(debugPlaced.length, 12);
assert.equal(amiba.getTheoryTaskReward(debugState).emptyCount, 0);

assert.equal(amiba.createAlienCard(5, 1).cardTypeCode, 3);
assert.equal(amiba.getFinalTraceTypeForCard(amiba.createAlienCard(6, 2)), "yellow");
assert.equal(amiba.buildImmediateEffects(9)[0].type, "launch");
assert.equal(amiba.buildImmediateEffects(9)[1].type, amiba.EFFECT_TYPES.CHOOSE_SYMBOL_REWARD);

console.log("amiba.test.js: all tests passed");
