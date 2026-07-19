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

  /** 计算机第一排放置位额外奖励：2 号位 +1 宣传，4 号位获得 1 次收入。 */
  const COMPUTER_SLOT_BONUSES = Object.freeze({
    2: Object.freeze({ type: "publicity", publicity: 1 }),
    4: Object.freeze({ type: "income" }),
  });

  /**
   * 蓝色科技版图槽位 → 对应第一排数据位。
   * 位置 1 仅第一排；位置 2/3/4 另有科技下方附加位。
   */
  const BLUE_BOARD_SLOT_TO_COMPUTER_SLOT = Object.freeze({
    1: 1,
    2: 3,
    3: 5,
    4: 6,
  });

  /**
   * 蓝色科技版图槽位 → 第一排必须先放置的数据位（附加位前置条件）。
   */
  const BLUE_BONUS_REQUIRED_COMPUTER_SLOT = Object.freeze({
    1: 1,
    2: 3,
    3: 5,
    4: 6,
  });

  /** 蓝色科技片 id → 其下方附加数据放置奖励 */
  const BLUE_TILE_DATA_BONUSES = Object.freeze({
    blue1: Object.freeze({ type: "credits", credits: 1 }),
    blue2: Object.freeze({ type: "energy", energy: 1 }),
    blue3: Object.freeze({ type: "choose_card" }),
    blue4: Object.freeze({ type: "publicity", publicity: 2 }),
  });

  const BLUE_COLUMN_SCORE_BONUS = Object.freeze({ type: "score", score: 2 });

  /** 蓝色科技下方附加数据放置位（键为蓝色科技版图槽位 1–4） */
  const BLUE_BONUS_DATA_SLOTS = Object.freeze({
    1: Object.freeze({ percentX: 34.69, percentY: 80.2, scalePercent: 11.8 }),
    2: Object.freeze({ percentX: 49.12, percentY: 80.14, scalePercent: 11.8 }),
    3: Object.freeze({ percentX: 63.88, percentY: 81.29, scalePercent: 11.8 }),
    4: Object.freeze({ percentX: 72.05, percentY: 81, scalePercent: 11.8 }),
  });

  const BLUE_BONUS_DATA_SLOT_IDS = Object.freeze(
    Object.keys(BLUE_BONUS_DATA_SLOTS).map(Number).sort((a, b) => a - b),
  );

  const BLUE_BONUS_DATA_POSITION_LABELS = Object.freeze({
    1: "第一列第二行",
    2: "第二列第二行",
    3: "第三列第二行",
    4: "第四列第二行",
  });

  function getDataPoolSlotLayout(slotIndex) {
    return DATA_POOL_SLOTS[Number(slotIndex)] || null;
  }

  function getComputerDataSlotLayout(placementSlot) {
    return COMPUTER_DATA_SLOTS[Number(placementSlot)] || null;
  }

  function getComputerSlotBonus(placementSlot) {
    const bonus = COMPUTER_SLOT_BONUSES[Number(placementSlot)];
    return bonus ? { ...bonus } : null;
  }

  function getBlueBonusDataSlotLayout(blueSlot) {
    return BLUE_BONUS_DATA_SLOTS[Number(blueSlot)] || null;
  }

  function getBlueBonusDataPositionLabel(blueSlot) {
    return BLUE_BONUS_DATA_POSITION_LABELS[Number(blueSlot)] || "第二行";
  }

  function getRequiredComputerSlotForBlueBonus(blueSlot) {
    return BLUE_BONUS_REQUIRED_COMPUTER_SLOT[Number(blueSlot)] ?? null;
  }

  function getComputerSlotForBlueBoardSlot(blueBoardSlot) {
    return BLUE_BOARD_SLOT_TO_COMPUTER_SLOT[Number(blueBoardSlot)] ?? null;
  }

  function getBlueBoardSlotForComputerSlot(placementSlot) {
    const slot = Number(placementSlot);
    for (const [blueBoardSlot, computerSlot] of Object.entries(BLUE_BOARD_SLOT_TO_COMPUTER_SLOT)) {
      if (computerSlot === slot) return Number(blueBoardSlot);
    }
    return null;
  }

  function getBlueTileDataBonus(tileId) {
    const bonus = BLUE_TILE_DATA_BONUSES[tileId];
    return bonus ? { ...bonus } : null;
  }

  function getBlueColumnScoreBonus() {
    return { ...BLUE_COLUMN_SCORE_BONUS };
  }

  return Object.freeze({
    DATA_TOKEN_DISPLAY_SCALE,
    DATA_POOL_SLOTS,
    DATA_POOL_SLOT_IDS,
    COMPUTER_DATA_SLOTS,
    COMPUTER_DATA_SLOT_IDS,
    COMPUTER_SLOT_BONUSES,
    BLUE_BOARD_SLOT_TO_COMPUTER_SLOT,
    BLUE_BONUS_REQUIRED_COMPUTER_SLOT,
    BLUE_TILE_DATA_BONUSES,
    BLUE_COLUMN_SCORE_BONUS,
    BLUE_BONUS_DATA_SLOTS,
    BLUE_BONUS_DATA_SLOT_IDS,
    BLUE_BONUS_DATA_POSITION_LABELS,
    getDataPoolSlotLayout,
    getComputerDataSlotLayout,
    getComputerSlotBonus,
    getBlueBonusDataSlotLayout,
    getBlueBonusDataPositionLabel,
    getRequiredComputerSlotForBlueBonus,
    getComputerSlotForBlueBoardSlot,
    getBlueBoardSlotForComputerSlot,
    getBlueTileDataBonus,
    getBlueColumnScoreBonus,
  });
});
