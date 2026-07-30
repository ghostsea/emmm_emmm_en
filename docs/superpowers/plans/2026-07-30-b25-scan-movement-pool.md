# b_25 扫描移动汇总 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让 b_25 在每次命中不同颜色扫描条件时由玩家分别确认，并把确认触发的移动与紫4选择的移动汇总为本次扫描行动末尾的一个移动力池。

**Architecture:** 保留 b_25 的三个独立 `signalMarked` 触发槽，只在 b_25 的单匹配场景打开触发确认；确认后把奖励规范化为带 `scanMovementPoolId` 的 `card_move` 并追加到当前扫描 flow 尾部，复用能力链的移动合并与撤销贡献记录。紫4仍在既定的“紫4 -> 紫2 -> 紫3”位置选择发射或移动，但选择移动时只向同一移动池贡献 1 点，实际移动在扫描节点完成后统一结算。

**Tech Stack:** 浏览器原生 JavaScript、Node.js `assert` 测试、无构建步骤静态页面。

## Global Constraints

- b_25 的黄色、红色、蓝色触发槽保持相互独立，每个槽最多完成一次。
- b_25 每次条件命中后先由玩家选择是否触发；取消不消耗触发槽。
- 只汇总同一个 `scanRunId` 内、同一玩家、无额外费用的扫描移动，不扩大到其它任务牌的免费移动。
- 紫4仍在紫2和紫3之前选择；选择发射时不贡献移动，选择移动时贡献 1 点到本次扫描移动池。
- 撤销合并来源时必须恢复对应触发槽或扣回对应移动贡献。
- 修改验证通过后用中文提交信息自动提交。

---

### Task 1: 锁定 b_25 触发确认与扫描移动池

**Files:**
- Modify: `randomizer/game/cards/effects.test.js`
- Modify: `randomizer/app/runtime-regressions.test.js`
- Modify: `randomizer/app/ai-controller.test.js`
- Modify: `randomizer/game/abilities/chain.js`
- Modify: `randomizer/game/abilities/chain.test.js`
- Modify: `randomizer/game/cards/effects.js`
- Modify: `randomizer/app.js`
- Modify: `randomizer/app/ai-controller.js`

**Interfaces:**
- Consumes: `cardEffects.collectMatchingTriggers(player, event)`、`abilities.chain.mergePendingMovementNode(chain, node, source)`、`pendingActionEffectFlow.scanRunId`。
- Produces: `isControlCenterScanTriggerMatch(match) -> boolean`、`createScanMovementPoolEffect(effect, flow) -> effect`、`insertActionEffectsAtEnd(effects, options) -> result`、`queueScanAction4MoveEffect() -> result`。

- [x] **Step 1: 写模型层失败测试**

在 `effects.test.js` 断言 b_25 三个颜色事件各返回一个 `CARD_MOVE` 奖励、移动力均为 1，消费黄色槽后红色和蓝色仍可分别命中。

- [x] **Step 2: 写运行时失败测试**

在 `runtime-regressions.test.js` 用真实 `SetiAbilityChain` 验证：

```js
const first = createScanMovementPoolEffect(b25Reward, flow);
const purple4 = createScanMovementPoolEffect({ options: { movementPoints: 1 } }, flow);
insertActionEffectsAtEnd([first]);
insertActionEffectsAtEnd([purple4], { source: purple4Source });
assert.equal(flow.effects.at(-1).options.movementPoints, 2);
```

同时断言单个 b_25 匹配走确认 picker、紫4的 `move` 分支调用 `queueScanAction4MoveEffect()`，而不是立即执行 `beginScanAction4FreeMove()`。

- [x] **Step 3: 运行测试并确认按预期失败**

Run:

```powershell
node randomizer/game/cards/effects.test.js
node randomizer/app/runtime-regressions.test.js
```

Expected: b_25 仍返回 `card_free_move`，扫描移动池 helper 不存在或紫4仍走即时移动，因此断言失败。

- [x] **Step 4: 实现最小模型与运行时修复**

- 将 b_25 的三个奖励建模为标准 `card_move`，保留 `movementPoints: 1`。
- 仅对 b_25 单匹配打开 `openCardTriggerPicker()`；取消后继续处理同批剩余事件，不消费槽位。
- b_25 在扫描 flow 内确认触发后，转成带当前 `scanRunId` 的扫描移动池节点并追加到 flow 尾部。
- 新增尾部插入 helper，继续使用 `mergePendingMovementNode()`、`markInsertedNode()` 和 `syncMergedCardMoveEffect()`。
- 紫4选择移动时向同一移动池追加 1 点并完成紫4节点；AI 也通过 `handleScanAction4Choice("move")` 走同一路径。

- [x] **Step 5: 运行目标测试并确认通过**

Run:

```powershell
node randomizer/game/cards/effects.test.js
node randomizer/game/abilities/chain.test.js
node randomizer/app/runtime-regressions.test.js
node randomizer/app/ai-controller.test.js
```

Expected: 全部退出码为 0。

### Task 2: 同步规则文档、浏览器缓存并完整验证

**Files:**
- Modify: `docs/mechanics-reference.md`
- Modify: `docs/effect-glossary.md`
- Modify: `randomizer/index.html`

**Interfaces:**
- Consumes: Task 1 的 `scanMovementPoolId` 汇总语义。
- Produces: 玩家可核对的 b_25/紫4规则说明和更新后的静态脚本版本参数。

- [x] **Step 1: 更新规则文档**

明确记录 b_25 每个不同颜色扫描事件分别询问是否触发；确认的移动与同一扫描中紫4选择的移动合并，在扫描节点完成后作为一个多点移动效果结算。

- [x] **Step 2: 更新缓存版本**

提升 `effects.js`、`app.js`、`ai-controller.js` 的 `?v=` 参数，确保浏览器不继续使用旧运行时。

- [x] **Step 3: 运行语法与完整测试**

Run:

```powershell
node --check randomizer/app.js
node --check randomizer/app/ai-controller.js
node --check randomizer/game/cards/effects.js
$tests = rg --files randomizer | Where-Object { $_ -match '\.test\.js$' } | Sort-Object
foreach ($test in $tests) {
  node $test
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}
```

Expected: 所有语法检查和测试退出码均为 0。

- [x] **Step 4: 检查修改边界并提交**

Run:

```powershell
git diff --check
git status --short
git diff --stat
git add docs/superpowers/plans/2026-07-30-b25-scan-movement-pool.md docs/mechanics-reference.md docs/effect-glossary.md randomizer/index.html randomizer/app.js randomizer/app/ai-controller.js randomizer/app/ai-controller.test.js randomizer/app/runtime-regressions.test.js randomizer/game/abilities/chain.js randomizer/game/abilities/chain.test.js randomizer/game/cards/effects.js randomizer/game/cards/effects.test.js
git commit -m "修复b25扫描移动触发与紫科汇总"
```

Expected: 只提交本计划列出的文件，并生成中文提交。
