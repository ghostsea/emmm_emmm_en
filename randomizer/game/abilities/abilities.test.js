const assert = require("node:assert/strict");

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
  const context = createContext({ resources: { credits: 10, energy: 10 } });
  context.solarState.aomomoActive = true;
  aomomo.initializeAomomoReveal(context.alienGameState, 1, currentPlayer(context));
  launchToPlanet(context, aomomo.PLANET_ID);
  const result = abilities.executeAbility("orbitProbe", context);
  assert.equal(result.ok, true, result.message);
  assert.equal(result.markerKind, "aomomo-orbit");
  assert.equal(aomomo.countOrbitMarkers(context.alienGameState), 1);
  assert.equal(planetStats.getPlanetOrbitCount(context.planetStatsState, aomomo.PLANET_ID), 0);

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

  for (let index = result.commands.length - 1; index >= 0; index -= 1) {
    result.commands[index].undo();
  }

  assert.equal(aomomo.countLandingMarkers(context.alienGameState), 0);
  assert.equal(context.rocketState.rockets.length, 1);
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
  assert.equal(context.techBoardState.stacks.purple1.remaining, 3);
  assert.equal(player.techState.ownedTiles.purple1, true);

  const rotate = abilities.executeAbility("researchTechRotate", context);
  assert.equal(rotate.ok, true);
  assert.equal(rotate.undoable, false);
  assert.equal(context.solarState.rotation.rotationCount, beforeRotation + 1);

  const bonus = abilities.executeAbility("researchTechBonus", context, {
    bonusId: select.bonusId,
    firstTake: select.firstTake,
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
}

{
  const context = createContext({ resources: { credits: 10, energy: 10, publicity: 10 } });
  const prepare = abilities.executeAbility("researchTechPrepare", context);
  assert.equal(prepare.ok, true);
  const select = abilities.executeAbility("researchTechSelect", context, { tileId: "orange1" });
  assert.equal(select.ok, true);
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

console.log("abilities.test.js: all tests passed");
