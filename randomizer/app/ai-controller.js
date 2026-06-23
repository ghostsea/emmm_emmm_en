(function (root, factory) {
  "use strict";

  const api = factory(root);

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.SetiAppAiController = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function (root) {
  "use strict";

  function createAiController(context) {
    if (!context || !context.state) {
      throw new Error("createAiController requires app context and state accessors");
    }

    const {
      window: windowRef = root,
      state,
      solar,
      players,
      rocketActions,
      planetStats,
      planetRewards,
      finalScoring,
      endGameScoring,
      abilities,
      actions,
      scanEffects,
      cards,
      cardEffects,
      cardTaskStateModule,
      tech,
      data,
      aliens,
      ai,
      solarState,
      nebulaDataState,
      alienGameState,
      finalScoringState,
      playerState,
      turnState,
      rocketState,
      planetStatsState,
      techGameState,
      cardState,
      historyStepOrder,
      els,
      DEFAULT_ACTIVE_PLAYER_COUNT,
      DEFAULT_INITIAL_HAND_COUNT,
      DEFAULT_INITIAL_PLAYER_COLOR,
      FINAL_ROUND_NUMBER,
      FINAL_SCORE_IDS,
      INITIAL_SELECTION_REQUIRED,
      MOVE_ENERGY_COST,
      allowsBlindDrawInSelection,
      beginPlayCardSelection,
      beginScanAction,
      buildSectorScanChoicesForX,
      buildSectorScanChoicesForXs,
      canBlindDraw,
      canPayForMove,
      canStartMainAction,
      clearTransientStateForRecovery,
      computePlayerFinalScoreBreakdown,
      confirmCardTaskCompletion,
      confirmInitialSelectionForCurrentPlayer,
      confirmLandTargetPicker,
      confirmMovePayment,
      confirmPassReserveSelection,
      confirmPlayCardSelection,
      confirmPublicScanSelection,
      confirmScanTarget,
      confirmTechBlueSlotChoice,
      createActionContext,
      createTurnState,
      drawCardForCurrentPlayer,
      endCurrentTurn,
      executeActionEffect,
      executeCardMoveForEffect,
      executeFreeMoveForCardTrigger,
      executeFreeMoveForScanAction4,
      finalizePendingDiscardSelection,
      formatRocketLabel,
      getActivePlayers,
      getAlienTraceActionPlayer,
      getCardPlayCost,
      getCardPrice,
      getCardTypeCode,
      getCurrentActionEffect,
      getCurrentPlayer,
      getEarthSectorCoordinate,
      getEffectOwnerPlayer,
      getInitialSelectionOffer,
      getMovableTokensForPlayer,
      getPassReserveSelectionCards,
      getPendingPlayCardSelection,
      getPlanetSectorCoordinate,
      getPlayerByColor,
      getPlayerById,
      getPlayerLabelById,
      getPublicScanChoicesForCard,
      getRequiredMovePointsForUi,
      getResearchTechSelectionOptions,
      getSectorContentForMove,
      getSectorXsMatchingCondition,
      handleCardTriggerChoice,
      handleConditionalSectorChoice,
      handleHandScanCardClick,
      handleOptionalHandScanChoice,
      handlePlayCardSelect,
      handlePublicScanCardClick,
      handleSupplyTechTileClick,
      hasActivePendingSubFlow,
      initializeCardGame,
      isActionEffectFlowActive,
      isAsteroidContent,
      isCardSelectionActive,
      isDiscardSelectionActive,
      isGameEnded,
      isHandScanSelectionActive,
      isIndustryHandSelectionActive,
      isInitialSelectionActive,
      isMovePaymentCard,
      isMovePaymentSelectionActive,
      isPlayCardSelectionActive,
      isPublicScanMultiSelectActive,
      isTechTileOwnedByOtherPlayer,
      isTechTilePickingActive,
      landForCurrentPlayer,
      moveRocket,
      orbitForCurrentPlayer,
      passForCurrentPlayer,
      pickPublicCardForCurrentPlayer,
      randomizeAll,
      renderStateReadout,
      researchTechForCurrentPlayer,
      resetActionLog,
      restoreMutableObject,
      runAction,
      runAiFinalScoreMarkDecision,
      selectPassReserveCard,
      setTurnStatePlayerOrder,
      skipCurrentActionEffect,
      startInitialSelection,
      updateActionButtons,
    } = context;

    const AI_STRATEGY_TUNING_HISTORY_STORAGE_KEY = "seti-ai-strategy-tuning-history-v1";
    const aiAutoBattleState = {
      enabled: false,
      running: false,
      playerIds: [],
      logs: [],
      bugs: [],
      bugCounts: {},
      turnMoveCounts: {},
      maxBugRepeats: 3,
      maxMovesPerTurn: 1,
      stepDelayMs: 0,
      lastSummary: null,
      strategyTuningHistory: [],
      strategyTuningHistoryLoaded: false,
      nextStrategyTuningHistoryId: 1,
    };
    let aiAutoStepScheduled = false;
    let aiAutoStepInProgress = false;
    let aiAutoStepPausedOnBug = false;
    let aiAutoStepSuspended = false;
    const AI_MOVE_DIRECTIONS = Object.freeze([
      Object.freeze({ id: "out", label: "向外", deltaX: 0, deltaY: 1, score: 5 }),
      Object.freeze({ id: "cw", label: "顺时针", deltaX: 1, deltaY: 0, score: 2 }),
      Object.freeze({ id: "ccw", label: "逆时针", deltaX: -1, deltaY: 0, score: 1 }),
      Object.freeze({ id: "in", label: "向内", deltaX: 0, deltaY: -1, score: -1 }),
    ]);
    const AI_RESOURCE_VALUES = Object.freeze({
      score: 1,
      credits: 3,
      energy: 3,
      handSize: 3,
      availableData: 1.5,
      publicity: 1.5,
      additionalPublicScan: 1.5,
    });
    const AI_SCAN_COLORS = Object.freeze(["yellow", "red", "blue", "black"]);
    const AI_TECH_TYPES = Object.freeze(["orange", "purple", "blue"]);
    const AI_TRACE_TYPES = Object.freeze(["yellow", "pink", "blue"]);
    const AI_STRATEGY_WEIGHT_KEYS = Object.freeze([
      "engine",
      "playCard",
      "tech",
      "scan",
      "route",
      "move",
      "orbitLand",
      "task",
      "final",
      "pass",
    ]);
    const AI_STRATEGY_WEIGHT_DEFAULTS = Object.freeze(
      AI_STRATEGY_WEIGHT_KEYS.reduce((weights, key) => ({ ...weights, [key]: 1 }), {}),
    );
    let aiStrategyWeights = { ...AI_STRATEGY_WEIGHT_DEFAULTS };
    let aiStrategyDemandCache = null;

    function createAiAutoBattleEntry(type, message, details = {}) {
      const currentPlayer = getCurrentPlayer();
      return {
        id: aiAutoBattleState.logs.length + aiAutoBattleState.bugs.length + 1,
        type,
        roundNumber: turnState.roundNumber,
        turnNumber: turnState.turnNumber,
        playerId: currentPlayer?.id || playerState.currentPlayerId || null,
        playerLabel: currentPlayer?.colorLabel || currentPlayer?.name || null,
        message: String(message || ""),
        details: structuredClone(details || {}),
        createdAt: new Date().toISOString(),
      };
    }

    function recordAiAutoBattleLog(type, message, details = {}) {
      const entry = createAiAutoBattleEntry(type, message, details);
      aiAutoBattleState.logs.push(entry);
      return entry;
    }

    function recordAiAutoBattleBug(message, details = {}) {
      const key = String(message || "unknown");
      aiAutoBattleState.bugCounts[key] = (aiAutoBattleState.bugCounts[key] || 0) + 1;
      const entry = createAiAutoBattleEntry("bug", key, {
        ...details,
        repeatCount: aiAutoBattleState.bugCounts[key],
      });
      aiAutoBattleState.bugs.push(entry);
      return entry;
    }

    function loadAiStrategyTuningHistory() {
      if (aiAutoBattleState.strategyTuningHistoryLoaded) return aiAutoBattleState.strategyTuningHistory;
      aiAutoBattleState.strategyTuningHistoryLoaded = true;
      try {
        const raw = windowRef.localStorage?.getItem(AI_STRATEGY_TUNING_HISTORY_STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        aiAutoBattleState.strategyTuningHistory = Array.isArray(parsed) ? parsed.slice(-50) : [];
        const maxId = aiAutoBattleState.strategyTuningHistory.reduce((best, entry) => (
          Math.max(best, Math.round(Number(entry?.id)) || 0)
        ), 0);
        aiAutoBattleState.nextStrategyTuningHistoryId = maxId + 1;
      } catch (_error) {
        aiAutoBattleState.strategyTuningHistory = [];
        aiAutoBattleState.nextStrategyTuningHistoryId = 1;
      }
      return aiAutoBattleState.strategyTuningHistory;
    }

    function saveAiStrategyTuningHistory() {
      try {
        windowRef.localStorage?.setItem(
          AI_STRATEGY_TUNING_HISTORY_STORAGE_KEY,
          JSON.stringify(aiAutoBattleState.strategyTuningHistory.slice(-50)),
        );
      } catch (_error) {
        // Ignore storage failures; in-memory history remains available for the current page.
      }
    }

    function compactAiStrategyTuningHistoryEntry(summary, options = {}) {
      return {
        id: aiAutoBattleState.nextStrategyTuningHistoryId++,
        createdAt: new Date().toISOString(),
        label: options.label || null,
        gamesRequested: Math.round(Number(options.gamesRequested) || Number(summary?.gameCount) || 0),
        gamesRun: Math.round(Number(options.gamesRun) || Number(summary?.gameCount) || 0),
        appliedWeights: options.appliedWeights ? normalizeAiStrategyWeights(options.appliedWeights) : getAiStrategyWeights(),
        summary: {
          gameCount: summary?.gameCount || 0,
          completedGames: summary?.completedGames || 0,
          blockedGames: summary?.blockedGames || 0,
          completionRate: summary?.completionRate || 0,
          averageSteps: summary?.averageSteps || 0,
          averageWinnerScore: summary?.averageWinnerScore || 0,
          turnActionCount: summary?.turnActionCount || 0,
          actionCategoryRatios: summary?.actionCategoryRatios || {},
          winnerProfileDeltas: summary?.winnerProfileDeltas || {},
          scoreOpportunities: summary?.scoreOpportunities || {},
          topScoreGaps: summary?.topScoreGaps || [],
          routeTargets: summary?.routeTargets || [],
          moveFollowups: summary?.moveFollowups || [],
          turnPlans: summary?.turnPlans || [],
          turnPlanTypes: summary?.turnPlanTypes || [],
          turnPlanActions: summary?.turnPlanActions || [],
          topBugs: summary?.topBugs || [],
          strategyTuning: summary?.strategyTuning || null,
        },
        strategyTuning: summary?.strategyTuning || null,
      };
    }

    function recordAiStrategyTuningSummary(summary, options = {}) {
      if (!summary?.strategyTuning) return null;
      loadAiStrategyTuningHistory();
      const entry = compactAiStrategyTuningHistoryEntry(summary, options);
      aiAutoBattleState.strategyTuningHistory.push(entry);
      const maxHistory = Math.max(1, Math.round(Number(options.maxHistory) || 30));
      aiAutoBattleState.strategyTuningHistory = aiAutoBattleState.strategyTuningHistory.slice(-maxHistory);
      saveAiStrategyTuningHistory();
      return structuredClone(entry);
    }

    function compactAiStrategyABHistoryEntry(comparison, options = {}) {
      const improved = Boolean(comparison?.verdict?.improved);
      const selectedVariant = improved ? "tuned" : "baseline";
      const selectedComparison = improved ? comparison?.tuned : comparison?.baseline;
      const selectedWeights = improved
        ? normalizeAiStrategyWeights(options.tunedWeights, { merge: false })
        : normalizeAiStrategyWeights(options.baselineWeights, { merge: false });
      const gameCount = Math.max(0, Math.round(Number(comparison?.gameCount) || Number(options.gamesRun) || 0));
      const scoreDelta = aiNumber(comparison?.verdict?.scoreDelta ?? comparison?.deltas?.averageWinnerScore);
      const blockedDelta = aiNumber(comparison?.verdict?.blockedDelta ?? comparison?.deltas?.blockedGames);
      const completionDelta = aiNumber(comparison?.verdict?.completionDelta ?? comparison?.deltas?.completionRate);
      const confidence = improved
        ? Math.min(1, 0.35 + Math.max(0, scoreDelta) * 0.05 + gameCount * 0.05)
        : Math.max(0.1, 0.35 - Math.max(0, -scoreDelta) * 0.04 - Math.max(0, blockedDelta) * 0.1);
      const rationale = [{
        key: improved ? "ab-tuned" : "ab-baseline",
        delta: Math.round(scoreDelta * 1000) / 1000,
        reason: improved
          ? "同 seed A/B 中 tuned 平均胜者分更高且未增加阻塞"
          : "同 seed A/B 中 tuned 未证明优于 baseline，回退长期权重置信度",
      }];
      return {
        kind: "ab-test",
        id: aiAutoBattleState.nextStrategyTuningHistoryId++,
        createdAt: new Date().toISOString(),
        label: options.label || null,
        gamesRequested: gameCount,
        gamesRun: gameCount,
        seedBase: comparison?.seedBase || options.seedBase || null,
        selectedVariant,
        baselineWeights: normalizeAiStrategyWeights(options.baselineWeights, { merge: false }),
        tunedWeights: normalizeAiStrategyWeights(options.tunedWeights, { merge: false }),
        appliedWeights: selectedWeights,
        abComparison: comparison || null,
        summary: {
          gameCount,
          completedGames: selectedComparison?.completedGames || 0,
          blockedGames: selectedComparison?.blockedGames || 0,
          completionRate: selectedComparison?.completionRate || 0,
          averageWinnerScore: selectedComparison?.averageWinnerScore || 0,
          winnerProfileDeltas: selectedComparison?.winnerProfileDeltas || {},
          actionCategoryRatios: selectedComparison?.actionCategoryRatios || {},
          strategyTuning: {
            id: improved ? "ab-tuned-v1" : "ab-baseline-v1",
            confidence,
            weights: selectedWeights,
            baselineWeights: normalizeAiStrategyWeights(options.baselineWeights, { merge: false }),
            deltas: comparison?.deltas?.winnerProfileDeltas || {},
            rationale,
          },
        },
        strategyTuning: {
          id: improved ? "ab-tuned-v1" : "ab-baseline-v1",
          confidence,
          weights: selectedWeights,
          baselineWeights: normalizeAiStrategyWeights(options.baselineWeights, { merge: false }),
          deltas: comparison?.deltas?.winnerProfileDeltas || {},
          rationale,
        },
      };
    }

    function recordAiStrategyABComparison(comparison, options = {}) {
      if (!comparison) return null;
      loadAiStrategyTuningHistory();
      const entry = compactAiStrategyABHistoryEntry(comparison, options);
      aiAutoBattleState.strategyTuningHistory.push(entry);
      const maxHistory = Math.max(1, Math.round(Number(options.maxHistory) || 30));
      aiAutoBattleState.strategyTuningHistory = aiAutoBattleState.strategyTuningHistory.slice(-maxHistory);
      saveAiStrategyTuningHistory();
      return structuredClone(entry);
    }

    function getAiStrategyTuningHistory() {
      return structuredClone(loadAiStrategyTuningHistory());
    }

    function clearAiStrategyTuningHistory() {
      aiAutoBattleState.strategyTuningHistoryLoaded = true;
      aiAutoBattleState.strategyTuningHistory = [];
      aiAutoBattleState.nextStrategyTuningHistoryId = 1;
      try {
        windowRef.localStorage?.removeItem(AI_STRATEGY_TUNING_HISTORY_STORAGE_KEY);
      } catch (_error) {
        // Ignore storage failures.
      }
      return { ok: true, history: [] };
    }

    function getAiStrategyTuningRecommendation(options = {}) {
      const history = loadAiStrategyTuningHistory();
      const recommendation = ai?.analytics?.summarizeStrategyTuningHistory
        ? ai.analytics.summarizeStrategyTuningHistory(history, {
          baseWeights: options.baseWeights || getAiStrategyWeights(),
          learningRate: options.learningRate,
        })
        : null;
      return structuredClone(recommendation);
    }

    function applyAiStrategyTuningRecommendation(options = {}) {
      const recommendation = getAiStrategyTuningRecommendation(options);
      if (!recommendation?.weights) {
        return { ok: false, message: "没有可用的 AI 策略调参历史" };
      }
      const applied = applyAiStrategyTuning(recommendation);
      return {
        ok: true,
        applied,
        recommendation,
      };
    }

    function countAiPlayerTech(player) {
      const ownedTiles = player?.techState?.ownedTiles || {};
      return Object.values(ownedTiles).reduce((total, value) => {
        if (Array.isArray(value)) return total + value.length;
        return total + (value ? 1 : 0);
      }, 0);
    }

    function getAiAutoBattlePlayerResults() {
      return getActivePlayers().map((player) => {
        const finalScoreBreakdown = computePlayerFinalScoreBreakdown(player);
        const rocketsForPlayer = rocketActions.getRocketsForPlayer
          ? rocketActions.getRocketsForPlayer(rocketState, player.id)
          : [];
        return {
          playerId: player.id,
          playerLabel: player.colorLabel || player.name || player.id,
          color: player.color,
          finalScore: finalScoreBreakdown.totalScore ?? player.resources?.score ?? 0,
          baseScore: finalScoreBreakdown.baseScore ?? player.resources?.score ?? 0,
          tileScore: finalScoreBreakdown.tileScore ?? 0,
          cardScore: finalScoreBreakdown.cardScore ?? 0,
          resources: {
            score: player.resources?.score || 0,
            credits: player.resources?.credits || 0,
            energy: player.resources?.energy || 0,
            publicity: player.resources?.publicity || 0,
            availableData: player.resources?.availableData || 0,
            handSize: player.resources?.handSize || 0,
          },
          income: { ...(player.income || {}) },
          completedTaskCount: player.completedTaskCount || 0,
          reservedCount: Array.isArray(player.reservedCards) ? player.reservedCards.length : 0,
          handSize: Array.isArray(player.hand) ? player.hand.length : player.resources?.handSize || 0,
          techCount: countAiPlayerTech(player),
          rocketCount: rocketsForPlayer.length,
          passed: (turnState.passedPlayerIds || []).includes(player.id),
        };
      });
    }

    function getAiAutoBattlePendingState() {
      const currentEffect = getCurrentActionEffect();
      return {
        actionEffectFlowActive: isActionEffectFlowActive(),
        currentEffect: currentEffect
          ? {
            id: currentEffect.id || null,
            type: currentEffect.type || null,
            label: currentEffect.label || null,
            status: currentEffect.status || null,
          }
          : null,
        pendingScanTargetType: state.pendingScanTargetAction?.type || null,
        pendingPublicScanQueue: Boolean(state.pendingPublicScanQueue),
        pendingHandScan: Boolean(state.pendingHandScanAction),
        pendingPassReserve: Boolean(state.pendingPassReserveSelection),
        pendingCardSelection: Boolean(state.pendingCardSelectionAction),
        pendingPlayCardSelection: Boolean(state.pendingPlayCardSelection),
        pendingMovePayment: Boolean(state.pendingMovePayment),
        pendingCardTrigger: Boolean(state.pendingCardTriggerAction),
        pendingCardTriggerFreeMove: Boolean(state.pendingCardTriggerFreeMove),
        pendingCardCornerFreeMove: Boolean(state.pendingCardCornerFreeMove),
        pendingCardTaskCompletion: Boolean(state.pendingCardTaskCompletion),
        pendingChongTaskCompletion: Boolean(state.pendingChongTaskCompletion),
        pendingAlienTrace: Boolean(els.alienTraceOverlay && !els.alienTraceOverlay.hidden),
        pendingLandTarget: Boolean(els.landTargetOverlay && !els.landTargetOverlay.hidden),
        pendingScanAction4: Boolean(els.scanAction4Overlay && !els.scanAction4Overlay.hidden),
        pendingDataPlacement: Boolean(els.dataPlaceOverlay && !els.dataPlaceOverlay.hidden),
        pendingIndustryAbility: Boolean(state.pendingIndustryAbility),
        pendingIndustryFreeMove: Boolean(state.industryFreeMoveState),
        pendingIndustryHandSelection: isIndustryHandSelectionActive(),
      };
    }

    function buildAiAutoBattleReport() {
      const report = {
        enabled: aiAutoBattleState.enabled,
        running: aiAutoBattleState.running,
        playerIds: aiAutoBattleState.playerIds,
        logs: aiAutoBattleState.logs,
        bugs: aiAutoBattleState.bugs,
        lastSummary: aiAutoBattleState.lastSummary,
        playerResults: getAiAutoBattlePlayerResults(),
        pendingState: getAiAutoBattlePendingState(),
        strategyWeights: getAiStrategyWeights(),
        strategyTuningHistory: getAiStrategyTuningHistory().slice(-10),
        strategyTuningRecommendation: getAiStrategyTuningRecommendation(),
      };
      if (ai?.analytics?.analyzeBattleReport) {
        report.analysis = ai.analytics.analyzeBattleReport(report);
      }
      return report;
    }

    function getAiAutoBattleReport() {
      return structuredClone(buildAiAutoBattleReport());
    }

    function getAiAutoBattleAnalysis() {
      return structuredClone(buildAiAutoBattleReport().analysis || null);
    }

    function getAiAutoBattlePlayerIds() {
      return aiAutoBattleState.playerIds.filter((playerId) => getPlayerById(playerId));
    }

    function isAiAutoBattlePlayer(playerId = playerState.currentPlayerId) {
      return aiAutoBattleState.enabled
        && getAiAutoBattlePlayerIds().includes(playerId);
    }

    function getPlayerAgentLabel(playerId) {
      return isAiAutoBattlePlayer(playerId) ? "电脑" : "人类";
    }

    function getDefaultHumanPlayerId() {
      return getPlayerByColor(DEFAULT_INITIAL_PLAYER_COLOR)?.id
        || turnState.startPlayerId
        || playerState.currentPlayerId
        || null;
    }

    function getDefaultAiOpponentPlayerId() {
      const humanPlayerId = getDefaultHumanPlayerId();
      const activeIds = (turnState.activePlayerIds || []).filter((playerId) => getPlayerById(playerId));
      return activeIds.find((playerId) => playerId !== humanPlayerId)
        || playerState.players.find((player) => player.id !== humanPlayerId)?.id
        || null;
    }

    function configureDefaultAiOpponent() {
      const aiPlayerId = getDefaultAiOpponentPlayerId();
      if (!aiPlayerId) return { ok: false, message: "没有可用的默认电脑玩家" };
      aiAutoBattleState.enabled = true;
      aiAutoBattleState.playerIds = [aiPlayerId];
      aiAutoStepPausedOnBug = false;
      recordAiAutoBattleLog("config", `默认电脑玩家：${getPlayerLabelById(aiPlayerId)}`, {
        playerIds: [aiPlayerId],
        humanPlayerId: getDefaultHumanPlayerId(),
        mode: "default-human-vs-ai",
      });
      return { ok: true, playerIds: [aiPlayerId], message: "默认人机对局已配置" };
    }

    function resolveAiAutoBattlePlayerIds(options = {}) {
      const requested = Array.isArray(options.playerIds)
        ? options.playerIds
        : Array.isArray(options.colors)
          ? options.colors
          : [];
      const resolved = requested
        .map((reference) => (
          getPlayerById(reference)
          || getPlayerByColor(reference)
          || null
        ))
        .filter(Boolean)
        .map((player) => player.id);
      if (resolved.length) return [...new Set(resolved)];

      const requestedCount = Math.max(
        1,
        Math.round(Number(options.activePlayerCount) || turnState.activePlayerCount || DEFAULT_ACTIVE_PLAYER_COUNT),
      );
      return (turnState.activePlayerIds || [])
        .filter((playerId) => getPlayerById(playerId))
        .slice(0, requestedCount);
    }

    function setAiAutoBattlePlayers(options = {}) {
      const playerIds = resolveAiAutoBattlePlayerIds(options);
      if (!playerIds.length) {
        return { ok: false, message: "没有可配置为电脑玩家的玩家" };
      }
      aiAutoBattleState.enabled = true;
      aiAutoBattleState.playerIds = playerIds;
      aiAutoStepPausedOnBug = false;
      recordAiAutoBattleLog("config", `电脑玩家：${playerIds.map(getPlayerLabelById).join("、")}`, { playerIds });
      return { ok: true, playerIds: [...playerIds], message: "电脑玩家已配置" };
    }

    function getPendingAutomationPlayerId() {
      if (state.pendingDiscardAction?.player?.id) return state.pendingDiscardAction.player.id;
      if (state.pendingCardSelectionAction?.player?.id) return state.pendingCardSelectionAction.player.id;
      if (state.pendingPassReserveSelection?.playerId) return state.pendingPassReserveSelection.playerId;
      if (state.pendingHandScanAction?.player?.id) return state.pendingHandScanAction.player.id;
      if (state.pendingMovePayment?.player?.id) return state.pendingMovePayment.player.id;
      const effectOwner = getCurrentActionEffect()
        ? getEffectOwnerPlayer(getCurrentActionEffect())
        : null;
      return effectOwner?.id || playerState.currentPlayerId;
    }

    function shouldAutoRunCurrentAiPlayer() {
      const automationPlayerId = getPendingAutomationPlayerId();
      return Boolean(
        aiAutoBattleState.enabled
        && !aiAutoBattleState.running
        && !aiAutoStepSuspended
        && !aiAutoStepPausedOnBug
        && !aiAutoStepScheduled
        && !aiAutoStepInProgress
        && !isGameEnded()
        && isAiAutoBattlePlayer(automationPlayerId),
      );
    }

    function scheduleAiAutoStepIfNeeded() {
      if (!shouldAutoRunCurrentAiPlayer()) return;
      aiAutoStepScheduled = true;
      const delay = Math.max(0, Math.round(Number(aiAutoBattleState.stepDelayMs) || 0));
      windowRef.setTimeout(runScheduledAiAutoStep, delay);
    }

    function runScheduledAiAutoStep() {
      aiAutoStepScheduled = false;
      if (!shouldAutoRunCurrentAiPlayer()) return;

      aiAutoStepInProgress = true;
      const result = runAiAutomationStep();
      aiAutoStepInProgress = false;

      if (result?.blocked || result?.ok === false) {
        aiAutoStepPausedOnBug = true;
        const bug = recordAiAutoBattleBug(result.message || "默认 AI 自动行动阻塞", {
          result,
          mode: "default-human-vs-ai",
        });
        rocketState.statusNote = `电脑玩家阻塞：${bug.message}`;
        renderStateReadout();
        return;
      }

      if (!result?.done && !isGameEnded()) {
        scheduleAiAutoStepIfNeeded();
      }
    }

    function resetGameForAiAutoBattle(options = {}) {
      aiStrategyDemandCache = null;
      const activePlayerCount = Math.min(
        Math.max(1, Math.round(Number(options.activePlayerCount) || turnState.activePlayerCount || DEFAULT_ACTIVE_PLAYER_COUNT)),
        players.PLAYER_COLOR_IDS.length,
      );
      if (options.clearLogs !== false) {
        aiAutoBattleState.logs = [];
        aiAutoBattleState.bugs = [];
        aiAutoBattleState.bugCounts = {};
        aiAutoBattleState.lastSummary = null;
      }
      aiAutoBattleState.turnMoveCounts = {};
      clearTransientStateForRecovery();
      restoreMutableObject(solarState, solar.createBaselineState());
      restoreMutableObject(nebulaDataState, data.createDefaultNebulaDataState());
      restoreMutableObject(alienGameState, aliens.createDefaultAlienState());
      restoreMutableObject(finalScoringState, finalScoring.createFinalScoringState(FINAL_SCORE_IDS));
      restoreMutableObject(playerState, players.createPlayerState({
        players: players.PLAYER_COLOR_IDS.map((color) => ({ color })),
        currentPlayerColor: DEFAULT_INITIAL_PLAYER_COLOR,
      }));
      restoreMutableObject(turnState, createTurnState(playerState.players, {
        activePlayerCount,
        currentPlayerId: playerState.currentPlayerId,
      }));
      restoreMutableObject(rocketState, rocketActions.createRocketState());
      restoreMutableObject(planetStatsState, planetStats.createPlanetStatsState());
      restoreMutableObject(techGameState, tech.createState());
      restoreMutableObject(cardState, cards.createCardState());
      restoreMutableObject(cardTaskState, cardTaskStateModule.createTaskState());
      historyStepOrder.length = 0;
      state.effectStepActive = false;
      scanRunSequence = 0;
      resetActionLog();
      initializeCardGame(DEFAULT_INITIAL_HAND_COUNT);
      randomizeAll();
      startInitialSelection();
      return {
        ok: true,
        activePlayerCount,
        playerIds: [...turnState.activePlayerIds],
        message: "AI 自动对战新局已重置",
      };
    }

    function configureAiAutoBattle(options = {}) {
      aiStrategyDemandCache = null;
      aiAutoStepSuspended = true;
      try {
        if (options.resetStrategyWeights) {
          resetAiStrategyWeights();
        }
        if (options.strategyTuning) {
          applyAiStrategyTuning(options.strategyTuning);
        }
        if (options.strategyWeights) {
          configureAiStrategyWeights(options.strategyWeights, {
            merge: options.mergeStrategyWeights !== false,
          });
        }
        if (options.reset) {
          const resetResult = resetGameForAiAutoBattle(options);
          if (!resetResult.ok) return resetResult;
        }
        if (options.activePlayerCount && !options.reset) {
          const playerIds = playerState.players.map((player) => player.id);
          setTurnStatePlayerOrder(playerIds, { activePlayerCount: options.activePlayerCount });
          startInitialSelection();
        }
        if (options.stepDelayMs != null) {
          aiAutoBattleState.stepDelayMs = Math.max(0, Math.round(Number(options.stepDelayMs) || 0));
        }
        if (options.maxBugRepeats != null) {
          aiAutoBattleState.maxBugRepeats = Math.max(1, Math.round(Number(options.maxBugRepeats) || 1));
        }
        if (options.maxMovesPerTurn != null) {
          aiAutoBattleState.maxMovesPerTurn = Math.max(0, Math.round(Number(options.maxMovesPerTurn) || 0));
        }
        const configResult = setAiAutoBattlePlayers(options);
        updateActionButtons();
        renderStateReadout();
        return configResult;
      } finally {
        aiAutoStepSuspended = false;
        if (!options.suppressAutoSchedule) {
          scheduleAiAutoStepIfNeeded();
        }
      }
    }

    function chooseInitialSelectionForAiPlayer() {
      if (!isInitialSelectionActive()) return null;
      const playerId = playerState.currentPlayerId;
      if (!isAiAutoBattlePlayer(playerId)) {
        return { ok: false, blocked: true, message: `${getPlayerLabelById(playerId)}不是电脑玩家，等待人类初始选择` };
      }
      const offer = getInitialSelectionOffer(playerId);
      if (!offer || offer.confirmed) return { ok: false, message: "没有可用初始选择" };
      const decision = ai?.policy?.chooseInitialSelection?.(offer, { roundNumber: turnState.roundNumber }) || {};
      const industryCard = decision.industry || offer.industryOptions?.[0] || null;
      const initialSelection = decision.initialCards?.length
        ? decision.initialCards
        : (offer.initialOptions || []).slice(0, INITIAL_SELECTION_REQUIRED.initial);
      if (!industryCard || initialSelection.length < INITIAL_SELECTION_REQUIRED.initial) {
        return { ok: false, message: "AI 初始选择候选不足" };
      }
      offer.selectedIndustryId = industryCard.id;
      offer.selectedInitialIds = initialSelection
        .slice(0, INITIAL_SELECTION_REQUIRED.initial)
        .map((card) => card.id);
      recordAiAutoBattleLog(
        "initial-selection",
        `${getPlayerLabelById(playerId)}选择 ${industryCard.label || industryCard.id}`,
        { industryCard, initialCards: initialSelection },
      );
      confirmInitialSelectionForCurrentPlayer();
      return { ok: true, progressed: true, message: "AI 初始选择完成" };
    }

    function runAiDiscardDecision() {
      if (!isDiscardSelectionActive() || !state.pendingDiscardAction) return null;
      const player = state.pendingDiscardAction.player || getCurrentPlayer();
      if (!isAiAutoBattlePlayer(player?.id)) {
        return { ok: false, blocked: true, message: `${player?.colorLabel || "当前玩家"}需要人工弃牌` };
      }
      const count = cards.getDiscardRemaining(cardState);
      const selectedIndexes = ai?.policy?.chooseDiscardIndexes?.(player.hand || [], count)
        || Array.from({ length: count }, (_item, index) => index);
      state.pendingDiscardAction.selectedIndexes = selectedIndexes.slice(0, count);
      recordAiAutoBattleLog("discard", `${player.colorLabel}AI 弃牌 ${state.pendingDiscardAction.selectedIndexes.length} 张`, {
        selectedIndexes: state.pendingDiscardAction.selectedIndexes,
        pendingType: state.pendingDiscardAction.type || null,
      });
      return finalizePendingDiscardSelection();
    }

    function runAiPassReserveDecision() {
      if (!state.pendingPassReserveSelection) return null;
      const player = getPlayerById(state.pendingPassReserveSelection.playerId) || getCurrentPlayer();
      if (!isAiAutoBattlePlayer(player?.id)) {
        return { ok: false, blocked: true, message: `${player?.colorLabel || "当前玩家"}需要人工选择 PASS 预留牌` };
      }
      const pile = getPassReserveSelectionCards();
      const card = ai?.policy?.choosePassReserveCard?.(pile) || pile[0] || null;
      if (!card) return { ok: false, message: "PASS 预留牌堆为空" };
      selectPassReserveCard(card.id);
      recordAiAutoBattleLog("pass-reserve", `${player.colorLabel}AI 选择 PASS 预留牌`, { card });
      return confirmPassReserveSelection();
    }

    function runAiCardSelectionDecision() {
      if (!isCardSelectionActive()) return null;
      const pending = state.pendingCardSelectionAction || {};
      const player = pending.player || getCurrentPlayer();
      if (!isAiAutoBattlePlayer(player?.id)) {
        return { ok: false, blocked: true, message: `${player?.colorLabel || "当前玩家"}需要人工精选` };
      }

      if (pending.type === "public_scan") {
        const selectedSlots = getAiBestPublicScanSlots(player, {
          maxSelectable: pending.maxSelectable ?? 1,
        });
        if (!selectedSlots.length) return { ok: false, blocked: true, message: "AI 没有可扫描的公共牌" };
        recordAiAutoBattleLog("public-scan-card", `${player.colorLabel}AI 选择公共牌扫描`, {
          pendingType: pending.type,
          selectedSlots: selectedSlots.map((entry) => ({
            slotIndex: entry.slotIndex,
            score: entry.score,
            card: entry.card,
          })),
          maxSelectable: pending.maxSelectable ?? 1,
        });
        let selectResult = null;
        for (const entry of selectedSlots) {
          selectResult = handlePublicScanCardClick(entry.slotIndex);
          if (!selectResult?.ok) return selectResult;
          if (!isPublicScanMultiSelectActive()) break;
        }
        if (isPublicScanMultiSelectActive()) {
          return confirmPublicScanSelection();
        }
        return selectResult;
      }

      const slotIndex = cardState.publicCards.findIndex(Boolean);
      if (slotIndex >= 0) {
        recordAiAutoBattleLog("pick-card", `${player.colorLabel}AI 精选公共牌 ${slotIndex + 1}`, {
          pendingType: pending.type || null,
          slotIndex,
          card: cardState.publicCards[slotIndex],
        });
        return pickPublicCardForCurrentPlayer(slotIndex);
      }
      if (allowsBlindDrawInSelection() && canBlindDraw()) {
        recordAiAutoBattleLog("pick-card", `${player.colorLabel}AI 盲抽 1 张牌`, {
          pendingType: pending.type || null,
        });
        return drawCardForCurrentPlayer({ fromSelection: true });
      }
      return { ok: false, blocked: true, message: "AI 没有可精选的公共牌" };
    }

    function runAiHandScanDecision() {
      if (!isHandScanSelectionActive()) return null;
      const pending = state.pendingHandScanAction || {};
      const player = pending.player || getCurrentPlayer();
      if (!isAiAutoBattlePlayer(player?.id)) {
        return { ok: false, blocked: true, message: `${player?.colorLabel || "当前玩家"}需要人工选择手牌扫描` };
      }
      const selected = getAiBestHandScanIndex(player);
      if (!selected && pending.optional) {
        recordAiAutoBattleLog("hand-scan", `${player.colorLabel}AI 跳过可选手牌扫描`, {
          pendingType: pending.type || null,
        });
        skipCurrentActionEffect();
        return { ok: true, progressed: true, message: "AI 跳过可选手牌扫描" };
      }
      if (!selected) return { ok: false, blocked: true, message: "AI 没有可用于手牌扫描的手牌" };
      recordAiAutoBattleLog("hand-scan", `${player.colorLabel}AI 选择手牌扫描`, {
        handIndex: selected.handIndex,
        score: selected.score,
        card: selected.card,
      });
      return handleHandScanCardClick(selected.handIndex);
    }

    function cardTriggerNeedsFreeMove(match) {
      return match?.effect?.type === cardEffects.EFFECT_TYPES.FREE_MOVE
        || (
          match?.effect?.type === cardEffects.EFFECT_TYPES.CARD_CORNER_EVENT_REWARD
          && Boolean(match.event?.moveReward)
        );
    }

    function getCardTriggerFreeMoveEffect(match) {
      if (!match) return null;
      if (match.effect?.type === cardEffects.EFFECT_TYPES.CARD_CORNER_EVENT_REWARD
        && match.event?.moveReward) {
        return {
          ...match.effect,
          type: cardEffects.EFFECT_TYPES.FREE_MOVE,
          options: {
            ...(match.effect.options || {}),
            movementPoints: match.event.moveReward.movementPoints || 1,
          },
        };
      }
      return match.effect || null;
    }

    function listCardTriggerFreeMoveCandidates(match) {
      return listAiEffectMoveCandidates({
        id: "cardTriggerMove",
        free: true,
        effect: getCardTriggerFreeMoveEffect(match),
      });
    }

    function canAiResolveCardTriggerMatch(match) {
      const type = match?.effect?.type || null;
      if (!type) return false;
      if (type === amiba?.EFFECT_TYPES?.CHOOSE_SYMBOL_REWARD) return false;
      if (cardTriggerNeedsFreeMove(match)) {
        return listCardTriggerFreeMoveCandidates(match).length > 0;
      }
      if (type === "pick_card") return true;
      if (String(type).startsWith("card_")) {
        return canAiResolvePlayCardEffects([match.effect]).ok;
      }
      return [
        "gain_resources",
        "gain_data",
        "draw_cards",
        "launch",
        cardEffects.EFFECT_TYPES.CARD_CORNER_EVENT_REWARD,
      ].includes(type);
    }

    function runAiCardTriggerDecision() {
      if (!state.pendingCardTriggerAction) return null;
      const currentPlayer = getCurrentPlayer();
      if (!isAiAutoBattlePlayer(currentPlayer?.id)) {
        return { ok: false, blocked: true, message: `${currentPlayer?.colorLabel || "当前玩家"}需要人工选择卡牌触发` };
      }

      const matches = state.pendingCardTriggerAction.matches || [];
      const selectedIndex = matches.findIndex((match) => canAiResolveCardTriggerMatch(match));
      if (selectedIndex < 0) {
        return {
          ok: false,
          blocked: true,
          message: "AI 没有可处理的卡牌触发",
          matches: matches.map((match) => ({
            cardLabel: cards.getCardLabel(match?.card),
            effectType: match?.effect?.type || null,
            effectLabel: match?.effect?.label || null,
          })),
        };
      }

      const selected = matches[selectedIndex];
      recordAiAutoBattleLog("card-trigger", `${currentPlayer.colorLabel}AI 选择卡牌触发 ${selected.effect?.label || selected.effect?.type}`, {
        selectedIndex,
        cardLabel: cards.getCardLabel(selected.card),
        effectType: selected.effect?.type || null,
        optionCount: matches.length,
      });
      return handleCardTriggerChoice(selectedIndex);
    }

    function runAiCardTriggerFreeMoveDecision() {
      if (!state.pendingCardTriggerFreeMove) return null;
      const currentPlayer = getCurrentPlayer();
      if (!isAiAutoBattlePlayer(currentPlayer?.id)) {
        return { ok: false, blocked: true, message: `${currentPlayer?.colorLabel || "当前玩家"}需要人工选择卡牌触发移动` };
      }

      const candidates = listCardTriggerFreeMoveCandidates(state.pendingCardTriggerFreeMove.match);
      const selected = ai?.policy?.chooseTurnAction?.(candidates, {
        playerState,
        turnState,
        currentPlayer,
      }) || candidates[0] || null;
      if (!selected) return { ok: false, blocked: true, message: "AI 没有可用卡牌触发移动路径" };
      recordAiAutoBattleLog("move-path", `${currentPlayer.colorLabel}AI 选择卡牌触发移动 ${selected.rocketLabel} ${selected.directionLabel}`, {
        selected,
        candidates,
        effectType: state.pendingCardTriggerFreeMove.match?.effect?.type || null,
      });
      return executeFreeMoveForCardTrigger(selected.deltaX, selected.deltaY, selected.rocketId);
    }

    function runAiCardTaskCompletionDecision() {
      if (!state.pendingCardTaskCompletion) return null;
      const currentPlayer = getCurrentPlayer();
      if (!isAiAutoBattlePlayer(currentPlayer?.id)) {
        return { ok: false, blocked: true, message: `${currentPlayer?.colorLabel || "当前玩家"}需要人工确认任务完成` };
      }
      const ready = state.pendingCardTaskCompletion.ready || null;
      recordAiAutoBattleLog("card-task", `${currentPlayer.colorLabel}AI 确认完成任务 ${cards.getCardLabel(ready?.card)}`, {
        cardLabel: cards.getCardLabel(ready?.card),
        effectTypes: (ready?.effects || []).map((effect) => effect?.type || null).filter(Boolean),
      });
      return confirmCardTaskCompletion();
    }

    function aiNumber(value) {
      const number = Number(value);
      return Number.isFinite(number) ? number : 0;
    }

    function normalizeAiStrategyWeights(weights = {}, options = {}) {
      const base = options.merge === false ? AI_STRATEGY_WEIGHT_DEFAULTS : aiStrategyWeights;
      const normalized = {};
      for (const key of AI_STRATEGY_WEIGHT_KEYS) {
        const value = Number(weights?.[key] ?? base[key] ?? AI_STRATEGY_WEIGHT_DEFAULTS[key]);
        normalized[key] = Math.round(Math.min(1.6, Math.max(0.6, Number.isFinite(value) ? value : 1)) * 1000) / 1000;
      }
      return normalized;
    }

    function configureAiStrategyWeights(weights = {}, options = {}) {
      aiStrategyWeights = normalizeAiStrategyWeights(weights, options);
      aiStrategyDemandCache = null;
      return {
        ok: true,
        weights: { ...aiStrategyWeights },
      };
    }

    function resetAiStrategyWeights() {
      return configureAiStrategyWeights(AI_STRATEGY_WEIGHT_DEFAULTS, { merge: false });
    }

    function applyAiStrategyTuning(tuning = {}) {
      const weights = tuning?.weights || tuning;
      return configureAiStrategyWeights(weights, { merge: true });
    }

    function getAiStrategyWeights() {
      return { ...aiStrategyWeights };
    }

    function getAiStrategyWeight(key) {
      const value = Number(aiStrategyWeights?.[key]);
      return Number.isFinite(value) ? value : 1;
    }

    function applyAiStrategyWeight(value, key, strength = 1) {
      const amount = aiNumber(value);
      const weight = getAiStrategyWeight(key);
      return amount * (1 + (weight - 1) * Math.max(0, aiNumber(strength)));
    }

    function hashAiSeed(seed) {
      const text = String(seed ?? "seti-ai");
      let hash = 2166136261;
      for (let index = 0; index < text.length; index += 1) {
        hash ^= text.charCodeAt(index);
        hash = Math.imul(hash, 16777619);
      }
      return hash >>> 0;
    }

    function createAiSeededRandom(seed) {
      let state = hashAiSeed(seed);
      return function seededRandom() {
        state = (state + 0x6D2B79F5) >>> 0;
        let value = state;
        value = Math.imul(value ^ (value >>> 15), value | 1);
        value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
        return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
      };
    }

    async function runWithAiRandomSeed(seed, callback) {
      if (seed == null || seed === "") return callback();
      const originalRandom = Math.random;
      Math.random = createAiSeededRandom(seed);
      try {
        return await callback();
      } finally {
        Math.random = originalRandom;
      }
    }

    function getAiBatchSeed(options = {}, index = 0) {
      if (Array.isArray(options.seeds) && options.seeds.length) {
        return options.seeds[index % options.seeds.length];
      }
      const baseSeed = options.seed ?? options.randomSeed ?? null;
      if (baseSeed == null || baseSeed === "") return null;
      return `${baseSeed}:${index + 1}`;
    }

    function scoreAiResourceBundle(resources = {}) {
      return Object.entries(resources || {}).reduce((total, [key, value]) => (
        total + aiNumber(value) * aiNumber(AI_RESOURCE_VALUES[key])
      ), 0);
    }

    function getAiRemainingRoundWeight() {
      const round = Math.max(1, Math.round(aiNumber(turnState.roundNumber) || 1));
      return Math.max(1, FINAL_ROUND_NUMBER - round + 1);
    }

    function getAiTechCountForPlayer(player = getCurrentPlayer()) {
      return countAiPlayerTech(player);
    }

    function scoreAiCardCornerOpportunity(card) {
      let value = 0;
      const moveReward = cards.getDiscardActionMoveRewardForCard?.(card);
      if (moveReward) {
        value += aiNumber(moveReward.movementPoints || 1) * AI_RESOURCE_VALUES.additionalPublicScan;
        value += scoreAiResourceBundle(moveReward.gain || {});
      }
      if (getPublicScanChoicesForCard(card).ok) value += 3;
      const incomeGain = cards.getIncomeGainForCard?.(card);
      if (incomeGain) value += scoreAiResourceBundle(incomeGain) * Math.min(2, getAiRemainingRoundWeight() * 0.5);
      return value;
    }

    function getAiScanEffectCount(effect) {
      const options = effect?.options || {};
      if (options.allMatching && options.condition) {
        return Math.max(1, getSectorXsMatchingCondition(options.condition).length);
      }
      return Math.max(1, Math.round(aiNumber(options.count || options.repeat || options.cornerRepeat || 1)));
    }

    function scoreAiEffectValue(effect, options = {}) {
      if (!effect) return 0;
      const type = effect.type;
      const effectOptions = effect.options || {};
      switch (type) {
        case planetRewards.EFFECT_TYPES?.GAIN_RESOURCES:
        case "gain_resources":
          return scoreAiResourceBundle(effectOptions.gain || {});
        case planetRewards.EFFECT_TYPES?.GAIN_DATA:
        case "gain_data":
          return Math.max(0, Math.round(aiNumber(effectOptions.count || 1))) * AI_RESOURCE_VALUES.availableData;
        case "draw_cards":
          return Math.max(0, Math.round(aiNumber(effectOptions.count || 1))) * AI_RESOURCE_VALUES.handSize;
        case "pick_card":
          return 3;
        case "launch":
          return 6;
        case "research_tech_select":
        case cardEffects.EFFECT_TYPES.RESEARCH_TECH:
          return 10;
        case "research_tech_bonus":
          return 3;
        case cardEffects.EFFECT_TYPES.CARD_MOVE:
        case cardEffects.EFFECT_TYPES.FREE_MOVE:
          return 2 + Math.max(1, Math.round(aiNumber(effectOptions.movementPoints || 1))) * 1.5;
        case cardEffects.EFFECT_TYPES.CARD_ORBIT:
          return 9;
        case cardEffects.EFFECT_TYPES.CARD_LAND:
          return 11;
        case cardEffects.EFFECT_TYPES.PUBLIC_SCAN:
          return 4.5;
        case cardEffects.EFFECT_TYPES.HAND_SCAN:
          return effectOptions.optional ? 2 : 3;
        case cardEffects.EFFECT_TYPES.OPTIONAL_DISCARD_SCAN: {
          const handScans = Math.min(
            Math.max(1, Math.round(aiNumber(effectOptions.count || 1))),
            (getCurrentPlayer()?.hand || []).filter((card) => getPublicScanChoicesForCard(card).ok).length,
          );
          return handScans * 2.5;
        }
        case cardEffects.EFFECT_TYPES.SECTOR_X_SCAN:
        case cardEffects.EFFECT_TYPES.PLANET_SECTOR_SCAN:
        case cardEffects.EFFECT_TYPES.SCAN_COLOR_CHOICE:
        case cardEffects.EFFECT_TYPES.CONDITIONAL_SECTOR_SCAN:
        case cardEffects.EFFECT_TYPES.CHOOSE_NEBULA_SCAN:
        case cardEffects.EFFECT_TYPES.SCAN_ACTION:
          return getAiScanEffectCount(effect) * (effectOptions.gainData === false ? 3 : 4.5)
            + getAiTechCountForPlayer() * 0.75;
        case cardEffects.EFFECT_TYPES.CONDITIONAL_REWARD:
          return (effectOptions.rewards || [])
            .reduce((total, reward) => total + scoreAiEffectValue(reward, options), 0) * 0.8;
        case cardEffects.EFFECT_TYPES.REGISTER_EVENT_BONUS:
          return 2.5;
        case cardEffects.EFFECT_TYPES.PLUTO_RESERVE:
          return 8;
        case cardEffects.EFFECT_TYPES.RETURN_PLAYED_CARD_TO_HAND_IF:
          return 1.5;
        default:
          return String(type || "").startsWith("card_") ? 2 : 0;
      }
    }

    function createAiStrategyDemand() {
      return {
        actions: {},
        scanColors: {},
        techTypes: {},
        planetIds: {},
        locationTypes: {},
        distanceFromEarth: {
          minDistance: 0,
          weight: 0,
        },
        traceTypes: {},
        resources: {},
        task: 0,
        final: 0,
      };
    }

    function addAiMapDemand(map, key, amount) {
      if (!key) return;
      const value = aiNumber(amount);
      if (!value) return;
      map[key] = (map[key] || 0) + value;
    }

    function getAiMapDemand(map, key) {
      return Math.max(0, aiNumber(map?.[key]));
    }

    function addAiActionDemand(demand, actionId, amount) {
      addAiMapDemand(demand.actions, actionId, amount);
    }

    function addAiAllScanColorDemand(demand, amount) {
      for (const color of AI_SCAN_COLORS) addAiMapDemand(demand.scanColors, color, amount);
    }

    function addAiAllTechDemand(demand, amount) {
      for (const techType of AI_TECH_TYPES) addAiMapDemand(demand.techTypes, techType, amount);
    }

    function addAiAllTraceDemand(demand, amount) {
      for (const traceType of AI_TRACE_TYPES) addAiMapDemand(demand.traceTypes, traceType, amount);
    }

    function getAiMissingCount(current, required = 1) {
      return Math.max(0, Math.round(aiNumber(required)) - Math.max(0, Math.round(aiNumber(current))));
    }

    function getAiTaskRewardValue(task) {
      return (task?.rewards || []).reduce((total, reward) => (
        total + scoreAiEffectValue(reward)
      ), 0);
    }

    function addAiPlanetDemand(demand, planetId, amount) {
      if (!planetId || planetId === "earth") return;
      addAiMapDemand(demand.planetIds, planetId, amount);
      addAiActionDemand(demand, "move", amount * 0.25);
      addAiActionDemand(demand, "launch", amount * 0.12);
    }

    function addAiProbeLocationDemand(demand, locationType, amount) {
      if (!locationType) return;
      addAiMapDemand(demand.locationTypes, locationType, amount);
      addAiActionDemand(demand, "move", amount * 0.8);
      addAiActionDemand(demand, "launch", amount * 0.25);
    }

    function addAiProbeDistanceDemand(demand, minDistance, amount) {
      const distance = Math.max(1, Math.round(aiNumber(minDistance) || 1));
      demand.distanceFromEarth.minDistance = Math.max(
        aiNumber(demand.distanceFromEarth.minDistance),
        distance,
      );
      demand.distanceFromEarth.weight += Math.max(0, aiNumber(amount));
      addAiActionDemand(demand, "move", amount * 0.85);
      addAiActionDemand(demand, "launch", amount * 0.2);
    }

    function addAiTaskConditionDemand(demand, task, weight, player, context) {
      const condition = task?.condition;
      if (!condition) return;
      const rewardWeight = Math.max(1, getAiTaskRewardValue(task) * 0.18);
      const amount = Math.max(0.5, aiNumber(weight)) * rewardWeight;
      switch (condition.type) {
        case "completedSectorsByColor": {
          const missing = getAiMissingCount(
            endGameScoring.countSectorWinsByColor(player, nebulaDataState, condition.color),
            condition.count || 1,
          );
          addAiMapDemand(demand.scanColors, condition.color, amount * Math.max(1, missing));
          addAiActionDemand(demand, "scan", amount * 0.9);
          break;
        }
        case "completedSectors": {
          const missing = getAiMissingCount(endGameScoring.countSectorWins(player, nebulaDataState), condition.count || 1);
          addAiAllScanColorDemand(demand, amount * Math.max(1, missing) * 0.5);
          addAiActionDemand(demand, "scan", amount);
          break;
        }
        case "completedSameSectorColor":
          addAiAllScanColorDemand(demand, amount * 0.65);
          addAiActionDemand(demand, "scan", amount);
          break;
        case "distinctSignalSectors":
        case "signalsInAllColors":
        case "signalsOrWinsInAllSectors":
          addAiAllScanColorDemand(demand, amount * 0.7);
          addAiActionDemand(demand, "scan", amount * 1.1);
          break;
        case "techCount": {
          const missing = getAiMissingCount(
            endGameScoring.countOwnedTech(player, condition.techType),
            condition.count || 1,
          );
          addAiMapDemand(demand.techTypes, condition.techType, amount * Math.max(1, missing));
          addAiActionDemand(demand, "researchTech", amount * 0.8);
          break;
        }
        case "planetOrbitOrLand":
          addAiPlanetDemand(demand, condition.planetId, amount * 1.2);
          addAiActionDemand(demand, "orbit", amount * 0.45);
          addAiActionDemand(demand, "land", amount * 0.45);
          break;
        case "planetOrbitOrLandAll":
          for (const planetId of condition.planetIds || []) {
            if (endGameScoring.countPlanetOrbitOrLand(player, planetStatsState, planetId) <= 0) {
              addAiPlanetDemand(demand, planetId, amount);
            }
          }
          addAiActionDemand(demand, "orbit", amount * 0.35);
          addAiActionDemand(demand, "land", amount * 0.35);
          break;
        case "samePlanetOrbitAndLand":
          addAiActionDemand(demand, "orbit", amount * 0.9);
          addAiActionDemand(demand, "land", amount * 0.9);
          addAiActionDemand(demand, "move", amount * 0.4);
          break;
        case "orbitCount": {
          const missing = getAiMissingCount(
            endGameScoring.countOrbitOrLandMarkers(player, planetStatsState),
            condition.count || 1,
          );
          addAiActionDemand(demand, "orbit", amount * Math.max(1, missing));
          addAiActionDemand(demand, "move", amount * 0.3);
          break;
        }
        case "landingCount":
          addAiActionDemand(demand, "land", amount * 1.1);
          addAiActionDemand(demand, "move", amount * 0.35);
          break;
        case "orbitOrLandCount":
          addAiActionDemand(demand, "orbit", amount * 0.7);
          addAiActionDemand(demand, "land", amount * 0.7);
          addAiActionDemand(demand, "move", amount * 0.35);
          break;
        case "probeLocation":
          addAiProbeLocationDemand(demand, condition.locationType, amount * 1.2);
          break;
        case "probeDistanceFromEarth":
          addAiProbeDistanceDemand(demand, condition.minDistance, amount);
          break;
        case "probeAdjacentEarth":
          addAiProbeLocationDemand(demand, "earthAdjacent", amount);
          break;
        case "probeAdjacentEarthAsteroid":
          addAiProbeLocationDemand(demand, "earthAdjacentAsteroid", amount * 1.2);
          break;
        case "probesOnDifferentPlanets":
        case "otherProbeAtPlanet":
          addAiActionDemand(demand, "move", amount);
          addAiActionDemand(demand, "launch", amount * 0.45);
          break;
        case "traceCount":
        case "allAliensHaveTrace":
        case "allAliensHavePlayerTrace":
          addAiMapDemand(demand.traceTypes, condition.traceType, amount);
          break;
        case "singleAlienTraceSet":
          for (const traceType of condition.traceTypes || []) addAiMapDemand(demand.traceTypes, traceType, amount * 0.6);
          break;
        case "yichangdianAllTraceTypes":
        case "aomomoAllTraceTypes":
        case "aomomoFossilSpendingTrace":
          addAiAllTraceDemand(demand, amount * 0.75);
          break;
        case "resourceThreshold":
          addAiMapDemand(demand.resources, condition.resource, amount * 0.5);
          if (condition.resource === "score") demand.task += amount * 0.4;
          break;
        case "dataTotal":
          addAiMapDemand(demand.resources, "availableData", amount);
          addAiActionDemand(demand, "scan", amount * 0.45);
          break;
        case "handEmpty":
        case "resourcesAndHandEmpty":
        case "resourceEquals":
          demand.task += amount * 0.35;
          break;
        case "aomomoLanding":
          addAiPlanetDemand(demand, aomomo?.PLANET_ID, amount);
          addAiActionDemand(demand, "land", amount * 0.7);
          break;
        case "aomomoFossils":
          addAiMapDemand(demand.resources, "aomomoFossils", amount);
          break;
        default:
          demand.task += amount * 0.2;
          break;
      }
      demand.task += amount * 0.25;
      void context;
    }

    function addAiEventDemand(demand, event, effect, weight) {
      if (!event) return;
      const amount = Math.max(0.5, aiNumber(weight));
      const eventTypes = event.types || (event.type ? [event.type] : []);
      for (const eventType of eventTypes) {
        if (eventType === "scanAction") {
          addAiActionDemand(demand, "scan", amount);
        } else if (eventType === "signalMarked") {
          addAiMapDemand(demand.scanColors, event.color, amount * 0.9);
          addAiActionDemand(demand, "scan", amount * 0.6);
        } else if (eventType === "researchTech") {
          if (event.techType) addAiMapDemand(demand.techTypes, event.techType, amount);
          for (const techType of event.techTypes || []) addAiMapDemand(demand.techTypes, techType, amount);
          if (!event.techType && !event.techTypes) addAiAllTechDemand(demand, amount * 0.35);
          addAiActionDemand(demand, "researchTech", amount * 0.5);
        } else if (eventType === "visitPlanet") {
          for (const planetId of event.planetIds || []) addAiPlanetDemand(demand, planetId, amount);
          if (!event.planetIds?.length) addAiActionDemand(demand, "move", amount);
        } else if (eventType === "orbit") {
          addAiActionDemand(demand, "orbit", amount);
          for (const planetId of event.planetIds || []) addAiPlanetDemand(demand, planetId, amount);
        } else if (eventType === "land") {
          addAiActionDemand(demand, "land", amount);
          for (const planetId of event.planetIds || []) addAiPlanetDemand(demand, planetId, amount);
        } else if (eventType === "launch") {
          addAiActionDemand(demand, "launch", amount);
        } else if (eventType === "playCard") {
          addAiActionDemand(demand, "playCard", amount);
        } else if (eventType === "visitAsteroid" || eventType === "visitComet") {
          addAiActionDemand(demand, "move", amount);
        }
      }
      if (effect) addAiEffectDemand(demand, effect, amount * 0.5);
    }

    function addAiEffectDemand(demand, effect, weight) {
      if (!effect) return;
      const type = effect.type;
      const options = effect.options || {};
      const amount = Math.max(0.5, aiNumber(weight));
      if (type === "launch") {
        addAiActionDemand(demand, "launch", amount);
      } else if (type === "research_tech_select" || type === cardEffects.EFFECT_TYPES.RESEARCH_TECH) {
        const techTypes = options.techTypes || options.allowedTechTypes || [];
        if (techTypes.length) {
          for (const techType of techTypes) addAiMapDemand(demand.techTypes, techType, amount);
        } else {
          addAiAllTechDemand(demand, amount * 0.35);
        }
        addAiActionDemand(demand, "researchTech", amount * 0.4);
      } else if (type === cardEffects.EFFECT_TYPES.CARD_MOVE || type === cardEffects.EFFECT_TYPES.FREE_MOVE) {
        addAiActionDemand(demand, "move", amount);
      } else if (type === cardEffects.EFFECT_TYPES.CARD_ORBIT) {
        addAiActionDemand(demand, "orbit", amount);
      } else if (type === cardEffects.EFFECT_TYPES.CARD_LAND) {
        addAiActionDemand(demand, "land", amount);
      } else if (
        type === cardEffects.EFFECT_TYPES.PUBLIC_SCAN
        || type === cardEffects.EFFECT_TYPES.HAND_SCAN
        || type === cardEffects.EFFECT_TYPES.SECTOR_X_SCAN
        || type === cardEffects.EFFECT_TYPES.PLANET_SECTOR_SCAN
        || type === cardEffects.EFFECT_TYPES.CONDITIONAL_SECTOR_SCAN
        || type === cardEffects.EFFECT_TYPES.CHOOSE_NEBULA_SCAN
        || type === cardEffects.EFFECT_TYPES.SCAN_ACTION
        || type === cardEffects.EFFECT_TYPES.SCAN_NEBULA
        || type === cardEffects.EFFECT_TYPES.ANY_SECTOR_SCAN
        || type === cardEffects.EFFECT_TYPES.SCAN_COLOR_CHOICE
      ) {
        addAiActionDemand(demand, "scan", amount);
        if (options.color) addAiMapDemand(demand.scanColors, options.color, amount);
        if (options.nebulaId) addAiMapDemand(demand.scanColors, data.getNebulaColor?.(options.nebulaId), amount * 0.75);
      } else if (type === planetRewards.EFFECT_TYPES?.GAIN_DATA || type === "gain_data") {
        addAiMapDemand(demand.resources, "availableData", amount * Math.max(1, aiNumber(options.count || 1)));
      } else if (type === "draw_cards") {
        addAiMapDemand(demand.resources, "handSize", amount);
      } else if (type === "alien_trace") {
        for (const traceType of options.traceTypes || options.types || []) addAiMapDemand(demand.traceTypes, traceType, amount);
      }
    }

    function addAiEndGameRuleDemand(demand, rule, weight) {
      if (!rule) return;
      const amount = Math.max(0.5, aiNumber(weight));
      demand.final += amount * 0.4;
      switch (rule.kind) {
        case "sectorWinsByColor":
          addAiMapDemand(demand.scanColors, rule.color, amount * Math.max(1, aiNumber(rule.scorePer) * 0.4));
          addAiActionDemand(demand, "scan", amount * 0.7);
          break;
        case "distinctSignalSectors":
          addAiAllScanColorDemand(demand, amount * 0.45);
          addAiActionDemand(demand, "scan", amount * 0.8);
          break;
        case "techCount":
          addAiMapDemand(demand.techTypes, rule.techType, amount * Math.max(1, aiNumber(rule.scorePer) * 0.35));
          addAiActionDemand(demand, "researchTech", amount * 0.55);
          break;
        case "planetOrbitOrLand":
          addAiPlanetDemand(demand, rule.planetId, amount * Math.max(1, aiNumber(rule.scorePer) * 0.25));
          addAiActionDemand(demand, "orbit", amount * 0.35);
          addAiActionDemand(demand, "land", amount * 0.35);
          break;
        case "allOrbitOrLand":
        case "planetLandingPairs":
          addAiActionDemand(demand, "orbit", amount * 0.45);
          addAiActionDemand(demand, "land", amount * 0.65);
          addAiActionDemand(demand, "move", amount * 0.35);
          break;
        case "traceCount":
        case "amibaTraceCount":
          addAiMapDemand(demand.traceTypes, rule.traceType, amount * Math.max(1, aiNumber(rule.scorePer) * 0.35));
          break;
        case "aomomoTraceCount":
        case "chongTraceCount":
          addAiAllTraceDemand(demand, amount * 0.4);
          break;
        case "remainingResource":
          addAiMapDemand(demand.resources, rule.resource, amount * Math.max(1, aiNumber(rule.scorePer) * 0.3));
          if (rule.resource === "availableData") addAiActionDemand(demand, "scan", amount * 0.35);
          break;
        case "probeLocation":
          addAiProbeLocationDemand(demand, rule.locationType, amount * Math.max(1, aiNumber(rule.score) * 0.25));
          break;
        case "unmarkedFinalRightmost":
          demand.final += amount;
          break;
        default:
          demand.final += amount * 0.2;
          break;
      }
    }

    function addAiFinalTileDemand(demand, player, context) {
      finalScoring.ensureFinalScoringState(finalScoringState);
      for (const tile of Object.values(finalScoringState.tiles || {})) {
        const mark = (tile.marks || []).find((entry) => entry.playerId === player?.id);
        if (!mark) continue;
        const variant = finalScoring.getTileVariant(finalScoringState, tile.id);
        const formulaId = endGameScoring.getFormulaId(tile.id, variant);
        const multiplier = Math.max(1, aiNumber(endGameScoring.getSlotMultiplier(formulaId, mark.slotIndex)));
        const amount = multiplier * 0.65;
        demand.final += amount;
        if (formulaId === "a1" || formulaId === "a2") {
          addAiMapDemand(demand.resources, "credits", amount * 0.4);
          addAiMapDemand(demand.resources, "energy", amount * 0.4);
          addAiMapDemand(demand.resources, "handSize", amount * 0.35);
        } else if (formulaId === "b1") {
          addAiAllTraceDemand(demand, amount);
        } else if (formulaId === "b2") {
          addAiActionDemand(demand, "orbit", amount * 0.7);
          addAiActionDemand(demand, "land", amount * 0.7);
          addAiActionDemand(demand, "scan", amount * 0.7);
          addAiAllScanColorDemand(demand, amount * 0.35);
        } else if (formulaId === "c1" || formulaId === "c2") {
          demand.task += amount * 1.2;
          addAiActionDemand(demand, "playCard", amount * 0.4);
        } else if (formulaId === "d1" || formulaId === "d2") {
          addAiAllTechDemand(demand, amount);
          addAiActionDemand(demand, "researchTech", amount * 0.6);
        }
      }
      void context;
    }

    function addAiCardModelDemand(demand, card, model, weight, player, context) {
      if (!model) return;
      const completedTaskIds = new Set(card?.cardEffectState?.completedTaskIds || []);
      for (const task of model.tasks || []) {
        if (completedTaskIds.has(task.id)) continue;
        addAiTaskConditionDemand(demand, task, weight, player, context);
      }
      for (const trigger of model.triggers || []) {
        const consumed = new Set(card?.cardEffectState?.consumedTriggerIds || []);
        if (consumed.has(trigger.id)) continue;
        addAiEventDemand(demand, trigger.event, trigger.effect, weight * 0.8);
      }
      for (const effect of model.playEffects || []) {
        addAiEffectDemand(demand, effect, weight * 0.35);
      }
      if (model.endGameScoring) {
        addAiEndGameRuleDemand(demand, model.endGameScoring, weight * 1.2);
      }
    }

    function getAiStrategyDemandCacheKey(player = getCurrentPlayer()) {
      if (!player) return "none";
      const resources = player.resources || {};
      const finalMarkCount = Object.values(finalScoringState?.tiles || {})
        .reduce((total, tile) => total + (tile?.marks?.length || 0), 0);
      return [
        player.id || player.color || "unknown",
        turnState.roundNumber,
        turnState.turnNumber,
        aiAutoBattleState.logs.length,
        aiAutoBattleState.bugs.length,
        Math.round(aiNumber(resources.score)),
        Math.round(aiNumber(resources.credits)),
        Math.round(aiNumber(resources.energy)),
        Math.round(aiNumber(resources.publicity)),
        Math.round(aiNumber(resources.availableData)),
        (player.hand || []).length,
        (player.reservedCards || []).length,
        Math.round(aiNumber(player.completedTaskCount)),
        countAiPlayerTech(player),
        finalMarkCount,
      ].join("|");
    }

    function getAiStrategyDemand(player = getCurrentPlayer()) {
      const cacheKey = getAiStrategyDemandCacheKey(player);
      if (aiStrategyDemandCache?.key === cacheKey) return aiStrategyDemandCache.value;
      const demand = createAiStrategyDemand();
      if (!player) {
        aiStrategyDemandCache = { key: cacheKey, value: demand };
        return demand;
      }
      const context = {
        ...createActionContext(),
        finalScoringState,
        cardEffects,
        getCardTypeCode,
      };
      addAiFinalTileDemand(demand, player, context);
      for (const card of player.reservedCards || []) {
        addAiCardModelDemand(demand, card, cardEffects.getCardModel?.(card), 1, player, context);
      }
      for (const card of player.hand || []) {
        const typeCode = getCardTypeCode(card);
        const handWeight = typeCode === 2 || typeCode === 3 ? 0.35 : 0.18;
        addAiCardModelDemand(demand, card, cardEffects.getCardModel?.(card), handWeight, player, context);
      }
      aiStrategyDemandCache = { key: cacheKey, value: demand };
      return demand;
    }

    function scoreAiCardDemandFit(card, model, playEffects, player = getCurrentPlayer()) {
      if (!card || !model) return 0;
      const demand = getAiStrategyDemand(player);
      let value = 0;
      for (const effect of playEffects || []) {
        const type = effect?.type;
        const options = effect?.options || {};
        if (type === "launch") value += getAiMapDemand(demand.actions, "launch") * 0.12 * getAiStrategyWeight("route");
        if (type === cardEffects.EFFECT_TYPES.CARD_MOVE || type === cardEffects.EFFECT_TYPES.FREE_MOVE) {
          value += getAiMapDemand(demand.actions, "move") * 0.12 * getAiStrategyWeight("move");
        }
        if (type === cardEffects.EFFECT_TYPES.CARD_ORBIT) value += getAiMapDemand(demand.actions, "orbit") * 0.16 * getAiStrategyWeight("orbitLand");
        if (type === cardEffects.EFFECT_TYPES.CARD_LAND) value += getAiMapDemand(demand.actions, "land") * 0.16 * getAiStrategyWeight("orbitLand");
        if (type === "research_tech_select" || type === cardEffects.EFFECT_TYPES.RESEARCH_TECH) {
          const techTypes = options.techTypes || options.allowedTechTypes || AI_TECH_TYPES;
          const bestTechDemand = techTypes.length
            ? Math.max(...techTypes.map((techType) => getAiMapDemand(demand.techTypes, techType)))
            : 0;
          value += bestTechDemand * 0.18 * getAiStrategyWeight("tech");
        }
        if (isAiCardScanEffectType(type)) {
          const scanWeight = getAiStrategyWeight("scan");
          value += getAiMapDemand(demand.actions, "scan") * 0.1 * scanWeight;
          if (options.color) value += getAiMapDemand(demand.scanColors, options.color) * 0.18 * scanWeight;
          if (options.nebulaId) value += getAiMapDemand(demand.scanColors, data.getNebulaColor?.(options.nebulaId)) * 0.14 * scanWeight;
        }
      }
      if (model.tasks?.length) value += Math.min(4, demand.task * 0.08 * getAiStrategyWeight("task"));
      if (model.endGameScoring) value += Math.min(5, demand.final * 0.12 * getAiStrategyWeight("final"));
      return applyAiStrategyWeight(value, "playCard", 0.8);
    }

    function isAiCardScanEffectType(type) {
      return type === cardEffects.EFFECT_TYPES.PUBLIC_SCAN
        || type === cardEffects.EFFECT_TYPES.HAND_SCAN
        || type === cardEffects.EFFECT_TYPES.OPTIONAL_DISCARD_SCAN
        || type === cardEffects.EFFECT_TYPES.SECTOR_X_SCAN
        || type === cardEffects.EFFECT_TYPES.PLANET_SECTOR_SCAN
        || type === cardEffects.EFFECT_TYPES.CONDITIONAL_SECTOR_SCAN
        || type === cardEffects.EFFECT_TYPES.CHOOSE_NEBULA_SCAN
        || type === cardEffects.EFFECT_TYPES.LANDING_SECTOR_SCAN
        || type === cardEffects.EFFECT_TYPES.DRAW_THEN_SCAN
        || type === cardEffects.EFFECT_TYPES.SCAN_ACTION
        || type === cardEffects.EFFECT_TYPES.SCAN_NEBULA
        || type === cardEffects.EFFECT_TYPES.ANY_SECTOR_SCAN
        || type === cardEffects.EFFECT_TYPES.SCAN_COLOR_CHOICE;
    }

    function scoreAiCardEndGameExpectedValue(card, model, player = getCurrentPlayer()) {
      if (!card || !model?.endGameScoring || !player || !endGameScoring?.scoreCardEndGameRule) return 0;
      const simulatedPlayer = {
        ...player,
        reservedCards: [
          ...(Array.isArray(player.reservedCards) ? player.reservedCards : []),
          card,
        ],
      };
      const context = {
        ...createActionContext(),
        finalScoringState,
        cardEffects,
        getCardTypeCode,
      };
      return Math.max(0, aiNumber(endGameScoring.scoreCardEndGameRule(
        model.endGameScoring,
        simulatedPlayer,
        context,
      )));
    }

    function scoreAiPlayCardRoutePlan(card, model, playEffects, player = getCurrentPlayer()) {
      if (!card || !model || !player) return null;
      const demand = getAiStrategyDemand(player);
      const plans = [];
      const cardId = card.cardId || card.id || null;
      const addPlan = (actionId, label, score, details = {}) => {
        const value = aiNumber(score);
        if (value <= 0) return;
        plans.push({
          type: "card-synergy",
          mainActionId: "playCard",
          actionId,
          label,
          score: value,
          cardId,
          ...details,
        });
      };

      const routeDemand = getAiTotalRouteDemand(demand);
      const planetDemand = sumAiDemandMap(demand.planetIds);
      const moveDemand = getAiMapDemand(demand.actions, "move");
      const scanDemand = getAiMapDemand(demand.actions, "scan") + sumAiDemandMap(demand.scanColors) * 0.35;
      const engineDemand = getAiMapDemand(demand.actions, "playCard") + demand.task * 0.08 + demand.final * 0.08;
      const endGameExpectedScore = scoreAiCardEndGameExpectedValue(card, model, player);

      for (const effect of playEffects || []) {
        const type = effect?.type;
        const options = effect?.options || {};
        if (type === "launch") {
          addPlan(
            "launch",
            "打牌触发发射路线",
            getAiMapDemand(demand.actions, "launch") * 0.18
              + routeDemand * 0.08
              + Math.max(0, scoreAiLaunchAction(player)) * 0.12,
            { effectType: type },
          );
        } else if (type === cardEffects.EFFECT_TYPES.CARD_MOVE || type === cardEffects.EFFECT_TYPES.FREE_MOVE) {
          addPlan(
            "move",
            "打牌获得移动并靠近路线目标",
            moveDemand * 0.2
              + routeDemand * 0.08
              + Math.max(0, aiNumber(options.movementPoints || 1)) * 0.45,
            { effectType: type, movementPoints: options.movementPoints ?? null },
          );
        } else if (type === cardEffects.EFFECT_TYPES.CARD_ORBIT) {
          addPlan(
            "orbit",
            "打牌衔接环绕目标",
            getAiMapDemand(demand.actions, "orbit") * 0.24
              + planetDemand * 0.08
              + routeDemand * 0.04,
            { effectType: type },
          );
        } else if (type === cardEffects.EFFECT_TYPES.CARD_LAND) {
          addPlan(
            "land",
            "打牌衔接登陆目标",
            getAiMapDemand(demand.actions, "land") * 0.26
              + planetDemand * 0.09
              + routeDemand * 0.05,
            { effectType: type },
          );
        } else if (type === "research_tech_select" || type === cardEffects.EFFECT_TYPES.RESEARCH_TECH) {
          const techTypes = options.techTypes || options.allowedTechTypes || AI_TECH_TYPES;
          const bestTechDemand = techTypes.length
            ? Math.max(...techTypes.map((techType) => getAiMapDemand(demand.techTypes, techType)))
            : 0;
          addPlan(
            "researchTech",
            "打牌获得科技并补强引擎",
            getAiMapDemand(demand.actions, "researchTech") * 0.2
              + bestTechDemand * 0.24
              + engineDemand * 0.08,
            { effectType: type, techTypes },
          );
        } else if (isAiCardScanEffectType(type)) {
          const colorDemand = options.color
            ? getAiMapDemand(demand.scanColors, options.color)
            : 0;
          const nebulaDemand = options.nebulaId
            ? getAiMapDemand(demand.scanColors, data.getNebulaColor?.(options.nebulaId))
            : 0;
          addPlan(
            "scan",
            "打牌触发扫描路线",
            scanDemand * 0.16
              + colorDemand * 0.22
              + nebulaDemand * 0.18
              + getAiAvailableDataRoom(player) * 0.12,
            { effectType: type, color: options.color || null, nebulaId: options.nebulaId || null },
          );
        }
      }

      if (model.tasks?.length) {
        addPlan(
          "task",
          "打牌推进任务牌",
          demand.task * 0.18 + engineDemand * 0.05 + model.tasks.length * 0.35,
          { taskCount: model.tasks.length },
        );
      }
      if (model.endGameScoring) {
        addPlan(
          "final",
          "打牌建立终局得分路线",
          demand.final * 0.2
            + Math.max(0, getAiRemainingRoundWeight() - 1) * 0.35
            + endGameExpectedScore * 0.18,
          { endGameScoring: true, endGameExpectedScore },
        );
      }

      return plans
        .filter((plan) => Number.isFinite(Number(plan.score)))
        .sort((left, right) => right.score - left.score)[0] || null;
    }

    function scoreAiPlayCardValue(card, details = {}) {
      const model = details.model || cardEffects.getCardModel?.(card) || null;
      const playEffects = details.playEffects || cardEffects.buildPlayEffects?.(card) || [];
      const cost = details.cost || getCardPlayCost(card);
      const price = details.price ?? getCardPrice(card);
      const typeCode = details.typeCode ?? getCardTypeCode(card);
      const reservesAfterPlay = details.reservesAfterPlay ?? (
        [1, 2, 3].includes(typeCode) || Boolean(model?.reserveAfterPlay)
      );
      const effectValue = playEffects.reduce((total, effect) => total + scoreAiEffectValue(effect), 0);
      const reserveValue = reservesAfterPlay
        ? 4 + (model?.tasks?.length || 0) * 3 + (model?.triggers?.length || 0) * 2
        : 0;
      const endGameValue = model?.endGameScoring ? 5 + getAiRemainingRoundWeight() * 0.5 : 0;
      const plutoValue = model?.pluto ? 8 : 0;
      const costValue = scoreAiResourceBundle(cost);
      const cornerOpportunity = scoreAiCardCornerOpportunity(card);
      const demandFit = scoreAiCardDemandFit(card, model, playEffects);
      const endGameExpectedScore = details.endGameExpectedScore ?? scoreAiCardEndGameExpectedValue(card, model);
      const routePlan = details.plan || scoreAiPlayCardRoutePlan(card, model, playEffects);
      return effectValue
        + reserveValue
        + endGameValue
        + plutoValue
        + demandFit
        + applyAiStrategyWeight(Math.min(10, endGameExpectedScore * 0.55), "final", 0.6)
        + applyAiStrategyWeight(Math.max(0, aiNumber(routePlan?.score)), "playCard", 0.35)
        + Math.max(0, 4 - aiNumber(price)) * 0.5
        - costValue
        - cornerOpportunity * 0.45;
    }

    function getAiCircularDistanceX(leftX, rightX) {
      const delta = Math.abs(solar.mod8(leftX) - solar.mod8(rightX));
      return Math.min(delta, 8 - delta);
    }

    function getAiSectorDistance(left, right) {
      if (!left || !right) return 99;
      return getAiCircularDistanceX(left.x, right.x) + Math.abs(aiNumber(left.y) - aiNumber(right.y));
    }

    function getAiCoordinateDistanceFromEarth(coordinate) {
      if (!coordinate) return null;
      const earth = getEarthSectorCoordinate();
      const dx = getAiCircularDistanceX(coordinate.x, earth.x);
      return dx + Math.abs(Number(coordinate.y) - Number(earth.y));
    }

    function isAiCoordinateAdjacentToEarth(coordinate) {
      if (!coordinate) return false;
      const earth = getEarthSectorCoordinate();
      const dx = getAiCircularDistanceX(coordinate.x, earth.x);
      return (Number(coordinate.y) === Number(earth.y) && dx === 1)
        || (Number(coordinate.x) === Number(earth.x) && Number(coordinate.y) === Number(earth.y) + 1);
    }

    function getAiAdjacentEarthCoordinates() {
      const earth = getEarthSectorCoordinate();
      return [
        { x: solar.mod8(earth.x - 1), y: earth.y, label: "地球左邻" },
        { x: solar.mod8(earth.x + 1), y: earth.y, label: "地球右邻" },
        { x: earth.x, y: earth.y + 1, label: "地球外侧邻位" },
      ].filter((coordinate) => (
        coordinate.y >= rocketActions.SECTOR_RING_MIN
        && coordinate.y <= rocketActions.SECTOR_RING_MAX
      ));
    }

    function sumAiDemandMap(map = {}) {
      return Object.values(map || {}).reduce((total, value) => total + Math.max(0, aiNumber(value)), 0);
    }

    function getAiTotalRouteDemand(demand = {}) {
      return sumAiDemandMap(demand.planetIds)
        + sumAiDemandMap(demand.locationTypes)
        + Math.max(0, aiNumber(demand.distanceFromEarth?.weight));
    }

    function canAiPlanetAcceptOrbit(planetId) {
      if (planetId === "earth") return false;
      if (planetId === aomomo?.PLANET_ID) return Boolean(aomomo?.canAddOrbitMarker?.(alienGameState));
      return planetStats.canAddOrbitMarker(planetStatsState, planetId);
    }

    function canAiPlanetAcceptLanding(planetId, player = getCurrentPlayer()) {
      if (planetId === "earth") return false;
      if (planetId === aomomo?.PLANET_ID) return Boolean(aomomo?.canAddLandingMarker?.(alienGameState));
      if (planetStats.canAddLandingMarker(planetStatsState, planetId)) return true;
      return players.playerOwnsTech(player, "orange4", createActionContext())
        && planetStats.getAvailableSatellitesForLanding(planetStatsState, planetId).length > 0;
    }

    function scoreAiPlanetTarget(planet, player = getCurrentPlayer()) {
      if (!planet || planet.planetId === "earth") return 0;
      const context = createActionContext();
      const demand = getAiStrategyDemand(player);
      const planetDemand = getAiMapDemand(demand.planetIds, planet.planetId);
      let value = 0;
      if (canAiPlanetAcceptOrbit(planet.planetId)) {
        value += 9;
        if (players.canAfford(player, abilities.planet.DEFAULT_ORBIT_COST)) value += 3;
      }
      if (canAiPlanetAcceptLanding(planet.planetId, player)) {
        const landEnergyCost = abilities.planet.getLandEnergyCost(context, planet.planetId);
        value += 11 - Math.min(4, landEnergyCost);
        if (players.canAfford(player, landEnergyCost > 0 ? { energy: landEnergyCost } : {})) value += 3;
      }
      if (planet.planetId === "jupiter" || planet.planetId === "mars") value += 1.5;
      if (planet.planetId === "venus" || planet.planetId === "mercury") value += 1;
      value += planetDemand * 1.1 * getAiStrategyWeight("route");
      value += Math.min(4, (
        getAiMapDemand(demand.actions, "orbit")
        + getAiMapDemand(demand.actions, "land")
      ) * 0.08 * getAiStrategyWeight("orbitLand"));
      return value;
    }

    function getAiPlanetAtCoordinate(coordinate) {
      if (!coordinate) return null;
      const x = solar.mod8(coordinate.x);
      const y = aiNumber(coordinate.y);
      return solar.createSolarSnapshot(solarState).planetLocations
        .find((planet) => planet.x === x && planet.y === y && planet.planetId !== "earth") || null;
    }

    function isAiLandingEffect(effect) {
      return effect?.type === cardEffects.EFFECT_TYPES.CARD_LAND
        || effect?.type === "aomomo_land_only";
    }

    function getAiNextActionEffect(offset = 1) {
      if (!state.pendingActionEffectFlow) return null;
      const currentIndex = Math.max(0, Math.round(aiNumber(state.pendingActionEffectFlow.currentIndex)));
      return state.pendingActionEffectFlow.effects?.[currentIndex + offset] || null;
    }

    function getAiLandEffectCost(effect, planetId) {
      const options = effect?.options || {};
      if (options.skipCost) return {};
      if (options.cost && typeof options.cost === "object" && !Array.isArray(options.cost)) {
        return { ...options.cost };
      }
      return { energy: abilities.planet.getLandEnergyCost(createActionContext(), planetId) };
    }

    function scoreAiLandingAfterMove(coordinate, effect, player = getCurrentPlayer()) {
      if (!isAiLandingEffect(effect)) return { ok: true, score: 0, planet: null };
      const planet = getAiPlanetAtCoordinate(coordinate);
      if (!planet) return { ok: false, score: -Infinity, planet: null };
      if (!canAiPlanetAcceptLanding(planet.planetId, player)) {
        return { ok: false, score: -Infinity, planet };
      }
      const cost = getAiLandEffectCost(effect, planet.planetId);
      if (!players.canAfford(player, cost)) {
        return { ok: false, score: -Infinity, planet };
      }
      return {
        ok: true,
        planet,
        score: 14 + scoreAiPlanetTarget(planet, player) - scoreAiResourceBundle(cost) * 0.25,
      };
    }

    function getAiRequiredMovePointsFromCoordinate(player, coordinate, options = {}) {
      if (!coordinate) return 1;
      const fromContent = getSectorContentForMove(coordinate);
      if (!options.ignoreAsteroidRestriction
        && isAsteroidContent(fromContent)
        && !players.playerOwnsTech(player, "orange2", turnState)) {
        return 2;
      }
      return 1;
    }

    function canAiContinueCardMoveAfterStep(rocket, coordinate, remainingMovePoints, effect, player = getCurrentPlayer()) {
      const remaining = Math.max(0, Math.round(aiNumber(remainingMovePoints)));
      if (!rocket || !coordinate || remaining <= 0) return true;

      const simulatedRocketState = structuredClone(rocketState);
      const simulatedRocket = simulatedRocketState.rockets.find((item) => item.id === rocket.id);
      if (!simulatedRocket) return false;
      const sectorX = solar.mod8(coordinate.x);
      const sectorY = Math.min(
        rocketActions.SECTOR_RING_MAX,
        Math.max(rocketActions.SECTOR_RING_MIN, coordinate.y),
      );
      const slotIndex = rocketActions.findAvailableSlotIndex(
        simulatedRocketState,
        sectorX,
        sectorY,
        simulatedRocket.id,
      );
      if (slotIndex == null) return false;
      rocketActions.assignRocketToSlot(simulatedRocket, sectorX, sectorY, slotIndex);

      return AI_MOVE_DIRECTIONS.some((direction) => {
        const moveCheck = rocketActions.canMoveRocket(
          simulatedRocketState,
          simulatedRocket.id,
          direction.deltaX,
          direction.deltaY,
        );
        if (!moveCheck.ok) return false;
        const requiredMovePoints = getAiRequiredMovePointsFromCoordinate(
          player,
          { x: sectorX, y: sectorY },
          effect?.options || {},
        );
        const paymentRequired = Math.max(0, requiredMovePoints - Math.min(remaining, requiredMovePoints));
        return paymentRequired <= 0 || canPayForMove(player, paymentRequired).ok;
      });
    }

    function getAiRouteTargets(player = getCurrentPlayer()) {
      const demand = getAiStrategyDemand(player);
      const routeWeight = getAiStrategyWeight("route");
      const targets = solar.createSolarSnapshot(solarState).planetLocations
        .filter((planet) => planet.planetId !== "earth")
        .map((planet) => ({
          id: planet.planetId,
          label: planet.name || planet.planetId,
          kind: "planet",
          coordinate: { x: planet.x, y: planet.y },
          value: scoreAiPlanetTarget(planet, player),
        }))
        .filter((target) => target.value > 0);
      const groups = solar.collectVisibleCoordinateGroups(solarState);
      const addLocationTargets = (coordinates, locationType, baseValue) => {
        const locationDemand = getAiMapDemand(demand.locationTypes, locationType);
        if (locationDemand <= 0) return;
        for (const coordinate of coordinates || []) {
          targets.push({
            id: `${locationType}:${coordinate.x}:${coordinate.y}`,
            label: coordinate.label || coordinate.kindLabel || locationType,
            kind: "probe-location",
            locationType,
            coordinate: { x: coordinate.x, y: coordinate.y },
            value: baseValue + locationDemand * 1.15 * routeWeight,
          });
        }
      };
      const asteroids = groups.asteroids || [];
      const comets = groups.comets || [];
      addLocationTargets(asteroids, "asteroid", 6);
      addLocationTargets(comets, "comet", 6.5);
      addLocationTargets(getAiAdjacentEarthCoordinates(), "earthAdjacent", 5);
      addLocationTargets(
        asteroids.filter((coordinate) => isAiCoordinateAdjacentToEarth(coordinate)),
        "earthAdjacentAsteroid",
        8,
      );

      const distanceDemand = demand.distanceFromEarth || {};
      const distanceWeight = Math.max(0, aiNumber(distanceDemand.weight));
      const minDistance = Math.max(0, Math.round(aiNumber(distanceDemand.minDistance)));
      if (distanceWeight > 0 && minDistance > 0) {
        for (const coordinate of solar.collectVisibleCoordinateReport(solarState)) {
          const distance = getAiCoordinateDistanceFromEarth(coordinate);
          if (distance == null || distance < minDistance) continue;
          targets.push({
            id: `earth-distance:${coordinate.x}:${coordinate.y}`,
            label: coordinate.label || `距地球 ${distance}`,
            kind: "probe-distance",
            minDistance,
            distanceFromEarth: distance,
            coordinate: { x: coordinate.x, y: coordinate.y },
            value: 4 + Math.min(6, distance * 0.75) + distanceWeight * 1.1 * routeWeight,
          });
        }
      }
      return targets.filter((target) => target.value > 0);
    }

    function scoreAiMoveTowardTargets(from, to, player = getCurrentPlayer(), options = {}) {
      const targets = getAiRouteTargets(player);
      if (!from || !to || !targets.length) return { score: 0, target: null };
      const mainActionAlreadyUsed = options.mainActionAlreadyUsed ?? Boolean(state.pendingActionExecuted);
      let best = { score: -Infinity, target: null };
      for (const target of targets) {
        const oldDistance = getAiSectorDistance(from, target.coordinate);
        const newDistance = getAiSectorDistance(to, target.coordinate);
        let score = (oldDistance - newDistance) * 4;
        if (newDistance === 0) score += target.value;
        else score += target.value / (newDistance + 1) * 0.75;
        if (oldDistance === 0 && newDistance > 0) score -= target.value;
        if (mainActionAlreadyUsed) score *= 0.6;
        if (score > best.score) best = { score, target: { ...target, oldDistance, newDistance } };
      }
      if (!Number.isFinite(best.score)) return { score: 0, target: null };
      return best;
    }

    function scoreAiTechBonus(bonusId, player = getCurrentPlayer()) {
      const resources = player?.resources || {};
      if (bonusId === "bonus_3f") return 3;
      if (bonusId === "bonus_1c") return resources.credits <= 1 ? 4 : 3;
      if (bonusId === "bonus_1m") return resources.energy <= 1 ? 4 : 3;
      if (bonusId === "bonus_1p") return 2.5;
      return 1;
    }

    function scoreAiResearchTechRoutePlan(candidate, player = getCurrentPlayer()) {
      if (!candidate || !player) return null;
      const demand = getAiStrategyDemand(player);
      const plans = [];
      const addPlan = (actionId, label, score, details = {}) => {
        const value = aiNumber(score);
        if (value <= 0) return;
        plans.push({
          type: "tech-synergy",
          mainActionId: "researchTech",
          actionId,
          label,
          score: value,
          ...details,
        });
      };
      const tileId = candidate.tileId || "";
      const techType = candidate.techType || "";
      const routeDemand = getAiTotalRouteDemand(demand);
      const planetDemand = sumAiDemandMap(demand.planetIds);
      const asteroidDemand = getAiMapDemand(demand.locationTypes, "asteroid")
        + getAiMapDemand(demand.locationTypes, "earthAdjacentAsteroid");
      const moveDemand = getAiMapDemand(demand.actions, "move");
      const landDemand = getAiMapDemand(demand.actions, "land");
      const scanDemand = getAiMapDemand(demand.actions, "scan") + sumAiDemandMap(demand.scanColors) * 0.35;
      const engineDemand = getAiMapDemand(demand.actions, "researchTech") + demand.task * 0.08 + demand.final * 0.08;

      if (tileId === "orange1") {
        addPlan(
          "launch",
          "橙1扩充火箭上限并衔接发射路线",
          Math.max(0, scoreAiLaunchAction(player) * 0.25 + routeDemand * 0.1),
          { tileId, techType },
        );
      }
      if (tileId === "orange2" || techType === "orange") {
        addPlan(
          "move",
          tileId === "orange2" ? "橙2降低小行星移动阻力" : "橙科支持移动/登陆路线",
          moveDemand * 0.18 + asteroidDemand * 0.45 + routeDemand * 0.05,
          { tileId, techType },
        );
      }
      if (tileId === "orange3" || tileId === "orange4" || techType === "orange") {
        addPlan(
          "land",
          tileId === "orange3"
            ? "橙3降低登陆能量成本"
            : tileId === "orange4"
              ? "橙4打开卫星登陆路线"
              : "橙科支持登陆路线",
          landDemand * 0.22 + planetDemand * 0.08 + routeDemand * 0.04,
          { tileId, techType },
        );
      }
      if (techType === "purple") {
        addPlan(
          "scan",
          tileId === "purple1" ? "紫1提升扫描公共牌能力" : "紫科支持扫描路线",
          scanDemand * 0.16 + getAiAvailableDataRoom(player) * 0.15,
          { tileId, techType },
        );
      }
      if (techType === "blue") {
        addPlan(
          "engine",
          "蓝科补强任务/终局引擎",
          engineDemand * 0.12 + Math.max(0, getAiRemainingRoundWeight() - 1) * 0.3,
          { tileId, techType },
        );
      }

      return plans
        .filter((plan) => Number.isFinite(Number(plan.score)))
        .sort((left, right) => right.score - left.score)[0] || null;
    }

    function scoreAiResearchTechValue(candidate, player = getCurrentPlayer()) {
      const techType = candidate?.techType || "";
      const stackIndex = Math.max(1, Math.round(aiNumber(candidate?.stackIndex) || 1));
      const resources = player?.resources || {};
      const demand = getAiStrategyDemand(player);
      let value = 6;
      if (techType === "orange") value += 2.5;
      if (techType === "purple") value += 2 + (resources.additionalPublicScan || 0) * 0.75;
      if (techType === "blue") value += 1.5;
      if (candidate?.tileId === "orange1") value += (getMovableTokensForPlayer(player?.id).length ? 1 : 4);
      if (candidate?.tileId === "orange3") value += 3;
      if (candidate?.tileId === "orange4") value += 2.5;
      if (candidate?.tileId === "purple1") value += 1.5;
      value += scoreAiTechBonus(candidate?.bonusId, player);
      if (candidate?.firstTake) value += 2;
      value += Math.max(0, 5 - stackIndex) * 0.4;
      value += Math.max(0, getAiRemainingRoundWeight() - 1) * 0.4;
      value += getAiMapDemand(demand.techTypes, techType) * 0.85 * getAiStrategyWeight("tech");
      value += getAiMapDemand(demand.actions, "researchTech") * 0.18 * getAiStrategyWeight("tech");
      if (techType === "orange") {
        value += (
          getAiMapDemand(demand.actions, "launch")
          + getAiMapDemand(demand.actions, "move")
          + getAiMapDemand(demand.actions, "land")
        ) * 0.06 * getAiStrategyWeight("route");
      }
      if (techType === "purple") value += getAiMapDemand(demand.actions, "scan") * 0.08 * getAiStrategyWeight("scan");
      const routePlan = candidate?.plan || scoreAiResearchTechRoutePlan(candidate, player);
      if (routePlan?.score > 0) value += applyAiStrategyWeight(routePlan.score, "tech", 0.35);
      return applyAiStrategyWeight(value, "engine", 0.35);
    }

    function aiResearchTechEventMatches(event, techType) {
      if (!event || event.type !== "researchTech") return false;
      if (event.techType && event.techType !== techType) return false;
      if (Array.isArray(event.techTypes) && !event.techTypes.includes(techType)) return false;
      return true;
    }

    function getAiResearchTechTriggeredEffects(candidate, player = getCurrentPlayer()) {
      const techType = candidate?.techType || "";
      const reservedCards = Array.isArray(player?.reservedCards) ? player.reservedCards : [];
      return reservedCards.flatMap((card) => {
        const model = cardEffects.getCardModel?.(card);
        return (model?.triggers || [])
          .filter((trigger) => aiResearchTechEventMatches(trigger?.event, techType))
          .map((trigger) => trigger.effect)
          .filter(Boolean);
      });
    }

    function getAiLaunchEffectCost(effect) {
      const options = effect?.options || {};
      if (options.skipCost) return {};
      if (options.cost && typeof options.cost === "object" && !Array.isArray(options.cost)) {
        return { ...options.cost };
      }
      return { credits: 2 };
    }

    function getAiRocketLimitAfterResearch(candidate, player = getCurrentPlayer()) {
      const context = createActionContext();
      const currentLimit = abilities.rocket.getRocketLimitForPlayer(player, context);
      if (candidate?.tileId !== "orange1" || players.playerOwnsTech(player, "orange1", context)) {
        return currentLimit;
      }
      return Math.max(currentLimit, abilities.rocket.ORANGE1_ROCKET_LIMIT || currentLimit);
    }

    function getAiResearchTechLaunchRisks(candidate, player = getCurrentPlayer()) {
      const selectionOptions = getResearchTechSelectionOptions();
      const effects = getAiResearchTechTriggeredEffects(candidate, player);
      if (!selectionOptions.skipBonus && candidate?.tileId === "orange1") {
        effects.push({ type: "launch", options: { skipCost: true } });
      }
      const launchEffects = effects.filter((effect) => (
        effect?.type === "launch"
        && !effect.options?.ignoreRocketLimit
      ));
      const launchCost = launchEffects.reduce((total, effect) => {
        const cost = getAiLaunchEffectCost(effect);
        for (const [key, value] of Object.entries(cost)) {
          total[key] = (total[key] || 0) + Math.max(0, Math.round(aiNumber(value)));
        }
        return total;
      }, {});
      return {
        launchCount: launchEffects.length,
        launchCost,
      };
    }

    function getAiResearchTechCandidateSafety(candidate, player = getCurrentPlayer()) {
      const risks = getAiResearchTechLaunchRisks(candidate, player);
      if (!risks.launchCount) return { ok: true, message: null };
      const activeRocketCount = rocketActions.getRocketsForPlayer(rocketState, player?.id).length;
      const rocketLimit = getAiRocketLimitAfterResearch(candidate, player);
      if (activeRocketCount + risks.launchCount > rocketLimit) {
        return {
          ok: false,
          message: `研究 ${candidate.tileId} 会追加 ${risks.launchCount} 次发射，火箭上限不足（${activeRocketCount}/${rocketLimit}）`,
        };
      }
      if (!players.canAfford(player, risks.launchCost)) {
        return {
          ok: false,
          message: `研究 ${candidate.tileId} 后续发射资源不足，需要 ${players.formatResourceCost(risks.launchCost)}`,
        };
      }
      return { ok: true, message: null };
    }

    function scoreAiLaunchAction(player = getCurrentPlayer()) {
      const rocketCount = getMovableTokensForPlayer(player?.id).length;
      const rocketLimit = abilities.rocket.getRocketLimitForPlayer(player, createActionContext());
      const demand = getAiStrategyDemand(player);
      const routeDemand = getAiTotalRouteDemand(demand);
      return 6
        + (rocketCount === 0 ? 5 : 0)
        + (rocketCount < rocketLimit - 1 ? 2 : 0)
        + getAiMapDemand(demand.actions, "launch") * 0.28 * getAiStrategyWeight("route")
        + Math.min(3, routeDemand * 0.08 * getAiStrategyWeight("route"))
        - scoreAiResourceBundle({ credits: 2 }) * 0.45;
    }

    function scoreAiPostLaunchMovePlan(player = getCurrentPlayer()) {
      if (!player || state.pendingActionExecuted) return null;
      const from = getEarthSectorCoordinate();
      const candidates = AI_MOVE_DIRECTIONS
        .map((direction) => {
          const to = {
            x: solar.mod8(from.x + direction.deltaX),
            y: Math.min(
              rocketActions.SECTOR_RING_MAX,
              Math.max(rocketActions.SECTOR_RING_MIN, from.y + direction.deltaY),
            ),
          };
          if (to.x === from.x && to.y === from.y) return null;
          if (rocketActions.findAvailableSlotIndex(rocketState, to.x, to.y, null) == null) return null;
          const requiredMovePoints = getAiRequiredMovePointsFromCoordinate(player, from);
          if (!canPayForMove(player, requiredMovePoints).ok) return null;
          const routeScore = scoreAiMoveTowardTargets(from, to, player, { mainActionAlreadyUsed: true });
          const movementCost = requiredMovePoints * 1.2;
          const score = applyAiStrategyWeight(applyAiStrategyWeight(routeScore.score, "route", 0.7), "move", 0.8)
            + direction.score * 0.25
            - movementCost;
          return {
            type: "main-then-quick",
            mainActionId: "launch",
            quickActionId: "move",
            direction: direction.id,
            directionLabel: direction.label,
            from,
            to,
            requiredMovePoints,
            routeTarget: routeScore.target,
            routeScore: routeScore.score,
            score,
          };
        })
        .filter(Boolean)
        .sort((left, right) => right.score - left.score);
      return candidates[0] || null;
    }

    function scoreAiOrbitAction(candidate) {
      if (!candidate?.available) return 0;
      const demand = getAiStrategyDemand(getCurrentPlayer());
      return 10
        + (candidate.planetId === "jupiter" ? 2 : 0)
        + getAiMapDemand(demand.planetIds, candidate.planetId) * 0.8 * getAiStrategyWeight("route")
        + getAiMapDemand(demand.actions, "orbit") * 0.22 * getAiStrategyWeight("orbitLand")
        - scoreAiResourceBundle(abilities.planet.DEFAULT_ORBIT_COST) * 0.45;
    }

    function scoreAiLandAction(candidate) {
      if (!candidate?.available) return 0;
      const energyCost = Math.max(0, Math.round(aiNumber(candidate.energyCost)));
      const demand = getAiStrategyDemand(getCurrentPlayer());
      return 12
        + (candidate.planetId === "mars" || candidate.planetId === "venus" ? 1.5 : 0)
        + getAiMapDemand(demand.planetIds, candidate.planetId) * 0.85 * getAiStrategyWeight("route")
        + getAiMapDemand(demand.actions, "land") * 0.24 * getAiStrategyWeight("orbitLand")
        - energyCost * AI_RESOURCE_VALUES.energy * 0.35;
    }

    function scoreAiFollowupMainActionAfterMove(coordinate, player = getCurrentPlayer()) {
      if (!coordinate || state.pendingActionExecuted) {
        return { score: 0, actionId: null, planetId: null, planetName: null };
      }
      const planet = getAiPlanetAtCoordinate(coordinate);
      if (!planet) return { score: 0, actionId: null, planetId: null, planetName: null };

      const options = [];
      if (
        canAiPlanetAcceptOrbit(planet.planetId)
        && players.canAfford(player, abilities.planet.DEFAULT_ORBIT_COST)
      ) {
        options.push({
          actionId: "orbit",
          planetId: planet.planetId,
          planetName: planet.name || planet.planetId,
          score: scoreAiOrbitAction({
            available: true,
            planetId: planet.planetId,
            planetName: planet.name || planet.planetId,
          }),
        });
      }

      if (canAiPlanetAcceptLanding(planet.planetId, player)) {
        const energyCost = abilities.planet.getLandEnergyCost(createActionContext(), planet.planetId);
        if (players.canAfford(player, energyCost > 0 ? { energy: energyCost } : {})) {
          options.push({
            actionId: "land",
            planetId: planet.planetId,
            planetName: planet.name || planet.planetId,
            energyCost,
            score: scoreAiLandAction({
              available: true,
              planetId: planet.planetId,
              planetName: planet.name || planet.planetId,
              energyCost,
            }),
          });
        }
      }

      return options
        .filter((option) => Number.isFinite(Number(option.score)))
        .sort((left, right) => right.score - left.score)[0]
        || { score: 0, actionId: null, planetId: planet.planetId, planetName: planet.name || planet.planetId };
    }

    function getAiAvailableDataRoom(player = getCurrentPlayer()) {
      const limit = Math.max(0, Math.round(aiNumber(players.RESOURCE_LIMITS?.availableData) || 6));
      return Math.max(0, limit - Math.max(0, Math.round(aiNumber(player?.resources?.availableData))));
    }

    function aiTokenBelongsToPlayer(token, player = getCurrentPlayer()) {
      if (!token || !player) return false;
      const tokenPlayerId = token.replacedByPlayerId || token.playerId || null;
      const tokenColor = token.replacedByPlayerColor || token.playerColor || null;
      return (tokenPlayerId && tokenPlayerId === player.id)
        || (tokenColor && tokenColor === player.color);
    }

    function aiTokenHasOwner(token) {
      return Boolean(token?.replacedByPlayerColor || token?.playerColor || token?.replacedByPlayerId || token?.playerId);
    }

    function getAiNebulaSignalCounts(nebulaId, player = getCurrentPlayer()) {
      const tokens = data.listNebulaTokens(nebulaDataState, nebulaId);
      const extraMarks = typeof data.listSectorExtraMarks === "function"
        ? data.listSectorExtraMarks(nebulaDataState, nebulaId)
        : [];
      const openCount = tokens.filter((token) => !aiTokenHasOwner(token)).length;
      const ownCount = [...tokens, ...extraMarks]
        .filter((token) => aiTokenBelongsToPlayer(token, player))
        .length;
      const maxOtherCount = Object.values(data.getSectorTokenStats?.(nebulaDataState, nebulaId) || {})
        .filter((entry) => entry.playerId !== player?.id && entry.playerColor !== player?.color)
        .reduce((best, entry) => Math.max(best, Math.max(0, Math.round(aiNumber(entry.count)))), 0);
      return {
        tokens,
        extraMarks,
        openCount,
        ownCount,
        markedCount: tokens.length - openCount + extraMarks.length,
        maxOtherCount,
      };
    }

    function scoreAiNebulaScanChoice(choice, options = {}) {
      const player = options.player || getCurrentPlayer();
      const nebulaId = choice?.nebulaId || null;
      if (!nebulaId || choice?.disabled) return -Infinity;
      const nextToken = data.getNextReplaceableNebulaToken?.(nebulaDataState, nebulaId);
      if (!nextToken) return -Infinity;

      const capacity = Math.max(0, Math.round(aiNumber(data.getNebulaCapacity?.(nebulaId))));
      const counts = getAiNebulaSignalCounts(nebulaId, player);
      const slotScore = Math.max(0, aiNumber(data.getNebulaSlotScoreReward?.(nebulaId, nextToken.slotIndex)));
      const gainsData = options.gainData !== false;
      const dataValue = gainsData
        ? (getAiAvailableDataRoom(player) > 0 ? AI_RESOURCE_VALUES.availableData : -0.75)
        : 0;
      const demand = getAiStrategyDemand(player);
      const nebulaColor = data.getNebulaColor?.(nebulaId);

      let value = 3 + slotScore + dataValue;
      value += counts.ownCount > 0 ? Math.min(3, counts.ownCount * 0.8) : 1.4;
      value += Math.min(2.5, Math.max(0, counts.markedCount) * 0.35);
      value += getAiMapDemand(demand.scanColors, nebulaColor) * 0.75 * getAiStrategyWeight("scan");
      value += getAiMapDemand(demand.actions, "scan") * 0.12 * getAiStrategyWeight("scan");

      if (counts.openCount <= 1 && capacity > 0) {
        const ownAfterScan = counts.ownCount + 1;
        value += ownAfterScan >= counts.maxOtherCount ? 9 : 3;
      } else if (counts.openCount === 2) {
        value += 2.5;
      }

      if (nebulaId === aomomo?.NEBULA_ID) value += 2;
      if (options.pendingType === "hand_scan") value -= 0.5;
      return value;
    }

    function getBestAiNebulaChoiceScore(choices = [], options = {}) {
      return (choices || []).reduce((best, choice) => (
        Math.max(best, scoreAiNebulaScanChoice(choice, options))
      ), -Infinity);
    }

    function getAiSectorScanChoicesForEffect(effectType, player = getCurrentPlayer()) {
      if (effectType === scanEffects.EFFECT_TYPES.IMPROVED_SECTOR_SCAN) {
        const earth = getEarthSectorCoordinate();
        return buildSectorScanChoicesForXs([(earth.x + 7) % 8, earth.x, (earth.x + 1) % 8]);
      }
      if (effectType === scanEffects.EFFECT_TYPES.MERCURY_SECTOR_SCAN) {
        const mercury = getPlanetSectorCoordinate("mercury");
        return buildSectorScanChoicesForX(mercury.x);
      }
      if (effectType === scanEffects.EFFECT_TYPES.EARTH_SECTOR_SCAN) {
        const earth = getEarthSectorCoordinate();
        return buildSectorScanChoicesForX(earth.x);
      }
      return [];
    }

    function scoreAiScanCard(card, options = {}) {
      const scanChoices = getPublicScanChoicesForCard(card);
      if (!scanChoices.ok) return -Infinity;
      const bestTargetScore = getBestAiNebulaChoiceScore(scanChoices.choices || [], options);
      if (!Number.isFinite(bestTargetScore)) return -Infinity;
      const handDiscardPenalty = options.fromHand
        ? Math.max(0, scoreAiPlayCardValue(card)) * 0.25 + scoreAiCardCornerOpportunity(card) * 0.15
        : 0;
      return bestTargetScore + Math.min(1.5, (scanChoices.choices || []).length * 0.25) - handDiscardPenalty;
    }

    function getAiBestPublicScanSlots(player = getCurrentPlayer(), options = {}) {
      const maxSelectable = Math.max(1, Math.round(aiNumber(options.maxSelectable || 1)));
      return (cardState.publicCards || [])
        .map((card, slotIndex) => ({
          slotIndex,
          card,
          score: card ? scoreAiScanCard(card, { ...options, player, pendingType: "public_scan" }) : -Infinity,
        }))
        .filter((entry) => entry.card && Number.isFinite(entry.score))
        .sort((left, right) => right.score - left.score || left.slotIndex - right.slotIndex)
        .slice(0, maxSelectable);
    }

    function getAiBestHandScanIndex(player = getCurrentPlayer(), options = {}) {
      const entries = (player?.hand || [])
        .map((card, handIndex) => ({
          handIndex,
          card,
          score: card ? scoreAiScanCard(card, { ...options, player, pendingType: "hand_scan", fromHand: true }) : -Infinity,
        }))
        .filter((entry) => entry.card && Number.isFinite(entry.score))
        .sort((left, right) => right.score - left.score || left.handIndex - right.handIndex);
      return entries[0] || null;
    }

    function scoreAiScanTargetButton(button, options = {}) {
      if (!button || button.disabled) return -Infinity;
      if (button.dataset.conditionalSectorX != null) {
        const sectorX = solar.mod8(Number(button.dataset.conditionalSectorX));
        return getBestAiNebulaChoiceScore(buildSectorScanChoicesForX(sectorX), options);
      }
      if (button.dataset.nebulaId == null) return -Infinity;
      return scoreAiNebulaScanChoice({
        nebulaId: button.dataset.nebulaId,
        sectorX: button.dataset.sectorX,
        disabled: button.disabled,
      }, options);
    }

    function chooseAiScanTargetButton(buttons = [], options = {}) {
      const ranked = [...(buttons || [])]
        .map((button, index) => ({
          button,
          index,
          score: scoreAiScanTargetButton(button, options),
        }))
        .filter((entry) => Number.isFinite(entry.score))
        .sort((left, right) => right.score - left.score || left.index - right.index);
      return ranked[0]?.button || null;
    }

    function scoreAiScanAction(player = getCurrentPlayer()) {
      const effects = scanEffects.buildScanEffectQueue(player, {
        fullScanAction: true,
        turnState,
        roundNumber: turnState.roundNumber,
        turnNumber: turnState.turnNumber,
      });
      const costValue = scoreAiResourceBundle(scanEffects.getStandardScanCost(player));
      let value = 0;
      for (const effect of effects) {
        if (
          effect.type === scanEffects.EFFECT_TYPES.EARTH_SECTOR_SCAN
          || effect.type === scanEffects.EFFECT_TYPES.IMPROVED_SECTOR_SCAN
          || effect.type === scanEffects.EFFECT_TYPES.MERCURY_SECTOR_SCAN
        ) {
          const best = getBestAiNebulaChoiceScore(
            getAiSectorScanChoicesForEffect(effect.type, player),
            { player, pendingType: "sector_scan" },
          );
          if (Number.isFinite(best)) value += best;
        } else if (effect.type === scanEffects.EFFECT_TYPES.PUBLIC_CARD_SCAN) {
          const bestPublicScan = getAiBestPublicScanSlots(player, { maxSelectable: 1 })[0];
          if (bestPublicScan) value += bestPublicScan.score + 1;
        } else if (effect.type === scanEffects.EFFECT_TYPES.HAND_SCAN) {
          const bestHandScan = getAiBestHandScanIndex(player);
          if (bestHandScan) value += bestHandScan.score;
        } else if (effect.type === scanEffects.EFFECT_TYPES.SCAN_ACTION_4) {
          value += Math.max(0, scoreAiLaunchAction(player) * 0.45);
          const bestMove = listAiMoveCandidates()[0];
          if (bestMove) value += Math.max(0, aiNumber(bestMove.score) * 0.35);
        }
      }
      return applyAiStrategyWeight(value, "scan", 0.85) - costValue * 0.7;
    }

    function isAiSupportedHandPlayCard(card) {
      if (!card) return false;
      return !(
        fangzhou?.isFangzhouCard2?.(card)
        || banrenma?.isBanrenmaCard?.(card)
        || chong?.isChongCard?.(card)
        || amiba?.isAmibaCard?.(card)
        || aomomo?.isAomomoCard?.(card)
        || runezu?.isRunezuCard?.(card)
      );
    }

    function canAiResolvePlayCardEffects(playEffects = []) {
      const context = createActionContext();
      const unsupportedTypes = new Set([
        "alien_trace",
        cardEffects.EFFECT_TYPES.REMOVE_PLANET_MARKER,
        cardEffects.EFFECT_TYPES.PICK_CARD_CORNER_REWARD,
        cardEffects.EFFECT_TYPES.CHOOSE_HAND_CORNER_REWARD,
        cardEffects.EFFECT_TYPES.DRAW_THEN_DISCARD_ACTION,
        cardEffects.EFFECT_TYPES.DISCARD_ANY_FOR_INCOME,
        cardEffects.EFFECT_TYPES.PAY_CREDITS_FOR_REWARD,
        cardEffects.EFFECT_TYPES.DISCARD_CARD_CORNER_REPEAT,
        cardEffects.EFFECT_TYPES.REMOVE_ORBIT_TO_PROBE,
        cardEffects.EFFECT_TYPES.RETURN_UNFINISHED_TASK_TO_HAND,
        cardEffects.EFFECT_TYPES.PROBE_SECTOR_SCAN,
        cardEffects.EFFECT_TYPES.PROBE_LOCATION_REWARD,
        cardEffects.EFFECT_TYPES.EARTH_SECTOR_CONTENT_MOVE,
      ]);
      for (let index = 0; index < playEffects.length; index += 1) {
        const effect = playEffects[index];
        const nextEffect = playEffects[index + 1] || null;
        if (unsupportedTypes.has(effect?.type)) {
          return { ok: false, message: `AI 暂不支持打出效果 ${effect.type}` };
        }
        if (effect?.type === "launch" && !effect.options?.ignoreRocketLimit) {
          const currentPlayer = getCurrentPlayer();
          const rocketLimit = abilities.rocket.getRocketLimitForPlayer(currentPlayer, context);
          const activeRocketCount = rocketActions.getRocketsForPlayer(rocketState, currentPlayer.id).length;
          if (activeRocketCount >= rocketLimit) {
            return { ok: false, message: `火箭数量已达上限（${activeRocketCount}/${rocketLimit}）` };
          }
        }
        if (effect?.type === cardEffects.EFFECT_TYPES.CARD_ORBIT) {
          const check = actions.canExecute("orbit", context);
          if (!check.ok) return { ok: false, message: check.message || "当前不能环绕" };
        }
        if (effect?.type === cardEffects.EFFECT_TYPES.CARD_LAND) {
          const options = abilities.planet.getLandOptions(context, effect.options || {});
          if (!options.ok) return { ok: false, message: options.message || "当前不能登陆" };
        }
        if (
          effect?.type === "research_tech_select"
          || effect?.type === cardEffects.EFFECT_TYPES.RESEARCH_TECH
        ) {
          if (!listAiResearchTechCandidates().length) {
            return { ok: false, message: `${effect.label || "科技"}：没有安全的可研究科技` };
          }
        }
        if (effect?.type === cardEffects.EFFECT_TYPES.CARD_MOVE) {
          const moveCandidates = listAiEffectMoveCandidates({
            id: "cardMove",
            effect,
            poolRemaining: effect?.options?.movementPoints ?? 1,
            nextEffect,
          });
          if (!moveCandidates.length) return { ok: false, message: "没有可移动的飞船" };
        }
        if (effect?.type === cardEffects.EFFECT_TYPES.CONDITIONAL_SECTOR_SCAN) {
          const sectorXs = getSectorXsMatchingCondition(effect.options?.condition)
            .filter(sectorXHasAvailableScanTarget);
          if (!sectorXs.length) return { ok: false, message: `${effect.label || "条件扇区扫描"}：没有符合条件的扇区` };
        }
      }
      return { ok: true };
    }

    function buildAiPlayCardCandidate(card, handIndex, currentPlayer = getCurrentPlayer()) {
      if (!isAiSupportedHandPlayCard(card)) return null;
      const cost = getCardPlayCost(card);
      if (!players.canAfford(currentPlayer, cost)) return null;
      const price = getCardPrice(card);
      const typeCode = getCardTypeCode(card);
      const model = cardEffects.getCardModel?.(card) || null;
      const playEffects = cardEffects.buildPlayEffects?.(card) || [];
      const effectCheck = canAiResolvePlayCardEffects(playEffects);
      if (!effectCheck.ok) return null;
      const reservesAfterPlay = [1, 2, 3].includes(typeCode) || Boolean(model?.reserveAfterPlay);
      const endGameExpectedScore = scoreAiCardEndGameExpectedValue(card, model, currentPlayer);
      const plan = scoreAiPlayCardRoutePlan(card, model, playEffects, currentPlayer);
      const score = scoreAiPlayCardValue(card, {
        model,
        playEffects,
        cost,
        price,
        typeCode,
        reservesAfterPlay,
        endGameExpectedScore,
        plan,
      });
      return {
        id: "playCard",
        kind: "main",
        available: true,
        handIndex,
        cardId: card.cardId || card.id || null,
        cardInstanceId: card.id || null,
        cardLabel: cards.getCardLabel(card),
        price,
        cost,
        typeCode,
        reservesAfterPlay,
        effectTypes: playEffects.map((effect) => effect?.type || null).filter(Boolean),
        plan: plan?.score > 0 ? plan : null,
        score,
        valueBreakdown: {
          costValue: scoreAiResourceBundle(cost),
          cornerOpportunity: scoreAiCardCornerOpportunity(card),
          effectValue: playEffects.reduce((total, effect) => total + scoreAiEffectValue(effect), 0),
          endGameExpectedScore,
          planScore: plan?.score || 0,
        },
      };
    }

    function listAiPlayCardCandidates(currentPlayer = getCurrentPlayer()) {
      return (currentPlayer?.hand || [])
        .map((card, handIndex) => buildAiPlayCardCandidate(card, handIndex, currentPlayer))
        .filter(Boolean);
    }

    function runAiPlayCardSelectionDecision() {
      if (!isPlayCardSelectionActive()) return null;
      const currentPlayer = getCurrentPlayer();
      if (!isAiAutoBattlePlayer(currentPlayer?.id)) {
        return { ok: false, blocked: true, message: `${currentPlayer?.colorLabel || "当前玩家"}需要人工选择打牌` };
      }
      const pending = getPendingPlayCardSelection();
      if (pending?.source === "future_span") {
        return { ok: false, blocked: true, message: "AI 暂不支持未来跨度目标牌打出" };
      }
      if (pending?.source === "hand") {
        recordAiAutoBattleLog("play-card", `${currentPlayer.colorLabel}AI 确认打出 ${cards.getCardLabel(pending.card)}`, {
          handIndex: pending.handIndex,
          card: pending.card,
        });
        return confirmPlayCardSelection();
      }
      const candidates = listAiPlayCardCandidates(currentPlayer);
      const selected = ai?.policy?.choosePlayCard?.(candidates, {
        playerState,
        turnState,
        currentPlayer,
      }) || candidates[0] || null;
      if (!selected) {
        return { ok: false, blocked: true, message: "AI 没有可打出的普通手牌" };
      }
      recordAiAutoBattleLog("play-card", `${currentPlayer.colorLabel}AI 选择打出 ${selected.cardLabel}`, {
        selected,
        candidates,
      });
      const selectResult = handlePlayCardSelect(selected.handIndex);
      if (!selectResult?.ok) return selectResult;
      return confirmPlayCardSelection();
    }

    function getAiMoveTurnKey(playerId = playerState.currentPlayerId) {
      return `${turnState.roundNumber}:${turnState.turnNumber}:${playerId || "unknown"}`;
    }

    function getAiMoveCountThisTurn(playerId = playerState.currentPlayerId) {
      const key = getAiMoveTurnKey(playerId);
      return Math.max(0, Math.round(Number(aiAutoBattleState.turnMoveCounts[key]) || 0));
    }

    function incrementAiMoveCountThisTurn(playerId = playerState.currentPlayerId) {
      const key = getAiMoveTurnKey(playerId);
      aiAutoBattleState.turnMoveCounts[key] = getAiMoveCountThisTurn(playerId) + 1;
    }

    function canAiMoveThisTurn(playerId = playerState.currentPlayerId) {
      return getAiMoveCountThisTurn(playerId) < aiAutoBattleState.maxMovesPerTurn;
    }

    function buildAiMoveCandidate(rocket, direction, index = 0) {
      const currentPlayer = getCurrentPlayer();
      const moveCheck = rocketActions.canMoveRocket(
        rocketState,
        rocket.id,
        direction.deltaX,
        direction.deltaY,
      );
      if (!moveCheck.ok) return null;

      const requiredMovePoints = getRequiredMovePointsForUi(
        currentPlayer,
        rocket.id,
        direction.deltaX,
        direction.deltaY,
      );
      const payCheck = canPayForMove(currentPlayer, requiredMovePoints);
      if (!payCheck.ok) return null;

      const from = rocketActions.getRocketSectorCoordinate(rocket);
      const to = from
        ? {
          x: solar.mod8(from.x + direction.deltaX),
          y: Math.min(
            rocketActions.SECTOR_RING_MAX,
            Math.max(rocketActions.SECTOR_RING_MIN, from.y + direction.deltaY),
          ),
        }
        : null;
      const routeScore = scoreAiMoveTowardTargets(from, to, currentPlayer);
      const followupMainAction = scoreAiFollowupMainActionAfterMove(to, currentPlayer);
      const movementCost = requiredMovePoints * 1.2;
      return {
        id: "move",
        kind: "quick",
        available: true,
        rocketId: rocket.id,
        rocketLabel: formatRocketLabel(rocket),
        direction: direction.id,
        directionLabel: direction.label,
        deltaX: direction.deltaX,
        deltaY: direction.deltaY,
        from,
        to,
        requiredMovePoints,
        routeTarget: routeScore.target,
        routeScore: routeScore.score,
        followupMainAction,
        score: applyAiStrategyWeight(applyAiStrategyWeight(routeScore.score, "route", 0.7), "move", 0.8)
          + applyAiStrategyWeight(Math.max(0, followupMainAction.score), "orbitLand", 0.5)
          + direction.score * 0.25
          - movementCost
          - index * 0.1,
      };
    }

    function listAiMoveCandidates() {
      const currentPlayer = getCurrentPlayer();
      if (!currentPlayer || !canAiMoveThisTurn(currentPlayer.id)) return [];
      return getMovableTokensForPlayer(currentPlayer.id)
        .flatMap((rocket, index) => AI_MOVE_DIRECTIONS
          .map((direction) => buildAiMoveCandidate(rocket, direction, index))
          .filter(Boolean));
    }

    function runAiMovePaymentDecision() {
      if (!isMovePaymentSelectionActive()) return null;
      const currentPlayer = getCurrentPlayer();
      if (!isAiAutoBattlePlayer(currentPlayer?.id)) {
        return { ok: false, blocked: true, message: `${currentPlayer?.colorLabel || "当前玩家"}需要人工确认移动支付` };
      }

      const requiredMovePoints = state.pendingMovePayment.requiredMovePoints || MOVE_ENERGY_COST;
      const availableEnergy = Math.max(0, Math.round(Number(currentPlayer?.resources?.energy) || 0));
      const moveCardIndexes = (currentPlayer?.hand || [])
        .map((card, index) => (isMovePaymentCard(card) ? index : null))
        .filter((index) => index != null);
      const selectedHandIndices = ai?.policy?.chooseMovePaymentIndexes?.(currentPlayer.hand || [], {
        requiredMovePoints,
        availableEnergy,
        moveCardIndexes,
      }) || [];
      state.pendingMovePayment.selectedHandIndices = selectedHandIndices.slice(0, requiredMovePoints);
      recordAiAutoBattleLog("move-payment", `${currentPlayer.colorLabel}AI 确认移动支付`, {
        rocketId: state.pendingMovePayment.rocketId,
        deltaX: state.pendingMovePayment.deltaX,
        deltaY: state.pendingMovePayment.deltaY,
        requiredMovePoints,
        selectedHandIndices: state.pendingMovePayment.selectedHandIndices,
        energyCost: Math.max(0, requiredMovePoints - state.pendingMovePayment.selectedHandIndices.length),
      });
      const result = confirmMovePayment();
      if (result?.ok) incrementAiMoveCountThisTurn(currentPlayer.id);
      return result || { ok: false, blocked: true, message: "AI 移动支付未产生结果" };
    }

    function runAiLandTargetDecision() {
      if (!els.landTargetOverlay || els.landTargetOverlay.hidden) return null;
      const currentPlayer = getCurrentPlayer();
      if (!isAiAutoBattlePlayer(currentPlayer?.id)) {
        return { ok: false, blocked: true, message: `${currentPlayer?.colorLabel || "当前玩家"}需要人工选择登陆目标` };
      }
      const optionCount = els.landTargetSelect?.options?.length || 0;
      if (optionCount <= 0) {
        return { ok: false, blocked: true, message: "AI 没有可选登陆目标" };
      }
      els.landTargetSelect.value = "0";
      recordAiAutoBattleLog("land-target", `${currentPlayer.colorLabel}AI 选择登陆目标 1`, {
        optionCount,
        planetId: els.landTargetOverlay.dataset.planetId || null,
      });
      const result = confirmLandTargetPicker();
      return result || { ok: true, progressed: true, message: "AI 已选择登陆目标" };
    }

    function runAiScanTargetDecision() {
      if (!els.scanTargetOverlay || els.scanTargetOverlay.hidden) return null;
      const currentPlayer = getCurrentPlayer();
      if (!isAiAutoBattlePlayer(currentPlayer?.id)) {
        return { ok: false, blocked: true, message: `${currentPlayer?.colorLabel || "当前玩家"}需要人工选择扫描目标` };
      }
      const pendingType = state.pendingScanTargetAction?.type || null;
      if (pendingType === "optional_hand_scan") {
        const hasScannableHandCard = (currentPlayer?.hand || [])
          .some((card) => card && getPublicScanChoicesForCard(card).ok);
        const choice = hasScannableHandCard ? "start" : "skip";
        recordAiAutoBattleLog("hand-scan", `${currentPlayer.colorLabel}AI ${choice === "start" ? "开始" : "跳过"}可选手牌扫描`, {
          choice,
          effectId: state.pendingScanTargetAction?.effect?.id || null,
        });
        return handleOptionalHandScanChoice(choice);
      }
      if (pendingType === "conditional_sector_scan") {
        const button = chooseAiScanTargetButton(
          [...(els.scanTargetActions?.querySelectorAll("[data-conditional-sector-x]") || [])],
          {
            player: currentPlayer,
            pendingType,
            gainData: state.pendingScanTargetAction?.effect?.options?.gainData,
          },
        );
        if (!button) {
          return { ok: false, blocked: true, message: "AI 没有可选条件扇区" };
        }
        recordAiAutoBattleLog("scan-target", `${currentPlayer.colorLabel}AI 选择条件扇区扫描`, {
          pendingType,
          sectorX: button.dataset.conditionalSectorX || null,
          label: button.textContent || "",
        });
        return handleConditionalSectorChoice(button.dataset.conditionalSectorX);
      }
      if (!["sector_scan", "public_scan", "hand_scan"].includes(pendingType)) {
        return null;
      }
      const button = chooseAiScanTargetButton(
        [...(els.scanTargetActions?.querySelectorAll(".scan-target-option-button") || [])]
          .filter((item) => item.dataset.nebulaId != null),
        {
          player: currentPlayer,
          pendingType,
          gainData: state.pendingScanTargetAction?.gainData,
        },
      );
      if (!button) {
        return { ok: false, blocked: true, message: "AI 没有可选扫描目标" };
      }
      recordAiAutoBattleLog("scan-target", `${currentPlayer.colorLabel}AI 选择扫描目标`, {
        pendingType,
        nebulaId: button.dataset.nebulaId || null,
        sectorX: button.dataset.sectorX || null,
        label: button.textContent || "",
      });
      return confirmScanTarget(button.dataset.nebulaId, button.dataset.sectorX);
    }

    function buildAiEffectMoveCandidate(rocket, direction, index = 0, options = {}) {
      const currentPlayer = getCurrentPlayer();
      const moveCheck = rocketActions.canMoveRocket(
        rocketState,
        rocket.id,
        direction.deltaX,
        direction.deltaY,
      );
      if (!moveCheck.ok) return null;

      const effect = options.effect || null;
      const explicitPoolRemaining = options.poolRemaining ?? effect?.options?.movementPoints ?? null;
      const poolRemaining = explicitPoolRemaining == null
        ? 0
        : Math.max(0, Math.round(Number(explicitPoolRemaining) || 0));
      const terrainRequired = getRequiredMovePointsForUi(
        currentPlayer,
        rocket.id,
        direction.deltaX,
        direction.deltaY,
        effect?.options || {},
      );
      if (options.free && poolRemaining > 0 && terrainRequired > poolRemaining) return null;
      const paymentRequired = options.free
        ? 0
        : Math.max(0, terrainRequired - Math.min(poolRemaining, terrainRequired));
      if (paymentRequired > 0 && !canPayForMove(currentPlayer, paymentRequired).ok) return null;

      const from = rocketActions.getRocketSectorCoordinate(rocket);
      const to = from
        ? {
          x: solar.mod8(from.x + direction.deltaX),
          y: Math.min(
            rocketActions.SECTOR_RING_MAX,
            Math.max(rocketActions.SECTOR_RING_MIN, from.y + direction.deltaY),
          ),
        }
        : null;
      const poolUsed = Math.min(poolRemaining, terrainRequired);
      const remainingPoolAfterStep = Math.max(0, poolRemaining - poolUsed);
      if (
        effect?.type === cardEffects.EFFECT_TYPES.CARD_MOVE
        && remainingPoolAfterStep > 0
        && !canAiContinueCardMoveAfterStep(rocket, to, remainingPoolAfterStep, effect, currentPlayer)
      ) {
        return null;
      }
      const nextEffect = options.nextEffect || null;
      const landingRequiredThisStep = isAiLandingEffect(nextEffect)
        && poolRemaining > 0
        && terrainRequired >= poolRemaining;
      const landingScore = landingRequiredThisStep
        ? scoreAiLandingAfterMove(to, nextEffect, currentPlayer)
        : { ok: true, score: 0, planet: null };
      if (!landingScore.ok) return null;
      const routeScore = scoreAiMoveTowardTargets(from, to, currentPlayer);
      return {
        id: options.id || "effectMove",
        kind: "effect",
        available: true,
        rocketId: rocket.id,
        rocketLabel: formatRocketLabel(rocket),
        direction: direction.id,
        directionLabel: direction.label,
        deltaX: direction.deltaX,
        deltaY: direction.deltaY,
        from,
        to,
        terrainRequired,
        paymentRequired,
        routeTarget: routeScore.target,
        followupLanding: landingRequiredThisStep
          ? {
            planetId: landingScore.planet?.planetId || null,
            planetName: landingScore.planet?.name || null,
            score: landingScore.score,
          }
          : null,
        score: applyAiStrategyWeight(applyAiStrategyWeight(routeScore.score, "route", 0.7), "move", 0.8) * 0.75
          + direction.score * 0.25
          + applyAiStrategyWeight(landingScore.score, "orbitLand", 0.6)
          - paymentRequired * 2
          - index * 0.1,
      };
    }

    function listAiEffectMoveCandidates(options = {}) {
      const currentPlayer = getCurrentPlayer();
      if (!currentPlayer) return [];
      return getMovableTokensForPlayer(currentPlayer.id)
        .flatMap((rocket, index) => AI_MOVE_DIRECTIONS
          .map((direction) => buildAiEffectMoveCandidate(rocket, direction, index, options))
          .filter(Boolean));
    }

    function runAiActionEffectMoveDecision() {
      if (!state.pendingActionEffectFlow?.cardMoveEffect && !state.pendingActionEffectFlow?.freeMoveMode) return null;
      const currentPlayer = getCurrentPlayer();
      if (!isAiAutoBattlePlayer(currentPlayer?.id)) {
        return { ok: false, blocked: true, message: `${currentPlayer?.colorLabel || "当前玩家"}需要人工选择移动路径` };
      }

      if (state.pendingActionEffectFlow.freeMoveMode) {
        const candidates = listAiEffectMoveCandidates({ id: "freeMove", free: true });
        const selected = ai?.policy?.chooseTurnAction?.(candidates, {
          playerState,
          turnState,
          currentPlayer,
        }) || candidates[0] || null;
        if (!selected) return { ok: false, blocked: true, message: "AI 没有可用免费移动路径" };
        recordAiAutoBattleLog("move-path", `${currentPlayer.colorLabel}AI 选择免费移动 ${selected.rocketLabel} ${selected.directionLabel}`, {
          selected,
          candidates,
        });
        return executeFreeMoveForScanAction4(selected.deltaX, selected.deltaY, selected.rocketId);
      }

      const ctx = state.pendingActionEffectFlow.cardMoveEffect;
      const effect = ctx?.effect || getCurrentActionEffect();
      const nextEffect = getAiNextActionEffect();
      const candidates = listAiEffectMoveCandidates({
        id: "cardMove",
        effect,
        poolRemaining: ctx?.poolRemaining ?? effect?.options?.movementPoints ?? 1,
        nextEffect,
      });
      const selected = ai?.policy?.chooseTurnAction?.(candidates, {
        playerState,
        turnState,
        currentPlayer,
      }) || candidates[0] || null;
      if (!selected) return { ok: false, blocked: true, message: "AI 没有可用卡牌移动路径" };
      recordAiAutoBattleLog("move-path", `${currentPlayer.colorLabel}AI 选择卡牌移动 ${selected.rocketLabel} ${selected.directionLabel}`, {
        effectId: effect?.id || null,
        selected,
        candidates,
      });
      return executeCardMoveForEffect(selected.deltaX, selected.deltaY, selected.rocketId);
    }

    function findFirstAiAlienTraceButton() {
      const pickerButton = [...(els.alienTraceActions?.querySelectorAll("[data-alien-picker-step][data-alien-slot]") || [])]
        .find((button) => !button.disabled);
      if (pickerButton) {
        return { kind: "picker", button: pickerButton };
      }

      const stateSlot = [...(els.alienTraceLayers || [])]
        .flatMap((layer) => [...layer.querySelectorAll("[data-state-trace-slot].is-placeable")])
        .find((button) => !button.disabled);
      if (stateSlot) {
        return { kind: "state-slot", button: stateSlot };
      }

      const gridSelectors = [
        "[data-banrenma-trace-slot].is-placeable",
        "[data-yichangdian-trace-slot].is-placeable",
        "[data-fangzhou-trace-slot].is-placeable",
        "[data-chong-trace-slot].is-placeable",
        "[data-amiba-trace-slot].is-placeable",
        "[data-aomomo-trace-slot].is-placeable",
        "[data-runezu-trace-slot].is-placeable",
        "[data-runezu-face-symbol-slot].is-placeable",
        "[data-jiuzhe-trace-slot].is-placeable",
      ].join(",");
      const gridSlot = [...(els.alienJiuzheTraceLayers || [])]
        .flatMap((layer) => [...layer.querySelectorAll(gridSelectors)])
        .find((button) => !button.disabled);
      return gridSlot ? { kind: "grid-slot", button: gridSlot } : null;
    }

    function runAiAlienTraceDecision() {
      if (!state.pendingAlienTraceAction && (!state.alienTracePickerState || !state.alienTracePickerState.mode)) return null;
      const player = getAlienTraceActionPlayer(state.pendingAlienTraceAction);
      if (!isAiAutoBattlePlayer(player?.id)) {
        return { ok: false, blocked: true, message: `${player?.colorLabel || "当前玩家"}需要人工选择外星人痕迹` };
      }

      const target = findFirstAiAlienTraceButton();
      if (!target?.button) {
        return { ok: false, blocked: true, message: "AI 没有可用外星人痕迹目标" };
      }
      const button = target.button;
      recordAiAutoBattleLog("alien-trace", `${player.colorLabel}AI 选择外星人痕迹`, {
        kind: target.kind,
        mode: state.alienTracePickerState?.mode || null,
        alienSlot: button.dataset.alienSlot || null,
        pickerStep: button.dataset.alienPickerStep || null,
        traceType: button.dataset.traceType || null,
        label: button.textContent || "",
      });
      button.click();
      return { ok: true, progressed: true, message: "AI 已选择外星人痕迹" };
    }

    function runAiMoveActionDecision(action) {
      const currentPlayer = getCurrentPlayer();
      if (!action?.rocketId) return { ok: false, message: "AI 移动缺少火箭" };
      recordAiAutoBattleLog("move", `${currentPlayer.colorLabel}AI 移动 ${action.rocketLabel || `R${action.rocketId}`} ${action.directionLabel}`, {
        action,
      });
      return moveRocket(action.deltaX, action.deltaY, action.rocketId);
    }

    function buildAiResearchTechCandidate(tileId) {
      const stack = tech.getStack?.(techGameState.board, tileId) || null;
      const candidate = {
        tileId,
        techType: stack?.techType || tech.getTechType?.(tileId) || null,
        stackIndex: tech.getStackIndex?.(tileId) || null,
        bonusId: stack?.bonusId || null,
        firstTake: stack?.firstTakeClaimedBy == null,
        remaining: stack?.remaining ?? null,
      };
      const safety = getAiResearchTechCandidateSafety(candidate, getCurrentPlayer());
      candidate.available = safety.ok;
      candidate.reason = safety.message || null;
      candidate.plan = scoreAiResearchTechRoutePlan(candidate, getCurrentPlayer());
      candidate.score = scoreAiResearchTechValue(candidate);
      if (!safety.ok) candidate.score -= 1000;
      return candidate;
    }

    function listAiResearchTechCandidates() {
      const currentPlayer = getCurrentPlayer();
      if (!currentPlayer) return [];
      createActionContext().ensurePlayerTechState(currentPlayer);
      if (!currentPlayer.techState) return [];

      const selectionOptions = getResearchTechSelectionOptions();
      const allowedTechTypes = tech.resolver.normalizeTechTypeFilter(selectionOptions)
        || tech.resolver.normalizeTechTypeFilter({ techTypes: techGameState.ui.allowedTechTypes })
        || null;
      const candidates = tech.listTakeableTiles(
        techGameState.board,
        currentPlayer.techState,
        allowedTechTypes ? { techTypes: allowedTechTypes } : {},
      );
      return candidates
        .filter((tileId) => (
          !selectionOptions.researchedByOthersOnly
          || isTechTileOwnedByOtherPlayer(tileId)
        ))
        .map((tileId) => buildAiResearchTechCandidate(tileId))
        .filter((candidate) => candidate.available !== false);
    }

    function runAiResearchTechSelectionDecision(effect) {
      const isResearchSelectionEffect = effect?.type === "research_tech_select"
        || (
          effect?.type === cardEffects.EFFECT_TYPES.RESEARCH_TECH
          && isTechTilePickingActive()
        );
      if (!effect || (!isResearchSelectionEffect && !isTechTilePickingActive())) return null;
      const currentPlayer = getCurrentPlayer();
      if (!isAiAutoBattlePlayer(currentPlayer?.id)) {
        return { ok: false, blocked: true, message: `${currentPlayer?.colorLabel || "当前玩家"}需要人工选择科技片` };
      }

      if (techGameState.ui.pendingTileId) {
        const availableSlots = tech.getAvailableBlueSlots(currentPlayer.techState);
        const blueSlot = ai?.policy?.chooseBlueTechSlot?.(availableSlots, {
          currentPlayer,
          techGameState,
          effect,
        }) || availableSlots[0] || null;
        if (blueSlot == null) {
          return { ok: false, blocked: true, message: "AI 没有可用蓝色科技槽位" };
        }
        recordAiAutoBattleLog("tech-placement", `${currentPlayer.colorLabel}AI 选择蓝色科技槽位 ${blueSlot}`, {
          tileId: techGameState.ui.pendingTileId,
          availableSlots,
          blueSlot,
        });
        return confirmTechBlueSlotChoice(blueSlot);
      }

      const candidates = listAiResearchTechCandidates();
      const selected = ai?.policy?.chooseResearchTechTile?.(candidates, {
        currentPlayer,
        turnState,
        techGameState,
        effect,
      }) || candidates[0] || null;
      if (!selected?.tileId) {
        return { ok: false, blocked: true, message: "AI 没有可研究科技候选" };
      }
      recordAiAutoBattleLog("tech-placement", `${currentPlayer.colorLabel}AI 选择科技 ${selected.tileId}`, {
        selected,
        candidates,
      });
      const result = handleSupplyTechTileClick(selected.tileId);
      if (result?.needsBlueSlotChoice) {
        const availableSlots = result.availableSlots || [];
        const blueSlot = ai?.policy?.chooseBlueTechSlot?.(availableSlots, {
          currentPlayer,
          techGameState,
          effect,
          tileId: selected.tileId,
        }) || availableSlots[0] || null;
        if (blueSlot == null) return result;
        recordAiAutoBattleLog("tech-placement", `${currentPlayer.colorLabel}AI 选择蓝色科技槽位 ${blueSlot}`, {
          tileId: selected.tileId,
          availableSlots,
          blueSlot,
        });
        return confirmTechBlueSlotChoice(blueSlot);
      }
      return result;
    }

    function enumerateAiTurnActions() {
      const context = createActionContext();
      const currentPlayer = getCurrentPlayer();
      const candidates = [];
      if (state.pendingActionExecuted && !isActionEffectFlowActive() && !hasActivePendingSubFlow()) {
        candidates.push(...listAiMoveCandidates());
        candidates.push({ id: "end-turn", kind: "end-turn", available: true });
        return candidates;
      }
      if (!canStartMainAction()) return candidates;

      const launchCheck = actions.canExecute("launch", context);
      const postLaunchMovePlan = launchCheck.ok ? scoreAiPostLaunchMovePlan(currentPlayer) : null;
      candidates.push({
        id: "launch",
        kind: "main",
        available: launchCheck.ok,
        reason: launchCheck.message || null,
        plan: postLaunchMovePlan?.score > 0 ? postLaunchMovePlan : null,
        score: launchCheck.ok
          ? scoreAiLaunchAction(currentPlayer)
            + applyAiStrategyWeight(Math.max(0, aiNumber(postLaunchMovePlan?.score)), "move", 0.45)
          : 0,
      });
      const orbitCheck = actions.canExecute("orbit", context);
      const orbitCandidate = {
        id: "orbit",
        kind: "main",
        available: orbitCheck.ok,
        reason: orbitCheck.message || null,
        planetId: orbitCheck.planet?.planetId || null,
        planetName: orbitCheck.planet?.name || null,
      };
      orbitCandidate.score = scoreAiOrbitAction(orbitCandidate);
      candidates.push(orbitCandidate);
      const landCheck = actions.canExecute("land", context);
      const landCandidate = {
        id: "land",
        kind: "main",
        available: landCheck.ok,
        reason: landCheck.message || null,
        planetId: landCheck.planet?.planetId || null,
        planetName: landCheck.planet?.name || null,
        energyCost: landCheck.energyCost ?? null,
      };
      landCandidate.score = scoreAiLandAction(landCandidate);
      candidates.push(landCandidate);
      const researchTechCheck = actions.canExecute("researchTech", context);
      const takeableTech = researchTechCheck.ok
        ? (researchTechCheck.takeable || [])
          .map((tileId) => buildAiResearchTechCandidate(tileId))
          .filter((candidate) => candidate.available !== false)
        : [];
      const bestTechCandidate = [...takeableTech]
        .sort((left, right) => Number(right.score || 0) - Number(left.score || 0))[0] || null;
      const bestTechScore = Number(bestTechCandidate?.score || 0);
      candidates.push({
        id: "researchTech",
        kind: "main",
        available: researchTechCheck.ok && takeableTech.length > 0,
        reason: researchTechCheck.ok && !takeableTech.length
          ? "没有安全的可研究科技"
          : researchTechCheck.message || null,
        takeable: takeableTech,
        plan: bestTechCandidate?.plan || null,
        score: applyAiStrategyWeight(bestTechScore, "engine", 0.5),
      });
      const scanCheck = scanEffects.canExecuteScan(getCurrentPlayer(), { standardAction: true });
      candidates.push({
        id: "scan",
        kind: "main",
        available: scanCheck.ok,
        reason: scanCheck.message || null,
        score: scanCheck.ok ? scoreAiScanAction(currentPlayer) : 0,
      });
      const playCardCandidates = listAiPlayCardCandidates(getCurrentPlayer());
      const bestPlayCardCandidate = [...playCardCandidates]
        .sort((left, right) => Number(right.score || 0) - Number(left.score || 0))[0] || null;
      const bestPlayCardScore = Number(bestPlayCardCandidate?.score || 0);
      candidates.push({
        id: "playCard",
        kind: "main",
        available: playCardCandidates.length > 0,
        reason: playCardCandidates.length > 0
          ? null
          : "没有资源可支付的普通手牌",
        playableCards: playCardCandidates,
        plan: bestPlayCardCandidate?.plan || null,
        score: applyAiStrategyWeight(bestPlayCardScore, "engine", 0.5),
      });
      candidates.push(...listAiMoveCandidates());
      candidates.push({
        id: "pass",
        kind: "pass",
        available: true,
        reason: null,
        score: (getAiStrategyWeight("pass") - 1) * 10,
      });
      return candidates;
    }

    function runAiTurnActionDecision() {
      const currentPlayer = getCurrentPlayer();
      if (!isAiAutoBattlePlayer(currentPlayer?.id)) {
        return { ok: false, blocked: true, message: `${currentPlayer?.colorLabel || "当前玩家"}不是电脑玩家` };
      }
      const candidates = enumerateAiTurnActions();
      const action = ai?.policy?.chooseTurnAction?.(candidates, {
        playerState,
        turnState,
        currentPlayer,
      }) || null;
      if (!action) {
        return { ok: false, blocked: true, message: "AI 没有可执行行动", candidates };
      }
      recordAiAutoBattleLog("turn-action", `${currentPlayer.colorLabel}AI 执行 ${action.id}`, { action, candidates });
      if (action.id === "end-turn") {
        endCurrentTurn();
        return { ok: true, progressed: true, action };
      }
      if (action.id === "launch") {
        return runAction("launch");
      }
      if (action.id === "researchTech") {
        return researchTechForCurrentPlayer();
      }
      if (action.id === "orbit") {
        return orbitForCurrentPlayer();
      }
      if (action.id === "land") {
        return landForCurrentPlayer();
      }
      if (action.id === "scan") {
        return beginScanAction();
      }
      if (action.id === "playCard") {
        return beginPlayCardSelection();
      }
      if (action.id === "move") {
        return runAiMoveActionDecision(action);
      }
      if (action.id === "pass") {
        return passForCurrentPlayer();
      }
      return { ok: false, message: `AI 尚不支持行动 ${action.id}` };
    }

    function runAiActionEffectStep() {
      if (!state.pendingActionEffectFlow) return null;
      const effect = getCurrentActionEffect();
      const playerId = getEffectOwnerPlayer(effect)?.id || state.pendingActionEffectFlow.playerId || playerState.currentPlayerId;
      if (playerId && !isAiAutoBattlePlayer(playerId)) {
        return { ok: false, blocked: true, message: `${getPlayerLabelById(playerId)}需要人工处理效果` };
      }
      if (!effect) return { ok: false, message: "没有当前效果" };
      const researchTechResult = runAiResearchTechSelectionDecision(effect);
      if (researchTechResult) return researchTechResult;
      recordAiAutoBattleLog("effect", `AI 处理效果：${effect.label || effect.type}`, {
        effectId: effect.id || null,
        effectType: effect.type || null,
      });
      return executeActionEffect(effect);
    }

    function runAiAutomationStep() {
      try {
        if (!ai?.policy) return { ok: false, blocked: true, message: "SetiAI 未加载" };
        if (isGameEnded()) return { ok: true, done: true, message: "游戏已结束" };

        const initialResult = chooseInitialSelectionForAiPlayer();
        if (initialResult) return initialResult;

        const discardResult = runAiDiscardDecision();
        if (discardResult) return discardResult;

        const passReserveResult = runAiPassReserveDecision();
        if (passReserveResult) return passReserveResult;

        const finalScoreMarkResult = runAiFinalScoreMarkDecision();
        if (finalScoreMarkResult) return finalScoreMarkResult;

        const cardSelectionResult = runAiCardSelectionDecision();
        if (cardSelectionResult) return cardSelectionResult;

        const handScanResult = runAiHandScanDecision();
        if (handScanResult) return handScanResult;

        const playCardResult = runAiPlayCardSelectionDecision();
        if (playCardResult) return playCardResult;

        const movePaymentResult = runAiMovePaymentDecision();
        if (movePaymentResult) return movePaymentResult;

        const landTargetResult = runAiLandTargetDecision();
        if (landTargetResult) return landTargetResult;

        const scanTargetResult = runAiScanTargetDecision();
        if (scanTargetResult) return scanTargetResult;

        const effectMoveResult = runAiActionEffectMoveDecision();
        if (effectMoveResult) return effectMoveResult;

        const cardTriggerResult = runAiCardTriggerDecision();
        if (cardTriggerResult) return cardTriggerResult;

        const cardTriggerMoveResult = runAiCardTriggerFreeMoveDecision();
        if (cardTriggerMoveResult) return cardTriggerMoveResult;

        const cardTaskResult = runAiCardTaskCompletionDecision();
        if (cardTaskResult) return cardTaskResult;

        const alienTraceResult = runAiAlienTraceDecision();
        if (alienTraceResult) return alienTraceResult;

        if (hasActivePendingSubFlow()) {
          return { ok: false, blocked: true, message: "AI 遇到尚未收口的 pending 流程" };
        }

        const effectResult = runAiActionEffectStep();
        if (effectResult) return effectResult;

        return runAiTurnActionDecision();
      } catch (error) {
        const entry = recordAiAutoBattleBug(error?.message || String(error), {
          stack: error?.stack || null,
        });
        return { ok: false, blocked: true, bug: entry, message: entry.message };
      }
    }

    function waitAiAutoBattleDelay(delayMs) {
      const delay = Math.max(0, Math.round(Number(delayMs) || 0));
      if (!delay) return Promise.resolve();
      return new Promise((resolve) => windowRef.setTimeout(resolve, delay));
    }

    async function runAiAutoBattle(options = {}) {
      const randomSeed = options.seed ?? options.randomSeed ?? null;
      if (randomSeed != null && randomSeed !== "" && !options.__aiSeedApplied) {
        return runWithAiRandomSeed(randomSeed, () => runAiAutoBattle({
          ...options,
          __aiSeedApplied: true,
        }));
      }
      if (aiAutoBattleState.running) {
        return { ok: false, message: "AI 自动对战已经在运行" };
      }
      const configResult = configureAiAutoBattle({
        ...options,
        reset: options.reset === true,
        suppressAutoSchedule: true,
      });
      if (!configResult.ok) return configResult;

      const maxSteps = Math.max(1, Math.round(Number(options.maxSteps) || 200));
      const delayMs = options.stepDelayMs ?? aiAutoBattleState.stepDelayMs;
      aiAutoBattleState.running = true;
      const summary = {
        ok: true,
        steps: 0,
        stopped: false,
        blocked: false,
        gameEnded: false,
        seed: randomSeed,
        message: null,
      };
      recordAiAutoBattleLog("start", `AI 自动对战开始，最多 ${maxSteps} 步`, { maxSteps, seed: randomSeed });

      while (aiAutoBattleState.running && summary.steps < maxSteps) {
        const beforeLogCount = aiAutoBattleState.logs.length;
        const result = runAiAutomationStep();
        summary.steps += 1;
        if (result?.done || isGameEnded()) {
          summary.gameEnded = true;
          summary.message = result?.message || "游戏已结束";
          break;
        }
        if (result?.blocked || result?.ok === false) {
          const bug = recordAiAutoBattleBug(result.message || "AI 自动对战阻塞", { result });
          summary.blocked = true;
          summary.ok = false;
          summary.message = bug.message;
          if (bug.details?.repeatCount >= aiAutoBattleState.maxBugRepeats) {
            break;
          }
        }
        if (aiAutoBattleState.logs.length === beforeLogCount && !result?.progressed && result?.ok !== true) {
          summary.blocked = true;
          summary.ok = false;
          summary.message = result?.message || "AI 没有推进游戏状态";
          break;
        }
        await waitAiAutoBattleDelay(delayMs);
      }

      if (!aiAutoBattleState.running) {
        summary.stopped = true;
        summary.message = summary.message || "AI 自动对战已停止";
      } else if (summary.steps >= maxSteps && !summary.message) {
        summary.message = `达到最大步数 ${maxSteps}`;
      }
      aiAutoBattleState.running = false;
      aiAutoBattleState.lastSummary = summary;
      recordAiAutoBattleLog("finish", summary.message, summary);
      return getAiAutoBattleReport();
    }

    function stopAiAutoBattle() {
      aiAutoBattleState.running = false;
      recordAiAutoBattleLog("stop", "AI 自动对战停止");
      return getAiAutoBattleReport();
    }

    function compactAiAutoBattleSample(report, gameIndex) {
      const analysis = report?.analysis || null;
      return {
        gameIndex,
        summary: report?.lastSummary || null,
        seed: report?.lastSummary?.seed || null,
        bugCount: Array.isArray(report?.bugs) ? report.bugs.length : 0,
        playerResults: report?.playerResults || [],
        pendingState: report?.pendingState || null,
        tailLogs: Array.isArray(report?.logs) ? report.logs.slice(-5) : [],
        analysis: analysis
          ? {
            turnActionCount: analysis.turnActionCount,
            actionCounts: analysis.actionCounts,
            actionCategoryRatios: analysis.actionCategoryRatios,
            opportunities: analysis.opportunities,
            scoreOpportunities: analysis.scoreOpportunities,
            topScoreGaps: analysis.topScoreGaps,
            movePayment: analysis.movePayment,
            routeTargets: analysis.routeTargets,
            moveFollowups: analysis.moveFollowups,
            turnPlans: analysis.turnPlans,
            turnPlanTypes: analysis.turnPlanTypes,
            turnPlanActions: analysis.turnPlanActions,
            finalScoreMarks: analysis.finalScoreMarks,
            finalScoreFormulas: analysis.finalScoreFormulas,
            topMissedCandidates: analysis.topMissedCandidates,
            winnerProfileDeltas: analysis.winnerProfileDeltas,
            winner: analysis.winner,
            strategyTuning: analysis.strategyTuning,
            recommendations: analysis.recommendations,
            bugs: analysis.bugs,
          }
          : null,
      };
    }

    async function runAiAutoBattleBatch(options = {}) {
      if (aiAutoBattleState.running) {
        return { ok: false, message: "AI 自动对战已经在运行" };
      }
      const games = Math.min(100, Math.max(1, Math.round(Number(options.games) || 5)));
      const samples = [];
      const analyses = [];
      const stopOnBlocked = options.stopOnBlocked !== false;

      for (let index = 0; index < games; index += 1) {
        const seed = getAiBatchSeed(options, index);
        const report = await runAiAutoBattle({
          ...options,
          seed,
          reset: true,
        });
        if (!report?.logs) {
          return report;
        }
        const analysis = report.analysis || ai?.analytics?.analyzeBattleReport?.(report) || null;
        if (analysis) analyses.push(analysis);
        samples.push(compactAiAutoBattleSample({ ...report, analysis }, index + 1));
        if (stopOnBlocked && (report.lastSummary?.blocked || report.bugs?.length)) {
          break;
        }
      }

      const summary = ai?.analytics?.summarizeBattleAnalyses
        ? ai.analytics.summarizeBattleAnalyses(analyses)
        : null;
      const blockedGames = samples.filter((sample) => sample.summary?.blocked || sample.bugCount > 0).length;
      const strategyTuningHistoryEntry = summary && options.recordStrategyTuning !== false
        ? recordAiStrategyTuningSummary(summary, {
          label: options.strategyTuningLabel || options.label || null,
          gamesRequested: games,
          gamesRun: samples.length,
          appliedWeights: getAiStrategyWeights(),
          maxHistory: options.strategyTuningHistoryLimit,
        })
        : null;
      const strategyTuningRecommendation = getAiStrategyTuningRecommendation({
        learningRate: options.tuningLearningRate,
      });
      if (options.applyHistoryRecommendation && strategyTuningRecommendation?.weights) {
        applyAiStrategyTuning(strategyTuningRecommendation);
      }
      return structuredClone({
        ok: blockedGames === 0 && samples.length === games,
        gamesRequested: games,
        gamesRun: samples.length,
        stoppedEarly: samples.length < games,
        summary,
        strategyTuningHistoryEntry,
        strategyTuningRecommendation,
        samples,
      });
    }

    async function runAiStrategyABTest(options = {}) {
      if (aiAutoBattleState.running) {
        return { ok: false, message: "AI 自动对战已经在运行" };
      }
      const games = Math.min(50, Math.max(1, Math.round(Number(options.games) || 3)));
      const seedBase = options.seed ?? options.randomSeed ?? `strategy-ab-${Date.now()}`;
      const seeds = Array.isArray(options.seeds) && options.seeds.length
        ? options.seeds.slice(0, games)
        : Array.from({ length: games }, (_item, index) => `${seedBase}:${index + 1}`);
      while (seeds.length < games) {
        seeds.push(`${seedBase}:${seeds.length + 1}`);
      }

      const originalWeights = getAiStrategyWeights();
      const baselineWeights = normalizeAiStrategyWeights(
        options.baselineWeights || AI_STRATEGY_WEIGHT_DEFAULTS,
        { merge: false },
      );
      const recommendation = options.strategyTuning
        || options.tunedStrategyTuning
        || getAiStrategyTuningRecommendation({ learningRate: options.tuningLearningRate });
      const tunedWeights = normalizeAiStrategyWeights(
        options.tunedWeights || recommendation?.weights || originalWeights,
        { merge: false },
      );
      const sharedOptions = {
        activePlayerCount: options.activePlayerCount,
        maxSteps: options.maxSteps,
        stepDelayMs: options.stepDelayMs,
        maxBugRepeats: options.maxBugRepeats,
        maxMovesPerTurn: options.maxMovesPerTurn,
        stopOnBlocked: options.stopOnBlocked,
        tuningLearningRate: options.tuningLearningRate,
        recordStrategyTuning: options.recordStrategyTuning === true,
        strategyTuningHistoryLimit: options.strategyTuningHistoryLimit,
      };

      try {
        configureAiStrategyWeights(baselineWeights, { merge: false });
        const baseline = await runAiAutoBattleBatch({
          ...sharedOptions,
          games,
          seeds,
          strategyWeights: baselineWeights,
          mergeStrategyWeights: false,
          strategyTuningLabel: options.baselineLabel || "ab-baseline",
        });

        configureAiStrategyWeights(tunedWeights, { merge: false });
        const tuned = await runAiAutoBattleBatch({
          ...sharedOptions,
          games,
          seeds,
          strategyWeights: tunedWeights,
          mergeStrategyWeights: false,
          strategyTuningLabel: options.tunedLabel || "ab-tuned",
        });

        const comparison = ai?.analytics?.compareStrategyBatchResults
          ? ai.analytics.compareStrategyBatchResults(
            {
              ...baseline,
              strategyWeights: baselineWeights,
            },
            {
              ...tuned,
              strategyWeights: tunedWeights,
            },
            {
              label: options.label || null,
              seedBase,
            },
          )
          : null;

        if (options.keepTunedWeights) {
          configureAiStrategyWeights(tunedWeights, { merge: false });
        } else {
          configureAiStrategyWeights(originalWeights, { merge: false });
        }
        const strategyABHistoryEntry = comparison && options.recordABResult !== false
          ? recordAiStrategyABComparison(comparison, {
            label: options.strategyTuningLabel || options.label || null,
            seedBase,
            gamesRun: games,
            baselineWeights,
            tunedWeights,
            maxHistory: options.strategyTuningHistoryLimit,
          })
          : null;
        const strategyTuningRecommendation = getAiStrategyTuningRecommendation({
          learningRate: options.tuningLearningRate,
        });
        if (options.applyHistoryRecommendation && strategyTuningRecommendation?.weights) {
          applyAiStrategyTuning(strategyTuningRecommendation);
        }

        return structuredClone({
          ok: Boolean(baseline?.ok && tuned?.ok),
          games,
          seedBase,
          seeds,
          baselineWeights,
          tunedWeights,
          recommendation,
          comparison,
          strategyABHistoryEntry,
          strategyTuningRecommendation,
          baseline,
          tuned,
        });
      } catch (error) {
        configureAiStrategyWeights(originalWeights, { merge: false });
        throw error;
      }
    }

    async function runAiStrategyTuningCycle(options = {}) {
      if (aiAutoBattleState.running) {
        return { ok: false, message: "AI 自动对战已经在运行" };
      }
      const originalWeights = getAiStrategyWeights();
      const baselineWeights = normalizeAiStrategyWeights(
        options.baselineWeights || originalWeights,
        { merge: false },
      );
      const seedBase = options.seed ?? options.randomSeed ?? `strategy-cycle-${Date.now()}`;
      const games = Math.min(100, Math.max(1, Math.round(Number(options.games ?? options.batchGames) || 5)));
      const abGames = Math.min(50, Math.max(1, Math.round(Number(options.abGames) || games)));
      const sharedOptions = {
        activePlayerCount: options.activePlayerCount,
        maxSteps: options.maxSteps,
        stepDelayMs: options.stepDelayMs,
        maxBugRepeats: options.maxBugRepeats,
        maxMovesPerTurn: options.maxMovesPerTurn,
        stopOnBlocked: options.stopOnBlocked,
        tuningLearningRate: options.tuningLearningRate,
        strategyTuningHistoryLimit: options.strategyTuningHistoryLimit,
      };

      try {
        configureAiStrategyWeights(baselineWeights, { merge: false });
        const baselineBatch = await runAiAutoBattleBatch({
          ...sharedOptions,
          games,
          seed: `${seedBase}:baseline`,
          strategyWeights: baselineWeights,
          mergeStrategyWeights: false,
          recordStrategyTuning: options.recordBaselineTuning !== false,
          strategyTuningLabel: options.baselineLabel || "cycle-baseline",
        });

        if (!baselineBatch?.ok && options.continueOnBaselineBlocked !== true) {
          if (options.restoreWeights !== false) {
            configureAiStrategyWeights(originalWeights, { merge: false });
          }
          return structuredClone({
            ok: false,
            phase: "baseline",
            seedBase,
            games,
            abGames,
            baselineWeights,
            originalWeights,
            baselineBatch,
            message: baselineBatch?.summary?.topBugs?.[0]?.key
              || baselineBatch?.samples?.[0]?.summary?.message
              || "baseline 批量对战未完整通过，跳过 A/B",
          });
        }

        const recommendation = options.strategyTuning
          || options.tunedStrategyTuning
          || baselineBatch?.summary?.strategyTuning
          || baselineBatch?.strategyTuningRecommendation
          || getAiStrategyTuningRecommendation({ learningRate: options.tuningLearningRate });
        const tunedWeights = normalizeAiStrategyWeights(
          options.tunedWeights || recommendation?.weights || baselineWeights,
          { merge: false },
        );

        const abTest = await runAiStrategyABTest({
          ...sharedOptions,
          games: abGames,
          seed: `${seedBase}:ab`,
          baselineWeights,
          tunedWeights,
          strategyTuning: recommendation,
          recordABResult: options.recordABResult !== false,
          recordStrategyTuning: options.recordABBatchTuning === true,
          keepTunedWeights: false,
          baselineLabel: options.abBaselineLabel || "cycle-ab-baseline",
          tunedLabel: options.abTunedLabel || "cycle-ab-tuned",
          strategyTuningLabel: options.strategyTuningLabel || options.label || "cycle-ab",
        });
        const selectedVariant = abTest?.strategyABHistoryEntry?.selectedVariant
          || (abTest?.comparison?.verdict?.improved ? "tuned" : "baseline");
        const selectedWeights = selectedVariant === "tuned" ? tunedWeights : baselineWeights;
        let appliedWeights = null;
        if (options.applySelectedWeights || (options.applyImprovedWeights && selectedVariant === "tuned")) {
          appliedWeights = configureAiStrategyWeights(selectedWeights, { merge: false }).weights;
        } else if (options.restoreWeights !== false) {
          configureAiStrategyWeights(originalWeights, { merge: false });
        }

        return structuredClone({
          ok: Boolean(baselineBatch?.ok && abTest?.ok),
          seedBase,
          games,
          abGames,
          originalWeights,
          baselineWeights,
          tunedWeights,
          selectedVariant,
          selectedWeights,
          appliedWeights,
          recommendation,
          baselineBatch,
          abTest,
        });
      } catch (error) {
        if (options.restoreWeights !== false) {
          configureAiStrategyWeights(originalWeights, { merge: false });
        }
        throw error;
      }
    }

    return {
      aiNumber,
      applyAiStrategyTuning,
      applyAiStrategyTuningRecommendation,
      applyAiStrategyWeight,
      cardTriggerNeedsFreeMove,
      clearAiStrategyTuningHistory,
      configureAiAutoBattle,
      configureAiStrategyWeights,
      configureDefaultAiOpponent,
      getAiAutoBattleAnalysis,
      getAiAutoBattleReport,
      getAiMapDemand,
      getAiRemainingRoundWeight,
      getAiStrategyDemand,
      getAiStrategyTuningHistory,
      getAiStrategyTuningRecommendation,
      getAiStrategyWeights,
      getCardTriggerFreeMoveEffect,
      getPlayerAgentLabel,
      isAiAutoBattlePlayer,
      listCardTriggerFreeMoveCandidates,
      recordAiAutoBattleLog,
      resetAiStrategyWeights,
      runAiAutoBattle,
      runAiAutoBattleBatch,
      runAiAutomationStep,
      runAiStrategyABTest,
      runAiStrategyTuningCycle,
      scheduleAiAutoStepIfNeeded,
      stopAiAutoBattle,
      sumAiDemandMap,
    };
  }

  return { createAiController };
});
