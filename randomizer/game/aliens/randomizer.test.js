"use strict";

const catalog = require("./catalog");
const state = require("./state");
const jiuzhe = require("./jiuzhe");
const yichangdian = require("./yichangdian");
const randomizer = require("./randomizer");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(catalog.ALIEN_TYPE_IDS.length === 8, "eight alien types");

let callIndex = 0;
const picks = [0.05, 0.2];
const random = () => picks[callIndex++ % picks.length];

const alienState = state.createDefaultAlienState();
const result = randomizer.randomizeAlienAssignments(alienState, random);

assert(result.ok, "randomize should succeed");
assert(Object.keys(result.assignments).length === 2, "two slot assignments");
assert(result.assignments[1] === jiuzhe.ALIEN_ID, "slot 1 should be fixed to Jiuzhe");
assert(result.assignments[2] === yichangdian.ALIEN_ID, "slot 2 should be fixed to Yichangdian");
assert(alienState.yichangdian, "randomize should initialize Yichangdian state");
assert(
  JSON.stringify(alienState.yichangdian.cardDeck) === JSON.stringify(yichangdian.CARD_DEFINITIONS.map((card) => card.index)),
  "Yichangdian deck should reset on randomize",
);

const assignedIds = Object.values(result.assignments);
assert(new Set(assignedIds).size === 2, "assigned aliens should be distinct");
assert(
  assignedIds.every((alienId) => catalog.ALIEN_TYPE_IDS.includes(alienId)),
  "assigned aliens should come from catalog",
);

for (const alienSlotId of [1, 2]) {
  const alienSlot = state.getAlienSlot(alienState, alienSlotId);
  assert(alienSlot.assignedAlienId === result.assignments[alienSlotId], "slot stores assignment");
  assert(!alienSlot.revealed, "slot should stay hidden after randomize");
}

console.log("aliens/randomizer.test.js ok");
