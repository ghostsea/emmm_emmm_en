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

  function executeTrade(tradeId, context) {
    const check = canExecuteTrade(tradeId, context);
    if (!check.ok) {
      return { ok: false, tradeId, message: check.message };
    }

    const spendResult = players.spendResources(check.currentPlayer, check.trade.cost);
    if (!spendResult.ok) {
      return { ok: false, tradeId, message: spendResult.message };
    }

    players.gainResources(check.currentPlayer, check.trade.gain);
    const message = `快速交易：${check.trade.label}`;
    return {
      ok: true,
      tradeId,
      message,
      trade: check.trade,
    };
  }

  return Object.freeze({
    TRADE_ACTIONS,
    getTradeAction,
    canExecuteTrade,
    executeTrade,
  });
});
