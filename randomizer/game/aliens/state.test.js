"use strict";

const placement = require("./placement");
const state = require("./state");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const alienState = state.createDefaultAlienState();

let result = state.placeFirstTrace(alienState, 1, "yellow", "blue");
assert(result.ok && !result.extraOnly, "first yellow trace should place");

result = state.addExtraTrace(alienState, 1, "yellow");
assert(result.ok && result.extraOnly, "extra yellow trace should increment extraCount");

result = state.placeFirstTrace(alienState, 1, "pink", "blue");
result = state.placeFirstTrace(alienState, 1, "blue", "white");
assert(state.isAlienReadyToReveal(state.getAlienSlot(alienState, 1)), "all first traces placed");

result = state.revealAlien(alienState, 1, "alien-a");
assert(result.ok, "reveal should succeed");
assert(state.getAlienSlot(alienState, 1).revealed, "alien should be revealed");

assert(placement.TRACE_TYPES.length === 3, "three trace types");
console.log("aliens/state.test.js ok");
