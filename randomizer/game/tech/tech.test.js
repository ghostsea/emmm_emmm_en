const assert = require("node:assert/strict");

require("./catalog");
require("./board-state");
require("./player-tech");
require("./placement");
require("./bonuses");
require("./resolver");
require("../players");
require("../basic-cards");
require("./index");

const tech = require("./index");
const players = require("../players");
const basicCards = require("../basic-cards");

function createContext(publicity = 6) {
  const techGameState = tech.createState();
  const playerState = players.createPlayerState({
    currentPlayer: {
      color: "white",
      resources: { credits: 10, energy: 10, publicity, score: 0 },
    },
  });

  return {
    techGameState,
    techBoardState: techGameState.board,
    techUiState: techGameState.ui,
    playerState,
    solarState: { rotation: { rotationCount: 0 } },
    rotateSolarOrbit(count) {
      this.solarState.rotation.rotationCount += count;
    },
    drawBasicCardToPlayer(player) {
      return basicCards.drawRandomBasicCardToHand(player.hand);
    },
    ensurePlayerTechState(player) {
      if (!player.techState) player.techState = players.normalizePlayerTechState(null);
    },
  };
}

const gameState = tech.createState();
for (const techType of tech.TECH_TYPES) {
  assert.equal(tech.getRemainingForType(gameState.board, techType), 16);
  for (const tileId of tech.TILE_IDS_BY_TYPE[techType]) {
    assert.equal(tech.getRemainingForSlot(gameState.board, tileId), 4);
    const stack = gameState.board.stacks[tileId];
    assert.equal(new Set(stack.bonusQueue).size, 4);
    assert.equal(stack.bonusId, stack.bonusQueue[0]);
  }
}

const context = createContext(10);
const board = context.techGameState.board;
const player = players.getCurrentPlayer(context.playerState);
context.ensurePlayerTechState(player);

const previewContext = createContext(10);
const previewPlayer = players.getCurrentPlayer(previewContext.playerState);
previewContext.ensurePlayerTechState(previewPlayer);
const previewBonus = previewContext.techGameState.board.stacks.purple1.bonusId;
const previewSelect = tech.resolver.selectTechTile(previewContext, { tileId: "purple1" });
assert.equal(previewSelect.ok, true);
assert.equal(previewSelect.bonusId, previewBonus);
assert.equal(previewContext.techGameState.board.stacks.purple1.remaining, 4);
assert.equal(previewContext.techGameState.board.stacks.purple1.bonusId, previewBonus);
assert.equal(previewPlayer.resources.publicity, 10);
assert.equal(previewPlayer.techState.ownedTiles.purple1, undefined);
const previewTake = tech.resolver.takeSelectedTechTile(previewContext, {
  tileId: previewSelect.tileId,
  bonusId: previewSelect.bonusId,
  firstTake: previewSelect.firstTake,
});
assert.equal(previewTake.ok, true);
assert.equal(previewContext.techGameState.board.stacks.purple1.remaining, 3);
assert.equal(previewPlayer.techState.ownedTiles.purple1, true);

const pickBlue1 = tech.resolver.executeTakeTech(context, { tileId: "blue1" });
assert.equal(pickBlue1.ok, true);
assert.equal(pickBlue1.needsBlueSlotChoice, true);
assert.deepEqual(pickBlue1.availableSlots, [1, 2, 3, 4]);

const takeBlue1 = tech.resolver.executeTakeTech(context, { tileId: "blue1", blueSlot: 2 });
assert.equal(takeBlue1.ok, true);
assert.equal(takeBlue1.firstTake, true);
assert.equal(player.techState.ownedTiles.blue1, true);
assert.equal(player.techState.blueBoardSlots.blue1, 2);

const pickBlue2 = tech.resolver.executeTakeTech(context, {
  tileId: "blue2",
  skipCost: true,
  skipRotation: true,
});
assert.equal(pickBlue2.ok, true);
assert.equal(pickBlue2.needsBlueSlotChoice, true);
assert.deepEqual(pickBlue2.availableSlots, [1, 3, 4]);

const takeBlue2 = tech.resolver.executeTakeTech(context, {
  tileId: "blue2",
  blueSlot: 4,
  skipCost: true,
  skipRotation: true,
});
assert.equal(takeBlue2.ok, true);
assert.equal(player.techState.ownedTiles.blue2, true);
assert.equal(player.techState.blueBoardSlots.blue2, 4);
assert.equal(tech.playerTech.listOwnedTileIds(player.techState).length, 2);

const autoSlotContext = tech.createState();
const autoPlayerState = players.createPlayerState({
  currentPlayer: {
    color: "white",
    resources: { credits: 10, energy: 10, publicity: 10, score: 0 },
    techState: {
      ownedTiles: { blue1: true, blue2: true, blue3: true },
      blueBoardSlots: { blue1: 1, blue2: 2, blue3: 3 },
    },
  },
});
const autoContext = {
  techGameState: autoSlotContext,
  techBoardState: autoSlotContext.board,
  techUiState: autoSlotContext.ui,
  playerState: autoPlayerState,
  solarState: { rotation: { rotationCount: 0 } },
  rotateSolarOrbit() {},
  drawBasicCardToPlayer(player) {
    return basicCards.drawRandomBasicCardToHand(player.hand);
  },
  ensurePlayerTechState(player) {
    if (!player.techState) player.techState = players.normalizePlayerTechState(null);
  },
};
const autoTake = tech.resolver.executeTakeTech(autoContext, {
  tileId: "blue4",
  skipCost: true,
  skipRotation: true,
});
assert.equal(autoTake.ok, true);
assert.equal(autoTake.blueSlot, 4);
assert.equal(autoPlayerState.players[0].techState.blueBoardSlots.blue4, 4);

const takeBlue1Again = tech.resolver.executeTakeTech(context, { tileId: "blue1" });
assert.equal(takeBlue1Again.ok, false);

const turingBorrowFilterContext = createContext(10);
const turingBorrowPlayer = players.getCurrentPlayer(turingBorrowFilterContext.playerState);
turingBorrowFilterContext.ensurePlayerTechState(turingBorrowPlayer);
const turingBorrowOptions = { techTypes: ["orange", "purple"] };
assert.equal(
  tech.resolver.canTakeTile(turingBorrowFilterContext.techGameState.board, turingBorrowPlayer.techState, "blue1", turingBorrowOptions).ok,
  false,
);
assert.equal(
  tech.resolver.canTakeTile(turingBorrowFilterContext.techGameState.board, turingBorrowPlayer.techState, "orange1", turingBorrowOptions).ok,
  true,
);
assert.equal(
  tech.resolver.canTakeTile(turingBorrowFilterContext.techGameState.board, turingBorrowPlayer.techState, "purple1", turingBorrowOptions).ok,
  true,
);

const depletionBoard = tech.createState().board;
const orange1Queue = [...depletionBoard.stacks.orange1.bonusQueue];
for (let index = 0; index < 4; index += 1) {
  const result = tech.boardState.consumeFromSupplySlot(
    depletionBoard,
    "orange1",
    `player-${index}`,
    null,
  );
  assert.equal(result.ok, true);
  assert.equal(result.takenBonusId, orange1Queue[index]);
  assert.equal(result.firstTake, index === 0);
}
assert.equal(tech.getRemainingForSlot(depletionBoard, "orange1"), 0);
assert.equal(tech.isSlotAvailable(depletionBoard, "orange2"), true);

const context3 = createContext(10);
const player3 = players.getCurrentPlayer(context3.playerState);
context3.ensurePlayerTechState(player3);
const firstOrange = tech.resolver.executeTakeTech(context3, { tileId: "orange1" });
assert.equal(firstOrange.ok, true);
const secondOrange = tech.resolver.executeTakeTech(context3, {
  tileId: "orange2",
  skipCost: true,
  skipRotation: true,
});
assert.equal(secondOrange.ok, true);
assert.equal(tech.playerTech.listOwnedTileIds(player3.techState).length, 2);

const context4 = createContext(12);
const playerA = players.getCurrentPlayer(context4.playerState);
context4.ensurePlayerTechState(playerA);
const takeOrange1 = tech.resolver.executeTakeTech(context4, { tileId: "orange1" });
assert.equal(takeOrange1.firstTake, true);

context4.playerState.players.push({
  id: "player-b",
  color: "black",
  resources: { credits: 10, energy: 10, publicity: 12, score: 0 },
  techState: players.normalizePlayerTechState(null),
});
context4.playerState.currentPlayerId = "player-b";
const playerB = players.getCurrentPlayer(context4.playerState);
const takeOrange2 = tech.resolver.executeTakeTech(context4, { tileId: "orange2" });
assert.equal(takeOrange2.ok, true);
assert.equal(takeOrange2.firstTake, true);
assert.equal(context4.techGameState.board.stacks.orange2.firstTakeClaimedBy, playerB.id);

const disableContext = createContext(10);
const disablePlayer = players.getCurrentPlayer(disableContext.playerState);
disableContext.ensurePlayerTechState(disablePlayer);
const takeOrange1ForDisable = tech.resolver.executeTakeTech(disableContext, {
  tileId: "orange1",
  skipCost: true,
  skipRotation: true,
});
assert.equal(takeOrange1ForDisable.ok, true);
const disableOrange1 = tech.playerTech.removePlayerTile(disablePlayer.techState, "orange1");
assert.equal(disableOrange1.ok, true);
assert.equal(disableOrange1.disabled, true);
assert.equal(tech.playerTech.isTileDisabled(disablePlayer.techState, "orange1"), true);
assert.equal(tech.playerTech.playerHasActiveTile(disablePlayer.techState, "orange1"), false);
assert.equal(tech.playerTech.listOwnedTileIds(disablePlayer.techState).includes("orange1"), true);
assert.equal(tech.playerTech.canPlayerTakeTile(disablePlayer.techState, "orange1"), false);
assert.equal(
  tech.resolver.canTakeTile(disableContext.techGameState.board, disablePlayer.techState, "orange1").ok,
  false,
);
assert.equal(tech.playerTech.canPlayerTakeTile(disablePlayer.techState, "orange2"), true);
assert.equal(
  tech.resolver.canTakeTile(disableContext.techGameState.board, disablePlayer.techState, "orange2").ok,
  true,
);

console.log("tech.test.js passed");
