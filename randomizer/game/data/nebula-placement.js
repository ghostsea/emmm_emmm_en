(function (root, factory) {
  "use strict";

  const api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.SetiNebulaDataPlacement = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function () {
  "use strict";

  /** 各星云可放置的数据数量 */
  const NEBULA_DATA_CAPACITY = Object.freeze({
    "sector-1-a": 5,
    "sector-1-b": 4,
    "sector-2-a": 6,
    "sector-2-b": 5,
    "sector-3-a": 5,
    "sector-3-b": 6,
    "sector-4-a": 6,
    "sector-4-b": 5,
  });

  const NEBULA_LABELS = Object.freeze({
    "sector-1-a": "南河三",
    "sector-1-b": "织女一",
    "sector-2-a": "天狼星A",
    "sector-2-b": "巴纳德",
    "sector-3-a": "开普勒22",
    "sector-3-b": "比邻星",
    "sector-4-a": "室女座61",
    "sector-4-b": "绘架座β",
  });

  /** 版图外边槽位对应 sector-wrap 的 CSS 旋转角度 */
  const BOARD_SLOT_ROTATION = Object.freeze({
    1: 0,
    2: -90,
    3: 90,
    4: 180,
  });

  /**
   * 每个星云在 sector 贴图上的面板区域（贴图坐标，百分比）。
   * localIndex 0 = 左半，1 = 右半。
   */
  const NEBULA_PANEL_REGION = Object.freeze({
    left: Object.freeze({ originX: 0, originY: 0, widthPercent: 50, heightPercent: 100 }),
    right: Object.freeze({ originX: 50, originY: 0, widthPercent: 50, heightPercent: 100 }),
  });

  /**
   * 星云数据槽位布局：percentX/percentY 为星云面板局部坐标（0–100%），
   * 与 sector 贴图绝对位置无关，扇区洗牌后仍正确。
   */
  const NEBULA_DATA_SLOTS = Object.freeze({
    "sector-1-a": Object.freeze([
      Object.freeze({ slotIndex: 1, percentX: 46.56, percentY: 60.12, scalePercent: 11.8 }),
      Object.freeze({ slotIndex: 2, percentX: 53.24, percentY: 55.62, scalePercent: 11.8 }),
      Object.freeze({ slotIndex: 3, percentX: 60.44, percentY: 50.8, scalePercent: 11.8 }),
      Object.freeze({ slotIndex: 4, percentX: 67.88, percentY: 47.26, scalePercent: 11.8 }),
      Object.freeze({ slotIndex: 5, percentX: 75.32, percentY: 44.69, scalePercent: 11.8 }),
    ]),
    "sector-1-b": Object.freeze([
      Object.freeze({ slotIndex: 1, percentX: 23.36, percentY: 44.05, scalePercent: 11.8 }),
      Object.freeze({ slotIndex: 2, percentX: 31.06, percentY: 46.3, scalePercent: 11.8 }),
      Object.freeze({ slotIndex: 3, percentX: 38.26, percentY: 49.83, scalePercent: 11.8 }),
      Object.freeze({ slotIndex: 4, percentX: 45.7, percentY: 54.01, scalePercent: 11.8 }),
    ]),
    "sector-2-a": Object.freeze([
      Object.freeze({ slotIndex: 1, percentX: 42.52, percentY: 62.05, scalePercent: 11.8 }),
      Object.freeze({ slotIndex: 2, percentX: 48.94, percentY: 56.92, scalePercent: 11.8 }),
      Object.freeze({ slotIndex: 3, percentX: 56.38, percentY: 51.46, scalePercent: 11.8 }),
      Object.freeze({ slotIndex: 4, percentX: 64.08, percentY: 47.61, scalePercent: 11.8 }),
      Object.freeze({ slotIndex: 5, percentX: 71.52, percentY: 44.4, scalePercent: 11.8 }),
      Object.freeze({ slotIndex: 6, percentX: 78.96, percentY: 42.16, scalePercent: 11.8 }),
    ]),
    "sector-2-b": Object.freeze([
      Object.freeze({ slotIndex: 1, percentX: 19.54, percentY: 41.52, scalePercent: 11.8 }),
      Object.freeze({ slotIndex: 2, percentX: 26.98, percentY: 44.08, scalePercent: 11.8 }),
      Object.freeze({ slotIndex: 3, percentX: 34.42, percentY: 46.65, scalePercent: 11.8 }),
      Object.freeze({ slotIndex: 4, percentX: 41.6, percentY: 50.18, scalePercent: 11.8 }),
      Object.freeze({ slotIndex: 5, percentX: 48.28, percentY: 54.35, scalePercent: 11.8 }),
    ]),
    "sector-3-a": Object.freeze([
      Object.freeze({ slotIndex: 1, percentX: 46.56, percentY: 58.49, scalePercent: 11.8 }),
      Object.freeze({ slotIndex: 2, percentX: 53.5, percentY: 53.67, scalePercent: 11.8 }),
      Object.freeze({ slotIndex: 3, percentX: 60.68, percentY: 49.5, scalePercent: 11.8 }),
      Object.freeze({ slotIndex: 4, percentX: 67.88, percentY: 46.29, scalePercent: 11.8 }),
      Object.freeze({ slotIndex: 5, percentX: 75.32, percentY: 43.71, scalePercent: 11.8 }),
    ]),
    "sector-3-b": Object.freeze([
      Object.freeze({ slotIndex: 1, percentX: 15.38, percentY: 40.82, scalePercent: 11.8 }),
      Object.freeze({ slotIndex: 2, percentX: 22.84, percentY: 42.75, scalePercent: 11.8 }),
      Object.freeze({ slotIndex: 3, percentX: 30.54, percentY: 45.32, scalePercent: 11.8 }),
      Object.freeze({ slotIndex: 4, percentX: 37.48, percentY: 48.53, scalePercent: 11.8 }),
      Object.freeze({ slotIndex: 5, percentX: 44.66, percentY: 52.39, scalePercent: 11.8 }),
      Object.freeze({ slotIndex: 6, percentX: 51.34, percentY: 57.21, scalePercent: 11.8 }),
    ]),
    "sector-4-a": Object.freeze([
      Object.freeze({ slotIndex: 1, percentX: 41.98, percentY: 62.64, scalePercent: 11.8 }),
      Object.freeze({ slotIndex: 2, percentX: 48.14, percentY: 57.49, scalePercent: 11.8 }),
      Object.freeze({ slotIndex: 3, percentX: 55.32, percentY: 52.68, scalePercent: 11.8 }),
      Object.freeze({ slotIndex: 4, percentX: 62.52, percentY: 48.5, scalePercent: 11.8 }),
      Object.freeze({ slotIndex: 5, percentX: 69.96, percentY: 45.29, scalePercent: 11.8 }),
      Object.freeze({ slotIndex: 6, percentX: 77.92, percentY: 42.72, scalePercent: 11.8 }),
    ]),
    "sector-4-b": Object.freeze([
      Object.freeze({ slotIndex: 1, percentX: 18.5, percentY: 42.07, scalePercent: 11.8 }),
      Object.freeze({ slotIndex: 2, percentX: 26.22, percentY: 44, scalePercent: 11.8 }),
      Object.freeze({ slotIndex: 3, percentX: 34.18, percentY: 47.21, scalePercent: 11.8 }),
      Object.freeze({ slotIndex: 4, percentX: 41.62, percentY: 51.07, scalePercent: 11.8 }),
      Object.freeze({ slotIndex: 5, percentX: 48.56, percentY: 55.57, scalePercent: 11.8 }),
    ]),
  });

  const NEBULA_IDS = Object.freeze(Object.keys(NEBULA_DATA_CAPACITY));

  const NEBULA_IDS_BY_SECTOR = Object.freeze({
    1: Object.freeze(["sector-1-a", "sector-1-b"]),
    2: Object.freeze(["sector-2-a", "sector-2-b"]),
    3: Object.freeze(["sector-3-a", "sector-3-b"]),
    4: Object.freeze(["sector-4-a", "sector-4-b"]),
  });

  function roundPercent(value) {
    return Math.round(value * 100) / 100;
  }

  function isRightNebula(nebulaId) {
    return String(nebulaId).endsWith("-b");
  }

  function getNebulaPanelRegion(nebulaId) {
    return isRightNebula(nebulaId) ? NEBULA_PANEL_REGION.right : NEBULA_PANEL_REGION.left;
  }

  function getBoardSlotRotation(boardSlot) {
    return BOARD_SLOT_ROTATION[Number(boardSlot)] ?? 0;
  }

  function sectorImageToNebulaLocal(nebulaId, sectorPercentX, sectorPercentY) {
    const region = getNebulaPanelRegion(nebulaId);
    return {
      percentX: roundPercent(((sectorPercentX - region.originX) / region.widthPercent) * 100),
      percentY: roundPercent(((sectorPercentY - region.originY) / region.heightPercent) * 100),
    };
  }

  function nebulaLocalToSectorImage(nebulaId, localPercentX, localPercentY) {
    const region = getNebulaPanelRegion(nebulaId);
    return {
      percentX: roundPercent(region.originX + (localPercentX / 100) * region.widthPercent),
      percentY: roundPercent(region.originY + (localPercentY / 100) * region.heightPercent),
    };
  }

  function getNebulaLabel(nebulaId) {
    return NEBULA_LABELS[nebulaId] || nebulaId;
  }

  function getNebulaCapacity(nebulaId) {
    return NEBULA_DATA_CAPACITY[nebulaId] ?? 0;
  }

  function listNebulaSlotLayouts(nebulaId) {
    return NEBULA_DATA_SLOTS[nebulaId] || [];
  }

  function getNebulaDataSlotLayout(nebulaId, slotIndex) {
    const slots = NEBULA_DATA_SLOTS[nebulaId];
    if (!slots) return null;
    return slots.find((slot) => slot.slotIndex === Number(slotIndex)) || null;
  }

  function listNebulaIdsForSector(sectorId) {
    return NEBULA_IDS_BY_SECTOR[Number(sectorId)] || [];
  }

  return Object.freeze({
    NEBULA_DATA_CAPACITY,
    NEBULA_LABELS,
    NEBULA_DATA_SLOTS,
    NEBULA_IDS,
    NEBULA_IDS_BY_SECTOR,
    BOARD_SLOT_ROTATION,
    NEBULA_PANEL_REGION,
    getNebulaPanelRegion,
    getBoardSlotRotation,
    sectorImageToNebulaLocal,
    nebulaLocalToSectorImage,
    getNebulaLabel,
    getNebulaCapacity,
    listNebulaSlotLayouts,
    getNebulaDataSlotLayout,
    listNebulaIdsForSector,
  });
});
