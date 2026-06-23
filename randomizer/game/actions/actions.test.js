const assert = require("node:assert/strict");
require("../../solar-system/layout");
require("../../solar-system/core");
require("../players");
require("../rockets");
require("../planet-reference-layout");
require("../planet-stats");
require("./shared");
require("./launch");
require("./orbit");
require("./land");
require("../tech/catalog");
require("../tech/board-state");
require("../tech/player-tech");
require("../tech/placement");
require("../tech/bonuses");
require("../tech/resolver");
require("../basic-cards");
require("../tech/index");
require("./research-tech");

const solar = require("../../solar-system/core");
const tech = require("../tech/index");
const players = require("../players");
const basicCards = require("../basic-cards");
const rockets = require("../rockets");
const planetStats = require("../planet-stats");
const actions = require("./index");

function createContext(overrides) {
  const solarState = solar.createBaselineState();
  const techGameState = tech.createState();
  const playerState = players.createPlayerState({
    currentPlayer: {
      color: "white",
      resources: { credits: 10, energy: 10, publicity: 10 },
    },
  });
  const rocketState = rockets.createRocketState();
  const planetStatsState = planetStats.createPlanetStatsState();

  const base = {
    solarState,
    playerState,
    rocketState,
    planetStatsState,
    techGameState,
    techBoardState: techGameState.board,
    techUiState: techGameState.ui,
    getEarthSectorCoordinate() {
      const snapshot = solar.createSolarSnapshot(solarState);
      const earth = snapshot.planetLocations.find((planet) => planet.planetId === "earth");
      return { x: earth.x, y: earth.y };
    },
    getPlanetLocations() {
      return solar.createSolarSnapshot(solarState).planetLocations;
    },
    rotateSolarOrbit(count) {
      solarState.rotation = solar.applySolarOrbitRotation(solarState.rotation, count || 1);
      solarState.wheelSteps = solar.rotationToWheelSteps(solarState.rotation);
    },
    drawBasicCardToPlayer(player) {
      return basicCards.drawRandomBasicCardToHand(player.hand);
    },
    beginCardSelection() {
      return { ok: true, message: "精选：从公共牌区选一张牌，或点击盲抽" };
    },
    ensurePlayerTechState(player) {
      if (!player.techState) player.techState = players.normalizePlayerTechState(null);
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
assert.equal(launchResult.rocket.playerSequence, 1);
assert.equal(players.getCurrentPlayer(context.playerState).resources.credits, 8);
const blockedSecondLaunch = actions.execute("launch", context);
assert.equal(blockedSecondLaunch.ok, false);
assert.match(blockedSecondLaunch.message, /火箭数量已达上限/);

const orange1LaunchContext = createContext();
players.getCurrentPlayer(orange1LaunchContext.playerState).techState.ownedTiles.orange1 = true;
assert.equal(actions.execute("launch", orange1LaunchContext).ok, true);
assert.equal(actions.execute("launch", orange1LaunchContext).ok, true);
assert.equal(orange1LaunchContext.rocketState.rockets.length, 2);

const noRocketContext = createContext();
const blockedOrbit = actions.execute("orbit", noRocketContext);
assert.equal(blockedOrbit.ok, false);
assert.match(blockedOrbit.message, /当前火箭/);

const referenceContext = createContext();
actions.execute("launch", referenceContext);
rockets.placeRocketAtPlanetsReferencePoint(referenceContext.rocketState, 1, {
  x: 836,
  y: 470.5,
  width: 1672,
  height: 941,
});
const referenceOrbit = actions.execute("orbit", referenceContext);
assert.equal(referenceOrbit.ok, false);
assert.match(referenceOrbit.message, /行星格/);

const marsContext = createContext();
launchToPlanet(marsContext, "mars");
const orbitResult = actions.execute("orbit", marsContext);
assert.equal(orbitResult.ok, true);
assert.equal(marsContext.rocketState.rockets.length, 0);
assert.equal(planetStats.getPlanetOrbitCount(marsContext.planetStatsState, "mars"), 1);
assert.equal(players.getCurrentPlayer(marsContext.playerState).orbitCount, 1);
assert.equal(players.getCurrentPlayer(marsContext.playerState).resources.credits, 7);
assert.equal(players.getCurrentPlayer(marsContext.playerState).resources.energy, 9);

const inactiveOrbitContext = createContext();
launchToPlanet(inactiveOrbitContext, "mars");
inactiveOrbitContext.rocketState.activeRocketId = null;
const inactiveOrbitCheck = actions.canExecute("orbit", inactiveOrbitContext);
assert.equal(inactiveOrbitCheck.ok, true);
const inactiveOrbitResult = actions.execute("orbit", inactiveOrbitContext);
assert.equal(inactiveOrbitResult.ok, true);
assert.equal(planetStats.getPlanetOrbitCount(inactiveOrbitContext.planetStatsState, "mars"), 1);

const multiOrbitContext = createContext();
players.getCurrentPlayer(multiOrbitContext.playerState).techState.ownedTiles.orange1 = true;
const multiOrbitMars = launchToPlanet(multiOrbitContext, "mars").rocket;
const multiOrbitVenus = launchToPlanet(multiOrbitContext, "venus").rocket;
const multiOrbitOptions = actions.getOrbitOptions(multiOrbitContext);
assert.equal(multiOrbitOptions.ok, true);
assert.equal(multiOrbitOptions.needsChoice, true);
const selectedOrbit = actions.execute("orbit", multiOrbitContext, { rocketId: multiOrbitMars.id });
assert.equal(selectedOrbit.ok, true);
assert.equal(selectedOrbit.removedRocketId, multiOrbitMars.id);
assert.equal(planetStats.getPlanetOrbitCount(multiOrbitContext.planetStatsState, "mars"), 1);
assert.equal(planetStats.getPlanetOrbitCount(multiOrbitContext.planetStatsState, "venus"), 0);
assert.equal(multiOrbitContext.rocketState.rockets.some((rocket) => rocket.id === multiOrbitVenus.id), true);

const landContext = createContext();
launchToPlanet(landContext, "venus");
const landWithoutOrbit = actions.execute("land", landContext);
assert.equal(landWithoutOrbit.ok, true);
assert.equal(planetStats.getPlanetLandingCount(landContext.planetStatsState, "venus"), 1);
assert.equal(players.getCurrentPlayer(landContext.playerState).resources.energy, 7);

const inactiveLandContext = createContext();
launchToPlanet(inactiveLandContext, "venus");
inactiveLandContext.rocketState.activeRocketId = null;
const inactiveLandCheck = actions.canExecute("land", inactiveLandContext);
assert.equal(inactiveLandCheck.ok, true);
const inactiveLandResult = actions.execute("land", inactiveLandContext);
assert.equal(inactiveLandResult.ok, true);
assert.equal(planetStats.getPlanetLandingCount(inactiveLandContext.planetStatsState, "venus"), 1);

const multiLandContext = createContext();
players.getCurrentPlayer(multiLandContext.playerState).techState.ownedTiles.orange1 = true;
const multiLandMars = launchToPlanet(multiLandContext, "mars").rocket;
const multiLandVenus = launchToPlanet(multiLandContext, "venus").rocket;
const multiLandOptions = actions.getLandOptions(multiLandContext);
assert.equal(multiLandOptions.ok, true);
assert.equal(multiLandOptions.needsChoice, true);
const multiLandMarsChoice = multiLandOptions.choices.find((choice) => choice.planetId === "mars" && choice.target.type === "planet");
assert.ok(multiLandMarsChoice);
const selectedLand = actions.execute("land", multiLandContext, { target: multiLandMarsChoice.target });
assert.equal(selectedLand.ok, true);
assert.equal(selectedLand.removedRocketId, multiLandMars.id);
assert.equal(planetStats.getPlanetLandingCount(multiLandContext.planetStatsState, "mars"), 1);
assert.equal(planetStats.getPlanetLandingCount(multiLandContext.planetStatsState, "venus"), 0);
assert.equal(multiLandContext.rocketState.rockets.some((rocket) => rocket.id === multiLandVenus.id), true);

const discountedLandContext = createContext();
launchToPlanet(discountedLandContext, "jupiter");
actions.execute("orbit", discountedLandContext);
launchToPlanet(discountedLandContext, "jupiter");
const discountedLand = actions.execute("land", discountedLandContext, { target: { type: "planet" } });
assert.equal(discountedLand.ok, true);
assert.equal(discountedLand.cost.energy, 2);
assert.equal(planetStats.getPlanetLandingCount(discountedLandContext.planetStatsState, "jupiter"), 1);

const marsSatelliteContext = createContext();
players.getCurrentPlayer(marsSatelliteContext.playerState).techState.ownedTiles.orange4 = true;
launchToPlanet(marsSatelliteContext, "mars");
const marsSatelliteLand = actions.execute("land", marsSatelliteContext, {
  target: { type: "satellite", satelliteId: "phobos-deimos" },
});
assert.equal(marsSatelliteLand.ok, true);
assert.equal(marsSatelliteLand.markerKind, "satellite");
assert.equal(planetStats.getSatelliteLandingMarkers(marsSatelliteContext.planetStatsState, "mars").length, 1);
assert.equal(marsSatelliteContext.rocketState.rockets.length, 0);

const orbitReuseContext = createContext();
actions.execute("launch", orbitReuseContext);
const firstRocketSequence = orbitReuseContext.rocketState.rockets[0].playerSequence;
rockets.moveActiveRocket(
  orbitReuseContext.rocketState,
  orbitReuseContext.getPlanetLocations().find((item) => item.planetId === "venus").x - orbitReuseContext.rocketState.rockets[0].sectorX,
  orbitReuseContext.getPlanetLocations().find((item) => item.planetId === "venus").y - orbitReuseContext.rocketState.rockets[0].sectorY,
);
actions.execute("orbit", orbitReuseContext);
actions.execute("launch", orbitReuseContext);
assert.equal(orbitReuseContext.rocketState.rockets[0].playerSequence, firstRocketSequence);

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

const researchContext = createContext();
const researchStart = actions.execute("researchTech", researchContext);
assert.equal(researchStart.ok, true);
assert.equal(researchStart.awaitingTileSelection, true);

const researchTake = actions.execute("researchTech", researchContext, { tileId: "purple1" });
assert.equal(researchTake.ok, true);
assert.equal(researchTake.techType, "purple");
const researchPlayer = researchContext.playerState.players[0];
const bonusPublicity = researchTake.bonusId === "bonus_1m" ? 1 : 0;
assert.equal(researchPlayer.resources.publicity, 10 - 6 + bonusPublicity);
if (researchTake.bonusId === "bonus_3f") {
  assert.equal(researchPlayer.resources.score, 2 + 3);
}
if (researchTake.bonusId === "bonus_1p") {
  assert.equal(researchPlayer.resources.energy, 10 + 1);
}
if (researchTake.bonusId === "bonus_1c") {
  assert.equal(researchTake.awaitingCardSelection, true);
  assert.equal(researchPlayer.hand.length, 0);
}

console.log("action tests passed");
