# AI Resource Flow Baseline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build one tested resource-flow ledger for human Markdown logs and AI recoverable action logs, wire its compact summaries into autobattle, and record a fresh eight-game `0f70ef32` behavior baseline without changing AI choices.

**Architecture:** Add `randomizer/game/ai/resource-flow.js` as a standalone UMD/CommonJS analysis module beside the current AI modules. Structured recoverable entries and the reference Markdown CLI normalize into the same event schema, then share one aggregator; the AI controller receives action-log entries through an injected callback and retains only compact summaries. Separate Node CLIs analyze the reference directory and compare its player quartiles with autobattle JSON.

**Tech Stack:** Browser-native JavaScript, Node.js CommonJS, built-in `assert`, `fs`, `path`, and `crypto`; no package manager and no build step.

## Global Constraints

- The behavior baseline is current `master` commit `0f70ef32`; instrumentation commits must not change action scores, candidate order, setup rewards, random calls, or AI decisions.
- Track `score`, `credits`, `energy`, `publicity`, `availableData`, and `handSize`; use the existing L1 display weights `{ score: 1, credits: 3, energy: 3, publicity: 1, availableData: 1.5, handSize: 3 }` only for analytical comparisons.
- Keep `setup`, `pass_income`, `income_upgrade_immediate`, `tech_bonus_blue1`, `tech_bonus_blue2`, `tech_bonus_other`, `industry`, `alien`, `card`, `data_placement`, `analysis`, `planet_board`, `trade_conversion`, `cost`, `settlement`, and `unclassified` as the complete source-category set.
- Do not infer a source from AI valuation weights. Parse explicit action-log evidence and reconcile structured entries against real recovery snapshots.
- Reference Markdown must reach at least `0.98` weighted resource-delta coverage before its aggregates are used for tuning; structured AI snapshot reconciliation must have zero residual delta.
- Raw baseline and comparison JSON stay under `tmp/` and are not committed. Tests, tools, cache-version changes, and `docs/ai-design.md` updates are committed.
- Use fixed default-difficulty seeds `codex-ai-current-default:1..5` and `codex-ai-resource-gap-alien-card-dev-20260731:fl/fm/fn`; do not run the frozen `h01..h08` holdouts in this plan.
- Follow strict TDD: name the production break, write the failing test, observe the expected failure, implement the minimum behavior, and rerun the targeted and related tests before each commit.
- After every accepted implementation milestone, run `git diff --check`, commit with a Chinese message, fetch/rebase if needed, push `master`, and verify `HEAD == origin/master` with ahead/behind `0 0`.

---

### Task 1: Normalized Resource Event Ledger

**Files:**
- Create: `randomizer/game/ai/resource-flow.js`
- Create: `randomizer/game/ai/resource-flow.test.js`

**Interfaces:**
- Consumes: normalized events with `{ gameId, playerId, playerLabel, finalScore, roundNumber, turnNumber, pace, sourceCategory, sourceDetail, resourceDeltas, incomeDeltas, cards, techIds, alienId, industryId, confidence }`.
- Produces: `parseDeltaText(text)`, `classifySourceCategory(context)`, `summarizeResourceEvents(events, options)`, `summarizeResourceFlowAnalyses(analyses)`, `TRACKED_RESOURCE_KEYS`, `SPENDABLE_RESOURCE_KEYS`, `SOURCE_CATEGORIES`, and `RESOURCE_VALUES`.
- `summarizeResourceEvents(...)` returns `{ coverage, totals, players, groups, unclassifiedSamples }`; every player row contains `grossGain`, `setupGain`, `incomeGain`, `nonIncomeGain`, their `*Weighted` L1 display totals, `spent`, `endingInventory`, `utilizationRate`, `nonIncomeShare`, `weightedActionCost`, `mainActionsPerWeightedCost`, `dataTurnoverCount`, `fullDataCycleCount`, `blue1CreditGain`, `blue2EnergyGain`, `sameRoundReinvestment`, and card-use counters. `groups` contains `byIndustry`, `byAlien`, and `byRound`.
- Card events use `{ key, label, change, origin }`, where `change` is `gain`, `play`, `income`, `discard`, or `move_payment`; `origin` is `setup`, `normal`, `industry`, or `alien`.

- [ ] **Step 1: Write the failing ledger behavior test**

Name the break: if a future edit counts setup as non-income, treats an income increment as PASS income, divides a zero denominator by zero, or merges blue1 and blue2 rewards, the literals below must fail.

```js
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
```

- [ ] **Step 2: Run the new test and verify the module-missing red state**

Run: `node randomizer/game/ai/resource-flow.test.js`

Expected: FAIL with `Cannot find module './resource-flow'`.

- [ ] **Step 3: Implement the UMD module, exact source set, arithmetic helpers, and ledger**

Use the repository's existing module shape and literal formulas:

```js
(function (root, factory) {
  "use strict";
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.SetiAIResourceFlow = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function () {
  "use strict";

  const TRACKED_RESOURCE_KEYS = Object.freeze([
    "score", "credits", "energy", "publicity", "availableData", "handSize",
  ]);
  const SPENDABLE_RESOURCE_KEYS = Object.freeze([
    "credits", "energy", "publicity", "availableData", "handSize",
  ]);
  const SOURCE_CATEGORIES = Object.freeze([
    "setup", "pass_income", "income_upgrade_immediate",
    "tech_bonus_blue1", "tech_bonus_blue2", "tech_bonus_other",
    "industry", "alien", "card", "data_placement", "analysis",
    "planet_board", "trade_conversion", "cost", "settlement", "unclassified",
  ]);
  const RESOURCE_VALUES = Object.freeze({
    score: 1, credits: 3, energy: 3, publicity: 1, availableData: 1.5, handSize: 3,
  });

  function emptyResourceMap() {
    return Object.fromEntries(TRACKED_RESOURCE_KEYS.map((key) => [key, 0]));
  }

  function normalizeResourceMap(source = {}) {
    return Object.fromEntries(TRACKED_RESOURCE_KEYS.map((key) => [key, Number(source?.[key]) || 0]));
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
        sourceTotals: Object.fromEntries(SOURCE_CATEGORIES.map((source) => [source, emptyResourceMap()])),
        events: [],
      });
    }
    return playersByKey.get(key);
  }

  function applyEventToPlayerRow(row, event) {
    row.events.push(event);
    if (event.industryId) row.industryId = event.industryId;
    if (event.alienId) row.alienIds.add(event.alienId);
    for (const resourceKey of TRACKED_RESOURCE_KEYS) {
      const delta = Number(event.resourceDeltas?.[resourceKey]) || 0;
      if (delta > 0) {
        addResourceValue(row.sourceTotals[event.sourceCategory] || row.sourceTotals.unclassified, resourceKey, delta);
        if (event.sourceCategory === "setup") {
          addResourceValue(row.setupGain, resourceKey, delta);
        } else {
          addResourceValue(row.grossGain, resourceKey, delta);
          const incomeSource = event.sourceCategory === "pass_income"
            || event.sourceCategory === "income_upgrade_immediate";
          addResourceValue(incomeSource ? row.incomeGain : row.nonIncomeGain, resourceKey, delta);
        }
      } else if (delta < 0) {
        addResourceValue(row.spent, resourceKey, Math.abs(delta));
      }
    }
  }

  function divideOrNull(numerator, denominator) {
    return denominator > 0 ? numerator / denominator : null;
  }

  function finalizePlayerRow(row, options = {}) {
    const { events, ...compactRow } = row;
    const endingInventory = normalizeResourceMap(options.endingInventories?.[row.playerId]);
    const utilizationRate = emptyResourceMap();
    const nonIncomeShare = emptyResourceMap();
    for (const key of TRACKED_RESOURCE_KEYS) {
      utilizationRate[key] = divideOrNull(row.spent[key], row.setupGain[key] + row.grossGain[key]);
      nonIncomeShare[key] = divideOrNull(row.nonIncomeGain[key], row.incomeGain[key] + row.nonIncomeGain[key]);
    }
    const weightedActionCost = SPENDABLE_RESOURCE_KEYS.reduce(
      (total, key) => total + row.spent[key] * RESOURCE_VALUES[key],
      0,
    );
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
        Number(options.productiveMainActionCounts?.[row.playerId]) || 0,
        weightedActionCost,
      ),
      blue1CreditGain: row.sourceTotals.tech_bonus_blue1.credits,
      blue2EnergyGain: row.sourceTotals.tech_bonus_blue2.energy,
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
    return values.length ? values.reduce((total, value) => total + (Number(value) || 0), 0) / values.length : 0;
  }

  function summarizePlayerRows(players = []) {
    return {
      playerCount: players.length,
      averageFinalScore: average(players.map((player) => player.finalScore)),
      averageWeightedActionCost: average(players.map((player) => player.weightedActionCost)),
      averageMainActionsPerWeightedCost: average(players.map((player) => player.mainActionsPerWeightedCost)),
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
    return Object.fromEntries([...groups].map(([key, rows]) => [key, summarizePlayerRows(rows)]));
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
      const incomeSource = event.sourceCategory === "pass_income"
        || event.sourceCategory === "income_upgrade_immediate";
      if (event.sourceCategory !== "setup") {
        row[incomeSource ? "incomeGainWeighted" : "nonIncomeGainWeighted"] += weightedResourceMap(positive);
      }
      row.spentWeighted += weightedResourceMap(negative);
      if (event.sourceCategory === "tech_bonus_blue1") row.blue1CreditGain += positive.credits;
      if (event.sourceCategory === "tech_bonus_blue2") row.blue2EnergyGain += positive.energy;
      if (event.sourceCategory === "analysis") row.analysisCount += 1;
      if (event.sourceCategory === "data_placement") row.dataPlacementCount += 1;
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
```

Implement `dataTurnoverCount` as an `analysis` followed by at least one later `data_placement` before the player's next analysis or game end. Implement `fullDataCycleCount` as a later analysis that follows such a post-analysis placement; the second legal analysis proves the board reached its requirement again. Track gained cards FIFO by stable key and then label, excluding setup gains from `drawToPlayRate`. Keep `sameRoundReinvestment` FIFO by resource: positive non-income lots are consumed by later same-round negative deltas before older inventory.

- [ ] **Step 4: Add parser and classification assertions to the same test before implementation**

Name the break: the log formatter can emit direct deltas or `资源/收入` groups; parsing either path twice would inflate the ledger.

```js
assert.deepEqual(
  flow.parseDeltaText("打出：测试牌：资源：信用点-2、手牌-1；收入：信用点+1"),
  {
    resourceDeltas: { credits: -2, handSize: -1 },
    incomeDeltas: { credits: 1 },
    matchedMagnitude: 4,
    duplicateSuppressed: 0,
  },
);
assert.equal(flow.classifySourceCategory({ pace: "setup", text: "选择公司" }), "setup");
assert.equal(flow.classifySourceCategory({ pace: "pass", text: "获得本轮收入" }), "pass_income");
assert.equal(flow.classifySourceCategory({ text: "放置数据：蓝1 +1信用点" }), "tech_bonus_blue1");
assert.equal(flow.classifySourceCategory({ text: "放置数据：蓝2 +1能量" }), "tech_bonus_blue2");
assert.equal(flow.classifySourceCategory({ text: "半人马顶部奖励：外星人牌" }), "alien");
assert.equal(flow.classifySourceCategory({ text: "没有可识别来源：资源：信用点+1" }), "unclassified");
```

Run: `node randomizer/game/ai/resource-flow.test.js`

Expected: FAIL because `parseDeltaText` and `classifySourceCategory` do not yet return these literals.

- [ ] **Step 5: Implement exact delta-token normalization and evidence-first classification**

Map labels with a fixed table and parse signed values only once per span:

```js
const RESOURCE_LABEL_TO_KEY = Object.freeze({
  分数: "score", 信用点: "credits", 能量: "energy", 宣传: "publicity",
  数据: "availableData", 手牌: "handSize",
});
const DELTA_TOKEN_RE = /(分数|信用点|能量|宣传|数据|手牌)([+-]\d+(?:\.\d+)?)/g;
const PREFIX_DELTA_TOKEN_RE = /([+-]\d+(?:\.\d+)?)\s*(分数|信用点|能量|宣传|数据|手牌)/g;
```

Parse explicit `资源：...` and `收入：...` groups first, record their character ranges, then ignore generic signed tokens inside those ranges. `classifySourceCategory` must use ordered evidence: pace/setup and PASS first; exact blue slot text before generic tech; income-immediate wording before generic card; company names and `宇宙战略集团/寰宇超动力/作弊实验室` before generic board; revealed alien names before generic card; action labels for data, analysis, trade, planet, cost and settlement; otherwise `unclassified`.

- [ ] **Step 6: Run the full core test and syntax check**

Run:

```powershell
node randomizer/game/ai/resource-flow.test.js
node --check randomizer/game/ai/resource-flow.js
git diff --check
```

Expected: `resource-flow.test.js: all tests passed`, both commands exit 0, and `git diff --check` is silent.

- [ ] **Step 7: Commit the core ledger**

```powershell
git add randomizer/game/ai/resource-flow.js randomizer/game/ai/resource-flow.test.js
git diff --cached --check
git commit -m "新增AI资源流统一账本"
```

---

### Task 2: Reference Markdown Adapter and Coverage Gate

**Files:**
- Create: `tools/analyze_reference_action_logs.js`
- Create: `tools/analyze_reference_action_logs.test.js`
- Modify: `randomizer/game/ai/resource-flow.js`
- Modify: `randomizer/game/ai/resource-flow.test.js`

**Interfaces:**
- Consumes: UTF-8 SETI action-log Markdown with final-score, route-summary, and full-timeline sections.
- Produces: `parseReferenceActionLog(markdown, options)`, `analyzeReferenceDocuments(documents, options)`, `analyzeReferenceFiles(filePaths, options)`, and CLI options `--dir`, `--out`, `--minCoverage`.
- CLI JSON shape: `{ generatedAt, inputFiles, duplicateFiles, games, summary }`; `summary` is the shared resource-flow analysis and includes `coverage.weighted` plus `unclassifiedSamples`.

- [ ] **Step 1: Write the failing Markdown adapter test**

Name the break: the adapter must preserve player/round/source ownership, suppress exact duplicate files, recognize company and revealed aliens, and fail its coverage gate instead of silently using partial evidence.

```js
const assert = require("node:assert/strict");
const {
  parseReferenceActionLog,
  analyzeReferenceDocuments,
} = require("./analyze_reference_action_logs");

const markdown = `# SETI 行动日志

## 终局分数
| 玩家 | 总分 |
| --- | ---: |
| 白色 | 300 |

## 完整行动流水

### #1 初始选择 - 白色 - 初始选择
- [setup] 选择公司：宇宙战略集团
- [setup] 结算初始效果：获得 4信用点、2能量；资源：信用点+4、能量+2

### #2 第1轮 第1回合 - 白色 - 科技行动
- [main] 选择科技：blue1
- [quick] 放置数据：蓝色奖励槽：+1 信用点；资源：信用点+1

### #3 第1轮 第2回合 - 白色 - 分析数据
- [main] 分析数据：资源：能量-1
- [main] 回合结束揭示外星人：半人马已揭示
`;

const game = parseReferenceActionLog(markdown, { gameId: "human-1", fileName: "sample.md" });
assert.equal(game.playerResults[0].finalScore, 300);
assert.equal(game.playerMetadata["白色"].industryId, "宇宙战略集团");
assert.deepEqual(game.revealedAliens, ["半人马"]);
assert.equal(game.events.find((event) => event.sourceCategory === "tech_bonus_blue1").resourceDeltas.credits, 1);

const crossOwner = parseReferenceActionLog(markdown.replace(
  "放置数据：蓝色奖励槽：+1 信用点；资源：信用点+1",
  "方舟奖励：棕色 信用点+1",
), { gameId: "human-cross", fileName: "cross.md" });
assert.equal(crossOwner.events.find((event) => event.resourceDeltas.credits === 1).playerLabel, "棕色");

const deduped = analyzeReferenceDocuments([
  { fileName: "a.md", markdown },
  { fileName: "copy.md", markdown },
], { minCoverage: 0.98 });
assert.equal(deduped.games.length, 1);
assert.deepEqual(deduped.duplicateFiles, [{ duplicate: "copy.md", original: "a.md" }]);
assert.equal(deduped.summary.coverage.weighted, 1);

assert.throws(() => analyzeReferenceDocuments([{
  fileName: "bad.md",
  markdown: markdown
    .replace(" - 白色 - 科技行动", " - 白色 - 本回合行动")
    .replace("放置数据：蓝色奖励槽：+1 信用点", "没有可识别来源：信用点+1"),
}], { minCoverage: 1 }), /coverage/i);
```

- [ ] **Step 2: Run the adapter test and verify the module-missing red state**

Run: `node tools/analyze_reference_action_logs.test.js`

Expected: FAIL with `Cannot find module './analyze_reference_action_logs'`.

- [ ] **Step 3: Implement the Markdown state machine and CLI**

Use section and entry headers rather than line positions:

```js
const ENTRY_RE = /^### #(\d+) (.+?) - (.+?) - (.+)$/;
const ROUND_RE = /^第(\d+)轮 第(\d+)回合$/;
const STEP_RE = /^- \[(setup|main|quick)\] (.+)$/;
const SCORE_ROW_RE = /^\|\s*([^|]+?)\s*\|\s*(-?\d+(?:\.\d+)?)\s*\|/;

function analyzeReferenceFiles(filePaths = [], options = {}) {
  const documents = filePaths.map((filePath) => ({
    fileName: filePath,
    markdown: fs.readFileSync(filePath, "utf8"),
  }));
  return analyzeReferenceDocuments(documents, options);
}
```

For each step, call `resourceFlow.parseDeltaText(text)` and `resourceFlow.classifySourceCategory(...)`. Resolve an explicitly named known player immediately before a resource delta as the recipient; otherwise use the entry owner. Extract `选择公司：...`, `回合结束揭示外星人：...已揭示`, `打出：...`, `卡牌：...`, `获得...牌`, `盲抽...牌`, and income/discard/move-payment use into normalized card records. Hash normalized Markdown with SHA-256; the first path owns a hash and later paths enter `duplicateFiles`.

The CLI must execute only under `if (require.main === module)`, resolve all `.md` files in ordinal path order, throw when `summary.coverage.weighted < minCoverage`, write JSON only when `--out` is present, and print a compact JSON summary containing file/game/player counts, coverage, score quartiles, and top unclassified categories.

- [ ] **Step 4: Run the adapter test and real reference directory**

Run:

```powershell
node tools/analyze_reference_action_logs.test.js
node tools/analyze_reference_action_logs.js --dir "参考行动日志" --out tmp/reference-resource-flow.json --minCoverage 0.98
```

Expected: the unit test passes; the real command either exits 0 at coverage `>= 0.98` or exits nonzero and lists the exact unclassified samples that prevent acceptance.

- [ ] **Step 5: Convert every real coverage failure into a focused red-green regression**

For each distinct uncovered syntax class printed by the real command, add one literal line to a table in `tools/analyze_reference_action_logs.test.js` with the hand-derived expected deltas and source. Examples already present in the corpus and therefore required in this task are:

```js
const realSyntaxCases = [
  { text: "半人马6：1数据：白色获得 1/1 个数据", context: { actionLabel: "打牌行动" }, deltas: { availableData: 1 }, source: "alien" },
  { text: "盲抽 2/2 张；资源：手牌+2", context: { actionLabel: "打牌行动" }, deltas: { handSize: 2 }, source: "card" },
  { text: "宇宙战略集团：蓝色奖励槽：+1 数据", context: { actionLabel: "打牌行动" }, deltas: { availableData: 1 }, source: "industry" },
  { text: "方舟奖励 5：4能量：白色 能量+4", context: { actionLabel: "分析数据" }, deltas: { energy: 4 }, source: "alien" },
  { text: "快速交易：2张牌 → 1能量", context: { actionLabel: "快速行动" }, deltas: { handSize: -2, energy: 1 }, source: "trade_conversion" },
  { text: "扫描费用：扫描消耗 1信用点 + 2能量", context: { actionLabel: "扫描行动" }, deltas: { credits: -1, energy: -2 }, source: "cost" },
  { text: "至少50分：收入：弃掉 方舟粉色痕迹 4，能量+1（已即时获得）", context: { actionLabel: "PASS" }, deltas: { energy: 1, handSize: -1 }, source: "income_upgrade_immediate" },
];
```

Run the targeted test before and after each parser extension. Do not add a generic number extractor that treats coordinates, slot numbers, scores embedded in labels, or `1/2` progress counters as resources.

- [ ] **Step 6: Verify the 98% gate, inspect all residual samples, and commit**

Run:

```powershell
node tools/analyze_reference_action_logs.test.js
node tools/analyze_reference_action_logs.js --dir "参考行动日志" --out tmp/reference-resource-flow.json --minCoverage 0.98
node --check tools/analyze_reference_action_logs.js
git diff --check
```

Expected: all commands exit 0, weighted coverage is at least `0.98`, the known identical reference-log copy appears in `duplicateFiles`, and residual samples are present in JSON rather than discarded.

Commit and synchronize:

```powershell
git add randomizer/game/ai/resource-flow.js randomizer/game/ai/resource-flow.test.js tools/analyze_reference_action_logs.js tools/analyze_reference_action_logs.test.js
git diff --cached --check
git commit -m "统计玩家日志资源转化效率"
git fetch origin
git rebase origin/master
git push origin master
git rev-list --left-right --count HEAD...origin/master
```

Expected final divergence: `0 0`.

---

### Task 3: Structured AI Action-Log Adapter and Autobattle Wiring

**Files:**
- Modify: `randomizer/game/ai/resource-flow.js`
- Modify: `randomizer/game/ai/resource-flow.test.js`
- Modify: `randomizer/game/ai/index.js:4-29,34-47`
- Modify: `randomizer/index.html:783-791,800`
- Modify: `randomizer/app.js:1066-1267`
- Modify: `randomizer/app/ai-controller.js:19-70,1091-1118,24497-24610,24890-25147`
- Modify: `randomizer/app/ai-controller.test.js:62-1075`
- Modify: `tools/run_ai_autobattle_browser.js:38-160,509-577,651-689`

**Interfaces:**
- Produces `normalizeStructuredActionLog(entries, options)` and `analyzeStructuredActionLog(entries, options)` in `SetiAIResourceFlow`; the latter returns the compact summary plus normalized `events` for diagnostics.
- `createAiController` consumes optional `getActionLogEntries(options)` from app context.
- Single reports expose `report.resourceFlow`; compact samples expose `sample.resourceFlow`; batch results expose `result.resourceFlow` and `result.summary.resourceFlowHeadline`.
- Recovery snapshots are consumed inside the browser and never copied into `report.resourceFlow`, sample JSON, or runner stdout.

- [ ] **Step 1: Write the failing structured-snapshot reconciliation test**

Name the break: if step parsing misses or double-counts a delta, reconciliation must expose the exact residual instead of accepting a plausible aggregate.

```js
const entries = [
  {
    id: 1, roundNumber: 1, turnNumber: 1, playerId: "p1", playerLabel: "白色",
    actionType: "playCard", actionLabel: "打牌行动",
    steps: [{ source: "main", text: "打出：测试牌：资源：信用点-1、手牌-1", playedCard: { id: "c1", label: "测试牌" } }],
    recoverySnapshot: { state: { playerState: { players: [{
      id: "p1", resources: { credits: 3, energy: 2, publicity: 0, availableData: 0 },
      hand: [{ id: "c2", label: "剩余牌" }], income: {},
    }] } } },
  },
  {
    id: 2, roundNumber: 1, turnNumber: 2, playerId: "p1", playerLabel: "白色",
    actionType: "quick", actionLabel: "快速行动",
    steps: [{ source: "quick", text: "蓝1奖励：资源：信用点+1" }],
    recoverySnapshot: { state: { playerState: { players: [{
      id: "p1", resources: { credits: 4, energy: 2, publicity: 0, availableData: 0 },
      hand: [{ id: "c2", label: "剩余牌" }], income: {},
    }] } } },
  },
];

const structured = flow.analyzeStructuredActionLog(entries, {
  gameId: "ai-1",
  initialPlayerStates: { p1: { resources: { credits: 4, energy: 2 }, hand: [{ id: "c1" }, { id: "c2" }], income: {} } },
  playerResults: [{ playerId: "p1", playerLabel: "白色", finalScore: 250 }],
});
assert.equal(structured.reconciliation.residualMagnitude, 0);
assert.equal(structured.players[0].blue1CreditGain, 1);
assert.equal(structured.players[0].cardUse.played, 1);
assert.equal(JSON.stringify(structured).includes("recoverySnapshot"), false);

const broken = structured.events.map((event) => ({ ...event }));
broken[0].resourceDeltas = { credits: 0, handSize: -1 };
assert.equal(flow.reconcileStructuredEvents(entries, broken, {
  initialPlayerStates: { p1: { resources: { credits: 4, energy: 2 }, hand: [{ id: "c1" }, { id: "c2" }], income: {} } },
}).residuals[0].resourceDeltas.credits, -1);
```

- [ ] **Step 2: Run the core test and observe the missing-interface failure**

Run: `node randomizer/game/ai/resource-flow.test.js`

Expected: FAIL because `analyzeStructuredActionLog` or `reconcileStructuredEvents` is not defined.

- [ ] **Step 3: Implement snapshot extraction, card identity tracking, and zero-residual reconciliation**

Read every player from `entry.recoverySnapshot.state.playerState.players`, not only `entry.playerId`, so one action that rewards another player produces separate recipient events. Normalize hand size from the real `hand` array and income from `player.income`. Use an explicit `initialPlayerStates` snapshot captured immediately after player-state reset and before the initial hands and setup rewards are dealt. A first setup interval may synthesize a `setup` event from its snapshot residual so the unlogged default starting hand is counted as setup inventory. A non-setup residual remains an error. If the baseline snapshot is unavailable, mark the first interval `baselineMissing` and exclude that interval from the zero-residual claim instead of assuming zero.

Return only compact event, player, group, coverage and reconciliation data. Never retain the source entry or recovery snapshot on normalized events.

Use these exact composition boundaries:

```js
function normalizeStructuredActionLog(entries = [], options = {}) {
  return normalizeEntriesAndSnapshots(entries, options).events;
}

function analyzeStructuredActionLog(entries = [], options = {}) {
  const events = normalizeStructuredActionLog(entries, options);
  const reconciliation = reconcileStructuredEvents(entries, events, options);
  return {
    ...summarizeResourceEvents(events, options),
    events,
    reconciliation,
  };
}
```

- [ ] **Step 4: Write the failing controller integration test**

Extend `createAiControllerHarness` with `options.aiResourceFlow` and `options.getActionLogEntries`. Then add:

```js
{
  const observed = [];
  const harness = createAiControllerHarness(null, {
    aiResourceFlow: {
      analyzeStructuredActionLog(entries, options) {
        observed.push({ entries, options });
        return { coverage: { weighted: 1 }, reconciliation: { residualMagnitude: 0 }, players: [] };
      },
      summarizeResourceFlowAnalyses(items) {
        return { gameCount: items.length };
      },
    },
    getActionLogEntries: () => [{ id: 1, recoverySnapshot: { secret: true } }],
  });
  const report = harness.controller.getAiAutoBattleReport({ includeAnalysis: false });
  assert.equal(observed.length, 1);
  assert.equal(report.resourceFlow.coverage.weighted, 1);
  assert.equal(JSON.stringify(report.resourceFlow).includes("secret"), false);
}
```

Run: `node randomizer/app/ai-controller.test.js`

Expected: FAIL because the controller does not request or expose resource-flow analysis.

- [ ] **Step 5: Wire the module through AI index, app context, single report, compact samples, and batch summary**

Load the module before `battle-analytics.js`:

```html
<script src="./game/ai/resource-flow.js?v=ai-resource-flow-1"></script>
```

Add `resourceFlow` to `randomizer/game/ai/index.js` dependency resolution and public API. Pass app context without exposing log state globally:

```js
getActionLogEntries: (options = {}) => getRecoverableActionLog(options),
```

Add `resourceFlowInitialPlayerStates` to `aiAutoBattleState`. Capture it in `resetGameForAiAutoBattle()` immediately after `playerState` is restored and before `initializeCardGame()` and initial selections resolve. In `buildAiAutoBattleReport`, analyze only when action entries and `ai.resourceFlow` exist, pass the stored compact initial snapshot, and attach the compact return value. In `compactAiAutoBattleSample`, copy `report.resourceFlow`. In `runAiAutoBattleBatch`, summarize completed sample flows and expose the headline:

```js
const resourceFlow = ai?.resourceFlow?.summarizeResourceFlowAnalyses?.(
  samples.map((sample) => sample.resourceFlow).filter(Boolean),
) || null;
if (summary && resourceFlow) summary.resourceFlowHeadline = resourceFlow.headline;
```

- [ ] **Step 6: Update runner stdout and ensure no full log requirement**

Add no new default large payload. `summarizeResult` should read `result.resourceFlow?.headline` and expose:

```js
resourceFlow: result.resourceFlow?.headline || result.resourceFlow?.coverage || null,
```

The resource flow must appear without `--includeLogs`; `--includeLogs` retains its existing diagnostic meaning.

- [ ] **Step 7: Run targeted tests, syntax checks, and cache-boundary verification**

Run:

```powershell
node randomizer/game/ai/resource-flow.test.js
node randomizer/app/ai-controller.test.js
node --check randomizer/game/ai/index.js
node --check randomizer/app/ai-controller.js
node --check randomizer/app.js
node --check tools/run_ai_autobattle_browser.js
git diff --check
```

Expected: all tests pass, all syntax checks exit 0, the new resource-flow script precedes `game/ai/index.js`, and the `ai-controller.js` cache query is incremented because the controller changed.

- [ ] **Step 8: Run one fixed single-game integration smoke**

Run:

```powershell
node tools/run_ai_autobattle_browser.js --single --seed "codex-ai-current-default:1" --activePlayerCount 4 --yieldEverySteps 5 --timeoutMs 900000 --tmpRoot C:\tmp --out tmp/ai-resource-flow-smoke.json
```

Expected: normal game end, `bugCount=0`, four resource-flow player rows, coverage present, reconciliation residual `0`, and no `recoverySnapshot` string under `result.resourceFlow`.

- [ ] **Step 9: Commit and synchronize runtime instrumentation**

```powershell
git add randomizer/game/ai/resource-flow.js randomizer/game/ai/resource-flow.test.js randomizer/game/ai/index.js randomizer/index.html randomizer/app.js randomizer/app/ai-controller.js randomizer/app/ai-controller.test.js tools/run_ai_autobattle_browser.js
git diff --cached --check
git commit -m "接入电脑对战资源流统计"
git fetch origin
git rebase origin/master
git push origin master
git rev-list --left-right --count HEAD...origin/master
```

Expected final divergence: `0 0`.

---

### Task 4: Human-versus-AI Resource Gap Report

**Files:**
- Create: `tools/compare_resource_flow_reports.js`
- Create: `tools/compare_resource_flow_reports.test.js`

**Interfaces:**
- Consumes: `tmp/reference-resource-flow.json` and one autobattle runner JSON containing `result.samples[*].resourceFlow` or `result.resourceFlow`.
- Produces: CLI options `--reference`, `--ai`, `--out`, `--markdown`; JSON `{ reference, ai, deltas, largestGaps, evidence }` and a complete Markdown section ready for `docs/ai-design.md`.
- Groups: all players, top score quartile, bottom score quartile, company, alien, and round.

- [ ] **Step 1: Write the failing comparison test with hand-derived quartiles**

Name the break: a comparer that mixes setup into in-game gains, chooses quartiles by file order, or subtracts AI from human in the wrong direction must fail.

```js
const assert = require("node:assert/strict");
const { compareResourceFlowReports, renderMarkdown } = require("./compare_resource_flow_reports");

const reference = { summary: { players: [
  { playerId: "h1", finalScore: 300, nonIncomeGainWeighted: 30, incomeGainWeighted: 12, mainActionsPerWeightedCost: 0.20, fullDataCycleCount: 3 },
  { playerId: "h2", finalScore: 200, nonIncomeGainWeighted: 20, incomeGainWeighted: 10, mainActionsPerWeightedCost: 0.10, fullDataCycleCount: 1 },
] } };
const ai = { result: { samples: [{ resourceFlow: { players: [
  { playerId: "a1", finalScore: 280, nonIncomeGainWeighted: 40, incomeGainWeighted: 12, mainActionsPerWeightedCost: 0.15, fullDataCycleCount: 2 },
  { playerId: "a2", finalScore: 180, nonIncomeGainWeighted: 35, incomeGainWeighted: 8, mainActionsPerWeightedCost: 0.08, fullDataCycleCount: 0 },
] } }] } };

const comparison = compareResourceFlowReports(reference, ai);
assert.equal(comparison.reference.topQuartile.averageFinalScore, 300);
assert.equal(comparison.ai.topQuartile.averageFinalScore, 280);
assert.equal(comparison.deltas.topQuartile.fullDataCycleCount, 1);
assert.equal(comparison.deltas.topQuartile.nonIncomeGainWeighted, -10);
assert.ok(comparison.largestGaps.some((entry) => entry.metric === "fullDataCycleCount" && entry.delta === 1));
assert.match(renderMarkdown(comparison), /资源更多但完整数据循环更少/);
```

- [ ] **Step 2: Run the comparison test and verify the module-missing red state**

Run: `node tools/compare_resource_flow_reports.test.js`

Expected: FAIL with `Cannot find module './compare_resource_flow_reports'`.

- [ ] **Step 3: Implement deterministic quartiles, grouped means, gap direction, and Markdown output**

Sort player rows by `finalScore` ascending, use nearest-rank quartile membership with at least one player, and compute `human - ai` so a positive delta means humans do more with that metric. Rank actionable gaps only from conversion metrics; raw resource amount remains context and cannot rank as a recommended weight change.

The evidence text must explicitly distinguish cases such as:

```js
if (aiTop.nonIncomeGainWeighted > humanTop.nonIncomeGainWeighted
  && aiTop.fullDataCycleCount < humanTop.fullDataCycleCount) {
  evidence.push("电脑收入外资源更多但完整数据循环更少，优先检查资源到分析/回填行动的转化，而不是提高资源静态价值。");
}
```

- [ ] **Step 4: Run targeted tests and syntax checks**

Run:

```powershell
node tools/compare_resource_flow_reports.test.js
node --check tools/compare_resource_flow_reports.js
git diff --check
```

Expected: test passes and checks exit 0.

- [ ] **Step 5: Commit the comparison report tool**

```powershell
git add tools/compare_resource_flow_reports.js tools/compare_resource_flow_reports.test.js
git diff --cached --check
git commit -m "新增真人与电脑资源差距报告"
```

---

### Task 5: Fresh Fixed Baseline, Evidence Report, Full Verification, and Sync

**Files:**
- Modify: `docs/ai-design.md:473-563,577-858`
- Generated but not committed: `tmp/reference-resource-flow.json`
- Generated but not committed: `tmp/ai-resource-flow-baseline-0f70ef32.json`
- Generated but not committed: `tmp/ai-resource-flow-gap.json`
- Generated but not committed: `tmp/ai-resource-flow-gap.md`

**Interfaces:**
- Consumes all tools and runtime wiring from Tasks 1-4.
- Produces the authoritative current baseline and resource-gap findings in `docs/ai-design.md`, including exact commands, coverage, per-seat scores, aggregate score statistics, income/non-income totals, conversion rates, company/alien/round gaps, and the first concrete behavior hypothesis.

- [ ] **Step 1: Regenerate the de-duplicated human reference report**

Run:

```powershell
node tools/analyze_reference_action_logs.js --dir "参考行动日志" --out tmp/reference-resource-flow.json --minCoverage 0.98
```

Expected: exit 0, coverage `>= 0.98`, duplicate paths reported, and no unclassified resource changes omitted.

- [ ] **Step 2: Run the eight fixed default-difficulty games once at the instrumentation-only behavior baseline**

Run:

```powershell
$seeds = @(
  'codex-ai-current-default:1',
  'codex-ai-current-default:2',
  'codex-ai-current-default:3',
  'codex-ai-current-default:4',
  'codex-ai-current-default:5',
  'codex-ai-resource-gap-alien-card-dev-20260731:fl',
  'codex-ai-resource-gap-alien-card-dev-20260731:fm',
  'codex-ai-resource-gap-alien-card-dev-20260731:fn'
)
node tools/run_ai_autobattle_browser.js --seeds ($seeds -join ',') --games 8 --activePlayerCount 4 --yieldEverySteps 5 --timeoutMs 3600000 --tmpRoot C:\tmp --out tmp/ai-resource-flow-baseline-0f70ef32.json
```

Expected: eight completed games, 32 player rows, `blockedGames=0`, total `bugCount=0`, per-game reconciliation residual `0`, and the runner records the exact instrumentation commit while docs identify `0f70ef32` as the unchanged behavior baseline.

- [ ] **Step 3: Generate the gap JSON and Markdown**

Run:

```powershell
node tools/compare_resource_flow_reports.js --reference tmp/reference-resource-flow.json --ai tmp/ai-resource-flow-baseline-0f70ef32.json --out tmp/ai-resource-flow-gap.json --markdown tmp/ai-resource-flow-gap.md
```

Expected: exit 0 and complete all-player, score-quartile, company, alien and round sections. The ranked recommendation must be a conversion gap, not a request to increase a legacy base weight.

- [ ] **Step 4: Audit the generated evidence before documenting it**

Check the JSON directly:

```powershell
$reference = Get-Content -LiteralPath 'tmp/reference-resource-flow.json' -Raw | ConvertFrom-Json
$baseline = Get-Content -LiteralPath 'tmp/ai-resource-flow-baseline-0f70ef32.json' -Raw | ConvertFrom-Json
$gap = Get-Content -LiteralPath 'tmp/ai-resource-flow-gap.json' -Raw | ConvertFrom-Json
if ($reference.summary.coverage.weighted -lt 0.98) { throw 'reference coverage below 0.98' }
if ($baseline.result.gamesRun -ne 8) { throw 'fixed baseline did not finish 8 games' }
if (($baseline.result.samples | Where-Object { $_.bugCount -gt 0 -or $_.summary.blocked }).Count) { throw 'fixed baseline contains blocked or bugged games' }
if (($baseline.result.samples.resourceFlow.reconciliation.residualMagnitude | Measure-Object -Maximum).Maximum -ne 0) { throw 'AI resource reconciliation residual is nonzero' }
if (-not $gap.largestGaps.Count) { throw 'resource gap report has no actionable conversion gap' }
'RESOURCE_FLOW_BASELINE_AUDIT=PASS'
```

Expected: `RESOURCE_FLOW_BASELINE_AUDIT=PASS`.

- [ ] **Step 5: Update the canonical AI document with actual generated evidence**

Append the generated Markdown under §9 and add a concise §11 baseline gate. The committed prose must include:

- behavior baseline SHA `0f70ef32` and instrumentation SHA;
- exact 8 seeds and 32 per-seat scores;
- score mean, P25, top-quartile mean, maximum and minimum;
- reference coverage and duplicate-log count;
- human versus AI setup, income and non-income weighted totals;
- utilization, same-round reinvestment, draw-to-play, income-card conversion, data-turnover, full-cycle, blue1/blue2 and alien-card conversion comparisons;
- company, alien and round location of the largest gap;
- exactly one first behavior hypothesis expressed as a concrete state chain for the next delta design;
- an explicit note that no AI behavior changed and no `+10` score claim is made by this instrumentation commit.

- [ ] **Step 6: Run the complete repository verification required by `AGENTS.md`**

Run:

```powershell
node --check randomizer/app.js
node --check randomizer/app/ai-controller.js
node --check randomizer/game/ai/resource-flow.js
node --check tools/analyze_reference_action_logs.js
node --check tools/compare_resource_flow_reports.js
node --check tools/run_ai_autobattle_browser.js
node tools/analyze_reference_action_logs.test.js
node tools/compare_resource_flow_reports.test.js
$tests = rg --files randomizer | Where-Object { $_ -match '\.test\.js$' } | Sort-Object
foreach ($test in $tests) {
  node $test
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}
git diff --check
```

Expected: all syntax checks exit 0, both tool tests pass, every `randomizer/**/*.test.js` file passes including the new resource-flow test, and `git diff --check` is silent.

- [ ] **Step 7: Commit the fresh baseline evidence and synchronize master**

```powershell
git add docs/ai-design.md
git diff --cached --check
git commit -m "记录AI资源流新基线"
git fetch origin
git rebase origin/master
git push origin master
git fetch origin
git rev-list --left-right --count HEAD...origin/master
git rev-parse HEAD
git rev-parse origin/master
git status --short --branch
```

Expected: ahead/behind `0 0`, local and remote SHA identical, and a clean `master...origin/master` worktree. The next task is a new evidence-specific design and plan for the single highest-ranked resource-to-action断链; frozen `h01..h08` remain unrun.
