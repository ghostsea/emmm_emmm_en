# AI 训练状态与参数模板（PyTorch Tiny-ResNet 版）

## 1. 当前可执行训练

当前仓库的正式训练入口是 [tools/train_bc_policy.py](tools/train_bc_policy.py)，已使用 PyTorch（AdamW + CrossEntropy + SmoothL1 反向传播）。

输入:
- JSONL（每行一个 turn-action 样本）
- 或 JSON（包含 `samples` 数组）

输出:
- JSON 模型文件（包含可在前端推理的权重）
- 可选 JS 模块（直接给游戏运行时加载）

模型格式关键字段:
- `version=3`
- `modelType=pytorch-tiny-resnet-v1`
- `actionVocab` / `candidateVocab`
- `weights.state`（flattened state-dict）
- `network.channels` / `network.blocks` / `network.dropout`
- `onnx.fileName` / `onnx.inputName` / `onnx.outputNames`

## 1.1 ONNX Runtime Node 推理

当前仓库会在训练时额外导出 ONNX sidecar：
- hard: `randomizer/game/ai/trained-models.onnx`
- expert: `randomizer/game/ai/expert-trained-models.onnx`

Node 命令行自博弈 / 批跑路径会优先尝试使用 `onnxruntime-node`：
- provider 优先级：`cuda -> cpu`
- 若 CUDA provider 不可用，会自动回退到 CPU，不影响规则执行
- 浏览器运行时仍保留纯 JS 推理 fallback，不依赖 ONNX Runtime

依赖说明：
- 需要根目录 `package.json` 中的 `onnxruntime-node`
- 若本机缺少 CUDA provider 所需共享库，ORT 会自动回退到 CPU

## 2. 推荐参数模板（针对 SETI）

### 2.1 Hard 模板（推荐）

已落地在 [tools/train_hard_ai.sh](tools/train_hard_ai.sh) 默认值:
- `HARD_TRAIN_EPOCHS=36`
- `HARD_TRAIN_BATCH_SIZE=192`
- `HARD_TRAIN_LEARNING_RATE=1.5e-4`
- `HARD_TRAIN_WEIGHT_DECAY=3e-4`
- `HARD_TRAIN_GRAD_CLIP=0.8`
- `HARD_TRAIN_VALIDATION_RATIO=0.25`
- `HARD_TRAIN_ROUND_BUCKET_SIZE=2`
- `SELF_PLAY_GAMES=200`（已按此前默认值放大到 10 倍）
- `SELF_PLAY_MAX_STEPS=20000`
- `HARD_TRAIN_HIGH_FREQ_DOWNSAMPLE_POWER=0.55`
- `HARD_TRAIN_HIGH_FREQ_MIN_KEEP_PROB=0.15`
- `HARD_TRAIN_LOW_FREQ_WEIGHT_ALPHA=0.65`
- `HARD_TRAIN_CRITICAL_ACTION_BOOST=1.50`
- `HARD_TRAIN_TINY_RESNET_CHANNELS=96`
- `HARD_TRAIN_TINY_RESNET_BLOCKS=4`
- `HARD_TRAIN_TINY_RESNET_DROPOUT=0.10`
- `HARD_TRAIN_VALUE_LOSS_WEIGHT=0.35`
- `HARD_TRAIN_LABEL_SMOOTHING=0.03`
- `HARD_SELF_PLAY_EXPLORATION_EPSILON=0.10`
- `HARD_SELF_PLAY_EXPLORATION_TEMPERATURE=1.15`
- `HARD_SELF_PLAY_MCTS_ROOT_NOISE_ENABLED=1`
- `HARD_SELF_PLAY_MCTS_ROOT_NOISE_ALPHA=0.30`
- `HARD_SELF_PLAY_MCTS_ROOT_NOISE_WEIGHT=0.25`

### 2.2 Expert 模板（推荐）

已落地在 [tools/train_expert_ai.sh](tools/train_expert_ai.sh) 默认值:
- `EXPERT_TRAIN_EPOCHS=48`
- `EXPERT_TRAIN_BATCH_SIZE=256`
- `EXPERT_TRAIN_LEARNING_RATE=1.2e-4`
- `EXPERT_TRAIN_WEIGHT_DECAY=3e-4`
- `EXPERT_TRAIN_GRAD_CLIP=0.8`
- `EXPERT_TRAIN_VALIDATION_RATIO=0.2`
- `EXPERT_TRAIN_ROUND_BUCKET_SIZE=1`
- `SELF_PLAY_GAMES=400`（已按此前默认值放大到 10 倍）
- `SELF_PLAY_MAX_STEPS=20000`
- `EXPERT_TRAIN_HIGH_FREQ_DOWNSAMPLE_POWER=0.55`
- `EXPERT_TRAIN_HIGH_FREQ_MIN_KEEP_PROB=0.15`
- `EXPERT_TRAIN_LOW_FREQ_WEIGHT_ALPHA=0.65`
- `EXPERT_TRAIN_CRITICAL_ACTION_BOOST=1.55`
- `EXPERT_TRAIN_TINY_RESNET_CHANNELS=96`
- `EXPERT_TRAIN_TINY_RESNET_BLOCKS=4`
- `EXPERT_TRAIN_TINY_RESNET_DROPOUT=0.10`
- `EXPERT_TRAIN_VALUE_LOSS_WEIGHT=0.40`
- `EXPERT_TRAIN_LABEL_SMOOTHING=0.03`
- `EXPERT_SELF_PLAY_EXPLORATION_EPSILON=0.06`
- `EXPERT_SELF_PLAY_EXPLORATION_TEMPERATURE=1.08`
- `EXPERT_SELF_PLAY_MCTS_ROOT_NOISE_ENABLED=1`
- `EXPERT_SELF_PLAY_MCTS_ROOT_NOISE_ALPHA=0.20`
- `EXPERT_SELF_PLAY_MCTS_ROOT_NOISE_WEIGHT=0.18`

## 3. 一键训练与接入

### 3.0 命令行自博弈数据生成（WSL 可用）

脚本: [tools/generate_self_play_dataset.js](tools/generate_self_play_dataset.js)

说明:
- 纯 Node 命令行执行，不依赖浏览器。
- 支持两种后端:
	- `--backend=app-full`：正式推荐；复用 app 真实 AI 自动机执行器（包含完整 pending 子流程）。
	- `--backend=core-rules`：遗留轻量后端，仅保留作实验性对照/回退。
- 自动生成 `turn-action` 训练样本 JSONL，可直接给 PyTorch 训练脚本使用。
- 支持探索参数：`--difficulty`、`--explorationEpsilon`、`--explorationTemperature`。
- Summary 已包含 `averageFinalScore` 与 `averageWinnerFinalScore`，可作为固定评测门槛。

示例:

```bash
node tools/generate_self_play_dataset.js --backend=app-full --games=20 --seed=hard-self-play --out=tools/_self_play_hard_samples.jsonl --summaryOut=tools/_self_play_hard_summary.json
```

### 3.1 Hard 训练并接入

```bash
./tools/train_hard_ai.sh
```

默认行为:
- 先通过命令行自博弈（默认 `SELF_PLAY_BACKEND=app-full`）生成数据集 `tools/_self_play_hard_samples.jsonl`。
- 再执行 PyTorch 训练并导出运行时模型。

可选环境变量:
- `USE_SELF_PLAY_DATASET=1`（默认）
- `SELF_PLAY_BACKEND=app-full`（默认，可切 `core-rules`）
- `SELF_PLAY_GAMES`（默认 20）
- `SELF_PLAY_EXPLORATION_EPSILON`（默认 0.10）
- `SELF_PLAY_EXPLORATION_TEMPERATURE`（默认 1.15）
- `SELF_PLAY_MCTS_ROOT_NOISE_ENABLED`（默认 1）
- `SELF_PLAY_MCTS_ROOT_NOISE_ALPHA`（默认 0.30）
- `SELF_PLAY_MCTS_ROOT_NOISE_WEIGHT`（默认 0.25）
- `SELF_PLAY_SIMULATIONS`（默认 192）
- `SELF_PLAY_MAX_DEPTH`（默认 6）
- `SELF_PLAY_CPUCT`（默认 1.5）
- `SELF_PLAY_ROLLOUT_DEPTH`（默认 5）

产物:
- [tools/_tmp_bc_model.json](tools/_tmp_bc_model.json)
- [randomizer/game/ai/trained-models.js](randomizer/game/ai/trained-models.js)

### 3.2 Expert 训练并接入

```bash
./tools/train_expert_ai.sh
```

默认行为:
- 先通过命令行自博弈（默认 `SELF_PLAY_BACKEND=app-full`）生成数据集 `tools/_self_play_expert_samples.jsonl`。
- 再执行 PyTorch 训练并导出运行时模型。

可选环境变量:
- `USE_SELF_PLAY_DATASET=1`（默认）
- `SELF_PLAY_BACKEND=app-full`（默认，可切 `core-rules`）
- `SELF_PLAY_GAMES`（默认 40）
- `SELF_PLAY_EXPLORATION_EPSILON`（默认 0.06）
- `SELF_PLAY_EXPLORATION_TEMPERATURE`（默认 1.08）
- `SELF_PLAY_MCTS_ROOT_NOISE_ENABLED`（默认 1）
- `SELF_PLAY_MCTS_ROOT_NOISE_ALPHA`（默认 0.20）
- `SELF_PLAY_MCTS_ROOT_NOISE_WEIGHT`（默认 0.18）
- `SELF_PLAY_SIMULATIONS`（默认 512）
- `SELF_PLAY_MAX_DEPTH`（默认 8）
- `SELF_PLAY_CPUCT`（默认 1.2）
- `SELF_PLAY_ROLLOUT_DEPTH`（默认 7）

产物:
- [tools/_tmp_expert_bc_model.json](tools/_tmp_expert_bc_model.json)
- [randomizer/game/ai/expert-trained-models.js](randomizer/game/ai/expert-trained-models.js)

## 3.3 闭环迭代训练脚本（训练 -> 新模型采样 -> 再训练）

脚本: [tools/iterative_self_play_training.sh](tools/iterative_self_play_training.sh)

能力:
- 每轮使用当前已接受模型先生成新数据。
- 训练时将“新数据 + 历史回放数据”混合，降低分布漂移风险。
- 固定 100 局评测，比较 `averageFinalScore`，仅当新模型更高时才采纳。
- 自博弈阶段默认带有探索：`explorationEpsilon=0.08`、`explorationTemperature=1.1`。
- 固定评测阶段会关闭探索与根噪声，避免采纳门槛被随机性影响。

示例:

```bash
MODE=hard ROUNDS=3 CONCURRENCY=20 ./tools/iterative_self_play_training.sh
MODE=expert ROUNDS=3 CONCURRENCY=20 ./tools/iterative_self_play_training.sh
```

## 4. 已接入游戏 AI 的保证

1. 页面会加载 hard/expert 两个训练模型脚本:
- [randomizer/index.html](randomizer/index.html#L621)
- [randomizer/index.html](randomizer/index.html#L622)

2. 运行时 hard/expert 决策强制要求训练模型存在，否则直接报错:
- [randomizer/app/ai-controller.js](randomizer/app/ai-controller.js#L952)
- [randomizer/app/ai-controller.js](randomizer/app/ai-controller.js#L955)

3. 决策计划里会记录本次使用模型的元信息（可用于追踪）:
- [randomizer/app/ai-controller.js](randomizer/app/ai-controller.js#L957)
- [randomizer/app/ai-controller.js](randomizer/app/ai-controller.js#L1052)

## 5. 说明

当前仓库可用训练样本文件仅有 [tools/_tmp_bc_samples.jsonl](tools/_tmp_bc_samples.jsonl)。
这意味着已按推荐参数运行训练，但样本规模仍偏小；若要继续提升强度，需要先扩大自博弈数据集。

## 6. 子流程头迁移记录

“回合级训练 -> 子流程头扩展”的结构改造记录与后续分阶段策略见：

- [docs/ai-subflow-head-migration.md](docs/ai-subflow-head-migration.md)