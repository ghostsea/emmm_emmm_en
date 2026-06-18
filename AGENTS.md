# SETI 机制与能力函数化说明

这份文档给后续 agent / 工程师一个当前代码底层机制的入口。仓库当前是一个无构建步骤的浏览器原型，核心逻辑在 `randomizer/game/**`，入口 UI 在 `randomizer/app.js`。每次代码和框架修改后记得检查和补齐本文档。

## 效果术语表
当需要查看某个具体效果术语的效果时参考：docs\effect-glossary.md

## 核心术语

- 访问：指火箭通过移动、旋转推动等位移进入某个地点的瞬间。火箭本身已经停在该地点不算访问；例如访问小行星必须是火箭进入小行星格时触发，停在小行星上或从小行星移出都不触发“访问小行星”。

## 当前状态模型

### 玩家状态

玩家由 `randomizer/game/players.js` 管理：

- `resources`：`credits`、`energy`、`publicity`、`availableData`、`additionalPublicScan`、`handSize`、`score`。
- `income`：每轮收入记录，字段与部分资源同名（含 `additionalPublicScan`）。
- `hand` / `reservedCards`：手牌与保留牌。`handSize` 始终同步为 `hand.length`。
- `techState`：玩家已拥有科技 `ownedTiles`，以及蓝色科技放置位 `blueBoardSlots`。
- `dataState`：由数据模块懒初始化，包含 `poolTokens`、`placedTokens`、`discardedCount`。
- `orbitCount`：玩家已完成环绕数量。
- `initialSelection`：初始选择确认后写入，记录已选公司牌与已移出游戏的初始牌图片信息；保留牌区只展示公司牌。

资源工具函数：

- `canAfford(player, cost)`：检查资源是否足够。
- `spendResources(player, cost)`：支付资源，失败不支付。
- `gainResources(player, gain)`：获得资源，并处理宣传/数据上限。
- `gainIncome(player, gain)`：增加收入。

### 初始选择状态

初始选择由 `randomizer/app.js` 中的 `setupSelectionState` 管理，并渲染在任务/保留牌区顶部：

- 页面加载后自动执行原 `set-button` 的随机设置流程（玩家顺位、转盘、扇区、星云数据、终局计分、外星人、科技 bonus），不再显示或依赖 `set-button`。
- 按当前启用玩家发放初始选择：`assets/industry` 公司牌每人 2 张选 1 张；`assets/initial_card/split` 初始牌每人 3 张选 2 张。
- 公司候选牌约以 3.45 倍普通保留牌宽度竖向排列，选中的公司牌会显示加粗金色边框；初始牌候选以普通保留牌尺寸的 1.3 倍竖向排列；初始选择区左右分栏为公司:初始牌 = 2:1。
- 3 选 2 初始牌在确认前始终保留显示，已选初始牌显示加粗金色边框；确认按钮要求已选择 1 张公司和 2 张初始牌，确认后这 2 张初始牌移出游戏且不再显示。
- 玩家确认后，选择结果写入该玩家 `initialSelection`；全部启用玩家确认后，`randomizer/game/initial-cards.js` 会按所有玩家选定的公司牌和初始牌统一结算，之后初始选择阶段结束并解锁正常行动。
- 初始选择结束后，任务/保留牌区最左侧固定显示当前玩家已选公司牌，公司牌为普通保留牌尺寸的 2.3 倍，初始牌不再显示。
- 选择公司后，保留牌区右侧分两行显示：第一行放 1 / 2 型任务牌，并按手牌区方式在牌多时部分覆盖；第二行暂时只放 3 型终局计分牌。

初始效果结算：

- 公司牌和初始牌效果由 `randomizer/game/initial-cards.js` 管理，入口为 `resolveInitialSelections(context, { playerIds })`；`app.js` 在所有启用玩家确认后调用它。
- 公司牌会重设该玩家的初始资源和初始收入水平，取代玩家模型默认资源；初始收入水平只写入 `player.income`，不会在游戏开始时自动获得资源或抽牌。
- 公司牌的盲抽、数据和发射效果会先结算；所有玩家的公司牌和初始牌都结算完成后，再按公司牌记录的“收入增加”次数依次进入弃牌收入流程。每次收入增加立即按当前收入水平结算，因此盲抽收入增加拿到的新牌可用于后续收入增加选择。
- 寰宇动力的 2 次初始发射直接在地球扇区放置火箭，不消耗资源，也不受普通发射行动的火箭数量上限限制。
- 扫描类初始牌会替换指定星云的下一个数据 token 并获得数据；若本批初始牌扫描导致扇区完成，所有初始牌结算完后再统一触发扇区结算。
- 额外环绕器只写入 `planetStatsState` 并同步行星参考图标记，不触发环绕奖励；同时计入玩家 `orbitCount`。
- “公共牌区弃牌扫描资源”写入玩家 `resources.additionalPublicScan`；“1数据收入”写入 `income.availableData`；“1盲抽收入”写入 `income.handSize`。
- 当前 1-21 号初始牌模型：1 天狼星A扫描2次；2 3分+1信用点+1盲抽；3 3分+1盲抽+1宣传+火星环绕器；4 3分+1能量+1宣传+金星环绕器；5 4分+2宣传+土星环绕器；6 织女一扫描1次+1额外公共扫描；7 1数据收入+天王星环绕器；8 2分+2信用点+1宣传+水星环绕器；9 1盲抽收入+海王星环绕器；10 外星人2黄色痕迹；11 外星人2粉色痕迹；12 巴纳德扫描2次；13 绘架座β扫描2次；14 3分+1能量+1盲抽；15 4分+1额外公共扫描+1宣传；16 3分+3宣传；17 室女座61扫描2次；18 南河三扫描2次；19 比邻星扫描2次；20 开普勒22扫描2次；21 3分+1数据+1宣传+木星环绕器。

### 终局计分状态

终局计分由 `randomizer/game/final-scoring.js` 管理，并由 `randomizer/app.js` 渲染到左侧终局计分板块：

- 门槛为 25 / 50 / 70 分；玩家分数达到或超过门槛时，会生成一个待标记终局计分机会。
- 玩家每次待标记机会可以选择 1 个终局计分板块放置自己的 `normal_token`。
- 同一玩家在同一终局计分板块上只能标记 1 次。
- 每个板块从左到右是 1 / 2 / 3 号位置：1 号和 2 号位置各只能被占用 1 次；之后的标记都会进入 3 号位置，3 号位置支持多个标记。
- 调试按钮「+20分」会给当前玩家增加 20 分，用于快速触发 25 / 50 / 70 分门槛标记流程。

### 火箭状态

火箭由 `randomizer/game/rockets.js` 管理：

- `rocketState.rockets[]`：太阳系主盘上的玩家飞船，或行星参考图上的标记。
- `activeRocketId`：当前内部选中飞船；移动完成后会清空，玩家若要继续移动必须重新点击火箭。
- `nextRocketId`：全局火箭 id 自增。
- `playerRocketSequences`：每位玩家自己的 R1/R2 序号池。

主盘火箭使用扇区坐标 `{ x: 0..7, y: 1..4 }` 和 `slotIndex` 表示位置。每个扇区有 9 个发射/停靠槽，放置优先级为中心、四角、四边。

玩家默认最多拥有 1 枚主盘可控火箭；拥有橙色 1 号科技后上限提高到 2 枚。环绕、登陆等移除火箭的行动会释放该数量占用。

移动 UI 由 `moveHighlightRocketId` 控制当前高亮火箭和移动箭头。确认移动成功后，`app.js` 会清空高亮、隐藏箭头层并清空 `activeRocketId`，回到默认未选中状态。

太阳系旋转时会同步结算主盘火箭位置：若火箭停在本次旋转版图的实体格上，会跟随该版图旋转到新扇区；若火箭停在某层版图镂空露出的下层格上，且旋转后该层实体格进入火箭所在坐标，则火箭会沿该版图旋转方向被推到下一个扇区。被推动的火箭若进入彗星、非地球星球，或拥有橙色 2 号科技时进入小行星，会获得 1 宣传并产生对应访问事件；随盘旋转后仍停在某类地点不单独算访问。

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
- `replacementOrder` 记录标记顺序，用于扇区结算同标记数时判定后标记者获胜。
- 机制里的“扇区”是 1/8 外圈区域，即单个具名星云扇区（如 `sector-1-a` / 南河三）；一块外围板子包含两个这样的扇区。
- `sectorSettlements` 记录每个具名扇区已结算次数、每次赢家，以及每个玩家赢得的扇区结算记录。
- `sectorExtraMarks[sectorId][]` 记录单个具名扇区数据槽已满后的额外玩家标记；额外标记不占用数据槽、不产生数据，但计入扇区排名和结算平局判定。
- `settleCompletedSectors` 会检查 8 个具名扇区：若某扇区自身数据槽都已填满且全部数据均被玩家 token 替换，则结算该扇区。
- 扇区结算时，标记数最多的玩家获胜；标记数相同则比较该玩家在本扇区的最近标记顺序，后标记者获胜。
- 扇区结算发生在主要行动效果队列全部完成后，结算本身不可撤销；参与本次结算且有标记的玩家各获得 1 宣传。
- 若存在第二名，第二名会在该具名扇区的 1 号数据槽保留 1 枚标记；随后清空并重新填满该扇区其余数据槽。
- 调试按钮「快速扫描扇区」会依次选择玩家颜色、具名扇区和替换数量，批量把该扇区未替换数据改成对应玩家 token；若替换数量超过剩余未替换数据，超出部分会写入 `sectorExtraMarks`。该调试动作不获得数据、不写撤销历史，但会立即触发已完成扇区结算。
- 每个具名星云的 2 号数据槽被玩家扫描标记时，玩家立即获得 2 分；可撤销扫描会同步回滚这 2 分。

玩家数据由 `randomizer/game/data/state.js` 管理：

- 扫描默认获得数据并进入 `player.dataState.poolTokens`，上限为 6；星云扫描能力可传 `gainData: false`，此时仍替换/放置星云 token，但不获得数据。
- 数据池满时，额外获得的数据会增加 `discardedCount`，不进入数据池。
- 放置数据会从数据池最左侧 token 移入计算机第一排，或满足条件时移入蓝色科技附加槽。
- 计算机第一排 2 号位额外获得 1 宣传；4 号位额外触发 1 次收入（弃 1 张手牌并按该牌收入角标增加收入）。
- 分析数据要求计算机第一排第 6 位已有数据，消耗 1 能量并清空已放置数据。

## 行动机制

当前主行动包括：

- `launch`：发射，默认消耗 2 信用点，在地球所在扇区放置火箭；若玩家已达到火箭数量上限则不可执行。
- `orbit`：环绕，要求当前火箭在非地球星球格，消耗 1 信用点 + 1 能量，移除火箭并放置环绕标记。
- `land`：登陆，要求当前火箭在非地球星球格，消耗 1/2/3 能量，移除火箭并放置主星/卫星登陆标记；卫星登陆需要橙色 4 号科技。
- `scan`：扫描，默认消耗 1 信用点 + 2 能量，生成扫描效果队列。
- `analyze`：分析数据，消耗 1 能量并清空已放置数据。
- `playCard`：打牌，打开手牌选择/打出流程。
- `researchTech`：研究科技，生成科技效果链：选择科技片、旋转、即时奖励（如橙1发射、紫1数据）、获取 bonus。

回合与轮次：

- 回合：一名玩家从可以执行主要行动开始，到点击“回合结束”为止。
- 轮次：所有玩家各自执行若干回合，直到所有玩家都 PASS 后结束。所有玩家在同一回合号下各行动一次后，进入下一回合；全部 PASS 后进入下一轮第 1 回合。
- `turnState` 位于 `randomizer/app.js`，记录 `roundNumber`、`turnNumber`、基础顺位 `turnOrderPlayerIds`、本轮起始玩家 `startPlayerId`、启用玩家 `activePlayerIds`、本轮已 PASS 与本回合已行动玩家。
- 页面加载时会自动执行原 `set-button` 设置流程：白色玩家固定为初始首位，其余颜色玩家随机洗牌，并重置为第 1 轮第 1 回合。当前仍按单人测试运行，`activePlayerCount` 默认为 1，默认启用白色玩家。
- 新轮开始时，起始玩家按基础顺位顺延到上一轮第二顺位玩家。

### 行动日志状态

行动日志由 `randomizer/app.js` 内的 `actionLogState` 管理，并显示在右侧日志抽屉的「行动日志」页签：

- 日志按「轮次 / 回合 / 玩家 / 行动」生成一条记录；记录内按完成顺序列出主要行动效果与穿插的快速行动。
- 初始选择确认后也会写入正式日志，标题前缀固定显示为「初始选择」而不是轮次/回合；内容记录玩家选择的公司、移出游戏的初始牌，最后一名玩家还会记录统一初始牌结算结果。
- 当前回合执行中先写入 `actionLogState.draft`，不直接显示到正式日志；玩家点击「回合结束」后，draft 才会固化进 `actionLogState.entries`。
- 主行动效果完成时通过 `endEffectHistoryStep` 或不可撤销效果的补充记录写入 draft；快速行动完成时通过 `completeQuickActionStep` 写入 draft。
- 撤销快速行动会删除 draft 中最近的快速行动记录；撤销主要行动效果会删除最近的主要行动记录；回滚整个主要行动会删除 draft 中所有主要行动记录但保留尚未撤销的快速行动记录。
- 确认后不可撤销的精选/拿牌效果不会进入撤销栈，因此由对应确认分支直接补一条行动日志记录。
- `randomizeAll()` 会清空行动日志，避免新开局混入上一局流程；调试入口 `window.SetiRandomizer.getActionLog()` 返回已确认日志快照。

主行动锁定规则：

- 每个回合只能开始一次主要行动。
- 主行动执行中、效果队列处理中或主行动已完成但未回合结束时，其他主行动按钮全部禁用。
- 每个主行动触发的动作和效果全部处理完后，才允许点击“回合结束”。
- “回合结束”会提交并清空当前主行动与快速行动历史，并按本轮顺位切换到下一名未 PASS 玩家；若当前回合所有未 PASS 玩家都已行动，则进入下一回合。
- `PASS` 当前也是主要行动：点击后进入“待回合结束”状态，可撤销；确认回合结束后，该玩家本轮不再获得行动机会。
- “撤销”按最近完成的主/快速步骤回滚；主行动整体仍可通过回滚会话撤销。
- 行动可以由能力事件链组成；链上每个节点是一个原子能力，能力返回 `undoable` 决定是否进入撤销历史。
- 任意不可撤销效果结算后，当前主要行动不能再撤销；仍可撤销之后发生的可撤销快速行动。
- 科技行动采用效果链：选择科技片可撤销；旋转与科技 bonus 不可撤销；橙1免费发射与紫1获得数据分别按标准「发射」「数据」效果处理且可撤销。

### 橙色科技效果

- 橙色 1：获得时立刻执行一次免费发射（不消耗信用点）；同时玩家火箭上限从 1 提高到 2。
- 橙色 2：火箭通过移动或旋转推动进入小行星时获得 1 宣传；从小行星移出只需要 1 点移动力。没有橙色 2 时，从小行星移出需要 2 点移动力。
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
- 奖励效果链逐个点击执行；全部完成后才允许继续快速行动或点击“回合结束”。
- 自动奖励（分数、能量、宣传、数据、盲抽）直接结算并写入撤销命令。
- 选择型奖励复用现有 UI：精选卡牌、收入弃牌、星云二选一、外星人痕迹选择；选择完成后推进当前奖励节点。
- 盲抽/精选等获取卡牌的奖励一旦完成，当前主行动不可再撤销，只能继续完成效果并最终回合结束。
- 黄色外星人标记限制为 `yellow` 痕迹；任意外星人标记允许 `yellow` / `pink` / `blue`。

当前解释约定：

- “收入”按现有收入效果处理：玩家弃 1 张手牌，按该牌收入角标增加收入。
- “精选”按现有精选处理：从公共牌区拿 1 张牌；是否允许盲抽由触发来源决定，快速交易、3 宣传精选和科技 bonus 精选不允许盲抽。
- 盲抽奖励使用 `assets/symbol/effect/blind_card.webp`。
- 奖励效果和通用资源效果图标统一从 `assets/symbol/effect/` 读取；缺少的资源图标从 `assets/symbol/split/seti-icons/` 复制为语义化文件名后再引用。
- 固定星球扇区扫描使用 `assets/symbol/effect/normal_scan.webp`，并在效果按钮上显示星球名角标；天王星/海王星的织女一/绘架座β二选一扫描使用 `black_scan.webp`；红/蓝/黄星云扫描分别使用 `red_scan.webp`、`blue_scan.webp`、`yellow_scan.webp`。
- 外星人标记使用 `assets/symbol/effect/alien_*.webp` 素材；代码 icon key 与文件名保持一致。

快速行动不属于主要行动次数限制：

- 快速交易：通过 `quick-trades.js` 改变资源/手牌/牌区。
- 3 宣传精选：通过 `quick-trades.js` 消耗 3 宣传并从公共牌区精选 1 张牌；确认拿牌后不可撤销。
- 放置数据：从数据池放入计算机或蓝色科技附加位。
- 移动：点击已有火箭后选择方向，确认时按所需移动力支付；1 点移动力可消耗 1 能量或弃 1 张移动牌。没有橙色 2 时，从小行星移出需要 2 点移动力，可用 2 能量、2 张移动牌、或 1 张移动牌 + 1 能量支付。紫4扫描移动提供 1 点免费移动力。
- 火箭移动进入非地球行星或彗星时，该玩家获得 1 宣传；拥有橙色 2 时，移动进入小行星也获得 1 宣传。访问只看进入目标地点的瞬间，火箭已经停在该地点不触发；旋转推动导致的进入按同一套宣传/访问事件规则结算，单纯随版图旋转不重复视为访问。

快速行动可以在主行动之前、主行动完成之后，以及主行动效果队列的不同效果之间使用。快速行动会记录可撤销步骤，但不会消耗本回合的主要行动次数，也不会改变主行动是否已经完成。确认精选拿牌后，该精选动作不可撤销。

### 扫描效果队列

扫描队列由 `randomizer/game/actions/scan-effects.js` 构建，并由 `randomizer/game/abilities/chain.js` 管理为能力事件链：

- 第一个节点始终是 `payScanCost`，点击后才支付 1 信用点 + 2 能量，可撤销。
- 无紫色科技：支付扫描费用 + 地球所在扇区扫描 + 公共牌区扫描。
- 公共牌区扫描默认弃 1 张选 2 选 1 星云；玩家每有 1 个 `additionalPublicScan` 可多选 1 张公共牌（最多 2 个，即最多弃 3 张），弃牌后按张数依次弹出多组 2 选 1 星云（可重复）。
- 紫1：获得时立刻获得 2 数据；地球扇区扫描升级为“地球及相邻扇区三选一”。
- 紫2：额外增加水星所在扇区扫描。
- 紫3：额外增加手牌扫描。
- 紫4：额外增加“发射/移动”效果；发射消耗 1 能量，移动免费。

每个效果在 UI 中是 `pendingActionEffectFlow.effects[]` 的一个能力链节点。节点可以完成或跳过；可撤销节点完成后会写入 `actionHistory`，撤销会回到该节点重新等待触发。全部处理完后，主行动进入“可回合结束/可快速行动”状态。在效果队列之间允许执行快速行动；快速行动撤销后，扫描队列仍停留在原来的主行动流程中。

## 撤销机制

撤销由 `randomizer/game/history/action-history.js` 实现。当前有两条并行的事务历史：

- `actionHistory`：主行动会话，控制主行动撤销与回合结束提交。
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

回合结束会 `commitSession()` 主行动的 `actionHistory`，并清空快速行动历史。快速行动没有确认按钮；当快速行动步骤都被撤销后，`quickActionHistory` 会自动提交清空。精选确认拿牌后不再写入可撤销历史。

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
  - `researchTechRotate(context, options)`
  - `researchTechBonus(context, options)`
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
- `options.gainData === false` 表示星云扫描只替换/放置 token，不获得数据；未传时默认获得数据。
- `options.techType` / `options.techTypes` 用于限制科技行动可选颜色；默认不限制，支持 `blue`、`orange`、`purple`，也兼容 `color` / `colors` 别名。
- 需要玩家选择的流程由 UI 打开 overlay，能力函数只结算已经确定的目标。

行动可以被视为特殊能力编排器：

- 正常发射：`launchProbe(context, { cost: { credits: 2 } })`。
- 橙色 1 免费发射：`launchProbe(context, { skipCost: true, source: "tech" })`。
- 紫4扫描发射：`launchProbe(context, { cost: { energy: 1 } })`。
- 正常快速移动：`moveProbe(context, { cost: { energy: 1 }, movementPoints: 1, rocketId, deltaX, deltaY })`。
- 弃移动牌/紫4扫描移动：`moveProbe(context, { cost: {}, movementPoints, rocketId, deltaX, deltaY })`。
- 扇区扫描：`scanSector(context, { nebulaId })` 或 `scanSector(context, { sectorX })`。
- 公共/手牌扫描：UI 先选择牌和目标星云，再调用 `scanPublicCard` / `scanHandCard`；能力原子化结算“星云替换 + 可选获得数据 + 弃除来源牌/补公共牌”，并返回同一组撤销命令。
- 科技行动：`researchTechPrepare` 进入选择效果链，默认允许全部颜色科技，也可传 `techType` / `techTypes` 限制颜色；`researchTechSelect` 支付 6 宣传、拿取并放置科技片，且 `undoable: true`；`researchTechRotate` 执行太阳系旋转并结算火箭随盘旋转/镂空推动，`undoable: false`；橙1/紫1分别追加标准「发射」「数据」效果节点；`researchTechBonus` 结算 bonus 与首拿 +2 分，`undoable: false`。

## 卡牌模型

- 人工卡牌描述转可执行 DSL 的规范参考：`docs\card-modeling-dsl-spec.md`。后续新增卡牌模型时，先按该文档约束人工描述和 agent 转换，尤其要明确效果节点 `kind`、费用策略、任务类型和队列结束结算时机。
- 卡牌源数据保持 CSV，方便手工校对和继续补内容。使用层通过中间构建把 `assets/cards/card_model.csv` 转成 `assets/cards/card_model.json` 和 `randomizer/game/card-catalog.js`，卡牌只声明能力 id、参数和费用覆盖。
- 前几张基础牌的可执行效果样例位于 `randomizer/game/cards/effects.js`，这是从人工识图表临时转成程序模型的第一层：
  - 0 型卡：打出后展开为 `play_effect` 效果队列，复用现有扫描、公共牌扫描、盲抽、科技等效果执行器。
  - 1 型卡：打出后进入保留牌区，并在移动等事件完成瞬间检查触发条件；若多个触发槽同时满足，会弹出触发选择，只结算 1 个，也可以取消。已结算的触发槽会在牌面标记序号；全部触发槽结算后，完成任务数 +1 并移除该牌。
  - 2 型卡：打出后进入保留牌区，并注册长期任务；状态条件满足后不自动结算，而是在任务区蓝色高亮。玩家点击该牌确认完成后，完成任务数 +1、移除该牌，并启动任务奖励队列。
  - 3 型卡：进入保留牌区第二行，作为终局计分牌区域展示；当前仅做分行展示。
  - 临时任务：如“本卡效果期间若完成 1 个扇区”，绑定在本次卡牌效果队列上，只在该队列结束后的扇区结算结果中检查。
- 打牌是主要行动，只支付卡牌模型里的信用点费用；卡牌效果队列内复用扫描、科技、移动等能力时，不再重复支付这些主要行动的基础费用。
- 当前已建模样例包括 `b_1.webp` 到 `b_10.webp`，白色玩家起手固定为这 10 张流程样例牌。其中 `b_5.webp` / `b_6.webp` 的“完成扇区”按本次卡牌效果链结束后的扇区结算判断；`b_9.webp` 的“扫描行动”按卡牌效果解释为不重复支付扫描行动基础费用，只展开扫描行动的后续效果。
- 外星人卡牌分析由 `tools/analyze_alien_cards.py` 在每个外星人目录下分别生成 `card_analysis.csv`、`card_model.csv` 和 `card_model.json`；默认排除 `半人马`、`九折`、`方舟`，左上角有两个符号时按第二个标准符号判定弃牌收益。

## 后续改造方向

- `orbit`、`land`、`analyze`、`researchTech` 已拆成能力函数；后续继续处理 `playCard`，并让卡牌/科技通过 `cost` 参数触发低费或免费版本。
- 将扫描第二格 +2 分、推广和扇区奖励做成 `onSignalMarked` / `onSectorCompleted` 事件能力。
- 将 UI 的 overlay 选择与底层 ability 彻底分离，使能力函数可被测试、AI agent 和模拟器复用。

## 验证命令

当前无 package.json，测试以 Node 脚本运行：

```powershell
node randomizer/game/abilities/abilities.test.js
node randomizer/game/abilities/chain.test.js
node randomizer/game/final-scoring.test.js
node randomizer/game/actions/scan-effects.test.js
node randomizer/game/actions/planet-rewards.test.js
node randomizer/game/actions/quick-trades.test.js
node randomizer/game/cards/deck.test.js
node randomizer/game/cards/effects.test.js
node randomizer/game/basic-cards.test.js
node randomizer/game/initial-cards.test.js
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

外星人卡牌源数据分析：

```powershell
python tools/analyze_alien_cards.py
```
