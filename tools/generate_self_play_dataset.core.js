"use strict";

const selfPlay = require("../randomizer/game/ai/self-play");
const mcts = require("../randomizer/game/ai/mcts");
const aiActions = require("../randomizer/game/actions");
const players = require("../randomizer/game/players");
const rockets = require("../randomizer/game/rockets");
const planetStats = require("../randomizer/game/planet-stats");
const tech = require("../randomizer/game/tech");
const solar = require("../randomizer/solar-system/core");

function createSimpleRng(seedString) {
  let state = 0;
  const source = String(seedString || "seti-seed");
  for (let index = 0; index < source.length; index += 1) {
    state = (state * 31 + source.charCodeAt(index)) >>> 0;
  }
  if (state === 0) state = 0x9e3779b9;
  return {
    next() {
      state = (state * 1664525 + 1013904223) >>> 0;
      return state / 0x100000000;
    },
    pick(array) {
      if (!Array.isArray(array) || array.length === 0) return null;
      const index = Math.floor(this.next() * array.length);
      return array[Math.max(0, Math.min(array.length - 1, index))];
    },
  };
}

function toActivePlayerIds(count) {
  const safeCount = Math.max(2, Math.min(4, Number(count) || 4));
  const order = ["player-white", "player-blue", "player-green", "player-brown"];
  return order.slice(0, safeCount);
}

function cloneValue(value) {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
}

function createGameContext(activePlayerIds) {
  const playerState = players.createPlayerState({
    players: activePlayerIds.map((id) => ({ id })),
    currentPlayerId: activePlayerIds[0],
  });
  const rocketState = rockets.createRocketState();
  const planetState = planetStats.createPlanetStatsState();
  const techState = tech.createState();

  for (const player of playerState.players || []) {
    player.resources = {
      credits: 999,
      energy: 999,
      publicity: Math.max(1, Number(player.resources?.publicity || 0)),
      availableData: Math.max(0, Number(player.resources?.availableData || 0)),
      handSize: Number(player.resources?.handSize || 0),
      score: Number(player.resources?.score || 0),
      ...player.resources,
    };
    player.income = {
      credits: 0,
      energy: 0,
      handSize: 0,
      publicity: 0,
      availableData: 0,
      additionalPublicScan: 0,
      ...player.income,
    };
  }

  return {
    playerState,
    rocketState,
    planetStatsState: planetState,
    techBoardState: techState.board,
    techUiState: techState.ui,
    currentPlayerId: activePlayerIds[0],
    activePlayerIds,
    actionHistory: [],
    pendingState: null,
    turnState: {
      roundNumber: 1,
      turnNumber: 1,
      activePlayerIds: [...activePlayerIds],
      passedPlayerIds: [],
      playerOrder: [...activePlayerIds],
    },
  };
}

function findLaunchablePlanet(context, playerId) {
  const sectors = solar.SECTOR_IDS || ["A", "B", "C", "D", "E", "F", "G", "H"];
  const planets = solar.planets || [];
  const playerRockets = Object.values(context.rocketState.rockets || {}).filter(
    (rocket) => rocket?.playerId === playerId && !rocket.launched,
  );
  if (playerRockets.length <= 0) return null;

  for (const sector of sectors) {
    const planet = planets.find((entry) => entry?.sector === sector);
    if (!planet) continue;

    const probeId = playerRockets[0].id;
    const canExecute = aiActions.launch.canExecute(context, playerId, {
      sector,
      planetId: planet.id,
      probeId,
    });
    if (canExecute?.ok) {
      return {
        sector,
        planetId: planet.id,
        probeId,
      };
    }
  }

  return null;
}

function pickRandomProbeInSpace(context, playerId, rng) {
  const candidates = Object.values(context.rocketState.rockets || {}).filter(
    (rocket) => rocket?.playerId === playerId && rocket?.launched,
  );
  return rng.pick(candidates) || null;
}

function findOrbitTarget(context, playerId, rng) {
  const sectors = solar.SECTOR_IDS || ["A", "B", "C", "D", "E", "F", "G", "H"];
  const probe = pickRandomProbeInSpace(context, playerId, rng);
  if (!probe) return null;

  for (const sector of sectors) {
    const canExecute = aiActions.orbit.canExecute(context, playerId, {
      sector,
      probeId: probe.id,
    });
    if (canExecute?.ok) {
      return {
        sector,
        probeId: probe.id,
      };
    }
  }
  return null;
}

function findLandTarget(context, playerId, rng) {
  const probe = pickRandomProbeInSpace(context, playerId, rng);
  if (!probe) return null;
  const planets = solar.planets || [];

  for (const planet of planets) {
    const canExecute = aiActions.land.canExecute(context, playerId, {
      planetId: planet?.id,
      probeId: probe.id,
    });
    if (canExecute?.ok) {
      return {
        planetId: planet.id,
        probeId: probe.id,
      };
    }
  }

  return null;
}

function findResearchTarget(context, playerId) {
  const board = context.techState?.board;
  if (!board || !Array.isArray(board.tiles)) return null;
  for (const tile of board.tiles) {
    const candidate = {
      tileId: tile.tileId,
      slotId: tile.slotId,
      row: "bottom",
      column: 0,
      side: "left",
    };
    const canExecute = aiActions.researchTech.canExecute(context, playerId, candidate);
    if (canExecute?.ok) return candidate;
  }
  return null;
}

function buildCandidate(actionId, params) {
  return {
    id: actionId,
    label: actionId,
    kind: "main",
    score: 0,
    params: params || null,
  };
}

function executeActionCandidate(context, playerId, actionId, params) {
  if (context?.playerState) {
    context.playerState.currentPlayerId = playerId;
  }

  if (actionId === "pass") {
    return {
      ok: true,
      actionLog: {
        id: "pass",
        kind: "main",
        label: "Pass",
        params: null,
        summary: "pass",
      },
      effects: [],
    };
  }

  const action = aiActions[actionId];
  if (!action || typeof action.canExecute !== "function" || typeof action.execute !== "function") {
    return { ok: false, reason: `unsupported action '${actionId}'` };
  }

  const canExecute = action.canExecute(context, params || {});
  if (!canExecute?.ok) {
    return { ok: false, reason: canExecute?.reason || "cannot execute" };
  }

  return action.execute(context, params || {});
}

function buildTurnLog({
  gameSeed,
  stepIndex,
  turnNumber,
  roundNumber,
  playerId,
  actionId,
  actionKind,
  candidates,
  params,
}) {
  return {
    id: `${gameSeed}:step:${stepIndex}`,
    type: "turn-action",
    roundNumber,
    turnNumber,
    playerId,
    playerLabel: playerId,
    details: {
      action: {
        id: actionId,
        kind: actionKind,
      },
      params: params || null,
      candidates: candidates || [],
    },
  };
}

function attachContextHelpers(context = {}, activePlayerIds = []) {
  return {
    ...context,
    getEarthSectorCoordinate() {
      return { x: 0, y: 1 };
    },
    getPlanetLocations() {
      return solar.collectPlanetLocations?.({ rotation: 0, aomomoActive: true }) || [];
    },
    ensurePlayerTechState(player) {
      if (!player) return;
      if (!player.techState) {
        player.techState = players.createDefaultPlayerTechState();
      }
    },
    activePlayerIds: Array.isArray(activePlayerIds) ? [...activePlayerIds] : [],
  };
}

function chooseActionWithMcts(options) {
  const {
    context,
    playerId,
    gameSeed,
    turnNumber,
    stepIndex,
    rng,
    simulations,
    maxDepth,
    cpuct,
    rolloutDepth,
  } = options;

  const activePlayerIds = Array.isArray(context?.activePlayerIds) ? context.activePlayerIds : [];
  const runtimeContext = attachContextHelpers(context, activePlayerIds);

  const legal = [];
  const launchCheck = aiActions.launch?.canExecute?.(runtimeContext, {}) || { ok: false };
  const orbitCheck = aiActions.orbit?.canExecute?.(runtimeContext, {}) || { ok: false };
  const landCheck = aiActions.land?.canExecute?.(runtimeContext, {}) || { ok: false };
  const researchCheck = aiActions.researchTech?.canExecute?.(runtimeContext, {}) || { ok: false };

  if (launchCheck.ok) legal.push(buildCandidate("launch", null));
  if (orbitCheck.ok) legal.push(buildCandidate("orbit", null));
  if (landCheck.ok) legal.push(buildCandidate("land", null));
  if (researchCheck.ok) legal.push(buildCandidate("researchTech", null));
  legal.push(buildCandidate("pass", null));

  const stepSeed = `${gameSeed}:turn:${turnNumber}:step:${stepIndex}`;

  let mctsResult = null;
  if (typeof selfPlay?.runMctsForAction === "function") {
    mctsResult = selfPlay.runMctsForAction({
      seed: stepSeed,
      state: {
        playerId,
        legal,
        context: cloneValue(context),
        activePlayerIds,
      },
      simulations,
      maxDepth,
      cpuct,
      rolloutDepth,
      getCurrentPlayerId(state) {
        return state.playerId;
      },
      getLegalActions(state, currentPlayerId) {
        if (currentPlayerId !== state.playerId) return [];
        return state.legal;
      },
      applyAction(state, action) {
        const next = cloneValue(state);
        const actionContext = attachContextHelpers(next.context, next.activePlayerIds);
        const result = executeActionCandidate(actionContext, next.playerId, action.id, action.params);
        if (!result?.ok) {
          next.terminal = true;
          next.error = result?.reason || "execute failed";
          return next;
        }
        next.context = actionContext;
        next.terminal = action.id === "pass";
        return next;
      },
      evaluateState(state) {
        const me = (state.context.playerState?.players || []).find((player) => player.id === state.playerId) || null;
        const score = Number(me?.resources?.score || 0) + Number(me?.resources?.credits || 0) * 0.01;
        return { value: score / 100 };
      },
      isTerminal(state) {
        return Boolean(state.terminal);
      },
      rollout(state, rngSource) {
        const actions = state.legal || [];
        if (actions.length <= 0) return 0;
        const action = rngSource.pick(actions);
        if (!action) return 0;
        if (action.id === "pass") return 0;
        return 0.05;
      },
    });
  } else {
    const planner = mcts.createMctsPlanner({
      seed: stepSeed,
      simulations,
      maxDepth,
      cpuct,
      rolloutDepth,
    });
    const initialState = {
      playerId,
      legal,
      context: cloneValue(context),
      activePlayerIds,
      terminal: false,
    };
    mctsResult = planner.runSearch(initialState, {
      getCurrentPlayerId(state) {
        return state.playerId;
      },
      getLegalActions(state, currentPlayerId) {
        if (currentPlayerId !== state.playerId) return [];
        return state.legal;
      },
      applyAction(state, action) {
        const next = cloneValue(state);
        const actionContext = attachContextHelpers(next.context, next.activePlayerIds);
        const result = executeActionCandidate(actionContext, next.playerId, action.id, action.params);
        if (!result?.ok) {
          next.terminal = true;
          return next;
        }
        next.context = actionContext;
        next.terminal = action.id === "pass";
        return next;
      },
      evaluateState(state) {
        const me = (state.context.playerState?.players || []).find((player) => player.id === state.playerId) || null;
        const score = Number(me?.resources?.score || 0) + Number(me?.resources?.credits || 0) * 0.01;
        return { value: score / 100 };
      },
      isTerminal(state) {
        return Boolean(state.terminal);
      },
    }, {
      seed: stepSeed,
      simulations,
      maxDepth,
      cpuct,
      rootPlayerId: playerId,
    });
  }

  const selectedActionId = mctsResult?.selectedAction?.id || mctsResult?.bestAction?.id || null;
  const chosen = legal.find((candidate) => candidate.id === selectedActionId) || legal[0] || buildCandidate("pass", null);
  return {
    actionId: chosen.id,
    actionKind: chosen.kind || "main",
    params: chosen.params || null,
    candidates: legal,
    mctsResult,
  };
}

function runSingleGame(options) {
  const {
    seed,
    gameIndex,
    activePlayerIds,
    maxSteps,
    simulations,
    maxDepth,
    cpuct,
    rolloutDepth,
    stopOnBlocked,
  } = options;

  const gameSeed = `${seed}:game:${gameIndex + 1}`;
  const rng = createSimpleRng(gameSeed);
  const context = createGameContext(activePlayerIds);
  const runtimeContext = attachContextHelpers(context, activePlayerIds);
  const logs = [];

  let ok = true;
  let blocked = false;
  let gameEnded = false;
  let stepIndex = 0;
  let turnNumber = 1;
  let roundNumber = 1;

  const passTracker = new Map(activePlayerIds.map((playerId) => [playerId, false]));

  while (stepIndex < maxSteps) {
    const playerId = activePlayerIds[(turnNumber - 1) % activePlayerIds.length];
    stepIndex += 1;

    const choice = chooseActionWithMcts({
      context,
      playerId,
      gameSeed,
      turnNumber,
      stepIndex,
      rng,
      simulations,
      maxDepth,
      cpuct,
      rolloutDepth,
    });

    const execution = executeActionCandidate(runtimeContext, playerId, choice.actionId, choice.params);
    if (!execution?.ok) {
      ok = false;
      blocked = true;
      logs.push({
        id: `${gameSeed}:step:${stepIndex}:error`,
        type: "turn-error",
        roundNumber,
        turnNumber,
        playerId,
        details: {
          action: { id: choice.actionId, kind: choice.actionKind || "main" },
          reason: execution?.reason || "execute failed",
        },
      });
      if (stopOnBlocked) break;
    } else {
      logs.push(
        buildTurnLog({
          gameSeed,
          stepIndex,
          turnNumber,
          roundNumber,
          playerId,
          actionId: choice.actionId,
          actionKind: choice.actionKind || "main",
          candidates: choice.candidates,
          params: choice.params,
        }),
      );
    }

    if (choice.actionId === "pass") {
      passTracker.set(playerId, true);
      if (!runtimeContext.turnState.passedPlayerIds.includes(playerId)) {
        runtimeContext.turnState.passedPlayerIds.push(playerId);
      }
    } else if (runtimeContext.turnState.passedPlayerIds.includes(playerId)) {
      runtimeContext.turnState.passedPlayerIds = runtimeContext.turnState.passedPlayerIds.filter((id) => id !== playerId);
    }

    const everyonePassed = activePlayerIds.every((id) => passTracker.get(id));
    if (everyonePassed) {
      gameEnded = true;
      break;
    }

    if (turnNumber % activePlayerIds.length === 0) {
      roundNumber += 1;
    }

    runtimeContext.turnState.roundNumber = roundNumber;
    runtimeContext.turnState.turnNumber = turnNumber + 1;

    turnNumber += 1;
    runtimeContext.playerState.currentPlayerId = activePlayerIds[(turnNumber - 1) % activePlayerIds.length];
  }

  const playerResults = activePlayerIds
    .map((playerId) => {
      const player = (runtimeContext.playerState.players || []).find((item) => item.id === playerId) || {};
      const resources = player.resources || {};
      const finalScore =
        Number(resources.score || 0) +
        Number(resources.credits || 0) * 0.05 +
        Number(resources.energy || 0) * 0.03 +
        Number(resources.availableData || 0) * 0.08 +
        Number(resources.publicity || 0) * 0.04;
      return {
        playerId,
        finalScore,
      };
    })
    .sort((a, b) => b.finalScore - a.finalScore)
    .map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));

  return {
    seed: gameSeed,
    summary: {
      ok,
      blocked,
      gameEnded,
      steps: stepIndex,
      turns: turnNumber,
      round: roundNumber,
    },
    logs,
    tailLogs: logs.slice(-300),
    playerResults,
  };
}

function buildDatasetFromGames(games, seed) {
  const samples = [];
  const episodes = [];

  for (let gameIndex = 0; gameIndex < games.length; gameIndex += 1) {
    const game = games[gameIndex];
    const allLogs = Array.isArray(game.logs) ? game.logs : [];
    const gamePlayerResults = Array.isArray(game.playerResults) ? game.playerResults : [];

    let stepIndex = 0;
    for (const log of allLogs) {
      if (log?.type !== "turn-action") continue;
      stepIndex += 1;
      const playerResult = gamePlayerResults.find((entry) => entry.playerId === log.playerId) || null;
      const actionId = log?.details?.action?.id || null;
      const actionKind = log?.details?.action?.kind || null;
      const candidates = Array.isArray(log?.details?.candidates) ? log.details.candidates : null;

      samples.push({
        sampleId: `${seed}:g${gameIndex + 1}:s${stepIndex}`,
        seed,
        stepIndex,
        logType: "turn-action",
        roundNumber: Number(log.roundNumber || 0),
        turnNumber: Number(log.turnNumber || 0),
        playerId: log.playerId || null,
        playerLabel: log.playerLabel || null,
        policyTarget: {
          id: actionId,
          kind: actionKind,
        },
        candidates,
        details: log.details || null,
        finalScore: Number(playerResult?.finalScore || 0),
        finalRank: Number(playerResult?.rank || 0),
        gameEnded: Boolean(game?.summary?.gameEnded),
        blocked: Boolean(game?.summary?.blocked),
        ok: game?.summary?.ok !== false,
      });
    }

    episodes.push({
      seed: game.seed || `${seed}:${gameIndex + 1}`,
      sampleCount: stepIndex,
      blocked: Boolean(game?.summary?.blocked),
      gameEnded: Boolean(game?.summary?.gameEnded),
      ok: game?.summary?.ok !== false,
      steps: Number(game?.summary?.steps || 0),
    });
  }

  return {
    version: 1,
    seed,
    generatedAt: new Date().toISOString(),
    sampleCount: samples.length,
    samples,
    episodes,
  };
}

function runCoreRulesSelfPlay(options) {
  const activePlayerIds = toActivePlayerIds(options.activePlayerCount);
  const games = [];

  for (let gameIndex = 0; gameIndex < options.games; gameIndex += 1) {
    games.push(
      runSingleGame({
        seed: options.seed,
        gameIndex,
        activePlayerIds,
        maxSteps: options.maxSteps,
        simulations: options.simulations,
        maxDepth: options.maxDepth,
        cpuct: options.cpuct,
        rolloutDepth: options.rolloutDepth,
        stopOnBlocked: options.stopOnBlocked,
      }),
    );
  }

  const dataset = buildDatasetFromGames(games, options.seed);
  return {
    mode: "core-rules",
    games,
    dataset,
    summary: {
      ok: games.every((entry) => entry.summary?.ok !== false),
      gamesRequested: options.games,
      gamesRun: games.length,
      blockedGames: games.filter((entry) => entry.summary?.blocked).length,
      sampleCount: dataset.sampleCount,
    },
  };
}

module.exports = {
  runCoreRulesSelfPlay,
};
