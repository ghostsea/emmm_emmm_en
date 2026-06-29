"use strict";

const assert = require("node:assert/strict");
const jiuzhe = require("./jiuzhe");
const state = require("./state");

const alienState = state.createDefaultAlienState();
alienState.aliens[1].assignedAlienId = jiuzhe.ALIEN_ID;
alienState.aliens[1].alienId = jiuzhe.ALIEN_ID;
alienState.aliens[1].revealed = true;
jiuzhe.ensureJiuzheState(alienState).revealedSlotId = 1;

const white = {
  id: "player-white",
  color: "white",
  colorLabel: "白色",
  resources: { score: 10, credits: 2 },
  income: { credits: 2, energy: 2, handSize: 1, publicity: 1, availableData: 1, additionalPublicScan: 1 },
  techState: { ownedTiles: { purple1: true, purple2: true, purple3: true }, blueBoardSlots: {} },
  completedTaskCount: 5,
};

let result = jiuzhe.placeJiuzheTrace(alienState, 1, "pink", 1, white);
assert.equal(result.ok, true);
assert.equal(result.reward.gain.score, 3);
assert.equal(jiuzhe.getThreat(alienState, white), 1);

result = jiuzhe.placeJiuzheTrace(alienState, 1, "pink", 1, white);
assert.equal(result.ok, false, "same Jiuzhe trace slot cannot be occupied twice");

result = jiuzhe.placeJiuzheTrace(alienState, 1, "yellow", 2, white);
assert.equal(result.ok, true);
assert.equal(result.reward.pickCard, true);
assert.equal(jiuzhe.getThreat(alienState, white), 3);

jiuzhe.dealJiuzheCards(alienState, [white], () => 0);
assert.equal(jiuzhe.getPlayerJiuzheCards(alienState, white).length, 3);

result = jiuzhe.playJiuzheCard(alienState, white, jiuzhe.getPlayerJiuzheCards(alienState, white)[0].index, {
  reason: "freeThreshold",
});
assert.equal(result.ok, true);
assert.equal(jiuzhe.countPlayedCards(alienState, white), 1);
assert.equal(jiuzhe.getPanelThreat(alienState, white), 3, "panel threat only counts alien board traces");
assert.equal(
  jiuzhe.getThreat(alienState, white),
  3 + (result.card.threat || 0),
  "total threat still includes played card threat",
);

const purpleCard = { index: 3 };
assert.equal(
  jiuzhe.isCardConditionMet(purpleCard, white, {
    alienGameState: alienState,
    planetStatsState: { planets: {} },
    nebulaDataState: { sectorSettlements: { winsByPlayerId: {} } },
  }),
  true,
  "purple tech condition should be met",
);

const baseIncomeOnlyTotalEightPlayer = {
  id: "player-brown",
  color: "brown",
  income: { credits: 2, energy: 1, handSize: 1, publicity: 4, availableData: 0, additionalPublicScan: 0 },
  initialSelection: { industry: { label: "层云核心" } },
};
assert.equal(
  jiuzhe.countIncomeIncreases(baseIncomeOnlyTotalEightPlayer),
  4,
  "company base income should not count as income increases",
);
assert.equal(
  jiuzhe.isCardConditionMet({ index: 5 }, baseIncomeOnlyTotalEightPlayer),
  false,
  "Jiuzhe card 5 should not count company base income toward the 8 income threshold",
);

const eightIncomeIncreasePlayer = {
  id: "player-green",
  color: "green",
  income: { credits: 4, energy: 3, handSize: 2, publicity: 1, availableData: 1, additionalPublicScan: 1 },
  initialSelection: { industry: { label: "层云核心" } },
};
assert.equal(
  jiuzhe.countIncomeIncreases(eightIncomeIncreasePlayer),
  8,
  "income increases should count only values above company base income",
);
assert.equal(
  jiuzhe.isCardConditionMet({ index: 5 }, eightIncomeIncreasePlayer),
  true,
  "Jiuzhe card 5 should score after 8 income increases",
);

assert.equal(
  jiuzhe.isCardConditionMet({ index: 1 }, white, {
    alienGameState: alienState,
    planetStatsState: { planets: {} },
    nebulaDataState: { sectorSettlements: { winsByPlayerId: {} } },
    plutoMarkers: [
      { kind: "orbit", planetId: "pluto", playerId: "player-white" },
      { kind: "land", planetId: "pluto", playerId: "player-white", sequence: 1 },
      { kind: "land", planetId: "pluto", playerId: "player-white", sequence: 2 },
    ],
  }),
  true,
  "Pluto markers should count for same-planet orbit/land Jiuzhe conditions",
);

const revealState = {
  aliens: {
    1: {
      revealed: true,
      assignedAlienId: jiuzhe.ALIEN_ID,
      alienId: jiuzhe.ALIEN_ID,
      traces: {
        pink: { firstPlaced: true, ownerPlayerColor: "white", extraCount: 0 },
        yellow: { firstPlaced: true, ownerPlayerColor: "white", extraCount: 0 },
        blue: { firstPlaced: true, ownerPlayerColor: "blue", extraCount: 0 },
      },
    },
  },
};
const blue = { id: "player-blue", color: "blue", resources: { score: 12 } };
const revealResult = jiuzhe.initializeJiuzheReveal(revealState, 1, white, [white, blue], () => 0);
assert.equal(revealResult.ok, true, "Jiuzhe reveal should initialize");
assert.equal(revealResult.freeScoreThreshold, 32, "free threshold should use the current highest score, not the trigger player's score");
assert.equal(revealResult.paidScoreThreshold, 52, "paid threshold should use the current highest score, not the trigger player's score");
assert.equal(jiuzhe.getTraceGrid(revealState, 1), null, "reveal should not prefill Jiuzhe trace grid");
assert.equal(
  jiuzhe.getPlayerJiuzheState(revealState, white).revealPlaysRemaining,
  2,
  "white should get one reveal play per owned first trace",
);
assert.equal(
  jiuzhe.getPlayerJiuzheState(revealState, blue).revealPlaysRemaining,
  1,
  "blue should get its reveal play by color ownership",
);
assert.equal(
  jiuzhe.getPendingOpportunity(revealState, white).reason,
  "reveal",
  "reveal should create an immediate card play opportunity",
);
assert.equal(jiuzhe.getThreat(revealState, white), 0, "reveal should not add threat from first traces");

console.log("aliens/jiuzhe.test.js ok");
