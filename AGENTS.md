# SETI 机制与能力函数化说明

这份文档给后续 agent / 工程师一个当前代码底层机制的入口。仓库当前是一个无构建步骤的浏览器原型，核心逻辑在 `randomizer/game/**`，入口 UI 在 `randomizer/app.js`。每次代码和框架修改后记得检查和补齐本文档。

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

移动 UI 由 `moveHighlightRocketId` 控制当前高亮火箭和移动箭头。确认移动成功后，`app.js` 会清空高亮、隐藏箭头层并清空 `activeRocketId`，回到默认未选中状态。

### 星球状态

星球统计由 `randomizer/game/planet-stats.js` 管理：

- 每个星球记录 `orbits`、`landings`、`orbitMarkers`、`landingMarkers`、`satelliteLandings`。
- `canAddOrbitMarker` / `canAddLandingMarker` 根据行星参考图槽位判断是否可放置。
- `addPlanetOrbitMarker` / `addPlanetLandingMarker` / `addSatelliteLandingMarker` 会生成玩家颜色标记。
- 登陆主星消耗基础 3 能量；若该星球已有任意环绕标记，则消耗降为 2 能量。

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

- `launch`：发射，默认消耗 2 信用点，在地球所在扇区放置火箭。
- `orbit`：环绕，要求当前火箭在非地球星球格，消耗 1 信用点 + 1 能量，移除火箭并放置环绕标记。
- `land`：登陆，要求当前火箭在非地球星球格，消耗 2 或 3 能量，移除火箭并放置主星/卫星登陆标记。
- `scan`：扫描，默认消耗 1 信用点 + 2 能量，生成扫描效果队列。
- `analyze`：分析数据，消耗 1 能量并清空已放置数据。
- `playCard`：打牌，打开手牌选择/打出流程。
- `researchTech`：研究科技，默认消耗 6 宣传，先太阳系公转，再拿取科技板块及奖励。

主行动锁定规则：

- 每个主行动触发的动作和效果全部处理完后，才允许点击“确认”。
- 主行动执行中、效果队列处理中或主行动待确认时，其他主行动按钮全部禁用。
- “确认”只确认当前主行动会话，不会提交或清除快速行动历史。
- “撤销”按最近完成的主/快速步骤回滚；主行动整体仍可通过回滚会话撤销。

快速行动不属于主行动确认门槛：

- 快速交易：通过 `quick-trades.js` 改变资源/手牌/牌区。
- 放置数据：从数据池放入计算机或蓝色科技附加位。
- 移动：点击已有火箭后选择方向，确认时消耗 1 能量或弃移动牌；紫4扫描移动可免费触发同一能力。

快速行动可以在主行动之前、主行动待确认之后，以及主行动效果队列的不同效果之间使用。快速行动会记录可撤销步骤，但不会让“确认”按钮变为可用，也不会改变主行动是否已经完成。

### 扫描效果队列

扫描队列由 `randomizer/game/actions/scan-effects.js` 构建：

- 无紫色科技：地球所在扇区扫描 + 公共牌区扫描。
- 公共牌区扫描默认弃 1 张选 2 选 1 星云；玩家每有 1 个 `additionalPublicScan` 可多选 1 张公共牌（最多 2 个，即最多弃 3 张），弃牌后按张数依次弹出多组 2 选 1 星云（可重复）。
- 紫1：地球扇区扫描升级为“地球及相邻扇区三选一”。
- 紫2：额外增加水星所在扇区扫描。
- 紫3：额外增加手牌扫描。
- 紫4：额外增加“发射/移动”效果；发射消耗 1 能量，移动免费。

每个效果在 UI 中是 `pendingActionEffectFlow.effects[]` 的一个条目。效果可以完成或跳过；全部处理完后，主行动进入“待确认/待撤销”状态。在效果队列之间允许执行快速行动；快速行动撤销后，扫描队列仍停留在原来的主行动流程中。

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

新增能力函数必须只返回 `commands`，不直接写入 `actionHistory`。调用方负责在当前 session/step 中记录这些命令。

移动撤销细节：

- 正常移动通过 `moveProbe(context, { cost: { energy: 1 } })` 结算，撤销命令同时退回能量并恢复火箭快照。
- 弃移动牌支付时，先记录手牌/弃牌堆快照，再用 `moveProbe(context, { cost: {} })` 移动。
- 移动成功后 UI 立即清除高亮和箭头；撤销只恢复火箭位置和资源/牌区，不重新进入移动选中状态。

## 能力函数层

新增能力层位于 `randomizer/game/abilities/`：

- `rocket.js`：
  - `launchProbe(context, options)`
  - `moveProbe(context, options)`
- `scan.js`：
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
  commands: [],
  cost: {},
  payload: {}
}
```

参数约定：

- `context` 复用 `app.js` 的状态上下文，不引入新状态副本。
- `options.cost` 覆盖默认支付成本。
- `options.skipCost === true` 表示免费触发。
- `options.source` 标识来源，例如 `scan`、`card`、`tech`、`debug`。
- `options.historyLabel` 用于生成撤销命令文案。
- 需要玩家选择的流程由 UI 打开 overlay，能力函数只结算已经确定的目标。

行动可以被视为特殊能力编排器：

- 正常发射：`launchProbe(context, { cost: { credits: 2 } })`。
- 紫4扫描发射：`launchProbe(context, { cost: { energy: 1 } })`。
- 正常快速移动：`moveProbe(context, { cost: { energy: 1 }, rocketId, deltaX, deltaY })`。
- 弃移动牌/紫4扫描移动：`moveProbe(context, { cost: {}, rocketId, deltaX, deltaY })`。
- 扇区扫描：`scanSector(context, { nebulaId })` 或 `scanSector(context, { sectorX })`。
- 公共/手牌扫描：UI 先选择牌和目标星云，再调用 `scanPublicCard` / `scanHandCard`，之后由 UI 负责弃牌命令。

## 卡牌模型

- 卡牌源数据保持 CSV，方便手工校对和继续补内容。使用层通过中间构建把 `assets/cards/card_model.csv` 转成 `assets/cards/card_model.json` 和 `randomizer/game/card-catalog.js`，卡牌只声明能力 id、参数和费用覆盖。

## 后续改造方向

- 将普通 `orbit`、`land`、`analyze`、`playCard`、`researchTech` 拆成能力函数，并让卡牌/科技通过 `cost` 参数触发低费或免费版本。
- 将扫描第二格 +2 分、扇区完成、赢家/第二名、推广和扇区奖励做成 `onSignalMarked` / `onSectorCompleted` 事件能力。
- 将 UI 的 overlay 选择与底层 ability 彻底分离，使能力函数可被测试、AI agent 和模拟器复用。

## 验证命令

当前无 package.json，测试以 Node 脚本运行：

```powershell
node randomizer/game/abilities/abilities.test.js
node randomizer/game/actions/scan-effects.test.js
node randomizer/game/history/action-history.test.js
node randomizer/game/history/commands.test.js
node randomizer/game/rockets.move.test.js
node randomizer/game/data/nebula.test.js
node randomizer/game/data/data.test.js
node randomizer/game/tech/tech.test.js
```

卡牌源数据转换：

```powershell
python tools/build_card_catalog_js.py
```

