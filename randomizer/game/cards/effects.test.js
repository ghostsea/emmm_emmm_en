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
assert.equal(cardEffects.collectTemporaryTaskRewards(
  cardEffects.getTemporaryTasks({ cardId: "b_5.webp" }),
  { settlements: [] },
).length, 0);

for (const cardId of ["b_5.webp", "b_6.webp"]) {
  const model = cardEffects.getCardModel({ cardId });
  assert.equal(model.cardType, 0);
  assert.equal(model.tasks, undefined);
  assert.equal(model.triggers, undefined);
  assert.equal(cardEffects.buildPlayEffects({ cardId }).length, 2);
  assert.equal(cardEffects.getTemporaryTasks({ cardId }).length, 1);
}

const b6Rewards = cardEffects.collectTemporaryTaskRewards(
  cardEffects.getTemporaryTasks({ cardId: "b_6.webp" }),
  { settlements: [{ sectorId: "sector-2-b" }] },
);
assert.equal(b6Rewards.length, 1);
assert.equal(b6Rewards[0].type, "draw_cards");

const b7Effects = cardEffects.buildPlayEffects({ cardId: "b_7.webp" });
assert.equal(cardEffects.getCardModel({ cardId: "b_7.webp" }).cardType, 0);
assert.equal(b7Effects.length, 3);
assert.equal(b7Effects.every((effect) => effect.type === cardEffects.EFFECT_TYPES.DRAW_THEN_SCAN), true);
assert.equal(cardEffects.getTemporaryTasks({ cardId: "b_7.webp" }).length, 0);

const b9Effects = cardEffects.buildPlayEffects({ cardId: "b_9.webp" });
assert.equal(cardEffects.getCardModel({ cardId: "b_9.webp" }).cardType, 0);
assert.equal(b9Effects[0].type, cardEffects.EFFECT_TYPES.SCAN_ACTION);
assert.equal(b9Effects[0].options.skipCost, true);
assert.equal(b9Effects[1].type, cardEffects.EFFECT_TYPES.ANY_SECTOR_SCAN);

assert.equal(cardEffects.getCardReference("b_11.webp").referenceId, "123");
assert.equal(cardEffects.getCardReference("b_15.webp").referenceId, "43");
assert.equal(cardEffects.getCardReference("b_70.webp").referenceId, "109");

for (let index = 1; index <= 70; index += 1) {
  const cardId = `b_${index}.webp`;
  const reference = cardEffects.getCardReference(cardId);
  const model = cardEffects.getCardModel(cardId);
  const deferred = cardEffects.getDeferredCardModel(cardId);
  assert.ok(reference, `${cardId} should have an ender_seti reference mapping`);
  assert.notEqual(Boolean(model), Boolean(deferred), `${cardId} should be implemented/partial or deferred`);
  if (model) {
    assert.equal(model.source.referenceId, reference.referenceId);
  } else {
    assert.equal(deferred.source.referenceId, reference.referenceId);
    assert.ok(deferred.reason);
    assert.ok(deferred.missingAbilities.length > 0);
  }
}

assert.equal(cardEffects.getCardMigrationStatus("b_11.webp"), "implemented");
assert.equal(cardEffects.getCardMigrationStatus("b_30.webp"), "implemented");
assert.equal(cardEffects.getCardModel("b_30.webp").endGameScoring.kind, "traceCount");
assert.equal(cardEffects.getCardMigrationStatus("b_31.webp"), "implemented");
assert.equal(cardEffects.getRuntimeCardTypeCode({ cardId: "b_31.webp", cardTypeCode: 2 }, 2), 0);

const b11Effects = cardEffects.buildPlayEffects({ cardId: "b_11.webp" });
assert.equal(b11Effects.length, 1);
assert.equal(b11Effects[0].type, cardEffects.EFFECT_TYPES.CARD_MOVE);
assert.equal(b11Effects[0].options.afterEventRewards[0].eventType, "visitAsteroid");

const b12 = { id: "card-b12", cardId: "b_12.webp" };
const blueTracePlayer = { id: "p1", color: "red", reservedCards: [b12] };
cardEffects.ensureCardEffectState(b12);
assert.equal(cardEffects.collectReadyTasks(blueTracePlayer, {
  nebulaDataState: {},
  alienGameState: {
    aliens: {
      1: { traces: { blue: { firstPlaced: true, ownerPlayerColor: "red", extraCount: 1 } } },
      2: { traces: { blue: { firstPlaced: true, ownerPlayerColor: "red", extraCount: 0 } } },
    },
  },
  planetStatsState: {},
}).length, 1);

const b15 = { id: "card-b15", cardId: "b_15.webp" };
const blackSectorPlayer = { id: "p1", color: "red", reservedCards: [b15] };
cardEffects.ensureCardEffectState(b15);
assert.equal(cardEffects.buildPlayEffects(b15)[0].options.nebulaId, "sector-4-b");
assert.equal(cardEffects.collectReadyTasks(blackSectorPlayer, {
  nebulaDataState: {
    sectorSettlements: {
      winsByPlayerId: {
        p1: [{ sectorId: "sector-1-b" }],
      },
    },
  },
  alienGameState: {},
}).length, 1);

for (const cardId of ["b_16.webp", "b_17.webp"]) {
  const effects = cardEffects.buildPlayEffects({ cardId });
  assert.equal(effects[0].type, cardEffects.EFFECT_TYPES.CARD_MOVE);
  assert.equal(effects[1].type, cardEffects.EFFECT_TYPES.SCAN_COLOR_CHOICE);
}

const b18 = { id: "card-b18", cardId: "b_18.webp" };
const purpleTechPlayer = {
  id: "p1",
  color: "red",
  techState: { ownedTiles: { purple1: true, purple2: true, purple3: true }, blueBoardSlots: {} },
  reservedCards: [b18],
};
cardEffects.ensureCardEffectState(b18);
assert.equal(cardEffects.collectReadyTasks(purpleTechPlayer, {
  nebulaDataState: {},
  alienGameState: {},
  planetStatsState: {},
}).length, 1);

const b19Effects = cardEffects.buildPlayEffects({ cardId: "b_19.webp" });
assert.equal(b19Effects[0].type, cardEffects.EFFECT_TYPES.ANY_SECTOR_SCAN);

const b20 = { id: "card-b20", cardId: "b_20.webp" };
const launchTriggerPlayer = { id: "p1", color: "red", reservedCards: [b20] };
cardEffects.ensureCardEffectState(b20);
assert.equal(cardEffects.collectMatchingTriggers(launchTriggerPlayer, { type: "launch" }).length, 3);

const b21 = { id: "card-b21", cardId: "b_21.webp" };
const saturnPlayer = { id: "p1", color: "red", reservedCards: [b21] };
cardEffects.ensureCardEffectState(b21);
assert.equal(cardEffects.buildPlayEffects(b21)[0].type, "launch");
assert.equal(cardEffects.buildPlayEffects(b21)[1].type, "pick_card");
assert.equal(cardEffects.collectReadyTasks(saturnPlayer, {
  nebulaDataState: {},
  alienGameState: {},
  planetStatsState: {
    planets: {
      saturn: {
        orbitMarkers: [{ playerId: "p1", color: "red" }],
        landingMarkers: [],
        satelliteLandings: [],
      },
    },
  },
}).length, 1);

const b22 = { id: "card-b22", cardId: "b_22.webp" };
const signalPlayer = { id: "p1", color: "red", reservedCards: [b22] };
cardEffects.ensureCardEffectState(b22);
assert.equal(cardEffects.getCardMigrationStatus("b_22.webp"), "partial");
assert.equal(cardEffects.collectReadyTasks(signalPlayer, {
  nebulaDataState: {
    nebulae: {
      "sector-1-a": { tokens: [{ replacedByPlayerId: "p1" }] },
      "sector-2-a": { tokens: [{ replacedByPlayerId: "p1" }] },
      "sector-3-a": { tokens: [{ replacedByPlayerColor: "red" }] },
      "sector-4-a": { tokens: [{ playerColor: "red" }] },
    },
  },
  alienGameState: {},
  planetStatsState: {},
}).length, 1);

const b23Effects = cardEffects.buildPlayEffects({ cardId: "b_23.webp" });
assert.equal(b23Effects.length, 3);
assert.equal(b23Effects.every((effect) => effect.type === cardEffects.EFFECT_TYPES.DRAW_THEN_DISCARD_ACTION), true);

const b24Effects = cardEffects.buildPlayEffects({ cardId: "b_24.webp" });
assert.equal(b24Effects.length, 2);
assert.equal(b24Effects.every((effect) => effect.type === cardEffects.EFFECT_TYPES.CARD_MOVE), true);
assert.equal(b24Effects[0].options.afterEventRewards[0].onceKey, "b24-comet-score");

const b25 = { id: "card-b25", cardId: "b_25.webp" };
const signalTriggerPlayer = { id: "p1", color: "red", reservedCards: [b25] };
cardEffects.ensureCardEffectState(b25);
assert.equal(cardEffects.collectMatchingTriggers(signalTriggerPlayer, {
  type: "signalMarked",
  nebulaId: "sector-4-a",
}).length, 1);
assert.equal(cardEffects.collectMatchingTriggers(signalTriggerPlayer, {
  type: "signalMarked",
  nebulaId: "sector-1-b",
}).length, 0);

const b31Effects = cardEffects.buildPlayEffects({ cardId: "b_31.webp" });
assert.equal(b31Effects.length, 2);
assert.equal(b31Effects[0].type, "pick_card");
assert.equal(b31Effects[1].type, cardEffects.EFFECT_TYPES.RESEARCH_TECH);
assert.deepEqual(b31Effects[1].options.techTypes, ["purple"]);

const b38Effects = cardEffects.buildPlayEffects({ cardId: "b_38.webp" });
assert.equal(b38Effects.length, 3);
assert.equal(b38Effects[0].type, cardEffects.EFFECT_TYPES.PUBLIC_SCAN);
assert.equal(b38Effects[2].options.techTypes[0], "purple");

assert.equal(cardEffects.buildPlayEffects({ cardId: "b_43.webp" })[0].type, "gain_data");
assert.equal(cardEffects.buildPlayEffects({ cardId: "b_69.webp" })[0].type, "launch");

console.log("card effects tests passed");
