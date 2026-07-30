(function (root, factory) {
  "use strict";

  const api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.SetiAbilityChain = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function () {
  "use strict";

  let nextHistoryFlowId = 1;

  function createHistoryFlowId(chainId) {
    const id = nextHistoryFlowId;
    nextHistoryFlowId += 1;
    return `${chainId || "ability-chain"}-flow-${id}`;
  }

  function normalizeInsertionSource(source) {
    if (!source || typeof source !== "object") return null;
    const effectIndex = Number.isInteger(source.effectIndex) ? source.effectIndex : null;
    const normalized = {
      chainId: source.chainId || null,
      effectIndex,
      effectId: source.effectId || null,
      effectType: source.effectType || null,
    };
    return (
      normalized.effectId
      || normalized.effectType
      || normalized.effectIndex !== null
    ) ? normalized : null;
  }

  function cloneInsertionSource(source) {
    const normalized = normalizeInsertionSource(source);
    return normalized ? { ...normalized } : null;
  }

  function normalizeMovementPoints(node) {
    return Math.max(1, Math.round(Number(node?.options?.movementPoints || 1)));
  }

  function hasMovementCost(node) {
    return Object.values(node?.options?.cost || {})
      .some((amount) => Math.max(0, Math.round(Number(amount) || 0)) > 0);
  }

  function stableSerialize(value) {
    if (Array.isArray(value)) return `[${value.map(stableSerialize).join(",")}]`;
    if (!value || typeof value !== "object") return JSON.stringify(value);
    return `{${Object.keys(value).sort().map((key) => (
      `${JSON.stringify(key)}:${stableSerialize(value[key])}`
    )).join(",")}}`;
  }

  function getMovementMergeSignature(node) {
    const options = { ...(node?.options || {}) };
    delete options.movementPoints;
    delete options.historyLabel;
    delete options.source;
    return stableSerialize(options);
  }

  function canMergeMovementNodes(target, incoming, moveType = "card_move") {
    if (!target || !incoming || target === incoming) return false;
    if (target.type !== moveType || incoming.type !== moveType) return false;
    if (!["active", "pending"].includes(target.status)) return false;
    if (hasMovementCost(target) || hasMovementCost(incoming)) return false;
    if (target.playerId && incoming.playerId && target.playerId !== incoming.playerId) return false;
    if (target.playerColor && incoming.playerColor && target.playerColor !== incoming.playerColor) return false;
    if (Boolean(target.required) !== Boolean(incoming.required)) return false;
    if (target.undoable === false || incoming.undoable === false) return false;
    return getMovementMergeSignature(target) === getMovementMergeSignature(incoming);
  }

  function cloneMergedMovementContribution(contribution) {
    if (!contribution || typeof contribution !== "object") return null;
    return {
      movementPoints: Math.max(0, Math.round(Number(contribution.movementPoints) || 0)),
      source: cloneInsertionSource(contribution.source),
      preHistoryCommands: Array.isArray(contribution.preHistoryCommands)
        ? [...contribution.preHistoryCommands]
        : [],
    };
  }

  function normalizeNode(node, index) {
    return {
      id: node.id || `ability-chain-node-${index}`,
      abilityId: node.abilityId || null,
      type: node.type || node.abilityId || null,
      icon: node.icon || null,
      label: node.label || node.abilityId || `能力 ${index + 1}`,
      status: node.status || "pending",
      undoable: node.undoable ?? true,
      required: Boolean(node.required || node.options?.required),
      playerId: node.playerId || node.options?.playerId || null,
      playerColor: node.playerColor || node.options?.playerColor || null,
      options: { ...(node.options || {}) },
      preHistoryCommands: Array.isArray(node.preHistoryCommands) ? [...node.preHistoryCommands] : [],
      preHistoryCommandsApplied: Boolean(node.preHistoryCommandsApplied),
      needsUserChoice: Boolean(node.needsUserChoice),
      result: node.result || null,
      insertedByEffect: cloneInsertionSource(node.insertedByEffect),
      mergedMovementContributions: Array.isArray(node.mergedMovementContributions)
        ? node.mergedMovementContributions.map(cloneMergedMovementContribution).filter(Boolean)
        : [],
    };
  }

  function startAbilityChain(chainId, label, nodes = []) {
    return {
      chainId,
      historyFlowId: createHistoryFlowId(chainId),
      actionType: chainId,
      label: label || chainId,
      effects: nodes.map(normalizeNode),
      currentIndex: 0,
      freeMoveMode: false,
      completed: false,
    };
  }

  function getCurrentChainNode(chain) {
    if (!chain || chain.completed) return null;
    return chain.effects[chain.currentIndex] || null;
  }

  function createInsertionSource(chain, node = null) {
    const current = node || getCurrentChainNode(chain);
    if (!chain || !current) return null;
    return normalizeInsertionSource({
      chainId: chain.chainId || null,
      effectIndex: chain.currentIndex,
      effectId: current.id || null,
      effectType: current.type || current.abilityId || null,
    });
  }

  function markInsertedNode(node, source) {
    const insertedByEffect = normalizeInsertionSource(source);
    if (!node || !insertedByEffect) return node;
    return {
      ...node,
      insertedByEffect,
    };
  }

  function mergePendingMovementNode(chain, incoming, source = null, options = {}) {
    if (!chain?.effects?.length || !incoming) return { merged: false };
    const moveType = options.moveType || "card_move";
    const target = chain.effects.find((node) => canMergeMovementNodes(node, incoming, moveType));
    if (!target) return { merged: false };

    const addedMovementPoints = normalizeMovementPoints(incoming);
    const targetMovementPoints = normalizeMovementPoints(target);
    const targetInsertionSource = cloneInsertionSource(target.insertedByEffect);
    const incomingSource = cloneInsertionSource(source);
    if (
      targetInsertionSource
      && !insertionOriginMatchesSource(targetInsertionSource, incomingSource)
    ) {
      if (!Array.isArray(target.mergedMovementContributions)) {
        target.mergedMovementContributions = [];
      }
      target.mergedMovementContributions.push({
        movementPoints: targetMovementPoints,
        source: targetInsertionSource,
        preHistoryCommands: Array.isArray(target.preHistoryCommands)
          ? [...target.preHistoryCommands]
          : [],
      });
      target.insertedByEffect = null;
    }
    const movementPoints = targetMovementPoints + addedMovementPoints;
    target.options = { ...(target.options || {}), movementPoints };
    target.badge = String(movementPoints);
    if (!Array.isArray(target.preHistoryCommands)) target.preHistoryCommands = [];
    const preHistoryCommands = Array.isArray(incoming.preHistoryCommands)
      ? [...incoming.preHistoryCommands]
      : [];
    target.preHistoryCommands.push(...preHistoryCommands);
    if (!Array.isArray(target.mergedMovementContributions)) {
      target.mergedMovementContributions = [];
    }
    target.mergedMovementContributions.push({
      movementPoints: addedMovementPoints,
      source: cloneInsertionSource(source),
      preHistoryCommands,
    });
    return { merged: true, target, addedMovementPoints, movementPoints };
  }

  function insertionOriginMatchesSource(origin, source) {
    const normalizedOrigin = normalizeInsertionSource(origin);
    const normalizedSource = normalizeInsertionSource(source);
    if (!normalizedOrigin || !normalizedSource) return false;
    if (
      normalizedOrigin.chainId
      && normalizedSource.chainId
      && normalizedOrigin.chainId !== normalizedSource.chainId
    ) return false;
    if (
      normalizedOrigin.effectId
      && normalizedSource.effectId
      && normalizedOrigin.effectId !== normalizedSource.effectId
    ) return false;
    if (
      normalizedOrigin.effectType
      && normalizedSource.effectType
      && normalizedOrigin.effectType !== normalizedSource.effectType
    ) return false;
    if (
      normalizedOrigin.effectIndex !== null
      && normalizedSource.effectIndex !== null
      && normalizedOrigin.effectIndex !== normalizedSource.effectIndex
    ) return false;
    return Boolean(
      (normalizedOrigin.effectId && normalizedSource.effectId)
      || (normalizedOrigin.effectType && normalizedSource.effectType)
      || (normalizedOrigin.effectIndex !== null && normalizedSource.effectIndex !== null)
    );
  }

  function removeInsertedNodesBySource(chain, source) {
    if (!chain?.effects?.length) return 0;
    const normalizedSource = normalizeInsertionSource(source);
    if (!normalizedSource) return 0;
    let removed = 0;
    for (let index = chain.effects.length - 1; index >= 0; index -= 1) {
      const node = chain.effects[index];
      if (!insertionOriginMatchesSource(node?.insertedByEffect, normalizedSource)) {
        const contributions = Array.isArray(node?.mergedMovementContributions)
          ? node.mergedMovementContributions
          : [];
        const removedContributions = contributions.filter((contribution) => (
          insertionOriginMatchesSource(contribution?.source, normalizedSource)
        ));
        if (!removedContributions.length) continue;
        const removedMovementPoints = removedContributions.reduce(
          (sum, contribution) => sum + Math.max(0, Math.round(Number(contribution.movementPoints) || 0)),
          0,
        );
        node.mergedMovementContributions = contributions.filter((contribution) => (
          !insertionOriginMatchesSource(contribution?.source, normalizedSource)
        ));
        const removedCommands = new Set(removedContributions.flatMap((contribution) => (
          contribution.preHistoryCommands || []
        )));
        if (removedCommands.size && Array.isArray(node.preHistoryCommands)) {
          node.preHistoryCommands = node.preHistoryCommands.filter((command) => !removedCommands.has(command));
        }
        const remainingMovementPoints = normalizeMovementPoints(node) - removedMovementPoints;
        if (remainingMovementPoints <= 0) {
          chain.effects.splice(index, 1);
          if (index < chain.currentIndex) {
            chain.currentIndex = Math.max(0, chain.currentIndex - 1);
          }
          removed += removedContributions.length;
          continue;
        }
        node.options = { ...(node.options || {}), movementPoints: remainingMovementPoints };
        node.badge = String(remainingMovementPoints);
        removed += removedContributions.length;
        continue;
      }
      chain.effects.splice(index, 1);
      if (index < chain.currentIndex) {
        chain.currentIndex = Math.max(0, chain.currentIndex - 1);
      }
      removed += 1;
    }
    return removed;
  }

  function activateNext(chain) {
    if (!chain) return null;
    const nextIndex = chain.effects.findIndex((node) => node.status === "pending");
    if (nextIndex < 0) {
      chain.completed = true;
      return null;
    }
    chain.currentIndex = nextIndex;
    chain.effects[nextIndex].status = "active";
    return chain.effects[nextIndex];
  }

  function activateNextIfIdle(chain) {
    if (!chain || chain.completed) return null;
    const current = getCurrentChainNode(chain);
    if (current?.status === "active") return null;
    return activateNext(chain);
  }

  function resolveCurrentChainNode(chain, result = {}) {
    const node = getCurrentChainNode(chain);
    if (!node || node.status !== "active") {
      return { ok: false, message: "当前没有可结算的能力" };
    }
    node.result = result;
    node.undoable = result.undoable ?? node.undoable;
    node.status = "completed";
    return { ok: true, node, next: activateNext(chain), completed: Boolean(chain.completed) };
  }

  function skipCurrentChainNode(chain) {
    const node = getCurrentChainNode(chain);
    if (!node || node.status !== "active") {
      return { ok: false, message: "当前没有可跳过的能力" };
    }
    node.status = "skipped";
    return { ok: true, node, next: activateNext(chain), completed: Boolean(chain.completed) };
  }

  function undoLastChainStep(chain) {
    if (!chain) return { ok: false, message: "没有能力链" };
    for (let index = chain.effects.length - 1; index >= 0; index -= 1) {
      const node = chain.effects[index];
      if (node.status !== "completed" || node.undoable === false) continue;
      node.status = "active";
      node.result = null;
      chain.currentIndex = index;
      chain.completed = false;
      for (let reset = index + 1; reset < chain.effects.length; reset += 1) {
        if (chain.effects[reset].status !== "pending") {
          chain.effects[reset].status = "pending";
          chain.effects[reset].result = null;
        }
      }
      return { ok: true, node };
    }
    return { ok: false, message: "没有可撤销的能力节点" };
  }

  function finishAbilityChain(chain) {
    if (!chain) return { ok: false, message: "没有能力链" };
    chain.completed = true;
    return { ok: true, chain };
  }

  return Object.freeze({
    startAbilityChain,
    createInsertionSource,
    markInsertedNode,
    mergePendingMovementNode,
    removeInsertedNodesBySource,
    activateNext,
    activateNextIfIdle,
    getCurrentChainNode,
    resolveCurrentChainNode,
    skipCurrentChainNode,
    undoLastChainStep,
    finishAbilityChain,
  });
});
