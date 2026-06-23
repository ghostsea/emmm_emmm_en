(function (root, factory) {
  "use strict";

  let endGameScoring = root.SetiEndGameScoring;

  if (!endGameScoring && typeof require === "function") {
    endGameScoring = require("../end-game-scoring");
  }

  const api = factory(endGameScoring);

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.SetiAIValuation = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function (endGameScoring) {
  "use strict";

  const FINAL_ROUND_NUMBER = 4;
  const DEFAULT_CARD_VALUE = 3;
  const DEFAULT_ALIEN_CARD_VALUE = 4;
  const RESOURCE_VALUES = Object.freeze({
    score: 1,
    credits: 3,
    energy: 3,
    handSize: 3,
    card: DEFAULT_CARD_VALUE,
    alienCard: DEFAULT_ALIEN_CARD_VALUE,
    availableData: 1.5,
    data: 1.5,
    movement: 1.5,
    additionalPublicScan: 1.5,
    publicity: 1,
    signal: 3,
  });

  function numeric(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
  }

  function roundValue(value) {
    return Math.round(numeric(value) * 1000) / 1000;
  }

  function clamp01(value) {
    return Math.min(1, Math.max(0, numeric(value)));
  }

  function getResourceValue(resources = {}, values = RESOURCE_VALUES) {
    return Object.entries(resources || {}).reduce((total, [key, value]) => (
      total + numeric(value) * numeric(values[key])
    ), 0);
  }

  function getRemainingIncomeMultiplier(roundNumber = 1, options = {}) {
    const finalRound = Math.max(1, Math.round(numeric(options.finalRoundNumber) || FINAL_ROUND_NUMBER));
    const round = Math.max(1, Math.round(numeric(roundNumber) || 1));
    const includeCurrentRound = options.includeCurrentRound !== false;
    const currentRoundIncome = includeCurrentRound ? 1 : 0;
    return Math.max(0, finalRound - round + currentRoundIncome);
  }

  function isAlienCard(card) {
    const cardId = String(card?.cardId || card?.id || card?.set || "");
    return Boolean(card?.alienCard || card?.isAlienCard || cardId.startsWith("alien:"))
      || /^(aomomo|yichangdian|chong|amiba|jiuzhe|banrenma|fangzhou|runezu)_/.test(cardId);
  }

  function getCardValue(card, options = {}) {
    if (!card) return numeric(options.defaultCardValue ?? DEFAULT_CARD_VALUE);
    if (typeof options.cardValueFn === "function") {
      const value = options.cardValueFn(card);
      if (Number.isFinite(Number(value))) return numeric(value);
    }
    if (Number.isFinite(Number(card.aiValue))) return numeric(card.aiValue);
    if (Number.isFinite(Number(card.score))) return numeric(card.score);
    return isAlienCard(card)
      ? numeric(options.alienCardValue ?? DEFAULT_ALIEN_CARD_VALUE)
      : numeric(options.defaultCardValue ?? DEFAULT_CARD_VALUE);
  }

  function getDiscardedCardValue(options = {}) {
    if (Number.isFinite(Number(options.discardedCardValue))) {
      return numeric(options.discardedCardValue);
    }
    if (options.discardedCard) {
      return Math.max(
        numeric(options.minimumDiscardCardValue ?? DEFAULT_CARD_VALUE),
        getCardValue(options.discardedCard, options),
      );
    }
    if (Array.isArray(options.hand) && options.hand.length) {
      const cheapest = options.hand
        .map((card) => getCardValue(card, options))
        .sort((left, right) => left - right)[0];
      return Math.max(numeric(options.minimumDiscardCardValue ?? DEFAULT_CARD_VALUE), cheapest);
    }
    return numeric(options.fallbackDiscardCardValue ?? 0);
  }

  function getIncomeRawValue(income = {}, options = {}) {
    const roundNumber = options.roundNumber ?? 1;
    return getResourceValue(income, options.resourceValues || RESOURCE_VALUES)
      * getRemainingIncomeMultiplier(roundNumber, options);
  }

  function getIncomeNetValue(income = {}, options = {}) {
    const raw = getIncomeRawValue(income, options);
    const discardCost = getDiscardedCardValue(options);
    return raw - discardCost;
  }

  function getIncomeValue(income = {}, options = {}) {
    return getIncomeNetValue(income, options);
  }

  function getPlayerFromState(state = {}, playerId) {
    return (state.playerState?.players || state.players || [])
      .find((player) => player?.id === playerId)
      || state.currentPlayer
      || null;
  }

  function getFinalScoreValue(state = {}, player) {
    if (!player) return 0;
    if (endGameScoring?.computePlayerFinalScore) {
      const result = endGameScoring.computePlayerFinalScore(state, player);
      return numeric(result?.totalScore ?? result?.total);
    }
    return numeric(player.resources?.score);
  }

  function evaluatePlayerState(state = {}, playerId, options = {}) {
    const player = getPlayerFromState(state, playerId);
    if (!player) return 0;
    const roundNumber = state.turnState?.roundNumber || state.roundNumber || options.roundNumber || 1;
    const handValue = (player.hand || []).reduce((total, card) => total + getCardValue(card, options), 0);
    const reservedValue = (player.reservedCards || []).reduce((total, card) => total + getCardValue(card, {
      ...options,
      defaultCardValue: numeric(options.reservedCardValue ?? 2),
    }), 0);
    const goalValue = numeric(options.goalValue);
    return getFinalScoreValue(state, player)
      + getResourceValue(player.resources, options.resourceValues || RESOURCE_VALUES)
      + getIncomeRawValue(player.income, { ...options, roundNumber })
      + handValue
      + reservedValue
      + goalValue;
  }

  function inferFormulaDelta(candidate, formulaId) {
    if (!candidate) return 0;
    const actionId = candidate.id || candidate.actionId;
    const planAction = candidate.plan?.actionId || candidate.plan?.quickActionId || null;
    const effectTypes = candidate.effectTypes || [];
    if (candidate.finalFormulaDeltas?.[formulaId] != null) {
      return numeric(candidate.finalFormulaDeltas[formulaId]);
    }
    if (formulaId === "b2" && ["orbit", "land"].includes(actionId)) return 1;
    if (formulaId === "b2" && planAction && ["orbit", "land", "scan"].includes(planAction)) return 0.5;
    if (formulaId === "c1" && (actionId === "playCard" || planAction === "task")) return 0.5;
    if (formulaId === "c2" && actionId === "playCard") return 0.5;
    if (formulaId === "d1" && actionId === "researchTech") return 0.5;
    if (formulaId === "d2" && actionId === "researchTech") return 0.5;
    if (formulaId === "b1" && (actionId === "alien-trace" || effectTypes.includes("alien_trace"))) return 1;
    if ((formulaId === "a1" || formulaId === "a2") && actionId === "playCard") return 0.25;
    return 0;
  }

  function estimateFinalMarginalForAction(candidate, state = {}, playerId = null, options = {}) {
    if (Number.isFinite(Number(candidate?.finalMarginal))) return numeric(candidate.finalMarginal);
    const markedFormulas = options.markedFormulas
      || candidate?.markedFormulas
      || state.aiMarkedFinalFormulas
      || [];
    return (markedFormulas || []).reduce((total, mark) => {
      const formulaId = typeof mark === "string" ? mark : mark?.formulaId;
      const multiplier = typeof mark === "string" ? 1 : numeric(mark?.multiplier ?? mark?.weight ?? 1);
      return total + inferFormulaDelta(candidate, formulaId) * multiplier;
    }, 0);
  }

  return Object.freeze({
    RESOURCE_VALUES,
    DEFAULT_CARD_VALUE,
    DEFAULT_ALIEN_CARD_VALUE,
    numeric,
    roundValue,
    clamp01,
    getResourceValue,
    getRemainingIncomeMultiplier,
    getCardValue,
    getDiscardedCardValue,
    getIncomeRawValue,
    getIncomeNetValue,
    getIncomeValue,
    evaluatePlayerState,
    estimateFinalMarginalForAction,
  });
});
