(function (root, factory) {
  "use strict";

  let players = root.SetiPlayers;
  let planetStats = root.SetiPlanetStats;
  let shared = root.SetiActionShared;
  let historyCommands = root.SetiHistoryCommands;

  if ((!players || !planetStats || !shared || !historyCommands) && typeof require === "function") {
    players = players || require("../players");
    planetStats = planetStats || require("../planet-stats");
    shared = shared || require("../actions/shared");
    historyCommands = historyCommands || require("../history/commands");
  }

  const api = factory(players, planetStats, shared, historyCommands);

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.SetiAbilityPlanet = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function (
  players,
  planetStats,
  shared,
  historyCommands,
) {
  "use strict";

  const DEFAULT_ORBIT_COST = Object.freeze({ credits: 1, energy: 1 });
  const BASE_LAND_ENERGY_COST = 3;

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

  function buildCommands(context, player, snapshots) {
    const commands = [];
    commands.push(historyCommands.createRestoreRocketStateCommand(
      context.rocketState,
      snapshots.rocketState,
      "恢复火箭状态",
    ));
    commands.push(historyCommands.createRestorePlanetStatsCommand(
      context.planetStatsState,
      snapshots.planetStatsState,
      "恢复星球标记",
    ));
    commands.push(historyCommands.createRestorePlayerCommand(
      player,
      snapshots.player,
      "恢复玩家状态",
    ));
    return commands;
  }

  function getLandEnergyCost(context, planetId) {
    const hasOrbit = planetStats.getPlanetOrbitCount(context.planetStatsState, planetId) > 0;
    return hasOrbit ? BASE_LAND_ENERGY_COST - 1 : BASE_LAND_ENERGY_COST;
  }

  function normalizeLandTarget(target) {
    if (!target || target.type === "planet") return { type: "planet" };
    if (target.type === "satellite" && target.satelliteId) {
      return { type: "satellite", satelliteId: target.satelliteId };
    }
    return null;
  }

  function getLandOptions(context) {
    const placement = shared.getRocketPlanet(context);
    if (!placement.ok) return { ok: false, message: placement.message };

    const planetId = placement.planet.planetId;
    const choices = [];
    if (planetStats.canAddLandingMarker(context.planetStatsState, planetId)) {
      choices.push({
        target: { type: "planet" },
        label: `登陆${placement.planet.name}（主星）`,
      });
    }
    for (const satellite of planetStats.getAvailableSatellitesForLanding(context.planetStatsState, planetId)) {
      choices.push({
        target: { type: "satellite", satelliteId: satellite.satelliteId },
        label: `登陆${satellite.satelliteName}`,
      });
    }
    if (!choices.length) return { ok: false, message: `${placement.planet.name} 无可用登陆目标` };
    return {
      ok: true,
      planet: placement.planet,
      choices,
      needsChoice: choices.length > 1,
      defaultTarget: choices[0].target,
      energyCost: getLandEnergyCost(context, planetId),
    };
  }

  function orbitProbe(context, options = {}) {
    const placement = shared.getRocketPlanet(context);
    if (!placement.ok) return { ok: false, abilityId: "orbitProbe", message: placement.message };

    const currentPlayer = placement.currentPlayer;
    const cost = resolveCost(options, DEFAULT_ORBIT_COST);
    if (hasCost(cost) && !players.canAfford(currentPlayer, cost)) {
      return {
        ok: false,
        abilityId: "orbitProbe",
        message: `资源不足，需要 ${players.formatResourceCost(cost)}`,
      };
    }
    if (!planetStats.canAddOrbitMarker(context.planetStatsState, placement.planet.planetId)) {
      return { ok: false, abilityId: "orbitProbe", message: `${placement.planet.name} 环绕槽位已满` };
    }

    const snapshots = {
      player: structuredClone(currentPlayer),
      rocketState: structuredClone(context.rocketState),
      planetStatsState: structuredClone(context.planetStatsState),
    };

    if (hasCost(cost)) {
      const spend = players.spendResources(currentPlayer, cost);
      if (!spend.ok) return { ok: false, abilityId: "orbitProbe", message: spend.message };
    }

    const removed = shared.removeRocketFromState(context, placement.rocket.id);
    if (!removed.ok) {
      Object.assign(context.rocketState, snapshots.rocketState);
      Object.assign(currentPlayer, snapshots.player);
      return { ok: false, abilityId: "orbitProbe", message: removed.message };
    }

    const markerResult = planetStats.addPlanetOrbitMarker(
      context.planetStatsState,
      placement.planet.planetId,
      currentPlayer,
    );
    if (!markerResult.ok) {
      Object.assign(context.rocketState, snapshots.rocketState);
      Object.assign(context.planetStatsState, snapshots.planetStatsState);
      Object.assign(currentPlayer, snapshots.player);
      return { ok: false, abilityId: "orbitProbe", message: markerResult.message };
    }

    players.incrementPlayerOrbitCount(context.playerState, currentPlayer.id);

    const message = `环绕 ${placement.planet.name}，消耗 ${players.formatResourceCost(cost)}，移除火箭，显示环绕标记#${markerResult.marker.sequence}`;
    context.rocketState.statusNote = message;
    return {
      ok: true,
      abilityId: "orbitProbe",
      message,
      undoable: true,
      commands: buildCommands(context, currentPlayer, snapshots),
      cost,
      payload: {
        removedRocketId: placement.rocket.id,
        planetId: placement.planet.planetId,
        markerKind: "orbit",
        markerSequence: markerResult.marker.sequence,
      },
      events: [],
      removedRocketId: placement.rocket.id,
      planetId: placement.planet.planetId,
      markerKind: "orbit",
      markerSequence: markerResult.marker.sequence,
    };
  }

  function landProbe(context, options = {}) {
    const landOptions = getLandOptions(context);
    if (!landOptions.ok) return { ok: false, abilityId: "landProbe", message: landOptions.message };

    const placement = shared.getRocketPlanet(context);
    const currentPlayer = placement.currentPlayer;
    const target = normalizeLandTarget(options.target || landOptions.defaultTarget);
    if (!target) return { ok: false, abilityId: "landProbe", message: "未选择有效的登陆目标" };

    const cost = resolveCost(options, { energy: landOptions.energyCost });
    if (hasCost(cost) && !players.canAfford(currentPlayer, cost)) {
      return {
        ok: false,
        abilityId: "landProbe",
        message: `资源不足，需要 ${players.formatResourceCost(cost)}`,
      };
    }

    const planetId = placement.planet.planetId;
    if (target.type === "planet" && !planetStats.canAddLandingMarker(context.planetStatsState, planetId)) {
      return { ok: false, abilityId: "landProbe", message: `${placement.planet.name} 主星登陆槽位已满` };
    }
    if (target.type === "satellite" && !planetStats.canLandOnSatellite(context.planetStatsState, planetId, target.satelliteId)) {
      return { ok: false, abilityId: "landProbe", message: `${placement.planet.name} 的该卫星不可登陆` };
    }

    const snapshots = {
      player: structuredClone(currentPlayer),
      rocketState: structuredClone(context.rocketState),
      planetStatsState: structuredClone(context.planetStatsState),
    };

    if (hasCost(cost)) {
      const spend = players.spendResources(currentPlayer, cost);
      if (!spend.ok) return { ok: false, abilityId: "landProbe", message: spend.message };
    }

    const removed = shared.removeRocketFromState(context, placement.rocket.id);
    if (!removed.ok) {
      Object.assign(context.rocketState, snapshots.rocketState);
      Object.assign(currentPlayer, snapshots.player);
      return { ok: false, abilityId: "landProbe", message: removed.message };
    }

    let markerResult;
    let markerKind;
    let markerSequence = null;
    let satelliteId = null;
    let targetLabel = placement.planet.name;

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
    } else {
      markerResult = planetStats.addPlanetLandingMarker(context.planetStatsState, planetId, currentPlayer);
      markerKind = "land";
      markerSequence = markerResult.marker?.sequence || null;
    }

    if (!markerResult.ok) {
      Object.assign(context.rocketState, snapshots.rocketState);
      Object.assign(context.planetStatsState, snapshots.planetStatsState);
      Object.assign(currentPlayer, snapshots.player);
      return { ok: false, abilityId: "landProbe", message: markerResult.message };
    }

    const discountNote = cost.energy < BASE_LAND_ENERGY_COST ? "（有环绕，消耗-1）" : "";
    const markerNote = markerKind === "satellite"
      ? `显示卫星登陆标记 ${targetLabel}`
      : `显示登陆标记#${markerSequence}`;
    const message = `登陆 ${targetLabel}，消耗 ${players.formatResourceCost(cost)}${discountNote}，移除火箭，${markerNote}`;
    context.rocketState.statusNote = message;
    return {
      ok: true,
      abilityId: "landProbe",
      message,
      undoable: true,
      commands: buildCommands(context, currentPlayer, snapshots),
      cost,
      payload: {
        removedRocketId: placement.rocket.id,
        planetId,
        landTarget: target,
        markerKind,
        markerSequence,
        satelliteId,
      },
      events: [],
      removedRocketId: placement.rocket.id,
      planetId,
      landTarget: target,
      markerKind,
      markerSequence,
      satelliteId,
    };
  }

  return Object.freeze({
    DEFAULT_ORBIT_COST,
    BASE_LAND_ENERGY_COST,
    getLandEnergyCost,
    getLandOptions,
    orbitProbe,
    landProbe,
  });
});
