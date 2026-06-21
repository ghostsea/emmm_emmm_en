const assert = require("node:assert/strict");

globalThis.SetiAlienPlacement = require("./placement");
const aomomo = require("./aomomo");

function createState() {
  return {
    aliens: {
      1: {
        revealed: true,
        alienId: aomomo.ALIEN_ID,
        assignedAlienId: aomomo.ALIEN_ID,
        traces: {},
      },
    },
    aomomo: aomomo.createAomomoState(),
  };
}

const white = {
  id: "player-white",
  color: "white",
  colorLabel: "白色",
  resources: { score: 0, aomomoFossils: 2, availableData: 0 },
};

const state = createState();
const reveal = aomomo.initializeAomomoReveal(state, 1, white, () => 0);
assert.equal(reveal.ok, true);
assert.equal(state.aomomo.revealedSlotId, 1);
assert.equal(aomomo.CARD_DEFINITIONS.some((card) => card.index === state.aomomo.displayedCardIndex), true);
assert.equal(state.aomomo.cardDeck.includes(state.aomomo.displayedCardIndex), false);

const paidTrace = aomomo.placeAomomoTrace(state, 1, "pink", 1, white);
assert.equal(paidTrace.ok, true);
assert.equal(paidTrace.reward.payFossils, 1);
assert.equal(aomomo.getTraceEntries(aomomo.getTraceGrid(state, 1), "pink", 1).length, 1);

const panelState = createState();
aomomo.initializeAomomoReveal(panelState, 1, white, () => 0);
const orbit = aomomo.addOrbitMarker(panelState, white);
assert.equal(orbit.ok, true);
assert.equal(aomomo.countOrbitMarkers(panelState), 1);
assert.equal(aomomo.canAddOrbitMarker(panelState), false);
for (let index = 0; index < 3; index += 1) {
  const landing = aomomo.addLandingMarker(panelState, white);
  assert.equal(landing.ok, true);
}
assert.equal(aomomo.countLandingMarkers(panelState), 3);
assert.equal(aomomo.canAddLandingMarker(panelState), false);

assert.equal(aomomo.createAlienCard(8, 1).cardTypeCode, 3);
assert.equal(aomomo.buildImmediateEffects(0)[0].type, aomomo.EFFECT_SCAN_AOMOMO_X_GAIN_FOSSIL);
assert.equal(aomomo.buildImmediateEffects(1)[0].type, aomomo.EFFECT_GAIN_FOSSILS);
assert.equal(aomomo.buildImmediateEffects(5).length, 0);
assert.equal(aomomo.buildImmediateEffects(8).at(-1).type, aomomo.EFFECT_FOSSIL_FOR_ANY_SCAN);

console.log("aomomo.test.js: all tests passed");
