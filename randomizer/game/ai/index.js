(function (root, factory) {
  "use strict";

  let valuation = root.SetiAIValuation;
  let goals = root.SetiAIGoals;
  let actionGraph = root.SetiAIActionGraph;
  let planner = root.SetiAIPlanner;
  let evaluator = root.SetiAIEvaluator;
  let policy = root.SetiAIPolicy;
  let analytics = root.SetiAIBattleAnalytics;
  let seed = root.SetiAISeed;
  let observation = root.SetiAIObservation;
  let environment = root.SetiAIEnvironment;
  let legalActions = root.SetiAILegalActions;
  let dataRecorder = root.SetiAIDataRecorder;
  let mcts = root.SetiAIMcts;
  let belief = root.SetiAIBelief;
  let policyNetwork = root.SetiAIPolicyNetwork;
  let valueNetwork = root.SetiAIValueNetwork;
  let behaviorCloning = root.SetiAIBehaviorCloning;
  let selfPlay = root.SetiAISelfPlay;
  let regressionEval = root.SetiAIRegressionEval;
  let trainedModels = root.SetiAITrainedModels;
  let expertTrainedModels = root.SetiAIExpertTrainedModels;

  if ((!valuation || !goals || !actionGraph || !planner || !evaluator || !policy || !analytics || !seed || !observation || !environment || !legalActions || !dataRecorder || !mcts || !belief || !policyNetwork || !valueNetwork || !behaviorCloning || !selfPlay || !regressionEval || !trainedModels || !expertTrainedModels) && typeof require === "function") {
    valuation = valuation || require("./valuation");
    goals = goals || require("./goals");
    actionGraph = actionGraph || require("./action-graph");
    planner = planner || require("./planner");
    evaluator = evaluator || require("./evaluator");
    policy = policy || require("./policy");
    analytics = analytics || require("./battle-analytics");
    seed = seed || require("./seed");
    observation = observation || require("./observation");
    environment = environment || require("./environment");
    legalActions = legalActions || require("./legal-actions");
    dataRecorder = dataRecorder || require("./data-recorder");
    mcts = mcts || require("./mcts");
    belief = belief || require("./belief");
    policyNetwork = policyNetwork || require("./policy-network");
    valueNetwork = valueNetwork || require("./value-network");
    behaviorCloning = behaviorCloning || require("./behavior-cloning");
    selfPlay = selfPlay || require("./self-play");
    regressionEval = regressionEval || require("./regression-eval");
    trainedModels = trainedModels || require("./trained-models");
    expertTrainedModels = expertTrainedModels || require("./expert-trained-models");
  }

  const api = factory(valuation, goals, actionGraph, planner, evaluator, policy, analytics, seed, observation, environment, legalActions, dataRecorder, mcts, belief, policyNetwork, valueNetwork, behaviorCloning, selfPlay, regressionEval, trainedModels, expertTrainedModels);

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.SetiAI = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function (valuation, goals, actionGraph, planner, evaluator, policy, analytics, seed, observation, environment, legalActions, dataRecorder, mcts, belief, policyNetwork, valueNetwork, behaviorCloning, selfPlay, regressionEval, trainedModels, expertTrainedModels) {
  "use strict";

  return Object.freeze({
    valuation,
    goals,
    actionGraph,
    planner,
    evaluator,
    policy,
    analytics,
    seed,
    observation,
    environment,
    legalActions,
    dataRecorder,
    mcts,
    belief,
    policyNetwork,
    valueNetwork,
    behaviorCloning,
    selfPlay,
    regressionEval,
    trainedModels,
    expertTrainedModels,
  });
});
