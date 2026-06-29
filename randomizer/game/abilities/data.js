(function (root, factory) {
  "use strict";

  let players = root.SetiPlayers;
  let data = root.SetiData;
  let historyCommands = root.SetiHistoryCommands;
  let industryPassives = root.SetiIndustryPassives;

  if ((!players || !data || !historyCommands || !industryPassives) && typeof require === "function") {
    players = players || require("../players");
    data = data || require("../data");
    historyCommands = historyCommands || require("../history/commands");
    industryPassives = industryPassives || require("../industry/passives");
  }

  const api = factory(players, data, historyCommands, industryPassives);

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.SetiAbilityData = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function (
  players,
  data,
  historyCommands,
  industryPassives,
) {
  "use strict";

  function listPlacementChoices(player) {
    const check = data.canPlaceAnyData(player);
    if (!check.ok) {
      return { ok: false, message: check.message, choices: [] };
    }
    return {
      ok: true,
      message: check.message,
      choices: check.choices || data.listPlaceDataChoices(player),
    };
  }

  function needsPlacementChoice(choices) {
    if (!choices?.length) return false;
    if (choices.some((choice) => choice.target === data.PLACEMENT_KIND_BLUE_BONUS)) return true;
    return choices.length > 1;
  }

  function resolvePlacementOptions(options = {}, choices = []) {
    if (options.target != null) {
      return {
        target: options.target === data.PLACEMENT_KIND_BLUE_BONUS
          ? data.PLACEMENT_KIND_BLUE_BONUS
          : data.PLACEMENT_KIND_COMPUTER,
        blueSlot: options.blueSlot ?? null,
      };
    }

    if (!needsPlacementChoice(choices) && choices.length === 1) {
      const [choice] = choices;
      return {
        target: choice.target,
        blueSlot: choice.blueSlot ?? null,
      };
    }

    return null;
  }

  function getIndustryPassives() {
    if (industryPassives) return industryPassives;
    if (typeof globalThis !== "undefined" && globalThis.SetiIndustryPassives) {
      industryPassives = globalThis.SetiIndustryPassives;
    }
    return industryPassives;
  }

  function placeData(context, options = {}) {
    const player = players.getCurrentPlayer(context.playerState);
    if (!player) return { ok: false, abilityId: "placeData", message: "没有当前玩家" };

    const choiceResult = listPlacementChoices(player);
    if (!choiceResult.ok) {
      return { ok: false, abilityId: "placeData", message: choiceResult.message };
    }

    const choices = choiceResult.choices;
    const resolved = resolvePlacementOptions(options, choices);
    if (!resolved) {
      return {
        ok: true,
        abilityId: "placeData",
        message: "请选择数据放置位置",
        undoable: true,
        commands: [],
        cost: {},
        payload: { choices },
        events: [],
        awaitingPlacementChoice: true,
        choices,
      };
    }

    const placeOptions = resolved.target === data.PLACEMENT_KIND_BLUE_BONUS
      ? { target: resolved.target, blueSlot: Number(resolved.blueSlot) }
      : { target: data.PLACEMENT_KIND_COMPUTER };
    const result = data.placeDataToComputer(player, placeOptions);
    if (!result.ok) {
      return { ok: false, abilityId: "placeData", message: result.message };
    }

    const message = options.message || result.message;
    return {
      ok: true,
      abilityId: "placeData",
      message,
      undoable: true,
      commands: [
        historyCommands.createPlaceDataCommand(player, result),
      ],
      cost: {},
      payload: {
        placementKind: result.placementKind,
        placementSlot: result.placementSlot,
        blueSlot: result.blueSlot,
        blueTileId: result.blueTileId ?? null,
        slotBonus: result.slotBonus ?? null,
        slotBonuses: result.slotBonuses ?? [],
        choices,
      },
      events: [],
      ...result,
    };
  }

  function analyzeData(context, options = {}) {
    const player = players.getCurrentPlayer(context.playerState);
    if (!player) return { ok: false, abilityId: "analyzeData", message: "没有当前玩家" };

    const freeEnergy = Boolean(options.skipCost) || Boolean(getIndustryPassives()?.canAnalyzeWithoutEnergy?.(player));
    const check = data.canAnalyzeData(player, { skipEnergyCost: freeEnergy });
    if (!check.ok) return { ok: false, abilityId: "analyzeData", message: check.message };

    const snapshot = structuredClone(player);
    const result = freeEnergy
      ? data.analyzeDataWithoutEnergy?.(player) || data.analyzeData(player)
      : data.analyzeData(player);
    if (!result.ok) return { ok: false, abilityId: "analyzeData", message: result.message };

    const message = options.message || result.message;
    return {
      ok: true,
      abilityId: "analyzeData",
      message,
      undoable: true,
      commands: [
        historyCommands.createRestorePlayerCommand(player, snapshot, "恢复分析前玩家状态"),
      ],
      cost: freeEnergy ? {} : { energy: data.ANALYZE_ENERGY_COST },
      payload: {
        clearedCount: result.clearedCount,
      },
      events: [],
    };
  }

  return Object.freeze({
    placeData,
    needsPlacementChoice,
    listPlacementChoices,
    analyzeData,
  });
});
