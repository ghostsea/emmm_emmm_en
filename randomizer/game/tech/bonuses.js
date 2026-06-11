(function (root, factory) {
  "use strict";

  let catalog = root.SetiTechCatalog;
  let players = root.SetiPlayers;

  if ((!catalog || !players) && typeof require === "function") {
    catalog = catalog || require("./catalog");
    players = players || require("../players");
  }

  const api = factory(catalog, players);

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.SetiTechBonuses = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function (catalog, players) {
  "use strict";

  function drawBonusCard(player, helpers) {
    if (typeof helpers.drawBasicCardToPlayer === "function") {
      return helpers.drawBasicCardToPlayer(player);
    }
    if (typeof helpers.drawCard === "function") {
      return helpers.drawCard(player);
    }
    return { ok: false, message: "无法从牌库发牌", card: null };
  }

  function applyBonusReward(player, bonusId, helpers = {}) {
    const effect = catalog.BONUS_EFFECTS[bonusId];
    if (!effect) {
      return { ok: false, message: `未知奖励 ${bonusId}`, rewards: {} };
    }

    const rewards = {};
    const resourceGain = {};

    if (effect.score) resourceGain.score = effect.score;
    if (effect.energy) resourceGain.energy = effect.energy;
    if (effect.publicity) resourceGain.publicity = effect.publicity;

    if (Object.keys(resourceGain).length) {
      players.gainResources(player, resourceGain);
      Object.assign(rewards, resourceGain);
    }

    if (effect.drawCard) {
      const drawCount = Math.max(0, Math.round(effect.drawCard));
      for (let index = 0; index < drawCount; index += 1) {
        const drawResult = drawBonusCard(player, helpers);
        if (!drawResult?.ok) {
          return {
            ok: false,
            message: drawResult?.message || "奖励发牌失败",
            rewards,
          };
        }
        rewards.drawnCards = rewards.drawnCards || [];
        rewards.drawnCards.push(drawResult.card);
        player.resources.handSize = player.hand.length;
      }
    }

    return {
      ok: true,
      message: catalog.BONUS_LABELS[bonusId] || bonusId,
      rewards,
    };
  }

  function applyFirstTakeTypeReward(player) {
    players.gainResources(player, { score: catalog.FIRST_TAKE_TYPE_SCORE });
    return {
      ok: true,
      score: catalog.FIRST_TAKE_TYPE_SCORE,
    };
  }

  function formatRewardSummary(bonusId, firstTake) {
    const parts = [catalog.BONUS_LABELS[bonusId] || bonusId];
    if (firstTake) parts.push(`首拿 +${catalog.FIRST_TAKE_TYPE_SCORE} 分`);
    return parts.join("，");
  }

  return Object.freeze({
    applyBonusReward,
    applyFirstTakeTypeReward,
    formatRewardSummary,
  });
});
