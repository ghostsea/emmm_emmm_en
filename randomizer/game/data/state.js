(function (root, factory) {
  "use strict";

  let placement = root.SetiDataPlacement;
  let players = root.SetiPlayers;
  let playerTech = root.SetiPlayerTech;
  let catalog = root.SetiTechCatalog;

  if (typeof require === "function") {
    placement = placement || require("./placement");
    players = players || require("../players");
    playerTech = playerTech || require("../tech/player-tech");
    catalog = catalog || require("../tech/catalog");
  }

  const api = factory(placement, players, playerTech, catalog);

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.SetiDataState = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function (placement, players, playerTech, catalog) {
  "use strict";

  const DATA_TOKEN_SRC = "../assets/tokens/data.png";
  const PLACEMENT_KIND_COMPUTER = "computer";
  const PLACEMENT_KIND_BLUE_BONUS = "blueBonus";
  const ANALYZE_ENERGY_COST = 1;
  const ANALYZE_REQUIRED_COMPUTER_SLOT = 6;
  let dataTokenSequence = 0;

  function createDefaultDataState() {
    return { poolTokens: [], placedTokens: [], discardedCount: 0 };
  }

  function getPlacementKind(token) {
    return token?.placementKind === PLACEMENT_KIND_BLUE_BONUS
      ? PLACEMENT_KIND_BLUE_BONUS
      : PLACEMENT_KIND_COMPUTER;
  }

  function normalizePoolToken(token, index) {
    const source = token || {};
    const slotIndex = Number(source.slotIndex);
    const layout = placement.getDataPoolSlotLayout(slotIndex);
    return {
      id: source.id || `data-token-${index + 1}`,
      index: Number.isInteger(source.index) ? source.index : index + 1,
      slotIndex,
      percentX: layout?.percentX ?? null,
      percentY: layout?.percentY ?? null,
    };
  }

  function normalizePlacedToken(token, index) {
    const source = token || {};
    const placementKind = getPlacementKind(source);

    if (placementKind === PLACEMENT_KIND_BLUE_BONUS) {
      const blueSlot = Number(source.blueSlot);
      const layout = placement.getBlueBonusDataSlotLayout(blueSlot);
      return {
        id: source.id || `data-placed-blue-${index + 1}`,
        index: Number.isInteger(source.index) ? source.index : index + 1,
        placementKind,
        blueSlot,
        percentX: layout?.percentX ?? null,
        percentY: layout?.percentY ?? null,
      };
    }

    const placementSlot = Number(source.placementSlot);
    const layout = placement.getComputerDataSlotLayout(placementSlot);
    return {
      id: source.id || `data-placed-${index + 1}`,
      index: Number.isInteger(source.index) ? source.index : index + 1,
      placementKind: PLACEMENT_KIND_COMPUTER,
      placementSlot,
      percentX: layout?.percentX ?? null,
      percentY: layout?.percentY ?? null,
    };
  }

  function normalizeDataState(source) {
    const poolSource = source?.poolTokens ?? source?.tokens ?? [];
    const placedSource = source?.placedTokens ?? [];
    return {
      poolTokens: Array.isArray(poolSource) ? poolSource.map(normalizePoolToken) : [],
      placedTokens: Array.isArray(placedSource) ? placedSource.map(normalizePlacedToken) : [],
      discardedCount: Math.max(0, Math.round(Number(source?.discardedCount) || 0)),
    };
  }

  function ensurePlayerDataState(player) {
    if (!player.dataState) {
      player.dataState = createDefaultDataState();
    } else if (!Array.isArray(player.dataState.poolTokens)) {
      player.dataState = normalizeDataState(player.dataState);
    }
    return player.dataState;
  }

  function ensurePlayerTechState(player) {
    if (!player.techState) {
      player.techState = playerTech.createPlayerTechState(null);
    }
    return player.techState;
  }

  function syncAvailableDataCount(player) {
    const dataState = ensurePlayerDataState(player);
    player.resources.availableData = dataState.poolTokens.length;
    return player.resources.availableData;
  }

  function listPoolTokens(player) {
    return [...ensurePlayerDataState(player).poolTokens];
  }

  function listPlacedTokens(player) {
    return [...ensurePlayerDataState(player).placedTokens];
  }

  function listComputerPlacedTokens(player) {
    return listPlacedTokens(player).filter((token) => getPlacementKind(token) === PLACEMENT_KIND_COMPUTER);
  }

  function listBlueBonusPlacedTokens(player) {
    return listPlacedTokens(player).filter((token) => getPlacementKind(token) === PLACEMENT_KIND_BLUE_BONUS);
  }

  function listDataTokens(player) {
    return listPoolTokens(player);
  }

  function getNextDataIndex(dataState) {
    const all = [...dataState.poolTokens, ...dataState.placedTokens];
    if (!all.length) return 1;
    return Math.max(...all.map((token) => token.index)) + 1;
  }

  function findNextOpenPoolSlotIndex(player) {
    const occupied = new Set(
      ensurePlayerDataState(player).poolTokens.map((token) => token.slotIndex),
    );
    for (const slotIndex of placement.DATA_POOL_SLOT_IDS) {
      if (!occupied.has(slotIndex)) return slotIndex;
    }
    return null;
  }

  function findLeftmostPoolToken(dataState) {
    return [...dataState.poolTokens].sort((a, b) => a.slotIndex - b.slotIndex)[0] || null;
  }

  function hasBlueTechInBoardSlot(player, blueSlot) {
    const techState = ensurePlayerTechState(player);
    const slot = Number(blueSlot);
    for (const tileId of catalog.TILE_IDS_BY_TYPE.blue) {
      if (!playerTech.playerOwnsTile(techState, tileId)) continue;
      if (playerTech.getBlueBoardSlot(techState, tileId) === slot) return true;
    }
    return false;
  }

  function isComputerSlotOccupied(player, placementSlot) {
    return listComputerPlacedTokens(player).some((token) => token.placementSlot === Number(placementSlot));
  }

  function isBlueBonusSlotOccupied(player, blueSlot) {
    return listBlueBonusPlacedTokens(player).some((token) => token.blueSlot === Number(blueSlot));
  }

  function isBlueBonusSlotEligible(player, blueSlot) {
    const slot = Number(blueSlot);
    if (!placement.BLUE_BONUS_DATA_SLOT_IDS.includes(slot)) return false;
    const requiredComputerSlot = placement.getRequiredComputerSlotForBlueBonus(slot);
    if (!requiredComputerSlot) return false;
    if (!hasBlueTechInBoardSlot(player, slot)) return false;
    if (!isComputerSlotOccupied(player, requiredComputerSlot)) return false;
    if (isBlueBonusSlotOccupied(player, slot)) return false;
    return true;
  }

  function listEligibleBlueBonusSlots(player) {
    return placement.BLUE_BONUS_DATA_SLOT_IDS.filter((blueSlot) => isBlueBonusSlotEligible(player, blueSlot));
  }

  function hasBlueBonusPlaceOptions(player) {
    return listEligibleBlueBonusSlots(player).length > 0;
  }

  function findNextComputerPlacementSlot(player) {
    const occupied = new Set(listComputerPlacedTokens(player).map((token) => token.placementSlot));
    for (const slot of placement.COMPUTER_DATA_SLOT_IDS) {
      if (!occupied.has(slot)) return slot;
    }
    return null;
  }

  function gainData(player, options = {}) {
    if (!player) {
      return { ok: false, message: "未找到当前玩家" };
    }

    const dataState = ensurePlayerDataState(player);
    const limit = players.RESOURCE_LIMITS.availableData;

    if (dataState.poolTokens.length >= limit) {
      dataState.discardedCount += 1;
      syncAvailableDataCount(player);
      return {
        ok: false,
        discarded: true,
        message: `数据池已满（${limit}/${limit}），本次数据被弃置`,
      };
    }

    const slotIndex = findNextOpenPoolSlotIndex(player);
    const layout = placement.getDataPoolSlotLayout(slotIndex);
    if (!slotIndex || !layout) {
      return { ok: false, message: "数据池没有可用槽位" };
    }

    dataTokenSequence += 1;
    const token = normalizePoolToken({
      id: `data-token-${dataTokenSequence}`,
      index: getNextDataIndex(dataState),
      slotIndex,
    }, dataState.poolTokens.length);

    dataState.poolTokens.push(token);
    syncAvailableDataCount(player);

    const sourceLabel = options.source === "debug" ? "调试" : "获取";
    return {
      ok: true,
      token,
      slotIndex,
      layout,
      message: `${sourceLabel}数据 +1，序号 ${token.index} @数据池槽位${slotIndex} (${layout.percentX}%,${layout.percentY}%)`,
    };
  }

  function canPlaceDataToComputer(player) {
    if (!player) {
      return { ok: false, message: "未找到当前玩家" };
    }
    if (!ensurePlayerDataState(player).poolTokens.length) {
      return { ok: false, message: "数据池没有可放置的数据" };
    }
    const placementSlot = findNextComputerPlacementSlot(player);
    if (!placementSlot) {
      return { ok: false, message: "计算机第一排放置区已满（6/6）" };
    }
    return { ok: true, message: null, placementSlot };
  }

  function canPlaceDataToBlueBonus(player, blueSlot) {
    if (!player) {
      return { ok: false, message: "未找到当前玩家" };
    }
    if (!ensurePlayerDataState(player).poolTokens.length) {
      return { ok: false, message: "数据池没有可放置的数据" };
    }
    const slot = Number(blueSlot);
    if (!isBlueBonusSlotEligible(player, slot)) {
      const requiredComputerSlot = placement.getRequiredComputerSlotForBlueBonus(slot);
      return {
        ok: false,
        message: requiredComputerSlot
          ? `位置${slot}蓝色科技不可放置（需蓝色科技在位且第一排第 ${requiredComputerSlot} 位已有数据）`
          : `位置${slot}蓝色科技没有附加放置位`,
      };
    }
    return { ok: true, message: null, blueSlot: slot };
  }

  function listPlaceDataChoices(player) {
    const choices = [];
    const computerCheck = canPlaceDataToComputer(player);
    if (computerCheck.ok) {
      choices.push({
        target: PLACEMENT_KIND_COMPUTER,
        placementSlot: computerCheck.placementSlot,
        label: `第一排放置位 ${computerCheck.placementSlot}`,
        description: `按从左到右放入第一排第 ${computerCheck.placementSlot} 位`,
      });
    }

    for (const blueSlot of listEligibleBlueBonusSlots(player)) {
      const requiredComputerSlot = placement.getRequiredComputerSlotForBlueBonus(blueSlot);
      const layout = placement.getBlueBonusDataSlotLayout(blueSlot);
      choices.push({
        target: PLACEMENT_KIND_BLUE_BONUS,
        blueSlot,
        requiredComputerSlot,
        label: `位置${blueSlot}蓝色科技`,
        description: `放入蓝色科技 ${blueSlot} 下方（第一排第 ${requiredComputerSlot} 位下方）`,
        layout,
      });
    }

    return choices;
  }

  function canPlaceAnyData(player) {
    if (!player) {
      return { ok: false, message: "未找到当前玩家" };
    }
    if (!ensurePlayerDataState(player).poolTokens.length) {
      return { ok: false, message: "数据池没有可放置的数据" };
    }
    const choices = listPlaceDataChoices(player);
    if (!choices.length) {
      return { ok: false, message: "没有可用的数据放置位置" };
    }
    return { ok: true, message: null, choices };
  }

  function isAnalyzeReady(player) {
    return listComputerPlacedTokens(player).some(
      (token) => token.placementSlot === ANALYZE_REQUIRED_COMPUTER_SLOT,
    );
  }

  function canAnalyzeData(player) {
    if (!player) {
      return { ok: false, message: "未找到当前玩家" };
    }
    if (!isAnalyzeReady(player)) {
      return {
        ok: false,
        message: `需在计算机第 ${ANALYZE_REQUIRED_COMPUTER_SLOT} 放置位放置数据`,
      };
    }
    if (player.resources.energy < ANALYZE_ENERGY_COST) {
      return { ok: false, message: `能量不足，分析需要 ${ANALYZE_ENERGY_COST} 能量` };
    }
    return { ok: true, message: null };
  }

  function analyzeData(player) {
    const check = canAnalyzeData(player);
    if (!check.ok) return check;

    const dataState = ensurePlayerDataState(player);
    const clearedCount = dataState.placedTokens.length;
    const spend = players.spendResources(player, { energy: ANALYZE_ENERGY_COST });
    if (!spend.ok) {
      return { ok: false, message: spend.message };
    }

    dataState.placedTokens = [];
    syncAvailableDataCount(player);

    return {
      ok: true,
      clearedCount,
      message: `分析数据：消耗 ${ANALYZE_ENERGY_COST} 能量，清除 ${clearedCount} 个已放置数据`,
    };
  }

  function placeDataToComputer(player, options = {}) {
    const target = options.target === PLACEMENT_KIND_BLUE_BONUS
      ? PLACEMENT_KIND_BLUE_BONUS
      : PLACEMENT_KIND_COMPUTER;
    const check = target === PLACEMENT_KIND_BLUE_BONUS
      ? canPlaceDataToBlueBonus(player, options.blueSlot)
      : canPlaceDataToComputer(player);
    if (!check.ok) return check;

    const dataState = ensurePlayerDataState(player);
    const poolToken = findLeftmostPoolToken(dataState);
    if (!poolToken) {
      return { ok: false, message: "数据池没有可放置的数据" };
    }

    const poolIndex = dataState.poolTokens.findIndex((token) => token.id === poolToken.id);
    dataState.poolTokens.splice(poolIndex, 1);

    function restorePoolToken() {
      dataState.poolTokens.push(poolToken);
      syncAvailableDataCount(player);
    }

    if (target === PLACEMENT_KIND_BLUE_BONUS) {
      const blueSlot = check.blueSlot;
      const layout = placement.getBlueBonusDataSlotLayout(blueSlot);
      if (!blueSlot || !layout) {
        restorePoolToken();
        return { ok: false, message: "蓝色科技附加放置位不可用" };
      }

      const placedToken = normalizePlacedToken({
        id: poolToken.id,
        index: poolToken.index,
        placementKind: PLACEMENT_KIND_BLUE_BONUS,
        blueSlot,
      }, dataState.placedTokens.length);

      dataState.placedTokens.push(placedToken);
      syncAvailableDataCount(player);

      return {
        ok: true,
        token: placedToken,
        poolToken,
        placementKind: PLACEMENT_KIND_BLUE_BONUS,
        blueSlot,
        layout,
        message:
          `放置数据：序号 ${poolToken.index} 自数据池槽位${poolToken.slotIndex}`
          + ` → 位置${blueSlot}蓝色科技 (${layout.percentX}%,${layout.percentY}%)`,
      };
    }

    const placementSlot = check.placementSlot ?? findNextComputerPlacementSlot(player);
    const layout = placement.getComputerDataSlotLayout(placementSlot);
    if (!placementSlot || !layout) {
      restorePoolToken();
      return { ok: false, message: "计算机第一排没有可用放置位" };
    }

    const placedToken = normalizePlacedToken({
      id: poolToken.id,
      index: poolToken.index,
      placementKind: PLACEMENT_KIND_COMPUTER,
      placementSlot,
    }, dataState.placedTokens.length);

    dataState.placedTokens.push(placedToken);
    syncAvailableDataCount(player);

    return {
      ok: true,
      token: placedToken,
      poolToken,
      placementKind: PLACEMENT_KIND_COMPUTER,
      placementSlot,
      layout,
      message:
        `放置数据：序号 ${poolToken.index} 自数据池槽位${poolToken.slotIndex}`
        + ` → 第一排放置位${placementSlot} (${layout.percentX}%,${layout.percentY}%)`,
    };
  }

  return Object.freeze({
    DATA_TOKEN_SRC,
    PLACEMENT_KIND_COMPUTER,
    PLACEMENT_KIND_BLUE_BONUS,
    ANALYZE_ENERGY_COST,
    ANALYZE_REQUIRED_COMPUTER_SLOT,
    createDefaultDataState,
    normalizeDataState,
    ensurePlayerDataState,
    syncAvailableDataCount,
    listPoolTokens,
    listPlacedTokens,
    listComputerPlacedTokens,
    listBlueBonusPlacedTokens,
    listDataTokens,
    listEligibleBlueBonusSlots,
    hasBlueBonusPlaceOptions,
    gainData,
    canPlaceAnyData,
    listPlaceDataChoices,
    canPlaceDataToComputer,
    canPlaceDataToBlueBonus,
    isAnalyzeReady,
    canAnalyzeData,
    analyzeData,
    placeDataToComputer,
  });
});
