(function () {
  "use strict";

  const solar = window.SetiSolarSystem;
  const players = window.SetiPlayers;
  const rocketActions = window.SetiRocketActions;
  const planetStats = window.SetiPlanetStats;
  const planetReferenceLayout = window.SetiPlanetReferenceLayout;
  const actions = window.SetiActions;
  const scanEffects = window.SetiScanEffects;
  const actionHistoryModule = window.SetiActionHistory;
  const historyCommands = window.SetiHistoryCommands;
  const abilities = window.SetiAbilities;
  const quickTrades = window.SetiQuickTrades;
  const basicCards = window.SetiBasicCards;
  const cards = window.SetiCards;
  const tech = window.SetiTech;
  const data = window.SetiData;

  /** 与官网 main.js 一致的每层转盘随机偏移基数 */
  const WHEEL_OFFSETS = [0, 0, 20, 11, 4];
  const FINAL_SCORE_IDS = ["a", "b", "c", "d"];
  const ROCKET_IMAGE_SCALE = 0.104;
  const REFERENCE_ORBIT_IMAGE_SCALE = 0.0286;
  const REFERENCE_LANDDING_IMAGE_SCALE = 0.0338;
  const RESOURCE_ICON_SRC = Object.freeze({
    score: "../assets/symbol/split/seti-icons/seti-icons_r03_c04.webp",
    credits: "../assets/symbol/split/seti-icons/seti-icons_r00_c00.webp",
    energy: "../assets/symbol/split/seti-icons/seti-icons_r00_c01.webp",
    card: "../assets/symbol/split/seti-icons/seti-icons_r00_c03.webp",
    publicity: "../assets/symbol/split/seti-icons/seti-icons_r00_c04.webp",
    data: "../assets/symbol/split/seti-icons/seti-icons_r01_c00.webp",
    income: "../assets/symbol/split/seti-icons/seti-icons_r06_c04.webp",
    incomeCard: "../assets/symbol/split/seti-icons/seti-icons_r06_c01.webp",
    additionalPublicScan: "../assets/tokens/additional_public_scan.webp",
  });
  const INCOME_GAIN_LABELS = Object.freeze({
    credits: "信用点",
    energy: "能量",
    handSize: "手牌",
    publicity: "宣传",
    availableData: "数据",
    additionalPublicScan: "额外公共扫描",
  });
  const PUBLIC_SCAN_MAX_BONUS_CARDS = 2;
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
  const solarState = solar.createBaselineState();
  const nebulaDataState = data.createDefaultNebulaDataState();
  const sectorElements = {};
  const playerState = players.createPlayerState({
    players: players.PLAYER_COLOR_IDS.map((color) => ({ color })),
    currentPlayerColor: players.DEFAULT_PLAYER_COLOR,
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
  let pendingActionExecuted = false;
  let pendingActionEffectFlow = null;
  const actionHistory = actionHistoryModule.createActionHistory();
  const quickActionHistory = actionHistoryModule.createActionHistory();
  const HISTORY_SOURCE_MAIN = "main";
  const HISTORY_SOURCE_QUICK = "quick";
  const historyStepOrder = [];
  let effectStepActive = false;
  let moveHighlightRocketId = null;
  let pendingMovePayment = null;
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
    debugFillNebulaDataButton: document.getElementById("debug-fill-nebula-data-button"),
    debugSectorScanButton: document.getElementById("debug-sector-scan-button"),
    debugPublicScanButton: document.getElementById("debug-public-scan-button"),
    debugHandScanButton: document.getElementById("debug-hand-scan-button"),
    debugCheatButton: document.getElementById("debug-cheat-button"),
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
    stateReadout: document.getElementById("state-readout"),
    landTargetOverlay: document.getElementById("land-target-overlay"),
    landTargetTitle: document.getElementById("land-target-title"),
    landTargetSelect: document.getElementById("land-target-select"),
    landTargetConfirm: document.getElementById("land-target-confirm"),
    landTargetCancel: document.getElementById("land-target-cancel"),
    roundStatusToken: document.getElementById("round-status-token"),
    publicCardPanel: document.getElementById("public-card-panel"),
    publicCardRow: document.getElementById("public-card-row"),
    publicBlindDrawButton: document.getElementById("public-blind-draw-button"),
    cardSelectionBackdrop: document.getElementById("card-selection-backdrop"),
    cardSelectionCancel: document.getElementById("card-selection-cancel"),
    publicScanConfirm: document.getElementById("public-scan-confirm"),
    discardSelectionBackdrop: document.getElementById("discard-selection-backdrop"),
    discardSelectionCancel: document.getElementById("discard-selection-cancel"),
    playCardActionButton: document.getElementById("play-card-action-button"),
    movePaymentConfirm: document.getElementById("move-payment-confirm"),
    movePaymentCancel: document.getElementById("move-payment-cancel"),
    handScanCancel: document.getElementById("hand-scan-cancel"),
    playerHandPanelTitle: document.getElementById("player-hand-panel-title"),
  };

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
      player.resources.handSize = 0;
    }
    cardState.publicCards = Array.from({ length: cards.PUBLIC_CARD_COUNT }, () => null);
    cardState.discardPile = [];
    cards.setSelectionActive(cardState, false);
    cards.setPlayCardSelectionActive(cardState, false);
    cards.setDiscardSelectionActive(cardState, false, 0);
    for (const player of playerState.players) {
      cards.drawCardsToHand(cardState, playerState, player, handCount);
    }
    cards.ensurePublicCardsFilled(cardState, playerState);
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
    const remaining = cards.getDiscardRemaining(cardState);
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
    if (els.playerHandPanelTitle) {
      els.playerHandPanelTitle.textContent = active
        ? `玩家手牌区（请选择 ${remaining} 张弃牌）`
        : "玩家手牌区";
    }
    if (active) setQuickPanelOpen(false);
    renderPlayerHand();
  }

  function isHandScanSelectionActive() {
    return pendingHandScanAction != null;
  }

  function syncHandScanSelectionChrome() {
    const active = isHandScanSelectionActive();
    els.appWrap?.classList.toggle("hand-scan-selection-active", active);
    els.playerHandPanel?.classList.toggle("hand-scan-selection-active", active);
    els.playerHandPanel?.classList.toggle("player-hand-panel-focused", active);
    if (els.handScanCancel) {
      els.handScanCancel.hidden = !active;
    }
    if (els.playerHandPanelTitle) {
      els.playerHandPanelTitle.textContent = active
        ? "玩家手牌区（请选择一张牌进行扫描）"
        : "玩家手牌区";
    }
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
    return Number(card?.discardActionCode) === MOVE_DISCARD_ACTION_CODE;
  }

  function playerHasMovePaymentCard(player) {
    return (player?.hand || []).some((card) => isMovePaymentCard(card));
  }

  function canPayForMove(player) {
    const energy = Number(player?.resources?.energy) || 0;
    if (energy >= MOVE_ENERGY_COST) return { ok: true };
    if (playerHasMovePaymentCard(player)) return { ok: true };
    return { ok: false, message: "能量不足，也没有可弃置的移动牌" };
  }

  function syncMovePaymentChrome() {
    const active = isMovePaymentSelectionActive();
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
    if (els.playerHandPanelTitle && active) {
      els.playerHandPanelTitle.textContent = "玩家手牌区（可选移动牌弃置，或直接确认消耗 1 能量）";
    } else if (
      els.playerHandPanelTitle
      && !isDiscardSelectionActive()
      && !isPlayCardSelectionActive()
    ) {
      els.playerHandPanelTitle.textContent = "玩家手牌区";
    }
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

    if (isTechActionSelectionActive()) {
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
    const payCheck = canPayForMove(currentPlayer);
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
      selectedHandIndex: null,
    };
    rocketState.statusNote = "移动：选择移动牌弃置，或直接确认消耗 1 能量";
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

    pendingMovePayment.selectedHandIndex = pendingMovePayment.selectedHandIndex === index
      ? null
      : index;
    renderPlayerHand();
  }

  function confirmMovePayment() {
    if (!isMovePaymentSelectionActive()) return;

    const currentPlayer = getCurrentPlayer();
    const { deltaX, deltaY, rocketId, selectedHandIndex } = pendingMovePayment;
    let paymentNote = "";
    let handSnapshot = null;
    let discardPileSnapshot = null;
    let discardCommand = null;
    let moveOptions = null;
    if (selectedHandIndex != null) {
      const card = currentPlayer.hand[selectedHandIndex];
      if (!isMovePaymentCard(card)) {
        rocketState.statusNote = "请选择可弃置的移动牌";
        renderStateReadout();
        return;
      }

      handSnapshot = currentPlayer.hand.slice();
      discardPileSnapshot = (cardState.discardPile || []).slice();
      const discardResult = cards.discardFromHandAtIndex(currentPlayer, selectedHandIndex);
      if (!discardResult.ok) {
        rocketState.statusNote = discardResult.message;
        renderStateReadout();
        return;
      }

      cards.addToDiscardPile(cardState, discardResult.card);
      discardCommand = historyCommands.createDiscardHandCardCommand(
        cardState,
        currentPlayer,
        handSnapshot,
        discardPileSnapshot,
      );
      paymentNote = `弃掉 ${cards.getCardLabel(discardResult.card)}`;
      moveOptions = { cost: {} };
    } else if (!players.canAfford(currentPlayer, { energy: MOVE_ENERGY_COST })) {
      rocketState.statusNote = playerHasMovePaymentCard(currentPlayer)
        ? "能量不足，请选择移动牌弃置"
        : "能量不足，无法移动";
      renderStateReadout();
      return;
    } else {
      paymentNote = "消耗 1 能量";
      moveOptions = {
        cost: { energy: MOVE_ENERGY_COST },
        historyLabel: `移动消耗 ${MOVE_ENERGY_COST} 能量`,
      };
    }

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
    els.appWrap?.classList.toggle("play-card-selection-active", active);
    els.playerHandPanel?.classList.toggle("play-card-selection-active", active);
    els.playerHandPanel?.classList.toggle("player-hand-panel-focused", active);
    if (els.playCardActionButton) {
      els.playCardActionButton.hidden = !active;
      els.playCardActionButton.disabled = !active;
      els.playCardActionButton.title = active ? "点击卡牌打出，或点击此处取消" : "";
    }
    if (els.playerHandPanelTitle && !isDiscardSelectionActive()) {
      els.playerHandPanelTitle.textContent = active
        ? "玩家手牌区（点击要打出的牌）"
        : "玩家手牌区";
    }
    if (active) setQuickPanelOpen(false);
    renderPlayerHand();
  }

  function beginDiscardSelection(count, pendingAction = null) {
    if (isTechActionSelectionActive()) {
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
    };
    cards.setDiscardSelectionActive(cardState, true, discardCount);
    rocketState.statusNote = pendingAction?.type === "income"
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
    rocketState.statusNote = pending?.type === "income" ? "已取消收入" : "已取消弃牌";
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

    if (pending?.type === "income") {
      const incomeResult = applyIncomeFromCard(
        pending.player || getCurrentPlayer(),
        discardedCards[0],
      );
      rocketState.statusNote = incomeResult.ok
        ? incomeResult.message
        : (incomeResult.message || "收入失败");
      renderPlayerStats();
      renderPublicCards();
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

  function handleHandCardDiscard(handIndex) {
    if (!isDiscardSelectionActive()) return;

    const currentPlayer = getCurrentPlayer();
    const discardResult = cards.discardFromHandAtIndex(currentPlayer, handIndex);
    if (!discardResult.ok) {
      rocketState.statusNote = discardResult.message;
      renderStateReadout();
      return discardResult;
    }

    cards.addToDiscardPile(cardState, discardResult.card);
    if (pendingDiscardAction) {
      pendingDiscardAction.discarded.push(discardResult.card);
    }

    const remaining = cards.decrementDiscardRemaining(cardState);
    if (remaining <= 0) {
      const discarded = pendingDiscardAction?.discarded || [discardResult.card];
      return completeDiscardSelection(discarded);
    }

    rocketState.statusNote = `弃牌：还需选择 ${remaining} 张手牌`;
    syncDiscardSelectionChrome();
    renderStateReadout();
    return { ok: true, card: discardResult.card, remaining };
  }

  function getCardPrice(card) {
    const price = Number(card?.price);
    return Number.isFinite(price) ? Math.max(0, Math.round(price)) : 0;
  }

  function getCardTypeCode(card) {
    const typeCode = Number(card?.cardTypeCode);
    return Number.isFinite(typeCode) ? Math.round(typeCode) : 0;
  }

  function beginPlayCardSelection() {
    if (isTechActionSelectionActive()) {
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
    if (shouldReserve) {
      if (!Array.isArray(currentPlayer.reservedCards)) currentPlayer.reservedCards = [];
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
    markActionPending();
    updateActionButtons();
    renderStateReadout();
    return {
      ok: true,
      card: playedCard,
      reserved: shouldReserve,
      message: rocketState.statusNote,
    };
  }

  function beginCardSelection(pendingAction = null) {
    if (isTechActionSelectionActive()) {
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

    players.gainIncome(player, gain);
    return {
      ok: true,
      incomeCode,
      gain,
      message: `收入：弃掉 ${cards.getCardLabel(card)}，${formatIncomeGain(gain)}`,
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
      recordQuickTradeCompletion(
        pending.tradeId,
        pending.player || getCurrentPlayer(),
        pending.beforeTradeState,
      );
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
    pendingScanTargetAction = null;
    els.scanTargetOverlay.hidden = true;
    if (els.scanTargetCancel) {
      els.scanTargetCancel.hidden = false;
    }
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
    return { ok: true, message: config.subtitle || "" };
  }

  function confirmScanTarget(nebulaId, sectorX) {
    const pending = pendingScanTargetAction;
    closeScanTargetPicker();
    const scanSource = pending?.fromEffectFlow || isActionEffectFlowActive() ? "scan" : "debug";

    if (pending?.type === "sector_scan") {
      const result = replaceNebulaDataForCurrentPlayer(nebulaId, {
        prefix: `扇区${sectorX}扫描`,
        source: scanSource,
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
    if (isCardSelectionActive() || isDiscardSelectionActive() || isPlayCardSelectionActive() || isTechActionSelectionActive()) {
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
    if (isTechActionSelectionActive()) {
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
      effectStepActive = false;
    }
    actionHistory.beginSession(actionType, label);
    actionHistory.beginStep({ type: "action", label });
    effectStepActive = true;
  }

  function beginQuickActionStep(actionType, label) {
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
    if (step) rememberHistoryStep(HISTORY_SOURCE_QUICK);
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
    return null;
  }

  function recordAtomicActionHistory(actionType, label, result) {
    startPendingActionSession(actionType, label);
    recordAbilityCommands(result);
    completePendingActionStep();
  }

  function recordPlaceDataActionHistory(player, placeResult) {
    beginQuickActionStep("place-data", "放置数据");
    recordQuickHistoryCommand(historyCommands.createPlaceDataCommand(player, placeResult));
    completeQuickActionStep();
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
    if (!effectStepActive) return;
    const step = actionHistory.endStep();
    if (step) rememberHistoryStep(HISTORY_SOURCE_MAIN);
    effectStepActive = false;
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
      || (isCardSelectionActive() && pendingCardSelectionAction?.type === "public_scan")
      || (els.scanAction4Overlay && !els.scanAction4Overlay.hidden)
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
  }

  function skipCurrentActionEffect() {
    if (!pendingActionEffectFlow) return;

    const current = getCurrentActionEffect();
    if (!current || current.status !== "active") return;

    cancelActiveEffectSubFlows();
    beginEffectHistoryStep(current.label);
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
      image.src = scanEffects.EFFECT_ICONS[effect.icon] || "";
      image.alt = "";
      image.setAttribute("aria-hidden", "true");
      button.append(image);
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
    endEffectHistoryStep();
    if (status === "skipped") {
      abilities.chain.skipCurrentChainNode(pendingActionEffectFlow);
    } else {
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

  function finishActionEffectFlow() {
    if (!pendingActionEffectFlow) return;

    const actionType = pendingActionEffectFlow.actionType;
    clearActionEffectFlow();
    rocketState.statusNote = actionType === "scan" ? "扫描效果已全部处理，请确认行动" : "效果已全部处理，请确认行动";
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
    renderStateReadout();
    return result;
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
      }
      renderStateReadout();
      return result;
    }

    if (choiceId === "move") {
      return beginScanAction4FreeMove();
    }

    return { ok: false, message: "未知选择" };
  }

  function executeActionEffect(effect) {
    if (!effect || effect.status !== "active") return { ok: false, message: "当前效果不可执行" };

    switch (effect.type) {
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
    if (isActionEffectFlowActive()) {
      return { ok: false, message: "请先完成当前行动的效果" };
    }
    if (isTechActionSelectionActive()) {
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
    if (pendingActionExecuted) {
      rocketState.statusNote = "请先确认或撤销当前行动";
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
    els.buttonWrap.style.width = `${boardSize}px`;
    layoutPlayerHandFan();
    alignAlienPanelsToPlanets();
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

  function syncTechSelectionChrome() {
    const active = isTechActionSelectionActive();
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
    closeTechBlueSlotPicker();
    techGameState.ui.statusNote = "";
    rocketState.statusNote = "";
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
        return tech.resolver.canTakeTile(techGameState.board, currentPlayer.techState, tileId).ok;
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
    const result = abilities.executeAbility("researchTechSelect", createActionContext(), { tileId, blueSlot });
    rocketState.statusNote = result.message;
    renderTechBoard();
    updateActionButtons();
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
      );
      if (!canTake.ok) {
        techGameState.ui.statusNote = canTake.message;
        rocketState.statusNote = canTake.message;
        renderStateReadout();
        return canTake;
      }
    }

    const result = abilities.executeAbility("researchTechSelect", createActionContext(), { tileId });
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
    renderTechBoard();
    updateActionButtons();
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
    if (!isTechActionSelectionActive() || !techGameState.ui.selectedTileId) {
      return { ok: false, message: "没有已选择的科技" };
    }

    const result = abilities.executeAbility("researchTechCommit", createActionContext(), {
      tileId: techGameState.ui.selectedTileId,
      blueSlot: techGameState.ui.selectedBlueSlot,
    });

    if (!result.ok) {
      rocketState.statusNote = result.message;
      renderTechBoard();
      updateActionButtons();
      renderStateReadout();
      return result;
    }

    rocketState.statusNote = result.message;
    finalizeTechTakeResult(result);
    return result;
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

  function createPlayerNameStat(player, score) {
    const color = players.getPlayerColorDefinition(player.color);
    const item = document.createElement("span");
    const marker = document.createElement("span");
    const name = document.createElement("span");
    const scoreEl = createInlineIconValue("分数", score, RESOURCE_ICON_SRC.score, "player-stat-score");

    item.className = "player-stat player-stat-current";
    item.style.setProperty("--player-color", color.uiColor);
    marker.className = "player-color-marker";
    marker.setAttribute("aria-hidden", "true");
    name.className = "player-stat-value";
    name.textContent = player.name;

    item.append(marker, name, scoreEl);
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

  function renderPlayerHand() {
    if (!els.playerHandFan || !els.playerHandPanel) return;

    const currentPlayer = getCurrentPlayer();
    const hand = Array.isArray(currentPlayer.hand) ? currentPlayer.hand : [];
    const discardActive = isDiscardSelectionActive();
    const playActive = isPlayCardSelectionActive();
    const movePaymentActive = isMovePaymentSelectionActive();
    const handScanActive = isHandScanSelectionActive();
    const currentCredits = Number(currentPlayer.resources?.credits) || 0;

    els.playerHandPanel.classList.toggle("is-empty", hand.length === 0);
    layoutPlayerHandFan(hand.length);
    els.playerHandFan.replaceChildren(...hand.map((card, index) => {
      const label = card.cardName || (card.faceUp ? `手牌 ${index + 1}` : `手牌背面 ${index + 1}`);

      if (discardActive || playActive || movePaymentActive || handScanActive) {
        const price = getCardPrice(card);
        const affordable = currentCredits >= price;
        const button = document.createElement("button");
        button.type = "button";
        button.className = "player-hand-card-button";
        button.style.setProperty("--card-index", String(index + 1));
        button.dataset.handIndex = String(index);
        if (discardActive) {
          button.classList.add("is-selectable");
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
        } else if (movePaymentActive) {
          if (isMovePaymentCard(card)) {
            button.classList.add("is-move-card");
            if (pendingMovePayment?.selectedHandIndex === index) {
              button.classList.add("is-selected");
            }
            button.setAttribute("aria-label", `${label}（移动牌，点击选择弃置）`);
            button.title = "弃置此牌以支付移动";
          } else {
            button.classList.add("is-move-card-muted");
            button.disabled = true;
            button.setAttribute("aria-label", label);
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
    els.reservedCardPanel.classList.toggle("is-empty", reservedCards.length === 0);
    layoutReservedCardFan(reservedCards.length);
    els.reservedCardFan.replaceChildren(...reservedCards.map((card, index) => {
      const image = document.createElement("img");
      image.className = "player-hand-card reserved-card";
      image.src = card.src || players.CARD_BACK_SRC;
      image.alt = card.cardName || `保留牌 ${index + 1}`;
      image.width = 747;
      image.height = 1040;
      image.decoding = "async";
      image.style.setProperty("--card-index", String(index + 1));
      return image;
    }));
  }

  function renderPlayerDataBoard() {
    const currentPlayer = getCurrentPlayer();
    data.renderPlayerDataTokens(currentPlayer, els.playerBoardDataLayer);
  }

  function renderPlayerStats() {
    const currentPlayer = getCurrentPlayer();
    const resources = currentPlayer.resources;
    const income = currentPlayer.income || players.DEFAULT_INCOME;
    const limits = players.RESOURCE_LIMITS;
    const stats = [
      createPlayerNameStat(currentPlayer, resources.score),
      createStatSeparator(),
      createStatIcon("信用点", resources.credits, RESOURCE_ICON_SRC.credits),
      createStatIcon("能量", resources.energy, RESOURCE_ICON_SRC.energy),
      createStatIcon("宣传", `${resources.publicity}/${limits.publicity}`, RESOURCE_ICON_SRC.publicity),
      createStatIcon("可用数据", `${resources.availableData}/${limits.availableData}`, RESOURCE_ICON_SRC.data),
      createStatIcon("额外公共扫描", resources.additionalPublicScan || 0, RESOURCE_ICON_SRC.additionalPublicScan),
      createStatIcon("手牌", resources.handSize, RESOURCE_ICON_SRC.card),
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

    return [
      "玩家状态",
      `${currentPlayer.name}(${currentPlayer.color}) 信用点=${resources.credits} 能量=${resources.energy} 宣传=${resources.publicity}/${limits.publicity} 可用数据=${resources.availableData}/${limits.availableData} 额外公共扫描=${resources.additionalPublicScan || 0} 手牌=${resources.handSize} 保留=${reservedCount} 分数=${resources.score} 环绕=${currentPlayer.orbitCount}`,
      `收入 信用点=${income.credits || 0} 能量=${income.energy || 0} 手牌=${income.handSize || 0} 宣传=${income.publicity || 0} 数据=${income.availableData || 0}`,
    ];
  }

  function getPlanetStatsReadoutLines() {
    return [
      "星球统计",
      ...planetStats.formatPlanetStatsLines(planetStatsState),
    ];
  }

  function createActionContext() {
    return {
      solarState,
      playerState,
      cardState,
      rocketState,
      nebulaDataState,
      planetStatsState,
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
  }

  function confirmPendingAction() {
    if (isTechActionSelectionActive()) {
      commitSelectedResearchTech();
      return;
    }
    if (!pendingActionExecuted && !isActionEffectFlowActive()) return;
    endEffectHistoryStep();
    actionHistory.commitSession();
    clearHistoryStepOrderForSource(HISTORY_SOURCE_MAIN);
    clearActionEffectFlow();
    clearActionPending();
    rocketState.statusNote = "行动已确认";
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
      }
      if (result.ok && !quickActionHistory.hasUndoableStep()) {
        quickActionHistory.commitSession();
        clearHistoryStepOrderForSource(HISTORY_SOURCE_QUICK);
      }
      refreshAfterHistoryChange(result.ok ? result.message : "已撤销快速行动");
      return;
    }

    if (isActionEffectFlowActive()) {

      if (actionHistory.hasUndoableStep()) {
        const result = actionHistory.undoLastStep();
        if (result.ok) {
          forgetLastHistoryStep(HISTORY_SOURCE_MAIN);
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
    const pendingBlockedReason = "请先确认或撤销当前行动";
    const effectBlockedReason = "请先完成当前行动的效果";

    if (isTechActionSelectionActive()) {
      const hasSelection = Boolean(techGameState.ui.selectedTileId && !techGameState.ui.pendingTileId);
      setTurnActionButtonState(els.actionPassButton, false);
      setTurnActionButtonState(els.actionConfirmButton, hasSelection, hasSelection);
      setTurnActionButtonState(els.actionUndoButton, true, false);
      return hasSelection ? "请确认或取消科技选择" : "请先选择科技或点击取消";
    }

    if (isActionEffectFlowActive()) {
      setTurnActionButtonState(els.actionPassButton, false);
      setTurnActionButtonState(els.actionConfirmButton, false);
      setTurnActionButtonState(els.actionUndoButton, true, false);
      return effectBlockedReason;
    }

    if (pendingActionExecuted) {
      setTurnActionButtonState(els.actionPassButton, false);
      setTurnActionButtonState(els.actionConfirmButton, true, true);
      setTurnActionButtonState(els.actionUndoButton, true, true);
      return pendingBlockedReason;
    }

    setTurnActionButtonState(els.actionPassButton, false);
    setTurnActionButtonState(els.actionConfirmButton, false);
    setTurnActionButtonState(els.actionUndoButton, quickActionHistory.hasUndoableStep());
    return null;
  }

  function updateActionButtons() {
    const context = createActionContext();
    const techSelectionLocked = isTechActionSelectionActive();
    const cardSelectionLocked = isCardSelectionActive();
    const discardSelectionLocked = isDiscardSelectionActive();
    const playCardSelectionLocked = isPlayCardSelectionActive();
    const movePaymentLocked = isMovePaymentSelectionActive();
    const handScanLocked = isHandScanSelectionActive();
    const effectFlowLocked = isActionEffectFlowActive();
    const selectionBlockReason = techSelectionLocked
      ? "请先拿取科技或点击取消"
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

  function openDataPlacePicker() {
    if (!els.dataPlaceOverlay || !els.dataPlaceActions) return;

    const player = getCurrentPlayer();
    const check = data.canPlaceAnyData(player);
    if (!check.ok) {
      rocketState.statusNote = check.message;
      renderStateReadout();
      return;
    }

    const choices = check.choices || data.listPlaceDataChoices(player);
    if (choices.length === 1) {
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
    const options = target === data.PLACEMENT_KIND_BLUE_BONUS
      ? { target, blueSlot: Number(blueSlot) }
      : { target: data.PLACEMENT_KIND_COMPUTER };
    const result = data.placeDataToComputer(player, options);
    rocketState.statusNote = result.message;
    if (result.ok) {
      recordPlaceDataActionHistory(player, result);
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

    if (isTechActionSelectionActive()) {
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

    if (result.ok && result.markerKind) {
      if (result.removedRocketId != null) removeRocketElement(result.removedRocketId);
      syncPlanetOrbitLandMarkers();
    } else if (actionId === "researchTech") {
      if (result.awaitingTileSelection) {
        rocketState.statusNote = result.message;
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

    if (result.ok && !result.awaitingTileSelection) {
      if (abilityId && result.undoable !== false) {
        recordAtomicActionHistory(actionId, result.message || actionId, result);
      } else {
        markActionPending();
      }
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
      ? `执行收入：${summary}，${drawError}`
      : `执行收入：${summary}`;
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
    if (pendingActionEffectFlow?.freeMoveMode) return;
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
      ...getPlayerReadoutLines(),
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
    els.finalScoreTiles.forEach((img) => {
      const id = img.dataset.finalId;
      if (!id) return;
      const variant = Math.random() < 0.5 ? 1 : 2;
      img.src = `../assets/final/final_${id}${variant}.png`;
      img.alt = `终局计分 ${id.toUpperCase()}${variant}`;
    });
  }

  function randomizeAll() {
    els.spinButton.classList.remove("pulsin");
    randomizeWheels();
    randomizeSectors();
    fillNebulaDataBoard({ source: "setup", replace: true });
    randomizeFinalScores();
    tech.setupBoardBonuses(techGameState);
    renderTechBoard();
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
    solarState.rotation = solar.applySolarOrbitRotation(solarState.rotation, count || 1);
    solarState.wheelSteps = solar.rotationToWheelSteps(solarState.rotation);
    renderWheels();
    renderRotateStateToken();
    updateActionButtons();
    renderStateReadout();
  }

  els.spinButton.addEventListener("click", randomizeAll);
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
  });
  els.actionConfirmButton?.addEventListener("click", () => {
    if (els.actionConfirmButton.disabled) return;
    confirmPendingAction();
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
    if (pendingActionEffectFlow?.freeMoveMode) {
      executeFreeMoveForScanAction4(
        Number(button.dataset.moveX),
        Number(button.dataset.moveY),
        moveHighlightRocketId,
      );
      return;
    }
    moveRocket(Number(button.dataset.moveX), Number(button.dataset.moveY), moveHighlightRocketId);
  });
  els.wheelWrap.addEventListener("pointerdown", handleBoardPointerDown);
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
    rotateSolarOrbit(1);
  });
  els.debugIncomeButton.addEventListener("click", addDebugIncome);
  els.debugIncomeEffectButton?.addEventListener("click", () => beginIncomeForCurrentPlayer({ source: "debug" }));
  els.debugResolveIncomeButton?.addEventListener("click", executeIncomeForCurrentPlayer);
  els.debugGainDataButton?.addEventListener("click", addDebugData);
  els.debugFillNebulaDataButton?.addEventListener("click", fillDebugNebulaData);
  els.debugSectorScanButton?.addEventListener("click", beginSectorScan);
  els.debugPublicScanButton?.addEventListener("click", beginPublicDeckScan);
  els.debugHandScanButton?.addEventListener("click", beginHandScan);
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
  els.handScanCancel?.addEventListener("click", cancelHandScanSelection);
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
    }
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
  window.addEventListener("resize", resize);
  setTokenAssetSizes();
  setLogOpen(false);
  initializeCardGame(10);
  renderDebugPlayerSwitch();
  renderPublicCards();
  seedDefaultReferenceRockets();
  renderRotateStateToken();
  renderPlayerStats();
  updateActionButtons();
  resize();
  renderWheels();
  renderSectors();
  fillNebulaDataBoard({ source: "setup", replace: true });
  randomizeFinalScores();
  renderStateReadout();
  renderRockets();
  renderTechBoard();

  window.SetiRandomizer = {
    randomize: randomizeAll,
    rotateSolarOrbit,
    launchRocket: launchRocketForCurrentPlayer,
    orbitRocket: orbitForCurrentPlayer,
    landRocket: landForCurrentPlayer,
    addDebugIncome,
    executeIncomeForCurrentPlayer,
    addDebugData,
    fillDebugNebulaData,
    beginSectorScan,
    beginPublicDeckScan,
    beginHandScan,
    replaceNebulaDataForCurrentPlayer,
    switchCurrentPlayerColor,
    getNebulaSlotLayoutOverrides: () => structuredClone(data.listNebulaSlotLayoutOverrides()),
    placeDataToComputer: runPlaceDataToComputer,
    analyzeDataForCurrentPlayer,
    getDataSlotLayoutOverrides: () => structuredClone(data.listSlotLayoutOverrides()),
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
    confirmPendingAction,
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
    getPlanetStatsState: () => structuredClone(planetStatsState),
    getCurrentPlayer: () => structuredClone(getCurrentPlayer()),
    getState: () => structuredClone({
      ...solarState,
      players: playerState.players,
      currentPlayerId: playerState.currentPlayerId,
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
