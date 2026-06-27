(function (root, factory) {
  "use strict";

  let placement = root.SetiIndustryPlacement;
  let passives = root.SetiIndustryPassives;
  let state = root.SetiIndustryState;

  if (typeof require === "function") {
    placement = placement || require("./placement");
    passives = passives || require("./passives");
    state = state || require("./state");
  }

  const api = factory(placement, passives, state);

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.SetiIndustryRender = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function (placement, passives, state) {
  "use strict";

  const ALIEN_LAB_PANEL_ASSETS = Object.freeze({
    blue: Object.freeze({
      front: "../assets/industry/yx_blue.png",
      back: "../assets/industry/yx_blue_back.png",
      label: "蓝色发射板块",
    }),
    yellow: Object.freeze({
      front: "../assets/industry/yx_yellow.png",
      back: "../assets/industry/yx_yellow_back.png",
      label: "黄色扫描板块",
    }),
    pink: Object.freeze({
      front: "../assets/industry/yx_pink.png",
      back: "../assets/industry/yx_pink_back.png",
      label: "粉色科技板块",
    }),
  });

  const FUTURE_SPAN_TOKEN_SRC = "../assets/industry/wlkd_token.png";
  const TECH_TILE_SRC_PREFIX = "../assets/tech_tile/";

  function getCardLabel(card) {
    return String(card?.label || card?.name || card?.title || card?.src || "卡牌")
      .replace(/^.*[\\/]/, "")
      .replace(/\.[^.]+$/, "");
  }

  function createStrategyPassiveToken(slotId, layout, player, options) {
    const token = document.createElement("img");
    token.className = "company-strategy-passive-token";
    token.src = options.getPlayerTokenAsset?.(player) || options.tokenSrc || "";
    token.alt = "";
    token.decoding = "async";
    token.draggable = false;
    token.dataset.strategySlot = slotId;
    token.setAttribute(
      "aria-label",
      `宇宙战略集团 ${placement.getStrategyPassiveSlotLabel(slotId)}奖励槽标记`,
    );
    token.style.left = `${layout.percentX}%`;
    token.style.top = `${layout.percentY}%`;
    token.style.setProperty("--company-strategy-radius", `${layout.radiusPercent}%`);
    return token;
  }

  function createStrategyPassiveSlotHit(slotId, layout, player, options) {
    const slotLabel = placement.getStrategyPassiveSlotLabel(slotId);
    const hitArea = document.createElement("button");
    hitArea.type = "button";
    hitArea.className = `company-strategy-passive-slot-hit company-strategy-passive-slot-hit--${slotId}`;
    hitArea.dataset.strategySlot = slotId;
    hitArea.setAttribute("aria-label", `放置宇宙战略集团 ${slotLabel}奖励槽标记`);
    hitArea.title = `点击放置 ${slotLabel}奖励槽标记`;
    hitArea.style.left = `${layout.percentX}%`;
    hitArea.style.top = `${layout.percentY}%`;
    hitArea.style.setProperty("--company-strategy-radius", `${layout.radiusPercent}%`);
    if (typeof options.onSlotClick === "function") {
      hitArea.addEventListener("click", () => {
        options.onSlotClick(slotId, player);
      });
    }
    return hitArea;
  }

  function mountStrategyPassiveLayer(wrap, player, options = {}) {
    if (!wrap || !passives.shouldShowStrategyPassiveMarkers(player)) return;

    const eligibleSlotIds = new Set(options.getEligibleSlotIds?.(player) || []);
    const interactionActive = Boolean(options.isInteractionActive?.(player));

    for (const slotId of placement.STRATEGY_PASSIVE_SLOT_IDS) {
      const layout = placement.getStrategyPassiveMarkerLayout(slotId);
      if (!layout) continue;

      if (player?.industryStrategyPassiveSlots?.[slotId]) {
        wrap.append(createStrategyPassiveToken(slotId, layout, player, options));
      } else if (interactionActive && eligibleSlotIds.has(slotId)) {
        wrap.append(createStrategyPassiveSlotHit(slotId, layout, player, options));
      }
    }
  }

  function createHeliosPassiveToken(slotId, layout, player, options) {
    const token = document.createElement("img");
    token.className = "company-helios-passive-token";
    token.src = options.getPlayerTokenAsset?.(player) || options.tokenSrc || "";
    token.alt = "";
    token.decoding = "async";
    token.draggable = false;
    token.dataset.heliosSlot = slotId;
    token.setAttribute(
      "aria-label",
      `赫利昂联合体 ${placement.getHeliosPassiveSlotLabel(slotId)}奖励槽标记`,
    );
    token.style.left = `${layout.percentX}%`;
    token.style.top = `${layout.percentY}%`;
    token.style.setProperty("--company-helios-radius", `${layout.radiusPercent}%`);
    return token;
  }

  function mountHeliosPassiveLayer(wrap, player, options = {}) {
    if (!wrap || !passives.shouldShowHeliosPassiveMarkers(player)) return;

    for (const slotId of placement.HELIOS_PASSIVE_SLOT_IDS) {
      const layout = placement.getHeliosPassiveMarkerLayout(slotId);
      if (!layout) continue;

      if (player?.industryHeliosPassiveSlots?.[slotId]) {
        wrap.append(createHeliosPassiveToken(slotId, layout, player, options));
      }
    }
  }

  function getTuringBorrowedTechTileId(player, options = {}) {
    const roundNumber = options.roundNumber ?? options.turnState?.roundNumber;
    const turnNumber = options.turnNumber ?? options.turnState?.turnNumber;
    return passives.getBorrowedTechTileId?.(player, roundNumber, turnNumber) || null;
  }

  function mountTuringBorrowLayer(wrap, player, options = {}) {
    if (!wrap) return;
    const tileId = getTuringBorrowedTechTileId(player, options);
    if (!tileId) return;

    const layer = document.createElement("div");
    layer.className = "company-turing-borrow-layer";
    layer.setAttribute("aria-label", `图灵系统当前回合借用科技 ${tileId}`);

    const image = document.createElement("img");
    image.className = "company-turing-borrow-tile";
    image.src = options.getTechTileSrc?.(tileId) || `${TECH_TILE_SRC_PREFIX}${tileId}.png`;
    image.alt = "";
    image.decoding = "async";
    image.draggable = false;
    image.title = `图灵系统：当前回合借用 ${tileId}`;
    layer.append(image);
    wrap.append(layer);
  }

  function mountAlienLabLayer(wrap, player, options = {}) {
    if (!wrap || !passives.shouldShowAlienLabPanels(player)) return;

    const panelStrip = document.createElement("div");
    panelStrip.className = "company-alien-lab-panel-strip";
    const permanentPanels = passives.hasPermanentAlienLabPanels?.(player) === true;
    panelStrip.setAttribute("aria-label", permanentPanels ? "作弊实验室永久板块" : "异星实验室板块");

    for (const panelId of state.ALIEN_LAB_PANEL_IDS || []) {
      const asset = ALIEN_LAB_PANEL_ASSETS[panelId];
      if (!asset) continue;
      const faceUp = permanentPanels || state.isAlienLabPanelFaceUp?.(player, panelId) !== false;
      const panelButton = document.createElement("button");
      panelButton.type = "button";
      panelButton.className = `company-alien-lab-panel-button company-alien-lab-panel-button--${panelId}`;
      panelButton.classList.toggle("is-face-up", faceUp);
      panelButton.disabled = !faceUp;
      panelButton.dataset.alienLabPanel = panelId;
      panelButton.title = faceUp
        ? `${asset.label}：${permanentPanels ? "永久正面，" : ""}点击执行对应主要行动`
        : `${asset.label}：背面，获取对应颜色外星痕迹后恢复`;
      panelButton.setAttribute("aria-label", panelButton.title);

      const panel = document.createElement("img");
      panel.className = `company-alien-lab-tile company-alien-lab-tile--${panelId}`;
      panel.src = faceUp ? asset.front : asset.back;
      panel.alt = "";
      panel.decoding = "async";
      panel.draggable = false;
      panelButton.append(panel);
      if (faceUp && typeof options.onPanelClick === "function") {
        panelButton.addEventListener("click", () => options.onPanelClick(panelId, player));
      }
      panelStrip.append(panelButton);
    }

    wrap.append(panelStrip);
  }

  function createFutureSpanToken(player, options, stateText) {
    const tokenElement = document.createElement("button");
    tokenElement.type = "button";
    tokenElement.className = "company-future-span-token-button";
    tokenElement.dataset.futureSpanToken = "true";
    tokenElement.disabled = Boolean(options.tokenDisabled);
    tokenElement.title = options.tokenTitle || "放置未来跨度专属标记";
    tokenElement.setAttribute("aria-label", stateText || tokenElement.title);
    const token = document.createElement("img");
    token.className = "company-future-span-token";
    token.src = options.futureSpanTokenSrc || FUTURE_SPAN_TOKEN_SRC;
    token.alt = "";
    token.decoding = "async";
    token.draggable = false;
    tokenElement.append(token);
    if (!tokenElement.disabled && typeof options.onTokenClick === "function") {
      tokenElement.addEventListener("click", () => options.onTokenClick(player));
    }
    return tokenElement;
  }

  function createFutureSpanCardButton(player, futureState, options) {
    const card = futureState?.card;
    if (!card) return null;

    const ready = state.isFutureSpanCardReady?.(player) === true;
    const playing = Boolean(futureState.playing);
    const targetScore = state.getFutureSpanTargetScore?.(player);
    const cardButton = document.createElement("button");
    cardButton.type = "button";
    cardButton.className = "company-future-span-card";
    if (options.cardSelected) cardButton.classList.add("is-selected");
    cardButton.dataset.futureSpanCard = "true";
    cardButton.disabled = !ready || playing || !options.cardSelectable;
    cardButton.title = ready && !playing
      ? `选择未来跨度目标牌：${getCardLabel(card)}`
      : `未来跨度目标：${Number.isFinite(Number(targetScore)) ? `${targetScore} 分` : "未设定"}`;
    cardButton.setAttribute("aria-label", cardButton.title);

    const image = document.createElement("img");
    image.className = "company-future-span-card-image";
    image.src = options.getCardImageSrc?.(card) || card.src || card.image || "";
    image.alt = "";
    image.decoding = "async";
    image.draggable = false;
    cardButton.append(image);

    if (Number.isFinite(Number(targetScore)) && !playing) {
      const badge = document.createElement("span");
      badge.className = "company-future-span-target";
      badge.textContent = String(targetScore);
      cardButton.append(badge);
    }

    if (!cardButton.disabled && typeof options.onCardClick === "function") {
      cardButton.addEventListener("click", () => options.onCardClick(card, player));
    }

    return cardButton;
  }

  function mountFutureSpanLayer(wrap, player, options = {}) {
    if (!wrap || !passives.shouldShowFutureSpanPanel(player)) return;

    const futureState = state.ensureFutureSpanState?.(player);
    const layer = document.createElement("div");
    layer.className = "company-future-span-layer";
    layer.setAttribute("aria-label", "未来跨度研究所专属标记");

    if (futureState?.card) {
      layer.classList.add("has-future-card");
      if (state.isFutureSpanCardReady?.(player)) layer.classList.add("is-ready");
      if (futureState.playing) layer.classList.add("is-playing");
      const cardButton = createFutureSpanCardButton(player, futureState, options);
      if (cardButton) layer.append(cardButton);
    } else {
      const token = createFutureSpanToken(
        player,
        {
          ...options,
          tokenDisabled: !options.tokenEnabled,
          tokenTitle: options.tokenTitle || "点击扣下一张手牌并设定目标分",
        },
        options.tokenEnabled ? "放置未来跨度专属标记" : "未来跨度专属标记不可用",
      );
      layer.append(token);
    }

    wrap.append(layer);
  }

  return Object.freeze({
    ALIEN_LAB_PANEL_ASSETS,
    FUTURE_SPAN_TOKEN_SRC,
    mountStrategyPassiveLayer,
    mountHeliosPassiveLayer,
    mountTuringBorrowLayer,
    mountAlienLabLayer,
    mountFutureSpanLayer,
  });
});
