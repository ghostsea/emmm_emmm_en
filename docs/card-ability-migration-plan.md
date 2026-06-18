# 卡牌能力迁移与当前落地计划

本文档面向当前浏览器原型的基础卡能力迁移。当前 `b_1.webp` 到 `b_70.webp` 的效果语义以 `D:\code\ender_seti\seti` 参考实现为准，不再从卡图重新推断。

本仓库的 `assets/cards/card_model.csv` 仍保留资产编号、费用、角标和当前切图元数据；当 CSV 的 `card_type_code` 与参考实现行为冲突时，运行时以 `randomizer/game/cards/effects.js` 中的迁移模型 `cardType` 为准。

## 1. 迁移入口

当前核心落点：

- `CARD_REFERENCE_MAP`：固化 `b_N.webp -> ender_seti base card id` 映射，来源是参考项目 `packages/common/src/data/baseCards.ts` 的 `position.src,row,col` 顺序。
- `MODELS`：已可执行或部分可执行的当前 DSL 模型，每个模型都带 `source.referenceId`、`source.referenceName`、`source.className`。
- `DEFERRED_CARD_MODELS`：因当前原型缺独立能力而遗留的卡牌；记录参考类、原因和缺失能力。
- `getRuntimeCardTypeCode(card, fallback)`：打牌时优先使用迁移模型类型，避免把参考实现中的即时牌误放进任务区。

状态含义：

| 状态 | 含义 |
| --- | --- |
| `implemented` | 当前浏览器原型可以完整执行本轮迁移范围内的参考效果。 |
| `partial` | 已迁移可执行的打出效果，但参考实现仍有明确遗留部分，当前主要是终局计分。 |
| `deferred` | 参考实现需要当前原型尚未定义的能力；本轮不猜测、不降级实现。 |

## 2. 当前覆盖

截至本次迁移：

- `implemented`：29 张。
- `partial`：6 张。
- `deferred`：35 张。
- `b_1.webp` 到 `b_70.webp` 均已有参考映射，且均处于以上三种状态之一。

| 当前卡牌 | 参考实现 | 状态 | 说明 |
| --- | --- | --- | --- |
| b_1.webp | 39 61 Virginis Observation | implemented | implemented |
| b_2.webp | 128 Advanced Navigation System | implemented | implemented |
| b_3.webp | 136 Algonquin Radio Observatory | implemented | implemented |
| b_4.webp | 64 ALICE | implemented | implemented |
| b_5.webp | 45 Allen Telescope Array | implemented | implemented |
| b_6.webp | 46 ALMA Observatory | implemented | implemented |
| b_7.webp | 122 Amateur Astronomers | implemented | implemented |
| b_8.webp | 97 Apollo 11 Mission | implemented | implemented |
| b_9.webp | 55 Arecibo Observatory | implemented | implemented |
| b_10.webp | 129 Asteroids Research | implemented | implemented |
| b_11.webp | 123 Asteroids Flyby | implemented | 1移动；若本次移动访问小行星，获得1数据 |
| b_12.webp | 70 ATLAS | implemented | 蓝色科技；拥有3个蓝色外星人标记任务奖励3分1数据 |
| b_13.webp | 15 Atmospheric Entry | deferred | select_own_orbiter, remove_planet_marker |
| b_14.webp | 38 Barnard's Star Observation | partial | end_game_scoring |
| b_15.webp | 43 Beta Pictoris Observation | implemented | implemented |
| b_16.webp | 56 Breakthrough Listen | implemented | 1移动；蓝色扇区扫描 |
| b_17.webp | 48 Breakthrough Starshot | implemented | 1移动；红色扇区扫描 |
| b_18.webp | 49 Breakthrough Watch | implemented | 1移动；红色扇区扫描；3紫科技任务奖励1数据 |
| b_19.webp | 115 Canadian Hydrogen Telescope | implemented | 任意扇区扫描；3紫科技任务奖励1数据 |
| b_20.webp | 80 Cape Canaveral SFS | implemented | 3次发射触发，每次奖励1免费移动 |
| b_21.webp | 8 Cassini Probe | implemented | 发射；精选1张；土星环绕/登陆任务奖励6分1宣传 |
| b_22.webp | 88 Chandra Space Observatory | partial | 任务条件已实现；打出效果 probe_sector_scan deferred |
| b_23.webp | 73 Clean Space Initiative | implemented | 按本仓库 cards.md：盲抽并立刻结算左上角角标3次 |
| b_24.webp | 124 Cometary Encounter | implemented | 2次免费移动；本次卡牌流程访问彗星时奖励4分且只触发一次 |
| b_25.webp | 116 Control Center | implemented | 黄色/红色/蓝色扇区扫描触发1免费移动 |
| b_26.webp | 138 Cornell University | deferred | card_corner_event_condition |
| b_27.webp | 98 Coronal Spectrograph | deferred | restricted_alien_trace_target |
| b_28.webp | 53 Deep Synoptic Array | deferred | scan_result_bonus |
| b_29.webp | 16 Dragonfly | deferred | card_land_effect, duplicate_landing_override |
| b_30.webp | 68 DUNE | partial | end_game_scoring |
| b_31.webp | 57 Effelsberg Telescope Construction | implemented | implemented |
| b_32.webp | 99 Electron Microscope | deferred | restricted_alien_trace_target |
| b_33.webp | 126 Euclid Telescope Construction | partial | end_game_scoring |
| b_34.webp | 12 Europa Clipper | deferred | card_land_effect, end_game_scoring |
| b_35.webp | 100 Exascale Supercomputer | deferred | restricted_alien_trace_target |
| b_36.webp | 75 Extremophiles Study | deferred | alien_trace_result_bonus |
| b_37.webp | 9 Falcon Heavy | deferred | multi_launch, temporary_probe_limit_override |
| b_38.webp | 65 FAST Telescope Construction | implemented | implemented |
| b_39.webp | 107 First Black Hole Photo | deferred | trace_event_condition |
| b_40.webp | 71 Focused Research | deferred | tech_result_bonus |
| b_41.webp | 90 Fuel Tanks Construction | deferred | hand_income_count |
| b_42.webp | 91 Fusion Reactor | deferred | tucked_income_count, move_played_card_to_income |
| b_43.webp | 121 Future Circular Collider | implemented | implemented |
| b_44.webp | 4 Galileo Mission | deferred | specific_planet_visit_condition |
| b_45.webp | 86 Giant Magellan Telescope | partial | end_game_scoring |
| b_46.webp | 66 GMRT Telescope Construction | deferred | trace_count_condition |
| b_47.webp | 93 Government Funding | deferred | tucked_income_count, move_played_card_to_income |
| b_48.webp | 11 Grant | deferred | reveal_drawn_card, apply_corner_reward |
| b_49.webp | 19 Gravitational Slingshot | deferred | card_turn_effects, optional_visit_replacement |
| b_50.webp | 30 Great Observatories Project | deferred | probe_sector_scan |
| b_51.webp | 105 Green Bank Telescope | deferred | resource_threshold_condition |
| b_52.webp | 18 Hayabusa | deferred | probe_location_condition |
| b_53.webp | 134 Herschel Space Observatory | deferred | probe_sector_scan, same_sector_card_condition |
| b_54.webp | 27 Hubble Space Telescope | deferred | probe_sector_scan |
| b_55.webp | 81 International Collaboration | deferred | tech_researched_by_others_filter |
| b_56.webp | 59 Ion Propulsion System | implemented | implemented |
| b_57.webp | 79 ISS | deferred | launch_event_condition |
| b_58.webp | 29 James Webb Space Telescope | deferred | probe_sector_scan |
| b_59.webp | 82 Johnson Space Center | deferred | orbit_or_land_condition |
| b_60.webp | 6 Juno Probe | deferred | orbit_or_land_condition |
| b_61.webp | 35 Jupiter Exploration Program | deferred | planet_sector_scan, orbit_or_land_condition |
| b_62.webp | 23 Jupiter Flyby | deferred | specific_planet_visit_after_move |
| b_63.webp | 40 Kepler 22 Observation | partial | end_game_scoring |
| b_64.webp | 28 Kepler Space Telescope | deferred | probe_sector_scan |
| b_65.webp | 69 Large Hadron Collider | implemented | implemented |
| b_66.webp | 25 Lightsail | deferred | card_turn_effects |
| b_67.webp | 102 Linguistic Analysis | deferred | single_alien_trace_set_condition |
| b_68.webp | 51 Lovell Telescope | deferred | resource_threshold_condition |
| b_69.webp | 130 Low-Cost Space Launch | implemented | implemented |
| b_70.webp | 109 Low-Power Microprocessors | implemented | implemented |

## 3. 已接入的原语

本轮只复用当前浏览器原型已经存在的执行器：

| 原语 | 当前映射 |
| --- | --- |
| 固定星云扫描 | `card_scan_nebula` |
| 颜色二选一扫描 | `card_scan_color_choice` |
| 任意扇区扫描 | `card_any_sector_scan` |
| 公共牌区扫描 | `card_public_scan` |
| 抽后扫描 | `card_draw_then_scan` |
| 抽后角标 | `card_draw_then_discard_action` |
| 扫描行动展开 | `card_scan_action` |
| 科技 | `card_research_tech` |
| 卡牌移动 | `card_move` |
| 资源/分数 | `gain_resources` |
| 数据 | `gain_data` |
| 盲抽 | `draw_cards` |
| 精选 | `pick_card` |
| 发射 | `launch` |

本轮还把任务条件扩展到：`completedSectorsByColor` 支持 `yellow`、`red`、`blue`、`black` 和 `any`；`traceCount` 支持外星人痕迹数量；`techCount` 支持按科技颜色统计；`planetOrbitOrLand` 支持指定星球环绕/登陆；`distinctSignalSectors` 支持统计玩家已有信号的不同具名扇区。`b_23.webp` 当前按 `assets/cards/cards.md` 的描述实现为“盲抽3次并结算抽到牌左上角角标”，与参考类 `CleanSpaceInitiativeCard` 的公共牌行处理存在刻意差异。

左上角 `discard_action_code` 的手牌快速行动支持 0 / 1 / 2 / 3 / 4 / 5：资源角标直接弃牌结算资源/数据/分数，移动角标先弃牌结算，再进入一次免费移动选择。默认手牌不做“可用/不可用”高亮，只在玩家点击选中某张牌后显示手牌区上方确认按钮并高亮该牌。

## 4. 遗留能力归类

优先补这些能力可以释放最多 deferred 卡牌：

| 缺口 | 影响 |
| --- | --- |
| `card_turn_effects` | 光帆等需要记录整个回合内多次/可选访问事件的牌。 |
| `specific_planet_visit_after_move` | 木星飞掠等需要限定本卡移动访问某个具体行星的牌。 |
| `orbit_or_land_condition` / `card_land_effect` | 探测器、登陆、环绕类任务。 |
| `probe_sector_scan` / `planet_sector_scan` | 探测器所在扇区、行星所在扇区扫描。 |
| `restricted_alien_trace_target` | 外星人痕迹同色/同外星人限制。 |
| `tech_result_bonus` | 科技选择后置奖励。 |
| `end_game_scoring` | 3 型终局计分实际结算。 |
| `move_played_card_to_income` / income count | 建造燃料箱、聚变反应堆、政府资助。 |

## 5. 验证

当前无 `package.json` 测试入口，直接运行：

```powershell
node randomizer/game/cards/effects.test.js
node randomizer/game/cards/deck.test.js
node randomizer/game/basic-cards.test.js
node --check randomizer/app.js
```
