(function (root, factory) {
  "use strict";

  let actionGraph = root.SetiAIActionGraph;

  if (!actionGraph && typeof require === "function") {
    actionGraph = require("./action-graph");
  }

  const api = factory(actionGraph);

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.SetiAIPlanner = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function (actionGraph) {
  "use strict";

  function numeric(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
  }

  function getActionId(action = {}) {
    return String(action.id || action.actionId || "unknown");
  }

  function getPlanActionId(action = {}) {
    return action.plan?.quickActionId || action.plan?.actionId || null;
  }

  function isAvailable(action) {
    return action && action.available !== false;
  }

  function chainKey(actions = []) {
    return actions.map(getActionId).join(">");
  }

  function scoreChain(actions = []) {
    const base = actions.reduce((total, action) => total + numeric(action.net ?? action.score), 0);
    let synergy = 0;
    for (let index = 0; index < actions.length - 1; index += 1) {
      const current = actions[index];
      const next = actions[index + 1];
      if (getPlanActionId(current) === getActionId(next)) synergy += Math.max(0, numeric(current.plan?.score)) * 0.25;
      if (getPlanActionId(next) === getActionId(current)) synergy += Math.max(0, numeric(next.plan?.score)) * 0.25;
    }
    return Math.round((base + synergy) * 1000) / 1000;
  }

  function buildTurnPlans(candidates = [], state = {}, playerId = null, options = {}) {
    const ranked = actionGraph.buildActionGraph(candidates, state, playerId, options).filter(isAvailable);
    const quick = ranked.filter((candidate) => candidate.kind === "quick");
    const main = ranked.filter((candidate) => candidate.kind === "main");
    const endings = ranked.filter((candidate) => candidate.kind === "pass" || candidate.kind === "end-turn");
    const quickLimit = Math.max(0, Math.round(numeric(options.quickBeamWidth ?? 3)));
    const mainLimit = Math.max(1, Math.round(numeric(options.mainBeamWidth ?? 6)));
    const plans = [];

    for (const action of main.slice(0, mainLimit)) {
      plans.push({ actions: [action], score: scoreChain([action]), type: "main" });
      for (const before of quick.slice(0, quickLimit)) {
        const actions = [before, action];
        plans.push({ actions, score: scoreChain(actions), type: "quick-main" });
      }
      for (const after of quick.slice(0, quickLimit)) {
        const actions = [action, after];
        plans.push({ actions, score: scoreChain(actions), type: "main-quick" });
      }
    }

    for (const ending of endings) {
      plans.push({ actions: [ending], score: scoreChain([ending]), type: getActionId(ending) });
    }

    return plans
      .map((plan) => ({ ...plan, key: chainKey(plan.actions), firstAction: plan.actions[0] || null }))
      .sort((left, right) => numeric(right.score) - numeric(left.score) || left.key.localeCompare(right.key));
  }

  function chooseTurnPlan(candidates = [], state = {}, playerId = null, options = {}) {
    return buildTurnPlans(candidates, state, playerId, options)[0] || null;
  }

  function chooseTurnAction(candidates = [], state = {}, playerId = null, options = {}) {
    return chooseTurnPlan(candidates, state, playerId, options)?.firstAction || null;
  }

  return Object.freeze({
    buildTurnPlans,
    chooseTurnPlan,
    chooseTurnAction,
  });
});
