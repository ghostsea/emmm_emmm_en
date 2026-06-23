(function (root, factory) {
  "use strict";

  let players = root.SetiPlayers;
  let planetStats = root.SetiPlanetStats;
  let shared = root.SetiActionShared;
  let historyCommands = root.SetiHistoryCommands;
  let aomomo = root.SetiAlienAomomo;

  if ((!players || !planetStats || !shared || !historyCommands || !aomomo) && typeof require === "function") {
    players = players || require("../players");
    planetStats = planetStats || require("../planet-stats");
    shared = shared || require("../actions/shared");
    historyCommands = historyCommands || require("../history/commands");
    aomomo = aomomo || require("../aliens/aomomo");
  }

  const api = factory(players, planetStats, shared, historyCommands, aomomo);

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.SetiAbilityPlanet = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function (
  players,
  planetStats,
  shared,
  historyCommands,
  aomomo,
) {
  "use strict";

  const DEFAULT_ORBIT_COST = Object.freeze({ credits: 1, energy: 1 });
  const BASE_LAND_ENERGY_COST = 3;
  const ORANGE3_LAND_DISCOUNT = 1;

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
    if (context.alienGameState && snapshots.alienGameState) {
      commands.push(historyCommands.createRestoreObjectCommand(
        context.alienGameState,
        snapshots.alienGameState,
        "恢复外星人面板标记",
      ));
    }
    return commands;
  }

  function getLandEnergyCost(context, planetId) {
    const currentPlayer = players.getCurrentPlayer(context.playerState);
    const hasOrbit = planetId === aomomo?.PLANET_ID
      ? aomomo.countOrbitMarkers(context.alienGameState) > 0
      : planetStats.getPlanetOrbitCount(context.planetStatsState, planetId) > 0;
    const orbitDiscount = hasOrbit ? 1 : 0;
    const techDiscount = players.playerOwnsTech(currentPlayer, "orange3", context) ? ORANGE3_LAND_DISCOUNT : 0;
    return Math.max(0, BASE_LAND_ENERGY_COST - orbitDiscount - techDiscount);
  }

  function canLandOnSatellites(player, options = {}) {
    return Boolean(options.allowSatelliteWithoutTech) || players.playerOwnsTech(player, "orange4", options);
  }

  function normalizeLandTarget(target) {
    if (!target || target.type === "planet") return { type: "planet" };
    if (target.type === "satellite" && target.satelliteId) {
      return { type: "satellite", satelliteId: target.satelliteId };
    }
    return null;
  }

  function getRequestedRocketId(options = {}) {
    const raw = options.rocketId ?? options.target?.rocketId;
    const rocketId = Number(raw);
    return Number.isInteger(rocketId) ? rocketId : null;
  }

  function targetWithRocketId(target, rocketId) {
    if (rocketId == null) return { ...target };
    return { ...target, rocketId };
  }

  function formatRocketChoicePart(placement) {
    return placement?.rocket?.id != null ? `R${placement.rocket.id}` : "火箭";
  }

  function getPlacementList(context, options = {}) {
    const rocketId = getRequestedRocketId(options);
    const placements = typeof shared.listPlayerRocketPlanetPlacements === "function"
      ? shared.listPlayerRocketPlanetPlacements(context, {
        rocketId,
        preferredRocketId: options.preferredRocketId,
      })
      : [];
    if (placements.length) return { ok: true, placements };

    const placement = shared.getRocketPlanet(context, rocketId == null ? undefined : { rocketId });
    if (!placement.ok) return { ok: false, message: placement.message, placements: [] };
    return { ok: true, placements: [placement] };
  }

  function getActionCostLabel(cost) {
    return players.formatResourceCost(cost) || "0";
  }

  function canAddOrbitForPlacement(context, placement) {
    const planetId = placement.planet.planetId;
    return planetId === aomomo?.PLANET_ID
      ? Boolean(aomomo?.canAddOrbitMarker?.(context.alienGameState))
      : planetStats.canAddOrbitMarker(context.planetStatsState, planetId);
  }

  function buildOrbitChoice(placement, cost) {
    return {
      rocketId: placement.rocket.id,
      planetId: placement.planet.planetId,
      planet: placement.planet,
      cost: { ...cost },
      label: `环绕${placement.planet.name}（${formatRocketChoicePart(placement)}，${getActionCostLabel(cost)}）`,
    };
  }

  function getOrbitOptions(context, options = {}) {
    const placementResult = getPlacementList(context, options);
    if (!placementResult.ok) return { ok: false, message: placementResult.message };

    const cost = resolveCost(options, DEFAULT_ORBIT_COST);
    const currentPlayer = placementResult.placements[0]?.currentPlayer;
    if (hasCost(cost) && !players.canAfford(currentPlayer, cost)) {
      return {
        ok: false,
        message: `资源不足，需要 ${players.formatResourceCost(cost)}`,
      };
    }

    const choices = placementResult.placements
      .filter((placement) => canAddOrbitForPlacement(context, placement))
      .map((placement) => buildOrbitChoice(placement, cost));
    if (!choices.length) {
      const [placement] = placementResult.placements;
      return {
        ok: false,
        message: placement
          ? `${placement.planet.name} 环绕槽位已满`
          : "当前没有可环绕的行星火箭",
      };
    }

    return {
      ok: true,
      planet: choices.length === 1
        ? choices[0].planet
        : { planetId: "multi-orbit", name: "环绕目标" },
      choices,
      needsChoice: choices.length > 1,
      defaultRocketId: choices[0].rocketId,
      cost,
    };
  }

  function buildLandChoicesForPlacement(context, placement, options = {}) {
    const planetId = placement.planet.planetId;
    const choices = [];
    const energyCost = getLandEnergyCost(context, planetId);
    const cost = resolveCost(options, { energy: energyCost });
    const costLabel = getActionCostLabel(cost);
    const rocketPart = formatRocketChoicePart(placement);

    if (planetId === aomomo?.PLANET_ID) {
      if (aomomo?.canAddLandingMarker?.(context.alienGameState)) {
        choices.push({
          target: targetWithRocketId({ type: "planet" }, placement.rocket.id),
          rocketId: placement.rocket.id,
          planetId,
          planet: placement.planet,
          energyCost,
          cost,
          label: `登陆${placement.planet.name}（${rocketPart}，${costLabel}）`,
        });
      }
      return choices;
    }
    if (options.allowDuplicateLanding || planetStats.canAddLandingMarker(context.planetStatsState, planetId)) {
      choices.push({
        target: targetWithRocketId({ type: "planet" }, placement.rocket.id),
        rocketId: placement.rocket.id,
        planetId,
        planet: placement.planet,
        energyCost,
        cost,
        label: options.allowDuplicateLanding
          ? `登陆${placement.planet.name}（主星，可重复，${rocketPart}，${costLabel}）`
          : `登陆${placement.planet.name}（主星，${rocketPart}，${costLabel}）`,
      });
    }
    if (canLandOnSatellites(placement.currentPlayer, { ...options, turnState: context.turnState, roundNumber: context.roundNumber, turnNumber: context.turnNumber })) {
      for (const satellite of planetStats.getAvailableSatellitesForLanding(context.planetStatsState, planetId)) {
        choices.push({
          target: targetWithRocketId({ type: "satellite", satelliteId: satellite.satelliteId }, placement.rocket.id),
          rocketId: placement.rocket.id,
          planetId,
          planet: placement.planet,
          energyCost,
          cost,
          label: `登陆${satellite.satelliteName}（${placement.planet.name}，${rocketPart}，${costLabel}）`,
        });
      }
    }
    return choices;
  }

  function getLandOptions(context, options = {}) {
    const placementResult = getPlacementList(context, options);
    if (!placementResult.ok) return { ok: false, message: placementResult.message };

    const allChoices = placementResult.placements.flatMap((placement) => (
      buildLandChoicesForPlacement(context, placement, options)
    ));
    if (!allChoices.length) {
      const [placement] = placementResult.placements;
      return {
        ok: false,
        message: placement
          ? `${placement.planet.name} 无可用登陆目标`
          : "当前没有可登陆的行星火箭",
      };
    }
    const currentPlayer = placementResult.placements[0]?.currentPlayer;
    const choices = allChoices.filter((choice) => !hasCost(choice.cost) || players.canAfford(currentPlayer, choice.cost));
    if (!choices.length) {
      const cheapest = allChoices
        .map((choice) => choice.cost || {})
        .sort((left, right) => (
          Object.values(left).reduce((sum, value) => sum + Number(value || 0), 0)
          - Object.values(right).reduce((sum, value) => sum + Number(value || 0), 0)
        ))[0] || {};
      return {
        ok: false,
        message: `资源不足，需要 ${players.formatResourceCost(cheapest)}`,
      };
    }
    return {
      ok: true,
      planet: choices.length === 1
        ? choices[0].planet
        : { planetId: "multi-land", name: "登陆目标" },
      choices,
      needsChoice: choices.length > 1,
      defaultTarget: choices[0].target,
      defaultRocketId: choices[0].rocketId,
      energyCost: choices[0].energyCost,
      cost: { ...(choices[0].cost || {}) },
    };
  }

  function orbitProbe(context, options = {}) {
    const orbitOptions = getOrbitOptions(context, options);
    if (!orbitOptions.ok) return { ok: false, abilityId: "orbitProbe", message: orbitOptions.message };

    const rocketId = getRequestedRocketId(options) ?? orbitOptions.defaultRocketId;
    const placement = shared.getRocketPlanet(context, { rocketId });
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
    const isAomomoPlanet = placement.planet.planetId === aomomo?.PLANET_ID;
    if (isAomomoPlanet) {
      if (!aomomo?.canAddOrbitMarker?.(context.alienGameState)) {
        return { ok: false, abilityId: "orbitProbe", message: `${placement.planet.name} 环绕槽位已满` };
      }
    } else if (!planetStats.canAddOrbitMarker(context.planetStatsState, placement.planet.planetId)) {
      return { ok: false, abilityId: "orbitProbe", message: `${placement.planet.name} 环绕槽位已满` };
    }

    const snapshots = {
      player: structuredClone(currentPlayer),
      rocketState: structuredClone(context.rocketState),
      planetStatsState: structuredClone(context.planetStatsState),
      alienGameState: context.alienGameState ? structuredClone(context.alienGameState) : null,
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

    const markerResult = isAomomoPlanet
      ? aomomo.addOrbitMarker(context.alienGameState, currentPlayer)
      : planetStats.addPlanetOrbitMarker(
        context.planetStatsState,
        placement.planet.planetId,
        currentPlayer,
      );
    if (!markerResult.ok) {
      Object.assign(context.rocketState, snapshots.rocketState);
      Object.assign(context.planetStatsState, snapshots.planetStatsState);
      if (context.alienGameState && snapshots.alienGameState) Object.assign(context.alienGameState, snapshots.alienGameState);
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
        markerKind: isAomomoPlanet ? "aomomo-orbit" : "orbit",
        markerSequence: markerResult.marker.sequence,
      },
      events: [{
        type: "orbit",
        planetId: placement.planet.planetId,
        markerKind: isAomomoPlanet ? "aomomo-orbit" : "orbit",
        playerId: currentPlayer.id || null,
        playerColor: currentPlayer.color || null,
        source: options.source || "orbit",
      }],
      removedRocketId: placement.rocket.id,
      planetId: placement.planet.planetId,
      markerKind: isAomomoPlanet ? "aomomo-orbit" : "orbit",
      markerSequence: markerResult.marker.sequence,
    };
  }

  function landProbe(context, options = {}) {
    const landOptions = getLandOptions(context, options);
    if (!landOptions.ok) return { ok: false, abilityId: "landProbe", message: landOptions.message };

    const rocketId = getRequestedRocketId(options) ?? landOptions.defaultRocketId;
    const placement = shared.getRocketPlanet(context, { rocketId });
    if (!placement.ok) return { ok: false, abilityId: "landProbe", message: placement.message };
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
    const isAomomoPlanet = planetId === aomomo?.PLANET_ID;
    if (target.type === "planet" && isAomomoPlanet && !aomomo?.canAddLandingMarker?.(context.alienGameState)) {
      return { ok: false, abilityId: "landProbe", message: `${placement.planet.name} 登陆槽位已满` };
    }
    if (target.type === "planet"
      && !isAomomoPlanet
      && !options.allowDuplicateLanding
      && !planetStats.canAddLandingMarker(context.planetStatsState, planetId)) {
      return { ok: false, abilityId: "landProbe", message: `${placement.planet.name} 主星登陆槽位已满` };
    }
    if (target.type === "satellite" && !planetStats.canLandOnSatellite(context.planetStatsState, planetId, target.satelliteId)) {
      return { ok: false, abilityId: "landProbe", message: `${placement.planet.name} 的该卫星不可登陆` };
    }
    if (target.type === "satellite" && !canLandOnSatellites(currentPlayer, { ...options, turnState: context.turnState, roundNumber: context.roundNumber, turnNumber: context.turnNumber })) {
      return { ok: false, abilityId: "landProbe", message: "需要橙色4号科技才能登陆卫星" };
    }

    const snapshots = {
      player: structuredClone(currentPlayer),
      rocketState: structuredClone(context.rocketState),
      planetStatsState: structuredClone(context.planetStatsState),
      alienGameState: context.alienGameState ? structuredClone(context.alienGameState) : null,
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
    } else if (isAomomoPlanet) {
      markerResult = aomomo.addLandingMarker(context.alienGameState, currentPlayer);
      markerKind = "aomomo-land";
      markerSequence = markerResult.marker?.sequence || null;
    } else {
      markerResult = planetStats.addPlanetLandingMarker(context.planetStatsState, planetId, currentPlayer, {
        allowDuplicate: Boolean(options.allowDuplicateLanding),
      });
      markerKind = "land";
      markerSequence = markerResult.marker?.sequence || null;
    }

    if (!markerResult.ok) {
      Object.assign(context.rocketState, snapshots.rocketState);
      Object.assign(context.planetStatsState, snapshots.planetStatsState);
      if (context.alienGameState && snapshots.alienGameState) Object.assign(context.alienGameState, snapshots.alienGameState);
      Object.assign(currentPlayer, snapshots.player);
      return { ok: false, abilityId: "landProbe", message: markerResult.message };
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
      events: [{
        type: "land",
        planetId,
        markerKind,
        satelliteId,
        playerId: currentPlayer.id || null,
        playerColor: currentPlayer.color || null,
        source: options.source || "land",
      }],
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
    ORANGE3_LAND_DISCOUNT,
    getLandEnergyCost,
    getOrbitOptions,
    getLandOptions,
    orbitProbe,
    landProbe,
  });
});
