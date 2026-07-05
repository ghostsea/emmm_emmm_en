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

  root.SetiAIMcts = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function (seedModule) {
  "use strict";

  const DEFAULT_OPTIONS = Object.freeze({
    seed: "seti-mcts",
    simulations: 64,
    maxDepth: 6,
    cpuct: 1.8,
    progressiveWidening: true,
    progressiveWideningK: 8,
    progressiveWideningAlpha: 0.5,
    rolloutDepth: 4,
    multiStepScoring: false,
    valueDiscount: 0.95,
    stepRewardWeight: 1,
    leafValueWeight: 1,
    selfAggressiveBias: 0,
    selfAggressiveNegativeScale: 0.35,
    rootNoiseEnabled: false,
    rootNoiseAlpha: 0.3,
    rootNoiseWeight: 0.25,
  });

  function numeric(value, fallback = 0) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }

  function clampInteger(value, minimum, fallback) {
    const rounded = Math.round(numeric(value, fallback));
    return Math.max(minimum, rounded);
  }

  function clone(value) {
    if (value == null) return value;
    if (typeof structuredClone === "function") return structuredClone(value);
    return JSON.parse(JSON.stringify(value));
  }

  function toScalarValue(value, rootPlayerId = null) {
    if (typeof value === "number") return Number.isFinite(value) ? value : 0;
    if (value && typeof value === "object") {
      if (rootPlayerId && Number.isFinite(Number(value[rootPlayerId]))) {
        return Number(value[rootPlayerId]);
      }
      if (Number.isFinite(Number(value.value))) return Number(value.value);
    }
    return 0;
  }

  function normalizeAction(action, index) {
    if (!action || action.available === false) return null;
    const id = String(action.id || action.actionId || `action-${index}`);
    return {
      ...action,
      id,
      prior: Math.max(0, numeric(action.prior, 0)),
    };
  }

  function normalizeActionList(actions = []) {
    const normalized = [];
    for (let index = 0; index < (actions || []).length; index += 1) {
      const candidate = normalizeAction(actions[index], index);
      if (candidate) normalized.push(candidate);
    }
    if (!normalized.length) return normalized;
    const hasPrior = normalized.some((action) => action.prior > 0);
    if (!hasPrior) {
      const uniform = 1 / normalized.length;
      return normalized.map((action) => ({ ...action, prior: uniform }));
    }
    const priorSum = normalized.reduce((sum, action) => sum + action.prior, 0);
    if (priorSum <= 0) {
      const uniform = 1 / normalized.length;
      return normalized.map((action) => ({ ...action, prior: uniform }));
    }
    return normalized.map((action) => ({ ...action, prior: action.prior / priorSum }));
  }

  function chooseRandom(items, random) {
    if (!items.length) return null;
    const index = Math.floor(random() * items.length);
    return items[Math.max(0, Math.min(items.length - 1, index))];
  }

  function sampleGamma(random, shape) {
    const alpha = Math.max(1e-8, numeric(shape, 1));
    if (alpha < 1) {
      const u = Math.max(1e-12, random());
      return sampleGamma(random, alpha + 1) * Math.pow(u, 1 / alpha);
    }

    const d = alpha - 1 / 3;
    const c = 1 / Math.sqrt(9 * d);

    while (true) {
      let x = 0;
      let v = 0;
      do {
        const u1 = Math.max(1e-12, random());
        const u2 = Math.max(1e-12, random());
        const normal = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
        x = normal;
        v = 1 + c * x;
      } while (v <= 0);

      v *= v * v;
      const u = Math.max(1e-12, random());
      if (u < 1 - 0.0331 * (x * x) * (x * x)) return d * v;
      if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v;
    }
  }

  function sampleDirichlet(random, size, alpha) {
    const dimension = Math.max(1, Math.round(numeric(size, 1)));
    const concentration = Math.max(1e-8, numeric(alpha, 0.3));
    const samples = [];
    let total = 0;
    for (let index = 0; index < dimension; index += 1) {
      const value = sampleGamma(random, concentration);
      samples.push(value);
      total += value;
    }
    if (total <= 0) {
      return samples.map(() => 1 / dimension);
    }
    return samples.map((value) => value / total);
  }

  function applyRootNoise(children = [], options = {}, random) {
    if (!Array.isArray(children) || children.length < 2) return [];
    if (!options.rootNoiseEnabled) return children;

    const weight = Math.max(0, Math.min(1, numeric(options.rootNoiseWeight, DEFAULT_OPTIONS.rootNoiseWeight)));
    if (weight <= 0) return children;

    const alpha = Math.max(1e-8, numeric(options.rootNoiseAlpha, DEFAULT_OPTIONS.rootNoiseAlpha));
    const noise = sampleDirichlet(random, children.length, alpha);
    const mixed = children.map((child, index) => {
      const prior = Math.max(0, numeric(child.prior, 0));
      const noisyPrior = ((1 - weight) * prior) + (weight * noise[index]);
      return {
        ...child,
        prior: noisyPrior,
      };
    });
    const priorSum = mixed.reduce((sum, child) => sum + Math.max(0, numeric(child.prior, 0)), 0);
    if (priorSum <= 0) return mixed;
    return mixed.map((child) => ({
      ...child,
      prior: Math.max(0, numeric(child.prior, 0)) / priorSum,
    }));
  }

  function createNode(state = null, playerId = null, depth = 0) {
    return {
      state,
      playerId,
      depth,
      visits: 0,
      valueSum: 0,
      children: [],
      childrenSortedByPrior: false,
      expanded: false,
      terminal: false,
      modelEvaluated: false,
      modelEvaluationSource: null,
    };
  }

  function countEvaluatedNodes(node = null) {
    if (!node) return 0;
    let count = node.modelEvaluated ? 1 : 0;
    for (const edge of node.children || []) {
      if (edge?.child) count += countEvaluatedNodes(edge.child);
    }
    return count;
  }

  function shapeTransitionReward(reward, actorPlayerId, rootPlayerId, options = {}) {
    const raw = numeric(reward, 0);
    if (!options.multiStepScoring) return raw;
    if (actorPlayerId !== rootPlayerId) return raw;
    const bias = Math.max(0, numeric(options.selfAggressiveBias, DEFAULT_OPTIONS.selfAggressiveBias));
    if (bias <= 0) return raw;
    const negativeScale = Math.max(0, Math.min(1, numeric(
      options.selfAggressiveNegativeScale,
      DEFAULT_OPTIONS.selfAggressiveNegativeScale,
    )));
    if (raw >= 0) return raw * (1 + bias);
    return raw * (1 - (bias * negativeScale));
  }

  function getTransitionReward(hooks, previousState, action, nextState, context = {}, rootPlayerId = null) {
    if (typeof hooks.getTransitionReward !== "function") return 0;
    return toScalarValue(hooks.getTransitionReward(previousState, action, nextState, context), rootPlayerId);
  }

  function combinePathAndLeafValue(pathValue, leafValue, discount, options = {}) {
    if (!options.multiStepScoring) return numeric(leafValue, 0);
    const stepWeight = Math.max(0, numeric(options.stepRewardWeight, DEFAULT_OPTIONS.stepRewardWeight));
    const leafWeight = Math.max(0, numeric(options.leafValueWeight, DEFAULT_OPTIONS.leafValueWeight));
    return (stepWeight * numeric(pathValue, 0)) + (leafWeight * numeric(discount, 1) * numeric(leafValue, 0));
  }

  function extractEvaluationValue(evaluation = null) {
    if (!evaluation || typeof evaluation !== "object") return null;
    const normalized = Number(evaluation.normalizedValue);
    if (Number.isFinite(normalized)) return normalized;
    const value = Number(evaluation.value);
    return Number.isFinite(value) ? value : null;
  }

  function extractEvaluationPolicyMap(evaluation = null) {
    if (!evaluation || typeof evaluation !== "object") return null;
    const map = evaluation.policyByActionId || evaluation.probabilityByActionId || evaluation.priorsByActionId || null;
    return map && typeof map === "object" ? map : null;
  }

  function applyEvaluationPolicy(actions = [], evaluation = null) {
    const policyByActionId = extractEvaluationPolicyMap(evaluation);
    if (!policyByActionId) return actions;
    return normalizeActionList(actions.map((action) => {
      const prior = Number(policyByActionId[action.id]);
      if (!Number.isFinite(prior)) return action;
      return {
        ...action,
        prior: Math.max(0, prior),
      };
    }));
  }

  async function evaluateStateAsync(state, hooks, rootPlayerId, context = {}) {
    if (typeof hooks.evaluateStateAsync === "function") {
      return toScalarValue(await hooks.evaluateStateAsync(state, rootPlayerId, context), rootPlayerId);
    }
    return toScalarValue(hooks.evaluateState(state, rootPlayerId, context), rootPlayerId);
  }

  function shouldExpandAllChildren(node, options) {
    if (!options.progressiveWidening) return true;
    const k = Math.max(1, numeric(options.progressiveWideningK, DEFAULT_OPTIONS.progressiveWideningK));
    const alpha = Math.max(0, numeric(options.progressiveWideningAlpha, DEFAULT_OPTIONS.progressiveWideningAlpha));
    const widened = Math.floor(k * Math.pow(Math.max(1, node.visits), alpha));
    return widened >= node.children.length;
  }

  function getSelectableChildren(node, options) {
    if (!node.children.length) return [];
    if (!options.progressiveWidening) return node.children;
    if (shouldExpandAllChildren(node, options)) return node.children;

    if (!node.childrenSortedByPrior) {
      node.children.sort((left, right) => right.prior - left.prior || left.action.id.localeCompare(right.action.id));
      node.childrenSortedByPrior = true;
    }

    const k = Math.max(1, numeric(options.progressiveWideningK, DEFAULT_OPTIONS.progressiveWideningK));
    const alpha = Math.max(0, numeric(options.progressiveWideningAlpha, DEFAULT_OPTIONS.progressiveWideningAlpha));
    const limit = Math.max(1, Math.floor(k * Math.pow(Math.max(1, node.visits), alpha)));
    return node.children.slice(0, limit);
  }

  function selectEdge(parentNode, options, random) {
    const candidates = getSelectableChildren(parentNode, options);
    if (!candidates.length) return null;

    const cpuct = Math.max(0, numeric(options.cpuct, DEFAULT_OPTIONS.cpuct));
    const parentVisits = Math.max(1, parentNode.visits);
    let bestScore = -Infinity;
    const ties = [];

    for (const edge of candidates) {
      const q = edge.visits > 0 ? edge.valueSum / edge.visits : 0;
      const u = cpuct * edge.prior * Math.sqrt(parentVisits) / (1 + edge.visits);
      const score = q + u;
      if (score > bestScore + 1e-9) {
        bestScore = score;
        ties.length = 0;
        ties.push(edge);
      } else if (Math.abs(score - bestScore) <= 1e-9) {
        ties.push(edge);
      }
    }

    if (ties.length === 1) return ties[0];
    return chooseRandom(ties, random);
  }

  function ensureExpanded(node, hooks, options, random, rootPlayerId) {
    if (node.expanded) return;

    if (typeof hooks.isTerminal === "function" && hooks.isTerminal(node.state, node.playerId, node.depth)) {
      node.terminal = true;
      node.expanded = true;
      return;
    }

    const actions = normalizeActionList(hooks.getLegalActions(node.state, node.playerId, {
      depth: node.depth,
      rootPlayerId,
      random,
    }) || []);

    if (!actions.length) {
      node.terminal = true;
      node.expanded = true;
      return;
    }

    node.children = actions.map((action) => ({
      action,
      prior: action.prior,
      visits: 0,
      valueSum: 0,
      child: null,
    }));
    node.expanded = true;
  }

  async function ensureExpandedAsync(node, hooks, options, random, rootPlayerId) {
    if (node.expanded) return { expandedNow: false, value: null, evaluation: null };

    if (typeof hooks.isTerminal === "function" && hooks.isTerminal(node.state, node.playerId, node.depth)) {
      node.terminal = true;
      node.expanded = true;
      const value = await evaluateStateAsync(node.state, hooks, rootPlayerId, {
        depth: node.depth,
        random,
        terminal: true,
      });
      return { expandedNow: true, value, evaluation: null };
    }

    let actions = normalizeActionList(hooks.getLegalActions(node.state, node.playerId, {
      depth: node.depth,
      rootPlayerId,
      random,
    }) || []);

    if (!actions.length) {
      node.terminal = true;
      node.expanded = true;
      const value = await evaluateStateAsync(node.state, hooks, rootPlayerId, {
        depth: node.depth,
        random,
        blocked: true,
      });
      return { expandedNow: true, value, evaluation: null };
    }

    let evaluation = null;
    if (typeof hooks.evaluateNodeAsync === "function") {
      evaluation = await hooks.evaluateNodeAsync(node.state, actions, {
        depth: node.depth,
        playerId: node.playerId,
        rootPlayerId,
        random,
      });
      if (evaluation) {
        node.modelEvaluated = true;
        node.modelEvaluationSource = evaluation.source || null;
      }
      actions = applyEvaluationPolicy(actions, evaluation);
    }

    node.children = actions.map((action) => ({
      action,
      prior: action.prior,
      visits: 0,
      valueSum: 0,
      child: null,
    }));
    node.expanded = true;
    return {
      expandedNow: true,
      value: extractEvaluationValue(evaluation),
      evaluation,
    };
  }

  function rolloutValue(state, playerId, hooks, options, random, rootPlayerId, startDepth) {
    const rolloutDepth = Math.max(0, clampInteger(options.rolloutDepth, 0, DEFAULT_OPTIONS.rolloutDepth));
    const valueDiscount = Math.max(0, Math.min(1, numeric(options.valueDiscount, DEFAULT_OPTIONS.valueDiscount)));
    let currentState = state;
    let currentPlayerId = playerId;
    let pathValue = 0;
    let discount = 1;

    for (let step = 0; step < rolloutDepth; step += 1) {
      const depth = startDepth + step;
      if (typeof hooks.isTerminal === "function" && hooks.isTerminal(currentState, currentPlayerId, depth)) {
        break;
      }
      const actions = normalizeActionList(hooks.getLegalActions(currentState, currentPlayerId, {
        depth,
        rootPlayerId,
        random,
      }) || []);
      if (!actions.length) break;
      const picked = typeof hooks.rolloutPolicy === "function"
        ? hooks.rolloutPolicy(currentState, actions, { depth, rootPlayerId, random })
        : chooseRandom(actions, random);
      if (!picked) break;

      const previousState = currentState;
      const nextState = hooks.applyAction(previousState, picked, {
        depth,
        rootPlayerId,
        random,
      });
      if (options.multiStepScoring) {
        const reward = getTransitionReward(hooks, previousState, picked, nextState, {
          depth,
          rootPlayerId,
          random,
          actorPlayerId: currentPlayerId,
          rollout: true,
        }, rootPlayerId);
        const shapedReward = shapeTransitionReward(reward, currentPlayerId, rootPlayerId, options);
        pathValue += discount * shapedReward;
        discount *= valueDiscount;
      }

      currentState = nextState;
      currentPlayerId = hooks.getCurrentPlayerId(currentState);
    }

    const leafValue = toScalarValue(hooks.evaluateState(currentState, rootPlayerId, {
      depth: startDepth + rolloutDepth,
      random,
    }), rootPlayerId);
    return combinePathAndLeafValue(pathValue, leafValue, discount, options);
  }

  function runSingleSimulation(rootNode, hooks, options, random, rootPlayerId) {
    const trail = [];
    let node = rootNode;
    const valueDiscount = Math.max(0, Math.min(1, numeric(options.valueDiscount, DEFAULT_OPTIONS.valueDiscount)));
    let pathValue = 0;
    let discount = 1;

    for (let depth = 0; depth < options.maxDepth; depth += 1) {
      node.depth = depth;
      ensureExpanded(node, hooks, options, random, rootPlayerId);

      if (node.terminal) {
        const terminalValue = toScalarValue(hooks.evaluateState(node.state, rootPlayerId, {
          depth,
          random,
          terminal: true,
        }), rootPlayerId);
        return { value: combinePathAndLeafValue(pathValue, terminalValue, discount, options), trail };
      }

      if (!node.children.length) {
        const blockedValue = toScalarValue(hooks.evaluateState(node.state, rootPlayerId, {
          depth,
          random,
          blocked: true,
        }), rootPlayerId);
        return { value: combinePathAndLeafValue(pathValue, blockedValue, discount, options), trail };
      }

      const edge = selectEdge(node, options, random);
      if (!edge) {
        const fallbackValue = toScalarValue(hooks.evaluateState(node.state, rootPlayerId, {
          depth,
          random,
          blocked: true,
        }), rootPlayerId);
        return { value: combinePathAndLeafValue(pathValue, fallbackValue, discount, options), trail };
      }

      if (!edge.child) {
        const previousState = node.state;
        const actorPlayerId = node.playerId;
        const nextState = hooks.applyAction(previousState, edge.action, {
          depth,
          rootPlayerId,
          random,
        });
        if (options.multiStepScoring) {
          const reward = getTransitionReward(hooks, previousState, edge.action, nextState, {
            depth,
            rootPlayerId,
            random,
            actorPlayerId,
            rollout: false,
          }, rootPlayerId);
          const shapedReward = shapeTransitionReward(reward, actorPlayerId, rootPlayerId, options);
          pathValue += discount * shapedReward;
          discount *= valueDiscount;
        }
        edge.child = createNode(nextState, hooks.getCurrentPlayerId(nextState), depth + 1);
      }

      trail.push({ node, edge });
      node = edge.child;

      if (node.visits === 0 && depth + 1 < options.maxDepth - 1) {
        const continuationValue = rolloutValue(node.state, node.playerId, hooks, options, random, rootPlayerId, depth + 1);
        const value = options.multiStepScoring
          ? pathValue + (discount * continuationValue)
          : continuationValue;
        return { value, trail };
      }
    }

    const leafValue = toScalarValue(hooks.evaluateState(node.state, rootPlayerId, {
      depth: options.maxDepth,
      random,
      depthCap: true,
    }), rootPlayerId);
    return { value: combinePathAndLeafValue(pathValue, leafValue, discount, options), trail };
  }

  async function runSingleSimulationAsync(rootNode, hooks, options, random, rootPlayerId) {
    const trail = [];
    let node = rootNode;
    const valueDiscount = Math.max(0, Math.min(1, numeric(options.valueDiscount, DEFAULT_OPTIONS.valueDiscount)));
    let pathValue = 0;
    let discount = 1;

    for (let depth = 0; depth < options.maxDepth; depth += 1) {
      node.depth = depth;
      const expansion = await ensureExpandedAsync(node, hooks, options, random, rootPlayerId);

      if (node.terminal) {
        const terminalValue = Number.isFinite(Number(expansion.value))
          ? Number(expansion.value)
          : await evaluateStateAsync(node.state, hooks, rootPlayerId, {
            depth,
            random,
            terminal: true,
          });
        return { value: combinePathAndLeafValue(pathValue, terminalValue, discount, options), trail };
      }

      if (!node.children.length) {
        const blockedValue = Number.isFinite(Number(expansion.value))
          ? Number(expansion.value)
          : await evaluateStateAsync(node.state, hooks, rootPlayerId, {
            depth,
            random,
            blocked: true,
          });
        return { value: combinePathAndLeafValue(pathValue, blockedValue, discount, options), trail };
      }

      if (expansion.expandedNow && node !== rootNode) {
        const leafValue = Number.isFinite(Number(expansion.value))
          ? Number(expansion.value)
          : await evaluateStateAsync(node.state, hooks, rootPlayerId, {
            depth,
            random,
          });
        return { value: combinePathAndLeafValue(pathValue, leafValue, discount, options), trail };
      }

      const edge = selectEdge(node, options, random);
      if (!edge) {
        const fallbackValue = await evaluateStateAsync(node.state, hooks, rootPlayerId, {
          depth,
          random,
          blocked: true,
        });
        return { value: combinePathAndLeafValue(pathValue, fallbackValue, discount, options), trail };
      }

      if (!edge.child) {
        const previousState = node.state;
        const actorPlayerId = node.playerId;
        const nextState = hooks.applyAction(previousState, edge.action, {
          depth,
          rootPlayerId,
          random,
        });
        if (options.multiStepScoring) {
          const reward = getTransitionReward(hooks, previousState, edge.action, nextState, {
            depth,
            rootPlayerId,
            random,
            actorPlayerId,
            rollout: false,
          }, rootPlayerId);
          const shapedReward = shapeTransitionReward(reward, actorPlayerId, rootPlayerId, options);
          pathValue += discount * shapedReward;
          discount *= valueDiscount;
        }
        edge.child = createNode(nextState, hooks.getCurrentPlayerId(nextState), depth + 1);
      }

      trail.push({ node, edge });
      node = edge.child;

      if (node.visits === 0) {
        node.depth = depth + 1;
        const childExpansion = await ensureExpandedAsync(node, hooks, options, random, rootPlayerId);
        const leafValue = Number.isFinite(Number(childExpansion.value))
          ? Number(childExpansion.value)
          : await evaluateStateAsync(node.state, hooks, rootPlayerId, {
            depth: depth + 1,
            random,
          });
        return { value: combinePathAndLeafValue(pathValue, leafValue, discount, options), trail };
      }
    }

    node.depth = options.maxDepth;
    const depthCapExpansion = await ensureExpandedAsync(node, hooks, options, random, rootPlayerId);
    const leafValue = Number.isFinite(Number(depthCapExpansion.value))
      ? Number(depthCapExpansion.value)
      : await evaluateStateAsync(node.state, hooks, rootPlayerId, {
        depth: options.maxDepth,
        random,
        depthCap: true,
      });
    return { value: combinePathAndLeafValue(pathValue, leafValue, discount, options), trail };
  }

  function buildResult(rootNode, config = {}) {
    const edges = rootNode.children || [];
    const sortedEdges = [...edges].sort((left, right) => (
      right.visits - left.visits
      || (right.visits > 0 ? right.valueSum / right.visits : -Infinity) - (left.visits > 0 ? left.valueSum / left.visits : -Infinity)
      || left.action.id.localeCompare(right.action.id)
    ));
    const bestEdge = sortedEdges[0] || null;

    return {
      seed: config.seed,
      simulations: config.simulations,
      maxDepth: config.maxDepth,
      cpuct: config.cpuct,
      bestAction: bestEdge ? clone(bestEdge.action) : null,
      policy: sortedEdges.map((edge) => ({
        actionId: edge.action.id,
        visits: edge.visits,
        averageValue: edge.visits > 0 ? edge.valueSum / edge.visits : 0,
        prior: edge.prior,
      })),
      diagnostics: {
        rootVisits: rootNode.visits,
        exploredActions: edges.length,
      },
    };
  }

  function createMctsPlanner(userOptions = {}) {
    const merged = {
      ...DEFAULT_OPTIONS,
      ...userOptions,
    };

    const normalized = {
      seed: seedModule.normalizeSeedInput(merged.seed),
      simulations: clampInteger(merged.simulations, 1, DEFAULT_OPTIONS.simulations),
      maxDepth: clampInteger(merged.maxDepth, 1, DEFAULT_OPTIONS.maxDepth),
      cpuct: Math.max(0, numeric(merged.cpuct, DEFAULT_OPTIONS.cpuct)),
      progressiveWidening: merged.progressiveWidening !== false,
      progressiveWideningK: Math.max(1, numeric(merged.progressiveWideningK, DEFAULT_OPTIONS.progressiveWideningK)),
      progressiveWideningAlpha: Math.max(0, numeric(merged.progressiveWideningAlpha, DEFAULT_OPTIONS.progressiveWideningAlpha)),
      rolloutDepth: Math.max(0, clampInteger(merged.rolloutDepth, 0, DEFAULT_OPTIONS.rolloutDepth)),
      multiStepScoring: merged.multiStepScoring === true,
      valueDiscount: Math.max(0, Math.min(1, numeric(merged.valueDiscount, DEFAULT_OPTIONS.valueDiscount))),
      stepRewardWeight: Math.max(0, numeric(merged.stepRewardWeight, DEFAULT_OPTIONS.stepRewardWeight)),
      leafValueWeight: Math.max(0, numeric(merged.leafValueWeight, DEFAULT_OPTIONS.leafValueWeight)),
      selfAggressiveBias: Math.max(0, numeric(merged.selfAggressiveBias, DEFAULT_OPTIONS.selfAggressiveBias)),
      selfAggressiveNegativeScale: Math.max(0, Math.min(1, numeric(
        merged.selfAggressiveNegativeScale,
        DEFAULT_OPTIONS.selfAggressiveNegativeScale,
      ))),
      rootNoiseEnabled: merged.rootNoiseEnabled === true,
      rootNoiseAlpha: Math.max(1e-8, numeric(merged.rootNoiseAlpha, DEFAULT_OPTIONS.rootNoiseAlpha)),
      rootNoiseWeight: Math.max(0, Math.min(1, numeric(merged.rootNoiseWeight, DEFAULT_OPTIONS.rootNoiseWeight))),
      cloneState: typeof merged.cloneState === "function" ? merged.cloneState : clone,
    };

    function runSearch(initialState, hooks = {}, searchOptions = {}) {
      const seedText = seedModule.normalizeSeedInput(searchOptions.seed ?? normalized.seed);
      const random = seedModule.createSeededRandom(seedText);
      const simulations = clampInteger(searchOptions.simulations, 1, normalized.simulations);
      const maxDepth = clampInteger(searchOptions.maxDepth, 1, normalized.maxDepth);
      const rootPlayerId = searchOptions.rootPlayerId || hooks.getCurrentPlayerId(initialState);
      const localOptions = {
        ...normalized,
        ...searchOptions,
        seed: seedText,
        simulations,
        maxDepth,
      };

      if (typeof hooks.getCurrentPlayerId !== "function"
        || typeof hooks.getLegalActions !== "function"
        || typeof hooks.applyAction !== "function"
        || typeof hooks.evaluateState !== "function") {
        return {
          seed: seedText,
          simulations,
          maxDepth,
          cpuct: localOptions.cpuct,
          bestAction: null,
          policy: [],
          diagnostics: {
            rootVisits: 0,
            exploredActions: 0,
            error: "missing required mcts hooks",
          },
        };
      }

      const rootState = localOptions.cloneState(initialState);
      const rootNode = createNode(rootState, rootPlayerId, 0);

      ensureExpanded(rootNode, hooks, localOptions, random, rootPlayerId);
      if (rootNode.children.length > 1) {
        rootNode.children = applyRootNoise(rootNode.children, localOptions, random);
      }

      for (let index = 0; index < simulations; index += 1) {
        const result = runSingleSimulation(rootNode, hooks, localOptions, random, rootPlayerId);
        const value = numeric(result.value, 0);

        rootNode.visits += 1;
        rootNode.valueSum += value;

        for (const item of result.trail) {
          item.edge.visits += 1;
          item.edge.valueSum += value;
          if (item.edge.child) {
            item.edge.child.visits += 1;
            item.edge.child.valueSum += value;
          }
        }
      }

      return buildResult(rootNode, localOptions);
    }

    async function runSearchAsync(initialState, hooks = {}, searchOptions = {}) {
      const seedText = seedModule.normalizeSeedInput(searchOptions.seed ?? normalized.seed);
      const random = seedModule.createSeededRandom(seedText);
      const simulations = clampInteger(searchOptions.simulations, 1, normalized.simulations);
      const maxDepth = clampInteger(searchOptions.maxDepth, 1, normalized.maxDepth);
      const rootPlayerId = searchOptions.rootPlayerId || hooks.getCurrentPlayerId(initialState);
      const localOptions = {
        ...normalized,
        ...searchOptions,
        seed: seedText,
        simulations,
        maxDepth,
      };

      if (typeof hooks.getCurrentPlayerId !== "function"
        || typeof hooks.getLegalActions !== "function"
        || typeof hooks.applyAction !== "function"
        || typeof hooks.evaluateState !== "function") {
        return {
          seed: seedText,
          simulations,
          maxDepth,
          cpuct: localOptions.cpuct,
          bestAction: null,
          policy: [],
          diagnostics: {
            rootVisits: 0,
            exploredActions: 0,
            async: true,
            error: "missing required mcts hooks",
          },
        };
      }

      const rootState = localOptions.cloneState(initialState);
      const rootNode = createNode(rootState, rootPlayerId, 0);

      await ensureExpandedAsync(rootNode, hooks, localOptions, random, rootPlayerId);
      if (rootNode.children.length > 1) {
        rootNode.children = applyRootNoise(rootNode.children, localOptions, random);
      }

      for (let index = 0; index < simulations; index += 1) {
        const result = await runSingleSimulationAsync(rootNode, hooks, localOptions, random, rootPlayerId);
        const value = numeric(result.value, 0);

        rootNode.visits += 1;
        rootNode.valueSum += value;

        for (const item of result.trail) {
          item.edge.visits += 1;
          item.edge.valueSum += value;
          if (item.edge.child) {
            item.edge.child.visits += 1;
            item.edge.child.valueSum += value;
          }
        }
      }

      const result = buildResult(rootNode, localOptions);
      result.diagnostics = {
        ...(result.diagnostics || {}),
        async: true,
        modelEvaluatedNodes: countEvaluatedNodes(rootNode),
      };
      return result;
    }

    return Object.freeze({
      runSearch,
      runSearchAsync,
    });
  }

  return Object.freeze({
    DEFAULT_OPTIONS,
    createMctsPlanner,
  });
});
