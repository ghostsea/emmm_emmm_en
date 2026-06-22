# 外星人机制设计总纲

本文总结外星人机制的通用建模方式，供新增或迁移外星人时复用。具体外星人的规则、坐标、调试方式应放在 `assets/aliens/<外星人>/implementation.md`；原始规则文本保留在同目录 `face_detail.md`。

## 文档分层

- `AGENTS.md`：只保留外星人公共状态、入口索引和当前实现概览。
- `docs/alien-design.md`：记录外星人通用生命周期、代码接口、撤销边界和新增外星人的检查清单。
- `assets/aliens/<外星人>/implementation.md`：记录该外星人的运行时状态、揭示副作用、正面痕迹格、奖励、外星人牌、调试和当前实现限制。
- `assets/aliens/<外星人>/face_detail.md`：保留设计源文本，不作为代码接口说明。

## 通用生命周期

1. 设置阶段重置两个未揭示槽位，不预先写入外星人类型。未揭示前 UI 只显示 `state1.png` / `state2.png` 和三色首痕迹区域。
2. 玩家获得外星人痕迹时，未揭示槽位先尝试放置三色首痕迹：`yellow`、`pink`、`blue`。同色首痕迹只记录第一位拥有者；后续同色痕迹增加 `extraCount`。
3. 三种首痕迹都放置后触发主动发现。主动发现会从全部外星人中随机翻开一个尚未翻开的物种，两个外星人槽位不能相同，并把结果写入当前槽位的 `assignedAlienId` / `alienId`，随后初始化该外星人的专属状态、牌库、标记或棋子。
4. 揭示后的痕迹不再走普通首痕迹模型，而是进入该外星人的正面格位/专属交互。格位可为单占用、可叠放、需解锁、需支付资源、或绑定专属区域奖励。
5. 痕迹奖励可能直接给资源/分数/数据，也可能打开后续选择：外星人牌、公共牌精选、盲抽、扇区扫描、移动、任务完成等。
6. 外星人牌按物种自有规则进入手牌、保留区或专属区。打出后复用主行动效果队列、快速行动步骤、1/2/3 型任务、或物种自己的条件触发系统。

## 代码接口

- `randomizer/game/aliens/catalog.js`：登记外星人 ID、名称、素材目录。
- `randomizer/game/aliens/state.js`：公共槽位、首痕迹、额外痕迹、揭示判定。
- `randomizer/game/aliens/randomizer.js`：设置阶段重置槽位，主动发现时随机选择不重复的外星人。
- `randomizer/game/aliens/placement.js`：公共首痕迹坐标和各外星人正面格位坐标。
- `randomizer/game/aliens/<alien>.js`：物种专属状态、揭示初始化、痕迹放置、奖励、卡牌模型。
- `randomizer/app.js`：UI 流程、overlay 选择、效果队列、撤销/日志接入。

外星人专属状态统一挂在 `alienGameState.<alienId>`。状态字段应能完整表达 UI 和规则，不依赖 DOM 作为权威数据。

## 撤销与不可逆边界

确定性效果优先可撤销：资源、数据、分数、痕迹放置、任务移牌、化石搬运、symbol 移动等，都应在主/快速历史中记录快照或命令。

以下行为属于新信息边界，应写入不可撤销屏障：

- 揭示外星人并初始化随机牌库、化石、symbol、异常标记、解锁牌等。
- 盲抽基础牌或外星人牌。
- 拿走展示外星人牌后翻新展示牌。
- 方舟 card1 翻牌或重新洗牌。
- 公共牌精选后补出新公共牌。
- 太阳系旋转本身。

屏障本身和屏障之前的同一历史不可撤销；屏障之后的新确定性步骤仍可单独撤销。行动日志的 `recoverySnapshot` 用于恢复稳定局面，不要求从日志文本重放隐藏信息。

## UI 与坐标

- 未揭示槽位使用公共 `ALIEN_TRACE_MARKER_SLOTS` 和 `ALIEN_EXTRA_TRACE_MARKER_SLOTS`。
- 揭示后的正面格位必须在 `placement.js` 固化坐标，并在对应 `implementation.md` 说明坐标来源、叠放规则和调试入口。
- 调试按钮可以直接揭示指定外星人，但调试行为不要求完整撤销语义；正式玩法路径必须接入历史和日志。
- 外星人牌展示、盲抽、取消通常复用同一三选一模式；拿展示牌后刷新展示牌属于不可逆。

## 新增外星人检查清单

- 在 `catalog.js` 登记外星人 ID、名称和素材路径。
- 在 `state.js` 或专属模块中定义默认状态、揭示初始化和 reset 行为。
- 在 `placement.js` 定义正面痕迹格、奖励位、symbol 位或专属棋子显示坐标。
- 在 `app.js` 接入揭示副作用、正面点击、奖励队列、外星人牌获取和调试按钮。
- 明确每个奖励是可撤销命令、快照恢复，还是不可逆屏障。
- 若有外星人牌，记录牌堆、展示牌、盲抽、打出费用、进入区域、任务类型和终局计分。
- 添加或更新 `assets/aliens/<外星人>/implementation.md`。
- 添加单元测试，至少覆盖状态初始化、痕迹放置、奖励分支和不可逆边界。

## 当前物种文档

- 九折：`assets/aliens/九折/implementation.md`
- 异常点：`assets/aliens/异常点/implementation.md`
- 半人马：`assets/aliens/半人马/implementation.md`
- 方舟：`assets/aliens/方舟/implementation.md`
- 虫：`assets/aliens/虫/implementation.md`
- 阿米巴：`assets/aliens/阿米巴/implementation.md`
- 奥陌陌：`assets/aliens/奥陌陌/implementation.md`
- 符文族：`assets/aliens/符文族/implementation.md`
