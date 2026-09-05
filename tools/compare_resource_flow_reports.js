"use strict";

const fs = require("fs");
const path = require("path");
const { summarizeBlueTechRewards, summarizeResourceEvents } = require("../randomizer/game/ai/resource-flow");

const RESOURCE_VALUES = Object.freeze({
  credits: 3,
  energy: 3,
  publicity: 1,
  availableData: 1.5,
  handSize: 3,
});

const DIRECT_METRICS = Object.freeze([
  "setupGainWeighted",
  "incomeGainWeighted",
  "nonIncomeGainWeighted",
  "weightedActionCost",
  "mainActionsPerWeightedCost",
  "dataTurnoverCount",
  "fullDataCycleCount",
  "drawToPlayRate",
  "incomeCardConversionRate",
  "alienCardToPlayRate",
  "blue1CreditGain",
  "blue2EnergyGain",
]);

const ACTIONABLE_METRICS = new Set([
  "mainActionsPerWeightedCost",
  "dataTurnoverCount",
  "fullDataCycleCount",
  "drawToPlayRate",
  "incomeCardConversionRate",
  "alienCardToPlayRate",
  "utilizationCredits",
  "utilizationEnergy",
  "utilizationPublicity",
  "utilizationAvailableData",
  "utilizationHandSize",
  "sameRoundReinvestmentRate",
]);

const METRIC_LABELS = Object.freeze({
  averageFinalScore: "平均分",
  setupGainWeighted: "开局资源价值",
  incomeGainWeighted: "收入资源价值",
  nonIncomeGainWeighted: "非收入资源价值",
  weightedActionCost: "行动资源消耗价值",
  mainActionsPerWeightedCost: "单位资源主行动数",
  dataTurnoverCount: "数据回填次数",
  fullDataCycleCount: "完整数据循环",
  drawToPlayRate: "新牌打出率",
  incomeCardConversionRate: "收益牌转化率",
  alienCardToPlayRate: "外星人牌打出率",
  blue1CreditGain: "蓝1信用点",
  blue2EnergyGain: "蓝2能量",
  utilizationCredits: "信用点利用率",
  utilizationEnergy: "能量利用率",
  utilizationPublicity: "宣传利用率",
  utilizationAvailableData: "数据利用率",
  utilizationHandSize: "手牌利用率",
  sameRoundReinvestmentWeighted: "同轮再投入价值",
  sameRoundReinvestmentRate: "非收入资源同轮再投入率",
});

function average(values) {
  const numeric = values
    .filter((value) => value !== null && value !== undefined && value !== "")
    .map(Number)
    .filter(Number.isFinite);
  return numeric.length
    ? numeric.reduce((total, value) => total + value, 0) / numeric.length
    : null;
}

function round(value, digits = 6) {
  if (value === null || value === undefined || value === "") return null;
  if (!Number.isFinite(Number(value))) return null;
  const scale = 10 ** digits;
  return Math.round(Number(value) * scale) / scale;
}

function weightedResources(resources = {}) {
  return Object.entries(RESOURCE_VALUES).reduce(
    (total, [key, weight]) => total + (Number(resources?.[key]) || 0) * weight,
    0,
  );
}

function getPlayerMetric(player, metric) {
  const resourceMapKey = {
    setupGainWeighted: "setupGain",
    incomeGainWeighted: "incomeGain",
    nonIncomeGainWeighted: "nonIncomeGain",
    weightedActionCost: "spent",
  }[metric];
  if (resourceMapKey && player[resourceMapKey]) {
    return weightedResources(player[resourceMapKey]);
  }
  if (metric.startsWith("utilization")) {
    const suffix = metric.slice("utilization".length);
    const resourceKey = suffix.charAt(0).toLowerCase() + suffix.slice(1);
    return player.utilizationRate?.[resourceKey];
  }
  if (metric === "sameRoundReinvestmentWeighted") {
    return weightedResources(player.sameRoundReinvestment);
  }
  if (metric === "sameRoundReinvestmentRate") {
    const denominator = Number(getPlayerMetric(player, "nonIncomeGainWeighted")) || 0;
    return denominator > 0 ? weightedResources(player.sameRoundReinvestment) / denominator : null;
  }
  return player?.[metric];
}

function summarizePlayers(players = []) {
  const rows = (players || []).filter(Boolean);
  const result = {
    playerCount: rows.length,
    averageFinalScore: round(average(rows.map((player) => player.finalScore))),
  };
  const metrics = [
    ...DIRECT_METRICS,
    "utilizationCredits",
    "utilizationEnergy",
    "utilizationPublicity",
    "utilizationAvailableData",
    "utilizationHandSize",
    "sameRoundReinvestmentWeighted",
    "sameRoundReinvestmentRate",
  ];
  for (const metric of metrics) {
    result[metric] = round(average(rows.map((player) => getPlayerMetric(player, metric))));
  }
  return result;
}

function getQuartilePlayers(players = [], side) {
  const sorted = [...players].filter(Boolean).sort((left, right) => (
    (Number(left.finalScore) || 0) - (Number(right.finalScore) || 0)
    || String(left.playerId || "").localeCompare(String(right.playerId || ""), "zh-CN")
  ));
  if (!sorted.length) return [];
  const count = Math.max(1, Math.ceil(sorted.length * 0.25));
  return side === "top" ? sorted.slice(-count) : sorted.slice(0, count);
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
  return Object.fromEntries([...groups].map(([key, rows]) => [key, summarizePlayers(rows)]));
}

function summarizeRoundGroups(flows = [], playerCount = 0) {
  const byRound = new Map();
  for (const flow of flows) {
    const roundGroups = flow.events?.length
      ? summarizeResourceEvents(flow.events).groups.byRound
      : flow?.groups?.byRound || {};
    for (const [roundId, row] of Object.entries(roundGroups)) {
      if (!byRound.has(roundId)) byRound.set(roundId, []);
      // Legacy round aggregates have no raw resource maps to remove score from.
      // Keep their counts, but do not mix obsolete weighted sums into v2 reports.
      byRound.get(roundId).push(flow.events?.length || flow.resourceWeighting === "spendable-only-v2"
        ? row
        : Object.fromEntries(Object.entries(row).filter(([key]) => !key.endsWith("Weighted"))));
    }
  }
  const denominator = Math.max(1, Number(playerCount) || 0);
  return Object.fromEntries([...byRound].map(([roundId, rows]) => {
    const totals = {};
    for (const row of rows) {
      for (const [key, value] of Object.entries(row || {})) {
        if (!Number.isFinite(Number(value))) continue;
        totals[key] = (Number(totals[key]) || 0) + Number(value);
      }
    }
    return [roundId, Object.fromEntries(Object.entries(totals).map(([key, value]) => [
      key,
      round(value / denominator),
    ]))];
  }));
}

function extractReference(reference) {
  const hasHumanSummary = Boolean(reference?.humanSummary);
  const summary = reference?.humanSummary || reference?.summary || reference || {};
  const uncertainResearchCosts = (reference?.games || []).reduce((sum, game) => sum
    + (Number(game.accounting?.uncertainResearchCostByPlayer?.[reference.humanPlayerLabel || "白色"]) || 0), 0);
  const warnings = hasHumanSummary ? []
    : ["参考报告缺少 humanSummary，已回退到旧 summary；该口径可能混入日志内电脑座位。"];
  if (uncertainResearchCosts > 0) warnings.push(`真人日志中有 ${uncertainResearchCosts} 次科技支付缺少公司面板状态，未推测其宣传成本；资源消耗与转换率仍是估计，来源分类覆盖率不代表账本完整。`);
  return {
    players: summary.players || [],
    flows: [{ groups: summary.groups || {}, resourceWeighting: summary.resourceWeighting }],
    coverage: summary.coverage || null,
    duplicateFileCount: Number(reference?.duplicateFiles?.length ?? reference?.duplicateFileCount) || 0,
    referenceSource: hasHumanSummary ? "humanSummary" : "legacy_summary",
    warnings,
  };
}

function enrichAiFlowPlayers(flow = {}, decisionLogs = []) {
  const entriesByPlayer = new Map();
  const eventsByPlayer = new Map();
  for (const event of flow.events || []) {
    if (event?.playerId) {
      if (!eventsByPlayer.has(event.playerId)) eventsByPlayer.set(event.playerId, []);
      eventsByPlayer.get(event.playerId).push(event);
    }
    if (!event?.playerId || event.pace !== "main") continue;
    const key = `${event.playerId}:${event.entryId}`;
    if (!entriesByPlayer.has(key)) entriesByPlayer.set(key, []);
    entriesByPlayer.get(key).push(event);
  }
  const mainActionCounts = {};
  for (const events of entriesByPlayer.values()) {
    if (events.some((event) => event.sourceCategory === "pass_income")) continue;
    if (events.every((event) => event.sourceCategory === "setup")) continue;
    const playerId = events[0].playerId;
    mainActionCounts[playerId] = (Number(mainActionCounts[playerId]) || 0) + 1;
  }
  const mainDecisions = decisionLogs.filter((entry) => entry.type === "turn-action"
    && entry.details?.action?.kind === "main");
  const decisionCounts = {};
  for (const entry of mainDecisions) decisionCounts[entry.playerId] = (decisionCounts[entry.playerId] || 0) + 1;
  return (flow.players || []).map((player) => {
    const weightedCost = Number(player.weightedActionCost) || 0;
    const derived = weightedCost > 0
      ? (Number(mainActionCounts[player.playerId]) || 0) / weightedCost
      : 0;
    const playerEvents = eventsByPlayer.get(player.playerId) || [];
    const blueTechRewards = playerEvents.length
      ? summarizeBlueTechRewards(playerEvents)
      : {
        blue1CreditGain: player.blue1CreditGain,
        blue2EnergyGain: player.blue2EnergyGain,
      };
    return {
      ...player,
      mainActionsPerWeightedCost: mainDecisions.length && weightedCost > 0
        ? (decisionCounts[player.playerId] || 0) / weightedCost
        : Number(player.mainActionsPerWeightedCost) > 0
        ? player.mainActionsPerWeightedCost
        : derived,
      ...blueTechRewards,
    };
  });
}

function extractAi(ai) {
  const result = ai?.result || ai || {};
  const samplesWithFlow = Array.isArray(result.samples)
    ? result.samples.filter((sample) => sample?.resourceFlow)
    : null;
  let flows = [];
  if (Array.isArray(result.samples)) {
    flows = samplesWithFlow.map((sample) => sample.resourceFlow);
  } else if (result.resourceFlow) {
    flows = [result.resourceFlow];
  } else if (ai?.resourceFlow) {
    flows = [ai.resourceFlow];
  }
  return {
    players: flows.flatMap((flow, index) => enrichAiFlowPlayers(flow,
      (samplesWithFlow ? samplesWithFlow[index].logs : result.logs) || [])),
    flows,
    coverage: result.resourceFlow?.coverage || result.resourceFlow?.headline || null,
    gamesRun: Number(result.gamesRun) || flows.length,
    maxReconciliationResidual: Math.max(
      0,
      ...flows.map((flow) => Number(flow?.reconciliation?.residualMagnitude) || 0),
    ),
    inferredMagnitude: flows.reduce(
      (total, flow) => total + (Number(flow?.reconciliation?.inferredMagnitude) || 0),
      0,
    ),
  };
}

function buildSideSummary(extracted) {
  const players = extracted.players || [];
  return {
    playerCount: players.length,
    allPlayers: summarizePlayers(players),
    topQuartile: summarizePlayers(getQuartilePlayers(players, "top")),
    bottomQuartile: summarizePlayers(getQuartilePlayers(players, "bottom")),
    byIndustry: groupPlayers(players, (player) => [player.industryId]),
    byAlien: groupPlayers(players, (player) => player.alienIds || []),
    byRound: summarizeRoundGroups(extracted.flows, players.length),
    coverage: extracted.coverage,
    ...(extracted.duplicateFileCount != null
      ? { duplicateFileCount: extracted.duplicateFileCount }
      : {}),
    ...(extracted.gamesRun != null ? { gamesRun: extracted.gamesRun } : {}),
    ...(extracted.maxReconciliationResidual != null
      ? { maxReconciliationResidual: extracted.maxReconciliationResidual }
      : {}),
    ...(extracted.inferredMagnitude != null
      ? { inferredMagnitude: extracted.inferredMagnitude }
      : {}),
  };
}

function subtractMetricRows(referenceRow = {}, aiRow = {}) {
  const result = {};
  for (const key of new Set([...Object.keys(referenceRow), ...Object.keys(aiRow)])) {
    if (key === "playerCount") continue;
    const referenceValue = referenceRow[key] === null || referenceRow[key] === undefined
      ? NaN
      : Number(referenceRow[key]);
    const aiValue = aiRow[key] === null || aiRow[key] === undefined
      ? NaN
      : Number(aiRow[key]);
    result[key] = Number.isFinite(referenceValue) && Number.isFinite(aiValue)
      ? round(referenceValue - aiValue)
      : null;
  }
  return result;
}

function compareSharedGroups(referenceGroups = {}, aiGroups = {}) {
  const shared = Object.keys(referenceGroups).filter((key) => aiGroups[key]);
  return Object.fromEntries(shared.map((key) => [
    key,
    subtractMetricRows(referenceGroups[key], aiGroups[key]),
  ]));
}

function buildDeltas(reference, ai) {
  return {
    allPlayers: subtractMetricRows(reference.allPlayers, ai.allPlayers),
    topQuartile: subtractMetricRows(reference.topQuartile, ai.topQuartile),
    bottomQuartile: subtractMetricRows(reference.bottomQuartile, ai.bottomQuartile),
    byIndustry: compareSharedGroups(reference.byIndustry, ai.byIndustry),
    byAlien: compareSharedGroups(reference.byAlien, ai.byAlien),
    byRound: compareSharedGroups(reference.byRound, ai.byRound),
  };
}

function buildLargestGaps(deltas) {
  const gaps = [];
  for (const group of ["allPlayers", "topQuartile", "bottomQuartile"]) {
    for (const [metric, delta] of Object.entries(deltas[group] || {})) {
      if (!ACTIONABLE_METRICS.has(metric) || !Number.isFinite(Number(delta))) continue;
      gaps.push({
        group,
        metric,
        label: METRIC_LABELS[metric] || metric,
        delta,
        absoluteDelta: Math.abs(delta),
        direction: delta > 0 ? "human_higher" : delta < 0 ? "ai_higher" : "equal",
      });
    }
  }
  return gaps.sort((left, right) => (
    right.absoluteDelta - left.absoluteDelta
    || left.group.localeCompare(right.group)
    || left.metric.localeCompare(right.metric)
  ));
}

function buildEvidence(reference, ai, deltas) {
  const evidence = [];
  if (
    Number(ai.topQuartile.nonIncomeGainWeighted) > Number(reference.topQuartile.nonIncomeGainWeighted)
    && Number(ai.topQuartile.fullDataCycleCount) < Number(reference.topQuartile.fullDataCycleCount)
  ) {
    evidence.push("电脑收入外资源更多但完整数据循环更少，优先检查资源到分析/回填行动的转化，而不是提高资源静态价值。");
  }
  if (
    Number(ai.allPlayers.setupGainWeighted) > Number(reference.allPlayers.setupGainWeighted)
    && Number(ai.allPlayers.mainActionsPerWeightedCost) < Number(reference.allPlayers.mainActionsPerWeightedCost)
  ) {
    evidence.push("电脑开局资源更多但单位资源形成的主行动更少，应检查行动链和资源保留，而不是继续补开局资源。");
  }
  if (Number(deltas.topQuartile.drawToPlayRate) > 0) {
    evidence.push("真人高分组的新牌打出率更高，优先检查外星人补牌、精选和盲抽后的同轮打出机会。");
  }
  if (Number(deltas.topQuartile.incomeCardConversionRate) > 0) {
    evidence.push("真人高分组更常把新牌转成收益牌，需检查手牌价值与收入升级的时序。");
  }
  return evidence;
}

function compareResourceFlowReports(referenceInput, aiInput) {
  const referenceExtracted = extractReference(referenceInput);
  const aiExtracted = extractAi(aiInput);
  const reference = buildSideSummary(referenceExtracted);
  const ai = buildSideSummary(aiExtracted);
  const deltas = buildDeltas(reference, ai);
  return {
    generatedAt: new Date().toISOString(),
    deltaDirection: "human_minus_ai",
    referenceSource: referenceExtracted.referenceSource,
    warnings: referenceExtracted.warnings,
    reference,
    ai,
    deltas,
    largestGaps: buildLargestGaps(deltas),
    evidence: buildEvidence(reference, ai, deltas),
  };
}

function formatMetric(value) {
  if (value === null || value === undefined || value === "") return "-";
  return Number.isFinite(Number(value)) ? String(round(value, 4)) : "-";
}

function renderMetricTable(reference, ai, deltas) {
  const metrics = [
    "averageFinalScore",
    ...DIRECT_METRICS,
    "sameRoundReinvestmentWeighted",
    "sameRoundReinvestmentRate",
  ];
  return [
    "| 指标 | 真人 | 电脑 | 真人-电脑 |",
    "| --- | ---: | ---: | ---: |",
    ...metrics.map((metric) => (
      `| ${METRIC_LABELS[metric] || metric} | ${formatMetric(reference[metric])} | ${formatMetric(ai[metric])} | ${formatMetric(deltas[metric])} |`
    )),
  ].join("\n");
}

function renderPlayerGroups(title, referenceGroups, aiGroups) {
  const renderRows = (side, groups) => Object.entries(groups || {}).map(([group, row]) => (
    `| ${side} | ${group} | ${formatMetric(row.playerCount)} | ${formatMetric(row.averageFinalScore)} | ${formatMetric(row.incomeGainWeighted)} | ${formatMetric(row.nonIncomeGainWeighted)} | ${formatMetric(row.mainActionsPerWeightedCost)} | ${formatMetric(row.fullDataCycleCount)} |`
  ));
  return [
    `### ${title}`,
    "",
    "| 样本 | 分组 | 人数 | 平均分 | 收入价值 | 非收入价值 | 单位资源主行动 | 完整数据循环 |",
    "| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |",
    ...renderRows("真人", referenceGroups),
    ...renderRows("电脑", aiGroups),
  ].join("\n");
}

function renderRoundGroups(referenceGroups, aiGroups) {
  const roundIds = [...new Set([
    ...Object.keys(referenceGroups || {}),
    ...Object.keys(aiGroups || {}),
  ])].sort((left, right) => Number(left) - Number(right));
  return [
    "### 按轮次",
    "",
    "| 轮次 | 真人收入价值/人 | 电脑收入价值/人 | 真人非收入价值/人 | 电脑非收入价值/人 | 真人分析/人 | 电脑分析/人 | 真人数据放置/人 | 电脑数据放置/人 |",
    "| ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |",
    ...roundIds.map((roundId) => {
      const reference = referenceGroups?.[roundId] || {};
      const ai = aiGroups?.[roundId] || {};
      return `| ${roundId} | ${formatMetric(reference.incomeGainWeighted)} | ${formatMetric(ai.incomeGainWeighted)} | ${formatMetric(reference.nonIncomeGainWeighted)} | ${formatMetric(ai.nonIncomeGainWeighted)} | ${formatMetric(reference.analysisCount)} | ${formatMetric(ai.analysisCount)} | ${formatMetric(reference.dataPlacementCount)} | ${formatMetric(ai.dataPlacementCount)} |`;
    }),
  ].join("\n");
}

function renderMarkdown(comparison) {
  const sections = [
    "## 真人与电脑资源转化差距",
    "",
    ...(comparison.warnings?.length
      ? ["### 口径告警", "", ...comparison.warnings.map((warning) => `- ${warning}`), ""]
      : []),
    `差值方向固定为真人减电脑。真人样本 ${comparison.reference.playerCount} 人，电脑样本 ${comparison.ai.playerCount} 人。`,
    "",
    "### 全体玩家",
    "",
    renderMetricTable(
      comparison.reference.allPlayers,
      comparison.ai.allPlayers,
      comparison.deltas.allPlayers,
    ),
    "",
    "### 高分四分位",
    "",
    renderMetricTable(
      comparison.reference.topQuartile,
      comparison.ai.topQuartile,
      comparison.deltas.topQuartile,
    ),
    "",
    "### 低分四分位",
    "",
    renderMetricTable(
      comparison.reference.bottomQuartile,
      comparison.ai.bottomQuartile,
      comparison.deltas.bottomQuartile,
    ),
    "",
    renderPlayerGroups("按公司", comparison.reference.byIndustry, comparison.ai.byIndustry),
    "",
    renderPlayerGroups("按外星人", comparison.reference.byAlien, comparison.ai.byAlien),
    "",
    renderRoundGroups(comparison.reference.byRound, comparison.ai.byRound),
    "",
    "### 证据结论",
    "",
    ...(comparison.evidence.length
      ? comparison.evidence.map((item) => `- ${item}`)
      : ["- 当前样本未形成明确的资源转化方向，需扩大固定种子样本。"]),
    "",
    "### 优先检查的转化差距",
    "",
    ...comparison.largestGaps.slice(0, 10).map((gap) => (
      `- ${gap.group} / ${gap.label}：${formatMetric(gap.delta)}（真人-电脑）`
    )),
  ];
  return `${sections.join("\n")}\n`;
}

function parseArgs(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) continue;
    const [key, inlineValue] = arg.slice(2).split("=");
    const value = inlineValue == null ? argv[++index] : inlineValue;
    if (!["reference", "ai", "out", "markdown"].includes(key)) {
      throw new Error(`Unknown option --${key}`);
    }
    options[key] = value;
  }
  return options;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(path.resolve(filePath), "utf8"));
}

function writeFile(filePath, content) {
  if (!filePath) return;
  const resolved = path.resolve(filePath);
  fs.mkdirSync(path.dirname(resolved), { recursive: true });
  fs.writeFileSync(resolved, content);
}

function main(argv = process.argv.slice(2)) {
  const options = parseArgs(argv);
  if (!options.reference || !options.ai) {
    throw new Error("--reference and --ai are required");
  }
  const comparison = compareResourceFlowReports(
    readJson(options.reference),
    readJson(options.ai),
  );
  for (const warning of comparison.warnings || []) {
    process.stderr.write(`WARNING: ${warning}\n`);
  }
  writeFile(options.out, `${JSON.stringify(comparison, null, 2)}\n`);
  writeFile(options.markdown, renderMarkdown(comparison));
  process.stdout.write(`${JSON.stringify({
    referencePlayers: comparison.reference.playerCount,
    aiPlayers: comparison.ai.playerCount,
    largestGap: comparison.largestGaps[0] || null,
    evidence: comparison.evidence,
  }, null, 2)}\n`);
  return comparison;
}

module.exports = {
  compareResourceFlowReports,
  renderMarkdown,
  summarizePlayers,
};

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(error?.stack || error?.message || String(error));
    process.exitCode = 1;
  }
}
