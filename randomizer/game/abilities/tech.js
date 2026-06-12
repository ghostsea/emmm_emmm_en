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

    const snapshots = {
      player: structuredClone(playerResult.currentPlayer),
      board: structuredClone(context.techBoardState),
      ui: structuredClone(context.techUiState),
    };
    if (snapshots.ui) {
      snapshots.ui.techSelectionActive = true;
      snapshots.ui.pendingTileId = null;
      snapshots.ui.selectedTileId = null;
      snapshots.ui.selectedBlueSlot = null;
      snapshots.ui.statusNote = "请选择要研究的科技板块";
    }
    const skipCost = Boolean(context.techUiState?.cheatModeEnabled || options.skipCost);
    const result = tech.resolver.selectTechTile(context, { tileId, blueSlot, skipCost });
    if (!result.ok || result.needsBlueSlotChoice) {
      restoreObject(playerResult.currentPlayer, snapshots.player);
      restoreObject(context.techBoardState, snapshots.board);
      restoreObject(context.techUiState, snapshots.ui);
      return {
        ok: false,
        abilityId: "researchTechSelect",
        message: result.message || "科技选择失败",
      };
    }

    if (context.techUiState) {
      context.techUiState.techSelectionActive = false;
      context.techUiState.selectedTileId = result.tileId;
      context.techUiState.selectedBlueSlot = result.blueSlot;
      context.techUiState.pendingTileId = null;
      context.techUiState.statusNote = result.message;
    }

    return {
      ...result,
      ok: true,
      abilityId: "researchTechSelect",
      message: result.message,
      undoable: true,
      commands: [
        {
          label: "选择科技片",
          describe: "恢复选择科技片前状态",
          undo() {
            restoreObject(playerResult.currentPlayer, snapshots.player);
            restoreObject(context.techBoardState, snapshots.board);
            restoreObject(context.techUiState, snapshots.ui);
          },
        },
      ],
      cost: skipCost ? {} : { publicity: tech.RESEARCH_PUBLICITY_COST },
      payload: {
        tileId: result.tileId,
        techType: result.techType,
        bonusId: result.bonusId,
        blueSlot: result.blueSlot,
        firstTake: result.firstTake,
      },
      events: [],
    };
  }

  function researchTechRotate(context) {
    const result = tech.resolver.rotateForResearch(context, 1);
    return {
      ok: result.ok,
      abilityId: "researchTechRotate",
      message: result.message,
      undoable: false,
      commands: [],
      cost: {},
      payload: {},
      events: [],
    };
  }

  function researchTechTileEffect(context, options = {}) {
    const tileId = options.tileId || context.techUiState?.selectedTileId;
    let freeLaunch = null;
    let message = `${tileId || "科技"}：无即时效果`;
    if (tileId === "orange1") {
      freeLaunch = rocketAbility.launchProbe(context, {
        skipCost: true,
        source: "tech",
        historyLabel: "橙色1：免费发射",
      });
      message = freeLaunch.ok
        ? `橙色1：${freeLaunch.message}`
        : `橙色1免费发射未执行：${freeLaunch.message}`;
    }

    return {
      ok: true,
      abilityId: "researchTechTileEffect",
      message,
      undoable: false,
      commands: [],
      cost: {},
      payload: {
        tileId,
        freeLaunch,
      },
      events: [],
      freeLaunch,
      rocket: freeLaunch?.ok ? freeLaunch.rocket : null,
    };
  }

  function researchTechBonus(context, options = {}) {
    const result = tech.resolver.applyTechBonus(context, {
      bonusId: options.bonusId,
      firstTake: Boolean(options.firstTake),
      skipCardSelection: Boolean(options.skipCardSelection),
    });
    return {
      ...result,
      abilityId: "researchTechBonus",
      undoable: false,
      commands: [],
      cost: {},
      payload: {
        bonusId: options.bonusId,
        firstTake: Boolean(options.firstTake),
        rewards: result.rewards || {},
      },
      events: [],
    };
  }

  return Object.freeze({
    researchTechPrepare,
    researchTechSelect,
    researchTechRotate,
    researchTechTileEffect,
    researchTechBonus,
  });
});
