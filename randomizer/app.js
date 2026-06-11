(function () {
  "use strict";

  const solar = window.SetiSolarSystem;
  const players = window.SetiPlayers;
  const rocketActions = window.SetiRocketActions;
  const planetStats = window.SetiPlanetStats;
  const planetReferenceLayout = window.SetiPlanetReferenceLayout;
  const actions = window.SetiActions;
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
  });
  const INCOME_GAIN_LABELS = Object.freeze({
    credits: "信用点",
    energy: "能量",
    handSize: "手牌",
    publicity: "宣传",
    availableData: "数据",
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
  const playerState = players.createPlayerState({
    currentPlayer: { color: players.DEFAULT_PLAYER_COLOR },
  });
  const rocketState = rocketActions.createRocketState();
  const planetStatsState = planetStats.createPlanetStatsState();
  const techGameState = tech.createState();
  const cardState = cards.createCardState();
  let pendingDiscardAction = null;
  let pendingCardSelectionAction = null;
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
    actionLaunchButton: document.getElementById("action-launch-button"),
    actionOrbitButton: document.getElementById("action-orbit-button"),
    actionLandButton: document.getElementById("action-land-button"),
    actionAnalyzeButton: document.getElementById("action-analyze-button"),
    actionResearchTechButton: document.getElementById("action-research-tech-button"),
    actionQuickButton: document.getElementById("action-quick-button"),
    quickActionsPanel: document.getElementById("quick-actions-panel"),
    quickActionsTrades: document.getElementById("quick-actions-trades"),
    quickPlaceDataButton: document.getElementById("quick-place-data-button"),
    dataPlaceOverlay: document.getElementById("data-place-overlay"),
    dataPlaceSubtitle: document.getElementById("data-place-subtitle"),
    dataPlaceActions: document.getElementById("data-place-actions"),
    dataPlaceCancel: document.getElementById("data-place-cancel"),
    quickMoveRocketSelect: document.getElementById("quick-move-rocket-select"),
    quickMovePad: document.getElementById("quick-move-pad"),
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
    debugRotateButton: document.getElementById("debug-rotate-button"),
    debugIncomeButton: document.getElementById("debug-income-button"),
    debugIncomeEffectButton: document.getElementById("debug-income-effect-button"),
    debugResolveIncomeButton: document.getElementById("debug-resolve-income-button"),
    debugPickCardButton: document.getElementById("debug-pick-card-button"),
    debugDiscardCardButton: document.getElementById("debug-discard-card-button"),
    debugGainDataButton: document.getElementById("debug-gain-data-button"),
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
    discardSelectionBackdrop: document.getElementById("discard-selection-backdrop"),
    discardSelectionCancel: document.getElementById("discard-selection-cancel"),
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
    const currentPlayer = getCurrentPlayer();
    if (!currentPlayer) return;

    currentPlayer.hand = [];
    currentPlayer.resources.handSize = 0;
    cardState.publicCards = Array.from({ length: cards.PUBLIC_CARD_COUNT }, () => null);
    cardState.discardPile = [];
    cards.setSelectionActive(cardState, false);
    cards.initializeDeck(cardState, playerState, {
      player: currentPlayer,
      handCount,
    });
    cards.ensurePublicCardsFilled(cardState, playerState);
  }

  function isCardSelectionActive() {
    return cards.isSelectionActive(cardState);
  }

  function isDiscardSelectionActive() {
    return cards.isDiscardSelectionActive(cardState);
  }

  function allowsBlindDrawInSelection() {
    return pendingCardSelectionAction?.allowBlindDraw !== false;
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

  function beginDiscardSelection(count, pendingAction = null) {
    if (isTechActionSelectionActive()) {
      return { ok: false, message: "请先完成科技选择" };
    }
    if (isCardSelectionActive()) {
      return { ok: false, message: "请先完成精选" };
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
      const tradeResult = quickTrades.finalizeTradeAfterDiscard(
        pending.tradeId,
        createActionContext(),
        pending.player || getCurrentPlayer(),
      );
      rocketState.statusNote = tradeResult.ok
        ? tradeResult.message
        : (tradeResult.message || "交易失败");
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

  function beginCardSelection(pendingAction = null) {
    if (isTechActionSelectionActive()) {
      return { ok: false, message: "请先完成科技选择" };
    }
    if (isDiscardSelectionActive()) {
      return { ok: false, message: "请先完成弃牌" };
    }

    pendingCardSelectionAction = pendingAction;
    cards.setSelectionActive(cardState, true);
    rocketState.statusNote = allowsBlindDrawInSelection()
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
    tech.cancelPendingTake(techGameState);
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

    const result = tech.confirmBlueSlotChoice(createActionContext(), techGameState, tileId, blueSlot);
    return finalizeTechTakeResult(result);
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

    const result = tech.requestTakeTech(createActionContext(), techGameState, tileId);
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
    return finalizeTechTakeResult(result);
  }

  function setCheatModeOpen(open) {
    tech.setCheatModeEnabled(techGameState, open);
    els.debugCheatButton?.setAttribute("aria-pressed", String(open));
    rocketState.statusNote = open ? "作弊模式：研究科技不消耗宣传" : "";
    renderStateReadout();
  }

  function toggleCheatMode() {
    setCheatModeOpen(!techGameState.ui.cheatModeEnabled);
  }

  function researchTechForCurrentPlayer() {
    return runAction("researchTech");
  }

  function getCurrentPlayer() {
    return players.getCurrentPlayer(playerState);
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

  function layoutPlayerHandFan(cardCount) {
    const fan = els.playerHandFan;
    if (!fan) return;

    const cardHeight = getPublicCardHeight() || 166;
    const cardWidth = cardHeight * (747 / 1040);
    const fanPadding = 36;
    const hoverRoom = 24;
    const minStackStep = Math.round(cardWidth * 0.26);
    const count = Number.isInteger(cardCount)
      ? cardCount
      : fan.querySelectorAll(".player-hand-card-button, .player-hand-card").length;

    fan.style.setProperty("--card-height", `${cardHeight}px`);
    fan.style.setProperty("--card-width", `${cardWidth}px`);
    fan.style.minHeight = `${cardHeight + fanPadding + hoverRoom}px`;
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

  function renderPlayerHand() {
    if (!els.playerHandFan || !els.playerHandPanel) return;

    const currentPlayer = getCurrentPlayer();
    const hand = Array.isArray(currentPlayer.hand) ? currentPlayer.hand : [];
    const discardActive = isDiscardSelectionActive();

    els.playerHandPanel.classList.toggle("is-empty", hand.length === 0);
    layoutPlayerHandFan(hand.length);
    els.playerHandFan.replaceChildren(...hand.map((card, index) => {
      const label = card.cardName || (card.faceUp ? `手牌 ${index + 1}` : `手牌背面 ${index + 1}`);

      if (discardActive) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "player-hand-card-button";
        button.style.setProperty("--card-index", String(index + 1));
        button.dataset.handIndex = String(index);
        button.classList.add("is-selectable");
        button.setAttribute("aria-label", label);

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
      createStatIcon("手牌", resources.handSize, RESOURCE_ICON_SRC.card),
      createStatSeparator(),
      createStatIconMarker("收入", RESOURCE_ICON_SRC.income),
      createStatIcon("收入信用点", income.credits || 0, RESOURCE_ICON_SRC.credits),
      createStatIcon("收入能量", income.energy || 0, RESOURCE_ICON_SRC.energy),
      createStatIcon("收入手牌", income.handSize || 0, RESOURCE_ICON_SRC.incomeCard),
      createStatIcon("收入宣传", income.publicity || 0, RESOURCE_ICON_SRC.publicity),
      createStatIcon("收入数据", income.availableData || 0, RESOURCE_ICON_SRC.data),
    ];

    els.playerStats.replaceChildren(...stats);
    renderPlayerHand();
    renderPlayerDataBoard();
  }

  function getPlayerReadoutLines() {
    const currentPlayer = getCurrentPlayer();
    const resources = currentPlayer.resources;
    const income = currentPlayer.income || players.DEFAULT_INCOME;
    const limits = players.RESOURCE_LIMITS;

    return [
      "玩家状态",
      `${currentPlayer.name}(${currentPlayer.color}) 信用点=${resources.credits} 能量=${resources.energy} 宣传=${resources.publicity}/${limits.publicity} 可用数据=${resources.availableData}/${limits.availableData} 手牌=${resources.handSize} 分数=${resources.score} 环绕=${currentPlayer.orbitCount}`,
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
      planetStatsState,
      techBoardState: techGameState.board,
      techUiState: techGameState.ui,
      techGameState,
      getEarthSectorCoordinate,
      getPlanetLocations: () => solar.createSolarSnapshot(solarState).planetLocations,
      rotateSolarOrbit: (count) => rotateSolarOrbit(count),
      drawBasicCardToPlayer: (player) => drawBasicCardToPlayer(player),
      drawBasicCard: () => drawCardForCurrentPlayer(),
      blindDrawCard: (player) => blindDrawCardForPlayer(player),
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
    button.disabled = !enabled;
    button.classList.toggle("action-button-ready", enabled);
    button.title = enabled ? "" : (reason || "当前无法执行此行动");
    button.setAttribute("aria-disabled", String(!enabled));
  }

  function setQuickActionButtonEnabled(enabled, reason) {
    els.actionQuickButton.disabled = !enabled;
    els.actionQuickButton.title = enabled ? "" : (reason || "当前无法执行此行动");
    els.actionQuickButton.setAttribute("aria-disabled", String(!enabled));
  }

  function updateActionButtons() {
    const context = createActionContext();
    const techSelectionLocked = isTechActionSelectionActive();
    const cardSelectionLocked = isCardSelectionActive();
    const discardSelectionLocked = isDiscardSelectionActive();
    const selectionBlockReason = techSelectionLocked
      ? "请先拿取科技或点击取消"
      : discardSelectionLocked
        ? "请先完成弃牌或点击取消"
        : "请先完成精选或点击取消";

    if (techSelectionLocked || cardSelectionLocked || discardSelectionLocked) {
      setActionButtonState(els.actionLaunchButton, false, selectionBlockReason);
      setActionButtonState(els.actionOrbitButton, false, selectionBlockReason);
      setActionButtonState(els.actionLandButton, false, selectionBlockReason);
      setActionButtonState(els.actionAnalyzeButton, false, selectionBlockReason);
      setActionButtonState(els.actionResearchTechButton, false, selectionBlockReason);
      setQuickActionButtonEnabled(false, selectionBlockReason);
      renderQuickMoveRocketOptions();
      updateQuickMoveControls();
      updateQuickPanel();
      return;
    }

    const launchCheck = actions.canExecute("launch", context);
    const orbitCheck = actions.canExecute("orbit", context);
    const landCheck = actions.canExecute("land", context);
    const researchTechCheck = actions.canExecute("researchTech", context);
    const analyzeCheck = data.canAnalyzeData(getCurrentPlayer());

    setActionButtonState(els.actionLaunchButton, launchCheck.ok, launchCheck.message);
    setActionButtonState(els.actionOrbitButton, orbitCheck.ok, orbitCheck.message);
    setActionButtonState(els.actionLandButton, landCheck.ok, landCheck.message);
    setActionButtonState(els.actionAnalyzeButton, analyzeCheck.ok, analyzeCheck.message);
    setActionButtonState(els.actionResearchTechButton, researchTechCheck.ok, researchTechCheck.message);
    setQuickActionButtonEnabled(true);
    renderQuickMoveRocketOptions();
    updateQuickMoveControls();
    updateQuickPanel();
  }

  function isQuickPanelOpen() {
    return !els.quickActionsPanel.hidden;
  }

  function setQuickPanelOpen(open) {
    els.quickActionsPanel.hidden = !open;
    els.actionQuickButton.setAttribute("aria-expanded", String(open));
    els.actionQuickButton.classList.toggle("action-button-ready", open);
    if (open) updateQuickPanel();
  }

  function toggleQuickPanel() {
    setQuickPanelOpen(!isQuickPanelOpen());
  }

  function getSelectedQuickMoveRocketId() {
    const value = Number(els.quickMoveRocketSelect.value);
    return Number.isInteger(value) && value > 0 ? value : null;
  }

  function renderQuickMoveRocketOptions() {
    const currentPlayer = getCurrentPlayer();
    const rocketsForPlayer = rocketActions.getRocketsForPlayer(rocketState, currentPlayer.id);
    const previous = getSelectedQuickMoveRocketId();
    const options = rocketsForPlayer.map((rocket) => {
      const option = document.createElement("option");
      option.value = String(rocket.id);
      option.textContent = formatRocketLabel(rocket);
      return option;
    });

    els.quickMoveRocketSelect.replaceChildren(...options);

    if (!options.length) {
      const emptyOption = document.createElement("option");
      emptyOption.value = "";
      emptyOption.textContent = "暂无火箭";
      els.quickMoveRocketSelect.append(emptyOption);
      els.quickMoveRocketSelect.value = "";
      els.quickMoveRocketSelect.disabled = true;
      return;
    }

    els.quickMoveRocketSelect.disabled = false;
    const keepPrevious = options.some((option) => Number(option.value) === previous);
    const fallbackId = rocketState.activeRocketId && rocketsForPlayer.some((rocket) => rocket.id === rocketState.activeRocketId)
      ? rocketState.activeRocketId
      : rocketsForPlayer[rocketsForPlayer.length - 1].id;
    els.quickMoveRocketSelect.value = String(keepPrevious ? previous : fallbackId);
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

  function updateQuickPlaceDataButton() {
    if (!els.quickPlaceDataButton) return;
    const check = data.canPlaceAnyData(getCurrentPlayer());
    els.quickPlaceDataButton.disabled = !check.ok;
    els.quickPlaceDataButton.title = check.ok ? "" : (check.message || "当前无法放置数据");
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
    const options = target === data.PLACEMENT_KIND_BLUE_BONUS
      ? { target, blueSlot: Number(blueSlot) }
      : { target: data.PLACEMENT_KIND_COMPUTER };
    const result = data.placeDataToComputer(getCurrentPlayer(), options);
    rocketState.statusNote = result.message;
    renderPlayerStats();
    updateActionButtons();
    renderStateReadout();
    return result;
  }

  function updateQuickMoveControls() {
    renderQuickMoveRocketOptions();
    const hasRocket = getSelectedQuickMoveRocketId() != null;
    els.quickMovePad.querySelectorAll("[data-move-x]").forEach((button) => {
      button.disabled = !hasRocket;
    });
  }

  function updateQuickPanel() {
    if (!isQuickPanelOpen()) return;
    updateQuickTradeButtons();
    updateQuickPlaceDataButton();
    updateQuickMoveControls();
  }

  function runPlaceDataToComputer() {
    openDataPlacePicker();
  }

  function analyzeDataForCurrentPlayer() {
    const result = data.analyzeData(getCurrentPlayer());
    rocketState.statusNote = result.message;
    renderPlayerStats();
    updateActionButtons();
    renderStateReadout();
    return result;
  }

  function runQuickTrade(tradeId) {
    const result = quickTrades.executeTrade(tradeId, createActionContext());
    if (!result.ok) {
      rocketState.statusNote = result.message;
      renderPlayerStats();
      updateActionButtons();
      renderStateReadout();
      return result;
    }

    if (result.awaitingDiscard) {
      rocketState.statusNote = result.message;
      renderStateReadout();
      return result;
    }

    rocketState.statusNote = result.message;
    renderPlayerStats();
    renderPublicCards();
    updatePublicCardControls();
    updateActionButtons();
    renderStateReadout();
    return result;
  }

  function runAction(actionId, actionOptions) {
    const result = actions.execute(actionId, createActionContext(), actionOptions);

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
    });
    for (let index = 0; index < players.RESOURCE_LIMITS.availableData; index += 1) {
      data.gainData(currentPlayer, { source: "debug" });
    }
    rocketState.statusNote = "调试收入 +100信用点 +100能量 +10宣传 +6数据";
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

  function moveRocket(deltaX, deltaY, rocketId) {
    const selectedRocketId = rocketId ?? getSelectedQuickMoveRocketId() ?? rocketState.activeRocketId;
    if (!selectedRocketId) {
      rocketState.statusNote = "请先选择要移动的火箭";
      renderStateReadout();
      return { ok: false, rocket: null, message: rocketState.statusNote };
    }

    const result = rocketActions.moveRocket(rocketState, selectedRocketId, deltaX, deltaY);
    if (result.rocket) renderRocketElement(result.rocket);
    updateActionButtons();
    renderStateReadout();
    return result;
  }

  function moveActiveRocket(deltaX, deltaY) {
    return moveRocket(deltaX, deltaY, rocketState.activeRocketId);
  }

  function placeRocketAtClientPosition(rocketId, clientX, clientY) {
    const result = isClientPositionInsidePlanetsReference(clientX, clientY)
      ? rocketActions.placeRocketAtPlanetsReferencePoint(
        rocketState,
        rocketId,
        getPlanetsReferencePointFromClientPosition(clientX, clientY),
      )
      : rocketActions.placeRocketAtBoardPoint(
        rocketState,
        rocketId,
        getBoardPointFromClientPosition(clientX, clientY),
      );

    if (result.rocket) renderRocketElement(result.rocket);
    updateActionButtons();
    renderStateReadout();
    return result;
  }

  function handleRocketPointerDown(event) {
    const rocketId = Number(event.currentTarget.dataset.rocketId);
    if (!Number.isInteger(rocketId)) return;

    const rocket = rocketState.rockets.find((item) => item.id === rocketId);
    if (!rocket || isPlanetMarkerRocket(rocket)) return;

    rocketState.activeRocketId = rocketId;
    rocketState.draggingRocketId = rocketId;
    rocketState.draggingRocketElement = event.currentTarget;
    if (event.currentTarget.setPointerCapture) {
      event.currentTarget.setPointerCapture(event.pointerId);
    }

    placeRocketAtClientPosition(rocketId, event.clientX, event.clientY);
    event.preventDefault();
  }

  function handleRocketPointerMove(event) {
    if (!rocketState.draggingRocketId) return;
    placeRocketAtClientPosition(rocketState.draggingRocketId, event.clientX, event.clientY);
  }

  function handleRocketPointerUp(event) {
    const rocketId = rocketState.draggingRocketId;
    if (!rocketId) return;

    if (rocketState.draggingRocketElement?.releasePointerCapture) {
      try {
        rocketState.draggingRocketElement.releasePointerCapture(event.pointerId);
      } catch (error) {
        // Pointer capture may already be released by the browser.
      }
    }

    rocketState.draggingRocketId = null;
    rocketState.draggingRocketElement = null;
    const rocket = rocketState.rockets.find((item) => item.id === rocketId);
    if (rocket) renderRocketElement(rocket);
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
    for (let slot = 1; slot <= 4; slot += 1) {
      const wrap = els.sectorWraps[slot];
      wrap.innerHTML = "";
      const sectorId = solarState.sectorBySlot[slot];
      if (!sectorId) continue;

      const sector = document.createElement("div");
      sector.className = `sector sector-${sectorId}`;
      wrap.appendChild(sector);
    }
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
      ...getDefaultPlanetReferencePlacementLines(),
      "",
      ...getDefaultSatelliteReferencePlacementLines(),
      "",
      ...getRocketCoordinateReadoutLines(),
      "",
      ...tech.getReadoutLines(techGameState, playerState),
      "",
      ...data.getReadoutLines(playerState),
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
  els.actionAnalyzeButton?.addEventListener("click", analyzeDataForCurrentPlayer);
  els.actionResearchTechButton?.addEventListener("click", researchTechForCurrentPlayer);
  els.techSelectionCancel?.addEventListener("click", cancelTechSelection);
  els.landTargetConfirm?.addEventListener("click", confirmLandTargetPicker);
  els.landTargetCancel?.addEventListener("click", closeLandTargetPicker);
  els.landTargetOverlay?.addEventListener("click", (event) => {
    if (event.target === els.landTargetOverlay) closeLandTargetPicker();
  });
  els.actionQuickButton.addEventListener("click", toggleQuickPanel);
  els.quickActionsTrades.addEventListener("click", (event) => {
    const button = event.target.closest("[data-quick-trade]");
    if (!button || button.disabled) return;
    runQuickTrade(button.dataset.quickTrade);
  });
  els.quickPlaceDataButton?.addEventListener("click", () => {
    if (els.quickPlaceDataButton.disabled) return;
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
  els.quickMovePad.addEventListener("click", (event) => {
    const button = event.target.closest("[data-move-x]");
    if (!button || button.disabled) return;
    moveRocket(Number(button.dataset.moveX), Number(button.dataset.moveY));
  });
  els.quickMoveRocketSelect.addEventListener("change", () => {
    const rocketId = getSelectedQuickMoveRocketId();
    if (rocketId != null) rocketActions.setActiveRocket(rocketState, rocketId);
    updateQuickMoveControls();
    renderStateReadout();
  });
  els.debugToggle.addEventListener("click", () => {
    setDebugOpen(els.appWrap.classList.contains("debug-collapsed"));
  });
  els.debugRotateButton.addEventListener("click", () => {
    rotateSolarOrbit(1);
  });
  els.debugIncomeButton.addEventListener("click", addDebugIncome);
  els.debugIncomeEffectButton?.addEventListener("click", () => beginIncomeForCurrentPlayer({ source: "debug" }));
  els.debugResolveIncomeButton?.addEventListener("click", executeIncomeForCurrentPlayer);
  els.debugGainDataButton?.addEventListener("click", addDebugData);
  els.debugPickCardButton?.addEventListener("click", beginCardSelection);
  els.publicBlindDrawButton?.addEventListener("click", handlePublicBlindDrawClick);
  els.publicCardRow?.addEventListener("click", (event) => {
    const target = event.target.closest("[data-public-slot]");
    if (!target) return;
    handlePublicCardClick(Number(target.dataset.publicSlot));
  });
  els.cardSelectionCancel?.addEventListener("click", cancelCardSelection);
  els.cardSelectionBackdrop?.addEventListener("click", cancelCardSelection);
  els.discardSelectionCancel?.addEventListener("click", cancelDiscardSelection);
  els.discardSelectionBackdrop?.addEventListener("click", cancelDiscardSelection);
  els.playerHandFan?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-hand-index]");
    if (!button) return;
    handleHandCardDiscard(Number(button.dataset.handIndex));
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
  data.bindDataTokenDragging(els.playerBoardDataLayer, {
    onPositionChange(payload) {
      rocketState.statusNote = payload.message;
      console.info("[数据校准]", payload.message);
      renderStateReadout();
    },
  });
  tech.bindSupplyTileClicks(techGameState, techRenderContext, els.techTiles, {
    onTileClick: handleSupplyTechTileClick,
  });
  els.logToggle.addEventListener("click", () => {
    setLogOpen(els.appWrap.classList.contains("log-collapsed"));
  });
  window.addEventListener("resize", resize);
  window.addEventListener("pointermove", handleRocketPointerMove);
  window.addEventListener("pointerup", handleRocketPointerUp);
  window.addEventListener("pointercancel", handleRocketPointerUp);

  setTokenAssetSizes();
  setLogOpen(false);
  initializeCardGame(10);
  renderPublicCards();
  seedDefaultReferenceRockets();
  renderRotateStateToken();
  renderPlayerStats();
  updateActionButtons();
  resize();
  renderWheels();
  renderSectors();
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
    placeDataToComputer: runPlaceDataToComputer,
    analyzeDataForCurrentPlayer,
    getDataSlotLayoutOverrides: () => structuredClone(data.listSlotLayoutOverrides()),
    drawCardForCurrentPlayer,
    blindDrawCardForPlayer,
    beginCardSelection,
    beginDiscardSelection,
    beginIncomeForCurrentPlayer,
    cancelCardSelection,
    cancelDiscardSelection,
    pickPublicCardForCurrentPlayer,
    discardCardFromCurrentPlayer,
    cardState,
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
