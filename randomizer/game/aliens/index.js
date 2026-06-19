(function (root, factory) {
  "use strict";

  let catalog = root.SetiAlienCatalog;
  let placement = root.SetiAlienPlacement;
  let state = root.SetiAlienState;
  let randomizer = root.SetiAlienRandomizer;
  let render = root.SetiAlienRender;
  let jiuzhe = root.SetiAlienJiuzhe;
  let yichangdian = root.SetiAlienYichangdian;
  let fangzhou = root.SetiAlienFangzhou;
  let fangzhouCard1Queue = root.SetiFangzhouCard1Queue;

  if (typeof require === "function") {
    catalog = catalog || require("./catalog");
    placement = placement || require("./placement");
    state = state || require("./state");
    jiuzhe = jiuzhe || require("./jiuzhe");
    yichangdian = yichangdian || require("./yichangdian");
    fangzhou = fangzhou || require("./fangzhou");
    fangzhouCard1Queue = fangzhouCard1Queue || require("./fangzhou-card1-queue");
    randomizer = randomizer || require("./randomizer");
    render = render || require("./render");
  }

  const api = factory(catalog, placement, state, randomizer, render, jiuzhe, yichangdian, fangzhou, fangzhouCard1Queue);

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.SetiAliens = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function (catalog, placement, state, randomizer, render, jiuzhe, yichangdian, fangzhou, fangzhouCard1Queue) {
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

    if (jiuzhe?.ensureJiuzheState) {
      const jiuzheState = jiuzhe.ensureJiuzheState(source);
      lines.push("[九折]");
      lines.push(
        `揭示槽位=${jiuzheState.revealedSlotId || "无"} `
        + `免费阈值=${jiuzheState.freeScoreThreshold ?? "无"} `
        + `1信用点阈值=${jiuzheState.paidScoreThreshold ?? "无"}`,
      );
      const grid = jiuzheState.revealedSlotId
        ? jiuzhe.getTraceGrid(source, jiuzheState.revealedSlotId)
        : null;
      if (grid) {
        for (const traceType of jiuzhe.TRACE_TYPES) {
          for (const position of jiuzhe.TRACE_POSITIONS) {
            const entry = grid?.[traceType]?.[position];
            const layout = render.getEffectiveJiuzheTraceMarkerLayout?.(
              jiuzheState.revealedSlotId,
              traceType,
              position,
            );
            lines.push(
              `  ${jiuzhe.formatTraceLabel(traceType, position)} `
              + `${entry ? (entry.playerColor || entry.playerId || "已放置") : "空"}`
              + `${layout ? ` @ ${layout.percentX}%,${layout.percentY}%` : ""}`,
            );
          }
        }
      }
    }

    if (yichangdian?.ensureYichangdianState) {
      const yState = yichangdian.ensureYichangdianState(source);
      lines.push("[异常点]");
      lines.push(
        `揭示槽位=${yState.revealedSlotId || "无"} `
        + `揭示地球x=${yState.revealEarthX ?? "无"} `
        + `下个异常扇区=${yState.nextAnomalySectorX ?? "无"} `
        + `展示牌=${yState.displayedCardIndex ?? "无"}`,
      );
      for (const anomaly of yState.anomalies || []) {
        lines.push(`  异常 ${yichangdian.formatAnomalyLabel(anomaly)}`);
      }
      const grid = yState.revealedSlotId
        ? yichangdian.getTraceGrid(source, yState.revealedSlotId)
        : null;
      if (grid) {
        for (const traceType of yichangdian.TRACE_TYPES) {
          for (const position of yichangdian.TRACE_POSITIONS) {
            const entries = position === 1
              ? (Array.isArray(grid?.[traceType]?.[position]) ? grid[traceType][position] : [])
              : (grid?.[traceType]?.[position] ? [grid[traceType][position]] : []);
            const layout = render.getEffectiveYichangdianTraceMarkerLayout?.(
              yState.revealedSlotId,
              traceType,
              position,
              0,
            );
            const ownerText = entries.length
              ? entries.map((entry) => entry.playerColor || entry.playerId || "已放置").join("/")
              : "空";
            lines.push(
              `  ${yichangdian.formatTraceLabel(traceType, position)} `
              + `${ownerText}${layout ? ` @ ${layout.percentX}%,${layout.percentY}%` : ""}`,
            );
          }
        }
      }

      const yOverrides = render.listYichangdianTraceMarkerLayoutOverrides?.() || [];
      if (yOverrides.length) {
        lines.push("[异常点痕迹拖动校准]");
        for (const item of yOverrides) {
          lines.push(
            `${placement.getAlienSlotLabel(item.alienSlotId)} ${placement.getTraceTypeLabel(item.traceType)}`
            + ` ${item.position}号位 → ${item.percentX}%,${item.percentY}%`,
          );
        }
      }
    }

    if (fangzhou?.ensureFangzhouState) {
      const fState = fangzhou.ensureFangzhouState(source);
      lines.push("[方舟]");
      lines.push(
        `揭示槽位=${fState.revealedSlotId || "无"} `
        + `展示牌=${fState.displayedCard1Index ?? "无"} `
        + `牌堆剩余=${fState.card1Deck?.length ?? 0} `
        + `已翻开=${fState.card1Revealed?.length ?? 0}`,
      );
      const grid = fState.revealedSlotId
        ? fangzhou.getTraceGrid(source, fState.revealedSlotId)
        : null;
      if (grid) {
        for (const traceType of fangzhou.TRACE_TYPES) {
          for (const position of fangzhou.TRACE_POSITIONS) {
            const entries = fangzhou.getTraceEntries(grid, traceType, position);
            const layout = render.getEffectiveFangzhouTraceMarkerLayout?.(
              fState.revealedSlotId,
              traceType,
              position,
              0,
            );
            const ownerText = entries.length
              ? entries.map((entry) => entry.playerColor || entry.playerId || "已放置").join("/")
              : "空";
            lines.push(
              `  ${fangzhou.formatTraceLabel(traceType, position)} `
              + `${ownerText}${layout ? ` @ ${layout.percentX}%,${layout.percentY}%` : ""}`,
            );
          }
        }
      }

      const fOverrides = render.listFangzhouTraceMarkerLayoutOverrides?.() || [];
      if (fOverrides.length) {
        lines.push("[方舟痕迹拖动校准]");
        for (const item of fOverrides) {
          lines.push(
            `${placement.getAlienSlotLabel(item.alienSlotId)} ${placement.getTraceTypeLabel(item.traceType)}`
            + ` ${item.position}号位 → ${item.percentX}%,${item.percentY}%`,
          );
        }
      }
    }

    return lines;
  }

  return Object.freeze({
    ALIEN_TYPES: catalog.ALIEN_TYPES,
    ALIEN_TYPE_IDS: catalog.ALIEN_TYPE_IDS,
    ALIEN_BACK_SRC: catalog.ALIEN_BACK_SRC,
    TRACE_TYPES: placement.TRACE_TYPES,
    ALIEN_SLOT_IDS: placement.ALIEN_SLOT_IDS,
    TRACE_TYPE_LABELS: placement.TRACE_TYPE_LABELS,
    ALIEN_TRACE_TOKEN_SRC: placement.ALIEN_TRACE_TOKEN_SRC,
    ALIEN_TRACE_TOKEN_DISPLAY_SCALE: placement.ALIEN_TRACE_TOKEN_DISPLAY_SCALE,
    ALIEN_EXTRA_TRACE_TOKEN_DISPLAY_SCALE: placement.ALIEN_EXTRA_TRACE_TOKEN_DISPLAY_SCALE,
    YICHANGDIAN_TRACE_TOKEN_DISPLAY_SCALE: placement.YICHANGDIAN_TRACE_TOKEN_DISPLAY_SCALE,
    YICHANGDIAN_ANOMALY_MARKER_SCALE_PERCENT: placement.YICHANGDIAN_ANOMALY_MARKER_SCALE_PERCENT,
    EXTRA_TRACE_GRID_COLUMNS: placement.EXTRA_TRACE_GRID_COLUMNS,
    jiuzhe,
    yichangdian,
    fangzhou,
    fangzhouCard1Queue,
    JIUZHE_ALIEN_ID: jiuzhe?.ALIEN_ID || "九折",
    JIUZHE_CARD_BACK_SRC: jiuzhe?.CARD_BACK_SRC,
    JIUZHE_THREAT_ICON_SRC: jiuzhe?.THREAT_ICON_SRC,
    YICHANGDIAN_ALIEN_ID: yichangdian?.ALIEN_ID || "异常点",
    YICHANGDIAN_CARD_BACK_SRC: yichangdian?.CARD_BACK_SRC,
    FANGZHOU_ALIEN_ID: fangzhou?.ALIEN_ID || "方舟",
    FANGZHOU_CARD1_BACK_SRC: fangzhou?.CARD1_BACK_SRC,
    createDefaultAlienState: state.createDefaultAlienState,
    randomizeAlienAssignments: randomizer.randomizeAlienAssignments,
    getAlienType: catalog.getAlienType,
    getAlienLabel: catalog.getAlienLabel,
    getAlienFaceSrc: catalog.getAlienFaceSrc,
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
    getYichangdianAnomalyMarkerBoardPoint: placement.getYichangdianAnomalyMarkerBoardPoint,
    getExtraTraceGridOriginCenter: placement.getExtraTraceGridOriginCenter,
    getExtraTraceGridCenter: placement.getExtraTraceGridCenter,
    getEffectiveTraceMarkerLayout: render.getEffectiveTraceMarkerLayout,
    getEffectiveExtraTraceAnchorLayout: render.getEffectiveExtraTraceAnchorLayout,
    getEffectiveExtraTraceGridLayout: render.getEffectiveExtraTraceGridLayout,
    listTraceMarkerLayoutOverrides: render.listTraceMarkerLayoutOverrides,
    listExtraTraceMarkerLayoutOverrides: render.listExtraTraceMarkerLayoutOverrides,
    getEffectiveJiuzheTraceMarkerLayout: render.getEffectiveJiuzheTraceMarkerLayout,
    listJiuzheTraceMarkerLayoutOverrides: render.listJiuzheTraceMarkerLayoutOverrides,
    getEffectiveYichangdianTraceMarkerLayout: render.getEffectiveYichangdianTraceMarkerLayout,
    listYichangdianTraceMarkerLayoutOverrides: render.listYichangdianTraceMarkerLayoutOverrides,
    getEffectiveFangzhouTraceMarkerLayout: render.getEffectiveFangzhouTraceMarkerLayout,
    listFangzhouTraceMarkerLayoutOverrides: render.listFangzhouTraceMarkerLayoutOverrides,
    bindAlienTraceDragging: render.bindAlienTraceDragging,
    renderAlienTraceMarkers: render.renderAlienTraceMarkers,
    renderAllAlienTraceMarkers: render.renderAllAlienTraceMarkers,
    renderJiuzheTraceMarkers: render.renderJiuzheTraceMarkers,
    renderAllJiuzheTraceMarkers: render.renderAllJiuzheTraceMarkers,
    renderYichangdianTraceMarkers: render.renderYichangdianTraceMarkers,
    renderAllYichangdianTraceMarkers: render.renderAllYichangdianTraceMarkers,
    renderFangzhouTraceMarkers: render.renderFangzhouTraceMarkers,
    renderAllFangzhouTraceMarkers: render.renderAllFangzhouTraceMarkers,
    renderAlienBackImage: render.renderAlienBackImage,
    renderAllAlienBackImages: render.renderAllAlienBackImages,
    resetAlienTraceTokens: render.resetAlienTraceTokens,
    getReadoutLines,
  });
});
