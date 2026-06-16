const assert = require("node:assert/strict");
const cardEffects = require("./effects");

const b1 = { id: "card-b1", cardId: "b_1.webp" };
assert.equal(cardEffects.getCardModel(b1).cardType, 2);
assert.equal(cardEffects.buildPlayEffects(b1).length, 2);
assert.equal(cardEffects.buildPlayEffects(b1)[0].type, cardEffects.EFFECT_TYPES.SCAN_NEBULA);

const b2 = { id: "card-b2", cardId: "b_2.webp" };
const player = {
  id: "p1",
  color: "red",
  reservedCards: [b2],
};
cardEffects.ensureCardEffectState(b2);
const planetMatches = cardEffects.collectMatchingTriggers(player, {
  type: "visitPlanet",
  planetId: "mars",
});
assert.equal(planetMatches.length, 3);
assert.equal(cardEffects.collectMatchingTriggers(player, {
  type: "visitPlanet",
  planetId: "earth",
}).length, 0);
cardEffects.consumeTrigger(b2, planetMatches[0].trigger.id);
assert.equal(cardEffects.collectMatchingTriggers(player, {
  type: "visitPlanet",
  planetId: "mars",
}).length, 2);

const b10 = { id: "card-b10", cardId: "b_10.webp" };
const asteroidPlayer = { id: "p1", color: "red", reservedCards: [b10] };
cardEffects.ensureCardEffectState(b10);
assert.equal(cardEffects.collectMatchingTriggers(asteroidPlayer, { type: "visitAsteroid" }).length, 3);

const taskPlayer = {
  id: "p1",
  color: "red",
  reservedCards: [b1],
};
cardEffects.ensureCardEffectState(b1);
const ready = cardEffects.collectReadyTasks(taskPlayer, {
  nebulaDataState: {
    sectorSettlements: {
      winsByPlayerId: {
        p1: [{ sectorId: "sector-4-a" }, { sectorId: "sector-3-a" }],
      },
    },
  },
  alienGameState: {},
});
assert.equal(ready.length, 1);
assert.equal(ready[0].effects[0].type, "gain_resources");

const b4 = { id: "card-b4", cardId: "b_4.webp" };
const alienReadyPlayer = { id: "p1", color: "red", reservedCards: [b4] };
cardEffects.ensureCardEffectState(b4);
assert.equal(cardEffects.collectReadyTasks(alienReadyPlayer, {
  nebulaDataState: {},
  alienGameState: {
    aliens: {
      1: { traces: { blue: { firstPlaced: true } } },
      2: { traces: { blue: { firstPlaced: true } } },
    },
  },
}).length, 1);

assert.equal(cardEffects.collectTemporaryTaskRewards(
  cardEffects.getTemporaryTasks({ cardId: "b_5.webp" }),
  { settlements: [{ sectorId: "sector-4-a" }] },
).length, 1);

console.log("card effects tests passed");
