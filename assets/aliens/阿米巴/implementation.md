# 阿米巴实现说明

机制来源：`face_detail.md`。通用外星人生命周期见 `docs/alien-design.md`。

## 机制入口

- 代码入口：`randomizer/game/aliens/amiba.js`。
- 状态挂载：`alienGameState.amiba`。
- 主要字段：`revealedSlotId`、`traceSlotsByAlienSlotId`、`symbolSlots`、`symbolsById`、`cardDeck`、`displayedCardIndex`。

## 正面痕迹

- 揭示后使用正面 3x4 痕迹格：粉/黄/蓝各 1-4 号位。
- 所有格位均为单占用。
- 粉色痕迹结算红色区域；黄色痕迹结算橙色区域；蓝色痕迹结算蓝色区域。
- 2/4 号位额外得 1 分；3/4 号位额外获得 1 张阿米巴牌。
- 默认坐标定义在 `AMIBA_TRACE_MARKER_SLOTS`。

## Symbol 系统

- 上方面板有 9 个 symbol 位。
- 外圈按顺时针命名：`orange_1`、`orange_2`、`blue_1`、`blue_2`、`red_1`、`red_2`。
- 内圈按顺时针命名：`orange_3`、`blue_3`、`red_3`。
- 揭示时 5 个 symbol 随机放在 `orange_1`、`orange_2`、`blue_3`、`red_1`、`red_2`。
- 结算某个 symbol 后，外圈顺时针、内圈逆时针移动到下一个空位。
- `symbol_1` 奖励为 1 宣传。
- `symbol_2` 奖励为 1 数据。
- `symbol_3` 奖励为 4 分。
- `symbol_4` 奖励为 1 盲抽。
- `symbol_5` 奖励为 2 分。
- 区域奖励按区域内已占用 symbol 的顺序逐个结算并移动 symbol。
- 默认坐标定义在 `AMIBA_SYMBOL_MARKER_SLOTS`，symbol 默认显示倍率为 `AMIBA_SYMBOL_DISPLAY_SCALE`。
- 揭示时随机 symbol 初始化属于不可逆边界；单次 symbol 移动本身是确定性结算，应使用快照撤销。

## 阿米巴牌

- 由 `assets/aliens/阿米巴/card_model.csv` 建模，图片为 `assets/aliens/阿米巴/cards/0.webp`-`9.webp`。
- 揭示时，玩家在该外星人 state 面板拥有几个首痕迹，就自动从阿米巴牌堆获得几张阿米巴牌到手牌。
- 0/3/4/5/6/7/8/9 号牌效果进入效果队列。
- 1 型任务通过打出科技或外星人痕迹事件触发。
- 5/6/7 号 3 型牌分别按粉/黄/蓝阿米巴痕迹实时终局计分。
- 8 号 2 型牌要求玩家已有粉/黄/蓝各至少 1 个阿米巴痕迹，判定合并揭示前 state 首痕迹、state 额外痕迹和揭示后的阿米巴正面痕迹；完成后按阿米巴正面空痕迹位数量得分。
- 获得阿米巴牌时，可拿展示牌、盲抽或取消；拿展示牌后翻新展示牌、盲抽属于不可逆屏障。

## 调试

- 调试按钮「阿米巴调试」强制在外星人 1 展示阿米巴。
- 调试按揭示阶段默认放置 5 个 symbol，不预放痕迹 token，并自动开启「获取外星人标记」。
- 调试会给当前玩家补齐全部 10 张阿米巴牌到手牌；玩家仍需手动打出后触发效果或进入保留牌区，已存在的牌不重复发放。
- 调试信息会输出每个痕迹位和 symbol 位的当前坐标。
- 坐标覆盖读取入口：`window.SetiRandomizer.getAmibaTraceLayoutOverrides()` / `window.SetiRandomizer.getAmibaSymbolLayoutOverrides()`。
- 默认不再开启拖动校准。
