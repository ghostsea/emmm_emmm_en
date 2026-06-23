(function (root, factory) {
  "use strict";

  let valuation = root.SetiAIValuation;
  let goals = root.SetiAIGoals;

  if ((!valuation || !goals) && typeof require === "function") {
    valuation = valuation || require("./valuation");
    goals = goals || require("./goals");
  }

  const api = factory(valuation, goals);

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.SetiAIActionGraph = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function (valuation, goals) {
  "use strict";

  function numeric(value) {
    return valuation?.numeric ? valuation.numeric(value) : (Number.isFinite(Number(value)) ? Number(value) : 0);
  }

  function roundValue(value) {
    return valuation?.roundValue ? valuation.roundValue(value) : Math.round(numeric(value) * 1000) / 1000;
  }

  function clamp01(value) {
    return valuation?.clamp01 ? valuation.clamp01(value) : Math.min(1, Math.max(0, numeric(value)));
  }

  function getCandidateId(candidate = {}) {
    return String(candidate.id || candidate.actionId || "unknown");
  }

  function getCandidateGain(candidate = {}, cost = 0) {
    if (Number.isFinite(Number(candidate.gain))) return numeric(candidate.gain);
    if (Number.isFinite(Number(candidate.valueBreakdown?.gain))) return numeric(candidate.valueBreakdown.gain);
    if (Number.isFinite(Number(candidate.valueBreakdown?.effectValue))) {
      return Math.max(0, numeric(candidate.valueBreakdown.effectValue));
    }
    if (Number.isFinite(Number(candidate.score))) {
      return Math.max(0, numeric(candidate.score) + cost);
    }
    return 0;
  }

  function getCandidateCost(candidate = {}) {
    if (Number.isFinite(Number(candidate.cost))) return numeric(candidate.cost);
    const breakdown = candidate.valueBreakdown || {};
    let value = 0;
    value += numeric(breakdown.costValue);
    value += numeric(breakdown.cornerOpportunity) * 0.45;
    if (!value && candidate.costResources) {
      value += valuation.getResourceValue(candidate.costResources);
    }
    return value;
  }

  function normalizeActionCandidate(candidate = {}, state = {}, playerId = null, options = {}) {
    const cost = getCandidateCost(candidate);
    const gain = getCandidateGain(candidate, cost);
    const activeGoals = options.goals || goals.inferGoals(state, playerId, options);
    const finalMarginal = valuation.estimateFinalMarginalForAction(candidate, state, playerId, options);
    const goalBonus = goals.scoreCandidateForGoals(candidate, activeGoals, state, playerId, options);
    const feasibility = clamp01(candidate.available === false ? 0 : candidate.feasibility ?? 1);
    const explicitScore = Number.isFinite(Number(candidate.score)) ? numeric(candidate.score) : null;
    const baseNet = explicitScore == null ? gain - cost : explicitScore;
    const net = (baseNet + finalMarginal + goalBonus) * feasibility;
    return {
      ...candidate,
      id: getCandidateId(candidate),
      gain: roundValue(gain),
      cost: roundValue(cost),
      prereqChain: candidate.prereqChain || candidate.plan?.prereqChain || [],
      finalMarginal: roundValue(finalMarginal),
      goalBonus: roundValue(goalBonus),
      feasibility: roundValue(feasibility),
      net: roundValue(net),
      breakdown: {
        ...(candidate.breakdown || {}),
        ...(candidate.valueBreakdown || {}),
        existingScore: explicitScore == null ? null : roundValue(explicitScore),
        gain: roundValue(gain),
        cost: roundValue(cost),
        finalMarginal: roundValue(finalMarginal),
        goalBonus: roundValue(goalBonus),
        feasibility: roundValue(feasibility),
        net: roundValue(net),
      },
    };
  }

  function buildActionGraph(candidates = [], state = {}, playerId = null, options = {}) {
    const activeGoals = options.goals || goals.inferGoals(state, playerId, options);
    return (candidates || []).map((candidate) => normalizeActionCandidate(candidate, state, playerId, {
      ...options,
      goals: activeGoals,
    }));
  }

  function rankActionCandidates(candidates = [], state = {}, playerId = null, options = {}) {
    return buildActionGraph(candidates, state, playerId, options)
      .filter((candidate) => candidate.available !== false)
      .sort((left, right) => numeric(right.net) - numeric(left.net) || String(left.id).localeCompare(String(right.id)));
  }

  return Object.freeze({
    normalizeActionCandidate,
    buildActionGraph,
    rankActionCandidates,
  });
});
