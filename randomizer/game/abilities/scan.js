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
  const SCAN_COST = Object.freeze({ credits: 1, energy: 2 });

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

    const shouldGainData = options.gainData !== false;
    const gainResult = shouldGainData
      ? data.gainData(currentPlayer, { source: options.source || "scan" })
      : { ok: true, skipped: true, message: "未获得数据" };
    const commands = [
      historyCommands.createNebulaReplaceCommand(
        context.nebulaDataState,
        nebulaId,
        replaceResult.token.id,
        tokenBefore,
      ),
    ];
    if (replaceResult.scoreAwarded) {
      commands.push(historyCommands.createResourceGainCommand(
        currentPlayer,
        { score: replaceResult.scoreAwarded },
        `扫描第二格 +${replaceResult.scoreAwarded}分`,
      ));
    }
    if (shouldGainData) {
      commands.push(historyCommands.createGainDataCommand(currentPlayer, gainResult));
    }

    const label = data.getNebulaLabel(nebulaId);
    const color = players.getPlayerColorDefinition(currentPlayer.color);
    const playerLabel = color?.label || currentPlayer.colorLabel || "当前玩家";
    const prefix = options.prefix || "扫描";
    const dataMessage = shouldGainData
      ? (gainResult.ok ? "获得数据" : gainResult.message)
      : "不获得数据";
    const scoreMessage = replaceResult.scoreAwarded
      ? `；槽位${replaceResult.slotIndex} +${replaceResult.scoreAwarded}分`
      : "";
    const message = `${prefix}：${label} 槽位${replaceResult.slotIndex}`
      + ` 替换为${playerLabel}token${scoreMessage}；${dataMessage}`;

    return {
      ok: true,
      abilityId: "scanNebula",
      message,
      undoable: true,
      commands,
      cost: {},
      payload: {
        nebulaId,
        replaced: replaceResult,
        gainedData: gainResult,
        gainData: shouldGainData,
        card: options.card || null,
      },
      events: [{
        type: "signalMarked",
        nebulaId,
        slotIndex: replaceResult.slotIndex,
        playerId: currentPlayer.id,
      }],
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
    if (!result.ok) {
      return {
        ...result,
        abilityId: "scanPublicCard",
      };
    }

    const slotIndex = Number(options.publicSlotIndex);
    const cardState = context.cardState;
    const card = options.card || cardState?.publicCards?.[slotIndex] || null;
    if (cardState && card && Number.isInteger(slotIndex)) {
      const publicCardsSnapshot = cardState.publicCards.slice();
      const discardPileSnapshot = (cardState.discardPile || []).slice();

      if (!Array.isArray(cardState.discardPile)) cardState.discardPile = [];
      cardState.discardPile.push(card);
      let replenished = null;
      if (cardState.publicCards?.[slotIndex]?.id === card.id) {
        cardState.publicCards[slotIndex] = null;
        if (typeof context.replenishPublicSlot === "function") {
          replenished = context.replenishPublicSlot(slotIndex);
        }
      }

      result.commands.push(historyCommands.createRestorePublicCardsCommand(
        cardState,
        publicCardsSnapshot,
        discardPileSnapshot,
      ));
      result.payload.card = card;
      result.payload.replenished = replenished;
      result.message += replenished
        ? `；弃除 ${card.cardName || card.cardId || card.id}，公共区补牌`
        : `；弃除 ${card.cardName || card.cardId || card.id}`;
      if (replenished) {
        result.undoable = false;
        result.irreversible = {
          code: "hidden_card_reveal",
          reason: "公共牌补牌翻出新牌",
        };
      }
    }

    return {
      ...result,
      abilityId: "scanPublicCard",
    };
  }

  function scanHandCard(context, options = {}) {
    const result = scanNebula(context, options);
    if (!result.ok) {
      return {
        ...result,
        abilityId: "scanHandCard",
      };
    }

    const player = options.player || getCurrentPlayer(context);
    const handIndex = Number(options.handIndex);
    const card = options.card || player?.hand?.[handIndex] || null;
    if (context.cardState && player && card && Number.isInteger(handIndex)) {
      const discardIndex = player.hand?.findIndex((item) => item.id === card.id);
      const resolvedIndex = discardIndex >= 0 ? discardIndex : handIndex;
      const handSnapshot = player.hand.slice();
      const discardPileSnapshot = (context.cardState.discardPile || []).slice();
      const discarded = player.hand.splice(resolvedIndex, 1)[0];
      player.resources.handSize = player.hand.length;
      if (!Array.isArray(context.cardState.discardPile)) context.cardState.discardPile = [];
      context.cardState.discardPile.push(discarded);

      result.commands.push(historyCommands.createDiscardHandCardCommand(
        context.cardState,
        player,
        handSnapshot,
        discardPileSnapshot,
      ));
      result.payload.card = discarded;
      result.message += `；弃除手牌 ${discarded.cardName || discarded.cardId || discarded.id}`;
    }

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
        undoable: true,
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
        undoable: true,
      };
    }

    return { ok: false, abilityId: "scanAction4", message: "未知发射/移动选择" };
  }

  function payScanCost(context, options = {}) {
    const currentPlayer = getCurrentPlayer(context);
    const cost = options.skipCost ? {} : { ...(options.cost || SCAN_COST) };
    if (!currentPlayer) return { ok: false, abilityId: "payScanCost", message: "没有当前玩家" };
    if (Object.keys(cost).length && !players.canAfford(currentPlayer, cost)) {
      return {
        ok: false,
        abilityId: "payScanCost",
        message: `资源不足，需要 ${players.formatResourceCost(cost)}`,
      };
    }
    const spend = Object.keys(cost).length ? players.spendResources(currentPlayer, cost) : { ok: true };
    if (!spend.ok) return { ok: false, abilityId: "payScanCost", message: spend.message };

    const message = Object.keys(cost).length
      ? `扫描消耗 ${players.formatResourceCost(cost)}`
      : "扫描免费";
    return {
      ok: true,
      abilityId: "payScanCost",
      message,
      undoable: true,
      commands: Object.keys(cost).length
        ? [historyCommands.createResourceSpendCommand(currentPlayer, cost, message)]
        : [],
      cost,
      payload: {},
      events: [],
    };
  }

  return Object.freeze({
    SCAN_ACTION_4_LAUNCH_COST,
    SCAN_COST,
    payScanCost,
    scanSector,
    scanNebula,
    scanPublicCard,
    scanHandCard,
    scanAction4,
  });
});
