# 公司能力设计与建模

本文档描述 SETI 随机器原型中**公司牌（Industry）**的 1x 主动能力与被动能力：规则语义、代码模块、运行时状态、UI 流程与撤销约定。人工规则摘要见 `assets/industry/能力介绍.md`。

## 模块结构

| 文件 | 职责 |
|------|------|
| `randomizer/game/industry/catalog.js` | 公司目录：`activeAbilityId`、`passiveIds`、是否已实现 1x |
| `randomizer/game/industry/abilities.js` | 主动能力：`buildActiveAbilityFlow`、角标/收入结算、哨兵效果节点 |
| `randomizer/game/industry/passives.js` | 被动钩子查询（火箭上限、研究费用、分析免能等） |
| `randomizer/game/industry/state.js` | 每轮 1x 标记、异星实验室板块、未来跨度专属标记、轮内运行时字段重置 |
| `randomizer/game/industry/placement.js` | 公司牌左下角「1x」圆标百分比坐标 |
| `randomizer/game/industry/index.js` | 聚合为 `window.SetiIndustry` |
| `randomizer/app.js` | UI：标记点击、能力流、被动触发、交互聚焦、撤销 |

测试：`node randomizer/game/industry/industry.test.js`

## 生命周期

### 1. 初始选择（Setup）

- 每位启用玩家：公司 2 选 1（`assets/industry`）、初始牌 3 选 2。
- 结果写入 `player.initialSelection`（`industry` + `removedInitialCards`）。
- 全部确认后 `initial-cards.js` → `resolveInitialSelections` 结算公司/初始牌即时效果。
- 若公司有「收入增加」次数，进入 **初始收入增加** 效果队列（`actionType: initialIncome`）。
- **在初始收入全部结算完成前**：主要行动、公司 1x、其它快速行动、手牌角标快速行动均不可用；仅可依次点击效果栏中的收入节点。

### 2. 正常对局（每轮一次 1x）

- 除 **异星实验室** 和 AI 专用 **作弊实验室** 外，公司牌左下角有 1x 圆标（`placement.js`）；**未来跨度研究所** 既有普通每轮 1x 圆标，也有独立的 `wlkd_token` 专属快速行动标记。
- 每**轮**（`turnState.roundNumber` 轮号）每玩家最多放置 1 次 `normal_token`；`player.industryRoundMarkRound === turnState.roundNumber` 表示本轮已用。`player.industryRoundMarkTurn` 只记录标记发生的回合号，不参与刷新判定。
- 未放置时牌面蓝色高亮（`is-action-marker-pending`）；放置后启动该公司 `buildActiveAbilityFlow`。
- 回合结束时清空当前玩家的图灵借用；新轮开始时（所有玩家都 PASS 后）`resetAllRoundIndustryRuntimeState` 清空借用/武装等，**不**清零 `industryRoundMarkRound` / `industryRoundMarkTurn`（靠轮号比较判定可否再标记）。

## 运行时状态字段

| 字段 | 含义 |
|------|------|
| `industryRoundMarkRound` / `industryRoundMarkTurn` | 已放置 1x 标记的轮号与发生回合号（刷新只看轮号） |
| `industryBorrowedTechTileId` / `industryBorrowedTechRound` / `industryBorrowedTechTurn` | 图灵系统：当前回合借用的科技片 id；带行动上下文时按 Round/Turn 精确判定；无显式上下文的同回合长链路按未清空的借用态生效 |
| `industrySentinelArmedRound` / `industrySentinelArmedTurn` | 哨兵：当前回合已武装「打牌后弃牌角标」；必须与当前 Round/Turn 同时匹配 |
| `industryHuanyuFreeMoveRound` / `industryHuanyuFreeMoveTurn` / `industryHuanyuFreeMovesLeft` / `industryHuanyuMovedRocketIds` | 旧寰宇免费移动运行时字段；当前主动效果改走快速行动效果队列，不再依赖这些字段 |
| `industryHuanyuSuperdriveRoundStartRound` / `industryCheatLabRoundStartRound` | AI 专用回合开始奖励的已结算轮号；防止同一轮因重渲染或初始选择/换轮钩子重复发放 |
| `industryPlayedCardThisRound` / `industryLastPlayedCardThisRound` / `industryPlayedCardRound` / `industryPlayedCardTurn` | 当前回合已打牌及牌快照（字段名沿用 ThisRound；回合结束清理，仅供哨兵补注入队） |
| `industryAlienLabPanels` / `industryAlienLabInitialized` | 异星实验室/作弊实验室三色板块正反面；蓝=发射、黄=扫描、粉=科技；作弊实验室按永久正面处理 |
| `industryFutureSpan` / `industryFutureSpanInitialized` | 未来跨度专属标记状态：扣下的牌、目标分、是否正在打出 |

普通 1x 的确定性流程从放置标记到能力结算记录到 `quickActionHistory`；撤销时恢复 1x 前玩家快照，并调用 `cancelIndustryAbilityFlow` 清掉进行中的选择、移动或借用状态。层云核心使用快速行动来源的效果队列，放置标记的恢复命令记录在第一个效果步骤中；撤销后续效果只回退对应奖励，撤销第一个效果会同时回退本次公司标记并关闭层云核心效果流。进行中的公司选择/移动/借用流程若被取消，会回滚当前公司 quick step，避免 token 留在牌上但能力未结算。涉及公共牌精选并补牌/盲抽的新信息流程仍在确认后写入不可撤销屏障；芬威克若精选到移动角标，取消后续免费移动只放弃移动并提交该不可撤销快速行动。

## 主动能力（1x）建模

`catalog.js` 中 `activeAbilityId` → `abilities.js` 中 `buildActiveAbilityFlow` 返回 `flowType`，由 `app.js` 的 `startIndustryAbilityFlow` 分发 UI。

| 公司 | activeAbilityId | flowType | 规则摘要 |
|------|-----------------|----------|----------|
| 层云核心 | `stratus_public_corners` | `stratus_public_corners` | 根据公共牌区 3 张牌生成效果队列，逐个结算**左上角弃牌角标**（不弃牌、不移除公共牌） |
| 图灵系统 | `turing_borrow_tech` | `turing_borrow_tech` | 选择供应区一项橙色或紫色科技，**当前回合**借用其效果（不获得板块/bonus）；公司牌下方只复制显示该科技图标 |
| 哨兵探测网络 | `sentinel_arm_play_corner` | `sentinel_arm_play_corner` | 武装当前回合；**打牌效果队列末尾**追加 `industry_sentinel_corner` 结算打出牌弃牌角标（非外星人） |
| 寰宇动力 | `huanyu_free_moves` | `huanyu_free_moves` | 启动 2 个移动效果队列节点；每个节点提供 1 点移动力，已结算节点的火箭不能作为后续寰宇节点目标，可跳过任一节点 |
| 寰宇超动力 | `huanyu_free_moves` | `huanyu_free_moves` | AI 专用；以寰宇动力为模板，额外每轮开始获得 1 能量、1 盲抽、1 宣传，且 PASS 后追加一次免费发射 |
| 赫利昂联合体 | `helios_remove_tech_income` | `helios_remove_tech` → 弃牌收入 | 使一项非蓝科技失效 + 1 次收入（弃 1 张手牌按收入角标）；该科技仍视为拥有并参与科技数量计分 |
| 任务中继站 | `mission_publicity_pick_income` | `mission_publicity_pick` | 消耗 2 宣传精选 1 张牌，获得其**收入角标**奖励（盲抽角标会盲抽 1 张） |
| 芬威克研究中心 | `fenwick_publicity_pick_corner` | `fenwick_publicity_pick` | 消耗 1 宣传精选 1 张牌，获得**弃牌角标**（不弃牌）；若角标是移动，移动选择可取消但精选补牌仍不可撤销 |
| 深空探测 | `deepspace_swap_cards` | `deepspace_swap` | 选手牌 1 张再选公共牌 1 张交换 |
| 宇宙战略集团 | `strategy_pick_card` | `strategy_pick` | 精选 1 张公共牌（无额外资源）；确认精选后清除 3 个被动奖励槽 token |
| 未来跨度研究所 | `future_span_pick_advance` | `future_span_pick` | 若专属标记已有未达成目标牌：精选 1 张公共牌，并将目标分提高 3 |
| 异星实验室 | — | — | **无 1x 圆标**（`EXCLUDED_INDUSTRY_LABELS`） |
| 作弊实验室 | — | — | AI 专用；复用异星实验室牌图与初始收益，**无 1x 圆标**，三色板块永久正面；每轮开始额外获得 1 能量和 1 盲抽 |

### 未来跨度研究所

- 公司牌上的 `wlkd_token` 是独立快速行动：选择 1 张费用为信用点的手牌（半人马等能量费用牌不可选），将其从手牌移到公司牌下方，并设置目标分为当前分数 + 15/25/35/45（对应牌费 1/2/3/4）。
- 已有目标牌时不能再次使用专属标记；扣下的牌不在手牌、保留牌或弃牌堆中，但会计入牌库占用，避免被重新抽到。
- 当玩家分数达到目标分后，目标牌高亮为可打出，但不显示专属标记；玩家可用标准“打牌”主行动免费打出该牌。打牌效果与临时任务奖励全部完成后，专属标记回到公司牌，当轮即可再次作为快速行动使用。
- 底部普通 1x 只能在已有未达成目标牌时使用；精选并补牌后不可撤销，随后 `industryFutureSpan.targetScore += 3`。

### 共享能力函数（`abilities.js`）

- `getCornerReward(cards, card)`：读左上角弃牌角标 → `{ kind: "resource" \| "move", gain, dataCount?, movementPoints? }`
- `applyCornerReward(players, data, player, reward)`：结算资源/数据；移动类返回 `pendingFreeMove`
- `applyIncomeResourcesFromCard`：任务中继站精选后的收入角标奖励（资源、数据与 `handSize` 盲抽）
- `buildStratusPublicCornerEffectNodes`：生成层云核心快速行动队列节点 `type: "industry_stratus_corner"`
- `buildSentinelPlayCornerEffectNodes`：生成打牌队列节点 `type: "industry_sentinel_corner"`

### 哨兵特殊流程

1. 放置 1x → `industrySentinelArmedRound = round` 且 `industrySentinelArmedTurn = turn`
2. 当前回合打牌时若已标记且已武装 → 队列追加 `industry_sentinel_corner`
3. 若先打牌后标记且该牌是当前回合打出 → `tryInjectSentinelPlayCornerEffectAfterArm` 补开或追加队列
4. 节点执行：`executeIndustrySentinelCornerEffect`；移动角标再插入 `CARD_MOVE` 子效果

## 被动能力建模

`catalog.js` 的 `passiveIds` → `passives.js` 查询 → 在 `app.js` 或其它模块钩子处生效。

| passiveId | 公司 | 行为 | 钩子位置 |
|-----------|------|------|----------|
| `turing_blue_tech_publicity` | 图灵系统 | 获取蓝色科技 +1 宣传 | `app.js` 科技放置后 |
| `sentinel_launch_scan_earth` | 哨兵探测网络 | 发射后免费扫描地球扇区；若完成扇区则进入 `sector_finish_scan` 收尾 | `maybeApplyIndustryLaunchScan` / `startLaunchSectorFinishEffectFlow` |
| `huanyu_rocket_limit` | 寰宇动力 | 火箭数量上限 +1 | `launch.js` / `rocket.js` |
| `huanyu_superdrive_round_start` | 寰宇超动力 | 每轮开始获得 1 能量、1 盲抽、1 宣传；包括第一轮初始选择结算后 | `applyIndustryRoundStartBonuses` |
| `huanyu_superdrive_pass_launch` | 寰宇超动力 | PASS 效果队列末尾追加一次免费发射，忽略火箭上限 | `buildPassEffectQueue` / `industry_huanyu_superdrive_launch` |
| `mission_play_type_publicity` | 任务中继站 | 本玩家每当打出 1/2 型任务牌 +1 宣传 | `applyIndustryPlayCardPassives` |
| `mission_startup_final_mark` | 任务中继站 | 开局终局 c 板块 3 号位标记 | `applyIndustryStartupPassives` |
| `fenwick_research_cost` | 芬威克研究中心 | 研究科技宣传 5（默认 6） | `tech/resolver.js`、`abilities/tech.js` |
| `deepspace_free_analyze` | 深空探测 | 分析数据不耗能量 | `abilities/data.js` |
| `strategy_passive_reward_slots` | 宇宙战略集团 | 打牌后按扫描角标在打牌流程的动态后续效果全部结束后追加奖励槽节点；确认节点才放 token 并领奖，跳过不占槽；黑色角标多空槽时由玩家选择；已占槽位只能等 1x 快速行动确认精选后清理 | `applyIndustryPlayCardPassives` / `industry_strategy_passive_reward` |
| `future_span_parking` | 未来跨度研究所 | 专属标记扣牌、目标分、达标后免费打出 | `app.js` 公司牌叠层与打牌流程 |
| `alien_lab_panels` | 异星实验室 | 三色板块折扣：发射 1 信用点、扫描 2 能量、研究科技 4 宣传；正面板块可点击并等同触发对应主要行动；对应标准主行动后翻背，同色外星痕迹翻回正面 | `launch.js` / `scan-effects.js` / `tech/resolver.js` / `app.js` |
| `cheat_lab_permanent_panels` | 作弊实验室 | AI 专用异星实验室强化：蓝/黄/粉三色板块永久按正面计费和渲染，执行发射/扫描/研究科技后不翻背 | `passives.js` / `render.js` / `app.js` / `ai-controller.js` |
| `cheat_lab_round_start` | 作弊实验室 | 每轮开始获得 1 能量和 1 盲抽；包括第一轮初始选择结算后 | `applyIndustryRoundStartBonuses` |

图灵借用：只能选择供应区橙色或紫色科技。科技效果查询在拥有板块之外，带行动上下文时要求 `industryBorrowedTechTileId === tileId` 且借用的 Round/Turn 都等于当前行动上下文；无显式上下文的同回合长链路会按玩家身上未清空的借用态生效，直到回合结束清空。橙色科技经 `players.playerOwnsTech` 生效，紫色扫描科技经 `scan-effects.js` 的扫描队列构建生效。UI 会在公司牌下方复制显示对应科技图标用于提示，不从供应区拿走科技片，也不获得 bonus；回合结束会清空当前玩家借用状态并移除显示图标，新轮开始也会清空所有轮内借用状态。

## UI 与 `flowType` 映射（`app.js`）

| flowType | UI 行为 |
|----------|---------|
| `stratus_public_corners` | 根据当前 3 张公共牌生成 quick-source effect flow，按效果栏结算 |
| `turing_borrow_tech` | 科技板借用模式 `industryBorrowMode` |
| `sentinel_arm_play_corner` | 即时武装；可能补注入队 |
| `huanyu_free_moves` | 快速行动效果队列：2 个 `card_move` 节点，节点内可补移动牌/能量满足地形移动力 |
| `helios_remove_tech` | 扫描式科技选择 → 弃牌收入 `industry_helios_income` |
| `mission_publicity_pick` / `fenwick_publicity_pick` | 消耗宣传 + 公共牌精选 |
| `deepspace_swap` | 手牌选择 → 公共牌选择交换 |
| `future_span_pick` | 公共牌精选 → 目标分 +3 |
| `strategy_pick` | 公共牌精选 |

交互聚焦（`data-interaction-focus`）：仅在**进行中**的精选/手牌/科技/移动流程时暗化其它区域；公司 1x 可放置时**不**自动全屏聚焦，仅用牌面高亮。

## 撤销约定

| 类型 | 可撤销 | 说明 |
|------|--------|------|
| 普通 1x 确定性流程 | 是 | 标记、图灵借用、赫利昂、深空交换等并入 quick history，撤销回到 1x 前 |
| 层云核心 | 是 | 不弃牌；角标奖励按效果步骤撤销，第一个效果步骤同时包含公司标记回退 |
| 图灵借用 | 是 | 恢复借用前玩家快照，撤销后 1x 标记也回到可用 |
| 寰宇移动 | 是 | 2 个快速行动效果队列节点逐个撤销；1x 标记通过队列预置撤销命令同事务恢复 |
| 赫利昂 | 是 | 失效科技、确认科技时清槽和收入随 1x 前快照恢复 |
| 深空交换 | 是 | 交换手牌与公共牌快照随 1x 前快照恢复 |
| 哨兵打牌角标 | 是 | 主行动效果队列内 `industry_sentinel_corner` |
| 宇宙战略打牌奖励槽 | 是 | 主行动效果队列内 `industry_strategy_passive_reward`；跳过不放 token，确认后 token 与奖励同一步恢复 |
| 未来跨度专属标记 | 是 | 扣下手牌与目标分快照 |
| 任务中继站 / 芬威克 / 未来跨度普通 1x / 宇宙战略 | 否 | 精选并拿走/刷新公共牌；确认拿牌后提交快速行动历史，之前的快速行动也不再可撤销 |

`isIndustryIrreversibleFlow`：`mission_publicity_pick`、`fenwick_publicity_pick`、`future_span_pick`、`strategy_pick`。

## 与初始牌/公司开局效果的关系

- **公司牌即时效果**（资源重设、盲抽、发射、扫描等）：`initial-cards.js` 在 `resolveInitialSelections` 中一次性结算。
- **收入增加**：不即时给资源，而是生成 `pendingIncomeIncreases`，由 `startInitialIncomeEffectFlow` 排队；玩家弃 1 张手牌按该牌**收入角标**提升 `player.income` 并立即按新收入结算资源。
- 任务中继站被动终局标记在 `applyIndustryStartupPassives` 中调用 `finalScoring.placeDirectMarkAtSlot(..., "c", ..., 3)`。

## 扩展新公司检查清单

1. 在 `assets/industry/` 增加资产与 `能力介绍.md` 行
2. `placement.js` 校准 1x 圆标（若无则加入 `EXCLUDED` / `SKIPPED`）
3. `catalog.js`：`activeAbilityId`、`passiveIds`
4. `abilities.js`：`armAbilityState`、`buildActiveAbilityFlow` 分支
5. `app.js`：`startIndustryAbilityFlow` 分支与确认/取消处理
6. 被动：在 `passives.js` 增加 id 并在对应游戏逻辑处钩子
7. 撤销：判断是否 `isIndustryIrreversibleFlow`；可撤销步骤写入 `quickActionHistory`
8. 测试与更新 `AGENTS.md`、本文档
