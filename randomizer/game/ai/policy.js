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
    const scored = (items || [])
      .map((item) => ({ item, score: scoreFn(item) }))
      .sort(byScoreDescending);
    return scored.length ? scored[0].item : null;
  }

  const TURN_ACTION_SCORES = Object.freeze({
    launch: 100,
    orbit: 90,
    land: 88,
    researchTech: 82,
    playCard: 80,
    move: 76,
    scan: 62,
    analyze: 58,
    pass: 1,
    "end-turn": 0,
  });

  const TECH_TYPE_SCORES = Object.freeze({
    orange: 8,
    purple: 7,
    blue: 6,
  });

  const TECH_BONUS_SCORES = Object.freeze({
    bonus_3f: 3,
    bonus_1c: 3,
    bonus_1p: 2,
    bonus_1m: 2,
  });

  function getTechType(tileId) {
    const match = String(tileId || "").match(/^(orange|purple|blue)(\d)$/);
    return match ? match[1] : null;
  }

  function getTechStackIndex(tileId) {
    const match = String(tileId || "").match(/^(orange|purple|blue)(\d)$/);
    return match ? Number(match[2]) : 0;
  }

  function getCandidateTileId(candidate) {
    return typeof candidate === "string" ? candidate : candidate?.tileId;
  }

  function scoreTurnAction(candidate) {
    if (!candidate) return -Infinity;
    const base = TURN_ACTION_SCORES[candidate.id] ?? 0;
    const techBonus = candidate.id === "researchTech"
      ? Math.min(6, (candidate.takeable || []).length)
      : 0;
    return base + techBonus + Number(candidate.score || 0);
  }

  function scoreResearchTechCandidate(candidate) {
    const tileId = getCandidateTileId(candidate);
    const techType = candidate?.techType || getTechType(tileId);
    const stackIndex = candidate?.stackIndex ?? getTechStackIndex(tileId);
    const bonusId = candidate?.bonusId || null;
    const firstTakeBonus = candidate?.firstTake ? 2 : 0;
    return (TECH_TYPE_SCORES[techType] || 0)
      + (TECH_BONUS_SCORES[bonusId] || 0)
      + firstTakeBonus
      + Math.max(0, 5 - stackIndex) * 0.1;
  }

  function scorePlayCardCandidate(candidate) {
    const price = Math.max(0, Math.round(Number(candidate?.price) || 0));
    return Number(candidate?.score || 0)
      + Math.max(0, 5 - price) * 0.2;
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
    return chooseBest(available, scoreTurnAction);
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

  function chooseResearchTechTile(candidates = []) {
    return chooseBest(candidates, scoreResearchTechCandidate);
  }

  function choosePlayCard(candidates = []) {
    return chooseBest(candidates, scorePlayCardCandidate);
  }

  function chooseBlueTechSlot(availableSlots = []) {
    const sorted = [...availableSlots]
      .map((slot) => Number(slot))
      .filter((slot) => Number.isInteger(slot))
      .sort((left, right) => left - right);
    return sorted.length ? sorted[0] : null;
  }

  function chooseMovePaymentIndexes(hand = [], request = {}) {
    const requiredMovePoints = Math.max(0, Math.round(Number(request.requiredMovePoints) || 0));
    const availableEnergy = Math.max(0, Math.round(Number(request.availableEnergy) || 0));
    const neededCards = Math.max(0, requiredMovePoints - availableEnergy);
    return (request.moveCardIndexes || [])
      .filter((index) => Number.isInteger(Number(index)) && hand[Number(index)])
      .map((index) => Number(index))
      .sort((left, right) => left - right)
      .slice(0, neededCards);
  }

  return Object.freeze({
    chooseInitialSelection,
    chooseTurnAction,
    chooseDiscardIndexes,
    choosePassReserveCard,
    chooseResearchTechTile,
    choosePlayCard,
    chooseBlueTechSlot,
    chooseMovePaymentIndexes,
  });
});
