(function (root, factory) {
  "use strict";

  let players = root.SetiPlayers;
  let planetStats = root.SetiPlanetStats;
  let shared = root.SetiActionShared;

  if ((!players || !planetStats || !shared) && typeof require === "function") {
    players = players || require("../players");
    planetStats = planetStats || require("../planet-stats");
    shared = shared || require("./shared");
  }

  const api = factory(players, planetStats, shared);

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.SetiActionLand = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function (players, planetStats, shared) {
  "use strict";

  const ACTION_ID = "land";
  const ACTION_LABEL = "登陆";
  const BASE_ENERGY_COST = 3;

  function getEnergyCost(context, planetId) {
    const hasOrbit = planetStats.getPlanetOrbitCount(context.planetStatsState, planetId) > 0;
    return hasOrbit ? BASE_ENERGY_COST - 1 : BASE_ENERGY_COST;
  }

  function canExecute(context) {
    const placement = shared.getRocketPlanet(context);
    if (!placement.ok) return { ok: false, message: placement.message };

    const energyCost = getEnergyCost(context, placement.planet.planetId);
    const currentPlayer = placement.currentPlayer;
    if (!players.canAfford(currentPlayer, { energy: energyCost })) {
      return {
        ok: false,
        message: `能量不足，登陆需要 ${energyCost} 能量`,
      };
    }

    return { ok: true, message: null, planet: placement.planet, energyCost };
  }

  function execute(context) {
    const check = canExecute(context);
    if (!check.ok) {
      context.rocketState.statusNote = check.message;
      return { ok: false, actionId: ACTION_ID, message: check.message };
    }

    const placement = shared.getRocketPlanet(context);
    const currentPlayer = placement.currentPlayer;
    const energyCost = check.energyCost;
    const spendResult = players.spendResources(currentPlayer, { energy: energyCost });
    if (!spendResult.ok) {
      context.rocketState.statusNote = spendResult.message;
      return { ok: false, actionId: ACTION_ID, message: spendResult.message };
    }

    const removed = shared.removeRocketFromState(context, placement.rocket.id);
    if (!removed.ok) {
      currentPlayer.resources.energy += energyCost;
      return { ok: false, actionId: ACTION_ID, message: removed.message };
    }

    planetStats.incrementPlanetLandings(context.planetStatsState, placement.planet.planetId);

    const discountNote = energyCost < BASE_ENERGY_COST ? "（有环绕，消耗-1）" : "";
    const message = `登陆 ${placement.planet.name}，消耗 ${energyCost} 能量${discountNote}，移除 R${placement.rocket.id}`;
    context.rocketState.statusNote = message;
    return {
      ok: true,
      actionId: ACTION_ID,
      message,
      removedRocketId: placement.rocket.id,
      planetId: placement.planet.planetId,
      cost: { energy: energyCost },
    };
  }

  return Object.freeze({
    id: ACTION_ID,
    label: ACTION_LABEL,
    baseEnergyCost: BASE_ENERGY_COST,
    getEnergyCost,
    canExecute,
    execute,
  });
});
