(function (root, factory) {
  "use strict";

  let players = root.SetiPlayers;
  let nebulaState = root.SetiNebulaDataState;

  if (typeof require === "function") {
    players = players || require("../players");
    nebulaState = nebulaState || require("../data/nebula-state");
  }

  const api = factory(players, nebulaState);

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.SetiHistoryCommands = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function (players, nebulaState) {
  "use strict";

  function snapshotNebulaToken(token) {
    if (!token) return null;
    return {
      replacedByPlayerId: token.replacedByPlayerId || null,
      replacedByPlayerColor: token.replacedByPlayerColor || null,
      replacedByPlayerLabel: token.replacedByPlayerLabel || null,
      playerTokenSrc: token.playerTokenSrc || null,
      replacedAt: token.replacedAt || null,
      replacementOrder: token.replacementOrder || null,
    };
  }

  function syncAvailableDataCount(player) {
    const poolLength = player?.dataState?.poolTokens?.length || 0;
    if (player?.resources) {
      player.resources.availableData = poolLength;
    }
  }

  function captureDrawPileCardIds(cardState) {
    return Array.isArray(cardState?.drawPileCardIds)
      ? cardState.drawPileCardIds.slice()
      : [];
  }

  function restoreDrawPileCardIds(cardState, snapshot) {
    if (!cardState) return;
    cardState.drawPileCardIds = Array.isArray(snapshot) ? snapshot.slice() : [];
  }

  function createResourceSpendCommand(player, cost, label) {
    const spent = { ...cost };
    return {
      label: label || `消耗 ${players.formatResourceCost(spent)}`,
      describe: label || `退还 ${players.formatResourceCost(spent)}`,
      undo() {
        players.gainResources(player, spent);
      },
    };
  }

  function createResourceGainCommand(player, gain, label) {
    const awarded = { ...gain };
    return {
      label: label || "资源获得",
      describe: label || "撤销资源获得",
      undo() {
        if (!player?.resources) return;
        if (awarded.score != null) {
          player.resources.score = (Number(player.resources.score) || 0) - awarded.score;
        }
        if (awarded.credits != null) {
          player.resources.credits = (Number(player.resources.credits) || 0) - awarded.credits;
        }
        if (awarded.energy != null) {
          player.resources.energy = (Number(player.resources.energy) || 0) - awarded.energy;
        }
        if (awarded.publicity != null) {
          player.resources.publicity = Math.max(0, (Number(player.resources.publicity) || 0) - awarded.publicity);
        }
        if (awarded.additionalPublicScan != null) {
          player.resources.additionalPublicScan = Math.max(
            0,
            (Number(player.resources.additionalPublicScan) || 0) - awarded.additionalPublicScan,
          );
        }
      },
    };
  }

  function createNebulaReplaceCommand(nebulaDataState, nebulaId, tokenId, before) {
    return {
      label: `星云 ${nebulaId} 数据替换`,
      describe: `恢复星云 ${nebulaId} 槽位数据`,
      undo() {
        nebulaState.revertNebulaTokenReplacement(nebulaDataState, nebulaId, tokenId, before);
      },
    };
  }

  function createGainDataCommand(player, gainResult) {
    const discarded = Boolean(gainResult?.discarded);
    const tokenId = gainResult?.token?.id || null;
    return {
      label: discarded ? "数据获取（溢出弃置）" : "数据获取",
      describe: discarded ? "恢复溢出弃置计数" : "移除已获得的数据",
      undo() {
        const dataState = player?.dataState;
        if (!dataState) return;
        if (discarded) {
          dataState.discardedCount = Math.max(0, (dataState.discardedCount || 0) - 1);
          return;
        }
        if (!tokenId) return;
        const index = dataState.poolTokens.findIndex((token) => token.id === tokenId);
        if (index >= 0) {
          dataState.poolTokens.splice(index, 1);
          syncAvailableDataCount(player);
        }
      },
    };
  }

  function createRestorePublicCardsCommand(
    cardState,
    publicCardsSnapshot,
    discardPileSnapshot,
    drawPileCardIdsSnapshot = captureDrawPileCardIds(cardState),
  ) {
    return {
      label: "公共牌区变更",
      describe: "恢复公共牌区、弃牌堆与抽牌堆",
      undo() {
        cardState.publicCards = publicCardsSnapshot.slice();
        cardState.discardPile = discardPileSnapshot.slice();
        restoreDrawPileCardIds(cardState, drawPileCardIdsSnapshot);
      },
    };
  }

  function createDiscardHandCardCommand(
    cardState,
    player,
    handSnapshot,
    discardPileSnapshot,
    drawPileCardIdsSnapshot = captureDrawPileCardIds(cardState),
  ) {
    return {
      label: "手牌弃除",
      describe: "恢复手牌、弃牌堆与抽牌堆",
      undo() {
        player.hand = handSnapshot.slice();
        player.resources.handSize = player.hand.length;
        cardState.discardPile = discardPileSnapshot.slice();
        restoreDrawPileCardIds(cardState, drawPileCardIdsSnapshot);
      },
    };
  }

  function createRemoveRocketCommand(
    rocketActions,
    rocketState,
    rocketId,
    player,
    refundCost = null,
    undoState = null,
  ) {
    const nextRocketIdOnUndo = undoState?.nextRocketId ?? rocketId;
    const activeRocketIdOnUndo = undoState?.activeRocketId ?? null;
    const refund = refundCost ? { ...refundCost } : null;
    return {
      label: `发射火箭 R${rocketId}`,
      describe: `移除火箭 R${rocketId}`,
      undo() {
        rocketActions.removeRocket(rocketState, rocketId);
        rocketState.nextRocketId = nextRocketIdOnUndo;
        rocketState.activeRocketId = activeRocketIdOnUndo;
        if (refund && player) {
          players.gainResources(player, refund);
        }
      },
    };
  }

  function createLaunchRocketCommand(rocketActions, rocketState, rocketId, player, energyCost) {
    return createRemoveRocketCommand(
      rocketActions,
      rocketState,
      rocketId,
      player,
      energyCost ? { energy: energyCost } : null,
    );
  }

  function captureTradeState(player, cardState) {
    return {
      resources: { ...(player?.resources || {}) },
      hand: (player?.hand || []).slice(),
      discardPile: (cardState?.discardPile || []).slice(),
      drawPileCardIds: captureDrawPileCardIds(cardState),
      publicCards: (cardState?.publicCards || []).slice(),
    };
  }

  function createRestoreTradeStateCommand(player, cardState, snapshot) {
    return {
      label: "快速交易",
      describe: "恢复交易前玩家与牌区状态",
      undo() {
        if (!player || !snapshot) return;
        player.resources = { ...snapshot.resources };
        player.hand = snapshot.hand.slice();
        if (cardState) {
          cardState.discardPile = snapshot.discardPile.slice();
          restoreDrawPileCardIds(cardState, snapshot.drawPileCardIds);
          cardState.publicCards = snapshot.publicCards.slice();
        }
      },
    };
  }

  function createAnalyzeDataCommand(player, placedTokensSnapshot) {
    const placed = placedTokensSnapshot.slice();
    return {
      label: "分析数据",
      describe: "恢复已放置数据",
      undo() {
        if (!player?.dataState) return;
        player.dataState.placedTokens = placed.map((token) => ({ ...token }));
      },
    };
  }

  function createPlaceDataCommand(player, placeResult) {
    const poolToken = placeResult?.poolToken ? { ...placeResult.poolToken } : null;
    const placedToken = placeResult?.token ? { ...placeResult.token } : null;
    return {
      label: "放置数据",
      describe: "恢复数据池与放置区",
      undo() {
        const dataState = player?.dataState;
        if (!dataState || !poolToken || !placedToken) return;
        const placedIndex = dataState.placedTokens.findIndex((token) => token.id === placedToken.id);
        if (placedIndex >= 0) {
          dataState.placedTokens.splice(placedIndex, 1);
        }
        dataState.poolTokens.push({ ...poolToken });
        syncAvailableDataCount(player);
      },
    };
  }

  function createMoveRocketCommand(rocketState, rocketId, beforeRocket) {
    return {
      label: `移动火箭 R${rocketId}`,
      describe: `恢复火箭 R${rocketId} 位置`,
      undo() {
        const rocket = rocketState.rockets.find((item) => item.id === rocketId);
        if (!rocket || !beforeRocket) return;
        Object.assign(rocket, structuredClone(beforeRocket));
        rocketState.activeRocketId = beforeRocket.id;
      },
    };
  }

  function createRestoreObjectCommand(target, snapshot, label) {
    const saved = structuredClone(snapshot);
    return {
      label: label || "状态恢复",
      describe: label || "恢复状态快照",
      undo() {
        if (!target || !saved) return;
        for (const key of Object.keys(target)) {
          delete target[key];
        }
        Object.assign(target, structuredClone(saved));
      },
    };
  }

  function createRestorePlayerCommand(player, snapshot, label) {
    return createRestoreObjectCommand(player, snapshot, label || "玩家状态恢复");
  }

  function createRestoreRocketStateCommand(rocketState, snapshot, label) {
    return createRestoreObjectCommand(rocketState, snapshot, label || "火箭状态恢复");
  }

  function createRestorePlanetStatsCommand(planetStatsState, snapshot, label) {
    return createRestoreObjectCommand(planetStatsState, snapshot, label || "星球状态恢复");
  }

  return Object.freeze({
    snapshotNebulaToken,
    createResourceSpendCommand,
    createResourceGainCommand,
    createNebulaReplaceCommand,
    createGainDataCommand,
    createRestorePublicCardsCommand,
    createDiscardHandCardCommand,
    createRemoveRocketCommand,
    createLaunchRocketCommand,
    createMoveRocketCommand,
    createRestoreObjectCommand,
    createRestorePlayerCommand,
    createRestoreRocketStateCommand,
    createRestorePlanetStatsCommand,
    captureTradeState,
    createRestoreTradeStateCommand,
    createAnalyzeDataCommand,
    createPlaceDataCommand,
  });
});
