(function (root, factory) {
  "use strict";

  let state = root.SetiAlienState;
  let cards = root.SetiCards;

  if (typeof require === "function") {
    state = state || require("./state");
    cards = cards || require("../cards/deck");
  }

  const api = factory(state, cards);

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.SetiAlienRevealCardGrants = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function (state, cards) {
  "use strict";

  function addCardToHand(player, card) {
    if (!player || !card) return false;
    if (cards?.addCardToHand) {
      cards.addCardToHand(player, card);
      return true;
    }
    if (!Array.isArray(player.hand)) player.hand = [];
    player.hand.push(card);
    if (!player.resources) player.resources = {};
    player.resources.handSize = player.hand.length;
    return true;
  }

  function formatPlayerLabel(player) {
    return player?.colorLabel || player?.name || player?.color || player?.id || "未知玩家";
  }

  function drawAlienCard(alienState, alienModule, random) {
    if (!alienModule?.blindDrawCard) {
      return { ok: false, message: "该外星人没有可发放的牌堆" };
    }
    return alienModule.blindDrawCard(alienState, random);
  }

  function formatGrantMessage(label, grants) {
    const parts = grants
      .filter((grant) => grant.expected > 0)
      .map((grant) => {
        const countText = grant.drawn === grant.expected
          ? `+${grant.drawn}`
          : `+${grant.drawn}/${grant.expected}`;
        return `${formatPlayerLabel(grant.player)}${countText}`;
      });
    return parts.length
      ? `${label || "外星人"}揭示发牌：${parts.join("，")}`
      : `${label || "外星人"}揭示发牌：无首痕迹`;
  }

  function grantAlienCardsForFirstTraces(alienState, alienSlotId, players, alienModule, options = {}) {
    const grants = [];
    let totalExpected = 0;
    let totalDrawn = 0;
    const random = options.random || Math.random;
    const entries = state.countFirstTracesByPlayerOnSlot(alienState, alienSlotId, players || []);

    for (const entry of entries) {
      const grant = {
        player: entry.player,
        playerId: entry.playerId,
        playerColor: entry.playerColor,
        expected: entry.count,
        drawn: 0,
        cards: [],
        failures: [],
      };
      totalExpected += entry.count;

      for (let index = 0; index < entry.count; index += 1) {
        const drawResult = drawAlienCard(alienState, alienModule, random);
        if (drawResult.ok && drawResult.card && addCardToHand(entry.player, drawResult.card)) {
          grant.drawn += 1;
          grant.cards.push(drawResult.card);
          totalDrawn += 1;
        } else {
          grant.failures.push(drawResult.message || "发牌失败");
        }
      }

      grants.push(grant);
    }

    return {
      ok: grants.every((grant) => grant.failures.length === 0),
      totalExpected,
      totalDrawn,
      grants,
      message: formatGrantMessage(options.label, grants),
    };
  }

  return Object.freeze({
    grantAlienCardsForFirstTraces,
  });
});
