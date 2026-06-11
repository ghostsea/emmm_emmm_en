(function (root, factory) {
  "use strict";

  let catalog = root.SetiTechCatalog;

  if (!catalog && typeof require === "function") {
    catalog = require("./catalog");
  }

  const api = factory(catalog);

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.SetiTechBoardState = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function (catalog) {
  "use strict";

  function getCurrentBonusId(stack) {
    if (!stack || stack.depleted) return null;
    return stack.bonusQueue[stack.bonusIndex] ?? null;
  }

  function syncCurrentBonus(stack) {
    if (!stack) return null;
    stack.bonusId = getCurrentBonusId(stack);
    return stack.bonusId;
  }

  function createStackRecord(tileId) {
    return {
      tileId,
      techType: catalog.getTechType(tileId),
      stackIndex: catalog.getStackIndex(tileId),
      bonusQueue: [],
      bonusIndex: 0,
      bonusId: null,
      remaining: catalog.PIECES_PER_SLOT,
      firstTakeClaimedBy: null,
      depleted: false,
    };
  }

  function createBoardState() {
    const stacks = {};
    for (const tileId of catalog.TECH_TILE_IDS) {
      stacks[tileId] = createStackRecord(tileId);
    }
    return { stacks };
  }

  function setupStackBonuses(stack, random = Math.random) {
    stack.bonusQueue = catalog.shuffleBonusIds(random);
    stack.bonusIndex = 0;
    stack.remaining = catalog.PIECES_PER_SLOT;
    stack.firstTakeClaimedBy = null;
    stack.depleted = false;
    syncCurrentBonus(stack);
    return stack;
  }

  function setupBoardBonuses(boardState, random = Math.random) {
    for (const tileId of catalog.TECH_TILE_IDS) {
      setupStackBonuses(boardState.stacks[tileId], random);
    }
    return boardState;
  }

  function getStack(boardState, tileId) {
    return boardState?.stacks?.[tileId] || null;
  }

  function getRemainingForSlot(boardState, tileId) {
    return getStack(boardState, tileId)?.remaining ?? 0;
  }

  function getRemainingForType(boardState, techType) {
    return catalog.TILE_IDS_BY_TYPE[techType].reduce(
      (sum, tileId) => sum + getRemainingForSlot(boardState, tileId),
      0,
    );
  }

  function isTypeAvailable(boardState, techType) {
    return catalog.TILE_IDS_BY_TYPE[techType].some((tileId) => isSlotAvailable(boardState, tileId));
  }

  function isSlotAvailable(boardState, tileId) {
    const stack = getStack(boardState, tileId);
    return Boolean(stack && !stack.depleted && stack.remaining > 0);
  }

  function isInSupply(boardState, tileId) {
    return isSlotAvailable(boardState, tileId);
  }

  function listSupplyStacks(boardState) {
    return catalog.TECH_TILE_IDS
      .map((tileId) => getStack(boardState, tileId))
      .filter((stack) => isSlotAvailable(boardState, stack.tileId));
  }

  function listSupplyStacksByType(boardState, techType) {
    return catalog.TILE_IDS_BY_TYPE[techType]
      .map((tileId) => getStack(boardState, tileId))
      .filter((stack) => isSlotAvailable(boardState, stack.tileId));
  }

  function isFirstTakeAvailable(boardState, tileId) {
    const stack = getStack(boardState, tileId);
    return Boolean(stack && isSlotAvailable(boardState, tileId) && stack.firstTakeClaimedBy == null);
  }

  function consumeFromSupplySlot(boardState, tileId, playerId, blueSlot = null) {
    const stack = getStack(boardState, tileId);
    if (!stack) return { ok: false, message: `未知科技板块 ${tileId}` };
    if (!isSlotAvailable(boardState, tileId)) {
      return { ok: false, message: `${tileId} 已取完` };
    }

    const techType = stack.techType;
    const takenBonusId = getCurrentBonusId(stack);
    if (!takenBonusId) {
      return { ok: false, message: `${tileId} 无可用奖励` };
    }

    let resolvedBlueSlot = null;
    if (techType === "blue") {
      const slot = Number(blueSlot);
      if (![1, 2, 3, 4].includes(slot)) {
        return { ok: false, message: "请选择蓝色科技放置位置 1-4" };
      }
      resolvedBlueSlot = slot;
    }

    const firstTake = stack.firstTakeClaimedBy == null;
    if (firstTake) stack.firstTakeClaimedBy = playerId;

    stack.remaining -= 1;

    if (stack.remaining > 0) {
      stack.bonusIndex += 1;
      syncCurrentBonus(stack);
    } else {
      stack.depleted = true;
      stack.bonusId = null;
    }

    return {
      ok: true,
      tileId,
      techType,
      takenBonusId,
      blueSlot: resolvedBlueSlot,
      firstTake,
      remainingForSlot: stack.remaining,
      remainingForType: getRemainingForType(boardState, techType),
      stack: structuredClone(getStack(boardState, tileId)),
    };
  }

  function getSnapshot(boardState) {
    return structuredClone(boardState);
  }

  return Object.freeze({
    createBoardState,
    setupBoardBonuses,
    getStack,
    getCurrentBonusId,
    getRemainingForSlot,
    getRemainingForType,
    isTypeAvailable,
    isSlotAvailable,
    isInSupply,
    listSupplyStacks,
    listSupplyStacksByType,
    isFirstTakeAvailable,
    consumeFromSupplySlot,
    getSnapshot,
  });
});
