const assert = require("node:assert/strict");

const solar = require("../../solar-system/core");
const players = require("../players");
const rockets = require("../rockets");
const planetStats = require("../planet-stats");
const data = require("../data");
const tech = require("../tech");
const basicCards = require("../basic-cards");
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
  assert.equal(player.resources.publicity, 10);
  assert.equal(context.solarState.rotation.rotationCount, beforeRotation);
  assert.equal(context.techBoardState.stacks.purple1.remaining, 4);

  const commit = abilities.executeAbility("researchTechCommit", context);
  assert.equal(commit.ok, true);
  assert.equal(commit.undoable, false);
  assert.equal(commit.commands.length, 0);
  assert.equal(context.solarState.rotation.rotationCount, beforeRotation + 1);
  assert.equal(context.techBoardState.stacks.purple1.remaining, 3);
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

console.log("abilities.test.js: all tests passed");
