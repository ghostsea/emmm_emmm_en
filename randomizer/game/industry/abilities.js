(function (root, factory) {
  "use strict";

  let catalog = root.SetiIndustryCatalog;
  let passives = root.SetiIndustryPassives;

  if (typeof require === "function") {
    catalog = catalog || require("./catalog");
    passives = passives || require("./passives");
  }

  const api = factory(catalog, passives);

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.SetiIndustryAbilities = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function (catalog, passives) {
  "use strict";

  const PUBLICITY_PICK_COST = 2;
  const STRATUS_PUBLIC_CARD_LIMIT = 3;

  function isAlienCard(card) {
    const cardId = String(card?.cardId || card?.id || "");
    const src = String(card?.src || "");
    return cardId.includes("alien") || src.includes("/aliens/");
  }

  function getCornerReward(cards, card) {
    if (!cards || !card) return null;
    const resourceReward = cards.getDiscardActionRewardForCard(card);
    if (resourceReward) return { kind: "resource", ...resourceReward };
    const moveReward = cards.getDiscardActionMoveRewardForCard?.(card);
    if (moveReward) return { kind: "move", ...moveReward };
    return null;
  }

  function applyCornerReward(players, data, player, reward) {
    const results = [];
    if (!reward || !player) {
      return { ok: false, message: "没有可结算的弃牌角标奖励", results };
    }
    if (reward.kind === "resource") {
      if (reward.gain && Object.keys(reward.gain).length) {
        players.gainResources(player, reward.gain);
      }
      const dataCount = Math.max(0, Math.round(Number(reward.dataCount) || 0));
      for (let index = 0; index < dataCount; index += 1) {
        results.push(data.gainData(player, { source: "industry_corner" }));
      }
      const parts = [];
      if (reward.gain?.publicity) parts.push(`宣传+${reward.gain.publicity}`);
      if (reward.gain?.score) parts.push(`分+${reward.gain.score}`);
      if (dataCount) parts.push(`数据+${results.filter((item) => item.ok).length}`);
      return {
        ok: true,
        message: parts.length ? parts.join("、") : reward.label,
        results,
      };
    }
    if (reward.kind === "move") {
      if (reward.gain && Object.keys(reward.gain).length) {
        players.gainResources(player, reward.gain);
      }
      return {
        ok: true,
        message: reward.label,
        results,
        pendingFreeMove: {
          movementPoints: reward.movementPoints || 1,
        },
      };
    }
    return { ok: false, message: "不支持的弃牌角标奖励", results };
  }

  function applyIncomeResourcesFromCard(cards, players, data, player, card) {
    const gain = cards.getIncomeGainForCard(card);
    if (!gain) {
      return { ok: false, message: `无法识别卡牌收入：${cards.getCardLabel(card)}` };
    }
    const resourceGain = {};
    if (gain.credits) resourceGain.credits = gain.credits;
    if (gain.energy) resourceGain.energy = gain.energy;
    if (gain.publicity) resourceGain.publicity = gain.publicity;
    if (gain.availableData) {
      for (let index = 0; index < gain.availableData; index += 1) {
        data.gainData(player, { source: "industry_income" });
      }
    }
    if (gain.handSize) {
      return { ok: false, message: "任务中继站不支持盲抽收入角标" };
    }
    if (Object.keys(resourceGain).length) {
      players.gainResources(player, resourceGain);
    }
    const labels = {
      credits: "信用点",
      energy: "能量",
      publicity: "宣传",
      availableData: "数据",
    };
    const parts = Object.entries(resourceGain).map(([key, value]) => `${value}${labels[key] || key}`);
    if (gain.availableData) parts.push(`${gain.availableData}数据`);
    return {
      ok: true,
      message: parts.join("、") || "无收入资源",
      gain,
    };
  }

  function prepareActiveAbility(player, companyLabel) {
    const definition = catalog.getIndustryDefinition(companyLabel);
    if (!definition?.activeAbilityId) {
      return { ok: false, message: "该公司没有可执行的 1x 行动" };
    }
    if (catalog.SKIPPED_ACTIVE_LABELS.includes(catalog.normalizeIndustryLabel(companyLabel))) {
      return { ok: false, message: "该公司 1x 行动尚未实现" };
    }
    return { ok: true, abilityId: definition.activeAbilityId, label: definition.label };
  }

  function normalizeRoundNumber(roundNumber) {
    return Math.max(1, Math.round(Number(roundNumber) || 1));
  }

  function normalizeTurnNumber(turnNumber) {
    return Math.max(1, Math.round(Number(turnNumber) || 1));
  }

  function armAbilityState(player, abilityId, roundNumber, turnNumber = 1) {
    const round = Math.max(1, Math.round(Number(roundNumber) || 1));
    const turn = normalizeTurnNumber(turnNumber);
    if (abilityId === "sentinel_arm_play_corner") {
      player.industrySentinelArmedRound = round;
      player.industrySentinelArmedTurn = turn;
    }
    if (abilityId === "huanyu_free_moves") {
      player.industryHuanyuFreeMoveRound = round;
      player.industryHuanyuFreeMoveTurn = turn;
      player.industryHuanyuFreeMovesLeft = 2;
      player.industryHuanyuMovedRocketIds = [];
    }
    if (abilityId === "turing_borrow_tech") {
      player.industryBorrowedTechTileId = null;
      player.industryBorrowedTechRound = 0;
      player.industryBorrowedTechTurn = 0;
    }
  }

  function buildActiveAbilityFlow(player, companyLabel, roundNumber, turnNumber = 1) {
    const prepared = prepareActiveAbility(player, companyLabel);
    if (!prepared.ok) return prepared;

    const abilityId = prepared.abilityId;
    armAbilityState(player, abilityId, roundNumber, turnNumber);

    switch (abilityId) {
      case "stratus_public_corners":
        return {
          ok: true,
          abilityId,
          flowType: "stratus_public_corners",
          label: prepared.label,
          remaining: STRATUS_PUBLIC_CARD_LIMIT,
          message: `${prepared.label}：请点击公共牌区卡牌，最多结算 ${STRATUS_PUBLIC_CARD_LIMIT} 张弃牌角标（不弃牌）`,
        };
      case "turing_borrow_tech":
        return {
          ok: true,
          abilityId,
          flowType: "turing_borrow_tech",
          label: prepared.label,
          message: `${prepared.label}：请选择一项科技借用本轮效果（不获得板块与 bonus）`,
        };
      case "sentinel_arm_play_corner":
        return {
          ok: true,
          abilityId,
          flowType: "sentinel_arm_play_corner",
          label: prepared.label,
          message: `${prepared.label}：已启用本轮打牌后弃牌角标奖励`,
        };
      case "huanyu_free_moves":
        return {
          ok: true,
          abilityId,
          flowType: "huanyu_free_moves",
          label: prepared.label,
          movesLeft: 2,
          message: `${prepared.label}：请移动最多 2 枚火箭，各免费移动 1 次`,
        };
      case "helios_remove_tech_income":
        return {
          ok: true,
          abilityId,
          flowType: "helios_remove_tech",
          label: prepared.label,
          message: `${prepared.label}：请选择要移除的科技（不可选蓝色），随后增加 1 次收入`,
        };
      case "mission_publicity_pick_income": {
        if (!player?.resources || player.resources.publicity < PUBLICITY_PICK_COST) {
          return { ok: false, message: `宣传不足，需要 ${PUBLICITY_PICK_COST} 宣传` };
        }
        return {
          ok: true,
          abilityId,
          flowType: "mission_publicity_pick",
          label: prepared.label,
          publicityCost: PUBLICITY_PICK_COST,
          message: `${prepared.label}：消耗 ${PUBLICITY_PICK_COST} 宣传精选 1 张牌并获得其收入资源`,
        };
      }
      case "fenwick_publicity_pick_corner": {
        if (!player?.resources || player.resources.publicity < PUBLICITY_PICK_COST) {
          return { ok: false, message: `宣传不足，需要 ${PUBLICITY_PICK_COST} 宣传` };
        }
        return {
          ok: true,
          abilityId,
          flowType: "fenwick_publicity_pick",
          label: prepared.label,
          publicityCost: PUBLICITY_PICK_COST,
          message: `${prepared.label}：消耗 ${PUBLICITY_PICK_COST} 宣传精选 1 张牌并获得弃牌角标奖励（不弃牌）`,
        };
      }
      case "deepspace_swap_cards":
        return {
          ok: true,
          abilityId,
          flowType: "deepspace_swap",
          label: prepared.label,
          message: `${prepared.label}：请选择 1 张手牌，再选择 1 张公共牌交换`,
        };
      case "strategy_pick_card":
        return {
          ok: true,
          abilityId,
          flowType: "strategy_pick",
          label: prepared.label,
          message: `${prepared.label}：请精选 1 张公共牌`,
        };
      default:
        return { ok: false, message: `未实现的公司 1x 行动：${abilityId}` };
    }
  }

  function isSentinelPlayCornerReady(player, roundNumber, turnNumber = 1) {
    const round = normalizeRoundNumber(roundNumber);
    return player?.industrySentinelArmedRound === round
      && player?.industryRoundMarkRound === round;
  }

  function snapshotPlayedCard(card) {
    if (!card) return null;
    return {
      id: card.id,
      src: card.src,
      cardId: card.cardId,
      discardActionCode: card.discardActionCode,
      incomeActionCode: card.incomeActionCode,
    };
  }

  function shouldAppendSentinelPlayCornerEffect(cards, player, roundNumber, turnNumber, playedCard) {
    if (arguments.length === 4) {
      playedCard = turnNumber;
      turnNumber = 1;
    }
    if (!playedCard || !player) return false;
    if (!isSentinelPlayCornerReady(player, roundNumber, turnNumber)) return false;
    if (isAlienCard(playedCard)) return false;
    return Boolean(getCornerReward(cards, playedCard));
  }

  function buildSentinelPlayCornerEffectNode(cards, playedCard) {
    const reward = getCornerReward(cards, playedCard);
    if (!reward) return null;
    const cardLabel = cards.getCardLabel(playedCard);
    return {
      id: `industry-sentinel-corner-${playedCard.id || playedCard.src}`,
      type: "industry_sentinel_corner",
      label: `哨兵探测网络：${cardLabel} 弃牌角标`,
      icon: reward.kind === "move" ? "movement" : "publicity",
      status: "pending",
      undoable: true,
      options: {
        playedCard: snapshotPlayedCard(playedCard),
      },
    };
  }

  function buildSentinelPlayCornerEffectNodes(cards, player, roundNumber, turnNumber, playedCard) {
    if (arguments.length === 4) {
      playedCard = turnNumber;
      turnNumber = 1;
    }
    if (!shouldAppendSentinelPlayCornerEffect(cards, player, roundNumber, turnNumber, playedCard)) {
      return [];
    }
    const node = buildSentinelPlayCornerEffectNode(cards, playedCard);
    return node ? [node] : [];
  }

  function resolveSentinelPlayCorner(cards, players, data, player, card) {
    if (isAlienCard(card)) {
      return { ok: false, message: "外星人卡牌不能触发哨兵弃牌角标" };
    }
    const reward = getCornerReward(cards, card);
    if (!reward) {
      return { ok: false, message: "该牌没有弃牌角标奖励" };
    }
    const applied = applyCornerReward(players, data, player, reward);
    return {
      ...applied,
      reward,
      message: applied.ok ? `哨兵探测网络：${applied.message}` : applied.message,
    };
  }

  function resetRoundIndustryRuntimeState(player) {
    if (!player) return player;
    player.industryBorrowedTechTileId = null;
    player.industryBorrowedTechRound = 0;
    player.industryBorrowedTechTurn = 0;
    player.industrySentinelArmedRound = 0;
    player.industrySentinelArmedTurn = 0;
    player.industryHuanyuFreeMoveRound = 0;
    player.industryHuanyuFreeMoveTurn = 0;
    player.industryHuanyuFreeMovesLeft = 0;
    player.industryHuanyuMovedRocketIds = [];
    player.industryPlayedCardThisRound = false;
    player.industryLastPlayedCardThisRound = null;
    return player;
  }

  return Object.freeze({
    PUBLICITY_PICK_COST,
    STRATUS_PUBLIC_CARD_LIMIT,
    isAlienCard,
    getCornerReward,
    applyCornerReward,
    applyIncomeResourcesFromCard,
    prepareActiveAbility,
    armAbilityState,
    buildActiveAbilityFlow,
    isSentinelPlayCornerReady,
    shouldAppendSentinelPlayCornerEffect,
    buildSentinelPlayCornerEffectNode,
    buildSentinelPlayCornerEffectNodes,
    resolveSentinelPlayCorner,
  });
});
