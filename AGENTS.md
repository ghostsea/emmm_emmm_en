# SETI 快速入口

这个仓库是一个无构建步骤的 SETI 浏览器原型：页面入口是 `randomizer/index.html`，app 装配边界在 `randomizer/app/**`，主 UI 与流程编排在 `randomizer/app.js`，核心游戏逻辑集中在 `randomizer/game/**`。

## Agent 工作约定

- 开始修改前，先读相关模块和本文件列出的细节文档；不要只凭记忆改机制。
- 机制、状态模型、能力流程或资料路径发生变化时，同步更新对应文档。
- `AGENTS.md` 只维护快速导航和关键路径；长机制说明放在 `docs/mechanics-reference.md`。
- 当前没有 `package.json` 或构建步骤；验证以 `node --check` 和 Node 测试脚本为主。
- 代码和资产路径以仓库根目录为基准。

## 代码地图

- `randomizer/index.html`：浏览器页面入口。
- `randomizer/app/dependencies.js`：app 层全局模块依赖收集与脚本顺序校验。
- `randomizer/app/constants.js`：app 层静态配置、图标路径、奖励表和 UI 参数。
- `randomizer/app/dom.js`：固定 DOM 元素注册表。
- `randomizer/app/events.js`：app 层事件绑定、overlay 点击分发、拖拽绑定与 resize 入口。
- `randomizer/app/public-api.js`：调试和外部脚本使用的 `window.SetiRandomizer` API 组装。
- `randomizer/app/ai-controller.js`：AI 自动机、策略权重、批跑/AB 测试与 AI 决策控制器。
- `randomizer/app.js`：主 UI、设置流程、回合流程、效果队列、行动日志、AI 控制器接线与各模块编排入口。
- `randomizer/style.css`：页面布局、交互聚焦、高亮与各区视觉状态。
- `randomizer/solar-system/layout.js`：太阳系盘面坐标、扇区、星云与内容类型定义。
- `randomizer/solar-system/core.js`：太阳系渲染与旋转相关核心逻辑。
- `randomizer/game/players.js`：玩家资源、收入、手牌、保留牌、科技与初始选择状态。
- `randomizer/game/rockets.js`：火箭状态、发射、移动、旋转推动与访问事件。部分地方可能把火箭称为探测器，他们是同一个东西。
- `randomizer/game/planet-stats.js`：星球环绕、登陆、卫星登陆和参考图标记统计。
- `randomizer/game/initial-cards.js`：公司牌和初始牌的初始选择结算。
- `randomizer/game/final-scoring.js`：终局计分板块标记流程。
- `randomizer/game/end-game-scoring.js`：终局板块与 3 型卡实时计分。
- `randomizer/game/abilities/**`：可复用能力函数与能力链，包括发射、移动、扫描、科技、环绕、登陆、分析等。
- `randomizer/game/actions/**`：主行动和快速行动的效果构建、奖励表与交易逻辑。
- `randomizer/game/history/**`：主行动/快速行动事务历史、撤销命令和不可撤销屏障。
- `randomizer/game/cards/**`：卡牌牌库、效果模型、任务状态和卡牌触发结算。
- `randomizer/game/data/**`：数据池、计算机放置、星云数据 token、扇区结算与渲染。
- `randomizer/game/tech/**`：科技供应区、玩家科技板、bonus、放置与渲染。
- `randomizer/game/industry/**`：公司牌目录、1x 主动能力、被动钩子、标记槽和渲染。
- `randomizer/game/aliens/**`：外星人通用状态、揭示、痕迹、渲染与物种专属机制。

## 常见任务入口

- 改回合、PASS、主行动锁定、效果栏或日志：先读 `randomizer/app.js` 和 `randomizer/game/history/**`。
- 改 app 框架、脚本依赖、常量、DOM、事件绑定或公开 API：先读 `docs/app-architecture.md` 和 `randomizer/app/**`。
- 改发射、移动、环绕、登陆或星球奖励：先读 `randomizer/game/abilities/**`、`randomizer/game/actions/planet-rewards.js`、`randomizer/game/rockets.js`。
- 改扫描、星云、数据池或扇区结算：先读 `randomizer/game/actions/scan-effects.js` 和 `randomizer/game/data/**`。
- 改打牌、任务卡、弃牌角标或卡牌 DSL：先读 `randomizer/game/cards/**` 和卡牌相关文档。
- 改科技、bonus 或科技板放置：先读 `randomizer/game/tech/**` 和 `randomizer/game/abilities/tech.js`。
- 改公司牌：先读 `randomizer/game/industry/**` 和 `assets/industry/industry-abilities.md`。
- 改外星人：先读 `randomizer/game/aliens/**`、`docs/alien-design.md` 和对应物种文档。

## 详细资料索引

- `docs/mechanics-reference.md`：从旧版 `AGENTS.md` 迁出的完整机制参考。
- `docs/app-architecture.md`：浏览器 app 装配层、`randomizer/app/**` 边界与后续拆分原则。
- `docs/effect-glossary.md`：效果术语表；不确定效果名含义时先查这里。
- `docs/card-modeling-dsl-spec.md`：卡牌描述转换为可执行 DSL 的规范。
- `docs/card-ability-migration-plan.md`：基础卡能力迁移状态、已实现/部分实现/延后清单。
- `docs/alien-design.md`：外星人通用设计总结与新增外星人检查清单。
- `docs/ai-architecture-v2.md`：电脑玩家 AI 的**权威架构与路线**（价值模型/目标系统/回合规划），后续开发以此为准。
- `docs/ai-player-design.md`：AI 接口契约层（GameState/决策总线/PlayerAgent/枚举），仍有效；大脑层以 v2 为准。
- `assets/final/final_detail.md`：终局计分 a/b/c/d 板块的规则公式。
- `assets/industry/industry-abilities.md`：公司牌主动/被动能力设计与建模说明。

## 外星人专属文档

- `assets/aliens/九折/implementation.md`
- `assets/aliens/异常点/implementation.md`
- `assets/aliens/半人马/implementation.md`
- `assets/aliens/方舟/implementation.md`
- `assets/aliens/虫/implementation.md`
- `assets/aliens/阿米巴/implementation.md`
- `assets/aliens/奥陌陌/implementation.md`
- `assets/aliens/符文族/implementation.md`

## 常用验证

推荐回归：

```powershell
node --check randomizer/app.js
$tests = rg --files randomizer | Where-Object { $_ -match '\.test\.js$' } | Sort-Object; foreach ($test in $tests) { node $test; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE } }
```

需要额外检查能力/历史基础语法时：

```powershell
node --check randomizer/game/history/action-history.js
node --check randomizer/game/history/transactions.js
node --check randomizer/game/abilities/scan.js
```

资料生成脚本：

```powershell
python tools/build_card_catalog_js.py
python tools/analyze_alien_cards.py
```
