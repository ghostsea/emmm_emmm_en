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
    EXTRA_TRACE_GRID_COLUMNS,
    EXTRA_TRACE_GRID_ANCHOR_ROW,
    EXTRA_TRACE_GRID_ANCHOR_COL,
    ALIEN_TRACE_MARKER_SLOTS,
    ALIEN_EXTRA_TRACE_MARKER_SLOTS,
    getAlienSlotLabel,
    getTraceTypeLabel,
    getAlienTraceMarkerLayout,
    getAlienExtraTraceMarkerLayout,
    getExtraTraceCellSize,
    getExtraTraceGridOriginCenter,
    getExtraTraceGridCenter,
    getExtraTraceAnchorFromGridCenter,
    getExtraTraceGridCellIndex,
    listAlienTraceMarkerLayouts,
  });
});
