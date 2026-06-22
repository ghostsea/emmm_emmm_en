const assert = require("node:assert/strict");
const cardEffects = require("./effects");
const aomomo = require("../aliens/aomomo");

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

for (let index = 1; index <= 140; index += 1) {
  const cardId = `b_${index}.webp`;
  const reference = cardEffects.getCardReference(cardId);
  const model = cardEffects.getCardModel(cardId);
  const deferred = cardEffects.getDeferredCardModel(cardId);
  assert.ok(reference, `${cardId} should have an ender_seti reference mapping`);
  assert.notEqual(Boolean(model), Boolean(deferred), `${cardId} should be implemented/partial or deferred`);
  assert.equal(cardEffects.getCardMigrationStatus(cardId), "implemented", `${cardId} should be implemented`);
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
assert.equal(cardEffects.getCardMigrationStatus("b_140.webp"), "implemented");
assert.equal(cardEffects.getCardReference("b_71.webp").sourceKind, "cards_71");
assert.equal(cardEffects.getCardModel("b_139.webp").displayRow, "bottom");
assert.equal(cardEffects.getCardModel("b_139.webp").countsAsType3, false);

for (let index = 1; index <= 42; index += 1) {
  const cardId = `dlc_${index}.png`;
  const reference = cardEffects.getCardReference(cardId);
  const model = cardEffects.getCardModel(cardId);
  assert.ok(reference, `${cardId} should have a DLC reference mapping`);
  assert.equal(reference.sourceKind, "dlc_cards", `${cardId} should use DLC source`);
  assert.equal(cardEffects.getCardMigrationStatus(cardId), "implemented", `${cardId} should be implemented`);
  assert.equal(cardEffects.getDeferredCardModel(cardId), null, `${cardId} should not be deferred`);
  assert.ok(model, `${cardId} should have a model`);
  assert.equal(model.source.referenceId, reference.referenceId);
}

const dlc1Effects = cardEffects.buildPlayEffects({ cardId: "dlc_1.png" });
assert.equal(dlc1Effects[0].type, cardEffects.EFFECT_TYPES.CARD_LAND);
assert.equal(dlc1Effects[0].options.rememberPreLandingOwnMarker, true);
assert.equal(dlc1Effects[1].type, cardEffects.EFFECT_TYPES.RETURN_PLAYED_CARD_TO_HAND_IF);
assert.equal(dlc1Effects[1].options.condition.type, "lastLandingHadOwnMarker");

assert.equal(cardEffects.buildPlayEffects({ cardId: "dlc_2.png" })[0].type, cardEffects.EFFECT_TYPES.CHOOSE_HAND_CORNER_REWARD);
assert.deepEqual(cardEffects.buildPlayEffects({ cardId: "dlc_3.png" })[0].options.gain, { additionalPublicScan: 3 });
assert.deepEqual(cardEffects.buildPlayEffects({ cardId: "dlc_4.png" })[0].options.gain, { additionalPublicScan: 1 });
assert.equal(cardEffects.buildPlayEffects({ cardId: "dlc_6.png" })[2].type, cardEffects.EFFECT_TYPES.LANDING_SECTOR_SCAN);
assert.deepEqual(cardEffects.buildPlayEffects({ cardId: "dlc_13.png" })[1].options.gain, { additionalPublicScan: 1 });
assert.equal(cardEffects.buildPlayEffects({ cardId: "dlc_15.png" })[0].options.afterResearchReward.kind, "repeatBonus");
assert.equal(cardEffects.buildPlayEffects({ cardId: "dlc_17.png" })[0].type, cardEffects.EFFECT_TYPES.PAY_CREDITS_FOR_REWARD);
assert.equal(cardEffects.buildPlayEffects({ cardId: "dlc_18.png" })[0].options.requireCondition.type, "resourceEquals");
assert.equal(cardEffects.buildPlayEffects({ cardId: "dlc_19.png" })[0].type, cardEffects.EFFECT_TYPES.REMOVE_ORBIT_TO_PROBE);
const dlc20RepeatCorner = cardEffects.buildPlayEffects({ cardId: "dlc_20.png" })
  .find((effect) => effect.type === cardEffects.EFFECT_TYPES.DISCARD_CARD_CORNER_REPEAT);
assert.equal(dlc20RepeatCorner.options.cornerRepeat, 3);
assert.equal(cardEffects.buildPlayEffects({ cardId: "dlc_22.png" })[0].options.condition.minCount, 3);
assert.equal(cardEffects.buildPlayEffects({ cardId: "dlc_22.png" })[0].options.repeat, 2);
assert.equal(cardEffects.buildPlayEffects({ cardId: "dlc_28.png" })[0].type, cardEffects.EFFECT_TYPES.DISCARD_ANY_FOR_INCOME);
assert.equal(cardEffects.buildPlayEffects({ cardId: "dlc_29.png" })[0].type, cardEffects.EFFECT_TYPES.RETURN_UNFINISHED_TASK_TO_HAND);
assert.equal(cardEffects.buildPlayEffects({ cardId: "dlc_30.png" })[0].type, cardEffects.EFFECT_TYPES.CARD_ORBIT);
assert.equal(cardEffects.buildPlayEffects({ cardId: "dlc_34.png" })[1].type, cardEffects.EFFECT_TYPES.TUCK_PLAYED_CARD_TO_INCOME);
assert.deepEqual(cardEffects.buildPlayEffects({ cardId: "dlc_35.png" })[0].options.gain, { additionalPublicScan: 1 });
assert.equal(cardEffects.buildPlayEffects({ cardId: "dlc_37.png" })[0].options.allMatching, true);
assert.equal(cardEffects.buildPlayEffects({ cardId: "dlc_38.png" })[2].type, cardEffects.EFFECT_TYPES.PROBE_STACK_REWARD);
assert.deepEqual(cardEffects.buildPlayEffects({ cardId: "dlc_41.png" })[0].options.gain, { additionalPublicScan: 1 });

const dlc12TurnBonus = cardEffects.buildPlayEffects({ cardId: "dlc_12.png" })[0];
assert.equal(dlc12TurnBonus.type, cardEffects.EFFECT_TYPES.REGISTER_EVENT_BONUS);
assert.equal(dlc12TurnBonus.options.bonus.duration, "turn");
assert.equal(dlc12TurnBonus.options.bonus.eventType, "visitPlanet");
assert.equal(dlc12TurnBonus.options.bonus.distinctBy, "planetId");
assert.equal(dlc12TurnBonus.options.bonus.minCount, 2);
const dlc12Move = cardEffects.buildPlayEffects({ cardId: "dlc_12.png" })[1];
assert.equal(dlc12Move.type, cardEffects.EFFECT_TYPES.CARD_MOVE);

assert.equal(cardEffects.getCardModel("dlc_8.png").endGameScoring.kind, "remainingResource");
assert.equal(cardEffects.getCardModel("dlc_10.png").endGameScoring.kind, "remainingResource");
assert.equal(cardEffects.getCardModel("dlc_31.png").endGameScoring.kind, "planetLandingPairs");
assert.equal(cardEffects.getCardModel("dlc_39.png").endGameScoring.kind, "allOrbitOrLand");

const b11Effects = cardEffects.buildPlayEffects({ cardId: "b_11.webp" });
assert.equal(b11Effects.length, 1);
assert.equal(b11Effects[0].type, cardEffects.EFFECT_TYPES.CARD_MOVE);
assert.equal(b11Effects[0].options.afterEventRewards[0].eventType, "visitAsteroid");

const b13Effects = cardEffects.buildPlayEffects({ cardId: "b_13.webp" });
assert.equal(b13Effects.length, 4);
assert.equal(b13Effects[0].type, cardEffects.EFFECT_TYPES.REMOVE_PLANET_MARKER);
assert.deepEqual(b13Effects[0].options.markerKinds, ["orbit", "land", "satelliteLand"]);

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
assert.equal(cardEffects.getCardMigrationStatus("b_22.webp"), "implemented");
assert.equal(cardEffects.getDeferredCardModel("b_22.webp"), null);
const b22Effects = cardEffects.buildPlayEffects(b22);
assert.equal(b22Effects.length, 2);
assert.equal(b22Effects.every((effect) => effect.type === cardEffects.EFFECT_TYPES.PROBE_SECTOR_SCAN), true);
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
assert.equal(b24Effects.length, 1);
assert.equal(b24Effects[0].type, cardEffects.EFFECT_TYPES.CARD_MOVE);
assert.equal(b24Effects[0].options.movementPoints, 2);
assert.equal(b24Effects[0].options.afterEventRewards[0].onceKey, "b24-comet-score");

const b72Effects = cardEffects.buildPlayEffects({ cardId: "b_72.webp" });
assert.equal(b72Effects.length, 2);
assert.equal(b72Effects[0].type, cardEffects.EFFECT_TYPES.PLANET_SECTOR_SCAN);
assert.equal(b72Effects[0].options.planetId, "mars");
assert.equal(b72Effects[0].options.repeat, 1);

const b83 = { id: "card-b83", cardId: "b_83.webp" };
cardEffects.ensureCardEffectState(b83);
assert.equal(cardEffects.collectReadyTasks({ id: "p1", color: "red", hand: [], reservedCards: [b83] }, {
  nebulaDataState: {},
  alienGameState: {},
  planetStatsState: {},
}).length, 1);

const b85 = { id: "card-b85", cardId: "b_85.webp" };
cardEffects.ensureCardEffectState(b85);
assert.equal(cardEffects.collectReadyTasks({ id: "p1", color: "red", reservedCards: [b85] }, {
  nebulaDataState: {},
  alienGameState: {},
  planetStatsState: {
    planets: {
      neptune: { orbitMarkers: [{ playerId: "p1" }], landingMarkers: [], satelliteLandings: [] },
      uranus: { orbitMarkers: [], landingMarkers: [{ playerId: "p1" }], satelliteLandings: [] },
    },
  },
}).length, 1);

const b88Effects = cardEffects.buildPlayEffects({ cardId: "b_88.webp" });
assert.equal(b88Effects[0].type, cardEffects.EFFECT_TYPES.PROBE_SECTOR_SCAN);
assert.equal(b88Effects[0].options.returnToHandIfSignalCount, 1);

const b95 = { id: "card-b95", cardId: "b_95.webp" };
cardEffects.ensureCardEffectState(b95);
assert.equal(cardEffects.collectReadyTasks({ id: "p1", color: "red", reservedCards: [b95] }, {
  nebulaDataState: {},
  alienGameState: {},
  planetStatsState: {
    planets: {
      mars: { orbitMarkers: [{ playerId: "p1" }], landingMarkers: [{ playerId: "p1" }], satelliteLandings: [] },
    },
  },
}).length, 1);

const b101 = { id: "card-b101", cardId: "b_101.webp" };
cardEffects.ensureCardEffectState(b101);
assert.equal(cardEffects.collectReadyTasks({ id: "p1", color: "red", reservedCards: [b101] }, {
  nebulaDataState: {},
  alienGameState: {},
  planetStatsState: {},
  probeLocationDetails: [{ playerId: "p1", locationType: "empty", distanceFromEarth: 5 }],
}).length, 1);

const b120 = { id: "card-b120", cardId: "b_120.webp" };
const strategyPlayer = { id: "p1", color: "red", reservedCards: [b120] };
cardEffects.ensureCardEffectState(b120);
assert.equal(cardEffects.collectMatchingTriggers(strategyPlayer, { type: "playCard", price: 2 }).length, 1);
assert.equal(cardEffects.collectMatchingTriggers(strategyPlayer, {
  type: "playCard",
  price: 2,
  sourceCardInstanceId: "card-b120",
}).length, 0);

const b123 = { id: "card-b123", cardId: "b_123.webp" };
cardEffects.ensureCardEffectState(b123);
assert.equal(cardEffects.collectMatchingTriggers({ id: "p1", color: "red", reservedCards: [b123] }, { type: "scanAction" })[0].effect.type, cardEffects.EFFECT_TYPES.SCAN_COLOR_CHOICE);

const b135 = { id: "card-b135", cardId: "b_135.webp" };
cardEffects.ensureCardEffectState(b135);
assert.equal(cardEffects.collectReadyTasks({ id: "p1", color: "red", reservedCards: [b135] }, {
  nebulaDataState: {
    sectorSettlements: {
      winsByPlayerId: {
        p1: [{ sectorId: "sector-2-a" }, { sectorId: "sector-1-a" }],
      },
    },
  },
  alienGameState: {},
  planetStatsState: {},
}).length, 1);

const b138 = { id: "card-b138", cardId: "b_138.webp" };
cardEffects.ensureCardEffectState(b138);
assert.equal(cardEffects.collectMatchingTriggers({ id: "p1", color: "red", reservedCards: [b138] }, { type: "orbit", planetId: "mars" }).length, 2);
assert.equal(cardEffects.collectMatchingTriggers({ id: "p1", color: "red", reservedCards: [b138] }, { type: "land", planetId: "venus" }).length, 2);

const mergedMoves = cardEffects.consolidateCardMoveEffects([
  cardEffects.buildPlayEffects({ cardId: "b_24.webp" })[0],
  cardEffects.buildPlayEffects({ cardId: "b_11.webp" })[0],
]);
assert.equal(mergedMoves.length, 1);
assert.equal(mergedMoves[0].options.movementPoints, 3);

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

for (let index = 26; index <= 70; index += 1) {
  const cardId = `b_${index}.webp`;
  assert.equal(cardEffects.getCardMigrationStatus(cardId), "implemented", `${cardId} should be implemented`);
  assert.equal(cardEffects.getDeferredCardModel(cardId), null, `${cardId} should not be deferred`);
  assert.ok(cardEffects.getCardModel(cardId), `${cardId} should have a model`);
}

const b26 = { id: "card-b26", cardId: "b_26.webp" };
const cornerPlayer = { id: "p1", color: "red", reservedCards: [b26] };
cardEffects.ensureCardEffectState(b26);
const b26CornerMatches = cardEffects.collectMatchingTriggers(cornerPlayer, {
  type: "cardCorner",
  cornerKind: "publicity",
  cornerCode: 0,
  resourceReward: { gain: { publicity: 1 } },
});
assert.equal(b26CornerMatches.length, 1);
assert.equal(b26CornerMatches[0].event.cornerKind, "publicity");
assert.equal(b26CornerMatches[0].effect.type, cardEffects.EFFECT_TYPES.CARD_CORNER_EVENT_REWARD);

for (const [cardId, traceType] of [["b_27.webp", "pink"], ["b_32.webp", "yellow"], ["b_35.webp", "blue"]]) {
  const effect = cardEffects.buildPlayEffects({ cardId })[0];
  assert.equal(effect.type, "alien_trace");
  assert.deepEqual(effect.options.allowedTraceTypes, [traceType]);
  assert.equal(effect.options.targetRule, "playerHasSameTrace");
}

const b28Effects = cardEffects.buildPlayEffects({ cardId: "b_28.webp" });
assert.equal(b28Effects[0].type, cardEffects.EFFECT_TYPES.REGISTER_EVENT_BONUS);
assert.equal(b28Effects[0].options.bonus.eventType, "signalMarked");
assert.equal(b28Effects[0].options.bonus.color, "yellow");
assert.equal(b28Effects[1].type, cardEffects.EFFECT_TYPES.SCAN_ACTION);

assert.equal(cardEffects.buildPlayEffects({ cardId: "b_29.webp" })[0].options.allowDuplicateLanding, true);
assert.equal(cardEffects.buildPlayEffects({ cardId: "b_34.webp" })[0].options.allowSatelliteWithoutTech, true);
assert.deepEqual(cardEffects.buildPlayEffects({ cardId: "b_36.webp" })[0].options.afterTraceReward, {
  kind: "traceCountScore",
  scorePer: 1,
});
assert.equal(cardEffects.buildPlayEffects({ cardId: "b_37.webp" })[0].options.ignoreRocketLimit, true);
assert.deepEqual(cardEffects.buildPlayEffects({ cardId: "b_40.webp" })[0].options.afterResearchReward, {
  kind: "techTypeCountScore",
  scorePer: 2,
});
assert.equal(cardEffects.buildPlayEffects({ cardId: "b_41.webp" })[0].type, cardEffects.EFFECT_TYPES.COUNT_HAND_INCOME_RESOURCE);
assert.equal(cardEffects.buildPlayEffects({ cardId: "b_42.webp" })[1].type, cardEffects.EFFECT_TYPES.TUCK_PLAYED_CARD_TO_INCOME);
assert.equal(cardEffects.buildPlayEffects({ cardId: "b_47.webp" })[0].options.per, 3);
assert.equal(cardEffects.buildPlayEffects({ cardId: "b_48.webp" })[0].type, cardEffects.EFFECT_TYPES.PICK_CARD_CORNER_REWARD);
assert.equal(cardEffects.buildPlayEffects({ cardId: "b_50.webp" })[0].options.owner, "any");
assert.equal(cardEffects.buildPlayEffects({ cardId: "b_50.webp" })[0].options.maxTargets, 3);
assert.equal(cardEffects.buildPlayEffects({ cardId: "b_55.webp" })[0].options.researchedByOthersOnly, true);
assert.equal(cardEffects.buildPlayEffects({ cardId: "b_55.webp" })[0].options.skipRotate, true);
assert.equal(cardEffects.buildPlayEffects({ cardId: "b_55.webp" })[0].options.skipBonus, true);
assert.equal(cardEffects.buildPlayEffects({ cardId: "b_58.webp" })[1].options.includeAdjacent, true);
assert.equal(cardEffects.buildPlayEffects({ cardId: "b_61.webp" })[0].type, cardEffects.EFFECT_TYPES.PLANET_SECTOR_SCAN);
assert.equal(cardEffects.buildPlayEffects({ cardId: "b_62.webp" })[0].options.afterEventRewards[0].planetIds[0], "jupiter");
assert.equal(cardEffects.buildPlayEffects({ cardId: "b_64.webp" }).filter((effect) => (
  effect.type === cardEffects.EFFECT_TYPES.PROBE_SECTOR_SCAN
)).length, 2);
assert.equal(cardEffects.buildPlayEffects({ cardId: "b_66.webp" })[0].options.bonus.distinctBy, "planetId");

const b39 = { id: "card-b39", cardId: "b_39.webp" };
const blueTriggerPlayer = { id: "p1", color: "red", reservedCards: [b39] };
cardEffects.ensureCardEffectState(b39);
assert.equal(cardEffects.collectMatchingTriggers(blueTriggerPlayer, { type: "alienTrace", traceType: "blue" }).length, 2);
assert.equal(cardEffects.collectMatchingTriggers(blueTriggerPlayer, { type: "alienTrace", traceType: "pink" }).length, 0);

const b44 = { id: "card-b44", cardId: "b_44.webp" };
const planetTriggerPlayer = { id: "p1", color: "red", reservedCards: [b44] };
cardEffects.ensureCardEffectState(b44);
assert.deepEqual(
  cardEffects.collectMatchingTriggers(planetTriggerPlayer, { type: "visitPlanet", planetId: "venus" })
    .map((match) => match.trigger.id),
  ["b44-venus-publicity"],
);
assert.deepEqual(
  cardEffects.collectMatchingTriggers(planetTriggerPlayer, { type: "visitPlanet", planetId: "jupiter" })
    .map((match) => match.trigger.id),
  ["b44-jupiter-data"],
);

const b57 = { id: "card-b57", cardId: "b_57.webp" };
const launchChainPlayer = { id: "p1", color: "red", reservedCards: [b57] };
cardEffects.ensureCardEffectState(b57);
assert.equal(cardEffects.collectMatchingTriggers(launchChainPlayer, { type: "launch" }).length, 3);

const b59 = { id: "card-b59", cardId: "b_59.webp" };
const orbitLandPlayer = { id: "p1", color: "red", reservedCards: [b59] };
cardEffects.ensureCardEffectState(b59);
assert.deepEqual(
  cardEffects.collectMatchingTriggers(orbitLandPlayer, { type: "orbit", planetId: "mars" })
    .map((match) => match.trigger.id),
  ["b59-orbit-publicity"],
);
assert.deepEqual(
  cardEffects.collectMatchingTriggers(orbitLandPlayer, { type: "land", planetId: "mars" })
    .map((match) => match.trigger.id),
  ["b59-land-publicity"],
);

function collectReadyTaskIds(player, context) {
  return cardEffects.collectReadyTasks(player, {
    nebulaDataState: {},
    alienGameState: {},
    planetStatsState: {},
    ...context,
  }).map((readyTask) => readyTask.task.id);
}

const dlc21 = { id: "card-dlc21", cardId: "dlc_21.png" };
cardEffects.ensureCardEffectState(dlc21);
assert.equal(cardEffects.collectMatchingTriggers(
  { id: "p1", color: "red", reservedCards: [dlc21] },
  { type: "visitPlanet", planetId: "mars", hasOwnOrbit: true },
).length, 2);
assert.equal(cardEffects.collectMatchingTriggers(
  { id: "p1", color: "red", reservedCards: [dlc21] },
  { type: "visitPlanet", planetId: "mars", hasOwnOrbit: false },
).length, 0);

for (const [cardId, techType, expectedType] of [
  ["dlc_24.png", "orange", "launch"],
  ["dlc_25.png", "purple", "gain_resources"],
  ["dlc_26.png", "blue", "gain_data"],
]) {
  const card = { id: `card-${cardId}`, cardId };
  cardEffects.ensureCardEffectState(card);
  const matches = cardEffects.collectMatchingTriggers(
    { id: "p1", color: "red", reservedCards: [card] },
    { type: "researchTech", techType },
  );
  assert.equal(matches.length, 2, `${cardId} should use both trigger markers on one research event`);
  assert.equal(matches[0].effect.type, expectedType);
  if (cardId === "dlc_25.png") {
    assert.deepEqual(matches[0].effect.options.gain, { additionalPublicScan: 1 });
  }
}

const dlc33 = { id: "card-dlc33", cardId: "dlc_33.png" };
cardEffects.ensureCardEffectState(dlc33);
assert.equal(cardEffects.collectMatchingTriggers(
  { id: "p1", color: "red", reservedCards: [dlc33] },
  { type: "pass" },
)[0].effect.type, "launch");

assert.deepEqual(collectReadyTaskIds(
  { id: "p1", color: "red", reservedCards: [{ id: "card-dlc7", cardId: "dlc_7.png" }] },
  {
    probeLocationDetails: [
      { playerId: "p1", locationType: "planet", planetId: "mars" },
      { playerId: "p1", locationType: "planet", planetId: "venus" },
    ],
  },
), ["dlc7-two-planet-probes"]);

assert.deepEqual(collectReadyTaskIds(
  { id: "p1", color: "red", reservedCards: [{ id: "card-dlc9", cardId: "dlc_9.png" }] },
  {
    nebulaDataState: {
      sectorSettlements: {
        winsByPlayerId: {
          p1: [{ sectorId: "sector-1-a" }, { sectorId: "sector-2-a" }, { sectorId: "sector-3-a" }],
        },
      },
    },
  },
), ["dlc9-three-sector-wins"]);

assert.deepEqual(collectReadyTaskIds(
  { id: "p1", color: "red", resources: { publicity: 0 }, reservedCards: [{ id: "card-dlc16", cardId: "dlc_16.png" }] },
  {},
), ["dlc16-zero-publicity"]);

assert.deepEqual(collectReadyTaskIds(
  { id: "p1", color: "red", resources: { credits: 0, energy: 0 }, hand: [], reservedCards: [{ id: "card-dlc28", cardId: "dlc_28.png" }] },
  {},
), ["dlc28-empty-resources-hand"]);

assert.deepEqual(collectReadyTaskIds(
  { id: "p1", color: "red", reservedCards: [{ id: "card-dlc35", cardId: "dlc_35.png" }] },
  { dataTotals: { p1: 12, red: 12 } },
), ["dlc35-data-total"]);

assert.deepEqual(collectReadyTaskIds(
  { id: "p1", color: "red", reservedCards: [{ id: "card-dlc41", cardId: "dlc_41.png" }] },
  {
    nebulaDataState: {
      nebulae: {
        "sector-4-a": { tokens: [{ replacedByPlayerId: "p1" }] },
        "sector-2-b": { tokens: [{ replacedByPlayerId: "p1" }] },
        "sector-2-a": { tokens: [{ replacedByPlayerId: "p1" }] },
        "sector-1-b": { tokens: [{ replacedByPlayerId: "p1" }] },
      },
    },
  },
), ["dlc41-four-color-signals"]);

assert.deepEqual(collectReadyTaskIds(
  { id: "p1", color: "red", reservedCards: [{ id: "card-dlc42", cardId: "dlc_42.png" }] },
  {
    nebulaDataState: {
      nebulae: {
        "sector-4-a": { tokens: [{ replacedByPlayerId: "p1" }] },
        "sector-3-a": { tokens: [{ replacedByPlayerId: "p1" }] },
        "sector-2-b": { tokens: [{ replacedByPlayerId: "p1" }] },
        "sector-3-b": { tokens: [{ replacedByPlayerId: "p1" }] },
        "sector-2-a": { tokens: [{ replacedByPlayerId: "p1" }] },
        "sector-1-a": { tokens: [{ replacedByPlayerId: "p1" }] },
        "sector-1-b": { tokens: [{ replacedByPlayerId: "p1" }] },
        "sector-4-b": { tokens: [{ replacedByPlayerId: "p1" }] },
      },
      sectorSettlements: { winsByPlayerId: {} },
    },
  },
), ["dlc42-all-sectors"]);

const playerTraceState = {
  aliens: {
    1: { traces: { pink: { firstPlaced: true, ownerPlayerColor: "red" } } },
    2: { traces: { pink: { firstPlaced: true, ownerPlayerColor: "red" } } },
  },
};
assert.deepEqual(collectReadyTaskIds(
  { id: "p1", color: "red", reservedCards: [{ id: "card-b46", cardId: "b_46.webp" }] },
  { alienGameState: playerTraceState },
), ["b46-all-pink-task"]);

assert.deepEqual(collectReadyTaskIds(
  { id: "p1", color: "red", reservedCards: [{ id: "card-b52", cardId: "b_52.webp" }] },
  { probeLocations: { p1: ["asteroid"] } },
), ["b52-asteroid-probe-task"]);

const singleAlienTraceState = {
  aliens: {
    1: {
      traces: {
        yellow: { firstPlaced: true, ownerPlayerColor: "red" },
        pink: { firstPlaced: true, ownerPlayerColor: "red" },
        blue: { firstPlaced: true, ownerPlayerColor: "red" },
      },
    },
    2: { traces: {} },
  },
};
assert.deepEqual(collectReadyTaskIds(
  { id: "p1", color: "red", reservedCards: [{ id: "card-b67", cardId: "b_67.webp" }] },
  { alienGameState: singleAlienTraceState },
), ["b67-three-traces-task"]);
assert.equal(
  cardEffects.collectReadyTasks(
    { id: "p1", color: "red", resources: { publicity: 7 }, reservedCards: [{ id: "card-b68", cardId: "b_68.webp" }] },
    { nebulaDataState: {}, alienGameState: {}, planetStatsState: {} },
  ).length,
  0,
);
assert.deepEqual(collectReadyTaskIds(
  { id: "p1", color: "red", resources: { publicity: 8 }, reservedCards: [{ id: "card-b68-ready", cardId: "b_68.webp" }] },
  {},
), ["b68-publicity-task"]);

for (const cardId of ["b_30.webp", "b_31.webp", "b_33.webp", "b_38.webp", "b_43.webp", "b_45.webp", "b_56.webp", "b_63.webp", "b_65.webp", "b_69.webp", "b_70.webp"]) {
  assert.equal(cardEffects.getCardMigrationStatus(cardId), "implemented");
  assert.ok(cardEffects.getCardModel(cardId), `${cardId} should stay modeled`);
}

const aomomo1 = { id: "card-aomomo-1", cardId: "aomomo_1.webp", aomomoCard: true };
const aomomoTriggerPlayer = { id: "p1", color: "white", reservedCards: [aomomo1] };
cardEffects.ensureCardEffectState(aomomo1);
const aomomoTraceMatches = cardEffects.collectMatchingTriggers(aomomoTriggerPlayer, {
  type: "alienTrace",
  alienId: "aomomo",
  traceType: "pink",
});
assert.equal(aomomoTraceMatches.length, 3);
assert.deepEqual(aomomoTraceMatches.map((match) => match.trigger.id), [
  "aomomo1-trace-data",
  "aomomo1-trace-publicity",
  "aomomo1-trace-score",
]);

function createAomomoAlienState(triggerPlayer) {
  const alienGameState = {
    aliens: {
      1: { revealed: true, alienId: aomomo.ALIEN_ID, assignedAlienId: aomomo.ALIEN_ID },
    },
    aomomo: aomomo.createAomomoState(),
  };
  const result = aomomo.initializeAomomoReveal(alienGameState, 1, triggerPlayer, () => 0);
  assert.equal(result.ok, true);
  return alienGameState;
}

function collectAomomoReadyTaskIds(player, alienGameState) {
  return cardEffects.collectReadyTasks(player, {
    nebulaDataState: {},
    alienGameState,
    planetStatsState: {},
  }).map((readyTask) => readyTask.task.id);
}

const aomomo0 = { id: "card-aomomo-0", cardId: "aomomo_0.webp", aomomoCard: true };
const aomomoLandingPlayer = {
  id: "p1",
  color: "white",
  resources: { aomomoFossils: 0 },
  reservedCards: [aomomo0],
};
const aomomoLandingState = createAomomoAlienState(aomomoLandingPlayer);
assert.equal(collectAomomoReadyTaskIds(aomomoLandingPlayer, aomomoLandingState).length, 0);
assert.equal(aomomo.addLandingMarker(aomomoLandingState, aomomoLandingPlayer).ok, true);
assert.deepEqual(collectAomomoReadyTaskIds(aomomoLandingPlayer, aomomoLandingState), ["aomomo0-land"]);

const aomomo2 = { id: "card-aomomo-2", cardId: "aomomo_2.webp", aomomoCard: true };
const aomomoFossilPlayer = {
  id: "p1",
  color: "white",
  resources: { aomomoFossils: 2 },
  reservedCards: [aomomo2],
};
assert.equal(collectAomomoReadyTaskIds(aomomoFossilPlayer, {}).length, 0);
aomomoFossilPlayer.resources.aomomoFossils = 3;
assert.deepEqual(collectAomomoReadyTaskIds(aomomoFossilPlayer, {}), ["aomomo2-fossils-score"]);

const aomomo3 = { id: "card-aomomo-3", cardId: "aomomo_3.webp", aomomoCard: true };
const aomomoTraceSetPlayer = {
  id: "p1",
  color: "white",
  resources: { aomomoFossils: 0 },
  reservedCards: [aomomo3],
};
const aomomoTraceSetState = createAomomoAlienState(aomomoTraceSetPlayer);
assert.equal(aomomo.placeAomomoTrace(aomomoTraceSetState, 1, "pink", 2, aomomoTraceSetPlayer).ok, true);
assert.equal(aomomo.placeAomomoTrace(aomomoTraceSetState, 1, "yellow", 3, aomomoTraceSetPlayer).ok, true);
assert.equal(aomomo.placeAomomoTrace(aomomoTraceSetState, 1, "blue", 4, aomomoTraceSetPlayer).ok, true);
assert.deepEqual(collectAomomoReadyTaskIds(aomomoTraceSetPlayer, aomomoTraceSetState), ["aomomo3-all-trace-types"]);

const aomomo9 = { id: "card-aomomo-9", cardId: "aomomo_9.webp", aomomoCard: true };
const aomomoFossilTracePlayer = {
  id: "p1",
  color: "white",
  resources: { aomomoFossils: 0 },
  reservedCards: [aomomo9],
};
const aomomoFossilTraceState = createAomomoAlienState(aomomoFossilTracePlayer);
assert.equal(collectAomomoReadyTaskIds(aomomoFossilTracePlayer, aomomoFossilTraceState).length, 0);
assert.equal(aomomo.placeAomomoTrace(aomomoFossilTraceState, 1, "pink", 1, aomomoFossilTracePlayer).ok, true);
assert.deepEqual(collectAomomoReadyTaskIds(aomomoFossilTracePlayer, aomomoFossilTraceState), ["aomomo9-fossil-spending-trace"]);

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
