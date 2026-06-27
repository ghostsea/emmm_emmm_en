# SETI 机制细节参考

本文档从根目录 `AGENTS.md` 迁出，保留较完整的机制说明，供需要深入理解实现细节时查阅。根目录 `AGENTS.md` 只维护快速入口、代码地图和详细资料路径。

这份文档给后续 agent / 工程师一个当前代码底层机制的入口。仓库当前是一个无构建步骤的浏览器原型，核心逻辑在 `randomizer/game/**`，app 装配层在 `randomizer/app/**`，入口 UI 与流程编排在 `randomizer/app.js`。每次代码和框架修改后记得检查和补齐本文档。

## App 装配层

浏览器入口仍由 `randomizer/index.html` 按 `<script>` 顺序加载，不需要构建步骤。`randomizer/app/dependencies.js` 负责收集 `window.Seti*` 依赖并在脚本顺序错误时提前报错；`randomizer/app/constants.js` 负责静态配置、图标路径、扫描奖励表和 UI 参数；`randomizer/app/dom.js` 负责固定 DOM 元素注册；`randomizer/app/events.js` 负责事件绑定路由；`randomizer/app/public-api.js` 负责组装 `window.SetiRandomizer`；`randomizer/app/ai-controller.js` 负责 AI 自动机和策略批跑控制器。详细边界和后续拆分原则见 `docs/app-architecture.md`。

## 效果术语表
当需要查看某个具体效果术语的效果时参考：docs\effect-glossary.md

## 核心术语

- 访问：指火箭通过移动、旋转推动等位移进入某个地点的瞬间。火箭本身已经停在该地点不算访问；例如访问小行星必须是火箭进入小行星格时触发，停在小行星上或从小行星移出都不触发“访问小行星”。

## 当前状态模型

### 玩家状态

玩家由 `randomizer/game/players.js` 管理：

- `resources`：`credits`、`energy`、`publicity`、`availableData`、`additionalPublicScan`、`handSize`、`score`。
- `income`：收入等级记录，字段与部分资源同名（含 `additionalPublicScan`）。
- `hand` / `reservedCards`：手牌与保留牌。`handSize` 始终同步为 `hand.length`。
- 起始手牌：每名玩家开局从 140 张普通牌和 42 张 DLC 牌组成的牌库中随机盲抽 4 张，不按牌库前几张固定发牌。
- 公共牌区：进入初始选择时立即补满 3 张公共牌，玩家选择公司和初始牌时即可看到这 3 张牌。
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
- 初始选择结束后，任务/保留牌区最左侧固定显示当前玩家已选公司牌左半幅（可见宽约普通保留牌 1.38 倍，即半幅基准 1.15 倍再放大 20%），初始牌不再显示。
- 除异星实验室和 AI 专用作弊实验室外，公司牌左下角「1x」圆标位置由 `randomizer/game/industry/placement.js` 的 `INDUSTRY_ACTION_MARKER_SLOTS` 定义（百分比坐标）；未放置标记时公司牌外框蓝色高亮，放置后取消高亮。玩家可在该区域点击放置 `normal_token` 标记，每轮（`turnState.roundNumber` 轮号）每玩家仅可触发一次，状态写入 `player.industryRoundMarkRound`；`player.industryRoundMarkTurn` 只记录标记发生的回合号，不参与刷新判定。放置作为快速行动记录，可通过撤销按钮撤回。放置成功后立即启动该公司对应的 1x 主动能力流程。
- 公司 1x 主动/被动能力由 `randomizer/game/industry/` 管理（`catalog.js` 定义、`abilities.js` 构建流程、`passives.js` 钩子、`index.js` 聚合为 `SetiIndustry`）；设计与建模详见 `assets/industry/industry-abilities.md`。
  - 层云核心：放置 1x 标记后，根据公共牌区 3 张牌的弃牌角标生成快速行动效果序列（不弃牌、不移除公共牌）；玩家按效果栏依次结算，撤销按效果步骤回退，撤销第一个效果会同时回退本次公司标记。
  - 图灵系统：借用一项供应区橙色或紫色科技当前回合效果（不获得板块/bonus；包含紫色科技对扫描行动队列的增强），并在公司牌下方只复制显示该科技图标，回合结束移除；被动：获取蓝色科技 +1 宣传。
  - 哨兵探测网络：1x 标记后只武装当前主要行动回合；打牌时（标记可在打牌前或后）在打牌效果队列末尾追加 `industry_sentinel_corner` 节点，点击后结算打出牌左上角弃牌角标（非外星人，可撤销）；若打牌后才标记且当前回合已打牌，会补开哨兵效果队列，回合结束后不再追溯本轮早先打出的牌。被动：发射后扫描地球扇区；若本次扫描使扇区完成，发射行动收尾会追加 `sector_finish_scan` 节点并结算扇区奖励。
  - 寰宇动力：公司 1x 启动 2 个移动效果队列节点；每个节点提供 1 点移动力，已结算节点的火箭不能作为后续寰宇节点目标，任一节点可跳过，也可补移动牌/能量满足地形移动力；被动：火箭上限 +1。
  - 赫利昂联合体：使一项非蓝科技失效 + 1 次收入；确认失效科技时清除左上 3 个被动奖励槽 token。失效后该科技片保留在玩家版图并灰显（`disabledTiles`），不再提供能力，且不能再次从供应区拿取同编号板块；仍可研究同色其他编号板块；D 板块和科技数量终局牌仍把它计入已拥有科技数量。被动：拿取橙/粉紫/蓝科技后，在科技效果队列末尾追加 `industry_helios_passive_reward` 节点，点击后在对应槽放置 token 并领取奖励（橙=1 能量，粉紫=1 公共牌弃牌扫描标记，蓝=1 数据，可撤销）；槽位坐标在 `placement.js` 的 `HELIOS_PASSIVE_MARKER_SLOTS`。
  - 任务中继站：2 宣传精选 + 收入角标奖励（盲抽角标会盲抽 1 张）；被动：本玩家每当打出 1/2 型任务牌 +1 宣传，开局在终局 c 板块 3 号位标记。
  - 芬威克研究中心：1 宣传精选 + 弃牌角标（不弃牌）；被动：研究科技 5 宣传。
  - 深空探测：手牌与公共牌交换；被动：分析不耗能量。
  - 宇宙战略集团：精选 1 张牌；1x 确认精选后清除左上黄/红/蓝 3 个被动奖励槽 token。被动：打牌后按扫描角标在打牌效果流程的所有动态后续效果结束后追加 `industry_strategy_passive_reward` 节点，点击节点后放置 token 并领奖（黄=1 信用点，红=1 宣传，蓝=1 数据，可跳过、可撤销）；跳过不放置 token 且不占用槽位，下次打牌仍可再次触发。已放置 token 的槽位不能再次触发，回合/轮次重置不会清槽；只有宇宙战略集团 1x 快速行动确认精选后清槽，才让对应奖励重新可触发。黑色扫描角标沿用旧任意槽逻辑：只有 1 个空槽时自动触发该槽，多个空槽可选时弹出黄/红/蓝奖励槽选项，由玩家选择触发哪个槽。
- 未来跨度研究所：公司牌上额外显示 `wlkd_token` 专属标记。点击后作为快速行动选择一张费用为信用点的手牌（半人马等能量费用牌不可选），移到公司牌下方并设定目标分（当前分 + 15/25/35/45，对应费用 1/2/3/4）；达成目标分后目标牌高亮为可打出但不显示专属标记，可用标准“打牌”主行动免费打出，所有效果完成后专属标记回到公司且当轮可再次作为快速行动使用。底部普通 1x 只能在已有未达成目标牌时使用：精选 1 张公共牌并把目标分提高 3，确认补牌后不可撤销。
- 异星实验室：公司牌上显示蓝/黄/粉三块专属板块。正面时分别把标准发射改为 1 信用点、标准扫描改为 2 能量、标准研究科技改为 4 宣传；正面板块高亮且可点击，点击等同触发对应主要行动。执行对应标准主行动后该板块翻背。获得同色外星痕迹时对应板块翻回正面。该公司没有普通 1x 圆标。
- 作弊实验室：AI 专用公司，默认给电脑选择。初始收益与异星实验室相同，复用异星实验室牌图；蓝/黄/粉三块板块永远按正面处理，因此标准发射始终只耗 1 信用点，标准扫描始终只耗 2 能量，标准研究科技始终只耗 4 宣传，执行后不会翻背。该公司没有普通 1x 圆标。
- 玩家运行时字段：`industryBorrowedTechTileId` / `industryBorrowedTechRound` / `industryBorrowedTechTurn`（图灵借用；带行动上下文时按 Round/Turn 精确判定，无显式上下文的同回合长链路按未清空借用态生效）、`industrySentinelArmedRound` / `industrySentinelArmedTurn`（哨兵当前回合武装）、`industryPlayedCardThisRound` / `industryLastPlayedCardThisRound` / `industryPlayedCardRound` / `industryPlayedCardTurn`（当前回合打牌快照，字段名沿用 ThisRound）、`industryAlienLabPanels`（异星实验室/作弊实验室三色板块）、`industryFutureSpan`（未来跨度扣下的牌、目标分与打出状态）。寰宇动力主动效果改走快速行动效果队列，不再依赖 `industryHuanyuFreeMove*` 运行时字段。回合结束时会清空当前玩家的图灵借用和哨兵武装/打牌快照；新轮开始时（所有玩家都 PASS 后）`resetAllRoundIndustryRuntimeState` 清空借用/武装等轮内状态，不重置 `industryRoundMarkRound` / `industryRoundMarkTurn`（靠轮号比较判定可否再标记），也不清空未来跨度目标牌或异星实验室/作弊实验室板块。
- 公司 1x 标记与能力撤销：除涉及精选并拿走/刷新公共牌的能力（任务中继站、芬威克、未来跨度普通 1x、宇宙战略）外，普通 1x 会写入 `quickActionHistory`；撤销会恢复 1x 前玩家快照、清空轮内公司运行态并取消进行中的公司能力流，避免只撤销奖励但标记仍占用。层云核心只结算弃牌角标不弃牌、不移除公共牌，并按效果步骤撤销；第一个效果步骤同时回退放置公司标记的快速行动。进行中的公司选择/借用/移动流程取消时会回滚当前公司 quick step；但任务中继站、芬威克、未来跨度普通 1x、宇宙战略确认拿牌后会提交不可撤销快速行动屏障，之前的快速行动也不再可撤销。芬威克若精选到移动角标，取消后续免费移动只放弃移动并提交该不可撤销快速行动。未来跨度专属标记是独立快速行动，仍单独记录。
- 交互聚焦：`app.js` 的 `syncInteractionFocusChrome()` 根据进行中的流程在 `#app-wrap` 上设置 `data-interaction-focus`（`public-cards` / `hand-cards` / `tech-panel` / `board-rockets`）；`style.css` 会暗化非目标区域。`hand-cards` 聚焦时不能暗化或禁用 `.player-command` 父容器，需只暗化手牌区的兄弟控件，保证收入弃牌、打牌选牌、移动弃牌支付、手牌扫描等流程中手牌区保持高亮可点。公司牌 1x 可放置时仅用牌面蓝色高亮（`is-action-marker-pending`），不自动进入全屏聚焦以免遮挡行动按钮。
- 选择公司后，保留牌区右侧分两行显示：第一行放 1 / 2 型任务牌，并按手牌区方式在牌多时部分覆盖；第二行放 3 型终局计分牌以及声明 `displayRow: "bottom"` 的特殊保留牌（当前为 b139 冥王星）。

数据获得满池提示：

- 玩家可用数据池已有 6 个数据时，效果队列中的数据奖励会先弹出自动数据放置提示；玩家可执行放置以先空出 1 个可用数据位置，再获得本次数据，也可跳过本次数据获得。跳过不会放置数据，也不会把该数据记为溢出弃置。若没有可用放置位，则本次数据奖励提示为未获得并跳过。

初始效果结算：

- 公司牌和初始牌效果由 `randomizer/game/initial-cards.js` 管理，入口为 `resolveInitialSelections(context, { playerIds })`；`app.js` 在所有启用玩家确认后调用它。
- 公司牌会重设该玩家的初始资源和初始收入水平，取代玩家模型默认资源；初始收入水平只写入 `player.income`，不会在游戏开始时自动获得资源或抽牌。
- 公司牌重设资源后、初始牌结算前，会按初始顺位给予默认分：1 / 2 / 3 / 4 号位分别获得 1 / 2 / 3 / 4 分；之后初始牌或其他初始效果获得的分数继续累加。
- 公司牌的盲抽、数据和发射效果会先结算；所有玩家的公司牌和初始牌都结算完成后，再按公司牌记录的“收入增加”次数在效果栏依次排队展示，玩家每次点击 1 个收入效果后弃 1 张手牌并按该牌收入角标结算。每次收入增加立即按当前收入水平结算，因此盲抽收入增加拿到的新牌可用于后续收入增加选择。**初始收入队列未全部完成前**，主要行动、公司 1x、快速交易、放置数据、移动、手牌角标快速行动等均锁定。初始收入是 setup 流程，不占用或遗留主行动 `actionHistory` 会话。
- 寰宇动力的 2 次初始发射直接在地球扇区放置火箭，不消耗资源，也不受普通发射行动的火箭数量上限限制。
- 扫描类初始牌会替换指定星云的下一个数据 token 并获得数据；若指定星云已无可替换数据，则追加扇区扫描计数标记且不获得数据。若本批初始牌扫描导致扇区完成，所有初始牌结算完后再统一触发扇区结算。
- 额外环绕器只写入 `planetStatsState` 并同步行星参考图标记，不触发环绕奖励；同时计入玩家 `orbitCount`。
- “公共牌区弃牌扫描资源”写入玩家 `resources.additionalPublicScan`；“1数据收入”写入 `income.availableData`；“1盲抽收入”写入 `income.handSize`。
- 当前 1-21 号初始牌模型：1 天狼星A扫描2次；2 3分+1信用点+1盲抽；3 3分+1盲抽+1宣传+火星环绕器；4 3分+1能量+1宣传+金星环绕器；5 4分+2宣传+土星环绕器；6 织女一扫描1次+1额外公共扫描；7 1数据收入+天王星环绕器；8 2分+2信用点+1宣传+水星环绕器；9 1盲抽收入+海王星环绕器；10 外星人2黄色痕迹；11 外星人2粉色痕迹；12 巴纳德扫描2次；13 绘架座β扫描2次；14 3分+1能量+1盲抽；15 4分+1额外公共扫描+1宣传；16 3分+3宣传；17 室女座61扫描2次；18 南河三扫描2次；19 比邻星扫描2次；20 开普勒22扫描2次；21 3分+1数据+1宣传+木星环绕器。

### 终局计分状态

终局计分由 `randomizer/game/final-scoring.js` 管理标记流程，由 `randomizer/game/end-game-scoring.js` 管理实时计分，并由 `randomizer/app.js` 渲染到左侧终局计分板块与玩家状态栏：

- 门槛为 25 / 50 / 70 分；玩家分数达到或超过门槛时，会生成一个待标记终局计分机会。
- 玩家每次待标记机会可以选择 1 个终局计分板块放置自己的 `normal_token`。
- 同一玩家在同一终局计分板块上只能标记 1 次。
- 每个板块从左到右是 1 / 2 / 3 号位置：1 号和 2 号位置各只能被占用 1 次；之后的标记都会进入 3 号位置，3 号位置支持多个标记。
- 开局时 a/b/c/d 各自独立随机变体 1 或 2，结果写入 `finalScoringState.tileVariants` 并同步到 `assets/final/final_{id}{variant}.png`。
- 板块计分规则见 `assets/final/final_detail.md`：a=收入、b=痕迹/环绕登陆扇区、c=任务、d=科技；变体 1/2 对应表中 a1/a2…d1/d2 公式，标记位决定倍率（3 号及之后使用第三档倍率）。
- 仅统计当前玩家**已标记**的板块；实时板块分 = 各已标记板块的 `基础值 × 位次倍率`。
- 3 型终局计分卡打出后进入保留区第二行；实时卡牌终局分只统计当前玩家保留区中的 3 型卡。当前基础牌规则：`b_14` 每完成 1 个红色扇区 3 分；`b_63` 每完成 1 个黄色扇区 3 分；`b_100` 每完成 1 个蓝色扇区 3 分；`b_128` 每完成 1 个黑色扇区 3 分；`b_30` 每个蓝色外星人痕迹 2 分；`b_86` 每个粉色外星人痕迹 2 分；`b_113` 每个黄色外星人痕迹 2 分；`b_33` 每个蓝色科技 2 分；`b_45` 每个有信号的扇区 1 分；`b_34` 木星每个环绕/登陆（含卫星）3 分；`b_74` 火星每个环绕/登陆（含卫星）4 分；`b_82` 若有探测器在小行星得 13 分；`b_115` 按当前玩家未标记终局板块的最右档分数合计。DLC 终局牌规则：`dlc_8` 每个剩余可用数据 3 分；`dlc_10` 每个剩余宣传 1 分；`dlc_31` 每个有至少 2 个己方主星登陆标记的行星 6 分；`dlc_39` 每个己方环绕、主星登陆、卫星登陆标记 2 分。
- 玩家状态栏在正常分数后显示终局总分（图标 `assets/symbol/effect/final_score.webp`）= 当前 `resources.score` + 板块分 + 终局计分牌 + 外星人终局项（如九折、符文族）；正常分数行不变。
- 开局即显示独立悬浮的「统计」按钮，可随时打开当前实时总分统计；游戏结束后仍会默认弹出统计悬浮窗。窗口第一列为得分项目，后续列按白、棕、蓝、绿展示本局参与玩家，最高总分单元格高亮。
- 终局弹窗中 `裸分` 直接取当前 `resources.score`；同时玩家状态维护 `scoreSources` 账本，用于拆出普通游戏内即时得分来源：科技 bonus（含 3 分 bonus 与首科技 2 分）、蓝色科技放置数据得分、1/2 型任务牌得分、环绕、登陆、粉/黄/蓝外星人痕迹得分、外星人卡牌左上角快速行动得分。旧存档或改动前已发生的即时得分若没有账本记录，只会体现在 `裸分` 中。
- 统一计分入口：`SetiEndGameScoring.computePlayerFinalScore(context)`，`context` 需包含 `currentPlayer`、`finalScoringState`、`nebulaDataState`、`alienGameState`、`planetStatsState`、`cardEffects`、`getCardTypeCode`。返回值包含 `baseScore`、`tileScore`、`cardScore`、`jiuzheCardScore`、`jiuzhePenaltyScore`、`runezuSymbolScore`、`totalScore`，并用 `tileScoresById.{a,b,c,d}` 拆出 a/b/c/d 板块分；九折卡牌分数、九折损失分数和符文族 symbol 分数在对应外星人存在时作为条件行展示。
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

环绕/登陆判定不再硬性依赖 `activeRocketId`。若当前玩家没有有效选中火箭，`shared.getRocketPlanet` 会自动查找当前玩家停在非地球星球格上的第一枚火箭；若当前玩家有多枚火箭位于不同的可行动行星，主行动和卡牌来源的环绕/登陆会先弹出目标选择，并把所选 `rocketId` 传给执行能力。

### 星球状态

星球统计由 `randomizer/game/planet-stats.js` 管理：

- 每个星球记录 `orbits`、`landings`、`orbitMarkers`、`landingMarkers`、`satelliteLandings`。
- `canAddOrbitMarker` / `canAddLandingMarker` 根据行星参考图槽位判断是否可放置。
- `addPlanetOrbitMarker` / `addPlanetLandingMarker` / `addSatelliteLandingMarker` 会生成玩家颜色标记。
- `removePlanetOrbitMarker` / `removePlanetLandingMarker` / `removeSatelliteLandingMarker` 会移除指定标记；主星环绕/登陆标记移除后会重排序号，空出的槽位可再次环绕或登陆。
- 登陆主星消耗基础 3 能量；若该星球已有任意环绕标记，则消耗降为 2 能量；拥有橙色 3 号科技时再减少 1 能量。
- 默认不能登陆卫星；拥有橙色 4 号科技后，登陆行动才会把可用卫星加入目标选择。
- `b_139.webp` 打出后作为特殊保留牌进入下排，不计为 3 型终局卡。当前玩家有 y=4 探测器时，可通过对应主行动执行冥王星环绕或登陆；若当前火箭同时处于可环绕/登陆的普通星球（例如天王星或海王星）且冥王星也可用，主行动会弹出目标选择。b139 自身提供的冥王星环绕和登陆各限一次，登陆若已先环绕按常规降低 1 能量，橙3仍生效；行动移除探测器并产生 `planetId: "pluto"` 的 `orbit` / `land` 事件，不写入普通星球参考图。
- 冥王星标记作为 b139 保留牌上的虚拟行星标记存在：移除环绕/登陆标记类卡牌可以移除 b139 上的冥王星环绕/登陆；卡牌来源的环绕/登陆可把冥王星作为目标，其中 `allowDuplicateLanding` 的同地点登陆可突破 b139 自身“冥王星只登陆一次”的限制。冥王星环绕/登陆计入玩家环绕、登陆、同一星球环绕/登陆等数量统计。

### 外星人痕迹状态

外星人由 `randomizer/game/aliens/` 管理，当前有两个未揭示槽位（外星人 1 / 外星人 2）：

- 牌库共 8 种外星人（见 `catalog.js`：`九折`、`半人马`、`奥陌陌`、`异常点`、`方舟`、`符文族`、`虫`、`阿米巴`）。
- 开局或点击随机化时，`randomizeAlienAssignments` 只重置两个未揭示槽位，不预先写入物种。正式主动发现发生在触发玩家回合结束确认时，`revealRandomAlien` 从 8 种外星人里随机翻开一个尚未翻开的物种，并写入当前槽位的 `assignedAlienId` / `alienId`；两个槽位的外星人不能相同。
- 每种外星人需要三种首标记：`yellow`（黄色痕迹）、`pink`（粉色痕迹）、`blue`（蓝色痕迹）。
- 放置首标记立即获得 state 图奖励：外星人 1 为 5 分 + 1 宣传，外星人 2 为 3 分 + 1 宣传；同颜色后续额外标记不重复获得首标记奖励。
- `traces[traceType].firstPlaced` / `ownerPlayerColor` 记录该颜色第一个标记是否已放置及归属玩家。
- 同颜色后续标记累加 `extraCount`，并通过 `extraMarkers[]` 记录每枚额外 token 的归属玩家；旧状态缺少 `extraMarkers` 时才按首痕迹拥有者回退。
- 三种首标记都放置后，`isAlienReadyToReveal` 为真；正式流程只记录待揭示状态，直到该玩家点击回合结束确认才调用 `revealRandomAlien` 随机翻开对应外星人，并把 `.alien-back` 图片替换为 `assets/aliens/<id>/face.png`（宽度保持 100%，高度自适应）。异常点、半人马、虫、阿米巴、奥陌陌、符文族揭示时会按该槽位 state 首标记归属数量，自动给对应玩家发同数量外星人牌到手牌，该发牌属于不可撤销的新信息边界；九折/方舟使用各自专属揭示奖励。调试按钮仍可直接指定物种揭示。

UI 布局：

- 两个外星人状态图（`state1.png` / `state2.png`）上各有 3 个 `normal_token.png` 标记位，分别对应粉/黄/蓝痕迹框。
- 默认坐标已固化在 `randomizer/game/aliens/placement.js` 的 `ALIEN_TRACE_MARKER_SLOTS`。
- 首标记仅在 `firstPlaced` 后显示玩家 token（`ALIEN_TRACE_TOKEN_DISPLAY_SCALE` 当前为 7），无默认参考图标。
- 非首标记数量不限；网格锚点为 `ALIEN_EXTRA_TRACE_MARKER_SLOTS`（第二行第二列中心），从锚点与 token 尺寸反推第一格中心，再按每行 3 个向右、向下排布；`ALIEN_EXTRA_TRACE_TOKEN_DISPLAY_SCALE` 当前为 5。槽位揭示后仍可在已有首痕迹的颜色上继续点击 state 额外痕迹位追加当前奖励玩家的 token。
- 获取外星人标记的正式流程会进入面板点击模式：未揭示槽位可点击 state 首标记/额外痕迹位；已揭示槽位可点击正面牌图痕迹位，也可点击 state 上已有首痕迹颜色的额外痕迹位。方舟获得痕迹且同色保留牌仍可解锁时，会在领取痕迹入口先选择“放到外星人面板”或“解锁方舟牌”；选择面板后再点击 state 或正面牌图上的目标位时只执行放置，不再二次弹出用途选择。调试「获取外星人标记」使用同类直接点击模式；再次点击调试按钮退出。各外星人专属调试按钮揭示后会自动进入该模式。
- 符文族机制由 `randomizer/game/aliens/runezu.js` 管理：揭示时给星球、具名星云扇区、带 2 分首取 bonus 的科技板块和正面白色圆框放置 symbol；玩家通过对应访问/结算/科技首取获得 symbol。揭示后的三色痕迹各有 1-4 号位，1 号位可叠放并拿取/补充白色圆框 symbol，后续 token 向上紧密叠放且已有 token 后热区纵向扩大，2/3 号位给分和符文族牌，4 号位给 7 分和 symbol。玩家回合空闲时，持有可放置 symbol 会高亮正面可用黑圈；点击黑圈并选择 1 个持有 symbol 后，作为快速行动放置并领取对应奖励。未放入黑圈的持有 symbol 按最大不同集合参与终局计分。
- 调试「符文族调试」会直接揭示符文族并按揭示机制放置 6 个白色圆框 symbol，不自动放置痕迹 token，也不显示黑圈占位；会自动进入「获取外星人标记」模式，点击符文族正面痕迹位会按正式规则放置当前玩家 token 并触发对应奖励。
- 奥陌陌机制由 `randomizer/game/aliens/aomomo.js` 管理：揭示后替换第 3 轮盘贴图，启用第 3 轮盘基础坐标 `x=5, y=3` 的奥陌陌星球和 `aomomo` 星云；玩家资源新增 `aomomoFossils`。奥陌陌三色痕迹各有 1-5 号位，1 号位可无限堆叠，1/5 号位消耗化石得分，2/4 号位获得化石，3/4 号位获得奥陌陌牌。环绕和登陆标记写入奥陌陌面板的 1 个环绕槽和 3 个登陆槽。
- 调试「奥陌陌调试」会直接揭示奥陌陌、替换 wheel，并在奥陌陌星球弧形空档的 3 个数据槽放入普通数据 token；外星人面板不预放痕迹、环绕或登陆 token，也不提供这些面板 token 的拖动校准。奥陌陌星球数据 token 不可拖动，使用相对第 3 轮盘的 `radialFraction` / `angularFraction` 坐标；普通数据 token 和扫描替换后的玩家 token 都会随 wheel3 旋转移动，控制台日志会输出当前数据槽盘面坐标与相对坐标。

物种专属机制文档：

- 通用设计总结与新增外星人检查清单：`docs/alien-design.md`。
- 九折：`assets/aliens/九折/implementation.md`。
- 异常点：`assets/aliens/异常点/implementation.md`。
- 半人马：`assets/aliens/半人马/implementation.md`。
- 方舟：`assets/aliens/方舟/implementation.md`。
- 虫：`assets/aliens/虫/implementation.md`。
- 阿米巴：`assets/aliens/阿米巴/implementation.md`。
- 奥陌陌：`assets/aliens/奥陌陌/implementation.md`。
- 符文族：`assets/aliens/符文族/implementation.md`。

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
- 奥陌陌揭示后额外启用 `aomomo` 星云，容量为 3，绘制在奥陌陌星球板块弧形空档中的短椭圆数据槽；这些槽位以奥陌陌星球在第 3 轮盘上的基础坐标计算，会随 wheel3 旋转保持相对位置。扫描奥陌陌当前 `x` 对应的外圈星云时会额外提供扫描奥陌陌选项，直接扫描奥陌陌星球时扫描 `aomomo`。
- `sectorSettlements` 记录每个具名扇区已结算次数、每次赢家，以及每个玩家赢得的扇区结算记录；普通扇区赢家记录包含 `slotKind`、`markerIndex`、`playerTokenSrc`，用于把玩家 token 渲染到扇区胜利区域。
- `sectorExtraMarks[sectorId][]` 记录单个具名扇区数据槽已满后的额外玩家标记；额外标记不占用数据槽、不产生数据，但计入扇区排名和结算平局判定。
- `settleCompletedSectors` 会检查 8 个具名扇区：若某扇区自身数据槽都已填满且全部数据均被玩家 token 替换，则结算该扇区。
- 扇区结算时，标记数最多的玩家获胜；标记数相同则比较该玩家在本扇区的最近标记顺序，后标记者获胜。
- 奥陌陌 `aomomo` 扇区完成时不统计赢家、不写入玩家赢得扇区记录、不保留第二名标记；所有参与扫描的玩家各获得 1 化石奖励节点，然后重新填满 3 个奥陌陌数据槽。
- 完整扫描行动（标准扫描主行动，或卡牌效果展开出的 `SCAN_ACTION`）不固定追加 `scan_action_finalize`。扫描 flow 完成后，会先检查本次扫描标记过的星云是否满足结算条件；同时作为防护，任意扫描相关效果队列全部完成时都会再检查所有具名扇区，若已有扇区数据槽全部被玩家 token 替换，则追加对应 `sector_finish_scan` 节点与奖励节点；已无可替换数据的后续扫描会写入 `sectorExtraMarks`，不获得数据但计入本次扇区排名；本次公共扫描留下的空公共牌位不进入效果队列，会在扫描 flow 的扇区结算与奖励全部完成后自动补牌。
- 普通扇区完成时，`sector_finish_scan` 节点调用 `settleSector()`，写入赢家 token 记录，保留第二名标记，并重新填满该扇区数据槽；普通扇区参与本次结算且有标记的玩家各获得 1 宣传，作为资源奖励效果节点进入队列。
- 奥陌陌 `aomomo` 扇区完成时不产生赢家、不写入赢家 token、不保留第二名标记；参与玩家各获得 1 化石，作为资源奖励效果节点进入队列。
- 织女一、绘架座β、巴纳德、开普勒22、南河三第一次完成时把赢家 token 放在圆形区域，之后放在条形区域；室女座61、天狼星A、比邻星每次都放在条形区域。胜利 token 优先使用 `nebula-placement.js` 中的校准坐标；未校准位置从该星云第 3 个数据槽换算到 sector 贴图坐标，并向上偏移约 2 个数据 token 大小，后续 token 沿 x 方向紧凑排列，确保先落在所属外圈 `y=5` 扇区半区内。胜利 token 显示尺寸比初始默认值缩小 10%。调试按钮「赢得扇区调试」只显示可拖动玩家 token 占位，并把覆盖坐标输出到状态日志和 `console.info("[扇区胜利坐标]", ...)`，不写入真实胜利状态。
- 普通扇区赢家奖励如下，全部以效果节点结算，粉色痕迹节点会使用赢家 token 颜色：

| 扇区 | 首次圆形区域 | 后续条形区域 |
| --- | --- | --- |
| 织女一 `sector-1-b` | 2 分 + 粉色外星人痕迹 | 5 分 |
| 绘架座β `sector-4-b` | 3 分 + 粉色外星人痕迹 | 粉色外星人痕迹 |
| 巴纳德 `sector-2-b` | 粉色外星人痕迹 | 3 分 |
| 开普勒22 `sector-3-a` | 粉色外星人痕迹 | 3 分 |
| 南河三 `sector-1-a` | 粉色外星人痕迹 | 3 分 |
| 室女座61 `sector-4-a` | 粉色外星人痕迹 | 粉色外星人痕迹 |
| 天狼星A `sector-2-a` | 粉色外星人痕迹 | 粉色外星人痕迹 |
| 比邻星 `sector-3-b` | 粉色外星人痕迹 | 粉色外星人痕迹 |
- 若存在第二名，第二名会在该具名扇区的 1 号数据槽保留 1 枚标记；随后清空并重新填满该扇区其余数据槽。
- 调试按钮「快速扫描扇区」会依次选择玩家颜色、具名扇区和替换数量，批量把该扇区未替换数据改成对应玩家 token；若替换数量超过剩余未替换数据，超出部分会写入 `sectorExtraMarks`。该调试动作不获得数据、不写撤销历史，但会立即触发已完成扇区结算。
- 每个具名星云的 2 号数据槽被玩家扫描标记时，玩家立即获得 2 分；奥陌陌 `aomomo` 星云的 1 号槽得 1 分、3 号槽得 2 分；可撤销扫描会同步回滚这些分数。

玩家数据由 `randomizer/game/data/state.js` 管理：

- 扫描默认获得数据并进入 `player.dataState.poolTokens`，上限为 6；星云扫描能力可传 `gainData: false`，此时仍替换/放置星云 token，但不获得数据。
- 数据池满时，额外获得的数据会增加 `discardedCount`，不进入数据池。
- 放置数据会从数据池最左侧 token 移入计算机第一排，或满足条件时移入蓝色科技附加槽。
- 计算机第一排 2 号位额外获得 1 宣传；4 号位额外触发 1 次收入（弃 1 张手牌并按该牌收入角标增加收入）。
- 分析数据要求计算机第一排第 6 位已有数据，消耗 1 能量并清空已放置数据，随后获得 1 个蓝色外星人痕迹。

## 行动机制

当前主行动包括：

- `launch`：发射，默认消耗 2 信用点，在地球所在扇区放置火箭；若玩家已达到火箭数量上限则不可执行。异星实验室蓝色板块正面时，标准发射改为 1 信用点并在成功后翻背；作弊实验室始终为 1 信用点且不翻背。
- `orbit`：环绕，要求当前火箭在非地球星球格，消耗 1 信用点 + 1 能量，移除火箭并放置环绕标记。
- `land`：登陆，要求当前火箭在非地球星球格，消耗 1/2/3 能量，移除火箭并放置主星/卫星登陆标记；卫星登陆需要橙色 4 号科技。
- `scan`：扫描，默认消耗 1 信用点 + 2 能量，生成扫描效果队列。异星实验室黄色板块正面时，标准扫描改为 2 能量并在支付成功后翻背；作弊实验室始终为 2 能量且不翻背。
- `analyze`：分析数据，消耗 1 能量并清空已放置数据，随后获得 1 个蓝色外星人痕迹。
- `playCard`：打牌，打开手牌选择/打出流程。
- `researchTech`：研究科技，生成科技效果链：选择科技片、旋转、即时奖励（如橙1发射、紫1数据）、获取 bonus。异星实验室粉色板块正面时，标准研究费用改为 4 宣传并在选择科技片成功后翻背；作弊实验室始终为 4 宣传且不翻背。

轮与回合：

- 轮：所有玩家各自执行若干回合，直到所有玩家都 PASS 后结束；全部 PASS 后进入下一轮第 1 回合。
- 回合：一轮内的一次行动圈；每名未 PASS 玩家按本轮顺位最多行动一次，除非已经 PASS。所有未 PASS 玩家在当前行动圈都行动后，显示回合号才递增。
- `turnState` 位于 `randomizer/app.js`，记录 `roundNumber`（轮号）、`turnNumber`（内部行动序号，用 `getDisplayedTurnNumber()` 折算为界面/日志回合号）、基础顺位 `turnOrderPlayerIds`、本轮起始玩家 `startPlayerId`、启用玩家 `activePlayerIds`、本轮已 PASS 玩家与当前行动圈已行动玩家。
- 页面加载时会自动执行原 `set-button` 设置流程：白色玩家固定为初始首位，其余颜色玩家随机洗牌，并重置为第 1 轮第 1 回合。默认人机入口启用 4 名活跃玩家，其中白色为人类玩家，其余 3 个活跃席位为电脑玩家。
- 新轮开始时，起始玩家按基础顺位顺延到上一轮第二顺位玩家。

### 行动日志状态

行动日志由 `randomizer/app.js` 内的 `actionLogState` 管理，并显示在右侧日志抽屉的「行动日志」页签：

- 日志按「轮 / 回合 / 玩家 / 行动」生成一条记录；记录内按完成顺序列出主要行动效果与穿插的快速行动。
- 初始选择确认后也会写入正式日志，标题前缀固定显示为「初始选择」而不是轮/回合；内容记录玩家选择的公司、移出游戏的初始牌，最后一名玩家还会记录统一初始牌结算结果。
- 当前回合执行中先写入 `actionLogState.draft`，不直接显示到正式日志；玩家点击「回合结束」后，draft 才会固化进 `actionLogState.entries`。
- 主行动效果完成时通过 `endEffectHistoryStep` 或不可撤销效果的补充记录写入 draft；快速行动完成时通过 `completeQuickActionStep` 写入 draft。step 会比较执行前后的当前玩家资源、收入、手牌数、分数和完成任务数，并把尚未在效果文本中表达过的变化追加到日志明细中。
- 日志 step 会记录 `stepId`、`source`、`undoable`、`irreversibleReason`；打牌 step 额外记录 `playedCard` 快照用于在日志中高亮牌名并 hover/focus 预览牌面。撤销时按 `stepId` 精确删除 draft 中对应记录，避免主/快速行动交错时删错日志。
- 撤销快速行动会删除 draft 中最近的快速行动记录；撤销主要行动效果会删除最近的主要行动记录；回滚整个主要行动会删除 draft 中所有主要行动记录但保留尚未撤销的快速行动记录。若最近步骤是不可撤销屏障，只提示原因，不会越过屏障撤销更早步骤。
- 确认后不可撤销的精选/拿牌效果会写入不可撤销屏障，并在日志中显示原因；公司 1x 中任务中继站、芬威克、未来跨度、宇宙战略等公共牌精选补牌能力也按 quick 日志记录 `不可撤销：公共牌补牌翻出新牌`。
- 每条已确认的稳定行动日志 entry 会附带 `recoverySnapshot`，保存该日志确认后的完整游戏状态切片（含隐藏牌序、外星人状态、火箭、科技、星云、玩家、任务状态等，不递归保存日志本身）。最后一名玩家确认初始选择后若进入“初始收入增加”效果流，该条日志会暂时不暴露恢复快照，直到初始收入全部完成后刷新为稳定恢复点。`window.SetiRandomizer.getActionLogRecoveryPackage()` 可导出含恢复快照的日志包；`window.SetiRandomizer.recoverFromActionLog(logOrPackage, { entryId/index })` 会取对应日志快照恢复局面，并清空所有进行中的 overlay/选择流程。恢复点定位为“某条已确认日志之后”的稳定局面；调试入口仍不保证完整日志语义。
- 开局即显示悬浮「下载日志」按钮，统计弹窗内也保留同一入口；UI 调用 `window.SetiRandomizer.downloadActionLogMarkdown({ allowIncomplete: true })`，可随时以 Markdown 文件导出当前行动复盘。`window.SetiRandomizer.getActionLogMarkdown()` 返回同一份 Markdown 文本，方便 Playwright/控制台/外部 agent 读取；`downloadActionLogMarkdown()` 作为公开 API 默认仍只允许终局后下载，传 `{ allowIncomplete: true }` 可导出当前局面。Markdown 只包含游戏元信息、终局分数、玩家路线摘要和完整行动流水，不包含 `recoverySnapshot`、隐藏牌序或完整恢复状态；需要恢复局面时仍使用 `getActionLogRecoveryPackage()`。
- `randomizeAll()` 会清空行动日志，避免新开局混入上一局流程；调试入口 `window.SetiRandomizer.getActionLog()` 返回已确认日志快照。

主行动锁定规则：

- 每个回合只能开始一次主要行动。
- 主行动执行中、效果队列处理中或主行动已完成但未回合结束时，其他主行动按钮全部禁用。
- 每个主行动触发的动作和效果全部处理完后，才允许点击“回合结束”。
- “回合结束”会提交并清空当前主行动与快速行动历史，并按本轮顺位切换到下一名未 PASS 玩家；所有未 PASS 玩家在当前行动圈都行动后，会继续本轮的下一回合；若所有玩家都 PASS，则进入下一轮。第 4 轮所有玩家都 PASS 后，游戏结束并进行终局计分。
- `PASS` 当前也是主要行动：点击后进入 PASS 必做效果链，结算完后才进入“待回合结束”状态；确认回合结束后，该玩家本轮不再获得行动机会。第 4 轮 PASS 不触发任何 PASS 效果，只等待回合结束确认。
- 第 1/2/3 轮 PASS 效果链顺序固定：若当前玩家手牌数 > 4，先弃至 4 张；若该玩家是本轮第一位 PASS 玩家，执行 1 次太阳系旋转；然后从本轮 PASS 预留叠中强制精选 1 张牌加入手牌。第 4 轮没有弃牌、旋转、预留精选或 PASS 事件效果。
- 第 1/2/3 轮 PASS 玩家点击“回合结束”确认后，会按自己的收入栏获得 1 次收入资源；第 4 轮 PASS 不获得这次收入。
- 新局会准备 3 叠 PASS 预留牌，对应第 1/2/3 轮；每叠数量为启用玩家数 + 1。每轮玩家依次从剩余预留牌中选 1 张，所有玩家 PASS 进入下一轮时，本轮剩余的最后 1 张预留牌弃入弃牌堆。
- 第 1/2/3 轮 PASS 链上的弃牌、旋转、预留精选节点不能跳过；在点击“回合结束”确认前，仍可按当前行动撤销规则回滚已完成的可撤销步骤。
- “撤销”按最近完成的主/快速步骤回滚；主行动整体仍可通过回滚会话撤销。若撤销的是主行动起点或扫描费用这类前置步骤，会同步清空本次主行动会话与效果队列，主行动按钮立即恢复为可重新选择状态。
- 行动可以由能力事件链组成；链上每个节点是一个原子能力，能力返回 `undoable` 决定是否进入撤销历史。
- 不可撤销效果结算后会作为历史屏障记录：屏障本身和屏障之前的步骤不可撤销，但屏障之后新发生的可撤销步骤仍可单独撤销；若最近屏障来自快速行动，也不能越过它撤销更早的主行动。
- 科技行动采用效果链：选择科技片可撤销；撤销已选择的科技片会回到选片前，再撤销科技行动起点会回到执行科技行动前；旋转与科技 bonus 不可撤销；橙1免费发射与紫1获得数据分别按标准「发射」「数据」效果处理且可撤销；橙1发射同样结算发射后的被动效果。

### 橙色科技效果

- 橙色 1：获得时立刻执行一次免费发射（不消耗信用点，仍触发发射后的被动效果，如哨兵探测网络扫描地球扇区）；同时玩家火箭上限从 1 提高到 2。
- 橙色 2：火箭通过移动或旋转推动进入小行星时获得 1 宣传；从小行星移出只需要 1 点移动力。没有橙色 2 时，从小行星移出需要 2 点移动力。
- 橙色 3：基础行动登陆能量消耗减少 1，因此无环绕为 2 能量，有环绕为 1 能量。
- 橙色 4：解锁卫星登陆；没有该科技时登陆目标列表只包含主星。

### 环绕 / 登陆奖励效果流

环绕、登陆主星、登陆卫星的奖励表由 `randomizer/game/actions/planet-rewards.js` 管理：

- `buildOrbitRewardEffects(planetId, markerSequence)`：环绕奖励。若 `markerSequence === 1`，先插入“首次环绕 +3 分”，再按星球固定奖励顺序生成效果节点。
- `buildPlanetLandRewardEffects(planetId, markerSequence)`：主星登陆奖励。除火星外，只有首次登陆额外获得数据；火星第 1 次额外 2 数据，第 2 次额外 1 数据。
- `buildSatelliteLandRewardEffects(satelliteId)`：卫星登陆奖励。
- `buildRewardEffectsForAction(actionId, result)`：`app.js` 在 `orbitProbe` / `landProbe` 成功后调用，生成奖励效果链。
- 多个环绕/登陆目标需要选择时，下拉选项会在位置名后显示按当前下一枚标记序号计算的地点奖励摘要；卡牌来源追加的登陆后奖励也会并入对应位置摘要。

执行流：

- `orbitProbe` / `landProbe` 仍只负责支付成本、移除火箭、放置环绕/登陆/卫星标记，并返回可撤销命令。
- `app.js` 在环绕/登陆成功后，先把标记动作作为 `action_start` 步骤写入 `actionHistory`，再启动奖励效果链。
- 奖励效果链逐个点击执行；全部完成后才允许继续快速行动或点击“回合结束”。
- 自动奖励（分数、能量、宣传、数据、盲抽）直接结算并写入撤销命令。
- 选择型奖励复用现有 UI：精选卡牌、收入弃牌、星云二选一、外星人痕迹选择；选择完成后推进当前奖励节点。
- 盲抽、公共牌补牌、外星人牌获取、外星人揭示发牌、外星人展示牌翻新、方舟奖励牌翻开/洗牌、外星人揭示随机初始化等新信息边界会写入不可撤销屏障；纯资源、数据、移动、痕迹、任务移牌等确定性结算优先写入可撤销快照。
- 黄色外星人标记限制为 `yellow` 痕迹；任意外星人标记允许 `yellow` / `pink` / `blue`。非调试奖励进入外星人痕迹 picker 前必须固化 `targetPlayerId/targetPlayerColor`，确认放置时只使用该目标玩家；state 面板直点只允许调试直接模式，避免奖励痕迹落到当前显示玩家。

当前解释约定：

- “收入”按现有收入效果处理：玩家弃 1 张手牌，按该牌收入角标增加收入。
- “精选”按现有精选处理：从公共牌区拿 1 张牌；所有精选效果都允许盲抽，只有明确声明 `allowBlindDraw: false` 的来源例外（如公共牌区扫描、只要求亮明公共牌的角标精选）。
- 普通牌库分为可抽牌堆与弃牌堆：玩家打出的非保留牌、手牌弃牌、公共牌区被弃掉的牌，以及每轮剩余 PASS 预留牌都会进入弃牌堆。在当前可抽牌堆全部抽完前，弃牌堆里的牌不会再次被盲抽或补到公共牌区；只有可抽牌堆为空时，才把当时的弃牌堆洗回为新的可抽牌堆。洗回后新产生的弃牌仍留在弃牌堆，等新的可抽牌堆再次抽空才会参与下一次洗牌。
- 盲抽奖励使用 `assets/symbol/effect/blind_card.webp`。
- 奖励效果和通用资源效果图标统一从 `assets/symbol/effect/` 读取；缺少的资源图标从 `assets/symbol/split/seti-icons/` 复制为语义化文件名后再引用。
- 固定星球扇区扫描使用 `assets/symbol/effect/normal_scan.webp`，并在效果按钮上显示星球名角标；天王星/海王星的织女一/绘架座β二选一扫描使用 `black_scan.webp`；红/蓝/黄星云扫描分别使用 `red_scan.webp`、`blue_scan.webp`、`yellow_scan.webp`。
- 外星人标记使用 `assets/symbol/effect/alien_*.webp` 素材；代码 icon key 与文件名保持一致。

快速行动不属于主要行动次数限制：

- 快速交易：通过 `quick-trades.js` 改变资源/手牌/牌区。
- 3 宣传精选：通过 `quick-trades.js` 消耗 3 宣传并从公共牌区精选 1 张牌；确认拿牌后不可撤销。
- 放置数据：从数据池放入计算机或蓝色科技附加位。
- 移动：点击已有火箭后选择方向，确认时按所需移动力支付；1 点移动力可消耗 1 能量或弃 1 张移动牌。没有橙色 2 时，从小行星移出需要 2 点移动力，可用 2 能量、2 张移动牌、或 1 张移动牌 + 1 能量支付。紫4扫描移动、卡牌触发免费移动、弃牌角标移动和寰宇移动节点等普通移动效果若只提供 1 点移动力，可继续用移动牌或能量补足差额后移出小行星。
- 火箭移动进入非地球行星或彗星时，该玩家获得 1 宣传；拥有橙色 2 时，移动进入小行星也获得 1 宣传。访问只看进入目标地点的瞬间，火箭已经停在该地点不触发；旋转推动导致的进入按同一套宣传/访问事件规则结算，单纯随版图旋转不重复视为访问。

快速行动可以在主行动之前、主行动完成之后，以及主行动效果队列的不同效果之间使用。快速行动会记录可撤销步骤，但不会消耗本回合的主要行动次数，也不会改变主行动是否已经完成。确认精选拿牌后，该精选动作不可撤销。

### 扫描效果队列

扫描队列由 `randomizer/game/actions/scan-effects.js` 构建，并由 `randomizer/game/abilities/chain.js` 管理为能力事件链：

- 标准扫描主行动开始时先支付扫描费用（受公司/被动修正影响），费用是行动触发条件，不作为效果队列节点；该支付仍随行动历史可撤销。
- 无紫色科技：地球所在扇区扫描 + 公共牌区扫描。
- 公共牌区扫描默认弃 1 张选 2 选 1 星云；玩家每有 1 个 `additionalPublicScan` 可多选 1 张公共牌（最多 2 个，即最多弃 3 张），弃牌后按张数依次弹出多组 2 选 1 星云（可重复）。扫描行动内的公共牌区扫描只弃牌并留下空牌位，不立刻补牌。
- 扫描 flow 完成后会检查本次扫描标记过且已填满的扇区，并插入对应完成扇区节点、扇区奖励节点；本次公共扫描留下的空公共牌位不作为效果节点，等这些后续节点和跨玩家奖励全部完成后自动补牌。自动补牌翻出新公共牌后标记为 `hidden_card_reveal` 不可撤销边界。
- 普通卡牌的公共牌区扫描也使用延迟补牌：多次公共扫描牌会先选完并弃完本次扫描的公共牌，再依次执行星云选择；卡牌效果和临时奖励全部完成后才统一补充空公共牌位。调试公共扫描不带 `scanRunId`，仍按“弃牌 -> 扫描 -> 立即补牌”的旧路径结算。
- 紫1：获得时立刻获得 2 数据；地球扇区扫描升级为“地球及相邻扇区三选一”。
- 紫2：额外增加水星所在扇区扫描，消耗 1 宣传；宣传不足时只能跳过该效果。
- 紫3：额外增加手牌扫描。
- 紫4：额外增加“发射/移动”效果；发射消耗 1 能量，移动免费提供 1 点移动力；能量不足时不能选择发射，只能移动或跳过。从小行星移出且没有橙2时，可额外补 1 张移动牌或 1 能量凑足 2 点移动力。

每个效果在 UI 中是 `pendingActionEffectFlow.effects[]` 的一个能力链节点。节点可以完成或跳过；可撤销节点完成后会写入 `actionHistory`，撤销会回到该节点重新等待触发。全部处理完后，主行动进入“可回合结束/可快速行动”状态。在效果队列之间允许执行快速行动；快速行动撤销后，扫描队列仍停留在原来的主行动流程中。

## 撤销机制

撤销由 `randomizer/game/history/action-history.js` 实现。当前有两条并行的事务历史：

- `actionHistory`：主行动会话，控制主行动撤销与回合结束提交。
- `quickActionHistory`：快速行动会话，记录快速交易、放置数据、移动等快速步骤。
- `historyStepOrder`：`app.js` 中的轻量顺序栈，记录 `{ source, stepId }`，用于在主/快速行动交错时按最近完成步骤撤销。
- `randomizer/game/history/transactions.js`：历史辅助层，提供能力结果记录、不可撤销屏障标记、组合状态快照恢复等工具；新增复杂机制优先复用它或同等语义，而不是直接操作两套 history。

`createActionHistory()` 提供的会话 API：

- `beginSession(actionType, label)`：开始一个行动会话。
- `beginStep(meta)`：开始一个步骤，支持 `source`、`undoable: false`、`irreversibleCode`、`irreversibleReason`。
- `record(command)`：记录命令，命令必须有 `undo()`。
- `endStep()`：结束当前步骤。
- `undoLastStep()`：撤销当前会话最后一步。
- `rollbackSession()`：撤销整个当前行动。
- `commitSession()`：确认或结束会话，清空当前会话。

回合结束会 `commitSession()` 主行动的 `actionHistory`，并清空快速行动历史。快速行动没有确认按钮；当快速行动步骤都被撤销后，`quickActionHistory` 会自动提交清空。精选/盲抽/补牌等确认产生新信息后写入不可撤销屏障。
快速行动自己的不可撤销屏障会提交并封住该次 quick 历史；只有它发生在当前主行动会话之后时，才会阻断这个主行动继续撤销，避免 quick 的隐藏信息边界污染后续新开的主行动。

具体撤销命令在 `randomizer/game/history/commands.js`：

- 资源支付撤销：退回资源。
- 星云替换撤销：恢复 token 原 owner。
- 获得数据撤销：移除数据池 token，或回退弃置计数。
- 公共牌/手牌扫描撤销：恢复牌区、手牌、弃牌堆；完整扫描行动内的公共牌扫描弃牌与星云替换可撤销，公共区留空直到扫描 flow 收尾自动补牌。自动补牌翻出新公共牌后标记为 `hidden_card_reveal` 不可撤销屏障。普通卡牌公共扫描即时补牌，仍在补牌时进入同一不可撤销边界；手牌扫描弃牌不翻新牌，仍可撤销。
- 发射撤销：移除火箭并恢复 `nextRocketId` / `activeRocketId`。
- 移动撤销：恢复火箭移动前快照。
- 交易、分析、放置数据撤销：恢复对应快照。
- 通用快照撤销：恢复玩家、火箭状态、星球状态等对象快照，用于原子能力的复合副作用。

新增能力函数必须只返回 `commands`，不直接写入 `actionHistory`。调用方负责在当前 session/step 中记录这些命令。
能力必须显式返回 `undoable`；`undoable: false` 或带 `irreversible` 的能力成功后写入不可撤销屏障，失败时必须自行恢复到执行前状态。

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
  - `payScanCost(context, options)`：内部费用结算能力；标准扫描行动开始时调用，不进入效果栏。
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
- `options.movementPoints` 表示本次移动实际提供的移动力；未传时按能量成本推导，免费移动默认为 1。UI 在调用普通移动能力前会把效果移动力、弃掉的移动牌和支付的能量合并成实际移动力。
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
- 弃移动牌/紫4扫描移动：`moveProbe(context, { cost, movementPoints, rocketId, deltaX, deltaY })`；其中 `movementPoints` 是效果移动力与补充支付合计后的点数，`cost` 只记录实际消耗的能量。
- 扇区扫描：`scanSector(context, { nebulaId })` 或 `scanSector(context, { sectorX })`。
- 公共/手牌扫描：UI 先选择牌和目标星云，再调用扫描能力。完整扫描行动的公共扫描使用 `scanRunId` 延迟补公共牌，结算为“弃除来源牌 + 星云扫描 + 可选获得数据”，补牌在扫描 flow 末尾自动执行，不进入效果队列；若目标星云已无可替换数据，星云扫描改为追加扇区扫描计数标记且不获得数据。普通公共扫描仍调用 `scanPublicCard` 即时补牌。手牌扫描结算“星云扫描 + 可选获得数据 + 弃除来源牌”。
- 科技行动：`researchTechPrepare` 进入选择效果链，默认允许全部颜色科技，也可传 `techType` / `techTypes` 限制颜色；`researchTechSelect` 支付 6 宣传、拿取并放置科技片，且 `undoable: true`；`researchTechRotate` 执行太阳系旋转并结算火箭随盘旋转/镂空推动，`undoable: false`；橙1/紫1分别追加标准「发射」「数据」效果节点；`researchTechBonus` 结算 bonus 与首拿 +2 分，`undoable: false`。

## 卡牌模型

- 人工卡牌描述转可执行 DSL 的规范参考：`docs\card-modeling-dsl-spec.md`。后续新增卡牌模型时，先按该文档约束人工描述和 agent 转换，尤其要明确效果节点 `kind`、费用策略、任务类型和队列结束结算时机。
- 卡牌源数据保持 CSV，方便手工校对和继续补内容。当前 `assets/cards/card_model.csv` 主要承载本仓库资产编号、费用、角标和切图元数据；浏览器实际加载的 `randomizer/game/card-catalog.js` 和 Node 回退用的 `assets/cards/card_model.json` 由 `python tools/build_card_catalog_js.py` 从该 CSV 生成，改 CSV 后必须同步生成。效果语义按 `D:\code\ender_seti\seti` 参考实现迁移到 `randomizer/game/cards/effects.js`。
- `randomizer/game/cards/effects.js` 维护 `CARD_REFERENCE_MAP`、`MODELS` 和 `DEFERRED_CARD_MODELS`：`CARD_REFERENCE_MAP` 固化 `b_N.webp` 与 `dlc_N.png` 的来源资料；`b_1`-`b_70` 主要来自 ender_seti 参考实现，`b_71`-`b_140` 来自本仓库 `assets/cards/cards_71.md` / `card_model.csv`，`dlc_1`-`dlc_42` 来自 `assets/cards/dlc_cards.md` / `card_model.csv`；`MODELS` 是已可执行模型；`DEFERRED_CARD_MODELS` 记录当前原型缺能力而遗留的卡牌、参考类和缺失能力。打牌时通过 `getRuntimeCardTypeCode(card, fallback)` 优先使用模型类型，避免 CSV 类型与参考实现冲突导致误入任务区。
- `randomizer/game/cards/task-state.js` 维护 1 / 2 型任务统一状态：`refreshTaskState` 汇总当前玩家 2 型可完成任务与 1 型保留牌触发进度；`collectType1TriggerMatches` 聚合事件触发的 1 型匹配。`app.js` 在每次主行动效果结算（`completeCurrentActionEffect`）及快速行动/调试等状态变更后调用 `settleCardTasksAfterEffect`：先刷新 2 型高亮，再按 events 逐个处理 1 型触发。单个事件若命中同条件多槽仍只选 1 个；同一次扫描行动内多个不同颜色/不同事件会排队依次触发，因此 `b_25.webp` 扫描黄/红/蓝不同扇区可以分别完成对应触发。多点卡牌移动期间的访问事件会先累积，玩家可点击“结束移动”放弃剩余移动力并在移动效果结束时统一结算 1 型触发，避免中途弹窗打断移动池。1 型触发产生的卡牌效果类奖励会插入当前效果队列；移动奖励使用标准卡牌移动节点，撤销后恢复该奖励节点而不是丢失触发时机。
- 当前基础牌 `b_1.webp` 到 `b_70.webp` 已全部建立参考映射并建模为 `implemented`；实现状态以 `randomizer/game/cards/effects.js` 和 `effects.test.js` 为准。已迁移模型遵循：
  - 0 型卡：打出后展开为 `play_effect` 效果队列，复用现有扫描、公共牌扫描、盲抽、科技、发射、卡牌内免费移动等效果执行器。
  - 1 型卡：打出后进入保留牌区，并在移动等事件完成瞬间检查触发条件；若单个事件命中多个同条件触发槽，会弹出触发选择，只结算 1 个，也可以取消。已结算的触发槽会在牌面标记序号；全部触发槽结算后，完成任务数 +1 并移除该牌。触发槽消耗、任务移牌和完成任务数变化会随对应快速/效果历史记录；卡牌效果类触发会把奖励节点插入当前效果队列，并把触发进度作为该奖励节点的前置历史命令记录，撤销奖励节点时回到该奖励效果节点。触发精选或盲抽属于隐藏信息边界，会写入不可撤销 quick step。
  - 2 型卡：打出后进入保留牌区，并注册长期任务；状态条件满足后不自动结算，而是在任务区蓝色高亮。玩家点击该牌确认完成后，完成任务数 +1、移除该牌，并启动任务奖励队列。
  - `dlc_29.png`（废弃任务）只能选择仍未完成的 1/2 型任务牌；半人马牌不属于任务牌，不能选择。虫族化石搬运任务一旦已经拾取化石并生成搬运棋子，直到完成前都不能被该效果返回手牌。
- 3 型卡：打出后进入保留牌区第二行；终局计分由 `end-game-scoring.js` 按卡牌 `endGameScoring` 元数据实时结算。
- b71-b140 普通卡已接入扫描行动、打牌费用、研究科技、环绕/登陆、信号颜色、按扇区去重、探测器位置、冥王星特殊保留、移除登陆标记、按未标记终局板块计分等通用 DSL 能力。DLC 普通卡继续复用该框架，并新增本卡回手、条件扇区扫描、弃任意手牌按收入结算、支付信用可跳过奖励、移除己方环绕后放置探测器、PASS 触发、本回合访问事件计数、按剩余资源和全局星球标记终局计分等通用能力。卡牌写“公共牌区扫描的标记”时，按获得 `additionalPublicScan` 资源处理，不立刻执行公共牌区扫描。粉色科技按紫色科技处理；公司默认收入按公司模型 `baseIncome` 作为“非默认收入”基准。
- `b_118.webp` 视为弃除当前 3 张公共牌并分别按其颜色扫描角标选择星云；本卡按实际选择到的不同外圈扇区数 `n` 获得 `2 * n` 分，`n` 只会是 1 到 3。
- 临时任务：如“本卡效果期间若完成 1 个扇区”，绑定在本次卡牌效果队列上；显式 `sector_finish_scan` 效果执行后会把 settlement 结果累计到当前 flow，卡牌效果队列结束时再检查。
- 打牌是主要行动，只支付卡牌模型里的信用点费用；卡牌效果队列内复用扫描、科技、移动等能力时，不再重复支付这些主要行动的基础费用。
- 卡牌左上角 `discard_action_code` 可作为手牌快速行动：默认手牌不高亮可用性；玩家点击一张有左上角角标的手牌后，手牌区上方显示确认按钮。0 弃牌换 1 宣传，1 弃牌换 1 数据，2 弃牌换 1 移动，3 弃牌换 2 宣传，4 弃牌换 1 数据 + 1 分，5 弃牌换 1 移动 + 1 分。移动角标确认时先弃牌结算，再进入一次免费移动选择。卡牌效果内部也可读取移动角标，例如 `b_23.webp` 会同时弃除公共牌区 3 张牌并结算这些牌的左上角奖励，资源角标直接给资源，移动角标插入一次免费移动。
- 调试按钮「获取卡牌」支持普通牌输入 `25`、`b_25`、`b_25.webp`，数字输入只映射普通 `b_N.webp`；DLC 牌必须显式输入 `dlc_1` 或 `dlc_1.png`，避免与普通牌编号冲突。调试获取会从输入编号开始连续创建最多 5 张复制实例加入当前玩家手牌，不从牌库、公共区或弃牌堆移除原卡。
- 重点语义：`b_5.webp` / `b_6.webp` 的“完成扇区”按本次卡牌效果链中显式完成的扇区 settlement 判断，不作为后续可触发任务；`b_7.webp` 是盲抽 3 张牌，抽牌后该效果不可撤销；`b_9.webp` 的“扫描行动”按卡牌效果解释为不重复支付扫描行动基础费用，只展开扫描行动的后续效果，并使用完整扫描行动的延迟补牌/完成扇区调度；`b_11.webp`、`b_16.webp`、`b_17.webp`、`b_18.webp`、`b_24.webp` 使用 `card_move` 卡牌内移动节点，多点移动保持为单个效果图标并用角标显示剩余移动力；`b_20.webp` 监听发射事件，`b_25.webp` 监听黄色/红色/蓝色扇区扫描事件并奖励免费移动；`b_49.webp` 引力弹弓触发时，访问非地球行星仍先按默认规则获得 1 宣传，再动态追加 1 个“支付 1 宣传，1 移动”的可跳过效果；每次访问都可追加，且该支付移动若再次访问非地球行星也会先获得宣传并继续追加同类效果。
- 外星人卡牌分析由 `tools/analyze_alien_cards.py` 在每个外星人目录下分别生成 `card_analysis.csv`、`card_model.csv` 和 `card_model.json`；默认排除 `半人马`、`九折`、`方舟`，左上角有两个符号时按第二个标准符号判定弃牌收益。

## 后续改造方向

- `orbit`、`land`、`analyze`、`researchTech` 已拆成能力函数；后续继续处理 `playCard`，并让卡牌/科技通过 `cost` 参数触发低费或免费版本。
- 将扫描第二格 +2 分、推广和扇区奖励做成 `onSignalMarked` / `onSectorCompleted` 事件能力。
- 将 UI 的 overlay 选择与底层 ability 彻底分离，使能力函数可被测试、AI agent 和模拟器复用。

## 验证命令

当前无 package.json，测试以 Node 脚本运行：

推荐完整回归：

```powershell
node --check randomizer/app.js
node --check randomizer/game/history/action-history.js
node --check randomizer/game/history/transactions.js
node --check randomizer/game/abilities/scan.js
$tests = rg --files randomizer | Where-Object { $_ -match '\.test\.js$' } | Sort-Object; foreach ($test in $tests) { node $test; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE } }
```

常用拆分命令：

```powershell
node randomizer/game/abilities/abilities.test.js
node randomizer/game/abilities/chain.test.js
node randomizer/game/final-scoring.test.js
node randomizer/game/end-game-scoring.test.js
node randomizer/game/actions/scan-effects.test.js
node randomizer/game/actions/planet-rewards.test.js
node randomizer/game/actions/quick-trades.test.js
node randomizer/game/cards/deck.test.js
node randomizer/game/cards/effects.test.js
node randomizer/game/cards/task-state.test.js
node randomizer/game/basic-cards.test.js
node randomizer/game/initial-cards.test.js
node randomizer/game/industry/industry.test.js
node randomizer/game/history/action-history.test.js
node randomizer/game/history/commands.test.js
node randomizer/game/rockets.move.test.js
node randomizer/game/data/nebula.test.js
node randomizer/game/data/data.test.js
node randomizer/game/tech/tech.test.js
node randomizer/game/aliens/state.test.js
node randomizer/game/aliens/banrenma.test.js
node randomizer/game/aliens/yichangdian.test.js
node randomizer/game/aliens/fangzhou.test.js
node randomizer/game/aliens/fangzhou-card1-queue.test.js
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
