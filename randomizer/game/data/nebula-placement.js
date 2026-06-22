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
    aomomo: 3,
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
    aomomo: "奥陌陌",
  });

  const NEBULA_COLOR_BY_ID = Object.freeze({
    "sector-4-a": "yellow",
    "sector-3-a": "yellow",
    "sector-2-b": "red",
    "sector-3-b": "red",
    "sector-2-a": "blue",
    "sector-1-a": "blue",
    "sector-1-b": "black",
    "sector-4-b": "black",
    aomomo: "aomomo",
  });

  const SECTOR_WIN_MARKER_SLOTS = Object.freeze({
    "sector-1-a": Object.freeze({ firstKind: "circle" }),
    "sector-1-b": Object.freeze({ firstKind: "circle" }),
    "sector-2-a": Object.freeze({ firstKind: "bar" }),
    "sector-2-b": Object.freeze({ firstKind: "circle" }),
    "sector-3-a": Object.freeze({ firstKind: "circle" }),
    "sector-3-b": Object.freeze({ firstKind: "bar" }),
    "sector-4-a": Object.freeze({ firstKind: "bar" }),
    "sector-4-b": Object.freeze({ firstKind: "circle" }),
  });

  const SECTOR_WIN_MARKER_CALIBRATION = Object.freeze({
    "sector-1-a": Object.freeze({
      circle: Object.freeze({
        1: Object.freeze({ percentX: 29.63, percentY: 33.79 }),
      }),
      bar: Object.freeze({
        1: Object.freeze({ percentX: 36.45, percentY: 27.68 }),
      }),
    }),
    "sector-1-b": Object.freeze({
      circle: Object.freeze({
        1: Object.freeze({ percentX: 71.52, percentY: 35.39 }),
      }),
      bar: Object.freeze({
        1: Object.freeze({ percentX: 77.3, percentY: 41.42 }),
      }),
    }),
    "sector-2-a": Object.freeze({
      bar: Object.freeze({
        1: Object.freeze({ percentX: 30.03, percentY: 33.86 }),
        2: Object.freeze({ percentX: 34.2, percentY: 30.25 }),
      }),
    }),
    "sector-2-b": Object.freeze({
      circle: Object.freeze({
        1: Object.freeze({ percentX: 71.12, percentY: 35.07 }),
      }),
      bar: Object.freeze({
        1: Object.freeze({ percentX: 77.7, percentY: 41.42 }),
      }),
    }),
    "sector-3-a": Object.freeze({
      circle: Object.freeze({
        1: Object.freeze({ percentX: 29.71, percentY: 33.06 }),
      }),
      bar: Object.freeze({
        1: Object.freeze({ percentX: 35.97, percentY: 27.84 }),
      }),
    }),
    "sector-3-b": Object.freeze({
      bar: Object.freeze({
        1: Object.freeze({ percentX: 71.6, percentY: 35.47 }),
        2: Object.freeze({ percentX: 75.29, percentY: 39.08 }),
      }),
    }),
    "sector-4-a": Object.freeze({
      bar: Object.freeze({
        1: Object.freeze({ percentX: 29.71, percentY: 33.31 }),
        2: Object.freeze({ percentX: 32.75, percentY: 30.9 }),
      }),
    }),
    "sector-4-b": Object.freeze({
      circle: Object.freeze({
        1: Object.freeze({ percentX: 70.8, percentY: 34.51 }),
      }),
      bar: Object.freeze({
        1: Object.freeze({ percentX: 76.9, percentY: 42.54 }),
      }),
    }),
  });

  const SECTOR_IMAGE_ASPECT_RATIO = 1672 / 941;
  const NEBULA_DATA_TOKEN_WIDTH_PERCENT = 17;
  const NEBULA_DATA_TOKEN_DISPLAY_SCALE = 3.5;
  const SECTOR_WIN_TOKEN_SCALE_MULTIPLIER = 0.9;
  const SECTOR_WIN_ANCHOR_SLOT_INDEX = 3;
  const SECTOR_WIN_VERTICAL_DATA_SIZE_OFFSET = 2;
  const DEFAULT_SECTOR_WIN_BAR_STEP = Object.freeze({ x: 3.8, y: 0 });
  const DEFAULT_RIGHT_SECTOR_WIN_BAR_STEP = Object.freeze({ x: 3.8, y: 3.6 });

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
    aomomo: Object.freeze([
      Object.freeze({ slotIndex: 1, percentX: 63.91, percentY: 69.21, scalePercent: 7.6, radialFraction: 0.6379, angularFraction: 0.202 }),
      Object.freeze({ slotIndex: 2, percentX: 61.38, percentY: 70.65, scalePercent: 7.6, radialFraction: 0.6177, angularFraction: 0.3587 }),
      Object.freeze({ slotIndex: 3, percentX: 58.73, percentY: 71.86, scalePercent: 7.6, radialFraction: 0.6121, angularFraction: 0.5162 }),
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

  function getNebulaColor(nebulaId) {
    return NEBULA_COLOR_BY_ID[nebulaId] || null;
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

  function getSectorWinMarkerConfig(nebulaId) {
    return SECTOR_WIN_MARKER_SLOTS[nebulaId] || null;
  }

  function getSectorWinMarkerCalibration(nebulaId) {
    return SECTOR_WIN_MARKER_CALIBRATION[nebulaId] || null;
  }

  function clampPercent(value, min = 0, max = 100) {
    return roundPercent(Math.min(max, Math.max(min, Number(value) || 0)));
  }

  function getSectorWinAnchorSlot(nebulaId) {
    const slots = listNebulaSlotLayouts(nebulaId);
    if (!slots.length) return null;
    return getNebulaDataSlotLayout(nebulaId, SECTOR_WIN_ANCHOR_SLOT_INDEX)
      || slots[Math.floor(slots.length / 2)]
      || slots[0];
  }

  function getDataTokenSectorSize(nebulaId, slot) {
    const region = getNebulaPanelRegion(nebulaId);
    const scale = ((Number(slot?.scalePercent) || 11.8) / 100) * NEBULA_DATA_TOKEN_DISPLAY_SCALE;
    const widthPercent = (NEBULA_DATA_TOKEN_WIDTH_PERCENT * scale * region.widthPercent) / 100;
    return {
      widthPercent: roundPercent(widthPercent),
      heightPercent: roundPercent(widthPercent * SECTOR_IMAGE_ASPECT_RATIO),
    };
  }

  function getSectorWinAnchorLayout(nebulaId) {
    const anchorSlot = getSectorWinAnchorSlot(nebulaId);
    if (!anchorSlot) return null;
    const anchor = nebulaLocalToSectorImage(nebulaId, anchorSlot.percentX, anchorSlot.percentY);
    const size = getDataTokenSectorSize(nebulaId, anchorSlot);
    const region = getNebulaPanelRegion(nebulaId);
    const nextSlot = getNebulaDataSlotLayout(nebulaId, Number(anchorSlot.slotIndex) + 1);
    const next = nextSlot
      ? nebulaLocalToSectorImage(nebulaId, nextSlot.percentX, nextSlot.percentY)
      : null;
    const observedStepX = next ? Math.abs(next.percentX - anchor.percentX) : 0;
    const stepX = roundPercent(Math.max(observedStepX, size.widthPercent * 1.15, 3.5));
    const minX = region.originX + size.widthPercent / 2;
    const maxX = region.originX + region.widthPercent - size.widthPercent / 2;
    return {
      percentX: clampPercent(anchor.percentX, minX, maxX),
      percentY: clampPercent(anchor.percentY - size.heightPercent * SECTOR_WIN_VERTICAL_DATA_SIZE_OFFSET, 2, 98),
      scalePercent: roundPercent(Math.max(size.widthPercent * 1.1, 4.2) * SECTOR_WIN_TOKEN_SCALE_MULTIPLIER),
      stepX,
      stepY: 0,
      minX,
      maxX,
    };
  }

  function getCalibratedBarStep(nebulaId, calibration) {
    const bar = calibration?.bar;
    if (bar?.[1] && bar?.[2]) {
      return {
        x: roundPercent(bar[2].percentX - bar[1].percentX),
        y: roundPercent(bar[2].percentY - bar[1].percentY),
      };
    }
    if (bar?.[1] && calibration?.circle?.[1]) {
      return {
        x: roundPercent((bar[1].percentX - calibration.circle[1].percentX) * 0.5),
        y: roundPercent((bar[1].percentY - calibration.circle[1].percentY) * 0.5),
      };
    }
    return isRightNebula(nebulaId)
      ? { ...DEFAULT_RIGHT_SECTOR_WIN_BAR_STEP }
      : { ...DEFAULT_SECTOR_WIN_BAR_STEP };
  }

  function getCalibratedSectorWinMarkerLayout(nebulaId, kind, markerIndex, scalePercent) {
    const calibration = getSectorWinMarkerCalibration(nebulaId);
    if (!calibration) return null;
    const index = Math.max(1, Math.round(Number(markerIndex) || 1));
    const group = calibration[kind];
    const exact = group?.[kind === "circle" ? 1 : index];
    if (exact) {
      return {
        percentX: exact.percentX,
        percentY: exact.percentY,
        scalePercent,
        slotKind: kind,
        markerIndex: kind === "circle" ? 1 : index,
      };
    }
    if (kind !== "bar") return null;
    if (!calibration.bar?.[1] && calibration.circle?.[1]) {
      const step = getCalibratedBarStep(nebulaId, calibration);
      const circle = calibration.circle[1];
      return {
        percentX: roundPercent(circle.percentX + index * step.x),
        percentY: roundPercent(circle.percentY + index * step.y),
        scalePercent,
        stepX: step.x,
        stepY: step.y,
        slotKind: "bar",
        markerIndex: index,
      };
    }
    if (!calibration.bar?.[1]) return null;

    const step = getCalibratedBarStep(nebulaId, calibration);
    const first = calibration.bar[1];
    return {
      percentX: roundPercent(first.percentX + (index - 1) * step.x),
      percentY: roundPercent(first.percentY + (index - 1) * step.y),
      scalePercent,
      stepX: step.x,
      stepY: step.y,
      slotKind: "bar",
      markerIndex: index,
    };
  }

  function getSectorWinMarkerLayout(nebulaId, slotKind = "bar", markerIndex = 1) {
    const config = getSectorWinMarkerConfig(nebulaId);
    if (!config) return null;
    const anchor = getSectorWinAnchorLayout(nebulaId);
    if (!anchor) return null;
    const kind = slotKind === "circle" && config.firstKind === "circle" ? "circle" : "bar";
    const index = Math.max(1, Math.round(Number(markerIndex) || 1));
    const calibrated = getCalibratedSectorWinMarkerLayout(nebulaId, kind, index, anchor.scalePercent);
    if (calibrated) return calibrated;
    const sequenceIndex = kind === "circle"
      ? 1
      : (config.firstKind === "circle" ? index + 1 : index);
    const percentX = clampPercent(
      anchor.percentX + (sequenceIndex - 1) * anchor.stepX,
      anchor.minX,
      anchor.maxX,
    );
    const layout = {
      percentX,
      percentY: anchor.percentY,
      scalePercent: anchor.scalePercent,
      stepX: anchor.stepX,
      stepY: anchor.stepY,
      slotKind: kind,
      markerIndex: kind === "circle" ? 1 : index,
    };
    return layout;
  }

  function listSectorWinDebugSlots(nebulaId) {
    const config = getSectorWinMarkerConfig(nebulaId);
    if (!config) return [];
    if (config.firstKind === "circle") {
      return [
        { slotKind: "circle", markerIndex: 1, label: "首次圆形区域" },
        { slotKind: "bar", markerIndex: 1, label: "后续条形区域" },
      ];
    }
    return [
      { slotKind: "bar", markerIndex: 1, label: "条形区域 1" },
      { slotKind: "bar", markerIndex: 2, label: "条形区域 2" },
    ];
  }

  function listNebulaIdsForSector(sectorId) {
    return NEBULA_IDS_BY_SECTOR[Number(sectorId)] || [];
  }

  return Object.freeze({
    NEBULA_DATA_CAPACITY,
    NEBULA_LABELS,
    NEBULA_COLOR_BY_ID,
    NEBULA_DATA_SLOTS,
    SECTOR_WIN_MARKER_SLOTS,
    NEBULA_IDS,
    NEBULA_IDS_BY_SECTOR,
    BOARD_SLOT_ROTATION,
    NEBULA_PANEL_REGION,
    getNebulaPanelRegion,
    getBoardSlotRotation,
    sectorImageToNebulaLocal,
    nebulaLocalToSectorImage,
    getNebulaLabel,
    getNebulaColor,
    getNebulaCapacity,
    listNebulaSlotLayouts,
    getNebulaDataSlotLayout,
    getSectorWinMarkerConfig,
    getSectorWinMarkerLayout,
    listSectorWinDebugSlots,
    listNebulaIdsForSector,
  });
});
