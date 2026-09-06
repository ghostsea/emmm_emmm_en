const assert = require("node:assert/strict");
const {
  parseReferenceActionLog,
  analyzeReferenceDocuments,
  normalizeReferenceStep,
} = require("./analyze_reference_action_logs");

const markdown = `# SETI 行动日志

## 终局分数
| 玩家 | 总分 |
| --- | ---: |
| 白色 | 300 |

## 路线摘要
| 玩家 | 主要行动路线 | 主要行动数 | 快速步骤数 | PASS 轮次 |
| --- | --- | ---: | ---: | --- |
| 白色 | 科技行动 -> 分析数据 | 3 | 4 | R1 |

## 完整行动流水

### #1 初始选择 - 白色 - 初始选择
- [setup] 选择公司：宇宙战略集团
- [setup] 结算初始效果：获得 4信用点、2能量；资源：信用点+4、能量+2

### #2 第1轮 第1回合 - 白色 - 科技行动
- [main] 选择科技：blue1
- [quick] 放置数据：蓝色奖励槽：+1 信用点；资源：信用点+1
- [quick] 放置数据：资源：宣传+1

### #3 第1轮 第2回合 - 白色 - 分析数据
- [main] 分析数据：资源：能量-1
- [main] 回合结束揭示外星人：半人马已揭示
`;

const game = parseReferenceActionLog(markdown, { gameId: "human-1", fileName: "sample.md" });
assert.equal(game.playerResults[0].finalScore, 300);
assert.equal(game.routeSummary["白色"].mainActionCount, 3);
assert.equal(game.productiveMainActionCounts["白色"], 2, "do not copy old route summary totals");
assert.equal(game.productiveMainActions.length, 2);
{
  const namedPlanetActions = parseReferenceActionLog(markdown + `
### #4 第3轮 第10回合 - 白色 - 环绕冥王星
- [quick] 卡牌快速行动：弃牌换1移动
- [main] 环绕冥王星
- [main] 冥王星环绕：11分+3宣传
### #5 第4轮 第6回合 - 白色 - 登陆冥王星
- [main] 登陆冥王星
- [main] 冥王星登陆：11分
### #6 第4轮 第7回合 - 白色 - 打牌行动
- [main] 打出：免费环绕测试牌
- [main] 环绕冥王星
`);
  assert.equal(namedPlanetActions.productiveMainActionCounts["白色"], 5,
    "Named Pluto actions count once each; a card-granted orbit remains part of the card action");
  assert.deepEqual(namedPlanetActions.productiveMainActions.map(action => action.entryId), [2, 3, 4, 5, 6]);
  assert.equal(namedPlanetActions.accounting.uncertainPlutoCostCount, 2,
    "Legacy titles prove actions, but cannot invent missing orbit/landing payments");
  assert.equal(namedPlanetActions.accounting.uncertainPlutoCostByPlayer["白色"], 2);
}
assert.equal(game.accounting.inferredResearchCostCount, 1);
assert.equal(game.accounting.inferredAnalyzeCostCount, 0);
{
  const omittedAnalysisPayment = markdown.replace("分析数据：资源：能量-1", "分析数据");
  const ordinary = parseReferenceActionLog(omittedAnalysisPayment);
  assert.equal(ordinary.accounting.inferredAnalyzeCostCount, 1);
  assert.equal(ordinary.events.find((event) => event.syntheticAnalyzeCost).resourceDeltas.energy, -1);
  const deepspace = parseReferenceActionLog(omittedAnalysisPayment.replace("选择公司：宇宙战略集团", "选择公司：深空探测"));
  assert.equal(deepspace.accounting.inferredAnalyzeCostCount, 0, "Deepspace analyzes without energy");
}
assert.equal(game.events.find((event) => event.syntheticResearchCost).resourceDeltas.publicity, -6);
assert.equal(game.events.findIndex((event) => event.syntheticResearchCost)
  < game.events.findIndex((event) => event.sourceCategory === "tech_bonus_blue1"), true,
"charge research before subsequent data rewards for the reinvestment ledger");

{
  const withNonActions = parseReferenceActionLog(markdown + `
### #4 第1轮 第3回合 - 白色 - PASS
- [main] PASS
### #5 第2轮 第1回合 - 白色 - 轮开始
- [main] 轮开始：能量+3
### #6 第2轮 第1回合 - 白色 - 本回合行动
- [main] 开普勒22赢家奖励：白色 +3分
`);
  assert.equal(withNonActions.productiveMainActionCounts["白色"], 2);
  const explicit = parseReferenceActionLog(markdown.replace("- [main] 选择科技：blue1",
    "- [main] 科技支付：宣传-6\n- [main] 选择科技：blue1"));
  assert.equal(explicit.accounting.inferredResearchCostCount, 0, "do not double count explicit payment");
  const alienLab = parseReferenceActionLog(markdown.replace("选择公司：宇宙战略集团", "选择公司：异星实验室"));
  assert.equal(alienLab.accounting.inferredResearchCostCount, 0);
  assert.equal(alienLab.accounting.uncertainResearchCostCount, 1, "do not invent missing panel state");
}
assert.equal(
  game.events.find((event) => event.sourceDetail === "默认初始手牌").resourceDeltas.handSize,
  4,
);
assert.equal(game.playerMetadata["白色"].industryId, "宇宙战略集团");
assert.deepEqual(game.revealedAliens, ["半人马"]);
assert.equal(
  game.events.find((event) => event.sourceCategory === "tech_bonus_blue1").resourceDeltas.credits,
  1,
);
assert.equal(
  game.events.find((event) => event.sourceCategory === "tech_bonus_blue1").resourceDeltas.availableData,
  -1,
);
assert.equal(game.events.filter((event) => event.isDataPlacement).length, 2);
assert.equal(
  game.events.find((event) => event.sourceDetail.startsWith("分析数据：")).resourceDeltas.availableData,
  undefined,
);

const crossOwner = parseReferenceActionLog(markdown.replace(
  "放置数据：蓝色奖励槽：+1 信用点；资源：信用点+1",
  "方舟奖励：棕色 信用点+1",
), { gameId: "human-cross", fileName: "cross.md" });
assert.equal(
  crossOwner.events.find((event) => event.resourceDeltas.credits === 1).playerLabel,
  "棕色",
);

const deduped = analyzeReferenceDocuments([
  { fileName: "a.md", markdown },
  { fileName: "copy.md", markdown },
], { minCoverage: 0.98 });
assert.equal(deduped.games.length, 1);
assert.deepEqual(deduped.duplicateFiles, [{ duplicate: "copy.md", original: "a.md" }]);
assert.equal(deduped.summary.coverage.weighted, 1);
assert.equal(deduped.summary.players[0].endingInventory.availableData, null);
assert.equal(deduped.summary.players[0].utilizationRate.availableData, null);

const twoPlayerMarkdown = markdown
  .replace("| 白色 | 300 |", "| 白色 | 300 |\n| 棕色 | 200 |")
  .replace(
    "| 白色 | 科技行动 -> 分析数据 | 3 | 4 | R1 |",
    "| 白色 | 科技行动 -> 分析数据 | 3 | 4 | R1 |\n| 棕色 | 扫描行动 | 2 | 2 | R1 |",
  )
  .concat(`

### #4 初始选择 - 棕色 - 初始选择
- [setup] 选择公司：寰宇超动力
- [setup] 结算初始效果：获得 3信用点、3能量；资源：信用点+3、能量+3
`);
const cohortResult = analyzeReferenceDocuments([
  { fileName: "cohort.md", markdown: twoPlayerMarkdown },
]);
assert.equal(cohortResult.humanPlayerLabel, "白色");
assert.deepEqual(cohortResult.humanSummary.players.map((player) => player.playerLabel), ["白色"]);
assert.deepEqual(cohortResult.opponentSummary.players.map((player) => player.playerLabel), ["棕色"]);
assert.equal(
  cohortResult.humanSummary.players.length + cohortResult.opponentSummary.players.length,
  cohortResult.summary.players.length,
);

const customHumanResult = analyzeReferenceDocuments([
  { fileName: "cohort.md", markdown: twoPlayerMarkdown },
], { humanPlayerLabel: "棕色" });
assert.equal(customHumanResult.humanPlayerLabel, "棕色");
assert.deepEqual(customHumanResult.humanSummary.players.map((player) => player.playerLabel), ["棕色"]);
assert.deepEqual(customHumanResult.opponentSummary.players.map((player) => player.playerLabel), ["白色"]);

assert.throws(() => analyzeReferenceDocuments([{
  fileName: "bad.md",
  markdown: markdown
    .replace(" - 白色 - 科技行动", " - 白色 - 本回合行动")
    .replace("放置数据：蓝色奖励槽：+1 信用点", "没有可识别来源：信用点+1"),
}], { minCoverage: 1 }), /coverage/i);

const realSyntaxCases = [
  {
    text: "盲抽 1/2 张；资源：手牌+1",
    context: { actionLabel: "打牌行动" },
    deltas: { handSize: 1 },
    source: "card",
  },
  {
    text: "放置数据：资源：能量+1、手牌-1；收入：能量+1",
    context: { pace: "quick" },
    deltas: { energy: 1, handSize: -1 },
    source: "data_placement",
  },
  {
    text: "获得 1 个数据：白色获得 0/1 个数据",
    context: { actionLabel: "打牌行动" },
    deltas: { availableData: 0 },
    source: "card",
  },
  {
    text: "符文族2：环绕或登陆，符文3奖励 符文3(黑圈6)：1/2数据",
    context: { actionLabel: "打牌行动" },
    deltas: { availableData: 1 },
    source: "alien",
  },
  {
    text: "半人马6：1数据：白色获得 1/1 个数据",
    context: { actionLabel: "打牌行动" },
    deltas: { availableData: 1 },
    source: "alien",
  },
  {
    text: "盲抽 2/2 张；资源：手牌+2",
    context: { actionLabel: "打牌行动" },
    deltas: { handSize: 2 },
    source: "card",
  },
  {
    text: "宇宙战略集团：蓝色奖励槽：+1 数据",
    context: { actionLabel: "打牌行动" },
    deltas: { availableData: 1 },
    source: "industry",
  },
  {
    text: "方舟奖励 5：4能量：白色 能量+4",
    context: { actionLabel: "分析数据" },
    deltas: { energy: 4 },
    source: "alien",
  },
  {
    text: "快速交易：2张牌 → 1能量",
    context: { actionLabel: "快速行动" },
    deltas: { handSize: -2, energy: 1 },
    source: "trade_conversion",
  },
  {
    text: "扫描费用：扫描消耗 1信用点 + 2能量",
    context: { actionLabel: "扫描行动" },
    deltas: { credits: -1, energy: -2 },
    source: "cost",
  },
  {
    text: "至少50分：收入：弃掉 方舟粉色痕迹 4，能量+1（已即时获得）",
    context: { actionLabel: "PASS" },
    deltas: { energy: 1, handSize: -1 },
    source: "income_upgrade_immediate",
  },
  {
    text: "0宣传：2分+1宣传：白色 分数+2、宣传+1",
    context: { actionLabel: "PASS", previousSourceCategory: "card" },
    deltas: { score: 2, publicity: 1 },
    source: "card",
  },
  {
    text: "拥有3个紫色科技：1数据：白色获得 1/1 个数据",
    context: { actionLabel: "科技行动" },
    deltas: { availableData: 1 },
    source: "card",
  },
  {
    text: "PASS：弃至 4 张手牌：PASS 手牌上限：弃掉 超环面仪器",
    context: { actionLabel: "PASS" },
    deltas: { handSize: -1 },
    source: "card",
  },
  {
    text: "结算初始效果：白色 宇宙战略集团：初始收入水平 credits+2、energy+1、handSize+1；获得 1宣传、4信用点、2能量；盲抽 行星地质测绘",
    context: { pace: "setup", actionLabel: "初始选择" },
    deltas: { publicity: 1, credits: 4, energy: 2, handSize: 1 },
    source: "setup",
  },
  {
    text: "外星人 2首痕迹奖励：3分、1宣传",
    context: { pace: "setup", actionLabel: "初始选择" },
    deltas: { score: 3, publicity: 1 },
    source: "setup",
  },
  {
    text: "环绕 木星，消耗 1信用点 + 1能量，移除火箭，显示环绕标记#1",
    context: { pace: "main", actionLabel: "环绕行动" },
    deltas: { credits: -1, energy: -1 },
    source: "cost",
  },
  {
    text: "获取精选 1 张牌：获得卡牌：国际合作，公共区已补牌：案尔维会议",
    context: { pace: "main", actionLabel: "科技行动" },
    deltas: { handSize: 1 },
    source: "card",
  },
  {
    text: "卡牌触发：自动分析：获得黄色外星人痕迹，1数据",
    context: { pace: "quick", actionLabel: "打牌行动" },
    deltas: { availableData: 1 },
    source: "card",
  },
  {
    text: "阿米巴0：蓝色区域 symbol 奖励 symbol_2：1/1数据",
    context: { pace: "main", actionLabel: "打牌行动" },
    deltas: { availableData: 1 },
    source: "alien",
  },
];

for (const syntaxCase of realSyntaxCases) {
  const normalized = normalizeReferenceStep(syntaxCase.text, syntaxCase.context);
  assert.deepEqual(normalized.resourceDeltas, syntaxCase.deltas, syntaxCase.text);
  assert.equal(normalized.sourceCategory, syntaxCase.source, syntaxCase.text);
}

assert.deepEqual(
  normalizeReferenceStep(
    realSyntaxCases.find((item) => item.text.startsWith("结算初始效果：")).text,
    realSyntaxCases.find((item) => item.text.startsWith("结算初始效果：")).context,
  ).incomeDeltas,
  { credits: 2, energy: 1, handSize: 1 },
);

const alienGain = normalizeReferenceStep(
  "分析：获得 1 个蓝色外星人痕迹：获得半人马牌：半人马卡牌8；资源：手牌+1",
  { pace: "main", actionLabel: "分析数据" },
);
assert.deepEqual(alienGain.cards, [{
  key: "半人马卡牌8",
  label: "半人马卡牌8",
  change: "gain",
  origin: "alien",
}]);

const passPick = normalizeReferenceStep(
  "PASS 预留精选：PASS 精选：量子数据存储",
  { pace: "main", actionLabel: "PASS" },
);
assert.deepEqual(passPick.resourceDeltas, { handSize: 1 });
assert.equal(passPick.cards[0].label, "量子数据存储");

const industryPick = normalizeReferenceStep(
  "公司行动标记：宇宙战略集团：宇宙战略集团：精选 望远锐现代化；资源：手牌+1",
  { pace: "quick", actionLabel: "打牌行动" },
);
assert.deepEqual(industryPick.cards, [{
  key: "望远锐现代化",
  label: "望远锐现代化",
  change: "gain",
  origin: "industry",
}]);

assert.deepEqual(
  normalizeReferenceStep(
    "至少50分：收入：收入：弃掉 低功耗微处理器，手牌+1（已即时获得）",
    { pace: "quick", actionLabel: "打牌行动" },
  ).resourceDeltas,
  {},
);

for (const text of ["获得卡牌：水熊虫研究", "获得卡牌：宇航员训练体验，公共区已补牌：水熊虫研究"]) {
  assert.equal(normalizeReferenceStep(text, { pace: "quick", actionLabel: "放置数据" }).sourceCategory, "card");
}

console.log("analyze_reference_action_logs.test.js: all tests passed");
