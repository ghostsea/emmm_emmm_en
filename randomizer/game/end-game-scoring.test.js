const assert = require("node:assert/strict");
const finalScoring = require("./final-scoring");
const endGameScoring = require("./end-game-scoring");
const cardEffects = require("./cards/effects");

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

white.resources.score = 50;
finalScoring.syncPendingMarks(state, [white]);
finalScoring.markTile(state, "b", white, { tokenSrc: "white.png" });
const bTile = endGameScoring.computePlayerTileScore(state, white, tileContext).tiles
  .find((entry) => entry.tileId === "b");
assert.equal(bTile.formulaId, "b2");

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

assert.equal(finalScoring.getTileVariant(state, "a"), 1);
assert.equal(finalScoring.getTileVariant(state, "b"), 2);
const randomized = finalScoring.randomizeTileVariants(finalScoring.createFinalScoringState(), ["a", "b"], () => 0.9);
assert.equal(randomized.a, 2);
assert.equal(randomized.b, 2);

assert.equal(cardEffects.getCardMigrationStatus("b_14.webp"), "implemented");
assert.equal(cardEffects.getCardModel("b_14.webp").endGameScoring.scorePer, 3);
assert.equal(cardEffects.getDeferredCardModel("b_34.webp").endGameScoring.planetId, "jupiter");

console.log("end-game-scoring tests passed");
