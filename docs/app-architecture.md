# App 架构边界

本文档说明浏览器入口层的职责边界。这里的 app 指 `randomizer/index.html` 加载后由 `randomizer/app/**` 和 `randomizer/app.js` 组成的页面装配层；核心规则仍以 `randomizer/game/**` 为准。

## 当前加载层次

1. `randomizer/index.html` 按传统 `<script>` 顺序加载，无构建步骤，也不使用 ES module。
2. `randomizer/solar-system/**`、`randomizer/game/**` 先注册各自的 `window.Seti*` 全局模块。
3. `randomizer/app/dependencies.js` 收集并校验 app 层需要的全局模块。
4. `randomizer/app/constants.js` 创建 app 层静态配置、图标路径、扫描/扇区奖励表和 UI 参数。
5. `randomizer/app/dom.js` 集中查询页面上的固定 DOM 节点。
6. `randomizer/app/events.js` 绑定页面事件、overlay 点击分发、拖拽回调和 resize 入口。
7. `randomizer/app/action-log-export.js` 生成行动日志 Markdown 和下载文件名。
8. `randomizer/app/public-api.js` 组装 `window.SetiRandomizer` 调试/外部脚本 API。
9. `randomizer/app/ai-controller.js` 封装 AI 自动机、策略权重、批跑/AB 测试和 AI 决策控制器。
10. `randomizer/app.js` 保留运行态、流程编排、效果队列、渲染调度、行动日志和各控制器接线。

## 文件职责

- `randomizer/app/dependencies.js`：唯一的 app 入口依赖表。新增或删除 `window.Seti*` 依赖时先改这里，让脚本顺序错误能尽早报错。
- `randomizer/app/constants.js`：只放静态常量和依赖派生常量。不要在这里读写游戏状态、DOM 或 pending 流程。
- `randomizer/app/dom.js`：只收集固定 DOM 元素和 NodeList。新增 HTML id、overlay、按钮或常驻区域时先在这里登记。
- `randomizer/app/events.js`：只做事件到 app 回调的路由。新增按钮、overlay、拖拽入口时优先改这里；不要在这里实现规则结算。
- `randomizer/app/action-log-export.js`：只做纯 Markdown 格式化和文件名生成，不读 DOM、不读取隐藏牌序，也不触发浏览器下载。
- `randomizer/app/public-api.js`：只组装 `window.SetiRandomizer` 暴露面。新增调试 API 时优先改这里，保持 API 与运行态编排分离。
- `randomizer/app/ai-controller.js`：AI 层。内部维护 AI 批跑状态、策略权重和需求缓存；需要读取 app pending 状态时通过 `state` getter/setter，不要在模块内复制 pending 值。
- `randomizer/app.js`：编排层。可以组合规则模块、维护运行时 pending 状态和刷新 UI，但不应再新增大段静态配置、散落的 DOM 查询清单、事件绑定清单、公开 API 清单或 AI 策略逻辑。

## 仍需拆分的高耦合区

- AI 自动机已通过 `createAiController(context)` 迁入 `randomizer/app/ai-controller.js`，但它仍通过一组显式回调调用 app 的 UI 流程。后续若要继续解耦，应优先把“读取局面”“列出候选”“执行选择”下沉为更窄的决策总线，而不是在 AI 模块里直接新增 DOM 选择逻辑。
- 行动日志和恢复快照当前仍跨越日志渲染、全局状态克隆、临时 pending 清理和全 UI 刷新。拆分时不能只移动渲染函数；应先形成 `action-log` 状态/渲染模块和 `recovery` 状态恢复模块两个边界。
- `pending*` 选择状态仍散布在 `app.js`。新增需要玩家/AI 共同处理的选择流程时，应先考虑统一的 decision/pending adapter，而不是再增加只有人工点击能完成的 overlay 状态。

## 后续拆分原则

- 保持无构建、全局命名空间风格，除非一次性迁移计划明确覆盖全部脚本加载顺序和测试方式。
- 从 `app.js` 抽代码时优先选择低耦合边界：静态配置、DOM 注册、事件绑定、公开调试 API、日志渲染、AI 自动机适配层。
- 规则语义仍落在 `randomizer/game/**` 或对应机制文档；`app.js` 只负责把 UI 操作路由到规则模块并把结果展示出来。
- 抽出的 app 模块应采用 `window.SetiApp*` 命名，必要时同时支持 `module.exports`，方便 Node 语法检查或后续单测。
- 大块迁移不要顺手改规则、文案或常量值。先做无行为移动，通过回归后再做功能性调整。

## 验证要求

- 修改 `randomizer/app/**` 或 `randomizer/app.js` 后，至少运行对应 `node --check`。
- 若变更影响脚本加载、DOM 查询、事件绑定或首屏初始化，需要用本地静态服务器做浏览器烟测。
- 跨流程拆分时运行 `randomizer/**/*.test.js` 全量 Node 回归。
