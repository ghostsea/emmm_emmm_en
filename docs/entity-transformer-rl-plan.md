# Entity Transformer RL 改造计划

## 目标

当前 `pytorch-tiny-resnet-v1` 实际是全连接残差 MLP：输入只包含可用动作集合、round bucket 和少量回合标量；它不直接使用太阳系旋转盘面、火箭、星球、资源、科技、卡牌等状态。因此下一版训练不再保留历史数据兼容性，直接切换到新的样本 schema、实体化 observation 编码和 action-conditioned entity transformer。

核心目标：

- 每条训练样本必须包含当前决策点的 compact observation。
- 策略头不再对固定动作 id 做全局分类，而是对当前 legal candidates 逐个打分。
- value 头使用同一个实体状态编码预测当前玩家归一化最终收益。
- 数据处理和训练在 16GB 内存机器上运行，所有 JSONL 处理必须流式读取，禁止全量载入大数据集。

## 当前基线参数

### 迭代训练脚本

来源：`tools/iterative_self_play_training.sh`、`tools/train_expert_rounds.sh`。

| 项目 | 当前默认 |
| --- | --- |
| 默认后端 | `SELF_PLAY_BACKEND=app-full` |
| 轮数 | `ROUNDS=3`，一键 expert 由参数传入 |
| 并发 | `CONCURRENCY=20`，一键 expert 由第 2 个参数传入 |
| 最大步数 | `SELF_PLAY_MAX_STEPS=10000` |
| 评估局数 | `EVAL_GAMES=100` |
| hard 每轮自博弈 | `TRAIN_GAMES=200` |
| expert 每轮自博弈 | `TRAIN_GAMES=400` |
| 三源混合 | 一键 expert 默认 `new/recent/curated = 0.5/0.3/0.2` |
| replay 上限 | `REPLAY_MAX_ROWS=220000`，`REPLAY_MAX_GAMES=2400` |

### hard 训练默认

| 参数 | 当前默认 |
| --- | --- |
| epochs | 40 |
| batch size | 256 |
| learning rate | `2e-4` |
| weight decay | `1e-4` |
| grad clip | 1.0 |
| validation ratio | 0.25 |
| round bucket size | 2 |
| visit loss weight | 0.30 |
| self-play epsilon | 0.10 |
| self-play temperature | 1.15 |
| MCTS root noise | enabled, alpha 0.30, weight 0.25 |

### expert 训练默认

| 参数 | 当前默认 |
| --- | --- |
| epochs | 60 |
| batch size | 384 |
| learning rate | `1.5e-4` |
| weight decay | `1e-4` |
| grad clip | 1.0 |
| validation ratio | 0.20 |
| round bucket size | 1 |
| visit loss weight | 0.30 |
| self-play epsilon | 0.06 |
| self-play temperature | 1.08 |
| MCTS root noise | iterative 默认 alpha 0.20, weight 0.18；一键 expert 覆盖为 alpha 0.24, weight 0.22 |

### 运行时 MCTS profile

来源：`randomizer/app/ai-controller.js`。

| 难度 | simulations | maxDepth | cpuct | rolloutDepth | timeLimit |
| --- | ---: | ---: | ---: | ---: | ---: |
| normal | 64 | 4 | 1.8 | 3 | 50ms |
| hard | 192 | 6 | 1.5 | 5 | 120ms |
| expert | 512 | 8 | 1.2 | 7 | 250ms |

## 新模型建议参数

第一版以 16GB 内存和 CPU/单卡可跑为边界，不追求大模型。

| 参数 | hard 建议 | expert 建议 | 说明 |
| --- | ---: | ---: | --- |
| model type | `pytorch-entity-transformer-v1` | 同 hard | 替换 tiny-resnet |
| entity dim | 96 | 128 | 实体 token embedding 维度 |
| transformer layers | 3 | 4 | 先控制内存与导出复杂度 |
| attention heads | 4 | 4 | entity dim 可整除 |
| feed-forward dim | 256 | 384 | 约为 entity dim 的 3 倍 |
| dropout | 0.10 | 0.10 | 保持现有风格 |
| max state entities | 160 | 192 | 超出时按优先级截断并记录 dropped count |
| max candidate actions | 32 | 40 | 对当前合法候选逐个打分 |
| epochs | 36 | 48 | entity 模型更重，先少于当前 expert 60 |
| batch size | 64 | 48 | 防止 attention 内存峰值过高 |
| learning rate | `1e-4` | `8e-5` | AdamW |
| weight decay | `1e-4` | `1e-4` | 延续现有 |
| grad clip | 1.0 | 1.0 | 延续现有 |
| label smoothing | 0.02 | 0.02 | 略低于当前 0.03 |
| value loss weight | 0.35 | 0.35 | 延续现有 |
| visit loss weight | 0.35 | 0.40 | expert 更依赖 MCTS visit 分布 |
| validation ratio | 0.20 | 0.20 | 固定 hash split |
| 每轮新自博弈 | 200 | 400 | 第一阶段不提高局数，先验证表示质量 |
| replay rows | 160000 | 220000 | hard 降低内存，expert 保持当前上限 |

后续若训练稳定且内存峰值足够低，再将 expert 扩到 `entity_dim=160/layers=5/max_state_entities=224/batch_size=32`。

## 样本 schema v3

不保留历史兼容性，因此训练脚本可以强制要求：

```json
{
  "schemaVersion": 3,
  "sampleId": "...",
  "logType": "turn-action",
  "roundNumber": 2,
  "turnNumber": 17,
  "playerId": "player-white",
  "policyTargetV2": { "id": "scan", "kind": "main", "targetKey": "main:scan" },
  "candidates": [
    { "id": "scan", "kind": "main", "available": true, "score": 3.2, "net": 2.8, "actionGraph": { "gain": 5, "cost": 2, "net": 3 } }
  ],
  "observationEnvelope": {
    "version": 2,
    "observation": { "compactEntities": [ ... ], "globalFeatures": { ... } },
    "legalActions": [ ... ]
  },
  "details": { "action": { ... }, "decisionPlan": { "mcts": { "policy": [ ... ] } } },
  "finalScore": 42,
  "finalRank": 1,
  "gameEnded": true,
  "blocked": false,
  "ok": true
}
```

强约束：`observationEnvelope.observation.compactEntities` 缺失时该样本直接丢弃，并在训练报告中计数，不再 fallback 到旧 tiny-resnet 特征。

## 实体切分与编码

### 通用 token 字段

每个实体 token 统一包含：

- `typeId`：实体类型枚举。
- `ownerId`：当前玩家/对手/中立，映射为相对 owner embedding。
- `slotId`：同类槽位，如火箭编号、星球编号、科技槽、卡槽。
- `zoneId`：实体所在区域，如 hand/public/discard/solar/tech/final/industry/alien。
- `numeric[]`：固定长度数值特征，缺失填 0。
- `flags[]`：固定长度布尔/类别 one-hot 或 multi-hot。
- `position`：用于相对位置编码的结构化字段。

编码原则：所有 player id、rocket id、card id 都转为当前决策玩家视角的相对编号，避免模型记住颜色或座位。

### 全局实体

`GLOBAL` token 作为 CLS：

- roundNumber、turnNumber、remainingRounds。
- activePlayerCount、currentPlayerSeat、passedPlayerCount。
- 当前主行动是否已用、pending 类型摘要。
- 终局板块已标记情况摘要。

### 玩家实体

每位玩家一个 `PLAYER` token：

- 相对座位：self、next、opponent-1、opponent-2。
- 分数、信用、能量、宣传、数据、手牌数、保留牌数、已完成任务数。
- income 摘要和是否 pass。
- 已拥有科技数量、公司牌/外星人种族摘要。

### 火箭实体

每个火箭一个 `ROCKET` token：

- owner 相对编号、rocket slot。
- 是否已发射、所在 ring/sector/planet/nebula。
- 当前移动能力/等级/是否可移动/是否可登陆。
- 与当前可选目标的相对距离摘要。
- 位置编码使用太阳系相对角度：`sin(thetaSelfRelative)`、`cos(thetaSelfRelative)`、ring index、sector index。

### 太阳系/星球/扇区实体

每个关键位置生成 `PLANET_OR_SECTOR` token，优先级如下：

1. 当前玩家火箭可达或下一步可达的位置。
2. 已揭示或有数据/痕迹/奖励的位置。
3. 终局/任务/科技相关的位置。
4. 其他位置按距离和价值排序截断。

特征：

- body type：planet/moon/sector/nebula/asteroid。
- ring、sector、relative angle 的 `sin/cos`。
- 当前旋转偏移、是否被访问/环绕/登陆、数据 token 数、痕迹状态。
- 预估奖励、登陆/环绕/扫描收益摘要。
- 与每个自己火箭的最小距离摘要。

注意：不把旋转盘面当普通二维图片处理；使用相对极坐标/环形位置编码，让同一战略局面在旋转后更容易对齐。

### 卡牌实体

手牌、公共牌、保留牌、弃牌堆摘要拆成 `CARD` token：

- zone：hand/public/reserved/discard-summary。
- card type、角标、任务类型、基础收益类型。
- 是否可打出、可完成任务、可使用角标。
- 打出成本、预估收益、与当前资源是否匹配。

手牌可包含完整私有信息；对手只编码公开/数量摘要。

### 科技实体

`TECH_TILE` 与 `OWNED_TECH` token：

- tile color/type、槽位、是否可购买/可放置。
- 成本、即时收益、持续收益、与当前策略目标相关性。
- 玩家已拥有科技用 owner 相对编号区分。

### 数据/扫描实体

`DATA_TOKEN` 或聚合 `DATA_CLUSTER` token：

- 所在 sector/planet/owner。
- 颜色/类型/是否可放置/是否可分析。
- 分析收益、扇区完成进度。

### 公司/外星人/终局实体

机制多且稀疏，先用摘要实体，后续再细化：

- `INDUSTRY`：公司 id embedding、1x 是否可用、槽位标记、主动/被动标签 multi-hot。
- `ALIEN`：物种 id、揭示状态、痕迹数量、可触发子流程类型。
- `FINAL_SCORING`：每个板块一个 token，记录当前公式、已标记、当前玩家边际分。

### 候选动作实体

每个 legal candidate 一个 `ACTION` token，策略头只对这些 token 输出 logit：

- action id/kind embedding。
- action 参数：rocketId/cardId/tileId/planetId/direction 等映射为关联实体引用或 slot embedding。
- `score/net/actionGraph.gain/actionGraph.cost/actionGraph.finalMarginal/actionGraph.feasibility`。
- 可执行成本、资源支付、预估回报。

动作 token 需要能 cross-attend 到 state entities；第一版可把 state tokens 和 action tokens 拼接进同一个 transformer，并在输出端只取 action token hidden states。

## Entity Transformer 设计

### 输入布局

```text
[GLOBAL] [PLAYER...] [ROCKET...] [PLANET/SECTOR...] [CARD...] [TECH...] [ALIEN...] [FINAL...] [ACTION...]
```

每个 token embedding：

```text
token = type_embedding + owner_embedding + zone_embedding + slot_embedding + position_embedding + Linear(numeric_and_flags)
```

### 位置编码

必须有位置编码，但不是传统文本序号为主：

- 太阳系对象：ring embedding + sector embedding + `sin/cos(relativeAngle)` MLP。
- 火箭：继承所在太阳系位置编码，并加 rocket slot embedding。
- 卡牌/科技/玩家：使用 zone + slot embedding。
- action：使用 action kind/id embedding + 参数实体 slot embedding。
- transformer 内部仍可加小幅 learned index embedding，但不能只靠 index。

相对角度以当前玩家视角和当前太阳系旋转状态计算。这样盘面旋转后，相对结构仍可学习。

### Padding mask 与 attention mask

必须实现 padding mask：

- `entityMask`: shape `[batch, maxEntities]`，真实 token 为 1，padding 为 0。
- self-attention 的 key padding mask 必须屏蔽 padding token。
- action logits 必须使用 `candidateMask`，padding action 的 logit 设为 `-inf`。
- MCTS visit distillation 只在 candidateMask 内归一化。

第一版不需要复杂 block-sparse attention；全实体互相 attention 即可。若后续 maxEntities 提高，再考虑分块或 action-to-state cross attention。

### 输出头

- Policy head：对每个 ACTION token 输出一个 logit，softmax over legal candidates。
- Value head：取 GLOBAL token hidden state，输出 `tanh` 归一化 value。
- Optional action-value head：对每个 ACTION token 输出 Q 值，第二阶段加入。

### Loss

```text
loss = CE(policy_logits, chosen_action_index)
     + visitLossWeight * CE(policy_logits, normalized_mcts_visit_distribution)
     + valueLossWeight * SmoothL1(value, final_value_target)
```

若 MCTS policy 缺失，visit loss 对该样本为 0。由于不保留旧数据兼容性，缺失 observation 的样本直接丢弃，但缺失 MCTS visit 可保留。

## 代码修改计划

### 1. 记录 compact observation

修改：

- `randomizer/game/ai/observation.js`
- `randomizer/app/ai-controller.js`
- `tools/generate_self_play_dataset.js`

做法：

1. 在 `observation.js` 新增 `buildCompactEntityObservation(gameState, playerId, options)`。
2. 在 turn-action 决策时构造 compact observation，并写入 `recordAiAutoBattleLog(... details.observation ...)`。
3. `buildTrainingSample`/`buildSampleFromLog` 强制输出 `schemaVersion=3` 与 `observationEnvelope.version=2`。
4. 输出 summary 增加 `observationMissingCount`、`avgEntityCount`、`maxEntityCount`。

### 2. 新增实体特征编码模块

新增：

- `tools/entity_observation_encoder.py`

职责：

- 流式读取 JSONL 样本。
- 将 compact entities 转为固定张量字段：`entityTypeIds`、`ownerIds`、`zoneIds`、`slotIds`、`numericFeatures`、`entityMask`、`candidateMask`、`targetCandidateIndex`、`visitTarget`、`valueTarget`。
- 超过 `max_state_entities` 或 `max_candidate_actions` 时按优先级截断，并记录 dropped 数。
- 不把全数据集载入内存；训练侧 Dataset 按 JSONL 行懒加载或使用分片缓存。

### 3. 替换训练模型

修改或拆分：

- `tools/train_bc_policy.py`
- 建议新增 `tools/train_entity_transformer_policy.py`，再让旧脚本退役或转调新脚本。

做法：

1. 新增 `EntityTransformerPolicyValueNet`。
2. 使用 `torch.nn.TransformerEncoder` 或自定义 encoder layer，传入 `src_key_padding_mask`。
3. DataLoader 使用 iterable/streaming dataset，必要时先生成小型 shard 索引，不生成全量 Python list。
4. 输出 `modelType=pytorch-entity-transformer-v1`。
5. 导出 ONNX，输入至少包括：
   - `entity_type_ids`
   - `owner_ids`
   - `zone_ids`
   - `slot_ids`
   - `numeric_features`
   - `entity_mask`
   - `candidate_mask`
   - `action_token_indexes`
6. 输出：`policy_logits` shape `[batch, max_candidate_actions]`，`value` shape `[batch]`。

### 4. 替换浏览器/Node 推理

修改：

- `randomizer/game/ai/behavior-cloning.js`
- `randomizer/game/ai/trained-models.js`
- `randomizer/game/ai/expert-trained-models.js`

做法：

1. 新增 `evaluateEntityTransformerHeads` / `evaluateEntityTransformerHeadsAsync`。
2. JS 端使用同一套 compact observation builder 生成推理输入。
3. 优先使用 ONNX；若没有 ONNX，不建议手写 transformer JS fallback。训练入口应默认导出 ONNX，运行时缺 ONNX 直接报错。
4. 返回格式保持 `probabilityByActionId`、`normalizedValue`，让 `ai-controller.js` 的 MCTS prior 接口尽量少改。

### 5. 调整决策链路

修改：

- `randomizer/app/ai-controller.js`

做法：

1. 调用 behavior heads 时传入 compact observation，而不是只传 candidates/round/turn。
2. `policyHintByActionId` 来自 action-token softmax。
3. `valueOffset` 来自 GLOBAL value head。
4. `decisionPlan` 记录 `entityCount`、`candidateCount`、`modelType`、`maskedCandidateCount`、top policy。

### 6. 调整训练脚本参数

修改：

- `tools/iterative_self_play_training.sh`
- `tools/train_expert_rounds.sh`
- `tools/train_expert_ai.sh`
- `tools/train_hard_ai.sh`

新增环境变量：

```bash
MODEL_FAMILY=entity-transformer
ENTITY_DIM=128
ENTITY_LAYERS=4
ENTITY_HEADS=4
ENTITY_FF_DIM=384
MAX_STATE_ENTITIES=192
MAX_CANDIDATE_ACTIONS=40
ENTITY_BATCH_SIZE=48
ENTITY_LEARNING_RATE=8e-5
ENTITY_VISIT_LOSS_WEIGHT=0.40
```

一键 expert 保持 3 参数入口，但内部默认切到 entity transformer。

## 完整实施 Checklist

### 阶段 0：切换边界与旧数据清理

- [x] 确认本次改造不保留历史样本兼容性，训练脚本强制要求 `schemaVersion=3`。
- [x] 清空或隔离旧 replay pool，避免旧 schema 样本进入 entity transformer 训练。
- [x] 将训练报告中的 `modelType`、schema version、数据过滤原因写清楚，便于确认没有混入旧模型路径。
- [x] 确认所有大 JSONL 处理都使用流式读取或显式 `max_samples` 限制，避免 16GB 内存机器上全量载入数据。

### 阶段 1：compact observation 与样本 schema v3

- [x] 在 `randomizer/game/ai/observation.js` 新增 `buildCompactEntityObservation(gameState, playerId, options)`。
- [ ] 定义 entity type、owner、zone、slot、position、numeric、flags 的稳定枚举表。
- [x] 为 `GLOBAL` token 输出第一版摘要（round/turn、remaining-round estimate、active/passed/pending 摘要、终局/外星概览计数）。
- [x] 为 `PLAYER` token 输出第一版摘要（相对座位、资源/分数、手牌/保留、任务计数、pass、科技/公司关键状态）。
- [x] 为 `ROCKET` token 输出第一版摘要（owner、slot、launched/orbiting/landed、ring/sector、move/surface/坐标字段）。
- [x] 为 `PLANET_OR_SECTOR` token 输出第一版摘要（body type、ring/sector、relative angle、旋转偏移、环绕/登陆标记计数）。
- [x] 为 `CARD` token 输出第一版摘要（zone、card type、成本、收益角标和基础状态；来源覆盖 hand/reserved/public/discard）。
- [x] 为 `TECH_TILE` / `OWNED_TECH` token 输出第一版摘要（颜色/类型、槽位、供给剩余、bonus、拥有/失效/蓝槽位等核心状态）。
- [x] 为 `DATA_TOKEN` / `DATA_CLUSTER` token 输出第一版摘要（池/放置/星云聚类位置、owner、placement kind、基础计数与最近替换态）。
- [x] 为 `INDUSTRY`、`ALIEN`、`FINAL_SCORING` token 输出第一版摘要特征（公司被动/实验室/未来跨度、外星槽位与痕迹状态、终局板块与pending统计）。
- [x] 为每个 legal candidate 输出 `ACTION` token，包含 action id/kind、`score/net/actionGraph`、成本和收益第一版摘要。
- [x] 在 `randomizer/app/ai-controller.js` 的 turn-action 日志中写入 compact observation，确保 `details.observation` 非空。
- [x] 在 `tools/generate_self_play_dataset.js` 中输出 `schemaVersion=3` 与 `observationEnvelope.version=2`。
- [x] 输出 self-play summary 字段：`observationMissingCount`、`avgEntityCount`、`maxEntityCount`、`entityTruncationCount`、`candidateTruncationCount`。

### 阶段 2：实体编码与诊断工具

- [x] 新增 `tools/entity_observation_encoder.py`，负责将 schema v3 JSONL 样本转成训练张量字段。
- [x] 编码字段包含 `entityTypeIds`、`ownerIds`、`zoneIds`、`slotIds`、`numericFeatures`、`entityMask`、`candidateMask`、`actionTokenIndexes`。
- [x] 编码目标包含 `targetCandidateIndex`、`visitTarget`、`valueTarget`。
- [x] 实现 `max_state_entities` 截断策略：优先保留 GLOBAL、PLAYER、ACTION、自方 ROCKET、可达/高价值位置，再保留其他实体。
- [x] 实现 `max_candidate_actions` 截断策略；若 target 被截断则丢弃样本并报告。
- [x] 训练时缺 compact observation 的样本直接丢弃，不 fallback 到旧候选动作特征。
- [x] 新增 `tools/inspect_entity_dataset.py`，默认只扫描前 N 行，输出实体类型分布、截断率、target/candidate 完整性。
- [x] 诊断脚本必须支持 `--max-samples`，且默认值有上限。

### 阶段 3：Entity Transformer 训练器

- [x] 新增 `tools/train_entity_transformer_policy.py`，或将 `tools/train_bc_policy.py` 切换为 entity transformer 主入口。
- [x] 实现 `EntityTransformerPolicyValueNet`，使用 state/action token 拼接输入。
- [x] token embedding 包含 type、owner、zone、slot、position 和 numeric/flags projection。
- [x] 实现 ring/sector embedding 与 `sin/cos(relativeAngle)` 位置编码。
- [x] 实现 `src_key_padding_mask`，self-attention 必须屏蔽 padding token。
- [x] 实现 `candidateMask`，padding action logits 必须设为 `-inf`。
- [x] Policy head 只对 ACTION token 输出 logits，softmax over legal candidates。
- [x] Value head 使用 GLOBAL token hidden state 输出 `tanh` 归一化 value。
- [x] 实现 hard-label CE、MCTS visit distillation CE、value SmoothL1 的组合 loss。
- [x] 若 MCTS visit 缺失，该样本 visit loss 为 0；若 observation 缺失，该样本丢弃。
- [ ] DataLoader 使用 streaming/IterableDataset 或有上限 shard 缓存，不构造全量 encoded records list。
- [x] 输出训练指标：policy loss、visit loss、value loss、policy entropy、per-action recall、value MAE。
- [x] 输出模型 JSON 元信息：`modelType=pytorch-entity-transformer-v1`、schema version、entity 参数、mask 参数、训练参数。

### 阶段 4：ONNX 导出与推理接入

- [x] 训练器默认导出 ONNX，输入包含 entity ids、numeric features、entity mask、candidate mask、action token indexes。
- [x] ONNX 输出 `policy_logits` shape `[batch, max_candidate_actions]` 和 `value` shape `[batch]`。
- [x] 修改 `randomizer/game/ai/behavior-cloning.js`，新增 entity-transformer ONNX 评估分支（接入 `evaluateBehaviorCloneHeadsAsync`）。
- [x] 使用 compact observation builder 在 Node 推理端生成与训练一致的输入张量。
- [x] Entity transformer 第一版只支持 ONNX 推理；缺 ONNX 或 ONNX runtime 时 hard/expert 直接报错。
- [x] 保持对 `ai-controller.js` 的返回格式：`probabilityByActionId`、`normalizedValue`、top policy。
- [x] 更新 `randomizer/game/ai/trained-models.js` 与 `randomizer/game/ai/expert-trained-models.js` 的模型元信息格式。

### 阶段 5：MCTS 与决策链路接线

- [x] 修改 `randomizer/app/ai-controller.js`，调用 behavior heads 时传入 compact observation 和 legal candidates。
- [x] 使用 action-token policy 作为 `policyHintByActionId`。
- [x] 使用 GLOBAL value head 作为 `valueOffset`。
- [x] `decisionPlan` 记录 `modelType`、`entityCount`、`candidateCount`、`maskedCandidateCount`、top policy、value。
- [ ] 确认 pure RL / hard / expert 路径都不会回落到旧 tiny-resnet 特征。
- [x] 确认 MCTS visit policy 仍写入样本，用于后续 visit distillation。

### 阶段 6：训练脚本与一键入口

- [x] 修改 `tools/iterative_self_play_training.sh`，新增 `MODEL_FAMILY=entity-transformer` 分支。
- [x] 新增实体模型参数环境变量：`ENTITY_DIM`、`ENTITY_LAYERS`、`ENTITY_HEADS`、`ENTITY_FF_DIM`、`MAX_STATE_ENTITIES`、`MAX_CANDIDATE_ACTIONS`。
- [x] 新增训练参数环境变量：`ENTITY_BATCH_SIZE`、`ENTITY_LEARNING_RATE`、`ENTITY_VISIT_LOSS_WEIGHT`。
- [x] 修改 `tools/train_expert_rounds.sh`，保持 3 参数入口，内部默认切到 entity transformer。
- [x] 修改 `tools/train_expert_ai.sh` 与 `tools/train_hard_ai.sh`，统一支持 entity transformer 训练入口。
- [x] iterative 默认启用 three-source 混合（`MIX_NEW/RECENT/CURATED`），并在混合结果为空时自动 fallback 到 legacy，避免小样本轮次训练中断。
- [x] 新训练开始前清空旧 replay dataset 或使用新 work dir，避免 schema 混合。
- [x] replay curation 只接受 schema v3 样本，并在 report 中输出 schema 过滤计数。

### 阶段 7：小规模验证

- [x] 运行语法检查：`node --check randomizer/app/ai-controller.js`。
- [x] 运行语法检查：`node --check randomizer/game/ai/behavior-cloning.js`。
- [x] 运行语法检查：`python3 -m py_compile tools/entity_observation_encoder.py tools/train_entity_transformer_policy.py`。
- [x] 生成小样本：`TRAIN_GAMES=8 EVAL_GAMES=2 CONCURRENCY=2`。
- [x] 用 `tools/inspect_entity_dataset.py --max-samples 200` 检查 schema v3 样本质量。
- [x] 小样本训练 1 epoch，确认 loss 可计算、mask 正常、ONNX 可导出。
- [x] Node 端加载 ONNX，对同一批 candidates 输出概率和 value。（`tools/smoke_entity_onnx_inference.js`）
- [x] 运行 1 轮小规模 iterative smoke，确认自博弈、训练、评估、accept/reject 都能闭环。
- [x] `core-rules` 后端最小 smoke 恢复可运行（修复旧 API 漂移导致的初始化/MCTS 调用崩溃）。

### 阶段 8：正式训练前验收

- [x] `observationMissingCount=0`。
- [x] `targetMissingFromCandidates=0`。
- [x] `candidateTruncationRate=0`。
- [x] `stateEntityTruncationRate < 5%`。
- [x] policy CE、visit CE、value loss 在 smoke 中不是 NaN/Inf。
- [x] policy entropy 没有立即塌缩到单一动作。
- [x] 一键 expert 仍可使用 `./tools/train_expert_rounds.sh <rounds> <concurrency> [completed_round]`。
- [x] 正式训练前记录当前 entity 参数、训练参数、replay 参数和 MCTS 参数。

### 阶段 9：正式训练观察

- [ ] 恢复 expert 每轮 400 局自博弈。
- [ ] 使用固定 100-game eval 比较 baseline/candidate。
- [ ] 每轮记录平均最终分、胜者平均分、动作分布、pass ratio、maxSteps 命中率。
- [ ] 每轮记录训练 loss、validation loss、per-action recall、value MAE、policy entropy。
- [ ] 每轮记录内存峰值、平均样本大小、平均 entity count、截断率。
- [ ] 将首轮正式训练结果反馈后，再进入“初步训练后调参 Checklist”。

## 初步训练后调参 Checklist

这些项目现在不完成。等首轮或前几轮 entity transformer 训练后，根据内存占用、loss 曲线、动作分布和对战分数再决定。

### 内存与吞吐

- [ ] 若内存峰值接近 16GB，降低 `ENTITY_BATCH_SIZE`。
- [ ] 若 attention 占用过高，降低 `MAX_STATE_ENTITIES` 或 `ENTITY_LAYERS`。
- [ ] 若样本 IO 成为瓶颈，评估分片缓存格式，但仍禁止全量载入内存。
- [ ] 若 candidate/action token 很少触发截断，考虑降低 `MAX_CANDIDATE_ACTIONS` 提升吞吐。
- [ ] 若 state entity 截断率高于 5%，提高 `MAX_STATE_ENTITIES` 或优化实体优先级。

### 模型容量

- [ ] 若训练/验证 loss 都高且不过拟合，考虑提高 `ENTITY_DIM`。
- [ ] 若模型能训练但表达不足，考虑提高 `ENTITY_LAYERS` 或 `ENTITY_FF_DIM`。
- [ ] 若 validation loss 明显恶化，降低 `ENTITY_DIM`、`ENTITY_LAYERS` 或提高 dropout。
- [ ] 若 ONNX 推理延迟过高，降低 layers、entity dim 或 max entities。
- [ ] 若 action-conditioned policy 表现稳定，再评估是否加入 action-value/Q head。

### 优化超参数

- [ ] 若 loss 震荡，降低 `ENTITY_LEARNING_RATE`。
- [ ] 若收敛太慢且稳定，提高 `ENTITY_LEARNING_RATE` 小步测试。
- [ ] 若梯度频繁裁剪，降低 learning rate 或提高 warmup/降低 batch。
- [ ] 若 policy entropy 过早塌缩，增加 label smoothing 或降低 visit loss weight。
- [ ] 若模型过度模仿 MCTS 访问分布但实战变差，降低 `ENTITY_VISIT_LOSS_WEIGHT`。
- [ ] 若 hard label 与 visit 分布冲突明显，调整 hard CE 与 visit CE 的权重比例。

### 自博弈与探索

- [ ] 若新策略早期局面单一，增加 root noise weight 或 self-play epsilon。
- [ ] 若自博弈太随机导致训练目标噪声大，降低 epsilon 或 root noise。
- [ ] 若分数提升但动作覆盖变窄，增加 recent/curated replay 或提高探索温度。
- [ ] 若 pass ratio 异常，提高 pass 相关诊断并检查 reward/value target。
- [ ] 若 maxSteps 命中率升高，检查 pending flow、pass 策略和 MCTS rollout depth。

### 实体编码质量

- [ ] 若模型仍只学粗动作，检查 ACTION token 是否编码了 `rocketId/cardId/tileId/planetId/direction`。
- [ ] 若发射/移动/登陆策略差，增加火箭到关键星球/扇区的相对距离特征。
- [ ] 若扫描/数据策略差，增加数据 token、扇区完成度和可分析收益特征。
- [ ] 若打牌策略差，细化 hand/public card 的效果类型、成本和任务完成条件。
- [ ] 若外星人/公司机制表现差，将摘要 token 拆成更细的机制 token。

### 训练规模

- [ ] 若小规模训练有效且内存稳定，考虑把 expert 每轮自博弈从 400 提到 600。
- [ ] 若 eval 波动太大，考虑提高 `EVAL_GAMES` 或使用多 seed 评估。
- [ ] 若 replay 过大拖慢训练，降低 `REPLAY_MAX_ROWS` 或加强 curated 采样。
- [ ] 若遗忘明显，调整三源比例中的 recent/curated 权重。
- [ ] 若训练稳定且内存余量足够，再评估 expert 扩容到 `entity_dim=160/layers=5/max_state_entities=224/batch_size=32`。

## 验证指标

### 数据质量

- `observationMissingCount=0`。
- `targetMissingFromCandidates=0`。
- `stateEntityTruncationRate < 5%`。
- `candidateTruncationRate = 0`，如非 0 必须提高 `MAX_CANDIDATE_ACTIONS`。
- 每种实体类型至少在 smoke 报告中可见。

### 模型训练

- policy CE 和 visit CE 在前 3 个 epoch 内下降。
- validation action accuracy 不能只由 `pass` 或高频动作贡献，需要输出 per-action recall。
- value MAE 下降或至少不发散。
- policy entropy 不应迅速塌缩到单一动作。

### 对战评估

- 仍用固定 100-game eval。
- 记录 baseline/candidate 的平均最终分、胜者平均分、动作分布、pass ratio、maxSteps 命中率。
- 如果平均分只波动，优先看 entity truncation、observation 缺失、candidate mask 和 MCTS visit 分布是否异常。

## 风险与约束

- 16GB 内存是硬约束：禁止在 Python 中全量读取 JSONL 或把所有 encoded records 放进列表。训练需要 IterableDataset、分片或有上限缓存。
- transformer 增加 ONNX 输入复杂度；第一版应只支持 Node ONNX 推理，不手写完整 JS transformer。
- compact observation 不应直接 clone 完整 app state；必须先做实体摘要，否则样本体积和训练 IO 会爆炸。
- 不保留历史数据兼容性意味着旧 replay pool 需要清空，新训练从 schema v3 样本开始。
- 若 action 参数编码不足，即使 state entity 足够，模型仍可能只学粗动作。第一版必须把 `rocketId/cardId/tileId/planetId/direction` 等 candidate 参数编码进 action token。

## 第一阶段完成定义

- 新自博弈样本 schema v3，且 turn-action 样本都有 compact entities。
- `train_entity_transformer_policy.py` 可在小样本上完成 1 epoch，并导出 `pytorch-entity-transformer-v1` JSON/ONNX。
- `behavior-cloning.js` 能用 ONNX 输出每个 legal action 的概率和 value。
- hard/expert MCTS prior/value 接入新模型。
- 一键 expert 脚本仍保持 `./tools/train_expert_rounds.sh <rounds> <concurrency> [completed_round]` 入口。