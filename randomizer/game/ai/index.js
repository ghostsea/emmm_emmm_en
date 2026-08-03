(function (root, factory) {
  "use strict";

  let valuation = root.SetiAIValuation;
  let goals = root.SetiAIGoals;
  let raceModel = root.SetiAIRaceModel;
  let actionGraph = root.SetiAIActionGraph;
  let planner = root.SetiAIPlanner;
  let evaluator = root.SetiAIEvaluator;
  let policy = root.SetiAIPolicy;
  let analytics = root.SetiAIBattleAnalytics;
  let resourceFlow = root.SetiAIResourceFlow;

  if ((!valuation || !goals || !raceModel || !actionGraph || !planner || !evaluator || !policy || !analytics || !resourceFlow) && typeof require === "function") {
    valuation = valuation || require("./valuation");
    goals = goals || require("./goals");
    raceModel = raceModel || require("./race-model");
    actionGraph = actionGraph || require("./action-graph");
    planner = planner || require("./planner");
    evaluator = evaluator || require("./evaluator");
    policy = policy || require("./policy");
    analytics = analytics || require("./battle-analytics");
    resourceFlow = resourceFlow || require("./resource-flow");
  }

  const api = factory(valuation, goals, raceModel, actionGraph, planner, evaluator, policy, analytics, resourceFlow);

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.SetiAI = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function (valuation, goals, raceModel, actionGraph, planner, evaluator, policy, analytics, resourceFlow) {
  "use strict";

  return Object.freeze({
    valuation,
    goals,
    raceModel,
    actionGraph,
    planner,
    evaluator,
    policy,
    analytics,
    resourceFlow,
  });
});
