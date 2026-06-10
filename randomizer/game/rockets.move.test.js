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

const moved = rockets.moveRocket(rocketState, 2, 1, 0);
assert.equal(moved.ok, true);
assert.equal(moved.rocket.id, 2);
assert.equal(rocketState.activeRocketId, 2);

console.log("rocket move tests passed");
