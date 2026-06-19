(function (root, factory) {
  "use strict";

  let catalog = root.SetiIndustryCatalog;
  let placement = root.SetiIndustryPlacement;

  if (typeof require === "function") {
    catalog = catalog || require("./catalog");
    placement = placement || require("./placement");
  }

  const api = factory(catalog, placement);

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.SetiIndustryHeliosPassive = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function (catalog, placement) {
  "use strict";

  const TECH_TYPE_TO_SLOT = Object.freeze({
    orange: "orange",
    purple: "purple",
    blue: "blue",
  });

  const SLOT_REWARDS = Object.freeze({
    orange: Object.freeze({ energy: 1 }),
    purple: Object.freeze({ additionalPublicScan: 1 }),
    blue: Object.freeze({ data: 1 }),
  });

  const SLOT_EFFECT_ICONS = Object.freeze({
    orange: "energy",
    purple: "additionalPublicScan",
    blue: "data",
  });

  function playerHasHeliosPassive(player) {
    const definition = catalog.getPlayerIndustryDefinition(player);
    return Boolean(definition?.passiveIds?.includes("helios_passive_reward_slots"));
  }

  function ensureHeliosPassiveSlots(player) {
    if (!player) return null;
    if (!player.industryHeliosPassiveSlots) {
      player.industryHeliosPassiveSlots = {
        orange: false,
        purple: false,
        blue: false,
      };
    }
    return player;
  }

  function initializeHeliosPassiveMarkers(player) {
    const state = ensureHeliosPassiveSlots(player);
    if (!state) {
      return { ok: false, message: "没有玩家" };
    }
    state.industryHeliosPassiveInitialized = true;
    return {
      ok: true,
      player: state,
      message: "已初始化赫利昂联合体被动标记槽位",
    };
  }

  function clearHeliosPassiveSlots(player) {
    if (!player) return player;
    player.industryHeliosPassiveSlots = {
      orange: false,
      purple: false,
      blue: false,
    };
    return player;
  }

  function getHeliosSlotForTechType(techType) {
    return TECH_TYPE_TO_SLOT[String(techType || "")] || null;
  }

  function isHeliosPassiveSlotEmpty(player, slotId) {
    return !player?.industryHeliosPassiveSlots?.[slotId];
  }

  function canGrantHeliosPassiveReward(player, techType) {
    if (!playerHasHeliosPassive(player)) {
      return { ok: false, message: "未选择赫利昂联合体" };
    }
    const slotId = getHeliosSlotForTechType(techType);
    if (!slotId) {
      return { ok: false, message: "该科技颜色无对应奖励槽" };
    }
    if (!isHeliosPassiveSlotEmpty(player, slotId)) {
      return { ok: false, message: "该奖励槽已有标记" };
    }
    return { ok: true, slotId, message: "可以领取赫利昂被动奖励" };
  }

  function canPlaceHeliosPassiveSlot(player, slotId) {
    ensureHeliosPassiveSlots(player);
    if (!player) {
      return { ok: false, message: "没有玩家" };
    }
    if (!placement.HELIOS_PASSIVE_SLOT_IDS.includes(slotId)) {
      return { ok: false, message: "无效的奖励槽" };
    }
    if (!isHeliosPassiveSlotEmpty(player, slotId)) {
      return { ok: false, message: "该槽位已有标记" };
    }
    return { ok: true, message: "可以放置被动标记" };
  }

  function placeHeliosPassiveSlot(player, slotId) {
    const check = canPlaceHeliosPassiveSlot(player, slotId);
    if (!check.ok) return { ...check, player };

    const state = ensureHeliosPassiveSlots(player);
    state.industryHeliosPassiveSlots[slotId] = true;
    return {
      ok: true,
      player: state,
      slotId,
      message: "已放置赫利昂联合体被动标记",
    };
  }

  function buildHeliosPassiveRewardEffect(player, techType, tileId) {
    const check = canGrantHeliosPassiveReward(player, techType);
    if (!check.ok) return null;

    const slotId = check.slotId;
    const slotLabel = placement.getHeliosPassiveSlotLabel(slotId);
    return {
      id: `helios-passive-${slotId}-${tileId || techType}`,
      type: "industry_helios_passive_reward",
      icon: SLOT_EFFECT_ICONS[slotId] || "energy",
      label: `赫利昂：${slotLabel}奖励`,
      status: "pending",
      undoable: true,
      options: {
        slotId,
        techType,
        tileId: tileId || null,
      },
    };
  }

  function getHeliosSlotReward(slotId) {
    return SLOT_REWARDS[slotId] || null;
  }

  function getHeliosSlotRewardLabel(slotId) {
    const reward = getHeliosSlotReward(slotId);
    if (!reward) return "";
    if (reward.energy) return `${reward.energy} 能量`;
    if (reward.additionalPublicScan) return `${reward.additionalPublicScan} 公共牌弃牌扫描标记`;
    if (reward.data) return `${reward.data} 数据`;
    return "";
  }

  function getReadoutLines(player) {
    if (!playerHasHeliosPassive(player) || !player?.initialSelection?.industry) return [];

    const lines = ["[赫利昂联合体被动标记]"];
    for (const slotId of placement.HELIOS_PASSIVE_SLOT_IDS) {
      const layout = placement.getHeliosPassiveMarkerLayout(slotId);
      const marked = Boolean(player?.industryHeliosPassiveSlots?.[slotId]);
      lines.push(
        `  ${placement.getHeliosPassiveSlotLabel(slotId)}`
        + `${layout ? ` ${layout.percentX}%,${layout.percentY}%` : ""}`
        + ` ${marked ? "已放置" : "空"}`,
      );
    }
    return lines;
  }

  return Object.freeze({
    TECH_TYPE_TO_SLOT,
    SLOT_REWARDS,
    SLOT_EFFECT_ICONS,
    playerHasHeliosPassive,
    initializeHeliosPassiveMarkers,
    clearHeliosPassiveSlots,
    getHeliosSlotForTechType,
    isHeliosPassiveSlotEmpty,
    canGrantHeliosPassiveReward,
    canPlaceHeliosPassiveSlot,
    placeHeliosPassiveSlot,
    buildHeliosPassiveRewardEffect,
    getHeliosSlotReward,
    getHeliosSlotRewardLabel,
    getReadoutLines,
  });
});
