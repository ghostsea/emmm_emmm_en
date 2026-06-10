(function (root, factory) {
  "use strict";

  let layout = root.SetiSolarLayout;
  if (!layout && typeof require === "function") {
    layout = require("../solar-system/layout");
  }

  const api = factory(layout);

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.SetiPlanetStats = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function (layout) {
  "use strict";

  if (!layout) {
    throw new Error("SetiSolarLayout is required before SetiPlanetStats");
  }

  const PLANET_IDS = Object.freeze(Object.keys(layout.PLANETS));

  function createEmptyPlanetRecord() {
    return { orbits: 0, landings: 0 };
  }

  function createPlanetStatsState() {
    const planets = {};
    for (const planetId of PLANET_IDS) {
      planets[planetId] = createEmptyPlanetRecord();
    }
    return { planets };
  }

  function getPlanetRecord(state, planetId) {
    if (!state?.planets || !planetId) return null;
    return state.planets[planetId] || null;
  }

  function incrementPlanetOrbits(state, planetId) {
    const record = getPlanetRecord(state, planetId);
    if (!record) return false;
    record.orbits += 1;
    return true;
  }

  function incrementPlanetLandings(state, planetId) {
    const record = getPlanetRecord(state, planetId);
    if (!record) return false;
    record.landings += 1;
    return true;
  }

  function getPlanetOrbitCount(state, planetId) {
    return getPlanetRecord(state, planetId)?.orbits || 0;
  }

  function getPlanetLandingCount(state, planetId) {
    return getPlanetRecord(state, planetId)?.landings || 0;
  }

  function formatPlanetStatsLines(state) {
    return PLANET_IDS.map((planetId) => {
      const planet = layout.PLANETS[planetId];
      const record = getPlanetRecord(state, planetId) || createEmptyPlanetRecord();
      const name = planet?.name || planetId;
      return `${name} 环绕=${record.orbits} 登陆=${record.landings}`;
    });
  }

  return Object.freeze({
    PLANET_IDS,
    createPlanetStatsState,
    getPlanetRecord,
    incrementPlanetOrbits,
    incrementPlanetLandings,
    getPlanetOrbitCount,
    getPlanetLandingCount,
    formatPlanetStatsLines,
  });
});
