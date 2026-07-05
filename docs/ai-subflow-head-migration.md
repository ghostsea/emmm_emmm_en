# AI 子流程头迁移记录（2026-06-27）

本文档记录本次“先保留回合级训练，再为未来子流程决策头预留结构”的改造结果，以及后续扩展策略。

## 1. 改造目标

在不打断现有 hard/expert 训练与运行链路的前提下，完成以下能力预留：

1. 样本结构可以同时表示回合级决策与子流程决策。
2. 观测结构可以显式表达 pending 子流程上下文。
3. 策略接口可以在 turn/subflow 两种决策层级间切换。
4. 当前行为克隆仍保持“仅回合级”训练语义，避免分布突变。

## 2. 已完成改造

### 2.1 数据结构（Dataset / Recorder）

已将训练样本 schema 升级为 v2，并保留旧字段兼容：

1. 新增 `schemaVersion=2`。
2. 新增 `actionLevel`（`turn`/`subflow`）。
3. 新增 `decisionType`（例如 `turn-action`，后续可扩展到 `scan-target`/`move-payment` 等）。
4. 新增 `policyTargetV2`（包含 `actionLevel`、`decisionType`、`targetKey` 与扩展定位字段）。
5. 新增 `observationEnvelope`（包含 `decisionContext`、`observation`、`legalActions`）。

对应文件：

1. [tools/generate_self_play_dataset.js](tools/generate_self_play_dataset.js)
2. [randomizer/game/ai/data-recorder.js](randomizer/game/ai/data-recorder.js)

### 2.2 观测结构（Observation）

观测对象从 v1 升级到 v2：

1. 新增 `decision` 区块。
2. 包含 `actionLevel`、`decisionType`、`pendingState`、`pendingScanTargetType`。

对应文件：

1. [randomizer/game/ai/observation.js](randomizer/game/ai/observation.js)
2. [randomizer/game/ai/policy-network.js](randomizer/game/ai/policy-network.js)

说明：策略网络输入维度默认由 24 调整为 32，以容纳决策上下文信号；仍保留补零/截断逻辑，兼容已有调用。

### 2.3 策略接口（Policy / Legal Actions）

新增 decision-level 统一入口，同时保留旧接口：

1. Legal actions 增加 `buildDecisionActionList` / `buildDecisionActionMask`。
2. Policy 增加 `chooseDecisionAction` / `chooseSubflowAction`。
3. 旧接口 `chooseTurnAction`、`buildLegalActionList` 继续可用。

对应文件：

1. [randomizer/game/ai/legal-actions.js](randomizer/game/ai/legal-actions.js)
2. [randomizer/game/ai/policy.js](randomizer/game/ai/policy.js)

### 2.4 行为克隆兼容

行为克隆读取已兼容新 schema，并明确维持“当前只训回合级”：

1. 读取 `policyTargetV2`（若无则回退 `policyTarget`）。
2. 仅当 `actionLevel==="turn"` 时纳入训练记录。

对应文件：

1. [randomizer/game/ai/behavior-cloning.js](randomizer/game/ai/behavior-cloning.js)

### 2.5 测试与验证

本次改造后已通过：

1. `node --check`（相关文件）
2. `node randomizer/game/ai/ai.test.js`

测试文件已同步更新 schema 版本断言：

1. [randomizer/game/ai/ai.test.js](randomizer/game/ai/ai.test.js)

## 3. 当前兼容性结论

1. 现有训练入口可继续直接使用。
2. 现有“回合级动作头”语义不变。
3. 新增字段为向后兼容的增量扩展，不会要求立刻重训所有流程。

## 4. 后续扩展策略（建议执行顺序）

### 阶段 A：采样扩展（不改模型头）

目标：先让数据具备子流程监督来源。

1. 在数据生成侧加入 `decisionLogTypes` 白名单参数。
2. 默认仍只导出 `turn-action`，可选开启 `scan-target`、`move-payment`、`alien-use`。
3. 每类子流程样本增加 `pendingState` 摘要与候选数量统计。

完成标准：在不开启白名单时，样本分布与当前一致；开启后新增样本可独立统计。

### 阶段 B：双头训练（turn + subflow）

目标：不破坏 turn 头，新增 subflow 头并逐步启用。

1. 训练脚本增加 `actionLevel` 条件分支。
2. 先训练一个共享骨干 + 双分类头。
3. loss 采用分层加权，先给 turn 头更高权重，避免性能回退。

完成标准：turn 指标不降，subflow 头在离线验证集可超过启发式基线。

### 阶段 C：运行时灰度接管

目标：把子流程选择从启发式逐步切到模型。

1. `ai-controller` 中按 `decisionType` 灰度开关。
2. 先接管分支稳定、候选规模可控的子流程。
3. 保留启发式 fallback 与 fail-fast 防护。

完成标准：`app-full` 自博弈中 blocked 不上升，平均分与胜者均分不回退。

### 阶段 D：MCTS 子流程展开（可选强化）

目标：把部分关键子流程从“策略直接选”升级到“搜索选”。

1. 在 rule-engine 模拟中把子流程候选显式建模为 legal actions。
2. 控制分支宽度（top-k/progressive widening）。
3. 仅对高价值分支启用深展开，避免算力爆炸。

完成标准：单位时间决策质量提升，且不会造成明显吞吐下降。

## 5. 风险与回退

1. 分布偏移：子流程由启发式切模型时，短期质量可能波动。
2. 动作空间膨胀：若不做候选裁剪，训练与搜索开销会快速增大。
3. 兼容性风险：新增字段必须保持非破坏性，旧消费端不能崩溃。

回退策略：

1. 白名单关闭子流程样本导出。
2. 运行时按 `decisionType` 单独回退到启发式。
3. 保留 turn-only 训练配置作为稳定 fallback。

## 6. 后续协作约定

1. 新增/修改样本字段时，必须同步更新本文件与测试断言。
2. 子流程头相关改造统一记录在本文件“阶段进度”小节（后续追加）。
3. 每轮改造完成后至少执行：
   - `node --check randomizer/app/ai-controller.js`
   - `node randomizer/game/ai/ai.test.js`
