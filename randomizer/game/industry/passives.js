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
  const ALIEN_LAB_RESEARCH_COST = 4;
  const ALIEN_LAB_LAUNCH_COST = Object.freeze({ credits: 1 });
  const ALIEN_LAB_SCAN_COST = Object.freeze({ energy: 2 });
  const HUANYU_ROCKET_LIMIT_BONUS = 1;
  const MISSION_PLAY_PUBLICITY_GAIN = 1;
  const TURING_BLUE_TECH_PUBLICITY_GAIN = 1;
  const CHEAT_LAB_PERMANENT_PASSIVE_ID = "cheat_lab_permanent_panels";

  function playerHasPassive(player, passiveId) {
    const definition = catalog.getPlayerIndustryDefinition(player);
    return Boolean(definition?.passiveIds?.includes(passiveId));
  }

  function getRocketLimitBonus(player) {
    return playerHasPassive(player, "huanyu_rocket_limit") ? HUANYU_ROCKET_LIMIT_BONUS : 0;
  }

  function hasPermanentAlienLabPanels(player) {
    return playerHasPassive(player, CHEAT_LAB_PERMANENT_PASSIVE_ID);
  }

  function hasActiveAlienLabPanel(player, panelId) {
    if (!playerHasPassive(player, "alien_lab_panels")) return false;
    if (hasPermanentAlienLabPanels(player)) return true;
    return player?.industryAlienLabPanels?.[panelId] !== false;
  }

  function getResearchPublicityCost(player, defaultCost = 6) {
    if (hasActiveAlienLabPanel(player, "pink")) {
      return ALIEN_LAB_RESEARCH_COST;
    }
    return playerHasPassive(player, "fenwick_research_cost") ? FENWICK_RESEARCH_COST : defaultCost;
  }

  function cloneCost(cost) {
    return Object.assign({}, cost || {});
  }

  function getStandardLaunchCost(player, defaultCost = { credits: 2 }) {
    if (hasActiveAlienLabPanel(player, "blue")) {
      return cloneCost(ALIEN_LAB_LAUNCH_COST);
    }
    return cloneCost(defaultCost);
  }

  function getStandardScanCost(player, defaultCost = { credits: 1, energy: 2 }) {
    if (hasActiveAlienLabPanel(player, "yellow")) {
      return cloneCost(ALIEN_LAB_SCAN_COST);
    }
    return cloneCost(defaultCost);
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

  function shouldShowStrategyPassiveMarkers(player) {
    if (!playerHasPassive(player, "strategy_passive_reward_slots")) return false;
    return Boolean(player?.initialSelection?.industry);
  }

  function shouldInitializeStrategyPassiveMarkers(player) {
    if (!shouldShowStrategyPassiveMarkers(player)) return false;
    return !player?.industryStrategyPassiveInitialized;
  }

  function shouldShowHeliosPassiveMarkers(player) {
    if (!playerHasPassive(player, "helios_passive_reward_slots")) return false;
    return Boolean(player?.initialSelection?.industry);
  }

  function shouldInitializeHeliosPassiveMarkers(player) {
    if (!shouldShowHeliosPassiveMarkers(player)) return false;
    return !player?.industryHeliosPassiveInitialized;
  }

  function shouldShowAlienLabPanels(player) {
    if (!playerHasPassive(player, "alien_lab_panels")) return false;
    return Boolean(player?.initialSelection?.industry);
  }

  function shouldInitializeAlienLabPanels(player) {
    if (!shouldShowAlienLabPanels(player)) return false;
    return !player?.industryAlienLabInitialized;
  }

  function shouldShowFutureSpanPanel(player) {
    if (!playerHasPassive(player, "future_span_parking")) return false;
    return Boolean(player?.initialSelection?.industry);
  }

  function shouldInitializeFutureSpan(player) {
    if (!shouldShowFutureSpanPanel(player)) return false;
    return !player?.industryFutureSpanInitialized;
  }

  function normalizeRoundNumber(roundNumber) {
    return Math.max(0, Math.round(Number(roundNumber) || 0));
  }

  function normalizeTurnNumber(turnNumber) {
    return Math.max(0, Math.round(Number(turnNumber) || 0));
  }

  function isSentinelCornerArmed(player, roundNumber, turnNumber = 1) {
    const round = normalizeRoundNumber(roundNumber);
    const turn = normalizeTurnNumber(turnNumber);
    return round > 0
      && turn > 0
      && player?.industrySentinelArmedRound === round
      && player?.industrySentinelArmedTurn === turn;
  }

  function getBorrowedTechTileId(player, roundNumber = null, turnNumber = null) {
    if (roundNumber == null && turnNumber == null) {
      return (Number(player?.industryBorrowedTechRound) || 0) > 0
        && (Number(player?.industryBorrowedTechTurn) || 0) > 0
        ? (player?.industryBorrowedTechTileId || null)
        : null;
    }
    const round = normalizeRoundNumber(roundNumber);
    const turn = normalizeTurnNumber(turnNumber);
    if (round <= 0 || turn <= 0) return null;
    if (player?.industryBorrowedTechRound !== round) return null;
    if (player?.industryBorrowedTechTurn !== turn) return null;
    return player?.industryBorrowedTechTileId || null;
  }

  function playerHasTechEffect(player, tileId, roundNumber = null, turnNumber = null) {
    if (!tileId) return false;
    if (player?.techState?.ownedTiles?.[tileId] && !player?.techState?.disabledTiles?.[tileId]) return true;
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
    ALIEN_LAB_RESEARCH_COST,
    ALIEN_LAB_LAUNCH_COST,
    ALIEN_LAB_SCAN_COST,
    HUANYU_ROCKET_LIMIT_BONUS,
    getRocketLimitBonus,
    getResearchPublicityCost,
    getStandardLaunchCost,
    getStandardScanCost,
    hasPermanentAlienLabPanels,
    hasActiveAlienLabPanel,
    canAnalyzeWithoutEnergy,
    shouldScanEarthOnLaunch,
    shouldGainPublicityOnType12Play,
    shouldApplyTuringBlueTechPublicity,
    getTuringBlueTechPublicityGain,
    getMissionPlayPublicityGain,
    shouldPlaceMissionStartupFinalMark,
    shouldShowStrategyPassiveMarkers,
    shouldInitializeStrategyPassiveMarkers,
    shouldShowHeliosPassiveMarkers,
    shouldInitializeHeliosPassiveMarkers,
    shouldShowAlienLabPanels,
    shouldInitializeAlienLabPanels,
    shouldShowFutureSpanPanel,
    shouldInitializeFutureSpan,
    isSentinelCornerArmed,
    getBorrowedTechTileId,
    playerHasTechEffect,
    getHuanyuFreeMovesLeft,
  });
});
