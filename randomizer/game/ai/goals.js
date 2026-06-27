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
    OPENING_INCOME: "OPENING_INCOME",
    FINAL_TILE_FOCUS: "FINAL_TILE_FOCUS",
  });

  const DEFAULT_GOAL_VALUES = Object.freeze({
    FIRST_ROUND_SCORE_25: 6,
    GRAB_TRACE_YELLOW: 10,
    GRAB_TRACE_PINK: 12,
    GRAB_TRACE_BLUE: 12,
    OPENING_INCOME: 8,
    FINAL_TILE_FOCUS: 10,
  });

  const TRACE_TYPES = Object.freeze(["yellow", "pink", "blue"]);

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

  function getTraceCompetition(state = {}, options = {}) {
    return options.traceCompetition
      || state.aiTraceCompetition
      || state.traceCompetition
      || {};
  }

  function getTraceCompetitionEntry(state = {}, options = {}, traceType) {
    return getTraceCompetition(state, options)?.firstTrace?.[traceType] || {};
  }

  function getTraceAvailabilityFromState(state = {}, traceType) {
    const alienState = state.alienGameState || {};
    const slots = alienState.aliens || {};
    return Object.values(slots).reduce((result, slot) => {
      if (!slot) return result;
      if (slot.revealed) {
        result.revealed += 1;
        return result;
      }
      const traceSlot = slot.traces?.[traceType];
      if (!traceSlot) return result;
      if (traceSlot.firstPlaced) result.taken += 1;
      else result.open += 1;
      return result;
    }, { open: 0, taken: 0, revealed: 0 });
  }

  function getTraceGoalFeasibility(traceType, state = {}, player = null, options = {}) {
    const explicit = getTraceCompetitionEntry(state, options, traceType);
    const fallback = getTraceAvailabilityFromState(state, traceType);
    const open = numeric(explicit.open ?? fallback.open);
    const own = numeric(explicit.own ?? 0);
    const takenByOthers = numeric(explicit.takenByOthers ?? explicit.stolen ?? Math.max(0, fallback.taken - own));
    const revealed = numeric(explicit.revealed ?? fallback.revealed);
    let feasibility = open > 0
      ? 1
      : revealed > 0
        ? 0.72
        : takenByOthers > 0
          ? 0.34
          : 0.55;

    if (traceType === "yellow") {
      const landingPressure = numeric(getTraceCompetition(state, options).yellowLandingPressure);
      if (open <= 0 && revealed <= 0) {
        feasibility = Math.min(feasibility, 0.16);
      } else if (landingPressure > 0 && open <= landingPressure) {
        feasibility *= Math.max(0.24, 1 - landingPressure * 0.28);
      } else if (landingPressure > 0) {
        feasibility *= Math.max(0.55, 1 - landingPressure * 0.14);
      }
    }

    void player;
    return clamp01(feasibility);
  }

  function getResourceScarcity(player = null) {
    const resources = player?.resources || {};
    const credits = numeric(resources.credits);
    const energy = numeric(resources.energy);
    const handSize = numeric(resources.handSize ?? player?.hand?.length);
    return Math.max(0, 4 - credits) * 0.08
      + Math.max(0, 4 - energy) * 0.1
      + Math.max(0, 4 - handSize) * 0.05;
  }

  function hasEffectType(candidate = {}, predicate) {
    return (candidate.effectTypes || []).some((type) => predicate(String(type || "")));
  }

  function isCardScanEffectType(type) {
    return type === "card_scan_nebula"
      || type === "card_scan_color_choice"
      || type === "card_public_scan"
      || type === "card_any_sector_scan"
      || type === "card_scan_action"
      || type === "card_probe_sector_scan"
      || type === "card_planet_sector_scan"
      || type === "card_sector_x_scan"
      || type === "card_draw_then_scan"
      || type === "card_optional_discard_scan"
      || type === "card_hand_scan"
      || type === "card_landing_sector_scan"
      || type === "card_conditional_sector_scan"
      || type === "card_color_scan";
  }

  function hasPositiveFinalFormulaDelta(candidate = {}) {
    return Object.values(candidate.finalFormulaDeltas || {})
      .some((value) => numeric(value) > 0);
  }

  function candidateHasFinalTilePlayCardSupport(candidate = {}) {
    if (hasPositiveFinalFormulaDelta(candidate)) return true;
    const planAction = getPlanActionId(candidate);
    if (planAction === "task") return true;

    const breakdown = {
      ...(candidate.breakdown || {}),
      ...(candidate.valueBreakdown || {}),
    };
    const hasConcreteFinalValue = numeric(breakdown.cFinalTaskProgressValue) > 0
      || numeric(breakdown.c2Type3ProgressValue) > 0
      || numeric(breakdown.endGameExpectedScore) > 0;
    if (hasConcreteFinalValue) return true;

    return planAction === "final" && (
      numeric(candidate.plan?.endGameExpectedScore) > 0
      || numeric(candidate.plan?.cFinalTaskProgressValue) > 0
      || numeric(candidate.plan?.c2Type3ProgressValue) > 0
    );
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
    const openingGoals = player?.openingPlan?.goals || {};
    const openingWeight = roundNumber <= 2 ? 1 : 0.35;
    if (roundNumber <= 1 && score < 25) {
      goals.push({
        id: GOAL_IDS.FIRST_ROUND_SCORE_25,
        priority: 1 + numeric(openingGoals.FIRST_ROUND_SCORE_25) * 0.12,
        value: Math.min(DEFAULT_GOAL_VALUES.FIRST_ROUND_SCORE_25, (25 - score) * 0.35),
        progress: score / 25,
      });
    }
    const dataCount = numeric(resources.availableData || resources.data);
    const openingIncome = numeric(openingGoals.OPENING_INCOME);
    if (roundNumber <= 2 && (openingIncome > 0 || getResourceScarcity(player) > 0)) {
      goals.push({
        id: GOAL_IDS.OPENING_INCOME,
        priority: 0.7 + openingIncome * 0.12 * openingWeight + Math.min(0.45, getResourceScarcity(player)),
        value: DEFAULT_GOAL_VALUES.OPENING_INCOME,
        progress: Math.min(0.85, (numeric(resources.credits) + numeric(resources.energy)) / 12),
      });
    }
    goals.push({
      id: GOAL_IDS.GRAB_TRACE_BLUE,
      priority: (dataCount >= 3 ? 1.05 : 0.62) + numeric(openingGoals.GRAB_TRACE_BLUE) * 0.14 * openingWeight,
      value: DEFAULT_GOAL_VALUES.GRAB_TRACE_BLUE,
      progress: dataCount / 6,
      feasibility: getTraceGoalFeasibility("blue", state, player, options),
    });
    goals.push({
      id: GOAL_IDS.GRAB_TRACE_YELLOW,
      priority: 0.52 + numeric(openingGoals.GRAB_TRACE_YELLOW) * 0.08 * openingWeight,
      value: DEFAULT_GOAL_VALUES.GRAB_TRACE_YELLOW,
      progress: 0,
      feasibility: getTraceGoalFeasibility("yellow", state, player, options),
    });
    goals.push({
      id: GOAL_IDS.GRAB_TRACE_PINK,
      priority: 0.78 + numeric(openingGoals.GRAB_TRACE_PINK) * 0.14 * openingWeight,
      value: DEFAULT_GOAL_VALUES.GRAB_TRACE_PINK,
      progress: 0,
      feasibility: getTraceGoalFeasibility("pink", state, player, options),
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
    const traceType = candidate.traceType || candidate.options?.traceType || null;
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
        || (effectTypes.includes("alien_trace") && (!traceType || traceType === "yellow"))
        || candidate.traceType === "yellow";
    }
    if (goalId === GOAL_IDS.GRAB_TRACE_PINK) {
      return actionId === "scan"
        || planAction === "scan"
        || hasEffectType(candidate, isCardScanEffectType)
        || candidate.traceType === "pink";
    }
    if (goalId === GOAL_IDS.GRAB_TRACE_BLUE) {
      return actionId === "analyze"
        || actionId === "scan"
        || planAction === "scan"
        || hasEffectType(candidate, isCardScanEffectType)
        || candidate.traceType === "blue"
        || numeric(candidate.valueBreakdown?.effectValue) > 0 && effectTypes.includes("gain_data");
    }
    if (goalId === GOAL_IDS.OPENING_INCOME) {
      return actionId === "playCard"
        || actionId === "cardCorner"
        || effectTypes.includes("income")
        || effectTypes.includes("gain_resources")
        || effectTypes.includes("draw_cards")
        || effectTypes.includes("gain_data")
        || Boolean(candidate.valueBreakdown?.incomeValue);
    }
    if (goalId === GOAL_IDS.FINAL_TILE_FOCUS) {
      return Boolean(candidate.finalMarginal)
        || (actionId === "playCard" && candidateHasFinalTilePlayCardSupport(candidate))
        || actionId === "researchTech"
        || actionId === "land"
        || actionId === "orbit"
        || actionId === "scan";
    }
    return false;
  }

  function getGoalSupportMultiplier(candidate = {}, goal = {}, state = {}, options = {}) {
    if (goal.id !== GOAL_IDS.GRAB_TRACE_YELLOW) return 1;
    const actionId = getActionId(candidate);
    const planAction = getPlanActionId(candidate);
    if (actionId !== "land" && planAction !== "land") return 1;
    const entry = getTraceCompetitionEntry(state, options, "yellow");
    const hasExplicitTraceData = ["open", "revealed", "takenByOthers", "stolen", "own"]
      .some((key) => entry[key] != null);
    const hasAlienTraceData = Object.keys((state.alienGameState || {}).aliens || {}).length > 0;
    if (!hasExplicitTraceData && !hasAlienTraceData) return 1;
    const fallback = hasExplicitTraceData ? null : getTraceAvailabilityFromState(state, "yellow");
    const open = numeric(entry.open ?? fallback?.open);
    const revealed = numeric(entry.revealed ?? fallback?.revealed);
    const landingPressure = numeric(getTraceCompetition(state, options).yellowLandingPressure);
    if (open <= 0 && revealed <= 0) return 0.12;
    if (landingPressure > 0 && open <= landingPressure) return Math.max(0.2, 1 - landingPressure * 0.35);
    if (landingPressure > 0) return Math.max(0.55, 1 - landingPressure * 0.18);
    return 1;
  }

  function scoreCandidateForGoals(candidate = {}, activeGoals = [], state = {}, playerId = null, options = {}) {
    return (activeGoals || []).reduce((total, rawGoal) => {
      const goal = normalizeGoal(rawGoal);
      if (!candidateSupportsGoal(candidate, goal.id)) return total;
      const remainingProgress = 1 - clamp01(goal.progress);
      const supportMultiplier = getGoalSupportMultiplier(candidate, goal, state, options);
      const weighted = goal.value * goal.priority * goal.feasibility * supportMultiplier * Math.max(0.2, remainingProgress);
      return total + weighted;
    }, 0);
  }

  return Object.freeze({
    GOAL_IDS,
    DEFAULT_GOAL_VALUES,
    TRACE_TYPES,
    inferGoals,
    normalizeGoal,
    candidateSupportsGoal,
    scoreCandidateForGoals,
  });
});
