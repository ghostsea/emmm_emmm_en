(function (root, factory) {
  "use strict";

  let seed = root.SetiAISeed;
  let policyNetwork = root.SetiAIPolicyNetwork;

  if ((!seed || !policyNetwork) && typeof require === "function") {
    seed = seed || require("./seed");
    policyNetwork = policyNetwork || require("./policy-network");
  }

  const api = factory(seed, policyNetwork);

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.SetiAIValueNetwork = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function (seedModule, policyNetworkModule) {
  "use strict";

  const DEFAULT_VALUE_NETWORK_CONFIG = Object.freeze({
    seed: "seti-value-net",
    inputSize: 24,
    hiddenSize: 96,
    outputScale: 100,
  });

  function numeric(value, fallback = 0) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }

  function tanh(value) {
    if (value > 20) return 1;
    if (value < -20) return -1;
    const exp = Math.exp(value * 2);
    return (exp - 1) / (exp + 1);
  }

  function dot(left = [], right = []) {
    let total = 0;
    const size = Math.min(left.length, right.length);
    for (let index = 0; index < size; index += 1) {
      total += left[index] * right[index];
    }
    return total;
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

  function computePlayerScoreFeature(player = {}) {
    const resources = player.resources || {};
    const score = numeric(resources.score, 0);
    const credits = numeric(resources.credits, 0);
    const energy = numeric(resources.energy, 0);
    const publicity = numeric(resources.publicity, 0);
    const data = numeric(resources.availableData, 0);
    const handSize = numeric(player.handSize, resources.handSize || 0);
    const reserved = numeric(player.reservedCardCount, 0);
    return score + (credits * 0.4) + (energy * 0.35) + (publicity * 0.25) + (data * 0.3) + (handSize * 0.15) + (reserved * 0.1);
  }

  function estimateRanking(observation = {}) {
    const players = Array.isArray(observation.public?.players) ? observation.public.players : [];
    const scores = players.map((player) => ({
      playerId: player.id || null,
      estimate: computePlayerScoreFeature(player),
    })).sort((left, right) => right.estimate - left.estimate || String(left.playerId || "").localeCompare(String(right.playerId || "")));

    return scores.map((entry, index) => ({
      playerId: entry.playerId,
      rank: index + 1,
      estimate: entry.estimate,
    }));
  }

  function createValueNetwork(config = {}) {
    const merged = {
      ...DEFAULT_VALUE_NETWORK_CONFIG,
      ...config,
    };

    const inputSize = Math.max(8, Math.round(numeric(merged.inputSize, DEFAULT_VALUE_NETWORK_CONFIG.inputSize)));
    const hiddenSize = Math.max(16, Math.round(numeric(merged.hiddenSize, DEFAULT_VALUE_NETWORK_CONFIG.hiddenSize)));
    const outputScale = Math.max(1, numeric(merged.outputScale, DEFAULT_VALUE_NETWORK_CONFIG.outputScale));
    const seedText = seedModule.normalizeSeedInput(merged.seed);
    const random = seedModule.createSeededRandom(seedText);

    const inputHidden = createWeightMatrix(hiddenSize, inputSize, random, 0.14);
    const hiddenBias = createWeightMatrix(hiddenSize, 1, random, 0.05).map((entry) => entry[0]);
    const hiddenHead = createWeightMatrix(hiddenSize, 1, random, 0.12).map((entry) => entry[0]);
    const scalarBias = ((random() * 2) - 1) * 0.05;

    function evaluate(observation = {}, options = {}) {
      const features = policyNetworkModule.extractObservationFeatures(observation, { inputSize });
      const hidden = inputHidden.map((row, rowIndex) => tanh(dot(row, features) + hiddenBias[rowIndex]));
      const raw = dot(hidden, hiddenHead) + scalarBias;
      const normalized = tanh(raw);
      const value = normalized * outputScale;
      const ranking = estimateRanking(observation);
      const perspectivePlayerId = options.playerId || observation.public?.currentPlayerId || null;
      const perspectiveRank = ranking.find((entry) => entry.playerId === perspectivePlayerId)?.rank || null;
      const perspectiveBonus = perspectiveRank != null ? (ranking.length - perspectiveRank + 1) * 2 : 0;
      const adjustedValue = value + perspectiveBonus;

      return {
        features,
        raw,
        normalized,
        value,
        adjustedValue,
        perspectivePlayerId,
        perspectiveRank,
        ranking,
      };
    }

    return Object.freeze({
      config: Object.freeze({
        seed: seedText,
        inputSize,
        hiddenSize,
        outputScale,
      }),
      evaluate,
    });
  }

  function evaluateObservationValue(observation = {}, options = {}) {
    const network = createValueNetwork(options.networkConfig || options);
    return network.evaluate(observation, options);
  }

  return Object.freeze({
    DEFAULT_VALUE_NETWORK_CONFIG,
    estimateRanking,
    createValueNetwork,
    evaluateObservationValue,
  });
});
