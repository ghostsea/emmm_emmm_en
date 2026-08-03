(function (root, factory) {
  "use strict";

  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.SetiAIResourceFlow = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function () {
  "use strict";

  const TRACKED_RESOURCE_KEYS = Object.freeze([
    "score",
    "credits",
    "energy",
    "publicity",
    "availableData",
    "handSize",
  ]);
  const SPENDABLE_RESOURCE_KEYS = Object.freeze([
    "credits",
    "energy",
    "publicity",
    "availableData",
    "handSize",
  ]);
  const SOURCE_CATEGORIES = Object.freeze([
    "setup",
    "pass_income",
    "income_upgrade_immediate",
    "tech_bonus_blue1",
    "tech_bonus_blue2",
    "tech_bonus_other",
    "industry",
    "alien",
    "card",
    "data_placement",
    "analysis",
    "planet_board",
    "trade_conversion",
    "cost",
    "settlement",
    "unclassified",
  ]);
  const RESOURCE_VALUES = Object.freeze({
    score: 1,
    credits: 3,
    energy: 3,
    publicity: 1,
    availableData: 1.5,
    handSize: 3,
  });
  const RESOURCE_LABEL_TO_KEY = Object.freeze({
    分数: "score",
    信用点: "credits",
    能量: "energy",
    宣传: "publicity",
    数据: "availableData",
    手牌: "handSize",
  });
  const DELTA_TOKEN_RE = /(分数|信用点|能量|宣传|数据|手牌)\s*([+-]\d+(?:\.\d+)?)/g;
  const PREFIX_DELTA_TOKEN_RE = /([+-]\d+(?:\.\d+)?)\s*(分数|信用点|能量|宣传|数据|手牌)/g;
  const INDUSTRY_LABELS = Object.freeze([
    "层云核心",
    "图灵系统",
    "哨兵探测网络",
    "寰宇动力",
    "寰宇超动力",
    "赫利昂",
    "赫利昂联合体",
    "任务中继站",
    "芬威克研究中心",
    "深空探测",
    "未来跨度研究所",
    "异星实验室",
    "作弊实验室",
    "宇宙战略集团",
    "宇宙大战略集团",
    "原教旨主义",
    "星际海盗",
  ]);
  const ALIEN_LABELS = Object.freeze([
    "九折",
    "异常点",
    "半人马",
    "方舟",
    "虫",
    "阿米巴",
    "奥陌陌",
    "符文族",
  ]);

  function emptyResourceMap() {
    return Object.fromEntries(TRACKED_RESOURCE_KEYS.map((key) => [key, 0]));
  }

  function normalizeResourceMap(source = {}) {
    return Object.fromEntries(TRACKED_RESOURCE_KEYS.map((key) => [
      key,
      Number(source?.[key]) || 0,
    ]));
  }

  function addResourceValue(target, key, value) {
    target[key] = (Number(target[key]) || 0) + (Number(value) || 0);
  }

  function weightedResourceMap(resources = {}) {
    return TRACKED_RESOURCE_KEYS.reduce(
      (total, key) => total + (Number(resources?.[key]) || 0) * RESOURCE_VALUES[key],
      0,
    );
  }

  function divideOrNull(numerator, denominator) {
    return denominator > 0 ? numerator / denominator : null;
  }

  function isIncomeSource(sourceCategory) {
    return sourceCategory === "pass_income" || sourceCategory === "income_upgrade_immediate";
  }

  function getOrCreatePlayerRow(playersByKey, key, event) {
    if (!playersByKey.has(key)) {
      playersByKey.set(key, {
        gameId: event.gameId || "game",
        playerId: event.playerId || null,
        playerLabel: event.playerLabel || null,
        finalScore: Number(event.finalScore) || 0,
        industryId: event.industryId || null,
        alienIds: new Set(event.alienId ? [event.alienId] : []),
        setupGain: emptyResourceMap(),
        grossGain: emptyResourceMap(),
        incomeGain: emptyResourceMap(),
        nonIncomeGain: emptyResourceMap(),
        spent: emptyResourceMap(),
        sourceTotals: Object.fromEntries(
          SOURCE_CATEGORIES.map((source) => [source, emptyResourceMap()]),
        ),
        events: [],
      });
    }
    return playersByKey.get(key);
  }

  function applyEventToPlayerRow(row, event) {
    row.events.push(event);
    if (event.playerLabel) row.playerLabel = event.playerLabel;
    if (Number.isFinite(Number(event.finalScore))) row.finalScore = Number(event.finalScore);
    if (event.industryId) row.industryId = event.industryId;
    if (event.alienId) row.alienIds.add(event.alienId);
    const sourceTotals = row.sourceTotals[event.sourceCategory] || row.sourceTotals.unclassified;

    for (const resourceKey of TRACKED_RESOURCE_KEYS) {
      const delta = Number(event.resourceDeltas?.[resourceKey]) || 0;
      if (delta > 0) {
        if (event.sourceCategory === "setup") {
          addResourceValue(sourceTotals, resourceKey, delta);
          addResourceValue(row.setupGain, resourceKey, delta);
        } else {
          addResourceValue(row.grossGain, resourceKey, delta);
          const embeddedIncome = isIncomeSource(event.sourceCategory)
            ? delta
            : Math.min(delta, Math.max(0, Number(event.incomeDeltas?.[resourceKey]) || 0));
          const nonIncome = delta - embeddedIncome;
          if (embeddedIncome > 0) addResourceValue(row.incomeGain, resourceKey, embeddedIncome);
          if (nonIncome > 0) {
            addResourceValue(row.nonIncomeGain, resourceKey, nonIncome);
            addResourceValue(sourceTotals, resourceKey, nonIncome);
          }
        }
      } else if (delta < 0) {
        addResourceValue(row.spent, resourceKey, Math.abs(delta));
      }
    }
  }

  function summarizeSameRoundReinvestment(events = []) {
    const reinvested = emptyResourceMap();
    const lotsByRoundAndResource = new Map();

    for (const event of events) {
      const roundKey = String(Number(event.roundNumber) || 0);
      if (!lotsByRoundAndResource.has(roundKey)) {
        lotsByRoundAndResource.set(
          roundKey,
          Object.fromEntries(TRACKED_RESOURCE_KEYS.map((key) => [key, []])),
        );
      }
      const lotsByResource = lotsByRoundAndResource.get(roundKey);
      for (const resourceKey of TRACKED_RESOURCE_KEYS) {
        const delta = Number(event.resourceDeltas?.[resourceKey]) || 0;
        if (delta > 0 && event.sourceCategory !== "setup" && !isIncomeSource(event.sourceCategory)) {
          const embeddedIncome = Math.min(
            delta,
            Math.max(0, Number(event.incomeDeltas?.[resourceKey]) || 0),
          );
          const nonIncome = delta - embeddedIncome;
          if (nonIncome > 0) lotsByResource[resourceKey].push(nonIncome);
          continue;
        }
        if (delta >= 0) continue;

        let remainingSpend = Math.abs(delta);
        const lots = lotsByResource[resourceKey];
        while (remainingSpend > 0 && lots.length > 0) {
          const used = Math.min(remainingSpend, lots[0]);
          reinvested[resourceKey] += used;
          remainingSpend -= used;
          lots[0] -= used;
          if (lots[0] <= 0) lots.shift();
        }
      }
    }

    return reinvested;
  }

  function summarizeDataCycles(events = []) {
    let awaitingPlacement = false;
    let placedAfterAnalysis = false;
    let dataTurnoverCount = 0;
    let fullDataCycleCount = 0;

    for (const event of events) {
      if (event.sourceCategory === "analysis") {
        if (awaitingPlacement && placedAfterAnalysis) fullDataCycleCount += 1;
        awaitingPlacement = true;
        placedAfterAnalysis = false;
      } else if (
        (event.sourceCategory === "data_placement" || event.isDataPlacement)
        && awaitingPlacement
        && !placedAfterAnalysis
      ) {
        dataTurnoverCount += 1;
        placedAfterAnalysis = true;
      }
    }

    return { dataTurnoverCount, fullDataCycleCount };
  }

  function applyBlueTechRewardEvent(summary, ownedTechIds, event) {
    for (const techId of event.techIds || []) {
      if (techId) ownedTechIds.add(String(techId).toLowerCase());
    }
    const nonIncomePositive = (resourceKey) => {
      const positive = Math.max(0, Number(event.resourceDeltas?.[resourceKey]) || 0);
      const embeddedIncome = isIncomeSource(event.sourceCategory)
        ? positive
        : Math.min(
          positive,
          Math.max(0, Number(event.incomeDeltas?.[resourceKey]) || 0),
        );
      return positive - embeddedIncome;
    };
    const credits = nonIncomePositive("credits");
    const energy = nonIncomePositive("energy");
    const isDataPlacement = event.isDataPlacement
      || /放置数据|蓝色奖励槽/.test(String(event.sourceDetail || ""));
    if (
      credits > 0
      && (event.sourceCategory === "tech_bonus_blue1"
        || (isDataPlacement && ownedTechIds.has("blue1")))
    ) {
      summary.blue1CreditGain += credits;
    }
    if (
      energy > 0
      && (event.sourceCategory === "tech_bonus_blue2"
        || (isDataPlacement && ownedTechIds.has("blue2")))
    ) {
      summary.blue2EnergyGain += energy;
    }
  }

  function summarizeBlueTechRewards(events = []) {
    const summary = { blue1CreditGain: 0, blue2EnergyGain: 0 };
    const ownedTechIds = new Set();
    for (const event of events) {
      applyBlueTechRewardEvent(summary, ownedTechIds, event);
    }
    return summary;
  }

  function getCardIdentity(card = {}) {
    return String(card.key || card.id || card.label || "").trim();
  }

  function summarizeCardUse(events = []) {
    const gainedCards = new Map();
    const cardUse = {
      gainedInGame: 0,
      played: 0,
      income: 0,
      discarded: 0,
      movePayments: 0,
      playedFromGains: 0,
      incomeFromGains: 0,
      discardedFromGains: 0,
      movePaymentsFromGains: 0,
      alienGainedInGame: 0,
      alienPlayedFromGains: 0,
    };

    function consumeGainedCard(card) {
      const identity = getCardIdentity(card);
      const queue = gainedCards.get(identity);
      if (!identity || !queue?.length) return null;
      const gained = queue.shift();
      if (queue.length === 0) gainedCards.delete(identity);
      return gained;
    }

    for (const event of events) {
      for (const card of event.cards || []) {
        if (card.change === "gain") {
          if (event.sourceCategory === "setup" || card.origin === "setup") continue;
          const identity = getCardIdentity(card);
          if (!identity) continue;
          if (!gainedCards.has(identity)) gainedCards.set(identity, []);
          gainedCards.get(identity).push(card);
          cardUse.gainedInGame += 1;
          if (card.origin === "alien") cardUse.alienGainedInGame += 1;
          continue;
        }

        const counterByChange = {
          play: "played",
          income: "income",
          discard: "discarded",
          move_payment: "movePayments",
        };
        const counter = counterByChange[card.change];
        if (!counter) continue;
        cardUse[counter] += 1;
        const gained = consumeGainedCard(card);
        if (!gained) continue;
        const fromGainsCounter = {
          play: "playedFromGains",
          income: "incomeFromGains",
          discard: "discardedFromGains",
          move_payment: "movePaymentsFromGains",
        }[card.change];
        cardUse[fromGainsCounter] += 1;
        if (card.change === "play" && gained.origin === "alien") {
          cardUse.alienPlayedFromGains += 1;
        }
      }
    }

    return cardUse;
  }

  function finalizePlayerRow(row, options = {}) {
    const { events, ...compactRow } = row;
    const compositePlayerKey = `${row.gameId}:${row.playerId}`;
    const unreconciledResourceKeys = new Set(options.unreconciledResourceKeys || []);
    const providedEndingInventory = options.endingInventories?.[compositePlayerKey]
      ?? options.endingInventories?.[row.playerId];
    const endingInventory = providedEndingInventory
      ? normalizeResourceMap(providedEndingInventory)
      : Object.fromEntries(TRACKED_RESOURCE_KEYS.map((key) => [
        key,
        unreconciledResourceKeys.has(key)
          ? null
          : (key === "score"
          ? row.finalScore
          : (key === "publicity"
            ? null
            : Math.max(0, row.setupGain[key] + row.grossGain[key] - row.spent[key]))),
      ]));
    const utilizationRate = emptyResourceMap();
    const nonIncomeShare = emptyResourceMap();
    for (const key of TRACKED_RESOURCE_KEYS) {
      utilizationRate[key] = unreconciledResourceKeys.has(key)
        ? null
        : divideOrNull(row.spent[key], row.setupGain[key] + row.grossGain[key]);
      nonIncomeShare[key] = divideOrNull(
        row.nonIncomeGain[key],
        row.incomeGain[key] + row.nonIncomeGain[key],
      );
    }
    const weightedActionCost = SPENDABLE_RESOURCE_KEYS.reduce(
      (total, key) => total + row.spent[key] * RESOURCE_VALUES[key],
      0,
    );
    const cycles = summarizeDataCycles(events);
    const cardUse = summarizeCardUse(events);
    const blueTechRewards = summarizeBlueTechRewards(events);
    return {
      ...compactRow,
      alienIds: [...row.alienIds],
      endingInventory,
      utilizationRate,
      nonIncomeShare,
      setupGainWeighted: weightedResourceMap(row.setupGain),
      grossGainWeighted: weightedResourceMap(row.grossGain),
      incomeGainWeighted: weightedResourceMap(row.incomeGain),
      nonIncomeGainWeighted: weightedResourceMap(row.nonIncomeGain),
      weightedActionCost,
      mainActionsPerWeightedCost: divideOrNull(
        Number(
          options.productiveMainActionCounts?.[compositePlayerKey]
          ?? options.productiveMainActionCounts?.[row.playerId],
        ) || 0,
        weightedActionCost,
      ),
      ...blueTechRewards,
      sameRoundReinvestment: summarizeSameRoundReinvestment(events),
      ...cycles,
      cardUse,
      drawToPlayRate: divideOrNull(cardUse.playedFromGains, cardUse.gainedInGame),
      incomeCardConversionRate: divideOrNull(
        cardUse.incomeFromGains,
        cardUse.playedFromGains
          + cardUse.incomeFromGains
          + cardUse.discardedFromGains
          + cardUse.movePaymentsFromGains,
      ),
      alienCardToPlayRate: divideOrNull(
        cardUse.alienPlayedFromGains,
        cardUse.alienGainedInGame,
      ),
    };
  }

  function getEventMagnitude(event) {
    return [event.resourceDeltas, event.incomeDeltas].reduce((total, deltas) => (
      total + TRACKED_RESOURCE_KEYS.reduce(
        (subtotal, key) => subtotal + Math.abs(Number(deltas?.[key]) || 0),
        0,
      )
    ), 0);
  }

  function buildCoverage(events = []) {
    const trackedMagnitude = events.reduce((total, event) => total + getEventMagnitude(event), 0);
    const classifiedMagnitude = events.reduce((total, event) => (
      total + (event.sourceCategory === "unclassified" ? 0 : getEventMagnitude(event))
    ), 0);
    return {
      trackedMagnitude,
      classifiedMagnitude,
      weighted: divideOrNull(classifiedMagnitude, trackedMagnitude) ?? 1,
    };
  }

  function average(values = []) {
    const numericValues = values.filter((value) => Number.isFinite(Number(value)));
    return numericValues.length
      ? numericValues.reduce((total, value) => total + Number(value), 0) / numericValues.length
      : 0;
  }

  function summarizePlayerRows(players = []) {
    return {
      playerCount: players.length,
      averageFinalScore: average(players.map((player) => player.finalScore)),
      averageWeightedActionCost: average(players.map((player) => player.weightedActionCost)),
      averageMainActionsPerWeightedCost: average(
        players.map((player) => player.mainActionsPerWeightedCost),
      ),
      averageFullDataCycleCount: average(players.map((player) => player.fullDataCycleCount)),
    };
  }

  function groupPlayers(players = [], valuesForPlayer) {
    const groups = new Map();
    for (const player of players) {
      for (const value of valuesForPlayer(player)) {
        if (!value) continue;
        if (!groups.has(value)) groups.set(value, []);
        groups.get(value).push(player);
      }
    }
    return Object.fromEntries(
      [...groups].map(([key, rows]) => [key, summarizePlayerRows(rows)]),
    );
  }

  function buildRoundResourceSummaries(events = []) {
    const rounds = new Map();
    const ownedTechIdsByPlayer = new Map();
    for (const event of events) {
      const round = String(Number(event.roundNumber) || 0);
      if (!rounds.has(round)) {
        rounds.set(round, {
          eventCount: 0,
          incomeGainWeighted: 0,
          nonIncomeGainWeighted: 0,
          spentWeighted: 0,
          blue1CreditGain: 0,
          blue2EnergyGain: 0,
          analysisCount: 0,
          dataPlacementCount: 0,
        });
      }
      const row = rounds.get(round);
      const playerKey = `${event.gameId || "game"}:${event.playerId || "unknown"}`;
      if (!ownedTechIdsByPlayer.has(playerKey)) ownedTechIdsByPlayer.set(playerKey, new Set());
      const blueTechRewards = { blue1CreditGain: 0, blue2EnergyGain: 0 };
      applyBlueTechRewardEvent(
        blueTechRewards,
        ownedTechIdsByPlayer.get(playerKey),
        event,
      );
      row.eventCount += 1;
      const positive = Object.fromEntries(TRACKED_RESOURCE_KEYS.map((key) => [
        key,
        Math.max(0, Number(event.resourceDeltas?.[key]) || 0),
      ]));
      const negative = Object.fromEntries(TRACKED_RESOURCE_KEYS.map((key) => [
        key,
        Math.max(0, -(Number(event.resourceDeltas?.[key]) || 0)),
      ]));
      if (event.sourceCategory !== "setup") {
        const incomePositive = emptyResourceMap();
        const nonIncomePositive = emptyResourceMap();
        for (const key of TRACKED_RESOURCE_KEYS) {
          incomePositive[key] = isIncomeSource(event.sourceCategory)
            ? positive[key]
            : Math.min(positive[key], Math.max(0, Number(event.incomeDeltas?.[key]) || 0));
          nonIncomePositive[key] = positive[key] - incomePositive[key];
        }
        row.incomeGainWeighted += weightedResourceMap(incomePositive);
        row.nonIncomeGainWeighted += weightedResourceMap(nonIncomePositive);
      }
      row.spentWeighted += weightedResourceMap(negative);
      row.blue1CreditGain += blueTechRewards.blue1CreditGain;
      row.blue2EnergyGain += blueTechRewards.blue2EnergyGain;
      if (event.sourceCategory === "analysis") row.analysisCount += 1;
      if (event.sourceCategory === "data_placement" || event.isDataPlacement) {
        row.dataPlacementCount += 1;
      }
    }
    return Object.fromEntries(rounds);
  }

  function buildGroupedPlayerSummaries(players = [], events = []) {
    return {
      byIndustry: groupPlayers(players, (player) => [player.industryId]),
      byAlien: groupPlayers(players, (player) => player.alienIds || []),
      byRound: buildRoundResourceSummaries(events),
    };
  }

  function buildUnclassifiedSamples(events = []) {
    return events
      .filter((event) => event.sourceCategory === "unclassified" && getEventMagnitude(event) > 0)
      .slice(0, 50)
      .map((event) => ({
        gameId: event.gameId,
        playerId: event.playerId,
        roundNumber: event.roundNumber,
        turnNumber: event.turnNumber,
        sourceDetail: event.sourceDetail,
        magnitude: getEventMagnitude(event),
      }));
  }

  function summarizeResourceEvents(events = [], options = {}) {
    const playersByKey = new Map();
    for (const event of events || []) {
      const key = `${event.gameId || "game"}:${event.playerId || event.playerLabel || "unknown"}`;
      const row = getOrCreatePlayerRow(playersByKey, key, event);
      applyEventToPlayerRow(row, event);
    }
    const players = [...playersByKey.values()].map((row) => finalizePlayerRow(row, options));
    return {
      coverage: buildCoverage(events),
      totals: summarizePlayerRows(players),
      players,
      groups: buildGroupedPlayerSummaries(players, events),
      unclassifiedSamples: buildUnclassifiedSamples(events),
    };
  }

  function addParsedDelta(target, label, value) {
    const key = RESOURCE_LABEL_TO_KEY[label];
    const numericValue = Number(value);
    if (!key || !Number.isFinite(numericValue) || numericValue === 0) return 0;
    target[key] = (Number(target[key]) || 0) + numericValue;
    return Math.abs(numericValue);
  }

  function collectDeltaTokens(text, target, acceptedRange = null, occupiedRanges = []) {
    let matchedMagnitude = 0;
    let duplicateSuppressed = 0;
    const matchedMagnitudeByKey = {};
    const matchCountByKey = {};
    const seenRanges = new Set();
    const patterns = [
      { regex: DELTA_TOKEN_RE, labelIndex: 1, valueIndex: 2 },
      { regex: PREFIX_DELTA_TOKEN_RE, labelIndex: 2, valueIndex: 1 },
    ];

    for (const pattern of patterns) {
      pattern.regex.lastIndex = 0;
      let match;
      while ((match = pattern.regex.exec(text))) {
        const start = match.index;
        const end = start + match[0].length;
        if (acceptedRange && (start < acceptedRange.start || end > acceptedRange.end)) continue;
        if (!acceptedRange && occupiedRanges.some((range) => start >= range.start && end <= range.end)) {
          continue;
        }
        const rangeKey = `${start}:${end}`;
        if (seenRanges.has(rangeKey)) {
          duplicateSuppressed += 1;
          continue;
        }
        seenRanges.add(rangeKey);
        const label = match[pattern.labelIndex];
        const key = RESOURCE_LABEL_TO_KEY[label];
        const magnitude = addParsedDelta(target, label, match[pattern.valueIndex]);
        matchedMagnitude += magnitude;
        if (key && magnitude > 0) {
          matchedMagnitudeByKey[key] = (matchedMagnitudeByKey[key] || 0) + magnitude;
          matchCountByKey[key] = (matchCountByKey[key] || 0) + 1;
        }
      }
    }
    return {
      matchedMagnitude,
      duplicateSuppressed,
      matchedMagnitudeByKey,
      matchCountByKey,
    };
  }

  function parseDeltaText(text = "") {
    const normalizedText = String(text || "");
    const resourceDeltas = {};
    const incomeDeltas = {};
    const explicitRanges = [];
    let matchedMagnitude = 0;
    let duplicateSuppressed = 0;
    const groupPattern = /(资源|收入)\s*[:：]\s*([^；;\n]+)/g;
    let groupMatch;

    while ((groupMatch = groupPattern.exec(normalizedText))) {
      const body = groupMatch[2];
      const bodyStart = groupMatch.index + groupMatch[0].indexOf(body);
      const range = { start: bodyStart, end: bodyStart + body.length };
      explicitRanges.push(range);
      const result = collectDeltaTokens(
        normalizedText,
        groupMatch[1] === "收入" ? incomeDeltas : resourceDeltas,
        range,
      );
      matchedMagnitude += result.matchedMagnitude;
      duplicateSuppressed += result.duplicateSuppressed;
    }

    const genericDeltas = {};
    const generic = collectDeltaTokens(
      normalizedText,
      genericDeltas,
      null,
      explicitRanges,
    );
    duplicateSuppressed += generic.duplicateSuppressed;
    for (const [key, value] of Object.entries(genericDeltas)) {
      if (
        Object.prototype.hasOwnProperty.call(resourceDeltas, key)
        && Number(resourceDeltas[key]) === Number(value)
      ) {
        duplicateSuppressed += generic.matchCountByKey[key] || 0;
        continue;
      }
      resourceDeltas[key] = (Number(resourceDeltas[key]) || 0) + Number(value);
      matchedMagnitude += generic.matchedMagnitudeByKey[key] || 0;
    }

    return {
      resourceDeltas,
      incomeDeltas,
      matchedMagnitude,
      duplicateSuppressed,
    };
  }

  function includesAny(text, values) {
    return values.some((value) => text.includes(value));
  }

  function classifySourceCategory(context = {}) {
    if (
      SOURCE_CATEGORIES.includes(context.sourceCategory)
      && context.sourceCategory !== "unclassified"
    ) {
      return context.sourceCategory;
    }

    const pace = String(context.pace || context.source || "").toLowerCase();
    const text = [
      context.text,
      context.actionLabel,
      context.sourceDetail,
      context.industryLabel,
      context.alienLabel,
    ].filter(Boolean).join(" ");
    const lowerText = text.toLowerCase();

    if (/第\d+轮开始/.test(text) && includesAny(text, INDUSTRY_LABELS)) return "industry";
    if (pace === "setup" || /初始选择|选择公司|初始效果/.test(text)) return "setup";
    if (pace === "pass" || /获得本轮收入|pass\s*收入|回合收入/i.test(text)) {
      return "pass_income";
    }
    if (
      /(?:放置数据|奖励|奖励槽|槽位).*?(?:蓝(?:色)?\s*1|blue\s*1)|(?:蓝(?:色)?\s*1|blue\s*1).*?(?:奖励|奖励槽|槽位)/i.test(text)
    ) {
      return "tech_bonus_blue1";
    }
    if (
      /(?:放置数据|奖励|奖励槽|槽位).*?(?:蓝(?:色)?\s*2|blue\s*2)|(?:蓝(?:色)?\s*2|blue\s*2).*?(?:奖励|奖励槽|槽位)/i.test(text)
    ) {
      return "tech_bonus_blue2";
    }
    if (
      /收入(?:提升|增加|升级|调整)|(?:提升|增加|升级).*收入|收入：.*(?:弃掉|弃牌).*已即时获得|income[_\s-]*upgrade/i.test(text)
    ) {
      return "income_upgrade_immediate";
    }
    if (context.industryId || includesAny(text, INDUSTRY_LABELS)) return "industry";
    if (context.alienId || includesAny(text, ALIEN_LABELS) || /化石奖励|繁殖样本|首次接触/.test(text)) {
      return "alien";
    }
    if (/科技(?:奖励|加成|bonus)|技术奖励|tech[_\s-]*bonus/i.test(text)) {
      return "tech_bonus_other";
    }
    if (
      /打出|打牌|卡牌|弃牌|弃掉|手牌收入|收益牌|盲抽|精选|补牌|完成任务|拥有\d+个.*科技/.test(text)
    ) {
      return "card";
    }
    if (context.actionType === "researchTech") return "tech_bonus_other";
    if (/放置数据|数据放置|投入数据|数据槽/.test(text)) return "data_placement";
    if (/分析数据|执行分析|分析行动/.test(text)) return "analysis";
    if (/交易|兑换|资源转换|资源转化/.test(text)) return "trade_conversion";
    if (/支付|花费|消耗|费用|成本/.test(text)) return "cost";
    if (/环绕|登陆|着陆|发射|移动|星球|卫星|扫描|旋转|彗星|小行星/.test(text)) {
      return "planet_board";
    }
    if (/结算|终局|得分|计分|赢家奖励|参与奖励|完成\d+个.*扇区/.test(text)) {
      return "settlement";
    }
    if (lowerText.includes("analysis")) return "analysis";
    return "unclassified";
  }

  const STRUCTURED_COLOR_LABELS = Object.freeze({
    white: "白色",
    brown: "棕色",
    green: "绿色",
    blue: "蓝色",
  });

  function normalizeStructuredPlayerState(player = {}) {
    const hand = Array.isArray(player.hand) ? player.hand : [];
    return {
      playerId: player.id || null,
      playerLabel: player.playerLabel
        || player.label
        || STRUCTURED_COLOR_LABELS[player.color]
        || player.name
        || player.id
        || null,
      resources: normalizeResourceMap({
        ...(player.resources || {}),
        handSize: hand.length,
      }),
      income: normalizeResourceMap(player.income || {}),
      hand: hand.map((card, index) => ({
        key: String(card?.id || card?.key || card?.label || `hand-${index + 1}`),
        label: card?.label || card?.name || card?.id || card?.key || `手牌${index + 1}`,
      })),
      industryId: player.initialSelection?.industry?.label
        || player.initialSelection?.industry?.id
        || null,
    };
  }

  function extractStructuredSnapshotStates(entry) {
    const players = entry?.recoverySnapshot?.state?.playerState?.players;
    if (!Array.isArray(players)) return null;
    return new Map(players.map((player) => {
      const normalized = normalizeStructuredPlayerState(player);
      return [normalized.playerId, normalized];
    }).filter(([playerId]) => playerId));
  }

  function normalizeInitialStructuredStates(initialPlayerStates) {
    if (!initialPlayerStates || typeof initialPlayerStates !== "object") return null;
    const rows = Array.isArray(initialPlayerStates)
      ? initialPlayerStates
      : Object.entries(initialPlayerStates).map(([playerId, player]) => ({
        ...player,
        id: player?.id || playerId,
      }));
    return new Map(rows.map((player) => {
      const normalized = normalizeStructuredPlayerState(player);
      return [normalized.playerId, normalized];
    }).filter(([playerId]) => playerId));
  }

  function diffResourceMaps(after = {}, before = {}) {
    const result = {};
    for (const key of TRACKED_RESOURCE_KEYS) {
      const delta = (Number(after?.[key]) || 0) - (Number(before?.[key]) || 0);
      if (delta) result[key] = delta;
    }
    return result;
  }

  function addResourceMaps(...maps) {
    const result = {};
    for (const map of maps) {
      for (const [key, value] of Object.entries(map || {})) {
        const numericValue = Number(value) || 0;
        if (!numericValue) continue;
        result[key] = (Number(result[key]) || 0) + numericValue;
        if (!result[key]) delete result[key];
      }
    }
    return result;
  }

  function findStructuredPlayerId(entry, step, snapshotStates) {
    const text = String(step?.text || "");
    const candidates = [...(snapshotStates?.values?.() || [])];
    for (const player of candidates) {
      if (!player.playerLabel) continue;
      const escapedLabel = player.playerLabel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const explicitDelta = new RegExp(
        `${escapedLabel}\\s+(?:分数|信用点|能量|宣传|数据|手牌)\\s*[+-]\\d`,
      );
      const explicitGain = new RegExp(`${escapedLabel}(?:获得|得到)\\s*\\d`);
      const explicitOwner = new RegExp(`(?:^|[：；;,，])\\s*${escapedLabel}(?!奖励槽)`);
      if (explicitDelta.test(text) || explicitGain.test(text) || explicitOwner.test(text)) {
        return player.playerId;
      }
    }
    return entry.playerId || null;
  }

  function findStructuredAlienId(text) {
    return ALIEN_LABELS.find((alien) => String(text || "").includes(alien)) || null;
  }

  function extractStructuredStepCards(step, sourceCategory) {
    const cards = [];
    if (step?.playedCard) {
      const played = step.playedCard;
      cards.push({
        key: String(played.id || played.key || played.label || "played-card"),
        label: played.label || played.name || played.id || "打出的牌",
        change: "play",
        origin: "normal",
      });
    }
    const text = String(step?.text || "");
    const income = text.match(/收入：弃掉\s+([^，；]+)/);
    if (income) {
      cards.push({ key: income[1], label: income[1], change: "income", origin: "normal" });
    } else if (/弃牌换1移动/.test(text)) {
      cards.push({
        key: `move-payment:${step?.stepId || text}`,
        label: "未知弃牌",
        change: "move_payment",
        origin: "normal",
      });
    } else if (/弃牌|弃掉|弃除手牌/.test(text)) {
      const discarded = text.match(/(?:弃牌|弃掉|弃除手牌)\s*([^，；：]*)/);
      const label = discarded?.[1]?.trim() || "未知弃牌";
      cards.push({ key: label, label, change: "discard", origin: "normal" });
    }
    return cards.map((card) => ({
      ...card,
      origin: card.change === "play"
        ? card.origin
        : (sourceCategory === "alien" ? "alien" : card.origin),
    }));
  }

  function getStructuredPlayerResult(options, playerId, playerLabel) {
    return (options.playerResults || []).find((player) => (
      player.playerId === playerId || player.id === playerId || player.playerLabel === playerLabel
    )) || null;
  }

  function collectStructuredUnsignedRewards(text, target) {
    const rewardPattern = /(?:获取奖励|获得|得到|奖励)\s*[:：]?\s*([^；;]+)/g;
    const tokenPattern = /(\d+(?:\.\d+)?)\s*(分数|分|信用点|能量|宣传|数据|手牌)/g;
    const signedDeltas = { ...target };
    let rewardMatch;
    while ((rewardMatch = rewardPattern.exec(String(text || "")))) {
      const body = rewardMatch[1];
      tokenPattern.lastIndex = 0;
      let tokenMatch;
      while ((tokenMatch = tokenPattern.exec(body))) {
        const preceding = body[tokenMatch.index - 1] || "";
        if (preceding === "+" || preceding === "-") continue;
        const label = tokenMatch[2] === "分" ? "分数" : tokenMatch[2];
        const key = RESOURCE_LABEL_TO_KEY[label];
        if (Number(signedDeltas[key]) === Number(tokenMatch[1])) continue;
        addParsedDelta(target, label, tokenMatch[1]);
      }
    }
  }

  function parseStructuredCostDeltas(text) {
    const result = {};
    const costPattern = /(?:消耗|支付|花费|成本)\s*[:：]?\s*([^；;]+)/g;
    const tokenPattern = /([+-]?\d+(?:\.\d+)?)\s*(信用点|能量|宣传|数据|手牌)/g;
    let costMatch;
    while ((costMatch = costPattern.exec(String(text || "")))) {
      tokenPattern.lastIndex = 0;
      let tokenMatch;
      while ((tokenMatch = tokenPattern.exec(costMatch[1]))) {
        addParsedDelta(result, tokenMatch[2], -Math.abs(Number(tokenMatch[1])));
      }
    }
    return result;
  }

  function collectStructuredSetupIncome(text, incomeDeltas, resourceDeltas) {
    const englishIncome = /初始收入水平\s+([^；;]+)/g;
    const englishKeyMap = { credits: "credits", energy: "energy", handSize: "handSize" };
    let englishMatch;
    while ((englishMatch = englishIncome.exec(text))) {
      const tokenPattern = /(credits|energy|handSize)\s*\+(\d+(?:\.\d+)?)/g;
      let tokenMatch;
      while ((tokenMatch = tokenPattern.exec(englishMatch[1]))) {
        addResourceValue(incomeDeltas, englishKeyMap[tokenMatch[1]], Number(tokenMatch[2]));
      }
    }

    const chineseIncome = /收入\s*\+(\d+(?:\.\d+)?)\s*(信用点|能量|数据|盲抽|手牌)/g;
    const chineseKeyMap = {
      信用点: "credits",
      能量: "energy",
      数据: "availableData",
      盲抽: "handSize",
      手牌: "handSize",
    };
    let chineseMatch;
    while ((chineseMatch = chineseIncome.exec(text))) {
      const key = chineseKeyMap[chineseMatch[2]];
      const value = Number(chineseMatch[1]);
      addResourceValue(incomeDeltas, key, value);
      if (Number(resourceDeltas[key])) {
        addResourceValue(resourceDeltas, key, -value);
        if (!resourceDeltas[key]) delete resourceDeltas[key];
      }
    }
  }

  function collapseStructuredDuplicateSignedDeltas(text, resourceDeltas) {
    const occurrences = new Map();
    const patterns = [
      { regex: /(分数|信用点|能量|宣传|数据|手牌)\s*([+-]\d+(?:\.\d+)?)/g, label: 1, value: 2 },
      { regex: /([+-]\d+(?:\.\d+)?)\s*(分数|信用点|能量|宣传|数据|手牌)/g, label: 2, value: 1 },
    ];
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.regex.exec(text))) {
        const key = RESOURCE_LABEL_TO_KEY[match[pattern.label]];
        const value = Number(match[pattern.value]);
        const occurrenceKey = `${key}:${value}`;
        occurrences.set(occurrenceKey, (occurrences.get(occurrenceKey) || 0) + 1);
      }
    }
    for (const [occurrenceKey, count] of occurrences) {
      if (count < 2) continue;
      const separator = occurrenceKey.lastIndexOf(":");
      const key = occurrenceKey.slice(0, separator);
      const value = Number(occurrenceKey.slice(separator + 1));
      if (Number(resourceDeltas[key]) === value * count) resourceDeltas[key] = value;
    }
  }

  function parseStructuredStepDeltas(step, sourceCategory) {
    const text = String(step?.text || "");
    const parsed = parseDeltaText(text);
    if (!Number(parsed.resourceDeltas.score)) {
      const signedShortScorePattern = /([+-]\d+(?:\.\d+)?)\s*分(?!数)/g;
      let signedShortScoreMatch;
      while ((signedShortScoreMatch = signedShortScorePattern.exec(text))) {
        addParsedDelta(parsed.resourceDeltas, "分数", signedShortScoreMatch[1]);
      }
    }
    collapseStructuredDuplicateSignedDeltas(text, parsed.resourceDeltas);
    collectStructuredUnsignedRewards(text, parsed.resourceDeltas);
    let resourceDeltas = sourceCategory === "cost"
      ? parseStructuredCostDeltas(text)
      : { ...parsed.resourceDeltas };
    let incomeDeltas = sourceCategory === "pass_income" ? {} : { ...parsed.incomeDeltas };
    if (sourceCategory === "pass_income" || sourceCategory === "income_upgrade_immediate") {
      resourceDeltas = addResourceMaps(resourceDeltas, parsed.incomeDeltas);
    }
    if (sourceCategory === "income_upgrade_immediate" && /收入：弃掉/.test(text)) {
      addResourceValue(resourceDeltas, "handSize", -1);
    }
    if (sourceCategory === "setup") {
      collectStructuredSetupIncome(text, incomeDeltas, resourceDeltas);
    }
    const implicitDataGains = (text.match(/获得数据/g) || []).length;
    const recordedDataGains = Math.max(0, Number(resourceDeltas.availableData) || 0);
    if (implicitDataGains > recordedDataGains) {
      addResourceValue(resourceDeltas, "availableData", implicitDataGains - recordedDataGains);
    }
    if (/^放置数据/.test(text)) {
      addResourceValue(resourceDeltas, "availableData", -1);
    }
    const discardReward = text.match(/弃牌换\s*(\d+(?:\.\d+)?)\s*(信用点|能量|宣传|数据)/);
    if (discardReward) {
      addParsedDelta(resourceDeltas, discardReward[2], discardReward[1]);
    }
    return {
      resourceDeltas,
      incomeDeltas,
    };
  }

  function buildStructuredStepEvent(entry, step, stepIndex, snapshotStates, options) {
    const playerId = findStructuredPlayerId(entry, step, snapshotStates);
    const snapshotPlayer = snapshotStates?.get(playerId) || null;
    const playerLabel = snapshotPlayer?.playerLabel || entry.playerLabel || playerId;
    const sourceCategory = classifySourceCategory({
      pace: step?.source,
      text: step?.text,
      actionLabel: entry.actionLabel,
      actionType: entry.actionType,
    });
    const parsed = parseStructuredStepDeltas(step, sourceCategory);
    const playerResult = getStructuredPlayerResult(options, playerId, playerLabel);
    const techMatch = String(step?.text || "").match(/选择科技：([a-z]+\d+)/i);
    return {
      gameId: options.gameId || "ai-game",
      entryId: entry.id ?? entry.entryId ?? null,
      stepIndex,
      playerId,
      playerLabel,
      finalScore: Number(playerResult?.finalScore) || 0,
      roundNumber: Number(entry.roundNumber) || 0,
      turnNumber: Number(entry.turnNumber) || 0,
      pace: step?.source || null,
      sourceCategory,
      sourceDetail: String(step?.text || ""),
      resourceDeltas: parsed.resourceDeltas,
      incomeDeltas: parsed.incomeDeltas,
      cards: extractStructuredStepCards(step, sourceCategory),
      techIds: techMatch ? [techMatch[1].toLowerCase()] : [],
      alienId: findStructuredAlienId(step?.text),
      industryId: snapshotPlayer?.industryId || null,
      isDataPlacement: /^放置数据/.test(String(step?.text || "")),
      confidence: 1,
    };
  }

  function getStructuredHandAdditions(beforePlayer, afterPlayer) {
    const beforeKeys = new Set((beforePlayer?.hand || []).map((card) => card.key));
    return (afterPlayer?.hand || []).filter((card) => !beforeKeys.has(card.key));
  }

  function getStructuredHandRemovals(beforePlayer, afterPlayer) {
    const afterKeys = new Set((afterPlayer?.hand || []).map((card) => card.key));
    return (beforePlayer?.hand || []).filter((card) => !afterKeys.has(card.key));
  }

  function attachStructuredHandGains(entryEvents, beforeStates, afterStates, entry) {
    if (!beforeStates || !afterStates) return;
    const entryId = entry.id ?? entry.entryId ?? null;
    for (const [playerId, afterPlayer] of afterStates) {
      const additions = getStructuredHandAdditions(beforeStates.get(playerId), afterPlayer);
      if (!additions.length) continue;
      const playerEvents = entryEvents.filter((event) => (
        event.entryId === entryId && event.playerId === playerId
      ));
      const targetEvent = [...playerEvents].reverse().find((event) => event.sourceCategory !== "cost")
        || playerEvents[playerEvents.length - 1];
      const anyEntryAlienEvent = entryEvents.find((event) => (
        event.entryId === entryId && event.sourceCategory === "alien"
      ));
      const anyEntryIndustryEvent = entryEvents.find((event) => (
        event.entryId === entryId && event.sourceCategory === "industry"
      ));
      const sourceCategory = targetEvent?.sourceCategory
        || (anyEntryAlienEvent ? "alien" : (anyEntryIndustryEvent ? "industry" : "card"));
      const eventForCards = targetEvent || {
        gameId: entryEvents[0]?.gameId || "ai-game",
        entryId,
        stepIndex: Number.MAX_SAFE_INTEGER - 1,
        playerId,
        playerLabel: afterPlayer.playerLabel,
        finalScore: 0,
        roundNumber: Number(entry.roundNumber) || 0,
        turnNumber: Number(entry.turnNumber) || 0,
        pace: entry.actionType || null,
        sourceCategory,
        sourceDetail: "snapshot hand gain",
        resourceDeltas: {},
        incomeDeltas: {},
        cards: [],
        techIds: [],
        alienId: anyEntryAlienEvent?.alienId || null,
        industryId: afterPlayer.industryId,
        confidence: 0.9,
        syntheticHandGain: true,
      };
      if (!targetEvent) entryEvents.push(eventForCards);
      const recordedHandGain = playerEvents.reduce(
        (total, event) => total + Math.max(0, Number(event.resourceDeltas?.handSize) || 0),
        0,
      );
      const unrecordedHandGain = Math.max(0, additions.length - recordedHandGain);
      if (unrecordedHandGain > 0) {
        addResourceValue(eventForCards.resourceDeltas, "handSize", unrecordedHandGain);
      }
      const existingKeys = new Set((eventForCards.cards || []).map((card) => card.key));
      const origin = eventForCards.sourceCategory === "setup"
        ? "setup"
        : (eventForCards.sourceCategory === "alien"
          ? "alien"
          : (eventForCards.sourceCategory === "industry" ? "industry" : "normal"));
      for (const card of additions) {
        if (existingKeys.has(card.key)) continue;
        eventForCards.cards.push({ ...card, change: "gain", origin });
      }
    }
  }

  function attachStructuredHandUses(entryEvents, beforeStates, afterStates, entry) {
    if (!beforeStates || !afterStates) return;
    const entryId = entry.id ?? entry.entryId ?? null;
    for (const [playerId, beforePlayer] of beforeStates) {
      const removals = getStructuredHandRemovals(beforePlayer, afterStates.get(playerId));
      if (!removals.length) continue;
      const playerEvents = entryEvents.filter((event) => (
        event.entryId === entryId && event.playerId === playerId
      ));
      const remaining = [...removals];
      const takeRemoval = (card) => {
        const key = getCardIdentity(card);
        let index = remaining.findIndex((candidate) => candidate.key === key);
        if (index < 0 && card?.label) {
          index = remaining.findIndex((candidate) => candidate.label === card.label);
        }
        if (index < 0) index = 0;
        return remaining.splice(index, 1)[0] || null;
      };
      for (const event of playerEvents) {
        for (const card of event.cards || []) {
          if (card.change !== "play" || !remaining.length) continue;
          const identity = getCardIdentity(card);
          const index = remaining.findIndex((candidate) => candidate.key === identity);
          if (index >= 0) remaining.splice(index, 1);
        }
      }
      for (const event of playerEvents) {
        for (let index = 0; index < (event.cards || []).length; index += 1) {
          const card = event.cards[index];
          if (!["income", "discard", "move_payment"].includes(card.change) || !remaining.length) {
            continue;
          }
          const removal = takeRemoval(card);
          if (!removal) continue;
          event.cards[index] = {
            ...card,
            key: removal.key,
            label: removal.label || card.label,
          };
        }
      }
    }
  }

  function sumStructuredEntryEvents(events, entryId, playerId, field) {
    return events
      .filter((event) => event.entryId === entryId && event.playerId === playerId)
      .reduce((total, event) => addResourceMaps(total, event[field]), {});
  }

  function isSetupStructuredEntry(entry) {
    const steps = Array.isArray(entry?.steps) ? entry.steps : [];
    return steps.length > 0 && steps.every((step) => step?.source === "setup");
  }

  function appendStructuredSetupResiduals(entryEvents, entry, beforeStates, afterStates, options) {
    if (!beforeStates || !afterStates || !isSetupStructuredEntry(entry)) return;
    const entryId = entry.id ?? entry.entryId ?? null;
    for (const [playerId, afterPlayer] of afterStates) {
      const beforePlayer = beforeStates.get(playerId);
      if (!beforePlayer) continue;
      const actualResources = {
        handSize: (Number(afterPlayer.resources.handSize) || 0)
          - (Number(beforePlayer.resources.handSize) || 0),
      };
      const actualIncome = {};
      const parsedResources = sumStructuredEntryEvents(
        entryEvents,
        entryId,
        playerId,
        "resourceDeltas",
      );
      const parsedIncome = {};
      const residualResources = addResourceMaps(actualResources, Object.fromEntries(
        [["handSize", -(Number(parsedResources.handSize) || 0)]],
      ));
      const residualIncome = addResourceMaps(actualIncome, Object.fromEntries(
        Object.entries(parsedIncome).map(([key, value]) => [key, -value]),
      ));
      if (!Object.keys(residualResources).length && !Object.keys(residualIncome).length) continue;
      const playerResult = getStructuredPlayerResult(options, playerId, afterPlayer.playerLabel);
      entryEvents.push({
        gameId: options.gameId || "ai-game",
        entryId,
        stepIndex: Number.MAX_SAFE_INTEGER,
        playerId,
        playerLabel: afterPlayer.playerLabel,
        finalScore: Number(playerResult?.finalScore) || 0,
        roundNumber: Number(entry.roundNumber) || 0,
        turnNumber: Number(entry.turnNumber) || 0,
        pace: "setup",
        sourceCategory: "setup",
        sourceDetail: "setup snapshot residual",
        resourceDeltas: residualResources,
        incomeDeltas: residualIncome,
        cards: getStructuredHandAdditions(beforePlayer, afterPlayer).map((card) => ({
          ...card,
          change: "gain",
          origin: "setup",
        })),
        techIds: [],
        alienId: null,
        industryId: afterPlayer.industryId,
        confidence: 1,
        syntheticSetupResidual: true,
      });
    }
  }

  function appendStructuredResearchCostInference(
    entryEvents,
    entry,
    beforeStates,
    afterStates,
    options,
  ) {
    if (!beforeStates || !afterStates || isSetupStructuredEntry(entry)) return;
    const text = (entry.steps || []).map((step) => String(step?.text || "")).join(" ");
    if (!/科技行动/.test(text) || !/选择科技：/.test(text)) return;
    const entryId = entry.id ?? entry.entryId ?? null;
    const playerId = entry.playerId || null;
    const beforePlayer = beforeStates.get(playerId);
    const afterPlayer = afterStates.get(playerId);
    if (!beforePlayer || !afterPlayer) return;
    const actualPublicity = (Number(afterPlayer.resources.publicity) || 0)
      - (Number(beforePlayer.resources.publicity) || 0);
    const eventPublicity = Number(
      sumStructuredEntryEvents(entryEvents, entryId, playerId, "resourceDeltas").publicity,
    ) || 0;
    const missingCost = actualPublicity - eventPublicity;
    if (missingCost >= 0) return;
    const playerResult = getStructuredPlayerResult(options, playerId, afterPlayer.playerLabel);
    entryEvents.push({
      gameId: options.gameId || "ai-game",
      entryId,
      stepIndex: Number.MAX_SAFE_INTEGER - 2,
      playerId,
      playerLabel: afterPlayer.playerLabel,
      finalScore: Number(playerResult?.finalScore) || 0,
      roundNumber: Number(entry.roundNumber) || 0,
      turnNumber: Number(entry.turnNumber) || 0,
      pace: "main",
      sourceCategory: "cost",
      sourceDetail: "research tech snapshot cost",
      resourceDeltas: { publicity: missingCost },
      incomeDeltas: {},
      cards: [],
      techIds: [],
      alienId: null,
      industryId: afterPlayer.industryId,
      confidence: 1,
      syntheticResearchCost: true,
    });
  }

  function chooseStructuredSnapshotInferenceSource(entryEvents, allEntryEvents, key, delta) {
    if (delta < 0) {
      if (key === "availableData" && entryEvents.some((event) => event.sourceCategory === "data_placement")) {
        return "data_placement";
      }
      if (key === "handSize") return "card";
      return "cost";
    }
    const candidates = entryEvents.length ? entryEvents : allEntryEvents;
    const priority = [
      "alien",
      "settlement",
      "industry",
      "card",
      "planet_board",
      "data_placement",
      "analysis",
      "trade_conversion",
    ];
    return priority.find((source) => candidates.some((event) => event.sourceCategory === source))
      || "unclassified";
  }

  function appendStructuredSnapshotInferences(
    entryEvents,
    entry,
    beforeStates,
    afterStates,
    options,
  ) {
    if (!beforeStates || !afterStates || isSetupStructuredEntry(entry)) return 0;
    const entryId = entry.id ?? entry.entryId ?? null;
    const allEntryEvents = entryEvents;
    let inferredMagnitude = 0;
    for (const [playerId, afterPlayer] of afterStates) {
      const beforePlayer = beforeStates.get(playerId);
      if (!beforePlayer) continue;
      const playerEvents = allEntryEvents.filter((event) => event.playerId === playerId);
      const actualResources = diffResourceMaps(afterPlayer.resources, beforePlayer.resources);
      const eventResources = sumStructuredEntryEvents(
        playerEvents,
        entryId,
        playerId,
        "resourceDeltas",
      );
      delete actualResources.score;
      delete eventResources.score;
      const residualResources = addResourceMaps(actualResources, Object.fromEntries(
        Object.entries(eventResources).map(([key, value]) => [key, -value]),
      ));
      const actualIncome = diffResourceMaps(afterPlayer.income, beforePlayer.income);
      const eventIncome = sumStructuredEntryEvents(
        playerEvents,
        entryId,
        playerId,
        "incomeDeltas",
      );
      const residualIncome = addResourceMaps(actualIncome, Object.fromEntries(
        Object.entries(eventIncome).map(([key, value]) => [key, -value]),
      ));
      const groups = new Map();
      const ensureGroup = (sourceCategory) => {
        if (!groups.has(sourceCategory)) {
          groups.set(sourceCategory, { resourceDeltas: {}, incomeDeltas: {} });
        }
        return groups.get(sourceCategory);
      };
      for (const [key, delta] of Object.entries(residualResources)) {
        if (!delta) continue;
        const sourceCategory = chooseStructuredSnapshotInferenceSource(
          playerEvents,
          allEntryEvents,
          key,
          delta,
        );
        ensureGroup(sourceCategory).resourceDeltas[key] = delta;
        inferredMagnitude += Math.abs(delta);
      }
      for (const [key, delta] of Object.entries(residualIncome)) {
        if (!delta) continue;
        const sourceCategory = playerEvents.some((event) => (
          event.sourceCategory === "income_upgrade_immediate"
        )) ? "income_upgrade_immediate" : "unclassified";
        ensureGroup(sourceCategory).incomeDeltas[key] = delta;
        inferredMagnitude += Math.abs(delta);
      }
      const playerResult = getStructuredPlayerResult(options, playerId, afterPlayer.playerLabel);
      let groupIndex = 0;
      for (const [sourceCategory, deltas] of groups) {
        allEntryEvents.push({
          gameId: options.gameId || "ai-game",
          entryId,
          stepIndex: Number.MAX_SAFE_INTEGER - 10 + groupIndex,
          playerId,
          playerLabel: afterPlayer.playerLabel,
          finalScore: Number(playerResult?.finalScore) || 0,
          roundNumber: Number(entry.roundNumber) || 0,
          turnNumber: Number(entry.turnNumber) || 0,
          pace: entry.actionType || null,
          sourceCategory,
          sourceDetail: `snapshot inference: ${sourceCategory}`,
          ...deltas,
          cards: [],
          techIds: [],
          alienId: sourceCategory === "alien"
            ? findStructuredAlienId((entry.steps || []).map((step) => step?.text).join(" "))
            : null,
          industryId: afterPlayer.industryId,
          confidence: 0.8,
          syntheticSnapshotInference: true,
        });
        groupIndex += 1;
      }
    }
    return inferredMagnitude;
  }

  function normalizeEntriesAndSnapshots(entries = [], options = {}) {
    const events = [];
    let previousStates = normalizeInitialStructuredStates(options.initialPlayerStates);
    let setupResidualAvailable = true;
    let inferredMagnitude = 0;
    for (const entry of entries || []) {
      const snapshotStates = extractStructuredSnapshotStates(entry);
      const entryEvents = (entry.steps || []).map((step, stepIndex) => (
        buildStructuredStepEvent(entry, step, stepIndex, snapshotStates, options)
      ));
      if (setupResidualAvailable) {
        appendStructuredSetupResiduals(
          entryEvents,
          entry,
          previousStates,
          snapshotStates,
          options,
        );
      }
      appendStructuredResearchCostInference(
        entryEvents,
        entry,
        previousStates,
        snapshotStates,
        options,
      );
      attachStructuredHandGains(entryEvents, previousStates, snapshotStates, entry);
      attachStructuredHandUses(entryEvents, previousStates, snapshotStates, entry);
      inferredMagnitude += appendStructuredSnapshotInferences(
        entryEvents,
        entry,
        previousStates,
        snapshotStates,
        options,
      );
      events.push(...entryEvents);
      if (snapshotStates) {
        previousStates = snapshotStates;
        setupResidualAvailable = false;
      }
    }
    return { events, finalStates: previousStates, inferredMagnitude };
  }

  function normalizeStructuredActionLog(entries = [], options = {}) {
    return normalizeEntriesAndSnapshots(entries, options).events;
  }

  function getResidualMagnitude(resourceDeltas, incomeDeltas) {
    return [resourceDeltas, incomeDeltas].reduce((total, deltas) => (
      total + Object.values(deltas || {}).reduce(
        (subtotal, value) => subtotal + Math.abs(Number(value) || 0),
        0,
      )
    ), 0);
  }

  function indexStructuredEventsByEntryAndPlayer(events = []) {
    const index = new Map();
    for (const event of events) {
      if (!index.has(event.entryId)) index.set(event.entryId, new Map());
      const entryEvents = index.get(event.entryId);
      if (!entryEvents.has(event.playerId)) entryEvents.set(event.playerId, []);
      entryEvents.get(event.playerId).push(event);
    }
    return index;
  }

  function reconcileStructuredEvents(entries = [], events = [], options = {}) {
    const residuals = [];
    const baselineMissing = [];
    const eventIndex = indexStructuredEventsByEntryAndPlayer(events);
    let previousStates = normalizeInitialStructuredStates(options.initialPlayerStates);
    for (const entry of entries || []) {
      const currentStates = extractStructuredSnapshotStates(entry);
      if (!currentStates) continue;
      const entryId = entry.id ?? entry.entryId ?? null;
      if (isSetupStructuredEntry(entry)) {
        previousStates = currentStates;
        continue;
      }
      for (const [playerId, currentPlayer] of currentStates) {
        const previousPlayer = previousStates?.get(playerId);
        if (!previousPlayer) {
          baselineMissing.push({ entryId, playerId });
          continue;
        }
        const playerEntryEvents = eventIndex.get(entryId)?.get(playerId) || [];
        const actualResources = diffResourceMaps(currentPlayer.resources, previousPlayer.resources);
        const actualIncome = diffResourceMaps(currentPlayer.income, previousPlayer.income);
        const eventResources = sumStructuredEntryEvents(
          playerEntryEvents,
          entryId,
          playerId,
          "resourceDeltas",
        );
        const eventIncome = sumStructuredEntryEvents(
          playerEntryEvents,
          entryId,
          playerId,
          "incomeDeltas",
        );
        delete actualResources.score;
        delete eventResources.score;
        const residualResources = addResourceMaps(actualResources, Object.fromEntries(
          Object.entries(eventResources).map(([key, value]) => [key, -value]),
        ));
        const residualIncome = addResourceMaps(actualIncome, Object.fromEntries(
          Object.entries(eventIncome).map(([key, value]) => [key, -value]),
        ));
        const magnitude = getResidualMagnitude(residualResources, residualIncome);
        if (magnitude > 0) {
          residuals.push({
            entryId,
            playerId,
            playerLabel: currentPlayer.playerLabel,
            resourceDeltas: residualResources,
            incomeDeltas: residualIncome,
            magnitude,
          });
        }
      }
      previousStates = currentStates;
    }
    return {
      residualMagnitude: residuals.reduce((total, residual) => total + residual.magnitude, 0),
      residuals,
      baselineMissing,
      baselineMissingCount: baselineMissing.length,
    };
  }

  function buildStructuredEndingInventories(finalStates, gameId) {
    if (!finalStates) return undefined;
    return Object.fromEntries([...finalStates].map(([playerId, player]) => [
      `${gameId}:${playerId}`,
      player.resources,
    ]));
  }

  function buildStructuredProductiveMainActionCounts(entries = []) {
    const counts = {};
    for (const entry of entries || []) {
      const actionType = String(entry?.actionType || "").toLowerCase();
      const steps = Array.isArray(entry?.steps) ? entry.steps : [];
      const isPass = entry?.passed === true
        || actionType === "pass"
        || steps.some((step) => /(?:^|\s)PASS(?:\s|$)/i.test(String(step?.text || "")));
      const isSetup = steps.length > 0 && steps.every((step) => step?.source === "setup");
      const hasMainStep = steps.some((step) => step?.source === "main");
      if (!entry?.playerId || isPass || isSetup || actionType === "quick" || !hasMainStep) continue;
      counts[entry.playerId] = (Number(counts[entry.playerId]) || 0) + 1;
    }
    return counts;
  }

  function analyzeStructuredActionLog(entries = [], options = {}) {
    const normalized = normalizeEntriesAndSnapshots(entries, options);
    const gameId = options.gameId || "ai-game";
    const events = normalized.events;
    const reconciliation = reconcileStructuredEvents(entries, events, options);
    reconciliation.inferredMagnitude = normalized.inferredMagnitude;
    reconciliation.inferredEventCount = events.filter(
      (event) => event.syntheticSnapshotInference || event.syntheticResearchCost,
    ).length;
    return {
      ...summarizeResourceEvents(events, {
        ...options,
        productiveMainActionCounts: options.productiveMainActionCounts
          || buildStructuredProductiveMainActionCounts(entries),
        endingInventories: options.endingInventories
          || buildStructuredEndingInventories(normalized.finalStates, gameId),
      }),
      events,
      reconciliation,
    };
  }

  function summarizeResourceFlowAnalyses(analyses = []) {
    const players = analyses.flatMap((analysis) => analysis?.players || []);
    const trackedMagnitude = analyses.reduce(
      (total, analysis) => total + (Number(analysis?.coverage?.trackedMagnitude) || 0),
      0,
    );
    const classifiedMagnitude = analyses.reduce(
      (total, analysis) => total + (Number(analysis?.coverage?.classifiedMagnitude) || 0),
      0,
    );
    const coverage = {
      trackedMagnitude,
      classifiedMagnitude,
      weighted: divideOrNull(classifiedMagnitude, trackedMagnitude) ?? 1,
    };
    return {
      gameCount: analyses.length,
      coverage,
      totals: summarizePlayerRows(players),
      headline: {
        gameCount: analyses.length,
        coverage: coverage.weighted,
        averageFinalScore: summarizePlayerRows(players).averageFinalScore,
        averageWeightedActionCost: summarizePlayerRows(players).averageWeightedActionCost,
      },
    };
  }

  return Object.freeze({
    TRACKED_RESOURCE_KEYS,
    SPENDABLE_RESOURCE_KEYS,
    SOURCE_CATEGORIES,
    RESOURCE_VALUES,
    parseDeltaText,
    classifySourceCategory,
    summarizeBlueTechRewards,
    summarizeResourceEvents,
    summarizeResourceFlowAnalyses,
    normalizeStructuredActionLog,
    reconcileStructuredEvents,
    analyzeStructuredActionLog,
  });
});
