"use strict";

const placement = require("./placement");
const state = require("./state");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const alienState = state.createDefaultAlienState();

assert(state.getFirstTraceRewardForSlot(1).gain.score === 5,
  "alien slot 1 first trace should award 5 score");
assert(state.getFirstTraceRewardForSlot(1).gain.publicity === 1,
  "alien slot 1 first trace should award 1 publicity");
assert(state.getFirstTraceRewardForSlot(2).gain.score === 3,
  "alien slot 2 first trace should award 3 score");
assert(state.getFirstTraceRewardForSlot(2).gain.publicity === 1,
  "alien slot 2 first trace should award 1 publicity");
assert(state.getFirstTraceRewardForSlot(3) === null,
  "unknown alien slots should not have first trace rewards");

let result = state.placeFirstTrace(alienState, 1, "yellow", "blue");
assert(result.ok && !result.extraOnly, "first yellow trace should place");

result = state.addExtraTrace(alienState, 1, "yellow");
assert(result.ok && result.extraOnly, "extra yellow trace should increment extraCount");

result = state.placeFirstTrace(alienState, 1, "pink", "blue");
result = state.placeFirstTrace(alienState, 1, "blue", "white");
assert(state.isAlienReadyToReveal(state.getAlienSlot(alienState, 1)), "all first traces placed");

alienState.aliens[1].assignedAlienId = "虫";
result = state.revealAlien(alienState, 1);
assert(result.ok, "reveal should succeed");
assert(state.getAlienSlot(alienState, 1).revealed, "alien should be revealed");
assert(state.getAlienSlot(alienState, 1).alienId === "虫", "reveal should use assigned alien");

result = state.addExtraTrace(alienState, 1, "yellow");
assert(result.ok && result.extraOnly, "extra trace should work after reveal");

const freshState = state.createDefaultAlienState();
state.placeFirstTrace(freshState, 2, "yellow", "blue");
state.placeFirstTrace(freshState, 2, "pink", "blue");
state.placeFirstTrace(freshState, 2, "blue", "white");
state.addExtraTrace(freshState, 2, "yellow");
const traceCounts = state.countFirstTracesByPlayerOnSlot(freshState, 2, [
  { id: "p-blue", color: "blue" },
  { id: "p-white", color: "white" },
  { id: "p-red", color: "red" },
]);
assert(traceCounts.length === 2, "only players with first traces should be listed");
assert(traceCounts.find((entry) => entry.playerColor === "blue").count === 2, "blue should own two first traces");
assert(traceCounts.find((entry) => entry.playerColor === "white").count === 1, "white should own one first trace");
assert(
  state.countTraceMarkersForPlayerOnSlot(freshState, 2, { color: "blue" }, "yellow") === 2,
  "state trace marker count should include the first trace and extra traces",
);
assert(
  state.countTraceMarkersForPlayerOnSlot(freshState, 2, { color: "blue" }) === 3,
  "state trace marker count should include all owned trace colors",
);
result = state.revealAlien(freshState, 2);
assert(!result.ok, "reveal without assignment should fail");

assert(placement.TRACE_TYPES.length === 3, "three trace types");
console.log("aliens/state.test.js ok");
