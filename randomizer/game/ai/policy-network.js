(function (root, factory) {
  "use strict";

  let seed = root.SetiAISeed;

  if (!seed && typeof require === "function") {
    seed = require("./seed");
  }

  const api = factory(seed);

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.SetiAIPolicyNetwork = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function (seedModule) {
  "use strict";

  const DEFAULT_POLICY_NETWORK_CONFIG = Object.freeze({
    seed: "seti-policy-net",
    inputSize: 32,
    hiddenSize: 128,
    actionEmbeddingSize: 16,
    temperature: 1,
  });

  function numeric(value, fallback = 0) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, value));
  }

  function hashString(text) {
    const input = String(text || "");
    let hash = 2166136261;
    for (let index = 0; index < input.length; index += 1) {
      hash ^= input.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function summarizeResources(resources = {}) {
    return {
      score: numeric(resources.score, 0),
      credits: numeric(resources.credits, 0),
      energy: numeric(resources.energy, 0),
      publicity: numeric(resources.publicity, 0),
      availableData: numeric(resources.availableData, 0),
      handSize: numeric(resources.handSize, 0),
      additionalPublicScan: numeric(resources.additionalPublicScan, 0),
    };
  }

  function extractObservationFeatures(observation = {}, config = {}) {
    const inputSize = Math.max(8, Math.round(numeric(config.inputSize, DEFAULT_POLICY_NETWORK_CONFIG.inputSize)));
    const feature = [];

    const decisionLevel = String(observation?.decision?.actionLevel || "turn");
    const decisionType = String(observation?.decision?.decisionType || "turn-action");
    const pendingScanTargetType = String(observation?.decision?.pendingScanTargetType || "");

    const round = numeric(observation.public?.roundNumber, 0);
    const turn = numeric(observation.public?.turnNumber, 0);
    const players = Array.isArray(observation.public?.players) ? observation.public.players : [];
    const currentPlayerId = observation.public?.currentPlayerId || null;
    const selfPublic = players.find((entry) => entry?.id === currentPlayerId) || null;
    const selfPrivate = observation.private?.currentPlayer || {};
    const selfResources = summarizeResources(selfPrivate.resources || selfPublic?.resources || {});
    const opponentPublic = players.filter((entry) => entry?.id && entry.id !== currentPlayerId);

    const opponentTotals = opponentPublic.reduce((summary, player) => {
      const resources = summarizeResources(player.resources || {});
      summary.count += 1;
      summary.score += resources.score;
      summary.credits += resources.credits;
      summary.energy += resources.energy;
      summary.publicity += resources.publicity;
      summary.availableData += resources.availableData;
      summary.handSize += numeric(player.handSize, resources.handSize);
      summary.reservedCardCount += numeric(player.reservedCardCount, 0);
      return summary;
    }, {
      count: 0,
      score: 0,
      credits: 0,
      energy: 0,
      publicity: 0,
      availableData: 0,
      handSize: 0,
      reservedCardCount: 0,
    });
    const opponentCount = Math.max(1, opponentTotals.count || 1);

    feature.push(round / 10);
    feature.push(turn / 100);
    feature.push(players.length / 4);
    feature.push(selfResources.score / 100);
    feature.push(selfResources.credits / 20);
    feature.push(selfResources.energy / 20);
    feature.push(selfResources.publicity / 20);
    feature.push(selfResources.availableData / 20);
    feature.push((Array.isArray(selfPrivate.hand) ? selfPrivate.hand.length : selfResources.handSize) / 20);
    feature.push((Array.isArray(selfPrivate.reservedCards) ? selfPrivate.reservedCards.length : 0) / 10);
    feature.push((numeric(observation.public?.publicCards?.length, 0)) / 12);
    feature.push((numeric(observation.public?.discardPile?.length, 0)) / 60);
    feature.push((numeric(observation.public?.rockets?.length, 0)) / 24);
    feature.push((opponentTotals.score / opponentCount) / 100);
    feature.push((opponentTotals.credits / opponentCount) / 20);
    feature.push((opponentTotals.energy / opponentCount) / 20);
    feature.push((opponentTotals.publicity / opponentCount) / 20);
    feature.push((opponentTotals.availableData / opponentCount) / 20);
    feature.push((opponentTotals.handSize / opponentCount) / 20);
    feature.push((opponentTotals.reservedCardCount / opponentCount) / 10);
    feature.push((numeric(observation.hidden?.opponents?.length, opponentPublic.length)) / 3);
    feature.push((selfResources.additionalPublicScan || 0) / 8);
    feature.push(numeric(observation.private?.turnState?.turnCounter, 0) / 100);
    feature.push(numeric(observation.private?.turnState?.consecutivePasses, 0) / 4);

    feature.push(decisionLevel === "subflow" ? 1 : 0);
    feature.push(decisionType === "turn-action" ? 1 : 0);
    feature.push(decisionType === "scan-target" ? 1 : 0);
    feature.push(decisionType === "move-payment" ? 1 : 0);
    feature.push(decisionType === "alien-use" ? 1 : 0);
    feature.push(decisionType === "tech-placement" ? 1 : 0);
    feature.push(pendingScanTargetType ? 1 : 0);
    feature.push((hashString(`${decisionType}|${pendingScanTargetType}`) % 1000) / 1000);

    while (feature.length < inputSize) feature.push(0);
    return feature.slice(0, inputSize);
  }

  function relu(value) {
    return value > 0 ? value : 0;
  }

  function softmax(logits = [], temperature = 1) {
    const tau = Math.max(0.01, numeric(temperature, 1));
    const maxLogit = logits.reduce((current, value) => Math.max(current, value), -Infinity);
    const exps = logits.map((value) => (Number.isFinite(value) ? Math.exp((value - maxLogit) / tau) : 0));
    const total = exps.reduce((sum, value) => sum + value, 0);
    if (total <= 0) {
      const uniform = logits.length ? 1 / logits.length : 0;
      return logits.map(() => uniform);
    }
    return exps.map((value) => value / total);
  }

  function createWeightMatrix(rows, cols, random, scale = 1) {
    const matrix = [];
    for (let row = 0; row < rows; row += 1) {
      const line = [];
      for (let col = 0; col < cols; col += 1) {
        line.push(((random() * 2) - 1) * scale);
      }
      matrix.push(line);
    }
    return matrix;
  }

  function encodeAction(action = {}, embeddingSize = DEFAULT_POLICY_NETWORK_CONFIG.actionEmbeddingSize) {
    const id = String(action.id || action.actionId || "unknown");
    const kind = String(action.kind || "unknown");
    const key = `${kind}:${id}`;
    const base = hashString(key);
    const vector = [];
    for (let index = 0; index < embeddingSize; index += 1) {
      const bit = ((base >>> (index % 16)) & 1) ? 1 : -1;
      const wave = Math.sin((base % 97) * (index + 1) * 0.017);
      vector.push((bit * 0.7) + (wave * 0.3));
    }
    return vector;
  }

  function dot(left = [], right = []) {
    let total = 0;
    const size = Math.min(left.length, right.length);
    for (let index = 0; index < size; index += 1) {
      total += left[index] * right[index];
    }
    return total;
  }

  function multiplyMatrixVector(matrix = [], vector = []) {
    return matrix.map((row) => dot(row, vector));
  }

  function projectHiddenWithAction(hidden = [], actionEmbedding = [], interactionMatrix = []) {
    let score = 0;
    for (let row = 0; row < hidden.length; row += 1) {
      const interactions = interactionMatrix[row] || [];
      score += hidden[row] * dot(interactions, actionEmbedding);
    }
    return score;
  }

  function createPolicyNetwork(config = {}) {
    const merged = {
      ...DEFAULT_POLICY_NETWORK_CONFIG,
      ...config,
    };

    const inputSize = Math.max(8, Math.round(numeric(merged.inputSize, DEFAULT_POLICY_NETWORK_CONFIG.inputSize)));
    const hiddenSize = Math.max(16, Math.round(numeric(merged.hiddenSize, DEFAULT_POLICY_NETWORK_CONFIG.hiddenSize)));
    const actionEmbeddingSize = Math.max(8, Math.round(numeric(merged.actionEmbeddingSize, DEFAULT_POLICY_NETWORK_CONFIG.actionEmbeddingSize)));
    const seedText = seedModule.normalizeSeedInput(merged.seed);
    const random = seedModule.createSeededRandom(seedText);

    const inputHidden = createWeightMatrix(hiddenSize, inputSize, random, 0.12);
    const hiddenBias = createWeightMatrix(hiddenSize, 1, random, 0.04).map((entry) => entry[0]);
    const hiddenHead = createWeightMatrix(hiddenSize, 1, random, 0.1).map((entry) => entry[0]);
    const actionHead = createWeightMatrix(actionEmbeddingSize, 1, random, 0.1).map((entry) => entry[0]);
    const interaction = createWeightMatrix(hiddenSize, actionEmbeddingSize, random, 0.06);
    const globalBias = ((random() * 2) - 1) * 0.03;

    function computeHidden(features = []) {
      const preActivation = multiplyMatrixVector(inputHidden, features)
        .map((value, index) => value + hiddenBias[index]);
      return preActivation.map(relu);
    }

    function scoreAction(hidden, action = {}, options = {}) {
      const actionEmbedding = encodeAction(action, actionEmbeddingSize);
      const actionLinear = dot(actionEmbedding, actionHead);
      const hiddenLinear = dot(hidden, hiddenHead);
      const cross = projectHiddenWithAction(hidden, actionEmbedding, interaction);
      const availabilityPenalty = action.available === false ? -1e9 : 0;
      const explicitBias = numeric(action.score, 0) * clamp(numeric(options.scoreBiasWeight, 0.05), 0, 1);
      return hiddenLinear + actionLinear + cross + explicitBias + globalBias + availabilityPenalty;
    }

    function predict(observation = {}, candidates = [], options = {}) {
      const feature = extractObservationFeatures(observation, { inputSize });
      const hidden = computeHidden(feature);
      const logits = (candidates || []).map((action) => scoreAction(hidden, action, options));

      const legalIndices = [];
      for (let index = 0; index < (candidates || []).length; index += 1) {
        if (candidates[index]?.available !== false) legalIndices.push(index);
      }
      const legalLogits = legalIndices.map((index) => logits[index]);
      const legalProbabilities = softmax(legalLogits, options.temperature ?? merged.temperature);

      const probabilities = logits.map(() => 0);
      for (let index = 0; index < legalIndices.length; index += 1) {
        probabilities[legalIndices[index]] = legalProbabilities[index];
      }

      const ranked = (candidates || []).map((action, index) => ({
        action,
        probability: probabilities[index],
        logit: logits[index],
      })).sort((left, right) => (
        right.probability - left.probability
        || right.logit - left.logit
        || String(left.action?.id || "").localeCompare(String(right.action?.id || ""))
      ));

      return {
        feature,
        logits,
        probabilities,
        ranked,
        bestAction: ranked[0]?.action || null,
      };
    }

    return Object.freeze({
      config: Object.freeze({
        seed: seedText,
        inputSize,
        hiddenSize,
        actionEmbeddingSize,
        temperature: merged.temperature,
      }),
      predict,
    });
  }

  function buildActionPriors(observation = {}, candidates = [], options = {}) {
    const network = createPolicyNetwork(options.networkConfig || options);
    return network.predict(observation, candidates, options);
  }

  return Object.freeze({
    DEFAULT_POLICY_NETWORK_CONFIG,
    extractObservationFeatures,
    createPolicyNetwork,
    buildActionPriors,
  });
});
