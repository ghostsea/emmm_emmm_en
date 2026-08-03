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
assert.equal(
  flow.classifySourceCategory({ text: "没有可识别来源：资源：信用点+1" }),
  "unclassified",
);

console.log("resource-flow.test.js: all tests passed");
