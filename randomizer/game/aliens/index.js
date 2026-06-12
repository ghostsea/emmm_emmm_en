(function (root, factory) {
  "use strict";

  let placement = root.SetiAlienPlacement;
  let state = root.SetiAlienState;
  let render = root.SetiAlienRender;

  if (typeof require === "function") {
    placement = placement || require("./placement");
    state = state || require("./state");
    render = render || require("./render");
  }

  const api = factory(placement, state, render);

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.SetiAliens = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function (placement, state, render) {
  "use strict";

  function getReadoutLines(alienState) {
    const source = alienState || state.createDefaultAlienState();
    const lines = ["外星人痕迹"];

    for (const alienSlotId of placement.ALIEN_SLOT_IDS) {
      const alienSlot = state.getAlienSlot(source, alienSlotId);
      lines.push(state.formatAlienSlotLine(alienSlotId, alienSlot));

      for (const traceType of placement.TRACE_TYPES) {
        const firstLayout = render.getEffectiveTraceMarkerLayout(alienSlotId, traceType);
        const anchorLayout = render.getEffectiveExtraTraceAnchorLayout(alienSlotId, traceType);
        const originLayout = anchorLayout
          ? placement.getExtraTraceGridOriginCenter(anchorLayout)
          : null;

        if (firstLayout) {
          lines.push(
            `  ${placement.getTraceTypeLabel(traceType)} 首标记 ${firstLayout.percentX}%,${firstLayout.percentY}%`,
          );
        }
        if (anchorLayout) {
          lines.push(
            `  ${placement.getTraceTypeLabel(traceType)} 非首网格锚点(第2行第2列) ${anchorLayout.percentX}%,${anchorLayout.percentY}%`,
          );
        }
        if (originLayout) {
          lines.push(
            `  ${placement.getTraceTypeLabel(traceType)} 非首网格起点(第1行第1列) ${originLayout.percentX}%,${originLayout.percentY}%`,
          );
        }
      }
    }

    const firstOverrides = render.listTraceMarkerLayoutOverrides();
    if (firstOverrides.length) {
      lines.push("[外星人首标记拖动校准]");
      for (const item of firstOverrides) {
        lines.push(
          `${placement.getAlienSlotLabel(item.alienSlotId)} ${placement.getTraceTypeLabel(item.traceType)}`
          + ` → ${item.percentX}%,${item.percentY}%`,
        );
      }
    }

    const extraOverrides = render.listExtraTraceMarkerLayoutOverrides();
    if (extraOverrides.length) {
      lines.push("[外星人非首标记网格锚点拖动校准]");
      for (const item of extraOverrides) {
        lines.push(
          `${placement.getAlienSlotLabel(item.alienSlotId)} ${placement.getTraceTypeLabel(item.traceType)}`
          + ` → ${item.percentX}%,${item.percentY}%`,
        );
      }
    }

    return lines;
  }

  return Object.freeze({
    TRACE_TYPES: placement.TRACE_TYPES,
    ALIEN_SLOT_IDS: placement.ALIEN_SLOT_IDS,
    TRACE_TYPE_LABELS: placement.TRACE_TYPE_LABELS,
    ALIEN_TRACE_TOKEN_SRC: placement.ALIEN_TRACE_TOKEN_SRC,
    ALIEN_TRACE_TOKEN_DISPLAY_SCALE: placement.ALIEN_TRACE_TOKEN_DISPLAY_SCALE,
    ALIEN_EXTRA_TRACE_TOKEN_DISPLAY_SCALE: placement.ALIEN_EXTRA_TRACE_TOKEN_DISPLAY_SCALE,
    EXTRA_TRACE_GRID_COLUMNS: placement.EXTRA_TRACE_GRID_COLUMNS,
    createDefaultAlienState: state.createDefaultAlienState,
    getAlienSlot: state.getAlienSlot,
    countPlacedFirstTraces: state.countPlacedFirstTraces,
    isAlienReadyToReveal: state.isAlienReadyToReveal,
    placeFirstTrace: state.placeFirstTrace,
    addExtraTrace: state.addExtraTrace,
    revealAlien: state.revealAlien,
    getAlienSlotLabel: placement.getAlienSlotLabel,
    getTraceTypeLabel: placement.getTraceTypeLabel,
    getAlienTraceMarkerLayout: placement.getAlienTraceMarkerLayout,
    getAlienExtraTraceMarkerLayout: placement.getAlienExtraTraceMarkerLayout,
    getExtraTraceGridOriginCenter: placement.getExtraTraceGridOriginCenter,
    getExtraTraceGridCenter: placement.getExtraTraceGridCenter,
    getEffectiveTraceMarkerLayout: render.getEffectiveTraceMarkerLayout,
    getEffectiveExtraTraceAnchorLayout: render.getEffectiveExtraTraceAnchorLayout,
    getEffectiveExtraTraceGridLayout: render.getEffectiveExtraTraceGridLayout,
    listTraceMarkerLayoutOverrides: render.listTraceMarkerLayoutOverrides,
    listExtraTraceMarkerLayoutOverrides: render.listExtraTraceMarkerLayoutOverrides,
    bindAlienTraceDragging: render.bindAlienTraceDragging,
    renderAlienTraceMarkers: render.renderAlienTraceMarkers,
    renderAllAlienTraceMarkers: render.renderAllAlienTraceMarkers,
    resetAlienTraceTokens: render.resetAlienTraceTokens,
    getReadoutLines,
  });
});
