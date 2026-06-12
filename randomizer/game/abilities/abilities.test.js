const assert = require("node:assert/strict");

const solar = require("../../solar-system/core");
const players = require("../players");
const rockets = require("../rockets");
const data = require("../data");
require("../history/commands");
const abilities = require("./index");

function createContext(playerInput = {}) {
  const solarState = solar.createBaselineState();
  const playerState = players.createPlayerState({
    players: [{ color: "blue", ...playerInput }],
    currentPlayerColor: "blue",
  });
  const rocketState = rockets.createRocketState();

  return {
    solarState,
    playerState,
    rocketState,
    nebulaDataState: data.createDefaultNebulaDataState(),
    getEarthSectorCoordinate() {
      return solar.createSolarSnapshot(solarState)
        .planetLocations
        .find((planet) => planet.planetId === "earth");
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
