(function (root, factory) {
  "use strict";

  const api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.SetiAbilityChain = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function () {
  "use strict";

  function normalizeNode(node, index) {
    return {
      id: node.id || `ability-chain-node-${index}`,
      abilityId: node.abilityId || null,
      type: node.type || node.abilityId || null,
      icon: node.icon || null,
      label: node.label || node.abilityId || `能力 ${index + 1}`,
      status: node.status || "pending",
      undoable: node.undoable ?? true,
      playerId: node.playerId || node.options?.playerId || null,
      playerColor: node.playerColor || node.options?.playerColor || null,
      options: { ...(node.options || {}) },
      needsUserChoice: Boolean(node.needsUserChoice),
      result: node.result || null,
    };
  }

  function startAbilityChain(chainId, label, nodes = []) {
    return {
      chainId,
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
    activateNext,
    getCurrentChainNode,
    resolveCurrentChainNode,
    skipCurrentChainNode,
    undoLastChainStep,
    finishAbilityChain,
  });
});
