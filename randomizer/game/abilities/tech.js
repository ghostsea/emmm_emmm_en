(function (root, factory) {
  "use strict";

  let players = root.SetiPlayers;
  let tech = root.SetiTech;
  let rocketAbility = root.SetiAbilityRocket;

  if ((!players || !tech || !rocketAbility) && typeof require === "function") {
    players = players || require("../players");
    tech = tech || require("../tech");
    rocketAbility = rocketAbility || require("./rocket");
  }

  const api = factory(players, tech, rocketAbility);

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.SetiAbilityTech = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function (
  players,
  tech,
  rocketAbility,
) {
  "use strict";

  function restoreObject(target, snapshot) {
    if (!target || !snapshot) return;
    for (const key of Object.keys(target)) delete target[key];
    Object.assign(target, structuredClone(snapshot));
  }

  function getPlayerTechState(context) {
    const currentPlayer = players.getCurrentPlayer(context.playerState);
    if (!currentPlayer) return { ok: false, message: "没有当前玩家" };
    if (!currentPlayer.techState && context.ensurePlayerTechState) {
      context.ensurePlayerTechState(currentPlayer);
    }
    if (!currentPlayer.techState) return { ok: false, message: "玩家科技状态未初始化" };
    return { ok: true, currentPlayer };
  }

  function researchTechPrepare(context) {
    const playerResult = getPlayerTechState(context);
    if (!playerResult.ok) {
      if (context.techUiState) context.techUiState.statusNote = playerResult.message;
      return { ok: false, abilityId: "researchTechPrepare", message: playerResult.message };
    }

    const board = context.techBoardState;
    if (!board) return { ok: false, abilityId: "researchTechPrepare", message: "科技版图状态未初始化" };

    const cheatMode = Boolean(context.techUiState?.cheatModeEnabled);
    if (!cheatMode && !players.canAfford(playerResult.currentPlayer, { publicity: tech.RESEARCH_PUBLICITY_COST })) {
      const message = `宣传不足，研究科技需要 ${tech.RESEARCH_PUBLICITY_COST} 宣传`;
      if (context.techUiState) context.techUiState.statusNote = message;
      return { ok: false, abilityId: "researchTechPrepare", message };
    }

    const takeable = tech.listTakeableTiles(board, playerResult.currentPlayer.techState);
    if (!takeable.length) {
      const message = "没有可研究的科技板块";
      if (context.techUiState) context.techUiState.statusNote = message;
      return { ok: false, abilityId: "researchTechPrepare", message };
    }

    if (context.techUiState) {
      context.techUiState.techSelectionActive = true;
      context.techUiState.selectedTileId = null;
      context.techUiState.selectedBlueSlot = null;
      context.techUiState.pendingTileId = null;
      context.techUiState.statusNote = "请选择要研究的科技板块";
    }

    return {
      ok: true,
      abilityId: "researchTechPrepare",
      message: "请选择要研究的科技板块",
      undoable: true,
      commands: [],
      cost: {},
      payload: { takeable },
      events: [],
      awaitingTileSelection: true,
      takeable,
    };
  }

  function researchTechSelect(context, options = {}) {
    const tileId = options.tileId;
    const playerResult = getPlayerTechState(context);
    if (!playerResult.ok) return { ok: false, abilityId: "researchTechSelect", message: playerResult.message };
    const canTake = tech.resolver.canTakeTile(
      context.techBoardState,
      playerResult.currentPlayer.techState,
      tileId,
    );
    if (!canTake.ok) return { ok: false, abilityId: "researchTechSelect", message: canTake.message };

    let blueSlot = options.blueSlot ?? null;
    if (canTake.techType === "blue" && blueSlot == null) {
      const availableSlots = tech.getAvailableBlueSlots(playerResult.currentPlayer.techState);
      if (availableSlots.length > 1) {
        if (context.techUiState) {
          context.techUiState.pendingTileId = tileId;
          context.techUiState.selectedTileId = tileId;
          context.techUiState.statusNote = `请选择 ${tileId} 的蓝色放置位置`;
        }
        return {
          ok: true,
          abilityId: "researchTechSelect",
          message: `请选择 ${tileId} 的蓝色放置位置`,
          undoable: true,
          commands: [],
          cost: {},
          payload: { tileId, availableSlots },
          events: [],
          needsBlueSlotChoice: true,
          tileId,
          availableSlots,
        };
      }
      blueSlot = availableSlots[0] ?? null;
    }

    if (context.techUiState) {
      context.techUiState.selectedTileId = tileId;
      context.techUiState.selectedBlueSlot = blueSlot;
      context.techUiState.pendingTileId = null;
      context.techUiState.statusNote = `已选择 ${tileId}，点击确认后结算科技`;
    }

    return {
      ok: true,
      abilityId: "researchTechSelect",
      message: `已选择 ${tileId}，点击确认后结算科技`,
      undoable: true,
      commands: [],
      cost: {},
      payload: { tileId, blueSlot },
      events: [],
      tileId,
      blueSlot,
    };
  }

  function researchTechCommit(context, options = {}) {
    const tileId = options.tileId || context.techUiState?.selectedTileId;
    const blueSlot = options.blueSlot ?? context.techUiState?.selectedBlueSlot ?? null;
    if (!tileId) return { ok: false, abilityId: "researchTechCommit", message: "没有已选择的科技" };

    const currentPlayer = players.getCurrentPlayer(context.playerState);
    const snapshots = {
      player: currentPlayer ? structuredClone(currentPlayer) : null,
      board: structuredClone(context.techBoardState),
      ui: structuredClone(context.techUiState),
      solarState: context.solarState ? structuredClone(context.solarState) : null,
      cardState: context.cardState ? structuredClone(context.cardState) : null,
    };

    const skipCost = Boolean(context.techUiState?.cheatModeEnabled || options.skipCost);
    const result = tech.resolver.executeTakeTech(context, {
      tileId,
      blueSlot,
      skipCost,
      skipRotation: Boolean(options.skipRotation),
    });

    if (!result.ok || result.needsBlueSlotChoice) {
      if (currentPlayer && snapshots.player) restoreObject(currentPlayer, snapshots.player);
      restoreObject(context.techBoardState, snapshots.board);
      restoreObject(context.techUiState, snapshots.ui);
      if (context.solarState && snapshots.solarState) restoreObject(context.solarState, snapshots.solarState);
      if (context.cardState && snapshots.cardState) restoreObject(context.cardState, snapshots.cardState);
      return {
        ok: false,
        abilityId: "researchTechCommit",
        message: result.message || "科技结算失败",
      };
    }

    if (context.techUiState) {
      context.techUiState.techSelectionActive = false;
      context.techUiState.pendingTileId = null;
      context.techUiState.selectedTileId = null;
      context.techUiState.selectedBlueSlot = null;
      context.techUiState.statusNote = result.message;
    }

    let freeLaunch = null;
    if (result.tileId === "orange1") {
      freeLaunch = rocketAbility.launchProbe(context, {
        skipCost: true,
        source: "tech",
        historyLabel: "橙色1：免费发射",
      });
      const freeLaunchNote = freeLaunch.ok
        ? `；橙色1：${freeLaunch.message}`
        : `；橙色1免费发射未执行：${freeLaunch.message}`;
      result.message += freeLaunchNote;
      if (context.techUiState) context.techUiState.statusNote = result.message;
    }

    return {
      ...result,
      abilityId: "researchTechCommit",
      undoable: false,
      commands: [],
      cost: skipCost ? {} : { publicity: tech.RESEARCH_PUBLICITY_COST },
      payload: {
        tileId: result.tileId,
        techType: result.techType,
        bonusId: result.bonusId,
        blueSlot: result.blueSlot,
        firstTake: result.firstTake,
        rewards: result.rewards,
        freeLaunch,
      },
      events: [],
      freeLaunch,
      rocket: freeLaunch?.ok ? freeLaunch.rocket : null,
    };
  }

  return Object.freeze({
    researchTechPrepare,
    researchTechSelect,
    researchTechCommit,
  });
});
