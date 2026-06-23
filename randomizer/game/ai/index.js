(function (root, factory) {
  "use strict";

  let valuation = root.SetiAIValuation;
  let goals = root.SetiAIGoals;
  let actionGraph = root.SetiAIActionGraph;
  let planner = root.SetiAIPlanner;
  let evaluator = root.SetiAIEvaluator;
  let policy = root.SetiAIPolicy;
  let analytics = root.SetiAIBattleAnalytics;

  if ((!valuation || !goals || !actionGraph || !planner || !evaluator || !policy || !analytics) && typeof require === "function") {
    valuation = valuation || require("./valuation");
    goals = goals || require("./goals");
    actionGraph = actionGraph || require("./action-graph");
    planner = planner || require("./planner");
    evaluator = evaluator || require("./evaluator");
    policy = policy || require("./policy");
    analytics = analytics || require("./battle-analytics");
  }

  const api = factory(valuation, goals, actionGraph, planner, evaluator, policy, analytics);

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.SetiAI = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function (valuation, goals, actionGraph, planner, evaluator, policy, analytics) {
  "use strict";

  return Object.freeze({
    valuation,
    goals,
    actionGraph,
    planner,
    evaluator,
    policy,
    analytics,
  });
});
