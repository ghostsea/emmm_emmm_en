(function (root, factory) {
  "use strict";

  let layout = root.SetiSolarLayout;
  let planetReferenceLayout = root.SetiPlanetReferenceLayout;

  if (typeof require === "function") {
    layout = layout || require("../solar-system/layout");
    planetReferenceLayout = planetReferenceLayout || require("./planet-reference-layout");
  }

  const api = factory(layout, planetReferenceLayout);

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.SetiPlanetStats = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function (layout, planetReferenceLayout) {
  "use strict";

  if (!layout) {
    throw new Error("SetiSolarLayout is required before SetiPlanetStats");
  }

  if (!planetReferenceLayout) {
    throw new Error("SetiPlanetReferenceLayout is required before SetiPlanetStats");
  }

  const PLANET_IDS = Object.freeze(Object.keys(layout.PLANETS));

  function createEmptyPlanetRecord() {
    return {
      orbits: 0,
      landings: 0,
      orbitMarkers: [],
      landingMarkers: [],
      satelliteLandings: [],
    };
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

  function normalizePlayer(player) {
    if (!player) return null;
    return {
      id: player.id,
      color: player.color,
    };
  }

  function getOwnerKeys(ref = {}) {
    const player = ref.player ? normalizePlayer(ref.player) : null;
    return new Set([
      ref.playerId,
      ref.color,
      ref.playerColor,
      player?.id,
      player?.color,
    ].filter(Boolean));
  }

  function markerMatchesOwner(marker, ref = {}) {
    const ownerKeys = getOwnerKeys(ref);
    if (!ownerKeys.size) return true;
    return ownerKeys.has(marker?.playerId)
      || ownerKeys.has(marker?.color)
      || ownerKeys.has(marker?.playerColor);
  }

  function markerMatchesSequence(marker, ref = {}) {
    if (ref.sequence == null) return true;
    return Number(marker?.sequence) === Number(ref.sequence);
  }

  function getPlanetMarkerDisplayLimit(planetId, kind) {
    return Math.max(0, planetReferenceLayout.getPlanetSlotCount(planetId, kind));
  }

  function applyReferenceOffset(marker, options = {}) {
    const offset = Number(options.referenceOffsetTokenWidths);
    if (Number.isFinite(offset) && offset !== 0) {
      marker.referenceOffsetTokenWidths = offset;
    } else {
      delete marker.referenceOffsetTokenWidths;
    }
    return marker;
  }

  function updateMarkerDisplayState(marker, displayLimit) {
    if (marker.forceDisplaySlot && Number.isFinite(Number(marker.displaySlot))) {
      marker.displayed = true;
      marker.displaySlot = Number(marker.displaySlot);
      return marker;
    }
    marker.displayed = marker.sequence <= displayLimit;
    marker.displaySlot = marker.displayed ? marker.sequence : null;
    return marker;
  }

  function reindexMarkerSequences(markers, displayLimit = Infinity) {
    markers.forEach((marker, index) => {
      marker.sequence = index + 1;
      updateMarkerDisplayState(marker, displayLimit);
    });
  }

  function canAddOrbitMarker(state, planetId) {
    const record = getPlanetRecord(state, planetId);
    if (!record) return false;
    return getPlanetMarkerDisplayLimit(planetId, "orbit") > 0;
  }

  function canAddLandingMarker(state, planetId) {
    const record = getPlanetRecord(state, planetId);
    if (!record) return false;
    return getPlanetMarkerDisplayLimit(planetId, "land") > 0;
  }

  function addPlanetOrbitMarker(state, planetId, player) {
    if (!canAddOrbitMarker(state, planetId)) {
      return { ok: false, marker: null, message: "星球不支持环绕标记" };
    }

    const record = getPlanetRecord(state, planetId);
    const normalizedPlayer = normalizePlayer(player);
    record.orbits += 1;
    const marker = updateMarkerDisplayState({
      sequence: record.orbits,
      playerId: normalizedPlayer.id,
      color: normalizedPlayer.color,
    }, getPlanetMarkerDisplayLimit(planetId, "orbit"));
    record.orbitMarkers.push(marker);
    return { ok: true, marker, message: null };
  }

  function addPlanetLandingMarker(state, planetId, player, options = {}) {
    if (!canAddLandingMarker(state, planetId)) {
      return { ok: false, marker: null, message: "星球不支持登陆标记" };
    }

    const record = getPlanetRecord(state, planetId);
    const normalizedPlayer = normalizePlayer(player);
    record.landings += 1;
    const marker = updateMarkerDisplayState(applyReferenceOffset({
      sequence: record.landings,
      playerId: normalizedPlayer.id,
      color: normalizedPlayer.color,
      forceDisplaySlot: Boolean(options.forceDisplaySlot),
      displaySlot: options.displaySlot != null ? Number(options.displaySlot) : undefined,
    }, options), getPlanetMarkerDisplayLimit(planetId, "land"));
    record.landingMarkers.push(marker);
    return { ok: true, marker, message: null };
  }

  function removePlanetOrbitMarker(state, planetId, markerRef = {}) {
    const record = getPlanetRecord(state, planetId);
    if (!record) return { ok: false, marker: null, message: "星球不存在" };
    const markerIndex = record.orbitMarkers.findIndex((marker) => (
      markerMatchesSequence(marker, markerRef) && markerMatchesOwner(marker, markerRef)
    ));
    if (markerIndex < 0) return { ok: false, marker: null, message: "没有可移除的环绕标记" };
    const [marker] = record.orbitMarkers.splice(markerIndex, 1);
    reindexMarkerSequences(record.orbitMarkers, getPlanetMarkerDisplayLimit(planetId, "orbit"));
    record.orbits = record.orbitMarkers.length;
    return { ok: true, marker, message: "已移除环绕标记" };
  }

  function removePlanetLandingMarker(state, planetId, markerRef = {}) {
    const record = getPlanetRecord(state, planetId);
    if (!record) return { ok: false, marker: null, message: "星球不存在" };
    const markerIndex = record.landingMarkers.findIndex((marker) => (
      markerMatchesSequence(marker, markerRef) && markerMatchesOwner(marker, markerRef)
    ));
    if (markerIndex < 0) return { ok: false, marker: null, message: "没有可移除的登陆标记" };
    const [marker] = record.landingMarkers.splice(markerIndex, 1);
    reindexMarkerSequences(record.landingMarkers, getPlanetMarkerDisplayLimit(planetId, "land"));
    record.landings = record.landingMarkers.length;
    return { ok: true, marker, message: "已移除登陆标记" };
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

  function getPlanetOrbitMarkers(state, planetId) {
    return [...(getPlanetRecord(state, planetId)?.orbitMarkers || [])];
  }

  function getPlanetLandingMarkers(state, planetId) {
    return [...(getPlanetRecord(state, planetId)?.landingMarkers || [])];
  }

  function isSatelliteLanded(state, planetId, satelliteId) {
    const record = getPlanetRecord(state, planetId);
    if (!record) return false;
    return record.satelliteLandings.some((marker) => marker.satelliteId === satelliteId);
  }

  function getAvailableSatellitesForLanding(state, planetId, options = {}) {
    if (!planetReferenceLayout.hasSatellites(planetId)) return [];
    if (options.allowDuplicate) return planetReferenceLayout.getSatellitesForPlanet(planetId);
    return planetReferenceLayout.getSatellitesForPlanet(planetId)
      .filter((satellite) => !isSatelliteLanded(state, planetId, satellite.satelliteId));
  }

  function canLandOnSatellite(state, planetId, satelliteId, options = {}) {
    if (!planetReferenceLayout.getSatellitePlacement(planetId, satelliteId)) return false;
    return Boolean(options.allowDuplicate) || !isSatelliteLanded(state, planetId, satelliteId);
  }

  function addSatelliteLandingMarker(state, planetId, satelliteId, player, options = {}) {
    if (!canLandOnSatellite(state, planetId, satelliteId, options)) {
      return { ok: false, marker: null, message: "该卫星已被登陆或不存在" };
    }

    const satellite = planetReferenceLayout.getSatellitePlacement(planetId, satelliteId);
    const record = getPlanetRecord(state, planetId);
    const normalizedPlayer = normalizePlayer(player);
    const marker = applyReferenceOffset({
      satelliteId,
      satelliteName: satellite.satelliteName,
      playerId: normalizedPlayer.id,
      color: normalizedPlayer.color,
    }, options);
    record.satelliteLandings.push(marker);
    return { ok: true, marker, message: null };
  }

  function removeSatelliteLandingMarker(state, planetId, satelliteId, markerRef = {}) {
    const record = getPlanetRecord(state, planetId);
    if (!record) return { ok: false, marker: null, message: "星球不存在" };
    const markerIndex = record.satelliteLandings.findIndex((marker) => (
      marker.satelliteId === satelliteId && markerMatchesOwner(marker, markerRef)
    ));
    if (markerIndex < 0) return { ok: false, marker: null, message: "没有可移除的卫星登陆标记" };
    const [marker] = record.satelliteLandings.splice(markerIndex, 1);
    return { ok: true, marker, message: "已移除卫星登陆标记" };
  }

  function getSatelliteLandingMarkers(state, planetId) {
    return [...(getPlanetRecord(state, planetId)?.satelliteLandings || [])];
  }

  function formatPlanetStatsLines(state) {
    return PLANET_IDS.map((planetId) => {
      const planet = layout.PLANETS[planetId];
      const record = getPlanetRecord(state, planetId) || createEmptyPlanetRecord();
      const name = planet?.name || planetId;
      const satelliteCount = record.satelliteLandings.length;
      const satelliteText = satelliteCount ? ` 卫星登陆=${satelliteCount}` : "";
      return `${name} 环绕=${record.orbits} 登陆=${record.landings}${satelliteText}`;
    });
  }

  return Object.freeze({
    PLANET_IDS,
    createPlanetStatsState,
    getPlanetRecord,
    canAddOrbitMarker,
    canAddLandingMarker,
    addPlanetOrbitMarker,
    addPlanetLandingMarker,
    removePlanetOrbitMarker,
    removePlanetLandingMarker,
    incrementPlanetOrbits,
    incrementPlanetLandings,
    getPlanetOrbitCount,
    getPlanetLandingCount,
    getPlanetOrbitMarkers,
    getPlanetLandingMarkers,
    isSatelliteLanded,
    getAvailableSatellitesForLanding,
    canLandOnSatellite,
    addSatelliteLandingMarker,
    removeSatelliteLandingMarker,
    getSatelliteLandingMarkers,
    formatPlanetStatsLines,
  });
});
