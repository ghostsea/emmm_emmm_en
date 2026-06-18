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
  const abilities = window.SetiAbilities;
  const quickTrades = window.SetiQuickTrades;
  const basicCards = window.SetiBasicCards;
  const cards = window.SetiCards;
  const cardEffects = window.SetiCardEffects;
  const tech = window.SetiTech;
  const data = window.SetiData;
  const aliens = window.SetiAliens;
  const initialCards = window.SetiInitialCards;

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
  });
  const TECH_EFFECT_ICONS = Object.freeze({
    research_tech: "../assets/symbol/effect/research_tech.webp",
    rotate: "../assets/tokens/rotate_state.png",
    bonus_3f: "../assets/symbol/effect/score.webp",
    bonus_1p: "../assets/symbol/effect/energy.webp",
    bonus_1m: "../assets/symbol/effect/publicity.webp",
    bonus_1c: "../assets/symbol/effect/choose_card.webp",
  });
  const CARD_EFFECT_ICONS = Object.freeze({
    yellow_scan: "../assets/symbol/effect/yellow_scan.webp",
    red_scan: "../assets/symbol/effect/red_scan.webp",
    blue_scan: "../assets/symbol/effect/blue_scan.webp",
    black_scan: "../assets/symbol/effect/black_scan.webp",
    public_card_scan: "../assets/symbol/action/scan/public_card_scan.webp",
    scan: "../assets/symbol/effect/normal_scan.webp",
    scan_action: "../assets/symbol/effect/scan_action.webp",
    research_tech: "../assets/symbol/effect/research_tech.webp",
    movement: "../assets/symbol/effect/movement.webp",
  });
  const INCOME_GAIN_LABELS = Object.freeze({
    credits: "信用点",
    energy: "能量",
    handSize: "手牌",
    publicity: "宣传",
    availableData: "数据",
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
  let pendingCardTriggerAction = null;
  let pendingCardTriggerFreeMove = null;
  let pendingCardTaskCompletion = null;
  let alienTracePickerState = null;
  let pendingActionExecuted = false;
  let pendingPassPlayerId = null;
  let pendingActionEffectFlow = null;
  let pendingActionHasIrreversibleCardGain = false;
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
  let pendingCardCornerQuickAction = null;
  let pendingCardCornerFreeMove = null;
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
      return "（点击要打出的牌）";
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
    updateActionButtons();
    renderStateReadout();
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
        message: `${result.message}；${settleResult.message}；参与结算玩家各获得1宣传`,
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
    const text = composeActionLogStepText(label, detail);
    if (!text) return null;
    const step = {
      source,
      text,
      label: normalizeActionLogText(label),
      detail: normalizeActionLogText(detail),
    };
    draft.steps.push(step);
    renderActionLog();
    return step;
  }

  function removeLastActionLogStep(source) {
    const draft = actionLogState.draft;
    if (!draft?.steps?.length) return null;
    for (let index = draft.steps.length - 1; index >= 0; index -= 1) {
      if (!source || draft.steps[index].source === source) {
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
        source: step.source || HISTORY_SOURCE_MAIN,
        text: normalizeActionLogText(step.text || composeActionLogStepText(step.label, step.detail)),
        label: normalizeActionLogText(step.label),
        detail: normalizeActionLogText(step.detail),
      })).filter((step) => step.text),
    };
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
      text.textContent = `${sourceLabel}：${step.text}`;

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
      return { roundAdvanced: false, turnAdvanced: false, nextPlayerId };
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
      `本回合已行动 ${completedLabels}`,
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
    pendingMovePayment = null;
    syncMovePaymentChrome();

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
      handleCardTriggerEvents(moveResult.events);
    } else {
      rocketState.statusNote = moveResult.message;
    }

    renderPlayerStats();
    updateActionButtons();
    renderStateReadout();
    return moveResult;
  }

  function syncPlayCardSelectionChrome() {
    const active = isPlayCardSelectionActive();
    if (active) cancelCardCornerQuickAction({ silent: true });
    els.appWrap?.classList.toggle("play-card-selection-active", active);
    els.playerHandPanel?.classList.toggle("play-card-selection-active", active);
    els.playerHandPanel?.classList.toggle("player-hand-panel-focused", active);
    if (els.playCardActionButton) {
      els.playCardActionButton.hidden = !active;
      els.playCardActionButton.disabled = !active;
      els.playCardActionButton.title = active ? "点击卡牌打出，或点击此处取消" : "";
    }
    updatePlayerHandPanelTitle();
    if (active) setQuickPanelOpen(false);
    renderPlayerHand();
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
    return !isInitialSelectionActive()
      && !isTechTilePickingActive()
      && !isCardSelectionActive()
      && !isDiscardSelectionActive()
      && !isPlayCardSelectionActive()
      && !isHandScanSelectionActive()
      && !isMovePaymentSelectionActive()
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
    const rocketsForPlayer = rocketActions.getRocketsForPlayer(rocketState, currentPlayer?.id);
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
    rocketState.statusNote = "打牌：请选择一张手牌";
    syncPlayCardSelectionChrome();
    updateActionButtons();
    renderStateReadout();
    return { ok: true, message: rocketState.statusNote };
  }

  function cancelPlayCardSelection() {
    if (!isPlayCardSelectionActive()) return;

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

    const price = getCardPrice(card);
    if ((currentPlayer.resources?.credits || 0) < price) {
      rocketState.statusNote = `信用点不足：${cards.getCardLabel(card)} 需要 ${price} 信用点`;
      renderStateReadout();
      return { ok: false, message: rocketState.statusNote };
    }

    const beforePlayer = structuredClone(currentPlayer);
    const beforeCardState = {
      publicCards: cardState.publicCards.slice(),
      discardPile: (cardState.discardPile || []).slice(),
    };
    const spendResult = players.spendResources(currentPlayer, { credits: price });
    if (!spendResult.ok) {
      rocketState.statusNote = spendResult.message;
      renderStateReadout();
      return spendResult;
    }

    const removeResult = cards.discardFromHandAtIndex(currentPlayer, removeIndex);
    if (!removeResult.ok) {
      players.gainResources(currentPlayer, { credits: price });
      rocketState.statusNote = removeResult.message;
      renderStateReadout();
      return removeResult;
    }

    const playedCard = removeResult.card;
    const typeCode = getCardTypeCode(playedCard);
    const shouldReserve = [1, 2, 3].includes(typeCode);
    const playEffects = cardEffects.buildPlayEffects(playedCard);
    const temporaryTasks = cardEffects.getTemporaryTasks(playedCard);
    if (shouldReserve) {
      if (!Array.isArray(currentPlayer.reservedCards)) currentPlayer.reservedCards = [];
      cardEffects.ensureCardEffectState(playedCard);
      currentPlayer.reservedCards.push(playedCard);
    } else {
      cards.addToDiscardPile(cardState, playedCard);
    }

    cards.setPlayCardSelectionActive(cardState, false);
    rocketState.statusNote = shouldReserve
      ? `打出：${cards.getCardLabel(playedCard)}，支付 ${price} 信用点，进入保留牌区`
      : `打出：${cards.getCardLabel(playedCard)}，支付 ${price} 信用点，已弃掉`;
    syncPlayCardSelectionChrome();
    renderPlayerStats();
    recordPlayCardStart(currentPlayer, playedCard, beforePlayer, beforeCardState);
    if (playEffects.length) {
      startCardEffectFlow("play-card-effects", `打出 ${cards.getCardLabel(playedCard)}`, playEffects, {
        actionType: "playCard",
        card: playedCard,
        temporaryTasks,
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
      pendingActionHasIrreversibleCardGain = true;
      if (getCurrentActionEffect()) {
        getCurrentActionEffect().result = {
          ok: true,
          undoable: false,
          message: rocketState.statusNote,
          payload: { card: result.card, replenished: result.replenished || null },
        };
      }
      completeCurrentActionEffect();
    }
    if (pending?.type === "tech_bonus_pick_card") {
      pendingActionHasIrreversibleCardGain = true;
      const bonusResult = abilities.executeAbility("researchTechBonus", createActionContext(), {
        bonusId: pending.bonusId,
        firstTake: Boolean(pending.firstTake),
        skipCardSelection: true,
      });
      if (getCurrentActionEffect()) {
        getCurrentActionEffect().result = {
          ok: true,
          undoable: false,
          message: `${rocketState.statusNote}${bonusResult?.message ? `；${bonusResult.message}` : ""}`,
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
    pendingScanTargetAction = null;
    els.scanTargetOverlay.hidden = true;
    if (els.scanTargetCancel) {
      els.scanTargetCancel.hidden = false;
    }
    renderPlayerHand();
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
    const scanSource = pending?.fromEffectFlow || isActionEffectFlowActive() ? "scan" : "debug";

    if (pending?.type === "sector_scan") {
      const result = replaceNebulaDataForCurrentPlayer(nebulaId, {
        prefix: pending.title || (sectorX != null ? `扇区${sectorX}扫描` : "星云扫描"),
        source: scanSource,
        gainData: pending.gainData,
      });
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
        pendingActionHasIrreversibleCardGain = true;
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
        pendingActionHasIrreversibleCardGain = true;
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

    const choices = Array.from({ length: 8 }, (_, x) => {
      const nebula = solar.getNebulaAtCoordinate(x, 5, solarState.sectorBySlot);
      if (!nebula) {
        return {
          nebulaId: "",
          sectorX: x,
          label: `扇区 ${x}`,
          description: "当前没有星云",
          disabled: true,
        };
      }
      return buildNebulaScanChoice(nebula.id, {
        sectorX: x,
        label: `扇区 ${x}：${nebula.label}`,
      });
    });

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
      ? `${replacedText}；${settleResult.message}；参与结算玩家各获得1宣传`
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
      choices: nebulaIds.map((nebulaId) => buildNebulaScanChoice(nebulaId)),
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

  function recordHistoryCommand(command) {
    if (!actionHistory.hasSession()) return;
    actionHistory.record(command);
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
    actionHistory.beginStep({ type: "action", label });
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
    quickActionHistory.beginStep({ type: actionType, label });
  }

  function completePendingActionStep() {
    endEffectHistoryStep();
    markActionPending();
  }

  function completeQuickActionStep() {
    const step = quickActionHistory.endStep();
    if (step) {
      rememberHistoryStep(HISTORY_SOURCE_QUICK);
      appendActionLogStep(HISTORY_SOURCE_QUICK, step.label);
    }
  }

  function rememberHistoryStep(source) {
    historyStepOrder.push(source);
  }

  function forgetLastHistoryStep(source) {
    for (let index = historyStepOrder.length - 1; index >= 0; index -= 1) {
      if (historyStepOrder[index] === source) {
        historyStepOrder.splice(index, 1);
        return;
      }
    }
  }

  function clearHistoryStepOrderForSource(source) {
    for (let index = historyStepOrder.length - 1; index >= 0; index -= 1) {
      if (historyStepOrder[index] === source) {
        historyStepOrder.splice(index, 1);
      }
    }
  }

  function getLatestUndoSource() {
    for (let index = historyStepOrder.length - 1; index >= 0; index -= 1) {
      const source = historyStepOrder[index];
      if (source === HISTORY_SOURCE_QUICK && quickActionHistory.hasUndoableStep()) return source;
      if (source === HISTORY_SOURCE_MAIN && actionHistory.hasUndoableStep()) return source;
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
    return null;
  }

  function recordAtomicActionHistory(actionType, label, result) {
    startPendingActionSession(actionType, label);
    recordAbilityCommands(result);
    completePendingActionStep();
  }

  function startCardEffectFlow(chainId, label, effects, options = {}) {
    if (!effects?.length) return false;

    pendingActionEffectFlow = abilities.chain.startAbilityChain(chainId, label, effects);
    pendingActionEffectFlow.actionType = options.actionType || "playCard";
    pendingActionEffectFlow.playerId = getCurrentPlayer()?.id || null;
    pendingActionEffectFlow.card = options.card || null;
    pendingActionEffectFlow.cardTemporaryTasks = options.temporaryTasks || [];

    els.appWrap?.classList.toggle("action-effect-flow-active", true);
    rocketState.statusNote = `${label}：请依次点击效果`;
    activateNextActionEffect();
    return true;
  }

  function recordPlayCardStart(player, card, beforePlayer, beforeCardState) {
    startActionLogDraft("playCard", "打牌行动", { source: HISTORY_SOURCE_MAIN, player });
    actionHistory.beginSession("playCard", "打牌行动");
    actionHistory.beginStep({
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
    return cardEffects.collectReadyTasks(
      currentPlayer,
      buildCardTaskContext(),
    );
  }

  function getReadyTaskForReservedCard(card) {
    return getReadyCardTasks().find((ready) => ready.card?.id === card?.id) || null;
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
    cardEffects.completeTask(ready.card, ready.task.id);
    removeReservedCardToDiscard(currentPlayer, ready.card);
    incrementCompletedTaskCount(currentPlayer);

    actionHistory.beginStep({
      type: "card_task_start",
      label: `完成任务：${cards.getCardLabel(ready.card)}`,
      effectIndex: -1,
    });
    effectStepActive = true;
    recordHistoryCommand(historyCommands.createRestorePlayerCommand(
      currentPlayer,
      beforePlayer,
      "恢复卡牌任务结算前玩家状态",
    ));
    recordHistoryCommand(historyCommands.createRestorePublicCardsCommand(
      cardState,
      beforeCardState.publicCards,
      beforeCardState.discardPile,
    ));
    endEffectHistoryStep();

    renderPlayerStats();
    renderPublicCards();
    updateActionButtons();
    renderStateReadout();
    return startCardEffectFlow(
      "card-task-rewards",
      "卡牌任务奖励",
      ready.effects,
      { actionType: "cardTask" },
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
    const rocketsForPlayer = rocketActions.getRocketsForPlayer(rocketState, currentPlayer?.id);
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

  function handleCardTriggerEvents(events) {
    const currentPlayer = getCurrentPlayer();
    if (!currentPlayer || pendingCardTriggerAction || pendingCardTriggerFreeMove || pendingCardCornerFreeMove) return null;
    const matches = [];
    for (const event of events || []) {
      matches.push(...cardEffects.collectMatchingTriggers(currentPlayer, event));
    }
    if (!matches.length) return null;
    return matches.length === 1 ? applyCardTriggerMatch(matches[0]) : openCardTriggerPicker(matches);
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
    handleCardTriggerEvents(result.events);
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
      movementPoints: pending.action.moveReward?.movementPoints || 1,
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
    renderPlayerStats();
    renderRockets();
    renderPlayerHand();
    updateActionButtons();
    renderStateReadout();
    handleCardTriggerEvents(result.events);
    return result;
  }

  function startPlanetRewardEffectFlow(actionType, result) {
    const rewardEffects = planetRewards?.buildRewardEffectsForAction?.(actionType, result) || [];
    if (!rewardEffects.length) return false;

    const actionLabel = actionType === "orbit" ? "环绕" : "登陆";
    startActionLogDraft(actionType, `${actionLabel}行动`, { source: HISTORY_SOURCE_MAIN });
    actionHistory.beginSession(actionType, `${actionLabel}行动`);
    actionHistory.beginStep({
      type: "action_start",
      label: result.message || `${actionLabel}标记`,
      effectIndex: -1,
    });
    effectStepActive = true;
    recordAbilityCommands(result);
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
      || type === "initial_income";
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
    if (!actionHistory.hasSession() || effectStepActive) return;
    const current = getCurrentActionEffect();
    actionHistory.beginStep({
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
    const step = actionHistory.endStep();
    if (step) {
      rememberHistoryStep(HISTORY_SOURCE_MAIN);
      appendActionLogStep(HISTORY_SOURCE_MAIN, step.label, currentEffect?.result?.message || null);
    }
    effectStepActive = false;
    return step;
  }

  function refreshAfterHistoryChange(message) {
    renderSectorNebulaDataBoard();
    renderRockets();
    syncPlanetOrbitLandMarkers();
    renderPublicCards();
    updatePublicCardControls();
    renderPlayerStats();
    updateActionButtons();
    renderActionEffectBar();
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
      || pendingCardTriggerFreeMove
      || pendingCardCornerFreeMove
      || (els.scanAction4Overlay && !els.scanAction4Overlay.hidden)
      || (els.alienTraceOverlay && !els.alienTraceOverlay.hidden)
      || pendingActionEffectFlow?.cardMoveEffect
      || pendingActionEffectFlow?.freeMoveMode,
    );
  }

  function hasActivePendingSubFlow() {
    return hasActiveEffectSubFlow()
      || isMovePaymentSelectionActive()
      || (els.dataPlaceOverlay && !els.dataPlaceOverlay.hidden);
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
    return sectorXs.map((x) => {
      const nebula = solar.getNebulaAtCoordinate(x, 5, solarState.sectorBySlot);
      if (!nebula) {
        return {
          nebulaId: "",
          sectorX: x,
          label: `扇区 ${x}`,
          description: "当前没有星云",
          disabled: true,
        };
      }
      return buildNebulaScanChoice(nebula.id, {
        sectorX: x,
        label: `扇区 ${x}：${nebula.label}`,
      });
    });
  }

  function clearActionEffectFlow() {
    pendingActionEffectFlow = null;
    closeScanAction4Picker();
    renderActionEffectBar();
    els.appWrap?.classList.toggle("action-effect-flow-active", false);
  }

  function cancelActiveEffectSubFlows() {
    if (!pendingPublicScanQueue) {
      closeScanTargetPicker();
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
    endEffectHistoryStep();
    if (!hadHistoryStep && status !== "skipped") {
      appendActionLogStep(HISTORY_SOURCE_MAIN, current.label, current.result?.message || null);
    }
    if (status === "skipped") {
      abilities.chain.skipCurrentChainNode(pendingActionEffectFlow);
    } else {
      if (current.undoable === false || current.result?.undoable === false) {
        pendingActionHasIrreversibleCardGain = true;
      }
      abilities.chain.resolveCurrentChainNode(pendingActionEffectFlow, current.result || {});
    }
    renderActionEffectBar();

    if (pendingActionEffectFlow.completed) {
      finishActionEffectFlow();
    } else {
      renderActionEffectBar();
      updateActionButtons();
      renderStateReadout();
    }
  }

  function resolveCompletedSectorSettlements(actionType, options = {}) {
    if (typeof data.settleCompletedSectors !== "function") return null;

    const settlementResult = data.settleCompletedSectors(nebulaDataState, {
      players: playerState.players,
      getPlayerTokenSrc: getNormalTokenAssetForPlayer,
      source: actionType || "mainAction",
    });
    if (!settlementResult.ok) return null;

    const awarded = new Set();
    for (const settlement of settlementResult.settlements || []) {
      for (const participant of settlement.participants || []) {
        const player = playerState.players.find((item) => item.id === participant.playerId)
          || playerState.players.find((item) => item.color === participant.playerColor);
        if (!player) continue;
        const awardKey = `${settlement.sectorId}:${player.id}`;
        if (awarded.has(awardKey)) continue;
        awarded.add(awardKey);
        players.gainResources(player, { publicity: 1 });
      }
    }

    if (options.markMainActionIrreversible !== false) {
      pendingActionHasIrreversibleCardGain = true;
    }
    renderSectorNebulaDataBoard();
    renderPlayerStats();
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
      updateActionButtons();
      renderStateReadout();
      return;
    }
    const settleResult = shouldCheckCompletedSectorsAfterFlow(finishedFlow)
      ? resolveCompletedSectorSettlements(actionType)
      : null;
    if (startTemporaryCardTaskRewardFlow(finishedFlow.cardTemporaryTasks, settleResult)) {
      return;
    }
    const baseMessage = actionType === "scan"
      ? "扫描效果已全部处理，可继续执行次要行动或回合结束"
      : "效果已全部处理，可继续执行次要行动或回合结束";
    rocketState.statusNote = settleResult?.ok
      ? `${baseMessage}；${settleResult.message}；参与结算玩家各获得1宣传`
      : baseMessage;
    markActionPending();
    renderPlayerStats();
    updateActionButtons();
    renderStateReadout();
  }

  function maybeCompleteActionEffectFromScan(result) {
    if (!result?.ok || !isActionEffectFlowActive()) return;
    const current = getCurrentActionEffect();
    if (current) current.result = result;
    completeCurrentActionEffect();
    handleCardTriggerEvents(result.events);
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
    const rocketsForPlayer = rocketActions.getRocketsForPlayer(rocketState, currentPlayer?.id);
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
    const rocketsForPlayer = rocketActions.getRocketsForPlayer(rocketState, currentPlayer?.id);
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
    handleCardTriggerEvents(result.events);
    renderStateReadout();
    return result;
  }

  function beginCardMoveEffect(effect) {
    const currentPlayer = getCurrentPlayer();
    const rocketsForPlayer = rocketActions.getRocketsForPlayer(rocketState, currentPlayer?.id);
    if (!rocketsForPlayer.length) {
      rocketState.statusNote = "没有可移动的飞船";
      renderStateReadout();
      return { ok: false, message: rocketState.statusNote };
    }

    pendingActionEffectFlow.cardMoveEffect = { effect };
    rocketState.statusNote = rocketsForPlayer.length > 1
      ? `${effect.label}：请点击要移动的飞船`
      : `${effect.label}：使用方向键移动飞船`;
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
    const pending = pendingActionEffectFlow?.cardMoveEffect;
    const effect = pending?.effect || getCurrentActionEffect();
    if (!effect) return { ok: false, message: "没有待结算的卡牌移动" };

    const moveCheck = rocketActions.canMoveRocket(rocketState, rocketId, deltaX, deltaY);
    if (!moveCheck.ok) {
      rocketState.statusNote = moveCheck.message;
      renderStateReadout();
      return moveCheck;
    }

    beginEffectHistoryStep(effect.label);

    const result = abilities.executeAbility("moveProbe", createActionContext(), {
      cost: {},
      movementPoints: effect.options?.movementPoints || 1,
      rocketId,
      deltaX,
      deltaY,
      source: "card",
      historyLabel: effect.options?.historyLabel || effect.label,
    });
    if (result.rocket) renderRocketElement(result.rocket);
    if (!result.ok) {
      endEffectHistoryStep();
      rocketState.statusNote = result.message;
      renderStateReadout();
      return result;
    }

    recordAbilityCommands(result);
    const messageParts = [];
    const appliedRewards = applyCardMoveAfterEventRewards(effect, result, messageParts);
    const rewardText = messageParts.length ? `；${messageParts.join("；")}` : "";

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
    renderPlayerStats();
    completeCurrentActionEffect();
    handleCardTriggerEvents(result.events);
    renderStateReadout();
    return effect.result;
  }

  function executeSectorScanAtPlanet(planetId, prefixLabel) {
    const sector = getPlanetSectorCoordinate(planetId);
    const nebula = solar.getNebulaAtCoordinate(sector.x, 5, solarState.sectorBySlot);
    if (!nebula) {
      const planetName = planetId === "earth" ? "地球" : planetId === "mercury" ? "水星" : planetId;
      rocketState.statusNote = `${planetName}所在扇区没有可扫描星云`;
      renderStateReadout();
      return { ok: false, message: rocketState.statusNote };
    }

    const result = replaceNebulaDataForCurrentPlayer(nebula.id, {
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
        handleCardTriggerEvents(result.events);
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
    handleCardTriggerEvents(result.events);
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
    pendingActionHasIrreversibleCardGain = true;
    const drawnCount = drawResult.cards?.length || 0;
    const message = drawResult.ok
      ? `${effect.label}：已抽 ${drawnCount} 张`
      : `${effect.label}：已抽 ${drawnCount}/${count} 张，${drawResult.message}`;
    return finishAutomaticRewardEffect(effect, {
      ok: true,
      undoable: false,
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
      choices: nebulaIds.map((nebulaId) => buildNebulaScanChoice(nebulaId)),
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

    pendingActionHasIrreversibleCardGain = true;
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

    pendingActionHasIrreversibleCardGain = true;
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
      message: `${effect.label}：抽到并弃除 ${cards.getCardLabel(discardResult.card)}，${rewardText}`,
      payload: {
        card: discardResult.card,
        resourceReward,
        moveReward,
        dataResults,
      },
    }, [renderPlayerHand]);
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
      case types.CARD_MOVE:
        return beginCardMoveEffect(effect);
      case types.DRAW_THEN_SCAN:
        return openCardDrawThenScanEffect(effect);
      case types.DRAW_THEN_DISCARD_ACTION:
        return executeCardDrawThenDiscardActionEffect(effect);
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

  function openNebulaChoiceRewardEffect(effect) {
    const nebulaIds = effect.options?.nebulaIds || [];
    rocketState.statusNote = `${effect.label}：请选择 1 个星云`;
    renderStateReadout();
    return openScanTargetPicker({
      type: "sector_scan",
      fromEffectFlow: true,
      title: effect.label,
      subtitle: "按槽位顺序替换未替换的数据。",
      choices: nebulaIds.map((nebulaId) => buildNebulaScanChoice(nebulaId)),
    });
  }

  function openAlienTraceRewardEffect(effect) {
    const traceType = effect.options?.traceType || null;
    pendingAlienTraceAction = {
      type: "planet_reward_alien_trace",
      beforeAlienState: structuredClone(alienGameState),
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
        handleCardTriggerEvents(result.events);
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

    switch (effect.type) {
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

  function getAlienBackImage(alienSlotId) {
    return document.querySelector(`.alien-panel[data-alien-slot="${alienSlotId}"] .alien-back`);
  }

  function maybeRevealAlienAfterTrace(alienSlotId, traceResult) {
    if (!traceResult?.readyToReveal) return null;
    return aliens.revealAlien(alienGameState, alienSlotId);
  }

  function renderAlienPanels() {
    aliens.renderAllAlienBackImages(getAlienBackImage, alienGameState);
    aliens.renderAllAlienTraceMarkers(getAlienTraceLayer, alienGameState, {
      tokenSrc: aliens.ALIEN_TRACE_TOKEN_SRC,
      getPlayerTokenAsset: (playerColor) => (
        players.getPlayerColorDefinition(playerColor)?.normalTokenAsset
        || aliens.ALIEN_TRACE_TOKEN_SRC
      ),
      getPlayerLabel: (playerColor) => players.getPlayerColorDefinition(playerColor)?.label || playerColor,
    });
  }

  function randomizeAliens() {
    const result = aliens.randomizeAlienAssignments(alienGameState);
    aliens.resetAlienTraceTokens();
    renderAlienPanels();
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

  function confirmAlienTracePlacement(alienSlotId, traceType) {
    const currentPlayer = getCurrentPlayer();
    const pending = pendingAlienTraceAction;
    const beforeAlienState = pending?.beforeAlienState || structuredClone(alienGameState);
    pendingAlienTraceAction = null;
    const result = aliens.placeFirstTrace(
      alienGameState,
      alienSlotId,
      traceType,
      currentPlayer.color,
    );
    closeAlienTracePicker();
    const revealResult = maybeRevealAlienAfterTrace(alienSlotId, result);
    rocketState.statusNote = revealResult?.message || result.message;
    if (pending?.type === "planet_reward_alien_trace" && result.ok) {
      beginEffectHistoryStep(pending.effectLabel || "外星人标记奖励");
      recordHistoryCommand(historyCommands.createRestoreObjectCommand(
        alienGameState,
        beforeAlienState,
        "恢复外星人标记奖励前状态",
      ));
      if (getCurrentActionEffect()) {
        getCurrentActionEffect().result = {
          ok: true,
          undoable: true,
          message: rocketState.statusNote,
          payload: { alienSlotId, traceType, revealed: revealResult || null },
        };
      }
      completeCurrentActionEffect();
    }
    renderAlienPanels();
    renderStateReadout();
    return revealResult || result;
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

    pendingActionEffectFlow.effects.push(...followups);
  }

  function onTechTileSelected(result) {
    appendResearchTechFollowupEffects(result);
    syncTechSelectionChrome();
    renderTechBoard();
    renderActionEffectBar();
    updateActionButtons();
  }

  function syncTechSelectionChrome() {
    const active = isTechTilePickingActive();
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
  }

  function cancelTechSelection() {
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

    const rocketsForPlayer = rocketActions.getRocketsForPlayer(rocketState, currentPlayer?.id);
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
    if (!isRocketOnPlanetsReference(rocket)) return color.rocketAsset;

    const kind = rocket.referencePlacement?.kind;
    if (kind === "orbit") return color.satelliteAsset;
    if (kind === "land" || kind === "satellite") return color.landdingAsset;
    return color.rocketAsset;
  }

  function getTokenTypeLabel(rocket) {
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
    element.classList.toggle("is-move-target", rocket.id === moveHighlightRocketId);
    element.classList.toggle(
      "is-move-selectable",
      rocket.playerId === getCurrentPlayer().id
        && rocketActions.isControllablePlayerRocket(rocket),
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
      || handScanPickIndex != null
      || cardCornerActionEnabled;
    const currentCredits = Number(currentPlayer.resources?.credits) || 0;

    els.playerHandPanel.classList.toggle("is-empty", hand.length === 0);
    els.playerHandPanel.classList.toggle("card-corner-action-ready", Boolean(cardCornerAction));
    layoutPlayerHandFan(hand.length);
    els.playerHandFan.replaceChildren(...hand.map((card, index) => {
      const label = card.cardName || (card.faceUp ? `手牌 ${index + 1}` : `手牌背面 ${index + 1}`);

      if (handPickActive && !(handScanPickIndex != null && index !== handScanPickIndex)) {
        const price = getCardPrice(card);
        const affordable = currentCredits >= price;
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
        } else {
          button.classList.add(affordable ? "is-playable" : "is-unaffordable");
          button.setAttribute("aria-label", `${label}，费用 ${price} 信用点`);
          button.title = affordable
            ? `打出 ${label}，支付 ${price} 信用点`
            : `信用点不足，需要 ${price}`;
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
    if (!els.reservedCardFan || !els.reservedCardPanel) return;

    const currentPlayer = getCurrentPlayer();
    const reservedCards = Array.isArray(currentPlayer.reservedCards) ? currentPlayer.reservedCards : [];
    const readyByCardId = new Map(getReadyCardTasks().map((ready) => [ready.card?.id, ready]));
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
        && getCurrentInitialSelectionCards(currentPlayer).length === 0,
    );

    if (isInitialSelectionActive()) {
      els.reservedCardFan.replaceChildren();
      return;
    }

    const taskCards = [];
    const finalTaskCards = [];
    reservedCards.forEach((card, index) => {
      const entry = { card, index };
      if (getCardTypeCode(card) === 3) {
        finalTaskCards.push(entry);
      } else {
        taskCards.push(entry);
      }
    });

    const taskRow = createReservedCardRow("task", "1、2型任务牌");
    taskRow.replaceChildren(...taskCards.map((entry, rowIndex) => (
      createReservedCardButton(entry.card, entry.index, rowIndex, readyByCardId)
    )));

    const finalRow = createReservedCardRow("final", "3型终局计分牌");
    finalRow.replaceChildren(...finalTaskCards.map((entry, rowIndex) => (
      createReservedCardButton(entry.card, entry.index, rowIndex, readyByCardId)
    )));

    els.reservedCardFan.replaceChildren(taskRow, finalRow);
    layoutReservedCardRows();
  }

  function createReservedCardRow(rowType, label) {
    const row = document.createElement("div");
    row.className = `reserved-card-row reserved-card-row-${rowType}`;
    row.dataset.reservedRow = rowType;
    row.setAttribute("aria-label", label);
    return row;
  }

  function createReservedCardButton(card, originalIndex, rowIndex, readyByCardId) {
    const ready = readyByCardId.get(card.id);
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
      return;
    }

    const selectedCards = getCurrentInitialSelectionCards(currentPlayer);
    if (!selectedCards.length) {
      els.initialSelectionArea.hidden = true;
      els.initialSelectionArea.replaceChildren();
      return;
    }

    els.initialSelectionArea.hidden = false;
    const summary = document.createElement("div");
    summary.className = "initial-selection-company-slot";
    const [companyCard] = selectedCards;
    summary.replaceChildren(createInitialSelectionImage(companyCard, "summary"));
    els.initialSelectionArea.replaceChildren(summary);
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
    const income = currentPlayer.income || players.DEFAULT_INCOME;
    const limits = players.RESOURCE_LIMITS;
    const finalScoreBreakdown = endGameScoring?.computePlayerFinalScore
      ? endGameScoring.computePlayerFinalScore({
        currentPlayer,
        finalScoringState,
        nebulaDataState,
        alienGameState,
        planetStatsState,
        cardEffects,
        getCardTypeCode,
      })
      : { totalScore: resources.score };

    syncFinalScorePendingMarks();
    renderFinalScoreBoard();

    const stats = [
      createPlayerNameStat(currentPlayer, resources.score, finalScoreBreakdown.totalScore),
      createStatSeparator(),
      createStatIcon("信用点", resources.credits, RESOURCE_ICON_SRC.credits),
      createStatIcon("能量", resources.energy, RESOURCE_ICON_SRC.energy),
      createStatIcon("宣传", `${resources.publicity}/${limits.publicity}`, RESOURCE_ICON_SRC.publicity),
      createStatIcon("可用数据", `${resources.availableData}/${limits.availableData}`, RESOURCE_ICON_SRC.data),
      createStatIcon("额外公共扫描", resources.additionalPublicScan || 0, RESOURCE_ICON_SRC.additionalPublicScan),
      createStatSeparator(),
      createStatIconMarker("收入", RESOURCE_ICON_SRC.income),
      createStatIcon("收入信用点", income.credits || 0, RESOURCE_ICON_SRC.credits),
      createStatIcon("收入能量", income.energy || 0, RESOURCE_ICON_SRC.energy),
      createStatIcon("收入手牌", income.handSize || 0, RESOURCE_ICON_SRC.incomeCard),
      createStatIcon("收入宣传", income.publicity || 0, RESOURCE_ICON_SRC.publicity),
      createStatIcon("收入数据", income.availableData || 0, RESOURCE_ICON_SRC.data),
      createStatIcon("收入额外公共扫描", income.additionalPublicScan || 0, RESOURCE_ICON_SRC.additionalPublicScan),
    ];

    els.playerStats.replaceChildren(...stats);
    updatePlayerHandPanelTitle();
    renderPlayerHand();
    renderReservedCards();
    renderPlayerDataBoard();
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
        nebulaDataState,
        alienGameState,
        planetStatsState,
        cardEffects,
        getCardTypeCode,
      })
      : { totalScore: resources.score, tileScore: 0, cardScore: 0 };

    return [
      "玩家状态",
      `${currentPlayer.name}(${currentPlayer.color}) 信用点=${resources.credits} 能量=${resources.energy} 宣传=${resources.publicity}/${limits.publicity} 可用数据=${resources.availableData}/${limits.availableData} 额外公共扫描=${resources.additionalPublicScan || 0} 手牌=${resources.handSize} 保留=${reservedCount} 完成任务=${currentPlayer.completedTaskCount || 0} 分数=${resources.score} 环绕=${currentPlayer.orbitCount}`,
      `终局总分=${finalScoreBreakdown.totalScore}（板块=${finalScoreBreakdown.tileScore || 0} 卡牌=${finalScoreBreakdown.cardScore || 0}）`,
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

  function clearActionPending() {
    pendingActionExecuted = false;
    pendingPassPlayerId = null;
    pendingActionHasIrreversibleCardGain = false;
  }

  function canUndoCurrentMainAction() {
    if (pendingActionHasIrreversibleCardGain) return false;
    return Boolean(pendingActionExecuted || isActionEffectFlowActive() || actionHistory.hasUndoableStep());
  }

  function canStartMainAction() {
    return !pendingActionExecuted
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
    updatePublicCardControls();
    updateActionButtons();
    renderStateReadout();
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
        forgetLastHistoryStep(HISTORY_SOURCE_QUICK);
        removeLastActionLogStep(HISTORY_SOURCE_QUICK);
      }
      if (result.ok && !quickActionHistory.hasUndoableStep()) {
        quickActionHistory.commitSession();
        clearHistoryStepOrderForSource(HISTORY_SOURCE_QUICK);
      }
      refreshAfterHistoryChange(result.ok ? result.message : "已撤销快速行动");
      return;
    }

    if (pendingActionHasIrreversibleCardGain) {
      rocketState.statusNote = "已获取卡牌，本行动不能撤销";
      updateActionButtons();
      renderStateReadout();
      return;
    }

    if (isActionEffectFlowActive()) {

      if (actionHistory.hasUndoableStep()) {
        const result = actionHistory.undoLastStep();
        if (result.ok) {
          forgetLastHistoryStep(HISTORY_SOURCE_MAIN);
          removeLastActionLogStep(HISTORY_SOURCE_MAIN);
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
      effectStepActive = false;
      clearHistoryStepOrderForSource(HISTORY_SOURCE_MAIN);
      removeActionLogStepsBySource(HISTORY_SOURCE_MAIN);
      clearActionEffectFlow();
      clearActionPending();
      refreshAfterHistoryChange(result.ok ? result.message : "已撤销当前行动");
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
    if (!rocket || !rocketActions.isControllablePlayerRocket(rocket)) {
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
    const rocketsForPlayer = rocketActions.getRocketsForPlayer(rocketState, currentPlayer.id);
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
        !pendingActionHasIrreversibleCardGain,
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
    if (isInitialSelectionActive()) {
      const reason = "请先完成初始选择";
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
      return;
    }

    const techSelectionLocked = isTechTilePickingActive();
    const cardSelectionLocked = isCardSelectionActive();
    const discardSelectionLocked = isDiscardSelectionActive();
    const playCardSelectionLocked = isPlayCardSelectionActive();
    const movePaymentLocked = isMovePaymentSelectionActive();
    const handScanLocked = isHandScanSelectionActive();
    const effectFlowLocked = isActionEffectFlowActive();
    const selectionBlockReason = techSelectionLocked
      ? "请先选择科技或点击取消"
      : handScanLocked
        ? "请先完成手牌扫描或点击取消"
        : movePaymentLocked
          ? "请先确认或取消移动"
          : playCardSelectionLocked
            ? "请先完成打牌或点击打出取消"
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

    if (effectFlowLocked || pendingActionExecuted) {
      setActionButtonState(els.actionLaunchButton, false, pendingBlockedReason);
      setActionButtonState(els.actionOrbitButton, false, pendingBlockedReason);
      setActionButtonState(els.actionLandButton, false, pendingBlockedReason);
      setActionButtonState(els.actionScanButton, false, pendingBlockedReason);
      setActionButtonState(els.actionAnalyzeButton, false, pendingBlockedReason);
      setActionButtonState(els.actionPlayCardButton, false, pendingBlockedReason);
      setActionButtonState(els.actionResearchTechButton, false, pendingBlockedReason);
      setQuickActionButtonEnabled(true);
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
      if (abilityId && result.undoable !== false) {
        recordAtomicActionHistory(actionId, result.message || actionId, result);
      } else {
        markActionPending();
      }
      handleCardTriggerEvents(result.events);
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
    if (!els.landTargetOverlay) return;
    els.landTargetOverlay.hidden = true;
    delete els.landTargetOverlay.dataset.planetId;
  }

  function openLandTargetPicker(options) {
    if (!els.landTargetOverlay || !els.landTargetSelect) {
      runAction("land", { target: options.defaultTarget || options.choices[0].target });
      return;
    }

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
    const planetId = els.landTargetOverlay?.dataset.planetId;
    const choiceIndex = Number(els.landTargetSelect?.value);
    const options = actions.getLandOptions(createActionContext());
    if (!options.ok || !options.choices?.length) {
      closeLandTargetPicker();
      rocketState.statusNote = options.message || "登陆目标已失效";
      renderStateReadout();
      return;
    }

    const choice = options.choices[choiceIndex] || options.choices[0];
    closeLandTargetPicker();
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
    randomizePlayerTurnOrder();
    randomizeWheels();
    randomizeSectors();
    fillNebulaDataBoard({ source: "setup", replace: true });
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
    }

    const lastSettlement = rotationSettlements[rotationSettlements.length - 1];
    renderWheels();
    renderRockets();
    renderRotateStateToken();
    renderPlayerStats();
    updateActionButtons();
    renderStateReadout();
    return {
      ok: true,
      message: lastSettlement?.message || "太阳系旋转",
      payload: { rotationSettlements },
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
  els.landTargetCancel?.addEventListener("click", closeLandTargetPicker);
  els.landTargetOverlay?.addEventListener("click", (event) => {
    if (event.target === els.landTargetOverlay) closeLandTargetPicker();
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
  els.scanTargetCancel?.addEventListener("click", closeScanTargetPicker);
  els.scanTargetOverlay?.addEventListener("click", (event) => {
    if (event.target === els.scanTargetOverlay) {
      closeScanTargetPicker();
    }
  });
  els.alienTraceActions?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-alien-picker-step][data-alien-slot]");
    if (!button || button.disabled) return;

    const alienSlotId = Number(button.dataset.alienSlot);
    const pickerStep = button.dataset.alienPickerStep;
    const allowedTraceTypes = alienTracePickerState?.allowedTraceTypes || aliens.TRACE_TYPES;

    if (pickerStep === "alien") {
      if (allowedTraceTypes.length === 1) {
        confirmAlienTracePlacement(alienSlotId, allowedTraceTypes[0]);
        return;
      }
      alienTracePickerState = { ...alienTracePickerState, selectedAlienSlotId: alienSlotId };
      renderAlienTracePickerColorStep(alienSlotId);
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
    handleCardTriggerEvents(result.events);
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
  els.debugAlienTraceButton?.addEventListener("click", openAlienTracePicker);
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
  els.playCardActionButton?.addEventListener("click", cancelPlayCardSelection);
  els.cardCornerActionButton?.addEventListener("click", confirmCardCornerQuickAction);
  els.handScanCancel?.addEventListener("click", cancelHandScanSelection);
  els.reservedCardFan?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-reserved-index]");
    if (!button || button.disabled) return;
    const currentPlayer = getCurrentPlayer();
    const card = currentPlayer?.reservedCards?.[Number(button.dataset.reservedIndex)];
    if (card) openCardTaskCompletionPicker(card);
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
    if (isPlayCardSelectionActive()) {
      handleHandCardPlay(Number(button.dataset.handIndex));
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
  aliens.bindAlienTraceDragging({
    onPositionChange: (payload) => {
      console.info("[外星人痕迹坐标]", payload.message);
      renderStateReadout();
    },
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
    getAlienState: () => structuredClone(alienGameState),
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
      renderAlienPanels();
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
      renderAlienPanels();
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
    getActionLog: () => structuredClone(actionLogState.entries),
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
