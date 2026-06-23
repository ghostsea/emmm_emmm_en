(function (root, factory) {
  "use strict";

  const api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.SetiAIBattleAnalytics = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function () {
  "use strict";

  const BASIC_MAIN_ACTIONS = Object.freeze(["launch", "orbit", "land", "scan"]);
  const ENGINE_ACTIONS = Object.freeze(["playCard", "researchTech"]);
  const QUICK_ACTIONS = Object.freeze(["move"]);
  const PASS_ACTIONS = Object.freeze(["pass", "end-turn"]);
  const POLICY_ACTION_BIAS = Object.freeze({
    land: 7,
    orbit: 6,
    researchTech: 5,
    playCard: 5,
    launch: 4,
    scan: 1.5,
    analyze: 1,
    move: 0,
    "end-turn": 0,
    pass: -12,
  });

  function increment(map, key, amount = 1) {
    const normalizedKey = key == null || key === "" ? "unknown" : String(key);
    map[normalizedKey] = (map[normalizedKey] || 0) + amount;
    return map[normalizedKey];
  }

  function incrementNested(map, parentKey, childKey, amount = 1) {
    const normalizedParent = parentKey == null || parentKey === "" ? "unknown" : String(parentKey);
    if (!map[normalizedParent]) map[normalizedParent] = {};
    return increment(map[normalizedParent], childKey, amount);
  }

  function numeric(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
  }

  function roundRatio(value) {
    return Math.round(numeric(value) * 1000) / 1000;
  }

  function rankCounts(counts = {}, limit = 10) {
    return Object.entries(counts)
      .map(([key, count]) => ({ key, count }))
      .sort((left, right) => right.count - left.count || left.key.localeCompare(right.key))
      .slice(0, limit);
  }

  function getActionCategory(actionId) {
    if (BASIC_MAIN_ACTIONS.includes(actionId)) return "basicMain";
    if (ENGINE_ACTIONS.includes(actionId)) return "engine";
    if (QUICK_ACTIONS.includes(actionId)) return "quick";
    if (PASS_ACTIONS.includes(actionId)) return "pass";
    return "other";
  }

  function getCandidateStats(stats, actionId) {
    const key = actionId == null || actionId === "" ? "unknown" : String(actionId);
    if (!stats[key]) {
      stats[key] = {
        offered: 0,
        available: 0,
        selected: 0,
        availableNotSelected: 0,
      };
    }
    return stats[key];
  }

  function getCandidateId(candidate) {
    return String(candidate?.id || candidate?.actionId || "unknown");
  }

  function getFiniteScore(value) {
    const score = Number(value);
    return Number.isFinite(score) ? score : null;
  }

  function scoreNestedPlayCardCandidate(candidate) {
    const explicitScore = getFiniteScore(candidate?.score);
    const price = Math.max(0, Math.round(Number(candidate?.price) || 0));
    const priceTieBreaker = Math.max(0, 5 - price) * 0.2;
    return (explicitScore ?? 0) + priceTieBreaker;
  }

  function getBestNestedScore(items = [], scoreFn = () => 0) {
    return (items || []).reduce((best, item) => {
      const score = getFiniteScore(scoreFn(item));
      return score == null ? best : Math.max(best, score);
    }, -Infinity);
  }

  function getCandidatePolicyScore(candidate) {
    if (!candidate) return null;
    const actionId = getCandidateId(candidate);
    const explicitScore = getFiniteScore(candidate.score);
    let valueScore = explicitScore ?? 0;
    if (actionId === "researchTech") {
      const bestTechScore = getBestNestedScore(candidate.takeable || [], (entry) => entry?.score);
      if (Number.isFinite(bestTechScore)) valueScore = Math.max(valueScore, bestTechScore);
    } else if (actionId === "playCard") {
      const bestCardScore = getBestNestedScore(candidate.playableCards || [], scoreNestedPlayCardCandidate);
      if (Number.isFinite(bestCardScore)) valueScore = Math.max(valueScore, bestCardScore);
    }
    return (POLICY_ACTION_BIAS[actionId] ?? 0) + valueScore;
  }

  function isCandidateAvailable(candidate) {
    return candidate && candidate.available !== false;
  }

  function candidateMatchesAction(candidate, action) {
    if (!candidate || !action) return false;
    if (getCandidateId(candidate) !== String(action.id || "")) return false;
    if (action.rocketId != null && candidate.rocketId != null && action.rocketId !== candidate.rocketId) return false;
    if (action.direction != null && candidate.direction != null && action.direction !== candidate.direction) return false;
    if (action.cardInstanceId != null && candidate.cardInstanceId != null && action.cardInstanceId !== candidate.cardInstanceId) return false;
    if (action.cardId != null && candidate.cardId != null && action.cardId !== candidate.cardId) return false;
    return true;
  }

  function hasAvailableKind(candidates = [], kind) {
    return candidates.some((candidate) => isCandidateAvailable(candidate) && candidate.kind === kind);
  }

  function hasAvailableAction(candidates = [], actionId) {
    return candidates.some((candidate) => isCandidateAvailable(candidate) && getCandidateId(candidate) === actionId);
  }

  function getSelectedAction(entry) {
    return entry?.details?.action || null;
  }

  function getSelectedActionId(entry) {
    return String(getSelectedAction(entry)?.id || "unknown");
  }

  function getPlayerKey(entry) {
    return entry?.playerId || entry?.playerLabel || "unknown";
  }

  function getFinalScoreMarkSelection(entry) {
    return entry?.details?.selected || entry?.details?.mark || {};
  }

  function getFinalScoreMarkKey(entry) {
    const selected = getFinalScoreMarkSelection(entry);
    const tileId = selected.tileId || entry?.details?.mark?.tileId || "unknown";
    const formulaId = selected.formulaId || "unknown";
    return `${tileId}:${formulaId}`;
  }

  function ensurePlayerProfile(profiles, playerId, playerLabel) {
    const key = playerId || playerLabel || "unknown";
    if (!profiles[key]) {
      profiles[key] = {
        playerId: playerId || null,
        playerLabel: playerLabel || playerId || "unknown",
        finalScore: 0,
        baseScore: 0,
        tileScore: 0,
        cardScore: 0,
        completedTaskCount: 0,
        reservedCount: 0,
        handSize: 0,
        techCount: 0,
        rocketCount: 0,
        turnActionCount: 0,
        actionCounts: {},
        actionCategoryCounts: {},
        actionCategoryRatios: {},
        techTypeCounts: {},
        scanTargetCounts: {},
        routeTargetCounts: {},
        moveFollowupCounts: {},
        turnPlanCounts: {},
        turnPlanTypeCounts: {},
        turnPlanActionCounts: {},
        decisionCounts: {},
        metrics: {},
      };
    }
    return profiles[key];
  }

  function addProfileMetric(profile, metric, amount = 1) {
    profile.metrics[metric] = numeric(profile.metrics[metric]) + numeric(amount);
  }

  function getCandidateScoreStat(stats, actionId) {
    const key = actionId == null || actionId === "" ? "unknown" : String(actionId);
    if (!stats[key]) {
      stats[key] = {
        offered: 0,
        available: 0,
        selected: 0,
        bestAvailable: 0,
        missedAsBest: 0,
        offeredScoreTotal: 0,
        availableScoreTotal: 0,
        selectedScoreTotal: 0,
        bestAvailableScoreTotal: 0,
        missedGapTotal: 0,
        maxMissedGap: 0,
      };
    }
    return stats[key];
  }

  function addScoreStatValue(stat, field, score) {
    const value = getFiniteScore(score);
    if (value == null) return;
    stat[field] += value;
  }

  function finalizeCandidateScoreStat(stat = {}) {
    return {
      offered: numeric(stat.offered),
      available: numeric(stat.available),
      selected: numeric(stat.selected),
      bestAvailable: numeric(stat.bestAvailable),
      missedAsBest: numeric(stat.missedAsBest),
      offeredScoreTotal: roundRatio(stat.offeredScoreTotal),
      availableScoreTotal: roundRatio(stat.availableScoreTotal),
      selectedScoreTotal: roundRatio(stat.selectedScoreTotal),
      bestAvailableScoreTotal: roundRatio(stat.bestAvailableScoreTotal),
      missedGapTotal: roundRatio(stat.missedGapTotal),
      maxMissedGap: roundRatio(stat.maxMissedGap),
      averageOfferedScore: stat.offered ? roundRatio(stat.offeredScoreTotal / stat.offered) : 0,
      averageAvailableScore: stat.available ? roundRatio(stat.availableScoreTotal / stat.available) : 0,
      averageSelectedScore: stat.selected ? roundRatio(stat.selectedScoreTotal / stat.selected) : 0,
      averageBestAvailableScore: stat.bestAvailable ? roundRatio(stat.bestAvailableScoreTotal / stat.bestAvailable) : 0,
      averageMissedGap: stat.missedAsBest ? roundRatio(stat.missedGapTotal / stat.missedAsBest) : 0,
    };
  }

  function finalizeCandidateScoreStats(stats = {}) {
    return Object.fromEntries(
      Object.entries(stats).map(([actionId, stat]) => [actionId, finalizeCandidateScoreStat(stat)]),
    );
  }

  function buildTopScoreGaps(stats = {}, limit = 8) {
    return Object.entries(stats)
      .map(([actionId, stat]) => ({ actionId, ...finalizeCandidateScoreStat(stat) }))
      .filter((entry) => entry.missedAsBest > 0)
      .sort((left, right) => right.missedGapTotal - left.missedGapTotal || left.actionId.localeCompare(right.actionId))
      .slice(0, limit);
  }

  function mergeCandidateScoreStats(target, source = {}) {
    for (const [actionId, sourceStat] of Object.entries(source || {})) {
      const stat = getCandidateScoreStat(target, actionId);
      stat.offered += numeric(sourceStat.offered);
      stat.available += numeric(sourceStat.available);
      stat.selected += numeric(sourceStat.selected);
      stat.bestAvailable += numeric(sourceStat.bestAvailable);
      stat.missedAsBest += numeric(sourceStat.missedAsBest);
      stat.offeredScoreTotal += numeric(sourceStat.offeredScoreTotal);
      stat.availableScoreTotal += numeric(sourceStat.availableScoreTotal);
      stat.selectedScoreTotal += numeric(sourceStat.selectedScoreTotal);
      stat.bestAvailableScoreTotal += numeric(sourceStat.bestAvailableScoreTotal);
      stat.missedGapTotal += numeric(sourceStat.missedGapTotal);
      stat.maxMissedGap = Math.max(stat.maxMissedGap, numeric(sourceStat.maxMissedGap));
    }
  }

  function getTechTypeFromTile(tileId) {
    const match = String(tileId || "").match(/^(orange|purple|blue)/);
    return match ? match[1] : null;
  }

  function getRouteTargetKey(routeTarget) {
    if (!routeTarget) return null;
    return [
      routeTarget.kind || "route",
      routeTarget.locationType || routeTarget.planetId || routeTarget.id || "unknown",
    ].join(":");
  }

  function getRouteTargetFromEntry(entry) {
    return entry?.details?.action?.routeTarget
      || entry?.details?.selected?.routeTarget
      || entry?.details?.routeTarget
      || null;
  }

  function getMoveFollowupKey(entry) {
    const followup = entry?.details?.action?.followupMainAction
      || entry?.details?.selected?.followupMainAction
      || entry?.details?.followupMainAction
      || null;
    if (!followup?.actionId) return null;
    return [
      followup.actionId,
      followup.planetId || "unknown",
    ].join(":");
  }

  function getTurnPlanKey(entry) {
    const action = entry?.details?.action || null;
    const plan = getTurnPlanFromEntry(entry);
    if (!plan?.type) return null;
    const mainActionId = plan.mainActionId || action.id || "unknown";
    const quickActionId = getTurnPlanActionId(plan);
    return `${plan.type}:${mainActionId}->${quickActionId}`;
  }

  function getTurnPlanFromEntry(entry) {
    return entry?.details?.action?.plan || null;
  }

  function getTurnPlanActionId(plan) {
    return plan?.quickActionId || plan?.actionId || "none";
  }

  function recordProfileTurnPlan(profile, entry) {
    const plan = getTurnPlanFromEntry(entry);
    const planKey = getTurnPlanKey(entry);
    if (!planKey || !plan?.type) return;
    const actionId = getTurnPlanActionId(plan);
    increment(profile.turnPlanCounts, planKey);
    increment(profile.turnPlanTypeCounts, plan.type);
    increment(profile.turnPlanActionCounts, actionId);
    if (plan.type === "card-synergy") addProfileMetric(profile, "cardSynergyCount", 1);
    if (plan.type === "tech-synergy") addProfileMetric(profile, "techSynergyCount", 1);
    if (plan.type === "main-then-quick") addProfileMetric(profile, "mainThenQuickCount", 1);
    if (actionId === "move") addProfileMetric(profile, "planMoveCount", 1);
    if (actionId === "scan") addProfileMetric(profile, "planScanCount", 1);
    if (actionId === "launch") addProfileMetric(profile, "planLaunchCount", 1);
    if (actionId === "researchTech") addProfileMetric(profile, "planResearchTechCount", 1);
    if (actionId === "orbit" || actionId === "land") addProfileMetric(profile, "planOrbitLandCount", 1);
    if (actionId === "task") addProfileMetric(profile, "planTaskCount", 1);
    if (actionId === "final") addProfileMetric(profile, "planFinalCount", 1);
  }

  function recordTurnCandidateScores(candidateScoreStats, candidates = [], action = null) {
    const scoredAvailable = [];
    let selectedEntry = null;
    for (const candidate of candidates || []) {
      const actionId = getCandidateId(candidate);
      const score = getCandidatePolicyScore(candidate);
      const stat = getCandidateScoreStat(candidateScoreStats, actionId);
      stat.offered += 1;
      addScoreStatValue(stat, "offeredScoreTotal", score);
      if (isCandidateAvailable(candidate)) {
        stat.available += 1;
        addScoreStatValue(stat, "availableScoreTotal", score);
        if (score != null) scoredAvailable.push({ actionId, candidate, score });
      }
      if (candidateMatchesAction(candidate, action)) {
        selectedEntry = { actionId, candidate, score };
      }
    }

    if (!selectedEntry && action) {
      selectedEntry = {
        actionId: getCandidateId(action),
        candidate: action,
        score: getCandidatePolicyScore(action),
      };
    }

    if (selectedEntry) {
      const selectedStat = getCandidateScoreStat(candidateScoreStats, selectedEntry.actionId);
      selectedStat.selected += 1;
      addScoreStatValue(selectedStat, "selectedScoreTotal", selectedEntry.score);
    }

    const bestEntry = scoredAvailable
      .sort((left, right) => right.score - left.score || left.actionId.localeCompare(right.actionId))[0] || null;
    if (bestEntry) {
      const bestStat = getCandidateScoreStat(candidateScoreStats, bestEntry.actionId);
      bestStat.bestAvailable += 1;
      addScoreStatValue(bestStat, "bestAvailableScoreTotal", bestEntry.score);
      const selectedScore = getFiniteScore(selectedEntry?.score);
      const gap = selectedScore == null ? 0 : bestEntry.score - selectedScore;
      if (gap > 0.001 && !candidateMatchesAction(bestEntry.candidate, action)) {
        bestStat.missedAsBest += 1;
        bestStat.missedGapTotal += gap;
        bestStat.maxMissedGap = Math.max(bestStat.maxMissedGap, gap);
        return {
          selectedActionId: selectedEntry?.actionId || null,
          selectedScore,
          bestActionId: bestEntry.actionId,
          bestScore: bestEntry.score,
          gap,
        };
      }
      return {
        selectedActionId: selectedEntry?.actionId || null,
        selectedScore,
        bestActionId: bestEntry.actionId,
        bestScore: bestEntry.score,
        gap: 0,
      };
    }

    return {
      selectedActionId: selectedEntry?.actionId || null,
      selectedScore: getFiniteScore(selectedEntry?.score),
      bestActionId: null,
      bestScore: null,
      gap: 0,
    };
  }

  function attachPlayerResultToProfile(profile, result = {}) {
    profile.finalScore = numeric(result.finalScore);
    profile.baseScore = numeric(result.baseScore);
    profile.tileScore = numeric(result.tileScore);
    profile.cardScore = numeric(result.cardScore);
    profile.completedTaskCount = numeric(result.completedTaskCount);
    profile.reservedCount = numeric(result.reservedCount);
    profile.handSize = numeric(result.handSize);
    profile.techCount = numeric(result.techCount);
    profile.rocketCount = numeric(result.rocketCount);
    addProfileMetric(profile, "finalScore", profile.finalScore);
    addProfileMetric(profile, "tileScore", profile.tileScore);
    addProfileMetric(profile, "cardScore", profile.cardScore);
    addProfileMetric(profile, "completedTaskCount", profile.completedTaskCount);
    addProfileMetric(profile, "techCount", profile.techCount);
    addProfileMetric(profile, "rocketCount", profile.rocketCount);
  }

  function finalizePlayerProfile(profile) {
    for (const [category, count] of Object.entries(profile.actionCategoryCounts || {})) {
      profile.actionCategoryRatios[category] = profile.turnActionCount
        ? roundRatio(count / profile.turnActionCount)
        : 0;
    }
    profile.metrics.basicMainRatio = profile.actionCategoryRatios.basicMain || 0;
    profile.metrics.engineRatio = profile.actionCategoryRatios.engine || 0;
    profile.metrics.quickRatio = profile.actionCategoryRatios.quick || 0;
    profile.metrics.passRatio = profile.actionCategoryRatios.pass || 0;
    profile.metrics.scanCount = numeric(profile.actionCounts.scan);
    profile.metrics.playCardCount = numeric(profile.actionCounts.playCard);
    profile.metrics.researchTechCount = numeric(profile.actionCounts.researchTech);
    profile.metrics.moveCount = numeric(profile.actionCounts.move);
    profile.metrics.orbitLandCount = numeric(profile.actionCounts.orbit) + numeric(profile.actionCounts.land);
    profile.metrics.passCount = numeric(profile.actionCounts.pass);
    profile.metrics.routeTargetCount = Object.values(profile.routeTargetCounts || {})
      .reduce((total, count) => total + numeric(count), 0);
    profile.metrics.moveFollowupCount = Object.values(profile.moveFollowupCounts || {})
      .reduce((total, count) => total + numeric(count), 0);
    profile.metrics.turnPlanCount = Object.values(profile.turnPlanCounts || {})
      .reduce((total, count) => total + numeric(count), 0);
    return profile;
  }

  function buildPlayerProfiles(logs = [], playerResults = []) {
    const profiles = {};
    for (const result of playerResults || []) {
      const profile = ensurePlayerProfile(profiles, result.playerId, result.playerLabel);
      attachPlayerResultToProfile(profile, result);
    }

    for (const entry of logs || []) {
      const profile = ensurePlayerProfile(profiles, entry.playerId, entry.playerLabel);
      if (entry.type === "turn-action") {
        const actionId = getSelectedActionId(entry);
        const category = getActionCategory(actionId);
        increment(profile.actionCounts, actionId);
        increment(profile.actionCategoryCounts, category);
        profile.turnActionCount += 1;
        const routeTargetKey = getRouteTargetKey(getRouteTargetFromEntry(entry));
        if (routeTargetKey) increment(profile.routeTargetCounts, routeTargetKey);
        const followupKey = getMoveFollowupKey(entry);
        if (followupKey) increment(profile.moveFollowupCounts, followupKey);
        recordProfileTurnPlan(profile, entry);
      } else if (entry.type === "tech-placement") {
        const tileId = entry.details?.tileId || entry.details?.selected?.tileId || "unknown";
        const techType = getTechTypeFromTile(tileId);
        increment(profile.techTypeCounts, techType || "unknown");
        addProfileMetric(profile, "techPlacementCount", 1);
      } else if (entry.type === "scan-target") {
        const target = [
          entry.details?.pendingType || "scan",
          entry.details?.nebulaId || entry.details?.sectorX || "unknown",
        ].join(":");
        increment(profile.scanTargetCounts, target);
        addProfileMetric(profile, "scanTargetCount", 1);
      } else if (entry.type === "move-path") {
        const routeTargetKey = getRouteTargetKey(getRouteTargetFromEntry(entry));
        if (routeTargetKey) increment(profile.routeTargetCounts, routeTargetKey);
        const followupKey = getMoveFollowupKey(entry);
        if (followupKey) increment(profile.moveFollowupCounts, followupKey);
      } else if (entry.type === "final-score-mark") {
        const selected = getFinalScoreMarkSelection(entry);
        increment(profile.decisionCounts, entry.type);
        addProfileMetric(profile, "finalScoreMarkCount", 1);
        addProfileMetric(profile, "finalScoreImmediateValue", numeric(selected.immediateScore));
      } else if (["play-card", "pick-card", "hand-scan", "land-target", "alien-trace", "move-payment"].includes(entry.type)) {
        increment(profile.decisionCounts, entry.type);
      }
    }

    return Object.values(profiles)
      .map(finalizePlayerProfile)
      .sort((left, right) => right.finalScore - left.finalScore || left.playerLabel.localeCompare(right.playerLabel));
  }

  const ROUTE_METRICS = Object.freeze([
    "finalScore",
    "tileScore",
    "cardScore",
    "completedTaskCount",
    "techCount",
    "rocketCount",
    "basicMainRatio",
    "engineRatio",
    "quickRatio",
    "passRatio",
    "scanCount",
    "playCardCount",
    "researchTechCount",
    "moveCount",
    "orbitLandCount",
    "passCount",
    "techPlacementCount",
    "scanTargetCount",
    "routeTargetCount",
    "moveFollowupCount",
    "turnPlanCount",
    "cardSynergyCount",
    "techSynergyCount",
    "mainThenQuickCount",
    "planMoveCount",
    "planScanCount",
    "planLaunchCount",
    "planResearchTechCount",
    "planOrbitLandCount",
    "planTaskCount",
    "planFinalCount",
    "finalScoreMarkCount",
    "finalScoreImmediateValue",
  ]);

  const STRATEGY_WEIGHT_KEYS = Object.freeze([
    "engine",
    "playCard",
    "tech",
    "scan",
    "route",
    "move",
    "orbitLand",
    "task",
    "final",
    "pass",
  ]);

  const DEFAULT_STRATEGY_WEIGHTS = Object.freeze(
    STRATEGY_WEIGHT_KEYS.reduce((weights, key) => ({ ...weights, [key]: 1 }), {}),
  );

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, numeric(value)));
  }

  function normalizeStrategyWeights(weights = {}) {
    const normalized = {};
    for (const key of STRATEGY_WEIGHT_KEYS) {
      normalized[key] = roundRatio(clamp(weights[key] ?? DEFAULT_STRATEGY_WEIGHTS[key], 0.6, 1.6));
    }
    return normalized;
  }

  function applyStrategyWeightDelta(weights, rationale, key, delta, reason) {
    if (!key || !Number.isFinite(Number(delta)) || Number(delta) === 0) return;
    weights[key] = (weights[key] || 1) + Number(delta);
    rationale.push({
      key,
      delta: roundRatio(delta),
      reason,
    });
  }

  function deriveStrategyTuning(analysis = {}) {
    const deltas = analysis.winnerProfileDeltas || analysis.winnerProfileComparison?.delta || {};
    const ratios = analysis.actionCategoryRatios || {};
    const opportunities = analysis.opportunities || {};
    const candidateStats = analysis.candidateStats || {};
    const candidateScoreStats = analysis.candidateScoreStats || {};
    const gameCount = Math.max(1, numeric(analysis.gameCount || 1));
    const completionRate = analysis.completionRate == null ? 1 : clamp(analysis.completionRate, 0, 1);
    const blockedGames = numeric(analysis.blockedGames);
    const confidence = roundRatio(Math.max(0.2, completionRate - Math.min(0.4, blockedGames / gameCount)));
    const weights = { ...DEFAULT_STRATEGY_WEIGHTS };
    const rationale = [];

    const engineDelta = numeric(deltas.engineRatio);
    if (engineDelta > 0.04) {
      applyStrategyWeightDelta(weights, rationale, "engine", Math.min(0.12, engineDelta * 0.7), "胜者卡牌/科技行动占比更高");
      applyStrategyWeightDelta(weights, rationale, "playCard", Math.min(0.08, engineDelta * 0.4), "胜者路线更依赖打牌");
    } else if (engineDelta < -0.08 && numeric(ratios.engine) > 0.35) {
      applyStrategyWeightDelta(weights, rationale, "engine", Math.max(-0.1, engineDelta * 0.4), "引擎行动占比偏高但未体现胜者优势");
    }

    if (numeric(deltas.playCardCount) > 0 || numeric(deltas.cardScore) >= 3) {
      applyStrategyWeightDelta(weights, rationale, "playCard", Math.min(0.12, 0.04 + numeric(deltas.cardScore) * 0.01), "胜者打牌或终局牌收益更高");
      applyStrategyWeightDelta(weights, rationale, "final", Math.min(0.1, Math.max(0.03, numeric(deltas.cardScore) * 0.01)), "胜者终局牌得分领先");
    }

    if (numeric(deltas.completedTaskCount) >= 0.5) {
      applyStrategyWeightDelta(weights, rationale, "task", Math.min(0.14, 0.06 + numeric(deltas.completedTaskCount) * 0.03), "胜者任务完成数领先");
      applyStrategyWeightDelta(weights, rationale, "playCard", 0.04, "任务路线需要更重视保留和打牌");
    }

    if (numeric(deltas.techCount) >= 0.5 || numeric(deltas.researchTechCount) >= 0.5) {
      applyStrategyWeightDelta(weights, rationale, "tech", Math.min(0.16, 0.06 + Math.max(numeric(deltas.techCount), numeric(deltas.researchTechCount)) * 0.04), "胜者科技路线领先");
      applyStrategyWeightDelta(weights, rationale, "engine", 0.04, "科技属于核心引擎行动");
    }

    if (numeric(deltas.scanCount) >= 0.5 || numeric(deltas.scanTargetCount) >= 1) {
      applyStrategyWeightDelta(weights, rationale, "scan", Math.min(0.16, 0.05 + Math.max(numeric(deltas.scanCount), numeric(deltas.scanTargetCount) * 0.03)), "胜者扫描推进领先");
    }

    if (numeric(deltas.moveCount) >= 1 || numeric(deltas.rocketCount) >= 0.5) {
      applyStrategyWeightDelta(weights, rationale, "move", Math.min(0.12, 0.04 + numeric(deltas.moveCount) * 0.02), "胜者移动/探测器布局更积极");
      applyStrategyWeightDelta(weights, rationale, "route", 0.04, "移动优势需要路线目标支撑");
    }

    if (numeric(deltas.routeTargetCount) >= 0.5) {
      applyStrategyWeightDelta(weights, rationale, "route", Math.min(0.12, 0.04 + numeric(deltas.routeTargetCount) * 0.03), "胜者移动更常服务明确路线目标");
      applyStrategyWeightDelta(weights, rationale, "move", 0.04, "目标导向移动体现胜者优势");
    }

    if (numeric(deltas.moveFollowupCount) >= 0.5) {
      applyStrategyWeightDelta(weights, rationale, "move", Math.min(0.1, 0.03 + numeric(deltas.moveFollowupCount) * 0.025), "胜者更常用移动衔接后续主行动");
      applyStrategyWeightDelta(weights, rationale, "orbitLand", Math.min(0.12, 0.04 + numeric(deltas.moveFollowupCount) * 0.03), "移动后接环绕/登陆体现胜者优势");
      applyStrategyWeightDelta(weights, rationale, "route", 0.04, "路线前瞻需要更高权重");
    }

    if (numeric(deltas.turnPlanCount) >= 0.5) {
      applyStrategyWeightDelta(weights, rationale, "move", Math.min(0.1, 0.03 + numeric(deltas.turnPlanCount) * 0.025), "胜者更常执行一回合组合计划");
      applyStrategyWeightDelta(weights, rationale, "route", 0.04, "组合计划需要路线目标支撑");
      applyStrategyWeightDelta(weights, rationale, "engine", 0.03, "一回合组合计划体现引擎化行动优势");
    }

    if (numeric(deltas.cardSynergyCount) >= 0.5) {
      applyStrategyWeightDelta(weights, rationale, "playCard", Math.min(0.12, 0.05 + numeric(deltas.cardSynergyCount) * 0.025), "胜者更常通过打牌组合计划补足行动收益");
      applyStrategyWeightDelta(weights, rationale, "engine", 0.03, "打牌组合计划属于核心引擎路线");
    }

    if (numeric(deltas.techSynergyCount) >= 0.5) {
      applyStrategyWeightDelta(weights, rationale, "tech", Math.min(0.12, 0.05 + numeric(deltas.techSynergyCount) * 0.025), "胜者更常通过科技组合计划补足行动收益");
      applyStrategyWeightDelta(weights, rationale, "engine", 0.03, "科技组合计划属于核心引擎路线");
    }

    if (numeric(deltas.mainThenQuickCount) >= 0.5) {
      applyStrategyWeightDelta(weights, rationale, "move", Math.min(0.08, 0.03 + numeric(deltas.mainThenQuickCount) * 0.02), "胜者更常主行动后衔接快速行动");
      applyStrategyWeightDelta(weights, rationale, "route", 0.03, "主行动后快速行动需要路线目标支撑");
    }

    if (numeric(deltas.planScanCount) >= 0.5) {
      applyStrategyWeightDelta(weights, rationale, "scan", Math.min(0.1, 0.04 + numeric(deltas.planScanCount) * 0.02), "胜者组合计划更常服务扫描路线");
    }

    if (numeric(deltas.planResearchTechCount) >= 0.5) {
      applyStrategyWeightDelta(weights, rationale, "tech", Math.min(0.1, 0.04 + numeric(deltas.planResearchTechCount) * 0.02), "胜者组合计划更常服务科技路线");
    }

    if (numeric(deltas.planOrbitLandCount) >= 0.5) {
      applyStrategyWeightDelta(weights, rationale, "orbitLand", Math.min(0.1, 0.04 + numeric(deltas.planOrbitLandCount) * 0.02), "胜者组合计划更常服务环绕/登陆路线");
      applyStrategyWeightDelta(weights, rationale, "route", 0.03, "环绕/登陆组合需要路线目标支撑");
    }

    if (numeric(deltas.planTaskCount) >= 0.5) {
      applyStrategyWeightDelta(weights, rationale, "task", Math.min(0.1, 0.04 + numeric(deltas.planTaskCount) * 0.02), "胜者组合计划更常服务任务路线");
      applyStrategyWeightDelta(weights, rationale, "playCard", 0.03, "任务路线通常需要保留牌和打牌支撑");
    }

    if (numeric(deltas.planFinalCount) >= 0.5) {
      applyStrategyWeightDelta(weights, rationale, "final", Math.min(0.1, 0.04 + numeric(deltas.planFinalCount) * 0.02), "胜者组合计划更常服务终局路线");
      applyStrategyWeightDelta(weights, rationale, "playCard", 0.03, "终局路线通常需要终局牌和打牌支撑");
    }

    if (numeric(deltas.finalScoreMarkCount) >= 0.5 || numeric(deltas.finalScoreImmediateValue) >= 2) {
      applyStrategyWeightDelta(weights, rationale, "final", Math.min(0.12, 0.04 + numeric(deltas.finalScoreImmediateValue) * 0.01), "胜者终局板块标记价值更高");
      applyStrategyWeightDelta(weights, rationale, "engine", 0.02, "终局板块需要提前用引擎行动铺垫");
    }

    if (numeric(deltas.orbitLandCount) >= 0.5) {
      applyStrategyWeightDelta(weights, rationale, "orbitLand", Math.min(0.12, 0.05 + numeric(deltas.orbitLandCount) * 0.03), "胜者环绕/登陆数量领先");
      applyStrategyWeightDelta(weights, rationale, "route", 0.04, "星球路线收益更高");
    }

    if (numeric(deltas.passRatio) < -0.05 || numeric(opportunities.passWithAvailableMain) > 0) {
      applyStrategyWeightDelta(weights, rationale, "pass", -0.08, "PASS 机会成本偏高，需要降低过早 PASS 倾向");
      applyStrategyWeightDelta(weights, rationale, "engine", 0.03, "PASS 前优先尝试高价值引擎行动");
    } else if (numeric(deltas.passRatio) > 0.08 && numeric(deltas.finalScore) > 0) {
      applyStrategyWeightDelta(weights, rationale, "pass", 0.04, "胜者 PASS 比例更高且得分领先，保留收入/轮序价值");
    }

    if ((candidateStats.playCard?.availableNotSelected || 0) > (candidateStats.playCard?.selected || 0) * 2) {
      applyStrategyWeightDelta(weights, rationale, "playCard", 0.08, "大量可打牌未被选择");
      applyStrategyWeightDelta(weights, rationale, "task", 0.04, "打牌价值应更多绑定任务路线");
    }

    if ((candidateStats.researchTech?.availableNotSelected || 0) > (candidateStats.researchTech?.selected || 0) * 2) {
      applyStrategyWeightDelta(weights, rationale, "tech", 0.08, "大量可研究科技未被选择");
    }

    if (numeric(candidateScoreStats.playCard?.missedAsBest) > 0) {
      applyStrategyWeightDelta(weights, rationale, "playCard", Math.min(0.1, 0.04 + numeric(candidateScoreStats.playCard.averageMissedGap) * 0.01), "高分打牌候选多次成为最佳但未被选择");
      applyStrategyWeightDelta(weights, rationale, "engine", 0.02, "高分打牌候选被错过说明引擎行动仍需更高权重");
    }

    if (numeric(candidateScoreStats.researchTech?.missedAsBest) > 0) {
      applyStrategyWeightDelta(weights, rationale, "tech", Math.min(0.1, 0.04 + numeric(candidateScoreStats.researchTech.averageMissedGap) * 0.01), "高分科技候选多次成为最佳但未被选择");
      applyStrategyWeightDelta(weights, rationale, "engine", 0.02, "高分科技候选被错过说明引擎行动仍需更高权重");
    }

    if (numeric(candidateScoreStats.scan?.missedAsBest) > 0) {
      applyStrategyWeightDelta(weights, rationale, "scan", Math.min(0.08, 0.03 + numeric(candidateScoreStats.scan.averageMissedGap) * 0.006), "高分扫描候选多次成为最佳但未被选择");
    }

    if (numeric(ratios.basicMain) >= 0.45 && numeric(ratios.engine) < 0.25) {
      applyStrategyWeightDelta(weights, rationale, "engine", 0.1, "基础主行动占比偏高，引擎行动占比偏低");
      applyStrategyWeightDelta(weights, rationale, "task", 0.04, "基础行动需要服务任务路线");
      applyStrategyWeightDelta(weights, rationale, "final", 0.04, "基础行动需要服务终局路线");
    }

    return {
      id: "winner-delta-v1",
      confidence,
      weights: normalizeStrategyWeights(weights),
      baselineWeights: { ...DEFAULT_STRATEGY_WEIGHTS },
      deltas: { ...deltas },
      rationale,
    };
  }

  function getStrategyHistorySummary(entry = {}) {
    return entry.summary || entry.batchSummary || entry.analysisSummary || entry;
  }

  function getStrategyHistoryTuning(entry = {}) {
    const summary = getStrategyHistorySummary(entry);
    return entry.strategyTuning || summary.strategyTuning || deriveStrategyTuning(summary);
  }

  function getStrategyHistoryABComparison(entry = {}) {
    return entry.abComparison || entry.strategyABComparison || entry.comparison || null;
  }

  function getStrategyHistorySelectedVariant(entry = {}, tuning = {}) {
    if (entry.selectedVariant || entry.abSelection) return entry.selectedVariant || entry.abSelection;
    if (tuning?.id === "ab-baseline-v1") return "baseline";
    if (tuning?.id === "ab-tuned-v1") return "tuned";
    return null;
  }

  function getStrategyHistoryEntryWeight(entry = {}) {
    const summary = getStrategyHistorySummary(entry);
    const tuning = getStrategyHistoryTuning(entry);
    const gameCount = Math.max(1, numeric(summary.gameCount || summary.gamesRun || entry.gamesRun || 1));
    const completedGames = numeric(summary.completedGames);
    const blockedGames = numeric(summary.blockedGames);
    const completionRate = summary.completionRate == null
      ? (completedGames ? completedGames / gameCount : 1)
      : clamp(summary.completionRate, 0, 1);
    const confidence = clamp(tuning?.confidence ?? 0.5, 0.05, 1);
    const blockedPenalty = Math.min(0.5, blockedGames / gameCount);
    let weight = gameCount * confidence * Math.max(0.1, completionRate - blockedPenalty);
    const abComparison = getStrategyHistoryABComparison(entry);
    if (abComparison) {
      const selectedVariant = getStrategyHistorySelectedVariant(entry, tuning);
      const scoreDelta = numeric(abComparison.verdict?.scoreDelta ?? abComparison.deltas?.averageWinnerScore);
      const blockedDelta = numeric(abComparison.verdict?.blockedDelta ?? abComparison.deltas?.blockedGames);
      const completionDelta = numeric(abComparison.verdict?.completionDelta ?? abComparison.deltas?.completionRate);
      if (abComparison.verdict?.improved || (scoreDelta > 0 && blockedDelta <= 0 && completionDelta >= 0)) {
        weight *= 1.25 + Math.min(0.75, scoreDelta / 10);
      } else if (selectedVariant === "baseline") {
        weight *= 1.1
          + Math.min(0.9, Math.max(0, -scoreDelta) / 10)
          + Math.min(0.5, Math.max(0, blockedDelta) * 0.25)
          + Math.min(0.4, Math.max(0, -completionDelta) * 0.5);
      } else if (scoreDelta < 0 || blockedDelta > 0 || completionDelta < 0) {
        weight *= 0.15;
      } else {
        weight *= 0.35;
      }
    }
    return Math.max(0.05, weight);
  }

  function addWeightedValues(target, source = {}, weight = 1) {
    for (const [key, value] of Object.entries(source || {})) {
      target[key] = numeric(target[key]) + numeric(value) * weight;
    }
  }

  function divideWeightedValues(source = {}, totalWeight = 1) {
    const divisor = Math.max(0.0001, numeric(totalWeight) || 1);
    return Object.fromEntries(
      Object.entries(source || {}).map(([key, value]) => [key, roundRatio(numeric(value) / divisor)]),
    );
  }

  function aggregateStrategyRationale(entries = []) {
    const grouped = {};
    for (const entry of entries) {
      const tuning = getStrategyHistoryTuning(entry);
      for (const item of tuning?.rationale || []) {
        const key = [item.key || "unknown", item.reason || ""].join("|");
        if (!grouped[key]) {
          grouped[key] = {
            key: item.key || "unknown",
            reason: item.reason || "",
            count: 0,
            totalDelta: 0,
          };
        }
        grouped[key].count += 1;
        grouped[key].totalDelta += numeric(item.delta);
      }
    }
    return Object.values(grouped)
      .map((item) => ({
        key: item.key,
        reason: item.reason,
        count: item.count,
        averageDelta: roundRatio(item.totalDelta / Math.max(1, item.count)),
      }))
      .sort((left, right) => right.count - left.count || Math.abs(right.averageDelta) - Math.abs(left.averageDelta))
      .slice(0, 12);
  }

  function compactStrategyHistoryEntry(entry = {}) {
    const summary = getStrategyHistorySummary(entry);
    const tuning = getStrategyHistoryTuning(entry);
    return {
      kind: entry.kind || (getStrategyHistoryABComparison(entry) ? "ab-test" : "batch"),
      id: entry.id || null,
      label: entry.label || null,
      createdAt: entry.createdAt || null,
      gameCount: numeric(summary.gameCount || summary.gamesRun || entry.gamesRun),
      completedGames: numeric(summary.completedGames),
      blockedGames: numeric(summary.blockedGames),
      completionRate: summary.completionRate == null ? null : roundRatio(summary.completionRate),
      averageWinnerScore: numeric(summary.averageWinnerScore),
      confidence: tuning?.confidence == null ? null : roundRatio(tuning.confidence),
      weights: tuning?.weights ? normalizeStrategyWeights(tuning.weights) : null,
      selectedVariant: getStrategyHistorySelectedVariant(entry, tuning),
      abVerdict: getStrategyHistoryABComparison(entry)?.verdict || null,
    };
  }

  function summarizeStrategyTuningHistory(entries = [], options = {}) {
    const validEntries = (entries || [])
      .filter((entry) => getStrategyHistoryTuning(entry)?.weights);
    const baseWeights = normalizeStrategyWeights(options.baseWeights || options.currentWeights || DEFAULT_STRATEGY_WEIGHTS);
    const learningRate = clamp(options.learningRate ?? 0.5, 0, 1);
    if (!validEntries.length) {
      return {
        id: "strategy-history-v1",
        entryCount: 0,
        totalGames: 0,
        completedGames: 0,
        blockedGames: 0,
        completionRate: 0,
        confidence: 0,
        learningRate,
        baselineWeights: { ...DEFAULT_STRATEGY_WEIGHTS },
        baseWeights,
        targetWeights: { ...baseWeights },
        weights: { ...baseWeights },
        averageDeltas: {},
        rationale: [],
        entries: [],
      };
    }

    const weightedWeights = {};
    const weightedDeltas = {};
    let totalWeight = 0;
    let totalGames = 0;
    let completedGames = 0;
    let blockedGames = 0;
    let totalWinnerScore = 0;
    let winnerScoreGameCount = 0;

    for (const entry of validEntries) {
      const summary = getStrategyHistorySummary(entry);
      const tuning = getStrategyHistoryTuning(entry);
      const weight = getStrategyHistoryEntryWeight(entry);
      totalWeight += weight;
      addWeightedValues(weightedWeights, normalizeStrategyWeights(tuning.weights), weight);
      addWeightedValues(weightedDeltas, tuning.deltas || summary.winnerProfileDeltas || {}, weight);

      const gameCount = Math.max(1, numeric(summary.gameCount || summary.gamesRun || entry.gamesRun || 1));
      totalGames += gameCount;
      completedGames += numeric(summary.completedGames);
      blockedGames += numeric(summary.blockedGames);
      if (summary.averageWinnerScore != null) {
        totalWinnerScore += numeric(summary.averageWinnerScore) * gameCount;
        winnerScoreGameCount += gameCount;
      }
    }

    const targetWeights = normalizeStrategyWeights(divideWeightedValues(weightedWeights, totalWeight));
    const weights = {};
    for (const key of STRATEGY_WEIGHT_KEYS) {
      weights[key] = roundRatio(numeric(baseWeights[key]) + (numeric(targetWeights[key]) - numeric(baseWeights[key])) * learningRate);
    }

    return {
      id: "strategy-history-v1",
      entryCount: validEntries.length,
      totalGames,
      completedGames,
      blockedGames,
      completionRate: totalGames ? roundRatio(completedGames / totalGames) : 0,
      averageWinnerScore: winnerScoreGameCount ? roundRatio(totalWinnerScore / winnerScoreGameCount) : 0,
      confidence: roundRatio(Math.min(1, totalWeight / Math.max(1, totalGames))),
      learningRate,
      baselineWeights: { ...DEFAULT_STRATEGY_WEIGHTS },
      baseWeights,
      targetWeights,
      weights: normalizeStrategyWeights(weights),
      averageDeltas: divideWeightedValues(weightedDeltas, totalWeight),
      rationale: aggregateStrategyRationale(validEntries),
      entries: validEntries.map(compactStrategyHistoryEntry),
    };
  }

  function getBattleSummary(result = {}) {
    return result.summary || result.batchSummary || result;
  }

  function diffNumericMaps(tuned = {}, baseline = {}) {
    const keys = new Set([...Object.keys(tuned || {}), ...Object.keys(baseline || {})]);
    const diff = {};
    for (const key of keys) {
      diff[key] = roundRatio(numeric(tuned?.[key]) - numeric(baseline?.[key]));
    }
    return diff;
  }

  function diffCandidateScoreStats(tuned = {}, baseline = {}) {
    const fields = [
      "offered",
      "available",
      "selected",
      "bestAvailable",
      "missedAsBest",
      "missedGapTotal",
      "averageMissedGap",
      "maxMissedGap",
    ];
    const keys = new Set([...Object.keys(tuned || {}), ...Object.keys(baseline || {})]);
    const diff = {};
    for (const key of keys) {
      diff[key] = {};
      for (const field of fields) {
        diff[key][field] = roundRatio(numeric(tuned?.[key]?.[field]) - numeric(baseline?.[key]?.[field]));
      }
    }
    return diff;
  }

  function compareStrategyBatchResults(baselineResult = {}, tunedResult = {}, options = {}) {
    const baseline = getBattleSummary(baselineResult);
    const tuned = getBattleSummary(tunedResult);
    const baselineGames = numeric(baseline.gameCount || baselineResult.gamesRun);
    const tunedGames = numeric(tuned.gameCount || tunedResult.gamesRun);
    const gameCount = Math.min(baselineGames || 0, tunedGames || 0);
    const scoreDelta = roundRatio(numeric(tuned.averageWinnerScore) - numeric(baseline.averageWinnerScore));
    const completionDelta = roundRatio(numeric(tuned.completionRate) - numeric(baseline.completionRate));
    const blockedDelta = roundRatio(numeric(tuned.blockedGames) - numeric(baseline.blockedGames));
    return {
      id: "strategy-ab-v1",
      label: options.label || null,
      seedBase: options.seedBase || options.seed || null,
      gameCount,
      baseline: {
        gameCount: baselineGames,
        completedGames: numeric(baseline.completedGames),
        blockedGames: numeric(baseline.blockedGames),
        completionRate: numeric(baseline.completionRate),
        averageWinnerScore: numeric(baseline.averageWinnerScore),
        actionCategoryRatios: baseline.actionCategoryRatios || {},
        scoreOpportunities: baseline.scoreOpportunities || {},
        candidateScoreStats: baseline.candidateScoreStats || {},
        topScoreGaps: baseline.topScoreGaps || [],
        winnerProfileDeltas: baseline.winnerProfileDeltas || {},
        routeTargetCounts: baseline.routeTargetCounts || {},
        moveFollowupCounts: baseline.moveFollowupCounts || {},
        turnPlanCounts: baseline.turnPlanCounts || {},
        turnPlanTypeCounts: baseline.turnPlanTypeCounts || {},
        turnPlanActionCounts: baseline.turnPlanActionCounts || {},
        strategyWeights: baselineResult.strategyWeights || baseline.strategyWeights || null,
      },
      tuned: {
        gameCount: tunedGames,
        completedGames: numeric(tuned.completedGames),
        blockedGames: numeric(tuned.blockedGames),
        completionRate: numeric(tuned.completionRate),
        averageWinnerScore: numeric(tuned.averageWinnerScore),
        actionCategoryRatios: tuned.actionCategoryRatios || {},
        scoreOpportunities: tuned.scoreOpportunities || {},
        candidateScoreStats: tuned.candidateScoreStats || {},
        topScoreGaps: tuned.topScoreGaps || [],
        winnerProfileDeltas: tuned.winnerProfileDeltas || {},
        routeTargetCounts: tuned.routeTargetCounts || {},
        moveFollowupCounts: tuned.moveFollowupCounts || {},
        turnPlanCounts: tuned.turnPlanCounts || {},
        turnPlanTypeCounts: tuned.turnPlanTypeCounts || {},
        turnPlanActionCounts: tuned.turnPlanActionCounts || {},
        strategyWeights: tunedResult.strategyWeights || tuned.strategyWeights || null,
      },
      deltas: {
        averageWinnerScore: scoreDelta,
        completionRate: completionDelta,
        blockedGames: blockedDelta,
        actionCategoryRatios: diffNumericMaps(tuned.actionCategoryRatios, baseline.actionCategoryRatios),
        scoreOpportunities: diffNumericMaps(tuned.scoreOpportunities, baseline.scoreOpportunities),
        candidateScoreStats: diffCandidateScoreStats(tuned.candidateScoreStats, baseline.candidateScoreStats),
        winnerProfileDeltas: diffNumericMaps(tuned.winnerProfileDeltas, baseline.winnerProfileDeltas),
        routeTargetCounts: diffNumericMaps(tuned.routeTargetCounts, baseline.routeTargetCounts),
        moveFollowupCounts: diffNumericMaps(tuned.moveFollowupCounts, baseline.moveFollowupCounts),
        turnPlanCounts: diffNumericMaps(tuned.turnPlanCounts, baseline.turnPlanCounts),
        turnPlanTypeCounts: diffNumericMaps(tuned.turnPlanTypeCounts, baseline.turnPlanTypeCounts),
        turnPlanActionCounts: diffNumericMaps(tuned.turnPlanActionCounts, baseline.turnPlanActionCounts),
      },
      verdict: {
        improved: scoreDelta > 0 && blockedDelta <= 0 && completionDelta >= 0,
        scoreDelta,
        completionDelta,
        blockedDelta,
      },
    };
  }

  function averageProfileMetrics(profiles = []) {
    const averages = {};
    const count = profiles.length;
    if (!count) return averages;
    for (const metric of ROUTE_METRICS) {
      averages[metric] = roundRatio(
        profiles.reduce((total, profile) => total + numeric(profile.metrics?.[metric]), 0) / count,
      );
    }
    return averages;
  }

  function diffProfileMetrics(left = {}, right = {}) {
    const delta = {};
    for (const metric of ROUTE_METRICS) {
      delta[metric] = roundRatio(numeric(left[metric]) - numeric(right[metric]));
    }
    return delta;
  }

  function compareWinnerProfile(playerProfiles = []) {
    if (!playerProfiles.length) return null;
    const winner = playerProfiles[0];
    const rest = playerProfiles.slice(1);
    const winnerMetrics = averageProfileMetrics([winner]);
    const nonWinnerMetrics = averageProfileMetrics(rest);
    return {
      winner,
      nonWinnerAverage: nonWinnerMetrics,
      delta: diffProfileMetrics(winnerMetrics, nonWinnerMetrics),
    };
  }

  function normalizePlayerResults(playerResults = []) {
    return (playerResults || [])
      .map((player) => ({
        playerId: player.playerId || player.id || null,
        playerLabel: player.playerLabel || player.label || player.name || player.playerId || "unknown",
        finalScore: numeric(player.finalScore ?? player.totalScore ?? player.resources?.score),
        baseScore: numeric(player.baseScore ?? player.resources?.score),
        tileScore: numeric(player.tileScore),
        cardScore: numeric(player.cardScore),
        resources: player.resources || {},
        completedTaskCount: numeric(player.completedTaskCount),
        reservedCount: numeric(player.reservedCount),
        handSize: numeric(player.handSize ?? player.resources?.handSize),
        techCount: numeric(player.techCount),
        rocketCount: numeric(player.rocketCount),
      }))
      .sort((left, right) => right.finalScore - left.finalScore || left.playerLabel.localeCompare(right.playerLabel));
  }

  function buildRecommendations(analysis) {
    const recommendations = [];
    const actionTotal = analysis.turnActionCount || 0;
    const ratios = analysis.actionCategoryRatios || {};
    const opportunities = analysis.opportunities || {};
    const candidateStats = analysis.candidateStats || {};
    const candidateScoreStats = analysis.candidateScoreStats || {};

    if (actionTotal >= 10 && ratios.basicMain >= 0.45 && ratios.engine < 0.25) {
      recommendations.push({
        id: "raise-engine-synergy",
        priority: "high",
        message: "基础主要行动占比偏高，下一步应让卡牌、科技、终局板块为行动评分提供加成，而不是只按固定行动优先级选择。",
      });
    }
    if (opportunities.passWithAvailableMain > 0) {
      recommendations.push({
        id: "score-pass-opportunity-cost",
        priority: "high",
        message: "出现 PASS 时仍有可用主行动的局面，需要显式计算 PASS 收入/轮序收益与剩余行动机会成本。",
      });
    }
    if (opportunities.endTurnWithAvailableMove > 0) {
      recommendations.push({
        id: "targeted-post-action-move",
        priority: "medium",
        message: "出现结束回合时仍有可用移动的局面，移动评分应绑定星球、星云、任务牌或终局目标距离。",
      });
    }
    if (opportunities.selectedBelowBestScore > 0) {
      recommendations.push({
        id: "inspect-score-gap",
        priority: "high",
        message: "出现实际选择低于最高分可用候选的局面，需要检查行动基础偏置、候选 score 和策略选择函数是否一致。",
      });
    }
    if ((candidateStats.playCard?.availableNotSelected || 0) > (candidateStats.playCard?.selected || 0) * 2) {
      recommendations.push({
        id: "improve-card-value",
        priority: "high",
        message: "可打牌机会大量未被选择，应按卡牌即时收益、任务/终局协同、左上角机会成本重新计算卡牌价值。",
      });
    }
    if (numeric(candidateScoreStats.playCard?.missedAsBest) > 0) {
      recommendations.push({
        id: "inspect-card-score-gap",
        priority: "high",
        message: "打牌曾是最高分候选但未被选择，应检查打牌候选分与顶层行动偏置是否被其他行动压过。",
      });
    }
    if ((candidateStats.researchTech?.availableNotSelected || 0) > (candidateStats.researchTech?.selected || 0) * 2) {
      recommendations.push({
        id: "contextual-tech-value",
        priority: "medium",
        message: "可研究科技机会大量未被选择，应按当前资源、扫描收益、路线目标和科技板 bonus 调整科技价值。",
      });
    }
    if (numeric(candidateScoreStats.researchTech?.missedAsBest) > 0) {
      recommendations.push({
        id: "inspect-tech-score-gap",
        priority: "medium",
        message: "科技曾是最高分候选但未被选择，应检查科技候选分、顶层 engine 权重和行动基础偏置。",
      });
    }
    if ((analysis.movePayment?.count || 0) > 0 && ratios.quick > 0.25) {
      recommendations.push({
        id: "route-planner",
        priority: "high",
        message: "移动占比不低，建议先实现目标导向路线评分，避免只按方向偏好移动。",
      });
    }
    if ((analysis.bugs || []).length > 0) {
      recommendations.push({
        id: "close-blocking-decisions",
        priority: "high",
        message: "仍有 AI 阻塞，需要优先把阻塞类型对应的 pending 子决策收口或过滤掉不可结算候选。",
      });
    }
    const routeDelta = analysis.winnerProfileComparison?.delta || analysis.winnerProfileDeltas || {};
    if (numeric(routeDelta.engineRatio) >= 0.08) {
      recommendations.push({
        id: "winner-engine-route",
        priority: "medium",
        message: "胜者更依赖卡牌/科技行动，后续策略应继续把任务、终局和科技触发反向接入 playCard/researchTech 评分。",
      });
    }
    if (numeric(routeDelta.completedTaskCount) >= 1 || numeric(routeDelta.cardScore) >= 4) {
      recommendations.push({
        id: "winner-task-card-route",
        priority: "medium",
        message: "胜者任务/终局牌收益更高，建议优先优化任务牌条件识别、保留牌路线需求和任务完成前置行动评分。",
      });
    }
    if (numeric(routeDelta.techCount) >= 1 || numeric(routeDelta.researchTechCount) >= 1) {
      recommendations.push({
        id: "winner-tech-route",
        priority: "medium",
        message: "胜者科技数量或研究行动明显领先，科技评分应继续按终局 D 板、任务科技颜色和触发器需求动态加权。",
      });
    }
    if (numeric(routeDelta.scanCount) >= 1 || numeric(routeDelta.scanTargetCount) >= 2) {
      recommendations.push({
        id: "winner-scan-route",
        priority: "medium",
        message: "胜者扫描推进更明显，扫描评分应继续纳入任务牌颜色、终局 B 板和对手即将完成扇区的阻断价值。",
      });
    }
    if (numeric(routeDelta.routeTargetCount) >= 1) {
      recommendations.push({
        id: "winner-targeted-route",
        priority: "medium",
        message: "胜者移动更常指向明确路线目标，应继续提高 route/move 权重，并扩展任务牌和终局目标识别。",
      });
    }
    if (numeric(routeDelta.moveFollowupCount) >= 1) {
      recommendations.push({
        id: "winner-move-followup-route",
        priority: "medium",
        message: "胜者更常用移动衔接环绕/登陆，应继续优化一回合内“移动 -> 主行动”的组合估值。",
      });
    }
    if (numeric(routeDelta.turnPlanCount) >= 1) {
      recommendations.push({
        id: "winner-turn-plan-route",
        priority: "medium",
        message: "胜者更常执行一回合组合计划，应继续扩展“主行动 -> 快速行动”和“快速行动 -> 主行动”的浅搜索。",
      });
    }
    if (numeric(routeDelta.cardSynergyCount) >= 1) {
      recommendations.push({
        id: "winner-card-synergy-route",
        priority: "medium",
        message: "胜者更常通过打牌组合计划补足基础行动收益，应继续细化卡牌任务完成概率、触发器可达性和终局牌预期分。",
      });
    }
    if (numeric(routeDelta.techSynergyCount) >= 1) {
      recommendations.push({
        id: "winner-tech-synergy-route",
        priority: "medium",
        message: "胜者更常通过科技组合计划补足基础行动收益，应继续让路线、扫描、任务和终局需求反向影响科技颜色选择。",
      });
    }
    if (numeric(routeDelta.planScanCount) >= 1) {
      recommendations.push({
        id: "winner-plan-scan-route",
        priority: "medium",
        message: "胜者组合计划更常服务扫描，应继续把任务颜色、终局 B 板和对手扇区威胁纳入扫描评分。",
      });
    }
    if (numeric(routeDelta.planTaskCount) >= 1 || numeric(routeDelta.planFinalCount) >= 1) {
      recommendations.push({
        id: "winner-plan-engine-goals",
        priority: "medium",
        message: "胜者组合计划更常服务任务/终局，应继续把任务完成前置条件和终局公式预期分接入打牌与科技评分。",
      });
    }

    return recommendations;
  }

  function analyzeBattleReport(report = {}) {
    const logs = Array.isArray(report.logs) ? report.logs : [];
    const bugs = Array.isArray(report.bugs) ? report.bugs : [];
    const typeCounts = {};
    const actionCounts = {};
    const actionCategoryCounts = {};
    const playerActionCounts = {};
    const candidateStats = {};
    const candidateScoreStats = {};
    const effectCounts = {};
    const playCards = {};
    const techTiles = {};
    const scanTargets = {};
    const moveDirections = {};
    const routeTargets = {};
    const moveFollowups = {};
    const turnPlans = {};
    const turnPlanTypes = {};
    const turnPlanActions = {};
    const finalScoreMarks = {};
    const finalScoreFormulas = {};
    const decisionTargets = {};
    const bugCounts = {};
    const opportunities = {
      passWithAvailableMain: 0,
      endTurnWithAvailableMove: 0,
      selectedUnavailableCandidate: 0,
      selectedBelowBestScore: 0,
    };
    const scoreOpportunities = {
      selectedBelowBest: 0,
      totalGap: 0,
      maxGap: 0,
    };
    const movePayment = {
      count: 0,
      requiredMovePoints: 0,
      energyCost: 0,
      discardedMoveCards: 0,
    };

    for (const entry of logs) {
      increment(typeCounts, entry.type);
      if (entry.type === "effect") {
        increment(effectCounts, entry.details?.effectType || entry.details?.effectId || "unknown");
      }
      if (entry.type === "turn-action") {
        const action = getSelectedAction(entry);
        const actionId = getSelectedActionId(entry);
        const candidates = Array.isArray(entry.details?.candidates) ? entry.details.candidates : [];
        increment(actionCounts, actionId);
        increment(actionCategoryCounts, getActionCategory(actionId));
        incrementNested(playerActionCounts, getPlayerKey(entry), actionId);
        const scoreGap = recordTurnCandidateScores(candidateScoreStats, candidates, action);
        if (scoreGap.gap > 0) {
          opportunities.selectedBelowBestScore += 1;
          scoreOpportunities.selectedBelowBest += 1;
          scoreOpportunities.totalGap += scoreGap.gap;
          scoreOpportunities.maxGap = Math.max(scoreOpportunities.maxGap, scoreGap.gap);
        }

        let matchedSelectedCandidate = false;
        for (const candidate of candidates) {
          const candidateId = getCandidateId(candidate);
          const stats = getCandidateStats(candidateStats, candidateId);
          stats.offered += 1;
          if (isCandidateAvailable(candidate)) stats.available += 1;
          if (candidateMatchesAction(candidate, action)) {
            stats.selected += 1;
            matchedSelectedCandidate = true;
          } else if (isCandidateAvailable(candidate)) {
            stats.availableNotSelected += 1;
          }
        }
        if (!matchedSelectedCandidate) {
          getCandidateStats(candidateStats, actionId).selected += 1;
        }
        if (actionId === "pass" && hasAvailableKind(candidates, "main")) {
          opportunities.passWithAvailableMain += 1;
        }
        if (actionId === "end-turn" && hasAvailableAction(candidates, "move")) {
          opportunities.endTurnWithAvailableMove += 1;
        }
        if (candidates.length && action && candidates.some((candidate) => candidateMatchesAction(candidate, action) && !isCandidateAvailable(candidate))) {
          opportunities.selectedUnavailableCandidate += 1;
        }
        const routeTargetKey = getRouteTargetKey(getRouteTargetFromEntry(entry));
        if (routeTargetKey) increment(routeTargets, routeTargetKey);
        const followupKey = getMoveFollowupKey(entry);
        if (followupKey) increment(moveFollowups, followupKey);
        const turnPlanKey = getTurnPlanKey(entry);
        if (turnPlanKey) {
          const turnPlan = getTurnPlanFromEntry(entry);
          increment(turnPlans, turnPlanKey);
          increment(turnPlanTypes, turnPlan?.type || "unknown");
          increment(turnPlanActions, getTurnPlanActionId(turnPlan));
        }
      } else if (entry.type === "play-card") {
        const card = entry.details?.selected || entry.details?.card || {};
        increment(playCards, card.cardLabel || card.cardId || card.cardInstanceId || "unknown");
      } else if (entry.type === "tech-placement") {
        increment(techTiles, entry.details?.tileId || entry.details?.selected?.tileId || "unknown");
      } else if (entry.type === "scan-target") {
        const target = [
          entry.details?.pendingType || "scan",
          entry.details?.nebulaId || entry.details?.sectorX || "unknown",
        ].join(":");
        increment(scanTargets, target);
      } else if (entry.type === "move" || entry.type === "move-path") {
        const action = entry.details?.action || entry.details?.selected || {};
        increment(moveDirections, action.direction || "unknown");
        if (entry.type === "move-path") {
          const routeTargetKey = getRouteTargetKey(getRouteTargetFromEntry(entry));
          if (routeTargetKey) increment(routeTargets, routeTargetKey);
          const followupKey = getMoveFollowupKey(entry);
          if (followupKey) increment(moveFollowups, followupKey);
        }
      } else if (entry.type === "move-payment") {
        movePayment.count += 1;
        movePayment.requiredMovePoints += numeric(entry.details?.requiredMovePoints);
        movePayment.energyCost += numeric(entry.details?.energyCost);
        movePayment.discardedMoveCards += Array.isArray(entry.details?.selectedHandIndices)
          ? entry.details.selectedHandIndices.length
          : 0;
      } else if (entry.type === "final-score-mark") {
        const selected = getFinalScoreMarkSelection(entry);
        const markKey = getFinalScoreMarkKey(entry);
        increment(finalScoreMarks, markKey);
        increment(finalScoreFormulas, selected.formulaId || "unknown");
        incrementNested(decisionTargets, entry.type, markKey);
      } else if (["discard", "pass-reserve", "pick-card", "hand-scan", "land-target", "alien-trace"].includes(entry.type)) {
        incrementNested(decisionTargets, entry.type, entry.details?.pendingType || entry.details?.kind || entry.details?.label || "unknown");
      }
    }

    for (const bug of bugs) {
      increment(bugCounts, bug.message || "unknown");
    }

    const turnActionCount = Object.values(actionCounts).reduce((total, count) => total + count, 0);
    const actionCategoryRatios = {};
    for (const [category, count] of Object.entries(actionCategoryCounts)) {
      actionCategoryRatios[category] = turnActionCount ? roundRatio(count / turnActionCount) : 0;
    }

    const playerResults = normalizePlayerResults(report.playerResults || []);
    const playerProfiles = buildPlayerProfiles(logs, playerResults);
    const winnerProfileComparison = compareWinnerProfile(playerProfiles);
    const analysis = {
      summary: report.lastSummary || report.summary || null,
      totalLogs: logs.length,
      turnActionCount,
      typeCounts,
      actionCounts,
      actionCategoryCounts,
      actionCategoryRatios,
      playerActionCounts,
      candidateStats,
      candidateScoreStats: finalizeCandidateScoreStats(candidateScoreStats),
      topScoreGaps: buildTopScoreGaps(candidateScoreStats),
      topMissedCandidates: Object.entries(candidateStats)
        .map(([actionId, stats]) => ({ actionId, availableNotSelected: stats.availableNotSelected, available: stats.available, selected: stats.selected }))
        .filter((entry) => entry.availableNotSelected > 0)
        .sort((left, right) => right.availableNotSelected - left.availableNotSelected || left.actionId.localeCompare(right.actionId))
        .slice(0, 8),
      effectCounts,
      topEffects: rankCounts(effectCounts),
      playCards: rankCounts(playCards),
      techTiles: rankCounts(techTiles),
      scanTargets: rankCounts(scanTargets),
      moveDirections: rankCounts(moveDirections),
      routeTargetCounts: routeTargets,
      routeTargets: rankCounts(routeTargets),
      moveFollowupCounts: moveFollowups,
      moveFollowups: rankCounts(moveFollowups),
      turnPlanCounts: turnPlans,
      turnPlans: rankCounts(turnPlans),
      turnPlanTypeCounts: turnPlanTypes,
      turnPlanTypes: rankCounts(turnPlanTypes),
      turnPlanActionCounts: turnPlanActions,
      turnPlanActions: rankCounts(turnPlanActions),
      finalScoreMarkCounts: finalScoreMarks,
      finalScoreMarks: rankCounts(finalScoreMarks),
      finalScoreFormulaCounts: finalScoreFormulas,
      finalScoreFormulas: rankCounts(finalScoreFormulas),
      decisionTargets,
      movePayment,
      opportunities,
      scoreOpportunities: {
        selectedBelowBest: scoreOpportunities.selectedBelowBest,
        totalGap: roundRatio(scoreOpportunities.totalGap),
        maxGap: roundRatio(scoreOpportunities.maxGap),
        averageGap: scoreOpportunities.selectedBelowBest
          ? roundRatio(scoreOpportunities.totalGap / scoreOpportunities.selectedBelowBest)
          : 0,
      },
      bugs: rankCounts(bugCounts),
      playerResults,
      playerProfiles,
      winnerProfileComparison,
      winnerProfileDeltas: winnerProfileComparison?.delta || {},
      winner: playerResults[0] || null,
    };
    analysis.recommendations = buildRecommendations(analysis);
    analysis.strategyTuning = deriveStrategyTuning(analysis);
    return analysis;
  }

  function summarizeBattleAnalyses(analyses = []) {
    const validAnalyses = (analyses || []).filter(Boolean);
    const mergedActionCounts = {};
    const mergedActionCategoryCounts = {};
    const mergedTypeCounts = {};
    const mergedCandidateStats = {};
    const mergedCandidateScoreStats = {};
    const mergedOpportunities = {};
    const mergedScoreOpportunities = {
      selectedBelowBest: 0,
      totalGap: 0,
      maxGap: 0,
    };
    const mergedMovePayment = {
      count: 0,
      requiredMovePoints: 0,
      energyCost: 0,
      discardedMoveCards: 0,
    };
    const mergedBugCounts = {};
    const mergedRouteTargets = {};
    const mergedMoveFollowups = {};
    const mergedTurnPlans = {};
    const mergedTurnPlanTypes = {};
    const mergedTurnPlanActions = {};
    const mergedFinalScoreMarks = {};
    const mergedFinalScoreFormulas = {};
    const winnerCounts = {};
    const winnerProfiles = [];
    const nonWinnerProfiles = [];
    let totalSteps = 0;
    let completedGames = 0;
    let blockedGames = 0;
    let totalWinnerScore = 0;

    for (const analysis of validAnalyses) {
      const summary = analysis.summary || {};
      totalSteps += numeric(summary.steps);
      if (summary.gameEnded) completedGames += 1;
      if (summary.blocked || analysis.bugs?.length) blockedGames += 1;
      for (const [key, count] of Object.entries(analysis.actionCounts || {})) increment(mergedActionCounts, key, count);
      for (const [key, count] of Object.entries(analysis.actionCategoryCounts || {})) increment(mergedActionCategoryCounts, key, count);
      for (const [key, count] of Object.entries(analysis.typeCounts || {})) increment(mergedTypeCounts, key, count);
      for (const [actionId, stats] of Object.entries(analysis.candidateStats || {})) {
        const mergedStats = getCandidateStats(mergedCandidateStats, actionId);
        mergedStats.offered += numeric(stats.offered);
        mergedStats.available += numeric(stats.available);
        mergedStats.selected += numeric(stats.selected);
        mergedStats.availableNotSelected += numeric(stats.availableNotSelected);
      }
      mergeCandidateScoreStats(mergedCandidateScoreStats, analysis.candidateScoreStats || {});
      for (const [key, count] of Object.entries(analysis.opportunities || {})) increment(mergedOpportunities, key, count);
      mergedScoreOpportunities.selectedBelowBest += numeric(analysis.scoreOpportunities?.selectedBelowBest);
      mergedScoreOpportunities.totalGap += numeric(analysis.scoreOpportunities?.totalGap);
      mergedScoreOpportunities.maxGap = Math.max(mergedScoreOpportunities.maxGap, numeric(analysis.scoreOpportunities?.maxGap));
      for (const [key, count] of Object.entries(analysis.routeTargetCounts || {})) increment(mergedRouteTargets, key, count);
      for (const [key, count] of Object.entries(analysis.moveFollowupCounts || {})) increment(mergedMoveFollowups, key, count);
      for (const [key, count] of Object.entries(analysis.turnPlanCounts || {})) increment(mergedTurnPlans, key, count);
      for (const [key, count] of Object.entries(analysis.turnPlanTypeCounts || {})) increment(mergedTurnPlanTypes, key, count);
      for (const [key, count] of Object.entries(analysis.turnPlanActionCounts || {})) increment(mergedTurnPlanActions, key, count);
      for (const [key, count] of Object.entries(analysis.finalScoreMarkCounts || {})) increment(mergedFinalScoreMarks, key, count);
      for (const [key, count] of Object.entries(analysis.finalScoreFormulaCounts || {})) increment(mergedFinalScoreFormulas, key, count);
      for (const [key, count] of Object.entries(analysis.movePayment || {})) {
        if (Object.hasOwn(mergedMovePayment, key)) mergedMovePayment[key] += numeric(count);
      }
      for (const bug of analysis.bugs || []) increment(mergedBugCounts, bug.key, bug.count);
      if (analysis.winner) {
        increment(winnerCounts, analysis.winner.playerId || analysis.winner.playerLabel);
        totalWinnerScore += numeric(analysis.winner.finalScore);
      }
      const profiles = analysis.playerProfiles || [];
      if (profiles.length) {
        winnerProfiles.push(profiles[0]);
        nonWinnerProfiles.push(...profiles.slice(1));
      }
    }

    const gameCount = validAnalyses.length;
    const turnActionCount = Object.values(mergedActionCounts).reduce((total, count) => total + count, 0);
    const actionCategoryRatios = {};
    for (const [category, count] of Object.entries(mergedActionCategoryCounts)) {
      actionCategoryRatios[category] = turnActionCount ? roundRatio(count / turnActionCount) : 0;
    }
    const topMissedCandidates = Object.entries(mergedCandidateStats)
      .map(([actionId, stats]) => ({
        actionId,
        availableNotSelected: stats.availableNotSelected,
        available: stats.available,
        selected: stats.selected,
      }))
      .filter((entry) => entry.availableNotSelected > 0)
      .sort((left, right) => right.availableNotSelected - left.availableNotSelected || left.actionId.localeCompare(right.actionId))
      .slice(0, 8);
    const summaryForRecommendations = {
      turnActionCount,
      actionCategoryRatios,
      candidateStats: mergedCandidateStats,
      candidateScoreStats: finalizeCandidateScoreStats(mergedCandidateScoreStats),
      topScoreGaps: buildTopScoreGaps(mergedCandidateScoreStats),
      opportunities: mergedOpportunities,
      scoreOpportunities: {
        selectedBelowBest: mergedScoreOpportunities.selectedBelowBest,
        totalGap: roundRatio(mergedScoreOpportunities.totalGap),
        maxGap: roundRatio(mergedScoreOpportunities.maxGap),
        averageGap: mergedScoreOpportunities.selectedBelowBest
          ? roundRatio(mergedScoreOpportunities.totalGap / mergedScoreOpportunities.selectedBelowBest)
          : 0,
      },
      movePayment: mergedMovePayment,
      bugs: rankCounts(mergedBugCounts),
      winnerProfileDeltas: diffProfileMetrics(
        averageProfileMetrics(winnerProfiles),
        averageProfileMetrics(nonWinnerProfiles),
      ),
    };
    const averageWinnerProfile = averageProfileMetrics(winnerProfiles);
    const averageNonWinnerProfile = averageProfileMetrics(nonWinnerProfiles);
    const winnerProfileDeltas = diffProfileMetrics(averageWinnerProfile, averageNonWinnerProfile);
    const summary = {
      gameCount,
      completedGames,
      blockedGames,
      completionRate: gameCount ? roundRatio(completedGames / gameCount) : 0,
      averageSteps: gameCount ? roundRatio(totalSteps / gameCount) : 0,
      averageWinnerScore: gameCount ? roundRatio(totalWinnerScore / gameCount) : 0,
      turnActionCount,
      actionCounts: mergedActionCounts,
      actionCategoryCounts: mergedActionCategoryCounts,
      actionCategoryRatios,
      typeCounts: mergedTypeCounts,
      candidateStats: mergedCandidateStats,
      candidateScoreStats: finalizeCandidateScoreStats(mergedCandidateScoreStats),
      topScoreGaps: buildTopScoreGaps(mergedCandidateScoreStats),
      topMissedCandidates,
      opportunities: mergedOpportunities,
      scoreOpportunities: {
        selectedBelowBest: mergedScoreOpportunities.selectedBelowBest,
        totalGap: roundRatio(mergedScoreOpportunities.totalGap),
        maxGap: roundRatio(mergedScoreOpportunities.maxGap),
        averageGap: mergedScoreOpportunities.selectedBelowBest
          ? roundRatio(mergedScoreOpportunities.totalGap / mergedScoreOpportunities.selectedBelowBest)
          : 0,
      },
      movePayment: mergedMovePayment,
      bugCounts: mergedBugCounts,
      routeTargetCounts: mergedRouteTargets,
      moveFollowupCounts: mergedMoveFollowups,
      turnPlanCounts: mergedTurnPlans,
      turnPlanTypeCounts: mergedTurnPlanTypes,
      turnPlanActionCounts: mergedTurnPlanActions,
      finalScoreMarkCounts: mergedFinalScoreMarks,
      finalScoreFormulaCounts: mergedFinalScoreFormulas,
      winnerCounts,
      averageWinnerProfile,
      averageNonWinnerProfile,
      winnerProfileDeltas,
      topActions: rankCounts(mergedActionCounts),
      routeTargets: rankCounts(mergedRouteTargets),
      moveFollowups: rankCounts(mergedMoveFollowups),
      turnPlans: rankCounts(mergedTurnPlans),
      turnPlanTypes: rankCounts(mergedTurnPlanTypes),
      turnPlanActions: rankCounts(mergedTurnPlanActions),
      finalScoreMarks: rankCounts(mergedFinalScoreMarks),
      finalScoreFormulas: rankCounts(mergedFinalScoreFormulas),
      topBugs: rankCounts(mergedBugCounts),
      recommendations: buildRecommendations(summaryForRecommendations),
    };
    summary.strategyTuning = deriveStrategyTuning(summary);
    return summary;
  }

  function summarizeBattleReports(reports = []) {
    return summarizeBattleAnalyses((reports || []).map(analyzeBattleReport));
  }

  return Object.freeze({
    DEFAULT_STRATEGY_WEIGHTS,
    analyzeBattleReport,
    deriveStrategyTuning,
    compareStrategyBatchResults,
    normalizeStrategyWeights,
    summarizeStrategyTuningHistory,
    summarizeBattleAnalyses,
    summarizeBattleReports,
  });
});
