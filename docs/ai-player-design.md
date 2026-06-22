# AI 电脑玩家设计（接口契约）

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
| 回合编排 | 全在 `app.js`（~2.5 万行），与 DOM 强耦合 | **主要障碍** |
| 玩家选择 | 通过 30+ 个 `pending*` 状态 + DOM overlay 收集 | **必须收口** |
| 合法行动 | 无统一 `getLegalActions`，判断散落在 `updateActionButtons()` 与各 `canExecute*` | 需新建聚合层 |
| 随机性 | 全局 `Math.random`，无统一种子（部分函数已支持注入 `random`） | 需可注入 RNG |

**本质判断**：当前是「带撤销的交互式 UI 壳」，不是「无头游戏引擎」。接 AI 的关键不是先写"大脑"，
而是先把"等人点击"反转为"引擎向玩家代理请求一个决策"的统一通道。

---

## 2. 分层与文件结构

```
randomizer/
├─ app.js                       # UI 壳：交互点改走 requestDecision；轮到 AI 时由 controller 接管
├─ game/**                      # 规则内核（基本不动；仅补 enumerate / 纯函数化 / 可注入 RNG）
└─ game/ai/                     # ★ 新增：电脑玩家
   ├─ player-agent.js           # PlayerAgent 接口 + HumanAgent / AIAgent
   ├─ decision-bus.js           # requestDecision 通道（收口所有 pending*）
   ├─ legal-actions.js          # enumerateLegalActions(state, playerId)
   ├─ evaluator.js              # 价值模型 → 状态估值（复用 行动成本和收益.md）
   ├─ policy.js                 # 启发式贪心：回合规划 + 子决策选择
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
- `window.SetiRandomizer` 暴露 `configureAiAutoBattle`、`startAiAutoBattle`、`stopAiAutoBattle`、`runAiAutoBattleStep`、`getAiAutoBattleReport`。
- 已支持 AI 自动初始选择、初始收入弃牌、PASS 手牌上限弃牌、PASS 预留精选、效果链逐步执行、基础 `launch` / `pass` / `end-turn` 决策。
- `getAiAutoBattleReport()` 记录 AI 步骤日志与 bug/阻塞日志；重复阻塞会累计 `repeatCount`，便于后续定位和修复。
- 当前策略仍是最小闭环：主动行动优先 `launch`，不可发射则 `PASS`；扫描、打牌、科技、移动、环绕/登陆、公司主动与外星人专属选择仍按后续里程碑收口。

---

## 13. 验证

```powershell
node --check randomizer/app.js
node randomizer/game/ai/ai.test.js
$tests = rg --files randomizer | Where-Object { $_ -match '\.test\.js$' } | Sort-Object; foreach ($test in $tests) { node $test; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE } }
```

---

## 14. 风险与待确认

- **多玩家轮次**：现状偏单活跃玩家，≥2 人在无 UI 干预下的回合切换需回归确认。
- **不可撤销步骤**：翻外星人牌、随机抽牌等被标记 `irreversible`，限制深搜回退；启发式 + 浅前瞻规避。
- **外星人/公司牌分支**：子决策极多，是收口工作量主要来源（放在 M3）。
- **卡牌迁移状态**：部分卡仍 `deferred`/`partial`（见 `docs/card-ability-migration-plan.md`），AI 估值需处理未完全实现的效果。
