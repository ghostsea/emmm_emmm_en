"use strict";

const assert = require("node:assert/strict");
const vm = require("node:vm");
const { buildIndependentAlienSeedScript } = require("./ai_alien_seed.js");
const randomizer = require("../randomizer/game/aliens/randomizer.js");
const stateApi = require("../randomizer/game/aliens/state.js");
const placement = require("../randomizer/game/aliens/placement.js");

function run(seed, reverse = false, pool = null) {
  const context = vm.createContext({ SetiAlienPlacement: placement });
  vm.runInContext(buildIndependentAlienSeedScript(seed), context);
  context.SetiAlienRandomizer = randomizer;
  const api = context.SetiAlienRandomizer;
  const state = stateApi.createDefaultAlienState();
  randomizer.randomizeAlienAssignments(state, pool ? { alienPoolIds: pool } : {});
  const untouched = JSON.stringify(state);
  assert.equal(api.revealRandomAlien(state, 1).ok, false);
  assert.equal(JSON.stringify(state), untouched, "invalid reveal must leave hidden identities unset");
  for (const id of placement.ALIEN_SLOT_IDS) {
    assert.equal(state.aliens[id].assignedAlienId, null);
    assert.equal(state.aliens[id].alienId, null);
    for (const trace of placement.TRACE_TYPES) stateApi.placeFirstTrace(state, id, trace, "white");
  }
  const ids = reverse ? [...placement.ALIEN_SLOT_IDS].reverse() : placement.ALIEN_SLOT_IDS;
  for (const id of ids) {
    for (let index = 0; index < (reverse ? 231 : 0); index += 1) Math.random();
    assert.equal(api.revealRandomAlien(state, id).ok, true);
    assert.equal(api.revealRandomAlien(state, id).ok, false);
  }
  return placement.ALIEN_SLOT_IDS.map((id) => state.aliens[id].alienId);
}

for (let index = 0; index < 20; index += 1) {
  const seed = `alien-pair:${index}`;
  const pair = run(seed);
  assert.deepEqual(run(seed, true), pair, "slot identities must survive different action RNG consumption and reveal order");
  assert.equal(new Set(pair).size, 2);
}
assert.ok(new Set(Array.from({ length: 20 }, (_, index) => run(`alien-pair:${index}`).join("/"))).size > 10);
assert.deepEqual(new Set(run("restricted-pool", true, ["方舟", "阿米巴"])), new Set(["方舟", "阿米巴"]));
console.log("ai_alien_seed.test.js ok");
