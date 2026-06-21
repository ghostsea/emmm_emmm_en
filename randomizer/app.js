(function () {
  "use strict";

  const solar = window.SetiSolarSystem;
  const players = window.SetiPlayers;
  const rocketActions = window.SetiRocketActions;
  const planetStats = window.SetiPlanetStats;
  const planetReferenceLayout = window.SetiPlanetReferenceLayout;
  const actions = window.SetiActions;
  const scanEffects = window.SetiScanEffects;
  const planetRewards = window.SetiPlanetRewards;
  const finalScoring = window.SetiFinalScoring;
  const endGameScoring = window.SetiEndGameScoring;
  const actionHistoryModule = window.SetiActionHistory;
  const historyCommands = window.SetiHistoryCommands;
  const historyTransactions = window.SetiHistoryTransactions;
  const abilities = window.SetiAbilities;
  const quickTrades = window.SetiQuickTrades;
  const basicCards = window.SetiBasicCards;
  const cards = window.SetiCards;
  const cardEffects = window.SetiCardEffects;
  const cardTaskStateModule = window.SetiCardTaskState;
  const tech = window.SetiTech;
  const data = window.SetiData;
  const aliens = window.SetiAliens;
  const jiuzhe = aliens.jiuzhe;
  const yichangdian = aliens.yichangdian;
  const fangzhou = aliens.fangzhou;
  const banrenma = aliens.banrenma;
  const chong = aliens.chong;
  const amiba = aliens.amiba;
  const aomomo = aliens.aomomo;
  const runezu = aliens.runezu;
  const initialCards = window.SetiInitialCards;
  const industry = window.SetiIndustry;

  /** 与官网 main.js 一致的每层转盘随机偏移基数 */
  const WHEEL_OFFSETS = [0, 0, 20, 11, 4];
  const FINAL_SCORE_IDS = ["a", "b", "c", "d"];
  const FINAL_SCORE_SLOT_POINTS = Object.freeze({
    1: Object.freeze({ x: 18.5, y: 54.4 }),
    2: Object.freeze({ x: 40.4, y: 54.4 }),
    3: Object.freeze({ x: 66, y: 54.4, stepX: 8.5, stepY: 9.5, columns: 3 }),
  });
  const ROCKET_IMAGE_SCALE = 0.104;
  const REFERENCE_ORBIT_IMAGE_SCALE = 0.0286;
  const REFERENCE_LANDDING_IMAGE_SCALE = 0.0338;
  const RESOURCE_ICON_SRC = Object.freeze({
    score: "../assets/symbol/effect/score.webp",
    finalScore: "../assets/symbol/effect/final_score.webp",
    credits: "../assets/symbol/effect/credits.webp",
    energy: "../assets/symbol/effect/energy.webp",
    card: "../assets/symbol/effect/card.webp",
    publicity: "../assets/symbol/effect/publicity.webp",
    data: "../assets/symbol/effect/data.webp",
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
  });
  const OPPONENT_SECTOR_WIN_STATS = Object.freeze([
    Object.freeze({ color: "yellow", label: "黄色完成扇区", iconKey: "yellowFinishScan" }),
    Object.freeze({ color: "red", label: "红色完成扇区", iconKey: "redFinishScan" }),
    Object.freeze({ color: "blue", label: "蓝色完成扇区", iconKey: "blueFinishScan" }),
    Object.freeze({ color: "black", label: "黑色完成扇区", iconKey: "blackFinishScan" }),
  ]);
  const OPPONENT_TECH_TYPES = Object.freeze([
    Object.freeze({ type: "orange", prefix: "橙", color: "#f59e42" }),
    Object.freeze({ type: "purple", prefix: "紫", color: "#b886ff" }),
    Object.freeze({ type: "blue", prefix: "蓝", color: "#4da3ff" }),
  ]);
  const TECH_EFFECT_ICONS = Object.freeze({
    research_tech: "../assets/symbol/effect/research_tech.webp",
    rotate: "../assets/tokens/rotate_state.png",
    bonus_3f: "../assets/symbol/effect/score.webp",
    bonus_1p: "../assets/symbol/effect/energy.webp",
    bonus_1m: "../assets/symbol/effect/publicity.webp",
    bonus_1c: "../assets/symbol/effect/choose_card.webp",
  });
  const CARD_EFFECT_ICONS = Object.freeze({
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
    land: "../assets/symbol/effect/land.webp",
    orbitOrLand: "../assets/symbol/effect/orbit or land.webp",
    chongFossilBack: "../assets/aliens/虫/fossil_back.webp",
    chongFossilOk: "../assets/aliens/虫/fossil_ok.webp",
    aomomoFossil: aliens.AOMOMO_FOSSIL_SRC || "../assets/aliens/奥陌陌/fossil.webp",
  });
  const INCOME_GAIN_LABELS = Object.freeze({
    credits: "信用点",
    energy: "能量",
    handSize: "手牌",
    publicity: "宣传",
    availableData: "数据",
    aomomoFossils: "奥陌陌化石",
    additionalPublicScan: "额外公共扫描",
  });
  const ACTION_LOG_SOURCE_LABELS = Object.freeze({
    main: "主要行动",
    quick: "快速行动",
    setup: "初始选择",
  });
  const ACTION_LOG_DEFAULT_LABELS = Object.freeze({
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
  });
  const GAME_RECOVERY_VERSION = 1;
  const PUBLIC_SCAN_MAX_BONUS_CARDS = 2;
  const DEBUG_QUICK_SECTOR_SCAN_EXTRA_LIMIT = 10;
  const PUBLIC_SCAN_TARGETS_BY_CODE = Object.freeze({
    0: Object.freeze(["sector-4-a", "sector-3-a"]),
    1: Object.freeze(["sector-2-b", "sector-3-b"]),
    2: Object.freeze(["sector-2-a", "sector-1-a"]),
    3: Object.freeze(["sector-1-b", "sector-4-b"]),
  });
  const PUBLIC_SCAN_CODE_LABELS = Object.freeze({
    0: "黄色扫描",
    1: "红色扫描",
    2: "蓝色扫描",
    3: "黑色扫描",
  });
  const tokenWidths = {
    rocket: null,
    orbit: null,
    landding: null,
  };
  const ROCKET_SURFACE = rocketActions.ROCKET_SURFACE;
  const PLANETS_REFERENCE_SIZE = planetReferenceLayout.PLANETS_REFERENCE_SIZE;
  const REFERENCE_PLACEMENT_KIND_LABELS = Object.freeze({
    orbit: "环绕",
    land: "登陆",
    satellite: "卫星",
  });
  const ROTATE_STATE_SLOTS = Object.freeze([
    Object.freeze({ id: "top-left", percentX: 34.81, percentY: 27.3 }),
    Object.freeze({ id: "bottom-left", percentX: 34.15, percentY: 71.18 }),
    Object.freeze({ id: "right-middle", percentX: 76.68, percentY: 49.96 }),
  ]);
  const DEFAULT_ACTIVE_PLAYER_COUNT = 1;
  const DEFAULT_INITIAL_PLAYER_COLOR = players.DEFAULT_PLAYER_COLOR;
  const INDUSTRY_CARD_FILES = Object.freeze([
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
  ]);
  const INITIAL_CARD_COUNT = initialCards?.INITIAL_CARD_COUNT || 21;
  const INITIAL_SELECTION_REQUIRED = Object.freeze({
    industry: 1,
    initial: 2,
  });
  const INITIAL_SELECTION_CARD_SIZE = Object.freeze({
    industry: Object.freeze({ width: 1382, height: 1054 }),
    initial: Object.freeze({ width: 744, height: 1039 }),
  });
  const solarState = solar.createBaselineState();
  const nebulaDataState = data.createDefaultNebulaDataState();
  const alienGameState = aliens.createDefaultAlienState();
  const finalScoringState = finalScoring.createFinalScoringState(FINAL_SCORE_IDS);
  const sectorElements = {};
  const playerState = players.createPlayerState({
    players: players.PLAYER_COLOR_IDS.map((color) => ({ color })),
    currentPlayerColor: players.DEFAULT_PLAYER_COLOR,
  });
  const turnState = createTurnState(playerState.players, {
    activePlayerCount: DEFAULT_ACTIVE_PLAYER_COUNT,
    currentPlayerId: playerState.currentPlayerId,
  });
  const rocketState = rocketActions.createRocketState();
  const planetStatsState = planetStats.createPlanetStatsState();
  const techGameState = tech.createState();
  const cardState = cards.createCardState();
  let pendingDiscardAction = null;
  let pendingCardSelectionAction = null;
  let pendingScanTargetAction = null;
  let pendingPublicScanQueue = null;
  let pendingHandScanAction = null;
  let pendingAlienTraceAction = null;
  let pendingLandTargetAction = null;
  let pendingCardTriggerAction = null;
  let pendingCardTriggerFreeMove = null;
  let pendingCardTaskCompletion = null;
  let pendingJiuzheCardPlay = null;
  let pendingJiuzheOpportunityOpen = false;
  let jiuzheOpportunityQueue = [];
  let pendingYichangdianCardGain = null;
  let pendingYichangdianCornerAction = null;
  let pendingBanrenmaCardGain = null;
  let pendingBanrenmaOpportunity = null;
  let banrenmaOpportunityQueue = [];
  let pendingChongCardGain = null;
  let pendingChongFossilChoice = null;
  let pendingChongTaskCompletion = null;
  let pendingAmibaCardGain = null;
  let pendingAmibaSymbolChoice = null;
  let pendingAmibaTraceRemoval = null;
  let pendingAomomoCardGain = null;
  let pendingRunezuCardGain = null;
  let pendingRunezuSymbolBranch = null;
  let pendingRunezuFaceSymbolPlacement = null;
  const yichangdianAnomalyMarkerElements = new Map();
  const chongPlanetFossilMarkerElements = new Map();
  const chongFossilOwnerTokenElements = new Map();
  const banrenmaBonusMarkerElements = new Map();
  const runezuBoardSymbolElements = new Map();
  const cardTaskState = cardTaskStateModule.createTaskState();
  let alienTracePickerState = null;
  let debugAlienTraceModeActive = false;
  let pendingActionExecuted = false;
  let pendingPassPlayerId = null;
  let pendingActionEffectFlow = null;
  let pendingActionHasIrreversibleBarrier = false;
  let pendingActionIrreversibleReason = null;
  const actionHistory = actionHistoryModule.createActionHistory();
  const quickActionHistory = actionHistoryModule.createActionHistory();
  const HISTORY_SOURCE_MAIN = "main";
  const HISTORY_SOURCE_QUICK = "quick";
  const HISTORY_SOURCE_SETUP = "setup";
  const historyStepOrder = [];
  const actionLogState = {
    entries: [],
    draft: null,
    nextEntryId: 1,
    activeReportTab: "state",
  };
  let effectStepActive = false;
  let moveHighlightRocketId = null;
  let pendingMovePayment = null;
  let pendingPlayCardSelection = null;
  let pendingCardCornerQuickAction = null;
  let pendingCardCornerFreeMove = null;
  let pendingIndustryAbility = null;
  let industryFreeMoveState = null;
  let stateReadoutRenderFrame = 0;
  const setupSelectionState = {
    phase: "selecting",
    currentPlayerId: null,
    offersByPlayerId: {},
    confirmedPlayerIds: [],
  };
  const MOVE_DISCARD_ACTION_CODE = 2;
  const MOVE_ENERGY_COST = 1;
  const techRenderContext = {
    supplyStage: null,
    supplySlots: {},
    playerBoardTechLayer: null,
  };

  const els = {
    appWrap: document.querySelector(".app-wrap"),
    boardShell: document.getElementById("board-shell"),
    playerCommand: document.getElementById("player-command"),
    playerStats: document.getElementById("player-stats"),
    opponentStatGrid: document.getElementById("opponent-stat-grid"),
    playerHandPanel: document.getElementById("player-hand-panel"),
    playerHandFan: document.getElementById("player-hand-fan"),
    reservedCardPanel: document.getElementById("reserved-card-panel"),
    reservedCardFan: document.getElementById("reserved-card-fan"),
    initialSelectionArea: document.getElementById("initial-selection-area"),
    actionLaunchButton: document.getElementById("action-launch-button"),
    actionOrbitButton: document.getElementById("action-orbit-button"),
    actionLandButton: document.getElementById("action-land-button"),
    actionScanButton: document.getElementById("action-scan-button"),
    actionAnalyzeButton: document.getElementById("action-analyze-button"),
    actionPlayCardButton: document.getElementById("action-play-card-button"),
    actionResearchTechButton: document.getElementById("action-research-tech-button"),
    actionQuickButton: document.getElementById("action-quick-button"),
    actionPassButton: document.getElementById("action-pass-button"),
    actionConfirmButton: document.getElementById("action-confirm-button"),
    actionUndoButton: document.getElementById("action-undo-button"),
    actionEffectBar: document.getElementById("action-effect-bar"),
    actionEffectList: document.getElementById("action-effect-list"),
    actionEffectSkipButton: document.getElementById("action-effect-skip-button"),
    quickActionsPanel: document.getElementById("quick-actions-panel"),
    quickActionsTrades: document.getElementById("quick-actions-trades"),
    dataPlaceOverlay: document.getElementById("data-place-overlay"),
    dataPlaceSubtitle: document.getElementById("data-place-subtitle"),
    dataPlaceActions: document.getElementById("data-place-actions"),
    dataPlaceCancel: document.getElementById("data-place-cancel"),
    scanTargetOverlay: document.getElementById("scan-target-overlay"),
    scanTargetTitle: document.getElementById("scan-target-title"),
    scanTargetSubtitle: document.getElementById("scan-target-subtitle"),
    scanTargetActions: document.getElementById("scan-target-actions"),
    scanTargetCancel: document.getElementById("scan-target-cancel"),
    scanAction4Overlay: document.getElementById("scan-action-4-overlay"),
    scanAction4Subtitle: document.getElementById("scan-action-4-subtitle"),
    scanAction4Actions: document.getElementById("scan-action-4-actions"),
    scanAction4Cancel: document.getElementById("scan-action-4-cancel"),
    moveArrowLayer: document.getElementById("move-arrow-layer"),
    alienPanels: document.querySelectorAll(".alien-panel"),
    alienTraceLayers: document.querySelectorAll(".alien-trace-layer"),
    alienJiuzheTraceLayers: document.querySelectorAll(".alien-jiuzhe-trace-layer"),
    alienJiuzheThresholds: document.querySelectorAll(".alien-jiuzhe-thresholds"),
    alienYichangdianCardAreas: document.querySelectorAll(".alien-yichangdian-card-area"),
    alienFangzhouCardAreas: document.querySelectorAll(".alien-fangzhou-card-area"),
    alienBanrenmaCardAreas: document.querySelectorAll(".alien-banrenma-card-area"),
    alienChongCardAreas: document.querySelectorAll(".alien-chong-card-area"),
    alienAmibaCardAreas: document.querySelectorAll(".alien-amiba-card-area"),
    alienAomomoCardAreas: document.querySelectorAll(".alien-aomomo-card-area"),
    alienRunezuCardAreas: document.querySelectorAll(".alien-runezu-card-area"),
    alienBanrenmaScoremarks: document.querySelectorAll(".alien-banrenma-scoremarks"),
    finalScoreGrid: document.getElementById("final-score-grid"),
    finalScoreTileWraps: document.querySelectorAll(".final-score-tile-wrap"),
    finalScoreTiles: document.querySelectorAll(".final-score-tile"),
    reportDock: document.getElementById("report-dock"),
    wheelWrap: document.getElementById("wheel-wrap"),
    tokenLayer: document.getElementById("token-layer"),
    buttonWrap: document.getElementById("button-wrap"),
    planetsReference: document.getElementById("planets-reference"),
    planetsReferenceImage: document.querySelector(".planets-reference img"),
    planetsTokenLayer: document.getElementById("planets-token-layer"),
    wheels: {
      1: document.getElementById("wheel-1"),
      2: document.getElementById("wheel-2"),
      3: document.getElementById("wheel-3"),
      4: document.getElementById("wheel-4"),
    },
    sectorWraps: {
      1: document.getElementById("sector-wrap-1"),
      2: document.getElementById("sector-wrap-2"),
      3: document.getElementById("sector-wrap-3"),
      4: document.getElementById("sector-wrap-4"),
    },
    spinButton: document.getElementById("spin-button"),
    debugToggle: document.getElementById("debug-toggle"),
    debugPlayerSwitchButton: document.getElementById("debug-player-switch-button"),
    debugPlayerMenu: document.getElementById("debug-player-menu"),
    debugRotateButton: document.getElementById("debug-rotate-button"),
    debugIncomeButton: document.getElementById("debug-income-button"),
    debugIncomeEffectButton: document.getElementById("debug-income-effect-button"),
    debugResolveIncomeButton: document.getElementById("debug-resolve-income-button"),
    debugPickCardButton: document.getElementById("debug-pick-card-button"),
    debugDiscardCardButton: document.getElementById("debug-discard-card-button"),
    debugGainDataButton: document.getElementById("debug-gain-data-button"),
    debugScoreButton: document.getElementById("debug-score-button"),
    debugFillNebulaDataButton: document.getElementById("debug-fill-nebula-data-button"),
    debugSectorScanButton: document.getElementById("debug-sector-scan-button"),
    debugQuickSectorScanButton: document.getElementById("debug-quick-sector-scan-button"),
    debugPublicScanButton: document.getElementById("debug-public-scan-button"),
    debugHandScanButton: document.getElementById("debug-hand-scan-button"),
    debugAlienTraceButton: document.getElementById("debug-alien-trace-button"),
    debugJiuzheButton: document.getElementById("debug-jiuzhe-button"),
    debugYichangdianButton: document.getElementById("debug-yichangdian-button"),
    debugFangzhouButton: document.getElementById("debug-fangzhou-button"),
    debugBanrenmaButton: document.getElementById("debug-banrenma-button"),
    debugChongButton: document.getElementById("debug-chong-button"),
    debugAmibaButton: document.getElementById("debug-amiba-button"),
    debugAomomoButton: document.getElementById("debug-aomomo-button"),
    debugRunezuButton: document.getElementById("debug-runezu-button"),
    debugCheatButton: document.getElementById("debug-cheat-button"),
    alienTraceOverlay: document.getElementById("alien-trace-overlay"),
    alienTraceSubtitle: document.getElementById("alien-trace-subtitle"),
    alienTraceActions: document.getElementById("alien-trace-actions"),
    alienTraceCancel: document.getElementById("alien-trace-cancel"),
    techPanel: document.getElementById("tech-panel"),
    techStage: document.getElementById("tech-stage"),
    techSelectionBackdrop: document.getElementById("tech-selection-backdrop"),
    techSelectionCancel: document.getElementById("tech-selection-cancel"),
    playerBoardTechLayer: document.getElementById("player-board-tech-layer"),
    playerBoardDataLayer: document.getElementById("player-board-data-layer"),
    techTiles: [...document.querySelectorAll(".tech-tile[data-tech-id]")],
    techBlueSlotOverlay: document.getElementById("tech-blue-slot-overlay"),
    techBlueSlotSubtitle: document.getElementById("tech-blue-slot-subtitle"),
    techBlueSlotActions: document.getElementById("tech-blue-slot-actions"),
    techBlueSlotCancel: document.getElementById("tech-blue-slot-cancel"),
    logToggle: document.getElementById("log-toggle"),
    stateLogTab: document.getElementById("state-log-tab"),
    actionLogTab: document.getElementById("action-log-tab"),
    stateReadout: document.getElementById("state-readout"),
    actionLogReadout: document.getElementById("action-log-readout"),
    landTargetOverlay: document.getElementById("land-target-overlay"),
    landTargetTitle: document.getElementById("land-target-title"),
    landTargetSelect: document.getElementById("land-target-select"),
    landTargetConfirm: document.getElementById("land-target-confirm"),
    landTargetCancel: document.getElementById("land-target-cancel"),
    roundStatusToken: document.getElementById("round-status-token"),
    roundStatusRound: document.getElementById("round-status-round"),
    roundStatusTurn: document.getElementById("round-status-turn"),
    publicCardPanel: document.getElementById("public-card-panel"),
    publicCardRow: document.getElementById("public-card-row"),
    publicBlindDrawButton: document.getElementById("public-blind-draw-button"),
    cardSelectionBackdrop: document.getElementById("card-selection-backdrop"),
    cardSelectionCancel: document.getElementById("card-selection-cancel"),
    publicScanConfirm: document.getElementById("public-scan-confirm"),
    discardSelectionBackdrop: document.getElementById("discard-selection-backdrop"),
    discardSelectionCancel: document.getElementById("discard-selection-cancel"),
    playCardActionButton: document.getElementById("play-card-action-button"),
    playCardSelectionCancel: document.getElementById("play-card-selection-cancel"),
    cardCornerActionButton: document.getElementById("card-corner-action-button"),
    movePaymentConfirm: document.getElementById("move-payment-confirm"),
    movePaymentCancel: document.getElementById("move-payment-cancel"),
    handScanCancel: document.getElementById("hand-scan-cancel"),
    playerHandPanelTitle: document.getElementById("player-hand-panel-title"),
    playerHandPanelHandCount: document.getElementById("player-hand-panel-hand-count"),
    playerHandPanelTitleHint: document.getElementById("player-hand-panel-title-hint"),
  };

  function getPlayerHandPanelTitleHint() {
    if (isDiscardSelectionActive()) {
      const remaining = cards.getDiscardRemaining(cardState);
      return `（请选择 ${remaining} 张弃牌）`;
    }
    if (isHandScanSelectionActive()) {
      return "（请选择一张牌进行扫描）";
    }
    if (isMovePaymentSelectionActive()) {
      const required = pendingMovePayment?.requiredMovePoints || MOVE_ENERGY_COST;
      return required > 1
        ? `（需 ${required} 点移动力：可选移动牌，剩余用能量补齐）`
        : "（可选移动牌弃置，或直接确认消耗 1 能量）";
    }
    if (isPlayCardSelectionActive()) {
      const pending = getPendingPlayCardSelection();
      return pending
        ? `（已选择 ${cards.getCardLabel(pending.card)}）`
        : "（请选择要打出的牌）";
    }
    const cornerAction = getPendingCardCornerQuickAction();
    if (cornerAction) {
      return `（已选择 ${cards.getCardLabel(cornerAction.card)}）`;
    }
    return "";
  }

  function updatePlayerHandPanelTitle() {
    if (!els.playerHandPanelTitle) return;

    const player = getCurrentPlayer();
    const count = Array.isArray(player?.hand)
      ? player.hand.length
      : Math.max(0, Math.round(Number(player?.resources?.handSize) || 0));

    if (els.playerHandPanelHandCount) {
      els.playerHandPanelHandCount.textContent = String(count);
      els.playerHandPanelHandCount.classList.toggle("is-over-limit", count > 4);
      els.playerHandPanelHandCount.setAttribute("aria-label", `当前手牌 ${count} 张`);
    }
    if (els.playerHandPanelTitleHint) {
      els.playerHandPanelTitleHint.textContent = getPlayerHandPanelTitleHint();
    }
  }

  function getPublicCardHeight() {
    const row = els.publicCardRow;
    if (!row) return null;

    const fromVar = getComputedStyle(row).getPropertyValue("--public-card-height").trim();
    if (fromVar) {
      const parsed = Number.parseFloat(fromVar);
      if (Number.isFinite(parsed) && parsed > 0) return parsed;
    }

    const reference = row.querySelector(".public-card");
    if (!reference) return null;
    const height = reference.getBoundingClientRect().height;
    return height > 0 ? height : null;
  }

  function initializeCardGame(handCount = 10) {
    if (!Array.isArray(playerState.players) || !playerState.players.length) return;

    for (const player of playerState.players) {
      player.hand = [];
      player.reservedCards = [];
      player.completedTaskCount = 0;
      player.resources.handSize = 0;
    }
    cardState.publicCards = Array.from({ length: cards.PUBLIC_CARD_COUNT }, () => null);
    cardState.discardPile = [];
    cards.setSelectionActive(cardState, false);
    cards.setPlayCardSelectionActive(cardState, false);
    cards.setDiscardSelectionActive(cardState, false, 0);
    for (const player of playerState.players) {
      if (player.color === "white" && dealModeledOpeningHand(player)) continue;
      cards.drawCardsToHand(cardState, playerState, player, handCount);
    }
    cards.ensurePublicCardsFilled(cardState, playerState);
  }

  function dealModeledOpeningHand(player) {
    const modeledIds = Array.from({ length: 10 }, (_item, index) => `b_${index + 1}.webp`);
    const entries = modeledIds
      .map((cardId) => cards.CARD_CATALOG.find((entry) => entry.card_id === cardId))
      .filter(Boolean);
    if (entries.length !== modeledIds.length) return false;
    for (const entry of entries) {
      cards.addCardToHand(player, cards.createCardInstance(entry, entry.card_id));
    }
    return true;
  }

  function stripAssetExtension(fileName) {
    return String(fileName || "").replace(/\.[^.]+$/, "");
  }

  function shuffleList(items) {
    const result = [...items];
    for (let index = result.length - 1; index > 0; index -= 1) {
      const pickIndex = Math.floor(Math.random() * (index + 1));
      [result[index], result[pickIndex]] = [result[pickIndex], result[index]];
    }
    return result;
  }

  function createIndustrySelectionCard(fileName) {
    return {
      id: `industry:${fileName}`,
      kind: "industry",
      label: stripAssetExtension(fileName),
      src: `../assets/industry/${fileName}`,
      width: INITIAL_SELECTION_CARD_SIZE.industry.width,
      height: INITIAL_SELECTION_CARD_SIZE.industry.height,
    };
  }

  function createInitialSelectionCard(index) {
    return {
      id: `initial:${index}`,
      kind: "initial",
      label: `初始牌 ${index}`,
      src: `../assets/initial_card/split/${index}.png`,
      width: INITIAL_SELECTION_CARD_SIZE.initial.width,
      height: INITIAL_SELECTION_CARD_SIZE.initial.height,
    };
  }

  function getInitialSelectionPlayerIds() {
    const activeIds = Array.isArray(turnState.activePlayerIds)
      ? turnState.activePlayerIds.filter((playerId) => getPlayerById(playerId))
      : [];
    if (activeIds.length) return activeIds;
    return playerState.currentPlayerId ? [playerState.currentPlayerId] : [];
  }

  function isInitialSelectionActive() {
    return setupSelectionState.phase === "selecting";
  }

  function getInitialSelectionOffer(playerId = playerState.currentPlayerId) {
    return setupSelectionState.offersByPlayerId[playerId] || null;
  }

  function isInitialSelectionConfirmed(playerId = playerState.currentPlayerId) {
    return setupSelectionState.confirmedPlayerIds.includes(playerId)
      || Boolean(getInitialSelectionOffer(playerId)?.confirmed);
  }

  function canConfirmInitialSelection(offer) {
    return Boolean(
      offer?.selectedIndustryId
      && Array.isArray(offer.selectedInitialIds)
      && offer.selectedInitialIds.length === INITIAL_SELECTION_REQUIRED.initial,
    );
  }

  function startInitialSelection() {
    const playerIds = getInitialSelectionPlayerIds();
    const industryDeck = shuffleList(INDUSTRY_CARD_FILES.map(createIndustrySelectionCard));
    const initialDeck = shuffleList(
      Array.from({ length: INITIAL_CARD_COUNT }, (_item, index) => createInitialSelectionCard(index + 1)),
    );

    setupSelectionState.phase = playerIds.length ? "selecting" : "complete";
    setupSelectionState.currentPlayerId = playerIds[0] || null;
    setupSelectionState.offersByPlayerId = {};
    setupSelectionState.confirmedPlayerIds = [];

    playerIds.forEach((playerId, index) => {
      const player = getPlayerById(playerId);
      if (player) player.initialSelection = null;
      setupSelectionState.offersByPlayerId[playerId] = {
        playerId,
        industryOptions: industryDeck.slice(index * 2, index * 2 + 2),
        initialOptions: initialDeck.slice(index * 3, index * 3 + 3),
        selectedIndustryId: null,
        selectedInitialIds: [],
        confirmed: false,
      };
    });

    if (setupSelectionState.currentPlayerId) {
      playerState.currentPlayerId = setupSelectionState.currentPlayerId;
      rocketState.statusNote = "请完成初始选择：公司 2 选 1，初始牌 3 选 2。";
    }

    renderDebugPlayerSwitch();
    renderPlayerStats();
    updateActionButtons();
    renderStateReadout();
  }

  function getCardFromInitialOffer(offer, kind, cardId) {
    const options = kind === "industry" ? offer?.industryOptions : offer?.initialOptions;
    return (options || []).find((card) => card.id === cardId) || null;
  }

  function handleInitialSelectionCardClick(kind, cardId) {
    if (!isInitialSelectionActive()) return;

    const playerId = playerState.currentPlayerId;
    const offer = getInitialSelectionOffer(playerId);
    if (!offer || offer.confirmed) return;

    if (kind === "industry") {
      offer.selectedIndustryId = cardId;
    } else if (kind === "initial") {
      const selected = offer.selectedInitialIds;
      const existingIndex = selected.indexOf(cardId);
      if (existingIndex >= 0) {
        selected.splice(existingIndex, 1);
      } else if (selected.length < INITIAL_SELECTION_REQUIRED.initial) {
        selected.push(cardId);
      }
    }

    renderReservedCards();
    renderStateReadout();
  }

  function recordInitialSelectionActionLog(player, selectedIndustry, selectedInitialCards, initialResult = null) {
    const initialLabels = selectedInitialCards.map((card) => card.label).filter(Boolean);
    const steps = [];
    if (selectedIndustry?.label) {
      steps.push({
        source: HISTORY_SOURCE_SETUP,
        text: `选择公司：${selectedIndustry.label}`,
      });
    }
    if (initialLabels.length) {
      steps.push({
        source: HISTORY_SOURCE_SETUP,
        text: `移出初始牌：${initialLabels.join("、")}`,
      });
    }
    if (initialResult?.message) {
      steps.push({
        source: HISTORY_SOURCE_SETUP,
        text: `结算初始效果：${initialResult.message}`,
      });
    }
    appendConfirmedActionLogEntry({
      title: "初始选择",
      player,
      actionType: "initialSelection",
      actionLabel: "初始选择",
      steps,
    });
  }

  function confirmInitialSelectionForCurrentPlayer() {
    if (!isInitialSelectionActive()) return;

    const player = getCurrentPlayer();
    const offer = getInitialSelectionOffer(player?.id);
    if (!player || !offer || offer.confirmed) return;

    if (!canConfirmInitialSelection(offer)) {
      rocketState.statusNote = "初始选择未完成：请选择 1 张公司和 2 张初始牌。";
      renderStateReadout();
      return;
    }

    const selectedIndustry = getCardFromInitialOffer(offer, "industry", offer.selectedIndustryId);
    const selectedInitialCards = offer.selectedInitialIds
      .map((cardId) => getCardFromInitialOffer(offer, "initial", cardId))
      .filter(Boolean);

    offer.confirmed = true;
    if (!setupSelectionState.confirmedPlayerIds.includes(player.id)) {
      setupSelectionState.confirmedPlayerIds.push(player.id);
    }
    player.initialSelection = {
      industry: selectedIndustry ? { ...selectedIndustry } : null,
      removedInitialCards: selectedInitialCards.map((card) => ({ ...card })),
    };

    if (industry?.shouldInitializeStrategyPassiveMarkers?.(player)) {
      industry.initializeStrategyPassiveMarkers(player);
    }
    if (industry?.shouldInitializeHeliosPassiveMarkers?.(player)) {
      industry.initializeHeliosPassiveMarkers(player);
    }

    const remainingPlayerId = getInitialSelectionPlayerIds()
      .find((playerId) => !isInitialSelectionConfirmed(playerId));
    if (remainingPlayerId) {
      recordInitialSelectionActionLog(player, selectedIndustry, selectedInitialCards);
      setupSelectionState.currentPlayerId = remainingPlayerId;
      playerState.currentPlayerId = remainingPlayerId;
      rocketState.statusNote = `已确认 ${player.colorLabel}玩家，轮到 ${getPlayerLabelById(remainingPlayerId)} 初始选择。`;
    } else {
      setupSelectionState.phase = "complete";
      setupSelectionState.currentPlayerId = null;
      playerState.currentPlayerId = turnState.startPlayerId || playerState.currentPlayerId;
      const initialResult = resolveInitialSelectionEffects();
      recordInitialSelectionActionLog(player, selectedIndustry, selectedInitialCards, initialResult);
      const incomeStarted = startInitialIncomeEffectFlow(initialResult?.pendingIncomeIncreases || []);
      applyIndustryStartupPassives();
      if (!incomeStarted) {
        rocketState.statusNote = initialResult?.message
          ? `所有玩家已完成初始选择，${initialResult.message}，游戏开始。`
          : "所有玩家已完成初始选择，游戏开始。";
      }
    }

    renderDebugPlayerSwitch();
    renderPlayerStats();
    renderTechBoard();
    renderSectorNebulaDataBoard();
    syncPlanetOrbitLandMarkers();
    renderAlienPanels();
    renderPublicCards();
    renderPlayerHand();
    renderRockets();
    syncInteractionFocusChrome();
    updateActionButtons();
    renderStateReadout();
    if (isInitialIncomeFlowActive()) {
      const latestEntry = actionLogState.entries[actionLogState.entries.length - 1];
      if (latestEntry) delete latestEntry.recoverySnapshot;
      renderActionLog();
    } else {
      refreshLatestActionLogRecoverySnapshot("初始选择后状态");
    }
  }

  function resolveInitialSelectionEffects() {
    if (!initialCards?.resolveInitialSelections) return null;

    const context = {
      ...createActionContext(),
      alienGameState,
    };
    const result = initialCards.resolveInitialSelections(context, {
      playerIds: getInitialSelectionPlayerIds(),
    });
    const hasSignalMarked = (result.events || []).some((event) => event?.type === "signalMarked");
    const settleResult = hasSignalMarked
      ? resolveCompletedSectorSettlements("initialSelection", {
        markMainActionIrreversible: false,
      })
      : null;

    if (settleResult?.ok) {
      return {
        ...result,
        settlement: settleResult,
        message: `${result.message}；${settleResult.message}；${settleResult.participantAwardMessage || "参与结算玩家各获得1宣传"}`,
      };
    }
    return result;
  }

  function buildInitialIncomeEffectNodes(entries = []) {
    const effects = [];
    for (const entry of entries) {
      const total = Math.max(0, Math.round(Number(entry?.count) || 0));
      if (!entry?.playerId || total <= 0) continue;
      const companyLabel = entry.label || "公司牌";
      for (let sequence = 1; sequence <= total; sequence += 1) {
        effects.push({
          id: `initial-income-${entry.playerId}-${sequence}`,
          type: "initial_income",
          icon: "income",
          label: `${companyLabel}：收入增加 ${sequence}/${total}`,
          status: "pending",
          undoable: false,
          options: {
            playerId: entry.playerId,
            companyLabel,
            sequence,
            total,
          },
        });
      }
    }
    return effects;
  }

  function startInitialIncomeEffectFlow(entries = []) {
    const effects = buildInitialIncomeEffectNodes(entries);
    if (!effects.length) return false;

    pendingActionEffectFlow = abilities.chain.startAbilityChain(
      "initialIncome",
      "初始收入增加",
      effects,
    );
    pendingActionEffectFlow.actionType = "initialIncome";
    pendingActionEffectFlow.playerId = effects[0]?.options?.playerId || null;

    const firstPlayer = getPlayerById(pendingActionEffectFlow.playerId);
    if (firstPlayer) {
      playerState.currentPlayerId = firstPlayer.id;
    }

    els.appWrap?.classList.toggle("action-effect-flow-active", true);
    rocketState.statusNote = "初始收入增加：请依次点击收入效果";
    renderDebugPlayerSwitch();
    renderPlayerStats();
    renderPlayerHand();
    activateNextActionEffect();
    return true;
  }

  function getCurrentInitialSelectionCards(player = getCurrentPlayer()) {
    const selection = player?.initialSelection;
    if (!selection) return [];
    return selection.industry ? [selection.industry] : [];
  }

  function createTurnState(sourcePlayers, options = {}) {
    const playerIds = (Array.isArray(sourcePlayers) ? sourcePlayers : [])
      .map((player) => player?.id)
      .filter(Boolean);
    const requestedCount = Math.max(1, Math.round(Number(options.activePlayerCount) || 1));
    const activePlayerCount = Math.min(requestedCount, playerIds.length || 1);
    const currentPlayerId = playerIds.includes(options.currentPlayerId) ? options.currentPlayerId : playerIds[0];
    const activePlayerIds = activePlayerCount === 1 && currentPlayerId
      ? [currentPlayerId]
      : playerIds.slice(0, activePlayerCount);

    return {
      roundNumber: 1,
      turnNumber: 1,
      activePlayerCount,
      turnOrderPlayerIds: playerIds,
      activePlayerIds,
      startPlayerId: activePlayerIds[0] || currentPlayerId || null,
      passedPlayerIds: [],
      completedTurnPlayerIds: [],
    };
  }

  function shufflePlayerIds(playerIds) {
    const result = [...playerIds];
    for (let index = result.length - 1; index > 0; index -= 1) {
      const pickIndex = Math.floor(Math.random() * (index + 1));
      [result[index], result[pickIndex]] = [result[pickIndex], result[index]];
    }
    return result;
  }

  function rotatePlayerIds(playerIds, startPlayerId) {
    if (!playerIds.length) return [];
    const startIndex = Math.max(0, playerIds.indexOf(startPlayerId));
    return [...playerIds.slice(startIndex), ...playerIds.slice(0, startIndex)];
  }

  function getActiveOrderedPlayerIds() {
    const activeSet = new Set(turnState.activePlayerIds);
    return turnState.turnOrderPlayerIds.filter((playerId) => activeSet.has(playerId));
  }

  function getRoundOrderPlayerIds() {
    const activeOrderedIds = getActiveOrderedPlayerIds();
    const startPlayerId = activeOrderedIds.includes(turnState.startPlayerId)
      ? turnState.startPlayerId
      : activeOrderedIds[0];
    return rotatePlayerIds(activeOrderedIds, startPlayerId);
  }

  function getPlayerById(playerId) {
    return playerState.players.find((player) => player.id === playerId) || null;
  }

  function getActivePlayers() {
    const activeIds = new Set(turnState.activePlayerIds || []);
    return playerState.players.filter((player) => activeIds.has(player.id));
  }

  function getPlayerLabelById(playerId) {
    const player = getPlayerById(playerId);
    return player ? player.colorLabel || player.name || player.id : playerId;
  }

  function getActionLogActionLabel(actionType, label) {
    return label || ACTION_LOG_DEFAULT_LABELS[actionType] || actionType || "本回合行动";
  }

  function normalizeActionLogText(text) {
    return String(text || "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function composeActionLogStepText(label, detail) {
    const cleanLabel = normalizeActionLogText(label);
    const cleanDetail = normalizeActionLogText(detail);
    if (!cleanDetail || cleanDetail === cleanLabel) return cleanLabel || "行动效果";
    if (cleanDetail.startsWith(`${cleanLabel}：`) || cleanDetail.startsWith(`${cleanLabel}:`)) {
      return cleanDetail;
    }
    if (!cleanLabel) return cleanDetail;
    return `${cleanLabel}：${cleanDetail}`;
  }

  function normalizeActionLogStep(source, label, detail = null, options = {}) {
    const text = composeActionLogStepText(label, detail);
    if (!text) return null;
    return {
      stepId: options.stepId || options.id || null,
      source,
      text,
      label: normalizeActionLogText(label),
      detail: normalizeActionLogText(detail),
      undoable: options.undoable !== false,
      irreversibleCode: options.irreversibleCode || null,
      irreversibleReason: normalizeActionLogText(options.irreversibleReason),
    };
  }

  function actionLogOptionsFromHistoryStep(step = {}) {
    return {
      stepId: step.id || null,
      undoable: step.undoable !== false,
      irreversibleCode: step.irreversibleCode || null,
      irreversibleReason: step.irreversibleReason || null,
    };
  }

  function ensureActionLogDraft(options = {}) {
    const player = options.player || getCurrentPlayer();
    const playerId = options.playerId || player?.id || playerState.currentPlayerId || null;
    const playerLabel = options.playerLabel || getPlayerLabelById(playerId);
    const isSameTurnDraft = actionLogState.draft
      && actionLogState.draft.roundNumber === turnState.roundNumber
      && actionLogState.draft.turnNumber === turnState.turnNumber
      && actionLogState.draft.playerId === playerId;

    if (!isSameTurnDraft) {
      actionLogState.draft = {
        roundNumber: turnState.roundNumber,
        turnNumber: turnState.turnNumber,
        playerId,
        playerLabel,
        actionType: null,
        actionLabel: "本回合行动",
        steps: [],
      };
    }

    if (options.actionType) {
      const draft = actionLogState.draft;
      const shouldReplaceAction = options.source !== HISTORY_SOURCE_QUICK
        || !draft.actionType
        || draft.actionType === "quick";
      if (shouldReplaceAction) {
        draft.actionType = options.actionType;
        draft.actionLabel = getActionLogActionLabel(options.actionType, options.label);
      }
    } else if (!actionLogState.draft.actionType && options.source === HISTORY_SOURCE_QUICK) {
      actionLogState.draft.actionType = "quick";
      actionLogState.draft.actionLabel = ACTION_LOG_DEFAULT_LABELS.quick;
    }

    return actionLogState.draft;
  }

  function startActionLogDraft(actionType, label, options = {}) {
    if (options.source === HISTORY_SOURCE_MAIN) {
      cancelCardCornerQuickAction({ silent: true });
    }
    return ensureActionLogDraft({
      ...options,
      actionType,
      label: getActionLogActionLabel(actionType, label),
    });
  }

  function appendActionLogStep(source, label, detail = null, options = {}) {
    const draft = ensureActionLogDraft({
      source,
      actionType: options.actionType,
      label: options.actionLabel,
      player: options.player,
    });
    const step = normalizeActionLogStep(source, label, detail, options);
    if (!step) return null;
    draft.steps.push(step);
    renderActionLog();
    return step;
  }

  function removeLastActionLogStep(source, stepId = null) {
    const draft = actionLogState.draft;
    if (!draft?.steps?.length) return null;
    for (let index = draft.steps.length - 1; index >= 0; index -= 1) {
      const step = draft.steps[index];
      const sourceMatches = !source || step.source === source;
      const idMatches = !stepId || step.stepId === stepId;
      if (sourceMatches && idMatches) {
        const [removed] = draft.steps.splice(index, 1);
        pruneEmptyActionLogDraft();
        renderActionLog();
        return removed;
      }
    }
    return null;
  }

  function removeActionLogStepsBySource(source) {
    const draft = actionLogState.draft;
    if (!draft?.steps?.length) {
      pruneEmptyActionLogDraft();
      renderActionLog();
      return;
    }
    draft.steps = draft.steps.filter((step) => step.source !== source);
    pruneEmptyActionLogDraft();
    renderActionLog();
  }

  function pruneEmptyActionLogDraft() {
    const draft = actionLogState.draft;
    if (!draft) return;
    if (!draft.steps.length && !actionHistory.hasSession() && !quickActionHistory.hasSession() && !pendingActionExecuted) {
      actionLogState.draft = null;
    }
  }

  function resetActionLog() {
    actionLogState.entries = [];
    actionLogState.draft = null;
    actionLogState.nextEntryId = 1;
    renderActionLog();
  }

  function createGameRecoverySnapshot(meta = {}) {
    return {
      version: GAME_RECOVERY_VERSION,
      meta: {
        roundNumber: turnState.roundNumber,
        turnNumber: turnState.turnNumber,
        currentPlayerId: playerState.currentPlayerId,
        entryId: meta.entryId ?? null,
        label: meta.label || null,
      },
      state: {
        solarState: structuredClone(solarState),
        nebulaDataState: structuredClone(nebulaDataState),
        alienGameState: structuredClone(alienGameState),
        finalScoringState: structuredClone(finalScoringState),
        playerState: structuredClone(playerState),
        turnState: structuredClone(turnState),
        rocketState: structuredClone(rocketState),
        planetStatsState: structuredClone(planetStatsState),
        techGameState: structuredClone(techGameState),
        cardState: structuredClone(cardState),
        cardTaskState: structuredClone(cardTaskState),
        setupSelectionState: structuredClone(setupSelectionState),
      },
    };
  }

  function attachRecoverySnapshotToActionLogEntry(entry, label = null) {
    if (!entry) return null;
    entry.recoverySnapshot = createGameRecoverySnapshot({
      entryId: entry.id,
      label: label || entry.actionLabel || entry.title || null,
    });
    return entry.recoverySnapshot;
  }

  function refreshLatestActionLogRecoverySnapshot(label = null) {
    const entry = actionLogState.entries[actionLogState.entries.length - 1] || null;
    if (!entry) return null;
    attachRecoverySnapshotToActionLogEntry(entry, label);
    renderActionLog();
    return entry.recoverySnapshot;
  }

  function normalizeRecoverableActionLogEntry(entry, options = {}) {
    const includeRecovery = options.includeRecovery !== false;
    const clone = structuredClone(entry);
    if (!includeRecovery) {
      delete clone.recoverySnapshot;
    }
    return clone;
  }

  function getRecoverableActionLog(options = {}) {
    return actionLogState.entries.map((entry) => normalizeRecoverableActionLogEntry(entry, options));
  }

  function createActionLogRecoveryPackage(options = {}) {
    return {
      version: GAME_RECOVERY_VERSION,
      latestSnapshot: createGameRecoverySnapshot({ label: "当前局面" }),
      entries: getRecoverableActionLog({ includeRecovery: options.includeRecovery !== false }),
    };
  }

  function getRecoveryEntriesFromInput(logOrPackage) {
    if (Array.isArray(logOrPackage)) return logOrPackage;
    if (Array.isArray(logOrPackage?.entries)) return logOrPackage.entries;
    return [];
  }

  function getRecoverySnapshotFromLog(logOrPackage, options = {}) {
    const entries = getRecoveryEntriesFromInput(logOrPackage);
    if (!entries.length) {
      return logOrPackage?.latestSnapshot || logOrPackage?.baseSnapshot || null;
    }
    if (options.entryId != null) {
      const match = entries.find((entry) => entry.id === options.entryId || String(entry.id) === String(options.entryId));
      return match?.recoverySnapshot || null;
    }
    const index = Number.isInteger(options.index)
      ? options.index
      : entries.length - 1;
    const entry = entries[Math.max(0, Math.min(entries.length - 1, index))];
    return entry?.recoverySnapshot || null;
  }

  function clearTransientStateForRecovery() {
    pendingDiscardAction = null;
    pendingCardSelectionAction = null;
    pendingScanTargetAction = null;
    pendingPublicScanQueue = null;
    pendingHandScanAction = null;
    pendingAlienTraceAction = null;
    pendingLandTargetAction = null;
    pendingCardTriggerAction = null;
    pendingCardTriggerFreeMove = null;
    pendingCardTaskCompletion = null;
    pendingJiuzheCardPlay = null;
    pendingJiuzheOpportunityOpen = false;
    jiuzheOpportunityQueue = [];
    pendingYichangdianCardGain = null;
    pendingYichangdianCornerAction = null;
    pendingBanrenmaCardGain = null;
    pendingBanrenmaOpportunity = null;
    banrenmaOpportunityQueue = [];
    pendingChongCardGain = null;
    pendingChongFossilChoice = null;
    pendingChongTaskCompletion = null;
    pendingAmibaCardGain = null;
    pendingAmibaSymbolChoice = null;
    pendingAmibaTraceRemoval = null;
    pendingAomomoCardGain = null;
    pendingRunezuCardGain = null;
    pendingRunezuSymbolBranch = null;
    pendingRunezuFaceSymbolPlacement = null;
    alienTracePickerState = null;
    debugAlienTraceModeActive = false;
    pendingActionExecuted = false;
    pendingPassPlayerId = null;
    pendingActionEffectFlow = null;
    pendingActionHasIrreversibleBarrier = false;
    pendingActionIrreversibleReason = null;
    effectStepActive = false;
    moveHighlightRocketId = null;
    pendingMovePayment = null;
    pendingPlayCardSelection = null;
    pendingCardCornerQuickAction = null;
    pendingCardCornerFreeMove = null;
    pendingIndustryAbility = null;
    industryFreeMoveState = null;
    historyStepOrder.length = 0;
    actionHistory.commitSession();
    quickActionHistory.commitSession();
    cards.setSelectionActive(cardState, false);
    cards.setPlayCardSelectionActive(cardState, false);
    cards.setDiscardSelectionActive(cardState, false, 0);
    if (techGameState?.ui) {
      techGameState.ui.industryBorrowMode = false;
    }
    tech.setTechSelectionActive(techGameState, false);
    if (els.scanTargetOverlay) els.scanTargetOverlay.hidden = true;
    if (els.landTargetOverlay) els.landTargetOverlay.hidden = true;
    if (els.dataPlaceOverlay) els.dataPlaceOverlay.hidden = true;
    if (els.actionEffectBar) els.actionEffectBar.hidden = true;
    els.appWrap?.classList.remove(
      "action-effect-flow-active",
      "move-mode-active",
      "card-selection-active",
      "play-card-selection-active",
      "discard-selection-active",
      "hand-scan-selection-active",
      "industry-hand-selection-active",
    );
  }

  function refreshAfterGameRecovery(message = "已从行动日志恢复局面") {
    setTokenAssetSizes();
    renderWheels();
    renderSectors();
    renderRotateStateToken();
    renderFinalScoreBoard();
    syncPlanetOrbitLandMarkers();
    renderTechBoard();
    renderAlienPanels();
    renderRockets();
    renderPublicCards();
    updatePublicCardControls();
    renderReservedCards();
    renderInitialSelectionArea();
    renderPlayerHand();
    renderPlayerStats();
    renderRoundStatus();
    renderDebugPlayerSwitch();
    renderActionEffectBar();
    syncCardSelectionChrome();
    syncDiscardSelectionChrome();
    syncHandScanSelectionChrome();
    syncPlayCardSelectionChrome();
    syncTechSelectionChrome();
    syncIndustryHandSelectionChrome();
    syncInteractionFocusChrome();
    updateQuickPanel();
    updateActionButtons();
    rocketState.statusNote = message;
    renderStateReadout();
    renderActionLog();
  }

  function applyGameRecoverySnapshot(snapshot, options = {}) {
    const state = snapshot?.state || snapshot;
    if (!state) {
      return { ok: false, message: "行动日志中没有可恢复快照" };
    }
    const slices = {
      solarState,
      nebulaDataState,
      alienGameState,
      finalScoringState,
      playerState,
      turnState,
      rocketState,
      planetStatsState,
      techGameState,
      cardState,
      cardTaskState,
      setupSelectionState,
    };
    for (const [key, target] of Object.entries(slices)) {
      if (state[key] != null) {
        restoreMutableObject(target, state[key]);
      }
    }
    clearTransientStateForRecovery();
    refreshAfterGameRecovery(options.message || "已从行动日志恢复局面");
    return {
      ok: true,
      snapshotVersion: snapshot.version || null,
      message: rocketState.statusNote,
    };
  }

  function importActionLogEntries(entries, options = {}) {
    const normalizedEntries = (entries || [])
      .map((entry) => structuredClone(entry))
      .filter((entry) => entry && entry.id != null);
    if (options.truncateToEntryId != null) {
      const index = normalizedEntries.findIndex((entry) => (
        entry.id === options.truncateToEntryId || String(entry.id) === String(options.truncateToEntryId)
      ));
      actionLogState.entries = index >= 0
        ? normalizedEntries.slice(0, index + 1)
        : normalizedEntries;
    } else if (Number.isInteger(options.truncateToIndex)) {
      actionLogState.entries = normalizedEntries.slice(0, options.truncateToIndex + 1);
    } else {
      actionLogState.entries = normalizedEntries;
    }
    actionLogState.nextEntryId = actionLogState.entries.reduce(
      (max, entry) => Math.max(max, Math.round(Number(entry.id)) || 0),
      0,
    ) + 1;
    actionLogState.draft = null;
  }

  function recoverFromActionLog(logOrPackage, options = {}) {
    const entries = getRecoveryEntriesFromInput(logOrPackage);
    const snapshot = getRecoverySnapshotFromLog(logOrPackage, options);
    if (!snapshot) {
      return { ok: false, message: "行动日志中没有可恢复快照" };
    }
    if (entries.length && options.restoreLog !== false) {
      importActionLogEntries(entries, {
        truncateToEntryId: options.entryId,
        truncateToIndex: Number.isInteger(options.index) ? options.index : null,
      });
    }
    return applyGameRecoverySnapshot(snapshot, {
      message: options.message || "已根据行动日志恢复局面",
    });
  }

  function commitActionLogDraft(options = {}) {
    const draft = actionLogState.draft;
    if (!draft) return null;
    const hasSteps = draft.steps.length > 0;
    const shouldCommit = hasSteps || options.force;
    if (!shouldCommit) {
      actionLogState.draft = null;
      renderActionLog();
      return null;
    }

    const entry = {
      id: actionLogState.nextEntryId,
      roundNumber: draft.roundNumber,
      turnNumber: draft.turnNumber,
      playerId: draft.playerId,
      playerLabel: draft.playerLabel,
      actionType: draft.actionType || options.actionType || "turn",
      actionLabel: draft.actionLabel || getActionLogActionLabel(options.actionType, options.actionLabel),
      passed: Boolean(options.passed),
      steps: draft.steps.map((step) => ({ ...step })),
    };
    attachRecoverySnapshotToActionLogEntry(entry, "行动提交后状态");
    actionLogState.nextEntryId += 1;
    actionLogState.entries.push(entry);
    actionLogState.draft = null;
    renderActionLog();
    return entry;
  }

  function appendConfirmedActionLogEntry(entryInput) {
    const player = entryInput.player || getCurrentPlayer();
    const playerId = entryInput.playerId || player?.id || null;
    const entry = {
      id: actionLogState.nextEntryId,
      roundNumber: entryInput.roundNumber ?? turnState.roundNumber,
      turnNumber: entryInput.turnNumber ?? turnState.turnNumber,
      title: entryInput.title || null,
      playerId,
      playerLabel: entryInput.playerLabel || getPlayerLabelById(playerId),
      actionType: entryInput.actionType || "turn",
      actionLabel: getActionLogActionLabel(entryInput.actionType, entryInput.actionLabel),
      passed: Boolean(entryInput.passed),
      steps: (entryInput.steps || []).map((step) => ({
        stepId: step.stepId || null,
        source: step.source || HISTORY_SOURCE_MAIN,
        text: normalizeActionLogText(step.text || composeActionLogStepText(step.label, step.detail)),
        label: normalizeActionLogText(step.label),
        detail: normalizeActionLogText(step.detail),
        undoable: step.undoable !== false,
        irreversibleCode: step.irreversibleCode || null,
        irreversibleReason: normalizeActionLogText(step.irreversibleReason),
      })).filter((step) => step.text),
    };
    attachRecoverySnapshotToActionLogEntry(entry, entry.title || "已确认日志后状态");
    actionLogState.nextEntryId += 1;
    actionLogState.entries.push(entry);
    renderActionLog();
    return entry;
  }

  function getActionLogEntryTitle(entry) {
    return entry.title || `第${entry.roundNumber}轮 第${entry.turnNumber}回合`;
  }

  function createActionLogEntryElement(entry) {
    const article = document.createElement("article");
    article.className = "action-log-entry";
    article.dataset.actionLogId = String(entry.id);

    const header = document.createElement("div");
    header.className = "action-log-entry-header";

    const title = document.createElement("div");
    title.className = "action-log-entry-title";
    title.textContent = getActionLogEntryTitle(entry);

    const sequence = document.createElement("div");
    sequence.className = "action-log-entry-sequence";
    sequence.textContent = `#${entry.id}`;

    const meta = document.createElement("div");
    meta.className = "action-log-entry-meta";
    meta.textContent = `${entry.playerLabel || "未知玩家"} · ${entry.actionLabel || "本回合行动"}`;

    header.append(title, sequence, meta);

    const list = document.createElement("ol");
    list.className = "action-log-effects";
    entry.steps.forEach((step, index) => {
      const item = document.createElement("li");
      item.className = `action-log-effect action-log-effect-${step.source || "main"}`;

      const indexNode = document.createElement("span");
      indexNode.className = "action-log-effect-index";
      indexNode.textContent = String(index + 1);

      const text = document.createElement("span");
      text.className = "action-log-effect-text";
      const sourceLabel = ACTION_LOG_SOURCE_LABELS[step.source] || "行动";
      text.textContent = `${sourceLabel}：${step.text}${
        step.irreversibleReason ? `（不可撤销：${step.irreversibleReason}）` : ""
      }`;

      item.append(indexNode, text);
      list.append(item);
    });

    article.append(header, list);
    return article;
  }

  function renderActionLog() {
    if (!els.actionLogReadout) return;
    const entries = actionLogState.entries;
    if (!entries.length) {
      const empty = document.createElement("p");
      empty.className = "action-log-empty";
      empty.textContent = "暂无已确认的行动。";
      els.actionLogReadout.replaceChildren(empty);
      return;
    }

    const list = document.createElement("div");
    list.className = "action-log-list";
    for (const entry of entries.slice().reverse()) {
      list.append(createActionLogEntryElement(entry));
    }
    els.actionLogReadout.replaceChildren(list);
  }

  function setReportTab(tab) {
    const nextTab = tab === "action" ? "action" : "state";
    actionLogState.activeReportTab = nextTab;
    const stateActive = nextTab === "state";
    els.stateLogTab?.classList.toggle("is-active", stateActive);
    els.actionLogTab?.classList.toggle("is-active", !stateActive);
    els.stateLogTab?.setAttribute("aria-selected", String(stateActive));
    els.actionLogTab?.setAttribute("aria-selected", String(!stateActive));
    if (els.stateReadout) els.stateReadout.hidden = !stateActive;
    if (els.actionLogReadout) els.actionLogReadout.hidden = stateActive;
    if (!stateActive) renderActionLog();
  }

  function setTurnStatePlayerOrder(playerIds, options = {}) {
    const validPlayerIds = playerIds.filter((playerId) => getPlayerById(playerId));
    if (!validPlayerIds.length) return;

    const activePlayerCount = Math.min(
      Math.max(1, Math.round(Number(options.activePlayerCount) || turnState.activePlayerCount || 1)),
      validPlayerIds.length,
    );

    turnState.turnOrderPlayerIds = validPlayerIds;
    turnState.activePlayerCount = activePlayerCount;
    turnState.activePlayerIds = validPlayerIds.slice(0, activePlayerCount);
    turnState.startPlayerId = turnState.activePlayerIds[0] || validPlayerIds[0];
    turnState.roundNumber = 1;
    turnState.turnNumber = 1;
    turnState.passedPlayerIds = [];
    turnState.completedTurnPlayerIds = [];
    playerState.currentPlayerId = turnState.startPlayerId;
  }

  function randomizePlayerTurnOrder() {
    const playerIds = playerState.players.map((player) => player.id);
    const defaultPlayerId = playerState.players.find((player) => player.color === DEFAULT_INITIAL_PLAYER_COLOR)?.id;
    const shuffledIds = shufflePlayerIds(playerIds.filter((playerId) => playerId !== defaultPlayerId));
    const orderedIds = defaultPlayerId ? [defaultPlayerId, ...shuffledIds] : shufflePlayerIds(playerIds);
    setTurnStatePlayerOrder(orderedIds, {
      activePlayerCount: turnState.activePlayerCount || DEFAULT_ACTIVE_PLAYER_COUNT,
    });
  }

  function isPlayerPassedThisRound(playerId) {
    return turnState.passedPlayerIds.includes(playerId);
  }

  function hasPlayerCompletedThisTurn(playerId) {
    return turnState.completedTurnPlayerIds.includes(playerId);
  }

  function getFirstEligiblePlayerId() {
    return getRoundOrderPlayerIds().find((playerId) => !isPlayerPassedThisRound(playerId)) || null;
  }

  function getNextEligiblePlayerId(afterPlayerId) {
    const order = getRoundOrderPlayerIds();
    if (!order.length) return null;
    const startIndex = order.includes(afterPlayerId) ? order.indexOf(afterPlayerId) : -1;

    for (let offset = 1; offset <= order.length; offset += 1) {
      const playerId = order[(startIndex + offset + order.length) % order.length];
      if (!isPlayerPassedThisRound(playerId) && !hasPlayerCompletedThisTurn(playerId)) {
        return playerId;
      }
    }

    return null;
  }

  function haveAllActivePlayersPassed() {
    return turnState.activePlayerIds.length > 0
      && turnState.activePlayerIds.every((playerId) => isPlayerPassedThisRound(playerId));
  }

  function advanceRoundStartPlayer() {
    const activeOrderedIds = getActiveOrderedPlayerIds();
    if (!activeOrderedIds.length) return null;

    const currentStartIndex = activeOrderedIds.includes(turnState.startPlayerId)
      ? activeOrderedIds.indexOf(turnState.startPlayerId)
      : 0;
    turnState.startPlayerId = activeOrderedIds[(currentStartIndex + 1) % activeOrderedIds.length];
    return turnState.startPlayerId;
  }

  function beginNextRound() {
    industry?.resetAllRoundIndustryRuntimeState?.(playerState.players);
    turnState.roundNumber += 1;
    turnState.turnNumber = 1;
    turnState.passedPlayerIds = [];
    turnState.completedTurnPlayerIds = [];
    const nextStartPlayerId = advanceRoundStartPlayer();
    playerState.currentPlayerId = nextStartPlayerId || turnState.activePlayerIds[0] || playerState.currentPlayerId;
    return { roundAdvanced: true, turnAdvanced: true, nextPlayerId: playerState.currentPlayerId };
  }

  function advanceTurnAfterPlayerAction(playerId, options = {}) {
    if (!playerId) return { roundAdvanced: false, turnAdvanced: false, nextPlayerId: playerState.currentPlayerId };

    if (options.passed && !turnState.passedPlayerIds.includes(playerId)) {
      turnState.passedPlayerIds.push(playerId);
    }
    if (!turnState.completedTurnPlayerIds.includes(playerId)) {
      turnState.completedTurnPlayerIds.push(playerId);
    }

    if (haveAllActivePlayersPassed()) {
      return beginNextRound();
    }

    const nextPlayerId = getNextEligiblePlayerId(playerId);
    if (nextPlayerId) {
      playerState.currentPlayerId = nextPlayerId;
      turnState.turnNumber += 1;
      return { roundAdvanced: false, turnAdvanced: true, nextPlayerId };
    }

    turnState.turnNumber += 1;
    turnState.completedTurnPlayerIds = [];
    const firstEligiblePlayerId = getFirstEligiblePlayerId();
    playerState.currentPlayerId = firstEligiblePlayerId || playerState.currentPlayerId;
    return { roundAdvanced: false, turnAdvanced: true, nextPlayerId: playerState.currentPlayerId };
  }

  function renderRoundStatus() {
    if (els.roundStatusRound) {
      els.roundStatusRound.textContent = `第 ${turnState.roundNumber} 轮`;
    }
    if (els.roundStatusTurn) {
      els.roundStatusTurn.textContent = `第 ${turnState.turnNumber} 回合`;
    }
  }

  function getTurnReadoutLines() {
    const orderLabels = turnState.turnOrderPlayerIds.map(getPlayerLabelById).join(" > ");
    const roundOrderLabels = getRoundOrderPlayerIds().map(getPlayerLabelById).join(" > ");
    const passedLabels = turnState.passedPlayerIds.map(getPlayerLabelById).join("、") || "无";
    const completedLabels = turnState.completedTurnPlayerIds.map(getPlayerLabelById).join("、") || "无";

    return [
      "轮次状态",
      `第${turnState.roundNumber}轮 第${turnState.turnNumber}回合`,
      `基础顺位 ${orderLabels || "无"}`,
      `本轮顺位 ${roundOrderLabels || "无"}`,
      `本轮已 PASS ${passedLabels}`,
      `当前行动圈已行动 ${completedLabels}`,
    ];
  }

  function isCardSelectionActive() {
    return cards.isSelectionActive(cardState);
  }

  function isDiscardSelectionActive() {
    return cards.isDiscardSelectionActive(cardState);
  }

  function isPlayCardSelectionActive() {
    return cards.isPlayCardSelectionActive(cardState);
  }

  function allowsBlindDrawInSelection() {
    return pendingCardSelectionAction?.allowBlindDraw !== false;
  }

  function getPublicScanBonusSelectableCount(player) {
    return Math.min(
      Math.max(0, player?.resources?.additionalPublicScan || 0),
      PUBLIC_SCAN_MAX_BONUS_CARDS,
    );
  }

  function getPublicScanMaxSelectable(player) {
    const filledSlots = cardState.publicCards.filter(Boolean).length;
    return Math.min(1 + getPublicScanBonusSelectableCount(player), 3, filledSlots);
  }

  function isPublicScanMultiSelectActive() {
    return isCardSelectionActive()
      && pendingCardSelectionAction?.type === "public_scan"
      && (pendingCardSelectionAction.maxSelectable ?? 1) > 1;
  }

  function syncPublicScanConfirmButton() {
    if (!els.publicScanConfirm) return;
    const multi = isPublicScanMultiSelectActive();
    els.publicScanConfirm.hidden = !multi;
    if (!multi) return;
    const count = pendingCardSelectionAction?.selectedSlots?.length || 0;
    els.publicScanConfirm.disabled = count < 1;
    els.publicScanConfirm.textContent = count > 0 ? `确认扫描（${count}张）` : "确认扫描";
  }

  function syncCardSelectionChrome() {
    const active = isCardSelectionActive();
    if (active) cancelCardCornerQuickAction({ silent: true });
    els.appWrap?.classList.toggle("card-selection-active", active);
    els.publicCardPanel?.classList.toggle("card-selection-active", active);
    els.publicCardPanel?.classList.toggle("public-card-panel-focused", active);
    if (els.cardSelectionBackdrop) {
      els.cardSelectionBackdrop.hidden = !active;
      els.cardSelectionBackdrop.setAttribute("aria-hidden", String(!active));
    }
    if (els.cardSelectionCancel) {
      els.cardSelectionCancel.hidden = !active;
    }
    syncPublicScanConfirmButton();
    if (active) setQuickPanelOpen(false);
    renderPublicCards();
    updatePublicCardControls();
    syncInteractionFocusChrome();
  }

  const INTERACTION_FOCUS = Object.freeze({
    PUBLIC_CARDS: "public-cards",
    HAND_CARDS: "hand-cards",
    TECH_PANEL: "tech-panel",
    BOARD_ROCKETS: "board-rockets",
    COMPANY_MARKER: "company-marker",
  });

  function isBoardRocketInteractionActive() {
    return moveHighlightRocketId != null
      || isIndustryFreeMoveActive()
      || Boolean(pendingCardTriggerFreeMove)
      || Boolean(pendingCardCornerFreeMove)
      || Boolean(pendingActionEffectFlow?.freeMoveMode)
      || Boolean(pendingActionEffectFlow?.cardMoveEffect);
  }

  function getInteractionFocusMode() {
    if (isIndustryHandSelectionActive()) return INTERACTION_FOCUS.HAND_CARDS;
    if (isDiscardSelectionActive()
      || isPlayCardSelectionActive()
      || isMovePaymentSelectionActive()
      || isHandScanSelectionActive()) {
      return INTERACTION_FOCUS.HAND_CARDS;
    }
    if (isCardSelectionActive()) return INTERACTION_FOCUS.PUBLIC_CARDS;
    if (isTechTilePickingActive() || techGameState?.ui?.industryBorrowMode) {
      return INTERACTION_FOCUS.TECH_PANEL;
    }
    if (isBoardRocketInteractionActive()) return INTERACTION_FOCUS.BOARD_ROCKETS;
    if (canUseCardCornerQuickAction() && getPendingCardCornerQuickAction()) {
      return INTERACTION_FOCUS.HAND_CARDS;
    }
    return null;
  }

  function syncInteractionFocusChrome() {
    const mode = getInteractionFocusMode();
    if (!els.appWrap) return;
    els.appWrap.dataset.interactionFocus = mode || "";
    els.boardShell?.classList.toggle("board-shell-focused", mode === INTERACTION_FOCUS.BOARD_ROCKETS);
  }

  function syncIndustryHandSelectionChrome() {
    const active = isIndustryHandSelectionActive();
    if (active) cancelCardCornerQuickAction({ silent: true });
    els.appWrap?.classList.toggle("industry-hand-selection-active", active);
    els.playerHandPanel?.classList.toggle("industry-hand-selection-active", active);
    els.playerHandPanel?.classList.toggle("player-hand-panel-focused", active);
    if (active) {
      setQuickPanelOpen(false);
      scrollToPlayerHandPanel();
    }
    updatePlayerHandPanelTitle();
    renderPlayerHand();
    syncInteractionFocusChrome();
  }

  function canSelectRocketForMoveInteraction(rocket) {
    const player = getCurrentPlayer();
    if (rocket.playerId !== player?.id) return false;
    if (!(rocketActions.isMovablePlayerToken?.(rocket) || rocketActions.isControllablePlayerRocket(rocket))) return false;
    if (isRocketOnPlanetsReference(rocket)) return false;
    if (industryFreeMoveState?.movedRocketIds?.includes(rocket.id)) return false;
    return true;
  }

  function isRocketMoveCandidate(rocket) {
    if (!isBoardRocketInteractionActive()) return false;
    if (moveHighlightRocketId != null) return rocket.id === moveHighlightRocketId;
    return canSelectRocketForMoveInteraction(rocket);
  }

  function isRocketMoveMuted(rocket) {
    if (!isBoardRocketInteractionActive()) return false;
    if (isRocketMoveCandidate(rocket)) return false;
    if (isRocketOnPlanetsReference(rocket)) return false;
    return true;
  }

  function syncDiscardSelectionChrome() {
    const active = isDiscardSelectionActive();
    if (active) cancelCardCornerQuickAction({ silent: true });
    els.appWrap?.classList.toggle("discard-selection-active", active);
    els.playerHandPanel?.classList.toggle("discard-selection-active", active);
    els.playerHandPanel?.classList.toggle("player-hand-panel-focused", active);
    if (els.discardSelectionBackdrop) {
      els.discardSelectionBackdrop.hidden = !active;
      els.discardSelectionBackdrop.setAttribute("aria-hidden", String(!active));
    }
    if (els.discardSelectionCancel) {
      els.discardSelectionCancel.hidden = !active;
    }
    updatePlayerHandPanelTitle();
    if (active) setQuickPanelOpen(false);
    renderPlayerHand();
    syncInteractionFocusChrome();
  }

  function isHandScanSelectionActive() {
    return pendingHandScanAction != null;
  }

  function syncHandScanSelectionChrome() {
    const active = isHandScanSelectionActive();
    if (active) cancelCardCornerQuickAction({ silent: true });
    els.appWrap?.classList.toggle("hand-scan-selection-active", active);
    els.playerHandPanel?.classList.toggle("hand-scan-selection-active", active);
    els.playerHandPanel?.classList.toggle("player-hand-panel-focused", active);
    if (els.handScanCancel) {
      els.handScanCancel.hidden = !active;
    }
    updatePlayerHandPanelTitle();
    if (active) setQuickPanelOpen(false);
    renderPlayerHand();
    syncInteractionFocusChrome();
  }

  function cancelHandScanSelection() {
    if (!isHandScanSelectionActive()) return;

    const fromEffectFlow = Boolean(pendingHandScanAction?.fromEffectFlow || pendingActionEffectFlow);
    pendingHandScanAction = null;
    rocketState.statusNote = "已取消手牌扫描";
    syncHandScanSelectionChrome();
    updateActionButtons();
    renderStateReadout();
  }

  function isMovePaymentSelectionActive() {
    return pendingMovePayment != null;
  }

  function isMovePaymentCard(card) {
    return Number(card?.discardActionCode) === MOVE_DISCARD_ACTION_CODE
      || Boolean(cards.getDiscardActionMoveRewardForCard?.(card));
  }

  function playerHasMovePaymentCard(player) {
    return (player?.hand || []).some((card) => isMovePaymentCard(card));
  }

  function getMovePaymentCardCount(player) {
    return (player?.hand || []).filter((card) => isMovePaymentCard(card)).length;
  }

  function getSectorContentForMove(coordinate) {
    if (!coordinate) return null;
    return solar.resolveVisibleContent(coordinate.x, coordinate.y, solarState)?.content || null;
  }

  function isAsteroidContent(content) {
    return content?.kind === solar.layout.CONTENT_KIND.ASTEROID;
  }

  function getRequiredMovePointsForUi(player, rocketId, deltaX, deltaY) {
    const rocket = rocketState.rockets.find((item) => item.id === rocketId);
    const from = rocketActions.getRocketSectorCoordinate(rocket);
    if (!from) return 1;
    const fromContent = getSectorContentForMove(from);
    if (isAsteroidContent(fromContent) && !players.playerOwnsTech(player, "orange2")) {
      return 2;
    }
    return 1;
  }

  function canPayForMove(player, requiredMovePoints = MOVE_ENERGY_COST) {
    const energy = Number(player?.resources?.energy) || 0;
    const movementCards = getMovePaymentCardCount(player);
    if (energy + movementCards >= requiredMovePoints) return { ok: true };
    return { ok: false, message: `移动力不足，需要 ${requiredMovePoints} 点移动力` };
  }

  function syncMovePaymentChrome() {
    const active = isMovePaymentSelectionActive();
    if (active) cancelCardCornerQuickAction({ silent: true });
    els.appWrap?.classList.toggle("move-payment-selection-active", active);
    els.playerHandPanel?.classList.toggle("move-payment-selection-active", active);
    els.playerHandPanel?.classList.toggle("player-hand-panel-focused", active);
    if (els.movePaymentConfirm) {
      els.movePaymentConfirm.hidden = !active;
      els.movePaymentConfirm.disabled = !active;
    }
    if (els.movePaymentCancel) {
      els.movePaymentCancel.hidden = !active;
    }
    updatePlayerHandPanelTitle();
    if (active) setQuickPanelOpen(false);
    renderPlayerHand();
    syncInteractionFocusChrome();
  }

  function scrollToPlayerHandPanel() {
    const panel = els.playerHandPanel;
    if (!panel) return;

    requestAnimationFrame(() => {
      panel.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "nearest",
      });
    });
  }

  function cancelMovePaymentSelection() {
    if (!isMovePaymentSelectionActive()) return;

    pendingMovePayment = null;
    rocketState.statusNote = "已取消移动";
    syncMovePaymentChrome();
    updateActionButtons();
    renderStateReadout();
  }

  function beginMovePaymentSelection(deltaX, deltaY, rocketId) {
    const blocked = blockIncompatiblePendingQuickAction("move");
    if (blocked) return blocked;

    const gameplayLockReason = getGameplayLockReason();
    if (gameplayLockReason) {
      return { ok: false, message: gameplayLockReason };
    }

    if (isTechTilePickingActive()) {
      return { ok: false, message: "请先完成科技选择" };
    }
    if (isCardSelectionActive()) {
      return { ok: false, message: "请先完成精选" };
    }
    if (isDiscardSelectionActive()) {
      return { ok: false, message: "请先完成弃牌" };
    }
    if (isPlayCardSelectionActive()) {
      return { ok: false, message: "请先完成打牌" };
    }

    const currentPlayer = getCurrentPlayer();
    const requiredMovePoints = getRequiredMovePointsForUi(currentPlayer, rocketId, deltaX, deltaY);
    const payCheck = canPayForMove(currentPlayer, requiredMovePoints);
    if (!payCheck.ok) {
      rocketState.statusNote = payCheck.message;
      renderStateReadout();
      return payCheck;
    }

    const moveCheck = rocketActions.canMoveRocket(rocketState, rocketId, deltaX, deltaY);
    if (!moveCheck.ok) {
      rocketState.statusNote = moveCheck.message;
      renderStateReadout();
      return moveCheck;
    }

    pendingMovePayment = {
      deltaX,
      deltaY,
      rocketId,
      requiredMovePoints,
      selectedHandIndices: [],
    };
    rocketState.statusNote = requiredMovePoints > 1
      ? `移动：需要 ${requiredMovePoints} 点移动力，可选择移动牌，剩余用能量补齐`
      : "移动：选择移动牌弃置，或直接确认消耗 1 能量";
    syncMovePaymentChrome();
    scrollToPlayerHandPanel();
    updateActionButtons();
    renderStateReadout();
    return { ok: true, message: rocketState.statusNote };
  }

  function handleHandCardMovePayment(handIndex) {
    if (!isMovePaymentSelectionActive()) return;

    const currentPlayer = getCurrentPlayer();
    const index = Math.round(handIndex);
    const card = currentPlayer?.hand?.[index];
    if (!isMovePaymentCard(card)) return;

    const selected = pendingMovePayment.selectedHandIndices || [];
    if (selected.includes(index)) {
      pendingMovePayment.selectedHandIndices = selected.filter((item) => item !== index);
    } else if (selected.length < (pendingMovePayment.requiredMovePoints || MOVE_ENERGY_COST)) {
      pendingMovePayment.selectedHandIndices = [...selected, index];
    }
    renderPlayerHand();
  }

  function confirmMovePayment() {
    if (!isMovePaymentSelectionActive()) return;

    const currentPlayer = getCurrentPlayer();
    const { requiredMovePoints = MOVE_ENERGY_COST } = pendingMovePayment;
    const selectedHandIndices = [...(pendingMovePayment.selectedHandIndices || [])].sort((left, right) => left - right);
    let paymentNote = "";
    let handSnapshot = null;
    let discardPileSnapshot = null;
    let discardCommand = null;
    const selectedMoveCards = selectedHandIndices
      .map((index) => currentPlayer?.hand?.[index])
      .filter(Boolean);

    if (selectedMoveCards.length !== selectedHandIndices.length
      || selectedMoveCards.some((card) => !isMovePaymentCard(card))) {
      rocketState.statusNote = "请选择可弃置的移动牌";
      renderStateReadout();
      return;
    }

    const energyCost = Math.max(0, requiredMovePoints - selectedMoveCards.length);
    if (!players.canAfford(currentPlayer, { energy: energyCost })) {
      rocketState.statusNote = selectedMoveCards.length
        ? `能量不足，仍需 ${energyCost} 能量补齐移动力`
        : playerHasMovePaymentCard(currentPlayer)
          ? "能量不足，请选择移动牌弃置"
          : "能量不足，无法移动";
      renderStateReadout();
      return;
    }

    if (selectedHandIndices.length) {
      handSnapshot = currentPlayer.hand.slice();
      discardPileSnapshot = (cardState.discardPile || []).slice();
      const discardedCards = [];
      for (const index of [...selectedHandIndices].sort((left, right) => right - left)) {
        const discardResult = cards.discardFromHandAtIndex(currentPlayer, index);
        if (!discardResult.ok) {
          currentPlayer.hand = handSnapshot.slice();
          currentPlayer.resources.handSize = currentPlayer.hand.length;
          cardState.discardPile = discardPileSnapshot.slice();
          rocketState.statusNote = discardResult.message;
          renderStateReadout();
          return;
        }
        cards.addToDiscardPile(cardState, discardResult.card);
        discardedCards.push(discardResult.card);
      }
      discardCommand = historyCommands.createDiscardHandCardCommand(
        cardState,
        currentPlayer,
        handSnapshot,
        discardPileSnapshot,
      );
      paymentNote = `弃掉 ${discardedCards.reverse().map((card) => cards.getCardLabel(card)).join("、")}`;
    }
    if (energyCost > 0) {
      paymentNote = paymentNote
        ? `${paymentNote}，消耗 ${energyCost} 能量`
        : `消耗 ${energyCost} 能量`;
    }
    const moveOptions = {
      cost: energyCost > 0 ? { energy: energyCost } : {},
      movementPoints: selectedMoveCards.length + energyCost,
      historyLabel: `移动消耗 ${selectedMoveCards.length ? `${selectedMoveCards.length} 张移动牌` : ""}${selectedMoveCards.length && energyCost ? " + " : ""}${energyCost ? `${energyCost} 能量` : ""}`,
    };

    const pending = pendingMovePayment;
    const cardMoveEffectContext = pending.cardMoveEffectContext || null;
    pendingMovePayment = null;
    syncMovePaymentChrome();

    if (cardMoveEffectContext) {
      return executeCardEffectMove(
        pending.deltaX,
        pending.deltaY,
        pending.rocketId,
        {
          terrainRequired: cardMoveEffectContext.terrainRequired,
          poolUsed: cardMoveEffectContext.poolUsed,
          energyCost,
          discardCommand,
        },
      );
    }

    const moveCheck = rocketActions.canMoveRocket(rocketState, pending.rocketId, pending.deltaX, pending.deltaY);
    if (!moveCheck.ok) {
      rocketState.statusNote = moveCheck.message;
      renderPlayerStats();
      updateActionButtons();
      renderStateReadout();
      return moveCheck;
    }

    const moveResult = abilities.executeAbility("moveProbe", createActionContext(), {
      ...moveOptions,
      rocketId: pending.rocketId,
      deltaX: pending.deltaX,
      deltaY: pending.deltaY,
    });
    if (!moveResult.ok && discardCommand) {
      discardCommand.undo();
    }
    if (moveResult.rocket) renderRocketElement(moveResult.rocket);
    if (moveResult.ok) {
      rocketState.activeRocketId = null;
      clearMoveRocketHighlight();
      rocketState.statusNote = `${paymentNote}，${moveResult.message}`;
      recordMoveActionHistory(moveResult, discardCommand);
      settleCardTasksAfterEffect({ events: moveResult.events, render: false });
    } else {
      rocketState.statusNote = moveResult.message;
    }

    renderPlayerStats();
    updateActionButtons();
    renderStateReadout();
    return moveResult;
  }

  function initCardMoveEffectState(effect) {
    const movementPoints = Math.max(1, Math.round(Number(effect.options?.movementPoints || 1)));
    pendingActionEffectFlow.cardMoveEffect = {
      effect,
      poolRemaining: movementPoints,
    };
    effect.badge = String(movementPoints);
  }

  function executeCardEffectMove(deltaX, deltaY, rocketId, payment = {}) {
    const ctx = pendingActionEffectFlow?.cardMoveEffect;
    const effect = ctx?.effect || getCurrentActionEffect();
    if (!effect) return { ok: false, message: "没有待结算的卡牌移动" };

    const terrainRequired = payment.terrainRequired
      || getRequiredMovePointsForUi(getCurrentPlayer(), rocketId, deltaX, deltaY);
    const poolUsed = Number.isFinite(Number(payment.poolUsed))
      ? Math.max(0, Math.round(Number(payment.poolUsed)))
      : Math.min(ctx?.poolRemaining || 0, terrainRequired);
    const energyCost = Math.max(0, Math.round(Number(payment.energyCost) || 0));

    beginEffectHistoryStep(effect.options?.historyLabel || effect.label);

    const result = abilities.executeAbility("moveProbe", createActionContext(), {
      cost: energyCost > 0 ? { energy: energyCost } : {},
      movementPoints: terrainRequired,
      rocketId,
      deltaX,
      deltaY,
      source: "card",
      historyLabel: effect.options?.historyLabel || effect.label,
      suppressArrivalRewards: Boolean(effect.options?.suppressArrivalRewards),
    });
    if (result.rocket) renderRocketElement(result.rocket);
    if (!result.ok) {
      if (payment.discardCommand) payment.discardCommand.undo();
      endEffectHistoryStep();
      rocketState.statusNote = result.message;
      renderStateReadout();
      return result;
    }

    if (payment.discardCommand) recordHistoryCommand(payment.discardCommand);
    recordAbilityCommands(result);

    const messageParts = [];
    const appliedRewards = applyCardMoveAfterEventRewards(effect, result, messageParts);
    const arrivalSettlement = settleCardTasksAfterEffect({ events: result.events, skipType1: true, render: false });
    const completedTransportForMovedToken = (arrivalSettlement?.chongCompletions || [])
      .some((item) => Number(item.event?.rocketId) === Number(rocketId));
    if (completedTransportForMovedToken) {
      const transportMessages = (arrivalSettlement.chongCompletions || [])
        .filter((item) => Number(item.event?.rocketId) === Number(rocketId))
        .map((item) => item.message)
        .filter(Boolean);
      if (transportMessages.length) messageParts.push(...transportMessages);
    }
    const rewardText = messageParts.length ? `；${messageParts.join("；")}` : "";

    if (ctx) {
      ctx.poolRemaining = completedTransportForMovedToken
        ? 0
        : Math.max(0, ctx.poolRemaining - poolUsed);
      effect.badge = String(ctx.poolRemaining);
    }

    rocketState.activeRocketId = null;
    clearMoveRocketHighlight();

    if (ctx && ctx.poolRemaining > 0) {
      pendingActionEffectFlow.cardMoveEffect = ctx;
      const currentPlayer = getCurrentPlayer();
      const rocketsForPlayer = getMovableTokensForPlayer(currentPlayer?.id);
      rocketState.statusNote = `${effect.label}：剩余 ${ctx.poolRemaining} 点移动力`;
      if (rocketsForPlayer.length === 1) {
        activateMoveMode(rocketsForPlayer[0].id);
      } else {
        deactivateMoveMode();
        rocketState.statusNote += "，请点击要移动的飞船";
      }
      effect.result = {
        ...result,
        message: `${result.message}${rewardText}`,
        payload: {
          ...(result.payload || {}),
          appliedRewards,
          poolRemaining: ctx.poolRemaining,
        },
      };
      renderActionEffectBar();
      renderPlayerStats();
      renderStateReadout();
      return effect.result;
    }

    pendingActionEffectFlow.cardMoveEffect = null;
    deactivateMoveMode();
    effect.result = {
      ...result,
      message: `${result.message}${rewardText}`,
      payload: {
        ...(result.payload || {}),
        appliedRewards,
      },
    };
    rocketState.statusNote = `${effect.label}：${effect.result.message}`;
    renderActionEffectBar();
    renderPlayerStats();
    completeCurrentActionEffect();
    renderStateReadout();
    return effect.result;
  }

  function requestCardEffectMove(deltaX, deltaY, rocketId) {
    const ctx = pendingActionEffectFlow?.cardMoveEffect;
    const effect = ctx?.effect || getCurrentActionEffect();
    if (!effect) return { ok: false, message: "没有待结算的卡牌移动" };

    const moveCheck = rocketActions.canMoveRocket(rocketState, rocketId, deltaX, deltaY);
    if (!moveCheck.ok) {
      rocketState.statusNote = moveCheck.message;
      renderStateReadout();
      return moveCheck;
    }

    const currentPlayer = getCurrentPlayer();
    const terrainRequired = getRequiredMovePointsForUi(currentPlayer, rocketId, deltaX, deltaY);
    const poolRemaining = ctx?.poolRemaining ?? Math.max(1, Math.round(Number(effect.options?.movementPoints || 1)));
    const poolUsed = Math.min(poolRemaining, terrainRequired);
    const paymentRequired = terrainRequired - poolUsed;

    if (paymentRequired > 0) {
      const payCheck = canPayForMove(currentPlayer, paymentRequired);
      if (!payCheck.ok) {
        rocketState.statusNote = payCheck.message;
        renderStateReadout();
        return payCheck;
      }

      pendingMovePayment = {
        deltaX,
        deltaY,
        rocketId,
        requiredMovePoints: paymentRequired,
        selectedHandIndices: [],
        cardMoveEffectContext: {
          terrainRequired,
          poolUsed,
        },
      };
      rocketState.statusNote = poolUsed > 0
        ? `${effect.label}：卡牌移动力 ${poolUsed} 点，还需 ${paymentRequired} 点（可弃移动牌或用能量）`
        : `${effect.label}：需要 ${paymentRequired} 点移动力（可弃移动牌或用能量）`;
      syncMovePaymentChrome();
      scrollToPlayerHandPanel();
      renderStateReadout();
      return { ok: true, message: rocketState.statusNote };
    }

    return executeCardEffectMove(deltaX, deltaY, rocketId, {
      terrainRequired,
      poolUsed,
      energyCost: 0,
    });
  }

  function syncPlayCardSelectionChrome() {
    const active = isPlayCardSelectionActive();
    if (active) cancelCardCornerQuickAction({ silent: true });
    const pending = active ? getPendingPlayCardSelection() : null;
    els.appWrap?.classList.toggle("play-card-selection-active", active);
    els.playerHandPanel?.classList.toggle("play-card-selection-active", active);
    els.playerHandPanel?.classList.toggle("player-hand-panel-focused", active);
    if (els.playCardActionButton) {
      els.playCardActionButton.hidden = !pending;
      els.playCardActionButton.disabled = !pending;
      els.playCardActionButton.title = pending
        ? `打出 ${cards.getCardLabel(pending.card)}`
        : "";
    }
    if (els.playCardSelectionCancel) {
      els.playCardSelectionCancel.hidden = !active;
    }
    updatePlayerHandPanelTitle();
    if (active) setQuickPanelOpen(false);
    renderPlayerHand();
    syncInteractionFocusChrome();
  }

  function getPendingPlayCardSelection() {
    if (!pendingPlayCardSelection || !isPlayCardSelectionActive()) return null;

    const currentPlayer = getCurrentPlayer();
    const hand = Array.isArray(currentPlayer?.hand) ? currentPlayer.hand : [];
    let handIndex = Number(pendingPlayCardSelection.handIndex);
    let card = Number.isInteger(handIndex) ? hand[handIndex] : null;

    if (!card || card.id !== pendingPlayCardSelection.cardId) {
      handIndex = hand.findIndex((item) => item.id === pendingPlayCardSelection.cardId);
      card = handIndex >= 0 ? hand[handIndex] : null;
    }

    if (!card) {
      pendingPlayCardSelection = null;
      return null;
    }

    pendingPlayCardSelection = { handIndex, cardId: card.id };
    return { handIndex, card };
  }

  function handlePlayCardSelect(handIndex) {
    if (!isPlayCardSelectionActive()) return;

    const currentPlayer = getCurrentPlayer();
    const index = Math.round(handIndex);
    const card = currentPlayer?.hand?.[index];
    if (!card) {
      rocketState.statusNote = "无效的手牌位置";
      renderStateReadout();
      return { ok: false, message: rocketState.statusNote };
    }

    const cost = getCardPlayCost(card);
    if (!players.canAfford(currentPlayer, cost)) {
      rocketState.statusNote = `资源不足：${cards.getCardLabel(card)} 需要 ${formatCardPlayCost(cost)}`;
      renderStateReadout();
      return { ok: false, message: rocketState.statusNote };
    }

    const current = getPendingPlayCardSelection();
    if (current?.handIndex === index) {
      pendingPlayCardSelection = null;
      rocketState.statusNote = "打牌：请选择一张手牌";
    } else {
      pendingPlayCardSelection = { handIndex: index, cardId: card.id };
      rocketState.statusNote = `打牌：已选择 ${cards.getCardLabel(card)}，点击「打出」确认`;
    }

    syncPlayCardSelectionChrome();
    updateActionButtons();
    renderStateReadout();
    return { ok: true, message: rocketState.statusNote };
  }

  function confirmPlayCardSelection() {
    const pending = getPendingPlayCardSelection();
    if (!pending) {
      rocketState.statusNote = "请先选择要打出的手牌";
      renderStateReadout();
      return { ok: false, message: rocketState.statusNote };
    }
    return handleHandCardPlay(pending.handIndex);
  }

  function getPendingCardCornerQuickAction() {
    if (!pendingCardCornerQuickAction) return null;

    const currentPlayer = getCurrentPlayer();
    const hand = Array.isArray(currentPlayer?.hand) ? currentPlayer.hand : [];
    let handIndex = Number(pendingCardCornerQuickAction.handIndex);
    let card = Number.isInteger(handIndex) ? hand[handIndex] : null;

    if (!card || card.id !== pendingCardCornerQuickAction.cardId) {
      handIndex = hand.findIndex((item) => item.id === pendingCardCornerQuickAction.cardId);
      card = handIndex >= 0 ? hand[handIndex] : null;
    }

    const action = getCardCornerQuickActionForCard(card);
    if (!card || !action) {
      pendingCardCornerQuickAction = null;
      return null;
    }

    pendingCardCornerQuickAction = {
      handIndex,
      cardId: card.id,
      ...action,
    };
    return { ...pendingCardCornerQuickAction, card };
  }

  function getCardCornerQuickActionForCard(card) {
    if (fangzhou?.isFangzhouCard2?.(card)) {
      return {
        actionKind: "fangzhou_basic",
        label: "方舟基础奖励",
      };
    }

    const runezuCornerMatch = String(card?.discardActionCode || "").match(/^s_([1-7])$/);
    if (runezu?.isRunezuCard?.(card) && runezuCornerMatch) {
      const symbolId = `symbol_${runezuCornerMatch[1]}`;
      return {
        actionKind: "runezu_symbol",
        label: `符文族${runezu.formatSymbolLabel(symbolId)}奖励`,
        symbolId,
      };
    }

    const resourceReward = cards.getDiscardActionRewardForCard(card);
    if (resourceReward) {
      return {
        actionKind: "resource",
        label: resourceReward.label,
        reward: resourceReward,
      };
    }

    const moveReward = cards.getDiscardActionMoveRewardForCard?.(card);
    if (moveReward) {
      return {
        actionKind: "move",
        label: moveReward.label,
        moveReward,
      };
    }

    return null;
  }

  function canUseCardCornerQuickAction() {
    return !getGameplayLockReason()
      && !isTechTilePickingActive()
      && !isCardSelectionActive()
      && !isDiscardSelectionActive()
      && !isPlayCardSelectionActive()
      && !isHandScanSelectionActive()
      && !isMovePaymentSelectionActive()
      && !pendingIndustryAbility
      && !isIndustryHandSelectionActive()
      && !pendingCardCornerFreeMove
      && !hasActivePendingSubFlow();
  }

  function syncCardCornerQuickActionChrome() {
    const action = canUseCardCornerQuickAction() ? getPendingCardCornerQuickAction() : null;
    const active = Boolean(action);

    els.appWrap?.classList.toggle("card-corner-action-active", active);
    els.playerHandPanel?.classList.toggle("card-corner-action-active", active);
    els.playerHandPanel?.classList.toggle("player-hand-panel-focused", active);
    if (els.cardCornerActionButton) {
      els.cardCornerActionButton.hidden = !active;
      els.cardCornerActionButton.disabled = !active;
      els.cardCornerActionButton.textContent = action?.label || "弃牌快速行动";
      els.cardCornerActionButton.title = active
        ? `${action.label}：弃除 ${cards.getCardLabel(action.card)}`
        : "";
    }
    updatePlayerHandPanelTitle();
    renderPlayerHand();
    syncInteractionFocusChrome();
  }

  function cancelCardCornerQuickAction(options = {}) {
    if (!pendingCardCornerQuickAction) return;
    pendingCardCornerQuickAction = null;
    if (!options.silent) {
      rocketState.statusNote = "已取消卡牌快速行动";
    }
    syncCardCornerQuickActionChrome();
    if (!options.silent) renderStateReadout();
  }

  function handleHandCardCornerQuickAction(handIndex) {
    if (!canUseCardCornerQuickAction()) return { ok: false, message: "当前无法使用卡牌快速行动" };

    const currentPlayer = getCurrentPlayer();
    const index = Math.round(handIndex);
    const card = currentPlayer?.hand?.[index];
    const action = getCardCornerQuickActionForCard(card);
    if (!card || !action) {
      rocketState.statusNote = "这张牌没有可用的左上角快速行动";
      renderStateReadout();
      return { ok: false, message: rocketState.statusNote };
    }

    const current = getPendingCardCornerQuickAction();
    if (current?.card?.id === card.id) {
      cancelCardCornerQuickAction();
      return { ok: true, cancelled: true, message: rocketState.statusNote };
    }

    pendingCardCornerQuickAction = {
      handIndex: index,
      cardId: card.id,
      ...action,
    };
    setQuickPanelOpen(false);
    rocketState.statusNote = `${action.label}：点击手牌区上方按钮确认弃除 ${cards.getCardLabel(card)}`;
    syncCardCornerQuickActionChrome();
    updateActionButtons();
    renderStateReadout();
    return { ok: true, message: rocketState.statusNote };
  }

  function formatCardCornerRewardMessage(reward, dataResults) {
    const parts = [];
    if (reward?.gain?.publicity) parts.push(`宣传+${reward.gain.publicity}`);
    if (reward?.gain?.score) parts.push(`分数+${reward.gain.score}`);
    const dataCount = Math.max(0, Math.round(reward?.dataCount || 0));
    if (dataCount) {
      const gained = dataResults.filter((item) => item.ok).length;
      const discarded = dataResults.filter((item) => item.discarded).length;
      parts.push(discarded ? `数据+${gained}/${dataCount}（弃置${discarded}）` : `数据+${gained}`);
    }
    return parts.join("、");
  }

  function canStartCardCornerFreeMove() {
    const currentPlayer = getCurrentPlayer();
    const rocketsForPlayer = getMovableTokensForPlayer(currentPlayer?.id);
    if (rocketsForPlayer.length > 0) return { ok: true, rocketsForPlayer };
    return { ok: false, rocketsForPlayer, message: "没有可移动的飞船" };
  }

  function beginCardCornerFreeMove(action, discardedCard) {
    const check = canStartCardCornerFreeMove();
    if (!check.ok) {
      rocketState.statusNote = check.message;
      renderStateReadout();
      return check;
    }

    pendingCardCornerFreeMove = {
      action,
      discardedCardLabel: cards.getCardLabel(discardedCard),
    };
    rocketState.statusNote = check.rocketsForPlayer.length > 1
      ? `${action.label}：请点击要免费移动的飞船`
      : `${action.label}：使用方向键免费移动飞船`;
    if (check.rocketsForPlayer.length === 1) {
      activateMoveMode(check.rocketsForPlayer[0].id);
    } else {
      selectDefaultRocketForCurrentPlayer();
    }
    updateActionButtons();
    renderStateReadout();
    return { ok: true, message: rocketState.statusNote };
  }

  function confirmCardCornerQuickAction() {
    if (!canUseCardCornerQuickAction()) {
      return { ok: false, message: "当前无法使用卡牌快速行动" };
    }

    const action = getPendingCardCornerQuickAction();
    const currentPlayer = getCurrentPlayer();
    if (!action || !currentPlayer) {
      rocketState.statusNote = "没有待确认的卡牌快速行动";
      renderStateReadout();
      return { ok: false, message: rocketState.statusNote };
    }

    if (action.actionKind === "move") {
      const moveCheck = canStartCardCornerFreeMove();
      if (!moveCheck.ok) {
        rocketState.statusNote = moveCheck.message;
        renderStateReadout();
        return moveCheck;
      }
    }

    if (action.actionKind === "fangzhou_basic") {
      const beforePlayer = structuredClone(currentPlayer);
      const beforeAlienState = structuredClone(alienGameState);
      beginQuickActionStep("card-corner", `卡牌快速行动：${action.label}`);
      const discardResult = cards.discardFromHandAtIndex(currentPlayer, action.handIndex);
      if (!discardResult.ok) {
        quickActionHistory.undoLastStep();
        if (!quickActionHistory.hasUndoableStep()) {
          quickActionHistory.commitSession();
          clearHistoryStepOrderForSource(HISTORY_SOURCE_QUICK);
        }
        rocketState.statusNote = discardResult.message;
        syncCardCornerQuickActionChrome();
        renderStateReadout();
        return discardResult;
      }
      cards.addToDiscardPile(cardState, discardResult.card);
      recordQuickHistoryCommand(historyCommands.createRestorePlayerCommand(
        currentPlayer,
        beforePlayer,
        "恢复方舟弃牌快速行动前玩家状态",
      ));
      recordQuickHistoryCommand(historyCommands.createRestoreObjectCommand(
        alienGameState,
        beforeAlienState,
        "恢复方舟弃牌快速行动前外星人状态",
      ));
      completeQuickActionStep();
      pendingCardCornerQuickAction = null;
      syncCardCornerQuickActionChrome();
      const rewardResult = applyFangzhouCard1Reward(currentPlayer, "basic", "方舟弃牌基础奖励");
      rocketState.statusNote = `卡牌快速行动：弃除 ${cards.getCardLabel(discardResult.card)}，${rewardResult.message}`;
      renderPlayerStats();
      renderPlayerHand();
      renderAlienPanels();
      renderPublicCards();
      updatePublicCardControls();
      updateActionButtons();
      renderStateReadout();
      if (rewardResult.followUps?.length) return rewardResult;
      return rewardResult;
    }

    if (action.actionKind === "runezu_symbol") {
      const beforePlayer = structuredClone(currentPlayer);
      const beforeAlienState = structuredClone(alienGameState);
      const beforeCardState = {
        publicCards: cardState.publicCards.slice(),
        discardPile: (cardState.discardPile || []).slice(),
      };
      beginQuickActionStep("card-corner", `卡牌快速行动：${action.label}`);
      const discardResult = cards.discardFromHandAtIndex(currentPlayer, action.handIndex);
      if (!discardResult.ok) {
        quickActionHistory.undoLastStep();
        if (!quickActionHistory.hasUndoableStep()) {
          quickActionHistory.commitSession();
          clearHistoryStepOrderForSource(HISTORY_SOURCE_QUICK);
        }
        rocketState.statusNote = discardResult.message;
        syncCardCornerQuickActionChrome();
        renderStateReadout();
        return discardResult;
      }
      cards.addToDiscardPile(cardState, discardResult.card);
      const rewardResult = applyRunezuSymbolReward(currentPlayer, action.symbolId, action.label);
      recordQuickHistoryCommand(historyCommands.createRestorePlayerCommand(
        currentPlayer,
        beforePlayer,
        "恢复符文族弃牌快速行动前玩家状态",
      ));
      recordQuickHistoryCommand(historyCommands.createRestoreObjectCommand(
        alienGameState,
        beforeAlienState,
        "恢复符文族弃牌快速行动前外星人状态",
      ));
      recordQuickHistoryCommand(historyCommands.createRestorePublicCardsCommand(
        cardState,
        beforeCardState.publicCards,
        beforeCardState.discardPile,
      ));
      completeQuickActionStep(null, rewardResult.irreversible ? {
        irreversibleCode: rewardResult.irreversible.code,
        irreversibleReason: rewardResult.irreversible.reason,
      } : {});
      pendingCardCornerQuickAction = null;
      syncCardCornerQuickActionChrome();
      rocketState.statusNote = `卡牌快速行动：弃除 ${cards.getCardLabel(discardResult.card)}，${rewardResult.message}`;
      renderPlayerStats();
      renderPlayerHand();
      renderAlienPanels();
      renderPublicCards();
      updatePublicCardControls();
      updateActionButtons();
      renderStateReadout();
      return rewardResult;
    }

    const beforePlayer = structuredClone(currentPlayer);
    const beforeCardState = {
      publicCards: cardState.publicCards.slice(),
      discardPile: (cardState.discardPile || []).slice(),
    };

    beginQuickActionStep("card-corner", `卡牌快速行动：${action.label}`);
    const discardResult = cards.discardFromHandAtIndex(currentPlayer, action.handIndex);
    if (!discardResult.ok) {
      quickActionHistory.undoLastStep();
      if (!quickActionHistory.hasUndoableStep()) {
        quickActionHistory.commitSession();
        clearHistoryStepOrderForSource(HISTORY_SOURCE_QUICK);
      }
      rocketState.statusNote = discardResult.message;
      syncCardCornerQuickActionChrome();
      renderStateReadout();
      return discardResult;
    }

    cards.addToDiscardPile(cardState, discardResult.card);
    if (Object.keys(action.reward?.gain || {}).length) {
      players.gainResources(currentPlayer, action.reward.gain);
    }
    if (Object.keys(action.moveReward?.gain || {}).length) {
      players.gainResources(currentPlayer, action.moveReward.gain);
    }
    const dataResults = [];
    const dataCount = Math.max(0, Math.round(action.reward?.dataCount || 0));
    for (let index = 0; index < dataCount; index += 1) {
      dataResults.push(data.gainData(currentPlayer, { source: "card_corner" }));
    }

    recordQuickHistoryCommand(historyCommands.createRestorePlayerCommand(
      currentPlayer,
      beforePlayer,
      "恢复卡牌快速行动前玩家状态",
    ));
    recordQuickHistoryCommand(historyCommands.createRestorePublicCardsCommand(
      cardState,
      beforeCardState.publicCards,
      beforeCardState.discardPile,
    ));
    completeQuickActionStep();

    pendingCardCornerQuickAction = null;
    syncCardCornerQuickActionChrome();
    const rewardText = action.actionKind === "move"
      ? [formatPlanetRewardGain(action.moveReward?.gain || {}), `${action.moveReward?.movementPoints || 1}移动`]
        .filter(Boolean)
        .join("、")
      : formatCardCornerRewardMessage(action.reward, dataResults);
    rocketState.statusNote = `卡牌快速行动：弃除 ${cards.getCardLabel(discardResult.card)}，${rewardText}`;
    renderPlayerStats();
    renderPlayerHand();
    renderPublicCards();
    updatePublicCardControls();
    updateActionButtons();
    renderStateReadout();
    if (action.actionKind === "move") {
      beginCardCornerFreeMove(action, discardResult.card);
    }
    return {
      ok: true,
      card: discardResult.card,
      reward: action.reward,
      moveReward: action.moveReward,
      dataResults,
      message: rocketState.statusNote,
    };
  }

  function beginDiscardSelection(count, pendingAction = null) {
    if (isTechTilePickingActive()) {
      return { ok: false, message: "请先完成科技选择" };
    }
    if (isCardSelectionActive()) {
      return { ok: false, message: "请先完成精选" };
    }
    if (isPlayCardSelectionActive()) {
      return { ok: false, message: "请先完成打牌" };
    }
    if (isHandScanSelectionActive()) {
      return { ok: false, message: "请先完成手牌扫描" };
    }
    if (isMovePaymentSelectionActive()) {
      return { ok: false, message: "请先完成移动" };
    }

    const discardCount = Math.max(0, Math.round(count));
    if (discardCount <= 0) {
      completeDiscardSelection([]);
      return { ok: true, message: null };
    }

    const currentPlayer = getCurrentPlayer();
    if (!currentPlayer?.hand?.length || currentPlayer.hand.length < discardCount) {
      return { ok: false, message: `手牌不足，需要弃置 ${discardCount} 张牌` };
    }

    pendingDiscardAction = {
      ...(pendingAction || {}),
      discarded: [],
      selectedIndexes: [],
    };
    cards.setDiscardSelectionActive(cardState, true, discardCount);
    rocketState.statusNote = isIncomeDiscardActionType(pendingAction?.type)
      ? `收入：请选择 ${discardCount} 张手牌弃掉`
      : `弃牌：请选择 ${discardCount} 张手牌`;
    syncDiscardSelectionChrome();
    updateActionButtons();
    renderStateReadout();
    return { ok: true, message: rocketState.statusNote };
  }

  function cancelDiscardSelection() {
    if (!isDiscardSelectionActive()) return;

    const pending = pendingDiscardAction;
    pendingDiscardAction = null;
    cards.setDiscardSelectionActive(cardState, false, 0);
    if (pending?.type === "place_data_income") {
      completeQuickActionStep();
    }
    rocketState.statusNote = isIncomeDiscardActionType(pending?.type) ? "已取消收入" : "已取消弃牌";
    syncDiscardSelectionChrome();
    updateActionButtons();
    renderStateReadout();
  }

  function completeDiscardSelection(discardedCards) {
    const pending = pendingDiscardAction;
    pendingDiscardAction = null;
    cards.setDiscardSelectionActive(cardState, false, 0);
    syncDiscardSelectionChrome();

    if (pending?.type === "trade") {
      const tradePlayer = pending.player || getCurrentPlayer();
      const beforeState = pending.beforeTradeState;
      const tradeResult = quickTrades.finalizeTradeAfterDiscard(
        pending.tradeId,
        createActionContext(),
        tradePlayer,
      );
      rocketState.statusNote = tradeResult.ok
        ? tradeResult.message
        : (tradeResult.message || "交易失败");
      if (tradeResult.ok && !tradeResult.awaitingCardSelection && beforeState) {
        recordQuickTradeCompletion(pending.tradeId, tradePlayer, beforeState);
      }
      renderPlayerStats();
      renderPublicCards();
      updatePublicCardControls();
      updateActionButtons();
      renderStateReadout();
      return tradeResult;
    }

    if (isIncomeDiscardActionType(pending?.type)) {
      const incomeResult = applyIncomeFromCard(
        pending.player || getCurrentPlayer(),
        discardedCards[0],
      );
      if (pending.type === "planet_reward_income" && incomeResult.ok) {
        const player = pending.player || getCurrentPlayer();
        beginEffectHistoryStep(pending.effectLabel || "收入奖励");
        recordHistoryCommand(historyCommands.createRestorePlayerCommand(
          player,
          pending.beforePlayerState,
          "恢复收入奖励前玩家状态",
        ));
        recordHistoryCommand(historyCommands.createRestoreObjectCommand(
          cardState,
          pending.beforeCardState,
          "恢复收入奖励前牌区",
        ));
        if (getCurrentActionEffect()) {
          getCurrentActionEffect().result = {
            ok: true,
            undoable: true,
            message: incomeResult.message,
            payload: { gain: incomeResult.gain, card: discardedCards[0] },
          };
        }
        completeCurrentActionEffect();
        rocketState.statusNote = incomeResult.message;
      } else if (pending.type === "place_data_income") {
        if (incomeResult.ok) {
          const player = pending.player || getCurrentPlayer();
          recordQuickHistoryCommand(historyCommands.createRestorePlayerCommand(
            player,
            pending.beforePlayerState,
            "恢复放置数据收入奖励前玩家状态",
          ));
          recordQuickHistoryCommand(historyCommands.createRestoreObjectCommand(
            cardState,
            pending.beforeCardState,
            "恢复放置数据收入奖励前牌区",
          ));
        }
        completeQuickActionStep();
        rocketState.statusNote = incomeResult.ok
          ? incomeResult.message
          : (incomeResult.message || "收入失败");
      } else if (pending.type === "initial_income") {
        if (incomeResult.ok && pending.fromEffectFlow && getCurrentActionEffect()) {
          getCurrentActionEffect().result = {
            ok: true,
            undoable: false,
            message: incomeResult.message,
            payload: { gain: incomeResult.gain, card: discardedCards[0] },
          };
          completeCurrentActionEffect();
        }
        rocketState.statusNote = incomeResult.ok
          ? incomeResult.message
          : (incomeResult.message || "收入失败");
      } else if (pending.type === "industry_helios_income") {
        rocketState.statusNote = incomeResult.ok
          ? `赫利昂联合体：移除 ${pending.removedTileId || "科技"}，${incomeResult.message}`
          : (incomeResult.message || "收入失败");
        if (incomeResult.ok) {
          recordQuickHistoryCommand(historyCommands.createRestorePlayerCommand(
            pending.player || getCurrentPlayer(),
            pending.beforePlayer,
            "恢复赫利昂收入结算前玩家状态",
          ));
          if (pending.beforeCardState) {
            recordQuickHistoryCommand(historyCommands.createRestorePublicCardsCommand(
              cardState,
              pending.beforeCardState.publicCards,
              pending.beforeCardState.discardPile,
            ));
          }
          completeQuickActionStep();
          finishIndustryAbilityFlow(rocketState.statusNote);
        }
      } else {
        rocketState.statusNote = incomeResult.ok
          ? incomeResult.message
          : (incomeResult.message || "收入失败");
      }
      renderPlayerStats();
      renderPublicCards();
      renderPlayerHand();
      updatePublicCardControls();
      updateActionButtons();
      renderStateReadout();
      return incomeResult;
    }

    if (discardedCards.length) {
      rocketState.statusNote = `弃牌：${discardedCards.map((card) => cards.getCardLabel(card)).join("、")}`;
    } else {
      rocketState.statusNote = "";
    }

    renderPlayerStats();
    renderPublicCards();
    updatePublicCardControls();
    updateActionButtons();
    renderStateReadout();
    return { ok: true, cards: discardedCards, message: rocketState.statusNote };
  }

  function finalizePendingDiscardSelection() {
    const pending = pendingDiscardAction;
    const currentPlayer = getCurrentPlayer();
    const selected = [...(pending?.selectedIndexes || [])].sort((a, b) => b - a);
    const discarded = [...(pending?.discarded || [])];

    for (const index of selected) {
      const discardResult = cards.discardFromHandAtIndex(currentPlayer, index);
      if (!discardResult.ok) {
        rocketState.statusNote = discardResult.message;
        renderPlayerHand();
        renderStateReadout();
        return discardResult;
      }
      cards.addToDiscardPile(cardState, discardResult.card);
      discarded.push(discardResult.card);
    }

    if (pending) pending.selectedIndexes = [];
    cards.setDiscardSelectionActive(cardState, false, 0);
    return completeDiscardSelection(discarded);
  }

  function handleHandCardDiscard(handIndex) {
    if (!isDiscardSelectionActive()) return;

    const index = Math.round(handIndex);
    const needed = cards.getDiscardRemaining(cardState);
    if (!pendingDiscardAction) return;

    if (!Array.isArray(pendingDiscardAction.selectedIndexes)) {
      pendingDiscardAction.selectedIndexes = [];
    }
    const selected = pendingDiscardAction.selectedIndexes;
    const existingIndex = selected.indexOf(index);
    if (existingIndex >= 0) {
      selected.splice(existingIndex, 1);
      renderPlayerHand();
      rocketState.statusNote = selected.length > 0
        ? `弃牌：已选 ${selected.length}/${needed} 张`
        : (isIncomeDiscardActionType(pendingDiscardAction.type)
          ? "收入：请选择手牌弃掉"
          : `弃牌：请选择 ${needed} 张手牌`);
      renderStateReadout();
      return { ok: true };
    }

    if (selected.length >= needed) {
      rocketState.statusNote = `最多选择 ${needed} 张手牌`;
      renderStateReadout();
      return { ok: false, message: rocketState.statusNote };
    }

    selected.push(index);
    renderPlayerHand();
    if (selected.length < needed) {
      rocketState.statusNote = `弃牌：已选 ${selected.length}/${needed} 张`;
      renderStateReadout();
      return { ok: true };
    }

    return finalizePendingDiscardSelection();
  }

  function getCardPrice(card) {
    const price = Number(card?.price);
    return Number.isFinite(price) ? Math.max(0, Math.round(price)) : 0;
  }

  function getCardPlayCost(card) {
    const price = getCardPrice(card);
    if (banrenma?.isBanrenmaCard?.(card)) {
      return price > 0 ? { energy: price } : {};
    }
    return price > 0 ? { credits: price } : {};
  }

  function formatCardPlayCost(cost) {
    const text = players.formatResourceCost(cost);
    return text && text !== "无" ? text : "0";
  }

  function getCardTypeCode(card) {
    const typeCode = Number(card?.cardTypeCode);
    const fallbackTypeCode = Number.isFinite(typeCode) ? Math.round(typeCode) : 0;
    return cardEffects?.getRuntimeCardTypeCode
      ? cardEffects.getRuntimeCardTypeCode(card, fallbackTypeCode)
      : fallbackTypeCode;
  }

  function beginPlayCardSelection() {
    if (!canStartMainAction()) {
      rocketState.statusNote = "本回合已经开始或完成主要行动";
      renderStateReadout();
      return { ok: false, message: rocketState.statusNote };
    }
    if (isTechTilePickingActive()) {
      return { ok: false, message: "请先完成科技选择" };
    }
    if (isCardSelectionActive()) {
      return { ok: false, message: "请先完成精选" };
    }
    if (isDiscardSelectionActive()) {
      return { ok: false, message: "请先完成弃牌" };
    }
    if (isHandScanSelectionActive()) {
      return { ok: false, message: "请先完成手牌扫描" };
    }
    if (isMovePaymentSelectionActive()) {
      return { ok: false, message: "请先完成移动" };
    }

    const currentPlayer = getCurrentPlayer();
    if (!currentPlayer?.hand?.length) {
      rocketState.statusNote = "没有手牌可打出";
      renderStateReadout();
      return { ok: false, message: rocketState.statusNote };
    }

    cards.setPlayCardSelectionActive(cardState, true);
    pendingPlayCardSelection = null;
    rocketState.statusNote = "打牌：请选择一张手牌";
    syncPlayCardSelectionChrome();
    updateActionButtons();
    renderStateReadout();
    return { ok: true, message: rocketState.statusNote };
  }

  function cancelPlayCardSelection() {
    if (!isPlayCardSelectionActive()) return;

    pendingPlayCardSelection = null;
    cards.setPlayCardSelectionActive(cardState, false);
    rocketState.statusNote = "已取消打牌";
    syncPlayCardSelectionChrome();
    updateActionButtons();
    renderStateReadout();
  }

  function handleHandCardPlay(handIndex) {
    if (!isPlayCardSelectionActive()) return;

    const currentPlayer = getCurrentPlayer();
    const removeIndex = Math.round(handIndex);
    const card = currentPlayer?.hand?.[removeIndex];
    if (!card) {
      rocketState.statusNote = "无效的手牌位置";
      renderStateReadout();
      return { ok: false, message: rocketState.statusNote };
    }

    if (fangzhou?.isFangzhouCard2?.(card)) {
      return handleFangzhouCard2Play(removeIndex);
    }
    if (banrenma?.isBanrenmaCard?.(card)) {
      return handleBanrenmaCardPlay(removeIndex);
    }
    if (chong?.isChongCard?.(card)) {
      return handleChongCardPlay(removeIndex);
    }
    if (amiba?.isAmibaCard?.(card)) {
      return handleAmibaCardPlay(removeIndex);
    }
    if (aomomo?.isAomomoCard?.(card)) {
      return handleAomomoCardPlay(removeIndex);
    }
    if (runezu?.isRunezuCard?.(card)) {
      return handleRunezuCardPlay(removeIndex);
    }

    const price = getCardPrice(card);
    const cost = getCardPlayCost(card);
    if (!players.canAfford(currentPlayer, cost)) {
      rocketState.statusNote = `资源不足：${cards.getCardLabel(card)} 需要 ${formatCardPlayCost(cost)}`;
      renderStateReadout();
      return { ok: false, message: rocketState.statusNote };
    }

    const beforePlayer = structuredClone(currentPlayer);
    const beforeCardState = {
      publicCards: cardState.publicCards.slice(),
      discardPile: (cardState.discardPile || []).slice(),
    };
    const spendResult = players.spendResources(currentPlayer, cost);
    if (!spendResult.ok) {
      rocketState.statusNote = spendResult.message;
      renderStateReadout();
      return spendResult;
    }

    const removeResult = cards.discardFromHandAtIndex(currentPlayer, removeIndex);
    if (!removeResult.ok) {
      players.gainResources(currentPlayer, cost);
      rocketState.statusNote = removeResult.message;
      renderStateReadout();
      return removeResult;
    }

    const playedCard = removeResult.card;
    const typeCode = getCardTypeCode(playedCard);
    const shouldReserve = [1, 2, 3].includes(typeCode);
    const playEffects = cardEffects.buildPlayEffects(playedCard);
    const temporaryTasks = cardEffects.getTemporaryTasks(playedCard);
    const sentinelEffects = industry?.buildSentinelPlayCornerEffectNodes?.(
      cards,
      currentPlayer,
      turnState.roundNumber,
      turnState.turnNumber,
      playedCard,
    ) || [];
    const allPlayEffects = [...playEffects, ...sentinelEffects];
    if (shouldReserve) {
      if (!Array.isArray(currentPlayer.reservedCards)) currentPlayer.reservedCards = [];
      cardEffects.ensureCardEffectState(playedCard);
      currentPlayer.reservedCards.push(playedCard);
    } else {
      cards.addToDiscardPile(cardState, playedCard);
    }

    cards.setPlayCardSelectionActive(cardState, false);
    pendingPlayCardSelection = null;
    rocketState.statusNote = shouldReserve
      ? `打出：${cards.getCardLabel(playedCard)}，支付 ${formatCardPlayCost(cost)}，进入保留牌区`
      : `打出：${cards.getCardLabel(playedCard)}，支付 ${formatCardPlayCost(cost)}，已弃掉`;
    applyIndustryPlayCardPassives(playedCard, typeCode);
    syncPlayCardSelectionChrome();
    renderPlayerStats();
    recordPlayCardStart(currentPlayer, playedCard, beforePlayer, beforeCardState);
    if (allPlayEffects.length) {
      startCardEffectFlow("play-card-effects", `打出 ${cards.getCardLabel(playedCard)}`, allPlayEffects, {
        actionType: "playCard",
        card: playedCard,
        temporaryTasks,
        industryPlayedCard: playedCard,
      });
    } else {
      markActionPending();
      updateActionButtons();
      renderStateReadout();
    }
    return {
      ok: true,
      card: playedCard,
      reserved: shouldReserve,
      message: rocketState.statusNote,
    };
  }

  function handleChongCardPlay(handIndex) {
    if (!chong) return { ok: false, message: "虫族模块未加载" };
    const currentPlayer = getCurrentPlayer();
    const removeIndex = Math.round(handIndex);
    const card = currentPlayer?.hand?.[removeIndex];
    if (!card) {
      rocketState.statusNote = "无效的手牌位置";
      renderStateReadout();
      return { ok: false, message: rocketState.statusNote };
    }

    const cost = getCardPlayCost(card);
    if (!players.canAfford(currentPlayer, cost)) {
      rocketState.statusNote = `资源不足：${cards.getCardLabel(card)} 需要 ${formatCardPlayCost(cost)}`;
      renderStateReadout();
      return { ok: false, message: rocketState.statusNote };
    }

    const beforePlayer = structuredClone(currentPlayer);
    const beforeAlienState = structuredClone(alienGameState);
    const beforeCardState = {
      publicCards: cardState.publicCards.slice(),
      discardPile: (cardState.discardPile || []).slice(),
    };
    const spendResult = players.spendResources(currentPlayer, cost);
    if (!spendResult.ok) {
      rocketState.statusNote = spendResult.message;
      renderStateReadout();
      return spendResult;
    }

    const removeResult = cards.discardFromHandAtIndex(currentPlayer, removeIndex);
    if (!removeResult.ok) {
      players.gainResources(currentPlayer, cost);
      rocketState.statusNote = removeResult.message;
      renderStateReadout();
      return removeResult;
    }

    const playedCard = removeResult.card;
    playedCard.chongCard = true;
    playedCard.chongTask = playedCard.chongTask || chong.getCardTask(playedCard);
    if (!Array.isArray(currentPlayer.reservedCards)) currentPlayer.reservedCards = [];
    cardEffects.ensureCardEffectState(playedCard);
    currentPlayer.reservedCards.push(playedCard);

    const playEffects = chong.buildImmediateEffects(playedCard);
    const sentinelEffects = industry?.buildSentinelPlayCornerEffectNodes?.(
      cards,
      currentPlayer,
      turnState.roundNumber,
      turnState.turnNumber,
      playedCard,
    ) || [];
    const allPlayEffects = [...playEffects, ...sentinelEffects];

    cards.setPlayCardSelectionActive(cardState, false);
    pendingPlayCardSelection = null;
    rocketState.statusNote = `打出：${cards.getCardLabel(playedCard)}，支付 ${formatCardPlayCost(cost)}，进入保留牌区`;
    applyIndustryPlayCardPassives(playedCard, getCardTypeCode(playedCard));
    syncPlayCardSelectionChrome();
    renderPlayerStats();
    renderReservedCardsFromTaskState();
    recordPlayCardStart(currentPlayer, playedCard, beforePlayer, beforeCardState, beforeAlienState);
    if (allPlayEffects.length) {
      startCardEffectFlow("chong-play-card-effects", `打出 ${cards.getCardLabel(playedCard)}`, allPlayEffects, {
        actionType: "playCard",
        card: playedCard,
        temporaryTasks: [],
        industryPlayedCard: playedCard,
      });
    } else {
      markActionPending();
      updateActionButtons();
      renderStateReadout();
    }
    return {
      ok: true,
      card: playedCard,
      reserved: true,
      message: rocketState.statusNote,
    };
  }

  function handleAmibaCardPlay(handIndex) {
    if (!amiba) return { ok: false, message: "阿米巴模块未加载" };
    const currentPlayer = getCurrentPlayer();
    const removeIndex = Math.round(handIndex);
    const card = currentPlayer?.hand?.[removeIndex];
    if (!card) {
      rocketState.statusNote = "无效的手牌位置";
      renderStateReadout();
      return { ok: false, message: rocketState.statusNote };
    }

    const cost = getCardPlayCost(card);
    if (!players.canAfford(currentPlayer, cost)) {
      rocketState.statusNote = `资源不足：${cards.getCardLabel(card)} 需要 ${formatCardPlayCost(cost)}`;
      renderStateReadout();
      return { ok: false, message: rocketState.statusNote };
    }

    const beforePlayer = structuredClone(currentPlayer);
    const beforeAlienState = structuredClone(alienGameState);
    const beforeCardState = {
      publicCards: cardState.publicCards.slice(),
      discardPile: (cardState.discardPile || []).slice(),
    };
    const spendResult = players.spendResources(currentPlayer, cost);
    if (!spendResult.ok) {
      rocketState.statusNote = spendResult.message;
      renderStateReadout();
      return spendResult;
    }

    const removeResult = cards.discardFromHandAtIndex(currentPlayer, removeIndex);
    if (!removeResult.ok) {
      players.gainResources(currentPlayer, cost);
      rocketState.statusNote = removeResult.message;
      renderStateReadout();
      return removeResult;
    }

    const playedCard = removeResult.card;
    playedCard.amibaCard = true;
    playedCard.amibaTask = playedCard.amibaTask || amiba.getCardTask(playedCard);
    const typeCode = getCardTypeCode(playedCard);
    const shouldReserve = [1, 2, 3].includes(typeCode);
    if (shouldReserve) {
      if (!Array.isArray(currentPlayer.reservedCards)) currentPlayer.reservedCards = [];
      cardEffects.ensureCardEffectState(playedCard);
      currentPlayer.reservedCards.push(playedCard);
    } else {
      cards.addToDiscardPile(cardState, playedCard);
    }

    const playEffects = amiba.buildImmediateEffects(playedCard);
    const sentinelEffects = industry?.buildSentinelPlayCornerEffectNodes?.(
      cards,
      currentPlayer,
      turnState.roundNumber,
      turnState.turnNumber,
      playedCard,
    ) || [];
    const allPlayEffects = [...playEffects, ...sentinelEffects];

    cards.setPlayCardSelectionActive(cardState, false);
    pendingPlayCardSelection = null;
    rocketState.statusNote = shouldReserve
      ? `打出：${cards.getCardLabel(playedCard)}，支付 ${formatCardPlayCost(cost)}，进入保留牌区`
      : `打出：${cards.getCardLabel(playedCard)}，支付 ${formatCardPlayCost(cost)}，已弃掉`;
    applyIndustryPlayCardPassives(playedCard, typeCode);
    syncPlayCardSelectionChrome();
    renderPlayerStats();
    renderReservedCardsFromTaskState();
    recordPlayCardStart(currentPlayer, playedCard, beforePlayer, beforeCardState, beforeAlienState);
    if (allPlayEffects.length) {
      startCardEffectFlow("amiba-play-card-effects", `打出 ${cards.getCardLabel(playedCard)}`, allPlayEffects, {
        actionType: "playCard",
        card: playedCard,
        temporaryTasks: [],
        industryPlayedCard: playedCard,
      });
    } else {
      markActionPending();
      updateActionButtons();
      renderStateReadout();
    }
    return {
      ok: true,
      card: playedCard,
      reserved: shouldReserve,
      message: rocketState.statusNote,
    };
  }

  function handleAomomoCardPlay(handIndex) {
    if (!aomomo) return { ok: false, message: "奥陌陌模块未加载" };
    const currentPlayer = getCurrentPlayer();
    const removeIndex = Math.round(handIndex);
    const card = currentPlayer?.hand?.[removeIndex];
    if (!card) {
      rocketState.statusNote = "无效的手牌位置";
      renderStateReadout();
      return { ok: false, message: rocketState.statusNote };
    }

    const cost = getCardPlayCost(card);
    if (!players.canAfford(currentPlayer, cost)) {
      rocketState.statusNote = `资源不足：${cards.getCardLabel(card)} 需要 ${formatCardPlayCost(cost)}`;
      renderStateReadout();
      return { ok: false, message: rocketState.statusNote };
    }

    const beforePlayer = structuredClone(currentPlayer);
    const beforeAlienState = structuredClone(alienGameState);
    const beforeCardState = {
      publicCards: cardState.publicCards.slice(),
      discardPile: (cardState.discardPile || []).slice(),
    };
    const spendResult = players.spendResources(currentPlayer, cost);
    if (!spendResult.ok) {
      rocketState.statusNote = spendResult.message;
      renderStateReadout();
      return spendResult;
    }

    const removeResult = cards.discardFromHandAtIndex(currentPlayer, removeIndex);
    if (!removeResult.ok) {
      players.gainResources(currentPlayer, cost);
      rocketState.statusNote = removeResult.message;
      renderStateReadout();
      return removeResult;
    }

    const playedCard = removeResult.card;
    playedCard.aomomoCard = true;
    const typeCode = getCardTypeCode(playedCard);
    const shouldReserve = [1, 2, 3].includes(typeCode);
    if (shouldReserve) {
      if (!Array.isArray(currentPlayer.reservedCards)) currentPlayer.reservedCards = [];
      cardEffects.ensureCardEffectState(playedCard);
      currentPlayer.reservedCards.push(playedCard);
    } else {
      cards.addToDiscardPile(cardState, playedCard);
    }

    const playEffects = aomomo.buildImmediateEffects(playedCard);
    const sentinelEffects = industry?.buildSentinelPlayCornerEffectNodes?.(
      cards,
      currentPlayer,
      turnState.roundNumber,
      turnState.turnNumber,
      playedCard,
    ) || [];
    const allPlayEffects = [...playEffects, ...sentinelEffects];

    cards.setPlayCardSelectionActive(cardState, false);
    pendingPlayCardSelection = null;
    rocketState.statusNote = shouldReserve
      ? `打出：${cards.getCardLabel(playedCard)}，支付 ${formatCardPlayCost(cost)}，进入保留牌区`
      : `打出：${cards.getCardLabel(playedCard)}，支付 ${formatCardPlayCost(cost)}，已弃掉`;
    applyIndustryPlayCardPassives(playedCard, typeCode);
    syncPlayCardSelectionChrome();
    renderPlayerStats();
    renderReservedCardsFromTaskState();
    recordPlayCardStart(currentPlayer, playedCard, beforePlayer, beforeCardState, beforeAlienState);
    if (allPlayEffects.length) {
      startCardEffectFlow("aomomo-play-card-effects", `打出 ${cards.getCardLabel(playedCard)}`, allPlayEffects, {
        actionType: "playCard",
        card: playedCard,
        temporaryTasks: [],
        industryPlayedCard: playedCard,
      });
    } else {
      markActionPending();
      updateActionButtons();
      renderStateReadout();
    }
    return {
      ok: true,
      card: playedCard,
      reserved: shouldReserve,
      message: rocketState.statusNote,
    };
  }

  function handleRunezuCardPlay(handIndex) {
    if (!runezu) return { ok: false, message: "符文族模块未加载" };
    const currentPlayer = getCurrentPlayer();
    const removeIndex = Math.round(handIndex);
    const card = currentPlayer?.hand?.[removeIndex];
    if (!card) {
      rocketState.statusNote = "无效的手牌位置";
      renderStateReadout();
      return { ok: false, message: rocketState.statusNote };
    }

    const cost = getCardPlayCost(card);
    if (!players.canAfford(currentPlayer, cost)) {
      rocketState.statusNote = `资源不足：${cards.getCardLabel(card)} 需要 ${formatCardPlayCost(cost)}`;
      renderStateReadout();
      return { ok: false, message: rocketState.statusNote };
    }

    const beforePlayer = structuredClone(currentPlayer);
    const beforeAlienState = structuredClone(alienGameState);
    const beforeCardState = {
      publicCards: cardState.publicCards.slice(),
      discardPile: (cardState.discardPile || []).slice(),
    };
    const spendResult = players.spendResources(currentPlayer, cost);
    if (!spendResult.ok) {
      rocketState.statusNote = spendResult.message;
      renderStateReadout();
      return spendResult;
    }

    const removeResult = cards.discardFromHandAtIndex(currentPlayer, removeIndex);
    if (!removeResult.ok) {
      players.gainResources(currentPlayer, cost);
      rocketState.statusNote = removeResult.message;
      renderStateReadout();
      return removeResult;
    }

    const playedCard = removeResult.card;
    playedCard.runezuCard = true;
    playedCard.runezuTask = playedCard.runezuTask || runezu.getCardTask(playedCard);
    const typeCode = getCardTypeCode(playedCard);
    const shouldReserve = [1, 2, 3].includes(typeCode);
    if (shouldReserve) {
      if (!Array.isArray(currentPlayer.reservedCards)) currentPlayer.reservedCards = [];
      cardEffects.ensureCardEffectState(playedCard);
      currentPlayer.reservedCards.push(playedCard);
    } else {
      cards.addToDiscardPile(cardState, playedCard);
    }

    const playEffects = runezu.buildImmediateEffects(playedCard);
    const sentinelEffects = industry?.buildSentinelPlayCornerEffectNodes?.(
      cards,
      currentPlayer,
      turnState.roundNumber,
      turnState.turnNumber,
      playedCard,
    ) || [];
    const allPlayEffects = [...playEffects, ...sentinelEffects];

    cards.setPlayCardSelectionActive(cardState, false);
    pendingPlayCardSelection = null;
    rocketState.statusNote = shouldReserve
      ? `打出：${cards.getCardLabel(playedCard)}，支付 ${formatCardPlayCost(cost)}，进入保留牌区`
      : `打出：${cards.getCardLabel(playedCard)}，支付 ${formatCardPlayCost(cost)}，已弃掉`;
    applyIndustryPlayCardPassives(playedCard, typeCode);
    syncPlayCardSelectionChrome();
    renderPlayerStats();
    renderReservedCardsFromTaskState();
    recordPlayCardStart(currentPlayer, playedCard, beforePlayer, beforeCardState, beforeAlienState);
    if (allPlayEffects.length) {
      startCardEffectFlow("runezu-play-card-effects", `打出 ${cards.getCardLabel(playedCard)}`, allPlayEffects, {
        actionType: "playCard",
        card: playedCard,
        temporaryTasks: [],
        industryPlayedCard: playedCard,
      });
    } else {
      markActionPending();
      updateActionButtons();
      renderStateReadout();
    }
    return {
      ok: true,
      card: playedCard,
      reserved: shouldReserve,
      message: rocketState.statusNote,
    };
  }

  function handleBanrenmaCardPlay(handIndex) {
    if (!banrenma) return { ok: false, message: "半人马模块未加载" };
    const currentPlayer = getCurrentPlayer();
    const removeIndex = Math.round(handIndex);
    const card = currentPlayer?.hand?.[removeIndex];
    if (!card) {
      rocketState.statusNote = "无效的手牌位置";
      renderStateReadout();
      return { ok: false, message: rocketState.statusNote };
    }

    const cost = getCardPlayCost(card);
    if (!players.canAfford(currentPlayer, cost)) {
      rocketState.statusNote = `资源不足：${cards.getCardLabel(card)} 需要 ${formatCardPlayCost(cost)}`;
      renderStateReadout();
      return { ok: false, message: rocketState.statusNote };
    }

    const beforePlayer = structuredClone(currentPlayer);
    const beforeAlienState = structuredClone(alienGameState);
    const beforeCardState = {
      publicCards: cardState.publicCards.slice(),
      discardPile: (cardState.discardPile || []).slice(),
    };
    const spendResult = players.spendResources(currentPlayer, cost);
    if (!spendResult.ok) {
      rocketState.statusNote = spendResult.message;
      renderStateReadout();
      return spendResult;
    }

    const removeResult = cards.discardFromHandAtIndex(currentPlayer, removeIndex);
    if (!removeResult.ok) {
      players.gainResources(currentPlayer, cost);
      rocketState.statusNote = removeResult.message;
      renderStateReadout();
      return removeResult;
    }

    const playedCard = removeResult.card;
    if (!Array.isArray(currentPlayer.reservedCards)) currentPlayer.reservedCards = [];
    cardEffects.ensureCardEffectState(playedCard);
    const threshold = (Number(currentPlayer.resources?.score) || 0) + banrenma.SCORE_MARK_DELTA;
    const scoreMark = banrenma.addScoreMark(alienGameState, currentPlayer, threshold, "card", {
      cardInstanceId: playedCard.id,
      cardIndex: playedCard.alienCardId ?? banrenma.getCardDefinition(playedCard)?.index ?? null,
    });
    playedCard.banrenmaCard = true;
    playedCard.banrenmaThreshold = threshold;
    playedCard.banrenmaScoreMarkId = scoreMark?.id || null;
    currentPlayer.reservedCards.push(playedCard);

    const playEffects = banrenma.buildImmediateEffects(playedCard);
    const sentinelEffects = industry?.buildSentinelPlayCornerEffectNodes?.(
      cards,
      currentPlayer,
      turnState.roundNumber,
      turnState.turnNumber,
      playedCard,
    ) || [];
    const allPlayEffects = [...playEffects, ...sentinelEffects];

    cards.setPlayCardSelectionActive(cardState, false);
    pendingPlayCardSelection = null;
    rocketState.statusNote = `打出：${cards.getCardLabel(playedCard)}，支付 ${formatCardPlayCost(cost)}，进入保留牌区`;
    applyIndustryPlayCardPassives(playedCard, getCardTypeCode(playedCard));
    syncPlayCardSelectionChrome();
    renderPlayerStats();
    renderReservedCardsFromTaskState();
    recordPlayCardStart(currentPlayer, playedCard, beforePlayer, beforeCardState, beforeAlienState);
    if (allPlayEffects.length) {
      startCardEffectFlow("banrenma-play-card-effects", `打出 ${cards.getCardLabel(playedCard)}`, allPlayEffects, {
        actionType: "playCard",
        card: playedCard,
        temporaryTasks: [],
        industryPlayedCard: playedCard,
      });
    } else {
      markActionPending();
      updateActionButtons();
      renderStateReadout();
    }
    return {
      ok: true,
      card: playedCard,
      reserved: true,
      message: rocketState.statusNote,
    };
  }

  function beginCardSelection(pendingAction = null) {
    if (isTechTilePickingActive()) {
      return { ok: false, message: "请先完成科技选择" };
    }
    if (isDiscardSelectionActive()) {
      return { ok: false, message: "请先完成弃牌" };
    }
    if (isPlayCardSelectionActive()) {
      return { ok: false, message: "请先完成打牌" };
    }
    if (isHandScanSelectionActive()) {
      return { ok: false, message: "请先完成手牌扫描" };
    }
    if (isMovePaymentSelectionActive()) {
      return { ok: false, message: "请先完成移动" };
    }

    pendingCardSelectionAction = pendingAction;
    cards.setSelectionActive(cardState, true);
    rocketState.statusNote = pendingAction?.type === "public_scan"
      ? (pendingAction.maxSelectable ?? 1) > 1
        ? `公共牌区扫描：最多选择 ${pendingAction.maxSelectable} 张公共牌，确认后依次扫描`
        : "公共牌区扫描：请选择一张亮明的公共牌（不能盲抽）"
      : pendingAction?.type === "place_data_choose_card"
        ? "放置数据：精选一张公共牌，或点击盲抽"
      : pendingAction?.type === "tech_bonus_pick_card"
        ? "科技奖励：精选一张公共牌"
      : pendingAction?.type === "jiuzhe_trace_pick"
        ? "九折痕迹：精选一张公共牌"
      : pendingAction?.type === "yichangdian_anomaly_pick"
        ? "异常奖励：精选一张公共牌，或点击盲抽"
      : pendingAction?.type === "card_trigger_pick"
        ? "卡牌触发：精选一张公共牌，或点击盲抽"
      : pendingAction?.type === "industry_stratus_corner"
        ? `层云核心：请点击公共牌结算弃牌角标（剩余 ${pendingAction.remaining ?? 0} 张）`
      : pendingAction?.type === "industry_mission_pick"
        ? "任务中继站：精选 1 张公共牌并获得收入资源"
      : pendingAction?.type === "industry_fenwick_pick"
        ? "芬威克研究中心：精选 1 张公共牌并获得弃牌角标"
      : pendingAction?.type === "industry_strategy_pick"
        ? "宇宙战略集团：精选 1 张公共牌"
      : pendingAction?.type === "industry_deepspace_public"
        ? "深空探测：请选择 1 张公共牌完成交换"
      : allowsBlindDrawInSelection()
      ? "精选：从公共牌区选一张牌，或点击盲抽"
      : "精选：从公共牌区选一张牌";
    syncCardSelectionChrome();
    updateActionButtons();
    renderStateReadout();
    return { ok: true, message: rocketState.statusNote };
  }

  function formatIncomeGain(gain) {
    return Object.entries(gain || {})
      .filter(([, value]) => value)
      .map(([key, value]) => `${INCOME_GAIN_LABELS[key] || key}+${value}`)
      .join("、");
  }

  function applyIncomeFromCard(player, card) {
    if (!player) {
      return { ok: false, message: "没有当前玩家" };
    }

    const incomeCode = cards.getIncomeCodeForCard(card);
    const gain = cards.getIncomeGainForCard(card);
    if (!gain) {
      return {
        ok: false,
        message: `无法识别卡牌收入：${cards.getCardLabel(card) || "未知卡牌"}`,
      };
    }

    players.gainIncome(player, gain, {
      blindDraw: (targetPlayer) => blindDrawCardForPlayer(targetPlayer),
      gainData: (targetPlayer) => data.gainData(targetPlayer, { source: "income" }),
    });
    return {
      ok: true,
      incomeCode,
      gain,
      message: `收入：弃掉 ${cards.getCardLabel(card)}，${formatIncomeGain(gain)}（已即时获得）`,
    };
  }

  function beginIncomeForCurrentPlayer(options = {}) {
    const currentPlayer = getCurrentPlayer();
    return beginDiscardSelection(1, {
      type: "income",
      player: currentPlayer,
      source: options.source || null,
    });
  }

  function cancelCardSelection() {
    const pending = pendingCardSelectionAction;
    pendingCardSelectionAction = null;
    cards.setSelectionActive(cardState, false);
    if (pending?.type === "trade" && pending.player && pending.refundCost) {
      players.gainResources(pending.player, pending.refundCost);
      rocketState.statusNote = `已取消精选，已退回 ${players.formatResourceCost(pending.refundCost)}`;
    } else if (pending?.type === "public_scan") {
      rocketState.statusNote = "已取消公共牌区扫描";
    } else if (pending?.type === "place_data_choose_card") {
      completeQuickActionStep();
      rocketState.statusNote = "已取消放置数据精选";
    } else if (pending?.type === "tech_bonus_pick_card") {
      rocketState.statusNote = "已取消科技奖励精选";
    } else if (pending?.type === "jiuzhe_trace_pick") {
      rocketState.statusNote = "已取消九折痕迹精选";
      if (pending.fromEffectFlow && getCurrentActionEffect()) {
        getCurrentActionEffect().result = {
          ok: true,
          undoable: true,
          message: rocketState.statusNote,
        };
        completeCurrentActionEffect();
      }
    } else if (pending?.type === "yichangdian_anomaly_pick") {
      rocketState.statusNote = "已取消异常奖励精选";
      if (pending.fromEffectFlow && getCurrentActionEffect()) {
        getCurrentActionEffect().result = {
          ok: true,
          undoable: true,
          message: rocketState.statusNote,
        };
        completeCurrentActionEffect();
      }
    } else if (pending?.type === "chong_pick_card") {
      rocketState.statusNote = "已取消虫族奖励精选";
      if (pending.fromEffectFlow && getCurrentActionEffect()) {
        getCurrentActionEffect().result = {
          ok: true,
          undoable: true,
          message: rocketState.statusNote,
        };
        completeCurrentActionEffect();
      }
    } else if (pending?.type === "amiba_pick_card") {
      rocketState.statusNote = "已取消阿米巴奖励精选";
      if (pending.fromEffectFlow && getCurrentActionEffect()) {
        getCurrentActionEffect().result = {
          ok: true,
          undoable: true,
          message: rocketState.statusNote,
        };
        completeCurrentActionEffect();
      }
    } else if (pending?.type === "card_trigger_pick") {
      rocketState.statusNote = "已取消卡牌触发精选";
    } else if (pending?.type?.startsWith?.("industry_")) {
      if (pending.refundCost && pending.player) {
        players.gainResources(pending.player, pending.refundCost);
      }
      cancelIndustryAbilityFlow({ silent: true });
      rocketState.statusNote = "已取消公司 1x 行动";
    } else {
      rocketState.statusNote = "";
    }
    syncCardSelectionChrome();
    renderPlayerStats();
    updateActionButtons();
    renderStateReadout();
  }

  function finalizeCardSelectionResult(result) {
    if (!result?.ok) {
      rocketState.statusNote = result?.message || "精选失败";
      renderStateReadout();
      return result;
    }

    cards.setSelectionActive(cardState, false);
    const pending = pendingCardSelectionAction;
    pendingCardSelectionAction = null;
    rocketState.statusNote = pending?.type === "trade"
      ? `快速交易精选：${cards.getCardLabel(result.card)}`
      : `获得卡牌：${cards.getCardLabel(result.card)}`;
    if (result.replenished) {
      rocketState.statusNote += `，公共区已补牌：${cards.getCardLabel(result.replenished)}`;
    }
    if (pending?.type === "trade" && pending.beforeTradeState) {
      const trade = quickTrades.getTradeAction(pending.tradeId);
      appendActionLogStep(
        HISTORY_SOURCE_QUICK,
        trade ? `快速交易：${trade.label}` : "快速交易精选",
        rocketState.statusNote,
      );
      clearHistoryStepOrderForSource(HISTORY_SOURCE_QUICK);
      if (quickActionHistory.hasSession()) quickActionHistory.commitSession();
    }
    if (pending?.type === "planet_reward_pick_card") {
      markCurrentActionIrreversible("公共牌补牌翻出新牌", "hidden_card_reveal");
      if (getCurrentActionEffect()) {
        getCurrentActionEffect().result = {
          ok: true,
          undoable: false,
          irreversible: { code: "hidden_card_reveal", reason: "公共牌补牌翻出新牌" },
          message: rocketState.statusNote,
          payload: { card: result.card, replenished: result.replenished || null },
        };
      }
      completeCurrentActionEffect();
    }
    if (pending?.type === "tech_bonus_pick_card") {
      markCurrentActionIrreversible("公共牌补牌翻出新牌", "hidden_card_reveal");
      const bonusResult = abilities.executeAbility("researchTechBonus", createActionContext(), {
        bonusId: pending.bonusId,
        firstTake: Boolean(pending.firstTake),
        skipCardSelection: true,
      });
      if (getCurrentActionEffect()) {
        getCurrentActionEffect().result = {
          ok: true,
          undoable: false,
          irreversible: { code: "hidden_card_reveal", reason: "公共牌补牌翻出新牌" },
          message: `${rocketState.statusNote}${bonusResult?.message ? `；${bonusResult.message}` : ""}`,
          events: [{
            type: "researchTech",
            playerId: pending.player?.id || getCurrentPlayer()?.id || null,
            playerColor: pending.player?.color || getCurrentPlayer()?.color || null,
            techType: pending.selection?.techType || null,
            tileId: pending.selection?.tileId || null,
            source: pendingActionEffectFlow?.actionType || "tech",
          }],
          payload: {
            card: result.card,
            replenished: result.replenished || null,
            bonus: bonusResult?.payload || bonusResult || null,
          },
        };
      }
      if (bonusResult?.message) rocketState.statusNote += `；${bonusResult.message}`;
      completeCurrentActionEffect();
    }
    if (pending?.type === "place_data_choose_card") {
      appendActionLogStep(HISTORY_SOURCE_QUICK, "放置数据", rocketState.statusNote);
      clearHistoryStepOrderForSource(HISTORY_SOURCE_QUICK);
      if (quickActionHistory.hasSession()) quickActionHistory.commitSession();
    }
    if (pending?.type === "jiuzhe_trace_pick") {
      rocketState.statusNote = `九折痕迹精选：${cards.getCardLabel(result.card)}`;
      if (pending.fromEffectFlow) {
        markCurrentActionIrreversible("公共牌补牌翻出新牌", "hidden_card_reveal");
        if (getCurrentActionEffect()) {
          getCurrentActionEffect().result = {
            ok: true,
            undoable: false,
            irreversible: { code: "hidden_card_reveal", reason: "公共牌补牌翻出新牌" },
            message: rocketState.statusNote,
            payload: { card: result.card, replenished: result.replenished || null },
          };
        }
        completeCurrentActionEffect();
      }
    }
    if (pending?.type === "yichangdian_anomaly_pick") {
      rocketState.statusNote = `异常奖励精选：${cards.getCardLabel(result.card)}`;
      if (pending.fromEffectFlow) {
        markCurrentActionIrreversible("公共牌补牌翻出新牌", "hidden_card_reveal");
        if (getCurrentActionEffect()) {
          getCurrentActionEffect().result = {
            ok: true,
            undoable: false,
            irreversible: { code: "hidden_card_reveal", reason: "公共牌补牌翻出新牌" },
            message: rocketState.statusNote,
            payload: { card: result.card, replenished: result.replenished || null },
          };
        }
        completeCurrentActionEffect();
      }
    }
    if (pending?.type === "chong_pick_card") {
      rocketState.statusNote = `虫族奖励精选：${cards.getCardLabel(result.card)}`;
      if (pending.fromEffectFlow) {
        markCurrentActionIrreversible("公共牌补牌翻出新牌", "hidden_card_reveal");
        if (getCurrentActionEffect()) {
          getCurrentActionEffect().result = {
            ok: true,
            undoable: false,
            irreversible: { code: "hidden_card_reveal", reason: "公共牌补牌翻出新牌" },
            message: rocketState.statusNote,
            payload: { card: result.card, replenished: result.replenished || null },
          };
        }
        completeCurrentActionEffect();
      }
    }
    if (pending?.type === "amiba_pick_card") {
      rocketState.statusNote = `阿米巴奖励精选：${cards.getCardLabel(result.card)}`;
      if (pending.fromEffectFlow) {
        markCurrentActionIrreversible("公共牌补牌翻出新牌", "hidden_card_reveal");
        if (getCurrentActionEffect()) {
          getCurrentActionEffect().result = {
            ok: true,
            undoable: false,
            irreversible: { code: "hidden_card_reveal", reason: "公共牌补牌翻出新牌" },
            message: rocketState.statusNote,
            payload: { card: result.card, replenished: result.replenished || null },
          };
        }
        completeCurrentActionEffect();
      }
    }
    if (pending?.type === "card_trigger_pick") {
      const match = pending.triggerMatch;
      if (match?.card && match?.trigger) {
        cardEffects.consumeTrigger(match.card, match.trigger.id);
        discardReservedCardIfFinished(pending.player || getCurrentPlayer(), match.card);
      }
      rocketState.statusNote = `卡牌触发精选：${cards.getCardLabel(result.card)}`;
    }
    if (pending?.type === "industry_mission_pick") {
      const player = pending.player || getCurrentPlayer();
      const incomeResult = industry.applyIncomeResourcesFromCard(cards, players, data, player, result.card);
      rocketState.statusNote = incomeResult.ok
        ? `任务中继站：精选 ${cards.getCardLabel(result.card)}，${incomeResult.message}`
        : incomeResult.message;
      finishIndustryAbilityFlow(rocketState.statusNote);
      commitIrreversibleIndustryQuickAction("任务中继站：精选", rocketState.statusNote);
    }
    if (pending?.type === "industry_fenwick_pick") {
      const player = pending.player || getCurrentPlayer();
      const reward = industry.getCornerReward(cards, result.card);
      const applied = reward
        ? industry.applyCornerReward(players, data, player, reward)
        : { ok: false, message: "该牌没有弃牌角标奖励" };
      rocketState.statusNote = applied.ok
        ? `芬威克研究中心：精选 ${cards.getCardLabel(result.card)}，${applied.message}`
        : applied.message;
      if (applied.ok && applied.pendingFreeMove) {
        const moveCheck = canStartCardCornerFreeMove();
        if (moveCheck.ok) {
          pendingCardCornerFreeMove = {
            action: {
              label: "芬威克研究中心：免费移动",
              movementPoints: applied.pendingFreeMove.movementPoints || 1,
            },
            discardedCardLabel: cards.getCardLabel(result.card),
            finishIndustryFlowAfterMove: true,
            irreversibleIndustryFlow: true,
            industryLogLabel: "芬威克研究中心：精选",
            afterMoveStatus: rocketState.statusNote,
          };
          if (moveCheck.rocketsForPlayer.length === 1) {
            activateMoveMode(moveCheck.rocketsForPlayer[0].id);
          } else {
            selectDefaultRocketForCurrentPlayer();
          }
        } else {
          rocketState.statusNote = `${rocketState.statusNote}；${moveCheck.message}`;
          finishIndustryAbilityFlow(rocketState.statusNote);
          commitIrreversibleIndustryQuickAction("芬威克研究中心：精选", rocketState.statusNote);
        }
      } else {
        finishIndustryAbilityFlow(rocketState.statusNote);
        commitIrreversibleIndustryQuickAction("芬威克研究中心：精选", rocketState.statusNote);
      }
    }
    if (pending?.type === "industry_strategy_pick") {
      rocketState.statusNote = `宇宙战略集团：精选 ${cards.getCardLabel(result.card)}`;
      finishIndustryAbilityFlow(rocketState.statusNote);
      commitIrreversibleIndustryQuickAction("宇宙战略集团：精选", rocketState.statusNote);
    }
    cards.ensurePublicCardsFilled(cardState, playerState);
    syncCardSelectionChrome();
    renderPublicCards();
    renderPlayerStats();
    updateActionButtons();
    renderStateReadout();
    return result;
  }

  function drawBasicCardToPlayer(player) {
    const target = player || getCurrentPlayer();
    if (!target) {
      return { ok: false, message: "没有当前玩家", card: null };
    }

    if (!Array.isArray(target.hand)) {
      target.hand = [];
    }

    return cards.blindDraw(cardState, playerState, target);
  }

  function blindDrawCardForPlayer(player) {
    return drawBasicCardToPlayer(player);
  }

  function drawCardForCurrentPlayer(options = {}) {
    const currentPlayer = getCurrentPlayer();
    const fromSelection = Boolean(options.fromSelection);
    const drawResult = blindDrawCardForPlayer(currentPlayer);

    if (!drawResult.ok) {
      rocketState.statusNote = drawResult.message;
      renderStateReadout();
      return drawResult;
    }

    if (fromSelection) {
      return finalizeCardSelectionResult(drawResult);
    }

    rocketState.statusNote = `盲抽：${cards.getCardLabel(drawResult.card)}`;
    renderPlayerStats();
    renderPublicCards();
    updatePublicCardControls();
    renderStateReadout();
    return { ok: true, card: drawResult.card, message: rocketState.statusNote };
  }

  function pickPublicCardForCurrentPlayer(slotIndex) {
    const currentPlayer = getCurrentPlayer();
    const pickResult = cards.pickFromPublic(cardState, playerState, currentPlayer, slotIndex);
    return finalizeCardSelectionResult(pickResult);
  }

  function discardCardFromCurrentPlayer() {
    return beginDiscardSelection(1);
  }

  function canBlindDraw() {
    return cards.getAvailablePool(cardState, playerState).length > 0;
  }

  function updatePublicCardControls() {
    if (!els.publicBlindDrawButton) return;

    const selectionActive = isCardSelectionActive();
    const allowsBlindDraw = allowsBlindDrawInSelection();
    const canDraw = canBlindDraw();
    const enabled = selectionActive && allowsBlindDraw && canDraw;
    els.publicBlindDrawButton.disabled = !enabled;
    els.publicBlindDrawButton.classList.toggle("is-selectable", enabled);
    els.publicBlindDrawButton.title = !selectionActive
      ? "请先进入精选"
      : !allowsBlindDraw
        ? "本次精选不能盲抽"
        : canDraw
        ? "盲抽一张牌加入手牌"
        : "牌库已空";
  }

  function renderPublicCards() {
    if (!els.publicCardRow) return;

    cards.ensurePublicCardsFilled(cardState, playerState);

    const selectionActive = isCardSelectionActive();
    const publicScanMulti = isPublicScanMultiSelectActive();
    const selectedPublicSlots = pendingCardSelectionAction?.selectedSlots || [];
    els.publicCardRow.replaceChildren(...cardState.publicCards.map((card, index) => {
      const slot = document.createElement("div");
      slot.className = "public-card-slot";
      slot.dataset.publicSlot = String(index);
      const label = card?.cardName || `公共牌 ${index + 1}`;

      if (!card) {
        slot.classList.add("is-empty");
        slot.setAttribute("aria-hidden", "true");
        return slot;
      }

      if (selectionActive) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "public-card";
        button.dataset.publicSlot = String(index);
        button.classList.add("is-selectable");
        if (publicScanMulti && selectedPublicSlots.includes(index)) {
          button.classList.add("is-selected");
        }
        button.setAttribute("aria-label", label);

        const image = document.createElement("img");
        image.src = card.src;
        image.alt = "";
        image.width = 747;
        image.height = 1040;
        image.decoding = "async";
        image.setAttribute("aria-hidden", "true");
        button.append(image);
        slot.append(button);
        return slot;
      }

      const image = document.createElement("img");
      image.className = "public-card";
      image.src = card.src;
      image.alt = label;
      image.width = 747;
      image.height = 1040;
      image.decoding = "async";
      slot.append(image);
      return slot;
    }));

    updatePublicCardControls();
  }

  function handlePublicCardClick(slotIndex) {
    if (!isCardSelectionActive()) return;
    if (pendingCardSelectionAction?.type === "public_scan") {
      handlePublicScanCardClick(slotIndex);
      return;
    }
    if (pendingCardSelectionAction?.type === "industry_stratus_corner") {
      handleIndustryStratusPublicClick(slotIndex);
      return;
    }
    if (pendingCardSelectionAction?.type === "industry_deepspace_public") {
      finalizeIndustryDeepspaceSwap(slotIndex);
      return;
    }
    pickPublicCardForCurrentPlayer(slotIndex);
  }

  function handlePublicBlindDrawClick() {
    if (!isCardSelectionActive()) return;
    if (!allowsBlindDrawInSelection()) {
      rocketState.statusNote = "本次精选不能盲抽，请从公共牌区选择";
      renderStateReadout();
      return;
    }
    drawCardForCurrentPlayer({ fromSelection: true });
  }

  function getNormalTokenAssetForPlayer(player) {
    return players.getPlayerColorDefinition(player?.color)?.normalTokenAsset
      || "../assets/tokens/normal_token.png";
  }

  function syncFinalScorePendingMarks() {
    const result = finalScoring.syncPendingMarks(finalScoringState, playerState.players);
    const currentPlayer = getCurrentPlayer();
    const currentAdded = (result.added || []).filter((pending) => pending.playerId === currentPlayer?.id);
    if (currentAdded.length) {
      const thresholds = currentAdded.map((pending) => `${pending.threshold}分`).join("、");
      rocketState.statusNote = `${currentPlayer.colorLabel}玩家达到 ${thresholds}，请选择终局计分板块标记`;
    }
    return result;
  }

  function getFinalScoreTokenPoint(mark) {
    const slotIndex = Number(mark?.slotIndex) || 3;
    const slot = FINAL_SCORE_SLOT_POINTS[slotIndex] || FINAL_SCORE_SLOT_POINTS[3];
    if (slotIndex !== 3) return slot;

    const order = Math.max(1, Number(mark?.slot3Order) || 1) - 1;
    const columns = Math.max(1, Number(slot.columns) || 1);
    return {
      x: slot.x + (order % columns) * slot.stepX,
      y: slot.y + Math.floor(order / columns) * slot.stepY,
    };
  }

  function createFinalScoreTokenElement(mark) {
    const image = document.createElement("img");
    const point = getFinalScoreTokenPoint(mark);
    image.className = "final-score-token";
    image.dataset.finalSlot = String(mark.slotIndex);
    image.dataset.playerColor = mark.playerColor || "";
    image.src = mark.tokenSrc || "../assets/tokens/normal_token.png";
    image.alt = "";
    image.width = 296;
    image.height = 296;
    image.decoding = "async";
    image.setAttribute("aria-hidden", "true");
    image.style.setProperty("--final-token-x", `${point.x}%`);
    image.style.setProperty("--final-token-y", `${point.y}%`);
    return image;
  }

  function renderFinalScoreBoard() {
    const currentPlayer = getCurrentPlayer();
    const pending = finalScoring.getNextPendingMarkForPlayer(finalScoringState, currentPlayer?.id);

    els.finalScoreTileWraps.forEach((wrap) => {
      const tileId = wrap.dataset.finalId;
      const tile = finalScoringState.tiles?.[tileId];
      const layer = wrap.querySelector(".final-score-token-layer");
      const canMark = pending
        ? finalScoring.canMarkTile(finalScoringState, tileId, currentPlayer)
        : { ok: false };

      wrap.disabled = !canMark.ok;
      wrap.classList.toggle("is-selectable", canMark.ok);
      wrap.title = canMark.ok
        ? `${currentPlayer.colorLabel}玩家标记 ${pending.threshold} 分门槛`
        : "";

      if (layer) {
        layer.replaceChildren(...(tile?.marks || []).map(createFinalScoreTokenElement));
      }
    });
  }

  function handleFinalScoreTileClick(tileId) {
    const currentPlayer = getCurrentPlayer();
    syncFinalScorePendingMarks();

    const result = finalScoring.markTile(finalScoringState, tileId, currentPlayer, {
      tokenSrc: getNormalTokenAssetForPlayer(currentPlayer),
    });

    rocketState.statusNote = result.message;
    renderFinalScoreBoard();
    queueStateReadoutRender();
    return result;
  }

  function replaceNebulaDataForCurrentPlayer(nebulaId, options = {}) {
    beginEffectHistoryStep(options.prefix || "星云扫描");

    const result = abilities.executeAbility("scanSector", createActionContext(), {
      ...options,
      nebulaId,
    });

    if (!result.ok) {
      endEffectHistoryStep();
      rocketState.statusNote = result.message;
      renderSectors();
      renderStateReadout();
      return result;
    }

    recordAbilityCommands(result);
    rocketState.statusNote = result.message;

    renderSectors();
    renderPlayerStats();
    updateActionButtons();
    renderStateReadout();
    return result;
  }

  function discardPublicScanCard(pending) {
    const slotIndex = Number(pending?.publicSlotIndex);
    const card = pending?.card;
    if (!card || !Number.isInteger(slotIndex)) {
      return { ok: false, message: "没有可弃除的公共牌" };
    }

    const publicCardsSnapshot = cardState.publicCards.slice();
    const discardPileSnapshot = (cardState.discardPile || []).slice();

    cards.addToDiscardPile(cardState, card);
    let replenished = null;
    if (cardState.publicCards?.[slotIndex]?.id === card.id) {
      cardState.publicCards[slotIndex] = null;
      replenished = cards.replenishPublicSlot(cardState, playerState, slotIndex);
    }

    recordHistoryCommand(historyCommands.createRestorePublicCardsCommand(
      cardState,
      publicCardsSnapshot,
      discardPileSnapshot,
    ));

    renderPublicCards();
    updatePublicCardControls();
    return {
      ok: true,
      card,
      replenished,
      message: replenished
        ? `弃除 ${cards.getCardLabel(card)}，公共区补牌：${cards.getCardLabel(replenished)}`
        : `弃除 ${cards.getCardLabel(card)}`,
    };
  }

  function discardHandScanCard(pending) {
    const player = pending?.player || getCurrentPlayer();
    const handIndex = Number(pending?.handIndex);
    const card = pending?.card;
    if (!player || !card || !Number.isInteger(handIndex)) {
      return { ok: false, message: "没有可弃除的手牌" };
    }

    const currentIndex = player.hand?.findIndex((item) => item.id === card.id);
    const discardIndex = currentIndex >= 0 ? currentIndex : handIndex;
    const handSnapshot = player.hand.slice();
    const discardPileSnapshot = (cardState.discardPile || []).slice();
    const discardResult = cards.discardFromHandAtIndex(player, discardIndex);
    if (!discardResult.ok) return discardResult;

    cards.addToDiscardPile(cardState, discardResult.card);
    recordHistoryCommand(historyCommands.createDiscardHandCardCommand(
      cardState,
      player,
      handSnapshot,
      discardPileSnapshot,
    ));
    renderPlayerStats();
    return {
      ok: true,
      card: discardResult.card,
      message: `弃除手牌 ${cards.getCardLabel(discardResult.card)}`,
    };
  }

  function finalizeScanSourceCard(pending, scanResult) {
    if (!scanResult?.ok) return scanResult;

    let discardResult = null;
    if (pending?.type === "public_scan") {
      discardResult = discardPublicScanCard(pending);
    } else if (pending?.type === "hand_scan") {
      discardResult = discardHandScanCard(pending);
    }

    if (discardResult?.ok) {
      rocketState.statusNote = `${scanResult.message}；${discardResult.message}`;
      renderPlayerStats();
      renderPublicCards();
      updatePublicCardControls();
      updateActionButtons();
      renderStateReadout();
      return {
        ...scanResult,
        discardedCard: discardResult.card,
        replenished: discardResult.replenished || null,
        message: rocketState.statusNote,
      };
    }

    return scanResult;
  }

  function closeScanTargetPicker() {
    if (!els.scanTargetOverlay) return;
    if (pendingPublicScanQueue) {
      rocketState.statusNote = "公共牌区扫描：请完成全部星云选择";
      renderStateReadout();
      return;
    }
    pendingCardTriggerAction = null;
    pendingCardTaskCompletion = null;
    pendingChongTaskCompletion = null;
    pendingAmibaCardGain = null;
    pendingAmibaSymbolChoice = null;
    pendingAmibaTraceRemoval = null;
    pendingAomomoCardGain = null;
    pendingRunezuCardGain = null;
    pendingRunezuSymbolBranch = null;
    pendingRunezuFaceSymbolPlacement = null;
    pendingScanTargetAction = null;
    els.scanTargetOverlay.hidden = true;
    if (els.scanTargetCancel) {
      els.scanTargetCancel.hidden = false;
    }
    renderPlayerHand();
    syncInteractionFocusChrome();
  }

  function buildNebulaScanChoice(nebulaId, extra = {}) {
    const nextToken = data.getNextReplaceableNebulaToken(nebulaDataState, nebulaId);
    const tokens = data.listNebulaTokens(nebulaDataState, nebulaId);
    const label = data.getNebulaLabel(nebulaId);
    return {
      nebulaId,
      label: extra.label || label,
      description: extra.description || (nextToken
        ? `下一次替换槽位 ${nextToken.slotIndex}`
        : tokens.length
          ? "该星云已无未替换数据"
          : "该星云没有已填充数据"),
      disabled: !nextToken,
      title: nextToken ? "" : "需要先填充星云数据，且仍有未替换数据",
      ...extra,
    };
  }

  function isAomomoActive() {
    return Boolean(solarState.aomomoActive && aomomo?.isAomomoRevealedSlot?.(
      alienGameState,
      alienGameState.aomomo?.revealedSlotId,
    ));
  }

  function getAomomoPlanetLocation() {
    if (!solarState.aomomoActive) return null;
    return solar.createSolarSnapshot(solarState).planetLocations
      .find((planet) => planet.planetId === aomomo?.PLANET_ID) || null;
  }

  function getAomomoCurrentX() {
    const location = getAomomoPlanetLocation();
    return location ? solar.mod8(location.x) : null;
  }

  function getNebulaCurrentX(nebulaId) {
    const found = solar.getNebulaLocations(solarState.sectorBySlot)
      .find((nebula) => nebula.id === nebulaId);
    return found ? solar.mod8(found.x) : null;
  }

  function buildAomomoScanChoiceForX(sectorX, extra = {}) {
    return buildNebulaScanChoice(aomomo.NEBULA_ID, {
      sectorX,
      label: extra.label || `扇区 ${sectorX}：奥陌陌`,
      descriptionPrefix: extra.descriptionPrefix,
      ...extra,
    });
  }

  function hasAomomoScanAtX(sectorX) {
    const currentX = getAomomoCurrentX();
    return isAomomoActive() && currentX != null && solar.mod8(sectorX) === currentX;
  }

  function buildSectorScanChoicesForX(sectorX) {
    const x = solar.mod8(sectorX);
    const choices = [];
    const nebula = solar.getNebulaAtCoordinate(x, 5, solarState.sectorBySlot);
    if (nebula) {
      choices.push(buildNebulaScanChoice(nebula.id, {
        sectorX: x,
        label: `扇区 ${x}：${nebula.label}`,
      }));
    }
    if (hasAomomoScanAtX(x)) {
      choices.push(buildAomomoScanChoiceForX(x));
    }
    if (!choices.length) {
      choices.push({
        nebulaId: "",
        sectorX: x,
        label: `扇区 ${x}`,
        description: "当前没有星云",
        disabled: true,
      });
    }
    return choices;
  }

  function expandScanChoicesWithAomomoTargets(choices) {
    if (!isAomomoActive()) return choices;
    const next = [];
    const seenAomomo = new Set();
    for (const choice of choices || []) {
      next.push(choice);
      const sectorX = choice?.sectorX != null
        ? Number(choice.sectorX)
        : getNebulaCurrentX(choice?.nebulaId);
      if (sectorX == null || !hasAomomoScanAtX(sectorX)) continue;
      const key = solar.mod8(sectorX);
      if (seenAomomo.has(key) || choice.nebulaId === aomomo.NEBULA_ID) continue;
      seenAomomo.add(key);
      next.push(buildAomomoScanChoiceForX(key));
    }
    return next;
  }

  function openScanTargetPicker(config) {
    if (!els.scanTargetOverlay || !els.scanTargetActions) return { ok: false, message: "无法打开扫描目标选择" };

    pendingScanTargetAction = config || {};
    if (els.scanTargetTitle) {
      els.scanTargetTitle.textContent = config.title || "选择扫描目标";
    }
    if (els.scanTargetSubtitle) {
      els.scanTargetSubtitle.textContent = config.subtitle || "";
    }

    els.scanTargetActions.replaceChildren(...(config.choices || []).map((choice) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "scan-target-option-button";
      button.dataset.nebulaId = choice.nebulaId;
      if (choice.sectorX != null) button.dataset.sectorX = String(choice.sectorX);
      button.disabled = Boolean(choice.disabled);
      button.title = choice.title || "";
      button.innerHTML = `${choice.label}<small>${choice.description || ""}</small>`;
      return button;
    }));

    if (els.scanTargetCancel) {
      els.scanTargetCancel.hidden = Boolean(config.queueMode);
    }
    els.scanTargetOverlay.hidden = false;
    renderPlayerHand();
    return { ok: true, message: config.subtitle || "" };
  }

  function confirmScanTarget(nebulaId, sectorX) {
    const pending = pendingScanTargetAction;
    closeScanTargetPicker();

    if (pending?.type === "industry_remove_tech") {
      return confirmIndustryHeliosRemoveTech(nebulaId);
    }

    const scanSource = pending?.fromEffectFlow || isActionEffectFlowActive() ? "scan" : "debug";

    if (pending?.type === "sector_scan") {
      let result = replaceNebulaDataForCurrentPlayer(nebulaId, {
        prefix: pending.title || (sectorX != null ? `扇区${sectorX}扫描` : "星云扫描"),
        source: scanSource,
        gainData: pending.gainData,
      });
      result = applyAomomoScanCostAndBonus(pending, result);
      maybeCompleteActionEffectFromScan(result);
      return result;
    }

    if (pending?.type === "public_scan") {
      if (pending.queueMode && pendingPublicScanQueue) {
        const scanResult = replaceNebulaDataForCurrentPlayer(nebulaId, {
          prefix: `公共牌区扫描 ${cards.getCardLabel(pending.card)}`,
          source: scanSource,
        });
        if (!scanResult.ok) {
          rocketState.statusNote = scanResult.message;
          renderSectors();
          renderStateReadout();
          return scanResult;
        }
        const queue = pendingPublicScanQueue;
        queue.currentIndex += 1;
        if (queue.currentIndex < queue.items.length) {
          rocketState.statusNote = scanResult.message;
          renderSectors();
          renderPlayerStats();
          updateActionButtons();
          renderStateReadout();
          openPublicScanNebulaPickerForCurrentQueueItem();
          return scanResult;
        }
        pendingPublicScanQueue = null;
        closeScanTargetPicker();
        rocketState.statusNote = scanResult.message;
        renderSectors();
        renderPlayerStats();
        updateActionButtons();
        renderStateReadout();
        maybeCompleteActionEffectFromScan(scanResult);
        return scanResult;
      }

      beginEffectHistoryStep(`公共牌区扫描 ${cards.getCardLabel(pending.card)}`);
      const result = abilities.executeAbility("scanPublicCard", createActionContext(), {
        nebulaId,
        prefix: `公共牌区扫描 ${cards.getCardLabel(pending.card)}`,
        source: scanSource,
        card: pending.card,
        publicSlotIndex: pending.publicSlotIndex,
      });
      if (!result.ok) {
        endEffectHistoryStep();
        rocketState.statusNote = result.message;
        renderSectors();
        renderStateReadout();
        return result;
      }
      recordAbilityCommands(result);
      if (pending.irreversibleDraw) {
        result.undoable = false;
        result.irreversible = { code: "hidden_card_reveal", reason: "盲抽翻出新牌" };
        markCurrentActionIrreversible(result.irreversible.reason, result.irreversible.code);
      }
      rocketState.statusNote = result.message;
      renderSectors();
      renderPlayerStats();
      renderPublicCards();
      updatePublicCardControls();
      updateActionButtons();
      maybeCompleteActionEffectFromScan(result);
      return result;
    }

    if (pending?.type === "hand_scan") {
      beginEffectHistoryStep(`手牌扫描 ${cards.getCardLabel(pending.card)}`);
      const result = abilities.executeAbility("scanHandCard", createActionContext(), {
        nebulaId,
        prefix: `手牌扫描 ${cards.getCardLabel(pending.card)}`,
        source: scanSource,
        card: pending.card,
        handIndex: pending.handIndex,
        player: pending.player,
      });
      if (!result.ok) {
        endEffectHistoryStep();
        rocketState.statusNote = result.message;
        renderSectors();
        renderStateReadout();
        return result;
      }
      recordAbilityCommands(result);
      if (pending.irreversibleDraw) {
        result.undoable = false;
        result.irreversible = { code: "hidden_card_reveal", reason: "盲抽翻出新牌" };
        markCurrentActionIrreversible(result.irreversible.reason, result.irreversible.code);
      }
      rocketState.statusNote = result.message;
      renderSectors();
      renderPlayerStats();
      renderPublicCards();
      updatePublicCardControls();
      updateActionButtons();
      maybeCompleteActionEffectFromScan(result);
      return result;
    }

    return { ok: false, message: "没有待确认的扫描目标" };
  }

  function beginSectorScan() {
    if (isCardSelectionActive() || isDiscardSelectionActive() || isPlayCardSelectionActive() || isTechTilePickingActive()) {
      rocketState.statusNote = "请先完成当前选择";
      renderStateReadout();
      return { ok: false, message: rocketState.statusNote };
    }

    const choices = Array.from({ length: 8 }, (_item, x) => buildSectorScanChoicesForX(x)).flat();

    rocketState.statusNote = "扇区扫描：请选择 0-7 号扇区";
    renderStateReadout();
    return openScanTargetPicker({
      type: "sector_scan",
      title: "扇区扫描",
      subtitle: "选择当前 0-7 号扇区中的一个星云，按槽位顺序替换未替换的数据。",
      choices,
    });
  }

  function getSectorOpenDataCount(sectorId) {
    return data.listNebulaTokens(nebulaDataState, sectorId)
      .filter((token) => !token.replacedByPlayerColor && !token.playerColor)
      .length;
  }

  function getSectorCapacity(sectorId) {
    return data.getNebulaCapacity(sectorId);
  }

  function getSectorReplacedCount(sectorId) {
    return getSectorCapacity(sectorId) - getSectorOpenDataCount(sectorId);
  }

  function getSectorExtraMarkCount(sectorId) {
    return typeof data.listSectorExtraMarks === "function"
      ? data.listSectorExtraMarks(nebulaDataState, sectorId).length
      : 0;
  }

  function getSectorNebulaLabelText(sectorId) {
    return data.getNebulaLabel(sectorId);
  }

  function setScanTargetPickerChrome(title, subtitle) {
    if (els.scanTargetTitle) els.scanTargetTitle.textContent = title || "选择扫描目标";
    if (els.scanTargetSubtitle) els.scanTargetSubtitle.textContent = subtitle || "";
    if (els.scanTargetCancel) els.scanTargetCancel.hidden = false;
    els.scanTargetOverlay.hidden = false;
  }

  function makeDebugQuickSectorScanButton(step, label, description, dataset = {}, disabled = false) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "scan-target-option-button";
    button.dataset.debugSectorScanStep = step;
    for (const [key, value] of Object.entries(dataset)) {
      button.dataset[key] = String(value);
    }
    button.disabled = Boolean(disabled);
    button.innerHTML = `${label}<small>${description || ""}</small>`;
    return button;
  }

  function renderDebugQuickSectorScanPlayerStep() {
    setScanTargetPickerChrome("快速扫描扇区", "选择要放置标记的玩家颜色。");
    els.scanTargetActions.replaceChildren(...playerState.players.map((player) => {
      const definition = players.getPlayerColorDefinition(player.color);
      return makeDebugQuickSectorScanButton(
        "player",
        `${definition?.label || player.color}玩家`,
        `后续替换的数据会使用${definition?.label || player.color}普通 token`,
        { playerId: player.id },
      );
    }));
  }

  function renderDebugQuickSectorScanSectorStep(playerId) {
    const player = playerState.players.find((item) => item.id === playerId) || null;
    if (!player) {
      renderDebugQuickSectorScanPlayerStep();
      return;
    }

    setScanTargetPickerChrome(
      "快速扫描扇区",
      `当前玩家：${player.colorLabel}。选择要批量扫描的具名扇区。`,
    );
    els.scanTargetActions.replaceChildren(...data.NEBULA_IDS.map((sectorId) => {
      const openCount = getSectorOpenDataCount(sectorId);
      const capacity = getSectorCapacity(sectorId);
      const extraCount = getSectorExtraMarkCount(sectorId);
      return makeDebugQuickSectorScanButton(
        "sector",
        getSectorNebulaLabelText(sectorId),
        `${sectorId}，标记 ${capacity - openCount + extraCount}/${capacity}`
          + (extraCount ? `（额外${extraCount}）` : ""),
        { playerId, sectorId },
      );
    }));
  }

  function renderDebugQuickSectorScanCountStep(playerId, sectorId) {
    const player = playerState.players.find((item) => item.id === playerId) || null;
    const openCount = getSectorOpenDataCount(sectorId);
    if (!player) {
      renderDebugQuickSectorScanSectorStep(playerId);
      return;
    }

    setScanTargetPickerChrome(
      "快速扫描扇区",
      `${player.colorLabel}玩家 -> ${getSectorNebulaLabelText(sectorId)}。未替换数据 ${openCount} 个；超过后追加额外标记且不获得数据。`,
    );
    const maxCount = Math.max(openCount, 0) + DEBUG_QUICK_SECTOR_SCAN_EXTRA_LIMIT;
    const countButtons = Array.from({ length: maxCount }, (_, index) => {
      const count = index + 1;
      const extraCount = Math.max(0, count - openCount);
      const description = extraCount
        ? `替换 ${Math.max(openCount, 0)} 个数据，并追加 ${extraCount} 个额外标记`
        : `替换 ${count} 个未替换数据`;
      return makeDebugQuickSectorScanButton(
        "count",
        count === openCount
          ? `${count}（填满）`
          : extraCount
            ? `${count}（填满+${extraCount}）`
            : String(count),
        description,
        { playerId, sectorId, count },
      );
    });
    els.scanTargetActions.replaceChildren(...countButtons);
  }

  function replaceNextSectorDataForDebugPlayer(sectorId, player) {
    const nextToken = data.getNextReplaceableNebulaToken(nebulaDataState, sectorId);
    if (nextToken) {
      return data.replaceNextNebulaDataToken(nebulaDataState, sectorId, player, {
        playerColor: player.color,
        playerLabel: player.colorLabel,
        playerTokenSrc: getNormalTokenAssetForPlayer(player),
        source: "debugQuickSectorScan",
      });
    }
    if (typeof data.addSectorExtraMark === "function") {
      return data.addSectorExtraMark(nebulaDataState, sectorId, player, {
        playerColor: player.color,
        playerLabel: player.colorLabel,
        playerTokenSrc: getNormalTokenAssetForPlayer(player),
        source: "debugQuickSectorScan",
      });
    }
    return { ok: false, message: `扇区${sectorId}没有可替换的数据` };
  }

  function runDebugQuickSectorScan(playerId, sectorId, count) {
    const player = playerState.players.find((item) => item.id === playerId) || null;
    const replaceCount = Math.max(0, Math.round(Number(count) || 0));
    if (!player || !data.getNebulaCapacity(sectorId) || replaceCount <= 0) {
      rocketState.statusNote = "快速扫描扇区：参数无效";
      renderStateReadout();
      return { ok: false, message: rocketState.statusNote };
    }

    const results = [];
    for (let index = 0; index < replaceCount; index += 1) {
      const result = replaceNextSectorDataForDebugPlayer(sectorId, player);
      if (!result.ok) break;
      results.push(result);
    }

    const settleResult = resolveCompletedSectorSettlements("debugQuickSectorScan", {
      markMainActionIrreversible: false,
    });
    const extraCount = results.filter((result) => result.extra).length;
    const dataCount = results.length - extraCount;
    const replacedText = `快速扫描扇区：${player.colorLabel}玩家在${getSectorNebulaLabelText(sectorId)}`
      + `标记 ${results.length}/${replaceCount} 次（数据${dataCount}，额外${extraCount}）`;
    rocketState.statusNote = settleResult?.ok
      ? `${replacedText}；${settleResult.message}；${settleResult.participantAwardMessage || "参与结算玩家各获得1宣传"}`
      : replacedText;
    renderSectors();
    renderPlayerStats();
    updateActionButtons();
    renderStateReadout();
    return {
      ok: results.length > 0,
      results,
      settlement: settleResult,
      message: rocketState.statusNote,
    };
  }

  function handleDebugQuickSectorScanChoice(button) {
    const step = button.dataset.debugSectorScanStep;
    const playerId = button.dataset.playerId;
    if (step === "player") {
      renderDebugQuickSectorScanSectorStep(playerId);
      return;
    }
    if (step === "sector") {
      renderDebugQuickSectorScanCountStep(playerId, button.dataset.sectorId);
      return;
    }
    if (step === "count") {
      closeScanTargetPicker();
      runDebugQuickSectorScan(playerId, button.dataset.sectorId, Number(button.dataset.count));
    }
  }

  function openDebugQuickSectorScanPicker() {
    if (isCardSelectionActive() || isDiscardSelectionActive() || isPlayCardSelectionActive() || isTechTilePickingActive()) {
      rocketState.statusNote = "请先完成当前选择";
      renderStateReadout();
      return { ok: false, message: rocketState.statusNote };
    }
    pendingScanTargetAction = { type: "debug_quick_sector_scan" };
    renderDebugQuickSectorScanPlayerStep();
    rocketState.statusNote = "快速扫描扇区：请选择玩家颜色";
    renderStateReadout();
    return { ok: true, message: rocketState.statusNote };
  }

  function getPublicScanChoicesForCard(card) {
    const scanCode = Number(card?.scanActionCode);
    const nebulaIds = PUBLIC_SCAN_TARGETS_BY_CODE[scanCode];
    if (!nebulaIds) {
      return {
        ok: false,
        message: `无法识别卡牌右上角扫描效果：${cards.getCardLabel(card) || "未知卡牌"}`,
      };
    }

    return {
      ok: true,
      scanCode,
      scanLabel: PUBLIC_SCAN_CODE_LABELS[scanCode] || `扫描${scanCode}`,
      choices: expandScanChoicesWithAomomoTargets(nebulaIds.map((nebulaId) => buildNebulaScanChoice(nebulaId))),
    };
  }

  function createPublicScanPendingAction(player, fromEffectFlow = false) {
    const maxSelectable = getPublicScanMaxSelectable(player);
    return {
      type: "public_scan",
      player,
      allowBlindDraw: false,
      fromEffectFlow,
      maxSelectable,
      selectedSlots: [],
    };
  }

  function beginPublicDeckScan() {
    return beginCardSelection(createPublicScanPendingAction(getCurrentPlayer()));
  }

  function beginPublicScanForSingleCard(index, card, fromEffectFlow = false) {
    const scanChoices = getPublicScanChoicesForCard(card);
    if (!scanChoices.ok) {
      rocketState.statusNote = scanChoices.message;
      renderStateReadout();
      return scanChoices;
    }

    pendingCardSelectionAction = null;
    cards.setSelectionActive(cardState, false);
    syncCardSelectionChrome();
    rocketState.statusNote = `公共牌区扫描：${cards.getCardLabel(card)}，请选择${scanChoices.scanLabel}目标`;
    renderStateReadout();
    return openScanTargetPicker({
      type: "public_scan",
      card,
      publicSlotIndex: index,
      scanCode: scanChoices.scanCode,
      fromEffectFlow,
      title: "公共牌区扫描",
      subtitle: `${cards.getCardLabel(card)}：${scanChoices.scanLabel}，请选择 2 选 1 星云。`,
      choices: scanChoices.choices,
    });
  }

  function openPublicScanNebulaPickerForCurrentQueueItem() {
    const queue = pendingPublicScanQueue;
    if (!queue) return { ok: false, message: "没有待扫描的公共牌" };
    const item = queue.items[queue.currentIndex];
    if (!item) return { ok: false, message: "没有待扫描的公共牌" };

    const { card, scanChoices, publicSlotIndex } = item;
    const total = queue.items.length;
    const current = queue.currentIndex + 1;
    return openScanTargetPicker({
      type: "public_scan",
      card,
      publicSlotIndex,
      scanCode: scanChoices.scanCode,
      fromEffectFlow: queue.fromEffectFlow,
      queueMode: true,
      title: "公共牌区扫描",
      subtitle: total > 1
        ? `第 ${current}/${total} 张：${cards.getCardLabel(card)}，${scanChoices.scanLabel}，请选择 2 选 1 星云。`
        : `${cards.getCardLabel(card)}：${scanChoices.scanLabel}，请选择 2 选 1 星云。`,
      choices: scanChoices.choices,
    });
  }

  function confirmPublicScanSelection() {
    const pending = pendingCardSelectionAction;
    if (pending?.type !== "public_scan") {
      return { ok: false, message: "当前不是公共牌区扫描" };
    }

    const selectedSlots = [...(pending.selectedSlots || [])].sort((a, b) => a - b);
    if (!selectedSlots.length) {
      return { ok: false, message: "请至少选择一张公共牌" };
    }

    const items = [];
    for (const slotIndex of selectedSlots) {
      const card = cardState.publicCards[slotIndex];
      if (!card) {
        rocketState.statusNote = "所选公共牌已不可用";
        renderStateReadout();
        return { ok: false, message: rocketState.statusNote };
      }
      const scanChoices = getPublicScanChoicesForCard(card);
      if (!scanChoices.ok) {
        rocketState.statusNote = scanChoices.message;
        renderStateReadout();
        return scanChoices;
      }
      items.push({ card, publicSlotIndex: slotIndex, scanChoices });
    }

    const player = pending.player || getCurrentPlayer();
    const extraUsed = selectedSlots.length - 1;
    if (extraUsed > 0 && !players.canAfford(player, { additionalPublicScan: extraUsed })) {
      rocketState.statusNote = `额外公共扫描不足，需要 ${extraUsed} 个`;
      renderStateReadout();
      return { ok: false, message: rocketState.statusNote };
    }

    const fromEffectFlow = Boolean(pending.fromEffectFlow || pendingActionEffectFlow);
    pendingCardSelectionAction = null;
    cards.setSelectionActive(cardState, false);
    syncCardSelectionChrome();

    if (fromEffectFlow) {
      beginEffectHistoryStep("公共牌区扫描");
    }

    if (extraUsed > 0) {
      players.spendResources(player, { additionalPublicScan: extraUsed });
      recordHistoryCommand(historyCommands.createResourceSpendCommand(
        player,
        { additionalPublicScan: extraUsed },
        `消耗 ${extraUsed} 额外公共扫描`,
      ));
      renderPlayerStats();
    }

    const discardOrder = [...selectedSlots].sort((a, b) => b - a);
    for (const slotIndex of discardOrder) {
      const item = items.find((entry) => entry.publicSlotIndex === slotIndex);
      if (!item) continue;
      discardPublicScanCard({ card: item.card, publicSlotIndex: slotIndex });
    }

    pendingPublicScanQueue = {
      items,
      currentIndex: 0,
      fromEffectFlow,
    };
    rocketState.statusNote = `公共牌区扫描：已弃除 ${items.length} 张牌，请依次选择星云`;
    renderPlayerStats();
    renderPublicCards();
    updatePublicCardControls();
    updateActionButtons();
    renderStateReadout();
    return openPublicScanNebulaPickerForCurrentQueueItem();
  }

  function handlePublicScanCardClick(slotIndex) {
    const index = Number(slotIndex);
    const card = cardState.publicCards[index];
    if (!card) {
      rocketState.statusNote = "该公共牌位没有卡牌";
      renderStateReadout();
      return { ok: false, message: rocketState.statusNote };
    }

    const pending = pendingCardSelectionAction;
    const maxSelectable = pending?.maxSelectable ?? 1;
    const fromEffectFlow = Boolean(pending?.fromEffectFlow || pendingActionEffectFlow);

    if (maxSelectable <= 1) {
      return beginPublicScanForSingleCard(index, card, fromEffectFlow);
    }

    const selectedSlots = pending.selectedSlots || [];
    const existingIndex = selectedSlots.indexOf(index);
    if (existingIndex >= 0) {
      selectedSlots.splice(existingIndex, 1);
    } else if (selectedSlots.length >= maxSelectable) {
      rocketState.statusNote = `最多选择 ${maxSelectable} 张公共牌`;
      renderStateReadout();
      return { ok: false, message: rocketState.statusNote };
    } else {
      const scanChoices = getPublicScanChoicesForCard(card);
      if (!scanChoices.ok) {
        rocketState.statusNote = scanChoices.message;
        renderStateReadout();
        return scanChoices;
      }
      selectedSlots.push(index);
    }

    pending.selectedSlots = selectedSlots;
    const count = selectedSlots.length;
    rocketState.statusNote = count > 0
      ? `公共牌区扫描：已选 ${count}/${maxSelectable} 张，点击确认开始扫描`
      : `公共牌区扫描：最多选择 ${maxSelectable} 张公共牌`;
    syncPublicScanConfirmButton();
    renderPublicCards();
    renderStateReadout();
    return { ok: true, message: rocketState.statusNote };
  }

  function beginHandScan() {
    if (isTechTilePickingActive()) {
      rocketState.statusNote = "请先完成科技选择";
      renderStateReadout();
      return { ok: false, message: rocketState.statusNote };
    }
    if (isCardSelectionActive()) {
      rocketState.statusNote = "请先完成精选";
      renderStateReadout();
      return { ok: false, message: rocketState.statusNote };
    }
    if (isDiscardSelectionActive()) {
      rocketState.statusNote = "请先完成弃牌";
      renderStateReadout();
      return { ok: false, message: rocketState.statusNote };
    }
    if (isPlayCardSelectionActive()) {
      rocketState.statusNote = "请先完成打牌";
      renderStateReadout();
      return { ok: false, message: rocketState.statusNote };
    }
    if (isMovePaymentSelectionActive()) {
      rocketState.statusNote = "请先完成移动";
      renderStateReadout();
      return { ok: false, message: rocketState.statusNote };
    }

    const currentPlayer = getCurrentPlayer();
    if (!currentPlayer?.hand?.length) {
      rocketState.statusNote = "没有手牌可用于扫描";
      renderStateReadout();
      return { ok: false, message: rocketState.statusNote };
    }

    pendingHandScanAction = { type: "hand_scan", player: currentPlayer };
    rocketState.statusNote = "手牌扫描：请选择一张手牌弃除并扫描";
    syncHandScanSelectionChrome();
    updateActionButtons();
    renderStateReadout();
    return { ok: true, message: rocketState.statusNote };
  }

  function handleHandScanCardClick(handIndex) {
    if (!isHandScanSelectionActive()) return;

    const fromEffectFlow = Boolean(pendingHandScanAction?.fromEffectFlow || pendingActionEffectFlow);
    const currentPlayer = getCurrentPlayer();
    const index = Math.round(handIndex);
    const card = currentPlayer?.hand?.[index];
    if (!card) {
      rocketState.statusNote = "无效的手牌位置";
      renderStateReadout();
      return { ok: false, message: rocketState.statusNote };
    }

    const scanChoices = getPublicScanChoicesForCard(card);
    if (!scanChoices.ok) {
      rocketState.statusNote = scanChoices.message;
      renderStateReadout();
      return scanChoices;
    }

    pendingHandScanAction = null;
    syncHandScanSelectionChrome();
    rocketState.statusNote = `手牌扫描：${cards.getCardLabel(card)}，请选择${scanChoices.scanLabel}目标`;
    renderStateReadout();
    return openScanTargetPicker({
      type: "hand_scan",
      card,
      handIndex: index,
      player: currentPlayer,
      scanCode: scanChoices.scanCode,
      fromEffectFlow,
      title: "手牌扫描",
      subtitle: `${cards.getCardLabel(card)}：${scanChoices.scanLabel}，请选择 2 选 1 星云。确认后弃除这张手牌。`,
      choices: scanChoices.choices,
    });
  }

  function isActionEffectFlowActive() {
    return pendingActionEffectFlow != null;
  }

  function isInitialIncomeFlowActive() {
    return pendingActionEffectFlow?.actionType === "initialIncome";
  }

  function getGameplayLockReason() {
    if (isInitialSelectionActive()) return "请先完成初始选择";
    if (isInitialIncomeFlowActive()) return "请先完成初始收入增加";
    return null;
  }

  function lockAllActionButtons(reason) {
    setTurnActionButtonState(els.actionPassButton, false);
    setTurnActionButtonState(els.actionConfirmButton, false);
    setTurnActionButtonState(els.actionUndoButton, false);
    setActionButtonState(els.actionLaunchButton, false, reason);
    setActionButtonState(els.actionOrbitButton, false, reason);
    setActionButtonState(els.actionLandButton, false, reason);
    setActionButtonState(els.actionScanButton, false, reason);
    setActionButtonState(els.actionAnalyzeButton, false, reason);
    setActionButtonState(els.actionPlayCardButton, false, reason);
    setActionButtonState(els.actionResearchTechButton, false, reason);
    setQuickActionButtonEnabled(false, reason);
    updateQuickPanel();
    renderActionEffectBar();
  }

  function getEffectHistorySource() {
    return pendingActionEffectFlow?.historySource || HISTORY_SOURCE_MAIN;
  }

  function getHistoryForSource(source) {
    return source === HISTORY_SOURCE_QUICK ? quickActionHistory : actionHistory;
  }

  function getActiveEffectHistory() {
    if (effectStepActive) return getHistoryForSource(getEffectHistorySource());
    return actionHistory;
  }

  function ensureEffectHistorySession(source, actionType, label) {
    const history = getHistoryForSource(source);
    if (!history.hasSession()) {
      history.beginSession(source === HISTORY_SOURCE_QUICK ? "quick" : actionType, label || "效果");
    }
    return history;
  }

  function recordHistoryCommand(command) {
    const history = getActiveEffectHistory();
    if (!history.hasSession()) return;
    history.record(command);
  }

  function recordQuickHistoryCommand(command) {
    if (!quickActionHistory.hasSession()) return;
    quickActionHistory.record(command);
  }

  function recordAbilityCommands(result, history = actionHistory) {
    if (!result?.commands?.length) return;
    for (const command of result.commands) {
      if (history === quickActionHistory) {
        recordQuickHistoryCommand(command);
      } else {
        recordHistoryCommand(command);
      }
    }
  }

  function startPendingActionSession(actionType, label) {
    if (actionHistory.hasSession()) {
      actionHistory.rollbackSession();
      clearHistoryStepOrderForSource(HISTORY_SOURCE_MAIN);
      removeActionLogStepsBySource(HISTORY_SOURCE_MAIN);
      effectStepActive = false;
    }
    startActionLogDraft(actionType, label, { source: HISTORY_SOURCE_MAIN });
    actionHistory.beginSession(actionType, label);
    actionHistory.beginStep({ source: HISTORY_SOURCE_MAIN, type: "action", label });
    effectStepActive = true;
  }

  function beginQuickActionStep(actionType, label) {
    ensureActionLogDraft({
      source: HISTORY_SOURCE_QUICK,
      actionType: actionLogState.draft?.actionType || "quick",
      label: actionLogState.draft?.actionType ? actionLogState.draft.actionLabel : ACTION_LOG_DEFAULT_LABELS.quick,
    });
    if (!quickActionHistory.hasSession()) {
      quickActionHistory.beginSession("quick", "快速行动");
    }
    quickActionHistory.beginStep({ source: HISTORY_SOURCE_QUICK, type: actionType, label });
  }

  function completePendingActionStep() {
    endEffectHistoryStep();
    markActionPending();
  }

  function completeQuickActionStep(detail = null, options = {}) {
    const step = quickActionHistory.endStep();
    if (step) {
      if (options.irreversibleReason || options.undoable === false) {
        step.undoable = false;
        step.irreversibleCode = options.irreversibleCode || "irreversible_quick_action";
        step.irreversibleReason = options.irreversibleReason || "该快速行动产生不可撤销影响";
        markCurrentActionIrreversible(step.irreversibleReason, step.irreversibleCode);
      }
      rememberHistoryStep(HISTORY_SOURCE_QUICK, step.id);
      appendActionLogStep(
        HISTORY_SOURCE_QUICK,
        step.label,
        detail,
        actionLogOptionsFromHistoryStep(step),
      );
    }
  }

  function rememberHistoryStep(source, stepId = null) {
    historyStepOrder.push({ source, stepId });
  }

  function forgetLastHistoryStep(source, stepId = null) {
    for (let index = historyStepOrder.length - 1; index >= 0; index -= 1) {
      const entry = typeof historyStepOrder[index] === "string"
        ? { source: historyStepOrder[index], stepId: null }
        : historyStepOrder[index];
      if (entry.source === source && (!stepId || entry.stepId === stepId)) {
        historyStepOrder.splice(index, 1);
        return;
      }
    }
  }

  function clearHistoryStepOrderForSource(source) {
    for (let index = historyStepOrder.length - 1; index >= 0; index -= 1) {
      const entry = typeof historyStepOrder[index] === "string"
        ? { source: historyStepOrder[index], stepId: null }
        : historyStepOrder[index];
      if (entry.source === source) {
        historyStepOrder.splice(index, 1);
      }
    }
  }

  function getLatestUndoSource() {
    for (let index = historyStepOrder.length - 1; index >= 0; index -= 1) {
      const entry = typeof historyStepOrder[index] === "string"
        ? { source: historyStepOrder[index], stepId: null }
        : historyStepOrder[index];
      const source = entry.source;
      if (source === HISTORY_SOURCE_QUICK && quickActionHistory.hasSession()) {
        return quickActionHistory.hasUndoableStep() ? source : null;
      }
      if (source === HISTORY_SOURCE_MAIN && actionHistory.hasSession()) {
        return actionHistory.hasUndoableStep() ? source : null;
      }
    }
    if (quickActionHistory.hasUndoableStep()) return HISTORY_SOURCE_QUICK;
    if (actionHistory.hasUndoableStep()) return HISTORY_SOURCE_MAIN;
    return null;
  }

  function recordQuickTradeCompletion(tradeId, player, beforeState) {
    const trade = quickTrades.getTradeAction(tradeId);
    if (!trade || !beforeState) return;
    beginQuickActionStep("quick-trade", `快速交易：${trade.label}`);
    recordQuickHistoryCommand(historyCommands.createRestoreTradeStateCommand(player, cardState, beforeState));
    completeQuickActionStep();
  }

  function blockIncompatiblePendingQuickAction(actionType) {
    if (actionType !== "card-corner" && pendingCardCornerQuickAction) {
      cancelCardCornerQuickAction({ silent: true });
    }
    if (hasActivePendingSubFlow()) {
      rocketState.statusNote = pendingIndustryAbility || industryFreeMoveState || isIndustryHandSelectionActive()
        ? "请先完成或取消公司 1x 行动"
        : "请先完成或取消当前流程";
      renderStateReadout();
      return { ok: false, message: rocketState.statusNote };
    }
    return null;
  }

  function recordAtomicActionHistory(actionType, label, result) {
    startPendingActionSession(actionType, label);
    recordAbilityCommands(result);
    completePendingActionStep();
  }

  function startCardEffectFlow(chainId, label, effects, options = {}) {
    if (!effects?.length) return false;

    const normalizedEffects = cardEffects.consolidateCardMoveEffects?.(effects) || effects;
    pendingActionEffectFlow = abilities.chain.startAbilityChain(chainId, label, normalizedEffects);
    pendingActionEffectFlow.actionType = options.actionType || "playCard";
    pendingActionEffectFlow.playerId = getCurrentPlayer()?.id || null;
    pendingActionEffectFlow.card = options.card || null;
    pendingActionEffectFlow.cardTemporaryTasks = options.temporaryTasks || [];
    pendingActionEffectFlow.industryPlayedCard = options.industryPlayedCard || options.card || null;
    pendingActionEffectFlow.historySource = options.historySource || HISTORY_SOURCE_MAIN;
    pendingActionEffectFlow.consumesMainAction = options.consumesMainAction !== false;
    if (pendingActionEffectFlow.historySource === HISTORY_SOURCE_QUICK && !quickActionHistory.hasSession()) {
      quickActionHistory.beginSession("quick", "快速行动");
    }

    els.appWrap?.classList.toggle("action-effect-flow-active", true);
    rocketState.statusNote = `${label}：请依次点击效果`;
    activateNextActionEffect();
    return true;
  }

  function recordPlayCardStart(player, card, beforePlayer, beforeCardState, beforeAlienState = null) {
    startActionLogDraft("playCard", "打牌行动", { source: HISTORY_SOURCE_MAIN, player });
    actionHistory.beginSession("playCard", "打牌行动");
    actionHistory.beginStep({
      source: HISTORY_SOURCE_MAIN,
      type: "action_start",
      label: `打出：${cards.getCardLabel(card)}`,
      effectIndex: -1,
    });
    effectStepActive = true;
    recordHistoryCommand(historyCommands.createRestorePlayerCommand(
      player,
      beforePlayer,
      "恢复打牌前玩家状态",
    ));
    recordHistoryCommand(historyCommands.createRestorePublicCardsCommand(
      cardState,
      beforeCardState.publicCards,
      beforeCardState.discardPile,
    ));
    if (beforeAlienState) {
      recordHistoryCommand(historyCommands.createRestoreObjectCommand(
        alienGameState,
        beforeAlienState,
        "恢复打牌前外星人状态",
      ));
    }
    endEffectHistoryStep();
  }

  function buildCardTaskContext() {
    return {
      nebulaDataState,
      alienGameState,
      planetStatsState,
    };
  }

  function startTemporaryCardTaskRewardFlow(tasks, settlementResult) {
    const effects = cardEffects.collectTemporaryTaskRewards(tasks, settlementResult);
    if (!effects.length) return false;
    return startCardEffectFlow(
      "card-temporary-task-rewards",
      "卡牌临时任务奖励",
      effects,
      { actionType: "cardTask" },
    );
  }

  function getReadyCardTasks() {
    const currentPlayer = getCurrentPlayer();
    if (!currentPlayer) return [];
    cardTaskStateModule.refreshTaskState(
      cardTaskState,
      currentPlayer,
      buildCardTaskContext(),
      cardEffects,
    );
    return cardTaskStateModule.getReadyType2Tasks(cardTaskState);
  }

  function refreshCardTaskState(options = {}) {
    const currentPlayer = getCurrentPlayer();
    if (!currentPlayer) {
      cardTaskStateModule.refreshTaskState(cardTaskState, null, buildCardTaskContext(), cardEffects);
      return cardTaskState;
    }
    cardTaskStateModule.refreshTaskState(
      cardTaskState,
      currentPlayer,
      buildCardTaskContext(),
      cardEffects,
    );
    if (options.render !== false) {
      renderReservedCardsFromTaskState();
    }
    return cardTaskState;
  }

  function renderReservedCardsFromTaskState() {
    if (!els.reservedCardFan || !els.reservedCardPanel) return;

    const currentPlayer = getCurrentPlayer();
    const reservedCards = Array.isArray(currentPlayer?.reservedCards) ? currentPlayer.reservedCards : [];
    cardTaskStateModule.refreshTaskState(
      cardTaskState,
      currentPlayer,
      buildCardTaskContext(),
      cardEffects,
    );
    const readyByCardId = cardTaskState.readyType2ByCardId;
    const effectiveReadyByCardId = { ...(readyByCardId || {}) };
    for (const card of reservedCards) {
      const readyChongTask = getReadyChongTaskForReservedCard(card, currentPlayer);
      if (readyChongTask) effectiveReadyByCardId[card.id] = readyChongTask;
      const readyAmibaTask = getReadyAmibaTaskForReservedCard(card, currentPlayer);
      if (readyAmibaTask) effectiveReadyByCardId[card.id] = readyAmibaTask;
      const readyRunezuTask = getReadyRunezuTaskForReservedCard(card, currentPlayer);
      if (readyRunezuTask) effectiveReadyByCardId[card.id] = readyRunezuTask;
    }
    const title = els.reservedCardPanel.querySelector(".panel-title");
    if (title) {
      title.textContent = isInitialSelectionActive()
        ? `初始选择 · ${currentPlayer.colorLabel}玩家`
        : `保留牌区 · 完成任务 ${currentPlayer.completedTaskCount || 0}`;
    }
    els.reservedCardPanel.classList.toggle("is-initial-selection-active", isInitialSelectionActive());
    renderInitialSelectionArea();
    els.reservedCardPanel.classList.toggle(
      "is-empty",
      !isInitialSelectionActive()
        && reservedCards.length === 0
        && !(jiuzhe?.getPlayerJiuzheCards?.(alienGameState, currentPlayer)?.length)
        && !(fangzhou?.getPlayerCard2Reserved?.(alienGameState, currentPlayer)?.length)
        && getCurrentInitialSelectionCards(currentPlayer).length === 0,
    );

    if (isInitialSelectionActive()) {
      els.reservedCardFan.replaceChildren();
      return;
    }

    const taskCards = [];
    const finalTaskCards = [];
    const banrenmaCards = [];
    reservedCards.forEach((card, index) => {
      const entry = { card, index };
      if (banrenma?.isBanrenmaCard?.(card)) {
        banrenmaCards.push(entry);
      } else if (getCardTypeCode(card) === 3) {
        finalTaskCards.push(entry);
      } else {
        taskCards.push(entry);
      }
    });

    const taskRow = createReservedCardRow("task", "1、2型任务牌");
    taskRow.replaceChildren(...taskCards.map((entry, rowIndex) => (
      createReservedCardButton(entry.card, entry.index, rowIndex, effectiveReadyByCardId)
    )));

    const jiuzheButton = createJiuzheReservedButton(currentPlayer);
    const fangzhouCards = createFangzhouReservedButtons(currentPlayer);
    const banrenmaButtons = banrenmaCards.map((entry, rowIndex) => (
      createBanrenmaReservedButton(entry.card, entry.index, rowIndex + (jiuzheButton ? 1 : 0) + fangzhouCards.length)
    ));
    const finalRow = createReservedCardRow("final", "3型终局计分牌与九折/方舟/半人马牌");
    finalRow.replaceChildren(
      ...(jiuzheButton ? [jiuzheButton] : []),
      ...fangzhouCards,
      ...banrenmaButtons,
      ...finalTaskCards.map((entry, rowIndex) => (
      createReservedCardButton(
        entry.card,
        entry.index,
        rowIndex + (jiuzheButton ? 1 : 0) + fangzhouCards.length + banrenmaButtons.length,
        effectiveReadyByCardId,
      )
      )),
    );

    els.reservedCardFan.replaceChildren(taskRow, finalRow);
    layoutReservedCardRows();
  }

  function applyType1TriggerMatches(events) {
    const currentPlayer = getCurrentPlayer();
    if (!currentPlayer || !events?.length) return null;
    if (pendingCardTriggerAction || pendingCardTriggerFreeMove || pendingCardCornerFreeMove) return null;

    const matches = cardTaskStateModule.collectType1TriggerMatches(currentPlayer, events, cardEffects);
    if (!matches.length) return null;
    return matches.length === 1 ? applyCardTriggerMatch(matches[0]) : openCardTriggerPicker(matches);
  }

  function buildAlienTraceEvent(alienSlotId, traceType, player, alienIdOverride = null) {
    const slot = aliens.getAlienSlot(alienGameState, Number(alienSlotId));
    return {
      type: "alienTrace",
      alienSlotId: Number(alienSlotId),
      alienId: alienIdOverride || slot?.alienId || slot?.assignedAlienId || null,
      traceType,
      playerId: player?.id || null,
      playerColor: player?.color || null,
      source: "alien_trace",
    };
  }

  function processChongTransportArrivalEvents(events = []) {
    if (!chong || !events?.length) return [];
    const delivered = [];
    for (const event of events) {
      if (event?.type !== "visitPlanet") continue;
      if ((event.tokenKind || "") !== rocketActions.ROCKET_KIND.CHONG_FOSSIL) continue;
      const task = chong.getTransportTaskForRocket(alienGameState, event.rocketId);
      if (!task || task.destinationPlanetId !== event.planetId) continue;
      const beforeAlienState = structuredClone(alienGameState);
      const beforeRocketState = structuredClone(rocketState);
      const result = chong.markTransportedFossilDelivered(alienGameState, event.rocketId, event.planetId);
      if (!result.ok) continue;
      if (result.alreadyDelivered) continue;
      const rocket = rocketState.rockets.find((item) => item.id === event.rocketId);
      if (rocket) {
        rocket.movementLocked = true;
        rocket.chongDelivered = true;
        if (rocket.cargo) rocket.cargo.delivered = true;
      }
      const alienRestore = historyCommands.createRestoreObjectCommand(
        alienGameState,
        beforeAlienState,
        "恢复虫族化石送达前外星人状态",
      );
      const rocketRestore = historyCommands.createRestoreRocketStateCommand(
        rocketState,
        beforeRocketState,
        "恢复虫族化石送达前棋子状态",
      );
      if (quickActionHistory.hasSession() && !actionHistory.hasSession()) {
        recordQuickHistoryCommand(alienRestore);
        recordQuickHistoryCommand(rocketRestore);
      } else {
        recordHistoryCommand(alienRestore);
        recordHistoryCommand(rocketRestore);
      }
      delivered.push({ event, result, message: result.message });
    }
    if (delivered.length) {
      rocketState.statusNote = delivered.map((item) => item.message).join("；");
      renderAlienPanels();
      renderRockets();
      renderPlayerStats();
      renderPlayerHand();
      renderReservedCardsFromTaskState();
      renderStateReadout();
    }
    return delivered;
  }

  function processRunezuTaskEvents(events = []) {
    if (!runezu || !events?.length) return [];
    const currentPlayer = getCurrentPlayer();
    if (!currentPlayer?.reservedCards?.length) return [];
    const normalizedEvents = [...events];
    if (events.some((event) => event?.type === "signalMarked")) {
      normalizedEvents.push({ type: "scan" });
    }
    const results = [];
    for (const card of [...currentPlayer.reservedCards]) {
      if (!runezu.isRunezuCard?.(card)) continue;
      const beforePlayer = structuredClone(currentPlayer);
      const result = runezu.consumeTaskEvents?.(card, normalizedEvents);
      if (!result?.ok || !result.effects?.length) continue;
      if (result.completed) {
        removeReservedCardToDiscard(currentPlayer, card);
        incrementCompletedTaskCount(currentPlayer);
      }
      if (actionHistory.hasSession()) {
        recordHistoryCommand(historyCommands.createRestorePlayerCommand(
          currentPlayer,
          beforePlayer,
          "恢复符文族任务进度前玩家状态",
        ));
      } else {
        beginQuickActionStep("runezu-task-progress", `符文族任务：${cards.getCardLabel(card)}`);
        recordQuickHistoryCommand(historyCommands.createRestorePlayerCommand(
          currentPlayer,
          beforePlayer,
          "恢复符文族任务进度前玩家状态",
        ));
        completeQuickActionStep();
      }
      results.push(result);
      if (pendingActionEffectFlow) {
        insertActionEffectsAfterCurrent(result.effects);
      } else {
        startCardEffectFlow(
          "runezu-task-rewards",
          `符文族任务：${cards.getCardLabel(card)}`,
          result.effects,
          {
            actionType: "cardTask",
            historySource: HISTORY_SOURCE_QUICK,
            consumesMainAction: false,
          },
        );
      }
      break;
    }
    if (results.length) {
      renderReservedCardsFromTaskState();
      renderPlayerStats();
      renderStateReadout();
    }
    return results;
  }

  function settleCardTasksAfterEffect(options = {}) {
    const { events, skipType1 = false, render = true } = options;
    const chongCompletions = processChongTransportArrivalEvents(events || []);
    const runezuCompletions = processRunezuTaskEvents(events || []);
    refreshCardTaskState({ render });
    const type1Result = skipType1 || !events?.length ? null : applyType1TriggerMatches(events);
    return {
      chongCompletions,
      runezuCompletions,
      type1Result,
    };
  }

  function getReadyTaskForReservedCard(card) {
    refreshCardTaskState({ render: false });
    const readyAmibaTask = getReadyAmibaTaskForReservedCard(card, getCurrentPlayer());
    if (readyAmibaTask) return readyAmibaTask;
    const readyRunezuTask = getReadyRunezuTaskForReservedCard(card, getCurrentPlayer());
    if (readyRunezuTask) return readyRunezuTask;
    return cardTaskStateModule.getReadyType2ForCard(cardTaskState, card?.id) || null;
  }

  function getReadyChongTaskForReservedCard(card, player = getCurrentPlayer()) {
    if (!chong?.isChongCard?.(card)) return null;
    if (card?.chongTaskCompleted) return null;
    const task = card.chongTask || chong.getCardTask(card);
    if (!task) return null;
    if (task.kind === "transport") {
      const deliveredTransport = chong.getDeliveredTransportForCard(alienGameState, card.id);
      if (!deliveredTransport) return null;
      return {
        chongTask: true,
        card,
        task,
        deliveredTransport,
        effects: [],
      };
    }
    if (task.kind !== "trace") return null;
    if (!chong.isTraceTaskReady(alienGameState, player, task)) return null;
    return {
      chongTask: true,
      card,
      task,
      effects: [],
    };
  }

  function getReadyAmibaTaskForReservedCard(card, player = getCurrentPlayer()) {
    if (!amiba?.isAmibaCard?.(card)) return null;
    if (card?.amibaTaskCompleted) return null;
    const task = card.amibaTask || amiba.getCardTask(card);
    if (!task || task.kind !== "three-traces-empty-slots") return null;
    if (!amiba.isTheoryTaskReady(alienGameState, player)) return null;
    const reward = amiba.getTheoryTaskReward(alienGameState);
    return {
      amibaTask: true,
      card,
      task,
      effects: reward.effects || [],
      emptyCount: reward.emptyCount || 0,
    };
  }

  function getReadyRunezuTaskForReservedCard(card, player = getCurrentPlayer()) {
    if (!runezu?.isRunezuCard?.(card)) return null;
    return runezu.getReadyThreeTraceTask?.(card, alienGameState, player) || null;
  }

  function incrementCompletedTaskCount(player) {
    if (!player) return 0;
    player.completedTaskCount = Math.max(0, Math.round(Number(player.completedTaskCount) || 0)) + 1;
    return player.completedTaskCount;
  }

  function removeReservedCardToDiscard(player, card) {
    const index = player?.reservedCards?.findIndex((item) => item.id === card?.id) ?? -1;
    if (index < 0) return false;
    const [finishedCard] = player.reservedCards.splice(index, 1);
    cards.addToDiscardPile(cardState, finishedCard);
    return true;
  }

  function discardReservedCardIfFinished(player, card) {
    if (!cardEffects.areAllTriggersConsumed(card)) return false;
    if (!removeReservedCardToDiscard(player, card)) return false;
    incrementCompletedTaskCount(player);
    return true;
  }

  function openCardTaskCompletionPicker(card) {
    const ready = getReadyTaskForReservedCard(card);
    if (!ready) return { ok: false, message: "这张任务卡尚未满足完成条件" };
    if (!els.scanTargetOverlay || !els.scanTargetActions) return { ok: false, message: "无法打开任务确认窗口" };

    pendingCardTaskCompletion = { ready };
    if (els.scanTargetTitle) els.scanTargetTitle.textContent = "完成任务";
    if (els.scanTargetSubtitle) {
      els.scanTargetSubtitle.textContent = `${cards.getCardLabel(ready.card)} 已满足条件，确认后结算奖励并移除。`;
    }
    if (els.scanTargetCancel) els.scanTargetCancel.hidden = false;
    const confirmButton = document.createElement("button");
    confirmButton.type = "button";
    confirmButton.className = "scan-target-option-button";
    confirmButton.dataset.cardTaskComplete = "confirm";
    confirmButton.innerHTML = `确认完成任务<small>${ready.effects.map((item) => item.label).join("；")}</small>`;
    els.scanTargetActions.replaceChildren(confirmButton);
    els.scanTargetOverlay.hidden = false;
    rocketState.statusNote = "任务已满足：点击确认完成任务";
    renderStateReadout();
    return { ok: true, awaitingChoice: true, message: rocketState.statusNote };
  }

  function closeCardTaskCompletionPicker() {
    pendingCardTaskCompletion = null;
    if (els.scanTargetOverlay) els.scanTargetOverlay.hidden = true;
  }

  function confirmCardTaskCompletion() {
    const pending = pendingCardTaskCompletion;
    if (!pending?.ready) return { ok: false, message: "没有待完成的任务" };
    const currentPlayer = getCurrentPlayer();
    const ready = pending.ready;
    closeCardTaskCompletionPicker();

    const beforePlayer = structuredClone(currentPlayer);
    const beforeCardState = {
      publicCards: cardState.publicCards.slice(),
      discardPile: (cardState.discardPile || []).slice(),
    };
    if (ready.runezuTask) {
      runezu?.completeRunezuTask?.(ready.card);
    } else {
      cardEffects.completeTask(ready.card, ready.task.id);
    }
    removeReservedCardToDiscard(currentPlayer, ready.card);
    incrementCompletedTaskCount(currentPlayer);

    beginQuickActionStep("card-task", `完成任务：${cards.getCardLabel(ready.card)}`);
    recordQuickHistoryCommand(historyCommands.createRestorePlayerCommand(
      currentPlayer,
      beforePlayer,
      "恢复卡牌任务结算前玩家状态",
    ));
    recordQuickHistoryCommand(historyCommands.createRestorePublicCardsCommand(
      cardState,
      beforeCardState.publicCards,
      beforeCardState.discardPile,
    ));
    completeQuickActionStep();

    renderPlayerStats();
    renderPublicCards();
    updateActionButtons();
    renderStateReadout();
    return startCardEffectFlow(
      "card-task-rewards",
      "卡牌任务奖励",
      ready.effects,
      {
        actionType: "cardTask",
        historySource: HISTORY_SOURCE_QUICK,
        consumesMainAction: false,
      },
    );
  }

  function openCardTriggerPicker(matches) {
    if (!matches?.length) return { ok: false, message: "没有可触发的卡牌" };
    if (!els.scanTargetOverlay || !els.scanTargetActions) return { ok: false, message: "无法打开卡牌触发选择" };

    pendingCardTriggerAction = { matches };
    if (els.scanTargetTitle) els.scanTargetTitle.textContent = "卡牌触发";
    if (els.scanTargetSubtitle) els.scanTargetSubtitle.textContent = "选择 1 个满足条件的触发效果结算。";
    if (els.scanTargetCancel) els.scanTargetCancel.hidden = false;
    els.scanTargetActions.replaceChildren(...matches.map((match, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "scan-target-option-button";
      button.dataset.cardTriggerChoice = String(index);
      button.innerHTML = `${match.effect.label}<small>${cards.getCardLabel(match.card)}</small>`;
      return button;
    }));
    els.scanTargetOverlay.hidden = false;
    rocketState.statusNote = "卡牌触发：请选择一个效果";
    renderStateReadout();
    return { ok: true, awaitingChoice: true, message: rocketState.statusNote };
  }

  function closeCardTriggerPicker() {
    pendingCardTriggerAction = null;
    if (els.scanTargetOverlay) els.scanTargetOverlay.hidden = true;
  }

  function applyCardTriggerReward(match) {
    const currentPlayer = getCurrentPlayer();
    if (!currentPlayer || !match?.card || !match.trigger) return { ok: false, message: "没有可结算的卡牌触发" };

    const beforePlayer = structuredClone(currentPlayer);
    const beforeCardState = {
      publicCards: cardState.publicCards.slice(),
      discardPile: (cardState.discardPile || []).slice(),
    };
    beginQuickActionStep("card-trigger", `卡牌触发：${match.effect.label}`);
    const effect = match.effect;
    let result = null;

    if (effect.type === "gain_resources") {
      players.gainResources(currentPlayer, effect.options?.gain || {});
      result = { ok: true, message: effect.label };
    } else if (effect.type === "gain_data") {
      const count = Math.max(0, Math.round(effect.options?.count || 0));
      const results = [];
      for (let index = 0; index < count; index += 1) {
        results.push(data.gainData(currentPlayer, { source: "card_trigger" }));
      }
      result = { ok: true, message: `${effect.label}：获得 ${results.filter((item) => item.ok).length}/${count} 数据` };
    } else {
      result = { ok: false, message: `暂不支持的卡牌触发效果：${effect.type}` };
    }

    if (result.ok) {
      cardEffects.consumeTrigger(match.card, match.trigger.id);
      discardReservedCardIfFinished(currentPlayer, match.card);
      recordQuickHistoryCommand(historyCommands.createRestorePlayerCommand(
        currentPlayer,
        beforePlayer,
        "恢复卡牌触发前玩家状态",
      ));
      recordQuickHistoryCommand(historyCommands.createRestorePublicCardsCommand(
        cardState,
        beforeCardState.publicCards,
        beforeCardState.discardPile,
      ));
      completeQuickActionStep();
      rocketState.statusNote = result.message;
    } else {
      quickActionHistory.undoLastStep();
      rocketState.statusNote = result.message;
    }

    renderPlayerStats();
    renderPublicCards();
    renderPlayerHand();
    updateActionButtons();
    renderStateReadout();
    return result;
  }

  function beginCardTriggerFreeMove(match) {
    const currentPlayer = getCurrentPlayer();
    const rocketsForPlayer = getMovableTokensForPlayer(currentPlayer?.id);
    if (!rocketsForPlayer.length) {
      return { ok: false, message: "没有可移动的飞船" };
    }
    pendingCardTriggerFreeMove = {
      match,
      beforePlayer: structuredClone(currentPlayer),
      beforeCardState: {
        publicCards: cardState.publicCards.slice(),
        discardPile: (cardState.discardPile || []).slice(),
      },
    };
    rocketState.statusNote = rocketsForPlayer.length > 1
      ? "卡牌触发：请点击要免费移动的飞船"
      : "卡牌触发：使用方向键免费移动飞船";
    if (rocketsForPlayer.length === 1) {
      activateMoveMode(rocketsForPlayer[0].id);
    } else {
      selectDefaultRocketForCurrentPlayer();
    }
    renderStateReadout();
    return { ok: true, message: rocketState.statusNote };
  }

  function applyCardTriggerMatch(match) {
    if (match?.effect?.type === amiba?.EFFECT_TYPES?.CHOOSE_SYMBOL_REWARD) {
      closeCardTriggerPicker();
      return openAmibaSymbolChoiceDialog({
        region: match.effect.options?.region,
        player: getCurrentPlayer(),
        triggerMatch: match,
        effectLabel: match.effect.label,
        beforeAlienState: structuredClone(alienGameState),
        beforePlayerState: structuredClone(playerState),
        beforeCardState: structuredClone(cardState),
      });
    }
    if (match?.effect?.type === "pick_card") {
      closeCardTriggerPicker();
      return beginCardSelection({
        type: "card_trigger_pick",
        player: getCurrentPlayer(),
        allowBlindDraw: true,
        triggerMatch: match,
      });
    }
    if (match?.effect?.type === cardEffects.EFFECT_TYPES.FREE_MOVE) {
      return beginCardTriggerFreeMove(match);
    }
    return applyCardTriggerReward(match);
  }

  function handleCardTriggerChoice(choiceIndex) {
    const matches = pendingCardTriggerAction?.matches || [];
    const match = matches[Number(choiceIndex)];
    closeCardTriggerPicker();
    if (!match) return { ok: false, message: "无效的卡牌触发选择" };
    return applyCardTriggerMatch(match);
  }

  function executeFreeMoveForCardTrigger(deltaX, deltaY, rocketId) {
    const pending = pendingCardTriggerFreeMove;
    if (!pending) return { ok: false, message: "没有待结算的卡牌免费移动" };

    const moveCheck = rocketActions.canMoveRocket(rocketState, rocketId, deltaX, deltaY);
    if (!moveCheck.ok) {
      rocketState.statusNote = moveCheck.message;
      renderStateReadout();
      return moveCheck;
    }

    const result = abilities.executeAbility("moveProbe", createActionContext(), {
      cost: {},
      movementPoints: pending.match.effect.options?.movementPoints || 1,
      rocketId,
      deltaX,
      deltaY,
      historyLabel: "卡牌触发：免费移动",
    });
    if (result.rocket) renderRocketElement(result.rocket);
    if (!result.ok) {
      rocketState.statusNote = result.message;
      renderStateReadout();
      return result;
    }

    beginQuickActionStep("card-trigger-move", `卡牌触发：${pending.match.effect.label}`);
    recordQuickHistoryCommand(historyCommands.createRestorePlayerCommand(
      getCurrentPlayer(),
      pending.beforePlayer,
      "恢复卡牌触发前玩家状态",
    ));
    recordQuickHistoryCommand(historyCommands.createRestorePublicCardsCommand(
      cardState,
      pending.beforeCardState.publicCards,
      pending.beforeCardState.discardPile,
    ));
    recordAbilityCommands(result, quickActionHistory);
    cardEffects.consumeTrigger(pending.match.card, pending.match.trigger.id);
    discardReservedCardIfFinished(getCurrentPlayer(), pending.match.card);
    completeQuickActionStep();

    pendingCardTriggerFreeMove = null;
    rocketState.activeRocketId = null;
    clearMoveRocketHighlight();
    deactivateMoveMode();
    rocketState.statusNote = `卡牌触发：${result.message}`;
    renderPlayerStats();
    renderPublicCards();
    renderPlayerHand();
    updateActionButtons();
    renderStateReadout();
    settleCardTasksAfterEffect({ events: result.events, render: false });
    return result;
  }

  function executeFreeMoveForCardCorner(deltaX, deltaY, rocketId) {
    const pending = pendingCardCornerFreeMove;
    if (!pending) return { ok: false, message: "没有待结算的弃牌移动" };

    const moveCheck = rocketActions.canMoveRocket(rocketState, rocketId, deltaX, deltaY);
    if (!moveCheck.ok) {
      rocketState.statusNote = moveCheck.message;
      renderStateReadout();
      return moveCheck;
    }

    const result = abilities.executeAbility("moveProbe", createActionContext(), {
      cost: {},
      movementPoints: pending.action.moveReward?.movementPoints || pending.action.movementPoints || 1,
      rocketId,
      deltaX,
      deltaY,
      source: "card_corner",
      historyLabel: `卡牌快速行动：${pending.action.label}`,
    });
    if (result.rocket) renderRocketElement(result.rocket);
    if (!result.ok) {
      rocketState.statusNote = result.message;
      renderStateReadout();
      return result;
    }

    beginQuickActionStep("card-corner-move", `卡牌快速行动：${pending.action.label}`);
    recordAbilityCommands(result, quickActionHistory);
    completeQuickActionStep();

    pendingCardCornerFreeMove = null;
    rocketState.activeRocketId = null;
    clearMoveRocketHighlight();
    deactivateMoveMode();
    rocketState.statusNote = `卡牌快速行动：${pending.discardedCardLabel} ${pending.action.label}，${result.message}`;
    const finishIndustryAfterMove = Boolean(pending.finishIndustryFlowAfterMove);
    const industryFinishMessage = pending.afterMoveStatus || rocketState.statusNote;
    settleCardTasksAfterEffect({ events: result.events, render: false });
    if (finishIndustryAfterMove) {
      finishIndustryAbilityFlow(industryFinishMessage);
      if (pending.irreversibleIndustryFlow) {
        commitIrreversibleIndustryQuickAction(pending.industryLogLabel || pending.action.label, industryFinishMessage);
      }
      return result;
    }
    renderPlayerStats();
    renderRockets();
    renderPlayerHand();
    updateActionButtons();
    renderStateReadout();
    return result;
  }

  function startPlanetRewardEffectFlow(actionType, result) {
    const rewardEffects = planetRewards?.buildRewardEffectsForAction?.(actionType, result) || [];
    if (!rewardEffects.length) return false;

    const actionLabel = actionType === "orbit" ? "环绕" : "登陆";
    startActionLogDraft(actionType, `${actionLabel}行动`, { source: HISTORY_SOURCE_MAIN });
    actionHistory.beginSession(actionType, `${actionLabel}行动`);
    actionHistory.beginStep({
      source: HISTORY_SOURCE_MAIN,
      type: "action_start",
      label: result.message || `${actionLabel}标记`,
      effectIndex: -1,
    });
    effectStepActive = true;
    recordAbilityCommands(result);
    const runezuClaim = claimRunezuSourceSymbolWithHistory(
      "planet",
      result.planetId,
      getCurrentPlayer(),
      `${actionLabel}获得符文族symbol`,
    );
    if (runezuClaim?.ok) {
      result.message = `${result.message}；${runezuClaim.message}`;
    }
    endEffectHistoryStep();

    pendingActionEffectFlow = abilities.chain.startAbilityChain(
      `${actionType}-rewards`,
      `${actionLabel}奖励`,
      rewardEffects,
    );
    pendingActionEffectFlow.actionType = actionType;
    pendingActionEffectFlow.playerId = getCurrentPlayer()?.id || null;

    els.appWrap?.classList.toggle("action-effect-flow-active", true);
    rocketState.statusNote = `${actionLabel}：请依次点击奖励效果`;
    activateNextActionEffect();
    return true;
  }

  function startResearchTechEffectFlow(result) {
    if (!result?.ok || !result.awaitingTileSelection) return false;

    startActionLogDraft("researchTech", "科技行动", { source: HISTORY_SOURCE_MAIN });
    actionHistory.beginSession("researchTech", "科技行动");
    pendingActionEffectFlow = abilities.chain.startAbilityChain(
      "researchTech",
      "科技行动",
      [{
        id: "research-tech-select",
        type: "research_tech_select",
        abilityId: "researchTechSelect",
        icon: "research_tech",
        label: "选择科技片",
        status: "pending",
        undoable: true,
      }],
    );
    pendingActionEffectFlow.actionType = "researchTech";
    pendingActionEffectFlow.playerId = getCurrentPlayer()?.id || null;

    els.appWrap?.classList.toggle("action-effect-flow-active", true);
    rocketState.statusNote = "科技：请选择要研究的科技片";
    activateNextActionEffect();
    return true;
  }

  function isIncomeDiscardActionType(type) {
    return type === "income"
      || type === "planet_reward_income"
      || type === "place_data_income"
      || type === "initial_income"
      || type === "industry_helios_income";
  }

  function getPlaceDataSlotBonuses(placeResult) {
    if (placeResult?.slotBonuses?.length) return placeResult.slotBonuses;
    return placeResult?.slotBonus ? [placeResult.slotBonus] : [];
  }

  function applyAutomaticPlaceDataBonus(player, bonus) {
    const beforePlayer = structuredClone(player);
    if (bonus.type === "publicity") {
      players.gainResources(player, { publicity: bonus.publicity });
      recordQuickHistoryCommand(historyCommands.createRestorePlayerCommand(
        player,
        beforePlayer,
        "恢复放置数据宣传奖励",
      ));
      return { ok: true, message: `获得 ${bonus.publicity} 宣传` };
    }
    if (bonus.type === "score") {
      players.gainResources(player, { score: bonus.score });
      recordQuickHistoryCommand(historyCommands.createRestorePlayerCommand(
        player,
        beforePlayer,
        "恢复放置数据分数奖励",
      ));
      return { ok: true, message: `获得 ${bonus.score} 分` };
    }
    if (bonus.type === "credits") {
      players.gainResources(player, { credits: bonus.credits });
      recordQuickHistoryCommand(historyCommands.createRestorePlayerCommand(
        player,
        beforePlayer,
        "恢复放置数据信用点奖励",
      ));
      return { ok: true, message: `获得 ${bonus.credits} 信用点` };
    }
    if (bonus.type === "energy") {
      players.gainResources(player, { energy: bonus.energy });
      recordQuickHistoryCommand(historyCommands.createRestorePlayerCommand(
        player,
        beforePlayer,
        "恢复放置数据能量奖励",
      ));
      return { ok: true, message: `获得 ${bonus.energy} 能量` };
    }
    return { ok: true, message: null };
  }

  function applyPendingPlaceDataBonus(player, bonus) {
    if (bonus.type === "income") {
      const incomeStart = beginDiscardSelection(1, {
        type: "place_data_income",
        player,
        beforePlayerState: structuredClone(player),
        beforeCardState: structuredClone(cardState),
        effectLabel: "放置数据：收入奖励",
      });
      if (!incomeStart.ok) {
        completeQuickActionStep();
        return { ok: false, pendingIncome: false, message: incomeStart.message };
      }
      return { ok: true, pendingIncome: true };
    }

    if (bonus.type === "choose_card") {
      const selectionStart = beginCardSelection({
        type: "place_data_choose_card",
        player,
        beforePlayerState: structuredClone(player),
        beforeCardState: structuredClone(cardState),
      });
      if (!selectionStart.ok) {
        completeQuickActionStep();
        return { ok: false, pendingIncome: false, message: selectionStart.message };
      }
      return { ok: true, pendingIncome: false, pendingCardSelection: true };
    }

    return { ok: true, pendingIncome: false };
  }

  function applyPlaceDataSlotBonus(player, placeResult) {
    const bonuses = getPlaceDataSlotBonuses(placeResult);
    if (!bonuses.length) {
      completeQuickActionStep();
      return { ok: true, pendingIncome: false };
    }

    const autoMessages = [];
    for (const bonus of bonuses) {
      if (bonus.type === "income" || bonus.type === "choose_card") {
        const pendingResult = applyPendingPlaceDataBonus(player, bonus);
        if (pendingResult.message && !pendingResult.pendingIncome && !pendingResult.pendingCardSelection) {
          return pendingResult;
        }
        if (pendingResult.pendingIncome || pendingResult.pendingCardSelection) {
          return pendingResult;
        }
        continue;
      }

      const autoResult = applyAutomaticPlaceDataBonus(player, bonus);
      if (autoResult.message) autoMessages.push(autoResult.message);
    }

    completeQuickActionStep();
    return {
      ok: true,
      pendingIncome: false,
      message: autoMessages.length ? autoMessages.join("；") : null,
    };
  }

  function recordPlaceDataActionHistory(player, placeResult) {
    beginQuickActionStep("place-data", "放置数据");
    recordAbilityCommands(placeResult, quickActionHistory);
    return applyPlaceDataSlotBonus(player, placeResult);
  }

  function recordMoveActionHistory(moveResult, paymentCommand = null) {
    beginQuickActionStep("move", "移动");
    if (paymentCommand) {
      recordQuickHistoryCommand(paymentCommand);
    }
    recordAbilityCommands(moveResult, quickActionHistory);
    completeQuickActionStep();
  }

  function beginEffectHistoryStep(label, meta = {}) {
    const source = meta.source || getEffectHistorySource();
    const history = ensureEffectHistorySession(
      source,
      pendingActionEffectFlow?.actionType || "effect",
      pendingActionEffectFlow?.label || label || "效果",
    );
    if (!history.hasSession() || effectStepActive) return;
    const current = getCurrentActionEffect();
    history.beginStep({
      source,
      type: "effect",
      label: label || current?.label || "效果",
      effectIndex: meta.effectIndex ?? pendingActionEffectFlow?.currentIndex ?? null,
      effectType: meta.effectType ?? current?.type ?? null,
      ...meta,
    });
    effectStepActive = true;
  }

  function endEffectHistoryStep() {
    if (!effectStepActive) return null;
    const currentEffect = getCurrentActionEffect();
    const source = getEffectHistorySource();
    const history = getHistoryForSource(source);
    const step = history.endStep();
    if (step) {
      const irreversibleReason = getIrreversibleReason(
        currentEffect?.result,
        currentEffect?.label || step.label,
      ) || (currentEffect?.undoable === false ? (currentEffect?.label || step.label) : null);
      if (irreversibleReason) {
        step.undoable = false;
        step.irreversibleCode = currentEffect?.result?.irreversible?.code || "irreversible_effect";
        step.irreversibleReason = irreversibleReason;
        markCurrentActionIrreversible(irreversibleReason, step.irreversibleCode);
      }
      rememberHistoryStep(source, step.id);
      appendActionLogStep(
        source,
        step.label,
        currentEffect?.result?.message || null,
        actionLogOptionsFromHistoryStep(step),
      );
    }
    effectStepActive = false;
    return step;
  }

  function recordIrreversibleEffectStep(effect, reason, code = "irreversible_effect") {
    const source = getEffectHistorySource();
    const history = ensureEffectHistorySession(
      source,
      pendingActionEffectFlow?.actionType || "effect",
      pendingActionEffectFlow?.label || effect?.label || "效果",
    );
    if (!history.hasSession()) {
      markCurrentActionIrreversible(reason, code);
      return null;
    }
    history.beginStep({
      source,
      type: "irreversible",
      label: effect?.label || "不可撤销效果",
      effectIndex: pendingActionEffectFlow?.currentIndex ?? null,
      effectType: effect?.type || null,
      undoable: false,
      irreversibleCode: code,
      irreversibleReason: reason || "该步骤产生不可撤销影响",
    });
    const step = history.endStep();
    if (step) {
      rememberHistoryStep(source, step.id);
      appendActionLogStep(
        source,
        step.label,
        effect?.result?.message || reason,
        actionLogOptionsFromHistoryStep(step),
      );
    }
    markCurrentActionIrreversible(reason, code);
    return step;
  }

  function refreshAfterHistoryChange(message) {
    renderSectorNebulaDataBoard();
    renderRockets();
    syncPlanetOrbitLandMarkers();
    renderPublicCards();
    updatePublicCardControls();
    renderPlayerStats();
    renderReservedCards();
    renderInitialSelectionArea();
    updateActionButtons();
    renderActionEffectBar();
    syncInteractionFocusChrome();
    if (message) rocketState.statusNote = message;
    renderStateReadout();
  }

  function revertEffectFlowAfterUndo(step) {
    if (!pendingActionEffectFlow || !step) return;

    if (step.type === "action_start" || step.effectIndex === -1) {
      clearActionEffectFlow();
      return;
    }

    if (!Number.isInteger(step.effectIndex)) return;

    const { effects } = pendingActionEffectFlow;
    const effect = effects[step.effectIndex];
    if (!effect) return;

    effect.status = "active";
    pendingActionEffectFlow.currentIndex = step.effectIndex;
    for (let index = step.effectIndex + 1; index < effects.length; index += 1) {
      if (effects[index].status !== "pending") {
        effects[index].status = "pending";
      }
    }
    cancelActiveEffectSubFlows();
    els.appWrap?.classList.toggle("action-effect-flow-active", true);
  }

  function hasActiveEffectSubFlow() {
    return Boolean(
      pendingScanTargetAction
      || pendingPublicScanQueue
      || pendingHandScanAction
      || (isCardSelectionActive() && pendingActionEffectFlow)
      || pendingCardTriggerAction
      || pendingCardTaskCompletion
      || pendingChongTaskCompletion
      || pendingAmibaCardGain
      || pendingAmibaSymbolChoice
      || pendingAmibaTraceRemoval
      || pendingAomomoCardGain
      || pendingRunezuCardGain
      || pendingRunezuSymbolBranch
      || pendingRunezuFaceSymbolPlacement
      || pendingCardTriggerFreeMove
      || pendingCardCornerFreeMove
      || (els.scanAction4Overlay && !els.scanAction4Overlay.hidden)
      || (els.landTargetOverlay && !els.landTargetOverlay.hidden)
      || (els.alienTraceOverlay && !els.alienTraceOverlay.hidden)
      || pendingActionEffectFlow?.cardMoveEffect
      || pendingActionEffectFlow?.freeMoveMode,
    );
  }

  function hasActivePendingSubFlow() {
    return hasActiveEffectSubFlow()
      || isMovePaymentSelectionActive()
      || (els.dataPlaceOverlay && !els.dataPlaceOverlay.hidden)
      || Boolean(pendingIndustryAbility)
      || Boolean(industryFreeMoveState)
      || isIndustryHandSelectionActive();
  }

  function cancelActivePendingSubFlows() {
    if (hasActiveEffectSubFlow()) {
      cancelActiveEffectSubFlows();
      return true;
    }
    if (isMovePaymentSelectionActive()) {
      cancelMovePaymentSelection();
      return true;
    }
    if (els.dataPlaceOverlay && !els.dataPlaceOverlay.hidden) {
      closeDataPlacePicker();
      rocketState.statusNote = "已取消放置数据";
      return true;
    }
    if (pendingIndustryAbility || industryFreeMoveState || isIndustryHandSelectionActive()) {
      cancelIndustryAbilityFlow();
      rocketState.statusNote = "已取消公司 1x 行动";
      return true;
    }
    return false;
  }

  function getCurrentActionEffect() {
    return abilities.chain.getCurrentChainNode(pendingActionEffectFlow);
  }

  function getActionEffectIconSrc(iconId) {
    return scanEffects.EFFECT_ICONS[iconId]
      || planetRewards?.EFFECT_ICONS?.[iconId]
      || TECH_EFFECT_ICONS[iconId]
      || CARD_EFFECT_ICONS[iconId]
      || RESOURCE_ICON_SRC[iconId]
      || "";
  }

  function getPlanetSectorCoordinate(planetId) {
    const snapshot = solar.createSolarSnapshot(solarState);
    const planet = snapshot.planetLocations.find((item) => item.planetId === planetId);
    if (!planet) {
      throw new Error(`${planetId} position was not found in the current solar snapshot`);
    }
    return { x: planet.x, y: planet.y };
  }

  function buildSectorScanChoicesForXs(sectorXs) {
    return (sectorXs || []).flatMap((x) => buildSectorScanChoicesForX(x));
  }

  function clearActionEffectFlow() {
    pendingActionEffectFlow = null;
    closeLandTargetPicker();
    closeScanAction4Picker();
    renderActionEffectBar();
    els.appWrap?.classList.toggle("action-effect-flow-active", false);
  }

  function cancelActiveEffectSubFlows() {
    if (!pendingPublicScanQueue) {
      closeScanTargetPicker();
    }
    if (els.landTargetOverlay && !els.landTargetOverlay.hidden) {
      cancelLandTargetPicker();
    }
    closeScanAction4Picker();
    closeAlienTracePicker();
    pendingPublicScanQueue = null;

    if (isHandScanSelectionActive()) {
      pendingHandScanAction = null;
      syncHandScanSelectionChrome();
    }

    if (isCardSelectionActive() && pendingActionEffectFlow) {
      pendingCardSelectionAction = null;
      cards.setSelectionActive(cardState, false);
      syncCardSelectionChrome();
    }

    if (pendingActionEffectFlow?.freeMoveMode) {
      pendingActionEffectFlow.freeMoveMode = false;
      deactivateMoveMode();
    }
    if (pendingActionEffectFlow?.cardMoveEffect) {
      pendingActionEffectFlow.cardMoveEffect = null;
      deactivateMoveMode();
    }
    pendingCardTriggerAction = null;
    pendingCardTaskCompletion = null;
    pendingCardTriggerFreeMove = null;
    pendingCardCornerFreeMove = null;
    pendingYichangdianCornerAction = null;
    pendingChongCardGain = null;
    pendingChongFossilChoice = null;
    pendingChongTaskCompletion = null;
    pendingAmibaCardGain = null;
    pendingAmibaSymbolChoice = null;
    pendingAmibaTraceRemoval = null;
    pendingAomomoCardGain = null;
    pendingRunezuCardGain = null;
    pendingRunezuSymbolBranch = null;
    pendingRunezuFaceSymbolPlacement = null;
  }

  function skipCurrentActionEffect() {
    if (!pendingActionEffectFlow) return;

    const current = getCurrentActionEffect();
    if (!current || current.status !== "active") return;

    cancelActiveEffectSubFlows();
    beginEffectHistoryStep(`跳过：${current.label}`);
    endEffectHistoryStep();
    rocketState.statusNote = `已跳过：${current.label}`;
    completeCurrentActionEffect("skipped");
  }

  function renderActionEffectBar() {
    if (!els.actionEffectBar || !els.actionEffectList) return;

    if (!pendingActionEffectFlow) {
      els.actionEffectBar.hidden = true;
      els.actionEffectList.replaceChildren();
      if (els.actionEffectSkipButton) els.actionEffectSkipButton.hidden = true;
      return;
    }

    const current = getCurrentActionEffect();
    const canSkip = current?.status === "active";
    if (els.actionEffectSkipButton) {
      els.actionEffectSkipButton.hidden = !canSkip;
      els.actionEffectSkipButton.disabled = !canSkip;
    }

    els.actionEffectBar.hidden = false;
    els.actionEffectList.replaceChildren(...pendingActionEffectFlow.effects.map((effect, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "action-effect-button";
      button.dataset.effectIndex = String(index);
      button.title = effect.label;
      button.setAttribute("aria-label", effect.label);
      button.disabled = effect.status !== "active";
      button.classList.toggle("is-active", effect.status === "active");
      button.classList.toggle("is-completed", effect.status === "completed");
      button.classList.toggle("is-skipped", effect.status === "skipped");
      button.classList.toggle("is-undoable", effect.status === "completed" && effect.undoable !== false);
      if (effect.status === "completed" && effect.undoable !== false) {
        button.title = `${effect.label}（可撤销）`;
      }

      const image = document.createElement("img");
      image.src = getActionEffectIconSrc(effect.icon);
      image.alt = "";
      image.setAttribute("aria-hidden", "true");
      button.append(image);
      if (effect.badge) {
        const badge = document.createElement("span");
        badge.className = "action-effect-badge";
        badge.textContent = effect.badge;
        button.append(badge);
      } else if (
        pendingActionEffectFlow?.cardMoveEffect?.effect?.id === effect.id
        && effect.status === "active"
      ) {
        const badge = document.createElement("span");
        badge.className = "action-effect-badge";
        badge.textContent = String(pendingActionEffectFlow.cardMoveEffect.poolRemaining);
        button.append(badge);
      }
      return button;
    }));
  }

  function activateNextActionEffect() {
    if (!pendingActionEffectFlow) return;

    const next = abilities.chain.activateNext
      ? abilities.chain.activateNext(pendingActionEffectFlow)
      : null;
    if (!next) {
      finishActionEffectFlow();
      return;
    }
    renderActionEffectBar();
    updateActionButtons();
    renderStateReadout();
  }

  function completeCurrentActionEffect(status = "completed") {
    if (!pendingActionEffectFlow) return;

    const current = getCurrentActionEffect();
    if (!current || current.status !== "active") return;

    cancelActiveEffectSubFlows();
    const hadHistoryStep = effectStepActive;
    const effectEvents = status !== "skipped" ? (current.result?.events || []) : [];
    const irreversibleReason = status !== "skipped"
      ? (
        getIrreversibleReason(current.result, current.label)
        || (current.undoable === false ? current.label : null)
      )
      : null;
    endEffectHistoryStep();
    if (!hadHistoryStep && irreversibleReason) {
      recordIrreversibleEffectStep(
        current,
        irreversibleReason,
        current.result?.irreversible?.code || "irreversible_effect",
      );
    } else if (!hadHistoryStep && status !== "skipped") {
      appendActionLogStep(getEffectHistorySource(), current.label, current.result?.message || null);
    }
    if (status === "skipped") {
      abilities.chain.skipCurrentChainNode(pendingActionEffectFlow);
    } else {
      if (irreversibleReason) {
        markCurrentActionIrreversible(
          irreversibleReason,
          current.result?.irreversible?.code || "irreversible_effect",
        );
      }
      abilities.chain.resolveCurrentChainNode(pendingActionEffectFlow, current.result || {});
    }
    renderActionEffectBar();

    const flowCompleted = pendingActionEffectFlow?.completed;
    if (flowCompleted) {
      settleCardTasksAfterEffect({ events: effectEvents, render: false });
      finishActionEffectFlow();
      return;
    }
    settleCardTasksAfterEffect({ events: effectEvents, render: true });
    renderActionEffectBar();
    updateActionButtons();
    renderStateReadout();
  }

  function resolveCompletedSectorSettlements(actionType, options = {}) {
    if (typeof data.settleCompletedSectors !== "function") return null;

    const beforeNebulaState = structuredClone(nebulaDataState);
    const beforePlayerState = structuredClone(playerState);
    const beforeAlienState = structuredClone(alienGameState);
    const settlementResult = data.settleCompletedSectors(nebulaDataState, {
      players: playerState.players,
      getPlayerTokenSrc: getNormalTokenAssetForPlayer,
      source: actionType || "mainAction",
    });
    if (!settlementResult.ok) return null;

    const awarded = new Set();
    const participantAwardLabels = new Set();
    for (const settlement of settlementResult.settlements || []) {
      const isAomomoSettlement = settlement.sectorId === aomomo?.NEBULA_ID;
      for (const participant of settlement.participants || []) {
        const player = playerState.players.find((item) => item.id === participant.playerId)
          || playerState.players.find((item) => item.color === participant.playerColor);
        if (!player) continue;
        const awardKey = `${settlement.sectorId}:${player.id}`;
        if (awarded.has(awardKey)) continue;
        awarded.add(awardKey);
        if (isAomomoSettlement) {
          players.gainResources(player, { aomomoFossils: 1 });
          participantAwardLabels.add("奥陌陌参与结算玩家各获得1化石");
        } else {
          players.gainResources(player, { publicity: 1 });
          participantAwardLabels.add("参与结算玩家各获得1宣传");
        }
      }
      const winner = playerState.players.find((item) => item.id === settlement.winner?.playerId)
        || playerState.players.find((item) => item.color === settlement.winner?.playerColor);
      const claim = winner
        ? runezu?.claimSectorSymbol?.(alienGameState, settlement.sectorId, winner)
        : null;
      if (claim?.ok) {
        if (!Array.isArray(settlementResult.runezuSymbolClaims)) settlementResult.runezuSymbolClaims = [];
        settlementResult.runezuSymbolClaims.push({
          sectorId: settlement.sectorId,
          playerId: winner.id,
          playerColor: winner.color,
          symbolId: claim.symbolId,
        });
      }
    }
    settlementResult.participantAwardMessage = [...participantAwardLabels].join("；") || "无参与奖励";

    const source = options.historySource || HISTORY_SOURCE_MAIN;
    const history = getHistoryForSource(source);
    if (history.hasSession()) {
      history.beginStep({
        source,
        type: "sector_settlement",
        label: "扇区结算",
      });
      history.record(historyCommands.createRestoreObjectCommand(
        nebulaDataState,
        beforeNebulaState,
        "恢复扇区结算前星云状态",
      ));
      history.record(historyCommands.createRestoreObjectCommand(
        playerState,
        beforePlayerState,
        "恢复扇区结算前玩家状态",
      ));
      history.record(historyCommands.createRestoreObjectCommand(
        alienGameState,
        beforeAlienState,
        "恢复扇区结算前外星人状态",
      ));
      const step = history.endStep();
      if (step) {
        rememberHistoryStep(source, step.id);
        appendActionLogStep(
          source,
          step.label,
          `${settlementResult.message}；${settlementResult.participantAwardMessage}`
            + `${settlementResult.runezuSymbolClaims?.length ? `；符文族symbol ${settlementResult.runezuSymbolClaims.length}个` : ""}`,
          actionLogOptionsFromHistoryStep(step),
        );
      }
    }
    renderSectorNebulaDataBoard();
    renderPlayerStats();
    renderAlienPanels();
    return settlementResult;
  }

  function resultHasSignalMarkedEvent(result) {
    return (result?.events || []).some((event) => event?.type === "signalMarked");
  }

  function effectFlowMarkedNebula(flow) {
    return (flow?.effects || []).some((effect) => resultHasSignalMarkedEvent(effect.result));
  }

  function shouldCheckCompletedSectorsAfterFlow(flow) {
    if (!flow?.completed) return false;
    return effectFlowMarkedNebula(flow);
  }

  function finishActionEffectFlow() {
    if (!pendingActionEffectFlow) return;

    const finishedFlow = pendingActionEffectFlow;
    const actionType = finishedFlow.actionType;
    clearActionEffectFlow();
    if (actionType === "initialIncome") {
      playerState.currentPlayerId = turnState.startPlayerId || playerState.currentPlayerId;
      rocketState.statusNote = "初始收入增加完成，游戏开始。";
      renderDebugPlayerSwitch();
      renderPlayerStats();
      renderPlayerHand();
      syncInteractionFocusChrome();
      updateActionButtons();
      renderStateReadout();
      refreshLatestActionLogRecoverySnapshot("初始收入完成后状态");
      return;
    }
    const settleResult = shouldCheckCompletedSectorsAfterFlow(finishedFlow)
      ? resolveCompletedSectorSettlements(actionType, { historySource: finishedFlow.historySource || HISTORY_SOURCE_MAIN })
      : null;
    if (startTemporaryCardTaskRewardFlow(finishedFlow.cardTemporaryTasks, settleResult)) {
      return;
    }
    const baseMessage = actionType === "scan"
      ? "扫描效果已全部处理，可继续执行次要行动或回合结束"
      : "效果已全部处理，可继续执行次要行动或回合结束";
    rocketState.statusNote = settleResult?.ok
      ? `${baseMessage}；${settleResult.message}；${settleResult.participantAwardMessage || "参与结算玩家各获得1宣传"}`
      : baseMessage;
    if (finishedFlow.consumesMainAction !== false) {
      markActionPending();
    }
    renderPlayerStats();
    updateActionButtons();
    renderStateReadout();
  }

  function maybeCompleteActionEffectFromScan(result) {
    if (!result?.ok || !isActionEffectFlowActive()) return;
    const current = getCurrentActionEffect();
    if (current) current.result = result;
    completeCurrentActionEffect();
  }

  function closeScanAction4Picker() {
    if (!els.scanAction4Overlay) return;
    els.scanAction4Overlay.hidden = true;
    if (els.scanAction4Actions) els.scanAction4Actions.replaceChildren();
  }

  function openScanAction4Picker() {
    if (!els.scanAction4Overlay || !els.scanAction4Actions) {
      return { ok: false, message: "无法打开发射/移动选择" };
    }

    const currentPlayer = getCurrentPlayer();
    const rocketsForPlayer = getMovableTokensForPlayer(currentPlayer?.id);
    const hasRocket = rocketsForPlayer.length > 0;
    const canLaunch = players.canAfford(currentPlayer, { energy: scanEffects.SCAN_ACTION_4_LAUNCH_ENERGY });
    const choices = [];

    if (canLaunch) {
      choices.push({
        id: "launch",
        label: "发射",
        description: "消耗 1 能量，在地球扇区发射火箭",
      });
    } else {
      choices.push({
        id: "launch",
        label: "发射",
        description: "能量不足，无法发射",
        disabled: true,
      });
    }

    if (hasRocket) {
      choices.push({
        id: "move",
        label: "移动",
        description: "选择飞船并移动，不消耗能量或手牌",
      });
    }

    if (els.scanAction4Subtitle) {
      els.scanAction4Subtitle.textContent = hasRocket
        ? "选择发射、移动，或取消跳过此效果。"
        : "没有飞船时只能选择发射或取消。";
    }

    els.scanAction4Actions.replaceChildren(...choices.map((choice) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "scan-target-option-button";
      button.dataset.scanAction4Choice = choice.id;
      button.disabled = Boolean(choice.disabled);
      button.innerHTML = `${choice.label}<small>${choice.description || ""}</small>`;
      return button;
    }));

    els.scanAction4Overlay.hidden = false;
    return { ok: true };
  }

  function launchRocketForScanAction4() {
    const currentPlayer = getCurrentPlayer();
    if (!players.canAfford(currentPlayer, { energy: scanEffects.SCAN_ACTION_4_LAUNCH_ENERGY })) {
      return { ok: false, message: "能量不足，发射需要 1 能量" };
    }

    beginEffectHistoryStep("发射/移动");

    const result = abilities.executeAbility("scanAction4", createActionContext(), {
      choice: "launch",
      cost: { energy: scanEffects.SCAN_ACTION_4_LAUNCH_ENERGY },
    });
    if (!result.ok) {
      endEffectHistoryStep();
      return result;
    }

    recordAbilityCommands(result);

    renderRocketElement(result.rocket);
    const current = getCurrentActionEffect();
    if (current) current.result = result;
    return result;
  }

  function beginScanAction4FreeMove() {
    const currentPlayer = getCurrentPlayer();
    const rocketsForPlayer = getMovableTokensForPlayer(currentPlayer?.id);
    if (!rocketsForPlayer.length) {
      rocketState.statusNote = "没有可移动的飞船";
      renderStateReadout();
      return { ok: false, message: rocketState.statusNote };
    }

    pendingActionEffectFlow.freeMoveMode = true;
    rocketState.statusNote = rocketsForPlayer.length > 1
      ? "扫描效果：请点击要移动的飞船"
      : "扫描效果：使用方向键移动飞船";
    if (rocketsForPlayer.length === 1) {
      activateMoveMode(rocketsForPlayer[0].id);
    } else {
      selectDefaultRocketForCurrentPlayer();
    }
    renderStateReadout();
    return { ok: true, message: rocketState.statusNote };
  }

  function executeFreeMoveForScanAction4(deltaX, deltaY, rocketId) {
    const moveCheck = rocketActions.canMoveRocket(rocketState, rocketId, deltaX, deltaY);
    if (!moveCheck.ok) {
      rocketState.statusNote = moveCheck.message;
      renderStateReadout();
      return moveCheck;
    }

    beginEffectHistoryStep("发射/移动");

    const result = abilities.executeAbility("scanAction4", createActionContext(), {
      choice: "move",
      cost: {},
      rocketId,
      deltaX,
      deltaY,
    });
    if (result.rocket) renderRocketElement(result.rocket);
    if (!result.ok) {
      endEffectHistoryStep();
      rocketState.statusNote = result.message;
      renderStateReadout();
      return result;
    }

    recordAbilityCommands(result);

    pendingActionEffectFlow.freeMoveMode = false;
    deactivateMoveMode();
    const current = getCurrentActionEffect();
    if (current) current.result = result;
    rocketState.statusNote = `扫描效果：${result.message}`;
    renderPlayerStats();
    completeCurrentActionEffect();
    renderStateReadout();
    return result;
  }

  function beginCardMoveEffect(effect) {
    const currentPlayer = getCurrentPlayer();
    const rocketsForPlayer = getMovableTokensForPlayer(currentPlayer?.id);
    if (!rocketsForPlayer.length) {
      rocketState.statusNote = "没有可移动的飞船";
      renderStateReadout();
      return { ok: false, message: rocketState.statusNote };
    }

    if (!pendingActionEffectFlow.cardMoveEffect
      || pendingActionEffectFlow.cardMoveEffect.effect?.id !== effect.id) {
      initCardMoveEffectState(effect);
    } else {
      effect.badge = String(pendingActionEffectFlow.cardMoveEffect.poolRemaining);
    }

    const poolRemaining = pendingActionEffectFlow.cardMoveEffect.poolRemaining;
    rocketState.statusNote = poolRemaining > 1
      ? `${effect.label}：剩余 ${poolRemaining} 点移动力，请点击要移动的飞船`
      : rocketsForPlayer.length > 1
        ? `${effect.label}：请点击要移动的飞船`
        : `${effect.label}：使用方向键移动飞船`;
    renderActionEffectBar();
    if (rocketsForPlayer.length === 1) {
      activateMoveMode(rocketsForPlayer[0].id);
    } else {
      selectDefaultRocketForCurrentPlayer();
    }
    renderStateReadout();
    return { ok: true, message: rocketState.statusNote };
  }

  function applyCardMoveRewardEffect(rewardEffect, messageParts) {
    const currentPlayer = getCurrentPlayer();
    if (!currentPlayer || !rewardEffect) return null;

    if (rewardEffect.type === "gain_resources") {
      const gain = rewardEffect.options?.gain || {};
      players.gainResources(currentPlayer, gain);
      messageParts.push(`${rewardEffect.label}：${formatPlanetRewardGain(gain)}`);
      return { ok: true, effect: rewardEffect, gain };
    }

    if (rewardEffect.type === "gain_data") {
      const count = Math.max(0, Math.round(rewardEffect.options?.count || 0));
      const results = [];
      for (let index = 0; index < count; index += 1) {
        results.push(data.gainData(currentPlayer, { source: "card_move" }));
      }
      const gained = results.filter((item) => item.ok).length;
      const discarded = results.filter((item) => item.discarded).length;
      messageParts.push(`${rewardEffect.label}：获得 ${gained}/${count} 数据${discarded ? `，弃置${discarded}` : ""}`);
      return { ok: true, effect: rewardEffect, results };
    }

    messageParts.push(`暂不支持的移动后奖励：${rewardEffect.type}`);
    return { ok: false, effect: rewardEffect };
  }

  function applyCardMoveAfterEventRewards(effect, moveResult, messageParts) {
    const rewards = effect.options?.afterEventRewards || [];
    if (!rewards.length || !moveResult?.events?.length) return [];

    if (!pendingActionEffectFlow.cardEventRewardKeys) {
      pendingActionEffectFlow.cardEventRewardKeys = [];
    }
    const usedKeys = new Set(pendingActionEffectFlow.cardEventRewardKeys);
    const applied = [];

    for (const reward of rewards) {
      if (!moveResult.events.some((event) => event.type === reward.eventType)) continue;
      if (reward.onceKey && usedKeys.has(reward.onceKey)) continue;
      const appliedReward = applyCardMoveRewardEffect(reward.effect, messageParts);
      if (!appliedReward?.ok) continue;
      applied.push(appliedReward);
      if (reward.onceKey) {
        usedKeys.add(reward.onceKey);
        pendingActionEffectFlow.cardEventRewardKeys.push(reward.onceKey);
      }
    }

    return applied;
  }

  function executeCardMoveForEffect(deltaX, deltaY, rocketId) {
    return requestCardEffectMove(deltaX, deltaY, rocketId);
  }

  function executeSectorScanAtPlanet(planetId, prefixLabel) {
    if (planetId === aomomo?.PLANET_ID) {
      if (getAomomoCurrentX() == null) {
        rocketState.statusNote = "奥陌陌星球尚未启用，无法扫描奥陌陌";
        renderStateReadout();
        return { ok: false, message: rocketState.statusNote };
      }
      const result = replaceNebulaDataForCurrentPlayer(aomomo.NEBULA_ID, {
        prefix: prefixLabel || "扫描奥陌陌",
        source: "scan",
      });
      maybeCompleteActionEffectFromScan(result);
      return result;
    }

    const sector = getPlanetSectorCoordinate(planetId);
    const choices = buildSectorScanChoicesForX(sector.x).filter((choice) => choice.nebulaId);
    if (!choices.length || choices.every((choice) => choice.disabled)) {
      const planetName = planetId === "earth" ? "地球" : planetId === "mercury" ? "水星" : planetId;
      rocketState.statusNote = `${planetName}所在扇区没有可扫描星云`;
      renderStateReadout();
      return { ok: false, message: rocketState.statusNote };
    }
    if (choices.length > 1) {
      rocketState.statusNote = `${prefixLabel || "扇区扫描"}：请选择要扫描的星云`;
      renderStateReadout();
      return openScanTargetPicker({
        type: "sector_scan",
        fromEffectFlow: isActionEffectFlowActive(),
        title: prefixLabel || "扇区扫描",
        subtitle: "该 x 坐标同时存在外圈星云与奥陌陌，选择一个目标。",
        choices,
      });
    }

    const result = replaceNebulaDataForCurrentPlayer(choices[0].nebulaId, {
      prefix: prefixLabel || `扇区${sector.x}扫描`,
      source: "scan",
    });
    maybeCompleteActionEffectFromScan(result);
    return result;
  }

  function executeImprovedEarthSectorScanEffect() {
    const earth = getEarthSectorCoordinate();
    const sectorXs = [(earth.x + 7) % 8, earth.x, (earth.x + 1) % 8];
    const choices = buildSectorScanChoicesForXs(sectorXs);
    rocketState.statusNote = "扇区扫描：请选择地球及相邻扇区之一";
    renderStateReadout();
    return openScanTargetPicker({
      type: "sector_scan",
      fromEffectFlow: true,
      title: "扇区扫描",
      subtitle: "地球及左右相邻扇区三选一，按槽位顺序替换未替换的数据。",
      choices,
    });
  }

  function handleScanAction4Choice(choiceId) {
    closeScanAction4Picker();

    if (choiceId === "launch") {
      const result = launchRocketForScanAction4();
      rocketState.statusNote = result.ok ? result.message : result.message;
      if (result.ok) {
        renderPlayerStats();
        completeCurrentActionEffect();
      }
      renderStateReadout();
      return result;
    }

    if (choiceId === "move") {
      return beginScanAction4FreeMove();
    }

    return { ok: false, message: "未知选择" };
  }

  function formatPlanetRewardGain(gain) {
    return Object.entries(gain || {})
      .filter(([, value]) => Number(value) !== 0)
      .map(([key, value]) => `${INCOME_GAIN_LABELS[key] || (key === "score" ? "分数" : key)}+${value}`)
      .join("、");
  }

  function finishAutomaticRewardEffect(effect, result, renderers = []) {
    effect.result = result;
    rocketState.statusNote = result.message;
    for (const render of renderers) render();
    renderPlayerStats();
    renderPublicCards();
    updatePublicCardControls();
    updateActionButtons();
    completeCurrentActionEffect();
    renderStateReadout();
    return result;
  }

  function executeGainResourcesRewardEffect(effect) {
    const currentPlayer = getCurrentPlayer();
    const gain = effect.options?.gain || {};
    const beforePlayer = structuredClone(currentPlayer);
    beginEffectHistoryStep(effect.label);
    players.gainResources(currentPlayer, gain);
    recordHistoryCommand(historyCommands.createRestorePlayerCommand(
      currentPlayer,
      beforePlayer,
      "恢复奖励前玩家状态",
    ));
    return finishAutomaticRewardEffect(effect, {
      ok: true,
      undoable: true,
      message: `${effect.label}：${formatPlanetRewardGain(gain)}`,
      payload: { gain },
    });
  }

  function executeGainDataRewardEffect(effect) {
    const currentPlayer = getCurrentPlayer();
    const count = Math.max(0, Math.round(effect.options?.count || 0));
    const source = effect.options?.source || "planet_reward";
    beginEffectHistoryStep(effect.label);
    const results = [];
    for (let index = 0; index < count; index += 1) {
      const gainResult = data.gainData(currentPlayer, { source });
      results.push(gainResult);
      recordHistoryCommand(historyCommands.createGainDataCommand(currentPlayer, gainResult));
    }
    const gained = results.filter((item) => item.ok).length;
    const discarded = results.filter((item) => item.discarded).length;
    const message = `${effect.label}：获得 ${gained}/${count} 个数据${discarded ? `，弃置 ${discarded} 个溢出数据` : ""}`;
    return finishAutomaticRewardEffect(effect, {
      ok: true,
      undoable: true,
      message,
      payload: { results },
    });
  }

  function executeLaunchRewardEffect(effect) {
    const options = effect.options || {};
    beginEffectHistoryStep(effect.label);
    const result = abilities.executeAbility("launchProbe", createActionContext(), {
      skipCost: Boolean(options.skipCost),
      cost: options.cost,
      source: options.source || "reward",
      historyLabel: effect.label,
    });
    if (!result.ok) {
      endEffectHistoryStep();
      rocketState.statusNote = result.message;
      renderStateReadout();
      return result;
    }
    recordAbilityCommands(result);
    if (result.rocket) renderRocketElement(result.rocket);
    const finished = finishAutomaticRewardEffect(effect, {
      ...result,
      undoable: true,
      message: `${effect.label}：${result.message}`,
    }, [renderRockets]);
    return finished;
  }

  function executeDrawCardsRewardEffect(effect) {
    const currentPlayer = getCurrentPlayer();
    const count = Math.max(0, Math.round(effect.options?.count || 0));
    const available = cards.getAvailablePool(cardState, playerState).length;
    if (available <= 0) {
      rocketState.statusNote = "牌库已无可用卡牌";
      renderStateReadout();
      return { ok: false, message: rocketState.statusNote };
    }

    const drawResult = cards.drawCardsToHand(cardState, playerState, currentPlayer, count);
    markCurrentActionIrreversible("盲抽翻出新牌", "hidden_card_reveal");
    const drawnCount = drawResult.cards?.length || 0;
    const message = drawResult.ok
      ? `${effect.label}：已抽 ${drawnCount} 张`
      : `${effect.label}：已抽 ${drawnCount}/${count} 张，${drawResult.message}`;
    return finishAutomaticRewardEffect(effect, {
      ok: true,
      undoable: false,
      irreversible: { code: "hidden_card_reveal", reason: "盲抽翻出新牌" },
      message,
      payload: { cards: drawResult.cards || [] },
    });
  }

  function insertActionEffectsAfterCurrent(effects) {
    if (!pendingActionEffectFlow || !effects?.length) return;
    const insertIndex = Math.max(0, pendingActionEffectFlow.currentIndex + 1);
    pendingActionEffectFlow.effects.splice(insertIndex, 0, ...effects.map((effect, index) => ({
      ...effect,
      id: effect.id || `inserted-card-effect-${insertIndex}-${index}`,
      options: { ...(effect.options || {}) },
      status: "pending",
    })));
  }

  function executeCardFixedNebulaScanEffect(effect) {
    const result = replaceNebulaDataForCurrentPlayer(effect.options?.nebulaId, {
      prefix: effect.label,
      source: "card",
      gainData: effect.options?.gainData,
    });
    if (result.ok) {
      effect.result = result;
      completeCurrentActionEffect();
    }
    return result;
  }

  function openCardColorScanEffect(effect) {
    const color = effect.options?.color;
    const nebulaIds = cardEffects.NEBULA_IDS_BY_COLOR[color] || [];
    rocketState.statusNote = `${effect.label}：请选择 1 个星云`;
    renderStateReadout();
    return openScanTargetPicker({
      type: "sector_scan",
      fromEffectFlow: true,
      title: effect.label,
      subtitle: "按槽位顺序替换未替换的数据。",
      gainData: effect.options?.gainData,
      choices: expandScanChoicesWithAomomoTargets(nebulaIds.map((nebulaId) => buildNebulaScanChoice(nebulaId))),
    });
  }

  function openCardAnySectorScanEffect(effect) {
    const choices = buildSectorScanChoicesForXs(Array.from({ length: 8 }, (_, x) => x));
    rocketState.statusNote = `${effect.label}：请选择 0-7 号扇区之一`;
    renderStateReadout();
    return openScanTargetPicker({
      type: "sector_scan",
      fromEffectFlow: true,
      title: effect.label,
      subtitle: "选择任意外圈扇区中的一个星云，按槽位顺序替换未替换的数据。",
      gainData: effect.options?.gainData,
      choices,
    });
  }

  function openCardPublicScanEffect(effect) {
    const currentPlayer = getCurrentPlayer();
    rocketState.statusNote = `${effect.label}：请选择一张亮明的公共牌`;
    renderStateReadout();
    return beginCardSelection({
      ...createPublicScanPendingAction(currentPlayer, true),
      maxSelectable: 1,
      selectedSlots: [],
    });
  }

  function expandCardScanActionEffect(effect) {
    const currentPlayer = getCurrentPlayer();
    const followups = scanEffects.buildScanEffectQueue(currentPlayer)
      .filter((item) => effect.options?.skipCost ? item.type !== scanEffects.EFFECT_TYPES.PAY_SCAN_COST : true)
      .map((item, index) => ({
        ...item,
        id: `${effect.id || "card-scan-action"}-${index}`,
        status: "pending",
      }));
    insertActionEffectsAfterCurrent(followups);
    effect.result = {
      ok: true,
      undoable: true,
      message: "扫描行动已展开",
      payload: { inserted: followups.length },
    };
    rocketState.statusNote = "扫描行动已展开，请继续处理后续扫描效果";
    completeCurrentActionEffect();
    renderStateReadout();
    return effect.result;
  }

  function executeCardResearchTechEffect(effect) {
    const result = abilities.executeAbility("researchTechPrepare", createActionContext(), {
      techTypes: effect.options?.techTypes || effect.options?.techType,
      skipCost: Boolean(effect.options?.skipCost),
      source: "card",
    });
    if (!result.ok) {
      rocketState.statusNote = result.message;
      renderStateReadout();
      return result;
    }
    rocketState.statusNote = result.message || "请选择要研究的科技片";
    syncTechSelectionChrome();
    renderTechBoard();
    updateActionButtons();
    renderStateReadout();
    return result;
  }

  function openCardDrawThenScanEffect(effect) {
    const currentPlayer = getCurrentPlayer();
    const drawResult = cards.blindDraw(cardState, playerState, currentPlayer);
    if (!drawResult.ok) {
      rocketState.statusNote = drawResult.message;
      renderStateReadout();
      return drawResult;
    }

    markCurrentActionIrreversible("盲抽翻出新牌", "hidden_card_reveal");
    const drawnCard = drawResult.card;
    const handIndex = currentPlayer.hand.findIndex((item) => item.id === drawnCard.id);
    const scanChoices = getPublicScanChoicesForCard(drawnCard);
    if (!scanChoices.ok) {
      rocketState.statusNote = scanChoices.message;
      renderPlayerStats();
      renderPlayerHand();
      renderStateReadout();
      return { ...scanChoices, drawnCard };
    }

    rocketState.statusNote = `${effect.label}：${cards.getCardLabel(drawnCard)}，请选择${scanChoices.scanLabel}目标`;
    renderPlayerStats();
    renderPlayerHand();
    renderStateReadout();
    return openScanTargetPicker({
      type: "hand_scan",
      card: drawnCard,
      handIndex,
      player: currentPlayer,
      scanCode: scanChoices.scanCode,
      fromEffectFlow: true,
      irreversibleDraw: true,
      title: effect.label,
      subtitle: `${cards.getCardLabel(drawnCard)}：${scanChoices.scanLabel}，请选择 2 选 1 星云。确认后弃除这张牌。`,
      choices: scanChoices.choices,
    });
  }

  function executeCardDrawThenDiscardActionEffect(effect) {
    const currentPlayer = getCurrentPlayer();
    if (!currentPlayer) return { ok: false, message: "没有当前玩家" };

    const beforePlayer = structuredClone(currentPlayer);
    const beforeCardState = {
      publicCards: cardState.publicCards.slice(),
      discardPile: (cardState.discardPile || []).slice(),
    };

    beginEffectHistoryStep(effect.label);
    const drawResult = cards.blindDraw(cardState, playerState, currentPlayer);
    if (!drawResult.ok) {
      endEffectHistoryStep();
      rocketState.statusNote = drawResult.message;
      renderStateReadout();
      return drawResult;
    }

    markCurrentActionIrreversible("盲抽翻出新牌", "hidden_card_reveal");
    const drawnCard = drawResult.card;
    const drawnIndex = currentPlayer.hand.findIndex((item) => item.id === drawnCard.id);
    const discardResult = cards.discardFromHandAtIndex(currentPlayer, drawnIndex);
    if (!discardResult.ok) {
      endEffectHistoryStep();
      rocketState.statusNote = discardResult.message;
      renderPlayerHand();
      renderStateReadout();
      return discardResult;
    }
    cards.addToDiscardPile(cardState, discardResult.card);

    const resourceReward = cards.getDiscardActionRewardForCard(discardResult.card);
    const moveReward = cards.getDiscardActionMoveRewardForCard?.(discardResult.card);
    const dataResults = [];

    if (resourceReward) {
      if (Object.keys(resourceReward.gain || {}).length) {
        players.gainResources(currentPlayer, resourceReward.gain);
      }
      const dataCount = Math.max(0, Math.round(resourceReward.dataCount || 0));
      for (let index = 0; index < dataCount; index += 1) {
        dataResults.push(data.gainData(currentPlayer, { source: "card_corner" }));
      }
    }

    if (moveReward?.gain && Object.keys(moveReward.gain).length) {
      players.gainResources(currentPlayer, moveReward.gain);
    }

    if (moveReward) {
      insertActionEffectsAfterCurrent([{
        id: `${effect.id || "card-corner"}-move-${discardResult.card.id}`,
        type: cardEffects.EFFECT_TYPES.CARD_MOVE,
        label: `${cards.getCardLabel(discardResult.card)}：${moveReward.label}`,
        icon: "movement",
        options: {
          movementPoints: moveReward.movementPoints || 1,
          historyLabel: moveReward.label,
        },
      }]);
    }

    recordHistoryCommand(historyCommands.createRestorePlayerCommand(
      currentPlayer,
      beforePlayer,
      "恢复盲抽角标结算前玩家状态",
    ));
    recordHistoryCommand(historyCommands.createRestorePublicCardsCommand(
      cardState,
      beforeCardState.publicCards,
      beforeCardState.discardPile,
    ));

    const rewardText = resourceReward
      ? formatCardCornerRewardMessage(resourceReward, dataResults)
      : moveReward
        ? `${formatPlanetRewardGain(moveReward.gain || {})}${moveReward.gain?.score ? "，" : ""}${moveReward.label}`
        : "无可结算角标";
    return finishAutomaticRewardEffect(effect, {
      ok: true,
      undoable: false,
      irreversible: { code: "hidden_card_reveal", reason: "盲抽翻出新牌" },
      message: `${effect.label}：抽到并弃除 ${cards.getCardLabel(discardResult.card)}，${rewardText}`,
      payload: {
        card: discardResult.card,
        resourceReward,
        moveReward,
        dataResults,
      },
    }, [renderPlayerHand]);
  }

  function countYichangdianAnomalySignals() {
    if (!yichangdian) return 0;
    let total = 0;
    for (const anomaly of alienGameState.yichangdian?.anomalies || []) {
      const nebula = solar.getNebulaAtCoordinate(anomaly.sectorX, 5, solarState.sectorBySlot);
      if (!nebula) continue;
      const tokens = nebulaDataState.nebulae?.[nebula.id]?.tokens || [];
      total += tokens.filter((token) => token.replacedByPlayerColor || token.playerColor).length;
    }
    return total;
  }

  function executeYichangdianAnomalySignalScoreEffect(effect) {
    const currentPlayer = getCurrentPlayer();
    const score = countYichangdianAnomalySignals();
    beginEffectHistoryStep(effect.label);
    const beforePlayer = structuredClone(currentPlayer);
    if (score > 0) players.gainResources(currentPlayer, { score });
    recordHistoryCommand(historyCommands.createRestorePlayerCommand(
      currentPlayer,
      beforePlayer,
      "恢复异常点信号得分前玩家状态",
    ));
    return finishAutomaticRewardEffect(effect, {
      ok: true,
      undoable: true,
      message: `异常扇区共有 ${score} 个信号，获得 ${score} 分`,
      payload: { score },
    }, [renderPlayerStats]);
  }

  function executeYichangdianNextAnomalyRewardEffect(effect) {
    const currentPlayer = getCurrentPlayer();
    const nextSectorX = alienGameState.yichangdian?.nextAnomalySectorX;
    const anomaly = nextSectorX == null ? null : yichangdian?.getAnomalyBySectorX?.(alienGameState, nextSectorX);
    const reward = anomaly ? yichangdian.getAnomalyReward(anomaly.markerId) : null;
    if (!currentPlayer || !anomaly || !reward) {
      rocketState.statusNote = "没有可结算的即将触发异常奖励";
      renderStateReadout();
      return { ok: false, message: rocketState.statusNote };
    }

    beginEffectHistoryStep(effect.label);
    const beforePlayerState = structuredClone(playerState);
    const rewardResult = applyYichangdianRewardToPlayer(currentPlayer, reward, `异常点牌 ${anomaly.markerId}`);
    recordHistoryCommand(historyCommands.createRestoreObjectCommand(
      playerState,
      beforePlayerState,
      "恢复异常点牌奖励前玩家状态",
    ));
    if (getCurrentActionEffect()) {
      getCurrentActionEffect().result = {
        ok: true,
        undoable: true,
        message: rewardResult.message,
        payload: { anomaly, reward },
      };
    }
    if (reward.pickCard) {
      beginCardSelection({
        type: "yichangdian_anomaly_pick",
        player: currentPlayer,
        allowBlindDraw: true,
        fromEffectFlow: true,
      });
      return { ok: true, message: rewardResult.message };
    }
    completeCurrentActionEffect();
    renderPlayerStats();
    renderStateReadout();
    return { ok: true, message: rewardResult.message };
  }

  function executeYichangdianPublicAllEffect(effect) {
    const currentPlayer = getCurrentPlayer();
    beginEffectHistoryStep(effect.label);
    const beforePlayerState = structuredClone(playerState);
    const beforeCardState = structuredClone(cardState);
    const picked = [];
    for (let slotIndex = 0; slotIndex < cards.PUBLIC_CARD_COUNT; slotIndex += 1) {
      const result = cards.pickFromPublic(cardState, playerState, currentPlayer, slotIndex);
      if (result.ok) picked.push(result.card);
    }
    recordHistoryCommand(historyCommands.createRestoreObjectCommand(
      playerState,
      beforePlayerState,
      "恢复异常点拿公共牌前玩家状态",
    ));
    recordHistoryCommand(historyCommands.createRestoreObjectCommand(
      cardState,
      beforeCardState,
      "恢复异常点拿公共牌前牌区状态",
    ));
    markCurrentActionIrreversible("公共牌补牌翻出新牌", "hidden_card_reveal");
    return finishAutomaticRewardEffect(effect, {
      ok: true,
      undoable: false,
      irreversible: { code: "hidden_card_reveal", reason: "公共牌补牌翻出新牌" },
      message: `获得公共牌区 ${picked.length} 张牌${picked.length ? `：${picked.map((card) => cards.getCardLabel(card)).join("、")}` : ""}`,
      payload: { cards: picked },
    }, [renderPublicCards, renderPlayerHand, renderPlayerStats]);
  }

  function executeYichangdianAlienTraceEffect(effect) {
    return openAlienTraceRewardEffect({
      ...effect,
      options: { ...(effect.options || {}) },
    });
  }

  function executeYichangdianNextAnomalyScanEffect(effect) {
    const nextSectorX = alienGameState.yichangdian?.nextAnomalySectorX;
    if (nextSectorX == null) {
      rocketState.statusNote = "没有即将触发的异常扇区";
      renderStateReadout();
      return { ok: false, message: rocketState.statusNote };
    }
    const nebula = solar.getNebulaAtCoordinate(nextSectorX, 5, solarState.sectorBySlot);
    if (!nebula) {
      rocketState.statusNote = `异常扇区 ${nextSectorX} 没有星云`;
      renderStateReadout();
      return { ok: false, message: rocketState.statusNote };
    }
    return replaceNebulaDataForCurrentPlayer(nebula.id, {
      prefix: effect.label,
      source: "card",
      gainData: true,
    });
  }

  function applyYichangdianDiscardActionReward(card, messageParts) {
    const currentPlayer = getCurrentPlayer();
    const reward = cards.getDiscardActionRewardForCard(card);
    const moveReward = cards.getDiscardActionMoveRewardForCard(card);
    if (reward?.gain && Object.keys(reward.gain).length) {
      players.gainResources(currentPlayer, reward.gain);
      messageParts.push(`${cards.getCardLabel(card)} 左上角：${players.formatResourceCost(reward.gain)}`);
    }
    if (reward?.dataCount) {
      for (let index = 0; index < reward.dataCount; index += 1) {
        data.gainData(currentPlayer, { source: "yichangdian_card" });
      }
      messageParts.push(`${cards.getCardLabel(card)} 左上角：${reward.dataCount}数据`);
    }
    if (moveReward) {
      insertActionEffectsAfterCurrent([{
        id: `yichangdian-corner-move-${card.id}`,
        type: cardEffects.EFFECT_TYPES.CARD_MOVE,
        label: `${cards.getCardLabel(card)}：${moveReward.label}`,
        icon: "movement",
        status: "pending",
        options: { movementPoints: moveReward.movementPoints || 1 },
      }]);
      messageParts.push(`${cards.getCardLabel(card)} 左上角：${moveReward.label}`);
    }
  }

  function executeYichangdianDrawThenTwoCornersEffect(effect) {
    const currentPlayer = getCurrentPlayer();
    beginEffectHistoryStep(effect.label);
    const beforePlayerState = structuredClone(playerState);
    const beforeCardState = structuredClone(cardState);
    const drawn = [];
    for (let index = 0; index < 3; index += 1) {
      const drawResult = blindDrawCardForPlayer(currentPlayer);
      if (drawResult.ok) drawn.push(drawResult.card);
    }
    markCurrentActionIrreversible("盲抽翻出新牌", "hidden_card_reveal");
    pendingYichangdianCornerAction = {
      effect,
      playerId: currentPlayer.id,
      phase: "discard",
      drawnCardIds: drawn.map((card) => card.id),
      selectedDiscardCard: null,
      beforePlayerState,
      beforeCardState,
      messageParts: [`盲抽 ${drawn.length} 张`],
    };
    renderPlayerHand();
    renderPlayerStats();
    return openYichangdianCornerPicker();
  }

  function getPendingYichangdianCornerCards() {
    const pending = pendingYichangdianCornerAction;
    const player = pending ? getPlayerById(pending.playerId) : null;
    if (!pending || !player) return [];
    const usedIds = new Set([pending.selectedDiscardCard?.id].filter(Boolean));
    return pending.drawnCardIds
      .map((id) => player.hand.find((card) => card.id === id))
      .filter((card) => card && !usedIds.has(card.id));
  }

  function openYichangdianCornerPicker() {
    const pending = pendingYichangdianCornerAction;
    if (!pending || !els.scanTargetOverlay || !els.scanTargetActions) {
      return { ok: false, message: "无法打开异常点角标选择" };
    }
    const choices = getPendingYichangdianCornerCards();
    if (els.scanTargetTitle) els.scanTargetTitle.textContent = "异常点 8 号牌";
    if (els.scanTargetSubtitle) {
      els.scanTargetSubtitle.textContent = pending.phase === "discard"
        ? "请选择 1 张抽到的牌弃掉并结算左上角弃牌奖励。"
        : "请选择 1 张剩余抽到的牌弃掉并结算右下角收入奖励。";
    }
    if (els.scanTargetCancel) els.scanTargetCancel.hidden = true;
    els.scanTargetActions.replaceChildren(...choices.map((card) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "scan-target-option-button";
      button.dataset.yichangdianCornerCardId = card.id;
      button.innerHTML = `${cards.getCardLabel(card)}<small>${pending.phase === "discard" ? "结算左上角" : "结算收入角标"}</small>`;
      return button;
    }));
    els.scanTargetOverlay.hidden = false;
    rocketState.statusNote = pending.phase === "discard" ? "异常点：请选择左上角奖励牌" : "异常点：请选择收入奖励牌";
    renderStateReadout();
    return { ok: true, message: rocketState.statusNote };
  }

  function handleYichangdianCornerChoice(cardId) {
    const pending = pendingYichangdianCornerAction;
    const player = pending ? getPlayerById(pending.playerId) : null;
    if (!pending || !player) return { ok: false, message: "没有异常点角标选择流程" };
    const card = player.hand.find((item) => item.id === cardId);
    if (!card) return { ok: false, message: "选择的卡牌不在手牌中" };
    const handIndex = player.hand.findIndex((item) => item.id === card.id);
    const discardResult = cards.discardFromHandAtIndex(player, handIndex);
    if (!discardResult.ok) return discardResult;
    cards.addToDiscardPile(cardState, discardResult.card);

    if (pending.phase === "discard") {
      pending.selectedDiscardCard = discardResult.card;
      applyYichangdianDiscardActionReward(discardResult.card, pending.messageParts);
      pending.phase = "income";
      renderPlayerHand();
      renderPlayerStats();
      return openYichangdianCornerPicker();
    }

    const incomeResult = applyIncomeFromCard(player, discardResult.card);
    pending.messageParts.push(incomeResult.message);
    recordHistoryCommand(historyCommands.createRestoreObjectCommand(
      playerState,
      pending.beforePlayerState,
      "恢复异常点盲抽角标前玩家状态",
    ));
    recordHistoryCommand(historyCommands.createRestoreObjectCommand(
      cardState,
      pending.beforeCardState,
      "恢复异常点盲抽角标前牌区状态",
    ));
    pendingYichangdianCornerAction = null;
    if (els.scanTargetOverlay) els.scanTargetOverlay.hidden = true;
    return finishAutomaticRewardEffect(pending.effect, {
      ok: true,
      undoable: false,
      irreversible: { code: "hidden_card_reveal", reason: "盲抽翻出新牌" },
      message: pending.messageParts.join("；"),
      payload: {
        discardCard: pending.selectedDiscardCard,
        incomeCard: discardResult.card,
      },
    }, [renderPlayerHand, renderPlayerStats]);
  }

  function executeYichangdianLaunchAnomalyMoveEffect(effect) {
    const earth = getEarthSectorCoordinate();
    const anomaly = yichangdian?.getAnomalyBySectorX?.(alienGameState, earth.x);
    if (!anomaly) {
      return finishAutomaticRewardEffect(effect, {
        ok: true,
        undoable: true,
        message: "发射不在异常扇区，不获得移动",
      });
    }
    insertActionEffectsAfterCurrent([{
      id: "yichangdian-launch-free-move",
      type: cardEffects.EFFECT_TYPES.CARD_MOVE,
      label: "异常扇区发射：1移动",
      icon: "movement",
      status: "pending",
      options: { movementPoints: 1 },
    }]);
    return finishAutomaticRewardEffect(effect, {
      ok: true,
      undoable: true,
      message: "发射在异常扇区，获得1移动",
    });
  }

  function findChongProbeFossilPlanet() {
    const currentPlayer = getCurrentPlayer();
    if (!currentPlayer) return null;
    const planetLocations = solar.createSolarSnapshot(solarState).planetLocations;
    const active = rocketActions.getActiveRocket(rocketState);
    const candidates = [
      ...(active ? [active] : []),
      ...rocketActions.getRocketsForPlayer(rocketState, currentPlayer.id),
    ];
    const seen = new Set();
    for (const rocket of candidates) {
      if (!rocket || seen.has(rocket.id)) continue;
      seen.add(rocket.id);
      if (!rocketActions.isControllablePlayerRocket(rocket)) continue;
      if (rocket.playerId !== currentPlayer.id) continue;
      const sector = rocketActions.getRocketSectorCoordinate(rocket);
      const planet = planetLocations.find((item) => item.x === sector?.x && item.y === sector?.y);
      if (planet?.planetId === "jupiter" || planet?.planetId === "saturn") {
        return { rocket, planetId: planet.planetId, planet };
      }
    }
    return null;
  }

  function getChongLandProbeOptions(effect, target) {
    return {
      skipCost: true,
      target: target || { type: "planet" },
      historyLabel: effect.label,
      allowSatelliteWithoutTech: Boolean(effect.options?.allowSatellite),
    };
  }

  function getChongLandOptions(effect) {
    return abilities.planet.getLandOptions(createActionContext(), {
      allowSatelliteWithoutTech: Boolean(effect.options?.allowSatellite),
    });
  }

  function openChongLandTargetPicker(effect) {
    const options = getChongLandOptions(effect);
    if (!options.ok) {
      rocketState.statusNote = options.message || "无法登陆";
      renderStateReadout();
      return { ok: false, message: rocketState.statusNote };
    }

    if (options.choices.length <= 1) {
      return executeChongTravelForPickupWithLandTarget(effect, options.defaultTarget || options.choices[0].target);
    }

    openLandTargetPicker({
      ...options,
      getOptions: () => getChongLandOptions(effect),
      onConfirm: (choice) => executeChongTravelForPickupWithLandTarget(effect, choice.target),
      onCancel: () => {
        rocketState.statusNote = "已取消虫族登陆目标选择";
        renderStateReadout();
      },
    });
    rocketState.statusNote = `${effect.label}：请选择登陆主星或卫星`;
    renderStateReadout();
    return { ok: true, awaitingChoice: true, message: rocketState.statusNote };
  }

  function executeChongTravelForPickupEffect(effect) {
    if (
      effect?.type === chong?.EFFECT_TYPES?.CHONG_LAND_FOR_PICKUP
      && effect.options?.allowSatellite
    ) {
      return openChongLandTargetPicker(effect);
    }
    return executeChongTravelForPickupWithLandTarget(effect, { type: "planet" });
  }

  function executeChongTravelForPickupWithLandTarget(effect, landTarget = { type: "planet" }) {
    if (!chong) return null;
    if (pendingActionEffectFlow) pendingActionEffectFlow.chongPickupContext = null;

    beginEffectHistoryStep(effect.label);
    let result = null;
    if (effect.type === chong.EFFECT_TYPES.CHONG_ORBIT_OR_LAND_FOR_PICKUP) {
      result = abilities.executeAbility("orbitProbe", createActionContext(), {
        skipCost: true,
        historyLabel: effect.label,
      });
      if (!result.ok) {
        result = abilities.executeAbility("landProbe", createActionContext(), {
          ...getChongLandProbeOptions(effect, landTarget),
        });
      }
    } else {
      result = abilities.executeAbility("landProbe", createActionContext(), {
        ...getChongLandProbeOptions(effect, landTarget),
      });
    }

    if (!result.ok) {
      endEffectHistoryStep();
      rocketState.statusNote = result.message;
      renderStateReadout();
      return result;
    }

    recordAbilityCommands(result);
    if (result.removedRocketId != null) removeRocketElement(result.removedRocketId);
    syncPlanetOrbitLandMarkers();
    renderRockets();
    renderPlayerStats();

    if (pendingActionEffectFlow) {
      pendingActionEffectFlow.chongPickupContext = {
        planetId: result.planetId || null,
        actionEffectId: effect.id,
        cardId: pendingActionEffectFlow.card?.id || null,
        cardIndex: effect.options?.cardIndex ?? null,
      };
    }
    effect.result = {
      ...result,
      payload: {
        ...(result.payload || {}),
        chongPickupPlanetId: result.planetId || null,
      },
    };
    rocketState.statusNote = result.message;
    completeCurrentActionEffect();
    renderStateReadout();
    return effect.result;
  }

  function executeChongPickupFossilEffect(effect) {
    if (!chong) return null;
    const currentPlayer = getCurrentPlayer();
    const card = pendingActionEffectFlow?.card || null;
    const task = card?.chongTask || chong.getCardTask(effect.options?.cardIndex);
    const beforeAlienState = structuredClone(alienGameState);
    const planetId = pendingActionEffectFlow?.chongPickupContext?.planetId || null;

    if (!planetId) {
      return finishChongFossilEffect(`${effect.label}：没有上一段登陆/环绕结果`, { planetId: null });
    }

    if (planetId !== "jupiter" && planetId !== "saturn") {
      return finishChongFossilEffect(`${effect.label}：不在木星/土星，不能拾取化石`, { planetId });
    }

    const available = chong.getAvailablePlanetFossils(alienGameState, planetId);
    if (!available.length) {
      return finishChongFossilEffect(`${effect.label}：${getChongPlanetLabel(planetId)}没有可拾取化石`, { planetId });
    }

    return openChongFossilChoiceDialog({
      mode: "pickup",
      player: currentPlayer,
      planetId,
      card,
      task,
      fromEffectFlow: true,
      effectLabel: effect.label,
      title: "拾取虫族化石",
      subtitle: `${getChongPlanetLabel(planetId)}化石已查看。选择 1 枚作为可移动棋子放到太阳系。`,
      beforeAlienState,
      beforePlayerState: structuredClone(playerState),
      beforeCardState: structuredClone(cardState),
    });
  }

  function executeChongProbePlanetFossilRewardEffect(effect) {
    if (!chong) return null;
    const placement = findChongProbeFossilPlanet();
    if (!placement) {
      return finishAutomaticRewardEffect(effect, {
        ok: true,
        undoable: true,
        message: "虫族化石：当前没有标准探测器停在木星/土星",
      });
    }
    const fossils = chong.getAvailablePlanetFossils(alienGameState, placement.planetId);
    if (!fossils.length) {
      return finishAutomaticRewardEffect(effect, {
        ok: true,
        undoable: true,
        message: `${getChongPlanetLabel(placement.planetId)}没有可结算化石`,
      });
    }
    return openChongFossilChoiceDialog({
      mode: "reward",
      player: getCurrentPlayer(),
      planetId: placement.planetId,
      fromEffectFlow: true,
      effectLabel: effect.label,
      title: "查看并结算化石",
      subtitle: `${getChongPlanetLabel(placement.planetId)}化石已查看。选择 1 枚只结算奖励，不移除化石。`,
      beforeAlienState: structuredClone(alienGameState),
      beforePlayerState: structuredClone(playerState),
      beforeCardState: structuredClone(cardState),
    });
  }

  function executeChongChoosePlanetFossilRewardEffect(effect) {
    if (!chong) return null;
    const fossils = chong.getAvailablePlanetFossils(alienGameState);
    if (!fossils.length) {
      return finishAutomaticRewardEffect(effect, {
        ok: true,
        undoable: true,
        message: "木星/土星没有可结算化石",
      });
    }
    return openChongFossilChoiceDialog({
      mode: "reward",
      player: getCurrentPlayer(),
      planetIds: ["jupiter", "saturn"],
      fromEffectFlow: true,
      effectLabel: effect.label,
      title: "选择星球化石奖励",
      subtitle: "选择木星或土星 1 枚化石，只结算奖励，不移除化石。",
      beforeAlienState: structuredClone(alienGameState),
      beforePlayerState: structuredClone(playerState),
      beforeCardState: structuredClone(cardState),
    });
  }

  function applyAomomoScanCostAndBonus(pending, result) {
    if (!pending || !result?.ok) return result;
    const currentPlayer = getCurrentPlayer();
    const beforePlayer = structuredClone(currentPlayer);
    const messages = [];
    const fossilCost = Math.max(0, Math.round(Number(pending.aomomoFossilCost) || 0));
    if (fossilCost > 0) {
      const cost = { aomomoFossils: fossilCost };
      if (!players.canAfford(currentPlayer, cost)) {
        Object.assign(currentPlayer, beforePlayer);
        rocketState.statusNote = `化石不足：需要 ${fossilCost} 化石`;
        renderPlayerStats();
        renderStateReadout();
        return { ok: false, message: rocketState.statusNote };
      }
      const spend = players.spendResources(currentPlayer, cost);
      if (!spend.ok) return spend;
      messages.push(`支付${fossilCost}化石`);
    }
    const isAomomoScan = result.nebulaId === aomomo?.NEBULA_ID;
    if (isAomomoScan && pending.aomomoScanBonus?.gainFossil) {
      players.gainResources(currentPlayer, { aomomoFossils: 1 });
      messages.push("奥陌陌扫描+1化石");
    }
    if (isAomomoScan && pending.aomomoScanBonus?.score) {
      const score = Math.max(0, Math.round(Number(pending.aomomoScanBonus.score) || 0));
      if (score > 0) {
        players.gainResources(currentPlayer, { score });
        messages.push(`奥陌陌扫描+${score}分`);
      }
    }
    if (messages.length) {
      recordHistoryCommand(historyCommands.createRestorePlayerCommand(
        currentPlayer,
        beforePlayer,
        "恢复奥陌陌扫描附加奖励前玩家状态",
      ));
      result.message = `${result.message}；${messages.join("；")}`;
      rocketState.statusNote = result.message;
    }
    return result;
  }

  function openAomomoCurrentXScanEffect(effect) {
    const currentX = getAomomoCurrentX();
    if (currentX == null) {
      rocketState.statusNote = "奥陌陌星球尚未启用，无法扫描奥陌陌所在扇区";
      renderStateReadout();
      return { ok: false, message: rocketState.statusNote };
    }
    const bonus = {};
    if (effect.type === aomomo.EFFECT_SCAN_AOMOMO_X_GAIN_FOSSIL) bonus.gainFossil = true;
    if (effect.type === aomomo.EFFECT_SCAN_AOMOMO_X_SCORE) bonus.score = effect.options?.score || 2;
    rocketState.statusNote = `${effect.label}：请选择奥陌陌当前 x=${currentX} 的扫描目标`;
    renderStateReadout();
    return openScanTargetPicker({
      type: "sector_scan",
      fromEffectFlow: true,
      title: effect.label,
      subtitle: "选择外圈星云或奥陌陌星球，按槽位顺序替换未替换的数据。",
      gainData: effect.options?.gainData,
      aomomoScanBonus: bonus,
      choices: buildSectorScanChoicesForX(currentX),
    });
  }

  function executeAomomoGainFossilsEffect(effect) {
    const count = Math.max(0, Math.round(Number(effect.options?.count) || 0));
    return executeGainResourcesRewardEffect({
      ...effect,
      options: { gain: { aomomoFossils: count } },
    });
  }

  function executeAomomoFossilForDataEffect(effect) {
    const currentPlayer = getCurrentPlayer();
    const cost = Math.max(1, Math.round(Number(effect.options?.cost) || 1));
    if (!players.canAfford(currentPlayer, { aomomoFossils: cost })) {
      if (effect.options?.optional) {
        return finishAutomaticRewardEffect(effect, {
          ok: true,
          undoable: true,
          message: `${effect.label}：没有足够化石，已跳过`,
        });
      }
      rocketState.statusNote = `化石不足：需要 ${cost} 化石`;
      renderStateReadout();
      return { ok: false, message: rocketState.statusNote };
    }
    const beforePlayer = structuredClone(currentPlayer);
    beginEffectHistoryStep(effect.label);
    players.spendResources(currentPlayer, { aomomoFossils: cost });
    const dataCount = Math.max(0, Math.round(Number(effect.options?.dataCount) || 1));
    const results = [];
    for (let index = 0; index < dataCount; index += 1) {
      results.push(data.gainData(currentPlayer, { source: "aomomo_card" }));
    }
    recordHistoryCommand(historyCommands.createRestorePlayerCommand(
      currentPlayer,
      beforePlayer,
      "恢复奥陌陌化石换数据前玩家状态",
    ));
    const gained = results.filter((item) => item.ok).length;
    return finishAutomaticRewardEffect(effect, {
      ok: true,
      undoable: true,
      message: `${effect.label}：支付${cost}化石，获得${gained}/${dataCount}数据`,
      payload: { results },
    }, [renderPlayerHand]);
  }

  function openAomomoFossilAnyScanEffect(effect) {
    const currentPlayer = getCurrentPlayer();
    const cost = Math.max(1, Math.round(Number(effect.options?.cost) || 1));
    if (!players.canAfford(currentPlayer, { aomomoFossils: cost })) {
      if (effect.options?.optional) {
        return finishAutomaticRewardEffect(effect, {
          ok: true,
          undoable: true,
          message: `${effect.label}：没有足够化石，已跳过`,
        });
      }
      rocketState.statusNote = `化石不足：需要 ${cost} 化石`;
      renderStateReadout();
      return { ok: false, message: rocketState.statusNote };
    }
    rocketState.statusNote = `${effect.label}：请选择 0-7 号扇区之一`;
    renderStateReadout();
    return openScanTargetPicker({
      type: "sector_scan",
      fromEffectFlow: true,
      title: effect.label,
      subtitle: "支付化石后扫描任意扇区。",
      gainData: effect.options?.gainData,
      aomomoFossilCost: cost,
      choices: buildSectorScanChoicesForXs(Array.from({ length: 8 }, (_item, x) => x)),
    });
  }

  function executeAomomoLandEffect(effect, options = {}) {
    beginEffectHistoryStep(effect.label);
    const beforePlayer = structuredClone(getCurrentPlayer());
    const result = abilities.executeAbility("landProbe", createActionContext(), {
      skipCost: true,
      target: { type: "planet" },
    });
    if (!result.ok) {
      endEffectHistoryStep();
      rocketState.statusNote = result.message;
      renderStateReadout();
      return result;
    }
    recordAbilityCommands(result);
    const score = result.planetId === aomomo?.PLANET_ID
      ? Math.max(0, Math.round(Number(options.scoreIfAomomo ?? effect.options?.score) || 0))
      : 0;
    if (score > 0) {
      players.gainResources(getCurrentPlayer(), { score });
      recordHistoryCommand(historyCommands.createRestorePlayerCommand(
        getCurrentPlayer(),
        beforePlayer,
        "恢复奥陌陌登陆得分前玩家状态",
      ));
      result.message = `${result.message}；奥陌陌登陆+${score}分`;
    }
    effect.result = result;
    rocketState.statusNote = result.message;
    renderRockets();
    renderAlienPanels();
    renderPlayerStats();
    completeCurrentActionEffect();
    renderStateReadout();
    return result;
  }

  function executeAomomoFossilMoveAndLandEffect(effect) {
    const currentPlayer = getCurrentPlayer();
    const cost = Math.max(1, Math.round(Number(effect.options?.cost) || 1));
    if (!players.canAfford(currentPlayer, { aomomoFossils: cost })) {
      if (effect.options?.optional !== false) {
        return finishAutomaticRewardEffect(effect, {
          ok: true,
          undoable: true,
          message: `${effect.label}：没有足够化石，已跳过`,
        });
      }
      rocketState.statusNote = `化石不足：需要 ${cost} 化石`;
      renderStateReadout();
      return { ok: false, message: rocketState.statusNote };
    }
    const beforePlayer = structuredClone(currentPlayer);
    beginEffectHistoryStep(effect.label);
    players.spendResources(currentPlayer, { aomomoFossils: cost });
    recordHistoryCommand(historyCommands.createRestorePlayerCommand(
      currentPlayer,
      beforePlayer,
      "恢复奥陌陌移动登陆前玩家状态",
    ));
    insertActionEffectsAfterCurrent([
      {
        id: `${effect.id || "aomomo"}-move`,
        type: cardEffects.EFFECT_TYPES.CARD_MOVE,
        label: "奥陌陌：2移动",
        icon: "movement",
        options: { movementPoints: Math.max(1, Math.round(Number(effect.options?.movement) || 2)) },
      },
      {
        id: `${effect.id || "aomomo"}-land`,
        type: "aomomo_land_only",
        label: "奥陌陌：登陆",
        icon: "land",
        options: {},
      },
    ]);
    effect.result = {
      ok: true,
      undoable: true,
      message: `${effect.label}：支付${cost}化石，追加2移动与登陆`,
    };
    rocketState.statusNote = effect.result.message;
    renderPlayerStats();
    completeCurrentActionEffect();
    renderStateReadout();
    return effect.result;
  }

  function executeAomomoSpendFossilsScoreEffect(effect) {
    const currentPlayer = getCurrentPlayer();
    const cost = Math.max(0, Math.round(Number(effect.options?.cost) || 0));
    const score = Math.max(0, Math.round(Number(effect.options?.score) || 0));
    if (!players.canAfford(currentPlayer, { aomomoFossils: cost })) {
      rocketState.statusNote = `化石不足：需要 ${cost} 化石`;
      renderStateReadout();
      return { ok: false, message: rocketState.statusNote };
    }
    const beforePlayer = structuredClone(currentPlayer);
    beginEffectHistoryStep(effect.label);
    if (cost > 0) players.spendResources(currentPlayer, { aomomoFossils: cost });
    if (score > 0) players.gainResources(currentPlayer, { score });
    recordHistoryCommand(historyCommands.createRestorePlayerCommand(
      currentPlayer,
      beforePlayer,
      "恢复奥陌陌化石得分前玩家状态",
    ));
    return finishAutomaticRewardEffect(effect, {
      ok: true,
      undoable: true,
      message: `${effect.label}：支付${cost}化石，获得${score}分`,
    });
  }

  function executeCardEffect(effect) {
    const types = cardEffects.EFFECT_TYPES;
    switch (effect.type) {
      case types.SCAN_NEBULA:
        return executeCardFixedNebulaScanEffect(effect);
      case types.SCAN_COLOR_CHOICE:
        return openCardColorScanEffect(effect);
      case types.PUBLIC_SCAN:
        return openCardPublicScanEffect(effect);
      case types.ANY_SECTOR_SCAN:
        return openCardAnySectorScanEffect(effect);
      case types.SCAN_ACTION:
        return expandCardScanActionEffect(effect);
      case types.RESEARCH_TECH:
        return executeCardResearchTechEffect(effect);
      case types.FREE_MOVE:
      case types.CARD_MOVE:
        return beginCardMoveEffect(effect);
      case types.DRAW_THEN_SCAN:
        return openCardDrawThenScanEffect(effect);
      case types.DRAW_THEN_DISCARD_ACTION:
        return executeCardDrawThenDiscardActionEffect(effect);
      case types.YICHANGDIAN_NEXT_ANOMALY_REWARD:
        return executeYichangdianNextAnomalyRewardEffect(effect);
      case types.YICHANGDIAN_ANOMALY_SIGNAL_SCORE:
        return executeYichangdianAnomalySignalScoreEffect(effect);
      case types.YICHANGDIAN_ALIEN_TRACE:
        return executeYichangdianAlienTraceEffect(effect);
      case types.YICHANGDIAN_PUBLIC_ALL:
        return executeYichangdianPublicAllEffect(effect);
      case types.YICHANGDIAN_DRAW_THEN_TWO_CORNERS:
        return executeYichangdianDrawThenTwoCornersEffect(effect);
      case types.YICHANGDIAN_NEXT_ANOMALY_SCAN:
        return executeYichangdianNextAnomalyScanEffect(effect);
      case types.YICHANGDIAN_LAUNCH_ANOMALY_MOVE:
        return executeYichangdianLaunchAnomalyMoveEffect(effect);
      case chong?.EFFECT_TYPES?.CHONG_LAND_FOR_PICKUP:
      case chong?.EFFECT_TYPES?.CHONG_ORBIT_OR_LAND_FOR_PICKUP:
        return executeChongTravelForPickupEffect(effect);
      case chong?.EFFECT_TYPES?.CHONG_PICKUP_FOSSIL:
        return executeChongPickupFossilEffect(effect);
      case chong?.EFFECT_TYPES?.CHONG_PROBE_PLANET_FOSSIL_REWARD:
        return executeChongProbePlanetFossilRewardEffect(effect);
      case chong?.EFFECT_TYPES?.CHONG_CHOOSE_PLANET_FOSSIL_REWARD:
        return executeChongChoosePlanetFossilRewardEffect(effect);
      case amiba?.EFFECT_TYPES?.CHOOSE_SYMBOL_REWARD:
        return openAmibaSymbolChoiceDialog({
          effect,
          region: effect.options?.region,
          player: getCurrentPlayer(),
          fromEffectFlow: true,
          beforeAlienState: structuredClone(alienGameState),
          beforePlayerState: structuredClone(playerState),
          beforeCardState: structuredClone(cardState),
        });
      case amiba?.EFFECT_TYPES?.REMOVE_TRACE_FOR_REGION_REWARD:
        return openAmibaTraceRemovalDialog(effect);
      case runezu?.EFFECT_TYPES?.SYMBOL_REWARD:
        return executeRunezuSymbolRewardEffect(effect);
      case runezu?.EFFECT_TYPES?.SYMBOL_BRANCH:
        return openRunezuSymbolBranchDialog(effect);
      case aomomo?.EFFECT_GAIN_FOSSILS:
        return executeAomomoGainFossilsEffect(effect);
      case aomomo?.EFFECT_SCAN_AOMOMO_X:
      case aomomo?.EFFECT_SCAN_AOMOMO_X_GAIN_FOSSIL:
      case aomomo?.EFFECT_SCAN_AOMOMO_X_SCORE:
        return openAomomoCurrentXScanEffect(effect);
      case aomomo?.EFFECT_LAND_SCORE_IF_AOMOMO:
        return executeAomomoLandEffect(effect);
      case aomomo?.EFFECT_FOSSIL_FOR_DATA:
        return executeAomomoFossilForDataEffect(effect);
      case aomomo?.EFFECT_FOSSIL_FOR_MOVE_AND_LAND:
        return executeAomomoFossilMoveAndLandEffect(effect);
      case aomomo?.EFFECT_FOSSIL_FOR_ANY_SCAN:
        return openAomomoFossilAnyScanEffect(effect);
      case aomomo?.EFFECT_SPEND_FOSSILS_GAIN_SCORE:
        return executeAomomoSpendFossilsScoreEffect(effect);
      case "aomomo_land_only":
        return executeAomomoLandEffect(effect);
      default:
        return null;
    }
  }

  function openPickCardRewardEffect(effect) {
    const currentPlayer = getCurrentPlayer();
    pendingCardSelectionAction = null;
    const result = beginCardSelection({
      type: "planet_reward_pick_card",
      player: currentPlayer,
      effectLabel: effect.label,
      allowBlindDraw: true,
    });
    if (!result.ok) {
      rocketState.statusNote = result.message;
      renderStateReadout();
    }
    return result;
  }

  function openTechBonusPickCardEffect(effect) {
    const selection = getResearchTechSelectionPayload();
    const currentPlayer = getCurrentPlayer();
    const result = beginCardSelection({
      type: "tech_bonus_pick_card",
      player: currentPlayer,
      effectLabel: effect.label,
      bonusId: effect.options?.bonusId || selection?.bonusId,
      firstTake: Boolean(effect.options?.firstTake ?? selection?.firstTake),
      selection,
      allowBlindDraw: false,
    });
    if (!result.ok) {
      rocketState.statusNote = result.message;
      renderStateReadout();
    }
    return result;
  }

  function openInitialIncomeEffect(effect) {
    const playerId = effect?.options?.playerId;
    const incomePlayer = getPlayerById(playerId) || getCurrentPlayer();
    if (playerId && incomePlayer && playerState.currentPlayerId !== incomePlayer.id) {
      playerState.currentPlayerId = incomePlayer.id;
      renderDebugPlayerSwitch();
      renderPlayerStats();
      renderPlayerHand();
    }

    const result = beginDiscardSelection(1, {
      type: "initial_income",
      player: incomePlayer,
      fromEffectFlow: true,
      effectLabel: effect.label,
    });
    if (!result.ok) {
      rocketState.statusNote = result.message;
      renderStateReadout();
      effect.result = { ok: false, undoable: false, message: result.message };
      completeCurrentActionEffect("skipped");
    }
    return result;
  }

  function openIncomeRewardEffect(effect) {
    const currentPlayer = getCurrentPlayer();
    const result = beginDiscardSelection(1, {
      type: "planet_reward_income",
      player: currentPlayer,
      beforePlayerState: structuredClone(currentPlayer),
      beforeCardState: structuredClone(cardState),
      effectLabel: effect.label,
    });
    if (!result.ok) {
      rocketState.statusNote = result.message;
      renderStateReadout();
    }
    return result;
  }

  function executeBanrenmaGainIncomeEffect(effect) {
    const currentPlayer = getCurrentPlayer();
    const gain = effect.options?.gain || {};
    const beforePlayer = structuredClone(currentPlayer);
    beginEffectHistoryStep(effect.label);
    players.gainIncome(currentPlayer, gain, {
      blindDraw: (targetPlayer) => blindDrawCardForPlayer(targetPlayer),
      gainData: (targetPlayer) => data.gainData(targetPlayer, { source: "banrenma-income" }),
    });
    recordHistoryCommand(historyCommands.createRestorePlayerCommand(
      currentPlayer,
      beforePlayer,
      "恢复半人马收入前玩家状态",
    ));
    effect.result = {
      ok: true,
      undoable: true,
      message: `收入增加：${formatIncomeGain(gain)}`,
    };
    rocketState.statusNote = effect.result.message;
    renderPlayerStats();
    completeCurrentActionEffect();
    renderStateReadout();
    return effect.result;
  }

  function openNebulaChoiceRewardEffect(effect) {
    const nebulaIds = effect.options?.nebulaIds || [];
    rocketState.statusNote = `${effect.label}：请选择 1 个星云`;
    renderStateReadout();
    return openScanTargetPicker({
      type: "sector_scan",
      fromEffectFlow: true,
      title: effect.label,
      subtitle: "按槽位顺序替换未替换的数据。",
      choices: expandScanChoicesWithAomomoTargets(nebulaIds.map((nebulaId) => buildNebulaScanChoice(nebulaId))),
    });
  }

  function openAlienTraceRewardEffect(effect) {
    const traceType = effect.options?.traceType || null;
    pendingAlienTraceAction = {
      type: "planet_reward_alien_trace",
      beforeAlienState: structuredClone(alienGameState),
      beforePlayerState: structuredClone(playerState),
      effectLabel: effect.label,
    };
    return openAlienTracePicker({
      allowedTraceTypes: traceType ? [traceType] : aliens.TRACE_TYPES,
    });
  }

  function executePlanetRewardEffect(effect) {
    switch (effect.type) {
      case planetRewards.EFFECT_TYPES.GAIN_RESOURCES:
        return executeGainResourcesRewardEffect(effect);
      case planetRewards.EFFECT_TYPES.GAIN_DATA:
        return executeGainDataRewardEffect(effect);
      case planetRewards.EFFECT_TYPES.LAUNCH:
        return executeLaunchRewardEffect(effect);
      case planetRewards.EFFECT_TYPES.DRAW_CARDS:
        return executeDrawCardsRewardEffect(effect);
      case planetRewards.EFFECT_TYPES.PICK_CARD:
        return openPickCardRewardEffect(effect);
      case planetRewards.EFFECT_TYPES.INCOME:
        return openIncomeRewardEffect(effect);
      case planetRewards.EFFECT_TYPES.SCAN_PLANET_SECTOR:
        return executeSectorScanAtPlanet(effect.options?.planetId, effect.label);
      case planetRewards.EFFECT_TYPES.CHOOSE_NEBULA_SCAN:
      case planetRewards.EFFECT_TYPES.CHOOSE_COLORED_NEBULA_SCAN:
        return openNebulaChoiceRewardEffect(effect);
      case planetRewards.EFFECT_TYPES.ALIEN_TRACE:
        return openAlienTraceRewardEffect(effect);
      default:
        return null;
    }
  }

  function executeResearchTechEffect(effect) {
    if (!effect) return null;

    switch (effect.type) {
      case "research_tech_select":
        rocketState.statusNote = "科技：请选择要研究的科技片";
        renderStateReadout();
        return { ok: true, message: rocketState.statusNote };
      case "research_tech_rotate": {
        const result = abilities.executeAbility("researchTechRotate", createActionContext());
        if (!result.ok) {
          rocketState.statusNote = result.message;
          renderStateReadout();
          return result;
        }
        effect.result = result;
        rocketState.statusNote = result.message;
        renderWheels();
        renderRockets();
        renderRotateStateToken();
        renderPlayerStats();
        completeCurrentActionEffect();
        renderStateReadout();
        return result;
      }
      case "research_tech_bonus": {
        const selection = getResearchTechSelectionPayload();
        const bonusId = effect.options?.bonusId || selection?.bonusId;
        const bonusEffect = tech.BONUS_EFFECTS[bonusId];
        if (bonusEffect?.cardSelection) {
          return openTechBonusPickCardEffect(effect);
        }
        const result = abilities.executeAbility("researchTechBonus", createActionContext(), {
          bonusId,
          firstTake: Boolean(effect.options?.firstTake ?? selection?.firstTake),
        });
        if (result.ok) {
          result.events = [
            ...(result.events || []),
            {
              type: "researchTech",
              playerId: getCurrentPlayer()?.id || null,
              playerColor: getCurrentPlayer()?.color || null,
              techType: selection?.techType || null,
              tileId: selection?.tileId || null,
              source: pendingActionEffectFlow?.actionType || "tech",
            },
          ];
        }
        effect.result = result;
        rocketState.statusNote = result.message;
        renderPlayerStats();
        completeCurrentActionEffect();
        renderStateReadout();
        return result;
      }
      default:
        return null;
    }
  }

  function executeActionEffect(effect) {
    if (!effect || effect.status !== "active") return { ok: false, message: "当前效果不可执行" };

    const techResult = executeResearchTechEffect(effect);
    if (techResult) return techResult;

    const cardResult = executeCardEffect(effect);
    if (cardResult) return cardResult;

    const rewardResult = planetRewards?.EFFECT_TYPES ? executePlanetRewardEffect(effect) : null;
    if (rewardResult) return rewardResult;

    if (banrenma && effect.type === banrenma.EFFECT_GAIN_INCOME) {
      return executeBanrenmaGainIncomeEffect(effect);
    }

    switch (effect.type) {
      case "industry_sentinel_corner":
        return executeIndustrySentinelCornerEffect(effect);
      case "industry_helios_passive_reward":
        return executeIndustryHeliosPassiveRewardEffect(effect);
      case "fangzhou_launch": {
        beginEffectHistoryStep(effect.label);
        const result = abilities.executeAbility("launchProbe", createActionContext(), {
          skipCost: true,
          source: "fangzhou",
          ignoreRocketLimit: true,
        });
        if (!result.ok) {
          endEffectHistoryStep();
          rocketState.statusNote = result.message;
          renderStateReadout();
          return result;
        }
        recordAbilityCommands(result);
        effect.result = result;
        rocketState.statusNote = result.message;
        renderRockets();
        renderPlayerStats();
        completeCurrentActionEffect();
        renderStateReadout();
        return result;
      }
      case "fangzhou_additional_public_scan": {
        const currentPlayer = getCurrentPlayer();
        const count = Math.max(0, Math.round(Number(effect.options?.count) || 1));
        const beforePlayer = structuredClone(currentPlayer);
        beginEffectHistoryStep(effect.label);
        currentPlayer.resources.additionalPublicScan = Math.min(
          2,
          (Number(currentPlayer.resources.additionalPublicScan) || 0) + count,
        );
        recordHistoryCommand(historyCommands.createRestorePlayerCommand(
          currentPlayer,
          beforePlayer,
          "恢复方舟公共扫描标记前玩家状态",
        ));
        effect.result = {
          ok: true,
          undoable: true,
          message: `公共弃牌扫描 +${count}`,
        };
        rocketState.statusNote = effect.result.message;
        renderPlayerStats();
        completeCurrentActionEffect();
        renderStateReadout();
        return effect.result;
      }
      case "initial_income":
        return openInitialIncomeEffect(effect);
      case scanEffects.EFFECT_TYPES.PAY_SCAN_COST: {
        beginEffectHistoryStep(effect.label);
        const result = abilities.executeAbility("payScanCost", createActionContext(), {
          cost: scanEffects.SCAN_COST,
        });
        if (!result.ok) {
          endEffectHistoryStep();
          rocketState.statusNote = result.message;
          renderStateReadout();
          return result;
        }
        recordAbilityCommands(result);
        effect.result = result;
        rocketState.statusNote = result.message;
        renderPlayerStats();
        completeCurrentActionEffect();
        renderStateReadout();
        return result;
      }
      case scanEffects.EFFECT_TYPES.EARTH_SECTOR_SCAN:
        return executeSectorScanAtPlanet("earth");
      case scanEffects.EFFECT_TYPES.IMPROVED_SECTOR_SCAN:
        return executeImprovedEarthSectorScanEffect();
      case scanEffects.EFFECT_TYPES.MERCURY_SECTOR_SCAN:
        return executeSectorScanAtPlanet("mercury");
      case scanEffects.EFFECT_TYPES.PUBLIC_CARD_SCAN: {
        const scanPlayer = getCurrentPlayer();
        const maxSelectable = getPublicScanMaxSelectable(scanPlayer);
        rocketState.statusNote = maxSelectable > 1
          ? `公共牌区扫描：最多选择 ${maxSelectable} 张公共牌`
          : "公共牌区扫描：请选择一张公共牌";
        renderStateReadout();
        return beginCardSelection(createPublicScanPendingAction(scanPlayer, true));
      }
      case scanEffects.EFFECT_TYPES.HAND_SCAN: {
        const currentPlayer = getCurrentPlayer();
        if (!currentPlayer?.hand?.length) {
          rocketState.statusNote = "没有手牌可用于扫描";
          renderStateReadout();
          return { ok: false, message: rocketState.statusNote };
        }
        pendingHandScanAction = { type: "hand_scan", player: currentPlayer, fromEffectFlow: true };
        rocketState.statusNote = "手牌扫描：请选择一张手牌弃除并扫描";
        syncHandScanSelectionChrome();
        updateActionButtons();
        renderStateReadout();
        return { ok: true, message: rocketState.statusNote };
      }
      case scanEffects.EFFECT_TYPES.SCAN_ACTION_4:
        return openScanAction4Picker();
      default:
        return { ok: false, message: `未知效果类型: ${effect.type}` };
    }
  }

  function handleActionEffectButtonClick(effectIndex) {
    if (!pendingActionEffectFlow) return;
    if (Number(effectIndex) !== pendingActionEffectFlow.currentIndex) return;

    const effect = getCurrentActionEffect();
    executeActionEffect(effect);
  }

  function beginScanAction() {
    if (!canStartMainAction()) {
      rocketState.statusNote = "本回合已经开始或完成主要行动";
      renderStateReadout();
      return { ok: false, message: rocketState.statusNote };
    }
    if (isActionEffectFlowActive()) {
      return { ok: false, message: "请先完成当前行动的效果" };
    }
    if (isTechTilePickingActive()) {
      rocketState.statusNote = "请先完成科技选择";
      renderStateReadout();
      return { ok: false, message: rocketState.statusNote };
    }
    if (isCardSelectionActive()) {
      rocketState.statusNote = "请先完成精选";
      renderStateReadout();
      return { ok: false, message: rocketState.statusNote };
    }
    if (isDiscardSelectionActive()) {
      rocketState.statusNote = "请先完成弃牌";
      renderStateReadout();
      return { ok: false, message: rocketState.statusNote };
    }
    if (isPlayCardSelectionActive()) {
      rocketState.statusNote = "请先完成打牌";
      renderStateReadout();
      return { ok: false, message: rocketState.statusNote };
    }
    if (isMovePaymentSelectionActive()) {
      rocketState.statusNote = "请先完成移动";
      renderStateReadout();
      return { ok: false, message: rocketState.statusNote };
    }
    if (isHandScanSelectionActive()) {
      rocketState.statusNote = "请先完成手牌扫描";
      renderStateReadout();
      return { ok: false, message: rocketState.statusNote };
    }
    const currentPlayer = getCurrentPlayer();
    const check = scanEffects.canExecuteScan(currentPlayer);
    if (!check.ok) {
      rocketState.statusNote = check.message;
      renderStateReadout();
      return check;
    }

    startActionLogDraft("scan", "扫描行动", { source: HISTORY_SOURCE_MAIN, player: currentPlayer });
    actionHistory.beginSession("scan", "扫描行动");
    pendingActionEffectFlow = abilities.chain.startAbilityChain(
      "scan",
      "扫描行动",
      scanEffects.buildScanEffectQueue(currentPlayer),
    );
    pendingActionEffectFlow.playerId = currentPlayer.id;

    els.appWrap?.classList.toggle("action-effect-flow-active", true);
    rocketState.statusNote = "扫描：请依次点击能力效果";
    renderPlayerStats();
    activateNextActionEffect();
    return { ok: true, message: rocketState.statusNote };
  }

  function resize() {
    const h = window.innerHeight;
    const boardWidth = els.boardShell.clientWidth || window.innerWidth;
    const boardHeight = h - 160;
    const boardSize = Math.floor(Math.max(220, Math.min(boardWidth, boardHeight)));
    els.playerCommand.style.width = `${boardSize}px`;
    els.wheelWrap.style.width = `${boardSize}px`;
    els.wheelWrap.style.height = `${boardSize}px`;
    els.planetsReference.style.width = `${boardSize}px`;
    if (els.buttonWrap) {
      els.buttonWrap.style.width = `${boardSize}px`;
    }
    layoutPlayerHandFan();
    layoutReservedCardRows();
    alignAlienPanelsToPlanets();
    renderAlienPanels();
    renderTechBoard();
    if (moveHighlightRocketId != null) scheduleRenderMoveArrows();
  }

  function syncTechRenderContext() {
    techRenderContext.supplyStage = els.techStage;
    techRenderContext.playerBoardTechLayer = els.playerBoardTechLayer;
    techRenderContext.supplySlots = Object.fromEntries(
      [...document.querySelectorAll(".tech-slot[data-tech-slot]")].map((slot) => [
        slot.dataset.techSlot,
        slot,
      ]),
    );
  }

  function getAlienTraceLayer(alienSlotId) {
    return [...els.alienTraceLayers].find(
      (layer) => Number(layer.dataset.alienSlot) === alienSlotId,
    ) || null;
  }

  function getAlienJiuzheTraceLayer(alienSlotId) {
    return [...els.alienJiuzheTraceLayers].find(
      (layer) => Number(layer.dataset.alienSlot) === alienSlotId,
    ) || null;
  }

  function getAlienYichangdianCardArea(alienSlotId) {
    return [...els.alienYichangdianCardAreas].find(
      (element) => Number(element.dataset.alienSlot) === alienSlotId,
    ) || null;
  }

  function getAlienBanrenmaCardArea(alienSlotId) {
    return [...els.alienBanrenmaCardAreas].find(
      (element) => Number(element.dataset.alienSlot) === alienSlotId,
    ) || null;
  }

  function getAlienChongCardArea(alienSlotId) {
    return [...els.alienChongCardAreas].find(
      (element) => Number(element.dataset.alienSlot) === alienSlotId,
    ) || null;
  }

  function getAlienAmibaCardArea(alienSlotId) {
    return [...els.alienAmibaCardAreas].find(
      (element) => Number(element.dataset.alienSlot) === alienSlotId,
    ) || null;
  }

  function getAlienAomomoCardArea(alienSlotId) {
    return [...els.alienAomomoCardAreas].find(
      (element) => Number(element.dataset.alienSlot) === alienSlotId,
    ) || null;
  }

  function getAlienRunezuCardArea(alienSlotId) {
    return [...els.alienRunezuCardAreas].find(
      (element) => Number(element.dataset.alienSlot) === alienSlotId,
    ) || null;
  }

  function getAlienJiuzheThresholdElement(alienSlotId) {
    return [...els.alienJiuzheThresholds].find(
      (element) => Number(element.dataset.alienSlot) === alienSlotId,
    ) || null;
  }

  function getAlienBanrenmaScoremarkElement(alienSlotId) {
    return [...els.alienBanrenmaScoremarks].find(
      (element) => Number(element.dataset.alienSlot) === alienSlotId,
    ) || null;
  }

  function getAlienBackImage(alienSlotId) {
    return document.querySelector(`.alien-panel[data-alien-slot="${alienSlotId}"] .alien-back`);
  }

  function createJiuzheThresholdNode(kind, iconSrc, score) {
    const item = document.createElement("div");
    const icon = document.createElement("img");
    const scoreEl = document.createElement("span");
    item.className = "alien-jiuzhe-threshold";
    item.dataset.jiuzheThreshold = kind;
    icon.className = "alien-jiuzhe-threshold-icon";
    icon.src = iconSrc;
    icon.alt = "";
    icon.decoding = "async";
    icon.setAttribute("aria-hidden", "true");
    scoreEl.className = "alien-jiuzhe-threshold-score";
    scoreEl.textContent = score == null ? "-" : String(score);
    item.title = kind === "free"
      ? `达到 ${score} 分：免费打出九折牌`
      : `达到 ${score} 分：支付 1 信用点打出九折牌`;
    item.append(icon, scoreEl);
    return item;
  }

  function renderJiuzheThresholds() {
    for (const alienSlotId of aliens.ALIEN_SLOT_IDS) {
      const container = getAlienJiuzheThresholdElement(alienSlotId);
      if (!container) continue;
      const visible = Boolean(jiuzhe?.isJiuzheRevealedSlot?.(alienGameState, alienSlotId));
      const state = alienGameState.jiuzhe || {};
      if (!visible) {
        container.hidden = true;
        container.replaceChildren();
        continue;
      }
      container.hidden = false;
      container.replaceChildren(
        createJiuzheThresholdNode("free", RESOURCE_ICON_SRC.jiuzheTimeFree, state.freeScoreThreshold),
        createJiuzheThresholdNode("paid", RESOURCE_ICON_SRC.jiuzheTimePaid, state.paidScoreThreshold),
      );
    }
  }

  function maybeRevealAlienAfterTrace(alienSlotId, traceResult) {
    if (!traceResult?.readyToReveal) return null;
    return aliens.revealAlien(alienGameState, alienSlotId);
  }

  function isDebugAlienTraceMode() {
    return Boolean(debugAlienTraceModeActive);
  }

  function setDebugAlienTraceModeActive(active, message = null) {
    debugAlienTraceModeActive = Boolean(active);
    if (debugAlienTraceModeActive) {
      closeAlienTracePicker();
      alienTracePickerState = {
        mode: "debug-direct",
        allowedTraceTypes: aliens.TRACE_TYPES,
      };
      rocketState.statusNote = message
        || "调试：未揭示外星人请点击 state 面板痕迹位；已揭示请点击正面痕迹位或方舟保留牌解锁";
    } else {
      if (alienTracePickerState?.mode === "debug-direct") {
        alienTracePickerState = null;
      }
      rocketState.statusNote = message || "已退出调试获取外星人痕迹模式";
    }
    els.debugAlienTraceButton?.classList.toggle("is-active", debugAlienTraceModeActive);
    if (els.debugAlienTraceButton) {
      els.debugAlienTraceButton.setAttribute("aria-pressed", debugAlienTraceModeActive ? "true" : "false");
    }
    renderAlienPanels();
    renderReservedCardsFromTaskState();
    updateActionButtons();
    renderStateReadout();
    return { ok: true, active: debugAlienTraceModeActive, message: rocketState.statusNote };
  }

  function toggleDebugAlienTraceMode() {
    return setDebugAlienTraceModeActive(!debugAlienTraceModeActive);
  }

  function enableDebugAlienTraceModeForReveal(message) {
    return setDebugAlienTraceModeActive(true, message);
  }

  function isJiuzheTracePlacementMode() {
    return isDebugAlienTraceMode()
      || (alienTracePickerState?.mode === "jiuzhe-grid"
        && Number.isInteger(Number(alienTracePickerState.selectedAlienSlotId)));
  }

  function isYichangdianTracePlacementMode() {
    return isDebugAlienTraceMode()
      || (alienTracePickerState?.mode === "yichangdian-grid"
        && Number.isInteger(Number(alienTracePickerState.selectedAlienSlotId)));
  }

  function isFangzhouTracePlacementMode() {
    return isDebugAlienTraceMode()
      || (alienTracePickerState?.mode === "fangzhou-grid"
        && Number.isInteger(Number(alienTracePickerState.selectedAlienSlotId)));
  }

  function isBanrenmaTracePlacementMode() {
    return isDebugAlienTraceMode()
      || (alienTracePickerState?.mode === "banrenma-grid"
        && Number.isInteger(Number(alienTracePickerState.selectedAlienSlotId)));
  }

  function isChongTracePlacementMode() {
    return isDebugAlienTraceMode()
      || (alienTracePickerState?.mode === "chong-grid"
        && Number.isInteger(Number(alienTracePickerState.selectedAlienSlotId)));
  }

  function isAmibaTracePlacementMode() {
    return isDebugAlienTraceMode()
      || (alienTracePickerState?.mode === "amiba-grid"
        && Number.isInteger(Number(alienTracePickerState.selectedAlienSlotId)));
  }

  function isAomomoTracePlacementMode() {
    return isDebugAlienTraceMode()
      || (alienTracePickerState?.mode === "aomomo-grid"
        && Number.isInteger(Number(alienTracePickerState.selectedAlienSlotId)));
  }

  function isRunezuTracePlacementMode() {
    return isDebugAlienTraceMode()
      || (alienTracePickerState?.mode === "runezu-grid"
        && Number.isInteger(Number(alienTracePickerState.selectedAlienSlotId)));
  }

  function canPlaceJiuzheTrace(alienSlotId, traceType, position) {
    if (!isJiuzheTracePlacementMode()) return false;
    if (!isDebugAlienTraceMode()
      && Number(alienTracePickerState.selectedAlienSlotId) !== Number(alienSlotId)) return false;
    const allowedTraceTypes = alienTracePickerState?.allowedTraceTypes || aliens.TRACE_TYPES;
    if (!allowedTraceTypes.includes(traceType)) return false;
    if (!jiuzhe?.isJiuzheRevealedSlot?.(alienGameState, alienSlotId)) return false;
    const grid = jiuzhe?.getTraceGrid?.(alienGameState, alienSlotId);
    return !grid?.[traceType]?.[position];
  }

  function canPlaceYichangdianTrace(alienSlotId, traceType, position) {
    if (!isYichangdianTracePlacementMode()) return false;
    if (!isDebugAlienTraceMode()
      && Number(alienTracePickerState.selectedAlienSlotId) !== Number(alienSlotId)) return false;
    const allowedTraceTypes = alienTracePickerState?.allowedTraceTypes || aliens.TRACE_TYPES;
    if (!allowedTraceTypes.includes(traceType)) return false;
    if (!yichangdian?.isYichangdianRevealedSlot?.(alienGameState, alienSlotId)) return false;
    const grid = yichangdian?.getTraceGrid?.(alienGameState, alienSlotId);
    return Number(position) === 1 || !grid?.[traceType]?.[position];
  }

  function canPlaceFangzhouTrace(alienSlotId, traceType, position) {
    if (!isFangzhouTracePlacementMode()) return false;
    if (!isDebugAlienTraceMode()
      && Number(alienTracePickerState.selectedAlienSlotId) !== Number(alienSlotId)) return false;
    const allowedTraceTypes = alienTracePickerState?.allowedTraceTypes || aliens.TRACE_TYPES;
    if (!allowedTraceTypes.includes(traceType)) return false;
    if (!fangzhou?.isFangzhouRevealedSlot?.(alienGameState, alienSlotId)) return false;
    const currentPlayer = getCurrentPlayer();
    return fangzhou?.canPlaceFangzhouTrace?.(
      alienGameState,
      alienSlotId,
      traceType,
      position,
      currentPlayer,
    )?.ok;
  }

  function canPlaceBanrenmaTrace(alienSlotId, traceType, position) {
    if (!isBanrenmaTracePlacementMode()) return false;
    if (!isDebugAlienTraceMode()
      && Number(alienTracePickerState.selectedAlienSlotId) !== Number(alienSlotId)) return false;
    const allowedTraceTypes = alienTracePickerState?.allowedTraceTypes || aliens.TRACE_TYPES;
    if (!allowedTraceTypes.includes(traceType)) return false;
    if (!banrenma?.isBanrenmaRevealedSlot?.(alienGameState, alienSlotId)) return false;
    const grid = banrenma?.getTraceGrid?.(alienGameState, alienSlotId);
    return Number(position) === 1 || !grid?.[traceType]?.[position];
  }

  function canPlaceChongTrace(alienSlotId, traceType, position) {
    if (!isChongTracePlacementMode()) return false;
    if (!isDebugAlienTraceMode()
      && Number(alienTracePickerState.selectedAlienSlotId) !== Number(alienSlotId)) return false;
    const allowedTraceTypes = alienTracePickerState?.allowedTraceTypes || aliens.TRACE_TYPES;
    if (!allowedTraceTypes.includes(traceType)) return false;
    if (!chong?.isChongRevealedSlot?.(alienGameState, alienSlotId)) return false;
    const currentPlayer = getCurrentPlayer();
    return chong?.canPlaceChongTrace?.(
      alienGameState,
      alienSlotId,
      traceType,
      position,
      currentPlayer,
    )?.ok;
  }

  function canPlaceAmibaTrace(alienSlotId, traceType, position) {
    if (!isAmibaTracePlacementMode()) return false;
    if (!isDebugAlienTraceMode()
      && Number(alienTracePickerState.selectedAlienSlotId) !== Number(alienSlotId)) return false;
    const allowedTraceTypes = alienTracePickerState?.allowedTraceTypes || aliens.TRACE_TYPES;
    if (!allowedTraceTypes.includes(traceType)) return false;
    if (!amiba?.isAmibaRevealedSlot?.(alienGameState, alienSlotId)) return false;
    const currentPlayer = getCurrentPlayer();
    return amiba?.canPlaceAmibaTrace?.(
      alienGameState,
      alienSlotId,
      traceType,
      position,
      currentPlayer,
    )?.ok;
  }

  function canPlaceAomomoTrace(alienSlotId, traceType, position) {
    if (!isAomomoTracePlacementMode()) return false;
    if (!isDebugAlienTraceMode()
      && Number(alienTracePickerState.selectedAlienSlotId) !== Number(alienSlotId)) return false;
    const allowedTraceTypes = alienTracePickerState?.allowedTraceTypes || aliens.TRACE_TYPES;
    if (!allowedTraceTypes.includes(traceType)) return false;
    if (!aomomo?.isAomomoRevealedSlot?.(alienGameState, alienSlotId)) return false;
    const currentPlayer = getCurrentPlayer();
    return aomomo?.canPlaceAomomoTrace?.(
      alienGameState,
      alienSlotId,
      traceType,
      position,
      currentPlayer,
    )?.ok;
  }

  function canPlaceRunezuTrace(alienSlotId, traceType, position) {
    if (!isRunezuTracePlacementMode()) return false;
    if (!isDebugAlienTraceMode()
      && Number(alienTracePickerState.selectedAlienSlotId) !== Number(alienSlotId)) return false;
    const allowedTraceTypes = alienTracePickerState?.allowedTraceTypes || aliens.TRACE_TYPES;
    if (!allowedTraceTypes.includes(traceType)) return false;
    if (!runezu?.isRunezuRevealedSlot?.(alienGameState, alienSlotId)) return false;
    const currentPlayer = getCurrentPlayer();
    return runezu?.canPlaceRunezuTrace?.(
      alienGameState,
      alienSlotId,
      traceType,
      position,
      currentPlayer,
    )?.ok;
  }

  function canPlaceRunezuFaceSymbol(alienSlotId, position) {
    if (!runezu?.isRunezuRevealedSlot?.(alienGameState, alienSlotId)) return false;
    if (isActionEffectFlowActive() || isCardSelectionActive() || isDiscardSelectionActive()) return false;
    const currentPlayer = getCurrentPlayer();
    return runezu?.canPlaceFaceSymbol?.(alienGameState, position, currentPlayer)?.ok;
  }

  function canPlaceStateTrace(alienSlotId, traceType, kind) {
    if (!isDebugAlienTraceMode()) return false;
    const alienSlot = aliens.getAlienSlot(alienGameState, alienSlotId);
    if (!alienSlot || alienSlot.revealed) return false;
    const allowedTraceTypes = alienTracePickerState?.allowedTraceTypes || aliens.TRACE_TYPES;
    if (!allowedTraceTypes.includes(traceType)) return false;
    const traceSlot = alienSlot.traces?.[traceType];
    if (!traceSlot) return false;
    if (kind === "first") return !traceSlot.firstPlaced;
    if (kind === "extra") return Boolean(traceSlot.firstPlaced);
    return false;
  }

  function renderYichangdianCardDisplays() {
    for (const alienSlotId of aliens.ALIEN_SLOT_IDS) {
      const area = getAlienYichangdianCardArea(alienSlotId);
      if (!area) continue;
      const visible = Boolean(yichangdian?.isYichangdianRevealedSlot?.(alienGameState, alienSlotId));
      const state = alienGameState.yichangdian || {};
      const cardIndex = state.displayedCardIndex;
      if (!visible || cardIndex == null) {
        area.hidden = true;
        area.replaceChildren();
        continue;
      }
      area.hidden = false;
      const title = document.createElement("div");
      title.className = "alien-yichangdian-card-title";
      title.textContent = "异常点展示牌";

      const image = document.createElement("img");
      image.className = "alien-yichangdian-card-image";
      image.src = yichangdian.getCardSrc(cardIndex);
      image.alt = `异常点牌 ${cardIndex}`;
      image.width = 747;
      image.height = 1040;
      image.decoding = "async";
      area.replaceChildren(title, image);
    }
  }

  function renderBanrenmaScoremarks() {
    for (const alienSlotId of aliens.ALIEN_SLOT_IDS) {
      const container = getAlienBanrenmaScoremarkElement(alienSlotId);
      if (!container) continue;
      const visible = Boolean(banrenma?.isBanrenmaRevealedSlot?.(alienGameState, alienSlotId));
      if (!visible) {
        container.hidden = true;
        container.replaceChildren();
        continue;
      }
      const marks = playerState.players.flatMap((player) => (
        banrenma.getPlayerScoreMarks(alienGameState, player)
          .filter((mark) => mark.source === "panel")
          .map((mark) => ({ player, mark }))
      ));
      container.hidden = !marks.length;
      container.replaceChildren(...marks.map(({ player, mark }) => {
        const item = document.createElement("div");
        item.className = "alien-banrenma-scoremark";
        const icon = document.createElement("img");
        icon.className = "alien-banrenma-scoremark-icon";
        icon.src = banrenma.getPlayerMarkSrc(player.color);
        icon.alt = "";
        icon.decoding = "async";
        icon.setAttribute("aria-hidden", "true");
        const score = document.createElement("span");
        score.className = "alien-banrenma-scoremark-score";
        score.textContent = String(mark.threshold);
        item.title = `${player.colorLabel}玩家达到 ${mark.threshold} 分：选择一个半人马顶部奖励`;
        item.append(icon, score);
        return item;
      }));
    }
  }

  function renderBanrenmaCardDisplays() {
    for (const alienSlotId of aliens.ALIEN_SLOT_IDS) {
      const area = getAlienBanrenmaCardArea(alienSlotId);
      if (!area) continue;
      const visible = Boolean(banrenma?.isBanrenmaRevealedSlot?.(alienGameState, alienSlotId));
      const state = alienGameState.banrenma || {};
      const cardIndex = state.displayedCardIndex;
      if (!visible) {
        area.hidden = true;
        area.replaceChildren();
        continue;
      }
      area.hidden = false;
      const title = document.createElement("div");
      title.className = "alien-banrenma-card-title";
      title.textContent = "半人马展示牌";
      const image = document.createElement("img");
      image.className = "alien-banrenma-card-image";
      image.src = cardIndex == null ? banrenma.CARD_BACK_SRC : banrenma.getCardSrc(cardIndex);
      image.alt = cardIndex == null ? "半人马牌背" : `半人马牌 ${cardIndex}`;
      image.width = 747;
      image.height = 1040;
      image.decoding = "async";
      area.replaceChildren(title, image);
    }
  }

  function renderChongCardDisplays() {
    for (const alienSlotId of aliens.ALIEN_SLOT_IDS) {
      const area = getAlienChongCardArea(alienSlotId);
      if (!area) continue;
      const visible = Boolean(chong?.isChongRevealedSlot?.(alienGameState, alienSlotId));
      const state = alienGameState.chong || {};
      const cardIndex = state.displayedCardIndex;
      if (!visible) {
        area.hidden = true;
        area.replaceChildren();
        continue;
      }
      area.hidden = false;
      const title = document.createElement("div");
      title.className = "alien-chong-card-title";
      title.textContent = "虫族展示牌";
      const image = document.createElement("img");
      image.className = "alien-chong-card-image";
      image.src = cardIndex == null ? chong.CARD_BACK_SRC : chong.getCardSrc(cardIndex);
      image.alt = cardIndex == null ? "虫族牌背" : `虫族牌 ${cardIndex}`;
      image.width = 747;
      image.height = 1040;
      image.decoding = "async";

      area.replaceChildren(title, image);
    }
  }

  function renderAmibaCardDisplays() {
    for (const alienSlotId of aliens.ALIEN_SLOT_IDS) {
      const area = getAlienAmibaCardArea(alienSlotId);
      if (!area) continue;
      const visible = Boolean(amiba?.isAmibaRevealedSlot?.(alienGameState, alienSlotId));
      const state = alienGameState.amiba || {};
      const cardIndex = state.displayedCardIndex;
      if (!visible) {
        area.hidden = true;
        area.replaceChildren();
        continue;
      }
      area.hidden = false;
      const title = document.createElement("div");
      title.className = "alien-amiba-card-title";
      title.textContent = "阿米巴展示牌";
      const image = document.createElement("img");
      image.className = "alien-amiba-card-image";
      image.src = cardIndex == null ? amiba.CARD_BACK_SRC : amiba.getCardSrc(cardIndex);
      image.alt = cardIndex == null ? "阿米巴牌背" : `阿米巴牌 ${cardIndex}`;
      image.width = 747;
      image.height = 1040;
      image.decoding = "async";

      area.replaceChildren(title, image);
    }
  }

  function renderAomomoCardDisplays() {
    for (const alienSlotId of aliens.ALIEN_SLOT_IDS) {
      const area = getAlienAomomoCardArea(alienSlotId);
      if (!area) continue;
      const visible = Boolean(aomomo?.isAomomoRevealedSlot?.(alienGameState, alienSlotId));
      const state = alienGameState.aomomo || {};
      const cardIndex = state.displayedCardIndex;
      if (!visible) {
        area.hidden = true;
        area.replaceChildren();
        continue;
      }
      area.hidden = false;
      const title = document.createElement("div");
      title.className = "alien-aomomo-card-title";
      title.textContent = "奥陌陌展示牌";
      const image = document.createElement("img");
      image.className = "alien-aomomo-card-image";
      image.src = cardIndex == null ? aomomo.CARD_BACK_SRC : aomomo.getCardSrc(cardIndex);
      image.alt = cardIndex == null ? "奥陌陌牌背" : `奥陌陌牌 ${cardIndex}`;
      image.width = 747;
      image.height = 1040;
      image.decoding = "async";

      area.replaceChildren(title, image);
    }
  }

  function renderRunezuCardDisplays() {
    for (const alienSlotId of aliens.ALIEN_SLOT_IDS) {
      const area = getAlienRunezuCardArea(alienSlotId);
      if (!area) continue;
      const visible = Boolean(runezu?.isRunezuRevealedSlot?.(alienGameState, alienSlotId));
      const state = alienGameState.runezu || {};
      const cardIndex = state.displayedCardIndex;
      if (!visible) {
        area.hidden = true;
        area.replaceChildren();
        continue;
      }
      area.hidden = false;
      const title = document.createElement("div");
      title.className = "alien-runezu-card-title";
      title.textContent = "符文族展示牌";
      const image = document.createElement("img");
      image.className = "alien-runezu-card-image";
      image.src = cardIndex == null ? runezu.CARD_BACK_SRC : runezu.getCardSrc(cardIndex);
      image.alt = cardIndex == null ? "符文族牌背" : `符文族牌 ${cardIndex}`;
      image.width = 747;
      image.height = 1040;
      image.decoding = "async";

      area.replaceChildren(title, image);
    }
  }

  function renderBanrenmaBonusMarkers() {
    const activeKeys = new Set();
    const state = banrenma?.ensureBanrenmaState?.(alienGameState);
    const alienSlotId = Number(state?.revealedSlotId || 0);
    const layer = alienSlotId ? getAlienJiuzheTraceLayer(alienSlotId) : null;
    if (layer && banrenma?.isBanrenmaRevealedSlot?.(alienGameState, alienSlotId)) {
      for (const [position, slot] of Object.entries(state.bonusSlots || {})) {
        const layout = window.SetiAlienPlacement?.getBanrenmaBonusMarkerLayout?.(alienSlotId, Number(position));
        if (!layout || !slot) continue;
        const key = `banrenma-bonus:${alienSlotId}:${position}`;
        activeKeys.add(key);
        let element = banrenmaBonusMarkerElements.get(key);
        if (!element) {
          element = document.createElement("img");
          element.className = "alien-trace-token alien-trace-token-positioned alien-trace-token-banrenma-bonus";
          element.draggable = false;
          banrenmaBonusMarkerElements.set(key, element);
          layer.appendChild(element);
        }
        const scale = ((layout.scalePercent || 52) / 100)
          * (window.SetiAlienPlacement?.BANRENMA_BONUS_TOKEN_DISPLAY_SCALE || 1.18);
        element.style.position = "absolute";
        element.style.left = `${layout.percentX}%`;
        element.style.top = `${layout.percentY}%`;
        element.style.setProperty("--alien-trace-scale", String(scale));
        element.style.transform = "translate(-50%, -50%) scale(var(--alien-trace-scale, 1))";
        element.style.transformOrigin = "center center";
        element.src = banrenma.getPlayerMarkSrc?.(slot.playerColor) || aliens.ALIEN_TRACE_TOKEN_SRC;
        element.alt = `半人马顶部奖励${position}`;
        element.dataset.alienSlot = String(alienSlotId);
        element.dataset.banrenmaBonusPosition = String(position);
        element.title = `半人马顶部奖励${position}：${slot.playerLabel || slot.playerColor || "已使用"} @(${layout.percentX}%,${layout.percentY}%)`;
      }
    }
    for (const [key, element] of banrenmaBonusMarkerElements.entries()) {
      if (activeKeys.has(key)) continue;
      element.remove();
      banrenmaBonusMarkerElements.delete(key);
    }
  }

  function renderAlienPanels() {
    aliens.renderAllAlienBackImages(getAlienBackImage, alienGameState);
    aliens.renderAllAlienTraceMarkers(getAlienTraceLayer, alienGameState, {
      tokenSrc: aliens.ALIEN_TRACE_TOKEN_SRC,
      showStateTraceSlots: isDebugAlienTraceMode(),
      allowedTraceTypes: alienTracePickerState?.allowedTraceTypes || aliens.TRACE_TYPES,
      canPlaceStateTrace,
      getPlayerTokenAsset: (playerColor) => (
        players.getPlayerColorDefinition(playerColor)?.normalTokenAsset
        || aliens.ALIEN_TRACE_TOKEN_SRC
      ),
      getPlayerLabel: (playerColor) => players.getPlayerColorDefinition(playerColor)?.label || playerColor,
    });
    aliens.renderAllJiuzheTraceMarkers?.(getAlienJiuzheTraceLayer, alienGameState, {
      tokenSrc: aliens.ALIEN_TRACE_TOKEN_SRC,
      canPlaceJiuzheTrace,
      getPlayerTokenAsset: (playerColor) => (
        players.getPlayerColorDefinition(playerColor)?.normalTokenAsset
        || aliens.ALIEN_TRACE_TOKEN_SRC
      ),
      getPlayerLabel: (playerColor) => players.getPlayerColorDefinition(playerColor)?.label || playerColor,
    });
    aliens.renderAllYichangdianTraceMarkers?.(getAlienJiuzheTraceLayer, alienGameState, {
      tokenSrc: aliens.ALIEN_TRACE_TOKEN_SRC,
      canPlaceYichangdianTrace,
      getPlayerTokenAsset: (playerColor) => (
        players.getPlayerColorDefinition(playerColor)?.normalTokenAsset
        || aliens.ALIEN_TRACE_TOKEN_SRC
      ),
      getPlayerLabel: (playerColor) => players.getPlayerColorDefinition(playerColor)?.label || playerColor,
    });
    aliens.renderAllFangzhouTraceMarkers?.(getAlienJiuzheTraceLayer, alienGameState, {
      tokenSrc: aliens.ALIEN_TRACE_TOKEN_SRC,
      canPlaceFangzhouTrace,
      getPlayerTokenAsset: (playerColor) => (
        players.getPlayerColorDefinition(playerColor)?.normalTokenAsset
        || aliens.ALIEN_TRACE_TOKEN_SRC
      ),
      getPlayerLabel: (playerColor) => players.getPlayerColorDefinition(playerColor)?.label || playerColor,
    });
    aliens.renderAllBanrenmaTraceMarkers?.(getAlienJiuzheTraceLayer, alienGameState, {
      tokenSrc: aliens.ALIEN_TRACE_TOKEN_SRC,
      canPlaceBanrenmaTrace,
      getPlayerTokenAsset: (playerColor) => (
        players.getPlayerColorDefinition(playerColor)?.normalTokenAsset
        || aliens.ALIEN_TRACE_TOKEN_SRC
      ),
      getPlayerLabel: (playerColor) => players.getPlayerColorDefinition(playerColor)?.label || playerColor,
    });
    aliens.renderAllChongTraceMarkers?.(getAlienJiuzheTraceLayer, alienGameState, {
      tokenSrc: aliens.ALIEN_TRACE_TOKEN_SRC,
      canPlaceChongTrace,
      getPlayerTokenAsset: (playerColor) => (
        players.getPlayerColorDefinition(playerColor)?.normalTokenAsset
        || aliens.ALIEN_TRACE_TOKEN_SRC
      ),
      getPlayerLabel: (playerColor) => players.getPlayerColorDefinition(playerColor)?.label || playerColor,
    });
    aliens.renderAllAmibaTraceMarkers?.(getAlienJiuzheTraceLayer, alienGameState, {
      tokenSrc: aliens.ALIEN_TRACE_TOKEN_SRC,
      canPlaceAmibaTrace,
      getPlayerTokenAsset: (playerColor) => (
        players.getPlayerColorDefinition(playerColor)?.normalTokenAsset
        || aliens.ALIEN_TRACE_TOKEN_SRC
      ),
      getPlayerLabel: (playerColor) => players.getPlayerColorDefinition(playerColor)?.label || playerColor,
    });
    aliens.renderAllAomomoTraceMarkers?.(getAlienJiuzheTraceLayer, alienGameState, {
      tokenSrc: aliens.ALIEN_TRACE_TOKEN_SRC,
      canPlaceAomomoTrace,
      getPlayerTokenAsset: (playerColor) => (
        players.getPlayerColorDefinition(playerColor)?.normalTokenAsset
        || aliens.ALIEN_TRACE_TOKEN_SRC
      ),
      getPlayerOrbitAsset: (playerColor) => (
        players.getPlayerColorDefinition(playerColor)?.satelliteAsset
        || players.getPlayerColorDefinition(playerColor)?.normalTokenAsset
        || aliens.ALIEN_TRACE_TOKEN_SRC
      ),
      getPlayerLandingAsset: (playerColor) => (
        players.getPlayerColorDefinition(playerColor)?.landdingAsset
        || players.getPlayerColorDefinition(playerColor)?.normalTokenAsset
        || aliens.ALIEN_TRACE_TOKEN_SRC
      ),
      getPlayerLabel: (playerColor) => players.getPlayerColorDefinition(playerColor)?.label || playerColor,
    });
    aliens.renderAllRunezuTraceMarkers?.(getAlienJiuzheTraceLayer, alienGameState, {
      tokenSrc: aliens.ALIEN_TRACE_TOKEN_SRC,
      canPlaceRunezuTrace,
      canPlaceRunezuFaceSymbol,

      getPlayerTokenAsset: (playerColor) => (
        players.getPlayerColorDefinition(playerColor)?.normalTokenAsset
        || aliens.ALIEN_TRACE_TOKEN_SRC
      ),
      getPlayerLabel: (playerColor) => players.getPlayerColorDefinition(playerColor)?.label || playerColor,
    });
    renderJiuzheThresholds();
    renderBanrenmaScoremarks();
    renderYichangdianCardDisplays();
    renderFangzhouCardDisplays();
    renderBanrenmaCardDisplays();
    renderChongCardDisplays();
    renderAmibaCardDisplays();
    renderAomomoCardDisplays();
    renderRunezuCardDisplays();
    renderBanrenmaBonusMarkers();
    renderRunezuBoardSymbols();
  }

  function randomizeAliens() {
    const result = aliens.randomizeAlienAssignments(alienGameState);
    aliens.resetAlienTraceTokens();
    for (const element of yichangdianAnomalyMarkerElements.values()) {
      element.remove();
    }
    yichangdianAnomalyMarkerElements.clear();
    for (const element of banrenmaBonusMarkerElements.values()) {
      element.remove();
    }
    banrenmaBonusMarkerElements.clear();
    renderAlienPanels();
    renderRockets();
    return result;
  }

  function closeAlienTracePicker() {
    if (!els.alienTraceOverlay) return;
    els.alienTraceOverlay.hidden = true;
    alienTracePickerState = null;
    pendingAlienTraceAction = null;
  }

  function getAlienTracePlacementPreview(alienSlotId, traceType) {
    const alienSlot = aliens.getAlienSlot(alienGameState, alienSlotId);
    const traceSlot = alienSlot?.traces?.[traceType];
    const traceLabel = aliens.getTraceTypeLabel(traceType);

    if (!traceSlot?.firstPlaced) {
      if (alienSlot?.revealed) {
        return {
          canPlace: false,
          description: "已揭示，无法补首标记",
          title: "该外星人已揭示，无法再放置首标记",
        };
      }
      return {
        canPlace: true,
        description: `放置${traceLabel}首标记`,
        title: "",
      };
    }

    const extraCount = traceSlot.extraCount || 0;
    return {
      canPlace: true,
      description: extraCount > 0
        ? `追加${traceLabel}额外痕迹（已有 ${extraCount} 个）`
        : `追加${traceLabel}额外痕迹`,
      title: "",
    };
  }

  function describeAlienSlotPickerStatus(alienSlotId) {
    const alienSlot = aliens.getAlienSlot(alienGameState, alienSlotId);
    if (!alienSlot) return "无状态";
    if (alienSlot.revealed) {
      return alienSlot.alienId ? `已揭示（${alienSlot.alienId}）` : "已揭示";
    }
    const placedCount = aliens.countPlacedFirstTraces(alienSlot);
    return `未揭示，首标记 ${placedCount}/3`;
  }

  function renderAlienTracePickerButtons(choices, pickerStep) {
    els.alienTraceActions.replaceChildren(...choices.map((choice) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "scan-target-option-button";
      button.dataset.alienPickerStep = pickerStep;
      button.dataset.alienSlot = String(choice.alienSlotId);
      if (choice.traceType) {
        button.dataset.traceType = choice.traceType;
      }
      button.disabled = Boolean(choice.disabled);
      button.title = choice.title || "";
      button.innerHTML = `${choice.label}<small>${choice.description}</small>`;
      return button;
    }));
  }

  function renderAlienTracePickerAlienStep() {
    const currentPlayer = getCurrentPlayer();
    const allowedTraceTypes = alienTracePickerState?.allowedTraceTypes || aliens.TRACE_TYPES;
    const singleTraceType = allowedTraceTypes.length === 1 ? allowedTraceTypes[0] : null;

    if (els.alienTraceSubtitle) {
      const traceHint = singleTraceType
        ? `获得${aliens.getTraceTypeLabel(singleTraceType)}，`
        : "";
      els.alienTraceSubtitle.textContent = (
        `当前玩家：${currentPlayer.colorLabel}。${traceHint}请选择要放置标记的外星人；`
        + "该颜色尚无首标记时自动放首标记，否则追加到额外痕迹位。"
      );
    }

    const choices = aliens.ALIEN_SLOT_IDS.map((alienSlotId) => {
      const slotLabel = aliens.getAlienSlotLabel(alienSlotId);
      const status = describeAlienSlotPickerStatus(alienSlotId);
      if (singleTraceType) {
        const preview = getAlienTracePlacementPreview(alienSlotId, singleTraceType);
        return {
          alienSlotId,
          label: slotLabel,
          description: `${status} · ${preview.description}`,
          disabled: !preview.canPlace,
          title: preview.title,
        };
      }
      return {
        alienSlotId,
        label: slotLabel,
        description: status,
        disabled: false,
        title: "",
      };
    });

    renderAlienTracePickerButtons(choices, "alien");
  }

  function renderAlienTracePickerColorStep(alienSlotId) {
    const currentPlayer = getCurrentPlayer();
    const allowedTraceTypes = alienTracePickerState?.allowedTraceTypes || aliens.TRACE_TYPES;
    const slotLabel = aliens.getAlienSlotLabel(alienSlotId);

    if (els.alienTraceSubtitle) {
      els.alienTraceSubtitle.textContent = (
        `当前玩家：${currentPlayer.colorLabel}。${slotLabel}：请选择痕迹颜色；`
        + "尚无首标记时自动放首标记，否则追加到额外痕迹位。"
      );
    }

    const choices = allowedTraceTypes.map((traceType) => {
      const preview = getAlienTracePlacementPreview(alienSlotId, traceType);
      return {
        alienSlotId,
        traceType,
        label: aliens.getTraceTypeLabel(traceType),
        description: preview.description,
        disabled: !preview.canPlace,
        title: preview.title,
      };
    });

    renderAlienTracePickerButtons(choices, "color");
  }

  function openAlienTracePicker(options = {}) {
    if (!els.alienTraceOverlay || !els.alienTraceActions) {
      return { ok: false, message: "无法打开外星人标记选择" };
    }

    alienTracePickerState = {
      allowedTraceTypes: options.allowedTraceTypes?.length
        ? options.allowedTraceTypes
        : aliens.TRACE_TYPES,
    };
    renderAlienTracePickerAlienStep();
    els.alienTraceOverlay.hidden = false;
    return { ok: true, message: "请选择外星人" };
  }

  function beginJiuzheTraceGridPlacement(alienSlotId) {
    const allowedTraceTypes = alienTracePickerState?.allowedTraceTypes?.length
      ? alienTracePickerState.allowedTraceTypes
      : aliens.TRACE_TYPES;
    alienTracePickerState = {
      ...alienTracePickerState,
      mode: "jiuzhe-grid",
      selectedAlienSlotId: Number(alienSlotId),
      allowedTraceTypes,
    };
    if (els.alienTraceOverlay) els.alienTraceOverlay.hidden = true;
    const traceLabel = allowedTraceTypes.length === 1
      ? aliens.getTraceTypeLabel(allowedTraceTypes[0])
      : "对应颜色";
    rocketState.statusNote = `九折：请在正面牌图点击可放置的${traceLabel}痕迹位`;
    renderAlienPanels();
    renderStateReadout();
    return { ok: true, message: rocketState.statusNote };
  }

  function beginYichangdianTraceGridPlacement(alienSlotId) {
    const allowedTraceTypes = alienTracePickerState?.allowedTraceTypes?.length
      ? alienTracePickerState.allowedTraceTypes
      : aliens.TRACE_TYPES;
    alienTracePickerState = {
      ...alienTracePickerState,
      mode: "yichangdian-grid",
      selectedAlienSlotId: Number(alienSlotId),
      allowedTraceTypes,
    };
    if (els.alienTraceOverlay) els.alienTraceOverlay.hidden = true;
    const traceLabel = allowedTraceTypes.length === 1
      ? aliens.getTraceTypeLabel(allowedTraceTypes[0])
      : "对应颜色";
    rocketState.statusNote = `异常点：请在正面牌图点击可放置的${traceLabel}痕迹位`;
    renderAlienPanels();
    renderStateReadout();
    return { ok: true, message: rocketState.statusNote };
  }

  function beginFangzhouTraceGridPlacement(alienSlotId, traceType = null) {
    const allowedTraceTypes = traceType
      ? [traceType]
      : (alienTracePickerState?.allowedTraceTypes?.length
        ? alienTracePickerState.allowedTraceTypes
        : aliens.TRACE_TYPES);
    alienTracePickerState = {
      ...alienTracePickerState,
      mode: "fangzhou-grid",
      selectedAlienSlotId: Number(alienSlotId),
      allowedTraceTypes,
      selectedTraceType: traceType || null,
    };
    if (els.alienTraceOverlay) els.alienTraceOverlay.hidden = true;
    const traceLabel = allowedTraceTypes.length === 1
      ? aliens.getTraceTypeLabel(allowedTraceTypes[0])
      : "对应颜色";
    rocketState.statusNote = `方舟：请在正面牌图点击可放置的${traceLabel}痕迹位`;
    renderAlienPanels();
    renderStateReadout();
    return { ok: true, message: rocketState.statusNote };
  }

  function beginBanrenmaTraceGridPlacement(alienSlotId) {
    const allowedTraceTypes = alienTracePickerState?.allowedTraceTypes?.length
      ? alienTracePickerState.allowedTraceTypes
      : aliens.TRACE_TYPES;
    alienTracePickerState = {
      ...alienTracePickerState,
      mode: "banrenma-grid",
      selectedAlienSlotId: Number(alienSlotId),
      allowedTraceTypes,
    };
    if (els.alienTraceOverlay) els.alienTraceOverlay.hidden = true;
    const traceLabel = allowedTraceTypes.length === 1
      ? aliens.getTraceTypeLabel(allowedTraceTypes[0])
      : "对应颜色";
    rocketState.statusNote = `半人马：请在正面牌图点击可放置的${traceLabel}痕迹位`;
    renderAlienPanels();
    renderStateReadout();
    return { ok: true, message: rocketState.statusNote };
  }

  function beginAomomoTraceGridPlacement(alienSlotId) {
    const allowedTraceTypes = alienTracePickerState?.allowedTraceTypes?.length
      ? alienTracePickerState.allowedTraceTypes
      : aliens.TRACE_TYPES;
    alienTracePickerState = {
      ...alienTracePickerState,
      mode: "aomomo-grid",
      selectedAlienSlotId: Number(alienSlotId),
      allowedTraceTypes,
    };
    if (els.alienTraceOverlay) els.alienTraceOverlay.hidden = true;
    const traceLabel = allowedTraceTypes.length === 1
      ? aliens.getTraceTypeLabel(allowedTraceTypes[0])
      : "对应颜色";
    rocketState.statusNote = `奥陌陌：请在正面牌图点击可放置的${traceLabel}痕迹位`;
    renderAlienPanels();
    renderStateReadout();
    return { ok: true, message: rocketState.statusNote };
  }

  function beginChongTraceGridPlacement(alienSlotId) {
    const allowedTraceTypes = alienTracePickerState?.allowedTraceTypes?.length
      ? alienTracePickerState.allowedTraceTypes
      : aliens.TRACE_TYPES;
    alienTracePickerState = {
      ...alienTracePickerState,
      mode: "chong-grid",
      selectedAlienSlotId: Number(alienSlotId),
      allowedTraceTypes,
    };
    if (els.alienTraceOverlay) els.alienTraceOverlay.hidden = true;
    const traceLabel = allowedTraceTypes.length === 1
      ? aliens.getTraceTypeLabel(allowedTraceTypes[0])
      : "对应颜色";
    rocketState.statusNote = `虫族：请在正面牌图点击可放置的${traceLabel}痕迹位`;
    renderAlienPanels();
    renderStateReadout();
    return { ok: true, message: rocketState.statusNote };
  }

  function beginAmibaTraceGridPlacement(alienSlotId) {
    const allowedTraceTypes = alienTracePickerState?.allowedTraceTypes?.length
      ? alienTracePickerState.allowedTraceTypes
      : aliens.TRACE_TYPES;
    alienTracePickerState = {
      ...alienTracePickerState,
      mode: "amiba-grid",
      selectedAlienSlotId: Number(alienSlotId),
      allowedTraceTypes,
    };
    if (els.alienTraceOverlay) els.alienTraceOverlay.hidden = true;
    const traceLabel = allowedTraceTypes.length === 1
      ? aliens.getTraceTypeLabel(allowedTraceTypes[0])
      : "对应颜色";
    rocketState.statusNote = `阿米巴：请在正面牌图点击可放置的${traceLabel}痕迹位`;
    renderAlienPanels();
    renderStateReadout();
    return { ok: true, message: rocketState.statusNote };
  }

  function beginRunezuTraceGridPlacement(alienSlotId) {
    const allowedTraceTypes = alienTracePickerState?.allowedTraceTypes?.length
      ? alienTracePickerState.allowedTraceTypes
      : aliens.TRACE_TYPES;
    alienTracePickerState = {
      ...alienTracePickerState,
      mode: "runezu-grid",
      selectedAlienSlotId: Number(alienSlotId),
      allowedTraceTypes,
    };
    if (els.alienTraceOverlay) els.alienTraceOverlay.hidden = true;
    const traceLabel = allowedTraceTypes.length === 1
      ? aliens.getTraceTypeLabel(allowedTraceTypes[0])
      : "对应颜色";
    rocketState.statusNote = `符文族：请在正面牌图点击可放置的${traceLabel}痕迹位`;
    renderAlienPanels();
    renderStateReadout();
    return { ok: true, message: rocketState.statusNote };
  }

  function renderFangzhouTraceColorStep(alienSlotId) {
    const currentPlayer = getCurrentPlayer();
    const allowedTraceTypes = alienTracePickerState?.allowedTraceTypes || aliens.TRACE_TYPES;
    const slotLabel = aliens.getAlienSlotLabel(alienSlotId);

    if (els.alienTraceSubtitle) {
      els.alienTraceSubtitle.textContent = (
        `当前玩家：${currentPlayer.colorLabel}。${slotLabel}：请选择痕迹颜色，`
        + "随后选择放置痕迹或解锁卡牌。"
      );
    }

    const choices = allowedTraceTypes.map((type) => {
      const canPlace = fangzhou?.canPlaceAnyFangzhouTrace?.(
        alienGameState,
        alienSlotId,
        type,
        currentPlayer,
      );
      const canUnlock = fangzhou?.canUnlockCard2ForTrace?.(alienGameState, currentPlayer, type);
      const actions = [];
      if (canPlace) actions.push("可放置");
      if (canUnlock) actions.push("可解锁卡牌");
      return {
        alienSlotId,
        traceType: type,
        label: aliens.getTraceTypeLabel(type),
        description: actions.length ? actions.join(" / ") : "该颜色暂不可用",
        disabled: !canPlace && !canUnlock,
        title: "",
      };
    });

    renderAlienTracePickerButtons(choices, "fangzhou-color");
  }

  function renderFangzhouTraceUseChoice(alienSlotId, traceType) {
    const currentPlayer = getCurrentPlayer();
    const traceLabel = aliens.getTraceTypeLabel(traceType);
    const canPlace = fangzhou?.canPlaceAnyFangzhouTrace?.(
      alienGameState,
      alienSlotId,
      traceType,
      currentPlayer,
    );
    const canUnlock = fangzhou?.canUnlockCard2ForTrace?.(alienGameState, currentPlayer, traceType);

    if (els.alienTraceSubtitle) {
      els.alienTraceSubtitle.textContent = (
        `当前玩家：${currentPlayer.colorLabel}。${traceLabel}外星人痕迹：`
        + "选择放置到方舟正面，或消耗痕迹解锁对应卡牌（解锁后卡牌进入手牌）。"
      );
    }

    const choices = [];
    if (canPlace) {
      choices.push({
        alienSlotId,
        traceType,
        label: `放置${traceLabel}痕迹`,
        description: "在方舟正面选择痕迹位并结算放置奖励",
        disabled: false,
        fangzhouUse: "place",
      });
    }
    if (canUnlock) {
      choices.push({
        alienSlotId,
        traceType,
        label: `解锁${traceLabel}方舟牌`,
        description: "消耗本次痕迹解锁保留区卡牌并加入手牌",
        disabled: false,
        fangzhouUse: "unlock",
      });
    }

    els.alienTraceActions.replaceChildren(...choices.map((choice) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "scan-target-option-button";
      button.dataset.alienPickerStep = "fangzhou-use";
      button.dataset.alienSlot = String(choice.alienSlotId);
      button.dataset.traceType = choice.traceType;
      button.dataset.fangzhouUse = choice.fangzhouUse;
      button.disabled = Boolean(choice.disabled);
      button.title = choice.title || "";
      button.innerHTML = `${choice.label}<small>${choice.description}</small>`;
      return button;
    }));
    if (els.alienTraceOverlay) els.alienTraceOverlay.hidden = false;
  }

  function openFangzhouTraceUseChoice(alienSlotId, traceType) {
    const currentPlayer = getCurrentPlayer();
    const canPlace = fangzhou?.canPlaceAnyFangzhouTrace?.(
      alienGameState,
      alienSlotId,
      traceType,
      currentPlayer,
    );
    const canUnlock = fangzhou?.canUnlockCard2ForTrace?.(alienGameState, currentPlayer, traceType);

    if (canPlace && canUnlock) {
      alienTracePickerState = {
        ...alienTracePickerState,
        mode: "fangzhou-use",
        selectedAlienSlotId: Number(alienSlotId),
        selectedTraceType: traceType,
      };
      renderFangzhouTraceUseChoice(alienSlotId, traceType);
      return { ok: true, message: "请选择放置痕迹或解锁卡牌" };
    }
    if (canUnlock) {
      return confirmFangzhouCard2Unlock(alienSlotId, traceType);
    }
    if (canPlace) {
      return beginFangzhouTraceGridPlacement(alienSlotId, traceType);
    }
    rocketState.statusNote = `${aliens.getTraceTypeLabel(traceType)}痕迹无法放置或解锁`;
    renderStateReadout();
    return { ok: false, message: rocketState.statusNote };
  }

  function routeFangzhouAlienTraceGain(alienSlotId) {
    const allowedTraceTypes = alienTracePickerState?.allowedTraceTypes || aliens.TRACE_TYPES;
    if (allowedTraceTypes.length === 1) {
      return openFangzhouTraceUseChoice(alienSlotId, allowedTraceTypes[0]);
    }
    alienTracePickerState = {
      ...alienTracePickerState,
      mode: "fangzhou-color",
      selectedAlienSlotId: Number(alienSlotId),
    };
    renderFangzhouTraceColorStep(alienSlotId);
    return { ok: true, message: "请选择痕迹颜色" };
  }

  function confirmFangzhouCard2Unlock(alienSlotId, traceType) {
    const currentPlayer = getCurrentPlayer();
    const inDebugMode = isDebugAlienTraceMode();
    if (!fangzhou?.canUnlockCard2ForTrace?.(alienGameState, currentPlayer, traceType)) {
      rocketState.statusNote = "无法解锁该方舟卡牌";
      renderStateReadout();
      return { ok: false, message: rocketState.statusNote };
    }

    const pending = pendingAlienTraceAction;
    const beforeAlienState = pending?.beforeAlienState || structuredClone(alienGameState);
    const beforePlayerState = pending?.beforePlayerState || structuredClone(playerState);
    if (!inDebugMode) {
      pendingAlienTraceAction = null;
      if (alienTracePickerState?.mode !== "debug-direct") {
        alienTracePickerState = null;
      }
      closeAlienTracePicker();
    }

    const unlockResult = fangzhou.unlockCard2(alienGameState, currentPlayer, traceType);
    if (!unlockResult.ok) {
      rocketState.statusNote = unlockResult.message;
      renderStateReadout();
      return unlockResult;
    }
    if (unlockResult.handCard) {
      currentPlayer.hand.push(unlockResult.handCard);
    }

    rocketState.statusNote = unlockResult.message;

    if (pending?.type === "planet_reward_alien_trace") {
      beginEffectHistoryStep(pending.effectLabel || "方舟解锁卡牌");
      recordHistoryCommand(historyCommands.createRestoreObjectCommand(
        alienGameState,
        beforeAlienState,
        "恢复方舟解锁卡牌前外星人状态",
      ));
      recordHistoryCommand(historyCommands.createRestoreObjectCommand(
        playerState,
        beforePlayerState,
        "恢复方舟解锁卡牌前玩家状态",
      ));
      if (getCurrentActionEffect()) {
        getCurrentActionEffect().result = {
          ok: true,
          undoable: true,
          message: rocketState.statusNote,
          payload: { alienSlotId, traceType, unlocked: true },
        };
      }
      completeCurrentActionEffect();
    } else {
      beginQuickActionStep("fangzhou-unlock", rocketState.statusNote);
      recordQuickHistoryCommand(historyCommands.createRestoreObjectCommand(
        alienGameState,
        beforeAlienState,
        "恢复方舟解锁卡牌前外星人状态",
      ));
      recordQuickHistoryCommand(historyCommands.createRestoreObjectCommand(
        playerState,
        beforePlayerState,
        "恢复方舟解锁卡牌前玩家状态",
      ));
      completeQuickActionStep();
      settleCardTasksAfterEffect({ skipType1: true, render: false });
    }

    renderAlienPanels();
    renderPlayerStats();
    renderPlayerHand();
    renderReservedCardsFromTaskState();
    updateActionButtons();
    renderStateReadout();
    return unlockResult;
  }

  function getAlienFangzhouCardArea(alienSlotId) {
    return [...els.alienFangzhouCardAreas].find(
      (element) => Number(element.dataset.alienSlot) === alienSlotId,
    ) || null;
  }

  function createFangzhouReservedButtons(player) {
    const reserved = fangzhou?.getPlayerCard2Reserved?.(alienGameState, player) || [];
    if (!reserved.length) return [];
    const debugUnlockMode = isDebugAlienTraceMode();
    return reserved.map((card, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "reserved-card-button reserved-card-button-fangzhou";
      button.dataset.fangzhouReserved = card.traceType;
      if (debugUnlockMode) {
        button.dataset.fangzhouUnlock = card.traceType;
        button.classList.add("is-fangzhou-unlock-pending");
      }
      button.style.setProperty("--card-index", String(index + 1));
      button.title = debugUnlockMode
        ? `${card.label}（点击消耗痕迹解锁）`
        : `${card.label}（未解锁）`;
      button.disabled = !debugUnlockMode;

      const image = document.createElement("img");
      image.className = "player-hand-card reserved-card";
      image.src = card.src;
      image.alt = card.label;
      image.width = 747;
      image.height = 1040;
      image.decoding = "async";
      image.setAttribute("aria-hidden", "true");
      button.append(image);
      return button;
    });
  }

  function buildFangzhouCard1EffectQueue(effect, labelPrefix) {
    if (!effect) return [];
    const queueApi = aliens.fangzhouCard1Queue;
    if (!queueApi) return [];
    return queueApi.buildCard1EffectQueue(effect, labelPrefix, {
      getTraceTypeLabel: aliens.getTraceTypeLabel,
      formatGain: (gain) => players.formatResourceCost(gain),
    });
  }

  function enqueueFangzhouCard1RewardEffects(flips, flowLabel, options = {}) {
    const effects = [];
    for (const flip of flips || []) {
      if (!flip?.ok) continue;
      effects.push(...buildFangzhouCard1EffectQueue(flip.effect, flip.label || flowLabel));
    }
    if (!effects.length) {
      return { ok: true, effects: [], message: "无奖励效果" };
    }

    const flowOptions = {
      actionType: options.actionType || "fangzhouBasic",
      ...options,
    };
    if (pendingActionEffectFlow && options.insertIntoCurrentFlow) {
      insertActionEffectsAfterCurrent(effects);
      renderActionEffectBar();
      return { ok: true, effects, inserted: true, message: flowLabel };
    }
    if (pendingActionEffectFlow && !options.forceNewFlow) {
      insertActionEffectsAfterCurrent(effects);
      renderActionEffectBar();
      return { ok: true, effects, inserted: true, message: flowLabel };
    }

    startCardEffectFlow(
      "fangzhou-card1-reward",
      flowLabel,
      effects,
      flowOptions,
    );
    return { ok: true, effects, message: flowLabel };
  }

  function flipFangzhouCard1Rewards(count, tier = "basic") {
    const total = Math.max(0, Math.round(Number(count) || 0));
    const flips = [];
    for (let index = 0; index < total; index += 1) {
      const flip = fangzhou.flipCard1Reward(alienGameState, tier);
      if (!flip.ok) break;
      flips.push(flip);
    }
    if (flips.length) renderFangzhouCardDisplays();
    return flips;
  }

  function applyFangzhouCard1Reward(player, tier = "basic", label = "方舟基础奖励", options = {}) {
    if (!fangzhou) return { ok: false, message: "方舟模块未加载" };
    const flipResult = fangzhou.flipCard1Reward(alienGameState, tier);
    if (!flipResult.ok) return flipResult;

    renderFangzhouCardDisplays();
    const queueResult = enqueueFangzhouCard1RewardEffects(
      [flipResult],
      flipResult.label || label,
      {
        actionType: tier === "advanced" ? "fangzhouAdvanced" : "fangzhouBasic",
        ...options,
      },
    );

    return {
      ok: true,
      flipResult,
      message: flipResult.message,
      followUps: queueResult.effects || [],
    };
  }

  function queueFangzhouBasicRewards(player, count, label = "方舟痕迹", options = {}) {
    const flips = flipFangzhouCard1Rewards(count, "basic");
    if (!flips.length) return [];
    const queueResult = enqueueFangzhouCard1RewardEffects(
      flips,
      `${label} 基础奖励`,
      { actionType: "fangzhouBasic", ...options },
    );
    return [queueResult];
  }

  function applyFangzhouTraceRewardToPlayer(player, reward, label = "方舟痕迹") {
    if (!player || !reward) return { ok: false, message: "没有可结算的方舟奖励" };
    const messages = [];
    if (Object.keys(reward.gain || {}).length) {
      players.gainResources(player, reward.gain);
      messages.push(players.formatResourceCost(reward.gain));
    }
    const basicCount = Math.max(0, Math.round(Number(reward.basicRewardCount) || 0));
    let irreversible = null;
    if (basicCount > 0) {
      const basicResults = queueFangzhouBasicRewards(player, basicCount, label, {
        insertIntoCurrentFlow: isActionEffectFlowActive(),
      });
      for (const result of basicResults) {
        if (result.message) messages.push(result.message);
      }
      irreversible = {
        code: "fangzhou_card1_flip",
        reason: "方舟奖励牌翻开新牌",
      };
    }
    return {
      ok: true,
      undoable: !irreversible,
      irreversible,
      message: `${label}：${messages.join("；") || "无奖励"}`,
    };
  }

  function processFangzhouRevealBasicRewards() {
    if (!fangzhou) return { ok: true, count: 0 };
    const flips = [];
    while (alienGameState.fangzhou?.pendingRevealBasicRewards?.length) {
      const next = fangzhou.takeNextRevealBasicReward(alienGameState);
      if (!next.ok || !next.entry) break;
      const player = getPlayerById(next.entry.playerId) || getPlayerByColor(next.entry.playerColor);
      if (!player) continue;
      const flip = fangzhou.flipCard1Reward(alienGameState, "basic");
      if (!flip.ok) break;
      flips.push(flip);
    }
    if (flips.length) {
      renderFangzhouCardDisplays();
      enqueueFangzhouCard1RewardEffects(flips, "方舟揭示基础奖励", { actionType: "fangzhouBasic" });
    }
    return { ok: true, count: flips.length };
  }

  function handleFangzhouRevealSideEffects(alienSlotId, revealResult, triggerPlayer) {
    if (!fangzhou || !revealResult?.ok || revealResult.alienId !== fangzhou.ALIEN_ID) return null;
    const initResult = fangzhou.initializeFangzhouReveal(
      alienGameState,
      alienSlotId,
      triggerPlayer,
      getActivePlayers(),
    );
    processFangzhouRevealBasicRewards();
    return {
      ...initResult,
      rewardMessages: [],
      message: initResult.message,
    };
  }

  function renderFangzhouCardDisplays() {
    for (const alienSlotId of aliens.ALIEN_SLOT_IDS) {
      const area = getAlienFangzhouCardArea(alienSlotId);
      if (!area) continue;
      const visible = Boolean(fangzhou?.isFangzhouRevealedSlot?.(alienGameState, alienSlotId));
      const state = alienGameState.fangzhou || {};
      const cardIndex = state.displayedCard1Index;
      if (!visible) {
        area.hidden = true;
        area.replaceChildren();
        continue;
      }
      area.hidden = false;
      const title = document.createElement("div");
      title.className = "alien-fangzhou-card-title";
      title.textContent = "方舟奖励牌";

      const stack = document.createElement("div");
      stack.className = "alien-fangzhou-card-stack";

      if (cardIndex != null) {
        const image = document.createElement("img");
        image.className = "alien-fangzhou-card-image";
        image.src = fangzhou.getCard1Src(cardIndex);
        image.alt = `方舟奖励牌 ${cardIndex}`;
        image.width = 747;
        image.height = 1040;
        image.decoding = "async";
        stack.append(image);
      } else {
        const back = document.createElement("img");
        back.className = "alien-fangzhou-card-image";
        back.src = fangzhou.CARD1_BACK_SRC;
        back.alt = "方舟奖励牌背";
        stack.append(back);
      }

      const button = document.createElement("button");
      button.type = "button";
      button.className = "alien-fangzhou-card-view-button";
      button.dataset.fangzhouCardView = String(alienSlotId);
      button.textContent = "查看已翻开牌";
      area.replaceChildren(title, stack, button);
    }
  }

  function openFangzhouCard1Dialog(alienSlotId = alienGameState.fangzhou?.revealedSlotId) {
    if (!fangzhou || !els.scanTargetOverlay || !els.scanTargetActions) {
      return { ok: false, message: "无法打开方舟奖励牌窗口" };
    }
    const revealed = alienGameState.fangzhou?.card1Revealed || [];
    if (els.scanTargetTitle) els.scanTargetTitle.textContent = "方舟已翻开奖励牌";
    if (els.scanTargetSubtitle) {
      els.scanTargetSubtitle.textContent = revealed.length
        ? `共 ${revealed.length} 张；若已翻开 5 张，下次获得奖励时会先洗混牌堆再翻出新牌。`
        : "尚未翻开任何方舟奖励牌。";
    }
    if (els.scanTargetCancel) els.scanTargetCancel.hidden = false;
    els.scanTargetActions.replaceChildren(...revealed.map((index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "scan-target-option-button fangzhou-card-option";
      button.disabled = true;
      button.innerHTML = `<img class="jiuzhe-card-option-image" src="${fangzhou.getCard1Src(index)}" alt=""><small>方舟奖励 ${index}</small>`;
      return button;
    }));
    if (!revealed.length) {
      const empty = document.createElement("p");
      empty.textContent = "暂无已翻开牌";
      els.scanTargetActions.append(empty);
    }
    els.scanTargetOverlay.hidden = false;
    return { ok: true };
  }

  function handleFangzhouCard2Play(handIndex) {
    const currentPlayer = getCurrentPlayer();
    const cost = fangzhou.CARD2_PLAY_COST;
    if (!players.canAfford(currentPlayer, cost)) {
      rocketState.statusNote = `信用点不足：方舟牌需要 ${cost.credits} 信用点`;
      renderStateReadout();
      return { ok: false, message: rocketState.statusNote };
    }

    const beforePlayer = structuredClone(currentPlayer);
    const beforeAlienState = structuredClone(alienGameState);
    const spendResult = players.spendResources(currentPlayer, cost);
    if (!spendResult.ok) return spendResult;

    const removeResult = cards.discardFromHandAtIndex(currentPlayer, handIndex);
    if (!removeResult.ok) {
      players.gainResources(currentPlayer, cost);
      return removeResult;
    }

    cards.setPlayCardSelectionActive(cardState, false);
    pendingPlayCardSelection = null;
    syncPlayCardSelectionChrome();

    actionHistory.beginSession("playCard", "打出方舟解锁牌");
    actionHistory.beginStep({ source: HISTORY_SOURCE_MAIN, type: "fangzhou_card2_play", label: "打出方舟解锁牌" });
    recordHistoryCommand(historyCommands.createRestorePlayerCommand(
      currentPlayer,
      beforePlayer,
      "恢复打出方舟牌前玩家状态",
    ));
    recordHistoryCommand(historyCommands.createRestoreObjectCommand(
      alienGameState,
      beforeAlienState,
      "恢复打出方舟牌前外星人状态",
    ));

    const rewardResult = applyFangzhouCard1Reward(
      currentPlayer,
      "advanced",
      `打出 ${cards.getCardLabel(removeResult.card)}`,
    );
    actionHistory.endStep();
    actionHistory.commitSession();

    rocketState.statusNote = rewardResult.message || "方舟高级奖励已结算";
    renderAlienPanels();
    renderPlayerStats();
    renderPlayerHand();
    updateActionButtons();
    renderStateReadout();
    return rewardResult;
  }

  function findPlayerForJiuzheEntry(entry) {
    if (!entry) return null;
    return getPlayerById(entry.playerId)
      || getPlayerByColor(entry.playerColor)
      || null;
  }

  function applyJiuzheRewardToPlayer(player, reward, label = "九折痕迹") {
    if (!player || !reward) return { ok: false, message: "没有可结算的九折奖励" };
    const messages = [];
    if (Object.keys(reward.gain || {}).length) {
      players.gainResources(player, reward.gain);
      messages.push(players.formatResourceCost(reward.gain));
    }
    const dataCount = Math.max(0, Math.round(Number(reward.dataCount) || 0));
    if (dataCount > 0) {
      let gained = 0;
      for (let index = 0; index < dataCount; index += 1) {
        const result = data.gainData(player, { source: "jiuzhe" });
        if (result.ok) gained += 1;
      }
      messages.push(`${gained}/${dataCount}数据`);
    }
    if (reward.threat) {
      messages.push(`威胁度+${reward.threat}`);
    }
    if (reward.pickCard) {
      messages.push("精选1张牌");
    }
    return {
      ok: true,
      message: `${label}：${messages.join("、") || "无奖励"}`,
    };
  }

  function findPlayerForYichangdianEntry(entry) {
    if (!entry) return null;
    return getPlayerById(entry.playerId)
      || getPlayerByColor(entry.playerColor)
      || null;
  }

  function applyYichangdianRewardToPlayer(player, reward, label = "异常点奖励") {
    if (!player || !reward) return { ok: false, message: "没有可结算的异常点奖励" };
    const messages = [];
    if (Object.keys(reward.gain || {}).length) {
      players.gainResources(player, reward.gain);
      messages.push(players.formatResourceCost(reward.gain));
    }
    const dataCount = Math.max(0, Math.round(Number(reward.dataCount) || 0));
    if (dataCount > 0) {
      let gained = 0;
      for (let index = 0; index < dataCount; index += 1) {
        const result = data.gainData(player, { source: "yichangdian" });
        if (result.ok) gained += 1;
      }
      messages.push(`${gained}/${dataCount}数据`);
    }
    if (reward.pickAlienCard) messages.push("外星人牌");
    if (reward.pickCard) messages.push("精选1张牌");
    return {
      ok: true,
      message: `${label}：${messages.join("、") || "无奖励"}`,
    };
  }

  function getAvailableDataTokenCount(player) {
    return data.ensurePlayerDataState(player).poolTokens.length;
  }

  function spendAvailableDataTokens(player, count) {
    const needed = Math.max(0, Math.round(Number(count) || 0));
    if (needed <= 0) return { ok: true, removedTokens: [], message: "无需支付数据" };
    const dataState = data.ensurePlayerDataState(player);
    if (dataState.poolTokens.length < needed) {
      return {
        ok: false,
        message: `数据不足：需要 ${needed} 数据`,
      };
    }
    const removedTokens = [];
    for (let index = 0; index < needed; index += 1) {
      const sorted = [...dataState.poolTokens].sort((a, b) => a.slotIndex - b.slotIndex);
      const token = sorted[0];
      const poolIndex = dataState.poolTokens.findIndex((item) => item.id === token.id);
      if (poolIndex >= 0) {
        removedTokens.push(...dataState.poolTokens.splice(poolIndex, 1));
      }
    }
    player.resources.availableData = dataState.poolTokens.length;
    return {
      ok: true,
      removedTokens,
      message: `支付 ${needed} 数据`,
    };
  }

  function applyBanrenmaRewardToPlayer(player, reward, label = "半人马奖励") {
    if (!player || !reward) return { ok: false, message: "没有可结算的半人马奖励" };
    const messages = [];
    if (reward.payData) {
      const spendResult = spendAvailableDataTokens(player, reward.payData);
      if (!spendResult.ok) return spendResult;
      messages.push(spendResult.message);
    }
    if (Object.keys(reward.gain || {}).length) {
      players.gainResources(player, reward.gain);
      messages.push(players.formatResourceCost(reward.gain));
    }
    if (reward.pickAlienCard) messages.push("外星人牌");
    if (reward.alienTrace) messages.push("任意外星人痕迹");
    return {
      ok: true,
      message: `${label}：${messages.join("、") || "无奖励"}`,
    };
  }

  function applyAomomoRewardToPlayer(player, reward, label = "奥陌陌奖励") {
    if (!player || !reward) return { ok: false, message: "没有可结算的奥陌陌奖励" };
    const messages = [];
    if (reward.payFossils) {
      const cost = { aomomoFossils: reward.payFossils };
      if (!players.canAfford(player, cost)) {
        return { ok: false, message: `化石不足：需要 ${reward.payFossils} 化石` };
      }
      const spend = players.spendResources(player, cost);
      if (!spend.ok) return spend;
      messages.push(`支付${reward.payFossils}化石`);
    }
    if (Object.keys(reward.gain || {}).length) {
      players.gainResources(player, reward.gain);
      messages.push(players.formatResourceCost(reward.gain));
    }
    const dataCount = Math.max(0, Math.round(Number(reward.dataCount) || 0));
    if (dataCount > 0) {
      let gained = 0;
      for (let index = 0; index < dataCount; index += 1) {
        const result = data.gainData(player, { source: "aomomo" });
        if (result.ok) gained += 1;
      }
      messages.push(`${gained}/${dataCount}数据`);
    }
    if (reward.pickAlienCard) messages.push("外星人牌");
    return {
      ok: true,
      message: `${label}：${messages.join("、") || "无奖励"}`,
    };
  }

  function applyChongRewardToPlayer(player, reward, label = "虫族奖励") {
    if (!player || !reward) return { ok: false, message: "没有可结算的虫族奖励" };
    const messages = [];
    let irreversible = null;
    if (Object.keys(reward.gain || {}).length) {
      players.gainResources(player, reward.gain);
      messages.push(formatChongGain(reward.gain));
    }
    const dataCount = Math.max(0, Math.round(Number(reward.dataCount) || 0));
    if (dataCount > 0) {
      let gained = 0;
      for (let index = 0; index < dataCount; index += 1) {
        const result = data.gainData(player, { source: "chong" });
        if (result.ok) gained += 1;
      }
      messages.push(`${gained}/${dataCount}数据`);
    }
    const drawCount = Math.max(0, Math.round(Number(reward.drawCards) || 0));
    if (drawCount > 0) {
      let drawn = 0;
      for (let index = 0; index < drawCount; index += 1) {
        const result = blindDrawCardForPlayer(player);
        if (result.ok) drawn += 1;
      }
      messages.push(`${drawn}/${drawCount}盲抽`);
      irreversible = { code: "hidden_card_reveal", reason: "盲抽翻出新牌" };
    }
    if (reward.pickAlienCard) messages.push("外星人牌");
    if (reward.pickCard) messages.push("精选1张牌");
    if (reward.fossilId) {
      const fossilReward = reward.fossilPanel ? chong?.getFossilReward?.(reward.fossilId) : null;
      if (fossilReward) {
        const fossilResult = applyChongRewardToPlayer(player, fossilReward, `${label} ${reward.fossilId}`);
        if (fossilResult.message) messages.push(fossilResult.message);
        if (fossilResult.irreversible) irreversible = fossilResult.irreversible;
      } else {
        messages.push(`化石 ${reward.fossilId}`);
      }
    }
    return {
      ok: true,
      undoable: !irreversible,
      irreversible,
      message: `${label}：${messages.join("、") || "无奖励"}`,
    };
  }

  function applyAmibaRewardToPlayer(player, reward, label = "阿米巴奖励") {
    if (!player || !reward) return { ok: false, message: "没有可结算的阿米巴奖励" };
    const messages = [];
    let irreversible = null;
    if (Object.keys(reward.gain || {}).length) {
      players.gainResources(player, reward.gain);
      messages.push(formatChongGain(reward.gain));
    }
    const dataCount = Math.max(0, Math.round(Number(reward.dataCount) || 0));
    if (dataCount > 0) {
      let gained = 0;
      for (let index = 0; index < dataCount; index += 1) {
        const result = data.gainData(player, { source: "amiba" });
        if (result.ok) gained += 1;
      }
      messages.push(`${gained}/${dataCount}数据`);
    }
    const drawCount = Math.max(0, Math.round(Number(reward.drawCards) || 0));
    if (drawCount > 0) {
      let drawn = 0;
      for (let index = 0; index < drawCount; index += 1) {
        const result = blindDrawCardForPlayer(player);
        if (result.ok) drawn += 1;
      }
      messages.push(`${drawn}/${drawCount}盲抽`);
      irreversible = { code: "hidden_card_reveal", reason: "盲抽翻出新牌" };
    }
    if (reward.region) {
      const regionResult = amiba?.resolveRegionReward?.(alienGameState, reward.region);
      for (const symbolResult of regionResult?.results || []) {
        const symbolRewardResult = applyAmibaRewardToPlayer(
          player,
          symbolResult.reward,
          `${amiba.formatRegionLabel(reward.region)}区域 ${symbolResult.symbolId}`,
        );
        if (symbolRewardResult.message) messages.push(symbolRewardResult.message);
        if (symbolRewardResult.irreversible) irreversible = symbolRewardResult.irreversible;
      }
      if (!regionResult?.results?.length) messages.push(`${amiba?.formatRegionLabel?.(reward.region) || reward.region}区域无 symbol`);
    }
    if (reward.pickAlienCard) messages.push("外星人牌");
    if (reward.pickCard) messages.push("精选1张牌");
    return {
      ok: true,
      undoable: !irreversible,
      irreversible,
      message: `${label}：${messages.join("、") || "无奖励"}`,
    };
  }

  function applyRunezuRewardToPlayer(player, reward, label = "符文族奖励") {
    if (!player || !reward) return { ok: false, message: "没有可结算的符文族奖励" };
    const messages = [];
    let irreversible = null;
    if (Object.keys(reward.gain || {}).length) {
      players.gainResources(player, reward.gain);
      messages.push(formatChongGain(reward.gain));
    }
    const dataCount = Math.max(0, Math.round(Number(reward.dataCount) || 0));
    if (dataCount > 0) {
      let gained = 0;
      for (let index = 0; index < dataCount; index += 1) {
        const result = data.gainData(player, { source: "runezu" });
        if (result.ok) gained += 1;
      }
      messages.push(`${gained}/${dataCount}数据`);
    }
    const drawCount = Math.max(0, Math.round(Number(reward.drawCards) || 0));
    if (drawCount > 0) {
      let drawn = 0;
      for (let index = 0; index < drawCount; index += 1) {
        const result = blindDrawCardForPlayer(player);
        if (result.ok) drawn += 1;
      }
      messages.push(`${drawn}/${drawCount}盲抽`);
      irreversible = { code: "hidden_card_reveal", reason: "盲抽翻出新牌" };
    }
    if (reward.panelSymbol && reward.panelSymbolSlotId) {
      const symbolResult = runezu?.takePanelSymbol?.(alienGameState, reward.panelSymbolSlotId, player, {
        refill: Boolean(reward.refillPanelSymbol),
      });
      if (symbolResult?.ok) {
        messages.push(symbolResult.message);
      } else {
        messages.push(symbolResult?.message || "无白框symbol");
      }
    }
    if (reward.symbolId) {
      runezu?.gainPlayerSymbol?.(player, reward.symbolId);
      messages.push(`获得${runezu?.formatSymbolLabel?.(reward.symbolId) || reward.symbolId}`);
    }
    if (reward.pickAlienCard) messages.push("外星人牌");
    if (reward.pickCard) messages.push("精选1张牌");
    return {
      ok: true,
      undoable: !irreversible,
      irreversible,
      message: `${label}：${messages.join("、") || "无奖励"}`,
    };
  }

  function applyRunezuSymbolReward(player, symbolId, label = "符文族symbol奖励") {
    const resolved = runezu?.getTraceFaceRewardForSymbol?.(alienGameState, symbolId);
    if (!resolved?.ok) {
      return {
        ok: true,
        undoable: true,
        message: resolved?.message || `${runezu?.formatSymbolLabel?.(symbolId) || symbolId}无可结算黑圈奖励`,
      };
    }
    const result = applyRunezuRewardToPlayer(
      player,
      resolved.reward,
      `${label} ${runezu?.formatSymbolLabel?.(symbolId) || symbolId}(${runezu?.formatFaceSymbolSlotLabel?.(resolved.position) || resolved.position})`,
    );
    return {
      ...result,
      symbolId,
      position: resolved.position,
    };
  }

  function claimRunezuSourceSymbolWithHistory(sourceType, sourceId, player, historyLabel = "获得符文族symbol") {
    if (!runezu || !alienGameState.runezu?.revealInitialized || !sourceType || !sourceId || !player) return null;
    const beforeAlienState = structuredClone(alienGameState);
    const beforePlayerState = structuredClone(playerState);
    const result = runezu.claimSourceSymbol(alienGameState, sourceType, sourceId, player);
    if (!result.ok) return result;
    const alienRestore = historyCommands.createRestoreObjectCommand(
      alienGameState,
      beforeAlienState,
      `恢复${historyLabel}前外星人状态`,
    );
    const playerRestore = historyCommands.createRestoreObjectCommand(
      playerState,
      beforePlayerState,
      `恢复${historyLabel}前玩家状态`,
    );
    if (quickActionHistory.hasSession() && !actionHistory.hasSession()) {
      recordQuickHistoryCommand(alienRestore);
      recordQuickHistoryCommand(playerRestore);
    } else if (actionHistory.hasSession() || effectStepActive) {
      recordHistoryCommand(alienRestore);
      recordHistoryCommand(playerRestore);
    }
    return result;
  }

  function closeRunezuCardGainDialog() {
    pendingRunezuCardGain = null;
    if (els.scanTargetOverlay) els.scanTargetOverlay.hidden = true;
  }

  function openRunezuCardGainDialog(options = {}) {
    if (!runezu || !els.scanTargetOverlay || !els.scanTargetActions) {
      return { ok: false, message: "无法打开符文族牌获取窗口" };
    }
    const state = runezu.ensureRunezuState(alienGameState);
    if (state.displayedCardIndex == null) runezu.drawDisplayedCardIndex?.(alienGameState);
    pendingRunezuCardGain = {
      playerId: options.player?.id || getCurrentPlayer()?.id || null,
      fromEffectFlow: Boolean(options.fromEffectFlow),
      effectLabel: options.effectLabel || "符文族外星人牌",
      beforeAlienState: options.beforeAlienState || structuredClone(alienGameState),
      beforePlayerState: options.beforePlayerState || structuredClone(playerState),
    };
    if (els.scanTargetTitle) els.scanTargetTitle.textContent = "获得符文族牌";
    if (els.scanTargetSubtitle) {
      els.scanTargetSubtitle.textContent = "选择当前展示牌、盲抽符文族牌，或取消。";
    }
    if (els.scanTargetCancel) els.scanTargetCancel.hidden = false;

    const cardIndex = alienGameState.runezu?.displayedCardIndex;
    const confirm = document.createElement("button");
    confirm.type = "button";
    confirm.className = "scan-target-option-button";
    confirm.dataset.runezuCardGain = "displayed";
    confirm.innerHTML = cardIndex == null
      ? "确认<small>当前没有展示牌</small>"
      : `<img class="jiuzhe-card-option-image" src="${runezu.getCardSrc(cardIndex)}" alt="" aria-hidden="true"><small>确认拿取展示牌 ${cardIndex}</small>`;
    confirm.disabled = cardIndex == null;

    const blind = document.createElement("button");
    blind.type = "button";
    blind.className = "scan-target-option-button";
    blind.dataset.runezuCardGain = "blind";
    blind.innerHTML = "盲抽<small>从符文族牌堆随机获得 1 张</small>";

    const cancel = document.createElement("button");
    cancel.type = "button";
    cancel.className = "scan-target-option-button";
    cancel.dataset.runezuCardGain = "cancel";
    cancel.innerHTML = "取消<small>不获得符文族牌</small>";

    els.scanTargetActions.replaceChildren(confirm, blind, cancel);
    els.scanTargetOverlay.hidden = false;
    rocketState.statusNote = "符文族牌：请选择获取方式";
    renderStateReadout();
    return { ok: true, awaitingChoice: true, message: rocketState.statusNote };
  }

  function finishRunezuCardGain(message, result = null) {
    const pending = pendingRunezuCardGain;
    const irreversible = getAlienCardGainIrreversible(result);
    closeRunezuCardGainDialog();
    if (pending?.fromEffectFlow && getCurrentActionEffect()) {
      const existingResult = getCurrentActionEffect().result || {};
      if (!effectStepActive) beginEffectHistoryStep(pending.effectLabel);
      recordHistoryCommand(historyCommands.createRestoreObjectCommand(
        alienGameState,
        pending.beforeAlienState,
        "恢复符文族牌获取前外星人状态",
      ));
      recordHistoryCommand(historyCommands.createRestoreObjectCommand(
        playerState,
        pending.beforePlayerState,
        "恢复符文族牌获取前玩家状态",
      ));
      getCurrentActionEffect().result = {
        ok: true,
        undoable: !irreversible,
        irreversible,
        message,
        events: existingResult.events || [],
        payload: result,
      };
      rocketState.statusNote = message;
      renderAlienPanels();
      renderPlayerHand();
      renderPlayerStats();
      completeCurrentActionEffect();
      renderStateReadout();
      return getCurrentActionEffect()?.result || { ok: true, message };
    }
    if (irreversible && pending) {
      beginQuickActionStep("runezu-card", pending.effectLabel || "符文族外星人牌");
      recordQuickHistoryCommand(historyCommands.createRestoreObjectCommand(
        alienGameState,
        pending.beforeAlienState,
        "恢复符文族牌获取前外星人状态",
      ));
      recordQuickHistoryCommand(historyCommands.createRestoreObjectCommand(
        playerState,
        pending.beforePlayerState,
        "恢复符文族牌获取前玩家状态",
      ));
      completeQuickActionStep(message, {
        irreversibleCode: irreversible.code,
        irreversibleReason: irreversible.reason,
      });
    }
    rocketState.statusNote = message;
    renderAlienPanels();
    renderPlayerHand();
    renderPlayerStats();
    updateActionButtons();
    renderStateReadout();
    return { ok: true, message, result };
  }

  function handleRunezuCardGainChoice(choice) {
    if (!pendingRunezuCardGain) return { ok: false, message: "没有符文族牌获取流程" };
    const pending = pendingRunezuCardGain;
    const player = getPlayerById(pending.playerId) || getCurrentPlayer();
    if (!player) return { ok: false, message: "找不到符文族牌获取玩家" };
    if (choice === "cancel") {
      return finishRunezuCardGain("已取消符文族外星人牌");
    }
    const result = choice === "blind"
      ? runezu.blindDrawCard(alienGameState)
      : runezu.takeDisplayedCard(alienGameState);
    if (!result.ok || !result.card) {
      return finishRunezuCardGain(result.message || "符文族牌获取失败", result);
    }
    player.hand.push(result.card);
    player.resources.handSize = player.hand.length;
    return finishRunezuCardGain(result.message, result);
  }

  function closeAmibaCardGainDialog() {
    pendingAmibaCardGain = null;
    if (els.scanTargetOverlay) els.scanTargetOverlay.hidden = true;
  }

  function openAmibaCardGainDialog(options = {}) {
    if (!amiba || !els.scanTargetOverlay || !els.scanTargetActions) {
      return { ok: false, message: "无法打开阿米巴牌获取窗口" };
    }
    const state = amiba.ensureAmibaState(alienGameState);
    if (state.displayedCardIndex == null) amiba.drawDisplayedCardIndex(alienGameState);
    pendingAmibaCardGain = {
      playerId: options.player?.id || getCurrentPlayer()?.id || null,
      fromEffectFlow: Boolean(options.fromEffectFlow),
      effectLabel: options.effectLabel || "阿米巴外星人牌",
      beforeAlienState: options.beforeAlienState || structuredClone(alienGameState),
      beforePlayerState: options.beforePlayerState || structuredClone(playerState),
    };
    if (els.scanTargetTitle) els.scanTargetTitle.textContent = "获得阿米巴牌";
    if (els.scanTargetSubtitle) {
      els.scanTargetSubtitle.textContent = "选择当前展示牌、盲抽阿米巴牌，或取消。";
    }
    if (els.scanTargetCancel) els.scanTargetCancel.hidden = false;

    const cardIndex = alienGameState.amiba?.displayedCardIndex;
    const confirm = document.createElement("button");
    confirm.type = "button";
    confirm.className = "scan-target-option-button";
    confirm.dataset.amibaCardGain = "displayed";
    confirm.innerHTML = cardIndex == null
      ? "确认<small>当前没有展示牌</small>"
      : `<img class="jiuzhe-card-option-image" src="${amiba.getCardSrc(cardIndex)}" alt="" aria-hidden="true"><small>确认拿取展示牌 ${cardIndex}</small>`;
    confirm.disabled = cardIndex == null;

    const blind = document.createElement("button");
    blind.type = "button";
    blind.className = "scan-target-option-button";
    blind.dataset.amibaCardGain = "blind";
    blind.innerHTML = "盲抽<small>从阿米巴牌堆随机获得 1 张</small>";

    const cancel = document.createElement("button");
    cancel.type = "button";
    cancel.className = "scan-target-option-button";
    cancel.dataset.amibaCardGain = "cancel";
    cancel.innerHTML = "取消<small>不获得阿米巴牌</small>";

    els.scanTargetActions.replaceChildren(confirm, blind, cancel);
    els.scanTargetOverlay.hidden = false;
    rocketState.statusNote = "阿米巴牌：请选择获取方式";
    renderStateReadout();
    return { ok: true, awaitingChoice: true, message: rocketState.statusNote };
  }

  function finishAmibaCardGain(message, result = null) {
    const pending = pendingAmibaCardGain;
    const irreversible = getAlienCardGainIrreversible(result);
    closeAmibaCardGainDialog();
    if (pending?.fromEffectFlow && getCurrentActionEffect()) {
      const existingResult = getCurrentActionEffect().result || {};
      if (!effectStepActive) beginEffectHistoryStep(pending.effectLabel);
      recordHistoryCommand(historyCommands.createRestoreObjectCommand(
        alienGameState,
        pending.beforeAlienState,
        "恢复阿米巴牌获取前外星人状态",
      ));
      recordHistoryCommand(historyCommands.createRestoreObjectCommand(
        playerState,
        pending.beforePlayerState,
        "恢复阿米巴牌获取前玩家状态",
      ));
      getCurrentActionEffect().result = {
        ok: true,
        undoable: !irreversible,
        irreversible,
        message,
        events: existingResult.events || [],
        payload: result,
      };
      rocketState.statusNote = message;
      renderAlienPanels();
      renderPlayerHand();
      renderPlayerStats();
      completeCurrentActionEffect();
      renderStateReadout();
      return getCurrentActionEffect()?.result || { ok: true, message };
    }
    if (irreversible && pending) {
      beginQuickActionStep("amiba-card", pending.effectLabel || "阿米巴外星人牌");
      recordQuickHistoryCommand(historyCommands.createRestoreObjectCommand(
        alienGameState,
        pending.beforeAlienState,
        "恢复阿米巴牌获取前外星人状态",
      ));
      recordQuickHistoryCommand(historyCommands.createRestoreObjectCommand(
        playerState,
        pending.beforePlayerState,
        "恢复阿米巴牌获取前玩家状态",
      ));
      completeQuickActionStep(message, {
        irreversibleCode: irreversible.code,
        irreversibleReason: irreversible.reason,
      });
    }
    rocketState.statusNote = message;
    renderAlienPanels();
    renderPlayerHand();
    renderPlayerStats();
    updateActionButtons();
    renderStateReadout();
    return { ok: true, message, result };
  }

  function handleAmibaCardGainChoice(choice) {
    if (!pendingAmibaCardGain) return { ok: false, message: "没有阿米巴牌获取流程" };
    const pending = pendingAmibaCardGain;
    const player = getPlayerById(pending.playerId) || getCurrentPlayer();
    if (!player) return { ok: false, message: "找不到阿米巴牌获取玩家" };
    if (choice === "cancel") {
      return finishAmibaCardGain("已取消阿米巴外星人牌");
    }
    const result = choice === "blind"
      ? amiba.blindDrawCard(alienGameState)
      : amiba.takeDisplayedCard(alienGameState);
    if (!result.ok || !result.card) {
      return finishAmibaCardGain(result.message || "阿米巴牌获取失败", result);
    }
    player.hand.push(result.card);
    player.resources.handSize = player.hand.length;
    return finishAmibaCardGain(result.message, result);
  }

  function closeAomomoCardGainDialog() {
    pendingAomomoCardGain = null;
    if (els.scanTargetOverlay) els.scanTargetOverlay.hidden = true;
  }

  function openAomomoCardGainDialog(options = {}) {
    if (!aomomo || !els.scanTargetOverlay || !els.scanTargetActions) {
      return { ok: false, message: "无法打开奥陌陌牌获取窗口" };
    }
    const state = aomomo.ensureAomomoState(alienGameState);
    if (state.displayedCardIndex == null) aomomo.drawDisplayedCardIndex(alienGameState);
    pendingAomomoCardGain = {
      playerId: options.player?.id || getCurrentPlayer()?.id || null,
      fromEffectFlow: Boolean(options.fromEffectFlow),
      effectLabel: options.effectLabel || "奥陌陌外星人牌",
      beforeAlienState: options.beforeAlienState || structuredClone(alienGameState),
      beforePlayerState: options.beforePlayerState || structuredClone(playerState),
    };
    if (els.scanTargetTitle) els.scanTargetTitle.textContent = "获得奥陌陌牌";
    if (els.scanTargetSubtitle) {
      els.scanTargetSubtitle.textContent = "选择当前展示牌、盲抽奥陌陌牌，或取消。";
    }
    if (els.scanTargetCancel) els.scanTargetCancel.hidden = false;

    const cardIndex = alienGameState.aomomo?.displayedCardIndex;
    const confirm = document.createElement("button");
    confirm.type = "button";
    confirm.className = "scan-target-option-button";
    confirm.dataset.aomomoCardGain = "displayed";
    confirm.innerHTML = cardIndex == null
      ? "确认<small>当前没有展示牌</small>"
      : `<img class="jiuzhe-card-option-image" src="${aomomo.getCardSrc(cardIndex)}" alt="" aria-hidden="true"><small>确认拿取展示牌 ${cardIndex}</small>`;
    confirm.disabled = cardIndex == null;

    const blind = document.createElement("button");
    blind.type = "button";
    blind.className = "scan-target-option-button";
    blind.dataset.aomomoCardGain = "blind";
    blind.innerHTML = "盲抽<small>从奥陌陌牌堆随机获得 1 张</small>";

    const cancel = document.createElement("button");
    cancel.type = "button";
    cancel.className = "scan-target-option-button";
    cancel.dataset.aomomoCardGain = "cancel";
    cancel.innerHTML = "取消<small>不获得奥陌陌牌</small>";

    els.scanTargetActions.replaceChildren(confirm, blind, cancel);
    els.scanTargetOverlay.hidden = false;
    rocketState.statusNote = "奥陌陌牌：请选择获取方式";
    renderStateReadout();
    return { ok: true, awaitingChoice: true, message: rocketState.statusNote };
  }

  function finishAomomoCardGain(message, result = null) {
    const pending = pendingAomomoCardGain;
    const irreversible = getAlienCardGainIrreversible(result);
    closeAomomoCardGainDialog();
    if (pending?.fromEffectFlow && getCurrentActionEffect()) {
      const existingResult = getCurrentActionEffect().result || {};
      if (!effectStepActive) beginEffectHistoryStep(pending.effectLabel);
      recordHistoryCommand(historyCommands.createRestoreObjectCommand(
        alienGameState,
        pending.beforeAlienState,
        "恢复奥陌陌牌获取前外星人状态",
      ));
      recordHistoryCommand(historyCommands.createRestoreObjectCommand(
        playerState,
        pending.beforePlayerState,
        "恢复奥陌陌牌获取前玩家状态",
      ));
      getCurrentActionEffect().result = {
        ok: true,
        undoable: !irreversible,
        irreversible,
        message,
        events: existingResult.events || [],
        payload: result,
      };
      rocketState.statusNote = message;
      renderAlienPanels();
      renderPlayerHand();
      renderPlayerStats();
      completeCurrentActionEffect();
      renderStateReadout();
      return getCurrentActionEffect()?.result || { ok: true, message };
    }
    if (irreversible && pending) {
      beginQuickActionStep("aomomo-card", pending.effectLabel || "奥陌陌外星人牌");
      recordQuickHistoryCommand(historyCommands.createRestoreObjectCommand(
        alienGameState,
        pending.beforeAlienState,
        "恢复奥陌陌牌获取前外星人状态",
      ));
      recordQuickHistoryCommand(historyCommands.createRestoreObjectCommand(
        playerState,
        pending.beforePlayerState,
        "恢复奥陌陌牌获取前玩家状态",
      ));
      completeQuickActionStep(message, {
        irreversibleCode: irreversible.code,
        irreversibleReason: irreversible.reason,
      });
    }
    rocketState.statusNote = message;
    renderAlienPanels();
    renderPlayerHand();
    renderPlayerStats();
    updateActionButtons();
    renderStateReadout();
    return { ok: true, message, result };
  }

  function handleAomomoCardGainChoice(choice) {
    if (!pendingAomomoCardGain) return { ok: false, message: "没有奥陌陌牌获取流程" };
    const pending = pendingAomomoCardGain;
    const player = getPlayerById(pending.playerId) || getCurrentPlayer();
    if (!player) return { ok: false, message: "找不到奥陌陌牌获取玩家" };
    if (choice === "cancel") {
      return finishAomomoCardGain("已取消奥陌陌外星人牌");
    }
    const result = choice === "blind"
      ? aomomo.blindDrawCard(alienGameState)
      : aomomo.takeDisplayedCard(alienGameState);
    if (!result.ok || !result.card) {
      return finishAomomoCardGain(result.message || "奥陌陌牌获取失败", result);
    }
    player.hand.push(result.card);
    player.resources.handSize = player.hand.length;
    return finishAomomoCardGain(result.message, result);
  }

  function closeAmibaSymbolChoiceDialog() {
    pendingAmibaSymbolChoice = null;
    if (els.scanTargetOverlay) els.scanTargetOverlay.hidden = true;
  }

  function openAmibaSymbolChoiceDialog(options = {}) {
    if (!amiba || !els.scanTargetOverlay || !els.scanTargetActions) {
      return { ok: false, message: "无法打开阿米巴 symbol 选择窗口" };
    }
    const player = options.player || getCurrentPlayer();
    if (!player) return { ok: false, message: "没有当前玩家" };
    const region = options.region || options.effect?.options?.region || null;
    const symbols = amiba.listSymbolsInRegion(alienGameState, region);
    pendingAmibaSymbolChoice = {
      region,
      playerId: player.id,
      fromEffectFlow: Boolean(options.fromEffectFlow),
      triggerMatch: options.triggerMatch || null,
      effectLabel: options.effectLabel || options.effect?.label || "阿米巴 symbol 奖励",
      beforeAlienState: options.beforeAlienState || structuredClone(alienGameState),
      beforePlayerState: options.beforePlayerState || structuredClone(playerState),
      beforeCardState: options.beforeCardState || structuredClone(cardState),
    };
    if (els.scanTargetTitle) els.scanTargetTitle.textContent = "阿米巴 symbol";
    if (els.scanTargetSubtitle) {
      els.scanTargetSubtitle.textContent = `选择一个${amiba.formatRegionLabel(region)}区域内的 symbol 结算奖励。`;
    }
    if (els.scanTargetCancel) els.scanTargetCancel.hidden = false;

    const nodes = symbols.map((symbol) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "scan-target-option-button";
      button.dataset.amibaSymbolChoice = symbol.slotId;
      button.innerHTML = `<img class="jiuzhe-card-option-image" src="${amiba.getSymbolSrc(symbol.symbolId)}" alt="" aria-hidden="true"><small>${symbol.symbolId}：${amiba.formatSymbolReward(symbol.symbolId)}；${amiba.formatSymbolSlotLabel?.(symbol.slotId) || symbol.slotId}</small>`;
      return button;
    });
    if (!nodes.length) {
      const empty = document.createElement("p");
      empty.textContent = "该区域当前没有 symbol。";
      nodes.push(empty);
    }
    const cancel = document.createElement("button");
    cancel.type = "button";
    cancel.className = "scan-target-option-button";
    cancel.dataset.amibaSymbolChoice = "cancel";
    cancel.innerHTML = "取消<small>不结算 symbol</small>";
    nodes.push(cancel);

    els.scanTargetActions.replaceChildren(...nodes);
    els.scanTargetOverlay.hidden = false;
    rocketState.statusNote = "阿米巴 symbol：请选择一个 symbol";
    renderStateReadout();
    return { ok: true, awaitingChoice: true, message: rocketState.statusNote };
  }

  function finishAmibaSymbolChoice(message, payload = {}, options = {}) {
    const pending = pendingAmibaSymbolChoice;
    closeAmibaSymbolChoiceDialog();
    if (pending?.triggerMatch?.card && pending?.triggerMatch?.trigger && options.consumeTrigger !== false) {
      cardEffects.consumeTrigger(pending.triggerMatch.card, pending.triggerMatch.trigger.id);
      discardReservedCardIfFinished(getPlayerById(pending.playerId) || getCurrentPlayer(), pending.triggerMatch.card);
    }
    if (pending?.fromEffectFlow && getCurrentActionEffect()) {
      getCurrentActionEffect().result = {
        ok: true,
        undoable: options.undoable !== false,
        message,
        payload,
      };
      rocketState.statusNote = message;
      renderAlienPanels();
      renderPlayerStats();
      renderPlayerHand();
      renderReservedCardsFromTaskState();
      completeCurrentActionEffect();
      renderStateReadout();
      return { ok: true, message, payload };
    }
    rocketState.statusNote = message;
    renderAlienPanels();
    renderPlayerStats();
    renderPlayerHand();
    renderReservedCardsFromTaskState();
    updateActionButtons();
    renderStateReadout();
    return { ok: true, message, payload };
  }

  function handleAmibaSymbolChoice(choice) {
    if (!pendingAmibaSymbolChoice) return { ok: false, message: "没有阿米巴 symbol 选择流程" };
    const pending = pendingAmibaSymbolChoice;
    const player = getPlayerById(pending.playerId) || getCurrentPlayer();
    if (!player) return { ok: false, message: "找不到阿米巴 symbol 玩家" };
    if (choice === "cancel") {
      return finishAmibaSymbolChoice("已取消阿米巴 symbol 奖励", { cancelled: true }, { consumeTrigger: false });
    }
    const beforeAlienState = pending.beforeAlienState;
    const beforePlayerState = pending.beforePlayerState;
    const beforeCardState = pending.beforeCardState;
    const slotId = String(choice || "");
    const result = amiba.resolveSymbolAtSlot(alienGameState, slotId);
    if (!result.ok) {
      rocketState.statusNote = result.message;
      renderStateReadout();
      return result;
    }
    const rewardResult = applyAmibaRewardToPlayer(player, result.reward, `${pending.effectLabel} ${result.symbolId}`);
    const message = `${rewardResult.message}；${result.message}`;

    if (pending.fromEffectFlow) {
      if (!effectStepActive) beginEffectHistoryStep(pending.effectLabel);
      recordHistoryCommand(historyCommands.createRestoreObjectCommand(
        alienGameState,
        beforeAlienState,
        "恢复阿米巴 symbol 前外星人状态",
      ));
      recordHistoryCommand(historyCommands.createRestoreObjectCommand(
        playerState,
        beforePlayerState,
        "恢复阿米巴 symbol 前玩家状态",
      ));
    } else {
      beginQuickActionStep("amiba-symbol", pending.effectLabel);
      recordQuickHistoryCommand(historyCommands.createRestoreObjectCommand(
        alienGameState,
        beforeAlienState,
        "恢复阿米巴 symbol 前外星人状态",
      ));
      recordQuickHistoryCommand(historyCommands.createRestoreObjectCommand(
        playerState,
        beforePlayerState,
        "恢复阿米巴 symbol 前玩家状态",
      ));
      recordQuickHistoryCommand(historyCommands.createRestoreObjectCommand(
        cardState,
        beforeCardState,
        "恢复阿米巴 symbol 前牌区状态",
      ));
      completeQuickActionStep(message, rewardResult.irreversible ? {
        irreversibleCode: rewardResult.irreversible.code,
        irreversibleReason: rewardResult.irreversible.reason,
      } : {});
    }
    return finishAmibaSymbolChoice(message, { symbol: result }, {
      undoable: rewardResult.undoable !== false,
    });
  }

  function closeAmibaTraceRemovalDialog() {
    pendingAmibaTraceRemoval = null;
    if (els.scanTargetOverlay) els.scanTargetOverlay.hidden = true;
  }

  function openAmibaTraceRemovalDialog(effect) {
    if (!amiba || !els.scanTargetOverlay || !els.scanTargetActions) {
      return { ok: false, message: "无法打开阿米巴痕迹移除窗口" };
    }
    const player = getCurrentPlayer();
    const alienSlotId = alienGameState.amiba?.revealedSlotId;
    const options = amiba.listPlayerTraceOptions(alienGameState, alienSlotId, player);
    pendingAmibaTraceRemoval = {
      playerId: player.id,
      alienSlotId,
      effectLabel: effect.label,
      beforeAlienState: structuredClone(alienGameState),
      beforePlayerState: structuredClone(playerState),
    };
    if (els.scanTargetTitle) els.scanTargetTitle.textContent = "移除阿米巴痕迹";
    if (els.scanTargetSubtitle) els.scanTargetSubtitle.textContent = "选择一个自己的阿米巴痕迹，按被移除的颜色结算对应区域奖励。";
    if (els.scanTargetCancel) els.scanTargetCancel.hidden = false;
    const nodes = options.map((option) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "scan-target-option-button";
      button.dataset.amibaTraceRemove = `${option.traceType}:${option.position}`;
      button.innerHTML = `${option.label}<small>${amiba.formatRegionLabel(option.region)}区域奖励</small>`;
      return button;
    });
    if (!nodes.length) {
      const empty = document.createElement("p");
      empty.textContent = "你没有可移除的阿米巴痕迹。";
      nodes.push(empty);
    }
    els.scanTargetActions.replaceChildren(...nodes);
    els.scanTargetOverlay.hidden = false;
    rocketState.statusNote = "阿米巴：请选择要移除的痕迹";
    renderStateReadout();
    return { ok: true, awaitingChoice: true, message: rocketState.statusNote };
  }

  function handleAmibaTraceRemovalChoice(choice) {
    if (!pendingAmibaTraceRemoval) return { ok: false, message: "没有阿米巴痕迹移除流程" };
    const pending = pendingAmibaTraceRemoval;
    const player = getPlayerById(pending.playerId) || getCurrentPlayer();
    if (!player) return { ok: false, message: "找不到阿米巴痕迹玩家" };
    if (choice === "cancel") {
      closeAmibaTraceRemovalDialog();
      rocketState.statusNote = "已取消阿米巴痕迹移除";
      if (getCurrentActionEffect()) {
        getCurrentActionEffect().result = { ok: true, undoable: true, message: rocketState.statusNote };
        completeCurrentActionEffect();
      }
      renderStateReadout();
      return { ok: true, message: rocketState.statusNote };
    }
    const [traceType, positionText] = String(choice || "").split(":");
    beginEffectHistoryStep(pending.effectLabel || "阿米巴痕迹移除");
    const removeResult = amiba.removePlayerTrace(alienGameState, pending.alienSlotId, traceType, Number(positionText), player);
    if (!removeResult.ok) {
      endEffectHistoryStep();
      rocketState.statusNote = removeResult.message;
      renderStateReadout();
      return removeResult;
    }
    const rewardResult = applyAmibaRewardToPlayer(player, removeResult.reward, removeResult.message);
    recordHistoryCommand(historyCommands.createRestoreObjectCommand(
      alienGameState,
      pending.beforeAlienState,
      "恢复阿米巴移除痕迹前外星人状态",
    ));
    recordHistoryCommand(historyCommands.createRestoreObjectCommand(
      playerState,
      pending.beforePlayerState,
      "恢复阿米巴移除痕迹前玩家状态",
    ));
    closeAmibaTraceRemovalDialog();
    const message = rewardResult.message;
    if (getCurrentActionEffect()) {
      getCurrentActionEffect().result = {
        ok: true,
        undoable: true,
        message,
        payload: { removed: removeResult },
      };
      rocketState.statusNote = message;
      renderAlienPanels();
      renderPlayerStats();
      completeCurrentActionEffect();
      renderStateReadout();
      return { ok: true, message };
    }
    rocketState.statusNote = message;
    renderAlienPanels();
    renderPlayerStats();
    renderStateReadout();
    return { ok: true, message };
  }

  function applyChongFossilRewardToPlayer(player, fossilId, label = "虫族化石", repeat = 1) {
    const total = Math.max(1, Math.round(Number(repeat) || 1));
    const reward = chong?.getFossilReward?.(fossilId);
    if (!reward) return { ok: false, message: `找不到化石奖励 ${fossilId}` };
    const messages = [];
    let irreversible = null;
    for (let index = 0; index < total; index += 1) {
      const result = applyChongRewardToPlayer(player, reward, `${label}${total > 1 ? ` ${index + 1}/${total}` : ""}`);
      if (result.message) messages.push(result.message);
      if (result.irreversible) irreversible = result.irreversible;
    }
    return {
      ok: true,
      reward,
      undoable: !irreversible,
      irreversible,
      message: messages.join("；"),
    };
  }

  function closeYichangdianCardGainDialog() {
    pendingYichangdianCardGain = null;
    if (els.scanTargetOverlay) els.scanTargetOverlay.hidden = true;
  }

  function openYichangdianCardGainDialog(options = {}) {
    if (!yichangdian || !els.scanTargetOverlay || !els.scanTargetActions) {
      return { ok: false, message: "无法打开异常点牌窗口" };
    }
    const player = options.player || getCurrentPlayer();
    if (!player) return { ok: false, message: "没有当前玩家" };
    pendingYichangdianCardGain = {
      playerId: player.id,
      fromEffectFlow: Boolean(options.fromEffectFlow),
      effectLabel: options.effectLabel || "异常点外星人牌",
      beforePlayerState: options.beforePlayerState || null,
      beforeAlienState: options.beforeAlienState || null,
    };

    const displayedIndex = alienGameState.yichangdian?.displayedCardIndex;
    if (els.scanTargetTitle) els.scanTargetTitle.textContent = "异常点外星人牌";
    if (els.scanTargetSubtitle) {
      els.scanTargetSubtitle.textContent = `${player.colorLabel}玩家可以拿取当前展示牌、盲抽一张异常点牌，或取消。`;
    }
    if (els.scanTargetCancel) els.scanTargetCancel.hidden = true;

    const nodes = [];
    const displayed = document.createElement("button");
    displayed.type = "button";
    displayed.className = "scan-target-option-button jiuzhe-card-option yichangdian-card-option";
    displayed.dataset.yichangdianCardGain = "displayed";
    displayed.disabled = displayedIndex == null;
    displayed.innerHTML = displayedIndex == null
      ? "确认<small>当前没有展示牌</small>"
      : `<img class="jiuzhe-card-option-image" src="${yichangdian.getCardSrc(displayedIndex)}" alt="" aria-hidden="true"><small>确认拿取展示牌</small>`;
    nodes.push(displayed);

    const blind = document.createElement("button");
    blind.type = "button";
    blind.className = "scan-target-option-button";
    blind.dataset.yichangdianCardGain = "blind";
    blind.innerHTML = "盲抽<small>从异常点牌堆随机获得 1 张</small>";
    nodes.push(blind);

    const cancel = document.createElement("button");
    cancel.type = "button";
    cancel.className = "scan-target-option-button";
    cancel.dataset.yichangdianCardGain = "cancel";
    cancel.innerHTML = "取消<small>不获得外星人牌</small>";
    nodes.push(cancel);

    els.scanTargetActions.replaceChildren(...nodes);
    els.scanTargetOverlay.hidden = false;
    return { ok: true, message: "异常点牌窗口已打开" };
  }

  function finishYichangdianCardGain(message, result = null) {
    const pending = pendingYichangdianCardGain;
    const irreversible = getAlienCardGainIrreversible(result);
    closeYichangdianCardGainDialog();
    rocketState.statusNote = message;
    if (pending?.fromEffectFlow && getCurrentActionEffect()) {
      getCurrentActionEffect().result = {
        ok: true,
        undoable: !irreversible,
        irreversible,
        message,
        payload: { yichangdianCard: result?.card || null },
      };
      completeCurrentActionEffect();
    }
    renderAlienPanels();
    renderRockets();
    renderPlayerStats();
    renderPlayerHand();
    updateActionButtons();
    renderStateReadout();
    return result || { ok: true, message };
  }

  function handleYichangdianCardGainChoice(choice) {
    if (!pendingYichangdianCardGain) return { ok: false, message: "没有异常点牌获取流程" };
    const pending = pendingYichangdianCardGain;
    const player = getPlayerById(pending.playerId) || getCurrentPlayer();
    if (!player) return { ok: false, message: "找不到异常点牌玩家" };

    if (choice === "cancel") {
      return finishYichangdianCardGain("已取消异常点外星人牌");
    }

    const beforePlayerState = pending.beforePlayerState || structuredClone(playerState);
    const beforeAlienState = pending.beforeAlienState || structuredClone(alienGameState);
    const result = choice === "blind"
      ? yichangdian.blindDrawCard(alienGameState)
      : yichangdian.takeDisplayedCard(alienGameState);
    if (!result.ok || !result.card) {
      rocketState.statusNote = result.message;
      renderStateReadout();
      return result;
    }

    player.hand.push(result.card);
    player.resources.handSize = player.hand.length;
    const irreversible = getAlienCardGainIrreversible(result);
    if (!pending.fromEffectFlow) {
      beginQuickActionStep("yichangdian-card", pending.effectLabel || "异常点外星人牌");
      recordQuickHistoryCommand(historyCommands.createRestoreObjectCommand(
        playerState,
        beforePlayerState,
        "恢复异常点拿牌前玩家状态",
      ));
      recordQuickHistoryCommand(historyCommands.createRestoreObjectCommand(
        alienGameState,
        beforeAlienState,
        "恢复异常点拿牌前外星人状态",
      ));
      completeQuickActionStep(null, irreversible ? {
        irreversibleCode: irreversible.code,
        irreversibleReason: irreversible.reason,
      } : {});
    }
    return finishYichangdianCardGain(result.message, result);
  }

  function closeBanrenmaCardGainDialog() {
    pendingBanrenmaCardGain = null;
    if (els.scanTargetOverlay) els.scanTargetOverlay.hidden = true;
  }

  function openBanrenmaCardGainDialog(options = {}) {
    if (!banrenma || !els.scanTargetOverlay || !els.scanTargetActions) {
      return { ok: false, message: "无法打开半人马牌窗口" };
    }
    const player = options.player || getCurrentPlayer();
    if (!player) return { ok: false, message: "没有当前玩家" };
    pendingBanrenmaCardGain = {
      playerId: player.id,
      fromEffectFlow: Boolean(options.fromEffectFlow),
      effectLabel: options.effectLabel || "半人马外星人牌",
      beforePlayerState: options.beforePlayerState || null,
      beforeAlienState: options.beforeAlienState || null,
    };

    const displayedIndex = alienGameState.banrenma?.displayedCardIndex;
    if (els.scanTargetTitle) els.scanTargetTitle.textContent = "半人马外星人牌";
    if (els.scanTargetSubtitle) {
      els.scanTargetSubtitle.textContent = `${player.colorLabel}玩家可以拿取当前展示牌，或盲抽一张半人马牌。`;
    }
    if (els.scanTargetCancel) els.scanTargetCancel.hidden = true;

    const displayed = document.createElement("button");
    displayed.type = "button";
    displayed.className = "scan-target-option-button jiuzhe-card-option banrenma-card-option";
    displayed.dataset.banrenmaCardGain = "displayed";
    displayed.disabled = displayedIndex == null;
    displayed.innerHTML = displayedIndex == null
      ? "确认<small>当前没有展示牌</small>"
      : `<img class="jiuzhe-card-option-image" src="${banrenma.getCardSrc(displayedIndex)}" alt="" aria-hidden="true"><small>确认拿取展示牌</small>`;

    const blind = document.createElement("button");
    blind.type = "button";
    blind.className = "scan-target-option-button";
    blind.dataset.banrenmaCardGain = "blind";
    blind.innerHTML = "盲抽<small>从半人马牌堆随机获得 1 张</small>";

    const cancel = document.createElement("button");
    cancel.type = "button";
    cancel.className = "scan-target-option-button";
    cancel.dataset.banrenmaCardGain = "cancel";
    cancel.innerHTML = "取消<small>不获得外星人牌</small>";

    els.scanTargetActions.replaceChildren(displayed, blind, cancel);
    els.scanTargetOverlay.hidden = false;
    return { ok: true, message: "半人马牌窗口已打开" };
  }

  function finishBanrenmaCardGain(message, result = null) {
    const pending = pendingBanrenmaCardGain;
    const irreversible = getAlienCardGainIrreversible(result);
    closeBanrenmaCardGainDialog();
    rocketState.statusNote = message;
    if (pending?.fromEffectFlow && getCurrentActionEffect()) {
      getCurrentActionEffect().result = {
        ok: true,
        undoable: !irreversible,
        irreversible,
        message,
        payload: { banrenmaCard: result?.card || null },
      };
      completeCurrentActionEffect();
    }
    renderAlienPanels();
    renderRockets();
    renderPlayerStats();
    renderPlayerHand();
    renderReservedCardsFromTaskState();
    updateActionButtons();
    maybeOpenQueuedBanrenmaOpportunity();
    renderStateReadout();
    return result || { ok: true, message };
  }

  function handleBanrenmaCardGainChoice(choice) {
    if (!pendingBanrenmaCardGain) return { ok: false, message: "没有半人马牌获取流程" };
    const pending = pendingBanrenmaCardGain;
    const player = getPlayerById(pending.playerId) || getCurrentPlayer();
    if (!player) return { ok: false, message: "找不到半人马牌玩家" };

    if (choice === "cancel") {
      return finishBanrenmaCardGain("已取消半人马外星人牌");
    }

    const beforePlayerState = pending.beforePlayerState || structuredClone(playerState);
    const beforeAlienState = pending.beforeAlienState || structuredClone(alienGameState);
    const result = choice === "blind"
      ? banrenma.blindDrawCard(alienGameState)
      : banrenma.takeDisplayedCard(alienGameState);
    if (!result.ok || !result.card) {
      rocketState.statusNote = result.message;
      renderStateReadout();
      return result;
    }

    player.hand.push(result.card);
    player.resources.handSize = player.hand.length;
    const irreversible = getAlienCardGainIrreversible(result);
    if (!pending.fromEffectFlow) {
      beginQuickActionStep("banrenma-card", pending.effectLabel || "半人马外星人牌");
      recordQuickHistoryCommand(historyCommands.createRestoreObjectCommand(
        playerState,
        beforePlayerState,
        "恢复半人马拿牌前玩家状态",
      ));
      recordQuickHistoryCommand(historyCommands.createRestoreObjectCommand(
        alienGameState,
        beforeAlienState,
        "恢复半人马拿牌前外星人状态",
      ));
      completeQuickActionStep(null, irreversible ? {
        irreversibleCode: irreversible.code,
        irreversibleReason: irreversible.reason,
      } : {});
    }
    return finishBanrenmaCardGain(result.message, result);
  }

  function closeChongCardGainDialog() {
    pendingChongCardGain = null;
    if (els.scanTargetOverlay) els.scanTargetOverlay.hidden = true;
  }

  function openChongCardGainDialog(options = {}) {
    if (!chong || !els.scanTargetOverlay || !els.scanTargetActions) {
      return { ok: false, message: "无法打开虫族牌获取窗口" };
    }
    const state = chong.ensureChongState(alienGameState);
    if (state.displayedCardIndex == null) chong.drawDisplayedCardIndex(alienGameState);
    pendingChongCardGain = {
      playerId: options.player?.id || getCurrentPlayer()?.id || null,
      fromEffectFlow: Boolean(options.fromEffectFlow),
      effectLabel: options.effectLabel || "虫族外星人牌",
      beforeAlienState: options.beforeAlienState || structuredClone(alienGameState),
      beforePlayerState: options.beforePlayerState || structuredClone(playerState),
    };
    if (els.scanTargetTitle) els.scanTargetTitle.textContent = "获得虫族牌";
    if (els.scanTargetSubtitle) {
      els.scanTargetSubtitle.textContent = "选择当前展示牌、盲抽虫族牌，或取消。";
    }
    if (els.scanTargetCancel) els.scanTargetCancel.hidden = false;

    const cardIndex = alienGameState.chong?.displayedCardIndex;
    const confirm = document.createElement("button");
    confirm.type = "button";
    confirm.className = "scan-target-option-button";
    confirm.dataset.chongCardGain = "displayed";
    confirm.innerHTML = `确认<small>获得展示牌 ${cardIndex ?? "-"}</small>`;

    const blind = document.createElement("button");
    blind.type = "button";
    blind.className = "scan-target-option-button";
    blind.dataset.chongCardGain = "blind";
    blind.innerHTML = "盲抽<small>从虫族牌堆随机获得 1 张</small>";

    const cancel = document.createElement("button");
    cancel.type = "button";
    cancel.className = "scan-target-option-button";
    cancel.dataset.chongCardGain = "cancel";
    cancel.innerHTML = "取消<small>不获得虫族牌</small>";

    els.scanTargetActions.replaceChildren(confirm, blind, cancel);
    els.scanTargetOverlay.hidden = false;
    rocketState.statusNote = "虫族牌：请选择获取方式";
    renderStateReadout();
    return { ok: true, awaitingChoice: true, message: rocketState.statusNote };
  }

  function finishChongCardGain(message, result = null) {
    const pending = pendingChongCardGain;
    const irreversible = getAlienCardGainIrreversible(result);
    closeChongCardGainDialog();
    if (pending?.fromEffectFlow && getCurrentActionEffect()) {
      if (!effectStepActive) beginEffectHistoryStep(pending.effectLabel);
      recordHistoryCommand(historyCommands.createRestoreObjectCommand(
        alienGameState,
        pending.beforeAlienState,
        "恢复虫族牌获取前外星人状态",
      ));
      recordHistoryCommand(historyCommands.createRestoreObjectCommand(
        playerState,
        pending.beforePlayerState,
        "恢复虫族牌获取前玩家状态",
      ));
      getCurrentActionEffect().result = {
        ok: true,
        undoable: !irreversible,
        irreversible,
        message,
        payload: result,
      };
      rocketState.statusNote = message;
      renderAlienPanels();
      renderPlayerHand();
      renderPlayerStats();
      completeCurrentActionEffect();
      renderStateReadout();
      return getCurrentActionEffect()?.result || { ok: true, message };
    }
    if (irreversible && pending) {
      beginQuickActionStep("chong-card", pending.effectLabel || "虫族外星人牌");
      recordQuickHistoryCommand(historyCommands.createRestoreObjectCommand(
        alienGameState,
        pending.beforeAlienState,
        "恢复虫族牌获取前外星人状态",
      ));
      recordQuickHistoryCommand(historyCommands.createRestoreObjectCommand(
        playerState,
        pending.beforePlayerState,
        "恢复虫族牌获取前玩家状态",
      ));
      completeQuickActionStep(message, {
        irreversibleCode: irreversible.code,
        irreversibleReason: irreversible.reason,
      });
    }
    rocketState.statusNote = message;
    renderAlienPanels();
    renderPlayerHand();
    renderPlayerStats();
    updateActionButtons();
    renderStateReadout();
    return { ok: true, message, result };
  }

  function handleChongCardGainChoice(choice) {
    if (!pendingChongCardGain) return { ok: false, message: "没有虫族牌获取流程" };
    const pending = pendingChongCardGain;
    const player = getPlayerById(pending.playerId) || getCurrentPlayer();
    if (!player) return { ok: false, message: "找不到虫族牌获取玩家" };
    if (choice === "cancel") {
      return finishChongCardGain("已取消虫族外星人牌");
    }
    const result = choice === "blind"
      ? chong.blindDrawCard(alienGameState)
      : chong.takeDisplayedCard(alienGameState);
    if (!result.ok || !result.card) {
      return finishChongCardGain(result.message || "虫族牌获取失败", result);
    }
    player.hand.push(result.card);
    player.resources.handSize = player.hand.length;
    return finishChongCardGain(result.message, result);
  }

  function getChongPlanetLabel(planetId) {
    const labels = {
      earth: "地球",
      mars: "火星",
      jupiter: "木星",
      saturn: "土星",
    };
    return planetRewards?.PLANET_NAMES?.[planetId] || labels[planetId] || planetId || "星球";
  }

  function formatChongGain(gain = {}) {
    const parts = [];
    if (gain.score != null) parts.push(`${gain.score}分`);
    if (gain.credits != null) parts.push(`${gain.credits}信用点`);
    if (gain.energy != null) parts.push(`${gain.energy}能量`);
    if (gain.publicity != null) parts.push(`${gain.publicity}宣传`);
    if (gain.additionalPublicScan != null) parts.push(`${gain.additionalPublicScan}额外公共扫描`);
    if (gain.handSize != null) parts.push(`${gain.handSize}张牌`);
    if (gain.availableData != null) parts.push(`${gain.availableData}数据`);
    return parts.join(" + ");
  }

  function formatChongFossilRewardSummary(fossilId) {
    const reward = chong?.getFossilReward?.(fossilId);
    if (!reward) return "未知奖励";
    const parts = [];
    if (Object.keys(reward.gain || {}).length) parts.push(formatChongGain(reward.gain));
    if (reward.dataCount) parts.push(`${reward.dataCount}数据`);
    if (reward.drawCards) parts.push(`${reward.drawCards}盲抽`);
    if (reward.pickCard) parts.push("精选1张牌");
    if (reward.pickAlienCard) parts.push("外星人牌");
    return parts.join(" + ") || "无奖励";
  }

  function restoreMutableObject(target, snapshot) {
    if (!target || !snapshot) return;
    for (const key of Object.keys(target)) delete target[key];
    Object.assign(target, structuredClone(snapshot));
  }

  function closeChongFossilChoiceDialog() {
    pendingChongFossilChoice = null;
    if (els.scanTargetOverlay) els.scanTargetOverlay.hidden = true;
  }

  function closeChongTaskCompletionDialog() {
    pendingChongTaskCompletion = null;
    if (els.scanTargetOverlay) els.scanTargetOverlay.hidden = true;
  }

  function openChongFossilChoiceDialog(options = {}) {
    if (!chong || !els.scanTargetOverlay || !els.scanTargetActions) {
      return { ok: false, message: "无法打开虫族化石选择窗口" };
    }
    const player = options.player || getCurrentPlayer();
    if (!player) return { ok: false, message: "没有当前玩家" };

    const planetIds = options.planetIds?.length
      ? options.planetIds
      : options.planetId
        ? [options.planetId]
        : ["jupiter", "saturn"];
    for (const planetId of planetIds) {
      chong.revealPlanetFossilsToPlayer(alienGameState, planetId, player);
    }
    const fossils = planetIds.flatMap((planetId) => chong.getAvailablePlanetFossils(alienGameState, planetId));
    pendingChongFossilChoice = {
      mode: options.mode || "reward",
      playerId: player.id,
      planetIds,
      planetId: options.planetId || null,
      task: options.task || null,
      card: options.card || null,
      fromEffectFlow: Boolean(options.fromEffectFlow),
      effectLabel: options.effectLabel || "虫族化石",
      beforePlayerState: options.beforePlayerState || structuredClone(playerState),
      beforeAlienState: options.beforeAlienState || structuredClone(alienGameState),
      beforeCardState: options.beforeCardState || structuredClone(cardState),
    };

    if (els.scanTargetTitle) els.scanTargetTitle.textContent = options.title || "选择虫族化石";
    if (els.scanTargetSubtitle) {
      const planetText = planetIds.map(getChongPlanetLabel).join(" / ");
      els.scanTargetSubtitle.textContent = options.subtitle || `${planetText} 的化石已查看。选择 1 枚继续。`;
    }
    if (els.scanTargetCancel) els.scanTargetCancel.hidden = false;

    const nodes = fossils.map((fossil) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "scan-target-option-button chong-fossil-choice-button";
      button.dataset.chongFossilChoice = fossil.fossilId;
      const summary = formatChongFossilRewardSummary(fossil.fossilId);
      button.setAttribute("aria-label", `${getChongPlanetLabel(fossil.planetId)} ${fossil.fossilId}：${summary}`);
      button.title = `${getChongPlanetLabel(fossil.planetId)} ${fossil.fossilId}：${summary}`;

      const image = document.createElement("img");
      image.className = "chong-fossil-choice-image";
      image.src = chong.getFossilSrc(fossil.fossilId);
      image.alt = `${getChongPlanetLabel(fossil.planetId)} ${fossil.fossilId}`;
      image.width = 128;
      image.height = 128;
      image.decoding = "async";

      const meta = document.createElement("small");
      meta.textContent = summary;
      button.append(image, meta);
      return button;
    });
    if (!nodes.length) {
      const empty = document.createElement("p");
      empty.textContent = "没有可用化石。";
      nodes.push(empty);
    }
    els.scanTargetActions.replaceChildren(...nodes);
    els.scanTargetOverlay.hidden = false;
    rocketState.statusNote = "虫族化石：请选择 1 枚化石";
    renderAlienPanels();
    renderStateReadout();
    return { ok: true, awaitingChoice: true, fossils, message: rocketState.statusNote };
  }

  function createChongTransportTokenForFossil(fossil, player) {
    const sector = getPlanetSectorCoordinate(fossil.planetId);
    const tokenResult = rocketActions.createMovableTokenAtSector(rocketState, sector, {
      kind: rocketActions.ROCKET_KIND.CHONG_FOSSIL,
      playerId: player.id,
      color: player.color,
      tokenSrc: chong.FOSSIL_BACK_SRC,
      fossilId: fossil.fossilId,
      label: fossil.fossilId,
      cargo: {
        alien: "chong",
        fossilId: fossil.fossilId,
      },
    });
    if (!tokenResult.ok) return tokenResult;
    chong.attachTransportRocket(alienGameState, fossil.fossilId, tokenResult.rocket.id);
    return tokenResult;
  }

  function openChongPickCardFollowUp(player, fromEffectFlow, effectLabel) {
    return beginCardSelection({
      type: "chong_pick_card",
      player,
      allowBlindDraw: true,
      fromEffectFlow,
      effectLabel,
    });
  }

  function finishChongFossilEffect(message, payload = {}, options = {}) {
    const currentEffect = getCurrentActionEffect();
    if (currentEffect && options.completeEffect !== false) {
      currentEffect.result = {
        ok: true,
        undoable: options.undoable !== false,
        message,
        payload,
      };
      rocketState.statusNote = message;
      renderAlienPanels();
      renderRockets();
      renderPlayerStats();
      renderPlayerHand();
      renderReservedCardsFromTaskState();
      completeCurrentActionEffect();
      renderStateReadout();
    } else {
      rocketState.statusNote = message;
      renderAlienPanels();
      renderRockets();
      renderPlayerStats();
      renderPlayerHand();
      renderReservedCardsFromTaskState();
      updateActionButtons();
      renderStateReadout();
    }
    return { ok: true, message, payload };
  }

  function completeChongTraceTaskWithFossil(pending, fossilId, player) {
    const card = pending.card;
    const task = pending.task || card?.chongTask;
    const rewardResult = applyChongFossilRewardToPlayer(
      player,
      fossilId,
      `完成 ${cards.getCardLabel(card)}：${fossilId}`,
    );
    card.chongTaskCompleted = true;
    removeReservedCardToDiscard(player, card);
    incrementCompletedTaskCount(player);

    beginQuickActionStep("chong-trace-task", `完成虫族任务：${cards.getCardLabel(card)}`);
    recordQuickHistoryCommand(historyCommands.createRestoreObjectCommand(
      playerState,
      pending.beforePlayerState,
      "恢复虫族任务前玩家状态",
    ));
    recordQuickHistoryCommand(historyCommands.createRestoreObjectCommand(
      alienGameState,
      pending.beforeAlienState,
      "恢复虫族任务前外星人状态",
    ));
    recordQuickHistoryCommand(historyCommands.createRestoreObjectCommand(
      cardState,
      pending.beforeCardState,
      "恢复虫族任务前牌区状态",
    ));

    const message = `${rewardResult.message || "虫族任务完成"}；${task?.traceType ? "按痕迹任务结算化石奖励" : ""}`;
    completeQuickActionStep(message, rewardResult.irreversible ? {
      irreversibleCode: rewardResult.irreversible.code,
      irreversibleReason: rewardResult.irreversible.reason,
    } : {});
    closeChongFossilChoiceDialog();
    if (rewardResult.reward?.pickCard) {
      openChongPickCardFollowUp(player, false, `完成 ${cards.getCardLabel(card)}`);
    }
    rocketState.statusNote = message;
    renderAlienPanels();
    renderPlayerStats();
    renderPlayerHand();
    renderReservedCardsFromTaskState();
    updateActionButtons();
    renderStateReadout();
    return { ok: true, message };
  }

  function completeChongTransportTask(pending, player) {
    const card = pending.card;
    const ready = pending.ready || getReadyChongTaskForReservedCard(card, player);
    const delivered = ready?.deliveredTransport;
    const rocketId = delivered?.rocketId;
    if (!ready || !Number.isInteger(rocketId)) {
      return { ok: false, message: "没有已送达的虫族化石任务" };
    }

    const beforePlayerState = pending.beforePlayerState || structuredClone(playerState);
    const beforeAlienState = pending.beforeAlienState || structuredClone(alienGameState);
    const beforeRocketState = pending.beforeRocketState || structuredClone(rocketState);
    const beforeCardState = pending.beforeCardState || structuredClone(cardState);
    const result = chong.completeTransportedFossil(alienGameState, rocketId);
    if (!result.ok) {
      rocketState.statusNote = result.message;
      renderStateReadout();
      return result;
    }

    rocketActions.removeRocket(rocketState, rocketId);
    card.chongTaskCompleted = true;
    removeReservedCardToDiscard(player, card);
    incrementCompletedTaskCount(player);

    beginQuickActionStep("chong-transport-task", `完成虫族任务：${cards.getCardLabel(card)}`);
    recordQuickHistoryCommand(historyCommands.createRestoreObjectCommand(
      playerState,
      beforePlayerState,
      "恢复虫族任务前玩家状态",
    ));
    recordQuickHistoryCommand(historyCommands.createRestoreObjectCommand(
      alienGameState,
      beforeAlienState,
      "恢复虫族任务前外星人状态",
    ));
    recordQuickHistoryCommand(historyCommands.createRestoreRocketStateCommand(
      rocketState,
      beforeRocketState,
      "恢复虫族任务前棋子状态",
    ));
    recordQuickHistoryCommand(historyCommands.createRestoreObjectCommand(
      cardState,
      beforeCardState,
      "恢复虫族任务前牌区状态",
    ));

    const messages = [result.message, `完成任务：${cards.getCardLabel(card)}`];
    let shouldOpenPickCard = Boolean(result.task?.pickCard);
    let irreversible = null;
    if (result.task?.fossilRewardRepeat) {
      const fossilReward = applyChongFossilRewardToPlayer(
        player,
        result.fossil.fossilId,
        `完成 ${cards.getCardLabel(card)}：${result.fossil.fossilId}`,
        result.task.fossilRewardRepeat,
      );
      if (fossilReward.message) messages.push(fossilReward.message);
      if (fossilReward.reward?.pickCard) shouldOpenPickCard = true;
      if (fossilReward.irreversible) irreversible = fossilReward.irreversible;
    }
    const taskReward = applyChongRewardToPlayer(player, result.task || {}, "虫族搬运任务");
    if (taskReward.message && !/无奖励$/.test(taskReward.message)) messages.push(taskReward.message);
    if (taskReward.irreversible) irreversible = taskReward.irreversible;
    const message = messages.join("；");
    completeQuickActionStep(message, irreversible ? {
      irreversibleCode: irreversible.code,
      irreversibleReason: irreversible.reason,
    } : {});
    closeChongTaskCompletionDialog();

    if (shouldOpenPickCard) {
      openChongPickCardFollowUp(player, false, `完成 ${cards.getCardLabel(card)}`);
    }
    rocketState.statusNote = message;
    renderAlienPanels();
    renderRockets();
    renderPlayerStats();
    renderPlayerHand();
    renderReservedCardsFromTaskState();
    updateActionButtons();
    renderStateReadout();
    return { ok: true, message };
  }

  function handleChongTaskCompletionChoice(choice) {
    const pending = pendingChongTaskCompletion;
    if (!pending) return { ok: false, message: "没有虫族任务完成流程" };
    const player = getPlayerById(pending.playerId) || getCurrentPlayer();
    if (!player) return { ok: false, message: "找不到虫族任务玩家" };
    if (choice === "cancel") {
      closeChongTaskCompletionDialog();
      rocketState.statusNote = "已取消虫族任务完成";
      renderStateReadout();
      return { ok: true, message: rocketState.statusNote };
    }
    return completeChongTransportTask(pending, player);
  }

  function handleChongFossilChoice(choice) {
    const pending = pendingChongFossilChoice;
    if (!pending) return { ok: false, message: "没有虫族化石选择流程" };
    const player = getPlayerById(pending.playerId) || getCurrentPlayer();
    if (!player) return { ok: false, message: "找不到虫族化石玩家" };

    if (choice === "cancel") {
      closeChongFossilChoiceDialog();
      const message = "已取消虫族化石选择";
      if (pending.fromEffectFlow) {
        return finishChongFossilEffect(message, { cancelled: true });
      }
      rocketState.statusNote = message;
      renderStateReadout();
      return { ok: true, message };
    }

    const fossilId = String(choice || "");
    const beforeAlienState = pending.beforeAlienState;
    const beforePlayerState = pending.beforePlayerState;
    if (pending.fromEffectFlow && !effectStepActive) {
      beginEffectHistoryStep(pending.effectLabel || "虫族化石");
    }
    if (pending.fromEffectFlow || pending.mode === "pickup" || pending.mode === "reward") {
      recordHistoryCommand(historyCommands.createRestoreObjectCommand(
        alienGameState,
        beforeAlienState,
        "恢复虫族化石前外星人状态",
      ));
      recordHistoryCommand(historyCommands.createRestoreObjectCommand(
        playerState,
        beforePlayerState,
        "恢复虫族化石前玩家状态",
      ));
    }

    if (pending.mode === "pickup") {
      const pickup = chong.pickUpFossil(alienGameState, fossilId, player, pending.task || {}, {
        cardId: pending.card?.id || null,
        cardLabel: pending.card ? cards.getCardLabel(pending.card) : null,
      });
      if (!pickup.ok) {
        restoreMutableObject(alienGameState, beforeAlienState);
        rocketState.statusNote = pickup.message;
        renderStateReadout();
        return pickup;
      }
      const tokenResult = createChongTransportTokenForFossil(pickup.fossil, player);
      if (!tokenResult.ok) {
        restoreMutableObject(alienGameState, beforeAlienState);
        rocketState.statusNote = tokenResult.message;
        renderStateReadout();
        return tokenResult;
      }
      closeChongFossilChoiceDialog();
      const message = `${pickup.message}；${tokenResult.message}`;
      return finishChongFossilEffect(message, {
        fossilId,
        rocketId: tokenResult.rocket.id,
        task: pending.task || null,
      });
    }

    if (pending.mode === "trace-task") {
      return completeChongTraceTaskWithFossil(pending, fossilId, player);
    }

    const rewardResult = applyChongFossilRewardToPlayer(player, fossilId, `${pending.effectLabel} ${fossilId}`);
    closeChongFossilChoiceDialog();
    if (rewardResult.reward?.pickCard) {
      const pickResult = openChongPickCardFollowUp(player, pending.fromEffectFlow, pending.effectLabel);
      if (pickResult.ok) {
        rocketState.statusNote = `${rewardResult.message}；请选择公共牌`;
        renderPlayerStats();
        renderStateReadout();
        return { ok: true, message: rocketState.statusNote };
      }
    }
    if (pending.fromEffectFlow) {
      return finishChongFossilEffect(rewardResult.message, { fossilId, reward: rewardResult.reward || null });
    }
    rocketState.statusNote = rewardResult.message;
    renderPlayerStats();
    renderStateReadout();
    return rewardResult;
  }

  function openChongTraceTaskCompletionPicker(card) {
    const player = getCurrentPlayer();
    const ready = getReadyChongTaskForReservedCard(card, player);
    if (!ready) return { ok: false, message: "这张虫族任务尚未满足条件" };
    if (ready.task?.kind === "transport") {
      if (!els.scanTargetOverlay || !els.scanTargetActions) return { ok: false, message: "无法打开虫族任务确认窗口" };
      pendingChongTaskCompletion = {
        ready,
        card,
        playerId: player.id,
        beforePlayerState: structuredClone(playerState),
        beforeAlienState: structuredClone(alienGameState),
        beforeRocketState: structuredClone(rocketState),
        beforeCardState: structuredClone(cardState),
      };
      const fossilId = ready.deliveredTransport?.fossil?.fossilId || "化石";
      const destination = getChongPlanetLabel(ready.task.destinationPlanetId);
      const rewardSummary = [
        ready.task.fossilRewardRepeat
          ? `${fossilId}奖励 ×${ready.task.fossilRewardRepeat}`
          : null,
        formatChongRewardSummary(ready.task),
      ].filter((part) => part && part !== "无奖励").join("；") || "无额外奖励";
      if (els.scanTargetTitle) els.scanTargetTitle.textContent = "完成虫族任务";
      if (els.scanTargetSubtitle) {
        els.scanTargetSubtitle.textContent = `${cards.getCardLabel(card)} 的 ${fossilId} 已送达${destination}。确认后移除太阳系化石、放回面板并结算奖励。`;
      }
      if (els.scanTargetCancel) els.scanTargetCancel.hidden = false;
      const confirmButton = document.createElement("button");
      confirmButton.type = "button";
      confirmButton.className = "scan-target-option-button";
      confirmButton.dataset.chongTaskComplete = "confirm";
      confirmButton.innerHTML = `确认完成任务<small>${rewardSummary}</small>`;
      els.scanTargetActions.replaceChildren(confirmButton);
      els.scanTargetOverlay.hidden = false;
      rocketState.statusNote = "虫族任务已满足：点击确认完成任务";
      renderStateReadout();
      return { ok: true, awaitingChoice: true, message: rocketState.statusNote };
    }
    return openChongFossilChoiceDialog({
      mode: "trace-task",
      player,
      card,
      task: ready.task,
      title: "完成虫族任务",
      subtitle: `${cards.getCardLabel(card)} 已满足条件。选择木星/土星 1 枚化石，只结算奖励，不移除化石。`,
      effectLabel: `完成 ${cards.getCardLabel(card)}`,
      beforePlayerState: structuredClone(playerState),
      beforeAlienState: structuredClone(alienGameState),
      beforeCardState: structuredClone(cardState),
    });
  }

  function enqueueJiuzheOpportunity(player, opportunity) {
    if (!player || !opportunity) return;
    const exists = jiuzheOpportunityQueue.some((item) => (
      item.playerId === player.id && item.reason === opportunity.reason
    ));
    if (exists) return;
    jiuzheOpportunityQueue.push({
      playerId: player.id,
      reason: opportunity.reason,
      label: opportunity.label,
      cost: opportunity.cost || {},
    });
  }

  function queueJiuzheOpportunitiesForPlayer(player) {
    if (!jiuzhe || !player) return;
    const opportunity = jiuzhe.getPendingOpportunity(alienGameState, player);
    enqueueJiuzheOpportunity(player, opportunity);
  }

  function getJiuzheCardConditionLabel(card, player) {
    const achieved = jiuzhe?.isCardConditionMet?.(card, player, {
      alienGameState,
      planetStatsState,
      nebulaDataState,
    });
    return {
      achieved,
      label: `${card.label || `九折牌 ${card.index}`} · ${card.score || 0}分 · 威胁${card.threat || 0}`,
    };
  }

  function closeJiuzheCardDialog() {
    pendingJiuzheCardPlay = null;
    pendingJiuzheOpportunityOpen = false;
    if (els.scanTargetOverlay) els.scanTargetOverlay.hidden = true;
  }

  function buildJiuzheOpportunitySubtitle(player, opportunity) {
    const remaining = Math.max(0, Math.round(Number(opportunity?.remaining) || 0));
    if (opportunity?.reason === "reveal" && remaining > 1) {
      return `${player.colorLabel}玩家拥有 ${remaining} 次免费打出机会，本次可选择 1 张未打出的九折牌，或放弃本次机会。`;
    }
    return `${player.colorLabel}玩家可以选择 1 张未打出的九折牌，或放弃本次机会。`;
  }

  function openJiuzheCardDialog(player, opportunity = null) {
    if (!jiuzhe || !player || !els.scanTargetOverlay || !els.scanTargetActions) {
      return { ok: false, message: "无法打开九折牌窗口" };
    }
    const cardsForPlayer = jiuzhe.getPlayerJiuzheCards(alienGameState, player);
    if (!cardsForPlayer.length) return { ok: false, message: "该玩家没有九折牌" };

    pendingJiuzheCardPlay = opportunity
      ? { playerId: player.id, ...opportunity }
      : { playerId: player.id, reason: "view", cost: {}, label: "查看九折牌" };
    pendingJiuzheOpportunityOpen = Boolean(opportunity);

    if (els.scanTargetTitle) els.scanTargetTitle.textContent = opportunity ? opportunity.label : "九折牌";
    if (els.scanTargetSubtitle) {
      els.scanTargetSubtitle.textContent = opportunity
        ? buildJiuzheOpportunitySubtitle(player, opportunity)
        : `${player.colorLabel}玩家的九折牌。蓝框=已打出，金框=条件已达成。`;
    }
    if (els.scanTargetCancel) els.scanTargetCancel.hidden = Boolean(opportunity);

    const nodes = cardsForPlayer.map((card) => {
      const status = getJiuzheCardConditionLabel(card, player);
      const button = document.createElement("button");
      button.type = "button";
      button.className = "scan-target-option-button jiuzhe-card-option";
      button.dataset.jiuzheCardChoice = String(card.index);
      button.disabled = !opportunity || card.played;
      button.classList.toggle("is-played", Boolean(card.played));
      button.classList.toggle("is-achieved", Boolean(status.achieved));
      button.innerHTML = `
        <img class="jiuzhe-card-option-image" src="${card.src}" alt="" aria-hidden="true">
        <small>${status.label}${card.played ? " · 已打出" : ""}</small>
      `;
      return button;
    });

    if (opportunity) {
      const skip = document.createElement("button");
      skip.type = "button";
      skip.className = "scan-target-option-button";
      skip.dataset.jiuzheOpportunitySkip = "true";
      skip.innerHTML = "放弃本次机会<small>不会打出九折牌</small>";
      nodes.push(skip);
    }

    els.scanTargetActions.replaceChildren(...nodes);
    els.scanTargetOverlay.hidden = false;
    return { ok: true, message: "九折牌窗口已打开" };
  }

  function handleJiuzheCardChoice(cardIndex) {
    if (!jiuzhe || !pendingJiuzheCardPlay) return { ok: false, message: "没有九折打出机会" };
    const player = getPlayerById(pendingJiuzheCardPlay.playerId);
    if (!player) return { ok: false, message: "找不到九折牌玩家" };
    if (pendingJiuzheCardPlay.reason === "view") return { ok: false, message: "当前只是查看九折牌" };

    const beforePlayerState = structuredClone(playerState);
    const beforeAlienState = structuredClone(alienGameState);
    const cost = pendingJiuzheCardPlay.cost || {};
    if (Object.keys(cost).length && !players.canAfford(player, cost)) {
      rocketState.statusNote = `资源不足，需要 ${players.formatResourceCost(cost)}`;
      renderStateReadout();
      return { ok: false, message: rocketState.statusNote };
    }

    if (Object.keys(cost).length) {
      players.spendResources(player, cost);
    }
    const result = jiuzhe.playJiuzheCard(alienGameState, player, cardIndex, {
      reason: pendingJiuzheCardPlay.reason,
    });
    if (!result.ok) {
      if (Object.keys(cost).length) players.gainResources(player, cost);
      rocketState.statusNote = result.message;
      renderStateReadout();
      return result;
    }

    beginQuickActionStep("jiuzhe-card", pendingJiuzheCardPlay.label || "九折打出");
    recordQuickHistoryCommand(historyCommands.createRestoreObjectCommand(
      playerState,
      beforePlayerState,
      "恢复九折打出前玩家状态",
    ));
    recordQuickHistoryCommand(historyCommands.createRestoreObjectCommand(
      alienGameState,
      beforeAlienState,
      "恢复九折打出前外星人状态",
    ));
    completeQuickActionStep();

    rocketState.statusNote = `${pendingJiuzheCardPlay.label}：${result.message}`;
    queueJiuzheOpportunitiesForPlayer(player);
    closeJiuzheCardDialog();
    renderPlayerStats();
    renderAlienPanels();
    updateActionButtons();
    renderStateReadout();
    maybeOpenQueuedJiuzheOpportunity();
    return result;
  }

  function handleJiuzheOpportunitySkip() {
    if (!jiuzhe || !pendingJiuzheCardPlay) return { ok: false, message: "没有九折打出机会" };
    const player = getPlayerById(pendingJiuzheCardPlay.playerId);
    const beforeAlienState = structuredClone(alienGameState);
    const result = jiuzhe.declineOpportunity(alienGameState, player, pendingJiuzheCardPlay.reason);
    if (result.ok) {
      beginQuickActionStep("jiuzhe-card-skip", pendingJiuzheCardPlay.label || "九折放弃");
      recordQuickHistoryCommand(historyCommands.createRestoreObjectCommand(
        alienGameState,
        beforeAlienState,
        "恢复九折放弃前外星人状态",
      ));
      completeQuickActionStep();
    }
    rocketState.statusNote = result.message;
    queueJiuzheOpportunitiesForPlayer(player);
    closeJiuzheCardDialog();
    renderPlayerStats();
    updateActionButtons();
    renderStateReadout();
    maybeOpenQueuedJiuzheOpportunity();
    return result;
  }

  function maybeOpenQueuedJiuzheOpportunity() {
    if (pendingJiuzheOpportunityOpen || pendingJiuzheCardPlay) return null;
    if (hasActivePendingSubFlow()) return null;
    if (els.scanTargetOverlay && !els.scanTargetOverlay.hidden) return null;
    while (jiuzheOpportunityQueue.length) {
      const next = jiuzheOpportunityQueue.shift();
      const player = getPlayerById(next.playerId);
      if (!player) continue;
      const latest = jiuzhe.getPendingOpportunity(alienGameState, player);
      if (!latest || latest.reason !== next.reason) continue;
      return openJiuzheCardDialog(player, latest);
    }
    return null;
  }

  function getReadyBanrenmaCards(player) {
    if (!banrenma || !player) return [];
    const score = Number(player.resources?.score) || 0;
    return (player.reservedCards || [])
      .map((card, index) => ({ card, index }))
      .filter(({ card }) => {
        if (!banrenma.isBanrenmaCard(card)) return false;
        const mark = banrenma.getPlayerScoreMarks(alienGameState, player)
          .find((item) => item.id === card.banrenmaScoreMarkId || item.cardInstanceId === card.id);
        return mark && score >= Number(mark.threshold || 0);
      });
  }

  function enqueueBanrenmaOpportunity(player, opportunity) {
    if (!player || !opportunity) return;
    const key = `${opportunity.type}:${opportunity.markId || "any"}`;
    const exists = banrenmaOpportunityQueue.some((item) => (
      item.playerId === player.id && `${item.type}:${item.markId || "any"}` === key
    ));
    if (exists) return;
    banrenmaOpportunityQueue.push({
      playerId: player.id,
      type: opportunity.type,
      markId: opportunity.markId || null,
      label: opportunity.label,
    });
  }

  function queueBanrenmaOpportunitiesForPlayer(player) {
    if (!banrenma || !player || !banrenma.isBanrenmaRevealedSlot?.(alienGameState, alienGameState.banrenma?.revealedSlotId)) return;
    const panelMark = banrenma.getPendingPanelMark(alienGameState, player);
    if (panelMark && banrenma.getAvailableBonusPositions(alienGameState).length) {
      enqueueBanrenmaOpportunity(player, {
        type: "panel",
        markId: panelMark.id,
        label: "半人马顶部奖励",
      });
    }
    for (const { card } of getReadyBanrenmaCards(player)) {
      const markId = card.banrenmaScoreMarkId || null;
      enqueueBanrenmaOpportunity(player, {
        type: "card",
        markId,
        label: "半人马条件效果",
      });
    }
  }

  function closeBanrenmaOpportunityDialog() {
    pendingBanrenmaOpportunity = null;
    if (els.scanTargetOverlay) els.scanTargetOverlay.hidden = true;
  }

  function getBanrenmaCardConditionLabel(card) {
    const effects = banrenma?.buildConditionEffects?.(card) || [];
    return effects.map((effect) => effect.label).join("；") || "无条件效果";
  }

  function openBanrenmaOpportunityDialog(player, opportunity) {
    if (!banrenma || !player || !opportunity || !els.scanTargetOverlay || !els.scanTargetActions) {
      return { ok: false, message: "无法打开半人马奖励窗口" };
    }
    pendingBanrenmaOpportunity = {
      playerId: player.id,
      type: opportunity.type,
      markId: opportunity.markId || null,
    };
    if (opportunity.type === "panel") {
      const mark = banrenma.getPlayerScoreMarks(alienGameState, player)
        .find((item) => item.id === opportunity.markId);
      if (els.scanTargetTitle) els.scanTargetTitle.textContent = "半人马顶部奖励";
      if (els.scanTargetSubtitle) {
        els.scanTargetSubtitle.textContent = `${player.colorLabel}玩家达到 ${mark?.threshold ?? "阈值"} 分，选择一个未使用的顶部奖励位。`;
      }
      if (els.scanTargetCancel) els.scanTargetCancel.hidden = true;
      const nodes = banrenma.BONUS_POSITIONS.map((position) => {
        const reward = banrenma.getBonusReward(position);
        const used = Boolean(alienGameState.banrenma?.bonusSlots?.[position]);
        const button = document.createElement("button");
        button.type = "button";
        button.className = "scan-target-option-button";
        button.dataset.banrenmaBonusChoice = String(position);
        button.disabled = used;
        button.innerHTML = `${position}号奖励<small>${reward?.label || ""}${used ? " · 已使用" : ""}</small>`;
        return button;
      });
      els.scanTargetActions.replaceChildren(...nodes);
    } else {
      const readyCards = getReadyBanrenmaCards(player);
      if (els.scanTargetTitle) els.scanTargetTitle.textContent = "半人马条件效果";
      if (els.scanTargetSubtitle) {
        els.scanTargetSubtitle.textContent = `${player.colorLabel}玩家可选择 1 张已打出的半人马牌结算条件效果，之后弃掉该牌并清除一个阈值标记。`;
      }
      if (els.scanTargetCancel) els.scanTargetCancel.hidden = true;
      const nodes = readyCards.map(({ card }) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "scan-target-option-button jiuzhe-card-option banrenma-card-option";
        button.dataset.banrenmaCardChoice = card.id;
        button.innerHTML = `
          <img class="jiuzhe-card-option-image" src="${card.src || banrenma.getCardSrc(card.alienCardId)}" alt="" aria-hidden="true">
          <small>${cards.getCardLabel(card)} · ${getBanrenmaCardConditionLabel(card)}</small>
        `;
        return button;
      });
      els.scanTargetActions.replaceChildren(...nodes);
    }
    els.scanTargetOverlay.hidden = false;
    return { ok: true, message: "半人马奖励窗口已打开" };
  }

  function maybeOpenQueuedBanrenmaOpportunity() {
    if (pendingBanrenmaOpportunity || pendingBanrenmaCardGain) return null;
    if (hasActivePendingSubFlow()) return null;
    if (els.scanTargetOverlay && !els.scanTargetOverlay.hidden) return null;
    while (banrenmaOpportunityQueue.length) {
      const next = banrenmaOpportunityQueue.shift();
      const player = getPlayerById(next.playerId);
      if (!player) continue;
      if (next.type === "panel") {
        const latest = banrenma.getPendingPanelMark(alienGameState, player);
        if (!latest || latest.id !== next.markId || !banrenma.getAvailableBonusPositions(alienGameState).length) continue;
        return openBanrenmaOpportunityDialog(player, next);
      }
      if (!getReadyBanrenmaCards(player).length) continue;
      return openBanrenmaOpportunityDialog(player, next);
    }
    return null;
  }

  function completeBanrenmaOpportunityStep(player, beforePlayerState, beforeAlienState, beforeCardState, label) {
    beginQuickActionStep("banrenma-opportunity", label || "半人马奖励");
    recordQuickHistoryCommand(historyCommands.createRestoreObjectCommand(
      playerState,
      beforePlayerState,
      "恢复半人马奖励前玩家状态",
    ));
    recordQuickHistoryCommand(historyCommands.createRestoreObjectCommand(
      alienGameState,
      beforeAlienState,
      "恢复半人马奖励前外星人状态",
    ));
    if (beforeCardState) {
      recordQuickHistoryCommand(historyCommands.createRestorePublicCardsCommand(
        cardState,
        beforeCardState.publicCards,
        beforeCardState.discardPile,
      ));
    }
    completeQuickActionStep();
  }

  function handleBanrenmaBonusChoice(position) {
    if (!pendingBanrenmaOpportunity || pendingBanrenmaOpportunity.type !== "panel") {
      return { ok: false, message: "没有半人马顶部奖励机会" };
    }
    const player = getPlayerById(pendingBanrenmaOpportunity.playerId);
    if (!player) return { ok: false, message: "找不到半人马玩家" };
    const beforePlayerState = structuredClone(playerState);
    const beforeAlienState = structuredClone(alienGameState);
    const markResult = banrenma.markBonusSlotUsed(
      alienGameState,
      player,
      Number(position),
      pendingBanrenmaOpportunity.markId,
    );
    if (!markResult.ok) {
      rocketState.statusNote = markResult.message;
      renderStateReadout();
      return markResult;
    }
    banrenma.resolveScoreMark(alienGameState, player, pendingBanrenmaOpportunity.markId);
    const rewardResult = applyBanrenmaRewardToPlayer(player, markResult.reward, markResult.message);
    completeBanrenmaOpportunityStep(player, beforePlayerState, beforeAlienState, null, markResult.message);
    closeBanrenmaOpportunityDialog();
    rocketState.statusNote = rewardResult.message || markResult.message;
    renderAlienPanels();
    renderPlayerStats();
    updateActionButtons();
    renderStateReadout();
    if (markResult.reward?.pickAlienCard) {
      openBanrenmaCardGainDialog({
        player,
        effectLabel: "半人马顶部奖励外星人牌",
      });
    } else if (markResult.reward?.alienTrace) {
      pendingAlienTraceAction = {
        type: "banrenma_bonus_alien_trace",
        beforeAlienState: structuredClone(alienGameState),
        beforePlayerState: structuredClone(playerState),
        effectLabel: "半人马顶部奖励外星人痕迹",
      };
      openAlienTracePicker({ allowedTraceTypes: aliens.TRACE_TYPES });
    } else {
      queueBanrenmaOpportunitiesForPlayer(player);
      maybeOpenQueuedBanrenmaOpportunity();
    }
    return markResult;
  }

  function handleBanrenmaCardConditionChoice(cardId) {
    if (!pendingBanrenmaOpportunity || pendingBanrenmaOpportunity.type !== "card") {
      return { ok: false, message: "没有半人马条件效果机会" };
    }
    const player = getPlayerById(pendingBanrenmaOpportunity.playerId);
    if (!player) return { ok: false, message: "找不到半人马玩家" };
    const cardIndex = player.reservedCards?.findIndex((card) => card.id === cardId) ?? -1;
    const card = cardIndex >= 0 ? player.reservedCards[cardIndex] : null;
    if (!card || !banrenma.isBanrenmaCard(card)) {
      rocketState.statusNote = "找不到可结算的半人马牌";
      renderStateReadout();
      return { ok: false, message: rocketState.statusNote };
    }
    const beforePlayerState = structuredClone(playerState);
    const beforeAlienState = structuredClone(alienGameState);
    const beforeCardState = {
      publicCards: cardState.publicCards.slice(),
      discardPile: (cardState.discardPile || []).slice(),
    };
    const mark = banrenma.getPlayerScoreMarks(alienGameState, player)
      .find((item) => item.id === card.banrenmaScoreMarkId || item.cardInstanceId === card.id);
    if (!mark || Number(player.resources?.score || 0) < Number(mark.threshold || 0)) {
      rocketState.statusNote = "这张半人马牌尚未达到阈值";
      renderStateReadout();
      return { ok: false, message: rocketState.statusNote };
    }
    const [removedCard] = player.reservedCards.splice(cardIndex, 1);
    cards.addToDiscardPile(cardState, removedCard);
    banrenma.resolveScoreMark(alienGameState, player, mark.id);
    const effects = banrenma.buildConditionEffects(removedCard);
    completeBanrenmaOpportunityStep(
      player,
      beforePlayerState,
      beforeAlienState,
      beforeCardState,
      `半人马条件：${cards.getCardLabel(removedCard)}`,
    );
    closeBanrenmaOpportunityDialog();
    rocketState.statusNote = `半人马条件：弃掉 ${cards.getCardLabel(removedCard)}`;
    renderPlayerStats();
    renderPlayerHand();
    renderReservedCardsFromTaskState();
    renderAlienPanels();
    updateActionButtons();
    renderStateReadout();
    if (effects.length) {
      startCardEffectFlow("banrenma-condition-effects", `半人马条件：${cards.getCardLabel(removedCard)}`, effects, {
        actionType: "banrenmaCondition",
        card: removedCard,
      });
    } else {
      queueBanrenmaOpportunitiesForPlayer(player);
      maybeOpenQueuedBanrenmaOpportunity();
    }
    return { ok: true, card: removedCard, effects, message: rocketState.statusNote };
  }

  function handleJiuzheRevealSideEffects(alienSlotId, revealResult, triggerPlayer) {
    if (!jiuzhe || !revealResult?.ok || revealResult.alienId !== jiuzhe.ALIEN_ID) return null;
    const initResult = jiuzhe.initializeJiuzheReveal(
      alienGameState,
      alienSlotId,
      triggerPlayer,
      getActivePlayers(),
    );
    for (const player of getActivePlayers()) {
      queueJiuzheOpportunitiesForPlayer(player);
    }
    return {
      ...initResult,
      rewardMessages: [],
      message: initResult.message,
    };
  }

  function handleYichangdianRevealSideEffects(alienSlotId, revealResult, triggerPlayer) {
    if (!yichangdian || !revealResult?.ok || revealResult.alienId !== yichangdian.ALIEN_ID) return null;
    const earth = getEarthSectorCoordinate();
    const initResult = yichangdian.initializeYichangdianReveal(
      alienGameState,
      alienSlotId,
      triggerPlayer,
      earth.x,
    );
    return {
      ...initResult,
      rewardMessages: [],
      message: initResult.message,
    };
  }

  function handleBanrenmaRevealSideEffects(alienSlotId, revealResult, triggerPlayer) {
    if (!banrenma || !revealResult?.ok || revealResult.alienId !== banrenma.ALIEN_ID) return null;
    const initResult = banrenma.initializeBanrenmaReveal(
      alienGameState,
      alienSlotId,
      triggerPlayer,
      getActivePlayers(),
    );
    for (const player of getActivePlayers()) {
      queueBanrenmaOpportunitiesForPlayer(player);
    }
    return {
      ...initResult,
      rewardMessages: [],
      message: initResult.message,
    };
  }

  function handleChongRevealSideEffects(alienSlotId, revealResult, triggerPlayer) {
    if (!chong || !revealResult?.ok || revealResult.alienId !== chong.ALIEN_ID) return null;
    const initResult = chong.initializeChongReveal(
      alienGameState,
      alienSlotId,
      triggerPlayer,
    );
    return {
      ...initResult,
      rewardMessages: [],
      message: initResult.message,
    };
  }

  function handleAmibaRevealSideEffects(alienSlotId, revealResult, triggerPlayer) {
    if (!amiba || !revealResult?.ok || revealResult.alienId !== amiba.ALIEN_ID) return null;
    const initResult = amiba.initializeAmibaReveal(
      alienGameState,
      alienSlotId,
      triggerPlayer,
    );
    return {
      ...initResult,
      rewardMessages: [],
      message: initResult.message,
    };
  }

  function activateAomomoBoard(options = {}) {
    solarState.aomomoActive = true;
    const existingTokens = data.listNebulaTokens(nebulaDataState, aomomo.NEBULA_ID);
    let fillResult = null;
    if (options.replaceData || !existingTokens.length) {
      if (options.replaceData) data.clearNebulaData(nebulaDataState, aomomo.NEBULA_ID);
      fillResult = data.fillNebulaData(nebulaDataState, aomomo.NEBULA_ID, {
        source: options.source || "aomomo_reveal",
      });
    }
    renderWheels();
    renderSectorNebulaDataBoard();
    renderRockets();
    return fillResult;
  }

  function handleAomomoRevealSideEffects(alienSlotId, revealResult, triggerPlayer) {
    if (!aomomo || !revealResult?.ok || revealResult.alienId !== aomomo.ALIEN_ID) return null;
    const initResult = aomomo.initializeAomomoReveal(
      alienGameState,
      alienSlotId,
      triggerPlayer,
    );
    const fillResult = activateAomomoBoard({ source: "aomomo_reveal" });
    const fillMessage = fillResult?.ok ? `；${fillResult.message}` : "";
    return {
      ...initResult,
      rewardMessages: [],
      fillResult,
      message: `${initResult.message}${fillMessage}`,
    };
  }

  function handleRunezuRevealSideEffects(alienSlotId, revealResult, triggerPlayer) {
    if (!runezu || !revealResult?.ok || revealResult.alienId !== runezu.ALIEN_ID) return null;
    const initResult = runezu.initializeRunezuReveal(
      alienGameState,
      alienSlotId,
      triggerPlayer,
      { techBoardState: techGameState.board },
    );
    return {
      ...initResult,
      rewardMessages: [],
      message: initResult.message,
    };
  }

  function triggerYichangdianAnomalyForEarthX(earthX) {
    if (!yichangdian || !alienGameState.yichangdian?.revealInitialized) return null;
    const yState = alienGameState.yichangdian;
    const anomaly = yichangdian.getAnomalyBySectorX(alienGameState, earthX);
    yichangdian.updateNextAnomaly(alienGameState, earthX);
    if (!anomaly || !yState.revealedSlotId) return null;

    anomaly.triggeredCount = (Number(anomaly.triggeredCount) || 0) + 1;
    const reward = yichangdian.getAnomalyReward(anomaly.markerId);
    const topEntry = reward?.traceType
      ? yichangdian.getTopTraceEntry(alienGameState, yState.revealedSlotId, reward.traceType)
      : null;
    const player = findPlayerForYichangdianEntry(topEntry);
    if (!player) {
      return {
        ok: true,
        anomaly,
        reward,
        player: null,
        events: [{ type: "yichangdianAnomalyTriggered", markerId: anomaly.markerId, sectorX: anomaly.sectorX }],
        message: `异常触发：${yichangdian.formatAnomalyLabel(anomaly)}，对应颜色没有痕迹`,
      };
    }

    const rewardResult = applyYichangdianRewardToPlayer(
      player,
      reward,
      `异常触发 ${anomaly.markerId}`,
    );
    if (reward?.pickCard) {
      beginCardSelection({
        type: "yichangdian_anomaly_pick",
        player,
        allowBlindDraw: true,
      });
    }
    return {
      ok: true,
      anomaly,
      reward,
      player,
      events: [{
        type: "yichangdianAnomalyTriggered",
        markerId: anomaly.markerId,
        sectorX: anomaly.sectorX,
        playerId: player.id,
        playerColor: player.color,
      }],
      message: `${rewardResult.message}${reward?.pickCard ? "，请选择公共牌" : ""}`,
    };
  }

  function confirmAlienTracePlacement(alienSlotId, traceType) {
    const currentPlayer = getCurrentPlayer();
    const inDebugMode = isDebugAlienTraceMode();
    const pending = pendingAlienTraceAction;
    const beforeAlienState = pending?.beforeAlienState || structuredClone(alienGameState);
    const beforePlayerState = pending?.beforePlayerState || structuredClone(playerState);
    pendingAlienTraceAction = null;
    const result = aliens.placeFirstTrace(
      alienGameState,
      alienSlotId,
      traceType,
      currentPlayer.color,
    );
    if (!inDebugMode) {
      closeAlienTracePicker();
    }
    const revealResult = maybeRevealAlienAfterTrace(alienSlotId, result);
    const revealIrreversibleReason = revealResult?.ok
      ? "外星人揭示初始化随机内容"
      : null;
    const revealSideEffect = handleJiuzheRevealSideEffects(alienSlotId, revealResult, currentPlayer)
      || handleYichangdianRevealSideEffects(alienSlotId, revealResult, currentPlayer)
      || handleFangzhouRevealSideEffects(alienSlotId, revealResult, currentPlayer)
      || handleBanrenmaRevealSideEffects(alienSlotId, revealResult, currentPlayer)
      || handleChongRevealSideEffects(alienSlotId, revealResult, currentPlayer)
      || handleAmibaRevealSideEffects(alienSlotId, revealResult, currentPlayer)
      || handleAomomoRevealSideEffects(alienSlotId, revealResult, currentPlayer)
      || handleRunezuRevealSideEffects(alienSlotId, revealResult, currentPlayer);
    rocketState.statusNote = revealSideEffect?.message || revealResult?.message || result.message;
    const traceEvents = result.ok && !inDebugMode
      ? [buildAlienTraceEvent(alienSlotId, traceType, currentPlayer, revealResult?.alienId || null)]
      : [];
    if (pending?.type === "planet_reward_alien_trace" && result.ok) {
      beginEffectHistoryStep(pending.effectLabel || "外星人标记奖励");
      recordHistoryCommand(historyCommands.createRestoreObjectCommand(
        alienGameState,
        beforeAlienState,
        "恢复外星人标记奖励前状态",
      ));
      recordHistoryCommand(historyCommands.createRestoreObjectCommand(
        playerState,
        beforePlayerState,
        "恢复外星人标记奖励前玩家状态",
      ));
      if (getCurrentActionEffect()) {
        getCurrentActionEffect().result = {
          ok: true,
          undoable: !revealIrreversibleReason,
          irreversible: revealIrreversibleReason
            ? { code: "alien_reveal_random_setup", reason: revealIrreversibleReason }
            : null,
          message: rocketState.statusNote,
          events: traceEvents,
          payload: { alienSlotId, traceType, revealed: revealResult || null },
        };
      }
      completeCurrentActionEffect();
    } else if (pending?.type === "banrenma_bonus_alien_trace" && result.ok) {
      beginQuickActionStep("banrenma-alien-trace", pending.effectLabel || "半人马外星人痕迹");
      recordQuickHistoryCommand(historyCommands.createRestoreObjectCommand(
        alienGameState,
        beforeAlienState,
        "恢复半人马痕迹奖励前外星人状态",
      ));
      recordQuickHistoryCommand(historyCommands.createRestoreObjectCommand(
        playerState,
        beforePlayerState,
        "恢复半人马痕迹奖励前玩家状态",
      ));
      completeQuickActionStep();
      settleCardTasksAfterEffect({ events: traceEvents, render: true });
    } else if (result.ok) {
      settleCardTasksAfterEffect({ events: traceEvents, render: true });
    }
    renderAlienPanels();
    if (revealResult?.alienId === chong?.ALIEN_ID || revealResult?.alienId === aomomo?.ALIEN_ID) {
      renderRockets();
    }
    renderPlayerStats();
    maybeOpenQueuedJiuzheOpportunity();
    maybeOpenQueuedBanrenmaOpportunity();
    renderStateReadout();
    return revealResult || result;
  }

  function confirmYichangdianTracePlacement(alienSlotId, traceType, position) {
    const inDebugMode = isDebugAlienTraceMode();
    if (!yichangdian || (!isYichangdianTracePlacementMode() && !inDebugMode)) {
      rocketState.statusNote = "请先通过获取外星人标记进入异常点放置模式";
      renderStateReadout();
      return { ok: false, message: rocketState.statusNote };
    }
    if (!canPlaceYichangdianTrace(alienSlotId, traceType, position)) {
      rocketState.statusNote = "该异常点痕迹位不可放置";
      renderStateReadout();
      return { ok: false, message: rocketState.statusNote };
    }

    const currentPlayer = getCurrentPlayer();
    const pending = pendingAlienTraceAction;
    const beforeAlienState = pending?.beforeAlienState || structuredClone(alienGameState);
    const beforePlayerState = pending?.beforePlayerState || structuredClone(playerState);
    if (!inDebugMode) {
      pendingAlienTraceAction = null;
      if (alienTracePickerState?.mode === "yichangdian-grid") {
        alienTracePickerState = null;
      }
    }

    const result = yichangdian.placeYichangdianTrace(
      alienGameState,
      alienSlotId,
      traceType,
      position,
      currentPlayer,
    );
    if (!result.ok) {
      rocketState.statusNote = result.message;
      renderAlienPanels();
      renderStateReadout();
      return result;
    }

    const rewardResult = applyYichangdianRewardToPlayer(
      currentPlayer,
      result.reward,
      `异常点${yichangdian.formatTraceLabel(traceType, Number(position))}`,
    );
    rocketState.statusNote = rewardResult.ok ? rewardResult.message : result.message;
    const traceEvents = !inDebugMode
      ? [buildAlienTraceEvent(alienSlotId, traceType, currentPlayer, yichangdian.ALIEN_ID)]
      : [];

    if (pending?.type === "planet_reward_alien_trace") {
      beginEffectHistoryStep(pending.effectLabel || "异常点痕迹奖励");
      recordHistoryCommand(historyCommands.createRestoreObjectCommand(
        alienGameState,
        beforeAlienState,
        "恢复异常点痕迹奖励前外星人状态",
      ));
      recordHistoryCommand(historyCommands.createRestoreObjectCommand(
        playerState,
        beforePlayerState,
        "恢复异常点痕迹奖励前玩家状态",
      ));
      if (getCurrentActionEffect()) {
        getCurrentActionEffect().result = {
          ok: true,
          undoable: true,
          message: rocketState.statusNote,
          events: traceEvents,
          payload: { alienSlotId, traceType, position, reward: result.reward || null },
        };
      }
    } else {
      settleCardTasksAfterEffect({ events: traceEvents, render: false });
    }

    renderAlienPanels();
    renderPlayerStats();

    if (result.reward?.pickAlienCard) {
      const openResult = openYichangdianCardGainDialog({
        player: currentPlayer,
        fromEffectFlow: pending?.type === "planet_reward_alien_trace",
        effectLabel: pending?.effectLabel || "异常点外星人牌",
        beforeAlienState,
        beforePlayerState,
      });
      if (!openResult.ok && pending?.type === "planet_reward_alien_trace") {
        completeCurrentActionEffect();
      }
      return result;
    }

    if (pending?.type === "planet_reward_alien_trace") {
      completeCurrentActionEffect();
    }
    updateActionButtons();
    renderStateReadout();
    return result;
  }

  function confirmFangzhouTracePlacement(alienSlotId, traceType, position) {
    const inDebugMode = isDebugAlienTraceMode();
    if (!fangzhou || (!isFangzhouTracePlacementMode() && !inDebugMode)) {
      rocketState.statusNote = "请先通过获取外星人标记进入方舟放置模式";
      renderStateReadout();
      return { ok: false, message: rocketState.statusNote };
    }
    if (!canPlaceFangzhouTrace(alienSlotId, traceType, position)) {
      rocketState.statusNote = "该方舟痕迹位不可放置";
      renderStateReadout();
      return { ok: false, message: rocketState.statusNote };
    }

    const currentPlayer = getCurrentPlayer();
    const pending = pendingAlienTraceAction;
    const beforeAlienState = pending?.beforeAlienState || structuredClone(alienGameState);
    const beforePlayerState = pending?.beforePlayerState || structuredClone(playerState);
    if (!inDebugMode) {
      pendingAlienTraceAction = null;
      if (alienTracePickerState?.mode === "fangzhou-grid") {
        alienTracePickerState = null;
      }
    }

    const result = fangzhou.placeFangzhouTrace(
      alienGameState,
      alienSlotId,
      traceType,
      position,
      currentPlayer,
    );
    if (!result.ok) {
      rocketState.statusNote = result.message;
      renderAlienPanels();
      renderStateReadout();
      return result;
    }

    const rewardResult = applyFangzhouTraceRewardToPlayer(
      currentPlayer,
      result.reward,
      `方舟${fangzhou.formatTraceLabel(traceType, Number(position))}`,
    );

    rocketState.statusNote = rewardResult.ok ? rewardResult.message : result.message;
    const traceEvents = !inDebugMode
      ? [buildAlienTraceEvent(alienSlotId, traceType, currentPlayer, fangzhou.ALIEN_ID)]
      : [];

    if (pending?.type === "planet_reward_alien_trace") {
      beginEffectHistoryStep(pending.effectLabel || "方舟痕迹奖励");
      recordHistoryCommand(historyCommands.createRestoreObjectCommand(
        alienGameState,
        beforeAlienState,
        "恢复方舟痕迹奖励前外星人状态",
      ));
      recordHistoryCommand(historyCommands.createRestoreObjectCommand(
        playerState,
        beforePlayerState,
        "恢复方舟痕迹奖励前玩家状态",
      ));
      if (getCurrentActionEffect()) {
        getCurrentActionEffect().result = {
          ok: true,
          undoable: rewardResult.undoable !== false,
          irreversible: rewardResult.irreversible || null,
          message: rocketState.statusNote,
          events: traceEvents,
          payload: { alienSlotId, traceType, position, reward: result.reward || null },
        };
      }
    } else {
      beginQuickActionStep("fangzhou-trace", rocketState.statusNote);
      recordQuickHistoryCommand(historyCommands.createRestoreObjectCommand(
        alienGameState,
        beforeAlienState,
        "恢复方舟痕迹放置前外星人状态",
      ));
      recordQuickHistoryCommand(historyCommands.createRestoreObjectCommand(
        playerState,
        beforePlayerState,
        "恢复方舟痕迹放置前玩家状态",
      ));
      completeQuickActionStep(null, rewardResult.irreversible ? {
        irreversibleCode: rewardResult.irreversible.code,
        irreversibleReason: rewardResult.irreversible.reason,
      } : {});
      settleCardTasksAfterEffect({ events: traceEvents, render: false });
    }

    renderAlienPanels();
    renderPlayerStats();
    renderPlayerHand();
    renderReservedCardsFromTaskState();

    if (pending?.type === "planet_reward_alien_trace") {
      completeCurrentActionEffect();
    }
    updateActionButtons();
    renderStateReadout();
    return result;
  }

  function confirmBanrenmaTracePlacement(alienSlotId, traceType, position) {
    const inDebugMode = isDebugAlienTraceMode();
    if (!banrenma || (!isBanrenmaTracePlacementMode() && !inDebugMode)) {
      rocketState.statusNote = "请先通过获取外星人标记进入半人马放置模式";
      renderStateReadout();
      return { ok: false, message: rocketState.statusNote };
    }
    if (!canPlaceBanrenmaTrace(alienSlotId, traceType, position)) {
      rocketState.statusNote = "该半人马痕迹位不可放置";
      renderStateReadout();
      return { ok: false, message: rocketState.statusNote };
    }

    const currentPlayer = getCurrentPlayer();
    const rewardPreview = banrenma.getTraceReward(traceType, Number(position));
    if (rewardPreview?.payData && getAvailableDataTokenCount(currentPlayer) < rewardPreview.payData) {
      rocketState.statusNote = `数据不足：该位置需要 ${rewardPreview.payData} 数据`;
      renderStateReadout();
      return { ok: false, message: rocketState.statusNote };
    }

    const pending = pendingAlienTraceAction;
    const beforeAlienState = pending?.beforeAlienState || structuredClone(alienGameState);
    const beforePlayerState = pending?.beforePlayerState || structuredClone(playerState);
    if (!inDebugMode) {
      pendingAlienTraceAction = null;
      if (alienTracePickerState?.mode === "banrenma-grid") {
        alienTracePickerState = null;
      }
    }

    const result = banrenma.placeBanrenmaTrace(
      alienGameState,
      alienSlotId,
      traceType,
      position,
      currentPlayer,
    );
    if (!result.ok) {
      rocketState.statusNote = result.message;
      renderAlienPanels();
      renderStateReadout();
      return result;
    }

    const rewardResult = applyBanrenmaRewardToPlayer(
      currentPlayer,
      result.reward,
      `半人马${banrenma.formatTraceLabel(traceType, Number(position))}`,
    );
    rocketState.statusNote = rewardResult.ok ? rewardResult.message : result.message;
    const traceEvents = !inDebugMode
      ? [buildAlienTraceEvent(alienSlotId, traceType, currentPlayer, banrenma.ALIEN_ID)]
      : [];

    if (pending?.type === "planet_reward_alien_trace") {
      beginEffectHistoryStep(pending.effectLabel || "半人马痕迹奖励");
      recordHistoryCommand(historyCommands.createRestoreObjectCommand(
        alienGameState,
        beforeAlienState,
        "恢复半人马痕迹奖励前外星人状态",
      ));
      recordHistoryCommand(historyCommands.createRestoreObjectCommand(
        playerState,
        beforePlayerState,
        "恢复半人马痕迹奖励前玩家状态",
      ));
      if (getCurrentActionEffect()) {
        getCurrentActionEffect().result = {
          ok: true,
          undoable: rewardResult.undoable !== false,
          irreversible: rewardResult.irreversible || null,
          message: rocketState.statusNote,
          events: traceEvents,
          payload: { alienSlotId, traceType, position, reward: result.reward || null },
        };
      }
    } else if (pending?.type === "banrenma_bonus_alien_trace") {
      beginQuickActionStep("banrenma-trace", pending.effectLabel || "半人马痕迹奖励");
      recordQuickHistoryCommand(historyCommands.createRestoreObjectCommand(
        alienGameState,
        beforeAlienState,
        "恢复半人马痕迹奖励前外星人状态",
      ));
      recordQuickHistoryCommand(historyCommands.createRestoreObjectCommand(
        playerState,
        beforePlayerState,
        "恢复半人马痕迹奖励前玩家状态",
      ));
      completeQuickActionStep();
      settleCardTasksAfterEffect({ events: traceEvents, render: false });
    } else {
      beginQuickActionStep("banrenma-trace", rocketState.statusNote);
      recordQuickHistoryCommand(historyCommands.createRestoreObjectCommand(
        alienGameState,
        beforeAlienState,
        "恢复半人马痕迹放置前外星人状态",
      ));
      recordQuickHistoryCommand(historyCommands.createRestoreObjectCommand(
        playerState,
        beforePlayerState,
        "恢复半人马痕迹放置前玩家状态",
      ));
      completeQuickActionStep();
      settleCardTasksAfterEffect({ events: traceEvents, render: false });
    }

    renderAlienPanels();
    renderPlayerStats();
    renderPlayerHand();
    renderReservedCardsFromTaskState();

    if (result.reward?.pickAlienCard) {
      const openResult = openBanrenmaCardGainDialog({
        player: currentPlayer,
        fromEffectFlow: pending?.type === "planet_reward_alien_trace",
        effectLabel: pending?.effectLabel || "半人马外星人牌",
        beforeAlienState,
        beforePlayerState,
      });
      if (!openResult.ok && pending?.type === "planet_reward_alien_trace") {
        completeCurrentActionEffect();
      }
      return result;
    }

    if (pending?.type === "planet_reward_alien_trace") {
      completeCurrentActionEffect();
    }
    updateActionButtons();
    maybeOpenQueuedBanrenmaOpportunity();
    renderStateReadout();
    return result;
  }

  function confirmAomomoTracePlacement(alienSlotId, traceType, position) {
    const inDebugMode = isDebugAlienTraceMode();
    if (!aomomo || (!isAomomoTracePlacementMode() && !inDebugMode)) {
      rocketState.statusNote = "请先通过获取外星人标记进入奥陌陌放置模式";
      renderStateReadout();
      return { ok: false, message: rocketState.statusNote };
    }
    if (!canPlaceAomomoTrace(alienSlotId, traceType, position)) {
      rocketState.statusNote = "该奥陌陌痕迹位不可放置";
      renderStateReadout();
      return { ok: false, message: rocketState.statusNote };
    }

    const currentPlayer = getCurrentPlayer();
    const rewardPreview = aomomo.getTraceReward(traceType, Number(position));
    if (rewardPreview?.payFossils && !players.canAfford(currentPlayer, { aomomoFossils: rewardPreview.payFossils })) {
      rocketState.statusNote = `化石不足：该位置需要 ${rewardPreview.payFossils} 化石`;
      renderStateReadout();
      return { ok: false, message: rocketState.statusNote };
    }

    const pending = pendingAlienTraceAction;
    const beforeAlienState = pending?.beforeAlienState || structuredClone(alienGameState);
    const beforePlayerState = pending?.beforePlayerState || structuredClone(playerState);
    if (!inDebugMode) {
      pendingAlienTraceAction = null;
      if (alienTracePickerState?.mode === "aomomo-grid") {
        alienTracePickerState = null;
      }
    }

    const result = aomomo.placeAomomoTrace(
      alienGameState,
      alienSlotId,
      traceType,
      position,
      currentPlayer,
    );
    if (!result.ok) {
      rocketState.statusNote = result.message;
      renderAlienPanels();
      renderStateReadout();
      return result;
    }

    const rewardResult = applyAomomoRewardToPlayer(
      currentPlayer,
      result.reward,
      `奥陌陌${aomomo.formatTraceLabel(traceType, Number(position))}`,
    );
    rocketState.statusNote = rewardResult.ok ? rewardResult.message : result.message;
    const traceEvents = !inDebugMode
      ? [buildAlienTraceEvent(alienSlotId, traceType, currentPlayer, aomomo.ALIEN_ID)]
      : [];

    if (pending?.type === "planet_reward_alien_trace") {
      beginEffectHistoryStep(pending.effectLabel || "奥陌陌痕迹奖励");
      recordHistoryCommand(historyCommands.createRestoreObjectCommand(
        alienGameState,
        beforeAlienState,
        "恢复奥陌陌痕迹奖励前外星人状态",
      ));
      recordHistoryCommand(historyCommands.createRestoreObjectCommand(
        playerState,
        beforePlayerState,
        "恢复奥陌陌痕迹奖励前玩家状态",
      ));
      if (getCurrentActionEffect()) {
        getCurrentActionEffect().result = {
          ok: true,
          undoable: true,
          message: rocketState.statusNote,
          events: traceEvents,
          payload: { alienSlotId, traceType, position, reward: result.reward || null },
        };
      }
    } else {
      beginQuickActionStep("aomomo-trace", rocketState.statusNote);
      recordQuickHistoryCommand(historyCommands.createRestoreObjectCommand(
        alienGameState,
        beforeAlienState,
        "恢复奥陌陌痕迹放置前外星人状态",
      ));
      recordQuickHistoryCommand(historyCommands.createRestoreObjectCommand(
        playerState,
        beforePlayerState,
        "恢复奥陌陌痕迹放置前玩家状态",
      ));
      completeQuickActionStep();
      settleCardTasksAfterEffect({ events: traceEvents, render: false });
    }

    renderAlienPanels();
    renderPlayerStats();
    renderPlayerHand();
    renderReservedCardsFromTaskState();

    if (result.reward?.pickAlienCard) {
      const openResult = openAomomoCardGainDialog({
        player: currentPlayer,
        fromEffectFlow: pending?.type === "planet_reward_alien_trace",
        effectLabel: pending?.effectLabel || "奥陌陌外星人牌",
        beforeAlienState,
        beforePlayerState,
      });
      if (!openResult.ok && pending?.type === "planet_reward_alien_trace") {
        completeCurrentActionEffect();
      }
      return result;
    }

    if (pending?.type === "planet_reward_alien_trace") {
      completeCurrentActionEffect();
    }
    updateActionButtons();
    renderStateReadout();
    return result;
  }

  function openChongRewardFollowUps(result, currentPlayer, pending, beforeAlienState, beforePlayerState) {
    if (!result?.reward) return false;
    if (result.reward.pickAlienCard) {
      const openResult = openChongCardGainDialog({
        player: currentPlayer,
        fromEffectFlow: pending?.type === "planet_reward_alien_trace",
        effectLabel: pending?.effectLabel || "虫族外星人牌",
        beforeAlienState,
        beforePlayerState,
      });
      return Boolean(openResult.ok);
    }
    if (result.reward.pickCard) {
      beginCardSelection({
        type: "amiba_pick_card",
        player: currentPlayer,
        allowBlindDraw: true,
        fromEffectFlow: pending?.type === "planet_reward_alien_trace",
      });
      return true;
    }
    return false;
  }

  function openAmibaRewardFollowUps(result, currentPlayer, pending, beforeAlienState, beforePlayerState) {
    if (!result?.reward) return false;
    if (result.reward.pickAlienCard) {
      const openResult = openAmibaCardGainDialog({
        player: currentPlayer,
        fromEffectFlow: pending?.type === "planet_reward_alien_trace",
        effectLabel: pending?.effectLabel || "阿米巴外星人牌",
        beforeAlienState,
        beforePlayerState,
      });
      return Boolean(openResult.ok);
    }
    if (result.reward.pickCard) {
      beginCardSelection({
        type: "chong_pick_card",
        player: currentPlayer,
        allowBlindDraw: true,
        fromEffectFlow: pending?.type === "planet_reward_alien_trace",
      });
      return true;
    }
    return false;
  }

  function openRunezuRewardFollowUps(result, currentPlayer, pending, beforeAlienState, beforePlayerState) {
    if (!result?.reward) return false;
    if (result.reward.pickAlienCard) {
      const openResult = openRunezuCardGainDialog({
        player: currentPlayer,
        fromEffectFlow: pending?.type === "planet_reward_alien_trace",
        effectLabel: pending?.effectLabel || "符文族外星人牌",
        beforeAlienState,
        beforePlayerState,
      });
      return Boolean(openResult.ok);
    }
    if (result.reward.pickCard) {
      beginCardSelection({
        type: "runezu_pick_card",
        player: currentPlayer,
        allowBlindDraw: true,
        fromEffectFlow: pending?.type === "planet_reward_alien_trace",
      });
      return true;
    }
    return false;
  }

  function closeRunezuFaceSymbolPlacement() {
    pendingRunezuFaceSymbolPlacement = null;
    els.scanTargetActions?.classList.remove("runezu-face-symbol-choice-grid");
    if (els.scanTargetOverlay) els.scanTargetOverlay.hidden = true;
  }

  function openRunezuFaceSymbolPlacement(alienSlotId, position) {
    if (!runezu || !els.scanTargetOverlay || !els.scanTargetActions) {
      return { ok: false, message: "无法打开符文族 symbol 放置窗口" };
    }
    const currentPlayer = getCurrentPlayer();
    const check = runezu.canPlaceFaceSymbol(alienGameState, position, currentPlayer);
    if (!check.ok) {
      rocketState.statusNote = check.message;
      renderStateReadout();
      return check;
    }
    pendingRunezuFaceSymbolPlacement = {
      alienSlotId: Number(alienSlotId),
      position: check.position,
      playerId: currentPlayer.id,
      beforeAlienState: structuredClone(alienGameState),
      beforePlayerState: structuredClone(playerState),
    };
    if (els.scanTargetTitle) els.scanTargetTitle.textContent = "符文族黑圈";
    if (els.scanTargetSubtitle) {
      els.scanTargetSubtitle.textContent = `选择 1 个 symbol 放入${runezu.formatFaceSymbolSlotLabel(check.position)}并结算奖励。`;
    }
    if (els.scanTargetCancel) els.scanTargetCancel.hidden = false;
    els.scanTargetActions.classList.add("runezu-face-symbol-choice-grid");
    const nodes = check.choices.map((choice) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "scan-target-option-button runezu-face-symbol-choice-button";
      button.dataset.runezuFaceSymbolChoice = choice.symbolId;
      button.title = `${choice.label} x${choice.count}`;
      button.setAttribute("aria-label", `${choice.label} x${choice.count}`);
      button.innerHTML = `<img class="runezu-face-symbol-choice-image" src="${runezu.getSymbolSrc(choice.symbolId)}" alt="" aria-hidden="true">`;
      return button;
    });
    els.scanTargetActions.replaceChildren(...nodes);
    els.scanTargetOverlay.hidden = false;
    rocketState.statusNote = "符文族黑圈：请选择要放置的 symbol";
    renderStateReadout();
    return { ok: true, awaitingChoice: true, message: rocketState.statusNote };
  }

  function handleRunezuFaceSymbolChoice(choice) {
    const pending = pendingRunezuFaceSymbolPlacement;
    if (!pending) return { ok: false, message: "没有符文族黑圈放置流程" };
    if (choice === "cancel") {
      closeRunezuFaceSymbolPlacement();
      rocketState.statusNote = "已取消符文族黑圈放置";
      renderStateReadout();
      return { ok: true, cancelled: true, message: rocketState.statusNote };
    }
    const player = getPlayerById(pending.playerId) || getCurrentPlayer();
    const result = runezu.placePlayerSymbolOnFace(alienGameState, pending.position, player, choice);
    if (!result.ok) {
      rocketState.statusNote = result.message;
      renderStateReadout();
      return result;
    }
    const rewardResult = applyRunezuRewardToPlayer(
      player,
      result.reward,
      `符文族${runezu.formatFaceSymbolSlotLabel(pending.position)}`,
    );
    closeRunezuFaceSymbolPlacement();
    beginQuickActionStep("runezu-face-symbol", result.message);
    recordQuickHistoryCommand(historyCommands.createRestoreObjectCommand(
      alienGameState,
      pending.beforeAlienState,
      "恢复符文族黑圈放置前外星人状态",
    ));
    recordQuickHistoryCommand(historyCommands.createRestoreObjectCommand(
      playerState,
      pending.beforePlayerState,
      "恢复符文族黑圈放置前玩家状态",
    ));
    completeQuickActionStep(null, rewardResult.irreversible ? {
      irreversibleCode: rewardResult.irreversible.code,
      irreversibleReason: rewardResult.irreversible.reason,
    } : {});
    rocketState.statusNote = `${result.message}；${rewardResult.message}`;
    renderAlienPanels();
    renderPlayerStats();
    renderPlayerHand();
    updateActionButtons();
    renderStateReadout();
    return { ...result, rewardResult, message: rocketState.statusNote };
  }

  function executeRunezuSymbolRewardEffect(effect) {
    const currentPlayer = getCurrentPlayer();
    const symbolId = effect.options?.symbolId;
    const beforeAlienState = structuredClone(alienGameState);
    const beforePlayerState = structuredClone(playerState);
    beginEffectHistoryStep(effect.label);
    const result = applyRunezuSymbolReward(currentPlayer, symbolId, effect.label);
    recordHistoryCommand(historyCommands.createRestoreObjectCommand(
      alienGameState,
      beforeAlienState,
      "恢复符文族symbol奖励前外星人状态",
    ));
    recordHistoryCommand(historyCommands.createRestoreObjectCommand(
      playerState,
      beforePlayerState,
      "恢复符文族symbol奖励前玩家状态",
    ));
    if (result.irreversible) {
      markCurrentActionIrreversible(result.irreversible.reason, result.irreversible.code);
    }
    return finishAutomaticRewardEffect(effect, {
      ok: true,
      undoable: result.undoable !== false,
      irreversible: result.irreversible || null,
      message: result.message,
      payload: result,
    }, [renderAlienPanels, renderPlayerHand]);
  }

  function closeRunezuSymbolBranchDialog() {
    pendingRunezuSymbolBranch = null;
    if (els.scanTargetOverlay) els.scanTargetOverlay.hidden = true;
  }

  function openRunezuSymbolBranchDialog(effect) {
    if (!runezu || !els.scanTargetOverlay || !els.scanTargetActions) {
      return { ok: false, message: "无法打开符文族分支选择" };
    }
    const branches = effect.options?.branches || [];
    pendingRunezuSymbolBranch = {
      effect,
      branches,
      beforeAlienState: structuredClone(alienGameState),
      beforePlayerState: structuredClone(playerState),
    };
    if (els.scanTargetTitle) els.scanTargetTitle.textContent = "符文族符文奖励";
    if (els.scanTargetSubtitle) els.scanTargetSubtitle.textContent = "选择一组 symbol，按黑圈映射依次结算奖励。";
    if (els.scanTargetCancel) els.scanTargetCancel.hidden = false;
    const nodes = branches.map((branch, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "scan-target-option-button";
      button.dataset.runezuSymbolBranch = String(index);
      const icons = (branch.symbolIds || []).map((symbolId) => (
        `<img class="jiuzhe-card-option-image" src="${runezu.getSymbolSrc(symbolId)}" alt="" aria-hidden="true">`
      )).join("");
      button.innerHTML = `${icons}<small>${branch.label || (branch.symbolIds || []).map(runezu.formatSymbolLabel).join("+")}</small>`;
      return button;
    });
    const cancel = document.createElement("button");
    cancel.type = "button";
    cancel.className = "scan-target-option-button";
    cancel.dataset.runezuSymbolBranch = "cancel";
    cancel.innerHTML = "取消<small>不结算本次符文奖励</small>";
    nodes.push(cancel);
    els.scanTargetActions.replaceChildren(...nodes);
    els.scanTargetOverlay.hidden = false;
    rocketState.statusNote = "符文族：请选择一组 symbol 奖励";
    renderStateReadout();
    return { ok: true, awaitingChoice: true, message: rocketState.statusNote };
  }

  function handleRunezuSymbolBranchChoice(choice) {
    const pending = pendingRunezuSymbolBranch;
    if (!pending) return { ok: false, message: "没有待选择的符文族分支" };
    const effect = pending.effect;
    if (choice === "cancel") {
      closeRunezuSymbolBranchDialog();
      if (effect) {
        effect.result = { ok: true, undoable: true, message: "已取消符文族分支奖励" };
        rocketState.statusNote = effect.result.message;
        completeCurrentActionEffect();
      }
      renderStateReadout();
      return { ok: true, cancelled: true, message: rocketState.statusNote };
    }
    const branch = pending.branches[Number(choice)];
    if (!branch) return { ok: false, message: "无效的符文族分支" };
    const currentPlayer = getCurrentPlayer();
    const messages = [];
    let irreversible = null;
    beginEffectHistoryStep(effect.label);
    for (const symbolId of branch.symbolIds || []) {
      const result = applyRunezuSymbolReward(currentPlayer, symbolId, effect.label);
      messages.push(result.message);
      if (result.irreversible) irreversible = result.irreversible;
    }
    recordHistoryCommand(historyCommands.createRestoreObjectCommand(
      alienGameState,
      pending.beforeAlienState,
      "恢复符文族分支奖励前外星人状态",
    ));
    recordHistoryCommand(historyCommands.createRestoreObjectCommand(
      playerState,
      pending.beforePlayerState,
      "恢复符文族分支奖励前玩家状态",
    ));
    if (irreversible) markCurrentActionIrreversible(irreversible.reason, irreversible.code);
    closeRunezuSymbolBranchDialog();
    if (effect) {
      effect.result = {
        ok: true,
        undoable: !irreversible,
        irreversible,
        message: `${effect.label}：${messages.join("；") || "无奖励"}`,
      };
      rocketState.statusNote = effect.result.message;
      renderAlienPanels();
      renderPlayerStats();
      renderPlayerHand();
      completeCurrentActionEffect();
    }
    renderStateReadout();
    return effect?.result || { ok: true, message: rocketState.statusNote };
  }

  function confirmChongTracePlacement(alienSlotId, traceType, position) {
    const inDebugMode = isDebugAlienTraceMode();
    if (!chong || (!isChongTracePlacementMode() && !inDebugMode)) {
      rocketState.statusNote = "请先通过获取外星人标记进入虫族放置模式";
      renderStateReadout();
      return { ok: false, message: rocketState.statusNote };
    }
    if (!canPlaceChongTrace(alienSlotId, traceType, position)) {
      rocketState.statusNote = "该虫族痕迹位不可放置";
      renderStateReadout();
      return { ok: false, message: rocketState.statusNote };
    }

    const currentPlayer = getCurrentPlayer();
    const pending = pendingAlienTraceAction;
    const beforeAlienState = pending?.beforeAlienState || structuredClone(alienGameState);
    const beforePlayerState = pending?.beforePlayerState || structuredClone(playerState);
    if (!inDebugMode) {
      pendingAlienTraceAction = null;
      if (alienTracePickerState?.mode === "chong-grid") {
        alienTracePickerState = null;
      }
    }

    const result = chong.placeChongTrace(
      alienGameState,
      alienSlotId,
      traceType,
      position,
      currentPlayer,
    );
    if (!result.ok) {
      rocketState.statusNote = result.message;
      renderAlienPanels();
      renderStateReadout();
      return result;
    }

    const rewardResult = applyChongRewardToPlayer(
      currentPlayer,
      result.reward,
      `虫族${chong.formatTraceLabel(traceType, Number(position))}`,
    );
    rocketState.statusNote = rewardResult.ok ? rewardResult.message : result.message;
    const traceEvents = !inDebugMode
      ? [buildAlienTraceEvent(alienSlotId, traceType, currentPlayer, chong.ALIEN_ID)]
      : [];

    if (pending?.type === "planet_reward_alien_trace") {
      beginEffectHistoryStep(pending.effectLabel || "虫族痕迹奖励");
      recordHistoryCommand(historyCommands.createRestoreObjectCommand(
        alienGameState,
        beforeAlienState,
        "恢复虫族痕迹奖励前外星人状态",
      ));
      recordHistoryCommand(historyCommands.createRestoreObjectCommand(
        playerState,
        beforePlayerState,
        "恢复虫族痕迹奖励前玩家状态",
      ));
      if (getCurrentActionEffect()) {
        getCurrentActionEffect().result = {
          ok: true,
          undoable: rewardResult.undoable !== false,
          irreversible: rewardResult.irreversible || null,
          message: rocketState.statusNote,
          events: traceEvents,
          payload: { alienSlotId, traceType, position, reward: result.reward || null },
        };
      }
    } else {
      beginQuickActionStep("chong-trace", rocketState.statusNote);
      recordQuickHistoryCommand(historyCommands.createRestoreObjectCommand(
        alienGameState,
        beforeAlienState,
        "恢复虫族痕迹放置前外星人状态",
      ));
      recordQuickHistoryCommand(historyCommands.createRestoreObjectCommand(
        playerState,
        beforePlayerState,
        "恢复虫族痕迹放置前玩家状态",
      ));
      completeQuickActionStep(null, rewardResult.irreversible ? {
        irreversibleCode: rewardResult.irreversible.code,
        irreversibleReason: rewardResult.irreversible.reason,
      } : {});
      settleCardTasksAfterEffect({ events: traceEvents, render: false });
    }

    renderAlienPanels();
    renderPlayerStats();
    renderPlayerHand();
    renderReservedCardsFromTaskState();

    const openedFollowUp = openChongRewardFollowUps(
      result,
      currentPlayer,
      pending,
      beforeAlienState,
      beforePlayerState,
    );
    if (!openedFollowUp && pending?.type === "planet_reward_alien_trace") {
      completeCurrentActionEffect();
    }
    updateActionButtons();
    renderStateReadout();
    return result;
  }

  function confirmAmibaTracePlacement(alienSlotId, traceType, position) {
    const inDebugMode = isDebugAlienTraceMode();
    if (!amiba || (!isAmibaTracePlacementMode() && !inDebugMode)) {
      rocketState.statusNote = "请先通过获取外星人标记进入阿米巴放置模式";
      renderStateReadout();
      return { ok: false, message: rocketState.statusNote };
    }
    if (!canPlaceAmibaTrace(alienSlotId, traceType, position)) {
      rocketState.statusNote = "该阿米巴痕迹位不可放置";
      renderStateReadout();
      return { ok: false, message: rocketState.statusNote };
    }

    const currentPlayer = getCurrentPlayer();
    const pending = pendingAlienTraceAction;
    const beforeAlienState = pending?.beforeAlienState || structuredClone(alienGameState);
    const beforePlayerState = pending?.beforePlayerState || structuredClone(playerState);
    if (!inDebugMode) {
      pendingAlienTraceAction = null;
      if (alienTracePickerState?.mode === "amiba-grid") {
        alienTracePickerState = null;
      }
    }

    const result = amiba.placeAmibaTrace(
      alienGameState,
      alienSlotId,
      traceType,
      position,
      currentPlayer,
    );
    if (!result.ok) {
      rocketState.statusNote = result.message;
      renderAlienPanels();
      renderStateReadout();
      return result;
    }

    const rewardResult = applyAmibaRewardToPlayer(
      currentPlayer,
      result.reward,
      `阿米巴${amiba.formatTraceLabel(traceType, Number(position))}`,
    );
    rocketState.statusNote = rewardResult.ok ? rewardResult.message : result.message;
    const traceEvents = !inDebugMode
      ? [buildAlienTraceEvent(alienSlotId, traceType, currentPlayer, amiba.ALIEN_ID)]
      : [];

    if (pending?.type === "planet_reward_alien_trace") {
      beginEffectHistoryStep(pending.effectLabel || "阿米巴痕迹奖励");
      recordHistoryCommand(historyCommands.createRestoreObjectCommand(
        alienGameState,
        beforeAlienState,
        "恢复阿米巴痕迹奖励前外星人状态",
      ));
      recordHistoryCommand(historyCommands.createRestoreObjectCommand(
        playerState,
        beforePlayerState,
        "恢复阿米巴痕迹奖励前玩家状态",
      ));
      if (getCurrentActionEffect()) {
        getCurrentActionEffect().result = {
          ok: true,
          undoable: true,
          message: rocketState.statusNote,
          events: traceEvents,
          payload: { alienSlotId, traceType, position, reward: result.reward || null },
        };
      }
    } else if (!inDebugMode) {
      beginQuickActionStep("amiba-trace", rocketState.statusNote);
      recordQuickHistoryCommand(historyCommands.createRestoreObjectCommand(
        alienGameState,
        beforeAlienState,
        "恢复阿米巴痕迹放置前外星人状态",
      ));
      recordQuickHistoryCommand(historyCommands.createRestoreObjectCommand(
        playerState,
        beforePlayerState,
        "恢复阿米巴痕迹放置前玩家状态",
      ));
      completeQuickActionStep(null, rewardResult.irreversible ? {
        irreversibleCode: rewardResult.irreversible.code,
        irreversibleReason: rewardResult.irreversible.reason,
      } : {});
      settleCardTasksAfterEffect({ events: traceEvents, render: false });
    }

    renderAlienPanels();
    renderPlayerStats();
    renderPlayerHand();
    renderReservedCardsFromTaskState();

    const openedFollowUp = openAmibaRewardFollowUps(
      result,
      currentPlayer,
      pending,
      beforeAlienState,
      beforePlayerState,
    );
    if (!openedFollowUp && pending?.type === "planet_reward_alien_trace") {
      completeCurrentActionEffect();
    }
    updateActionButtons();
    renderStateReadout();
    return result;
  }

  function confirmRunezuTracePlacement(alienSlotId, traceType, position) {
    const inDebugMode = isDebugAlienTraceMode();
    if (!runezu || (!isRunezuTracePlacementMode() && !inDebugMode)) {
      rocketState.statusNote = "请先通过获取外星人标记进入符文族放置模式";
      renderStateReadout();
      return { ok: false, message: rocketState.statusNote };
    }
    if (!canPlaceRunezuTrace(alienSlotId, traceType, position)) {
      rocketState.statusNote = "该符文族痕迹位不可放置";
      renderStateReadout();
      return { ok: false, message: rocketState.statusNote };
    }

    const currentPlayer = getCurrentPlayer();
    const pending = pendingAlienTraceAction;
    const beforeAlienState = pending?.beforeAlienState || structuredClone(alienGameState);
    const beforePlayerState = pending?.beforePlayerState || structuredClone(playerState);
    if (!inDebugMode) {
      pendingAlienTraceAction = null;
      if (alienTracePickerState?.mode === "runezu-grid") {
        alienTracePickerState = null;
      }
    }

    const result = runezu.placeRunezuTrace(
      alienGameState,
      alienSlotId,
      traceType,
      position,
      currentPlayer,
    );
    if (!result.ok) {
      rocketState.statusNote = result.message;
      renderAlienPanels();
      renderStateReadout();
      return result;
    }

    const rewardResult = applyRunezuRewardToPlayer(
      currentPlayer,
      result.reward,
      `符文族${runezu.formatTraceLabel(traceType, Number(position))}`,
    );
    rocketState.statusNote = rewardResult.ok ? rewardResult.message : result.message;
    const traceEvents = !inDebugMode
      ? [buildAlienTraceEvent(alienSlotId, traceType, currentPlayer, runezu.ALIEN_ID)]
      : [];

    if (pending?.type === "planet_reward_alien_trace") {
      beginEffectHistoryStep(pending.effectLabel || "符文族痕迹奖励");
      recordHistoryCommand(historyCommands.createRestoreObjectCommand(
        alienGameState,
        beforeAlienState,
        "恢复符文族痕迹奖励前外星人状态",
      ));
      recordHistoryCommand(historyCommands.createRestoreObjectCommand(
        playerState,
        beforePlayerState,
        "恢复符文族痕迹奖励前玩家状态",
      ));
      if (getCurrentActionEffect()) {
        getCurrentActionEffect().result = {
          ok: true,
          undoable: rewardResult.undoable !== false,
          irreversible: rewardResult.irreversible || null,
          message: rocketState.statusNote,
          events: traceEvents,
          payload: { alienSlotId, traceType, position, reward: result.reward || null },
        };
      }
    } else if (!inDebugMode) {
      beginQuickActionStep("runezu-trace", rocketState.statusNote);
      recordQuickHistoryCommand(historyCommands.createRestoreObjectCommand(
        alienGameState,
        beforeAlienState,
        "恢复符文族痕迹放置前外星人状态",
      ));
      recordQuickHistoryCommand(historyCommands.createRestoreObjectCommand(
        playerState,
        beforePlayerState,
        "恢复符文族痕迹放置前玩家状态",
      ));
      completeQuickActionStep(null, rewardResult.irreversible ? {
        irreversibleCode: rewardResult.irreversible.code,
        irreversibleReason: rewardResult.irreversible.reason,
      } : {});
      settleCardTasksAfterEffect({ events: traceEvents, render: false });
    }

    renderAlienPanels();
    renderPlayerStats();
    renderPlayerHand();
    renderReservedCardsFromTaskState();

    const openedFollowUp = openRunezuRewardFollowUps(
      result,
      currentPlayer,
      pending,
      beforeAlienState,
      beforePlayerState,
    );
    if (!openedFollowUp && pending?.type === "planet_reward_alien_trace") {
      completeCurrentActionEffect();
    }
    updateActionButtons();
    renderStateReadout();
    return result;
  }

  function confirmJiuzheTracePlacement(alienSlotId, traceType, position) {
    const inDebugMode = isDebugAlienTraceMode();
    if (!jiuzhe || (!isJiuzheTracePlacementMode() && !inDebugMode)) {
      rocketState.statusNote = "请先通过获取外星人标记进入九折放置模式";
      renderStateReadout();
      return { ok: false, message: rocketState.statusNote };
    }
    if (!canPlaceJiuzheTrace(alienSlotId, traceType, position)) {
      rocketState.statusNote = "该九折痕迹位不可放置";
      renderStateReadout();
      return { ok: false, message: rocketState.statusNote };
    }

    const currentPlayer = getCurrentPlayer();
    const pending = pendingAlienTraceAction;
    const beforeAlienState = pending?.beforeAlienState || structuredClone(alienGameState);
    const beforePlayerState = pending?.beforePlayerState || structuredClone(playerState);
    if (!inDebugMode) {
      pendingAlienTraceAction = null;
      if (alienTracePickerState?.mode === "jiuzhe-grid") {
        alienTracePickerState = null;
      }
    }

    const result = jiuzhe.placeJiuzheTrace(
      alienGameState,
      alienSlotId,
      traceType,
      position,
      currentPlayer,
    );
    if (!result.ok) {
      rocketState.statusNote = result.message;
      renderAlienPanels();
      renderStateReadout();
      return result;
    }

    const rewardResult = applyJiuzheRewardToPlayer(
      currentPlayer,
      result.reward,
      `九折${jiuzhe.formatTraceLabel(traceType, Number(position))}`,
    );
    rocketState.statusNote = rewardResult.ok ? rewardResult.message : result.message;
    const traceEvents = !inDebugMode
      ? [buildAlienTraceEvent(alienSlotId, traceType, currentPlayer, jiuzhe.ALIEN_ID)]
      : [];

    if (pending?.type === "planet_reward_alien_trace") {
      beginEffectHistoryStep(pending.effectLabel || "九折痕迹奖励");
      recordHistoryCommand(historyCommands.createRestoreObjectCommand(
        alienGameState,
        beforeAlienState,
        "恢复九折痕迹奖励前外星人状态",
      ));
      recordHistoryCommand(historyCommands.createRestoreObjectCommand(
        playerState,
        beforePlayerState,
        "恢复九折痕迹奖励前玩家状态",
      ));
      if (getCurrentActionEffect()) {
        getCurrentActionEffect().result = {
          ok: true,
          undoable: true,
          message: rocketState.statusNote,
          events: traceEvents,
          payload: { alienSlotId, traceType, position, reward: result.reward || null },
        };
      }
    } else {
      settleCardTasksAfterEffect({ events: traceEvents, render: false });
    }

    renderAlienPanels();
    renderPlayerStats();

    if (result.reward?.pickCard) {
      const pickResult = beginCardSelection({
        type: "jiuzhe_trace_pick",
        player: currentPlayer,
        fromEffectFlow: pending?.type === "planet_reward_alien_trace",
        effectLabel: pending?.effectLabel || "九折痕迹精选",
      });
      if (!pickResult.ok && pending?.type === "planet_reward_alien_trace") {
        completeCurrentActionEffect();
      }
      return result;
    }

    if (pending?.type === "planet_reward_alien_trace") {
      completeCurrentActionEffect();
    }
    updateActionButtons();
    renderStateReadout();
    return result;
  }

  function alignAlienPanelsToPlanets() {
    els.appWrap.style.removeProperty("--alien-panel-min-height");
    if (window.innerWidth <= 1180 || els.alienPanels.length < 2 || !els.planetsReferenceImage) return;

    const panels = [...els.alienPanels];
    const firstPanel = panels[0].getBoundingClientRect();
    const secondPanel = panels[1].getBoundingClientRect();
    const planets = els.planetsReferenceImage.getBoundingClientRect();
    const bottomGap = planets.bottom - secondPanel.bottom;

    if (bottomGap <= 0) return;

    const panelHeight = Math.ceil(firstPanel.height + bottomGap / panels.length);
    els.appWrap.style.setProperty("--alien-panel-min-height", `${panelHeight}px`);
  }

  function setLogOpen(open) {
    els.appWrap.classList.toggle("log-collapsed", !open);
    els.logToggle.setAttribute("aria-expanded", String(open));
    resize();
  }

  function setDebugOpen(open) {
    els.appWrap.classList.toggle("debug-collapsed", !open);
    els.debugToggle.setAttribute("aria-expanded", String(open));
    resize();
  }

  function focusJiuzheDebugCalibration(alienSlotId = 1) {
    setDebugOpen(false);
    window.requestAnimationFrame(() => {
      const target = els.alienPanels?.[alienSlotId - 1] || getAlienJiuzheTraceLayer(alienSlotId);
      target?.scrollIntoView?.({ behavior: "smooth", block: "center", inline: "nearest" });
    });
  }

  function isTechActionSelectionActive() {
    return Boolean(techGameState.ui.techSelectionActive);
  }

  function isTechTilePickingActive() {
    const ui = techGameState.ui;
    return Boolean(ui.techSelectionActive && (!ui.selectedTileId || ui.pendingTileId));
  }

  function isTechAwaitingConfirm() {
    return false;
  }

  function getResearchTechSelectionEffect() {
    if (!pendingActionEffectFlow) return null;
    return pendingActionEffectFlow.effects.find((effect) => (
      effect.type === "research_tech_select"
      || effect.type === cardEffects.EFFECT_TYPES.RESEARCH_TECH
    )) || null;
  }

  function getResearchTechSelectionPayload() {
    const result = getResearchTechSelectionEffect()?.result;
    return result?.payload || result || null;
  }

  function getResearchTechSelectionOptions() {
    return getResearchTechSelectionEffect()?.options || {};
  }

  function shouldSkipCurrentResearchTechCost() {
    return Boolean(getResearchTechSelectionOptions().skipCost);
  }

  function appendResearchTechFollowupEffects(selectResult) {
    if (!pendingActionEffectFlow) return;

    const selectIndex = pendingActionEffectFlow.effects.findIndex((effect) => (
      effect.type === "research_tech_select"
      || effect.type === cardEffects.EFFECT_TYPES.RESEARCH_TECH
    ));
    if (selectIndex >= 0) {
      pendingActionEffectFlow.effects.splice(selectIndex + 1);
    }

    const bonusId = selectResult.bonusId;
    const bonusLabel = tech.BONUS_LABELS[bonusId] || bonusId || "奖励";
    const followups = [
      {
        id: "research-tech-rotate",
        type: "research_tech_rotate",
        abilityId: "researchTechRotate",
        icon: "rotate",
        label: "旋转",
        status: "pending",
        undoable: false,
      },
    ];

    if (selectResult.tileId === "orange1") {
      followups.push({
        ...planetRewards.launchEffect({ skipCost: true, source: "tech" }),
        id: "research-tech-launch",
        status: "pending",
        undoable: true,
      });
    }

    followups.push({
      id: "research-tech-bonus",
      type: "research_tech_bonus",
      abilityId: "researchTechBonus",
      icon: bonusId,
      label: `获取${bonusLabel}`,
      status: "pending",
      undoable: false,
      options: {
        tileId: selectResult.tileId,
        bonusId,
        firstTake: Boolean(selectResult.firstTake),
      },
    });

    if (selectResult.tileId === "purple1") {
      followups.push({
        ...planetRewards.dataEffect(2),
        id: "research-tech-data",
        status: "pending",
        undoable: true,
      });
    }

    const techType = selectResult.techType || selectResult.payload?.techType;
    const heliosEffect = industry?.buildHeliosPassiveRewardEffect?.(
      getCurrentPlayer(),
      techType,
      selectResult.tileId || selectResult.payload?.tileId,
    );
    if (heliosEffect) {
      followups.push(heliosEffect);
    }

    pendingActionEffectFlow.effects.push(...followups);
  }

  function onTechTileSelected(result) {
    const player = getCurrentPlayer();
    if (industry?.shouldApplyTuringBlueTechPublicity?.(player, result.tileId)) {
      players.gainResources(player, { publicity: industry.getTuringBlueTechPublicityGain() });
    }
    appendResearchTechFollowupEffects(result);
    syncTechSelectionChrome();
    renderTechBoard();
    renderActionEffectBar();
    updateActionButtons();
  }

  function syncTechSelectionChrome() {
    const active = isTechTilePickingActive() || Boolean(techGameState?.ui?.industryBorrowMode);
    els.appWrap?.classList.toggle("tech-selection-active", active);
    if (els.techSelectionBackdrop) {
      els.techSelectionBackdrop.hidden = !active;
      els.techSelectionBackdrop.setAttribute("aria-hidden", String(!active));
    }
    if (els.techSelectionCancel) {
      els.techSelectionCancel.hidden = !active;
    }
    if (els.techPanel) {
      els.techPanel.classList.toggle("tech-panel-focused", active);
    }
    if (active) setQuickPanelOpen(false);
    syncInteractionFocusChrome();
  }

  function cancelTechSelection() {
    if (techGameState.ui.industryBorrowMode) {
      techGameState.ui.industryBorrowMode = false;
      tech.setTechSelectionActive(techGameState, false);
      techGameState.ui.statusNote = "";
      cancelIndustryAbilityFlow();
      rocketState.statusNote = "已取消图灵系统科技借用";
      syncTechSelectionChrome();
      renderStateReadout();
      return;
    }
    tech.setTechSelectionActive(techGameState, false);
    tech.cancelPendingTake(techGameState);
    techGameState.ui.selectedTileId = null;
    techGameState.ui.selectedBlueSlot = null;
    techGameState.ui.allowedTechTypes = null;
    closeTechBlueSlotPicker();
    techGameState.ui.statusNote = "";
    rocketState.statusNote = "";
    if (pendingActionEffectFlow?.actionType === "researchTech") {
      actionHistory.rollbackSession();
      clearHistoryStepOrderForSource(HISTORY_SOURCE_MAIN);
      removeActionLogStepsBySource(HISTORY_SOURCE_MAIN);
      effectStepActive = false;
      clearActionEffectFlow();
    }
    clearActionPending();
    syncTechSelectionChrome();
    renderTechBoard();
    updateActionButtons();
    renderStateReadout();
  }

  function renderTechBoard() {
    syncTechRenderContext();
    const currentPlayer = getCurrentPlayer();
    tech.renderAll(techGameState, techRenderContext, els.techTiles, {
      currentPlayer,
      canTakeTile: (tileId) => {
        if (!currentPlayer?.techState) return false;
        if (!tech.isSupplySelectionActive(techGameState.ui)) return false;
        return tech.resolver.canTakeTile(
          techGameState.board,
          currentPlayer.techState,
          tileId,
          { techTypes: techGameState.ui.allowedTechTypes },
        ).ok;
      },
    });
    syncTechSelectionChrome();
    renderRunezuBoardSymbols();
  }

  function closeTechBlueSlotPicker() {
    if (!els.techBlueSlotOverlay) return;
    els.techBlueSlotOverlay.hidden = true;
    delete els.techBlueSlotOverlay.dataset.tileId;
    renderTechBoard();
  }

  function openTechBlueSlotPicker(request) {
    if (!els.techBlueSlotOverlay || !els.techBlueSlotActions || !els.techBlueSlotSubtitle) return;

    els.techBlueSlotSubtitle.textContent = `将 ${request.tileId} 放到蓝色科技位置`;
    els.techBlueSlotActions.replaceChildren(...request.availableSlots.map((slot) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "tech-blue-slot-button";
      button.dataset.blueSlot = String(slot);
      button.textContent = String(slot);
      return button;
    }));
    els.techBlueSlotOverlay.dataset.tileId = request.tileId;
    els.techBlueSlotOverlay.hidden = false;
    techGameState.ui.pendingTileId = request.tileId;
    renderTechBoard();
  }

  function finalizeTechTakeResult(result) {
    if (!result?.ok || result.needsBlueSlotChoice) return result;

    tech.setTechSelectionActive(techGameState, false);
    closeTechBlueSlotPicker();
    syncTechSelectionChrome();
    renderWheels();
    renderRotateStateToken();
    if (result.freeLaunch?.rocket) renderRocketElement(result.freeLaunch.rocket);
    renderPlayerStats();
    renderTechBoard();
    updateActionButtons();

    if (result.awaitingCardSelection) {
      const selectionResult = beginCardSelection();
      rocketState.statusNote = selectionResult.ok
        ? `${result.message}；${selectionResult.message}`
        : (selectionResult.message || result.message);
    }

    renderStateReadout();
    return result;
  }

  function confirmTechBlueSlotChoice(blueSlot) {
    const tileId = els.techBlueSlotOverlay?.dataset.tileId;
    if (!tileId) return { ok: false, message: "没有待放置的蓝色科技" };

    closeTechBlueSlotPicker();
    const result = abilities.executeAbility("researchTechSelect", createActionContext(), {
      tileId,
      blueSlot,
      skipCost: shouldSkipCurrentResearchTechCost(),
    });
    rocketState.statusNote = result.message;
    if (result.ok && !result.needsBlueSlotChoice) {
      beginEffectHistoryStep(result.message || "选择科技片", { effectType: "research_tech_select" });
      recordAbilityCommands(result);
      if (result.firstTake) {
        const claim = claimRunezuSourceSymbolWithHistory(
          "tech",
          result.tileId,
          getCurrentPlayer(),
          "研究科技获得符文族symbol",
        );
        if (claim?.ok) result.message = `${result.message}；${claim.message}`;
      }
      rocketState.statusNote = result.message;
      const current = getCurrentActionEffect();
      if (current) current.result = result;
      onTechTileSelected(result);
      completeCurrentActionEffect();
    } else {
      renderTechBoard();
      updateActionButtons();
    }
    renderStateReadout();
    return result;
  }

  function handleSupplyTechTileClick(tileId) {
    if (techGameState.ui.industryBorrowMode) {
      return confirmIndustryTuringBorrow(tileId);
    }
    if (!tech.isSupplySelectionActive(techGameState.ui)) return;

    const currentPlayer = getCurrentPlayer();
    if (currentPlayer?.techState) {
      const canTake = tech.resolver.canTakeTile(
        techGameState.board,
        currentPlayer.techState,
        tileId,
        { techTypes: techGameState.ui.allowedTechTypes },
      );
      if (!canTake.ok) {
        techGameState.ui.statusNote = canTake.message;
        rocketState.statusNote = canTake.message;
        renderStateReadout();
        return canTake;
      }
    }

    const result = abilities.executeAbility("researchTechSelect", createActionContext(), {
      tileId,
      skipCost: shouldSkipCurrentResearchTechCost(),
    });
    if (result.needsBlueSlotChoice) {
      techGameState.ui.pendingTileId = tileId;
      openTechBlueSlotPicker(result);
      renderTechBoard();
      renderStateReadout();
      return result;
    }

    if (!result.ok) {
      techGameState.ui.statusNote = result.message;
      rocketState.statusNote = result.message;
      renderStateReadout();
      return result;
    }

    rocketState.statusNote = result.message;
    beginEffectHistoryStep(result.message || "选择科技片", { effectType: "research_tech_select" });
    recordAbilityCommands(result);
    if (result.firstTake) {
      const claim = claimRunezuSourceSymbolWithHistory(
        "tech",
        result.tileId,
        getCurrentPlayer(),
        "研究科技获得符文族symbol",
      );
      if (claim?.ok) result.message = `${result.message}；${claim.message}`;
    }
    rocketState.statusNote = result.message;
    const current = getCurrentActionEffect();
    if (current) current.result = result;
    onTechTileSelected(result);
    completeCurrentActionEffect();
    renderStateReadout();
    return result;
  }

  function setCheatModeOpen(open) {
    tech.setCheatModeEnabled(techGameState, open);
    els.debugCheatButton?.setAttribute("aria-pressed", String(open));
    rocketState.statusNote = open ? "作弊模式：研究科技不消耗宣传" : "";
    updateActionButtons();
    renderStateReadout();
  }

  function toggleCheatMode() {
    setCheatModeOpen(!techGameState.ui.cheatModeEnabled);
  }

  function researchTechForCurrentPlayer() {
    return runAction("researchTech");
  }

  function commitSelectedResearchTech() {
    return { ok: false, message: "科技行动已改为效果链结算" };
  }

  function getCurrentPlayer() {
    return players.getCurrentPlayer(playerState);
  }

  function getPlayerByColor(color) {
    const normalizedColor = players.normalizePlayerColor(color);
    return playerState.players.find((player) => player.color === normalizedColor) || null;
  }

  function setDebugPlayerMenuOpen(open) {
    if (!els.debugPlayerMenu || !els.debugPlayerSwitchButton) return;
    els.debugPlayerMenu.hidden = !open;
    els.debugPlayerSwitchButton.setAttribute("aria-expanded", String(open));
  }

  function renderDebugPlayerSwitch() {
    const currentPlayer = getCurrentPlayer();
    if (els.debugPlayerSwitchButton && currentPlayer) {
      els.debugPlayerSwitchButton.textContent = `玩家：${currentPlayer.colorLabel}`;
    }
    if (!els.debugPlayerMenu) return;

    els.debugPlayerMenu.replaceChildren(...players.PLAYER_COLOR_IDS.map((colorId) => {
      const player = getPlayerByColor(colorId) || players.createPlayer({ color: colorId });
      const color = players.getPlayerColorDefinition(colorId);
      const button = document.createElement("button");
      button.type = "button";
      button.className = "debug-player-option";
      button.dataset.playerColor = colorId;
      button.style.setProperty("--player-color", color.uiColor);
      button.textContent = color.label;
      button.classList.toggle("is-current", currentPlayer?.color === colorId);
      button.setAttribute("aria-pressed", String(currentPlayer?.color === colorId));
      button.title = `切换到${player.name}`;
      return button;
    }));
  }

  function clearPlayerScopedSelectionsForSwitch() {
    pendingDiscardAction = null;
    pendingCardSelectionAction = null;
    pendingHandScanAction = null;
    pendingPlayCardSelection = null;
    cards.setSelectionActive(cardState, false);
    cards.setDiscardSelectionActive(cardState, false, 0);
    cards.setPlayCardSelectionActive(cardState, false);
    tech.setTechSelectionActive(techGameState, false);
    tech.cancelPendingTake(techGameState);
    closeTechBlueSlotPicker();
    closeDataPlacePicker();
    closeScanTargetPicker();
    closeScanAction4Picker();
    closeLandTargetPicker();
    clearActionEffectFlow();
    clearActionPending();
  }

  function selectDefaultRocketForCurrentPlayer() {
    const currentPlayer = getCurrentPlayer();
    const currentRocket = rocketActions.getActiveRocket(rocketState);
    if (currentRocket?.playerId === currentPlayer?.id && rocketActions.isControllablePlayerRocket(currentRocket)) {
      return currentRocket;
    }

    const rocketsForPlayer = getMovableTokensForPlayer(currentPlayer?.id);
    const fallbackRocket = rocketsForPlayer[rocketsForPlayer.length - 1] || null;
    rocketState.activeRocketId = fallbackRocket ? fallbackRocket.id : null;
    clearMoveRocketHighlight();
    return fallbackRocket;
  }

  function switchCurrentPlayerColor(color) {
    const targetPlayer = getPlayerByColor(color);
    if (!targetPlayer) {
      return { ok: false, message: "没有这名玩家" };
    }

    if (targetPlayer.id === playerState.currentPlayerId) {
      setDebugPlayerMenuOpen(false);
      return { ok: true, player: targetPlayer, message: `当前已是${targetPlayer.name}` };
    }

    clearPlayerScopedSelectionsForSwitch();
    playerState.currentPlayerId = targetPlayer.id;
    selectDefaultRocketForCurrentPlayer();
    rocketState.statusNote = `已切换到${targetPlayer.name}`;
    setDebugPlayerMenuOpen(false);
    renderDebugPlayerSwitch();
    syncCardSelectionChrome();
    syncDiscardSelectionChrome();
    syncPlayCardSelectionChrome();
    syncTechSelectionChrome();
    setTokenAssetSizes();
    renderPlayerStats();
    renderTechBoard();
    renderRockets();
    renderPublicCards();
    updatePublicCardControls();
    updateActionButtons();
    renderStateReadout();

    return { ok: true, player: targetPlayer, message: rocketState.statusNote };
  }

  function getReferencePlacementKindLabel(kind) {
    return REFERENCE_PLACEMENT_KIND_LABELS[kind] || kind || "贴图";
  }

  function getReferencePlacementName(placement) {
    if (!placement) return null;
    if (placement.kind === "satellite") {
      return `${placement.parentPlanetName} ${placement.satelliteName}`;
    }
    const index = placement.sequence ? placement.sequence : "";
    return `${placement.planetName} ${getReferencePlacementKindLabel(placement.kind)}${index}`;
  }

  function buildPlanetOrbitLandReferenceData() {
    return planetReferenceLayout.buildReferenceData();
  }

  function isPlanetMarkerRocket(rocket) {
    return Boolean(rocket?.referencePlacement?.isPlanetMarker);
  }

  function getBoardPointFromClientPosition(clientX, clientY) {
    const rect = els.wheelWrap.getBoundingClientRect();
    const size = solar.GLOBAL_COORDINATE_SYSTEM.size;

    return rocketActions.normalizeBoardPoint({
      x: ((clientX - rect.left) / rect.width) * size,
      y: ((clientY - rect.top) / rect.height) * size,
    });
  }

  function getPlanetsReferenceDimensions() {
    const width = els.planetsReferenceImage.naturalWidth
      || Number(els.planetsReferenceImage.getAttribute("width"))
      || PLANETS_REFERENCE_SIZE.width;
    const height = els.planetsReferenceImage.naturalHeight
      || Number(els.planetsReferenceImage.getAttribute("height"))
      || PLANETS_REFERENCE_SIZE.height;

    return { width, height };
  }

  function isPointInsideRect(clientX, clientY, rect) {
    return clientX >= rect.left
      && clientX <= rect.right
      && clientY >= rect.top
      && clientY <= rect.bottom;
  }

  function isClientPositionInsidePlanetsReference(clientX, clientY) {
    if (!els.planetsReferenceImage) return false;
    const rect = els.planetsReferenceImage.getBoundingClientRect();
    return isPointInsideRect(clientX, clientY, rect);
  }

  function getPlanetsReferencePointFromClientPosition(clientX, clientY) {
    const rect = els.planetsReferenceImage.getBoundingClientRect();
    const dimensions = getPlanetsReferenceDimensions();
    const percentX = ((clientX - rect.left) / rect.width) * 100;
    const percentY = ((clientY - rect.top) / rect.height) * 100;

    return rocketActions.normalizePlanetsReferencePoint({
      percentX,
      percentY,
      width: dimensions.width,
      height: dimensions.height,
    });
  }

  function formatBoardPoint(point) {
    if (!point) return "无";
    return `[${point.x.toFixed(2)},${point.y.toFixed(2)}]`;
  }

  function getPolarPointFromBoardPoint(point) {
    return rocketActions.getPolarPointFromBoardPoint(point);
  }

  function getBoardPointFromPolarPoint(point) {
    return rocketActions.getBoardPointFromPolarPoint(point);
  }

  function getPolarPointFromClientPosition(clientX, clientY) {
    return getPolarPointFromBoardPoint(getBoardPointFromClientPosition(clientX, clientY));
  }

  function formatPolarPoint(point) {
    if (!point) return "无";
    return `[r=${point.radius.toFixed(2)},a=${point.angleDegrees.toFixed(2)}]`;
  }

  function formatSectorCoordinate(resolution) {
    if (!resolution?.sectorCoordinate) return "无";
    return `[${resolution.sectorCoordinate.x},${resolution.sectorCoordinate.y}]`;
  }

  function formatPlanetsReferencePoint(point) {
    if (!point) return "planets贴图 无";
    return `planets贴图[${point.x.toFixed(2)},${point.y.toFixed(2)}] ${point.percentX.toFixed(2)}%,${point.percentY.toFixed(2)}%`;
  }

  function isRocketOnPlanetsReference(rocket) {
    return (rocket?.surface || ROCKET_SURFACE.SOLAR) === ROCKET_SURFACE.PLANETS_REFERENCE;
  }

  function createDefaultReferencePlacementInput(placement) {
    return {
      x: placement.x,
      y: placement.y,
      width: PLANETS_REFERENCE_SIZE.width,
      height: PLANETS_REFERENCE_SIZE.height,
    };
  }

  function createPlanetMarkerPlacement(slot, markerState) {
    if (slot.satelliteId) {
      return {
        parentPlanetId: slot.parentPlanetId,
        parentPlanetName: slot.parentPlanetName,
        satelliteId: slot.satelliteId,
        satelliteName: slot.satelliteName,
        kind: "satellite",
        x: slot.x,
        y: slot.y,
        isPlanetMarker: true,
        playerId: markerState.playerId,
        color: markerState.color,
      };
    }

    return {
      planetId: slot.planetId,
      planetName: slot.planetName,
      kind: slot.kind,
      sequence: slot.sequence,
      angleOffsetDegrees: slot.angleOffsetDegrees,
      center: slot.center,
      x: slot.x,
      y: slot.y,
      isPlanetMarker: true,
      playerId: markerState.playerId,
      color: markerState.color,
    };
  }

  function createPlanetMarkerRocket(slot, markerState) {
    const placement = createPlanetMarkerPlacement(slot, markerState);
    const rocket = {
      id: rocketState.nextRocketId,
      playerId: markerState.playerId,
      color: markerState.color,
      referencePlacement: placement,
    };

    rocketState.nextRocketId += 1;
    rocketState.rockets.push(rocket);
    rocketActions.placeRocketAtPlanetsReferencePoint(
      rocketState,
      rocket.id,
      createDefaultReferencePlacementInput(placement),
    );
    return rocket;
  }

  function removePlanetMarkerRockets() {
    const markerRockets = rocketState.rockets.filter(isPlanetMarkerRocket);
    markerRockets.forEach((rocket) => {
      rocketActions.removeRocket(rocketState, rocket.id);
      removeRocketElement(rocket.id);
    });
  }

  function syncPlanetOrbitLandMarkers() {
    removePlanetMarkerRockets();

    for (const planetId of planetReferenceLayout.PLANET_ORDER) {
      for (const markerState of planetStats.getPlanetOrbitMarkers(planetStatsState, planetId)) {
        const slot = planetReferenceLayout.getPlanetSlot(planetId, "orbit", markerState.sequence);
        if (slot) createPlanetMarkerRocket(slot, markerState);
      }
      for (const markerState of planetStats.getPlanetLandingMarkers(planetStatsState, planetId)) {
        const slot = planetReferenceLayout.getPlanetSlot(planetId, "land", markerState.sequence);
        if (slot) createPlanetMarkerRocket(slot, markerState);
      }
      for (const markerState of planetStats.getSatelliteLandingMarkers(planetStatsState, planetId)) {
        const slot = planetReferenceLayout.getSatellitePlacement(planetId, markerState.satelliteId);
        if (slot) createPlanetMarkerRocket(slot, markerState);
      }
    }

    renderRockets();
  }

  function seedDefaultReferenceRockets() {
    if (rocketState.rockets.length) return;

    rocketState.activeRocketId = null;
    rocketState.statusNote = null;
    syncPlanetOrbitLandMarkers();
  }

  function formatRocketLabel(rocket) {
    return rocketActions.formatRocketLabel(rocket);
  }

  function getMovableTokensForPlayer(playerId) {
    return rocketActions.getMovableTokensForPlayer
      ? rocketActions.getMovableTokensForPlayer(rocketState, playerId)
      : rocketActions.getRocketsForPlayer(rocketState, playerId);
  }

  function createRocketSnapshot(rocket) {
    return rocketActions.createRocketSnapshot(rocket);
  }

  function getEarthSectorCoordinate() {
    const snapshot = solar.createSolarSnapshot(solarState);
    const earth = snapshot.planetLocations.find((planet) => planet.planetId === "earth");

    if (!earth) {
      throw new Error("Earth position was not found in the current solar snapshot");
    }

    return { x: earth.x, y: earth.y };
  }

  function loadTokenWidth(asset, scale, fallbackNaturalWidth, onLoad) {
    const image = new Image();
    const resolveWidth = (naturalWidth) => {
      onLoad(Math.max(1, Math.round(naturalWidth * scale)));
    };
    image.addEventListener("load", () => {
      resolveWidth(image.naturalWidth || fallbackNaturalWidth);
    });
    image.addEventListener("error", () => {
      resolveWidth(fallbackNaturalWidth);
    });
    image.src = asset;
  }

  function setTokenAssetSizes() {
    const currentPlayer = getCurrentPlayer();
    const color = players.getPlayerColorDefinition(currentPlayer.color);
    let pendingLoads = 3;
    const finalizeTokenSizes = () => {
      pendingLoads -= 1;
      if (pendingLoads === 0) renderRockets();
    };

    loadTokenWidth(color.rocketAsset, ROCKET_IMAGE_SCALE, 205, (width) => {
      tokenWidths.rocket = width;
      els.tokenLayer.style.setProperty("--rocket-width", `${width}px`);
      els.planetsTokenLayer.style.setProperty("--rocket-width", `${width}px`);
      finalizeTokenSizes();
    });
    loadTokenWidth(color.satelliteAsset, REFERENCE_ORBIT_IMAGE_SCALE, 927, (width) => {
      tokenWidths.orbit = width;
      els.planetsTokenLayer.style.setProperty("--reference-orbit-width", `${width}px`);
      finalizeTokenSizes();
    });
    loadTokenWidth(color.landdingAsset, REFERENCE_LANDDING_IMAGE_SCALE, 927, (width) => {
      tokenWidths.landding = width;
      els.planetsTokenLayer.style.setProperty("--reference-land-width", `${width}px`);
      finalizeTokenSizes();
    });
  }

  function applyTokenWidth(element, rocket) {
    if (!isRocketOnPlanetsReference(rocket)) {
      element.style.removeProperty("width");
      return;
    }

    const kind = rocket.referencePlacement?.kind;
    if (kind === "orbit" && tokenWidths.orbit) {
      element.style.width = `${tokenWidths.orbit}px`;
      return;
    }
    if ((kind === "land" || kind === "satellite") && tokenWidths.landding) {
      element.style.width = `${tokenWidths.landding}px`;
      return;
    }
    if (tokenWidths.rocket) {
      element.style.width = `${tokenWidths.rocket}px`;
      return;
    }
    element.style.removeProperty("width");
  }

  function getRocketColorDefinition(rocket) {
    return players.getPlayerColorDefinition(rocket.color || players.DEFAULT_PLAYER_COLOR);
  }

  function getTokenAssetForRocket(rocket, color) {
    if (rocket.tokenSrc) return rocket.tokenSrc;
    if (!isRocketOnPlanetsReference(rocket)) return color.rocketAsset;

    const kind = rocket.referencePlacement?.kind;
    if (kind === "orbit") return color.satelliteAsset;
    if (kind === "land" || kind === "satellite") return color.landdingAsset;
    return color.rocketAsset;
  }

  function isChongFossilToken(rocket) {
    return (rocket?.kind || rocketActions.ROCKET_KIND?.STANDARD) === rocketActions.ROCKET_KIND?.CHONG_FOSSIL;
  }

  function getTokenTypeLabel(rocket) {
    if (isChongFossilToken(rocket)) {
      return "化石";
    }
    if (!isRocketOnPlanetsReference(rocket)) return "火箭";

    const kind = rocket.referencePlacement?.kind;
    if (kind === "orbit") return "卫星";
    if (kind === "land") return "登陆";
    return "火箭";
  }

  function renderRocketElement(rocket) {
    let element = document.getElementById(`rocket-${rocket.id}`);
    const color = getRocketColorDefinition(rocket);

    if (!element) {
      element = document.createElement("img");
      element.className = "rocket-token";
      element.id = `rocket-${rocket.id}`;
      element.draggable = false;
      element.dataset.rocketId = String(rocket.id);
      element.addEventListener("pointerdown", handleRocketPointerDown);
      els.tokenLayer.appendChild(element);
    }

    const layer = isRocketOnPlanetsReference(rocket) ? els.planetsTokenLayer : els.tokenLayer;
    if (layer && element.parentElement !== layer) layer.appendChild(element);

    const referencePlacement = rocket.referencePlacement || null;
    const referenceLabel = getReferencePlacementName(referencePlacement);
    const tokenTypeLabel = getTokenTypeLabel(rocket);
    element.src = getTokenAssetForRocket(rocket, color);
    const rocketLabel = formatRocketLabel(rocket);
    element.alt = referenceLabel
      ? `${referenceLabel} ${color.label}${tokenTypeLabel} ${rocketLabel}`
      : `${color.label}${tokenTypeLabel} ${rocketLabel}`;
    element.dataset.playerId = rocket.playerId || "";
    element.dataset.playerColor = color.id;
    element.dataset.referencePlanet = referencePlacement?.planetId || "";
    element.dataset.referenceParentPlanet = referencePlacement?.parentPlanetId || "";
    element.dataset.referenceSatellite = referencePlacement?.satelliteId || "";
    element.dataset.referenceKind = referencePlacement?.kind || "";
    element.style.setProperty("--rocket-glow", color.glowColor);
    element.classList.toggle("is-dragging", rocketState.draggingRocketId === rocket.id);
    element.classList.toggle("is-reference-placed", isRocketOnPlanetsReference(rocket));
    element.classList.toggle("is-default-reference", Boolean(referencePlacement?.isDefault));
    element.classList.toggle("is-reference-orbit", referencePlacement?.kind === "orbit");
    element.classList.toggle("is-reference-land", referencePlacement?.kind === "land");
    element.classList.toggle("is-reference-satellite", referencePlacement?.kind === "satellite");
    element.classList.toggle("is-planet-marker", Boolean(referencePlacement?.isPlanetMarker));
    element.classList.toggle("is-chong-fossil", isChongFossilToken(rocket));
    element.classList.toggle("is-chong-delivered", Boolean(rocket.chongDelivered || rocket.cargo?.delivered));
    element.classList.toggle("is-move-target", rocket.id === moveHighlightRocketId);
    element.classList.toggle("is-move-candidate", isRocketMoveCandidate(rocket));
    element.classList.toggle("is-move-muted", isRocketMoveMuted(rocket));
    element.classList.toggle(
      "is-move-selectable",
      rocket.playerId === getCurrentPlayer().id
        && (rocketActions.isMovablePlayerToken?.(rocket) || rocketActions.isControllablePlayerRocket(rocket)),
    );

    if (isRocketOnPlanetsReference(rocket)) {
      applyTokenWidth(element, rocket);
      const referencePoint = rocket.planetsReference || { percentX: 50, percentY: 50 };
      element.style.left = `${referencePoint.percentX}%`;
      element.style.top = `${referencePoint.percentY}%`;
      element.title = referenceLabel
        ? `${referenceLabel} ${rocketLabel} ${formatPlanetsReferencePoint(referencePoint)}`
        : formatPlanetsReferencePoint(referencePoint);
      return;
    }

    applyTokenWidth(element, rocket);

    const boardPoint = getBoardPointFromPolarPoint(rocket);
    element.style.left = `${boardPoint.x / 10}%`;
    element.style.top = `${boardPoint.y / 10}%`;
    element.title = referenceLabel
      ? `${referenceLabel} ${rocketLabel} ${formatPolarPoint(rocket)} ${formatBoardPoint(boardPoint)}`
      : `${formatPolarPoint(rocket)} ${formatBoardPoint(boardPoint)}`;
    if (isChongFossilToken(rocket) && (rocket.chongDelivered || rocket.cargo?.delivered)) {
      element.title = `${element.title} · 已送达，点击对应虫族任务牌完成`;
    }
    if (isChongFossilToken(rocket)) renderChongFossilOwnerTokenForRocket(rocket);
  }

  function renderChongFossilOwnerTokenForRocket(rocket, activeKeys = null) {
    if (!els.tokenLayer || !isChongFossilToken(rocket) || isRocketOnPlanetsReference(rocket)) return null;

    const key = String(rocket.id);
    if (activeKeys) activeKeys.add(key);
    let element = chongFossilOwnerTokenElements.get(key);
    if (!element) {
      element = document.createElement("img");
      element.className = "chong-fossil-owner-token";
      element.draggable = false;
      element.dataset.chongFossilOwnerToken = key;
      element.dataset.rocketId = key;
      chongFossilOwnerTokenElements.set(key, element);
      els.tokenLayer.appendChild(element);
    }
    if (element.parentElement !== els.tokenLayer) els.tokenLayer.appendChild(element);

    const player = getPlayerById(rocket.playerId) || { color: rocket.color };
    const color = getRocketColorDefinition(rocket);
    const boardPoint = getBoardPointFromPolarPoint(rocket);
    element.src = getNormalTokenAssetForPlayer(player);
    element.alt = `${color.label}化石归属标记 ${formatRocketLabel(rocket)}`;
    element.title = element.alt;
    element.style.left = `${boardPoint.x / 10}%`;
    element.style.top = `${boardPoint.y / 10}%`;
    return element;
  }

  function renderChongFossilOwnerTokens() {
    if (!els.tokenLayer) return;
    const activeKeys = new Set();
    for (const rocket of rocketState.rockets) {
      renderChongFossilOwnerTokenForRocket(rocket, activeKeys);
    }
    for (const [key, element] of chongFossilOwnerTokenElements.entries()) {
      if (activeKeys.has(key)) continue;
      element.remove();
      chongFossilOwnerTokenElements.delete(key);
    }
  }

  function renderRockets() {
    const activeIds = new Set(rocketState.rockets.map((rocket) => rocket.id));
    els.tokenLayer?.querySelectorAll(".rocket-token").forEach((element) => {
      const rocketId = Number(element.dataset.rocketId);
      if (!activeIds.has(rocketId)) element.remove();
    });
    els.planetsTokenLayer?.querySelectorAll(".rocket-token").forEach((element) => {
      const rocketId = Number(element.dataset.rocketId);
      if (!activeIds.has(rocketId)) element.remove();
    });
    rocketState.rockets.forEach(renderRocketElement);
    renderYichangdianAnomalyMarkers();
    renderChongPlanetFossilMarkers();
    renderChongFossilOwnerTokens();
    renderRunezuBoardSymbols();
  }

  function getYichangdianAnomalyKey(anomaly) {
    return `${anomaly.markerId}:${anomaly.sectorX}:${anomaly.y || 4}`;
  }

  function getYichangdianAnomalyBoardPoint(anomaly) {
    return aliens.getYichangdianAnomalyMarkerBoardPoint?.(solar, anomaly)
      || solar.solarGridToGlobalPoint(anomaly.sectorX, anomaly.y || 4);
  }

  function renderYichangdianAnomalyMarkers() {
    if (!els.tokenLayer || !yichangdian) return;
    const anomalies = alienGameState.yichangdian?.anomalies || [];
    const activeKeys = new Set();

    for (const anomaly of anomalies) {
      const key = getYichangdianAnomalyKey(anomaly);
      activeKeys.add(key);
      let element = yichangdianAnomalyMarkerElements.get(key);
      if (!element) {
        element = document.createElement("img");
        element.className = "yichangdian-anomaly-marker";
        element.draggable = false;
        yichangdianAnomalyMarkerElements.set(key, element);
        els.tokenLayer.appendChild(element);
      }
      if (element.parentElement !== els.tokenLayer) els.tokenLayer.appendChild(element);
      const point = getYichangdianAnomalyBoardPoint(anomaly);
      element.style.left = `${point.x / 10}%`;
      element.style.top = `${point.y / 10}%`;
      element.dataset.boardX = String(point.x);
      element.dataset.boardY = String(point.y);
      element.src = anomaly.src || yichangdian.getAnomalyMarkerSrc(anomaly.markerId);
      element.alt = `异常 ${anomaly.markerId}`;
      element.dataset.anomalyKey = key;
      element.dataset.markerId = anomaly.markerId;
      element.dataset.sectorX = String(anomaly.sectorX);
      element.dataset.sectorY = String(anomaly.y || 4);
      element.title = `${yichangdian.formatAnomalyLabel(anomaly)} @ [${point.x.toFixed(2)},${point.y.toFixed(2)}]`;
    }

    for (const [key, element] of yichangdianAnomalyMarkerElements.entries()) {
      if (activeKeys.has(key)) continue;
      element.remove();
      yichangdianAnomalyMarkerElements.delete(key);
    }
  }

  function getChongPlanetFossilMarkerKey(planetId) {
    return `planet:${planetId}`;
  }

  function getChongPlanetFossilPoint(planetLocation) {
    const boundary = solar.getSectorCoordinateBoundary(planetLocation.x, planetLocation.y);
    const polar = boundary.polarBoundary || {};
    if (
      Number.isFinite(polar.innerRadius)
      && Number.isFinite(polar.outerRadius)
      && Number.isFinite(polar.startAngleDegrees)
      && Number.isFinite(polar.endAngleDegrees)
    ) {
      const radius = polar.innerRadius + (polar.outerRadius - polar.innerRadius) * 0.78;
      const angle = polar.startAngleDegrees + (polar.endAngleDegrees - polar.startAngleDegrees) * 0.72;
      return solar.polarToGlobalPoint(radius, angle);
    }
    return boundary.boardCenter || solar.solarGridToGlobalPoint(planetLocation.x, planetLocation.y);
  }

  function renderChongPlanetFossilMarkers() {
    if (!els.tokenLayer || !chong) return;
    const cState = alienGameState.chong;
    const activeKeys = new Set();
    const revealed = Boolean(cState?.revealInitialized && cState.revealedSlotId);
    const planetLocations = revealed
      ? solar.createSolarSnapshot(solarState).planetLocations
      : [];

    for (const planetId of ["jupiter", "saturn"]) {
      const planetLocation = planetLocations.find((planet) => planet.planetId === planetId);
      if (!planetLocation) continue;
      const fossils = chong.getAvailablePlanetFossils(alienGameState, planetId);
      if (!fossils.length) continue;
      const key = getChongPlanetFossilMarkerKey(planetId);
      activeKeys.add(key);
      let element = chongPlanetFossilMarkerElements.get(key);
      if (!element) {
        element = document.createElement("img");
        element.className = "chong-planet-fossil-marker";
        element.draggable = false;
        chongPlanetFossilMarkerElements.set(key, element);
        els.tokenLayer.appendChild(element);
      }
      if (element.parentElement !== els.tokenLayer) els.tokenLayer.appendChild(element);
      const point = getChongPlanetFossilPoint(planetLocation);
      element.style.left = `${point.x / 10}%`;
      element.style.top = `${point.y / 10}%`;
      element.src = chong.FOSSIL_BACK_SRC;
      element.alt = `${getChongPlanetLabel(planetId)}化石背面`;
      element.dataset.chongPlanetId = planetId;
      element.dataset.chongPlanetFossilCount = String(fossils.length);
      element.title = `${getChongPlanetLabel(planetId)}化石背面 x${fossils.length}`;
    }

    for (const [key, element] of chongPlanetFossilMarkerElements.entries()) {
      if (activeKeys.has(key)) continue;
      element.remove();
      chongPlanetFossilMarkerElements.delete(key);
    }
  }

  function getRunezuBoardSymbolKey(sourceSymbol) {
    return `${sourceSymbol.sourceType}:${sourceSymbol.sourceId}`;
  }

  function getRunezuSourceSymbolPoint(sourceSymbol) {
    if (sourceSymbol.sourceType === "planet") {
      const planetLocation = solar.createSolarSnapshot(solarState).planetLocations
        .find((planet) => planet.planetId === sourceSymbol.sourceId);
      if (!planetLocation) return null;
      const boundary = solar.getSectorCoordinateBoundary(planetLocation.x, planetLocation.y);
      const polar = boundary.polarBoundary || {};
      if (
        Number.isFinite(polar.innerRadius)
        && Number.isFinite(polar.outerRadius)
        && Number.isFinite(polar.startAngleDegrees)
        && Number.isFinite(polar.endAngleDegrees)
      ) {
        const radius = polar.innerRadius + (polar.outerRadius - polar.innerRadius) * 0.72;
        const angle = polar.startAngleDegrees + (polar.endAngleDegrees - polar.startAngleDegrees) * 0.72;
        return solar.polarToGlobalPoint(radius, angle);
      }
      return boundary.boardCenter || solar.solarGridToGlobalPoint(planetLocation.x, planetLocation.y);
    }
    if (sourceSymbol.sourceType === "sector") {
      for (let x = 0; x < 8; x += 1) {
        const nebula = solar.getNebulaAtCoordinate(x, 5, solarState.sectorBySlot);
        if (nebula?.id !== sourceSymbol.sourceId) continue;
        const boundary = solar.getSectorCoordinateBoundary(x, 5);
        const polar = boundary.polarBoundary || {};
        if (
          Number.isFinite(polar.innerRadius)
          && Number.isFinite(polar.outerRadius)
          && Number.isFinite(polar.startAngleDegrees)
          && Number.isFinite(polar.endAngleDegrees)
        ) {
          const radius = polar.innerRadius + (polar.outerRadius - polar.innerRadius) * 0.38;
          const angle = polar.startAngleDegrees + (polar.endAngleDegrees - polar.startAngleDegrees) * 0.72;
          return solar.polarToGlobalPoint(radius, angle);
        }
        return boundary.boardCenter || solar.solarGridToGlobalPoint(x, 5);
      }
    }
    return null;
  }

  function mountRunezuBoardLayerSymbol(sourceSymbol, activeKeys) {
    if (!els.tokenLayer || !runezu || sourceSymbol.claimedByPlayerId || sourceSymbol.claimedByPlayerColor) return;
    if (sourceSymbol.sourceType !== "planet" && sourceSymbol.sourceType !== "sector") return;
    const point = getRunezuSourceSymbolPoint(sourceSymbol);
    if (!point) return;
    const key = getRunezuBoardSymbolKey(sourceSymbol);
    activeKeys.add(key);
    let element = runezuBoardSymbolElements.get(key);
    if (!element) {
      element = document.createElement("img");
      element.className = "runezu-board-symbol-marker";
      element.draggable = false;
      runezuBoardSymbolElements.set(key, element);
      els.tokenLayer.appendChild(element);
    }
    if (element.parentElement !== els.tokenLayer) els.tokenLayer.appendChild(element);
    element.style.left = `${point.x / 10}%`;
    element.style.top = `${point.y / 10}%`;
    element.src = runezu.getSymbolSrc(sourceSymbol.symbolId);
    element.alt = `符文族 ${sourceSymbol.symbolId}`;
    element.dataset.runezuSourceType = sourceSymbol.sourceType;
    element.dataset.runezuSourceId = sourceSymbol.sourceId;
    element.title = `符文族 ${sourceSymbol.sourceType}:${sourceSymbol.sourceId} ${runezu.formatSymbolLabel(sourceSymbol.symbolId)}`;
  }

  function mountRunezuTechSymbol(sourceSymbol, activeKeys) {
    if (!runezu || sourceSymbol.claimedByPlayerId || sourceSymbol.claimedByPlayerColor) return;
    if (sourceSymbol.sourceType !== "tech") return;
    const slot = techRenderContext.supplySlots?.[sourceSymbol.sourceId]
      || document.querySelector(`.tech-slot[data-tech-slot="${sourceSymbol.sourceId}"]`);
    if (!slot) return;
    const key = getRunezuBoardSymbolKey(sourceSymbol);
    activeKeys.add(key);
    let element = runezuBoardSymbolElements.get(key);
    if (!element) {
      element = document.createElement("img");
      element.className = "runezu-tech-symbol-marker";
      element.draggable = false;
      runezuBoardSymbolElements.set(key, element);
    }
    const mount = slot.querySelector(".tech-slot-stack") || slot;
    if (element.parentElement !== mount) mount.appendChild(element);
    element.src = runezu.getSymbolSrc(sourceSymbol.symbolId);
    element.alt = `符文族 ${sourceSymbol.symbolId}`;
    element.dataset.runezuSourceType = sourceSymbol.sourceType;
    element.dataset.runezuSourceId = sourceSymbol.sourceId;
    element.title = `符文族科技 ${sourceSymbol.sourceId} ${runezu.formatSymbolLabel(sourceSymbol.symbolId)}`;
  }

  function renderRunezuBoardSymbols() {
    if (!runezu) return;
    const activeKeys = new Set();
    const sourceSymbols = alienGameState.runezu?.revealInitialized
      ? runezu.listSourceSymbols(alienGameState)
      : [];
    for (const sourceSymbol of sourceSymbols) {
      mountRunezuBoardLayerSymbol(sourceSymbol, activeKeys);
      mountRunezuTechSymbol(sourceSymbol, activeKeys);
    }
    for (const [key, element] of runezuBoardSymbolElements.entries()) {
      if (activeKeys.has(key)) continue;
      element.remove();
      runezuBoardSymbolElements.delete(key);
    }
  }

  function createStatText(label, value) {
    const item = document.createElement("span");
    item.className = "player-stat";

    const labelEl = document.createElement("span");
    labelEl.className = "player-stat-label";
    labelEl.textContent = label;

    const valueEl = document.createElement("span");
    valueEl.className = "player-stat-value";
    valueEl.textContent = value;

    item.append(labelEl, valueEl);
    return item;
  }

  function createStatIcon(label, value, iconSrc) {
    const item = document.createElement("span");
    const icon = document.createElement("img");
    const valueEl = document.createElement("span");

    item.className = "player-stat player-stat-with-icon";
    item.setAttribute("aria-label", `${label} ${value}`);
    icon.className = "player-stat-icon";
    icon.src = iconSrc;
    icon.alt = "";
    icon.width = 296;
    icon.height = 296;
    icon.decoding = "async";
    icon.setAttribute("aria-hidden", "true");
    valueEl.className = "player-stat-value";
    valueEl.textContent = value;

    item.append(icon, valueEl);
    return item;
  }

  function createStatIconMarker(label, iconSrc) {
    const item = document.createElement("span");
    const icon = document.createElement("img");

    item.className = "player-stat player-stat-icon-marker";
    item.setAttribute("aria-label", label);
    icon.className = "player-stat-icon player-stat-marker-icon";
    icon.src = iconSrc;
    icon.alt = "";
    icon.width = 296;
    icon.height = 296;
    icon.decoding = "async";
    icon.setAttribute("aria-hidden", "true");

    item.append(icon);
    return item;
  }

  function createInlineIconValue(label, value, iconSrc, className) {
    const item = document.createElement("span");
    const icon = document.createElement("img");
    const valueEl = document.createElement("span");

    item.className = className;
    item.setAttribute("aria-label", `${label} ${value}`);
    icon.className = "player-stat-icon";
    icon.src = iconSrc;
    icon.alt = "";
    icon.width = 296;
    icon.height = 296;
    icon.decoding = "async";
    icon.setAttribute("aria-hidden", "true");
    valueEl.className = "player-stat-value";
    valueEl.textContent = value;

    item.append(icon, valueEl);
    return item;
  }

  function createPlayerNameStat(player, score, finalTotalScore) {
    const color = players.getPlayerColorDefinition(player.color);
    const item = document.createElement("span");
    const marker = document.createElement("span");
    const name = document.createElement("span");
    const scoreEl = createInlineIconValue("分数", score, RESOURCE_ICON_SRC.score, "player-stat-score");
    const finalScoreEl = createInlineIconValue(
      "终局总分",
      finalTotalScore,
      RESOURCE_ICON_SRC.finalScore,
      "player-stat-final-score",
    );

    item.className = "player-stat player-stat-current";
    item.style.setProperty("--player-color", color.uiColor);
    marker.className = "player-color-marker";
    marker.setAttribute("aria-hidden", "true");
    name.className = "player-stat-value";
    name.textContent = player.name;

    item.append(marker, name, scoreEl, finalScoreEl);
    return item;
  }

  function createStatSeparator() {
    const item = document.createElement("span");
    item.className = "player-stat-separator";
    item.setAttribute("aria-hidden", "true");
    item.textContent = "|";
    return item;
  }

  function createPlayerStatsRow(className, nodes) {
    const row = document.createElement("div");
    row.className = `player-stats-row ${className || ""}`.trim();
    row.append(...nodes);
    return row;
  }

  function shouldShowAomomoFossils(player) {
    return Boolean(
      aomomo
      && (solarState.aomomoActive
        || alienGameState.aomomo?.revealInitialized
        || Number(player?.resources?.aomomoFossils) > 0),
    );
  }

  function buildPlayerResourceStatNodes(player, options = {}) {
    const resources = player.resources || players.DEFAULT_RESOURCES;
    const limits = players.RESOURCE_LIMITS;
    const nodes = [
      createStatIcon("信用点", resources.credits, RESOURCE_ICON_SRC.credits),
      createStatIcon("能量", resources.energy, RESOURCE_ICON_SRC.energy),
      createStatIcon("宣传", `${resources.publicity}/${limits.publicity}`, RESOURCE_ICON_SRC.publicity),
      createStatIcon("可用数据", `${resources.availableData}/${limits.availableData}`, RESOURCE_ICON_SRC.data),
      createStatIcon("额外公共扫描", resources.additionalPublicScan || 0, RESOURCE_ICON_SRC.additionalPublicScan),
    ];
    if (shouldShowAomomoFossils(player)) {
      nodes.push(createStatIcon("奥陌陌化石", resources.aomomoFossils || 0, RESOURCE_ICON_SRC.aomomoFossil));
    }

    if (options.includeHandSize) {
      const handCount = Array.isArray(player.hand) ? player.hand.length : (resources.handSize || 0);
      nodes.push(createStatIcon("手牌", handCount, RESOURCE_ICON_SRC.card));
    }

    return nodes;
  }

  function buildPlayerIncomeStatNodes(player) {
    const income = player.income || players.DEFAULT_INCOME;
    return [
      createStatIconMarker("收入", RESOURCE_ICON_SRC.income),
      createStatIcon("收入信用点", income.credits || 0, RESOURCE_ICON_SRC.credits),
      createStatIcon("收入能量", income.energy || 0, RESOURCE_ICON_SRC.energy),
      createStatIcon("收入手牌", income.handSize || 0, RESOURCE_ICON_SRC.incomeCard),
      createStatIcon("收入宣传", income.publicity || 0, RESOURCE_ICON_SRC.publicity),
      createStatIcon("收入数据", income.availableData || 0, RESOURCE_ICON_SRC.data),
      createStatIcon("收入额外公共扫描", income.additionalPublicScan || 0, RESOURCE_ICON_SRC.additionalPublicScan),
    ];
  }

  function buildPlayerRunezuStatNodes(player) {
    if (!runezu || !alienGameState.runezu?.revealInitialized) return [];
    const counts = runezu.getPlayerSymbolCounts(player);
    const nodes = [];
    for (const symbolId of runezu.SYMBOL_IDS || []) {
      const count = counts[symbolId] || 0;
      if (count <= 0) continue;
      nodes.push(createStatIcon(runezu.formatSymbolLabel(symbolId), count, runezu.getSymbolSrc(symbolId)));
    }
    return nodes;
  }

  function computePlayerFinalScoreBreakdown(player) {
    return endGameScoring?.computePlayerFinalScore
      ? endGameScoring.computePlayerFinalScore({
        currentPlayer: player,
        finalScoringState,
        playerState,
        nebulaDataState,
        alienGameState,
        planetStatsState,
        cardEffects,
        getCardTypeCode,
      })
      : { totalScore: player.resources?.score || 0 };
  }

  function createOpponentStatRow(className) {
    const row = document.createElement("div");
    row.className = `opponent-stat-row ${className}`;
    return row;
  }

  function createOpponentTechRow(player, techType, prefix, techColor) {
    const row = createOpponentStatRow("opponent-stat-row-tech");
    const ownedTiles = player.techState?.ownedTiles || {};

    for (let index = 1; index <= 4; index += 1) {
      const tileId = `${techType}${index}`;
      const item = document.createElement("span");
      item.className = "opponent-tech-item";
      item.textContent = `${prefix}${index}`;
      if (ownedTiles[tileId]) {
        item.classList.add("is-owned");
        item.style.setProperty("--opponent-tech-color", techColor);
        if (player.techState?.disabledTiles?.[tileId]) {
          item.classList.add("is-disabled");
        }
      } else {
        item.classList.add("is-missing");
      }
      row.append(item);
    }

    return row;
  }

  function createOpponentPlayerHeaderRow(player, score, finalTotalScore) {
    const color = players.getPlayerColorDefinition(player.color);
    const row = createOpponentStatRow("opponent-stat-row-header");

    const idEl = document.createElement("span");
    idEl.className = "opponent-stat-id player-stat-value";
    idEl.textContent = player.colorLabel || color.label;

    const marker = document.createElement("span");
    marker.className = "player-color-marker";
    marker.style.setProperty("--player-color", color.uiColor);
    marker.setAttribute("aria-label", color.label);

    row.append(
      idEl,
      marker,
      createInlineIconValue("分数", score, RESOURCE_ICON_SRC.score, "player-stat-score"),
      createInlineIconValue("终局总分", finalTotalScore, RESOURCE_ICON_SRC.finalScore, "player-stat-final-score"),
    );
    return row;
  }

  function createOpponentSummaryRow(player) {
    const row = createOpponentStatRow("opponent-stat-row-summary");
    const orbitLandCount = endGameScoring?.countOrbitOrLandMarkers
      ? endGameScoring.countOrbitOrLandMarkers(player, planetStatsState)
      : 0;

    row.append(createStatIcon("环绕登陆", orbitLandCount, RESOURCE_ICON_SRC.orbitOrLand));

    for (const { color, label, iconKey } of OPPONENT_SECTOR_WIN_STATS) {
      const count = endGameScoring?.countSectorWinsByColor
        ? endGameScoring.countSectorWinsByColor(player, nebulaDataState, color)
        : 0;
      row.append(createStatIcon(label, count, RESOURCE_ICON_SRC[iconKey]));
    }

    return row;
  }

  function createOpponentAlienTraceRow(player) {
    const row = createOpponentStatRow("opponent-stat-row-alien-traces");
    row.append(
      createStatIcon(
        "黄色外星人痕迹",
        endGameScoring?.countTraceMarkers
          ? endGameScoring.countTraceMarkers(player, alienGameState, "yellow")
          : 0,
        RESOURCE_ICON_SRC.alienYellow,
      ),
      createStatIcon(
        "粉色外星人痕迹",
        endGameScoring?.countTraceMarkers
          ? endGameScoring.countTraceMarkers(player, alienGameState, "pink")
          : 0,
        RESOURCE_ICON_SRC.alienPink,
      ),
      createStatIcon(
        "蓝色外星人痕迹",
        endGameScoring?.countTraceMarkers
          ? endGameScoring.countTraceMarkers(player, alienGameState, "blue")
          : 0,
        RESOURCE_ICON_SRC.alienBlue,
      ),
    );
    return row;
  }

  function createOpponentRunezuSymbolRow(player) {
    const row = createOpponentStatRow("opponent-stat-row-runezu-symbols");
    const nodes = buildPlayerRunezuStatNodes(player);
    row.replaceChildren(...nodes);
    row.hidden = !nodes.length;
    return row;
  }

  function createOpponentJiuzheRow(player) {
    const cardsForPlayer = jiuzhe?.getPlayerJiuzheCards?.(alienGameState, player) || [];
    const playedCount = jiuzhe?.countPlayedCards?.(alienGameState, player) || 0;
    const threat = jiuzhe?.getPanelThreat?.(alienGameState, player) || 0;
    const revealed = Boolean(alienGameState.jiuzhe?.revealedSlotId);
    if (!revealed && !cardsForPlayer.length && !playedCount && !threat) return null;

    const row = createOpponentStatRow("opponent-stat-row-jiuzhe");
    row.append(
      createStatIcon("已打出九折牌", playedCount, RESOURCE_ICON_SRC.jiuzheCard),
      createStatIcon("九折威胁度", threat, RESOURCE_ICON_SRC.jiuzheThreat),
    );
    return row;
  }

  function renderOpponentStats() {
    if (!els.opponentStatGrid) return;

    const currentPlayerId = playerState.currentPlayerId;
    const cards = playerState.players.map((player) => {
      const color = players.getPlayerColorDefinition(player.color);
      const finalScoreBreakdown = computePlayerFinalScoreBreakdown(player);
      const card = document.createElement("article");
      card.className = "opponent-stat-card";
      card.dataset.playerId = player.id;
      if (player.id === currentPlayerId) {
        card.classList.add("is-current");
      }
      card.style.setProperty("--player-color", color.uiColor);

      const resourcesRow = createOpponentStatRow("opponent-stat-row-resources");
      resourcesRow.append(...buildPlayerResourceStatNodes(player, { includeHandSize: true }));

      const incomeRow = createOpponentStatRow("opponent-stat-row-income");
      incomeRow.append(...buildPlayerIncomeStatNodes(player));
      const jiuzheRow = createOpponentJiuzheRow(player);
      const runezuRow = createOpponentRunezuSymbolRow(player);

      card.append(
        createOpponentPlayerHeaderRow(player, player.resources.score, finalScoreBreakdown.totalScore),
        resourcesRow,
        incomeRow,
        ...(jiuzheRow ? [jiuzheRow] : []),
        ...(runezuRow && !runezuRow.hidden ? [runezuRow] : []),
        ...OPPONENT_TECH_TYPES.map(({ type, prefix, color: techColor }) => (
          createOpponentTechRow(player, type, prefix, techColor)
        )),
        createOpponentSummaryRow(player),
        createOpponentAlienTraceRow(player),
      );
      return card;
    });

    els.opponentStatGrid.replaceChildren(...cards);
  }

  function layoutCardFan(fan, cardCount) {
    if (!fan) return;

    const cardHeight = getPublicCardHeight() || 166;
    const cardWidth = cardHeight * (747 / 1040);
    const fanPadding = 14;
    const minStackStep = Math.round(cardWidth * 0.26);
    const count = Number.isInteger(cardCount)
      ? cardCount
      : fan.querySelectorAll(".player-hand-card-button, .player-hand-card").length;

    fan.style.setProperty("--card-height", `${cardHeight}px`);
    fan.style.setProperty("--card-width", `${cardWidth}px`);
    fan.style.minHeight = `${cardHeight + fanPadding}px`;
    fan.classList.toggle("is-spread", count > 1);

    if (!count) {
      fan.style.setProperty("--card-step", `${cardWidth}px`);
      return;
    }

    const padding = 24;
    const available = Math.max(0, fan.clientWidth - padding);
    const spreadStep = count > 1
      ? (available - cardWidth) / (count - 1)
      : cardWidth;
    const step = count > 1
      ? Math.max(minStackStep, spreadStep)
      : cardWidth;

    fan.style.setProperty("--card-step", `${step}px`);
  }

  function layoutPlayerHandFan(cardCount) {
    layoutCardFan(els.playerHandFan, cardCount);
  }

  function layoutReservedCardFan(cardCount) {
    layoutCardFan(els.reservedCardFan, cardCount);
  }

  function layoutReservedCardRows() {
    if (!els.reservedCardFan) return;
    els.reservedCardFan.querySelectorAll(".reserved-card-row").forEach((row) => {
      layoutCardFan(row);
    });
  }

  function renderPlayerHand() {
    if (!els.playerHandFan || !els.playerHandPanel) return;

    const currentPlayer = getCurrentPlayer();
    const hand = Array.isArray(currentPlayer.hand) ? currentPlayer.hand : [];
    const discardActive = isDiscardSelectionActive();
    const playActive = isPlayCardSelectionActive();
    const movePaymentActive = isMovePaymentSelectionActive();
    const handScanActive = isHandScanSelectionActive();
    const cardCornerAction = getPendingCardCornerQuickAction();
    const cardCornerActionEnabled = canUseCardCornerQuickAction();
    const handScanPickIndex = pendingScanTargetAction?.type === "hand_scan"
      && Number.isInteger(Number(pendingScanTargetAction.handIndex))
      ? Number(pendingScanTargetAction.handIndex)
      : null;
    const handPickActive = discardActive
      || playActive
      || movePaymentActive
      || handScanActive
      || isIndustryHandSelectionActive()
      || handScanPickIndex != null
      || cardCornerActionEnabled;
    els.playerHandPanel.classList.toggle("is-empty", hand.length === 0);
    els.playerHandPanel.classList.toggle("card-corner-action-ready", Boolean(cardCornerAction));
    layoutPlayerHandFan(hand.length);
    els.playerHandFan.replaceChildren(...hand.map((card, index) => {
      const label = card.cardName || (card.faceUp ? `手牌 ${index + 1}` : `手牌背面 ${index + 1}`);

      if (handPickActive && !(handScanPickIndex != null && index !== handScanPickIndex)) {
        const playCost = getCardPlayCost(card);
        const formattedPlayCost = formatCardPlayCost(playCost);
        const affordable = players.canAfford(currentPlayer, playCost);
        const button = document.createElement("button");
        button.type = "button";
        button.className = "player-hand-card-button";
        button.style.setProperty("--card-index", String(index + 1));
        button.dataset.handIndex = String(index);
        if (discardActive) {
          button.classList.add("is-selectable");
          if (pendingDiscardAction?.selectedIndexes?.includes(index)) {
            button.classList.add("is-selected");
          }
          button.setAttribute("aria-label", label);
        } else if (handScanActive) {
          const scanChoices = getPublicScanChoicesForCard(card);
          if (scanChoices.ok) {
            button.classList.add("is-scan-card");
            button.setAttribute("aria-label", `${label}（扫描牌，点击弃除并扫描）`);
            button.title = `${scanChoices.scanLabel}：点击后选择星云`;
          } else {
            button.classList.add("is-scan-card-muted");
            button.disabled = true;
            button.setAttribute("aria-label", label);
            button.title = scanChoices.message;
          }
        } else if (handScanPickIndex != null) {
          button.classList.add("is-scan-card", "is-selected");
          button.disabled = true;
          button.setAttribute("aria-label", `${label}（扫描中）`);
        } else if (isIndustryHandSelectionActive()) {
          button.classList.add("is-industry-hand-card");
          button.setAttribute("aria-label", `${label}（深空探测：选择交换手牌）`);
          button.title = "深空探测：点击选择要交换的手牌";
        } else if (movePaymentActive) {
          if (isMovePaymentCard(card)) {
            button.classList.add("is-move-card");
            if ((pendingMovePayment?.selectedHandIndices || []).includes(index)) {
              button.classList.add("is-selected");
            }
            button.setAttribute("aria-label", `${label}（移动牌，点击选择弃置）`);
            button.title = "弃置此牌以支付移动";
          } else {
            button.classList.add("is-move-card-muted");
            button.disabled = true;
            button.setAttribute("aria-label", label);
          }
        } else if (cardCornerActionEnabled) {
          const action = getCardCornerQuickActionForCard(card);
          const selected = cardCornerAction?.card?.id === card.id;
          if (action) {
            if (selected) button.classList.add("is-selected");
            button.setAttribute("aria-label", `${label}（${action.label}）`);
            button.title = selected
              ? `${action.label}：点击上方按钮确认，或再次点击取消`
              : `${action.label}：点击选择`;
          } else {
            button.setAttribute("aria-label", label);
            button.title = "这张牌没有可用的左上角快速行动";
          }
        } else if (playActive) {
          const selected = getPendingPlayCardSelection()?.handIndex === index;
          button.classList.add(affordable ? "is-playable" : "is-unaffordable");
          if (selected) button.classList.add("is-selected");
          button.setAttribute("aria-label", `${label}，费用 ${formattedPlayCost}`);
          button.title = affordable
            ? selected
              ? `已选择 ${label}，点击上方「打出」确认，或再次点击取消选择`
              : `选择 ${label}，费用 ${formattedPlayCost}`
            : `资源不足，需要 ${formattedPlayCost}`;
        } else {
          button.setAttribute("aria-label", label);
        }

        const image = document.createElement("img");
        image.src = card.src || players.CARD_BACK_SRC;
        image.alt = "";
        image.width = 747;
        image.height = 1040;
        image.decoding = "async";
        image.setAttribute("aria-hidden", "true");
        button.append(image);
        return button;
      }

      const image = document.createElement("img");
      image.className = "player-hand-card";
      image.src = card.src || players.CARD_BACK_SRC;
      image.alt = label;
      image.width = 747;
      image.height = 1040;
      image.decoding = "async";
      image.style.setProperty("--card-index", String(index + 1));
      return image;
    }));
  }

  function renderReservedCards() {
    renderReservedCardsFromTaskState();
  }

  function createReservedCardRow(rowType, label) {
    const row = document.createElement("div");
    row.className = `reserved-card-row reserved-card-row-${rowType}`;
    row.dataset.reservedRow = rowType;
    row.setAttribute("aria-label", label);
    return row;
  }

  function createJiuzheReservedButton(player) {
    const cardsForPlayer = jiuzhe?.getPlayerJiuzheCards?.(alienGameState, player) || [];
    if (!cardsForPlayer.length) return null;
    const playedCount = jiuzhe.countPlayedCards(alienGameState, player);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "reserved-card-button reserved-card-button-jiuzhe";
    button.dataset.jiuzheCards = "true";
    button.style.setProperty("--card-index", "1");
    button.title = "查看九折牌";

    const image = document.createElement("img");
    image.className = "player-hand-card reserved-card";
    image.src = jiuzhe.CARD_BACK_SRC;
    image.alt = "九折牌";
    image.width = 747;
    image.height = 1040;
    image.decoding = "async";
    image.setAttribute("aria-hidden", "true");
    button.append(image);

    const badge = document.createElement("span");
    badge.className = "reserved-card-trigger-badge";
    badge.textContent = String(playedCount);
    button.append(badge);
    return button;
  }

  function createBanrenmaReservedButton(card, originalIndex, rowIndex) {
    const currentPlayer = getCurrentPlayer();
    const mark = banrenma?.getPlayerScoreMarks?.(alienGameState, currentPlayer)
      ?.find((item) => item.id === card.banrenmaScoreMarkId || item.cardInstanceId === card.id);
    const threshold = mark?.threshold ?? card.banrenmaThreshold ?? "-";
    const ready = Number(currentPlayer?.resources?.score || 0) >= Number(threshold);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "reserved-card-button reserved-card-button-banrenma";
    button.dataset.banrenmaReservedIndex = String(originalIndex);
    button.disabled = !ready;
    button.style.setProperty("--card-index", String(rowIndex + 1));
    button.classList.toggle("is-banrenma-threshold-ready", ready);
    button.title = ready
      ? `半人马条件已达成：${cards.getCardLabel(card)}`
      : `半人马阈值：达到 ${threshold} 分后可结算条件效果`;

    const image = document.createElement("img");
    image.className = "player-hand-card reserved-card";
    image.src = card.src || banrenma?.getCardSrc?.(card.alienCardId) || RESOURCE_ICON_SRC.banrenmaCard;
    image.alt = cards.getCardLabel(card);
    image.width = 747;
    image.height = 1040;
    image.decoding = "async";
    image.setAttribute("aria-hidden", "true");

    const badge = document.createElement("span");
    badge.className = "reserved-card-banrenma-threshold-badge";
    const icon = document.createElement("img");
    icon.className = "reserved-card-banrenma-threshold-icon";
    icon.src = RESOURCE_ICON_SRC.banrenmaToken;
    icon.alt = "";
    icon.decoding = "async";
    icon.setAttribute("aria-hidden", "true");
    const value = document.createElement("span");
    value.textContent = String(threshold);
    badge.append(icon, value);

    button.append(image, badge);
    return button;
  }

  function createReservedCardButton(card, originalIndex, rowIndex, readyByCardId) {
    const ready = readyByCardId instanceof Map
      ? readyByCardId.get(card.id)
      : readyByCardId?.[card.id];
    const completedTriggerIndexes = cardEffects.getConsumedTriggerIndexes(card);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "reserved-card-button";
    button.dataset.reservedIndex = String(originalIndex);
    button.disabled = !ready;
    button.style.setProperty("--card-index", String(rowIndex + 1));
    button.classList.toggle("is-task-ready", Boolean(ready));
    button.title = ready ? "任务已满足，点击确认完成" : "";

    const image = document.createElement("img");
    image.className = "player-hand-card reserved-card";
    image.src = card.src || players.CARD_BACK_SRC;
    image.alt = card.cardName || `保留牌 ${originalIndex + 1}`;
    image.width = 747;
    image.height = 1040;
    image.decoding = "async";
    image.setAttribute("aria-hidden", "true");
    button.append(image);

    if (completedTriggerIndexes.length) {
      const badge = document.createElement("span");
      badge.className = "reserved-card-trigger-badge";
      badge.textContent = `已完成 ${completedTriggerIndexes.join("/")}`;
      button.append(badge);
    }

    if (ready) {
      const badge = document.createElement("span");
      badge.className = "reserved-card-task-badge";
      badge.textContent = "完成任务";
      button.append(badge);
    }

    return button;
  }

  function renderInitialSelectionArea() {
    if (!els.initialSelectionArea) return;

    const currentPlayer = getCurrentPlayer();
    if (isInitialSelectionActive()) {
      const offer = getInitialSelectionOffer(currentPlayer?.id);
      els.initialSelectionArea.hidden = false;
      els.initialSelectionArea.replaceChildren(createInitialSelectionPicker(offer));
      syncInteractionFocusChrome();
      return;
    }

    const selectedCards = getCurrentInitialSelectionCards(currentPlayer);
    if (!selectedCards.length) {
      els.initialSelectionArea.hidden = true;
      els.initialSelectionArea.replaceChildren();
      syncInteractionFocusChrome();
      return;
    }

    els.initialSelectionArea.hidden = false;
    const summary = document.createElement("div");
    summary.className = "initial-selection-company-slot";
    const [companyCard] = selectedCards;
    summary.replaceChildren(createCompanyCardSummary(companyCard, currentPlayer));
    els.initialSelectionArea.replaceChildren(summary);
    syncInteractionFocusChrome();
  }

  function applyIndustryStartupPassives() {
    for (const player of playerState.players) {
      if (industry?.shouldInitializeStrategyPassiveMarkers?.(player)) {
        industry.initializeStrategyPassiveMarkers(player);
      }
      if (industry?.shouldInitializeHeliosPassiveMarkers?.(player)) {
        industry.initializeHeliosPassiveMarkers(player);
      }
      if (!industry?.shouldPlaceMissionStartupFinalMark?.(player)) continue;
      const markResult = finalScoring.placeDirectMarkAtSlot(finalScoringState, "c", player, 3, {
        tokenSrc: getNormalTokenAssetForPlayer(player),
        source: "mission_relay_startup",
      });
      if (!markResult.ok) {
        rocketState.statusNote = markResult.message;
      }
    }
    renderFinalScoreBoard();
  }

  function isIndustryHandSelectionActive() {
    return pendingCardSelectionAction?.type === "industry_deepspace_hand";
  }

  function isIndustryFreeMoveActive() {
    return Boolean(industryFreeMoveState);
  }

  function cancelIndustryAbilityFlow(options = {}) {
    if (techGameState?.ui?.industryBorrowMode) {
      techGameState.ui.industryBorrowMode = false;
      tech.setTechSelectionActive(techGameState, false);
      syncTechSelectionChrome();
    }
    if (pendingCardSelectionAction?.type?.startsWith?.("industry_")) {
      if (pendingCardSelectionAction.refundCost && pendingCardSelectionAction.player) {
        players.gainResources(pendingCardSelectionAction.player, pendingCardSelectionAction.refundCost);
      }
      pendingCardSelectionAction = null;
      cards.setSelectionActive(cardState, false);
      syncCardSelectionChrome();
    }
    pendingIndustryAbility = null;
    industryFreeMoveState = null;
    if (moveHighlightRocketId != null) {
      deactivateMoveMode();
    }
    if (!options.silent) {
      renderPlayerHand();
      renderPublicCards();
      renderInitialSelectionArea();
      updateActionButtons();
    }
    syncIndustryHandSelectionChrome();
    syncInteractionFocusChrome();
  }

  function finishIndustryAbilityFlow(message) {
    const flowType = pendingIndustryAbility?.flowType;
    pendingIndustryAbility = null;
    industryFreeMoveState = null;
    cards.setSelectionActive(cardState, false);
    pendingCardSelectionAction = null;
    syncCardSelectionChrome();
    if (message) rocketState.statusNote = message;
    renderPlayerStats();
    renderPublicCards();
    renderPlayerHand();
    renderInitialSelectionArea();
    updateActionButtons();
    renderStateReadout();
    syncIndustryHandSelectionChrome();
    syncInteractionFocusChrome();
    if (flowType && !isIndustryIrreversibleFlow(flowType)) {
      completeIndustryAbilityQuickStep();
    }
  }

  function startIndustryAbilityFlow(flow) {
    if (!flow?.ok) {
      rocketState.statusNote = flow?.message || "公司 1x 行动无法启动";
      renderStateReadout();
      return false;
    }

    pendingIndustryAbility = { ...flow };
    switch (flow.flowType) {
      case "stratus_public_corners":
        beginCardSelection({
          type: "industry_stratus_corner",
          player: getCurrentPlayer(),
          allowBlindDraw: false,
          remaining: flow.remaining ?? industry.STRATUS_PUBLIC_CARD_LIMIT,
        });
        rocketState.statusNote = flow.message;
        renderStateReadout();
        return true;
      case "turing_borrow_tech":
        return beginIndustryTuringBorrow(flow);
      case "sentinel_arm_play_corner": {
        const injected = tryInjectSentinelPlayCornerEffectAfterArm();
        finishIndustryAbilityFlow(injected
          ? `${flow.message}；已加入打牌效果队列`
          : flow.message);
        return true;
      }
      case "huanyu_free_moves":
        return beginIndustryHuanyuFreeMoves(flow);
      case "helios_remove_tech":
        industry?.clearHeliosPassiveSlots?.(getCurrentPlayer());
        renderInitialSelectionArea();
        return openIndustryHeliosTechPicker(flow);
      case "mission_publicity_pick":
        return startIndustryPublicityPick(flow, "industry_mission_pick");
      case "fenwick_publicity_pick":
        return startIndustryPublicityPick(flow, "industry_fenwick_pick");
      case "deepspace_swap":
        pendingCardSelectionAction = {
          type: "industry_deepspace_hand",
          player: getCurrentPlayer(),
          allowBlindDraw: false,
        };
        rocketState.statusNote = flow.message;
        syncIndustryHandSelectionChrome();
        renderStateReadout();
        return true;
      case "strategy_pick":
        industry?.clearStrategyPassiveSlots?.(getCurrentPlayer());
        renderInitialSelectionArea();
        beginCardSelection({
          type: "industry_strategy_pick",
          player: getCurrentPlayer(),
          allowBlindDraw: false,
        });
        rocketState.statusNote = flow.message;
        renderStateReadout();
        return true;
      default:
        cancelIndustryAbilityFlow({ silent: true });
        rocketState.statusNote = flow.message || "未实现的公司 1x 行动";
        renderStateReadout();
        return false;
    }
  }

  function startIndustryPublicityPick(flow, pendingType) {
    const player = getCurrentPlayer();
    const cost = flow.publicityCost ?? industry.PUBLICITY_PICK_COST;
    if (!players.canAfford(player, { publicity: cost })) {
      rocketState.statusNote = `宣传不足，需要 ${cost} 宣传`;
      renderStateReadout();
      return false;
    }
    players.spendResources(player, { publicity: cost });
    beginCardSelection({
      type: pendingType,
      player,
      allowBlindDraw: false,
      refundCost: { publicity: cost },
      flowLabel: flow.label,
    });
    rocketState.statusNote = flow.message;
    renderStateReadout();
    return true;
  }

  function beginIndustryTuringBorrow(flow) {
    tech.setTechSelectionActive(techGameState, true);
    techGameState.ui.industryBorrowMode = true;
    techGameState.ui.selectedTileId = null;
    techGameState.ui.pendingTileId = null;
    techGameState.ui.allowedTechTypes = null;
    techGameState.ui.statusNote = flow.message;
    rocketState.statusNote = flow.message;
    syncTechSelectionChrome();
    renderTechBoard();
    renderStateReadout();
    return true;
  }

  function confirmIndustryTuringBorrow(tileId) {
    const player = getCurrentPlayer();
    const beforePlayer = structuredClone(player);
    player.industryBorrowedTechTileId = tileId;
    player.industryBorrowedTechRound = turnState.roundNumber;
    player.industryBorrowedTechTurn = turnState.turnNumber;
    tech.setTechSelectionActive(techGameState, false);
    techGameState.ui.industryBorrowMode = false;
    syncTechSelectionChrome();
    beginQuickActionStep("industry-turing-borrow", `图灵系统：借用 ${tileId}`);
    recordQuickHistoryCommand(historyCommands.createRestorePlayerCommand(
      player,
      beforePlayer,
      "恢复图灵借用前玩家状态",
    ));
    finishIndustryAbilityFlow(`图灵系统：本轮借用 ${tileId} 效果`);
    return { ok: true, tileId };
  }

  function openIndustryHeliosTechPicker(flow) {
    const player = getCurrentPlayer();
    const removable = (tech.playerTech?.listActiveOwnedTileIds?.(player.techState) || [])
      .filter((tileId) => !String(tileId).startsWith("blue"));
    if (!removable.length) {
      finishIndustryAbilityFlow("赫利昂联合体：没有可移除的非蓝色科技");
      return false;
    }
    return openScanTargetPicker({
      type: "industry_remove_tech",
      title: flow.label || "赫利昂联合体",
      subtitle: "选择要移除的科技（不可选蓝色），随后增加 1 次收入",
      choices: removable.map((tileId) => ({
        nebulaId: tileId,
        label: tileId,
        description: "移除后不再具备该科技效果",
      })),
    });
  }

  function confirmIndustryHeliosRemoveTech(tileId) {
    const player = getCurrentPlayer();
    const beforePlayer = structuredClone(player);
    const beforeCardState = {
      publicCards: cardState.publicCards.slice(),
      discardPile: (cardState.discardPile || []).slice(),
    };
    const removeResult = tech.playerTech.removePlayerTile(player.techState, tileId);
    if (!removeResult.ok) {
      rocketState.statusNote = removeResult.message;
      renderStateReadout();
      return removeResult;
    }
    renderTechBoard();
    pendingIndustryAbility = { flowType: "helios_remove_tech", removedTileId: tileId };
    beginQuickActionStep("industry-helios", `赫利昂联合体：移除 ${tileId}`);
    recordQuickHistoryCommand(historyCommands.createRestorePlayerCommand(
      player,
      beforePlayer,
      "恢复赫利昂移除科技前玩家状态",
    ));
    const incomeStart = beginDiscardSelection(1, {
      type: "industry_helios_income",
      player,
      beforePlayer,
      beforeCardState,
      removedTileId: tileId,
    });
    if (!incomeStart.ok) {
      Object.assign(player, beforePlayer);
      renderTechBoard();
      completeIndustryAbilityQuickStep();
    }
    rocketState.statusNote = incomeStart.ok
      ? `赫利昂联合体：已移除 ${tileId}，请选择 1 张手牌增加收入`
      : incomeStart.message;
    renderPlayerStats();
    renderStateReadout();
    return removeResult;
  }

  function beginIndustryHuanyuFreeMoves(flow) {
    const player = getCurrentPlayer();
    industryFreeMoveState = {
      movesLeft: flow.movesLeft ?? 2,
      movedRocketIds: [],
      beforePlayer: structuredClone(player),
      label: flow.label || "寰宇动力",
    };
    player.industryHuanyuFreeMovesLeft = industryFreeMoveState.movesLeft;
    player.industryHuanyuFreeMoveTurn = turnState.turnNumber;
    const rocketsForPlayer = getMovableTokensForPlayer(player.id);
    rocketState.statusNote = rocketsForPlayer.length
      ? `${flow.message}（剩余 ${industryFreeMoveState.movesLeft} 次）`
      : `${flow.message}：当前没有可移动火箭`;
    syncInteractionFocusChrome();
    renderRockets();
    if (rocketsForPlayer.length === 1) {
      activateMoveMode(rocketsForPlayer[0].id);
    } else if (rocketsForPlayer.length > 1) {
      selectDefaultRocketForCurrentPlayer();
    } else {
      finishIndustryAbilityFlow(rocketState.statusNote);
      return false;
    }
    renderStateReadout();
    return true;
  }

  function executeIndustryFreeMove(deltaX, deltaY, rocketId) {
    const state = industryFreeMoveState;
    if (!state) return { ok: false, message: "没有待结算的公司免费移动" };
    if (state.movedRocketIds.includes(rocketId)) {
      rocketState.statusNote = "该火箭本轮已免费移动过";
      renderStateReadout();
      return { ok: false, message: rocketState.statusNote };
    }

    const moveCheck = rocketActions.canMoveRocket(rocketState, rocketId, deltaX, deltaY);
    if (!moveCheck.ok) {
      rocketState.statusNote = moveCheck.message;
      renderStateReadout();
      return moveCheck;
    }

    const playerBeforeMove = structuredClone(getCurrentPlayer());
    const freeMoveStateBefore = {
      movesLeft: state.movesLeft,
      movedRocketIds: [...state.movedRocketIds],
      label: state.label,
    };
    const result = abilities.executeAbility("moveProbe", createActionContext(), {
      cost: {},
      movementPoints: 1,
      rocketId,
      deltaX,
      deltaY,
      historyLabel: `${state.label}：免费移动`,
      source: "industry",
    });
    if (result.rocket) renderRocketElement(result.rocket);
    if (!result.ok) {
      rocketState.statusNote = result.message;
      renderStateReadout();
      return result;
    }

    beginQuickActionStep("industry-free-move", `${state.label}：免费移动`);
    state.movedRocketIds.push(rocketId);
    state.movesLeft -= 1;
    const player = getCurrentPlayer();
    player.industryHuanyuMovedRocketIds = [...state.movedRocketIds];
    player.industryHuanyuFreeMovesLeft = Math.max(0, state.movesLeft);
    recordQuickHistoryCommand({
      label: "恢复寰宇免费移动次数",
      undo() {
        if (!industryFreeMoveState) {
          industryFreeMoveState = {
            movesLeft: freeMoveStateBefore.movesLeft,
            movedRocketIds: [...freeMoveStateBefore.movedRocketIds],
            label: freeMoveStateBefore.label,
          };
          pendingIndustryAbility = {
            flowType: "huanyu_free_moves",
            label: freeMoveStateBefore.label,
          };
        } else {
          industryFreeMoveState.movesLeft = freeMoveStateBefore.movesLeft;
          industryFreeMoveState.movedRocketIds = [...freeMoveStateBefore.movedRocketIds];
          industryFreeMoveState.label = freeMoveStateBefore.label;
        }
      },
    });
    recordQuickHistoryCommand(historyCommands.createRestorePlayerCommand(
      player,
      playerBeforeMove,
      "恢复公司免费移动前玩家状态",
    ));
    recordAbilityCommands(result, quickActionHistory);
    completeQuickActionStep();

    if (state.movesLeft <= 0) {
      finishIndustryAbilityFlow(`${state.label}：免费移动已完成`);
      return result;
    }

    rocketState.statusNote = `${state.label}：还可免费移动 ${state.movesLeft} 枚火箭`;
    deactivateMoveMode();
    renderRockets();
    renderStateReadout();
    return result;
  }

  function handleIndustryStratusPublicClick(slotIndex) {
    const pending = pendingCardSelectionAction;
    const player = getCurrentPlayer();
    const card = cardState.publicCards[slotIndex];
    if (!card) {
      rocketState.statusNote = "无效的公共牌";
      renderStateReadout();
      return { ok: false, message: rocketState.statusNote };
    }

    const reward = industry.getCornerReward(cards, card);
    if (!reward) {
      rocketState.statusNote = `${cards.getCardLabel(card)} 没有弃牌角标奖励`;
      renderStateReadout();
      return { ok: false, message: rocketState.statusNote };
    }

    const beforePlayer = structuredClone(player);
    const applied = industry.applyCornerReward(players, data, player, reward);
    if (!applied.ok) {
      rocketState.statusNote = applied.message;
      renderStateReadout();
      return applied;
    }

    beginQuickActionStep("industry-stratus-corner", `层云核心：${cards.getCardLabel(card)}`);
    recordQuickHistoryCommand(historyCommands.createRestorePlayerCommand(
      player,
      beforePlayer,
      "恢复层云核心角标结算前状态",
    ));
    completeQuickActionStep();

    pending.remaining = Math.max(0, (pending.remaining ?? 1) - 1);
    rocketState.statusNote = `${applied.message}（剩余 ${pending.remaining} 张）`;

    let waitingForFreeMove = false;
    if (applied.pendingFreeMove) {
      const moveCheck = canStartCardCornerFreeMove();
      if (moveCheck.ok) {
        waitingForFreeMove = true;
        pendingCardCornerFreeMove = {
          action: {
            label: "层云核心：免费移动",
            movementPoints: applied.pendingFreeMove.movementPoints || 1,
          },
          discardedCardLabel: cards.getCardLabel(card),
          finishIndustryFlowAfterMove: pending.remaining <= 0,
          afterMoveStatus: rocketState.statusNote,
        };
        rocketState.statusNote = moveCheck.rocketsForPlayer.length > 1
          ? "层云核心：请点击要免费移动的飞船"
          : "层云核心：使用方向键免费移动飞船";
        if (moveCheck.rocketsForPlayer.length === 1) {
          activateMoveMode(moveCheck.rocketsForPlayer[0].id);
        } else {
          selectDefaultRocketForCurrentPlayer();
        }
      }
    }

    if (pending.remaining <= 0 && !waitingForFreeMove) {
      cards.setSelectionActive(cardState, false);
      pendingCardSelectionAction = null;
      syncCardSelectionChrome();
      finishIndustryAbilityFlow(rocketState.statusNote);
    } else {
      renderPlayerStats();
      renderPublicCards();
      renderStateReadout();
    }
    return applied;
  }

  function handleIndustryDeepspaceHandClick(handIndex) {
    if (!isIndustryHandSelectionActive()) return;
    const player = getCurrentPlayer();
    const index = Math.round(handIndex);
    const card = player?.hand?.[index];
    if (!card) {
      rocketState.statusNote = "无效的手牌位置";
      renderStateReadout();
      return { ok: false, message: rocketState.statusNote };
    }

    pendingCardSelectionAction = {
      type: "industry_deepspace_public",
      player,
      handIndex: index,
      handCard: card,
      allowBlindDraw: false,
    };
    cards.setSelectionActive(cardState, true);
    rocketState.statusNote = `深空探测：已选手牌 ${cards.getCardLabel(card)}，请选择 1 张公共牌交换`;
    syncCardSelectionChrome();
    renderPlayerHand();
    renderPublicCards();
    renderStateReadout();
    return { ok: true, message: rocketState.statusNote };
  }

  function finalizeIndustryDeepspaceSwap(publicSlotIndex) {
    const pending = pendingCardSelectionAction;
    const player = pending?.player || getCurrentPlayer();
    const handIndex = Number(pending?.handIndex);
    const slotIndex = Math.round(Number(publicSlotIndex));
    const publicCard = cardState.publicCards?.[slotIndex];
    const handCard = Number.isInteger(handIndex) ? player?.hand?.[handIndex] : pending?.handCard;
    if (!handCard || !publicCard) {
      rocketState.statusNote = "交换失败：卡牌无效";
      renderStateReadout();
      return { ok: false, message: rocketState.statusNote };
    }

    const beforePlayer = structuredClone(player);
    const beforePublicCards = cardState.publicCards.slice();
    const beforeDiscard = (cardState.discardPile || []).slice();

    player.hand[handIndex] = publicCard;
    player.resources.handSize = player.hand.length;
    cardState.publicCards[slotIndex] = handCard;

    beginQuickActionStep("industry-deepspace-swap", "深空探测：交换手牌与公共牌");
    recordQuickHistoryCommand(historyCommands.createRestorePlayerCommand(
      player,
      beforePlayer,
      "恢复深空探测交换前玩家状态",
    ));
    recordQuickHistoryCommand(historyCommands.createRestorePublicCardsCommand(
      cardState,
      beforePublicCards,
      beforeDiscard,
    ));
    completeQuickActionStep();

    pendingCardSelectionAction = null;
    cards.setSelectionActive(cardState, false);
    syncCardSelectionChrome();
    finishIndustryAbilityFlow(`深空探测：${cards.getCardLabel(handCard)} 与 ${cards.getCardLabel(publicCard)} 已交换`);
    renderPlayerHand();
    renderPublicCards();
    return { ok: true, message: rocketState.statusNote };
  }

  function maybeApplyIndustryLaunchScan(result) {
    const player = getCurrentPlayer();
    if (!result?.ok || !industry?.shouldScanEarthOnLaunch?.(player)) return result;
    const earth = getEarthSectorCoordinate();
    const scanResult = abilities.executeAbility("scanSector", createActionContext(), {
      sectorX: earth.x,
      skipCost: true,
      source: "industry",
      historyLabel: "哨兵探测网络：发射扫描地球扇区",
    });
    if (scanResult.ok) {
      result.commands = [...(result.commands || []), ...(scanResult.commands || [])];
      result.message = `${result.message}；${scanResult.message}`;
      renderSectors();
    }
    return result;
  }

  function applyIndustryPlayCardPassives(playedCard, typeCode) {
    const player = getCurrentPlayer();
    if (!player || !playedCard) return;
    player.industryPlayedCardThisRound = true;
    player.industryLastPlayedCardThisRound = {
      id: playedCard.id,
      src: playedCard.src,
      cardId: playedCard.cardId,
      discardActionCode: playedCard.discardActionCode,
      incomeActionCode: playedCard.incomeActionCode,
      scanActionCode: playedCard.scanActionCode,
    };
    if (industry?.shouldGainPublicityOnType12Play?.(player) && [1, 2].includes(typeCode)) {
      players.gainResources(player, { publicity: industry.getMissionPlayPublicityGain() });
    }
    const strategyActivation = industry?.activateStrategyPlayInteraction?.(
      player,
      playedCard,
      turnState.roundNumber,
    );
    if (strategyActivation?.ok) {
      renderInitialSelectionArea();
    }
  }

  function isIndustryIrreversibleFlow(flowType) {
    return flowType === "mission_publicity_pick"
      || flowType === "fenwick_publicity_pick"
      || flowType === "strategy_pick";
  }

  function completeIndustryAbilityQuickStep() {
    if (quickActionHistory.hasUndoableStep()) {
      completeQuickActionStep();
    }
  }

  function commitIrreversibleIndustryQuickAction(label, message, options = {}) {
    appendActionLogStep(HISTORY_SOURCE_QUICK, label || "公司 1x 行动", message || null, {
      undoable: false,
      irreversibleCode: options.irreversibleCode || "hidden_card_reveal",
      irreversibleReason: options.irreversibleReason || "公共牌补牌翻出新牌",
    });
    clearHistoryStepOrderForSource(HISTORY_SOURCE_QUICK);
    if (quickActionHistory.hasSession()) {
      quickActionHistory.commitSession();
    }
  }

  function appendSentinelPlayCornerEffectsToFlow(nodes) {
    if (!pendingActionEffectFlow || !nodes?.length) return false;
    if (pendingActionEffectFlow.effects.some((effect) => effect.type === "industry_sentinel_corner")) {
      return false;
    }
    pendingActionEffectFlow.effects.push(...nodes.map((node) => ({
      ...node,
      status: "pending",
    })));
    pendingActionEffectFlow.completed = false;
    const hasActiveEffect = pendingActionEffectFlow.effects.some((effect) => effect.status === "active");
    if (!hasActiveEffect) {
      els.appWrap?.classList.toggle("action-effect-flow-active", true);
      activateNextActionEffect();
    }
    return true;
  }

  function tryInjectSentinelPlayCornerEffectAfterArm() {
    const player = getCurrentPlayer();
    const playedCard = player?.industryLastPlayedCardThisRound;
    if (!playedCard) return false;

    const nodes = industry?.buildSentinelPlayCornerEffectNodes?.(
      cards,
      player,
      turnState.roundNumber,
      turnState.turnNumber,
      playedCard,
    ) || [];
    if (!nodes.length) return false;

    if (isActionEffectFlowActive() && pendingActionEffectFlow.actionType === "playCard") {
      return appendSentinelPlayCornerEffectsToFlow(nodes);
    }

    if (!player.industryPlayedCardThisRound || !pendingActionExecuted) return false;

    return startCardEffectFlow(
      "industry-sentinel-corner",
      "哨兵探测网络",
      nodes,
      { actionType: "playCard", industryPlayedCard: playedCard },
    );
  }

  function executeIndustrySentinelCornerEffect(effect) {
    const currentPlayer = getCurrentPlayer();
    const playedCard = effect.options?.playedCard;
    if (!currentPlayer || !playedCard) {
      rocketState.statusNote = "哨兵探测网络：无效卡牌";
      renderStateReadout();
      return { ok: false, message: rocketState.statusNote };
    }
    if (industry?.isAlienCard?.(playedCard)) {
      effect.result = { ok: false, undoable: true, message: "外星人卡牌不能触发哨兵弃牌角标" };
      completeCurrentActionEffect("skipped");
      renderStateReadout();
      return effect.result;
    }

    const reward = industry.getCornerReward(cards, playedCard);
    if (!reward) {
      effect.result = { ok: false, undoable: true, message: "该牌没有弃牌角标奖励" };
      completeCurrentActionEffect("skipped");
      renderStateReadout();
      return effect.result;
    }

    const beforePlayer = structuredClone(currentPlayer);
    beginEffectHistoryStep(effect.label);
    const dataResults = [];
    if (reward.kind === "resource") {
      if (reward.gain && Object.keys(reward.gain).length) {
        players.gainResources(currentPlayer, reward.gain);
      }
      const dataCount = Math.max(0, Math.round(Number(reward.dataCount) || 0));
      for (let index = 0; index < dataCount; index += 1) {
        const gainResult = data.gainData(currentPlayer, { source: "industry_sentinel" });
        dataResults.push(gainResult);
        recordHistoryCommand(historyCommands.createGainDataCommand(currentPlayer, gainResult));
      }
    } else if (reward.kind === "move" && reward.gain && Object.keys(reward.gain).length) {
      players.gainResources(currentPlayer, reward.gain);
    }

    if (reward.kind === "move") {
      insertActionEffectsAfterCurrent([{
        id: `${effect.id || "sentinel-corner"}-move`,
        type: cardEffects.EFFECT_TYPES.CARD_MOVE,
        label: `${cards.getCardLabel(playedCard)}：${reward.label}`,
        icon: "movement",
        options: {
          movementPoints: reward.movementPoints || 1,
          historyLabel: reward.label,
        },
      }]);
    }

    recordHistoryCommand(historyCommands.createRestorePlayerCommand(
      currentPlayer,
      beforePlayer,
      "恢复哨兵弃牌角标结算前玩家状态",
    ));

    const rewardText = reward.kind === "resource"
      ? formatCardCornerRewardMessage(reward, dataResults)
      : `${formatPlanetRewardGain(reward.gain || {})}${reward.gain?.score ? "，" : ""}${reward.label}`;

    return finishAutomaticRewardEffect(effect, {
      ok: true,
      undoable: true,
      message: `${effect.label}：${rewardText}`,
      payload: { playedCard, reward, dataResults },
    });
  }

  function createCompanyCardSummary(companyCard, player) {
    const wrap = document.createElement("div");
    wrap.className = "company-card-summary";
    wrap.append(createInitialSelectionImage(companyCard, "summary"));

    const layout = industry?.getIndustryActionMarkerLayout?.(companyCard);
    if (layout && player) {
      const marked = industry?.isIndustryActionMarkedThisRound?.(
        player,
        turnState.roundNumber,
        turnState.turnNumber,
      );
      const canMark = !marked
        && !isInitialIncomeFlowActive()
        && industry?.canMarkIndustryAction?.(player, turnState.roundNumber, {
          turnNumber: turnState.turnNumber,
          hasMarker: true,
          industryCard: companyCard,
        })?.ok;

      if (!marked && canMark) {
        wrap.classList.add("is-action-marker-pending");
      }

      if (marked) {
        const token = document.createElement("img");
        token.className = "company-action-marker-token";
        token.src = getNormalTokenAssetForPlayer(player);
        token.alt = "";
        token.decoding = "async";
        token.setAttribute("aria-hidden", "true");
        token.style.left = `${layout.percentX}%`;
        token.style.top = `${layout.percentY}%`;
        token.style.setProperty("--company-action-radius", `${layout.radiusPercent}%`);
        wrap.append(token);
      } else {
        const hitArea = document.createElement("button");
        hitArea.type = "button";
        hitArea.className = "company-action-marker-hit";
        hitArea.dataset.companyLabel = companyCard.label || "";
        hitArea.disabled = !canMark;
        hitArea.setAttribute(
          "aria-label",
          canMark
            ? `放置公司 1x 行动标记：${companyCard.label || "公司牌"}`
            : `公司 1x 行动标记不可用：${companyCard.label || "公司牌"}`,
        );
        hitArea.title = canMark
          ? "点击在 1x 区域放置行动标记（每轮一次，可撤销）"
          : "本轮已放置公司行动标记";
        hitArea.style.left = `${layout.percentX}%`;
        hitArea.style.top = `${layout.percentY}%`;
        hitArea.style.setProperty("--company-action-radius", `${layout.radiusPercent}%`);
        if (canMark) {
          hitArea.addEventListener("click", () => {
            handleCompanyActionMarkerClick(companyCard);
          });
        }
        wrap.append(hitArea);
      }
    }

    if (player && industry?.shouldShowStrategyPassiveMarkers?.(player)) {
      industry.mountStrategyPassiveLayer(wrap, player, {
        getPlayerTokenAsset: getNormalTokenAssetForPlayer,
        isInteractionActive: (targetPlayer) => industry.isStrategyPlayInteractionActive?.(
          targetPlayer,
          turnState.roundNumber,
        ),
        getEligibleSlotIds: (targetPlayer) => industry.getStrategyPlayEligibleSlotIds?.(
          targetPlayer,
          turnState.roundNumber,
        ) || [],
        onSlotClick: (slotId) => {
          handleStrategyPassiveSlotClick(slotId);
        },
      });
    }

    if (player && industry?.shouldShowHeliosPassiveMarkers?.(player)) {
      industry.mountHeliosPassiveLayer(wrap, player, {
        getPlayerTokenAsset: getNormalTokenAssetForPlayer,
      });
    }

    return wrap;
  }

  function executeIndustryHeliosPassiveRewardEffect(effect) {
    const player = getCurrentPlayer();
    const slotId = effect.options?.slotId;
    if (!player || !slotId) {
      rocketState.statusNote = "赫利昂联合体：无效奖励";
      renderStateReadout();
      return { ok: false, message: rocketState.statusNote };
    }

    const check = industry?.canPlaceHeliosPassiveSlot?.(player, slotId);
    if (!check?.ok) {
      effect.result = { ok: false, undoable: true, message: check?.message || "无法领取奖励" };
      completeCurrentActionEffect("skipped");
      renderStateReadout();
      return effect.result;
    }

    const slotLabel = industry.getHeliosPassiveSlotLabel?.(slotId) || slotId;
    const reward = industry.getHeliosSlotReward?.(slotId);
    const rewardLabel = industry.getHeliosSlotRewardLabel?.(slotId) || "";
    const beforePlayer = structuredClone(player);

    beginEffectHistoryStep(effect.label);
    const placeResult = industry.placeHeliosPassiveSlot(player, slotId);
    if (!placeResult?.ok) {
      endEffectHistoryStep();
      rocketState.statusNote = placeResult?.message || "无法放置标记";
      renderStateReadout();
      return placeResult;
    }

    const dataResults = [];
    if (reward?.energy || reward?.additionalPublicScan) {
      players.gainResources(player, {
        energy: reward.energy || 0,
        additionalPublicScan: reward.additionalPublicScan || 0,
      });
    }
    if (reward?.data) {
      const gainResult = data.gainData(player, { source: "industry_helios_passive" });
      dataResults.push(gainResult);
      recordHistoryCommand(historyCommands.createGainDataCommand(player, gainResult));
    }

    recordHistoryCommand(historyCommands.createRestorePlayerCommand(
      player,
      beforePlayer,
      `撤销赫利昂联合体：${slotLabel}奖励`,
    ));

    return finishAutomaticRewardEffect(effect, {
      ok: true,
      undoable: true,
      message: `${effect.label}：+${rewardLabel}`,
      payload: { slotId, reward, dataResults },
    }, [renderInitialSelectionArea]);
  }

  function handleStrategyPassiveSlotClick(slotId) {
    if (getGameplayLockReason()) return;

    const player = getCurrentPlayer();
    const check = industry?.canInteractStrategyPlaySlot?.(player, slotId, turnState.roundNumber);
    if (!check?.ok) {
      rocketState.statusNote = check?.message || "无法放置被动标记";
      renderStateReadout();
      return;
    }

    const slotLabel = industry.getStrategyPassiveSlotLabel?.(slotId) || slotId;
    const reward = industry.getStrategySlotReward?.(slotId);
    const rewardLabel = industry.getStrategySlotRewardLabel?.(slotId) || "";
    const beforePlayer = structuredClone(player);

    beginQuickActionStep("strategy-passive-mark", `宇宙战略集团：${slotLabel}奖励槽`);
    const placeResult = industry.placeStrategyPassiveSlot(player, slotId);
    if (!placeResult?.ok) {
      quickActionHistory.undoLastStep();
      if (!quickActionHistory.hasUndoableStep()) {
        quickActionHistory.commitSession();
        clearHistoryStepOrderForSource(HISTORY_SOURCE_QUICK);
      }
      rocketState.statusNote = placeResult?.message || "无法放置被动标记";
      renderStateReadout();
      return;
    }

    industry.completeStrategyPlayInteraction(player);
    const dataResults = [];
    if (reward?.credits || reward?.publicity) {
      players.gainResources(player, {
        credits: reward.credits || 0,
        publicity: reward.publicity || 0,
      });
    }
    if (reward?.data) {
      const gainResult = data.gainData(player, { source: "industry_strategy_passive" });
      dataResults.push(gainResult);
    }

    recordQuickHistoryCommand(historyCommands.createRestorePlayerCommand(
      player,
      beforePlayer,
      `撤销宇宙战略集团：${slotLabel}奖励槽`,
    ));
    for (const gainResult of dataResults) {
      if (gainResult?.ok) {
        recordQuickHistoryCommand(historyCommands.createGainDataCommand(player, gainResult));
      }
    }
    completeQuickActionStep();

    rocketState.statusNote = `宇宙战略集团：${slotLabel}奖励槽 +${rewardLabel}`;
    renderInitialSelectionArea();
    renderPlayerStats();
    renderStateReadout();
  }

  function handleCompanyActionMarkerClick(companyCard) {
    if (getGameplayLockReason()) return;

    const player = getCurrentPlayer();
    const layout = industry?.getIndustryActionMarkerLayout?.(companyCard);
    const check = industry?.canMarkIndustryAction?.(player, turnState.roundNumber, {
      turnNumber: turnState.turnNumber,
      hasMarker: Boolean(layout),
      industryCard: companyCard,
    });
    if (!check?.ok) {
      rocketState.statusNote = check?.message || "无法放置公司行动标记";
      renderStateReadout();
      return;
    }

    const previousRoundMark = player.industryRoundMarkRound ?? 0;
    const previousTurnMark = player.industryRoundMarkTurn ?? 0;
    const companyLabel = companyCard.label || "公司牌";
    const abilityFlow = industry.buildActiveAbilityFlow(
      player,
      companyLabel,
      turnState.roundNumber,
      turnState.turnNumber,
    );
    if (!abilityFlow?.ok) {
      if (abilityFlow?.message && industry.hasImplementedActiveAbility?.(companyCard)) {
        rocketState.statusNote = abilityFlow.message;
      } else {
        rocketState.statusNote = "该公司 1x 行动暂未处理";
      }
      renderStateReadout();
      return;
    }

    beginQuickActionStep("industry-mark", `公司行动标记：${companyLabel}`);
    const result = industry.markIndustryAction(player, turnState.roundNumber, {
      turnNumber: turnState.turnNumber,
    });
    if (!result.ok) {
      industry.resetRoundIndustryRuntimeState(player);
      quickActionHistory.undoLastStep();
      if (!quickActionHistory.hasUndoableStep()) {
        quickActionHistory.commitSession();
        clearHistoryStepOrderForSource(HISTORY_SOURCE_QUICK);
      }
      rocketState.statusNote = result.message;
      renderStateReadout();
      return;
    }

    recordQuickHistoryCommand({
      label: `撤销公司行动标记：${companyLabel}`,
      undo() {
        player.industryRoundMarkRound = previousRoundMark;
        player.industryRoundMarkTurn = previousTurnMark;
        industry.resetRoundIndustryRuntimeState(player);
        cancelIndustryAbilityFlow({ silent: true });
        renderInitialSelectionArea();
      },
    });
    completeQuickActionStep();

    startIndustryAbilityFlow(abilityFlow);
    rocketState.statusNote = abilityFlow.message || rocketState.statusNote;
    renderInitialSelectionArea();
    renderStateReadout();
  }

  function createInitialSelectionPicker(offer) {
    const wrap = document.createElement("div");
    wrap.className = "initial-selection-picker";

    if (!offer) {
      const empty = document.createElement("div");
      empty.className = "initial-selection-empty";
      empty.textContent = "没有可用的初始选择。";
      wrap.append(empty);
      return wrap;
    }

    const confirmed = Boolean(offer.confirmed);
    const industrySection = createInitialSelectionSection({
      title: "公司 2 选 1",
      kind: "industry",
      cards: offer.industryOptions,
      selectedIds: offer.selectedIndustryId ? [offer.selectedIndustryId] : [],
      disabled: confirmed,
    });
    const initialSection = createInitialSelectionSection({
      title: "初始牌 3 选 2",
      kind: "initial",
      cards: offer.initialOptions,
      selectedIds: offer.selectedInitialIds,
      disabled: confirmed,
    });

    const footer = document.createElement("div");
    footer.className = "initial-selection-footer";
    const status = document.createElement("span");
    status.className = "initial-selection-status";
    status.textContent = confirmed
      ? "已确认"
      : `已选公司 ${offer.selectedIndustryId ? 1 : 0}/1，初始牌 ${offer.selectedInitialIds.length}/2`;

    const confirm = document.createElement("button");
    confirm.type = "button";
    confirm.className = "initial-selection-confirm";
    confirm.textContent = confirmed ? "已确认" : "确认选择";
    confirm.disabled = confirmed || !canConfirmInitialSelection(offer);
    confirm.addEventListener("click", confirmInitialSelectionForCurrentPlayer);
    footer.append(status, confirm);

    wrap.append(industrySection, initialSection, footer);
    return wrap;
  }

  function createInitialSelectionSection(options) {
    const section = document.createElement("section");
    section.className = `initial-selection-section initial-selection-section-${options.kind}`;
    const title = document.createElement("div");
    title.className = "initial-selection-section-title";
    title.textContent = options.title;
    const row = document.createElement("div");
    row.className = "initial-selection-card-row";
    row.replaceChildren(...options.cards.map((card) => (
      createInitialSelectionButton(card, {
        kind: options.kind,
        selected: options.selectedIds.includes(card.id),
        disabled: options.disabled
          || (
            options.kind === "initial"
            && options.selectedIds.length >= INITIAL_SELECTION_REQUIRED.initial
            && !options.selectedIds.includes(card.id)
          ),
      })
    )));
    section.append(title, row);
    return section;
  }

  function createInitialSelectionButton(card, options) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "initial-selection-card-button";
    button.classList.toggle("is-selected", Boolean(options.selected));
    button.dataset.initialKind = options.kind;
    button.dataset.initialCardId = card.id;
    button.disabled = Boolean(options.disabled);
    button.setAttribute("aria-pressed", String(Boolean(options.selected)));
    button.setAttribute("aria-label", card.label);
    button.addEventListener("click", () => {
      handleInitialSelectionCardClick(options.kind, card.id);
    });
    button.append(createInitialSelectionImage(card));
    return button;
  }

  function createInitialSelectionImage(card, mode = "picker") {
    const image = document.createElement("img");
    image.className = `initial-selection-card initial-selection-card-${card.kind || "card"} initial-selection-card-${mode}`;
    image.src = card.src;
    image.alt = card.label || "";
    image.width = card.width || 747;
    image.height = card.height || 1040;
    image.decoding = "async";
    return image;
  }

  function placeDataToBlueSlot(blueSlot) {
    const blocked = blockIncompatiblePendingQuickAction("place-data");
    if (blocked) return blocked;

    const player = getCurrentPlayer();
    if (!data.listPoolTokens(player).length) {
      rocketState.statusNote = "数据池没有可放置的数据";
      renderStateReadout();
      return { ok: false, message: rocketState.statusNote };
    }

    const check = data.canPlaceDataToBlueBonus(player, blueSlot);
    if (!check.ok) {
      rocketState.statusNote = check.message;
      renderStateReadout();
      return check;
    }

    return confirmDataPlacement(data.PLACEMENT_KIND_BLUE_BONUS, blueSlot);
  }

  function renderPlayerDataBoard() {
    const currentPlayer = getCurrentPlayer();
    data.renderPlayerDataTokens(currentPlayer, els.playerBoardDataLayer, {
      onPlace: (blueSlot) => {
        placeDataToBlueSlot(blueSlot);
      },
    });
  }

  function renderPlayerStats() {
    const currentPlayer = getCurrentPlayer();
    const resources = currentPlayer.resources;
    const finalScoreBreakdown = computePlayerFinalScoreBreakdown(currentPlayer);

    syncFinalScorePendingMarks();
    renderFinalScoreBoard();

    const mainStats = [
      createPlayerNameStat(currentPlayer, resources.score, finalScoreBreakdown.totalScore),
      createStatSeparator(),
      ...buildPlayerResourceStatNodes(currentPlayer),
      createStatSeparator(),
      ...buildPlayerIncomeStatNodes(currentPlayer),
    ];
    const runezuStats = buildPlayerRunezuStatNodes(currentPlayer);
    const statRows = [
      createPlayerStatsRow("player-stats-main-row", mainStats),
    ];

    if (runezuStats.length) {
      const label = document.createElement("span");
      label.className = "player-stat player-stat-runezu-label";
      label.textContent = "符文族";
      statRows.push(createPlayerStatsRow("player-stats-runezu-row", [label, ...runezuStats]));
    }

    els.playerStats.replaceChildren(...statRows);
    renderOpponentStats();
    updatePlayerHandPanelTitle();
    renderPlayerHand();
    renderReservedCards();
    renderPlayerDataBoard();
    if (!isInitialSelectionActive()) {
      queueJiuzheOpportunitiesForPlayer(currentPlayer);
      maybeOpenQueuedJiuzheOpportunity();
      queueBanrenmaOpportunitiesForPlayer(currentPlayer);
      maybeOpenQueuedBanrenmaOpportunity();
    }
  }

  function getPlayerReadoutLines() {
    const currentPlayer = getCurrentPlayer();
    const resources = currentPlayer.resources;
    const income = currentPlayer.income || players.DEFAULT_INCOME;
    const limits = players.RESOURCE_LIMITS;
    const reservedCount = Array.isArray(currentPlayer.reservedCards) ? currentPlayer.reservedCards.length : 0;
    const finalScoreBreakdown = endGameScoring?.computePlayerFinalScore
      ? endGameScoring.computePlayerFinalScore({
        currentPlayer,
        finalScoringState,
        playerState,
        nebulaDataState,
        alienGameState,
        planetStatsState,
        cardEffects,
        getCardTypeCode,
      })
      : { totalScore: resources.score, tileScore: 0, cardScore: 0 };

    return [
      "玩家状态",
      `${currentPlayer.name}(${currentPlayer.color}) 信用点=${resources.credits} 能量=${resources.energy} 宣传=${resources.publicity}/${limits.publicity} 可用数据=${resources.availableData}/${limits.availableData} 奥陌陌化石=${resources.aomomoFossils || 0} 额外公共扫描=${resources.additionalPublicScan || 0} 手牌=${resources.handSize} 保留=${reservedCount} 完成任务=${currentPlayer.completedTaskCount || 0} 分数=${resources.score} 环绕=${currentPlayer.orbitCount}`,
      `终局总分=${finalScoreBreakdown.totalScore}（板块=${finalScoreBreakdown.tileScore || 0} 卡牌=${finalScoreBreakdown.cardScore || 0} 九折=${finalScoreBreakdown.jiuzheCardScore || 0} 符文族=${finalScoreBreakdown.runezuSymbolScore || 0} 威胁=${finalScoreBreakdown.jiuzheThreat || 0}${finalScoreBreakdown.jiuzhePenaltyApplied ? " 已0.9修正" : ""}）`,
      `符文族symbol ${runezu?.getPlayerSymbolSummary?.(currentPlayer) || "无"}`,
      `收入 信用点=${income.credits || 0} 能量=${income.energy || 0} 手牌=${income.handSize || 0} 宣传=${income.publicity || 0} 数据=${income.availableData || 0}`,
    ];
  }

  function getInitialSelectionReadoutLines() {
    const playerIds = getInitialSelectionPlayerIds();
    const phaseLabel = setupSelectionState.phase === "selecting" ? "选择中" : "已完成";
    const lines = [
      "初始选择",
      `状态=${phaseLabel} 当前=${setupSelectionState.currentPlayerId ? getPlayerLabelById(setupSelectionState.currentPlayerId) : "无"}`,
    ];

    for (const playerId of playerIds) {
      const player = getPlayerById(playerId);
      const offer = getInitialSelectionOffer(playerId);
      const selectedIndustry = offer?.selectedIndustryId
        ? getCardFromInitialOffer(offer, "industry", offer.selectedIndustryId)?.label
        : player?.initialSelection?.industry?.label;
      const selectedInitial = offer?.selectedInitialIds?.length
        ? offer.selectedInitialIds
          .map((cardId) => getCardFromInitialOffer(offer, "initial", cardId)?.label)
          .filter(Boolean)
        : (player?.initialSelection?.removedInitialCards || []).map((card) => card.label);

      lines.push(
        `${getPlayerLabelById(playerId)} 公司=${selectedIndustry || "未选"} 初始牌=${selectedInitial.join("、") || "未选"} 确认=${isInitialSelectionConfirmed(playerId) ? "是" : "否"}`,
      );
    }

    return lines;
  }

  function getPlanetStatsReadoutLines() {
    return [
      "星球统计",
      ...planetStats.formatPlanetStatsLines(planetStatsState),
    ];
  }

  function queueStateReadoutRender() {
    if (stateReadoutRenderFrame) return;
    stateReadoutRenderFrame = window.requestAnimationFrame(() => {
      stateReadoutRenderFrame = 0;
      renderStateReadout();
    });
  }

  function createActionContext() {
    return {
      solarState,
      playerState,
      cardState,
      rocketState,
      nebulaDataState,
      planetStatsState,
      alienGameState,
      techBoardState: techGameState.board,
      techUiState: techGameState.ui,
      techGameState,
      getPlayerTokenSrc: (player) => getNormalTokenAssetForPlayer(player),
      getEarthSectorCoordinate,
      getPlanetLocations: () => solar.createSolarSnapshot(solarState).planetLocations,
      rotateSolarOrbit: (count) => rotateSolarOrbit(count),
      drawBasicCardToPlayer: (player) => drawBasicCardToPlayer(player),
      drawBasicCard: () => drawCardForCurrentPlayer(),
      blindDrawCard: (player) => blindDrawCardForPlayer(player),
      launchRocketAtEarth: (player) => rocketActions.launchRocketAtSector(rocketState, getEarthSectorCoordinate(), {
        playerId: player.id,
        color: player.color,
      }),
      replenishPublicSlot: (slotIndex) => cards.replenishPublicSlot(cardState, playerState, slotIndex),
      beginCardSelection: (pendingAction) => beginCardSelection(pendingAction),
      beginDiscardSelection: (count, pendingAction) => beginDiscardSelection(count, pendingAction),
      beginIncome: (options) => beginIncomeForCurrentPlayer(options),
      ensurePlayerTechState: (player) => {
        if (!player.techState) {
          player.techState = players.normalizePlayerTechState(null);
        }
      },
    };
  }

  function removeRocketElement(rocketId) {
    const element = document.getElementById(`rocket-${rocketId}`);
    if (element) element.remove();
    const chongOwnerToken = chongFossilOwnerTokenElements.get(String(rocketId));
    if (chongOwnerToken) {
      chongOwnerToken.remove();
      chongFossilOwnerTokenElements.delete(String(rocketId));
    }
  }

  function setActionButtonState(button, enabled, reason) {
    if (!button) return;
    button.disabled = !enabled;
    button.classList.toggle("action-button-ready", enabled);
    button.title = enabled ? "" : (reason || "当前无法执行此行动");
    button.setAttribute("aria-disabled", String(!enabled));
  }

  function setTurnActionButtonState(button, enabled, highlighted = false) {
    if (!button) return;
    button.disabled = !enabled;
    button.classList.toggle("action-button-pending", Boolean(enabled && highlighted));
    button.setAttribute("aria-disabled", String(!enabled));
  }

  function markActionPending() {
    pendingActionExecuted = true;
  }

  function getIrreversibleReason(result, fallback = "该步骤产生不可撤销影响") {
    if (result?.irreversible?.reason) return String(result.irreversible.reason);
    if (result?.irreversibleReason) return String(result.irreversibleReason);
    if (result?.undoable === false) return result.message || fallback;
    return null;
  }

  function markCurrentActionIrreversible(reason, code = "irreversible") {
    pendingActionHasIrreversibleBarrier = true;
    pendingActionIrreversibleReason = reason || pendingActionIrreversibleReason || "该步骤产生不可撤销影响";
    return {
      code,
      reason: pendingActionIrreversibleReason,
    };
  }

  function markResultIrreversible(result, reason, code = "irreversible") {
    if (!result) return result;
    result.undoable = false;
    result.irreversible = {
      code,
      reason: reason || result.irreversible?.reason || result.message || "该步骤产生不可撤销影响",
    };
    markCurrentActionIrreversible(result.irreversible.reason, result.irreversible.code);
    return result;
  }

  function getAlienCardGainIrreversible(result) {
    return result?.card
      ? { code: "hidden_alien_card_reveal", reason: "外星人牌获取翻开新牌" }
      : null;
  }

  function clearActionPending() {
    pendingActionExecuted = false;
    pendingPassPlayerId = null;
    pendingActionHasIrreversibleBarrier = false;
    pendingActionIrreversibleReason = null;
  }

  function canUndoCurrentMainAction() {
    if (actionHistory.hasUndoableStep()) return true;
    if (pendingActionHasIrreversibleBarrier) return false;
    return Boolean(pendingActionExecuted || isActionEffectFlowActive());
  }

  function canStartMainAction() {
    return !getGameplayLockReason()
      && !pendingActionExecuted
      && !isActionEffectFlowActive()
      && !actionHistory.hasSession()
      && !hasActivePendingSubFlow();
  }

  function passForCurrentPlayer() {
    if (!canStartMainAction()) {
      rocketState.statusNote = "本回合已经开始或完成主要行动";
      renderStateReadout();
      return { ok: false, message: rocketState.statusNote };
    }

    const currentPlayer = getCurrentPlayer();
    if (!currentPlayer) {
      return { ok: false, message: "没有当前玩家" };
    }

    pendingPassPlayerId = currentPlayer.id;
    startActionLogDraft("pass", "PASS", { source: HISTORY_SOURCE_MAIN, player: currentPlayer });
    actionHistory.beginSession("pass", "PASS");
    actionHistory.beginStep({
      source: HISTORY_SOURCE_MAIN,
      type: "action_start",
      label: `${currentPlayer.colorLabel}玩家 PASS`,
      effectIndex: -1,
    });
    effectStepActive = true;
    completePendingActionStep();

    rocketState.statusNote = `${currentPlayer.colorLabel}玩家选择 PASS，请点击回合结束确认`;
    updateActionButtons();
    renderStateReadout();
    return { ok: true, message: rocketState.statusNote };
  }

  function endCurrentTurn() {
    if (!pendingActionExecuted || isActionEffectFlowActive() || hasActivePendingSubFlow()) return;
    const endingPlayer = getCurrentPlayer();
    const endingPlayerId = endingPlayer?.id || null;
    const didPass = pendingPassPlayerId === endingPlayerId;

    if (industry?.expireStrategyPlayInteractionOnTurnEnd?.(endingPlayer, turnState.roundNumber)?.cleared) {
      renderInitialSelectionArea();
    }

    endEffectHistoryStep();
    commitActionLogDraft({
      passed: didPass,
      actionType: didPass ? "pass" : actionHistory.getSessionInfo()?.actionType,
      actionLabel: didPass ? "PASS" : actionHistory.getSessionInfo()?.label,
    });
    actionHistory.commitSession();
    clearHistoryStepOrderForSource(HISTORY_SOURCE_MAIN);
    if (quickActionHistory.hasSession()) {
      quickActionHistory.commitSession();
      clearHistoryStepOrderForSource(HISTORY_SOURCE_QUICK);
    }
    clearActionEffectFlow();
    clearActionPending();
    const advanceResult = advanceTurnAfterPlayerAction(endingPlayerId, { passed: didPass });
    const nextPlayer = getCurrentPlayer();
    selectDefaultRocketForCurrentPlayer();
    renderDebugPlayerSwitch();
    renderRoundStatus();
    rocketState.statusNote = advanceResult.roundAdvanced
      ? `所有玩家已 PASS，进入第 ${turnState.roundNumber} 轮第 ${turnState.turnNumber} 回合，当前玩家：${nextPlayer?.colorLabel || ""}玩家`
      : advanceResult.turnAdvanced
        ? `进入第 ${turnState.roundNumber} 轮第 ${turnState.turnNumber} 回合，当前玩家：${nextPlayer?.colorLabel || ""}玩家`
        : `回合已结束，当前玩家：${nextPlayer?.colorLabel || ""}玩家`;
    renderPlayerStats();
    renderTechBoard();
    renderRockets();
    renderPublicCards();
    renderReservedCards();
    updatePublicCardControls();
    updateActionButtons();
    renderStateReadout();
    refreshLatestActionLogRecoverySnapshot("回合结束后状态");
  }

  function undoPendingAction() {
    if (isTechActionSelectionActive()) {
      cancelTechSelection();
      return;
    }
    if (
      !pendingActionExecuted
      && !isActionEffectFlowActive()
      && !quickActionHistory.hasUndoableStep()
    ) return;

    if (hasActivePendingSubFlow()) {
      cancelActivePendingSubFlows();
      refreshAfterHistoryChange();
      return;
    }

    const latestUndoSource = getLatestUndoSource();

    if (latestUndoSource === HISTORY_SOURCE_QUICK) {
      const result = quickActionHistory.undoLastStep();
      if (result.ok) {
        forgetLastHistoryStep(HISTORY_SOURCE_QUICK, result.step?.id || null);
        removeLastActionLogStep(HISTORY_SOURCE_QUICK, result.step?.id || null);
      }
      if (result.ok && !quickActionHistory.hasUndoableStep()) {
        quickActionHistory.commitSession();
        clearHistoryStepOrderForSource(HISTORY_SOURCE_QUICK);
      }
      refreshAfterHistoryChange(result.ok ? result.message : "已撤销快速行动");
      return;
    }

    if (!latestUndoSource && pendingActionHasIrreversibleBarrier) {
      rocketState.statusNote = pendingActionIrreversibleReason
        ? `不可撤销：${pendingActionIrreversibleReason}`
        : "当前行动已有不可撤销影响";
      updateActionButtons();
      renderStateReadout();
      return;
    }

    if (pendingActionHasIrreversibleBarrier && !actionHistory.hasUndoableStep()) {
      rocketState.statusNote = pendingActionIrreversibleReason
        ? `不可撤销：${pendingActionIrreversibleReason}`
        : "当前行动已有不可撤销影响";
      updateActionButtons();
      renderStateReadout();
      return;
    }

    if (
      latestUndoSource === HISTORY_SOURCE_MAIN
      && pendingActionHasIrreversibleBarrier
      && actionHistory.hasUndoableStep()
    ) {
      const result = actionHistory.undoLastStep();
      if (result.ok) {
        forgetLastHistoryStep(HISTORY_SOURCE_MAIN, result.step?.id || null);
        removeLastActionLogStep(HISTORY_SOURCE_MAIN, result.step?.id || null);
        revertEffectFlowAfterUndo(result.step);
      }
      refreshAfterHistoryChange(result.ok ? result.message : result.message || "当前行动不能撤销");
      return;
    }

    if (isActionEffectFlowActive()) {

      if (actionHistory.hasUndoableStep()) {
        const result = actionHistory.undoLastStep();
        if (result.ok) {
          forgetLastHistoryStep(HISTORY_SOURCE_MAIN, result.step?.id || null);
          removeLastActionLogStep(HISTORY_SOURCE_MAIN, result.step?.id || null);
          revertEffectFlowAfterUndo(result.step);
          refreshAfterHistoryChange(result.message);
          if (!isActionEffectFlowActive()) {
            actionHistory.commitSession();
            clearHistoryStepOrderForSource(HISTORY_SOURCE_MAIN);
            clearActionPending();
          }
          return;
        }
      }
    }

    if (pendingActionExecuted || actionHistory.hasSession()) {
      const result = actionHistory.rollbackSession();
      if (result.ok) {
        effectStepActive = false;
        clearHistoryStepOrderForSource(HISTORY_SOURCE_MAIN);
        removeActionLogStepsBySource(HISTORY_SOURCE_MAIN);
        clearActionEffectFlow();
        clearActionPending();
      }
      refreshAfterHistoryChange(result.ok ? result.message : result.message || "当前行动不能撤销");
    }
  }

  let moveArrowRenderFrame = 0;

  function getMoveArrowDirectionRotation(angleDegrees, kind) {
    const rad = angleDegrees * (Math.PI / 180);
    let dx;
    let dy;
    if (kind === "out") {
      dx = Math.cos(rad);
      dy = Math.sin(rad);
    } else if (kind === "in") {
      dx = -Math.cos(rad);
      dy = -Math.sin(rad);
    } else if (kind === "cw") {
      dx = -Math.sin(rad);
      dy = Math.cos(rad);
    } else {
      dx = Math.sin(rad);
      dy = -Math.cos(rad);
    }
    return Math.atan2(dy, dx) * (180 / Math.PI);
  }

  function getRocketPolarAnchor(rocket) {
    const sector = rocketActions.getRocketSectorCoordinate(rocket);
    if (!sector) return null;

    const radius = Number(rocket.radius);
    const angleDegrees = Number(rocket.angleDegrees);
    if (Number.isFinite(radius) && Number.isFinite(angleDegrees)) {
      return { sector, radius, angleDegrees };
    }

    if (Number.isInteger(rocket.slotIndex)) {
      const slot = solar.getSectorLaunchSlot(sector.x, sector.y, rocket.slotIndex);
      return {
        sector,
        radius: slot.radius,
        angleDegrees: slot.angleDegrees,
      };
    }

    const boardPoint = getBoardPointFromPolarPoint(rocket);
    const polar = solar.globalPointToPolarPoint(boardPoint);
    return {
      sector,
      radius: polar.radius,
      angleDegrees: polar.angleDegrees,
    };
  }

  function getMoveArrowOffsets(anchor) {
    const boundary = solar.getSectorCoordinateBoundary(anchor.sector.x, anchor.sector.y);
    const radialSpan = boundary.polarBoundary.outerRadius - boundary.polarBoundary.innerRadius;
    const angleSpan = Math.abs(
      boundary.polarBoundary.endAngleDegrees - boundary.polarBoundary.startAngleDegrees,
    );

    const boardSize = solar.GLOBAL_COORDINATE_SYSTEM.size;
    const wheelPx = Math.max(1, els.wheelWrap?.clientWidth || boardSize);
    const rocketHalfPx = ((tokenWidths.rocket || 41) * 1.2) / 2;
    const arrowHalfPx = 15;
    const clearanceBoard = (rocketHalfPx + arrowHalfPx + 6) * (boardSize / wheelPx);

    const radialOffset = Math.max(30, radialSpan * 0.42) + clearanceBoard * 0.7;
    const tangentialAngle = Math.max(
      11,
      angleSpan * 0.2,
      (Math.atan(clearanceBoard / Math.max(anchor.radius, 1)) * 180) / Math.PI,
    );

    return {
      radius: radialOffset,
      angle: tangentialAngle,
    };
  }

  function buildMoveArrowSpecs(rocket) {
    const anchor = getRocketPolarAnchor(rocket);
    if (!anchor) return [];

    const { sector, radius, angleDegrees } = anchor;
    const offsets = getMoveArrowOffsets(anchor);
    const size = solar.GLOBAL_COORDINATE_SYSTEM.size;
    const specs = [];

    const push = (kind, deltaX, deltaY, pointRadius, pointAngle) => {
      const board = solar.polarToGlobalPoint(pointRadius, pointAngle);
      const labels = {
        out: "向外移动一个扇区",
        in: "向内移动一个扇区",
        cw: "顺时针移动",
        ccw: "逆时针移动",
      };
      specs.push({
        kind,
        deltaX,
        deltaY,
        left: `${(board.x / size) * 100}%`,
        top: `${(board.y / size) * 100}%`,
        rotation: getMoveArrowDirectionRotation(pointAngle, kind),
        ariaLabel: labels[kind],
      });
    };

    if (sector.y < rocketActions.SECTOR_RING_MAX) {
      push("out", 0, 1, radius + offsets.radius, angleDegrees);
    }
    if (sector.y > rocketActions.SECTOR_RING_MIN) {
      push("in", 0, -1, radius - offsets.radius, angleDegrees);
    }
    push("cw", 1, 0, radius, angleDegrees + offsets.angle);
    push("ccw", -1, 0, radius, angleDegrees - offsets.angle);
    return specs;
  }

  function scheduleRenderMoveArrows() {
    moveArrowRenderFrame += 1;
    const frameId = moveArrowRenderFrame;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (frameId !== moveArrowRenderFrame) return;
        renderMoveArrows();
      });
    });
  }

  function renderMoveArrows() {
    if (!els.moveArrowLayer) return;

    if (moveHighlightRocketId == null) {
      moveArrowRenderFrame += 1;
      els.moveArrowLayer.hidden = true;
      els.moveArrowLayer.replaceChildren();
      return;
    }

    const rocket = rocketState.rockets.find((item) => item.id === moveHighlightRocketId);
    if (!rocket || !(rocketActions.isMovablePlayerToken?.(rocket) || rocketActions.isControllablePlayerRocket(rocket))) {
      deactivateMoveMode();
      return;
    }

    const specs = buildMoveArrowSpecs(rocket);
    els.moveArrowLayer.hidden = false;
    els.moveArrowLayer.replaceChildren(...specs.map((spec) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `move-arrow-button move-arrow-${spec.kind}`;
      button.dataset.moveX = String(spec.deltaX);
      button.dataset.moveY = String(spec.deltaY);
      button.style.left = spec.left;
      button.style.top = spec.top;
      button.style.setProperty("--move-arrow-rotation", `${spec.rotation}deg`);
      button.setAttribute("aria-label", spec.ariaLabel);
      button.title = spec.ariaLabel;
      button.innerHTML = '<span class="move-arrow-glyph" aria-hidden="true"></span>';
      return button;
    }));
  }

  function syncMoveModeChrome() {
    els.appWrap?.classList.toggle("move-mode-active", moveHighlightRocketId != null);
    syncInteractionFocusChrome();
    renderRockets();
  }

  function updateMoveRocketHighlight(rocketId) {
    const previousId = moveHighlightRocketId;
    moveHighlightRocketId = rocketId;

    if (previousId != null && previousId !== rocketId) {
      const previousRocket = rocketState.rockets.find((item) => item.id === previousId);
      if (previousRocket) renderRocketElement(previousRocket);
    }

    if (rocketId != null) {
      const rocket = rocketState.rockets.find((item) => item.id === rocketId);
      if (rocket) renderRocketElement(rocket);
    }

    syncMoveModeChrome();
    scheduleRenderMoveArrows();
  }

  function clearMoveRocketHighlight() {
    updateMoveRocketHighlight(null);
  }

  function activateMoveMode(rocketId) {
    if (!Number.isInteger(rocketId) || rocketId <= 0) return false;

    const currentPlayer = getCurrentPlayer();
    const rocketsForPlayer = getMovableTokensForPlayer(currentPlayer.id);
    if (!rocketsForPlayer.some((rocket) => rocket.id === rocketId)) return false;

    rocketActions.setActiveRocket(rocketState, rocketId);
    updateMoveRocketHighlight(rocketId);
    renderStateReadout();
    return true;
  }

  function deactivateMoveMode() {
    if (isMovePaymentSelectionActive()) {
      cancelMovePaymentSelection();
    }
    clearMoveRocketHighlight();
    renderRockets();
  }

  function setQuickActionButtonEnabled(enabled, reason) {
    els.actionQuickButton.disabled = !enabled;
    els.actionQuickButton.title = enabled ? "" : (reason || "当前无法执行此行动");
    els.actionQuickButton.setAttribute("aria-disabled", String(!enabled));
    els.actionQuickButton.classList.add("action-button-ready");
  }

  function updateTurnActionButtons() {
    const pendingBlockedReason = "请先回合结束或撤销当前行动";
    const effectBlockedReason = "请先完成当前行动的效果";

    if (isTechTilePickingActive()) {
      setTurnActionButtonState(els.actionPassButton, false);
      setTurnActionButtonState(els.actionConfirmButton, false);
      setTurnActionButtonState(els.actionUndoButton, true, false);
      return "请先选择科技或点击取消";
    }

    if (isActionEffectFlowActive()) {
      setTurnActionButtonState(els.actionPassButton, false);
      setTurnActionButtonState(els.actionConfirmButton, false);
      setTurnActionButtonState(
        els.actionUndoButton,
        quickActionHistory.hasUndoableStep() || canUndoCurrentMainAction(),
        false,
      );
      return effectBlockedReason;
    }

    if (pendingActionExecuted) {
      setTurnActionButtonState(els.actionPassButton, false);
      setTurnActionButtonState(els.actionConfirmButton, true, true);
      setTurnActionButtonState(
        els.actionUndoButton,
        quickActionHistory.hasUndoableStep() || canUndoCurrentMainAction(),
        !pendingActionHasIrreversibleBarrier,
      );
      return pendingBlockedReason;
    }

    setTurnActionButtonState(els.actionPassButton, canStartMainAction());
    setTurnActionButtonState(els.actionConfirmButton, false);
    setTurnActionButtonState(els.actionUndoButton, quickActionHistory.hasUndoableStep());
    return null;
  }

  function updateActionButtons() {
    const context = createActionContext();
    const gameplayLockReason = getGameplayLockReason();
    if (gameplayLockReason) {
      lockAllActionButtons(gameplayLockReason);
      return;
    }

    const techSelectionLocked = isTechTilePickingActive();
    const cardSelectionLocked = isCardSelectionActive();
    const discardSelectionLocked = isDiscardSelectionActive();
    const playCardSelectionLocked = isPlayCardSelectionActive();
    const movePaymentLocked = isMovePaymentSelectionActive();
    const handScanLocked = isHandScanSelectionActive();
    const effectFlowLocked = isActionEffectFlowActive();
    const pendingSubFlowLocked = hasActivePendingSubFlow();
    const selectionBlockReason = techSelectionLocked
      ? "请先选择科技或点击取消"
      : handScanLocked
        ? "请先完成手牌扫描或点击取消"
        : movePaymentLocked
          ? "请先确认或取消移动"
          : playCardSelectionLocked
            ? "请先打出或点击取消"
            : discardSelectionLocked
              ? "请先完成弃牌或点击取消"
              : "请先完成精选或点击取消";

    const pendingBlockedReason = updateTurnActionButtons();
    const effectBlockedReason = effectFlowLocked ? "请先完成当前行动的效果" : pendingBlockedReason;

    if (techSelectionLocked || discardSelectionLocked || playCardSelectionLocked || movePaymentLocked) {
      setActionButtonState(els.actionLaunchButton, false, selectionBlockReason);
      setActionButtonState(els.actionOrbitButton, false, selectionBlockReason);
      setActionButtonState(els.actionLandButton, false, selectionBlockReason);
      setActionButtonState(els.actionScanButton, false, selectionBlockReason);
      setActionButtonState(els.actionAnalyzeButton, false, selectionBlockReason);
      setActionButtonState(els.actionPlayCardButton, false, selectionBlockReason);
      setActionButtonState(els.actionResearchTechButton, false, selectionBlockReason);
      setQuickActionButtonEnabled(false, selectionBlockReason);
      updateQuickPanel();
      renderActionEffectBar();
      return;
    }

    if (cardSelectionLocked || handScanLocked) {
      setActionButtonState(els.actionLaunchButton, false, effectBlockedReason || selectionBlockReason);
      setActionButtonState(els.actionOrbitButton, false, effectBlockedReason || selectionBlockReason);
      setActionButtonState(els.actionLandButton, false, effectBlockedReason || selectionBlockReason);
      setActionButtonState(els.actionScanButton, false, effectBlockedReason || selectionBlockReason);
      setActionButtonState(els.actionAnalyzeButton, false, effectBlockedReason || selectionBlockReason);
      setActionButtonState(els.actionPlayCardButton, false, effectBlockedReason || selectionBlockReason);
      setActionButtonState(els.actionResearchTechButton, false, effectBlockedReason || selectionBlockReason);
      setQuickActionButtonEnabled(false, effectBlockedReason || selectionBlockReason);
      updateQuickPanel();
      renderActionEffectBar();
      return;
    }

    if (pendingSubFlowLocked) {
      const subFlowReason = "请先完成或取消当前流程";
      setActionButtonState(els.actionLaunchButton, false, subFlowReason);
      setActionButtonState(els.actionOrbitButton, false, subFlowReason);
      setActionButtonState(els.actionLandButton, false, subFlowReason);
      setActionButtonState(els.actionScanButton, false, subFlowReason);
      setActionButtonState(els.actionAnalyzeButton, false, subFlowReason);
      setActionButtonState(els.actionPlayCardButton, false, subFlowReason);
      setActionButtonState(els.actionResearchTechButton, false, subFlowReason);
      setQuickActionButtonEnabled(false, subFlowReason);
      updateQuickPanel();
      renderActionEffectBar();
      return;
    }

    if (effectFlowLocked || pendingActionExecuted) {
      setActionButtonState(els.actionLaunchButton, false, pendingBlockedReason);
      setActionButtonState(els.actionOrbitButton, false, pendingBlockedReason);
      setActionButtonState(els.actionLandButton, false, pendingBlockedReason);
      setActionButtonState(els.actionScanButton, false, pendingBlockedReason);
      setActionButtonState(els.actionAnalyzeButton, false, pendingBlockedReason);
      setActionButtonState(els.actionPlayCardButton, false, pendingBlockedReason);
      setActionButtonState(els.actionResearchTechButton, false, pendingBlockedReason);
      setQuickActionButtonEnabled(!isInitialIncomeFlowActive(), pendingBlockedReason);
      updateQuickPanel();
      renderActionEffectBar();
      return;
    }

    const launchCheck = actions.canExecute("launch", context);
    const orbitCheck = actions.canExecute("orbit", context);
    const landCheck = actions.canExecute("land", context);
    const researchTechCheck = actions.canExecute("researchTech", context);
    const analyzeCheck = data.canAnalyzeData(getCurrentPlayer());
    const scanCheck = scanEffects.canExecuteScan(getCurrentPlayer());
    const currentPlayer = getCurrentPlayer();
    const canPlayCard = Boolean(currentPlayer?.hand?.length);

    setActionButtonState(els.actionLaunchButton, launchCheck.ok, launchCheck.message);
    setActionButtonState(els.actionOrbitButton, orbitCheck.ok, orbitCheck.message);
    setActionButtonState(els.actionLandButton, landCheck.ok, landCheck.message);
    setActionButtonState(els.actionScanButton, scanCheck.ok, scanCheck.message);
    setActionButtonState(els.actionAnalyzeButton, analyzeCheck.ok, analyzeCheck.message);
    setActionButtonState(els.actionPlayCardButton, canPlayCard, canPlayCard ? "" : "没有手牌可打出");
    setActionButtonState(els.actionResearchTechButton, researchTechCheck.ok, researchTechCheck.message);
    setQuickActionButtonEnabled(true);
    updateQuickPanel();
    renderActionEffectBar();
  }

  function isQuickPanelOpen() {
    return !els.quickActionsPanel.hidden;
  }

  function setQuickPanelOpen(open) {
    if (open && getGameplayLockReason()) return;
    if (open) cancelCardCornerQuickAction({ silent: true });
    els.quickActionsPanel.hidden = !open;
    els.actionQuickButton.setAttribute("aria-expanded", String(open));
    els.actionQuickButton.classList.add("action-button-ready");
    if (open) updateQuickPanel();
  }

  function toggleQuickPanel() {
    setQuickPanelOpen(!isQuickPanelOpen());
  }

  function updateQuickTradeButtons() {
    const context = createActionContext();
    els.quickActionsTrades.querySelectorAll("[data-quick-trade]").forEach((button) => {
      const tradeId = button.dataset.quickTrade;
      const check = quickTrades.canExecuteTrade(tradeId, context);
      button.disabled = !check.ok;
      button.title = check.ok ? "" : (check.message || "当前无法兑换");
    });
  }

  function closeDataPlacePicker() {
    if (!els.dataPlaceOverlay) return;
    els.dataPlaceOverlay.hidden = true;
  }

  function shouldPromptDataPlaceChoice(choices) {
    return abilities.data.needsPlacementChoice(choices);
  }

  function openDataPlacePicker() {
    if (!els.dataPlaceOverlay || !els.dataPlaceActions) return;

    const player = getCurrentPlayer();
    const choiceResult = abilities.data.listPlacementChoices(player);
    if (!choiceResult.ok) {
      rocketState.statusNote = choiceResult.message;
      renderStateReadout();
      return;
    }

    const choices = choiceResult.choices;
    if (!shouldPromptDataPlaceChoice(choices)) {
      const [choice] = choices;
      confirmDataPlacement(choice.target, choice.blueSlot);
      return;
    }

    if (els.dataPlaceSubtitle) {
      els.dataPlaceSubtitle.textContent = "请选择将数据放入第一排，或放入满足条件的蓝色科技下方。";
    }

    els.dataPlaceActions.replaceChildren(...choices.map((choice) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "data-place-option-button";
      button.dataset.placeTarget = choice.target;
      if (choice.blueSlot != null) {
        button.dataset.blueSlot = String(choice.blueSlot);
      }
      button.innerHTML = `${choice.label}<small>${choice.description}</small>`;
      return button;
    }));

    els.dataPlaceOverlay.hidden = false;
  }

  function confirmDataPlacement(target, blueSlot) {
    closeDataPlacePicker();
    const blocked = blockIncompatiblePendingQuickAction("place-data");
    if (blocked) return blocked;
    const player = getCurrentPlayer();
    const result = abilities.executeAbility("placeData", createActionContext(), {
      target,
      blueSlot,
    });
    rocketState.statusNote = result.message;
    if (result.ok) {
      const bonusResult = recordPlaceDataActionHistory(player, result);
      if (bonusResult?.message && !bonusResult.pendingIncome) {
        rocketState.statusNote = `${result.message}（${bonusResult.message}）`;
      } else if (bonusResult?.pendingIncome) {
        rocketState.statusNote = `${result.message}，请选择 1 张手牌获得收入`;
      } else if (bonusResult?.ok === false && bonusResult.message) {
        rocketState.statusNote = `${result.message}（${bonusResult.message}）`;
      }
    }
    renderPlayerStats();
    updateActionButtons();
    renderStateReadout();
    return result;
  }

  function updateQuickPanel() {
    if (!isQuickPanelOpen()) return;
    updateQuickTradeButtons();
  }

  function runPlaceDataToComputer() {
    const blocked = blockIncompatiblePendingQuickAction("place-data");
    if (blocked) return blocked;

    const gameplayLockReason = getGameplayLockReason();
    if (gameplayLockReason) {
      rocketState.statusNote = gameplayLockReason;
      renderStateReadout();
      return { ok: false, message: gameplayLockReason };
    }

    if (isTechTilePickingActive()) {
      rocketState.statusNote = "请先完成科技选择";
      renderStateReadout();
      return { ok: false, message: rocketState.statusNote };
    }
    if (isCardSelectionActive()) {
      rocketState.statusNote = "请先完成精选";
      renderStateReadout();
      return { ok: false, message: rocketState.statusNote };
    }
    if (isDiscardSelectionActive()) {
      rocketState.statusNote = "请先完成弃牌";
      renderStateReadout();
      return { ok: false, message: rocketState.statusNote };
    }
    if (isPlayCardSelectionActive()) {
      rocketState.statusNote = "请先完成打牌";
      renderStateReadout();
      return { ok: false, message: rocketState.statusNote };
    }
    if (isMovePaymentSelectionActive()) {
      rocketState.statusNote = "请先完成移动";
      renderStateReadout();
      return { ok: false, message: rocketState.statusNote };
    }

    openDataPlacePicker();
    return { ok: true };
  }

  function analyzeDataForCurrentPlayer() {
    return runAction("analyze");
  }

  function runQuickTrade(tradeId) {
    const blocked = blockIncompatiblePendingQuickAction("quick-trade");
    if (blocked) return blocked;

    const gameplayLockReason = getGameplayLockReason();
    if (gameplayLockReason) {
      rocketState.statusNote = gameplayLockReason;
      renderStateReadout();
      return { ok: false, message: gameplayLockReason };
    }

    const player = getCurrentPlayer();
    const beforeState = historyCommands.captureTradeState(player, cardState);
    const result = quickTrades.executeTrade(tradeId, createActionContext());
    if (!result.ok) {
      rocketState.statusNote = result.message;
      renderPlayerStats();
      updateActionButtons();
      renderStateReadout();
      return result;
    }

    if (result.awaitingDiscard) {
      if (pendingDiscardAction) {
        pendingDiscardAction.beforeTradeState = beforeState;
      }
      rocketState.statusNote = result.message;
      renderStateReadout();
      return result;
    }

    if (result.awaitingCardSelection) {
      if (pendingCardSelectionAction) {
        pendingCardSelectionAction.beforeTradeState = beforeState;
      }
      rocketState.statusNote = result.message;
      renderStateReadout();
      return result;
    }

    recordQuickTradeCompletion(tradeId, player, beforeState);
    rocketState.statusNote = result.message;
    renderPlayerStats();
    renderPublicCards();
    updatePublicCardControls();
    updateActionButtons();
    renderStateReadout();
    return result;
  }

  function runAction(actionId, actionOptions) {
    if (!canStartMainAction()) {
      rocketState.statusNote = "本回合已经开始或完成主要行动";
      renderStateReadout();
      return { ok: false, message: rocketState.statusNote };
    }

    const abilityByAction = {
      launch: "launchProbe",
      orbit: "orbitProbe",
      land: "landProbe",
      analyze: "analyzeData",
    };
    const abilityId = abilityByAction[actionId];
    const result = abilityId
      ? abilities.executeAbility(abilityId, createActionContext(), actionOptions)
      : actionId === "researchTech"
        ? abilities.executeAbility("researchTechPrepare", createActionContext(), actionOptions)
        : actions.execute(actionId, createActionContext(), actionOptions);

    let startedRewardFlow = false;

    if (result.ok && result.markerKind) {
      if (result.removedRocketId != null) removeRocketElement(result.removedRocketId);
      syncPlanetOrbitLandMarkers();
      renderAlienPanels();
      if (actionId === "orbit" || actionId === "land") {
        startedRewardFlow = startPlanetRewardEffectFlow(actionId, result);
      }
    } else if (actionId === "researchTech") {
      if (result.awaitingTileSelection) {
        rocketState.statusNote = result.message;
        startResearchTechEffectFlow(result);
        syncTechSelectionChrome();
        renderTechBoard();
        updateActionButtons();
      } else if (result.tileId) {
        rocketState.statusNote = result.message;
        finalizeTechTakeResult(result);
        return result;
      } else if (!result.ok) {
        rocketState.statusNote = result.message;
      }
    } else {
      if (result.rocket) renderRocketElement(result.rocket);
      if (result.removedRocketId != null) removeRocketElement(result.removedRocketId);
    }

    if (result.ok && !result.awaitingTileSelection && !startedRewardFlow) {
      if (actionId === "launch") {
        maybeApplyIndustryLaunchScan(result);
      }
      if (abilityId && result.undoable !== false) {
        recordAtomicActionHistory(actionId, result.message || actionId, result);
      } else {
        markActionPending();
      }
      settleCardTasksAfterEffect({ events: result.events, render: false });
    }

    renderPlayerStats();
    updateActionButtons();
    renderStateReadout();
    return result;
  }

  function getRocketCoordinateReadoutLines() {
    const activeRocket = rocketState.rockets.find((rocket) => rocket.id === rocketState.activeRocketId);
    const formatRocketLine = (rocket) => {
      const marker = rocket.id === rocketState.activeRocketId ? "*" : " ";
      const snapshot = createRocketSnapshot(rocket);
      const color = getRocketColorDefinition(rocket);
      if (snapshot.surface === ROCKET_SURFACE.PLANETS_REFERENCE) {
        return `${marker}${formatRocketLabel(rocket)} ${color.label} ${formatPlanetsReferencePoint(snapshot.planetsReference)}`;
      }

      const slot = snapshot.slotSectorCoordinate
        ? ` 扇区[${snapshot.slotSectorCoordinate.x},${snapshot.slotSectorCoordinate.y}]#${snapshot.slotIndex}`
        : snapshot.sectorCoordinate
          ? ` -> ${formatSectorCoordinate(snapshot)}`
        : "";
      return `${marker}${formatRocketLabel(rocket)} ${color.label} ${formatPolarPoint(snapshot.polar)} ${formatBoardPoint(snapshot.board)}${slot}`;
    };
    const occupancy = rocketActions.getSectorOccupancy(rocketState);
    const occupancyLines = occupancy.size
      ? [...occupancy.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, slots]) => {
          const indices = [...slots.keys()].sort((a, b) => a - b).join(",");
          return `扇区[${key}] 占用#${indices}`;
        })
      : ["无"];

    return [
      "火箭坐标",
      `火箭坐标系 polar board-${solar.GLOBAL_COORDINATE_SYSTEM.size}`,
      activeRocket ? `当前 ${formatRocketLine(activeRocket).replace(/^[* ]/, "")}` : "当前 无",
      rocketState.statusNote ? `提示 ${rocketState.statusNote}` : "提示 无",
      "",
      "扇区占用",
      ...occupancyLines,
    ];
  }

  function getDefaultPlanetReferencePlacementLines() {
    const slots = planetReferenceLayout.listAllOrbitLandSlots();
    if (!slots.length) {
      return [
        "星球环绕/登陆槽位",
        "无",
      ];
    }

    const visibleMarkers = new Map();
    for (const planetId of planetReferenceLayout.PLANET_ORDER) {
      for (const marker of planetStats.getPlanetOrbitMarkers(planetStatsState, planetId)) {
        visibleMarkers.set(`${planetId}:orbit:${marker.sequence}`, marker);
      }
      for (const marker of planetStats.getPlanetLandingMarkers(planetStatsState, planetId)) {
        visibleMarkers.set(`${planetId}:land:${marker.sequence}`, marker);
      }
    }

    return [
      "星球环绕/登陆槽位",
      ...slots.map((slot) => {
        const reference = rocketActions.normalizePlanetsReferencePoint({
          x: slot.x,
          y: slot.y,
          width: PLANETS_REFERENCE_SIZE.width,
          height: PLANETS_REFERENCE_SIZE.height,
        });
        const angle = slot.angleOffsetDegrees == null ? "" : ` +${slot.angleOffsetDegrees}°`;
        const marker = visibleMarkers.get(`${slot.planetId}:${slot.kind}:${slot.sequence}`);
        const status = marker
          ? `已显示 ${players.getPlayerColorDefinition(marker.color).label}`
          : "未显示";
        return `${planetReferenceLayout.formatSlotLabel(slot)}${angle} ${formatPlanetsReferencePoint(reference)} ${status}`;
      }),
    ];
  }

  function getDefaultSatelliteReferencePlacementLines() {
    const satellites = planetReferenceLayout.SATELLITE_PLACEMENTS;
    if (!satellites.length) {
      return [
        "卫星登陆槽位",
        "无",
      ];
    }

    const landedMarkers = new Map();
    for (const planetId of planetReferenceLayout.PLANETS_WITH_SATELLITES) {
      for (const marker of planetStats.getSatelliteLandingMarkers(planetStatsState, planetId)) {
        landedMarkers.set(`${planetId}:${marker.satelliteId}`, marker);
      }
    }

    return [
      "卫星登陆槽位",
      ...satellites.map((satellite) => {
        const reference = rocketActions.normalizePlanetsReferencePoint({
          x: satellite.x,
          y: satellite.y,
          width: PLANETS_REFERENCE_SIZE.width,
          height: PLANETS_REFERENCE_SIZE.height,
        });
        const marker = landedMarkers.get(`${satellite.parentPlanetId}:${satellite.satelliteId}`);
        const status = marker
          ? `已显示 ${players.getPlayerColorDefinition(marker.color).label}`
          : "未显示";
        return `${planetReferenceLayout.formatSatelliteLabel(satellite)} ${formatPlanetsReferencePoint(reference)} ${status}`;
      }),
    ];
  }

  function closeLandTargetPicker() {
    pendingLandTargetAction = null;
    if (!els.landTargetOverlay) return;
    els.landTargetOverlay.hidden = true;
    delete els.landTargetOverlay.dataset.planetId;
  }

  function cancelLandTargetPicker() {
    const pending = pendingLandTargetAction;
    closeLandTargetPicker();
    if (typeof pending?.onCancel === "function") {
      pending.onCancel();
    }
  }

  function openLandTargetPicker(options) {
    if (!els.landTargetOverlay || !els.landTargetSelect) {
      const choice = options.choices?.[0] || { target: options.defaultTarget };
      if (typeof options.onConfirm === "function") {
        return options.onConfirm(choice, options);
      }
      runAction("land", { target: choice.target });
      return;
    }

    pendingLandTargetAction = typeof options.onConfirm === "function"
      ? {
        getOptions: options.getOptions,
        onConfirm: options.onConfirm,
        onCancel: options.onCancel,
      }
      : null;
    els.landTargetTitle.textContent = `选择登陆目标：${options.planet.name}`;
    els.landTargetSelect.replaceChildren(...options.choices.map((choice, index) => {
      const option = document.createElement("option");
      option.value = String(index);
      option.textContent = choice.label;
      return option;
    }));
    els.landTargetOverlay.dataset.planetId = options.planet.planetId;
    els.landTargetOverlay.hidden = false;
    els.landTargetSelect.focus();
  }

  function confirmLandTargetPicker() {
    const pending = pendingLandTargetAction;
    const choiceIndex = Number(els.landTargetSelect?.value);
    const options = typeof pending?.getOptions === "function"
      ? pending.getOptions()
      : actions.getLandOptions(createActionContext());
    if (!options.ok || !options.choices?.length) {
      closeLandTargetPicker();
      rocketState.statusNote = options.message || "登陆目标已失效";
      renderStateReadout();
      return;
    }

    const choice = options.choices[choiceIndex] || options.choices[0];
    closeLandTargetPicker();
    if (typeof pending?.onConfirm === "function") {
      return pending.onConfirm(choice, options);
    }
    runAction("land", { target: choice.target });
  }

  function launchRocketForCurrentPlayer() {
    runAction("launch");
  }

  function orbitForCurrentPlayer() {
    runAction("orbit");
  }

  function landForCurrentPlayer() {
    if (!canStartMainAction()) {
      rocketState.statusNote = "本回合已经开始或完成主要行动";
      renderStateReadout();
      return { ok: false, message: rocketState.statusNote };
    }
    const context = createActionContext();
    const check = actions.canExecute("land", context);
    if (!check.ok) {
      rocketState.statusNote = check.message;
      renderPlayerStats();
      updateActionButtons();
      renderStateReadout();
      return { ok: false, message: check.message };
    }

    const options = actions.getLandOptions(context);
    if (!options.ok) {
      rocketState.statusNote = options.message;
      renderPlayerStats();
      updateActionButtons();
      renderStateReadout();
      return { ok: false, message: options.message };
    }

    if (options.needsChoice) {
      openLandTargetPicker(options);
      return { ok: true, pendingChoice: true, planetId: options.planet.planetId };
    }

    return runAction("land", { target: options.defaultTarget });
  }

  function addDebugIncome() {
    const currentPlayer = getCurrentPlayer();
    players.gainResources(currentPlayer, {
      credits: 100,
      energy: 100,
      publicity: 10,
      additionalPublicScan: 2,
    });
    for (let index = 0; index < players.RESOURCE_LIMITS.availableData; index += 1) {
      data.gainData(currentPlayer, { source: "debug" });
    }
    rocketState.statusNote = "调试收入 +100信用点 +100能量 +10宣传 +2额外公共扫描 +6数据";
    renderPlayerStats();
    updateActionButtons();
    renderStateReadout();
    return { ok: true, player: currentPlayer, message: rocketState.statusNote };
  }

  function executeIncomeForCurrentPlayer() {
    const currentPlayer = getCurrentPlayer();
    const income = currentPlayer.income || players.DEFAULT_INCOME;
    const resourceIncome = {
      credits: income.credits || 0,
      energy: income.energy || 0,
      publicity: income.publicity || 0,
      availableData: income.availableData || 0,
      additionalPublicScan: income.additionalPublicScan || 0,
    };
    const cardCount = Math.max(0, Math.round(income.handSize || 0));
    const drawnCards = [];
    let drawError = null;

    players.gainResources(currentPlayer, resourceIncome);

    for (let index = 0; index < cardCount; index += 1) {
      const drawResult = blindDrawCardForPlayer(currentPlayer);
      if (!drawResult.ok) {
        drawError = drawResult.message || "收入抽牌失败";
        break;
      }
      drawnCards.push(drawResult.card);
    }

    const summary = [
      `信用点+${resourceIncome.credits}`,
      `能量+${resourceIncome.energy}`,
      `手牌+${drawnCards.length}${drawError ? `/${cardCount}` : ""}`,
      `宣传+${resourceIncome.publicity}`,
      `数据+${resourceIncome.availableData}`,
      `额外公共扫描+${resourceIncome.additionalPublicScan}`,
    ].join("、");

    rocketState.statusNote = drawError
      ? `执行收入（调试，可能重复发放）：${summary}，${drawError}`
      : `执行收入（调试，可能重复发放）：${summary}`;
    renderPlayerStats();
    renderPublicCards();
    updatePublicCardControls();
    updateActionButtons();
    renderStateReadout();

    return {
      ok: !drawError,
      income: { ...income },
      drawnCards,
      message: rocketState.statusNote,
    };
  }

  function addDebugData() {
    const currentPlayer = getCurrentPlayer();
    const result = data.gainData(currentPlayer, { source: "debug" });
    rocketState.statusNote = result.message;
    renderPlayerStats();
    updateActionButtons();
    renderStateReadout();
    return result;
  }

  function addDebugScore() {
    const currentPlayer = getCurrentPlayer();
    players.gainResources(currentPlayer, { score: 20 });
    rocketState.statusNote = `${currentPlayer.colorLabel}玩家调试分数 +20`;
    renderPlayerStats();
    updateActionButtons();
    renderStateReadout();
    return { ok: true, player: currentPlayer, message: rocketState.statusNote };
  }

  function revealJiuzheForDebug() {
    if (!jiuzhe) return { ok: false, message: "九折模块未加载" };
    const currentPlayer = getCurrentPlayer();
    const alienSlotId = 1;
    const slot = aliens.getAlienSlot(alienGameState, alienSlotId);
    if (!slot) return { ok: false, message: "找不到外星人 1" };

    slot.assignedAlienId = jiuzhe.ALIEN_ID;
    slot.alienId = jiuzhe.ALIEN_ID;
    slot.revealed = true;
    jiuzhe.ensureJiuzheState(alienGameState);
    alienGameState.jiuzhe.revealedSlotId = alienSlotId;
    alienGameState.jiuzhe.revealedByPlayerId = currentPlayer.id;
    alienGameState.jiuzhe.revealedByPlayerColor = currentPlayer.color;
    alienGameState.jiuzhe.freeScoreThreshold = (Number(currentPlayer.resources?.score) || 0) + 20;
    alienGameState.jiuzhe.paidScoreThreshold = (Number(currentPlayer.resources?.score) || 0) + 40;
    delete alienGameState.jiuzhe.traceSlotsByAlienSlotId[String(alienSlotId)];

    enableDebugAlienTraceModeForReveal("九折调试：已在外星人 1 揭示九折（未放置 token）；已开启获取外星人标记模式，点击正面痕迹位会按正式规则结算奖励");
    renderAlienPanels();
    renderPlayerStats();
    renderStateReadout();
    return { ok: true, message: rocketState.statusNote };
  }

  function revealYichangdianForDebug() {
    if (!yichangdian) return { ok: false, message: "异常点模块未加载" };
    const currentPlayer = getCurrentPlayer();
    const alienSlotId = 1;
    const slot = aliens.getAlienSlot(alienGameState, alienSlotId);
    if (!slot) return { ok: false, message: "找不到外星人 1" };

    slot.assignedAlienId = yichangdian.ALIEN_ID;
    slot.alienId = yichangdian.ALIEN_ID;
    slot.revealed = true;
    alienGameState.yichangdian = yichangdian.createYichangdianState();
    const earth = getEarthSectorCoordinate();
    yichangdian.initializeYichangdianReveal(alienGameState, alienSlotId, currentPlayer, earth.x);

    enableDebugAlienTraceModeForReveal("异常点调试：已在外星人 1 揭示异常点并生成异常标记（未放置 token）；已开启获取外星人标记模式，点击正面痕迹位会按正式规则结算奖励");
    renderAlienPanels();
    renderRockets();
    renderPlayerStats();
    renderStateReadout();
    return { ok: true, message: rocketState.statusNote };
  }

  function revealFangzhouForDebug() {
    if (!fangzhou) return { ok: false, message: "方舟模块未加载" };
    const currentPlayer = getCurrentPlayer();
    const alienSlotId = 1;
    const slot = aliens.getAlienSlot(alienGameState, alienSlotId);
    if (!slot) return { ok: false, message: "找不到外星人 1" };

    slot.assignedAlienId = fangzhou.ALIEN_ID;
    slot.alienId = fangzhou.ALIEN_ID;
    slot.revealed = true;
    alienGameState.fangzhou = fangzhou.createFangzhouState();
    fangzhou.initializeFangzhouReveal(
      alienGameState,
      alienSlotId,
      currentPlayer,
      getActivePlayers(),
    );

    enableDebugAlienTraceModeForReveal("方舟调试：已在外星人 1 揭示方舟（未放置 token）；已开启获取外星人标记模式，点击正面痕迹位或解锁牌会按正式规则结算奖励");
    renderAlienPanels();
    renderPlayerStats();
    renderStateReadout();
    return { ok: true, message: rocketState.statusNote };
  }

  function revealBanrenmaForDebug() {
    if (!banrenma) return { ok: false, message: "半人马模块未加载" };
    const currentPlayer = getCurrentPlayer();
    const alienSlotId = 1;
    const slot = aliens.getAlienSlot(alienGameState, alienSlotId);
    if (!slot) return { ok: false, message: "找不到外星人 1" };

    slot.assignedAlienId = banrenma.ALIEN_ID;
    slot.alienId = banrenma.ALIEN_ID;
    slot.revealed = true;
    alienGameState.banrenma = banrenma.createBanrenmaState();
    banrenma.initializeBanrenmaReveal(
      alienGameState,
      alienSlotId,
      currentPlayer,
      getActivePlayers(),
    );

    enableDebugAlienTraceModeForReveal("半人马调试：已在外星人 1 揭示半人马（未放置 token）；已开启获取外星人标记模式，点击正面痕迹位会按正式规则结算奖励");
    renderAlienPanels();
    renderPlayerStats();
    renderReservedCardsFromTaskState();
    renderStateReadout();
    return { ok: true, message: rocketState.statusNote };
  }

  function revealChongForDebug() {
    if (!chong) return { ok: false, message: "虫族模块未加载" };
    const currentPlayer = getCurrentPlayer();
    const alienSlotId = 1;
    const slot = aliens.getAlienSlot(alienGameState, alienSlotId);
    if (!slot) return { ok: false, message: "找不到外星人 1" };

    slot.assignedAlienId = chong.ALIEN_ID;
    slot.alienId = chong.ALIEN_ID;
    slot.revealed = true;
    alienGameState.chong = chong.createChongState();
    chong.initializeChongReveal(
      alienGameState,
      alienSlotId,
      currentPlayer,
    );

    enableDebugAlienTraceModeForReveal("虫族调试：已在外星人 1 揭示虫族，按揭示阶段放置化石（未放置 token）；已开启获取外星人标记模式，点击正面痕迹位会按正式规则结算奖励");
    renderAlienPanels();
    renderRockets();
    renderPlayerStats();
    renderReservedCardsFromTaskState();
    renderStateReadout();
    return { ok: true, message: rocketState.statusNote };
  }

  function revealAmibaForDebug() {
    if (!amiba) return { ok: false, message: "阿米巴模块未加载" };
    const currentPlayer = getCurrentPlayer();
    const alienSlotId = 1;
    const slot = aliens.getAlienSlot(alienGameState, alienSlotId);
    if (!slot) return { ok: false, message: "找不到外星人 1" };

    slot.assignedAlienId = amiba.ALIEN_ID;
    slot.alienId = amiba.ALIEN_ID;
    slot.revealed = true;
    alienGameState.amiba = amiba.createAmibaState();
    amiba.initializeAmibaReveal(
      alienGameState,
      alienSlotId,
      currentPlayer,
    );

    const symbolCount = Object.keys(alienGameState.amiba?.symbolsById || {}).length;
    enableDebugAlienTraceModeForReveal(`阿米巴调试：已在外星人 1 揭示阿米巴并默认放置 ${symbolCount} 个 symbol（未放置 token）；已开启获取外星人标记模式，点击正面痕迹位会按正式规则结算奖励`);
    renderAlienPanels();
    renderPlayerStats();
    renderReservedCardsFromTaskState();
    renderStateReadout();
    return { ok: true, message: rocketState.statusNote };
  }

  function logAomomoDebugCoordinates(alienSlotId = alienGameState.aomomo?.revealedSlotId || 1) {
    if (!aomomo) return;
    const lines = [];
    for (const token of data.listNebulaTokens(nebulaDataState, aomomo.NEBULA_ID)) {
      const layout = data.getEffectiveAomomoBoardSlotLayout?.(token.slotIndex, token, solarState, solar);
      if (!layout) continue;
      const boardX = layout.boardPercentX ?? layout.percentX;
      const boardY = layout.boardPercentY ?? layout.percentY;
      const radial = layout.radialFraction ?? "n/a";
      const angular = layout.angularFraction ?? "n/a";
      lines.push(`数据槽 ${token.slotIndex} = 盘面(${boardX}%, ${boardY}%) radial=${radial} angular=${angular}`);
    }
    for (const line of lines) {
      console.info("[奥陌陌调试坐标]", line);
    }
  }

  function revealAomomoForDebug() {
    if (!aomomo) return { ok: false, message: "奥陌陌模块未加载" };
    const currentPlayer = getCurrentPlayer();
    const alienSlotId = 1;
    const slot = aliens.getAlienSlot(alienGameState, alienSlotId);
    if (!slot) return { ok: false, message: "找不到外星人 1" };

    slot.assignedAlienId = aomomo.ALIEN_ID;
    slot.alienId = aomomo.ALIEN_ID;
    slot.revealed = true;
    alienGameState.aomomo = aomomo.createAomomoState();
    aomomo.initializeAomomoReveal(alienGameState, alienSlotId, currentPlayer);
    activateAomomoBoard({ source: "aomomo_debug", replaceData: true });

    enableDebugAlienTraceModeForReveal(
      "奥陌陌调试：已揭示奥陌陌、替换第3轮盘并启用奥陌陌星球；星球弧形槽位放入3个数据token，可拖动校准；外星人面板不预放痕迹/环绕/登陆token",
    );
    renderWheels();
    renderSectorNebulaDataBoard();
    renderAlienPanels();
    renderRockets();
    renderPlayerStats();
    renderStateReadout();
    logAomomoDebugCoordinates(alienSlotId);
    return { ok: true, message: rocketState.statusNote };
  }

  function revealRunezuForDebug() {
    if (!runezu) return { ok: false, message: "符文族模块未加载" };
    const currentPlayer = getCurrentPlayer();
    const alienSlotId = 1;
    const slot = aliens.getAlienSlot(alienGameState, alienSlotId);
    if (!slot) return { ok: false, message: "找不到外星人 1" };

    slot.assignedAlienId = runezu.ALIEN_ID;
    slot.alienId = runezu.ALIEN_ID;
    slot.revealed = true;
    alienGameState.runezu = runezu.createRunezuState();
    runezu.initializeRunezuReveal(
      alienGameState,
      alienSlotId,
      currentPlayer,
      { techBoardState: techGameState.board },
    );
    const panelSymbols = runezu.listPanelSymbols(alienGameState);

    enableDebugAlienTraceModeForReveal(
      `符文族调试：已揭示符文族并按机制默认放置 ${panelSymbols.length} 个白框 symbol（未放置痕迹 token）；已开启获取外星人标记模式，点击正面痕迹位会按正式规则结算奖励`,
    );
    renderAlienPanels();
    renderRockets();
    renderTechBoard();
    renderPlayerStats();
    renderReservedCardsFromTaskState();
    renderStateReadout();
    return { ok: true, message: rocketState.statusNote };
  }

  function focusFangzhouDebugCalibration(alienSlotId = 1) {
    setDebugOpen(false);
    window.requestAnimationFrame(() => {
      const target = els.alienPanels?.[alienSlotId - 1] || getAlienJiuzheTraceLayer(alienSlotId);
      target?.scrollIntoView?.({ behavior: "smooth", block: "center", inline: "nearest" });
    });
  }

  function focusYichangdianDebugCalibration(alienSlotId = 1) {
    setDebugOpen(false);
    window.requestAnimationFrame(() => {
      const target = els.alienPanels?.[alienSlotId - 1] || getAlienJiuzheTraceLayer(alienSlotId);
      target?.scrollIntoView?.({ behavior: "smooth", block: "center", inline: "nearest" });
    });
  }

  function focusBanrenmaDebugCalibration(alienSlotId = 1) {
    setDebugOpen(false);
    window.requestAnimationFrame(() => {
      const target = els.alienPanels?.[alienSlotId - 1] || getAlienJiuzheTraceLayer(alienSlotId);
      target?.scrollIntoView?.({ behavior: "smooth", block: "center", inline: "nearest" });
    });
  }

  function focusChongDebugCalibration(alienSlotId = 1) {
    setDebugOpen(false);
    window.requestAnimationFrame(() => {
      const target = els.alienPanels?.[alienSlotId - 1] || getAlienJiuzheTraceLayer(alienSlotId);
      target?.scrollIntoView?.({ behavior: "smooth", block: "center", inline: "nearest" });
    });
  }

  function focusAmibaDebugCalibration(alienSlotId = 1) {
    setDebugOpen(false);
    window.requestAnimationFrame(() => {
      const target = els.alienPanels?.[alienSlotId - 1] || getAlienJiuzheTraceLayer(alienSlotId);
      target?.scrollIntoView?.({ behavior: "smooth", block: "center", inline: "nearest" });
    });
  }

  function focusAomomoDebugCalibration(alienSlotId = 1) {
    setDebugOpen(false);
    window.requestAnimationFrame(() => {
      const target = els.alienPanels?.[alienSlotId - 1] || getAlienJiuzheTraceLayer(alienSlotId);
      target?.scrollIntoView?.({ behavior: "smooth", block: "center", inline: "nearest" });
    });
  }


  function fillNebulaDataBoard(options = {}) {
    const { replace = false, source = "debug", log = false } = options;
    if (replace) {
      data.clearNebulaData(nebulaDataState);
    }

    const result = data.fillAllNebulaData(nebulaDataState, { source });
    rocketState.statusNote = result.message;
    renderSectorNebulaDataBoard();
    renderStateReadout();

    if (log) {
      if (result.ok) {
        for (const fillResult of result.results || []) {
          console.info("[星云数据填充]", fillResult.message);
          for (const { token, layout } of fillResult.added || []) {
            const label = data.getNebulaLabel(fillResult.nebulaId);
            console.info(
              `[星云坐标] ${label} 序号${token.index} 槽位${token.slotIndex}`
              + ` → 局部${layout.percentX}%,${layout.percentY}%`,
            );
          }
        }
      } else {
        console.info("[星云数据填充]", result.message);
      }
    }

    return result;
  }

  function fillDebugNebulaData() {
    return fillNebulaDataBoard({ source: "debug", log: true });
  }

  function renderSectorNebulaDataBoard() {
    for (const sectorId of [1, 2, 3, 4]) {
      const sectorElement = sectorElements[sectorId];
      if (sectorElement) {
        data.renderSectorNebulaData(sectorId, sectorElement, nebulaDataState);
      }
    }
    data.renderAomomoNebulaData?.(els.tokenLayer, nebulaDataState, solarState, {
      solarApi: solar,
      forceVisible: Boolean(solarState.aomomoActive),
    });
  }

  function moveRocket(deltaX, deltaY, rocketId) {
    const selectedRocketId = rocketId ?? moveHighlightRocketId ?? rocketState.activeRocketId;
    if (!selectedRocketId) {
      rocketState.statusNote = "请先点击要移动的火箭";
      renderStateReadout();
      return { ok: false, rocket: null, message: rocketState.statusNote };
    }

    return beginMovePaymentSelection(deltaX, deltaY, selectedRocketId);
  }

  function executeMoveRocket(deltaX, deltaY, rocketId) {
    const selectedRocketId = rocketId ?? moveHighlightRocketId ?? rocketState.activeRocketId;
    const result = rocketActions.moveRocket(rocketState, selectedRocketId, deltaX, deltaY);
    if (result.rocket) renderRocketElement(result.rocket);
    if (result.ok) {
      activateMoveMode(selectedRocketId);
    }
    updateActionButtons();
    renderStateReadout();
    return result;
  }

  function moveActiveRocket(deltaX, deltaY) {
    return moveRocket(deltaX, deltaY, rocketState.activeRocketId);
  }

  function handleRocketPointerDown(event) {
    if (event.button !== 0) return;

    const rocketId = Number(event.currentTarget.dataset.rocketId);
    if (!Number.isInteger(rocketId)) return;

    const rocket = rocketState.rockets.find((item) => item.id === rocketId);
    if (!rocket || isPlanetMarkerRocket(rocket)) return;

    event.stopPropagation();
    if (moveHighlightRocketId === rocketId) {
      event.preventDefault();
      return;
    }
    if (!activateMoveMode(rocketId)) return;

    event.preventDefault();
  }

  function handleBoardPointerDown(event) {
    if (event.button !== 0) return;
    if (event.target.closest(".rocket-token") || event.target.closest(".move-arrow-button")) return;
    if (moveHighlightRocketId == null) return;
    if (
      pendingCardTriggerFreeMove
      || industryFreeMoveState
      || pendingCardCornerFreeMove
      || pendingActionEffectFlow?.freeMoveMode
      || pendingActionEffectFlow?.cardMoveEffect
    ) return;
    deactivateMoveMode();
    renderStateReadout();
  }

  function stepsToTransform(steps) {
    const rotation = steps * (Math.PI / 4);
    return `rotate(${rotation}rad)`;
  }

  function renderWheels() {
    for (let w = 1; w <= 4; w += 1) {
      els.wheels[w].style.transform = stepsToTransform(solarState.wheelSteps[w]);
    }
    if (els.wheels[3]) {
      els.wheels[3].style.backgroundImage = solarState.aomomoActive && aomomo?.WHEEL3_AMM_SRC
        ? `url("${aomomo.WHEEL3_AMM_SRC}")`
        : "";
    }
  }

  function renderSectors() {
    for (const sectorId of [1, 2, 3, 4]) {
      delete sectorElements[sectorId];
    }

    for (let slot = 1; slot <= 4; slot += 1) {
      const wrap = els.sectorWraps[slot];
      wrap.innerHTML = "";
      const sectorId = solarState.sectorBySlot[slot];
      if (!sectorId) continue;

      const sector = document.createElement("div");
      sector.className = `sector sector-${sectorId}`;
      sector.dataset.sectorId = String(sectorId);
      sector.dataset.boardSlot = String(slot);
      wrap.appendChild(sector);
      sectorElements[sectorId] = sector;
    }

    renderSectorNebulaDataBoard();
  }

  function renderStateReadout() {
    const snapshot = solar.createSolarSnapshot(solarState);
    const axisLine = "坐标轴 x0=中线上方偏右第一块，顺时针递增";
    const wheelLine = [1, 2, 3, 4]
      .map((w) => `W${w}=${solar.mod8(solarState.wheelSteps[w])}`)
      .join("  ");
    const planetLine = snapshot.planetLocations
      .map((planet) => `${planet.name}[${planet.x},${planet.y}]`)
      .join("  ");
    const nebulaLine = snapshot.nebulaRelations
      .map((relation) => relation.displayText)
      .join("  ");
    const visibleCounts = Object.entries(snapshot.statistics.visibleMeaningfulContentCounts)
      .map(([label, count]) => `${label}=${count}`)
      .join("  ");
    els.stateReadout.textContent = [
      axisLine,
      `版图位置 ${wheelLine}`,
      `行星 ${planetLine}`,
      `星云 ${nebulaLine}`,
      `可见统计 ${visibleCounts}`,
      "",
      ...getTurnReadoutLines(),
      "",
      ...getInitialSelectionReadoutLines(),
      "",
      ...getPlayerReadoutLines(),
      "",
      ...finalScoring.getReadoutLines(finalScoringState),
      "",
      ...getPlanetStatsReadoutLines(),
      "",
      "可见坐标",
      formatVisibleCoordinateGroups(snapshot.visibleCoordinateGroups),
      "",
      ...getRocketCoordinateReadoutLines(),
      "",
      ...tech.getReadoutLines(techGameState, playerState),
      "",
      ...data.getReadoutLines(playerState),
      "",
      ...data.getNebulaReadoutLines(nebulaDataState),
      "",
      ...data.getSectorSettlementReadoutLines(nebulaDataState),
      "",
      ...aliens.getReadoutLines(alienGameState),
      "",
      ...(industry.getReadoutLines?.(getCurrentPlayer(), turnState.roundNumber) || []),
      ...(actionHistory.hasSession() ? ["", "行动指令栈", ...actionHistory.getTrace()] : []),
      ...(quickActionHistory.hasSession() ? ["", "快速行动指令栈", ...quickActionHistory.getTrace()] : []),
    ].join("\n");
  }

  function formatNamedCoordinates(items) {
    if (!items.length) return "无";
    return items.map((item) => {
      const label = item.kind === solar.layout.CONTENT_KIND.PLANET ? `${item.label}` : "";
      return `${label}[${item.x},${item.y}]`;
    }).join("  ");
  }

  function formatVisibleCoordinateGroups(groups) {
    return [
      `可见星球坐标 ${formatNamedCoordinates(groups.planets)}`,
      `小行星坐标 ${formatNamedCoordinates(groups.asteroids)}`,
      `彗星坐标 ${formatNamedCoordinates(groups.comets)}`,
    ].join("\n");
  }

  /** 官网 randomizeWheels 的无动画版：直接累加步数并渲染 */
  function randomizeWheels() {
    for (let w = 1; w <= 4; w += 1) {
      const delta = Math.floor(Math.random() * 8 + WHEEL_OFFSETS[w]);
      solarState.wheelSteps[w] -= delta;
    }
    solarState.rotation = solar.normalizeRotationState(solarState.wheelSteps, 0);
    renderWheels();
  }

  /** 官网 randomizeSectors 逻辑：将 4 个扇区洗牌分配到 4 个外边槽位 */
  function randomizeSectors() {
    const pool = [1, 2, 3, 4];
    while (pool.length) {
      const slotId = pool.length;
      const pickIndex = Math.floor(Math.random() * pool.length);
      const sectorId = pool.splice(pickIndex, 1)[0];
      solarState.sectorBySlot[slotId] = sectorId;
    }
    renderSectors();
  }

  /** 终局计分：a/b/c/d 各自独立随机 1 或 2 */
  function randomizeFinalScores() {
    finalScoring.randomizeTileVariants(finalScoringState, FINAL_SCORE_IDS);
    els.finalScoreTiles.forEach((img) => {
      const id = img.dataset.finalId;
      if (!id) return;
      const variant = finalScoring.getTileVariant(finalScoringState, id);
      img.src = `../assets/final/final_${id}${variant}.png`;
      img.alt = `终局计分 ${id.toUpperCase()}${variant}`;
    });
  }

  function randomizeAll() {
    els.spinButton?.classList.remove("pulsin");
    resetActionLog();
    pendingJiuzheCardPlay = null;
    pendingJiuzheOpportunityOpen = false;
    jiuzheOpportunityQueue = [];
    pendingBanrenmaCardGain = null;
    pendingBanrenmaOpportunity = null;
    banrenmaOpportunityQueue = [];
    pendingAomomoCardGain = null;
    pendingRunezuCardGain = null;
    pendingRunezuSymbolBranch = null;
    pendingRunezuFaceSymbolPlacement = null;
    industry?.resetAllIndustryActionMarks?.(playerState.players);
    cancelIndustryAbilityFlow({ silent: true });
    randomizePlayerTurnOrder();
    randomizeWheels();
    randomizeSectors();
    fillNebulaDataBoard({ source: "setup", replace: true });
    solarState.aomomoActive = false;
    if (aomomo?.NEBULA_ID) data.clearNebulaData(nebulaDataState, aomomo.NEBULA_ID);
    renderWheels();
    renderSectorNebulaDataBoard();
    randomizeFinalScores();
    randomizeAliens();
    tech.setupBoardBonuses(techGameState);
    renderTechBoard();
    renderRoundStatus();
    renderRotateStateToken();
    renderDebugPlayerSwitch();
    renderFinalScoreBoard();
    renderPlayerStats();
    renderRockets();
    updateActionButtons();
    renderStateReadout();
  }

  function getSetupState() {
    return solar.createSetupState(solarState);
  }

  function getRotateStateSlotIndex(rotationCount) {
    return ((Number(rotationCount) % ROTATE_STATE_SLOTS.length) + ROTATE_STATE_SLOTS.length) % ROTATE_STATE_SLOTS.length;
  }

  function renderRotateStateToken() {
    if (!els.roundStatusToken) return;

    const slot = ROTATE_STATE_SLOTS[getRotateStateSlotIndex(solarState.rotation.rotationCount)];
    els.roundStatusToken.style.setProperty("--rotate-token-x", `${slot.percentX}%`);
    els.roundStatusToken.style.setProperty("--rotate-token-y", `${slot.percentY}%`);
    els.roundStatusToken.dataset.slotId = slot.id;
  }

  function rotateSolarOrbit(count) {
    const iterations = Math.max(1, Math.round(Number(count || 1)));
    const rotationSettlements = [];
    const anomalyTriggers = [];
    const events = [];

    for (let index = 0; index < iterations; index += 1) {
      const beforeRotation = structuredClone(solarState.rotation);
      solarState.rotation = solar.applySolarOrbitRotation(solarState.rotation, 1);
      solarState.wheelSteps = solar.rotationToWheelSteps(solarState.rotation);
      const settlement = abilities.rocket.settleRocketsAfterSolarRotation(
        { solarState, playerState, rocketState },
        beforeRotation,
        solarState.rotation,
      );
      if (settlement) {
        rotationSettlements.push(settlement);
        events.push(...(settlement.events || []));
      }
      const earth = getEarthSectorCoordinate();
      const anomalyResult = triggerYichangdianAnomalyForEarthX(earth.x);
      if (anomalyResult) {
        anomalyTriggers.push(anomalyResult);
        events.push(...(anomalyResult.events || []));
      }
    }

    const lastSettlement = rotationSettlements[rotationSettlements.length - 1];
    const lastAnomaly = anomalyTriggers[anomalyTriggers.length - 1];
    renderWheels();
    renderRockets();
    renderRotateStateToken();
    renderPlayerStats();
    updateActionButtons();
    renderStateReadout();
    return {
      ok: true,
      message: lastAnomaly?.message || lastSettlement?.message || "太阳系旋转",
      payload: { rotationSettlements, anomalyTriggers },
      events,
    };
  }

  els.spinButton?.addEventListener("click", randomizeAll);
  els.actionLaunchButton.addEventListener("click", launchRocketForCurrentPlayer);
  els.actionOrbitButton.addEventListener("click", orbitForCurrentPlayer);
  els.actionLandButton.addEventListener("click", landForCurrentPlayer);
  els.actionScanButton?.addEventListener("click", beginScanAction);
  els.actionAnalyzeButton?.addEventListener("click", analyzeDataForCurrentPlayer);
  els.actionPlayCardButton?.addEventListener("click", beginPlayCardSelection);
  els.actionResearchTechButton?.addEventListener("click", researchTechForCurrentPlayer);
  els.techSelectionCancel?.addEventListener("click", cancelTechSelection);
  els.landTargetConfirm?.addEventListener("click", confirmLandTargetPicker);
  els.landTargetCancel?.addEventListener("click", cancelLandTargetPicker);
  els.landTargetOverlay?.addEventListener("click", (event) => {
    if (event.target === els.landTargetOverlay) cancelLandTargetPicker();
  });
  els.actionQuickButton.addEventListener("click", toggleQuickPanel);
  els.actionPassButton?.addEventListener("click", () => {
    if (els.actionPassButton.disabled) return;
    passForCurrentPlayer();
  });
  els.actionConfirmButton?.addEventListener("click", () => {
    if (els.actionConfirmButton.disabled) return;
    endCurrentTurn();
  });
  els.actionUndoButton?.addEventListener("click", () => {
    if (els.actionUndoButton.disabled) return;
    undoPendingAction();
  });
  els.quickActionsTrades.addEventListener("click", (event) => {
    const button = event.target.closest("[data-quick-trade]");
    if (!button || button.disabled) return;
    runQuickTrade(button.dataset.quickTrade);
  });
  els.playerBoardDataLayer?.addEventListener("click", (event) => {
    const token = event.target.closest(".data-token-pool");
    if (!token) return;
    runPlaceDataToComputer();
  });
  els.dataPlaceActions?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-place-target]");
    if (!button) return;
    confirmDataPlacement(button.dataset.placeTarget, button.dataset.blueSlot);
  });
  els.dataPlaceCancel?.addEventListener("click", closeDataPlacePicker);
  els.dataPlaceOverlay?.addEventListener("click", (event) => {
    if (event.target === els.dataPlaceOverlay) {
      closeDataPlacePicker();
    }
  });
  els.scanTargetActions?.addEventListener("click", (event) => {
    const debugSectorButton = event.target.closest("[data-debug-sector-scan-step]");
    if (debugSectorButton && !debugSectorButton.disabled) {
      handleDebugQuickSectorScanChoice(debugSectorButton);
      return;
    }

    const jiuzheChoice = event.target.closest("[data-jiuzhe-card-choice]");
    if (jiuzheChoice && !jiuzheChoice.disabled) {
      handleJiuzheCardChoice(jiuzheChoice.dataset.jiuzheCardChoice);
      return;
    }

    const jiuzheSkip = event.target.closest("[data-jiuzhe-opportunity-skip]");
    if (jiuzheSkip && !jiuzheSkip.disabled) {
      handleJiuzheOpportunitySkip();
      return;
    }

    const yichangdianGain = event.target.closest("[data-yichangdian-card-gain]");
    if (yichangdianGain && !yichangdianGain.disabled) {
      handleYichangdianCardGainChoice(yichangdianGain.dataset.yichangdianCardGain);
      return;
    }

    const banrenmaGain = event.target.closest("[data-banrenma-card-gain]");
    if (banrenmaGain && !banrenmaGain.disabled) {
      handleBanrenmaCardGainChoice(banrenmaGain.dataset.banrenmaCardGain);
      return;
    }

    const chongGain = event.target.closest("[data-chong-card-gain]");
    if (chongGain && !chongGain.disabled) {
      handleChongCardGainChoice(chongGain.dataset.chongCardGain);
      return;
    }

    const chongFossil = event.target.closest("[data-chong-fossil-choice]");
    if (chongFossil && !chongFossil.disabled) {
      handleChongFossilChoice(chongFossil.dataset.chongFossilChoice);
      return;
    }

    const chongTask = event.target.closest("[data-chong-task-complete]");
    if (chongTask && !chongTask.disabled) {
      handleChongTaskCompletionChoice(chongTask.dataset.chongTaskComplete);
      return;
    }

    const amibaGain = event.target.closest("[data-amiba-card-gain]");
    if (amibaGain && !amibaGain.disabled) {
      handleAmibaCardGainChoice(amibaGain.dataset.amibaCardGain);
      return;
    }

    const aomomoGain = event.target.closest("[data-aomomo-card-gain]");
    if (aomomoGain && !aomomoGain.disabled) {
      handleAomomoCardGainChoice(aomomoGain.dataset.aomomoCardGain);
      return;
    }

    const amibaSymbol = event.target.closest("[data-amiba-symbol-choice]");
    if (amibaSymbol && !amibaSymbol.disabled) {
      handleAmibaSymbolChoice(amibaSymbol.dataset.amibaSymbolChoice);
      return;
    }

    const amibaTraceRemove = event.target.closest("[data-amiba-trace-remove]");
    if (amibaTraceRemove && !amibaTraceRemove.disabled) {
      handleAmibaTraceRemovalChoice(amibaTraceRemove.dataset.amibaTraceRemove);
      return;
    }

    const runezuGain = event.target.closest("[data-runezu-card-gain]");
    if (runezuGain && !runezuGain.disabled) {
      handleRunezuCardGainChoice(runezuGain.dataset.runezuCardGain);
      return;
    }

    const runezuFaceSymbol = event.target.closest("[data-runezu-face-symbol-choice]");
    if (runezuFaceSymbol && !runezuFaceSymbol.disabled) {
      handleRunezuFaceSymbolChoice(runezuFaceSymbol.dataset.runezuFaceSymbolChoice);
      return;
    }

    const runezuBranch = event.target.closest("[data-runezu-symbol-branch]");
    if (runezuBranch && !runezuBranch.disabled) {
      handleRunezuSymbolBranchChoice(runezuBranch.dataset.runezuSymbolBranch);
      return;
    }

    const banrenmaBonus = event.target.closest("[data-banrenma-bonus-choice]");
    if (banrenmaBonus && !banrenmaBonus.disabled) {
      handleBanrenmaBonusChoice(banrenmaBonus.dataset.banrenmaBonusChoice);
      return;
    }

    const banrenmaCard = event.target.closest("[data-banrenma-card-choice]");
    if (banrenmaCard && !banrenmaCard.disabled) {
      handleBanrenmaCardConditionChoice(banrenmaCard.dataset.banrenmaCardChoice);
      return;
    }

    const yichangdianCorner = event.target.closest("[data-yichangdian-corner-card-id]");
    if (yichangdianCorner && !yichangdianCorner.disabled) {
      handleYichangdianCornerChoice(yichangdianCorner.dataset.yichangdianCornerCardId);
      return;
    }

    const cardTriggerButton = event.target.closest("[data-card-trigger-choice]");
    if (cardTriggerButton && !cardTriggerButton.disabled) {
      handleCardTriggerChoice(cardTriggerButton.dataset.cardTriggerChoice);
      return;
    }

    const cardTaskButton = event.target.closest("[data-card-task-complete]");
    if (cardTaskButton && !cardTaskButton.disabled) {
      confirmCardTaskCompletion();
      return;
    }

    const button = event.target.closest("[data-nebula-id]");
    if (!button || button.disabled || !button.dataset.nebulaId) return;
    confirmScanTarget(button.dataset.nebulaId, button.dataset.sectorX);
  });
  els.scanTargetCancel?.addEventListener("click", () => {
    if (pendingChongTaskCompletion) {
      handleChongTaskCompletionChoice("cancel");
      return;
    }
    if (pendingChongFossilChoice) {
      handleChongFossilChoice("cancel");
      return;
    }
    if (pendingChongCardGain) {
      handleChongCardGainChoice("cancel");
      return;
    }
    if (pendingAmibaTraceRemoval) {
      handleAmibaTraceRemovalChoice("cancel");
      return;
    }
    if (pendingAmibaSymbolChoice) {
      handleAmibaSymbolChoice("cancel");
      return;
    }
    if (pendingAmibaCardGain) {
      handleAmibaCardGainChoice("cancel");
      return;
    }
    if (pendingAomomoCardGain) {
      handleAomomoCardGainChoice("cancel");
      return;
    }
    if (pendingRunezuFaceSymbolPlacement) {
      handleRunezuFaceSymbolChoice("cancel");
      return;
    }
    if (pendingRunezuSymbolBranch) {
      handleRunezuSymbolBranchChoice("cancel");
      return;
    }
    if (pendingRunezuCardGain) {
      handleRunezuCardGainChoice("cancel");
      return;
    }
    if (pendingBanrenmaCardGain) {
      handleBanrenmaCardGainChoice("cancel");
      return;
    }
    if (pendingBanrenmaOpportunity) {
      closeBanrenmaOpportunityDialog();
      return;
    }
    if (pendingYichangdianCardGain) {
      handleYichangdianCardGainChoice("cancel");
      return;
    }
    if (pendingJiuzheCardPlay?.reason === "view") {
      closeJiuzheCardDialog();
      return;
    }
    closeScanTargetPicker();
  });
  els.scanTargetOverlay?.addEventListener("click", (event) => {
    if (event.target === els.scanTargetOverlay) {
      if (pendingChongTaskCompletion) {
        handleChongTaskCompletionChoice("cancel");
        return;
      }
      if (pendingChongFossilChoice) {
        handleChongFossilChoice("cancel");
        return;
      }
      if (pendingChongCardGain) {
        handleChongCardGainChoice("cancel");
        return;
      }
      if (pendingAmibaTraceRemoval) {
        handleAmibaTraceRemovalChoice("cancel");
        return;
      }
      if (pendingAmibaSymbolChoice) {
        handleAmibaSymbolChoice("cancel");
        return;
      }
      if (pendingAmibaCardGain) {
        handleAmibaCardGainChoice("cancel");
        return;
      }
      if (pendingAomomoCardGain) {
        handleAomomoCardGainChoice("cancel");
        return;
      }
      if (pendingRunezuFaceSymbolPlacement) {
        handleRunezuFaceSymbolChoice("cancel");
        return;
      }
      if (pendingRunezuSymbolBranch) {
        handleRunezuSymbolBranchChoice("cancel");
        return;
      }
      if (pendingRunezuCardGain) {
        handleRunezuCardGainChoice("cancel");
        return;
      }
      if (pendingBanrenmaCardGain) {
        handleBanrenmaCardGainChoice("cancel");
        return;
      }
      if (pendingBanrenmaOpportunity) {
        closeBanrenmaOpportunityDialog();
        return;
      }
      if (pendingYichangdianCardGain) {
        handleYichangdianCardGainChoice("cancel");
        return;
      }
      if (pendingJiuzheCardPlay?.reason === "view") {
        closeJiuzheCardDialog();
        return;
      }
      closeScanTargetPicker();
    }
  });
  els.alienTraceActions?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-alien-picker-step][data-alien-slot]");
    if (!button || button.disabled) return;

    const alienSlotId = Number(button.dataset.alienSlot);
    const pickerStep = button.dataset.alienPickerStep;
    const allowedTraceTypes = alienTracePickerState?.allowedTraceTypes || aliens.TRACE_TYPES;
    const alienSlot = aliens.getAlienSlot(alienGameState, alienSlotId);
    const useJiuzheGrid = jiuzhe?.isJiuzheRevealedSlot?.(alienGameState, alienSlotId)
      || (alienSlot?.revealed && alienSlot.alienId === aliens.JIUZHE_ALIEN_ID);
    const useYichangdianGrid = yichangdian?.isYichangdianRevealedSlot?.(alienGameState, alienSlotId)
      || (alienSlot?.revealed && alienSlot.alienId === aliens.YICHANGDIAN_ALIEN_ID);
    const useFangzhouGrid = fangzhou?.isFangzhouRevealedSlot?.(alienGameState, alienSlotId)
      || (alienSlot?.revealed && alienSlot.alienId === aliens.FANGZHOU_ALIEN_ID);
    const useBanrenmaGrid = banrenma?.isBanrenmaRevealedSlot?.(alienGameState, alienSlotId)
      || (alienSlot?.revealed && alienSlot.alienId === aliens.BANRENMA_ALIEN_ID);
    const useChongGrid = chong?.isChongRevealedSlot?.(alienGameState, alienSlotId)
      || (alienSlot?.revealed && alienSlot.alienId === aliens.CHONG_ALIEN_ID);
    const useAmibaGrid = amiba?.isAmibaRevealedSlot?.(alienGameState, alienSlotId)
      || (alienSlot?.revealed && alienSlot.alienId === aliens.AMIBA_ALIEN_ID);
    const useAomomoGrid = aomomo?.isAomomoRevealedSlot?.(alienGameState, alienSlotId)
      || (alienSlot?.revealed && alienSlot.alienId === aliens.AOMOMO_ALIEN_ID);
    const useRunezuGrid = runezu?.isRunezuRevealedSlot?.(alienGameState, alienSlotId)
      || (alienSlot?.revealed && alienSlot.alienId === aliens.RUNEZU_ALIEN_ID);

    if (pickerStep === "alien") {
      if (useJiuzheGrid) {
        beginJiuzheTraceGridPlacement(alienSlotId);
        return;
      }
      if (useBanrenmaGrid) {
        beginBanrenmaTraceGridPlacement(alienSlotId);
        return;
      }
      if (useFangzhouGrid) {
        routeFangzhouAlienTraceGain(alienSlotId);
        return;
      }
      if (useChongGrid) {
        beginChongTraceGridPlacement(alienSlotId);
        return;
      }
      if (useAmibaGrid) {
        beginAmibaTraceGridPlacement(alienSlotId);
        return;
      }
      if (useAomomoGrid) {
        beginAomomoTraceGridPlacement(alienSlotId);
        return;
      }
      if (useRunezuGrid) {
        beginRunezuTraceGridPlacement(alienSlotId);
        return;
      }
      if (useYichangdianGrid) {
        beginYichangdianTraceGridPlacement(alienSlotId);
        return;
      }
      if (allowedTraceTypes.length === 1) {
        confirmAlienTracePlacement(alienSlotId, allowedTraceTypes[0]);
        return;
      }
      alienTracePickerState = { ...alienTracePickerState, selectedAlienSlotId: alienSlotId };
      renderAlienTracePickerColorStep(alienSlotId);
      return;
    }

    if (pickerStep === "fangzhou-color" && button.dataset.traceType) {
      openFangzhouTraceUseChoice(alienSlotId, button.dataset.traceType);
      return;
    }

    if (pickerStep === "fangzhou-use" && button.dataset.traceType) {
      if (button.dataset.fangzhouUse === "unlock") {
        confirmFangzhouCard2Unlock(alienSlotId, button.dataset.traceType);
        return;
      }
      beginFangzhouTraceGridPlacement(alienSlotId, button.dataset.traceType);
      return;
    }

    if (pickerStep === "color" && button.dataset.traceType) {
      confirmAlienTracePlacement(alienSlotId, button.dataset.traceType);
    }
  });
  els.alienTraceCancel?.addEventListener("click", closeAlienTracePicker);
  els.alienTraceOverlay?.addEventListener("click", (event) => {
    if (event.target === els.alienTraceOverlay) {
      closeAlienTracePicker();
    }
  });
  els.alienTraceLayers?.forEach((layer) => {
    layer.addEventListener("click", (event) => {
      const button = event.target.closest("[data-state-trace-slot]");
      if (!button || button.disabled || !button.classList.contains("is-placeable")) return;
      confirmAlienTracePlacement(
        Number(button.dataset.alienSlot),
        button.dataset.traceType,
      );
    });
  });
  els.alienJiuzheTraceLayers?.forEach((layer) => {
    layer.addEventListener("click", (event) => {
      const banrenmaButton = event.target.closest("[data-banrenma-trace-slot]");
      if (banrenmaButton && !banrenmaButton.disabled && banrenmaButton.classList.contains("is-placeable")) {
        confirmBanrenmaTracePlacement(
          Number(banrenmaButton.dataset.alienSlot),
          banrenmaButton.dataset.traceType,
          Number(banrenmaButton.dataset.banrenmaPosition),
        );
        return;
      }
      const yichangdianButton = event.target.closest("[data-yichangdian-trace-slot]");
      if (yichangdianButton && !yichangdianButton.disabled && yichangdianButton.classList.contains("is-placeable")) {
        confirmYichangdianTracePlacement(
          Number(yichangdianButton.dataset.alienSlot),
          yichangdianButton.dataset.traceType,
          Number(yichangdianButton.dataset.yichangdianPosition),
        );
        return;
      }
      const fangzhouButton = event.target.closest("[data-fangzhou-trace-slot]");
      if (fangzhouButton && !fangzhouButton.disabled && fangzhouButton.classList.contains("is-placeable")) {
        confirmFangzhouTracePlacement(
          Number(fangzhouButton.dataset.alienSlot),
          fangzhouButton.dataset.traceType,
          Number(fangzhouButton.dataset.fangzhouPosition),
        );
        return;
      }
      const chongButton = event.target.closest("[data-chong-trace-slot]");
      if (chongButton && !chongButton.disabled && chongButton.classList.contains("is-placeable")) {
        confirmChongTracePlacement(
          Number(chongButton.dataset.alienSlot),
          chongButton.dataset.traceType,
          Number(chongButton.dataset.chongPosition),
        );
        return;
      }
      const amibaButton = event.target.closest("[data-amiba-trace-slot]");
      if (amibaButton && !amibaButton.disabled && amibaButton.classList.contains("is-placeable")) {
        confirmAmibaTracePlacement(
          Number(amibaButton.dataset.alienSlot),
          amibaButton.dataset.traceType,
          Number(amibaButton.dataset.amibaPosition),
        );
        return;
      }
      const aomomoButton = event.target.closest("[data-aomomo-trace-slot]");
      if (aomomoButton && !aomomoButton.disabled && aomomoButton.classList.contains("is-placeable")) {
        confirmAomomoTracePlacement(
          Number(aomomoButton.dataset.alienSlot),
          aomomoButton.dataset.traceType,
          Number(aomomoButton.dataset.aomomoPosition),
        );
        return;
      }
      const runezuButton = event.target.closest("[data-runezu-trace-slot]");
      if (runezuButton && !runezuButton.disabled && runezuButton.classList.contains("is-placeable")) {
        confirmRunezuTracePlacement(
          Number(runezuButton.dataset.alienSlot),
          runezuButton.dataset.traceType,
          Number(runezuButton.dataset.runezuPosition),
        );
        return;
      }
      const runezuFaceButton = event.target.closest("[data-runezu-face-symbol-slot]");
      if (runezuFaceButton && !runezuFaceButton.disabled && runezuFaceButton.classList.contains("is-placeable")) {
        openRunezuFaceSymbolPlacement(
          Number(runezuFaceButton.dataset.alienSlot),
          Number(runezuFaceButton.dataset.runezuFaceSymbolPosition),
        );
        return;
      }
      const button = event.target.closest("[data-jiuzhe-trace-slot]");
      if (!button || button.disabled || !button.classList.contains("is-placeable")) return;
      confirmJiuzheTracePlacement(
        Number(button.dataset.alienSlot),
        button.dataset.traceType,
        Number(button.dataset.jiuzhePosition),
      );
    });
  });
  els.scanAction4Actions?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-scan-action4-choice]");
    if (!button || button.disabled) return;
    handleScanAction4Choice(button.dataset.scanAction4Choice);
  });
  els.scanAction4Cancel?.addEventListener("click", closeScanAction4Picker);
  els.scanAction4Overlay?.addEventListener("click", (event) => {
    if (event.target === els.scanAction4Overlay) {
      closeScanAction4Picker();
    }
  });
  els.actionEffectList?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-effect-index]");
    if (!button || button.disabled) return;
    handleActionEffectButtonClick(Number(button.dataset.effectIndex));
  });
  els.actionEffectSkipButton?.addEventListener("click", skipCurrentActionEffect);
  els.tokenLayer?.addEventListener("click", (event) => {
    if (event.target.closest(".rocket-token")) {
      event.stopPropagation();
    }
  });
  els.moveArrowLayer?.addEventListener("pointerdown", (event) => {
    const button = event.target.closest("[data-move-x]");
    if (!button || moveHighlightRocketId == null) return;
    event.stopPropagation();
    event.preventDefault();
    if (pendingCardTriggerFreeMove) {
      executeFreeMoveForCardTrigger(
        Number(button.dataset.moveX),
        Number(button.dataset.moveY),
        moveHighlightRocketId,
      );
      return;
    }
    if (industryFreeMoveState) {
      executeIndustryFreeMove(
        Number(button.dataset.moveX),
        Number(button.dataset.moveY),
        moveHighlightRocketId,
      );
      return;
    }
    if (pendingCardCornerFreeMove) {
      executeFreeMoveForCardCorner(
        Number(button.dataset.moveX),
        Number(button.dataset.moveY),
        moveHighlightRocketId,
      );
      return;
    }
    if (pendingActionEffectFlow?.freeMoveMode) {
      executeFreeMoveForScanAction4(
        Number(button.dataset.moveX),
        Number(button.dataset.moveY),
        moveHighlightRocketId,
      );
      return;
    }
    if (pendingActionEffectFlow?.cardMoveEffect) {
      executeCardMoveForEffect(
        Number(button.dataset.moveX),
        Number(button.dataset.moveY),
        moveHighlightRocketId,
      );
      return;
    }
    moveRocket(Number(button.dataset.moveX), Number(button.dataset.moveY), moveHighlightRocketId);
  });
  els.wheelWrap.addEventListener("pointerdown", handleBoardPointerDown);
  els.finalScoreGrid?.addEventListener("click", (event) => {
    const tile = event.target.closest(".final-score-tile-wrap[data-final-id]");
    if (!tile || tile.disabled) return;
    handleFinalScoreTileClick(tile.dataset.finalId);
  });
  els.debugToggle.addEventListener("click", () => {
    setDebugOpen(els.appWrap.classList.contains("debug-collapsed"));
  });
  els.debugPlayerSwitchButton?.addEventListener("click", () => {
    setDebugPlayerMenuOpen(els.debugPlayerMenu?.hidden);
  });
  els.debugPlayerMenu?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-player-color]");
    if (!button) return;
    switchCurrentPlayerColor(button.dataset.playerColor);
  });
  els.debugRotateButton.addEventListener("click", () => {
    const result = rotateSolarOrbit(1);
    settleCardTasksAfterEffect({ events: result.events, render: true });
  });
  els.debugIncomeButton.addEventListener("click", addDebugIncome);
  els.debugIncomeEffectButton?.addEventListener("click", () => beginIncomeForCurrentPlayer({ source: "debug" }));
  els.debugResolveIncomeButton?.addEventListener("click", executeIncomeForCurrentPlayer);
  els.debugGainDataButton?.addEventListener("click", addDebugData);
  els.debugScoreButton?.addEventListener("click", addDebugScore);
  els.debugFillNebulaDataButton?.addEventListener("click", fillDebugNebulaData);
  els.debugSectorScanButton?.addEventListener("click", beginSectorScan);
  els.debugQuickSectorScanButton?.addEventListener("click", openDebugQuickSectorScanPicker);
  els.debugPublicScanButton?.addEventListener("click", beginPublicDeckScan);
  els.debugHandScanButton?.addEventListener("click", beginHandScan);
  els.debugAlienTraceButton?.addEventListener("click", toggleDebugAlienTraceMode);
  els.reservedCardFan?.addEventListener("click", (event) => {
    const unlockButton = event.target.closest("[data-fangzhou-unlock]");
    if (!unlockButton || unlockButton.disabled || !isDebugAlienTraceMode()) return;
    const traceType = unlockButton.dataset.fangzhouUnlock;
    const alienSlotId = alienGameState.fangzhou?.revealedSlotId || 2;
    confirmFangzhouCard2Unlock(alienSlotId, traceType);
  });
  els.debugJiuzheButton?.addEventListener("click", () => {
    const result = revealJiuzheForDebug();
    if (result?.ok) focusJiuzheDebugCalibration(1);
  });
  els.debugYichangdianButton?.addEventListener("click", () => {
    const result = revealYichangdianForDebug();
    if (result?.ok) focusYichangdianDebugCalibration(1);
  });
  els.debugFangzhouButton?.addEventListener("click", () => {
    const result = revealFangzhouForDebug();
    if (result?.ok) focusFangzhouDebugCalibration(1);
  });
  els.debugBanrenmaButton?.addEventListener("click", () => {
    const result = revealBanrenmaForDebug();
    if (result?.ok) focusBanrenmaDebugCalibration(1);
  });
  els.debugChongButton?.addEventListener("click", () => {
    const result = revealChongForDebug();
    if (result?.ok) focusChongDebugCalibration(1);
  });
  els.debugAmibaButton?.addEventListener("click", () => {
    const result = revealAmibaForDebug();
    if (result?.ok) focusAmibaDebugCalibration(1);
  });
  els.debugAomomoButton?.addEventListener("click", () => {
    const result = revealAomomoForDebug();
    if (result?.ok) focusAomomoDebugCalibration(1);
  });
  els.debugRunezuButton?.addEventListener("click", () => {
    revealRunezuForDebug();
  });
  document.addEventListener("click", (event) => {
    const viewButton = event.target.closest("[data-fangzhou-card-view]");
    if (!viewButton) return;
    openFangzhouCard1Dialog(Number(viewButton.dataset.fangzhouCardView));
  });
  els.debugPickCardButton?.addEventListener("click", beginCardSelection);
  els.publicBlindDrawButton?.addEventListener("click", handlePublicBlindDrawClick);
  els.publicCardRow?.addEventListener("click", (event) => {
    const target = event.target.closest("[data-public-slot]");
    if (!target) return;
    handlePublicCardClick(Number(target.dataset.publicSlot));
  });
  els.cardSelectionCancel?.addEventListener("click", cancelCardSelection);
  els.cardSelectionBackdrop?.addEventListener("click", cancelCardSelection);
  els.publicScanConfirm?.addEventListener("click", confirmPublicScanSelection);
  els.discardSelectionCancel?.addEventListener("click", cancelDiscardSelection);
  els.discardSelectionBackdrop?.addEventListener("click", cancelDiscardSelection);
  els.playCardActionButton?.addEventListener("click", confirmPlayCardSelection);
  els.playCardSelectionCancel?.addEventListener("click", cancelPlayCardSelection);
  els.cardCornerActionButton?.addEventListener("click", confirmCardCornerQuickAction);
  els.handScanCancel?.addEventListener("click", cancelHandScanSelection);
  els.reservedCardFan?.addEventListener("click", (event) => {
    const jiuzheButton = event.target.closest("[data-jiuzhe-cards]");
    if (jiuzheButton) {
      openJiuzheCardDialog(getCurrentPlayer());
      return;
    }
    const button = event.target.closest("[data-reserved-index]");
    if (!button || button.disabled) return;
    const currentPlayer = getCurrentPlayer();
    const card = currentPlayer?.reservedCards?.[Number(button.dataset.reservedIndex)];
    if (card) {
      if (getReadyChongTaskForReservedCard(card, currentPlayer)) {
        openChongTraceTaskCompletionPicker(card);
      } else {
        openCardTaskCompletionPicker(card);
      }
    }
  });
  els.movePaymentConfirm?.addEventListener("click", confirmMovePayment);
  els.movePaymentCancel?.addEventListener("click", cancelMovePaymentSelection);
  els.playerHandFan?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-hand-index]");
    if (!button || button.disabled) return;
    if (isDiscardSelectionActive()) {
      handleHandCardDiscard(Number(button.dataset.handIndex));
      return;
    }
    if (isMovePaymentSelectionActive()) {
      handleHandCardMovePayment(Number(button.dataset.handIndex));
      return;
    }
    if (isHandScanSelectionActive()) {
      handleHandScanCardClick(Number(button.dataset.handIndex));
      return;
    }
    if (isIndustryHandSelectionActive()) {
      handleIndustryDeepspaceHandClick(Number(button.dataset.handIndex));
      return;
    }
    if (isPlayCardSelectionActive()) {
      handlePlayCardSelect(Number(button.dataset.handIndex));
      return;
    }
    handleHandCardCornerQuickAction(Number(button.dataset.handIndex));
  });
  els.debugDiscardCardButton?.addEventListener("click", discardCardFromCurrentPlayer);
  els.debugCheatButton?.addEventListener("click", toggleCheatMode);
  els.techBlueSlotActions?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-blue-slot]");
    if (!button) return;
    confirmTechBlueSlotChoice(Number(button.dataset.blueSlot));
  });
  els.techBlueSlotCancel?.addEventListener("click", () => {
    closeTechBlueSlotPicker();
    renderStateReadout();
  });
  els.techBlueSlotOverlay?.addEventListener("click", (event) => {
    if (event.target === els.techBlueSlotOverlay) {
      closeTechBlueSlotPicker();
      renderStateReadout();
    }
  });
  syncTechRenderContext();
  tech.bindSupplyTileClicks(techGameState, techRenderContext, els.techTiles, {
    onTileClick: handleSupplyTechTileClick,
  });
  els.logToggle.addEventListener("click", () => {
    setLogOpen(els.appWrap.classList.contains("log-collapsed"));
  });
  els.stateLogTab?.addEventListener("click", () => {
    setReportTab("state");
  });
  els.actionLogTab?.addEventListener("click", () => {
    setReportTab("action");
  });
  aliens.bindAlienTraceDragging?.({
    onPositionChange: (payload) => {
      rocketState.statusNote = payload?.message || "外星人坐标已更新";
      if (payload?.message) console.info("[外星人坐标拖动]", payload.message, payload);
      renderAlienPanels();
      renderStateReadout();
    },
  });
  data.bindNebulaDataDragging?.({
    onPositionChange: (payload) => {
      rocketState.statusNote = payload?.message || "星云数据坐标已更新";
      if (payload?.message) console.info("[星云数据坐标拖动]", payload.message, payload);
      if (payload?.nebulaId === aomomo?.NEBULA_ID) {
        console.info(
          "[奥陌陌调试坐标]",
          `数据槽 ${payload.slotIndex} = 盘面(${payload.percentX}%, ${payload.percentY}%)`
          + ` radial=${payload.radialFraction} angular=${payload.angularFraction}`,
        );
        logAomomoDebugCoordinates();
      }
      renderSectorNebulaDataBoard();
      renderStateReadout();
    },
  });
  window.addEventListener("resize", resize);
  setTokenAssetSizes();
  setReportTab("state");
  setLogOpen(false);
  initializeCardGame(10);
  seedDefaultReferenceRockets();
  resize();
  randomizeAll();
  startInitialSelection();

  window.SetiRandomizer = {
    randomize: randomizeAll,
    rotateSolarOrbit,
    launchRocket: launchRocketForCurrentPlayer,
    orbitRocket: orbitForCurrentPlayer,
    landRocket: landForCurrentPlayer,
    addDebugIncome,
    addDebugScore,
    executeIncomeForCurrentPlayer,
    addDebugData,
    fillDebugNebulaData,
    beginSectorScan,
    openDebugQuickSectorScanPicker,
    runDebugQuickSectorScan,
    beginPublicDeckScan,
    beginHandScan,
    replaceNebulaDataForCurrentPlayer,
    switchCurrentPlayerColor,
    getNebulaSlotLayoutOverrides: () => structuredClone(data.listNebulaSlotLayoutOverrides()),
    placeDataToComputer: runPlaceDataToComputer,
    analyzeDataForCurrentPlayer,
    getDataSlotLayoutOverrides: () => structuredClone(data.listSlotLayoutOverrides()),
    getAlienTraceLayoutOverrides: () => structuredClone(aliens.listTraceMarkerLayoutOverrides()),
    getAlienExtraTraceLayoutOverrides: () => structuredClone(aliens.listExtraTraceMarkerLayoutOverrides()),
    getJiuzheTraceLayoutOverrides: () => structuredClone(aliens.listJiuzheTraceMarkerLayoutOverrides?.() || []),
    getYichangdianTraceLayoutOverrides: () => structuredClone(aliens.listYichangdianTraceMarkerLayoutOverrides?.() || []),
    getFangzhouTraceLayoutOverrides: () => structuredClone(aliens.listFangzhouTraceMarkerLayoutOverrides?.() || []),
    getChongTraceLayoutOverrides: () => structuredClone(aliens.listChongTraceMarkerLayoutOverrides?.() || []),
    getAmibaTraceLayoutOverrides: () => structuredClone(aliens.listAmibaTraceMarkerLayoutOverrides?.() || []),
    getAmibaSymbolLayoutOverrides: () => structuredClone(aliens.listAmibaSymbolMarkerLayoutOverrides?.() || []),
    getAomomoTraceLayoutOverrides: () => structuredClone(aliens.listAomomoTraceMarkerLayoutOverrides?.() || []),
    getAomomoOrbitLayoutOverrides: () => structuredClone(aliens.listAomomoOrbitMarkerLayoutOverrides?.() || []),
    getAomomoLandingLayoutOverrides: () => structuredClone(aliens.listAomomoLandingMarkerLayoutOverrides?.() || []),
    getRunezuTraceLayoutOverrides: () => structuredClone(aliens.listRunezuTraceMarkerLayoutOverrides?.() || []),
    getRunezuPanelSymbolLayoutOverrides: () => structuredClone(aliens.listRunezuPanelSymbolMarkerLayoutOverrides?.() || []),
    getRunezuFaceSymbolLayoutOverrides: () => structuredClone(aliens.listRunezuFaceSymbolMarkerLayoutOverrides?.() || []),
    getAlienState: () => structuredClone(alienGameState),
    revealJiuzheForDebug,
    revealYichangdianForDebug,
    revealFangzhouForDebug,
    revealBanrenmaForDebug,
    revealChongForDebug,
    revealAmibaForDebug,
    revealAomomoForDebug,
    revealRunezuForDebug,
    getFinalScoringState: () => structuredClone(finalScoringState),
    markFinalScoreTile: handleFinalScoreTileClick,
    openAlienTracePicker,
    placeAlienFirstTrace: (alienSlotId, traceType, playerColor) => {
      const result = aliens.placeFirstTrace(
        alienGameState,
        alienSlotId,
        traceType,
        playerColor || getCurrentPlayer().color,
      );
      const revealResult = maybeRevealAlienAfterTrace(alienSlotId, result);
      const sideEffect = handleJiuzheRevealSideEffects(Number(alienSlotId), revealResult, getCurrentPlayer())
        || handleYichangdianRevealSideEffects(Number(alienSlotId), revealResult, getCurrentPlayer())
        || handleFangzhouRevealSideEffects(Number(alienSlotId), revealResult, getCurrentPlayer())
        || handleBanrenmaRevealSideEffects(Number(alienSlotId), revealResult, getCurrentPlayer())
        || handleChongRevealSideEffects(Number(alienSlotId), revealResult, getCurrentPlayer())
        || handleAmibaRevealSideEffects(Number(alienSlotId), revealResult, getCurrentPlayer())
        || handleAomomoRevealSideEffects(Number(alienSlotId), revealResult, getCurrentPlayer())
        || handleRunezuRevealSideEffects(Number(alienSlotId), revealResult, getCurrentPlayer());
      if (sideEffect?.message) {
        rocketState.statusNote = sideEffect.message;
      }
      renderAlienPanels();
      renderRockets();
      renderPlayerStats();
      renderStateReadout();
      return revealResult || result;
    },
    placeAlienExtraTrace: (alienSlotId, traceType) => {
      const result = aliens.addExtraTrace(alienGameState, alienSlotId, traceType);
      renderAlienPanels();
      renderStateReadout();
      return result;
    },
    revealAlien: (alienSlotId, alienId) => {
      const result = aliens.revealAlien(alienGameState, alienSlotId, alienId);
      const sideEffect = handleJiuzheRevealSideEffects(Number(alienSlotId), result, getCurrentPlayer())
        || handleYichangdianRevealSideEffects(Number(alienSlotId), result, getCurrentPlayer())
        || handleFangzhouRevealSideEffects(Number(alienSlotId), result, getCurrentPlayer())
        || handleBanrenmaRevealSideEffects(Number(alienSlotId), result, getCurrentPlayer())
        || handleChongRevealSideEffects(Number(alienSlotId), result, getCurrentPlayer())
        || handleAmibaRevealSideEffects(Number(alienSlotId), result, getCurrentPlayer())
        || handleAomomoRevealSideEffects(Number(alienSlotId), result, getCurrentPlayer())
        || handleRunezuRevealSideEffects(Number(alienSlotId), result, getCurrentPlayer());
      if (sideEffect?.message) result.message = sideEffect.message;
      renderAlienPanels();
      renderRockets();
      renderPlayerStats();
      renderStateReadout();
      return result;
    },
    randomizeAliens,
    startInitialSelection,
    getInitialSelectionState: () => structuredClone(setupSelectionState),
    drawCardForCurrentPlayer,
    blindDrawCardForPlayer,
    beginCardSelection,
    beginDiscardSelection,
    beginPlayCardSelection,
    beginIncomeForCurrentPlayer,
    cancelCardSelection,
    cancelDiscardSelection,
    cancelPlayCardSelection,
    pickPublicCardForCurrentPlayer,
    playHandCard: handleHandCardPlay,
    discardCardFromCurrentPlayer,
    playerState,
    cardState,
    actionHistory,
    undoPendingAction,
    endCurrentTurn,
    passTurn: passForCurrentPlayer,
    runAction,
    runQuickTrade,
    toggleQuickPanel,
    moveRocket,
    moveActiveRocket,
    getSectorLaunchSlots: (x, y) => solar.getSectorLaunchSlots(x, y),
    getSectorLaunchSlot: (x, y, slotIndex) => solar.getSectorLaunchSlot(x, y, slotIndex),
    getSectorOccupancy: () => rocketActions.serializeSectorOccupancy(rocketState),
    screenToBoardPoint: (clientX, clientY) => getBoardPointFromClientPosition(clientX, clientY),
    screenToPolarPoint: (clientX, clientY) => getPolarPointFromClientPosition(clientX, clientY),
    solarGridToGlobalPoint: (x, y) => solar.solarGridToGlobalPoint(x, y),
    solarGridToPolarPoint: (x, y) => solar.solarGridToPolarPoint(x, y),
    polarToGlobalPoint: (radius, angleDegrees) => solar.polarToGlobalPoint(radius, angleDegrees),
    globalPointToPolarPoint: (point) => solar.globalPointToPolarPoint(point),
    getSolarCellBoundary: (x, y) => solar.getSolarCellBoundary(x, y),
    getSolarCellBoundaries: () => solar.collectSolarCellBoundaries(),
    getSectorCoordinateBoundary: (x, y) => solar.getSectorCoordinateBoundary(x, y),
    getSectorCoordinateBoundaries: () => solar.collectSectorCoordinateBoundaries(),
    resolveSectorCoordinateFromPolarPoint: (point) => solar.resolveSectorCoordinateFromPolarPoint(point),
    resolveSectorCoordinateFromGlobalPoint: (point) => solar.resolveSectorCoordinateFromGlobalPoint(point),
    resolveVisibleContent: (x, y) => solar.resolveVisibleContent(x, y, solarState),
    getSolarSnapshot: () => solar.createSolarSnapshot(solarState),
    getWheelCoordinateReport: () => solar.collectWheelCoordinateReport(solarState),
    getVisibleCoordinateReport: () => solar.collectVisibleCoordinateReport(solarState),
    getVisibleCoordinateGroups: () => solar.collectVisibleCoordinateGroups(solarState),
    getRocketCoordinates: () => structuredClone(rocketState.rockets.map(createRocketSnapshot)),
    getPlanetReferenceCenters: () => structuredClone(planetReferenceLayout.PLANET_REFERENCE_CENTERS),
    getPlanetOrbitLandReferenceData: () => structuredClone(buildPlanetOrbitLandReferenceData()),
    getGeneratedPlanetReferencePlacements: () => structuredClone(planetReferenceLayout.listAllOrbitLandSlots()),
    getPlanetOrbitLandMarkers: () => structuredClone(
      planetReferenceLayout.PLANET_ORDER.flatMap((planetId) => {
        const orbitMarkers = planetStats.getPlanetOrbitMarkers(planetStatsState, planetId).map((marker) => ({
          planetId,
          kind: "orbit",
          ...marker,
        }));
        const landingMarkers = planetStats.getPlanetLandingMarkers(planetStatsState, planetId).map((marker) => ({
          planetId,
          kind: "land",
          ...marker,
        }));
        return [...orbitMarkers, ...landingMarkers];
      }),
    ),
    syncPlanetOrbitLandMarkers,
    getSatelliteLandingMarkers: () => structuredClone(
      planetReferenceLayout.PLANETS_WITH_SATELLITES.flatMap((planetId) => (
        planetStats.getSatelliteLandingMarkers(planetStatsState, planetId).map((marker) => ({
          planetId,
          ...marker,
        }))
      )),
    ),
    getLandOptions: () => structuredClone(actions.getLandOptions(createActionContext())),
    clientToPlanetsReferencePoint: (clientX, clientY) => getPlanetsReferencePointFromClientPosition(clientX, clientY),
    placeRocketAtBoardPoint: (rocketId, x, y) => {
      const result = rocketActions.placeRocketAtBoardPoint(rocketState, rocketId, { x, y });
      if (result.rocket) renderRocketElement(result.rocket);
      updateActionButtons();
      renderStateReadout();
      return result;
    },
    placeRocketAtPlanetsReferencePoint: (rocketId, x, y) => {
      const dimensions = getPlanetsReferenceDimensions();
      const result = rocketActions.placeRocketAtPlanetsReferencePoint(rocketState, rocketId, {
        x,
        y,
        ...dimensions,
      });
      if (result.rocket) renderRocketElement(result.rocket);
      updateActionButtons();
      renderStateReadout();
      return result;
    },
    getPlayerState: () => structuredClone(playerState),
    getTurnState: () => structuredClone({
      ...turnState,
      roundOrderPlayerIds: getRoundOrderPlayerIds(),
      currentPlayerId: playerState.currentPlayerId,
    }),
    getActionLog: (options = {}) => getRecoverableActionLog(options),
    getActionLogRecoveryPackage: createActionLogRecoveryPackage,
    createRecoverySnapshot: createGameRecoverySnapshot,
    restoreRecoverySnapshot: applyGameRecoverySnapshot,
    recoverFromActionLog,
    getPlanetStatsState: () => structuredClone(planetStatsState),
    getCurrentPlayer: () => structuredClone(getCurrentPlayer()),
    getState: () => structuredClone({
      ...solarState,
      players: playerState.players,
      currentPlayerId: playerState.currentPlayerId,
      turnState,
      planetStats: planetStatsState,
      rockets: rocketState.rockets.map(createRocketSnapshot),
      setup: getSetupState(),
      solarSystem: solar.createSolarSnapshot(solarState),
    }),
    getSetupState,
    toggleCheatMode,
    getTechSnapshot: () => tech.getSnapshot(techGameState),
    researchTech: researchTechForCurrentPlayer,
    takeTechTile: (tileId, blueSlot) => {
      const result = blueSlot == null
        ? tech.requestTakeTech(createActionContext(), techGameState, tileId)
        : tech.confirmBlueSlotChoice(createActionContext(), techGameState, tileId, blueSlot);
      if (result.ok && !result.needsBlueSlotChoice) finalizeTechTakeResult(result);
      else renderStateReadout();
      return result;
    },
  };
})();
