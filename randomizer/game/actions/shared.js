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

    return { ok: true, rocket, message: null, currentPlayer };
  }

  function getRocketPlanet(context) {
    const active = getActiveRocketForPlayer(context);
    if (!active.ok) return active;

    const sectorCoordinate = rockets.getRocketSectorCoordinate(active.rocket);
    const planetLocations = context.getPlanetLocations();
    const planet = findPlanetAtSector(planetLocations, sectorCoordinate);

    if (!planet) {
      return {
        ok: false,
        rocket: active.rocket,
        currentPlayer: active.currentPlayer,
        message: "当前火箭不在行星格上",
      };
    }

    if (planet.planetId === "earth") {
      return {
        ok: false,
        rocket: active.rocket,
        currentPlayer: active.currentPlayer,
        planet,
        message: "地球不能执行此行动",
      };
    }

    return {
      ok: true,
      rocket: active.rocket,
      currentPlayer: active.currentPlayer,
      planet,
      sectorCoordinate,
      message: null,
    };
  }

  function removeRocketFromState(context, rocketId) {
    return rockets.removeRocket(context.rocketState, rocketId);
  }

  return Object.freeze({
    NON_EARTH_PLANET_IDS,
    findPlanetAtSector,
    getActiveRocketForPlayer,
    getRocketPlanet,
    removeRocketFromState,
  });
});
