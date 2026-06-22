(function (root, factory) {
  "use strict";

  let initialCards = root.SetiInitialCards;
  let endGameScoring = root.SetiEndGameScoring;

  if ((!initialCards || !endGameScoring) && typeof require === "function") {
    initialCards = initialCards || require("../initial-cards");
    endGameScoring = endGameScoring || require("../end-game-scoring");
  }

  const api = factory(initialCards, endGameScoring);

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.SetiAIEvaluator = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function (initialCards, endGameScoring) {
  "use strict";

  const FINAL_ROUND_NUMBER = 4;
  const RESOURCE_VALUES = Object.freeze({
    score: 1,
    credits: 3,
    energy: 3,
    handSize: 3,
    availableData: 1.5,
    publicity: 1,
    additionalPublicScan: 1.5,
  });

  function numeric(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
  }

  function getResourceValue(resources = {}, values = RESOURCE_VALUES) {
    return Object.entries(resources || {}).reduce((total, [key, value]) => (
      total + numeric(value) * numeric(values[key])
    ), 0);
  }

  function getRemainingIncomeMultiplier(roundNumber = 1) {
    const round = Math.max(1, Math.round(numeric(roundNumber) || 1));
    return Math.max(1, FINAL_ROUND_NUMBER - round + 1);
  }

  function getIncomeValue(income = {}, options = {}) {
    return getResourceValue(income, options.resourceValues) * getRemainingIncomeMultiplier(options.roundNumber);
  }

  function evaluateIndustryCard(cardOrLabel, options = {}) {
    const effect = initialCards?.getIndustryEffect?.(cardOrLabel);
    if (!effect) return 0;
    const incomeValue = getIncomeValue(effect.baseIncome, options);
    const resourceValue = getResourceValue(effect.resources, options.resourceValues);
    const drawValue = numeric(effect.blindDraw) * RESOURCE_VALUES.handSize;
    const dataValue = numeric(effect.dataGain) * RESOURCE_VALUES.availableData;
    const launchValue = numeric(effect.launchCount) * 2;
    const incomeIncreaseValue = numeric(effect.incomeIncreaseCount) * 2;
    return resourceValue + incomeValue + drawValue + dataValue + launchValue + incomeIncreaseValue;
  }

  function evaluateInitialCard(cardOrNumber, options = {}) {
    const effect = initialCards?.getInitialCardEffect?.(cardOrNumber);
    if (!effect) return 0;
    const resourceValue = getResourceValue(effect.resources, options.resourceValues);
    const incomeValue = getIncomeValue(effect.income, options);
    const drawValue = numeric(effect.blindDraw) * RESOURCE_VALUES.handSize;
    const dataValue = numeric(effect.dataGain) * RESOURCE_VALUES.availableData;
    const scanValue = numeric(effect.scan?.count) * 3;
    const orbitValue = effect.orbitPlanetId ? 3 : 0;
    const alienTraceValue = effect.alienTrace ? 6 : 0;
    return resourceValue + incomeValue + drawValue + dataValue + scanValue + orbitValue + alienTraceValue;
  }

  function evaluatePlayerState(state = {}, playerId) {
    const player = (state.playerState?.players || state.players || [])
      .find((item) => item?.id === playerId) || state.currentPlayer || null;
    if (!player) return 0;

    let finalScore = 0;
    if (endGameScoring?.computePlayerFinalScore) {
      const scoreResult = endGameScoring.computePlayerFinalScore(state, player);
      finalScore = numeric(scoreResult?.totalScore ?? scoreResult?.total);
    } else {
      finalScore = numeric(player.resources?.score);
    }

    const roundNumber = state.turnState?.roundNumber || state.roundNumber || 1;
    return finalScore
      + getResourceValue(player.resources)
      + getIncomeValue(player.income, { roundNumber })
      + numeric(player.hand?.length) * RESOURCE_VALUES.handSize
      + numeric(player.reservedCards?.length) * 2;
  }

  return Object.freeze({
    RESOURCE_VALUES,
    getResourceValue,
    getRemainingIncomeMultiplier,
    getIncomeValue,
    evaluateIndustryCard,
    evaluateInitialCard,
    evaluatePlayerState,
  });
});
