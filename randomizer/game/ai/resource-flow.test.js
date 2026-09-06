const assert = require("node:assert/strict");
const flow = require("./resource-flow");

for (const text of ["获得卡牌：水熊虫研究", "获得卡牌：宇航员训练体验，公共区已补牌：水熊虫研究"]) {
  assert.equal(flow.findAlienIdInLogText(text), null);
  assert.equal(flow.classifySourceCategory({ text }), "card");
}
assert.equal(flow.findAlienIdInLogText("虫族奖励：获得虫3"), "虫");
assert.equal(flow.findAlienIdInLogText("半人马奖励：获得卡牌，公共区已补牌：水熊虫研究"), "半人马");

{
  const solarPanelText = "每个己方太阳系探测器或虫族搬运化石：1能量：2 个探测器，获得 2；资源：能量+2";
  assert.equal(flow.findAlienIdInLogText(solarPanelText), null,
    "an eligible token kind in an ordinary card rule must not invent a revealed alien");
  assert.equal(flow.classifySourceCategory({ text: solarPanelText }), "card");
  assert.equal(flow.findAlienIdInLogText(`虫族奖励；${solarPanelText}`), "虫",
    "keep an independent actual alien source in the same text");
  assert.equal(flow.classifySourceCategory({ text: `虫族奖励；${solarPanelText}` }), "alien");
}

{
  const summarize = (score) => flow.summarizeResourceEvents([
    { gameId: "score-separation", playerId: "p", roundNumber: 1,
      sourceCategory: "setup", resourceDeltas: { credits: 2, score } },
    { gameId: "score-separation", playerId: "p", roundNumber: 1,
      sourceCategory: "card", resourceDeltas: { energy: 2, score } },
    { gameId: "score-separation", playerId: "p", roundNumber: 1,
      sourceCategory: "cost", resourceDeltas: { energy: -1, score: -score } },
  ]);
  const zero = summarize(0);
  const scored = summarize(30);
  assert.equal(scored.resourceWeighting, "spendable-only-v2");
  for (const key of ["setupGainWeighted", "grossGainWeighted", "incomeGainWeighted",
    "nonIncomeGainWeighted", "weightedActionCost"]) {
    assert.equal(scored.players[0][key], zero.players[0][key], key);
  }
  assert.equal(scored.players[0].nonIncomeGain.score, 30, "score remains separately traceable");
  assert.equal(scored.groups.byRound[1].nonIncomeGainWeighted, 6);
  assert.equal(scored.groups.byRound[1].spentWeighted, 3);
}

const analysis = flow.summarizeResourceEvents([
  {
    gameId: "g1", playerId: "p1", playerLabel: "白色", finalScore: 300,
    roundNumber: 0, turnNumber: 0, pace: "setup", sourceCategory: "setup",
    resourceDeltas: { credits: 4, energy: 2, handSize: 2 }, incomeDeltas: {}, confidence: 1,
  },
  {
    gameId: "g1", playerId: "p1", playerLabel: "白色", finalScore: 300,
    roundNumber: 1, turnNumber: 2, pace: "quick", sourceCategory: "income_upgrade_immediate",
    resourceDeltas: { credits: 1, handSize: -1 }, incomeDeltas: { credits: 1 }, confidence: 1,
  },
  {
    gameId: "g1", playerId: "p1", playerLabel: "白色", finalScore: 300,
    roundNumber: 2, turnNumber: 1, pace: "pass", sourceCategory: "pass_income",
    resourceDeltas: { credits: 3, energy: 1 }, incomeDeltas: {}, confidence: 1,
  },
  {
    gameId: "g1", playerId: "p1", playerLabel: "白色", finalScore: 300,
    roundNumber: 2, turnNumber: 3, pace: "quick", sourceCategory: "tech_bonus_blue1",
    resourceDeltas: { credits: 2 }, incomeDeltas: {}, confidence: 1,
  },
  {
    gameId: "g1", playerId: "p1", playerLabel: "白色", finalScore: 300,
    roundNumber: 2, turnNumber: 4, pace: "quick", sourceCategory: "tech_bonus_blue2",
    resourceDeltas: { energy: 2 }, incomeDeltas: {}, confidence: 1,
  },
  {
    gameId: "g1", playerId: "p1", playerLabel: "白色", finalScore: 300,
    roundNumber: 2, turnNumber: 5, pace: "main", sourceCategory: "cost",
    resourceDeltas: { credits: -2, energy: -2 }, incomeDeltas: {}, confidence: 1,
  },
], {
  endingInventories: { p1: { credits: 8, energy: 3, handSize: 1 } },
  productiveMainActionCounts: { p1: 1 },
});

const player = analysis.players[0];
assert.deepEqual(player.setupGain, { score: 0, credits: 4, energy: 2, publicity: 0, availableData: 0, handSize: 2 });
assert.deepEqual(player.incomeGain, { score: 0, credits: 4, energy: 1, publicity: 0, availableData: 0, handSize: 0 });
assert.deepEqual(player.nonIncomeGain, { score: 0, credits: 2, energy: 2, publicity: 0, availableData: 0, handSize: 0 });
assert.deepEqual(player.spent, { score: 0, credits: 2, energy: 2, publicity: 0, availableData: 0, handSize: 1 });
assert.equal(player.blue1CreditGain, 2);
assert.equal(player.blue2EnergyGain, 2);
assert.equal(player.utilizationRate.credits, 0.2);
assert.equal(player.utilizationRate.publicity, null);
assert.equal(player.nonIncomeShare.credits, 1 / 3);
assert.equal(player.incomeGainWeighted, 15);
assert.equal(player.nonIncomeGainWeighted, 12);
assert.equal(player.weightedActionCost, 15);
assert.equal(player.mainActionsPerWeightedCost, 1 / 15);
assert.equal(player.sameRoundReinvestment.credits, 2);
assert.equal(player.sameRoundReinvestment.energy, 2);

const cycleAndCards = flow.summarizeResourceEvents([
  {
    gameId: "g2", playerId: "p2", playerLabel: "蓝色", finalScore: 280,
    roundNumber: 1, turnNumber: 1, pace: "main", sourceCategory: "alien",
    resourceDeltas: { handSize: 1 }, incomeDeltas: {}, confidence: 1,
    cards: [{ key: "alien-card-1", label: "半人马卡牌1", change: "gain", origin: "alien" }],
  },
  {
    gameId: "g2", playerId: "p2", playerLabel: "蓝色", finalScore: 280,
    roundNumber: 1, turnNumber: 2, pace: "main", sourceCategory: "card",
    resourceDeltas: { handSize: -1 }, incomeDeltas: {}, confidence: 1,
    cards: [{ key: "alien-card-1", label: "半人马卡牌1", change: "play", origin: "alien" }],
  },
  { gameId: "g2", playerId: "p2", roundNumber: 1, turnNumber: 3, pace: "main", sourceCategory: "analysis", resourceDeltas: {}, incomeDeltas: {}, confidence: 1 },
  { gameId: "g2", playerId: "p2", roundNumber: 1, turnNumber: 4, pace: "quick", sourceCategory: "data_placement", resourceDeltas: { availableData: -1 }, incomeDeltas: {}, confidence: 1 },
  { gameId: "g2", playerId: "p2", roundNumber: 1, turnNumber: 5, pace: "main", sourceCategory: "analysis", resourceDeltas: {}, incomeDeltas: {}, confidence: 1 },
], { productiveMainActionCounts: { p2: 3 } });
const cyclePlayer = cycleAndCards.players[0];
assert.equal(cyclePlayer.cardUse.gainedInGame, 1);
assert.equal(cyclePlayer.cardUse.playedFromGains, 1);
assert.equal(cyclePlayer.drawToPlayRate, 1);
assert.equal(cyclePlayer.alienCardToPlayRate, 1);
assert.equal(cyclePlayer.dataTurnoverCount, 1);
assert.equal(cyclePlayer.fullDataCycleCount, 1);
assert.equal(cyclePlayer.analysisActionCount, 2);

const repeatedAnalysisEntry = flow.summarizeResourceEvents([
  { gameId: "cycles", playerId: "p", entryId: 65, pace: "main", sourceCategory: "analysis", resourceDeltas: { energy: -1 } },
  { gameId: "cycles", playerId: "p", entryId: 65, pace: "quick", sourceCategory: "data_placement", resourceDeltas: { availableData: -1 } },
  { gameId: "cycles", playerId: "p", entryId: 65, pace: "quick", sourceCategory: "analysis", sourceDetail: "移动" },
  { gameId: "cycles", playerId: "p", entryId: 65, pace: "quick", sourceCategory: "analysis", sourceDetail: "标记终局" },
  { gameId: "cycles", playerId: "p", entryId: 65, pace: "main", sourceCategory: "analysis", sourceDetail: "分析奖励结算" },
  { gameId: "cycles", playerId: "p", entryId: 118, pace: "main", sourceCategory: "analysis", resourceDeltas: { energy: -1 } },
]).players[0];
assert.equal(repeatedAnalysisEntry.analysisActionCount, 2, "one confirmed main entry is one analysis, regardless of its later reward steps");
assert.equal(repeatedAnalysisEntry.dataTurnoverCount, 1, "later steps must not reset the refill window");
assert.equal(repeatedAnalysisEntry.fullDataCycleCount, 1, "only the next distinct analysis completes a cycle");

const revealedAnalysis = flow.summarizeResourceEvents([
  { gameId: "reveal", playerId: "p", entryId: 1, pace: "main", mainActionType: "analyze", sourceCategory: "alien", sourceDetail: "方舟揭示奖励" },
  { gameId: "reveal", playerId: "p", entryId: 1, pace: "quick", sourceCategory: "data_placement" },
  { gameId: "reveal", playerId: "p", entryId: 1, pace: "analyze", sourceCategory: "cost", resourceDeltas: { energy: -1 }, syntheticSnapshotInference: true },
  { gameId: "reveal", playerId: "p", entryId: 2, pace: "main", mainActionType: "analyze", sourceCategory: "alien" },
]).players[0];
assert.equal(revealedAnalysis.analysisActionCount, 2, "confirmed parent action types survive reveal reward text replacing the payment step");
assert.equal(revealedAnalysis.fullDataCycleCount, 1, "recover the analysis boundary before its following placement, not at the later snapshot residual");
const revealEvents = flow.normalizeStructuredActionLog([{
  id: 7, playerId: "p", actionType: "analyze", roundNumber: 1, turnNumber: 1,
  steps: [{ source: "main", text: "方舟奖励：分数+1" }],
}]);
assert.equal(revealEvents[0].mainActionType, "analyze");
const revealReport = flow.summarizeResourceEvents(revealEvents);
assert.equal(revealReport.players[0].analysisActionCount, 1);
assert.equal(revealReport.groups.byRound[1].analysisCount, 1, "round aggregates share the distinct-action definition");
assert.equal(flow.summarizeDataCycles([
  { gameId: "other", playerId: "p", entryId: 3, pace: "analyze", sourceCategory: "alien", sourceDetail: "snapshot hand gain", resourceDeltas: { handSize: 1 } },
]).analysisActionCount, 0, "a different player's analysis can grant this player a card without giving them an analysis action");

const incomeCards = flow.summarizeResourceEvents([
  {
    gameId: "g3", playerId: "p3", playerLabel: "绿色", finalScore: 260,
    roundNumber: 1, turnNumber: 1, pace: "main", sourceCategory: "card",
    resourceDeltas: { handSize: 1 }, incomeDeltas: {}, confidence: 1,
    cards: [{ key: "income-card-1", label: "收益牌", change: "gain", origin: "normal" }],
  },
  {
    gameId: "g3", playerId: "p3", playerLabel: "绿色", finalScore: 260,
    roundNumber: 1, turnNumber: 2, pace: "quick", sourceCategory: "income_upgrade_immediate",
    resourceDeltas: { credits: 1, handSize: -1 }, incomeDeltas: { credits: 1 }, confidence: 1,
    cards: [{ key: "income-card-1", label: "收益牌", change: "income", origin: "normal" }],
  },
]);
assert.equal(incomeCards.players[0].cardUse.incomeFromGains, 1);
assert.equal(incomeCards.players[0].incomeCardConversionRate, 1);

const mixedBlueAndIncome = flow.summarizeResourceEvents([{
  gameId: "g4", playerId: "p4", playerLabel: "棕色", finalScore: 240,
  roundNumber: 2, turnNumber: 2, pace: "quick", sourceCategory: "tech_bonus_blue1",
  resourceDeltas: { credits: 2, handSize: -1 },
  incomeDeltas: { credits: 1 },
  confidence: 1,
}]);
assert.equal(mixedBlueAndIncome.players[0].incomeGain.credits, 1);
assert.equal(mixedBlueAndIncome.players[0].nonIncomeGain.credits, 1);
assert.equal(mixedBlueAndIncome.players[0].blue1CreditGain, 1);
assert.equal(mixedBlueAndIncome.players[0].endingInventory.credits, 2);
assert.equal(mixedBlueAndIncome.players[0].endingInventory.publicity, null);

const conversionDenominator = flow.summarizeResourceEvents([
  ...["a", "b", "unused"].map((key, index) => ({
    gameId: "g5", playerId: "p5", roundNumber: 1, turnNumber: index + 1,
    pace: "quick", sourceCategory: "card", resourceDeltas: { handSize: 1 },
    incomeDeltas: {}, cards: [{ key, label: key, change: "gain", origin: "normal" }],
  })),
  {
    gameId: "g5", playerId: "p5", roundNumber: 1, turnNumber: 4,
    pace: "main", sourceCategory: "card", resourceDeltas: { handSize: -1 },
    incomeDeltas: {}, cards: [{ key: "a", label: "a", change: "play", origin: "normal" }],
  },
  {
    gameId: "g5", playerId: "p5", roundNumber: 1, turnNumber: 5,
    pace: "quick", sourceCategory: "income_upgrade_immediate", resourceDeltas: { handSize: -1 },
    incomeDeltas: {}, cards: [{ key: "b", label: "b", change: "income", origin: "normal" }],
  },
]);
assert.equal(conversionDenominator.players[0].incomeCardConversionRate, 0.5);

assert.deepEqual(
  flow.parseDeltaText("打出：测试牌：资源：信用点-2、手牌-1；收入：信用点+1"),
  {
    resourceDeltas: { credits: -2, handSize: -1 },
    incomeDeltas: { credits: 1 },
    matchedMagnitude: 4,
    duplicateSuppressed: 0,
  },
);
assert.deepEqual(
  flow.parseDeltaText("蓝色奖励槽：+1 信用点；资源：信用点+1"),
  {
    resourceDeltas: { credits: 1 },
    incomeDeltas: {},
    matchedMagnitude: 1,
    duplicateSuppressed: 1,
  },
);
assert.equal(flow.classifySourceCategory({ pace: "setup", text: "选择公司" }), "setup");
assert.equal(flow.classifySourceCategory({ pace: "pass", text: "获得本轮收入" }), "pass_income");
assert.notEqual(flow.classifySourceCategory({ text: "选择科技：blue1" }), "tech_bonus_blue1");
assert.equal(flow.classifySourceCategory({ text: "放置数据：蓝1 +1信用点" }), "tech_bonus_blue1");
assert.equal(flow.classifySourceCategory({ text: "放置数据：蓝2 +1能量" }), "tech_bonus_blue2");
assert.equal(flow.classifySourceCategory({ text: "半人马顶部奖励：外星人牌" }), "alien");
assert.equal(flow.classifySourceCategory({
  actionType: "researchTech",
  text: "获取奖励：3分，首拿 +2分",
}), "tech_bonus_other");
assert.equal(
  flow.classifySourceCategory({ text: "没有可识别来源：资源：信用点+1" }),
  "unclassified",
);

const structuredEntries = [
  {
    id: 1, roundNumber: 1, turnNumber: 1, playerId: "p1", playerLabel: "白色",
    actionType: "playCard", actionLabel: "打牌行动",
    steps: [{
      source: "main",
      text: "打出：测试牌：资源：信用点-1、手牌-1",
      playedCard: { id: "c1", label: "测试牌" },
    }],
    recoverySnapshot: { state: { playerState: { players: [{
      id: "p1",
      resources: { credits: 3, energy: 2, publicity: 0, availableData: 0 },
      hand: [{ id: "c2", label: "剩余牌" }],
      income: {},
    }] } } },
  },
  {
    id: 2, roundNumber: 1, turnNumber: 2, playerId: "p1", playerLabel: "白色",
    actionType: "quick", actionLabel: "快速行动",
    steps: [{ source: "quick", text: "蓝1奖励：资源：信用点+1" }],
    recoverySnapshot: { state: { playerState: { players: [{
      id: "p1",
      resources: { credits: 4, energy: 2, publicity: 0, availableData: 0 },
      hand: [{ id: "c2", label: "剩余牌" }],
      income: {},
    }] } } },
  },
];

const structured = flow.analyzeStructuredActionLog(structuredEntries, {
  gameId: "ai-1",
  initialPlayerStates: {
    p1: {
      resources: { credits: 4, energy: 2 },
      hand: [{ id: "c1" }, { id: "c2" }],
      income: {},
    },
  },
  playerResults: [{ playerId: "p1", playerLabel: "白色", finalScore: 250 }],
});
assert.equal(structured.reconciliation.residualMagnitude, 0);
assert.equal(structured.players[0].blue1CreditGain, 1);
assert.equal(structured.players[0].cardUse.played, 1);
assert.equal(structured.players[0].mainActionsPerWeightedCost, 1 / 6);
assert.equal(JSON.stringify(structured).includes("recoverySnapshot"), false);

const implicitOwnedBlueRewards = flow.summarizeResourceEvents([
  {
    gameId: "blue-owned", entryId: 1, playerId: "p1", playerLabel: "白色",
    roundNumber: 1, sourceCategory: "tech_bonus_other", sourceDetail: "选择科技：blue1",
    resourceDeltas: {}, incomeDeltas: {}, techIds: ["blue1"], cards: [],
  },
  {
    gameId: "blue-owned", entryId: 2, playerId: "p1", playerLabel: "白色",
    roundNumber: 1, sourceCategory: "data_placement", sourceDetail: "放置数据：资源：信用点+1",
    resourceDeltas: { credits: 1, availableData: -1 }, incomeDeltas: {},
    techIds: [], cards: [], isDataPlacement: true,
  },
  {
    gameId: "blue-owned", entryId: 3, playerId: "p1", playerLabel: "白色",
    roundNumber: 1, sourceCategory: "tech_bonus_other", sourceDetail: "选择科技：blue2",
    resourceDeltas: {}, incomeDeltas: {}, techIds: ["blue2"], cards: [],
  },
  {
    gameId: "blue-owned", entryId: 4, playerId: "p1", playerLabel: "白色",
    roundNumber: 1, sourceCategory: "card", sourceDetail: "放置数据：资源：能量+1",
    resourceDeltas: { energy: 1, availableData: -1 }, incomeDeltas: {},
    techIds: [], cards: [], isDataPlacement: true,
  },
]);
assert.equal(implicitOwnedBlueRewards.players[0].blue1CreditGain, 1);
assert.equal(implicitOwnedBlueRewards.players[0].blue2EnergyGain, 1);

const brokenStructuredEvents = structured.events.map((event) => ({ ...event }));
brokenStructuredEvents[0].resourceDeltas = { credits: 0, handSize: -1 };
assert.equal(flow.reconcileStructuredEvents(structuredEntries, brokenStructuredEvents, {
  initialPlayerStates: {
    p1: {
      resources: { credits: 4, energy: 2 },
      hand: [{ id: "c1" }, { id: "c2" }],
      income: {},
    },
  },
}).residuals[0].resourceDeltas.credits, -1);

const crossOwnerStructured = flow.analyzeStructuredActionLog([{
  id: 3, roundNumber: 1, turnNumber: 3, playerId: "p1", playerLabel: "白色",
  actionType: "quick", actionLabel: "快速行动",
  steps: [{ source: "quick", text: "棕色 信用点+1" }],
  recoverySnapshot: { state: { playerState: { players: [
    {
      id: "p1", color: "white",
      resources: { credits: 4, energy: 2, publicity: 0, availableData: 0 },
      hand: [], income: {},
    },
    {
      id: "p2", color: "brown",
      resources: { credits: 5, energy: 2, publicity: 0, availableData: 0 },
      hand: [], income: {},
    },
  ] } } },
}], {
  gameId: "ai-cross-owner",
  initialPlayerStates: {
    p1: { color: "white", resources: { credits: 4, energy: 2 }, hand: [], income: {} },
    p2: { color: "brown", resources: { credits: 4, energy: 2 }, hand: [], income: {} },
  },
});
assert.equal(crossOwnerStructured.reconciliation.residualMagnitude, 0);
assert.equal(crossOwnerStructured.events[0].playerId, "p2");
assert.equal(
  crossOwnerStructured.players.find((candidate) => candidate.playerId === "p2").nonIncomeGain.credits,
  1,
);

const coloredSlotOwner = flow.analyzeStructuredActionLog([{
  id: 31, roundNumber: 1, turnNumber: 3, playerId: "p1", playerLabel: "白色",
  actionType: "quick", actionLabel: "公司奖励",
  steps: [{ source: "quick", text: "宇宙战略集团：蓝色奖励槽：+1 数据" }],
  recoverySnapshot: { state: { playerState: { players: [
    { id: "p1", color: "white", resources: { availableData: 1 }, hand: [], income: {} },
    { id: "p2", color: "blue", resources: { availableData: 0 }, hand: [], income: {} },
  ] } } },
}], {
  gameId: "ai-colored-slot-owner",
  initialPlayerStates: {
    p1: { color: "white", resources: { availableData: 0 }, hand: [], income: {} },
    p2: { color: "blue", resources: { availableData: 0 }, hand: [], income: {} },
  },
});
assert.equal(coloredSlotOwner.reconciliation.residualMagnitude, 0);
assert.equal(coloredSlotOwner.events[0].playerId, "p1");

const setupStructuredEntries = [
  {
    id: 4, roundNumber: 0, turnNumber: 0, playerId: "p1", playerLabel: "白色",
    actionType: "setup", actionLabel: "开局设置",
    steps: [{ source: "setup", text: "发放默认初始手牌" }],
    recoverySnapshot: { state: { playerState: { players: [{
      id: "p1", color: "white", resources: { credits: 4, energy: 2 },
      hand: [{ id: "a" }, { id: "b" }, { id: "c" }, { id: "d" }], income: {},
    }] } } },
  },
  {
    id: 5, roundNumber: 0, turnNumber: 0, playerId: "p1", playerLabel: "白色",
    actionType: "setup", actionLabel: "开局设置",
    steps: [{ source: "setup", text: "未记录的额外开局牌" }],
    recoverySnapshot: { state: { playerState: { players: [{
      id: "p1", color: "white", resources: { credits: 4, energy: 2 },
      hand: [{ id: "a" }, { id: "b" }, { id: "c" }, { id: "d" }, { id: "e" }], income: {},
    }] } } },
  },
];
const setupStructured = flow.analyzeStructuredActionLog(setupStructuredEntries, {
  gameId: "ai-setup",
  initialPlayerStates: {
    p1: { color: "white", resources: { credits: 4, energy: 2 }, hand: [], income: {} },
  },
});
assert.equal(setupStructured.players[0].setupGain.handSize, 5);
assert.equal(setupStructured.reconciliation.residualMagnitude, 0);
assert.equal(JSON.stringify(setupStructured).includes("recoverySnapshot"), false);

const structuredNaturalLanguage = flow.normalizeStructuredActionLog([{
  id: 6, roundNumber: 1, turnNumber: 1, playerId: "p1", playerLabel: "白色",
  actionType: "scan", actionLabel: "扫描行动",
  steps: [
    { source: "main", text: "扫描费用：扫描消耗 1信用点 + 2能量" },
    { source: "main", text: "获取3分：获取奖励：3分，首拿 +2分" },
    { source: "quick", text: "放置数据：资源：能量+1、手牌-1；收入：能量+1" },
    { source: "pass", text: "PASS 收入：信用点+4、能量+2、手牌+1、数据+1" },
    { source: "main", text: "首次环绕：额外获得 3分：白色 分数+3" },
    { source: "quick", text: "获得 1宣传：白色 宣传+1" },
    { source: "quick", text: "卡牌快速行动：弃牌换1宣传：资源：手牌-1" },
    { source: "quick", text: "获得 1 次收入：收入：弃掉 测试牌，信用点+1（已即时获得）" },
  ],
}], { gameId: "ai-natural-language" });
assert.deepEqual(structuredNaturalLanguage[0].resourceDeltas, { credits: -1, energy: -2 });
assert.deepEqual(structuredNaturalLanguage[1].resourceDeltas, { score: 5 });
assert.deepEqual(
  structuredNaturalLanguage[2].resourceDeltas,
  { energy: 1, handSize: -1, availableData: -1 },
);
assert.deepEqual(structuredNaturalLanguage[2].incomeDeltas, { energy: 1 });
assert.deepEqual(
  structuredNaturalLanguage[3].resourceDeltas,
  { credits: 4, energy: 2, handSize: 1, availableData: 1 },
);
assert.deepEqual(structuredNaturalLanguage[3].incomeDeltas, {});
assert.deepEqual(structuredNaturalLanguage[4].resourceDeltas, { score: 3 });
assert.deepEqual(structuredNaturalLanguage[5].resourceDeltas, { publicity: 1 });
assert.deepEqual(structuredNaturalLanguage[6].resourceDeltas, { handSize: -1, publicity: 1 });
assert.deepEqual(structuredNaturalLanguage[7].resourceDeltas, { credits: 1, handSize: -1 });
assert.deepEqual(structuredNaturalLanguage[7].incomeDeltas, { credits: 1 });

const structuredSetupIncome = flow.normalizeStructuredActionLog([{
  id: 61, roundNumber: 1, turnNumber: 1, playerId: "p1", playerLabel: "白色",
  actionType: "setup", actionLabel: "开局设置",
  steps: [{
    source: "setup",
    text: "结算初始效果：白色 测试公司：初始收入水平 credits+3、energy+1、handSize+1；获得 3宣传、2信用点、2能量；收入 +1数据；扫描两次：获得数据；获得数据",
  }],
}], { gameId: "ai-setup-income" });
assert.deepEqual(
  structuredSetupIncome[0].resourceDeltas,
  { publicity: 3, credits: 2, energy: 2, availableData: 3 },
);
assert.deepEqual(
  structuredSetupIncome[0].incomeDeltas,
  { credits: 3, energy: 1, handSize: 1, availableData: 1 },
);
assert.equal(flow.classifySourceCategory({
  pace: "setup",
  text: "作弊实验室：第2轮开始：获得 1能量；盲抽 1/1 张",
}), "industry");

const crossOwnerCardGain = flow.analyzeStructuredActionLog([{
  id: 7, roundNumber: 1, turnNumber: 4, playerId: "p2", playerLabel: "棕色",
  actionType: "alienReveal", actionLabel: "揭示外星人",
  steps: [{ source: "main", text: "虫族揭示发牌：蓝色+1，棕色+1" }],
  recoverySnapshot: { state: { playerState: { players: [
    { id: "p1", color: "blue", resources: {}, hand: [{ id: "alien-blue" }], income: {} },
    { id: "p2", color: "brown", resources: {}, hand: [{ id: "alien-brown" }], income: {} },
  ] } } },
}], {
  gameId: "ai-alien-cross-owner",
  initialPlayerStates: {
    p1: { color: "blue", resources: {}, hand: [], income: {} },
    p2: { color: "brown", resources: {}, hand: [], income: {} },
  },
});
assert.equal(crossOwnerCardGain.reconciliation.residualMagnitude, 0);
for (const playerId of ["p1", "p2"]) {
  const playerFlow = crossOwnerCardGain.players.find((candidate) => candidate.playerId === playerId);
  assert.equal(playerFlow.cardUse.gainedInGame, 1);
  assert.equal(playerFlow.cardUse.alienGainedInGame, 1);
}

const structuredResearchCost = flow.analyzeStructuredActionLog([{
  id: 8, roundNumber: 1, turnNumber: 5, playerId: "p1", playerLabel: "白色",
  actionType: "researchTech", actionLabel: "科技行动",
  steps: [
    { source: "main", text: "科技行动：请选择要研究的科技板块" },
    { source: "main", text: "选择科技：orange4" },
    { source: "main", text: "获得科技片：orange4：获得科技：orange4" },
  ],
  recoverySnapshot: { state: { playerState: { players: [{
    id: "p1", color: "white", resources: { publicity: 1 }, hand: [], income: {},
  }] } } },
}], {
  gameId: "ai-research-cost",
  initialPlayerStates: {
    p1: { color: "white", resources: { publicity: 7 }, hand: [], income: {} },
  },
});
assert.equal(structuredResearchCost.reconciliation.residualMagnitude, 0);
assert.equal(structuredResearchCost.players[0].spent.publicity, 6);
assert.equal(
  structuredResearchCost.events.find((event) => event.syntheticResearchCost).sourceCategory,
  "cost",
);

const structuredMoveInference = flow.analyzeStructuredActionLog([{
  id: 9, roundNumber: 1, turnNumber: 6, playerId: "p1", playerLabel: "白色",
  actionType: "move", actionLabel: "移动",
  steps: [{ source: "main", text: "移动到金星" }],
  recoverySnapshot: { state: { playerState: { players: [{
    id: "p1", color: "white", resources: { energy: 1, publicity: 1 }, hand: [], income: {},
  }] } } },
}], {
  gameId: "ai-move-inference",
  initialPlayerStates: {
    p1: { color: "white", resources: { energy: 2, publicity: 0 }, hand: [], income: {} },
  },
});
assert.equal(structuredMoveInference.reconciliation.residualMagnitude, 0);
assert.equal(structuredMoveInference.players[0].spent.energy, 1);
assert.equal(structuredMoveInference.players[0].nonIncomeGain.publicity, 1);
assert.equal(structuredMoveInference.reconciliation.inferredMagnitude, 2);

const gainedIncomeCard = flow.analyzeStructuredActionLog([
  {
    id: 10, roundNumber: 1, turnNumber: 7, playerId: "p1", playerLabel: "白色",
    actionType: "analyze", actionLabel: "分析数据",
    steps: [{
      source: "main",
      text: "分析：获得虫族牌：收益牌；资源：手牌+1",
    }],
    recoverySnapshot: { state: { playerState: { players: [{
      id: "p1", color: "white", resources: { credits: 0 },
      hand: [{ id: "alien-income-card", label: "收益牌" }], income: {},
    }] } } },
  },
  {
    id: 11, roundNumber: 1, turnNumber: 8, playerId: "p1", playerLabel: "白色",
    actionType: "quick", actionLabel: "收益牌",
    steps: [{
      source: "quick",
      text: "获得 1 次收入：收入：弃掉 收益牌，信用点+1（已即时获得）",
    }],
    recoverySnapshot: { state: { playerState: { players: [{
      id: "p1", color: "white", resources: { credits: 1 }, hand: [], income: { credits: 1 },
    }] } } },
  },
], {
  gameId: "ai-income-card-identity",
  initialPlayerStates: {
    p1: { color: "white", resources: { credits: 0 }, hand: [], income: {} },
  },
});
assert.equal(gainedIncomeCard.reconciliation.residualMagnitude, 0);
assert.equal(gainedIncomeCard.players[0].cardUse.gainedInGame, 1);
assert.equal(gainedIncomeCard.players[0].cardUse.income, 1);
assert.equal(gainedIncomeCard.players[0].cardUse.incomeFromGains, 1);
assert.equal(gainedIncomeCard.players[0].incomeCardConversionRate, 1);

{
  const before = { id: "p1", color: "white", resources: { credits: 2 },
    income: {}, hand: [{ id: "a" }, { id: "b" }] };
  const after = { ...before, resources: { credits: 3 },
    income: { credits: 1, handSize: 1 }, hand: [{ id: "c" }] };
  const entries = [{ id: 1, roundNumber: 1, playerId: "p1", actionType: "initialSelection",
    steps: [{ source: "setup", text: "结算初始效果：白色 获得 2信用点" }],
    accountingSnapshot: { players: [before] },
  }, { id: 2, roundNumber: 1, playerId: "p1", actionType: "initialIncome",
    steps: [
      { source: "setup", text: "白色 初始收入增加：收入：弃掉 a，手牌+1（已即时获得）" },
      { source: "setup", text: "白色 初始收入增加：收入：弃掉 b，信用点+1（已即时获得）" },
    ], recoverySnapshot: { state: { playerState: { players: [after] } } },
  }];
  const result = flow.analyzeStructuredActionLog(entries, {
    initialPlayerStates: { p1: { ...before, resources: {}, hand: [] } },
  });
  const row = result.players[0];
  assert.equal(row.setupGain.credits, 2);
  assert.equal(row.incomeGain.credits, 1);
  assert.equal(row.incomeGain.handSize, 1, "drawing while discarding is a real gross gain");
  assert.equal(row.spent.handSize, 2, "both income cards were consumed despite a replacement draw");
  assert.equal(row.cardUse.gainedInGame, 0, "cards drawn during initial income remain opening cards");
  assert.deepEqual(row.balanceResiduals, {});
  assert.equal(result.reconciliation.residualMagnitude, 0);
  assert.equal(row.mainActionsPerWeightedCost, 0, "setup income is not a productive main action");
  const truncated = flow.analyzeStructuredActionLog(entries.slice(0, 1), {
    initialPlayerStates: { p1: { ...before, resources: {}, hand: [] } },
    endingInventories: { p1: { credits: 3, handSize: 2 } },
  });
  assert.equal(truncated.players[0].balanceResiduals.credits, -1);
  assert.equal(truncated.players[0].utilizationRate.credits, null,
    "a missing opening reward must not produce a purportedly reconciled utilization rate");
  const roundStart = flow.analyzeStructuredActionLog([{
    id: 3, roundNumber: 2, playerId: "p1", actionType: "setup",
    steps: [{ source: "setup", text: "寰宇超动力：第2轮开始：获得 1能量" }],
    accountingSnapshot: { players: [{ ...after, resources: { credits: 3, energy: 2 } }] },
  }], { initialPlayerStates: { p1: after } });
  assert.equal(roundStart.players[0].nonIncomeGain.energy, 2,
    "round-start setup steps participate in resource snapshot reconciliation");
}

{
  const result = flow.analyzeStructuredActionLog([{
    id: 12, roundNumber: 1, turnNumber: 2, playerId: "green", actionType: "analyze",
    steps: [
      { source: "main", playerId: "green", text: "分析数据：绿色 能量-1" },
      { source: "main", playerId: "white", text: "方舟奖励：已抽 1 张" },
      { source: "main", playerId: "white", text: "方舟奖励：信用点+1" },
    ],
  }], { initialPlayerStates: [
    { id: "green", color: "green", resources: { energy: 1 } },
    { id: "white", color: "white", resources: {} },
  ] });
  const green = result.players.find(p => p.playerId === "green");
  const white = result.players.find(p => p.playerId === "white");
  assert.equal(green.analysisActionCount, 1);
  assert.equal(white.analysisActionCount, 0, "receiving an unlabeled reveal reward is not analyzing");
  assert.equal(white.nonIncomeGain.credits, 1);
  assert.equal(green.nonIncomeGain.credits || 0, 0);
  assert.equal(result.events.find(e => e.sourceDetail.includes("已抽")).playerId, "white");
}

{
  const result = flow.analyzeStructuredActionLog([{
    id: 1, roundNumber: 1, playerId: "p1", actionType: "analyze",
    steps: [{ source: "main", text: "方舟奖励 3：额外弃牌扫描 +1：公共弃牌扫描 +1" },
      { source: "main", text: "从弃牌堆获取奖励" }],
  }], { initialPlayerStates: [{ id: "p1", color: "white", resources: {} }] });
  assert.ok(result.events.every(e => e.cards.length === 0), "discard scan and discard pile labels are not a discarded hand card");
}

{
  const initial = { id: "p1", color: "blue", resources: { credits: 3, handSize: 1, publicity: 10 }, hand: [{ id: "played", label: "康奈尔大学" }] };
  const after = { ...initial, resources: { credits: 2, handSize: 1, publicity: 7 }, hand: [{ id: "gained", label: "延期发射" }] };
  const report = flow.analyzeStructuredActionLog([{
    id: 168, roundNumber: 4, turnNumber: 8, playerId: "p1", actionType: "playCard",
    steps: [
      { source: "quick", text: "快速交易：3宣传 → 精选1张牌：快速交易精选：延期发射，公共区已补牌：重组" },
      { source: "main", text: "打出：康奈尔大学：资源：信用点-1、手牌-1" },
    ], accountingSnapshot: { players: [after] },
  }], { initialPlayerStates: [initial] });
  const payment = report.events.find(e => e.sourceDetail.startsWith("打出"));
  const refill = report.events.find(e => e.sourceDetail.includes("快速交易精选"));
  assert.equal(payment.resourceDeltas.handSize, -1, "later card payment must retain its real hand cost");
  assert.equal(refill.resourceDeltas.handSize, 1, "snapshot refill belongs to the unique preceding trade pickup");
  assert.equal(refill.cards.find(c => c.change === "gain")?.key, "gained");
  assert.equal(report.players[0].nonIncomeGain.handSize, 1);
  assert.equal(report.players[0].spent.handSize, 1);
  assert.equal(report.reconciliation.residualMagnitude, 0);
}

{
  for (const text of ["追加蓝色扫描计数；不获得数据", "未获得数据", "无法获得数据", "未能获得数据", "不能获得数据", "不会获得数据", "不再获得数据"]) {
    const report = flow.analyzeStructuredActionLog([{ id: 1, roundNumber: 4, playerId: "p", actionType: "playCard", steps: [{ source: "main", text }] }], { initialPlayerStates: [{ id: "p", resources: {} }] });
    assert.equal(report.players[0].nonIncomeGain.availableData, 0, text);
  }
  const initial = { id: "p", resources: { availableData: 0 } };
  const report = flow.analyzeStructuredActionLog([{
    id: 174, roundNumber: 4, playerId: "p", actionType: "playCard",
    steps: [
      { source: "main", text: "开普勒22 槽位5 替换为蓝色token；获得数据；资源：数据+1" },
      { source: "main", text: "开普勒22 已无未替换数据，追加蓝色扫描计数；不获得数据" },
      { source: "main", text: "开普勒22 已无未替换数据，追加蓝色扫描计数；不获得数据" },
    ], accountingSnapshot: { players: [{ ...initial, resources: { availableData: 1 } }] },
  }], { initialPlayerStates: [initial] });
  assert.equal(report.players[0].nonIncomeGain.availableData, 1);
  assert.equal(report.players[0].spent.availableData, 0, "no phantom snapshot-balancing data cost");
  assert.equal(report.reconciliation.residualMagnitude, 0);
  const mixed = flow.analyzeStructuredActionLog([{ id: 1, playerId: "p", steps: [{ text: "第一次不获得数据；第二次获得数据" }] }], { initialPlayerStates: [initial] });
  assert.equal(mixed.players[0].nonIncomeGain.availableData, 1);
}

console.log("resource-flow.test.js: all tests passed");

{
 const card={id:"fangzhou-card2-p1-yellow-2",label:"方舟黄色痕迹 2"};
 const initial={id:"p1",resources:{handSize:0},hand:[]};
 const make=(discard)=>flow.analyzeStructuredActionLog([{id:1,roundNumber:2,playerId:"p1",actionType:"analyze",steps:[
  {source:"main",text:"解锁方舟黄色痕迹牌；资源：手牌+1",fangzhouCardChanges:[{...card,change:"gain"}]},
  ...(discard?[{source:"quick",text:"卡牌快速行动：方舟基础奖励：资源：手牌-1",fangzhouCardChanges:[{...card,change:"remove"}]}]:[]),
 ],accountingSnapshot:{players:[discard?initial:{...initial,resources:{handSize:1},hand:[card]}]}}],{initialPlayerStates:[initial]});
 for(const discard of [true,false]){const r=make(discard);assert.equal(r.players[0].cardUse.alienGainedInGame,1,"explicit identity must survive a zero-net hand entry and avoid snapshot double count");assert.equal(r.players[0].nonIncomeGain.handSize,1);assert.equal(r.players[0].spent.handSize,discard?1:0);assert.equal(r.reconciliation.residualMagnitude,0);assert.equal(r.events.flatMap(e=>e.cards).filter(c=>c.change==="gain"&&c.key===card.id).length,1);}
}
