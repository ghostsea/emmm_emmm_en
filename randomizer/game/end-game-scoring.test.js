const assert = require("node:assert/strict");
const finalScoring = require("./final-scoring");
const endGameScoring = require("./end-game-scoring");
const cardEffects = require("./cards/effects");
const jiuzhe = require("./aliens/jiuzhe");
const chong = require("./aliens/chong");

function player(overrides = {}) {
  return {
    id: "player-white",
    color: "white",
    resources: { score: 20 },
    income: { credits: 3, energy: 2, handSize: 2 },
    completedTaskCount: 0,
    reservedCards: [],
    techState: { ownedTiles: {}, blueBoardSlots: {} },
    ...overrides,
  };
}

const state = finalScoring.createFinalScoringState(["a", "b", "c", "d"]);
finalScoring.setTileVariants(state, { a: 1, b: 2, c: 1, d: 2 });

const white = player();
white.resources.score = 25;
finalScoring.syncPendingMarks(state, [white]);
const markResult = finalScoring.markTile(state, "a", white, { tokenSrc: "white.png" });
assert.equal(markResult.ok, true);
assert.equal(markResult.mark.slotIndex, 1);

const tileContext = {
  currentPlayer: white,
  finalScoringState: state,
  nebulaDataState: { sectorSettlements: { winsByPlayerId: {} }, nebulae: {}, sectorExtraMarks: {} },
  alienGameState: { aliens: {} },
  planetStatsState: { planets: {} },
  cardEffects,
  getCardTypeCode: (card) => cardEffects.getRuntimeCardTypeCode(card, 0),
};

const tileScore = endGameScoring.computePlayerTileScore(state, white, tileContext);
assert.equal(tileScore.total, 15, "a1 with income 3/2 on slot 1 should score 3*5=15");
assert.equal(tileScore.tiles[0].formulaId, "a1");
const tileBreakdown = endGameScoring.computePlayerFinalScore({
  ...tileContext,
  currentPlayer: white,
});
assert.equal(tileBreakdown.tileScoresById.a, 15);
assert.equal(tileBreakdown.tileScoresById.b, 0);

white.resources.score = 50;
finalScoring.syncPendingMarks(state, [white]);
finalScoring.markTile(state, "b", white, { tokenSrc: "white.png" });
const bTile = endGameScoring.computePlayerTileScore(state, white, tileContext).tiles
  .find((entry) => entry.tileId === "b");
assert.equal(bTile.formulaId, "b2");

assert.equal(
  endGameScoring.countPlanetOrbitOrLand(white, { planets: {} }, "pluto", {
    plutoMarkers: [
      { kind: "orbit", planetId: "pluto", playerId: "player-white" },
      { kind: "land", planetId: "pluto", playerId: "player-white" },
    ],
  }),
  2,
  "Pluto orbit/land markers should count as that player's planet markers",
);
assert.equal(
  endGameScoring.countOrbitOrLandMarkers(white, { planets: {} }, {
    plutoMarkers: [
      { kind: "orbit", planetId: "pluto", playerId: "player-white" },
      { kind: "land", planetId: "pluto", playerId: "player-white" },
    ],
  }),
  2,
  "global orbit/land marker count should include Pluto",
);
assert.equal(
  endGameScoring.countPlanetLandingPairs(white, { planets: {} }, 2, {
    plutoMarkers: [
      { kind: "land", planetId: "pluto", playerId: "player-white", sequence: 1 },
      { kind: "land", planetId: "pluto", playerId: "player-white", sequence: 2 },
    ],
  }),
  1,
  "duplicate Pluto landings should count as same-planet landing pairs",
);

const slotThreeState = finalScoring.createFinalScoringState(["c"]);
finalScoring.setTileVariants(slotThreeState, { c: 1 });
const slotThreePlayer = player({
  id: "player-brown",
  color: "brown",
  completedTaskCount: 10,
  resources: { score: 25 },
});
const slotOnePlayer = player({ id: "player-blue", color: "blue", resources: { score: 25 } });
const slotTwoPlayer = player({ id: "player-green", color: "green", resources: { score: 25 } });
finalScoring.syncPendingMarks(slotThreeState, [slotOnePlayer, slotTwoPlayer, slotThreePlayer]);
finalScoring.markTile(slotThreeState, "c", slotOnePlayer, { tokenSrc: "blue.png" });
finalScoring.markTile(slotThreeState, "c", slotTwoPlayer, { tokenSrc: "green.png" });
finalScoring.markTile(slotThreeState, "c", slotThreePlayer, { tokenSrc: "brown.png" });
const thirdTile = endGameScoring.computePlayerTileScore(slotThreeState, slotThreePlayer, {
  ...tileContext,
  currentPlayer: slotThreePlayer,
}).tiles.find((entry) => entry.tileId === "c");
assert.equal(thirdTile.slotIndex, 3);
assert.equal(thirdTile.multiplier, 2, "slot 3 should use third-rank multiplier for c1");
assert.equal(thirdTile.score, 20, "10 completed tasks * 2 = 20");

const cardPlayer = player({
  reservedCards: [{ cardId: "b_14.webp" }],
});
const cardContext = {
  ...tileContext,
  currentPlayer: cardPlayer,
  nebulaDataState: {
    sectorSettlements: {
      winsByPlayerId: {
        white: [{ sectorId: "sector-2-b" }, { sectorId: "sector-3-b" }],
      },
    },
    nebulae: {},
    sectorExtraMarks: {},
  },
};
const cardScore = endGameScoring.computePlayerCardScore(cardPlayer, cardContext);
assert.equal(cardScore.total, 6, "two red sector wins on b_14 should score 6");

const signalPlayer = player({
  reservedCards: [{ cardId: "b_45.webp" }],
});
const signalContext = {
  ...tileContext,
  currentPlayer: signalPlayer,
  nebulaDataState: {
    sectorSettlements: { winsByPlayerId: {} },
    nebulae: {
      "sector-1-a": {
        tokens: [{ replacedByPlayerColor: "white" }],
      },
      "sector-2-b": {
        tokens: [{ replacedByPlayerColor: "white" }],
      },
    },
    sectorExtraMarks: {},
  },
};
assert.equal(
  endGameScoring.computePlayerCardScore(signalPlayer, signalContext).total,
  2,
);

const finalScore = endGameScoring.computePlayerFinalScore({
  ...signalContext,
  finalScoringState: finalScoring.createFinalScoringState(),
  currentPlayer: player({
    id: "player-final",
    color: "white",
    resources: { score: 10 },
    reservedCards: [{ cardId: "b_45.webp" }],
  }),
});
assert.equal(finalScore.baseScore, 10);
assert.equal(finalScore.cardScore, 2);
assert.equal(finalScore.totalScore, 12);

const jiuzheState = {
  aliens: {
    1: {
      revealed: true,
      alienId: jiuzhe.ALIEN_ID,
      traces: { yellow: {}, pink: {}, blue: {} },
    },
  },
};
jiuzhe.ensureJiuzheState(jiuzheState).revealedSlotId = 1;
const threatPlayerA = player({
  id: "player-a",
  color: "white",
  resources: { score: 100 },
  completedTaskCount: 5,
});
const threatPlayerB = player({
  id: "player-b",
  color: "blue",
  resources: { score: 80 },
});
jiuzhe.dealJiuzheCards(jiuzheState, [threatPlayerA, threatPlayerB], () => 0);
jiuzhe.getPlayerJiuzheCards(jiuzheState, threatPlayerA)[0] = {
  index: 13,
  threat: 4,
  score: 12,
  label: "完成5张任务牌",
  played: true,
};
jiuzhe.addThreat(jiuzheState, threatPlayerA, 4);
jiuzhe.addThreat(jiuzheState, threatPlayerB, 4);
const jiuzheFinal = endGameScoring.computePlayerFinalScore({
  currentPlayer: threatPlayerA,
  players: [threatPlayerA, threatPlayerB],
  finalScoringState: finalScoring.createFinalScoringState(),
  nebulaDataState: { sectorSettlements: { winsByPlayerId: {} }, nebulae: {}, sectorExtraMarks: {} },
  alienGameState: jiuzheState,
  planetStatsState: { planets: {} },
  cardEffects,
  getCardTypeCode: (card) => cardEffects.getRuntimeCardTypeCode(card, 0),
});
assert.equal(jiuzheFinal.jiuzheCardScore, 12);
assert.equal(jiuzheFinal.jiuzhePenaltyApplied, true);
assert.equal(jiuzheFinal.totalScore, Math.ceil(112 * 0.9));
assert.equal(jiuzheFinal.jiuzhePenaltyScore, Math.ceil(112 * 0.9) - 112);
assert.ok(jiuzheFinal.jiuzhePenaltyScore < 0);

assert.equal(finalScoring.getTileVariant(state, "a"), 1);
assert.equal(finalScoring.getTileVariant(state, "b"), 2);
const randomized = finalScoring.randomizeTileVariants(finalScoring.createFinalScoringState(), ["a", "b"], () => 0.9);
assert.equal(randomized.a, 2);
assert.equal(randomized.b, 2);

assert.equal(cardEffects.getCardMigrationStatus("b_14.webp"), "implemented");
assert.equal(cardEffects.getCardModel("b_14.webp").endGameScoring.scorePer, 3);
assert.equal(cardEffects.getCardMigrationStatus("b_34.webp"), "implemented");
assert.equal(cardEffects.getCardModel("b_34.webp").endGameScoring.planetId, "jupiter");

const chongState = {
  aliens: {
    2: {
      revealed: true,
      alienId: chong.ALIEN_ID,
      traces: { yellow: {}, pink: {}, blue: {} },
    },
  },
  chong: chong.createChongState(),
};
chong.initializeChongReveal(chongState, 2, white, () => 0);
chong.placeChongTrace(chongState, 2, "pink", 1, white);
chong.placeChongTrace(chongState, 2, "yellow", 1, white);
chong.placeChongTrace(chongState, 2, "blue", 7, white);
const chongPlayer = player({
  reservedCards: [chong.createAlienCard(2, 1)],
});
const chongScore = endGameScoring.computePlayerCardScore(chongPlayer, {
  ...tileContext,
  currentPlayer: chongPlayer,
  alienGameState: chongState,
  getCardTypeCode: (card) => card.cardTypeCode,
});
assert.equal(chongScore.total, 3, "生态系统研究 should score 1 per owned Chong trace");

const marsCardPlayer = player({
  reservedCards: [{ cardId: "b_74.webp", cardTypeCode: 3 }],
});
assert.equal(endGameScoring.computePlayerCardScore(marsCardPlayer, {
  ...tileContext,
  currentPlayer: marsCardPlayer,
  planetStatsState: {
    planets: {
      mars: {
        orbitMarkers: [{ playerId: "player-white" }],
        landingMarkers: [{ playerId: "player-white" }],
        satelliteLandings: [{ playerId: "player-white" }],
      },
    },
  },
}).total, 12);

const asteroidFinalPlayer = player({
  reservedCards: [{ cardId: "b_82.webp", cardTypeCode: 3 }],
});
assert.equal(endGameScoring.computePlayerCardScore(asteroidFinalPlayer, {
  ...tileContext,
  currentPlayer: asteroidFinalPlayer,
  probeLocations: { "player-white": ["asteroid"] },
}).total, 13);

const blueBlackPlayer = player({
  reservedCards: [
    { cardId: "b_100.webp", cardTypeCode: 3 },
    { cardId: "b_128.webp", cardTypeCode: 3 },
  ],
});
assert.equal(endGameScoring.computePlayerCardScore(blueBlackPlayer, {
  ...tileContext,
  currentPlayer: blueBlackPlayer,
  nebulaDataState: {
    sectorSettlements: {
      winsByPlayerId: {
        white: [{ sectorId: "sector-2-a" }, { sectorId: "sector-1-a" }, { sectorId: "sector-1-b" }],
      },
    },
    nebulae: {},
    sectorExtraMarks: {},
  },
}).total, 9);

const unmarkedState = finalScoring.createFinalScoringState(["c"]);
finalScoring.setTileVariants(unmarkedState, { c: 1 });
const unmarkedPlayer = player({
  completedTaskCount: 10,
  reservedCards: [{ cardId: "b_115.webp", cardTypeCode: 3 }],
});
assert.equal(endGameScoring.computePlayerCardScore(unmarkedPlayer, {
  ...tileContext,
  currentPlayer: unmarkedPlayer,
  finalScoringState: unmarkedState,
}).total, 29);

const dlcResourcePlayer = player({
  resources: { score: 0, availableData: 4, publicity: 7 },
  reservedCards: [
    { cardId: "dlc_8.png", cardTypeCode: 3 },
    { cardId: "dlc_10.png", cardTypeCode: 3 },
  ],
});
assert.equal(endGameScoring.computePlayerCardScore(dlcResourcePlayer, {
  ...tileContext,
  currentPlayer: dlcResourcePlayer,
}).total, 19);

const dlcLandingPlayer = player({
  reservedCards: [{ cardId: "dlc_31.png", cardTypeCode: 3 }],
});
assert.equal(endGameScoring.computePlayerCardScore(dlcLandingPlayer, {
  ...tileContext,
  currentPlayer: dlcLandingPlayer,
  planetStatsState: {
    planets: {
      mars: {
        orbitMarkers: [],
        landingMarkers: [{ playerId: "player-white" }, { playerId: "player-white" }],
        satelliteLandings: [{ playerId: "player-white" }],
      },
      venus: {
        orbitMarkers: [],
        landingMarkers: [{ playerId: "player-white" }],
        satelliteLandings: [],
      },
    },
  },
}).total, 6);

const dlcGrandTourPlayer = player({
  reservedCards: [{ cardId: "dlc_39.png", cardTypeCode: 3 }],
});
assert.equal(endGameScoring.computePlayerCardScore(dlcGrandTourPlayer, {
  ...tileContext,
  currentPlayer: dlcGrandTourPlayer,
  planetStatsState: {
    planets: {
      mars: {
        orbitMarkers: [{ playerId: "player-white" }],
        landingMarkers: [{ playerId: "player-white" }],
        satelliteLandings: [{ playerId: "player-white" }],
      },
      jupiter: {
        orbitMarkers: [{ color: "white" }],
        landingMarkers: [],
        satelliteLandings: [],
      },
    },
  },
}).total, 8);

console.log("end-game-scoring tests passed");
