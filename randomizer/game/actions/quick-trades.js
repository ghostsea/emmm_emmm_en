(function (root, factory) {
  "use strict";

  let players = root.SetiPlayers;

  if (!players && typeof require === "function") {
    players = require("../players");
  }

  const api = factory(players);

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.SetiQuickTrades = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function (players) {
  "use strict";

  const TRADE_ACTIONS = Object.freeze([
    Object.freeze({
      id: "credits-for-energy",
      label: "2信用点 → 1能量",
      cost: Object.freeze({ credits: 2 }),
      gain: Object.freeze({ energy: 1 }),
    }),
    Object.freeze({
      id: "credits-for-card",
      label: "2信用点 → 1张牌",
      cost: Object.freeze({ credits: 2 }),
      gain: Object.freeze({ handSize: 1 }),
    }),
    Object.freeze({
      id: "cards-for-credit",
      label: "2张牌 → 1信用点",
      cost: Object.freeze({ handSize: 2 }),
      gain: Object.freeze({ credits: 1 }),
    }),
    Object.freeze({
      id: "cards-for-energy",
      label: "2张牌 → 1能量",
      cost: Object.freeze({ handSize: 2 }),
      gain: Object.freeze({ energy: 1 }),
    }),
    Object.freeze({
      id: "energy-for-card",
      label: "2能量 → 1张牌",
      cost: Object.freeze({ energy: 2 }),
      gain: Object.freeze({ handSize: 1 }),
    }),
    Object.freeze({
      id: "energy-for-credit",
      label: "2能量 → 1信用点",
      cost: Object.freeze({ energy: 2 }),
      gain: Object.freeze({ credits: 1 }),
    }),
  ]);

  function getTradeAction(tradeId) {
    return TRADE_ACTIONS.find((trade) => trade.id === tradeId) || null;
  }

  function getHandCost(cost) {
    return Math.max(0, Math.round(cost?.handSize || 0));
  }

  function getResourceCost(cost) {
    const resourceCost = { ...(cost || {}) };
    delete resourceCost.handSize;
    return resourceCost;
  }

  function getResourceGain(gain) {
    const resourceGain = { ...(gain || {}) };
    delete resourceGain.handSize;
    return resourceGain;
  }

  function canExecuteTrade(tradeId, context) {
    const trade = getTradeAction(tradeId);
    if (!trade) return { ok: false, message: `未知快速交易: ${tradeId}` };

    const currentPlayer = players.getCurrentPlayer(context.playerState);
    if (!currentPlayer) return { ok: false, message: "没有当前玩家" };
    if (!players.canAfford(currentPlayer, trade.cost)) {
      return {
        ok: false,
        message: `资源不足，需要 ${players.formatResourceCost(trade.cost)}`,
      };
    }

    return { ok: true, message: null, trade, currentPlayer };
  }

  function applyTradeGains(trade, context, player) {
    const cardDrawCount = Math.max(0, Math.round(trade.gain?.handSize || 0));
    const resourceGain = getResourceGain(trade.gain);

    if (Object.keys(resourceGain).length) {
      players.gainResources(player, resourceGain);
    }

    if (cardDrawCount > 0) {
      if (typeof context.beginCardSelection !== "function") {
        return { ok: false, message: "当前无法精选卡牌" };
      }

      if (cardDrawCount !== 1) {
        return { ok: false, message: "当前仅支持精选 1 张牌" };
      }

      const selectionResult = context.beginCardSelection({
        type: "trade",
        tradeId: trade.id,
        player,
        refundCost: getResourceCost(trade.cost),
        allowBlindDraw: false,
      });
      if (!selectionResult?.ok) {
        return { ok: false, message: selectionResult?.message || "精选失败" };
      }

      return {
        ok: true,
        awaitingCardSelection: true,
        message: selectionResult.message,
      };
    }

    return { ok: true, message: null };
  }

  function finalizeTradeAfterDiscard(tradeId, context, player) {
    const trade = getTradeAction(tradeId);
    if (!trade) return { ok: false, tradeId, message: `未知快速交易: ${tradeId}` };

    const resourceCost = getResourceCost(trade.cost);
    if (Object.keys(resourceCost).length) {
      const spendResult = players.spendResources(player, resourceCost);
      if (!spendResult.ok) {
        return { ok: false, tradeId, message: spendResult.message };
      }
    }

    const gainResult = applyTradeGains(trade, context, player);
    if (!gainResult.ok) {
      return { ok: false, tradeId, message: gainResult.message };
    }

    return {
      ok: true,
      tradeId,
      awaitingCardSelection: Boolean(gainResult.awaitingCardSelection),
      message: gainResult.awaitingCardSelection
        ? `快速交易：${trade.label}；${gainResult.message}`
        : `快速交易：${trade.label}`,
      trade,
    };
  }

  function executeTrade(tradeId, context) {
    const check = canExecuteTrade(tradeId, context);
    if (!check.ok) {
      return { ok: false, tradeId, message: check.message };
    }

    const handCost = getHandCost(check.trade.cost);
    if (handCost > 0) {
      if (typeof context.beginDiscardSelection !== "function") {
        return { ok: false, tradeId, message: "当前无法弃牌" };
      }

      const discardResult = context.beginDiscardSelection(handCost, {
        type: "trade",
        tradeId,
        player: check.currentPlayer,
      });
      if (!discardResult?.ok) {
        return { ok: false, tradeId, message: discardResult.message };
      }

      return {
        ok: true,
        tradeId,
        awaitingDiscard: true,
        discardCount: handCost,
        message: discardResult.message,
        trade: check.trade,
      };
    }

    const spendResult = players.spendResources(check.currentPlayer, check.trade.cost);
    if (!spendResult.ok) {
      return { ok: false, tradeId, message: spendResult.message };
    }

    const gainResult = applyTradeGains(check.trade, context, check.currentPlayer);
    if (!gainResult.ok) {
      return { ok: false, tradeId, message: gainResult.message };
    }

    return {
      ok: true,
      tradeId,
      awaitingCardSelection: Boolean(gainResult.awaitingCardSelection),
      message: gainResult.awaitingCardSelection
        ? `快速交易：${check.trade.label}；${gainResult.message}`
        : `快速交易：${check.trade.label}`,
      trade: check.trade,
    };
  }

  return Object.freeze({
    TRADE_ACTIONS,
    getTradeAction,
    canExecuteTrade,
    applyTradeGains,
    finalizeTradeAfterDiscard,
    executeTrade,
  });
});
