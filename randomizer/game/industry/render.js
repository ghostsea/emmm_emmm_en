(function (root, factory) {
  "use strict";

  let placement = root.SetiIndustryPlacement;
  let passives = root.SetiIndustryPassives;

  if (typeof require === "function") {
    placement = placement || require("./placement");
    passives = passives || require("./passives");
  }

  const api = factory(placement, passives);

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.SetiIndustryRender = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function (placement, passives) {
  "use strict";

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

  return Object.freeze({
    mountStrategyPassiveLayer,
    mountHeliosPassiveLayer,
  });
});
