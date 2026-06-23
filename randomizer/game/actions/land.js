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

  root.SetiActionLand = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function (players, planetStats, shared, aomomo) {
  "use strict";

  const ACTION_ID = "land";
  const ACTION_LABEL = "登陆";
  const BASE_ENERGY_COST = 3;
  const ORANGE3_LAND_DISCOUNT = 1;

  function getEnergyCost(context, planetId) {
    const currentPlayer = players.getCurrentPlayer(context.playerState);
    const hasOrbit = planetId === aomomo?.PLANET_ID
      ? aomomo.countOrbitMarkers(context.alienGameState) > 0
      : planetStats.getPlanetOrbitCount(context.planetStatsState, planetId) > 0;
    const orbitDiscount = hasOrbit ? 1 : 0;
    const techDiscount = players.playerOwnsTech(currentPlayer, "orange3", context) ? ORANGE3_LAND_DISCOUNT : 0;
    return Math.max(0, BASE_ENERGY_COST - orbitDiscount - techDiscount);
  }

  function canLandOnSatellites(player, options = {}) {
    return players.playerOwnsTech(player, "orange4", options);
  }

  function normalizeLandTarget(target) {
    if (!target || target.type === "planet") {
      return { type: "planet" };
    }
    if (target.type === "satellite" && target.satelliteId) {
      return { type: "satellite", satelliteId: target.satelliteId };
    }
    return null;
  }

  function getRequestedRocketId(options = {}) {
    const rocketId = Number(options.rocketId ?? options.target?.rocketId);
    return Number.isInteger(rocketId) ? rocketId : null;
  }

  function targetWithRocketId(target, rocketId) {
    if (rocketId == null) return { ...target };
    return { ...target, rocketId };
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

  function buildLandChoices(context, placement, options = {}) {
    const planetId = placement.planet.planetId;
    const choices = [];
    const energyCost = getEnergyCost(context, planetId);
    const rocketLabel = placement.rocket?.id != null ? `R${placement.rocket.id}` : "火箭";

    if (planetId === aomomo?.PLANET_ID) {
      if (aomomo?.canAddLandingMarker?.(context.alienGameState)) {
        choices.push({
          target: targetWithRocketId({ type: "planet" }, placement.rocket.id),
          rocketId: placement.rocket.id,
          planetId,
          planet: placement.planet,
          energyCost,
          label: `登陆${placement.planet.name}（${rocketLabel}，${energyCost}能量）`,
        });
      }
    } else if (planetStats.canAddLandingMarker(context.planetStatsState, planetId)) {
      choices.push({
        target: targetWithRocketId({ type: "planet" }, placement.rocket.id),
        rocketId: placement.rocket.id,
        planetId,
        planet: placement.planet,
        energyCost,
        label: `登陆${placement.planet.name}（主星，${rocketLabel}，${energyCost}能量）`,
      });
    }

    if (planetId !== aomomo?.PLANET_ID && canLandOnSatellites(placement.currentPlayer, { ...context, ...options })) {
      for (const satellite of planetStats.getAvailableSatellitesForLanding(context.planetStatsState, planetId)) {
        choices.push({
          target: targetWithRocketId({ type: "satellite", satelliteId: satellite.satelliteId }, placement.rocket.id),
          rocketId: placement.rocket.id,
          planetId,
          planet: placement.planet,
          energyCost,
          label: `登陆${satellite.satelliteName}（${placement.planet.name}，${rocketLabel}，${energyCost}能量）`,
        });
      }
    }

    return choices;
  }

  function getLandOptions(context, options = {}) {
    const placementResult = getPlacementList(context, options);
    if (!placementResult.ok) return { ok: false, message: placementResult.message };

    const allChoices = placementResult.placements.flatMap((placement) => buildLandChoices(context, placement, options));
    if (!allChoices.length) {
      const [placement] = placementResult.placements;
      return {
        ok: false,
        message: placement ? `${placement.planet.name} 无可用登陆目标` : "当前没有可登陆的行星火箭",
      };
    }

    const currentPlayer = placementResult.placements[0]?.currentPlayer;
    const choices = allChoices.filter((choice) => players.canAfford(currentPlayer, { energy: choice.energyCost }));
    if (!choices.length) {
      const cheapest = allChoices.reduce((min, choice) => Math.min(min, choice.energyCost), Infinity);
      return { ok: false, message: `能量不足，登陆需要 ${Number.isFinite(cheapest) ? cheapest : BASE_ENERGY_COST} 能量` };
    }

    return {
      ok: true,
      defaultTarget: choices[0].target,
      defaultRocketId: choices[0].rocketId,
      energyCost: choices[0].energyCost,
      planet: choices.length === 1 ? choices[0].planet : { planetId: "multi-land", name: "登陆目标" },
      choices,
      needsChoice: choices.length > 1,
    };
  }

  function canExecute(context) {
    const options = getLandOptions(context);
    if (!options.ok) return { ok: false, message: options.message };
    return { ok: true, message: null, planet: options.planet, energyCost: options.energyCost, choices: options.choices };
  }

  function execute(context, options) {
    const check = getLandOptions(context, options);
    if (!check.ok) {
      context.rocketState.statusNote = check.message;
      return { ok: false, actionId: ACTION_ID, message: check.message };
    }

    const landOptions = check;
    if (!landOptions.ok) {
      context.rocketState.statusNote = landOptions.message;
      return { ok: false, actionId: ACTION_ID, message: landOptions.message };
    }

    const target = normalizeLandTarget(options?.target || landOptions.defaultTarget);
    if (!target) {
      const message = "未选择有效的登陆目标";
      context.rocketState.statusNote = message;
      return { ok: false, actionId: ACTION_ID, message };
    }

    const rocketId = getRequestedRocketId(options || {}) ?? landOptions.defaultRocketId;
    const placement = shared.getRocketPlanet(context, { rocketId });
    if (!placement.ok) {
      context.rocketState.statusNote = placement.message;
      return { ok: false, actionId: ACTION_ID, message: placement.message };
    }
    const currentPlayer = placement.currentPlayer;
    const planetId = placement.planet.planetId;
    const energyCost = getEnergyCost(context, planetId);

    const isAomomoPlanet = planetId === aomomo?.PLANET_ID;
    if (target.type === "planet" && isAomomoPlanet && !aomomo?.canAddLandingMarker?.(context.alienGameState)) {
      const message = `${placement.planet.name} 登陆槽位已满`;
      context.rocketState.statusNote = message;
      return { ok: false, actionId: ACTION_ID, message };
    }

    if (target.type === "planet" && !isAomomoPlanet && !planetStats.canAddLandingMarker(context.planetStatsState, planetId)) {
      const message = `${placement.planet.name} 主星登陆槽位已满`;
      context.rocketState.statusNote = message;
      return { ok: false, actionId: ACTION_ID, message };
    }

    if (target.type === "satellite" && !planetStats.canLandOnSatellite(context.planetStatsState, planetId, target.satelliteId)) {
      const message = `${placement.planet.name} 的该卫星不可登陆`;
      context.rocketState.statusNote = message;
      return { ok: false, actionId: ACTION_ID, message };
    }
    if (target.type === "satellite" && !canLandOnSatellites(currentPlayer, context)) {
      const message = "需要橙色4号科技才能登陆卫星";
      context.rocketState.statusNote = message;
      return { ok: false, actionId: ACTION_ID, message };
    }

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

    let markerResult;
    let markerKind;
    let markerSequence = null;
    let satelliteId = null;
    let targetLabel;

    if (target.type === "satellite") {
      markerResult = planetStats.addSatelliteLandingMarker(
        context.planetStatsState,
        planetId,
        target.satelliteId,
        currentPlayer,
      );
      markerKind = "satellite";
      satelliteId = target.satelliteId;
      targetLabel = markerResult.marker?.satelliteName || target.satelliteId;
    } else if (isAomomoPlanet) {
      markerResult = aomomo.addLandingMarker(context.alienGameState, currentPlayer);
      markerKind = "aomomo-land";
      markerSequence = markerResult.marker?.sequence || null;
      targetLabel = placement.planet.name;
    } else {
      markerResult = planetStats.addPlanetLandingMarker(
        context.planetStatsState,
        planetId,
        currentPlayer,
      );
      markerKind = "land";
      markerSequence = markerResult.marker?.sequence || null;
      targetLabel = placement.planet.name;
    }

    if (!markerResult.ok) {
      currentPlayer.resources.energy += energyCost;
      context.rocketState.statusNote = markerResult.message;
      return { ok: false, actionId: ACTION_ID, message: markerResult.message };
    }

    const discountParts = [];
    const hasOrbit = isAomomoPlanet
      ? aomomo.countOrbitMarkers(context.alienGameState) > 0
      : planetStats.getPlanetOrbitCount(context.planetStatsState, planetId) > 0;
    if (hasOrbit) discountParts.push("有环绕，消耗-1");
    if (players.playerOwnsTech(currentPlayer, "orange3", context)) discountParts.push("橙色3，消耗-1");
    const discountNote = discountParts.length ? `（${discountParts.join("；")}）` : "";
    const markerNote = markerKind === "satellite"
      ? `显示卫星登陆标记 ${targetLabel}`
      : `显示登陆标记#${markerSequence}`;
    const message = `登陆 ${targetLabel}，消耗 ${energyCost} 能量${discountNote}，移除火箭，${markerNote}`;
    context.rocketState.statusNote = message;
    return {
      ok: true,
      actionId: ACTION_ID,
      message,
      removedRocketId: placement.rocket.id,
      planetId,
      landTarget: target,
      markerKind,
      markerSequence,
      satelliteId,
      cost: { energy: energyCost },
    };
  }

  return Object.freeze({
    id: ACTION_ID,
    label: ACTION_LABEL,
    baseEnergyCost: BASE_ENERGY_COST,
    orange3LandDiscount: ORANGE3_LAND_DISCOUNT,
    getEnergyCost,
    getLandOptions,
    canExecute,
    execute,
  });
});
