(function (root, factory) {
  "use strict";

  const api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.SetiAppConstants = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function () {
  "use strict";

  function createAppConstants(dependencies = {}) {
    const {
      aliens,
      players,
      rocketActions,
      planetReferenceLayout,
      initialCards,
    } = dependencies;

    const FINAL_SCORE_IDS = ["a", "b", "c", "d"];
    const BOARD_VISUAL_SCALE = 1.1;

    return {
      WHEEL_OFFSETS: [0, 0, 20, 11, 4],
      BOARD_VISUAL_SCALE,
      FINAL_SCORE_IDS,
      FINAL_SCORE_SLOT_POINTS: Object.freeze({
        1: Object.freeze({ x: 18.5, y: 54.4 }),
        2: Object.freeze({ x: 40.4, y: 54.4 }),
        3: Object.freeze({ x: 66, y: 54.4, stepX: 8.5, stepY: 9.5, columns: 3 }),
      }),
      ROCKET_IMAGE_SCALE: 0.104 * BOARD_VISUAL_SCALE,
      REFERENCE_ORBIT_IMAGE_SCALE: 0.0286 * BOARD_VISUAL_SCALE,
      REFERENCE_LANDDING_IMAGE_SCALE: 0.0338 * BOARD_VISUAL_SCALE,
      RESOURCE_ICON_SRC: Object.freeze({
        cost: "../assets/symbol/effect/cost.webp",
        score: "../assets/symbol/effect/score.webp",
        finalScore: "../assets/symbol/effect/final_score.webp",
        credits: "../assets/symbol/effect/credits.webp",
        energy: "../assets/symbol/effect/energy.webp",
        card: "../assets/symbol/effect/card.webp",
        publicity: "../assets/symbol/effect/publicity.webp",
        data: "../assets/symbol/effect/data.webp",
        analyzeData: "../assets/symbol/effect/analyze_data.webp",
        income: "../assets/symbol/effect/income.webp",
        incomeCard: "../assets/symbol/effect/income_card.webp",
        additionalPublicScan: "../assets/tokens/additional_public_scan.webp",
        orbitOrLand: "../assets/symbol/effect/orbit or land.webp",
        yellowFinishScan: "../assets/symbol/effect/yellow_finish_scan.webp",
        redFinishScan: "../assets/symbol/effect/red_finish_scan.webp",
        blueFinishScan: "../assets/symbol/effect/blue_finish_scan.webp",
        blackFinishScan: "../assets/symbol/effect/black_finish_scan.webp",
        alienYellow: "../assets/symbol/effect/alien_yellow.webp",
        alienPink: "../assets/symbol/effect/alien_pink.webp",
        alienBlue: "../assets/symbol/effect/alien_blue.webp",
        jiuzheCard: aliens.JIUZHE_CARD_BACK_SRC || "../assets/aliens/九折/cards/back.png",
        jiuzheThreat: aliens.JIUZHE_THREAT_ICON_SRC || "../assets/aliens/九折/Threat.webp",
        jiuzheTimeFree: "../assets/aliens/九折/time_1.png",
        jiuzheTimePaid: "../assets/aliens/九折/time_2.png",
        yichangdianCard: aliens.YICHANGDIAN_CARD_BACK_SRC || "../assets/aliens/异常点/cards/back.png",
        banrenmaCard: aliens.BANRENMA_CARD_BACK_SRC || "../assets/aliens/半人马/cards/back.png",
        banrenmaToken: aliens.BANRENMA_TOKEN_SRC || "../assets/aliens/半人马/token.webp",
        chongCard: aliens.CHONG_CARD_BACK_SRC || "../assets/aliens/虫/cards/back.png",
        chongFossil: aliens.CHONG_FOSSIL_BACK_SRC || "../assets/aliens/虫/fossil_back.webp",
        amibaCard: aliens.AMIBA_CARD_BACK_SRC || "../assets/aliens/阿米巴/cards/back.jpg",
        aomomoCard: aliens.AOMOMO_CARD_BACK_SRC || "../assets/aliens/奥陌陌/cards/back.png",
        aomomoFossil: aliens.AOMOMO_FOSSIL_SRC || "../assets/aliens/奥陌陌/fossil.webp",
        runezuCard: aliens.RUNEZU_CARD_BACK_SRC || "../assets/aliens/符文族/cards/back.jpg",
      }),
      OPPONENT_SECTOR_WIN_STATS: Object.freeze([
        Object.freeze({ color: "yellow", label: "黄色完成扇区", iconKey: "yellowFinishScan" }),
        Object.freeze({ color: "red", label: "红色完成扇区", iconKey: "redFinishScan" }),
        Object.freeze({ color: "blue", label: "蓝色完成扇区", iconKey: "blueFinishScan" }),
        Object.freeze({ color: "black", label: "黑色完成扇区", iconKey: "blackFinishScan" }),
      ]),
      OPPONENT_TECH_TYPES: Object.freeze([
        Object.freeze({ type: "orange", prefix: "橙", color: "#f59e42" }),
        Object.freeze({ type: "purple", prefix: "紫", color: "#b886ff" }),
        Object.freeze({ type: "blue", prefix: "蓝", color: "#4da3ff" }),
      ]),
      TECH_EFFECT_ICONS: Object.freeze({
        research_tech: "../assets/symbol/effect/research_tech.webp",
        rotate: "../assets/tokens/rotate_state.png",
        bonus_3f: "../assets/symbol/effect/score.webp",
        bonus_1p: "../assets/symbol/effect/energy.webp",
        bonus_1m: "../assets/symbol/effect/publicity.webp",
        bonus_1c: "../assets/symbol/effect/choose_card.webp",
      }),
      CARD_EFFECT_ICONS: Object.freeze({
        score: "../assets/symbol/effect/score.webp",
        credits: "../assets/symbol/effect/credits.webp",
        energy: "../assets/symbol/effect/energy.webp",
        publicity: "../assets/symbol/effect/publicity.webp",
        data: "../assets/symbol/effect/data.webp",
        launch: "../assets/symbol/effect/launch.webp",
        blind_card: "../assets/symbol/effect/blind_card.webp",
        pick_card: "../assets/symbol/effect/choose_card.webp",
        income: "../assets/symbol/effect/income.webp",
        alien_trace: "../assets/symbol/effect/alien_any.webp",
        alien_any: "../assets/symbol/effect/alien_any.webp",
        alien_pink: "../assets/symbol/effect/alien_pink.webp",
        alien_yellow: "../assets/symbol/effect/alien_yellow.webp",
        alien_blue: "../assets/symbol/effect/alien_blue.webp",
        yellow_scan: "../assets/symbol/effect/yellow_scan.webp",
        red_scan: "../assets/symbol/effect/red_scan.webp",
        blue_scan: "../assets/symbol/effect/blue_scan.webp",
        black_scan: "../assets/symbol/effect/black_scan.webp",
        public_card_scan: "../assets/symbol/action/scan/public_card_scan.webp",
        additional_public_scan: "../assets/tokens/additional_public_scan.webp",
        scan: "../assets/symbol/effect/normal_scan.webp",
        scan_action: "../assets/symbol/effect/scan_action.webp",
        research_tech: "../assets/symbol/effect/research_tech.webp",
        movement: "../assets/symbol/effect/movement.webp",
        orbit: "../assets/symbol/effect/orbit.webp",
        land: "../assets/symbol/effect/land.webp",
        orbitOrLand: "../assets/symbol/effect/orbit or land.webp",
        chongFossilBack: "../assets/aliens/虫/fossil_back.webp",
        chongFossilOk: "../assets/aliens/虫/fossil_ok.webp",
        aomomoFossil: aliens.AOMOMO_FOSSIL_SRC || "../assets/aliens/奥陌陌/fossil.webp",
        runezuSymbolBack: "../assets/aliens/符文族/symbol_back.png",
      }),
      INCOME_GAIN_LABELS: Object.freeze({
        credits: "信用点",
        energy: "能量",
        handSize: "手牌",
        publicity: "宣传",
        availableData: "数据",
        aomomoFossils: "奥陌陌化石",
        additionalPublicScan: "额外公共扫描",
        score: "分数",
      }),
      ACTION_LOG_DELTA_UNITS: Object.freeze({
        credits: "信用点",
        energy: "能量",
        handSize: "手牌",
        publicity: "宣传",
        availableData: "数据",
        aomomoFossils: "奥陌陌化石",
        additionalPublicScan: "额外公共扫描",
        score: "分",
      }),
      ACTION_LOG_RESOURCE_KEYS: Object.freeze([
        "credits",
        "energy",
        "publicity",
        "availableData",
        "additionalPublicScan",
        "aomomoFossils",
        "handSize",
        "score",
      ]),
      ACTION_LOG_INCOME_KEYS: Object.freeze([
        "credits",
        "energy",
        "publicity",
        "availableData",
        "additionalPublicScan",
        "handSize",
      ]),
      ACTION_LOG_SOURCE_LABELS: Object.freeze({
        main: "主要行动",
        quick: "快速行动",
        setup: "初始选择",
      }),
      ACTION_LOG_DEFAULT_LABELS: Object.freeze({
        launch: "发射行动",
        orbit: "环绕行动",
        land: "登陆行动",
        scan: "扫描行动",
        analyze: "分析数据",
        playCard: "打牌行动",
        researchTech: "科技行动",
        pass: "PASS",
        initialSelection: "初始选择",
        quick: "快速行动",
      }),
      GAME_RECOVERY_VERSION: 1,
      PUBLIC_SCAN_MAX_BONUS_CARDS: 2,
      DEBUG_QUICK_SECTOR_SCAN_EXTRA_LIMIT: 10,
      PUBLIC_SCAN_TARGETS_BY_CODE: Object.freeze({
        0: Object.freeze(["sector-4-a", "sector-3-a"]),
        1: Object.freeze(["sector-2-b", "sector-3-b"]),
        2: Object.freeze(["sector-2-a", "sector-1-a"]),
        3: Object.freeze(["sector-1-b", "sector-4-b"]),
      }),
      PUBLIC_SCAN_CODE_LABELS: Object.freeze({
        0: "黄色扫描",
        1: "红色扫描",
        2: "蓝色扫描",
        3: "黑色扫描",
      }),
      SECTOR_FINISH_ICON_BY_COLOR: Object.freeze({
        yellow: "yellow_finish_scan",
        red: "red_finish_scan",
        blue: "blue_finish_scan",
        black: "black_finish_scan",
        aomomo: "sector_finish_scan",
      }),
      SECTOR_WIN_REWARDS: Object.freeze({
        "sector-1-b": Object.freeze({
          first: Object.freeze([{ resource: "score", amount: 2 }, { traceType: "pink" }]),
          repeat: Object.freeze([{ resource: "score", amount: 5 }]),
        }),
        "sector-4-b": Object.freeze({
          first: Object.freeze([{ resource: "score", amount: 3 }, { traceType: "pink" }]),
          repeat: Object.freeze([{ traceType: "pink" }]),
        }),
        "sector-2-b": Object.freeze({
          first: Object.freeze([{ traceType: "pink" }]),
          repeat: Object.freeze([{ resource: "score", amount: 3 }]),
        }),
        "sector-3-a": Object.freeze({
          first: Object.freeze([{ traceType: "pink" }]),
          repeat: Object.freeze([{ resource: "score", amount: 3 }]),
        }),
        "sector-1-a": Object.freeze({
          first: Object.freeze([{ traceType: "pink" }]),
          repeat: Object.freeze([{ resource: "score", amount: 3 }]),
        }),
        "sector-4-a": Object.freeze({
          first: Object.freeze([{ traceType: "pink" }]),
          repeat: Object.freeze([{ traceType: "pink" }]),
        }),
        "sector-2-a": Object.freeze({
          first: Object.freeze([{ traceType: "pink" }]),
          repeat: Object.freeze([{ traceType: "pink" }]),
        }),
        "sector-3-b": Object.freeze({
          first: Object.freeze([{ traceType: "pink" }]),
          repeat: Object.freeze([{ traceType: "pink" }]),
        }),
      }),
      ROCKET_SURFACE: rocketActions.ROCKET_SURFACE,
      PLANETS_REFERENCE_SIZE: planetReferenceLayout.PLANETS_REFERENCE_SIZE,
      REFERENCE_PLACEMENT_KIND_LABELS: Object.freeze({
        orbit: "环绕",
        land: "登陆",
        satellite: "卫星",
      }),
      ROTATE_STATE_SLOTS: Object.freeze([
        Object.freeze({ id: "top-left", percentX: 34.81, percentY: 27.3 }),
        Object.freeze({ id: "bottom-left", percentX: 34.15, percentY: 71.18 }),
        Object.freeze({ id: "right-middle", percentX: 76.68, percentY: 49.96 }),
      ]),
      DEFAULT_ACTIVE_PLAYER_COUNT: 4,
      DEFAULT_INITIAL_PLAYER_COLOR: players.DEFAULT_PLAYER_COLOR,
      DEFAULT_INITIAL_HAND_COUNT: 4,
      INDUSTRY_CARD_FILES: Object.freeze([
        "层云核心.png",
        "芬威克研究中心.png",
        "赫利昂联合体.png",
        "寰宇动力.png",
        "任务中继站.png",
        "哨兵探测网络.png",
        "深空探测.png",
        "图灵系统.png",
        "未来跨度研究所.png",
        "异星实验室.png",
        "宇宙战略集团.png",
        "原教旨主义.png",
      ]),
      INITIAL_CARD_COUNT: initialCards?.INITIAL_CARD_COUNT || 21,
      INITIAL_SELECTION_REQUIRED: Object.freeze({
        industry: 1,
        initial: 2,
      }),
      INITIAL_SELECTION_CARD_SIZE: Object.freeze({
        industry: Object.freeze({ width: 1382, height: 1054 }),
        initial: Object.freeze({ width: 744, height: 1039 }),
      }),
      PASS_HAND_LIMIT: 4,
      FINAL_ROUND_NUMBER: 4,
      PASS_RESERVE_ROUNDS: Object.freeze([1, 2, 3]),
    };
  }

  return {
    createAppConstants,
  };
});
