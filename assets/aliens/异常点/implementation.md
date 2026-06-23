# 异常点实现说明

机制来源：`face_detail.md`。通用外星人生命周期见 `docs/alien-design.md`。

## 机制入口

- 代码入口：`randomizer/game/aliens/yichangdian.js`。
- 状态挂载：`alienGameState.yichangdian`。
- 主要字段：`revealedSlotId`、`revealEarthX`、`anomalies[]`、`nextAnomalySectorX`、`traceSlotsByAlienSlotId`、`displayedCardIndex`、`cardDeck`。

## 揭示与异常标记

- 揭示时读取当前地球 `x` 为 `m`。
- 在 `m`、`m-3`、`m+3` 的 `y=4` 扇区生成 a/b/c 三个异常标记，各随机 1/2 面。
- 异常标记素材直接使用 `assets/aliens/异常点/a_1.png`、`a_2.png`、`b_1.png`、`b_2.png`、`c_1.png`、`c_2.png`。
- 太阳系旋转后若地球 `x` 命中异常扇区，按该异常颜色取异常点正面痕迹中最靠上的玩家结算奖励。
- 揭示初始化包含随机异常面和牌堆状态，属于不可逆边界。

## 正面痕迹

- 揭示后不迁移普通三色首痕迹到正面，而是切到正面 3x5 痕迹格。
- 2-5 号位单占用。
- 1 号位为数组，可无限追加；后追加 token 按当前 token 宽度半径向上推算，并视为更靠上。
- 1 号位放置热区向上扩展，避免追加时必须精确点击已放 token。
- 坐标定义在 `randomizer/game/aliens/placement.js` 的异常点相关常量。

## 异常点牌

- 揭示后面板下方展示一张异常点牌。
- 揭示时，玩家在该外星人 state 面板拥有几个首痕迹，就自动从异常点牌堆获得几张异常点牌到手牌。
- 痕迹奖励产生“外星人牌”时，可确认拿展示牌、盲抽异常点牌或取消。
- 异常点牌进入手牌，并保留 `set: "alien:异常点"`、`yichangdianCard`、`price`、`cardTypeCode`、`discardActionCode`、`scanActionCode`、`incomeCode`；其它外星牌模块不能只凭裸 `alienCardId` 把它识别成自己的牌。
- 打牌效果由 `randomizer/game/cards/effects.js` 中 `yichangdian_0.webp` 到 `yichangdian_9.webp` 模型驱动。
- 拿展示牌后翻新展示牌、盲抽牌都属于不可逆屏障。

## 调试

- 调试按钮「异常点调试」强制在外星人 1 展示异常点。
- 调试揭示会生成三个异常标记，不预放痕迹 token，并自动开启「获取外星人标记」。
- 调试会给当前玩家补齐全部 10 张异常点牌到手牌；玩家仍需手动打出后触发效果或进入保留牌区，已存在的牌不重复发放。
- 正面痕迹放置按正式规则结算奖励。
