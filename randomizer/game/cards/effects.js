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
    FREE_MOVE: "card_free_move",
    CARD_MOVE: "card_move",
    DRAW_THEN_SCAN: "card_draw_then_scan",
    DRAW_THEN_DISCARD_ACTION: "card_draw_then_discard_action",
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

  let endGameScoringModule = null;

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
    });
  }

  function researchTechEffect(id, label, techTypes = null) {
    const options = { skipCost: true };
    if (techTypes?.length) options.techTypes = Object.freeze([...techTypes]);
    return effect(id, EFFECT_TYPES.RESEARCH_TECH, label || "科技", "research_tech", options);
  }

  function cardMoveEffect(id, label, options = {}) {
    const normalizedOptions = {
      movementPoints: Math.max(1, Math.round(Number(options.movementPoints || 1))),
    };
    if (options.historyLabel) normalizedOptions.historyLabel = options.historyLabel;
    if (options.afterEventRewards?.length) {
      normalizedOptions.afterEventRewards = Object.freeze(options.afterEventRewards.map((reward) => Object.freeze({
        eventType: reward.eventType,
        onceKey: reward.onceKey || null,
        effect: reward.effect,
      })));
    }
    return effect(id, EFFECT_TYPES.CARD_MOVE, label || "移动", "movement", normalizedOptions);
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
    BLUE_TRACES: Object.freeze({ kind: "traceCount", traceType: "blue", scorePer: 2 }),
    BLUE_TECH: Object.freeze({ kind: "techCount", techType: "blue", scorePer: 2 }),
    SIGNAL_SECTORS: Object.freeze({ kind: "distinctSignalSectors", scorePer: 1 }),
    JUPITER_ORBIT_OR_LAND: Object.freeze({ kind: "planetOrbitOrLand", planetId: "jupiter", scorePer: 3 }),
  });

  const MODELS = Object.freeze({
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
        effect("b7-draw-then-scan", EFFECT_TYPES.DRAW_THEN_SCAN, "盲抽并对该牌弃牌扫描", "blind_card", {
          repeat: 3,
        }),
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
      tasks: Object.freeze([{
        id: "b22-distinct-signal-task",
        condition: Object.freeze({ type: "distinctSignalSectors", count: 4 }),
        rewards: Object.freeze([
          gainResourcesEffect("b22-distinct-signal-reward", "4个不同扇区有信号：2宣传", {
            publicity: 2,
          }),
        ]),
      }]),
      deferredParts: Object.freeze(["probe_sector_scan"]),
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
        cardMoveEffect("b24-move-1", "2移动 1/2；若访问彗星获得4分", {
          afterEventRewards: Object.freeze([{
            eventType: "visitComet",
            onceKey: "b24-comet-score",
            effect: gainResourcesEffect("b24-comet-score", "彗星遭遇：访问彗星获得4分", { score: 4 }),
          }]),
        }),
        cardMoveEffect("b24-move-2", "2移动 2/2；若访问彗星获得4分", {
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
    "b_33.webp": withSource("b_33.webp", {
      cardType: 3,
      playEffects: Object.freeze([
        researchTechEffect("b33-orange-or-purple-tech", "科技（橙色或紫色）", ["orange", "purple"]),
      ]),
      endGameScoring: END_GAME_SCORING.BLUE_TECH,
    }),
    "b_38.webp": withSource("b_38.webp", {
      cardType: 0,
      playEffects: Object.freeze([
        effect("b38-public-scan", EFFECT_TYPES.PUBLIC_SCAN, "公共牌区扫描", "public_card_scan", { repeat: 2 }),
        researchTechEffect("b38-purple-tech", "科技（只能选择紫色）", ["purple"]),
      ]),
    }),
    "b_43.webp": withSource("b_43.webp", {
      cardType: 0,
      playEffects: Object.freeze([
        gainDataEffect("b43-data", "获得 3 个数据", 3),
        researchTechEffect("b43-blue-tech", "科技（只能选择蓝色）", ["blue"]),
      ]),
    }),
    "b_45.webp": withSource("b_45.webp", {
      cardType: 3,
      playEffects: Object.freeze([
        effect("b45-public-scan", EFFECT_TYPES.PUBLIC_SCAN, "公共牌区扫描", "public_card_scan"),
      ]),
      endGameScoring: END_GAME_SCORING.SIGNAL_SECTORS,
    }),
    "b_56.webp": withSource("b_56.webp", {
      cardType: 0,
      playEffects: Object.freeze([
        gainResourcesEffect("b56-energy", "获得 1 能量", { energy: 1 }),
        researchTechEffect("b56-orange-tech", "科技（只能选择橙色）", ["orange"]),
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
    "b_65.webp": withSource("b_65.webp", {
      cardType: 0,
      playEffects: Object.freeze([
        gainDataEffect("b65-data", "获得 1 个数据", 1),
        researchTechEffect("b65-blue-tech", "科技（只能选择蓝色）", ["blue"]),
      ]),
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

  const DEFERRED_CARD_MODELS = Object.freeze({
    "b_13.webp": deferredCard("b_13.webp", "需要选择并移除自己的环绕器，再结算奖励。", ["select_own_orbiter", "remove_planet_marker"]),
    "b_26.webp": deferredCard("b_26.webp", "任务按角标资源使用事件触发，当前没有角标使用任务事件。", ["card_corner_event_condition"]),
    "b_27.webp": deferredCard("b_27.webp", "痕迹必须放在已有同色痕迹的外星人上，当前痕迹选择器没有该限制。", ["restricted_alien_trace_target"]),
    "b_28.webp": deferredCard("b_28.webp", "扫描行动后按黄色信号计分，当前没有扫描结果后置计分钩子。", ["scan_result_bonus"]),
    "b_29.webp": deferredCard("b_29.webp", "卡牌内登陆且允许重复占位，当前没有登陆作为卡牌效果节点。", ["card_land_effect", "duplicate_landing_override"]),
    "b_32.webp": deferredCard("b_32.webp", "痕迹必须放在已有同色痕迹的外星人上，当前痕迹选择器没有该限制。", ["restricted_alien_trace_target"]),
    "b_34.webp": deferredCard(
      "b_34.webp",
      "卡牌内登陆仍缺独立能力。",
      ["card_land_effect"],
      [],
      { endGameScoring: END_GAME_SCORING.JUPITER_ORBIT_OR_LAND },
    ),
    "b_35.webp": deferredCard("b_35.webp", "痕迹必须放在已有同色痕迹的外星人上，当前痕迹选择器没有该限制。", ["restricted_alien_trace_target"]),
    "b_36.webp": deferredCard("b_36.webp", "任意痕迹后按该颜色痕迹数计分，当前没有痕迹结果后置计分。", ["alien_trace_result_bonus"]),
    "b_37.webp": deferredCard("b_37.webp", "需要连续发射两次并临时忽略探测器上限。", ["multi_launch", "temporary_probe_limit_override"]),
    "b_39.webp": deferredCard("b_39.webp", "任务要求蓝色痕迹事件并分支奖励，当前缺少痕迹任务事件。", ["trace_event_condition"]),
    "b_40.webp": deferredCard("b_40.webp", "科技后按所选同类科技数量计分，当前没有科技选择结果后置计分。", ["tech_result_bonus"]),
    "b_41.webp": deferredCard("b_41.webp", "按手牌收入角标统计能量收入牌，当前没有展示/统计手牌收入类型能力。", ["hand_income_count"]),
    "b_42.webp": deferredCard("b_42.webp", "按已塞入收入牌统计并把本卡移入收入区，当前没有本卡转收入区流程。", ["tucked_income_count", "move_played_card_to_income"]),
    "b_44.webp": deferredCard("b_44.webp", "访问金星/木星触发不同奖励，当前没有指定行星访问任务分支。", ["specific_planet_visit_condition"]),
    "b_46.webp": deferredCard("b_46.webp", "任务要求红色痕迹数量，当前只有简化的两外星人首痕迹条件。", ["trace_count_condition"]),
    "b_47.webp": deferredCard("b_47.webp", "按已塞入收入牌统计并把本卡移入收入区，当前没有本卡转收入区流程。", ["tucked_income_count", "move_played_card_to_income"]),
    "b_48.webp": deferredCard("b_48.webp", "盲抽后需要展示并立刻获得该牌左上角角标奖励。", ["reveal_drawn_card", "apply_corner_reward"]),
    "b_49.webp": deferredCard("b_49.webp", "移动期间把一次行星访问宣传转换为移动，当前没有可选本轮移动事件钩子。", ["card_turn_effects", "optional_visit_replacement"]),
    "b_50.webp": deferredCard("b_50.webp", "按最多三个探测器所在扇区放置信号，当前没有探测器扇区扫描选择。", ["probe_sector_scan"]),
    "b_51.webp": deferredCard("b_51.webp", "扫描行动可表达，但任务要求宣传不少于 8，当前没有宣传阈值任务条件。", ["resource_threshold_condition"]),
    "b_52.webp": deferredCard("b_52.webp", "要求探测器在小行星上才放黄色痕迹，当前没有探测器位置条件。", ["probe_location_condition"]),
    "b_53.webp": deferredCard("b_53.webp", "信号与任务都依赖探测器所在扇区/同扇区卡牌数，当前缺动态扇区条件。", ["probe_sector_scan", "same_sector_card_condition"]),
    "b_54.webp": deferredCard("b_54.webp", "移动可表达，但移动后按探测器所在扇区放置信号仍缺动态扇区扫描。", ["probe_sector_scan"]),
    "b_55.webp": deferredCard("b_55.webp", "只能选择其他玩家已研究的科技且不拿印刷奖励，当前科技选择器不支持该限制。", ["tech_researched_by_others_filter"]),
    "b_57.webp": deferredCard("b_57.webp", "多槽发射事件任务奖励不同，当前没有发射事件任务分支。", ["launch_event_condition"]),
    "b_58.webp": deferredCard("b_58.webp", "移动可表达，但移动后按探测器所在扇区放置信号仍缺动态扇区扫描。", ["probe_sector_scan"]),
    "b_59.webp": deferredCard("b_59.webp", "任务要求环绕或登陆事件并奖励宣传，当前缺少环绕/登陆任务条件。", ["orbit_or_land_condition"]),
    "b_60.webp": deferredCard("b_60.webp", "发射和数据可表达，但任务要求木星环绕/登陆，当前缺少环绕/登陆任务条件。", ["orbit_or_land_condition"]),
    "b_61.webp": deferredCard("b_61.webp", "信号需限定木星所在动态扇区，任务要求木星环绕/登陆。", ["planet_sector_scan", "orbit_or_land_condition"]),
    "b_62.webp": deferredCard("b_62.webp", "移动可表达，但木星访问奖励需要指定行星访问过滤和本卡流程事件钩子。", ["specific_planet_visit_after_move"]),
    "b_64.webp": deferredCard("b_64.webp", "移动可表达，但移动后按探测器所在扇区放置信号仍缺动态扇区扫描。", ["probe_sector_scan"]),
    "b_66.webp": deferredCard("b_66.webp", "移动期间每个不同星球访问得分，当前没有跨多次移动的本卡流程访问统计。", ["card_turn_effects"]),
    "b_67.webp": deferredCard("b_67.webp", "任务要求同一外星人拥有红黄蓝痕迹，当前缺少单外星人多色痕迹条件。", ["single_alien_trace_set_condition"]),
    "b_68.webp": deferredCard("b_68.webp", "扫描行动可表达，但任务要求宣传不少于 8，当前没有宣传阈值任务条件。", ["resource_threshold_condition"]),
  });

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
      const repeat = Math.max(1, Math.round(Number(item.options?.repeat || 1)));
      for (let index = 0; index < repeat; index += 1) {
        const node = cloneEffectNode(item, repeat > 1 ? `${index + 1}` : "");
        node.options.repeat = 1;
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
    if (!model || (!model.triggers?.length && !model.tasks?.length)) return null;
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
    if (!event || !trigger?.event || event.type !== trigger.event.type) return false;
    if (event.type === "visitPlanet") {
      const excluded = trigger.event.excludePlanetIds || [];
      return !excluded.includes(event.planetId);
    }
    if (event.type === "signalMarked") {
      if (!trigger.event.color) return true;
      return getNebulaColor(event.nebulaId) === trigger.event.color;
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
        if (!eventMatchesTrigger(event, trigger)) continue;
        matches.push({ card, trigger, effect: cloneEffectNode(trigger.effect) });
      }
    }
    return matches;
  }

  function countSectorWinsByColor(player, nebulaDataState, color) {
    const mod = getEndGameScoring();
    if (mod) return mod.countSectorWinsByColor(player, nebulaDataState, color);
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

  function playerHasPlanetOrbitOrLand(player, planetStatsState, planetId) {
    const mod = getEndGameScoring();
    if (mod) return mod.countPlanetOrbitOrLand(player, planetStatsState, planetId) > 0;
    return false;
  }

  function countDistinctSignalSectors(player, nebulaDataState) {
    const mod = getEndGameScoring();
    if (mod) return mod.countDistinctSignalSectors(player, nebulaDataState);
    return 0;
  }

  function allAliensHaveTrace(alienGameState, traceType) {
    const slots = Object.values(alienGameState?.aliens || {});
    return slots.length > 0 && slots.every((slot) => slot?.traces?.[traceType]?.firstPlaced);
  }

  function taskConditionMet(task, player, context) {
    const condition = task?.condition;
    if (!condition) return false;
    if (condition.type === "completedSectorsByColor") {
      return countSectorWinsByColor(player, context.nebulaDataState, condition.color) >= Number(condition.count || 1);
    }
    if (condition.type === "allAliensHaveTrace") {
      return allAliensHaveTrace(context.alienGameState, condition.traceType);
    }
    if (condition.type === "traceCount") {
      return countTraceMarkers(player, context.alienGameState, condition.traceType) >= Number(condition.count || 1);
    }
    if (condition.type === "techCount") {
      return countOwnedTech(player, condition.techType) >= Number(condition.count || 1);
    }
    if (condition.type === "planetOrbitOrLand") {
      if (!playerHasPlanetOrbitOrLand(player, context.planetStatsState, condition.planetId)) return false;
      return Number(condition.count || 1) <= 1;
    }
    if (condition.type === "distinctSignalSectors") {
      return countDistinctSignalSectors(player, context.nebulaDataState) >= Number(condition.count || 1);
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
    areAllTriggersConsumed,
    getConsumedTriggerIndexes,
  });
});
