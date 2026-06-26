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
      initialCards,
      cardEffects,
      cardTaskStateModule,
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
      confirmStrategyPassiveSlotChoice,
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
      finishIndustryAbilityFlow,
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
      getReadyCardTasks,
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
      handlePublicCardClick,
      handlePublicScanCardClick,
      handleIndustryDeepspaceHandClick,
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
      openCardTaskCompletionPicker,
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
    const AI_MAX_CARD_CORNER_MOVES_PER_TURN = 1;
    const aiAutoBattleState = {
      enabled: false,
      running: false,
      playerIds: [],
      logs: [],
      bugs: [],
      bugCounts: {},
      turnMoveCounts: {},
      turnCardCornerMoveCounts: {},
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
    const AI_PLANET_OPTIMAL_MOVE_RANGES = Object.freeze({
      mercury: Object.freeze([3, 4]),
      venus: Object.freeze([2, 2]),
      mars: Object.freeze([1, 2]),
      jupiter: Object.freeze([2, 3]),
      saturn: Object.freeze([2, 3]),
      uranus: Object.freeze([3, 4]),
      neptune: Object.freeze([3, 4]),
    });
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

    function getAiAutoBattleScoreSnapshot() {
      return getActivePlayers().map((player) => ({
        playerId: player.id || null,
        playerLabel: player.colorLabel || player.name || player.color || null,
        score: Math.max(0, Math.round(aiNumber(player.resources?.score))),
        credits: Math.max(0, Math.round(aiNumber(player.resources?.credits))),
        energy: Math.max(0, Math.round(aiNumber(player.resources?.energy))),
        publicity: Math.max(0, Math.round(aiNumber(player.resources?.publicity))),
        availableData: Math.max(0, Math.round(aiNumber(player.resources?.availableData))),
        handSize: Array.isArray(player.hand)
          ? player.hand.length
          : Math.max(0, Math.round(aiNumber(player.resources?.handSize))),
        reservedCount: Array.isArray(player.reservedCards) ? player.reservedCards.length : 0,
        techCount: countAiPlayerTech(player),
      }));
    }

    function getAiAutoBattleEntryPlayer(details = {}) {
      const playerId = details.logPlayerId || details.ownerPlayerId || null;
      const playerColor = details.logPlayerColor || details.ownerPlayerColor || null;
      return (playerId ? getPlayerById(playerId) : null)
        || (playerColor ? getPlayerByColor(playerColor) : null)
        || getCurrentPlayer();
    }

    function createAiAutoBattleEntry(type, message, details = {}) {
      const currentPlayer = getAiAutoBattleEntryPlayer(details);
      const rawTurnNumber = turnState.turnNumber;
      return {
        id: aiAutoBattleState.logs.length + aiAutoBattleState.bugs.length + 1,
        type,
        roundNumber: turnState.roundNumber,
        turnNumber: getAiDisplayedTurnNumber(rawTurnNumber),
        rawTurnNumber,
        playerId: currentPlayer?.id || playerState.currentPlayerId || null,
        playerLabel: currentPlayer?.colorLabel || currentPlayer?.name || null,
        playerResources: currentPlayer
          ? {
            score: Math.max(0, Math.round(aiNumber(currentPlayer.resources?.score))),
            credits: Math.max(0, Math.round(aiNumber(currentPlayer.resources?.credits))),
            energy: Math.max(0, Math.round(aiNumber(currentPlayer.resources?.energy))),
            publicity: Math.max(0, Math.round(aiNumber(currentPlayer.resources?.publicity))),
            availableData: Math.max(0, Math.round(aiNumber(currentPlayer.resources?.availableData))),
            handSize: Array.isArray(currentPlayer.hand)
              ? currentPlayer.hand.length
              : Math.max(0, Math.round(aiNumber(currentPlayer.resources?.handSize))),
          }
          : null,
        scoreboard: getAiAutoBattleScoreSnapshot(),
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

    function getAiPlayerTechTypeCounts(player) {
      return AI_TECH_TYPES.reduce((counts, techType) => {
        counts[techType] = Math.max(0, aiNumber(endGameScoring?.countOwnedTech?.(player, techType)));
        return counts;
      }, {});
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
        pendingStrategyPassiveSlotChoice: Boolean(state.pendingStrategyPassiveSlotChoice),
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
      aiAutoStepPausedOnBug = false;
      recordAiAutoBattleLog("config", `默认电脑玩家：${aiPlayerIds.map(getPlayerLabelById).join("、")}`, {
        playerIds: aiPlayerIds,
        humanPlayerId: getDefaultHumanPlayerId(),
        mode: "default-human-vs-ai",
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
      aiAutoStepPausedOnBug = false;
      recordAiAutoBattleLog("config", `电脑玩家：${playerIds.map(getPlayerLabelById).join("、")}`, { playerIds });
      return { ok: true, playerIds: [...playerIds], message: "电脑玩家已配置" };
    }

    function getPendingPlayerId(pending) {
      return pending?.playerId
        || pending?.targetPlayerId
        || pending?.player?.id
        || null;
    }

    function getPendingAlienAutomationPlayerId() {
      const pendingEntries = [
        state.pendingAlienTraceAction,
        state.pendingJiuzheCardPlay?.reason === "view" ? null : state.pendingJiuzheCardPlay,
        state.pendingYichangdianCardGain,
        state.pendingYichangdianCornerAction,
        state.pendingBanrenmaCardGain,
        state.pendingBanrenmaOpportunity,
        state.pendingChongCardGain,
        state.pendingChongFossilChoice,
        state.pendingChongTaskCompletion,
        state.pendingAmibaCardGain,
        state.pendingAmibaSymbolChoice,
        state.pendingAmibaTraceRemoval,
        state.pendingAomomoCardGain,
        state.pendingRunezuCardGain,
        state.pendingRunezuFaceSymbolPlacement,
        state.pendingRunezuSymbolBranch,
      ];
      for (const pending of pendingEntries) {
        const playerId = getPendingPlayerId(pending);
        if (playerId) return playerId;
      }
      return null;
    }

    function getPendingAutomationPlayerId() {
      if (state.pendingDiscardAction?.player?.id) return state.pendingDiscardAction.player.id;
      if (state.pendingCardSelectionAction?.player?.id) return state.pendingCardSelectionAction.player.id;
      if (state.pendingPassReserveSelection?.playerId) return state.pendingPassReserveSelection.playerId;
      if (state.pendingHandScanAction?.player?.id) return state.pendingHandScanAction.player.id;
      if (state.pendingMovePayment?.player?.id) return state.pendingMovePayment.player.id;
      const alienPendingPlayerId = getPendingAlienAutomationPlayerId();
      if (alienPendingPlayerId) return alienPendingPlayerId;
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
      aiAutoBattleState.turnCardCornerMoveCounts = {};
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
      const incomeGainByIndex = isAiIncomeDiscardType(pendingType)
        ? (player.hand || []).map((card) => cards.getIncomeGainForCard?.(card) || null)
        : null;
      const incomePlanningEntries = incomeGainByIndex ? getAiIncomeFinalFormulaEntries(player) : [];
      const hasIncomeFinalFormula = incomeGainByIndex
        && incomePlanningEntries.length > 0;
      const dynamicIncomeIndexes = (hasIncomeFinalFormula || shouldAiUseRouteAwareIncomeDiscard(player, incomeGainByIndex))
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

    function shouldAiUseRouteAwareIncomeDiscard(player, incomeGainByIndex = []) {
      if (!player || !Array.isArray(incomeGainByIndex)) return false;
      const resources = player.resources || {};
      if (getAiRoundNumber() < 3) return false;
      if (Math.max(0, aiNumber(resources.score)) >= 25) return false;
      const hasEnergyIncome = incomeGainByIndex.some((gain) => aiNumber(gain?.energy) > 0);
      if (!hasEnergyIncome || aiNumber(resources.energy) > 0) return false;
      const ownsSatelliteTech = players.playerOwnsTech(player, "orange4", createActionContext());
      const hasNearPlanetRocket = getMovableTokensForPlayer(player.id)
        .some((rocket) => {
          const coordinate = rocketActions.getRocketSectorCoordinate(rocket);
          if (!coordinate) return false;
          const planet = getAiPlanetAtCoordinate(coordinate);
          if (planet && canAiPlanetAcceptLanding(planet.planetId, player)) return true;
          return solar.createSolarSnapshot(solarState).planetLocations
            .some((target) => target?.planetId !== "earth" && getAiSectorDistance(coordinate, target) <= 1);
        });
      return ownsSatelliteTech || hasNearPlanetRocket || getAiLiveScorePaceDeficit(player) > 25;
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
          const routeEnergyFit = scoreAiIncomeDiscardRouteEnergyFit(player, gain);
          const playValue = Math.max(0, scoreAiPlayCardValue(card));
          return {
            index,
            incomeScore,
            finalFormulaFit,
            routeEnergyFit,
            playValue,
            score: incomeScore + finalFormulaFit + routeEnergyFit - Math.min(8, playValue * 0.12),
          };
        })
        .filter((entry) => entry && Number.isFinite(entry.score))
        .sort((left, right) => (
          right.score - left.score
          || right.routeEnergyFit - left.routeEnergyFit
          || right.finalFormulaFit - left.finalFormulaFit
          || right.incomeScore - left.incomeScore
          || left.playValue - right.playValue
          || left.index - right.index
        ));
      if (ranked.length < target) return null;
      return ranked.slice(0, target).map((entry) => entry.index);
    }

    function scoreAiIncomeDiscardRouteEnergyFit(player = getCurrentPlayer(), incomeGain = {}) {
      if (!player || aiNumber(incomeGain?.energy) <= 0) return 0;
      const energy = Math.max(0, aiNumber(player.resources?.energy));
      if (energy > 1) return 0;
      let value = energy <= 0 ? 9 : 5;
      if (players.playerOwnsTech(player, "orange4", createActionContext())) value += 3;
      if (getAiLiveScorePaceDeficit(player) > 25) value += 2;
      return value;
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

    const AI_DEEPSPACE_SWAP_MIN_SCORE = 10;

    function scoreAiDeepspaceHandSwapCost(card, player = getCurrentPlayer()) {
      if (!card || !player) return Infinity;
      const playCandidate = buildAiPlayCardCandidate(card, -1, player);
      const playValue = Math.max(0, aiNumber(playCandidate?.score));
      const cornerValue = Math.max(0, scoreAiCardCornerOpportunity(card));
      const incomeGain = cards.getIncomeGainForCard?.(card) || null;
      const incomeValue = incomeGain ? Math.max(0, scoreAiIncomeOpportunityValue(player, incomeGain)) : 0;
      const typeCode = getCardTypeCode(card);
      const reserveBias = typeCode === 3 ? 3 : typeCode === 2 ? 1.5 : 0;
      return playValue * 0.65 + cornerValue * 0.35 + incomeValue * 0.18 + reserveBias;
    }

    function scoreAiDeepspaceSwapPair(handCard, publicCard, player = getCurrentPlayer()) {
      if (!handCard || !publicCard || !player) return -Infinity;
      const publicValue = scoreAiPublicPickCard(publicCard, player, "industry_deepspace_public");
      if (!Number.isFinite(Number(publicValue))) return -Infinity;
      const handCost = scoreAiDeepspaceHandSwapCost(handCard, player);
      if (!Number.isFinite(Number(handCost))) return -Infinity;
      const handPressure = Math.max(0, (player.hand || []).length - 4) * 0.75;
      return publicValue - handCost + handPressure;
    }

    function listAiDeepspaceSwapPairs(player = getCurrentPlayer(), fixedHandIndex = null) {
      if (!player || !(player.hand || []).length) return [];
      const handIndexes = Number.isInteger(Number(fixedHandIndex))
        ? [Number(fixedHandIndex)]
        : (player.hand || []).map((_card, index) => index);
      return handIndexes.flatMap((handIndex) => {
        const handCard = player.hand?.[handIndex] || null;
        if (!handCard) return [];
        return (cardState.publicCards || []).map((publicCard, slotIndex) => ({
          handIndex,
          handCard,
          slotIndex,
          publicCard,
          score: scoreAiDeepspaceSwapPair(handCard, publicCard, player),
          handCost: scoreAiDeepspaceHandSwapCost(handCard, player),
          publicValue: scoreAiPublicPickCard(publicCard, player, "industry_deepspace_public"),
        }));
      })
        .filter((entry) => entry.handCard && entry.publicCard && Number.isFinite(Number(entry.score)))
        .sort((left, right) => (
          Number(right.score || 0) - Number(left.score || 0)
          || Number(right.publicValue || 0) - Number(left.publicValue || 0)
          || Number(left.handCost || 0) - Number(right.handCost || 0)
          || left.handIndex - right.handIndex
          || left.slotIndex - right.slotIndex
        ));
    }

    function getAiBestDeepspaceSwap(player = getCurrentPlayer(), fixedHandIndex = null) {
      return listAiDeepspaceSwapPairs(player, fixedHandIndex)[0] || null;
    }

    function runAiCardSelectionDecision() {
      if (!isCardSelectionActive() && !isIndustryHandSelectionActive()) return null;
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

      if (pending.type === "industry_deepspace_hand") {
        const selected = getAiBestDeepspaceSwap(player);
        if (!selected || selected.score <= AI_DEEPSPACE_SWAP_MIN_SCORE) {
          return { ok: false, blocked: true, message: "AI 没有正收益的深空探测换牌目标" };
        }
        recordAiAutoBattleLog("industry", `${player.colorLabel}AI 选择深空探测换出手牌`, {
          pendingType: pending.type,
          handIndex: selected.handIndex,
          score: selected.score,
          handCost: selected.handCost,
          publicValue: selected.publicValue,
          handCard: selected.handCard,
          publicSlotIndex: selected.slotIndex,
          publicCard: selected.publicCard,
        });
        return handleIndustryDeepspaceHandClick(selected.handIndex);
      }

      if (pending.type === "industry_deepspace_public") {
        const selected = getAiBestDeepspaceSwap(player, pending.handIndex);
        if (!selected || selected.score <= AI_DEEPSPACE_SWAP_MIN_SCORE) {
          return { ok: false, blocked: true, message: "AI 没有正收益的深空探测公共牌目标" };
        }
        recordAiAutoBattleLog("industry", `${player.colorLabel}AI 选择深空探测换入公共牌`, {
          pendingType: pending.type,
          handIndex: selected.handIndex,
          slotIndex: selected.slotIndex,
          score: selected.score,
          handCost: selected.handCost,
          publicValue: selected.publicValue,
          handCard: selected.handCard,
          publicCard: selected.publicCard,
        });
        return handlePublicCardClick(selected.slotIndex);
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
      const unsupportedEffect = (ready?.effects || []).find((effect) => !canAiResolveAlienTraceEffect(effect, currentPlayer));
      if (unsupportedEffect) {
        return {
          ok: false,
          blocked: true,
          message: `${currentPlayer.colorLabel}AI 跳过无合法目标的任务奖励 ${cards.getCardLabel(ready?.card)}`,
        };
      }
      recordAiAutoBattleLog("card-task", `${currentPlayer.colorLabel}AI 确认完成任务 ${cards.getCardLabel(ready?.card)}`, {
        cardLabel: cards.getCardLabel(ready?.card),
        effectTypes: (ready?.effects || []).map((effect) => effect?.type || null).filter(Boolean),
      });
      return confirmCardTaskCompletion();
    }

    function scoreAiReadyCardTask(ready, player = getCurrentPlayer()) {
      if (!ready) return -Infinity;
      if ((ready.effects || []).some((effect) => !canAiResolveAlienTraceEffect(effect, player))) return -Infinity;
      const effectValue = (ready.effects || [])
        .reduce((total, effect) => total + scoreAiEffectValue(effect, { player }), 0);
      const directScore = (ready.effects || [])
        .reduce((total, effect) => total + Math.max(0, aiNumber(effect?.options?.gain?.score)), 0);
      const paceBonus = directScore > 0
        ? Math.min(10, getAiLiveScorePaceDeficit(player) * (getAiRoundNumber() >= 3 ? 0.12 : 0.06))
        : 0;
      return effectValue + directScore * 0.35 + paceBonus;
    }

    function runAiReadyCardTaskOpenDecision() {
      if (state.pendingCardTaskCompletion || isActionEffectFlowActive() || hasActivePendingSubFlow()) return null;
      if (typeof getReadyCardTasks !== "function" || typeof openCardTaskCompletionPicker !== "function") return null;
      const currentPlayer = getCurrentPlayer();
      if (!isAiAutoBattlePlayer(currentPlayer?.id)) return null;
      const selected = (getReadyCardTasks() || [])
        .map((ready, index) => ({
          ready,
          index,
          score: scoreAiReadyCardTask(ready, currentPlayer),
        }))
        .filter((entry) => entry.ready?.card && Number.isFinite(Number(entry.score)))
        .sort((left, right) => right.score - left.score || left.index - right.index)[0] || null;
      if (!selected) return null;
      recordAiAutoBattleLog("card-task-ready", `${currentPlayer.colorLabel}AI 打开已满足任务 ${cards.getCardLabel(selected.ready.card)}`, {
        cardLabel: cards.getCardLabel(selected.ready.card),
        taskId: selected.ready.task?.id || null,
        score: selected.score,
        effectTypes: (selected.ready.effects || []).map((effect) => effect?.type || null).filter(Boolean),
      });
      return openCardTaskCompletionPicker(selected.ready.card);
    }

    function aiNumber(value) {
      const number = Number(value);
      return Number.isFinite(number) ? number : 0;
    }

    function roundAiScore(value) {
      return Math.round(aiNumber(value) * 1000) / 1000;
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

    function getAiResourceValuesForRound() {
      if (ai?.valuation?.getPhaseResourceValues) {
        return ai.valuation.getPhaseResourceValues(getAiRoundNumber(), {
          resourceValues: AI_RESOURCE_VALUES,
          earlyResourceValues: { credits: 5, energy: 5, handSize: 4.4 },
        });
      }
      return getAiRoundNumber() <= 2
        ? {
          ...AI_RESOURCE_VALUES,
          credits: Math.max(AI_RESOURCE_VALUES.credits, 5),
          energy: Math.max(AI_RESOURCE_VALUES.energy, 5),
          handSize: Math.max(AI_RESOURCE_VALUES.handSize, 4.4),
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

    function estimateAiMovePayment(player = getCurrentPlayer(), requiredMovePoints = MOVE_ENERGY_COST, options = {}) {
      const points = Math.max(0, Math.round(aiNumber(requiredMovePoints)));
      const values = getAiResourceValuesForRound();
      const energy = Math.max(0, Math.round(aiNumber(player?.resources?.energy)));
      const cardCount = getAiMovePaymentCards(player).length;
      const preserveEnergy = Boolean(options.preserveEnergy);
      let remainingEnergy = energy;
      let remainingCards = cardCount;
      let total = 0;
      let energySpent = 0;
      let cardSpent = 0;
      for (let point = 0; point < points; point += 1) {
        if (remainingCards > 0 && (preserveEnergy || remainingEnergy <= 0)) {
          total += values.handSize;
          remainingCards -= 1;
          cardSpent += 1;
        } else if (remainingEnergy > 0) {
          total += values.energy;
          remainingEnergy -= 1;
          energySpent += 1;
        } else {
          total += values.energy;
          energySpent += 1;
        }
      }
      return {
        cost: total,
        energySpent,
        cardSpent,
        remainingEnergy: Math.max(0, energy - energySpent),
      };
    }

    function shouldAiPreserveEnergyForSatelliteRoute(player, coordinate, options = {}) {
      if (!player || !coordinate || !players.playerOwnsTech(player, "orange4", createActionContext())) return false;
      const planet = options.planet || getAiPlanetAtCoordinate(coordinate);
      const routeTarget = options.routeTarget || null;
      const targetPlanetId = planet?.planetId || (routeTarget?.kind === "planet" ? routeTarget.id : null);
      if (!targetPlanetId) return false;
      const distance = planet
        ? 0
        : Math.max(0, Math.round(aiNumber(routeTarget?.newDistance)));
      if (distance > 1) return false;
      const opportunity = getAiBestSatelliteLandingOpportunity(targetPlanetId, player);
      if (!opportunity || opportunity.directScore < 10) return false;
      const requiredMovePoints = Math.max(0, Math.round(aiNumber(options.requiredMovePoints ?? MOVE_ENERGY_COST)));
      const currentEnergy = Math.max(0, Math.round(aiNumber(player?.resources?.energy)));
      const energyAfterDefaultPayment = Math.max(0, currentEnergy - Math.min(currentEnergy, requiredMovePoints));
      return energyAfterDefaultPayment < opportunity.energyCost;
    }

    function shouldAiPreserveEnergyForPlanetCashout(player, coordinate, options = {}) {
      if (!player || !coordinate) return false;
      const requiredMovePoints = Math.max(0, Math.round(aiNumber(options.requiredMovePoints ?? MOVE_ENERGY_COST)));
      if (requiredMovePoints <= 0) return false;
      const currentEnergy = Math.max(0, Math.round(aiNumber(player?.resources?.energy)));
      if (currentEnergy <= 0 || getAiMovePaymentCards(player).length <= 0) return false;
      const routeTarget = options.routeTarget || null;
      const planet = options.planet || getAiPlanetAtCoordinate(coordinate);
      const arrivesAtPlanet = Boolean(planet)
        || (routeTarget?.kind === "planet" && Math.max(0, Math.round(aiNumber(routeTarget?.newDistance))) === 0);
      if (!arrivesAtPlanet) return false;
      const defaultPayment = estimateAiMovePayment(player, requiredMovePoints, { preserveEnergy: false });
      const preservedPayment = estimateAiMovePayment(player, requiredMovePoints, { preserveEnergy: true });
      if (preservedPayment.remainingEnergy <= defaultPayment.remainingEnergy) return false;
      const playerAfterPreservedMove = {
        ...player,
        resources: {
          ...(player.resources || {}),
          energy: preservedPayment.remainingEnergy,
        },
      };
      const followup = scoreAiFollowupMainActionAfterMove(coordinate, playerAfterPreservedMove, {
        ignoreMainActionUsed: true,
      });
      return Math.max(0, aiNumber(followup.score)) >= 8;
    }

    function shouldAiPreserveEnergyForRouteCashout(player, coordinate, options = {}) {
      return shouldAiPreserveEnergyForSatelliteRoute(player, coordinate, options)
        || shouldAiPreserveEnergyForPlanetCashout(player, coordinate, options);
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
      return estimateAiMovePayment(player, requiredMovePoints).cost;
    }

    function countAiFinalMarksForPlayer(player = getCurrentPlayer()) {
      if (!player) return 0;
      finalScoring.ensureFinalScoringState(finalScoringState);
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
      finalScoring.ensureFinalScoringState(finalScoringState);
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
      const roundPaceTarget = getAiLiveScorePaceTarget();
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
      const thresholdValue = nextThreshold === 50 ? 18 : nextThreshold === 70 ? 18 : 9;
      let value = 0;
      if (afterScore >= nextThreshold) {
        value += thresholdValue;
      } else if (distance <= 12) {
        value += Math.min(gain, distance) * (nextThreshold === 70 ? 0.9 : nextThreshold === 50 ? 0.85 : 0.55);
        value += Math.max(0, 12 - distance) * 0.35;
      }
      if (roundPaceTarget && currentScore < roundPaceTarget) {
        const paceDistance = roundPaceTarget - currentScore;
        value += Math.min(
          getAiRoundNumber() >= 3 ? 24 : 16,
          gain * (getAiRoundNumber() >= 3 ? 1.55 : 0.95) + paceDistance * (getAiRoundNumber() >= 3 ? 0.08 : 0.06),
        );
        if (afterScore >= roundPaceTarget) value += roundPaceTarget >= 70 ? 14 : 8;
      }
      if (finalMarks > 0 && nextThreshold === 50) value += Math.min(5, gain * 0.45);
      return value;
    }

    function scoreAiPaceValueForDirectScore(scoreGain, player = getCurrentPlayer(), options = {}) {
      const gain = Math.max(0, aiNumber(scoreGain));
      if (!gain || !player) return 0;
      const round = getAiRoundNumber();
      const deficit = getAiLiveScorePaceDeficit(player);
      const baseWeight = options.baseWeight ?? (round >= 3 ? 0.5 : round === 2 ? 0.32 : 0.16);
      const deficitWeight = round >= 3 ? 0.012 : round === 2 ? 0.007 : 0.003;
      const pressureWeight = options.pressureWeight ?? (round >= 3 ? 0.22 : 0.12);
      return gain * (baseWeight + Math.min(0.35, deficit * deficitWeight))
        + scoreAiThresholdPressureForScoreGain(gain, player) * pressureWeight;
    }

    function scoreAiNoDirectScorePacePenalty(player = getCurrentPlayer(), options = {}) {
      if (!player) return 0;
      const round = getAiRoundNumber();
      if (round > 3) return 0;
      const deficit = getAiLiveScorePaceDeficit(player);
      const grace = options.grace ?? (round <= 1 ? 20 : 12);
      if (deficit <= grace) return 0;
      const urgency = options.urgency ?? (round >= 3 ? 0.18 : round === 2 ? 0.1 : 0.04);
      const cap = options.cap ?? (round >= 3 ? 14 : 8);
      return Math.min(cap, (deficit - grace) * urgency);
    }

    function getAiRemainingRoundWeight() {
      const round = Math.max(1, Math.round(aiNumber(turnState.roundNumber) || 1));
      return Math.max(1, FINAL_ROUND_NUMBER - round + 1);
    }

    function getAiRoundNumber() {
      return Math.max(1, Math.round(aiNumber(turnState.roundNumber) || 1));
    }

    function getAiLiveScorePaceTarget() {
      const round = getAiRoundNumber();
      if (round <= 1) return 25;
      if (round === 2) return 50;
      if (round === 3) return 70;
      return 0;
    }

    function getAiLiveScorePaceDeficit(player = getCurrentPlayer()) {
      const target = getAiLiveScorePaceTarget();
      if (!target || !player) return 0;
      return Math.max(0, target - Math.max(0, aiNumber(player.resources?.score)));
    }

    function scoreAiPassAction(player = getCurrentPlayer()) {
      const deficit = getAiLiveScorePaceDeficit(player);
      if (getAiRoundNumber() <= 3 && deficit > 25) return -4;
      if (getAiRoundNumber() <= 3 && deficit > 10) return -2;
      return -0.5;
    }

    function getAiActionGraphBaseNet(candidate = {}) {
      const breakdown = candidate.breakdown || {};
      const explicitScore = Number.isFinite(Number(breakdown.existingScore))
        ? aiNumber(breakdown.existingScore)
        : null;
      if (explicitScore != null) return explicitScore;
      return aiNumber(candidate.gain ?? breakdown.gain) - aiNumber(candidate.cost ?? breakdown.cost);
    }

    function getAiBestNestedCandidateScore(rawCandidate = {}) {
      const nested = rawCandidate.id === "playCard"
        ? rawCandidate.playableCards
        : rawCandidate.id === "researchTech"
          ? rawCandidate.takeable
          : null;
      if (!Array.isArray(nested) || !nested.length) return null;
      return nested.reduce((best, candidate) => (
        Math.max(best, aiNumber(candidate?.score))
      ), -Infinity);
    }

    function adjustAiActionGraphCandidate(rawCandidate = {}, graphCandidate = {}, player = getCurrentPlayer()) {
      const actionId = String(rawCandidate.id || graphCandidate.id || "");
      const round = getAiRoundNumber();
      const deficit = getAiLiveScorePaceDeficit(player);
      if (round > 3 || deficit <= 0) return graphCandidate;
      const broadGoalActions = new Set(["playCard", "researchTech", "scan"]);
      if (!broadGoalActions.has(actionId)) return graphCandidate;

      const baseNet = getAiActionGraphBaseNet(graphCandidate);
      const goalBonus = aiNumber(graphCandidate.goalBonus ?? graphCandidate.breakdown?.goalBonus);
      if (!goalBonus) return graphCandidate;

      const nestedBestScore = getAiBestNestedCandidateScore(rawCandidate);
      const effectiveBase = nestedBestScore == null
        ? baseNet
        : Math.min(baseNet, nestedBestScore);
      let goalBonusScale = 1;
      let urgencyPenalty = 0;

      if (actionId === "scan" && rawCandidate.scoreCapReason) {
        goalBonusScale = Math.min(goalBonusScale, 0.2);
        urgencyPenalty += Math.min(5, goalBonus * 0.2);
      }

      if (effectiveBase < 0) {
        goalBonusScale = Math.min(goalBonusScale, actionId === "scan" ? 0.35 : 0.15);
        urgencyPenalty += Math.min(10, Math.abs(effectiveBase) * 0.75 + deficit * 0.08);
      } else if (effectiveBase < 4 && deficit > 20) {
        goalBonusScale = Math.min(goalBonusScale, actionId === "scan" ? 0.65 : 0.35);
        urgencyPenalty += Math.min(6, (4 - effectiveBase) * 0.8 + deficit * 0.04);
      } else if (effectiveBase < 8 && deficit > 35) {
        goalBonusScale = Math.min(goalBonusScale, actionId === "scan" ? 0.85 : 0.65);
        urgencyPenalty += Math.min(4, (8 - effectiveBase) * 0.35);
      }

      if (goalBonusScale >= 1 && urgencyPenalty <= 0) return graphCandidate;

      const finalMarginal = aiNumber(graphCandidate.finalMarginal ?? graphCandidate.breakdown?.finalMarginal);
      const feasibility = Math.min(1, Math.max(0, aiNumber(graphCandidate.feasibility ?? graphCandidate.breakdown?.feasibility ?? 1)));
      const adjustedGoalBonus = goalBonus * goalBonusScale;
      const adjustedNet = (baseNet + finalMarginal + adjustedGoalBonus - urgencyPenalty) * feasibility;
      return {
        ...graphCandidate,
        goalBonus: roundAiScore(adjustedGoalBonus),
        net: roundAiScore(adjustedNet),
        breakdown: {
          ...(graphCandidate.breakdown || {}),
          goalBonusUnadjusted: roundAiScore(goalBonus),
          goalBonusScale: roundAiScore(goalBonusScale),
          urgencyPenalty: roundAiScore(urgencyPenalty),
          net: roundAiScore(adjustedNet),
        },
      };
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
      const energyNeed = aiNumber(gain.energy) > 0
        ? Math.max(0, 3 - aiNumber(resources.energy)) * (getAiRoundNumber() <= 2 ? 1.15 : 0.55)
        : 0;
      const handNeed = aiNumber(gain.handSize) > 0
        ? Math.max(0, 4 - aiNumber(resources.handSize)) * (getAiRoundNumber() <= 2 ? 0.85 : 0.45)
        : 0;
      const earlyIncomeTargetBonus = getAiRoundNumber() <= 1
        ? Math.min(4, scoreAiResourceBundle(gain) * 0.45 + earlyPressure * 1.2)
        : getAiRoundNumber() === 2
          ? Math.min(2.5, scoreAiResourceBundle(gain) * 0.28 + earlyPressure * 0.6)
          : 0;
      const markedFinalValue = scoreAiMarkedIncomeFinalValue(player, gain);
      return Math.max(0, netValue + creditNeed + energyNeed + handNeed + earlyIncomeTargetBonus + markedFinalValue);
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
          return getAiResourceValuesForRound().handSize + 1.4
            + Math.max(0, 3 - (player?.hand || []).length) * 0.45;
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
      const traceType = options.traceType || picker.selectedTraceType || picker.allowedTraceTypes?.[0];
      const alienSlotId = options.alienSlotId ?? picker.selectedAlienSlotId;
      const value = ai?.valuation?.estimateAlienTraceValue
        ? ai.valuation.estimateAlienTraceValue({
          alienGameState,
          player: options.player || getCurrentPlayer(),
          traceType,
          alienSlotId,
          mode: options.mode || picker.mode,
          position: options.position,
          label: options.label,
          reward: options.reward,
          activeOpponentCount: getAiActiveOpponentCount(options.player || getCurrentPlayer()),
          competition: true,
        })
        : 5;
      const slot = aliens?.getAlienSlot?.(alienGameState, alienSlotId);
      const traceSlot = traceType && slot?.traces ? slot.traces[traceType] : null;
      if (slot && !slot.revealed && traceType && !traceSlot?.firstPlaced) {
        const placedCount = AI_TRACE_TYPES.reduce((total, type) => (
          total + (slot.traces?.[type]?.firstPlaced ? 1 : 0)
        ), 0);
        const round = getAiRoundNumber();
        let earlyTracePremium = round <= 2 ? 6 : round === 3 ? 3 : 0;
        if (placedCount >= 2) earlyTracePremium += 5;
        else if (placedCount === 1) earlyTracePremium += 2.5;
        return value + earlyTracePremium;
      }
      return value;
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

    function getAiPlayerCompanyBaseIncome(player = getCurrentPlayer()) {
      const industryEffect = initialCards?.getIndustryEffect?.(player?.initialSelection?.industry);
      return players.normalizeIncome(industryEffect?.baseIncome || null);
    }

    function scoreAiCountedResourceGain(gain = {}, player = getCurrentPlayer()) {
      return scoreAiResourceBundle(gain)
        + scoreAiThresholdPressureForScoreGain(gain.score, player);
    }

    function getAiConditionalProgress(current, target) {
      const required = Math.max(1, aiNumber(target));
      const value = Math.max(0, aiNumber(current));
      if (value >= required) return { met: true, multiplier: 1 };
      const missing = required - value;
      const closeBonus = missing <= 1 ? 0.28 : missing <= 2 ? 0.14 : 0;
      return {
        met: false,
        multiplier: Math.max(0.04, Math.min(0.45, (value / required) * 0.22 + closeBonus)),
      };
    }

    function getAiConditionRewardMultiplier(condition, player = getCurrentPlayer()) {
      if (!condition) return { met: true, multiplier: 1 };
      const type = condition.type;
      if (type === "resourceThreshold") {
        return getAiConditionalProgress(player?.resources?.[condition.resource], condition.count || 1);
      }
      if (type === "resourceEquals") {
        const current = Math.max(0, aiNumber(player?.resources?.[condition.resource]));
        const target = Math.max(0, aiNumber(condition.count));
        if (current === target) return { met: true, multiplier: 1 };
        return { met: false, multiplier: target === 0 && current <= 1 ? 0.25 : 0.06 };
      }
      if (type === "techCount") {
        return getAiConditionalProgress(endGameScoring.countOwnedTech(player, condition.techType), condition.count || 1);
      }
      if (type === "traceCount") {
        return getAiConditionalProgress(countAiTraceMarkersForPlayer(player), condition.count || 1);
      }
      if (type === "dataTotal") {
        return getAiConditionalProgress(player?.resources?.availableData, condition.count || 1);
      }
      if (type === "planetOrbitOrLand") {
        const hasMarker = endGameScoring.countPlanetOrbitOrLand?.(player, planetStatsState, condition.planetId) > 0;
        return hasMarker ? { met: true, multiplier: 1 } : { met: false, multiplier: 0.18 };
      }
      return { met: false, multiplier: 0.18 };
    }

    function scoreAiEffectValue(effect, options = {}) {
      if (!effect) return 0;
      const type = effect.type;
      const effectOptions = effect.options || {};
      const player = options.player || getCurrentPlayer();
      switch (type) {
        case planetRewards.EFFECT_TYPES?.GAIN_RESOURCES:
        case "gain_resources": {
          const gain = effectOptions.gain || {};
          return scoreAiCountedResourceGain(gain, player);
        }
        case planetRewards.EFFECT_TYPES?.GAIN_DATA:
        case "gain_data":
          return Math.max(0, Math.round(aiNumber(effectOptions.count || 1))) * AI_RESOURCE_VALUES.availableData;
        case planetRewards.EFFECT_TYPES?.INCOME:
        case "income":
          return scoreAiIncomeOpportunityValue(
            player,
            effectOptions.gain || effectOptions.income || { credits: 1 },
          );
        case planetRewards.EFFECT_TYPES?.ALIEN_TRACE:
        case "alien_trace":
          return scoreAiAlienTraceValue({
            player,
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
        case cardEffects.EFFECT_TYPES.CARD_ORBIT: {
          const check = actions.canExecute("orbit", createActionContext());
          if (!check.ok) return 9;
          const directScore = getAiOrbitDirectScoreGain(check.planet?.planetId, player);
          const rewardValue = scoreAiOrbitRewardValue(check.planet?.planetId, player);
          return Math.max(9, rewardValue * 0.65 + directScore * 0.4 + scoreAiPaceValueForDirectScore(directScore, player));
        }
        case cardEffects.EFFECT_TYPES.CARD_LAND:
        case "aomomo_land_only": {
          const check = actions.canExecute("land", createActionContext());
          if (!check.ok) return 11;
          const selected = chooseAiLandChoice(check.choices || [], player)?.choice || null;
          const target = selected?.target || { type: "planet" };
          const directScore = getAiLandDirectScoreGainForTarget(check.planet?.planetId, target, player);
          const rewardValue = scoreAiLandRewardValueForTarget(check.planet?.planetId, target, player);
          return Math.max(11, rewardValue * 0.7 + directScore * 0.45 + scoreAiPaceValueForDirectScore(directScore, player));
        }
        case cardEffects.EFFECT_TYPES.PUBLIC_SCAN:
          return 4.5;
        case cardEffects.EFFECT_TYPES.HAND_SCAN:
          return effectOptions.optional ? 2 : 3;
        case cardEffects.EFFECT_TYPES.COUNT_HAND_INCOME_RESOURCE: {
          const incomeCode = Number(effectOptions.incomeCode);
          const resource = effectOptions.resource || "energy";
          const per = Math.max(0, aiNumber(effectOptions.per || 1));
          const count = (player?.hand || [])
            .filter((card) => Number(cards.getIncomeCodeForCard(card)) === incomeCode)
            .length;
          return scoreAiCountedResourceGain({ [resource]: Math.round(count * per) }, player);
        }
        case cardEffects.EFFECT_TYPES.COUNT_CURRENT_INCOME_RESOURCE: {
          const incomeKey = effectOptions.incomeKey || "credits";
          const resource = effectOptions.resource || "score";
          const per = Math.max(0, aiNumber(effectOptions.per || 1));
          const currentIncomeCount = Math.max(0, Math.round(aiNumber(player?.income?.[incomeKey])));
          const companyBaseIncome = getAiPlayerCompanyBaseIncome(player);
          const baseIncomeCount = Math.max(0, Math.round(aiNumber(companyBaseIncome?.[incomeKey])));
          const count = Math.max(0, currentIncomeCount - baseIncomeCount);
          return scoreAiCountedResourceGain({ [resource]: Math.round(count * per) }, player);
        }
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
            .reduce((total, reward) => total + scoreAiEffectValue(reward, options), 0)
            * 0.8
            * getAiConditionRewardMultiplier(effectOptions.condition, player).multiplier;
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

    function getAiTaskRewardValue(task, player = getCurrentPlayer()) {
      return (task?.rewards || []).reduce((total, reward) => (
        total + scoreAiEffectValue(reward, { player })
      ), 0);
    }

    function getAiTaskDirectScoreReward(task, player = getCurrentPlayer()) {
      return getAiRewardDirectScore(task?.rewards || [], player);
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
      const committedTask = Math.max(0, aiNumber(weight)) >= 0.8;
      const rewardValue = getAiTaskRewardValue(task, player);
      const directScoreReward = committedTask ? getAiTaskDirectScoreReward(task, player) : 0;
      const directScorePressure = scoreAiThresholdPressureForScoreGain(directScoreReward, player);
      const rewardWeight = Math.max(
        1,
        rewardValue * 0.18
          + directScoreReward * 0.28
          + directScorePressure * 0.12,
      );
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
          addAiPlanetDemand(
            demand,
            condition.planetId,
            amount * (1.2 + Math.min(1.1, directScoreReward * 0.1)),
          );
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

    function scoreAiCardLaunchRouteValue(effect, player = getCurrentPlayer()) {
      if (!effect || effect.type !== "launch" || !player) {
        return {
          savedCost: 0,
          postLaunchMoveScore: 0,
          postLaunchMovePlan: null,
        };
      }
      const standardCost = scoreAiLaunchPaymentCost();
      const actualCost = scoreAiLaunchPaymentCost(effect.options || {});
      const savedCost = Math.max(0, standardCost - actualCost);
      const postLaunchMovePlan = scoreAiPostLaunchMovePlan(player);
      return {
        savedCost,
        postLaunchMoveScore: Math.max(0, aiNumber(postLaunchMovePlan?.score)),
        postLaunchMovePlan,
      };
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
      const getMovePreview = (effect, effectIndex) => {
        if (!effect) return null;
        const candidates = listAiEffectMoveCandidates({
          id: "playCardMovePreview",
          free: effect.type === cardEffects.EFFECT_TYPES.FREE_MOVE,
          effect,
          poolRemaining: effect?.options?.movementPoints ?? 1,
          nextEffect: playEffects[effectIndex + 1] || null,
        });
        return candidates
          .filter((candidate) => Number.isFinite(Number(candidate?.score)))
          .sort((left, right) => Number(right.score || 0) - Number(left.score || 0))[0] || null;
      };

      const routeDemand = getAiTotalRouteDemand(demand);
      const planetDemand = sumAiDemandMap(demand.planetIds);
      const moveDemand = getAiMapDemand(demand.actions, "move");
      const scanDemand = getAiMapDemand(demand.actions, "scan") + sumAiDemandMap(demand.scanColors) * 0.35;
      const engineDemand = getAiMapDemand(demand.actions, "playCard") + demand.task * 0.08 + demand.final * 0.08;
      const endGameExpectedScore = scoreAiCardEndGameExpectedValue(card, model, player);

      for (let effectIndex = 0; effectIndex < (playEffects || []).length; effectIndex += 1) {
        const effect = playEffects[effectIndex];
        const type = effect?.type;
        const options = effect?.options || {};
        if (type === "launch") {
          const launchRoute = scoreAiCardLaunchRouteValue(effect, player);
          const postLaunchMoveScore = Math.max(0, aiNumber(launchRoute.postLaunchMoveScore));
          addPlan(
            "launch",
            "打牌触发发射路线",
            getAiMapDemand(demand.actions, "launch") * 0.18
              + routeDemand * 0.08
              + Math.max(0, scoreAiLaunchAction(player)) * 0.12
              + postLaunchMoveScore * (getAiRoundNumber() >= 3 ? 0.42 : 0.28)
              + Math.max(0, aiNumber(launchRoute.savedCost)) * 0.12,
            {
              effectType: type,
              postLaunchMoveScore,
              postLaunchMovePlan: launchRoute.postLaunchMovePlan || null,
            },
          );
        } else if (type === cardEffects.EFFECT_TYPES.CARD_MOVE || type === cardEffects.EFFECT_TYPES.FREE_MOVE) {
          const movePreview = getMovePreview(effect, effectIndex);
          const previewScore = Math.max(0, aiNumber(movePreview?.score));
          const arrivesAtPlanet = movePreview?.routeTarget?.kind === "planet"
            && Math.max(0, Math.round(aiNumber(movePreview.routeTarget.newDistance))) === 0;
          addPlan(
            "move",
            "打牌获得移动并靠近路线目标",
            moveDemand * 0.2
              + routeDemand * 0.08
              + Math.max(0, aiNumber(options.movementPoints || 1)) * 0.45
              + previewScore * (arrivesAtPlanet ? 0.45 : 0.28),
            {
              effectType: type,
              movementPoints: options.movementPoints ?? null,
              movePreview: movePreview
                ? {
                  score: movePreview.score,
                  routeTarget: movePreview.routeTarget || null,
                  from: movePreview.from || null,
                  to: movePreview.to || null,
                  direction: movePreview.direction || null,
                  followupLanding: movePreview.followupLanding || null,
                }
                : null,
            },
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
          const launchRoute = scoreAiCardLaunchRouteValue(effect, player);
          const postLaunchMoveScore = Math.max(0, aiNumber(launchRoute.postLaunchMoveScore));
          return total + Math.max(
            2,
            savedCost
              + Math.max(0, scoreAiLaunchAction(player)) * 0.2
              + postLaunchMoveScore * (getAiRoundNumber() >= 3 ? 0.22 : 0.14),
          );
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
      const hasPersistentModeledValue = Boolean(
        model?.tasks?.length
        || model?.triggers?.length
        || model?.endGameScoring
        || model?.pluto
      );
      const reserveValue = reservesAfterPlay && hasPersistentModeledValue
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
      const directScoreGain = details.directScoreGain ?? getAiRewardDirectScore(playEffects, player);
      const directScorePaceValue = scoreAiPaceValueForDirectScore(directScoreGain, player, {
        baseWeight: getAiRoundNumber() >= 3 ? 0.45 : getAiRoundNumber() === 2 ? 0.28 : 0.12,
        pressureWeight: getAiRoundNumber() >= 3 ? 0.2 : 0.1,
      });
      return effectValue
        + reserveValue
        + endGameValue
        + plutoValue
        + demandFit
        + standardActionPremium
        + directScorePaceValue
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

    function getAiPlanetOptimalMoveRange(planetId) {
      const range = AI_PLANET_OPTIMAL_MOVE_RANGES[planetId];
      if (!range) return null;
      return {
        min: Math.max(0, Math.round(aiNumber(range[0]))),
        max: Math.max(0, Math.round(aiNumber(range[1]))),
      };
    }

    function scoreAiPlanetMoveDistanceFit(planetId, distance) {
      const range = getAiPlanetOptimalMoveRange(planetId);
      if (!range) return 0;
      const steps = Math.max(0, Math.round(aiNumber(distance)));
      if (steps === 0) return 0;
      if (steps >= range.min && steps <= range.max) return getAiRoundNumber() <= 2 ? 3.5 : 2;
      if (steps < range.min) return 1;
      return -Math.max(0, steps - range.max) * (getAiRoundNumber() <= 2 ? 3.5 : 2.4);
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

    function getAiEffectDirectScore(effect, player = getCurrentPlayer()) {
      if (!effect) return 0;
      const type = effect.type;
      const effectOptions = effect.options || {};
      if (type === planetRewards.EFFECT_TYPES?.GAIN_RESOURCES || type === "gain_resources") {
        return Math.max(0, aiNumber(effectOptions.gain?.score));
      }
      if (type === cardEffects.EFFECT_TYPES.COUNT_HAND_INCOME_RESOURCE) {
        if ((effectOptions.resource || "energy") !== "score") return 0;
        const incomeCode = Number(effectOptions.incomeCode);
        const per = Math.max(0, aiNumber(effectOptions.per || 1));
        const count = (player?.hand || [])
          .filter((card) => Number(cards.getIncomeCodeForCard(card)) === incomeCode)
          .length;
        return Math.max(0, Math.round(count * per));
      }
      if (type === cardEffects.EFFECT_TYPES.COUNT_CURRENT_INCOME_RESOURCE) {
        if ((effectOptions.resource || "score") !== "score") return 0;
        const incomeKey = effectOptions.incomeKey || "credits";
        const per = Math.max(0, aiNumber(effectOptions.per || 1));
        const currentIncomeCount = Math.max(0, Math.round(aiNumber(player?.income?.[incomeKey])));
        const companyBaseIncome = getAiPlayerCompanyBaseIncome(player);
        const baseIncomeCount = Math.max(0, Math.round(aiNumber(companyBaseIncome?.[incomeKey])));
        return Math.max(0, Math.round(Math.max(0, currentIncomeCount - baseIncomeCount) * per));
      }
      if (type === cardEffects.EFFECT_TYPES.CONDITIONAL_REWARD) {
        return (effectOptions.rewards || [])
          .reduce((total, reward) => total + getAiEffectDirectScore(reward, player), 0)
          * 0.8
          * getAiConditionRewardMultiplier(effectOptions.condition, player).multiplier;
      }
      if (type === cardEffects.EFFECT_TYPES.CARD_ORBIT) {
        const check = actions.canExecute("orbit", createActionContext());
        return check.ok ? getAiOrbitDirectScoreGain(check.planet?.planetId, player) : 0;
      }
      if (type === cardEffects.EFFECT_TYPES.CARD_LAND || type === "aomomo_land_only") {
        const check = actions.canExecute("land", createActionContext());
        return check.ok ? getAiBestLandDirectScoreGain(check.planet?.planetId, check.choices || [], player) : 0;
      }
      return 0;
    }

    function getAiRewardDirectScore(effects = [], player = getCurrentPlayer()) {
      return (effects || []).reduce((total, effect) => (
        total + getAiEffectDirectScore(effect, player)
      ), 0);
    }

    function getAiOrbitDirectScoreGain(planetId, player = getCurrentPlayer()) {
      if (!planetId) return 0;
      const sequence = Math.max(1, planetStats.getPlanetOrbitCount(planetStatsState, planetId) + 1);
      return getAiRewardDirectScore(planetRewards.buildOrbitRewardEffects?.(planetId, sequence) || [], player);
    }

    function getAiLandDirectScoreGainForTarget(planetId, target = { type: "planet" }, player = getCurrentPlayer()) {
      if (!planetId || !target) return 0;
      if (target.type === "satellite") {
        return getAiRewardDirectScore(
          planetRewards.buildSatelliteLandRewardEffects?.(target.satelliteId) || [],
          player,
        );
      }
      if (planetId === "pluto") return 11;
      const sequence = Math.max(1, planetStats.getPlanetLandingCount(planetStatsState, planetId) + 1);
      return getAiRewardDirectScore(planetRewards.buildPlanetLandRewardEffects?.(planetId, sequence) || [], player);
    }

    function getAiBestLandDirectScoreGain(planetId, choices = [], player = getCurrentPlayer()) {
      const selected = chooseAiLandChoice(choices || [], player)?.choice || null;
      if (selected) return getAiLandDirectScoreGainForTarget(planetId, selected.target, player);
      return (choices || []).reduce((best, choice) => Math.max(
        best,
        getAiLandDirectScoreGainForTarget(planetId, choice.target, player),
      ), getAiLandDirectScoreGainForTarget(planetId, { type: "planet" }, player));
    }

    function getAiBestSatelliteLandingOpportunity(planetId, player = getCurrentPlayer(), options = {}) {
      if (!planetId || !player) return null;
      const context = createActionContext();
      const canUseSatellites = Boolean(options.assumeOrange4)
        || players.playerOwnsTech(player, "orange4", context);
      if (!canUseSatellites) return null;
      const energyCost = abilities.planet.getLandEnergyCost(context, planetId);
      const availableEnergy = Math.max(0, Math.round(aiNumber(player?.resources?.energy)));
      const energyShortfall = Math.max(0, energyCost - availableEnergy);
      return (planetStats.getAvailableSatellitesForLanding?.(planetStatsState, planetId) || [])
        .map((satellite) => {
          const effects = planetRewards.buildSatelliteLandRewardEffects?.(satellite.satelliteId) || [];
          const rewardValue = scoreAiRewardEffects(effects, player);
          const directScore = getAiRewardDirectScore(effects, player);
          const highScorePremium = Math.max(0, directScore - 12) * 0.45;
          const pacePremium = Math.min(6, getAiLiveScorePaceDeficit(player) * (getAiRoundNumber() >= 3 ? 0.13 : 0.05));
          const affordability = energyShortfall <= 0 ? 4 : -Math.min(8, energyShortfall * 2.4);
          return {
            planetId,
            satelliteId: satellite.satelliteId,
            satelliteName: satellite.satelliteName,
            rewardValue,
            directScore,
            energyCost,
            energyShortfall,
            score: rewardValue * 0.55 + directScore * 0.22 + highScorePremium + pacePremium + affordability,
          };
        })
        .filter((entry) => Number.isFinite(Number(entry.score)) && entry.rewardValue > 0)
        .sort((left, right) => right.score - left.score || right.directScore - left.directScore)[0] || null;
    }

    function buildAiLandChoicesForPlanet(planet, player = getCurrentPlayer()) {
      if (!planet || !player) return [];
      const planetId = planet.planetId;
      const energyCost = abilities.planet.getLandEnergyCost(createActionContext(), planetId);
      const choices = [];
      if (planetStats.canAddLandingMarker(planetStatsState, planetId)) {
        choices.push({
          target: { type: "planet" },
          planetId,
          planet,
          energyCost,
          label: `登陆${planet.name || planetId}`,
        });
      }
      if (players.playerOwnsTech(player, "orange4", createActionContext())) {
        for (const satellite of planetStats.getAvailableSatellitesForLanding?.(planetStatsState, planetId) || []) {
          choices.push({
            target: { type: "satellite", satelliteId: satellite.satelliteId },
            planetId,
            planet,
            energyCost,
            label: `登陆${satellite.satelliteName || satellite.satelliteId}`,
          });
        }
      }
      return choices.filter((choice) => players.canAfford(player, { energy: choice.energyCost }));
    }

    function scoreAiBestSatelliteLandRewardValue(planetId, player = getCurrentPlayer()) {
      if (!planetId || !players.playerOwnsTech(player, "orange4", createActionContext())) return 0;
      return (planetStats.getAvailableSatellitesForLanding?.(planetStatsState, planetId) || [])
        .reduce((best, satellite) => Math.max(
          best,
          scoreAiLandRewardValueForTarget(planetId, {
            type: "satellite",
            satelliteId: satellite.satelliteId,
          }, player),
        ), 0);
    }

    function scoreAiBestLandRewardValueForPlanet(planetId, player = getCurrentPlayer()) {
      return Math.max(
        scoreAiLandRewardValueForTarget(planetId, { type: "planet" }, player),
        scoreAiBestSatelliteLandRewardValue(planetId, player),
      );
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
      finalScoring.ensureFinalScoringState(finalScoringState);
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
      const round = getAiRoundNumber();
      const resources = player?.resources || {};
      let bestRouteDirectScore = 0;
      let bestCashoutDirectScore = 0;
      let value = 0;
      if (canAiPlanetAcceptOrbit(planet.planetId)) {
        const orbitRewardValue = scoreAiOrbitRewardValue(planet.planetId, player);
        const orbitDirectScore = getAiOrbitDirectScoreGain(planet.planetId, player);
        const orbitSequence = Math.max(1, planetStats.getPlanetOrbitCount(planetStatsState, planet.planetId) + 1);
        const canAffordOrbit = players.canAfford(player, abilities.planet.DEFAULT_ORBIT_COST);
        bestRouteDirectScore = Math.max(bestRouteDirectScore, orbitDirectScore);
        if (canAffordOrbit) bestCashoutDirectScore = Math.max(bestCashoutDirectScore, orbitDirectScore);
        value += 9;
        value += orbitRewardValue * (round <= 2 ? 0.5 : 0.28);
        if (orbitSequence === 1) value += round <= 2 ? 7 : 2.5;
        if (canAffordOrbit) value += 3;
      }
      if (canAiPlanetAcceptLanding(planet.planetId, player)) {
        const landEnergyCost = abilities.planet.getLandEnergyCost(context, planet.planetId);
        const landRewardValue = scoreAiBestLandRewardValueForPlanet(planet.planetId, player);
        const planetLandDirectScore = getAiLandDirectScoreGainForTarget(planet.planetId, { type: "planet" }, player);
        const satelliteOpportunity = getAiBestSatelliteLandingOpportunity(planet.planetId, player);
        const bestLandDirectScore = Math.max(planetLandDirectScore, aiNumber(satelliteOpportunity?.directScore));
        const canAffordLand = players.canAfford(player, landEnergyCost > 0 ? { energy: landEnergyCost } : {});
        const energyShortfall = Math.max(0, landEnergyCost - Math.max(0, aiNumber(resources.energy)));
        const landDirectAffordability = canAffordLand ? 1 : Math.max(0.12, 0.55 - energyShortfall * 0.16);
        bestRouteDirectScore = Math.max(bestRouteDirectScore, bestLandDirectScore * landDirectAffordability);
        if (canAffordLand) bestCashoutDirectScore = Math.max(bestCashoutDirectScore, bestLandDirectScore);
        value += 11 - Math.min(4, landEnergyCost);
        value += landRewardValue * (round <= 2 ? 0.52 : 0.42);
        if (canAffordLand) value += 3;
        else value -= Math.min(6, energyShortfall * (round >= 3 ? 2 : 1.4));
      }
      const paceDirectScore = bestCashoutDirectScore || bestRouteDirectScore;
      if (paceDirectScore > 0) {
        value += scoreAiPaceValueForDirectScore(paceDirectScore, player, {
          baseWeight: round >= 3 ? 0.58 : round === 2 ? 0.36 : 0.18,
          pressureWeight: round >= 3 ? 0.24 : 0.13,
        });
      }
      const noDirectPenalty = scoreAiNoDirectScorePacePenalty(player, {
        cap: round >= 3 ? 12 : 7,
      });
      if (noDirectPenalty > 0) {
        const directCoverage = Math.min(1, paceDirectScore / 4);
        value -= noDirectPenalty * (1 - directCoverage);
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
      const earthDistance = getAiCoordinateDistanceFromEarth(planet);
      if (earthDistance != null) {
        value += scoreAiPlanetMoveDistanceFit(planet.planetId, earthDistance) * 0.6;
      }
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
      if (planet.planetId === aomomo?.PLANET_ID && effect?.type !== "aomomo_land_only") {
        return { ok: false, score: -Infinity, planet };
      }
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
      const round = getAiRoundNumber();
      const urgentCatchup = round === 3 && getAiLiveScorePaceDeficit(player) > 35;
      const fromPlanet = getAiPlanetAtCoordinate(from);
      const fromSatelliteOpportunity = fromPlanet
        ? getAiBestSatelliteLandingOpportunity(fromPlanet.planetId, player)
        : null;
      let best = { score: -Infinity, target: null };
      for (const target of targets) {
        const oldDistance = getAiSectorDistance(from, target.coordinate);
        const newDistance = getAiSectorDistance(to, target.coordinate);
        let score = (oldDistance - newDistance) * 4;
        if (newDistance === 0) score += target.value;
        else score += target.value / (newDistance + 1) * 0.75;
        if (target.kind === "planet") {
          score += scoreAiPlanetMoveDistanceFit(target.id, newDistance);
          const range = getAiPlanetOptimalMoveRange(target.id);
          if (range && oldDistance <= range.max && newDistance > range.max) {
            score -= (newDistance - range.max) * (getAiRoundNumber() <= 2 ? 4 : 2.5);
          }
          if (urgentCatchup && newDistance > 1) {
            score -= Math.min(14, (newDistance - 1) * 7);
            if ((target.id === "uranus" || target.id === "neptune") && oldDistance > 1) score -= 5;
          }
        }
        if (oldDistance === 0 && newDistance > 0) score -= target.value;
        if (
          fromSatelliteOpportunity
          && fromSatelliteOpportunity.directScore >= 13
          && fromPlanet?.planetId
          && target.id !== fromPlanet.planetId
          && getAiSectorDistance(to, { x: from.x, y: from.y }) > 0
        ) {
          score -= Math.min(18, Math.max(0, fromSatelliteOpportunity.score) * 0.5);
        }
        if (mainActionAlreadyUsed) score *= 0.6;
        if (score > best.score) best = { score, target: { ...target, oldDistance, newDistance } };
      }
      if (!Number.isFinite(best.score)) return { score: 0, target: null };
      return best;
    }

    function getAiUrgentUncashableRouteScoreCap(routeTarget, canCashOutRoute, player = getCurrentPlayer()) {
      const urgentScorePaceDeficit = getAiRoundNumber() >= 3
        ? getAiLiveScorePaceDeficit(player)
        : 0;
      if (
        urgentScorePaceDeficit <= 30
        || routeTarget?.kind !== "planet"
        || canCashOutRoute
      ) {
        return null;
      }
      const routeTargetDistance = Math.max(0, Math.round(aiNumber(routeTarget?.newDistance)));
      if (routeTargetDistance > 1) return null;
      return routeTargetDistance === 0 ? 7 : 5;
    }

    function scoreAiMovementPathPenalty(options = {}) {
      const requiredMovePoints = Math.max(0, Math.round(aiNumber(options.requiredMovePoints ?? options.terrainRequired ?? 1)));
      const routeTarget = options.routeScore?.target || null;
      const followupScore = Math.max(0, aiNumber(options.followupScore));
      const direction = options.direction || {};
      const energySpent = Math.max(0, Math.round(aiNumber(options.energySpent)));
      const energyAfterMovePayment = Math.max(0, Math.round(aiNumber(options.energyAfterMovePayment)));
      let penalty = 0;

      if (requiredMovePoints > 1) {
        penalty += (requiredMovePoints - 1) * (getAiRoundNumber() <= 2 ? 1.25 : 0.75);
      }

      if (!routeTarget && followupScore <= 0) {
        penalty += 3;
      }

      if (energySpent > 0 && followupScore <= 0) {
        if (energyAfterMovePayment <= 0) {
          penalty += getAiRoundNumber() <= 3 ? 15 : 7;
        }
        else if (getAiRoundNumber() <= 2) penalty += Math.min(4, energySpent * 1.5);
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
      if (bonusId === "bonus_3f") return getAiRoundNumber() <= 2 ? 2.2 : 3;
      if (bonusId === "bonus_1c") return (getAiRoundNumber() <= 2 ? 5.6 : 4.2)
        + Math.max(0, 3 - (player?.hand || []).length) * 0.4;
      if (bonusId === "bonus_1p") {
        if (getAiRoundNumber() <= 2) return resources.energy <= 2 ? 6.1 : 5;
        return resources.energy <= 2 ? 5.4 : 3.6;
      }
      if (bonusId === "bonus_1m") return getAiRoundNumber() <= 2 ? 1.8 : 2.4;
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
      const liveScoreDeficit = getAiLiveScorePaceDeficit(player);
      let value = 6;
      if (techType === "orange") value += 2.5;
      if (techType === "purple") value += 2 + (resources.additionalPublicScan || 0) * 0.75;
      if (techType === "blue") value += 1.5;
      if (candidate?.tileId === "orange1") value += (getMovableTokensForPlayer(player?.id).length ? 1 : 4);
      if (candidate?.tileId === "orange3") value += 4.8 + getAiMapDemand(demand.actions, "land") * 0.05;
      if (candidate?.tileId === "orange4") {
        const satellitePotential = (solar.createSolarSnapshot(solarState).planetLocations || [])
          .filter((planet) => planet?.planetId && planet.planetId !== "earth")
          .reduce((best, planet) => Math.max(best, (
            planetStats.getAvailableSatellitesForLanding?.(planetStatsState, planet.planetId) || []
          ).reduce((innerBest, satellite) => Math.max(
            innerBest,
            scoreAiRewardEffects(planetRewards.buildSatelliteLandRewardEffects?.(satellite.satelliteId) || [], player),
          ), 0)), 0);
        const energyCapacity = Math.max(
          aiNumber(resources.energy),
          aiNumber(player?.income?.energy) + (players.playerOwnsTech(player, "orange3", createActionContext()) ? 1 : 0),
        );
        const satelliteAffordability = energyCapacity >= 3 ? 1 : energyCapacity >= 2 ? 0.65 : 0.35;
        value += 4.5 + Math.min(10, satellitePotential * 0.22 * satelliteAffordability);
      }
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
      if (getAiRoundNumber() >= 2 && liveScoreDeficit > 20) {
        const directScoreBonus = candidate?.bonusId === "bonus_3f" ? 3 : 0;
        value -= Math.min(7, Math.max(0, liveScoreDeficit - directScoreBonus * 3) * 0.12);
      }
      return applyAiStrategyWeight(value, "engine", 0.35);
    }

    function aiResearchTechEventMatches(event, techType) {
      if (!event || event.type !== "researchTech") return false;
      if (event.techType && event.techType !== techType) return false;
      if (Array.isArray(event.techTypes) && !event.techTypes.includes(techType)) return false;
      return true;
    }

    function getAiResearchTechFinalFormulaDeltas(candidate, player = getCurrentPlayer()) {
      const techType = candidate?.techType || "";
      if (!techType || !AI_TECH_TYPES.includes(techType)) return {};
      const techCounts = getAiPlayerTechTypeCounts(player);
      const beforeD1 = Math.min(...AI_TECH_TYPES.map((type) => aiNumber(techCounts[type])));
      const afterCounts = {
        ...techCounts,
        [techType]: aiNumber(techCounts[techType]) + 1,
      };
      const afterD1 = Math.min(...AI_TECH_TYPES.map((type) => aiNumber(afterCounts[type])));
      const techCount = countAiPlayerTech(player);
      const beforeD2 = Math.floor(Math.max(0, techCount) / 2);
      const afterD2 = Math.floor((Math.max(0, techCount) + 1) / 2);
      const d1Immediate = Math.max(0, afterD1 - beforeD1);
      const d1Setup = d1Immediate > 0 || aiNumber(techCounts[techType]) !== beforeD1 ? 0 : 0.35;
      const d2Immediate = Math.max(0, afterD2 - beforeD2);
      return {
        d1: d1Immediate || d1Setup,
        d2: d2Immediate || 0.35,
      };
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

    function scoreAiExtraLaunchPacePenalty(player = getCurrentPlayer()) {
      if (!player) return 0;
      const round = getAiRoundNumber();
      if (round < 2 || round > 3) return 0;
      const rocketCount = getMovableTokensForPlayer(player.id).length;
      if (rocketCount <= 0) return 0;
      const deficit = getAiLiveScorePaceDeficit(player);
      if (deficit <= 18) return 0;
      return Math.min(8, 2.5 + (deficit - 18) * (round === 3 ? 0.22 : 0.16));
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
          const preserveEnergyForRouteCashout = shouldAiPreserveEnergyForRouteCashout(player, to, {
            routeTarget: routeScore.target,
            requiredMovePoints,
          });
          const movePayment = estimateAiMovePayment(player, requiredMovePoints, {
            preserveEnergy: preserveEnergyForRouteCashout,
          });
          const paymentCost = movePayment.cost;
          const pathPenalty = scoreAiMovementPathPenalty({
            player,
            from,
            to,
            direction,
            requiredMovePoints,
            routeScore,
            followupScore: 0,
            energySpent: movePayment.energySpent,
            energyAfterMovePayment: movePayment.remainingEnergy,
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
            preserveEnergyForRouteCashout,
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
      const directScoreGain = getAiOrbitDirectScoreGain(candidate.planetId, currentPlayer);
      const orbitSequence = Math.max(1, planetStats.getPlanetOrbitCount(planetStatsState, candidate.planetId) + 1);
      const earlyFirstOrbitBonus = orbitSequence === 1
        ? (round === 1 ? 13 : round === 2 ? 9 : round === 3 ? 3 : 0)
        : (round <= 2 ? 2 : 0);
      const rewardWeight = orbitSequence === 1
        ? (round <= 2 ? 1.15 : round === 3 ? 0.82 : 0.55)
        : (round <= 2 ? 0.72 : 0.45);
      const finalRoundLowScore = round >= FINAL_ROUND_NUMBER
        && Math.max(0, aiNumber(currentPlayer?.resources?.score)) < 25;
      const catchupRewardValue = finalRoundLowScore
        ? rewardValue * 0.6
        : 0;
      const directScorePaceValue = scoreAiPaceValueForDirectScore(directScoreGain, currentPlayer, {
        baseWeight: round >= 3 ? 0.55 : round === 2 ? 0.32 : 0.16,
        pressureWeight: round >= 3 ? 0.24 : 0.12,
      });
      const noDirectPacePenalty = directScoreGain > 0
        ? 0
        : scoreAiNoDirectScorePacePenalty(currentPlayer, { cap: round >= 3 ? 10 : 6 });
      return 10
        + (candidate.planetId === "jupiter" ? 2 : 0)
        + rewardValue * rewardWeight
        + earlyFirstOrbitBonus
        + catchupRewardValue
        + directScorePaceValue
        + scoreAiPlanetMarkerEndGameValue(candidate.planetId, currentPlayer, { markerKind: "orbit" })
          * getAiStrategyWeight("final")
        + getAiMapDemand(demand.planetIds, candidate.planetId) * 0.8 * getAiStrategyWeight("route")
        + getAiMapDemand(demand.actions, "orbit") * 0.32 * getAiStrategyWeight("orbitLand")
        - scoreAiResourceBundle(abilities.planet.DEFAULT_ORBIT_COST) * 0.45
        - noDirectPacePenalty;
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
      const regularBestChoice = chooseAiLandChoice(candidate.choices || [], currentPlayer);
      const rewardValue = regularBestChoice?.score
        ?? scoreAiLandRewardValueForTarget(candidate.planetId, { type: "planet" }, currentPlayer);
      const directScoreGain = candidate.directScoreGain
        ?? getAiBestLandDirectScoreGain(candidate.planetId, candidate.choices || [], currentPlayer);
      const rewardWeight = round <= 2 ? 0.9 : round === 3 ? 0.78 : 0.65;
      const catchupRewardValue = finalRoundLowScore
        ? (bestChoice?.score ?? scoreAiLandRewardValueForTarget(candidate.planetId, { type: "planet" }, currentPlayer)) * 0.65
        : 0;
      const directScorePaceValue = scoreAiPaceValueForDirectScore(directScoreGain, currentPlayer, {
        baseWeight: round >= 3 ? 0.62 : round === 2 ? 0.38 : 0.18,
        pressureWeight: round >= 3 ? 0.26 : 0.13,
      });
      return 12
        + (candidate.planetId === "mars" || candidate.planetId === "venus" ? 1.5 : 0)
        + rewardValue * rewardWeight
        + catchupRewardValue
        + directScorePaceValue
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

    function scoreAiFollowupMainActionAfterMove(coordinate, player = getCurrentPlayer(), options = {}) {
      if (!coordinate || (state.pendingActionExecuted && !options.ignoreMainActionUsed)) {
        return { score: 0, actionId: null, planetId: null, planetName: null };
      }
      const planet = getAiPlanetAtCoordinate(coordinate);
      if (!planet) return { score: 0, actionId: null, planetId: null, planetName: null };

      const actionOptions = [];
      if (
        canAiPlanetAcceptOrbit(planet.planetId)
        && players.canAfford(player, abilities.planet.DEFAULT_ORBIT_COST)
      ) {
        actionOptions.push({
          actionId: "orbit",
          planetId: planet.planetId,
          planetName: planet.name || planet.planetId,
          directScoreGain: getAiOrbitDirectScoreGain(planet.planetId, player),
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
          const choices = buildAiLandChoicesForPlanet(planet, player);
          actionOptions.push({
            actionId: "land",
            planetId: planet.planetId,
            planetName: planet.name || planet.planetId,
            energyCost,
            choices,
            directScoreGain: getAiBestLandDirectScoreGain(planet.planetId, choices, player),
            score: scoreAiLandAction({
              available: true,
              planetId: planet.planetId,
              planetName: planet.name || planet.planetId,
              energyCost,
              choices,
            }),
          });
        }
      }

      return actionOptions
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
        if (ownAfterScan > counts.maxOtherCount) value += 10;
        else if (ownAfterScan === counts.maxOtherCount) value -= 2;
        else value -= 8;
      } else if (counts.openCount === 2) {
        value += counts.ownCount + 1 > counts.maxOtherCount ? 3 : 1;
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

    function scoreAiScanEnergyReservationPenalty(player = getCurrentPlayer()) {
      if (!player || getAiRoundNumber() > 2) return 0;
      const resources = player.resources || {};
      const currentEnergy = Math.max(0, aiNumber(resources.energy));
      const scanCost = scanEffects.getStandardScanCost(player) || {};
      const scanEnergyCost = Math.max(0, aiNumber(scanCost.energy));
      if (scanEnergyCost <= 0 || currentEnergy <= 0) return 0;
      const energyAfterScan = Math.max(0, currentEnergy - scanEnergyCost);
      const movedThisTurn = getAiMoveCountThisTurn(player.id) > 0;
      const movedThenDrainedEnergyPenalty = movedThisTurn && energyAfterScan <= 0
        ? Math.min(11, 8 + getAiLiveScorePaceDeficit(player) * 0.06)
        : 0;
      const movePaymentCards = getAiMovePaymentCards(player).length;
      const planets = solar.createSolarSnapshot(solarState).planetLocations || [];
      const bestBlockedCashout = getMovableTokensForPlayer(player.id)
        .reduce((best, rocket) => {
          const coordinate = rocketActions.getRocketSectorCoordinate(rocket);
          if (!coordinate) return best;
          return planets.reduce((innerBest, planet) => {
            if (!planet?.planetId || planet.planetId === "earth") return innerBest;
            const distance = getAiSectorDistance(coordinate, planet);
            if (distance > 1) return innerBest;
            const orbitEnergy = canAiPlanetAcceptOrbit(planet.planetId)
              ? aiNumber(abilities.planet.DEFAULT_ORBIT_COST?.energy)
              : Infinity;
            const landEnergy = canAiPlanetAcceptLanding(planet.planetId, player)
              ? abilities.planet.getLandEnergyCost(createActionContext(), planet.planetId)
              : Infinity;
            const cashoutEnergy = Math.min(orbitEnergy, landEnergy);
            if (!Number.isFinite(cashoutEnergy) || cashoutEnergy <= 0) return innerBest;
            const moveEnergy = distance > 0 && movePaymentCards <= 0
              ? getAiRequiredMovePointsFromCoordinate(player, coordinate)
              : 0;
            if (currentEnergy < cashoutEnergy + moveEnergy || energyAfterScan >= cashoutEnergy) {
              return innerBest;
            }
            return Math.max(innerBest, scoreAiPlanetTarget(planet, player));
          }, best);
        }, 0);
      if (bestBlockedCashout <= 0) return movedThenDrainedEnergyPenalty;
      const deficit = getAiLiveScorePaceDeficit(player);
      return Math.max(
        movedThenDrainedEnergyPenalty,
        Math.min(11, 4 + bestBlockedCashout * 0.12 + deficit * 0.06),
      );
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
      const netBeforePace = value + earlyEngineValue * 0.55 + tracePressure - costValue * costMultiplier;
      const deficit = getAiLiveScorePaceDeficit(player);
      const paceBonus = netBeforePace > 4 && deficit > 15
        ? Math.min(getAiRoundNumber() >= 3 ? 9 : 5, (deficit - 15) * (getAiRoundNumber() >= 3 ? 0.18 : 0.1))
        : 0;
      return applyAiStrategyWeight(value + earlyEngineValue * 0.55 + tracePressure + paceBonus, "scan", 0.85)
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
      const directScoreGain = getAiRewardDirectScore(playEffects, currentPlayer);
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
        directScoreGain,
        score,
        valueBreakdown: {
          costValue: scoreAiResourceBundle(cost),
          cornerOpportunity: scoreAiCardCornerOpportunity(card),
          directScoreGain,
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

    function scoreAiFinalFormulaDeltaValue(deltas = {}, player = getCurrentPlayer()) {
      if (!deltas || !player) return 0;
      return getAiMarkedFinalFormulaEntries(player).reduce((total, entry) => {
        const delta = aiNumber(deltas[entry.formulaId]);
        if (!delta) return total;
        return total + delta * Math.max(1, aiNumber(entry.multiplier));
      }, 0);
    }

    function getAiCardCornerResourceGain(reward = {}) {
      const resourceReward = reward.resourceReward || null;
      const gain = { ...(resourceReward?.gain || {}) };
      const dataCount = Math.max(0, Math.round(aiNumber(resourceReward?.dataCount)));
      if (dataCount > 0) gain.availableData = aiNumber(gain.availableData) + dataCount;
      return gain;
    }

    function scoreAiCardCornerFollowupMainUnlock(reward, player = getCurrentPlayer()) {
      if (!player || !canStartMainAction()) return null;
      const gain = getAiCardCornerResourceGain(reward);
      const publicityGain = Math.max(0, aiNumber(gain.publicity));
      if (publicityGain <= 0) return null;
      const researchCost = tech.resolver?.getResearchPublicityCost?.(player)
        ?? tech.RESEARCH_PUBLICITY_COST
        ?? 6;
      const currentPublicity = Math.max(0, aiNumber(player.resources?.publicity));
      const projectedPublicity = Math.min(players.RESOURCE_LIMITS.publicity, currentPublicity + publicityGain);
      if (currentPublicity >= researchCost || projectedPublicity < researchCost) return null;
      const round = getAiRoundNumber();
      const currentScore = Math.max(0, aiNumber(player.resources?.score));
      const markedTechFinalEntries = getAiMarkedFinalFormulaEntries(player)
        .filter((entry) => entry.formulaId === "d1" || entry.formulaId === "d2");
      if (round < FINAL_ROUND_NUMBER && (!markedTechFinalEntries.length || currentScore < 50)) return null;
      if (round >= FINAL_ROUND_NUMBER && currentScore < 70 && !markedTechFinalEntries.length) return null;
      createActionContext().ensurePlayerTechState?.(player);
      if (!player.techState) return null;
      const takeableTech = tech.listTakeableTiles(techGameState.board, player.techState)
        .map((tileId) => buildAiResearchTechCandidate(tileId))
        .filter((candidate) => candidate.available !== false);
      const bestTechCandidate = takeableTech
        .sort((left, right) => Number(right.score || 0) - Number(left.score || 0))[0] || null;
      if (!bestTechCandidate) return null;
      const techScore = Math.max(0, aiNumber(bestTechCandidate.score));
      const finalDeltaValue = Math.max(0, scoreAiFinalFormulaDeltaValue(bestTechCandidate.finalFormulaDeltas, player));
      const followupScore = techScore * 0.32 + finalDeltaValue * 0.8;
      if (followupScore <= 0) return null;
      return {
        actionId: "researchTech",
        label: "角标补宣传后研究科技",
        score: followupScore,
        unlockedBy: { publicity: publicityGain },
        researchCost,
        selectedTech: {
          tileId: bestTechCandidate.tileId,
          techType: bestTechCandidate.techType,
          bonusId: bestTechCandidate.bonusId,
          score: roundAiScore(bestTechCandidate.score),
          finalFormulaDeltas: bestTechCandidate.finalFormulaDeltas || {},
          finalDeltaValue: roundAiScore(finalDeltaValue),
        },
      };
    }

    function buildAiCardCornerQuickCandidate(card, handIndex, currentPlayer, options = {}) {
      if (!card) return null;
      const moveReward = cards.getDiscardActionMoveRewardForCard?.(card);
      if (moveReward && !canAiUseCardCornerMoveThisTurn(currentPlayer?.id)) return null;
      const reward = getAiCardCornerRewardValue(card, currentPlayer);
      if (!reward.resourceReward && !reward.moveReward) return null;
      if (!Number.isFinite(Number(reward.value))) return null;
      const directScoreGain = Math.max(
        0,
        aiNumber(reward.resourceReward?.gain?.score),
        aiNumber(reward.moveReward?.gain?.score),
      );
      const playCandidate = options.playCandidateByIndex?.get(handIndex) || null;
      const handSize = Math.max(0, (currentPlayer?.hand || []).length);
      const unplayableCount = Math.max(0, aiNumber(options.unplayableCount));
      const handPressure = Math.max(0, handSize - 4) * 1.8 + Math.max(0, unplayableCount - 4) * 2.2;
      const discardCost = getAiDiscardedCardOpportunityCost(card, playCandidate);
      const preservePenalty = scoreAiD2ResearchTechPreserveValue(card, playCandidate, currentPlayer);
      const playablePenalty = playCandidate ? Math.min(4, Math.max(0, playCandidate.score) * 0.18) : 0;
      const lowValueBias = Math.max(0, 4.5 - discardCost) * 0.65;
      const scorePaceBonus = directScoreGain > 0
        ? scoreAiThresholdPressureForScoreGain(directScoreGain, currentPlayer) * 0.8
        : 0;
      const followupMainAction = scoreAiCardCornerFollowupMainUnlock(reward, currentPlayer);
      const followupMainActionScore = Math.max(0, aiNumber(followupMainAction?.score));
      const score = reward.value
        - discardCost
        - preservePenalty
        - playablePenalty
        + handPressure
        + lowValueBias
        + scorePaceBonus
        + followupMainActionScore;
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
        followupMainAction,
        directScoreGain,
        gain: reward.value + scorePaceBonus + followupMainActionScore,
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
          scorePaceBonus,
          followupMainActionScore,
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

    function getAiCardCornerMoveCountThisTurn(playerId = playerState.currentPlayerId) {
      const key = getAiMoveTurnKey(playerId);
      return Math.max(0, Math.round(Number(aiAutoBattleState.turnCardCornerMoveCounts[key]) || 0));
    }

    function incrementAiCardCornerMoveCountThisTurn(playerId = playerState.currentPlayerId) {
      const key = getAiMoveTurnKey(playerId);
      aiAutoBattleState.turnCardCornerMoveCounts[key] = getAiCardCornerMoveCountThisTurn(playerId) + 1;
    }

    function canAiUseCardCornerMoveThisTurn(playerId = playerState.currentPlayerId) {
      return getAiCardCornerMoveCountThisTurn(playerId) < AI_MAX_CARD_CORNER_MOVES_PER_TURN;
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
      const preserveEnergyForRouteCashout = shouldAiPreserveEnergyForRouteCashout(currentPlayer, to, {
        routeTarget: routeScore.target,
        requiredMovePoints,
      });
      const movePayment = estimateAiMovePayment(currentPlayer, requiredMovePoints, {
        preserveEnergy: preserveEnergyForRouteCashout,
      });
      const playerAfterMovePayment = currentPlayer
        ? {
          ...currentPlayer,
          resources: {
            ...(currentPlayer.resources || {}),
            energy: movePayment.remainingEnergy,
          },
        }
        : currentPlayer;
      const immediateFollowupMainAction = scoreAiFollowupMainActionAfterMove(to, playerAfterMovePayment);
      const deferredFollowupMainAction = immediateFollowupMainAction.score > 0
        ? immediateFollowupMainAction
        : scoreAiFollowupMainActionAfterMove(to, playerAfterMovePayment, { ignoreMainActionUsed: true });
      const followupMainAction = immediateFollowupMainAction.score > 0
        ? { ...immediateFollowupMainAction, timing: "immediate" }
        : deferredFollowupMainAction.score > 0
          ? { ...deferredFollowupMainAction, timing: "next_turn" }
          : immediateFollowupMainAction;
      const arrivedAtPlanetTarget = routeScore.target?.kind === "planet"
        && Math.max(0, Math.round(aiNumber(routeScore.target?.newDistance))) === 0;
      const canCashOutRoute = Math.max(0, aiNumber(followupMainAction.score)) > 0;
      let routeScoreForGain = !arrivedAtPlanetTarget
        ? aiNumber(routeScore.score)
        : canCashOutRoute
          ? aiNumber(routeScore.score) * (followupMainAction.timing === "next_turn" ? 0.32 : 0.38)
          : Math.min(aiNumber(routeScore.score), getAiRoundNumber() <= 2 ? 14 : 10);
      const routeScoreCap = getAiUrgentUncashableRouteScoreCap(routeScore.target, canCashOutRoute, currentPlayer);
      if (routeScoreCap != null) routeScoreForGain = Math.min(routeScoreForGain, routeScoreCap);
      const followupGain = followupMainAction.timing === "next_turn"
        ? Math.max(0, aiNumber(followupMainAction.score)) * 0.28
        : Math.max(0, aiNumber(followupMainAction.score));
      const movementGain = applyAiStrategyWeight(applyAiStrategyWeight(routeScoreForGain, "route", 0.7), "move", 0.8)
        + applyAiStrategyWeight(followupGain, "orbitLand", 0.5)
        + direction.score * 0.08;
      const paymentCost = movePayment.cost;
      const pathPenalty = scoreAiMovementPathPenalty({
        player: currentPlayer,
        from,
        to,
        direction,
        requiredMovePoints,
        routeScore,
        followupScore: followupMainAction.score,
        energySpent: movePayment.energySpent,
        energyAfterMovePayment: movePayment.remainingEnergy,
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
          routeScoreForGain,
          routeScoreCap,
          followupScore: followupMainAction.score,
          followupTiming: followupMainAction.timing || null,
          requiredMovePoints,
          moveEnergySpent: movePayment.energySpent,
          energyAfterMovePayment: movePayment.remainingEnergy,
          preserveEnergyForRouteCashout,
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

    function scoreAiIndustryDeepspaceSwap(player = getCurrentPlayer()) {
      const bestSwap = getAiBestDeepspaceSwap(player);
      if (!bestSwap || bestSwap.score <= AI_DEEPSPACE_SWAP_MIN_SCORE) return -Infinity;
      return 2 + bestSwap.score;
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
        score = scoreAiIndustryTuringBorrow(player);
      } else if (abilityId === "sentinel_arm_play_corner") {
        score = scoreAiIndustrySentinelArm(player);
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
      } else if (abilityId === "deepspace_swap_cards") {
        score = scoreAiIndustryDeepspaceSwap(player);
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

    function scoreAiStrategyPassiveSlotChoice(slotId, player = getCurrentPlayer()) {
      const reward = industry?.getStrategySlotReward?.(slotId) || null;
      if (!reward) return -Infinity;
      const bundle = {};
      if (reward.credits) bundle.credits = reward.credits;
      if (reward.publicity) bundle.publicity = reward.publicity;
      if (reward.data) bundle.availableData = reward.data;
      let value = scoreAiResourceBundle(bundle);
      if (reward.data && getAiAvailableDataRoom(player) <= 0) value -= 4;
      return value;
    }

    function runAiStrategyPassiveSlotChoiceDecision() {
      const pending = state.pendingStrategyPassiveSlotChoice;
      if (!pending) return null;
      const effect = getCurrentActionEffect();
      const player = getEffectOwnerPlayer(effect) || getCurrentPlayer();
      if (!isAiAutoBattlePlayer(player?.id)) {
        return { ok: false, blocked: true, message: `${player?.colorLabel || "当前玩家"}需要人工选择宇宙战略集团奖励槽` };
      }
      const selected = (pending.slotIds || [])
        .map((slotId) => ({
          slotId,
          score: scoreAiStrategyPassiveSlotChoice(slotId, player),
          rewardLabel: industry?.getStrategySlotRewardLabel?.(slotId) || "",
        }))
        .filter((entry) => entry.slotId && Number.isFinite(Number(entry.score)))
        .sort((left, right) => Number(right.score || 0) - Number(left.score || 0))[0] || null;
      if (!selected) {
        return { ok: false, blocked: true, message: "AI 没有可选的宇宙战略集团奖励槽" };
      }
      recordAiAutoBattleLog("industry", `${player.colorLabel}AI 选择宇宙战略集团奖励槽`, {
        logPlayerId: player.id,
        slotId: selected.slotId,
        score: selected.score,
        rewardLabel: selected.rewardLabel,
        choices: pending.slotIds || [],
      });
      return confirmStrategyPassiveSlotChoice(selected.slotId);
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
      const rocket = (rocketState.rockets || [])
        .find((item) => Number(item.id) === Number(state.pendingMovePayment.rocketId)) || null;
      const from = rocket ? rocketActions.getRocketSectorCoordinate(rocket) : null;
      const to = from
        ? {
          x: solar.mod8(from.x + aiNumber(state.pendingMovePayment.deltaX)),
          y: Math.min(
            rocketActions.SECTOR_RING_MAX,
            Math.max(rocketActions.SECTOR_RING_MIN, aiNumber(from.y) + aiNumber(state.pendingMovePayment.deltaY)),
          ),
        }
        : null;
      const routeScore = scoreAiMoveTowardTargets(from, to, currentPlayer);
      const preserveEnergyForRouteCashout = shouldAiPreserveEnergyForRouteCashout(currentPlayer, to, {
        routeTarget: routeScore.target,
        requiredMovePoints,
      });
      const selectedHandIndices = ai?.policy?.chooseMovePaymentIndexes?.(currentPlayer.hand || [], {
        requiredMovePoints,
        availableEnergy,
        moveCardIndexes,
        roundNumber: turnState.roundNumber,
        preserveEnergy: preserveEnergyForRouteCashout,
      }) || [];
      state.pendingMovePayment.selectedHandIndices = selectedHandIndices.slice(0, requiredMovePoints);
      recordAiAutoBattleLog("move-payment", `${currentPlayer.colorLabel}AI 确认移动支付`, {
        rocketId: state.pendingMovePayment.rocketId,
        deltaX: state.pendingMovePayment.deltaX,
        deltaY: state.pendingMovePayment.deltaY,
        requiredMovePoints,
        selectedHandIndices: state.pendingMovePayment.selectedHandIndices,
        energyCost: Math.max(0, requiredMovePoints - state.pendingMovePayment.selectedHandIndices.length),
        preserveEnergy: preserveEnergyForRouteCashout,
        preserveEnergyForRouteCashout,
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
      const pending = state.pendingLandTargetAction || null;
      const options = typeof pending?.getOptions === "function"
        ? pending.getOptions()
        : abilities.planet.getLandOptions(createActionContext());
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
      const result = executeFreeMoveForCardCorner(selected.deltaX, selected.deltaY, selected.rocketId);
      if (result?.ok) incrementAiCardCornerMoveCountThisTurn(currentPlayer.id);
      return result;
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
        const message = `${state.industryFreeMoveState?.label || "公司免费移动"}：无正收益移动，结束剩余免费移动`;
        recordAiAutoBattleLog("industry", `${currentPlayer.colorLabel}AI 跳过公司剩余免费移动`, {
          candidates,
          message,
        });
        if (typeof finishIndustryAbilityFlow === "function") {
          finishIndustryAbilityFlow(message);
          return { ok: true, progressed: true, message };
        }
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
      return [...(roots || [])]
        .flatMap((root) => [...(root?.querySelectorAll?.(selector) || [])])
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

    function getAiAlienTraceTargetMode(target, fallbackMode = state.alienTracePickerState?.mode || "") {
      const button = target?.button;
      if (target?.kind === "grid-slot" && button?.matches) {
        if (button.matches("[data-banrenma-trace-slot]")) return "banrenma-grid";
        if (button.matches("[data-yichangdian-trace-slot]")) return "yichangdian-grid";
        if (button.matches("[data-fangzhou-trace-slot]")) return "fangzhou-grid";
        if (button.matches("[data-chong-trace-slot]")) return "chong-grid";
        if (button.matches("[data-amiba-trace-slot]")) return "amiba-grid";
        if (button.matches("[data-aomomo-trace-slot]")) return "aomomo-grid";
        if (button.matches("[data-runezu-trace-slot]")) return "runezu-grid";
        if (button.matches("[data-jiuzhe-trace-slot]")) return "jiuzhe-grid";
      }
      return String(fallbackMode || "");
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

    function getAiAlienTracePlayerKeys(player) {
      if (!player) return [];
      return [player.id, player.color, player.colorLabel].filter(Boolean).map(String);
    }

    function listAiAlienTraceEntriesForSlot(alienSlotId, traceType) {
      const slotId = Number(alienSlotId);
      if (jiuzhe?.isJiuzheRevealedSlot?.(alienGameState, slotId)) return jiuzhe.listTraceEntries?.(alienGameState, slotId, traceType) || [];
      if (yichangdian?.isYichangdianRevealedSlot?.(alienGameState, slotId)) return yichangdian.listTraceEntries?.(alienGameState, slotId, traceType) || [];
      if (fangzhou?.isFangzhouRevealedSlot?.(alienGameState, slotId)) return fangzhou.listTraceEntries?.(alienGameState, slotId, traceType) || [];
      if (banrenma?.isBanrenmaRevealedSlot?.(alienGameState, slotId)) return banrenma.listTraceEntries?.(alienGameState, slotId, traceType) || [];
      if (chong?.isChongRevealedSlot?.(alienGameState, slotId)) return chong.listTraceEntries?.(alienGameState, slotId, traceType) || [];
      if (amiba?.isAmibaRevealedSlot?.(alienGameState, slotId)) return amiba.listTraceEntries?.(alienGameState, slotId, traceType) || [];
      if (aomomo?.isAomomoRevealedSlot?.(alienGameState, slotId)) return aomomo.listTraceEntries?.(alienGameState, slotId, traceType) || [];
      if (runezu?.isRunezuRevealedSlot?.(alienGameState, slotId)) return runezu.listTraceEntries?.(alienGameState, slotId, traceType) || [];
      const traceSlot = aliens.getAlienSlot?.(alienGameState, slotId)?.traces?.[traceType];
      return traceSlot?.tokens || [];
    }

    function aiAlienTraceEntryBelongsToPlayer(entry, player) {
      const keys = getAiAlienTracePlayerKeys(player);
      if (!keys.length || !entry) return false;
      return [
        entry.playerId,
        entry.playerColor,
        entry.color,
        entry.ownerPlayerId,
        entry.ownerPlayerColor,
      ].filter(Boolean).map(String).some((key) => keys.includes(key));
    }

    function aiAlienSlotHasPlayerTrace(alienSlotId, traceType, player) {
      return listAiAlienTraceEntriesForSlot(alienSlotId, traceType)
        .some((entry) => aiAlienTraceEntryBelongsToPlayer(entry, player));
    }

    function aiAlienSlotHasPlayerTraceSet(alienSlotId, traceTypes, player) {
      return (traceTypes || []).every((traceType) => aiAlienSlotHasPlayerTrace(alienSlotId, traceType, player));
    }

    function getAiEligibleAlienSlotIdsForTraceEffect(effect, player, traceTypes) {
      const targetRule = effect?.options?.targetRule;
      if (!targetRule) return aliens.ALIEN_SLOT_IDS || [];
      return (aliens.ALIEN_SLOT_IDS || []).filter((alienSlotId) => {
        if (targetRule === "playerHasSameTrace") {
          return (traceTypes || []).some((traceType) => aiAlienSlotHasPlayerTrace(alienSlotId, traceType, player));
        }
        if (targetRule === "singleAlienTraceSet") {
          const requiredTypes = effect.options?.traceTypes || ["yellow", "pink", "blue"];
          return aiAlienSlotHasPlayerTraceSet(alienSlotId, requiredTypes, player);
        }
        return true;
      });
    }

    function canAiPlaceBasicAlienTrace(alienSlotId, traceType) {
      const traceSlot = aliens.getAlienSlot?.(alienGameState, alienSlotId)?.traces?.[traceType];
      return Boolean(traceSlot) && !traceSlot.firstPlaced;
    }

    function canAiResolveAlienTraceEffect(effect, player = getCurrentPlayer()) {
      if (effect?.type !== "alien_trace") return true;
      const traceType = effect.options?.traceType || null;
      const allowedTraceTypes = traceType
        ? [traceType]
        : (effect.options?.allowedTraceTypes?.length ? effect.options.allowedTraceTypes : aliens.TRACE_TYPES || []);
      const eligibleSlots = getAiEligibleAlienSlotIdsForTraceEffect(effect, player, allowedTraceTypes);
      if (!eligibleSlots.length) return false;
      return eligibleSlots.some((alienSlotId) => {
        const slot = aliens.getAlienSlot?.(alienGameState, alienSlotId);
        if (slot?.revealed && slot?.alienId) {
          return hasAiFeasibleRevealedAlienTraceTarget(alienSlotId, allowedTraceTypes, player);
        }
        return allowedTraceTypes.some((item) => canAiPlaceBasicAlienTrace(alienSlotId, item));
      });
    }

    function canAiPlaceAlienGridTraceTarget(target, player = getCurrentPlayer()) {
      if (target?.kind !== "grid-slot") return true;
      const button = target.button;
      const dataset = button?.dataset || {};
      const alienSlotId = Number(dataset.alienSlot || state.alienTracePickerState?.selectedAlienSlotId);
      const traceType = getAiAlienTraceTargetTraceType(target);
      const position = getAiAlienTraceTargetPosition(target);
      if (!Number.isFinite(alienSlotId) || !traceType || position == null) return false;
      if (button.matches?.("[data-banrenma-trace-slot]")) {
        const grid = banrenma?.getTraceGrid?.(alienGameState, alienSlotId);
        const reward = banrenma?.getTraceReward?.(traceType, Number(position));
        const requiredData = Math.max(0, Math.round(aiNumber(reward?.payData)));
        if (requiredData > getAiAvailableDataTokenCount(player)) return false;
        return Number(position) === 1 || !grid?.[traceType]?.[position];
      }
      if (button.matches?.("[data-yichangdian-trace-slot]")) {
        const grid = yichangdian?.getTraceGrid?.(alienGameState, alienSlotId);
        return Number(position) === 1 || !grid?.[traceType]?.[position];
      }
      if (button.matches?.("[data-jiuzhe-trace-slot]")) {
        const grid = jiuzhe?.getTraceGrid?.(alienGameState, alienSlotId);
        return !grid?.[traceType]?.[position];
      }
      if (button.matches?.("[data-fangzhou-trace-slot]")) {
        return Boolean(fangzhou?.canPlaceFangzhouTrace?.(alienGameState, alienSlotId, traceType, position, player)?.ok);
      }
      if (button.matches?.("[data-chong-trace-slot]")) {
        return Boolean(chong?.canPlaceChongTrace?.(alienGameState, alienSlotId, traceType, position, player)?.ok);
      }
      if (button.matches?.("[data-amiba-trace-slot]")) {
        return Boolean(amiba?.canPlaceAmibaTrace?.(alienGameState, alienSlotId, traceType, position, player)?.ok);
      }
      if (button.matches?.("[data-aomomo-trace-slot]")) {
        return Boolean(aomomo?.canPlaceAomomoTrace?.(alienGameState, alienSlotId, traceType, position, player)?.ok);
      }
      if (button.matches?.("[data-runezu-trace-slot]")) {
        return Boolean(runezu?.canPlaceRunezuTrace?.(alienGameState, alienSlotId, traceType, position, player)?.ok);
      }
      return true;
    }

    function scoreAiAlienTraceTarget(target, player) {
      if (!target?.button || target.button.disabled) return -Infinity;
      if (!canAiPlaceAlienGridTraceTarget(target, player)) return -Infinity;
      const label = String(target.button.textContent || target.button.title || "");
      const pickerMode = String(state.alienTracePickerState?.mode || "");
      const mode = getAiAlienTraceTargetMode(target, pickerMode);
      const traceType = getAiAlienTraceTargetTraceType(target);
      const position = getAiAlienTraceTargetPosition(target);
      const reward = getAiAlienTraceTargetReward(mode, traceType, position);
      const demand = getAiStrategyDemand(player);
      const traceDemand = traceType ? getAiMapDemand(demand.traceTypes, traceType) : 0;
      const alienSlot = Number(target.button.dataset.alienSlot || state.alienTracePickerState?.selectedAlienSlotId);
      if (pickerMode.endsWith("-grid") && target.kind === "picker") return -Infinity;
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
      return targets
        .map((target, index) => ({ ...target, index, score: scoreAiAlienTraceTarget(target, player) }))
        .filter((target) => Number.isFinite(target.score))
        .sort((left, right) => right.score - left.score || left.index - right.index)[0] || null;
    }

    function runAiAlienTraceDecision() {
      if (!state.pendingAlienTraceAction && (!state.alienTracePickerState || !state.alienTracePickerState.mode)) return null;
      const player = getAlienTraceActionPlayer(state.pendingAlienTraceAction || state.alienTracePickerState);
      if (!isAiAutoBattlePlayer(player?.id)) {
        return { ok: false, blocked: true, message: `${player?.colorLabel || "当前玩家"}需要人工选择外星人痕迹` };
      }

      const target = chooseAiAlienTraceTarget(player);
      if (!target?.button) {
        return { ok: false, blocked: true, message: "AI 没有可用外星人痕迹目标" };
      }
      const button = target.button;
      recordAiAutoBattleLog("alien-trace", `${player.colorLabel}AI 选择外星人痕迹`, {
        logPlayerId: player.id || null,
        logPlayerColor: player.color || null,
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
        logPlayerId: player.id || null,
        logPlayerColor: player.color || null,
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
      candidate.finalFormulaDeltas = getAiResearchTechFinalFormulaDeltas(candidate, getCurrentPlayer());
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
      const extraLaunchPacePenalty = launchCheck.ok
        ? scoreAiExtraLaunchPacePenalty(currentPlayer)
        : 0;
      const launchCost = scoreAiLaunchPaymentCost();
      const launchGain = launchCheck.ok
        ? scoreAiLaunchAction(currentPlayer)
          + applyAiStrategyWeight(Math.max(0, aiNumber(postLaunchMovePlan?.score)), "move", 0.45)
          - lateLaunchPenalty
          - extraLaunchPacePenalty
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
          extraLaunchPacePenalty,
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
      orbitCandidate.directScoreGain = orbitCheck.ok
        ? getAiOrbitDirectScoreGain(orbitCandidate.planetId, currentPlayer)
        : 0;
      orbitCandidate.valueBreakdown = {
        directScoreGain: orbitCandidate.directScoreGain,
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
      landCandidate.directScoreGain = landCheck.ok
        ? getAiBestLandDirectScoreGain(landCandidate.planetId, landCandidate.choices, currentPlayer)
        : 0;
      landCandidate.valueBreakdown = {
        directScoreGain: landCandidate.directScoreGain,
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
        techType: bestTechCandidate?.techType || null,
        finalFormulaDeltas: bestTechCandidate?.finalFormulaDeltas || null,
        score: applyAiStrategyWeight(bestTechScore, "engine", 0.5),
      });
      const scanCheck = scanEffects.canExecuteScan(getCurrentPlayer(), { standardAction: true });
      const preMoveCandidates = listAiMoveCandidates();
      const bestMoveCandidate = preMoveCandidates.reduce((best, candidate) => (
        aiNumber(candidate?.score) > aiNumber(best?.score) ? candidate : best
      ), null);
      const bestMoveScore = Math.max(0, aiNumber(bestMoveCandidate?.score));
      const analyzeCheck = data.canAnalyzeData?.(currentPlayer) || { ok: false, message: "数据模块不可用" };
      const analyzeScore = analyzeCheck.ok ? scoreAiAnalyzeAction(currentPlayer) : 0;
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
      const bestEarlyMoveScore = getAiRoundNumber() <= 2 ? bestMoveScore : 0;
      if (bestEarlyMoveScore >= 10) {
        scanScore = Math.max(
          scanPriorityFloor,
          Math.min(scanScore, Math.max(0, bestEarlyMoveScore - 3)),
        );
      }
      const routeCashoutMoveScore = getAiRoundNumber() === 3
        && Math.max(0, aiNumber(currentPlayer?.resources?.energy)) <= 2
        && bestMoveScore >= 20
        && scanScore <= bestMoveScore + 3
        ? bestMoveScore
        : 0;
      if (routeCashoutMoveScore > 0) {
        scanScore = Math.max(
          scanPriorityFloor,
          Math.min(scanScore, Math.max(0, routeCashoutMoveScore - 3)),
        );
      }
      const analyzeCashoutScore = getAiRoundNumber() >= 2
        && Math.max(0, aiNumber(currentPlayer?.resources?.energy)) <= 2
        && analyzeScore >= 18
        && scanScore <= analyzeScore + 8
        ? analyzeScore
        : 0;
      if (analyzeCashoutScore > 0) {
        scanScore = Math.max(
          scanPriorityFloor,
          Math.min(scanScore, Math.max(0, analyzeCashoutScore - 2)),
        );
      }
      const scanEnergyReservationPenalty = scanCheck.ok
        ? scoreAiScanEnergyReservationPenalty(currentPlayer)
        : 0;
      if (scanEnergyReservationPenalty > 0) {
        scanScore = Math.max(0, scanScore - scanEnergyReservationPenalty);
      }
      const scanScoreCapReason = scanCheck.ok && immediatePlanetActionScore >= 12
        ? "优先兑现当前位置的环绕/登陆"
          : scanCheck.ok && getAiRoundNumber() <= 2 && launchCandidate.available && Number(launchCandidate.score || 0) >= 12
            ? "优先建立火箭数量"
            : scanCheck.ok && bestEarlyMoveScore >= 10
                ? "优先保持早期移动路线"
                : scanCheck.ok && routeCashoutMoveScore > 0
                  ? "优先兑现第3轮移动路线"
                  : scanCheck.ok && analyzeCashoutScore > 0
                    ? "优先兑现数据分析"
                    : scanCheck.ok && scanEnergyReservationPenalty > 0
                      ? "保留星球兑现能量"
                    : null;
      candidates.push({
        id: "scan",
        kind: "main",
        available: scanCheck.ok,
        reason: scanCheck.message || null,
        score: scanScore,
        scoreCapReason: scanScoreCapReason,
        valueBreakdown: {
          scanEnergyReservationPenalty,
        },
      });
      candidates.push({
        id: "analyze",
        kind: "main",
        available: analyzeCheck.ok,
        reason: analyzeCheck.message || null,
        score: analyzeScore,
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
        effectTypes: bestPlayCardCandidate?.effectTypes || [],
        directScoreGain: Math.max(0, aiNumber(bestPlayCardCandidate?.directScoreGain)),
        score: applyAiStrategyWeight(bestPlayCardScore, "engine", 0.5),
        valueBreakdown: {
          directScoreGain: Math.max(0, aiNumber(bestPlayCardCandidate?.directScoreGain)),
        },
      });
      const strongestNonLaunchMain = candidates
        .filter((candidate) => (
          candidate?.kind === "main"
          && candidate.available !== false
          && candidate.id !== "launch"
        ))
        .sort((left, right) => Number(right.score || 0) - Number(left.score || 0))[0] || null;
      const strongestPlanetMain = ["orbit", "land"].includes(strongestNonLaunchMain?.id)
        ? strongestNonLaunchMain
        : null;
      const strongestPlanetScore = Math.max(0, aiNumber(strongestPlanetMain?.score));
      const strongestPlanetDirectScore = Math.max(0, aiNumber(strongestPlanetMain?.directScoreGain));
      const needsFirstThresholdCatchup = Math.max(1, Math.round(aiNumber(turnState.roundNumber) || 1)) >= FINAL_ROUND_NUMBER
        && Math.max(0, aiNumber(currentPlayer?.resources?.score)) < 25;
      const finalCatchupMoveScoreCap = needsFirstThresholdCatchup && Number(strongestNonLaunchMain?.score || 0) >= 15
        ? Math.max(0, Number(strongestNonLaunchMain.score || 0) - 1)
        : null;
      const immediatePlanetCashoutMoveScoreCap = strongestPlanetDirectScore > 0
        && strongestPlanetScore >= 20
        && getAiRoundNumber() <= 3
        ? Math.max(0, strongestPlanetScore - 0.5)
        : null;
      const moveCandidates = preMoveCandidates.map((candidate) => {
        let scoreCap = null;
        let scoreCapReason = null;
        const candidateScore = Number(candidate.score || 0);
        if (
          finalCatchupMoveScoreCap != null
          && !candidate.followupMainAction?.actionId
          && candidateScore > finalCatchupMoveScoreCap
        ) {
          scoreCap = finalCatchupMoveScoreCap;
          scoreCapReason = `保留强主行动 ${strongestNonLaunchMain.id}`;
        }
        if (immediatePlanetCashoutMoveScoreCap != null) {
          const followupDirectScore = Math.max(0, aiNumber(candidate.followupMainAction?.directScoreGain));
          if (
            strongestPlanetDirectScore > followupDirectScore
            && candidateScore > immediatePlanetCashoutMoveScoreCap
          ) {
            scoreCap = scoreCap == null
              ? immediatePlanetCashoutMoveScoreCap
              : Math.min(scoreCap, immediatePlanetCashoutMoveScoreCap);
            scoreCapReason = `优先兑现当前${strongestPlanetMain.id === "land" ? "登陆" : "环绕"}得分`;
          }
        }
        if (scoreCap == null) {
          return candidate;
        }
        const cappedGain = scoreCap + Math.max(0, aiNumber(candidate.cost));
        return {
          ...candidate,
          uncappedScore: candidate.score,
          uncappedGain: candidate.gain,
          gain: cappedGain,
          score: scoreCap,
          scoreCapReason,
          valueBreakdown: {
            ...(candidate.valueBreakdown || {}),
            uncappedMovementGain: candidate.valueBreakdown?.movementGain,
            movementGain: cappedGain,
          },
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
        score: scoreAiPassAction(currentPlayer) + (getAiStrategyWeight("pass") - 1) * 10,
      });
      return candidates;
    }

    function runAiTurnActionDecision() {
      const currentPlayer = getCurrentPlayer();
      if (!isAiAutoBattlePlayer(currentPlayer?.id)) {
        return { ok: false, blocked: true, message: `${currentPlayer?.colorLabel || "当前玩家"}不是电脑玩家` };
      }
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
        ? graphCandidates.map((candidate, index) => {
          const adjustedCandidate = adjustAiActionGraphCandidate(rawCandidates[index], candidate, currentPlayer);
          return {
            ...rawCandidates[index],
            actionGraph: {
              gain: adjustedCandidate.gain,
              cost: adjustedCandidate.cost,
              finalMarginal: adjustedCandidate.finalMarginal,
              goalBonus: adjustedCandidate.goalBonus,
              feasibility: adjustedCandidate.feasibility,
              net: adjustedCandidate.net,
            },
            breakdown: adjustedCandidate.breakdown,
          };
        })
        : rawCandidates;
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
      if (action.id === "analyze") {
        return analyzeDataForCurrentPlayer();
      }
      if (action.id === "playCard") {
        return beginPlayCardSelection();
      }
      if (action.id === "cardCorner") {
        return runAiCardCornerQuickActionDecision(action);
      }
      if (action.id === "industry") {
        recordAiAutoBattleLog("industry", `${currentPlayer.colorLabel}AI 使用公司 1x：${action.companyLabel}`, {
          action,
        });
        const result = handleCompanyActionMarkerClick(action.industryCard);
        return result || { ok: true, progressed: true, action };
      }
      if (action.id === "move") {
        return runAiMoveActionDecision(action);
      }
      if (action.id === "placeData") {
        return runPlaceDataToComputer();
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
        logPlayerId: playerId || null,
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

        const strategyPassiveSlotResult = runAiStrategyPassiveSlotChoiceDecision();
        if (strategyPassiveSlotResult) return strategyPassiveSlotResult;

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

        const readyCardTaskResult = runAiReadyCardTaskOpenDecision();
        if (readyCardTaskResult) return readyCardTaskResult;

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
      const stopBeforeRound = Math.max(0, Math.round(Number(options.stopBeforeRound) || 0));
      const shouldStopBeforeRound = () => (
        stopBeforeRound > 0
        && !isGameEnded()
        && Math.max(1, Math.round(Number(turnState.roundNumber) || 1)) >= stopBeforeRound
      );
      aiAutoBattleState.running = true;
      const summary = {
        ok: true,
        steps: 0,
        stopped: false,
        blocked: false,
        gameEnded: false,
        stoppedBeforeRound: null,
        seed: randomSeed,
        message: null,
      };
      recordAiAutoBattleLog("start", `AI 自动对战开始，最多 ${maxSteps} 步`, { maxSteps, seed: randomSeed });

      while (aiAutoBattleState.running && summary.steps < maxSteps) {
        if (shouldStopBeforeRound()) {
          summary.stopped = true;
          summary.stoppedBeforeRound = stopBeforeRound;
          summary.message = `已到第 ${turnState.roundNumber} 轮起始，按配置停止`;
          break;
        }
        const beforeLogCount = aiAutoBattleState.logs.length;
        const result = runAiAutomationStep();
        summary.steps += 1;
        if (result?.done || isGameEnded()) {
          summary.gameEnded = true;
          summary.message = result?.message || "游戏已结束";
          break;
        }
        if (shouldStopBeforeRound()) {
          summary.stopped = true;
          summary.stoppedBeforeRound = stopBeforeRound;
          summary.message = `已到第 ${turnState.roundNumber} 轮起始，按配置停止`;
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
          || (!report.lastSummary?.gameEnded && !report.lastSummary?.stoppedBeforeRound)
          || report.bugs?.length
        )) {
          break;
        }
      }

      const summary = ai?.analytics?.summarizeBattleAnalyses
        ? ai.analytics.summarizeBattleAnalyses(analyses, { sequenceWindowTurns: options.sequenceWindowTurns })
        : null;
      const blockedGames = samples.filter((sample) => sample.summary?.blocked || sample.bugCount > 0).length;
      const incompleteGames = samples.filter((sample) => (
        (!sample.summary?.gameEnded && !sample.summary?.stoppedBeforeRound)
        || sample.summary?.ok === false
      )).length;
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
