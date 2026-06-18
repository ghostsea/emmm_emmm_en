(function (root, factory) {
  "use strict";

  let catalog = root.SetiIndustryCatalog;

  if (typeof require === "function") {
    catalog = catalog || require("./catalog");
  }

  const api = factory(catalog);

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.SetiIndustryPassives = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function (catalog) {
  "use strict";

  const FENWICK_RESEARCH_COST = 5;
  const HUANYU_ROCKET_LIMIT_BONUS = 1;
  const MISSION_PLAY_PUBLICITY_GAIN = 1;
  const TURING_BLUE_TECH_PUBLICITY_GAIN = 1;

  function playerHasPassive(player, passiveId) {
    const definition = catalog.getPlayerIndustryDefinition(player);
    return Boolean(definition?.passiveIds?.includes(passiveId));
  }

  function getRocketLimitBonus(player) {
    return playerHasPassive(player, "huanyu_rocket_limit") ? HUANYU_ROCKET_LIMIT_BONUS : 0;
  }

  function getResearchPublicityCost(player, defaultCost = 6) {
    return playerHasPassive(player, "fenwick_research_cost") ? FENWICK_RESEARCH_COST : defaultCost;
  }

  function canAnalyzeWithoutEnergy(player) {
    return playerHasPassive(player, "deepspace_free_analyze");
  }

  function shouldScanEarthOnLaunch(player) {
    return playerHasPassive(player, "sentinel_launch_scan_earth");
  }

  function shouldGainPublicityOnType12Play(player) {
    return playerHasPassive(player, "mission_play_type_publicity");
  }

  function shouldApplyTuringBlueTechPublicity(player, tileId) {
    if (!playerHasPassive(player, "turing_blue_tech_publicity")) return false;
    return String(tileId || "").startsWith("blue");
  }

  function getTuringBlueTechPublicityGain() {
    return TURING_BLUE_TECH_PUBLICITY_GAIN;
  }

  function getMissionPlayPublicityGain() {
    return MISSION_PLAY_PUBLICITY_GAIN;
  }

  function shouldPlaceMissionStartupFinalMark(player) {
    return playerHasPassive(player, "mission_startup_final_mark");
  }

  function normalizeRoundNumber(roundNumber) {
    return Math.max(0, Math.round(Number(roundNumber) || 0));
  }

  function isSentinelCornerArmed(player, roundNumber, turnNumber = 1) {
    const round = Math.max(0, Math.round(Number(roundNumber) || 0));
    return round > 0
      && player?.industrySentinelArmedRound === round;
  }

  function getBorrowedTechTileId(player, roundNumber, turnNumber = 1) {
    const round = normalizeRoundNumber(roundNumber);
    if (round <= 0) return null;
    if (player?.industryBorrowedTechRound !== round) return null;
    return player?.industryBorrowedTechTileId || null;
  }

  function playerHasTechEffect(player, tileId, roundNumber, turnNumber = 1) {
    if (!tileId) return false;
    if (player?.techState?.ownedTiles?.[tileId]) return true;
    return getBorrowedTechTileId(player, roundNumber, turnNumber) === tileId;
  }

  function getHuanyuFreeMovesLeft(player, roundNumber, turnNumber = 1) {
    const round = normalizeRoundNumber(roundNumber);
    if (round <= 0) return 0;
    if (player?.industryHuanyuFreeMoveRound !== round) return 0;
    return Math.max(0, Math.round(Number(player?.industryHuanyuFreeMovesLeft) || 0));
  }

  return Object.freeze({
    FENWICK_RESEARCH_COST,
    HUANYU_ROCKET_LIMIT_BONUS,
    getRocketLimitBonus,
    getResearchPublicityCost,
    canAnalyzeWithoutEnergy,
    shouldScanEarthOnLaunch,
    shouldGainPublicityOnType12Play,
    shouldApplyTuringBlueTechPublicity,
    getTuringBlueTechPublicityGain,
    getMissionPlayPublicityGain,
    shouldPlaceMissionStartupFinalMark,
    isSentinelCornerArmed,
    getBorrowedTechTileId,
    playerHasTechEffect,
    getHuanyuFreeMovesLeft,
  });
});
