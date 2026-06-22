(function (root, factory) {
  "use strict";

  let players = root.SetiPlayers;
  let rockets = root.SetiRocketActions;
  let industryPassives = root.SetiIndustryPassives;

  if ((!players || !rockets) && typeof require === "function") {
    players = players || require("../players");
    rockets = rockets || require("../rockets");
    industryPassives = industryPassives || require("../industry/passives");
  }

  const api = factory(players, rockets, industryPassives);

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.SetiActionLaunch = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function (players, rockets, industryPassives) {
  "use strict";

  const ACTION_ID = "launch";
  const ACTION_LABEL = "发射";
  const CREDIT_COST = 2;
  const BASE_ROCKET_LIMIT = 1;
  const ORANGE1_ROCKET_LIMIT = 2;

  function getIndustryPassives() {
    return industryPassives || (typeof globalThis !== "undefined" ? globalThis.SetiIndustryPassives : null);
  }

  function getLaunchCostForPlayer(player) {
    return getIndustryPassives()?.getStandardLaunchCost?.(player, { credits: CREDIT_COST }) || { credits: CREDIT_COST };
  }

  function formatLaunchCostMessage(cost) {
    const keys = Object.keys(cost || {}).filter((key) => Number(cost[key]) > 0);
    if (keys.length === 1 && keys[0] === "credits") {
      return `信用点不足，发射需要 ${cost.credits} 信用点`;
    }
    return `资源不足，发射需要 ${players.formatResourceCost(cost)}`;
  }

  function getRocketLimitForPlayer(player, options = {}) {
    const baseLimit = players.playerOwnsTech(player, "orange1", options) ? ORANGE1_ROCKET_LIMIT : BASE_ROCKET_LIMIT;
    const bonus = getIndustryPassives()?.getRocketLimitBonus?.(player) || 0;
    return baseLimit + bonus;
  }

  function canExecute(context) {
    const currentPlayer = players.getCurrentPlayer(context.playerState);
    if (!currentPlayer) return { ok: false, message: "没有当前玩家" };
    const rocketLimit = getRocketLimitForPlayer(currentPlayer, context);
    const activeRocketCount = rockets.getRocketsForPlayer(context.rocketState, currentPlayer.id).length;
    if (activeRocketCount >= rocketLimit) {
      return { ok: false, message: `火箭数量已达上限（${activeRocketCount}/${rocketLimit}）` };
    }
    const cost = getLaunchCostForPlayer(currentPlayer);
    if (!players.canAfford(currentPlayer, cost)) {
      return { ok: false, message: formatLaunchCostMessage(cost) };
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
    const cost = getLaunchCostForPlayer(currentPlayer);
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

    const spendResult = players.spendResources(currentPlayer, cost);
    if (!spendResult.ok) {
      rockets.removeRocket(context.rocketState, launchResult.rocket.id);
      context.rocketState.statusNote = spendResult.message;
      return {
        ok: false,
        actionId: ACTION_ID,
        message: spendResult.message,
      };
    }

    const message = `${launchResult.message}，消耗 ${players.formatResourceCost(cost)}`;
    context.rocketState.statusNote = message;
    return {
      ok: true,
      actionId: ACTION_ID,
      message,
      rocket: launchResult.rocket,
      cost,
    };
  }

  return Object.freeze({
    id: ACTION_ID,
    label: ACTION_LABEL,
    creditCost: CREDIT_COST,
    getLaunchCostForPlayer,
    canExecute,
    execute,
  });
});
