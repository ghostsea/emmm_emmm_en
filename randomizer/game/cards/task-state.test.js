const assert = require("node:assert/strict");
const cardEffects = require("./effects");
const taskState = require("./task-state");

const b1 = { id: "card-b1", cardId: "b_1.webp" };
const b2 = { id: "card-b2", cardId: "b_2.webp" };

const sectorContext = {
  nebulaDataState: {
    sectorSettlements: {
      winsByPlayerId: {
        p1: [{ sectorId: "sector-4-a" }, { sectorId: "sector-3-a" }],
      },
    },
  },
  alienGameState: {},
  planetStatsState: {},
};

const taskPlayer = {
  id: "p1",
  color: "red",
  reservedCards: [b1, b2],
};

cardEffects.ensureCardEffectState(b1);
cardEffects.ensureCardEffectState(b2);

const state = taskState.createTaskState();
taskState.refreshTaskState(state, taskPlayer, sectorContext, cardEffects);

assert.equal(state.playerId, "p1");
assert.equal(state.readyType2Tasks.length, 1);
assert.equal(state.readyType2Tasks[0].card.id, "card-b1");
assert.equal(taskState.getReadyType2ForCard(state, "card-b1")?.task.id, "b1-yellow-sector-task");
assert.equal(taskState.getReadyType2ForCard(state, "card-b2"), null);
assert.equal(state.type1ReservedCards.length, 1);
assert.equal(state.type1ReservedCards[0].card.id, "card-b2");
assert.equal(state.type1ReservedCards[0].triggers.length, 3);
assert.equal(state.type2ReservedTasks.length, 1);
assert.equal(state.type2ReservedTasks[0].card.id, "card-b1");

const triggerMatches = taskState.collectType1TriggerMatches(taskPlayer, [{
  type: "visitPlanet",
  planetId: "mars",
}], cardEffects);
assert.equal(triggerMatches.length, 3);

const emptyState = taskState.createTaskState();
taskState.refreshTaskState(emptyState, null, sectorContext, cardEffects);
assert.equal(emptyState.readyType2Tasks.length, 0);
assert.equal(emptyState.type1ReservedCards.length, 0);

console.log("task-state.test.js: all tests passed");
