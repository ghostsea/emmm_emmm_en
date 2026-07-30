"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const appPath = path.join(__dirname, "..", "app.js");
const appSource = fs.readFileSync(appPath, "utf8");
const finalScoring = require("../game/final-scoring");
const actionHistoryModule = require("../game/history/action-history");
const historyCommands = require("../game/history/commands");
const abilityChain = require("../game/abilities/chain");
const cardEffects = require("../game/cards/effects");

function extractNamedFunctionSource(functionName) {
  const start = appSource.indexOf(`function ${functionName}(`);
  assert.ok(start >= 0, `app.js should define ${functionName}`);
  const bodyStart = appSource.indexOf(") {", start) + 2;
  assert.ok(bodyStart >= 2, `could not find body for ${functionName}`);
  let depth = 0;
  for (let index = bodyStart; index < appSource.length; index += 1) {
    if (appSource[index] === "{") depth += 1;
    if (appSource[index] !== "}") continue;
    depth -= 1;
    if (depth === 0) return appSource.slice(start, index + 1);
  }
  assert.fail(`could not extract ${functionName} from app.js`);
}

function loadNamedFunction(functionName, dependencies = {}) {
  const names = Object.keys(dependencies);
  return Function(
    ...names,
    `"use strict"; return (${extractNamedFunctionSource(functionName)});`,
  )(...names.map((name) => dependencies[name]));
}

{
  const taskOwner = { id: "player-green", color: "green" };
  const turnPlayer = { id: "player-brown", color: "brown" };
  const flow = {
    effects: [{ id: "task-reward", type: "gain_resources", options: {} }],
  };
  const startCardEffectFlow = loadNamedFunction("startCardEffectFlow", {
    cardEffects: { consolidateCardMoveEffects: (effects) => effects },
    abilities: { chain: { startAbilityChain: () => flow } },
    initializeEffectFlowUndoContext: () => {},
    HISTORY_SOURCE_MAIN: "main",
    HISTORY_SOURCE_QUICK: "quick",
    resolvePlayerReference: () => null,
    getCurrentPlayer: () => turnPlayer,
    assignEffectFlowOwner: (targetFlow, playerId) => {
      targetFlow.defaultPlayerId = playerId;
      targetFlow.playerId = playerId;
      for (const effect of targetFlow.effects) effect.playerId = playerId;
    },
    pendingActionEffectFlow: null,
    pendingFutureSpanPlayBeforePlayer: null,
    pendingActionExecuted: false,
    actionHistory: { hasSession: () => false },
    quickActionHistory: { hasSession: () => false, beginSession: () => {} },
    clearCompletedEffectFlowForUndo: () => {},
    els: { appWrap: { classList: { toggle: () => {} } } },
    renderReservedCardsFromTaskState: () => {},
    rocketState: { statusNote: "" },
    activateNextActionEffect: () => {},
  });

  assert.equal(
    startCardEffectFlow(
      "card-task-rewards",
      "卡牌任务奖励",
      flow.effects,
      { actionType: "cardTask", player: taskOwner, activate: false },
    ),
    true,
  );
  assert.equal(flow.playerId, taskOwner.id);
  assert.equal(flow.defaultPlayerId, taskOwner.id);
  assert.equal(
    flow.effects[0].playerId,
    taskOwner.id,
    "a task completed outside its owner's turn must still award every effect to the task owner",
  );
}

{
  const HISTORY_SOURCE_QUICK = "quick";
  const getEffectFlowHistoryState = loadNamedFunction("getEffectFlowHistoryState");
  const canCancelPendingEffectFlowFromStart = loadNamedFunction(
    "canCancelPendingEffectFlowFromStart",
    { HISTORY_SOURCE_QUICK, getEffectFlowHistoryState },
  );
  const undoPendingEffectFlowStartCommands = loadNamedFunction(
    "undoPendingEffectFlowStartCommands",
  );
  let industryMarkRound = 4;
  const flow = {
    historyFlowId: "industry-pirates-raid-launch-flow-test",
    flowStartUndoCommands: [{
      undo() {
        industryMarkRound = 0;
      },
    }],
    preHistoryCommands: [],
    preHistoryCommandsApplied: false,
  };
  const previousQuickStep = {
    id: "previous-quick-step",
    effectFlowId: "another-flow",
    undoable: true,
  };
  const history = {
    listSteps: () => [previousQuickStep],
    hasUndoableStep: () => true,
  };

  assert.deepEqual(
    getEffectFlowHistoryState(flow, history),
    { hasSteps: false, hasIrreversibleBarrier: false },
    "history steps from an earlier quick action must not count as part of the active industry flow",
  );
  assert.equal(
    canCancelPendingEffectFlowFromStart(flow, history, HISTORY_SOURCE_QUICK, false),
    true,
    "an industry flow at its first unresolved node should be cancellable without undoing an earlier quick action",
  );

  history.listSteps = () => [{
    id: "pirates-effect-step",
    effectFlowId: flow.historyFlowId,
    undoable: true,
  }];
  assert.equal(
    canCancelPendingEffectFlowFromStart(flow, history, HISTORY_SOURCE_QUICK, false),
    false,
    "a completed industry effect step must be undone before the company marker can be released",
  );

  history.listSteps = () => [{
    id: "pirates-hidden-step",
    effectFlowId: flow.historyFlowId,
    undoable: false,
    irreversibleReason: "翻出新牌",
  }];
  assert.equal(
    canCancelPendingEffectFlowFromStart(flow, history, HISTORY_SOURCE_QUICK, false),
    false,
    "an irreversible step inside the industry flow must keep the company marker occupied",
  );

  history.listSteps = () => [previousQuickStep];
  assert.equal(undoPendingEffectFlowStartCommands(flow), 1);
  assert.equal(industryMarkRound, 0);
  assert.deepEqual(flow.flowStartUndoCommands, []);

  for (const functionName of [
    "startIndustryStratusEffectFlow",
    "startIndustryHuanyuMoveEffectFlow",
    "startIndustryFundamentalismExchangeFlow",
    "startIndustryPiratesRaidLaunchFlow",
  ]) {
    const source = extractNamedFunctionSource(functionName);
    assert.match(
      source,
      /flowStartUndoCommands/,
      `${functionName} should retain the 1x marker until the whole effect flow is cancelled`,
    );
    assert.doesNotMatch(
      source,
      /preHistoryCommands/,
      `${functionName} must not release the 1x marker when only its first effect node is undone`,
    );
  }
}

{
  const player = { id: "player-white", color: "white" };
  const playerState = { players: [player] };
  const alienGameState = {
    chong: {
      fossilsById: {
        fossil_01: { fossilId: "fossil_01", status: "available", planetId: "jupiter" },
      },
    },
  };
  const rocketState = { rockets: [], nextRocketId: 7, activeRocketId: null, statusNote: "" };
  const beforeAlienState = structuredClone(alienGameState);
  const beforePlayerState = structuredClone(playerState);
  const beforeRocketState = structuredClone(rocketState);
  const recordedCommands = [];
  const pendingChongFossilChoice = {
    mode: "pickup",
    playerId: player.id,
    fromEffectFlow: true,
    effectLabel: "虫族：拾取化石",
    task: { destinationPlanetId: "earth" },
    card: { id: "chong-card-0", label: "虫族卡" },
    beforeAlienState,
    beforePlayerState,
    beforeRocketState,
  };
  const restoreMutableObject = (target, snapshot) => {
    for (const key of Object.keys(target)) delete target[key];
    Object.assign(target, structuredClone(snapshot));
  };
  const chong = {
    pickUpFossil(state, fossilId) {
      const fossil = state.chong.fossilsById[fossilId];
      fossil.status = "transported";
      return { ok: true, fossil, message: `拾取 ${fossilId}` };
    },
  };
  const handleChongFossilChoice = loadNamedFunction("handleChongFossilChoice", {
    pendingChongFossilChoice,
    failChongTaskCompletion: (message) => ({ ok: false, message }),
    getPlayerById: () => player,
    getCurrentPlayer: () => player,
    closeChongFossilChoiceDialog: () => {},
    finishChongFossilEffect: (message, payload) => ({ ok: true, message, payload }),
    rocketState,
    renderStateReadout: () => {},
    effectStepActive: false,
    beginEffectHistoryStep: () => {},
    recordHistoryCommand: (command) => recordedCommands.push(command),
    historyCommands,
    alienGameState,
    playerState,
    chong,
    cards: { getCardLabel: () => "虫族卡" },
    restoreMutableObject,
    createChongTransportTokenForFossil: (fossil) => {
      const rocket = { id: 7, kind: "chong-fossil", fossilId: fossil.fossilId };
      rocketState.rockets.push(rocket);
      rocketState.nextRocketId = 8;
      return { ok: true, rocket, message: "生成搬运化石" };
    },
    completeChongTraceTaskWithFossil: () => assert.fail("pickup should not complete a trace task"),
    applyChongFossilRewardToPlayer: () => assert.fail("pickup should not resolve a fossil reward"),
    openChongPickCardFollowUp: () => assert.fail("pickup should not open a card reward"),
    renderPlayerStats: () => {},
  });

  const result = handleChongFossilChoice("fossil_01");
  assert.equal(result.ok, true);
  assert.equal(alienGameState.chong.fossilsById.fossil_01.status, "transported");
  assert.equal(rocketState.rockets.length, 1);
  for (const command of [...recordedCommands].reverse()) command.undo();
  assert.deepEqual(
    alienGameState,
    beforeAlienState,
    "undoing a Chong fossil pickup should restore the fossil to Jupiter or Saturn",
  );
  assert.deepEqual(
    rocketState,
    beforeRocketState,
    "undoing a Chong fossil pickup should remove the generated transport token",
  );
}

{
  const actionHistory = actionHistoryModule.createActionHistory();
  const quickActionHistory = actionHistoryModule.createActionHistory();
  const historyStepOrder = [];
  const HISTORY_SOURCE_MAIN = "main";
  const HISTORY_SOURCE_QUICK = "quick";
  let pendingActionIrreversibleReason = null;

  quickActionHistory.beginSession("quick", "快速行动");
  quickActionHistory.beginStep({
    source: HISTORY_SOURCE_QUICK,
    type: "place-data",
    label: "放置数据",
  });
  const placeDataStep = quickActionHistory.endStep();
  historyStepOrder.push({ source: HISTORY_SOURCE_QUICK, stepId: placeDataStep.id });

  actionHistory.beginSession("analyze", "分析数据");
  actionHistory.beginStep({
    source: HISTORY_SOURCE_MAIN,
    type: "action_start",
    label: "分析数据",
  });
  const analyzeStep = actionHistory.endStep();
  historyStepOrder.push({ source: HISTORY_SOURCE_MAIN, stepId: analyzeStep.id });
  actionHistory.beginStep({
    source: HISTORY_SOURCE_MAIN,
    type: "irreversible",
    label: "获取一张卡牌",
    undoable: false,
    irreversibleCode: "hidden_card_reveal",
    irreversibleReason: "公共牌补牌翻出新牌",
  });
  const cardBarrier = actionHistory.endStep();
  pendingActionIrreversibleReason = cardBarrier.irreversibleReason;
  historyStepOrder.push({ source: HISTORY_SOURCE_MAIN, stepId: cardBarrier.id });

  const getHistoryForSource = (source) => (
    source === HISTORY_SOURCE_QUICK ? quickActionHistory : actionHistory
  );
  const hasCurrentMainActionIrreversibleBarrier = () => (
    actionHistory.hasIrreversibleBarrier()
  );
  const getLatestHistoryBoundary = loadNamedFunction("getLatestHistoryBoundary", {
    historyStepOrder,
    HISTORY_SOURCE_QUICK,
    HISTORY_SOURCE_MAIN,
    quickActionHistory,
    actionHistory,
    hasCurrentMainActionIrreversibleBarrier,
    pendingActionIrreversibleReason,
  });
  const canUndoPendingAction = loadNamedFunction("canUndoPendingAction", {
    getLatestHistoryBoundary,
    hasCurrentMainActionIrreversibleBarrier,
    pendingActionExecuted: true,
    isActionEffectFlowActive: () => false,
  });

  assert.deepEqual(
    getLatestHistoryBoundary(),
    {
      source: HISTORY_SOURCE_MAIN,
      step: actionHistory.listSteps().find((step) => step.id === cardBarrier.id),
      undoable: false,
      irreversibleReason: "公共牌补牌翻出新牌",
    },
    "a main-action hidden-information barrier must stay newer than an earlier place-data quick action",
  );
  assert.equal(
    canUndoPendingAction(),
    false,
    "the undo button must be disabled instead of reaching across the barrier to undo placed data",
  );

  const boundaryWithoutHistoryStepOrder = [
    { source: HISTORY_SOURCE_QUICK, stepId: placeDataStep.id },
  ];
  const rememberIrreversibleHistoryBoundary = loadNamedFunction(
    "rememberIrreversibleHistoryBoundary",
    {
      historyStepOrder: boundaryWithoutHistoryStepOrder,
      getHistoryForSource,
    },
  );
  rememberIrreversibleHistoryBoundary(
    HISTORY_SOURCE_MAIN,
    "外星人牌获取翻开新牌",
    "hidden_alien_card_reveal",
  );
  const getSyntheticHistoryBoundary = loadNamedFunction("getLatestHistoryBoundary", {
    historyStepOrder: boundaryWithoutHistoryStepOrder,
    HISTORY_SOURCE_QUICK,
    HISTORY_SOURCE_MAIN,
    quickActionHistory,
    actionHistory,
    hasCurrentMainActionIrreversibleBarrier,
    pendingActionIrreversibleReason,
  });
  assert.deepEqual(
    getSyntheticHistoryBoundary(),
    {
      source: HISTORY_SOURCE_MAIN,
      step: null,
      undoable: false,
      irreversibleReason: "外星人牌获取翻开新牌",
    },
    "direct irreversible markers must also block earlier quick actions before a history step is finalized",
  );

  actionHistory.beginStep({
    source: HISTORY_SOURCE_MAIN,
    type: "effect",
    label: "屏障后获得 1 宣传",
  });
  const afterBarrierStep = actionHistory.endStep();
  historyStepOrder.push({ source: HISTORY_SOURCE_MAIN, stepId: afterBarrierStep.id });
  assert.equal(
    getLatestHistoryBoundary().step.id,
    afterBarrierStep.id,
    "a deterministic step after the barrier should remain independently undoable",
  );
  assert.equal(canUndoPendingAction(), true);
}

{
  const playerState = {
    players: [
      { id: "player-white", color: "white" },
      { id: "player-blue", color: "blue" },
      { id: "player-green", color: "green" },
      { id: "player-brown", color: "brown" },
    ],
  };
  const turnState = {
    activePlayerCount: 3,
    activePlayerIds: ["player-white", "player-blue", "player-green"],
  };
  let appliedOrder = null;
  const randomizePlayerTurnOrder = loadNamedFunction("randomizePlayerTurnOrder", {
    playerState,
    turnState,
    DEFAULT_ACTIVE_PLAYER_COUNT: 4,
    DEFAULT_INITIAL_PLAYER_COLOR: "white",
    shufflePlayerIds: (playerIds) => [...playerIds].reverse(),
    setTurnStatePlayerOrder: (playerIds, options) => {
      appliedOrder = { playerIds, options };
    },
  });
  randomizePlayerTurnOrder();
  assert.deepEqual(
    appliedOrder,
    {
      playerIds: ["player-green", "player-brown", "player-white", "player-blue"],
      options: { activePlayerCount: 3 },
    },
    "opening order should shuffle the active roster instead of pinning the human player to first",
  );
}

{
  const turnState = { roundNumber: 1 };
  const industry = {
    getAiRoundStartExtra(roundNumber) {
      if (roundNumber === 3) return { resources: { energy: 1 }, blindDraw: 0 };
      if (roundNumber === 4) return { resources: { credits: 1 }, blindDraw: 1 };
      return { resources: {}, blindDraw: 0 };
    },
  };
  const players = {
    gainResources(player, gain) {
      for (const [key, value] of Object.entries(gain || {})) {
        player.resources[key] = (Number(player.resources[key]) || 0) + Number(value);
      }
    },
    formatResourceCost(gain) {
      return Object.entries(gain || {})
        .map(([key, value]) => `${value}${key === "energy" ? "能量" : "信用点"}`)
        .join(" + ");
    },
  };
  const hasAiRoundStartExtraPending = loadNamedFunction("hasAiRoundStartExtraPending", {
    turnState,
    isAiAutoBattlePlayer: (playerId) => playerId === "player-blue",
    industry,
  });
  const applyAiRoundStartExtraForPlayer = loadNamedFunction("applyAiRoundStartExtraForPlayer", {
    turnState,
    hasAiRoundStartExtraPending,
    industry,
    players,
    blindDrawCardForPlayer: () => ({ ok: true, card: { id: "drawn-card" } }),
  });
  const computer = {
    id: "player-blue",
    colorLabel: "蓝色",
    resources: { credits: 0, energy: 0 },
    initialSelection: { industry: { label: "任意公司" } },
  };
  const human = {
    id: "player-white",
    resources: { credits: 0, energy: 0 },
  };

  assert.equal(applyAiRoundStartExtraForPlayer(computer, 1), null);
  assert.equal(applyAiRoundStartExtraForPlayer(human, 3), null);
  const round3 = applyAiRoundStartExtraForPlayer(computer, 3);
  assert.equal(round3.ok, true);
  assert.equal(computer.resources.energy, 1);
  assert.equal(computer.resources.credits, 0);
  assert.equal(round3.drawnCards.length, 0);
  assert.equal(applyAiRoundStartExtraForPlayer(computer, 3), null);

  const round4 = applyAiRoundStartExtraForPlayer(computer, 4);
  assert.equal(round4.ok, true);
  assert.equal(computer.resources.energy, 1);
  assert.equal(computer.resources.credits, 1);
  assert.equal(round4.drawnCards.length, 1);
}

{
  const applyCardMovementModifiers = loadNamedFunction("applyCardMovementModifiers");
  assert.deepEqual(
    applyCardMovementModifiers({ movementPoints: 1 }, []),
    { movementPoints: 1 },
  );
  assert.deepEqual(
    applyCardMovementModifiers(
      { movementPoints: 1, ignoreAsteroidRestriction: false },
      [{ movementModifiers: { ignoreAsteroidRestriction: true } }],
    ),
    { movementPoints: 1, ignoreAsteroidRestriction: true },
    "an active turn movement modifier should override the local asteroid-exit restriction",
  );
}

{
  const eventMatchesCardBonus = loadNamedFunction("eventMatchesCardBonus", {
    getNebulaColorForCardEvent: () => null,
  });
  const sameRingBonus = { eventType: "move", sameRingOnly: true };
  assert.equal(
    eventMatchesCardBonus({ type: "move", sameRing: false }, sameRingBonus),
    false,
    "b_125 should not trigger on radial movement",
  );
  assert.equal(
    eventMatchesCardBonus({ type: "move", sameRing: true }, sameRingBonus),
    true,
    "b_125 should trigger on same-ring movement",
  );
}

{
  const exchangeEffect = {
    options: {
      costPerExchange: 1,
      movementPerExchange: 2,
    },
  };
  const getExchangeOptions = loadNamedFunction("getAomomoFossilMoveLandExchangeOptions");
  const resolveExchange = loadNamedFunction("resolveAomomoFossilMoveLandExchange");
  const options = getExchangeOptions(exchangeEffect, 3);
  assert.deepEqual(options, {
    costPerExchange: 1,
    movementPerExchange: 2,
    maxCount: 3,
  });
  assert.deepEqual(resolveExchange(options, 0), {
    ok: true,
    count: 0,
    totalCost: 0,
    movementPoints: 0,
  });
  assert.deepEqual(resolveExchange(options, 2), {
    ok: true,
    count: 2,
    totalCost: 2,
    movementPoints: 4,
  });
  assert.equal(resolveExchange(options, 4).ok, false);
}

{
  const currentPlayer = { id: "player-blue", color: "blue" };
  const winningPlayer = { id: "player-green", color: "green" };
  const data = {
    NEBULA_IDS: ["sector-other", "sector-mine"],
    isSectorReadyToSettle: () => true,
    orderSectorIdsByPlayerWinPriority(_state, sectorIds, player) {
      assert.deepEqual(sectorIds, ["sector-other", "sector-mine"]);
      assert.equal(player, currentPlayer);
      return ["sector-mine", "sector-other"];
    },
    getNebulaLabel: (sectorId) => sectorId,
  };
  const buildReadySectorFinishEffects = loadNamedFunction("buildReadySectorFinishEffects", {
    data,
    nebulaDataState: {},
    resolvePlayerReference: (reference) => {
      if (reference?.playerId === currentPlayer.id || reference?.id === currentPlayer.id) return currentPlayer;
      return null;
    },
    getPlayerById: (playerId) => playerId === currentPlayer.id ? currentPlayer : null,
    getPlayerByColor: (color) => color === currentPlayer.color ? currentPlayer : null,
    getCurrentPlayer: () => currentPlayer,
    getSectorFinishWinnerTarget: () => ({
      playerId: winningPlayer.id,
      playerColor: winningPlayer.color,
    }),
    scanEffects: { EFFECT_TYPES: { SECTOR_FINISH_SCAN: "sector_finish_scan" } },
    getSectorFinishIcon: () => "scan",
  });
  const sectorEffects = buildReadySectorFinishEffects();
  assert.deepEqual(
    sectorEffects.map((effect) => effect.options.sectorId),
    ["sector-mine", "sector-other"],
    "app settlement nodes should preserve current-player-winner priority",
  );
  assert.ok(
    sectorEffects.every((effect) => effect.playerId === currentPlayer.id),
    "sector completion nodes should stay owned by the player whose effect flow is resolving",
  );
  assert.ok(
    sectorEffects.every((effect) => effect.options.winnerPlayerId === winningPlayer.id),
    "sector winner metadata should remain available without taking over the completion node",
  );
  assert.ok(
    sectorEffects.every((effect) => !effect.options.targetPlayerId),
    "sector completion nodes should reserve target ownership for the inserted winner reward nodes",
  );
}

assert.doesNotMatch(
  extractNamedFunctionSource("renderPlayerStats"),
  /syncFinalScorePendingMarks/,
  "score rendering must not create final-score marks before the player ends the turn",
);
assert.doesNotMatch(
  extractNamedFunctionSource("runAiFinalScoreMarkDecision"),
  /syncFinalScorePendingMarks/,
  "AI polling must not create final-score marks before it chooses to end the turn",
);
assert.match(
  extractNamedFunctionSource("endCurrentTurn"),
  /beginTurnEndFinalScoreMarking/,
  "ending a turn should enter the final-score marking gate before turn advancement",
);
assert.match(
  extractNamedFunctionSource("updateTurnActionButtons"),
  /确认标记/,
  "the turn confirmation button should become the final-score confirmation control while marking",
);
assert.doesNotMatch(
  extractNamedFunctionSource("executeSectorFinishScanEffect"),
  /setActiveEffectFlowOwner/,
  "settling a sector must not hand the active flow to the sector winner",
);
assert.match(
  extractNamedFunctionSource("openChongFossilChoiceDialog"),
  /beforeRocketState/,
  "Chong fossil selection must snapshot the solar token state before a pickup",
);
assert.match(
  extractNamedFunctionSource("handleChongFossilChoice"),
  /createRestoreRocketStateCommand/,
  "Chong fossil pickup must register solar token restoration with undo history",
);
assert.match(
  extractNamedFunctionSource("applyIndustryRoundStartBonuses"),
  /applyAiRoundStartExtraForPlayer/,
  "every computer company should receive the shared round 3/4 extra through the round-start hook",
);
for (const functionName of [
  "applyHuanyuSuperdriveRoundStartForPlayer",
  "applyCheatLabRoundStartForPlayer",
  "applyGrandStrategyRoundStartForPlayer",
]) {
  assert.match(
    extractNamedFunctionSource(functionName),
    /shouldGrantAiCompanyRoundStartResources/,
    `${functionName} should suppress its company resource reward in round one`,
  );
}

{
  const humanPlayer = { id: "player-white" };
  const actionBriefingState = {
    mainActionQueue: [
      { entryId: 1, roundNumber: 1, actionCycleNumber: 1, actionPoint: 2, playerId: "player-brown" },
      { entryId: 2, roundNumber: 1, actionCycleNumber: 2, actionPoint: 3, playerId: "player-green" },
      { entryId: 3, roundNumber: 2, actionCycleNumber: 1, actionPoint: 4, playerId: "player-brown" },
      { entryId: 4, roundNumber: 2, actionCycleNumber: 1, actionPoint: 5, playerId: "player-green" },
      { entryId: 5, roundNumber: 2, actionCycleNumber: 1, actionPoint: 6, playerId: "player-blue" },
    ],
  };
  const getActionBriefingItemsForHumanTurn = loadNamedFunction("getActionBriefingItemsForHumanTurn", {
    isHumanActionBriefingPlayer: (player) => player?.id === humanPlayer.id,
    getActionBriefingLastPointForPlayer: () => 1,
    actionBriefingState,
    turnState: { roundNumber: 2 },
  });
  assert.deepEqual(
    getActionBriefingItemsForHumanTurn(humanPlayer).map((item) => item.entryId),
    [3, 4, 5],
    "a player who passed in the previous round should only see current-round computer actions",
  );
  assert.deepEqual(
    getActionBriefingItemsForHumanTurn({ id: "player-brown" }),
    [],
    "computer turns should never open the human action briefing",
  );
}

{
  const humanPlayer = { id: "player-white" };
  const actionBriefingState = {
    mainActionQueue: [
      { entryId: 1, roundNumber: 2, actionCycleNumber: 1, actionPoint: 1, playerId: "player-brown" },
      { entryId: 2, roundNumber: 2, actionCycleNumber: 1, actionPoint: 2, playerId: humanPlayer.id },
      { entryId: 3, roundNumber: 2, actionCycleNumber: 1, actionPoint: 3, playerId: "player-green" },
      { entryId: 4, roundNumber: 2, actionCycleNumber: 1, actionPoint: 4, playerId: "player-blue" },
    ],
  };
  const getActionBriefingItemsForHumanTurn = loadNamedFunction("getActionBriefingItemsForHumanTurn", {
    isHumanActionBriefingPlayer: (player) => player?.id === humanPlayer.id,
    getActionBriefingLastPointForPlayer: () => 2,
    actionBriefingState,
    turnState: { roundNumber: 2 },
  });
  assert.deepEqual(
    getActionBriefingItemsForHumanTurn(humanPlayer).map((item) => item.entryId),
    [3, 4],
    "normal same-round briefings should still include every computer action after the player's last action",
  );
}

{
  const currentPlayer = {
    id: "player-white",
    color: "white",
    colorLabel: "白色",
    resources: { score: 70 },
  };
  const finalScoringState = finalScoring.createFinalScoringState(["a", "b", "c", "d"]);
  const turnState = { finalScoreMarkingPlayerId: null };
  const rocketState = { statusNote: "" };
  let scheduled = 0;
  const beginTurnEndFinalScoreMarking = loadNamedFunction("beginTurnEndFinalScoreMarking", {
    getCurrentPlayer: () => currentPlayer,
    syncFinalScorePendingMarks: (player) => finalScoring.syncPendingMarks(
      finalScoringState,
      [player],
      { preserveOtherPlayers: true },
    ),
    finalScoring,
    finalScoringState,
    turnState,
    rocketState,
    renderFinalScoreBoard: () => {},
    updateActionButtons: () => {},
    renderStateReadout: () => {},
    scheduleAiAutoStepIfNeeded: () => {
      scheduled += 1;
    },
  });
  const result = beginTurnEndFinalScoreMarking(currentPlayer);
  assert.equal(turnState.finalScoreMarkingPlayerId, currentPlayer.id);
  assert.deepEqual(
    result.pendingMarks.map((pending) => pending.threshold),
    [25, 50, 70],
    "one end-turn click should open every newly reached final-score threshold",
  );
  assert.equal(scheduled, 1, "the final-score gate should hand computer-owned marking back to AI");
}

{
  const b25Match = {
    card: { id: "b25-instance", cardId: "b_25.webp" },
    trigger: { id: "b25-yellow-scan-move" },
    event: { type: "signalMarked", nebulaId: "sector-3-a" },
    effect: {
      type: cardEffects.EFFECT_TYPES.CARD_MOVE,
      options: { movementPoints: 1 },
    },
  };
  const ordinaryMatch = {
    card: { id: "b2-instance", cardId: "b_2.webp" },
    trigger: { id: "b2-energy" },
    event: { type: "visitPlanet", planetId: "mars" },
    effect: { type: "gain_resources", options: { gain: { energy: 1 } } },
  };
  const isControlCenterScanTriggerMatch = loadNamedFunction("isControlCenterScanTriggerMatch");
  const shouldPromptForCardTriggerMatches = loadNamedFunction(
    "shouldPromptForCardTriggerMatches",
    { isControlCenterScanTriggerMatch },
  );

  assert.equal(shouldPromptForCardTriggerMatches([b25Match]), true);
  assert.equal(shouldPromptForCardTriggerMatches([ordinaryMatch]), false);

  const pendingType1TriggerEvents = [];
  let openedMatches = null;
  let appliedMatch = null;
  const applyType1TriggerMatches = loadNamedFunction("applyType1TriggerMatches", {
    getCurrentPlayer: () => ({ id: "player-white" }),
    enqueueType1TriggerEvents: (events) => pendingType1TriggerEvents.push(...events),
    hasActiveCardTriggerResolution: () => false,
    isCardTriggerRewardFlowBusy: () => false,
    pendingType1TriggerEvents,
    getType1TriggerMatchesForEvent: () => [b25Match],
    shouldPromptForCardTriggerMatches,
    openCardTriggerPicker: (matches) => {
      openedMatches = matches;
      return { ok: true, awaitingChoice: true };
    },
    applyCardTriggerMatch: (match) => {
      appliedMatch = match;
      return { ok: true };
    },
  });
  const result = applyType1TriggerMatches([b25Match.event]);
  assert.equal(result.awaitingChoice, true);
  assert.deepEqual(openedMatches, [b25Match]);
  assert.equal(appliedMatch, null, "a single b_25 match must wait for the player's trigger choice");
}

{
  const player = { id: "player-white", color: "white" };
  const flow = {
    chainId: "scan",
    scanRunId: "scan-run-b25",
    effects: [{
      id: "scan-purple4",
      type: "scan_action_4",
      status: "active",
      playerId: player.id,
      options: { scanRunId: "scan-run-b25" },
    }],
    currentIndex: 0,
    completed: false,
  };
  const createScanMovementPoolEffect = loadNamedFunction("createScanMovementPoolEffect", {
    cardEffects,
  });
  const normalizeInsertedActionEffect = loadNamedFunction("normalizeInsertedActionEffect", {
    assignEffectOwner: (effect, ownerId) => ({ ...effect, playerId: ownerId }),
  });
  const insertActionEffectsAtEnd = loadNamedFunction("insertActionEffectsAtEnd", {
    pendingActionEffectFlow: flow,
    getCurrentActionEffect: () => flow.effects[flow.currentIndex] || null,
    getEffectOwnerPlayer: () => player,
    getCurrentPlayer: () => player,
    normalizeInsertedActionEffect,
    abilities: { chain: abilityChain },
    syncMergedCardMoveEffect: () => {},
  });
  const b25Move = createScanMovementPoolEffect({
    id: "b25-yellow-scan-move-effect",
    type: cardEffects.EFFECT_TYPES.CARD_MOVE,
    label: "扫描黄色扇区：1免费移动",
    icon: "movement",
    options: { movementPoints: 1 },
  }, flow);
  const purple4Move = createScanMovementPoolEffect({
    id: "scan-purple4-move",
    type: cardEffects.EFFECT_TYPES.CARD_MOVE,
    label: "发射/移动：1移动",
    icon: "movement",
    options: { movementPoints: 1 },
  }, flow);

  insertActionEffectsAtEnd([b25Move], { flow });
  insertActionEffectsAtEnd([purple4Move], {
    flow,
    source: {
      chainId: flow.chainId,
      effectIndex: 0,
      effectId: "scan-purple4",
      effectType: "scan_action_4",
    },
  });

  assert.equal(flow.effects.length, 2, "b_25 and purple4 should share one scan movement node");
  assert.equal(flow.effects[1].type, cardEffects.EFFECT_TYPES.CARD_MOVE);
  assert.equal(flow.effects[1].options.scanMovementPoolId, "scan-run-b25");
  assert.equal(flow.effects[1].options.movementPoints, 2);
  assert.equal(flow.effects[1].mergedMovementContributions.length, 1);
  assert.equal(flow.effects[1].mergedMovementContributions[0].source.effectId, "scan-purple4");
}

{
  let queuedMoveCount = 0;
  let immediateMoveCount = 0;
  const handleScanAction4Choice = loadNamedFunction("handleScanAction4Choice", {
    closeScanAction4Picker: () => {},
    launchRocketForScanAction4: () => ({ ok: true }),
    rocketState: { statusNote: "" },
    renderPlayerStats: () => {},
    completeCurrentActionEffect: () => {},
    renderStateReadout: () => {},
    queueScanAction4MoveEffect: () => {
      queuedMoveCount += 1;
      return { ok: true, queued: true };
    },
    beginScanAction4FreeMove: () => {
      immediateMoveCount += 1;
      return { ok: true };
    },
    getCurrentActionEffect: () => ({ label: "发射/移动" }),
    skipActionEffectWithMessage: () => ({ ok: true, skipped: true }),
  });

  const result = handleScanAction4Choice("move");
  assert.equal(result.queued, true);
  assert.equal(queuedMoveCount, 1);
  assert.equal(immediateMoveCount, 0, "purple4 movement must be deferred into the scan movement pool");
}

for (const functionName of [
  "getRequiredMovePointsForUi",
  "confirmMovePayment",
  "executeCardEffectMove",
  "executeFreeMoveForCardTrigger",
  "executeFreeMoveForCardCorner",
  "executeFreeMoveForScanAction4",
  "executeIndustryFreeMove",
]) {
  assert.match(
    extractNamedFunctionSource(functionName),
    /applyActiveCardMovementModifiers/,
    `${functionName} should apply active turn movement modifiers`,
  );
}

assert.match(
  extractNamedFunctionSource("executeAomomoFossilMoveAndLandEffect"),
  /aomomo_fossil_move_land_count/,
  "Aomomo card 6 should open the fossil-count choice",
);
assert.match(
  extractNamedFunctionSource("handleAomomoFossilMoveLandCountChoice"),
  /resolveAomomoFossilMoveLandExchange/,
  "Aomomo card 6 count choice should resolve through the validated exchange",
);
assert.ok(
  (appSource.match(/handleAomomoFossilMoveLandCountChoice/g) || []).length >= 4,
  "Aomomo card 6 choice handler should be defined and wired to both event and AI controllers",
);

console.log("runtime-regressions.test.js: all tests passed");
