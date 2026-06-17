const assert = require("node:assert/strict");

require("./nebula-placement");
require("./nebula-state");
require("./index");

const data = require("./index");

assert.equal(data.getNebulaCapacity("sector-2-a"), 6);
assert.equal(data.getNebulaCapacity("sector-3-b"), 6);
assert.equal(data.getNebulaCapacity("sector-1-a"), 5);
assert.equal(data.getNebulaCapacity("sector-2-b"), 5);
assert.equal(data.getNebulaCapacity("sector-1-b"), 4);

const siriusLocal = data.sectorImageToNebulaLocal("sector-2-a", 21.26, 62.05);
assert.equal(siriusLocal.percentX, 42.52);
assert.equal(siriusLocal.percentY, 62.05);

const barnardLocal = data.sectorImageToNebulaLocal("sector-2-b", 59.77, 41.52);
assert.equal(barnardLocal.percentX, 19.54);
assert.equal(barnardLocal.percentY, 41.52);

const siriusBack = data.nebulaLocalToSectorImage("sector-2-a", 42.52, 62.05);
assert.equal(siriusBack.percentX, 21.26);
assert.equal(siriusBack.percentY, 62.05);

const siriusSlot1 = data.getNebulaDataSlotLayout("sector-2-a", 1);
assert.equal(siriusSlot1.percentX, 42.52);
assert.equal(siriusSlot1.percentY, 62.05);

const barnardSlot5 = data.getNebulaDataSlotLayout("sector-2-b", 5);
assert.equal(barnardSlot5.percentX, 48.28);
assert.equal(barnardSlot5.percentY, 54.35);

const nebulaDataState = data.createDefaultNebulaDataState();

const siriusFill = data.fillNebulaData(nebulaDataState, "sector-2-a", { source: "debug" });
assert.equal(siriusFill.ok, true);
assert.equal(siriusFill.added.length, 6);
assert.equal(data.listNebulaTokens(nebulaDataState, "sector-2-a").length, 6);

const siriusOverflow = data.fillNebulaData(nebulaDataState, "sector-2-a", { source: "debug" });
assert.equal(siriusOverflow.ok, false);

const vegaFill = data.fillNebulaData(nebulaDataState, "sector-1-b", { source: "debug" });
assert.equal(vegaFill.ok, true);
assert.equal(vegaFill.added.length, 4);

const allFill = data.fillAllNebulaData(nebulaDataState, { source: "debug" });
assert.equal(allFill.ok, true);
assert.equal(data.listAllNebulaTokens(nebulaDataState).length, 42);

for (const nebulaId of data.NEBULA_IDS) {
  const capacity = data.getNebulaCapacity(nebulaId);
  const tokens = data.listNebulaTokens(nebulaDataState, nebulaId);
  assert.equal(tokens.length, capacity, `${nebulaId} should have ${capacity} tokens`);
  for (const token of tokens) {
    const layout = data.getNebulaDataSlotLayout(nebulaId, token.slotIndex);
    assert.ok(layout, `${nebulaId} slot ${token.slotIndex} has layout`);
    assert.equal(token.percentX, layout.percentX);
    assert.equal(token.percentY, layout.percentY);
  }
}

const emptyReadout = data.getNebulaReadoutLines(data.createDefaultNebulaDataState());
assert.ok(emptyReadout.some((line) => line.includes("星云数据")));
assert.equal(emptyReadout.filter((line) => line.startsWith("[")).length, data.NEBULA_IDS.length);
assert.ok(emptyReadout.some((line) => line.includes("[南河三] 0/5")));
assert.ok(emptyReadout.some((line) => line.includes("局部坐标")));

const readout = data.getNebulaReadoutLines(nebulaDataState);
assert.ok(readout.some((line) => line.includes("[天狼星A] 6/6")));
assert.ok(readout.some((line) => line.includes("序号") && line.includes("局部坐标")));

const scanState = data.createDefaultNebulaDataState();
data.fillNebulaData(scanState, "sector-1-a", { source: "debug" });
const scanPlayer = {
  id: "player-blue",
  color: "blue",
  colorLabel: "蓝色",
  resources: { availableData: 0, score: 0 },
};
const firstReplace = data.replaceNextNebulaDataToken(scanState, "sector-1-a", scanPlayer, {
  playerTokenSrc: "../assets/tokens/normal_token-blue.png",
});
assert.equal(firstReplace.ok, true);
assert.equal(firstReplace.slotIndex, 1);
assert.equal(firstReplace.secondSlotScore, 0);
assert.equal(firstReplace.scoreAwarded, 0);
assert.equal(scanPlayer.resources.score, 0);
assert.equal(firstReplace.token.replacedByPlayerColor, "blue");
assert.equal(firstReplace.token.playerTokenSrc, "../assets/tokens/normal_token-blue.png");
assert.equal(data.getNebulaSecondSlotScoreReward(1), 0);
assert.equal(data.getNebulaSecondSlotScoreReward(2), data.NEBULA_SECOND_SLOT_SCORE);
assert.equal(data.NEBULA_SECOND_SLOT_SCORE, 2);

const secondReplace = data.replaceNextNebulaDataToken(scanState, "sector-1-a", scanPlayer, {
  playerTokenSrc: "../assets/tokens/normal_token-blue.png",
});
assert.equal(secondReplace.ok, true);
assert.equal(secondReplace.slotIndex, 2);
assert.equal(secondReplace.secondSlotScore, 2);
assert.equal(secondReplace.scoreAwarded, 2);
assert.equal(scanPlayer.resources.score, 2);

const replacementStats = data.getNebulaReplacementStats(scanState, "sector-1-a");
assert.equal(replacementStats.playerTokenCounts.blue, 2);
assert.equal(replacementStats.lastReplacedPlayerColor, "blue");
assert.ok(
  data.getNebulaReadoutLines(scanState).some((line) => line.includes("token=blue:2")),
);

const settlementState = data.createDefaultNebulaDataState();
const settlementPlayers = [
  { id: "player-blue", color: "blue", colorLabel: "蓝色" },
  { id: "player-green", color: "green", colorLabel: "绿色" },
  { id: "player-white", color: "white", colorLabel: "白色" },
];
data.fillNebulaData(settlementState, "sector-1-a", { source: "test" });
assert.equal(data.isSectorReadyToSettle(settlementState, "sector-1-a"), false);

[
  settlementPlayers[0],
  settlementPlayers[0],
  settlementPlayers[2],
  settlementPlayers[2],
  settlementPlayers[1],
].forEach((player, index) => {
  data.replaceNextNebulaDataToken(settlementState, "sector-1-a", player, {
    replacementOrder: index + 1,
  });
});

assert.equal(data.isSectorReadyToSettle(settlementState, "sector-1-a"), true);
const ranking = data.getSectorRanking(settlementState, "sector-1-a");
assert.equal(ranking[0].playerColor, "white");
assert.equal(ranking[1].playerColor, "blue");
assert.equal(ranking[2].playerColor, "green");

const settleResult = data.settleSector(settlementState, "sector-1-a", {
  players: settlementPlayers,
  getPlayerTokenSrc: (player) => `token-${player.color}.png`,
});
assert.equal(settleResult.ok, true);
assert.equal(settleResult.winner.playerColor, "white");
assert.equal(settleResult.second.playerColor, "blue");
assert.equal(settleResult.participants.length, 3);
assert.equal(settlementState.sectorSettlements.sectors["sector-1-a"].settlementCount, 1);
assert.deepEqual(settlementState.sectorSettlements.winsByPlayerId["player-white"], [
  { sectorId: "sector-1-a", settlementNumber: 1 },
]);
assert.equal(data.isSectorReadyToSettle(settlementState, "sector-1-a"), false);
assert.equal(data.listNebulaTokens(settlementState, "sector-1-a").length, 5);
const retained = data.listNebulaTokens(settlementState, "sector-1-a")
  .find((token) => token.slotIndex === 1);
assert.equal(retained.replacedByPlayerColor, "blue");
assert.equal(retained.playerTokenSrc, "token-blue.png");
assert.ok(data.getSectorSettlementReadoutLines(settlementState).some((line) => line.includes("南河三 结算1次")));

data.clearNebulaData(settlementState);
assert.equal(settlementState.sectorSettlements.sectors["sector-1-a"], undefined);

const extraMarkState = data.createDefaultNebulaDataState();
data.fillNebulaData(extraMarkState, "sector-1-a", { source: "test" });
[
  settlementPlayers[0],
  settlementPlayers[0],
  settlementPlayers[1],
  settlementPlayers[1],
  settlementPlayers[1],
].forEach((player, index) => {
  data.replaceNextNebulaDataToken(extraMarkState, "sector-1-a", player, {
    replacementOrder: index + 1,
  });
});
assert.equal(data.isSectorReadyToSettle(extraMarkState, "sector-1-a"), true);
assert.equal(data.getSectorRanking(extraMarkState, "sector-1-a")[0].playerColor, "green");
const extraMark = data.addSectorExtraMark(extraMarkState, "sector-1-a", settlementPlayers[0], {
  replacementOrder: 6,
});
assert.equal(extraMark.ok, true);
assert.equal(extraMark.extra, true);
assert.equal(data.listSectorExtraMarks(extraMarkState, "sector-1-a").length, 1);
const extraRanking = data.getSectorRanking(extraMarkState, "sector-1-a");
assert.equal(extraRanking[0].playerColor, "blue");
assert.equal(extraRanking[0].count, 3);
assert.equal(extraRanking[1].count, 3);
const extraSettleResult = data.settleSector(extraMarkState, "sector-1-a");
assert.equal(extraSettleResult.ok, true);
assert.equal(extraSettleResult.winner.playerColor, "blue");
assert.equal(extraSettleResult.second.playerColor, "green");
assert.equal(data.listSectorExtraMarks(extraMarkState, "sector-1-a").length, 0);

data.updateNebulaTokenPosition(nebulaDataState, "sector-2-a", 1, {
  percentX: 12.34,
  percentY: 56.78,
});
const moved = data.listNebulaTokens(nebulaDataState, "sector-2-a").find((token) => token.slotIndex === 1);
assert.equal(moved.percentX, 12.34);
assert.equal(moved.percentY, 56.78);

console.log("nebula.test.js: all tests passed");
