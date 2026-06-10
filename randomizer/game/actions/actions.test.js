const assert = require("node:assert/strict");
require("../../solar-system/layout");
require("../../solar-system/core");
require("../players");
require("../rockets");
require("../planet-stats");
require("./shared");
require("./launch");
require("./orbit");
require("./land");

const solar = require("../../solar-system/core");
const players = require("../players");
const rockets = require("../rockets");
const planetStats = require("../planet-stats");
const actions = require("./index");

function createContext(overrides) {
  const solarState = solar.createBaselineState();
  const playerState = players.createPlayerState({
    currentPlayer: {
      color: "white",
      resources: { credits: 10, energy: 10 },
    },
  });
  const rocketState = rockets.createRocketState();
  const planetStatsState = planetStats.createPlanetStatsState();

  const base = {
    solarState,
    playerState,
    rocketState,
    planetStatsState,
    getEarthSectorCoordinate() {
      const snapshot = solar.createSolarSnapshot(solarState);
      const earth = snapshot.planetLocations.find((planet) => planet.planetId === "earth");
      return { x: earth.x, y: earth.y };
    },
    getPlanetLocations() {
      return solar.createSolarSnapshot(solarState).planetLocations;
    },
  };

  return { ...base, ...overrides };
}

function launchToPlanet(context, planetId) {
  const launch = actions.execute("launch", context);
  assert.equal(launch.ok, true);

  const planet = context.getPlanetLocations().find((item) => item.planetId === planetId);
  assert.ok(planet, `planet ${planetId} not found`);

  const moveResult = rockets.moveActiveRocket(context.rocketState, planet.x - launch.rocket.sectorX, planet.y - launch.rocket.sectorY);
  assert.equal(moveResult.ok, true, moveResult.message);
  return { launch, planet, rocket: moveResult.rocket };
}

const context = createContext();
const launchResult = actions.execute("launch", context);
assert.equal(launchResult.ok, true);
assert.equal(players.getCurrentPlayer(context.playerState).resources.credits, 8);

const noRocketContext = createContext();
const blockedOrbit = actions.execute("orbit", noRocketContext);
assert.equal(blockedOrbit.ok, false);
assert.match(blockedOrbit.message, /当前火箭/);

const marsContext = createContext();
launchToPlanet(marsContext, "mars");
const orbitResult = actions.execute("orbit", marsContext);
assert.equal(orbitResult.ok, true);
assert.equal(marsContext.rocketState.rockets.length, 0);
assert.equal(planetStats.getPlanetOrbitCount(marsContext.planetStatsState, "mars"), 1);
assert.equal(players.getCurrentPlayer(marsContext.playerState).orbitCount, 1);
assert.equal(players.getCurrentPlayer(marsContext.playerState).resources.credits, 7);
assert.equal(players.getCurrentPlayer(marsContext.playerState).resources.energy, 9);

const landContext = createContext();
launchToPlanet(landContext, "venus");
const landWithoutOrbit = actions.execute("land", landContext);
assert.equal(landWithoutOrbit.ok, true);
assert.equal(planetStats.getPlanetLandingCount(landContext.planetStatsState, "venus"), 1);
assert.equal(players.getCurrentPlayer(landContext.playerState).resources.energy, 7);

const discountedLandContext = createContext();
launchToPlanet(discountedLandContext, "jupiter");
actions.execute("orbit", discountedLandContext);
launchToPlanet(discountedLandContext, "jupiter");
const discountedLand = actions.execute("land", discountedLandContext);
assert.equal(discountedLand.ok, true);
assert.equal(discountedLand.cost.energy, 2);
assert.equal(planetStats.getPlanetLandingCount(discountedLandContext.planetStatsState, "jupiter"), 1);

const poorContext = createContext({
  playerState: players.createPlayerState({
    currentPlayer: {
      color: "white",
      resources: { credits: 0, energy: 0 },
    },
  }),
});
const poorLaunch = actions.execute("launch", poorContext);
assert.equal(poorLaunch.ok, false);
assert.match(poorLaunch.message, /信用点不足/);

console.log("action tests passed");
