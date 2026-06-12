(function (root, factory) {
  "use strict";

  let catalog = root.SetiTechCatalog;
  let boardState = root.SetiTechBoardState;
  let playerTech = root.SetiPlayerTech;
  let bonuses = root.SetiTechBonuses;
  let placement = root.SetiTechPlacement;
  let players = root.SetiPlayers;

  if (typeof require === "function") {
    catalog = catalog || require("./catalog");
    boardState = boardState || require("./board-state");
    playerTech = playerTech || require("./player-tech");
    bonuses = bonuses || require("./bonuses");
    placement = placement || require("./placement");
    players = players || require("../players");
  }

  const api = factory(catalog, boardState, playerTech, bonuses, placement, players);

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.SetiTechResolver = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function (
  catalog,
  boardState,
  playerTech,
  bonuses,
  placement,
  players,
) {
  "use strict";

  function getAvailableBlueSlots(playerTechState) {
    return playerTech.getAvailableBlueSlots(playerTechState);
  }

  function resolveBlueSlotChoice(playerTechState, tileId, blueSlot = null) {
    const availableSlots = getAvailableBlueSlots(playerTechState);
    if (!availableSlots.length) {
      return { ok: false, message: "蓝色科技位置已满" };
    }

    if (blueSlot == null) {
      if (availableSlots.length === 1) {
        return { ok: true, blueSlot: availableSlots[0], availableSlots };
      }
      return {
        ok: true,
        needsBlueSlotChoice: true,
        tileId,
        availableSlots,
        message: `请选择 ${tileId} 的蓝色放置位置`,
      };
    }

    const resolvedBlueSlot = Number(blueSlot);
    if (!availableSlots.includes(resolvedBlueSlot)) {
      return { ok: false, message: `蓝色科技位置 ${resolvedBlueSlot} 不可用` };
    }

    return { ok: true, blueSlot: resolvedBlueSlot, availableSlots };
  }

  function canTakeTile(board, playerTechState, tileId) {
    const stack = boardState.getStack(board, tileId);
    if (!stack) return { ok: false, message: `未知科技板块 ${tileId}` };
    if (!boardState.isInSupply(board, tileId)) {
      return { ok: false, message: `${tileId} 不在待拿取区` };
    }

    if (!playerTech.canPlayerTakeTile(playerTechState, tileId)) {
      if (playerTech.playerOwnsTile(playerTechState, tileId)) {
        return { ok: false, message: `已拥有 ${tileId}` };
      }
      if (stack.techType === "blue") {
        return { ok: false, message: "蓝色科技位置已满" };
      }
      return { ok: false, message: `无法研究 ${tileId}` };
    }

    return { ok: true, stack, techType: stack.techType };
  }

  function buildTakeResult(board, player, playerTechState, takeBoardResult, bonusResult, firstTakeResult) {
    const { tileId, techType, takenBonusId, blueSlot } = takeBoardResult;
    const layout = placement.getPlacementLayout(tileId, blueSlot);
    const rewardSummary = bonuses.formatRewardSummary(takenBonusId, takeBoardResult.firstTake);

    return {
      ok: true,
      tileId,
      techType,
      bonusId: takenBonusId,
      blueSlot,
      firstTake: takeBoardResult.firstTake,
      remainingForSlot: takeBoardResult.remainingForSlot,
      remainingForType: takeBoardResult.remainingForType,
      awaitingCardSelection: Boolean(bonusResult.awaitingCardSelection),
      layout: structuredClone(layout),
      rewards: {
        bonus: bonusResult.rewards,
        firstTakeScore: firstTakeResult?.score || 0,
      },
      message: `研究科技：${tileId}（${rewardSummary}）`,
      playerTech: structuredClone(playerTechState),
    };
  }

  function selectTechTile(context, options = {}) {
    const {
      tileId,
      blueSlot = null,
      skipCost = false,
    } = options;

    const board = context.techBoardState;
    const currentPlayer = players.getCurrentPlayer(context.playerState);
    if (!currentPlayer) return { ok: false, message: "没有当前玩家" };
    if (!board) return { ok: false, message: "科技版图状态未初始化" };

    if (!currentPlayer.techState) {
      currentPlayer.techState = playerTech.createPlayerTechState();
    }

    const check = canTakeTile(board, currentPlayer.techState, tileId);
    if (!check.ok) return check;

    let resolvedBlueSlot = null;
    if (check.techType === "blue") {
      const blueSlotChoice = resolveBlueSlotChoice(
        currentPlayer.techState,
        tileId,
        blueSlot ?? options.blueSlot,
      );
      if (!blueSlotChoice.ok) return blueSlotChoice;
      if (blueSlotChoice.needsBlueSlotChoice) {
        return {
          ok: true,
          needsBlueSlotChoice: true,
          tileId,
          availableSlots: blueSlotChoice.availableSlots,
          message: blueSlotChoice.message,
        };
      }
      resolvedBlueSlot = blueSlotChoice.blueSlot;
    }

    if (!skipCost) {
      const afford = players.canAfford(currentPlayer, { publicity: catalog.RESEARCH_PUBLICITY_COST });
      if (!afford) {
        return {
          ok: false,
          message: `宣传不足，研究科技需要 ${catalog.RESEARCH_PUBLICITY_COST} 宣传`,
        };
      }
    }

    if (!skipCost) {
      const spend = players.spendResources(currentPlayer, { publicity: catalog.RESEARCH_PUBLICITY_COST });
      if (!spend.ok) return spend;
    }

    const takeBoardResult = boardState.consumeFromSupplySlot(
      board,
      tileId,
      currentPlayer.id,
      resolvedBlueSlot,
    );
    if (!takeBoardResult.ok) return takeBoardResult;

    const record = playerTech.recordPlayerTake(
      currentPlayer.techState,
      tileId,
      resolvedBlueSlot,
    );
    if (!record.ok) return record;

    if (context.techUiState) {
      context.techUiState.pendingTileId = null;
      context.techUiState.selectedTileId = tileId;
      context.techUiState.selectedBlueSlot = resolvedBlueSlot;
      context.techUiState.statusNote = `已选择科技：${tileId}`;
    }

    return {
      ok: true,
      tileId,
      techType: takeBoardResult.techType,
      bonusId: takeBoardResult.takenBonusId,
      blueSlot: resolvedBlueSlot,
      firstTake: takeBoardResult.firstTake,
      remainingForSlot: takeBoardResult.remainingForSlot,
      remainingForType: takeBoardResult.remainingForType,
      awaitingCardSelection: false,
      layout: structuredClone(placement.getPlacementLayout(tileId, resolvedBlueSlot)),
      rewards: {
        bonus: {},
        firstTakeScore: 0,
      },
      message: `选择科技：${tileId}`,
      playerTech: structuredClone(currentPlayer.techState),
    };
  }

  function rotateForResearch(context, count = 1) {
    if (typeof context.rotateSolarOrbit !== "function") {
      return { ok: false, message: "无法执行研究科技的太阳系旋转" };
    }
    context.rotateSolarOrbit(count);
    return { ok: true, message: "太阳系旋转" };
  }

  function applyTechBonus(context, options = {}) {
    const {
      bonusId,
      firstTake = false,
      skipCardSelection = false,
    } = options;
    const currentPlayer = players.getCurrentPlayer(context.playerState);
    if (!currentPlayer) return { ok: false, message: "没有当前玩家" };

    const bonusEffect = catalog.BONUS_EFFECTS[bonusId];
    if (!bonusEffect) return { ok: false, message: `未知奖励 ${bonusId}` };

    const firstTakeResult = firstTake ? bonuses.applyFirstTakeTypeReward(currentPlayer) : null;
    let bonusResult = { ok: true, message: catalog.BONUS_LABELS[bonusId] || bonusId, rewards: {} };

    if (bonusEffect.cardSelection && skipCardSelection) {
      bonusResult = {
        ok: true,
        message: catalog.BONUS_LABELS[bonusId] || bonusId,
        rewards: { cardSelection: Math.max(0, Math.round(bonusEffect.cardSelection)) },
        awaitingCardSelection: true,
      };
    } else {
      bonusResult = bonuses.applyBonusReward(currentPlayer, bonusId, {
        drawBasicCardToPlayer: context.drawBasicCardToPlayer,
        drawCard: context.drawBasicCard,
      });
      if (!bonusResult.ok) return bonusResult;
    }

    return {
      ok: true,
      bonusId,
      firstTake,
      awaitingCardSelection: Boolean(bonusResult.awaitingCardSelection),
      rewards: {
        bonus: bonusResult.rewards,
        firstTakeScore: firstTakeResult?.score || 0,
      },
      message: `获取奖励：${catalog.BONUS_LABELS[bonusId] || bonusId}${firstTake ? `，首拿 +${catalog.FIRST_TAKE_TYPE_SCORE} 分` : ""}`,
    };
  }

  function executeTakeTech(context, options = {}) {
    const currentPlayerBefore = players.getCurrentPlayer(context.playerState);
    const snapshots = {
      player: currentPlayerBefore ? structuredClone(currentPlayerBefore) : null,
      board: context.techBoardState ? structuredClone(context.techBoardState) : null,
      ui: context.techUiState ? structuredClone(context.techUiState) : null,
      solarState: context.solarState ? structuredClone(context.solarState) : null,
    };
    function restoreSnapshots() {
      const currentPlayer = players.getCurrentPlayer(context.playerState);
      if (currentPlayer && snapshots.player) {
        for (const key of Object.keys(currentPlayer)) delete currentPlayer[key];
        Object.assign(currentPlayer, structuredClone(snapshots.player));
      }
      for (const [target, snapshot] of [
        [context.techBoardState, snapshots.board],
        [context.techUiState, snapshots.ui],
        [context.solarState, snapshots.solarState],
      ]) {
        if (!target || !snapshot) continue;
        for (const key of Object.keys(target)) delete target[key];
        Object.assign(target, structuredClone(snapshot));
      }
    }

    const selectResult = selectTechTile(context, options);
    if (!selectResult.ok || selectResult.needsBlueSlotChoice) return selectResult;

    if (!options.skipRotation) {
      const rotateResult = rotateForResearch(context, 1);
      if (!rotateResult.ok) {
        restoreSnapshots();
        return rotateResult;
      }
    }

    const bonusResult = applyTechBonus(context, {
      bonusId: selectResult.bonusId,
      firstTake: selectResult.firstTake,
    });
    if (!bonusResult.ok) {
      restoreSnapshots();
      return bonusResult;
    }

    return buildTakeResult(
      context.techBoardState,
      players.getCurrentPlayer(context.playerState),
      players.getCurrentPlayer(context.playerState).techState,
      {
        tileId: selectResult.tileId,
        techType: selectResult.techType,
        takenBonusId: selectResult.bonusId,
        blueSlot: selectResult.blueSlot,
        firstTake: selectResult.firstTake,
        remainingForSlot: selectResult.remainingForSlot,
        remainingForType: selectResult.remainingForType,
      },
      {
        ok: true,
        rewards: bonusResult.rewards.bonus,
        awaitingCardSelection: bonusResult.awaitingCardSelection,
      },
      { score: bonusResult.rewards.firstTakeScore },
    );
  }

  function listTakeableTiles(board, playerTechState) {
    return catalog.TECH_TILE_IDS.filter((tileId) => {
      if (!boardState.isSlotAvailable(board, tileId)) return false;
      return playerTech.canPlayerTakeTile(playerTechState, tileId);
    });
  }

  function listAvailableTypes(board) {
    return catalog.TECH_TYPES.filter((techType) => boardState.isTypeAvailable(board, techType));
  }

  return Object.freeze({
    getAvailableBlueSlots,
    canTakeTile,
    selectTechTile,
    rotateForResearch,
    applyTechBonus,
    executeTakeTech,
    listTakeableTiles,
    listAvailableTypes,
  });
});
