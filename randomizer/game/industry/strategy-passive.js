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

  root.SetiIndustryStrategyPassive = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function (catalog, placement) {
  "use strict";

  const SCAN_CODE_TO_SLOT = Object.freeze({
    0: "yellow",
    1: "red",
    2: "blue",
  });

  const SLOT_REWARDS = Object.freeze({
    yellow: Object.freeze({ credits: 1 }),
    red: Object.freeze({ publicity: 1 }),
    blue: Object.freeze({ data: 1 }),
  });

  function playerHasStrategyPassive(player) {
    const definition = catalog.getPlayerIndustryDefinition(player);
    return Boolean(definition?.passiveIds?.includes("strategy_passive_reward_slots"));
  }

  function normalizeRoundNumber(roundNumber) {
    return Math.max(0, Math.round(Number(roundNumber) || 0));
  }

  function normalizeScanActionCode(card) {
    const raw = card?.scanActionCode;
    if (raw == null || raw === "") return null;
    const code = Math.round(Number(raw));
    if (!Number.isFinite(code) || code < 0 || code > 3) return null;
    return code;
  }

  function ensureStrategyPlayInteractionFields(player) {
    if (!Number.isInteger(player.industryStrategyPlayInteractionRound)) {
      player.industryStrategyPlayInteractionRound = 0;
    }
    if (!("industryStrategyPlayScanCode" in player)) {
      player.industryStrategyPlayScanCode = null;
    }
    if (typeof player.industryStrategyPlayInteractionPending !== "boolean") {
      player.industryStrategyPlayInteractionPending = false;
    }
    return player;
  }

  /** 清除 3 槽 token；1x 快速行动调用。奖励槽本身无轮次限制，仅 token 占用阻止再次触发。 */
  function clearStrategyPassiveSlots(player) {
    if (!player) return player;
    player.industryStrategyPassiveSlots = {
      yellow: false,
      red: false,
      blue: false,
    };
    clearStrategyPlayInteraction(player);
    return player;
  }

  /** 清除「本次打牌」触发的虚线交互；新轮开始时也会清除，但不影响已放置 token。 */
  function clearStrategyPlayInteraction(player) {
    if (!player) return player;
    ensureStrategyPlayInteractionFields(player);
    player.industryStrategyPlayInteractionRound = 0;
    player.industryStrategyPlayScanCode = null;
    player.industryStrategyPlayInteractionPending = false;
    return player;
  }

  function resetStrategyPlayInteractionForRoundReset(player) {
    return clearStrategyPlayInteraction(player);
  }

  function isStrategyPassiveSlotEmpty(player, slotId) {
    return !player?.industryStrategyPassiveSlots?.[slotId];
  }

  function resolveEligibleSlotIds(player) {
    ensureStrategyPlayInteractionFields(player);
    const scanCode = player.industryStrategyPlayScanCode;
    if (scanCode == null) return [];

    if (scanCode === 3) {
      return placement.STRATEGY_PASSIVE_SLOT_IDS.filter((slotId) => isStrategyPassiveSlotEmpty(player, slotId));
    }

    const slotId = SCAN_CODE_TO_SLOT[scanCode];
    if (!slotId || !isStrategyPassiveSlotEmpty(player, slotId)) return [];
    return [slotId];
  }

  function isStrategyPlayInteractionPending(player, roundNumber) {
    if (!playerHasStrategyPassive(player)) return false;
    const round = normalizeRoundNumber(roundNumber);
    if (round <= 0) return false;
    ensureStrategyPlayInteractionFields(player);
    return player.industryStrategyPlayInteractionPending
      && player.industryStrategyPlayInteractionRound === round
      && player.industryStrategyPlayScanCode != null;
  }

  /**
   * 主行动打牌后开启虚线交互。三槽奖励无轮次上限，仅当对应槽位无 token 时可触发。
   * 公司 1x 快速行动（精选+清槽）的「每轮一次」由 industryRoundMarkRound 单独限制。
   */
  function activateStrategyPlayInteraction(player, playedCard, roundNumber) {
    if (!playerHasStrategyPassive(player) || !playedCard) {
      return { ok: false, message: "无法开启宇宙战略集团被动交互" };
    }

    const scanCode = normalizeScanActionCode(playedCard);
    if (scanCode == null) {
      return { ok: false, message: "该牌没有有效的扫描角标" };
    }

    const round = normalizeRoundNumber(roundNumber);
    ensureStrategyPlayInteractionFields(player);
    player.industryStrategyPlayInteractionRound = round;
    player.industryStrategyPlayScanCode = scanCode;

    const eligible = resolveEligibleSlotIds(player);
    player.industryStrategyPlayInteractionPending = eligible.length > 0;

    return {
      ok: true,
      player,
      roundNumber: round,
      scanCode,
      eligibleSlotIds: eligible,
      message: eligible.length
        ? "宇宙战略集团被动交互已开启"
        : "宇宙战略集团：对应奖励槽已有标记，无法交互",
    };
  }

  function isStrategyPlayInteractionActive(player, roundNumber) {
    return isStrategyPlayInteractionPending(player, roundNumber)
      && resolveEligibleSlotIds(player).length > 0;
  }

  function getStrategyPlayScanCode(player) {
    ensureStrategyPlayInteractionFields(player);
    return player.industryStrategyPlayScanCode;
  }

  function getStrategyPlayEligibleSlotIds(player, roundNumber) {
    if (!isStrategyPlayInteractionPending(player, roundNumber)) return [];
    return resolveEligibleSlotIds(player);
  }

  function getAutomaticStrategyPlaySlotId(player, roundNumber) {
    return getStrategyPlayEligibleSlotIds(player, roundNumber)[0] || null;
  }

  function canInteractStrategyPlaySlot(player, slotId, roundNumber) {
    if (!player) {
      return { ok: false, message: "没有玩家" };
    }
    if (!isStrategyPlayInteractionPending(player, roundNumber)) {
      return { ok: false, message: "当前没有可用的宇宙战略集团被动交互" };
    }
    if (!placement.STRATEGY_PASSIVE_SLOT_IDS.includes(slotId)) {
      return { ok: false, message: "无效的奖励槽" };
    }
    if (!isStrategyPassiveSlotEmpty(player, slotId)) {
      return { ok: false, message: "该槽位已有标记" };
    }

    const eligible = getStrategyPlayEligibleSlotIds(player, roundNumber);
    if (!eligible.includes(slotId)) {
      return { ok: false, message: "当前扫描角标不能标记该槽位" };
    }

    return { ok: true, message: "可以放置被动标记" };
  }

  function completeStrategyPlayInteraction(player) {
    if (!player) return player;
    clearStrategyPlayInteraction(player);
    return player;
  }

  /** 回合结束时取消尚未完成的打牌虚线交互；不影响已放置 token，下次打牌可再次触发。 */
  function expireStrategyPlayInteractionOnTurnEnd(player, roundNumber) {
    if (!isStrategyPlayInteractionActive(player, roundNumber)) {
      return { ok: false, cleared: false };
    }
    clearStrategyPlayInteraction(player);
    return { ok: true, cleared: true };
  }

  function getStrategySlotReward(slotId) {
    return SLOT_REWARDS[slotId] || null;
  }

  function getStrategySlotRewardLabel(slotId) {
    const reward = getStrategySlotReward(slotId);
    if (!reward) return "";
    if (reward.credits) return `${reward.credits} 信用点`;
    if (reward.publicity) return `${reward.publicity} 宣传`;
    if (reward.data) return `${reward.data} 数据`;
    return "";
  }

  function getReadoutLines(player, roundNumber) {
    if (!playerHasStrategyPassive(player) || !player?.initialSelection?.industry) return [];

    const lines = ["[宇宙战略集团被动标记]"];
    for (const slotId of placement.STRATEGY_PASSIVE_SLOT_IDS) {
      const layout = placement.getStrategyPassiveMarkerLayout(slotId);
      const marked = Boolean(player?.industryStrategyPassiveSlots?.[slotId]);
      lines.push(
        `  ${placement.getStrategyPassiveSlotLabel(slotId)}`
        + `${layout ? ` ${layout.percentX}%,${layout.percentY}%` : ""}`
        + ` ${marked ? "已放置" : "空"}`,
      );
    }

    if (isStrategyPlayInteractionActive(player, roundNumber)) {
      const scanCode = getStrategyPlayScanCode(player);
      const eligible = getStrategyPlayEligibleSlotIds(player, roundNumber);
      lines.push(
        `  打牌交互 轮=${roundNumber} 扫描角标=${scanCode}`
        + ` 可选=${eligible.map((id) => placement.getStrategyPassiveSlotLabel(id)).join("/") || "无"}`,
      );
    }

    return lines;
  }

  return Object.freeze({
    SCAN_CODE_TO_SLOT,
    SLOT_REWARDS,
    playerHasStrategyPassive,
    clearStrategyPassiveSlots,
    clearStrategyPlayInteraction,
    resetStrategyPlayInteractionForRoundReset,
    activateStrategyPlayInteraction,
    isStrategyPlayInteractionActive,
    getStrategyPlayScanCode,
    getStrategyPlayEligibleSlotIds,
    getAutomaticStrategyPlaySlotId,
    canInteractStrategyPlaySlot,
    completeStrategyPlayInteraction,
    expireStrategyPlayInteractionOnTurnEnd,
    getStrategySlotReward,
    getStrategySlotRewardLabel,
    getReadoutLines,
  });
});
