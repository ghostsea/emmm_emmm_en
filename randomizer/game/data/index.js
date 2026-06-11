(function (root, factory) {
  "use strict";

  let placement = root.SetiDataPlacement;
  let state = root.SetiDataState;
  let render = root.SetiDataRender;

  if (typeof require === "function") {
    placement = placement || require("./placement");
    state = state || require("./state");
    render = render || require("./render");
  }

  const api = factory(placement, state, render);

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.SetiData = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function (placement, state, render) {
  "use strict";

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
    hasBlueBonusPlaceOptions: state.hasBlueBonusPlaceOptions,
    gainData: state.gainData,
    ANALYZE_ENERGY_COST: state.ANALYZE_ENERGY_COST,
    isAnalyzeReady: state.isAnalyzeReady,
    canPlaceAnyData: state.canPlaceAnyData,
    listPlaceDataChoices: state.listPlaceDataChoices,
    canAnalyzeData: state.canAnalyzeData,
    analyzeData: state.analyzeData,
    canPlaceDataToComputer: state.canPlaceDataToComputer,
    canPlaceDataToBlueBonus: state.canPlaceDataToBlueBonus,
    placeDataToComputer: state.placeDataToComputer,
    DATA_TOKEN_DISPLAY_SCALE: placement.DATA_TOKEN_DISPLAY_SCALE,
    getDataPoolSlotLayout: placement.getDataPoolSlotLayout,
    getComputerDataSlotLayout: placement.getComputerDataSlotLayout,
    getBlueBonusDataSlotLayout: placement.getBlueBonusDataSlotLayout,
    getRequiredComputerSlotForBlueBonus: placement.getRequiredComputerSlotForBlueBonus,
    getEffectiveSlotLayout: render.getEffectiveSlotLayout,
    getEffectivePoolSlotLayout: render.getEffectivePoolSlotLayout,
    listSlotLayoutOverrides: render.listSlotLayoutOverrides,
    bindDataTokenDragging: render.bindDataTokenDragging,
    renderPlayerDataTokens: render.renderPlayerDataTokens,
    resetPlayerDataTokens: render.resetPlayerDataTokens,
    getReadoutLines,
  });
});
