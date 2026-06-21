(function (root, factory) {
  "use strict";

  let players = root.SetiPlayers;
  let planetStats = root.SetiPlanetStats;
  let shared = root.SetiActionShared;
  let aomomo = root.SetiAlienAomomo;

  if ((!players || !planetStats || !shared || !aomomo) && typeof require === "function") {
    players = players || require("../players");
    planetStats = planetStats || require("../planet-stats");
    shared = shared || require("./shared");
    aomomo = aomomo || require("../aliens/aomomo");
  }

  const api = factory(players, planetStats, shared, aomomo);

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.SetiActionOrbit = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function (players, planetStats, shared, aomomo) {
  "use strict";

  const ACTION_ID = "orbit";
  const ACTION_LABEL = "环绕";
  const CREDIT_COST = 1;
  const ENERGY_COST = 1;

  function canExecute(context) {
    const placement = shared.getRocketPlanet(context);
    if (!placement.ok) return { ok: false, message: placement.message };

    const currentPlayer = placement.currentPlayer;
    if (!players.canAfford(currentPlayer, { credits: CREDIT_COST, energy: ENERGY_COST })) {
      return {
        ok: false,
        message: `资源不足，环绕需要 ${CREDIT_COST} 信用点 + ${ENERGY_COST} 能量`,
      };
    }

    const isAomomoPlanet = placement.planet.planetId === aomomo?.PLANET_ID;
    if (isAomomoPlanet ? !aomomo?.canAddOrbitMarker?.(context.alienGameState) : !planetStats.canAddOrbitMarker(context.planetStatsState, placement.planet.planetId)) {
      return {
        ok: false,
        message: `${placement.planet.name} 环绕槽位已满`,
      };
    }

    return { ok: true, message: null, planet: placement.planet };
  }

  function execute(context) {
    const check = canExecute(context);
    if (!check.ok) {
      context.rocketState.statusNote = check.message;
      return { ok: false, actionId: ACTION_ID, message: check.message };
    }

    const placement = shared.getRocketPlanet(context);
    const currentPlayer = placement.currentPlayer;
    const spendResult = players.spendResources(currentPlayer, {
      credits: CREDIT_COST,
      energy: ENERGY_COST,
    });
    if (!spendResult.ok) {
      context.rocketState.statusNote = spendResult.message;
      return { ok: false, actionId: ACTION_ID, message: spendResult.message };
    }

    const removed = shared.removeRocketFromState(context, placement.rocket.id);
    if (!removed.ok) {
      currentPlayer.resources.credits += CREDIT_COST;
      currentPlayer.resources.energy += ENERGY_COST;
      return { ok: false, actionId: ACTION_ID, message: removed.message };
    }

    const isAomomoPlanet = placement.planet.planetId === aomomo?.PLANET_ID;
    const markerResult = isAomomoPlanet
      ? aomomo.addOrbitMarker(context.alienGameState, currentPlayer)
      : planetStats.addPlanetOrbitMarker(
        context.planetStatsState,
        placement.planet.planetId,
        currentPlayer,
      );
    if (!markerResult.ok) {
      currentPlayer.resources.credits += CREDIT_COST;
      currentPlayer.resources.energy += ENERGY_COST;
      context.rocketState.statusNote = markerResult.message;
      return { ok: false, actionId: ACTION_ID, message: markerResult.message };
    }

    players.incrementPlayerOrbitCount(context.playerState, currentPlayer.id);

    const message = `环绕 ${placement.planet.name}，消耗 ${CREDIT_COST} 信用点 + ${ENERGY_COST} 能量，移除火箭，显示环绕标记#${markerResult.marker.sequence}`;
    context.rocketState.statusNote = message;
    return {
      ok: true,
      actionId: ACTION_ID,
      message,
      removedRocketId: placement.rocket.id,
      planetId: placement.planet.planetId,
      markerKind: isAomomoPlanet ? "aomomo-orbit" : "orbit",
      markerSequence: markerResult.marker.sequence,
      cost: { credits: CREDIT_COST, energy: ENERGY_COST },
    };
  }

  return Object.freeze({
    id: ACTION_ID,
    label: ACTION_LABEL,
    creditCost: CREDIT_COST,
    energyCost: ENERGY_COST,
    canExecute,
    execute,
  });
});
