/* eslint-disable no-console */
"use strict";

const assert = require("node:assert/strict");
const chong = require("./chong");

function createState() {
  return {
    aliens: {
      2: {
        revealed: true,
        assignedAlienId: chong.ALIEN_ID,
        alienId: chong.ALIEN_ID,
        traces: {
          pink: { firstPlaced: false, ownerPlayerColor: null, extraCount: 0 },
          yellow: { firstPlaced: false, ownerPlayerColor: null, extraCount: 0 },
          blue: { firstPlaced: false, ownerPlayerColor: null, extraCount: 0 },
        },
      },
    },
    chong: chong.createChongState(),
  };
}

const white = { id: "player-white", color: "white", colorLabel: "白色" };
const state = createState();
const init = chong.initializeChongReveal(state, 2, white, () => 0);

assert.equal(init.ok, true);
assert.equal(state.chong.revealedSlotId, 2);
assert.equal(state.chong.planetFossilIds.jupiter.length, 3);
assert.equal(state.chong.planetFossilIds.saturn.length, 3);
assert.equal(Object.keys(state.chong.fossilsById).length, 7);
assert.equal(Object.keys(state.chong.panelFossilSlots).length, 1);
assert.deepEqual(state.chong.unlockedBluePositions, [7, 8, 9]);

assert.equal(chong.canPlaceChongTrace(state, 2, "blue", 1, white).ok, false);
assert.equal(chong.canPlaceChongTrace(state, 2, "blue", 1, white, { debugOnly: true }).ok, false);
assert.equal(chong.canPlaceChongTrace(state, 2, "blue", 7, white).ok, true);

const placedPink = chong.placeChongTrace(state, 2, "pink", 3, white);
assert.equal(placedPink.ok, true);
assert.equal(placedPink.reward.gain.score, 3);
assert.equal(placedPink.reward.pickAlienCard, true);
assert.equal(chong.countTraceMarkers(state, white, "pink"), 1);

const debugState = createState();
chong.initializeChongReveal(debugState, 2, white, () => 0);
const seeded = chong.seedDebugTraceGrid(debugState, 2, white);
assert.equal(seeded.length, 11);
assert.equal(chong.countTraceMarkers(debugState, white, null), 11);
assert.equal(Object.keys(debugState.chong.panelFossilSlots).length, 1);
assert.equal(debugState.chong.unlockedBluePositions.includes(1), false);

const stateTraceTaskState = createState();
stateTraceTaskState.aliens[2].traces.blue = { firstPlaced: true, ownerPlayerColor: "white", extraCount: 1 };
chong.initializeChongReveal(stateTraceTaskState, 2, white, () => 0);
assert.equal(chong.countTraceMarkers(stateTraceTaskState, white, "blue"), 2);
assert.equal(chong.isTraceTaskReady(stateTraceTaskState, white, chong.getCardTask(1)), true);

const transportState = createState();
chong.initializeChongReveal(transportState, 2, white, () => 0);
const fossil = chong.getAvailablePlanetFossils(transportState, "jupiter")[0];
const task = chong.getCardTask(0);
const pickup = chong.pickUpFossil(transportState, fossil.fossilId, white, task, {
  cardId: "card-0",
  cardLabel: "繁殖样本",
});
assert.equal(pickup.ok, true);
assert.equal(pickup.fossil.destinationPlanetId, "earth");
assert.equal(chong.attachTransportRocket(transportState, fossil.fossilId, 42).ok, true);
const activeTransport = chong.getActiveTransportForCard(transportState, "card-0");
assert.equal(activeTransport.rocketId, 42);
assert.equal(activeTransport.fossil.status, "transported");
assert.equal(activeTransport.delivered, false);
assert.equal(chong.getActiveTransportForCard(transportState, "card-other"), null);
assert.equal(
  chong.listTransportArrivalEvents(
    transportState,
    [{ id: 42, kind: "chong-fossil", playerId: white.id, color: white.color, sectorX: 4, sectorY: 2 }],
    () => ({ x: 4, y: 1 }),
    { chongFossilKind: "chong-fossil" },
  ).length,
  0,
);
const arrivalEvents = chong.listTransportArrivalEvents(
  transportState,
  [
    { id: 42, kind: "chong-fossil", playerId: white.id, color: white.color, sectorX: 4, sectorY: 1 },
    { id: 43, kind: "chong-fossil", playerId: white.id, color: white.color, sectorX: 4, sectorY: 1 },
  ],
  (planetId) => (planetId === "earth" ? { x: 4, y: 1 } : null),
  { chongFossilKind: "chong-fossil" },
);
assert.equal(arrivalEvents.length, 1);
assert.deepEqual(
  {
    type: arrivalEvents[0].type,
    planetId: arrivalEvents[0].planetId,
    rocketId: arrivalEvents[0].rocketId,
    tokenKind: arrivalEvents[0].tokenKind,
    fossilId: arrivalEvents[0].fossilId,
    synthetic: arrivalEvents[0].synthetic,
  },
  {
    type: "visitPlanet",
    planetId: "earth",
    rocketId: 42,
    tokenKind: "chong-fossil",
    fossilId: fossil.fossilId,
    synthetic: true,
  },
);
const playerTransports = chong.listActiveTransports(transportState, white);
assert.equal(playerTransports.length, 1);
assert.equal(playerTransports[0].fossil.fossilId, fossil.fossilId);
const visited = chong.markTransportedFossilDelivered(transportState, 42, "earth");
assert.equal(visited.ok, true);
assert.equal(visited.fossil.status, "transported");
assert.equal(chong.getActiveTransportForCard(transportState, "card-0").delivered, false);
assert.equal(transportState.chong.panelFossilSlots[1], undefined);
const readyTransport = chong.getDeliveredTransportForCard(transportState, "card-0");
assert.equal(readyTransport, null);
const completed = chong.completeTransportedFossil(transportState, 42, {
  cardId: "card-other",
  destinationPlanetId: "mars",
  task: chong.getCardTask(5),
});
assert.equal(completed.ok, true);
assert.equal(chong.getActiveTransportForCard(transportState, "card-0"), null);
assert.equal(completed.bluePosition, 1);
assert.equal(completed.task.destinationPlanetId, "mars");
assert.equal(transportState.chong.panelFossilSlots[1], fossil.fossilId);
assert.equal(transportState.chong.unlockedBluePositions.includes(1), true);
assert.equal(transportState.chong.completedTransports[0].cardId, "card-other");
assert.equal(transportState.chong.completedTransports[0].destinationPlanetId, "mars");
const completedFossilReward = chong.getFossilReward(fossil.fossilId);
const completedBlueReward = chong.getTraceReward(transportState, "blue", 1);
assert.equal(completedBlueReward.fossilId, fossil.fossilId);
assert.equal(completedBlueReward.fossilPanel, false);
assert.deepEqual(completedBlueReward.gain, completedFossilReward.gain || {});
assert.equal(completedBlueReward.dataCount, completedFossilReward.dataCount || 0);
assert.equal(completedBlueReward.drawCards, completedFossilReward.drawCards || 0);
assert.equal(completedBlueReward.pickCard, Boolean(completedFossilReward.pickCard));

assert.equal(chong.getFossilReward("fossil_01").gain.publicity, 3);
assert.equal(chong.getFossilReward("fossil_04").drawCards, 2);
assert.equal(chong.createAlienCard(2, 1).cardTypeCode, 3);
const chong0Effects = chong.buildImmediateEffects(0);
assert.equal(chong0Effects.length, 2);
assert.equal(chong0Effects[0].type, chong.EFFECT_TYPES.CHONG_LAND_FOR_PICKUP);
assert.equal(chong0Effects[0].icon, "land");
assert.equal(chong0Effects[1].type, chong.EFFECT_TYPES.CHONG_PICKUP_FOSSIL);
assert.equal(chong0Effects[1].icon, "chongFossilBack");
assert.equal(chong.buildImmediateEffects(2)[0].type, chong.EFFECT_TYPES.CHONG_PROBE_PLANET_FOSSIL_REWARD);
assert.equal(chong.buildImmediateEffects(2)[0].icon, "chongFossilOk");
assert.equal(chong.buildImmediateEffects(6)[0].type, chong.EFFECT_TYPES.CHONG_ORBIT_OR_LAND_FOR_PICKUP);
assert.equal(chong.buildImmediateEffects(6)[0].icon, "orbitOrLand");
for (const cardIndex of [0, 3, 5, 6, 8, 9]) {
  const task = chong.getCardTask(cardIndex);
  const effects = chong.buildImmediateEffects(cardIndex);
  assert.equal(task.kind, "transport", `chong ${cardIndex} should be a transport task`);
  assert.equal(effects.some((effect) => effect.type === chong.EFFECT_TYPES.CHONG_PICKUP_FOSSIL), true, `chong ${cardIndex} should pick up a fossil`);
}
for (const cardIndex of [8, 9]) {
  const [travelEffect] = chong.buildImmediateEffects(cardIndex);
  assert.equal(travelEffect.type, chong.EFFECT_TYPES.CHONG_LAND_FOR_PICKUP);
  assert.equal(travelEffect.options.allowSatellite, true, `chong ${cardIndex} should allow satellite landing`);
}
for (const cardIndex of [0, 3, 5]) {
  const travelEffect = chong.buildImmediateEffects(cardIndex).find((effect) => (
    effect.type === chong.EFFECT_TYPES.CHONG_LAND_FOR_PICKUP
  ));
  assert.ok(travelEffect, `chong ${cardIndex} should land before pickup`);
  assert.equal(Boolean(travelEffect.options.allowSatellite), false, `chong ${cardIndex} should not allow satellite landing`);
}

console.log("chong.test.js: all tests passed");
