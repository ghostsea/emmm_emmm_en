/* eslint-disable no-console */
"use strict";

const assert = require("node:assert/strict");
const placement = require("./placement");
const alienState = require("./state");
const fangzhou = require("./fangzhou");

function createDebugState() {
  return {
    aliens: {
      2: {
        revealed: true,
        assignedAlienId: fangzhou.ALIEN_ID,
        alienId: fangzhou.ALIEN_ID,
        traces: {
          pink: { firstPlaced: true, ownerPlayerColor: "white", extraCount: 0 },
          yellow: { firstPlaced: false, ownerPlayerColor: null, extraCount: 0 },
          blue: { firstPlaced: false, ownerPlayerColor: null, extraCount: 0 },
        },
      },
    },
    fangzhou: fangzhou.createFangzhouState(),
  };
}

const white = { id: "white", color: "white", colorLabel: "白色" };

assert.equal(fangzhou.TRACE_POSITION_COUNT, 4);
assert(placement.FANGZHOU_TRACE_MARKER_SLOTS[2].pink[1]);
assert.equal(placement.getFangzhouTraceMarkerLayout(2, "pink", 1).percentY, 39.8);
assert.equal(placement.getFangzhouTraceMarkerLayout(2, "pink", 1).percentX, 20.69);
assert.equal(placement.getFangzhouTraceMarkerLayout(2, "yellow", 4).percentX, 50.44);
assert.equal(placement.getFangzhouTraceMarkerLayout(2, "blue", 3).percentX, 79.51);

const card2CornerExpectations = {
  pink: {
    1: { scanActionCode: 1, incomeCode: 2 },
    2: { scanActionCode: 2, incomeCode: 1 },
    3: { scanActionCode: 0, incomeCode: 0 },
    4: { scanActionCode: 3, incomeCode: 1 },
  },
  yellow: {
    1: { scanActionCode: 0, incomeCode: 2 },
    2: { scanActionCode: 1, incomeCode: 1 },
    3: { scanActionCode: 2, incomeCode: 0 },
    4: { scanActionCode: 3, incomeCode: 0 },
  },
  blue: {
    1: { scanActionCode: 2, incomeCode: 2 },
    2: { scanActionCode: 0, incomeCode: 1 },
    3: { scanActionCode: 3, incomeCode: 2 },
    4: { scanActionCode: 1, incomeCode: 0 },
  },
};
for (const [traceType, variants] of Object.entries(card2CornerExpectations)) {
  for (const [variant, expected] of Object.entries(variants)) {
    const definition = fangzhou.createCard2Definition(traceType, Number(variant));
    assert.equal(definition.price, 2);
    assert.equal(definition.cardTypeCode, 0);
    assert.equal(definition.discardActionCode, fangzhou.CARD2_DISCARD_ACTION_CODE);
    assert.equal(definition.scanActionCode, expected.scanActionCode);
    assert.equal(definition.incomeCode, expected.incomeCode);
  }
}

const debugState = createDebugState();
debugState.fangzhou.revealedSlotId = 2;
debugState.fangzhou.revealInitialized = true;
const seeded = fangzhou.seedDebugTraceGrid(debugState, 2, white);
assert.equal(seeded.length, 12);
const grid = fangzhou.getTraceGrid(debugState, 2);
assert.equal(grid.pink[1].playerColor, "white");
assert.equal(grid.pink[2].playerColor, "white");

const lockedState = createDebugState();
lockedState.fangzhou.revealedSlotId = 2;
lockedState.fangzhou.revealInitialized = true;
fangzhou.dealPlayerCard2(lockedState, white, () => 0);
fangzhou.ensureTraceGrid(lockedState, 2);
const locked = fangzhou.canPlaceFangzhouTrace(lockedState, 2, "pink", 2, white);
assert.equal(locked.ok, false);

fangzhou.unlockCard2(lockedState, white, "pink");
const reserved = fangzhou.getPlayerCard2Reserved(lockedState, white);
assert.equal(reserved.find((card) => card.traceType === "pink"), undefined);
assert.equal(fangzhou.canUnlockCard2ForTrace(lockedState, white, "pink"), false);
assert.equal(fangzhou.canPlaceAnyFangzhouTrace(lockedState, 2, "pink", white), true);
const unlocked = fangzhou.canPlaceFangzhouTrace(lockedState, 2, "pink", 2, white);
assert.equal(unlocked.ok, true);

const unlockTraceReward = fangzhou.getCard2UnlockTraceReward();
assert.deepEqual(unlockTraceReward.gain, { score: 3 });
const unlockTraceState = createDebugState();
unlockTraceState.fangzhou.revealedSlotId = 2;
unlockTraceState.fangzhou.revealInitialized = true;
fangzhou.dealPlayerCard2(unlockTraceState, white, () => 0);
assert.equal(alienState.countTraceMarkersForPlayerOnSlot(unlockTraceState, 2, white, "pink"), 1);
const stateExtraTrace = alienState.addExtraTrace(unlockTraceState, 2, "pink", white.color);
assert.equal(stateExtraTrace.ok, true);
const unlockWithStateTrace = fangzhou.unlockCard2(unlockTraceState, white, "pink");
assert.equal(unlockWithStateTrace.ok, true);
assert.equal(unlockTraceState.aliens[2].traces.pink.extraCount, 1);
assert.equal(unlockTraceState.aliens[2].traces.pink.extraMarkers[0].ownerPlayerColor, "white");
assert.equal(alienState.countTraceMarkersForPlayerOnSlot(unlockTraceState, 2, white, "pink"), 2);
assert.equal(fangzhou.countStateTraceMarkers(unlockTraceState, white, "pink", 2), 2);
assert.equal(fangzhou.countTraceMarkers(unlockTraceState, white, 2), 2);

const singleState = createDebugState();
singleState.fangzhou.revealedSlotId = 2;
singleState.fangzhou.revealInitialized = true;
fangzhou.placeFangzhouTrace(singleState, 2, "pink", 1, white);
const duplicate = fangzhou.placeFangzhouTrace(singleState, 2, "pink", 1, white);
assert.equal(duplicate.ok, false);
assert.equal(fangzhou.getTraceGrid(singleState, 2).pink[1].playerColor, "white");

const initState = {
  aliens: {
    2: {
      revealed: true,
      alienId: fangzhou.ALIEN_ID,
      traces: {
        pink: { firstPlaced: true, ownerPlayerColor: "white", extraCount: 0 },
        yellow: { firstPlaced: true, ownerPlayerColor: "white", extraCount: 0 },
        blue: { firstPlaced: true, ownerPlayerColor: "white", extraCount: 0 },
      },
    },
  },
  fangzhou: fangzhou.createFangzhouState(),
};
const init = fangzhou.initializeFangzhouReveal(initState, 2, white, [white], () => 0);
assert.equal(init.ok, true);
assert.equal(initState.fangzhou.pendingRevealBasicRewards.length, 3);
assert.equal(initState.fangzhou.playerCard2ById.white.cards.pink.variant, 1);

const flipWrapper = { fangzhou: fangzhou.createFangzhouState() };
for (let index = 0; index < 5; index += 1) {
  const flip = fangzhou.flipCard1Reward(flipWrapper, "basic", () => 0);
  assert.equal(flip.ok, true);
  assert.equal(flip.reshuffled, false);
}
assert.equal(flipWrapper.fangzhou.card1RevealedSinceShuffle, 5);
assert.equal(flipWrapper.fangzhou.card1Revealed.length, 5);
assert.equal(flipWrapper.fangzhou.card1Deck.length, 4);

const sixth = fangzhou.flipCard1Reward(flipWrapper, "basic", () => 0);
assert.equal(sixth.ok, true);
assert.equal(sixth.reshuffled, true);
assert.equal(flipWrapper.fangzhou.card1RevealedSinceShuffle, 1);
assert.equal(flipWrapper.fangzhou.card1Revealed.length, 1);
assert.equal(flipWrapper.fangzhou.card1Deck.length, 8);

console.log("fangzhou.test.js: all tests passed");
