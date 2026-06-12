# SETI 效果术语表

| 名称 | 效果 | 是否可撤销 | 图标 |
| --- | --- | --- | --- |
| 扫描行动 | 执行一次主要扫描行动，并继续触发该行动后续的扫描相关效果。 | 行动开始后，已结算的可撤销效果可撤销；出现不可撤销效果后不可撤销主行动。 | `assets/symbol/effect/scan_action.webp` |
| 支付扫描费用 | 支付 1 信用点 + 2 能量，作为扫描行动的第一个效果。 | 可撤销 | `assets/symbol/action/scan/earth_scan.png` |
| 扇区扫描 | 扫描指定扇区内可获得数据的星云。 | 可撤销 | `assets/symbol/action/scan/earth_scan.png` |
| 强化扇区扫描 | 紫1扫描效果：在地球所在扇区及相邻扇区中选择一个扇区扫描。 | 可撤销 | `assets/symbol/action/scan/earth_scan_improved.png` |
| 固定星球扇区扫描 | 扫描指定星球当前所在扇区；按钮附带星球名文字角标，如“水星”“火星”。 | 可撤销 | `assets/symbol/effect/normal_scan.webp` |
| 水星扇区扫描 | 紫2扫描效果：扫描水星当前所在扇区。 | 可撤销 | `assets/symbol/action/scan/mercury_scan.png` |
| 黑色二选一扫描 | 在织女一 / 绘架座β中选择一个星云扫描。 | 可撤销 | `assets/symbol/effect/black_scan.webp` |
| 红色星云扫描 | 在两个红色星云中选择一个星云扫描。 | 可撤销 | `assets/symbol/effect/red_scan.webp` |
| 蓝色星云扫描 | 在两个蓝色星云中选择一个星云扫描。 | 可撤销 | `assets/symbol/effect/blue_scan.webp` |
| 黄色星云扫描 | 在两个黄色星云中选择一个星云扫描。 | 可撤销 | `assets/symbol/effect/yellow_scan.webp` |
| 公共牌区扫描 | 弃除公共牌区中的一张牌，并按该牌角标选择星云扫描。 | 可撤销 | `assets/symbol/action/scan/public_card_scan.webp` |
| 手牌扫描 | 弃除一张手牌，并按该牌角标选择星云扫描。 | 可撤销 | `assets/symbol/action/scan/private_card_scan.webp` |
| 紫4 | 紫4扫描效果：选择发射或移动；发射消耗 1 能量，移动免费。 | 可撤销 | `assets/symbol/action/scan/scan_action_4.png` |
| 选择科技片 | 支付 6 宣传，拿取科技片并放置到玩家版图；不触发旋转、科技自身效果或 bonus。 | 可撤销 | `assets/symbol/effect/research_tech.webp` |
| 旋转 | 研究科技后旋转太阳系。 | 不可撤销 | `assets/core/rotate.png` |
| 科技自身效果 | 结算科技片自身即时效果；当前主要是橙1免费发射。 | 不可撤销 | `assets/symbol/effect/research_tech.webp` |
| 科技 bonus | 结算科技片对应 bonus；首拿同类科技的 +2 分归入此效果。 | 不可撤销；若是精选，确认拿牌后不可撤销。 | 对应 bonus 图标 |
| 弃牌 | 从手牌或公共牌区移除一张牌，通常作为扫描、收入或其他效果的前置选择。 | 取决于所属效果；扫描类弃牌可撤销，精选拿牌后不可撤销。 | `assets/symbol/effect/discard.jpg` |
| 盲抽 | 从牌库随机抽取指定数量卡牌加入手牌。 | 不可撤销 | `assets/symbol/effect/blind_card.webp` |
| 精选 | 从公共牌区选择 1 张卡牌加入手牌。 | 确认拿牌后不可撤销；取消选择前不结算。 | `assets/symbol/effect/choose_card.webp` |
| 收入 | 弃 1 张手牌，并按该牌收入角标增加玩家收入。 | 可撤销，除非发生在已进入不可撤销阶段之后。 | `assets/symbol/effect/income.webp` |
| 分数 | 增加玩家分数。 | 通常可撤销；科技 bonus 阶段不可撤销。 | `assets/symbol/effect/score.webp` |
| 信用点 | 增加玩家信用点。 | 通常可撤销；科技 bonus 阶段不可撤销。 | `assets/symbol/effect/credits.webp` |
| 能量 | 增加玩家能量。 | 通常可撤销；科技 bonus 阶段不可撤销。 | `assets/symbol/effect/energy.webp` |
| 宣传 | 增加玩家宣传，受宣传上限限制。 | 通常可撤销；科技 bonus 阶段不可撤销。 | `assets/symbol/effect/publicity.webp` |
| 数据 | 获得指定数量数据，进入玩家数据池；数据池满时改为弃置计数。 | 可撤销 | `assets/symbol/effect/data.webp` |
| 移动 | 给予火箭一点移动力。如果没有橙2科技，移动出小行星需要 2 点移动力，其余场景均为 1 点。 | 可撤销，紫4移动也可撤销。 | `assets/symbol/effect/movement.webp` |
| 额外弃牌扫描 | 获得该功能标记时，为资源记录；当使用扫描行动中的公共牌区扫描时，可额外使用该标记来额外弃除公共牌区增加扫描的扇区。 | 资源获得可撤销；使用后的公共牌区扫描按扫描效果撤销。 | `assets/tokens/additional_public_scan.webp` |
| 任意外星人标记 | 玩家选择外星人槽位，并在黄色、粉色、蓝色痕迹中任选一种放置标记。 | 可撤销，若触发揭示会一并恢复。 | `assets/symbol/effect/alien_any.webp` |
| 黄色外星人标记 | 玩家选择外星人槽位，放置黄色痕迹标记。 | 可撤销，若触发揭示会一并恢复。 | `assets/symbol/effect/alien_yellow.webp` |
| 粉色外星人标记 | 玩家选择外星人槽位，放置粉色痕迹标记。 | 可撤销，若触发揭示会一并恢复。 | `assets/symbol/effect/alien_pink.webp` |
| 蓝色外星人标记 | 玩家选择外星人槽位，放置蓝色痕迹标记。 | 可撤销，若触发揭示会一并恢复。 | `assets/symbol/effect/alien_blue.webp` |

## 回合相关说明

- 主要行动包括发射、环绕、登陆、扫描、分析、科技、打牌。PASS 属于后续轮次机制，本次暂不实现。
- 每个回合只能开始一次主要行动。主要行动及其效果全部结算后，可以继续执行次要行动，然后点击“回合结束”。
- 次要行动包括资源转换、`3 宣传 -> 精选 1 张公共牌`、移动火箭、放置数据。次要行动每回合次数不限。
