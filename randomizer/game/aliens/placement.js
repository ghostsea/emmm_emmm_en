(function (root, factory) {
  "use strict";

  const api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.SetiAlienPlacement = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function () {
  "use strict";

  const TRACE_TYPES = Object.freeze(["yellow", "pink", "blue"]);
  const ALIEN_SLOT_IDS = Object.freeze([1, 2]);

  const TRACE_TYPE_LABELS = Object.freeze({
    yellow: "黄色痕迹",
    pink: "粉色痕迹",
    blue: "蓝色痕迹",
  });

  const ALIEN_TRACE_TOKEN_SRC = "../assets/tokens/normal_token.png";
  const ALIEN_TRACE_TOKEN_BASE_WIDTH_PERCENT = 14;
  const ALIEN_STATE_REFERENCE_WIDTH = 443;
  const ALIEN_STATE_REFERENCE_HEIGHT = 208;

  const ALIEN_TRACE_TOKEN_DISPLAY_SCALE = 7;
  const ALIEN_EXTRA_TRACE_TOKEN_DISPLAY_SCALE = 5;
  const JIUZHE_TRACE_TOKEN_DISPLAY_SCALE = 1.44;
  const YICHANGDIAN_TRACE_TOKEN_DISPLAY_SCALE = 1.44;
  const YICHANGDIAN_ANOMALY_MARKER_SCALE_PERCENT = 6.5;
  const YICHANGDIAN_ANOMALY_EDGE_RADIAL_FRACTION = 0.92;
  const YICHANGDIAN_ANOMALY_EDGE_ANGULAR_FRACTIONS = Object.freeze({
    a: 0.22,
    b: 0.5,
    c: 0.78,
  });
  const YICHANGDIAN_POSITION1_STACK_STEP_Y = 14.5;

  /** 非首标记网格：每行 3 个；校准锚点为第二行第二列（0-based: row=1, col=1） */
  const EXTRA_TRACE_GRID_COLUMNS = 3;
  const EXTRA_TRACE_GRID_ANCHOR_ROW = 1;
  const EXTRA_TRACE_GRID_ANCHOR_COL = 1;

  const ALIEN_TRACE_MARKER_SLOTS = Object.freeze({
    1: Object.freeze({
      pink: Object.freeze({ percentX: 16.41, percentY: 23.82, scalePercent: 14 }),
      yellow: Object.freeze({ percentX: 50.06, percentY: 23.15, scalePercent: 14 }),
      blue: Object.freeze({ percentX: 80.86, percentY: 23.82, scalePercent: 14 }),
    }),
    2: Object.freeze({
      pink: Object.freeze({ percentX: 16.73, percentY: 23.65, scalePercent: 14 }),
      yellow: Object.freeze({ percentX: 50.06, percentY: 23.65, scalePercent: 14 }),
      blue: Object.freeze({ percentX: 82.76, percentY: 23.65, scalePercent: 14 }),
    }),
  });

  /** 非首标记网格锚点（第二行第二列中心），可拖动校准 */
  const ALIEN_EXTRA_TRACE_MARKER_SLOTS = Object.freeze({
    1: Object.freeze({
      pink: Object.freeze({ percentX: 16.5, percentY: 72, scalePercent: 14 }),
      yellow: Object.freeze({ percentX: 50, percentY: 72, scalePercent: 14 }),
      blue: Object.freeze({ percentX: 83.5, percentY: 72, scalePercent: 14 }),
    }),
    2: Object.freeze({
      pink: Object.freeze({ percentX: 16.5, percentY: 72, scalePercent: 14 }),
      yellow: Object.freeze({ percentX: 50, percentY: 72, scalePercent: 14 }),
      blue: Object.freeze({ percentX: 83.5, percentY: 72, scalePercent: 14 }),
    }),
  });

  const JIUZHE_TRACE_MARKER_SLOTS = Object.freeze({
    1: Object.freeze({
      pink: Object.freeze({
        1: Object.freeze({ percentX: 18.43, percentY: 36.19, scalePercent: 62 }),
        2: Object.freeze({ percentX: 18.43, percentY: 48.85, scalePercent: 62 }),
        3: Object.freeze({ percentX: 18.43, percentY: 59.55, scalePercent: 62 }),
        4: Object.freeze({ percentX: 18.43, percentY: 72.21, scalePercent: 62 }),
        5: Object.freeze({ percentX: 18.43, percentY: 84, scalePercent: 62 }),
      }),
      yellow: Object.freeze({
        1: Object.freeze({ percentX: 49.74, percentY: 40.12, scalePercent: 62 }),
        2: Object.freeze({ percentX: 49.74, percentY: 52.78, scalePercent: 62 }),
        3: Object.freeze({ percentX: 49.74, percentY: 64.13, scalePercent: 62 }),
        4: Object.freeze({ percentX: 49.74, percentY: 76.58, scalePercent: 62 }),
        5: Object.freeze({ percentX: 49.74, percentY: 89.46, scalePercent: 62 }),
      }),
      blue: Object.freeze({
        1: Object.freeze({ percentX: 81.14, percentY: 36.19, scalePercent: 62 }),
        2: Object.freeze({ percentX: 81.14, percentY: 49.07, scalePercent: 62 }),
        3: Object.freeze({ percentX: 81.14, percentY: 59.99, scalePercent: 62 }),
        4: Object.freeze({ percentX: 81.14, percentY: 73.3, scalePercent: 62 }),
        5: Object.freeze({ percentX: 81.14, percentY: 84, scalePercent: 62 }),
      }),
    }),
    2: Object.freeze({
      pink: Object.freeze({
        1: Object.freeze({ percentX: 18.43, percentY: 36.19, scalePercent: 62 }),
        2: Object.freeze({ percentX: 18.43, percentY: 48.85, scalePercent: 62 }),
        3: Object.freeze({ percentX: 18.43, percentY: 59.55, scalePercent: 62 }),
        4: Object.freeze({ percentX: 18.43, percentY: 72.21, scalePercent: 62 }),
        5: Object.freeze({ percentX: 18.43, percentY: 84, scalePercent: 62 }),
      }),
      yellow: Object.freeze({
        1: Object.freeze({ percentX: 49.74, percentY: 40.12, scalePercent: 62 }),
        2: Object.freeze({ percentX: 49.74, percentY: 52.78, scalePercent: 62 }),
        3: Object.freeze({ percentX: 49.74, percentY: 64.13, scalePercent: 62 }),
        4: Object.freeze({ percentX: 49.74, percentY: 76.58, scalePercent: 62 }),
        5: Object.freeze({ percentX: 49.74, percentY: 89.46, scalePercent: 62 }),
      }),
      blue: Object.freeze({
        1: Object.freeze({ percentX: 81.14, percentY: 36.19, scalePercent: 62 }),
        2: Object.freeze({ percentX: 81.14, percentY: 49.07, scalePercent: 62 }),
        3: Object.freeze({ percentX: 81.14, percentY: 59.99, scalePercent: 62 }),
        4: Object.freeze({ percentX: 81.14, percentY: 73.3, scalePercent: 62 }),
        5: Object.freeze({ percentX: 81.14, percentY: 84, scalePercent: 62 }),
      }),
    }),
  });

  const YICHANGDIAN_TRACE_MARKER_SLOTS = Object.freeze({
    1: Object.freeze({
      pink: Object.freeze({
        1: Object.freeze({ percentX: 18.43, percentY: 34.44, scalePercent: 62 }),
        2: Object.freeze({ percentX: 18.43, percentY: 46.24, scalePercent: 62 }),
        3: Object.freeze({ percentX: 18.43, percentY: 58.04, scalePercent: 62 }),
        4: Object.freeze({ percentX: 18.43, percentY: 70.18, scalePercent: 62 }),
        5: Object.freeze({ percentX: 18.43, percentY: 82.3, scalePercent: 62 }),
      }),
      yellow: Object.freeze({
        1: Object.freeze({ percentX: 49.74, percentY: 34.44, scalePercent: 62 }),
        2: Object.freeze({ percentX: 49.74, percentY: 46.24, scalePercent: 62 }),
        3: Object.freeze({ percentX: 49.74, percentY: 58.04, scalePercent: 62 }),
        4: Object.freeze({ percentX: 49.74, percentY: 70.18, scalePercent: 62 }),
        5: Object.freeze({ percentX: 49.74, percentY: 82.3, scalePercent: 62 }),
      }),
      blue: Object.freeze({
        1: Object.freeze({ percentX: 81.14, percentY: 34.44, scalePercent: 62 }),
        2: Object.freeze({ percentX: 81.14, percentY: 46.24, scalePercent: 62 }),
        3: Object.freeze({ percentX: 81.14, percentY: 58.04, scalePercent: 62 }),
        4: Object.freeze({ percentX: 81.14, percentY: 70.18, scalePercent: 62 }),
        5: Object.freeze({ percentX: 81.14, percentY: 82.3, scalePercent: 62 }),
      }),
    }),
    2: Object.freeze({
      pink: Object.freeze({
        1: Object.freeze({ percentX: 18.4, percentY: 35.95, scalePercent: 62 }),
        2: Object.freeze({ percentX: 18.4, percentY: 50.94, scalePercent: 62 }),
        3: Object.freeze({ percentX: 18.4, percentY: 61.95, scalePercent: 62 }),
        4: Object.freeze({ percentX: 18.4, percentY: 73.33, scalePercent: 62 }),
        5: Object.freeze({ percentX: 18.4, percentY: 84.15, scalePercent: 62 }),
      }),
      yellow: Object.freeze({
        1: Object.freeze({ percentX: 49.34, percentY: 41.45, scalePercent: 62 }),
        2: Object.freeze({ percentX: 49.34, percentY: 54.92, scalePercent: 62 }),
        3: Object.freeze({ percentX: 49.34, percentY: 66.31, scalePercent: 62 }),
        4: Object.freeze({ percentX: 49.34, percentY: 76.75, scalePercent: 62 }),
        5: Object.freeze({ percentX: 49.34, percentY: 89.65, scalePercent: 62 }),
      }),
      blue: Object.freeze({
        1: Object.freeze({ percentX: 80.62, percentY: 36.52, scalePercent: 62 }),
        2: Object.freeze({ percentX: 80.62, percentY: 51.51, scalePercent: 62 }),
        3: Object.freeze({ percentX: 80.62, percentY: 62.33, scalePercent: 62 }),
        4: Object.freeze({ percentX: 80.62, percentY: 73.33, scalePercent: 62 }),
        5: Object.freeze({ percentX: 80.62, percentY: 83.77, scalePercent: 62 }),
      }),
    }),
  });

  function roundPercent(value) {
    return Math.round(value * 100) / 100;
  }

  function getAlienSlotLabel(alienSlotId) {
    return `外星人 ${alienSlotId}`;
  }

  function getTraceTypeLabel(traceType) {
    return TRACE_TYPE_LABELS[traceType] || traceType;
  }

  function getAlienTraceMarkerLayout(alienSlotId, traceType) {
    return ALIEN_TRACE_MARKER_SLOTS[alienSlotId]?.[traceType] || null;
  }

  function getAlienExtraTraceMarkerLayout(alienSlotId, traceType) {
    return ALIEN_EXTRA_TRACE_MARKER_SLOTS[alienSlotId]?.[traceType] || null;
  }

  function getJiuzheTraceMarkerLayout(alienSlotId, traceType, position) {
    return JIUZHE_TRACE_MARKER_SLOTS[alienSlotId]?.[traceType]?.[position] || null;
  }

  function getYichangdianTraceMarkerLayout(alienSlotId, traceType, position) {
    return YICHANGDIAN_TRACE_MARKER_SLOTS[alienSlotId]?.[traceType]?.[position] || null;
  }

  function getYichangdianTraceTokenSize(layout) {
    if (!layout) return null;
    const visualScale = getTraceTokenVisualScale(layout, YICHANGDIAN_TRACE_TOKEN_DISPLAY_SCALE);
    const widthPercent = ALIEN_TRACE_TOKEN_BASE_WIDTH_PERCENT * visualScale;
    const heightPercent = widthPercent * (ALIEN_STATE_REFERENCE_WIDTH / ALIEN_STATE_REFERENCE_HEIGHT);
    return {
      widthPercent: roundPercent(widthPercent),
      heightPercent: roundPercent(heightPercent),
      radiusXPercent: roundPercent(widthPercent / 2),
      radiusYPercent: roundPercent(heightPercent / 2),
    };
  }

  function getYichangdianStackStepY(layout) {
    return getYichangdianTraceTokenSize(layout)?.radiusXPercent || YICHANGDIAN_POSITION1_STACK_STEP_Y;
  }

  function getYichangdianStackTraceMarkerLayout(baseLayout, stackIndex = 0) {
    if (!baseLayout) return null;
    const index = Math.max(0, Math.round(Number(stackIndex) || 0));
    const stepY = getYichangdianStackStepY(baseLayout);
    return {
      ...baseLayout,
      percentY: roundPercent(baseLayout.percentY - index * stepY),
    };
  }

  function getYichangdianBaseFromStackTraceMarkerLayout(stackLayout, stackIndex = 0) {
    if (!stackLayout) return null;
    const index = Math.max(0, Math.round(Number(stackIndex) || 0));
    const stepY = getYichangdianStackStepY(stackLayout);
    return {
      percentX: roundPercent(stackLayout.percentX),
      percentY: roundPercent(stackLayout.percentY + index * stepY),
    };
  }

  function getYichangdianAnomalyMarkerBoardPoint(solarApi, anomaly) {
    if (!solarApi || !anomaly) return null;
    const boundary = solarApi.getSectorCoordinateBoundary(anomaly.sectorX, anomaly.y || 4);
    const radialSpan = boundary.polarBoundary.outerRadius - boundary.polarBoundary.innerRadius;
    const angleSpan = boundary.polarBoundary.endAngleDegrees - boundary.polarBoundary.startAngleDegrees;
    const prefix = String(anomaly.prefix || anomaly.markerId || "").charAt(0);
    const angularFraction = YICHANGDIAN_ANOMALY_EDGE_ANGULAR_FRACTIONS[prefix] ?? 0.5;
    const radius = boundary.polarBoundary.innerRadius + radialSpan * YICHANGDIAN_ANOMALY_EDGE_RADIAL_FRACTION;
    const angleDegrees = boundary.polarBoundary.startAngleDegrees + angleSpan * angularFraction;
    return solarApi.polarToGlobalPoint(radius, angleDegrees);
  }

  function getTraceTokenVisualScale(layout, displayScale) {
    return (layout.scalePercent / 100) * displayScale;
  }

  function getExtraTraceCellSize(layout) {
    const visualScale = getTraceTokenVisualScale(layout, ALIEN_EXTRA_TRACE_TOKEN_DISPLAY_SCALE);
    const widthPercent = ALIEN_TRACE_TOKEN_BASE_WIDTH_PERCENT * visualScale;
    const heightPercent = widthPercent * (ALIEN_STATE_REFERENCE_WIDTH / ALIEN_STATE_REFERENCE_HEIGHT);
    return {
      widthPercent: roundPercent(widthPercent),
      heightPercent: roundPercent(heightPercent),
    };
  }

  function getExtraTraceGridOriginCenter(anchorLayout) {
    const cell = getExtraTraceCellSize(anchorLayout);
    return {
      percentX: roundPercent(anchorLayout.percentX - EXTRA_TRACE_GRID_ANCHOR_COL * cell.widthPercent),
      percentY: roundPercent(anchorLayout.percentY - EXTRA_TRACE_GRID_ANCHOR_ROW * cell.heightPercent),
      scalePercent: anchorLayout.scalePercent,
    };
  }

  function getExtraTraceGridCellIndex(extraIndex) {
    return {
      row: Math.floor(extraIndex / EXTRA_TRACE_GRID_COLUMNS),
      col: extraIndex % EXTRA_TRACE_GRID_COLUMNS,
    };
  }

  function getExtraTraceGridCenter(anchorLayout, extraIndex) {
    const origin = getExtraTraceGridOriginCenter(anchorLayout);
    const cell = getExtraTraceCellSize(anchorLayout);
    const { row, col } = getExtraTraceGridCellIndex(extraIndex);

    return {
      percentX: roundPercent(origin.percentX + col * cell.widthPercent),
      percentY: roundPercent(origin.percentY + row * cell.heightPercent),
      scalePercent: anchorLayout.scalePercent,
    };
  }

  function getExtraTraceAnchorFromGridCenter(gridCenter, extraIndex, anchorLayout) {
    const cell = getExtraTraceCellSize(anchorLayout);
    const { row, col } = getExtraTraceGridCellIndex(extraIndex);

    return {
      percentX: roundPercent(gridCenter.percentX + (EXTRA_TRACE_GRID_ANCHOR_COL - col) * cell.widthPercent),
      percentY: roundPercent(gridCenter.percentY + (EXTRA_TRACE_GRID_ANCHOR_ROW - row) * cell.heightPercent),
    };
  }

  function listAlienTraceMarkerLayouts(alienSlotId) {
    return TRACE_TYPES
      .map((traceType) => {
        const layout = getAlienTraceMarkerLayout(alienSlotId, traceType);
        if (!layout) return null;
        return Object.freeze({
          alienSlotId,
          traceType,
          ...layout,
        });
      })
      .filter(Boolean);
  }

  return Object.freeze({
    TRACE_TYPES,
    ALIEN_SLOT_IDS,
    TRACE_TYPE_LABELS,
    ALIEN_TRACE_TOKEN_SRC,
    ALIEN_TRACE_TOKEN_BASE_WIDTH_PERCENT,
    ALIEN_TRACE_TOKEN_DISPLAY_SCALE,
    ALIEN_EXTRA_TRACE_TOKEN_DISPLAY_SCALE,
    JIUZHE_TRACE_TOKEN_DISPLAY_SCALE,
    YICHANGDIAN_TRACE_TOKEN_DISPLAY_SCALE,
    YICHANGDIAN_ANOMALY_MARKER_SCALE_PERCENT,
    YICHANGDIAN_POSITION1_STACK_STEP_Y,
    EXTRA_TRACE_GRID_COLUMNS,
    EXTRA_TRACE_GRID_ANCHOR_ROW,
    EXTRA_TRACE_GRID_ANCHOR_COL,
    ALIEN_TRACE_MARKER_SLOTS,
    ALIEN_EXTRA_TRACE_MARKER_SLOTS,
    JIUZHE_TRACE_MARKER_SLOTS,
    YICHANGDIAN_TRACE_MARKER_SLOTS,
    getAlienSlotLabel,
    getTraceTypeLabel,
    getAlienTraceMarkerLayout,
    getAlienExtraTraceMarkerLayout,
    getJiuzheTraceMarkerLayout,
    getYichangdianTraceMarkerLayout,
    getYichangdianTraceTokenSize,
    getYichangdianStackStepY,
    getYichangdianStackTraceMarkerLayout,
    getYichangdianBaseFromStackTraceMarkerLayout,
    getYichangdianAnomalyMarkerBoardPoint,
    getExtraTraceCellSize,
    getExtraTraceGridOriginCenter,
    getExtraTraceGridCenter,
    getExtraTraceAnchorFromGridCenter,
    getExtraTraceGridCellIndex,
    listAlienTraceMarkerLayouts,
  });
});
