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
    scan: 2.5,
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
    bonus_3f: 2,
    bonus_1c: 5,
    bonus_1p: 4,
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

  function getActionGraphNet(candidate) {
    const graphNet = getFiniteScore(candidate?.actionGraph?.net);
    if (graphNet != null) return graphNet;
    return getFiniteScore(candidate?.net);
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

  function scoreTurnActionPrimary(candidate) {
    const graphNet = getActionGraphNet(candidate);
    return graphNet == null ? scoreTurnAction(candidate) : graphNet;
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

  function getEffectResourcesValue(effect = {}, options = {}) {
    return evaluator.getResourceValue(effect.resources || {}, options.resourceValues)
      + Number(effect.blindDraw || 0) * evaluator.RESOURCE_VALUES.handSize
      + Number(effect.dataGain || 0) * evaluator.RESOURCE_VALUES.availableData
      + evaluator.getIncomeValue(effect.income || {}, options)
      + evaluator.getIncomeValue(effect.baseIncome || {}, options);
  }

  function addOpeningGoal(goals, id, amount = 1) {
    if (!id) return;
    goals[id] = (goals[id] || 0) + Math.max(0, Number(amount) || 0);
  }

  function getOpeningEffects(industry, initialPair = []) {
    const effects = [];
    const industryEffect = initialCards?.getIndustryEffect?.(industry);
    if (industryEffect) effects.push({ source: "industry", effect: industryEffect });
    for (const card of initialPair) {
      const effect = initialCards?.getInitialCardEffect?.(initialCards.getInitialCardNumber?.(card) || card);
      if (effect) effects.push({ source: "initial", effect });
    }
    return effects;
  }

  function scoreOpeningCombination(industry, initialPair = [], options = {}) {
    const effects = getOpeningEffects(industry, initialPair);
    const goals = {};
    let score = evaluator.evaluateIndustryCard(industry, options);
    for (const card of initialPair) {
      score += evaluator.evaluateInitialCard(initialCards?.getInitialCardNumber?.(card) || card, options);
    }

    const combined = effects.reduce((summary, entry) => {
      const effect = entry.effect || {};
      summary.resourceScore += Number(effect.resources?.score || 0);
      summary.credits += Number(effect.resources?.credits || 0) + Number(effect.baseIncome?.credits || 0) + Number(effect.income?.credits || 0);
      summary.energy += Number(effect.resources?.energy || 0) + Number(effect.baseIncome?.energy || 0) + Number(effect.income?.energy || 0);
      summary.hand += Number(effect.blindDraw || 0) + Number(effect.baseIncome?.handSize || 0) + Number(effect.income?.handSize || 0);
      summary.data += Number(effect.dataGain || 0) + Number(effect.baseIncome?.availableData || 0) + Number(effect.income?.availableData || 0);
      summary.scan += Number(effect.scan?.count || 0) + Number(effect.resources?.additionalPublicScan || 0);
      summary.incomeIncreases += Number(effect.incomeIncreaseCount || 0);
      if (effect.alienTrace) summary.traces += 1;
      if (effect.orbitPlanetId) summary.orbits += 1;
      summary.rawValue += getEffectResourcesValue(effect, options);
      return summary;
    }, {
      resourceScore: 0,
      credits: 0,
      energy: 0,
      hand: 0,
      data: 0,
      scan: 0,
      incomeIncreases: 0,
      traces: 0,
      orbits: 0,
      rawValue: 0,
    });

    score += Math.min(8, combined.resourceScore * 0.55);
    score += combined.credits >= 3 ? 3 : combined.credits >= 2 ? 1.5 : 0;
    score += combined.incomeIncreases >= 3 ? 7 : combined.incomeIncreases === 2 ? 4.5 : combined.incomeIncreases;
    score += combined.scan >= 2 ? 6 : combined.scan * 1.8;
    score += combined.data >= 2 ? 5 : combined.data * 1.7;
    score += combined.traces * 7;
    score += combined.orbits * 2.5;

    if (combined.resourceScore >= 8 || combined.traces || combined.scan >= 2) {
      addOpeningGoal(goals, "FIRST_ROUND_SCORE_25", 1);
    }
    if (combined.scan >= 2) addOpeningGoal(goals, "GRAB_TRACE_PINK", combined.scan);
    if (combined.data >= 1 || combined.scan >= 2) addOpeningGoal(goals, "GRAB_TRACE_BLUE", combined.data + combined.scan * 0.35);
    if (combined.traces || combined.orbits) addOpeningGoal(goals, "GRAB_TRACE_YELLOW", combined.traces + combined.orbits * 0.35);
    if (combined.incomeIncreases >= 2 || combined.credits >= 3) addOpeningGoal(goals, "OPENING_INCOME", combined.incomeIncreases + combined.credits * 0.25);

    return {
      score,
      goals,
      summary: combined,
      industry,
      initialCards: initialPair,
    };
  }

  function getInitialPairs(cards = [], count = 2) {
    if (count <= 1) return (cards || []).map((card) => [card]);
    const pairs = [];
    for (let left = 0; left < cards.length; left += 1) {
      for (let right = left + 1; right < cards.length; right += 1) {
        pairs.push([cards[left], cards[right]]);
      }
    }
    return pairs;
  }

  function chooseInitialSelection(offer, options = {}) {
    const industryOptions = offer?.industryOptions || [];
    const initialOptions = offer?.initialOptions || [];
    const initialCount = Math.max(1, Math.round(Number(options.initialCount) || 2));
    const plans = [];
    for (const industry of industryOptions) {
      for (const initialPair of getInitialPairs(initialOptions, initialCount)) {
        plans.push(scoreOpeningCombination(industry, initialPair, options));
      }
    }
    const bestPlan = plans.sort((left, right) => (
      Number(right.score || 0) - Number(left.score || 0)
      || String(left.industry?.id || "").localeCompare(String(right.industry?.id || ""))
    ))[0];
    const topPlans = plans.slice(0, 5).map((plan) => ({
      score: Math.round(Number(plan.score || 0) * 100) / 100,
      industryLabel: plan.industry?.label || plan.industry?.id || null,
      initialNumbers: (plan.initialCards || [])
        .map((card) => initialCards?.getInitialCardNumber?.(card) || null)
        .filter((number) => number != null),
      summary: plan.summary,
      goals: plan.goals,
    }));

    if (bestPlan) {
      return {
        industry: bestPlan.industry,
        initialCards: bestPlan.initialCards.slice(0, initialCount),
        openingPlan: {
          score: Math.round(bestPlan.score * 100) / 100,
          goals: bestPlan.goals,
          summary: bestPlan.summary,
          topPlans,
        },
      };
    }

    const industry = chooseBest(industryOptions, (card) => evaluator.evaluateIndustryCard(card, options));
    return {
      industry,
      initialCards: initialOptions.slice(0, initialCount),
      openingPlan: null,
    };
  }

  function chooseTurnAction(candidates = []) {
    const available = candidates.filter((candidate) => candidate?.available !== false);
    return available
      .map((candidate, index) => ({
        candidate,
        index,
        primaryScore: scoreTurnActionPrimary(candidate),
        fallbackScore: scoreTurnAction(candidate),
      }))
      .sort((left, right) => (
        Number(right.primaryScore || 0) - Number(left.primaryScore || 0)
        || Number(right.fallbackScore || 0) - Number(left.fallbackScore || 0)
        || left.index - right.index
      ))[0]?.candidate || null;
  }

  const INCOME_DISCARD_TYPES = new Set([
    "income",
    "initial_income",
    "planet_reward_income",
    "place_data_income",
    "industry_helios_income",
    "discard_any_income",
  ]);

  const INCOME_GAIN_SCORE = Object.freeze({
    energy: 12,
    credits: 11,
    handSize: 10,
    publicity: 3,
    availableData: 3,
    additionalPublicScan: 2,
  });

  function scoreIncomeGain(gain = null) {
    if (!gain || typeof gain !== "object") return -Infinity;
    return Object.entries(gain).reduce((total, [key, value]) => {
      const amount = Math.max(0, Number(value) || 0);
      return total + amount * (INCOME_GAIN_SCORE[key] || 1);
    }, 0);
  }

  function getCardSortLabel(card) {
    return String(card?.label || card?.cardName || card?.cardId || card?.id || "");
  }

  function getIncomeGainByIndex(request, index) {
    const gains = request?.incomeGainByIndex;
    if (!gains) return null;
    if (Array.isArray(gains)) return gains[index] || null;
    return gains[index] || gains[String(index)] || null;
  }

  function isIncomeDiscardRequest(request = {}) {
    const type = String(request?.pendingType || request?.type || request?.discardType || "");
    return INCOME_DISCARD_TYPES.has(type);
  }

  function chooseDiscardIndexes(hand = [], count = 1, request = {}) {
    const target = Math.max(0, Math.round(Number(count) || 0));
    const incomeRequest = isIncomeDiscardRequest(request);
    return hand
      .map((card, index) => ({ index, card }))
      .sort((left, right) => {
        if (incomeRequest) {
          const rightIncomeScore = scoreIncomeGain(getIncomeGainByIndex(request, right.index));
          const leftIncomeScore = scoreIncomeGain(getIncomeGainByIndex(request, left.index));
          if (rightIncomeScore !== leftIncomeScore) return rightIncomeScore - leftIncomeScore;
        }
        const leftLabel = getCardSortLabel(left.card);
        const rightLabel = getCardSortLabel(right.card);
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
    const roundNumber = Math.max(1, Math.round(Number(request.roundNumber) || 1));
    const preserveEnergy = request.preserveEnergy != null
      ? Boolean(request.preserveEnergy)
      : roundNumber <= 2 || availableEnergy <= 2;
    const neededCards = preserveEnergy
      ? requiredMovePoints
      : Math.max(0, requiredMovePoints - availableEnergy);
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
    const label = String(option.label || "");
    const scoreMatch = label.match(/(\d+)\s*分/);
    const threatMatch = label.match(/威胁\s*(\d+)/);

    if (choice === "cancel") return -100;
    if (choice === "skip") return -30;
    if (choice === "displayed") return 50;
    if (choice === "confirm") return 45;
    if (choice === "blind") return 35;
    if (scoreMatch && threatMatch) {
      return 40 + Number(scoreMatch[1]) * 2 + Number(threatMatch[1]) * 0.25;
    }
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
