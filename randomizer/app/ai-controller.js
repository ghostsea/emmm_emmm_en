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
      industry,
      abilities,
      actions,
      scanEffects,
      cards,
      cardEffects,
      cardTaskStateModule,
      initialCards,
      tech,
      data,
      aliens,
      aomomo,
      jiuzhe,
      yichangdian,
      fangzhou,
      banrenma,
      chong,
      amiba,
      runezu,
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
      cardTaskState,
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
      analyzeDataForCurrentPlayer,
      beginPlayCardSelection,
      beginScanAction,
      buildSectorScanChoicesForX,
      buildSectorScanChoicesForXs,
      canBlindDraw,
      canPayForMove,
      canStartMainAction,
      cancelTechSelection,
      clearTransientStateForRecovery,
      computePlayerFinalScoreBreakdown,
      confirmCardTaskCompletion,
      confirmCardCornerQuickAction,
      confirmDataPlacement,
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
      executeFreeMoveForCardCorner,
      executeFreeMoveForCardTrigger,
      executeFreeMoveForScanAction4,
      executeIndustryFreeMove,
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
      listAiAlienTraceFallbackChoices,
      applyAiAlienTraceFallbackChoice,
      getRequiredMovePointsForUi,
      getResearchTechSelectionOptions,
      getSectorContentForMove,
      getSectorXsMatchingCondition,
      handleAmibaCardGainChoice,
      handleAmibaSymbolChoice,
      handleAmibaTraceRemovalChoice,
      handleAomomoCardGainChoice,
      handleBanrenmaBonusChoice,
      handleBanrenmaCardConditionChoice,
      handleBanrenmaCardGainChoice,
      handleCardTriggerChoice,
      handleChongCardGainChoice,
      handleChongFossilChoice,
      handleChongTaskCompletionChoice,
      handleConditionalSectorChoice,
      handleCompanyActionMarkerClick,
      handleHandCardCornerQuickAction,
      handleHandScanCardClick,
      handleJiuzheCardChoice,
      handleJiuzheOpportunitySkip,
      handleOptionalHandScanChoice,
      handlePlayCardSelect,
      handlePublicScanCardClick,
      handleRunezuCardGainChoice,
      handleRunezuFaceSymbolChoice,
      handleRunezuSymbolBranchChoice,
      handleScanAction4Choice,
      handleSupplyTechTileClick,
      handleYichangdianCardGainChoice,
      handleYichangdianCornerChoice,
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
      resetScanRunSequence,
      restoreMutableObject,
      runAction,
      runPlaceDataToComputer,
      runAiFinalScoreMarkDecision,
      selectPassReserveCard,
      sectorXHasAvailableScanTarget,
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
      playerDifficulties: {},
      defaultDifficulty: "easy",
      explorationEpsilon: 0,
      explorationTemperature: 1,
      mctsRootNoiseEnabled: false,
      mctsRootNoiseAlpha: 0.3,
      mctsRootNoiseWeight: 0.25,
      mctsSimulationsPerMove: null,
      mctsMaxDepth: null,
      mctsCpuct: null,
      mctsRolloutDepth: null,
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
      credits: 4.2,
      energy: 2.8,
      handSize: 3.4,
      availableData: 1.5,
      movement: 1.5,
      publicity: 1.5,
      additionalPublicScan: 1.5,
    });
    const AI_SCAN_COLORS = Object.freeze(["yellow", "red", "blue", "black"]);
    const AI_TECH_TYPES = Object.freeze(["orange", "purple", "blue"]);
    const AI_TRACE_TYPES = Object.freeze(["yellow", "pink", "blue"]);
    const AI_INCOME_DISCARD_TYPES = new Set([
      "income",
      "initial_income",
      "planet_reward_income",
      "place_data_income",
      "industry_helios_income",
      "discard_any_income",
    ]);
    const aiSeed = root.SetiAISeed || (typeof require === "function" ? require("../game/ai/seed") : null);
    const AI_DIFFICULTY_PROFILES = Object.freeze({
      easy: Object.freeze({
        mode: "legacy",
        quickBeamWidth: 3,
        mainBeamWidth: 6,
        mctsSimulationsPerMove: 0,
        mctsMaxDepth: 0,
        mctsCpuct: 0,
        mctsRolloutDepth: 0,
        decisionTimeLimitMs: 0,
      }),
      normal: Object.freeze({
        mode: "search",
        quickBeamWidth: 3,
        mainBeamWidth: 7,
        mctsSimulationsPerMove: 64,
        mctsMaxDepth: 4,
        mctsCpuct: 1.8,
        mctsRolloutDepth: 3,
        decisionTimeLimitMs: 50,
      }),
      expert: Object.freeze({
        mode: "search",
        quickBeamWidth: 5,
        mainBeamWidth: 10,
        mctsSimulationsPerMove: 128,
        mctsMaxDepth: 6,
        mctsCpuct: 1.2,
        mctsRolloutDepth: 0,
        decisionTimeLimitMs: 250,
      }),
    });
    const FORCE_PURE_RL_MODE = root.SetiForcePureRlMode === true;
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

    function cloneAiLogDetails(value) {
      if (value == null) return value;
      try {
        if (typeof structuredClone === "function") return structuredClone(value);
      } catch (_error) {
        // Fall through to JSON-safe serialization.
      }
      const seen = new WeakSet();
      return JSON.parse(JSON.stringify(value, (key, entry) => {
        if (typeof entry === "function") {
          return `[Function:${entry.name || "anonymous"}]`;
        }
        if (typeof entry === "object" && entry !== null) {
          if (seen.has(entry)) return "[Circular]";
          seen.add(entry);
        }
        return entry;
      }));
    }

    function createAiAutoBattleEntry(type, message, details = {}) {
      const currentPlayer = getCurrentPlayer();
      const rawTurnNumber = turnState.turnNumber;
      return {
        id: aiAutoBattleState.logs.length + aiAutoBattleState.bugs.length + 1,
        type,
        roundNumber: turnState.roundNumber,
        turnNumber: getAiDisplayedTurnNumber(rawTurnNumber),
        rawTurnNumber,
        playerId: currentPlayer?.id || playerState.currentPlayerId || null,
        playerLabel: currentPlayer?.colorLabel || currentPlayer?.name || null,
        message: String(message || ""),
        details: cloneAiLogDetails(details || {}),
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

    function logAiMctsSearchTrace(stage, details = {}) {
      const message = `MCTS ${stage}`;
      recordAiAutoBattleLog("mcts-search", message, details);
      if (typeof console !== "undefined" && typeof console.info === "function") {
        console.info(`[SetiAI][MCTS] ${stage}`, details);
      }
      const runtimeLogUrl = String(
        root.SETI_AI_RUNTIME_LOG_URL
        || (root.SETI_ENTITY_MODEL_SERVER_URL ? `${root.SETI_ENTITY_MODEL_SERVER_URL}/runtime-log` : "")
        || "",
      ).trim();
      if (runtimeLogUrl && typeof fetch === "function") {
        fetch(runtimeLogUrl, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            source: "ai-controller",
            category: "mcts-search",
            stage,
            roundNumber: turnState.roundNumber,
            turnNumber: turnState.turnNumber,
            playerId: playerState.currentPlayerId,
            details,
          }),
        }).catch(() => {
          // Ignore runtime log transport failures.
        });
      }
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
        pendingJiuzheCardPlay: Boolean(state.pendingJiuzheCardPlay),
        pendingYichangdianCardGain: Boolean(state.pendingYichangdianCardGain),
        pendingYichangdianCornerAction: Boolean(state.pendingYichangdianCornerAction),
        pendingBanrenmaCardGain: Boolean(state.pendingBanrenmaCardGain),
        pendingBanrenmaOpportunity: Boolean(state.pendingBanrenmaOpportunity),
        pendingChongTaskCompletion: Boolean(state.pendingChongTaskCompletion),
        pendingChongCardGain: Boolean(state.pendingChongCardGain),
        pendingChongFossilChoice: Boolean(state.pendingChongFossilChoice),
        pendingAmibaCardGain: Boolean(state.pendingAmibaCardGain),
        pendingAmibaSymbolChoice: Boolean(state.pendingAmibaSymbolChoice),
        pendingAmibaTraceRemoval: Boolean(state.pendingAmibaTraceRemoval),
        pendingAomomoCardGain: Boolean(state.pendingAomomoCardGain),
        pendingRunezuCardGain: Boolean(state.pendingRunezuCardGain),
        pendingRunezuSymbolBranch: Boolean(state.pendingRunezuSymbolBranch),
        pendingRunezuFaceSymbolPlacement: Boolean(state.pendingRunezuFaceSymbolPlacement),
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

    function getAiAutoBattlePlayerDifficulties() {
      return structuredClone(aiAutoBattleState.playerDifficulties || {});
    }

    function getAiAutoBattlePlayerDifficulty(playerId = playerState.currentPlayerId) {
      return normalizeAiDifficulty(
        aiAutoBattleState.playerDifficulties?.[playerId]
        || aiAutoBattleState.defaultDifficulty
        || "easy",
      );
    }

    function isAiAutoBattlePlayer(playerId = playerState.currentPlayerId) {
      return aiAutoBattleState.enabled
        && getAiAutoBattlePlayerIds().includes(playerId);
    }

    function isAiIncomeDiscardType(type) {
      return AI_INCOME_DISCARD_TYPES.has(String(type || ""));
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

    function getDefaultAiOpponentPlayerIds() {
      const humanPlayerId = getDefaultHumanPlayerId();
      const activeIds = (turnState.activePlayerIds || []).filter((playerId) => getPlayerById(playerId));
      const opponents = activeIds.filter((playerId) => playerId !== humanPlayerId);
      if (opponents.length) return opponents;
      return playerState.players
        .filter((player) => player.id !== humanPlayerId)
        .slice(0, Math.max(0, DEFAULT_ACTIVE_PLAYER_COUNT - 1))
        .map((player) => player.id);
    }

    function configureDefaultAiOpponent() {
      const aiPlayerIds = getDefaultAiOpponentPlayerIds();
      if (!aiPlayerIds.length) return { ok: false, message: "没有可用的默认电脑玩家" };
      aiAutoBattleState.enabled = true;
      aiAutoBattleState.playerIds = aiPlayerIds;
      configureAiAutoBattleDifficulties(aiPlayerIds, { difficulty: "expert" });
      aiAutoStepPausedOnBug = false;
      recordAiAutoBattleLog("config", `默认电脑玩家：${aiPlayerIds.map(getPlayerLabelById).join("、")}`, {
        playerIds: aiPlayerIds,
        humanPlayerId: getDefaultHumanPlayerId(),
        mode: "default-human-vs-ai",
        playerDifficulties: { ...aiAutoBattleState.playerDifficulties },
      });
      return { ok: true, playerIds: [...aiPlayerIds], message: "默认人机对局已配置" };
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
      const difficultyConfig = configureAiAutoBattleDifficulties(playerIds, options);
      aiAutoStepPausedOnBug = false;
      recordAiAutoBattleLog("config", `电脑玩家：${playerIds.map((playerId) => `${getPlayerLabelById(playerId)}(${getAiAutoBattlePlayerDifficulty(playerId)})`).join("、")}`, {
        playerIds,
        playerDifficulties: difficultyConfig.playerDifficulties,
        defaultDifficulty: difficultyConfig.defaultDifficulty,
      });
      return {
        ok: true,
        playerIds: [...playerIds],
        playerDifficulties: difficultyConfig.playerDifficulties,
        defaultDifficulty: difficultyConfig.defaultDifficulty,
        message: "电脑玩家已配置",
      };
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

    async function runScheduledAiAutoStep() {
      aiAutoStepScheduled = false;
      if (!shouldAutoRunCurrentAiPlayer()) return;

      aiAutoStepInProgress = true;
      let result = null;
      try {
        result = await runAiAutomationStepAsync();
      } finally {
        aiAutoStepInProgress = false;
      }

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
      const requestedActivePlayerCount = options.activePlayerCount == null
        ? DEFAULT_ACTIVE_PLAYER_COUNT
        : options.activePlayerCount;
      const activePlayerCount = Math.min(
        Math.max(1, Math.round(Number(requestedActivePlayerCount) || DEFAULT_ACTIVE_PLAYER_COUNT)),
        players.PLAYER_COLOR_IDS.length,
      );
      if (options.clearLogs !== false) {
        aiAutoBattleState.logs = [];
        aiAutoBattleState.bugs = [];
        aiAutoBattleState.bugCounts = {};
        aiAutoBattleState.lastSummary = null;
      }
      aiAutoBattleState.turnMoveCounts = {};
      aiAutoBattleState.playerDifficulties = {};
      aiAutoBattleState.defaultDifficulty = "easy";
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
      if (typeof resetScanRunSequence === "function") resetScanRunSequence();
      resetActionLog();
      initializeCardGame(DEFAULT_INITIAL_HAND_COUNT);
      randomizeAll();
      startInitialSelection();
      return {
        ok: true,
        activePlayerCount,
        playerIds: [...turnState.activePlayerIds],
        playerDifficulties: { ...aiAutoBattleState.playerDifficulties },
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
        if (options.explorationEpsilon != null) {
          aiAutoBattleState.explorationEpsilon = Math.max(0, Math.min(1, Number(options.explorationEpsilon) || 0));
        }
        if (options.explorationTemperature != null) {
          aiAutoBattleState.explorationTemperature = Math.max(0.05, Number(options.explorationTemperature) || 1);
        }
        if (options.mctsRootNoiseEnabled != null) {
          aiAutoBattleState.mctsRootNoiseEnabled = Boolean(options.mctsRootNoiseEnabled);
        }
        if (options.mctsRootNoiseAlpha != null) {
          aiAutoBattleState.mctsRootNoiseAlpha = Math.max(1e-8, Number(options.mctsRootNoiseAlpha) || aiAutoBattleState.mctsRootNoiseAlpha);
        }
        if (options.mctsRootNoiseWeight != null) {
          aiAutoBattleState.mctsRootNoiseWeight = Math.max(0, Math.min(1, Number(options.mctsRootNoiseWeight) || aiAutoBattleState.mctsRootNoiseWeight));
        }
        if (options.mctsSimulationsPerMove != null || options.simulations != null) {
          const value = Number(options.mctsSimulationsPerMove ?? options.simulations);
          aiAutoBattleState.mctsSimulationsPerMove = Math.max(1, Math.round(Number.isFinite(value) ? value : 1));
        }
        if (options.mctsMaxDepth != null || options.maxDepth != null) {
          const value = Number(options.mctsMaxDepth ?? options.maxDepth);
          aiAutoBattleState.mctsMaxDepth = Math.max(1, Math.round(Number.isFinite(value) ? value : 1));
        }
        if (options.mctsCpuct != null || options.cpuct != null) {
          const value = Number(options.mctsCpuct ?? options.cpuct);
          aiAutoBattleState.mctsCpuct = Math.max(0.1, Number.isFinite(value) ? value : 1);
        }
        if (options.mctsRolloutDepth != null || options.rolloutDepth != null) {
          const value = Number(options.mctsRolloutDepth ?? options.rolloutDepth);
          aiAutoBattleState.mctsRolloutDepth = Math.max(0, Math.round(Number.isFinite(value) ? value : 0));
        }
        const configResult = setAiAutoBattlePlayers(options);
        const diagnosticModel = ai?.expertTrainedModels?.getExpertBehaviorCloneModel?.()
          || ai?.expertTrainedModels?.EXPERT_BEHAVIOR_CLONE_MODEL
          || null;
        const onnxDiagnostics = ai?.behaviorCloning?.getOnnxRuntimeDiagnostics?.(diagnosticModel, {
          executionProviders: ["cuda"],
        }) || null;
        if (onnxDiagnostics) {
          recordAiAutoBattleLog("onnx-diagnostics", "ONNX Runtime 诊断", onnxDiagnostics);
          if (typeof console !== "undefined" && typeof console.info === "function") {
            console.info("[SetiAI][ONNX]", onnxDiagnostics);
          }
        }
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

    function cloneSimulationValue(value) {
      if (value == null) return value;
      if (typeof structuredClone === "function") return structuredClone(value);
      return JSON.parse(JSON.stringify(value));
    }

    function buildRuleEngineSimulationContext(sourceContext = createActionContext()) {
      const simContext = {
        ...sourceContext,
        solarState: cloneSimulationValue(sourceContext?.solarState || solarState),
        playerState: cloneSimulationValue(sourceContext?.playerState || playerState),
        cardState: cloneSimulationValue(sourceContext?.cardState || cardState),
        rocketState: cloneSimulationValue(sourceContext?.rocketState || rocketState),
        nebulaDataState: cloneSimulationValue(sourceContext?.nebulaDataState || nebulaDataState),
        planetStatsState: cloneSimulationValue(sourceContext?.planetStatsState || planetStatsState),
        alienGameState: cloneSimulationValue(sourceContext?.alienGameState || alienGameState),
        finalScoringState: cloneSimulationValue(sourceContext?.finalScoringState || finalScoringState),
        techBoardState: cloneSimulationValue(sourceContext?.techBoardState || techGameState?.board),
        techUiState: cloneSimulationValue(sourceContext?.techUiState || techGameState?.ui),
        techGameState: cloneSimulationValue(sourceContext?.techGameState || techGameState),
        turnState: cloneSimulationValue(sourceContext?.turnState || turnState),
      };

      simContext.roundNumber = Number(simContext?.turnState?.roundNumber || sourceContext?.roundNumber || turnState.roundNumber || 1);
      simContext.turnNumber = Number(simContext?.turnState?.turnNumber || sourceContext?.turnNumber || turnState.turnNumber || 1);
      Object.defineProperties(simContext, {
        getEarthSectorCoordinate: {
          enumerable: false,
          value: () => getEarthSectorCoordinate(),
        },
        getPlanetLocations: {
          enumerable: false,
          value: () => {
            const snapshot = solar?.createSolarSnapshot?.(simContext.solarState);
            return Array.isArray(snapshot?.planetLocations) ? snapshot.planetLocations : [];
          },
        },
        launchRocketAtEarth: {
          enumerable: false,
          value: (player) => rocketActions.launchRocketAtSector(
            simContext.rocketState,
            simContext.getEarthSectorCoordinate(),
            {
              playerId: player.id,
              color: player.color,
            },
          ),
        },
        ensurePlayerTechState: {
          enumerable: false,
          value: (player) => {
            if (!player?.techState) {
              player.techState = players.normalizePlayerTechState(null);
            }
          },
        },
      });

      if (simContext.techGameState && typeof simContext.techGameState === "object") {
        simContext.techGameState.board = simContext.techBoardState;
        simContext.techGameState.ui = simContext.techUiState;
      }
      return simContext;
    }

    function evaluateRuleEngineBoardState(simContext, rootPlayerId) {
      const evaluator = ai?.evaluator;
      if (!evaluator?.evaluatePlayerState) return 0;
      const evalState = {
        playerState: simContext.playerState,
        turnState: simContext.turnState,
        rocketState: simContext.rocketState,
        planetStats: simContext.planetStatsState,
        techState: simContext.techGameState,
        solarSystem: simContext.solarState,
        finalScoringState: simContext.finalScoringState,
        alienGameState: simContext.alienGameState,
        cardEffects,
        getCardTypeCode,
      };
      const rootValue = Number(evaluator.evaluatePlayerState(evalState, rootPlayerId) || 0);
      const opponents = (simContext?.playerState?.players || []).filter((entry) => entry?.id && entry.id !== rootPlayerId);
      const opponentValues = opponents
        .map((entry) => Number(evaluator.evaluatePlayerState(evalState, entry.id) || 0))
        .filter((entry) => Number.isFinite(entry));
      const opponentAverage = opponentValues.length
        ? opponentValues.reduce((sum, value) => sum + value, 0) / opponentValues.length
        : 0;
      return (rootValue - opponentAverage) / 100;
    }

    function getRuleEngineSimCurrentPlayer(simContext, playerId = null) {
      if (!simContext?.playerState) return null;
      if (playerId) simContext.playerState.currentPlayerId = playerId;
      return players.getCurrentPlayer(simContext.playerState);
    }

    function getRuleEngineSimActivePlayerIds(simContext) {
      const explicit = Array.isArray(simContext?.turnState?.activePlayerIds)
        ? simContext.turnState.activePlayerIds.filter(Boolean)
        : [];
      if (explicit.length) return explicit;
      return (simContext?.playerState?.players || [])
        .map((entry) => entry?.id)
        .filter(Boolean);
    }

    function advanceRuleEngineSimTurn(simContext, currentPlayerId) {
      const activePlayerIds = getRuleEngineSimActivePlayerIds(simContext);
      if (!activePlayerIds.length) {
        return {
          nextPlayerId: currentPlayerId,
          wrapped: false,
        };
      }
      const currentIndex = Math.max(0, activePlayerIds.indexOf(currentPlayerId));
      const nextIndex = (currentIndex + 1) % activePlayerIds.length;
      const wrapped = nextIndex <= currentIndex;
      const nextPlayerId = activePlayerIds[nextIndex] || activePlayerIds[0];
      if (simContext?.turnState) {
        simContext.turnState.turnNumber = Math.max(1, Math.round(Number(simContext.turnState.turnNumber || 1))) + 1;
        if (wrapped) {
          simContext.turnState.roundNumber = Math.max(1, Math.round(Number(simContext.turnState.roundNumber || 1))) + 1;
        }
      }
      simContext.roundNumber = Number(simContext?.turnState?.roundNumber || simContext?.roundNumber || 1);
      simContext.turnNumber = Number(simContext?.turnState?.turnNumber || simContext?.turnNumber || 1);
      if (simContext?.playerState) simContext.playerState.currentPlayerId = nextPlayerId;
      return {
        nextPlayerId,
        wrapped,
      };
    }

    function isRuleEngineMainActionId(actionId) {
      return actionId === "launch"
        || actionId === "orbit"
        || actionId === "land"
        || actionId === "researchTech"
        || actionId === "scan"
        || actionId === "analyze"
        || actionId === "playCard"
        || actionId === "pass";
    }

    function getRuleEngineMovePaymentCardIndex(player) {
      const hand = Array.isArray(player?.hand) ? player.hand : [];
      return hand.findIndex((card) => isMovePaymentCard(card));
    }

    function canRuleEnginePayMoveCost(player, requiredMovePoints = 1) {
      const required = Math.max(1, Math.round(Number(requiredMovePoints) || 1));
      let remainingEnergy = Math.max(0, Math.round(Number(player?.resources?.energy) || 0));
      let remainingMoveCards = Math.max(0, (Array.isArray(player?.hand) ? player.hand : []).filter((card) => isMovePaymentCard(card)).length);
      for (let index = 0; index < required; index += 1) {
        if (remainingEnergy > 0) {
          remainingEnergy -= 1;
        } else if (remainingMoveCards > 0) {
          remainingMoveCards -= 1;
        } else {
          return false;
        }
      }
      return true;
    }

    function payRuleEngineMoveCost(player, simContext, requiredMovePoints = 1) {
      const required = Math.max(1, Math.round(Number(requiredMovePoints) || 1));
      for (let index = 0; index < required; index += 1) {
        const energy = Math.max(0, Math.round(Number(player?.resources?.energy) || 0));
        if (energy > 0) {
          const paid = players.spendResources(player, { energy: 1 });
          if (!paid?.ok) return paid;
          continue;
        }
        const handIndex = getRuleEngineMovePaymentCardIndex(player);
        if (handIndex < 0) return { ok: false, message: "移动支付失败：没有可用能量或移动牌" };
        const discardResult = cards.discardFromHandAtIndex(player, handIndex);
        if (!discardResult?.ok) return discardResult;
        cards.addToDiscardPile(simContext.cardState, discardResult.card);
      }
      return { ok: true };
    }

    function applyRuleEnginePlacementBonuses(player, simContext, bonuses = []) {
      for (const bonus of bonuses || []) {
        if (!bonus) continue;
        if (bonus.type === "publicity") players.gainResources(player, { publicity: Math.max(0, Math.round(Number(bonus.publicity) || 0)) });
        else if (bonus.type === "score") players.gainResources(player, { score: Math.max(0, Math.round(Number(bonus.score) || 0)) });
        else if (bonus.type === "credits") players.gainResources(player, { credits: Math.max(0, Math.round(Number(bonus.credits) || 0)) });
        else if (bonus.type === "energy") players.gainResources(player, { energy: Math.max(0, Math.round(Number(bonus.energy) || 0)) });
        else if (bonus.type === "income") players.gainResources(player, player?.income || {});
        else if (bonus.type === "choose_card") cards.drawCardsToHand(simContext.cardState, simContext.playerState, player, 1);
      }
    }

    function resolveRuleEngineActionParams(actionId, simContext) {
      const currentPlayer = getRuleEngineSimCurrentPlayer(simContext);
      if (!actionId || actionId === "pass" || actionId === "end-turn") return null;
      if (actionId === "launch") return null;
      if (actionId === "orbit") {
        const options = actions?.orbit?.getOrbitOptions?.(simContext);
        if (!options?.ok) return null;
        return { rocketId: options.defaultRocketId };
      }
      if (actionId === "land") {
        const options = actions?.land?.getLandOptions?.(simContext);
        if (!options?.ok) return null;
        return {
          rocketId: options.defaultRocketId,
          target: options.defaultTarget || null,
        };
      }
      if (actionId === "researchTech") {
        const options = actions?.researchTech?.canExecute?.(simContext);
        const tile = Array.isArray(options?.takeable) ? options.takeable[0] : null;
        if (!tile) return null;
        return {
          tileId: tile.tileId,
          blueSlot: tile.blueSlot || null,
        };
      }
      if (actionId === "move") {
        const movable = rocketActions.getMovableTokensForPlayer(simContext.rocketState, currentPlayer?.id);
        for (const rocket of movable) {
          for (const direction of AI_MOVE_DIRECTIONS) {
            const check = rocketActions.canMoveRocket(simContext.rocketState, rocket.id, direction.deltaX, direction.deltaY);
            if (!check?.ok) continue;
            const requiredMovePoints = 1;
            if (!canRuleEnginePayMoveCost(currentPlayer, requiredMovePoints)) continue;
            return {
              rocketId: rocket.id,
              deltaX: direction.deltaX,
              deltaY: direction.deltaY,
              requiredMovePoints,
            };
          }
        }
        return null;
      }
      if (actionId === "placeData") {
        const check = data.canPlaceAnyData?.(currentPlayer);
        const choice = check?.ok ? (check.choices || [])[0] : null;
        if (!choice) return null;
        return {
          target: choice.target || null,
          blueSlot: choice.blueSlot ?? null,
        };
      }
      if (actionId === "cardCorner") {
        const hand = Array.isArray(currentPlayer?.hand) ? currentPlayer.hand : [];
        for (let handIndex = 0; handIndex < hand.length; handIndex += 1) {
          const card = hand[handIndex];
          if (cards.getDiscardActionRewardForCard(card) || cards.getDiscardActionMoveRewardForCard?.(card)) {
            return { handIndex };
          }
        }
        return null;
      }
      if (actionId === "playCard") {
        const hand = Array.isArray(currentPlayer?.hand) ? currentPlayer.hand : [];
        for (let handIndex = 0; handIndex < hand.length; handIndex += 1) {
          const card = hand[handIndex];
          if (!isAiSupportedHandPlayCard(card)) continue;
          const cost = getCardPlayCost(card);
          if (players.canAfford(currentPlayer, cost)) {
            return { handIndex };
          }
        }
        return null;
      }
      if (actionId === "industry") {
        const industryCard = currentPlayer?.initialSelection?.industry || null;
        if (!industryCard) return null;
        return { industryCard };
      }
      return null;
    }

    function executeRuleEngineSimScan(simContext, currentPlayer) {
      const cost = scanEffects.getStandardScanCost?.(currentPlayer) || scanEffects.SCAN_COST || { credits: 1, energy: 2 };
      const check = scanEffects.canExecuteScan(currentPlayer, { standardAction: true, cost });
      if (!check?.ok) return { ok: false, message: check?.message || "扫描条件不满足" };
      const spend = players.spendResources(currentPlayer, cost);
      if (!spend?.ok) return spend;
      const queue = scanEffects.buildScanEffectQueue?.(currentPlayer, {
        roundNumber: simContext.roundNumber,
        turnNumber: simContext.turnNumber,
      }) || [];
      for (const effect of queue) {
        const type = String(effect?.type || "");
        if (
          type === scanEffects.EFFECT_TYPES.EARTH_SECTOR_SCAN
          || type === scanEffects.EFFECT_TYPES.IMPROVED_SECTOR_SCAN
          || type === scanEffects.EFFECT_TYPES.MERCURY_SECTOR_SCAN
        ) {
          data.gainData(currentPlayer, { source: "sim_scan_sector" });
          continue;
        }
        if (type === scanEffects.EFFECT_TYPES.PUBLIC_CARD_SCAN) {
          const publicSlot = (simContext.cardState?.publicCards || []).findIndex(Boolean);
          if (publicSlot >= 0) {
            cards.pickFromPublic(simContext.cardState, simContext.playerState, currentPlayer, publicSlot);
          }
          continue;
        }
        if (type === scanEffects.EFFECT_TYPES.HAND_SCAN) {
          if (Array.isArray(currentPlayer?.hand) && currentPlayer.hand.length) {
            const discard = cards.discardFromHandAtIndex(currentPlayer, 0);
            if (discard?.ok) cards.addToDiscardPile(simContext.cardState, discard.card);
          }
          continue;
        }
        if (type === scanEffects.EFFECT_TYPES.SCAN_ACTION_4) {
          const movable = rocketActions.getMovableTokensForPlayer(simContext.rocketState, currentPlayer?.id);
          let moved = false;
          for (const rocket of movable) {
            for (const direction of AI_MOVE_DIRECTIONS) {
              const canMove = rocketActions.canMoveRocket(simContext.rocketState, rocket.id, direction.deltaX, direction.deltaY);
              if (!canMove?.ok) continue;
              const moveResult = rocketActions.moveRocket(simContext.rocketState, rocket.id, direction.deltaX, direction.deltaY);
              if (moveResult?.ok) {
                moved = true;
                break;
              }
            }
            if (moved) break;
          }
          if (!moved && players.canAfford(currentPlayer, { energy: scanEffects.SCAN_ACTION_4_LAUNCH_ENERGY || 1 })) {
            const earth = simContext.getEarthSectorCoordinate();
            const launchResult = rocketActions.launchRocketAtSector(simContext.rocketState, earth, {
              playerId: currentPlayer.id,
              color: currentPlayer.color,
            });
            if (launchResult?.ok) players.spendResources(currentPlayer, { energy: scanEffects.SCAN_ACTION_4_LAUNCH_ENERGY || 1 });
          }
        }
      }
      return { ok: true };
    }

    function executeRuleEngineSimCardScanEffect(simContext, currentPlayer, effect, eventSink = null) {
      const options = effect?.options || {};
      const repeat = Math.max(1, Math.round(Number(options.repeat || options.count || 1)));
      const gainData = options.gainData !== false;
      const type = String(effect?.type || "");
      const fallbackNebulaId = options.color
        ? ((cardEffects.NEBULA_IDS_BY_COLOR?.[options.color] || [])[0] || null)
        : null;
      const scanNebulaId = options.nebulaId || fallbackNebulaId || null;
      const scanColor = options.color
        || (scanNebulaId ? getRuleEngineNebulaColorForCardEvent(scanNebulaId) : null)
        || null;
      const scanSectorX = Number.isFinite(Number(options.sectorX))
        ? Number(options.sectorX)
        : getRuleEngineNebulaSectorX(simContext, scanNebulaId);
      if (type === cardEffects.EFFECT_TYPES.PUBLIC_SCAN) {
        for (let index = 0; index < repeat; index += 1) {
          const publicSlot = (simContext.cardState?.publicCards || []).findIndex(Boolean);
          if (publicSlot < 0) break;
          cards.pickFromPublic(simContext.cardState, simContext.playerState, currentPlayer, publicSlot);
        }
        return { ok: true };
      }
      if (type === cardEffects.EFFECT_TYPES.HAND_SCAN || type === cardEffects.EFFECT_TYPES.OPTIONAL_DISCARD_SCAN) {
        for (let index = 0; index < repeat; index += 1) {
          if (!Array.isArray(currentPlayer?.hand) || !currentPlayer.hand.length) break;
          const discard = cards.discardFromHandAtIndex(currentPlayer, 0);
          if (discard?.ok) cards.addToDiscardPile(simContext.cardState, discard.card);
          if (gainData) data.gainData(currentPlayer, { source: "sim_card_scan_hand" });
        }
        return { ok: true };
      }
      if (!gainData) return { ok: true };
      for (let index = 0; index < repeat; index += 1) {
        data.gainData(currentPlayer, { source: "sim_card_scan" });
        if (Array.isArray(eventSink)) {
          eventSink.push({
            type: "signalMarked",
            nebulaId: scanNebulaId,
            sectorX: scanSectorX,
            playerId: currentPlayer?.id || null,
            color: scanColor,
          });
        }
      }
      return { ok: true };
    }

    function ensureRuleEngineSimCardMoveRewardState(simContext) {
      if (!Array.isArray(simContext.__simCardEventRewardKeys)) simContext.__simCardEventRewardKeys = [];
      if (!simContext.__simCardMoveDistinctEvents || typeof simContext.__simCardMoveDistinctEvents !== "object") {
        simContext.__simCardMoveDistinctEvents = {};
      }
      return {
        keys: simContext.__simCardEventRewardKeys,
        distinct: simContext.__simCardMoveDistinctEvents,
      };
    }

    function isRuleEngineMoveRewardEventMatch(reward = {}, event = {}) {
      if (String(event?.type || "") !== String(reward?.eventType || "")) return false;
      const includedPlanetIds = reward.includePlanetIds || reward.planetIds || [];
      if (Array.isArray(includedPlanetIds) && includedPlanetIds.length && !includedPlanetIds.includes(event?.planetId)) return false;
      if (Array.isArray(reward.excludePlanetIds) && reward.excludePlanetIds.length && reward.excludePlanetIds.includes(event?.planetId)) return false;
      return true;
    }

    function executeRuleEngineSimCardMoveRewardEffect(simContext, currentPlayer, rewardEffect, eventSink = null) {
      if (!rewardEffect) return { ok: false };
      const result = executeRuleEngineSimPlayCardEffects(simContext, currentPlayer, null, [rewardEffect], eventSink);
      return { ok: Boolean(result?.ok) };
    }

    function executeRuleEngineSimCardMoveEffect(simContext, currentPlayer, effect, eventSink = null) {
      const options = effect?.options || {};
      const movePoints = Math.max(1, Math.round(Number(options.movementPoints || options.count || 1)));
      const allMoveEvents = [];
      const movePayloads = [];
      for (let step = 0; step < movePoints; step += 1) {
        const movable = rocketActions.getMovableTokensForPlayer(simContext.rocketState, currentPlayer?.id);
        let moved = false;
        for (const rocket of movable) {
          for (const direction of AI_MOVE_DIRECTIONS) {
            const result = abilities?.rocket?.moveProbe
              ? abilities.rocket.moveProbe(simContext, {
                rocketId: rocket.id,
                deltaX: direction.deltaX,
                deltaY: direction.deltaY,
                skipCost: true,
                movementPoints: movePoints,
                suppressArrivalRewards: Boolean(options.suppressArrivalRewards),
                ignoreAsteroidRestriction: Boolean(options.ignoreAsteroidRestriction),
                source: "card_move",
              })
              : rocketActions.moveRocket(simContext.rocketState, rocket.id, direction.deltaX, direction.deltaY);
            if (result?.ok) {
              if (result?.payload) movePayloads.push(result.payload);
              if (Array.isArray(result?.events) && result.events.length) {
                allMoveEvents.push(...result.events);
              }
              if (Array.isArray(eventSink) && Array.isArray(result?.events) && result.events.length) {
                eventSink.push(...result.events.map((event) => ({ ...(event || {}) })));
              }
              moved = true;
              break;
            }
          }
          if (moved) break;
        }
        if (!moved) break;
      }
      const rewardState = ensureRuleEngineSimCardMoveRewardState(simContext);

      if (options.sameRingReward) {
        const sameRingKey = `${effect?.id || "card-move"}:same-ring`;
        if (!rewardState.keys.includes(sameRingKey)) {
          const hasSameRingMove = movePayloads.some((payload) => {
            const fromY = payload?.from?.y ?? payload?.geometry?.from?.y;
            const toY = payload?.to?.y ?? payload?.geometry?.to?.y;
            const deltaX = Math.abs(Number(payload?.deltaX ?? payload?.geometry?.deltaX ?? 0));
            return fromY != null && toY != null && Number(fromY) === Number(toY) && deltaX > 0;
          });
          if (hasSameRingMove) {
            const applied = executeRuleEngineSimCardMoveRewardEffect(simContext, currentPlayer, options.sameRingReward, eventSink);
            if (applied?.ok) rewardState.keys.push(sameRingKey);
          }
        }
      }
      const afterEventRewards = Array.isArray(options.afterEventRewards) ? options.afterEventRewards : [];
      for (const reward of afterEventRewards) {
        if (!allMoveEvents.some((event) => isRuleEngineMoveRewardEventMatch(reward, event))) continue;
        if (reward.onceKey && rewardState.keys.includes(reward.onceKey)) continue;
        const applied = executeRuleEngineSimCardMoveRewardEffect(simContext, currentPlayer, reward.effect, eventSink);
        if (applied?.ok && reward.onceKey) rewardState.keys.push(reward.onceKey);
      }

      const distinctReward = options.distinctEventReward || null;
      if (distinctReward?.eventType) {
        const distinctBy = distinctReward.distinctBy || "planetId";
        const distinctKey = distinctReward.onceKey || `${effect?.id || "card-move"}:distinct:${distinctReward.eventType}`;
        if (!rewardState.keys.includes(distinctKey)) {
          if (!Array.isArray(rewardState.distinct[distinctKey])) rewardState.distinct[distinctKey] = [];
          const values = rewardState.distinct[distinctKey];
          for (const event of allMoveEvents) {
            if (String(event?.type || "") !== String(distinctReward.eventType || "")) continue;
            const value = event?.[distinctBy];
            if (value == null) continue;
            if (!values.includes(value)) values.push(value);
          }
          const minCount = Math.max(1, Math.round(Number(distinctReward.minCount) || 1));
          if (values.length >= minCount) {
            const applied = executeRuleEngineSimCardMoveRewardEffect(simContext, currentPlayer, distinctReward.effect, eventSink);
            if (applied?.ok) rewardState.keys.push(distinctKey);
          }
        }
      }
      return { ok: true };
    }

    function countRuleEngineOwnedTechByType(player, techType = null) {
      return Object.keys(player?.techState?.ownedTiles || {})
        .filter((tileId) => player.techState.ownedTiles[tileId]
          && !player.techState.disabledTiles?.[tileId]
          && (!techType || String(tileId).startsWith(techType)))
        .length;
    }

    function countRuleEnginePlayerOrbitMarkers(simContext, currentPlayer) {
      const playerId = currentPlayer?.id;
      const playerColor = currentPlayer?.color;
      let total = 0;
      for (const planetId of planetStats.PLANET_IDS || []) {
        const markers = planetStats.getPlanetOrbitMarkers(simContext.planetStatsState, planetId) || [];
        total += markers.filter((marker) => marker?.playerId === playerId || marker?.playerColor === playerColor || marker?.color === playerColor).length;
      }
      return total;
    }

    function countRuleEnginePlayerLandingMarkers(simContext, currentPlayer) {
      const playerId = currentPlayer?.id;
      const playerColor = currentPlayer?.color;
      let total = 0;
      for (const planetId of planetStats.PLANET_IDS || []) {
        const markers = planetStats.getPlanetLandingMarkers(simContext.planetStatsState, planetId) || [];
        total += markers.filter((marker) => marker?.playerId === playerId || marker?.playerColor === playerColor || marker?.color === playerColor).length;
      }
      return total;
    }

    function isRuleEngineCardConditionMet(condition, simContext, currentPlayer) {
      if (!condition) return true;
      const type = String(condition.type || "");
      if (type === "resourceThreshold") {
        const resource = condition.resource || "score";
        const count = Math.max(0, Math.round(Number(condition.count || 0)));
        return Math.max(0, Math.round(Number(currentPlayer?.resources?.[resource]) || 0)) >= count;
      }
      if (type === "resourceEquals") {
        const resource = condition.resource || "score";
        const count = Math.round(Number(condition.count || 0));
        return Math.round(Number(currentPlayer?.resources?.[resource]) || 0) === count;
      }
      if (type === "techCount") {
        const count = Math.max(0, Math.round(Number(condition.count || 0)));
        return countRuleEngineOwnedTechByType(currentPlayer, condition.techType || null) >= count;
      }
      if (type === "orbitCount") {
        const count = Math.max(0, Math.round(Number(condition.count || 0)));
        return countRuleEnginePlayerOrbitMarkers(simContext, currentPlayer) >= count;
      }
      if (type === "landingCount") {
        const count = Math.max(0, Math.round(Number(condition.count || 0)));
        return countRuleEnginePlayerLandingMarkers(simContext, currentPlayer) >= count;
      }
      if (type === "orbitOrLandCount") {
        const count = Math.max(0, Math.round(Number(condition.count || 0)));
        return (countRuleEnginePlayerOrbitMarkers(simContext, currentPlayer)
          + countRuleEnginePlayerLandingMarkers(simContext, currentPlayer)) >= count;
      }
      return false;
    }

    function applyRuleEngineCardCornerRewardFromCard(simContext, currentPlayer, card, options = {}) {
      const repeat = Math.max(1, Math.round(Number(options.repeat || 1)));
      for (let index = 0; index < repeat; index += 1) {
        const resourceReward = cards.getDiscardActionRewardForCard(card);
        const moveReward = cards.getDiscardActionMoveRewardForCard?.(card);
        if (resourceReward) {
          players.gainResources(currentPlayer, resourceReward.gain || {});
          const dataCount = Math.max(0, Math.round(Number(resourceReward.dataCount) || 0));
          for (let dataIndex = 0; dataIndex < dataCount; dataIndex += 1) {
            data.gainData(currentPlayer, { source: options.source || "sim_corner_reward" });
          }
        }
        if (moveReward) {
          executeRuleEngineSimCardMoveEffect(simContext, currentPlayer, {
            options: { movementPoints: moveReward.movementPoints || 1 },
          });
          if (moveReward.gain && Object.keys(moveReward.gain).length) {
            players.gainResources(currentPlayer, moveReward.gain);
          }
        }
      }
      return { ok: true };
    }

    function executeRuleEngineSimCardDrawThenDiscardAction(simContext, currentPlayer, effect) {
      const count = Math.max(1, Math.round(Number(effect?.options?.count || 1)));
      for (let index = 0; index < count; index += 1) {
        const draw = cards.drawCardsToHand(simContext.cardState, simContext.playerState, currentPlayer, 1);
        const drawnCard = draw?.cards?.[0] || null;
        if (!drawnCard) continue;
        const handIndex = (currentPlayer.hand || []).findIndex((card) => card?.id === drawnCard.id);
        if (handIndex < 0) continue;
        const discard = cards.discardFromHandAtIndex(currentPlayer, handIndex);
        if (!discard?.ok) continue;
        cards.addToDiscardPile(simContext.cardState, discard.card);
        applyRuleEngineCardCornerRewardFromCard(simContext, currentPlayer, discard.card, {
          source: "sim_draw_discard_corner",
        });
      }
      return { ok: true };
    }

    function ensureRuleEngineEventBonusContainers(simContext) {
      if (!Array.isArray(simContext?.turnState?.cardTurnEventBonuses)) {
        simContext.turnState.cardTurnEventBonuses = [];
      }
      if (!Array.isArray(simContext.__simFlowEventBonuses)) {
        simContext.__simFlowEventBonuses = [];
      }
      return {
        turnBonuses: simContext.turnState.cardTurnEventBonuses,
        flowBonuses: simContext.__simFlowEventBonuses,
      };
    }

    function getRuleEngineNebulaColorForCardEvent(nebulaId) {
      for (const [color, nebulaIds] of Object.entries(cardEffects.NEBULA_IDS_BY_COLOR || {})) {
        if (Array.isArray(nebulaIds) && nebulaIds.includes(nebulaId)) return color;
      }
      return null;
    }

    function getRuleEngineNebulaSectorX(simContext, nebulaId) {
      if (!nebulaId) return null;
      const snapshot = solar?.createSolarSnapshot?.(simContext?.solarState);
      const nebula = (snapshot?.nebulaLocations || []).find((item) => item?.id === nebulaId) || null;
      if (!nebula) return null;
      const x = Number(nebula.x);
      return Number.isFinite(x) ? x : null;
    }

    function getRuleEngineCardEventBonusKey(event, bonus) {
      if (!bonus?.distinctBy) return null;
      return String(event?.[bonus.distinctBy] ?? "");
    }

    function getRuleEnginePlayerOwnerKeys(player) {
      if (endGameScoring?.getPlayerKeys) return endGameScoring.getPlayerKeys(player);
      return new Set([player?.id, player?.color].filter(Boolean));
    }

    function ruleEngineMarkerBelongsToPlayer(marker, player) {
      const keys = getRuleEnginePlayerOwnerKeys(player);
      return keys.has(marker?.playerId) || keys.has(marker?.color) || keys.has(marker?.playerColor);
    }

    function normalizeRuleEngineSimEvents(simContext, currentPlayer, events = []) {
      return (events || []).map((event) => {
        if (String(event?.type || "") !== "visitPlanet" || !event?.planetId) return event;
        const hasOwnOrbit = planetStats
          .getPlanetOrbitMarkers(simContext?.planetStatsState, event.planetId)
          .some((marker) => ruleEngineMarkerBelongsToPlayer(marker, currentPlayer));
        return {
          ...(event || {}),
          hasOwnOrbit,
        };
      });
    }

    function isRuleEngineEventMatchingBonus(event, bonus) {
      if (!event || !bonus) return false;
      if (String(event.type || "") !== String(bonus.eventType || "")) return false;
      if (bonus.color && getRuleEngineNebulaColorForCardEvent(event.nebulaId) !== bonus.color) return false;
      const includedPlanetIds = bonus.includePlanetIds || bonus.planetIds || [];
      if (Array.isArray(includedPlanetIds) && includedPlanetIds.length && !includedPlanetIds.includes(event.planetId)) return false;
      if (Array.isArray(bonus.excludePlanetIds) && bonus.excludePlanetIds.length && bonus.excludePlanetIds.includes(event.planetId)) return false;
      if (bonus.requiresOwnOrbit && !event.hasOwnOrbit) return false;
      return true;
    }

    function executeRuleEngineRegisterEventBonus(effect, simContext, currentPlayer) {
      const bonus = {
        ...(effect?.options?.bonus || {}),
        id: effect?.id || null,
        label: effect?.label || "",
        playerId: currentPlayer?.id || null,
        usedKeys: [],
        claimedKeys: Array.isArray(effect?.options?.bonus?.claimedKeys)
          ? [...effect.options.bonus.claimedKeys]
          : [],
      };
      const containers = ensureRuleEngineEventBonusContainers(simContext);
      if (bonus.duration === "turn") containers.turnBonuses.push(bonus);
      else containers.flowBonuses.push(bonus);
      return { ok: true };
    }

    function applyRuleEngineEventBonusesForEvent(simContext, currentPlayer, event = {}, eventSink = null) {
      const containers = ensureRuleEngineEventBonusContainers(simContext);
      if (!String(event.type || "")) return { ok: true };
      const allBonuses = [...containers.turnBonuses, ...containers.flowBonuses];
      for (const bonus of allBonuses) {
        if (!bonus || bonus.playerId !== currentPlayer?.id) continue;
        if (!isRuleEngineEventMatchingBonus(event, bonus)) continue;

        const distinctKey = getRuleEngineCardEventBonusKey(event, bonus);
        if (distinctKey) {
          if (!Array.isArray(bonus.usedKeys)) bonus.usedKeys = [];
          if (bonus.usedKeys.includes(distinctKey)) continue;
          bonus.usedKeys.push(distinctKey);
        }

        const minCount = Math.max(0, Math.round(Number(bonus.minCount) || 0));
        if (minCount > 0) {
          const currentCount = distinctKey ? bonus.usedKeys.length : 1;
          if (currentCount < minCount) continue;
          if (!Array.isArray(bonus.claimedKeys)) bonus.claimedKeys = [];
          const onceKey = bonus.onceKey || `${bonus.id || "card-event-bonus"}:min-count`;
          if (bonus.claimedKeys.includes(onceKey)) continue;
          bonus.claimedKeys.push(onceKey);
        }

        let pendingOnceKey = null;
        if (minCount <= 0 && bonus.onceKey) {
          if (!Array.isArray(bonus.claimedKeys)) bonus.claimedKeys = [];
          if (bonus.claimedKeys.includes(bonus.onceKey)) continue;
          pendingOnceKey = bonus.onceKey;
        }

        const rewards = bonus.rewards || [];
        let appliedReward = false;
        if (rewards.length) {
          const result = executeRuleEngineSimPlayCardEffects(simContext, currentPlayer, null, rewards, eventSink);
          if (!result?.ok) return result;
          appliedReward = true;
        }
        if (appliedReward && pendingOnceKey) bonus.claimedKeys.push(pendingOnceKey);
      }
      return { ok: true };
    }

    function executeRuleEngineSimCardReward(simContext, currentPlayer, reward) {
      if (!reward) return { ok: true };
      if (reward.type && reward.options) {
        return executeRuleEngineSimPlayCardEffects(simContext, currentPlayer, null, [reward]);
      }
      const gain = reward.gain || reward.resourceGain || reward;
      if (gain && typeof gain === "object") {
        players.gainResources(currentPlayer, gain);
      }
      const dataCount = Math.max(0, Math.round(Number(reward.dataCount || reward.availableData || 0)));
      for (let index = 0; index < dataCount; index += 1) data.gainData(currentPlayer, { source: "sim_card_reward" });
      const drawCount = Math.max(0, Math.round(Number(reward.drawCount || reward.handSize || 0)));
      if (drawCount > 0) cards.drawCardsToHand(simContext.cardState, simContext.playerState, currentPlayer, drawCount);
      return { ok: true };
    }

    function getRuleEngineSimCompanyBaseIncome(currentPlayer) {
      const industry = currentPlayer?.initialSelection?.industry || null;
      const industryEffect = initialCards?.getIndustryEffect?.(industry) || null;
      return players.normalizeIncome(industryEffect?.baseIncome || null);
    }

    function countRuleEngineSimAliens(simContext) {
      return Object.keys(simContext?.alienGameState?.aliens || {}).length;
    }

    function computeRuleEngineSimProbeLocationReward(simContext, effect, rocket) {
      const coordinate = rocketActions.getRocketSectorCoordinate(rocket);
      if (!coordinate) return { dataCount: 0, asteroid: false, adjacentAsteroids: 0 };
      const content = getSectorContentForMove(coordinate);
      const asteroid = isAsteroidContent(content);
      const adjacentAsteroids = [-1, 1].reduce((total, deltaX) => {
        const adjacent = { x: solar.mod8(coordinate.x + deltaX), y: coordinate.y };
        return total + (isAsteroidContent(getSectorContentForMove(adjacent)) ? 1 : 0);
      }, 0);
      const dataCount = (asteroid ? Math.max(0, Number(effect?.options?.asteroidData) || 0) : 0)
        + adjacentAsteroids * Math.max(0, Number(effect?.options?.adjacentAsteroidData) || 0);
      return { dataCount, asteroid, adjacentAsteroids };
    }

    function countRuleEngineSimHandCornerKinds(currentPlayer) {
      const counts = { publicity: 0, data: 0, move: 0 };
      for (const handCard of currentPlayer?.hand || []) {
        const resourceReward = cards.getDiscardActionRewardForCard(handCard);
        const moveReward = cards.getDiscardActionMoveRewardForCard?.(handCard);
        if (moveReward) {
          counts.move += 1;
        } else if (Math.max(0, Math.round(Number(resourceReward?.dataCount) || 0)) > 0) {
          counts.data += 1;
        } else if (resourceReward?.gain?.publicity) {
          counts.publicity += 1;
        }
      }
      return counts;
    }

    function buildRuleEngineSimMarkerRemovalChoices(simContext, currentPlayer, effect) {
      const owner = effect?.options?.owner || "current";
      const markerKinds = new Set(effect?.options?.markerKinds || ["orbit", "land"]);
      const choices = [];
      const canUseMarker = (marker) => owner === "any" || ruleEngineMarkerBelongsToPlayer(marker, currentPlayer);
      const planetIds = planetStats.PLANET_IDS || [];
      for (const planetId of planetIds) {
        if (markerKinds.has("orbit")) {
          for (const marker of planetStats.getPlanetOrbitMarkers(simContext.planetStatsState, planetId)) {
            if (!canUseMarker(marker)) continue;
            choices.push({ kind: "orbit", planetId, sequence: marker.sequence, marker });
          }
        }
        if (markerKinds.has("land")) {
          for (const marker of planetStats.getPlanetLandingMarkers(simContext.planetStatsState, planetId)) {
            if (!canUseMarker(marker)) continue;
            choices.push({ kind: "land", planetId, sequence: marker.sequence, marker });
          }
        }
        if (markerKinds.has("satelliteLand")) {
          for (const marker of planetStats.getSatelliteLandingMarkers(simContext.planetStatsState, planetId)) {
            if (!canUseMarker(marker)) continue;
            choices.push({ kind: "satelliteLand", planetId, satelliteId: marker.satelliteId, marker });
          }
        }
      }
      choices.sort((left, right) => {
        const leftOwn = ruleEngineMarkerBelongsToPlayer(left.marker, currentPlayer);
        const rightOwn = ruleEngineMarkerBelongsToPlayer(right.marker, currentPlayer);
        if (owner === "any" && leftOwn !== rightOwn) return Number(leftOwn) - Number(rightOwn);
        return String(left.planetId || "").localeCompare(String(right.planetId || ""));
      });
      return choices;
    }

    function appendRuleEngineSimEvents(eventSink, events = []) {
      if (!Array.isArray(eventSink) || !Array.isArray(events) || !events.length) return;
      eventSink.push(...events.map((event) => ({ ...(event || {}) })));
    }

    function hasRuleEngineSimEvent(events = [], eventType = "") {
      return Array.isArray(events)
        && events.some((event) => String(event?.type || "") === String(eventType || ""));
    }

    function executeRuleEngineSimPlayCardEffects(simContext, currentPlayer, card, overrideEffects = null, eventSink = null) {
      const effects = Array.isArray(overrideEffects)
        ? overrideEffects
        : (cardEffects.buildPlayEffects?.(card) || []);
      for (const effect of effects) {
        const type = String(effect?.type || "");
        const options = effect?.options || {};
        if (type === planetRewards.EFFECT_TYPES?.GAIN_RESOURCES || type === "gain_resources") {
          players.gainResources(currentPlayer, options.gain || {});
          continue;
        }
        if (type === planetRewards.EFFECT_TYPES?.GAIN_DATA || type === "gain_data") {
          const count = Math.max(1, Math.round(Number(options.count || 1)));
          for (let index = 0; index < count; index += 1) data.gainData(currentPlayer, { source: "sim_play_effect" });
          continue;
        }
        if (type === "draw_cards") {
          const count = Math.max(1, Math.round(Number(options.count || 1)));
          cards.drawCardsToHand(simContext.cardState, simContext.playerState, currentPlayer, count);
          continue;
        }
        if (type === planetRewards.EFFECT_TYPES?.INCOME || type === "income") {
          players.gainResources(currentPlayer, options.gain || options.income || currentPlayer?.income || {});
          continue;
        }
        if (type === cardEffects.EFFECT_TYPES.COUNT_HAND_INCOME_RESOURCE) {
          const incomeCode = Number(options.incomeCode);
          const resource = options.resource || "energy";
          const per = Math.max(0, Number(options.per) || 1);
          const count = (currentPlayer?.hand || [])
            .filter((handCard) => Number(cards.getIncomeCodeForCard(handCard)) === incomeCode)
            .length;
          const total = Math.max(0, Math.round(count * per));
          if (total > 0) players.gainResources(currentPlayer, { [resource]: total });
          continue;
        }
        if (type === cardEffects.EFFECT_TYPES.COUNT_CURRENT_INCOME_RESOURCE) {
          const incomeKey = options.incomeKey || "credits";
          const resource = options.resource || "score";
          const per = Math.max(0, Number(options.per) || 1);
          const currentIncomeCount = Math.max(0, Math.round(Number(currentPlayer?.income?.[incomeKey]) || 0));
          const companyBaseIncome = getRuleEngineSimCompanyBaseIncome(currentPlayer);
          const baseIncomeCount = Math.max(0, Math.round(Number(companyBaseIncome?.[incomeKey]) || 0));
          const count = Math.max(0, currentIncomeCount - baseIncomeCount);
          const total = Math.max(0, Math.round(count * per));
          if (total > 0) players.gainResources(currentPlayer, { [resource]: total });
          continue;
        }
        if (type === cardEffects.EFFECT_TYPES.COUNT_ALIENS_RESOURCE) {
          const alienCount = countRuleEngineSimAliens(simContext);
          const gainPerAlien = options.gainPerAlien || {};
          const gain = {};
          for (const [resource, amount] of Object.entries(gainPerAlien)) {
            gain[resource] = Math.max(0, Math.round(Number(amount) || 0)) * alienCount;
          }
          if (Object.values(gain).some((value) => Number(value) > 0)) {
            players.gainResources(currentPlayer, gain);
          }
          continue;
        }
        if (type === cardEffects.EFFECT_TYPES.COUNT_HAND_CORNER_MOVE) {
          const counts = countRuleEngineSimHandCornerKinds(currentPlayer);
          const moveCount = Math.max(0, counts.move || 0);
          if (moveCount > 0) {
            const moveResult = executeRuleEngineSimCardMoveEffect(simContext, currentPlayer, {
              id: `${effect?.id || "hand-corner"}-move`,
              options: { movementPoints: moveCount, historyLabel: effect?.label || "手牌角标移动" },
            }, eventSink);
            if (!moveResult?.ok) return moveResult;
          }
          continue;
        }
        if (type === cardEffects.EFFECT_TYPES.CHOOSE_HAND_CORNER_REWARD) {
          const counts = countRuleEngineSimHandCornerKinds(currentPlayer);
          const scores = [
            { choice: "publicity", score: Number(counts.publicity || 0) * Number(AI_RESOURCE_VALUES.publicity || 1), count: counts.publicity || 0 },
            { choice: "data", score: Number(counts.data || 0) * Number(AI_RESOURCE_VALUES.availableData || 1), count: counts.data || 0 },
            { choice: "move", score: Number(counts.move || 0) * Number(AI_RESOURCE_VALUES.movement || 1), count: counts.move || 0 },
          ].sort((left, right) => Number(right.score || 0) - Number(left.score || 0));
          const selected = scores.find((item) => Number(item.count || 0) > 0) || null;
          if (!selected) continue;
          if (selected.choice === "publicity") {
            players.gainResources(currentPlayer, { publicity: selected.count });
            continue;
          }
          if (selected.choice === "data") {
            for (let index = 0; index < selected.count; index += 1) {
              data.gainData(currentPlayer, { source: "hand_corner_choice" });
            }
            continue;
          }
          const moveResult = executeRuleEngineSimCardMoveEffect(simContext, currentPlayer, {
            id: `${effect?.id || "hand-corner-choice"}-move`,
            options: { movementPoints: selected.count, historyLabel: effect?.label || "手牌角标奖励" },
          }, eventSink);
          if (!moveResult?.ok) return moveResult;
          continue;
        }
        if (type === "launch") {
          if (actions?.launch?.canExecute?.(simContext)?.ok) {
            const launchResult = actions.launch.execute(simContext);
            appendRuleEngineSimEvents(eventSink, launchResult?.events || []);
            if (launchResult?.ok && !hasRuleEngineSimEvent(launchResult?.events || [], "launch")) {
              appendRuleEngineSimEvents(eventSink, [{ type: "launch", playerId: currentPlayer?.id || null }]);
            }
          }
          continue;
        }
        if (type === cardEffects.EFFECT_TYPES.CARD_ORBIT) {
          const optionsOrbit = actions?.orbit?.getOrbitOptions?.(simContext);
          if (optionsOrbit?.ok) {
            const orbitResult = actions.orbit.execute(simContext, { rocketId: optionsOrbit.defaultRocketId });
            appendRuleEngineSimEvents(eventSink, orbitResult?.events || []);
            if (orbitResult?.ok && !hasRuleEngineSimEvent(orbitResult?.events || [], "orbit")) {
              appendRuleEngineSimEvents(eventSink, [{
                type: "orbit",
                planetId: orbitResult?.planetId || orbitResult?.payload?.planetId || null,
                playerId: currentPlayer?.id || null,
              }]);
            }
          }
          continue;
        }
        if (type === cardEffects.EFFECT_TYPES.CARD_LAND) {
          const optionsLand = actions?.land?.getLandOptions?.(simContext);
          if (optionsLand?.ok) {
            const landResult = actions.land.execute(simContext, {
              rocketId: optionsLand.defaultRocketId,
              target: optionsLand.defaultTarget || null,
            });
            appendRuleEngineSimEvents(eventSink, landResult?.events || []);
            if (landResult?.ok && !hasRuleEngineSimEvent(landResult?.events || [], "land")) {
              appendRuleEngineSimEvents(eventSink, [{
                type: "land",
                planetId: landResult?.planetId || landResult?.payload?.planetId || null,
                playerId: currentPlayer?.id || null,
              }]);
            }
          }
          continue;
        }
        if (type === cardEffects.EFFECT_TYPES.RESEARCH_TECH || type === "research_tech_select" || type === "card_research_tech") {
          const check = actions?.researchTech?.canExecute?.(simContext);
          const takeable = Array.isArray(check?.takeable) ? check.takeable : [];
          if (takeable.length) {
            const first = takeable[0];
            const researchResult = actions.researchTech.execute(simContext, {
              tileId: first.tileId,
              blueSlot: first.blueSlot || null,
            });
            appendRuleEngineSimEvents(eventSink, researchResult?.events || []);
            if (researchResult?.ok && !hasRuleEngineSimEvent(researchResult?.events || [], "researchTech")) {
              appendRuleEngineSimEvents(eventSink, [{
                type: "researchTech",
                techType: researchResult?.payload?.techType || null,
                playerId: currentPlayer?.id || null,
              }]);
            }
          }
          continue;
        }
        if (
          type === cardEffects.EFFECT_TYPES.PUBLIC_SCAN
          || type === cardEffects.EFFECT_TYPES.ANY_SECTOR_SCAN
          || type === cardEffects.EFFECT_TYPES.SCAN_ACTION
          || type === cardEffects.EFFECT_TYPES.SCAN_NEBULA
          || type === cardEffects.EFFECT_TYPES.SCAN_COLOR_CHOICE
          || type === cardEffects.EFFECT_TYPES.SECTOR_X_SCAN
          || type === cardEffects.EFFECT_TYPES.PLANET_SECTOR_SCAN
          || type === cardEffects.EFFECT_TYPES.CONDITIONAL_SECTOR_SCAN
          || type === cardEffects.EFFECT_TYPES.LANDING_SECTOR_SCAN
          || type === cardEffects.EFFECT_TYPES.PROBE_SECTOR_SCAN
          || type === cardEffects.EFFECT_TYPES.HAND_SCAN
          || type === cardEffects.EFFECT_TYPES.OPTIONAL_DISCARD_SCAN
        ) {
          executeRuleEngineSimCardScanEffect(simContext, currentPlayer, effect, eventSink);
          continue;
        }
        if (type === cardEffects.EFFECT_TYPES.CARD_MOVE || type === cardEffects.EFFECT_TYPES.FREE_MOVE) {
          executeRuleEngineSimCardMoveEffect(simContext, currentPlayer, effect, eventSink);
          continue;
        }
        if (type === cardEffects.EFFECT_TYPES.PAY_CREDITS_FOR_REWARD) {
          const creditCost = Math.max(0, Math.round(Number(options.creditCost || options.cost || 1)));
          if (creditCost <= 0 || players.canAfford(currentPlayer, { credits: creditCost })) {
            if (creditCost > 0) players.spendResources(currentPlayer, { credits: creditCost });
            executeRuleEngineSimCardReward(simContext, currentPlayer, options.reward || null);
          }
          continue;
        }
        if (type === cardEffects.EFFECT_TYPES.DISCARD_ANY_FOR_INCOME) {
          if (Array.isArray(currentPlayer?.hand) && currentPlayer.hand.length) {
            const discard = cards.discardFromHandAtIndex(currentPlayer, 0);
            if (discard?.ok) {
              cards.addToDiscardPile(simContext.cardState, discard.card);
              const incomeGain = cards.getIncomeGainForCard(discard.card);
              if (incomeGain) {
                const gain = { ...incomeGain };
                const dataCount = Math.max(0, Math.round(Number(gain.availableData || 0)));
                delete gain.availableData;
                if (Object.keys(gain).length) players.gainResources(currentPlayer, gain);
                for (let index = 0; index < dataCount; index += 1) data.gainData(currentPlayer, { source: "sim_discard_income" });
              }
            }
          }
          continue;
        }
        if (type === cardEffects.EFFECT_TYPES.DISCARD_CARD_CORNER_REPEAT) {
          const hand = Array.isArray(currentPlayer?.hand) ? currentPlayer.hand : [];
          const selected = hand.find((card) => (
            (!options.excludeAlienCards || !isAiAlienMainPlayCard(card))
            && (cards.getDiscardActionRewardForCard(card) || cards.getDiscardActionMoveRewardForCard?.(card))
          )) || null;
          if (selected) {
            const handIndex = hand.findIndex((card) => card?.id === selected.id);
            if (handIndex >= 0) {
              const discard = cards.discardFromHandAtIndex(currentPlayer, handIndex);
              if (discard?.ok) {
                cards.addToDiscardPile(simContext.cardState, discard.card);
                applyRuleEngineCardCornerRewardFromCard(simContext, currentPlayer, discard.card, {
                  repeat: options.cornerRepeat || options.repeat || 1,
                  source: "sim_corner_repeat",
                });
              }
            }
          }
          continue;
        }
        if (type === cardEffects.EFFECT_TYPES.PICK_CARD_CORNER_REWARD) {
          const publicSlot = (simContext.cardState?.publicCards || []).findIndex(Boolean);
          if (publicSlot >= 0) {
            const pick = cards.pickFromPublic(simContext.cardState, simContext.playerState, currentPlayer, publicSlot);
            if (pick?.ok && pick.card) {
              applyRuleEngineCardCornerRewardFromCard(simContext, currentPlayer, pick.card, {
                source: "sim_pick_corner",
              });
            }
          }
          continue;
        }
        if (type === cardEffects.EFFECT_TYPES.DRAW_THEN_DISCARD_ACTION) {
          executeRuleEngineSimCardDrawThenDiscardAction(simContext, currentPlayer, effect);
          continue;
        }
        if (type === cardEffects.EFFECT_TYPES.REGISTER_EVENT_BONUS) {
          executeRuleEngineRegisterEventBonus(effect, simContext, currentPlayer);
          continue;
        }
        if (type === cardEffects.EFFECT_TYPES.CONDITIONAL_REWARD) {
          const met = isRuleEngineCardConditionMet(options.condition || null, simContext, currentPlayer);
          if (met && Array.isArray(options.rewards) && options.rewards.length) {
            const result = executeRuleEngineSimPlayCardEffects(simContext, currentPlayer, null, options.rewards, eventSink);
            if (!result?.ok) return result;
          }
          continue;
        }
        if (type === cardEffects.EFFECT_TYPES.RETURN_PLAYED_CARD_TO_HAND_IF) {
          const met = isRuleEngineCardConditionMet(options.condition || null, simContext, currentPlayer);
          if (met) {
            const playedCardId = simContext.__simLastPlayedCardId || null;
            const discardPile = simContext.cardState?.discardPile || [];
            const discardIndex = discardPile.findIndex((discardCard) => discardCard?.id === playedCardId);
            if (discardIndex >= 0) {
              const [cardToHand] = discardPile.splice(discardIndex, 1);
              if (cardToHand) {
                if (!Array.isArray(currentPlayer.hand)) currentPlayer.hand = [];
                currentPlayer.hand.push(cardToHand);
              }
            }
          }
          continue;
        }
        if (type === cardEffects.EFFECT_TYPES.COUNT_TECH_TYPES_REWARD) {
          const count = Math.max(
            countRuleEngineOwnedTechByType(currentPlayer, "orange"),
            countRuleEngineOwnedTechByType(currentPlayer, "purple"),
            countRuleEngineOwnedTechByType(currentPlayer, "blue"),
          );
          if (options.reward === "draw") {
            cards.drawCardsToHand(simContext.cardState, simContext.playerState, currentPlayer, count);
          }
          continue;
        }
        if (type === cardEffects.EFFECT_TYPES.COUNT_OWNED_TECH_REWARD) {
          const count = countRuleEngineOwnedTechByType(currentPlayer, options.techType || null);
          const total = Math.max(0, Math.round(count * Number(options.per || 1)));
          if ((options.resource || "") === "data") {
            for (let index = 0; index < total; index += 1) data.gainData(currentPlayer, { source: "sim_owned_tech_reward" });
          } else if (total > 0) {
            players.gainResources(currentPlayer, { [options.resource || "score"]: total });
          }
          continue;
        }
        if (type === cardEffects.EFFECT_TYPES.COUNT_ROCKETS_REWARD) {
          const count = cardEffects.countRocketsForReward(
            simContext.rocketState?.rockets || [],
            currentPlayer,
            options,
          );
          const total = Math.max(0, Math.round(count * Number(options.per || 1)));
          if (total > 0) players.gainResources(currentPlayer, { [options.resource || "energy"]: total });
          continue;
        }
        if (type === cardEffects.EFFECT_TYPES.DISCARD_ALL_HAND) {
          while (Array.isArray(currentPlayer?.hand) && currentPlayer.hand.length) {
            const discard = cards.discardFromHandAtIndex(currentPlayer, currentPlayer.hand.length - 1);
            if (!discard?.ok) break;
            cards.addToDiscardPile(simContext.cardState, discard.card);
          }
          if (Array.isArray(options.rewards) && options.rewards.length) {
            const result = executeRuleEngineSimPlayCardEffects(simContext, currentPlayer, null, options.rewards, eventSink);
            if (!result?.ok) return result;
          }
          continue;
        }
        if (type === cardEffects.EFFECT_TYPES.PROBE_STACK_REWARD) {
          const match = cardEffects.getProbeStackRewardMatch(
            simContext.rocketState?.rockets || [],
            currentPlayer,
            {
              getCoordinate: (rocket) => rocketActions.getRocketSectorCoordinate(rocket),
            },
          );
          if (match?.conditionMet && Array.isArray(options.rewards) && options.rewards.length) {
            const result = executeRuleEngineSimPlayCardEffects(simContext, currentPlayer, null, options.rewards, eventSink);
            if (!result?.ok) return result;
          }
          continue;
        }
        if (type === cardEffects.EFFECT_TYPES.REMOVE_PLANET_MARKER) {
          const choices = buildRuleEngineSimMarkerRemovalChoices(simContext, currentPlayer, effect);
          if (!choices.length) {
            return { ok: false, message: `${effect?.label || "移除标记"}：没有可移除的标记` };
          }
          const selected = choices[0];
          let remove = null;
          if (selected.kind === "orbit") {
            remove = planetStats.removePlanetOrbitMarker(simContext.planetStatsState, selected.planetId, {
              sequence: selected.sequence,
              ...(effect?.options?.owner === "any" ? {} : { player: currentPlayer }),
            });
          } else if (selected.kind === "land") {
            remove = planetStats.removePlanetLandingMarker(simContext.planetStatsState, selected.planetId, {
              sequence: selected.sequence,
              ...(effect?.options?.owner === "any" ? {} : { player: currentPlayer }),
            });
          } else if (selected.kind === "satelliteLand") {
            remove = planetStats.removeSatelliteLandingMarker(simContext.planetStatsState, selected.planetId, selected.satelliteId,
              effect?.options?.owner === "any" ? {} : { player: currentPlayer });
          }
          if (!remove?.ok) return { ok: false, message: remove?.message || "移除标记失败" };
          continue;
        }
        if (type === cardEffects.EFFECT_TYPES.REMOVE_ORBIT_TO_PROBE) {
          const orbitChoices = [];
          for (const planetId of planetStats.PLANET_IDS || []) {
            for (const marker of planetStats.getPlanetOrbitMarkers(simContext.planetStatsState, planetId)) {
              if (!ruleEngineMarkerBelongsToPlayer(marker, currentPlayer)) continue;
              orbitChoices.push({ planetId, sequence: marker.sequence, marker });
            }
          }
          if (!orbitChoices.length) {
            return { ok: false, message: `${effect?.label || "移除环绕并放置探测器"}：没有可移除的己方环绕标记` };
          }
          const selected = orbitChoices[0];
          const removed = planetStats.removePlanetOrbitMarker(simContext.planetStatsState, selected.planetId, {
            sequence: selected.sequence,
            player: currentPlayer,
          });
          if (!removed?.ok) return { ok: false, message: removed?.message || "移除环绕失败" };
          const coordinate = getPlanetSectorCoordinate(selected.planetId);
          const launch = rocketActions.launchRocketAtSector(simContext.rocketState, coordinate, {
            playerId: currentPlayer.id,
            color: currentPlayer.color,
          });
          if (!launch?.ok) return { ok: false, message: launch?.message || "放置探测器失败" };
          if (Array.isArray(eventSink)) {
            eventSink.push({
              type: "launch",
              rocketId: launch?.rocket?.id || null,
              playerId: currentPlayer?.id || null,
              source: "card",
            });
          }
          continue;
        }
        if (type === cardEffects.EFFECT_TYPES.PROBE_LOCATION_REWARD) {
          const rockets = (simContext.rocketState?.rockets || [])
            .filter((rocket) => rocket?.playerId === currentPlayer?.id)
            .filter((rocket) => rocketActions.getRocketSectorCoordinate(rocket));
          if (!rockets.length) continue;
          const scored = rockets.map((rocket) => ({
            rocket,
            reward: computeRuleEngineSimProbeLocationReward(simContext, effect, rocket),
          }));
          scored.sort((left, right) => (
            Number(right.reward?.dataCount || 0) - Number(left.reward?.dataCount || 0)
            || Number(left.rocket?.id || 0) - Number(right.rocket?.id || 0)
          ));
          const selected = scored[0];
          const dataCount = Math.max(0, Math.round(Number(selected?.reward?.dataCount) || 0));
          for (let index = 0; index < dataCount; index += 1) {
            data.gainData(currentPlayer, { source: "probe_location_reward" });
          }
          continue;
        }
        return { ok: false, message: `AI 深度模拟暂不支持效果 '${type || "unknown"}'` };
      }
      return { ok: true };
    }

    function executeRuleEngineSimPlayCard(simContext, currentPlayer, params = {}, eventSink = null) {
      const handIndex = Number(params.handIndex);
      if (!Number.isInteger(handIndex)) return { ok: false, message: "打牌缺少手牌索引" };
      const card = currentPlayer?.hand?.[handIndex] || null;
      if (!card || !isAiSupportedHandPlayCard(card)) return { ok: false, message: "无效的打牌目标" };
      const cost = getCardPlayCost(card);
      const spend = players.spendResources(currentPlayer, cost);
      if (!spend?.ok) return spend;
      const removed = cards.discardFromHandAtIndex(currentPlayer, handIndex);
      if (!removed?.ok) return removed;
      simContext.__simLastPlayedCardId = removed.card?.id || null;
      const typeCode = getCardTypeCode(card);
      const model = cardEffects.getCardModel?.(card) || null;
      const reservesAfterPlay = doesAiCardReserveAfterPlay(card, typeCode, model);
      if (reservesAfterPlay) {
        if (!Array.isArray(currentPlayer.reservedCards)) currentPlayer.reservedCards = [];
        currentPlayer.reservedCards.push(removed.card);
      } else {
        cards.addToDiscardPile(simContext.cardState, removed.card);
      }
      simContext.__simCardEventRewardKeys = [];
      simContext.__simCardMoveDistinctEvents = {};
      const effectResult = executeRuleEngineSimPlayCardEffects(simContext, currentPlayer, card, null, eventSink);
      if (!effectResult?.ok) return effectResult;
      return { ok: true };
    }

    function executeRuleEngineSimMove(simContext, currentPlayer, params = {}) {
      const rocketId = Number(params.rocketId);
      const deltaX = Number(params.deltaX || 0);
      const deltaY = Number(params.deltaY || 0);
      const requiredMovePoints = Math.max(1, Math.round(Number(params.requiredMovePoints) || 1));
      if (!Number.isInteger(rocketId)) return { ok: false, message: "移动缺少火箭" };
      const canMove = rocketActions.canMoveRocket(simContext.rocketState, rocketId, deltaX, deltaY);
      if (!canMove?.ok) return canMove;
      const pay = payRuleEngineMoveCost(currentPlayer, simContext, requiredMovePoints);
      if (!pay?.ok) return pay;
      return rocketActions.moveRocket(simContext.rocketState, rocketId, deltaX, deltaY);
    }

    function executeRuleEngineSimCardCorner(simContext, currentPlayer, params = {}) {
      const handIndex = Number(params.handIndex);
      if (!Number.isInteger(handIndex)) return { ok: false, message: "卡牌角标缺少手牌索引" };
      const card = currentPlayer?.hand?.[handIndex] || null;
      if (!card) return { ok: false, message: "卡牌角标目标无效" };

      const resourceReward = cards.getDiscardActionRewardForCard(card);
      const moveReward = cards.getDiscardActionMoveRewardForCard?.(card);
      if (!resourceReward && !moveReward) return { ok: false, message: "该牌没有可执行角标" };

      const removed = cards.discardFromHandAtIndex(currentPlayer, handIndex);
      if (!removed?.ok) return removed;
      cards.addToDiscardPile(simContext.cardState, removed.card);

      if (resourceReward) {
        players.gainResources(currentPlayer, resourceReward.gain || {});
        const dataCount = Math.max(0, Math.round(Number(resourceReward.dataCount) || 0));
        for (let index = 0; index < dataCount; index += 1) {
          data.gainData(currentPlayer, { source: "sim_card_corner" });
        }
      }

      if (moveReward) {
        const movable = rocketActions.getMovableTokensForPlayer(simContext.rocketState, currentPlayer?.id);
        let moved = false;
        for (const rocket of movable) {
          for (const direction of AI_MOVE_DIRECTIONS) {
            const canMove = rocketActions.canMoveRocket(simContext.rocketState, rocket.id, direction.deltaX, direction.deltaY);
            if (!canMove?.ok) continue;
            const result = rocketActions.moveRocket(simContext.rocketState, rocket.id, direction.deltaX, direction.deltaY);
            if (result?.ok) {
              moved = true;
              break;
            }
          }
          if (moved) break;
        }
        players.gainResources(currentPlayer, moveReward.gain || {});
      }
      return { ok: true };
    }

    function executeRuleEngineSimPlaceData(simContext, currentPlayer, params = {}) {
      const result = data.placeDataToComputer(currentPlayer, {
        target: params.target,
        blueSlot: params.blueSlot,
      });
      if (!result?.ok) return result;
      applyRuleEnginePlacementBonuses(currentPlayer, simContext, result.slotBonuses || (result.slotBonus ? [result.slotBonus] : []));
      return result;
    }

    function executeRuleEngineSimIndustry(simContext, currentPlayer, params = {}) {
      const industryCard = params.industryCard || currentPlayer?.initialSelection?.industry;
      if (!industryCard) return { ok: false, message: "没有公司牌" };
      const check = industry.canMarkIndustryAction?.(currentPlayer, simContext.roundNumber, {
        turnNumber: simContext.turnNumber,
        hasMarker: Boolean(industry.getIndustryActionMarkerLayout?.(industryCard)),
        industryCard,
      });
      if (!check?.ok) return check || { ok: false, message: "公司 1x 不可用" };
      industry.markIndustryAction?.(currentPlayer, simContext.roundNumber, { turnNumber: simContext.turnNumber });

      const definition = industry.getIndustryDefinition?.(industryCard);
      const abilityId = definition?.activeAbilityId || null;
      const publicityCost = industry.PUBLICITY_PICK_COST || 2;
      if (abilityId === "mission_publicity_pick_income" || abilityId === "fenwick_publicity_pick_corner") {
        if (!players.canAfford(currentPlayer, { publicity: publicityCost })) {
          return { ok: false, message: "宣传不足，无法执行公司效果" };
        }
        players.spendResources(currentPlayer, { publicity: publicityCost });
        const publicCards = simContext.cardState?.publicCards || [];
        const slotIndex = publicCards.findIndex(Boolean);
        if (slotIndex >= 0) cards.pickFromPublic(simContext.cardState, simContext.playerState, currentPlayer, slotIndex);
      } else if (abilityId === "strategy_pick_card") {
        const publicCards = simContext.cardState?.publicCards || [];
        const slotIndex = publicCards.findIndex(Boolean);
        if (slotIndex >= 0) cards.pickFromPublic(simContext.cardState, simContext.playerState, currentPlayer, slotIndex);
      }

      industry.buildActiveAbilityFlow?.(currentPlayer, definition?.label || industryCard?.label || "", simContext.roundNumber, simContext.turnNumber);
      return { ok: true };
    }

    function buildRuleEngineLegalActions(simState) {
      const simContext = simState?.simContext;
      if (!simContext) return [];
      simContext.playerState.currentPlayerId = simState.currentPlayerId;
      if (simContext.turnState) simContext.turnState.currentPlayerId = simState.currentPlayerId;
      simContext.roundNumber = Number(simContext?.turnState?.roundNumber || simContext.roundNumber || 1);
      simContext.turnNumber = Number(simContext?.turnState?.turnNumber || simContext.turnNumber || 1);

      const currentPlayer = getRuleEngineSimCurrentPlayer(simContext, simState.currentPlayerId);
      if (!currentPlayer) return [];

      const policyHintByActionId = simState.policyHintByActionId || {};
      const scoreHintByActionId = simState.scoreHintByActionId || {};
      const actorIsRoot = simState.currentPlayerId === simState.rootPlayerId;
      const actionIds = [
        "launch",
        "orbit",
        "land",
        "researchTech",
        "scan",
        "analyze",
        "playCard",
        "move",
        "cardCorner",
        "industry",
        "placeData",
        "pass",
        "end-turn",
      ];
      const legal = [];

      for (const actionId of actionIds) {
        if (actionId === "end-turn") {
          if (!simState.pendingActionExecuted) continue;
          legal.push({
            id: "end-turn",
            kind: "end-turn",
            available: true,
            params: null,
            prior: Number(policyHintByActionId["end-turn"] || 0.03),
            score: actorIsRoot ? Number(scoreHintByActionId["end-turn"] || 0.2) : -Number(scoreHintByActionId["end-turn"] || 0.2),
          });
          continue;
        }

        if (actionId === "pass") {
          if (simState.pendingActionExecuted) continue;
          legal.push({
            id: "pass",
            kind: "pass",
            available: true,
            params: null,
            prior: Number(policyHintByActionId.pass || 0.1),
            score: actorIsRoot ? Number(scoreHintByActionId.pass || 0) : -Number(scoreHintByActionId.pass || 0),
          });
          continue;
        }

        let available = false;
        let params = null;

        if (actionId === "scan") {
          available = Boolean(scanEffects?.canExecuteScan?.(currentPlayer, { standardAction: true })?.ok);
        } else if (actionId === "analyze") {
          available = Boolean(data?.canAnalyzeData?.(currentPlayer)?.ok);
        } else if (actionId === "playCard") {
          params = resolveRuleEngineActionParams(actionId, simContext);
          available = Boolean(params && Number.isInteger(Number(params.handIndex)));
        } else if (actionId === "move") {
          params = resolveRuleEngineActionParams(actionId, simContext);
          available = Boolean(params && Number.isInteger(Number(params.rocketId)));
        } else if (actionId === "cardCorner") {
          params = resolveRuleEngineActionParams(actionId, simContext);
          available = Boolean(params && Number.isInteger(Number(params.handIndex)));
        } else if (actionId === "placeData") {
          params = resolveRuleEngineActionParams(actionId, simContext);
          available = Boolean(params && params.target);
        } else if (actionId === "industry") {
          params = resolveRuleEngineActionParams(actionId, simContext);
          const industryCard = params?.industryCard || null;
          const industryCheck = industryCard
            ? industry.canMarkIndustryAction?.(currentPlayer, simContext.roundNumber, {
              turnNumber: simContext.turnNumber,
              hasMarker: Boolean(industry.getIndustryActionMarkerLayout?.(industryCard)),
              industryCard,
            })
            : { ok: false };
          available = Boolean(industryCheck?.ok);
        } else {
          const actionModule = actions?.[actionId];
          if (actionModule?.canExecute) {
            const check = actionModule.canExecute(simContext, {});
            available = Boolean(check?.ok);
            if (available) {
              params = resolveRuleEngineActionParams(actionId, simContext);
            }
          }
        }

        if (!available) continue;

        if (params == null) {
          params = resolveRuleEngineActionParams(actionId, simContext);
        }

        const priorHint = Number(policyHintByActionId[actionId] || 0);
        const scoreHint = Number(scoreHintByActionId[actionId] || 0);
        legal.push({
          id: actionId,
          kind: isRuleEngineMainActionId(actionId) ? "main" : "quick",
          available: true,
          params,
          prior: actorIsRoot ? priorHint : Math.max(1e-6, 1 - priorHint),
          score: actorIsRoot ? scoreHint : -scoreHint,
        });
      }
      return legal;
    }

    function applyRuleEngineSimAction(simState, action) {
      const nextContext = buildRuleEngineSimulationContext(simState.simContext);
      nextContext.playerState.currentPlayerId = simState.currentPlayerId;
      if (nextContext.turnState) nextContext.turnState.currentPlayerId = simState.currentPlayerId;
      nextContext.roundNumber = Number(nextContext?.turnState?.roundNumber || nextContext.roundNumber || 1);
      nextContext.turnNumber = Number(nextContext?.turnState?.turnNumber || nextContext.turnNumber || 1);
      const before = evaluateRuleEngineBoardState(nextContext, simState.rootPlayerId);
      const currentPlayer = getRuleEngineSimCurrentPlayer(nextContext, simState.currentPlayerId);
      let execution = { ok: true };
      const actionId = action?.id || null;
      let pendingActionExecuted = Boolean(simState.pendingActionExecuted);
      let nextCurrentPlayerId = simState.currentPlayerId;
      let passPendingPlayerId = simState.passPendingPlayerId || null;
      const emittedEvents = [];

      if (!actionId || !currentPlayer) {
        execution = { ok: false, message: "simulation missing action or player" };
      } else if (actionId === "pass") {
        pendingActionExecuted = true;
        passPendingPlayerId = simState.currentPlayerId;
      } else if (actionId === "end-turn") {
        const isPassEndingPlayer = passPendingPlayerId && passPendingPlayerId === simState.currentPlayerId;
        if (
          isPassEndingPlayer
          && Number(nextContext?.turnState?.roundNumber || nextContext.roundNumber || 1) < FINAL_ROUND_NUMBER
        ) {
          players.gainResources(currentPlayer, currentPlayer?.income || {});
        }
        pendingActionExecuted = false;
        passPendingPlayerId = null;
        if (nextContext?.turnState) {
          nextContext.turnState.cardTurnEventBonuses = [];
        }
        nextContext.__simFlowEventBonuses = [];
        nextCurrentPlayerId = advanceRuleEngineSimTurn(nextContext, simState.currentPlayerId).nextPlayerId;
      } else if (actionId === "scan") {
        execution = executeRuleEngineSimScan(nextContext, currentPlayer);
        if (execution?.ok) {
          pendingActionExecuted = true;
          emittedEvents.push({ type: "scanAction" });
        }
      } else if (actionId === "analyze") {
        execution = data.analyzeData(currentPlayer);
        if (execution?.ok) pendingActionExecuted = true;
      } else if (actionId === "playCard") {
        execution = executeRuleEngineSimPlayCard(nextContext, currentPlayer, action?.params || {}, emittedEvents);
        if (execution?.ok) {
          pendingActionExecuted = true;
          emittedEvents.push({ type: "playCard" });
        }
      } else if (actionId === "move") {
        execution = executeRuleEngineSimMove(nextContext, currentPlayer, action?.params || {});
      } else if (actionId === "cardCorner") {
        execution = executeRuleEngineSimCardCorner(nextContext, currentPlayer, action?.params || {});
      } else if (actionId === "placeData") {
        execution = executeRuleEngineSimPlaceData(nextContext, currentPlayer, action?.params || {});
      } else if (actionId === "industry") {
        execution = executeRuleEngineSimIndustry(nextContext, currentPlayer, action?.params || {});
      } else {
        const actionModule = actions?.[actionId];
        if (!actionModule?.execute) {
          execution = { ok: false, message: `unsupported simulated action '${actionId}'` };
        } else {
          execution = actionModule.execute(nextContext, action?.params || {});
          if (execution?.ok && isRuleEngineMainActionId(actionId)) {
            pendingActionExecuted = true;
          }
        }
      }

      if (execution?.ok) {
        if (Array.isArray(execution?.events) && execution.events.length) {
          emittedEvents.push(...execution.events.map((event) => ({ ...(event || {}) })));
        }
        const hasEvent = (eventType) => emittedEvents.some((event) => String(event?.type || "") === eventType);
        if (actionId === "launch" && !hasEvent("launch")) {
          emittedEvents.push({ type: "launch", playerId: currentPlayer?.id || null });
        }
        if (actionId === "orbit" && !hasEvent("orbit")) {
          emittedEvents.push({ type: "orbit", playerId: currentPlayer?.id || null });
        }
        if (actionId === "land" && !hasEvent("land")) {
          emittedEvents.push({ type: "land", playerId: currentPlayer?.id || null });
        }
        if (actionId === "researchTech" && !hasEvent("researchTech")) {
          emittedEvents.push({
            type: "researchTech",
            techType: execution?.payload?.techType || null,
            playerId: currentPlayer?.id || null,
          });
        }
        const normalizedEvents = normalizeRuleEngineSimEvents(nextContext, currentPlayer, emittedEvents);
        for (const event of normalizedEvents) {
          const bonusResult = applyRuleEngineEventBonusesForEvent(nextContext, currentPlayer, event, emittedEvents);
          if (!bonusResult?.ok) {
            execution = bonusResult;
            break;
          }
        }
      }

      const after = evaluateRuleEngineBoardState(nextContext, simState.rootPlayerId);
      const actorIsRoot = simState.currentPlayerId === simState.rootPlayerId;
      const reward = actorIsRoot ? (after - before) : (before - after);

      if (nextContext?.playerState) nextContext.playerState.currentPlayerId = nextCurrentPlayerId;
      if (nextContext?.turnState) nextContext.turnState.currentPlayerId = nextCurrentPlayerId;

      return {
        ...simState,
        simContext: nextContext,
        currentPlayerId: nextCurrentPlayerId,
        pendingActionExecuted,
        passPendingPlayerId,
        chosenAction: action?.id || null,
        ply: Number(simState?.ply || 0) + 1,
        lastTransitionReward: reward,
        blocked: execution?.ok === false,
        blockedReason: execution?.ok === false ? (execution?.message || "simulation failed") : null,
      };
    }

    function chooseAiTurnActionByDifficulty(candidates = [], graphState = {}, currentPlayer = getCurrentPlayer(), difficulty = "easy") {
      const normalizedDifficulty = normalizeAiDifficulty(difficulty);
      const profile = getAiDifficultyProfile(difficulty);
      const pureRlMode = FORCE_PURE_RL_MODE === true;
      if (!pureRlMode && (profile.mode === "legacy" || !ai?.planner?.buildTurnPlans)) {
        return ai?.policy?.chooseTurnAction?.(candidates, {
          playerState,
          turnState,
          currentPlayer,
        }) || null;
      }

      const availableCandidates = (candidates || []).filter((candidate) => candidate?.available !== false);
      if (!availableCandidates.length) return null;

      const observationState = {
        playerState,
        turnState,
        cardState,
        techState: techGameState,
        nebulaDataState,
        alienGameState,
        finalScoringState,
        solarState,
        rocketState,
        planetStats: planetStatsState,
        setup: typeof getSetupState === "function" ? getSetupState() : null,
      };
      const observation = ai?.observation?.buildObservation?.(observationState, currentPlayer?.id, {
        hiddenNotes: { source: "runtime-ai" },
      }) || null;
      const compactObservation = ai?.observation?.buildCompactEntityObservation?.(observationState, currentPlayer?.id, {
        decisionContext: {
          actionLevel: "turn",
          decisionType: "turn-action",
        },
        candidates: availableCandidates,
      }) || null;

      const priorResult = ai?.policyNetwork?.buildActionPriors?.(observation, availableCandidates, {
        seed: `${turnState.roundNumber}:${turnState.turnNumber}:${currentPlayer?.id || "ai"}`,
      }) || null;
      const valueResult = ai?.valueNetwork?.evaluateObservationValue?.(observation, {
        seed: `${turnState.roundNumber}:${turnState.turnNumber}:${currentPlayer?.id || "ai"}`,
        playerId: currentPlayer?.id,
      }) || null;
      const requiresTrainedBehaviorModel = normalizedDifficulty === "expert" && !pureRlMode;
      const trainedBehaviorModel = normalizedDifficulty === "expert"
        ? ai?.expertTrainedModels?.getExpertBehaviorCloneModel?.()
          || ai?.expertTrainedModels?.EXPERT_BEHAVIOR_CLONE_MODEL
          || null
          : null;
      const requiresTrainedBehaviorHeads = requiresTrainedBehaviorModel
        && ["pytorch-entity-transformer-v1", "pytorch-tiny-resnet-v1"].includes(String(trainedBehaviorModel?.modelType || ""));
      if (requiresTrainedBehaviorModel && !trainedBehaviorModel) {
        throw new Error(`AI difficulty '${difficulty}' requires a trained behavior model, but none is loaded`);
      }
      if (requiresTrainedBehaviorHeads && typeof ai?.behaviorCloning?.evaluateBehaviorCloneHeads !== "function") {
        throw new Error("SetiAIBehaviorCloning.evaluateBehaviorCloneHeads is required for expert AI");
      }
      if (requiresTrainedBehaviorModel && typeof ai?.behaviorCloning?.predictBehaviorCloneAction !== "function") {
        throw new Error("SetiAIBehaviorCloning.predictBehaviorCloneAction is required for expert AI");
      }
      const behaviorModelMeta = trainedBehaviorModel
        ? {
          source: "expert",
          version: Number(trainedBehaviorModel.version || 0),
          modelType: String(trainedBehaviorModel.modelType || "count-table-v1"),
          trainedAt: trainedBehaviorModel.trainedAt || null,
          roundBucketSize: Number(trainedBehaviorModel.roundBucketSize || 0),
        }
        : null;
      const behaviorHeadEval = trainedBehaviorModel && typeof ai?.behaviorCloning?.evaluateBehaviorCloneHeads === "function"
        ? ai.behaviorCloning.evaluateBehaviorCloneHeads(
          trainedBehaviorModel,
          availableCandidates,
          {
            roundNumber: turnState.roundNumber,
            turnNumber: turnState.turnNumber,
            observation: compactObservation || observation || null,
          },
          { roundBucketSize: 1 },
        )
        : null;
      if (requiresTrainedBehaviorHeads && !behaviorHeadEval) {
        throw new Error(`AI difficulty '${difficulty}' requires trained policy/value head outputs, but evaluation failed`);
      }
      const priorById = {};
      for (let index = 0; index < (availableCandidates || []).length; index += 1) {
        const candidate = availableCandidates[index];
        const modelPrior = Number(behaviorHeadEval?.probabilityByActionId?.[candidate.id]);
        if (requiresTrainedBehaviorHeads && !Number.isFinite(modelPrior)) {
          throw new Error(`AI difficulty '${difficulty}' missing trained policy probability for action '${candidate.id}'`);
        }
        const fallbackPrior = Number(priorResult?.probabilities?.[index] || 0);
        priorById[candidate.id] = Number.isFinite(modelPrior) ? modelPrior : fallbackPrior;
      }
      const behaviorPick = requiresTrainedBehaviorModel
        ? ai.behaviorCloning.predictBehaviorCloneAction(
          trainedBehaviorModel,
          availableCandidates,
          {
            roundNumber: turnState.roundNumber,
            turnNumber: turnState.turnNumber,
            observation: compactObservation || observation || null,
          },
          { roundBucketSize: 1 },
        )
        : null;
      const entityCount = Array.isArray(compactObservation?.compactEntities)
        ? compactObservation.compactEntities.length
        : 0;
      const candidateCount = availableCandidates.length;
      const maskedCandidateCount = availableCandidates.reduce((count, candidate) => (
        count + (Number(priorById[candidate.id] || 0) > 0 ? 1 : 0)
      ), 0);
      const topPolicy = Object.entries(priorById)
        .map(([actionId, probability]) => ({ actionId, probability: Number(probability || 0) }))
        .sort((left, right) => Number(right.probability || 0) - Number(left.probability || 0))
        .slice(0, 5);
      const modelValueOffset = Number(behaviorHeadEval?.normalizedValue);
      if (requiresTrainedBehaviorHeads && !Number.isFinite(modelValueOffset)) {
        throw new Error(`AI difficulty '${difficulty}' missing trained value-head output`);
      }
      const valueOffset = Number.isFinite(modelValueOffset)
        ? modelValueOffset
        : Number(valueResult?.normalized || 0);
      const priorWeight = pureRlMode
        ? 12
        : (profile.mctsCpuct || 0) * 10;
      const pureRlBaseWeight = pureRlMode
        ? Math.max(0, Math.min(1, Number(profile.pureRlBaseWeight ?? 0.22)))
        : 1;
      const baseScored = availableCandidates.map((candidate) => {
        const baseRaw = Number.isFinite(Number(candidate?.net))
          ? Number(candidate.net)
          : Number.isFinite(Number(candidate?.score))
            ? Number(candidate.score)
            : 0;
        const base = pureRlMode
          ? Math.max(
            -4,
            Math.min(4, baseRaw * pureRlBaseWeight * (baseRaw < 0 ? 1.15 : 0.7)),
          )
          : baseRaw;
        const prior = Number(priorById[candidate.id] || 0);
        const behaviorBoost = behaviorPick && behaviorPick === candidate.id ? 2.5 : 0;
        return {
          ...candidate,
          score: base + prior * priorWeight + valueOffset * 2 + behaviorBoost,
          prior,
          behaviorBoost,
        };
      });

      const searchConfig = pureRlMode
        ? {
          simulations: Math.max(1, aiAutoBattleState.mctsSimulationsPerMove ?? profile.mctsSimulationsPerMove ?? 64),
          maxDepth: Math.max(1, aiAutoBattleState.mctsMaxDepth ?? profile.mctsMaxDepth ?? 4),
          cpuct: Math.max(0.1, aiAutoBattleState.mctsCpuct ?? profile.mctsCpuct ?? 1),
          rolloutDepth: Math.max(0, aiAutoBattleState.mctsRolloutDepth ?? profile.mctsRolloutDepth ?? 0),
          multiStepScoring: true,
          valueDiscount: 0.95,
          stepRewardWeight: 0.75,
          leafValueWeight: 0.25,
          selfAggressiveBias: 0.28,
          selfAggressiveNegativeScale: 0.35,
          simulatedPlies: 4,
          rootNoiseEnabled: aiAutoBattleState.mctsRootNoiseEnabled === true,
          rootNoiseAlpha: aiAutoBattleState.mctsRootNoiseAlpha,
          rootNoiseWeight: aiAutoBattleState.mctsRootNoiseWeight,
        }
        : {
          simulations: Math.max(1, aiAutoBattleState.mctsSimulationsPerMove ?? profile.mctsSimulationsPerMove ?? 1),
          maxDepth: Math.max(1, aiAutoBattleState.mctsMaxDepth ?? profile.mctsMaxDepth ?? 1),
          cpuct: Math.max(0.1, aiAutoBattleState.mctsCpuct ?? profile.mctsCpuct ?? 1),
          rolloutDepth: Math.max(0, aiAutoBattleState.mctsRolloutDepth ?? profile.mctsRolloutDepth ?? 0),
          multiStepScoring: true,
          valueDiscount: 0.93,
          stepRewardWeight: 0.7,
          leafValueWeight: 0.3,
          selfAggressiveBias: 0.18,
          selfAggressiveNegativeScale: 0.35,
          simulatedPlies: 3,
          rootNoiseEnabled: false,
          rootNoiseAlpha: aiAutoBattleState.mctsRootNoiseAlpha,
          rootNoiseWeight: aiAutoBattleState.mctsRootNoiseWeight,
        };

      const plannerSearch = ai?.mcts?.createMctsPlanner?.({
        seed: `${turnState.roundNumber}:${turnState.turnNumber}:${currentPlayer?.id || "ai"}`,
        simulations: searchConfig.simulations,
        maxDepth: searchConfig.maxDepth,
        cpuct: searchConfig.cpuct,
        rolloutDepth: searchConfig.rolloutDepth,
        multiStepScoring: searchConfig.multiStepScoring,
        valueDiscount: searchConfig.valueDiscount,
        stepRewardWeight: searchConfig.stepRewardWeight,
        leafValueWeight: searchConfig.leafValueWeight,
        selfAggressiveBias: searchConfig.selfAggressiveBias,
        selfAggressiveNegativeScale: searchConfig.selfAggressiveNegativeScale,
      });
      const mctsResult = plannerSearch?.runSearch?.({
        rootPlayerId: currentPlayer?.id,
        currentPlayerId: currentPlayer?.id,
        opponentPlayerId: getActivePlayers().find((player) => player?.id && player.id !== currentPlayer?.id)?.id || `${currentPlayer?.id || "ai"}::opponent`,
        simContext: buildRuleEngineSimulationContext(createActionContext()),
        policyHintByActionId: priorById,
        scoreHintByActionId: baseScored.reduce((map, candidate) => {
          map[candidate.id] = Number(candidate.score || 0);
          return map;
        }, {}),
        ply: 0,
        maxSimulatedPlies: searchConfig.simulatedPlies,
      }, {
        getCurrentPlayerId(state) {
          return state.currentPlayerId;
        },
        getLegalActions(state) {
          return buildRuleEngineLegalActions(state);
        },
        applyAction(state, action) {
          return applyRuleEngineSimAction(state, action);
        },
        getTransitionReward(_previousState, _action, nextState) {
          return Number(nextState?.lastTransitionReward || 0);
        },
        isTerminal(state) {
          return Boolean(state?.blocked)
            || Number(state?.ply || 0) >= Number(state?.maxSimulatedPlies || 3);
        },
        evaluateState(state) {
          const evolvedValue = evaluateRuleEngineBoardState(state?.simContext, state?.rootPlayerId);
          return (evolvedValue * 0.88) + (valueOffset * 0.12);
        },
      }, {
        rootPlayerId: currentPlayer?.id,
      }) || null;

      const mctsActionId = mctsResult?.bestAction?.id || null;
      const mctsCandidate = mctsActionId
        ? baseScored.find((candidate) => candidate.id === mctsActionId)
        : null;
      const selectedCandidate = mctsCandidate || baseScored.sort((left, right) => (
        Number(right.score || 0) - Number(left.score || 0)
        || String(left.id || "").localeCompare(String(right.id || ""))
      ))[0] || null;

      let finalCandidate = selectedCandidate;
      const explorationEpsilon = Math.max(0, Math.min(1, Number(aiAutoBattleState.explorationEpsilon || 0)));
      const explorationTemperature = Math.max(0.05, Number(aiAutoBattleState.explorationTemperature || 1));
      let explorationMeta = null;
      if (
        pureRlMode
        && selectedCandidate
        && availableCandidates.length > 1
        && explorationEpsilon > 0
        && Math.random() < explorationEpsilon
      ) {
        const explorationPool = [...baseScored]
          .sort((left, right) => Number(right.score || 0) - Number(left.score || 0))
          .slice(0, Math.min(5, baseScored.length));
        if (explorationPool.length > 1) {
          const maxScore = explorationPool.reduce((best, candidate) => Math.max(best, Number(candidate.score || 0)), -Infinity);
          const logits = explorationPool.map((candidate) => (Number(candidate.score || 0) - maxScore) / explorationTemperature);
          const expValues = logits.map((logit) => Math.exp(Math.max(-60, Math.min(60, logit))));
          const total = expValues.reduce((sum, value) => sum + value, 0);
          if (total > 0) {
            let threshold = Math.random() * total;
            let pickedIndex = 0;
            for (let index = 0; index < expValues.length; index += 1) {
              threshold -= expValues[index];
              if (threshold <= 0) {
                pickedIndex = index;
                break;
              }
            }
            finalCandidate = explorationPool[pickedIndex] || selectedCandidate;
            explorationMeta = {
              pickedActionId: finalCandidate?.id || null,
              selectedActionId: selectedCandidate?.id || null,
              epsilon: explorationEpsilon,
              temperature: explorationTemperature,
              poolSize: explorationPool.length,
            };
          }
        }
      }

      if (finalCandidate) {
        return {
          ...finalCandidate,
          difficulty: normalizedDifficulty,
          decisionPlan: {
            type: pureRlMode ? "pure-rl-mcts" : "mcts-policy-value",
            profile,
            pureRlMode,
            pureRlBaseWeight,
            modelType: String(behaviorModelMeta?.modelType || "none"),
            entityCount,
            candidateCount,
            maskedCandidateCount,
            topPolicy,
            value: Number(valueOffset),
            mcts: mctsResult,
            behaviorPick,
            behaviorHeadSource: behaviorHeadEval?.source || null,
            behaviorHeadValue: Number.isFinite(Number(behaviorHeadEval?.value)) ? Number(behaviorHeadEval.value) : null,
            behaviorModelMeta,
            exploration: explorationMeta,
          },
          compactObservation,
        };
      }

      const plans = ai.planner.buildTurnPlans(candidates, graphState, currentPlayer?.id, {
        quickBeamWidth: profile.quickBeamWidth,
        mainBeamWidth: profile.mainBeamWidth,
        markedFormulas: graphState.aiMarkedFinalFormulas || [],
        hasMarkedFinalTile: (graphState.aiMarkedFinalFormulas || []).length > 0,
      });
      const bestPlan = plans[0] || null;
      const bestAction = bestPlan?.firstAction || null;
      if (!bestAction) return null;
      return {
        ...bestAction,
        difficulty: normalizedDifficulty,
        decisionPlan: bestPlan,
        compactObservation,
      };
    }

    async function chooseAiTurnActionByDifficultyAsync(candidates = [], graphState = {}, currentPlayer = getCurrentPlayer(), difficulty = "easy") {
      const normalizedDifficulty = normalizeAiDifficulty(difficulty);
      const profile = getAiDifficultyProfile(difficulty);
      const pureRlMode = FORCE_PURE_RL_MODE === true;
      if (!pureRlMode && (profile.mode === "legacy" || !ai?.planner?.buildTurnPlans)) {
        logAiMctsSearchTrace("skipped-legacy-path", {
          difficulty: normalizedDifficulty,
          pureRlMode,
          profileMode: profile.mode,
          plannerAvailable: Boolean(ai?.planner?.buildTurnPlans),
        });
        return chooseAiTurnActionByDifficulty(candidates, graphState, currentPlayer, difficulty);
      }

      const availableCandidates = (candidates || []).filter((candidate) => candidate?.available !== false);
      if (!availableCandidates.length) {
        logAiMctsSearchTrace("skipped-no-candidates", {
          difficulty: normalizedDifficulty,
          candidateCount: 0,
        });
        return null;
      }
      const candidateCount = availableCandidates.length;

      const observationState = {
        playerState,
        turnState,
        cardState,
        techState: techGameState,
        nebulaDataState,
        alienGameState,
        finalScoringState,
        solarState,
        rocketState,
        planetStats: planetStatsState,
        setup: typeof getSetupState === "function" ? getSetupState() : null,
      };
      const observation = ai?.observation?.buildObservation?.(observationState, currentPlayer?.id, {
        hiddenNotes: { source: "runtime-ai" },
      }) || null;
      const compactObservation = ai?.observation?.buildCompactEntityObservation?.(observationState, currentPlayer?.id, {
        decisionContext: {
          actionLevel: "turn",
          decisionType: "turn-action",
        },
        candidates: availableCandidates,
      }) || null;

      const priorResult = ai?.policyNetwork?.buildActionPriors?.(observation, availableCandidates, {
        seed: `${turnState.roundNumber}:${turnState.turnNumber}:${currentPlayer?.id || "ai"}`,
      }) || null;
      const valueResult = ai?.valueNetwork?.evaluateObservationValue?.(observation, {
        seed: `${turnState.roundNumber}:${turnState.turnNumber}:${currentPlayer?.id || "ai"}`,
        playerId: currentPlayer?.id,
      }) || null;
      const requiresTrainedBehaviorModel = normalizedDifficulty === "expert" && !pureRlMode;
      const trainedBehaviorModel = normalizedDifficulty === "expert"
        ? ai?.expertTrainedModels?.getExpertBehaviorCloneModel?.()
          || ai?.expertTrainedModels?.EXPERT_BEHAVIOR_CLONE_MODEL
          || null
          : null;
      const requiresTrainedBehaviorHeads = requiresTrainedBehaviorModel
        && ["pytorch-entity-transformer-v1", "pytorch-tiny-resnet-v1"].includes(String(trainedBehaviorModel?.modelType || ""));
      if (requiresTrainedBehaviorModel && !trainedBehaviorModel) {
        logAiMctsSearchTrace("error-pre-mcts", {
          reason: "missing-trained-behavior-model",
          difficulty: normalizedDifficulty,
          pureRlMode,
          candidateCount,
        });
        throw new Error(`AI difficulty '${difficulty}' requires a trained behavior model, but none is loaded`);
      }
      if (requiresTrainedBehaviorHeads && typeof ai?.behaviorCloning?.evaluateBehaviorCloneHeadsAsync !== "function") {
        logAiMctsSearchTrace("error-pre-mcts", {
          reason: "missing-evaluateBehaviorCloneHeadsAsync",
          difficulty: normalizedDifficulty,
          pureRlMode,
          candidateCount,
          modelType: String(trainedBehaviorModel?.modelType || ""),
        });
        throw new Error("SetiAIBehaviorCloning.evaluateBehaviorCloneHeadsAsync is required for Node ONNX AI");
      }
      if (requiresTrainedBehaviorModel && typeof ai?.behaviorCloning?.predictBehaviorCloneActionAsync !== "function") {
        logAiMctsSearchTrace("error-pre-mcts", {
          reason: "missing-predictBehaviorCloneActionAsync",
          difficulty: normalizedDifficulty,
          pureRlMode,
          candidateCount,
          modelType: String(trainedBehaviorModel?.modelType || ""),
        });
        throw new Error("SetiAIBehaviorCloning.predictBehaviorCloneActionAsync is required for Node ONNX AI");
      }
      const behaviorModelMeta = trainedBehaviorModel
        ? {
          source: "expert",
          version: Number(trainedBehaviorModel.version || 0),
          modelType: String(trainedBehaviorModel.modelType || "count-table-v1"),
          trainedAt: trainedBehaviorModel.trainedAt || null,
          roundBucketSize: Number(trainedBehaviorModel.roundBucketSize || 0),
          onnxFileName: trainedBehaviorModel?.onnx?.fileName || null,
        }
        : null;
      const behaviorModelType = String(trainedBehaviorModel?.modelType || "");
      const behaviorOnnxOptions = {
        roundBucketSize: 1,
        ...(behaviorModelType === "pytorch-entity-transformer-v1" ? { executionProviders: ["cuda"] } : {}),
      };
      let behaviorHeadEval = null;
      if (trainedBehaviorModel && typeof ai?.behaviorCloning?.evaluateBehaviorCloneHeadsAsync === "function") {
        try {
          behaviorHeadEval = await ai.behaviorCloning.evaluateBehaviorCloneHeadsAsync(
            trainedBehaviorModel,
            availableCandidates,
            {
              roundNumber: turnState.roundNumber,
              turnNumber: turnState.turnNumber,
              observation: compactObservation || observation || null,
            },
            behaviorOnnxOptions,
          );
        } catch (error) {
          logAiMctsSearchTrace("error-pre-mcts", {
            reason: "behavior-head-eval-throw",
            difficulty: normalizedDifficulty,
            pureRlMode,
            candidateCount,
            modelType: String(trainedBehaviorModel?.modelType || ""),
            message: error?.message || String(error),
            stack: error?.stack || null,
          });
          throw error;
        }
      }
      if (requiresTrainedBehaviorHeads && !behaviorHeadEval) {
        logAiMctsSearchTrace("error-pre-mcts", {
          reason: "missing-trained-head-eval-result",
          difficulty: normalizedDifficulty,
          pureRlMode,
          candidateCount,
          modelType: String(trainedBehaviorModel?.modelType || ""),
        });
        throw new Error(`AI difficulty '${difficulty}' requires trained policy/value head outputs, but evaluation failed`);
      }
      const priorById = {};
      for (let index = 0; index < (availableCandidates || []).length; index += 1) {
        const candidate = availableCandidates[index];
        const modelPrior = Number(behaviorHeadEval?.probabilityByActionId?.[candidate.id]);
        if (requiresTrainedBehaviorHeads && !Number.isFinite(modelPrior)) {
          logAiMctsSearchTrace("error-pre-mcts", {
            reason: "missing-trained-policy-probability",
            difficulty: normalizedDifficulty,
            pureRlMode,
            candidateCount,
            actionId: candidate.id,
            modelType: String(trainedBehaviorModel?.modelType || ""),
          });
          throw new Error(`AI difficulty '${difficulty}' missing trained policy probability for action '${candidate.id}'`);
        }
        const fallbackPrior = Number(priorResult?.probabilities?.[index] || 0);
        priorById[candidate.id] = Number.isFinite(modelPrior) ? modelPrior : fallbackPrior;
      }
      let behaviorPick = null;
      if (requiresTrainedBehaviorModel) {
        try {
          behaviorPick = await ai.behaviorCloning.predictBehaviorCloneActionAsync(
            trainedBehaviorModel,
            availableCandidates,
            {
              roundNumber: turnState.roundNumber,
              turnNumber: turnState.turnNumber,
              observation: compactObservation || observation || null,
            },
            behaviorOnnxOptions,
          );
        } catch (error) {
          logAiMctsSearchTrace("error-pre-mcts", {
            reason: "behavior-action-pick-throw",
            difficulty: normalizedDifficulty,
            pureRlMode,
            candidateCount,
            modelType: String(trainedBehaviorModel?.modelType || ""),
            message: error?.message || String(error),
            stack: error?.stack || null,
          });
          throw error;
        }
      }
      const entityCount = Array.isArray(compactObservation?.compactEntities)
        ? compactObservation.compactEntities.length
        : 0;
      const maskedCandidateCount = availableCandidates.reduce((count, candidate) => (
        count + (Number(priorById[candidate.id] || 0) > 0 ? 1 : 0)
      ), 0);
      const topPolicy = Object.entries(priorById)
        .map(([actionId, probability]) => ({ actionId, probability: Number(probability || 0) }))
        .sort((left, right) => Number(right.probability || 0) - Number(left.probability || 0))
        .slice(0, 5);
      const modelValueOffset = Number(behaviorHeadEval?.normalizedValue);
      if (requiresTrainedBehaviorHeads && !Number.isFinite(modelValueOffset)) {
        logAiMctsSearchTrace("error-pre-mcts", {
          reason: "missing-trained-value-head-output",
          difficulty: normalizedDifficulty,
          pureRlMode,
          candidateCount,
          modelType: String(trainedBehaviorModel?.modelType || ""),
          normalizedValue: behaviorHeadEval?.normalizedValue,
        });
        throw new Error(`AI difficulty '${difficulty}' missing trained value-head output`);
      }
      const valueOffset = Number.isFinite(modelValueOffset)
        ? modelValueOffset
        : Number(valueResult?.normalized || 0);
      const priorWeight = pureRlMode
        ? 12
        : (profile.mctsCpuct || 0) * 10;
      const pureRlBaseWeight = pureRlMode
        ? Math.max(0, Math.min(1, Number(profile.pureRlBaseWeight ?? 0.22)))
        : 1;
      const baseScored = availableCandidates.map((candidate) => {
        const baseRaw = Number.isFinite(Number(candidate?.net))
          ? Number(candidate.net)
          : Number.isFinite(Number(candidate?.score))
            ? Number(candidate.score)
            : 0;
        const base = pureRlMode
          ? Math.max(
            -4,
            Math.min(4, baseRaw * pureRlBaseWeight * (baseRaw < 0 ? 1.15 : 0.7)),
          )
          : baseRaw;
        const prior = Number(priorById[candidate.id] || 0);
        const behaviorBoost = behaviorPick && behaviorPick === candidate.id ? 2.5 : 0;
        return {
          ...candidate,
          score: base + prior * priorWeight + valueOffset * 2 + behaviorBoost,
          prior,
          behaviorBoost,
        };
      });

      const searchConfig = pureRlMode
        ? {
          simulations: Math.max(1, aiAutoBattleState.mctsSimulationsPerMove ?? profile.mctsSimulationsPerMove ?? 64),
          maxDepth: Math.max(1, aiAutoBattleState.mctsMaxDepth ?? profile.mctsMaxDepth ?? 4),
          cpuct: Math.max(0.1, aiAutoBattleState.mctsCpuct ?? profile.mctsCpuct ?? 1),
          rolloutDepth: Math.max(0, aiAutoBattleState.mctsRolloutDepth ?? profile.mctsRolloutDepth ?? 0),
          multiStepScoring: true,
          valueDiscount: 0.95,
          stepRewardWeight: 0.75,
          leafValueWeight: 0.25,
          selfAggressiveBias: 0.28,
          selfAggressiveNegativeScale: 0.35,
          simulatedPlies: 4,
          rootNoiseEnabled: aiAutoBattleState.mctsRootNoiseEnabled === true,
          rootNoiseAlpha: aiAutoBattleState.mctsRootNoiseAlpha,
          rootNoiseWeight: aiAutoBattleState.mctsRootNoiseWeight,
        }
        : {
          simulations: Math.max(1, aiAutoBattleState.mctsSimulationsPerMove ?? profile.mctsSimulationsPerMove ?? 1),
          maxDepth: Math.max(1, aiAutoBattleState.mctsMaxDepth ?? profile.mctsMaxDepth ?? 1),
          cpuct: Math.max(0.1, aiAutoBattleState.mctsCpuct ?? profile.mctsCpuct ?? 1),
          rolloutDepth: Math.max(0, aiAutoBattleState.mctsRolloutDepth ?? profile.mctsRolloutDepth ?? 0),
          multiStepScoring: true,
          valueDiscount: 0.93,
          stepRewardWeight: 0.7,
          leafValueWeight: 0.3,
          selfAggressiveBias: 0.18,
          selfAggressiveNegativeScale: 0.35,
          simulatedPlies: 3,
          rootNoiseEnabled: false,
          rootNoiseAlpha: aiAutoBattleState.mctsRootNoiseAlpha,
          rootNoiseWeight: aiAutoBattleState.mctsRootNoiseWeight,
        };
      const alphaZeroEntityMcts = behaviorModelType === "pytorch-entity-transformer-v1";
      if (alphaZeroEntityMcts) {
        searchConfig.rolloutDepth = 0;
        searchConfig.leafValueWeight = 1;
      }

      logAiMctsSearchTrace("enter", {
        difficulty: normalizedDifficulty,
        pureRlMode,
        alphaZeroEntityMcts,
        candidateCount,
        maskedCandidateCount,
        searchConfig,
      });

      const plannerSearch = ai?.mcts?.createMctsPlanner?.({
        seed: `${turnState.roundNumber}:${turnState.turnNumber}:${currentPlayer?.id || "ai"}`,
        simulations: searchConfig.simulations,
        maxDepth: searchConfig.maxDepth,
        cpuct: searchConfig.cpuct,
        rolloutDepth: searchConfig.rolloutDepth,
        multiStepScoring: searchConfig.multiStepScoring,
        valueDiscount: searchConfig.valueDiscount,
        stepRewardWeight: searchConfig.stepRewardWeight,
        leafValueWeight: searchConfig.leafValueWeight,
        selfAggressiveBias: searchConfig.selfAggressiveBias,
        selfAggressiveNegativeScale: searchConfig.selfAggressiveNegativeScale,
      });
      const initialMctsState = {
        rootPlayerId: currentPlayer?.id,
        currentPlayerId: currentPlayer?.id,
        opponentPlayerId: getActivePlayers().find((player) => player?.id && player.id !== currentPlayer?.id)?.id || `${currentPlayer?.id || "ai"}::opponent`,
        simContext: buildRuleEngineSimulationContext(createActionContext()),
        policyHintByActionId: priorById,
        scoreHintByActionId: baseScored.reduce((map, candidate) => {
          map[candidate.id] = Number(candidate.score || 0);
          return map;
        }, {}),
        ply: 0,
        maxSimulatedPlies: searchConfig.simulatedPlies,
      };
      const mctsHooks = {
        getCurrentPlayerId(state) {
          return state.currentPlayerId;
        },
        getLegalActions(state) {
          return buildRuleEngineLegalActions(state);
        },
        applyAction(state, action) {
          return applyRuleEngineSimAction(state, action);
        },
        getTransitionReward(_previousState, _action, nextState) {
          return Number(nextState?.lastTransitionReward || 0);
        },
        isTerminal(state) {
          return Boolean(state?.blocked)
            || Number(state?.ply || 0) >= Number(state?.maxSimulatedPlies || 3);
        },
        evaluateState(state) {
          const evolvedValue = evaluateRuleEngineBoardState(state?.simContext, state?.rootPlayerId);
          return (evolvedValue * 0.88) + (valueOffset * 0.12);
        },
        async evaluateNodeAsync(state, nodeCandidates) {
          if (!alphaZeroEntityMcts) return null;
          if (Number(state?.ply || 0) === 0 && behaviorHeadEval) {
            return {
              ...behaviorHeadEval,
              source: "entity-transformer-onnx-mcts-cuda-root",
            };
          }
          const simContext = state?.simContext || {};
          const actorPlayerId = state?.currentPlayerId || state?.rootPlayerId || currentPlayer?.id || null;
          const observationStateForNode = {
            playerState: simContext.playerState,
            turnState: simContext.turnState,
            cardState: simContext.cardState,
            techState: simContext.techGameState,
            nebulaDataState: simContext.nebulaDataState,
            alienGameState: simContext.alienGameState,
            finalScoringState: simContext.finalScoringState,
            solarState: simContext.solarState,
            rocketState: simContext.rocketState,
            planetStats: simContext.planetStatsState,
            setup: typeof getSetupState === "function" ? getSetupState() : null,
          };
          const nodeObservation = ai?.observation?.buildCompactEntityObservation?.(observationStateForNode, actorPlayerId, {
            decisionContext: {
              actionLevel: "turn",
              decisionType: "mcts-node",
            },
            candidates: nodeCandidates,
          }) || null;
          const nodeEval = await ai.behaviorCloning.evaluateBehaviorCloneHeadsAsync(
            trainedBehaviorModel,
            nodeCandidates,
            {
              roundNumber: simContext.roundNumber || simContext?.turnState?.roundNumber || turnState.roundNumber,
              turnNumber: simContext.turnNumber || simContext?.turnState?.turnNumber || turnState.turnNumber,
              observation: nodeObservation,
            },
            behaviorOnnxOptions,
          );
          if (!nodeEval) {
            throw new Error("Entity transformer MCTS node evaluation returned no result");
          }
          const modelValue = Number(nodeEval.normalizedValue);
          const rootRelativeValue = actorPlayerId && actorPlayerId !== state?.rootPlayerId
            ? -modelValue
            : modelValue;
          return {
            ...nodeEval,
            value: Number.isFinite(rootRelativeValue) ? rootRelativeValue : 0,
            normalizedValue: Number.isFinite(rootRelativeValue) ? rootRelativeValue : 0,
            rawModelValue: nodeEval.value,
            actorPlayerId,
            rootPlayerId: state?.rootPlayerId || null,
            source: "entity-transformer-onnx-mcts-cuda",
          };
        },
      };
      const mctsResult = alphaZeroEntityMcts && typeof plannerSearch?.runSearchAsync === "function"
        ? await plannerSearch.runSearchAsync(initialMctsState, mctsHooks, {
          rootPlayerId: currentPlayer?.id,
        })
        : plannerSearch?.runSearch?.(initialMctsState, mctsHooks, {
        rootPlayerId: currentPlayer?.id,
      }) || null;

      logAiMctsSearchTrace("result", {
        difficulty: normalizedDifficulty,
        alphaZeroEntityMcts,
        plannerAvailable: Boolean(plannerSearch),
        usedAsyncSearch: alphaZeroEntityMcts && typeof plannerSearch?.runSearchAsync === "function",
        bestActionId: mctsResult?.bestAction?.id || null,
        diagnostics: mctsResult?.diagnostics || null,
      });

      const mctsActionId = mctsResult?.bestAction?.id || null;
      const mctsCandidate = mctsActionId
        ? baseScored.find((candidate) => candidate.id === mctsActionId)
        : null;
      const selectedCandidate = mctsCandidate || baseScored.sort((left, right) => (
        Number(right.score || 0) - Number(left.score || 0)
        || String(left.id || "").localeCompare(String(right.id || ""))
      ))[0] || null;
      if (!selectedCandidate) return null;

      return {
        ...selectedCandidate,
        difficulty: normalizeAiDifficulty(difficulty),
        decisionPlan: {
          type: pureRlMode ? "pure-rl-mcts" : "mcts-policy-value",
          alphaZeroEntityMcts,
          profile,
          pureRlMode,
          pureRlBaseWeight,
          modelType: String(behaviorModelMeta?.modelType || "none"),
          entityCount,
          candidateCount,
          maskedCandidateCount,
          topPolicy,
          value: Number(valueOffset),
          mcts: mctsResult,
          behaviorPick,
          behaviorHeadSource: behaviorHeadEval?.source || null,
          behaviorHeadValue: Number.isFinite(Number(behaviorHeadEval?.value)) ? Number(behaviorHeadEval.value) : null,
          behaviorModelMeta,
          exploration: null,
          asyncInference: true,
        },
        compactObservation,
      };
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
      const player = getPlayerById(playerId);
      if (player && decision.openingPlan) {
        player.openingPlan = structuredClone(decision.openingPlan);
      }
      offer.selectedIndustryId = industryCard.id;
      offer.selectedInitialIds = initialSelection
        .slice(0, INITIAL_SELECTION_REQUIRED.initial)
        .map((card) => card.id);
      recordAiAutoBattleLog(
        "initial-selection",
        `${getPlayerLabelById(playerId)}选择 ${industryCard.label || industryCard.id}`,
        { industryCard, initialCards: initialSelection, openingPlan: decision.openingPlan || null },
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
      const pendingType = state.pendingDiscardAction.type || null;
        if (pendingType === "discard_any_income" && !(player?.hand || []).length) {
          return { ok: true, progressed: true, skipped: true, message: "AI 跳过无手牌的收入弃牌" };
        }
      const incomeGainByIndex = isAiIncomeDiscardType(pendingType)
        ? (player.hand || []).map((card) => cards.getIncomeGainForCard?.(card) || null)
        : null;
      const incomePlanningEntries = incomeGainByIndex ? getAiIncomeFinalFormulaEntries(player) : [];
      const hasIncomeFinalFormula = incomeGainByIndex
        && incomePlanningEntries.length > 0;
      const dynamicIncomeIndexes = hasIncomeFinalFormula
        ? chooseAiIncomeDiscardIndexes(player, count, incomeGainByIndex, incomePlanningEntries)
        : null;
      const selectedIndexes = dynamicIncomeIndexes || ai?.policy?.chooseDiscardIndexes?.(player.hand || [], count, {
        pendingType,
        incomeGainByIndex,
      })
        || Array.from({ length: count }, (_item, index) => index);
      state.pendingDiscardAction.selectedIndexes = selectedIndexes.slice(0, count);
      recordAiAutoBattleLog("discard", `${player.colorLabel}AI 弃牌 ${state.pendingDiscardAction.selectedIndexes.length} 张`, {
        selectedIndexes: state.pendingDiscardAction.selectedIndexes,
        pendingType,
        incomeGainByIndex,
      });
      return finalizePendingDiscardSelection();
    }

    function chooseAiIncomeDiscardIndexes(player, count, incomeGainByIndex = [], incomeFormulaEntries = null) {
      const target = Math.max(0, Math.round(aiNumber(count)));
      const hand = player?.hand || [];
      if (!target || !hand.length) return null;
      const ranked = hand
        .map((card, index) => {
          const gain = incomeGainByIndex[index] || null;
          if (!gain) return null;
          const incomeScore = scoreAiIncomeOpportunityValue(player, gain);
          const finalFormulaFit = scoreAiIncomeDiscardFinalFormulaFit(player, gain, incomeFormulaEntries);
          const playValue = Math.max(0, scoreAiPlayCardValue(card));
          return {
            index,
            incomeScore,
            finalFormulaFit,
            playValue,
            score: incomeScore + finalFormulaFit - Math.min(8, playValue * 0.12),
          };
        })
        .filter((entry) => entry && Number.isFinite(entry.score))
        .sort((left, right) => (
          right.score - left.score
          || right.finalFormulaFit - left.finalFormulaFit
          || right.incomeScore - left.incomeScore
          || left.playValue - right.playValue
          || left.index - right.index
        ));
      if (ranked.length < target) return null;
      return ranked.slice(0, target).map((entry) => entry.index);
    }

    function scoreAiIncomeDiscardFinalFormulaFit(player = getCurrentPlayer(), incomeGain = {}, entries = null) {
      if (!player || !incomeGain || typeof incomeGain !== "object") return 0;
      const formulaEntries = entries || getAiIncomeFinalFormulaEntries(player);
      if (!formulaEntries.length) return 0;
      const income = player.income || {};
      return formulaEntries.reduce((total, entry) => {
        if (entry.formulaId === "a2") {
          const currentBase = getAiIncomeFormulaBase("a2", income);
          const bottlenecks = ["credits", "energy", "handSize"]
            .filter((key) => aiNumber(income[key]) <= currentBase);
          const lifted = bottlenecks.filter((key) => aiNumber(incomeGain[key]) > 0);
          if (lifted.length) {
            return total + (entry.potential ? 8 : 14) * Math.min(1, lifted.length / Math.max(1, bottlenecks.length));
          }
          return total - (entry.potential ? 1.5 : 4);
        }
        if (entry.formulaId === "a1") {
          const beforeBase = getAiIncomeFormulaBase("a1", income);
          const afterBase = getAiIncomeFormulaBase("a1", addAiIncomeGain(income, incomeGain));
          return total + Math.max(0, afterBase - beforeBase) * (entry.potential ? 2 : 4);
        }
        return total;
      }, 0);
    }

    function runAiPassReserveDecision() {
      if (!state.pendingPassReserveSelection) return null;
      const player = getPlayerById(state.pendingPassReserveSelection.playerId) || getCurrentPlayer();
      if (!isAiAutoBattlePlayer(player?.id)) {
        return { ok: false, blocked: true, message: `${player?.colorLabel || "当前玩家"}需要人工选择 PASS 预留牌` };
      }
      const pile = getPassReserveSelectionCards();
      const useDynamicPassReserve = getAiMarkedFinalFormulaEntries(player)
        .some((entry) => entry.formulaId === "c2");
      const ranked = useDynamicPassReserve
        ? (pile || [])
          .map((card) => ({ card, score: scoreAiPassReserveCard(card, player) }))
          .filter((entry) => entry.card && Number.isFinite(entry.score))
          .sort((left, right) => right.score - left.score)
        : [];
      const card = ranked[0]?.card || ai?.policy?.choosePassReserveCard?.(pile) || pile[0] || null;
      if (!card) return { ok: false, message: "PASS 预留牌堆为空" };
      selectPassReserveCard(card.id);
      recordAiAutoBattleLog("pass-reserve", `${player.colorLabel}AI 选择 PASS 预留牌`, {
        card,
        selectedScore: ranked.find((entry) => entry.card === card)?.score ?? null,
        candidates: ranked.slice(0, 5).map((entry) => ({
          cardId: entry.card.cardId || entry.card.id || null,
          cardLabel: cards.getCardLabel?.(entry.card) || entry.card.cardName || entry.card.label || null,
          typeCode: getCardTypeCode(entry.card),
          score: Math.round(entry.score * 1000) / 1000,
        })),
      });
      return confirmPassReserveSelection();
    }

    function countAiType3CardsForPlayer(player = getCurrentPlayer()) {
      if (endGameScoring?.countType3Cards) {
        return Math.max(0, Math.round(aiNumber(endGameScoring.countType3Cards(player, getCardTypeCode))));
      }
      return (player?.reservedCards || []).reduce((total, card) => total + (getCardTypeCode(card) === 3 ? 1 : 0), 0);
    }

    function scoreAiC2Type3ProgressValue(player = getCurrentPlayer()) {
      if (!player) return 0;
      const c2Entries = getAiMarkedFinalFormulaEntries(player)
        .filter((entry) => entry.formulaId === "c2");
      if (!c2Entries.length) return 0;
      const currentTotal = Math.max(0, Math.round(aiNumber(player.completedTaskCount)))
        + countAiType3CardsForPlayer(player);
      const beforeBase = Math.floor(currentTotal / 2);
      const afterBase = Math.floor((currentTotal + 1) / 2);
      return c2Entries.reduce((total, entry) => {
        const multiplier = Math.max(1, aiNumber(entry.multiplier));
        const immediate = Math.max(0, afterBase - beforeBase) * multiplier;
        return total + (immediate > 0 ? immediate * 0.9 : multiplier * 0.22);
      }, 0);
    }

    function scoreAiPassReserveCard(card, player = getCurrentPlayer()) {
      if (!card) return -Infinity;
      const model = cardEffects.getCardModel?.(card) || null;
      const playEffects = getAiPlayEffectsForCard(card);
      const typeCode = getCardTypeCode(card);
      const endGameExpectedScore = scoreAiCardEndGameExpectedValue(card, model, player);
      let value = Math.max(0, scoreAiPlayCardValue(card, {
        player,
        model,
        playEffects,
        typeCode,
        endGameExpectedScore,
      })) * 0.55;
      if (typeCode === 3) value += 4 + scoreAiC2Type3ProgressValue(player);
      if (model?.endGameScoring || endGameExpectedScore > 0) value += 2.5 + Math.min(8, endGameExpectedScore * 0.5);
      if (model?.tasks?.length) value += 1.5 + model.tasks.length * 1.2;
      const incomeGain = cards.getIncomeGainForCard?.(card);
      if (incomeGain) value += scoreAiIncomeOpportunityValue(player, incomeGain) * 0.18;
      return value + Math.max(0, 4 - aiNumber(getCardPrice(card))) * 0.25;
    }

    function scoreAiPublicPickCard(card, player = getCurrentPlayer(), pendingType = null) {
      if (!card) return -Infinity;
      const incomeGain = cards.getIncomeGainForCard?.(card) || null;
      const incomeValue = incomeGain ? scoreAiIncomeOpportunityValue(player, incomeGain) : 0;
      const cornerValue = scoreAiCardCornerOpportunity(card);
      if (pendingType === "industry_mission_pick") {
        return incomeGain?.handSize ? -Infinity : incomeValue;
      }
      if (pendingType === "industry_fenwick_pick") {
        const reward = industry?.getCornerReward?.(cards, card) || null;
        const rewardValue = scoreAiIndustryCornerReward(card, reward, {
          moveId: "industryFenwickMove",
        });
        return Number.isFinite(Number(rewardValue)) ? rewardValue + incomeValue * 0.15 : -Infinity;
      }
      const playableValue = Math.max(0, scoreAiPlayCardValue(card, {
        player,
        model: cardEffects.getCardModel?.(card) || null,
        playEffects: getAiPlayEffectsForCard(card),
        typeCode: getCardTypeCode(card),
      }));
      return playableValue * 0.75
        + cornerValue * 0.3
        + incomeValue * 0.2
        + (getCardTypeCode(card) === 3 ? 2 : 0);
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

      const selectedPublic = (cardState.publicCards || [])
        .map((card, slotIndex) => ({
          card,
          slotIndex,
          score: scoreAiPublicPickCard(card, player, pending.type || null),
        }))
        .filter((entry) => entry.card && Number.isFinite(Number(entry.score)))
        .sort((left, right) => Number(right.score || 0) - Number(left.score || 0) || left.slotIndex - right.slotIndex)[0] || null;
      if (selectedPublic) {
        recordAiAutoBattleLog("pick-card", `${player.colorLabel}AI 精选公共牌 ${selectedPublic.slotIndex + 1}`, {
          pendingType: pending.type || null,
          slotIndex: selectedPublic.slotIndex,
          score: selectedPublic.score,
          card: selectedPublic.card,
        });
        return pickPublicCardForCurrentPlayer(selectedPublic.slotIndex);
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
      if (!selected) {
        recordAiAutoBattleLog("hand-scan", `${player.colorLabel}AI 跳过无可用目标的手牌扫描`, {
          pendingType: pending.type || null,
        });
        skipCurrentActionEffect();
        return { ok: true, progressed: true, message: "AI 跳过无可用目标的手牌扫描" };
      }
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
      if (aiSeed?.hashSeed) return aiSeed.hashSeed(seed);
      const text = String(seed ?? "seti-ai");
      let hash = 2166136261;
      for (let index = 0; index < text.length; index += 1) {
        hash ^= text.charCodeAt(index);
        hash = Math.imul(hash, 16777619);
      }
      return hash >>> 0;
    }

    function createAiSeededRandom(seed) {
      if (aiSeed?.createSeededRandom) return aiSeed.createSeededRandom(seed);
      let state = hashAiSeed(seed);
      return function seededRandom() {
        state = (state + 0x6D2B79F5) >>> 0;
        let value = state;
        value = Math.imul(value ^ (value >>> 15), value | 1);
        value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
        return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
      };
    }

    function normalizeAiDifficulty(value) {
      const difficulty = String(value || "easy").toLowerCase();
      if (difficulty === "hard") return "expert";
      return AI_DIFFICULTY_PROFILES[difficulty] ? difficulty : "easy";
    }

    function getAiDifficultyProfile(difficulty = "easy") {
      return AI_DIFFICULTY_PROFILES[normalizeAiDifficulty(difficulty)] || AI_DIFFICULTY_PROFILES.easy;
    }

    function getAiDifficultyProfiles() {
      return Object.freeze({
        easy: getAiDifficultyProfile("easy"),
        normal: getAiDifficultyProfile("normal"),
        expert: getAiDifficultyProfile("expert"),
      });
    }

    function configureAiAutoBattleDifficulties(playerIds = [], options = {}) {
      const defaultDifficulty = normalizeAiDifficulty(
        options.defaultDifficulty
        || options.difficulty
        || aiAutoBattleState.defaultDifficulty
        || "easy",
      );
      const difficultyMap = {};
      const source = {
        ...(options.difficulties || {}),
        ...(options.playerDifficulties || {}),
      };
      for (const playerId of playerIds || []) {
        difficultyMap[playerId] = normalizeAiDifficulty(source[playerId] || defaultDifficulty);
      }
      aiAutoBattleState.defaultDifficulty = defaultDifficulty;
      aiAutoBattleState.playerDifficulties = difficultyMap;
      return {
        defaultDifficulty,
        playerDifficulties: { ...difficultyMap },
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

    function getAiResourceValuesForRound() {
      if (ai?.valuation?.getPhaseResourceValues) {
        return ai.valuation.getPhaseResourceValues(getAiRoundNumber(), {
          resourceValues: AI_RESOURCE_VALUES,
          earlyResourceValues: { credits: 5, energy: 5 },
        });
      }
      return getAiRoundNumber() <= 2
        ? {
          ...AI_RESOURCE_VALUES,
          credits: Math.max(AI_RESOURCE_VALUES.credits, 5),
          energy: Math.max(AI_RESOURCE_VALUES.energy, 5),
        }
        : AI_RESOURCE_VALUES;
    }

    function scoreAiResourceBundle(resources = {}, options = {}) {
      const values = options.resourceValues || getAiResourceValuesForRound();
      return Object.entries(resources || {}).reduce((total, [key, value]) => (
        total + aiNumber(value) * aiNumber(values[key])
      ), 0);
    }

    function getAiMovePaymentCards(player = getCurrentPlayer()) {
      return (player?.hand || []).filter((card) => isMovePaymentCard(card));
    }

    function getAiLaunchPaymentCost(options = {}) {
      return ai?.valuation?.getLaunchPaymentCost
        ? ai.valuation.getLaunchPaymentCost(options)
        : (options?.skipCost ? {} : (options?.cost || { credits: 2 }));
    }

    function scoreAiLaunchPaymentCost(options = {}) {
      return scoreAiResourceBundle(getAiLaunchPaymentCost(options));
    }

    function scoreAiMovePaymentCost(player = getCurrentPlayer(), requiredMovePoints = MOVE_ENERGY_COST) {
      if (ai?.valuation?.getMovePaymentCost) {
        return ai.valuation.getMovePaymentCost({
          player,
          hand: player?.hand || [],
          movePaymentCards: getAiMovePaymentCards(player),
          availableEnergy: player?.resources?.energy || 0,
          requiredMovePoints,
          resourceValues: getAiResourceValuesForRound(),
        });
      }
      const points = Math.max(0, Math.round(aiNumber(requiredMovePoints)));
      const values = getAiResourceValuesForRound();
      const energy = Math.max(0, Math.round(aiNumber(player?.resources?.energy)));
      const cardCount = getAiMovePaymentCards(player).length;
      let remainingEnergy = energy;
      let remainingCards = cardCount;
      let total = 0;
      for (let point = 0; point < points; point += 1) {
        if (remainingEnergy > 0 && (remainingCards <= 0 || values.energy <= values.handSize)) {
          total += values.energy;
          remainingEnergy -= 1;
        } else if (remainingCards > 0) {
          total += values.handSize;
          remainingCards -= 1;
        } else {
          total += values.energy;
        }
      }
      return total;
    }

    function countAiFinalMarksForPlayer(player = getCurrentPlayer()) {
      if (!player) return 0;
      if (!finalScoringState || typeof finalScoringState !== "object") return 0;
      if (typeof finalScoring?.ensureFinalScoringState === "function") {
        finalScoring.ensureFinalScoringState(finalScoringState);
      }
      return Object.values(finalScoringState.tiles || {})
        .reduce((total, tile) => (
          total + (tile?.marks || []).filter((mark) => (
            mark?.playerId === player.id || mark?.playerColor === player.color || mark?.color === player.color
          )).length
        ), 0);
    }

    function getAiActiveOpponentCount(player = getCurrentPlayer()) {
      if (!player) return 0;
      const activeIds = Array.isArray(turnState.activePlayerIds) && turnState.activePlayerIds.length
        ? turnState.activePlayerIds
        : (playerState.players || []).slice(0, Math.max(1, Math.round(aiNumber(turnState.activePlayerCount) || DEFAULT_ACTIVE_PLAYER_COUNT))).map((item) => item.id);
      return activeIds
        .filter((playerId) => playerId && playerId !== player.id)
        .length;
    }

    function getAiMarkedFinalFormulaEntries(player = getCurrentPlayer()) {
      if (!player || !endGameScoring?.getFormulaId || !finalScoring?.getTileVariant) return [];
      if (!finalScoringState || typeof finalScoringState !== "object") return [];
      if (typeof finalScoring?.ensureFinalScoringState === "function") {
        finalScoring.ensureFinalScoringState(finalScoringState);
      }
      return Object.values(finalScoringState.tiles || {}).flatMap((tile) => {
        const variant = finalScoring.getTileVariant(finalScoringState, tile.id);
        const formulaId = endGameScoring.getFormulaId(tile.id, variant);
        return (tile.marks || [])
          .filter((mark) => (
            mark?.playerId === player.id
            || mark?.playerColor === player.color
            || mark?.color === player.color
          ))
          .map((mark) => ({
            tileId: tile.id,
            variant,
            formulaId,
            slotIndex: mark.slotIndex,
            multiplier: endGameScoring.getSlotMultiplier(formulaId, mark.slotIndex),
            threshold: mark.threshold,
          }));
      });
    }

    function getAiIncomeFinalFormulaEntries(player = getCurrentPlayer()) {
      return getAiMarkedFinalFormulaEntries(player)
        .filter((entry) => entry.formulaId === "a1" || entry.formulaId === "a2");
    }

    function scoreAiThresholdPressureForScoreGain(scoreGain, player = getCurrentPlayer()) {
      const gain = Math.max(0, aiNumber(scoreGain));
      if (!gain || !player) return 0;
      const currentScore = Math.max(0, aiNumber(player.resources?.score));
      const finalMarks = countAiFinalMarksForPlayer(player);
      const nextThreshold = currentScore < 25
        ? 25
        : currentScore < 50
          ? 50
          : currentScore < 70
            ? 70
            : null;
      if (!nextThreshold) return 0;
      const distance = nextThreshold - currentScore;
      const afterScore = currentScore + gain;
      const thresholdValue = nextThreshold === 50 ? 16 : nextThreshold === 70 ? 12 : 8;
      let value = 0;
      if (afterScore >= nextThreshold) {
        value += thresholdValue;
      } else if (distance <= 12) {
        value += Math.min(gain, distance) * (nextThreshold === 50 ? 0.8 : 0.5);
        value += Math.max(0, 12 - distance) * 0.35;
      }
      if (finalMarks > 0 && nextThreshold === 50) value += Math.min(5, gain * 0.45);
      return value;
    }

    function getAiRemainingRoundWeight() {
      const round = Math.max(1, Math.round(aiNumber(turnState.roundNumber) || 1));
      return Math.max(1, FINAL_ROUND_NUMBER - round + 1);
    }

    function getAiRoundNumber() {
      return Math.max(1, Math.round(aiNumber(turnState.roundNumber) || 1));
    }

    function getAiEarlyEnginePressure(player = getCurrentPlayer()) {
      const round = getAiRoundNumber();
      let pressure = round <= 1 ? 1.45 : round === 2 ? 1.2 : round === 3 ? 0.75 : 0.25;
      const resources = player?.resources || {};
      if (aiNumber(resources.credits) <= 1) pressure += 0.18;
      if (aiNumber(resources.energy) <= 1) pressure += 0.18;
      if (Math.max(0, Math.round(aiNumber(resources.score))) < 25) pressure += 0.12;
      return Math.max(0, pressure);
    }

    function addAiIncomeGain(income = {}, gain = {}) {
      return {
        ...income,
        credits: aiNumber(income.credits) + aiNumber(gain.credits),
        energy: aiNumber(income.energy) + aiNumber(gain.energy),
        handSize: aiNumber(income.handSize) + aiNumber(gain.handSize),
      };
    }

    function getAiIncomeFormulaBase(formulaId, income = {}) {
      if (formulaId === "a1") {
        return Math.max(aiNumber(income.credits), aiNumber(income.energy));
      }
      if (formulaId === "a2") {
        return Math.min(aiNumber(income.credits), aiNumber(income.energy), aiNumber(income.handSize));
      }
      return 0;
    }

    function scoreAiMarkedIncomeFinalValue(player = getCurrentPlayer(), incomeGain = {}) {
      if (!player || !incomeGain || typeof incomeGain !== "object") return 0;
      const incomeFormulas = getAiIncomeFinalFormulaEntries(player);
      if (!incomeFormulas.length) return 0;

      const beforeIncome = player.income || {};
      const afterIncome = addAiIncomeGain(beforeIncome, incomeGain);
      return incomeFormulas.reduce((total, entry) => {
        const multiplier = Math.max(1, aiNumber(entry.multiplier));
        const beforeBase = getAiIncomeFormulaBase(entry.formulaId, beforeIncome);
        const afterBase = getAiIncomeFormulaBase(entry.formulaId, afterIncome);
        const immediateValue = Math.max(0, afterBase - beforeBase) * multiplier;
        const immediateWeight = entry.potential ? 0.55 : 0.95;
        if (entry.formulaId === "a1") return total + immediateValue * (entry.potential ? 0.45 : 0.85);
        if (immediateValue > 0) return total + immediateValue * immediateWeight;

        const incomeKeys = ["credits", "energy", "handSize"];
        const bottleneckKeys = incomeKeys.filter((key) => aiNumber(beforeIncome[key]) <= beforeBase);
        const liftedBottlenecks = bottleneckKeys.filter((key) => aiNumber(incomeGain[key]) > 0);
        if (!liftedBottlenecks.length) return total;
        const setupWeight = entry.potential
          ? (getAiRoundNumber() >= 3 ? 0.72 : 0.36)
          : (getAiRoundNumber() >= 3 ? 0.34 : 0.22);
        return total + multiplier * setupWeight * Math.min(1, liftedBottlenecks.length / Math.max(1, bottleneckKeys.length));
      }, 0);
    }

    function scoreAiIncomeOpportunityValue(player = getCurrentPlayer(), incomeGain = { credits: 1 }) {
      const gain = incomeGain && typeof incomeGain === "object" ? incomeGain : { credits: 1 };
      const netValue = ai?.valuation?.getIncomeNetValue
        ? ai.valuation.getIncomeNetValue(gain, {
          roundNumber: getAiRoundNumber(),
          hand: player?.hand || [],
          resourceValues: getAiResourceValuesForRound(),
        })
        : scoreAiResourceBundle(gain) * getAiRemainingRoundWeight();
      const earlyPressure = getAiEarlyEnginePressure(player);
      const resources = player?.resources || {};
      const creditNeed = aiNumber(gain.credits) > 0
        ? Math.max(0, 4 - aiNumber(resources.credits)) * (getAiRoundNumber() <= 2 ? 0.9 : 0.35)
        : 0;
      const earlyIncomeTargetBonus = getAiRoundNumber() <= 1
        ? Math.min(4, scoreAiResourceBundle(gain) * 0.45 + earlyPressure * 1.2)
        : getAiRoundNumber() === 2
          ? Math.min(2.5, scoreAiResourceBundle(gain) * 0.28 + earlyPressure * 0.6)
          : 0;
      const markedFinalValue = scoreAiMarkedIncomeFinalValue(player, gain);
      return Math.max(0, netValue + creditNeed + earlyIncomeTargetBonus + markedFinalValue);
    }

    function scoreAiPlacementBonusValue(bonus, player = getCurrentPlayer()) {
      if (!bonus) return 0;
      switch (bonus.type) {
        case "income":
          return scoreAiIncomeOpportunityValue(player, bonus.gain || bonus.income || { credits: 1 });
        case "publicity":
          return scoreAiResourceBundle({ publicity: bonus.publicity || 1 });
        case "score":
          return scoreAiResourceBundle({ score: bonus.score || 1 })
            + scoreAiThresholdPressureForScoreGain(bonus.score || 1, player);
        case "credits":
          return scoreAiResourceBundle({ credits: bonus.credits || 1 });
        case "energy":
          return scoreAiResourceBundle({ energy: bonus.energy || 1 });
        case "choose_card":
          return AI_RESOURCE_VALUES.handSize + 1;
        default:
          return 0;
      }
    }

    function scoreAiDataPlacementBonusValue(choice, player = getCurrentPlayer()) {
      if (!choice) return 0;
      const target = choice.target || null;
      if (target === data.PLACEMENT_KIND_COMPUTER) {
        const placementSlot = Math.max(0, Math.round(aiNumber(choice.placementSlot)));
        return scoreAiPlacementBonusValue(data.getComputerSlotBonus?.(placementSlot), player)
          + scoreAiPlacementBonusValue(data.getComputerSlotBlueColumnBonus?.(player, placementSlot), player);
      }
      if (target === data.PLACEMENT_KIND_BLUE_BONUS) {
        return scoreAiPlacementBonusValue(data.getBlueBonusPlacementReward?.(player, choice.blueSlot), player);
      }
      return 0;
    }

    function scoreAiDataEngineProgressValue(placementSlot, player = getCurrentPlayer()) {
      const slot = Math.max(0, Math.round(aiNumber(placementSlot)));
      if (!slot) return 0;
      const pressure = getAiEarlyEnginePressure(player);
      if (slot < 4) {
        return pressure * Math.max(0.4, 1.25 - slot * 0.2);
      }
      if (slot === 4) {
        return pressure * 0.75;
      }
      if (slot <= (data.ANALYZE_REQUIRED_COMPUTER_SLOT || 6)) {
        return pressure * 0.8;
      }
      return 0;
    }

    function scoreAiEarlyScanEngineValue(player = getCurrentPlayer()) {
      const round = getAiRoundNumber();
      const pressure = getAiEarlyEnginePressure(player);
      if (round > 3 && pressure < 0.5) return 0;
      const placedComputerCount = Math.max(0, (data.listComputerPlacedTokens?.(player) || []).length);
      const dataRoom = getAiAvailableDataRoom(player);
      let value = pressure * 5;
      if (placedComputerCount < 4) value += Math.max(0, 4 - placedComputerCount) * 0.9 * pressure;
      if (dataRoom > 0) value += Math.min(2.5, dataRoom * 0.45) * Math.max(0.6, pressure);
      if (countAiFinalMarksForPlayer(player) === 0) value += pressure * 1.4;
      if (placedComputerCount >= 4) value *= round <= 2 ? 0.4 : 0.24;
      return value;
    }

    function countAiTraceMarkersForPlayer(player = getCurrentPlayer()) {
      if (!endGameScoring?.countTraceMarkers || !player) return 0;
      return AI_TRACE_TYPES.reduce((total, traceType) => (
        total + Math.max(0, Math.round(aiNumber(endGameScoring.countTraceMarkers(player, alienGameState, traceType))))
      ), 0);
    }

    function scoreAiAlienTraceValue(options = {}) {
      const picker = state.alienTracePickerState || {};
      return ai?.valuation?.estimateAlienTraceValue
        ? ai.valuation.estimateAlienTraceValue({
          alienGameState,
          player: options.player || getCurrentPlayer(),
          traceType: options.traceType || picker.selectedTraceType || picker.allowedTraceTypes?.[0],
          alienSlotId: options.alienSlotId ?? picker.selectedAlienSlotId,
          mode: options.mode || picker.mode,
          position: options.position,
          label: options.label,
          reward: options.reward,
          activeOpponentCount: getAiActiveOpponentCount(options.player || getCurrentPlayer()),
          competition: true,
        })
        : 5;
    }

    function scoreAiScanPriorityFloor(player = getCurrentPlayer()) {
      const round = getAiRoundNumber();
      if (round > 3) return 0;
      const demand = getAiStrategyDemand(player);
      const placedComputerCount = Math.max(0, (data.listComputerPlacedTokens?.(player) || []).length);
      const dataRoom = getAiAvailableDataRoom(player);
      const traceCount = countAiTraceMarkersForPlayer(player);
      const scanDemand = getAiMapDemand(demand.actions, "scan")
        + sumAiDemandMap(demand.scanColors) * 0.35
        + sumAiDemandMap(demand.traceTypes) * 0.22;
      let floor = round === 1 ? 5.5 : round === 2 ? 4 : 2.5;
      if (placedComputerCount < 4) floor += Math.max(0, 4 - placedComputerCount) * 0.55;
      if (dataRoom > 0) floor += Math.min(1.6, dataRoom * 0.25);
      if (traceCount === 0) floor += 1.5;
      else if (traceCount < 2) floor += 0.7;
      floor += Math.min(2.5, scanDemand * 0.05);
      return Math.max(0, floor);
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
      if (incomeGain) value += scoreAiIncomeOpportunityValue(getCurrentPlayer(), incomeGain);
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
        case "gain_resources": {
          const gain = effectOptions.gain || {};
          return scoreAiResourceBundle(gain)
            + scoreAiThresholdPressureForScoreGain(gain.score, options.player || getCurrentPlayer());
        }
        case planetRewards.EFFECT_TYPES?.GAIN_DATA:
        case "gain_data":
          return Math.max(0, Math.round(aiNumber(effectOptions.count || 1))) * AI_RESOURCE_VALUES.availableData;
        case planetRewards.EFFECT_TYPES?.INCOME:
        case "income":
          return scoreAiIncomeOpportunityValue(
            options.player || getCurrentPlayer(),
            effectOptions.gain || effectOptions.income || { credits: 1 },
          );
        case planetRewards.EFFECT_TYPES?.ALIEN_TRACE:
        case "alien_trace":
          return scoreAiAlienTraceValue({
            player: options.player || getCurrentPlayer(),
            traceType: effectOptions.traceType || effectOptions.traceTypes?.[0],
            alienSlotId: effectOptions.alienSlotId,
          });
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
        case "card_color_scan":
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
        case amiba?.EFFECT_TYPES?.CHOOSE_SYMBOL_REWARD:
          return 5;
        case amiba?.EFFECT_TYPES?.REMOVE_TRACE_FOR_REGION_REWARD:
          return 4;
        case runezu?.EFFECT_TYPES?.SYMBOL_REWARD:
          return 5;
        case runezu?.EFFECT_TYPES?.SYMBOL_BRANCH:
          return 7;
        case aomomo?.EFFECT_GAIN_FOSSILS:
          return Math.max(1, Math.round(aiNumber(effectOptions.count || 1))) * 3;
        case aomomo?.EFFECT_SCAN_AOMOMO_X:
        case aomomo?.EFFECT_SCAN_AOMOMO_X_GAIN_FOSSIL:
        case aomomo?.EFFECT_SCAN_AOMOMO_X_SCORE:
          return 5 + Math.max(0, aiNumber(effectOptions.score || 0));
        case aomomo?.EFFECT_LAND_SCORE_IF_AOMOMO:
        case "aomomo_land_only":
          return 8 + Math.max(0, aiNumber(effectOptions.score || 0));
        case aomomo?.EFFECT_FOSSIL_FOR_DATA:
          return effectOptions.optional ? 2.5 : 4;
        case aomomo?.EFFECT_FOSSIL_FOR_MOVE_AND_LAND:
          return 6;
        case aomomo?.EFFECT_FOSSIL_FOR_ANY_SCAN:
          return 4;
        case aomomo?.EFFECT_SPEND_FOSSILS_GAIN_SCORE:
          return Math.max(4, aiNumber(effectOptions.score || 0));
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

    function aiMarkerBelongsToPlayer(marker, player) {
      if (!marker || !player) return false;
      const ids = new Set([player.id, player.playerId].filter(Boolean).map(String));
      const colors = new Set([player.color, player.playerColor].filter(Boolean).map(String));
      return [marker.playerId, marker.ownerPlayerId, marker.id].filter(Boolean)
        .some((value) => ids.has(String(value)))
        || [marker.color, marker.playerColor, marker.ownerPlayerColor].filter(Boolean)
          .some((value) => colors.has(String(value)));
    }

    function countAiLandingMarkers(player) {
      if (!player) return 0;
      return Object.values(planetStatsState?.planets || {}).reduce((total, record) => (
        total
        + (record?.landingMarkers || []).filter((marker) => aiMarkerBelongsToPlayer(marker, player)).length
        + (record?.satelliteLandings || []).filter((marker) => aiMarkerBelongsToPlayer(marker, player)).length
      ), 0);
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
          addAiActionDemand(demand, "orbit", amount * 1.6);
          addAiActionDemand(demand, "land", amount * 1.6);
          addAiActionDemand(demand, "move", amount * 0.75);
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
        case "landingCount": {
          const missing = getAiMissingCount(countAiLandingMarkers(player), condition.count || 1);
          const pressure = Math.max(1, missing);
          addAiActionDemand(demand, "land", amount * 1.35 * pressure);
          addAiActionDemand(demand, "move", amount * 0.55 * pressure);
          break;
        }
        case "orbitOrLandCount": {
          const missing = getAiMissingCount(
            endGameScoring.countOrbitOrLandMarkers(player, planetStatsState),
            condition.count || 1,
          );
          const pressure = Math.max(1, missing);
          addAiActionDemand(demand, "orbit", amount * 0.85 * pressure);
          addAiActionDemand(demand, "land", amount * 0.85 * pressure);
          addAiActionDemand(demand, "move", amount * 0.45 * pressure);
          break;
        }
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
        || type === "card_color_scan"
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
      if (!finalScoringState || typeof finalScoringState !== "object") {
        void context;
        return;
      }
      if (typeof finalScoring?.ensureFinalScoringState === "function") {
        finalScoring.ensureFinalScoringState(finalScoringState);
      }
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
      const context = Object.assign(createActionContext(), {
        finalScoringState,
        cardEffects,
        getCardTypeCode,
      });
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
        || type === cardEffects.EFFECT_TYPES.SCAN_COLOR_CHOICE
        || type === "card_color_scan";
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
      const context = Object.assign(createActionContext(), {
        finalScoringState,
        cardEffects,
        getCardTypeCode,
      });
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

    function scoreAiCardStandardActionPremium(playEffects = [], player = getCurrentPlayer()) {
      return (playEffects || []).reduce((total, effect) => {
        const type = effect?.type;
        if (type === "launch") {
          const standardCost = scoreAiLaunchPaymentCost();
          const actualCost = scoreAiLaunchPaymentCost(effect?.options || {});
          const savedCost = Math.max(0, standardCost - actualCost);
          return total + Math.max(2, savedCost + Math.max(0, scoreAiLaunchAction(player)) * 0.12);
        }
        if (type === cardEffects.EFFECT_TYPES.CARD_MOVE || type === cardEffects.EFFECT_TYPES.FREE_MOVE) {
          const movementPoints = Math.max(1, Math.round(aiNumber(effect.options?.movementPoints || 1)));
          const savedCost = scoreAiMovePaymentCost(player, movementPoints);
          return total + Math.max(1.5, savedCost + movementPoints * 0.35);
        }
        if (type === cardEffects.EFFECT_TYPES.CARD_ORBIT) {
          const standardCost = scoreAiResourceBundle(abilities.planet?.DEFAULT_ORBIT_COST || { credits: 1, energy: 1 });
          const actualCost = effect?.options?.cost ? scoreAiResourceBundle(effect.options.cost) : 0;
          return total + Math.max(3, Math.max(0, standardCost - actualCost) + scoreAiOrbitAction({ available: true }) * 0.18);
        }
        if (type === cardEffects.EFFECT_TYPES.CARD_LAND || type === "aomomo_land_only") {
          const standardCost = scoreAiResourceBundle({ energy: abilities.planet?.BASE_LAND_ENERGY_COST || 3 });
          const actualCost = effect?.options?.cost ? scoreAiResourceBundle(effect.options.cost) : 0;
          return total + Math.max(4, Math.max(0, standardCost - actualCost) + scoreAiLandAction({ available: true }) * 0.18);
        }
        if (
          type === cardEffects.EFFECT_TYPES.PUBLIC_SCAN
          || type === cardEffects.EFFECT_TYPES.HAND_SCAN
          || type === cardEffects.EFFECT_TYPES.SECTOR_X_SCAN
          || type === cardEffects.EFFECT_TYPES.PLANET_SECTOR_SCAN
          || type === cardEffects.EFFECT_TYPES.SCAN_COLOR_CHOICE
          || type === cardEffects.EFFECT_TYPES.CONDITIONAL_SECTOR_SCAN
          || type === cardEffects.EFFECT_TYPES.CHOOSE_NEBULA_SCAN
          || type === cardEffects.EFFECT_TYPES.SCAN_ACTION
          || type === "card_color_scan"
        ) {
          return total + Math.max(2.5, scoreAiScanPriorityFloor(player) * 0.3);
        }
        if (type === "research_tech_select" || type === cardEffects.EFFECT_TYPES.RESEARCH_TECH) return total + 3;
        return total;
      }, 0);
    }

    function scoreAiPlayCardValue(card, details = {}) {
      const player = details.player || getCurrentPlayer();
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
      const standardActionPremium = scoreAiCardStandardActionPremium(playEffects);
      const c2Type3ProgressValue = typeCode === 3 ? scoreAiC2Type3ProgressValue(player) : 0;
      return effectValue
        + reserveValue
        + endGameValue
        + plutoValue
        + demandFit
        + standardActionPremium
        + applyAiStrategyWeight(c2Type3ProgressValue, "final", 0.85)
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

    function scoreAiRewardEffects(effects = [], player = getCurrentPlayer()) {
      return (effects || []).reduce((total, effect) => (
        total + scoreAiEffectValue(effect, { player })
      ), 0);
    }

    function scoreAiOrbitRewardValue(planetId, player = getCurrentPlayer()) {
      if (!planetId) return 0;
      const sequence = Math.max(1, planetStats.getPlanetOrbitCount(planetStatsState, planetId) + 1);
      return scoreAiRewardEffects(planetRewards.buildOrbitRewardEffects?.(planetId, sequence) || [], player);
    }

    function scoreAiLandRewardValueForTarget(planetId, target = { type: "planet" }, player = getCurrentPlayer()) {
      if (!planetId || !target) return 0;
      if (target.type === "satellite") {
        return scoreAiRewardEffects(
          planetRewards.buildSatelliteLandRewardEffects?.(target.satelliteId) || [],
          player,
        );
      }
      if (planetId === "pluto") {
        return scoreAiRewardEffects([
          { type: "gain_resources", options: { gain: { score: 11 } } },
          { type: "gain_data", options: { count: 4 } },
          { type: "alien_trace", options: { traceType: "yellow" } },
        ], player);
      }
      const sequence = Math.max(1, planetStats.getPlanetLandingCount(planetStatsState, planetId) + 1);
      return scoreAiRewardEffects(planetRewards.buildPlanetLandRewardEffects?.(planetId, sequence) || [], player);
    }

    function getAiReservedEndGameRules(player = getCurrentPlayer()) {
      return (player?.reservedCards || [])
        .map((card) => cardEffects.getCardModel?.(card)?.endGameScoring || null)
        .filter(Boolean);
    }

    function countAiMainLandingMarkersOnPlanet(player, planetId) {
      const record = planetStatsState?.planets?.[planetId];
      if (!record || !player) return 0;
      return (record.landingMarkers || [])
        .filter((marker) => aiMarkerBelongsToPlayer(marker, player))
        .length;
    }

    function scoreAiFinalTileOrbitLandMarginal(player = getCurrentPlayer()) {
      if (!player || !endGameScoring?.countOrbitOrLandMarkers || !endGameScoring?.countSectorWins) return 0;
      let value = 0;
      if (!finalScoringState || typeof finalScoringState !== "object") return 0;
      if (typeof finalScoring?.ensureFinalScoringState === "function") {
        finalScoring.ensureFinalScoringState(finalScoringState);
      }
      const currentOrbitLand = endGameScoring.countOrbitOrLandMarkers(player, planetStatsState, createActionContext());
      const sectorWins = endGameScoring.countSectorWins(player, nebulaDataState);
      if (currentOrbitLand >= sectorWins) return 0;
      for (const tile of Object.values(finalScoringState.tiles || {})) {
        const mark = (tile.marks || []).find((entry) => entry.playerId === player.id);
        if (!mark) continue;
        const variant = finalScoring.getTileVariant(finalScoringState, tile.id);
        const formulaId = endGameScoring.getFormulaId(tile.id, variant);
        if (formulaId !== "b2") continue;
        value += endGameScoring.getSlotMultiplier(formulaId, mark.slotIndex) * 0.75;
      }
      return value;
    }

    function scoreAiPlanetMarkerEndGameValue(planetId, player = getCurrentPlayer(), options = {}) {
      if (!planetId || !player) return 0;
      const markerKind = options.markerKind || "orbitOrLand";
      const target = options.target || null;
      let value = scoreAiFinalTileOrbitLandMarginal(player);
      for (const rule of getAiReservedEndGameRules(player)) {
        const scorePer = Math.max(0, aiNumber(rule.scorePer));
        if (!scorePer) continue;
        if (rule.kind === "planetOrbitOrLand" && rule.planetId === planetId) {
          value += scorePer;
        } else if (rule.kind === "allOrbitOrLand") {
          value += scorePer;
        } else if (
          rule.kind === "planetLandingPairs"
          && markerKind === "land"
          && target?.type !== "satellite"
        ) {
          const required = Math.max(1, Math.round(aiNumber(rule.count || 2)));
          const currentLandings = countAiMainLandingMarkersOnPlanet(player, planetId);
          if (currentLandings === required - 1) value += scorePer;
          else if (currentLandings < required - 1) value += scorePer * 0.35;
        }
      }
      return value;
    }

    function scoreAiLandChoice(choice, player = getCurrentPlayer()) {
      if (!choice) return -Infinity;
      const planetId = choice.planet?.planetId || choice.target?.planetId || null;
      const rewardValue = scoreAiLandRewardValueForTarget(planetId, choice.target, player);
      const energyCost = Math.max(0, aiNumber(choice.energyCost ?? choice.cost?.energy));
      const demand = getAiStrategyDemand(player);
      const planetDemand = getAiMapDemand(demand.planetIds, planetId);
      const satelliteBonus = choice.target?.type === "satellite" ? 2 : 0;
      return rewardValue
        + scoreAiPlanetMarkerEndGameValue(planetId, player, {
          markerKind: choice.target?.type === "satellite" ? "satellite" : "land",
          target: choice.target,
        }) * getAiStrategyWeight("final")
        + planetDemand * 0.7 * getAiStrategyWeight("route")
        + getAiMapDemand(demand.actions, "land") * 0.26 * getAiStrategyWeight("orbitLand")
        + satelliteBonus
        - energyCost * getAiResourceValuesForRound(player).energy * 0.3;
    }

    function chooseAiLandChoice(choices = [], player = getCurrentPlayer()) {
      return (choices || [])
        .map((choice, index) => ({
          choice,
          index,
          score: scoreAiLandChoice(choice, player),
        }))
        .filter((entry) => Number.isFinite(Number(entry.score)))
        .sort((left, right) => right.score - left.score || left.index - right.index)[0] || null;
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
      value += scoreAiPlanetMarkerEndGameValue(planet.planetId, player, { markerKind: "orbitOrLand" })
        * 0.9
        * getAiStrategyWeight("final");
      value += planetDemand * 1.1 * getAiStrategyWeight("route");
      value += Math.min(6, (
        getAiMapDemand(demand.actions, "orbit")
        + getAiMapDemand(demand.actions, "land")
      ) * 0.1 * getAiStrategyWeight("orbitLand"));
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

    function getAiDisplayedTurnNumber(rawTurnNumber = turnState.turnNumber) {
      const activePlayerCount = Math.max(
        1,
        (turnState.activePlayerIds || []).length
          || Math.round(Number(turnState.activePlayerCount) || 0)
          || DEFAULT_ACTIVE_PLAYER_COUNT,
      );
      const raw = Math.max(1, Math.round(Number(rawTurnNumber) || 1));
      return Math.floor((raw - 1) / activePlayerCount) + 1;
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

    function scoreAiMovementPathPenalty(options = {}) {
      const requiredMovePoints = Math.max(0, Math.round(aiNumber(options.requiredMovePoints ?? options.terrainRequired ?? 1)));
      const routeTarget = options.routeScore?.target || null;
      const followupScore = Math.max(0, aiNumber(options.followupScore));
      const direction = options.direction || {};
      let penalty = 0;

      if (requiredMovePoints > 1) {
        penalty += (requiredMovePoints - 1) * (getAiRoundNumber() <= 2 ? 1.25 : 0.75);
      }

      if (!routeTarget && followupScore <= 0) {
        penalty += 3;
      }

      if (routeTarget) {
        const oldDistance = aiNumber(routeTarget.oldDistance);
        const newDistance = aiNumber(routeTarget.newDistance);
        if (newDistance > oldDistance) {
          penalty += (newDistance - oldDistance) * (getAiRoundNumber() <= 2 ? 4 : 3);
          penalty += Math.min(5, aiNumber(routeTarget.value) * 0.2);
        }
        if (newDistance >= 5 && followupScore <= 0) {
          penalty += Math.min(5, (newDistance - 4) * 0.9);
        }
      }

      const movesTowardTarget = routeTarget && aiNumber(routeTarget.newDistance) < aiNumber(routeTarget.oldDistance);
      if (direction.deltaY < 0 && !movesTowardTarget && followupScore <= 0) {
        penalty += getAiRoundNumber() <= 2 ? 2.5 : 1.5;
      }

      return Math.max(0, penalty);
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
      return getAiLaunchPaymentCost(effect?.options || {});
    }

    function getAiRocketLimitAfterResearch(candidate, player = getCurrentPlayer()) {
      const context = createActionContext();
      const currentLimit = abilities.rocket.getRocketLimitForPlayer(player, context);
      const risks = getAiResearchTechLaunchRisks(candidate, player);
      if (risks.includesImmediateTechLaunch) return currentLimit;
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
        includesImmediateTechLaunch: Boolean(!selectionOptions.skipBonus && candidate?.tileId === "orange1"),
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
      const desiredRocketCount = Math.min(rocketLimit, getAiRoundNumber() <= 2 ? 2 : 3);
      const lowRocketBonus = Math.max(0, desiredRocketCount - rocketCount) * 4;
      const postSecondFinalMarkPenalty = countAiFinalMarksForPlayer(player) >= 2 && rocketCount >= 2 ? 5 : 0;
      return 8
        + (rocketCount === 0 ? 7 : 0)
        + lowRocketBonus
        + getAiMapDemand(demand.actions, "launch") * 0.28 * getAiStrategyWeight("route")
        + Math.min(3, routeDemand * 0.08 * getAiStrategyWeight("route"))
        - postSecondFinalMarkPenalty;
    }

    function scoreAiLateLaunchDeadEndPenalty(player = getCurrentPlayer(), postLaunchMovePlan = null) {
      const round = getAiRoundNumber();
      if (round < 3) return 0;
      if (Number(postLaunchMovePlan?.score || 0) >= 5) return 0;
      const rocketCount = getMovableTokensForPlayer(player?.id).length;
      if (rocketCount === 0) return round >= FINAL_ROUND_NUMBER ? 4 : 2;
      const demand = getAiStrategyDemand(player);
      const routeDemand = getAiTotalRouteDemand(demand);
      const planetDemand = sumAiDemandMap(demand.planetIds);
      const orbitLandDemand = getAiMapDemand(demand.actions, "orbit") + getAiMapDemand(demand.actions, "land");
      if (routeDemand + planetDemand + orbitLandDemand >= 30 && Number(postLaunchMovePlan?.score || 0) > 0) {
        return 4;
      }
      const currentScore = Math.max(0, aiNumber(player?.resources?.score));
      const firstThresholdCatchup = round >= FINAL_ROUND_NUMBER && currentScore < 25;
      return round >= FINAL_ROUND_NUMBER
        ? (firstThresholdCatchup ? 18 : 14)
        : 8;
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
          const movementGain = applyAiStrategyWeight(applyAiStrategyWeight(routeScore.score, "route", 0.7), "move", 0.8)
            + direction.score * 0.08;
          const paymentCost = scoreAiMovePaymentCost(player, requiredMovePoints);
          const pathPenalty = scoreAiMovementPathPenalty({
            player,
            from,
            to,
            direction,
            requiredMovePoints,
            routeScore,
          });
          const movementCost = paymentCost + pathPenalty;
          const score = movementGain - movementCost;
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
            gain: movementGain,
            cost: movementCost,
            score,
            paymentCost,
            pathPenalty,
          };
        })
        .filter(Boolean)
        .sort((left, right) => right.score - left.score);
      return candidates[0] || null;
    }

    function scoreAiOrbitAction(candidate) {
      if (!candidate?.available) return 0;
      const demand = getAiStrategyDemand(getCurrentPlayer());
      const currentPlayer = getCurrentPlayer();
      const round = getAiRoundNumber();
      const rewardValue = scoreAiOrbitRewardValue(candidate.planetId, currentPlayer);
      const finalRoundLowScore = round >= FINAL_ROUND_NUMBER
        && Math.max(0, aiNumber(currentPlayer?.resources?.score)) < 25;
      const catchupRewardValue = finalRoundLowScore
        ? rewardValue * 0.6
        : 0;
      return 10
        + (candidate.planetId === "jupiter" ? 2 : 0)
        + catchupRewardValue
        + scoreAiPlanetMarkerEndGameValue(candidate.planetId, currentPlayer, { markerKind: "orbit" })
          * getAiStrategyWeight("final")
        + getAiMapDemand(demand.planetIds, candidate.planetId) * 0.8 * getAiStrategyWeight("route")
        + getAiMapDemand(demand.actions, "orbit") * 0.32 * getAiStrategyWeight("orbitLand")
        - scoreAiResourceBundle(abilities.planet.DEFAULT_ORBIT_COST) * 0.45;
    }

    function scoreAiLandAction(candidate) {
      if (!candidate?.available) return 0;
      const energyCost = Math.max(0, Math.round(aiNumber(candidate.energyCost)));
      const currentPlayer = getCurrentPlayer();
      const demand = getAiStrategyDemand(currentPlayer);
      const round = getAiRoundNumber();
      const currentScore = Math.max(0, aiNumber(currentPlayer?.resources?.score));
      const finalRoundLowScore = round >= FINAL_ROUND_NUMBER && currentScore < 25;
      const bestChoice = finalRoundLowScore ? chooseAiLandChoice(candidate.choices || [], currentPlayer) : null;
      const catchupRewardValue = finalRoundLowScore
        ? (bestChoice?.score ?? scoreAiLandRewardValueForTarget(candidate.planetId, { type: "planet" }, currentPlayer)) * 0.65
        : 0;
      return 12
        + (candidate.planetId === "mars" || candidate.planetId === "venus" ? 1.5 : 0)
        + catchupRewardValue
        + scoreAiPlanetMarkerEndGameValue(candidate.planetId, currentPlayer, { markerKind: "land" })
          * getAiStrategyWeight("final")
        + getAiMapDemand(demand.planetIds, candidate.planetId) * 0.85 * getAiStrategyWeight("route")
        + getAiMapDemand(demand.actions, "land") * 0.38 * getAiStrategyWeight("orbitLand")
        - energyCost * getAiResourceValuesForRound(currentPlayer).energy * 0.35;
    }

    function scoreAiAnalyzeAction(player = getCurrentPlayer()) {
      const check = data.canAnalyzeData?.(player);
      if (!check?.ok) return 0;
      const placedCount = Math.max(0, (data.listComputerPlacedTokens?.(player) || []).length);
      const dataRoom = getAiAvailableDataRoom(player);
      const demand = getAiStrategyDemand(player);
      const blueTraceDemand = getAiMapDemand(demand.traceTypes, "blue");
      const lateRoundPressure = Math.max(0, turnState.roundNumber - 1) * 1.5;
      const fullComputerBonus = placedCount >= (data.ANALYZE_REQUIRED_COMPUTER_SLOT || 6) ? 8 : 0;
      const finalMarks = countAiFinalMarksForPlayer(player);
      const currentScore = Math.max(0, aiNumber(player?.resources?.score));
      const firstThresholdCatchupBonus = Math.max(1, Math.round(aiNumber(turnState.roundNumber) || 1)) >= FINAL_ROUND_NUMBER
        && currentScore < 25
        ? 8
        : 0;
      const postSecondFinalMarkPenalty = finalMarks >= 2 && dataRoom <= 1 && blueTraceDemand < 1
        ? 5
        : 0;
      return applyAiStrategyWeight(
        7
          + placedCount * 1.15
          + fullComputerBonus * 0.8
          + Math.min(4, dataRoom * 0.55)
          + blueTraceDemand * 0.6 * getAiStrategyWeight("task")
          + getAiMapDemand(demand.actions, "analyze") * 0.2 * getAiStrategyWeight("engine")
          + lateRoundPressure
          + firstThresholdCatchupBonus
          - (data.ANALYZE_ENERGY_COST || 1) * getAiResourceValuesForRound(player).energy * 0.35
          - postSecondFinalMarkPenalty,
        "task",
        0.5,
      );
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
      value += getAiMapDemand(demand.traceTypes, "pink") * 0.22 * getAiStrategyWeight("scan");

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

    function parseAiButtonCount(text = "") {
      const match = String(text || "").match(/(\d+)/);
      return match ? Math.max(0, Number(match[1]) || 0) : 0;
    }

    function scoreAiHandCornerChoiceButton(button) {
      if (!button || button.disabled) return -Infinity;
      const choice = String(button.dataset.handCornerChoice || "");
      const count = parseAiButtonCount(button.textContent || "");
      if (choice === "move") {
        return count * Number(AI_RESOURCE_VALUES.movement || 1.5);
      }
      if (choice === "data") {
        return count * Number(AI_RESOURCE_VALUES.availableData || 1.5);
      }
      if (choice === "publicity") {
        return count * Number(AI_RESOURCE_VALUES.publicity || 1.5);
      }
      return -Infinity;
    }

    function scoreAiRemovePlanetMarkerButton(button, currentPlayer) {
      if (!button || button.disabled) return -Infinity;
      const text = String(button.textContent || "");
      const ownLabel = String(currentPlayer?.colorLabel || "");
      const ownColor = String(currentPlayer?.color || "");
      const ownPenalty = (ownLabel && text.includes(ownLabel)) || (ownColor && text.includes(ownColor)) ? 2 : 0;
      const landBonus = /登陆|卫星/.test(text) ? 0.6 : 0;
      const orbitBonus = /环绕/.test(text) ? 0.45 : 0;
      return 1 + landBonus + orbitBonus - ownPenalty;
    }

    function scoreAiDiscardIncomeCardButton(button, currentPlayer) {
      if (!button || button.disabled) return -Infinity;
      const cardId = button.dataset.discardIncomeCardId;
      const card = (currentPlayer?.hand || []).find((item) => item?.id === cardId) || null;
      if (!card) return -Infinity;
      const incomeGain = cards.getIncomeGainForCard?.(card) || null;
      const incomeValue = incomeGain ? scoreAiIncomeOpportunityValue(currentPlayer, incomeGain) : 0;
      const holdValue = Math.max(0, scoreAiPlayCardValue(card, { player: currentPlayer })) * 0.25;
      const cornerHold = scoreAiCardCornerOpportunity(card) * 0.2;
      return incomeValue - holdValue - cornerHold;
    }

    function scoreAiDiscardCornerRepeatButton(button, currentPlayer) {
      if (!button || button.disabled) return -Infinity;
      const cardId = button.dataset.discardCornerCardId;
      const card = (currentPlayer?.hand || []).find((item) => item?.id === cardId) || null;
      if (!card) return -Infinity;
      const cornerValue = scoreAiCardCornerOpportunity(card);
      const keepValue = Math.max(0, scoreAiPlayCardValue(card, { player: currentPlayer })) * 0.3;
      return cornerValue - keepValue;
    }

    function scoreAiProbeSectorButton(button, currentPlayer) {
      if (!button || button.disabled) return -Infinity;
      const text = String(button.textContent || "");
      const sectorMatch = text.match(/扇区\s*(\d+)/);
      if (!sectorMatch) return 0;
      const sectorX = solar.mod8(Number(sectorMatch[1]) || 0);
      return getBestAiNebulaChoiceScore(buildSectorScanChoicesForX(sectorX), {
        player: currentPlayer,
        pendingType: "probe_sector_scan",
      });
    }

    function scoreAiProbeLocationRewardButton(button) {
      if (!button || button.disabled) return -Infinity;
      return parseAiButtonCount(button.textContent || "") * Number(AI_RESOURCE_VALUES.availableData || 1.5);
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
      const earlyEngineValue = scoreAiEarlyScanEngineValue(player);
      const demand = getAiStrategyDemand(player);
      const tracePressure = Math.min(3, sumAiDemandMap(demand.traceTypes) * 0.05);
      const costMultiplier = getAiRoundNumber() <= 2 ? 0.62 : getAiRoundNumber() === 3 ? 0.68 : 0.7;
      return applyAiStrategyWeight(value + earlyEngineValue * 0.55 + tracePressure, "scan", 0.85)
        - costValue * costMultiplier;
    }

    function getAiPlayEffectsForCard(card) {
      if (banrenma?.isBanrenmaCard?.(card)) return banrenma.buildImmediateEffects?.(card) || [];
      if (amiba?.isAmibaCard?.(card)) return amiba.buildImmediateEffects?.(card) || [];
      if (aomomo?.isAomomoCard?.(card)) return aomomo.buildImmediateEffects?.(card) || [];
      if (runezu?.isRunezuCard?.(card)) return runezu.buildImmediateEffects?.(card) || [];
      return cardEffects.buildPlayEffects?.(card) || [];
    }

    function isAiAlienMainPlayCard(card) {
      return Boolean(
        banrenma?.isBanrenmaCard?.(card)
        || amiba?.isAmibaCard?.(card)
        || aomomo?.isAomomoCard?.(card)
        || runezu?.isRunezuCard?.(card),
      );
    }

    function doesAiCardReserveAfterPlay(card, typeCode, model) {
      if (banrenma?.isBanrenmaCard?.(card)) return true;
      return [1, 2, 3].includes(typeCode) || Boolean(model?.reserveAfterPlay);
    }

    function isAiSupportedHandPlayCard(card) {
      if (!card) return false;
      if (fangzhou?.isFangzhouCard2?.(card)) return false;
      if (chong?.isChongCard?.(card)) return false;
      return true;
    }

    function canAiResolvePlayCardEffects(playEffects = []) {
      const context = createActionContext();
      const unsupportedTypes = new Set([
        "alien_trace",
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
          effect?.type === aomomo?.EFFECT_LAND_SCORE_IF_AOMOMO
          || effect?.type === "aomomo_land_only"
        ) {
          const options = abilities.planet.getLandOptions(context, {
            ...(effect.options || {}),
            skipCost: true,
            target: { type: "planet" },
          });
          if (!options.ok) return { ok: false, message: options.message || "当前不能执行奥陌陌登陆" };
        }
        if (effect?.type === aomomo?.EFFECT_FOSSIL_FOR_MOVE_AND_LAND) {
          const currentPlayer = getCurrentPlayer();
          const fossilCost = Math.max(1, Math.round(aiNumber(effect.options?.cost) || 1));
          if (!players.canAfford(currentPlayer, { aomomoFossils: fossilCost })) continue;
          const moveCandidates = listAiEffectMoveCandidates({
            id: "cardMove",
            effect: {
              ...effect,
              type: cardEffects.EFFECT_TYPES.CARD_MOVE,
              options: { movementPoints: Math.max(1, Math.round(aiNumber(effect.options?.movement) || 2)) },
            },
            poolRemaining: Math.max(1, Math.round(aiNumber(effect.options?.movement) || 2)),
            nextEffect: { type: "aomomo_land_only", options: { skipCost: true, target: { type: "planet" } } },
          });
          if (!moveCandidates.length) return { ok: false, message: "当前不能执行奥陌陌移动登陆" };
        }
        if (
          effect?.type === "research_tech_select"
          || effect?.type === cardEffects.EFFECT_TYPES.RESEARCH_TECH
        ) {
          if (!listAiResearchTechCandidates(effect.options || null).length) {
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
        if (effect?.type === cardEffects.EFFECT_TYPES.REMOVE_ORBIT_TO_PROBE) {
          const currentPlayer = getCurrentPlayer();
          const hasOwnOrbitMarker = (planetStats.PLANET_IDS || []).some((planetId) => (
            planetStats.getPlanetOrbitMarkers(planetStatsState, planetId)
              .some((marker) => ruleEngineMarkerBelongsToPlayer(marker, currentPlayer))
          ));
          if (!hasOwnOrbitMarker) {
            return { ok: false, message: `${effect.label || "移除环绕并放置探测器"}：没有可移除的己方环绕标记` };
          }
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
      const playEffects = getAiPlayEffectsForCard(card);
      const effectCheck = canAiResolvePlayCardEffects(playEffects);
      if (!effectCheck.ok) return null;
      const reservesAfterPlay = doesAiCardReserveAfterPlay(card, typeCode, model);
      const endGameExpectedScore = scoreAiCardEndGameExpectedValue(card, model, currentPlayer);
      const plan = scoreAiPlayCardRoutePlan(card, model, playEffects, currentPlayer);
      const score = scoreAiPlayCardValue(card, {
        player: currentPlayer,
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
        alienCard: isAiAlienMainPlayCard(card),
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
          c2Type3ProgressValue: typeCode === 3 ? scoreAiC2Type3ProgressValue(currentPlayer) : 0,
          endGameExpectedScore,
          planScore: plan?.score || 0,
          standardActionPremium: scoreAiCardStandardActionPremium(playEffects, currentPlayer),
        },
      };
    }

    function listAiPlayCardCandidates(currentPlayer = getCurrentPlayer()) {
      return (currentPlayer?.hand || [])
        .map((card, handIndex) => buildAiPlayCardCandidate(card, handIndex, currentPlayer))
        .filter(Boolean);
    }

    function getAiDiscardedCardOpportunityCost(card, playCandidate = null) {
      const baseValue = ai?.valuation?.getCardValue
        ? ai.valuation.getCardValue(card, { defaultCardValue: 3, alienCardValue: 4 })
        : 3;
      const playValue = Math.max(0, aiNumber(playCandidate?.score)) * 0.35;
      return Math.max(baseValue, playValue);
    }

    function scoreAiD2ResearchTechPreserveValue(card, playCandidate = null, player = getCurrentPlayer()) {
      if (!card || !player) return 0;
      if (!getAiMarkedFinalFormulaEntries(player).some((entry) => entry.formulaId === "d2")) return 0;
      const effectTypes = playCandidate?.effectTypes || getAiPlayEffectsForCard(card).map((effect) => effect?.type || null);
      const grantsTech = effectTypes.includes(cardEffects.EFFECT_TYPES.RESEARCH_TECH)
        || effectTypes.includes("research_tech_select")
        || effectTypes.includes("card_research_tech");
      if (!grantsTech) return 0;
      const techCount = getAiTechCountForPlayer(player);
      const d2Entries = getAiMarkedFinalFormulaEntries(player)
        .filter((entry) => entry.formulaId === "d2");
      const d2Marginal = d2Entries.reduce((total, entry) => {
        const multiplier = Math.max(1, aiNumber(entry.multiplier));
        const beforeBase = Math.floor(Math.max(0, techCount) / 2);
        const afterBase = Math.floor((Math.max(0, techCount) + 1) / 2);
        return total + Math.max(0, afterBase - beforeBase) * multiplier;
      }, 0);
      return d2Marginal > 0 ? d2Marginal * 0.85 : 2.5;
    }

    function getAiCardCornerRewardValue(card, player = getCurrentPlayer()) {
      const resourceReward = cards.getDiscardActionRewardForCard(card);
      const moveReward = cards.getDiscardActionMoveRewardForCard?.(card);
      let value = 0;
      if (resourceReward) {
        value += scoreAiResourceBundle(resourceReward.gain || {});
        value += Math.max(0, Math.round(aiNumber(resourceReward.dataCount))) * AI_RESOURCE_VALUES.availableData;
      }
      if (moveReward) {
        value += scoreAiResourceBundle(moveReward.gain || {});
        value += Math.max(0, Math.round(aiNumber(moveReward.movementPoints || 1))) * AI_RESOURCE_VALUES.movement;
        const bestMove = listAiEffectMoveCandidates({
          id: "cardCornerMovePreview",
          free: true,
          poolRemaining: moveReward.movementPoints || 1,
        }).sort((left, right) => Number(right.score || 0) - Number(left.score || 0))[0] || null;
        if (!bestMove) return { value: -Infinity, resourceReward, moveReward, bestMove: null };
        value += Math.max(0, aiNumber(bestMove.score)) * 0.45;
      }
      const incomeGain = cards.getIncomeGainForCard?.(card);
      if (incomeGain) value -= Math.max(0, scoreAiIncomeOpportunityValue(player, incomeGain)) * 0.2;
      return { value, resourceReward, moveReward, bestMove: null };
    }

    function buildAiCardCornerQuickCandidate(card, handIndex, currentPlayer, options = {}) {
      if (!card) return null;
      const reward = getAiCardCornerRewardValue(card, currentPlayer);
      if (!reward.resourceReward && !reward.moveReward) return null;
      if (!Number.isFinite(Number(reward.value))) return null;
      const playCandidate = options.playCandidateByIndex?.get(handIndex) || null;
      const handSize = Math.max(0, (currentPlayer?.hand || []).length);
      const unplayableCount = Math.max(0, aiNumber(options.unplayableCount));
      const handPressure = Math.max(0, handSize - 4) * 1.8 + Math.max(0, unplayableCount - 4) * 2.2;
      const discardCost = getAiDiscardedCardOpportunityCost(card, playCandidate);
      const preservePenalty = scoreAiD2ResearchTechPreserveValue(card, playCandidate, currentPlayer);
      const playablePenalty = playCandidate ? Math.min(4, Math.max(0, playCandidate.score) * 0.18) : 0;
      const lowValueBias = Math.max(0, 4.5 - discardCost) * 0.65;
      const score = reward.value
        - discardCost
        - preservePenalty
        - playablePenalty
        + handPressure
        + lowValueBias;
      if (handPressure <= 0 && score < 2.5) return null;
      return {
        id: "cardCorner",
        kind: "quick",
        available: true,
        handIndex,
        cardId: card.cardId || card.id || null,
        cardInstanceId: card.id || null,
        cardLabel: cards.getCardLabel(card),
        actionKind: reward.moveReward ? "move" : "resource",
        reward: reward.resourceReward || null,
        moveReward: reward.moveReward || null,
        gain: reward.value,
        cost: discardCost + preservePenalty + playablePenalty,
        score,
        finalFormulaDeltas: {
          a1: reward.resourceReward || reward.moveReward ? 0.25 : 0,
          a2: reward.resourceReward || reward.moveReward ? 0.25 : 0,
        },
        valueBreakdown: {
          rewardValue: reward.value,
          discardCost,
          preservePenalty,
          playablePenalty,
          handPressure,
          lowValueBias,
        },
      };
    }

    function listAiCardCornerQuickCandidates(currentPlayer = getCurrentPlayer(), playCardCandidates = null) {
      if (!currentPlayer || !handleHandCardCornerQuickAction || !confirmCardCornerQuickAction) return [];
      const hand = currentPlayer.hand || [];
      const playableCards = playCardCandidates || listAiPlayCardCandidates(currentPlayer);
      const playCandidateByIndex = new Map(playableCards.map((candidate) => [candidate.handIndex, candidate]));
      const unplayableCount = hand.reduce((count, _card, index) => (
        count + (playCandidateByIndex.has(index) ? 0 : 1)
      ), 0);
      return hand
        .map((card, handIndex) => buildAiCardCornerQuickCandidate(card, handIndex, currentPlayer, {
          playCandidateByIndex,
          unplayableCount,
        }))
        .filter(Boolean)
        .sort((left, right) => Number(right.score || 0) - Number(left.score || 0));
    }

    function runAiCardCornerQuickActionDecision(action) {
      const currentPlayer = getCurrentPlayer();
      if (!isAiAutoBattlePlayer(currentPlayer?.id)) {
        return { ok: false, blocked: true, message: `${currentPlayer?.colorLabel || "当前玩家"}需要人工确认卡牌快速行动` };
      }
      if (!Number.isInteger(Number(action?.handIndex))) {
        return { ok: false, message: "AI 卡牌快速行动缺少手牌索引" };
      }
      recordAiAutoBattleLog("card-corner", `${currentPlayer.colorLabel}AI 使用手牌角标 ${action.cardLabel}`, {
        action,
      });
      const selectResult = handleHandCardCornerQuickAction(action.handIndex);
      if (!selectResult?.ok) return selectResult;
      const result = confirmCardCornerQuickAction();
      return result || { ok: true, progressed: true, action };
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
      const movementGain = applyAiStrategyWeight(applyAiStrategyWeight(routeScore.score, "route", 0.7), "move", 0.8)
        + applyAiStrategyWeight(Math.max(0, followupMainAction.score), "orbitLand", 0.5)
        + direction.score * 0.08;
      const paymentCost = scoreAiMovePaymentCost(currentPlayer, requiredMovePoints);
      const pathPenalty = scoreAiMovementPathPenalty({
        player: currentPlayer,
        from,
        to,
        direction,
        requiredMovePoints,
        routeScore,
        followupScore: followupMainAction.score,
      });
      const movementCost = paymentCost + pathPenalty;
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
        gain: movementGain,
        cost: movementCost + index * 0.1,
        score: movementGain - movementCost - index * 0.1,
        valueBreakdown: {
          movementGain,
          paymentCost,
          pathPenalty,
          movementCost,
          routeScore: routeScore.score,
          followupScore: followupMainAction.score,
          requiredMovePoints,
        },
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

    function getAiIndustryCard(player = getCurrentPlayer()) {
      return player?.initialSelection?.industry || null;
    }

    function scoreAiIndustryPublicPick(player, pendingType = null) {
      return (cardState.publicCards || []).reduce((best, card) => (
        Math.max(best, scoreAiPublicPickCard(card, player, pendingType))
      ), -Infinity);
    }

    function listAiCardCornerMoveCandidatesForReward(moveReward, options = {}) {
      if (!moveReward) return [];
      const movementPoints = Math.max(1, Math.round(aiNumber(moveReward.movementPoints || 1)));
      return listAiEffectMoveCandidates({
        id: options.id || "industryCornerMove",
        free: true,
        poolRemaining: movementPoints,
      })
        .sort((left, right) => Number(right.score || 0) - Number(left.score || 0));
    }

    function scoreAiIndustryCornerReward(card, reward = null, options = {}) {
      const resolvedReward = reward || industry?.getCornerReward?.(cards, card) || null;
      if (!resolvedReward) return options.allowMissing ? 0 : -Infinity;
      if (resolvedReward.kind === "resource") {
        const dataValue = Math.max(0, Math.round(aiNumber(resolvedReward.dataCount))) * AI_RESOURCE_VALUES.availableData;
        return scoreAiResourceBundle(resolvedReward.gain || {}) + dataValue;
      }
      if (resolvedReward.kind === "move") {
        const candidates = listAiCardCornerMoveCandidatesForReward(resolvedReward, {
          id: options.moveId || "industryCornerMove",
        });
        if (!candidates.length) return -Infinity;
        const bestMoveScore = aiNumber(candidates[0]?.score);
        return scoreAiResourceBundle(resolvedReward.gain || {})
          + Math.max(0.5, aiNumber(resolvedReward.movementPoints || 1) * 0.85)
          + Math.max(0, bestMoveScore) * 0.75;
      }
      return -Infinity;
    }

    function scoreAiIndustryStratusCorners(player = getCurrentPlayer()) {
      let total = 0;
      let rewardCount = 0;
      for (const card of (cardState.publicCards || []).slice(0, 3)) {
        if (!card) continue;
        const reward = industry?.getCornerReward?.(cards, card);
        const rewardValue = scoreAiIndustryCornerReward(card, reward, {
          allowMissing: true,
          moveId: "industryStratusMove",
        });
        if (!Number.isFinite(Number(rewardValue))) return -Infinity;
        if (reward) rewardCount += 1;
        total += Math.max(0, rewardValue);
      }
      return rewardCount > 0 && total > 0 ? total : -Infinity;
    }

    function scoreAiIndustryTuringBorrow(player = getCurrentPlayer()) {
      if (!player || state.pendingActionExecuted || !canStartMainAction()) return -Infinity;
      const candidates = tech.listTakeableTiles(
        techGameState.board,
        player.techState,
        { techTypes: ["orange", "purple"] },
      )
        .map((tileId) => buildAiResearchTechCandidate(tileId))
        .filter((candidate) => candidate.available !== false);
      const best = candidates
        .sort((left, right) => Number(right.score || 0) - Number(left.score || 0))[0] || null;
      return best ? 4 + Math.max(0, Number(best.score || 0)) * 0.35 : -Infinity;
    }

    function scoreAiIndustryHuanyuMoves() {
      const candidates = listAiEffectMoveCandidates({
        id: "industryMove",
        free: true,
        poolRemaining: 1,
      })
        .filter((candidate) => !(state.industryFreeMoveState?.movedRocketIds || []).includes(candidate.rocketId))
        .sort((left, right) => Number(right.score || 0) - Number(left.score || 0));
      if (!candidates.length) return -Infinity;
      return 3
        + Math.max(0, Number(candidates[0]?.score || 0))
        + Math.max(0, Number(candidates[1]?.score || 0)) * 0.45;
    }

    function scoreAiIndustrySentinelArm(player = getCurrentPlayer()) {
      if (!player || state.pendingActionExecuted || !canStartMainAction()) return -Infinity;
      const bestCard = listAiPlayCardCandidates(player)
        .reduce((best, candidate) => Math.max(best, scoreAiCardCornerOpportunity(candidate.card)), 0);
      return bestCard > 0 ? 4 + bestCard * 0.65 : -Infinity;
    }

    function buildAiIndustryCandidate(player = getCurrentPlayer()) {
      const industryCard = getAiIndustryCard(player);
      if (!industry || !industryCard || !handleCompanyActionMarkerClick) return null;
      const layout = industry.getIndustryActionMarkerLayout?.(industryCard);
      const check = industry.canMarkIndustryAction?.(player, turnState.roundNumber, {
        turnNumber: turnState.turnNumber,
        hasMarker: Boolean(layout),
        industryCard,
      });
      if (!check?.ok) return null;
      const definition = industry.getIndustryDefinition?.(industryCard);
      const abilityId = definition?.activeAbilityId || null;
      let score = -Infinity;
      if (abilityId === "stratus_public_corners") {
        score = 4 + scoreAiIndustryStratusCorners(player) * 0.85;
      } else if (abilityId === "turing_borrow_tech") {
        score = -Infinity;
      } else if (abilityId === "sentinel_arm_play_corner") {
        score = -Infinity;
      } else if (abilityId === "huanyu_free_moves") {
        score = -Infinity;
      } else if (abilityId === "mission_publicity_pick_income") {
        score = players.canAfford(player, { publicity: industry.PUBLICITY_PICK_COST || 2 })
          ? scoreAiIndustryPublicPick(player, "industry_mission_pick") - 3
          : -Infinity;
      } else if (abilityId === "fenwick_publicity_pick_corner") {
        score = players.canAfford(player, { publicity: industry.PUBLICITY_PICK_COST || 2 })
          ? scoreAiIndustryPublicPick(player, "industry_fenwick_pick") - 3
          : -Infinity;
      } else if (abilityId === "strategy_pick_card") {
        score = scoreAiIndustryPublicPick(player, "industry_strategy_pick");
      }
      if (!Number.isFinite(Number(score)) || score <= 0) return null;
      return {
        id: "industry",
        kind: "quick",
        available: true,
        industryCard,
        abilityId,
        companyLabel: definition?.label || industryCard.label || "公司牌",
        score,
        gain: Math.max(0, score),
        cost: 0,
        valueBreakdown: {
          abilityId,
          companyLabel: definition?.label || industryCard.label || "公司牌",
        },
      };
    }

    function scoreAiDataPlacementChoice(choice, player = getCurrentPlayer()) {
      if (!choice) return -Infinity;
      const target = choice.target || null;
      const placementSlot = Math.max(0, Math.round(aiNumber(choice.placementSlot)));
      if (target === data.PLACEMENT_KIND_COMPUTER) {
        const analyzeReadyBonus = placementSlot >= (data.ANALYZE_REQUIRED_COMPUTER_SLOT || 6) ? 9 : 0;
        const bonusValue = scoreAiDataPlacementBonusValue(choice, player);
        const engineProgressValue = scoreAiDataEngineProgressValue(placementSlot, player);
        return applyAiStrategyWeight(
          7
            + placementSlot * 0.8
            + bonusValue * 0.85
            + engineProgressValue
            + analyzeReadyBonus
            + getAiMapDemand(getAiStrategyDemand(player).actions, "analyze") * 0.08,
          "task",
          0.35,
        );
      }
      if (target === data.PLACEMENT_KIND_BLUE_BONUS) {
        const bonusValue = scoreAiDataPlacementBonusValue(choice, player);
        return applyAiStrategyWeight(
          5 + Math.max(0, aiNumber(choice.blueSlot)) * 0.05 + bonusValue * 0.8,
          "tech",
          0.25,
        );
      }
      return 0;
    }

    function listAiDataPlacementCandidates(player = getCurrentPlayer()) {
      const check = data.canPlaceAnyData?.(player);
      if (!check?.ok) return [];
      return (check.choices || data.listPlaceDataChoices?.(player) || [])
        .map((choice, index) => ({
          id: "placeData",
          kind: "quick",
          available: true,
          target: choice.target || null,
          blueSlot: choice.blueSlot ?? null,
          placementSlot: choice.placementSlot ?? null,
          label: choice.label || null,
          description: choice.description || null,
          score: scoreAiDataPlacementChoice(choice, player) - index * 0.05,
        }))
        .filter((candidate) => Number.isFinite(Number(candidate.score)));
    }

    function chooseAiDataPlacementOptionFromButtons(buttons = [], player = getCurrentPlayer()) {
      return [...(buttons || [])]
        .map((button, index) => {
          const target = button.dataset.placeTarget || null;
          const blueSlot = button.dataset.blueSlot != null ? Number(button.dataset.blueSlot) : null;
          const placementSlotMatch = String(button.textContent || "").match(/放置位\s*(\d+)/);
          const choice = {
            target,
            blueSlot,
            placementSlot: placementSlotMatch ? Number(placementSlotMatch[1]) : null,
          };
          return {
            button,
            index,
            target,
            blueSlot,
            placementSlot: choice.placementSlot,
            label: button.textContent || "",
            disabled: Boolean(button.disabled),
            score: button.disabled ? -Infinity : scoreAiDataPlacementChoice(choice, player) - index * 0.05,
          };
        })
        .filter((entry) => Number.isFinite(entry.score))
        .sort((left, right) => right.score - left.score || left.index - right.index)[0] || null;
    }

    function runAiDataPlacementDecision() {
      if (!els.dataPlaceOverlay || els.dataPlaceOverlay.hidden) return null;
      const currentPlayer = getCurrentPlayer();
      if (!isAiAutoBattlePlayer(currentPlayer?.id)) {
        return { ok: false, blocked: true, message: `${currentPlayer?.colorLabel || "当前玩家"}需要人工选择数据放置` };
      }
      const selected = chooseAiDataPlacementOptionFromButtons(
        els.dataPlaceActions?.querySelectorAll("[data-place-target]") || [],
        currentPlayer,
      );
      if (!selected) {
        return { ok: false, blocked: true, message: "AI 没有可用数据放置目标" };
      }
      recordAiAutoBattleLog("data-placement", `${currentPlayer.colorLabel}AI 放置数据`, {
        selected: {
          target: selected.target,
          blueSlot: selected.blueSlot,
          placementSlot: selected.placementSlot,
          label: selected.label,
          score: selected.score,
        },
      });
      return confirmDataPlacement(selected.target, selected.blueSlot);
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
        roundNumber: turnState.roundNumber,
        preserveEnergy: false,
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
      const pending = state.pendingLandTargetAction || null;
      const options = typeof pending?.getOptions === "function"
        ? pending.getOptions()
        : abilities.planet.getLandOptions(createActionContext());
      if (!options?.ok || !options?.choices?.length) {
        const settleResult = confirmLandTargetPicker();
        if (settleResult) return settleResult;
        return null;
      }
      const optionCount = options.choices.length;
      const selected = options?.ok
        ? chooseAiLandChoice(options.choices || [], currentPlayer)
        : null;
      const selectedIndex = Math.min(
        optionCount - 1,
        Math.max(0, selected?.index ?? 0),
      );
      els.landTargetSelect.value = String(selectedIndex);
      recordAiAutoBattleLog("land-target", `${currentPlayer.colorLabel}AI 选择登陆目标 ${selectedIndex + 1}`, {
        optionCount,
        planetId: els.landTargetOverlay.dataset.planetId || null,
        selectedIndex,
        selected: selected
          ? {
            label: selected.choice?.label || null,
            target: selected.choice?.target || null,
            score: selected.score,
          }
          : null,
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

      if (state.pendingStrategyPassiveSlotChoice) {
        const slotButton = [...(els.scanTargetActions?.querySelectorAll("[data-strategy-slot-choice]") || [])]
          .find((button) => !button.disabled) || null;
        if (!slotButton) return { ok: false, blocked: true, message: "AI 没有可选宇宙战略集团奖励槽" };
        slotButton.click();
        return { ok: true, progressed: true, message: "AI 已选择宇宙战略集团奖励槽" };
      }

      if (state.pendingProbeSectorScanAction) {
        const confirmButton = els.scanTargetActions?.querySelector("[data-probe-scan-confirm]");
        if (confirmButton && !confirmButton.disabled) {
          confirmButton.click();
          return { ok: true, progressed: true, message: "AI 已确认探测器扫描选择" };
        }
        const probeButtons = [...(els.scanTargetActions?.querySelectorAll("[data-probe-scan-rocket-id]") || [])]
          .filter((button) => !button.disabled);
        const selectedButton = probeButtons
          .map((button, index) => ({
            button,
            index,
            score: scoreAiProbeSectorButton(button, currentPlayer),
          }))
          .filter((entry) => Number.isFinite(entry.score))
          .sort((left, right) => right.score - left.score || left.index - right.index)[0]?.button || probeButtons[0] || null;
        if (!selectedButton) return { ok: false, blocked: true, message: "AI 没有可选探测器扫描目标" };
        selectedButton.click();
        return { ok: true, progressed: true, message: "AI 已选择探测器扫描目标" };
      }

      if (state.pendingProbeLocationRewardAction) {
        const rewardButtons = [...(els.scanTargetActions?.querySelectorAll("[data-probe-location-reward-rocket-id]") || [])]
          .filter((button) => !button.disabled);
        const selectedButton = rewardButtons
          .map((button, index) => ({
            button,
            index,
            score: scoreAiProbeLocationRewardButton(button),
          }))
          .filter((entry) => Number.isFinite(entry.score))
          .sort((left, right) => right.score - left.score || left.index - right.index)[0]?.button || rewardButtons[0] || null;
        if (!selectedButton) return { ok: false, blocked: true, message: "AI 没有可选探测器位置奖励目标" };
        selectedButton.click();
        return { ok: true, progressed: true, message: "AI 已选择探测器位置奖励目标" };
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

      if (pendingType === "hand_corner_reward") {
        const choiceButton = [...(els.scanTargetActions?.querySelectorAll("[data-hand-corner-choice]") || [])]
          .filter((button) => !button.disabled)
          .map((button, index) => ({
            button,
            index,
            score: scoreAiHandCornerChoiceButton(button),
          }))
          .filter((entry) => Number.isFinite(entry.score))
          .sort((left, right) => right.score - left.score || left.index - right.index)[0]?.button || null;
        if (!choiceButton) return { ok: true, progressed: true, skipped: true, message: "AI 跳过无可选手牌角标奖励" };
        choiceButton.click();
        return { ok: true, progressed: true, message: "AI 已选择手牌角标奖励" };
      }

      if (pendingType === "remove_planet_marker") {
        const markerButton = [...(els.scanTargetActions?.querySelectorAll("[data-planet-marker-choice]") || [])]
          .filter((button) => !button.disabled)
          .map((button, index) => ({
            button,
            index,
            score: scoreAiRemovePlanetMarkerButton(button, currentPlayer),
          }))
          .filter((entry) => Number.isFinite(entry.score))
          .sort((left, right) => right.score - left.score || left.index - right.index)[0]?.button || null;
        if (!markerButton) return { ok: false, blocked: true, message: "AI 没有可选移除标记目标" };
        markerButton.click();
        return { ok: true, progressed: true, message: "AI 已选择移除标记目标" };
      }

      if (pendingType === "discard_any_income") {
        const cardButtons = [...(els.scanTargetActions?.querySelectorAll("[data-discard-income-card-id]") || [])]
          .filter((button) => !button.disabled);
        const ranked = cardButtons
          .map((button, index) => ({
            button,
            cardId: button.dataset.discardIncomeCardId || null,
            index,
            score: scoreAiDiscardIncomeCardButton(button, currentPlayer),
          }))
          .filter((entry) => Number.isFinite(entry.score) && entry.score > 0)
          .sort((left, right) => right.score - left.score || left.index - right.index)
          .slice(0, 2);
        if (ranked.length) {
          ranked.forEach((entry) => {
            const liveButton = entry.cardId
              ? els.scanTargetActions?.querySelector(`[data-discard-income-card-id="${entry.cardId}"]`)
              : null;
            if (liveButton && !liveButton.disabled) liveButton.click();
          });
        }
        const confirmButton = els.scanTargetActions?.querySelector("[data-discard-income-confirm]");
        if (confirmButton && !confirmButton.disabled) {
          confirmButton.click();
          return { ok: true, progressed: true, message: "AI 已确认收入弃牌" };
        }
        return { ok: false, blocked: true, message: "AI 无法确认收入弃牌" };
      }

      if (pendingType === "pay_credit_reward") {
        const payButton = els.scanTargetActions?.querySelector('[data-pay-credit-choice="pay"]');
        const skipButton = els.scanTargetActions?.querySelector('[data-pay-credit-choice="skip"]');
        const canPay = players.canAfford(currentPlayer, { credits: 1 });
        const selected = canPay ? payButton : skipButton;
        if (!selected || selected.disabled) return { ok: false, blocked: true, message: "AI 没有可用信用支付选项" };
        selected.click();
        return { ok: true, progressed: true, message: canPay ? "AI 已选择支付信用" : "AI 已选择跳过信用支付" };
      }

      if (pendingType === "discard_corner_repeat") {
        const cardButton = [...(els.scanTargetActions?.querySelectorAll("[data-discard-corner-card-id]") || [])]
          .filter((button) => !button.disabled)
          .map((button, index) => ({
            button,
            index,
            score: scoreAiDiscardCornerRepeatButton(button, currentPlayer),
          }))
          .filter((entry) => Number.isFinite(entry.score))
          .sort((left, right) => right.score - left.score || left.index - right.index)[0]?.button || null;
        if (!cardButton) return { ok: false, blocked: true, message: "AI 没有可选角标重复弃牌" };
        cardButton.click();
        return { ok: true, progressed: true, message: "AI 已选择角标重复弃牌" };
      }

      if (pendingType === "remove_orbit_to_probe") {
        const orbitButton = [...(els.scanTargetActions?.querySelectorAll("[data-remove-orbit-to-probe]") || [])]
          .find((button) => !button.disabled) || null;
        if (!orbitButton) return { ok: false, blocked: true, message: "AI 没有可选环绕移除目标" };
        orbitButton.click();
        return { ok: true, progressed: true, message: "AI 已选择环绕移除目标" };
      }

      if (pendingType === "return_unfinished_task") {
        const taskButton = [...(els.scanTargetActions?.querySelectorAll("[data-return-task-card-id]") || [])]
          .find((button) => !button.disabled) || null;
        if (!taskButton) return { ok: false, blocked: true, message: "AI 没有可选任务卡回手目标" };
        taskButton.click();
        return { ok: true, progressed: true, message: "AI 已选择任务卡回手目标" };
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
      const landingRequiredThisStep = isAiLandingEffect(nextEffect);
      const landingScore = landingRequiredThisStep
        ? scoreAiLandingAfterMove(to, nextEffect, currentPlayer)
        : { ok: true, score: 0, planet: null };
      if (!landingScore.ok) return null;
      const routeScore = scoreAiMoveTowardTargets(from, to, currentPlayer);
      const movementGain = applyAiStrategyWeight(applyAiStrategyWeight(routeScore.score, "route", 0.7), "move", 0.8) * 0.75
        + direction.score * 0.08
        + applyAiStrategyWeight(landingScore.score, "orbitLand", 0.6);
      const paymentCost = paymentRequired > 0
        ? scoreAiMovePaymentCost(currentPlayer, paymentRequired)
        : 0;
      const pathPenalty = scoreAiMovementPathPenalty({
        player: currentPlayer,
        from,
        to,
        direction,
        requiredMovePoints: terrainRequired,
        routeScore,
        followupScore: landingScore.score,
      });
      const movementCost = paymentCost + pathPenalty;
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
        gain: movementGain,
        cost: movementCost + index * 0.1,
        score: movementGain - movementCost - index * 0.1,
        valueBreakdown: {
          movementGain,
          paymentCost,
          pathPenalty,
          movementCost,
          routeScore: routeScore.score,
          landingScore: landingScore.score,
          terrainRequired,
          paymentRequired,
          remainingPoolAfterStep,
        },
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
        if (!selected || aiNumber(selected.score) < 0) {
          const message = "AI 没有可用免费移动路径，跳过移动效果";
          recordAiAutoBattleLog("move-path-skip", `${currentPlayer.colorLabel}${message}`, {
            reason: selected ? "negative-free-move-score" : "no-free-move-candidates",
            selected,
          });
          skipCurrentActionEffect?.();
          return { ok: true, progressed: true, skipped: true, message };
        }
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
      if (!selected || aiNumber(selected.score) < 0) {
        const message = "AI 没有可用卡牌移动路径，跳过移动效果";
        recordAiAutoBattleLog("move-path-skip", `${currentPlayer.colorLabel}${message}`, {
          effectId: effect?.id || null,
          reason: selected ? "negative-card-move-score" : "no-card-move-candidates",
          selected,
        });
        skipCurrentActionEffect?.();
        return { ok: true, progressed: true, skipped: true, message };
      }
      recordAiAutoBattleLog("move-path", `${currentPlayer.colorLabel}AI 选择卡牌移动 ${selected.rocketLabel} ${selected.directionLabel}`, {
        effectId: effect?.id || null,
        selected,
        candidates,
      });
      return executeCardMoveForEffect(selected.deltaX, selected.deltaY, selected.rocketId);
    }

    function runAiCardCornerFreeMoveDecision() {
      if (!state.pendingCardCornerFreeMove) return null;
      const currentPlayer = getCurrentPlayer();
      if (!isAiAutoBattlePlayer(currentPlayer?.id)) {
        return { ok: false, blocked: true, message: `${currentPlayer?.colorLabel || "当前玩家"}需要人工处理卡牌角标移动` };
      }
      const pending = state.pendingCardCornerFreeMove;
      const movementPoints = pending.action?.moveReward?.movementPoints || pending.action?.movementPoints || 1;
      const candidates = listAiEffectMoveCandidates({
        id: "cardCornerMove",
        free: true,
        poolRemaining: movementPoints,
      });
      const selected = ai?.policy?.chooseTurnAction?.(candidates, {
        playerState,
        turnState,
        currentPlayer,
      }) || candidates[0] || null;
      if (!selected) {
        return { ok: false, blocked: true, message: "AI 没有可用卡牌角标移动路径" };
      }
      recordAiAutoBattleLog("move-path", `${currentPlayer.colorLabel}AI 选择卡牌角标移动 ${selected.rocketLabel} ${selected.directionLabel}`, {
        selected,
        candidates,
      });
      return executeFreeMoveForCardCorner(selected.deltaX, selected.deltaY, selected.rocketId);
    }

    function runAiIndustryFreeMoveDecision() {
      if (!state.industryFreeMoveState) return null;
      const currentPlayer = getCurrentPlayer();
      if (!isAiAutoBattlePlayer(currentPlayer?.id)) {
        return { ok: false, blocked: true, message: `${currentPlayer?.colorLabel || "当前玩家"}需要人工处理公司免费移动` };
      }
      const candidates = listAiEffectMoveCandidates({
        id: "industryMove",
        free: true,
        poolRemaining: 1,
      }).filter((candidate) => !(state.industryFreeMoveState?.movedRocketIds || []).includes(candidate.rocketId));
      const selected = ai?.policy?.chooseTurnAction?.(candidates, {
        playerState,
        turnState,
        currentPlayer,
      }) || candidates[0] || null;
      if (!selected || aiNumber(selected.score) < 0) {
        return { ok: false, blocked: true, message: "AI 没有可用公司免费移动路径" };
      }
      recordAiAutoBattleLog("move-path", `${currentPlayer.colorLabel}AI 选择公司免费移动 ${selected.rocketLabel} ${selected.directionLabel}`, {
        selected,
        candidates,
      });
      return executeIndustryFreeMove(selected.deltaX, selected.deltaY, selected.rocketId);
    }

    function listAiScanAction4Candidates(currentPlayer = getCurrentPlayer()) {
      if (!currentPlayer) return [];
      const candidates = [];
      const rocketLimit = abilities.rocket.getRocketLimitForPlayer(currentPlayer, createActionContext());
      const activeRocketCount = rocketActions.getRocketsForPlayer
        ? rocketActions.getRocketsForPlayer(rocketState, currentPlayer.id).length
        : getMovableTokensForPlayer(currentPlayer.id).length;
      const canLaunch = activeRocketCount < rocketLimit
        && players.canAfford(currentPlayer, { energy: scanEffects.SCAN_ACTION_4_LAUNCH_ENERGY });
      if (canLaunch) {
        const launchGain = scoreAiLaunchAction(currentPlayer);
        const launchCost = scoreAiResourceBundle({ energy: scanEffects.SCAN_ACTION_4_LAUNCH_ENERGY });
        candidates.push({
          id: "launch",
          kind: "effect",
          choice: "launch",
          available: true,
          gain: launchGain,
          cost: launchCost,
          score: launchGain - launchCost,
          valueBreakdown: {
            launchGain,
            launchCost,
            scanAction4: true,
          },
        });
      }

      candidates.push(...listAiEffectMoveCandidates({
        id: "move",
        free: true,
        poolRemaining: 1,
      }).map((candidate) => ({
        ...candidate,
        id: "move",
        kind: "effect",
        choice: "move",
        valueBreakdown: {
          ...(candidate.valueBreakdown || {}),
          scanAction4: true,
        },
      })));
      return candidates;
    }

    function runAiScanAction4Decision() {
      if (!els.scanAction4Overlay || els.scanAction4Overlay.hidden) return null;
      const currentPlayer = getCurrentPlayer();
      if (!isAiAutoBattlePlayer(currentPlayer?.id)) {
        return { ok: false, blocked: true, message: `${currentPlayer?.colorLabel || "当前玩家"}需要人工处理扫描发射/移动` };
      }

      const candidates = listAiScanAction4Candidates(currentPlayer);
      const selected = ai?.policy?.chooseTurnAction?.(candidates, {
        playerState,
        turnState,
        currentPlayer,
      }) || null;
      if (!selected || aiNumber(selected.score) < 0) {
        const message = "AI 没有正收益的扫描发射/移动选择，跳过效果";
        recordAiAutoBattleLog("scan-action-4-skip", `${currentPlayer.colorLabel}${message}`, {
          selected,
          candidates,
        });
        skipCurrentActionEffect?.();
        return { ok: true, progressed: true, skipped: true, message };
      }

      recordAiAutoBattleLog("scan-action-4", `${currentPlayer.colorLabel}AI 选择扫描发射/移动：${selected.choice}`, {
        selected,
        candidates,
      });
      if (selected.choice === "launch") {
        return handleScanAction4Choice("launch");
      }
      return executeFreeMoveForScanAction4(selected.deltaX, selected.deltaY, selected.rocketId);
    }

    function getAiAlienTraceButtons(selector, roots = []) {
      const localMatches = [...(roots || [])]
        .flatMap((root) => {
          if (!root) return [];
          const direct = root?.matches?.(selector) ? [root] : [];
          const descendants = [...(root?.querySelectorAll?.(selector) || [])];
          return [...direct, ...descendants];
        });
      const documentMatches = [...(windowRef?.document?.querySelectorAll?.(selector) || [])];
      return [...new Set([...localMatches, ...documentMatches])]
        .filter((button) => button && !button.disabled)
        .map((button) => button);
    }

    function listAiAlienStateTraceTargets() {
      const pickerMode = String(state.alienTracePickerState?.mode || "");
      if (
        pickerMode !== "debug-direct"
        && pickerMode !== "trace-board"
        && !pickerMode.endsWith("-grid")
      ) return [];
      return getAiAlienTraceButtons("[data-state-trace-slot].is-placeable", els.alienTraceLayers || [])
        .map((button) => ({ kind: "state-slot", button }));
    }

    function listAiAlienGridTraceTargets() {
      const pickerMode = String(state.alienTracePickerState?.mode || "");
      const selectorsByMode = {
        "banrenma-grid": "[data-banrenma-trace-slot].is-placeable",
        "yichangdian-grid": "[data-yichangdian-trace-slot].is-placeable",
        "fangzhou-grid": "[data-fangzhou-trace-slot].is-placeable",
        "chong-grid": "[data-chong-trace-slot].is-placeable",
        "amiba-grid": "[data-amiba-trace-slot].is-placeable",
        "aomomo-grid": "[data-aomomo-trace-slot].is-placeable",
        "runezu-grid": "[data-runezu-trace-slot].is-placeable",
        "jiuzhe-grid": "[data-jiuzhe-trace-slot].is-placeable",
      };
      const gridSelectors = pickerMode === "trace-board"
        ? Object.values(selectorsByMode).join(",")
        : selectorsByMode[pickerMode];
      if (!gridSelectors) return [];
      return getAiAlienTraceButtons(gridSelectors, els.alienJiuzheTraceLayers || [])
        .map((button) => ({ kind: "grid-slot", button }));
    }

    function listAiAlienPickerTargets() {
      return [...(els.alienTraceActions?.querySelectorAll("[data-alien-picker-step][data-alien-slot]") || [])]
        .filter((button) => !button.disabled)
        .map((button) => ({ kind: "picker", button }));
    }

    function getAiAlienTraceTargetTraceType(target) {
      const button = target?.button;
      return button?.dataset?.traceType
        || button?.dataset?.stateTraceType
        || button?.dataset?.banrenmaTraceType
        || button?.dataset?.yichangdianTraceType
        || button?.dataset?.fangzhouTraceType
        || button?.dataset?.chongTraceType
        || button?.dataset?.amibaTraceType
        || button?.dataset?.aomomoTraceType
        || button?.dataset?.runezuTraceType
        || button?.dataset?.jiuzheTraceType
        || state.alienTracePickerState?.selectedTraceType
        || (state.alienTracePickerState?.allowedTraceTypes?.length === 1
          ? state.alienTracePickerState.allowedTraceTypes[0]
          : null);
    }

    function getAiAlienTraceTargetPosition(target) {
      const dataset = target?.button?.dataset || {};
      const raw = dataset.tracePosition
        || dataset.position
        || dataset.stateTraceSlot
        || dataset.banrenmaPosition
        || dataset.yichangdianPosition
        || dataset.fangzhouPosition
        || dataset.chongPosition
        || dataset.amibaPosition
        || dataset.aomomoPosition
        || dataset.runezuPosition
        || dataset.jiuzhePosition
        || dataset.banrenmaTraceSlot
        || dataset.yichangdianTraceSlot
        || dataset.fangzhouTraceSlot
        || dataset.chongTraceSlot
        || dataset.amibaTraceSlot
        || dataset.aomomoTraceSlot
        || dataset.runezuTraceSlot
        || dataset.jiuzheTraceSlot;
      const match = String(raw || "").match(/\d+/);
      return match ? Number(match[0]) : null;
    }

    function scoreAiAlienGridPosition(mode, traceType, position, label) {
      const trace = String(traceType || "");
      const pos = Number(position);
      if (mode === "yichangdian-grid") {
        const key = `${trace}:${pos}`;
        return ({
          "yellow:2": 8,
          "pink:2": 7,
          "yellow:1": 5,
          "blue:1": 4,
          "blue:2": 4,
          "pink:1": 3,
        })[key] || 0;
      }
      if (mode === "fangzhou-grid") {
        if (label.includes("解锁")) return 9;
        return pos === 2 ? 6 : 4;
      }
      if (mode === "banrenma-grid") return pos === 2 ? 7 : 4;
      if (mode === "aomomo-grid") return pos === 2 ? 7 : 4;
      if (mode === "chong-grid" || mode === "amiba-grid" || mode === "runezu-grid") return pos === 2 ? 6 : 4;
      if (mode === "jiuzhe-grid") return pos === 2 ? 5 : 3;
      return 0;
    }

    function getAiAlienTraceTargetReward(mode, traceType, position) {
      if (!traceType || position == null) return null;
      const pos = Number(position);
      if (mode === "jiuzhe-grid") return jiuzhe?.getTraceReward?.(traceType, pos) || null;
      if (mode === "yichangdian-grid") return yichangdian?.getTraceReward?.(traceType, pos) || null;
      if (mode === "fangzhou-grid") return fangzhou?.getTraceReward?.(traceType, pos) || null;
      if (mode === "banrenma-grid") return banrenma?.getTraceReward?.(traceType, pos) || null;
      if (mode === "chong-grid") return chong?.getTraceReward?.(alienGameState, traceType, pos) || null;
      if (mode === "amiba-grid") return amiba?.getTraceReward?.(alienGameState, traceType, pos) || null;
      if (mode === "aomomo-grid") return aomomo?.getTraceReward?.(traceType, pos) || null;
      if (mode === "runezu-grid") return runezu?.getTraceReward?.(alienGameState, traceType, pos) || null;
      return null;
    }

    function getAiAvailableDataTokenCount(player) {
      if (!player) return 0;
      const dataState = data?.ensurePlayerDataState?.(player);
      if (Array.isArray(dataState?.poolTokens)) return dataState.poolTokens.length;
      return Math.max(0, Math.round(aiNumber(player.resources?.availableData)));
    }

    function getAiAllowedAlienTraceTypes(alienModule, allowedTraceTypes) {
      const supportedTypes = alienModule?.TRACE_TYPES || aliens.TRACE_TYPES;
      const requestedTypes = allowedTraceTypes?.length ? allowedTraceTypes : supportedTypes;
      return requestedTypes.filter((traceType) => supportedTypes.includes(traceType));
    }

    function getAiAlienModuleTracePositions(alienModule, traceType) {
      if (typeof alienModule?.getPositionsForTraceType === "function") {
        return alienModule.getPositionsForTraceType(traceType) || [];
      }
      return alienModule?.TRACE_POSITIONS || [];
    }

    function hasAiFeasibleGridTraceTarget(alienModule, alienSlotId, allowedTraceTypes, canPlace) {
      const traceTypes = getAiAllowedAlienTraceTypes(alienModule, allowedTraceTypes);
      return traceTypes.some((traceType) => (
        getAiAlienModuleTracePositions(alienModule, traceType)
          .some((position) => canPlace(traceType, Number(position)))
      ));
    }

    function hasAiFeasibleSimpleGridTraceTarget(alienModule, alienSlotId, allowedTraceTypes, options = {}) {
      const grid = alienModule?.getTraceGrid?.(alienGameState, alienSlotId);
      return hasAiFeasibleGridTraceTarget(alienModule, alienSlotId, allowedTraceTypes, (traceType, position) => {
        if (options.stackPosition === Number(position)) return true;
        return !grid?.[traceType]?.[position];
      });
    }

    function hasAiFeasibleBanrenmaTraceTarget(alienSlotId, allowedTraceTypes, player) {
      if (!banrenma?.isBanrenmaRevealedSlot?.(alienGameState, alienSlotId)) return false;
      const grid = banrenma.getTraceGrid?.(alienGameState, alienSlotId);
      const availableData = getAiAvailableDataTokenCount(player);
      return hasAiFeasibleGridTraceTarget(banrenma, alienSlotId, allowedTraceTypes, (traceType, position) => {
        const reward = banrenma.getTraceReward?.(traceType, Number(position));
        const requiredData = Math.max(0, Math.round(aiNumber(reward?.payData)));
        if (requiredData > availableData) return false;
        return Number(position) === 1 || !grid?.[traceType]?.[position];
      });
    }

    function hasAiFeasibleRevealedAlienTraceTarget(alienSlotId, allowedTraceTypes, player) {
      if (jiuzhe?.isJiuzheRevealedSlot?.(alienGameState, alienSlotId)) {
        return hasAiFeasibleSimpleGridTraceTarget(jiuzhe, alienSlotId, allowedTraceTypes);
      }
      if (yichangdian?.isYichangdianRevealedSlot?.(alienGameState, alienSlotId)) {
        return hasAiFeasibleSimpleGridTraceTarget(yichangdian, alienSlotId, allowedTraceTypes, { stackPosition: 1 });
      }
      if (fangzhou?.isFangzhouRevealedSlot?.(alienGameState, alienSlotId)) {
        return hasAiFeasibleGridTraceTarget(fangzhou, alienSlotId, allowedTraceTypes, (traceType, position) => (
          fangzhou.canPlaceFangzhouTrace?.(alienGameState, alienSlotId, traceType, position, player)?.ok
        ));
      }
      if (banrenma?.isBanrenmaRevealedSlot?.(alienGameState, alienSlotId)) {
        return hasAiFeasibleBanrenmaTraceTarget(alienSlotId, allowedTraceTypes, player);
      }
      if (chong?.isChongRevealedSlot?.(alienGameState, alienSlotId)) {
        return hasAiFeasibleGridTraceTarget(chong, alienSlotId, allowedTraceTypes, (traceType, position) => (
          chong.canPlaceChongTrace?.(alienGameState, alienSlotId, traceType, position, player)?.ok
        ));
      }
      if (amiba?.isAmibaRevealedSlot?.(alienGameState, alienSlotId)) {
        return hasAiFeasibleGridTraceTarget(amiba, alienSlotId, allowedTraceTypes, (traceType, position) => (
          amiba.canPlaceAmibaTrace?.(alienGameState, alienSlotId, traceType, position, player)?.ok
        ));
      }
      if (aomomo?.isAomomoRevealedSlot?.(alienGameState, alienSlotId)) {
        return hasAiFeasibleGridTraceTarget(aomomo, alienSlotId, allowedTraceTypes, (traceType, position) => (
          aomomo.canPlaceAomomoTrace?.(alienGameState, alienSlotId, traceType, position, player)?.ok
        ));
      }
      if (runezu?.isRunezuRevealedSlot?.(alienGameState, alienSlotId)) {
        return hasAiFeasibleGridTraceTarget(runezu, alienSlotId, allowedTraceTypes, (traceType, position) => (
          runezu.canPlaceRunezuTrace?.(alienGameState, alienSlotId, traceType, position, player)?.ok
        ));
      }
      return true;
    }

    function scoreAiAlienTraceTarget(target, player) {
      if (!target?.button || target.button.disabled) return -Infinity;
      const label = String(target.button.textContent || target.button.title || "");
      const mode = String(state.alienTracePickerState?.mode || "");
      const traceType = getAiAlienTraceTargetTraceType(target);
      const position = getAiAlienTraceTargetPosition(target);
      const reward = getAiAlienTraceTargetReward(mode, traceType, position);
      const demand = getAiStrategyDemand(player);
      const traceDemand = traceType ? getAiMapDemand(demand.traceTypes, traceType) : 0;
      const alienSlot = Number(target.button.dataset.alienSlot || state.alienTracePickerState?.selectedAlienSlotId);
      if (mode.endsWith("-grid") && target.kind === "picker") return -Infinity;
      if (
        target.kind === "picker"
        && Number.isFinite(alienSlot)
        && !hasAiFeasibleRevealedAlienTraceTarget(
          alienSlot,
          state.alienTracePickerState?.allowedTraceTypes,
          player,
        )
      ) {
        return -Infinity;
      }
      if (mode === "banrenma-grid" && traceType && position != null) {
        const reward = banrenma?.getTraceReward?.(traceType, position);
        const requiredData = Math.max(0, Math.round(aiNumber(reward?.payData)));
        const availableData = getAiAvailableDataTokenCount(player);
        if (requiredData > availableData) return -Infinity;
      }
      let score = scoreAiAlienTraceValue({
        player,
        traceType,
        alienSlotId: Number.isFinite(alienSlot) ? alienSlot : null,
        mode,
        position,
        label,
        reward,
      });

      if (target.kind === "grid-slot") score += 12;
      if (target.kind === "picker") score += 8;
      if (target.kind === "state-slot") score += 3;
      score += traceDemand * 0.45;
      score += ({ pink: 4, blue: 3.5, yellow: 3 })[traceType] || 0;
      score += scoreAiAlienGridPosition(mode, traceType, position, label);
      if (label.includes("首标记 2/3")) score += 10;
      if (label.includes("首标记 1/3")) score += 4;
      if (label.includes("未揭示")) score += 3;
      if (label.includes("得分") || label.includes("分数")) score += 3;
      if (label.includes("精选") || label.includes("牌")) score += 2.5;
      if (label.includes("信用")) score += 2;
      if (label.includes("数据") || label.includes("扫描")) score += 1.5;
      if (label.includes("解锁")) score += 8;

      if (Number.isFinite(alienSlot)) score += (10 - Math.min(10, Math.max(0, alienSlot))) * 0.01;
      return score;
    }

    function listAiAlienFallbackTargets() {
      const fallbackSelectors = [
        "[data-state-trace-slot]",
        "[data-banrenma-trace-slot]",
        "[data-yichangdian-trace-slot]",
        "[data-fangzhou-trace-slot]",
        "[data-chong-trace-slot]",
        "[data-amiba-trace-slot]",
        "[data-aomomo-trace-slot]",
        "[data-runezu-trace-slot]",
        "[data-jiuzhe-trace-slot]",
      ].join(",");

      return [
        ...listAiAlienGridTraceTargets(),
        ...listAiAlienStateTraceTargets(),
        ...listAiAlienPickerTargets(),
        ...getAiAlienTraceButtons(fallbackSelectors, els.alienTraceLayers || []).map((button) => ({ kind: "state-slot", button })),
        ...getAiAlienTraceButtons(fallbackSelectors, els.alienJiuzheTraceLayers || []).map((button) => ({ kind: "grid-slot", button })),
      ];
    }

    function scoreAiAlienTraceFallbackTarget(target, player, index = 0) {
      if (!target?.button || target.button.disabled) return -Infinity;
      const mode = String(state.alienTracePickerState?.mode || "");
      const traceType = getAiAlienTraceTargetTraceType(target);
      const position = getAiAlienTraceTargetPosition(target);
      const reward = getAiAlienTraceTargetReward(mode, traceType, position);
      const label = String(target.button.textContent || target.button.title || "");

      const rewardScore = Math.max(0, aiNumber(reward?.score));
      const explicitThreePointLabel = /(^|\D)3\s*分|得\s*3\s*分|score\s*3/i.test(label);
      let score = rewardScore > 0 ? rewardScore * 20 : 0;
      if (rewardScore >= 3 || explicitThreePointLabel) score += 100;
      score += scoreAiAlienTraceTarget(target, player);
      score += target.kind === "picker" ? 0.1 : 0;
      score -= index * 0.0001;
      return score;
    }

    function listAiAlienRuleTraceTargets() {
      if (typeof listAiAlienTraceFallbackChoices !== "function") return [];
      return (listAiAlienTraceFallbackChoices() || []).map((choice) => ({
        kind: "rule-choice",
        ruleChoice: choice,
      }));
    }

    function scoreAiAlienRuleTraceTarget(target, player, index = 0) {
      const choice = target?.ruleChoice;
      if (!choice) return -Infinity;
      const traceType = String(choice.traceType || "");
      const alienSlotId = Number(choice.alienSlotId);
      const traceDemand = getAiMapDemand(getAiStrategyDemand(player).traceTypes, traceType);
      const guaranteedBonus = choice.guaranteedThree ? 200 : 0;
      const rewardScore = Math.max(0, aiNumber(choice.rewardScore)) * 20;
      const slotTiebreak = Number.isFinite(alienSlotId)
        ? (10 - Math.min(10, Math.max(0, alienSlotId))) * 0.01
        : 0;
      return guaranteedBonus + rewardScore + traceDemand + slotTiebreak - index * 0.0001;
    }

    function chooseAiAlienTraceTarget(player) {
      const pickerMode = String(state.alienTracePickerState?.mode || "");
      let targets = [];
      if (pickerMode.endsWith("-grid")) {
        targets = [
          ...listAiAlienGridTraceTargets(),
          ...listAiAlienStateTraceTargets(),
        ];
      } else if (pickerMode === "debug-direct") {
        targets = listAiAlienStateTraceTargets();
      } else if (pickerMode === "trace-board") {
        targets = [
          ...listAiAlienGridTraceTargets(),
          ...listAiAlienStateTraceTargets(),
        ];
      } else if (pickerMode || state.pendingAlienTraceAction) {
        targets = listAiAlienPickerTargets();
      }
      const normalTarget = targets
        .map((target, index) => ({ ...target, index, score: scoreAiAlienTraceTarget(target, player) }))
        .filter((target) => Number.isFinite(target.score))
        .sort((left, right) => right.score - left.score || left.index - right.index)[0] || null;

      const fallbackTarget = listAiAlienFallbackTargets()
        .map((target, index) => ({
          ...target,
          index,
          score: scoreAiAlienTraceFallbackTarget(target, player, index),
          fallback: true,
        }))
        .filter((target) => Number.isFinite(target.score))
        .sort((left, right) => right.score - left.score || left.index - right.index)[0] || null;

      const ruleTarget = listAiAlienRuleTraceTargets()
        .map((target, index) => ({
          ...target,
          index,
          score: scoreAiAlienRuleTraceTarget(target, player, index),
        }))
        .filter((target) => Number.isFinite(target.score))
        .sort((left, right) => right.score - left.score || left.index - right.index)[0] || null;

      return [normalTarget, fallbackTarget, ruleTarget]
        .filter((target) => target && Number.isFinite(target.score))
        .sort((left, right) => right.score - left.score || left.index - right.index)[0] || null;
    }

    function runAiAlienTraceDecision() {
      if (!state.pendingAlienTraceAction && (!state.alienTracePickerState || !state.alienTracePickerState.mode)) return null;
      const player = getAlienTraceActionPlayer(state.pendingAlienTraceAction || state.alienTracePickerState);
      if (!isAiAutoBattlePlayer(player?.id)) {
        return { ok: false, blocked: true, message: `${player?.colorLabel || "当前玩家"}需要人工选择外星人痕迹` };
      }

      const target = chooseAiAlienTraceTarget(player);
      if (target?.kind === "rule-choice" && target.ruleChoice && typeof applyAiAlienTraceFallbackChoice === "function") {
        recordAiAutoBattleLog("alien-trace", `${player.colorLabel}AI 选择外星人痕迹`, {
          kind: target.kind,
          mode: state.alienTracePickerState?.mode || null,
          fallback: target.ruleChoice,
          score: target.score,
        });
        const applied = applyAiAlienTraceFallbackChoice(target.ruleChoice);
        if (applied?.ok) {
          return { ok: true, progressed: true, message: "AI 已选择外星人痕迹" };
        }
      }
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
        position: getAiAlienTraceTargetPosition(target),
        score: target.score,
        label: button.textContent || "",
      });
      button.click();
      return { ok: true, progressed: true, message: "AI 已选择外星人痕迹" };
    }

    function getAiAlienPendingPlayer(pending = {}) {
      const playerId = pending?.playerId
        || getEffectOwnerPlayer(pending?.effect)?.id
        || state.pendingActionEffectFlow?.playerId
        || playerState.currentPlayerId;
      return getPlayerById(playerId) || getCurrentPlayer();
    }

    function makeAiAlienChoiceFlow(type, label, pending, selector, datasetKey, handler, options = {}) {
      return {
        type,
        label,
        pending,
        selector,
        allowCancel: options.allowCancel === true,
        getChoice: options.getChoice || ((button) => button?.dataset?.[datasetKey] ?? null),
        handleChoice: handler,
      };
    }

    function getAiAlienUseFlows() {
      return [
        makeAiAlienChoiceFlow(
          "jiuzhe-card",
          "九折牌",
          state.pendingJiuzheCardPlay?.reason === "view" ? null : state.pendingJiuzheCardPlay,
          "[data-jiuzhe-card-choice], [data-jiuzhe-opportunity-skip]",
          null,
          (choice) => (choice === "skip" ? handleJiuzheOpportunitySkip?.() : handleJiuzheCardChoice?.(choice)),
          {
            getChoice: (button) => (button?.dataset?.jiuzheOpportunitySkip ? "skip" : button?.dataset?.jiuzheCardChoice),
          },
        ),
        makeAiAlienChoiceFlow(
          "yichangdian-card",
          "异常点外星人牌",
          state.pendingYichangdianCardGain,
          "[data-yichangdian-card-gain]",
          "yichangdianCardGain",
          handleYichangdianCardGainChoice,
          { allowCancel: true },
        ),
        makeAiAlienChoiceFlow(
          "yichangdian-corner",
          "异常点角标",
          state.pendingYichangdianCornerAction,
          "[data-yichangdian-corner-card-id]",
          "yichangdianCornerCardId",
          handleYichangdianCornerChoice,
        ),
        makeAiAlienChoiceFlow(
          "banrenma-card",
          "半人马外星人牌",
          state.pendingBanrenmaCardGain,
          "[data-banrenma-card-gain]",
          "banrenmaCardGain",
          handleBanrenmaCardGainChoice,
          { allowCancel: true },
        ),
        makeAiAlienChoiceFlow(
          "banrenma-bonus",
          "半人马顶部奖励",
          state.pendingBanrenmaOpportunity?.type === "panel" ? state.pendingBanrenmaOpportunity : null,
          "[data-banrenma-bonus-choice]",
          "banrenmaBonusChoice",
          handleBanrenmaBonusChoice,
        ),
        makeAiAlienChoiceFlow(
          "banrenma-condition",
          "半人马条件效果",
          state.pendingBanrenmaOpportunity?.type === "card" ? state.pendingBanrenmaOpportunity : null,
          "[data-banrenma-card-choice]",
          "banrenmaCardChoice",
          handleBanrenmaCardConditionChoice,
          { allowCancel: true },
        ),
        makeAiAlienChoiceFlow(
          "chong-card",
          "虫族外星人牌",
          state.pendingChongCardGain,
          "[data-chong-card-gain]",
          "chongCardGain",
          handleChongCardGainChoice,
          { allowCancel: true },
        ),
        makeAiAlienChoiceFlow(
          "chong-fossil",
          "虫族化石",
          state.pendingChongFossilChoice,
          "[data-chong-fossil-choice]",
          "chongFossilChoice",
          handleChongFossilChoice,
          { allowCancel: true },
        ),
        makeAiAlienChoiceFlow(
          "chong-task",
          "虫族任务",
          state.pendingChongTaskCompletion,
          "[data-chong-task-complete]",
          "chongTaskComplete",
          handleChongTaskCompletionChoice,
          { allowCancel: true },
        ),
        makeAiAlienChoiceFlow(
          "amiba-card",
          "阿米巴外星人牌",
          state.pendingAmibaCardGain,
          "[data-amiba-card-gain]",
          "amibaCardGain",
          handleAmibaCardGainChoice,
          { allowCancel: true },
        ),
        makeAiAlienChoiceFlow(
          "amiba-symbol",
          "阿米巴 symbol",
          state.pendingAmibaSymbolChoice,
          "[data-amiba-symbol-choice]",
          "amibaSymbolChoice",
          handleAmibaSymbolChoice,
          { allowCancel: true },
        ),
        makeAiAlienChoiceFlow(
          "amiba-trace-removal",
          "阿米巴痕迹移除",
          state.pendingAmibaTraceRemoval,
          "[data-amiba-trace-remove]",
          "amibaTraceRemove",
          handleAmibaTraceRemovalChoice,
          { allowCancel: true },
        ),
        makeAiAlienChoiceFlow(
          "aomomo-card",
          "奥陌陌外星人牌",
          state.pendingAomomoCardGain,
          "[data-aomomo-card-gain]",
          "aomomoCardGain",
          handleAomomoCardGainChoice,
          { allowCancel: true },
        ),
        makeAiAlienChoiceFlow(
          "runezu-card",
          "符文族外星人牌",
          state.pendingRunezuCardGain,
          "[data-runezu-card-gain]",
          "runezuCardGain",
          handleRunezuCardGainChoice,
          { allowCancel: true },
        ),
        makeAiAlienChoiceFlow(
          "runezu-face-symbol",
          "符文族黑圈",
          state.pendingRunezuFaceSymbolPlacement,
          "[data-runezu-face-symbol-choice]",
          "runezuFaceSymbolChoice",
          handleRunezuFaceSymbolChoice,
          { allowCancel: true },
        ),
        makeAiAlienChoiceFlow(
          "runezu-symbol-branch",
          "符文族符文奖励",
          state.pendingRunezuSymbolBranch,
          "[data-runezu-symbol-branch]",
          "runezuSymbolBranch",
          handleRunezuSymbolBranchChoice,
          { allowCancel: true },
        ),
      ].filter((flow) => flow.pending);
    }

    function getAiJiuzheCardDefinition(choice) {
      if (!/^\d+$/.test(String(choice ?? ""))) return null;
      const index = Math.round(aiNumber(choice));
      if (!Number.isInteger(index)) return null;
      return jiuzhe?.CARD_BY_INDEX?.[index] || null;
    }

    function getAiJiuzheScoringContext(player) {
      return {
        currentPlayer: player,
        players: playerState.players,
        playerState,
        finalScoringState,
        nebulaDataState,
        alienGameState,
        planetStatsState,
        cardEffects,
        getCardTypeCode,
      };
    }

    function getAiHighestOtherJiuzheThreat(player) {
      if (!jiuzhe?.getThreat || !player) return 0;
      return (playerState.players || []).reduce((highest, candidate) => {
        if (!candidate || candidate === player || candidate.id === player.id || candidate.color === player.color) {
          return highest;
        }
        return Math.max(highest, aiNumber(jiuzhe.getThreat(alienGameState, candidate)));
      }, 0);
    }

    function estimateAiJiuzheThreatPenalty(player, addedThreat) {
      if (!player || !jiuzhe?.getThreat) return 0;
      const threat = Math.max(0, Math.round(aiNumber(addedThreat)));
      if (!threat) return 0;
      const currentThreat = Math.max(0, Math.round(aiNumber(jiuzhe.getThreat(alienGameState, player))));
      const nextThreat = currentThreat + threat;
      const highestOtherThreat = getAiHighestOtherJiuzheThreat(player);
      if (highestOtherThreat <= 0 || nextThreat < highestOtherThreat) return 0;
      const breakdown = computePlayerFinalScoreBreakdown?.(player) || {};
      const prePenalty = Math.max(
        aiNumber(breakdown.prePenaltyTotalScore),
        aiNumber(breakdown.totalScore),
        aiNumber(player?.resources?.score),
      );
      return Math.max(6, Math.ceil(prePenalty * 0.1));
    }

    function scoreAiJiuzheCardOption(option, player) {
      if (!option || option.disabled) return -Infinity;
      if (option.choice === "skip") return 0;
      if (option.choice === "cancel") return -100;
      const definition = getAiJiuzheCardDefinition(option.choice);
      if (!definition) return option.score;
      const round = getAiRoundNumber();
      const context = getAiJiuzheScoringContext(player);
      const achievedNow = Boolean(jiuzhe?.isCardConditionMet?.(definition, player, context));
      const completionFactor = achievedNow
        ? 1
        : round >= FINAL_ROUND_NUMBER
          ? 0.05
          : round >= 3
            ? 0.15
            : 0.3;
      const expectedScore = Math.max(0, aiNumber(definition.score)) * completionFactor;
      const threat = Math.max(0, Math.round(aiNumber(definition.threat)));
      const threatPenalty = estimateAiJiuzheThreatPenalty(player, threat);
      return 5 + expectedScore * 2.2 - threatPenalty + Math.min(2, threat * 0.2);
    }

    function enrichAiJiuzheCardOptions(options, flow) {
      if (flow.type !== "jiuzhe-card" || flow.pending?.reason === "view") return options;
      const player = getAiAlienPendingPlayer(flow.pending);
      return options.map((option) => ({
        ...option,
        score: scoreAiJiuzheCardOption(option, player),
      }));
    }

    function listAiAlienUseOptions(flow) {
      const buttons = [...(els.scanTargetActions?.querySelectorAll(flow.selector) || [])];
      let options = buttons.map((button, index) => ({
        button,
        index,
        choice: flow.getChoice(button),
        label: button.textContent || button.title || button.getAttribute?.("aria-label") || "",
        disabled: Boolean(button.disabled),
      }));
      if (flow.type === "banrenma-bonus" && !options.some((option) => !option.disabled)) {
        const synthetic = (banrenma?.getAvailableBonusPositions?.(alienGameState) || [])
          .map((position, index) => ({
            button: null,
            index,
            choice: String(position),
            label: `半人马${position}号奖励`,
            disabled: false,
            synthetic: true,
          }));
        options.push(...synthetic);
      }
      if (flow.type === "jiuzhe-card" && !options.some((option) => !option.disabled) && flow.pending?.reason !== "view") {
        options.push({
          button: null,
          index: 999,
          choice: "skip",
          label: "放弃本次机会",
          disabled: false,
          synthetic: true,
        });
      }
      if (flow.type === "jiuzhe-card" && flow.pending?.reason !== "view") {
        const player = getAiAlienPendingPlayer(flow.pending);
        const cost = flow.pending?.cost || {};
        const needsPayment = Object.keys(cost).length > 0;
        if (needsPayment && player && !players.canAfford(player, cost)) {
          if (!options.some((option) => option.choice === "skip")) {
            options.push({
              button: null,
              index: 999,
              choice: "skip",
              label: "放弃本次机会",
              disabled: false,
              synthetic: true,
            });
          }
          for (const option of options) {
            if (option.choice !== "skip") option.disabled = true;
          }
        }
      }
      if (!options.length && flow.allowCancel) {
        options.push({
          button: null,
          index: 999,
          choice: "cancel",
          label: "取消",
          disabled: false,
        });
      }
      options = enrichAiJiuzheCardOptions(options, flow);
      return options;
    }

    function runAiAlienUseDecision() {
      const flows = getAiAlienUseFlows();
      if (!flows.length) return null;
      let flow = null;
      let options = [];
      let selected = null;
      for (const candidateFlow of flows) {
        const candidatePlayer = getAiAlienPendingPlayer(candidateFlow.pending);
        if (!isAiAutoBattlePlayer(candidatePlayer?.id)) {
          flow = candidateFlow;
          break;
        }
        const candidateOptions = listAiAlienUseOptions(candidateFlow);
        const candidateSelected = ai?.policy?.chooseAlienUseOption?.(candidateOptions, {
          playerState,
          turnState,
          currentPlayer: candidatePlayer,
          pendingType: candidateFlow.type,
        }) || candidateOptions.find((option) => !option.disabled && option.choice !== "cancel" && option.choice !== "skip") || candidateOptions.find((option) => !option.disabled) || null;
        if (candidateSelected) {
          flow = candidateFlow;
          options = candidateOptions;
          selected = candidateSelected;
          break;
        }
      }
      if (!flow && isActionEffectFlowActive()) return null;
      if (!flow) return { ok: false, blocked: true, message: "AI 没有可处理的外星人选项" };
      const player = getAiAlienPendingPlayer(flow.pending);
      if (!isAiAutoBattlePlayer(player?.id)) {
        return { ok: false, blocked: true, message: `${player?.colorLabel || "当前玩家"}需要人工处理${flow.label}` };
      }
      if (!selected) {
        return { ok: false, blocked: true, message: `AI 没有可用${flow.label}选项` };
      }

      recordAiAutoBattleLog("alien-use", `${player.colorLabel}AI 处理${flow.label}`, {
        pendingType: flow.type,
        selected: {
          choice: selected.choice,
          label: selected.label,
        },
        options: options.map((option) => ({
          choice: option.choice,
          label: option.label,
          disabled: option.disabled,
          score: option.score,
        })),
      });

      if (typeof flow.handleChoice === "function") {
        return flow.handleChoice(selected.choice);
      }
      selected.button?.click();
      return { ok: true, progressed: true, message: `AI 已处理${flow.label}` };
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

    function listAiResearchTechCandidates(options = null) {
      const currentPlayer = getCurrentPlayer();
      if (!currentPlayer) return [];
      createActionContext().ensurePlayerTechState(currentPlayer);
      if (!currentPlayer.techState) return [];

      const selectionOptions = getResearchTechSelectionOptions();
      const allowedTechTypes = (options ? tech.resolver.normalizeTechTypeFilter(options) : null)
        || tech.resolver.normalizeTechTypeFilter(selectionOptions)
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
      if (!isResearchSelectionEffect && !isTechTilePickingActive()) return null;
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
        const message = `${effect?.label || "选择科技"}：没有可研究科技候选，已跳过`;
        recordAiAutoBattleLog("tech-placement", `${currentPlayer.colorLabel}AI 跳过科技选择`, {
          effectId: effect?.id || null,
          effectType: effect?.type || null,
          candidates,
          message,
        });
        cancelTechSelection?.();
        skipCurrentActionEffect?.();
        return { ok: true, progressed: true, skipped: true, message };
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
        const industryCandidate = buildAiIndustryCandidate(currentPlayer);
        if (industryCandidate) candidates.push(industryCandidate);
        candidates.push(...listAiMoveCandidates());
        candidates.push(...listAiDataPlacementCandidates(currentPlayer));
        candidates.push(...listAiCardCornerQuickCandidates(currentPlayer));
        candidates.push({ id: "end-turn", kind: "end-turn", available: true });
        return candidates;
      }
      if (!canStartMainAction()) return candidates;

      const launchCheck = actions.canExecute("launch", context);
      const postLaunchMovePlan = launchCheck.ok ? scoreAiPostLaunchMovePlan(currentPlayer) : null;
      const lateLaunchPenalty = launchCheck.ok
        ? scoreAiLateLaunchDeadEndPenalty(currentPlayer, postLaunchMovePlan)
        : 0;
      const launchCost = scoreAiLaunchPaymentCost();
      const launchGain = launchCheck.ok
        ? scoreAiLaunchAction(currentPlayer)
          + applyAiStrategyWeight(Math.max(0, aiNumber(postLaunchMovePlan?.score)), "move", 0.45)
          - lateLaunchPenalty
        : 0;
      const launchCandidate = {
        id: "launch",
        kind: "main",
        available: launchCheck.ok,
        reason: launchCheck.message || null,
        plan: postLaunchMovePlan?.score > 0 ? postLaunchMovePlan : null,
        gain: launchGain,
        cost: launchCost,
        score: launchGain - launchCost,
        valueBreakdown: {
          launchGain,
          launchCost,
          postLaunchMovePlanScore: postLaunchMovePlan?.score || 0,
          lateLaunchPenalty,
        },
      };
      candidates.push(launchCandidate);
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
        choices: landCheck.choices || [],
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
      const immediatePlanetActionScore = Math.max(
        orbitCandidate.available ? Number(orbitCandidate.score || 0) : 0,
        landCandidate.available ? Number(landCandidate.score || 0) : 0,
      );
      let scanScore = scanCheck.ok ? scoreAiScanAction(currentPlayer) : 0;
      const scanPriorityFloor = scanCheck.ok ? scoreAiScanPriorityFloor(currentPlayer) : 0;
      if (immediatePlanetActionScore >= 12) {
        scanScore = Math.max(
          scanPriorityFloor,
          Math.min(scanScore, Math.max(0, immediatePlanetActionScore - 7)),
        );
      }
      if (getAiRoundNumber() <= 2 && launchCandidate.available && Number(launchCandidate.score || 0) >= 12) {
        scanScore = Math.max(
          scanPriorityFloor,
          Math.min(scanScore, Math.max(0, Number(launchCandidate.score || 0) - 8)),
        );
      }
      const bestEarlyMoveScore = getAiRoundNumber() <= 2
        ? listAiMoveCandidates().reduce((best, candidate) => Math.max(best, Number(candidate?.score || 0)), 0)
        : 0;
      if (bestEarlyMoveScore >= 10) {
        scanScore = Math.max(
          scanPriorityFloor,
          Math.min(scanScore, Math.max(0, bestEarlyMoveScore - 3)),
        );
      }
      candidates.push({
        id: "scan",
        kind: "main",
        available: scanCheck.ok,
        reason: scanCheck.message || null,
        score: scanScore,
        scoreCapReason: scanCheck.ok && immediatePlanetActionScore >= 12
          ? "优先兑现当前位置的环绕/登陆"
          : scanCheck.ok && getAiRoundNumber() <= 2 && launchCandidate.available && Number(launchCandidate.score || 0) >= 12
            ? "优先建立火箭数量"
            : scanCheck.ok && bestEarlyMoveScore >= 10
              ? "优先保持早期移动路线"
          : null,
      });
      const analyzeCheck = data.canAnalyzeData?.(currentPlayer) || { ok: false, message: "数据模块不可用" };
      candidates.push({
        id: "analyze",
        kind: "main",
        available: analyzeCheck.ok,
        reason: analyzeCheck.message || null,
        score: analyzeCheck.ok ? scoreAiAnalyzeAction(currentPlayer) : 0,
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
      const strongestNonLaunchMain = candidates
        .filter((candidate) => (
          candidate?.kind === "main"
          && candidate.available !== false
          && candidate.id !== "launch"
        ))
        .sort((left, right) => Number(right.score || 0) - Number(left.score || 0))[0] || null;
      const needsFirstThresholdCatchup = Math.max(1, Math.round(aiNumber(turnState.roundNumber) || 1)) >= FINAL_ROUND_NUMBER
        && Math.max(0, aiNumber(currentPlayer?.resources?.score)) < 25;
      const preMainMoveScoreCap = needsFirstThresholdCatchup && Number(strongestNonLaunchMain?.score || 0) >= 15
        ? Math.max(0, Number(strongestNonLaunchMain.score || 0) - 1)
        : null;
      const moveCandidates = listAiMoveCandidates().map((candidate) => {
        if (
          preMainMoveScoreCap == null
          || candidate.followupMainAction?.actionId
          || Number(candidate.score || 0) <= preMainMoveScoreCap
        ) {
          return candidate;
        }
        return {
          ...candidate,
          uncappedScore: candidate.score,
          score: preMainMoveScoreCap,
          scoreCapReason: `保留强主行动 ${strongestNonLaunchMain.id}`,
        };
      });
      candidates.push(...moveCandidates);
      const industryCandidate = buildAiIndustryCandidate(currentPlayer);
      if (industryCandidate) candidates.push(industryCandidate);
      candidates.push(...listAiDataPlacementCandidates(currentPlayer));
      candidates.push(...listAiCardCornerQuickCandidates(currentPlayer, playCardCandidates));
      candidates.push({
        id: "pass",
        kind: "pass",
        available: true,
        reason: null,
        score: -6 + (getAiStrategyWeight("pass") - 1) * 10,
      });
      return candidates;
    }

    function buildAiTurnDecisionCandidates(currentPlayer) {
      const rawCandidates = enumerateAiTurnActions();
      const markedFinalFormulas = getAiMarkedFinalFormulaEntries(currentPlayer);
      const graphState = {
        playerState,
        turnState,
        finalScoringState,
        currentPlayer,
        aiMarkedFinalFormulas: markedFinalFormulas,
      };
      const graphCandidates = ai?.actionGraph?.buildActionGraph
        ? ai.actionGraph.buildActionGraph(rawCandidates, graphState, currentPlayer?.id, {
          markedFormulas: markedFinalFormulas,
          hasMarkedFinalTile: markedFinalFormulas.length > 0,
        })
        : null;
      const candidates = Array.isArray(graphCandidates) && graphCandidates.length === rawCandidates.length
        ? graphCandidates.map((candidate, index) => ({
          ...rawCandidates[index],
          actionGraph: {
            gain: candidate.gain,
            cost: candidate.cost,
            finalMarginal: candidate.finalMarginal,
            goalBonus: candidate.goalBonus,
            feasibility: candidate.feasibility,
            net: candidate.net,
          },
          breakdown: candidate.breakdown,
        }))
        : rawCandidates;
      return { candidates, graphState };
    }

    function applyAiTurnAction(action, candidates, difficulty, currentPlayer) {
      if (!action) {
        return { ok: false, blocked: true, message: "AI 没有可执行行动", candidates };
      }
      recordAiAutoBattleLog("turn-action", `${currentPlayer.colorLabel}AI(${difficulty}) 执行 ${action.id}`, {
        action,
        candidates,
        difficulty,
        decisionPlan: action.decisionPlan || null,
        observation: action.compactObservation || null,
      });
      if (action.id === "end-turn") {
        endCurrentTurn();
        return { ok: true, progressed: true, action };
      }
      if (action.id === "launch") return runAction("launch");
      if (action.id === "researchTech") return researchTechForCurrentPlayer();
      if (action.id === "orbit") return orbitForCurrentPlayer();
      if (action.id === "land") return landForCurrentPlayer();
      if (action.id === "scan") return beginScanAction();
      if (action.id === "analyze") return analyzeDataForCurrentPlayer();
      if (action.id === "playCard") return beginPlayCardSelection();
      if (action.id === "cardCorner") return runAiCardCornerQuickActionDecision(action);
      if (action.id === "industry") {
        recordAiAutoBattleLog("industry", `${currentPlayer.colorLabel}AI 使用公司 1x：${action.companyLabel}`, {
          action,
        });
        const result = handleCompanyActionMarkerClick(action.industryCard);
        return result || { ok: true, progressed: true, action };
      }
      if (action.id === "move") return runAiMoveActionDecision(action);
      if (action.id === "placeData") return runPlaceDataToComputer();
      if (action.id === "pass") return passForCurrentPlayer();
      return { ok: false, blocked: true, message: `AI 尚不支持行动 ${action.id}`, action };
    }

    function runAiTurnActionDecision() {
      const currentPlayer = getCurrentPlayer();
      if (!isAiAutoBattlePlayer(currentPlayer?.id)) {
        return { ok: false, blocked: true, message: `${currentPlayer?.colorLabel || "当前玩家"}不是电脑玩家` };
      }
      const difficulty = getAiAutoBattlePlayerDifficulty(currentPlayer?.id);
      const { candidates, graphState } = buildAiTurnDecisionCandidates(currentPlayer);
      const action = chooseAiTurnActionByDifficulty(candidates, graphState, currentPlayer, difficulty);
      return applyAiTurnAction(action, candidates, difficulty, currentPlayer);
    }

    async function runAiTurnActionDecisionAsync() {
      const currentPlayer = getCurrentPlayer();
      if (!isAiAutoBattlePlayer(currentPlayer?.id)) {
        return { ok: false, blocked: true, message: `${currentPlayer?.colorLabel || "当前玩家"}不是电脑玩家` };
      }
      const difficulty = getAiAutoBattlePlayerDifficulty(currentPlayer?.id);
      const { candidates, graphState } = buildAiTurnDecisionCandidates(currentPlayer);
      const action = await chooseAiTurnActionByDifficultyAsync(candidates, graphState, currentPlayer, difficulty);
      return applyAiTurnAction(action, candidates, difficulty, currentPlayer);
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

        const techSelectionResult = runAiResearchTechSelectionDecision();
        if (techSelectionResult) return techSelectionResult;

        const handScanResult = runAiHandScanDecision();
        if (handScanResult) return handScanResult;

        const playCardResult = runAiPlayCardSelectionDecision();
        if (playCardResult) return playCardResult;

        const movePaymentResult = runAiMovePaymentDecision();
        if (movePaymentResult) return movePaymentResult;

        const landTargetResult = runAiLandTargetDecision();
        if (landTargetResult) return landTargetResult;

        const dataPlacementResult = runAiDataPlacementDecision();
        if (dataPlacementResult) return dataPlacementResult;

        const scanTargetResult = runAiScanTargetDecision();
        if (scanTargetResult) return scanTargetResult;

        const effectMoveResult = runAiActionEffectMoveDecision();
        if (effectMoveResult) return effectMoveResult;

        const cardTriggerResult = runAiCardTriggerDecision();
        if (cardTriggerResult) return cardTriggerResult;

        const cardTriggerMoveResult = runAiCardTriggerFreeMoveDecision();
        if (cardTriggerMoveResult) return cardTriggerMoveResult;

        const cardCornerMoveResult = runAiCardCornerFreeMoveDecision();
        if (cardCornerMoveResult) return cardCornerMoveResult;

        const industryFreeMoveResult = runAiIndustryFreeMoveDecision();
        if (industryFreeMoveResult) return industryFreeMoveResult;

        const scanAction4Result = runAiScanAction4Decision();
        if (scanAction4Result) return scanAction4Result;

        const cardTaskResult = runAiCardTaskCompletionDecision();
        if (cardTaskResult) return cardTaskResult;

        const alienUseResult = runAiAlienUseDecision();
        if (alienUseResult) return alienUseResult;

        const alienTraceResult = runAiAlienTraceDecision();
        if (alienTraceResult) return alienTraceResult;

        const effectResult = runAiActionEffectStep();
        if (effectResult) return effectResult;

        if (hasActivePendingSubFlow()) {
          return { ok: false, blocked: true, message: "AI 遇到尚未收口的 pending 流程" };
        }

        return runAiTurnActionDecision();
      } catch (error) {
        logAiMctsSearchTrace("automation-error", {
          roundNumber: turnState.roundNumber,
          turnNumber: turnState.turnNumber,
          currentPlayerId: playerState.currentPlayerId,
          message: error?.message || String(error),
          stack: error?.stack || null,
        });
        const entry = recordAiAutoBattleBug(error?.message || String(error), {
          stack: error?.stack || null,
        });
        return { ok: false, blocked: true, bug: entry, message: entry.message };
      }
    }

    async function runAiAutomationStepAsync() {
      try {
        if (!ai?.policy) return { ok: false, blocked: true, message: "SetiAI 未加载" };
        if (isGameEnded()) {
          return { ok: true, done: true, progressed: false, message: "游戏已结束" };
        }

        logAiMctsSearchTrace("automation-step-enter", {
          roundNumber: turnState.roundNumber,
          turnNumber: turnState.turnNumber,
          currentPlayerId: playerState.currentPlayerId,
          pendingSubFlow: hasActivePendingSubFlow(),
        });

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

        const techSelectionResult = runAiResearchTechSelectionDecision();
        if (techSelectionResult) return techSelectionResult;

        const handScanResult = runAiHandScanDecision();
        if (handScanResult) return handScanResult;

        const playCardResult = runAiPlayCardSelectionDecision();
        if (playCardResult) return playCardResult;

        const movePaymentResult = runAiMovePaymentDecision();
        if (movePaymentResult) return movePaymentResult;

        const landTargetResult = runAiLandTargetDecision();
        if (landTargetResult) return landTargetResult;

        const dataPlacementResult = runAiDataPlacementDecision();
        if (dataPlacementResult) return dataPlacementResult;

        const scanTargetResult = runAiScanTargetDecision();
        if (scanTargetResult) return scanTargetResult;

        const effectMoveResult = runAiActionEffectMoveDecision();
        if (effectMoveResult) return effectMoveResult;

        const cardTriggerResult = runAiCardTriggerDecision();
        if (cardTriggerResult) return cardTriggerResult;

        const cardTriggerMoveResult = runAiCardTriggerFreeMoveDecision();
        if (cardTriggerMoveResult) return cardTriggerMoveResult;

        const cardCornerMoveResult = runAiCardCornerFreeMoveDecision();
        if (cardCornerMoveResult) return cardCornerMoveResult;

        const industryFreeMoveResult = runAiIndustryFreeMoveDecision();
        if (industryFreeMoveResult) return industryFreeMoveResult;

        const scanAction4Result = runAiScanAction4Decision();
        if (scanAction4Result) return scanAction4Result;

        const cardTaskResult = runAiCardTaskCompletionDecision();
        if (cardTaskResult) return cardTaskResult;

        const alienUseResult = runAiAlienUseDecision();
        if (alienUseResult) return alienUseResult;

        const alienTraceResult = runAiAlienTraceDecision();
        if (alienTraceResult) return alienTraceResult;

        const effectResult = runAiActionEffectStep();
        if (effectResult) return effectResult;

        if (hasActivePendingSubFlow()) {
          logAiMctsSearchTrace("automation-blocked-pending-subflow", {
            roundNumber: turnState.roundNumber,
            turnNumber: turnState.turnNumber,
            currentPlayerId: playerState.currentPlayerId,
          });
          return { ok: false, blocked: true, message: "AI 遇到尚未收口的 pending 流程" };
        }

        logAiMctsSearchTrace("automation-ready-for-turn-decision", {
          roundNumber: turnState.roundNumber,
          turnNumber: turnState.turnNumber,
          currentPlayerId: playerState.currentPlayerId,
        });
        return await runAiTurnActionDecisionAsync();
      } catch (error) {
        const entry = recordAiAutoBattleBug(error?.message || String(error), {
          stack: error?.stack || null,
        });
        return { ok: false, blocked: true, bug: entry, message: entry.message };
      }
    }

    function waitAiAutoBattleDelay(delayMs) {
      const delay = Math.max(0, Math.round(Number(delayMs) || 0));
      return new Promise((resolve) => windowRef.setTimeout(resolve, delay));
    }

    function incrementAiAutoBattleStepReason(reasonCounts, reason) {
      if (!reasonCounts || !reason) return;
      const key = String(reason);
      reasonCounts[key] = (reasonCounts[key] || 0) + 1;
    }

    function getPrimaryAiPendingStepReason(pendingState) {
      if (!pendingState) return null;
      if (pendingState.actionEffectFlowActive && pendingState.currentEffect?.type) {
        return `effect:${pendingState.currentEffect.type}`;
      }
      if (pendingState.pendingScanTargetType) return `scanTarget:${pendingState.pendingScanTargetType}`;
      const pendingFlags = [
        "pendingPublicScanQueue",
        "pendingHandScan",
        "pendingPassReserve",
        "pendingCardSelection",
        "pendingPlayCardSelection",
        "pendingMovePayment",
        "pendingCardTrigger",
        "pendingCardTriggerFreeMove",
        "pendingCardCornerFreeMove",
        "pendingCardTaskCompletion",
        "pendingDataPlacement",
        "pendingAlienTrace",
        "pendingLandTarget",
        "pendingScanAction4",
        "pendingIndustryAbility",
        "pendingIndustryFreeMove",
        "pendingIndustryHandSelection",
        "pendingJiuzheCardPlay",
        "pendingYichangdianCardGain",
        "pendingYichangdianCornerAction",
        "pendingBanrenmaCardGain",
        "pendingBanrenmaOpportunity",
        "pendingChongTaskCompletion",
        "pendingChongCardGain",
        "pendingChongFossilChoice",
        "pendingAmibaCardGain",
        "pendingAmibaSymbolChoice",
        "pendingAmibaTraceRemoval",
        "pendingAomomoCardGain",
        "pendingRunezuCardGain",
        "pendingRunezuSymbolBranch",
        "pendingRunezuFaceSymbolPlacement",
      ];
      for (const key of pendingFlags) {
        if (pendingState[key]) return key;
      }
      if (pendingState.actionEffectFlowActive) {
        return "actionEffectFlowActive";
      }
      return null;
    }

    function getAiAutoBattleStepReason(result, beforePendingState, afterPendingState) {
      if (result?.done) return "game-ended";
      if (result?.blocked) return "blocked";
      if (result?.ok === false) return "error";
      if (result?.action) {
        const actionKind = result.action.kind || "unknown";
        const actionId = result.action.id || "unknown";
        return `turn-action:${actionKind}:${actionId}`;
      }
      const pendingReason = getPrimaryAiPendingStepReason(beforePendingState)
        || getPrimaryAiPendingStepReason(afterPendingState);
      if (pendingReason) return `pending:${pendingReason}`;
      if (result?.progressed) return "progressed:other";
      return "no-progress";
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
        stepReasonCounts: {},
        stopped: false,
        blocked: false,
        gameEnded: false,
        seed: randomSeed,
        message: null,
      };
      recordAiAutoBattleLog("start", `AI 自动对战开始，最多 ${maxSteps} 步`, { maxSteps, seed: randomSeed });

      while (aiAutoBattleState.running && summary.steps < maxSteps) {
        const beforePendingState = getAiAutoBattlePendingState();
        const beforeLogCount = aiAutoBattleState.logs.length;
        const result = await runAiAutomationStepAsync();
        summary.steps += 1;
        const afterPendingState = getAiAutoBattlePendingState();
        incrementAiAutoBattleStepReason(
          summary.stepReasonCounts,
          getAiAutoBattleStepReason(result, beforePendingState, afterPendingState),
        );
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
        summary.ok = false;
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
            actionSequences: analysis.actionSequences
              ? {
                windowTurns: analysis.actionSequences.windowTurns,
                winnerTopSequences: analysis.actionSequences.winnerTopSequences,
                nonWinnerTopSequences: analysis.actionSequences.nonWinnerTopSequences,
                winnerDeltaSequences: analysis.actionSequences.winnerDeltaSequences,
                mainActionTopSequences: analysis.actionSequences.mainActionTopSequences,
                globalTopSequences: analysis.actionSequences.globalTopSequences,
              }
              : null,
            scoreBuckets: analysis.scoreBuckets,
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
      const batchCooldownMs = Math.max(0, Math.round(Number(options.batchCooldownMs) || 0));
      const thermalMode = options.thermalMode === true;
      const thermalCooldownEvery = Math.max(1, Math.round(Number(options.thermalCooldownEvery) || 10));
      const thermalCooldownMs = Math.max(0, Math.round(Number(options.thermalCooldownMs) || 1200));
      let cooldownCount = 0;

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
        const analysisOptions = { sequenceWindowTurns: options.sequenceWindowTurns };
        const analysis = options.sequenceWindowTurns != null
          ? ai?.analytics?.analyzeBattleReport?.(report, analysisOptions) || null
          : report.analysis || ai?.analytics?.analyzeBattleReport?.(report, analysisOptions) || null;
        if (analysis) analyses.push(analysis);
        samples.push(compactAiAutoBattleSample({ ...report, analysis }, index + 1));
        if (stopOnBlocked && (
          report.lastSummary?.blocked
          || report.lastSummary?.ok === false
          || !report.lastSummary?.gameEnded
          || report.bugs?.length
        )) {
          break;
        }

        const hasNextGame = index + 1 < games;
        if (hasNextGame && batchCooldownMs > 0) {
          cooldownCount += 1;
          await waitAiAutoBattleDelay(batchCooldownMs);
        }
        if (hasNextGame && thermalMode && (index + 1) % thermalCooldownEvery === 0 && thermalCooldownMs > 0) {
          cooldownCount += 1;
          await waitAiAutoBattleDelay(thermalCooldownMs);
        }
      }

      const summary = ai?.analytics?.summarizeBattleAnalyses
        ? ai.analytics.summarizeBattleAnalyses(analyses, { sequenceWindowTurns: options.sequenceWindowTurns })
        : null;
      const blockedGames = samples.filter((sample) => sample.summary?.blocked || sample.bugCount > 0).length;
      const incompleteGames = samples.filter((sample) => !sample.summary?.gameEnded || sample.summary?.ok === false).length;
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
        ok: blockedGames === 0 && incompleteGames === 0 && samples.length === games,
        gamesRequested: games,
        gamesRun: samples.length,
        stoppedEarly: samples.length < games || incompleteGames > 0,
        summary,
        cooldownCount,
        throttle: {
          batchCooldownMs,
          thermalMode,
          thermalCooldownEvery,
          thermalCooldownMs,
        },
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
      getAiAutoBattlePlayerDifficulty,
      getAiAutoBattlePlayerDifficulties,
      getAiAutoBattlePlayerIds,
      getAiDifficultyProfile,
      getAiDifficultyProfiles,
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
