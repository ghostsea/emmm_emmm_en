# Replay 混合、防漂移与淘汰机制实施计划

## 目标

- 在现有迭代训练流程中引入“三源训练集混合”：本轮新局 + 近几轮回放 + 历史精选局，降低单轮自博弈随机偏移风险。
- 引入历史精选局淘汰机制，避免 replay 数据无限增长与陈旧样本积压。
- 保持与现有 JSONL 样本 schema 兼容，不要求重跑历史数据。
- 在不改动训练器输入格式的前提下，增强 replay 的质量、时效性与多样性。

## 现状与待改造点

当前流程位于 `tools/iterative_self_play_training.sh`：

- 每轮生成 `round-N.new.jsonl`。
- 以 `MIX_OLD_RATIO` 从 `replay-dataset.jsonl` 随机抽取旧样本，与新样本拼成 `round-N.mixed.jsonl`。
- 候选模型接受后，将 `round-N.mixed.jsonl` 直接覆盖为新的 replay 数据集。

相对目标的当前缺口：

- replay 池当前由“本轮随机采样结果”主导，尚未引入显式淘汰策略。
- 目前尚无“近几轮优先”混合层，训练集对近期趋势的吸收稳定性不足。
- 当前尚未按局级别做硬过滤（如 blocked/max-step/异常分布）。
- 当前尚未设置容量上限和年龄衰减，历史数据不能有序退出。
- 当前 mixed 训练集与 replay 池耦合，不利于后续精细管理。
- 当前尚未提供轮次间分布偏移监控，难以及时识别“本轮数据过于异常”导致的训练偏航。

## 实施范围

1. 新增脚本：`tools/curate_replay_pool.py`
2. 修改编排：`tools/iterative_self_play_training.sh`
3. 新增每轮报告：`tools/_iterative_<mode>/round-N.replay.report.json`
4. 新增三源混合策略与配比参数（本轮/近轮/历史精选）
5. 新增防漂移监控指标（行动分布偏移、回放命中结构）

## 兼容性原则

- 仅使用现有 JSONL 字段：`sampleId`、`seed`、`stepIndex`、`policyTarget`、`finalScore`、`finalRank`、`ok`、`blocked`、`gameEnded`。
- 通过 `sampleId` 反推 game key（去掉 `:s<number>` 后缀），进行局级聚合。
- 对缺失信息（公司/外星人/初始牌/机制标签）不强依赖，不作为硬过滤条件。

## 核心策略

### 0) 三源混合（训练侧主目标）

每轮训练集由三部分组成，不再仅是“new + old随机抽样”：

- `new`：本轮新自博弈样本（保证策略前沿学习）
- `recent`：近 `REPLAY_RECENT_ROUNDS` 轮样本（保证连续性、抗短期噪声）
- `curated`：历史精选样本（保证长期经验与稀有机制覆盖）

默认比例（可配）：

- `MIX_NEW_RATIO=0.50`
- `MIX_RECENT_RATIO=0.30`
- `MIX_CURATED_RATIO=0.20`

约束：三者比例之和必须为 1.0；若某池不足，缺口按优先级 `new -> recent -> curated` 回填。

### 1) 硬过滤（局级）

淘汰任一满足条件的对局：

- 任意样本 `blocked == true`
- 任意样本 `ok == false`
- 全局未出现 `gameEnded == true`
- `max(stepIndex) >= SELF_PLAY_MAX_STEPS`
- `pass` 占比超过阈值（默认 0.65）

### 2) 局级评分

对每局计算保留分（用于排序和裁剪）：

- 质量分：玩家最终分均值（`finalScore`）
- 多样性分：行动分布熵（基于 `policyTarget.id`）
- 年龄衰减：按“当前轮 - 来源轮”指数衰减（半衰期可配）

补充：

- 近轮加成：来自近轮窗口的对局获得额外权重（避免全被远古高分局挤占）
- 冗余惩罚：与已入选对局行动分布过于相似时降权

### 3) 容量与配额

- replay 池总容量上限（按样本行数）
- replay 池最大对局数上限
- 每来源轮次最大保留对局数
- 每来源轮次 anchor 对局（高分保底）
- 近轮池最小保障配额（确保 recent 不被 curated 挤压）
- 历史精选池最小保障配额（确保长期经验持续注入）

### 4) 分离两类产物

- `round-N.mixed.jsonl`：本轮训练集（新样本 + 抽样旧样本）
- `round-N.replay.candidate.jsonl`：候选 replay 池（用于候选模型被接受后更新 replay）
- `round-N.recent.window.jsonl`：近轮窗口池（由轮次过滤生成）
- `round-N.curated.pool.jsonl`：历史精选池（经评分与淘汰后生成）

说明：候选模型接受后，用 `replay.candidate` 更新 replay 池，而不是用 `mixed` 直接覆盖。

### 5) 防漂移监控（每轮报告）

在 `round-N.replay.report.json` 中新增：

- 三源抽样实际占比（目标占比 vs 实际占比）
- 近轮覆盖率（recent 中覆盖到的轮次分布）
- 历史精选覆盖率（curated 中来源轮次与来源桶分布）
- 行动分布偏移指标（mixed 相对 accepted replay 的 L1/JSD 近似）
- 风险告警：
   - 若某一来源占比超过阈值（默认 0.7）
   - 若行动分布偏移超过阈值
   - 若 recent 命中轮次过少

## 环境变量（新增）

- `REPLAY_MAX_ROWS`（默认 220000）
- `REPLAY_MAX_GAMES`（默认 2400）
- `REPLAY_MAX_GAMES_PER_ROUND`（默认 180）
- `REPLAY_ANCHOR_GAMES_PER_ROUND`（默认 8）
- `REPLAY_RECENT_ROUNDS`（默认 6）
- `REPLAY_AGE_HALF_LIFE_ROUNDS`（默认 6）
- `REPLAY_MAX_PASS_RATIO`（默认 0.65）
- `MIX_NEW_RATIO`（默认 0.50）
- `MIX_RECENT_RATIO`（默认 0.30）
- `MIX_CURATED_RATIO`（默认 0.20）
- `REPLAY_SHIFT_ALERT_THRESHOLD`（默认 0.18，用于行动分布偏移告警）

保留现有变量：

- `MIX_OLD_RATIO`

说明：`MIX_OLD_RATIO` 进入兼容模式，仅在未设置三源比例时生效。

## 代码改动步骤

1. 新增 `tools/curate_replay_pool.py`
   - 读取 new/replay JSONL
   - 按轮次拆分 recent 窗口与 curated 候选
   - 执行局级聚合、硬过滤、评分、配额裁剪
   - 按三源比例组装 mixed
   - 输出 mixed/replay-candidate/recent-window/curated-pool/report

2. 修改 `tools/iterative_self_play_training.sh`
   - 删除旧的内联 Python 混合逻辑
   - 调用 `tools/curate_replay_pool.py`
   - 候选模型 accepted 时改为 `cp round-N.replay.candidate.jsonl replay-dataset.jsonl`
   - 兼容旧参数：未设置三源比例时回退到 `MIX_OLD_RATIO` 逻辑

3. 验证
   - `bash -n tools/iterative_self_play_training.sh`
   - `python -m py_compile tools/curate_replay_pool.py`
   - 单轮干跑（小 games）验证 report 与输出文件结构
   - 校验三源实际占比与偏移告警逻辑

## 风险与回滚

风险：

- 过滤过严导致旧数据过少，训练不稳定。
- 配额设定不合理造成 replay 过度偏向近期。
- 三源比例不合理造成模型更新变慢或仍受单轮偏移影响。

缓解：

- 参数均环境变量可调。
- 保留现有 `MIX_OLD_RATIO` 作为快速回退杠杆。
- 对 recent 与 curated 设最小保障配额，避免其中一侧被挤压。
- 引入偏移告警，出现异常时自动建议调参。

回滚方案：

- 回退 `tools/iterative_self_play_training.sh` 到旧版内联混合逻辑。
- 停用 `tools/curate_replay_pool.py` 调用。

回滚执行步骤（已演练）：

1. 取消设置 `MIX_NEW_RATIO`、`MIX_RECENT_RATIO`、`MIX_CURATED_RATIO`。
2. 设置 `MIX_OLD_RATIO`（例如 `0.4`）。
3. 重新执行当前轮训练流程，脚本将自动进入 legacy 混合模式。
4. 验证 `round-N.replay.report.json` 中 `mode=legacy`。

本地演练命令（低内存样本）：

```bash
python tools/curate_replay_pool.py \
   --new-dataset tools/_tmp_replay_check/new.jsonl \
   --replay-dataset tools/_tmp_replay_check/replay.jsonl \
   --mixed-out tools/_tmp_replay_check/legacy.mixed.jsonl \
   --replay-candidate-out tools/_tmp_replay_check/legacy.replay.candidate.jsonl \
   --recent-window-out tools/_tmp_replay_check/legacy.recent.window.jsonl \
   --curated-pool-out tools/_tmp_replay_check/legacy.curated.pool.jsonl \
   --report-out tools/_tmp_replay_check/legacy.report.json \
   --current-round 31 \
   --mix-old-ratio 0.4
```

## 验收标准

- 训练流程可正常跑通。
- 每轮产出 replay 报告，包含过滤、保留、三源占比与偏移统计。
- replay 文件大小不再无限增长（受上限控制）。
- 候选 accepted 后 replay 更新来源为 `replay.candidate`。
- 不破坏 `tools/train_bc_policy.py` 的现有输入解析。
- 单轮数据偏移时，recent + curated 能有效稀释本轮样本占比（不出现单源 > 70%）。

## 实施 Checklist（可勾选）

### Phase 0: 范围冻结与参数确认

- [x] 确认三源混合目标比例：`MIX_NEW_RATIO`、`MIX_RECENT_RATIO`、`MIX_CURATED_RATIO`。
- [x] 确认 recent 窗口大小：`REPLAY_RECENT_ROUNDS`。
- [x] 确认 replay 容量上限：`REPLAY_MAX_ROWS`、`REPLAY_MAX_GAMES`。
- [x] 确认轮次配额参数：`REPLAY_MAX_GAMES_PER_ROUND`、`REPLAY_ANCHOR_GAMES_PER_ROUND`。
- [x] 确认硬过滤阈值：`REPLAY_MAX_PASS_RATIO`、`SELF_PLAY_MAX_STEPS`。
- [x] 确认年龄衰减参数：`REPLAY_AGE_HALF_LIFE_ROUNDS`。
- [x] 确认偏移告警阈值：`REPLAY_SHIFT_ALERT_THRESHOLD`。

### Phase 1: 新增样本整理脚本

- [x] 新建 `tools/curate_replay_pool.py`。
- [x] 实现 JSONL 读取与写出（按行流式处理，避免大文件爆内存）。
- [x] 实现 game key 提取（由 `sampleId` 去掉 `:s<number>` 后缀）。
- [x] 实现局级聚合统计：step 上限、pass 比例、action 计数、finalScore 均值。
- [x] 实现硬过滤（blocked / ok / gameEnded / maxSteps / pass 比例）。
- [x] 实现来源轮次解析（从 seed 或 sampleId 解析 round）。
- [x] 实现 recent 窗口拆分与历史候选拆分。
- [x] 实现局级评分（质量分 + 多样性分 + 年龄衰减 + 近轮加成）。
- [x] 实现每来源轮次配额和 anchor 保底。
- [x] 实现 recent 与 curated 的最小保障配额（防止单侧被挤压）。
- [x] 实现 replay 池容量裁剪（按 games 与 rows 双上限）。
- [x] 实现三源抽样组装 mixed（缺口回填优先级：new -> recent -> curated）。
- [x] 输出 4 类文件：mixed、replay.candidate、recent.window、curated.pool。

### Phase 2: 接入训练编排脚本

- [x] 修改 `tools/iterative_self_play_training.sh`，移除旧内联 Python 混合逻辑。
- [x] 在每轮 new 数据生成后调用 `tools/curate_replay_pool.py`。
- [x] 接入新增环境变量并给出默认值。
- [x] 增加比例合法性检查（三源和应为 1.0，允许小误差）。
- [x] 增加兼容逻辑：未设置三源比例时回退 `MIX_OLD_RATIO`。
- [x] 明确兼容触发条件：仅当三源比例变量未设置时启用 `MIX_OLD_RATIO`。
- [x] 修改 accepted 分支：用 `round-N.replay.candidate.jsonl` 更新 replay 池。
- [x] 修改 rejected 分支：replay 池保持不变，仅恢复 accepted 模型。

### Phase 3: 报告与可观测性

- [x] 输出 `round-N.replay.report.json`。
- [x] 报告写入过滤统计：输入局数、过滤局数、过滤原因分布。
- [x] 报告写入三源抽样统计：目标占比、实际占比、抽样行数。
- [x] 报告写入来源覆盖：recent 覆盖轮次、curated 覆盖轮次。
- [x] 报告写入分布偏移：mixed vs accepted replay 的行动分布距离。
- [x] 报告写入告警：单源占比超阈值、偏移超阈值、recent 覆盖不足。

### Phase 4: 校验与回归

- [x] 语法校验：`bash -n tools/iterative_self_play_training.sh`。
- [x] 语法校验：`python -m py_compile tools/curate_replay_pool.py`。
- [x] 小规模干跑（建议 1 轮，较小 games）验证流程跑通。
- [x] 检查输出文件存在且非空：mixed、replay.candidate、report。
- [x] 检查报告中三源实际占比是否接近目标比例。
- [x] 检查单源占比告警是否按阈值触发。
- [x] 检查 recent/curated 最小保障配额在数据充足时确实生效。
- [x] 检查训练器读取 mixed 后可完成训练，不改动训练器输入协议。

### Phase 5: 验收门槛

- [x] replay 文件规模受上限约束，轮次增加不再无限膨胀。
- [x] 本轮数据占比在偏移场景下被稀释（单源不超过 70%）。
- [x] recent 与 curated 均有稳定命中，不出现长期单侧缺失。
- [x] accepted 与 rejected 分支行为符合预期。（rejected 为真实续训实测；accepted 为隔离分支语义仿真验证）
- [x] 与旧流程对比，未出现明显训练中断或格式不兼容。

### Phase 6: 回滚预案演练

- [x] 保留切换开关：可一键回退到 `MIX_OLD_RATIO` 旧逻辑。
- [x] 记录回滚步骤并在本地演练一次。
- [x] 确认回滚后可继续从当前 round 续跑。

### 交付清单

- [x] 代码：`tools/curate_replay_pool.py`
- [x] 代码：`tools/iterative_self_play_training.sh`
- [x] 文档：本计划文档参数与流程说明同步更新
- [x] 产物示例：1 份 `round-N.replay.report.json`