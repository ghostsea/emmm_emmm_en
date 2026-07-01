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
  let banrenma = root.SetiAlienBanrenma;
  let chong = root.SetiAlienChong;
  let amiba = root.SetiAlienAmiba;
  let aomomo = root.SetiAlienAomomo;
  let runezu = root.SetiAlienRunezu;
  let fangzhouCard1Queue = root.SetiFangzhouCard1Queue;
  let revealCardGrants = root.SetiAlienRevealCardGrants;

  if (typeof require === "function") {
    catalog = catalog || require("./catalog");
    placement = placement || require("./placement");
    state = state || require("./state");
    jiuzhe = jiuzhe || require("./jiuzhe");
    yichangdian = yichangdian || require("./yichangdian");
    fangzhou = fangzhou || require("./fangzhou");
    banrenma = banrenma || require("./banrenma");
    chong = chong || require("./chong");
    amiba = amiba || require("./amiba");
    aomomo = aomomo || require("./aomomo");
    runezu = runezu || require("./runezu");
    fangzhouCard1Queue = fangzhouCard1Queue || require("./fangzhou-card1-queue");
    revealCardGrants = revealCardGrants || require("./reveal-card-grants");
    randomizer = randomizer || require("./randomizer");
    render = render || require("./render");
  }

  const api = factory(catalog, placement, state, randomizer, render, jiuzhe, yichangdian, fangzhou, banrenma, chong, amiba, aomomo, runezu, fangzhouCard1Queue, revealCardGrants);

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.SetiAliens = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function (catalog, placement, state, randomizer, render, jiuzhe, yichangdian, fangzhou, banrenma, chong, amiba, aomomo, runezu, fangzhouCard1Queue, revealCardGrants) {
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

    if (banrenma?.ensureBanrenmaState) {
      const bState = banrenma.ensureBanrenmaState(source);
      lines.push("[半人马]");
      lines.push(
        `揭示槽位=${bState.revealedSlotId || "无"} `
        + `展示牌=${bState.displayedCardIndex ?? "无"} `
        + `牌堆剩余=${bState.cardDeck?.length ?? 0} `
        + `可用顶部奖励=${banrenma.getAvailableBonusPositions(source).join("/") || "无"}`,
      );
      for (const [playerKey, marks] of Object.entries(bState.scoreMarksByPlayerId || {})) {
        const activeMarks = (marks || []).filter((mark) => !mark.resolved);
        if (!activeMarks.length) continue;
        lines.push(`  分数标记 ${playerKey}: ${activeMarks.map((mark) => `${mark.threshold}(${mark.source})`).join(" / ")}`);
      }
      for (const position of banrenma.BONUS_POSITIONS || []) {
        const slot = bState.bonusSlots?.[position];
        const layout = bState.revealedSlotId
          ? placement.getBanrenmaBonusMarkerLayout?.(bState.revealedSlotId, position)
          : null;
        lines.push(
          `  顶部奖励${position} ${slot ? (slot.playerColor || slot.playerId || "已使用") : "空"}`
          + `${layout ? ` @ ${layout.percentX}%,${layout.percentY}%` : ""}`,
        );
      }

      const grid = bState.revealedSlotId
        ? banrenma.getTraceGrid(source, bState.revealedSlotId)
        : null;
      if (grid) {
        for (const traceType of banrenma.TRACE_TYPES) {
          for (const position of banrenma.TRACE_POSITIONS) {
            const entries = banrenma.getTraceEntries(grid, traceType, position);
            const layout = render.getEffectiveBanrenmaTraceMarkerLayout?.(
              bState.revealedSlotId,
              traceType,
              position,
              0,
            );
            const ownerText = entries.length
              ? entries.map((entry) => entry.playerColor || entry.playerId || "已放置").join("/")
              : "空";
            lines.push(
              `  ${banrenma.formatTraceLabel(traceType, position)} `
              + `${ownerText}${layout ? ` @ ${layout.percentX}%,${layout.percentY}%` : ""}`,
            );
          }
        }
      }

      const bOverrides = render.listBanrenmaTraceMarkerLayoutOverrides?.() || [];
      if (bOverrides.length) {
        lines.push("[半人马痕迹拖动校准]");
        for (const item of bOverrides) {
          lines.push(
            `${placement.getAlienSlotLabel(item.alienSlotId)} ${placement.getTraceTypeLabel(item.traceType)}`
            + ` ${item.position}号位 → ${item.percentX}%,${item.percentY}%`,
          );
        }
      }
    }

    if (chong?.ensureChongState) {
      const cState = chong.ensureChongState(source);
      lines.push("[虫族]");
      lines.push(
        `揭示槽位=${cState.revealedSlotId || "无"} `
        + `展示牌=${cState.displayedCardIndex ?? "无"} `
        + `牌堆剩余=${cState.cardDeck?.length ?? 0} `
        + `蓝色已解锁=${(cState.unlockedBluePositions || []).join("/") || "无"}`,
      );
      for (const planetId of ["jupiter", "saturn"]) {
        const fossilIds = cState.planetFossilIds?.[planetId] || [];
        lines.push(
          `  ${planetId === "jupiter" ? "木星" : "土星"}化石 `
          + (fossilIds.map((fossilId) => {
            const fossil = cState.fossilsById?.[fossilId];
            return `${fossilId}:${fossil?.status || "?"}`;
          }).join(" / ") || "无"),
        );
      }
      for (const [position, fossilId] of Object.entries(cState.panelFossilSlots || {})) {
        lines.push(`  面板化石 蓝${position}: ${fossilId}`);
      }
      for (const [rocketId, task] of Object.entries(cState.transportTasksByRocketId || {})) {
        lines.push(`  搬运 R${rocketId}: ${task.fossilId} -> ${task.destinationPlanetId || "无"}`);
      }
      const grid = cState.revealedSlotId
        ? chong.getTraceGrid(source, cState.revealedSlotId)
        : null;
      if (grid) {
        for (const traceType of chong.TRACE_TYPES) {
          for (const position of chong.getPositionsForTraceType(traceType)) {
            const entries = chong.getTraceEntries(grid, traceType, position);
            const layout = render.getEffectiveChongTraceMarkerLayout?.(
              cState.revealedSlotId,
              traceType,
              position,
            );
            const ownerText = entries.length
              ? entries.map((entry) => entry.playerColor || entry.playerId || "已放置").join("/")
              : "空";
            lines.push(
              `  ${chong.formatTraceLabel(traceType, position)} `
              + `${ownerText}${layout ? ` @ ${layout.percentX}%,${layout.percentY}%` : ""}`,
            );
          }
        }
      }

      const cOverrides = render.listChongTraceMarkerLayoutOverrides?.() || [];
      if (cOverrides.length) {
        lines.push("[虫族痕迹拖动校准]");
        for (const item of cOverrides) {
          lines.push(
            `${placement.getAlienSlotLabel(item.alienSlotId)} ${placement.getTraceTypeLabel(item.traceType)}`
            + ` ${item.position}号位 → ${item.percentX}%,${item.percentY}%`,
          );
        }
      }
    }

    if (amiba?.ensureAmibaState) {
      const aState = amiba.ensureAmibaState(source);
      lines.push("[阿米巴]");
      lines.push(
        `揭示槽位=${aState.revealedSlotId || "无"} `
        + `展示牌=${aState.displayedCardIndex ?? "无"} `
        + `牌堆剩余=${aState.cardDeck?.length ?? 0}`,
      );
      for (const symbol of amiba.listSymbols(source) || []) {
        const layout = aState.revealedSlotId
          ? render.getEffectiveAmibaSymbolMarkerLayout?.(aState.revealedSlotId, symbol.slotId)
          : null;
        lines.push(
          `  ${symbol.symbolId} @ ${amiba.formatSymbolSlotLabel?.(symbol.slotId) || symbol.slotId}`
          + `${layout ? ` (${layout.percentX}%,${layout.percentY}%)` : ""}`,
        );
      }
      const grid = aState.revealedSlotId
        ? amiba.getTraceGrid(source, aState.revealedSlotId)
        : null;
      if (grid) {
        for (const traceType of amiba.TRACE_TYPES) {
          for (const position of amiba.TRACE_POSITIONS) {
            const entries = amiba.getTraceEntries(grid, traceType, position);
            const layout = render.getEffectiveAmibaTraceMarkerLayout?.(
              aState.revealedSlotId,
              traceType,
              position,
            );
            const ownerText = entries.length
              ? entries.map((entry) => entry.playerColor || entry.playerId || "已放置").join("/")
              : "空";
            lines.push(
              `  ${amiba.formatTraceLabel(traceType, position)} `
              + `${ownerText}${layout ? ` @ ${layout.percentX}%,${layout.percentY}%` : ""}`,
            );
          }
        }
      }

      const aOverrides = render.listAmibaTraceMarkerLayoutOverrides?.() || [];
      if (aOverrides.length) {
        lines.push("[阿米巴痕迹拖动校准]");
        for (const item of aOverrides) {
          lines.push(
            `${placement.getAlienSlotLabel(item.alienSlotId)} ${placement.getTraceTypeLabel(item.traceType)}`
            + ` ${item.position}号位 → ${item.percentX}%,${item.percentY}%`,
          );
        }
      }

      const aSymbolOverrides = render.listAmibaSymbolMarkerLayoutOverrides?.() || [];
      if (aSymbolOverrides.length) {
        lines.push("[阿米巴symbol拖动校准]");
        for (const item of aSymbolOverrides) {
          lines.push(
            `${placement.getAlienSlotLabel(item.alienSlotId)} ${amiba.formatSymbolSlotLabel?.(item.slotId) || item.slotId}`
            + ` → ${item.percentX}%,${item.percentY}%`,
          );
        }
      }
    }

    if (aomomo?.ensureAomomoState) {
      const oState = aomomo.ensureAomomoState(source);
      lines.push("[奥陌陌]");
      lines.push(
        `揭示槽位=${oState.revealedSlotId || "无"} `
        + `展示牌=${oState.displayedCardIndex ?? "无"} `
        + `牌堆剩余=${oState.cardDeck?.length ?? 0} `
        + `环绕=${oState.orbitMarkers?.length ?? 0}/${aomomo.ORBIT_CAPACITY || 1} `
        + `登陆=${oState.landingMarkers?.length ?? 0}/${aomomo.LANDING_CAPACITY || 3}`,
      );
      if (oState.revealedSlotId) {
        for (const marker of aomomo.listOrbitMarkers(source) || []) {
          const layout = render.getEffectiveAomomoOrbitMarkerLayout?.(oState.revealedSlotId, marker.sequence || 1)
            || render.getEffectiveAomomoOrbitMarkerLayout?.(oState.revealedSlotId, 1);
          lines.push(
            `  环绕 ${marker.playerColor || marker.playerId || "已放置"}`
            + `${layout ? ` @ ${layout.percentX}%,${layout.percentY}%` : ""}`,
          );
        }
        for (const [index, marker] of (aomomo.listLandingMarkers(source) || []).entries()) {
          const position = index + 1;
          const layout = render.getEffectiveAomomoLandingMarkerLayout?.(oState.revealedSlotId, position);
          lines.push(
            `  登陆${position} ${marker.playerColor || marker.playerId || "已放置"}`
            + `${layout ? ` @ ${layout.percentX}%,${layout.percentY}%` : ""}`,
          );
        }
      }
      const grid = oState.revealedSlotId
        ? aomomo.getTraceGrid(source, oState.revealedSlotId)
        : null;
      if (grid) {
        for (const traceType of aomomo.TRACE_TYPES) {
          for (const position of aomomo.TRACE_POSITIONS) {
            const entries = aomomo.getTraceEntries(grid, traceType, position);
            const layout = render.getEffectiveAomomoTraceMarkerLayout?.(
              oState.revealedSlotId,
              traceType,
              position,
              0,
            );
            const ownerText = entries.length
              ? entries.map((entry) => entry.playerColor || entry.playerId || "已放置").join("/")
              : "空";
            lines.push(
              `  ${aomomo.formatTraceLabel(traceType, position)} `
              + `${ownerText}${layout ? ` @ ${layout.percentX}%,${layout.percentY}%` : ""}`,
            );
          }
        }
      }

      const oTraceOverrides = render.listAomomoTraceMarkerLayoutOverrides?.() || [];
      if (oTraceOverrides.length) {
        lines.push("[奥陌陌痕迹拖动校准]");
        for (const item of oTraceOverrides) {
          lines.push(
            `${placement.getAlienSlotLabel(item.alienSlotId)} ${placement.getTraceTypeLabel(item.traceType)}`
            + ` ${item.position}号位 → ${item.percentX}%,${item.percentY}%`,
          );
        }
      }
      const oOrbitOverrides = render.listAomomoOrbitMarkerLayoutOverrides?.() || [];
      if (oOrbitOverrides.length) {
        lines.push("[奥陌陌环绕拖动校准]");
        for (const item of oOrbitOverrides) {
          lines.push(`${placement.getAlienSlotLabel(item.alienSlotId)} 环绕${item.position} → ${item.percentX}%,${item.percentY}%`);
        }
      }
      const oLandingOverrides = render.listAomomoLandingMarkerLayoutOverrides?.() || [];
      if (oLandingOverrides.length) {
        lines.push("[奥陌陌登陆拖动校准]");
        for (const item of oLandingOverrides) {
          lines.push(`${placement.getAlienSlotLabel(item.alienSlotId)} 登陆${item.position} → ${item.percentX}%,${item.percentY}%`);
        }
      }
    }

    if (runezu?.ensureRunezuState) {
      const rState = runezu.ensureRunezuState(source);
      lines.push("[符文族]");
      lines.push(
        `揭示槽位=${rState.revealedSlotId || "无"} `
        + `展示牌=${rState.displayedCardIndex ?? "无"} `
        + `牌堆剩余=${rState.cardDeck?.length ?? 0} `
        + `剩余symbol=${rState.availableSymbols?.length ?? 0}`,
      );
      if (rState.revealedSlotId) {
        for (const symbol of runezu.listPanelSymbols(source) || []) {
          const layout = render.getEffectiveRunezuPanelSymbolMarkerLayout?.(rState.revealedSlotId, symbol.slotId);
          lines.push(
            `  白框 ${runezu.formatPanelSymbolSlotLabel?.(symbol.slotId) || symbol.slotId}`
            + ` ${runezu.formatSymbolLabel?.(symbol.symbolId) || symbol.symbolId}`
            + `${layout ? ` @ ${layout.percentX}%,${layout.percentY}%` : ""}`,
          );
        }
        for (const position of runezu.FACE_SYMBOL_POSITIONS || []) {
          const entry = (runezu.listFaceSymbolSlots(source) || []).find((slot) => Number(slot.position) === Number(position));
          const layout = render.getEffectiveRunezuFaceSymbolSlotMarkerLayout?.(rState.revealedSlotId, position);
          const symbolText = entry
            ? (runezu.formatSymbolLabel?.(entry.symbolId) || entry.symbolId)
            : "空";
          lines.push(
            `  黑圈 ${runezu.formatFaceSymbolSlotLabel?.(position) || position}`
            + ` ${symbolText}`
            + `${layout ? ` @ ${layout.percentX}%,${layout.percentY}%` : ""}`,
          );
        }
      }
      for (const sourceSymbol of runezu.listSourceSymbols(source) || []) {
        lines.push(
          `  来源 ${sourceSymbol.sourceType}:${sourceSymbol.sourceId}`
          + ` ${runezu.formatSymbolLabel?.(sourceSymbol.symbolId) || sourceSymbol.symbolId}`
          + ` ${sourceSymbol.claimedByPlayerColor || sourceSymbol.claimedByPlayerId ? "已取" : "未取"}`,
        );
      }
      const grid = rState.revealedSlotId
        ? runezu.getTraceGrid(source, rState.revealedSlotId)
        : null;
      if (grid) {
        for (const traceType of runezu.TRACE_TYPES) {
          for (const position of runezu.TRACE_POSITIONS) {
            const entries = runezu.getTraceEntries(grid, traceType, position);
            const layout = render.getEffectiveRunezuTraceMarkerLayout?.(
              rState.revealedSlotId,
              traceType,
              position,
              0,
            );
            const ownerText = entries.length
              ? entries.map((entry) => entry.playerColor || entry.playerId || "已放置").join("/")
              : "空";
            lines.push(
              `  ${runezu.formatTraceLabel(traceType, position)} `
              + `${ownerText}${layout ? ` @ ${layout.percentX}%,${layout.percentY}%` : ""}`,
            );
          }
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
    banrenma,
    chong,
    amiba,
    aomomo,
    runezu,
    fangzhouCard1Queue,
    JIUZHE_ALIEN_ID: jiuzhe?.ALIEN_ID || "九折",
    JIUZHE_CARD_BACK_SRC: jiuzhe?.CARD_BACK_SRC,
    JIUZHE_THREAT_ICON_SRC: jiuzhe?.THREAT_ICON_SRC,
    YICHANGDIAN_ALIEN_ID: yichangdian?.ALIEN_ID || "异常点",
    YICHANGDIAN_CARD_BACK_SRC: yichangdian?.CARD_BACK_SRC,
    FANGZHOU_ALIEN_ID: fangzhou?.ALIEN_ID || "方舟",
    FANGZHOU_CARD1_BACK_SRC: fangzhou?.CARD1_BACK_SRC,
    BANRENMA_ALIEN_ID: banrenma?.ALIEN_ID || "半人马",
    BANRENMA_CARD_BACK_SRC: banrenma?.CARD_BACK_SRC,
    BANRENMA_TOKEN_SRC: banrenma?.TOKEN_SRC,
    CHONG_ALIEN_ID: chong?.ALIEN_ID || "虫",
    CHONG_CARD_BACK_SRC: chong?.CARD_BACK_SRC,
    CHONG_FOSSIL_BACK_SRC: chong?.FOSSIL_BACK_SRC,
    AMIBA_ALIEN_ID: amiba?.ALIEN_ID || "阿米巴",
    AMIBA_CARD_BACK_SRC: amiba?.CARD_BACK_SRC,
    AOMOMO_ALIEN_ID: aomomo?.ALIEN_ID || "奥陌陌",
    AOMOMO_CARD_BACK_SRC: aomomo?.CARD_BACK_SRC,
    AOMOMO_FOSSIL_SRC: aomomo?.FOSSIL_SRC,
    AOMOMO_WHEEL3_AMM_SRC: aomomo?.WHEEL3_AMM_SRC,
    RUNEZU_ALIEN_ID: runezu?.ALIEN_ID || "符文族",
    RUNEZU_CARD_BACK_SRC: runezu?.CARD_BACK_SRC,
    MIN_ALIEN_REVEAL_POOL_SIZE: randomizer.MIN_ALIEN_REVEAL_POOL_SIZE,
    NEUTRAL_SCORE_TRACE_THRESHOLDS: state.NEUTRAL_SCORE_TRACE_THRESHOLDS,
    NEUTRAL_SCORE_TRACE_ORDER: state.NEUTRAL_SCORE_TRACE_ORDER,
    createDefaultAlienState: state.createDefaultAlienState,
    getAlienRevealPool: randomizer.getAlienRevealPool,
    setAlienRevealPool: randomizer.setAlienRevealPool,
    randomizeAlienAssignments: randomizer.randomizeAlienAssignments,
    pickRandomAlienIdForReveal: randomizer.pickRandomAlienIdForReveal,
    revealRandomAlien: randomizer.revealRandomAlien,
    getAlienType: catalog.getAlienType,
    getAlienLabel: catalog.getAlienLabel,
    getAlienFaceSrc: catalog.getAlienFaceSrc,
    getAlienSlot: state.getAlienSlot,
    countPlacedFirstTraces: state.countPlacedFirstTraces,
    countFirstTracesForPlayerOnSlot: state.countFirstTracesForPlayerOnSlot,
    countFirstTracesByPlayerOnSlot: state.countFirstTracesByPlayerOnSlot,
    getFirstTraceRewardForSlot: state.getFirstTraceRewardForSlot,
    getExtraTraceReward: state.getExtraTraceReward,
    isAlienReadyToReveal: state.isAlienReadyToReveal,
    getExtraTraceMarker: state.getExtraTraceMarker,
    getExtraTraceOwnerColor: state.getExtraTraceOwnerColor,
    getNeutralScoreTraceMark: state.getNeutralScoreTraceMark,
    findNeutralScoreTraceTarget: state.findNeutralScoreTraceTarget,
    placeNeutralScoreTraceForThreshold: state.placeNeutralScoreTraceForThreshold,
    placeFirstTrace: state.placeFirstTrace,
    addExtraTrace: state.addExtraTrace,
    revealAlien: state.revealAlien,
    grantAlienCardsForFirstTraces: revealCardGrants?.grantAlienCardsForFirstTraces,
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
    getEffectiveBanrenmaTraceMarkerLayout: render.getEffectiveBanrenmaTraceMarkerLayout,
    listBanrenmaTraceMarkerLayoutOverrides: render.listBanrenmaTraceMarkerLayoutOverrides,
    getEffectiveChongTraceMarkerLayout: render.getEffectiveChongTraceMarkerLayout,
    listChongTraceMarkerLayoutOverrides: render.listChongTraceMarkerLayoutOverrides,
    getEffectiveAmibaTraceMarkerLayout: render.getEffectiveAmibaTraceMarkerLayout,
    getEffectiveAmibaSymbolMarkerLayout: render.getEffectiveAmibaSymbolMarkerLayout,
    listAmibaTraceMarkerLayoutOverrides: render.listAmibaTraceMarkerLayoutOverrides,
    listAmibaSymbolMarkerLayoutOverrides: render.listAmibaSymbolMarkerLayoutOverrides,
    getEffectiveAomomoTraceMarkerLayout: render.getEffectiveAomomoTraceMarkerLayout,
    getEffectiveAomomoOrbitMarkerLayout: render.getEffectiveAomomoOrbitMarkerLayout,
    getEffectiveAomomoLandingMarkerLayout: render.getEffectiveAomomoLandingMarkerLayout,
    listAomomoTraceMarkerLayoutOverrides: render.listAomomoTraceMarkerLayoutOverrides,
    listAomomoOrbitMarkerLayoutOverrides: render.listAomomoOrbitMarkerLayoutOverrides,
    listAomomoLandingMarkerLayoutOverrides: render.listAomomoLandingMarkerLayoutOverrides,
    getEffectiveRunezuTraceMarkerLayout: render.getEffectiveRunezuTraceMarkerLayout,
    getEffectiveRunezuPanelSymbolMarkerLayout: render.getEffectiveRunezuPanelSymbolMarkerLayout,
    getEffectiveRunezuFaceSymbolSlotMarkerLayout: render.getEffectiveRunezuFaceSymbolSlotMarkerLayout,
    listRunezuTraceMarkerLayoutOverrides: render.listRunezuTraceMarkerLayoutOverrides,
    listRunezuPanelSymbolMarkerLayoutOverrides: render.listRunezuPanelSymbolMarkerLayoutOverrides,
    listRunezuFaceSymbolMarkerLayoutOverrides: render.listRunezuFaceSymbolMarkerLayoutOverrides,
    bindAlienTraceDragging: render.bindAlienTraceDragging,
    renderAlienTraceMarkers: render.renderAlienTraceMarkers,
    renderAllAlienTraceMarkers: render.renderAllAlienTraceMarkers,
    renderJiuzheTraceMarkers: render.renderJiuzheTraceMarkers,
    renderAllJiuzheTraceMarkers: render.renderAllJiuzheTraceMarkers,
    renderYichangdianTraceMarkers: render.renderYichangdianTraceMarkers,
    renderAllYichangdianTraceMarkers: render.renderAllYichangdianTraceMarkers,
    renderFangzhouTraceMarkers: render.renderFangzhouTraceMarkers,
    renderAllFangzhouTraceMarkers: render.renderAllFangzhouTraceMarkers,
    renderBanrenmaTraceMarkers: render.renderBanrenmaTraceMarkers,
    renderAllBanrenmaTraceMarkers: render.renderAllBanrenmaTraceMarkers,
    renderChongTraceMarkers: render.renderChongTraceMarkers,
    renderAllChongTraceMarkers: render.renderAllChongTraceMarkers,
    renderAmibaTraceMarkers: render.renderAmibaTraceMarkers,
    renderAllAmibaTraceMarkers: render.renderAllAmibaTraceMarkers,
    renderAomomoTraceMarkers: render.renderAomomoTraceMarkers,
    renderAllAomomoTraceMarkers: render.renderAllAomomoTraceMarkers,
    renderRunezuTraceMarkers: render.renderRunezuTraceMarkers,
    renderAllRunezuTraceMarkers: render.renderAllRunezuTraceMarkers,
    renderAlienBackImage: render.renderAlienBackImage,
    renderAllAlienBackImages: render.renderAllAlienBackImages,
    resetAlienTraceTokens: render.resetAlienTraceTokens,
    getReadoutLines,
  });
});
