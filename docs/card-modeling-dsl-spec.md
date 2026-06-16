# SETI 卡牌建模语言到可执行 DSL 规范

本文档用于约束“人类可读卡牌描述”如何被 agent 转成可执行 DSL。目标不是让人工直接写程序 JSON，而是让人工表格描述足够稳定，agent 能无歧义地转换，并避免实现中常见错误：效果不推进、重复扣主行动费用、选择流程丢失上下文、扇区结算过早触发。

## 总原则

1. 打牌本身是主要行动。只支付卡牌自身信用点费用。
2. 卡牌效果队列内复用扫描、科技、移动、发射等能力时，不再次支付这些主行动的基础费用，除非 DSL 显式声明 `extraCost`。
3. 每个效果节点必须明确执行形态：自动结算、打开选择、展开子队列、等待外部事件、确认完成。
4. 每个效果节点成功后必须有唯一推进责任：自动节点由执行器推进；选择节点由确认回调推进；展开节点插入子效果后推进自身。
5. 星云/扇区完成结算只允许在整条主要行动效果队列结束后检查，不允许在单个扫描节点完成时检查。
6. 任务分为触发型和状态型。触发型在事件完成瞬间检查；状态型只高亮，玩家确认后才结算。
7. 访问事件只表示火箭通过移动、旋转推动等位移进入目标地点的瞬间；火箭已经停在目标地点不算访问，也不应触发 `visitPlanet` / `visitAsteroid` 等条件。

## 人工表格推荐字段

人工建模表可以继续使用中文，但必须拆成以下字段。缺字段时，agent 应优先按规则补全；若无法补全，必须向建模者提问。

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `card_id` | 是 | 卡牌文件名或唯一 ID，如 `b_1.webp`。 |
| `card_name` | 是 | 人类可读名称。 |
| `card_type` | 是 | `0`、`1`、`2`。 |
| `play_cost_credits` | 是 | 打出卡牌消耗的信用点。 |
| `play_queue_text` | 0/2 型常见 | 打出后立刻执行的效果队列。没有则填 `无`。 |
| `trigger_text` | 1 型必填 | 触发槽描述，最多 3 个。 |
| `state_task_text` | 2 型必填 | 状态任务条件和奖励。 |
| `temporary_task_text` | 可选 | “本卡效果期间……”之类临时任务。 |
| `notes` | 可选 | 识图不确定、规则裁定、需要确认的内容。 |

人工描述中禁止只写“扫描”“科技”“任务奖励”等过宽词。必须写出目标、选择范围、是否获得数据、是否免费、结算时机。

## 标准 DSL 形态

agent 最终应把人工描述转换成以下规范对象。当前实现可以先用 JS/JSON 常量承载，后续可再由 CSV 构建。

```js
{
  cardId: "b_1.webp",
  cardType: 2,
  playCost: { credits: 2 },
  playQueue: [
    {
      id: "b1-scan-virgo-1",
      kind: "auto",
      type: "scan_nebula",
      label: "室女座61扇区扫描 1/2",
      args: { nebulaId: "sector-4-a", gainData: true },
      source: "card",
      costPolicy: "card_paid",
      produces: ["signalMarked"]
    }
  ],
  triggers: [],
  stateTasks: [
    {
      id: "b1-yellow-sector-task",
      timing: "after_main_effect_queue",
      condition: { type: "completedSectorsByColor", color: "yellow", count: 2 },
      ui: { readyState: "highlight_blue", confirmRequired: true },
      rewardQueue: [
        { id: "b1-score", kind: "auto", type: "gain_resources", args: { score: 4, publicity: 1 } }
      ]
    }
  ],
  temporaryTasks: []
}
```

## DSL 字段约束

### 卡牌顶层

| 字段 | 约束 |
| --- | --- |
| `cardType` | `0` 为打出效果卡；`1` 为触发任务卡；`2` 为状态任务卡。 |
| `playCost` | 只能表示打牌费用，通常 `{ credits: N }`。 |
| `playQueue` | 打出后立即执行的效果队列。每个节点必须有 `kind` 和 `type`。 |
| `triggers` | 仅 1 型使用，最多 3 个。每个触发槽独立编号。 |
| `stateTasks` | 仅 2 型使用。满足条件后高亮等待确认。 |
| `temporaryTasks` | 仅绑定本次 `playQueue`，不长期保留。 |

### 效果节点

所有效果节点必须符合：

```js
{
  id: "stable-id",
  kind: "auto | choice | expand | wait | confirm",
  type: "primitive-or-composite-effect",
  label: "按钮显示文本",
  args: {},
  source: "card | scan | tech | reward | debug",
  costPolicy: "card_paid | pay_cost | skip_cost | extra_cost",
  undoable: true,
  produces: []
}
```

`kind` 决定推进责任：

| `kind` | 用途 | 推进责任 |
| --- | --- | --- |
| `auto` | 点击后立即结算，如获得资源、固定星云扫描。 | 执行器成功后必须完成当前节点。 |
| `choice` | 打开选择 UI，如二选一星云、公共牌区扫描、手牌扫描、外星人标记。 | 选择确认回调完成当前节点。 |
| `expand` | 展开一组子效果，如“扫描行动”。 | 插入子效果后完成当前节点。 |
| `wait` | 打出后等待未来事件，如 1 型触发槽。 | 不在 `playQueue` 内推进，由事件系统处理。 |
| `confirm` | 状态满足后等待玩家确认，如 2 型任务。 | 玩家点击任务牌确认后启动奖励队列。 |

禁止一个节点同时承担两种推进责任。例如“公共牌区扫描”不能既在点击效果时完成，又在星云确认时再次完成。

## 支持的效果原语

### 资源与卡牌

| DSL | 参数 | 说明 |
| --- | --- | --- |
| `gain_resources` | `credits`、`energy`、`publicity`、`score` | 自动节点。 |
| `gain_data` | `count` | 自动节点，逐个获得数据。 |
| `draw_cards` | `count` | 自动节点，但通常不可撤销。 |
| `pick_public_card` | `count`、`allowBlindDraw` | 选择节点。 |
| `income` | 无或 `count` | 选择/弃牌节点，弃手牌后按收入角标加收入。 |

### 扫描

| DSL | 参数 | `kind` | 说明 |
| --- | --- | --- | --- |
| `scan_nebula` | `nebulaId`、`gainData` | `auto` | 扫描确定星云。成功后必须推进当前节点。 |
| `choose_colored_nebula_scan` | `color`、`gainData` | `choice` | 颜色二选一扫描。 |
| `choose_sector_scan` | `sectorXs`、`gainData` | `choice` | 从指定扇区集合中选一个星云。 |
| `any_sector_scan` | `gainData` | `choice` | 8 个外圈扇区任选。 |
| `public_card_scan` | `maxSelectable` | `choice` | 选公共牌，按该牌扫描角标选星云，弃牌并补牌。 |
| `hand_card_scan` | `count` | `choice` | 选手牌，按该牌扫描角标选星云，确认后弃牌。 |
| `expand_scan_action` | `skipBaseCost` | `expand` | 插入扫描行动后续节点。卡牌来源必须 `skipBaseCost: true`，除非牌明确要求支付扫描费。 |

扫描节点成功后会产生 `signalMarked` 事件。扇区完成检查不得由扫描节点直接触发，只由完成后的效果队列统一触发。

### 火箭、星球、科技

| DSL | 参数 | `kind` | 说明 |
| --- | --- | --- | --- |
| `launch` | `skipCost` 或 `cost` | `auto`/`choice` | 卡牌来源默认 `skipCost: true` 或显式卡牌费用覆盖。 |
| `move` | `movementPoints`、`skipCost` | `choice` | 需要选择火箭和方向。 |
| `research_tech` | `techTypes`、`skipCost` | `choice` | 卡牌来源默认 `skipCost: true`，后续仍展开旋转、bonus、即时效果。 |
| `alien_trace` | `traceTypes` | `choice` | 选择外星人槽和痕迹颜色。 |

## 卡牌类型约束

### 0 型卡

0 型卡只有打出效果队列，不进入任务区。

```js
{
  cardType: 0,
  playQueue: [
    { kind: "choice", type: "choose_colored_nebula_scan", args: { color: "yellow", gainData: false } }
  ],
  triggers: [],
  stateTasks: []
}
```

若 0 型卡写有“本卡效果期间完成 X”，应建模为 `temporaryTasks`，而不是 `stateTasks`。

### 1 型卡

1 型卡进入任务区，最多 3 个触发槽。触发条件在事件完成瞬间检查；若多个触发槽满足，弹窗让玩家选一个或取消。已完成触发槽必须记录编号。全部触发槽完成后，完成任务数 +1，移除卡牌。

```js
{
  cardType: 1,
  playQueue: [],
  triggers: [
    {
      index: 1,
      id: "visit-planet-gain-energy",
      event: { type: "visitPlanet", excludePlanetIds: ["earth"] },
      timing: "on_event_completed",
      optional: true,
      rewardQueue: [
        { kind: "auto", type: "gain_resources", args: { energy: 1 } }
      ]
    }
  ]
}
```

1 型触发槽不得写成长期状态任务。例如“每次到达星球可选一个奖励”是事件触发，不是状态满足。

### 2 型卡

2 型卡进入任务区并注册状态条件。条件满足后只高亮，不自动结算。玩家点击任务牌并确认后，完成任务数 +1，移除卡牌，启动奖励队列。

```js
{
  cardType: 2,
  stateTasks: [
    {
      id: "all-blue-traces",
      timing: "after_main_effect_queue",
      condition: { type: "allAliensHaveTrace", traceType: "blue" },
      ui: { readyState: "highlight_blue", confirmRequired: true },
      rewardQueue: [
        { kind: "auto", type: "gain_data", args: { count: 2 } }
      ]
    }
  ]
}
```

2 型任务不得在条件满足瞬间弹触发窗口；也不得在队列结束后自动领取。

## 条件语法

条件对象必须使用受控枚举，不直接保存自然语言。

| 条件 DSL | 参数 | 说明 |
| --- | --- | --- |
| `completedSectorsByColor` | `color`、`count` | 玩家已赢得指定颜色扇区数量。 |
| `sectorCompletedDuringCard` | `count` | 本卡 `playQueue` 结束后的扇区结算数。仅临时任务。 |
| `allAliensHaveTrace` | `traceType` | 两个外星人槽都已有指定首痕迹。 |
| `visitPlanet` | `includePlanetIds`、`excludePlanetIds` | 火箭进入星球格的事件；已停在该星球不触发。 |
| `visitAsteroid` | 无 | 火箭进入小行星格的事件；已停在小行星或从小行星移出不触发。 |
| `signalMarked` | `nebulaId`、`color`、`slotIndex` | 星云标记事件，通常只作为后续事件扩展，不直接触发扇区结算。 |

若人工描述出现“黄色扇区”“红色扇区”，agent 必须转成具体颜色枚举，不应保留中文字符串给运行时解释。

## 费用与来源规则

| 场景 | DSL 写法 | 说明 |
| --- | --- | --- |
| 打出卡牌 | `playCost: { credits: N }` | 唯一默认费用。 |
| 卡牌内扫描行动 | `expand_scan_action({ skipBaseCost: true })` | 不支付扫描行动的 1 信用点 + 2 能量。 |
| 卡牌内研究科技 | `research_tech({ skipCost: true })` | 不支付研究科技的 6 宣传。 |
| 卡牌内发射/移动 | `source: "card"`，`skipCost` 或 `cost` | 只按卡牌文本显式费用处理。 |
| 额外费用 | `costPolicy: "extra_cost"`，`extraCost` | 只有卡牌明确写额外支付时使用。 |

agent 转换时，看到“作为卡牌效果执行某主行动”应默认 `source: "card"` 和 `skipCost: true`，不能复用主行动默认费用。

## 队列结束与扇区结算

任何扫描类节点只负责放置/替换星云 token 并产生 `signalMarked` 事件。扇区完成结算统一在主要行动效果队列结束时处理。

正确顺序：

```text
打牌支付费用
-> 执行 playQueue 节点 1
-> 执行 playQueue 节点 2
-> ...
-> 整条队列 completed
-> 如果本队列产生 signalMarked，检查 completed sectors
-> 结算扇区奖励和临时任务
-> 允许回合结束或快速行动
```

禁止顺序：

```text
扫描一个星云
-> 立即检查扇区完成
-> 再继续卡牌剩余效果
```

这个禁止顺序会导致临时任务、2 型任务和扇区奖励提前结算。

## 人工描述到 DSL 的转换流程

agent 转换每张卡时必须按以下顺序：

1. 读取 `card_type` 和 `play_cost_credits`。
2. 把打出效果拆成顺序队列；“然后”“再”“并且”通常表示顺序节点。
3. 给每个节点选择 `kind`：
   - 目标完全确定 -> `auto`。
   - 需要玩家选牌、选星云、选科技、选火箭、选外星人 -> `choice`。
   - 会展开另一套效果队列 -> `expand`。
   - 未来事件触发 -> `wait`。
   - 状态满足后玩家确认 -> `confirm`。
4. 把自然语言目标转成枚举或 ID，例如“室女座61”转 `sector-4-a`。
5. 显式写 `gainData`。未写时扫描默认 `true`；若牌面表示“只放标记不拿数据”，必须写 `false`。
6. 显式写费用策略。卡牌内复用主行动默认 `card_paid`/`skip_cost`。
7. 对 1 型卡建立 `triggers[]`，最多 3 个并保留 `index`。
8. 对 2 型卡建立 `stateTasks[]`，并设置 `confirmRequired: true`。
9. 对“本卡效果期间”建立 `temporaryTasks[]`，不要放进长期任务。
10. 执行校验清单；有缺口就输出问题，不要猜危险规则。

## 校验清单

agent 生成 DSL 后必须逐项检查：

- 每张卡只有一个 `playCost`，且所有卡牌内主行动复用都没有重复基础费用。
- 每个 `playQueue` 节点有 `kind`、`type`、`label`、`args`。
- 每个 `auto` 节点有明确成功结果，并能推进当前效果。
- 每个 `choice` 节点有确认回调所需的全部上下文，如 `fromEffectFlow`、目标卡牌、手牌/公共牌位置。
- 每个 `expand` 节点会插入子节点并完成自身。
- 每个扫描节点会产生 `signalMarked`，但不会自己触发扇区完成结算。
- 1 型卡 `triggers.length <= 3`，每个触发槽有稳定编号。
- 2 型卡满足条件后只高亮，不自动领奖。
- 临时任务只绑定本次卡牌效果队列。
- 奖励队列中的抽牌、精选、科技 bonus 等不可撤销节点必须标记 `undoable: false` 或由实现层识别。
- 所有中文目标都已转成枚举、ID 或受控参数。

## 示例

### 例 1：固定扫描加状态任务

人工描述：

```text
2 型。费用 2。打出：扫描室女座61两次。任务：完成 2 个黄色扇区。奖励：4 分，1 宣传。
```

DSL：

```js
{
  cardId: "b_1.webp",
  cardType: 2,
  playCost: { credits: 2 },
  playQueue: [
    { id: "b1-scan-1", kind: "auto", type: "scan_nebula", args: { nebulaId: "sector-4-a", gainData: true }, source: "card", costPolicy: "card_paid", produces: ["signalMarked"] },
    { id: "b1-scan-2", kind: "auto", type: "scan_nebula", args: { nebulaId: "sector-4-a", gainData: true }, source: "card", costPolicy: "card_paid", produces: ["signalMarked"] }
  ],
  stateTasks: [
    {
      id: "b1-yellow-sector-task",
      timing: "after_main_effect_queue",
      condition: { type: "completedSectorsByColor", color: "yellow", count: 2 },
      ui: { readyState: "highlight_blue", confirmRequired: true },
      rewardQueue: [
        { id: "b1-reward", kind: "auto", type: "gain_resources", args: { score: 4, publicity: 1 } }
      ]
    }
  ]
}
```

### 例 2：卡牌内扫描行动

人工描述：

```text
0 型。费用 2。执行一次扫描行动，再任意扇区扫描一次。
```

DSL：

```js
{
  cardId: "b_9.webp",
  cardType: 0,
  playCost: { credits: 2 },
  playQueue: [
    { id: "b9-expand-scan", kind: "expand", type: "expand_scan_action", args: { skipBaseCost: true }, source: "card", costPolicy: "card_paid" },
    { id: "b9-any-sector", kind: "choice", type: "any_sector_scan", args: { gainData: true }, source: "card", costPolicy: "card_paid", produces: ["signalMarked"] }
  ]
}
```

注意：`expand_scan_action` 展开后会出现公共牌区扫描等节点，但仍属于本次打牌效果队列。扇区完成检查在全部展开节点和额外扫描都完成后执行。

### 例 3：触发型任务

人工描述：

```text
1 型。到达非地球星球时，选择 1 能量 / 1 数据 / 免费移动 1。三个都完成后移除。
```

DSL：

```js
{
  cardId: "b_2.webp",
  cardType: 1,
  playCost: { credits: 1 },
  triggers: [
    {
      index: 1,
      id: "b2-energy",
      event: { type: "visitPlanet", excludePlanetIds: ["earth"] },
      timing: "on_event_completed",
      optional: true,
      rewardQueue: [{ kind: "auto", type: "gain_resources", args: { energy: 1 } }]
    },
    {
      index: 2,
      id: "b2-data",
      event: { type: "visitPlanet", excludePlanetIds: ["earth"] },
      timing: "on_event_completed",
      optional: true,
      rewardQueue: [{ kind: "auto", type: "gain_data", args: { count: 1 } }]
    },
    {
      index: 3,
      id: "b2-move",
      event: { type: "visitPlanet", excludePlanetIds: ["earth"] },
      timing: "on_event_completed",
      optional: true,
      rewardQueue: [{ kind: "choice", type: "move", args: { movementPoints: 1, skipCost: true }, source: "card" }]
    }
  ]
}
```

## 常见错误与修正

| 错误 | 结果 | 正确写法 |
| --- | --- | --- |
| 固定扫描只写 `scan_nebula`，实现不推进 | 可以反复点同一效果 | `kind: "auto"`，成功后完成当前节点。 |
| 卡牌写“扫描行动”但未声明免费 | 重复扣扫描主行动费用 | `expand_scan_action({ skipBaseCost: true })`。 |
| 公共牌扫描缺少 `fromEffectFlow` | 选择后不能回到效果队列 | `kind: "choice"` 并保留 effect flow 上下文。 |
| 单个扫描后立刻结算扇区 | 任务和扇区奖励提前触发 | 只在 `after_main_effect_queue` 检查。 |
| 2 型任务满足后自动领奖 | 玩家无法选择确认时机 | `ui.confirmRequired: true`，任务区高亮。 |
| 1 型任务写成状态条件 | 触发时机不对 | 使用 `event` + `timing: "on_event_completed"`。 |

## agent 输出格式建议

转换时建议输出三段：

1. `normalized_dsl`：标准 DSL。
2. `assumptions`：从人工描述推断的规则。
3. `questions`：缺失且不能安全推断的问题。

若 `questions` 非空，不应直接进入实现；可以先生成草案，但必须标记为 `blocked_for_confirmation`。
