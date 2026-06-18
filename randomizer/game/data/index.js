(function (root, factory) {
  "use strict";

  let placement = root.SetiDataPlacement;
  let state = root.SetiDataState;
  let render = root.SetiDataRender;
  let nebulaPlacement = root.SetiNebulaDataPlacement;
  let nebulaState = root.SetiNebulaDataState;
  let nebulaRender = root.SetiNebulaDataRender;

  if (typeof require === "function") {
    placement = placement || require("./placement");
    state = state || require("./state");
    render = render || require("./render");
    nebulaPlacement = nebulaPlacement || require("./nebula-placement");
    nebulaState = nebulaState || require("./nebula-state");
    nebulaRender = nebulaRender || require("./nebula-render");
  }

  const api = factory(placement, state, render, nebulaPlacement, nebulaState, nebulaRender);

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.SetiData = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function (
  placement,
  state,
  render,
  nebulaPlacement,
  nebulaState,
  nebulaRender,
) {
  "use strict";

  function getNebulaReadoutLines(nebulaDataState) {
    const stateSource = nebulaDataState || { nebulae: {} };
    const lines = ["星云数据"];

    for (const nebulaId of nebulaPlacement.NEBULA_IDS) {
      const label = nebulaPlacement.getNebulaLabel(nebulaId);
      const capacity = nebulaPlacement.getNebulaCapacity(nebulaId);
      const tokens = nebulaState.listNebulaTokens(stateSource, nebulaId);
      const tokensBySlot = new Map(tokens.map((token) => [token.slotIndex, token]));
      const stats = nebulaState.getNebulaReplacementStats(stateSource, nebulaId);
      const countText = Object.entries(stats.playerTokenCounts || {})
        .map(([color, count]) => `${color}:${count}`)
        .join(" ");
      const lastText = stats.lastReplacedPlayerLabel || stats.lastReplacedPlayerColor || "无";

      lines.push(`[${label}] ${tokens.length}/${capacity} token=${countText || "无"} last=${lastText}`);

      for (const slot of nebulaPlacement.listNebulaSlotLayouts(nebulaId)) {
        const token = tokensBySlot.get(slot.slotIndex) || null;
        const layout = nebulaRender.getEffectiveNebulaSlotLayout(nebulaId, slot.slotIndex, token);
        if (!layout) continue;
        if (token) {
          const owner = token.replacedByPlayerLabel || token.replacedByPlayerColor;
          lines.push(
            `  序号 ${token.index} 槽位${slot.slotIndex}`
            + `${owner ? ` ${owner}token` : ""}`
            + ` 局部坐标 ${layout.percentX}%,${layout.percentY}%`,
          );
        } else {
          lines.push(
            `  槽位${slot.slotIndex} 局部坐标 ${layout.percentX}%,${layout.percentY}%`,
          );
        }
      }
    }

    const overrides = nebulaRender.listNebulaSlotLayoutOverrides();
    if (overrides.length) {
      lines.push("[星云拖动校准]");
      for (const item of overrides) {
        const label = nebulaPlacement.getNebulaLabel(item.nebulaId);
        lines.push(
          `${label} 槽位${item.slotIndex} → 局部${item.percentX}%,${item.percentY}%`,
        );
      }
    }

    return lines;
  }

  function getReadoutLines(playerState) {
    const currentPlayer = playerState?.players?.find((p) => p.id === playerState.currentPlayerId)
      || playerState?.players?.[0]
      || null;

    if (!currentPlayer) return [];

    const dataState = state.ensurePlayerDataState(currentPlayer);
    const poolTokens = state.listPoolTokens(currentPlayer);
    const computerTokens = state.listComputerPlacedTokens(currentPlayer);
    const blueBonusTokens = state.listBlueBonusPlacedTokens(currentPlayer);
    if (!poolTokens.length && !computerTokens.length && !blueBonusTokens.length && !dataState.discardedCount) {
      return [];
    }

    const lines = ["数据状态"];
    lines.push(`数据池 ${poolTokens.length}/${placement.DATA_POOL_SLOT_IDS.length}`);
    lines.push(
      `计算机第一排 ${computerTokens.length}/${placement.COMPUTER_DATA_SLOT_IDS.length}`
      + `  蓝色科技附加 ${blueBonusTokens.length}/${placement.BLUE_BONUS_DATA_SLOT_IDS.length}`,
    );

    if (poolTokens.length) {
      lines.push("[数据池标记]");
      for (const token of poolTokens) {
        const layout = render.getEffectivePoolSlotLayout(token.slotIndex);
        if (!layout) continue;
        lines.push(
          `序号 ${token.index} 槽位${token.slotIndex} 坐标 ${layout.percentX}%,${layout.percentY}%`,
        );
      }
    } else {
      lines.push("[数据池标记] 无");
    }

    if (computerTokens.length) {
      lines.push("[计算机第一排]");
      for (const token of computerTokens) {
        const layout = placement.getComputerDataSlotLayout(token.placementSlot);
        if (!layout) continue;
        lines.push(
          `序号 ${token.index} 放置位${token.placementSlot} 坐标 ${layout.percentX}%,${layout.percentY}%`,
        );
      }
    }

    if (blueBonusTokens.length) {
      lines.push("[蓝色科技附加]");
      for (const token of blueBonusTokens) {
        const layout = placement.getBlueBonusDataSlotLayout(token.blueSlot);
        if (!layout) continue;
        lines.push(
          `序号 ${token.index} 位置${token.blueSlot}蓝色科技 坐标 ${layout.percentX}%,${layout.percentY}%`,
        );
      }
    }

    const eligibleBlueSlots = state.listEligibleBlueBonusSlots(currentPlayer);
    if (eligibleBlueSlots.length) {
      lines.push(
        `[可放置蓝色科技附加] ${
          eligibleBlueSlots.map((slot) => {
            const required = placement.getRequiredComputerSlotForBlueBonus(slot);
            return `位置${slot}(第一排${required}下方)`;
          }).join(" ")
        }`,
      );
    }

    const overrides = render.listSlotLayoutOverrides();
    if (overrides.length) {
      lines.push("[拖动校准]");
      for (const item of overrides) {
        lines.push(
          `槽位${item.slotIndex} → ${item.percentX}%,${item.percentY}%`,
        );
      }
    }

    if (dataState.discardedCount > 0) {
      lines.push(`已弃置数据 ${dataState.discardedCount}`);
    }

    return lines;
  }

  return Object.freeze({
    DATA_POOL_SLOTS: placement.DATA_POOL_SLOTS,
    COMPUTER_DATA_SLOTS: placement.COMPUTER_DATA_SLOTS,
    BLUE_BONUS_DATA_SLOTS: placement.BLUE_BONUS_DATA_SLOTS,
    PLACEMENT_KIND_COMPUTER: state.PLACEMENT_KIND_COMPUTER,
    PLACEMENT_KIND_BLUE_BONUS: state.PLACEMENT_KIND_BLUE_BONUS,
    DATA_TOKEN_SRC: state.DATA_TOKEN_SRC,
    createDefaultDataState: state.createDefaultDataState,
    normalizeDataState: state.normalizeDataState,
    ensurePlayerDataState: state.ensurePlayerDataState,
    listPoolTokens: state.listPoolTokens,
    listPlacedTokens: state.listPlacedTokens,
    listComputerPlacedTokens: state.listComputerPlacedTokens,
    listBlueBonusPlacedTokens: state.listBlueBonusPlacedTokens,
    listDataTokens: state.listDataTokens,
    listEligibleBlueBonusSlots: state.listEligibleBlueBonusSlots,
    hasBlueTechInBoardSlot: state.hasBlueTechInBoardSlot,
    hasBlueBonusPlaceOptions: state.hasBlueBonusPlaceOptions,
    gainData: state.gainData,
    ANALYZE_ENERGY_COST: state.ANALYZE_ENERGY_COST,
    isAnalyzeReady: state.isAnalyzeReady,
    canPlaceAnyData: state.canPlaceAnyData,
    listPlaceDataChoices: state.listPlaceDataChoices,
    canAnalyzeData: state.canAnalyzeData,
    analyzeData: state.analyzeData,
    analyzeDataWithoutEnergy: state.analyzeDataWithoutEnergy,
    canPlaceDataToComputer: state.canPlaceDataToComputer,
    canPlaceDataToBlueBonus: state.canPlaceDataToBlueBonus,
    placeDataToComputer: state.placeDataToComputer,
    DATA_TOKEN_DISPLAY_SCALE: placement.DATA_TOKEN_DISPLAY_SCALE,
    getDataPoolSlotLayout: placement.getDataPoolSlotLayout,
    getComputerDataSlotLayout: placement.getComputerDataSlotLayout,
    getComputerSlotBonus: placement.getComputerSlotBonus,
    getBlueBonusDataSlotLayout: placement.getBlueBonusDataSlotLayout,
    getRequiredComputerSlotForBlueBonus: placement.getRequiredComputerSlotForBlueBonus,
    getComputerSlotForBlueBoardSlot: placement.getComputerSlotForBlueBoardSlot,
    getBlueBoardSlotForComputerSlot: placement.getBlueBoardSlotForComputerSlot,
    getBlueTileDataBonus: placement.getBlueTileDataBonus,
    getBlueColumnScoreBonus: placement.getBlueColumnScoreBonus,
    getBlueTechTileInBoardSlot: state.getBlueTechTileInBoardSlot,
    getComputerSlotBlueColumnBonus: state.getComputerSlotBlueColumnBonus,
    getBlueBonusPlacementReward: state.getBlueBonusPlacementReward,
    getEffectiveSlotLayout: render.getEffectiveSlotLayout,
    getEffectivePoolSlotLayout: render.getEffectivePoolSlotLayout,
    listSlotLayoutOverrides: render.listSlotLayoutOverrides,
    bindDataTokenDragging: render.bindDataTokenDragging,
    renderPlayerDataTokens: render.renderPlayerDataTokens,
    resetPlayerDataTokens: render.resetPlayerDataTokens,
    NEBULA_DATA_CAPACITY: nebulaPlacement.NEBULA_DATA_CAPACITY,
    NEBULA_LABELS: nebulaPlacement.NEBULA_LABELS,
    NEBULA_IDS: nebulaPlacement.NEBULA_IDS,
    BOARD_SLOT_ROTATION: nebulaPlacement.BOARD_SLOT_ROTATION,
    getNebulaPanelRegion: nebulaPlacement.getNebulaPanelRegion,
    getBoardSlotRotation: nebulaPlacement.getBoardSlotRotation,
    sectorImageToNebulaLocal: nebulaPlacement.sectorImageToNebulaLocal,
    nebulaLocalToSectorImage: nebulaPlacement.nebulaLocalToSectorImage,
    clientToSectorImagePercent: nebulaRender.clientToSectorImagePercent,
    clientToNebulaLocalPercent: nebulaRender.clientToNebulaLocalPercent,
    getNebulaLabel: nebulaPlacement.getNebulaLabel,
    getNebulaCapacity: nebulaPlacement.getNebulaCapacity,
    getNebulaDataSlotLayout: nebulaPlacement.getNebulaDataSlotLayout,
    listNebulaIdsForSector: nebulaPlacement.listNebulaIdsForSector,
    createDefaultNebulaDataState: nebulaState.createDefaultNebulaDataState,
    createDefaultSectorSettlementState: nebulaState.createDefaultSectorSettlementState,
    normalizeNebulaDataState: nebulaState.normalizeNebulaDataState,
    listNebulaTokens: nebulaState.listNebulaTokens,
    listAllNebulaTokens: nebulaState.listAllNebulaTokens,
    fillNebulaData: nebulaState.fillNebulaData,
    fillAllNebulaData: nebulaState.fillAllNebulaData,
    clearNebulaData: nebulaState.clearNebulaData,
    updateNebulaTokenPosition: nebulaState.updateNebulaTokenPosition,
    addSectorExtraMark: nebulaState.addSectorExtraMark,
    removeSectorExtraMark: nebulaState.removeSectorExtraMark,
    listSectorExtraMarks: nebulaState.listSectorExtraMarks,
    isSectorReadyToSettle: nebulaState.isSectorReadyToSettle,
    getSectorTokenStats: nebulaState.getSectorTokenStats,
    getSectorRanking: nebulaState.getSectorRanking,
    settleSector: nebulaState.settleSector,
    settleCompletedSectors: nebulaState.settleCompletedSectors,
    getSectorSettlementReadoutLines: nebulaState.getSectorSettlementReadoutLines,
    NEBULA_SECOND_SLOT_INDEX: nebulaState.NEBULA_SECOND_SLOT_INDEX,
    NEBULA_SECOND_SLOT_SCORE: nebulaState.NEBULA_SECOND_SLOT_SCORE,
    getNebulaSecondSlotScoreReward: nebulaState.getNebulaSecondSlotScoreReward,
    getNebulaReplacementStats: nebulaState.getNebulaReplacementStats,
    getNextReplaceableNebulaToken: nebulaState.getNextReplaceableNebulaToken,
    revertNebulaTokenReplacement: nebulaState.revertNebulaTokenReplacement,
    replaceNextNebulaDataToken: nebulaState.replaceNextNebulaDataToken,
    bindNebulaDataDragging: nebulaRender.bindNebulaDataDragging,
    renderSectorNebulaData: nebulaRender.renderSectorNebulaData,
    renderAllSectorNebulaData: nebulaRender.renderAllSectorNebulaData,
    getEffectiveNebulaSlotLayout: nebulaRender.getEffectiveNebulaSlotLayout,
    listNebulaSlotLayoutOverrides: nebulaRender.listNebulaSlotLayoutOverrides,
    resetNebulaDataTokens: nebulaRender.resetNebulaDataTokens,
    getNebulaReadoutLines,
    getReadoutLines,
  });
});
