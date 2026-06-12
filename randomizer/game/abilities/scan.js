(function (root, factory) {
  "use strict";

  let solar = root.SetiSolarSystem;
  let players = root.SetiPlayers;
  let data = root.SetiData;
  let historyCommands = root.SetiHistoryCommands;
  let rocketAbility = root.SetiAbilityRocket;

  if ((!solar || !players || !data || !historyCommands || !rocketAbility) && typeof require === "function") {
    solar = solar || require("../../solar-system/core");
    players = players || require("../players");
    data = data || require("../data");
    historyCommands = historyCommands || require("../history/commands");
    rocketAbility = rocketAbility || require("./rocket");
  }

  const api = factory(solar, players, data, historyCommands, rocketAbility);

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.SetiAbilityScan = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function (
  solar,
  players,
  data,
  historyCommands,
  rocketAbility,
) {
  "use strict";

  const SCAN_ACTION_4_LAUNCH_COST = Object.freeze({ energy: 1 });

  function getCurrentPlayer(context) {
    return players.getCurrentPlayer(context.playerState);
  }

  function getPlayerTokenSrc(context, player, options) {
    if (options.playerTokenSrc || options.tokenSrc) return options.playerTokenSrc || options.tokenSrc;
    if (typeof context.getPlayerTokenSrc === "function") {
      return context.getPlayerTokenSrc(player);
    }
    return players.getPlayerColorDefinition(player?.color)?.normalTokenAsset || null;
  }

  function resolveNebulaId(context, options = {}) {
    if (options.nebulaId) return options.nebulaId;
    if (options.sectorX != null) {
      const nebula = solar.getNebulaAtCoordinate(
        Number(options.sectorX),
        5,
        context.solarState?.sectorBySlot,
      );
      return nebula?.id || null;
    }
    return null;
  }

  function scanNebula(context, options = {}) {
    const currentPlayer = getCurrentPlayer(context);
    const nebulaId = resolveNebulaId(context, options);

    if (!currentPlayer) {
      return { ok: false, abilityId: "scanNebula", message: "没有当前玩家" };
    }
    if (!context.nebulaDataState) {
      return { ok: false, abilityId: "scanNebula", message: "星云状态未初始化" };
    }
    if (!nebulaId) {
      return { ok: false, abilityId: "scanNebula", message: "没有可扫描星云" };
    }

    const nextToken = data.getNextReplaceableNebulaToken(context.nebulaDataState, nebulaId);
    const tokenBefore = historyCommands.snapshotNebulaToken(nextToken);
    const replaceResult = data.replaceNextNebulaDataToken(context.nebulaDataState, nebulaId, currentPlayer, {
      playerColor: options.playerColor || currentPlayer.color,
      playerLabel: options.playerLabel || currentPlayer.colorLabel,
      playerTokenSrc: getPlayerTokenSrc(context, currentPlayer, options),
    });

    if (!replaceResult.ok) {
      return {
        ok: false,
        abilityId: "scanNebula",
        message: replaceResult.message,
      };
    }

    const gainResult = data.gainData(currentPlayer, { source: options.source || "scan" });
    const commands = [
      historyCommands.createNebulaReplaceCommand(
        context.nebulaDataState,
        nebulaId,
        replaceResult.token.id,
        tokenBefore,
      ),
      historyCommands.createGainDataCommand(currentPlayer, gainResult),
    ];

    const label = data.getNebulaLabel(nebulaId);
    const color = players.getPlayerColorDefinition(currentPlayer.color);
    const playerLabel = color?.label || currentPlayer.colorLabel || "当前玩家";
    const prefix = options.prefix || "扫描";
    const message = `${prefix}：${label} 槽位${replaceResult.slotIndex}`
      + ` 替换为${playerLabel}token；${gainResult.ok ? "获得数据" : gainResult.message}`;

    return {
      ok: true,
      abilityId: "scanNebula",
      message,
      commands,
      cost: {},
      payload: {
        nebulaId,
        replaced: replaceResult,
        gainedData: gainResult,
        card: options.card || null,
      },
      nebulaId,
      replaced: replaceResult,
      gainedData: gainResult,
    };
  }

  function scanSector(context, options = {}) {
    const result = scanNebula(context, options);
    return {
      ...result,
      abilityId: "scanSector",
    };
  }

  function scanPublicCard(context, options = {}) {
    const result = scanNebula(context, options);
    return {
      ...result,
      abilityId: "scanPublicCard",
    };
  }

  function scanHandCard(context, options = {}) {
    const result = scanNebula(context, options);
    return {
      ...result,
      abilityId: "scanHandCard",
    };
  }

  function scanAction4(context, options = {}) {
    if (options.choice === "launch" || options.mode === "launch") {
      return {
        ...rocketAbility.launchProbe(context, {
          ...options,
          cost: options.cost ?? SCAN_ACTION_4_LAUNCH_COST,
          historyLabel: options.historyLabel || "发射/移动：发射消耗 1 能量",
        }),
        abilityId: "scanAction4",
      };
    }

    if (options.choice === "move" || options.mode === "move") {
      return {
        ...rocketAbility.moveProbe(context, {
          ...options,
          cost: options.cost ?? {},
          historyLabel: options.historyLabel || "发射/移动：移动",
        }),
        abilityId: "scanAction4",
      };
    }

    return { ok: false, abilityId: "scanAction4", message: "未知发射/移动选择" };
  }

  return Object.freeze({
    SCAN_ACTION_4_LAUNCH_COST,
    scanSector,
    scanNebula,
    scanPublicCard,
    scanHandCard,
    scanAction4,
  });
});
