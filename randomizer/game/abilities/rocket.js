(function (root, factory) {
  "use strict";

  let players = root.SetiPlayers;
  let rockets = root.SetiRocketActions;
  let historyCommands = root.SetiHistoryCommands;

  if ((!players || !rockets || !historyCommands) && typeof require === "function") {
    players = players || require("../players");
    rockets = rockets || require("../rockets");
    historyCommands = historyCommands || require("../history/commands");
  }

  const api = factory(players, rockets, historyCommands);

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.SetiAbilityRocket = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function (
  players,
  rockets,
  historyCommands,
) {
  "use strict";

  const DEFAULT_LAUNCH_COST = Object.freeze({ credits: 2 });
  const DEFAULT_MOVE_COST = Object.freeze({});

  function cloneCost(cost) {
    return Object.fromEntries(
      Object.entries(cost || {}).filter(([, value]) => Number(value) > 0),
    );
  }

  function resolveCost(options, defaultCost) {
    if (options?.skipCost) return {};
    return cloneCost(options?.cost ?? defaultCost);
  }

  function hasCost(cost) {
    return Object.keys(cost || {}).length > 0;
  }

  function spendCost(player, cost) {
    if (!hasCost(cost)) return { ok: true, message: null };
    return players.spendResources(player, cost);
  }

  function buildSpendCommand(player, cost, label) {
    if (!hasCost(cost)) return null;
    return historyCommands.createResourceSpendCommand(
      player,
      cost,
      label || `消耗 ${players.formatResourceCost(cost)}`,
    );
  }

  function launchProbe(context, options = {}) {
    const currentPlayer = players.getCurrentPlayer(context.playerState);
    if (!currentPlayer) {
      return { ok: false, abilityId: "launchProbe", message: "没有当前玩家" };
    }

    const cost = resolveCost(options, DEFAULT_LAUNCH_COST);
    if (hasCost(cost) && !players.canAfford(currentPlayer, cost)) {
      return {
        ok: false,
        abilityId: "launchProbe",
        message: `资源不足，需要 ${players.formatResourceCost(cost)}`,
      };
    }

    const undoState = {
      nextRocketId: context.rocketState.nextRocketId,
      activeRocketId: context.rocketState.activeRocketId,
    };
    const earthSector = options.sectorCoordinate || context.getEarthSectorCoordinate();
    const launchResult = rockets.launchRocketAtSector(context.rocketState, earthSector, {
      playerId: currentPlayer.id,
      color: currentPlayer.color,
    });

    if (!launchResult.ok) {
      return {
        ok: false,
        abilityId: "launchProbe",
        message: launchResult.message,
      };
    }

    const spendResult = spendCost(currentPlayer, cost);
    if (!spendResult.ok) {
      rockets.removeRocket(context.rocketState, launchResult.rocket.id);
      context.rocketState.nextRocketId = undoState.nextRocketId;
      context.rocketState.activeRocketId = undoState.activeRocketId;
      return {
        ok: false,
        abilityId: "launchProbe",
        message: spendResult.message,
      };
    }

    const commands = [];
    const spendCommand = buildSpendCommand(
      currentPlayer,
      cost,
      options.historyLabel || `发射消耗 ${players.formatResourceCost(cost)}`,
    );
    if (spendCommand) commands.push(spendCommand);
    commands.push(historyCommands.createRemoveRocketCommand(
      rockets,
      context.rocketState,
      launchResult.rocket.id,
      currentPlayer,
      null,
      undoState,
    ));

    const costText = hasCost(cost) ? `，消耗 ${players.formatResourceCost(cost)}` : "";
    const message = `${launchResult.message}${costText}`;
    context.rocketState.statusNote = message;

    return {
      ok: true,
      abilityId: "launchProbe",
      message,
      commands,
      cost,
      payload: {
        rocket: launchResult.rocket,
      },
      rocket: launchResult.rocket,
    };
  }

  function moveProbe(context, options = {}) {
    const rocketId = Number(options.rocketId ?? context.rocketState.activeRocketId);
    const deltaX = Number(options.deltaX || 0);
    const deltaY = Number(options.deltaY || 0);
    const currentPlayer = players.getCurrentPlayer(context.playerState);
    const cost = resolveCost(options, DEFAULT_MOVE_COST);

    if (!currentPlayer) {
      return { ok: false, abilityId: "moveProbe", message: "没有当前玩家" };
    }
    if (!Number.isInteger(rocketId)) {
      return { ok: false, abilityId: "moveProbe", message: "没有可移动的飞船" };
    }
    if (hasCost(cost) && !players.canAfford(currentPlayer, cost)) {
      return {
        ok: false,
        abilityId: "moveProbe",
        message: `资源不足，需要 ${players.formatResourceCost(cost)}`,
      };
    }

    const moveCheck = rockets.canMoveRocket(context.rocketState, rocketId, deltaX, deltaY);
    if (!moveCheck.ok) {
      return { ok: false, abilityId: "moveProbe", message: moveCheck.message };
    }

    const beforeRocket = structuredClone(
      context.rocketState.rockets.find((rocket) => rocket.id === rocketId),
    );
    const spendResult = spendCost(currentPlayer, cost);
    if (!spendResult.ok) {
      return {
        ok: false,
        abilityId: "moveProbe",
        message: spendResult.message,
      };
    }

    const moveResult = rockets.moveRocket(context.rocketState, rocketId, deltaX, deltaY);
    if (!moveResult.ok) {
      if (hasCost(cost)) players.gainResources(currentPlayer, cost);
      return {
        ok: false,
        abilityId: "moveProbe",
        message: moveResult.message,
      };
    }

    const commands = [];
    const spendCommand = buildSpendCommand(
      currentPlayer,
      cost,
      options.historyLabel || `移动消耗 ${players.formatResourceCost(cost)}`,
    );
    if (spendCommand) commands.push(spendCommand);
    if (beforeRocket) {
      commands.push(historyCommands.createMoveRocketCommand(
        context.rocketState,
        rocketId,
        beforeRocket,
      ));
    }

    const costText = hasCost(cost) ? `，消耗 ${players.formatResourceCost(cost)}` : "";
    const message = `${moveResult.message}${costText}`;
    context.rocketState.statusNote = message;

    return {
      ok: true,
      abilityId: "moveProbe",
      message,
      commands,
      cost,
      payload: {
        rocket: moveResult.rocket,
        rocketId,
        deltaX,
        deltaY,
      },
      rocket: moveResult.rocket,
    };
  }

  return Object.freeze({
    DEFAULT_LAUNCH_COST,
    DEFAULT_MOVE_COST,
    launchProbe,
    moveProbe,
  });
});
