(function (root, factory) {
  "use strict";

  let evaluator = root.SetiAIEvaluator;
  let initialCards = root.SetiInitialCards;

  if ((!evaluator || !initialCards) && typeof require === "function") {
    evaluator = evaluator || require("./evaluator");
    initialCards = initialCards || require("../initial-cards");
  }

  const api = factory(evaluator, initialCards);

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.SetiAIPolicy = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function (evaluator, initialCards) {
  "use strict";

  function byScoreDescending(left, right) {
    return Number(right.score || 0) - Number(left.score || 0);
  }

  function chooseBest(items, scoreFn) {
    return (items || [])
      .map((item) => ({ item, score: scoreFn(item) }))
      .sort(byScoreDescending)[0]?.item || null;
  }

  function chooseInitialSelection(offer, options = {}) {
    const industry = chooseBest(offer?.industryOptions || [], (card) => (
      evaluator.evaluateIndustryCard(card, options)
    ));
    const initialCardsByValue = (offer?.initialOptions || [])
      .map((card) => ({
        card,
        score: evaluator.evaluateInitialCard(initialCards?.getInitialCardNumber?.(card) || card, options),
      }))
      .sort(byScoreDescending)
      .map((entry) => entry.card);

    return {
      industry,
      initialCards: initialCardsByValue.slice(0, 2),
    };
  }

  function chooseTurnAction(candidates = []) {
    const available = candidates.filter((candidate) => candidate?.available !== false);
    const launch = available.find((candidate) => candidate.id === "launch");
    if (launch) return launch;
    const endTurn = available.find((candidate) => candidate.id === "end-turn");
    if (endTurn) return endTurn;
    return available.find((candidate) => candidate.id === "pass")
      || available[0]
      || null;
  }

  function chooseDiscardIndexes(hand = [], count = 1) {
    const target = Math.max(0, Math.round(Number(count) || 0));
    return hand
      .map((card, index) => ({ index, card }))
      .sort((left, right) => {
        const leftLabel = String(left.card?.label || left.card?.cardId || "");
        const rightLabel = String(right.card?.label || right.card?.cardId || "");
        return leftLabel.localeCompare(rightLabel, "zh-Hans-CN");
      })
      .slice(0, target)
      .map((entry) => entry.index);
  }

  function choosePassReserveCard(pile = []) {
    return pile[0] || null;
  }

  return Object.freeze({
    chooseInitialSelection,
    chooseTurnAction,
    chooseDiscardIndexes,
    choosePassReserveCard,
  });
});
