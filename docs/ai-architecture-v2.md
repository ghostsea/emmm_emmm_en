# AI 电脑玩家架构设计 v2（决策与价值模型）

本文件是电脑玩家（AI 自动机）的**权威架构与路线文档**，后续开发以本文为准。

- v1（`docs/ai-player-design.md`）固化的是**接口契约层**（GameState 视图、决策总线 `requestDecision`、`PlayerAgent`、`enumerateLegalActions`、回合驱动器、seeded RNG）。这部分**继续有效，不重复**，本文直接引用。
- v2 重写的是**“大脑”层**：价值模型、目标系统、回合规划器，以及它们如何把“当前可行动内容的实时成本/收益”和“长线达成目标的动态收益”统一成一条决策链路。
- v2 的核心修正点（相对当前实现）：
  1. **收入价值要扣掉丢牌成本**：一次收入提升会弃 1 张手牌，价值 = 资源价值×剩余可享受次数 − 被弃牌价值。
  2. **价值以“动态实时框架单位”计算**：每次决策实时枚举可行动内容并算 `净收益 = 收益 − 成本`；长线收益（完成扇区 / 凑 6 数据分析 / 登陆等）按**当前可达性**动态加权，且因对手行动而实时变更。
  3. **终局板块标记后围绕高价值终局计分行动**：标记 25/50/70 后，凡能推进所标记 a/b/c/d 公式的行动，在原收益上叠加对应位次倍率的终局边际分。

> 机制、状态模型或接口变化时，请同步本文与 `AGENTS.md`（见 `AGENTS.md` 约定）。

---

## 1. 为什么需要 v2

当前 AI 是“单步贪心 + 被动 routeDemand”，主要短板（基于 `game/ai/policy.js`、`evaluator.js` 和 `app.js` 的 `scoreAi*` 链）：

| 短板 | 现状 | v2 对策 |
|------|------|---------|
| 价值口径分散、常数手写 | 估值散落在 `evaluator.RESOURCE_VALUES` 与十几个 `scoreAi*` | 收口为单一 **行动收益/成本图谱**（§3、§4） |
| 收入估值偏高 | `getIncomeValue` 只乘剩余轮次，未扣丢牌成本 | **收入净值**公式（§3.3） |
| 只有单步边际分 | 取候选最大分，不规划多步兑现链 | **回合浅前瞻**（§6） |
| 无显式目标 | `routeDemand` 被动反推偏好 | **目标系统**（§5）：首痕迹三策略 / 第一轮 25 分 / 长线达成 |
| 终局板块利用不足 | 仅在达阈值时处理 `final-score-mark` | 标记后**全程叠加终局边际价值**（§4.4） |
| 行动覆盖窄 | `canAiResolvePlayCardEffects` 大量 `unsupportedTypes`、排除外星人卡 | 按目标价值排序逐步收口（§7） |

---

## 2. 总体架构

四层，自下而上，每层纯函数化、可单测、可日志化：

```
┌─────────────────────────────────────────────────────────┐
│ L4 目标系统 Goals            game/ai/goals.js             │ 开局选定 + 轮内复评
│   首痕迹(黄/粉/蓝) / 第一轮25分 / 完成扇区 / 6数据分析 / 登陆 │
├─────────────────────────────────────────────────────────┤
│ L3 回合规划器 Planner        game/ai/planner.js           │ 浅前瞻(深2~3, beam)
│   枚举“快速→主→后置快速→end/pass”链，选整条链净值最优      │
├─────────────────────────────────────────────────────────┤
│ L2 行动收益图谱 ActionGraph  game/ai/action-graph.js      │ 动态实时单位
│   每个候选 -> {gain, cost, net, prereqChain, breakdown}   │
├─────────────────────────────────────────────────────────┤
│ L1 价值模型 Valuation        game/ai/valuation.js         │ 单一估值口径
│   资源折算 / 收入净值 / 终局边际 / 状态估值                 │
└─────────────────────────────────────────────────────────┘
        ▲ 复用 v1 接口：GameState 视图 / legal-actions / decision-bus / PlayerAgent
```

数据流（一次决策）：

```
GameState 快照
  → L4 给出当前激活目标与权重（含对手影响后的可达性）
  → L2 对每个 legal action 实时算 net（含终局边际、目标加权）
  → L3 用 L2 估值做浅前瞻，选整条回合链
  → 经 v1 decision-bus 执行，子决策再回到 L2/L4 估值
  → battle-analytics 记录 breakdown，供调参与路径挖掘
```

设计约束（沿用 v1）：估值只读、克隆 `createGameRecoverySnapshot()`（`app.js:1159`）做“试一步→回退”；`irreversible` 步骤不进搜索回退，遇到用启发式即时决策。

---

## 3. L1 价值模型（单一估值口径）

集中在 `game/ai/valuation.js`，把 `docs/行动成本和收益.md` 完整编码，替换分散的常量。

### 3.1 资源折算单位

| 资源 | 价值（分） | 来源 |
|------|-----------|------|
| 1 分 | 1 | — |
| 1 信用点 / 1 能量 / 1 精选 | 3 | 收益文档 1 |
| 1 移动 / 1 数据 / 1.5 宣传 | 1.5 | 收益文档 2 |
| 1 信号（含数据） | 3 | 收益文档 3 |
| 普通手牌 | ≈ 3（≈ 1 盲抽） | 收益文档 6 |
| 外星人卡 | ≈ 4 | 收益文档 4 |

> 口径统一后，调参从“改十几个魔法数字”变为“改一张表”，且每个候选可输出 `breakdown` 便于解释。

### 3.2 状态估值

`evaluate(state, playerId)` = 终局/实时分（复用 `endGameScoring.computePlayerFinalScore`，`end-game-scoring.js`）+ 资源折算 + **收入净值** + 手牌价值 + 保留牌价值 + **已激活目标的期望达成值**。

### 3.3 收入净值（★ 核心修正）

机制（`mechanics-reference.md`）：一次“收入提升”要**弃 1 张手牌**，按该牌收入角标提升收入档；提升后的收入在之后每个收入结算点都生效。

错误现状：`evaluator.getIncomeValue` 仅 `资源价值 × 剩余倍率`，**未扣丢牌成本**，导致高估收入类行动。

v2 公式（评估“获得 +ΔR 收入”这一行为的净值）：

```
incomeNet(ΔR) = resourceValue(ΔR) × remainingIncomeTimes(round) − discardedCardValue
```

- `resourceValue(ΔR)`：本次提升的收入资源折算（如 +1 信用 = 3 分/次）。
- `remainingIncomeTimes(round)`：该收入还能享受几次。第一轮 4 次（获得当次 + 第 2/3/4 轮各一次），逐轮递减（收益文档 5）。注意 PASS 轮的收入结算细节（第 4 轮 PASS 不获得收入，见 `mechanics-reference.md`）要并入次数计算。
- `discardedCardValue`：被弃手牌价值。估值时取“AI 实际会弃的那张”的价值（通常是当前手里最低价值的牌，但不低于普通牌基准 ≈ 3）。**这是相对 v1 新增的减项。**

推论：收入在**早轮**且**手牌富余**时才划算；晚轮或手牌紧张（接近上限/缺关键牌）时收入净值可能为负，AI 应少做。

### 3.4 行动成本要算全链

环绕/登陆的成本 = **发射 + 移动 + 行动本身**（收益文档 7）。移动步数过高的星球，收益往往补不回成本。无紫科的主行动扫描成本 ≈ 1 信用 + 2 能量 = 9 价值、裸收益仅 2 信号，需依赖 2 号数据位、赢扇区、紫科加成才转正（收益文档 9）。L2 图谱必须把前置链成本并入候选 `cost`。

---

## 4. L2 行动收益图谱（动态实时单位）

`game/ai/action-graph.js`：把“当前可行动内容”实时映射为统一候选结构。**每次决策都重算**，因为对手行动会改变成本/收益（星球登陆位被占、扇区被别人完成、痕迹被抢）。

### 4.1 候选结构

```
ActionCandidate = {
  id,                 // launch | orbit | land | analyze | scan | playCard | researchTech | move | industry | quickTrade | pass | end-turn
  gain,               // 直接收益（资源/分/信号，按 §3.1 折算）
  cost,               // 全链成本（含前置发射+移动，按 §3.4）
  prereqChain,        // 兑现所需的前置步骤（用于 L3 浅前瞻）
  finalMarginal,      // 终局板块边际价值（§4.4），无标记时为 0
  goalBonus,          // 激活目标加权（§5）
  feasibility,        // 0~1，可达性（受对手影响，§4.3）
  net,                // = (gain + finalMarginal + goalBonus) × feasibility − cost
  breakdown,          // 各项明细，进日志
}
```

`net` 是决策主依据，`breakdown` 是可解释性与调参依据。

### 4.2 实时枚举

来源沿用 v1 `enumerateLegalActions` 与现有判断（`actions.canExecute`、`scanEffects.canExecuteScan`、`data.canAnalyzeData`、`quickTrades.canExecuteTrade`、`canStartMainAction()` 等）。图谱层只读，不改状态。

### 4.3 长线目标的动态收益（★ 受对手影响）

“完成扇区 / 凑 6 数据分析 / 登陆某星球”这类**跨多回合**的收益，不能当成固定常数，要按**当前可达性**动态折算，并随对手行动实时更新：

- **完成扇区**：价值 = 完成时收益（含 b2 终局、扫描奖励）× 进度系数。当某扇区被对手抢先完成或填满时，剩余收益下降甚至清零 → `feasibility` 实时回落。
- **凑 6 数据分析**：价值随“距离 6 还差几个数据”递增（越接近越高）；若数据来源（星云/扫描机会）被对手消耗，达成概率下降。
- **登陆 / 环绕特定星球**：登陆位有限，被占则该目标 `feasibility → 0`，AI 应及时改道。
- **首痕迹**：见 §5；被他人抢占后对应目标价值清零。

实现要点：长线目标在 L4 维护“期望达成值 + 当前进度 + 可达性”，L2 把“推进该目标的行动”按**边际进度**折算进 `goalBonus`/`finalMarginal`，而非一次性给满。

### 4.4 终局板块边际价值（★ 标记 25/50/70 后）

终局板块 a/b/c/d 在玩家分数达 **25 / 50 / 70** 时各标记一次，位次（1/2/3 及之后）决定倍率（`assets/final/final_detail.md`）。标记后，凡推进对应公式的行动都要在原收益上叠加 `finalMarginal`：

```
finalMarginal(action) = Σ_overMarkedTiles  positionMultiplier(tile) × marginalUnitDelta(tile, action)
```

各公式的“边际单位”与受影响行动：

| 板块 | 公式要义 | 推进该公式的行动 | 边际注意 |
|------|----------|------------------|----------|
| a1 | 收入中信用/能量较多者 | 提升信用或能量收入 | 只对“较多的那侧”加分 |
| a2 | 信用/能量/盲抽收入最小值 | 提升当前最小的那项收入 | min 型：只对短板加分 |
| b1 | 三色痕迹最小值 | 放置当前最少颜色的痕迹 | min 型：补短板 |
| b2 | min(环绕+登陆, 完成扇区) | 环绕 / 登陆 / 完成扇区 | min 型：补较少的一侧 |
| c1 | 完成任务数（1+2 型） | 完成任务牌 | 线性 |
| c2 | (完成任务+终局牌)/2 向下取整 | 完成任务 / 打终局牌 | 每 2 个才 +1 单位 |
| d1 | 三色科技最小值 | 研究当前最少颜色的科技 | min 型：补短板 |
| d2 | 科技总数/2 向下取整 | 研究任意科技 | 每 2 个才 +1 单位 |

关键：**min 型与“除 2 取整”型公式是非线性的**——边际分取决于当前计数，必须用“做完该行动后公式值 − 当前公式值”实时计算，不能用平均常数。位次倍率越高（1 号位）的板块，对应行动越要多做（收益文档 8）。

---

## 5. L4 目标系统

`game/ai/goals.js`：把开局意图固化为显式目标对象，**开局选定 1~2 个主目标，轮内复评可达性**，避免每步重算导致摇摆。

### 5.1 目标接口

```
Goal = {
  id, priority,
  progress(state),            // 当前进度 0~1
  feasibility(state),         // 当前可达性 0~1（受对手影响实时变化）
  expectedValue(state),       // 达成期望分（× feasibility）
  bonusFor(candidate, state), // 该候选对本目标的边际贡献 -> goalBonus
}
```

### 5.2 内置目标

- `FIRST_ROUND_SCORE_25`：跟踪实时分与 25 的差距，对“能直接加分/凑分链”的候选加 `goalBonus`；与首痕迹目标协同（首痕迹本身 ≈ 5 分 + 宣传 + 卡，收益文档 10）。
- `GRAB_TRACE_YELLOW`（抢登陆）：目标星球登陆链高优先；黄痕迹竞争激烈，`feasibility` 随对手逼近而下降。
- `GRAB_TRACE_PINK`（赢扇区扫描）：目标“本轮赢一个扇区扫描”，把扫描/数据投放绑定到该扇区。
- `GRAB_TRACE_BLUE`（6 数据分析）：目标“尽快凑 6 数据并分析”，把数据获取与分析行动连成引擎。
- `FINAL_TILE_FOCUS`：达 25/50/70 标记后激活，把 §4.4 的 `finalMarginal` 提升为高优先目标导向。

### 5.3 开局规划

读公司牌 / 起始牌 / 初始手牌，评估：哪条首痕迹可行（黄/粉/蓝）、第一轮能否摸到 25 分、能否实现“4 数据收入 / 6 数据分析”（收益文档 11）。选定主目标后写入 L4，供后续每回合候选评分叠加。

---

## 6. L3 回合规划器（浅前瞻）

`game/ai/planner.js`：用 `createGameRecoverySnapshot()` 做“试一步→回退”，深度 2~3、受限宽度的 beam search：

- 枚举一回合内“快速行动 → 主行动 → 后置快速行动 → end-turn/PASS”的组合链，用 L1 `evaluate` 估每条链的终局状态价值，选**整条链净值最优**而非单步最优。
- 重点解决“发射 → 移动 → 登陆/环绕”这类需多步兑现的高收益链（当前打不出高分的主因）。
- `irreversible`（翻外星人牌、随机抽牌）不进回退，用启发式即时决策（v1 §15）。
- PASS 作为候选显式权衡：轮序、收入净值（§3.3）、剩余主行动机会成本。

---

## 7. 行动覆盖扩展

逐步消化 `canAiResolvePlayCardEffects` 的 `unsupportedTypes` 与外星人卡（`isAiSupportedHandPlayCard` 现全排除），**按对当前激活目标的价值排序**优先收口（先扫描/登陆/数据相关）。每收口一类在 `game/ai/ai.test.js` 加回归。

---

## 8. 模块与文件结构

```
game/ai/
├─ valuation.js        # ★新增 L1：资源折算 / 收入净值 / 终局边际 / 状态估值
├─ action-graph.js     # ★新增 L2：实时候选 {gain,cost,net,breakdown}
├─ planner.js          # ★新增 L3：回合浅前瞻
├─ goals.js            # ★新增 L4：目标系统 + 开局规划
├─ evaluator.js        # 收敛进 valuation 后保留薄封装/兼容层
├─ policy.js           # 子决策选择改为调用 action-graph/valuation
├─ battle-analytics.js # 增补“胜者前 N 回合行动序列”频繁模式挖掘
└─ ai.test.js          # 逐项回归
```

v1 的 decision-bus / player-agent / legal-actions / controller / seeded RNG **保持不变**，本文不重复其契约（见 `docs/ai-player-design.md` §3~§9）。

---

## 9. 自博弈与日志挖掘

复用 `runAiAutoBattleBatch` / `runAiStrategyABTest` / `runAiStrategyTuningCycle`，并增强“从高分日志反推可复用路径”：

1. 批量自博弈，按最终分分桶，抽取**高分局（>25 / 抢到首痕迹）**完整序列。
2. `battle-analytics.js` 增加**胜者前 3 回合行动序列**频繁模式统计（当前 `winnerProfileDeltas` 偏聚合、缺序列维度）。
3. 把高频高分序列固化为 L4 的**开局剧本（opening book）**，开局优先尝试已验证路径。
4. 同 seed A/B 验证；图谱常量 + 目标权重 → 自博弈 → 日志挖掘 → A/B → 回灌，形成可解释闭环。

每个候选的 `breakdown`（gain/cost/finalMarginal/goalBonus/feasibility）入日志，使调参从“猜权重”变为“看明细”。

---

## 10. 落地路线图

| 阶段 | 内容 | 验收 |
|------|------|------|
| P0 | `valuation.js` 收口估值口径 + **收入净值修正**；现有 `scoreAi*` 改调它 | `ai.test.js` 通过，自博弈分不退化；收入类行动占比合理下降 |
| P1 | `action-graph.js` 实时候选 + `breakdown`；**终局板块边际价值**叠加 | 标记 25/50/70 后 AI 明显围绕标记板块行动 |
| P2 | `goals.js` + 开局规划：首痕迹三策略 / 第一轮 25 分 | 自博弈中 AI 倾向抢首痕迹、第一轮分提升 |
| P3 | `planner.js` 浅前瞻（发射→移动→登陆链） + 长线目标动态可达性 | 高分局占比上升，同 seed A/B 胜出 |
| P4 | 行动覆盖扩展（unsupportedTypes / 外星人卡按目标价值排序收口） | 候选可用率上升，bug=0 |
| P5 | 日志序列挖掘 + 开局剧本回灌 | 复用模板带来稳定分数提升 |

---

## 11. 验证

```powershell
node --check randomizer/app.js
node --check randomizer/game/ai/valuation.js
node --check randomizer/game/ai/action-graph.js
node randomizer/game/ai/ai.test.js
$tests = rg --files randomizer | Where-Object { $_ -match '\.test\.js$' } | Sort-Object; foreach ($test in $tests) { node $test; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE } }
```

浏览器 smoke 与批跑入口沿用 v1 §13 / `runAiAutoBattleBatch`。

---

## 12. 与 v1 的关系

- v1 = 接口契约层（**继续有效**）。v2 = 大脑层（**本文为准**）。
- v1 §7 估值器与 §14 数据驱动优化路线被本文 §3/§4/§9 取代；其余（§3~§6、§8~§10 收口顺序、§15 风险）继续适用。
- 后续开发以本文路线图（§10）为准；机制变化同步更新本文与 `AGENTS.md`。
