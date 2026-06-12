(function (root, factory) {
  "use strict";

  let players = root.SetiPlayers;
  let rockets = root.SetiRocketActions;

  if ((!players || !rockets) && typeof require === "function") {
    players = players || require("../players");
    rockets = rockets || require("../rockets");
  }

  const api = factory(players, rockets);

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.SetiActionLaunch = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function (players, rockets) {
  "use strict";

  const ACTION_ID = "launch";
  const ACTION_LABEL = "发射";
  const CREDIT_COST = 2;
  const BASE_ROCKET_LIMIT = 1;
  const ORANGE1_ROCKET_LIMIT = 2;

  function getRocketLimitForPlayer(player) {
    return players.playerOwnsTech(player, "orange1") ? ORANGE1_ROCKET_LIMIT : BASE_ROCKET_LIMIT;
  }

  function canExecute(context) {
    const currentPlayer = players.getCurrentPlayer(context.playerState);
    if (!currentPlayer) return { ok: false, message: "没有当前玩家" };
    const rocketLimit = getRocketLimitForPlayer(currentPlayer);
    const activeRocketCount = rockets.getRocketsForPlayer(context.rocketState, currentPlayer.id).length;
    if (activeRocketCount >= rocketLimit) {
      return { ok: false, message: `火箭数量已达上限（${activeRocketCount}/${rocketLimit}）` };
    }
    if (!players.canAfford(currentPlayer, { credits: CREDIT_COST })) {
      return { ok: false, message: `信用点不足，发射需要 ${CREDIT_COST} 信用点` };
    }
    return { ok: true, message: null };
  }

  function execute(context) {
    const check = canExecute(context);
    if (!check.ok) {
      context.rocketState.statusNote = check.message;
      return { ok: false, actionId: ACTION_ID, message: check.message };
    }

    const currentPlayer = players.getCurrentPlayer(context.playerState);
    const earthSector = context.getEarthSectorCoordinate();
    const launchResult = rockets.launchRocketAtSector(context.rocketState, earthSector, {
      playerId: currentPlayer.id,
      color: currentPlayer.color,
    });

    if (!launchResult.ok) {
      return {
        ok: false,
        actionId: ACTION_ID,
        message: launchResult.message,
      };
    }

    const spendResult = players.spendResources(currentPlayer, { credits: CREDIT_COST });
    if (!spendResult.ok) {
      rockets.removeRocket(context.rocketState, launchResult.rocket.id);
      context.rocketState.statusNote = spendResult.message;
      return {
        ok: false,
        actionId: ACTION_ID,
        message: spendResult.message,
      };
    }

    const message = `${launchResult.message}，消耗 ${CREDIT_COST} 信用点`;
    context.rocketState.statusNote = message;
    return {
      ok: true,
      actionId: ACTION_ID,
      message,
      rocket: launchResult.rocket,
      cost: { credits: CREDIT_COST },
    };
  }

  return Object.freeze({
    id: ACTION_ID,
    label: ACTION_LABEL,
    creditCost: CREDIT_COST,
    canExecute,
    execute,
  });
});
