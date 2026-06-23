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

  function getRequestedRocketId(options = {}) {
    const rocketId = Number(options.rocketId ?? options.target?.rocketId);
    return Number.isInteger(rocketId) ? rocketId : null;
  }

  function getPlacementList(context, options = {}) {
    const rocketId = getRequestedRocketId(options);
    const placements = typeof shared.listPlayerRocketPlanetPlacements === "function"
      ? shared.listPlayerRocketPlanetPlacements(context, { rocketId })
      : [];
    if (placements.length) return { ok: true, placements };
    const placement = shared.getRocketPlanet(context, rocketId == null ? undefined : { rocketId });
    if (!placement.ok) return { ok: false, message: placement.message, placements: [] };
    return { ok: true, placements: [placement] };
  }

  function canAddOrbitForPlacement(context, placement) {
    const isAomomoPlanet = placement.planet.planetId === aomomo?.PLANET_ID;
    return isAomomoPlanet
      ? Boolean(aomomo?.canAddOrbitMarker?.(context.alienGameState))
      : planetStats.canAddOrbitMarker(context.planetStatsState, placement.planet.planetId);
  }

  function buildOrbitChoice(placement) {
    return {
      rocketId: placement.rocket.id,
      planetId: placement.planet.planetId,
      planet: placement.planet,
      label: `环绕${placement.planet.name}（R${placement.rocket.id}）`,
    };
  }

  function getOrbitOptions(context, options = {}) {
    const placementResult = getPlacementList(context, options);
    if (!placementResult.ok) return { ok: false, message: placementResult.message };

    const currentPlayer = placementResult.placements[0]?.currentPlayer;
    if (!players.canAfford(currentPlayer, { credits: CREDIT_COST, energy: ENERGY_COST })) {
      return {
        ok: false,
        message: `资源不足，环绕需要 ${CREDIT_COST} 信用点 + ${ENERGY_COST} 能量`,
      };
    }

    const choices = placementResult.placements
      .filter((placement) => canAddOrbitForPlacement(context, placement))
      .map(buildOrbitChoice);
    if (!choices.length) {
      const [placement] = placementResult.placements;
      return {
        ok: false,
        message: placement ? `${placement.planet.name} 环绕槽位已满` : "当前没有可环绕的行星火箭",
      };
    }

    return {
      ok: true,
      message: null,
      planet: choices[0].planet,
      choices,
      needsChoice: choices.length > 1,
      defaultRocketId: choices[0].rocketId,
    };
  }

  function canExecute(context) {
    return getOrbitOptions(context);
  }

  function execute(context, options = {}) {
    const check = getOrbitOptions(context, options);
    if (!check.ok) {
      context.rocketState.statusNote = check.message;
      return { ok: false, actionId: ACTION_ID, message: check.message };
    }

    const rocketId = getRequestedRocketId(options) ?? check.defaultRocketId;
    const placement = shared.getRocketPlanet(context, { rocketId });
    if (!placement.ok) {
      context.rocketState.statusNote = placement.message;
      return { ok: false, actionId: ACTION_ID, message: placement.message };
    }
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
    getOrbitOptions,
    canExecute,
    execute,
  });
});
