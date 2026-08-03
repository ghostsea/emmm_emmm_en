const assert = require("node:assert/strict");
const flow = require("./resource-flow");

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
  { publicity: 3, credits: 2, energy: 2, availableData: 2 },
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

console.log("resource-flow.test.js: all tests passed");
