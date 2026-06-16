(function (root, factory) {
  "use strict";

  let players = root.SetiPlayers;
  let rockets = root.SetiRocketActions;
  let historyCommands = root.SetiHistoryCommands;
  let solar = root.SetiSolarSystem;

  if ((!players || !rockets || !historyCommands || !solar) && typeof require === "function") {
    players = players || require("../players");
    rockets = rockets || require("../rockets");
    historyCommands = historyCommands || require("../history/commands");
    solar = solar || require("../../solar-system/core");
  }

  const api = factory(players, rockets, historyCommands, solar);

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.SetiAbilityRocket = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function (
  players,
  rockets,
  historyCommands,
  solar,
) {
  "use strict";

  const DEFAULT_LAUNCH_COST = Object.freeze({ credits: 2 });
  const DEFAULT_MOVE_COST = Object.freeze({});
  const BASE_ROCKET_LIMIT = 1;
  const ORANGE1_ROCKET_LIMIT = 2;
  const ASTEROID_EXIT_MOVE_POINTS = 2;

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

  function getRocketLimitForPlayer(player) {
    return players.playerOwnsTech(player, "orange1") ? ORANGE1_ROCKET_LIMIT : BASE_ROCKET_LIMIT;
  }

  function getActiveRocketCountForPlayer(rocketState, playerId) {
    return rockets.getRocketsForPlayer(rocketState, playerId).length;
  }

  function getVisibleContent(context, coordinate) {
    if (!coordinate || !solar?.resolveVisibleContent) return null;
    return solar.resolveVisibleContent(coordinate.x, coordinate.y, context.solarState)?.content || null;
  }

  function isAsteroidContent(content) {
    return content?.kind === solar?.layout?.CONTENT_KIND?.ASTEROID;
  }

  function isNonEarthPlanetContent(content) {
    return content?.kind === solar?.layout?.CONTENT_KIND?.PLANET && content.planetId !== "earth";
  }

  function resolveMoveGeometry(context, rocketId, deltaX, deltaY) {
    const rocket = context.rocketState.rockets.find((item) => item.id === rocketId);
    const from = rockets.getRocketSectorCoordinate(rocket);
    if (!rocket || !from) return { rocket, from: null, to: null, fromContent: null, toContent: null };
    const to = {
      x: solar.mod8(from.x + Number(deltaX || 0)),
      y: Math.min(
        rockets.SECTOR_RING_MAX,
        Math.max(rockets.SECTOR_RING_MIN, from.y + Number(deltaY || 0)),
      ),
    };
    return {
      rocket,
      from,
      to,
      fromContent: getVisibleContent(context, from),
      toContent: getVisibleContent(context, to),
    };
  }

  function getRequiredMovePoints(context, player, rocketId, deltaX, deltaY) {
    const geometry = resolveMoveGeometry(context, rocketId, deltaX, deltaY);
    const exitsAsteroid = isAsteroidContent(geometry.fromContent);
    if (exitsAsteroid && !players.playerOwnsTech(player, "orange2")) {
      return ASTEROID_EXIT_MOVE_POINTS;
    }
    return 1;
  }

  function resolveProvidedMovePoints(options, cost) {
    if (Number.isFinite(Number(options.movementPoints))) {
      return Math.max(0, Math.round(Number(options.movementPoints)));
    }
    if (Number.isFinite(Number(cost?.energy)) && Number(cost.energy) > 0) {
      return Math.round(Number(cost.energy));
    }
    return 1;
  }

  function launchProbe(context, options = {}) {
    const currentPlayer = players.getCurrentPlayer(context.playerState);
    if (!currentPlayer) {
      return { ok: false, abilityId: "launchProbe", message: "没有当前玩家" };
    }

    const cost = resolveCost(options, DEFAULT_LAUNCH_COST);
    const rocketLimit = getRocketLimitForPlayer(currentPlayer);
    const activeRocketCount = getActiveRocketCountForPlayer(context.rocketState, currentPlayer.id);
    if (activeRocketCount >= rocketLimit) {
      return {
        ok: false,
        abilityId: "launchProbe",
        message: `火箭数量已达上限（${activeRocketCount}/${rocketLimit}）`,
      };
    }

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
      undoable: true,
      commands,
      cost,
      payload: {
        rocket: launchResult.rocket,
      },
      events: [],
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

    const requiredMovePoints = getRequiredMovePoints(context, currentPlayer, rocketId, deltaX, deltaY);
    const providedMovePoints = resolveProvidedMovePoints(options, cost);
    if (providedMovePoints < requiredMovePoints) {
      return {
        ok: false,
        abilityId: "moveProbe",
        message: `移动力不足，需要 ${requiredMovePoints} 点移动力`,
      };
    }

    const geometry = resolveMoveGeometry(context, rocketId, deltaX, deltaY);
    const beforeRocket = structuredClone(
      context.rocketState.rockets.find((rocket) => rocket.id === rocketId),
    );
    const beforePlayer = structuredClone(currentPlayer);
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
    if (beforeRocket) {
      commands.push(historyCommands.createMoveRocketCommand(
        context.rocketState,
        rocketId,
        beforeRocket,
      ));
    }
    const rewardNotes = [];
    const events = [];
    if (isNonEarthPlanetContent(geometry.toContent)) {
      players.gainResources(currentPlayer, { publicity: 1 });
      rewardNotes.push("移动到行星，宣传+1");
      events.push({
        type: "visitPlanet",
        planetId: geometry.toContent.planetId,
        rocketId,
        playerId: currentPlayer.id,
      });
    }
    if (isAsteroidContent(geometry.toContent) && players.playerOwnsTech(currentPlayer, "orange2")) {
      players.gainResources(currentPlayer, { publicity: 1 });
      rewardNotes.push("橙色2：进入小行星，宣传+1");
    }
    if (isAsteroidContent(geometry.toContent)) {
      events.push({
        type: "visitAsteroid",
        rocketId,
        playerId: currentPlayer.id,
      });
    }
    commands.push(historyCommands.createRestorePlayerCommand(
      currentPlayer,
      beforePlayer,
      "恢复移动前玩家状态",
    ));

    const costText = hasCost(cost) ? `，消耗 ${players.formatResourceCost(cost)}` : "";
    const movePointText = requiredMovePoints > 1 ? `，需要 ${requiredMovePoints} 点移动力` : "";
    const rewardText = rewardNotes.length ? `，${rewardNotes.join("，")}` : "";
    const message = `${moveResult.message}${costText}${movePointText}${rewardText}`;
    context.rocketState.statusNote = message;

    return {
      ok: true,
      abilityId: "moveProbe",
      message,
      undoable: true,
      commands,
      cost,
      payload: {
        rocket: moveResult.rocket,
        rocketId,
        deltaX,
        deltaY,
        requiredMovePoints,
        providedMovePoints,
        rewards: rewardNotes,
      },
      events,
      rocket: moveResult.rocket,
    };
  }

  return Object.freeze({
    DEFAULT_LAUNCH_COST,
    DEFAULT_MOVE_COST,
    BASE_ROCKET_LIMIT,
    ORANGE1_ROCKET_LIMIT,
    ASTEROID_EXIT_MOVE_POINTS,
    getRocketLimitForPlayer,
    getRequiredMovePoints,
    launchProbe,
    moveProbe,
  });
});
