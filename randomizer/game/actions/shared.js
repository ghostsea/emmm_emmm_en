(function (root, factory) {
  "use strict";

  let solar = root.SetiSolarSystem;
  let players = root.SetiPlayers;
  let rockets = root.SetiRocketActions;

  if ((!solar || !players || !rockets) && typeof require === "function") {
    solar = solar || require("../../solar-system/core");
    players = players || require("../players");
    rockets = rockets || require("../rockets");
  }

  const api = factory(solar, players, rockets);

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.SetiActionShared = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function (solar, players, rockets) {
  "use strict";

  if (!solar || !players || !rockets) {
    throw new Error("SetiSolarSystem, SetiPlayers and SetiRocketActions are required before SetiActionShared");
  }

  const NON_EARTH_PLANET_IDS = Object.freeze(
    Object.keys(solar.layout.PLANETS).filter((planetId) => planetId !== "earth"),
  );

  function findPlanetAtSector(planetLocations, sectorCoordinate) {
    if (!sectorCoordinate || !Array.isArray(planetLocations)) return null;
    const sectorX = solar.mod8(sectorCoordinate.x);
    const sectorY = Number(sectorCoordinate.y);
    return planetLocations.find((planet) => planet.x === sectorX && planet.y === sectorY) || null;
  }

  function getActiveRocketForPlayer(context) {
    const rocket = rockets.getActiveRocket(context.rocketState);
    if (!rocket) {
      return { ok: false, rocket: null, message: "没有可操作的当前火箭" };
    }

    const currentPlayer = players.getCurrentPlayer(context.playerState);
    if (rocket.playerId && currentPlayer && rocket.playerId !== currentPlayer.id) {
      return { ok: false, rocket, message: "当前火箭不属于本玩家" };
    }
    if (!rockets.isControllablePlayerRocket(rocket)) {
      if ((rocket.kind || rockets.ROCKET_KIND.STANDARD) === rockets.ROCKET_KIND.STANDARD) {
        return { ok: false, rocket, message: "当前火箭不在行星格上" };
      }
      return { ok: false, rocket, message: "当前棋子不是可环绕/登陆的火箭" };
    }

    return { ok: true, rocket, message: null, currentPlayer };
  }

  function findPlayerRocketOnPlanet(context, currentPlayer) {
    return listPlayerRocketPlanetPlacements(context, { currentPlayer })[0] || null;
  }

  function getRocketPlanetForRocket(context, rocket, currentPlayer) {
    if (!rocket) {
      return { ok: false, rocket: null, currentPlayer, message: "没有可操作的当前火箭" };
    }
    if (rocket.playerId && currentPlayer && rocket.playerId !== currentPlayer.id) {
      return { ok: false, rocket, currentPlayer, message: "当前火箭不属于本玩家" };
    }
    if (!rockets.isControllablePlayerRocket(rocket)) {
      if ((rocket.kind || rockets.ROCKET_KIND.STANDARD) === rockets.ROCKET_KIND.STANDARD) {
        return { ok: false, rocket, currentPlayer, message: "当前火箭不在行星格上" };
      }
      return { ok: false, rocket, currentPlayer, message: "当前棋子不是可环绕/登陆的火箭" };
    }

    const sectorCoordinate = rockets.getRocketSectorCoordinate(rocket);
    const planet = findPlanetAtSector(context.getPlanetLocations(), sectorCoordinate);
    if (!planet) {
      return { ok: false, rocket, currentPlayer, message: "当前火箭不在行星格上" };
    }
    if (planet.planetId === "earth") {
      return { ok: false, rocket, currentPlayer, planet, sectorCoordinate, message: "地球不能执行此行动" };
    }
    return {
      ok: true,
      rocket,
      currentPlayer,
      planet,
      sectorCoordinate,
      message: null,
    };
  }

  function sortPlacementsByPreference(placements, preferredRocketId, activeRocketId) {
    return placements.sort((left, right) => {
      if (preferredRocketId != null) {
        if (left.rocket.id === preferredRocketId) return -1;
        if (right.rocket.id === preferredRocketId) return 1;
      }
      if (activeRocketId != null) {
        if (left.rocket.id === activeRocketId) return -1;
        if (right.rocket.id === activeRocketId) return 1;
      }
      return (left.rocket.playerSequence || left.rocket.id || 0)
        - (right.rocket.playerSequence || right.rocket.id || 0);
    });
  }

  function listPlayerRocketPlanetPlacements(context, options = {}) {
    const currentPlayer = options.currentPlayer || players.getCurrentPlayer(context.playerState);
    if (!currentPlayer) return [];

    const requestedRocketId = options.rocketId == null ? null : Number(options.rocketId);
    const activeRocketId = context.rocketState?.activeRocketId ?? null;
    const preferredRocketId = options.preferredRocketId == null ? requestedRocketId : Number(options.preferredRocketId);
    const candidates = Number.isInteger(requestedRocketId)
      ? (context.rocketState?.rockets || []).filter((rocket) => rocket.id === requestedRocketId)
      : rockets.getRocketsForPlayer(context.rocketState, currentPlayer.id);

    const placements = candidates
      .map((rocket) => getRocketPlanetForRocket(context, rocket, currentPlayer))
      .filter((placement) => placement.ok);
    return sortPlacementsByPreference(placements, preferredRocketId, activeRocketId);
  }

  function getRocketPlanet(context, options = {}) {
    const requestedRocketId = options.rocketId == null ? null : Number(options.rocketId);
    const currentPlayer = players.getCurrentPlayer(context.playerState);
    if (Number.isInteger(requestedRocketId)) {
      const rocket = (context.rocketState?.rockets || []).find((item) => item.id === requestedRocketId) || null;
      if (!rocket) {
        return { ok: false, rocket: null, currentPlayer, message: `火箭 R${requestedRocketId} 不存在` };
      }
      return getRocketPlanetForRocket(context, rocket, currentPlayer);
    }

    const active = getActiveRocketForPlayer(context);
    if (!active.ok) {
      const fallback = findPlayerRocketOnPlanet(context, currentPlayer);
      if (!fallback) return active;
      return {
        ok: true,
        rocket: fallback.rocket,
        currentPlayer,
        planet: fallback.planet,
        sectorCoordinate: fallback.sectorCoordinate,
        message: null,
      };
    }

    return getRocketPlanetForRocket(context, active.rocket, active.currentPlayer);
  }

  function removeRocketFromState(context, rocketId) {
    return rockets.removeRocket(context.rocketState, rocketId);
  }

  return Object.freeze({
    NON_EARTH_PLANET_IDS,
    findPlanetAtSector,
    getActiveRocketForPlayer,
    listPlayerRocketPlanetPlacements,
    getRocketPlanet,
    removeRocketFromState,
  });
});
