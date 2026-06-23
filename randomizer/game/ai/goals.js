(function (root, factory) {
  "use strict";

  let valuation = root.SetiAIValuation;

  if (!valuation && typeof require === "function") {
    valuation = require("./valuation");
  }

  const api = factory(valuation);

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.SetiAIGoals = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function (valuation) {
  "use strict";

  const GOAL_IDS = Object.freeze({
    FIRST_ROUND_SCORE_25: "FIRST_ROUND_SCORE_25",
    GRAB_TRACE_YELLOW: "GRAB_TRACE_YELLOW",
    GRAB_TRACE_PINK: "GRAB_TRACE_PINK",
    GRAB_TRACE_BLUE: "GRAB_TRACE_BLUE",
    FINAL_TILE_FOCUS: "FINAL_TILE_FOCUS",
  });

  const DEFAULT_GOAL_VALUES = Object.freeze({
    FIRST_ROUND_SCORE_25: 6,
    GRAB_TRACE_YELLOW: 8,
    GRAB_TRACE_PINK: 7,
    GRAB_TRACE_BLUE: 7,
    FINAL_TILE_FOCUS: 8,
  });

  function numeric(value) {
    return valuation?.numeric ? valuation.numeric(value) : (Number.isFinite(Number(value)) ? Number(value) : 0);
  }

  function clamp01(value) {
    return valuation?.clamp01 ? valuation.clamp01(value) : Math.min(1, Math.max(0, numeric(value)));
  }

  function getPlayer(state = {}, playerId) {
    return (state.playerState?.players || state.players || [])
      .find((player) => player?.id === playerId)
      || state.currentPlayer
      || null;
  }

  function getActionId(candidate = {}) {
    return String(candidate.id || candidate.actionId || "");
  }

  function getPlanActionId(candidate = {}) {
    return candidate.plan?.actionId || candidate.plan?.quickActionId || null;
  }

  function normalizeGoal(goal = {}) {
    const id = String(goal.id || "");
    return {
      id,
      priority: numeric(goal.priority ?? 1),
      value: numeric(goal.value ?? DEFAULT_GOAL_VALUES[id] ?? 0),
      progress: clamp01(typeof goal.progress === "function" ? goal.progress() : goal.progress ?? 0),
      feasibility: clamp01(typeof goal.feasibility === "function" ? goal.feasibility() : goal.feasibility ?? 1),
      meta: goal.meta || {},
    };
  }

  function inferGoals(state = {}, playerId = null, options = {}) {
    if (Array.isArray(options.goals)) {
      return options.goals.map(normalizeGoal).filter((goal) => goal.id);
    }
    const player = getPlayer(state, playerId);
    const resources = player?.resources || {};
    const roundNumber = numeric(state.turnState?.roundNumber || state.roundNumber || 1);
    const score = numeric(resources.score);
    const goals = [];
    if (roundNumber <= 1 && score < 25) {
      goals.push({
        id: GOAL_IDS.FIRST_ROUND_SCORE_25,
        priority: 1,
        value: Math.min(DEFAULT_GOAL_VALUES.FIRST_ROUND_SCORE_25, (25 - score) * 0.35),
        progress: score / 25,
      });
    }
    const dataCount = numeric(resources.availableData || resources.data);
    goals.push({
      id: GOAL_IDS.GRAB_TRACE_BLUE,
      priority: dataCount >= 3 ? 0.8 : 0.45,
      value: DEFAULT_GOAL_VALUES.GRAB_TRACE_BLUE,
      progress: dataCount / 6,
    });
    goals.push({
      id: GOAL_IDS.GRAB_TRACE_YELLOW,
      priority: 0.65,
      value: DEFAULT_GOAL_VALUES.GRAB_TRACE_YELLOW,
      progress: 0,
    });
    goals.push({
      id: GOAL_IDS.GRAB_TRACE_PINK,
      priority: 0.55,
      value: DEFAULT_GOAL_VALUES.GRAB_TRACE_PINK,
      progress: 0,
    });
    if (options.hasMarkedFinalTile || state.aiMarkedFinalFormulas?.length) {
      goals.push({
        id: GOAL_IDS.FINAL_TILE_FOCUS,
        priority: 0.85,
        value: DEFAULT_GOAL_VALUES.FINAL_TILE_FOCUS,
        progress: 0,
      });
    }
    return goals.map(normalizeGoal);
  }

  function candidateSupportsGoal(candidate = {}, goalId) {
    const actionId = getActionId(candidate);
    const planAction = getPlanActionId(candidate);
    const effectTypes = candidate.effectTypes || [];
    if (goalId === GOAL_IDS.FIRST_ROUND_SCORE_25) {
      return actionId === "playCard"
        || actionId === "land"
        || actionId === "orbit"
        || actionId === "scan"
        || numeric(candidate.score) > 0;
    }
    if (goalId === GOAL_IDS.GRAB_TRACE_YELLOW) {
      return actionId === "land"
        || planAction === "land"
        || effectTypes.includes("alien_trace")
        || candidate.traceType === "yellow";
    }
    if (goalId === GOAL_IDS.GRAB_TRACE_PINK) {
      return actionId === "scan" || planAction === "scan" || candidate.traceType === "pink";
    }
    if (goalId === GOAL_IDS.GRAB_TRACE_BLUE) {
      return actionId === "analyze"
        || actionId === "scan"
        || planAction === "scan"
        || candidate.traceType === "blue"
        || numeric(candidate.valueBreakdown?.effectValue) > 0 && effectTypes.includes("gain_data");
    }
    if (goalId === GOAL_IDS.FINAL_TILE_FOCUS) {
      return Boolean(candidate.finalMarginal)
        || actionId === "playCard"
        || actionId === "researchTech"
        || actionId === "land"
        || actionId === "orbit"
        || actionId === "scan";
    }
    return false;
  }

  function scoreCandidateForGoals(candidate = {}, activeGoals = [], state = {}, playerId = null, options = {}) {
    return (activeGoals || []).reduce((total, rawGoal) => {
      const goal = normalizeGoal(rawGoal);
      if (!candidateSupportsGoal(candidate, goal.id)) return total;
      const remainingProgress = 1 - clamp01(goal.progress);
      const weighted = goal.value * goal.priority * goal.feasibility * Math.max(0.2, remainingProgress);
      return total + weighted;
    }, 0);
  }

  return Object.freeze({
    GOAL_IDS,
    DEFAULT_GOAL_VALUES,
    inferGoals,
    normalizeGoal,
    candidateSupportsGoal,
    scoreCandidateForGoals,
  });
});
