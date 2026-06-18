(function (root, factory) {
  "use strict";

  const api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.SetiCardTaskState = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function () {
  "use strict";

  function createTaskState() {
    return {
      playerId: null,
      readyType2Tasks: [],
      readyType2ByCardId: Object.create(null),
      type1ReservedCards: [],
    };
  }

  function getCardId(card) {
    return card?.cardId || card?.image || card?.id || null;
  }

  function listType1ReservedCards(player, cardEffects) {
    const cards = [];
    for (const card of player?.reservedCards || []) {
      const model = cardEffects.getCardModel(card);
      if (!model?.triggers?.length) continue;
      cardEffects.ensureCardEffectState(card);
      cards.push({
        card,
        cardId: getCardId(card),
        cardType: cardEffects.getRuntimeCardTypeCode(card, model.cardType),
        triggers: model.triggers,
        consumedTriggerIds: [...(card.cardEffectState?.consumedTriggerIds || [])],
      });
    }
    return cards;
  }

  function listType2ReservedTasks(player, cardEffects) {
    const tasks = [];
    for (const card of player?.reservedCards || []) {
      const model = cardEffects.getCardModel(card);
      if (!model?.tasks?.length) continue;
      cardEffects.ensureCardEffectState(card);
      tasks.push({
        card,
        cardId: getCardId(card),
        cardType: cardEffects.getRuntimeCardTypeCode(card, model.cardType),
        tasks: model.tasks,
        completedTaskIds: [...(card.cardEffectState?.completedTaskIds || [])],
      });
    }
    return tasks;
  }

  function refreshTaskState(state, player, context, cardEffects) {
    const next = state || createTaskState();
    if (!player || !cardEffects) {
      next.playerId = null;
      next.readyType2Tasks = [];
      next.readyType2ByCardId = Object.create(null);
      next.type1ReservedCards = [];
      return next;
    }

    const readyType2Tasks = cardEffects.collectReadyTasks(player, context);
    next.playerId = player.id || null;
    next.readyType2Tasks = readyType2Tasks;
    next.readyType2ByCardId = Object.create(null);
    for (const ready of readyType2Tasks) {
      if (ready?.card?.id) next.readyType2ByCardId[ready.card.id] = ready;
    }
    next.type1ReservedCards = listType1ReservedCards(player, cardEffects);
    next.type2ReservedTasks = listType2ReservedTasks(player, cardEffects);
    return next;
  }

  function getReadyType2Tasks(state) {
    return state?.readyType2Tasks || [];
  }

  function getReadyType2ForCard(state, cardId) {
    if (!cardId) return null;
    return state?.readyType2ByCardId?.[cardId] || null;
  }

  function collectType1TriggerMatches(player, events, cardEffects) {
    const matches = [];
    for (const event of events || []) {
      matches.push(...cardEffects.collectMatchingTriggers(player, event));
    }
    return matches;
  }

  return Object.freeze({
    createTaskState,
    refreshTaskState,
    getReadyType2Tasks,
    getReadyType2ForCard,
    collectType1TriggerMatches,
    listType1ReservedCards,
    listType2ReservedTasks,
  });
});
