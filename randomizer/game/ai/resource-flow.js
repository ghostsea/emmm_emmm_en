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
      blue1CreditGain: row.sourceTotals.tech_bonus_blue1.credits,
      blue2EnergyGain: row.sourceTotals.tech_bonus_blue2.energy,
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
      if (event.sourceCategory === "tech_bonus_blue1") {
        row.blue1CreditGain += positive.credits;
      }
      if (event.sourceCategory === "tech_bonus_blue2") {
        row.blue2EnergyGain += positive.energy;
      }
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
    summarizeResourceEvents,
    summarizeResourceFlowAnalyses,
  });
});
