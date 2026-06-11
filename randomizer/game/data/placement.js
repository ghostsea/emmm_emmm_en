(function (root, factory) {
  "use strict";

  const api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.SetiDataPlacement = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function () {
  "use strict";

  const DATA_TOKEN_DISPLAY_SCALE = 3.5;

  /** 玩家版图左下角数据池：3 列 × 2 行，序号 1–6（由拖动校准，列/行略作对齐） */
  const DATA_POOL_SLOTS = Object.freeze({
    1: Object.freeze({ percentX: 17.74, percentY: 66.08, scalePercent: 11.8 }),
    2: Object.freeze({ percentX: 21.77, percentY: 66.08, scalePercent: 11.8 }),
    3: Object.freeze({ percentX: 25.86, percentY: 66.08, scalePercent: 11.8 }),
    4: Object.freeze({ percentX: 17.74, percentY: 78.23, scalePercent: 11.8 }),
    5: Object.freeze({ percentX: 21.77, percentY: 78.23, scalePercent: 11.8 }),
    6: Object.freeze({ percentX: 25.86, percentY: 78.23, scalePercent: 11.8 }),
  });

  const DATA_POOL_SLOT_IDS = Object.freeze(
    Object.keys(DATA_POOL_SLOTS).map(Number).sort((a, b) => a - b),
  );

  /** 计算机放置区：从左到右 6 个放置位（由拖动校准） */
  const COMPUTER_DATA_SLOTS = Object.freeze({
    1: Object.freeze({ percentX: 34.66, percentY: 67.61, scalePercent: 11.8 }),
    2: Object.freeze({ percentX: 41.74, percentY: 68.76, scalePercent: 11.8 }),
    3: Object.freeze({ percentX: 49.32, percentY: 67.32, scalePercent: 11.8 }),
    4: Object.freeze({ percentX: 56.31, percentY: 68.18, scalePercent: 11.8 }),
    5: Object.freeze({ percentX: 63.98, percentY: 67.32, scalePercent: 11.8 }),
    6: Object.freeze({ percentX: 72.05, percentY: 67.32, scalePercent: 11.8 }),
  });

  const COMPUTER_DATA_SLOT_IDS = Object.freeze(
    Object.keys(COMPUTER_DATA_SLOTS).map(Number).sort((a, b) => a - b),
  );

  /**
   * 蓝色科技版图槽位 → 第一排必须先放置的数据位。
   * 仅位置 2/3/4 有附加放置位；位置 1 无附加位。
   */
  const BLUE_BONUS_REQUIRED_COMPUTER_SLOT = Object.freeze({
    2: 3,
    3: 5,
    4: 6,
  });

  /** 蓝色科技下方附加数据放置位（键为蓝色科技版图槽位 2/3/4） */
  const BLUE_BONUS_DATA_SLOTS = Object.freeze({
    2: Object.freeze({ percentX: 49.12, percentY: 80.14, scalePercent: 11.8 }),
    3: Object.freeze({ percentX: 63.88, percentY: 81.29, scalePercent: 11.8 }),
    4: Object.freeze({ percentX: 72.05, percentY: 81, scalePercent: 11.8 }),
  });

  const BLUE_BONUS_DATA_SLOT_IDS = Object.freeze(
    Object.keys(BLUE_BONUS_DATA_SLOTS).map(Number).sort((a, b) => a - b),
  );

  function getDataPoolSlotLayout(slotIndex) {
    return DATA_POOL_SLOTS[Number(slotIndex)] || null;
  }

  function getComputerDataSlotLayout(placementSlot) {
    return COMPUTER_DATA_SLOTS[Number(placementSlot)] || null;
  }

  function getBlueBonusDataSlotLayout(blueSlot) {
    return BLUE_BONUS_DATA_SLOTS[Number(blueSlot)] || null;
  }

  function getRequiredComputerSlotForBlueBonus(blueSlot) {
    return BLUE_BONUS_REQUIRED_COMPUTER_SLOT[Number(blueSlot)] ?? null;
  }

  return Object.freeze({
    DATA_TOKEN_DISPLAY_SCALE,
    DATA_POOL_SLOTS,
    DATA_POOL_SLOT_IDS,
    COMPUTER_DATA_SLOTS,
    COMPUTER_DATA_SLOT_IDS,
    BLUE_BONUS_REQUIRED_COMPUTER_SLOT,
    BLUE_BONUS_DATA_SLOTS,
    BLUE_BONUS_DATA_SLOT_IDS,
    getDataPoolSlotLayout,
    getComputerDataSlotLayout,
    getBlueBonusDataSlotLayout,
    getRequiredComputerSlotForBlueBonus,
  });
});
