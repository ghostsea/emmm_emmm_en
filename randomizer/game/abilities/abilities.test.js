const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const solar = require("../../solar-system/core");
const players = require("../players");
const rockets = require("../rockets");
const planetStats = require("../planet-stats");
const data = require("../data");
const tech = require("../tech");
const playerTech = require("../tech/player-tech");
const basicCards = require("../basic-cards");
const aomomo = require("../aliens/aomomo");
require("../history/commands");
const abilities = require("./index");

function createContext(playerInput = {}) {
  const solarState = solar.createBaselineState();
  const playerState = players.createPlayerState({
    players: [{ color: "blue", ...playerInput }],
    currentPlayerColor: "blue",
  });
  const rocketState = rockets.createRocketState();
  const techGameState = tech.createState();

  return {
    solarState,
    playerState,
    rocketState,
    planetStatsState: planetStats.createPlanetStatsState(),
    alienGameState: { aliens: {}, aomomo: aomomo.createAomomoState() },
    techGameState,
    techBoardState: techGameState.board,
    techUiState: techGameState.ui,
    nebulaDataState: data.createDefaultNebulaDataState(),
    getEarthSectorCoordinate() {
      return solar.createSolarSnapshot(solarState)
        .planetLocations
        .find((planet) => planet.planetId === "earth");
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
    ensurePlayerTechState(player) {
      if (!player.techState) player.techState = players.normalizePlayerTechState(null);
    },
  };
}

function currentPlayer(context) {
  return players.getCurrentPlayer(context.playerState);
}

function setContextRotation(context, rotation) {
  context.solarState.rotation = rotation;
  context.solarState.wheelSteps = solar.rotationToWheelSteps(rotation);
}

function rotateContextOnce(context) {
  const beforeRotation = structuredClone(context.solarState.rotation);
  const afterRotation = solar.applySolarOrbitRotation(beforeRotation, 1);
  setContextRotation(context, afterRotation);
  return abilities.rocket.settleRocketsAfterSolarRotation(context, beforeRotation, afterRotation);
}

function runBrowserScript(sandbox, relativePath) {
  const filename = path.resolve(__dirname, "..", "..", relativePath);
  const code = fs.readFileSync(filename, "utf8");
  vm.runInContext(code, sandbox, { filename: relativePath });
}

function createLateAomomoAbilitySandbox() {
  const sandbox = {
    console,
    structuredClone,
  };
  sandbox.globalThis = sandbox;
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  [
    "solar-system/layout.js",
    "solar-system/core.js",
    "game/players.js",
    "game/rockets.js",
    "game/planet-reference-layout.js",
    "game/planet-stats.js",
    "game/actions/shared.js",
    "game/actions/planet-rewards.js",
    "game/history/commands.js",
    "game/abilities/planet.js",
  ].forEach((scriptPath) => runBrowserScript(sandbox, scriptPath));
  assert.equal(sandbox.SetiAlienAomomo, undefined);
  [
    "game/aliens/placement.js",
    "game/aliens/state.js",
    "game/aliens/aomomo.js",
  ].forEach((scriptPath) => runBrowserScript(sandbox, scriptPath));
  return sandbox;
}

function createBrowserAomomoPlanetContext(sandbox) {
  const solarApi = sandbox.SetiSolarSystem;
  const playersApi = sandbox.SetiPlayers;
  const rocketsApi = sandbox.SetiRocketActions;
  const planetStatsApi = sandbox.SetiPlanetStats;
  const aomomoApi = sandbox.SetiAlienAomomo;
  const solarState = solarApi.createBaselineState();
  solarState.aomomoActive = true;
  const playerState = playersApi.createPlayerState({
    players: [{ color: "blue", resources: { credits: 10, energy: 10 } }],
    currentPlayerColor: "blue",
  });
  const rocketState = rocketsApi.createRocketState();
  const alienGameState = {
    aliens: {
      1: { revealed: true, alienId: aomomoApi.ALIEN_ID, assignedAlienId: aomomoApi.ALIEN_ID },
    },
    aomomo: aomomoApi.createAomomoState(),
  };
  const context = {
    solarState,
    playerState,
    rocketState,
    planetStatsState: planetStatsApi.createPlanetStatsState(),
    alienGameState,
    getPlanetLocations() {
      return solarApi.createSolarSnapshot(solarState).planetLocations;
    },
  };
  const current = playersApi.getCurrentPlayer(playerState);
  aomomoApi.initializeAomomoReveal(alienGameState, 1, current);
  const planet = context.getPlanetLocations().find((item) => item.planetId === aomomoApi.PLANET_ID);
  assert.ok(planet, "aomomo planet should be visible");
  const launch = rocketsApi.launchRocketAtSector(rocketState, planet, {
    playerId: current.id,
    color: current.color,
  });
  assert.equal(launch.ok, true, launch.message);
  return { context, aomomoApi };
}

{
  const context = createContext({ resources: { credits: 10, energy: 10 } });
  const result = abilities.executeAbility("launchProbe", context);

  assert.equal(result.ok, true);
  assert.equal(result.cost.credits, 2);
  assert.equal(currentPlayer(context).resources.credits, 8);
  assert.equal(context.rocketState.rockets.length, 1);
  assert.equal(result.commands.length, 2);

  for (let index = result.commands.length - 1; index >= 0; index -= 1) {
    result.commands[index].undo();
  }

  assert.equal(currentPlayer(context).resources.credits, 10);
  assert.equal(context.rocketState.rockets.length, 0);
  assert.equal(context.rocketState.nextRocketId, 1);
}

{
  const context = createContext({ resources: { credits: 10, energy: 10 } });
  const first = abilities.executeAbility("launchProbe", context, { skipCost: true });
  assert.equal(first.ok, true);
  const blocked = abilities.executeAbility("launchProbe", context, { skipCost: true });
  assert.equal(blocked.ok, false);
  assert.match(blocked.message, /火箭数量已达上限/);

  currentPlayer(context).techState.ownedTiles.orange1 = true;
  const second = abilities.executeAbility("launchProbe", context, { skipCost: true });
  assert.equal(second.ok, true);
  assert.equal(context.rocketState.rockets.length, 2);
}

function launchToPlanet(context, planetId) {
  const launch = abilities.executeAbility("launchProbe", context, { skipCost: true });
  assert.equal(launch.ok, true);
  const planet = context.getPlanetLocations().find((item) => item.planetId === planetId);
  const moved = rockets.moveRocket(
    context.rocketState,
    launch.rocket.id,
    planet.x - launch.rocket.sectorX,
    planet.y - launch.rocket.sectorY,
  );
  assert.equal(moved.ok, true, moved.message);
  return moved.rocket;
}

{
  const context = createContext({ resources: { credits: 10, energy: 10 } });
  launchToPlanet(context, "mars");
  const result = abilities.executeAbility("orbitProbe", context);
  assert.equal(result.ok, true);
  assert.equal(result.undoable, true);
  assert.equal(context.rocketState.rockets.length, 0);
  assert.equal(planetStats.getPlanetOrbitCount(context.planetStatsState, "mars"), 1);
  assert.equal(currentPlayer(context).orbitCount, 1);

  for (let index = result.commands.length - 1; index >= 0; index -= 1) {
    result.commands[index].undo();
  }

  assert.equal(context.rocketState.rockets.length, 1);
  assert.equal(planetStats.getPlanetOrbitCount(context.planetStatsState, "mars"), 0);
  assert.equal(currentPlayer(context).orbitCount, 0);
  assert.equal(currentPlayer(context).resources.credits, 10);
}

{
  const context = createContext({ resources: { credits: 10, energy: 10 } });
  const player = currentPlayer(context);
  for (let index = 0; index < 5; index += 1) {
    assert.equal(planetStats.addPlanetOrbitMarker(context.planetStatsState, "mars", player).ok, true);
  }
  launchToPlanet(context, "mars");
  const options = abilities.planet.getOrbitOptions(context);
  assert.equal(options.ok, true, options.message);
  assert.equal(options.choices[0].markerSequence, 6);
  const result = abilities.executeAbility("orbitProbe", context);
  assert.equal(result.ok, true, result.message);
  assert.equal(result.markerSequence, 6);
  assert.equal(planetStats.getPlanetOrbitMarkers(context.planetStatsState, "mars")[5].displayed, false);
}

{
  const context = createContext({ resources: { credits: 10, energy: 10, publicity: 0 } });
  const launch = abilities.executeAbility("launchProbe", context, { skipCost: true });
  assert.equal(launch.ok, true);
  const earth = context.getEarthSectorCoordinate();
  rockets.assignRocketToSlot(launch.rocket, solar.mod8(earth.x - 1), earth.y, 4);
  const result = abilities.executeAbility("moveProbe", context, {
    cost: {},
    movementPoints: 1,
    rocketId: launch.rocket.id,
    deltaX: 1,
    deltaY: 0,
  });
  assert.equal(result.ok, true);
  assert.equal(currentPlayer(context).resources.publicity, 0);
  assert.ok(result.events.some((event) => event.type === "visitPlanet" && event.planetId === "earth"));
}

{
  const context = createContext({ resources: { credits: 10, energy: 10, publicity: 0 } });
  context.solarState.aomomoActive = true;
  aomomo.initializeAomomoReveal(context.alienGameState, 1, currentPlayer(context));
  const launch = abilities.executeAbility("launchProbe", context, { skipCost: true });
  assert.equal(launch.ok, true);
  const aomomoPlanet = context.getPlanetLocations().find((planet) => planet.planetId === aomomo.PLANET_ID);
  const result = abilities.executeAbility("moveProbe", context, {
    cost: {},
    rocketId: launch.rocket.id,
    deltaX: aomomoPlanet.x - launch.rocket.sectorX,
    deltaY: aomomoPlanet.y - launch.rocket.sectorY,
  });
  assert.equal(result.ok, true, result.message);
  assert.equal(currentPlayer(context).resources.publicity, 1);
  assert.ok(result.events.some((event) => (
    event.type === "visitPlanet"
    && event.planetId === aomomo.PLANET_ID
    && event.publicityReward === 1
  )));
}

{
  const context = createContext({ resources: { credits: 10, energy: 10 } });
  context.solarState.aomomoActive = true;
  aomomo.initializeAomomoReveal(context.alienGameState, 1, currentPlayer(context));
  launchToPlanet(context, aomomo.PLANET_ID);
  const result = abilities.executeAbility("orbitProbe", context);
  assert.equal(result.ok, true, result.message);
  assert.equal(result.markerKind, "aomomo-orbit");
  assert.equal(aomomo.countOrbitMarkers(context.alienGameState), 1);
  assert.equal(planetStats.getPlanetOrbitCount(context.planetStatsState, aomomo.PLANET_ID), 0);
  assert.ok(result.events.some((event) => event.type === "orbit" && event.planetId === aomomo.PLANET_ID));

  for (let index = result.commands.length - 1; index >= 0; index -= 1) {
    result.commands[index].undo();
  }

  assert.equal(aomomo.countOrbitMarkers(context.alienGameState), 0);
  assert.equal(context.rocketState.rockets.length, 1);
}

{
  const context = createContext({ resources: { credits: 10, energy: 10 } });
  launchToPlanet(context, "venus");
  const result = abilities.executeAbility("landProbe", context, { target: { type: "planet" } });
  assert.equal(result.ok, true);
  assert.equal(result.undoable, true);
  assert.equal(planetStats.getPlanetLandingCount(context.planetStatsState, "venus"), 1);
  assert.equal(currentPlayer(context).resources.energy, 7);

  for (let index = result.commands.length - 1; index >= 0; index -= 1) {
    result.commands[index].undo();
  }

  assert.equal(context.rocketState.rockets.length, 1);
  assert.equal(planetStats.getPlanetLandingCount(context.planetStatsState, "venus"), 0);
  assert.equal(currentPlayer(context).resources.energy, 10);
}

{
  const context = createContext({ resources: { credits: 10, energy: 10 } });
  const player = currentPlayer(context);
  for (let index = 0; index < 5; index += 1) {
    assert.equal(planetStats.addPlanetLandingMarker(context.planetStatsState, "venus", player).ok, true);
  }
  launchToPlanet(context, "venus");
  const options = abilities.planet.getLandOptions(context);
  assert.equal(options.ok, true, options.message);
  const choice = options.choices.find((item) => item.target.type === "planet");
  assert.equal(choice.markerSequence, 6);
  const result = abilities.executeAbility("landProbe", context, { target: choice.target });
  assert.equal(result.ok, true, result.message);
  assert.equal(result.markerSequence, 6);
  assert.equal(planetStats.getPlanetLandingMarkers(context.planetStatsState, "venus")[5].displayed, false);
}

{
  const context = createContext({ resources: { credits: 10, energy: 10 } });
  currentPlayer(context).techState.ownedTiles.orange1 = true;
  const marsRocket = launchToPlanet(context, "mars");
  const venusRocket = launchToPlanet(context, "venus");

  const options = abilities.planet.getOrbitOptions(context);
  assert.equal(options.ok, true);
  assert.equal(options.needsChoice, true);
  assert.deepEqual(
    options.choices.map((choice) => choice.planetId).sort(),
    ["mars", "venus"],
  );
  const marsOrbitChoice = options.choices.find((choice) => choice.planetId === "mars");
  assert.equal(marsOrbitChoice.markerSequence, 1);
  assert.match(
    marsOrbitChoice.label,
    /环绕火星 - 奖励：首次环绕：额外获得 3 分；精选 1 张卡牌；火星扇区扫描；获得 1 次收入/,
  );

  const result = abilities.executeAbility("orbitProbe", context, { rocketId: marsRocket.id });
  assert.equal(result.ok, true, result.message);
  assert.equal(result.removedRocketId, marsRocket.id);
  assert.equal(planetStats.getPlanetOrbitCount(context.planetStatsState, "mars"), 1);
  assert.equal(planetStats.getPlanetOrbitCount(context.planetStatsState, "venus"), 0);
  assert.equal(context.rocketState.rockets.some((rocket) => rocket.id === venusRocket.id), true);
}

{
  const context = createContext({ resources: { credits: 10, energy: 10 } });
  currentPlayer(context).techState.ownedTiles.orange1 = true;
  const marsRocket = launchToPlanet(context, "mars");
  const venusRocket = launchToPlanet(context, "venus");

  const options = abilities.planet.getLandOptions(context);
  assert.equal(options.ok, true);
  assert.equal(options.needsChoice, true);
  const marsChoice = options.choices.find((choice) => choice.planetId === "mars" && choice.target.type === "planet");
  assert.ok(marsChoice);
  assert.equal(marsChoice.markerSequence, 1);
  assert.match(
    marsChoice.label,
    /登陆火星 - 奖励：首次登陆：额外获得 2 个数据；获得 6 分；获得 1 个黄色外星人标记/,
  );

  const result = abilities.executeAbility("landProbe", context, { target: marsChoice.target });
  assert.equal(result.ok, true, result.message);
  assert.equal(result.removedRocketId, marsRocket.id);
  assert.equal(planetStats.getPlanetLandingCount(context.planetStatsState, "mars"), 1);
  assert.equal(planetStats.getPlanetLandingCount(context.planetStatsState, "venus"), 0);
  assert.equal(context.rocketState.rockets.some((rocket) => rocket.id === venusRocket.id), true);
}

{
  const context = createContext({ resources: { credits: 10, energy: 10 } });
  context.solarState.aomomoActive = true;
  aomomo.initializeAomomoReveal(context.alienGameState, 1, currentPlayer(context));
  launchToPlanet(context, aomomo.PLANET_ID);
  const result = abilities.executeAbility("landProbe", context, { target: { type: "planet" } });
  assert.equal(result.ok, true, result.message);
  assert.equal(result.markerKind, "aomomo-land");
  assert.equal(aomomo.countLandingMarkers(context.alienGameState), 1);
  assert.equal(planetStats.getPlanetLandingCount(context.planetStatsState, aomomo.PLANET_ID), 0);
  assert.ok(result.events.some((event) => event.type === "land" && event.planetId === aomomo.PLANET_ID));

  for (let index = result.commands.length - 1; index >= 0; index -= 1) {
    result.commands[index].undo();
  }

  assert.equal(aomomo.countLandingMarkers(context.alienGameState), 0);
  assert.equal(context.rocketState.rockets.length, 1);
}

{
  const sandbox = createLateAomomoAbilitySandbox();
  const { context, aomomoApi } = createBrowserAomomoPlanetContext(sandbox);
  const options = sandbox.SetiAbilityPlanet.getOrbitOptions(context);
  assert.equal(options.ok, true, options.message);
  assert.equal(options.choices[0].planetId, aomomoApi.PLANET_ID);
  const result = sandbox.SetiAbilityPlanet.orbitProbe(context);
  assert.equal(result.ok, true, result.message);
  assert.equal(result.markerKind, "aomomo-orbit");
  assert.equal(aomomoApi.countOrbitMarkers(context.alienGameState), 1);
}

{
  const sandbox = createLateAomomoAbilitySandbox();
  const { context, aomomoApi } = createBrowserAomomoPlanetContext(sandbox);
  const options = sandbox.SetiAbilityPlanet.getLandOptions(context);
  assert.equal(options.ok, true, options.message);
  assert.equal(options.choices[0].planetId, aomomoApi.PLANET_ID);
  const result = sandbox.SetiAbilityPlanet.landProbe(context);
  assert.equal(result.ok, true, result.message);
  assert.equal(result.markerKind, "aomomo-land");
  assert.equal(aomomoApi.countLandingMarkers(context.alienGameState), 1);
}

{
  const context = createContext({ resources: { credits: 10, energy: 10 } });
  currentPlayer(context).techState.ownedTiles.orange3 = true;
  launchToPlanet(context, "venus");
  const result = abilities.executeAbility("landProbe", context, { target: { type: "planet" } });
  assert.equal(result.ok, true);
  assert.equal(result.cost.energy, 2);
  assert.equal(currentPlayer(context).resources.energy, 8);
}

{
  const context = createContext({ resources: { credits: 10, energy: 10 } });
  launchToPlanet(context, "jupiter");
  const satelliteTarget = { type: "satellite", satelliteId: "io" };
  const blocked = abilities.executeAbility("landProbe", context, { target: satelliteTarget, skipCost: true });
  assert.equal(blocked.ok, false);
  assert.match(blocked.message, /橙色4/);

  const options = abilities.planet.getLandOptions(context, { allowSatelliteWithoutTech: true });
  assert.equal(options.ok, true);
  assert.equal(options.choices.some((choice) => choice.target.satelliteId === "io"), true);
  const ioChoice = options.choices.find((choice) => choice.target.satelliteId === "io");
  assert.match(ioChoice.label, /登陆木卫一 - 奖励：获得 10 分；获得 4 能量/);

  const result = abilities.executeAbility("landProbe", context, {
    target: satelliteTarget,
    skipCost: true,
    allowSatelliteWithoutTech: true,
  });
  assert.equal(result.ok, true);
  assert.equal(result.markerKind, "satellite");
  assert.equal(result.satelliteId, "io");
}

{
  const context = createContext({ resources: { credits: 10, energy: 10 } });
  const player = currentPlayer(context);
  assert.equal(planetStats.addPlanetLandingMarker(context.planetStatsState, "mars", { id: "p2", color: "white" }).ok, true);
  launchToPlanet(context, "mars");
  const options = abilities.planet.getLandOptions(context, {
    allowDuplicateLanding: true,
    forceFirstLandingReward: true,
    displayLandingSlot: 1,
    referenceOffsetTokenWidths: 0.5,
  });
  const choice = options.choices.find((item) => item.target.type === "planet");
  assert.equal(choice.markerSequence, 2);
  assert.equal(choice.rewardMarkerSequence, 1);
  assert.match(choice.label, /首次登陆：额外获得 2 个数据/);
  const result = abilities.executeAbility("landProbe", context, {
    target: choice.target,
    allowDuplicateLanding: true,
    forceFirstLandingReward: true,
    displayLandingSlot: 1,
    referenceOffsetTokenWidths: 0.5,
  });
  assert.equal(result.ok, true, result.message);
  assert.equal(result.markerSequence, 2);
  assert.equal(result.rewardMarkerSequence, 1);
  const marker = planetStats.getPlanetLandingMarkers(context.planetStatsState, "mars")[1];
  assert.equal(marker.playerId, player.id);
  assert.equal(marker.displaySlot, 1);
  assert.equal(marker.referenceOffsetTokenWidths, 0.5);
}

{
  const context = createContext({ resources: { credits: 10, energy: 10 } });
  const player = currentPlayer(context);
  assert.equal(planetStats.addSatelliteLandingMarker(context.planetStatsState, "jupiter", "io", { id: "p2", color: "white" }).ok, true);
  launchToPlanet(context, "jupiter");
  const options = abilities.planet.getLandOptions(context, {
    allowSatelliteWithoutTech: true,
    allowDuplicateSatelliteLanding: true,
    referenceOffsetTokenWidths: 0.5,
  });
  assert.equal(options.ok, true, options.message);
  const ioChoice = options.choices.find((choice) => choice.target.satelliteId === "io");
  assert.ok(ioChoice);
  assert.match(ioChoice.label, /可重复/);
  const result = abilities.executeAbility("landProbe", context, {
    target: ioChoice.target,
    skipCost: true,
    allowSatelliteWithoutTech: true,
    allowDuplicateSatelliteLanding: true,
    referenceOffsetTokenWidths: 0.5,
  });
  assert.equal(result.ok, true, result.message);
  assert.equal(result.markerKind, "satellite");
  const markers = planetStats.getSatelliteLandingMarkers(context.planetStatsState, "jupiter");
  assert.equal(markers.length, 2);
  assert.equal(markers[1].playerId, player.id);
  assert.equal(markers[1].referenceOffsetTokenWidths, 0.5);
}

{
  const context = createContext({ resources: { credits: 10, energy: 0 } });
  launchToPlanet(context, "jupiter");
  const options = abilities.planet.getLandOptions(context, {
    skipCost: true,
    allowSatelliteWithoutTech: true,
  });
  assert.equal(options.ok, true, options.message);
  assert.equal(options.choices.some((choice) => choice.target.type === "planet"), true);
  assert.equal(options.choices.some((choice) => choice.target.satelliteId === "io"), true);

  const result = abilities.executeAbility("landProbe", context, {
    target: { type: "satellite", satelliteId: "io" },
    skipCost: true,
    allowSatelliteWithoutTech: true,
  });
  assert.equal(result.ok, true, result.message);
  assert.equal(result.markerKind, "satellite");
  assert.equal(currentPlayer(context).resources.energy, 0);
}

{
  const context = createContext({ resources: { credits: 10, energy: 10 } });
  const player = currentPlayer(context);
  player.techState = playerTech.createPlayerTechState();
  playerTech.recordPlayerTake(player.techState, "blue1", 2);
  for (let index = 0; index < 3; index += 1) {
    data.gainData(player, { source: "test" });
    data.placeDataToComputer(player);
  }
  data.gainData(player, { source: "test" });

  const pending = abilities.executeAbility("placeData", context);
  assert.equal(pending.ok, true);
  assert.equal(pending.awaitingPlacementChoice, true);
  assert.ok(pending.choices.some((choice) => choice.target === data.PLACEMENT_KIND_BLUE_BONUS));

  const bluePlace = abilities.executeAbility("placeData", context, {
    target: data.PLACEMENT_KIND_BLUE_BONUS,
    blueSlot: 2,
  });
  assert.equal(bluePlace.ok, true);
  assert.equal(bluePlace.placementKind, data.PLACEMENT_KIND_BLUE_BONUS);
  assert.equal(bluePlace.blueSlot, 2);
  assert.deepEqual(bluePlace.slotBonus, { type: "credits", credits: 1 });
  assert.equal(data.listBlueBonusPlacedTokens(player).length, 1);

  bluePlace.commands[0].undo();
  assert.equal(data.listBlueBonusPlacedTokens(player).length, 0);
  assert.equal(data.listPoolTokens(player).length, 1);
}

{
  const context = createContext({ resources: { credits: 10, energy: 10 } });
  const player = currentPlayer(context);
  data.ensurePlayerDataState(player);
  for (let index = 0; index < 6; index += 1) {
    data.gainData(player, { source: "test" });
    data.placeDataToComputer(player);
  }
  const result = abilities.executeAbility("analyzeData", context);
  assert.equal(result.ok, true);
  assert.equal(result.undoable, true);
  assert.equal(player.dataState.placedTokens.length, 0);

  result.commands[0].undo();
  assert.equal(player.dataState.placedTokens.length, 6);
  assert.equal(player.resources.energy, 10);
}

{
  const context = createContext({ resources: { credits: 10, energy: 0 } });
  const player = currentPlayer(context);
  data.ensurePlayerDataState(player);
  for (let index = 0; index < 6; index += 1) {
    data.gainData(player, { source: "test" });
    data.placeDataToComputer(player);
  }

  const result = abilities.executeAbility("analyzeData", context, { skipCost: true });
  assert.equal(result.ok, true);
  assert.deepEqual(result.cost, {});
  assert.equal(player.resources.energy, 0);
  assert.equal(player.dataState.placedTokens.length, 0);
}

{
  const context = createContext({
    resources: { credits: 10, energy: 0 },
  });
  const player = currentPlayer(context);
  player.initialSelection = { industry: { label: "深空探测" } };
  data.ensurePlayerDataState(player);
  for (let index = 0; index < 6; index += 1) {
    data.gainData(player, { source: "test" });
    data.placeDataToComputer(player);
  }

  const result = abilities.executeAbility("analyzeData", context);
  assert.equal(result.ok, true);
  assert.deepEqual(result.cost, {});
  assert.equal(player.resources.energy, 0);
  assert.equal(player.dataState.placedTokens.length, 0);

  result.commands[0].undo();
  assert.equal(player.dataState.placedTokens.length, 6);
  assert.equal(player.resources.energy, 0);
}

{
  const context = createContext({ resources: { credits: 10, energy: 10, publicity: 10 } });
  const player = currentPlayer(context);
  const beforeRotation = context.solarState.rotation.rotationCount;
  const prepare = abilities.executeAbility("researchTechPrepare", context);
  assert.equal(prepare.ok, true);
  const select = abilities.executeAbility("researchTechSelect", context, { tileId: "purple1" });
  assert.equal(select.ok, true);
  assert.equal(select.undoable, true);
  assert.equal(player.resources.publicity, 4);
  assert.equal(context.solarState.rotation.rotationCount, beforeRotation);
  assert.equal(context.techBoardState.stacks.purple1.remaining, 4);
  assert.equal(player.techState.ownedTiles.purple1, undefined);

  const take = abilities.executeAbility("researchTechTake", context, {
    tileId: select.tileId,
    blueSlot: select.blueSlot,
    bonusId: select.bonusId,
    firstTake: select.firstTake,
  });
  assert.equal(take.ok, true);
  assert.equal(take.undoable, false);
  assert.equal(context.techBoardState.stacks.purple1.remaining, 3);
  assert.equal(player.techState.ownedTiles.purple1, true);

  const rotate = abilities.executeAbility("researchTechRotate", context);
  assert.equal(rotate.ok, true);
  assert.equal(rotate.undoable, false);
  assert.equal(context.solarState.rotation.rotationCount, beforeRotation + 1);

  const bonus = abilities.executeAbility("researchTechBonus", context, {
    bonusId: take.bonusId,
    firstTake: take.firstTake,
    skipCardSelection: true,
  });
  assert.equal(bonus.ok, true);
  assert.equal(bonus.undoable, false);
  assert.equal(context.techBoardState.stacks.purple1.remaining, 3);

  const dataGain1 = data.gainData(player, { source: "tech" });
  const dataGain2 = data.gainData(player, { source: "tech" });
  assert.equal(dataGain1.ok, true);
  assert.equal(dataGain2.ok, true);
  assert.equal(data.listPoolTokens(player).length, 2);
  assert.equal(player.resources.availableData, 2);
}

{
  const context = createContext({ resources: { credits: 10, energy: 10, publicity: 0 } });
  const player = currentPlayer(context);
  const prepare = abilities.executeAbility("researchTechPrepare", context, {
    techType: "blue",
    skipCost: true,
    source: "card",
  });
  assert.equal(prepare.ok, true);
  assert.deepEqual(prepare.allowedTechTypes, ["blue"]);
  const select = abilities.executeAbility("researchTechSelect", context, {
    tileId: "blue1",
    skipCost: true,
  });
  assert.equal(select.ok, true);
  assert.deepEqual(select.cost, {});
  assert.equal(player.resources.publicity, 0);
  assert.equal(player.techState.ownedTiles.blue1, undefined);
}

{
  const context = createContext({ resources: { credits: 10, energy: 10, publicity: 10 } });
  const prepare = abilities.executeAbility("researchTechPrepare", context, { techType: "purple" });
  assert.equal(prepare.ok, true);
  assert.deepEqual(prepare.allowedTechTypes, ["purple"]);
  assert.ok(prepare.takeable.length > 0);
  assert.ok(prepare.takeable.every((tileId) => tileId.startsWith("purple")));
  assert.deepEqual(context.techUiState.allowedTechTypes, ["purple"]);

  const blocked = abilities.executeAbility("researchTechSelect", context, { tileId: "orange1" });
  assert.equal(blocked.ok, false);
  assert.match(blocked.message, /颜色范围/);

  const select = abilities.executeAbility("researchTechSelect", context, { tileId: "purple1" });
  assert.equal(select.ok, true);
  assert.equal(select.tileId, "purple1");
  assert.equal(context.techUiState.allowedTechTypes, null);
  assert.equal(context.techBoardState.stacks.purple1.remaining, 4);
}

{
  const context = createContext({ resources: { credits: 10, energy: 10, publicity: 10 } });
  const prepare = abilities.executeAbility("researchTechPrepare", context);
  assert.equal(prepare.ok, true);
  const select = abilities.executeAbility("researchTechSelect", context, { tileId: "orange1" });
  assert.equal(select.ok, true);
  const take = abilities.executeAbility("researchTechTake", context, {
    tileId: select.tileId,
    bonusId: select.bonusId,
    firstTake: select.firstTake,
  });
  assert.equal(take.ok, true);
  assert.equal(context.rocketState.rockets.length, 0);
  const launch = abilities.executeAbility("launchProbe", context, {
    skipCost: true,
    source: "tech",
    historyLabel: "发射",
  });
  assert.equal(launch.ok, true);
  assert.equal(launch.undoable, true);
  assert.equal(context.rocketState.rockets.length, 1);
  assert.equal(launch.rocket.id, context.rocketState.rockets[0].id);
}

{
  const context = createContext({ resources: { credits: 10, energy: 10 } });
  const result = abilities.executeAbility("scanAction4", context, {
    choice: "launch",
    cost: { energy: 1 },
  });

  assert.equal(result.ok, true);
  assert.equal(result.cost.energy, 1);
  assert.equal(currentPlayer(context).resources.energy, 9);
  assert.equal(context.rocketState.rockets.length, 1);

  for (let index = result.commands.length - 1; index >= 0; index -= 1) {
    result.commands[index].undo();
  }

  assert.equal(currentPlayer(context).resources.energy, 10);
  assert.equal(context.rocketState.rockets.length, 0);
}

{
  const context = createContext({ resources: { credits: 10, energy: 10 } });
  data.fillNebulaData(context.nebulaDataState, "sector-1-a", { source: "test" });
  const result = abilities.executeAbility("scanSector", context, {
    nebulaId: "sector-1-a",
    prefix: "测试扫描",
  });

  assert.equal(result.ok, true);
  assert.equal(result.nebulaId, "sector-1-a");
  assert.equal(result.replaced.slotIndex, 1);
  assert.equal(currentPlayer(context).dataState.poolTokens.length, 1);
  assert.equal(currentPlayer(context).resources.availableData, 1);
  assert.equal(result.commands.length, 2);

  for (let index = result.commands.length - 1; index >= 0; index -= 1) {
    result.commands[index].undo();
  }

  const token = data.listNebulaTokens(context.nebulaDataState, "sector-1-a")[0];
  assert.equal(token.replacedByPlayerId, null);
  assert.equal(currentPlayer(context).dataState.poolTokens.length, 0);
  assert.equal(currentPlayer(context).resources.availableData, 0);
}

{
  const context = createContext({ resources: { credits: 10, energy: 10 } });
  const player = currentPlayer(context);
  data.fillNebulaData(context.nebulaDataState, "sector-1-b", { source: "test" });
  const result = abilities.executeAbility("scanSector", context, {
    nebulaId: "sector-1-b",
    gainData: false,
  });

  assert.equal(result.ok, true);
  assert.equal(result.nebulaId, "sector-1-b");
  assert.equal(result.replaced.slotIndex, 1);
  assert.equal(result.gainedData.skipped, true);
  assert.equal(result.payload.gainData, false);
  assert.equal(data.listPoolTokens(player).length, 0);
  assert.equal(player.resources.availableData, 0);
  assert.equal(result.commands.length, 1);

  result.commands[0].undo();
  const token = data.listNebulaTokens(context.nebulaDataState, "sector-1-b")[0];
  assert.equal(token.replacedByPlayerId, null);
  assert.equal(data.listPoolTokens(player).length, 0);
  assert.equal(player.resources.availableData, 0);
}

{
  const context = createContext({ resources: { credits: 10, energy: 10, score: 0 } });
  const player = currentPlayer(context);
  const opponent = players.createPlayer({ color: "green" });
  data.fillNebulaData(context.nebulaDataState, "sector-3-a", { source: "test" });
  [
    opponent,
    opponent,
    opponent,
    player,
    player,
  ].forEach((scanPlayer, index) => {
    const replace = data.replaceNextNebulaDataToken(context.nebulaDataState, "sector-3-a", scanPlayer, {
      replacementOrder: index + 1,
    });
    assert.equal(replace.ok, true);
  });
  assert.equal(data.getNextReplaceableNebulaToken(context.nebulaDataState, "sector-3-a"), null);
  assert.equal(data.getSectorRanking(context.nebulaDataState, "sector-3-a")[0].playerColor, "green");

  const result = abilities.executeAbility("scanSector", context, {
    nebulaId: "sector-3-a",
    prefix: "满扇区扫描",
  });

  assert.equal(result.ok, true);
  assert.equal(result.replaced, null);
  assert.equal(result.extraMark.ok, true);
  assert.equal(result.gainedData.skipped, true);
  assert.equal(result.payload.gainData, false);
  assert.equal(data.listPoolTokens(player).length, 0);
  assert.equal(player.resources.availableData, 0);
  assert.equal(data.listSectorExtraMarks(context.nebulaDataState, "sector-3-a").length, 1);
  assert.equal(data.getSectorRanking(context.nebulaDataState, "sector-3-a")[0].playerColor, "blue");
  assert.ok(result.events.some((event) => event.type === "signalMarked" && event.extra));
  assert.match(result.message, /不获得数据/);

  result.commands[0].undo();
  assert.equal(data.listSectorExtraMarks(context.nebulaDataState, "sector-3-a").length, 0);
  assert.equal(data.getSectorRanking(context.nebulaDataState, "sector-3-a")[0].playerColor, "green");

  const publicCard = { id: "public-yellow-scan", cardName: "黄牌" };
  context.cardState = { publicCards: [publicCard], discardPile: [] };
  const publicResult = abilities.executeAbility("scanPublicCard", context, {
    nebulaId: "sector-3-a",
    publicSlotIndex: 0,
    card: publicCard,
  });
  assert.equal(publicResult.ok, true);
  assert.equal(publicResult.extraMark.ok, true);
  assert.equal(publicResult.gainedData.skipped, true);
  assert.equal(context.cardState.publicCards[0], null);
  assert.equal(context.cardState.discardPile[0], publicCard);
  assert.equal(data.listSectorExtraMarks(context.nebulaDataState, "sector-3-a").length, 1);

  for (let index = publicResult.commands.length - 1; index >= 0; index -= 1) {
    publicResult.commands[index].undo();
  }
  assert.equal(context.cardState.publicCards[0], publicCard);
  assert.equal(context.cardState.discardPile.length, 0);
  assert.equal(data.listSectorExtraMarks(context.nebulaDataState, "sector-3-a").length, 0);
}

{
  const context = createContext({ resources: { credits: 10, energy: 10 } });
  const player = currentPlayer(context);
  data.ensurePlayerDataState(player);
  for (let index = 0; index < players.RESOURCE_LIMITS.availableData; index += 1) {
    const gain = data.gainData(player, { source: "test" });
    assert.equal(gain.ok, true);
  }
  data.fillNebulaData(context.nebulaDataState, "sector-2-a", { source: "test" });

  const result = abilities.executeAbility("scanSector", context, {
    nebulaId: "sector-2-a",
  });

  assert.equal(result.ok, true);
  assert.equal(result.gainedData.discarded, true);
  assert.equal(player.dataState.discardedCount, 1);

  result.commands[1].undo();
  assert.equal(player.dataState.discardedCount, 0);
}

{
  const context = createContext({ resources: { credits: 10, energy: 10, score: 0 } });
  const player = currentPlayer(context);
  data.fillNebulaData(context.nebulaDataState, "sector-2-a", { source: "test" });

  const first = abilities.executeAbility("scanSector", context, { nebulaId: "sector-2-a" });
  assert.equal(first.ok, true);
  assert.equal(player.resources.score, 0);

  const second = abilities.executeAbility("scanSector", context, { nebulaId: "sector-2-a" });
  assert.equal(second.ok, true);
  assert.equal(second.replaced.slotIndex, 2);
  assert.equal(second.replaced.scoreAwarded, 2);
  assert.equal(player.resources.score, 2);
  assert.match(second.message, /槽位2 \+2分/);

  for (let index = second.commands.length - 1; index >= 0; index -= 1) {
    second.commands[index].undo();
  }

  assert.equal(player.resources.score, 0);
  assert.equal(data.listPoolTokens(player).length, 1);
  assert.equal(
    data.listNebulaTokens(context.nebulaDataState, "sector-2-a")
      .filter((token) => token.replacedByPlayerId === player.id)
      .length,
    1,
  );
}

{
  const context = createContext({ resources: { credits: 10, energy: 10 } });
  const launch = abilities.executeAbility("launchProbe", context, { skipCost: true });
  const rocketId = launch.rocket.id;
  const before = rockets.getRocketSectorCoordinate(launch.rocket);
  const move = abilities.executeAbility("scanAction4", context, {
    choice: "move",
    rocketId,
    deltaX: 1,
    deltaY: 0,
    cost: {},
  });

  assert.equal(move.ok, true);
  assert.equal(currentPlayer(context).resources.energy, 10);
  assert.notDeepEqual(rockets.getRocketSectorCoordinate(move.rocket), before);

  move.commands[0].undo();
  assert.deepEqual(rockets.getRocketSectorCoordinate(move.rocket), before);
}

{
  const context = createContext({ resources: { credits: 10, energy: 10, publicity: 0 } });
  const rocket = launchToPlanet(context, "mars");
  const beforePublicity = currentPlayer(context).resources.publicity;
  const move = abilities.executeAbility("moveProbe", context, {
    rocketId: rocket.id,
    deltaX: 1,
    deltaY: 0,
    cost: { energy: 1 },
  });
  assert.equal(move.ok, true);
  assert.equal(currentPlayer(context).resources.publicity, beforePublicity);
}

{
  const context = createContext({ resources: { credits: 10, energy: 10, publicity: 0 } });
  const launch = abilities.executeAbility("launchProbe", context, { skipCost: true });
  assert.equal(launch.ok, true);
  const mercury = context.getPlanetLocations().find((planet) => planet.planetId === "mercury");
  const move = abilities.executeAbility("moveProbe", context, {
    rocketId: launch.rocket.id,
    deltaX: mercury.x - launch.rocket.sectorX,
    deltaY: mercury.y - launch.rocket.sectorY,
    cost: { energy: 1 },
  });
  assert.equal(move.ok, true, move.message);
  assert.equal(currentPlayer(context).resources.publicity, 1);
}

{
  const context = createContext({ resources: { credits: 10, energy: 10, publicity: 0 } });
  const launch = abilities.executeAbility("launchProbe", context, { skipCost: true });
  assert.equal(launch.ok, true);
  const asteroid = solar.collectVisibleCoordinateGroups(context.solarState).asteroids[0];
  const placed = rockets.moveRocket(
    context.rocketState,
    launch.rocket.id,
    asteroid.x - launch.rocket.sectorX,
    asteroid.y - launch.rocket.sectorY,
  );
  assert.equal(placed.ok, true, placed.message);
  const blocked = abilities.executeAbility("moveProbe", context, {
    rocketId: launch.rocket.id,
    deltaX: 1,
    deltaY: 0,
    cost: { energy: 1 },
    movementPoints: 1,
  });
  assert.equal(blocked.ok, false);
  assert.match(blocked.message, /移动力不足/);
  const moved = abilities.executeAbility("moveProbe", context, {
    rocketId: launch.rocket.id,
    deltaX: 1,
    deltaY: 0,
    cost: { energy: 2 },
    movementPoints: 2,
  });
  assert.equal(moved.ok, true, moved.message);
}

{
  const context = createContext({ resources: { credits: 10, energy: 10, publicity: 0 } });
  currentPlayer(context).techState.ownedTiles.orange2 = true;
  const launch = abilities.executeAbility("launchProbe", context, { skipCost: true });
  assert.equal(launch.ok, true);
  const asteroid = solar.collectVisibleCoordinateGroups(context.solarState).asteroids[0];
  const move = abilities.executeAbility("moveProbe", context, {
    rocketId: launch.rocket.id,
    deltaX: asteroid.x - launch.rocket.sectorX,
    deltaY: asteroid.y - launch.rocket.sectorY,
    cost: { energy: 1 },
  });
  assert.equal(move.ok, true, move.message);
  assert.equal(currentPlayer(context).resources.publicity, 1);
}

{
  const context = createContext({ resources: { credits: 10, energy: 10, publicity: 0 } });
  const player = currentPlayer(context);
  player.industryBorrowedTechTileId = "orange2";
  player.industryBorrowedTechRound = 2;
  player.industryBorrowedTechTurn = 4;
  const launch = abilities.executeAbility("launchProbe", context, { skipCost: true });
  assert.equal(launch.ok, true);
  const asteroid = solar.collectVisibleCoordinateGroups(context.solarState).asteroids[0];
  const placed = rockets.moveRocket(
    context.rocketState,
    launch.rocket.id,
    asteroid.x - launch.rocket.sectorX,
    asteroid.y - launch.rocket.sectorY,
  );
  assert.equal(placed.ok, true, placed.message);
  const move = abilities.executeAbility("moveProbe", context, {
    rocketId: launch.rocket.id,
    deltaX: 1,
    deltaY: 0,
    cost: {},
    movementPoints: 1,
  });
  assert.equal(move.ok, true, move.message);
  assert.equal(move.payload.requiredMovePoints, 1);
}

{
  const context = createContext({ resources: { credits: 10, energy: 10, publicity: 0 } });
  const launch = abilities.executeAbility("launchProbe", context, { skipCost: true });
  assert.equal(launch.ok, true);
  rockets.assignRocketToSlot(launch.rocket, 1, 1, 4);

  const result = rotateContextOnce(context);
  assert.equal(result.ok, true);
  assert.equal(result.moved[0].reason, "follow");
  assert.deepEqual(rockets.getRocketSectorCoordinate(launch.rocket), { x: 0, y: 1 });
  assert.equal(currentPlayer(context).resources.publicity, 0);
}

{
  const context = createContext({ resources: { credits: 10, energy: 10, publicity: 0 } });
  setContextRotation(context, solar.applySolarOrbitRotation(context.solarState.rotation, 1));
  const launch = abilities.executeAbility("launchProbe", context, { skipCost: true });
  assert.equal(launch.ok, true);
  rockets.assignRocketToSlot(launch.rocket, 1, 2, 4);

  const result = rotateContextOnce(context);
  assert.equal(result.ok, true, result.message);
  assert.equal(result.moved[0].reason, "pushed");
  assert.deepEqual(rockets.getRocketSectorCoordinate(launch.rocket), { x: 0, y: 2 });
  assert.equal(currentPlayer(context).resources.publicity, 1);
  assert.ok(result.events.some((event) => event.type === "visitComet"));
}

{
  const context = createContext({ resources: { credits: 10, energy: 10, publicity: 0 } });
  setContextRotation(context, solar.applySolarOrbitRotation(context.solarState.rotation, 1));
  const token = rockets.createMovableTokenAtSector(context.rocketState, { x: 1, y: 2 }, {
    kind: rockets.ROCKET_KIND.CHONG_FOSSIL,
    playerId: currentPlayer(context).id,
    color: currentPlayer(context).color,
    fossilId: "fossil_test",
  });
  assert.equal(token.ok, true, token.message);
  rockets.assignRocketToSlot(token.rocket, 1, 2, 4);

  const result = rotateContextOnce(context);
  assert.equal(result.ok, true, result.message);
  assert.equal(result.moved[0].rocketId, token.rocket.id);
  assert.equal(result.moved[0].reason, "pushed");
  assert.deepEqual(rockets.getRocketSectorCoordinate(token.rocket), { x: 0, y: 2 });
  assert.equal(currentPlayer(context).resources.publicity, 1);
  assert.ok(result.events.some((event) => (
    event.type === "visitComet"
    && event.rocketId === token.rocket.id
    && event.tokenKind === rockets.ROCKET_KIND.CHONG_FOSSIL
    && event.fossilId === "fossil_test"
  )));
}

{
  const context = createContext({ resources: { credits: 10, energy: 10, publicity: 0 } });
  currentPlayer(context).techState.ownedTiles.orange2 = true;
  const launch = abilities.executeAbility("launchProbe", context, { skipCost: true });
  assert.equal(launch.ok, true);
  rockets.assignRocketToSlot(launch.rocket, 0, 1, 4);

  const result = rotateContextOnce(context);
  assert.equal(result.ok, true, result.message);
  assert.equal(result.moved[0].reason, "pushed");
  assert.deepEqual(rockets.getRocketSectorCoordinate(launch.rocket), { x: 7, y: 1 });
  assert.equal(currentPlayer(context).resources.publicity, 1);
  assert.ok(result.events.some((event) => event.type === "visitAsteroid"));
}

{
  const context = createContext();
  context.playerState = players.createPlayerState({
    players: [
      {
        color: "blue",
        resources: { credits: 10, energy: 10, publicity: 0 },
        techState: { ownedTiles: { orange1: true, orange2: true } },
      },
      { color: "green", resources: { credits: 10, energy: 10, publicity: 0 } },
    ],
    currentPlayerColor: "blue",
  });
  const bluePlayer = currentPlayer(context);
  const launchOne = abilities.executeAbility("launchProbe", context, { skipCost: true });
  const launchTwo = abilities.executeAbility("launchProbe", context, { skipCost: true });
  assert.equal(launchOne.ok, true, launchOne.message);
  assert.equal(launchTwo.ok, true, launchTwo.message);
  rockets.assignRocketToSlot(launchOne.rocket, 0, 1, 4);
  rockets.assignRocketToSlot(launchTwo.rocket, 4, 1, 4);

  context.playerState.currentPlayerId = context.playerState.players.find((player) => player.color === "green").id;
  bluePlayer.passed = true;
  const result = rotateContextOnce(context);
  assert.equal(result.ok, true, result.message);
  assert.equal(result.moved.length, 2);
  assert.equal(result.moved.every((move) => move.reason === "pushed"), true);
  assert.equal(result.moved.every((move) => move.afterContent?.kind === solar.layout.CONTENT_KIND.ASTEROID), true);
  assert.equal(bluePlayer.resources.publicity, 2);
  assert.equal(result.events.filter((event) => event.type === "visitAsteroid").length, 2);
}

console.log("abilities.test.js: all tests passed");
