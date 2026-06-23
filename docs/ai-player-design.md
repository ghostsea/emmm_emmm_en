# AI 电脑玩家设计（接口契约）

> ⚠️ 本文档为**接口契约层**（GameState 视图 / 决策总线 / PlayerAgent / 合法行动枚举 / seeded RNG），仍然有效。
> **“大脑”层（价值模型 / 目标系统 / 回合规划）以 `docs/ai-architecture-v2.md` 为准**，后续开发请先读 v2。
> 本文 §7（估值器）与 §14（数据驱动优化路线）已被 v2 取代。

本文档固化「电脑玩家（AI 自动机）」的架构与接口契约，供后续实现与回归对照。
目标形态：**浏览器内人机实时对战**（轮到电脑时自动行动、人类可观战）；同时保证一套接口能在
**Node 无头环境**复用，用于自博弈、测试与调参。

- 决策方法首版：**启发式贪心**，直接复用 `docs/行动成本和收益.md` 的折算价值模型。
- 行动覆盖目标：**全行动**（发射 / 环绕 / 登陆 / 分析 / 扫描 / 打牌 / 科技 / 公司牌 / 外星人专属流程 / 快速交易 / PASS）。

> 机制、状态模型或接口若发生变化，请同步更新本文件（见 `AGENTS.md` 约定）。

---

## 1. 现状与核心障碍

| 维度 | 现状 | 结论 |
|------|------|------|
| 规则内核 | `game/actions/**`、`game/abilities/**`、`game/cards/**` 为 `canExecute(context)` / `execute(context)` 模式，不碰 DOM，已可 Node 单测 | 可复用 |
| 算分 | `endGameScoring.computePlayerFinalScore(context, player)` 给定完整状态即可算分（`game/end-game-scoring.js:636`） | 评估友好 |
| 撤销/快照 | `createGameRecoverySnapshot()`（`app.js:1159`）/ `action-history` undo 栈 | 可做"试一步→回退" |
| 回合编排 | 主要仍在 `app.js`（约 2.6 万行），依赖、常量、DOM 注册、事件绑定、公开 API 和 AI 控制器已拆到 `randomizer/app/**`，但行动流程仍与 DOM/pending 状态强耦合 | **主要障碍** |
| 玩家选择 | 通过 30+ 个 `pending*` 状态 + DOM overlay 收集 | **必须收口** |
| 合法行动 | 无统一 `getLegalActions`，判断散落在 `updateActionButtons()` 与各 `canExecute*` | 需新建聚合层 |
| 随机性 | 全局 `Math.random`，无统一种子（部分函数已支持注入 `random`） | 需可注入 RNG |

**本质判断**：当前是「带撤销的交互式 UI 壳」，不是「无头游戏引擎」。接 AI 的关键不是先写"大脑"，
而是先把"等人点击"反转为"引擎向玩家代理请求一个决策"的统一通道。

---

## 2. 分层与文件结构

```
randomizer/
├─ app/                         # app 装配层：依赖、常量、DOM、事件、公开 API、AI controller 等边界模块
├─ app.js                       # UI 壳：交互点后续应改走 requestDecision；轮到 AI 时接入 controller
├─ game/**                      # 规则内核（基本不动；仅补 enumerate / 纯函数化 / 可注入 RNG）
└─ game/ai/                     # ★ 新增：电脑玩家
   ├─ player-agent.js           # PlayerAgent 接口 + HumanAgent / AIAgent
   ├─ decision-bus.js           # requestDecision 通道（收口所有 pending*）
   ├─ legal-actions.js          # enumerateLegalActions(state, playerId)
   ├─ evaluator.js              # 价值模型 → 状态估值（复用 行动成本和收益.md）
   ├─ policy.js                 # 启发式贪心：回合规划 + 子决策选择
   ├─ battle-analytics.js       # AI 对战日志指标汇总，用于策略迭代
   ├─ controller.js             # AI 回合驱动器（轮到电脑时接管）
   └─ ai.test.js                # Node 无头回归
```

设计原则：

1. **人类路径行为不变**。收口只是在交互点前加一层统一入口；overlay 仍照常弹出，点击仍照常生效。
2. **AI 与人类实现同一 `PlayerAgent` 接口**；谁的回合就用谁的代理回答决策。
3. **规则内核不感知"谁在玩"**。AI 不直接改状态，而是通过与人类相同的行动/决策入口产生效果。

---

## 3. 契约一：GameState 视图

AI 与枚举/估值层统一以一个 **GameState 视图** 作为输入。它是现有 `createActionContext()`
（`app.js:21412`）的超集快照，聚合所有与决策相关的状态切片：

```
GameState = {
  // 状态切片（引用现有对象，估值/搜索时用 structuredClone 克隆）
  solarState, playerState, cardState, rocketState,
  nebulaDataState, planetStatsState, alienGameState,
  techGameState, finalScoringState, cardTaskState,
  turnState,                         // roundNumber / turnNumber / passedPlayerIds / ...

  // 派生只读视图
  currentPlayerId,
  getPlayer(playerId),
  getPlanetLocations(),              // solar.createSolarSnapshot(solarState).planetLocations
  getSolarSnapshot(),
}
```

约定：

- **克隆用于估值**：搜索/估值时通过 `createGameRecoverySnapshot()`（`app.js:1159`）或 `structuredClone`
  得到独立副本，禁止在估值过程中改动真实状态。
- **瞬态 `pending*` 不入 GameState**：决策进行中的 UI 瞬态由 decision-bus 维护，不参与估值快照
  （`clearTransientStateForRecovery` 在快照里已清空，见 `app.js:1246` 附近）。

---

## 4. 契约二：决策总线 requestDecision

所有"玩家需要做选择"的点，统一收口到一个通道。引擎需要选择时只调用 `requestDecision`，
由当前玩家的代理回答。

### 4.1 接口

```js
// decision-bus.js
// 返回 Promise<DecisionResult>；人类经 overlay+点击 resolve，AI 经 policy 立即 resolve。
async function requestDecision(request) {
  const agent = getAgentForPlayer(request.playerId);
  return agent.resolveDecision(currentState(), request);
}
```

### 4.2 DecisionRequest

```
DecisionRequest = {
  kind,            // 见 4.4 决策种类表
  playerId,        // 需要做选择的玩家
  options,         // 候选项数组（每项含足够的展示与执行信息）
  min, max,        // 多选时的数量约束（如弃牌 N 张）
  optional,        // 是否可放弃（如"可预留"）
  meta,            // kind 专属上下文（如扫描来源、打出的牌、效果链节点 id）
}
```

### 4.3 DecisionResult

```
DecisionResult = {
  chosen,          // 选中的项（或项数组 / null 表示放弃）
}
```

### 4.4 决策种类（kind）与现有 pending 对应

| kind | 含义 | 现有 pending / 入口 |
|------|------|---------------------|
| `turn-action` | 选主行动 / 快速行动 / PASS / 结束回合 | `updateActionButtons()` + `canStartMainAction()`（`app.js:21659`） |
| `land-target` | 登陆目标星球 | `pendingLandTargetAction` |
| `move-path` | 移动哪艘船、走哪格 | `pendingActionEffectFlow.cardMoveEffect` / `freeMoveMode` |
| `move-payment` | 移动支付方式（能量/弃牌） | `pendingMovePayment` / `beginMovePaymentSelection` |
| `scan-target` | 扫描目标（星云 / 扇区 x） | `pendingScanTargetAction` / `pendingPublicScanQueue` |
| `hand-scan` | 手牌扫描弃哪张 | `pendingHandScanAction` |
| `play-card` | 打哪张手牌 | `pendingPlayCardSelection` |
| `pick-card` | 公共牌精选 / 扫描选牌 | `pendingCardSelectionAction` |
| `discard` | 弃 N 张牌 | `beginDiscardSelection` |
| `reserve` | PASS 预留牌 | `pendingPassReserveSelection` |
| `tech-placement` | 科技板放置 | 科技流程 `pending*` |
| `industry-ability` | 公司 1x 主动能力 | `pendingIndustryAbility` |
| `alien-trace` | 外星人痕迹放置 | `pendingAlienTraceAction` |
| `alien-specific` | 外星人专属选择（九折/异常点/方舟/虫/阿米巴/奥陌陌/符文族等） | `pendingChong* / pendingAmiba* / pendingRunezu* / ...` |

> 收口时 kind 可按需细分，但**每个 pending 交互点都必须有且只有一个 requestDecision 入口**。

---

## 5. 契约三：PlayerAgent

人类与电脑实现同一接口：

```js
// player-agent.js
const PlayerAgent = {
  // 顶层：在当前状态下选择本回合下一步动作（主/快速行动 / PASS / 结束回合）
  // request.options 来自 enumerateLegalActions
  chooseTurnAction(state, request),

  // 子决策：解决某个 DecisionRequest（登陆目标、扫描星云、弃牌、痕迹位置……）
  resolveDecision(state, request),
};
```

实现：

- **HumanAgent**：`resolveDecision` 显示对应 overlay → 等点击 → resolve（沿用现有 UI 子流程，行为不变）。
- **AIAgent**：`resolveDecision` 调用 `policy` → 立即返回选择（流程不停顿，无 overlay）。

代理注册（按玩家配置人/电脑）：

```js
// 例：playerId -> 'human' | 'ai'
setAgentForPlayer(playerId, agent);
function getAgentForPlayer(playerId) { /* ... */ }
```

---

## 6. 契约四：合法行动枚举

```js
// legal-actions.js
// 返回当前可执行的顶层行动候选（供 turn-action 决策使用）
function enumerateLegalActions(state, playerId) { /* -> LegalAction[] */ }

LegalAction = {
  id,              // 'launch' | 'orbit' | 'land' | 'analyze' | 'scan'
                   // | 'play-card' | 'research-tech' | 'industry' | 'quick-trade' | 'pass' | 'end-turn'
  kind,            // 'main' | 'quick' | 'pass' | 'end-turn'
  params,          // 执行所需参数（可为空，后续由子决策补全）
  available,       // true/false
  reason,          // 不可用原因（调试用）
}
```

聚合来源（保持与 UI 判断一致）：

- `actions.canExecute("launch"|"orbit"|"land"|"researchTech", context)`（`game/actions/index.js`）
- `scanEffects.canExecuteScan(player, { standardAction: true })`
- `data.canAnalyzeData(player)`
- `quickTrades.canExecuteTrade(tradeId, context)`
- `canStartMainAction()`（`app.js:21659`）/ PASS / 结束回合门禁

约定：枚举层**只读**，不得改状态；所有真正的执行仍走现有 `runAction` / 快速行动入口。

---

## 7. 契约五：估值器（启发式大脑）

```js
// evaluator.js
// 把任意 GameState 折算为某玩家的"分数估计"
function evaluate(state, playerId) { /* -> number */ }
```

折算规则（来自 `docs/行动成本和收益.md`，实现时集中为常量表，便于调参）：

- 基础分：`endGameScoring.computePlayerFinalScore` 的实时/终局分。
- 资源折算：`1 信用 = 1 能量 = 1 精选 = 3 分`；`1 信号(含数据) = 3 分`；`1 移动 = 1 数据 = 1.5 宣传 = 1.5 分`。
- 卡牌：普通卡按价值估，外星人卡 ≈ 4 分。
- 收入：按"剩余可享受次数"加权（第一轮收入可享受 4 次，逐轮递减）。
- 成本要算全：登陆/环绕计入"发射 + 移动 + 本身"；无紫科扫描按负期望处理。
- 终局板块 / 任务牌：对相关行动的边际收益加权（标记到 1 号位的板块对应行动应多做）。

```js
// policy.js
// 回合规划：对每个候选估"做完后状态价值 − 当前价值"，选最大；PASS 作为候选并显式权衡轮序与收入。
function chooseTurnAction(state, request) { /* -> LegalAction */ }
// 子决策：对 DecisionRequest 的 options 估值挑最优，保证每种 kind 都有合理默认。
function resolveDecision(state, request) { /* -> DecisionResult */ }
```

---

## 8. 契约六：AI 回合驱动器

```js
// controller.js
// 轮到 AI 玩家时接管，循环：枚举 -> 选动作 -> 执行（产生子决策时由 AIAgent.resolveDecision 回答）
// 直到该玩家 PASS 或结束回合，再交还给回合编排（advanceTurnAfterPlayerAction）。
async function runAiTurn(playerId) { /* ... */ }
```

驱动循环约束（与现有回合规则一致）：

- 一回合必须先完成一次主行动或 PASS，才能结束回合（`endCurrentTurn` 检查 `pendingActionExecuted`，`app.js:21892`）。
- 主行动进行中不能开始新主行动（`canStartMainAction`，`app.js:21659`）。
- 主行动前后均可做快速行动。
- PASS 走 `passForCurrentPlayer()`（`app.js:21848`）；回合/轮/局切换走 `advanceTurnAfterPlayerAction()`（`app.js:1701`）。

为避免与 UI 渲染竞争：AI 每步之间留出渲染节拍（浏览器下可加可配置延时，便于人类观战；Node 下零延时）。

---

## 9. 随机性与可复现

- 引入可注入的 **seeded RNG**，替换关键随机点：洗牌、盲抽、补公共牌、PASS 预留堆、太阳系轮盘、终局板块变体。
- 现有部分函数已支持注入（`cards.blindDraw(..., random)`、`cards.preparePassReservePiles(..., {random})`、
  `finalScoring.randomizeTileVariants(..., randomFn)` 等），优先走注入而非全局替换。
- 复现要求：给定种子 + 代理策略，整局可重放（用于自博弈回归与 bug 复现）。

---

## 10. 交互点收口顺序（增量、可回归）

每收口一个 kind，AI 就多会一种行动；每步保证 `node --check` 通过并跑测试。

1. `turn-action`（顶层驱动）
2. `land-target` / `move-path` / `move-payment`
3. `scan-target` / `hand-scan` / `analyze`
4. `play-card` / `pick-card` / `discard` / `reserve`
5. `tech-placement` / `industry-ability`
6. `alien-trace` / `alien-specific`（分支最多，最后做）

---

## 11. 里程碑

| 里程碑 | 内容 | 验收 |
|--------|------|------|
| M0 | `enumerateLegalActions` + seeded RNG + GameState 视图 | Node 跑通枚举与算分 |
| M1 | decision-bus + PlayerAgent，收口 `turn-action` + 登陆/移动 | AI 在浏览器自动走基础回合 |
| M2 | 收口扫描/分析/打牌 | AI 能打牌、扫描赢扇区 |
| M3 | 科技/公司牌/外星人专属流程 | 全行动覆盖 |
| M4 | evaluator 调参 + 无头自博弈回归 | AI vs AI 跑完整局不崩，胜负合理 |

---

## 12. 当前实现切片

当前分支已落地一个浏览器内自动对战 smoke slice：

- 新增 `randomizer/game/ai/evaluator.js`、`policy.js`、`index.js` 与 `ai.test.js`。
- 新增 `randomizer/game/ai/battle-analytics.js`，把 AI 对战日志汇总为行动分布、候选机会、PASS 机会成本、移动支付成本、目标选择、bug 分布、最终名次和优化建议。
- `window.SetiRandomizer` 暴露 `configureAiAutoBattle`、`configureAiStrategyWeights`、`applyAiStrategyTuning`、`resetAiStrategyWeights`、`getAiStrategyWeights`、`getAiStrategyTuningHistory`、`clearAiStrategyTuningHistory`、`getAiStrategyTuningRecommendation`、`applyAiStrategyTuningRecommendation`、`startAiAutoBattle`、`runAiAutoBattleBatch`、`runAiStrategyABTest`、`runAiStrategyTuningCycle`、`stopAiAutoBattle`、`runAiAutoBattleStep`、`getAiAutoBattleReport`、`getAiAutoBattleAnalysis`。
- 默认浏览器开局为 2 名活跃玩家：白色为人类玩家，另 1 名电脑玩家从剩余颜色随机进入；状态面板和调试玩家切换菜单会标记“人类/电脑”。
- 多电脑测试入口保留：`startAiAutoBattle({ reset: true, activePlayerCount: N, ... })` 会按玩家顺位配置 N 名电脑玩家，用于 smoke、自博弈和后续调参。
- 已支持 AI 自动初始选择、初始收入弃牌、PASS 手牌上限弃牌、PASS 预留精选、效果链逐步执行、基础 `launch` / `orbit` / `land` / `researchTech` / `scan` / `playCard` / `move` / `pass` / `end-turn` 决策。
- 科技行动已收口 `tech-placement`：AI 会从可研究科技片中按轻量启发式选片，并自动选择蓝色科技槽位；人类点击与 AI 自动选择复用同一段结算收口。
- 移动已收口 `move-path` / `move-payment`：AI 会从可移动火箭中选择方向，按能量优先、能量不足时弃移动牌的方式确认支付；主行动移动、卡牌移动与免费移动都会走现有移动历史与抵达奖励结算。
- 登陆目标已收口 `land-target`：遇到多目标登陆弹窗时 AI 自动选择第一个可用目标。
- 扫描行动已收口基础链路：AI 会启动主扫描行动，自动支付成本，处理公共牌扫描选牌、可选手牌扫描、手牌扫描选牌，以及 `sector_scan` / `public_scan` / `hand_scan` 的目标选择；当前会按星云槽位得分、数据收益、己方信号、扇区完成机会和手牌机会成本排序目标。
- 打牌主行动已收口普通手牌：AI 会枚举资源可支付、非外星人专属且当前可自动结算的手牌，走 `beginPlayCardSelection()` -> `handlePlayCardSelect()` -> `confirmPlayCardSelection()`，复用人类路径的费用、历史、保留牌和效果队列结算；候选阶段会过滤当前必失败的发射/环绕/登陆/移动效果及尚未收口的复杂卡牌效果。
- 基础 `alien-trace` 已接入：AI 会复用现有外星人痕迹 overlay 与牌图可放置槽位，自动选择第一个可用目标并记录日志。
- 单张公共牌精选已收口，可覆盖科技奖励、星球奖励等基础 pick-card 子流程；公共牌扫描多选会按扫描目标收益选择最多 `maxSelectable` 张可扫描公共牌。
- `getAiAutoBattleReport()` 记录 AI 步骤日志、bug/阻塞日志、轻量玩家结果快照，并附带 `analysis`；重复阻塞会累计 `repeatCount`，便于后续定位和修复。
- `analysis` 当前包含 `actionCategoryRatios`（基础主行动/卡牌科技/快速行动/PASS 占比）、`candidateStats`（候选出现/可用/被选/可用未选）、`candidateScoreStats`（候选 policy score、最佳但未选次数与分差）、`scoreOpportunities` / `topScoreGaps`、`opportunities`（PASS 时仍有可用主行动、结束回合时仍有可用移动等）、`movePayment`、`routeTargets`、`moveFollowups`、`turnPlans`、`turnPlanTypes`、`turnPlanActions`、`finalScoreMarks`、`finalScoreFormulas`、`winner` 和 `recommendations`。
- `analysis` 已补充胜者路线画像：单局会输出 `playerProfiles`、`winnerProfileComparison`、`winnerProfileDeltas`；批量汇总会输出 `averageWinnerProfile`、`averageNonWinnerProfile` 与 `winnerProfileDeltas`，用于比较胜者比非胜者多做了哪些路线动作（卡牌/科技/扫描/移动/任务/终局收益）。
- 单局 `analysis.strategyTuning` 和批量 `summary.strategyTuning` 会把 `winnerProfileDeltas`、候选未选、候选分数差、PASS 机会成本、行动占比、明确路线目标、移动后续主行动与一回合组合计划转换为一组温和的策略权重建议；其中组合计划会继续拆成 `cardSynergyCount`、`techSynergyCount`、`mainThenQuickCount`、`planScanCount`、`planOrbitLandCount`、`planTaskCount`、`planFinalCount` 等胜者画像指标，用来分别调高 `playCard`、`tech`、`scan`、`orbitLand`、`task`、`final`；终局板块标记会记录 `finalScoreMarks`、`finalScoreFormulas`、`finalScoreMarkCount` 与 `finalScoreImmediateValue`，当胜者在标记价值上领先时反向提高 `final` 与 `engine` 权重；`candidateScoreStats.playCard/researchTech/scan.missedAsBest` 会指出高分候选被顶层偏置或选择策略压过。可用 `applyAiStrategyTuning(summary.strategyTuning)` 或在下一批 `runAiAutoBattleBatch({ strategyTuning: summary.strategyTuning, ... })` 中应用。
- `runAiAutoBattleBatch` 默认会把批量 summary 记录到 `localStorage` 的 AI 调参历史；`summary.strategyTuning` 仍是单批建议，`strategyTuningRecommendation` 是基于历史多批加权平均并按 learning rate 平滑后的稳定建议。
- `runAiAutoBattleBatch({ seed: "name", games: N })` 会为每局派生稳定 seed；`runAiStrategyABTest({ seed, games, tunedWeights/strategyTuning })` 会用同一组 seeds 分别跑 baseline 与 tuned，返回平均分、完成率、阻塞数、行动占比、胜者画像差异、路线目标分布差异和移动后续主行动分布差异，并默认把 A/B 结论作为 `kind: "ab-test"` 历史条目写入调参历史。
- `runAiStrategyTuningCycle({ seed, games, abGames })` 会先用当前权重跑 baseline 批量、从日志生成推荐权重，再用同 seed A/B 验证 baseline 与 tuned；默认只返回 `selectedWeights`，不直接改变当前权重，传 `applySelectedWeights: true` 时才应用 A/B 胜出的权重。
- A/B 历史条目会记录 `selectedVariant`：tuned 胜出时把 tuned 权重作为正向证据，tuned 未胜出时把 baseline 权重作为回拉证据；`getAiStrategyTuningRecommendation()` 会把这类条目和普通批跑条目一起加权平滑。
- 当前策略已从固定行动优先级推进到候选收益主导：行动类型只保留轻量 tie-breaker，实际选择主要看 `candidate.score`、可研究科技最高分、可打手牌最高分、路线移动收益和成本。主行动前的快速移动会额外估算移动后可接的环绕/登陆收益，`launch` 候选也会估算发射后的后置快速移动价值；科技候选会生成 `tech-synergy` 计划，把橙科/紫科/蓝科分别绑定到移动/登陆、扫描、任务/终局引擎需求；打牌候选会生成 `card-synergy` 计划，把发射、移动、环绕、登陆、科技、扫描、任务和终局效果绑定回当前 `routeDemand`；3 型终局牌会复用 `end-game-scoring` 的规则按当前局面估算 `endGameExpectedScore`；玩家达到 25/50/70 分门槛时，AI 会自动处理 `final-score-mark`，按当前公式即时分、未来路线需求、剩余轮数潜力与板块卡位价值选择 A/B/C/D，避免终局标记停在人工 pending 流程，也避免只看裸主要行动收益。公司主动、未来跨度目标牌、外星人专属手牌与更复杂的外星人分支仍按后续里程碑收口。
- 当前 `app.js` 已有轻量 `routeDemand`：从玩家手牌、保留任务/触发器、终局牌和已标记终局板块推导扫描颜色、目标星球、探测器位置目标、远离地球目标、科技颜色、痕迹、任务和终局需求，并按当前 `strategyWeights` 反向影响发射、移动、环绕、登陆、扫描、科技、打牌和 PASS 倾向。

---

## 13. 验证

```powershell
node --check randomizer/app.js
node --check randomizer/game/ai/battle-analytics.js
node randomizer/game/ai/ai.test.js
$tests = rg --files randomizer | Where-Object { $_ -match '\.test\.js$' } | Sort-Object; foreach ($test in $tests) { node $test; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE } }
```

浏览器 smoke：

- 默认人机入口：刷新 `randomizer/index.html` 后，初始选择阶段为 `player-white` 人类 + 1 名随机颜色电脑，状态面板显示 `玩家代理 白色=人类、<随机色>=电脑`。
- 多电脑入口：2 名 AI 玩家、`maxSteps=2500` 可跑完整局；当前记录为 183 step 结束、`bugCount=0`，覆盖到 `alien-trace`。

---

## 14. 数据驱动优化路线

基础主要行动的裸收益不高，因此策略迭代不应继续堆固定行动优先级，而应先用自动局日志建立基线，再逐项优化。

建议循环：

1. 跑一批 AI 自博弈：`runAiAutoBattleBatch({ games: 20, activePlayerCount: 2, maxSteps: 2500, stepDelayMs: 0, maxBugRepeats: 1 })`。
2. 查看批量 `summary`，并对单局 `samples[].analysis` 记录 `actionCategoryRatios`、`candidateStats`、`candidateScoreStats`、`scoreOpportunities`、`topScoreGaps`、`opportunities`、`routeTargets`、`moveFollowups`、`turnPlans`、`turnPlanTypes`、`turnPlanActions`、`finalScoreMarks`、`finalScoreFormulas`、`winnerProfileDeltas`、`strategyTuning`、`winner.finalScore` 和 `bugs`。
3. 优先修正指标异常：
   - `basicMain` 占比高且 `engine` 占比低：提高卡牌、科技、终局板块对行动评分的权重。
   - `passWithAvailableMain > 0`：为 PASS 增加机会成本，只有收入/轮序收益明显更高时才 PASS。
   - `playCard.availableNotSelected` 或 `researchTech.availableNotSelected` 远高于 selected：细化卡牌/科技价值模型。
   - `topScoreGaps` 或 `candidateScoreStats.*.missedAsBest > 0`：检查对应行动的候选分、顶层行动基础偏置和 `policy.chooseTurnAction()` 是否一致。
   - `endTurnWithAvailableMove > 0` 或移动占比高：继续扩展目标导向路线评分，把移动绑定到更多任务牌、终局目标和可由特殊效果影响的路线目标。
   - `finalScoreImmediateValue` 胜者领先或 `finalScoreMarks` 集中在少数公式：检查对应公式的行动需求是否已经接入 `routeDemand`，并用 A/B 验证 `final` 权重。
4. 多批次后读取平滑建议：`getAiStrategyTuningRecommendation({ learningRate: 0.5 })`；需要直接应用时调用 `applyAiStrategyTuningRecommendation({ learningRate: 0.5 })`。
5. 也可以显式应用上一批建议跑下一批：`runAiAutoBattleBatch({ games: 20, activePlayerCount: 2, maxSteps: 2500, stepDelayMs: 0, maxBugRepeats: 1, strategyTuning: previous.summary.strategyTuning })`。
6. 对调参结果做同 seed A/B：`runAiStrategyABTest({ seed: "route-v1", games: 10, activePlayerCount: 2, maxSteps: 2500, tunedWeights: recommendation.weights })`；默认会返回 `strategyABHistoryEntry` 并写入历史，若只想试跑可传 `recordABResult: false`。
7. 常规迭代可直接用 `runAiStrategyTuningCycle({ seed: "route-v1", games: 20, abGames: 10, activePlayerCount: 2, maxSteps: 2500 })`，它会自动完成“基线日志 -> 推荐权重 -> 同 seed A/B”；需要让胜出权重成为当前策略时再加 `applySelectedWeights: true`。
8. 每次策略调整后跑同样批量，比较完成率、平均胜者分、行动占比、`winnerProfileDeltas`、路线目标分布、移动后续主行动分布、组合计划类型/目标动作分布、候选分数差分布、`strategyTuningRecommendation`、A/B `comparison.verdict`、`selectedVariant` 和 bug 变化。

优先级：

1. **第一轮已落地**：`policy.js` 不再用大额固定行动分压过候选收益，`app.js` 会为 `launch` / `orbit` / `land` / `scan` / `researchTech` / `playCard` / `move` 生成动态分。
2. **目标导向移动已落地基础版**：移动候选会根据到星球目标、探测器位置任务（小行星、彗星、地球相邻、地球相邻小行星）和远离地球目标的距离变化、可环绕/登陆价值和移动成本评分；移动目标会进入单局和批量 `routeTargets` 指标。下一步继续补充特殊卡牌/外星人触发带来的路线目标。
3. **卡牌价值模型已落地基础版**：`playCard` 候选会综合即时效果、保留任务/触发、终局牌当前预期分、冥王星牌、资源成本、左上角快速行动机会成本和 `card-synergy` 组合计划；下一步按具体卡牌任务完成概率、触发器可达性和终局公式未来潜力调权重。
4. **科技价值模型已落地基础版**：按橙/紫/蓝类型、bonus、首拿奖励、当前资源和剩余轮数评分；下一步让路线意图反向影响科技偏好，例如扫描路线加权紫科、登陆路线加权橙科。
5. **扫描目标模型已落地基础版**：主扫描行动、公共牌扫描、手牌扫描和扫描目标弹窗会复用星云目标评分；下一步把具体任务牌颜色/星云需求、终局扇区奖励和对手阻断收益纳入评分。
6. **路线需求模型已落地基础版**：玩家当前任务、触发器、终局牌和已标记终局板块会形成 `routeDemand`，统一影响行动评分。
7. **日志调参闭环已落地基础版**：`winnerProfileDeltas` 会生成 `strategyTuning.weights`，其中 `routeTargetCount`、`moveFollowupCount` 和 `turnPlanCount` 会反向提升 `route` / `move` / `orbitLand` / `engine` 权重；`cardSynergyCount`、`techSynergyCount`、`planScanCount`、`planTaskCount`、`planFinalCount` 等会继续把组合计划归因到打牌、科技、扫描、任务和终局路线；`finalScoreMarkCount` 与 `finalScoreImmediateValue` 会把终局板块标记质量归因到 `final` / `engine`；`candidateScoreStats` 会把“最高分但未选”的候选按行动类型归因，便于判断是评分偏低还是顶层策略偏置过强；建议可通过 API 或下一批 options 应用。
8. **多批历史平滑已落地基础版**：批跑结果会记录到调参历史，`getAiStrategyTuningRecommendation()` 会对多批建议加权平均并用 learning rate 平滑；普通批跑和 A/B 对照会一起参与稳定推荐。
9. **同 seed A/B 对照已落地基础版**：`runAiStrategyABTest()` 会用相同 seeds 比较 baseline 与 tuned 的平均分、完成率、阻塞数和路线画像差异，并把 A/B 胜负结果反写进历史权重置信度。
10. **调参循环 API 已落地基础版**：`runAiStrategyTuningCycle()` 会先采集 baseline 批量日志，再把推荐权重放进同 seed A/B 验证，返回 `selectedVariant` / `selectedWeights`；默认不改变当前权重，避免单批噪声直接污染策略。
11. **浅搜索已落地第一步**：主行动前的快速移动会只读估算移动后可接的环绕/登陆价值，并把目标写入 `moveFollowups`；`launch` 会只读估算发射后可接的一格快速移动；`researchTech` 会按当前任务/终局/路线需求生成 `tech-synergy` 计划；`playCard` 会按卡牌效果生成 `card-synergy` 计划；`final-score-mark` 会按当前公式和未来需求只读评分；这些组合都会写入日志。完整浅搜索仍待实现，需要在可回滚快照上评估“快速行动 -> 主行动 -> 后置快速行动 -> end-turn”的一回合组合。

---

## 15. 风险与待确认

- **多玩家轮次**：2 人 AI smoke 已跑通；后续仍需在 seeded RNG 完成后扩大到多种种子和更多玩家数。
- **不可撤销步骤**：翻外星人牌、随机抽牌等被标记 `irreversible`，限制深搜回退；启发式 + 浅前瞻规避。
- **外星人/公司牌分支**：子决策极多，是收口工作量主要来源（放在 M3）。
- **卡牌迁移状态**：部分卡仍可能存在 `deferred`/`partial` 建模；以 `docs/card-modeling-dsl-spec.md`、`assets/cards/card_model.csv`、`randomizer/game/cards/**` 和对应测试为准，AI 估值需处理未完全实现的效果。
