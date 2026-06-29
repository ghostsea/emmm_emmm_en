const assert = require("node:assert/strict");
require("../solar-system/core");
const rockets = require("./rockets");

const rocketState = rockets.createRocketState();
const launched = rockets.launchRocketAtSector(rocketState, { x: 5, y: 1 }, {
  playerId: "player-white",
  color: "white",
});

assert.equal(launched.ok, true);
assert.equal(launched.rocket.id, 1);
assert.equal(launched.rocket.playerSequence, 1);
assert.equal(launched.rocket.playerId, "player-white");
assert.equal(launched.rocket.color, "white");
assert.equal(rocketState.activeRocketId, 1);
assert.deepEqual(rockets.serializeSectorOccupancy(rocketState), { "5,1": [4] });

const moved = rockets.moveActiveRocket(rocketState, 1, 0);
assert.equal(moved.ok, true);
assert.deepEqual(
  rockets.createRocketSnapshot(moved.rocket).slotSectorCoordinate,
  { x: 6, y: 1 },
);
assert.deepEqual(rockets.serializeSectorOccupancy(rocketState), { "6,1": [4] });

const fullSectorState = rockets.createRocketState();
for (let i = 0; i < 9; i += 1) {
  const result = rockets.launchRocketAtSector(fullSectorState, { x: 0, y: 1 }, {
    playerId: "player-white",
    color: "white",
  });
  assert.equal(result.ok, true);
}

assert.deepEqual(
  rockets.serializeSectorOccupancy(fullSectorState),
  { "0,1": [0, 1, 2, 3, 4, 5, 6, 7, 8] },
);

const blocked = rockets.launchRocketAtSector(fullSectorState, { x: 0, y: 1 }, {
  playerId: "player-white",
  color: "white",
});
assert.equal(blocked.ok, false);
assert.equal(fullSectorState.rockets.length, 9);
assert.equal(fullSectorState.nextRocketId, 10);
assert.match(blocked.message, /已满/);

const reuseState = rockets.createRocketState();
const firstLaunch = rockets.launchRocketAtSector(reuseState, { x: 5, y: 1 }, {
  playerId: "player-white",
  color: "white",
});
rockets.removeRocket(reuseState, firstLaunch.rocket.id);
const secondLaunch = rockets.launchRocketAtSector(reuseState, { x: 5, y: 1 }, {
  playerId: "player-white",
  color: "white",
});
assert.equal(secondLaunch.rocket.playerSequence, 1);

const fossilState = rockets.createRocketState();
const standard = rockets.launchRocketAtSector(fossilState, { x: 5, y: 1 }, {
  playerId: "player-white",
  color: "white",
});
const fossil = rockets.createMovableTokenAtSector(fossilState, { x: 5, y: 1 }, {
  kind: rockets.ROCKET_KIND.CHONG_FOSSIL,
  playerId: "player-white",
  color: "white",
  fossilId: "fossil_01",
});
assert.equal(standard.ok, true);
assert.equal(fossil.ok, true);
assert.equal(rockets.getRocketsForPlayer(fossilState, "player-white").length, 1);
assert.equal(rockets.getMovableTokensForPlayer(fossilState, "player-white").length, 2);
assert.equal(rockets.isControllablePlayerRocket(fossil.rocket), false);
assert.equal(rockets.isMovablePlayerToken(fossil.rocket), true);
assert.equal(rockets.isChongFossilRewardProbe(standard.rocket, "player-white"), true);
assert.equal(rockets.isChongFossilRewardProbe(fossil.rocket, "player-white"), true);
assert.equal(rockets.isChongFossilRewardProbe(fossil.rocket, "player-red"), false);
fossil.rocket.movementLocked = true;
assert.equal(rockets.isMovablePlayerToken(fossil.rocket), false);
assert.equal(rockets.isChongFossilRewardProbe(fossil.rocket, "player-white"), false);
assert.equal(rockets.getMovableTokensForPlayer(fossilState, "player-white").length, 1);

console.log("rocket action tests passed");
