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

  function getCornerRewardIcon(reward) {
    if (reward?.kind === "move") return "movement";
    if (Math.max(0, Math.round(Number(reward?.dataCount) || 0)) > 0) return "data";
    if (reward?.gain?.score) return "score";
    if (reward?.gain?.publicity) return "publicity";
    return "pick_card";
  }

  function buildStratusPublicCornerEffectNodes(cards, publicCards) {
    return (publicCards || [])
      .slice(0, STRATUS_PUBLIC_CARD_LIMIT)
      .map((card, index) => {
        if (!card) return null;
        const reward = getCornerReward(cards, card);
        const cardLabel = cards?.getCardLabel?.(card) || card.cardName || card.cardId || `公共牌 ${index + 1}`;
        return {
          id: `industry-stratus-corner-${index}-${card.id || card.cardId || card.src || "card"}`,
          type: "industry_stratus_corner",
          label: reward
            ? `层云核心：${cardLabel} 弃牌角标`
            : `层云核心：${cardLabel} 无弃牌角标`,
          icon: getCornerRewardIcon(reward),
          status: "pending",
          undoable: true,
          options: {
            publicSlotIndex: index,
            card: snapshotPlayedCard(card),
          },
        };
      })
      .filter(Boolean);
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

  function applyIncomeResourcesFromCard(cards, players, data, player, card, options = {}) {
    const gain = cards.getIncomeGainForCard(card);
    if (!gain) {
      return { ok: false, message: `无法识别卡牌收入：${cards.getCardLabel(card)}` };
    }
    const resourceGain = {};
    const dataResults = [];
    const drawnCards = [];
    if (gain.credits) resourceGain.credits = gain.credits;
    if (gain.energy) resourceGain.energy = gain.energy;
    if (gain.publicity) resourceGain.publicity = gain.publicity;
    if (Object.keys(resourceGain).length) {
      players.gainResources(player, resourceGain);
    }
    const dataCount = Math.max(0, Math.round(Number(gain.availableData) || 0));
    for (let index = 0; index < dataCount; index += 1) {
      dataResults.push(data.gainData(player, { source: "industry_income" }));
    }
    const handCount = Math.max(0, Math.round(Number(gain.handSize) || 0));
    if (handCount > 0) {
      if (typeof options.blindDraw === "function") {
        for (let index = 0; index < handCount; index += 1) {
          const result = options.blindDraw(player);
          if (!result?.ok) {
            return {
              ok: false,
              message: result?.message || "任务中继站盲抽收入结算失败",
              gain,
              dataResults,
              drawnCards,
            };
          }
          if (result.card) drawnCards.push(result.card);
        }
      } else {
        players.gainResources(player, { handSize: handCount });
        drawnCards.push(...(player.hand || []).slice(-handCount));
      }
    }
    const labels = {
      credits: "信用点",
      energy: "能量",
      publicity: "宣传",
      availableData: "数据",
    };
    const parts = Object.entries(resourceGain).map(([key, value]) => `${value}${labels[key] || key}`);
    if (dataCount) parts.push(`${dataCount}数据`);
    if (handCount) parts.push(`盲抽${drawnCards.length || handCount}张`);
    return {
      ok: true,
      message: parts.join("、") || "无收入奖励",
      gain,
      dataResults,
      drawnCards,
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
          message: `${prepared.label}：请按效果栏依次结算公共牌区 ${STRATUS_PUBLIC_CARD_LIMIT} 张牌的弃牌角标（不弃牌）`,
        };
      case "turing_borrow_tech":
        return {
          ok: true,
          abilityId,
          flowType: "turing_borrow_tech",
          label: prepared.label,
          message: `${prepared.label}：请选择一项橙色或紫色科技借用当前回合效果（不获得板块与 bonus）`,
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
          message: `${prepared.label}：请选择要移除的科技（不可选蓝色），清除 3 个奖励槽标记并增加 1 次收入`,
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
          message: `${prepared.label}：消耗 ${PUBLICITY_PICK_COST} 宣传精选 1 张牌并获得其收入角标奖励`,
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
      case "future_span_pick_advance": {
        const futureState = player?.industryFutureSpan;
        const targetScore = Number(futureState?.targetScore);
        const currentScore = Number(player?.resources?.score || 0);
        if (!futureState?.card || futureState.playing || !Number.isFinite(targetScore)) {
          return { ok: false, message: `${prepared.label}：没有使用专属标记，暂无可前移的目标分` };
        }
        if (currentScore >= targetScore) {
          return { ok: false, message: `${prepared.label}：目标牌已可打出，不能再前移目标分` };
        }
        return {
          ok: true,
          abilityId,
          flowType: "future_span_pick",
          label: prepared.label,
          message: `${prepared.label}：精选 1 张公共牌，并将专属标记目标分前移 3 格`,
        };
      }
      case "strategy_pick_card":
        return {
          ok: true,
          abilityId,
          flowType: "strategy_pick",
          label: prepared.label,
          message: `${prepared.label}：请精选 1 张公共牌，并清除当前 3 个奖励槽标记`,
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
      cardName: card.cardName,
      label: card.label,
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
      icon: getCornerRewardIcon(reward),
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
    buildStratusPublicCornerEffectNodes,
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
