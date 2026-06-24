(function (root, factory) {
  "use strict";

  const api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.SetiCardEffects = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function () {
  "use strict";

  const EFFECT_TYPES = Object.freeze({
    SCAN_NEBULA: "card_scan_nebula",
    SCAN_COLOR_CHOICE: "card_scan_color_choice",
    PUBLIC_SCAN: "card_public_scan",
    ANY_SECTOR_SCAN: "card_any_sector_scan",
    SCAN_ACTION: "card_scan_action",
    RESEARCH_TECH: "card_research_tech",
    CARD_ORBIT: "card_orbit",
    CARD_LAND: "card_land",
    REMOVE_PLANET_MARKER: "card_remove_planet_marker",
    PROBE_SECTOR_SCAN: "card_probe_sector_scan",
    PLANET_SECTOR_SCAN: "card_planet_sector_scan",
    SECTOR_X_SCAN: "card_sector_x_scan",
    COUNT_HAND_INCOME_RESOURCE: "card_count_hand_income_resource",
    COUNT_CURRENT_INCOME_RESOURCE: "card_count_current_income_resource",
    COUNT_ALIENS_RESOURCE: "card_count_aliens_resource",
    TUCK_PLAYED_CARD_TO_INCOME: "card_tuck_played_card_to_income",
    PICK_CARD_CORNER_REWARD: "card_pick_card_corner_reward",
    REGISTER_EVENT_BONUS: "card_register_event_bonus",
    FREE_MOVE: "card_free_move",
    CARD_MOVE: "card_move",
    DRAW_THEN_SCAN: "card_draw_then_scan",
    DRAW_THEN_DISCARD_ACTION: "card_draw_then_discard_action",
    CARD_CORNER_EVENT_REWARD: "card_corner_event_reward",
    CONDITIONAL_REWARD: "card_conditional_reward",
    OPTIONAL_DISCARD_SCAN: "card_optional_discard_scan",
    HAND_SCAN: "card_hand_scan",
    COUNT_HAND_CORNER_MOVE: "card_count_hand_corner_move",
    CHOOSE_HAND_CORNER_REWARD: "card_choose_hand_corner_reward",
    RETURN_PLAYED_CARD_TO_HAND_IF: "card_return_played_card_to_hand_if",
    LANDING_SECTOR_SCAN: "card_landing_sector_scan",
    CONDITIONAL_SECTOR_SCAN: "card_conditional_sector_scan",
    DISCARD_ANY_FOR_INCOME: "card_discard_any_for_income",
    PAY_CREDITS_FOR_REWARD: "card_pay_credits_for_reward",
    DISCARD_CARD_CORNER_REPEAT: "card_discard_card_corner_repeat",
    REMOVE_ORBIT_TO_PROBE: "card_remove_orbit_to_probe",
    RETURN_UNFINISHED_TASK_TO_HAND: "card_return_unfinished_task_to_hand",
    COUNT_TECH_TYPES_REWARD: "card_count_tech_types_reward",
    COUNT_OWNED_TECH_REWARD: "card_count_owned_tech_reward",
    COUNT_ROCKETS_REWARD: "card_count_rockets_reward",
    DISCARD_ALL_HAND: "card_discard_all_hand",
    PROBE_STACK_REWARD: "card_probe_stack_reward",
    PROBE_LOCATION_REWARD: "card_probe_location_reward",
    EARTH_SECTOR_CONTENT_MOVE: "card_earth_sector_content_move",
    PLUTO_RESERVE: "card_pluto_reserve",
    YICHANGDIAN_NEXT_ANOMALY_REWARD: "yichangdian_next_anomaly_reward",
    YICHANGDIAN_ANOMALY_SIGNAL_SCORE: "yichangdian_anomaly_signal_score",
    YICHANGDIAN_ALIEN_TRACE: "yichangdian_alien_trace",
    YICHANGDIAN_PUBLIC_ALL: "yichangdian_public_all",
    YICHANGDIAN_DRAW_THEN_TWO_CORNERS: "yichangdian_draw_then_two_corners",
    YICHANGDIAN_NEXT_ANOMALY_SCAN: "yichangdian_next_anomaly_scan",
    YICHANGDIAN_LAUNCH_ANOMALY_MOVE: "yichangdian_launch_anomaly_move",
  });

  const REWARD_TYPES = Object.freeze({
    GAIN_RESOURCES: "gain_resources",
    GAIN_DATA: "gain_data",
    DRAW_CARDS: "draw_cards",
    LAUNCH: "launch",
    PICK_CARD: "pick_card",
    ALIEN_TRACE: "alien_trace",
  });

  const NEBULA_IDS_BY_COLOR = Object.freeze({
    yellow: Object.freeze(["sector-4-a", "sector-3-a"]),
    red: Object.freeze(["sector-2-b", "sector-3-b"]),
    blue: Object.freeze(["sector-2-a", "sector-1-a"]),
    black: Object.freeze(["sector-1-b", "sector-4-b"]),
  });
  const ROCKET_REWARD_SOLAR_SURFACE = "solar-board";
  const ROCKET_REWARD_STANDARD_KIND = "standard";

  let endGameScoringModule = null;
  let yichangdianModule = null;
  let aomomoModule = null;

  function getEndGameScoring() {
    if (endGameScoringModule) return endGameScoringModule;
    if (typeof globalThis !== "undefined" && globalThis.SetiEndGameScoring) {
      endGameScoringModule = globalThis.SetiEndGameScoring;
      return endGameScoringModule;
    }
    if (typeof require === "function") {
      try {
        endGameScoringModule = require("../end-game-scoring");
        return endGameScoringModule;
      } catch (error) {
        return null;
      }
    }
    return null;
  }

  function getYichangdian() {
    if (yichangdianModule) return yichangdianModule;
    if (typeof globalThis !== "undefined" && globalThis.SetiAlienYichangdian) {
      yichangdianModule = globalThis.SetiAlienYichangdian;
      return yichangdianModule;
    }
    if (typeof require === "function") {
      try {
        yichangdianModule = require("../aliens/yichangdian");
        return yichangdianModule;
      } catch (error) {
        return null;
      }
    }
    return null;
  }

  function getAomomo() {
    if (aomomoModule) return aomomoModule;
    if (typeof globalThis !== "undefined" && globalThis.SetiAlienAomomo) {
      aomomoModule = globalThis.SetiAlienAomomo;
      return aomomoModule;
    }
    if (typeof require === "function") {
      try {
        aomomoModule = require("../aliens/aomomo");
        return aomomoModule;
      } catch (error) {
        return null;
      }
    }
    return null;
  }

  function source(referenceId, referenceName, className, sourceKind = "bespoke") {
    return Object.freeze({ referenceId, referenceName, className, sourceKind });
  }

  const CARD_REFERENCE_MAP = Object.freeze({
    "b_1.webp": source("39", "61 Virginis Observation", "ObservationQuickMissionCard"),
    "b_2.webp": source("128", "Advanced Navigation System", "AdvancedNavigationSystem"),
    "b_3.webp": source("136", "Algonquin Radio Observatory", "AlgonquinRadioObservatoryCard"),
    "b_4.webp": source("64", "ALICE", "Alice"),
    "b_5.webp": source("45", "Allen Telescope Array", "AllenTelescopeArrayCard"),
    "b_6.webp": source("46", "ALMA Observatory", "AlmaObservatoryCard"),
    "b_7.webp": source("122", "Amateur Astronomers", "AmateurAstronomersCard"),
    "b_8.webp": source("97", "Apollo 11 Mission", "Apollo11Mission"),
    "b_9.webp": source("55", "Arecibo Observatory", "AreciboObservatoryCard"),
    "b_10.webp": source("129", "Asteroids Research", "AsteroidsResearch"),
    "b_11.webp": source("123", "Asteroids Flyby", "AsteroidsFlybyCard"),
    "b_12.webp": source("70", "ATLAS", "Atlas"),
    "b_13.webp": source("15", "Atmospheric Entry", "AtmosphericEntryCard"),
    "b_14.webp": source("38", "Barnard's Star Observation", "BarnardsStarObservationCard"),
    "b_15.webp": source("43", "Beta Pictoris Observation", "ObservationQuickMissionCard"),
    "b_16.webp": source("56", "Breakthrough Listen", "GenericImmediateCard", "generic"),
    "b_17.webp": source("48", "Breakthrough Starshot", "GenericImmediateCard", "generic"),
    "b_18.webp": source("49", "Breakthrough Watch", "GenericImmediateCard", "generic"),
    "b_19.webp": source("115", "Canadian Hydrogen Telescope", "AnySignalQuickMissionCard"),
    "b_20.webp": source("80", "Cape Canaveral SFS", "GenericMissionCard", "generic"),
    "b_21.webp": source("8", "Cassini Probe", "CassiniProbe"),
    "b_22.webp": source("88", "Chandra Space Observatory", "AnySignalQuickMissionCard"),
    "b_23.webp": source("73", "Clean Space Initiative", "CleanSpaceInitiativeCard"),
    "b_24.webp": source("124", "Cometary Encounter", "CometaryEncounterCard"),
    "b_25.webp": source("116", "Control Center", "GenericMissionCard", "generic"),
    "b_26.webp": source("138", "Cornell University", "CornellUniversity"),
    "b_27.webp": source("98", "Coronal Spectrograph", "CoronalSpectrographCard"),
    "b_28.webp": source("53", "Deep Synoptic Array", "DeepSynopticArrayCard"),
    "b_29.webp": source("16", "Dragonfly", "Dragonfly"),
    "b_30.webp": source("68", "DUNE", "GenericEndGameCard", "generic"),
    "b_31.webp": source("57", "Effelsberg Telescope Construction", "GenericImmediateCard", "generic"),
    "b_32.webp": source("99", "Electron Microscope", "ElectronMicroscopeCard"),
    "b_33.webp": source("126", "Euclid Telescope Construction", "EuclidTelescopeConstructionCard"),
    "b_34.webp": source("12", "Europa Clipper", "EuropaClipperCard"),
    "b_35.webp": source("100", "Exascale Supercomputer", "ExascaleSupercomputerCard"),
    "b_36.webp": source("75", "Extremophiles Study", "ExtremophilesStudyCard"),
    "b_37.webp": source("9", "Falcon Heavy", "FalconHeavyCard"),
    "b_38.webp": source("65", "FAST Telescope Construction", "GenericImmediateCard", "generic"),
    "b_39.webp": source("107", "First Black Hole Photo", "GenericMissionCard", "generic"),
    "b_40.webp": source("71", "Focused Research", "FocusedResearchCard"),
    "b_41.webp": source("90", "Fuel Tanks Construction", "FuelTanksConstruction"),
    "b_42.webp": source("91", "Fusion Reactor", "FusionReactor"),
    "b_43.webp": source("121", "Future Circular Collider", "GenericImmediateCard", "generic"),
    "b_44.webp": source("4", "Galileo Mission", "GenericMissionCard", "generic"),
    "b_45.webp": source("86", "Giant Magellan Telescope", "GenericEndGameCard", "generic"),
    "b_46.webp": source("66", "GMRT Telescope Construction", "GmrtTelescope"),
    "b_47.webp": source("93", "Government Funding", "GovernmentFunding"),
    "b_48.webp": source("11", "Grant", "GrantCard"),
    "b_49.webp": source("19", "Gravitational Slingshot", "GravitationalSlingshotCard"),
    "b_50.webp": source("30", "Great Observatories Project", "GreatObservatoriesProjectCard"),
    "b_51.webp": source("105", "Green Bank Telescope", "GreenBankTelescope"),
    "b_52.webp": source("18", "Hayabusa", "HayabusaCard"),
    "b_53.webp": source("134", "Herschel Space Observatory", "HerschelSpaceObservatory"),
    "b_54.webp": source("27", "Hubble Space Telescope", "HubbleSpaceTelescope"),
    "b_55.webp": source("81", "International Collaboration", "InternationalCollaborationCard"),
    "b_56.webp": source("59", "Ion Propulsion System", "GenericImmediateCard", "generic"),
    "b_57.webp": source("79", "ISS", "GenericMissionCard", "generic"),
    "b_58.webp": source("29", "James Webb Space Telescope", "JamesWebbSpaceTelescope"),
    "b_59.webp": source("82", "Johnson Space Center", "GenericMissionCard", "generic"),
    "b_60.webp": source("6", "Juno Probe", "JunoProbe"),
    "b_61.webp": source("35", "Jupiter Exploration Program", "AnySignalQuickMissionCard"),
    "b_62.webp": source("23", "Jupiter Flyby", "JupiterFlybyCard"),
    "b_63.webp": source("40", "Kepler 22 Observation", "Kepler22ObservationCard"),
    "b_64.webp": source("28", "Kepler Space Telescope", "KeplerSpaceTelescope"),
    "b_65.webp": source("69", "Large Hadron Collider", "GenericImmediateCard", "generic"),
    "b_66.webp": source("25", "Lightsail", "LightsailCard"),
    "b_67.webp": source("102", "Linguistic Analysis", "LinguisticAnalysis"),
    "b_68.webp": source("51", "Lovell Telescope", "LovellTelescope"),
    "b_69.webp": source("130", "Low-Cost Space Launch", "GenericImmediateCard", "generic"),
    "b_70.webp": source("109", "Low-Power Microprocessors", "GenericImmediateCard", "generic"),
    "b_71.webp": source("b_71", "水手10号任务", "Cards71Spec", "cards_71"),
    "b_72.webp": source("b_72", "火星探测计划", "Cards71Spec", "cards_71"),
    "b_73.webp": source("b_73", "飞掠火星", "Cards71Spec", "cards_71"),
    "b_74.webp": source("b_74", "火星科学实验室", "Cards71Spec", "cards_71"),
    "b_75.webp": source("b_75", "水星探测计划", "Cards71Spec", "cards_71"),
    "b_76.webp": source("b_76", "飞掠水星", "Cards71Spec", "cards_71"),
    "b_77.webp": source("b_77", "信使号探测器", "Cards71Spec", "cards_71"),
    "b_78.webp": source("b_78", "NASA天体生物学研究所", "Cards71Spec", "cards_71"),
    "b_79.webp": source("b_79", "NASA每日一图", "Cards71Spec", "cards_71"),
    "b_80.webp": source("b_80", "NASA研究中心", "Cards71Spec", "cards_71"),
    "b_81.webp": source("b_81", "近地小行星研究", "Cards71Spec", "cards_71"),
    "b_82.webp": source("b_82", "NEAR 舒梅克号探测器", "Cards71Spec", "cards_71"),
    "b_83.webp": source("b_83", "NASA创新先进概念计划", "Cards71Spec", "cards_71"),
    "b_84.webp": source("b_84", "诺托射电天文台", "Cards71Spec", "cards_71"),
    "b_85.webp": source("b_85", "ODINUS号任务", "Cards71Spec", "cards_71"),
    "b_86.webp": source("b_86", "ALMA Telescope Construction", "Cards71Spec", "cards_71"),
    "b_87.webp": source("b_87", "最佳发射窗口", "Cards71Spec", "cards_71"),
    "b_88.webp": source("b_88", "入轨拉格朗日点", "Cards71Spec", "cards_71"),
    "b_89.webp": source("b_89", "奥西里斯-REx号", "Cards71Spec", "cards_71"),
    "b_90.webp": source("b_90", "帕克斯天文台", "Cards71Spec", "cards_71"),
    "b_91.webp": source("b_91", "毅力号火星车", "Cards71Spec", "cards_71"),
    "b_92.webp": source("b_92", "先驱者11号任务", "Cards71Spec", "cards_71"),
    "b_93.webp": source("b_93", "X射线岩石化学探测仪", "Cards71Spec", "cards_71"),
    "b_94.webp": source("b_94", "行星猎手", "Cards71Spec", "cards_71"),
    "b_95.webp": source("b_95", "行星地质测绘", "Cards71Spec", "cards_71"),
    "b_96.webp": source("b_96", "柏拉图探测器", "Cards71Spec", "cards_71"),
    "b_97.webp": source("b_97", "科学普及", "Cards71Spec", "cards_71"),
    "b_98.webp": source("b_98", "发射前试验", "Cards71Spec", "cards_71"),
    "b_99.webp": source("b_99", "新闻发言", "Cards71Spec", "cards_71"),
    "b_100.webp": source("b_100", "观测南河三", "Cards71Spec", "cards_71"),
    "b_101.webp": source("b_101", "远射计划", "Cards71Spec", "cards_71"),
    "b_102.webp": source("b_102", "观测比邻星", "Cards71Spec", "cards_71"),
    "b_103.webp": source("b_103", "量子计算机", "Cards71Spec", "cards_71"),
    "b_104.webp": source("b_104", "罗曼空间望远镜", "Cards71Spec", "cards_71"),
    "b_105.webp": source("b_105", "罗塞塔号探测器", "Cards71Spec", "cards_71"),
    "b_106.webp": source("b_106", "采样返回", "Cards71Spec", "cards_71"),
    "b_107.webp": source("b_107", "土星探测计划", "Cards71Spec", "cards_71"),
    "b_108.webp": source("b_108", "飞掠土星", "Cards71Spec", "cards_71"),
    "b_109.webp": source("b_109", "科学合作", "Cards71Spec", "cards_71"),
    "b_110.webp": source("b_110", "SETI数据档案", "Cards71Spec", "cards_71"),
    "b_111.webp": source("b_111", "SETI研究所", "Cards71Spec", "cards_71"),
    "b_112.webp": source("b_112", "SETI@Home", "Cards71Spec", "cards_71"),
    "b_113.webp": source("b_113", "夏洛克光谱仪", "Cards71Spec", "cards_71"),
    "b_114.webp": source("b_114", "观测天狼星A", "Cards71Spec", "cards_71"),
    "b_115.webp": source("b_115", "索尔维会议", "Cards71Spec", "cards_71"),
    "b_116.webp": source("b_116", "太空发射系统", "Cards71Spec", "cards_71"),
    "b_117.webp": source("b_117", "航天飞机", "Cards71Spec", "cards_71"),
    "b_118.webp": source("b_118", "平方公里阵", "Cards71Spec", "cards_71"),
    "b_119.webp": source("b_119", "星舰", "Cards71Spec", "cards_71"),
    "b_120.webp": source("b_120", "战略规划", "Cards71Spec", "cards_71"),
    "b_121.webp": source("b_121", "水熊虫研究", "Cards71Spec", "cards_71"),
    "b_122.webp": source("b_122", "望远镜现代化", "Cards71Spec", "cards_71"),
    "b_123.webp": source("b_123", "望远镜时间分配", "Cards71Spec", "cards_71"),
    "b_124.webp": source("b_124", "穿越小行星带", "Cards71Spec", "cards_71"),
    "b_125.webp": source("b_125", "轨道修正", "Cards71Spec", "cards_71"),
    "b_126.webp": source("b_126", "三叉戟号探测器", "Cards71Spec", "cards_71"),
    "b_127.webp": source("b_127", "天王星轨道器与探测器", "Cards71Spec", "cards_71"),
    "b_128.webp": source("b_128", "观测织女星", "Cards71Spec", "cards_71"),
    "b_129.webp": source("b_129", "金星号探测器", "Cards71Spec", "cards_71"),
    "b_130.webp": source("b_130", "金星探测计划", "Cards71Spec", "cards_71"),
    "b_131.webp": source("b_131", "飞掠金星", "Cards71Spec", "cards_71"),
    "b_132.webp": source("b_132", "甚高能辐射成像望远镜", "Cards71Spec", "cards_71"),
    "b_133.webp": source("b_133", "甚大阵", "Cards71Spec", "cards_71"),
    "b_134.webp": source("b_134", "旅行者2号任务", "Cards71Spec", "cards_71"),
    "b_135.webp": source("b_135", "韦斯特博克综合孔径射电望远镜", "Cards71Spec", "cards_71"),
    "b_136.webp": source("b_136", "Wow!讯号", "Cards71Spec", "cards_71"),
    "b_137.webp": source("b_137", "建造叶夫帕托里亚望远镜", "Cards71Spec", "cards_71"),
    "b_138.webp": source("b_138", "月球门户空间站", "Cards71Spec", "cards_71"),
    "b_139.webp": source("b_139", "自2006年起不再是行星", "Cards71Spec", "cards_71"),
    "b_140.webp": source("b_140", "火星轨道门户", "Cards71Spec", "cards_71"),
    "dlc_1.png": source("dlc_1", "可重复使用着陆器", "DlcCardsSpec", "dlc_cards"),
    "dlc_2.png": source("dlc_2", "跟踪与数据中继卫星", "DlcCardsSpec", "dlc_cards"),
    "dlc_3.png": source("dlc_3", "NASA深空网络", "DlcCardsSpec", "dlc_cards"),
    "dlc_4.png": source("dlc_4", "突破讯息", "DlcCardsSpec", "dlc_cards"),
    "dlc_5.png": source("dlc_5", "维护任务", "DlcCardsSpec", "dlc_cards"),
    "dlc_6.png": source("dlc_6", "现场着陆直播", "DlcCardsSpec", "dlc_cards"),
    "dlc_7.png": source("dlc_7", "双探测器", "DlcCardsSpec", "dlc_cards"),
    "dlc_8.png": source("dlc_8", "量子数据存储", "DlcCardsSpec", "dlc_cards"),
    "dlc_9.png": source("dlc_9", "月坑射电望远镜", "DlcCardsSpec", "dlc_cards"),
    "dlc_10.png": source("dlc_10", "太空第一人", "DlcCardsSpec", "dlc_cards"),
    "dlc_11.png": source("dlc_11", "八灵神星探测器", "DlcCardsSpec", "dlc_cards"),
    "dlc_12.png": source("dlc_12", "双行星飞越机动", "DlcCardsSpec", "dlc_cards"),
    "dlc_13.png": source("dlc_13", "詹姆斯·克拉克·麦克斯韦望远镜", "DlcCardsSpec", "dlc_cards"),
    "dlc_14.png": source("dlc_14", "可重复使用火箭", "DlcCardsSpec", "dlc_cards"),
    "dlc_15.png": source("dlc_15", "迭代工程", "DlcCardsSpec", "dlc_cards"),
    "dlc_16.png": source("dlc_16", "宇航员训练体验", "DlcCardsSpec", "dlc_cards"),
    "dlc_17.png": source("dlc_17", "付费媒体报道", "DlcCardsSpec", "dlc_cards"),
    "dlc_18.png": source("dlc_18", "合同研究", "DlcCardsSpec", "dlc_cards"),
    "dlc_19.png": source("dlc_19", "凌日系外行星巡天卫星", "DlcCardsSpec", "dlc_cards"),
    "dlc_20.png": source("dlc_20", "完美执行的项目", "DlcCardsSpec", "dlc_cards"),
    "dlc_21.png": source("dlc_21", "轨道加注", "DlcCardsSpec", "dlc_cards"),
    "dlc_22.png": source("dlc_22", "新任务", "DlcCardsSpec", "dlc_cards"),
    "dlc_23.png": source("dlc_23", "中性浮力训练", "DlcCardsSpec", "dlc_cards"),
    "dlc_24.png": source("dlc_24", "太空电梯", "DlcCardsSpec", "dlc_cards"),
    "dlc_25.png": source("dlc_25", "激光干涉引力波天文台", "DlcCardsSpec", "dlc_cards"),
    "dlc_26.png": source("dlc_26", "新型AI模型", "DlcCardsSpec", "dlc_cards"),
    "dlc_27.png": source("dlc_27", "更优太阳能板", "DlcCardsSpec", "dlc_cards"),
    "dlc_28.png": source("dlc_28", "重组", "DlcCardsSpec", "dlc_cards"),
    "dlc_29.png": source("dlc_29", "废弃任务", "DlcCardsSpec", "dlc_cards"),
    "dlc_30.png": source("dlc_30", "晓号轨道器", "DlcCardsSpec", "dlc_cards"),
    "dlc_31.png": source("dlc_31", "机智号直升机", "DlcCardsSpec", "dlc_cards"),
    "dlc_32.png": source("dlc_32", "MUREP创意竞赛", "DlcCardsSpec", "dlc_cards"),
    "dlc_33.png": source("dlc_33", "延期发射", "DlcCardsSpec", "dlc_cards"),
    "dlc_34.png": source("dlc_34", "私营部门投资", "DlcCardsSpec", "dlc_cards"),
    "dlc_35.png": source("dlc_35", "NASA系外行星档案", "DlcCardsSpec", "dlc_cards"),
    "dlc_36.png": source("dlc_36", "大耳朵射电望远镜", "DlcCardsSpec", "dlc_cards"),
    "dlc_37.png": source("dlc_37", "潘多拉卫星", "DlcCardsSpec", "dlc_cards"),
    "dlc_38.png": source("dlc_38", "太空交会", "DlcCardsSpec", "dlc_cards"),
    "dlc_39.png": source("dlc_39", "大巡游计划", "DlcCardsSpec", "dlc_cards"),
    "dlc_40.png": source("dlc_40", "霍尔效应推进器", "DlcCardsSpec", "dlc_cards"),
    "dlc_41.png": source("dlc_41", "系外行星巡天", "DlcCardsSpec", "dlc_cards"),
    "dlc_42.png": source("dlc_42", "低频阵列", "DlcCardsSpec", "dlc_cards"),
  });

  function effect(id, type, label, icon, options = {}) {
    return Object.freeze({ id, type, label, icon, options: Object.freeze({ ...options }) });
  }

  function gainResourcesEffect(id, label, gain) {
    return effect(id, REWARD_TYPES.GAIN_RESOURCES, label, gain.score ? "score" : gain.energy ? "energy" : "publicity", {
      gain,
    });
  }

  function gainDataEffect(id, label, count) {
    return effect(id, REWARD_TYPES.GAIN_DATA, label, "data", { count });
  }

  function drawCardsEffect(id, label, count) {
    return effect(id, REWARD_TYPES.DRAW_CARDS, label, "blind_card", { count });
  }

  function pickCardEffect(id, label) {
    return effect(id, REWARD_TYPES.PICK_CARD, label || "精选 1 张卡牌", "pick_card", { count: 1 });
  }

  function launchEffect(id, label, options = {}) {
    return effect(id, REWARD_TYPES.LAUNCH, label || "发射", "launch", {
      skipCost: options.skipCost !== false,
      cost: options.cost || {},
      source: options.source || "card",
      ignoreRocketLimit: Boolean(options.ignoreRocketLimit),
    });
  }

  function researchTechEffect(id, label, techTypes = null) {
    const options = { skipCost: true };
    if (techTypes?.length) options.techTypes = Object.freeze([...techTypes]);
    return effect(id, EFFECT_TYPES.RESEARCH_TECH, label || "科技", "research_tech", options);
  }

  function cardOrbitEffect(id, label, options = {}) {
    return effect(id, EFFECT_TYPES.CARD_ORBIT, label || "环绕", "orbit", {
      skipCost: options.skipCost !== false,
      grantRewards: options.grantRewards !== false,
    });
  }

  function alienTraceEffect(id, label, traceTypes = null, options = {}) {
    const normalizedOptions = { ...options };
    if (traceTypes?.length) normalizedOptions.allowedTraceTypes = Object.freeze([...traceTypes]);
    const iconTraceType = traceTypes?.length === 1 ? traceTypes[0] : null;
    return effect(id, REWARD_TYPES.ALIEN_TRACE, label || "获得外星人痕迹", iconTraceType ? `alien_${iconTraceType}` : "alien_trace", normalizedOptions);
  }

  function cardLandEffect(id, label, options = {}) {
    return effect(id, EFFECT_TYPES.CARD_LAND, label || "登陆", "land", {
      skipCost: options.skipCost !== false,
      allowDuplicateLanding: Boolean(options.allowDuplicateLanding),
      allowSatelliteWithoutTech: Boolean(options.allowSatelliteWithoutTech),
      grantRewards: options.grantRewards !== false,
      afterLandRewards: options.afterLandRewards ? Object.freeze(options.afterLandRewards.map((reward) => Object.freeze({
        planetIds: reward.planetIds ? Object.freeze([...reward.planetIds]) : undefined,
        includeSatellites: Boolean(reward.includeSatellites),
        effect: reward.effect,
      }))) : undefined,
      rememberPreLandingOwnMarker: Boolean(options.rememberPreLandingOwnMarker),
    });
  }

  function removePlanetMarkerEffect(id, label, options = {}) {
    const markerKinds = options.markerKinds?.length
      ? options.markerKinds
      : ["orbit", "land", "satelliteLand"];
    return effect(id, EFFECT_TYPES.REMOVE_PLANET_MARKER, label || "移除环绕或登陆标记", "orbitOrLand", {
      owner: options.owner || "current",
      markerKinds: Object.freeze([...markerKinds]),
    });
  }

  function countHandIncomeResourceEffect(id, label, incomeCode, resource, per = 1) {
    return effect(id, EFFECT_TYPES.COUNT_HAND_INCOME_RESOURCE, label, resource === "score" ? "score" : resource, {
      incomeCode,
      resource,
      per,
    });
  }

  function countCurrentIncomeResourceEffect(id, label, incomeKey, resource, per = 1) {
    return effect(id, EFFECT_TYPES.COUNT_CURRENT_INCOME_RESOURCE, label, resource === "score" ? "score" : resource, {
      incomeKey,
      resource,
      per,
    });
  }

  function countAliensResourceEffect(id, label, gainPerAlien) {
    return effect(id, EFFECT_TYPES.COUNT_ALIENS_RESOURCE, label, "alien_trace", {
      gainPerAlien: Object.freeze({ ...gainPerAlien }),
    });
  }

  function tuckPlayedCardToIncomeEffect(id, label) {
    return effect(id, EFFECT_TYPES.TUCK_PLAYED_CARD_TO_INCOME, label || "将本卡放入收入区", "income", {});
  }

  function probeSectorScanEffect(id, label, options = {}) {
    return effect(id, EFFECT_TYPES.PROBE_SECTOR_SCAN, label || "探测器所在扇区扫描", "scan", {
      owner: options.owner || "current",
      maxTargets: Math.max(1, Math.round(Number(options.maxTargets || 1))),
      repeat: Math.max(1, Math.round(Number(options.repeat || 1))),
      includeAdjacent: Boolean(options.includeAdjacent),
      gainData: options.gainData !== false,
      returnToHandIfSignalCount: Number.isFinite(Number(options.returnToHandIfSignalCount))
        ? Math.max(0, Math.round(Number(options.returnToHandIfSignalCount)))
        : undefined,
    });
  }

  function planetSectorScanEffect(id, label, planetId, options = {}) {
    return effect(id, EFFECT_TYPES.PLANET_SECTOR_SCAN, label || "行星所在扇区扫描", "scan", {
      planetId,
      repeat: Math.max(1, Math.round(Number(options.repeat || 1))),
      gainData: options.gainData !== false,
    });
  }

  function registerEventBonusEffect(id, label, bonus) {
    return effect(id, EFFECT_TYPES.REGISTER_EVENT_BONUS, label, bonus.icon || "score", {
      bonus: Object.freeze({
        ...bonus,
        rewards: Object.freeze((bonus.rewards || []).map((reward) => Object.freeze({ ...reward }))),
      }),
    });
  }

  function cardMoveEffect(id, label, options = {}) {
    const movementPoints = Math.max(1, Math.round(Number(options.movementPoints || 1)));
    const normalizedOptions = {
      movementPoints,
    };
    if (options.historyLabel) normalizedOptions.historyLabel = options.historyLabel;
    if (options.suppressArrivalRewards) normalizedOptions.suppressArrivalRewards = true;
    if (options.ignoreAsteroidRestriction) normalizedOptions.ignoreAsteroidRestriction = true;
    if (options.sameRingReward) normalizedOptions.sameRingReward = options.sameRingReward;
    if (options.distinctEventReward) {
      const reward = options.distinctEventReward;
      normalizedOptions.distinctEventReward = Object.freeze({
        eventType: reward.eventType,
        distinctBy: reward.distinctBy || "planetId",
        minCount: Math.max(1, Math.round(Number(reward.minCount) || 1)),
        onceKey: reward.onceKey || null,
        effect: reward.effect,
      });
    }
    if (options.afterEventRewards?.length) {
      normalizedOptions.afterEventRewards = Object.freeze(options.afterEventRewards.map((reward) => Object.freeze({
        eventType: reward.eventType,
        planetIds: reward.planetIds ? Object.freeze([...reward.planetIds]) : undefined,
        includePlanetIds: reward.includePlanetIds ? Object.freeze([...reward.includePlanetIds]) : undefined,
        excludePlanetIds: reward.excludePlanetIds ? Object.freeze([...reward.excludePlanetIds]) : undefined,
        onceKey: reward.onceKey || null,
        effect: reward.effect,
      })));
    }
    const moveLabel = label || (movementPoints > 1 ? `${movementPoints}移动` : "移动");
    return effect(id, EFFECT_TYPES.CARD_MOVE, moveLabel, "movement", normalizedOptions);
  }

  function conditionalRewardEffect(id, label, condition, rewards) {
    return effect(id, EFFECT_TYPES.CONDITIONAL_REWARD, label, "score", {
      condition: Object.freeze({ ...(condition || {}) }),
      rewards: Object.freeze((rewards || []).map((reward) => reward)),
    });
  }

  function optionalDiscardScanEffect(id, label, count) {
    return effect(id, EFFECT_TYPES.OPTIONAL_DISCARD_SCAN, label || "可跳过弃牌扫描", "scan", {
      count: Math.max(1, Math.round(Number(count || 1))),
    });
  }

  function handScanEffect(id, label) {
    return effect(id, EFFECT_TYPES.HAND_SCAN, label || "手牌扫描", "scan", {});
  }

  function countHandCornerMoveEffect(id, label) {
    return effect(id, EFFECT_TYPES.COUNT_HAND_CORNER_MOVE, label || "按手牌移动角标获得移动", "movement", {});
  }

  function probeLocationRewardEffect(id, label, options = {}) {
    return effect(id, EFFECT_TYPES.PROBE_LOCATION_REWARD, label || "探测器位置奖励", "data", {
      owner: options.owner || "current",
      asteroidData: Math.max(0, Math.round(Number(options.asteroidData || 0))),
      adjacentAsteroidData: Math.max(0, Math.round(Number(options.adjacentAsteroidData || 0))),
    });
  }

  function earthSectorContentMoveEffect(id, label) {
    return effect(id, EFFECT_TYPES.EARTH_SECTOR_CONTENT_MOVE, label || "按地球扇区内容获得移动", "movement", {});
  }

  function plutoReserveEffect(id, label) {
    return effect(id, EFFECT_TYPES.PLUTO_RESERVE, label || "冥王星特殊保留", "orbitOrLand", {});
  }

  function chooseHandCornerRewardEffect(id, label) {
    return effect(id, EFFECT_TYPES.CHOOSE_HAND_CORNER_REWARD, label || "按手牌角标选择奖励", "publicity", {});
  }

  function returnPlayedCardToHandIfEffect(id, label, condition) {
    return effect(id, EFFECT_TYPES.RETURN_PLAYED_CARD_TO_HAND_IF, label || "若条件满足本卡回手", "pick_card", {
      condition: Object.freeze({ ...(condition || {}) }),
    });
  }

  function landingSectorScanEffect(id, label, options = {}) {
    return effect(id, EFFECT_TYPES.LANDING_SECTOR_SCAN, label || "刚登陆星球所在扇区扫描", "scan", {
      gainData: options.gainData !== false,
      repeat: Math.max(1, Math.round(Number(options.repeat || 1))),
    });
  }

  function conditionalSectorScanEffect(id, label, condition, options = {}) {
    return effect(id, EFFECT_TYPES.CONDITIONAL_SECTOR_SCAN, label || "条件扇区扫描", "scan", {
      condition: Object.freeze({ ...(condition || {}) }),
      repeat: Math.max(1, Math.round(Number(options.repeat || 1))),
      gainData: options.gainData !== false,
      allMatching: Boolean(options.allMatching),
      noAutoRepeatExpansion: true,
    });
  }

  function discardAnyForIncomeEffect(id, label) {
    return effect(id, EFFECT_TYPES.DISCARD_ANY_FOR_INCOME, label || "弃任意手牌并按收入角标奖励", "discard", {});
  }

  function payCreditsForRewardEffect(id, label, reward) {
    return effect(id, EFFECT_TYPES.PAY_CREDITS_FOR_REWARD, label || "支付信用获得奖励", "credits", {
      reward,
    });
  }

  function discardCardCornerRepeatEffect(id, label, options = {}) {
    return effect(id, EFFECT_TYPES.DISCARD_CARD_CORNER_REPEAT, label || "弃牌并重复结算左上角", "discard", {
      cornerRepeat: Math.max(1, Math.round(Number(options.repeat || 1))),
      excludeAlienCards: options.excludeAlienCards !== false,
    });
  }

  function removeOrbitToProbeEffect(id, label) {
    return effect(id, EFFECT_TYPES.REMOVE_ORBIT_TO_PROBE, label || "移除己方环绕并放置探测器", "orbitOrLand", {});
  }

  function returnUnfinishedTaskToHandEffect(id, label, options = {}) {
    return effect(id, EFFECT_TYPES.RETURN_UNFINISHED_TASK_TO_HAND, label || "未完成任务卡返回手牌", "pick_card", {
      cardTypes: Object.freeze(options.cardTypes || [1, 2]),
    });
  }

  function countTechTypesRewardEffect(id, label, options = {}) {
    return effect(id, EFFECT_TYPES.COUNT_TECH_TYPES_REWARD, label || "按最多科技类型奖励", options.icon || "blind_card", {
      reward: options.reward || "draw",
      per: Math.max(0, Number(options.per) || 1),
    });
  }

  function countOwnedTechRewardEffect(id, label, options = {}) {
    return effect(id, EFFECT_TYPES.COUNT_OWNED_TECH_REWARD, label || "按指定科技数量奖励", options.icon || options.resource || "data", {
      techType: options.techType || null,
      resource: options.resource || "data",
      per: Math.max(0, Number(options.per) || 1),
    });
  }

  function countRocketsRewardEffect(id, label, options = {}) {
    return effect(id, EFFECT_TYPES.COUNT_ROCKETS_REWARD, label || "按探测器数量奖励", options.icon || options.resource || "energy", {
      owner: options.owner || "current",
      location: options.location || "solar",
      includeNonStandard: options.includeNonStandard === true,
      resource: options.resource || "energy",
      per: Math.max(0, Number(options.per) || 1),
    });
  }

  function discardAllHandEffect(id, label, rewards) {
    return effect(id, EFFECT_TYPES.DISCARD_ALL_HAND, label || "弃掉全部手牌", "discard", {
      rewards: Object.freeze((rewards || []).map((reward) => reward)),
    });
  }

  function probeStackRewardEffect(id, label, rewards) {
    return effect(id, EFFECT_TYPES.PROBE_STACK_REWARD, label || "任意探测器同位置奖励", "score", {
      rewards: Object.freeze((rewards || []).map((reward) => reward)),
    });
  }

  function isMoveEffectType(type) {
    return type === EFFECT_TYPES.CARD_MOVE || type === EFFECT_TYPES.FREE_MOVE;
  }

  function consolidateCardMoveEffects(effects) {
    if (!Array.isArray(effects) || !effects.length) return [];

    const result = [];
    let index = 0;
    while (index < effects.length) {
      const current = effects[index];
      if (!isMoveEffectType(current.type)) {
        result.push(current);
        index += 1;
        continue;
      }

      let movementPoints = Math.max(1, Math.round(Number(current.options?.movementPoints || 1)));
      const mergedOptions = { ...(current.options || {}) };
      let afterEventRewards = mergedOptions.afterEventRewards || null;
      let distinctEventReward = mergedOptions.distinctEventReward || null;
      let nextIndex = index + 1;
      while (nextIndex < effects.length && isMoveEffectType(effects[nextIndex].type)) {
        const next = effects[nextIndex];
        movementPoints += Math.max(1, Math.round(Number(next.options?.movementPoints || 1)));
        if (!afterEventRewards && next.options?.afterEventRewards?.length) {
          afterEventRewards = next.options.afterEventRewards;
        }
        if (!distinctEventReward && next.options?.distinctEventReward) {
          distinctEventReward = next.options.distinctEventReward;
        }
        if (next.options?.suppressArrivalRewards) {
          mergedOptions.suppressArrivalRewards = true;
        }
        if (next.options?.historyLabel && !mergedOptions.historyLabel) {
          mergedOptions.historyLabel = next.options.historyLabel;
        }
        nextIndex += 1;
      }

      mergedOptions.movementPoints = movementPoints;
      if (afterEventRewards) mergedOptions.afterEventRewards = afterEventRewards;
      if (distinctEventReward) mergedOptions.distinctEventReward = distinctEventReward;

      result.push(effect(
        current.id,
        EFFECT_TYPES.CARD_MOVE,
        movementPoints > 1 ? `${movementPoints}移动` : (current.label || "移动"),
        current.icon || "movement",
        mergedOptions,
      ));
      index = nextIndex;
    }
    return result;
  }

  function withSource(cardId, model) {
    const deferredParts = model.deferredParts ? Object.freeze([...model.deferredParts]) : undefined;
    const endGameScoring = model.endGameScoring ? Object.freeze({ ...model.endGameScoring }) : undefined;
    return Object.freeze({
      ...model,
      source: CARD_REFERENCE_MAP[cardId] || null,
      ...(deferredParts ? { deferredParts } : {}),
      ...(endGameScoring ? { endGameScoring } : {}),
    });
  }

  const END_GAME_SCORING = Object.freeze({
    RED_SECTOR_WINS: Object.freeze({ kind: "sectorWinsByColor", color: "red", scorePer: 3 }),
    YELLOW_SECTOR_WINS: Object.freeze({ kind: "sectorWinsByColor", color: "yellow", scorePer: 3 }),
    BLUE_SECTOR_WINS: Object.freeze({ kind: "sectorWinsByColor", color: "blue", scorePer: 3 }),
    BLACK_SECTOR_WINS: Object.freeze({ kind: "sectorWinsByColor", color: "black", scorePer: 3 }),
    BLUE_TRACES: Object.freeze({ kind: "traceCount", traceType: "blue", scorePer: 2 }),
    PINK_TRACES: Object.freeze({ kind: "traceCount", traceType: "pink", scorePer: 2 }),
    YELLOW_TRACES: Object.freeze({ kind: "traceCount", traceType: "yellow", scorePer: 2 }),
    BLUE_TECH: Object.freeze({ kind: "techCount", techType: "blue", scorePer: 2 }),
    SIGNAL_SECTORS: Object.freeze({ kind: "distinctSignalSectors", scorePer: 1 }),
    JUPITER_ORBIT_OR_LAND: Object.freeze({ kind: "planetOrbitOrLand", planetId: "jupiter", scorePer: 3 }),
    MARS_ORBIT_OR_LAND: Object.freeze({ kind: "planetOrbitOrLand", planetId: "mars", scorePer: 4 }),
    ASTEROID_PROBE: Object.freeze({ kind: "probeLocation", locationType: "asteroid", score: 13 }),
    UNMARKED_FINAL_RIGHTMOST: Object.freeze({ kind: "unmarkedFinalRightmost" }),
    REMAINING_DATA: Object.freeze({ kind: "remainingResource", resource: "availableData", scorePer: 3 }),
    REMAINING_PUBLICITY: Object.freeze({ kind: "remainingResource", resource: "publicity", scorePer: 1 }),
    DOUBLE_PLANET_LANDINGS: Object.freeze({ kind: "planetLandingPairs", count: 2, scorePer: 6 }),
    ALL_ORBIT_OR_LAND: Object.freeze({ kind: "allOrbitOrLand", scorePer: 2 }),
  });

  const MODELS = Object.freeze({
    "aomomo_0.webp": withSource("aomomo_0.webp", {
      cardType: 2,
      tasks: Object.freeze([{
        id: "aomomo0-land",
        condition: Object.freeze({ type: "aomomoLanding" }),
        rewards: Object.freeze([
          gainResourcesEffect("aomomo0-land-score", "登陆奥陌陌：4分", { score: 4 }),
        ]),
      }]),
    }),
    "aomomo_1.webp": withSource("aomomo_1.webp", {
      cardType: 1,
      triggers: Object.freeze([
        {
          id: "aomomo1-trace-data",
          event: Object.freeze({ type: "alienTrace" }),
          effect: gainDataEffect("aomomo1-data", "奥陌陌1：获得外星人痕迹，1数据", 1),
        },
        {
          id: "aomomo1-trace-publicity",
          event: Object.freeze({ type: "alienTrace" }),
          effect: gainResourcesEffect("aomomo1-publicity", "奥陌陌1：获得外星人痕迹，1宣传", { publicity: 1 }),
        },
        {
          id: "aomomo1-trace-score",
          event: Object.freeze({ type: "alienTrace" }),
          effect: gainResourcesEffect("aomomo1-score", "奥陌陌1：获得外星人痕迹，3分", { score: 3 }),
        },
      ]),
    }),
    "aomomo_2.webp": withSource("aomomo_2.webp", {
      cardType: 2,
      tasks: Object.freeze([{
        id: "aomomo2-fossils-score",
        condition: Object.freeze({ type: "aomomoFossils", count: 3 }),
        rewards: Object.freeze([
          effect("aomomo2-spend-fossils", "aomomo_spend_fossils_gain_score", "拥有3化石：移除2化石得11分", "aomomoFossil", { cost: 2, score: 11 }),
        ]),
      }]),
    }),
    "aomomo_3.webp": withSource("aomomo_3.webp", {
      cardType: 2,
      tasks: Object.freeze([{
        id: "aomomo3-all-trace-types",
        condition: Object.freeze({ type: "aomomoAllTraceTypes" }),
        rewards: Object.freeze([
          gainResourcesEffect("aomomo3-fossil", "奥陌陌三色痕迹：1化石", { aomomoFossils: 1 }),
        ]),
      }]),
    }),
    "aomomo_5.webp": withSource("aomomo_5.webp", {
      cardType: 0,
      playEffects: Object.freeze([]),
    }),
    "aomomo_8.webp": withSource("aomomo_8.webp", {
      cardType: 3,
      endGameScoring: Object.freeze({ kind: "aomomoTraceCount", scorePer: 1 }),
    }),
    "aomomo_9.webp": withSource("aomomo_9.webp", {
      cardType: 2,
      tasks: Object.freeze([{
        id: "aomomo9-fossil-spending-trace",
        condition: Object.freeze({ type: "aomomoFossilSpendingTrace" }),
        rewards: Object.freeze([
          gainDataEffect("aomomo9-data", "占据奥陌陌化石支付痕迹位：1数据", 1),
        ]),
      }]),
    }),
    "yichangdian_0.webp": withSource("yichangdian_0.webp", {
      cardType: 1,
      playEffects: Object.freeze([
        effect("y0-any-sector-scan", EFFECT_TYPES.ANY_SECTOR_SCAN, "扫描任意扇区", "scan", { gainData: true }),
        effect("y0-anomaly-score", EFFECT_TYPES.YICHANGDIAN_ANOMALY_SIGNAL_SCORE, "异常扇区信号得分", "score"),
      ]),
    }),
    "yichangdian_1.webp": withSource("yichangdian_1.webp", {
      cardType: 2,
      playEffects: Object.freeze([
        effect("y1-next-anomaly-reward", EFFECT_TYPES.YICHANGDIAN_NEXT_ANOMALY_REWARD, "获得即将触发异常奖励", "publicity"),
      ]),
      tasks: Object.freeze([{
        id: "y1-all-trace-types",
        condition: Object.freeze({ type: "yichangdianAllTraceTypes" }),
        rewards: Object.freeze([
          gainResourcesEffect("y1-all-trace-types-reward", "异常点三色痕迹：3分2宣传", {
            score: 3,
            publicity: 2,
          }),
        ]),
      }]),
    }),
    "yichangdian_2.webp": withSource("yichangdian_2.webp", {
      cardType: 0,
      playEffects: Object.freeze([
        cardMoveEffect("y2-move", "5移动（不获得访问宣传）", {
          movementPoints: 5,
          suppressArrivalRewards: true,
          historyLabel: "近距离观察：5移动",
        }),
      ]),
    }),
    "yichangdian_3.webp": withSource("yichangdian_3.webp", {
      cardType: 1,
      playEffects: Object.freeze([
        gainResourcesEffect("y3-publicity", "吃瓜群众：1宣传", { publicity: 1 }),
      ]),
      triggers: Object.freeze([
        {
          id: "y3-tech-energy",
          event: Object.freeze({ type: "researchTech" }),
          effect: gainResourcesEffect("y3-energy", "吃瓜群众：获得科技，1能量", { energy: 1 }),
        },
        {
          id: "y3-tech-pick",
          event: Object.freeze({ type: "researchTech" }),
          effect: pickCardEffect("y3-pick", "吃瓜群众：获得科技，精选1张牌"),
        },
        {
          id: "y3-tech-score",
          event: Object.freeze({ type: "researchTech" }),
          effect: gainResourcesEffect("y3-score", "吃瓜群众：获得科技，3分", { score: 3 }),
        },
      ]),
    }),
    "yichangdian_4.webp": withSource("yichangdian_4.webp", {
      cardType: 0,
      playEffects: Object.freeze([
        effect("y4-public-all", EFFECT_TYPES.YICHANGDIAN_PUBLIC_ALL, "获得公共牌区全部3张牌", "pick_card"),
      ]),
    }),
    "yichangdian_5.webp": withSource("yichangdian_5.webp", {
      cardType: 0,
      playEffects: Object.freeze([
        effect("y5-scan-action", EFFECT_TYPES.SCAN_ACTION, "扫描行动", "scan_action", { skipCost: true }),
        effect("y5-next-anomaly-scan", EFFECT_TYPES.YICHANGDIAN_NEXT_ANOMALY_SCAN, "即将触发异常扇区额外扫描", "scan"),
      ]),
    }),
    "yichangdian_6.webp": withSource("yichangdian_6.webp", {
      cardType: 0,
      playEffects: Object.freeze([
        researchTechEffect("y6-tech", "科技行动"),
      ]),
    }),
    "yichangdian_7.webp": withSource("yichangdian_7.webp", {
      cardType: 0,
      playEffects: Object.freeze([
        effect("y7-alien-trace", EFFECT_TYPES.YICHANGDIAN_ALIEN_TRACE, "获得任意外星人痕迹", "alien_trace"),
      ]),
    }),
    "yichangdian_8.webp": withSource("yichangdian_8.webp", {
      cardType: 0,
      playEffects: Object.freeze([
        effect("y8-draw-corners", EFFECT_TYPES.YICHANGDIAN_DRAW_THEN_TWO_CORNERS, "盲抽3张并结算两张角标", "blind_card"),
      ]),
    }),
    "yichangdian_9.webp": withSource("yichangdian_9.webp", {
      cardType: 0,
      playEffects: Object.freeze([
        launchEffect("y9-launch", "发射", { skipCost: true, source: "card" }),
        effect("y9-anomaly-move", EFFECT_TYPES.YICHANGDIAN_LAUNCH_ANOMALY_MOVE, "若在异常扇区获得1移动", "movement"),
      ]),
    }),
    "amiba_0.webp": withSource("amiba_0.webp", {
      cardType: 1,
      triggers: Object.freeze([
        {
          id: "amiba0-pink-data",
          event: Object.freeze({ type: "alienTrace", traceType: "pink" }),
          effect: gainDataEffect("amiba0-pink-data", "自动分析：获得粉色外星人痕迹，1数据", 1),
        },
        {
          id: "amiba0-yellow-data",
          event: Object.freeze({ type: "alienTrace", traceType: "yellow" }),
          effect: gainDataEffect("amiba0-yellow-data", "自动分析：获得黄色外星人痕迹，1数据", 1),
        },
      ]),
    }),
    "amiba_1.webp": withSource("amiba_1.webp", {
      cardType: 1,
      triggers: Object.freeze([
        {
          id: "amiba1-orange-tech",
          event: Object.freeze({ type: "researchTech", techType: "orange" }),
          effect: effect("amiba1-orange-symbol", "amiba_choose_symbol_reward", "安全协议：橙色科技，橙色区域 symbol 奖励", "alien_trace", { region: "orange" }),
        },
        {
          id: "amiba1-purple-tech",
          event: Object.freeze({ type: "researchTech", techType: "purple" }),
          effect: effect("amiba1-red-symbol", "amiba_choose_symbol_reward", "安全协议：粉紫科技，红色区域 symbol 奖励", "alien_trace", { region: "red" }),
        },
        {
          id: "amiba1-blue-tech",
          event: Object.freeze({ type: "researchTech", techType: "blue" }),
          effect: effect("amiba1-blue-symbol", "amiba_choose_symbol_reward", "安全协议：蓝色科技，蓝色区域 symbol 奖励", "alien_trace", { region: "blue" }),
        },
      ]),
    }),
    "amiba_2.webp": withSource("amiba_2.webp", {
      cardType: 1,
      triggers: Object.freeze([
        {
          id: "amiba2-trace-publicity-1",
          event: Object.freeze({ type: "alienTrace", alienId: "阿米巴" }),
          effect: gainResourcesEffect("amiba2-publicity-1", "科学论文：本物种痕迹，1宣传", { publicity: 1 }),
        },
        {
          id: "amiba2-trace-publicity-2",
          event: Object.freeze({ type: "alienTrace", alienId: "阿米巴" }),
          effect: gainResourcesEffect("amiba2-publicity-2", "科学论文：本物种痕迹，1宣传", { publicity: 1 }),
        },
      ]),
    }),
    "amiba_3.webp": withSource("amiba_3.webp", { cardType: 0 }),
    "amiba_4.webp": withSource("amiba_4.webp", { cardType: 0 }),
    "amiba_5.webp": withSource("amiba_5.webp", { cardType: 3 }),
    "amiba_6.webp": withSource("amiba_6.webp", { cardType: 3 }),
    "amiba_7.webp": withSource("amiba_7.webp", { cardType: 3 }),
    "amiba_8.webp": withSource("amiba_8.webp", { cardType: 2 }),
    "amiba_9.webp": withSource("amiba_9.webp", {
      cardType: 1,
      triggers: Object.freeze([
        {
          id: "amiba9-blue-data-1",
          event: Object.freeze({ type: "alienTrace", traceType: "blue" }),
          effect: gainDataEffect("amiba9-blue-data-1", "低重力研究：获得蓝色外星人痕迹，1数据", 1),
        },
        {
          id: "amiba9-blue-data-2",
          event: Object.freeze({ type: "alienTrace", traceType: "blue" }),
          effect: gainDataEffect("amiba9-blue-data-2", "低重力研究：获得蓝色外星人痕迹，1数据", 1),
        },
      ]),
    }),
    "b_1.webp": withSource("b_1.webp", {
      cardType: 2,
      playEffects: Object.freeze([
        effect("b1-virgo-scan", EFFECT_TYPES.SCAN_NEBULA, "室女座61扇区扫描", "yellow_scan", {
          nebulaId: "sector-4-a",
          gainData: true,
          repeat: 2,
        }),
      ]),
      tasks: Object.freeze([{
        id: "b1-yellow-sector-task",
        condition: Object.freeze({ type: "completedSectorsByColor", color: "yellow", count: 2 }),
        rewards: Object.freeze([
          gainResourcesEffect("b1-yellow-sector-reward", "完成2个黄色扇区：4分，1宣传", {
            score: 4,
            publicity: 1,
          }),
        ]),
      }]),
    }),
    "b_2.webp": withSource("b_2.webp", {
      cardType: 1,
      triggers: Object.freeze([
        {
          id: "b2-visit-planet-energy",
          event: Object.freeze({ type: "visitPlanet", excludePlanetIds: Object.freeze(["earth"]) }),
          effect: gainResourcesEffect("b2-energy", "高级导航系统：1能量", { energy: 1 }),
        },
        {
          id: "b2-visit-planet-data",
          event: Object.freeze({ type: "visitPlanet", excludePlanetIds: Object.freeze(["earth"]) }),
          effect: gainDataEffect("b2-data", "高级导航系统：1数据", 1),
        },
        {
          id: "b2-visit-planet-move",
          event: Object.freeze({ type: "visitPlanet", excludePlanetIds: Object.freeze(["earth"]) }),
          effect: effect("b2-free-move", EFFECT_TYPES.FREE_MOVE, "高级导航系统：1免费移动", "movement", {
            movementPoints: 1,
          }),
        },
      ]),
    }),
    "b_3.webp": withSource("b_3.webp", {
      cardType: 0,
      playEffects: Object.freeze([
        effect("b3-yellow", EFFECT_TYPES.SCAN_COLOR_CHOICE, "黄色扇区扫描（不获得数据）", "yellow_scan", { color: "yellow", gainData: false }),
        effect("b3-red", EFFECT_TYPES.SCAN_COLOR_CHOICE, "红色扇区扫描（不获得数据）", "red_scan", { color: "red", gainData: false }),
        effect("b3-blue", EFFECT_TYPES.SCAN_COLOR_CHOICE, "蓝色扇区扫描（不获得数据）", "blue_scan", { color: "blue", gainData: false }),
        effect("b3-black", EFFECT_TYPES.SCAN_COLOR_CHOICE, "黑色扇区扫描（不获得数据）", "black_scan", { color: "black", gainData: false }),
      ]),
    }),
    "b_4.webp": withSource("b_4.webp", {
      cardType: 2,
      playEffects: Object.freeze([
        effect("b4-blue-tech", EFFECT_TYPES.RESEARCH_TECH, "科技（只能选择蓝色）", "research_tech", {
          techTypes: Object.freeze(["blue"]),
          skipCost: true,
        }),
      ]),
      tasks: Object.freeze([{
        id: "b4-blue-alien-task",
        condition: Object.freeze({ type: "allAliensHaveTrace", traceType: "blue" }),
        rewards: Object.freeze([gainDataEffect("b4-blue-alien-reward", "2个外星人均有蓝色痕迹：2数据", 2)]),
      }]),
    }),
    "b_5.webp": withSource("b_5.webp", {
      cardType: 0,
      playEffects: Object.freeze([
        effect("b5-public-scan", EFFECT_TYPES.PUBLIC_SCAN, "公共牌区扫描", "public_card_scan", { repeat: 2 }),
      ]),
      temporaryTasks: Object.freeze([{
        id: "b5-complete-sector",
        condition: Object.freeze({ type: "sectorCompletedDuringCard", count: 1 }),
        rewards: Object.freeze([gainResourcesEffect("b5-complete-sector-reward", "完成扇区：1能量", { energy: 1 })]),
      }]),
    }),
    "b_6.webp": withSource("b_6.webp", {
      cardType: 0,
      playEffects: Object.freeze([
        effect("b6-public-scan", EFFECT_TYPES.PUBLIC_SCAN, "公共牌区扫描", "public_card_scan", { repeat: 2 }),
      ]),
      temporaryTasks: Object.freeze([{
        id: "b6-complete-sector",
        condition: Object.freeze({ type: "sectorCompletedDuringCard", count: 1 }),
        rewards: Object.freeze([drawCardsEffect("b6-complete-sector-reward", "完成扇区：1盲抽", 1)]),
      }]),
    }),
    "b_7.webp": withSource("b_7.webp", {
      cardType: 0,
      playEffects: Object.freeze([
        drawCardsEffect("b7-draw", "盲抽 3 张牌", 3),
      ]),
    }),
    "b_8.webp": withSource("b_8.webp", {
      cardType: 2,
      playEffects: Object.freeze([
        effect("b8-orange-tech", EFFECT_TYPES.RESEARCH_TECH, "科技（只能选择橙色）", "research_tech", {
          techTypes: Object.freeze(["orange"]),
          skipCost: true,
        }),
      ]),
      tasks: Object.freeze([{
        id: "b8-yellow-alien-task",
        condition: Object.freeze({ type: "allAliensHaveTrace", traceType: "yellow" }),
        rewards: Object.freeze([
          gainResourcesEffect("b8-yellow-alien-score", "2个外星人均有黄色痕迹：2分", { score: 2 }),
          drawCardsEffect("b8-yellow-alien-draw", "2个外星人均有黄色痕迹：1盲抽", 1),
        ]),
      }]),
    }),
    "b_9.webp": withSource("b_9.webp", {
      cardType: 0,
      playEffects: Object.freeze([
        effect("b9-scan-action", EFFECT_TYPES.SCAN_ACTION, "扫描行动", "scan_action", { skipCost: true }),
        effect("b9-any-sector-scan", EFFECT_TYPES.ANY_SECTOR_SCAN, "额外任意扇区扫描", "scan", { gainData: true }),
      ]),
    }),
    "b_10.webp": withSource("b_10.webp", {
      cardType: 1,
      triggers: Object.freeze([1, 2, 3].map((index) => ({
        id: `b10-visit-asteroid-data-${index}`,
        event: Object.freeze({ type: "visitAsteroid" }),
        effect: gainDataEffect(`b10-data-${index}`, `小行星研究：1数据 ${index}/3`, 1),
      }))),
    }),
    "b_11.webp": withSource("b_11.webp", {
      cardType: 0,
      playEffects: Object.freeze([
        cardMoveEffect("b11-move", "1移动；若访问小行星获得1数据", {
          afterEventRewards: Object.freeze([{
            eventType: "visitAsteroid",
            onceKey: "b11-asteroid-data",
            effect: gainDataEffect("b11-asteroid-data", "小行星飞掠：访问小行星获得1数据", 1),
          }]),
        }),
      ]),
    }),
    "b_12.webp": withSource("b_12.webp", {
      cardType: 2,
      playEffects: Object.freeze([
        researchTechEffect("b12-blue-tech", "科技（只能选择蓝色）", ["blue"]),
      ]),
      tasks: Object.freeze([{
        id: "b12-blue-trace-task",
        condition: Object.freeze({ type: "traceCount", traceType: "blue", count: 3 }),
        rewards: Object.freeze([
          gainResourcesEffect("b12-blue-trace-score", "拥有3个蓝色外星人标记：3分", { score: 3 }),
          gainDataEffect("b12-blue-trace-data", "拥有3个蓝色外星人标记：1数据", 1),
        ]),
      }]),
    }),
    "b_13.webp": withSource("b_13.webp", {
      cardType: 0,
      playEffects: Object.freeze([
        removePlanetMarkerEffect("b13-remove-marker", "移除己方环绕或登陆标记", {
          owner: "current",
          markerKinds: ["orbit", "land", "satelliteLand"],
        }),
        gainResourcesEffect("b13-score", "移除标记：3分", { score: 3 }),
        gainDataEffect("b13-data", "移除标记：1数据", 1),
        pickCardEffect("b13-pick", "移除标记：精选1张牌"),
      ]),
    }),
    "b_14.webp": withSource("b_14.webp", {
      cardType: 3,
      playEffects: Object.freeze([
        effect("b14-barnard-scan", EFFECT_TYPES.SCAN_NEBULA, "巴纳德扇区扫描", "red_scan", {
          nebulaId: "sector-2-b",
          gainData: true,
          repeat: 2,
        }),
      ]),
      endGameScoring: END_GAME_SCORING.RED_SECTOR_WINS,
    }),
    "b_15.webp": withSource("b_15.webp", {
      cardType: 2,
      playEffects: Object.freeze([
        effect("b15-beta-pictoris-scan", EFFECT_TYPES.SCAN_NEBULA, "绘架座β扇区扫描", "black_scan", {
          nebulaId: "sector-4-b",
          gainData: true,
        }),
      ]),
      tasks: Object.freeze([{
        id: "b15-black-sector-task",
        condition: Object.freeze({ type: "completedSectorsByColor", color: "black", count: 1 }),
        rewards: Object.freeze([
          gainResourcesEffect("b15-black-sector-reward", "完成1个黑色扇区：2分，1宣传", {
            score: 2,
            publicity: 1,
          }),
        ]),
      }]),
    }),
    "b_16.webp": withSource("b_16.webp", {
      cardType: 0,
      playEffects: Object.freeze([
        cardMoveEffect("b16-move", "1移动"),
        effect("b16-blue-scan", EFFECT_TYPES.SCAN_COLOR_CHOICE, "蓝色扇区扫描", "blue_scan", {
          color: "blue",
          gainData: true,
        }),
      ]),
    }),
    "b_17.webp": withSource("b_17.webp", {
      cardType: 0,
      playEffects: Object.freeze([
        cardMoveEffect("b17-move", "1移动"),
        effect("b17-red-scan", EFFECT_TYPES.SCAN_COLOR_CHOICE, "红色扇区扫描", "red_scan", {
          color: "red",
          gainData: true,
        }),
      ]),
    }),
    "b_18.webp": withSource("b_18.webp", {
      cardType: 2,
      playEffects: Object.freeze([
        cardMoveEffect("b18-move", "1移动"),
        effect("b18-red-scan", EFFECT_TYPES.SCAN_COLOR_CHOICE, "红色扇区扫描", "red_scan", {
          color: "red",
          gainData: true,
        }),
      ]),
      tasks: Object.freeze([{
        id: "b18-purple-tech-task",
        condition: Object.freeze({ type: "techCount", techType: "purple", count: 3 }),
        rewards: Object.freeze([gainDataEffect("b18-purple-tech-data", "拥有3个紫色科技：1数据", 1)]),
      }]),
    }),
    "b_19.webp": withSource("b_19.webp", {
      cardType: 2,
      playEffects: Object.freeze([
        effect("b19-any-sector-scan", EFFECT_TYPES.ANY_SECTOR_SCAN, "扫描任意扇区", "scan", {
          gainData: true,
        }),
      ]),
      tasks: Object.freeze([{
        id: "b19-purple-tech-task",
        condition: Object.freeze({ type: "techCount", techType: "purple", count: 3 }),
        rewards: Object.freeze([gainDataEffect("b19-purple-tech-data", "拥有3个紫色科技：1数据", 1)]),
      }]),
    }),
    "b_20.webp": withSource("b_20.webp", {
      cardType: 1,
      triggers: Object.freeze([1, 2, 3].map((index) => ({
        id: `b20-launch-move-${index}`,
        event: Object.freeze({ type: "launch" }),
        effect: effect(`b20-free-move-${index}`, EFFECT_TYPES.FREE_MOVE, `卡纳维拉尔角：发射后1免费移动 ${index}/3`, "movement", {
          movementPoints: 1,
        }),
      }))),
    }),
    "b_21.webp": withSource("b_21.webp", {
      cardType: 2,
      playEffects: Object.freeze([
        launchEffect("b21-launch", "发射"),
        pickCardEffect("b21-pick-card", "精选 1 张卡牌"),
      ]),
      tasks: Object.freeze([{
        id: "b21-saturn-task",
        condition: Object.freeze({ type: "planetOrbitOrLand", planetId: "saturn", count: 1 }),
        rewards: Object.freeze([
          gainResourcesEffect("b21-saturn-reward", "在土星存在环绕或登陆：6分，1宣传", {
            score: 6,
            publicity: 1,
          }),
        ]),
      }]),
    }),
    "b_22.webp": withSource("b_22.webp", {
      cardType: 2,
      playEffects: Object.freeze([
        probeSectorScanEffect("b22-probe-sector-scan", "选择己方探测器所在扇区扫描两次", {
          repeat: 2,
        }),
      ]),
      tasks: Object.freeze([{
        id: "b22-distinct-signal-task",
        condition: Object.freeze({ type: "distinctSignalSectors", count: 4 }),
        rewards: Object.freeze([
          gainResourcesEffect("b22-distinct-signal-reward", "4个不同扇区有信号：2宣传", {
            publicity: 2,
          }),
        ]),
      }]),
    }),
    "b_23.webp": withSource("b_23.webp", {
      cardType: 0,
      playEffects: Object.freeze([
        effect("b23-draw-corner", EFFECT_TYPES.DRAW_THEN_DISCARD_ACTION, "盲抽并立刻结算左上角角标", "blind_card", {
          repeat: 3,
        }),
      ]),
    }),
    "b_24.webp": withSource("b_24.webp", {
      cardType: 0,
      playEffects: Object.freeze([
        cardMoveEffect("b24-move", "2移动；若访问彗星获得4分", {
          movementPoints: 2,
          afterEventRewards: Object.freeze([{
            eventType: "visitComet",
            onceKey: "b24-comet-score",
            effect: gainResourcesEffect("b24-comet-score", "彗星遭遇：访问彗星获得4分", { score: 4 }),
          }]),
        }),
      ]),
    }),
    "b_25.webp": withSource("b_25.webp", {
      cardType: 1,
      triggers: Object.freeze([
        { id: "b25-yellow-scan-move", color: "yellow", label: "扫描黄色扇区：1免费移动" },
        { id: "b25-red-scan-move", color: "red", label: "扫描红色扇区：1免费移动" },
        { id: "b25-blue-scan-move", color: "blue", label: "扫描蓝色扇区：1免费移动" },
      ].map((item) => ({
        id: item.id,
        event: Object.freeze({ type: "signalMarked", color: item.color }),
        effect: effect(`${item.id}-effect`, EFFECT_TYPES.FREE_MOVE, item.label, "movement", {
          movementPoints: 1,
        }),
      }))),
    }),
    "b_26.webp": withSource("b_26.webp", {
      cardType: 1,
      triggers: Object.freeze([
        {
          id: "b26-publicity-corner",
          event: Object.freeze({ type: "cardCorner", cornerKind: "publicity" }),
          effect: effect("b26-publicity-corner-repeat", EFFECT_TYPES.CARD_CORNER_EVENT_REWARD, "康奈尔大学：再获得一次宣传角标奖励", "publicity"),
        },
        {
          id: "b26-data-corner",
          event: Object.freeze({ type: "cardCorner", cornerKind: "data" }),
          effect: effect("b26-data-corner-repeat", EFFECT_TYPES.CARD_CORNER_EVENT_REWARD, "康奈尔大学：再获得一次数据角标奖励", "data"),
        },
        {
          id: "b26-move-corner",
          event: Object.freeze({ type: "cardCorner", cornerKind: "move" }),
          effect: effect("b26-move-corner-repeat", EFFECT_TYPES.CARD_CORNER_EVENT_REWARD, "康奈尔大学：再获得一次移动角标奖励", "movement"),
        },
      ]),
    }),
    "b_27.webp": withSource("b_27.webp", {
      cardType: 0,
      playEffects: Object.freeze([
        alienTraceEffect("b27-pink-trace", "在已有粉色痕迹的外星人上再放1个粉色痕迹", ["pink"], {
          targetRule: "playerHasSameTrace",
        }),
      ]),
    }),
    "b_28.webp": withSource("b_28.webp", {
      cardType: 0,
      playEffects: Object.freeze([
        registerEventBonusEffect("b28-yellow-signal-bonus", "本次扫描：黄色扇区信号各得2分", {
          duration: "flow",
          eventType: "signalMarked",
          color: "yellow",
          icon: "score",
          rewards: [gainResourcesEffect("b28-yellow-score", "黄色扇区信号：2分", { score: 2 })],
        }),
        effect("b28-scan-action", EFFECT_TYPES.SCAN_ACTION, "扫描行动", "scan_action", { skipCost: true }),
      ]),
    }),
    "b_29.webp": withSource("b_29.webp", {
      cardType: 0,
      playEffects: Object.freeze([
        cardLandEffect("b29-land", "登陆（可重复登陆并获得地点奖励）", {
          allowDuplicateLanding: true,
          grantRewards: true,
        }),
      ]),
    }),
    "b_30.webp": withSource("b_30.webp", {
      cardType: 3,
      playEffects: Object.freeze([
        researchTechEffect("b30-blue-tech", "科技（只能选择蓝色）", ["blue"]),
      ]),
      endGameScoring: END_GAME_SCORING.BLUE_TRACES,
    }),
    "b_31.webp": withSource("b_31.webp", {
      cardType: 0,
      playEffects: Object.freeze([
        pickCardEffect("b31-pick-card", "精选 1 张卡牌"),
        researchTechEffect("b31-purple-tech", "科技（只能选择紫色）", ["purple"]),
      ]),
    }),
    "b_32.webp": withSource("b_32.webp", {
      cardType: 0,
      playEffects: Object.freeze([
        alienTraceEffect("b32-yellow-trace", "在已有黄色痕迹的外星人上再放1个黄色痕迹", ["yellow"], {
          targetRule: "playerHasSameTrace",
        }),
      ]),
    }),
    "b_33.webp": withSource("b_33.webp", {
      cardType: 3,
      playEffects: Object.freeze([
        researchTechEffect("b33-orange-or-purple-tech", "科技（橙色或紫色）", ["orange", "purple"]),
      ]),
      endGameScoring: END_GAME_SCORING.BLUE_TECH,
    }),
    "b_34.webp": withSource("b_34.webp", {
      cardType: 3,
      playEffects: Object.freeze([
        cardLandEffect("b34-land", "登陆（可无橙色4登陆卫星）", {
          allowSatelliteWithoutTech: true,
          grantRewards: true,
        }),
      ]),
      endGameScoring: END_GAME_SCORING.JUPITER_ORBIT_OR_LAND,
    }),
    "b_35.webp": withSource("b_35.webp", {
      cardType: 0,
      playEffects: Object.freeze([
        alienTraceEffect("b35-blue-trace", "在已有蓝色痕迹的外星人上再放1个蓝色痕迹", ["blue"], {
          targetRule: "playerHasSameTrace",
        }),
      ]),
    }),
    "b_36.webp": withSource("b_36.webp", {
      cardType: 0,
      playEffects: Object.freeze([
        alienTraceEffect("b36-any-trace", "获得任意外星人痕迹，并按该颜色痕迹数得分", null, {
          afterTraceReward: Object.freeze({ kind: "traceCountScore", scorePer: 1 }),
        }),
      ]),
    }),
    "b_37.webp": withSource("b_37.webp", {
      cardType: 0,
      playEffects: Object.freeze([
        launchEffect("b37-launch-1", "发射 1/2（忽略火箭上限）", { ignoreRocketLimit: true }),
        launchEffect("b37-launch-2", "发射 2/2（忽略火箭上限）", { ignoreRocketLimit: true }),
        gainResourcesEffect("b37-publicity", "获得 1 宣传", { publicity: 1 }),
      ]),
    }),
    "b_38.webp": withSource("b_38.webp", {
      cardType: 0,
      playEffects: Object.freeze([
        effect("b38-public-scan", EFFECT_TYPES.PUBLIC_SCAN, "公共牌区扫描", "public_card_scan", { repeat: 2 }),
        researchTechEffect("b38-purple-tech", "科技（只能选择紫色）", ["purple"]),
      ]),
    }),
    "b_39.webp": withSource("b_39.webp", {
      cardType: 1,
      playEffects: Object.freeze([
        gainDataEffect("b39-data", "获得 2 个数据", 2),
      ]),
      triggers: Object.freeze([
        {
          id: "b39-blue-trace-publicity",
          event: Object.freeze({ type: "alienTrace", traceType: "blue" }),
          effect: gainResourcesEffect("b39-blue-trace-publicity-effect", "获得蓝色痕迹：2宣传", { publicity: 2 }),
        },
        {
          id: "b39-blue-trace-score",
          event: Object.freeze({ type: "alienTrace", traceType: "blue" }),
          effect: gainResourcesEffect("b39-blue-trace-score-effect", "获得蓝色痕迹：4分", { score: 4 }),
        },
      ]),
    }),
    "b_40.webp": withSource("b_40.webp", {
      cardType: 0,
      playEffects: Object.freeze([
        effect("b40-tech", EFFECT_TYPES.RESEARCH_TECH, "科技，并按该颜色科技数得分", "research_tech", {
          skipCost: true,
          afterResearchReward: Object.freeze({ kind: "techTypeCountScore", scorePer: 2 }),
        }),
      ]),
    }),
    "b_41.webp": withSource("b_41.webp", {
      cardType: 0,
      playEffects: Object.freeze([
        countHandIncomeResourceEffect("b41-energy-by-hand-income", "手牌中每张能量收入牌：1能量", 1, "energy", 1),
      ]),
    }),
    "b_42.webp": withSource("b_42.webp", {
      cardType: 0,
      playEffects: Object.freeze([
        countCurrentIncomeResourceEffect("b42-energy-by-income", "当前每个能量收入：1能量", "energy", "energy", 1),
        tuckPlayedCardToIncomeEffect("b42-tuck-income", "将本卡放入收入区"),
      ]),
    }),
    "b_43.webp": withSource("b_43.webp", {
      cardType: 0,
      playEffects: Object.freeze([
        gainDataEffect("b43-data", "获得 3 个数据", 3),
        researchTechEffect("b43-blue-tech", "科技（只能选择蓝色）", ["blue"]),
      ]),
    }),
    "b_44.webp": withSource("b_44.webp", {
      cardType: 1,
      triggers: Object.freeze([
        {
          id: "b44-venus-publicity",
          event: Object.freeze({ type: "visitPlanet", includePlanetIds: ["venus"] }),
          effect: gainResourcesEffect("b44-venus-publicity-effect", "访问金星：1宣传", { publicity: 1 }),
        },
        {
          id: "b44-jupiter-data",
          event: Object.freeze({ type: "visitPlanet", includePlanetIds: ["jupiter"] }),
          effect: gainDataEffect("b44-jupiter-data-effect", "访问木星：1数据", 1),
        },
      ]),
    }),
    "b_45.webp": withSource("b_45.webp", {
      cardType: 3,
      playEffects: Object.freeze([
        effect("b45-public-scan", EFFECT_TYPES.PUBLIC_SCAN, "公共牌区扫描", "public_card_scan"),
      ]),
      endGameScoring: END_GAME_SCORING.SIGNAL_SECTORS,
    }),
    "b_46.webp": withSource("b_46.webp", {
      cardType: 2,
      playEffects: Object.freeze([
        researchTechEffect("b46-pink-tech", "科技（卡表粉色；当前科技板映射为紫色）", ["purple"]),
      ]),
      tasks: Object.freeze([{
        id: "b46-all-pink-task",
        condition: Object.freeze({ type: "allAliensHavePlayerTrace", traceType: "pink" }),
        rewards: Object.freeze([
          countAliensResourceEffect("b46-all-pink-reward", "每个外星人：2分+1能量", { score: 2, energy: 1 }),
        ]),
      }]),
    }),
    "b_47.webp": withSource("b_47.webp", {
      cardType: 0,
      playEffects: Object.freeze([
        countCurrentIncomeResourceEffect("b47-score-by-income", "当前每个信用收入：3分", "credits", "score", 3),
        tuckPlayedCardToIncomeEffect("b47-tuck-income", "将本卡放入收入区"),
      ]),
    }),
    "b_48.webp": withSource("b_48.webp", {
      cardType: 0,
      playEffects: Object.freeze([
        effect("b48-pick-corner", EFFECT_TYPES.PICK_CARD_CORNER_REWARD, "精选1张牌并获得其左上角奖励", "pick_card", {
          allowBlindDraw: false,
        }),
      ]),
    }),
    "b_49.webp": withSource("b_49.webp", {
      cardType: 0,
      playEffects: Object.freeze([
        registerEventBonusEffect("b49-visit-move-replacement", "本回合访问非地球行星可改得1移动", {
          duration: "turn",
          eventType: "visitPlanet",
          excludePlanetIds: ["earth"],
          replacePublicityWithMove: true,
          onceKey: "b49-visit-move-replacement",
          icon: "movement",
        }),
        cardMoveEffect("b49-move", "2移动", { movementPoints: 2 }),
      ]),
    }),
    "b_50.webp": withSource("b_50.webp", {
      cardType: 0,
      playEffects: Object.freeze([
        probeSectorScanEffect("b50-probe-sector-scan", "选择最多3个探测器，各扫描所在扇区", {
          owner: "any",
          maxTargets: 3,
        }),
      ]),
    }),
    "b_51.webp": withSource("b_51.webp", {
      cardType: 2,
      playEffects: Object.freeze([
        effect("b51-scan-action", EFFECT_TYPES.SCAN_ACTION, "扫描行动", "scan_action", { skipCost: true }),
      ]),
      tasks: Object.freeze([{
        id: "b51-three-pink-task",
        condition: Object.freeze({ type: "traceCount", traceType: "pink", count: 3 }),
        rewards: Object.freeze([
          alienTraceEffect("b51-pink-trace-reward", "3个粉色痕迹：获得1粉色痕迹", ["pink"]),
        ]),
      }]),
    }),
    "b_52.webp": withSource("b_52.webp", {
      cardType: 0,
      tasks: Object.freeze([{
        id: "b52-asteroid-probe-task",
        condition: Object.freeze({ type: "probeLocation", locationType: "asteroid" }),
        rewards: Object.freeze([
          alienTraceEffect("b52-yellow-trace", "探测器在小行星：获得1黄色痕迹", ["yellow"]),
        ]),
      }]),
    }),
    "b_53.webp": withSource("b_53.webp", {
      cardType: 2,
      playEffects: Object.freeze([
        probeSectorScanEffect("b53-probe-sector-scan", "选择1个己方探测器，扫描所在扇区"),
      ]),
      tasks: Object.freeze([{
        id: "b53-distinct-signal-task",
        condition: Object.freeze({ type: "distinctSignalSectors", count: 4 }),
        rewards: Object.freeze([
          gainResourcesEffect("b53-distinct-signal-reward", "4个不同扇区有信号：2宣传", { publicity: 2 }),
        ]),
      }]),
    }),
    "b_54.webp": withSource("b_54.webp", {
      cardType: 0,
      playEffects: Object.freeze([
        cardMoveEffect("b54-move", "1移动", { movementPoints: 1 }),
        probeSectorScanEffect("b54-probe-sector-scan", "选择1个己方探测器，扫描所在扇区"),
      ]),
    }),
    "b_55.webp": withSource("b_55.webp", {
      cardType: 0,
      playEffects: Object.freeze([
        effect("b55-shared-tech", EFFECT_TYPES.RESEARCH_TECH, "科技（只能选他人已研究科技，不旋转不拿bonus）", "research_tech", {
          skipCost: true,
          researchedByOthersOnly: true,
          skipRotate: true,
          skipBonus: true,
        }),
      ]),
    }),
    "b_56.webp": withSource("b_56.webp", {
      cardType: 0,
      playEffects: Object.freeze([
        gainResourcesEffect("b56-energy", "获得 1 能量", { energy: 1 }),
        researchTechEffect("b56-orange-tech", "科技（只能选择橙色）", ["orange"]),
      ]),
    }),
    "b_57.webp": withSource("b_57.webp", {
      cardType: 1,
      playEffects: Object.freeze([
        gainResourcesEffect("b57-publicity", "获得 1 宣传", { publicity: 1 }),
      ]),
      triggers: Object.freeze([
        {
          id: "b57-launch-credit",
          event: Object.freeze({ type: "launch" }),
          effect: gainResourcesEffect("b57-launch-credit-effect", "发射：1信用", { credits: 1 }),
        },
        {
          id: "b57-launch-pick",
          event: Object.freeze({ type: "launch" }),
          effect: pickCardEffect("b57-launch-pick-effect", "发射：精选1张牌"),
        },
        {
          id: "b57-launch-score",
          event: Object.freeze({ type: "launch" }),
          effect: gainResourcesEffect("b57-launch-score-effect", "发射：5分", { score: 5 }),
        },
      ]),
    }),
    "b_58.webp": withSource("b_58.webp", {
      cardType: 0,
      playEffects: Object.freeze([
        cardMoveEffect("b58-move", "1移动", { movementPoints: 1 }),
        probeSectorScanEffect("b58-probe-adjacent-scan", "选择1个己方探测器，扫描所在及相邻扇区", {
          includeAdjacent: true,
        }),
      ]),
    }),
    "b_59.webp": withSource("b_59.webp", {
      cardType: 1,
      triggers: Object.freeze([
        {
          id: "b59-orbit-publicity",
          event: Object.freeze({ type: "orbit" }),
          effect: gainResourcesEffect("b59-orbit-publicity-effect", "环绕：2宣传", { publicity: 2 }),
        },
        {
          id: "b59-land-publicity",
          event: Object.freeze({ type: "land" }),
          effect: gainResourcesEffect("b59-land-publicity-effect", "登陆：2宣传", { publicity: 2 }),
        },
      ]),
    }),
    "b_60.webp": withSource("b_60.webp", {
      cardType: 2,
      playEffects: Object.freeze([
        launchEffect("b60-launch", "发射"),
        gainDataEffect("b60-data", "获得 1 个数据", 1),
      ]),
      tasks: Object.freeze([{
        id: "b60-jupiter-task",
        condition: Object.freeze({ type: "planetOrbitOrLand", planetId: "jupiter" }),
        rewards: Object.freeze([
          gainResourcesEffect("b60-jupiter-reward", "木星环绕/登陆：7分+1宣传", { score: 7, publicity: 1 }),
        ]),
      }]),
    }),
    "b_61.webp": withSource("b_61.webp", {
      cardType: 2,
      playEffects: Object.freeze([
        planetSectorScanEffect("b61-jupiter-scan", "木星所在扇区扫描", "jupiter", { repeat: 2 }),
      ]),
      tasks: Object.freeze([{
        id: "b61-jupiter-task",
        condition: Object.freeze({ type: "planetOrbitOrLand", planetId: "jupiter" }),
        rewards: Object.freeze([
          gainResourcesEffect("b61-jupiter-reward", "木星环绕/登陆：4分", { score: 4 }),
        ]),
      }]),
    }),
    "b_62.webp": withSource("b_62.webp", {
      cardType: 0,
      playEffects: Object.freeze([
        cardMoveEffect("b62-move", "2移动；若访问木星获得4分", {
          movementPoints: 2,
          afterEventRewards: Object.freeze([{
            eventType: "visitPlanet",
            planetIds: Object.freeze(["jupiter"]),
            onceKey: "b62-jupiter-score",
            effect: gainResourcesEffect("b62-jupiter-score", "访问木星：4分", { score: 4 }),
          }]),
        }),
      ]),
    }),
    "b_63.webp": withSource("b_63.webp", {
      cardType: 3,
      playEffects: Object.freeze([
        effect("b63-kepler22-scan", EFFECT_TYPES.SCAN_NEBULA, "开普勒22扇区扫描", "yellow_scan", {
          nebulaId: "sector-3-a",
          gainData: true,
          repeat: 2,
        }),
      ]),
      endGameScoring: END_GAME_SCORING.YELLOW_SECTOR_WINS,
    }),
    "b_64.webp": withSource("b_64.webp", {
      cardType: 0,
      playEffects: Object.freeze([
        cardMoveEffect("b64-move", "1移动", { movementPoints: 1 }),
        probeSectorScanEffect("b64-probe-sector-scan", "选择1个己方探测器，扫描所在扇区两次", {
          repeat: 2,
        }),
      ]),
    }),
    "b_65.webp": withSource("b_65.webp", {
      cardType: 0,
      playEffects: Object.freeze([
        gainDataEffect("b65-data", "获得 1 个数据", 1),
        researchTechEffect("b65-blue-tech", "科技（只能选择蓝色）", ["blue"]),
      ]),
    }),
    "b_66.webp": withSource("b_66.webp", {
      cardType: 0,
      playEffects: Object.freeze([
        registerEventBonusEffect("b66-distinct-planet-score", "本回合每个不同星球访问：1分", {
          duration: "turn",
          eventType: "visitPlanet",
          distinctBy: "planetId",
          icon: "score",
          rewards: [gainResourcesEffect("b66-planet-score", "访问不同星球：1分", { score: 1 })],
        }),
        cardMoveEffect("b66-move", "4移动", { movementPoints: 4 }),
      ]),
    }),
    "b_67.webp": withSource("b_67.webp", {
      cardType: 2,
      playEffects: Object.freeze([
        gainResourcesEffect("b67-publicity", "获得 3 宣传", { publicity: 3 }),
      ]),
      tasks: Object.freeze([{
        id: "b67-three-traces-task",
        condition: Object.freeze({ type: "singleAlienTraceSet", traceTypes: ["yellow", "pink", "blue"] }),
        rewards: Object.freeze([
          alienTraceEffect("b67-any-trace-reward", "同一外星人三色痕迹：在该外星人获得任意痕迹", null, {
            targetRule: "singleAlienTraceSet",
          }),
        ]),
      }]),
    }),
    "b_68.webp": withSource("b_68.webp", {
      cardType: 2,
      playEffects: Object.freeze([
        gainDataEffect("b68-data", "获得 1 个数据", 1),
        effect("b68-scan-action", EFFECT_TYPES.SCAN_ACTION, "扫描行动", "scan_action", { skipCost: true }),
      ]),
      tasks: Object.freeze([{
        id: "b68-publicity-task",
        condition: Object.freeze({ type: "resourceThreshold", resource: "publicity", count: 8 }),
        rewards: Object.freeze([
          gainResourcesEffect("b68-publicity-score", "宣传达到8：3分", { score: 3 }),
          pickCardEffect("b68-publicity-pick", "宣传达到8：精选1张牌"),
        ]),
      }]),
    }),
    "b_69.webp": withSource("b_69.webp", {
      cardType: 0,
      playEffects: Object.freeze([
        launchEffect("b69-launch", "发射"),
      ]),
    }),
    "b_70.webp": withSource("b_70.webp", {
      cardType: 0,
      playEffects: Object.freeze([
        gainResourcesEffect("b70-energy", "获得 1 能量", { energy: 1 }),
        researchTechEffect("b70-blue-tech", "科技（只能选择蓝色）", ["blue"]),
      ]),
    }),
    "b_71.webp": withSource("b_71.webp", {
      cardType: 1,
      triggers: Object.freeze([
        { id: "b71-mercury-draw", event: Object.freeze({ type: "visitPlanet", planetIds: ["mercury"] }), effect: drawCardsEffect("b71-mercury-draw-effect", "访问水星：1盲抽", 1) },
        { id: "b71-venus-publicity", event: Object.freeze({ type: "visitPlanet", planetIds: ["venus"] }), effect: gainResourcesEffect("b71-venus-publicity-effect", "访问金星：1宣传", { publicity: 1 }) },
      ]),
    }),
    "b_72.webp": withSource("b_72.webp", {
      cardType: 2,
      playEffects: Object.freeze([planetSectorScanEffect("b72-mars-scan", "火星所在扇区扫描", "mars", { repeat: 2 })]),
      tasks: Object.freeze([{ id: "b72-mars-task", condition: Object.freeze({ type: "planetOrbitOrLand", planetId: "mars" }), rewards: Object.freeze([gainResourcesEffect("b72-mars-score", "火星环绕/登陆：4分", { score: 4 })]) }]),
    }),
    "b_73.webp": withSource("b_73.webp", {
      cardType: 0,
      playEffects: Object.freeze([cardMoveEffect("b73-move", "2移动；若访问火星获得4分", { movementPoints: 2, afterEventRewards: [{ eventType: "visitPlanet", planetIds: ["mars"], onceKey: "b73-mars-score", effect: gainResourcesEffect("b73-mars-score", "访问火星：4分", { score: 4 }) }] })]),
    }),
    "b_74.webp": withSource("b_74.webp", {
      cardType: 3,
      playEffects: Object.freeze([gainResourcesEffect("b74-publicity", "获得 1 宣传", { publicity: 1 }), gainDataEffect("b74-data", "获得 2 个数据", 2)]),
      endGameScoring: END_GAME_SCORING.MARS_ORBIT_OR_LAND,
    }),
    "b_75.webp": withSource("b_75.webp", {
      cardType: 2,
      playEffects: Object.freeze([planetSectorScanEffect("b75-mercury-scan", "水星所在扇区扫描", "mercury", { repeat: 2 })]),
      tasks: Object.freeze([{ id: "b75-mercury-task", condition: Object.freeze({ type: "planetOrbitOrLand", planetId: "mercury" }), rewards: Object.freeze([gainResourcesEffect("b75-mercury-score", "水星环绕/登陆：4分", { score: 4 })]) }]),
    }),
    "b_76.webp": withSource("b_76.webp", {
      cardType: 0,
      playEffects: Object.freeze([cardMoveEffect("b76-move", "2移动；若访问水星获得4分", { movementPoints: 2, afterEventRewards: [{ eventType: "visitPlanet", planetIds: ["mercury"], onceKey: "b76-mercury-score", effect: gainResourcesEffect("b76-mercury-score", "访问水星：4分", { score: 4 }) }] })]),
    }),
    "b_77.webp": withSource("b_77.webp", {
      cardType: 2,
      playEffects: Object.freeze([launchEffect("b77-launch", "发射"), cardMoveEffect("b77-move", "1移动", { movementPoints: 1 })]),
      tasks: Object.freeze([{ id: "b77-mercury-task", condition: Object.freeze({ type: "planetOrbitOrLand", planetId: "mercury" }), rewards: Object.freeze([gainResourcesEffect("b77-mercury-reward", "水星环绕/登陆：7分+1宣传", { score: 7, publicity: 1 })]) }]),
    }),
    "b_78.webp": withSource("b_78.webp", {
      cardType: 1,
      playEffects: Object.freeze([gainResourcesEffect("b78-publicity", "获得 1 宣传", { publicity: 1 })]),
      triggers: Object.freeze(["pink", "yellow", "blue"].map((color) => ({ id: `b78-${color}-signal-data`, event: Object.freeze({ type: "signalMarked", color }), effect: gainDataEffect(`b78-${color}-signal-data-effect`, "标记信号：1数据", 1) }))),
    }),
    "b_79.webp": withSource("b_79.webp", {
      cardType: 0,
      playEffects: Object.freeze([
        gainResourcesEffect("b79-publicity", "获得 2 宣传", { publicity: 2 }),
        countCurrentIncomeResourceEffect("b79-blind-income-publicity", "每个非默认盲抽收入：1宣传", "blindDraw", "publicity", 1),
        tuckPlayedCardToIncomeEffect("b79-income", "将本卡放入收入区"),
      ]),
    }),
    "b_80.webp": withSource("b_80.webp", {
      cardType: 1,
      triggers: Object.freeze([
        { id: "b80-orange-tech-energy", event: Object.freeze({ type: "researchTech", techType: "orange" }), effect: gainResourcesEffect("b80-orange-tech-energy-effect", "橙色科技：1能量", { energy: 1 }) },
        { id: "b80-purple-tech-publicity", event: Object.freeze({ type: "researchTech", techType: "purple" }), effect: gainResourcesEffect("b80-purple-tech-publicity-effect", "紫色科技：1宣传", { publicity: 1 }) },
        { id: "b80-blue-tech-pick", event: Object.freeze({ type: "researchTech", techType: "blue" }), effect: pickCardEffect("b80-blue-tech-pick-effect", "蓝色科技：精选1张牌") },
      ]),
    }),
    "b_81.webp": withSource("b_81.webp", {
      cardType: 2,
      playEffects: Object.freeze([gainResourcesEffect("b81-publicity", "获得 2 宣传", { publicity: 2 })]),
      tasks: Object.freeze([{ id: "b81-earth-adjacent-asteroid-task", condition: Object.freeze({ type: "probeAdjacentEarthAsteroid" }), rewards: Object.freeze([gainResourcesEffect("b81-score", "地球相邻小行星探测器：5分", { score: 5 }), pickCardEffect("b81-pick", "地球相邻小行星探测器：精选1张牌")]) }]),
    }),
    "b_82.webp": withSource("b_82.webp", {
      cardType: 3,
      playEffects: Object.freeze([gainResourcesEffect("b82-publicity", "获得 2 宣传", { publicity: 2 })]),
      endGameScoring: END_GAME_SCORING.ASTEROID_PROBE,
    }),
    "b_83.webp": withSource("b_83.webp", {
      cardType: 2,
      playEffects: Object.freeze([drawCardsEffect("b83-draw", "盲抽 3 张牌", 3)]),
      tasks: Object.freeze([{ id: "b83-empty-hand-task", condition: Object.freeze({ type: "handEmpty" }), rewards: Object.freeze([pickCardEffect("b83-pick", "空手牌：精选1张牌")]) }]),
    }),
    "b_84.webp": withSource("b_84.webp", {
      cardType: 0,
      playEffects: Object.freeze([gainResourcesEffect("b84-publicity", "获得 1 宣传", { publicity: 1 }), effect("b84-scan-action", EFFECT_TYPES.SCAN_ACTION, "扫描行动", "scan_action", { skipCost: true })]),
    }),
    "b_85.webp": withSource("b_85.webp", {
      cardType: 2,
      playEffects: Object.freeze([researchTechEffect("b85-orange-tech", "科技（只能选择橙色）", ["orange"])]),
      tasks: Object.freeze([{ id: "b85-outer-planets-task", condition: Object.freeze({ type: "planetOrbitOrLandAll", planetIds: ["neptune", "uranus"] }), rewards: Object.freeze([gainResourcesEffect("b85-score", "海王星和天王星环绕/登陆：5分", { score: 5 }), pickCardEffect("b85-pick", "海王星和天王星环绕/登陆：精选1张牌")]) }]),
    }),
    "b_86.webp": withSource("b_86.webp", {
      cardType: 3,
      playEffects: Object.freeze([researchTechEffect("b86-purple-tech", "科技（只能选择紫色）", ["purple"])]),
      endGameScoring: END_GAME_SCORING.PINK_TRACES,
    }),
    "b_87.webp": withSource("b_87.webp", {
      cardType: 0,
      playEffects: Object.freeze([launchEffect("b87-launch", "发射"), earthSectorContentMoveEffect("b87-earth-sector-move", "地球扇区每个其他行星或彗星：1移动")]),
    }),
    "b_88.webp": withSource("b_88.webp", {
      cardType: 0,
      playEffects: Object.freeze([probeSectorScanEffect("b88-probe-sector-scan", "选择己方探测器所在扇区扫描", { returnToHandIfSignalCount: 1 })]),
    }),
    "b_89.webp": withSource("b_89.webp", {
      cardType: 0,
      playEffects: Object.freeze([probeLocationRewardEffect("b89-probe-asteroid-data", "选择己方探测器按小行星位置获得数据", { asteroidData: 2, adjacentAsteroidData: 1 })]),
    }),
    "b_90.webp": withSource("b_90.webp", {
      cardType: 0,
      playEffects: Object.freeze([
        registerEventBonusEffect("b90-red-signal-score", "本次扫描行动红色信号：2分", { duration: "flow", eventType: "signalMarked", color: "red", icon: "score", rewards: [gainResourcesEffect("b90-red-signal-score-effect", "红色信号：2分", { score: 2 })] }),
        effect("b90-scan-action", EFFECT_TYPES.SCAN_ACTION, "扫描行动", "scan_action", { skipCost: true }),
      ]),
    }),
    "b_91.webp": withSource("b_91.webp", {
      cardType: 0,
      playEffects: Object.freeze([cardLandEffect("b91-land", "登陆；火星/水星/卫星奖励4分", { afterLandRewards: [{ planetIds: ["mars", "mercury"], includeSatellites: true, effect: gainResourcesEffect("b91-land-score", "指定目标登陆：4分", { score: 4 }) }] })]),
    }),
    "b_92.webp": withSource("b_92.webp", {
      cardType: 1,
      triggers: Object.freeze([
        { id: "b92-jupiter-data", event: Object.freeze({ type: "visitPlanet", planetIds: ["jupiter"] }), effect: gainDataEffect("b92-jupiter-data-effect", "访问木星：1数据", 1) },
        { id: "b92-saturn-score", event: Object.freeze({ type: "visitPlanet", planetIds: ["saturn"] }), effect: gainResourcesEffect("b92-saturn-score-effect", "访问土星：4分", { score: 4 }) },
      ]),
    }),
    "b_93.webp": withSource("b_93.webp", {
      cardType: 0,
      playEffects: Object.freeze([effect("b93-blue-tech", EFFECT_TYPES.RESEARCH_TECH, "科技（只能选择蓝色），按宣传得分", "research_tech", { skipCost: true, techTypes: ["blue"], afterResearchReward: Object.freeze({ kind: "resourceValueScore", resource: "publicity" }) })]),
    }),
    "b_94.webp": withSource("b_94.webp", {
      cardType: 0,
      playEffects: Object.freeze([drawCardsEffect("b94-draw", "盲抽 1 张牌", 1), optionalDiscardScanEffect("b94-optional-scans", "可执行至多3次弃牌扫描", 3)]),
    }),
    "b_95.webp": withSource("b_95.webp", {
      cardType: 2,
      playEffects: Object.freeze([researchTechEffect("b95-orange-tech", "科技（只能选择橙色）", ["orange"])]),
      tasks: Object.freeze([{ id: "b95-same-planet-orbit-land-task", condition: Object.freeze({ type: "samePlanetOrbitAndLand" }), rewards: Object.freeze([gainResourcesEffect("b95-score", "同星球环绕且登陆：3分", { score: 3 }), gainDataEffect("b95-data", "同星球环绕且登陆：1数据", 1)]) }]),
    }),
    "b_96.webp": withSource("b_96.webp", {
      cardType: 0,
      playEffects: Object.freeze([probeSectorScanEffect("b96-probe-sector-scan", "选择己方探测器所在扇区扫描3次（不获得数据）", { repeat: 3, gainData: false })]),
    }),
    "b_97.webp": withSource("b_97.webp", {
      cardType: 1,
      playEffects: Object.freeze([gainResourcesEffect("b97-publicity", "获得 1 宣传", { publicity: 1 })]),
      triggers: Object.freeze(["orange", "purple", "blue"].map((techType) => ({ id: `b97-${techType}-tech-publicity`, event: Object.freeze({ type: "researchTech", techType }), effect: gainResourcesEffect(`b97-${techType}-tech-publicity-effect`, "获得科技：2宣传", { publicity: 2 }) }))),
    }),
    "b_98.webp": withSource("b_98.webp", {
      cardType: 0,
      playEffects: Object.freeze([launchEffect("b98-launch", "发射"), countHandCornerMoveEffect("b98-hand-move-corners", "手牌每张移动角标：1免费移动")]),
    }),
    "b_99.webp": withSource("b_99.webp", {
      cardType: 0,
      playEffects: Object.freeze([gainResourcesEffect("b99-publicity", "获得 3 宣传", { publicity: 3 })]),
    }),
    "b_100.webp": withSource("b_100.webp", {
      cardType: 3,
      playEffects: Object.freeze([effect("b100-procyon-scan", EFFECT_TYPES.SCAN_NEBULA, "南河三扫描", "blue_scan", { nebulaId: "sector-1-a", gainData: true, repeat: 2 })]),
      endGameScoring: END_GAME_SCORING.BLUE_SECTOR_WINS,
    }),
    "b_101.webp": withSource("b_101.webp", {
      cardType: 2,
      playEffects: Object.freeze([researchTechEffect("b101-orange-tech", "科技（只能选择橙色）", ["orange"])]),
      tasks: Object.freeze([{ id: "b101-distance-task", condition: Object.freeze({ type: "probeDistanceFromEarth", minDistance: 5 }), rewards: Object.freeze([gainResourcesEffect("b101-score-energy", "远离地球探测器：3分+1能量", { score: 3, energy: 1 })]) }]),
    }),
    "b_102.webp": withSource("b_102.webp", {
      cardType: 2,
      playEffects: Object.freeze([effect("b102-proxima-scan", EFFECT_TYPES.SCAN_NEBULA, "比邻星扫描", "red_scan", { nebulaId: "sector-3-b", gainData: true, repeat: 2 })]),
      tasks: Object.freeze([{ id: "b102-red-sectors-task", condition: Object.freeze({ type: "completedSectorsByColor", color: "red", count: 2 }), rewards: Object.freeze([gainResourcesEffect("b102-score-publicity", "完成2个红色扇区：4分+1宣传", { score: 4, publicity: 1 })]) }]),
    }),
    "b_103.webp": withSource("b_103.webp", {
      cardType: 2,
      playEffects: Object.freeze([researchTechEffect("b103-blue-tech", "科技（只能选择蓝色）", ["blue"])]),
      tasks: Object.freeze([{ id: "b103-score-task", condition: Object.freeze({ type: "resourceThreshold", resource: "score", count: 50 }), rewards: Object.freeze([effect("b103-income", "income", "至少50分：收入", "income")]) }]),
    }),
    "b_104.webp": withSource("b_104.webp", {
      cardType: 2,
      playEffects: Object.freeze([researchTechEffect("b104-purple-tech", "科技（只能选择紫色）", ["purple"])]),
      tasks: Object.freeze([{ id: "b104-orbit-count-task", condition: Object.freeze({ type: "orbitCount", count: 2 }), rewards: Object.freeze([gainDataEffect("b104-data", "2个环绕：2数据", 2)]) }]),
    }),
    "b_105.webp": withSource("b_105.webp", {
      cardType: 2,
      playEffects: Object.freeze([launchEffect("b105-launch", "发射")]),
      tasks: Object.freeze([{ id: "b105-comet-task", condition: Object.freeze({ type: "probeLocation", locationType: "comet" }), rewards: Object.freeze([gainResourcesEffect("b105-score", "彗星探测器：3分", { score: 3 }), gainDataEffect("b105-data", "彗星探测器：1数据", 1)]) }]),
    }),
    "b_106.webp": withSource("b_106.webp", {
      cardType: 0,
      playEffects: Object.freeze([
        removePlanetMarkerEffect("b106-remove-lander", "移除己方登陆标记", { owner: "current", markerKinds: ["land", "satelliteLand"] }),
        alienTraceEffect("b106-yellow-trace", "获得黄色外星人痕迹", ["yellow"]),
      ]),
    }),
    "b_107.webp": withSource("b_107.webp", {
      cardType: 2,
      playEffects: Object.freeze([planetSectorScanEffect("b107-saturn-scan", "土星所在扇区扫描", "saturn", { repeat: 2 })]),
      tasks: Object.freeze([{ id: "b107-saturn-task", condition: Object.freeze({ type: "planetOrbitOrLand", planetId: "saturn" }), rewards: Object.freeze([gainResourcesEffect("b107-score", "土星环绕/登陆：4分", { score: 4 })]) }]),
    }),
    "b_108.webp": withSource("b_108.webp", {
      cardType: 0,
      playEffects: Object.freeze([cardMoveEffect("b108-move", "3移动；若访问土星获得6分", { movementPoints: 3, afterEventRewards: [{ eventType: "visitPlanet", planetIds: ["saturn"], onceKey: "b108-saturn-score", effect: gainResourcesEffect("b108-score", "访问土星：6分", { score: 6 }) }] })]),
    }),
    "b_109.webp": withSource("b_109.webp", {
      cardType: 0,
      playEffects: Object.freeze([effect("b109-any-tech", EFFECT_TYPES.RESEARCH_TECH, "科技；非首次拿取额外2宣传", "research_tech", { skipCost: true, afterResearchReward: Object.freeze({ kind: "publicityIfNotFirstTake", publicity: 2 }) })]),
    }),
    "b_110.webp": withSource("b_110.webp", {
      cardType: 0,
      playEffects: Object.freeze([gainDataEffect("b110-data", "获得 2 个数据", 2)]),
    }),
    "b_111.webp": withSource("b_111.webp", {
      cardType: 1,
      playEffects: Object.freeze([gainResourcesEffect("b111-publicity", "获得 1 宣传", { publicity: 1 })]),
      triggers: Object.freeze([
        { id: "b111-scan-data", event: Object.freeze({ type: "scanAction" }), effect: gainDataEffect("b111-scan-data-effect", "扫描行动：2数据", 2) },
        { id: "b111-scan-draw", event: Object.freeze({ type: "scanAction" }), effect: drawCardsEffect("b111-scan-draw-effect", "扫描行动：1盲抽", 1) },
        { id: "b111-scan-score", event: Object.freeze({ type: "scanAction" }), effect: gainResourcesEffect("b111-scan-score-effect", "扫描行动：4分", { score: 4 }) },
      ]),
    }),
    "b_112.webp": withSource("b_112.webp", {
      cardType: 0,
      playEffects: Object.freeze([conditionalRewardEffect("b112-publicity-trace", "若宣传至少8：获得粉色痕迹", { type: "resourceThreshold", resource: "publicity", count: 8 }, [alienTraceEffect("b112-pink-trace", "获得粉色外星人痕迹", ["pink"])])]),
    }),
    "b_113.webp": withSource("b_113.webp", {
      cardType: 3,
      playEffects: Object.freeze([researchTechEffect("b113-orange-tech", "科技（只能选择橙色）", ["orange"])]),
      endGameScoring: END_GAME_SCORING.YELLOW_TRACES,
    }),
    "b_114.webp": withSource("b_114.webp", {
      cardType: 2,
      playEffects: Object.freeze([effect("b114-sirius-scan", EFFECT_TYPES.SCAN_NEBULA, "天狼星A扫描", "blue_scan", { nebulaId: "sector-2-a", gainData: true, repeat: 2 })]),
      tasks: Object.freeze([{ id: "b114-blue-sectors-task", condition: Object.freeze({ type: "completedSectorsByColor", color: "blue", count: 2 }), rewards: Object.freeze([gainResourcesEffect("b114-score-publicity", "完成2个蓝色扇区：4分+1宣传", { score: 4, publicity: 1 })]) }]),
    }),
    "b_115.webp": withSource("b_115.webp", {
      cardType: 3,
      playEffects: Object.freeze([gainResourcesEffect("b115-publicity", "获得 2 宣传", { publicity: 2 })]),
      endGameScoring: END_GAME_SCORING.UNMARKED_FINAL_RIGHTMOST,
    }),
    "b_116.webp": withSource("b_116.webp", {
      cardType: 2,
      playEffects: Object.freeze([launchEffect("b116-launch", "发射"), cardMoveEffect("b116-move", "1移动", { movementPoints: 1 })]),
      tasks: Object.freeze([{ id: "b116-landing-count-task", condition: Object.freeze({ type: "landingCount", count: 3 }), rewards: Object.freeze([gainResourcesEffect("b116-credit", "3个登陆：1信用", { credits: 1 })]) }]),
    }),
    "b_117.webp": withSource("b_117.webp", {
      cardType: 2,
      playEffects: Object.freeze([launchEffect("b117-launch", "发射"), gainResourcesEffect("b117-publicity", "获得 2 宣传", { publicity: 2 })]),
      tasks: Object.freeze([{ id: "b117-orbit-land-count-task", condition: Object.freeze({ type: "orbitOrLandCount", count: 5 }), rewards: Object.freeze([gainResourcesEffect("b117-score-credit", "5个环绕/登陆：3分+1信用", { score: 3, credits: 1 })]) }]),
    }),
    "b_118.webp": withSource("b_118.webp", {
      cardType: 0,
      playEffects: Object.freeze([
        registerEventBonusEffect("b118-distinct-scan-sector-score", "本卡扫描不同扇区：2分", { duration: "flow", eventType: "signalMarked", distinctBy: "sectorX", icon: "score", rewards: [gainResourcesEffect("b118-sector-score", "不同扫描扇区：2分", { score: 2 })] }),
        effect("b118-public-scan", EFFECT_TYPES.PUBLIC_SCAN, "公共牌区扫描", "public_card_scan", { repeat: 3 }),
      ]),
    }),
    "b_119.webp": withSource("b_119.webp", {
      cardType: 0,
      playEffects: Object.freeze([launchEffect("b119-launch", "发射"), researchTechEffect("b119-orange-tech", "科技（只能选择橙色）", ["orange"])]),
    }),
    "b_120.webp": withSource("b_120.webp", {
      cardType: 1,
      triggers: Object.freeze([
        { id: "b120-price1-score", event: Object.freeze({ type: "playCard", price: 1 }), effect: gainResourcesEffect("b120-price1-score-effect", "打出1费牌：2分", { score: 2 }) },
        { id: "b120-price2-pick", event: Object.freeze({ type: "playCard", price: 2 }), effect: pickCardEffect("b120-price2-pick-effect", "打出2费牌：精选1张牌") },
        { id: "b120-price3-publicity", event: Object.freeze({ type: "playCard", price: 3 }), effect: gainResourcesEffect("b120-price3-publicity-effect", "打出3费牌：2宣传", { publicity: 2 }) },
      ]),
    }),
    "b_121.webp": withSource("b_121.webp", {
      cardType: 2,
      playEffects: Object.freeze([gainResourcesEffect("b121-publicity", "获得 1 宣传", { publicity: 1 }), gainDataEffect("b121-data", "获得 1 个数据", 1), drawCardsEffect("b121-draw", "盲抽 1 张牌", 1)]),
      tasks: Object.freeze([{ id: "b121-yellow-traces-task", condition: Object.freeze({ type: "traceCount", traceType: "yellow", count: 3 }), rewards: Object.freeze([alienTraceEffect("b121-yellow-trace", "获得黄色外星人痕迹", ["yellow"])]) }]),
    }),
    "b_122.webp": withSource("b_122.webp", {
      cardType: 1,
      playEffects: Object.freeze([pickCardEffect("b122-pick", "精选1张牌")]),
      triggers: Object.freeze([
        { id: "b122-purple-tech-publicity", event: Object.freeze({ type: "researchTech", techType: "purple" }), effect: gainResourcesEffect("b122-purple-tech-publicity-effect", "紫色科技：1宣传", { publicity: 1 }) },
        { id: "b122-scan-data", event: Object.freeze({ type: "scanAction" }), effect: gainDataEffect("b122-scan-data-effect", "扫描行动：1数据", 1) },
      ]),
    }),
    "b_123.webp": withSource("b_123.webp", {
      cardType: 1,
      triggers: Object.freeze([
        { id: "b123-scan-yellow", event: Object.freeze({ type: "scanAction" }), effect: effect("b123-yellow-scan-effect", EFFECT_TYPES.SCAN_COLOR_CHOICE, "扫描行动：黄色扇区扫描", "yellow_scan", { color: "yellow", gainData: true }) },
        { id: "b123-scan-red", event: Object.freeze({ type: "scanAction" }), effect: effect("b123-red-scan-effect", EFFECT_TYPES.SCAN_COLOR_CHOICE, "扫描行动：红色扇区扫描", "red_scan", { color: "red", gainData: true }) },
        { id: "b123-scan-blue", event: Object.freeze({ type: "scanAction" }), effect: effect("b123-blue-scan-effect", EFFECT_TYPES.SCAN_COLOR_CHOICE, "扫描行动：蓝色扇区扫描", "blue_scan", { color: "blue", gainData: true }) },
      ]),
    }),
    "b_124.webp": withSource("b_124.webp", {
      cardType: 0,
      playEffects: Object.freeze([cardMoveEffect("b124-move", "2移动（无视小行星出入限制）", { movementPoints: 2, ignoreAsteroidRestriction: true })]),
    }),
    "b_125.webp": withSource("b_125.webp", {
      cardType: 0,
      playEffects: Object.freeze([cardMoveEffect("b125-move", "1移动；同环移动奖励3分+1宣传", { movementPoints: 1, sameRingReward: gainResourcesEffect("b125-same-ring-reward", "同环移动：3分+1宣传", { score: 3, publicity: 1 }) })]),
    }),
    "b_126.webp": withSource("b_126.webp", {
      cardType: 2,
      playEffects: Object.freeze([launchEffect("b126-launch", "发射")]),
      tasks: Object.freeze([{ id: "b126-neptune-task", condition: Object.freeze({ type: "planetOrbitOrLand", planetId: "neptune" }), rewards: Object.freeze([gainResourcesEffect("b126-score", "海王星环绕/登陆：4分", { score: 4 }), gainDataEffect("b126-data", "海王星环绕/登陆：1数据", 1)]) }]),
    }),
    "b_127.webp": withSource("b_127.webp", {
      cardType: 2,
      playEffects: Object.freeze([launchEffect("b127-launch", "发射")]),
      tasks: Object.freeze([{ id: "b127-uranus-task", condition: Object.freeze({ type: "planetOrbitOrLand", planetId: "uranus" }), rewards: Object.freeze([gainResourcesEffect("b127-score", "天王星环绕/登陆：3分", { score: 3 }), drawCardsEffect("b127-draw", "天王星环绕/登陆：1盲抽", 1)]) }]),
    }),
    "b_128.webp": withSource("b_128.webp", {
      cardType: 3,
      playEffects: Object.freeze([effect("b128-vega-scan", EFFECT_TYPES.SCAN_NEBULA, "织女一扫描", "black_scan", { nebulaId: "sector-1-b", gainData: true })]),
      endGameScoring: END_GAME_SCORING.BLACK_SECTOR_WINS,
    }),
    "b_129.webp": withSource("b_129.webp", {
      cardType: 2,
      playEffects: Object.freeze([launchEffect("b129-launch", "发射"), gainResourcesEffect("b129-publicity", "获得 1 宣传", { publicity: 1 })]),
      tasks: Object.freeze([{ id: "b129-venus-task", condition: Object.freeze({ type: "planetOrbitOrLand", planetId: "venus" }), rewards: Object.freeze([gainResourcesEffect("b129-venus-reward", "金星环绕/登陆：7分+1宣传", { score: 7, publicity: 1 })]) }]),
    }),
    "b_130.webp": withSource("b_130.webp", {
      cardType: 2,
      playEffects: Object.freeze([planetSectorScanEffect("b130-venus-scan", "金星所在扇区扫描", "venus", { repeat: 2 })]),
      tasks: Object.freeze([{ id: "b130-venus-task", condition: Object.freeze({ type: "planetOrbitOrLand", planetId: "venus" }), rewards: Object.freeze([gainResourcesEffect("b130-score", "金星环绕/登陆：4分", { score: 4 })]) }]),
    }),
    "b_131.webp": withSource("b_131.webp", {
      cardType: 0,
      playEffects: Object.freeze([cardMoveEffect("b131-move", "2移动；若访问金星获得3分", { movementPoints: 2, afterEventRewards: [{ eventType: "visitPlanet", planetIds: ["venus"], onceKey: "b131-venus-score", effect: gainResourcesEffect("b131-score", "访问金星：3分", { score: 3 }) }] })]),
    }),
    "b_132.webp": withSource("b_132.webp", {
      cardType: 0,
      playEffects: Object.freeze([registerEventBonusEffect("b132-blue-signal-score", "本次扫描行动蓝色信号：2分", { duration: "flow", eventType: "signalMarked", color: "blue", icon: "score", rewards: [gainResourcesEffect("b132-score", "蓝色信号：2分", { score: 2 })] }), effect("b132-scan-action", EFFECT_TYPES.SCAN_ACTION, "扫描行动", "scan_action", { skipCost: true })]),
    }),
    "b_133.webp": withSource("b_133.webp", {
      cardType: 0,
      playEffects: Object.freeze([effect("b133-public-scan", EFFECT_TYPES.PUBLIC_SCAN, "公共牌区扫描", "public_card_scan", { repeat: 2 })]),
      temporaryTasks: Object.freeze([{ id: "b133-complete-sector-data", condition: Object.freeze({ type: "sectorCompletedDuringCard", count: 1 }), rewards: Object.freeze([gainDataEffect("b133-data", "完成扇区：1数据", 1)]) }]),
    }),
    "b_134.webp": withSource("b_134.webp", {
      cardType: 1,
      triggers: Object.freeze([
        { id: "b134-uranus-energy", event: Object.freeze({ type: "visitPlanet", planetIds: ["uranus"] }), effect: gainResourcesEffect("b134-energy", "访问天王星：1能量", { energy: 1 }) },
        { id: "b134-neptune-credit", event: Object.freeze({ type: "visitPlanet", planetIds: ["neptune"] }), effect: gainResourcesEffect("b134-credit", "访问海王星：1信用", { credits: 1 }) },
      ]),
    }),
    "b_135.webp": withSource("b_135.webp", {
      cardType: 2,
      playEffects: Object.freeze([researchTechEffect("b135-purple-tech", "科技（只能选择紫色）", ["purple"])]),
      tasks: Object.freeze([{ id: "b135-same-color-sectors-task", condition: Object.freeze({ type: "completedSameSectorColor", count: 2 }), rewards: Object.freeze([gainResourcesEffect("b135-score", "完成2个同色扇区：9分", { score: 9 })]) }]),
    }),
    "b_136.webp": withSource("b_136.webp", {
      cardType: 0,
      playEffects: Object.freeze([gainResourcesEffect("b136-publicity", "获得 1 宣传", { publicity: 1 }), planetSectorScanEffect("b136-earth-sector-scan", "地球所在扇区扫描", "earth", { repeat: 2 })]),
    }),
    "b_137.webp": withSource("b_137.webp", {
      cardType: 0,
      playEffects: Object.freeze([gainResourcesEffect("b137-publicity", "获得 1 宣传", { publicity: 1 }), researchTechEffect("b137-purple-tech", "科技（只能选择紫色）", ["purple"]), handScanEffect("b137-hand-scan", "执行一次手牌扫描")]),
    }),
    "b_138.webp": withSource("b_138.webp", {
      cardType: 1,
      playEffects: Object.freeze([launchEffect("b138-launch", "发射")]),
      triggers: Object.freeze([
        { id: "b138-orbit-land-launch", event: Object.freeze({ types: ["orbit", "land"] }), effect: launchEffect("b138-trigger-launch", "环绕或登陆：发射") },
        { id: "b138-orbit-land-energy", event: Object.freeze({ types: ["orbit", "land"] }), effect: gainResourcesEffect("b138-energy", "环绕或登陆：1能量", { energy: 1 }) },
      ]),
    }),
    "b_139.webp": withSource("b_139.webp", {
      cardType: 0,
      reserveAfterPlay: true,
      displayRow: "bottom",
      countsAsType3: false,
      playEffects: Object.freeze([plutoReserveEffect("b139-pluto-reserve", "冥王星环绕/登陆能力启用")]),
      pluto: Object.freeze({ orbit: true, land: true }),
    }),
    "b_140.webp": withSource("b_140.webp", {
      cardType: 1,
      triggers: Object.freeze([
        { id: "b140-mars-orbit-land-publicity", event: Object.freeze({ types: ["orbit", "land"], planetIds: ["mars"] }), effect: gainResourcesEffect("b140-publicity", "火星环绕/登陆：2宣传", { publicity: 2 }) },
        { id: "b140-mars-orbit-land-score", event: Object.freeze({ types: ["orbit", "land"], planetIds: ["mars"] }), effect: gainResourcesEffect("b140-score", "火星环绕/登陆：5分", { score: 5 }) },
      ]),
    }),
    "dlc_1.png": withSource("dlc_1.png", {
      cardType: 0,
      playEffects: Object.freeze([
        cardLandEffect("dlc1-land", "登陆", { rememberPreLandingOwnMarker: true }),
        returnPlayedCardToHandIfEffect("dlc1-return", "若登陆前该星球已有自己的登陆标记，本卡回手", { type: "lastLandingHadOwnMarker" }),
      ]),
    }),
    "dlc_2.png": withSource("dlc_2.png", {
      cardType: 0,
      playEffects: Object.freeze([chooseHandCornerRewardEffect("dlc2-hand-corner", "按手牌角标选择奖励")]),
    }),
    "dlc_3.png": withSource("dlc_3.png", {
      cardType: 0,
      playEffects: Object.freeze([gainResourcesEffect("dlc3-public-scan-markers", "获得 3 个公共牌区扫描标记", { additionalPublicScan: 3 })]),
    }),
    "dlc_4.png": withSource("dlc_4.png", {
      cardType: 0,
      playEffects: Object.freeze([
        gainResourcesEffect("dlc4-public-scan-marker", "获得 1 个公共牌区扫描标记", { additionalPublicScan: 1 }),
        cardMoveEffect("dlc4-move", "1移动"),
      ]),
    }),
    "dlc_5.png": withSource("dlc_5.png", {
      cardType: 0,
      playEffects: Object.freeze([
        gainDataEffect("dlc5-data", "获得 1 数据", 1),
        cardMoveEffect("dlc5-move", "1移动"),
        returnPlayedCardToHandIfEffect("dlc5-return", "若自己有探测器在地球相邻位置，本卡回手", { type: "probeAdjacentEarth" }),
      ]),
    }),
    "dlc_6.png": withSource("dlc_6.png", {
      cardType: 0,
      playEffects: Object.freeze([
        cardMoveEffect("dlc6-move", "1移动"),
        cardLandEffect("dlc6-land", "登陆"),
        landingSectorScanEffect("dlc6-landing-sector-scan", "刚登陆星球所在扇区标记信号", { gainData: false }),
      ]),
    }),
    "dlc_7.png": withSource("dlc_7.png", {
      cardType: 2,
      playEffects: Object.freeze([researchTechEffect("dlc7-orange-tech", "科技（只能选择橙色）", ["orange"])]),
      tasks: Object.freeze([{
        id: "dlc7-two-planet-probes",
        condition: Object.freeze({ type: "probesOnDifferentPlanets", count: 2, excludePlanetIds: Object.freeze(["earth"]) }),
        rewards: Object.freeze([gainResourcesEffect("dlc7-credits", "两个非地球行星探测器：2信用", { credits: 2 })]),
      }]),
    }),
    "dlc_8.png": withSource("dlc_8.png", {
      cardType: 3,
      playEffects: Object.freeze([researchTechEffect("dlc8-blue-tech", "科技（只能选择蓝色）", ["blue"])]),
      endGameScoring: END_GAME_SCORING.REMAINING_DATA,
    }),
    "dlc_9.png": withSource("dlc_9.png", {
      cardType: 2,
      playEffects: Object.freeze([researchTechEffect("dlc9-purple-tech", "科技（只能选择紫色）", ["purple"])]),
      tasks: Object.freeze([{
        id: "dlc9-three-sector-wins",
        condition: Object.freeze({ type: "completedSectors", count: 3 }),
        rewards: Object.freeze([gainResourcesEffect("dlc9-publicity", "完成3个扇区：3宣传", { publicity: 3 })]),
      }]),
    }),
    "dlc_10.png": withSource("dlc_10.png", {
      cardType: 3,
      playEffects: Object.freeze([gainResourcesEffect("dlc10-publicity", "获得 10 宣传", { publicity: 10 })]),
      endGameScoring: END_GAME_SCORING.REMAINING_PUBLICITY,
    }),
    "dlc_11.png": withSource("dlc_11.png", {
      cardType: 2,
      playEffects: Object.freeze([launchEffect("dlc11-launch", "发射"), gainResourcesEffect("dlc11-publicity", "获得 1 宣传", { publicity: 1 })]),
      tasks: Object.freeze([{
        id: "dlc11-asteroid-probe",
        condition: Object.freeze({ type: "probeLocation", locationType: "asteroid" }),
        rewards: Object.freeze([gainResourcesEffect("dlc11-score-energy", "小行星探测器：3分+2能量", { score: 3, energy: 2 })]),
      }]),
    }),
    "dlc_12.png": withSource("dlc_12.png", {
      cardType: 0,
      playEffects: Object.freeze([
        registerEventBonusEffect("dlc12-turn-distinct-planets", "本回合访问至少2个不同行星：3分", {
          duration: "turn",
          eventType: "visitPlanet",
          distinctBy: "planetId",
          minCount: 2,
          onceKey: "dlc12-two-planets",
          icon: "score",
          rewards: [gainResourcesEffect("dlc12-score", "访问2个不同行星：3分", { score: 3 })],
        }),
        cardMoveEffect("dlc12-move", "2移动", { movementPoints: 2 }),
      ]),
    }),
    "dlc_13.png": withSource("dlc_13.png", {
      cardType: 0,
      playEffects: Object.freeze([
        effect("dlc13-scan-action", EFFECT_TYPES.SCAN_ACTION, "扫描行动", "scan_action", { skipCost: true }),
        gainResourcesEffect("dlc13-public-scan-marker", "扫描行动后获得 1 个公共牌区扫描标记", { additionalPublicScan: 1 }),
      ]),
    }),
    "dlc_14.png": withSource("dlc_14.png", {
      cardType: 0,
      playEffects: Object.freeze([
        launchEffect("dlc14-launch", "发射"),
        gainResourcesEffect("dlc14-publicity", "获得 1 宣传", { publicity: 1 }),
        returnPlayedCardToHandIfEffect("dlc14-return", "若其他玩家有探测器在地球，本卡回手", { type: "otherProbeAtPlanet", planetId: "earth" }),
      ]),
    }),
    "dlc_15.png": withSource("dlc_15.png", {
      cardType: 0,
      playEffects: Object.freeze([effect("dlc15-tech", EFFECT_TYPES.RESEARCH_TECH, "科技，并再次获得科技bonus", "research_tech", { skipCost: true, afterResearchReward: Object.freeze({ kind: "repeatBonus" }) })]),
    }),
    "dlc_16.png": withSource("dlc_16.png", {
      cardType: 2,
      playEffects: Object.freeze([gainResourcesEffect("dlc16-publicity", "获得 4 宣传", { publicity: 4 })]),
      tasks: Object.freeze([{
        id: "dlc16-zero-publicity",
        condition: Object.freeze({ type: "resourceEquals", resource: "publicity", count: 0 }),
        rewards: Object.freeze([gainResourcesEffect("dlc16-score-publicity", "0宣传：2分+1宣传", { score: 2, publicity: 1 })]),
      }]),
    }),
    "dlc_17.png": withSource("dlc_17.png", {
      cardType: 0,
      playEffects: Object.freeze([payCreditsForRewardEffect("dlc17-pay-credits", "每支付1信用获得2分2宣传", gainResourcesEffect("dlc17-paid-reward", "支付1信用：2分+2宣传", { score: 2, publicity: 2 }))]),
    }),
    "dlc_18.png": withSource("dlc_18.png", {
      cardType: 0,
      playEffects: Object.freeze([effect("dlc18-shared-tech", EFFECT_TYPES.RESEARCH_TECH, "0宣传时研究已被拿取科技", "research_tech", { skipCost: true, skipRotate: true, skipBonus: true, researchedByOthersOnly: true, requireCondition: Object.freeze({ type: "resourceEquals", resource: "publicity", count: 0 }) })]),
    }),
    "dlc_19.png": withSource("dlc_19.png", {
      cardType: 0,
      playEffects: Object.freeze([removeOrbitToProbeEffect("dlc19-orbit-to-probe", "移除己方环绕并在该星球位置放置探测器")]),
    }),
    "dlc_20.png": withSource("dlc_20.png", {
      cardType: 0,
      playEffects: Object.freeze([
        gainResourcesEffect("dlc20-publicity", "获得 1 宣传", { publicity: 1 }),
        discardCardCornerRepeatEffect("dlc20-repeat-corner", "弃非外星人卡并结算其左上角奖励3次", { repeat: 3 }),
      ]),
    }),
    "dlc_21.png": withSource("dlc_21.png", {
      cardType: 1,
      triggers: Object.freeze([
        { id: "dlc21-orbit-visit-energy-1", event: Object.freeze({ type: "visitPlanet", requiresOwnOrbit: true }), effect: gainResourcesEffect("dlc21-energy-1", "访问有自己环绕的星球：1能量", { energy: 1 }) },
        { id: "dlc21-orbit-visit-energy-2", event: Object.freeze({ type: "visitPlanet", requiresOwnOrbit: true }), effect: gainResourcesEffect("dlc21-energy-2", "访问有自己环绕的星球：1能量", { energy: 1 }) },
      ]),
    }),
    "dlc_22.png": withSource("dlc_22.png", {
      cardType: 0,
      playEffects: Object.freeze([conditionalSectorScanEffect("dlc22-owned-signal-sector-scan", "选择自己至少3个信号的扇区扫描2次（不获得数据）", { type: "sectorSignalCount", minCount: 3 }, { repeat: 2, gainData: false })]),
    }),
    "dlc_23.png": withSource("dlc_23.png", {
      cardType: 1,
      playEffects: Object.freeze([gainResourcesEffect("dlc23-publicity", "获得 1 宣传", { publicity: 1 })]),
      triggers: Object.freeze([
        { id: "dlc23-launch-draw", event: Object.freeze({ type: "launch" }), effect: drawCardsEffect("dlc23-draw", "发射：1盲抽", 1) },
        { id: "dlc23-orbit-land-score", event: Object.freeze({ types: ["orbit", "land"] }), effect: gainResourcesEffect("dlc23-score", "环绕或登陆：3分", { score: 3 }) },
      ]),
    }),
    "dlc_24.png": withSource("dlc_24.png", {
      cardType: 1,
      triggers: Object.freeze([
        { id: "dlc24-orange-tech-launch-1", event: Object.freeze({ type: "researchTech", techType: "orange" }), effect: launchEffect("dlc24-launch-1", "橙色科技：发射") },
        { id: "dlc24-orange-tech-launch-2", event: Object.freeze({ type: "researchTech", techType: "orange" }), effect: launchEffect("dlc24-launch-2", "橙色科技：发射") },
      ]),
    }),
    "dlc_25.png": withSource("dlc_25.png", {
      cardType: 1,
      triggers: Object.freeze([
        { id: "dlc25-purple-tech-public-scan-1", event: Object.freeze({ type: "researchTech", techType: "purple" }), effect: gainResourcesEffect("dlc25-public-scan-marker-1", "紫色科技：1个公共牌区扫描标记", { additionalPublicScan: 1 }) },
        { id: "dlc25-purple-tech-public-scan-2", event: Object.freeze({ type: "researchTech", techType: "purple" }), effect: gainResourcesEffect("dlc25-public-scan-marker-2", "紫色科技：1个公共牌区扫描标记", { additionalPublicScan: 1 }) },
      ]),
    }),
    "dlc_26.png": withSource("dlc_26.png", {
      cardType: 1,
      triggers: Object.freeze([
        { id: "dlc26-blue-tech-data-1", event: Object.freeze({ type: "researchTech", techType: "blue" }), effect: gainDataEffect("dlc26-data-1", "蓝色科技：1数据", 1) },
        { id: "dlc26-blue-tech-data-2", event: Object.freeze({ type: "researchTech", techType: "blue" }), effect: gainDataEffect("dlc26-data-2", "蓝色科技：1数据", 1) },
      ]),
    }),
    "dlc_27.png": withSource("dlc_27.png", {
      cardType: 0,
      playEffects: Object.freeze([conditionalRewardEffect("dlc27-zero-energy", "若当前能量为0，按己方太阳系探测器数获得能量", { type: "resourceEquals", resource: "energy", count: 0 }, [countRocketsRewardEffect("dlc27-energy", "每个己方太阳系探测器：1能量", { resource: "energy", owner: "current", location: "solar" })])]),
    }),
    "dlc_28.png": withSource("dlc_28.png", {
      cardType: 2,
      playEffects: Object.freeze([discardAnyForIncomeEffect("dlc28-discard-income", "弃任意数量手牌并按收入图标结算")]),
      tasks: Object.freeze([{
        id: "dlc28-empty-resources-hand",
        condition: Object.freeze({ type: "resourcesAndHandEmpty", resources: Object.freeze(["credits", "energy"]) }),
        rewards: Object.freeze([gainResourcesEffect("dlc28-publicity", "0信用0能量0手牌：2宣传", { publicity: 2 }), pickCardEffect("dlc28-pick", "0信用0能量0手牌：精选1张牌")]),
      }]),
    }),
    "dlc_29.png": withSource("dlc_29.png", {
      cardType: 0,
      playEffects: Object.freeze([returnUnfinishedTaskToHandEffect("dlc29-task-return", "未完成任务卡返回手牌"), gainDataEffect("dlc29-data", "获得 2 数据", 2)]),
    }),
    "dlc_30.png": withSource("dlc_30.png", {
      cardType: 0,
      playEffects: Object.freeze([cardOrbitEffect("dlc30-orbit", "环绕"), countOwnedTechRewardEffect("dlc30-blue-tech-data", "每个蓝色科技：1数据", { techType: "blue", resource: "data", per: 1 })]),
    }),
    "dlc_31.png": withSource("dlc_31.png", {
      cardType: 3,
      playEffects: Object.freeze([cardLandEffect("dlc31-land", "登陆")]),
      endGameScoring: END_GAME_SCORING.DOUBLE_PLANET_LANDINGS,
    }),
    "dlc_32.png": withSource("dlc_32.png", {
      cardType: 0,
      playEffects: Object.freeze([discardAllHandEffect("dlc32-discard-all", "弃掉全部手牌，获得1宣传2盲抽", [gainResourcesEffect("dlc32-publicity", "弃手牌：1宣传", { publicity: 1 }), drawCardsEffect("dlc32-draw", "弃手牌：2盲抽", 2)])]),
    }),
    "dlc_33.png": withSource("dlc_33.png", {
      cardType: 1,
      playEffects: Object.freeze([gainResourcesEffect("dlc33-publicity", "获得 1 宣传", { publicity: 1 })]),
      triggers: Object.freeze([{ id: "dlc33-pass-launch", event: Object.freeze({ type: "pass" }), effect: launchEffect("dlc33-launch", "PASS：发射") }]),
    }),
    "dlc_34.png": withSource("dlc_34.png", {
      cardType: 0,
      playEffects: Object.freeze([countTechTypesRewardEffect("dlc34-max-tech-draw", "按最多科技类型数量盲抽", { reward: "draw", icon: "blind_card" }), tuckPlayedCardToIncomeEffect("dlc34-income", "将本卡放入收入区")]),
    }),
    "dlc_35.png": withSource("dlc_35.png", {
      cardType: 2,
      playEffects: Object.freeze([gainResourcesEffect("dlc35-public-scan-marker", "获得 1 个公共牌区扫描标记", { additionalPublicScan: 1 })]),
      tasks: Object.freeze([{
        id: "dlc35-data-total",
        condition: Object.freeze({ type: "dataTotal", count: 12 }),
        rewards: Object.freeze([gainResourcesEffect("dlc35-energy", "未分析与可用数据至少12：1能量", { energy: 1 })]),
      }]),
    }),
    "dlc_36.png": withSource("dlc_36.png", {
      cardType: 0,
      playEffects: Object.freeze([
        effect("dlc36-yellow-scan", EFFECT_TYPES.SCAN_COLOR_CHOICE, "黄色扇区扫描", "yellow_scan", { color: "yellow", gainData: true }),
        effect("dlc36-red-scan", EFFECT_TYPES.SCAN_COLOR_CHOICE, "红色扇区扫描", "red_scan", { color: "red", gainData: true }),
        effect("dlc36-blue-scan", EFFECT_TYPES.SCAN_COLOR_CHOICE, "蓝色扇区扫描", "blue_scan", { color: "blue", gainData: true }),
      ]),
    }),
    "dlc_37.png": withSource("dlc_37.png", {
      cardType: 0,
      playEffects: Object.freeze([conditionalSectorScanEffect("dlc37-all-owned-signal-sectors", "每个有自己信号的扇区各扫描1次（不获得数据）", { type: "hasPlayerSignal" }, { allMatching: true, gainData: false })]),
    }),
    "dlc_38.png": withSource("dlc_38.png", {
      cardType: 0,
      playEffects: Object.freeze([gainResourcesEffect("dlc38-publicity", "获得 1 宣传", { publicity: 1 }), cardMoveEffect("dlc38-move", "1移动"), probeStackRewardEffect("dlc38-stack-score", "若自己的探测器与任意探测器在同一位置，获得3分", [gainResourcesEffect("dlc38-score", "同位置探测器：3分", { score: 3 })])]),
    }),
    "dlc_39.png": withSource("dlc_39.png", {
      cardType: 3,
      playEffects: Object.freeze([cardMoveEffect("dlc39-move", "2移动", { movementPoints: 2 })]),
      endGameScoring: END_GAME_SCORING.ALL_ORBIT_OR_LAND,
    }),
    "dlc_40.png": withSource("dlc_40.png", {
      cardType: 0,
      playEffects: Object.freeze([cardMoveEffect("dlc40-move", "5移动", { movementPoints: 5 })]),
    }),
    "dlc_41.png": withSource("dlc_41.png", {
      cardType: 2,
      playEffects: Object.freeze([gainResourcesEffect("dlc41-public-scan-marker", "获得 1 个公共牌区扫描标记", { additionalPublicScan: 1 }), gainResourcesEffect("dlc41-publicity", "获得 1 宣传", { publicity: 1 }), pickCardEffect("dlc41-pick", "精选 1 张牌")]),
      tasks: Object.freeze([{
        id: "dlc41-four-color-signals",
        condition: Object.freeze({ type: "signalsInAllColors" }),
        rewards: Object.freeze([gainResourcesEffect("dlc41-score", "四种颜色均有信号：4分", { score: 4 })]),
      }]),
    }),
    "dlc_42.png": withSource("dlc_42.png", {
      cardType: 2,
      playEffects: Object.freeze([effect("dlc42-scan-action", EFFECT_TYPES.SCAN_ACTION, "扫描行动", "scan_action", { skipCost: true })]),
      tasks: Object.freeze([{
        id: "dlc42-all-sectors",
        condition: Object.freeze({ type: "signalsOrWinsInAllSectors" }),
        rewards: Object.freeze([gainResourcesEffect("dlc42-score", "8个扇区都有信号或胜利标记：8分", { score: 8 })]),
      }]),
    }),
  });

  function deferredCard(cardId, reason, missingAbilities, deferredParts = [], options = {}) {
    return Object.freeze({
      cardId,
      source: CARD_REFERENCE_MAP[cardId] || null,
      reason,
      missingAbilities: Object.freeze([...missingAbilities]),
      deferredParts: Object.freeze([...deferredParts]),
      ...(options.endGameScoring ? { endGameScoring: Object.freeze({ ...options.endGameScoring }) } : {}),
    });
  }

  const DEFERRED_CARD_MODELS = Object.freeze({});

  function cloneEffectNode(source, idSuffix = "") {
    return {
      ...source,
      id: idSuffix ? `${source.id}-${idSuffix}` : source.id,
      options: { ...(source.options || {}) },
      status: "pending",
    };
  }

  function expandEffects(effects) {
    const result = [];
    for (const item of effects || []) {
      const repeat = item.options?.noAutoRepeatExpansion
        ? 1
        : Math.max(1, Math.round(Number(item.options?.repeat || 1)));
      for (let index = 0; index < repeat; index += 1) {
        const node = cloneEffectNode(item, repeat > 1 ? `${index + 1}` : "");
        if (!item.options?.noAutoRepeatExpansion) node.options.repeat = 1;
        if (repeat > 1) node.label = `${item.label} ${index + 1}/${repeat}`;
        result.push(node);
      }
    }
    return result;
  }

  function getCardId(card) {
    if (card?.cardId) return card.cardId;
    if (Number.isInteger(card?.cardIndex)) return `b_${card.cardIndex}.webp`;
    return null;
  }

  function getCardModel(cardOrId) {
    const cardId = typeof cardOrId === "string" ? cardOrId : getCardId(cardOrId);
    return MODELS[cardId] || null;
  }

  function getCardReference(cardOrId) {
    const cardId = typeof cardOrId === "string" ? cardOrId : getCardId(cardOrId);
    return CARD_REFERENCE_MAP[cardId] || null;
  }

  function getDeferredCardModel(cardOrId) {
    const cardId = typeof cardOrId === "string" ? cardOrId : getCardId(cardOrId);
    return DEFERRED_CARD_MODELS[cardId] || null;
  }

  function getRuntimeCardTypeCode(cardOrId, fallbackTypeCode = 0) {
    const model = getCardModel(cardOrId);
    if (Number.isFinite(Number(model?.cardType))) return Math.round(Number(model.cardType));
    const fallback = Number(fallbackTypeCode);
    return Number.isFinite(fallback) ? Math.round(fallback) : 0;
  }

  function getCardMigrationStatus(cardOrId) {
    const cardId = typeof cardOrId === "string" ? cardOrId : getCardId(cardOrId);
    const model = getCardModel(cardId);
    if (model) {
      return model.deferredParts?.length ? "partial" : "implemented";
    }
    return getDeferredCardModel(cardId) ? "deferred" : "unmapped";
  }

  function buildPlayEffects(card) {
    return expandEffects(getCardModel(card)?.playEffects || []);
  }

  function getTemporaryTasks(card) {
    return getCardModel(card)?.temporaryTasks || [];
  }

  function ensureCardEffectState(card) {
    if (!card) return null;
    const model = getCardModel(card);
    if (!model || (!model.triggers?.length && !model.tasks?.length && !model.pluto)) return null;
    if (!card.cardEffectState || card.cardEffectState.modelCardId !== getCardId(card)) {
      card.cardEffectState = {
        modelCardId: getCardId(card),
        consumedTriggerIds: [],
        completedTaskIds: [],
      };
    }
    if (!Array.isArray(card.cardEffectState.consumedTriggerIds)) card.cardEffectState.consumedTriggerIds = [];
    if (!Array.isArray(card.cardEffectState.completedTaskIds)) card.cardEffectState.completedTaskIds = [];
    return card.cardEffectState;
  }

  function isTriggerConsumed(card, triggerId) {
    return Boolean(card?.cardEffectState?.consumedTriggerIds?.includes(triggerId));
  }

  function consumeTrigger(card, triggerId) {
    const state = ensureCardEffectState(card);
    if (!state || state.consumedTriggerIds.includes(triggerId)) return false;
    state.consumedTriggerIds.push(triggerId);
    return true;
  }

  function isTaskCompleted(card, taskId) {
    return Boolean(card?.cardEffectState?.completedTaskIds?.includes(taskId));
  }

  function completeTask(card, taskId) {
    const state = ensureCardEffectState(card);
    if (!state || state.completedTaskIds.includes(taskId)) return false;
    state.completedTaskIds.push(taskId);
    return true;
  }

  function eventMatchesTrigger(event, trigger) {
    if (!event || !trigger?.event) return false;
    if (trigger.event.types?.length) {
      if (!trigger.event.types.includes(event.type)) return false;
    } else if (event.type !== trigger.event.type) {
      return false;
    }
    if (event.type === "visitPlanet") {
      const included = trigger.event.includePlanetIds || trigger.event.planetIds || [];
      if (included.length && !included.includes(event.planetId)) return false;
      const excluded = trigger.event.excludePlanetIds || [];
      if (excluded.includes(event.planetId)) return false;
      if (trigger.event.requiresOwnOrbit && !event.hasOwnOrbit) return false;
      return true;
    }
    if (event.type === "cardCorner") {
      if (trigger.event.cornerKind && trigger.event.cornerKind !== event.cornerKind) return false;
      if (trigger.event.cornerCode != null && Number(trigger.event.cornerCode) !== Number(event.cornerCode)) return false;
      return true;
    }
    if (event.type === "signalMarked") {
      if (!trigger.event.color) return true;
      return getNebulaColor(event.nebulaId) === trigger.event.color;
    }
    if (event.type === "researchTech") {
      if (trigger.event.techType && trigger.event.techType !== event.techType) return false;
      return true;
    }
    if (event.type === "playCard") {
      if (trigger.event.price != null && Number(trigger.event.price) !== Number(event.price)) return false;
      return true;
    }
    if (event.type === "orbit" || event.type === "land") {
      const included = trigger.event.includePlanetIds || trigger.event.planetIds || [];
      if (included.length && !included.includes(event.planetId)) return false;
      const excluded = trigger.event.excludePlanetIds || [];
      return !excluded.includes(event.planetId);
    }
    if (event.type === "alienTrace") {
      if (trigger.event.traceType && trigger.event.traceType !== event.traceType) return false;
      if (trigger.event.alienId && trigger.event.alienId !== event.alienId) return false;
      return true;
    }
    return true;
  }

  function collectMatchingTriggers(player, event) {
    const matches = [];
    for (const card of player?.reservedCards || []) {
      const model = getCardModel(card);
      if (!model?.triggers?.length) continue;
      ensureCardEffectState(card);
      for (const trigger of model.triggers) {
        if (isTriggerConsumed(card, trigger.id)) continue;
        if (event.sourceCardInstanceId != null && card.id === event.sourceCardInstanceId) continue;
        if (!eventMatchesTrigger(event, trigger)) continue;
        matches.push({ card, trigger, effect: cloneEffectNode(trigger.effect), event });
      }
    }
    return matches;
  }

  function countSectorWinsByColor(player, nebulaDataState, color) {
    const mod = getEndGameScoring();
    if (mod) return mod.countSectorWinsByColor(player, nebulaDataState, color);
    return 0;
  }

  function countSectorWins(player, nebulaDataState) {
    const mod = getEndGameScoring();
    if (mod?.countSectorWins) return mod.countSectorWins(player, nebulaDataState);
    return 0;
  }

  function getNebulaColor(nebulaId) {
    for (const [color, sectorIds] of Object.entries(NEBULA_IDS_BY_COLOR)) {
      if (sectorIds.includes(nebulaId)) return color;
    }
    return null;
  }

  function getPlayerKeys(player) {
    const mod = getEndGameScoring();
    if (mod) return mod.getPlayerKeys(player);
    return new Set([player?.id, player?.color].filter(Boolean));
  }

  function normalizeProbeCoordinate(coordinate) {
    const x = Number(coordinate?.x);
    const y = Number(coordinate?.y);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
    return { x, y };
  }

  function getProbeStackCoordinate(rocket, getCoordinate) {
    const resolved = typeof getCoordinate === "function" ? getCoordinate(rocket) : null;
    const resolvedCoordinate = normalizeProbeCoordinate(resolved);
    if (resolvedCoordinate) return resolvedCoordinate;
    return normalizeProbeCoordinate({ x: rocket?.sectorX, y: rocket?.sectorY });
  }

  function probeBelongsToPlayer(rocket, playerKeys) {
    return playerKeys.has(rocket?.playerId)
      || playerKeys.has(rocket?.color)
      || playerKeys.has(rocket?.playerColor);
  }

  function isRocketEligibleForCountReward(rocket, options = {}) {
    if (!rocket) return false;
    if ((options.location || "solar") === "solar") {
      if ((rocket.surface || ROCKET_REWARD_SOLAR_SURFACE) !== ROCKET_REWARD_SOLAR_SURFACE) return false;
      if (rocket.referencePlacement?.isPlanetMarker) return false;
    }
    if (options.includeNonStandard !== true && (rocket.kind || ROCKET_REWARD_STANDARD_KIND) !== ROCKET_REWARD_STANDARD_KIND) {
      return false;
    }
    return true;
  }

  function countRocketsForReward(rockets, player, options = {}) {
    const playerKeys = getPlayerKeys(player);
    return (rockets || []).filter((rocket) => {
      if (!isRocketEligibleForCountReward(rocket, options)) return false;
      if (options.owner === "any") return true;
      return probeBelongsToPlayer(rocket, playerKeys);
    }).length;
  }

  function getProbeStackRewardMatch(rockets, player, options = {}) {
    const playerKeys = getPlayerKeys(player);
    const sectors = new Map();
    for (const rocket of rockets || []) {
      const coordinate = getProbeStackCoordinate(rocket, options.getCoordinate);
      if (!coordinate) continue;
      const key = `${coordinate.x}:${coordinate.y}`;
      if (!sectors.has(key)) {
        sectors.set(key, {
          key,
          coordinate,
          totalCount: 0,
          currentPlayerCount: 0,
          rocketIds: [],
          currentPlayerRocketIds: [],
        });
      }
      const entry = sectors.get(key);
      entry.totalCount += 1;
      if (rocket?.id != null) entry.rocketIds.push(rocket.id);
      if (probeBelongsToPlayer(rocket, playerKeys)) {
        entry.currentPlayerCount += 1;
        if (rocket?.id != null) entry.currentPlayerRocketIds.push(rocket.id);
      }
    }
    const match = [...sectors.values()]
      .find((entry) => entry.currentPlayerCount >= 1 && entry.totalCount >= 2);
    if (!match) return Object.freeze({ conditionMet: false });
    return Object.freeze({
      conditionMet: true,
      key: match.key,
      coordinate: Object.freeze({ ...match.coordinate }),
      totalCount: match.totalCount,
      currentPlayerCount: match.currentPlayerCount,
      rocketIds: Object.freeze([...match.rocketIds]),
      currentPlayerRocketIds: Object.freeze([...match.currentPlayerRocketIds]),
    });
  }

  function hasProbeStackReward(rockets, player, options = {}) {
    return getProbeStackRewardMatch(rockets, player, options).conditionMet;
  }

  function countTraceMarkers(player, alienGameState, traceType) {
    const mod = getEndGameScoring();
    if (mod) return mod.countTraceMarkers(player, alienGameState, traceType);
    return 0;
  }

  function countOwnedTech(player, techType) {
    const mod = getEndGameScoring();
    if (mod) return mod.countOwnedTech(player, techType);
    return 0;
  }

  function markerMatchesPlayer(marker, playerKeys) {
    return playerKeys.has(marker?.playerId) || playerKeys.has(marker?.color) || playerKeys.has(marker?.playerColor);
  }

  function countPlutoMarkers(player, context = {}, kind = "all") {
    const playerKeys = getPlayerKeys(player);
    return (context?.plutoMarkers || []).filter((marker) => {
      if (!markerMatchesPlayer(marker, playerKeys)) return false;
      if (kind === "orbit") return marker.kind === "orbit";
      if (kind === "land") return marker.kind === "land";
      return marker.kind === "orbit" || marker.kind === "land";
    }).length;
  }

  function playerHasPlanetOrbitOrLand(player, planetStatsState, planetId, context = {}) {
    if (planetId === "pluto") return countPlutoMarkers(player, context, "all") > 0;
    const mod = getEndGameScoring();
    if (mod) return mod.countPlanetOrbitOrLand(player, planetStatsState, planetId, context) > 0;
    return false;
  }

  function countDistinctSignalSectors(player, nebulaDataState) {
    const mod = getEndGameScoring();
    if (mod) return mod.countDistinctSignalSectors(player, nebulaDataState);
    return 0;
  }

  function tokenBelongsToPlayer(token, playerKeys) {
    return playerKeys.has(token?.replacedByPlayerId)
      || playerKeys.has(token?.playerId)
      || playerKeys.has(token?.replacedByPlayerColor)
      || playerKeys.has(token?.playerColor);
  }

  function playerHasSignalInNebula(player, nebulaDataState, nebulaId) {
    const playerKeys = getPlayerKeys(player);
    const tokens = nebulaDataState?.nebulae?.[nebulaId]?.tokens || [];
    if (tokens.some((token) => tokenBelongsToPlayer(token, playerKeys))) return true;
    const marks = nebulaDataState?.sectorExtraMarks?.[nebulaId] || [];
    return marks.some((mark) => tokenBelongsToPlayer(mark, playerKeys));
  }

  function playerHasSignalInColor(player, nebulaDataState, color) {
    return (NEBULA_IDS_BY_COLOR[color] || []).some((nebulaId) => (
      playerHasSignalInNebula(player, nebulaDataState, nebulaId)
    ));
  }

  function playerHasSignalsInAllColors(player, nebulaDataState) {
    return Object.keys(NEBULA_IDS_BY_COLOR).every((color) => (
      playerHasSignalInColor(player, nebulaDataState, color)
    ));
  }

  function playerHasSignalOrWinInAllSectors(player, nebulaDataState) {
    const playerKeys = getPlayerKeys(player);
    const wins = nebulaDataState?.sectorSettlements?.winsByPlayerId || {};
    const wonSectors = new Set();
    for (const key of playerKeys) {
      for (const win of wins[key] || []) {
        if (win?.sectorId) wonSectors.add(win.sectorId);
      }
    }
    return Object.values(NEBULA_IDS_BY_COLOR).flat().every((nebulaId) => (
      wonSectors.has(nebulaId) || playerHasSignalInNebula(player, nebulaDataState, nebulaId)
    ));
  }

  function allAliensHaveTrace(alienGameState, traceType) {
    const slots = Object.values(alienGameState?.aliens || {});
    return slots.length > 0 && slots.every((slot) => slot?.traces?.[traceType]?.firstPlaced);
  }

  function markerBelongsToPlayer(marker, playerKeys) {
    return playerKeys.has(marker?.playerId) || playerKeys.has(marker?.color) || playerKeys.has(marker?.playerColor);
  }

  function traceBelongsToPlayer(traceSlot, playerKeys) {
    if (!traceSlot?.firstPlaced) return false;
    return playerKeys.has(traceSlot.ownerPlayerId)
      || playerKeys.has(traceSlot.ownerPlayerColor)
      || playerKeys.has(traceSlot.playerId)
      || playerKeys.has(traceSlot.playerColor);
  }

  function allAliensHavePlayerTrace(player, alienGameState, traceType) {
    const slots = Object.values(alienGameState?.aliens || {});
    const playerKeys = getPlayerKeys(player);
    return slots.length > 0 && slots.every((slot) => traceBelongsToPlayer(slot?.traces?.[traceType], playerKeys));
  }

  function playerHasProbeLocation(player, context, locationType) {
    const playerKeys = getPlayerKeys(player);
    const locations = context?.probeLocations || {};
    for (const key of playerKeys) {
      if ((locations[key] || []).includes(locationType)) return true;
    }
    return false;
  }

  function playerHasProbeAdjacentEarthAsteroid(player, context) {
    const playerKeys = getPlayerKeys(player);
    for (const detail of context?.probeLocationDetails || []) {
      if (!playerKeys.has(detail.playerId) && !playerKeys.has(detail.color)) continue;
      if (detail.locationType !== "asteroid") continue;
      if (detail.adjacentToEarth) return true;
    }
    const locations = context?.probeLocations || {};
    for (const key of playerKeys) {
      if ((locations[key] || []).includes("earthAdjacentAsteroid")) return true;
    }
    return false;
  }

  function playerHasProbeAdjacentEarth(player, context) {
    const playerKeys = getPlayerKeys(player);
    return (context?.probeLocationDetails || []).some((detail) => (
      (playerKeys.has(detail.playerId) || playerKeys.has(detail.color))
      && detail.adjacentToEarth
    ));
  }

  function playerHasOtherProbeAtPlanet(player, context, planetId) {
    const playerKeys = getPlayerKeys(player);
    return (context?.probeLocationDetails || []).some((detail) => (
      detail.planetId === planetId
      && !playerKeys.has(detail.playerId)
      && !playerKeys.has(detail.color)
    ));
  }

  function playerHasProbesOnDifferentPlanets(player, context, count, excludePlanetIds = []) {
    const playerKeys = getPlayerKeys(player);
    const excluded = new Set(excludePlanetIds || []);
    const planets = new Set();
    for (const detail of context?.probeLocationDetails || []) {
      if (!playerKeys.has(detail.playerId) && !playerKeys.has(detail.color)) continue;
      if (!detail.planetId || excluded.has(detail.planetId)) continue;
      planets.add(detail.planetId);
    }
    return planets.size >= Number(count || 1);
  }

  function playerHasProbeDistanceFromEarth(player, context, minDistance) {
    const playerKeys = getPlayerKeys(player);
    for (const detail of context?.probeLocationDetails || []) {
      if (!playerKeys.has(detail.playerId) && !playerKeys.has(detail.color)) continue;
      if (Number(detail.distanceFromEarth) >= Number(minDistance || 1)) return true;
    }
    return false;
  }

  function countPlayerPlanetMarkers(player, planetStatsState, kind = "all", context = {}) {
    const playerKeys = getPlayerKeys(player);
    let count = countPlutoMarkers(player, context, kind);
    for (const record of Object.values(planetStatsState?.planets || {})) {
      if (kind === "all" || kind === "orbit") {
        count += (record.orbitMarkers || []).filter((marker) => markerBelongsToPlayer(marker, playerKeys)).length;
      }
      if (kind === "all" || kind === "land") {
        count += (record.landingMarkers || []).filter((marker) => markerBelongsToPlayer(marker, playerKeys)).length;
        count += (record.satelliteLandings || []).filter((marker) => markerBelongsToPlayer(marker, playerKeys)).length;
      }
    }
    return count;
  }

  function playerHasSamePlanetOrbitAndLand(player, planetStatsState, context = {}) {
    const playerKeys = getPlayerKeys(player);
    const hasPlutoOrbit = (context?.plutoMarkers || []).some((marker) => (
      marker.kind === "orbit" && markerMatchesPlayer(marker, playerKeys)
    ));
    const hasPlutoLand = (context?.plutoMarkers || []).some((marker) => (
      marker.kind === "land" && markerMatchesPlayer(marker, playerKeys)
    ));
    if (hasPlutoOrbit && hasPlutoLand) return true;
    return Object.values(planetStatsState?.planets || {}).some((record) => {
      const hasOrbit = (record.orbitMarkers || []).some((marker) => markerBelongsToPlayer(marker, playerKeys));
      const hasLand = (record.landingMarkers || []).some((marker) => markerBelongsToPlayer(marker, playerKeys))
        || (record.satelliteLandings || []).some((marker) => markerBelongsToPlayer(marker, playerKeys));
      return hasOrbit && hasLand;
    });
  }

  function playerHasAllPlanetOrbitOrLand(player, planetStatsState, planetIds, context = {}) {
    return (planetIds || []).every((planetId) => playerHasPlanetOrbitOrLand(player, planetStatsState, planetId, context));
  }

  function countCompletedSectorColors(player, nebulaDataState) {
    return Object.keys(NEBULA_IDS_BY_COLOR).map((color) => ({
      color,
      count: countSectorWinsByColor(player, nebulaDataState, color),
    }));
  }

  function slotHasPlayerTraceSet(slot, playerKeys, traceTypes) {
    return (traceTypes || []).every((traceType) => traceBelongsToPlayer(slot?.traces?.[traceType], playerKeys));
  }

  function playerHasSingleAlienTraceSet(player, alienGameState, traceTypes) {
    const playerKeys = getPlayerKeys(player);
    return Object.values(alienGameState?.aliens || {})
      .some((slot) => slotHasPlayerTraceSet(slot, playerKeys, traceTypes));
  }

  function playerHasYichangdianAllTraceTypes(player, alienGameState) {
    const yichangdian = getYichangdian();
    if (!yichangdian?.playerHasAllTraceTypes) return false;
    return yichangdian.playerHasAllTraceTypes(alienGameState, player);
  }

  function playerHasAomomoLanding(player, alienGameState) {
    const aomomo = getAomomo();
    if (!aomomo?.listLandingMarkers || !aomomo?.markerBelongsToPlayer) return false;
    const keys = aomomo.getPlayerKeys ? aomomo.getPlayerKeys(player) : getPlayerKeys(player);
    return aomomo.listLandingMarkers(alienGameState)
      .some((marker) => aomomo.markerBelongsToPlayer(marker, keys));
  }

  function playerHasAomomoFossils(player, count) {
    return (Number(player?.resources?.aomomoFossils) || 0) >= Number(count || 1);
  }

  function playerHasAomomoAllTraceTypes(player, alienGameState) {
    const aomomo = getAomomo();
    if (!aomomo?.playerHasAllTraceTypes) return false;
    return aomomo.playerHasAllTraceTypes(alienGameState, player);
  }

  function playerHasAomomoFossilSpendingTrace(player, alienGameState) {
    const aomomo = getAomomo();
    if (!aomomo?.playerHasFossilSpendingTrace) return false;
    return aomomo.playerHasFossilSpendingTrace(alienGameState, player);
  }

  function taskConditionMet(task, player, context) {
    const condition = task?.condition;
    if (!condition) return false;
    if (condition.type === "completedSectorsByColor") {
      return countSectorWinsByColor(player, context.nebulaDataState, condition.color) >= Number(condition.count || 1);
    }
    if (condition.type === "completedSectors") {
      return countSectorWins(player, context.nebulaDataState) >= Number(condition.count || 1);
    }
    if (condition.type === "allAliensHaveTrace") {
      return allAliensHaveTrace(context.alienGameState, condition.traceType);
    }
    if (condition.type === "allAliensHavePlayerTrace") {
      return allAliensHavePlayerTrace(player, context.alienGameState, condition.traceType);
    }
    if (condition.type === "traceCount") {
      return countTraceMarkers(player, context.alienGameState, condition.traceType) >= Number(condition.count || 1);
    }
    if (condition.type === "techCount") {
      return countOwnedTech(player, condition.techType) >= Number(condition.count || 1);
    }
    if (condition.type === "planetOrbitOrLand") {
      if (!playerHasPlanetOrbitOrLand(player, context.planetStatsState, condition.planetId, context)) return false;
      return Number(condition.count || 1) <= 1;
    }
    if (condition.type === "planetOrbitOrLandAll") {
      return playerHasAllPlanetOrbitOrLand(player, context.planetStatsState, condition.planetIds || [], context);
    }
    if (condition.type === "samePlanetOrbitAndLand") {
      return playerHasSamePlanetOrbitAndLand(player, context.planetStatsState, context);
    }
    if (condition.type === "orbitCount") {
      return countPlayerPlanetMarkers(player, context.planetStatsState, "orbit", context) >= Number(condition.count || 1);
    }
    if (condition.type === "landingCount") {
      return countPlayerPlanetMarkers(player, context.planetStatsState, "land", context) >= Number(condition.count || 1);
    }
    if (condition.type === "orbitOrLandCount") {
      return countPlayerPlanetMarkers(player, context.planetStatsState, "all", context) >= Number(condition.count || 1);
    }
    if (condition.type === "distinctSignalSectors") {
      return countDistinctSignalSectors(player, context.nebulaDataState) >= Number(condition.count || 1);
    }
    if (condition.type === "signalsInAllColors") {
      return playerHasSignalsInAllColors(player, context.nebulaDataState);
    }
    if (condition.type === "signalsOrWinsInAllSectors") {
      return playerHasSignalOrWinInAllSectors(player, context.nebulaDataState);
    }
    if (condition.type === "resourceThreshold") {
      const value = Number(player?.resources?.[condition.resource]) || 0;
      return value >= Number(condition.count || 1);
    }
    if (condition.type === "resourceEquals") {
      const value = Number(player?.resources?.[condition.resource]) || 0;
      return value === Number(condition.count || 0);
    }
    if (condition.type === "resourcesAndHandEmpty") {
      return (condition.resources || []).every((resource) => (
        (Number(player?.resources?.[resource]) || 0) === 0
      )) && (player?.hand || []).length === 0;
    }
    if (condition.type === "dataTotal") {
      const value = Number(context?.dataTotals?.[player?.id]) || Number(context?.dataTotals?.[player?.color]) || 0;
      return value >= Number(condition.count || 1);
    }
    if (condition.type === "probeLocation") {
      return playerHasProbeLocation(player, context, condition.locationType);
    }
    if (condition.type === "probesOnDifferentPlanets") {
      return playerHasProbesOnDifferentPlanets(player, context, condition.count, condition.excludePlanetIds || []);
    }
    if (condition.type === "probeAdjacentEarth") {
      return playerHasProbeAdjacentEarth(player, context);
    }
    if (condition.type === "otherProbeAtPlanet") {
      return playerHasOtherProbeAtPlanet(player, context, condition.planetId);
    }
    if (condition.type === "probeAdjacentEarthAsteroid") {
      return playerHasProbeAdjacentEarthAsteroid(player, context);
    }
    if (condition.type === "probeDistanceFromEarth") {
      return playerHasProbeDistanceFromEarth(player, context, condition.minDistance);
    }
    if (condition.type === "handEmpty") {
      return (player?.hand || []).length === 0;
    }
    if (condition.type === "completedSameSectorColor") {
      return countCompletedSectorColors(player, context.nebulaDataState)
        .some((entry) => entry.count >= Number(condition.count || 1));
    }
    if (condition.type === "singleAlienTraceSet") {
      return playerHasSingleAlienTraceSet(player, context.alienGameState, condition.traceTypes || []);
    }
    if (condition.type === "yichangdianAllTraceTypes") {
      return playerHasYichangdianAllTraceTypes(player, context.alienGameState);
    }
    if (condition.type === "aomomoLanding") {
      return playerHasAomomoLanding(player, context.alienGameState);
    }
    if (condition.type === "aomomoFossils") {
      return playerHasAomomoFossils(player, condition.count);
    }
    if (condition.type === "aomomoAllTraceTypes") {
      return playerHasAomomoAllTraceTypes(player, context.alienGameState);
    }
    if (condition.type === "aomomoFossilSpendingTrace") {
      return playerHasAomomoFossilSpendingTrace(player, context.alienGameState);
    }
    return false;
  }

  function collectReadyTasks(player, context) {
    const ready = [];
    for (const card of player?.reservedCards || []) {
      const model = getCardModel(card);
      if (!model?.tasks?.length) continue;
      ensureCardEffectState(card);
      for (const task of model.tasks) {
        if (isTaskCompleted(card, task.id)) continue;
        if (!taskConditionMet(task, player, context)) continue;
        ready.push({
          card,
          task,
          effects: expandEffects(task.rewards || []),
        });
      }
    }
    return ready;
  }

  function collectTemporaryTaskRewards(tasks, settlementResult) {
    const settlementCount = settlementResult?.settlements?.length || 0;
    const effects = [];
    for (const task of tasks || []) {
      if (task?.condition?.type !== "sectorCompletedDuringCard") continue;
      if (settlementCount < Number(task.condition.count || 1)) continue;
      effects.push(...expandEffects(task.rewards || []));
    }
    return effects;
  }

  function areAllTriggersConsumed(card) {
    const model = getCardModel(card);
    if (!model?.triggers?.length) return false;
    const consumed = card?.cardEffectState?.consumedTriggerIds || [];
    return model.triggers.every((trigger) => consumed.includes(trigger.id));
  }

  function getConsumedTriggerIndexes(card) {
    const model = getCardModel(card);
    if (!model?.triggers?.length) return [];
    const consumed = new Set(card?.cardEffectState?.consumedTriggerIds || []);
    return model.triggers
      .map((trigger, index) => consumed.has(trigger.id) ? index + 1 : null)
      .filter((index) => index != null);
  }

  return Object.freeze({
    EFFECT_TYPES,
    NEBULA_IDS_BY_COLOR,
    CARD_REFERENCE_MAP,
    MODELS,
    DEFERRED_CARD_MODELS,
    getCardId,
    getCardModel,
    getCardReference,
    getDeferredCardModel,
    getRuntimeCardTypeCode,
    getCardMigrationStatus,
    buildPlayEffects,
    getTemporaryTasks,
    ensureCardEffectState,
    consumeTrigger,
    completeTask,
    collectMatchingTriggers,
    collectReadyTasks,
    collectTemporaryTaskRewards,
    countTraceMarkers,
    consolidateCardMoveEffects,
    countRocketsForReward,
    getProbeStackRewardMatch,
    hasProbeStackReward,
    areAllTriggersConsumed,
    getConsumedTriggerIndexes,
  });
});
