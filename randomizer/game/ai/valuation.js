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
  const DEFAULT_ALIEN_CARD_VALUE = 5.5;
  const DEFAULT_LAUNCH_COST = Object.freeze({ credits: 2 });
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

  function clonePositiveCost(cost = {}) {
    return Object.entries(cost || {}).reduce((result, [key, value]) => {
      const amount = numeric(value);
      if (amount > 0) result[key] = amount;
      return result;
    }, {});
  }

  function getLaunchPaymentCost(options = {}) {
    const source = options.options || options;
    if (source?.skipCost) return {};
    if (source?.cost && typeof source.cost === "object" && !Array.isArray(source.cost)) {
      return clonePositiveCost(source.cost);
    }
    return { ...DEFAULT_LAUNCH_COST };
  }

  function getPhaseResourceValues(roundNumber = 1, options = {}) {
    const values = {
      ...RESOURCE_VALUES,
      ...(options.resourceValues || {}),
    };
    if (options.useEarlyResourcePremium === false) return values;
    const round = Math.max(1, Math.round(numeric(roundNumber) || 1));
    if (round <= 2) {
      const earlyValues = {
        credits: 5,
        energy: 5,
        ...(options.earlyResourceValues || {}),
      };
      for (const [key, value] of Object.entries(earlyValues)) {
        values[key] = Math.max(numeric(values[key]), numeric(value));
      }
    }
    return values;
  }

  function getRemainingIncomeMultiplier(roundNumber = 1, options = {}) {
    const finalRound = Math.max(1, Math.round(numeric(options.finalRoundNumber) || FINAL_ROUND_NUMBER));
    const round = Math.max(1, Math.round(numeric(roundNumber) || 1));
    const includeCurrentRound = options.includeCurrentRound !== false;
    return Math.max(0, finalRound - round - (includeCurrentRound ? 0 : 1));
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

  function isMovePaymentCard(card) {
    return Boolean(
      card?.movePayment
      || card?.canPayMove
      || card?.isMovePaymentCard
      || Number(card?.discardActionCode) === 2
      || card?.discardAction?.type === "move"
      || card?.discardReward?.type === "move"
      || card?.discardReward?.movementPoints,
    );
  }

  function getMovePaymentCost(input = {}) {
    const requiredMovePoints = Math.max(0, Math.round(numeric(
      input.requiredMovePoints ?? input.movePoints ?? input.movementPoints ?? 1,
    )));
    if (requiredMovePoints <= 0) return 0;

    const values = {
      ...RESOURCE_VALUES,
      ...(input.resourceValues || {}),
    };
    const energyValue = numeric(values.energy || RESOURCE_VALUES.energy);
    let availableEnergy = Math.max(0, Math.round(numeric(
      input.availableEnergy ?? input.player?.resources?.energy,
    )));
    const paymentCards = (Array.isArray(input.movePaymentCards)
      ? input.movePaymentCards
      : (input.hand || input.player?.hand || []).filter(isMovePaymentCard))
      .map((card) => getCardValue(card, {
        ...input,
        defaultCardValue: numeric(input.defaultMoveCardValue ?? values.handSize ?? DEFAULT_CARD_VALUE),
      }))
      .sort((left, right) => left - right);

    let cardIndex = 0;
    let total = 0;
    for (let point = 0; point < requiredMovePoints; point += 1) {
      const canUseEnergy = availableEnergy > 0;
      const canUseCard = cardIndex < paymentCards.length;
      if (canUseEnergy && canUseCard) {
        const cardValue = paymentCards[cardIndex];
        if (cardValue < energyValue) {
          total += cardValue;
          cardIndex += 1;
        } else {
          total += energyValue;
          availableEnergy -= 1;
        }
      } else if (canUseCard) {
        total += paymentCards[cardIndex];
        cardIndex += 1;
      } else {
        total += energyValue;
        if (canUseEnergy) availableEnergy -= 1;
      }
    }
    return roundValue(total);
  }

  function getIncomeRawValue(income = {}, options = {}) {
    const roundNumber = options.roundNumber ?? 1;
    const resourceValues = options.usePhaseResourceValues
      ? getPhaseResourceValues(roundNumber, options)
      : (options.resourceValues || RESOURCE_VALUES);
    return getResourceValue(income, resourceValues)
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

  function getPlayerKeys(player) {
    return {
      ids: new Set([player?.id, player?.playerId].filter(Boolean).map(String)),
      colors: new Set([player?.color, player?.playerColor].filter(Boolean).map(String)),
    };
  }

  function markerBelongsToPlayer(marker, player) {
    const keys = getPlayerKeys(player);
    return [marker?.ownerPlayerId, marker?.playerId, marker?.id].filter(Boolean)
      .some((value) => keys.ids.has(String(value)))
      || [marker?.ownerPlayerColor, marker?.playerColor, marker?.color].filter(Boolean)
        .some((value) => keys.colors.has(String(value)));
  }

  function getAlienSlotFromState(alienGameState = {}, alienSlotId = null) {
    if (alienSlotId == null) return null;
    return alienGameState?.aliens?.[String(alienSlotId)] || alienGameState?.aliens?.[Number(alienSlotId)] || null;
  }

  function countPlacedFirstTracesInSlot(slot = {}) {
    return ["yellow", "pink", "blue"].reduce((total, traceType) => (
      total + (slot?.traces?.[traceType]?.firstPlaced ? 1 : 0)
    ), 0);
  }

  function getHiddenTraceColorCompetition(alienGameState = {}, traceType = null, player = null) {
    if (!traceType) return { open: 0, own: 0, opponent: 0 };
    return Object.values(alienGameState?.aliens || {}).reduce((status, slot) => {
      if (!slot || slot.revealed || !slot.traces?.[traceType]) return status;
      const traceSlot = slot.traces[traceType];
      if (!traceSlot.firstPlaced) {
        status.open += 1;
      } else if (player && markerBelongsToPlayer(traceSlot, player)) {
        status.own += 1;
      } else {
        status.opponent += 1;
      }
      return status;
    }, { open: 0, own: 0, opponent: 0 });
  }

  function getHiddenAlienStateRewardValue(alienSlotId = null) {
    const slotId = Math.round(numeric(alienSlotId));
    const score = slotId === 1 ? 5 : slotId === 2 ? 3 : 4;
    return getResourceValue({ score, publicity: 1 });
  }

  function estimateRewardValue(reward = {}) {
    if (!reward || typeof reward !== "object") return 0;
    let value = getResourceValue(reward.gain || {});
    value += numeric(reward.dataCount) * RESOURCE_VALUES.availableData;
    value += numeric(reward.drawCards) * DEFAULT_CARD_VALUE;
    value += numeric(reward.blindDraw) * DEFAULT_CARD_VALUE;
    value += numeric(reward.basicRewardCount) * 2.25;
    if (reward.pickCard) value += DEFAULT_CARD_VALUE;
    if (reward.pickAlienCard) value += DEFAULT_ALIEN_CARD_VALUE;
    if (reward.fossilPanel || reward.chooseFossilRewardOnly) value += 4;
    if (reward.panelSymbol) value += 2.5;
    if (reward.refillPanelSymbol) value += 0.75;
    if (reward.region) value += 2.5;
    value -= numeric(reward.payData) * RESOURCE_VALUES.availableData;
    value -= numeric(reward.payFossils) * 2.5;
    return value;
  }

  function getRevealedTracePositionValue(position) {
    const pos = Math.max(0, Math.round(numeric(position)));
    if (pos >= 5) return 5;
    if (pos === 4) return 3.2;
    if (pos === 3) return 2.3;
    if (pos === 2) return 1.8;
    if (pos === 1) return 0.8;
    return 0;
  }

  function estimateRevealedTraceValue(input = {}) {
    const mode = String(input.mode || "");
    const position = Math.max(0, Math.round(numeric(input.position)));
    const label = String(input.label || "");
    const rewardValue = estimateRewardValue(input.reward);
    let value = 3;
    if (rewardValue > 0 || input.reward) value += rewardValue;
    value += getRevealedTracePositionValue(position);
    if (mode.includes("fangzhou") && label.includes("解锁")) value += 5;
    if (mode.includes("yichangdian") && position === 2) value += 2;
    if (mode.includes("banrenma") || mode.includes("aomomo")) value += position >= 4 ? 1 : position === 2 ? 1.2 : 0.6;
    if (mode.includes("chong") || mode.includes("amiba") || mode.includes("runezu")) value += position >= 4 ? 0.8 : position === 2 ? 1 : 0.4;
    if (mode.includes("jiuzhe")) value += position >= 4 ? 0.6 : position === 2 ? 0.8 : 0.25;
    if (label.includes("得分") || label.includes("分数")) value += 2;
    if (label.includes("精选") || label.includes("牌")) value += DEFAULT_CARD_VALUE;
    if (label.includes("信用")) value += RESOURCE_VALUES.credits;
    if (label.includes("数据") || label.includes("扫描")) value += RESOURCE_VALUES.availableData;
    return value;
  }

  function estimateAlienTraceValue(input = {}) {
    const traceType = input.traceType || input.options?.traceType || input.options?.traceTypes?.[0] || null;
    const alienGameState = input.alienGameState || {};
    const alienSlotId = input.alienSlotId ?? input.slotId ?? input.options?.alienSlotId ?? null;
    const slot = input.slot || getAlienSlotFromState(alienGameState, alienSlotId);
    const player = input.player || null;
    const mode = String(input.mode || "");
    const alienId = String(input.alienId || slot?.alienId || slot?.assignedAlienId || "");
    const revealed = Boolean(input.revealed ?? slot?.revealed ?? mode.endsWith("-grid"));

    if (revealed) {
      return roundValue(estimateRevealedTraceValue(input));
    }

    if (!slot?.traces || !traceType) {
      const baseValue = getHiddenAlienStateRewardValue(alienSlotId) + DEFAULT_ALIEN_CARD_VALUE * 0.75;
      const activeOpponentCount = Math.max(0, Math.round(numeric(input.activeOpponentCount ?? input.opponentCount)));
      const competitionSwing = input.competition === false
        ? 0
        : baseValue * Math.min(1.25, 0.35 + activeOpponentCount * 0.25);
      return roundValue(baseValue + competitionSwing);
    }

    const traceSlot = slot.traces[traceType];
    if (!traceSlot?.firstPlaced) {
      const placedCount = countPlacedFirstTracesInSlot(slot);
      const colorCompetition = getHiddenTraceColorCompetition(alienGameState, traceType, player);
      const lostHiddenFirstTraceColor = Boolean(
        player
        && colorCompetition.opponent > 0
        && colorCompetition.own <= 0
      );
      const stateRewardValue = getHiddenAlienStateRewardValue(alienSlotId);
      if (lostHiddenFirstTraceColor) {
        return roundValue(
          1.2
            + Math.min(1.4, colorCompetition.opponent * 0.45)
            + stateRewardValue * 0.18,
        );
      }
      let cardExpectation = input.alienCardExpectedValue ?? DEFAULT_ALIEN_CARD_VALUE * 0.85;
      let speciesRevealValue = 0;
      if (alienId.includes("jiuzhe")) {
        cardExpectation = 0;
        speciesRevealValue = 1 + placedCount * 0.5;
      } else if (alienId.includes("fangzhou")) {
        cardExpectation = DEFAULT_ALIEN_CARD_VALUE * 0.45;
        speciesRevealValue = 2.5;
      }
      const revealPressure = placedCount >= 2 ? 5 : placedCount === 1 ? 2 : 0.75;
      const ownValue = stateRewardValue + cardExpectation + speciesRevealValue + revealPressure;
      const activeOpponentCount = Math.max(0, Math.round(numeric(input.activeOpponentCount ?? input.opponentCount)));
      const competitionBase = stateRewardValue + cardExpectation * 0.75 + speciesRevealValue * 0.45;
      const competitionSwing = input.competition === false
        ? 0
        : competitionBase * Math.min(1.35, 0.4 + activeOpponentCount * 0.25);
      return roundValue(ownValue + competitionSwing);
    }

    const ownFirst = player && markerBelongsToPlayer(traceSlot, player);
    const placedCount = countPlacedFirstTracesInSlot(slot);
    const waitForRevealValue = placedCount >= 2 ? 1.1 : placedCount === 1 ? 0.8 : 0.5;
    const ownRetentionValue = ownFirst ? 0.9 : 0;
    const extraMarkerValue = Math.min(1.2, Math.max(0, numeric(traceSlot.extraCount)) * 0.3);
    return roundValue(waitForRevealValue + ownRetentionValue + extraMarkerValue);
  }

  function getFinalScoreValue(state = {}, player) {
    if (!player) return 0;
    if (endGameScoring?.computePlayerFinalScore) {
      const result = endGameScoring.computePlayerFinalScore(state, player);
      return numeric(result?.totalScore ?? result?.total);
    }
    return numeric(player.resources?.score);
  }

  function getNextMissingFinalScoreThreshold(currentScore = 0, finalMarkCount = 0) {
    const score = Math.max(0, numeric(currentScore));
    const marks = Math.max(0, Math.round(numeric(finalMarkCount)));
    if (marks >= 3) return null;
    if (score < 25 && marks < 1) return 25;
    if (score < 50 && marks < 2) return 50;
    if (score < 70 && marks < 3) return 70;
    return null;
  }

  function estimateFinalMarkCashoutValue(scoreGain = 0, options = {}) {
    const gain = Math.max(0, numeric(scoreGain));
    if (!gain) return 0;

    const round = Math.max(1, Math.round(numeric(options.roundNumber) || 1));
    const finalRound = Math.max(1, Math.round(numeric(options.finalRoundNumber) || FINAL_ROUND_NUMBER));
    if (round < finalRound - 1) return 0;

    const player = options.player || null;
    const currentScore = Math.max(0, numeric(options.currentScore ?? player?.resources?.score));
    const finalMarkCount = Math.max(0, Math.round(numeric(
      options.finalMarkCount ?? player?.finalMarkCount,
    )));
    const threshold = options.threshold
      ? Math.max(0, numeric(options.threshold))
      : getNextMissingFinalScoreThreshold(currentScore, finalMarkCount);
    if (!threshold || currentScore >= threshold) return 0;

    const configs = {
      25: { crossing: 7, window: 8, partialCap: 4, gainWeight: 0.65 },
      50: { crossing: 12, window: 12, partialCap: 8, gainWeight: 0.85 },
      70: { crossing: 26, window: 18, partialCap: 17, gainWeight: 1.1 },
    };
    const config = configs[threshold] || configs[50];
    const distance = Math.max(1, threshold - currentScore);
    let value = 0;
    if (currentScore + gain >= threshold) {
      value = config.crossing;
    } else if (distance <= config.window) {
      value = Math.min(
        config.partialCap,
        Math.min(gain, distance) * config.gainWeight + Math.max(0, config.window - distance) * 0.3,
      );
    } else if (threshold === 70 && currentScore >= 55 && gain >= 3) {
      value = Math.min(7, gain * 0.6);
    }
    const urgency = round >= finalRound ? 1 : 0.45;
    const weight = Math.max(0, numeric(options.weight ?? 1));
    return roundValue(Math.max(0, value * urgency * weight));
  }

  function estimateMissingFinalMarkPenalty(candidate = {}, options = {}) {
    const round = Math.max(1, Math.round(numeric(options.roundNumber) || 1));
    const finalRound = Math.max(1, Math.round(numeric(options.finalRoundNumber) || FINAL_ROUND_NUMBER));
    if (round < finalRound) return 0;

    const actionId = String(candidate.id || candidate.actionId || "");
    if (!actionId || actionId === "pass" || actionId === "end-turn") return 0;

    const player = options.player || null;
    const currentScore = Math.max(0, numeric(
      options.currentScore ?? player?.resources?.score ?? candidate.currentScore,
    ));
    const finalMarkCount = Math.max(0, Math.round(numeric(
      options.finalMarkCount ?? candidate.finalMarkCount ?? player?.finalMarkCount,
    )));
    const threshold = options.threshold
      ? Math.max(0, numeric(options.threshold))
      : getNextMissingFinalScoreThreshold(currentScore, finalMarkCount);
    if (!threshold) return 0;
    const deficit = Math.max(0, threshold - currentScore);
    if (!deficit) return 0;

    const directScoreGain = Math.max(0, numeric(candidate.directScoreGain));
    if (directScoreGain >= deficit) return 0;
    const followupDirectScore = Math.max(0, numeric(candidate.followupMainAction?.directScoreGain));
    const actionScales = threshold >= 70
      ? {
        placeData: 1.08,
        researchTech: 1.75,
        launch: 0.8,
        move: 0.65,
        playCard: 1.05,
        scan: 1.18,
        analyze: 0.72,
        cardCorner: 0.85,
        ...(options.actionScales || {}),
      }
      : {
        placeData: 1.1,
        researchTech: threshold <= 50 && finalMarkCount <= 1 ? 1.28 : 0.95,
        launch: 0.85,
        move: 0.78,
        playCard: 0.68,
        scan: threshold <= 50 && finalMarkCount <= 1 ? 0.58 : 0.65,
        analyze: 0.6,
        cardCorner: 0.55,
        ...(options.actionScales || {}),
    };
    const actionScale = numeric(actionScales[actionId] ?? 0.7);
    const finalRoundThirdMark = threshold >= 70 && finalMarkCount === 2 && round >= finalRound;
    const urgency = threshold <= 50 ? 0.5 : finalRoundThirdMark ? 0.42 : 0.24;
    const base = threshold <= 50 ? 8 : finalRoundThirdMark ? 10 : 5;
    const missingMarkPressure = threshold <= 50 && finalMarkCount <= 1
      ? 4
      : finalRoundThirdMark
        ? 3
        : 0;
    const directCoverage = directScoreGain > 0 ? Math.min(1, directScoreGain / deficit) : 0;
    const directDiscount = directCoverage > 0 ? Math.max(0.35, 1 - directCoverage * 0.65) : 1;
    const followupDiscount = followupDirectScore > 0
      ? (currentScore + directScoreGain + followupDirectScore >= threshold ? 0.35 : 0.55)
      : 1;
    const cap = threshold <= 50 ? 24 : finalRoundThirdMark ? 38 : 14;
    return roundValue(Math.min(
      cap,
      (base + deficit * urgency + missingMarkPressure) * actionScale * followupDiscount * directDiscount,
    ));
  }

  function estimateFinalTileZeroBasePenalty(options = {}) {
    const baseValue = Math.max(0, numeric(options.baseValue));
    const threshold = Math.max(0, numeric(options.threshold));
    if (baseValue > 0 || threshold < 50) return 0;

    const round = Math.max(1, Math.round(numeric(options.roundNumber) || 1));
    const finalRound = Math.max(1, Math.round(numeric(options.finalRoundNumber) || FINAL_ROUND_NUMBER));
    const slotIndex = Math.max(1, Math.round(numeric(options.slotIndex) || 3));
    const thresholdBase = threshold >= 70 ? 13 : 7;
    const roundScale = round >= finalRound
      ? 1.25
      : round >= finalRound - 1
        ? 0.8
        : 0.45;
    const slotScale = slotIndex === 1
      ? 1.1
      : slotIndex === 2
        ? 0.95
        : 0.8;
    const cap = threshold >= 70 ? 24 : 14;
    return roundValue(Math.min(cap, thresholdBase * roundScale * slotScale));
  }

  function estimateFinalRoundPassPenalty(options = {}) {
    const round = Math.max(1, Math.round(numeric(options.roundNumber) || 1));
    const finalRound = Math.max(1, Math.round(numeric(options.finalRoundNumber) || FINAL_ROUND_NUMBER));
    if (round < finalRound) return 0;

    const player = options.player || null;
    const currentScore = Math.max(0, numeric(options.currentScore ?? player?.resources?.score));
    const finalMarkCount = Math.max(0, Math.round(numeric(
      options.finalMarkCount ?? player?.finalMarkCount,
    )));
    const threshold = options.threshold
      ? Math.max(0, numeric(options.threshold))
      : getNextMissingFinalScoreThreshold(currentScore, finalMarkCount);
    if (!threshold || currentScore >= threshold) return 0;

    const deficit = Math.max(1, threshold - currentScore);
    const base = threshold <= 50 ? 16 : 14;
    const urgency = threshold <= 50 ? 0.5 : 0.35;
    const missingMarkPressure = Math.max(0, 3 - finalMarkCount) * (threshold <= 50 ? 2 : 1.5);
    const cap = threshold <= 50 ? 36 : 30;
    return roundValue(Math.min(cap, base + deficit * urgency + missingMarkPressure));
  }

  function estimateSecondMarkAnalyzeEnergyTradeValue(options = {}) {
    const round = Math.max(1, Math.round(numeric(options.roundNumber) || 1));
    const finalRound = Math.max(1, Math.round(numeric(options.finalRoundNumber) || FINAL_ROUND_NUMBER));
    if (round !== finalRound) return 0;
    if (Math.max(1, Math.round(numeric(options.turnNumber) || 1)) < 5) return 0;

    const currentScore = Math.max(0, numeric(options.currentScore));
    const finalMarkCount = Math.max(0, Math.round(numeric(options.finalMarkCount)));
    const energy = Math.max(0, numeric(options.energy));
    const credits = Math.max(0, numeric(options.credits));
    const handSize = Math.max(0, numeric(options.handSize));
    const analyzeEnergyCost = Math.max(1, numeric(options.analyzeEnergyCost || 1));
    if (
      finalMarkCount !== 1
      || currentScore < 43
      || currentScore >= 50
      || energy >= analyzeEnergyCost
      || (credits < 2 && handSize < 2)
    ) {
      return 0;
    }

    const deficit = Math.max(1, 50 - currentScore);
    const canReachAnalyze = Boolean(options.canReachAnalyze);
    const hasAnalyzeReadyDataSlot = Boolean(options.hasAnalyzeReadyDataSlot);
    const bestRevealedBlueTraceScore = Math.max(0, numeric(options.bestRevealedBlueTraceScore));
    const fangzhouBlueScoreCashout = Boolean(options.fangzhouBlueScoreCashout);
    const revealedBlueScoreCashout = hasAnalyzeReadyDataSlot && currentScore + bestRevealedBlueTraceScore >= 50;
    const closeIncomeSecondMark = Boolean(options.hasIncomeFormula) && canReachAnalyze && currentScore >= 49;
    if (!closeIncomeSecondMark && !fangzhouBlueScoreCashout && !revealedBlueScoreCashout) return 0;

    const placedCount = Math.max(0, numeric(options.placedComputerData));
    return roundValue(
      22
        + Math.max(0, 6 - deficit) * 1.05
        + Math.max(0, placedCount - 3) * 0.65
        + (revealedBlueScoreCashout || fangzhouBlueScoreCashout ? 3 : 0),
    );
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
    if (formulaId === "c1" && planAction === "task") return 0.35;
    if (formulaId === "c2" && planAction === "task") return 0.25;
    if (formulaId === "d1" && actionId === "researchTech") return 0.5;
    if (formulaId === "d2" && actionId === "researchTech") return 0.5;
    if (formulaId === "b1" && (actionId === "alien-trace" || effectTypes.includes("alien_trace"))) return 1;
    if ((formulaId === "a1" || formulaId === "a2") && (actionId === "playCard" || actionId === "cardCorner")) return 0.25;
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
    getRevealedTracePositionValue,
    DEFAULT_LAUNCH_COST,
    numeric,
    roundValue,
    clamp01,
    getPhaseResourceValues,
    getResourceValue,
    getLaunchPaymentCost,
    getMovePaymentCost,
    getRemainingIncomeMultiplier,
    getCardValue,
    getDiscardedCardValue,
    getIncomeRawValue,
    getIncomeNetValue,
    getIncomeValue,
    estimateAlienTraceValue,
    getNextMissingFinalScoreThreshold,
    estimateFinalMarkCashoutValue,
    estimateMissingFinalMarkPenalty,
    estimateFinalTileZeroBasePenalty,
    estimateFinalRoundPassPenalty,
    estimateSecondMarkAnalyzeEnergyTradeValue,
    evaluatePlayerState,
    estimateFinalMarginalForAction,
  });
});
