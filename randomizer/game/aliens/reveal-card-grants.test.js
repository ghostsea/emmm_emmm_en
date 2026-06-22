"use strict";

const assert = require("node:assert/strict");
const state = require("./state");
const grants = require("./reveal-card-grants");
const yichangdian = require("./yichangdian");
const banrenma = require("./banrenma");
const chong = require("./chong");
const amiba = require("./amiba");
const aomomo = require("./aomomo");
const runezu = require("./runezu");

function createPlayers() {
  return [
    { id: "p-red", color: "red", colorLabel: "红色", hand: [], resources: { handSize: 0, score: 0 } },
    { id: "p-blue", color: "blue", colorLabel: "蓝色", hand: [], resources: { handSize: 0, score: 0 } },
    { id: "p-white", color: "white", colorLabel: "白色", hand: [], resources: { handSize: 0, score: 0 } },
  ];
}

function createReadyAlienState(alienId) {
  const alienState = state.createDefaultAlienState();
  state.placeFirstTrace(alienState, 1, "yellow", "red");
  state.placeFirstTrace(alienState, 1, "pink", "red");
  state.placeFirstTrace(alienState, 1, "blue", "blue");
  alienState.aliens[1].assignedAlienId = alienId;
  alienState.aliens[1].alienId = alienId;
  alienState.aliens[1].revealed = true;
  return alienState;
}

function initializeAlienModule(alienState, module, players) {
  const triggerPlayer = players[0];
  if (module === yichangdian) return module.initializeYichangdianReveal(alienState, 1, triggerPlayer, 4, () => 0);
  if (module === banrenma) return module.initializeBanrenmaReveal(alienState, 1, triggerPlayer, players, () => 0);
  if (module === chong) return module.initializeChongReveal(alienState, 1, triggerPlayer, () => 0);
  if (module === amiba) return module.initializeAmibaReveal(alienState, 1, triggerPlayer, () => 0);
  if (module === aomomo) return module.initializeAomomoReveal(alienState, 1, triggerPlayer, () => 0);
  if (module === runezu) return module.initializeRunezuReveal(alienState, 1, triggerPlayer, { random: () => 0 });
  return { ok: false, message: "unknown module" };
}

for (const module of [yichangdian, banrenma, chong, amiba, aomomo, runezu]) {
  const players = createPlayers();
  const alienState = createReadyAlienState(module.ALIEN_ID);
  const initResult = initializeAlienModule(alienState, module, players);
  assert.equal(initResult.ok, true, `${module.ALIEN_ID} should initialize`);

  const grantResult = grants.grantAlienCardsForFirstTraces(
    alienState,
    1,
    players,
    module,
    { label: module.ALIEN_ID, random: () => 0 },
  );

  assert.equal(grantResult.ok, true, `${module.ALIEN_ID} reveal grants should succeed`);
  assert.equal(grantResult.totalExpected, 3, `${module.ALIEN_ID} should grant one card per first trace`);
  assert.equal(grantResult.totalDrawn, 3, `${module.ALIEN_ID} should draw all reveal cards`);
  assert.equal(players[0].hand.length, 2, `${module.ALIEN_ID} red should receive two cards`);
  assert.equal(players[1].hand.length, 1, `${module.ALIEN_ID} blue should receive one card`);
  assert.equal(players[2].hand.length, 0, `${module.ALIEN_ID} white should receive no cards`);
  assert.equal(players[0].resources.handSize, 2, `${module.ALIEN_ID} red handSize should sync`);
  assert.equal(players[1].resources.handSize, 1, `${module.ALIEN_ID} blue handSize should sync`);
}

console.log("aliens/reveal-card-grants.test.js ok");
