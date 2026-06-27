(function (root, factory) {
  "use strict";

  let catalog = root.SetiTechCatalog;
  let boardState = root.SetiTechBoardState;
  let playerTech = root.SetiPlayerTech;
  let bonuses = root.SetiTechBonuses;
  let placement = root.SetiTechPlacement;
  let players = root.SetiPlayers;
  let industryPassives = root.SetiIndustryPassives;

  if (typeof require === "function") {
    catalog = catalog || require("./catalog");
    boardState = boardState || require("./board-state");
    playerTech = playerTech || require("./player-tech");
    bonuses = bonuses || require("./bonuses");
    placement = placement || require("./placement");
    players = players || require("../players");
    industryPassives = industryPassives || require("../industry/passives");
  }

  const api = factory(catalog, boardState, playerTech, bonuses, placement, players, industryPassives);

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
  industryPassives,
) {
  "use strict";

  function getIndustryPassives() {
    return industryPassives || (typeof globalThis !== "undefined" ? globalThis.SetiIndustryPassives : null);
  }

  function restoreObject(target, snapshot) {
    if (!target || !snapshot) return;
    for (const key of Object.keys(target)) delete target[key];
    Object.assign(target, structuredClone(snapshot));
  }

  function getResearchPublicityCost(player) {
    return getIndustryPassives()?.getResearchPublicityCost?.(player, catalog.RESEARCH_PUBLICITY_COST)
      ?? catalog.RESEARCH_PUBLICITY_COST;
  }

  function getAvailableBlueSlots(playerTechState) {
    return playerTech.getAvailableBlueSlots(playerTechState);
  }

  function normalizeTechType(value) {
    const raw = String(value || "").trim();
    const aliases = {
      blue: "blue",
      orange: "orange",
      purple: "purple",
      蓝: "blue",
      蓝色: "blue",
      blueTech: "blue",
      orangeTech: "orange",
      橙: "orange",
      橙色: "orange",
      purpleTech: "purple",
      紫: "purple",
      紫色: "purple",
    };
    return aliases[raw] || (catalog.TECH_TYPES.includes(raw) ? raw : null);
  }

  function normalizeTechTypeFilter(options = {}) {
    const source = options.techTypes
      ?? options.techType
      ?? options.allowedTechTypes
      ?? options.colors
      ?? options.color
      ?? null;
    const values = Array.isArray(source) ? source : (source == null ? [] : [source]);
    const types = [...new Set(values.map(normalizeTechType).filter(Boolean))];
    return types.length ? types : null;
  }

  function isTechTypeAllowed(tileId, options = {}) {
    const allowedTypes = normalizeTechTypeFilter(options);
    if (!allowedTypes) return true;
    const techType = catalog.getTechType(tileId);
    return allowedTypes.includes(techType);
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

  function canTakeTile(board, playerTechState, tileId, options = {}) {
    const stack = boardState.getStack(board, tileId);
    if (!stack) return { ok: false, message: `未知科技板块 ${tileId}` };
    if (!isTechTypeAllowed(tileId, options)) {
      return { ok: false, message: `${tileId} 不在本次可研究科技颜色范围内` };
    }
    if (!boardState.isInSupply(board, tileId)) {
      return { ok: false, message: `${tileId} 不在待拿取区` };
    }

    if (!playerTech.canPlayerTakeTile(playerTechState, tileId)) {
      if (playerTech.playerOwnsTile(playerTechState, tileId)) {
        const message = playerTech.isTileDisabled(playerTechState, tileId)
          ? `${tileId} 已在版图（已失效）`
          : `已拥有 ${tileId}`;
        return { ok: false, message };
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
    } = options;
    const effectiveOptions = normalizeTechTypeFilter(options)
      ? options
      : { ...options, allowedTechTypes: context.techUiState?.allowedTechTypes || null };

    const board = context.techBoardState;
    const currentPlayer = players.getCurrentPlayer(context.playerState);
    if (!currentPlayer) return { ok: false, message: "没有当前玩家" };
    if (!board) return { ok: false, message: "科技版图状态未初始化" };

    if (!currentPlayer.techState) {
      currentPlayer.techState = playerTech.createPlayerTechState();
    }

    const check = canTakeTile(board, currentPlayer.techState, tileId, effectiveOptions);
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

    const stack = boardState.getStack(board, tileId);
    const bonusId = boardState.getCurrentBonusId(stack);
    if (!bonusId) return { ok: false, message: `${tileId} 无可用奖励` };
    const firstTake = boardState.isFirstTakeAvailable(board, tileId);

    if (context.techUiState) {
      context.techUiState.pendingTileId = null;
      context.techUiState.selectedTileId = tileId;
      context.techUiState.selectedBlueSlot = resolvedBlueSlot;
      context.techUiState.statusNote = `已选择科技：${tileId}`;
    }

    return {
      ok: true,
      tileId,
      techType: check.techType,
      bonusId,
      blueSlot: resolvedBlueSlot,
      firstTake,
      remainingForSlot: boardState.getRemainingForSlot(board, tileId),
      remainingForType: boardState.getRemainingForType(board, check.techType),
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

  function takeSelectedTechTile(context, options = {}) {
    const {
      tileId,
      blueSlot = null,
      expectedBonusId = null,
      expectedFirstTake = null,
    } = options;
    const effectiveOptions = normalizeTechTypeFilter(options)
      ? options
      : { ...options, allowedTechTypes: context.techUiState?.allowedTechTypes || null };

    const board = context.techBoardState;
    const currentPlayer = players.getCurrentPlayer(context.playerState);
    if (!currentPlayer) return { ok: false, message: "没有当前玩家" };
    if (!board) return { ok: false, message: "科技版图状态未初始化" };

    if (!currentPlayer.techState) {
      currentPlayer.techState = playerTech.createPlayerTechState();
    }

    const check = canTakeTile(board, currentPlayer.techState, tileId, effectiveOptions);
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

    const currentBonusId = boardState.getCurrentBonusId(check.stack);
    if (expectedBonusId != null && currentBonusId !== expectedBonusId) {
      return { ok: false, message: `${tileId} 当前 bonus 已变化，请重新选择科技` };
    }
    const currentFirstTake = boardState.isFirstTakeAvailable(board, tileId);
    if (expectedFirstTake != null && Boolean(expectedFirstTake) !== currentFirstTake) {
      return { ok: false, message: `${tileId} 首拿状态已变化，请重新选择科技` };
    }

    const boardBefore = structuredClone(board);
    const techBefore = structuredClone(currentPlayer.techState);
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
    if (!record.ok) {
      restoreObject(board, boardBefore);
      restoreObject(currentPlayer.techState, techBefore);
      return record;
    }

    if (context.techUiState) {
      context.techUiState.pendingTileId = null;
      context.techUiState.selectedTileId = tileId;
      context.techUiState.selectedBlueSlot = resolvedBlueSlot;
      context.techUiState.statusNote = `已获得科技：${tileId}`;
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
      message: `获得科技：${tileId}`,
      playerTech: structuredClone(currentPlayer.techState),
    };
  }

  function rotateForResearch(context, count = 1) {
    if (typeof context.rotateSolarOrbit !== "function") {
      return { ok: false, message: "无法执行研究科技的太阳系旋转" };
    }
    const rotateResult = context.rotateSolarOrbit(count);
    if (rotateResult && rotateResult.ok === false) return rotateResult;
    return {
      ok: true,
      message: rotateResult?.message || "太阳系旋转",
      payload: rotateResult?.payload || {},
      events: rotateResult?.events || [],
    };
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

    if (!options.skipCost) {
      const researchCost = getResearchPublicityCost(players.getCurrentPlayer(context.playerState));
      const spend = players.spendResources(players.getCurrentPlayer(context.playerState), { publicity: researchCost });
      if (!spend.ok) {
        restoreSnapshots();
        return spend;
      }
    }

    const takeResult = takeSelectedTechTile(context, {
      ...options,
      tileId: selectResult.tileId,
      blueSlot: selectResult.blueSlot,
      expectedBonusId: selectResult.bonusId,
      expectedFirstTake: selectResult.firstTake,
    });
    if (!takeResult.ok || takeResult.needsBlueSlotChoice) {
      restoreSnapshots();
      return takeResult;
    }

    if (!options.skipRotation) {
      const rotateResult = rotateForResearch(context, 1);
      if (!rotateResult.ok) {
        restoreSnapshots();
        return rotateResult;
      }
    }

    const bonusResult = applyTechBonus(context, {
      bonusId: takeResult.bonusId,
      firstTake: takeResult.firstTake,
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
        techType: takeResult.techType,
        takenBonusId: takeResult.bonusId,
        blueSlot: takeResult.blueSlot,
        firstTake: takeResult.firstTake,
        remainingForSlot: takeResult.remainingForSlot,
        remainingForType: takeResult.remainingForType,
      },
      {
        ok: true,
        rewards: bonusResult.rewards.bonus,
        awaitingCardSelection: bonusResult.awaitingCardSelection,
      },
      { score: bonusResult.rewards.firstTakeScore },
    );
  }

  function listTakeableTiles(board, playerTechState, options = {}) {
    return catalog.TECH_TILE_IDS.filter((tileId) => {
      if (!isTechTypeAllowed(tileId, options)) return false;
      if (!boardState.isSlotAvailable(board, tileId)) return false;
      return playerTech.canPlayerTakeTile(playerTechState, tileId);
    });
  }

  function listAvailableTypes(board) {
    return catalog.TECH_TYPES.filter((techType) => boardState.isTypeAvailable(board, techType));
  }

  return Object.freeze({
    getAvailableBlueSlots,
    normalizeTechTypeFilter,
    getResearchPublicityCost,
    canTakeTile,
    selectTechTile,
    takeSelectedTechTile,
    rotateForResearch,
    applyTechBonus,
    executeTakeTech,
    listTakeableTiles,
    listAvailableTypes,
  });
});
