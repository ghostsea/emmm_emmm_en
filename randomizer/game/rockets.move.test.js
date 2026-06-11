const assert = require("node:assert/strict");
require("../solar-system/core");
const rockets = require("./rockets");

const rocketState = rockets.createRocketState();
rockets.launchRocketAtSector(rocketState, { x: 5, y: 1 }, {
  playerId: "player-white",
  color: "white",
});
rockets.launchRocketAtSector(rocketState, { x: 5, y: 1 }, {
  playerId: "player-white",
  color: "white",
});

const blockedMove = rockets.canMoveRocket(rocketState, 2, 0, -1);
assert.equal(blockedMove.ok, false);

const allowedMove = rockets.canMoveRocket(rocketState, 2, 1, 0);
assert.equal(allowedMove.ok, true);

const moved = rockets.moveRocket(rocketState, 2, 1, 0);
assert.equal(moved.ok, true);
assert.equal(moved.rocket.id, 2);
assert.equal(rocketState.activeRocketId, 2);

const manualBoard = rockets.placeRocketAtBoardPoint(rocketState, 2, { x: 500, y: 250 });
assert.equal(manualBoard.ok, true);
assert.equal(manualBoard.rocket.surface, rockets.ROCKET_SURFACE.SOLAR);
assert.equal(manualBoard.rocket.slotIndex, null);

const manualReference = rockets.placeRocketAtPlanetsReferencePoint(rocketState, 2, {
  x: 836,
  y: 470.5,
  width: 1672,
  height: 941,
});
assert.equal(manualReference.ok, true);
assert.equal(manualReference.rocket.surface, rockets.ROCKET_SURFACE.PLANETS_REFERENCE);
assert.deepEqual(manualReference.rocket.planetsReference, {
  x: 836,
  y: 470.5,
  percentX: 50,
  percentY: 50,
  width: 1672,
  height: 941,
});
assert.equal(rockets.getRocketSectorCoordinate(manualReference.rocket), null);
assert.deepEqual(rockets.serializeSectorOccupancy(rocketState), { "5,1": [4] });

console.log("rocket move tests passed");
