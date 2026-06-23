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
    land: 7,
    orbit: 6,
    researchTech: 5,
    playCard: 5,
    launch: 4,
    scan: 1.5,
    analyze: 1,
    placeData: 2,
    move: 0,
    "end-turn": 0,
    pass: -12,
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

  function getFiniteScore(value) {
    const score = Number(value);
    return Number.isFinite(score) ? score : null;
  }

  function getBestScore(items = [], scoreFn = () => 0) {
    return (items || []).reduce((best, item) => {
      const score = getFiniteScore(scoreFn(item));
      return score == null ? best : Math.max(best, score);
    }, -Infinity);
  }

  function scoreTurnAction(candidate) {
    if (!candidate) return -Infinity;
    const base = TURN_ACTION_SCORES[candidate.id] ?? 0;
    const explicitScore = getFiniteScore(candidate.score);
    let valueScore = explicitScore ?? 0;

    if (candidate.id === "researchTech") {
      const bestTechScore = getBestScore(candidate.takeable || [], scoreResearchTechCandidate);
      if (Number.isFinite(bestTechScore)) {
        valueScore = Math.max(valueScore, bestTechScore);
      }
    }

    if (candidate.id === "playCard") {
      const bestCardScore = getBestScore(candidate.playableCards || [], scorePlayCardCandidate);
      if (Number.isFinite(bestCardScore)) {
        valueScore = Math.max(valueScore, bestCardScore);
      }
    }

    return base + valueScore;
  }

  function scoreResearchTechCandidate(candidate) {
    const explicitScore = getFiniteScore(candidate?.score);
    if (explicitScore != null) return explicitScore;
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
    const explicitScore = getFiniteScore(candidate?.score);
    const price = Math.max(0, Math.round(Number(candidate?.price) || 0));
    const priceTieBreaker = Math.max(0, 5 - price) * 0.2;
    return (explicitScore ?? 0) + priceTieBreaker;
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
    return chooseBest(candidates.filter((candidate) => candidate?.available !== false), scoreResearchTechCandidate);
  }

  function choosePlayCard(candidates = []) {
    return chooseBest(candidates.filter((candidate) => candidate?.available !== false), scorePlayCardCandidate);
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

  function scoreAlienUseOption(option) {
    if (!option || option.disabled) return -Infinity;
    const choice = String(option.choice ?? "");
    const explicitScore = getFiniteScore(option.score);
    if (explicitScore != null) return explicitScore;

    if (choice === "cancel") return -100;
    if (choice === "skip") return -30;
    if (choice === "displayed") return 50;
    if (choice === "confirm") return 45;
    if (choice === "blind") return 35;
    if (/^\d+$/.test(choice)) return 30 - Number(choice) * 0.01;
    if (choice.includes(":")) return 28;
    return choice ? 25 : -Infinity;
  }

  function chooseAlienUseOption(options = []) {
    return (options || [])
      .map((option, index) => ({ option, index, score: scoreAlienUseOption(option) }))
      .filter((entry) => Number.isFinite(entry.score))
      .sort((left, right) => right.score - left.score || left.index - right.index)[0]?.option || null;
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
    chooseAlienUseOption,
  });
});
