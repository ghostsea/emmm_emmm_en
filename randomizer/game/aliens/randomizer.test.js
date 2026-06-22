"use strict";

const catalog = require("./catalog");
const state = require("./state");
const jiuzhe = require("./jiuzhe");
const yichangdian = require("./yichangdian");
const fangzhou = require("./fangzhou");
const banrenma = require("./banrenma");
const chong = require("./chong");
const runezu = require("./runezu");
const randomizer = require("./randomizer");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(catalog.ALIEN_TYPE_IDS.length === 8, "eight alien types");

const alienState = state.createDefaultAlienState();
const result = randomizer.randomizeAlienAssignments(alienState);

assert(result.ok, "randomize should succeed");
assert(Object.keys(result.assignments).length === 2, "two slot assignments");
assert(result.assignments[1] === null, "slot 1 should not be preassigned");
assert(result.assignments[2] === null, "slot 2 should not be preassigned");
assert(alienState.jiuzhe, "randomize should initialize Jiuzhe state");
assert(alienState.yichangdian, "randomize should initialize Yichangdian state");
assert(
  JSON.stringify(alienState.yichangdian.cardDeck) === JSON.stringify(yichangdian.CARD_DEFINITIONS.map((card) => card.index)),
  "Yichangdian deck should reset on randomize",
);
assert(alienState.fangzhou, "randomize should initialize Fangzhou state");
assert(alienState.banrenma, "randomize should initialize Banrenma state");
assert(
  JSON.stringify(alienState.banrenma.cardDeck) === JSON.stringify(banrenma.CARD_DEFINITIONS.map((card) => card.index)),
  "Banrenma deck should reset on randomize",
);
assert(alienState.chong, "randomize should initialize Chong state");
assert(
  JSON.stringify(alienState.chong.cardDeck) === JSON.stringify(chong.CARD_DEFINITIONS.map((card) => card.index)),
  "Chong deck should reset on randomize",
);
assert(alienState.runezu, "randomize should initialize Runezu state");
assert(
  JSON.stringify(alienState.runezu.cardDeck) === JSON.stringify(runezu.CARD_DEFINITIONS.map((card) => card.index)),
  "Runezu deck should reset on randomize",
);

for (const alienSlotId of [1, 2]) {
  const alienSlot = state.getAlienSlot(alienState, alienSlotId);
  assert(alienSlot.assignedAlienId === null, "slot should not store an assignment before reveal");
  assert(!alienSlot.revealed, "slot should stay hidden after randomize");
}

for (const traceType of ["yellow", "pink", "blue"]) {
  state.placeFirstTrace(alienState, 1, traceType, "white");
}
const firstReveal = randomizer.revealRandomAlien(alienState, 1, () => 0);
assert(firstReveal.ok, "first reveal should succeed");
assert(firstReveal.alienId === jiuzhe.ALIEN_ID, "first reveal should use the random pool");
assert(state.getAlienSlot(alienState, 1).assignedAlienId === firstReveal.alienId, "revealed slot should store selected alien");

for (const traceType of ["yellow", "pink", "blue"]) {
  state.placeFirstTrace(alienState, 2, traceType, "blue");
}
const secondReveal = randomizer.revealRandomAlien(alienState, 2, () => 0);
assert(secondReveal.ok, "second reveal should succeed");
assert(secondReveal.alienId !== firstReveal.alienId, "revealed aliens should be distinct");
assert(
  catalog.ALIEN_TYPE_IDS.includes(secondReveal.alienId),
  "second revealed alien should come from catalog",
);
assert(secondReveal.alienId === banrenma.ALIEN_ID, "second reveal pool should exclude already revealed Jiuzhe");

console.log("aliens/randomizer.test.js ok");
