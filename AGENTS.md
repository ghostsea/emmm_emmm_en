# SETI 机制与能力函数化说明

这份文档给后续 agent / 工程师一个当前代码底层机制的入口。仓库当前是一个无构建步骤的浏览器原型，核心逻辑在 `randomizer/game/**`，入口 UI 在 `randomizer/app.js`。每次代码和框架修改后记得检查和补齐本文档。

## 效果术语表
当需要查看某个具体效果术语的效果时参考：docs\effect-glossary.md

## 当前状态模型

### 玩家状态

玩家由 `randomizer/game/players.js` 管理：

- `resources`：`credits`、`energy`、`publicity`、`availableData`、`additionalPublicScan`、`handSize`、`score`。
- `income`：每轮收入记录，字段与部分资源同名（含 `additionalPublicScan`）。
- `hand` / `reservedCards`：手牌与保留牌。`handSize` 始终同步为 `hand.length`。
- `techState`：玩家已拥有科技 `ownedTiles`，以及蓝色科技放置位 `blueBoardSlots`。
- `dataState`：由数据模块懒初始化，包含 `poolTokens`、`placedTokens`、`discardedCount`。
- `orbitCount`：玩家已完成环绕数量。

资源工具函数：

- `canAfford(player, cost)`：检查资源是否足够。
- `spendResources(player, cost)`：支付资源，失败不支付。
- `gainResources(player, gain)`：获得资源，并处理宣传/数据上限。
- `gainIncome(player, gain)`：增加收入。

### 火箭状态

火箭由 `randomizer/game/rockets.js` 管理：

- `rocketState.rockets[]`：太阳系主盘上的玩家飞船，或行星参考图上的标记。
- `activeRocketId`：当前内部选中飞船；移动完成后会清空，玩家若要继续移动必须重新点击火箭。
- `nextRocketId`：全局火箭 id 自增。
- `playerRocketSequences`：每位玩家自己的 R1/R2 序号池。

主盘火箭使用扇区坐标 `{ x: 0..7, y: 1..4 }` 和 `slotIndex` 表示位置。每个扇区有 9 个发射/停靠槽，放置优先级为中心、四角、四边。

玩家默认最多拥有 1 枚主盘可控火箭；拥有橙色 1 号科技后上限提高到 2 枚。环绕、登陆等移除火箭的行动会释放该数量占用。

移动 UI 由 `moveHighlightRocketId` 控制当前高亮火箭和移动箭头。确认移动成功后，`app.js` 会清空高亮、隐藏箭头层并清空 `activeRocketId`，回到默认未选中状态。

环绕/登陆判定不再硬性依赖 `activeRocketId`。若当前玩家没有有效选中火箭，`shared.getRocketPlanet` 会自动查找当前玩家停在非地球星球格上的第一枚火箭，用于启用并执行环绕/登陆行动。

### 星球状态

星球统计由 `randomizer/game/planet-stats.js` 管理：

- 每个星球记录 `orbits`、`landings`、`orbitMarkers`、`landingMarkers`、`satelliteLandings`。
- `canAddOrbitMarker` / `canAddLandingMarker` 根据行星参考图槽位判断是否可放置。
- `addPlanetOrbitMarker` / `addPlanetLandingMarker` / `addSatelliteLandingMarker` 会生成玩家颜色标记。
- 登陆主星消耗基础 3 能量；若该星球已有任意环绕标记，则消耗降为 2 能量；拥有橙色 3 号科技时再减少 1 能量。
- 默认不能登陆卫星；拥有橙色 4 号科技后，登陆行动才会把可用卫星加入目标选择。

### 外星人痕迹状态

外星人由 `randomizer/game/aliens/` 管理，当前有两个未揭示槽位（外星人 1 / 外星人 2）：

- 牌库共 8 种外星人（见 `catalog.js`：`九折`、`半人马`、`奥陌陌`、`异常点`、`方舟`、`符文族`、`虫`、`阿米巴`）。
- 开局或点击随机化时，`randomizeAlienAssignments` 会从 8 种中无放回抽取 2 种，分别写入两个槽位的 `assignedAlienId`（未揭示前不显示正面）。
- 每种外星人需要三种首标记：`yellow`（黄色痕迹）、`pink`（粉色痕迹）、`blue`（蓝色痕迹）。
- `traces[traceType].firstPlaced` / `ownerPlayerColor` 记录该颜色第一个标记是否已放置及归属玩家。
- 同颜色后续标记只累加 `extraCount`，不再产生新的版图标记。
- 三种首标记都放置后，`isAlienReadyToReveal` 为真；`revealAlien` 使用 `assignedAlienId` 翻开对应外星人，并把 `.alien-back` 图片替换为 `assets/aliens/<id>/face.png`（宽度保持 100%，高度自适应）。

UI 校准：

- 两个外星人状态图（`state1.png` / `state2.png`）上各有 3 个可拖动 `normal_token.png` 标记，分别对应粉/黄/蓝痕迹框。
- 拖动结束后会在浏览器控制台输出 `[外星人痕迹坐标]`，并写入状态日志的「外星人痕迹」区段。
- 默认坐标在 `randomizer/game/aliens/placement.js` 的 `ALIEN_TRACE_MARKER_SLOTS`，拖动结果保存在渲染层 override 中，供后续固化。
- 首标记仅在 `firstPlaced` 后显示玩家 token（已校准坐标，`ALIEN_TRACE_TOKEN_DISPLAY_SCALE` 当前为 7），无默认参考图标。
- 非首标记数量不限；网格锚点为 `ALIEN_EXTRA_TRACE_MARKER_SLOTS`（第二行第二列中心，可拖动），从锚点与 token 尺寸反推第一格中心，再按每行 3 个向右、向下排布；`ALIEN_EXTRA_TRACE_TOKEN_DISPLAY_SCALE` 当前为 5。
- 调试「获取外星人标记」：未放置首标记时放首标记，已放置则追加非首标记；外星人揭示后仍可继续追加非首标记，但不能再补首标记。

### 扇区与星云状态

太阳系布局由 `randomizer/solar-system/layout.js` 和 `core.js` 定义：

- 主盘坐标：`x=0..7` 表示 8 个角向扇区，`y=0..5` 表示太阳、四层轨道和星云环。
- `CONTENT_KIND`：`sun`、`planet`、`asteroid`、`comet`、`empty_space`、`hole`、`nebula`、`outside_wheel`。
- `SECTORS`：4 张外圈扇区板块，每张包含 2 个星云。
- `sectorBySlot`：设置阶段确定 4 张扇区板块装入外圈槽位后的映射。
- `getNebulaAtCoordinate(x, 5, sectorBySlot)`：按当前设置查找外圈某坐标的星云。

星云数据由 `randomizer/game/data/nebula-state.js` 管理：

- `nebulaDataState.nebulae[nebulaId].tokens[]`：星云上的数据 token。
- 每个 token 记录 `slotIndex`、坐标，以及是否已被某玩家替换。
- `fillNebulaData` 会按星云容量填充数据。
- `replaceNextNebulaDataToken` 会按 `slotIndex` 从小到大替换第一个未替换 token。
- 当前代码会返回第二格 `+2` 分信息，但实际加分尚未完全接入扫描结算。

玩家数据由 `randomizer/game/data/state.js` 管理：

- 扫描获得数据进入 `player.dataState.poolTokens`，上限为 6。
- 数据池满时，额外获得的数据会增加 `discardedCount`，不进入数据池。
- 放置数据会从数据池最左侧 token 移入计算机第一排，或满足条件时移入蓝色科技附加槽。
- 分析数据要求计算机第一排第 6 位已有数据，消耗 1 能量并清空已放置数据。

## 行动机制

当前主行动包括：

- `launch`：发射，默认消耗 2 信用点，在地球所在扇区放置火箭；若玩家已达到火箭数量上限则不可执行。
- `orbit`：环绕，要求当前火箭在非地球星球格，消耗 1 信用点 + 1 能量，移除火箭并放置环绕标记。
- `land`：登陆，要求当前火箭在非地球星球格，消耗 1/2/3 能量，移除火箭并放置主星/卫星登陆标记；卫星登陆需要橙色 4 号科技。
- `scan`：扫描，默认消耗 1 信用点 + 2 能量，生成扫描效果队列。
- `analyze`：分析数据，消耗 1 能量并清空已放置数据。
- `playCard`：打牌，打开手牌选择/打出流程。
- `researchTech`：研究科技，先进入科技选择；玩家点击“确认”后默认消耗 6 宣传，太阳系公转，拿取科技板块及奖励，确认结算不可撤销。

主行动锁定规则：

- 每个主行动触发的动作和效果全部处理完后，才允许点击“确认”。
- 主行动执行中、效果队列处理中或主行动待确认时，其他主行动按钮全部禁用。
- “确认”只确认当前主行动会话，不会提交或清除快速行动历史。
- “撤销”按最近完成的主/快速步骤回滚；主行动整体仍可通过回滚会话撤销。
- 行动可以由能力事件链组成；链上每个节点是一个原子能力，能力返回 `undoable` 决定是否进入撤销历史。
- 科技行动采用确认流：先选择科技并金色高亮，不旋转、不拿取、不结算奖励；点击“确认”后才执行不可撤销结算。

### 橙色科技效果

- 橙色 1：获得时立刻执行一次免费发射（不消耗信用点）；同时玩家火箭上限从 1 提高到 2。
- 橙色 2：火箭通过移动进入小行星时获得 1 宣传；从小行星移出只需要 1 点移动力。没有橙色 2 时，从小行星移出需要 2 点移动力。
- 橙色 3：基础行动登陆能量消耗减少 1，因此无环绕为 2 能量，有环绕为 1 能量。
- 橙色 4：解锁卫星登陆；没有该科技时登陆目标列表只包含主星。

### 环绕 / 登陆奖励效果流

环绕、登陆主星、登陆卫星的奖励表由 `randomizer/game/actions/planet-rewards.js` 管理：

- `buildOrbitRewardEffects(planetId, markerSequence)`：环绕奖励。若 `markerSequence === 1`，先插入“首次环绕 +3 分”，再按星球固定奖励顺序生成效果节点。
- `buildPlanetLandRewardEffects(planetId, markerSequence)`：主星登陆奖励。除火星外，只有首次登陆额外获得数据；火星第 1 次额外 2 数据，第 2 次额外 1 数据。
- `buildSatelliteLandRewardEffects(satelliteId)`：卫星登陆奖励。
- `buildRewardEffectsForAction(actionId, result)`：`app.js` 在 `orbitProbe` / `landProbe` 成功后调用，生成奖励效果链。

执行流：

- `orbitProbe` / `landProbe` 仍只负责支付成本、移除火箭、放置环绕/登陆/卫星标记，并返回可撤销命令。
- `app.js` 在环绕/登陆成功后，先把标记动作作为 `action_start` 步骤写入 `actionHistory`，再启动奖励效果链。
- 奖励效果链逐个点击执行；全部完成后才进入主行动“待确认”。
- 自动奖励（分数、能量、宣传、数据、盲抽）直接结算并写入撤销命令。
- 选择型奖励复用现有 UI：精选卡牌、收入弃牌、星云二选一、外星人痕迹选择；选择完成后推进当前奖励节点。
- 盲抽/精选等获取卡牌的奖励一旦完成，当前主行动不可再撤销，只能继续完成效果并最终确认。
- 黄色外星人标记限制为 `yellow` 痕迹；任意外星人标记允许 `yellow` / `pink` / `blue`。

当前解释约定：

- “收入”按现有收入效果处理：玩家弃 1 张手牌，按该牌收入角标增加收入。
- “精选”按现有精选处理：从公共牌区拿 1 张牌，且当前仍允许使用盲抽按钮。
- 盲抽奖励使用 `assets/symbol/effect/blind_card.webp`。
- 奖励效果和通用资源效果图标统一从 `assets/symbol/effect/` 读取；缺少的资源图标从 `assets/symbol/split/seti-icons/` 复制为语义化文件名后再引用。
- 固定星球扇区扫描使用 `assets/symbol/effect/normal_scan.webp`，并在效果按钮上显示星球名角标；天王星/海王星的织女一/绘架座β二选一扫描使用 `black_scan.webp`；红/蓝/黄星云扫描分别使用 `red_scan.webp`、`blue_scan.webp`、`yellow_scan.webp`。
- 外星人标记使用 `assets/symbol/effect/alien_*.webp` 素材；代码 icon key 与文件名保持一致。

快速行动不属于主行动确认门槛：

- 快速交易：通过 `quick-trades.js` 改变资源/手牌/牌区。
- 放置数据：从数据池放入计算机或蓝色科技附加位。
- 移动：点击已有火箭后选择方向，确认时按所需移动力支付；1 点移动力可消耗 1 能量或弃 1 张移动牌。没有橙色 2 时，从小行星移出需要 2 点移动力，可用 2 能量、2 张移动牌、或 1 张移动牌 + 1 能量支付。紫4扫描移动提供 1 点免费移动力。
- 火箭移动到非地球行星时，该玩家获得 1 宣传；拥有橙色 2 时，移动进入小行星也获得 1 宣传。

快速行动可以在主行动之前、主行动待确认之后，以及主行动效果队列的不同效果之间使用。快速行动会记录可撤销步骤，但不会让“确认”按钮变为可用，也不会改变主行动是否已经完成。

### 扫描效果队列

扫描队列由 `randomizer/game/actions/scan-effects.js` 构建，并由 `randomizer/game/abilities/chain.js` 管理为能力事件链：

- 第一个节点始终是 `payScanCost`，点击后才支付 1 信用点 + 2 能量，可撤销。
- 无紫色科技：支付扫描费用 + 地球所在扇区扫描 + 公共牌区扫描。
- 公共牌区扫描默认弃 1 张选 2 选 1 星云；玩家每有 1 个 `additionalPublicScan` 可多选 1 张公共牌（最多 2 个，即最多弃 3 张），弃牌后按张数依次弹出多组 2 选 1 星云（可重复）。
- 紫1：地球扇区扫描升级为“地球及相邻扇区三选一”。
- 紫2：额外增加水星所在扇区扫描。
- 紫3：额外增加手牌扫描。
- 紫4：额外增加“发射/移动”效果；发射消耗 1 能量，移动免费。

每个效果在 UI 中是 `pendingActionEffectFlow.effects[]` 的一个能力链节点。节点可以完成或跳过；可撤销节点完成后会写入 `actionHistory`，撤销会回到该节点重新等待触发。全部处理完后，主行动进入“待确认/待撤销”状态。在效果队列之间允许执行快速行动；快速行动撤销后，扫描队列仍停留在原来的主行动流程中。

## 撤销机制

撤销由 `randomizer/game/history/action-history.js` 实现。当前有两条并行的事务历史：

- `actionHistory`：主行动会话，控制主行动确认/撤销。
- `quickActionHistory`：快速行动会话，记录快速交易、放置数据、移动等快速步骤。
- `historyStepOrder`：`app.js` 中的轻量顺序栈，用于在主/快速行动交错时按最近完成步骤撤销。

`createActionHistory()` 提供的会话 API：

- `beginSession(actionType, label)`：开始一个行动会话。
- `beginStep(meta)`：开始一个可撤销步骤。
- `record(command)`：记录命令，命令必须有 `undo()`。
- `endStep()`：结束当前步骤。
- `undoLastStep()`：撤销当前会话最后一步。
- `rollbackSession()`：撤销整个当前行动。
- `commitSession()`：确认或结束会话，清空当前会话。

主行动确认只会 `commitSession()` 主行动的 `actionHistory`。快速行动没有确认按钮；当快速行动步骤都被撤销后，`quickActionHistory` 会自动提交清空。

具体撤销命令在 `randomizer/game/history/commands.js`：

- 资源支付撤销：退回资源。
- 星云替换撤销：恢复 token 原 owner。
- 获得数据撤销：移除数据池 token，或回退弃置计数。
- 公共牌/手牌扫描撤销：恢复牌区、手牌、弃牌堆。
- 发射撤销：移除火箭并恢复 `nextRocketId` / `activeRocketId`。
- 移动撤销：恢复火箭移动前快照。
- 交易、分析、放置数据撤销：恢复对应快照。
- 通用快照撤销：恢复玩家、火箭状态、星球状态等对象快照，用于原子能力的复合副作用。

新增能力函数必须只返回 `commands`，不直接写入 `actionHistory`。调用方负责在当前 session/step 中记录这些命令。
能力必须显式返回 `undoable`；`undoable: false` 的能力成功后不写入 `actionHistory`，失败时必须自行恢复到执行前状态。

移动撤销细节：

- 正常移动通过 `moveProbe(context, { cost: { energy: 1 }, movementPoints: 1 })` 结算，撤销命令同时恢复玩家资源/奖励与火箭快照。
- 弃移动牌支付时，先记录手牌/弃牌堆快照，再用 `moveProbe(context, { cost: {}, movementPoints })` 移动；小行星移出可传入 `movementPoints: 2`。
- 移动成功后 UI 立即清除高亮和箭头；撤销只恢复火箭位置和资源/牌区，不重新进入移动选中状态。

## 能力函数层

新增能力层位于 `randomizer/game/abilities/`：

- `chain.js`：
  - `startAbilityChain(chainId, label, nodes)`
  - `getCurrentChainNode(chain)`
  - `resolveCurrentChainNode(chain, result)`
  - `skipCurrentChainNode(chain)`
  - `undoLastChainStep(chain)`
  - `finishAbilityChain(chain)`
- `rocket.js`：
  - `launchProbe(context, options)`
  - `moveProbe(context, options)`
- `planet.js`：
  - `orbitProbe(context, options)`
  - `landProbe(context, options)`
- `data.js`：
  - `analyzeData(context, options)`
- `tech.js`：
  - `researchTechPrepare(context, options)`
  - `researchTechSelect(context, options)`
  - `researchTechCommit(context, options)`
- `scan.js`：
  - `payScanCost(context, options)`
  - `scanSector(context, options)`
  - `scanNebula(context, options)`
  - `scanPublicCard(context, options)`
  - `scanHandCard(context, options)`
  - `scanAction4(context, options)`
- `index.js`：
  - `executeAbility(abilityId, context, options)`
  - `getAbility(abilityId)`
  - `listAbilities()`

能力返回形状：

```js
{
  ok: true,
  abilityId: "scanSector",
  message: "...",
  undoable: true,
  commands: [],
  cost: {},
  payload: {},
  events: []
}
```

参数约定：

- `context` 复用 `app.js` 的状态上下文，不引入新状态副本。
- `options.cost` 覆盖默认支付成本。
- `options.skipCost === true` 表示免费触发。
- `options.movementPoints` 表示本次移动实际提供的移动力；未传时按能量成本推导，免费移动默认为 1。
- `options.source` 标识来源，例如 `scan`、`card`、`tech`、`debug`。
- `options.historyLabel` 用于生成撤销命令文案。
- 需要玩家选择的流程由 UI 打开 overlay，能力函数只结算已经确定的目标。

行动可以被视为特殊能力编排器：

- 正常发射：`launchProbe(context, { cost: { credits: 2 } })`。
- 橙色 1 免费发射：`launchProbe(context, { skipCost: true, source: "tech" })`。
- 紫4扫描发射：`launchProbe(context, { cost: { energy: 1 } })`。
- 正常快速移动：`moveProbe(context, { cost: { energy: 1 }, movementPoints: 1, rocketId, deltaX, deltaY })`。
- 弃移动牌/紫4扫描移动：`moveProbe(context, { cost: {}, movementPoints, rocketId, deltaX, deltaY })`。
- 扇区扫描：`scanSector(context, { nebulaId })` 或 `scanSector(context, { sectorX })`。
- 公共/手牌扫描：UI 先选择牌和目标星云，再调用 `scanPublicCard` / `scanHandCard`；能力原子化结算“星云替换 + 获得数据 + 弃除来源牌/补公共牌”，并返回同一组撤销命令。
- 科技选择：`researchTechPrepare` 进入选择，`researchTechSelect` 只记录选中的科技/蓝色槽位并显示金色高亮，`researchTechCommit` 点击确认后执行旋转、拿科技和奖励；该提交能力 `undoable: false`。

## 卡牌模型

- 卡牌源数据保持 CSV，方便手工校对和继续补内容。使用层通过中间构建把 `assets/cards/card_model.csv` 转成 `assets/cards/card_model.json` 和 `randomizer/game/card-catalog.js`，卡牌只声明能力 id、参数和费用覆盖。

## 后续改造方向

- `orbit`、`land`、`analyze`、`researchTech` 已拆成能力函数；后续继续处理 `playCard`，并让卡牌/科技通过 `cost` 参数触发低费或免费版本。
- 将扫描第二格 +2 分、扇区完成、赢家/第二名、推广和扇区奖励做成 `onSignalMarked` / `onSectorCompleted` 事件能力。
- 将 UI 的 overlay 选择与底层 ability 彻底分离，使能力函数可被测试、AI agent 和模拟器复用。

## 验证命令

当前无 package.json，测试以 Node 脚本运行：

```powershell
node randomizer/game/abilities/abilities.test.js
node randomizer/game/abilities/chain.test.js
node randomizer/game/actions/scan-effects.test.js
node randomizer/game/actions/planet-rewards.test.js
node randomizer/game/history/action-history.test.js
node randomizer/game/history/commands.test.js
node randomizer/game/rockets.move.test.js
node randomizer/game/data/nebula.test.js
node randomizer/game/data/data.test.js
node randomizer/game/tech/tech.test.js
node randomizer/game/aliens/state.test.js
node randomizer/game/aliens/placement.test.js
node randomizer/game/aliens/randomizer.test.js
```

卡牌源数据转换：

```powershell
python tools/build_card_catalog_js.py
```
