const assert = require("node:assert/strict");
const planetStats = require("./planet-stats");

const player = { id: "p1", color: "white" };
const otherPlayer = { id: "p2", color: "blue" };

const state = planetStats.createPlanetStatsState();

for (let index = 0; index < 5; index += 1) {
  assert.equal(planetStats.addPlanetOrbitMarker(state, "mars", player).ok, true);
}
assert.equal(planetStats.canAddOrbitMarker(state, "mars"), false);
assert.equal(planetStats.removePlanetOrbitMarker(state, "mars", { sequence: 3, player }).ok, true);
assert.deepEqual(planetStats.getPlanetOrbitMarkers(state, "mars").map((marker) => marker.sequence), [1, 2, 3, 4]);
assert.equal(planetStats.canAddOrbitMarker(state, "mars"), true);
assert.equal(planetStats.addPlanetOrbitMarker(state, "mars", player).marker.sequence, 5);

assert.equal(planetStats.addPlanetLandingMarker(state, "venus", player).ok, true);
assert.equal(planetStats.addPlanetLandingMarker(state, "venus", otherPlayer).ok, true);
assert.equal(planetStats.removePlanetLandingMarker(state, "venus", { sequence: 1, player: otherPlayer }).ok, false);
assert.equal(planetStats.removePlanetLandingMarker(state, "venus", { sequence: 1, player }).ok, true);
assert.deepEqual(planetStats.getPlanetLandingMarkers(state, "venus").map((marker) => marker.sequence), [1]);
assert.equal(planetStats.getPlanetLandingMarkers(state, "venus")[0].playerId, "p2");

assert.equal(planetStats.addSatelliteLandingMarker(state, "jupiter", "europa", player).ok, true);
assert.equal(planetStats.canLandOnSatellite(state, "jupiter", "europa"), false);
assert.equal(planetStats.removeSatelliteLandingMarker(state, "jupiter", "europa", { player }).ok, true);
assert.equal(planetStats.canLandOnSatellite(state, "jupiter", "europa"), true);

console.log("planet stats tests passed");
