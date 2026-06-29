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
      quickTrades,
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
      activateNextActionEffect,
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
      closeScanTargetPicker,
      computePlayerFinalScoreBreakdown,
      confirmCardTaskCompletion,
      confirmCardCornerQuickAction,
      confirmDataPlacement,
      confirmDiscardAnyForIncome,
      confirmInitialSelectionForCurrentPlayer,
      confirmLandTargetPicker,
      confirmMovePayment,
      confirmPassReserveSelection,
      confirmPlayCardSelection,
      confirmProbeSectorScanSelection,
      confirmPublicScanSelection,
      confirmScanTarget,
      confirmStrategyPassiveSlotChoice,
      confirmTechBlueSlotChoice,
      createActionContext,
      createTurnState,
      drawCardForCurrentPlayer,
      endCurrentTurn,
      recoverPendingActionFromOpenHistoryForAi,
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
      cancelCardTriggerChoice,
      handleChongCardGainChoice,
      handleChongFossilChoice,
      handleChongTaskCompletionChoice,
      handleConditionalSectorChoice,
      handleCompanyActionMarkerClick,
      handleDiscardCornerRepeatChoice,
      handleDiscardIncomeCardChoice,
      handleHandCardCornerQuickAction,
      handleHandCornerChoice,
      handleHandScanCardClick,
      handleJiuzheCardChoice,
      handleJiuzheOpportunitySkip,
      handleOptionalHandScanChoice,
      handlePayCreditChoice,
      handlePlayCardSelect,
      handleProbeLocationRewardChoice,
      handleProbeSectorScanChoice,
      handlePublicCornerDiscardCardClick,
      handlePublicCardClick,
      handlePublicScanCardClick,
      handleRemoveOrbitToProbeChoice,
      handleRemovePlanetMarkerChoice,
      handleReturnUnfinishedTaskChoice,
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
      openBanrenmaReadyOpportunityForPlayer,
      openCardTaskCompletionPicker,
      openRunezuFaceSymbolPlacement,
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
      runQuickTrade,
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
      credits: 4.5,
      energy: 4.2,
      handSize: 4.3,
      availableData: 1.5,
      movement: 1.5,
      publicity: 1.5,
      additionalPublicScan: 1.5,
      aomomoFossils: 4,
    });
    const AI_SCAN_COLORS = Object.freeze(["yellow", "red", "blue", "black"]);
    const AI_TECH_TYPES = Object.freeze(["orange", "purple", "blue"]);
    const AI_TRACE_TYPES = Object.freeze(["yellow", "pink", "blue"]);
    const AI_FANGZHOU_CARD2_REWARD_EFFECT_TYPE = "fangzhou_card2_advanced_reward";
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
    const AI_STRATEGY_WEIGHT_DEFAULTS = Object.freeze({
      ...AI_STRATEGY_WEIGHT_KEYS.reduce((weights, key) => ({ ...weights, [key]: 1 }), {}),
      engine: 1.1,
      playCard: 1.24,
      tech: 1.18,
      scan: 1,
      route: 0.94,
      move: 0.89,
      orbitLand: 1.12,
      task: 1.08,
      final: 1.2,
      pass: 0.89,
    });
    const AI_CHEAT_LAB_INDUSTRY_LABEL = "作弊实验室";
    const AI_CHEAT_LAB_INDUSTRY_ID = "industry:作弊实验室";
    const AI_CHEAT_LAB_INDUSTRY_SRC = "../assets/industry/异星实验室.png";
    const AI_HUANYU_SUPERDRIVE_INDUSTRY_LABEL = "寰宇超动力";
    const AI_HUANYU_SUPERDRIVE_INDUSTRY_ID = "industry:寰宇超动力";
    const AI_HUANYU_SUPERDRIVE_INDUSTRY_SRC = "../assets/industry/寰宇动力.png";
    const AI_STYLE_IDS = Object.freeze(["scanner", "route", "task", "tech", "balanced"]);
    const AI_STYLE_SEAT_ORDER = Object.freeze(["route", "scanner", "task", "tech", "balanced"]);
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
        const finalMarks = getAiMarkedFinalFormulaEntries(player);
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
          finalMarkCount: finalMarks.length,
          finalFormulas: finalMarks.map((entry) => entry.formulaId),
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
        pausedOnBug: aiAutoStepPausedOnBug,
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

    function isAiAutomationPaused() {
      return Boolean(aiAutoStepPausedOnBug);
    }

    function disableAiControlForRecovery(message = "AI 自动控制已禁用") {
      aiAutoBattleState.enabled = false;
      aiAutoBattleState.running = false;
      aiAutoBattleState.playerIds = [];
      aiAutoStepScheduled = false;
      aiAutoStepInProgress = false;
      aiAutoStepPausedOnBug = false;
      aiAutoStepSuspended = false;
      return {
        ok: true,
        disabled: true,
        message,
      };
    }

    function restoreDefaultAiControlForRecovery(message = "旧存档未包含电脑配置，已按默认人机对局恢复") {
      const result = configureDefaultAiOpponent();
      if (!result?.ok) {
        return {
          ...disableAiControlForRecovery(result?.message || "默认电脑配置不可用，已按全手动恢复"),
          defaulted: true,
        };
      }
      return {
        ok: true,
        enabled: true,
        defaulted: true,
        playerIds: [...result.playerIds],
        pausedOnBug: false,
        message,
      };
    }

    function createAiControlSnapshot() {
      return {
        version: 1,
        enabled: Boolean(aiAutoBattleState.enabled),
        playerIds: getAiAutoBattlePlayerIds(),
        pausedOnBug: false,
        lastPausedOnBug: Boolean(aiAutoStepPausedOnBug),
        stepDelayMs: Math.max(0, Math.round(Number(aiAutoBattleState.stepDelayMs) || 0)),
        maxBugRepeats: Math.max(1, Math.round(Number(aiAutoBattleState.maxBugRepeats) || 1)),
        maxMovesPerTurn: Math.max(0, Math.round(Number(aiAutoBattleState.maxMovesPerTurn) || 0)),
        strategyWeights: getAiStrategyWeights(),
      };
    }

    function restoreAiControlSnapshot(snapshot, options = {}) {
      aiAutoBattleState.running = false;
      aiAutoStepScheduled = false;
      aiAutoStepInProgress = false;
      aiAutoStepSuspended = false;

      if (!snapshot || typeof snapshot !== "object") {
        return {
          ...restoreDefaultAiControlForRecovery(
            options.missingMessage || "恢复快照未包含电脑配置，已按默认人机对局恢复",
          ),
          missing: true,
        };
      }

      if (snapshot.strategyWeights && typeof snapshot.strategyWeights === "object") {
        configureAiStrategyWeights(snapshot.strategyWeights, { merge: false });
      }
      if (snapshot.stepDelayMs != null) {
        aiAutoBattleState.stepDelayMs = Math.max(0, Math.round(Number(snapshot.stepDelayMs) || 0));
      }
      if (snapshot.maxBugRepeats != null) {
        aiAutoBattleState.maxBugRepeats = Math.max(1, Math.round(Number(snapshot.maxBugRepeats) || 1));
      }
      if (snapshot.maxMovesPerTurn != null) {
        aiAutoBattleState.maxMovesPerTurn = Math.max(0, Math.round(Number(snapshot.maxMovesPerTurn) || 0));
      }

      if (!snapshot.enabled) {
        return disableAiControlForRecovery("电脑配置已恢复为全手动");
      }

      const playerIds = Array.isArray(snapshot.playerIds)
        ? [...new Set(snapshot.playerIds.map((playerId) => getPlayerById(playerId)?.id).filter(Boolean))]
        : [];
      if (!playerIds.length) {
        return {
          ...restoreDefaultAiControlForRecovery("恢复快照中的电脑玩家无效，已按默认人机对局恢复"),
          invalidPlayerIds: true,
        };
      }

      aiAutoBattleState.enabled = true;
      aiAutoBattleState.playerIds = playerIds;
      aiAutoStepPausedOnBug = options.restorePausedOnBug === true
        ? Boolean(snapshot.pausedOnBug)
        : false;
      const clearedPausedOnBug = Boolean(snapshot.pausedOnBug) && !aiAutoStepPausedOnBug;
      return {
        ok: true,
        enabled: true,
        playerIds: [...playerIds],
        pausedOnBug: aiAutoStepPausedOnBug,
        clearedPausedOnBug,
        message: clearedPausedOnBug ? "电脑配置已恢复，已清除旧阻塞暂停" : "电脑配置已恢复",
      };
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
      const playerId = pending?.playerId
        || pending?.targetPlayerId
        || pending?.player?.id
        || null;
      if (playerId) return playerId;
      const playerColor = pending?.playerColor
        || pending?.targetPlayerColor
        || pending?.player?.color
        || null;
      return playerColor ? getPlayerByColor(playerColor)?.id || null : null;
    }

    function shouldUseAlienTracePickerOwnerForAutomation(picker) {
      const mode = String(picker?.mode || "");
      return Boolean(
        mode
        && mode !== "debug-direct"
        && mode !== "reveal-confirm"
        && getPendingPlayerId(picker)
      );
    }

    function getEffectOwnerPlayerSafe(effect) {
      return effect ? getEffectOwnerPlayer(effect) : null;
    }

    function getPendingOwnerPlayer(pending, fallbackEffect = null) {
      const pendingPlayerId = getPendingPlayerId(pending);
      if (pendingPlayerId) return getPlayerById(pendingPlayerId) || null;
      return getEffectOwnerPlayerSafe(pending?.effect || fallbackEffect)
        || getCurrentPlayer();
    }

    function getPendingAlienAutomationPlayerId() {
      const pendingEntries = [
        state.pendingAlienTraceAction,
        shouldUseAlienTracePickerOwnerForAutomation(state.alienTracePickerState)
          ? state.alienTracePickerState
          : null,
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
      if (state.pendingCardTaskCompletion) {
        const playerId = getPendingPlayerId(state.pendingCardTaskCompletion);
        if (playerId) return playerId;
      }
      const sharedPendingEntries = [
        state.pendingScanTargetAction,
        state.pendingProbeSectorScanAction,
        state.pendingProbeLocationRewardAction,
        state.pendingLandTargetAction,
        state.pendingDataPlaceAction,
      ];
      for (const pending of sharedPendingEntries) {
        const playerId = getPendingPlayerId(pending);
        if (playerId) return playerId;
        const effectOwner = getEffectOwnerPlayerSafe(pending?.effect);
        if (effectOwner?.id) return effectOwner.id;
      }
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

    function getOrderedAiAutoBattlePlayerIds() {
      const aiIds = new Set(getAiAutoBattlePlayerIds());
      const ordered = (turnState.activePlayerIds || []).filter((playerId) => aiIds.has(playerId));
      for (const playerId of aiIds) {
        if (!ordered.includes(playerId)) ordered.push(playerId);
      }
      return ordered;
    }

    function shouldForceAiHuanyuSuperdrivePlayer(playerId) {
      const orderedAiIds = getOrderedAiAutoBattlePlayerIds();
      return orderedAiIds.length > 0 && orderedAiIds[0] === playerId;
    }

    function getAiStyleFallbackIndex(playerId) {
      const orderedAiIds = getOrderedAiAutoBattlePlayerIds();
      const index = orderedAiIds.indexOf(playerId);
      return index >= 0 ? index : 0;
    }

    function getAiSeatStyle(playerId) {
      const index = getAiStyleFallbackIndex(playerId);
      return AI_STYLE_SEAT_ORDER[index % AI_STYLE_SEAT_ORDER.length] || "balanced";
    }

    function inferAiStyleFromOpening(openingPlan = null, industryCard = null, player = null) {
      const industryLabel = String(industryCard?.label || "");
      if (industryLabel === AI_HUANYU_SUPERDRIVE_INDUSTRY_LABEL) return "route";

      const summary = openingPlan?.summary || {};
      const goals = openingPlan?.goals || {};
      const scanScore = aiNumber(summary.scan) * 1.2 + aiNumber(summary.data) * 0.5 + aiNumber(goals.GRAB_TRACE_PINK);
      const routeScore = aiNumber(summary.orbits) * 1.5 + aiNumber(summary.traces) + aiNumber(goals.GRAB_TRACE_YELLOW);
      const taskScore = aiNumber(summary.hand) * 0.45 + aiNumber(summary.incomeIncreases) * 0.35 + aiNumber(goals.OPENING_INCOME) * 0.35;
      const techScore = aiNumber(summary.credits) * 0.22 + aiNumber(summary.energy) * 0.18;
      const scoredStyles = [
        { id: "scanner", score: scanScore },
        { id: "route", score: routeScore },
        { id: "task", score: taskScore },
        { id: "tech", score: techScore },
      ].sort((left, right) => right.score - left.score);
      if (scoredStyles[0]?.score >= 2.2 && scoredStyles[0].score >= scoredStyles[1]?.score + 0.45) {
        return scoredStyles[0].id;
      }
      const fallback = getAiSeatStyle(player?.id);
      return fallback || "balanced";
    }

    function createAiHuanyuSuperdriveIndustryCard(offer) {
      const template = Array.isArray(offer?.industryOptions) ? offer.industryOptions[0] : null;
      return {
        id: AI_HUANYU_SUPERDRIVE_INDUSTRY_ID,
        kind: "industry",
        label: AI_HUANYU_SUPERDRIVE_INDUSTRY_LABEL,
        src: AI_HUANYU_SUPERDRIVE_INDUSTRY_SRC,
        width: template?.width || 1382,
        height: template?.height || 1054,
        aiOnly: true,
      };
    }

    function ensureAiHuanyuSuperdriveIndustryOffer(offer) {
      if (!offer) return null;
      if (!Array.isArray(offer.industryOptions)) offer.industryOptions = [];
      const existing = offer.industryOptions.find((card) => (
        card?.label === AI_HUANYU_SUPERDRIVE_INDUSTRY_LABEL
        || card?.id === AI_HUANYU_SUPERDRIVE_INDUSTRY_ID
      ));
      if (existing) return existing;
      const card = createAiHuanyuSuperdriveIndustryCard(offer);
      offer.industryOptions.push(card);
      return card;
    }

    function chooseInitialSelectionForAiPlayer() {
      if (!isInitialSelectionActive()) return null;
      const playerId = playerState.currentPlayerId;
      if (!isAiAutoBattlePlayer(playerId)) {
        return { ok: false, blocked: true, message: `${getPlayerLabelById(playerId)}不是电脑玩家，等待人类初始选择` };
      }
      const offer = getInitialSelectionOffer(playerId);
      if (!offer || offer.confirmed) return { ok: false, message: "没有可用初始选择" };
      const forcedIndustryCard = shouldForceAiHuanyuSuperdrivePlayer(playerId)
        ? ensureAiHuanyuSuperdriveIndustryOffer(offer)
        : ensureAiCheatLabIndustryOffer(offer);
      const decision = ai?.policy?.chooseInitialSelection?.(offer, { roundNumber: turnState.roundNumber }) || {};
      const industryCard = forcedIndustryCard || decision.industry || offer.industryOptions?.[0] || null;
      const initialSelection = decision.initialCards?.length
        ? decision.initialCards
        : (offer.initialOptions || []).slice(0, INITIAL_SELECTION_REQUIRED.initial);
      if (!industryCard || initialSelection.length < INITIAL_SELECTION_REQUIRED.initial) {
        return { ok: false, message: "AI 初始选择候选不足" };
      }
      const player = getPlayerById(playerId);
      const openingPlan = decision.openingPlan || null;
      const aiStyle = inferAiStyleFromOpening(openingPlan, industryCard, player);
      if (player) {
        player.aiStyle = aiStyle;
      }
      if (player && openingPlan) {
        player.openingPlan = {
          ...structuredClone(openingPlan),
          forcedIndustryLabel: industryCard.label || industryCard.id || null,
          aiStyle,
        };
      }
      offer.selectedIndustryId = industryCard.id;
      offer.selectedInitialIds = initialSelection
        .slice(0, INITIAL_SELECTION_REQUIRED.initial)
        .map((card) => card.id);
      recordAiAutoBattleLog(
        "initial-selection",
        `${getPlayerLabelById(playerId)}选择 ${industryCard.label || industryCard.id}`,
        {
          industryCard,
          initialCards: initialSelection,
          openingPlan,
          aiStyle,
        },
      );
      confirmInitialSelectionForCurrentPlayer();
      return { ok: true, progressed: true, message: "AI 初始选择完成" };
    }

    function createAiCheatLabIndustryCard(offer) {
      const template = Array.isArray(offer?.industryOptions) ? offer.industryOptions[0] : null;
      return {
        id: AI_CHEAT_LAB_INDUSTRY_ID,
        kind: "industry",
        label: AI_CHEAT_LAB_INDUSTRY_LABEL,
        src: AI_CHEAT_LAB_INDUSTRY_SRC,
        width: template?.width || 1382,
        height: template?.height || 1054,
        aiOnly: true,
      };
    }

    function ensureAiCheatLabIndustryOffer(offer) {
      if (!offer) return null;
      if (!Array.isArray(offer.industryOptions)) offer.industryOptions = [];
      const existing = offer.industryOptions.find((card) => (
        card?.label === AI_CHEAT_LAB_INDUSTRY_LABEL
        || card?.id === AI_CHEAT_LAB_INDUSTRY_ID
      ));
      if (existing) return existing;
      const card = createAiCheatLabIndustryCard(offer);
      offer.industryOptions.push(card);
      return card;
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
      const dynamicIncomeIndexes = incomeGainByIndex
        ? chooseAiIncomeDiscardIndexes(player, count, incomeGainByIndex, incomePlanningEntries)
        : null;
      const tradeDiscardIndexes = !dynamicIncomeIndexes && pendingType === "trade"
        ? chooseAiTradeDiscardIndexes(player, count, state.pendingDiscardAction)
        : null;
      const selectedIndexes = dynamicIncomeIndexes || tradeDiscardIndexes || ai?.policy?.chooseDiscardIndexes?.(player.hand || [], count, {
        pendingType,
        incomeGainByIndex,
      })
        || Array.from({ length: count }, (_item, index) => index);
      state.pendingDiscardAction.selectedIndexes = selectedIndexes.slice(0, count);
      recordAiAutoBattleLog("discard", `${player.colorLabel}AI 弃牌 ${state.pendingDiscardAction.selectedIndexes.length} 张`, {
        selectedIndexes: state.pendingDiscardAction.selectedIndexes,
        pendingType,
        incomeGainByIndex,
        tradeId: state.pendingDiscardAction.tradeId || null,
      });
      return finalizePendingDiscardSelection();
    }

    function chooseAiTradeDiscardIndexes(player, count, pending = {}) {
      const target = Math.max(0, Math.round(aiNumber(count)));
      const hand = player?.hand || [];
      if (!player || !target || !hand.length) return null;
      const trade = quickTrades?.getTradeAction?.(pending.tradeId);
      const simulatedPlayer = trade ? createAiPlayerAfterQuickTrade(player, trade) : null;
      const postTradeCandidates = new Map(
        (simulatedPlayer ? hand : [])
          .map((card, index) => buildAiPlayCardCandidate(card, index, simulatedPlayer))
          .filter(Boolean)
          .map((candidate) => [candidate.handIndex, candidate]),
      );
      const bestPostTradePlay = [...postTradeCandidates.values()]
        .sort((left, right) => aiNumber(right.score) - aiNumber(left.score))[0] || null;
      const preserveIndexes = new Set();
      if (
        bestPostTradePlay
        && aiNumber(bestPostTradePlay.score) >= 8
        && hand.length > target
      ) {
        preserveIndexes.add(bestPostTradePlay.handIndex);
      }
      const preserveCapacity = Math.max(0, hand.length - target);
      const ranked = hand
        .map((card, index) => {
          const postTradePlay = postTradeCandidates.get(index) || null;
          const currentPlay = buildAiPlayCardCandidate(card, index, player);
          const playCandidate = postTradePlay || currentPlay;
          const finalDeltaValue = Math.max(
            0,
            scoreAiFinalFormulaDeltaValue(playCandidate?.finalFormulaDeltas || {}, player, {
              includePotential: true,
              potentialScale: 0.45,
            }),
          );
          const preserveScore = getAiDiscardedCardOpportunityCost(card, playCandidate)
            + Math.max(0, aiNumber(postTradePlay?.score)) * 0.6
            + Math.max(0, aiNumber(postTradePlay?.directScoreGain)) * 1.1
            + finalDeltaValue * 0.55
            + Math.max(0, aiNumber(postTradePlay?.valueBreakdown?.c2Type3ProgressValue)) * 0.45
            + Math.max(0, aiNumber(postTradePlay?.valueBreakdown?.cFinalTaskProgressValue)) * 0.45;
          return {
            index,
            preserveScore,
            label: cards.getCardLabel?.(card) || String(card?.label || card?.cardName || card?.id || index),
            preserve: preserveIndexes.has(index),
          };
        })
        .sort((left, right) => (
          left.preserveScore - right.preserveScore
          || left.label.localeCompare(right.label, "zh-Hans-CN")
        ));
      const selected = [];
      for (const entry of ranked) {
        if (selected.length >= target) break;
        if (
          entry.preserve
          && preserveIndexes.size <= preserveCapacity
          && ranked.length - selected.length > target - selected.length
        ) {
          continue;
        }
        selected.push(entry.index);
      }
      if (selected.length < target) {
        for (const entry of ranked) {
          if (selected.length >= target) break;
          if (!selected.includes(entry.index)) selected.push(entry.index);
        }
      }
      return selected.slice(0, target);
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
      const selected = [];
      const selectedSet = new Set();
      const simulatedPlayer = {
        ...player,
        resources: { ...(player.resources || {}) },
        income: { ...(player.income || {}) },
        hand: hand.slice(),
      };
      const rankIncomeOptions = () => hand
        .map((card, index) => {
          if (selectedSet.has(index)) return null;
          const gain = incomeGainByIndex[index] || null;
          if (!gain) return null;
          const incomeScore = scoreAiIncomeOpportunityValue(simulatedPlayer, gain);
          const finalFormulaFit = scoreAiIncomeDiscardFinalFormulaFit(simulatedPlayer, gain, incomeFormulaEntries);
          const routeEnergyFit = scoreAiIncomeDiscardRouteEnergyFit(simulatedPlayer, gain);
          const sequenceFit = target > 1
            ? scoreAiMultiIncomeSequenceFit(simulatedPlayer, gain, target - selected.length)
            : 0;
          const playValue = Math.max(0, scoreAiPlayCardValue(card, { player: simulatedPlayer }));
          return {
            index,
            incomeScore,
            finalFormulaFit,
            routeEnergyFit,
            sequenceFit,
            playValue,
            score: incomeScore + finalFormulaFit + routeEnergyFit + sequenceFit - Math.min(8, playValue * 0.12),
          };
        })
        .filter((entry) => entry && Number.isFinite(entry.score))
        .sort((left, right) => (
          right.score - left.score
          || right.routeEnergyFit - left.routeEnergyFit
          || right.finalFormulaFit - left.finalFormulaFit
          || right.sequenceFit - left.sequenceFit
          || right.incomeScore - left.incomeScore
          || left.playValue - right.playValue
          || left.index - right.index
        ));
      while (selected.length < target) {
        const ranked = rankIncomeOptions();
        const best = ranked[0] || null;
        if (!best) return null;
        selected.push(best.index);
        selectedSet.add(best.index);
        simulatedPlayer.income = addAiIncomeGain(simulatedPlayer.income, incomeGainByIndex[best.index] || {});
        simulatedPlayer.hand = hand.filter((_card, index) => !selectedSet.has(index));
        simulatedPlayer.resources = {
          ...(simulatedPlayer.resources || {}),
          handSize: simulatedPlayer.hand.length,
        };
      }
      return selected;
    }

    function scoreAiMultiIncomeSequenceFit(player = getCurrentPlayer(), incomeGain = {}, remainingSelections = 1) {
      if (!player || !incomeGain || typeof incomeGain !== "object" || remainingSelections <= 1) return 0;
      const income = player.income || {};
      const keys = ["credits", "energy", "handSize"];
      const gainedKeys = keys.filter((key) => aiNumber(incomeGain[key]) > 0);
      if (!gainedKeys.length) return 0;
      const round = getAiRoundNumber();
      const minIncome = Math.min(...keys.map((key) => aiNumber(income[key])));
      const liftedLowest = gainedKeys.filter((key) => aiNumber(income[key]) <= minIncome);
      let value = liftedLowest.length
        ? (round <= 2 ? 5.4 : round === 3 ? 2.8 : 1.2) * Math.min(1, liftedLowest.length)
        : 0;
      const afterIncome = addAiIncomeGain(income, incomeGain);
      for (const key of gainedKeys) {
        const otherMax = Math.max(...keys.filter((item) => item !== key).map((item) => aiNumber(afterIncome[item])));
        const surplus = Math.max(0, aiNumber(afterIncome[key]) - otherMax - 1);
        if (surplus > 0) value -= surplus * (round <= 2 ? 3.4 : 1.4);
      }
      return value;
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
          const currentBase = getAiIncomeFormulaBase("a2", income, player);
          const formulaIncome = getAiIncomeIncreaseSnapshot(player, income);
          const bottlenecks = ["credits", "energy", "handSize"]
            .filter((key) => aiNumber(formulaIncome[key]) <= currentBase);
          const lifted = bottlenecks.filter((key) => aiNumber(incomeGain[key]) > 0);
          if (lifted.length) {
            return total + (entry.potential ? 8 : 14) * Math.min(1, lifted.length / Math.max(1, bottlenecks.length));
          }
          return total - (entry.potential ? 1.5 : 4);
        }
        if (entry.formulaId === "a1") {
          const beforeBase = getAiIncomeFormulaBase("a1", income, player);
          const afterBase = getAiIncomeFormulaBase("a1", addAiIncomeGain(income, incomeGain), player);
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
      const c2Entries = getAiPlanningFinalFormulaEntries(player, ["c2"]);
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

    function scoreAiCFinalTaskProgressValue(player = getCurrentPlayer(), taskIncrement = 1) {
      if (!player) return 0;
      const increment = Math.max(1, Math.round(aiNumber(taskIncrement) || 1));
      const entries = getAiPlanningFinalFormulaEntries(player, ["c1", "c2"]);
      if (!entries.length) return 0;
      const currentTasks = Math.max(0, Math.round(aiNumber(player.completedTaskCount)));
      const currentType3 = countAiType3CardsForPlayer(player);
      return entries.reduce((total, entry) => {
        const multiplier = Math.max(1, aiNumber(entry.multiplier));
        if (entry.formulaId === "c1") {
          const immediate = increment * multiplier;
          return total + (entry.potential ? immediate * 0.38 : immediate * 0.72);
        }
        if (entry.formulaId === "c2") {
          const beforeBase = Math.floor((currentTasks + currentType3) / 2);
          const afterBase = Math.floor((currentTasks + currentType3 + increment) / 2);
          const immediate = Math.max(0, afterBase - beforeBase) * multiplier;
          return total + (immediate > 0 ? immediate * 0.82 : multiplier * 0.18);
        }
        return total;
      }, 0);
    }

    function getAiC2Type3BaseDelta(player = getCurrentPlayer()) {
      if (!player) return 0;
      const currentTotal = Math.max(0, Math.round(aiNumber(player.completedTaskCount)))
        + countAiType3CardsForPlayer(player);
      return Math.max(0, Math.floor((currentTotal + 1) / 2) - Math.floor(currentTotal / 2));
    }

    function getAiPlayCardFinalFormulaDeltas(card, details = {}) {
      const player = details.player || getCurrentPlayer();
      if (!card || !player) return {};
      const model = details.model || cardEffects.getCardModel?.(card) || null;
      const typeCode = details.typeCode ?? getCardTypeCode(card);
      const reservesAfterPlay = details.reservesAfterPlay ?? (
        [1, 2, 3].includes(typeCode) || Boolean(model?.reserveAfterPlay)
      );
      const deltas = {};
      const taskCount = Math.max(0, (model?.tasks || []).length);
      if (taskCount > 0) {
        const setupDelta = Math.min(0.6, 0.25 + taskCount * 0.12);
        deltas.c1 = Math.max(aiNumber(deltas.c1), setupDelta);
        deltas.c2 = Math.max(aiNumber(deltas.c2), Math.min(0.45, 0.18 + taskCount * 0.08));
      }
      if (typeCode === 3 && reservesAfterPlay) {
        deltas.c2 = Math.max(aiNumber(deltas.c2), getAiC2Type3BaseDelta(player) || 0.25);
      }
      return Object.fromEntries(
        Object.entries(deltas)
          .filter(([, value]) => Number.isFinite(Number(value)) && Number(value) > 0)
          .map(([key, value]) => [key, roundAiScore(value)]),
      );
    }

    function scoreAiFinalRoundEndGameCardUrgency(typeCode, model, player, endGameExpectedScore = 0, c2Type3ProgressValue = 0) {
      if (getAiRoundNumber() < FINAL_ROUND_NUMBER || !player) return 0;
      if (typeCode !== 3 && !model?.endGameScoring) return 0;
      const hasC2 = getAiPlanningFinalFormulaEntries(player, ["c2"]).length > 0;
      return Math.min(
        11,
        Math.max(0, aiNumber(endGameExpectedScore)) * 0.35
          + Math.max(0, aiNumber(c2Type3ProgressValue)) * 0.45
          + (hasC2 && typeCode === 3 ? 2 : 0),
      );
    }

    function scoreAiPassReserveCard(card, player = getCurrentPlayer()) {
      if (!card) return -Infinity;
      const model = cardEffects.getCardModel?.(card) || null;
      const playEffects = getAiPlayEffectsForCard(card);
      const typeCode = getCardTypeCode(card);
      const endGameExpectedScore = scoreAiCardEndGameExpectedValue(card, model, player);
      const cTaskProgressValue = model?.tasks?.length
        ? scoreAiCFinalTaskProgressValue(player, model.tasks.length)
        : 0;
      let value = 0;
      const directScoreGain = getAiRewardDirectScore(playEffects, player);
      if (directScoreGain > 0) {
        value += Math.min(10, directScoreGain * 0.8)
          + scoreAiPaceValueForDirectScore(directScoreGain, player, {
            baseWeight: 0.18,
            pressureWeight: 0.08,
          });
      }
      for (const effect of playEffects || []) {
        const type = effect?.type;
        if (type === "research_tech_select" || type === cardEffects.EFFECT_TYPES.RESEARCH_TECH) value += 4;
        if (type === cardEffects.EFFECT_TYPES.PUBLIC_SCAN || type === cardEffects.EFFECT_TYPES.HAND_SCAN) value += 2.5;
        if (type === planetRewards.EFFECT_TYPES?.DRAW_CARDS || type === "draw_cards") {
          value += Math.max(1, aiNumber(effect?.options?.count) || 1) * 1.6;
        }
      }
      if (typeCode === 3) value += 4 + scoreAiC2Type3ProgressValue(player);
      if (model?.endGameScoring || endGameExpectedScore > 0) value += 2.5 + Math.min(8, endGameExpectedScore * 0.5);
      if (model?.tasks?.length) value += 1.5 + model.tasks.length * 1.2 + Math.min(8, cTaskProgressValue * 0.65);
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
        return incomeGain ? incomeValue : -Infinity;
      }
      if (pendingType === "industry_fenwick_pick") {
        const reward = industry?.getCornerReward?.(cards, card) || null;
        const rewardValue = scoreAiIndustryCornerReward(card, reward, {
          moveId: "industryFenwickMove",
        });
        return Number.isFinite(Number(rewardValue)) ? rewardValue + incomeValue * 0.15 : -Infinity;
      }
      const model = cardEffects.getCardModel?.(card) || null;
      const playEffects = getAiPlayEffectsForCard(card);
      const typeCode = getCardTypeCode(card);
      const playableValue = Math.max(0, scoreAiPlayCardValue(card, {
        player,
        model,
        playEffects,
        typeCode,
      }));
      const currentScore = Math.max(0, aiNumber(player?.resources?.score));
      const nextThreshold = getAiNextMissingFinalScoreThreshold(player);
      const closeThirdFinalMarkPick = pendingType === "trade"
        && nextThreshold === 70
        && countAiFinalMarksForPlayer(player) === 2
        && currentScore >= 64;
      const finalRoundTradePick = pendingType === "trade"
        && getAiRoundNumber() >= FINAL_ROUND_NUMBER
        && !closeThirdFinalMarkPick;
      if (finalRoundTradePick) {
        const playCandidate = buildAiPlayCardCandidate(card, -1, player);
        const immediatePlayValue = Math.max(0, aiNumber(playCandidate?.score));
        const directScoreGain = Math.max(0, aiNumber(playCandidate?.directScoreGain));
        const price = Math.max(0, aiNumber(getCardPrice(card)));
        const credits = Math.max(0, aiNumber(player?.resources?.credits));
        const affordabilityPenalty = playCandidate
          ? 0
          : Math.min(24, 8 + Math.max(0, price - credits) * 4.5);
        const thresholdCashout = playCandidate
          && nextThreshold
          && currentScore < nextThreshold
          && currentScore + directScoreGain >= nextThreshold
          ? (nextThreshold >= 70 ? 18 : 14)
          : 0;
        return immediatePlayValue * 0.92
          + thresholdCashout
          + (playCandidate ? 2.5 : playableValue * 0.12)
          + cornerValue * 0.18
          + incomeValue * 0.12
          + (typeCode === 3 ? 1.2 : 0)
          - affordabilityPenalty;
      }
      if (closeThirdFinalMarkPick) {
        const playCandidate = buildAiPlayCardCandidate(card, -1, player);
        const immediatePlayValue = Math.max(0, aiNumber(playCandidate?.score));
        const directScoreGain = Math.max(0, aiNumber(playCandidate?.directScoreGain));
        const finalCashoutValue = playCandidate && nextThreshold && currentScore < nextThreshold
          && currentScore + directScoreGain >= nextThreshold
          ? (nextThreshold >= 70 ? 18 : 12)
          : 0;
        const deferredValue = playCandidate ? 0 : playableValue * (getAiRoundNumber() >= FINAL_ROUND_NUMBER ? 0.16 : 0.28);
        const unplayablePenalty = playCandidate ? 0 : (getAiRoundNumber() >= FINAL_ROUND_NUMBER ? 8 : 4);
        return immediatePlayValue * 0.95
          + finalCashoutValue
          + deferredValue
          + cornerValue * 0.2
          + incomeValue * 0.12
          + (typeCode === 3 ? 1.4 : 0)
          - unplayablePenalty;
      }
      return playableValue * 0.75
        + cornerValue * 0.3
        + incomeValue * 0.2
        + (typeCode === 3 ? 2 : 0);
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

      if (pending.type === "card_public_corner_discard") {
        const maxSelectable = Math.max(1, Math.round(aiNumber(pending.maxSelectable ?? pending.count ?? 1)));
        const minSelectable = Math.max(1, Math.round(aiNumber(pending.minSelectable ?? maxSelectable)));
        const selectedSlots = new Set(pending.selectedSlots || []);
        const rankedPublic = (cardState.publicCards || [])
          .map((card, slotIndex) => ({
            card,
            slotIndex,
            score: scoreAiPublicPickCard(card, player, pending.type),
          }))
          .filter((entry) => entry.card && Number.isFinite(Number(entry.score)))
          .sort((left, right) => Number(right.score || 0) - Number(left.score || 0) || left.slotIndex - right.slotIndex)
          .slice(0, maxSelectable);
        if (rankedPublic.length < minSelectable) {
          return { ok: false, blocked: true, message: `AI 没有足够的公共牌弃除目标（需要 ${minSelectable} 张）` };
        }
        recordAiAutoBattleLog("pick-card", `${player.colorLabel}AI 选择公共牌角标弃除`, {
          pendingType: pending.type,
          selectedSlots: rankedPublic.map((entry) => ({
            slotIndex: entry.slotIndex,
            score: entry.score,
            card: entry.card,
          })),
          maxSelectable,
          minSelectable,
        });
        for (const entry of rankedPublic) {
          if (selectedSlots.has(entry.slotIndex)) continue;
          const selectResult = handlePublicCornerDiscardCardClick(entry.slotIndex);
          if (!selectResult?.ok) return selectResult;
          selectedSlots.add(entry.slotIndex);
        }
        if ((pending.selectedSlots || []).length < minSelectable) {
          return { ok: false, blocked: true, message: `AI 公共牌角标弃除选择不足（需要 ${minSelectable} 张）` };
        }
        return confirmPublicScanSelection();
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

    function getAiLaunchTriggerResolution(effect, player = getCurrentPlayer()) {
      if (effect?.options?.ignoreRocketLimit !== true) {
        const context = createActionContext();
        const rocketLimit = abilities.rocket.getRocketLimitForPlayer(player, context);
        const activeRocketCount = rocketActions.getRocketsForPlayer(rocketState, player?.id).length;
        if (activeRocketCount >= rocketLimit) {
          return {
            ok: false,
            message: `火箭数量已达上限（${activeRocketCount}/${rocketLimit}）`,
          };
        }
      }
      const cost = getAiLaunchPaymentCost(effect?.options || {});
      if (!players.canAfford(player, cost)) {
        return {
          ok: false,
          message: `发射资源不足，需要 ${players.formatResourceCost(cost)}`,
        };
      }
      return { ok: true };
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
      if (type === "launch") {
        return getAiLaunchTriggerResolution(match.effect).ok;
      }
      return [
        "gain_resources",
        "gain_data",
        "draw_cards",
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
        const reasons = matches.map((match) => ({
          cardLabel: cards.getCardLabel(match?.card),
          effectType: match?.effect?.type || null,
          effectLabel: match?.effect?.label || null,
          reason: match?.effect?.type === "launch"
            ? getAiLaunchTriggerResolution(match.effect, currentPlayer).message || null
            : null,
        }));
        const message = "AI 取消本次不可发动的卡牌触发";
        recordAiAutoBattleLog("card-trigger-skip", `${currentPlayer.colorLabel}${message}`, {
          matches: reasons,
        });
        if (typeof cancelCardTriggerChoice === "function") {
          cancelCardTriggerChoice();
          return { ok: true, progressed: true, skipped: true, message, matches: reasons };
        }
        return {
          ok: false,
          blocked: true,
          message: "AI 没有可处理的卡牌触发",
          matches: reasons,
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
      const currentPlayer = getPendingOwnerPlayer(state.pendingCardTaskCompletion);
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
      if (ready.chongTask) {
        const task = ready.task || ready.card?.chongTask || null;
        const fossilId = ready.deliveredTransport?.fossil?.fossilId
          || ready.deliveredTransport?.task?.fossilId
          || null;
        const chongValue = task?.kind === "transport"
          ? scoreAiChongTransportCompletionValue(task, player, { fossilId })
          : scoreAiChongTraceTaskProgressValue(task, player);
        return 8 + Math.max(effectValue + directScore * 0.35 + paceBonus, chongValue);
      }
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

    function getAiBanrenmaOpportunityPlayers() {
      if (typeof openBanrenmaReadyOpportunityForPlayer !== "function") return [];
      const currentPlayer = getCurrentPlayer();
      const currentPlayerId = currentPlayer?.id || null;
      const activeAiPlayers = (getActivePlayers?.() || [])
        .filter((player) => player?.id && isAiAutoBattlePlayer(player.id));
      return [
        ...(currentPlayerId && isAiAutoBattlePlayer(currentPlayerId) ? [currentPlayer] : []),
        ...activeAiPlayers.filter((player) => player?.id !== currentPlayerId),
      ].filter(Boolean);
    }

    function runAiReadyBanrenmaOpportunityOpenDecision() {
      if (state.pendingBanrenmaOpportunity || state.pendingBanrenmaCardGain) return null;
      if (isActionEffectFlowActive() || hasActivePendingSubFlow()) return null;
      const currentPlayerId = getCurrentPlayer()?.id || null;
      for (const player of getAiBanrenmaOpportunityPlayers()) {
        const includeCards = player.id === currentPlayerId;
        const result = openBanrenmaReadyOpportunityForPlayer(player, {
          includeCards,
          playerId: player.id || null,
          playerColor: player.color || null,
        });
        if (!result) continue;
        if (result.ok === false) return result;
        recordAiAutoBattleLog("alien-use", `${player.colorLabel}AI 打开半人马达标机会`, {
          logPlayerId: player.id || null,
          logPlayerColor: player.color || null,
          includeCards,
          result,
        });
        return {
          ok: true,
          progressed: true,
          opened: true,
          result,
          message: result.message || "AI 已打开半人马达标机会",
        };
      }
      return null;
    }

    function listAiRunezuFaceSymbolQuickCandidates(player = getCurrentPlayer()) {
      if (
        !player
        || typeof openRunezuFaceSymbolPlacement !== "function"
        || !runezu?.isRunezuRevealedSlot
        || state.pendingRunezuFaceSymbolPlacement
        || isActionEffectFlowActive()
        || hasActivePendingSubFlow()
        || isCardSelectionActive()
        || isDiscardSelectionActive()
      ) {
        return [];
      }
      const candidates = [];
      for (const alienSlotId of aliens?.ALIEN_SLOT_IDS || []) {
        if (!runezu.isRunezuRevealedSlot(alienGameState, alienSlotId)) continue;
        for (const position of runezu.FACE_SYMBOL_POSITIONS || []) {
          const check = runezu.canPlaceFaceSymbol?.(alienGameState, position, player);
          if (!check?.ok) continue;
          const bestChoice = (check.choices || [])
            .map((choice) => ({
              symbolId: choice.symbolId,
              score: scoreAiRunezuFaceSymbolPlacementChoice(check.position, choice.symbolId, player),
            }))
            .filter((choice) => Number.isFinite(Number(choice.score)))
            .sort((left, right) => right.score - left.score)[0] || null;
          if (!bestChoice || bestChoice.score <= 0) continue;
          candidates.push({
            id: "runezuFaceSymbol",
            kind: "quick",
            available: true,
            alienSlotId: Number(alienSlotId),
            position: Number(check.position),
            symbolId: bestChoice.symbolId,
            score: bestChoice.score,
            gain: bestChoice.score,
            cost: 0,
            reason: null,
            valueBreakdown: {
              symbolId: bestChoice.symbolId,
              rewardValue: scoreAiRunezuFaceRewardValue(check.position, player),
              finalPenalty: scoreAiRunezuSpendSymbolFinalPenalty(bestChoice.symbolId, player),
            },
          });
        }
      }
      return candidates.sort((left, right) => right.score - left.score);
    }

    function runAiRunezuFaceSymbolQuickActionDecision(action) {
      if (!action || typeof openRunezuFaceSymbolPlacement !== "function") {
        return { ok: false, message: "AI 缺少符文族黑圈快速行动入口" };
      }
      const currentPlayer = getCurrentPlayer();
      recordAiAutoBattleLog("alien-use", `${currentPlayer.colorLabel}AI 打开符文族黑圈`, {
        logPlayerId: currentPlayer.id || null,
        logPlayerColor: currentPlayer.color || null,
        action,
      });
      return openRunezuFaceSymbolPlacement(action.alienSlotId, action.position);
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
          earlyResourceValues: { credits: 6, energy: 6.2, handSize: 5.4 },
        });
      }
      return getAiRoundNumber() <= 2
        ? {
          ...AI_RESOURCE_VALUES,
          credits: Math.max(AI_RESOURCE_VALUES.credits, 6),
          energy: Math.max(AI_RESOURCE_VALUES.energy, 6.2),
          handSize: Math.max(AI_RESOURCE_VALUES.handSize, 5.4),
        }
        : AI_RESOURCE_VALUES;
    }

    function scoreAiResourceBundle(resources = {}, options = {}) {
      const values = options.resourceValues || getAiResourceValuesForRound();
      return Object.entries(resources || {}).reduce((total, [key, value]) => (
        total + aiNumber(value) * aiNumber(values[key])
      ), 0);
    }

    let aiResourceContinuationDepth = 0;

    function createAiPlayerAfterResourceGain(player = getCurrentPlayer(), gain = {}) {
      if (!player || !gain || typeof gain !== "object") return null;
      const resources = { ...(player.resources || {}) };
      Object.entries(gain).forEach(([key, value]) => {
        resources[key] = aiNumber(resources[key]) + aiNumber(value);
      });
      return {
        ...player,
        resources,
      };
    }

    function getAiMidgameResourceContinuationWeight() {
      const round = getAiRoundNumber();
      if (round <= 1) return 0.55;
      if (round === 2) return 1;
      if (round === 3) return 0.82;
      return 0;
    }

    function scoreAiPlanetCashoutUnlockAfterResourceGain(player = getCurrentPlayer(), gain = {}) {
      const simulatedPlayer = createAiPlayerAfterResourceGain(player, gain);
      if (!player || !simulatedPlayer) return 0;
      const weight = getAiMidgameResourceContinuationWeight();
      if (weight <= 0) return 0;
      const resources = player.resources || {};
      const simulatedResources = simulatedPlayer.resources || {};
      const demand = getAiStrategyDemand(player);
      const planetDemand = sumAiDemandMap(demand.planetIds);
      const routeDemand = getAiTotalRouteDemand(demand);

      const best = getMovableTokensForPlayer(player.id).reduce((bestValue, rocket) => {
        const coordinate = rocketActions.getRocketSectorCoordinate(rocket);
        const planet = getAiPlanetAtCoordinate(coordinate);
        if (!planet?.planetId || planet.planetId === "earth") return bestValue;

        let value = 0;
        if (canAiPlanetAcceptOrbit(planet.planetId)) {
          const orbitCost = abilities.planet.DEFAULT_ORBIT_COST || { credits: 1, energy: 1 };
          const couldOrbitBefore = players.canAfford(player, orbitCost);
          const canOrbitAfter = players.canAfford(simulatedPlayer, orbitCost);
          if (!couldOrbitBefore && canOrbitAfter) {
            const directScore = getAiOrbitDirectScoreGain(planet.planetId, simulatedPlayer);
            value = Math.max(
              value,
              3.5
                + directScore * 0.55
                + scoreAiThresholdPressureForScoreGain(directScore, simulatedPlayer) * 0.24
                + getAiMapDemand(demand.actions, "orbit") * 0.06
                + planetDemand * 0.03,
            );
          }
        }

        if (canAiPlanetAcceptLanding(planet.planetId, simulatedPlayer)) {
          const landCost = abilities.planet.getLandEnergyCost(createActionContext(), planet.planetId);
          const couldLandBefore = aiNumber(resources.energy) >= landCost;
          const canLandAfter = aiNumber(simulatedResources.energy) >= landCost;
          if (!couldLandBefore && canLandAfter) {
            const choices = buildAiLandChoicesForPlanet(planet, simulatedPlayer);
            const directScore = (choices || []).reduce((best, choice) => Math.max(
              best,
              getAiLandDirectScoreGainForTarget(planet.planetId, choice.target, simulatedPlayer),
            ), getAiLandDirectScoreGainForTarget(planet.planetId, { type: "planet" }, simulatedPlayer));
            value = Math.max(
              value,
              4.5
                + directScore * 0.62
                + scoreAiThresholdPressureForScoreGain(directScore, simulatedPlayer) * 0.28
                + getAiMapDemand(demand.actions, "land") * 0.07
                + routeDemand * 0.025,
            );
          }
        }

        return Math.max(bestValue, value);
      }, 0);
      return roundAiScore(Math.min(12, Math.max(0, best)));
    }

    function scoreAiMidgameResourceContinuationValue(gain = {}, player = getCurrentPlayer(), options = {}) {
      if (!gain || typeof gain !== "object" || !player) return 0;
      const weight = getAiMidgameResourceContinuationWeight();
      if (weight <= 0) return 0;

      const simulatedPlayer = createAiPlayerAfterResourceGain(player, gain);
      if (!simulatedPlayer) return 0;
      if (aiResourceContinuationDepth > 0) return 0;
      aiResourceContinuationDepth += 1;
      try {

        const resources = player.resources || {};
        const afterResources = simulatedPlayer.resources || {};
        const round = getAiRoundNumber();
        const demand = getAiStrategyDemand(player);
        const mainActionScale = state.pendingActionExecuted ? 0.55 : 1;
        const currentScore = Math.max(0, aiNumber(resources.score));
        let value = 0;

        const creditGain = Math.max(0, aiNumber(gain.credits));
        const energyGain = Math.max(0, aiNumber(gain.energy));
        const handGain = Math.max(0, aiNumber(gain.handSize) + aiNumber(gain.drawCards) + aiNumber(gain.cardSelection));
        const publicityGain = Math.max(0, aiNumber(gain.publicity));
        const dataGain = Math.max(0, aiNumber(gain.availableData));

        if (creditGain > 0 && aiNumber(resources.credits) < 1 && aiNumber(afterResources.credits) >= 1) {
          const playableHand = (player.hand || []).filter(isAiSupportedHandPlayCard).length;
          const deficit = Math.max(0, getAiLiveScorePaceDeficit(player));
          value += Math.min(
            7,
            (2.4 + Math.min(4, playableHand * 0.75) + Math.min(2, deficit * 0.04)) * mainActionScale,
          );
        }

        if (handGain > 0 && (player.hand || []).length <= 2) {
          value += Math.min(5.5, 1.7 + Math.max(0, 3 - (player.hand || []).length) * 1.1) * mainActionScale;
        }

        if (publicityGain > 0 && aiNumber(resources.publicity) < 3 && aiNumber(afterResources.publicity) >= 3) {
          value += Math.min(4.5, 2.4 + Math.max(0, 2 - (player.hand || []).length) * 0.65) * mainActionScale;
        }

        if (energyGain > 0 || creditGain > 0) {
          const scanCost = scanEffects?.getStandardScanCost?.(player) || scanEffects?.SCAN_COST || { credits: 1, energy: 2 };
          const couldScanBefore = scanEffects?.canExecuteScan?.(player, { standardAction: true })?.ok;
          const canScanAfter = scanEffects?.canExecuteScan?.(simulatedPlayer, { standardAction: true })?.ok;
          if (!couldScanBefore && canScanAfter) {
            const scanUnlockValue = 3
              + scoreAiScanPriorityFloor(player) * 0.55
              + Math.min(2.2, getAiAvailableDataRoom(player) * 0.26)
              + Math.min(2.5, sumAiDemandMap(demand.traceTypes) * 0.04);
            value += Math.min(
              9,
              (scanUnlockValue
                + getAiMapDemand(demand.actions, "scan") * 0.04
                - Math.max(0, aiNumber(scanCost.credits) - aiNumber(afterResources.credits)) * 1.2) * mainActionScale,
            );
          }
        }

        if (energyGain > 0) {
          const couldAnalyzeBefore = canAiAnalyzeData(player).ok;
          const canAnalyzeAfter = canAiAnalyzeData(simulatedPlayer).ok;
          if (!couldAnalyzeBefore && canAnalyzeAfter) {
            const analyzeScore = Math.max(0, aiNumber(scoreAiAnalyzeAction(simulatedPlayer)));
            const blueTraceScore = getAiBestRevealedAlienTraceDirectScore(player, "blue");
            value += Math.min(
              11,
              (3.6
                + analyzeScore * 0.34
                + Math.max(0, blueTraceScore) * 0.28
                + getAiMapDemand(demand.actions, "analyze") * 0.06) * mainActionScale,
            );
          }
          value += scoreAiPlanetCashoutUnlockAfterResourceGain(player, gain) * 0.85;
        }

        if (dataGain > 0) {
          const requiredSlot = data.ANALYZE_REQUIRED_COMPUTER_SLOT || 6;
          const placedCount = Math.max(0, (data.listComputerPlacedTokens?.(player) || []).length);
          const beforeCanReachAnalyze = placedCount + Math.max(0, aiNumber(resources.availableData)) >= requiredSlot;
          const afterCanReachAnalyze = placedCount + Math.max(0, aiNumber(afterResources.availableData)) >= requiredSlot;
          const dataRoom = getAiAvailableDataRoom(player);
          if (!beforeCanReachAnalyze && afterCanReachAnalyze) {
            value += 4.6 + getAiMapDemand(demand.traceTypes, "blue") * 0.08;
          } else if (afterCanReachAnalyze && hasAiAnalyzeReadyDataSlot(player)) {
            value += 2.2;
          } else if (round <= 3 && dataRoom > 0) {
            value += Math.min(3.2, 0.8 + dataRoom * 0.22 + getAiEarlyEnginePressure(player) * 0.65);
          }
        }

        if (currentScore < 25 && round <= 2) {
          const flexibleGain = creditGain + energyGain + handGain + publicityGain * 0.5 + dataGain * 0.35;
          value += Math.min(3.5, flexibleGain * 0.55 + getAiEarlyEnginePressure(player) * 0.5);
        }

        const scale = options.scale == null ? 1 : aiNumber(options.scale);
        return roundAiScore(Math.min(14, Math.max(0, value)) * weight * scale);
      } finally {
        aiResourceContinuationDepth = Math.max(0, aiResourceContinuationDepth - 1);
      }
    }

    function cloneAiValue(value) {
      if (typeof structuredClone === "function") return structuredClone(value);
      return value == null ? value : JSON.parse(JSON.stringify(value));
    }

    function getAiAomomoFossilCount(player = getCurrentPlayer()) {
      return Math.max(0, Math.round(aiNumber(player?.resources?.aomomoFossils)));
    }

    function getAiAomomoFossilUnitValue(player = getCurrentPlayer()) {
      const fossils = getAiAomomoFossilCount(player);
      const round = getAiRoundNumber();
      let value = aiNumber(AI_RESOURCE_VALUES.aomomoFossils || 4);
      if (round <= 3 && fossils < 4) value += Math.min(1.1, (4 - fossils) * 0.28);
      if (round >= FINAL_ROUND_NUMBER && fossils <= 1) value -= 0.8;
      return Math.max(2.5, Math.min(5.2, value));
    }

    function scoreAiAomomoFossilPlanBonus(gainCount = 0, player = getCurrentPlayer()) {
      const gain = Math.max(0, Math.round(aiNumber(gainCount)));
      if (!gain || !player) return 0;
      const current = getAiAomomoFossilCount(player);
      const after = current + gain;
      const round = getAiRoundNumber();
      let value = 0;
      if (current < 4) {
        value += Math.max(0, Math.min(4, after) - Math.min(4, current)) * (round <= 3 ? 1.15 : 0.45);
        if (after >= 4) value += round >= 3 ? 6.5 : 3.2;
        else if (after >= 3) value += round <= 3 ? 2.1 : 0.8;
        else if (after >= 2) value += round <= 2 ? 1.1 : 0.6;
      }
      if (round >= FINAL_ROUND_NUMBER && after < 4) value -= Math.min(1.5, gain * 0.7);
      return roundAiScore(Math.max(-2, Math.min(9, value)));
    }

    function scoreAiAomomoFossilSpendPlanPenalty(spendCount = 0, player = getCurrentPlayer(), options = {}) {
      const spend = Math.max(0, Math.round(aiNumber(spendCount)));
      if (!spend || !player) return 0;
      const current = getAiAomomoFossilCount(player);
      const after = Math.max(0, current - spend);
      const round = getAiRoundNumber();
      let penalty = 0;
      if (current < 4) {
        penalty += Math.min(6, spend * (round <= 3 ? 1.4 : 0.55));
      } else if (after < 4) {
        penalty += round <= 3 ? 5.5 : 3.5;
      }
      if (aiNumber(options.directScore) >= 20 && round >= 3) penalty *= 0.45;
      if (options.crossesThreshold) penalty *= 0.55;
      return roundAiScore(Math.max(0, Math.min(8, penalty)));
    }

    function scoreAiAlienRewardBundle(reward = {}, player = getCurrentPlayer()) {
      if (!reward || typeof reward !== "object") return 0;
      const gain = reward.gain || {};
      const directScore = Math.max(0, aiNumber(gain.score));
      let value = scoreAiResourceBundle(gain);
      const fossilGain = Math.max(0, Math.round(aiNumber(gain.aomomoFossils)));
      if (fossilGain > 0) value += scoreAiAomomoFossilPlanBonus(fossilGain, player);
      value += scoreAiMidgameResourceContinuationValue(gain, player, { scale: 0.8 });
      if (directScore > 0) {
        value += scoreAiThresholdPressureForScoreGain(directScore, player) * 0.55;
      }
      value += Math.max(0, Math.round(aiNumber(reward.dataCount))) * AI_RESOURCE_VALUES.availableData;
      if (Math.max(0, Math.round(aiNumber(reward.dataCount))) > 0) {
        value += scoreAiMidgameResourceContinuationValue(
          { availableData: Math.max(0, Math.round(aiNumber(reward.dataCount))) },
          player,
          { scale: 0.65 },
        );
      }
      value += Math.max(0, Math.round(aiNumber(reward.drawCards || reward.blindDraw))) * AI_RESOURCE_VALUES.handSize;
      if (reward.pickCard) value += 3.5;
      if (reward.pickAlienCard) value += 5.5;
      if (Number.isFinite(Number(reward.regionValue))) value += aiNumber(reward.regionValue);
      if (Number.isFinite(Number(reward.panelSymbolValue))) value += aiNumber(reward.panelSymbolValue);
      if (Number.isFinite(Number(reward.symbolValue))) value += aiNumber(reward.symbolValue);
      value -= Math.max(0, aiNumber(reward.payData)) * AI_RESOURCE_VALUES.availableData;
      const fossilCost = Math.max(0, Math.round(aiNumber(reward.payFossils)));
      if (fossilCost > 0) {
        const threshold = getAiNextMissingFinalScoreThreshold(player);
        const currentScore = Math.max(0, aiNumber(player?.resources?.score));
        const crossesThreshold = Boolean(threshold && currentScore < threshold && currentScore + directScore >= threshold);
        value -= fossilCost * getAiAomomoFossilUnitValue(player);
        value -= scoreAiAomomoFossilSpendPlanPenalty(fossilCost, player, { directScore, crossesThreshold });
      }
      return value;
    }

    function scoreAiBestChongFossilRewardValue(player = getCurrentPlayer()) {
      if (!chong?.FOSSIL_IDS?.length || !chong?.getFossilReward) return 0;
      return chong.FOSSIL_IDS.reduce((best, fossilId) => (
        Math.max(best, scoreAiAlienRewardBundle(chong.getFossilReward(fossilId), player))
      ), 0);
    }

    function listAiChongFossilRewardValues(player = getCurrentPlayer()) {
      if (!chong?.FOSSIL_IDS?.length || !chong?.getFossilReward) return [];
      return chong.FOSSIL_IDS
        .map((fossilId) => scoreAiAlienRewardBundle(chong.getFossilReward(fossilId), player))
        .filter((value) => Number.isFinite(Number(value)) && value > 0);
    }

    function scoreAiAverageChongFossilRewardValue(player = getCurrentPlayer()) {
      const values = listAiChongFossilRewardValues(player);
      if (!values.length) return 0;
      return values.reduce((total, value) => total + value, 0) / values.length;
    }

    function hasAiPlayerSeenChongFossil(fossil, player = getCurrentPlayer()) {
      if (!fossil || !player) return false;
      const visible = fossil.visibleToPlayerIds || [];
      return visible.includes(player.id)
        || visible.includes(player.color)
        || fossil.carriedByPlayerId === player.id
        || fossil.carriedByPlayerColor === player.color;
    }

    function scoreAiExpectedChongPlanetFossilRewardValue(planetId, player = getCurrentPlayer()) {
      if (!chong?.getAvailablePlanetFossils) return 0;
      const available = planetId
        ? chong.getAvailablePlanetFossils(alienGameState, planetId)
        : [];
      if (planetId && !available.length) return 0;
      const visibleValues = available
        .filter((fossil) => hasAiPlayerSeenChongFossil(fossil, player))
        .map((fossil) => scoreAiAlienRewardBundle(chong.getFossilReward?.(fossil.fossilId), player))
        .filter((value) => Number.isFinite(Number(value)) && value > 0);
      if (available.length > 0 && visibleValues.length === available.length) {
        return Math.max(0, ...visibleValues);
      }
      const average = scoreAiAverageChongFossilRewardValue(player);
      const best = scoreAiBestChongFossilRewardValue(player);
      const choiceCount = Math.max(1, available.length || 2);
      const hiddenChoicePremium = Math.max(0, choiceCount - 1) * 1.15;
      return Math.max(
        visibleValues.length ? Math.max(...visibleValues) : 0,
        Math.min(best, average + hiddenChoicePremium),
      );
    }

    function scoreAiChongPanelUnlockValue(player = getCurrentPlayer()) {
      if (!player || !chong?.LOCKED_BLUE_POSITIONS?.length) return 0;
      const panelSlots = alienGameState?.chong?.panelFossilSlots || {};
      const remainingLockedBlue = chong.LOCKED_BLUE_POSITIONS.filter((position) => !panelSlots[position]).length;
      if (!remainingLockedBlue) return 0;
      const demand = getAiStrategyDemand(player);
      const blueDemand = getAiMapDemand(demand.traceTypes, "blue")
        + getAiMapDemand(demand.actions, "analyze") * 0.45
        + getAiMapDemand(demand.actions, "placeData") * 0.25;
      const engineValue = scoreAiBlueTechDataEngineValue(player);
      return roundAiScore(Math.min(
        6,
        1.8
          + Math.min(2.6, blueDemand * 0.08)
          + Math.min(2.2, engineValue * 0.18)
          + Math.min(1.2, remainingLockedBlue * 0.2),
      ));
    }

    function scoreAiChongTaskRewardValue(task = {}, player = getCurrentPlayer()) {
      if (!task || !player) return 0;
      let value = 0;
      if (task.gain) value += scoreAiCountedResourceGain(task.gain, player);
      const dataCount = Math.max(0, Math.round(aiNumber(task.dataCount)));
      if (dataCount > 0) {
        value += dataCount * AI_RESOURCE_VALUES.availableData;
        value += scoreAiMidgameResourceContinuationValue({ availableData: dataCount }, player, { scale: 0.78 });
      }
      if (task.pickCard) {
        value += AI_RESOURCE_VALUES.handSize * 0.9;
        value += scoreAiMidgameResourceContinuationValue(
          { handSize: 1, cardSelection: 1 },
          player,
          { scale: 0.42 },
        );
      }
      const fossilRewardRepeat = Math.max(0, Math.round(aiNumber(task.fossilRewardRepeat)));
      if (fossilRewardRepeat > 0) {
        value += fossilRewardRepeat * scoreAiBestChongFossilRewardValue(player) * 0.62;
        value += scoreAiChongPanelUnlockValue(player);
      }
      if (task.kind === "transport") {
        value += task.destinationPlanetId === "earth" ? 3.2 : 1.8;
      }
      return roundAiScore(Math.min(24, Math.max(0, value)));
    }

    function getAiPlanetCoordinateById(planetId) {
      if (!planetId) return null;
      const coordinate = getPlanetSectorCoordinate?.(planetId);
      if (coordinate) return { x: coordinate.x, y: coordinate.y };
      if (planetId === "earth") {
        const earth = getEarthSectorCoordinate?.();
        return earth ? { x: earth.x, y: earth.y } : null;
      }
      const planet = solar.createSolarSnapshot(solarState).planetLocations
        .find((item) => item.planetId === planetId);
      return planet ? { x: planet.x, y: planet.y } : null;
    }

    function scoreAiChongTransportDeliveryCost(fromPlanetId, task = {}, player = getCurrentPlayer()) {
      const destinationPlanetId = task?.destinationPlanetId || null;
      if (!fromPlanetId || !destinationPlanetId) return 3.5;
      const from = getAiPlanetCoordinateById(fromPlanetId);
      const destination = getAiPlanetCoordinateById(destinationPlanetId);
      if (!from || !destination) return 5;
      const distance = Math.max(0, getAiSectorDistance(from, destination));
      const round = getAiRoundNumber();
      const moveUnitCost = AI_RESOURCE_VALUES.movement * (round <= 2 ? 0.85 : round === 3 ? 1 : 1.15);
      const farOuterPenalty = (fromPlanetId === "saturn" || fromPlanetId === "jupiter")
        && destinationPlanetId === "earth"
        ? 1.5
        : 0;
      const destinationPremium = destinationPlanetId === "earth" ? 0.5 : 0;
      return roundAiScore(Math.min(20, distance * moveUnitCost + farOuterPenalty + destinationPremium));
    }

    function scoreAiChongTransportCompletionValue(task = {}, player = getCurrentPlayer(), options = {}) {
      if (!task || !player) return 0;
      const fossilRewardRepeat = Math.max(0, Math.round(aiNumber(task.fossilRewardRepeat)));
      const fossilRewardValue = options.fossilId
        ? scoreAiAlienRewardBundle(chong?.getFossilReward?.(options.fossilId), player)
        : options.planetId
          ? scoreAiExpectedChongPlanetFossilRewardValue(options.planetId, player)
          : scoreAiAverageChongFossilRewardValue(player);
      const dataCount = Math.max(0, Math.round(aiNumber(task.dataCount)));
      let value = 0;
      if (task.gain) value += scoreAiCountedResourceGain(task.gain, player);
      if (dataCount > 0) {
        value += dataCount * AI_RESOURCE_VALUES.availableData;
        value += scoreAiMidgameResourceContinuationValue({ availableData: dataCount }, player, { scale: 0.78 });
      }
      if (task.pickCard) {
        value += AI_RESOURCE_VALUES.handSize * 0.9;
        value += scoreAiMidgameResourceContinuationValue(
          { handSize: 1, cardSelection: 1 },
          player,
          { scale: 0.42 },
        );
      }
      if (fossilRewardRepeat > 0) {
        value += fossilRewardRepeat * fossilRewardValue * 0.92;
        value += scoreAiChongPanelUnlockValue(player) * 0.85;
      }
      value += Math.min(9, scoreAiCFinalTaskProgressValue(player, 1) * 0.95);
      if (task.destinationPlanetId === "earth") value += 2.2;
      else if (task.destinationPlanetId) value += 1.2;
      return roundAiScore(Math.min(34, Math.max(0, value)));
    }

    function scoreAiChongCardPlayAffordability(card, player = getCurrentPlayer()) {
      if (!card || !player) return 1;
      const cost = getCardPlayCost(card) || {};
      if (!Object.keys(cost).length || players.canAfford(player, cost)) return 1;
      const resources = player.resources || {};
      const creditShortfall = Math.max(0, aiNumber(cost.credits) - aiNumber(resources.credits));
      const energyShortfall = Math.max(0, aiNumber(cost.energy) - aiNumber(resources.energy));
      const shortfallValue = creditShortfall * AI_RESOURCE_VALUES.credits
        + energyShortfall * AI_RESOURCE_VALUES.energy;
      return Math.max(0.18, 0.68 - shortfallValue * 0.055);
    }

    function scoreAiChongPickupTaskValue(task = {}, player = getCurrentPlayer(), planetId = null, options = {}) {
      if (!task || task.kind !== "transport" || !player) return 0;
      if (planetId && !isAiChongPickupPlanetId(planetId)) return 0;
      if (planetId && !(chong?.getAvailablePlanetFossils?.(alienGameState, planetId) || []).length) return 0;
      if (!planetId) {
        const availableAny = (chong?.getAvailablePlanetFossils?.(alienGameState, "jupiter") || []).length
          + (chong?.getAvailablePlanetFossils?.(alienGameState, "saturn") || []).length;
        if (availableAny <= 0) return 0;
      }
      const round = getAiRoundNumber();
      const completionValue = scoreAiChongTransportCompletionValue(task, player, {
        planetId,
        fossilId: options.fossilId || null,
      });
      const futureScale = options.immediate
        ? round <= 2 ? 0.92 : round === 3 ? 0.78 : 0.56
        : round <= 2 ? 0.7 : round === 3 ? 0.58 : 0.36;
      const deliveryCost = planetId
        ? scoreAiChongTransportDeliveryCost(planetId, task, player)
        : 4;
      const card = options.card || null;
      const includePlayCost = options.includePlayCost !== false && Boolean(card);
      const cardCost = includePlayCost ? scoreAiResourceBundle(getCardPlayCost(card) || {}) : 0;
      const affordability = includePlayCost ? scoreAiChongCardPlayAffordability(card, player) : 1;
      const immediateBonus = options.immediate ? 2.5 : 0;
      return roundAiScore(Math.min(
        36,
        Math.max(0, completionValue * futureScale * affordability + immediateBonus - deliveryCost - cardCost * 0.35),
      ));
    }

    function listAiPlayableChongTransportCards(player = getCurrentPlayer()) {
      if (!player || !chong?.isChongCard || !chong?.getCardTask) return [];
      return (player.hand || [])
        .filter((card) => chong.isChongCard(card))
        .map((card) => ({ card, task: chong.getCardTask(card) }))
        .filter((entry) => entry.task?.kind === "transport");
    }

    function scoreAiChongPickupRouteValue(planetId, player = getCurrentPlayer(), options = {}) {
      if (planetId && !isAiChongPickupPlanetId(planetId)) return 0;
      if (planetId && !(chong?.getAvailablePlanetFossils?.(alienGameState, planetId) || []).length) return 0;
      if (Object.prototype.hasOwnProperty.call(options, "task")) {
        if (!options.task) return 0;
        return scoreAiChongPickupTaskValue(options.task, player, planetId, options);
      }
      return listAiPlayableChongTransportCards(player)
        .reduce((best, entry) => Math.max(
          best,
          scoreAiChongPickupTaskValue(entry.task, player, planetId, {
            ...options,
            card: entry.card,
          }),
        ), 0);
    }

    function getAiChongTaskForEffect(effect) {
      if (!isAiChongTravelEffect(effect)) return null;
      const card = state.pendingActionEffectFlow?.card || null;
      return card?.chongTask || chong?.getCardTask?.(effect.options?.cardIndex) || null;
    }

    function scoreAiChongTravelChoiceBonus(effect, choice, player = getCurrentPlayer()) {
      if (!isAiChongTravelEffect(effect)) return 0;
      const planetId = choice?.planet?.planetId || choice?.target?.planetId || null;
      if (!isAiChongPickupPlanetId(planetId)) return 0;
      return scoreAiChongPickupRouteValue(planetId, player, {
        task: getAiChongTaskForEffect(effect),
        includePlayCost: false,
        immediate: true,
      });
    }

    function scoreAiChongTravelEffectPlanetValue(effect, planetId, player = getCurrentPlayer()) {
      if (!isAiChongTravelEffect(effect) || !isAiChongPickupPlanetId(planetId)) return 0;
      return scoreAiChongPickupRouteValue(planetId, player, {
        task: getAiChongTaskForEffect(effect),
        includePlayCost: false,
        immediate: true,
      });
    }

    function scoreAiChongTravelEffectImmediateValue(effect, player = getCurrentPlayer()) {
      if (!isAiChongTravelEffect(effect)) return 0;
      const options = effect.type === chong?.EFFECT_TYPES?.CHONG_ORBIT_OR_LAND_FOR_PICKUP
        ? getAiChongOrbitOrLandOptions(effect)
        : getAiChongLandOptions(effect);
      if (!options?.ok || !options.choices?.length) return 0;
      return options.choices.reduce((best, choice) => {
        const score = scoreAiLandChoice(choice, player, { chongEffect: effect });
        return Math.max(best, Number.isFinite(Number(score)) ? score : 0);
      }, 0);
    }

    function isAiChongFossilToken(rocket) {
      return (rocket?.kind || rocketActions.ROCKET_KIND?.STANDARD) === rocketActions.ROCKET_KIND?.CHONG_FOSSIL;
    }

    function getAiChongTransportTaskForRocket(rocket) {
      if (!rocket || !chong?.getTransportTaskForRocket) return null;
      const rawTask = chong.getTransportTaskForRocket(alienGameState, rocket.id);
      if (!rawTask) return null;
      const fossil = alienGameState?.chong?.fossilsById?.[rawTask.fossilId] || null;
      return {
        destinationPlanetId: fossil?.destinationPlanetId || rawTask.destinationPlanetId || null,
        fossilRewardRepeat: Math.max(0, Math.round(aiNumber(fossil?.fossilRewardRepeat ?? rawTask.fossilRewardRepeat))),
        gain: { ...(fossil?.taskGain || rawTask.gain || {}) },
        dataCount: Math.max(0, Math.round(aiNumber(fossil?.taskDataCount ?? rawTask.dataCount))),
        pickCard: Boolean(fossil?.taskPickCard || rawTask.pickCard),
        fossilId: fossil?.fossilId || rawTask.fossilId || null,
      };
    }

    function getAiChongTransportDeliveryRouteTarget(rocket, player = getCurrentPlayer()) {
      if (!isAiChongFossilToken(rocket)) return null;
      const task = getAiChongTransportTaskForRocket(rocket);
      if (!task?.destinationPlanetId) return null;
      const coordinate = getAiPlanetCoordinateById(task.destinationPlanetId);
      if (!coordinate) return null;
      const value = scoreAiChongTransportCompletionValue(task, player, {
        fossilId: task.fossilId,
      });
      return {
        id: `chong-transport:${rocket.id}:${task.destinationPlanetId}`,
        label: `运送虫族化石到${task.destinationPlanetId}`,
        kind: "planet",
        chongTransport: true,
        coordinate,
        value: Math.min(38, 8 + value * 0.85),
      };
    }

    function buildAiChongTransportMoveCandidate(input = {}) {
      const rocket = input.rocket || null;
      if (!isAiChongFossilToken(rocket)) return null;
      const player = input.player || getCurrentPlayer();
      const direction = input.direction || null;
      const from = input.from || null;
      const to = input.to || null;
      if (!player || !direction || !from || !to) return null;
      if (input.nextEffect && isAiLandingEffect(input.nextEffect)) return null;

      const task = getAiChongTransportTaskForRocket(rocket);
      if (!task?.destinationPlanetId) return null;
      const destination = getAiPlanetCoordinateById(task.destinationPlanetId);
      if (!destination) return null;
      if (task.destinationPlanetId === "earth" && aiNumber(to.y) > aiNumber(from.y)) return null;

      const oldDistance = getAiSectorDistance(from, destination);
      const newDistance = getAiSectorDistance(to, destination);
      if (!Number.isFinite(Number(oldDistance)) || !Number.isFinite(Number(newDistance))) return null;
      if (newDistance >= oldDistance) return null;

      const deliveryValue = scoreAiChongTransportCompletionValue(task, player, {
        fossilId: task.fossilId,
      });
      const distanceGain = oldDistance - newDistance;
      const routeGain = distanceGain * (task.destinationPlanetId === "earth" ? 13 : 10);
      const arrivalGain = newDistance === 0 ? deliveryValue : deliveryValue * 0.24 / (newDistance + 1);
      const movementGain = routeGain + arrivalGain + (newDistance === 0 ? 7 : 0);
      const paymentCost = Math.max(0, aiNumber(input.paymentCost));
      const indexPenalty = Math.max(0, aiNumber(input.index)) * 0.1;
      const movementCost = paymentCost + indexPenalty;
      const score = movementGain - movementCost;
      if (score < (input.free ? -0.5 : 1.5)) return null;

      return {
        id: input.id || "move",
        kind: input.kind || "quick",
        available: true,
        rocketId: rocket.id,
        rocketLabel: formatRocketLabel(rocket),
        direction: direction.id,
        directionLabel: direction.label,
        deltaX: direction.deltaX,
        deltaY: direction.deltaY,
        from,
        to,
        requiredMovePoints: input.requiredMovePoints,
        terrainRequired: input.terrainRequired,
        paymentRequired: input.paymentRequired,
        routeTarget: {
          id: `chong-transport:${rocket.id}:${task.destinationPlanetId}`,
          label: `运送虫族化石到${task.destinationPlanetId}`,
          kind: "planet",
          chongTransport: true,
          coordinate: destination,
          oldDistance,
          newDistance,
          value: deliveryValue,
        },
        routeScore: movementGain,
        gain: movementGain,
        cost: movementCost,
        score,
        valueBreakdown: {
          movementGain,
          paymentCost,
          movementCost,
          oldDistance,
          newDistance,
          distanceGain,
          deliveryValue,
          chongTransportOnly: true,
        },
      };
    }

    function scoreAiChongTraceTaskProgressValue(task = {}, player = getCurrentPlayer()) {
      if (!task || !player || !task.traceType) return 0;
      const required = Math.max(1, Math.round(aiNumber(task.count || 1)));
      const current = Math.max(0, Math.round(aiNumber(
        chong?.countTraceMarkers?.(alienGameState, player, task.traceType),
      )));
      const missing = Math.max(0, required - current);
      const progressScale = missing <= 0 ? 1 : missing === 1 ? 0.52 : 0.18;
      const panelValue = missing <= 1 ? scoreAiChongPanelUnlockValue(player) * 0.4 : 0;
      return roundAiScore(scoreAiBestChongFossilRewardValue(player) * progressScale + panelValue);
    }

    function scoreAiChongCardTaskChainValue(card, player = getCurrentPlayer()) {
      if (!player || !chong?.isChongCard?.(card) || !chong?.getCardTask) return 0;
      const task = chong.getCardTask(card);
      if (!task) return 0;
      const round = getAiRoundNumber();
      const taskValue = task.kind === "trace"
        ? scoreAiChongTraceTaskProgressValue(task, player)
        : Math.max(
          scoreAiChongTaskRewardValue(task, player),
          scoreAiChongPickupTaskValue(task, player, null, {
            card,
            includePlayCost: false,
          }),
        );
      const scale = task.kind === "transport"
        ? round <= 2 ? 0.72 : round === 3 ? 0.64 : 0.46
        : round <= 2 ? 0.62 : round === 3 ? 0.78 : 0.9;
      return roundAiScore(Math.min(18, Math.max(0, taskValue * scale)));
    }

    function scoreAiAmibaSymbolRewardValue(symbolId, player = getCurrentPlayer()) {
      const reward = amiba?.getSymbolReward?.(symbolId);
      return scoreAiAlienRewardBundle(reward, player);
    }

    function scoreAiAmibaSymbolEntryValue(entry, player = getCurrentPlayer()) {
      if (!entry?.symbolId) return -Infinity;
      const slotId = String(entry.slotId || "");
      const slotTieBreaker = slotId.endsWith("_3") ? 0.25 : 0.1;
      return scoreAiAmibaSymbolRewardValue(entry.symbolId, player) + slotTieBreaker;
    }

    function scoreAiAmibaSingleSymbolChoiceValue(region, player = getCurrentPlayer()) {
      const symbols = amiba?.listSymbolsInRegion?.(alienGameState, region) || [];
      return symbols.reduce((best, entry) => (
        Math.max(best, scoreAiAmibaSymbolEntryValue(entry, player))
      ), 0);
    }

    function scoreAiAmibaRegionRewardValue(region, player = getCurrentPlayer()) {
      const symbols = amiba?.listSymbolsInRegion?.(alienGameState, region) || [];
      return symbols.reduce((total, entry) => (
        total + Math.max(0, scoreAiAmibaSymbolEntryValue(entry, player))
      ), 0);
    }

    function scoreAiAmibaTraceRemovalValue(player = getCurrentPlayer()) {
      if (!amiba?.listPlayerTraceOptions) return 0;
      const alienSlotId = alienGameState.amiba?.revealedSlotId;
      return (amiba.listPlayerTraceOptions(alienGameState, alienSlotId, player) || [])
        .reduce((best, option) => {
          const regionValue = scoreAiAmibaRegionRewardValue(option.region, player);
          const traceLoss = Number(option.position) >= 3 ? 2 : 1;
          return Math.max(best, regionValue - traceLoss);
        }, 0);
    }

    function scoreAiRunezuPlayerSymbolFinalScore(player = getCurrentPlayer()) {
      if (!runezu?.scorePlayerSymbols || !player) return 0;
      return Math.max(0, aiNumber(runezu.scorePlayerSymbols(player)));
    }

    function scoreAiRunezuSymbolFinalGain(symbolId, player = getCurrentPlayer()) {
      if (!runezu?.gainPlayerSymbol || !runezu?.SYMBOL_IDS?.includes(symbolId) || !player) return 0;
      const before = scoreAiRunezuPlayerSymbolFinalScore(player);
      const simulatedPlayer = cloneAiValue(player);
      runezu.gainPlayerSymbol(simulatedPlayer, symbolId);
      return Math.max(0, scoreAiRunezuPlayerSymbolFinalScore(simulatedPlayer) - before);
    }

    function scoreAiRunezuSpendSymbolFinalPenalty(symbolId, player = getCurrentPlayer()) {
      if (!runezu?.spendPlayerSymbol || !runezu?.SYMBOL_IDS?.includes(symbolId) || !player) return 0;
      const before = scoreAiRunezuPlayerSymbolFinalScore(player);
      const simulatedPlayer = cloneAiValue(player);
      if (!runezu.spendPlayerSymbol(simulatedPlayer, symbolId)) return 0;
      const loss = Math.max(0, before - scoreAiRunezuPlayerSymbolFinalScore(simulatedPlayer));
      const round = getAiRoundNumber();
      const weight = round >= FINAL_ROUND_NUMBER ? 0.8 : round >= 3 ? 0.55 : 0.35;
      return loss * weight;
    }

    function scoreAiRunezuFaceRewardValue(position, player = getCurrentPlayer()) {
      return scoreAiAlienRewardBundle(runezu?.getFaceReward?.(position), player);
    }

    function getAiRunezuFaceSymbolEntry(symbolId) {
      if (!symbolId || !runezu?.listFaceSymbolSlots) return null;
      return (runezu.listFaceSymbolSlots(alienGameState) || [])
        .find((entry) => entry?.symbolId === symbolId) || null;
    }

    function scoreAiRunezuSymbolRewardValue(symbolId, player = getCurrentPlayer()) {
      const entry = getAiRunezuFaceSymbolEntry(symbolId);
      if (!entry) return 0;
      return scoreAiRunezuFaceRewardValue(entry.position, player);
    }

    function scoreAiRunezuSymbolBranchValue(branches = [], player = getCurrentPlayer()) {
      return (branches || []).reduce((best, branch) => {
        const symbolIds = branch?.symbolIds || branch || [];
        const value = symbolIds.reduce((total, symbolId) => (
          total + scoreAiRunezuSymbolRewardValue(symbolId, player)
        ), 0);
        return Math.max(best, value);
      }, 0);
    }

    function getAiRunezuPrematureSymbolCardReason(card, playEffects = [], player = getCurrentPlayer()) {
      if (!runezu?.isRunezuCard?.(card)) return null;
      let hasSymbolEffect = false;
      let hasReadySymbolReward = false;
      for (const effect of playEffects || []) {
        if (effect?.type === runezu.EFFECT_TYPES?.SYMBOL_REWARD) {
          hasSymbolEffect = true;
          if (scoreAiRunezuSymbolRewardValue(effect.options?.symbolId, player) > 0) {
            hasReadySymbolReward = true;
          }
        }
        if (effect?.type === runezu.EFFECT_TYPES?.SYMBOL_BRANCH) {
          hasSymbolEffect = true;
          if (scoreAiRunezuSymbolBranchValue(effect.options?.branches || [], player) > 0) {
            hasReadySymbolReward = true;
          }
        }
      }
      const taskBlockedSymbolIds = getAiRunezuBlockedTaskSymbolIds(card, player);
      return (hasSymbolEffect && !hasReadySymbolReward) || taskBlockedSymbolIds.length
        ? "符文族卡牌等待对应 symbol 放入黑圈并具备奖励"
        : null;
    }

    function getAiRunezuTaskPendingSymbolIds(card, player = getCurrentPlayer()) {
      if (!runezu?.isRunezuCard?.(card)) return [];
      const task = card?.runezuTask || runezu?.getCardTask?.(card);
      if (!task || card?.runezuTaskCompleted) return [];
      if (task.kind === "sequential-events") {
        const progress = Array.isArray(card.runezuTaskProgress) ? card.runezuTaskProgress.length : 0;
        const step = (task.steps || [])[progress];
        return step?.symbolId ? [step.symbolId] : [];
      }
      if (task.kind === "three-trace-colors") {
        if (!runezu?.playerHasAllTraceColors?.(alienGameState, player)) return [];
        return (task.rewards || []).filter(Boolean);
      }
      return [];
    }

    function getAiRunezuBlockedTaskSymbolIds(card, player = getCurrentPlayer()) {
      return getAiRunezuTaskPendingSymbolIds(card, player)
        .filter((symbolId) => scoreAiRunezuSymbolRewardValue(symbolId, player) <= 0);
    }

    function scoreAiRunezuSymbolCardSynergy(symbolId, player = getCurrentPlayer(), mappedRewardValue = 0) {
      if (!symbolId || !player) return 0;
      const hand = Array.isArray(player.hand) ? player.hand : [];
      return hand.reduce((total, card) => {
        if (!runezu?.isRunezuCard?.(card)) return total;
        let value = 0;
        const effects = runezu.buildImmediateEffects?.(card) || [];
        for (const effect of effects) {
          if (effect?.type === runezu.EFFECT_TYPES?.SYMBOL_REWARD && effect.options?.symbolId === symbolId) {
            value += 1 + Math.max(0, mappedRewardValue) * 0.45;
          }
          if (effect?.type === runezu.EFFECT_TYPES?.SYMBOL_BRANCH) {
            const branches = effect.options?.branches || [];
            if (branches.some((branch) => (branch.symbolIds || []).includes(symbolId))) {
              value += 0.3 + Math.max(0, mappedRewardValue) * 0.18;
            }
          }
        }
        if (String(card.discardActionCode || "") === String(symbolId).replace("symbol_", "s_")) {
          value += 0.4 + Math.max(0, mappedRewardValue) * 0.22;
        }
        const taskSymbolIds = getAiRunezuTaskPendingSymbolIds(card, player);
        if (taskSymbolIds.includes(symbolId)) {
          value += 1.2 + Math.max(0, mappedRewardValue) * 0.38;
        }
        return total + value;
      }, 0);
    }

    function scoreAiRunezuFaceUnlockValue(position) {
      return ({
        1: 0.4,
        2: 0.4,
        3: 0.4,
        4: 0.9,
        5: 1.5,
        6: 1.5,
        7: 0.9,
      })[Number(position)] || 0;
    }

    function scoreAiRunezuFaceSymbolPlacementChoice(position, symbolId, player = getCurrentPlayer()) {
      if (!runezu?.canPlaceFaceSymbol || !runezu?.SYMBOL_IDS?.includes(symbolId) || !player) return -Infinity;
      const check = runezu.canPlaceFaceSymbol(alienGameState, position, player);
      if (!check?.ok || !(check.choices || []).some((choice) => choice.symbolId === symbolId)) return -Infinity;
      const rewardValue = scoreAiRunezuFaceRewardValue(position, player);
      const finalPenalty = scoreAiRunezuSpendSymbolFinalPenalty(symbolId, player);
      const synergy = scoreAiRunezuSymbolCardSynergy(symbolId, player, rewardValue);
      return roundAiScore(rewardValue + synergy + scoreAiRunezuFaceUnlockValue(position) - finalPenalty);
    }

    function listAiBanrenmaHandCards(player = getCurrentPlayer()) {
      return (player?.hand || []).filter((card) => banrenma?.isBanrenmaCard?.(card));
    }

    function countAiPlayableBanrenmaCards(player = getCurrentPlayer()) {
      if (!player || !players?.canAfford) return 0;
      return listAiBanrenmaHandCards(player)
        .filter((card) => isAiSupportedHandPlayCard(card) && players.canAfford(player, getCardPlayCost(card) || {}))
        .length;
    }

    function scoreAiBanrenmaEnergyIncomeValue(player = getCurrentPlayer(), incomeGain = {}) {
      if (!player || aiNumber(incomeGain?.energy) <= 0) return 0;
      const handCards = listAiBanrenmaHandCards(player).length;
      if (!handCards) return 0;
      const playableCards = countAiPlayableBanrenmaCards(player);
      const resources = player.resources || {};
      const income = player.income || {};
      const round = getAiRoundNumber();
      const energy = Math.max(0, aiNumber(resources.energy));
      const energyIncome = Math.max(0, aiNumber(income.energy));
      let value = Math.min(7, handCards * 1.8 + playableCards * 1.2);
      if (energy <= 1) value += 2.5;
      if (energyIncome <= 2) value += 1.5;
      if (round >= FINAL_ROUND_NUMBER) value *= 0.35;
      else if (round >= 3) value *= 0.7;
      return roundAiScore(Math.max(0, value));
    }

    function scoreAiBanrenmaCardThresholdSetupValue(card, player = getCurrentPlayer()) {
      if (!player || !banrenma?.isBanrenmaCard?.(card)) return 0;
      const conditionEffects = banrenma.buildConditionEffects?.(card) || [];
      if (!conditionEffects.length) return 0;
      const round = getAiRoundNumber();
      const conditionValue = conditionEffects.reduce(
        (total, effect) => total + Math.max(0, scoreAiEffectValue(effect, { player })),
        0,
      );
      const currentScore = Math.max(0, aiNumber(player.resources?.score));
      const nextThreshold = getAiNextMissingFinalScoreThreshold(player);
      const crossesNextThreshold = Boolean(
        nextThreshold
        && currentScore < nextThreshold
        && currentScore + (banrenma.SCORE_MARK_DELTA || 15) >= nextThreshold
      );
      const energyCost = Math.max(
        0,
        aiNumber((getCardPlayCost(card) || {}).energy ?? getCardPrice(card)),
      );
      const energyAfterPlay = Math.max(0, aiNumber(player.resources?.energy) - energyCost);
      let setupValue = round <= 2 ? 6.5 : round === 3 ? 4.2 : 1.6;
      let conditionMultiplier = round <= 2 ? 0.72 : round === 3 ? 0.58 : 0.28;

      if (crossesNextThreshold) {
        setupValue += nextThreshold <= 50 ? 4.5 : 3;
        conditionMultiplier += 0.16;
      }
      if (energyAfterPlay <= 0 && round <= 3) setupValue -= 2.2;
      if (round >= FINAL_ROUND_NUMBER) {
        setupValue -= 1.4;
        conditionMultiplier *= 0.55;
      }

      return roundAiScore(Math.max(0, Math.min(18, setupValue + conditionValue * conditionMultiplier)));
    }

    function scoreAiBestRunezuFacePlacementForSymbol(symbolId, player = getCurrentPlayer()) {
      return (runezu?.FACE_SYMBOL_POSITIONS || [])
        .reduce((best, position) => {
          const score = scoreAiRunezuFaceSymbolPlacementChoice(position, symbolId, player);
          return score > best.score ? { position: Number(position), score } : best;
        }, { position: null, score: -Infinity });
    }

    function scoreAiRunezuSymbolGainValue(symbolId, player = getCurrentPlayer()) {
      if (!runezu?.SYMBOL_IDS?.includes(symbolId) || !player) return 0;
      const simulatedPlayer = cloneAiValue(player);
      runezu?.gainPlayerSymbol?.(simulatedPlayer, symbolId);
      const bestPlacement = scoreAiBestRunezuFacePlacementForSymbol(symbolId, simulatedPlayer);
      const finalGain = scoreAiRunezuSymbolFinalGain(symbolId, player);
      const counts = runezu.getPlayerSymbolCounts?.(player) || {};
      const collectionValue = counts[symbolId] > 0 ? 0.35 : 1.15;
      const round = getAiRoundNumber();
      const finalWeight = round >= FINAL_ROUND_NUMBER ? 0.9 : round >= 3 ? 0.65 : 0.42;
      return roundAiScore(
        1
        + collectionValue
        + finalGain * finalWeight
        + Math.max(0, bestPlacement.score) * 0.72,
      );
    }

    function scoreAiRunezuPanelSymbolRewardValue(reward = {}, player = getCurrentPlayer()) {
      if (!reward?.panelSymbol) return 0;
      const slotId = reward.panelSymbolSlotId;
      const entry = slotId ? alienGameState.runezu?.panelSymbolSlots?.[slotId] : null;
      const symbolValue = entry?.symbolId ? scoreAiRunezuSymbolGainValue(entry.symbolId, player) : 2.5;
      return symbolValue + (reward.refillPanelSymbol ? 0.75 : 0);
    }

    function scoreAiRunezuRewardValue(reward = {}, player = getCurrentPlayer()) {
      if (!reward) return 0;
      return scoreAiAlienRewardBundle({
        ...reward,
        panelSymbolValue: scoreAiRunezuPanelSymbolRewardValue(reward, player),
        symbolValue: reward.symbolId ? scoreAiRunezuSymbolGainValue(reward.symbolId, player) : 0,
      }, player);
    }

    function getAiRunezuSourceSymbol(sourceType, sourceId) {
      if (!runezu?.listSourceSymbols || !alienGameState.runezu?.revealInitialized) return null;
      return (runezu.listSourceSymbols(alienGameState) || [])
        .find((entry) => (
          entry?.sourceType === sourceType
          && String(entry.sourceId) === String(sourceId)
          && !entry.claimedByPlayerId
          && !entry.claimedByPlayerColor
        )) || null;
    }

    function scoreAiRunezuSourceSymbolValue(sourceType, sourceId, player = getCurrentPlayer()) {
      const sourceSymbol = getAiRunezuSourceSymbol(sourceType, sourceId);
      return sourceSymbol?.symbolId
        ? scoreAiRunezuSymbolGainValue(sourceSymbol.symbolId, player)
        : 0;
    }

    function getAiAlienTraceRewardForValuation(mode, reward, player = getCurrentPlayer()) {
      if (!reward || typeof reward !== "object") return reward;
      if (mode === "amiba-grid" && reward.region) {
        return {
          ...reward,
          regionValue: scoreAiAmibaRegionRewardValue(reward.region, player),
        };
      }
      if (mode === "runezu-grid") {
        return {
          ...reward,
          panelSymbolValue: scoreAiRunezuPanelSymbolRewardValue(reward, player),
          symbolValue: reward.symbolId ? scoreAiRunezuSymbolGainValue(reward.symbolId, player) : 0,
        };
      }
      return reward;
    }

    function getAiFangzhouUnlockCount(player = getCurrentPlayer()) {
      if (!player || !fangzhou?.getUnlockCount) return 0;
      return Math.max(0, Math.round(aiNumber(fangzhou.getUnlockCount(alienGameState, player))));
    }

    function getAiFangzhouRequiredUnlockForPosition(position) {
      const pos = Math.max(0, Math.round(aiNumber(position)));
      if (pos <= 1) return 0;
      if (pos === 2) return 1;
      if (pos === 3) return 2;
      if (pos >= 4) return 3;
      return 0;
    }

    function countAiFangzhouCard2InHand(player = getCurrentPlayer()) {
      if (!player || !fangzhou?.isFangzhouCard2) return 0;
      return (player.hand || []).filter((card) => fangzhou.isFangzhouCard2(card)).length;
    }

    function scoreAiFangzhouCreditReadiness(player = getCurrentPlayer()) {
      if (!player) return 0;
      const cost = Math.max(1, aiNumber(fangzhou?.CARD2_PLAY_COST?.credits || 2));
      const credits = Math.max(0, aiNumber(player.resources?.credits));
      if (credits >= cost + 1) return 5.2;
      if (credits >= cost) return 4.2;
      const shortfall = cost - credits;
      const creditIncome = Math.max(0, aiNumber(player.income?.credits));
      if (shortfall <= 1) return 1.4 + Math.min(1.4, creditIncome * 0.35);
      return -Math.min(5, 1.8 + shortfall * 1.2);
    }

    function scoreAiFangzhouPlacementPotentialAtUnlockCount(player = getCurrentPlayer(), unlockCount = 0) {
      if (!player || !fangzhou?.isFangzhouRevealedSlot || !fangzhou?.getTraceGrid) return 0;
      const allowedUnlockCount = Math.max(0, Math.round(aiNumber(unlockCount)));
      const candidates = [];
      for (const alienSlotId of aliens.ALIEN_SLOT_IDS || []) {
        if (!fangzhou.isFangzhouRevealedSlot(alienGameState, alienSlotId)) continue;
        const grid = fangzhou.getTraceGrid(alienGameState, alienSlotId);
        for (const traceType of fangzhou.TRACE_TYPES || AI_TRACE_TYPES) {
          for (const rawPosition of fangzhou.TRACE_POSITIONS || []) {
            const position = Number(rawPosition);
            if (getAiFangzhouRequiredUnlockForPosition(position) > allowedUnlockCount) continue;
            if (grid?.[traceType]?.[position]) continue;
            const rawReward = fangzhou.getTraceReward?.(traceType, position);
            const reward = getAiAlienTraceRewardForValuation("fangzhou-grid", rawReward, player);
            const directScore = Math.max(0, aiNumber(reward?.gain?.score));
            const value = scoreAiAlienTraceValue({
              player,
              traceType,
              alienSlotId,
              mode: "fangzhou-grid",
              position,
              reward,
            })
              + scoreAiAlienGridPosition("fangzhou-grid", traceType, position, "")
              + scoreAiPaceValueForDirectScore(directScore, player, {
                baseWeight: getAiRoundNumber() >= 3 ? 0.55 : 0.28,
                pressureWeight: getAiRoundNumber() >= 3 ? 0.22 : 0.12,
              });
            candidates.push(value);
          }
        }
      }
      candidates.sort((left, right) => right - left);
      return roundAiScore(Math.max(0, aiNumber(candidates[0])) + Math.max(0, aiNumber(candidates[1])) * 0.35);
    }

    function scoreAiFangzhouUnlockChoiceValue(player = getCurrentPlayer(), traceType = null) {
      if (!player || !fangzhou?.canUnlockCard2ForTrace) return 0;
      if (traceType && !fangzhou.canUnlockCard2ForTrace(alienGameState, player, traceType)) return -Infinity;
      const unlockCount = getAiFangzhouUnlockCount(player);
      if (unlockCount >= 3) return 0;
      const nextUnlockCount = Math.min(3, unlockCount + 1);
      const currentPotential = scoreAiFangzhouPlacementPotentialAtUnlockCount(player, unlockCount);
      const nextPotential = scoreAiFangzhouPlacementPotentialAtUnlockCount(player, nextUnlockCount);
      const openedPlacementValue = Math.max(0, nextPotential - currentPotential);
      const creditReadiness = scoreAiFangzhouCreditReadiness(player);
      const cardBacklog = Math.max(0, countAiFangzhouCard2InHand(player) - 1);
      const round = getAiRoundNumber();
      let value = 0;
      if (unlockCount <= 0) value += 9.5;
      else if (unlockCount === 1) value += 7.2;
      else value += round <= 2 ? 3.4 : 4.8;
      value += openedPlacementValue * (unlockCount <= 1 ? 0.65 : 0.48);
      value += creditReadiness;
      value -= cardBacklog * (creditReadiness < 2 ? 2.2 : 0.8);
      if (round >= FINAL_ROUND_NUMBER && openedPlacementValue < 4) value -= 2;
      return roundAiScore(Math.max(-6, Math.min(24, value)));
    }

    function getAiFangzhouCard1RewardIndexes() {
      if (!fangzhou?.getCard1Effect) return [];
      const fallbackIndexes = [0, 1, 2, 3, 4, 5, 6, 7, 8];
      const state = alienGameState?.fangzhou || {};
      const revealedSinceShuffle = Math.max(0, Math.round(aiNumber(state.card1RevealedSinceShuffle)));
      const threshold = Math.max(1, Math.round(aiNumber(fangzhou.CARD1_RESHUFFLE_THRESHOLD || 5)));
      if (revealedSinceShuffle >= threshold) return fallbackIndexes;
      const deck = Array.isArray(state.card1Deck)
        ? state.card1Deck
          .map((index) => Math.round(Number(index)))
          .filter((index) => fangzhou.getCard1Effect(index, "advanced"))
        : [];
      return deck.length ? deck : fallbackIndexes;
    }

    function getAiSafePositiveScore(callback, fallback = 0) {
      if (typeof callback !== "function") return fallback;
      try {
        const value = callback();
        return Number.isFinite(Number(value)) ? Math.max(0, Number(value)) : fallback;
      } catch (_error) {
        return fallback;
      }
    }

    function scoreAiFangzhouCard1EffectValue(effect = {}, player = getCurrentPlayer(), options = {}) {
      if (!effect || typeof effect !== "object") return 0;
      let value = 0;
      const gain = effect.gain || {};
      if (gain && Object.keys(gain).length) {
        value += scoreAiResourceBundle(gain);
        value += scoreAiThresholdPressureForScoreGain(gain.score, player) * 0.7;
        value += scoreAiMidgameResourceContinuationValue(gain, player, { scale: 0.45 });
      }
      const dataCount = Math.max(0, Math.round(aiNumber(effect.dataCount)));
      if (dataCount > 0) {
        value += dataCount * AI_RESOURCE_VALUES.availableData;
        value += scoreAiMidgameResourceContinuationValue({ availableData: dataCount }, player, { scale: 0.55 });
      }
      value += Math.max(0, Math.round(aiNumber(effect.blindDraw))) * AI_RESOURCE_VALUES.handSize;
      if (effect.pickCard) value += 4.2;
      value += Math.max(0, Math.round(aiNumber(effect.additionalPublicScan))) * AI_RESOURCE_VALUES.additionalPublicScan * 2.2;
      if (effect.alienTrace) {
        value += Math.max(7.5, scoreAiFangzhouPlacementPotentialAtUnlockCount(player, getAiFangzhouUnlockCount(player)) * 0.42);
      }
      if (effect.scanAction) {
        const scanScore = getAiSafePositiveScore(() => (
          scanEffects?.buildScanEffectQueue ? scoreAiScanAction(player) : 0
        ));
        value += Math.max(8, scanScore * 0.5 + scoreAiScanPriorityFloor(player) * 0.6);
      }
      const sectorScanCount = Array.isArray(effect.sectorScans) ? effect.sectorScans.length : 0;
      if (sectorScanCount > 0) {
        value += sectorScanCount * 4.1 + scoreAiScanPriorityFloor(player) * 0.35;
      }
      if (effect.extraSectorScan) value += 3.8;
      if (effect.techAction) {
        const bestTechScore = getAiSafePositiveScore(() => (listAiResearchTechCandidates() || [])[0]?.score);
        value += Math.max(8.5, bestTechScore * 0.42);
      }
      if (effect.launchIgnoreLimit) {
        const launchScore = getAiSafePositiveScore(() => scoreAiLaunchAction(player));
        value += Math.max(5, launchScore * 0.45);
      }
      const freeMoves = Math.max(0, Math.round(aiNumber(effect.freeMoves)));
      if (freeMoves > 0) {
        const bestMoveScore = getAiSafePositiveScore(() => (listAiMoveCandidates() || [])[0]?.score);
        value += freeMoves * AI_RESOURCE_VALUES.movement + bestMoveScore * 0.22;
      }
      const cap = Math.max(8, aiNumber(options.cap || 32));
      return roundAiScore(Math.max(0, Math.min(cap, value)));
    }

    function scoreAiFangzhouCard2AdvancedRewardValue(player = getCurrentPlayer()) {
      const indexes = getAiFangzhouCard1RewardIndexes();
      if (!indexes.length) return 16;
      const values = indexes
        .map((index) => fangzhou?.getCard1Effect?.(index, "advanced"))
        .map((effect) => scoreAiFangzhouCard1EffectValue(effect, player, { cap: 34 }))
        .filter((value) => Number.isFinite(Number(value)));
      if (!values.length) return 16;
      const average = values.reduce((total, value) => total + value, 0) / values.length;
      const best = Math.max(...values);
      const creditReadiness = scoreAiFangzhouCreditReadiness(player) * 0.32;
      return roundAiScore(Math.min(34, average * 0.78 + best * 0.22 + creditReadiness));
    }

    function scoreAiBanrenmaTraceTimingValue(mode, reward, player = getCurrentPlayer(), position = null) {
      if (mode !== "banrenma-grid" || !reward || !player) return 0;
      const pos = Number(position);
      const directScore = Math.max(0, aiNumber(reward.gain?.score));
      const payData = Math.max(0, Math.round(aiNumber(reward.payData)));
      const round = getAiRoundNumber();
      let value = 0;

      if (reward.pickAlienCard) {
        value += round <= 2 ? 4 : round === 3 ? 2.5 : 1;
      }

      if (pos === 2 && payData >= 3 && directScore >= 15) {
        const techCounts = getAiPlayerTechTypeCounts(player);
        const blueTechCount = Math.max(0, aiNumber(techCounts.blue));
        const threshold = getAiNextMissingFinalScoreThreshold(player);
        const currentScore = Math.max(0, aiNumber(player.resources?.score));
        const crossesThreshold = Boolean(threshold && currentScore < threshold && currentScore + directScore >= threshold);
        const availableData = getAiAvailableDataTokenCount(player);
        const dataLeftAfterPayment = Math.max(0, availableData - payData);

        if (round <= 2 && !crossesThreshold) value -= 6;
        else if (round === 3 && blueTechCount >= 2 && !crossesThreshold) value -= 5.5;
        else if (round === 3 && blueTechCount <= 0 && !crossesThreshold) value += 3;
        if (blueTechCount >= 2 && !crossesThreshold) {
          value -= Math.min(16, 5 + (blueTechCount - 2) * 5);
        }
        if (round <= 3 && blueTechCount >= 3 && !crossesThreshold) value -= 18;
        if (dataLeftAfterPayment <= 1 && round <= 3 && !crossesThreshold) value -= 5.5;
        if (round >= FINAL_ROUND_NUMBER || crossesThreshold) value += crossesThreshold ? 9 : 4;
        if (round >= FINAL_ROUND_NUMBER && blueTechCount >= 3 && !crossesThreshold) value -= 1.5;
      }

      return value;
    }

    function scoreAiAomomoTraceTimingValue(mode, reward, player = getCurrentPlayer(), position = null) {
      if (mode !== "aomomo-grid" || !reward || !player) return 0;
      const pos = Number(position);
      const gain = reward.gain || {};
      const fossilGain = Math.max(0, Math.round(aiNumber(gain.aomomoFossils)));
      const fossilCost = Math.max(0, Math.round(aiNumber(reward.payFossils)));
      const directScore = Math.max(0, aiNumber(gain.score));
      const threshold = getAiNextMissingFinalScoreThreshold(player);
      const currentScore = Math.max(0, aiNumber(player.resources?.score));
      const crossesThreshold = Boolean(threshold && currentScore < threshold && currentScore + directScore >= threshold);
      const round = getAiRoundNumber();
      let value = 0;

      value += scoreAiAomomoFossilPlanBonus(fossilGain, player);
      value -= scoreAiAomomoFossilSpendPlanPenalty(fossilCost, player, { directScore, crossesThreshold });

      if ((pos === 2 || pos === 4) && fossilGain > 0) {
        value += pos === 4 ? 1.2 : 0.8;
      }

      if (pos === 5 && directScore >= 20) {
        value += round >= 3 ? 8 : 3.5;
        if (crossesThreshold) value += threshold <= 50 ? 8 : 6;
      }

      if (pos === 1 && fossilCost > 0 && directScore <= 6 && !crossesThreshold) {
        const fossils = getAiAomomoFossilCount(player);
        value -= fossils <= 4 && round <= 3 ? 3.5 : 1;
      }

      return roundAiScore(Math.max(-10, Math.min(18, value)));
    }

    function getAiYichangdianAnomalyForTraceType(traceType) {
      if (!traceType || !yichangdian?.getAnomalyReward) return null;
      return (alienGameState?.yichangdian?.anomalies || []).find((anomaly) => {
        if (anomaly?.traceType === traceType) return true;
        const reward = yichangdian.getAnomalyReward(anomaly?.markerId);
        return reward?.traceType === traceType;
      }) || null;
    }

    function getAiYichangdianAnomalyTriggerDistance(anomaly) {
      const earth = getEarthSectorCoordinate?.();
      if (!anomaly || !earth || typeof solar?.mod8 !== "function") return 4;
      return solar.mod8(aiNumber(earth.x) - aiNumber(anomaly.sectorX)) || 8;
    }

    function scoreAiYichangdianAnomalyRewardValue(anomaly, player = getCurrentPlayer()) {
      const reward = anomaly ? yichangdian?.getAnomalyReward?.(anomaly.markerId) : null;
      if (!reward) return 0;
      let value = scoreAiAlienRewardBundle(reward, player);
      if (reward.pickCard) value += scoreAiMidgameResourceContinuationValue({ handSize: 1 }, player, { scale: 0.35 });
      return roundAiScore(Math.max(0, Math.min(16, value)));
    }

    function scoreAiYichangdianNextAnomalyRewardValue(player = getCurrentPlayer()) {
      if (!yichangdian?.getNextAnomalySectorX || !yichangdian?.getAnomalyBySectorX) return 0;
      const earth = getEarthSectorCoordinate?.();
      if (!earth || !alienGameState?.yichangdian?.revealInitialized) return 0;
      const nextSectorX = yichangdian.getNextAnomalySectorX(alienGameState, earth.x);
      const anomaly = nextSectorX == null ? null : yichangdian.getAnomalyBySectorX(alienGameState, nextSectorX);
      return scoreAiYichangdianAnomalyRewardValue(anomaly, player);
    }

    function scoreAiYichangdianNextAnomalyScanValue(player = getCurrentPlayer()) {
      if (!yichangdian?.getNextAnomalySectorX) return 0;
      const earth = getEarthSectorCoordinate?.();
      if (!earth || !alienGameState?.yichangdian?.revealInitialized) return 0;
      const nextSectorX = yichangdian.getNextAnomalySectorX(alienGameState, earth.x);
      if (nextSectorX == null) return 0;
      const nebula = solar?.getNebulaAtCoordinate?.(nextSectorX, 5, solarState?.sectorBySlot);
      const nebulaId = nebula?.id || null;
      if (nebulaId && sectorXHasAvailableScanTarget?.(nextSectorX)) {
        const targetScore = scoreAiNebulaScanChoice({ nebulaId }, { player });
        return 4.5 + (Number.isFinite(Number(targetScore)) ? targetScore * 0.28 : 0);
      }
      return 3.2 + scoreAiScanPriorityFloor(player) * 0.25;
    }

    function countAiYichangdianAnomalySignals() {
      if (!yichangdian || !solar?.getNebulaAtCoordinate) return 0;
      return (alienGameState?.yichangdian?.anomalies || []).reduce((total, anomaly) => {
        const nebula = solar.getNebulaAtCoordinate(anomaly.sectorX, 5, solarState?.sectorBySlot);
        const tokens = nebulaDataState?.nebulae?.[nebula?.id]?.tokens || [];
        return total + tokens.filter((token) => token?.replacedByPlayerColor || token?.playerColor).length;
      }, 0);
    }

    function getAiYichangdianTopTraceEntry(alienSlotId, traceType) {
      if (!yichangdian?.getTopTraceEntry || alienSlotId == null || !traceType) return null;
      return yichangdian.getTopTraceEntry(alienGameState, alienSlotId, traceType);
    }

    function canAiYichangdianTraceBecomeTop(position, topEntry) {
      const pos = Math.max(0, Math.round(aiNumber(position)));
      if (pos === 1) return true;
      if (!topEntry) return true;
      return pos > 0 && pos < Math.max(1, Math.round(aiNumber(topEntry.position)));
    }

    function scoreAiYichangdianTraceTimingValue(mode, reward, player = getCurrentPlayer(), position = null, traceType = null, alienSlotId = null) {
      if (mode !== "yichangdian-grid" || !player || !traceType) return 0;
      const anomaly = getAiYichangdianAnomalyForTraceType(traceType);
      if (!anomaly) return 0;

      const rewardValue = scoreAiYichangdianAnomalyRewardValue(anomaly, player);
      if (rewardValue <= 0) return 0;

      const topEntry = getAiYichangdianTopTraceEntry(alienSlotId, traceType);
      const ownsTop = topEntry ? aiAlienTraceEntryBelongsToPlayer(topEntry, player) : false;
      const becomesTop = canAiYichangdianTraceBecomeTop(position, topEntry);
      const distance = getAiYichangdianAnomalyTriggerDistance(anomaly);
      const timingScale = distance <= 1 ? 1.35 : distance <= 3 ? 1 : distance <= 5 ? 0.68 : 0.45;
      const round = getAiRoundNumber();
      let value = 0;

      if (!topEntry) {
        value += rewardValue * timingScale * (round <= 3 ? 0.78 : 0.5);
      } else if (ownsTop) {
        value += rewardValue * timingScale * (Number(position) === 1 ? 0.22 : 0.12);
      } else if (becomesTop) {
        value += 2.2 + rewardValue * timingScale * (round <= 3 ? 0.92 : 0.62);
      } else {
        value -= Math.min(5, 1.4 + rewardValue * 0.32);
      }

      if (distance <= 1 && becomesTop && !ownsTop) value += 2.4;
      if (reward?.pickAlienCard && rewardValue < 5) value += 0.8;
      return roundAiScore(Math.max(-6, Math.min(18, value)));
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
      const opportunity = getAiBestSatelliteLandingOpportunity(targetPlanetId, player, { routeDistance: distance });
      if (!opportunity || opportunity.directScore < 10 || aiNumber(opportunity.score) <= 0) return false;
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

    function getAiNextFinalTileSlotIndex(tile) {
      const marks = tile?.marks || [];
      if (!marks.some((mark) => Number(mark.slotIndex) === 1)) return 1;
      if (!marks.some((mark) => Number(mark.slotIndex) === 2)) return 2;
      return 3;
    }

    function getAiPotentialFinalFormulaEntries(player = getCurrentPlayer(), formulaIds = []) {
      if (!player || !endGameScoring?.getFormulaId || !finalScoring?.getTileVariant) return [];
      if (countAiFinalMarksForPlayer(player) >= 3) return [];
      const wanted = new Set((formulaIds || []).filter(Boolean));
      finalScoring.ensureFinalScoringState(finalScoringState);
      const round = getAiRoundNumber();
      const currentScore = Math.max(0, aiNumber(player.resources?.score));
      const nextThreshold = getAiNextMissingFinalScoreThreshold(player);
      const thresholdDistance = nextThreshold == null ? 0 : Math.max(0, nextThreshold - currentScore);
      const roundScale = round >= FINAL_ROUND_NUMBER ? 0.72 : round >= 3 ? 0.6 : 0.44;
      const distanceScale = nextThreshold == null
        ? 0.35
        : thresholdDistance <= 0
          ? 1
          : thresholdDistance <= 10
            ? 0.9
            : thresholdDistance <= 25
              ? 0.65
              : 0.38;

      return Object.values(finalScoringState.tiles || {}).flatMap((tile) => {
        if (!tile || finalScoring.hasPlayerMarkedTile?.(finalScoringState, tile.id, player.id)) return [];
        const variant = finalScoring.getTileVariant(finalScoringState, tile.id);
        const formulaId = endGameScoring.getFormulaId(tile.id, variant);
        if (wanted.size && !wanted.has(formulaId)) return [];
        const slotIndex = getAiNextFinalTileSlotIndex(tile);
        const rawMultiplier = Math.max(0, aiNumber(endGameScoring.getSlotMultiplier(formulaId, slotIndex)));
        if (rawMultiplier <= 0) return [];
        const slotScale = slotIndex === 1 ? 1 : slotIndex === 2 ? 0.72 : 0.42;
        const formulaScale = formulaId === "c1" || formulaId === "c2" ? 0.82 : 1;
        const scale = Math.min(0.95, Math.max(0.12, roundScale * distanceScale * slotScale * formulaScale));
        return [{
          tileId: tile.id,
          variant,
          formulaId,
          slotIndex,
          rawMultiplier,
          multiplier: rawMultiplier * scale,
          threshold: nextThreshold,
          potential: true,
          potentialScale: scale,
        }];
      });
    }

    function getAiPlanningFinalFormulaEntries(player = getCurrentPlayer(), formulaIds = []) {
      const wanted = new Set((formulaIds || []).filter(Boolean));
      const marked = getAiMarkedFinalFormulaEntries(player)
        .filter((entry) => !wanted.size || wanted.has(entry.formulaId));
      return [
        ...marked,
        ...getAiPotentialFinalFormulaEntries(player, formulaIds),
      ];
    }

    function getAiIncomeFinalFormulaEntries(player = getCurrentPlayer()) {
      return getAiPlanningFinalFormulaEntries(player, ["a1", "a2"]);
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
        const earlyPace = getAiRoundNumber() <= 2;
        value += Math.min(
          getAiRoundNumber() >= 3 ? 24 : getAiRoundNumber() === 2 ? 20 : 18,
          gain * (getAiRoundNumber() >= 3 ? 1.55 : getAiRoundNumber() === 2 ? 1.25 : 1.1)
            + paceDistance * (getAiRoundNumber() >= 3 ? 0.08 : earlyPace ? 0.075 : 0.06),
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
      const baseWeight = options.baseWeight ?? (round >= 3 ? 0.5 : round === 2 ? 0.42 : 0.24);
      const deficitWeight = round >= 3 ? 0.012 : round === 2 ? 0.01 : 0.006;
      const pressureWeight = options.pressureWeight ?? (round >= 3 ? 0.22 : round === 2 ? 0.18 : 0.16);
      return gain * (baseWeight + Math.min(0.35, deficit * deficitWeight))
        + aiNumber(scoreAiThresholdPressureForScoreGain(gain, player)) * pressureWeight;
    }

    function scoreAiThirdFinalMarkCashoutValue(scoreGain, player = getCurrentPlayer(), options = {}) {
      const gain = Math.max(0, aiNumber(scoreGain));
      if (!gain || !player) return 0;
      const round = getAiRoundNumber();
      if (round < FINAL_ROUND_NUMBER - 1) return 0;
      const currentScore = Math.max(0, aiNumber(player.resources?.score));
      if (currentScore >= 70 || currentScore < 50) return 0;
      const finalMarks = countAiFinalMarksForPlayer(player);
      if (finalMarks >= 3 || finalMarks < 2) return 0;
      return ai?.valuation?.estimateFinalMarkCashoutValue
        ? ai.valuation.estimateFinalMarkCashoutValue(gain, {
          player,
          currentScore,
          finalMarkCount: finalMarks,
          roundNumber: round,
          finalRoundNumber: FINAL_ROUND_NUMBER,
          threshold: 70,
          weight: options.weight,
        })
        : 0;
    }

    function scoreAiSecondFinalMarkNudgeValue(scoreGain, player = getCurrentPlayer(), options = {}) {
      const gain = Math.max(0, aiNumber(scoreGain));
      if (!gain || !player) return 0;
      const round = getAiRoundNumber();
      if (round < FINAL_ROUND_NUMBER - 1) return 0;
      const currentScore = Math.max(0, aiNumber(player.resources?.score));
      if (currentScore < 45 || currentScore >= 50) return 0;
      const finalMarks = countAiFinalMarksForPlayer(player);
      if (finalMarks >= 2) return 0;
      return ai?.valuation?.estimateFinalMarkCashoutValue
        ? ai.valuation.estimateFinalMarkCashoutValue(gain, {
          player,
          currentScore,
          finalMarkCount: finalMarks,
          roundNumber: round,
          finalRoundNumber: FINAL_ROUND_NUMBER,
          threshold: 50,
          weight: options.weight,
        })
        : 0;
    }

    function scoreAiNoDirectScorePacePenalty(player = getCurrentPlayer(), options = {}) {
      if (!player) return 0;
      const round = getAiRoundNumber();
      if (round > FINAL_ROUND_NUMBER) return 0;
      const deficit = getAiLiveScorePaceDeficit(player);
      const grace = options.grace ?? (round <= 1 ? 20 : 12);
      if (deficit <= grace) return 0;
      const urgency = options.urgency ?? (round >= 3 ? 0.18 : round === 2 ? 0.1 : 0.04);
      const cap = options.cap ?? (round >= 3 ? 14 : 8);
      return Math.min(cap, (deficit - grace) * urgency);
    }

    function getAiNextMissingFinalScoreThreshold(player = getCurrentPlayer()) {
      if (!player) return null;
      const currentScore = Math.max(0, aiNumber(player.resources?.score));
      const finalMarks = countAiFinalMarksForPlayer(player);
      if (finalMarks >= 3) return null;
      if (currentScore < 25 && finalMarks < 1) return 25;
      if (currentScore < 50 && finalMarks < 2) return 50;
      if (currentScore < 70 && finalMarks < 3) return 70;
      return null;
    }

    function scoreAiLateMissingFinalMarkNoDirectPenalty(candidate = {}, player = getCurrentPlayer()) {
      const round = getAiRoundNumber();
      if (!player || round < FINAL_ROUND_NUMBER) return 0;
      const threshold = getAiNextMissingFinalScoreThreshold(player);
      if (!threshold) return 0;
      if (ai?.valuation?.estimateMissingFinalMarkPenalty) {
        return ai.valuation.estimateMissingFinalMarkPenalty(candidate, {
          player,
          currentScore: player.resources?.score,
          finalMarkCount: countAiFinalMarksForPlayer(player),
          roundNumber: round,
          finalRoundNumber: FINAL_ROUND_NUMBER,
          threshold,
        });
      }
      return 0;
    }

    function getAiFinalSecondMarkUrgency(player = getCurrentPlayer()) {
      if (!player || getAiRoundNumber() < FINAL_ROUND_NUMBER) return null;
      const currentScore = Math.max(0, aiNumber(player.resources?.score));
      if (currentScore >= 50 || currentScore < 35) return null;
      const finalMarks = countAiFinalMarksForPlayer(player);
      if (finalMarks > 1 || getAiNextMissingFinalScoreThreshold(player) !== 50) return null;
      return {
        currentScore,
        finalMarks,
        deficit: Math.max(1, 50 - currentScore),
      };
    }

    function scoreAiFinalSecondMarkNoDirectSetupPenalty(player = getCurrentPlayer(), options = {}) {
      const urgency = getAiFinalSecondMarkUrgency(player);
      if (!urgency) return 0;

      const directScoreGain = Math.max(0, aiNumber(options.directScoreGain));
      const followupDirectScore = Math.max(0, aiNumber(options.followupDirectScore));
      if (urgency.currentScore + directScoreGain >= 50) return 0;
      if (
        followupDirectScore > 0
        && urgency.currentScore + directScoreGain + followupDirectScore >= 50
      ) {
        return 0;
      }

      const resources = player.resources || {};
      const credits = Math.max(0, aiNumber(resources.credits));
      const energy = Math.max(0, aiNumber(resources.energy));
      const handSize = Math.max(0, aiNumber(resources.handSize ?? (player.hand || []).length));
      const cost = options.cost || {};
      const setupScore = Math.max(0, aiNumber(options.setupScore));
      const consumesHand = options.consumesHand !== false;
      const consumesLastHand = Boolean(options.consumesLastHand) || (consumesHand && handSize <= 1);
      const consumesLastCredit = Boolean(options.consumesLastCredit)
        || (aiNumber(cost.credits) > 0 && credits <= aiNumber(cost.credits));
      const noCashoutRoute = options.noCashoutRoute !== false;

      let penalty = 5
        + Math.max(0, 14 - urgency.deficit) * 0.7
        + Math.min(8, setupScore * 0.18);
      if (urgency.currentScore >= 45) penalty += 10;
      if (consumesLastHand) penalty += 12;
      else if (consumesHand && handSize <= 2) penalty += 5;
      if (consumesLastCredit) penalty += 4;
      if (credits <= 1 && energy <= 1 && handSize <= 2) penalty += 6;
      if (noCashoutRoute) penalty += 6;
      if (options.actionId === "playCard") {
        const conversionPressure = Math.max(0, aiNumber(options.playCardConversionPressure));
        if (conversionPressure > 0) {
          const hasConcreteScorePath = directScoreGain > 0 || followupDirectScore > 0 || !noCashoutRoute;
          const maxDiscountRatio = hasConcreteScorePath ? 0.72 : 0.28;
          const discountBase = hasConcreteScorePath
            ? 4 + conversionPressure * 0.62 + Math.max(0, handSize - 3) * 1.4
            : Math.min(4, 1.2 + conversionPressure * 0.18);
          penalty -= Math.min(
            penalty * maxDiscountRatio,
            discountBase,
          );
        }
      }
      return roundAiScore(Math.min(36, Math.max(0, penalty)));
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
      if (round <= FINAL_ROUND_NUMBER) return 70;
      return 0;
    }

    function getAiLiveScorePaceDeficit(player = getCurrentPlayer()) {
      const target = getAiLiveScorePaceTarget();
      if (!target || !player) return 0;
      return Math.max(0, target - Math.max(0, aiNumber(player.resources?.score)));
    }

    function scoreAiPassAction(player = getCurrentPlayer()) {
      const deficit = getAiLiveScorePaceDeficit(player);
      const round = getAiRoundNumber();
      const finalMarks = countAiFinalMarksForPlayer(player);
      const finalRoundPassPenalty = ai?.valuation?.estimateFinalRoundPassPenalty
        ? ai.valuation.estimateFinalRoundPassPenalty({
          player,
          currentScore: player?.resources?.score,
          finalMarkCount: finalMarks,
          roundNumber: round,
          finalRoundNumber: FINAL_ROUND_NUMBER,
          threshold: getAiNextMissingFinalScoreThreshold(player),
        })
        : 0;
      const missingThreshold = getAiNextMissingFinalScoreThreshold(player);
      if (finalRoundPassPenalty > 0) return -Math.max(finalRoundPassPenalty, finalMarks <= 1 ? 18 : 15);
      if (round >= FINAL_ROUND_NUMBER && finalMarks < 3 && (deficit > 0 || missingThreshold)) {
        return finalMarks <= 1 ? -18 : (deficit > 25 ? -16 : -12);
      }
      if (round >= 3 && finalMarks < 3 && (deficit > 0 || missingThreshold)) return deficit > 25 ? -10 : -7;
      if (round <= FINAL_ROUND_NUMBER && deficit > 25) return -4;
      if (round <= FINAL_ROUND_NUMBER && deficit > 10) return -2;
      return -0.5;
    }

    function scoreAiResourceReservePenaltyForCost(player = getCurrentPlayer(), cost = {}, options = {}) {
      if (!player) return 0;
      const round = getAiRoundNumber();
      if (round > 3) return 0;
      const resources = player.resources || {};
      const creditCost = Math.max(0, aiNumber(cost.credits));
      const energyCost = Math.max(0, aiNumber(cost.energy));
      if (creditCost <= 0 && energyCost <= 0) return 0;
      const weight = round <= 1 ? 1 : round === 2 ? 0.72 : 0.42;
      const creditsAfter = aiNumber(resources.credits) - creditCost;
      const energyAfter = aiNumber(resources.energy) - energyCost;
      let penalty = 0;
      if (creditCost > 0 && creditsAfter < 2) penalty += (2 - creditsAfter) * 2.1 * weight;
      if (energyCost > 0 && energyAfter < 2) penalty += (2 - energyAfter) * 2.5 * weight;
      if (
        creditCost + energyCost > 0
        && aiNumber(resources.credits) + aiNumber(resources.energy) - creditCost - energyCost <= 2
      ) {
        penalty += 2.5 * weight;
      }
      if (options.actionId === "scan" && getAiMapDemand(getAiStrategyDemand(player).traceTypes, "pink") > 0) {
        penalty *= 0.75;
      }
      return Math.max(0, penalty);
    }

    function scoreAiFinalRoundPlayCardResourceDrainPenalty(card, details = {}) {
      const player = details.player || getCurrentPlayer();
      if (!player || getAiRoundNumber() < FINAL_ROUND_NUMBER) return 0;

      const cost = details.cost || getCardPlayCost(card);
      const creditCost = Math.max(0, aiNumber(cost.credits));
      const energyCost = Math.max(0, aiNumber(cost.energy));
      if (creditCost <= 0 && energyCost <= 0) return 0;

      const directScoreGain = Math.max(0, aiNumber(details.directScoreGain));
      const routePlanCashout = Boolean(details.routePlanCashout);
      if (directScoreGain > 0 || routePlanCashout) return 0;

      const resources = player.resources || {};
      const credits = Math.max(0, aiNumber(resources.credits));
      const energy = Math.max(0, aiNumber(resources.energy));
      const creditsAfter = credits - creditCost;
      const energyAfter = energy - energyCost;
      const finalMarks = countAiFinalMarksForPlayer(player);
      const analyzeCost = getAiAnalyzeEnergyCost(player);
      const scanCost = scanEffects?.getStandardScanCost?.(player) || scanEffects?.SCAN_COST || { energy: 2 };
      const scanEnergyCost = Math.max(0, aiNumber(scanCost.energy));

      let penalty = 0;
      if (creditCost > 0 && creditsAfter <= 0) penalty += energy <= 0 ? 10 : 6;
      if (energyCost > 0 && energyAfter <= 0) penalty += credits <= 0 ? 10 : 7;
      if (creditsAfter + energyAfter <= 1) penalty += finalMarks >= 2 ? 5 : 3;
      if (hasAiAnalyzeReadyDataSlot(player) && energyAfter < analyzeCost) penalty += 7;
      else if (canAiReachAnalyzeReadyWithDataPool(player) && energyAfter < analyzeCost) penalty += 4;
      if (scanEnergyCost > 0 && energyAfter < scanEnergyCost && getAiAvailableDataRoom(player) >= 2) penalty += 3;

      const model = details.model || cardEffects.getCardModel?.(card) || null;
      const playEffects = details.playEffects || cardEffects.buildPlayEffects?.(card) || [];
      const typeCode = getCardTypeCode(card);
      const hasLateRouteSetupEffect = (playEffects || []).some((effect) => (
        effect?.type === "launch"
        || effect?.type === cardEffects.EFFECT_TYPES.CARD_MOVE
        || effect?.type === cardEffects.EFFECT_TYPES.FREE_MOVE
      ));
      if (model?.tasks?.length || model?.endGameScoring || typeCode === 3) penalty *= 0.45;
      if ((player.hand || []).length >= 4 && (model?.tasks?.length || model?.endGameScoring || typeCode === 3)) {
        penalty *= 0.72;
      }
      if (isAiAlienMainPlayCard(card)) penalty *= 0.45;
      if (
        hasLateRouteSetupEffect
        && !routePlanCashout
        && directScoreGain <= 0
        && !isAiAlienMainPlayCard(card)
      ) {
        penalty += model?.tasks?.length || model?.endGameScoring || typeCode === 3 ? 1.2 : 5.5;
      }
      return roundAiScore(Math.min(18, Math.max(0, penalty)));
    }

    function canAiReachAnalyzeReadyWithDataPool(player = getCurrentPlayer()) {
      const requiredSlot = data.ANALYZE_REQUIRED_COMPUTER_SLOT || 6;
      const placedCount = Math.max(0, (data.listComputerPlacedTokens?.(player) || []).length);
      const availableData = Math.max(0, Math.round(aiNumber(player?.resources?.availableData)));
      return placedCount + availableData >= requiredSlot;
    }

    function hasAiAnalyzeReadyDataSlot(player = getCurrentPlayer()) {
      const requiredSlot = data.ANALYZE_REQUIRED_COMPUTER_SLOT || 6;
      return (data.listComputerPlacedTokens?.(player) || [])
        .some((token) => Number(token?.placementSlot) === requiredSlot);
    }

    function getAiAnalyzeEnergyCost(player = getCurrentPlayer()) {
      if (industry?.canAnalyzeWithoutEnergy?.(player)) return 0;
      return Math.max(1, aiNumber(data.ANALYZE_ENERGY_COST || 1));
    }

    function canAiAnalyzeData(player = getCurrentPlayer()) {
      if (!data?.canAnalyzeData) return { ok: false, message: "数据模块不可用" };
      return data.canAnalyzeData(player, {
        skipEnergyCost: getAiAnalyzeEnergyCost(player) <= 0,
      });
    }

    function canAiFangzhouTracePlacementScoreAtLeast(player, traceType, minScore) {
      if (!player || !fangzhou?.isFangzhouRevealedSlot) return false;
      const neededScore = Math.max(1, aiNumber(minScore));
      return (aliens.ALIEN_SLOT_IDS || []).some((alienSlotId) => {
        if (!fangzhou.isFangzhouRevealedSlot(alienGameState, alienSlotId)) return false;
        return (fangzhou.TRACE_POSITIONS || []).some((position) => {
          const canPlace = fangzhou.canPlaceFangzhouTrace?.(
            alienGameState,
            alienSlotId,
            traceType,
            Number(position),
            player,
          );
          if (!canPlace?.ok) return false;
          const reward = fangzhou.getTraceReward?.(traceType, Number(position));
          return aiNumber(reward?.gain?.score) >= neededScore;
        });
      });
    }

    function getAiBestRevealedAlienTraceDirectScore(player, traceType) {
      if (!player || !traceType) return 0;
      return (aliens.ALIEN_SLOT_IDS || []).reduce((best, alienSlotId) => (
        Math.max(best, getAiBestRevealedAlienTraceDirectScoreForSlot(player, alienSlotId, traceType))
      ), 0);
    }

    function listAiEmergencyAnalyzeEnergyTradeCandidates(player = getCurrentPlayer()) {
      if (
        !player
        || !quickTrades?.getTradeAction
        || typeof runQuickTrade !== "function"
        || getAiRoundNumber() !== FINAL_ROUND_NUMBER
        || Math.max(1, Math.round(aiNumber(turnState.turnNumber) || 1)) < 5
        || state.pendingActionExecuted
      ) {
        return [];
      }
      const resources = player.resources || {};
      if (getAiAnalyzeEnergyCost(player) <= 0) return [];
      const currentScore = Math.max(0, aiNumber(resources.score));
      const credits = aiNumber(resources.credits);
      const scoreToSecondMark = Math.max(1, 50 - currentScore);
      const canReachAnalyze = canAiReachAnalyzeReadyWithDataPool(player);
      const hasIncomeFormula = getAiIncomeFinalFormulaEntries(player).length > 0;
      const bestRevealedBlueTraceScore = getAiBestRevealedAlienTraceDirectScore(player, "blue");
      const closeFangzhouBlueSecondMark = currentScore >= 47
        && currentScore < 50
        && credits <= 3
        && hasAiAnalyzeReadyDataSlot(player)
        && canAiFangzhouTracePlacementScoreAtLeast(player, "blue", scoreToSecondMark);
      const closeRevealedBlueSecondMark = currentScore >= 43
        && currentScore < 50
        && credits <= 3
        && hasAiAnalyzeReadyDataSlot(player)
        && currentScore + bestRevealedBlueTraceScore >= 50;
      const placedCount = Math.max(0, (data.listComputerPlacedTokens?.(player) || []).length);
      const tradeValue = ai?.valuation?.estimateSecondMarkAnalyzeEnergyTradeValue
        ? ai.valuation.estimateSecondMarkAnalyzeEnergyTradeValue({
          currentScore,
          finalMarkCount: countAiFinalMarksForPlayer(player),
          energy: aiNumber(resources.energy),
          credits,
          handSize: aiNumber(resources.handSize),
          analyzeEnergyCost: getAiAnalyzeEnergyCost(player),
          roundNumber: getAiRoundNumber(),
          finalRoundNumber: FINAL_ROUND_NUMBER,
          turnNumber: turnState.turnNumber,
          canReachAnalyze,
          hasAnalyzeReadyDataSlot: hasAiAnalyzeReadyDataSlot(player),
          hasIncomeFormula,
          fangzhouBlueScoreCashout: closeFangzhouBlueSecondMark,
          bestRevealedBlueTraceScore,
          placedComputerData: placedCount,
        })
        : 0;
      if (tradeValue <= 0) return [];
      return ["credits-for-energy", "cards-for-energy"]
        .map((tradeId) => {
          const trade = quickTrades.getTradeAction(tradeId);
          const check = quickTrades.canExecuteTrade?.(tradeId, createActionContext()) || { ok: false };
          if (!trade || !check.ok) return null;
          const handTradePenalty = tradeId === "cards-for-energy" ? 2.5 : 0;
          return {
            id: "quickTrade",
            kind: "quick",
            available: true,
            tradeId: trade.id,
            label: trade.label || trade.id,
            score: roundAiScore(tradeValue - handTradePenalty),
            valueBreakdown: {
              emergencyAnalyzeEnergyTrade: true,
              hasIncomeFinalFormula: hasIncomeFormula,
              incomeFormulaSecondMarkFallback: hasIncomeFormula && canReachAnalyze && currentScore >= 49,
              fangzhouBlueScoreCashout: closeFangzhouBlueSecondMark,
              revealedBlueScoreCashout: closeRevealedBlueSecondMark,
              bestRevealedBlueTraceScore,
              placedComputerData: placedCount,
              scoreToSecondFinalMark: scoreToSecondMark,
              handTradePenalty,
            },
          };
        })
        .filter(Boolean)
        .sort((left, right) => aiNumber(right.score) - aiNumber(left.score));
    }

    function listAiFinalAnalyzeEnergyTradeCandidates(player = getCurrentPlayer()) {
      if (
        !player
        || !quickTrades?.getTradeAction
        || typeof runQuickTrade !== "function"
        || getAiRoundNumber() !== FINAL_ROUND_NUMBER
        || state.pendingActionExecuted
        || !canStartMainAction()
      ) {
        return [];
      }

      const resources = player.resources || {};
      const analyzeEnergyCost = getAiAnalyzeEnergyCost(player);
      if (analyzeEnergyCost <= 0) return [];
      if (aiNumber(resources.energy) >= analyzeEnergyCost) return [];
      if (!hasAiAnalyzeReadyDataSlot(player)) return [];

      return ["credits-for-energy", "cards-for-energy"]
        .map((tradeId) => {
          const trade = quickTrades.getTradeAction(tradeId);
          const check = quickTrades.canExecuteTrade?.(tradeId, createActionContext()) || { ok: false };
          if (!trade || !check.ok || aiNumber(trade.gain?.energy) <= 0) return null;
          const simulatedPlayer = createAiPlayerAfterQuickTrade(player, trade);
          if (!simulatedPlayer || !canAiAnalyzeData(simulatedPlayer).ok) return null;
          const analyzeScore = Math.max(0, aiNumber(scoreAiAnalyzeAction(simulatedPlayer)));
          if (analyzeScore < 10) return null;
          const bestBlueTraceScore = getAiBestRevealedAlienTraceDirectScore(player, "blue");
          const tradeCost = scoreAiResourceBundle(trade.cost || {});
          const handTradePenalty = tradeId === "cards-for-energy" ? 2.5 : 0;
          const highScoreContinuationBonus = aiNumber(resources.score) >= 70 ? 4 : 0;
          const score = analyzeScore * 0.92
            + Math.max(0, bestBlueTraceScore) * 0.75
            + highScoreContinuationBonus
            - tradeCost * 0.28
            - handTradePenalty;
          if (score < 10) return null;
          return {
            id: "quickTrade",
            kind: "quick",
            available: true,
            tradeId: trade.id,
            label: trade.label || trade.id,
            reason: "终局交易补能量分析",
            score: roundAiScore(Math.min(48, score)),
            valueBreakdown: {
              finalAnalyzeEnergyTrade: true,
              analyzeScore: roundAiScore(analyzeScore),
              bestBlueTraceScore: roundAiScore(bestBlueTraceScore),
              highScoreContinuationBonus,
              tradeCost: roundAiScore(tradeCost),
              handTradePenalty,
            },
          };
        })
        .filter(Boolean)
        .sort((left, right) => aiNumber(right.score) - aiNumber(left.score));
    }

    function listAiThirdFinalMarkResourceTradeCandidates(player = getCurrentPlayer()) {
      if (
        !player
        || !quickTrades?.getTradeAction
        || typeof runQuickTrade !== "function"
        || getAiRoundNumber() !== FINAL_ROUND_NUMBER
        || state.pendingActionExecuted
      ) {
        return [];
      }
      const resources = player.resources || {};
      const currentScore = Math.max(0, aiNumber(resources.score));
      const finalMarks = countAiFinalMarksForPlayer(player);
      if (
        finalMarks !== 2
        || currentScore < 50
        || currentScore >= 70
        || getAiNextMissingFinalScoreThreshold(player) !== 70
      ) {
        return [];
      }

      const credits = Math.max(0, aiNumber(resources.credits));
      const energy = Math.max(0, aiNumber(resources.energy));
      const handSize = Math.max(0, aiNumber(resources.handSize));
      const publicity = Math.max(0, aiNumber(resources.publicity));
      const distance = Math.max(1, 70 - currentScore);
      const mainActionOpen = canStartMainAction();
      const canReachAnalyze = canAiReachAnalyzeReadyWithDataPool(player) || hasAiAnalyzeReadyDataSlot(player);
      const scanCost = scanEffects?.getStandardScanCost?.(player) || scanEffects?.SCAN_COST || { credits: 1, energy: 2 };
      const scanCreditShortfall = Math.max(0, Math.max(0, aiNumber(scanCost.credits)) - credits);
      const scanEnergyCost = Math.max(0, aiNumber(scanCost.energy));
      const canScanNowForThirdMark = mainActionOpen
        && currentScore >= 67
        && distance <= 3
        && scanCreditShortfall <= 0
        && energy >= scanEnergyCost
        && Boolean(scanEffects?.canExecuteScan?.(player, { standardAction: true })?.ok);
      const scanDirectScoreGain = canScanNowForThirdMark
        ? Math.max(0, aiNumber(getAiScanDirectScoreGain(player)))
        : 0;
      const canScanCashOutThirdMarkNow = canScanNowForThirdMark
        && currentScore + scanDirectScoreGain >= 70;
      const canPreserveCardsForCloseScan = mainActionOpen
        && currentScore >= 68
        && distance <= 2
        && publicity >= 3
        && handSize >= 2
        && scanCreditShortfall === 1
        && energy >= Math.max(0, aiNumber(scanCost.energy));
      const bestPublicTradeCardScore = mainActionOpen
        ? (cardState.publicCards || []).reduce((best, card) => (
          Math.max(best, scoreAiPublicPickCard(card, player, "trade"))
        ), 0)
        : 0;
      const hasUsefulPublicTradeCard = bestPublicTradeCardScore >= 4;
      const canSearchPublicCardForThirdMark = mainActionOpen
        && currentScore >= 50
        && distance > 8
        && publicity >= 6
        && handSize >= 2
        && handSize <= 4
        && bestPublicTradeCardScore >= 12;
      const launchMoveRecoveryByTrade = {
        "credits-for-energy": scoreAiEnergyTradeLaunchMoveRecovery(player, "credits-for-energy"),
        "cards-for-energy": scoreAiEnergyTradeLaunchMoveRecovery(player, "cards-for-energy"),
      };
      const planetCashoutRecoveryByTrade = {
        "credits-for-energy": scoreAiEnergyTradePlanetCashoutRecovery(player, "credits-for-energy"),
        "cards-for-energy": scoreAiEnergyTradePlanetCashoutRecovery(player, "cards-for-energy"),
      };
      const bestLaunchMoveRecoveryScore = Math.max(
        0,
        aiNumber(launchMoveRecoveryByTrade["credits-for-energy"]?.score),
        aiNumber(launchMoveRecoveryByTrade["cards-for-energy"]?.score),
      );
      const bestPlanetCashoutRecoveryScore = Math.max(
        0,
        aiNumber(planetCashoutRecoveryByTrade["credits-for-energy"]?.score),
        aiNumber(planetCashoutRecoveryByTrade["cards-for-energy"]?.score),
      );
      const cardSearchFallback = mainActionOpen
        && handSize <= 1
        && (credits >= 2 || publicity >= 3);
      const canEnergyCardSearchForThirdMark = mainActionOpen
        && distance > 8
        && energy >= 6
        && handSize <= 4
        && (credits <= 0 || handSize <= 3)
        && bestPublicTradeCardScore >= 8;
      const canEnergyCreditScanForThirdMark = mainActionOpen
        && scanCreditShortfall === 1
        && credits <= 0
        && energy >= Math.max(4, Math.max(0, aiNumber(scanCost.energy)) + 2)
        && distance <= 12;
      const energyCreditTrade = quickTrades.getTradeAction("energy-for-credit");
      const playerAfterEnergyCredit = energyCreditTrade
        ? createAiPlayerAfterQuickTrade(player, energyCreditTrade)
        : null;
      const bestHandPlayScoreAfterEnergyCredit = playerAfterEnergyCredit
        ? (player.hand || []).reduce((best, card, handIndex) => (
          Math.max(best, aiNumber(buildAiPlayCardCandidate(card, handIndex, playerAfterEnergyCredit)?.score))
        ), 0)
        : 0;
      const canEnergyCreditRecoveryForThirdMark = mainActionOpen
        && credits <= 0
        && energy >= Math.max(4, Math.max(0, aiNumber(scanCost.energy)) + 2)
        && handSize >= 1
        && bestHandPlayScoreAfterEnergyCredit >= 8
        && distance <= 22;
      if (
        distance > 8
        && !canReachAnalyze
        && bestLaunchMoveRecoveryScore <= 0
        && !cardSearchFallback
        && !canSearchPublicCardForThirdMark
        && !canEnergyCardSearchForThirdMark
        && !canEnergyCreditScanForThirdMark
        && !canEnergyCreditRecoveryForThirdMark
      ) return [];
      const needsAnalyzeEnergy = canReachAnalyze && energy < getAiAnalyzeEnergyCost(player);
      const needsLaunchMoveEnergy = energy <= 1 && bestLaunchMoveRecoveryScore > 0;
      const needsPlanetCashoutEnergy = energy <= 1 && bestPlanetCashoutRecoveryScore > 0;
      const scanEnergyShortfall = Math.max(0, scanEnergyCost - energy);
      const canScanAfterOneEnergyTradeForThirdMark = mainActionOpen
        && distance <= 4
        && scanCreditShortfall <= 0
        && scanEnergyShortfall === 1
        && currentScore + Math.max(0, aiNumber(getAiScanDirectScoreGain(player))) >= 70;
      const canUseExtraEnergy = needsAnalyzeEnergy
        || needsLaunchMoveEnergy
        || needsPlanetCashoutEnergy
        || canScanAfterOneEnergyTradeForThirdMark;
      const launchMoveRecoveryValue = bestLaunchMoveRecoveryScore > 0
        ? Math.min(18, 8 + bestLaunchMoveRecoveryScore * 0.8)
        : 0;
      const planetCashoutRecoveryValue = bestPlanetCashoutRecoveryScore > 0
        ? Math.min(18, 8 + bestPlanetCashoutRecoveryScore * 0.75)
        : 0;
      const baseValue = 20
        + Math.max(0, 16 - distance) * 0.45
        + (canReachAnalyze ? 4 : 0)
        + launchMoveRecoveryValue
        + planetCashoutRecoveryValue
        + (canScanAfterOneEnergyTradeForThirdMark ? 5 : 0);
      const tradeSpecs = [
        {
          tradeId: "credits-for-energy",
          enabled: canUseExtraEnergy && credits >= 2,
          value: baseValue + 5 + Math.min(14, aiNumber(launchMoveRecoveryByTrade["credits-for-energy"]?.score) * 0.7),
          reason: "终局第3标记：信用点换能量续行动",
        },
        {
          tradeId: "cards-for-energy",
          enabled: canUseExtraEnergy && handSize >= 2,
          value: baseValue + (credits <= 0 ? 4 : 1.5)
            + Math.min(14, aiNumber(launchMoveRecoveryByTrade["cards-for-energy"]?.score) * 0.7),
          reason: "终局第3标记：弃牌换能量续行动",
        },
        {
          tradeId: "credits-for-card",
          enabled: mainActionOpen && !canScanCashOutThirdMarkNow && handSize <= 1 && credits >= 2,
          value: baseValue - 1,
          reason: "终局第3标记：补手牌寻找得分",
        },
        {
          tradeId: "publicity-for-card",
          enabled: mainActionOpen && publicity >= 3 && (
            (handSize <= 1 && hasUsefulPublicTradeCard)
            || canPreserveCardsForCloseScan
            || canSearchPublicCardForThirdMark
          ) && !canScanCashOutThirdMarkNow,
          value: baseValue
            + (canPreserveCardsForCloseScan ? 4 : canSearchPublicCardForThirdMark ? 4 : -1)
            + (!canPreserveCardsForCloseScan && !canSearchPublicCardForThirdMark ? Math.min(6, bestPublicTradeCardScore * 0.22) : 0)
            + (canSearchPublicCardForThirdMark ? Math.min(12, bestPublicTradeCardScore * 0.35) : 0),
          reason: canPreserveCardsForCloseScan
            ? "终局第3标记：宣传补牌保留扫描后手牌"
            : canSearchPublicCardForThirdMark
              ? "终局第3标记：宣传精选寻找得分牌"
              : "终局第3标记：宣传换牌寻找得分",
        },
        {
          tradeId: "energy-for-card",
          enabled: canEnergyCardSearchForThirdMark && !canScanCashOutThirdMarkNow,
          value: baseValue
            + 1.5
            + (credits <= 0 ? 2.5 : 0)
            + (handSize <= 2 ? 1.5 : 0)
            + Math.min(8, bestPublicTradeCardScore * 0.28),
          reason: "终局第3标记：富余能量精选寻找得分牌",
        },
        {
          tradeId: "energy-for-credit",
          enabled: canEnergyCreditScanForThirdMark || canEnergyCreditRecoveryForThirdMark,
          value: baseValue
            + 4
            + Math.max(0, 12 - distance) * 0.55
            + (canEnergyCreditRecoveryForThirdMark ? Math.min(8, bestHandPlayScoreAfterEnergyCredit * 0.25) : 0),
          reason: canEnergyCreditScanForThirdMark
            ? "终局第3标记：能量换信用点准备扫描"
            : "终局第3标记：能量换信用点恢复打牌/扫描",
        },
      ];

      return tradeSpecs
        .filter((spec) => spec.enabled)
        .map((spec) => {
          const trade = quickTrades.getTradeAction(spec.tradeId);
          const check = quickTrades.canExecuteTrade?.(spec.tradeId, createActionContext()) || { ok: false };
          if (!trade || !check.ok) return null;
          return {
            id: "quickTrade",
            kind: "quick",
            available: true,
            tradeId: trade.id,
            label: trade.label || trade.id,
            score: roundAiScore(spec.value),
            reason: spec.reason,
            valueBreakdown: {
              thirdFinalMarkResourceTrade: true,
              currentScore,
              scoreToThirdFinalMark: distance,
              finalMarkCount: finalMarks,
              canReachAnalyze,
              launchMoveRecoveryScore: aiNumber(launchMoveRecoveryByTrade[spec.tradeId]?.score),
              cardSearchFallback,
              canPreserveCardsForCloseScan,
              canSearchPublicCardForThirdMark,
              canEnergyCardSearchForThirdMark,
              canEnergyCreditScanForThirdMark,
              canEnergyCreditRecoveryForThirdMark,
              needsAnalyzeEnergy,
              needsLaunchMoveEnergy,
              needsPlanetCashoutEnergy,
              canScanAfterOneEnergyTradeForThirdMark,
              bestHandPlayScoreAfterEnergyCredit: roundAiScore(bestHandPlayScoreAfterEnergyCredit),
              canScanNowForThirdMark,
              canScanCashOutThirdMarkNow,
              scanDirectScoreGain,
              bestPublicTradeCardScore: roundAiScore(bestPublicTradeCardScore),
              scanCost,
            },
          };
        })
        .filter(Boolean)
        .sort((left, right) => aiNumber(right.score) - aiNumber(left.score));
    }

    function estimateAiTradeDiscardOpportunityCost(player = getCurrentPlayer(), trade = null, preserveHandIndex = null) {
      if (!player || !trade) return Infinity;
      const handCost = Math.max(0, Math.round(aiNumber(trade.cost?.handSize)));
      const resourceCost = { ...(trade.cost || {}) };
      delete resourceCost.handSize;
      let cost = scoreAiResourceBundle(resourceCost);
      if (handCost <= 0) return cost;
      const discardCosts = (player.hand || [])
        .map((card, index) => {
          if (Number(index) === Number(preserveHandIndex)) return null;
          const playCandidate = buildAiPlayCardCandidate(card, index, player);
          return getAiDiscardedCardOpportunityCost(card, playCandidate);
        })
        .filter((value) => Number.isFinite(Number(value)))
        .sort((left, right) => Number(left) - Number(right));
      if (discardCosts.length < handCost) return Infinity;
      for (let index = 0; index < handCost; index += 1) {
        cost += Math.max(0, aiNumber(discardCosts[index]));
      }
      return cost;
    }

    function buildAiMainUnlockTradeCandidate(player = getCurrentPlayer(), tradeId = null, playCardCandidates = null) {
      if (!player || !tradeId || !quickTrades?.getTradeAction) return null;
      const trade = quickTrades.getTradeAction(tradeId);
      const check = quickTrades.canExecuteTrade?.(tradeId, createActionContext()) || { ok: false };
      if (!trade || !check.ok || aiNumber(trade.gain?.credits) <= 0) return null;
      const hand = player.hand || [];
      const handCost = Math.max(0, Math.round(aiNumber(trade.cost?.handSize)));
      const cardsRemaining = hand.length - handCost + Math.max(0, Math.round(aiNumber(trade.gain?.handSize)));
      if (cardsRemaining <= 0) return null;
      const currentCredits = Math.max(0, aiNumber(player.resources?.credits));
      const currentScore = Math.max(0, aiNumber(player.resources?.score));
      const currentPlayable = playCardCandidates || listAiPlayCardCandidates(player);
      const currentPlayableByIndex = new Map((currentPlayable || []).map((candidate) => [candidate.handIndex, candidate]));
      const currentBestScore = (currentPlayable || []).reduce((best, candidate) => (
        Math.max(best, aiNumber(candidate?.score))
      ), 0);
      const currentFinalMarks = countAiFinalMarksForPlayer(player);
      const finalLowTailOneCreditUnlock = (
        tradeId === "cards-for-credit"
        && currentCredits === 1
        && getAiRoundNumber() >= FINAL_ROUND_NUMBER
        && currentFinalMarks >= 3
        && !getAiNextMissingFinalScoreThreshold(player)
        && currentScore >= 70
        && currentScore < 155
        && hand.length >= 3
        && currentBestScore < 8
      );
      if (currentCredits > 0 && !finalLowTailOneCreditUnlock) return null;
      const simulatedPlayer = createAiPlayerAfterQuickTrade(player, trade);
      if (!simulatedPlayer) return null;
      const postTradeCandidates = hand
        .map((card, handIndex) => buildAiPlayCardCandidate(card, handIndex, simulatedPlayer))
        .filter(Boolean)
        .map((candidate) => {
          const finalDeltaValue = Math.max(
            0,
            scoreAiFinalFormulaDeltaValue(candidate.finalFormulaDeltas || {}, player, {
              includePotential: true,
              potentialScale: 0.45,
            }),
          );
          const breakdown = candidate.valueBreakdown || {};
          const continuationValue = aiNumber(candidate.score)
            + Math.max(0, aiNumber(candidate.directScoreGain)) * 0.8
            + finalDeltaValue * 0.65
            + Math.max(0, aiNumber(breakdown.c2Type3ProgressValue)) * 0.35
            + Math.max(0, aiNumber(breakdown.cFinalTaskProgressValue)) * 0.35
            + Math.max(0, aiNumber(breakdown.endGameExpectedScore)) * 0.25;
          return {
            ...candidate,
            finalDeltaValue,
            continuationValue,
          };
        })
        .sort((left, right) => aiNumber(right.continuationValue) - aiNumber(left.continuationValue));
      const bestPlay = postTradeCandidates[0] || null;
      if (!bestPlay) return null;
      const currentSameCardScore = aiNumber(currentPlayableByIndex.get(bestPlay.handIndex)?.score);
      const newlyUnlocked = !currentPlayableByIndex.has(bestPlay.handIndex)
        || aiNumber(bestPlay.score) > currentSameCardScore + 1;
      if (!newlyUnlocked && currentBestScore >= aiNumber(bestPlay.score) - 0.5) return null;
      const breakdown = bestPlay.valueBreakdown || {};
      const directScoreGain = Math.max(0, aiNumber(bestPlay.directScoreGain));
      const c2Type3ProgressValue = Math.max(0, aiNumber(breakdown.c2Type3ProgressValue));
      const cFinalTaskProgressValue = Math.max(0, aiNumber(breakdown.cFinalTaskProgressValue));
      const endGameExpectedScore = Math.max(0, aiNumber(breakdown.endGameExpectedScore));
      const concretePlanScore = bestPlay.plan?.actionId === "task" && cFinalTaskProgressValue <= 0
        ? 0
        : Math.max(0, aiNumber(breakdown.planScore));
      const concreteFinalValue = directScoreGain
        + Math.max(0, aiNumber(bestPlay.finalDeltaValue))
        + c2Type3ProgressValue
        + cFinalTaskProgressValue
        + endGameExpectedScore
        + Math.max(0, aiNumber(breakdown.playCardConversionPressure))
        + concretePlanScore;
      const finalMarks = currentFinalMarks;
      if (aiNumber(bestPlay.score) < 8) return null;
      if (finalMarks >= 3 && concreteFinalValue <= 0) return null;
      const discardCost = estimateAiTradeDiscardOpportunityCost(player, trade, bestPlay.handIndex);
      if (!Number.isFinite(discardCost)) return null;
      const nextThreshold = getAiNextMissingFinalScoreThreshold(player);
      const thresholdBonus = nextThreshold && currentScore < nextThreshold && currentScore + directScoreGain >= nextThreshold
        ? (nextThreshold >= 70 ? 9 : 7)
        : 0;
      const score = bestPlay.continuationValue * 0.66
        + thresholdBonus
        + (finalMarks >= 3 ? Math.min(4, concreteFinalValue * 0.15) : 0)
        - discardCost * 0.35;
      if (score < 6.5) return null;
      return {
        id: "quickTrade",
        kind: "quick",
        available: true,
        tradeId: trade.id,
        label: trade.label || trade.id,
        reason: "主行动前：交易信用点解锁高价值打牌",
        score: roundAiScore(Math.min(42, score)),
        valueBreakdown: {
          mainUnlockTrade: true,
          bestPlayCard: {
            handIndex: bestPlay.handIndex,
            cardId: bestPlay.cardId || null,
            cardLabel: bestPlay.cardLabel || null,
            score: roundAiScore(bestPlay.score),
            continuationValue: roundAiScore(bestPlay.continuationValue),
            directScoreGain,
            finalDeltaValue: roundAiScore(bestPlay.finalDeltaValue),
            c2Type3ProgressValue,
            cFinalTaskProgressValue,
            endGameExpectedScore,
          },
          currentBestPlayScore: roundAiScore(currentBestScore),
          newlyUnlocked,
          discardCost: roundAiScore(discardCost),
          finalMarkCount: finalMarks,
          nextFinalMarkThreshold: nextThreshold || null,
          thresholdBonus,
          concreteFinalValue: roundAiScore(concreteFinalValue),
          finalLowTailOneCreditUnlock,
        },
      };
    }

    function listAiMainUnlockTradeCandidates(player = getCurrentPlayer(), playCardCandidates = null) {
      if (
        !player
        || !quickTrades?.getTradeAction
        || typeof runQuickTrade !== "function"
        || getAiRoundNumber() < 2
        || state.pendingActionExecuted
        || !canStartMainAction()
        || (turnState.passedPlayerIds || []).includes(player.id)
      ) {
        return [];
      }
      return ["cards-for-credit", "energy-for-credit"]
        .map((tradeId) => buildAiMainUnlockTradeCandidate(player, tradeId, playCardCandidates))
        .filter(Boolean)
        .sort((left, right) => aiNumber(right.score) - aiNumber(left.score));
    }

    function listAiLateResourceRecoveryTradeCandidates(player = getCurrentPlayer()) {
      if (
        !player
        || !quickTrades?.getTradeAction
        || typeof runQuickTrade !== "function"
        || getAiRoundNumber() < 3
      ) {
        return [];
      }
      const resources = player.resources || {};
      const currentScore = Math.max(0, aiNumber(resources.score));
      const finalMarks = countAiFinalMarksForPlayer(player);
      const paceDeficit = getAiLiveScorePaceDeficit(player);
      const nextThreshold = getAiNextMissingFinalScoreThreshold(player);
      const recoveryThreshold = nextThreshold || 0;
      const canReachAnalyze = canAiReachAnalyzeReadyWithDataPool(player) || hasAiAnalyzeReadyDataSlot(player);
      const credits = Math.max(0, aiNumber(resources.credits));
      const energy = Math.max(0, aiNumber(resources.energy));
      const handSize = Math.max(0, aiNumber(resources.handSize));
      const publicity = Math.max(0, aiNumber(resources.publicity));
      const reservedPlanetCashoutEnergy = state.pendingActionExecuted
        ? getAiReservedPlanetCashoutEnergy(player)
        : null;
      const shouldReservePlanetCashoutEnergy = Boolean(reservedPlanetCashoutEnergy);
      const mainActionOpen = canStartMainAction();
      const moveActionOpen = canAiMoveThisTurn(player.id);
      const canSpendEnergyThisTurn = mainActionOpen || moveActionOpen;
      const finalMarkTargetCount = recoveryThreshold >= 70 ? 3 : 2;
      const canPrepareFinalThresholdAction = getAiRoundNumber() >= FINAL_ROUND_NUMBER
        && Boolean(recoveryThreshold)
        && finalMarks < finalMarkTargetCount
        && !(turnState.passedPlayerIds || []).includes(player.id);
      const canSpendEnergyForRecovery = canSpendEnergyThisTurn || canPrepareFinalThresholdAction;
      const launchMoveRecoveryByTrade = {
        "credits-for-energy": scoreAiEnergyTradeLaunchMoveRecovery(player, "credits-for-energy"),
        "cards-for-energy": scoreAiEnergyTradeLaunchMoveRecovery(player, "cards-for-energy"),
      };
      const bestLaunchMoveRecoveryScore = Math.max(
        0,
        aiNumber(launchMoveRecoveryByTrade["credits-for-energy"]?.score),
        aiNumber(launchMoveRecoveryByTrade["cards-for-energy"]?.score),
      );
      const planetCashoutRecoveryByTrade = {
        "credits-for-energy": scoreAiEnergyTradePlanetCashoutRecovery(player, "credits-for-energy"),
        "cards-for-energy": scoreAiEnergyTradePlanetCashoutRecovery(player, "cards-for-energy"),
      };
      const bestPlanetCashoutRecoveryScore = Math.max(
        0,
        aiNumber(planetCashoutRecoveryByTrade["credits-for-energy"]?.score),
        aiNumber(planetCashoutRecoveryByTrade["cards-for-energy"]?.score),
      );
      const scanCost = scanEffects?.getStandardScanCost?.(player) || scanEffects?.SCAN_COST || { credits: 1, energy: 2 };
      const scanCreditCost = Math.max(0, aiNumber(scanCost.credits));
      const scanEnergyCost = Math.max(0, aiNumber(scanCost.energy));
      const analyzeEnergyCost = getAiAnalyzeEnergyCost(player);
      const hasImmediateRouteRecovery = bestLaunchMoveRecoveryScore > 0 || bestPlanetCashoutRecoveryScore > 0;
      const finalLowHandRefillWindow = getAiRoundNumber() >= FINAL_ROUND_NUMBER
        && mainActionOpen
        && currentScore < 150
        && handSize <= 1
        && (credits >= 2 || energy >= 2 || publicity >= 3);
      const finalLowScoreMainUnlockWindow = getAiRoundNumber() >= FINAL_ROUND_NUMBER
        && (!recoveryThreshold || finalMarks >= 3)
        && currentScore >= 70
        && currentScore < 150
        && credits < scanCreditCost
        && !(turnState.passedPlayerIds || []).includes(player.id);
      const scoreFinalLowScoreScanUnlockTrade = (tradeId) => {
        if (!finalLowScoreMainUnlockWindow) return 0;
        const trade = quickTrades.getTradeAction(tradeId);
        if (!trade) return 0;
        const simulatedPlayer = createAiPlayerAfterQuickTrade(player, trade);
        if (!simulatedPlayer) return 0;
        const simulatedCredits = Math.max(0, aiNumber(simulatedPlayer.resources?.credits));
        const simulatedEnergy = Math.max(0, aiNumber(simulatedPlayer.resources?.energy));
        if (simulatedCredits < scanCreditCost || simulatedEnergy < scanEnergyCost) return 0;
        const canScanAfterTrade = scanEffects?.canExecuteScan?.(simulatedPlayer, { standardAction: true })?.ok;
        const tradeCost = estimateAiTradeDiscardOpportunityCost(player, trade);
        if (!Number.isFinite(tradeCost)) return 0;
        const effectiveTradeCost = finalLowScoreMainUnlockWindow && handSize >= 5
          ? Math.min(tradeCost, 18)
          : tradeCost;
        const scanScore = canScanAfterTrade ? Math.max(0, aiNumber(scoreAiScanAction(simulatedPlayer))) : 0;
        const directScoreGain = canScanAfterTrade ? Math.max(0, aiNumber(getAiScanDirectScoreGain(simulatedPlayer))) : 0;
        const lowScorePressure = Math.max(0, 150 - currentScore) * 0.045;
        const handBuffer = Math.max(0, handSize - Math.max(0, aiNumber(trade.cost?.handSize))) >= 3 ? 1.5 : 0;
        const scanUnlockBaseValue = canScanAfterTrade
          ? 7
          : state.pendingActionExecuted
            ? 8.5
            : 0;
        const preparedScanValue = scanUnlockBaseValue > 0
          ? scanUnlockBaseValue + lowScorePressure + handBuffer
          : 0;
        return Math.max(
          0,
          scanScore * 0.68
            + directScoreGain * 0.8
            + lowScorePressure
            + handBuffer
            + preparedScanValue
            - effectiveTradeCost * 0.18,
        );
      };
      const finalLowScoreScanUnlockByTrade = {
        "cards-for-credit": scoreFinalLowScoreScanUnlockTrade("cards-for-credit"),
        "energy-for-credit": scoreFinalLowScoreScanUnlockTrade("energy-for-credit"),
      };
      const finalLowScoreCardsForCreditScanPrepare = finalLowScoreMainUnlockWindow
        && handSize >= 4
        && scanCreditCost > 0
        && scanCreditCost - credits === 1
        && energy >= scanEnergyCost;
      const finalLowScoreCardsForCreditScanUnlock = finalLowScoreScanUnlockByTrade["cards-for-credit"] >= 3.5
        || finalLowScoreCardsForCreditScanPrepare;
      const finalLowScoreEnergyForCreditScanUnlock = finalLowScoreScanUnlockByTrade["energy-for-credit"] >= 3.5;
      const finalLowScoreScanUnlock = finalLowScoreCardsForCreditScanUnlock || finalLowScoreEnergyForCreditScanUnlock;
      if (!recoveryThreshold && !hasImmediateRouteRecovery && !finalLowHandRefillWindow && !finalLowScoreScanUnlock) return [];
      const scoreToNextThreshold = recoveryThreshold ? Math.max(1, recoveryThreshold - currentScore) : 0;
      const closeThirdMarkScanSetup = getAiRoundNumber() >= FINAL_ROUND_NUMBER
        && nextThreshold === 70
        && finalMarks === 2
        && currentScore >= 64;
      if (
        paceDeficit <= 8
        && finalMarks >= 2
        && !closeThirdMarkScanSetup
        && !hasImmediateRouteRecovery
        && !finalLowHandRefillWindow
        && !finalLowScoreScanUnlock
      ) return [];
      const closeScanCashoutWindow = recoveryThreshold <= 50 ? 10 : 8;
      const closeScanDirectScoreGain = getAiRoundNumber() >= FINAL_ROUND_NUMBER
        ? Math.max(0, aiNumber(getAiScanDirectScoreGain(player)))
        : 0;
      const closeScanCashout = Boolean(recoveryThreshold)
        && getAiRoundNumber() >= FINAL_ROUND_NUMBER
        && mainActionOpen
        && scoreToNextThreshold <= closeScanCashoutWindow
        && finalMarks < (recoveryThreshold >= 70 ? 3 : 2)
        && scanEnergyCost > 0
        && scanCreditCost > 0
        && closeScanDirectScoreGain >= scoreToNextThreshold;
      const scanEnergyShortfall = Math.max(0, scanEnergyCost - energy);
      const scanCreditShortfall = Math.max(0, scanCreditCost - credits);
      const canScanAfterCardsForEnergy = closeScanCashout
        && scanEnergyShortfall === 1
        && scanCreditShortfall <= 0
        && handSize >= 2;
      const canScanAfterCreditsForEnergy = closeScanCashout
        && scanEnergyShortfall === 1
        && credits >= scanCreditCost + 2;
      const canScanAfterCardsForCredit = closeScanCashout
        && scanCreditShortfall === 1
        && energy >= scanEnergyCost
        && handSize >= 2;
      const canScanAfterEnergyForCredit = closeScanCashout
        && scanCreditShortfall === 1
        && energy >= scanEnergyCost + 2;
      const scanCashoutTradeValue = (
        canScanAfterCardsForEnergy
        || canScanAfterCreditsForEnergy
        || canScanAfterCardsForCredit
        || canScanAfterEnergyForCredit
      )
        ? Math.min(
          recoveryThreshold <= 50 ? 18 : 16,
          9
            + Math.max(0, closeScanCashoutWindow - scoreToNextThreshold) * (recoveryThreshold <= 50 ? 0.8 : 0.55)
            + Math.max(0, 3 - finalMarks) * 2,
        )
        : 0;
      const closeThirdMarkScanProgress = closeThirdMarkScanSetup
        && mainActionOpen
        && scoreToNextThreshold <= 6
        && closeScanDirectScoreGain > 0
        && scanCreditShortfall <= 0
        && scanEnergyCost > 0;
      const canScanProgressAfterCardsForEnergy = closeThirdMarkScanProgress
        && scanEnergyShortfall === 1
        && handSize >= 2;
      const canScanProgressAfterCreditsForEnergy = closeThirdMarkScanProgress
        && scanEnergyShortfall === 1
        && credits >= scanCreditCost + 2;
      const scanProgressTradeValue = (
        canScanProgressAfterCardsForEnergy
        || canScanProgressAfterCreditsForEnergy
      )
        ? Math.min(
          11,
          5
            + closeScanDirectScoreGain * 1.1
            + Math.max(0, 6 - scoreToNextThreshold) * 0.7
            + Math.max(0, 3 - finalMarks) * 1.5,
        )
        : 0;
      if (
        nextThreshold === 70
        && currentScore < 64
        && !canReachAnalyze
        && bestLaunchMoveRecoveryScore <= 0
        && bestPlanetCashoutRecoveryScore <= 0
        && scanCashoutTradeValue <= 0
      ) return [];
      const urgency = getAiRoundNumber() >= FINAL_ROUND_NUMBER ? 1 : 0.55;
      const lowEngine = Math.max(0, 2 - energy) * 2.2 + Math.max(0, 2 - handSize) * 2.5;
      const thresholdPressure = recoveryThreshold
        ? Math.min(10, scoreToNextThreshold * (recoveryThreshold <= 50 ? 0.22 : 0.14))
        : 0;
      const launchMoveRecoveryValue = Math.min(8, bestLaunchMoveRecoveryScore * 0.35);
      const planetCashoutRecoveryValue = Math.min(12, bestPlanetCashoutRecoveryScore * 0.32);
      const baseValue = (8 + lowEngine + thresholdPressure + Math.max(0, 2 - finalMarks) * 2.5 + launchMoveRecoveryValue + planetCashoutRecoveryValue) * urgency;
      const bestPublicTradeCardScore = (mainActionOpen || canPrepareFinalThresholdAction)
        ? (cardState.publicCards || []).reduce((best, card) => (
          Math.max(best, scoreAiPublicPickCard(card, player, "trade"))
        ), 0)
        : 0;
      const usefulPublicTradeThreshold = recoveryThreshold <= 50 && scoreToNextThreshold <= 3 ? 8 : 4;
      const hasUsefulPublicTradeCard = bestPublicTradeCardScore >= usefulPublicTradeThreshold;
      const finalLowHandPublicRefill = finalLowHandRefillWindow && bestPublicTradeCardScore >= 0;
      const finalLowHandCreditRefill = finalLowHandPublicRefill && credits >= 2;
      const finalLowHandEnergyRefill = finalLowHandPublicRefill && energy >= 2;
      const secondMarkCreditRecovery = recoveryThreshold <= 50
        && finalMarks <= 1
        && credits <= 0
        && energy >= 2
        && (handSize >= 2 || scanEnergyCost <= Math.max(0, energy - 2));
      const secondMarkAnalyzeEnergyRecovery = recoveryThreshold <= 50
        && finalMarks <= 1
        && currentScore >= 45
        && canReachAnalyze
        && energy < analyzeEnergyCost
        && handSize >= 2;
      const desperateSecondMarkCardSearch = recoveryThreshold <= 50
        && finalMarks <= 1
        && getAiRoundNumber() >= FINAL_ROUND_NUMBER
        && currentScore <= 42
        && scoreToNextThreshold >= 8
        && publicity >= 3
        && handSize <= 4
        && credits <= 1
        && energy <= 1
        && bestPublicTradeCardScore >= 4;
      const secondMarkCardSearch = recoveryThreshold <= 50
        && finalMarks <= 1
        && (mainActionOpen || canPrepareFinalThresholdAction)
        && publicity >= 3
        && handSize <= 4
        && (bestPublicTradeCardScore >= 9 || desperateSecondMarkCardSearch);
      const closeSecondMarkCardSearch = recoveryThreshold <= 50
        && finalMarks <= 1
        && getAiRoundNumber() >= FINAL_ROUND_NUMBER
        && currentScore >= 43
        && currentScore < 50
        && (mainActionOpen || canPrepareFinalThresholdAction)
        && publicity >= 3
        && handSize <= 2;
      const secondMarkEnergyCardSearch = recoveryThreshold <= 50
        && finalMarks <= 1
        && getAiRoundNumber() >= FINAL_ROUND_NUMBER
        && currentScore >= 43
        && currentScore < 50
        && (mainActionOpen || canPrepareFinalThresholdAction)
        && energy >= 2
        && handSize <= 1;
      const creditsAfterCardTrade = Math.max(0, credits - 2);
      const creditCardTradeCanPayFollowup = creditsAfterCardTrade >= 1 || publicity >= 3;
      const avoidCloseSecondMarkCreditCardTrap = getAiRoundNumber() >= FINAL_ROUND_NUMBER
        && recoveryThreshold <= 50
        && scoreToNextThreshold <= 3
        && !creditCardTradeCanPayFollowup;
      const thresholdCreditRecovery = canPrepareFinalThresholdAction
        && credits <= 0
        && handSize >= 3
        && (
          (recoveryThreshold <= 50 && (
            energy >= scanEnergyCost
            || canReachAnalyze
            || bestPublicTradeCardScore >= 9
            || currentScore >= 48
          ))
          || currentScore >= 64
          || scoreToNextThreshold <= 8
        );
      const thirdMarkCreditRecovery = canPrepareFinalThresholdAction
        && recoveryThreshold >= 70
        && finalMarks >= 2
        && credits <= 0
        && energy >= 2
        && (
          handSize >= 1
          || energy >= scanEnergyCost + 2
          || currentScore >= 60
        );
      const tradeSpecs = [
        {
          tradeId: "credits-for-card",
          enabled: (mainActionOpen || canPrepareFinalThresholdAction)
            && credits >= 2
            && handSize <= 1
            && !avoidCloseSecondMarkCreditCardTrap
            && (recoveryThreshold || finalLowHandCreditRefill),
          value: baseValue + (handSize <= 0 ? 6 : 3) + (credits >= 6 ? 2 : 0),
          reason: finalLowHandCreditRefill
            ? "终局低手牌：信用点精选恢复打牌"
            : "后期落后：信用点换牌恢复行动",
        },
        {
          tradeId: "credits-for-energy",
          enabled: canSpendEnergyForRecovery && credits >= 2 && (
            energy <= 0
            || canScanAfterCreditsForEnergy
            || canScanProgressAfterCreditsForEnergy
            || aiNumber(planetCashoutRecoveryByTrade["credits-for-energy"]?.score) > 0
          ),
          value: baseValue + 3 + (handSize > 0 ? 1.5 : 0)
            + Math.min(7, aiNumber(launchMoveRecoveryByTrade["credits-for-energy"]?.score) * 0.4)
            + Math.min(18, aiNumber(planetCashoutRecoveryByTrade["credits-for-energy"]?.score) * 0.55)
            + (canScanAfterCreditsForEnergy ? scanCashoutTradeValue : 0)
            + (canScanProgressAfterCreditsForEnergy ? scanProgressTradeValue : 0),
          reason: aiNumber(planetCashoutRecoveryByTrade["credits-for-energy"]?.score) > 0
            ? "路线兑现：信用点换能量准备环绕/登陆"
            : canScanAfterCreditsForEnergy
              ? "终局临门：信用点换能量准备扫描"
              : canScanProgressAfterCreditsForEnergy
                ? "终局第3标记：信用点换能量推进扫描找分"
              : "后期落后：信用点换能量恢复移动/分析",
        },
        {
          tradeId: "cards-for-energy",
          enabled: canSpendEnergyForRecovery && (
            (handSize >= 4 && energy <= 0)
            || secondMarkAnalyzeEnergyRecovery
            || canScanAfterCardsForEnergy
            || canScanProgressAfterCardsForEnergy
            || aiNumber(planetCashoutRecoveryByTrade["cards-for-energy"]?.score) > 0
          ),
          value: baseValue + 1.5 + (credits <= 0 ? 1 : 0)
            + Math.min(7, aiNumber(launchMoveRecoveryByTrade["cards-for-energy"]?.score) * 0.4)
            + Math.min(15, aiNumber(planetCashoutRecoveryByTrade["cards-for-energy"]?.score) * 0.45)
            + (secondMarkAnalyzeEnergyRecovery ? Math.min(18, 12 + Math.max(0, 8 - scoreToNextThreshold) * 0.75) : 0)
            + (canScanAfterCardsForEnergy ? scanCashoutTradeValue : 0)
            + (canScanProgressAfterCardsForEnergy ? scanProgressTradeValue : 0),
          reason: aiNumber(planetCashoutRecoveryByTrade["cards-for-energy"]?.score) > 0
            ? "路线兑现：弃牌换能量准备环绕/登陆"
            : canScanAfterCardsForEnergy
              ? "终局临门：弃牌换能量准备扫描"
              : canScanProgressAfterCardsForEnergy
                ? "终局第3标记：弃牌换能量推进扫描找分"
              : secondMarkAnalyzeEnergyRecovery
                ? "终局第2标记：弃牌换能量准备分析"
                : "后期落后：弃牌换能量恢复移动/分析",
        },
        {
          tradeId: "cards-for-credit",
          enabled: canScanAfterCardsForCredit || thresholdCreditRecovery || finalLowScoreCardsForCreditScanUnlock,
          value: baseValue
            + (canScanAfterCardsForCredit ? scanCashoutTradeValue : 0)
            + (thresholdCreditRecovery ? Math.min(10, 5 + Math.max(0, 8 - scoreToNextThreshold) * 0.55) : 0)
            + (finalLowScoreCardsForCreditScanUnlock
              ? Math.max(
                finalLowScoreScanUnlockByTrade["cards-for-credit"],
                8 + Math.max(0, 150 - currentScore) * 0.05,
              )
              : 0)
            + (energy >= scanEnergyCost + 1 ? 1 : 0),
          reason: canScanAfterCardsForCredit
            ? "终局临门：弃牌换信用点准备扫描"
            : finalLowScoreCardsForCreditScanUnlock
              ? "终局低分：弃牌换信用点解锁扫描"
              : "终局缺标记：弃牌换信用点准备下一轮兑现",
        },
        {
          tradeId: "energy-for-card",
          enabled: secondMarkEnergyCardSearch || finalLowHandEnergyRefill,
          value: baseValue
            + 5
            + Math.min(8, bestPublicTradeCardScore * 0.28)
            + Math.max(0, 7 - scoreToNextThreshold) * 0.5
            + (finalLowHandEnergyRefill ? 3 + (handSize <= 0 ? 2 : 0) : 0),
          reason: finalLowHandEnergyRefill
            ? "终局低手牌：能量精选恢复打牌"
            : "终局第2标记：能量精选寻找得分牌",
        },
        {
          tradeId: "energy-for-credit",
          enabled: canScanAfterEnergyForCredit
            || (secondMarkCreditRecovery && !shouldReservePlanetCashoutEnergy)
            || thirdMarkCreditRecovery
            || finalLowScoreEnergyForCreditScanUnlock,
          value: baseValue
            + (recoveryThreshold <= 50 ? 8 : 4)
            + (canScanAfterEnergyForCredit ? scanCashoutTradeValue : 0)
            + (secondMarkCreditRecovery ? Math.min(8, scoreToNextThreshold * 0.28) : 0)
            + (thirdMarkCreditRecovery ? Math.min(10, 4 + Math.max(0, 22 - scoreToNextThreshold) * 0.25 + (handSize > 0 ? 2 : 0)) : 0)
            + (finalLowScoreEnergyForCreditScanUnlock ? finalLowScoreScanUnlockByTrade["energy-for-credit"] : 0),
          reason: canScanAfterEnergyForCredit
            ? "终局临门：能量换信用点准备扫描"
            : finalLowScoreEnergyForCreditScanUnlock
              ? "终局低分：能量换信用点解锁扫描"
              : thirdMarkCreditRecovery
                ? "终局第3标记：能量换信用点恢复打牌/扫描"
                : "后期落后：能量换信用点恢复打牌/扫描",
        },
        {
          tradeId: "publicity-for-card",
          enabled: (mainActionOpen || canPrepareFinalThresholdAction) && publicity >= 3 && (
            (handSize <= 1 && hasUsefulPublicTradeCard)
            || finalLowHandPublicRefill
            || secondMarkCardSearch
            || closeSecondMarkCardSearch
          ),
          value: baseValue
            + (handSize <= 0 ? 4 : 2)
            + (!(secondMarkCardSearch || closeSecondMarkCardSearch) ? Math.min(6, bestPublicTradeCardScore * 0.22) : 0)
            + (finalLowHandPublicRefill
              ? 4 + Math.min(8, bestPublicTradeCardScore * 0.35) + Math.max(0, 120 - currentScore) * 0.05
              : 0)
            + ((secondMarkCardSearch || closeSecondMarkCardSearch)
              ? 5 + Math.min(9, bestPublicTradeCardScore * 0.3)
              : 0),
          reason: secondMarkCardSearch || closeSecondMarkCardSearch
            ? "终局第2标记：宣传精选寻找得分牌"
            : finalLowHandPublicRefill
              ? "终局低手牌：宣传精选恢复打牌"
            : "后期落后：宣传换牌恢复行动",
        },
      ];

      return tradeSpecs
        .filter((spec) => spec.enabled)
        .map((spec) => {
          const trade = quickTrades.getTradeAction(spec.tradeId);
          const check = quickTrades.canExecuteTrade?.(spec.tradeId, createActionContext()) || { ok: false };
          if (!trade || !check.ok) return null;
          return {
            id: "quickTrade",
            kind: "quick",
            available: true,
            tradeId: trade.id,
            label: trade.label || trade.id,
            score: roundAiScore(spec.value),
            reason: spec.reason,
            valueBreakdown: {
              lateResourceRecoveryTrade: true,
              currentScore,
              finalMarkCount: finalMarks,
              nextFinalMarkThreshold: recoveryThreshold || null,
              paceDeficit,
              canReachAnalyze,
              scanCashoutTrade: spec.reason.startsWith("终局临门"),
              scanCost,
              closeScanDirectScoreGain,
              scoreToNextThreshold,
              credits,
              energy,
              handSize,
              bestPublicTradeCardScore: roundAiScore(bestPublicTradeCardScore),
              usefulPublicTradeThreshold,
              creditCardTradeCanPayFollowup,
              avoidCloseSecondMarkCreditCardTrap,
              canPrepareFinalThresholdAction,
              secondMarkCreditRecovery,
              secondMarkCardSearch,
              closeSecondMarkCardSearch,
              finalLowHandPublicRefill,
              finalLowHandCreditRefill,
              finalLowHandEnergyRefill,
              secondMarkEnergyCardSearch,
              desperateSecondMarkCardSearch,
              thresholdCreditRecovery,
              finalLowScoreScanUnlock,
              finalLowScoreCardsForCreditScanPrepare,
              finalLowScoreScanUnlockByTrade: {
                "cards-for-credit": roundAiScore(finalLowScoreScanUnlockByTrade["cards-for-credit"]),
                "energy-for-credit": roundAiScore(finalLowScoreScanUnlockByTrade["energy-for-credit"]),
              },
              secondMarkAnalyzeEnergyRecovery,
              thirdMarkCreditRecovery,
              closeThirdMarkScanSetup,
              closeThirdMarkScanProgress,
              scanProgressTradeValue,
              launchMoveRecoveryScore: aiNumber(launchMoveRecoveryByTrade[spec.tradeId]?.score),
              planetCashoutRecoveryScore: aiNumber(planetCashoutRecoveryByTrade[spec.tradeId]?.score),
              planetCashoutRecoveryPlan: planetCashoutRecoveryByTrade[spec.tradeId]?.plan || null,
              reservedPlanetCashoutEnergy,
            },
          };
        })
        .filter(Boolean)
        .sort((left, right) => aiNumber(right.score) - aiNumber(left.score));
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

    function countAiStandardScansThisRound(player = getCurrentPlayer()) {
      if (!player) return 0;
      const round = getAiRoundNumber();
      return (aiAutoBattleState.logs || []).filter((entry) => (
        entry?.type === "turn-action"
        && entry.roundNumber === round
        && entry.playerId === player.id
        && entry.details?.action?.id === "scan"
      )).length;
    }

    function getAiFinalRoundProgressPenaltyScale(actionId, rawCandidate = {}, graphCandidate = {}, player = getCurrentPlayer()) {
      const round = getAiRoundNumber();
      if (!player || round < FINAL_ROUND_NUMBER) return 1;
      const nextThreshold = getAiNextMissingFinalScoreThreshold(player);
      if (!nextThreshold) return 1;

      const currentScore = Math.max(0, aiNumber(player?.resources?.score));
      if (currentScore >= nextThreshold) return 1;
      const directScoreGain = Math.max(0, aiNumber(rawCandidate.directScoreGain));
      const followupDirectScore = Math.max(0, aiNumber(rawCandidate.followupMainAction?.directScoreGain));
      if (currentScore + directScoreGain + followupDirectScore >= nextThreshold) return 0;

      const nestedBestScore = getAiBestNestedCandidateScore(rawCandidate);
      const baseNet = getAiActionGraphBaseNet(graphCandidate);
      const usefulSetupScore = Math.max(0, aiNumber(nestedBestScore ?? baseNet));
      if (["scan", "playCard", "researchTech", "analyze", "placeData"].includes(actionId)) {
        const baseScale = actionId === "scan"
          ? 0.35
          : actionId === "playCard"
            ? 0.38
            : actionId === "researchTech"
              ? 0.45
              : 0.42;
        return usefulSetupScore > 0 ? baseScale : Math.min(0.7, baseScale + 0.18);
      }
      if (actionId === "quickTrade" && /恢复|分析|移动|能量|信用/.test(String(rawCandidate.reason || ""))) {
        return 0.55;
      }
      if (actionId === "cardCorner") return usefulSetupScore > 0 ? 0.58 : 0.8;
      if (actionId === "move") {
        const followupActionId = String(rawCandidate.followupMainAction?.actionId || "");
        const followupTiming = String(rawCandidate.followupMainAction?.timing || "");
        if (
          currentScore < 38
          && followupDirectScore >= 7
          && followupActionId === "land"
          && followupTiming === "immediate"
        ) {
          return 0.18;
        }
        return followupDirectScore > 0 ? 0.45 : 1;
      }
      return 1;
    }

    function getAiPlayerStyle(player = getCurrentPlayer()) {
      const style = String(player?.aiStyle || "");
      return AI_STYLE_IDS.includes(style) ? style : "balanced";
    }

    function getAiCandidateStyleActionId(rawCandidate = {}) {
      const actionId = String(rawCandidate.id || "");
      const planAction = String(rawCandidate.plan?.actionId || rawCandidate.followupMainAction?.actionId || "");
      if (actionId === "move" && planAction) return planAction;
      if (actionId === "cardCorner" && planAction) return planAction;
      if (actionId === "industry" && rawCandidate.abilityId === "stratus_public_corners") return "cardCorner";
      if (actionId === "industry" && rawCandidate.abilityId === "huanyu_free_moves") return "move";
      return actionId;
    }

    function getAiOpeningStyleMultiplier(rawCandidate = {}, player = getCurrentPlayer()) {
      const style = getAiPlayerStyle(player);
      const actionId = getAiCandidateStyleActionId(rawCandidate);
      const effectTypes = rawCandidate.effectTypes || [];
      const hasScanEffect = effectTypes.some((type) => isAiCardScanEffectType(type));
      const hasTaskPlan = rawCandidate.plan?.actionId === "task" || rawCandidate.plan?.type === "card-synergy";
      const tables = {
        scanner: {
          scan: 1.16,
          analyze: 1.12,
          placeData: 1.08,
          playCard: hasScanEffect ? 1.1 : 0.98,
          researchTech: 0.98,
          land: 0.96,
          orbit: 0.96,
        },
        route: {
          launch: 1.14,
          move: 1.1,
          land: 1.15,
          orbit: 1.13,
          playCard: rawCandidate.plan?.actionId === "launch" || rawCandidate.plan?.actionId === "land" ? 1.08 : 0.98,
          scan: 0.96,
        },
        task: {
          playCard: 1.16,
          cardCorner: 1.08,
          quickTrade: String(rawCandidate.tradeId || "").includes("card") ? 1.08 : 1,
          researchTech: 1.03,
          scan: hasScanEffect ? 1.04 : 0.98,
        },
        tech: {
          researchTech: 1.16,
          playCard: hasTaskPlan ? 1.04 : 1,
          scan: 0.98,
          analyze: 1.03,
          quickTrade: 1.04,
        },
        balanced: {
          playCard: 1.04,
          researchTech: 1.04,
          analyze: 1.03,
          land: 1.02,
          orbit: 1.02,
        },
      };
      return tables[style]?.[actionId] ?? 1;
    }

    function getAiFinalFormulaStyleMultiplier(rawCandidate = {}, markedFinalFormulas = []) {
      if (!Array.isArray(markedFinalFormulas) || !markedFinalFormulas.length) return 1;
      const actionId = getAiCandidateStyleActionId(rawCandidate);
      const formulas = new Set(markedFinalFormulas.map((entry) => String(entry?.formulaId || "")));
      let multiplier = 1;
      if ((formulas.has("c1") || formulas.has("c2")) && ["playCard", "cardCorner", "quickTrade"].includes(actionId)) {
        multiplier += actionId === "playCard" ? 0.12 : 0.05;
      }
      if ((formulas.has("d1") || formulas.has("d2")) && actionId === "researchTech") {
        multiplier += 0.12;
      }
      if (formulas.has("b2") && ["land", "orbit", "scan", "move"].includes(actionId)) {
        multiplier += actionId === "scan" ? 0.08 : 0.1;
      }
      if (formulas.has("b1") && ["land", "scan", "analyze"].includes(actionId)) {
        multiplier += 0.07;
      }
      if ((formulas.has("a1") || formulas.has("a2")) && ["playCard", "quickTrade", "pass"].includes(actionId)) {
        multiplier += actionId === "pass" ? 0.04 : 0.06;
      }
      return multiplier;
    }

    function getAiCandidateDirectScoreForFinalMark(rawCandidate = {}) {
      return Math.max(
        0,
        aiNumber(rawCandidate.directScoreGain),
        aiNumber(rawCandidate.followupMainAction?.directScoreGain),
        aiNumber(rawCandidate.valueBreakdown?.directScoreGain),
        aiNumber(rawCandidate.valueBreakdown?.landingDirectScoreGain),
      );
    }

    function getAiMissingFinalMarkUrgencyMultiplier(rawCandidate = {}, player = getCurrentPlayer()) {
      if (!player || getAiRoundNumber() < 3) return 1;
      const threshold = getAiNextMissingFinalScoreThreshold(player);
      if (!threshold) return 1;
      const actionId = getAiCandidateStyleActionId(rawCandidate);
      if (!["scan", "analyze", "playCard", "researchTech", "land", "orbit", "move"].includes(actionId)) return 1;
      const directScoreGain = getAiCandidateDirectScoreForFinalMark(rawCandidate);
      if (directScoreGain <= 0) return 1;
      const currentScore = Math.max(0, aiNumber(player.resources?.score));
      const finalMarks = countAiFinalMarksForPlayer(player);
      let multiplier = 1;
      if (currentScore < threshold && currentScore + directScoreGain >= threshold) {
        multiplier += threshold >= 70 ? 0.22 : 0.17;
      } else if (getAiRoundNumber() >= FINAL_ROUND_NUMBER && currentScore < threshold) {
        multiplier += Math.min(0.1, directScoreGain * 0.018);
      }
      if (threshold >= 70 && finalMarks === 2 && ["land", "orbit", "move"].includes(actionId)) {
        multiplier += 0.06;
      }
      if (threshold <= 50 && finalMarks <= 1 && ["scan", "analyze", "playCard"].includes(actionId)) {
        multiplier += 0.06;
      }
      return multiplier;
    }

    function adjustAiActionGraphCandidateForStyle(rawCandidate = {}, graphCandidate = {}, player = getCurrentPlayer(), markedFinalFormulas = []) {
      if (!graphCandidate || rawCandidate.available === false) return graphCandidate;
      const styleMultiplier = getAiOpeningStyleMultiplier(rawCandidate, player);
      const finalFormulaMultiplier = getAiFinalFormulaStyleMultiplier(rawCandidate, markedFinalFormulas);
      const missingFinalMarkMultiplier = getAiMissingFinalMarkUrgencyMultiplier(rawCandidate, player);
      const multiplier = Math.max(0.86, Math.min(1.36, styleMultiplier * finalFormulaMultiplier * missingFinalMarkMultiplier));
      if (Math.abs(multiplier - 1) < 0.001) return graphCandidate;
      const currentNet = aiNumber(graphCandidate.net ?? graphCandidate.breakdown?.net);
      const adjustedNet = currentNet >= 0
        ? currentNet * multiplier
        : currentNet + Math.max(-2, Math.min(2, (multiplier - 1) * 6));
      return {
        ...graphCandidate,
        net: roundAiScore(adjustedNet),
        breakdown: {
          ...(graphCandidate.breakdown || {}),
          aiStyle: getAiPlayerStyle(player),
          aiStyleMultiplier: roundAiScore(styleMultiplier),
          finalFormulaStyleMultiplier: roundAiScore(finalFormulaMultiplier),
          missingFinalMarkMultiplier: roundAiScore(missingFinalMarkMultiplier),
          netBeforeStyle: roundAiScore(currentNet),
          net: roundAiScore(adjustedNet),
        },
      };
    }

    function adjustAiActionGraphCandidate(rawCandidate = {}, graphCandidate = {}, player = getCurrentPlayer()) {
      const actionId = String(rawCandidate.id || graphCandidate.id || "");
      const round = getAiRoundNumber();
      const deficit = getAiLiveScorePaceDeficit(player);
      if (round > FINAL_ROUND_NUMBER || deficit <= 0) return graphCandidate;
      const broadGoalActions = new Set(["playCard", "researchTech", "scan"]);
      const rawMissingFinalMarkPenalty = aiNumber(
        graphCandidate.missingFinalMarkPenalty ?? graphCandidate.breakdown?.missingFinalMarkPenalty,
      );
      const missingPenaltyScale = getAiFinalRoundProgressPenaltyScale(actionId, rawCandidate, graphCandidate, player);
      const graphMissingFinalMarkPenalty = rawMissingFinalMarkPenalty * missingPenaltyScale;
      const hasMissingPenaltyAdjustment = rawMissingFinalMarkPenalty > 0
        && Math.abs(missingPenaltyScale - 1) > 0.001;
      const lateNoDirectPenalty = graphMissingFinalMarkPenalty > 0
        ? 0
        : scoreAiLateMissingFinalMarkNoDirectPenalty(rawCandidate, player);
      if (!broadGoalActions.has(actionId) && lateNoDirectPenalty <= 0 && !hasMissingPenaltyAdjustment) return graphCandidate;

      const baseNet = getAiActionGraphBaseNet(graphCandidate);
      const goalBonus = aiNumber(graphCandidate.goalBonus ?? graphCandidate.breakdown?.goalBonus);
      if (!goalBonus && lateNoDirectPenalty <= 0 && !hasMissingPenaltyAdjustment) return graphCandidate;

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
      if (actionId === "scan") {
        const directScoreGain = Math.max(0, aiNumber(rawCandidate.directScoreGain));
        const placedCount = Math.max(0, (data.listComputerPlacedTokens?.(player) || []).length);
        const scanCountThisRound = countAiStandardScansThisRound(player);
        const canOpenAnalyze = placedCount >= (data.ANALYZE_REQUIRED_COMPUTER_SLOT || 6) - 1;
        if (directScoreGain <= 0 && !canOpenAnalyze) {
          goalBonusScale = Math.min(goalBonusScale, round <= 2 ? 0.38 : 0.22);
          urgencyPenalty += Math.min(16, goalBonus * (round <= 2 ? 0.34 : 0.52) + scanCountThisRound * 3.5);
        } else if (scanCountThisRound >= 1 && directScoreGain < 3) {
          goalBonusScale = Math.min(goalBonusScale, 0.5);
          urgencyPenalty += Math.min(10, goalBonus * 0.25 + scanCountThisRound * 2.5);
        }
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

      const currentScore = Math.max(0, aiNumber(player?.resources?.score));
      const finalMarks = countAiFinalMarksForPlayer(player);
      const nextThreshold = getAiNextMissingFinalScoreThreshold(player);
      const directScoreGain = Math.max(0, aiNumber(rawCandidate.directScoreGain));
      if (
        round >= FINAL_ROUND_NUMBER
        && nextThreshold
        && currentScore < nextThreshold
        && ["scan", "playCard", "researchTech"].includes(actionId)
      ) {
        goalBonusScale = Math.max(goalBonusScale, actionId === "scan" ? 0.35 : 0.32);
      }
      if (
        actionId === "researchTech"
        && round >= FINAL_ROUND_NUMBER
        && nextThreshold === 50
        && finalMarks <= 1
        && currentScore + directScoreGain < nextThreshold
      ) {
        goalBonusScale = Math.min(goalBonusScale, 0.45);
        urgencyPenalty += Math.min(8, Math.max(0, nextThreshold - currentScore) * 0.35 + goalBonus * 0.18);
      }
      if (
        actionId === "scan"
        && round >= FINAL_ROUND_NUMBER
        && nextThreshold === 50
        && finalMarks <= 1
        && currentScore < 45
        && currentScore + directScoreGain < nextThreshold
      ) {
        goalBonusScale = Math.min(goalBonusScale, 0.42);
        urgencyPenalty += Math.min(12, Math.max(0, nextThreshold - currentScore) * 0.22 + goalBonus * 0.22);
      }
      if (
        round >= FINAL_ROUND_NUMBER
        && nextThreshold
        && currentScore < nextThreshold
        && ["scan", "playCard", "researchTech"].includes(actionId)
      ) {
        urgencyPenalty = Math.min(urgencyPenalty, actionId === "scan" ? 7 : 8);
      }

      if (goalBonusScale >= 1 && urgencyPenalty <= 0 && lateNoDirectPenalty <= 0) return graphCandidate;

      const finalMarginal = aiNumber(graphCandidate.finalMarginal ?? graphCandidate.breakdown?.finalMarginal);
      const finalMarkCashout = aiNumber(graphCandidate.finalMarkCashout ?? graphCandidate.breakdown?.finalMarkCashout);
      const feasibility = Math.min(1, Math.max(0, aiNumber(graphCandidate.feasibility ?? graphCandidate.breakdown?.feasibility ?? 1)));
      const adjustedGoalBonus = goalBonus * goalBonusScale;
      const adjustedNet = (
        baseNet
        + finalMarginal
        + finalMarkCashout
        + adjustedGoalBonus
        - graphMissingFinalMarkPenalty
        - urgencyPenalty
        - lateNoDirectPenalty
      ) * feasibility;
      return {
        ...graphCandidate,
        goalBonus: roundAiScore(adjustedGoalBonus),
        net: roundAiScore(adjustedNet),
        breakdown: {
          ...(graphCandidate.breakdown || {}),
          goalBonusUnadjusted: roundAiScore(goalBonus),
          goalBonusScale: roundAiScore(goalBonusScale),
          finalMarkCashout: roundAiScore(finalMarkCashout),
          missingFinalMarkPenalty: roundAiScore(graphMissingFinalMarkPenalty),
          missingFinalMarkPenaltyUnadjusted: roundAiScore(rawMissingFinalMarkPenalty),
          missingFinalMarkPenaltyScale: roundAiScore(missingPenaltyScale),
          urgencyPenalty: roundAiScore(urgencyPenalty),
          lateNoDirectPenalty: roundAiScore(lateNoDirectPenalty),
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

    function getAiIncomeIncreaseSnapshot(player = getCurrentPlayer(), incomeOverride = null) {
      const income = incomeOverride || player?.income || {};
      const baseIncome = getAiPlayerCompanyBaseIncome(player);
      return {
        credits: Math.max(0, aiNumber(income.credits) - Math.min(aiNumber(income.credits), aiNumber(baseIncome.credits))),
        energy: Math.max(0, aiNumber(income.energy) - Math.min(aiNumber(income.energy), aiNumber(baseIncome.energy))),
        handSize: Math.max(0, aiNumber(income.handSize) - Math.min(aiNumber(income.handSize), aiNumber(baseIncome.handSize))),
      };
    }

    function getAiIncomeFormulaBase(formulaId, income = {}, player = null) {
      const formulaIncome = player ? getAiIncomeIncreaseSnapshot(player, income) : income;
      if (formulaId === "a1") {
        return Math.max(aiNumber(formulaIncome.credits), aiNumber(formulaIncome.energy));
      }
      if (formulaId === "a2") {
        return Math.min(
          aiNumber(formulaIncome.credits),
          aiNumber(formulaIncome.energy),
          aiNumber(formulaIncome.handSize),
        );
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
        const beforeBase = getAiIncomeFormulaBase(entry.formulaId, beforeIncome, player);
        const afterBase = getAiIncomeFormulaBase(entry.formulaId, afterIncome, player);
        const immediateValue = Math.max(0, afterBase - beforeBase) * multiplier;
        const immediateWeight = entry.potential ? 0.55 : 0.95;
        if (entry.formulaId === "a1") return total + immediateValue * (entry.potential ? 0.45 : 0.85);
        if (immediateValue > 0) return total + immediateValue * immediateWeight;

        const incomeKeys = ["credits", "energy", "handSize"];
        const formulaIncome = getAiIncomeIncreaseSnapshot(player, beforeIncome);
        const bottleneckKeys = incomeKeys.filter((key) => aiNumber(formulaIncome[key]) <= beforeBase);
        const liftedBottlenecks = bottleneckKeys.filter((key) => aiNumber(incomeGain[key]) > 0);
        if (!liftedBottlenecks.length) return total;
        const setupWeight = entry.potential
          ? (getAiRoundNumber() >= 3 ? 0.72 : 0.36)
          : (getAiRoundNumber() >= 3 ? 0.34 : 0.22);
        return total + multiplier * setupWeight * Math.min(1, liftedBottlenecks.length / Math.max(1, bottleneckKeys.length));
      }, 0);
    }

    function scoreAiHandIncomeEngineBacklogValue(player = getCurrentPlayer(), incomeGain = {}) {
      if (!player || aiNumber(incomeGain?.handSize) <= 0) return 0;
      const round = getAiRoundNumber();
      const income = player.income || {};
      const resources = player.resources || {};
      const currentHandIncome = Math.max(0, aiNumber(income.handSize));
      if (currentHandIncome >= 4) return 0;

      const handCount = Math.max(0, (player.hand || []).length);
      const handEngineCards = countAiHandEngineCards(player);
      const handTaskCards = countAiHandTaskCards(player);
      const uncompletedTaskCount = listAiUncompletedCardTasksForPlayer(player).length;
      const completedTasks = Math.max(0, Math.round(aiNumber(player.completedTaskCount)));
      const cEntries = getAiPlanningFinalFormulaEntries(player, ["c1", "c2"]);
      const dEntries = getAiPlanningFinalFormulaEntries(player, ["d1", "d2"]);
      const techCount = countAiPlayerTech(player);
      const hasEngineBacklog = handEngineCards >= 2
        || handTaskCards > 0
        || uncompletedTaskCount > 0
        || (cEntries.length > 0 && completedTasks <= 2)
        || (dEntries.length > 0 && techCount < 9);
      if (!hasEngineBacklog) return 0;

      let value = 0;
      value += Math.max(0, 3 - currentHandIncome) * (round <= 2 ? 1.7 : round === 3 ? 1.15 : 0.55);
      value += Math.max(0, 3 - handCount) * (round <= 2 ? 0.95 : 0.6);
      value += Math.min(4.5, handEngineCards * 0.72 + handTaskCards * 1.05 + uncompletedTaskCount * 0.8);
      if (cEntries.length && completedTasks <= 1) value += round >= 3 ? 1.8 : 1.2;
      if (dEntries.length && techCount < 8) value += Math.min(2.5, Math.max(0, 8 - techCount) * 0.45);
      if (round <= 2 && Math.max(0, aiNumber(resources.score)) < 25) value += 0.9;
      if (currentHandIncome >= 3) value *= 0.45;
      if (round >= FINAL_ROUND_NUMBER) value *= 0.55;
      return roundAiScore(Math.min(7.5, Math.max(0, value)));
    }

    function scoreAiIncomeOpportunityValue(player = getCurrentPlayer(), incomeGain = { credits: 1 }) {
      const gain = incomeGain && typeof incomeGain === "object" ? incomeGain : { credits: 1 };
      const netValue = ai?.valuation?.getIncomeNetValue
        ? ai.valuation.getIncomeNetValue(gain, {
          roundNumber: getAiRoundNumber(),
          finalRoundNumber: FINAL_ROUND_NUMBER,
          hand: player?.hand || [],
          resourceValues: getAiResourceValuesForRound(),
        })
        : scoreAiResourceBundle(gain) * getAiRemainingRoundWeight();
      const remainingIncomeUses = ai?.valuation?.getRemainingIncomeMultiplier
        ? ai.valuation.getRemainingIncomeMultiplier(getAiRoundNumber(), { finalRoundNumber: FINAL_ROUND_NUMBER })
        : getAiRemainingRoundWeight();
      const incomeUseScale = remainingIncomeUses > 0 ? 1 : 0;
      const earlyPressure = getAiEarlyEnginePressure(player);
      const resources = player?.resources || {};
      const income = player?.income || {};
      const incomeFormulaEntries = getAiIncomeFinalFormulaEntries(player);
      const strategicIncomeFit = ai?.valuation?.estimateIncomeStrategicAdjustment
        ? ai.valuation.estimateIncomeStrategicAdjustment(gain, {
          roundNumber: getAiRoundNumber(),
          finalRoundNumber: FINAL_ROUND_NUMBER,
          currentIncome: income,
          currentResources: resources,
          player,
          hasIncomeFinalFormula: incomeFormulaEntries.length > 0,
          hasA2FinalFormula: incomeFormulaEntries.some((entry) => entry.formulaId === "a2"),
          resourceValues: getAiResourceValuesForRound(),
        }) * incomeUseScale
        : 0;
      const creditNeed = aiNumber(gain.credits) > 0
        ? (
          Math.max(0, 5 - aiNumber(resources.credits)) * (getAiRoundNumber() <= 2 ? 1.25 : 0.42)
          + Math.max(0, 4 - aiNumber(income.credits)) * (getAiRoundNumber() <= 2 ? 1.15 : 0.35)
        ) * incomeUseScale
        : 0;
      const energyNeed = aiNumber(gain.energy) > 0
        ? Math.max(0, 3 - aiNumber(resources.energy)) * (getAiRoundNumber() <= 2 ? 0.95 : 0.7) * incomeUseScale
        : 0;
      const handNeed = aiNumber(gain.handSize) > 0
        ? (
          Math.max(0, 4 - aiNumber(resources.handSize)) * (getAiRoundNumber() <= 2 ? 0.75 : 0.55)
          + Math.max(0, 2 - aiNumber(income.handSize)) * (getAiRoundNumber() <= 2 ? 1.7 : 0.9)
          + Math.max(0, 2 - (player?.hand || []).length) * 0.9
        ) * incomeUseScale
        : 0;
      const energyIncomeBalance = aiNumber(gain.energy) > 0
        ? Math.max(0, Math.max(aiNumber(income.credits), aiNumber(income.handSize)) - aiNumber(income.energy))
          * (getAiRoundNumber() <= 2 ? 0.7 : 0.35) * incomeUseScale
        : 0;
      const handIncomeBalance = aiNumber(gain.handSize) > 0
        ? Math.max(0, Math.min(2, Math.max(aiNumber(income.credits), aiNumber(income.energy))) - aiNumber(income.handSize))
          * (getAiRoundNumber() <= 2 ? 0.75 : 0.45) * incomeUseScale
        : 0;
      const handIncomeEngineBacklogValue = scoreAiHandIncomeEngineBacklogValue(player, gain) * incomeUseScale;
      const rawHandIncomeOversupplyPenalty = aiNumber(gain.handSize) > 0
        ? Math.max(0, aiNumber(income.handSize) - 1)
          * (getAiRoundNumber() <= 2 ? 5.5 : getAiRoundNumber() === 3 ? 2.4 : 0.8)
          * incomeUseScale
        : 0;
      const handIncomeOversupplyPenalty = Math.max(
        0,
        rawHandIncomeOversupplyPenalty - handIncomeEngineBacklogValue * 0.72,
      );
      const creditSurplusPenalty = aiNumber(gain.credits) > 0
        ? Math.max(
          Math.max(0, aiNumber(resources.credits) - Math.max(aiNumber(resources.energy), aiNumber(resources.handSize)) - 3)
            * (getAiRoundNumber() <= 2 ? 0.8 : 0.35),
          Math.max(0, aiNumber(income.credits) - Math.max(aiNumber(income.energy), aiNumber(income.handSize)) - 1)
            * (getAiRoundNumber() <= 2 ? 1.05 : 0.45),
        )
        : 0;
      const earlyIncomeTargetBonus = getAiRoundNumber() <= 1
        ? Math.min(4, scoreAiResourceBundle(gain) * 0.45 + earlyPressure * 1.2) * incomeUseScale
        : getAiRoundNumber() === 2
          ? Math.min(2.5, scoreAiResourceBundle(gain) * 0.28 + earlyPressure * 0.6) * incomeUseScale
          : 0;
      const banrenmaEnergyPlanValue = scoreAiBanrenmaEnergyIncomeValue(player, gain) * incomeUseScale;
      const markedFinalValue = scoreAiMarkedIncomeFinalValue(player, gain);
      return Math.max(
        0,
        netValue
          + creditNeed
          + energyNeed
          + handNeed
          + energyIncomeBalance
          + handIncomeBalance
          + handIncomeEngineBacklogValue
          + earlyIncomeTargetBonus
          + banrenmaEnergyPlanValue
          + markedFinalValue
          + strategicIncomeFit
          - creditSurplusPenalty
          - handIncomeOversupplyPenalty,
      );
    }

    function scoreAiPlacementBonusValue(bonus, player = getCurrentPlayer()) {
      if (!bonus) return 0;
      switch (bonus.type) {
        case "income":
          return scoreAiIncomeOpportunityValue(player, bonus.gain || bonus.income || { credits: 1 });
        case "publicity":
          return scoreAiResourceBundle({ publicity: bonus.publicity || 1 })
            + scoreAiMidgameResourceContinuationValue({ publicity: bonus.publicity || 1 }, player, { scale: 0.55 });
        case "score":
          return scoreAiResourceBundle({ score: bonus.score || 1 })
            + scoreAiThresholdPressureForScoreGain(bonus.score || 1, player);
        case "credits":
          return scoreAiResourceBundle({ credits: bonus.credits || 1 })
            + scoreAiMidgameResourceContinuationValue({ credits: bonus.credits || 1 }, player, { scale: 0.75 });
        case "energy":
          return scoreAiResourceBundle({ energy: bonus.energy || 1 })
            + scoreAiMidgameResourceContinuationValue({ energy: bonus.energy || 1 }, player, { scale: 0.85 });
        case "choose_card":
          return getAiResourceValuesForRound().handSize + 1.4
            + Math.max(0, 3 - (player?.hand || []).length) * 0.45
            + scoreAiMidgameResourceContinuationValue({ handSize: 1, cardSelection: 1 }, player, { scale: 0.45 });
        default:
          return 0;
      }
    }

    function getAiDataPlacementBonuses(choice, player = getCurrentPlayer()) {
      if (!choice) return [];
      const target = choice.target || null;
      if (target === data.PLACEMENT_KIND_COMPUTER) {
        const placementSlot = Math.max(0, Math.round(aiNumber(choice.placementSlot)));
        return [
          data.getComputerSlotBonus?.(placementSlot),
          data.getComputerSlotBlueColumnBonus?.(player, placementSlot),
        ].filter(Boolean);
      }
      if (target === data.PLACEMENT_KIND_BLUE_BONUS) {
        return [data.getBlueBonusPlacementReward?.(player, choice.blueSlot)].filter(Boolean);
      }
      return [];
    }

    function scoreAiDataPlacementBonusValue(choice, player = getCurrentPlayer()) {
      return getAiDataPlacementBonuses(choice, player)
        .reduce((total, bonus) => total + scoreAiPlacementBonusValue(bonus, player), 0);
    }

    function scoreAiFinalThresholdIncomePlacementPenalty(choice, player = getCurrentPlayer()) {
      if (!player) return 0;
      const bonuses = getAiDataPlacementBonuses(choice, player);
      if (!bonuses.some((bonus) => bonus?.type === "income")) return 0;
      const resources = player.resources || {};
      const handSize = Math.max(0, Math.round(aiNumber(resources.handSize)));
      if (handSize <= 0) return 8;
      if (getAiRoundNumber() < FINAL_ROUND_NUMBER || handSize > 1) return 0;
      const currentScore = Math.max(0, aiNumber(resources.score));
      const nextThreshold = getAiNextMissingFinalScoreThreshold(player);
      if (!nextThreshold || currentScore >= nextThreshold || nextThreshold > 70) return 0;
      const scoreToThreshold = Math.max(1, nextThreshold - currentScore);
      if (scoreToThreshold > 3) return 0;
      const credits = Math.max(0, aiNumber(resources.credits));
      const creditToPlayRemainingHand = credits >= 1 ? 4 : 0;
      return Math.min(
        36,
        (nextThreshold <= 50 ? 22 : 17)
          + Math.max(0, 4 - scoreToThreshold) * (nextThreshold <= 50 ? 2.8 : 1.8)
          + creditToPlayRemainingHand,
      );
    }

    function getAiDataPlacementDirectScoreGainFromBonus(bonus) {
      if (!bonus || bonus.type !== "score") return 0;
      return Math.max(0, aiNumber(bonus.score || 1));
    }

    function getAiDataPlacementDirectScoreGain(choice, player = getCurrentPlayer()) {
      if (!choice) return 0;
      return getAiDataPlacementBonuses(choice, player)
        .reduce((total, bonus) => total + getAiDataPlacementDirectScoreGainFromBonus(bonus), 0);
    }

    function scoreAiDataEngineProgressValue(placementSlot, player = getCurrentPlayer()) {
      const slot = Math.max(0, Math.round(aiNumber(placementSlot)));
      if (!slot) return 0;
      const pressure = getAiEarlyEnginePressure(player);
      const round = getAiRoundNumber();
      const requiredSlot = data.ANALYZE_REQUIRED_COMPUTER_SLOT || 6;
      const currentScore = Math.max(0, aiNumber(player?.resources?.score));
      const catchupEngine = currentScore < 50
        || countAiFinalMarksForPlayer(player) < 2
        || getAiLiveScorePaceDeficit(player) > 18;
      if (slot < 4) {
        return pressure * Math.max(0.4, 1.25 - slot * 0.2);
      }
      if (slot === 4) {
        return pressure * 0.75;
      }
      if (slot <= requiredSlot) {
        const resources = player?.resources || {};
        const demand = getAiStrategyDemand(player);
        const canPayAnalyze = aiNumber(resources.energy) >= getAiAnalyzeEnergyCost(player);
        const rawCloseAnalyzeBonus = Math.min(
          5.5,
          (slot === requiredSlot ? 2.8 : 1.4)
            + (round <= 3 ? 1.1 : 0.35)
            + (canPayAnalyze ? 1.1 : 0)
            + getAiMapDemand(demand.actions, "analyze") * 0.045
            + getAiMapDemand(demand.traceTypes, "blue") * 0.04,
        );
        const closeAnalyzeBonus = catchupEngine ? rawCloseAnalyzeBonus : 0;
        return pressure * 0.8 + closeAnalyzeBonus;
      }
      return 0;
    }

    function scoreAiEarlyScanEngineValue(player = getCurrentPlayer()) {
      const round = getAiRoundNumber();
      const pressure = getAiEarlyEnginePressure(player);
      if (round > 3 && pressure < 0.5) return 0;
      const placedComputerCount = Math.max(0, (data.listComputerPlacedTokens?.(player) || []).length);
      const dataRoom = getAiAvailableDataRoom(player);
      let value = pressure * 2.8;
      if (placedComputerCount < 4) value += Math.max(0, 4 - placedComputerCount) * 0.45 * pressure;
      if (dataRoom > 0) value += Math.min(1.4, dataRoom * 0.24) * Math.max(0.6, pressure);
      if (countAiFinalMarksForPlayer(player) === 0) value += pressure * 0.65;
      if (placedComputerCount >= 4) value *= round <= 2 ? 0.4 : 0.24;
      return value;
    }

    function countAiTraceMarkersForPlayer(player = getCurrentPlayer()) {
      if (!endGameScoring?.countTraceMarkers || !player) return 0;
      return AI_TRACE_TYPES.reduce((total, traceType) => (
        total + Math.max(0, Math.round(aiNumber(endGameScoring.countTraceMarkers(player, alienGameState, traceType))))
      ), 0);
    }

    function isAiFirstTraceTakenByOpponent(alienSlotId, traceType, player = getCurrentPlayer()) {
      if (!traceType || alienSlotId == null) return false;
      const slot = aliens?.getAlienSlot?.(alienGameState, alienSlotId);
      const traceSlot = slot?.traces?.[traceType];
      return Boolean(
        slot
        && traceSlot?.firstPlaced
        && !aiMarkerBelongsToPlayer(traceSlot, player)
      );
    }

    function isAiHiddenFirstTraceTakenByOpponent(alienSlotId, traceType, player = getCurrentPlayer()) {
      const slot = aliens?.getAlienSlot?.(alienGameState, alienSlotId);
      return Boolean(slot && !slot.revealed && isAiFirstTraceTakenByOpponent(alienSlotId, traceType, player));
    }

    function isAiOpenHiddenFirstTraceTarget(alienSlotId, traceType) {
      if (!traceType || alienSlotId == null) return false;
      const slot = aliens?.getAlienSlot?.(alienGameState, alienSlotId);
      const traceSlot = slot?.traces?.[traceType];
      return Boolean(slot && !slot.revealed && traceSlot && !traceSlot.firstPlaced);
    }

    function getAiHiddenFirstTraceColorStatus(traceType, player = getCurrentPlayer()) {
      const status = { open: 0, own: 0, opponent: 0 };
      if (!traceType) return status;
      for (const slot of Object.values(alienGameState?.aliens || {})) {
        const traceSlot = slot?.traces?.[traceType];
        if (!slot || slot.revealed || !traceSlot) continue;
        if (!traceSlot.firstPlaced) {
          status.open += 1;
        } else if (aiMarkerBelongsToPlayer(traceSlot, player)) {
          status.own += 1;
        } else {
          status.opponent += 1;
        }
      }
      return status;
    }

    function isAiHiddenFirstTraceColorLost(traceType, player = getCurrentPlayer()) {
      const status = getAiHiddenFirstTraceColorStatus(traceType, player);
      return status.opponent > 0 && status.own <= 0;
    }

    function getAiAlienSlot(alienSlotId) {
      if (alienSlotId == null) return null;
      return aliens?.getAlienSlot?.(alienGameState, alienSlotId)
        || alienGameState?.aliens?.[String(alienSlotId)]
        || alienGameState?.aliens?.[Number(alienSlotId)]
        || null;
    }

    function getAiAlienCardConversionMultiplier(player = getCurrentPlayer()) {
      const round = getAiRoundNumber();
      const handCount = Math.max(
        0,
        aiNumber(player?.hand?.length ?? player?.resources?.handSize),
      );
      let multiplier = round <= 2 ? 1.18 : round === 3 ? 0.82 : 0.36;
      if (round >= FINAL_ROUND_NUMBER && handCount > 4) {
        multiplier -= Math.min(0.1, (handCount - 4) * 0.025);
      }
      return Math.max(0.26, Math.min(1.25, multiplier));
    }

    function getAiAlienCardExpectedValue(player = getCurrentPlayer(), options = {}) {
      const baseValue = 5.5 * getAiAlienCardConversionMultiplier(player);
      if (options.hiddenFirstTrace && getAiRoundNumber() <= 2) return baseValue + 1.2;
      if (options.hiddenFirstTrace && getAiRoundNumber() === 3) return baseValue + 0.4;
      return baseValue;
    }

    function scoreAiLateAlienCardConversionPenalty(player = getCurrentPlayer()) {
      const multiplier = getAiAlienCardConversionMultiplier(player);
      return Math.max(0, (1 - multiplier) * 12);
    }

    function scoreAiHiddenAlienRevealTimingPremium(alienSlotId, placedCount, player = getCurrentPlayer()) {
      const slot = getAiAlienSlot(alienSlotId);
      if (!slot || slot.revealed) return 0;
      const slotId = Math.round(aiNumber(alienSlotId));
      const round = getAiRoundNumber();
      const placed = Math.max(0, Math.min(3, Math.round(aiNumber(placedCount))));
      let value = 0;

      if (slotId === 2) {
        if (round <= 2) value += 3 + placed * 2.2 + (placed >= 2 ? 3.5 : 0);
        else if (round === 3) value += 1.5 + placed * 1.6 + (placed >= 2 ? 4.5 : 0);
        else value += placed >= 2 ? 2 : -2.5;

        const firstAlienRevealed = Boolean(getAiAlienSlot(1)?.revealed);
        if (firstAlienRevealed && round <= 3) value += 2.2;
      }

      if (placed >= 2 && round <= 3) value += 1.6;
      if (round >= FINAL_ROUND_NUMBER && placed <= 1) value -= 2;
      return roundAiScore(value);
    }

    function scoreAiAlienTraceValue(options = {}) {
      const picker = state.alienTracePickerState || {};
      const traceType = options.traceType || picker.selectedTraceType || picker.allowedTraceTypes?.[0];
      const alienSlotId = options.alienSlotId ?? picker.selectedAlienSlotId;
      const player = options.player || getCurrentPlayer();
      const value = ai?.valuation?.estimateAlienTraceValue
        ? ai.valuation.estimateAlienTraceValue({
          alienGameState,
          player,
          traceType,
          alienSlotId,
          mode: options.mode || picker.mode,
          position: options.position,
          label: options.label,
          reward: options.reward,
          alienCardExpectedValue: getAiAlienCardExpectedValue(player, {
            hiddenFirstTrace: true,
            alienSlotId,
          }),
          activeOpponentCount: getAiActiveOpponentCount(player),
          competition: true,
        })
        : 5;
      const slot = getAiAlienSlot(alienSlotId);
      const traceSlot = traceType && slot?.traces ? slot.traces[traceType] : null;
      if (slot && !slot.revealed && traceType && !traceSlot?.firstPlaced) {
        if (isAiHiddenFirstTraceColorLost(traceType, player)) {
          return value;
        }
        const placedCount = AI_TRACE_TYPES.reduce((total, type) => (
          total + (slot.traces?.[type]?.firstPlaced ? 1 : 0)
        ), 0);
        const round = getAiRoundNumber();
        let earlyTracePremium = round <= 2 ? 6 : round === 3 ? 3 : 0;
        if (placedCount >= 2) earlyTracePremium += 5;
        else if (placedCount === 1) earlyTracePremium += 2.5;
        earlyTracePremium += scoreAiHiddenAlienRevealTimingPremium(alienSlotId, placedCount, player);
        return value + earlyTracePremium;
      }
      if (isAiHiddenFirstTraceTakenByOpponent(alienSlotId, traceType, player)) {
        return -4;
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
      const explicitBaseIncome = player?.companyBaseIncome
        || player?.baseIncome
        || player?.industryBaseIncome
        || player?.industryEffect?.baseIncome
        || player?.initialSelection?.industryBaseIncome
        || player?.initialSelection?.industryEffect?.baseIncome
        || player?.initialSelection?.industry?.baseIncome
        || null;
      if (explicitBaseIncome && typeof explicitBaseIncome === "object") {
        return players.normalizeIncome(explicitBaseIncome);
      }
      const industryEffect = initialCards?.getIndustryEffect?.(player?.initialSelection?.industry);
      return players.normalizeIncome(industryEffect?.baseIncome || null);
    }

    function scoreAiCountedResourceGain(gain = {}, player = getCurrentPlayer()) {
      const fossilGain = Math.max(0, Math.round(aiNumber(gain?.aomomoFossils)));
      return scoreAiResourceBundle(gain)
        + scoreAiMidgameResourceContinuationValue(gain, player)
        + scoreAiThresholdPressureForScoreGain(gain.score, player)
        + scoreAiAomomoFossilPlanBonus(fossilGain, player);
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

    function isAiIncomeRewardEffect(effect) {
      return effect?.type === planetRewards.EFFECT_TYPES?.INCOME || effect?.type === "income";
    }

    function scoreAiIncomeRewardOpportunityValue(player = getCurrentPlayer(), effectOptions = {}, usedCardIndexes = null) {
      if (!player) return 0;
      const fixedGain = effectOptions?.gain || effectOptions?.income || null;
      if (fixedGain && typeof fixedGain === "object") {
        return scoreAiIncomeOpportunityValue(player, fixedGain);
      }

      const candidates = (player.hand || [])
        .map((card, index) => {
          if (usedCardIndexes?.has(index)) return null;
          const gain = cards.getIncomeGainForCard?.(card) || null;
          if (!gain) return null;
          const incomeScore = scoreAiIncomeOpportunityValue(player, gain);
          const finalFormulaFit = scoreAiIncomeDiscardFinalFormulaFit(player, gain);
          const routeEnergyFit = scoreAiIncomeDiscardRouteEnergyFit(player, gain);
          const playValue = ai?.valuation?.getCardValue
            ? Math.max(0, aiNumber(ai.valuation.getCardValue(card)))
            : AI_RESOURCE_VALUES.handSize;
          return {
            index,
            gain,
            score: incomeScore + finalFormulaFit + routeEnergyFit - Math.min(8, playValue * 0.12),
          };
        })
        .filter(Boolean)
        .sort((left, right) => aiNumber(right.score) - aiNumber(left.score));
      const selected = candidates[0] || null;
      if (!selected) return 0;
      if (usedCardIndexes) usedCardIndexes.add(selected.index);
      return Math.max(0, aiNumber(selected.score));
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
        case "gain_data": {
          const count = Math.max(0, Math.round(aiNumber(effectOptions.count || 1)));
          return count * AI_RESOURCE_VALUES.availableData
            + scoreAiMidgameResourceContinuationValue({ availableData: count }, player, { scale: 0.75 });
        }
        case planetRewards.EFFECT_TYPES?.INCOME:
        case "income":
          return scoreAiIncomeRewardOpportunityValue(player, effectOptions);
        case banrenma?.EFFECT_GAIN_INCOME:
          return scoreAiIncomeRewardOpportunityValue(player, effectOptions);
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
        case "yichangdian_next_anomaly_reward":
          return scoreAiYichangdianNextAnomalyRewardValue(player);
        case "yichangdian_next_anomaly_scan":
          return scoreAiYichangdianNextAnomalyScanValue(player);
        case "yichangdian_anomaly_signal_score": {
          const signalScore = countAiYichangdianAnomalySignals();
          return signalScore
            + scoreAiPaceValueForDirectScore(signalScore, player, { baseWeight: 0.4, pressureWeight: 0.18 });
        }
        case "yichangdian_alien_trace": {
          const bestTraceScore = Math.max(...AI_TRACE_TYPES.map((item) => getAiBestRevealedAlienTraceDirectScore(player, item)));
          return Math.max(8, bestTraceScore * 0.45 + sumAiDemandMap(getAiStrategyDemand(player).traceTypes) * 0.05);
        }
        case "yichangdian_public_all":
          return Math.max(8, (cards.PUBLIC_CARD_COUNT || 3) * AI_RESOURCE_VALUES.handSize * 0.95);
        case "yichangdian_draw_then_two_corners":
          return 3 * AI_RESOURCE_VALUES.handSize + Math.max(4, scoreAiCardCornerOpportunity((player?.hand || [])[0]) * 0.4);
        case "yichangdian_launch_anomaly_move": {
          const earth = getEarthSectorCoordinate?.();
          const currentAnomaly = earth ? yichangdian?.getAnomalyBySectorX?.(alienGameState, earth.x) : null;
          return currentAnomaly ? 2.6 : 0.6;
        }
        case cardEffects.EFFECT_TYPES.REGISTER_EVENT_BONUS:
          return 2.5;
        case cardEffects.EFFECT_TYPES.PLUTO_RESERVE:
          return 8;
        case cardEffects.EFFECT_TYPES.RETURN_PLAYED_CARD_TO_HAND_IF:
          return 1.5;
        case amiba?.EFFECT_TYPES?.CHOOSE_SYMBOL_REWARD:
          return scoreAiAmibaSingleSymbolChoiceValue(effectOptions.region, player);
        case amiba?.EFFECT_TYPES?.REMOVE_TRACE_FOR_REGION_REWARD:
          return scoreAiAmibaTraceRemovalValue(player);
        case runezu?.EFFECT_TYPES?.SYMBOL_REWARD:
          return scoreAiRunezuSymbolRewardValue(effectOptions.symbolId, player);
        case runezu?.EFFECT_TYPES?.SYMBOL_BRANCH:
          return scoreAiRunezuSymbolBranchValue(effectOptions.branches || [], player);
        case chong?.EFFECT_TYPES?.CHONG_LAND_FOR_PICKUP:
        case chong?.EFFECT_TYPES?.CHONG_ORBIT_OR_LAND_FOR_PICKUP:
          return Math.max(
            5,
            scoreAiChongTravelEffectImmediateValue(effect, player),
            6 + scoreAiAverageChongFossilRewardValue(player) * 0.25,
          );
        case chong?.EFFECT_TYPES?.CHONG_PICKUP_FOSSIL:
        case chong?.EFFECT_TYPES?.CHONG_PROBE_PLANET_FOSSIL_REWARD:
        case chong?.EFFECT_TYPES?.CHONG_CHOOSE_PLANET_FOSSIL_REWARD:
          return 5.5 + scoreAiBestChongFossilRewardValue(player) * 0.45;
        case chong?.EFFECT_TYPES?.CHONG_TASK_CLEANUP:
          return 1.5;
        case AI_FANGZHOU_CARD2_REWARD_EFFECT_TYPE:
          return scoreAiFangzhouCard2AdvancedRewardValue(player);
        case aomomo?.EFFECT_GAIN_FOSSILS:
          return scoreAiCountedResourceGain({
            aomomoFossils: Math.max(1, Math.round(aiNumber(effectOptions.count || 1))),
          }, player);
        case aomomo?.EFFECT_SCAN_AOMOMO_X:
        case aomomo?.EFFECT_SCAN_AOMOMO_X_GAIN_FOSSIL:
        case aomomo?.EFFECT_SCAN_AOMOMO_X_SCORE:
          return 5
            + Math.max(0, aiNumber(effectOptions.score || 0))
            + (type === aomomo?.EFFECT_SCAN_AOMOMO_X_GAIN_FOSSIL ? scoreAiCountedResourceGain({ aomomoFossils: 1 }, player) * 0.45 : 0);
        case aomomo?.EFFECT_LAND_SCORE_IF_AOMOMO:
        case "aomomo_land_only":
          return 8 + Math.max(0, aiNumber(effectOptions.score || 0));
        case aomomo?.EFFECT_FOSSIL_FOR_DATA: {
          const fossilCost = Math.max(1, Math.round(aiNumber(effectOptions.cost) || 1));
          const dataCount = Math.max(1, Math.round(aiNumber(effectOptions.dataCount) || 1));
          return dataCount * AI_RESOURCE_VALUES.availableData
            + scoreAiMidgameResourceContinuationValue({ availableData: dataCount }, player, { scale: 0.45 })
            - fossilCost * getAiAomomoFossilUnitValue(player)
            - scoreAiAomomoFossilSpendPlanPenalty(fossilCost, player);
        }
        case aomomo?.EFFECT_FOSSIL_FOR_MOVE_AND_LAND:
          return 7
            - getAiAomomoFossilUnitValue(player) * 0.65
            - scoreAiAomomoFossilSpendPlanPenalty(effectOptions.cost || 1, player) * 0.55;
        case aomomo?.EFFECT_FOSSIL_FOR_ANY_SCAN:
          return 4.5
            + scoreAiScanPriorityFloor(player) * 0.28
            - getAiAomomoFossilUnitValue(player) * 0.6
            - scoreAiAomomoFossilSpendPlanPenalty(effectOptions.cost || 1, player) * 0.45;
        case aomomo?.EFFECT_SPEND_FOSSILS_GAIN_SCORE: {
          const directScore = Math.max(0, aiNumber(effectOptions.score || 0));
          const fossilCost = Math.max(1, Math.round(aiNumber(effectOptions.cost) || 1));
          const threshold = getAiNextMissingFinalScoreThreshold(player);
          const currentScore = Math.max(0, aiNumber(player?.resources?.score));
          const crossesThreshold = Boolean(threshold && currentScore < threshold && currentScore + directScore >= threshold);
          return directScore
            + scoreAiPaceValueForDirectScore(directScore, player)
            - fossilCost * getAiAomomoFossilUnitValue(player)
            - scoreAiAomomoFossilSpendPlanPenalty(fossilCost, player, { directScore, crossesThreshold });
        }
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

    function listAiUncompletedCardTasksForPlayer(player = getCurrentPlayer()) {
      if (!player) return [];
      const entries = [];
      for (const card of player.reservedCards || []) {
        const model = cardEffects.getCardModel?.(card) || null;
        if (!model?.tasks?.length) continue;
        const completedTaskIds = new Set(card?.cardEffectState?.completedTaskIds || []);
        for (const task of model.tasks || []) {
          if (!task?.id || completedTaskIds.has(task.id)) continue;
          entries.push({ card, task, model });
        }
      }
      return entries;
    }

    function scoreAiTaskRouteCompletionValue(task, player = getCurrentPlayer()) {
      if (!task || !player) return 0;
      const rewardValue = Math.max(0, getAiTaskRewardValue(task, player));
      const directScore = Math.max(0, getAiTaskDirectScoreReward(task, player));
      const cFinalProgress = Math.max(0, scoreAiCFinalTaskProgressValue(player, 1));
      const completedTaskCount = Math.max(0, Math.round(aiNumber(player.completedTaskCount)));
      const round = getAiRoundNumber();
      const lowTaskPressure = completedTaskCount <= 0
        ? round <= 2 ? 3.5 : round === 3 ? 5.5 : 4.5
        : completedTaskCount === 1
          ? 2
          : 0.75;
      return roundAiScore(Math.min(
        24,
        rewardValue * 1.05
          + directScore * 0.45
          + scoreAiThresholdPressureForScoreGain(directScore, player) * 0.45
          + cFinalProgress * 1.15
          + lowTaskPressure,
      ));
    }

    function getAiPendingTaskRouteCashout(player, predicate) {
      if (!player || typeof predicate !== "function") return { value: 0, directScore: 0, count: 0 };
      return listAiUncompletedCardTasksForPlayer(player)
        .filter(({ task }) => predicate(task?.condition || {}, task))
        .reduce((result, { task }) => {
          const value = scoreAiTaskRouteCompletionValue(task, player);
          if (value <= 0) return result;
          return {
            value: result.value + value,
            directScore: result.directScore + Math.max(0, getAiTaskDirectScoreReward(task, player)),
            count: result.count + 1,
          };
        }, { value: 0, directScore: 0, count: 0 });
    }

    function getAiPendingPlanetTaskRouteCashout(planetId, player = getCurrentPlayer()) {
      if (!planetId || planetId === "earth") return { value: 0, directScore: 0, count: 0 };
      return getAiPendingTaskRouteCashout(player, (condition) => {
        if (condition.type === "planetOrbitOrLand") return condition.planetId === planetId;
        if (condition.type === "planetOrbitOrLandAll") {
          return (condition.planetIds || []).includes(planetId)
            && endGameScoring.countPlanetOrbitOrLand(player, planetStatsState, planetId) <= 0;
        }
        return false;
      });
    }

    function getAiPendingLocationTaskRouteCashout(locationType, player = getCurrentPlayer()) {
      if (!locationType) return { value: 0, directScore: 0, count: 0 };
      return getAiPendingTaskRouteCashout(player, (condition) => {
        if (condition.type === "probeLocation") return condition.locationType === locationType;
        if (condition.type === "probeAdjacentEarth") return locationType === "earthAdjacent";
        if (condition.type === "probeAdjacentEarthAsteroid") return locationType === "earthAdjacentAsteroid";
        return false;
      });
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
          demand.task += amount * 1.7;
          addAiActionDemand(demand, "playCard", amount * 0.65);
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
        alienGameState,
        nebulaDataState,
        planetStatsState,
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
      if (model.tasks?.length) value += Math.min(7, demand.task * 0.12 * getAiStrategyWeight("task"));
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
      const runezuFinalRule = runezu?.getFinalCardRule?.(card);
      const rule = model?.endGameScoring || (runezuFinalRule
        ? { kind: runezuFinalRule.type, multiplier: Number(runezuFinalRule.multiplier) || 1 }
        : null);
      if (!card || !rule || !player || !endGameScoring?.scoreCardEndGameRule) return 0;
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
        rule,
        simulatedPlayer,
        context,
      )));
    }

    function isAiResearchTechEffectType(type) {
      return type === "research_tech_select" || type === cardEffects.EFFECT_TYPES.RESEARCH_TECH;
    }

    function countAiHandEngineCards(player = getCurrentPlayer()) {
      return (player?.hand || []).reduce((total, card) => {
        const model = cardEffects.getCardModel?.(card) || null;
        const typeCode = getCardTypeCode(card);
        const playEffects = getAiPlayEffectsForCard(card);
        const hasEngineEffect = (playEffects || []).some((effect) => (
          isAiResearchTechEffectType(effect?.type)
          || isAiCardScanEffectType(effect?.type)
          || effect?.type === "draw_cards"
        ));
        const isEngineCard = Boolean(
          model?.tasks?.length
          || model?.endGameScoring
          || typeCode === 3
          || hasEngineEffect,
        );
        return total + (isEngineCard ? 1 : 0);
      }, 0);
    }

    function countAiHandTaskCards(player = getCurrentPlayer()) {
      return (player?.hand || []).reduce((total, card) => {
        const model = cardEffects.getCardModel?.(card) || null;
        return total + (model?.tasks?.length ? 1 : 0);
      }, 0);
    }

    function scoreAiLateCardEnginePressure(player = getCurrentPlayer()) {
      if (!player || getAiRoundNumber() < 3) return 0;
      const round = getAiRoundNumber();
      const completedTasks = Math.max(0, Math.round(aiNumber(player.completedTaskCount)));
      const finalMarks = countAiFinalMarksForPlayer(player);
      const techCount = countAiPlayerTech(player);
      const currentScore = Math.max(0, aiNumber(player.resources?.score));
      const cEntries = getAiPlanningFinalFormulaEntries(player, ["c1", "c2"]);
      const dEntries = getAiPlanningFinalFormulaEntries(player, ["d1", "d2"]);
      const uncompletedTaskCount = listAiUncompletedCardTasksForPlayer(player).length;
      const handEngineCards = countAiHandEngineCards(player);
      const handTaskCards = countAiHandTaskCards(player);
      const hasTaskPipeline = cEntries.length > 0 || uncompletedTaskCount > 0 || handTaskCards > 0;
      let pressure = 0;

      if (hasTaskPipeline) {
        if (completedTasks <= 0) pressure += round === 3 ? 4.5 : 7;
        else if (completedTasks === 1) pressure += round === 3 ? 2.5 : 4.5;
        else pressure += 1;
      }

      if (cEntries.length && completedTasks <= 1) pressure += finalMarks >= 2 ? 3 : 1.8;
      if (dEntries.length && techCount < 8) {
        pressure += Math.min(5.5, Math.max(0, 8 - techCount) * 1.05 + (round >= FINAL_ROUND_NUMBER ? 1.2 : 0));
      }
      if (finalMarks >= 3 && ((hasTaskPipeline && completedTasks <= 1) || techCount < 8)) pressure += 2.2;
      else if (finalMarks >= 2 && hasTaskPipeline && completedTasks <= 1) pressure += 1.2;
      if (round >= FINAL_ROUND_NUMBER && currentScore < 120 && hasTaskPipeline && completedTasks <= 1) pressure += 2.2;

      if (handEngineCards <= 0 && uncompletedTaskCount <= 0 && (!dEntries.length || techCount >= 8)) {
        pressure *= 0.45;
      }
      return roundAiScore(Math.min(18, Math.max(0, pressure)));
    }

    function scoreAiLatePlayCardEnginePressure(card, details = {}) {
      const player = details.player || getCurrentPlayer();
      if (!card || !player) return 0;
      const basePressure = scoreAiLateCardEnginePressure(player);
      if (basePressure <= 0) return 0;
      const model = details.model || cardEffects.getCardModel?.(card) || null;
      const playEffects = details.playEffects || getAiPlayEffectsForCard(card);
      const typeCode = details.typeCode ?? getCardTypeCode(card);
      const endGameExpectedScore = details.endGameExpectedScore
        ?? scoreAiCardEndGameExpectedValue(card, model, player);
      const c2Type3ProgressValue = typeCode === 3 ? scoreAiC2Type3ProgressValue(player) : 0;
      const completedTasks = Math.max(0, Math.round(aiNumber(player.completedTaskCount)));
      const hasC2 = getAiPlanningFinalFormulaEntries(player, ["c2"]).length > 0;
      const hasResearchEffect = (playEffects || []).some((effect) => isAiResearchTechEffectType(effect?.type));
      const hasScanEffect = (playEffects || []).some((effect) => isAiCardScanEffectType(effect?.type));
      const hasDrawEffect = (playEffects || []).some((effect) => effect?.type === "draw_cards");
      let fit = 0;

      if (model?.tasks?.length) {
        fit += 0.62 + model.tasks.length * 0.18 + (completedTasks <= 0 ? 0.18 : 0);
      }
      if (typeCode === 3 && (hasC2 || model?.endGameScoring || endGameExpectedScore > 0)) {
        fit += 0.42 + Math.min(0.28, c2Type3ProgressValue * 0.08);
      }
      if (model?.endGameScoring) {
        fit += 0.42 + Math.min(0.3, endGameExpectedScore * 0.035);
      }
      if (hasResearchEffect) {
        fit += getAiPlanningFinalFormulaEntries(player, ["d1", "d2"]).length ? 0.34 : 0.16;
      }
      if (hasScanEffect) fit += getAiPlanningFinalFormulaEntries(player, ["b2"]).length ? 0.26 : 0.14;
      if (hasDrawEffect) fit += 0.12;
      if (details.plan?.actionId === "task" || details.plan?.actionId === "final") fit += 0.12;
      if (fit <= 0) return 0;
      return roundAiScore(Math.min(22, basePressure * fit));
    }

    function scoreAiPlayCardConversionPressure(card, details = {}) {
      const player = details.player || getCurrentPlayer();
      if (!card || !player || getAiRoundNumber() < 3) return 0;
      const model = details.model || cardEffects.getCardModel?.(card) || null;
      const playEffects = details.playEffects || getAiPlayEffectsForCard(card);
      const typeCode = details.typeCode ?? getCardTypeCode(card);
      const handSize = Math.max(0, (player.hand || []).length);
      const finalMarks = countAiFinalMarksForPlayer(player);
      const currentScore = Math.max(0, aiNumber(player.resources?.score));
      const nextThreshold = getAiNextMissingFinalScoreThreshold(player);
      const endGameExpectedScore = details.endGameExpectedScore
        ?? scoreAiCardEndGameExpectedValue(card, model, player);
      const c2Type3ProgressValue = typeCode === 3 ? scoreAiC2Type3ProgressValue(player) : 0;
      const cFinalTaskProgressValue = model?.tasks?.length
        ? scoreAiCFinalTaskProgressValue(player, model.tasks.length)
        : 0;
      const standardActionPremium = details.standardActionPremium
        ?? scoreAiCardStandardActionPremium(playEffects, player);
      const routePlanScore = Math.max(0, aiNumber(details.plan?.score));
      const concreteRoutePlanScore = details.plan?.actionId === "task" ? 0 : routePlanScore;
      const handPressure = Math.max(0, handSize - 3) * (getAiRoundNumber() >= FINAL_ROUND_NUMBER ? 2.8 : 1.4);
      const lateCardEnginePressure = details.lateCardEnginePressure
        ?? scoreAiLatePlayCardEnginePressure(card, {
          player,
          model,
          playEffects,
          typeCode,
          endGameExpectedScore,
          plan: details.plan,
        });

      let value = handPressure;
      const looseFinalTaskOnly = getAiRoundNumber() >= FINAL_ROUND_NUMBER
        && finalMarks >= 3
        && !nextThreshold
        && model?.tasks?.length
        && cFinalTaskProgressValue <= 0
        && concreteRoutePlanScore <= 0
        && !model?.endGameScoring
        && typeCode !== 3;
      if (model?.tasks?.length && !looseFinalTaskOnly) {
        value += 5 + Math.min(10, cFinalTaskProgressValue * 0.8);
      }
      if (typeCode === 3) value += 4 + Math.min(10, c2Type3ProgressValue * 0.65);
      if (model?.endGameScoring) value += 4 + Math.min(12, endGameExpectedScore * 0.75);
      if (standardActionPremium > 0) value += Math.min(10, standardActionPremium * 0.55);
      if (concreteRoutePlanScore > 0) value += Math.min(8, concreteRoutePlanScore * 0.35);
      if (isAiAlienMainPlayCard(card)) value += 5;
      if (getAiRoundNumber() >= FINAL_ROUND_NUMBER && nextThreshold && currentScore < nextThreshold) {
        value += Math.max(0, 3 - finalMarks) * 3.2
          + Math.min(9, Math.max(0, nextThreshold - currentScore) * 0.18);
      }
      if (!looseFinalTaskOnly) value += lateCardEnginePressure;
      return roundAiScore(Math.min(getAiRoundNumber() >= FINAL_ROUND_NUMBER ? 38 : 24, Math.max(0, value)));
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
        } else if (isAiChongTravelEffect(effect)) {
          const chongTravelValue = scoreAiChongTravelEffectImmediateValue(effect, player);
          const task = chong.getCardTask?.(card);
          const routeValue = task?.kind === "transport"
            ? scoreAiChongPickupTaskValue(task, player, null, {
              card,
              includePlayCost: false,
            })
            : 0;
          addPlan(
            "land",
            "打牌执行虫族化石路线",
            Math.max(chongTravelValue, routeValue * 0.72)
              + getAiMapDemand(demand.actions, "land") * 0.18
              + routeDemand * 0.05,
            { effectType: type, chongTask: Boolean(task) },
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
          demand.task * 0.25 + engineDemand * 0.06 + model.tasks.length * 0.6,
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
        if (isAiChongTravelEffect(effect)) {
          return total + Math.max(3.5, scoreAiChongTravelEffectImmediateValue(effect, player) * 0.28);
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

    function scoreAiUnplayedTaskCardPreserveValue(card, model = null, playCandidate = null, player = getCurrentPlayer()) {
      const cardModel = model || cardEffects.getCardModel?.(card) || null;
      const tasks = cardModel?.tasks || [];
      if (!card || !player || !tasks.length) return 0;
      const round = getAiRoundNumber();
      const completedTaskCount = Math.max(0, Math.round(aiNumber(player.completedTaskCount)));
      const handSize = Math.max(0, (player.hand || []).length);
      const routeValue = tasks.reduce((total, task) => (
        total + Math.max(0, scoreAiTaskRouteCompletionValue(task, player))
      ), 0);
      const directScore = tasks.reduce((total, task) => (
        total + Math.max(0, getAiTaskDirectScoreReward(task, player))
      ), 0);
      const cFinalProgress = Math.max(0, scoreAiCFinalTaskProgressValue(player, tasks.length));
      const playableScore = Math.max(0, aiNumber(playCandidate?.score));
      const lowTaskPressure = completedTaskCount <= 0
        ? round <= 2 ? 7.5 : round === 3 ? 8.5 : 6
        : completedTaskCount === 1
          ? round <= 3 ? 5 : 3.5
          : 1.5;
      let value = 2.5
        + Math.min(16, routeValue * 0.72)
        + Math.min(7, cFinalProgress * 1.25)
        + Math.min(5, directScore * 0.28)
        + Math.min(5, playableScore * 0.2)
        + lowTaskPressure;
      if (round >= FINAL_ROUND_NUMBER && directScore <= 0 && cFinalProgress <= 0) value *= 0.7;
      if (handSize >= 8) value *= 0.6;
      else if (handSize >= 7) value *= 0.75;
      else if (handSize >= 6) value *= 0.88;
      return roundAiScore(Math.min(28, Math.max(0, value)));
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
        ? 4 + (model?.tasks?.length || 0) * 3.6 + (model?.triggers?.length || 0) * 2
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
      const cFinalTaskProgressValue = model?.tasks?.length
        ? scoreAiCFinalTaskProgressValue(player, model.tasks.length)
        : 0;
      const chongTaskChainValue = details.chongTaskChainValue ?? scoreAiChongCardTaskChainValue(card, player);
      const banrenmaThresholdSetupValue = details.banrenmaThresholdSetupValue
        ?? scoreAiBanrenmaCardThresholdSetupValue(card, player);
      const playCardConversionPressure = details.playCardConversionPressure
        ?? scoreAiPlayCardConversionPressure(card, {
          player,
          model,
          playEffects,
          typeCode,
          endGameExpectedScore,
          plan: routePlan,
          standardActionPremium,
        });
      const finalRoundEndGameCardUrgency = scoreAiFinalRoundEndGameCardUrgency(
        typeCode,
        model,
        player,
        endGameExpectedScore,
        c2Type3ProgressValue,
      );
      const directScoreGain = details.directScoreGain ?? getAiRewardDirectScore(playEffects, player);
      const firstRound25Pressure = getAiRoundNumber() <= 1
        && Math.max(0, aiNumber(player?.resources?.score)) < 25;
      const directScorePaceValue = scoreAiPaceValueForDirectScore(directScoreGain, player, {
        baseWeight: getAiRoundNumber() >= 3
          ? 0.45
          : getAiRoundNumber() === 2
            ? 0.28
            : firstRound25Pressure
              ? 0.32
              : 0.12,
        pressureWeight: getAiRoundNumber() >= 3
          ? 0.2
          : firstRound25Pressure
            ? 0.18
            : 0.1,
      });
      const thirdFinalMarkCashoutValue = scoreAiThirdFinalMarkCashoutValue(directScoreGain, player, {
        weight: 0.75,
      });
      const secondFinalMarkNudgeValue = scoreAiSecondFinalMarkNudgeValue(directScoreGain, player, {
        weight: 0.45,
      });
      const routePlanCashout = Boolean(
        routePlan?.movePreview?.followupLanding?.directScoreGain > 0
        || routePlan?.postLaunchMovePlan?.followupDirectScore > 0
        || routePlan?.actionId === "land"
        || routePlan?.actionId === "orbit"
      );
      const finalSecondMarkNoDirectSetupPenalty = details.finalSecondMarkNoDirectSetupPenalty
        ?? scoreAiFinalSecondMarkNoDirectSetupPenalty(player, {
          actionId: "playCard",
          directScoreGain,
          setupScore: Math.max(0, aiNumber(routePlan?.score), standardActionPremium),
          consumesHand: true,
          cost,
          noCashoutRoute: !routePlanCashout,
          playCardConversionPressure,
        });
      const finalRoundResourceDrainPenalty = details.finalRoundResourceDrainPenalty
        ?? scoreAiFinalRoundPlayCardResourceDrainPenalty(card, {
          player,
          model,
          cost,
          directScoreGain,
          routePlanCashout,
        });
      return effectValue
        + reserveValue
        + endGameValue
        + plutoValue
        + demandFit
        + standardActionPremium
        + directScorePaceValue
        + thirdFinalMarkCashoutValue
        + secondFinalMarkNudgeValue
        + applyAiStrategyWeight(c2Type3ProgressValue, "final", 0.85)
        + applyAiStrategyWeight(Math.min(12, cFinalTaskProgressValue), "task", 0.75)
        + applyAiStrategyWeight(chongTaskChainValue, "task", 0.7)
        + applyAiStrategyWeight(banrenmaThresholdSetupValue, "playCard", 0.65)
        + applyAiStrategyWeight(finalRoundEndGameCardUrgency, "final", 0.75)
        + applyAiStrategyWeight(Math.min(10, endGameExpectedScore * 0.55), "final", 0.6)
        + applyAiStrategyWeight(Math.max(0, aiNumber(routePlan?.score)), "playCard", 0.35)
        + applyAiStrategyWeight(playCardConversionPressure, "playCard", 0.65)
        + Math.max(0, 4 - aiNumber(price)) * 0.5
        - costValue
        - cornerOpportunity * 0.45
        - finalSecondMarkNoDirectSetupPenalty
        - finalRoundResourceDrainPenalty;
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
      const usedIncomeCardIndexes = new Set();
      return (effects || []).reduce((total, effect) => {
        if (isAiIncomeRewardEffect(effect)) {
          return total + scoreAiIncomeRewardOpportunityValue(
            player,
            effect?.options || {},
            usedIncomeCardIndexes,
          );
        }
        return total + aiNumber(scoreAiEffectValue(effect, { player }));
      }, 0);
    }

    function scoreAiOrbitRewardValue(planetId, player = getCurrentPlayer()) {
      if (!planetId) return 0;
      const sequence = Math.max(1, planetStats.getPlanetOrbitCount(planetStatsState, planetId) + 1);
      return scoreAiRewardEffects(planetRewards.buildOrbitRewardEffects?.(planetId, sequence) || [], player)
        + scoreAiRunezuSourceSymbolValue("planet", planetId, player);
    }

    function getAiLandRewardEffectsForTarget(planetId, target = { type: "planet" }) {
      if (!planetId || !target) return [];
      if (target.type === "satellite") {
        return planetRewards.buildSatelliteLandRewardEffects?.(target.satelliteId) || [];
      }
      if (planetId === "pluto") {
        return [
          { type: "gain_resources", options: { gain: { score: 11 } } },
          { type: "gain_data", options: { count: 4 } },
          { type: "alien_trace", options: { traceType: "yellow" } },
        ];
      }
      const sequence = Math.max(1, planetStats.getPlanetLandingCount(planetStatsState, planetId) + 1);
      return planetRewards.buildPlanetLandRewardEffects?.(planetId, sequence) || [];
    }

    function getAiCardLandChoicePlanetId(choice, fallbackPlanetId = null) {
      return choice?.planetId
        || choice?.planet?.planetId
        || choice?.target?.planetId
        || fallbackPlanetId
        || null;
    }

    function getAiCardLandChoiceRewardEffects(effect, choice, fallbackPlanetId = null) {
      const planetId = getAiCardLandChoicePlanetId(choice, fallbackPlanetId);
      if (!planetId) return [];
      const target = choice?.target || { type: "planet" };
      const rewardEffects = effect?.options?.grantRewards === false
        ? []
        : [...getAiLandRewardEffectsForTarget(planetId, target)];
      const afterLandRewards = (effect?.options?.afterLandRewards || [])
        .filter((reward) => {
          const planetIds = reward.planetIds || [];
          const planetMatch = !planetIds.length || planetIds.includes(planetId);
          const satelliteMatch = reward.includeSatellites && target.type === "satellite";
          return planetMatch || satelliteMatch;
        })
        .map((reward) => reward.effect)
        .filter(Boolean);
      return [...rewardEffects, ...afterLandRewards];
    }

    function isAiAlienTraceRewardEffect(effect) {
      return effect?.type === planetRewards.EFFECT_TYPES?.ALIEN_TRACE || effect?.type === "alien_trace";
    }

    function canAiResolveCardLandChoice(effect, choice, fallbackPlanetId = null, player = getCurrentPlayer()) {
      const rewardEffects = getAiCardLandChoiceRewardEffects(effect, choice, fallbackPlanetId);
      return !(rewardEffects || []).some((rewardEffect) => !canAiResolveAlienTraceEffect(rewardEffect, player));
    }

    function canAiResolveCardLandEffect(effect, player = getCurrentPlayer()) {
      const options = abilities.planet.getLandOptions(createActionContext(), effect?.options || {});
      if (!options.ok) return { ok: false, message: options.message || "当前不能登陆" };
      const choices = options.choices || [];
      if (!choices.length) return { ok: false, message: "当前没有可选登陆目标" };
      const fallbackPlanetId = options.planet?.planetId || null;
      if (!choices.some((choice) => canAiResolveCardLandChoice(effect, choice, fallbackPlanetId, player))) {
        return { ok: false, message: "登陆奖励没有安全的外星人痕迹目标" };
      }
      return { ok: true };
    }

    function scoreAiLandRewardValueForTarget(planetId, target = { type: "planet" }, player = getCurrentPlayer()) {
      const effects = getAiLandRewardEffectsForTarget(planetId, target);
      return (Array.isArray(effects) ? scoreAiRewardEffects(effects, player) : 0)
        + scoreAiRunezuSourceSymbolValue("planet", planetId, player);
    }

    function scoreAiLandResolvedRewardValueForTarget(planetId, target = { type: "planet" }, player = getCurrentPlayer()) {
      const effects = getAiLandRewardEffectsForTarget(planetId, target);
      const sourceSymbolValue = scoreAiRunezuSourceSymbolValue("planet", planetId, player);
      if (!Array.isArray(effects)) return sourceSymbolValue;
      return scoreAiRewardEffects(
        effects.filter((effect) => !isAiAlienTraceRewardEffect(effect) || canAiResolveAlienTraceEffect(effect, player)),
        player,
      ) + sourceSymbolValue;
    }

    function getAiRewardTraceTypes(effects = []) {
      const types = new Set();
      for (const effect of effects || []) {
        const type = effect?.type;
        if (type !== planetRewards.EFFECT_TYPES?.ALIEN_TRACE && type !== "alien_trace") continue;
        const options = effect.options || {};
        if (Array.isArray(options.traceTypes)) {
          for (const traceType of options.traceTypes) {
            if (traceType) types.add(String(traceType));
          }
        }
        if (options.traceType) types.add(String(options.traceType));
      }
      return [...types];
    }

    function scoreAiDeferredAlienTraceRewardPenalty(effects = [], player = getCurrentPlayer()) {
      if (!player) return 0;
      let penalty = 0;
      for (const effect of effects || []) {
        if (!isAiAlienTraceRewardEffect(effect) || canAiResolveAlienTraceEffect(effect, player)) continue;
        const traceTypes = getAiRewardTraceTypes([effect]);
        const hasLostFirstTraceColor = traceTypes.some((traceType) => isAiHiddenFirstTraceColorLost(traceType, player));
        const hasRevealedTarget = traceTypes.some((traceType) => (
          Object.entries(alienGameState?.aliens || {}).some(([alienSlotId, slot]) => (
            slot?.revealed
            && slot?.alienId
            && hasAiFeasibleRevealedAlienTraceTarget(Number(alienSlotId), [traceType], player)
          ))
        ));
        penalty += hasLostFirstTraceColor ? 10 : 6;
        if (!hasRevealedTarget) penalty += 3;
      }
      return penalty;
    }

    function getAiFirstTraceCompetition(player = getCurrentPlayer()) {
      const firstTrace = AI_TRACE_TYPES.reduce((result, traceType) => {
        result[traceType] = { open: 0, own: 0, takenByOthers: 0, revealed: 0 };
        return result;
      }, {});
      for (const slot of Object.values(alienGameState?.aliens || {})) {
        if (!slot) continue;
        for (const traceType of AI_TRACE_TYPES) {
          const entry = firstTrace[traceType];
          if (slot.revealed) {
            entry.revealed += 1;
            continue;
          }
          const traceSlot = slot.traces?.[traceType];
          if (!traceSlot?.firstPlaced) {
            entry.open += 1;
          } else if (aiMarkerBelongsToPlayer(traceSlot, player)) {
            entry.own += 1;
          } else {
            entry.takenByOthers += 1;
          }
        }
      }
      return firstTrace;
    }

    function getAiPrecedingOpponentIds(player = getCurrentPlayer()) {
      const activeIds = Array.isArray(turnState.activePlayerIds) && turnState.activePlayerIds.length
        ? turnState.activePlayerIds
        : (playerState.players || []).map((entry) => entry.id).filter(Boolean);
      const index = activeIds.findIndex((playerId) => String(playerId) === String(player?.id));
      if (index >= 0) return activeIds.slice(0, index).filter((playerId) => String(playerId) !== String(player?.id));
      return activeIds.filter((playerId) => String(playerId) !== String(player?.id));
    }

    function getAiApproxLandEnergyCostForPlayer(player, planetId) {
      if (!planetId) return abilities.planet?.BASE_LAND_ENERGY_COST || 3;
      const hasOrbit = planetId === aomomo?.PLANET_ID
        ? aiNumber(aomomo?.countOrbitMarkers?.(alienGameState)) > 0
        : planetStats.getPlanetOrbitCount(planetStatsState, planetId) > 0;
      const orbitDiscount = hasOrbit ? 1 : 0;
      const techDiscount = players.playerOwnsTech(player, "orange3", createActionContext())
        ? (abilities.planet?.ORANGE3_LAND_DISCOUNT || 1)
        : 0;
      return Math.max(0, (abilities.planet?.BASE_LAND_ENERGY_COST || 3) - orbitDiscount - techDiscount);
    }

    function canAiPlayerLandForTraceNow(player, planet, traceType) {
      if (!player || !planet?.planetId || planet.planetId === "earth") return false;
      const energyCost = getAiApproxLandEnergyCostForPlayer(player, planet.planetId);
      if (!players.canAfford(player, energyCost > 0 ? { energy: energyCost } : {})) return false;
      const planetTarget = { type: "planet" };
      if (
        planetStats.canAddLandingMarker(planetStatsState, planet.planetId)
        && getAiRewardTraceTypes(getAiLandRewardEffectsForTarget(planet.planetId, planetTarget)).includes(traceType)
      ) {
        return true;
      }
      if (!players.playerOwnsTech(player, "orange4", createActionContext())) return false;
      return (planetStats.getAvailableSatellitesForLanding?.(planetStatsState, planet.planetId) || [])
        .some((satellite) => getAiRewardTraceTypes(getAiLandRewardEffectsForTarget(planet.planetId, {
          type: "satellite",
          satelliteId: satellite.satelliteId,
        })).includes(traceType));
    }

    function canAiOpponentLandForTraceNow(opponent, traceType) {
      if (!opponent) return false;
      return getMovableTokensForPlayer(opponent.id).some((rocket) => {
        const coordinate = rocketActions.getRocketSectorCoordinate(rocket);
        const planet = getAiPlanetAtCoordinate(coordinate);
        return canAiPlayerLandForTraceNow(opponent, planet, traceType);
      });
    }

    function getAiTraceCompetitionState(player = getCurrentPlayer()) {
      const firstTrace = getAiFirstTraceCompetition(player);
      const yellowLandingPressure = getAiPrecedingOpponentIds(player).reduce((total, playerId) => {
        const opponent = (playerState.players || []).find((entry) => String(entry.id) === String(playerId));
        return total + (canAiOpponentLandForTraceNow(opponent, "yellow") ? 1 : 0);
      }, 0);
      return { firstTrace, yellowLandingPressure };
    }

    function scoreAiHighCostPointConversionPenalty(player = getCurrentPlayer(), options = {}) {
      if (!player || !ai?.valuation?.estimateHighCostPointConversionPenalty) return 0;
      return ai.valuation.estimateHighCostPointConversionPenalty({
        ...options,
        player,
        currentResources: player.resources || {},
        currentScore: player.resources?.score,
        finalMarkCount: countAiFinalMarksForPlayer(player),
        roundNumber: getAiRoundNumber(),
        finalRoundNumber: FINAL_ROUND_NUMBER,
        threshold: getAiNextMissingFinalScoreThreshold(player),
        resourceValues: getAiResourceValuesForRound(),
      });
    }

    function isAiOuterHighScoreSatelliteTarget(planetId, target = {}) {
      return target?.type === "satellite" && (planetId === "uranus" || planetId === "neptune");
    }

    function scoreAiOuterSatelliteCashoutPremium(planetId, target = {}, player = getCurrentPlayer(), options = {}) {
      if (!isAiOuterHighScoreSatelliteTarget(planetId, target) || !player) return 0;
      const directScore = Math.max(0, aiNumber(options.directScore));
      if (directScore < 20) return 0;
      const round = getAiRoundNumber();
      if (round <= 2) return 0;

      const currentScore = Math.max(0, aiNumber(player.resources?.score));
      const threshold = getAiNextMissingFinalScoreThreshold(player);
      const crossesThreshold = Boolean(threshold && currentScore < threshold && currentScore + directScore >= threshold);
      const finalMarks = countAiFinalMarksForPlayer(player);
      const energyShortfall = Math.max(0, Math.round(aiNumber(options.energyShortfall)));
      const routeDistance = options.routeDistance == null
        ? null
        : Math.max(0, Math.round(aiNumber(options.routeDistance)));
      const isCloseRoute = routeDistance == null || routeDistance <= 3;

      if (round === 3) {
        if (!crossesThreshold && energyShortfall > 0 && !isCloseRoute) return 0;
        let premium = 2.2 + Math.max(0, directScore - 18) * 0.34;
        if (crossesThreshold) premium += 5.5;
        if (energyShortfall <= 0) premium += 2.2;
        if (routeDistance != null && routeDistance <= 3) premium += Math.max(0, 3.5 - routeDistance);
        return roundAiScore(Math.min(13, Math.max(0, premium)));
      }

      let premium = 8.5
        + Math.max(0, directScore - 20) * 0.62
        + Math.min(6, getAiLiveScorePaceDeficit(player) * 0.1);
      if (crossesThreshold) premium += 5.5;
      if (finalMarks < 3) premium += 2.5;
      if (energyShortfall <= 0) premium += 2.5;
      else premium -= Math.min(5.5, energyShortfall * 1.8);
      if (routeDistance != null) {
        if (routeDistance <= 3) {
          premium += Math.max(0, 6.25 - routeDistance * 1.35);
          if (directScore >= 25) premium += 1.75;
          if (energyShortfall === 1) premium += 4.5;
          else if (energyShortfall === 2) premium += 2.5;
        }
        else premium -= Math.min(5, (routeDistance - 3) * 1.15);
      }
      if (options.immediate === true) premium += 2;
      return roundAiScore(Math.min(28, Math.max(0, premium)));
    }

    function scoreAiOuterSatelliteRouteApproachPremium(planetId, satelliteOpportunity, player = getCurrentPlayer(), options = {}) {
      if (!satelliteOpportunity || !player) return 0;
      const target = { type: "satellite", satelliteId: satelliteOpportunity.satelliteId };
      if (!isAiOuterHighScoreSatelliteTarget(planetId, target)) return 0;
      const directScore = Math.max(0, aiNumber(satelliteOpportunity.directScore));
      if (directScore < 20) return 0;
      const round = getAiRoundNumber();
      if (round < 3) return 0;
      const newDistance = Math.max(0, Math.round(aiNumber(options.newDistance)));
      if (newDistance <= 0 || newDistance > 3) return 0;
      const oldDistance = options.oldDistance == null
        ? newDistance + 1
        : Math.max(0, Math.round(aiNumber(options.oldDistance)));
      if (oldDistance <= newDistance) return 0;
      const energyShortfall = Math.max(0, Math.round(aiNumber(satelliteOpportunity.energyShortfall)));
      if (round === 3 && energyShortfall > 1) return 0;

      const currentScore = Math.max(0, aiNumber(player.resources?.score));
      const threshold = getAiNextMissingFinalScoreThreshold(player);
      const crossesThreshold = Boolean(threshold && currentScore < threshold && currentScore + directScore >= threshold);
      const distanceGain = Math.max(0, oldDistance - newDistance);
      const finalRound = round >= FINAL_ROUND_NUMBER;
      let premium = finalRound ? 4.8 : 1.6;
      premium += Math.max(0, 4 - newDistance) * (finalRound ? 2.25 : 1.05);
      premium += Math.min(3, distanceGain) * (finalRound ? 1.15 : 0.55);
      premium += Math.max(0, directScore - 20) * (finalRound ? 0.3 : 0.14);
      if (crossesThreshold) premium += finalRound ? 4.5 : 2.5;
      if (countAiFinalMarksForPlayer(player) < 3) premium += finalRound ? 2.2 : 1.1;
      if (energyShortfall <= 0) premium += finalRound ? 2.2 : 1;
      else premium += Math.max(0, 3 - energyShortfall) * (finalRound ? 0.9 : 0.35);
      return roundAiScore(Math.min(finalRound ? 18 : 8, Math.max(0, premium)));
    }

    function canAiOpponentContestSatelliteNow(opponent, planetId) {
      if (!opponent || !planetId || !players.playerOwnsTech(opponent, "orange4", createActionContext())) return false;
      if (!(planetStats.getAvailableSatellitesForLanding?.(planetStatsState, planetId) || []).length) return false;
      const energyCost = abilities.planet.getLandEnergyCost(createActionContext(), planetId);
      if (!players.canAfford(opponent, energyCost > 0 ? { energy: energyCost } : {})) return false;
      return getMovableTokensForPlayer(opponent.id).some((rocket) => {
        const coordinate = rocketActions.getRocketSectorCoordinate(rocket);
        return getAiPlanetAtCoordinate(coordinate)?.planetId === planetId;
      });
    }

    function getAiOuterSatelliteContestPressure(planetId, player = getCurrentPlayer()) {
      if (!planetId || !player) return 0;
      return getAiPrecedingOpponentIds(player).reduce((total, playerId) => {
        const opponent = (playerState.players || []).find((entry) => String(entry.id) === String(playerId));
        return total + (canAiOpponentContestSatelliteNow(opponent, planetId) ? 1 : 0);
      }, 0);
    }

    function scoreAiOuterSatelliteContestRiskPenalty(planetId, target = {}, player = getCurrentPlayer(), options = {}) {
      if (!isAiOuterHighScoreSatelliteTarget(planetId, target)) return 0;
      if (options.immediate === true) return 0;
      const pressure = getAiOuterSatelliteContestPressure(planetId, player);
      if (pressure <= 0) return 0;
      const directScore = Math.max(0, aiNumber(options.directScore));
      const round = getAiRoundNumber();
      const base = round <= 2 ? 11 : round === 3 ? 7 : 3.5;
      return Math.min(24, pressure * base + (directScore >= 20 ? 4 : 0));
    }

    function getAiYellowTraceLandCompetitionPenalty(planetId, target = { type: "planet" }, player = getCurrentPlayer()) {
      const traceTypes = getAiRewardTraceTypes(getAiLandRewardEffectsForTarget(planetId, target));
      if (!traceTypes.includes("yellow")) return 0;
      const competition = getAiTraceCompetitionState(player);
      const yellow = competition.firstTrace?.yellow || {};
      if (aiNumber(yellow.revealed) > 0) return 0;
      const open = aiNumber(yellow.open);
      const landingPressure = aiNumber(competition.yellowLandingPressure);
      let penalty = 0;
      if (open <= 0) penalty += 7;
      else if (landingPressure > 0 && open <= landingPressure) penalty += 5 + landingPressure * 2;
      else penalty += landingPressure * 1.5;

      const currentScore = Math.max(0, aiNumber(player?.resources?.score));
      if (getAiRoundNumber() >= 3 && currentScore < 50 && countAiFinalMarksForPlayer(player) < 2) {
        const directScore = getAiLandDirectScoreGainForTarget(planetId, target, player);
        const secondMarkDeficitAfterLand = Math.max(0, 50 - currentScore - directScore);
        if (secondMarkDeficitAfterLand > 0) {
          penalty += Math.min(12, 4 + secondMarkDeficitAfterLand * 0.18);
        }
      }
      return penalty;
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
      if (type === "research_tech_select" || type === cardEffects.EFFECT_TYPES.RESEARCH_TECH) {
        return getAiResearchTechEffectDirectScore(effect, player);
      }
      return 0;
    }

    function getAiRewardDirectScore(effects = [], player = getCurrentPlayer()) {
      return (effects || []).reduce((total, effect) => (
        total + getAiEffectDirectScore(effect, player)
      ), 0);
    }

    function getAiResearchTechEffectDirectScore(effect, player = getCurrentPlayer()) {
      const options = effect?.options || {};
      const candidates = listAiResearchTechCandidates(options);
      if (!candidates.length) return 0;
      return candidates.reduce((best, candidate) => (
        Math.max(best, getAiResearchTechDirectScoreGain(candidate, options, player))
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
          const target = { type: "satellite", satelliteId: satellite.satelliteId };
          const highScorePremium = Math.max(0, directScore - 12) * 0.45;
          const pacePremium = Math.min(6, getAiLiveScorePaceDeficit(player) * (getAiRoundNumber() >= 3 ? 0.13 : 0.05));
          const affordability = energyShortfall <= 0 ? 4 : -Math.min(8, energyShortfall * 2.4);
          const pointConversionPenalty = scoreAiHighCostPointConversionPenalty(player, {
            actionId: "satelliteLand",
            planetId,
            target,
            directScore,
            energyCost,
            highScoreTarget: directScore >= 20,
          });
          const contestRiskPenalty = scoreAiOuterSatelliteContestRiskPenalty(planetId, target, player, {
            directScore,
            immediate: options.immediate === true,
          });
          const cashoutPremium = scoreAiOuterSatelliteCashoutPremium(planetId, target, player, {
            directScore,
            energyCost,
            energyShortfall,
            immediate: options.immediate === true,
            routeDistance: options.routeDistance,
          });
          return {
            planetId,
            satelliteId: satellite.satelliteId,
            satelliteName: satellite.satelliteName,
            rewardValue,
            directScore,
            energyCost,
            energyShortfall,
            pointConversionPenalty,
            contestRiskPenalty,
            cashoutPremium,
            score: rewardValue * 0.55
              + directScore * 0.22
              + highScorePremium
              + pacePremium
              + affordability
              + cashoutPremium
              - pointConversionPenalty
              - contestRiskPenalty,
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
      const planetRewardValue = scoreAiLandRewardValueForTarget(planetId, { type: "planet" }, player);
      const satelliteOpportunity = getAiBestSatelliteLandingOpportunity(planetId, player);
      const satelliteRewardValue = satelliteOpportunity && aiNumber(satelliteOpportunity.score) > 0
        ? Math.max(
          0,
          aiNumber(satelliteOpportunity.rewardValue)
            - aiNumber(satelliteOpportunity.pointConversionPenalty) * 0.9
            - aiNumber(satelliteOpportunity.contestRiskPenalty) * 1.15,
        )
        : 0;
      return Math.max(
        planetRewardValue,
        satelliteRewardValue,
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

    function scoreAiOrbitChoice(choice, player = getCurrentPlayer(), options = {}) {
      if (!choice) return -Infinity;
      const planetId = choice.planet?.planetId || choice.target?.planetId || null;
      if (!planetId) return -Infinity;
      const demand = getAiStrategyDemand(player);
      const rewardValue = scoreAiOrbitRewardValue(planetId, player);
      const directScoreGain = getAiOrbitDirectScoreGain(planetId, player);
      const chongEffect = options.chongEffect || state.pendingLandTargetAction?.effect || getCurrentActionEffect?.() || null;
      const chongBonus = scoreAiChongTravelChoiceBonus(chongEffect, choice, player);
      return 9
        + rewardValue * 0.72
        + directScoreGain * 0.42
        + scoreAiPaceValueForDirectScore(directScoreGain, player, { baseWeight: 0.3, pressureWeight: 0.14 })
        + scoreAiPlanetMarkerEndGameValue(planetId, player, { markerKind: "orbit" }) * getAiStrategyWeight("final")
        + getAiMapDemand(demand.planetIds, planetId) * 0.65 * getAiStrategyWeight("route")
        + getAiMapDemand(demand.actions, "orbit") * 0.26 * getAiStrategyWeight("orbitLand")
        + chongBonus
        - (isAiChongTravelEffect(chongEffect) ? 0 : scoreAiResourceBundle(abilities.planet.DEFAULT_ORBIT_COST) * 0.25);
    }

    function scoreAiLandChoice(choice, player = getCurrentPlayer(), options = {}) {
      if (!choice) return -Infinity;
      if (choice.kind === "orbit") return scoreAiOrbitChoice(choice, player, options);
      const planetId = choice.planet?.planetId || choice.target?.planetId || null;
      const rewardEffects = getAiLandRewardEffectsForTarget(planetId, choice.target);
      const rewardValue = aiNumber(scoreAiLandResolvedRewardValueForTarget(planetId, choice.target, player));
      const energyCost = Math.max(0, aiNumber(choice.energyCost ?? choice.cost?.energy));
      const demand = getAiStrategyDemand(player);
      const planetDemand = getAiMapDemand(demand.planetIds, planetId);
      const satelliteBonus = choice.target?.type === "satellite" ? 2 : 0;
      const yellowTracePenalty = getAiYellowTraceLandCompetitionPenalty(planetId, choice.target, player);
      const deferredTracePenalty = scoreAiDeferredAlienTraceRewardPenalty(rewardEffects, player);
      const reservePenalty = scoreAiResourceReservePenaltyForCost(player, { energy: energyCost }, { actionId: "land" });
      const directScoreGain = getAiLandDirectScoreGainForTarget(planetId, choice.target, player);
      const pointConversionPenalty = scoreAiHighCostPointConversionPenalty(player, {
        actionId: "land",
        planetId,
        target: choice.target,
        directScore: directScoreGain,
        energyCost,
        highScoreTarget: choice.target?.type === "satellite" && directScoreGain >= 20,
      });
      const contestRiskPenalty = scoreAiOuterSatelliteContestRiskPenalty(planetId, choice.target, player, {
        directScore: directScoreGain,
        immediate: true,
      });
      const outerSatelliteCashoutPremium = scoreAiOuterSatelliteCashoutPremium(planetId, choice.target, player, {
        directScore: directScoreGain,
        energyCost,
        energyShortfall: 0,
        immediate: true,
        routeDistance: 0,
      });
      const markerValue = aiNumber(scoreAiPlanetMarkerEndGameValue(planetId, player, {
          markerKind: choice.target?.type === "satellite" ? "satellite" : "land",
          target: choice.target,
        }));
      const chongEffect = options.chongEffect || state.pendingLandTargetAction?.effect || getCurrentActionEffect?.() || null;
      const chongBonus = scoreAiChongTravelChoiceBonus(chongEffect, choice, player);
      return rewardValue
        + markerValue * getAiStrategyWeight("final")
        + planetDemand * 0.7 * getAiStrategyWeight("route")
        + getAiMapDemand(demand.actions, "land") * 0.26 * getAiStrategyWeight("orbitLand")
        + satelliteBonus
        + outerSatelliteCashoutPremium
        + chongBonus
        - energyCost * getAiResourceValuesForRound(player).energy * 0.3
        - yellowTracePenalty
        - deferredTracePenalty
        - reservePenalty
        - pointConversionPenalty
        - contestRiskPenalty;
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
      const taskRouteCashout = getAiPendingPlanetTaskRouteCashout(planet.planetId, player);
      const chongPickupRouteValue = scoreAiChongPickupRouteValue(planet.planetId, player);
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
        value -= scoreAiResourceReservePenaltyForCost(player, abilities.planet.DEFAULT_ORBIT_COST, { actionId: "orbit" }) * 0.35;
      }
      if (canAiPlanetAcceptLanding(planet.planetId, player)) {
        const landEnergyCost = abilities.planet.getLandEnergyCost(context, planet.planetId);
        const landRewardValue = scoreAiBestLandRewardValueForPlanet(planet.planetId, player);
        const planetLandDirectScore = getAiLandDirectScoreGainForTarget(planet.planetId, { type: "planet" }, player);
        const satelliteOpportunity = getAiBestSatelliteLandingOpportunity(planet.planetId, player);
        const satelliteDirectScore = satelliteOpportunity && aiNumber(satelliteOpportunity.score) > 0
          ? aiNumber(satelliteOpportunity.directScore)
          : 0;
        const bestLandDirectScore = Math.max(planetLandDirectScore, satelliteDirectScore);
        const satelliteTarget = satelliteOpportunity
          ? { type: "satellite", satelliteId: satelliteOpportunity.satelliteId }
          : null;
        const outerSatelliteCashoutPremium = satelliteTarget
          ? scoreAiOuterSatelliteCashoutPremium(planet.planetId, satelliteTarget, player, {
            directScore: satelliteDirectScore,
            energyCost: satelliteOpportunity.energyCost,
            energyShortfall: satelliteOpportunity.energyShortfall,
          })
          : 0;
        const satelliteRoutePenalty = aiNumber(satelliteOpportunity?.pointConversionPenalty) * 0.45
          + aiNumber(satelliteOpportunity?.contestRiskPenalty) * 0.9
          - outerSatelliteCashoutPremium * (round >= FINAL_ROUND_NUMBER ? 0.35 : 0.18);
        const canAffordLand = players.canAfford(player, landEnergyCost > 0 ? { energy: landEnergyCost } : {});
        const energyShortfall = Math.max(0, landEnergyCost - Math.max(0, aiNumber(resources.energy)));
        const landDirectAffordability = canAffordLand ? 1 : Math.max(0.12, 0.55 - energyShortfall * 0.16);
        bestRouteDirectScore = Math.max(bestRouteDirectScore, bestLandDirectScore * landDirectAffordability);
        if (canAffordLand) bestCashoutDirectScore = Math.max(bestCashoutDirectScore, bestLandDirectScore);
        value += 11 - Math.min(4, landEnergyCost);
        value += landRewardValue * (round <= 2 ? 0.52 : 0.42);
        value += outerSatelliteCashoutPremium * (round >= FINAL_ROUND_NUMBER ? 0.65 : 0.38);
        if (canAffordLand) value += 3;
        else value -= Math.min(6, energyShortfall * (round >= 3 ? 2 : 1.4));
        value -= satelliteRoutePenalty;
        value -= getAiYellowTraceLandCompetitionPenalty(planet.planetId, { type: "planet" }, player) * 0.6;
        value -= scoreAiResourceReservePenaltyForCost(player, { energy: landEnergyCost }, { actionId: "land" }) * 0.35;
      }
      if (taskRouteCashout.count > 0) {
        const taskValue = Math.min(24, aiNumber(taskRouteCashout.value));
        value += taskValue * (round <= 2 ? 0.92 : round === 3 ? 1 : 0.74) * getAiStrategyWeight("task");
        bestRouteDirectScore = Math.max(bestRouteDirectScore, aiNumber(taskRouteCashout.directScore));
        bestCashoutDirectScore = Math.max(bestCashoutDirectScore, aiNumber(taskRouteCashout.directScore));
      }
      if (chongPickupRouteValue > 0) {
        value += chongPickupRouteValue
          * (round <= 2 ? 0.95 : round === 3 ? 0.82 : 0.56)
          * getAiStrategyWeight("task");
      }
      const paceDirectScore = bestCashoutDirectScore || bestRouteDirectScore;
      if (paceDirectScore > 0) {
        value += scoreAiPaceValueForDirectScore(paceDirectScore, player, {
          baseWeight: round >= 3 ? 0.58 : round === 2 ? 0.36 : 0.18,
          pressureWeight: round >= 3 ? 0.24 : 0.13,
        });
        value += scoreAiThirdFinalMarkCashoutValue(paceDirectScore, player, {
          weight: 0.65,
        });
        value += scoreAiSecondFinalMarkNudgeValue(paceDirectScore, player, {
          weight: 0.4,
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

    function isAiAsteroidCoordinate(coordinate) {
      return Boolean(coordinate && isAsteroidContent(getSectorContentForMove(coordinate)));
    }

    function scoreAiMoveArrivalRewardValue(coordinate, player = getCurrentPlayer(), options = {}) {
      if (!coordinate || !player) return 0;
      const content = getSectorContentForMove(coordinate);
      if (!content) return 0;
      let publicityGain = 0;
      if (content.kind === solar.layout.CONTENT_KIND.PLANET && content.planetId !== "earth") {
        publicityGain = 1;
      } else if (content.kind === solar.layout.CONTENT_KIND.COMET) {
        publicityGain = 1;
      } else if (
        content.kind === solar.layout.CONTENT_KIND.ASTEROID
        && players.playerOwnsTech(player, "orange2", createActionContext())
      ) {
        publicityGain = 1;
      }
      if (publicityGain <= 0) return 0;
      const round = getAiRoundNumber();
      const baseScale = round <= 2 ? 0.62 : round === 3 ? 0.5 : 0.42;
      const freeScale = options.free ? 1 : 0.78;
      const asteroidOrange2Bonus = content.kind === solar.layout.CONTENT_KIND.ASTEROID ? 0.85 : 0;
      const resourceValue = scoreAiResourceBundle({ publicity: publicityGain }) * baseScale * freeScale;
      const currentPublicity = Math.max(0, aiNumber(player.resources?.publicity));
      const projectedPublicity = Math.min(players.RESOURCE_LIMITS.publicity, currentPublicity + publicityGain);
      const selectionBridge = currentPublicity < 3 && projectedPublicity >= 3
        ? (round <= 2 ? 0.85 : round === 3 ? 1.15 : 1.45)
        : 0;
      return roundAiScore(Math.max(0, resourceValue + selectionBridge * freeScale + asteroidOrange2Bonus));
    }

    function getAiThreeRotationDistanceSwingForPlanet(planetId) {
      if (planetId === "uranus" || planetId === "neptune") return 3;
      if (planetId === "jupiter" || planetId === "saturn") return 2;
      if (planetId === "mars" || planetId === "mercury" || planetId === "venus") return 1;
      return 0;
    }

    function getAiNearestActionablePlanetRoute(coordinate, player = getCurrentPlayer()) {
      if (!coordinate || !player) return null;
      return solar.createSolarSnapshot(solarState).planetLocations
        .filter((planet) => (
          planet?.planetId
          && planet.planetId !== "earth"
          && (canAiPlanetAcceptOrbit(planet.planetId) || canAiPlanetAcceptLanding(planet.planetId, player))
        ))
        .map((planet) => ({
          planetId: planet.planetId,
          planetName: planet.name || planet.planetId,
          distance: getAiSectorDistance(coordinate, planet),
          optimalRange: getAiPlanetOptimalMoveRange(planet.planetId),
        }))
        .filter((entry) => Number.isFinite(Number(entry.distance)))
        .sort((left, right) => left.distance - right.distance)[0] || null;
    }

    function getAiActionablePlanetDistanceWindow(coordinate, player = getCurrentPlayer()) {
      const nearestPlanet = getAiNearestActionablePlanetRoute(coordinate, player);
      const range = nearestPlanet?.optimalRange || null;
      if (!nearestPlanet || !range) {
        return {
          nearestPlanet,
          distance: 99,
          range,
          excess: 0,
          swing: 0,
          waitableExcess: 0,
        };
      }
      const distance = Math.max(0, Math.round(aiNumber(nearestPlanet.distance)));
      const excess = Math.max(0, distance - range.max);
      const swing = getAiThreeRotationDistanceSwingForPlanet(nearestPlanet.planetId);
      return {
        nearestPlanet,
        distance,
        range,
        excess,
        swing,
        waitableExcess: Math.min(excess, Math.max(0, swing)),
      };
    }

    function scoreAiNearestActionablePlanetTimingPenalty(options = {}) {
      const player = options.player || getCurrentPlayer();
      if (!player || !options.to) return 0;
      if (Math.max(0, aiNumber(options.followupScore)) > 0) return 0;
      const toWindow = getAiActionablePlanetDistanceWindow(options.to, player);
      if (!toWindow.nearestPlanet || !toWindow.range || toWindow.excess <= 0) return 0;
      const fromWindow = getAiActionablePlanetDistanceWindow(options.from, player);
      const sameNearestPlanet = fromWindow.nearestPlanet?.planetId === toWindow.nearestPlanet?.planetId;
      const distanceImprovement = sameNearestPlanet
        ? Math.max(0, aiNumber(fromWindow.distance) - aiNumber(toWindow.distance))
        : 0;
      const excessImprovement = sameNearestPlanet
        ? Math.max(0, aiNumber(fromWindow.excess) - aiNumber(toWindow.excess))
        : 0;
      const round = getAiRoundNumber();
      const waitableWeight = round <= 2 ? 2.55 : round === 3 ? 2.05 : 1.45;
      const hardExcessWeight = round <= 2 ? 1.15 : 0.85;
      let penalty = toWindow.waitableExcess * waitableWeight
        + Math.max(0, toWindow.excess - toWindow.swing) * hardExcessWeight;
      if (distanceImprovement <= 0) {
        penalty += 2 + Math.min(6, toWindow.excess * 1.2);
      } else if (excessImprovement > 0) {
        penalty *= 0.48;
      } else {
        penalty *= 0.72;
      }
      if (toWindow.distance >= 4 && distanceImprovement <= 1) {
        penalty += Math.min(6, 1.5 + (toWindow.distance - 3) * 1.15);
      }
      if (isAiIndustryHuanyuMoveContext(options) && toWindow.excess > 0 && distanceImprovement <= 0) {
        penalty += Math.min(7, 2.5 + toWindow.excess * 1.4);
      }
      if (isAiAsteroidCoordinate(options.to) && !players.playerOwnsTech(player, "orange2", createActionContext())) {
        penalty *= 1.25;
      }
      return roundAiScore(Math.min(24, Math.max(0, penalty)));
    }

    function countAiPlayerRocketsOnAsteroids(player = getCurrentPlayer()) {
      if (!player) return 0;
      return (rocketActions.getRocketsForPlayer?.(rocketState, player.id) || [])
        .reduce((total, rocket) => {
          const coordinate = rocketActions.getRocketSectorCoordinate(rocket);
          return total + (isAiAsteroidCoordinate(coordinate) ? 1 : 0);
        }, 0);
    }

    function scoreAiOrange2MobilityNeed(player = getCurrentPlayer()) {
      if (!player || players.playerOwnsTech(player, "orange2", createActionContext())) return 0;
      const demand = getAiStrategyDemand(player);
      const playerRockets = rocketActions.getRocketsForPlayer?.(rocketState, player.id) || [];
      const activeRocketCount = playerRockets.length;
      const asteroidRocketCount = countAiPlayerRocketsOnAsteroids(player);
      const asteroidDemand = getAiMapDemand(demand.locationTypes, "asteroid")
        + getAiMapDemand(demand.locationTypes, "earthAdjacentAsteroid");
      const farPlanetWindowPressure = playerRockets.reduce((total, rocket) => {
        const coordinate = rocketActions.getRocketSectorCoordinate(rocket);
        const window = getAiActionablePlanetDistanceWindow(coordinate, player);
        if (!window.nearestPlanet || window.excess <= 0) return total;
        return total + Math.min(4, window.excess * 0.8 + window.waitableExcess * 0.45);
      }, 0);
      if (activeRocketCount <= 0 && asteroidDemand <= 0) return 0;
      const industryLabel = String(getAiIndustryCard(player)?.label || "");
      const huanyuMovePressure = industryLabel.includes("寰宇超动力")
        ? 5.5
        : industryLabel.includes("寰宇")
          ? 3.5
          : 0;
      return Math.min(
        28,
        asteroidRocketCount * 8.6
          + Math.max(0, activeRocketCount - 1) * 3.25
          + asteroidDemand * 1.25
          + farPlanetWindowPressure
          + huanyuMovePressure,
      );
    }

    function isAiLandingEffect(effect) {
      return effect?.type === cardEffects.EFFECT_TYPES.CARD_LAND
        || effect?.type === "aomomo_land_only"
        || isAiChongTravelEffect(effect);
    }

    function isAiChongPickupPlanetId(planetId) {
      return planetId === "jupiter" || planetId === "saturn";
    }

    function isAiChongTravelEffect(effect) {
      return Boolean(
        chong
        && (
          effect?.type === chong.EFFECT_TYPES?.CHONG_LAND_FOR_PICKUP
          || effect?.type === chong.EFFECT_TYPES?.CHONG_ORBIT_OR_LAND_FOR_PICKUP
        ),
      );
    }

    function getAiNextActionEffect(offset = 1) {
      if (!state.pendingActionEffectFlow) return null;
      const currentIndex = Math.max(0, Math.round(aiNumber(state.pendingActionEffectFlow.currentIndex)));
      return state.pendingActionEffectFlow.effects?.[currentIndex + offset] || null;
    }

    function getAiLandEffectCost(effect, planetId) {
      const options = effect?.options || {};
      if (isAiChongTravelEffect(effect)) return {};
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
      const choices = buildAiLandChoicesForPlanet(planet, player);
      const directScoreGain = getAiBestLandDirectScoreGain(planet.planetId, choices, player);
      return {
        ok: true,
        planet,
        directScoreGain,
        score: 14
          + scoreAiPlanetTarget(planet, player)
          + scoreAiChongTravelEffectPlanetValue(effect, planet.planetId, player)
          - scoreAiResourceBundle(cost) * 0.25,
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

    function getAiRouteTargets(player = getCurrentPlayer(), options = {}) {
      const demand = getAiStrategyDemand(player);
      const routeWeight = getAiStrategyWeight("route");
      const targets = solar.createSolarSnapshot(solarState).planetLocations
        .filter((planet) => planet.planetId !== "earth")
        .map((planet) => {
          const satelliteOpportunity = getAiBestSatelliteLandingOpportunity(planet.planetId, player);
          return {
            id: planet.planetId,
            label: planet.name || planet.planetId,
            kind: "planet",
            coordinate: { x: planet.x, y: planet.y },
            value: scoreAiPlanetTarget(planet, player),
            satelliteOpportunity,
          };
        })
        .filter((target) => target.value > 0);
      const chongTransportTarget = getAiChongTransportDeliveryRouteTarget(options.rocket, player);
      if (chongTransportTarget?.value > 0) targets.push(chongTransportTarget);
      const groups = solar.collectVisibleCoordinateGroups(solarState);
      const addLocationTargets = (coordinates, locationType, baseValue) => {
        const locationDemand = getAiMapDemand(demand.locationTypes, locationType);
        const taskRouteCashout = getAiPendingLocationTaskRouteCashout(locationType, player);
        if (locationDemand <= 0 && taskRouteCashout.value <= 0) return;
        for (const coordinate of coordinates || []) {
          targets.push({
            id: `${locationType}:${coordinate.x}:${coordinate.y}`,
            label: coordinate.label || coordinate.kindLabel || locationType,
            kind: "probe-location",
            locationType,
            coordinate: { x: coordinate.x, y: coordinate.y },
            value: baseValue
              + locationDemand * 1.15 * routeWeight
              + Math.min(22, aiNumber(taskRouteCashout.value)) * 0.9 * getAiStrategyWeight("task"),
            taskRouteCashout: taskRouteCashout.count > 0 ? taskRouteCashout : null,
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
      const targets = getAiRouteTargets(player, options);
      if (!from || !to || !targets.length) return { score: 0, target: null };
      const mainActionAlreadyUsed = options.mainActionAlreadyUsed ?? Boolean(state.pendingActionExecuted);
      const round = getAiRoundNumber();
      const urgentCatchup = round === 3 && getAiLiveScorePaceDeficit(player) > 35;
      const indirectTargetMultiplier = round <= 2 ? 0.55 : round === 3 ? 0.38 : 0.28;
      const fromPlanet = getAiPlanetAtCoordinate(from);
      const fromSatelliteOpportunity = fromPlanet
        ? getAiBestSatelliteLandingOpportunity(fromPlanet.planetId, player)
        : null;
      let best = { score: -Infinity, target: null };
      for (const target of targets) {
        const oldDistance = getAiSectorDistance(from, target.coordinate);
        const newDistance = getAiSectorDistance(to, target.coordinate);
        let rotationStagingValue = 0;
        let score = (oldDistance - newDistance) * 4;
        if (newDistance === 0) score += target.value;
        else score += target.value / (newDistance + 1) * indirectTargetMultiplier;
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
          if (target.satelliteOpportunity && newDistance <= 3) {
            const satelliteTarget = {
              type: "satellite",
              satelliteId: target.satelliteOpportunity.satelliteId,
            };
            const satelliteCashoutPremium = scoreAiOuterSatelliteCashoutPremium(target.id, satelliteTarget, player, {
              directScore: target.satelliteOpportunity.directScore,
              energyCost: target.satelliteOpportunity.energyCost,
              energyShortfall: target.satelliteOpportunity.energyShortfall,
              routeDistance: newDistance,
              immediate: newDistance === 0,
            });
            const distanceScale = newDistance === 0 ? 0.75 : newDistance === 1 ? 0.62 : 0.42;
            score += satelliteCashoutPremium * distanceScale;
            score += scoreAiOuterSatelliteRouteApproachPremium(target.id, target.satelliteOpportunity, player, {
              oldDistance,
              newDistance,
            });
          }
          rotationStagingValue = scoreAiRotationStagingValue({
            ...target,
            oldDistance,
            newDistance,
          }, player, { from, to });
          if (rotationStagingValue > 0) score += rotationStagingValue;
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
        if (mainActionAlreadyUsed) score *= round >= 3 ? 0.42 : 0.52;
        if (score > best.score) best = { score, target: { ...target, oldDistance, newDistance, rotationStagingValue } };
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

    function getAiFinalInsufficientCashoutRouteAdjustment(routeTarget, followupMainAction, player = getCurrentPlayer()) {
      if (!player || getAiRoundNumber() < FINAL_ROUND_NUMBER) return null;
      const followupActionId = String(followupMainAction?.actionId || "");
      const hasPlanetCashout = routeTarget?.kind === "planet"
        || ((followupActionId === "orbit" || followupActionId === "land") && followupMainAction?.planetId);
      if (!hasPlanetCashout) return null;
      const directScore = Math.max(0, aiNumber(followupMainAction?.directScoreGain));
      if (directScore <= 0) return null;
      const currentScore = Math.max(0, aiNumber(player.resources?.score));
      const threshold = currentScore < 25 ? 25 : currentScore < 50 ? 50 : currentScore < 70 ? 70 : null;
      if (!threshold || threshold > 50) return null;
      if (currentScore + directScore >= threshold) return null;
      const distance = Math.max(1, threshold - currentScore);
      const coverage = Math.min(1, directScore / distance);
      return {
        routeScoreCap: Math.max(5, 8 + coverage * 4),
        followupScoreScale: Math.max(0.38, 0.45 + coverage * 0.25),
      };
    }

    function scoreAiFinalUncashableMoveEnergyPenalty(options = {}) {
      const player = options.player || getCurrentPlayer();
      if (!player || getAiRoundNumber() < FINAL_ROUND_NUMBER) return 0;
      const followupScore = Math.max(0, aiNumber(options.followupScore));
      if (followupScore > 0) return 0;
      const energySpent = Math.max(0, Math.round(aiNumber(options.energySpent)));
      const energyAfterMovePayment = Math.max(0, Math.round(aiNumber(options.energyAfterMovePayment)));
      if (energySpent <= 0) return 0;

      const currentScore = Math.max(0, aiNumber(player.resources?.score));
      const nextThreshold = getAiNextMissingFinalScoreThreshold(player);
      if (!nextThreshold || currentScore >= nextThreshold || nextThreshold > 70) return 0;
      const distance = Math.max(1, nextThreshold - currentScore);
      if (nextThreshold === 70 && distance > 18) return 0;

      const resources = player.resources || {};
      const routeTarget = options.routeTarget || null;
      const routeDistance = Math.max(0, Math.round(aiNumber(routeTarget?.newDistance)));
      const routeCanStillCashOut = routeTarget?.kind === "planet" && routeDistance <= 0;
      const mainActionOpen = canStartMainAction();
      const handSize = Math.max(0, aiNumber(resources.handSize));
      const credits = Math.max(0, aiNumber(resources.credits));
      const publicity = Math.max(0, aiNumber(resources.publicity));
      const canSearchCardNow = mainActionOpen && handSize <= 1 && (credits >= 2 || publicity >= 3);
      if (energyAfterMovePayment > 0) return 0;
      const thresholdBase = nextThreshold === 50 ? 10 : nextThreshold === 70 ? 8 : 5;
      let penalty = thresholdBase
        + Math.max(0, 8 - distance) * (nextThreshold === 50 ? 1.2 : 0.65)
        + (mainActionOpen ? 4 : 0)
        + ((canSearchCardNow || handSize <= 1) ? 3 : 0)
        + (routeCanStillCashOut ? 0 : 2);
      return roundAiScore(Math.min(nextThreshold === 50 ? 22 : 18, penalty));
    }

    function scoreAiFinalMoveBlocksScanCashoutPenalty(options = {}) {
      const player = options.player || getCurrentPlayer();
      if (!player || getAiRoundNumber() < FINAL_ROUND_NUMBER || !canStartMainAction()) return 0;
      const followupScore = Math.max(0, aiNumber(options.followupScore));
      if (followupScore > 0) return 0;
      if (getAiNextMissingFinalScoreThreshold(player) !== 70) return 0;

      const currentScore = Math.max(0, aiNumber(player.resources?.score));
      if (currentScore < 58 || currentScore >= 70) return 0;

      const scanCheck = actions.canExecute("scan", createActionContext());
      if (!scanCheck.ok) return 0;

      const energySpent = Math.max(0, Math.round(aiNumber(options.energySpent)));
      if (energySpent <= 0) return 0;

      const scanCost = scanEffects.getStandardScanCost(player) || {};
      const scanEnergyCost = Math.max(0, Math.round(aiNumber(scanCost.energy)));
      const energyAfterMovePayment = Math.max(0, Math.round(aiNumber(options.energyAfterMovePayment)));
      if (scanEnergyCost <= 0 || energyAfterMovePayment >= scanEnergyCost) return 0;

      const deficit = Math.max(1, 70 - currentScore);
      return roundAiScore(Math.min(
        58,
        45
          + Math.max(0, 8 - deficit) * 1.6
          + Math.max(0, scanEnergyCost - energyAfterMovePayment) * 8,
      ));
    }

    function scoreAiEarlyMoveBlocksLandingTracePenalty(options = {}) {
      const player = options.player || getCurrentPlayer();
      if (!player) return 0;
      const round = getAiRoundNumber();
      const traceCount = countAiTraceMarkersForPlayer(player);
      if (round > 3 && traceCount > 0) return 0;

      const energySpent = Math.max(0, Math.round(aiNumber(options.energySpent)));
      if (energySpent <= 0) return 0;

      const routeTarget = options.routeTarget || options.routeScore?.target || null;
      const routeArrivedAtPlanet = routeTarget?.kind === "planet"
        && Math.max(0, Math.round(aiNumber(routeTarget?.newDistance))) === 0;
      const planet = options.planet || getAiPlanetAtCoordinate(options.to);
      const planetId = planet?.planetId || (routeArrivedAtPlanet ? routeTarget?.id : null);
      if (!planetId || planetId === "earth") return 0;

      const followupActionId = String(options.followupMainAction?.actionId || "");
      if (followupActionId === "land") return 0;
      if (!canAiPlanetAcceptLanding(planetId, player)) return 0;

      const landCost = Math.max(0, Math.round(aiNumber(
        abilities.planet.getLandEnergyCost(createActionContext(), planetId),
      )));
      if (landCost <= 0) return 0;

      const currentEnergy = Math.max(0, Math.round(aiNumber(player.resources?.energy)));
      const energyAfterMovePayment = Math.max(0, Math.round(aiNumber(options.energyAfterMovePayment)));
      if (currentEnergy < landCost || energyAfterMovePayment >= landCost) return 0;

      const landEffects = getAiLandRewardEffectsForTarget(planetId, { type: "planet" });
      const hasAlienTraceReward = (landEffects || []).some((effect) => isAiAlienTraceRewardEffect(effect));
      const rewardValue = Math.max(0, aiNumber(scoreAiBestLandRewardValueForPlanet(planetId, player)));
      const directScore = Math.max(0, aiNumber(getAiLandDirectScoreGainForTarget(
        planetId,
        { type: "planet" },
        player,
      )));
      if (round > 2 && traceCount > 0 && !hasAlienTraceReward && rewardValue < 18 && directScore < 8) return 0;

      const energyShortfall = Math.max(1, landCost - energyAfterMovePayment);
      let penalty = (round <= 1 ? 8 : round === 2 ? 6 : 3)
        + (traceCount <= 0 ? 9 : traceCount <= 2 ? 4 : 0)
        + (hasAlienTraceReward ? (traceCount <= 0 ? 5 : 3) : 0)
        + Math.min(8, rewardValue * 0.18)
        + Math.min(5, directScore * 0.28)
        + energyShortfall * 4;
      if (followupActionId === "orbit") penalty += 4;
      else if (!followupActionId) penalty += 3;
      if (round >= 3 && traceCount > 2) penalty *= 0.55;
      return roundAiScore(Math.min(34, Math.max(0, penalty)));
    }

    function scoreAiEarlyOrbitOnlyTraceDelayPenalty(options = {}) {
      const player = options.player || getCurrentPlayer();
      if (!player || getAiRoundNumber() > 2 || countAiTraceMarkersForPlayer(player) > 0) return 0;
      const followupMainAction = options.followupMainAction || {};
      if (String(followupMainAction.actionId || "") !== "orbit") return 0;

      const routeTarget = options.routeTarget || options.routeScore?.target || null;
      const routeArrivedAtPlanet = routeTarget?.kind === "planet"
        && Math.max(0, Math.round(aiNumber(routeTarget?.newDistance))) === 0;
      const planet = options.planet || getAiPlanetAtCoordinate(options.to);
      const planetId = planet?.planetId || (routeArrivedAtPlanet ? routeTarget?.id : null);
      if (!planetId || planetId === "earth") return 0;

      const followupScore = Math.max(0, aiNumber(followupMainAction.score));
      const routeScore = Math.max(0, aiNumber(options.routeScore?.score ?? options.routeScore));
      const directScore = Math.max(0, aiNumber(followupMainAction.directScoreGain));
      const landEffects = getAiLandRewardEffectsForTarget(planetId, { type: "planet" });
      const traceDelayWeight = (landEffects || []).some((effect) => isAiAlienTraceRewardEffect(effect)) ? 1 : 0.65;
      const penalty = 58
        + Math.min(32, followupScore * 0.45)
        + Math.min(8, routeScore * 0.1)
        - Math.min(8, directScore * 0.35);
      return roundAiScore(Math.min(96, Math.max(0, penalty * traceDelayWeight)));
    }

    function scoreAiMovementPathPenalty(options = {}) {
      const requiredMovePoints = Math.max(0, Math.round(aiNumber(options.requiredMovePoints ?? options.terrainRequired ?? 1)));
      const routeTarget = options.routeScore?.target || null;
      const followupScore = Math.max(0, aiNumber(options.followupScore));
      const direction = options.direction || {};
      const energySpent = Math.max(0, Math.round(aiNumber(options.energySpent)));
      const energyAfterMovePayment = Math.max(0, Math.round(aiNumber(options.energyAfterMovePayment)));
      let penalty = 0;
      penalty += scoreAiFinalMoveBlocksScanCashoutPenalty({
        player: options.player,
        followupScore: options.followupScore,
        energySpent,
        energyAfterMovePayment,
      });

      if (requiredMovePoints > 1) {
        penalty += (requiredMovePoints - 1) * (getAiRoundNumber() <= 2 ? 1.25 : 0.75);
      }

      penalty += scoreAiRotationTimingMovePenalty({
        ...options,
        routeTarget,
        followupScore,
      });
      penalty += options.nearestActionablePlanetPenalty ?? scoreAiNearestActionablePlanetTimingPenalty({
        ...options,
        routeTarget,
        followupScore,
      });
      penalty += scoreAiAsteroidTrapMovePenalty({
        ...options,
        routeTarget,
        followupScore,
        requiredMovePoints,
      });

      if (!routeTarget && followupScore <= 0) {
        penalty += getAiRoundNumber() >= 3 ? 6 : 3;
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
        if (getAiRoundNumber() >= 3 && followupScore <= 0 && newDistance > 0) {
          penalty += Math.min(7, 2 + newDistance * 0.8);
          if (newDistance >= oldDistance) penalty += 3;
        }
      }

      const movesTowardTarget = routeTarget && aiNumber(routeTarget.newDistance) < aiNumber(routeTarget.oldDistance);
      if (direction.deltaY < 0 && !movesTowardTarget && followupScore <= 0) {
        penalty += getAiRoundNumber() <= 2 ? 2.5 : 1.5;
      }

      return Math.max(0, penalty);
    }

    function scoreAiRotationTimingMovePenalty(options = {}) {
      const player = options.player || getCurrentPlayer();
      const routeTarget = options.routeTarget || null;
      if (!player || routeTarget?.kind !== "planet") return 0;
      if (Math.max(0, aiNumber(options.followupScore)) > 0) return 0;
      const range = getAiPlanetOptimalMoveRange(routeTarget.id);
      if (!range) return 0;
      const newDistance = Math.max(0, Math.round(aiNumber(routeTarget.newDistance)));
      const oldDistance = Math.max(0, Math.round(aiNumber(routeTarget.oldDistance)));
      const excess = Math.max(0, newDistance - range.max);
      if (excess <= 0) return 0;
      const swing = getAiThreeRotationDistanceSwingForPlanet(routeTarget.id);
      if (swing <= 0) return 0;
      const waitableExcess = Math.min(excess, swing);
      const round = getAiRoundNumber();
      let penalty = waitableExcess * (round <= 2 ? 2.3 : round === 3 ? 1.8 : 1.25)
        + Math.max(0, excess - swing) * 0.9;
      if (newDistance >= oldDistance) penalty += 2;
      if (isAiAsteroidCoordinate(options.to) && !players.playerOwnsTech(player, "orange2", createActionContext())) {
        penalty *= 1.35;
      }
      return roundAiScore(Math.min(16, Math.max(0, penalty)));
    }

    function scoreAiRotationStagingValue(routeTarget, player = getCurrentPlayer(), options = {}) {
      if (!player || routeTarget?.kind !== "planet") return 0;
      const range = getAiPlanetOptimalMoveRange(routeTarget.id);
      if (!range) return 0;
      const oldDistance = Math.max(0, Math.round(aiNumber(routeTarget.oldDistance)));
      const newDistance = Math.max(0, Math.round(aiNumber(routeTarget.newDistance)));
      if (newDistance <= range.max || newDistance >= oldDistance) return 0;

      const excess = Math.max(0, newDistance - range.max);
      const swing = getAiThreeRotationDistanceSwingForPlanet(routeTarget.id);
      if (excess <= 0 || swing <= 0 || excess > swing) return 0;
      if (isAiAsteroidCoordinate(options.to) && !players.playerOwnsTech(player, "orange2", createActionContext())) {
        return 0;
      }

      const round = getAiRoundNumber();
      const rotationFit = Math.max(0, swing - excess + 1);
      const routeValue = Math.max(0, aiNumber(routeTarget.value));
      const satellitePressure = routeTarget.satelliteOpportunity && round >= 3
        ? Math.min(2.4, scoreAiOuterSatelliteCashoutPremium(routeTarget.id, {
          type: "satellite",
          satelliteId: routeTarget.satelliteOpportunity.satelliteId,
        }, player, {
          directScore: routeTarget.satelliteOpportunity.directScore,
          energyCost: routeTarget.satelliteOpportunity.energyCost,
          energyShortfall: routeTarget.satelliteOpportunity.energyShortfall,
          routeDistance: newDistance,
        }) * 0.12)
        : 0;
      return roundAiScore(Math.min(
        5.5,
        (round <= 2 ? 1.2 : round === 3 ? 0.95 : 0.65) * rotationFit
          + Math.min(1.8, routeValue * 0.04)
          + satellitePressure,
      ));
    }

    function scoreAiAsteroidTrapMovePenalty(options = {}) {
      const player = options.player || getCurrentPlayer();
      const routeTarget = options.routeTarget || options.routeScore?.target || null;
      const routeIsAsteroidTarget = routeTarget?.kind === "probe-location"
        && (routeTarget.locationType === "asteroid" || routeTarget.locationType === "earthAdjacentAsteroid");
      const toMatchesAsteroidRouteTarget = routeIsAsteroidTarget
        && Number(routeTarget.coordinate?.x) === Number(options.to?.x)
        && Number(routeTarget.coordinate?.y) === Number(options.to?.y);
      const toIsAsteroidStop = isAiAsteroidCoordinate(options.to) || toMatchesAsteroidRouteTarget;
      if (!player || !toIsAsteroidStop) return 0;
      const ownsOrange2 = players.playerOwnsTech(player, "orange2", createActionContext());
      const fromAsteroid = isAiAsteroidCoordinate(options.from);
      const currentAsteroidCount = countAiPlayerRocketsOnAsteroids(player);
      const asteroidCountAfter = Math.max(0, currentAsteroidCount + (fromAsteroid ? 0 : 1));
      const nearestPlanet = getAiNearestActionablePlanetRoute(options.to, player);
      const range = nearestPlanet?.optimalRange || null;
      const nearestDistance = Math.max(0, Math.round(aiNumber(nearestPlanet?.distance)));
      const distanceExcess = range
        ? Math.max(0, nearestDistance - range.max)
        : 0;
      const followupScore = Math.max(0, aiNumber(options.followupScore));
      const canContinueSameMove = Math.max(0, Math.round(aiNumber(options.remainingPoolAfterStep))) > 0
        && !isAiIndustryHuanyuMoveContext(options);
      const routeCanCashOut = followupScore > 0 || (routeTarget?.kind === "planet" && Math.max(0, aiNumber(routeTarget.newDistance)) <= 0);
      const swing = nearestPlanet?.planetId ? getAiThreeRotationDistanceSwingForPlanet(nearestPlanet.planetId) : 0;
      const waitableExcess = Math.min(distanceExcess, swing);
      const round = getAiRoundNumber();
      if (ownsOrange2) return 0;
      let penalty = 3.5 + Math.max(0, asteroidCountAfter - 1) * 5;
      if (followupScore <= 0) penalty += 4 + distanceExcess * 1.6;
      if (asteroidCountAfter >= 2) penalty += 5;
      if (asteroidCountAfter >= 2 && !routeCanCashOut) {
        penalty += round <= 2 ? 7 : round === 3 ? 9 : 11;
      }
      if (Math.max(0, Math.round(aiNumber(options.requiredMovePoints))) <= 1) penalty += 1.5;
      if (routeIsAsteroidTarget && !routeCanCashOut) {
        penalty += round <= 2 ? 7 : round === 3 ? 9 : 10;
        if (!canContinueSameMove) penalty += 5;
      }
      if (distanceExcess > 0 && !routeCanCashOut) {
        penalty += Math.min(12, 3 + distanceExcess * 2.8 + waitableExcess * 1.6);
      }
      if (isAiIndustryHuanyuMoveContext(options) && !routeCanCashOut) {
        penalty += asteroidCountAfter >= 2 ? 22 : 8;
        if (distanceExcess > 0) penalty += Math.min(10, distanceExcess * 3 + waitableExcess * 1.5);
      }
      if (nearestDistance >= 4 && !routeCanCashOut) {
        penalty += Math.min(8, nearestDistance * 1.2);
      }
      return roundAiScore(Math.min(58, Math.max(0, penalty)));
    }

    function scoreAiBlueTechDataEngineValue(player = getCurrentPlayer()) {
      if (!player) return 0;
      const round = getAiRoundNumber();
      if (round >= FINAL_ROUND_NUMBER) return 0;
      const demand = getAiStrategyDemand(player);
      const resources = player.resources || {};
      const requiredSlot = data.ANALYZE_REQUIRED_COMPUTER_SLOT || 6;
      const placedCount = Math.max(0, (data.listComputerPlacedTokens?.(player) || []).length);
      const availableData = Math.max(0, aiNumber(resources.availableData));
      const dataRoom = getAiAvailableDataRoom(player);
      const missingForAnalyze = Math.max(0, requiredSlot - placedCount);
      const canReachAnalyze = placedCount + availableData >= requiredSlot;
      const readyAnalyze = hasAiAnalyzeReadyDataSlot(player);
      const currentScore = Math.max(0, aiNumber(resources.score));
      const catchupEngine = currentScore < 55
        || countAiFinalMarksForPlayer(player) < 2
        || getAiLiveScorePaceDeficit(player) > 18;
      const nearAnalyzeEngine = catchupEngine
        && round <= 3
        && placedCount + availableData >= Math.max(4, requiredSlot - 2);
      const blueTraceDemand = getAiMapDemand(demand.traceTypes, "blue");
      const analyzeDemand = getAiMapDemand(demand.actions, "analyze");
      const scanDemand = getAiMapDemand(demand.actions, "scan");
      let value = 0;
      value += Math.min(4.5, availableData * 0.55);
      value += Math.min(3, placedCount * 0.28);
      value += Math.min(2.5, dataRoom * 0.18);
      value += Math.min(4, (blueTraceDemand * 0.07) + (analyzeDemand * 0.08) + (scanDemand * 0.03));
      if (canReachAnalyze) value += readyAnalyze ? 4.2 : 2.5;
      else if (missingForAnalyze <= 2 && dataRoom > 0) value += 1.4 + (2 - missingForAnalyze) * 0.45;
      if (nearAnalyzeEngine) {
        value += Math.min(
          4.2,
          1.6
            + Math.max(0, 3 - missingForAnalyze) * 0.65
            + Math.min(1.4, analyzeDemand * 0.035 + blueTraceDemand * 0.03),
        );
      }
      if (round <= 2 && countAiFinalMarksForPlayer(player) <= 0) value += getAiEarlyEnginePressure(player) * 0.85;
      return roundAiScore(Math.min(15, Math.max(0, value)));
    }

    function scoreAiTechBonus(bonusId, player = getCurrentPlayer()) {
      const resources = player?.resources || {};
      if (bonusId === "bonus_3f") return getAiRoundNumber() <= 2 ? 2.2 : 3;
      if (bonusId === "bonus_1c") return (getAiRoundNumber() <= 2 ? 5.6 : 4.2)
        + Math.max(0, 3 - (player?.hand || []).length) * 0.4
        + scoreAiMidgameResourceContinuationValue({ handSize: 1, cardSelection: 1 }, player, { scale: 0.38 });
      if (bonusId === "bonus_1p") {
        const catchupEnergy = Math.max(0, aiNumber(resources.score)) < 70
          || countAiFinalMarksForPlayer(player) < 3
          || getAiLiveScorePaceDeficit(player) > 15;
        const continuation = scoreAiMidgameResourceContinuationValue(
          { energy: 1 },
          player,
          { scale: catchupEnergy ? 0.72 : 0.58 },
        );
        if (getAiRoundNumber() <= 2) return (resources.energy <= 2 ? 6.1 : 5) + continuation;
        if (catchupEnergy) return (resources.energy <= 2 ? 5.8 : 3.8) + continuation;
        return (resources.energy <= 2 ? 5.4 : 3.6) + continuation;
      }
      if (bonusId === "bonus_1m") return (getAiRoundNumber() <= 2 ? 1.8 : 2.4)
        + scoreAiMidgameResourceContinuationValue({ publicity: 1 }, player, { scale: 0.35 });
      return 1;
    }

    function getAiResearchTechAfterRewardDirectScore(candidate = {}, options = {}, player = getCurrentPlayer()) {
      const reward = options?.afterResearchReward || null;
      if (!reward || !candidate || !player) return 0;
      if (reward.kind === "techTypeCountScore") {
        const techType = candidate.techType || tech.getTechType?.(candidate.tileId) || "";
        if (!techType) return 0;
        const scorePer = Math.max(0, Math.round(aiNumber(reward.scorePer) || 1));
        const ownedTiles = player.techState?.ownedTiles || {};
        const disabledTiles = player.techState?.disabledTiles || {};
        const currentCount = Object.keys(ownedTiles)
          .filter((tileId) => ownedTiles[tileId] && !disabledTiles[tileId] && String(tileId).startsWith(techType))
          .length;
        const gainsNewTile = ownedTiles[candidate.tileId] ? 0 : 1;
        return Math.max(0, (currentCount + gainsNewTile) * scorePer);
      }
      if (reward.kind === "resourceValueScore") {
        const resource = reward.resource || "publicity";
        return Math.max(0, Math.round(aiNumber(player.resources?.[resource])));
      }
      if (reward.kind === "repeatBonus" && !options.skipBonus && candidate.bonusId === "bonus_3f") {
        return 3;
      }
      return 0;
    }

    function getAiResearchTechDirectScoreGain(candidate = {}, options = {}, player = getCurrentPlayer()) {
      let scoreGain = 0;
      if (candidate?.firstTake) scoreGain += 2;
      if (!options?.skipBonus && candidate?.bonusId === "bonus_3f") scoreGain += 3;
      scoreGain += getAiResearchTechAfterRewardDirectScore(candidate, options, player);
      return scoreGain;
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
      const orange2MobilityNeed = scoreAiOrange2MobilityNeed(player);
      const moveDemand = getAiMapDemand(demand.actions, "move");
      const landDemand = getAiMapDemand(demand.actions, "land");
      const scanDemand = getAiMapDemand(demand.actions, "scan") + sumAiDemandMap(demand.scanColors) * 0.35;
      const engineDemand = getAiMapDemand(demand.actions, "researchTech") + demand.task * 0.08 + demand.final * 0.08;
      const blueDataEngineValue = techType === "blue" ? scoreAiBlueTechDataEngineValue(player) : 0;

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
          moveDemand * 0.18
            + asteroidDemand * 0.45
            + routeDemand * 0.05
            + (tileId === "orange2" ? orange2MobilityNeed * 0.55 : orange2MobilityNeed * 0.16),
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
          "蓝科补强数据/分析引擎",
          engineDemand * 0.12
            + blueDataEngineValue * 0.55
            + Math.max(0, getAiRemainingRoundWeight() - 1) * 0.3,
          { tileId, techType },
        );
      }

      return plans
        .filter((plan) => Number.isFinite(Number(plan.score)))
        .sort((left, right) => right.score - left.score)[0] || null;
    }

    function scoreAiResearchTechFinalPlanningValue(candidate, player = getCurrentPlayer()) {
      const techType = candidate?.techType || "";
      if (!candidate || !player || !techType) return 0;
      const deltas = getAiResearchTechFinalFormulaDeltas(candidate, player);
      let value = scoreAiFinalFormulaDeltaValue(deltas, player, {
        includePotential: true,
        potentialScale: getAiRoundNumber() >= 3 ? 0.72 : 0.55,
      });

      const d1Entries = getAiPlanningFinalFormulaEntries(player, ["d1"]);
      if (d1Entries.length) {
        const techCounts = getAiPlayerTechTypeCounts(player);
        const counts = AI_TECH_TYPES.map((type) => aiNumber(techCounts[type]));
        const minCount = Math.min(...counts);
        const maxCount = Math.max(...counts);
        const currentTypeCount = aiNumber(techCounts[techType]);
        const bestD1Multiplier = d1Entries.reduce((best, entry) => (
          Math.max(best, aiNumber(entry.multiplier))
        ), 0);
        if (currentTypeCount === minCount) {
          value += Math.min(
            8,
            2.2
              + Math.max(0, 2 - minCount) * 1.15
              + Math.max(0, maxCount - minCount) * 0.55
              + bestD1Multiplier * 0.18,
          );
        } else if (currentTypeCount >= minCount + 2) {
          value -= Math.min(4, 1.2 + (currentTypeCount - minCount - 1) * 0.7);
        }
      }

      return roundAiScore(value);
    }

    function scoreAiLateTechEngineCatchupValue(candidate, player = getCurrentPlayer()) {
      const techType = candidate?.techType || "";
      if (!candidate || !player || !techType || getAiRoundNumber() < 3) return 0;
      const dEntries = getAiPlanningFinalFormulaEntries(player, ["d1", "d2"]);
      if (!dEntries.length) return 0;
      const round = getAiRoundNumber();
      const techCount = countAiPlayerTech(player);
      const finalMarks = countAiFinalMarksForPlayer(player);
      if (techCount >= (round >= FINAL_ROUND_NUMBER ? 11 : 9)) return 0;

      let value = finalMarks >= 3 ? 2.4 : finalMarks >= 2 ? 1.4 : 0.6;
      value += Math.max(0, 8 - techCount) * (round >= FINAL_ROUND_NUMBER ? 1.25 : 0.9);

      if (dEntries.some((entry) => entry.formulaId === "d2")) {
        const bestD2Multiplier = dEntries.reduce((best, entry) => (
          entry.formulaId === "d2" ? Math.max(best, aiNumber(entry.multiplier)) : best
        ), 0);
        const beforeBase = Math.floor(techCount / 2);
        const afterBase = Math.floor((techCount + 1) / 2);
        if (afterBase > beforeBase) value += Math.min(5, bestD2Multiplier * 0.85);
        else value += Math.min(2.5, bestD2Multiplier * 0.28);
      }

      if (dEntries.some((entry) => entry.formulaId === "d1")) {
        const counts = getAiPlayerTechTypeCounts(player);
        const minCount = Math.min(...AI_TECH_TYPES.map((type) => aiNumber(counts[type])));
        const currentTypeCount = aiNumber(counts[techType]);
        if (currentTypeCount <= minCount) value += 3.2;
        else if (currentTypeCount === minCount + 1) value += 1.2;
        else value -= Math.min(2, currentTypeCount - minCount - 1);
      }

      if (candidate?.bonusId === "bonus_3f") value += 1.2;
      return roundAiScore(Math.min(13, Math.max(0, value)));
    }

    function scoreAiLowTechBoardCatchupValue(candidate, player = getCurrentPlayer()) {
      const techType = candidate?.techType || "";
      if (!candidate || !player || !techType) return 0;
      const round = getAiRoundNumber();
      if (round < 3) return 0;

      const techCount = countAiPlayerTech(player);
      const targetTechCount = round >= FINAL_ROUND_NUMBER ? 9 : 7;
      if (techCount >= targetTechCount) return 0;

      const currentScore = Math.max(0, aiNumber(player.resources?.score));
      const finalMarks = countAiFinalMarksForPlayer(player);
      const dEntries = getAiPlanningFinalFormulaEntries(player, ["d1", "d2"]);
      const hasTechFinalPlan = dEntries.length > 0;
      const severeLowTech = techCount <= (round >= FINAL_ROUND_NUMBER ? 5 : 4);
      const lowScoreTarget = round >= FINAL_ROUND_NUMBER ? 135 : 78;
      const lowScorePressure = currentScore < lowScoreTarget;
      const lowMarkPressure = finalMarks < (round >= FINAL_ROUND_NUMBER ? 3 : 2);

      if (!severeLowTech && !hasTechFinalPlan && !lowScorePressure && !lowMarkPressure) return 0;

      let value = Math.max(0, targetTechCount - techCount) * (round >= FINAL_ROUND_NUMBER ? 0.8 : 0.55);
      if (severeLowTech) value += round >= FINAL_ROUND_NUMBER ? 3 : 2;
      if (lowScorePressure) {
        value += Math.min(
          round >= FINAL_ROUND_NUMBER ? 4.5 : 3,
          1 + Math.max(0, lowScoreTarget - currentScore) * (round >= FINAL_ROUND_NUMBER ? 0.05 : 0.035),
        );
      }
      if (lowMarkPressure) value += round >= FINAL_ROUND_NUMBER ? 1.8 : 1.4;
      if (hasTechFinalPlan) value += round >= FINAL_ROUND_NUMBER ? 2 : 1.2;

      if (dEntries.some((entry) => entry.formulaId === "d1")) {
        const counts = getAiPlayerTechTypeCounts(player);
        const minCount = Math.min(...AI_TECH_TYPES.map((type) => aiNumber(counts[type])));
        const currentTypeCount = aiNumber(counts[techType]);
        if (currentTypeCount <= minCount) value += 1.4;
        else if (currentTypeCount >= minCount + 2) value -= Math.min(1.5, currentTypeCount - minCount - 1);
      }
      if (dEntries.some((entry) => entry.formulaId === "d2")) {
        const beforeBase = Math.floor(techCount / 2);
        const afterBase = Math.floor((techCount + 1) / 2);
        value += afterBase > beforeBase ? 1.5 : 0.45;
      }

      if (candidate?.bonusId === "bonus_3f") value += 0.8;
      if (candidate?.firstTake) value += 0.45;
      return roundAiScore(Math.min(10, Math.max(0, value)));
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
      if (techType === "blue") value += 1.5 + scoreAiBlueTechDataEngineValue(player) * 0.5;
      if (candidate?.tileId === "orange1") value += (getMovableTokensForPlayer(player?.id).length ? 1 : 4);
      if (candidate?.tileId === "orange2") value += scoreAiOrange2MobilityNeed(player) * 0.75;
      if (candidate?.tileId === "orange3") value += 4.8 + getAiMapDemand(demand.actions, "land") * 0.05;
      if (candidate?.tileId === "orange4") {
        const satellitePotential = (solar.createSolarSnapshot(solarState).planetLocations || [])
          .filter((planet) => planet?.planetId && planet.planetId !== "earth")
          .reduce((best, planet) => Math.max(best, (
            planetStats.getAvailableSatellitesForLanding?.(planetStatsState, planet.planetId) || []
          ).reduce((innerBest, satellite) => Math.max(
            innerBest,
            scoreAiRewardEffects(planetRewards.buildSatelliteLandRewardEffects?.(satellite.satelliteId) || [], player)
              + scoreAiOuterSatelliteCashoutPremium(planet.planetId, {
                type: "satellite",
                satelliteId: satellite.satelliteId,
              }, player, {
                directScore: getAiRewardDirectScore(
                  planetRewards.buildSatelliteLandRewardEffects?.(satellite.satelliteId) || [],
                  player,
                ),
                energyCost: getAiApproxLandEnergyCostForPlayer(player, planet.planetId),
                energyShortfall: Math.max(
                  0,
                  getAiApproxLandEnergyCostForPlayer(player, planet.planetId)
                    - Math.max(0, aiNumber(resources.energy)),
                ),
              }),
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
      if (candidate?.firstTake) {
        value += scoreAiRunezuSourceSymbolValue("tech", candidate.tileId, player);
      }
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
      const lateTechCatchupValue = scoreAiLateTechEngineCatchupValue(candidate, player);
      if (lateTechCatchupValue) value += applyAiStrategyWeight(lateTechCatchupValue, "tech", 0.75);
      const lowTechCatchupValue = scoreAiLowTechBoardCatchupValue(candidate, player);
      if (lowTechCatchupValue) value += applyAiStrategyWeight(lowTechCatchupValue, "tech", 0.65);
      const finalPlanningValue = scoreAiResearchTechFinalPlanningValue(candidate, player);
      if (finalPlanningValue) {
        value += applyAiStrategyWeight(
          finalPlanningValue,
          "final",
          getAiRoundNumber() >= FINAL_ROUND_NUMBER ? 1.05 : 0.82,
        );
      }
      const directScoreGain = getAiResearchTechDirectScoreGain(candidate, {}, player);
      value -= scoreAiFinalSecondMarkNoDirectSetupPenalty(player, {
        actionId: "researchTech",
        directScoreGain,
        setupScore: Math.max(0, aiNumber(routePlan?.score)),
        consumesHand: false,
        noCashoutRoute: true,
      });
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
      const selectionOptions = getResearchTechSelectionOptions() || {};
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

    function getAiResearchTechSelectionOptionsForEffect(effect = null) {
      return {
        ...((effect && effect.options) || {}),
        ...(getResearchTechSelectionOptions?.() || {}),
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
      const planScore = Math.max(0, aiNumber(postLaunchMovePlan?.score));
      if (planScore >= 5) return 0;
      const rocketCount = getMovableTokensForPlayer(player?.id).length;
      if (rocketCount === 0) {
        let penalty = round >= FINAL_ROUND_NUMBER ? 4 : 2;
        if (round >= FINAL_ROUND_NUMBER) {
          const turnNumber = Math.max(1, Math.round(aiNumber(turnState.turnNumber) || 1));
          const finalMarks = countAiFinalMarksForPlayer(player);
          if (finalMarks >= 3) penalty += 16;
          else if (turnNumber >= 6) penalty += 12;
          else if (turnNumber >= 4) penalty += 7;
          if (getAiLiveScorePaceDeficit(player) <= 0) penalty += 3;
        }
        return penalty;
      }
      const demand = getAiStrategyDemand(player);
      const routeDemand = getAiTotalRouteDemand(demand);
      const planetDemand = sumAiDemandMap(demand.planetIds);
      const orbitLandDemand = getAiMapDemand(demand.actions, "orbit") + getAiMapDemand(demand.actions, "land");
      if (routeDemand + planetDemand + orbitLandDemand >= 30 && planScore > 0) {
        return 4;
      }
      const currentScore = Math.max(0, aiNumber(player?.resources?.score));
      const firstThresholdCatchup = round >= FINAL_ROUND_NUMBER && currentScore < 25;
      return round >= FINAL_ROUND_NUMBER
        ? (firstThresholdCatchup ? 18 : 14)
        : 8;
    }

    function scoreAiNoRouteLaunchPenalty(player = getCurrentPlayer(), postLaunchMovePlan = null) {
      const round = getAiRoundNumber();
      if (!player || round < 3) return 0;
      if (Math.max(0, aiNumber(postLaunchMovePlan?.score)) > 0) return 0;
      const currentScore = Math.max(0, aiNumber(player.resources?.score));
      const nextThreshold = getAiNextMissingFinalScoreThreshold(player);
      const finalMarks = countAiFinalMarksForPlayer(player);
      if (!nextThreshold || currentScore >= nextThreshold || finalMarks >= 3) return 0;

      const resources = player.resources || {};
      const launchCost = getAiLaunchPaymentCost();
      const creditCost = Math.max(0, aiNumber(launchCost.credits));
      const credits = Math.max(0, aiNumber(resources.credits));
      const energy = Math.max(0, aiNumber(resources.energy));
      const handSize = Math.max(0, aiNumber(resources.handSize ?? (player.hand || []).length));
      const isFinalRound = round >= FINAL_ROUND_NUMBER;
      if (
        !isFinalRound
        && (
          currentScore > 42
          || finalMarks > 1
          || creditCost <= 0
          || credits > creditCost
          || energy > 1
          || handSize > 3
        )
      ) {
        return 0;
      }
      let penalty = (isFinalRound ? 14 : 22)
        + Math.min(8, Math.max(0, nextThreshold - currentScore) * 0.16)
        + Math.max(0, 3 - finalMarks) * 2;
      if (creditCost > 0 && credits <= creditCost) penalty += isFinalRound ? 8 : 14;
      if (energy <= 1 && handSize <= 3) penalty += isFinalRound ? 4 : 6;
      return roundAiScore(Math.min(isFinalRound ? 34 : 44, penalty));
    }

    function scoreAiExtraLaunchPacePenalty(player = getCurrentPlayer()) {
      if (!player) return 0;
      const round = getAiRoundNumber();
      const resources = player.resources || {};
      if (round === 1) {
        const currentScore = Math.max(0, aiNumber(resources.score));
        const energy = aiNumber(resources.energy);
        const handSize = aiNumber(resources.handSize);
        if (currentScore < 25 && energy <= 0 && handSize <= 0) {
          return Math.min(8, 4.5 + Math.max(0, 25 - currentScore) * 0.12 + Math.max(0, 2 - energy) * 0.8);
        }
        return 0;
      }
      const rocketCount = (rocketActions.getRocketsForPlayer?.(rocketState, player.id) || [])
        .filter((rocket) => rocket?.playerId === player.id)
        .length;
      if (rocketCount <= 0) return 0;
      if (round > 3) return 0;
      const deficit = getAiLiveScorePaceDeficit(player);
      if (deficit <= 18) return 0;
      return Math.min(8, 2.5 + (deficit - 18) * (round === 3 ? 0.22 : 0.16));
    }

    function scoreAiFinalSecondMarkExtraLaunchPenalty(player = getCurrentPlayer(), postLaunchMovePlan = null) {
      if (!player || getAiRoundNumber() < FINAL_ROUND_NUMBER) return 0;
      if (Math.max(1, Math.round(aiNumber(turnState.turnNumber) || 1)) < 3) return 0;
      const currentScore = Math.max(0, aiNumber(player.resources?.score));
      if (
        currentScore >= 45
        || countAiFinalMarksForPlayer(player) > 1
        || getAiNextMissingFinalScoreThreshold(player) !== 50
      ) {
        return 0;
      }
      const rocketCount = (rocketActions.getRocketsForPlayer?.(rocketState, player.id) || [])
        .filter((rocket) => rocket?.playerId === player.id)
        .length;
      if (rocketCount <= 0) return 0;
      const planScore = Math.max(0, aiNumber(postLaunchMovePlan?.score));
      return Math.min(18, 8 + Math.max(0, 50 - currentScore) * 0.4 + Math.min(6, planScore * 0.12));
    }

    function scoreAiPostLaunchMovePlan(player = getCurrentPlayer()) {
      if (!player || state.pendingActionExecuted) return null;
      if (!players.canAfford(player, getAiLaunchPaymentCost())) return null;
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
          const nearestActionablePlanetPenalty = scoreAiNearestActionablePlanetTimingPenalty({
            player,
            from,
            to,
            direction,
            routeScore,
            followupScore: 0,
            energySpent: movePayment.energySpent,
            energyAfterMovePayment: movePayment.remainingEnergy,
          });
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
            nearestActionablePlanetPenalty,
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
            nearestActionablePlanetPenalty,
            preserveEnergyForRouteCashout,
          };
        })
        .filter(Boolean)
        .sort((left, right) => right.score - left.score);
      return candidates[0] || null;
    }

    function createAiPlayerAfterQuickTrade(player = getCurrentPlayer(), trade = null) {
      if (!player || !trade) return null;
      const resources = { ...(player.resources || {}) };
      Object.entries(trade.cost || {}).forEach(([key, value]) => {
        resources[key] = aiNumber(resources[key]) - aiNumber(value);
      });
      Object.entries(trade.gain || {}).forEach(([key, value]) => {
        resources[key] = aiNumber(resources[key]) + aiNumber(value);
      });
      return {
        ...player,
        resources,
      };
    }

    function scoreAiEnergyTradeLaunchMoveRecovery(player = getCurrentPlayer(), tradeId = null) {
      if (
        !player
        || !tradeId
        || state.pendingActionExecuted
        || !canStartMainAction()
        || !canAiMoveThisTurn(player.id)
      ) {
        return null;
      }
      const trade = quickTrades?.getTradeAction?.(tradeId);
      if (!trade || aiNumber(trade.gain?.energy) <= 0) return null;
      const simulatedPlayer = createAiPlayerAfterQuickTrade(player, trade);
      if (!simulatedPlayer || !players.canAfford(simulatedPlayer, getAiLaunchPaymentCost())) return null;
      const plan = scoreAiPostLaunchMovePlan(simulatedPlayer);
      const score = Math.max(0, aiNumber(plan?.score));
      if (score < 5) return null;
      return {
        score,
        plan,
      };
    }

    function scoreAiEnergyTradePlanetCashoutRecovery(player = getCurrentPlayer(), tradeId = null) {
      if (!player || !tradeId || !quickTrades?.getTradeAction) return null;
      const trade = quickTrades.getTradeAction(tradeId);
      if (!trade || aiNumber(trade.gain?.energy) <= 0) return null;
      const simulatedPlayer = createAiPlayerAfterQuickTrade(player, trade);
      if (!simulatedPlayer) return null;

      const resources = player.resources || {};
      const simulatedResources = simulatedPlayer.resources || {};
      const currentEnergy = Math.max(0, aiNumber(resources.energy));
      const energyAfterTrade = Math.max(0, aiNumber(simulatedResources.energy));
      if (energyAfterTrade <= currentEnergy) return null;

      const currentScore = Math.max(0, aiNumber(resources.score));
      const nextThreshold = getAiNextMissingFinalScoreThreshold(player);
      const finalMarks = countAiFinalMarksForPlayer(player);
      const round = getAiRoundNumber();
      const context = createActionContext();

      const scoreOpportunity = (opportunity) => {
        const targetEnergy = Math.max(0, aiNumber(opportunity.targetEnergy));
        const directScore = Math.max(0, aiNumber(opportunity.directScore));
        if (targetEnergy <= 0 || currentEnergy >= targetEnergy || directScore <= 0) return null;
        const afterTradeGap = Math.max(0, targetEnergy - energyAfterTrade);
        if (afterTradeGap > 1) return null;
        const reachesNextThreshold = Boolean(nextThreshold)
          && currentScore < nextThreshold
          && currentScore + directScore >= nextThreshold;
        const nearNextThreshold = Boolean(nextThreshold)
          && currentScore < nextThreshold
          && currentScore + directScore >= nextThreshold - 3;
        const finalRoundThresholdMiss = round >= FINAL_ROUND_NUMBER
          && Boolean(nextThreshold)
          && nextThreshold <= 50
          && currentScore < nextThreshold
          && !nearNextThreshold;
        if (finalRoundThresholdMiss) return null;
        if (round >= FINAL_ROUND_NUMBER && !reachesNextThreshold && afterTradeGap > 0) return null;
        const progress = Math.min(1, energyAfterTrade / Math.max(1, targetEnergy));
        const rewardValue = Math.max(0, aiNumber(opportunity.rewardValue));
        const paceDeficit = Math.max(0, getAiLiveScorePaceDeficit(player));
        const thresholdBonus = reachesNextThreshold
          ? (nextThreshold <= 50 ? 15 : 11)
          : nearNextThreshold
            ? 7
            : 0;
        const markBonus = Math.max(0, 3 - finalMarks) * (nextThreshold <= 50 ? 1.8 : 1.2);
        const routeScore = 13
          + progress * 7
          + directScore * (round >= 3 ? 0.9 : 0.55)
          + Math.min(8, rewardValue * 0.14)
          + Math.min(6, paceDeficit * (round >= 3 ? 0.08 : 0.04))
          + thresholdBonus
          + markBonus
          + (energyAfterTrade >= targetEnergy ? 6 : 0)
          - afterTradeGap * 2.5
          - scoreAiResourceBundle(trade.cost || {}) * 0.18;
        if (routeScore < 8) return null;
        return {
          ...opportunity,
          targetEnergy,
          directScore,
          energyAfterTrade,
          afterTradeGap,
          reachesNextThreshold,
          score: Math.min(46, routeScore),
        };
      };

      const best = getMovableTokensForPlayer(player.id)
        .reduce((bestOpportunity, rocket) => {
          const coordinate = rocketActions.getRocketSectorCoordinate(rocket);
          const planet = getAiPlanetAtCoordinate(coordinate);
          if (!planet?.planetId) return bestOpportunity;

          const opportunities = [];
          if (canAiPlanetAcceptLanding(planet.planetId, simulatedPlayer)) {
            const landCost = abilities.planet.getLandEnergyCost(context, planet.planetId);
            const landChoices = buildAiLandChoicesForPlanet(planet, simulatedPlayer);
            const landDirectScore = getAiBestLandDirectScoreGain(planet.planetId, landChoices, simulatedPlayer);
            opportunities.push({
              kind: "land",
              planetId: planet.planetId,
              planetName: planet.name || planet.planetId,
              targetEnergy: landCost,
              directScore: landDirectScore,
              rewardValue: scoreAiBestLandRewardValueForPlanet(planet.planetId, simulatedPlayer),
            });
          }

          if (canAiPlanetAcceptOrbit(planet.planetId)) {
            const orbitCost = abilities.planet.DEFAULT_ORBIT_COST || { credits: 1, energy: 1 };
            if (
              aiNumber(simulatedResources.credits) >= Math.max(0, aiNumber(orbitCost.credits))
              && energyAfterTrade >= Math.max(0, aiNumber(orbitCost.energy))
            ) {
              opportunities.push({
                kind: "orbit",
                planetId: planet.planetId,
                planetName: planet.name || planet.planetId,
                targetEnergy: Math.max(0, aiNumber(orbitCost.energy)),
                directScore: getAiOrbitDirectScoreGain(planet.planetId, simulatedPlayer),
                rewardValue: scoreAiOrbitRewardValue(planet.planetId, simulatedPlayer),
              });
            }
          }

          const localBest = opportunities
            .map(scoreOpportunity)
            .filter(Boolean)
            .sort((left, right) => aiNumber(right.score) - aiNumber(left.score))[0] || null;
          if (!localBest || aiNumber(localBest.score) <= aiNumber(bestOpportunity?.score)) {
            return bestOpportunity;
          }
          return localBest;
        }, null);

      if (!best) return null;
      return {
        score: roundAiScore(best.score),
        plan: best,
      };
    }

    function getAiReservedPlanetCashoutEnergy(player = getCurrentPlayer()) {
      if (!player) return null;
      const currentEnergy = Math.max(0, aiNumber(player.resources?.energy));
      const currentScore = Math.max(0, aiNumber(player.resources?.score));
      const nextThreshold = getAiNextMissingFinalScoreThreshold(player);
      const context = createActionContext();
      const opportunities = [];

      for (const rocket of getMovableTokensForPlayer(player.id)) {
        const coordinate = rocketActions.getRocketSectorCoordinate(rocket);
        const planet = getAiPlanetAtCoordinate(coordinate);
        if (!planet?.planetId) continue;

        if (canAiPlanetAcceptLanding(planet.planetId, player)) {
          const landCost = abilities.planet.getLandEnergyCost(context, planet.planetId);
          const landDirectScore = getAiBestLandDirectScoreGain(
            planet.planetId,
            buildAiLandChoicesForPlanet(planet, player),
            player,
          );
          if (currentEnergy >= landCost && landDirectScore > 0) {
            opportunities.push({
              kind: "land",
              planetId: planet.planetId,
              planetName: planet.name || planet.planetId,
              targetEnergy: landCost,
              directScore: landDirectScore,
            });
          }
        }

        if (canAiPlanetAcceptOrbit(planet.planetId)) {
          const orbitCost = abilities.planet.DEFAULT_ORBIT_COST || { credits: 1, energy: 1 };
          const targetEnergy = Math.max(0, aiNumber(orbitCost.energy));
          const directScore = getAiOrbitDirectScoreGain(planet.planetId, player);
          if (
            currentEnergy >= targetEnergy
            && aiNumber(player.resources?.credits) >= Math.max(0, aiNumber(orbitCost.credits))
            && directScore > 0
          ) {
            opportunities.push({
              kind: "orbit",
              planetId: planet.planetId,
              planetName: planet.name || planet.planetId,
              targetEnergy,
              directScore,
            });
          }
        }
      }

      return opportunities
        .map((opportunity) => {
          const reachesNextThreshold = Boolean(nextThreshold)
            && currentScore < nextThreshold
            && currentScore + Math.max(0, aiNumber(opportunity.directScore)) >= nextThreshold;
          return {
            ...opportunity,
            reachesNextThreshold,
            score: Math.max(0, aiNumber(opportunity.directScore))
              + (reachesNextThreshold ? 16 : 0)
              + Math.min(8, getAiLiveScorePaceDeficit(player) * 0.08),
          };
        })
        .filter((opportunity) => opportunity.score >= 8 || opportunity.reachesNextThreshold)
        .sort((left, right) => aiNumber(right.score) - aiNumber(left.score))[0] || null;
    }

    function scoreAiOrbitAction(candidate) {
      if (!candidate?.available) return 0;
      const demand = getAiStrategyDemand(getCurrentPlayer());
      const currentPlayer = getCurrentPlayer();
      const round = getAiRoundNumber();
      const rewardValue = scoreAiOrbitRewardValue(candidate.planetId, currentPlayer);
      const directScoreGain = getAiOrbitDirectScoreGain(candidate.planetId, currentPlayer);
      const currentScore = Math.max(0, aiNumber(currentPlayer?.resources?.score));
      const nextThreshold = getAiNextMissingFinalScoreThreshold(currentPlayer);
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
      const thirdFinalMarkCashoutValue = scoreAiThirdFinalMarkCashoutValue(directScoreGain, currentPlayer, {
        weight: 0.8,
      });
      const secondFinalMarkNudgeValue = scoreAiSecondFinalMarkNudgeValue(directScoreGain, currentPlayer, {
        weight: 0.45,
      });
      const noDirectPacePenalty = directScoreGain > 0
        ? 0
        : scoreAiNoDirectScorePacePenalty(currentPlayer, { cap: round >= 3 ? 10 : 6 });
      const reservePenalty = scoreAiResourceReservePenaltyForCost(
        currentPlayer,
        abilities.planet.DEFAULT_ORBIT_COST,
        { actionId: "orbit" },
      );
      const orbitThenLandThresholdValue = scoreAiOrbitThenLandThresholdComboValue(candidate.planetId, currentPlayer);
      const finalNoDirectOrbitPenalty = round >= FINAL_ROUND_NUMBER
        && nextThreshold
        && nextThreshold <= 50
        && currentScore < nextThreshold
        && directScoreGain <= 0
        ? 18
        : 0;
      return 10
        + (candidate.planetId === "jupiter" ? 2 : 0)
        + rewardValue * rewardWeight
        + earlyFirstOrbitBonus
        + catchupRewardValue
        + directScorePaceValue
        + thirdFinalMarkCashoutValue
        + secondFinalMarkNudgeValue
        + orbitThenLandThresholdValue
        + scoreAiPlanetMarkerEndGameValue(candidate.planetId, currentPlayer, { markerKind: "orbit" })
          * getAiStrategyWeight("final")
        + getAiMapDemand(demand.planetIds, candidate.planetId) * 0.8 * getAiStrategyWeight("route")
        + getAiMapDemand(demand.actions, "orbit") * 0.32 * getAiStrategyWeight("orbitLand")
        - scoreAiResourceBundle(abilities.planet.DEFAULT_ORBIT_COST) * 0.45
        - reservePenalty
        - finalNoDirectOrbitPenalty
        - noDirectPacePenalty;
    }

    function scoreAiOrbitThenLandThresholdComboValue(planetId, player = getCurrentPlayer()) {
      return 0;
    }

    function scoreAiLandBeforeOrbitOpportunityPenalty(planetId, landDirectScore, player = getCurrentPlayer()) {
      return 0;
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
      if ((candidate.choices || []).length && !regularBestChoice) return -Infinity;
      const fallbackRewardValue = scoreAiLandResolvedRewardValueForTarget(
        candidate.planetId,
        { type: "planet" },
        currentPlayer,
      );
      const rewardValue = Number.isFinite(Number(regularBestChoice?.score))
        ? aiNumber(regularBestChoice.score)
        : aiNumber(fallbackRewardValue);
      const directScoreGain = Number.isFinite(Number(candidate.directScoreGain))
        ? aiNumber(candidate.directScoreGain)
        : getAiBestLandDirectScoreGain(candidate.planetId, candidate.choices || [], currentPlayer);
      const rewardWeight = round <= 2 ? 0.9 : round === 3 ? 0.78 : 0.65;
      const catchupRewardValue = finalRoundLowScore
        ? aiNumber(bestChoice?.score ?? scoreAiLandResolvedRewardValueForTarget(
          candidate.planetId,
          { type: "planet" },
          currentPlayer,
        )) * 0.65
        : 0;
      const fallbackReservePenalty = regularBestChoice
        ? 0
        : scoreAiResourceReservePenaltyForCost(currentPlayer, { energy: energyCost }, { actionId: "land" });
      const fallbackYellowTracePenalty = regularBestChoice
        ? 0
        : getAiYellowTraceLandCompetitionPenalty(candidate.planetId, { type: "planet" }, currentPlayer);
      const directScorePaceValue = aiNumber(scoreAiPaceValueForDirectScore(directScoreGain, currentPlayer, {
        baseWeight: round >= 3 ? 0.62 : round === 2 ? 0.38 : 0.18,
        pressureWeight: round >= 3 ? 0.26 : 0.13,
      }));
      const thirdFinalMarkCashoutValue = aiNumber(scoreAiThirdFinalMarkCashoutValue(directScoreGain, currentPlayer, {
        weight: 0.9,
      }));
      const secondFinalMarkNudgeValue = aiNumber(scoreAiSecondFinalMarkNudgeValue(directScoreGain, currentPlayer, {
        weight: 0.5,
      }));
      const orbitOpportunityPenalty = aiNumber(scoreAiLandBeforeOrbitOpportunityPenalty(
        candidate.planetId,
        directScoreGain,
        currentPlayer,
      ));
      const pointConversionPenalty = aiNumber(scoreAiHighCostPointConversionPenalty(currentPlayer, {
        actionId: "land",
        planetId: candidate.planetId,
        target: regularBestChoice?.choice?.target || { type: "planet" },
        directScore: directScoreGain,
        energyCost,
        highScoreTarget: regularBestChoice?.choice?.target?.type === "satellite" && directScoreGain >= 20,
      }));
      const rawScore = 12
        + (candidate.planetId === "mars" || candidate.planetId === "venus" ? 1.5 : 0)
        + rewardValue * rewardWeight
        + catchupRewardValue
        + directScorePaceValue
        + thirdFinalMarkCashoutValue
        + secondFinalMarkNudgeValue
        + aiNumber(scoreAiPlanetMarkerEndGameValue(candidate.planetId, currentPlayer, { markerKind: "land" }))
          * getAiStrategyWeight("final")
        + getAiMapDemand(demand.planetIds, candidate.planetId) * 0.85 * getAiStrategyWeight("route")
        + getAiMapDemand(demand.actions, "land") * 0.38 * getAiStrategyWeight("orbitLand")
        - energyCost * getAiResourceValuesForRound(currentPlayer).energy * 0.35
        - fallbackReservePenalty
        - fallbackYellowTracePenalty
        - orbitOpportunityPenalty
        - pointConversionPenalty;
      if (Number.isFinite(Number(rawScore))) return rawScore;
      return 12
        + Math.max(0, aiNumber(directScoreGain)) * (round >= 3 ? 1.1 : 0.8)
        + Math.max(0, rewardValue) * 0.35
        + aiNumber(scoreAiThresholdPressureForScoreGain(directScoreGain, currentPlayer)) * 0.35
        - energyCost * getAiResourceValuesForRound(currentPlayer).energy * 0.25;
    }

    function scoreAiAnalyzeAction(player = getCurrentPlayer()) {
      const check = canAiAnalyzeData(player);
      if (!check?.ok) return 0;
      const placedCount = Math.max(0, (data.listComputerPlacedTokens?.(player) || []).length);
      const dataRoom = getAiAvailableDataRoom(player);
      const demand = getAiStrategyDemand(player);
      const blueTraceDemand = getAiMapDemand(demand.traceTypes, "blue");
      const lateRoundPressure = Math.max(0, turnState.roundNumber - 1) * 1.5;
      const requiredSlot = data.ANALYZE_REQUIRED_COMPUTER_SLOT || 6;
      const fullComputerBonus = placedCount >= requiredSlot ? 8 : 0;
      const finalMarks = countAiFinalMarksForPlayer(player);
      const currentScore = Math.max(0, aiNumber(player?.resources?.score));
      const firstThresholdCatchupBonus = Math.max(1, Math.round(aiNumber(turnState.roundNumber) || 1)) >= FINAL_ROUND_NUMBER
        && currentScore < 25
        ? 8
        : 0;
      const nextThreshold = getAiNextMissingFinalScoreThreshold(player);
      const scoreToNextThreshold = nextThreshold ? Math.max(0, nextThreshold - currentScore) : 0;
      const bestBlueTraceScore = Math.max(0, aiNumber(getAiBestRevealedAlienTraceDirectScore(player, "blue")));
      const availableData = Math.max(0, aiNumber(player?.resources?.availableData));
      const thresholdCashoutPressure = nextThreshold && currentScore < nextThreshold
        ? Math.min(
          7,
          Math.max(0, 12 - scoreToNextThreshold) * 0.42
            + Math.min(4, bestBlueTraceScore * 0.5)
            + (currentScore + bestBlueTraceScore >= nextThreshold ? 3 : 0),
        )
        : 0;
      const readyAnalyzeWindowValue = placedCount >= requiredSlot
        ? Math.min(
          16,
          4.5
            + Math.min(4, availableData * 0.45)
            + Math.min(5, bestBlueTraceScore * 0.5)
            + thresholdCashoutPressure
            + Math.min(4, getAiLiveScorePaceDeficit(player) * 0.08)
            + (finalMarks < 3 ? 2.2 : 0),
        )
        : 0;
      const postSecondFinalMarkPenalty = finalMarks >= 2 && dataRoom <= 1 && blueTraceDemand < 1
        ? 5
        : 0;
      const rawScore = 7
        + placedCount * 1.15
        + fullComputerBonus * 0.8
        + Math.min(4, dataRoom * 0.55)
        + blueTraceDemand * 1.05 * getAiStrategyWeight("task")
        + getAiMapDemand(demand.actions, "analyze") * 0.2 * getAiStrategyWeight("engine")
        + lateRoundPressure
        + firstThresholdCatchupBonus
        + readyAnalyzeWindowValue
        - getAiAnalyzeEnergyCost(player) * getAiResourceValuesForRound(player).energy * 0.35
        - postSecondFinalMarkPenalty;
      const weightedScore = applyAiStrategyWeight(
        rawScore,
        "task",
        0.5,
      );
      const hasBlueTraceFinalFormula = getAiMarkedFinalFormulaEntries(player)
        .some((entry) => entry.formulaId === "b1");
      if (
        Math.max(1, Math.round(aiNumber(turnState.roundNumber) || 1)) >= FINAL_ROUND_NUMBER
        && placedCount >= requiredSlot
        && finalMarks >= 3
        && !nextThreshold
        && currentScore < 150
        && bestBlueTraceScore <= 4
        && blueTraceDemand < 1
        && !hasBlueTraceFinalFormula
      ) {
        return Math.min(
          weightedScore,
          roundAiScore(7 + bestBlueTraceScore * 2 + Math.min(2.5, availableData * 0.45)),
        );
      }
      return weightedScore;
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

      const chongPickupPlayValue = scoreAiChongPickupRouteValue(planet.planetId, player, {
        immediate: true,
      });
      if (chongPickupPlayValue > 0) {
        actionOptions.push({
          actionId: "playCard",
          planetId: planet.planetId,
          planetName: planet.name || planet.planetId,
          directScoreGain: 0,
          score: chongPickupPlayValue + getAiMapDemand(getAiStrategyDemand(player).actions, "playCard") * 0.16,
        });
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

    function scoreAiB2SectorScanFocus(nebulaId, counts, player = getCurrentPlayer()) {
      if (!nebulaId || !counts || !player || !endGameScoring?.countSectorWins || !endGameScoring?.countOrbitOrLandMarkers) {
        return 0;
      }
      const b2Entries = getAiPlanningFinalFormulaEntries(player, ["b2"]);
      if (!b2Entries.length) return 0;
      const context = createActionContext();
      const sectorWins = Math.max(0, Math.round(aiNumber(endGameScoring.countSectorWins(player, nebulaDataState))));
      const orbitLandCount = Math.max(0, Math.round(aiNumber(
        endGameScoring.countOrbitOrLandMarkers(player, planetStatsState, context),
      )));
      if (orbitLandCount <= sectorWins && !b2Entries.some((entry) => !entry.potential)) return 0;

      const b2Multiplier = Math.min(
        8,
        b2Entries.reduce((total, entry) => total + Math.max(0, aiNumber(entry.multiplier)), 0),
      );
      if (b2Multiplier <= 0) return 0;

      const ownAfterScan = counts.ownCount + 1;
      const winsAfterScan = ownAfterScan > counts.maxOtherCount;
      const closesSector = counts.openCount <= 1;
      const nearClose = counts.openCount === 2;
      const bottleneckPressure = Math.max(1, orbitLandCount - sectorWins);
      let value = 0;
      if (closesSector) {
        value += winsAfterScan ? b2Multiplier * (1.1 + bottleneckPressure * 0.18) : -b2Multiplier * 0.75;
      } else if (nearClose) {
        value += winsAfterScan ? b2Multiplier * 0.48 : b2Multiplier * 0.2;
      } else if (counts.ownCount > 0) {
        value += b2Multiplier * 0.18;
      } else if (sectorWins <= 0 && getAiRoundNumber() >= 3) {
        value += b2Multiplier * 0.12;
      }
      return applyAiStrategyWeight(value, "final", 0.75);
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
      const dataRoom = getAiAvailableDataRoom(player);
      const dataValue = gainsData
        ? (
          dataRoom > 0
            ? AI_RESOURCE_VALUES.availableData
              + scoreAiMidgameResourceContinuationValue({ availableData: 1 }, player, { scale: 0.45 })
            : -0.75
        )
        : 0;
      const demand = getAiStrategyDemand(player);
      const nebulaColor = data.getNebulaColor?.(nebulaId);
      let value = 3 + slotScore + dataValue;
      value += counts.ownCount > 0 ? Math.min(3, counts.ownCount * 0.8) : 1.4;
      value += Math.min(2.5, Math.max(0, counts.markedCount) * 0.35);
      value += getAiMapDemand(demand.scanColors, nebulaColor) * 0.75 * getAiStrategyWeight("scan");
      value += getAiMapDemand(demand.actions, "scan") * 0.12 * getAiStrategyWeight("scan");
      value += getAiMapDemand(demand.traceTypes, "pink") * 0.42 * getAiStrategyWeight("scan");
      value += getAiMapDemand(demand.traceTypes, "blue") * (gainsData ? 0.34 : 0.12) * getAiStrategyWeight("scan");
      value += scoreAiB2SectorScanFocus(nebulaId, counts, player);
      const runezuSectorSymbolValue = scoreAiRunezuSourceSymbolValue("sector", nebulaId, player);
      if (runezuSectorSymbolValue > 0) {
        const ownAfterScan = counts.ownCount + 1;
        const runezuClaimScale = counts.openCount <= 1
          ? (ownAfterScan > counts.maxOtherCount ? 1 : 0.18)
          : counts.openCount === 2
            ? (ownAfterScan > counts.maxOtherCount ? 0.45 : 0.18)
            : 0.08;
        value += runezuSectorSymbolValue * runezuClaimScale;
      }

      if (counts.openCount <= 1 && capacity > 0) {
        const ownAfterScan = counts.ownCount + 1;
        if (ownAfterScan > counts.maxOtherCount) value += 10;
        else if (ownAfterScan === counts.maxOtherCount) value -= 2;
        else value -= 8;
      } else if (counts.openCount === 2) {
        value += counts.ownCount + 1 > counts.maxOtherCount ? 3 : 1;
      }

      if (nebulaId === aomomo?.NEBULA_ID) {
        value += 2 + getAiAomomoFossilUnitValue(player) * 0.22;
        if (counts.openCount <= 1 || counts.ownCount > 0) {
          value += scoreAiAomomoFossilPlanBonus(1, player) * 0.5;
        }
      }
      if (options.pendingType === "hand_scan") value -= 0.5;
      return value;
    }

    function getAiNebulaScanChoiceDirectScore(choice) {
      const nebulaId = choice?.nebulaId || null;
      if (!nebulaId || choice?.disabled) return 0;
      const nextToken = data.getNextReplaceableNebulaToken?.(nebulaDataState, nebulaId);
      if (!nextToken) return 0;
      return Math.max(0, aiNumber(data.getNebulaSlotScoreReward?.(nebulaId, nextToken.slotIndex)));
    }

    function getBestAiNebulaChoiceEntry(choices = [], options = {}) {
      return (choices || [])
        .map((choice) => ({
          choice,
          score: scoreAiNebulaScanChoice(choice, options),
          directScoreGain: getAiNebulaScanChoiceDirectScore(choice),
        }))
        .filter((entry) => Number.isFinite(entry.score))
        .sort((left, right) => (
          right.score - left.score
          || right.directScoreGain - left.directScoreGain
        ))[0] || null;
    }

    function getBestAiNebulaChoiceScore(choices = [], options = {}) {
      return getBestAiNebulaChoiceEntry(choices, options)?.score ?? -Infinity;
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

    function getAiScanCardDirectScoreGain(card, options = {}) {
      const scanChoices = getPublicScanChoicesForCard(card);
      if (!scanChoices.ok) return 0;
      return Math.max(0, aiNumber(getBestAiNebulaChoiceEntry(scanChoices.choices || [], options)?.directScoreGain));
    }

    function getAiBestPublicScanSlots(player = getCurrentPlayer(), options = {}) {
      const maxSelectable = Math.max(1, Math.round(aiNumber(options.maxSelectable || 1)));
      return (cardState.publicCards || [])
        .map((card, slotIndex) => ({
          slotIndex,
          card,
          score: card ? scoreAiScanCard(card, { ...options, player, pendingType: "public_scan" }) : -Infinity,
          directScoreGain: card
            ? getAiScanCardDirectScoreGain(card, { ...options, player, pendingType: "public_scan" })
            : 0,
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
          directScoreGain: card
            ? getAiScanCardDirectScoreGain(card, { ...options, player, pendingType: "hand_scan", fromHand: true })
            : 0,
        }))
        .filter((entry) => entry.card && Number.isFinite(entry.score))
        .sort((left, right) => right.score - left.score || left.handIndex - right.handIndex);
      return entries[0] || null;
    }

    function getAiScanDirectScoreGain(player = getCurrentPlayer()) {
      const effects = scanEffects.buildScanEffectQueue(player, {
        fullScanAction: true,
        turnState,
        roundNumber: turnState.roundNumber,
        turnNumber: turnState.turnNumber,
      });
      const directScoreGain = effects.reduce((total, effect) => {
        if (
          effect.type === scanEffects.EFFECT_TYPES.EARTH_SECTOR_SCAN
          || effect.type === scanEffects.EFFECT_TYPES.IMPROVED_SECTOR_SCAN
          || effect.type === scanEffects.EFFECT_TYPES.MERCURY_SECTOR_SCAN
        ) {
          const entry = getBestAiNebulaChoiceEntry(
            getAiSectorScanChoicesForEffect(effect.type, player),
            { player, pendingType: "sector_scan" },
          );
          return total + Math.max(0, aiNumber(entry?.directScoreGain));
        }
        if (effect.type === scanEffects.EFFECT_TYPES.PUBLIC_CARD_SCAN) {
          return total;
        }
        if (effect.type === scanEffects.EFFECT_TYPES.HAND_SCAN) {
          return total;
        }
        return total;
      }, 0);
      return Math.min(4, Math.max(0, directScoreGain));
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

    function scoreAiLateScanResourceDrainPenalty(player = getCurrentPlayer()) {
      if (!player || getAiRoundNumber() < FINAL_ROUND_NUMBER) return 0;
      const currentScore = Math.max(0, aiNumber(player.resources?.score));
      if (currentScore < 50 || currentScore > 67 || countAiFinalMarksForPlayer(player) !== 2) return 0;
      if (getAiNextMissingFinalScoreThreshold(player) !== 70) return 0;
      const scanCost = scanEffects.getStandardScanCost(player) || {};
      const creditCost = Math.max(0, aiNumber(scanCost.credits));
      const energyCost = Math.max(0, aiNumber(scanCost.energy));
      if (creditCost <= 0 && energyCost <= 0) return 0;
      const resources = player.resources || {};
      const creditsAfter = Math.max(0, aiNumber(resources.credits) - creditCost);
      const energyAfter = Math.max(0, aiNumber(resources.energy) - energyCost);
      const drainsCredits = creditCost > 0 && creditsAfter <= 0;
      const drainsEnergy = energyCost > 0 && energyAfter <= 0;
      if (!drainsCredits && !drainsEnergy) return 0;
      const deficit = Math.max(1, 70 - currentScore);
      const penalty = Math.min(
        20,
        8
          + Math.max(0, deficit - 6) * 0.45
          + (drainsCredits ? 2 : 0)
          + (drainsEnergy ? 4 : 0),
      );
      if (currentScore >= 60 && deficit <= 10) {
        return roundAiScore(penalty * 0.45);
      }
      return penalty;
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
      const reservePenalty = scoreAiResourceReservePenaltyForCost(
        player,
        scanEffects.getStandardScanCost(player),
        { actionId: "scan" },
      );
      const lateResourceDrainPenalty = scoreAiLateScanResourceDrainPenalty(player);
      const scanCountThisRound = countAiStandardScansThisRound(player);
      const placedComputerCount = Math.max(0, (data.listComputerPlacedTokens?.(player) || []).length);
      const directScoreGain = getAiScanDirectScoreGain(player);
      const traceCount = countAiTraceMarkersForPlayer(player);
      const availableData = Math.max(0, aiNumber(player?.resources?.availableData));
      const canOpenAnalyze = placedComputerCount >= (data.ANALYZE_REQUIRED_COMPUTER_SLOT || 6) - 1;
      const repeatedScanPenalty = Math.max(0, scanCountThisRound) * (getAiRoundNumber() <= 2 ? 7 : 10);
      const earlySetupScanBonus = (
        getAiRoundNumber() <= 2
        && scanCountThisRound <= 0
        && availableData <= 0
        && placedComputerCount < (data.ANALYZE_REQUIRED_COMPUTER_SLOT || 6)
        && traceCount < 2
      )
        ? Math.min(
          5.5,
          2.6
            + (traceCount <= 0 ? 1.4 : 0.6)
            + Math.max(0, 3 - placedComputerCount) * 0.35,
        )
        : 0;
      const lowCashoutScanPenalty = directScoreGain <= 0 && !canOpenAnalyze
        ? (getAiRoundNumber() <= 2 ? 5 : 11)
        : 0;
      const adjustedLowCashoutScanPenalty = Math.max(0, lowCashoutScanPenalty - earlySetupScanBonus * 0.7);
      const netBeforePace = value + earlyEngineValue * 0.55 + tracePressure - costValue * costMultiplier;
      const deficit = getAiLiveScorePaceDeficit(player);
      const paceBonus = netBeforePace > 4 && deficit > 15
        ? Math.min(getAiRoundNumber() >= 3 ? 9 : 5, (deficit - 15) * (getAiRoundNumber() >= 3 ? 0.18 : 0.1))
        : 0;
      return applyAiStrategyWeight(
        value + earlyEngineValue * 0.55 + tracePressure + paceBonus + earlySetupScanBonus,
        "scan",
        0.85,
      )
        - costValue * costMultiplier
        - reservePenalty
        - lateResourceDrainPenalty
        - repeatedScanPenalty
        - adjustedLowCashoutScanPenalty;
    }

    function getAiPlayEffectsForCard(card) {
      if (fangzhou?.isFangzhouCard2?.(card)) {
        return [{
          id: `fangzhou-card2-advanced-${card?.id || card?.cardId || "card"}`,
          type: AI_FANGZHOU_CARD2_REWARD_EFFECT_TYPE,
          label: "方舟高级奖励",
          icon: "fangzhou",
          options: { tier: "advanced" },
        }];
      }
      if (banrenma?.isBanrenmaCard?.(card)) return banrenma.buildImmediateEffects?.(card) || [];
      if (chong?.isChongCard?.(card)) return chong.buildImmediateEffects?.(card) || [];
      if (amiba?.isAmibaCard?.(card)) return amiba.buildImmediateEffects?.(card) || [];
      if (aomomo?.isAomomoCard?.(card)) return aomomo.buildImmediateEffects?.(card) || [];
      if (runezu?.isRunezuCard?.(card)) return runezu.buildImmediateEffects?.(card) || [];
      return cardEffects.buildPlayEffects?.(card) || [];
    }

    function isAiAlienMainPlayCard(card) {
      return Boolean(
        fangzhou?.isFangzhouCard2?.(card)
        || banrenma?.isBanrenmaCard?.(card)
        || chong?.isChongCard?.(card)
        || amiba?.isAmibaCard?.(card)
        || aomomo?.isAomomoCard?.(card)
        || runezu?.isRunezuCard?.(card),
      );
    }

    function doesAiCardReserveAfterPlay(card, typeCode, model) {
      if (banrenma?.isBanrenmaCard?.(card)) return true;
      if (chong?.isChongCard?.(card)) return true;
      return [1, 2, 3].includes(typeCode) || Boolean(model?.reserveAfterPlay);
    }

    function isAiSupportedHandPlayCard(card) {
      if (!card) return false;
      return true;
    }

    function listAiChongTravelChoicesForOptions(options) {
      return (options?.choices || []).filter(Boolean);
    }

    function getAiChongLandOptions(effect) {
      const baseOptions = abilities.planet?.getLandOptions?.(createActionContext(), {
        skipCost: true,
        allowSatelliteWithoutTech: Boolean(effect?.options?.allowSatellite),
      });
      if (!baseOptions?.ok) return baseOptions || { ok: false, message: "当前不能登陆" };
      const choices = listAiChongTravelChoicesForOptions(baseOptions);
      return choices.length
        ? { ...baseOptions, choices }
        : { ok: false, message: "当前没有可登陆目标" };
    }

    function getAiChongOrbitOrLandOptions(effect) {
      const context = createActionContext();
      const choices = [];
      const orbitOptions = abilities.planet?.getOrbitOptions?.(context, { skipCost: true });
      if (orbitOptions?.ok) {
        choices.push(...listAiChongTravelChoicesForOptions(orbitOptions).map((choice) => ({
          ...choice,
          kind: "orbit",
        })));
      }
      const landOptions = abilities.planet?.getLandOptions?.(context, {
        skipCost: true,
        allowSatelliteWithoutTech: Boolean(effect?.options?.allowSatellite),
      });
      if (landOptions?.ok) {
        choices.push(...listAiChongTravelChoicesForOptions(landOptions).map((choice) => ({
          ...choice,
          kind: "land",
        })));
      }
      return choices.length
        ? { ok: true, choices }
        : { ok: false, message: "当前没有可环绕或登陆目标" };
    }

    function canAiResolveChongTravelEffect(effect, previousEffect) {
      if (!isAiChongTravelEffect(effect)) return { ok: true };
      if (
        previousEffect?.type === cardEffects.EFFECT_TYPES.CARD_MOVE
        || previousEffect?.type === cardEffects.EFFECT_TYPES.FREE_MOVE
      ) {
        return { ok: true };
      }
      const options = effect.type === chong?.EFFECT_TYPES?.CHONG_ORBIT_OR_LAND_FOR_PICKUP
        ? getAiChongOrbitOrLandOptions(effect)
        : getAiChongLandOptions(effect);
      return options?.ok
        ? { ok: true }
        : { ok: false, message: options?.message || "当前不能执行虫族取化石行动" };
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
        const previousEffect = playEffects[index - 1] || null;
        const nextEffect = playEffects[index + 1] || null;
        if (effect?.type === AI_FANGZHOU_CARD2_REWARD_EFFECT_TYPE) continue;
        if (unsupportedTypes.has(effect?.type)) {
          return { ok: false, message: `AI 暂不支持打出效果 ${effect.type}` };
        }
        if (isAiChongTravelEffect(effect)) {
          const chongCheck = canAiResolveChongTravelEffect(effect, previousEffect);
          if (!chongCheck.ok) return chongCheck;
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
          const currentPlayer = getCurrentPlayer();
          const options = canAiResolveCardLandEffect(effect, currentPlayer);
          if (!options.ok) return options;
        }
        if (effect?.type === cardEffects.EFFECT_TYPES.DISCARD_PUBLIC_CORNER_REWARDS) {
          const count = Math.max(1, Math.round(aiNumber(effect.options?.count || 1)));
          const filledPublicCount = (cardState.publicCards || []).filter(Boolean).length;
          if (filledPublicCount < count) {
            return {
              ok: false,
              message: `${effect.label || "弃公共牌并结算左上角"}：公共牌不足 ${count} 张`,
            };
          }
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
        if (effect?.type === amiba?.EFFECT_TYPES?.REMOVE_TRACE_FOR_REGION_REWARD) {
          const currentPlayer = getCurrentPlayer();
          const alienSlotId = alienGameState.amiba?.revealedSlotId;
          const options = amiba?.listPlayerTraceOptions?.(alienGameState, alienSlotId, currentPlayer) || [];
          if (!options.length) return { ok: false, message: "没有可移除的阿米巴痕迹" };
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
      if (getAiRunezuPrematureSymbolCardReason(card, playEffects, currentPlayer)) return null;
      const reservesAfterPlay = doesAiCardReserveAfterPlay(card, typeCode, model);
      const finalFormulaDeltas = getAiPlayCardFinalFormulaDeltas(card, {
        player: currentPlayer,
        model,
        typeCode,
        reservesAfterPlay,
      });
      const endGameExpectedScore = scoreAiCardEndGameExpectedValue(card, model, currentPlayer);
      const plan = scoreAiPlayCardRoutePlan(card, model, playEffects, currentPlayer);
      const directScoreGain = getAiRewardDirectScore(playEffects, currentPlayer);
      const standardActionPremium = scoreAiCardStandardActionPremium(playEffects, currentPlayer);
      const lateCardEnginePressure = scoreAiLatePlayCardEnginePressure(card, {
        player: currentPlayer,
        model,
        playEffects,
        typeCode,
        endGameExpectedScore,
        plan,
      });
      const playCardConversionPressure = scoreAiPlayCardConversionPressure(card, {
        player: currentPlayer,
        model,
        playEffects,
        typeCode,
        endGameExpectedScore,
        plan,
        standardActionPremium,
        lateCardEnginePressure,
      });
      const routePlanCashout = Boolean(
        plan?.movePreview?.followupLanding?.directScoreGain > 0
        || plan?.postLaunchMovePlan?.followupDirectScore > 0
        || plan?.actionId === "land"
        || plan?.actionId === "orbit"
      );
      const finalSecondMarkNoDirectSetupPenalty = scoreAiFinalSecondMarkNoDirectSetupPenalty(currentPlayer, {
        actionId: "playCard",
        directScoreGain,
        setupScore: Math.max(0, aiNumber(plan?.score), standardActionPremium),
        consumesHand: true,
        cost,
        noCashoutRoute: !routePlanCashout,
        playCardConversionPressure,
      });
      const finalRoundResourceDrainPenalty = scoreAiFinalRoundPlayCardResourceDrainPenalty(card, {
        player: currentPlayer,
        model,
        cost,
        directScoreGain,
        routePlanCashout,
      });
      const c2Type3ProgressValue = typeCode === 3 ? scoreAiC2Type3ProgressValue(currentPlayer) : 0;
      const cFinalTaskProgressValue = model?.tasks?.length
        ? scoreAiCFinalTaskProgressValue(currentPlayer, model.tasks.length)
        : 0;
      const chongTaskChainValue = scoreAiChongCardTaskChainValue(card, currentPlayer);
      const banrenmaThresholdSetupValue = scoreAiBanrenmaCardThresholdSetupValue(card, currentPlayer);
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
        directScoreGain,
        playCardConversionPressure,
        finalSecondMarkNoDirectSetupPenalty,
        finalRoundResourceDrainPenalty,
        chongTaskChainValue,
        banrenmaThresholdSetupValue,
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
        finalFormulaDeltas,
        directScoreGain,
        score,
        valueBreakdown: {
          costValue: scoreAiResourceBundle(cost),
          cornerOpportunity: scoreAiCardCornerOpportunity(card),
          directScoreGain,
          effectValue: playEffects.reduce((total, effect) => total + scoreAiEffectValue(effect), 0),
          c2Type3ProgressValue,
          cFinalTaskProgressValue,
          chongTaskChainValue,
          banrenmaThresholdSetupValue,
          playCardConversionPressure,
          lateCardEnginePressure,
          endGameExpectedScore,
          finalRoundEndGameCardUrgency: scoreAiFinalRoundEndGameCardUrgency(
            typeCode,
            model,
            currentPlayer,
            endGameExpectedScore,
            c2Type3ProgressValue,
          ),
          planScore: plan?.score || 0,
          standardActionPremium,
          finalSecondMarkNoDirectSetupPenalty,
          finalRoundResourceDrainPenalty,
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
        ? ai.valuation.getCardValue(card, { defaultCardValue: 3, alienCardValue: 5.5 })
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
        const bestMove = listAiEffectMoveCandidates({
          id: "cardCornerMovePreview",
          free: true,
          poolRemaining: moveReward.movementPoints || 1,
        }).sort((left, right) => Number(right.score || 0) - Number(left.score || 0))[0] || null;
        if (!bestMove) return { value: -Infinity, resourceReward, moveReward, bestMove: null };
        const bestMoveScore = aiNumber(bestMove.score);
        if (bestMoveScore < 0) return { value: -Infinity, resourceReward, moveReward, bestMove };
        value += Math.max(0, Math.round(aiNumber(moveReward.movementPoints || 1))) * AI_RESOURCE_VALUES.movement;
        value += bestMoveScore * 0.45;
        return { value, resourceReward, moveReward, bestMove };
      }
      const incomeGain = cards.getIncomeGainForCard?.(card);
      if (incomeGain) value -= Math.max(0, scoreAiIncomeOpportunityValue(player, incomeGain)) * 0.2;
      return { value, resourceReward, moveReward, bestMove: null };
    }

    function scoreAiFinalFormulaDeltaValue(deltas = {}, player = getCurrentPlayer(), options = {}) {
      if (!deltas || !player) return 0;
      const formulaIds = Object.keys(deltas).filter((formulaId) => aiNumber(deltas[formulaId]) !== 0);
      const entries = options.includePotential
        ? getAiPlanningFinalFormulaEntries(player, formulaIds)
        : getAiMarkedFinalFormulaEntries(player)
          .filter((entry) => !formulaIds.length || formulaIds.includes(entry.formulaId));
      const potentialScale = Math.max(0, aiNumber(options.potentialScale ?? 0.55));
      return entries.reduce((total, entry) => {
        const delta = aiNumber(deltas[entry.formulaId]);
        if (!delta) return total;
        const entryScale = entry.potential ? potentialScale : 1;
        return total + delta * Math.max(1, aiNumber(entry.multiplier)) * entryScale;
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
      const model = cardEffects.getCardModel?.(card) || null;
      const typeCode = getCardTypeCode(card);
      let handPressure = Math.max(0, handSize - 5) * 1.45 + Math.max(0, unplayableCount - 5) * 1.8;
      if (model?.tasks?.length || model?.endGameScoring || typeCode === 3) handPressure *= 0.45;
      else if (playCandidate) handPressure *= 0.75;
      const discardCost = getAiDiscardedCardOpportunityCost(card, playCandidate);
      const preservePenalty = scoreAiD2ResearchTechPreserveValue(card, playCandidate, currentPlayer);
      const playablePenalty = playCandidate ? Math.min(4, Math.max(0, playCandidate.score) * 0.18) : 0;
      const c2Type3ProgressValue = typeCode === 3 ? scoreAiC2Type3ProgressValue(currentPlayer) : 0;
      const cFinalTaskProgressValue = model?.tasks?.length
        ? scoreAiCFinalTaskProgressValue(currentPlayer, model.tasks.length)
        : 0;
      const endGameExpectedScore = playCandidate?.valueBreakdown?.endGameExpectedScore
        ?? scoreAiCardEndGameExpectedValue(card, model, currentPlayer);
      const alienCard = isAiAlienMainPlayCard(card);
      const moveFollowupMainAction = reward.bestMove?.to
        ? scoreAiFollowupMainActionAfterMove(reward.bestMove.to, currentPlayer, {
          ignoreMainActionUsed: !canStartMainAction(),
        })
        : null;
      const moveFollowupScore = Math.max(0, aiNumber(moveFollowupMainAction?.score));
      const moveFollowupDirectScore = Math.max(
        0,
        aiNumber(moveFollowupMainAction?.directScoreGain),
        aiNumber(reward.bestMove?.valueBreakdown?.landingDirectScoreGain),
      );
      const moveHasCashout = !reward.moveReward || moveFollowupScore > 0 || moveFollowupDirectScore > 0;
      const taskPreserveCashoutMultiplier = reward.moveReward && moveHasCashout
        ? moveFollowupDirectScore > 0 ? 0.25 : 0.45
        : 1;
      const finalCardPreservePenalty = (
        getAiRoundNumber() >= 3
        && (typeCode === 3 || model?.endGameScoring)
      )
        ? Math.min(
          14,
          2
            + Math.max(0, aiNumber(c2Type3ProgressValue)) * 0.55
            + Math.max(0, aiNumber(endGameExpectedScore)) * 0.45
            + Math.max(0, aiNumber(playCandidate?.score)) * 0.12,
        )
        : 0;
      const taskCardPreservePenalty = model?.tasks?.length
        ? Math.max(
          scoreAiUnplayedTaskCardPreserveValue(card, model, playCandidate, currentPlayer)
            * taskPreserveCashoutMultiplier,
          getAiRoundNumber() >= 2
            ? Math.min(
              14,
              3
                + Math.max(0, aiNumber(cFinalTaskProgressValue)) * 0.75
                + Math.max(0, aiNumber(playCandidate?.score)) * 0.12,
            )
            : 0,
        )
        : 0;
      const alienCardPreservePenalty = alienCard && getAiRoundNumber() >= 2
        ? Math.min(12, 4 + Math.max(0, aiNumber(playCandidate?.score)) * 0.18)
        : 0;
      const valuableDiscardedCard = Boolean(model?.tasks?.length || typeCode === 3 || model?.endGameScoring || alienCard);
      const noCashoutMovePenalty = reward.moveReward && !moveHasCashout
        ? Math.min(
          22,
          (getAiRoundNumber() >= 3 ? 8 : 5)
            + (valuableDiscardedCard ? (getAiRoundNumber() >= 2 ? 10 : 5) : 0)
            + Math.max(0, aiNumber(discardCost) - 3) * 0.45,
        )
        : 0;
      const lowValueBias = Math.max(0, 4.5 - discardCost) * 0.65;
      const scorePaceBonus = directScoreGain > 0
        ? scoreAiThresholdPressureForScoreGain(directScoreGain, currentPlayer) * 0.8
        : 0;
      const followupMainAction = scoreAiCardCornerFollowupMainUnlock(reward, currentPlayer);
      const followupMainActionScore = Math.max(0, aiNumber(followupMainAction?.score));
      const finalSecondMarkNoDirectSetupPenalty = scoreAiFinalSecondMarkNoDirectSetupPenalty(currentPlayer, {
        actionId: "cardCorner",
        directScoreGain,
        followupDirectScore: followupMainAction?.directScoreGain,
        setupScore: reward.value + followupMainActionScore,
        consumesHand: true,
        consumesLastHand: handSize <= 1,
        noCashoutRoute: followupMainActionScore <= 0,
      });
      const score = reward.value
        - discardCost
        - preservePenalty
        - playablePenalty
        - finalCardPreservePenalty
        - taskCardPreservePenalty
        - alienCardPreservePenalty
        - noCashoutMovePenalty
        - finalSecondMarkNoDirectSetupPenalty
        + handPressure
        + lowValueBias
        + scorePaceBonus
        + followupMainActionScore;
      if (
        getAiRoundNumber() >= FINAL_ROUND_NUMBER
        && getAiNextMissingFinalScoreThreshold(currentPlayer)
        && directScoreGain <= 0
        && followupMainActionScore <= 0
        && score < 2.5
      ) {
        return null;
      }
      if (handPressure <= 0 && score < 2.5) return null;
      if (reward.moveReward && !moveHasCashout && valuableDiscardedCard && score < 8) return null;
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
        moveFollowupMainAction,
        directScoreGain,
        gain: reward.value + scorePaceBonus + followupMainActionScore,
        cost: discardCost
          + preservePenalty
          + playablePenalty
          + finalCardPreservePenalty
          + taskCardPreservePenalty
          + alienCardPreservePenalty
          + noCashoutMovePenalty
          + finalSecondMarkNoDirectSetupPenalty,
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
          finalCardPreservePenalty,
          taskCardPreservePenalty,
          alienCardPreservePenalty,
          noCashoutMovePenalty,
          moveFollowupScore,
          moveFollowupDirectScore,
          moveHasCashout,
          handPressure,
          lowValueBias,
          scorePaceBonus,
          followupMainActionScore,
          finalSecondMarkNoDirectSetupPenalty,
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
      if (isAiChongFossilToken(rocket)) {
        const movePayment = estimateAiMovePayment(currentPlayer, requiredMovePoints);
        return buildAiChongTransportMoveCandidate({
          id: "move",
          kind: "quick",
          rocket,
          direction,
          index,
          player: currentPlayer,
          from,
          to,
          requiredMovePoints,
          paymentCost: movePayment.cost,
        });
      }
      const routeScore = scoreAiMoveTowardTargets(from, to, currentPlayer, { rocket });
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
      if (!arrivedAtPlanetTarget && routeScoreForGain > 0) {
        routeScoreForGain *= getAiRoundNumber() <= 2 ? 0.82 : getAiRoundNumber() === 3 ? 0.58 : 0.46;
      }
      const routeScoreCap = getAiUrgentUncashableRouteScoreCap(routeScore.target, canCashOutRoute, currentPlayer);
      if (routeScoreCap != null) routeScoreForGain = Math.min(routeScoreForGain, routeScoreCap);
      const insufficientCashoutAdjustment = getAiFinalInsufficientCashoutRouteAdjustment(
        routeScore.target,
        followupMainAction,
        currentPlayer,
      );
      if (insufficientCashoutAdjustment) {
        routeScoreForGain = Math.min(routeScoreForGain, insufficientCashoutAdjustment.routeScoreCap);
      }
      const followupScoreScale = insufficientCashoutAdjustment?.followupScoreScale ?? 1;
      const nextTurnFollowupScale = getAiRoundNumber() <= 2 ? 0.24 : 0.16;
      const followupGain = (
        followupMainAction.timing === "next_turn"
          ? Math.max(0, aiNumber(followupMainAction.score)) * nextTurnFollowupScale
          : Math.max(0, aiNumber(followupMainAction.score))
      ) * followupScoreScale;
      const baseFinalUncashableMovePenalty = scoreAiFinalUncashableMoveEnergyPenalty({
        player: currentPlayer,
        routeTarget: routeScore.target,
        followupScore: followupMainAction.score,
        energySpent: movePayment.energySpent,
        energyAfterMovePayment: movePayment.remainingEnergy,
      });
      const currentScore = Math.max(0, aiNumber(currentPlayer?.resources?.score));
      const followupDirectScore = Math.max(0, aiNumber(followupMainAction?.directScoreGain));
      const finalLowScoreDirectLandProgressMove = (
        getAiRoundNumber() >= FINAL_ROUND_NUMBER
        && currentScore < 38
        && followupDirectScore >= 7
        && String(followupMainAction?.actionId || "") === "land"
        && String(followupMainAction?.timing || "") === "immediate"
      );
      const finalSecondMarkUncashableMovePenalty = (
        getAiRoundNumber() >= FINAL_ROUND_NUMBER
        && currentScore < 50
        && countAiFinalMarksForPlayer(currentPlayer) <= 1
        && getAiNextMissingFinalScoreThreshold(currentPlayer) === 50
        && currentScore + followupDirectScore < 50
        && !finalLowScoreDirectLandProgressMove
      )
        ? Math.min(
          18,
          (currentScore >= 45 ? 11 : 8)
            + Math.max(0, 50 - currentScore) * 0.25
            + Math.max(0, routeScoreForGain) * 0.15,
        )
        : 0;
      const scanCostForMoveGuard = scanEffects.getStandardScanCost(currentPlayer) || {};
      const finalMoveBlocksCurrentScanPenalty = (
        getAiRoundNumber() >= FINAL_ROUND_NUMBER
        && Math.max(0, aiNumber(followupMainAction.score)) <= 0
        && currentScore >= 58
        && currentScore < 70
        && Math.max(0, aiNumber(movePayment.energySpent)) > 0
        && Math.max(0, aiNumber(currentPlayer?.resources?.credits)) >= Math.max(0, aiNumber(scanCostForMoveGuard.credits))
        && Math.max(0, aiNumber(currentPlayer?.resources?.energy)) >= Math.max(0, aiNumber(scanCostForMoveGuard.energy))
        && Math.max(0, aiNumber(movePayment.remainingEnergy)) < Math.max(0, aiNumber(scanCostForMoveGuard.energy))
      )
        ? 58
        : 0;
      const finalUncashableMovePenalty = baseFinalUncashableMovePenalty
        + finalMoveBlocksCurrentScanPenalty
        + finalSecondMarkUncashableMovePenalty;
      const movementGain = applyAiStrategyWeight(applyAiStrategyWeight(routeScoreForGain, "route", 0.7), "move", 0.8)
        + applyAiStrategyWeight(followupGain, "orbitLand", 0.5)
        + scoreAiMoveArrivalRewardValue(to, currentPlayer, {
          free: movePayment.energySpent <= 0 && movePayment.cardSpent <= 0,
        })
        + direction.score * 0.08;
      const paymentCost = movePayment.cost;
      const nearestActionablePlanetPenalty = scoreAiNearestActionablePlanetTimingPenalty({
        player: currentPlayer,
        from,
        to,
        direction,
        routeScore,
        followupScore: followupMainAction.score,
        energySpent: movePayment.energySpent,
        energyAfterMovePayment: movePayment.remainingEnergy,
      });
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
        nearestActionablePlanetPenalty,
      });
      const earlyLandingTraceBlockedPenalty = scoreAiEarlyMoveBlocksLandingTracePenalty({
        player: currentPlayer,
        to,
        routeScore,
        routeTarget: routeScore.target,
        followupMainAction,
        energySpent: movePayment.energySpent,
        energyAfterMovePayment: movePayment.remainingEnergy,
      });
      const earlyOrbitOnlyTraceDelayPenalty = scoreAiEarlyOrbitOnlyTraceDelayPenalty({
        player: currentPlayer,
        to,
        routeScore,
        routeTarget: routeScore.target,
        followupMainAction,
      });
      const movementCost = paymentCost
        + pathPenalty
        + finalUncashableMovePenalty
        + earlyLandingTraceBlockedPenalty
        + earlyOrbitOnlyTraceDelayPenalty;
      const moveScore = movementGain - movementCost - index * 0.1;
      const paidMoveResourceSpent = Math.max(0, aiNumber(movePayment.energySpent))
        + Math.max(0, aiNumber(movePayment.cardSpent));
      const paidNoCashoutMove = Math.max(0, aiNumber(followupMainAction.score)) <= 0
        && paidMoveResourceSpent > 0
        && moveScore < 0
        && !arrivedAtPlanetTarget;
      if (paidNoCashoutMove) return null;
      if (finalUncashableMovePenalty > 0 && moveScore < 0) return null;
      if (earlyLandingTraceBlockedPenalty > 0 && moveScore < 4) return null;
      if (earlyOrbitOnlyTraceDelayPenalty > 0 && moveScore < 8) return null;
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
        score: moveScore,
        valueBreakdown: {
          movementGain,
          paymentCost,
          pathPenalty,
          nearestActionablePlanetPenalty,
          movementCost,
          routeScore: routeScore.score,
          routeScoreForGain,
          routeScoreCap,
          insufficientCashoutAdjustment,
          followupScore: followupMainAction.score,
          followupScoreScale,
          followupTiming: followupMainAction.timing || null,
          requiredMovePoints,
          moveEnergySpent: movePayment.energySpent,
          moveCardSpent: movePayment.cardSpent,
          energyAfterMovePayment: movePayment.remainingEnergy,
          preserveEnergyForRouteCashout,
          finalUncashableMovePenalty,
          baseFinalUncashableMovePenalty,
          finalMoveBlocksCurrentScanPenalty,
          finalSecondMarkUncashableMovePenalty,
          finalLowScoreDirectLandProgressMove,
          earlyLandingTraceBlockedPenalty,
          earlyOrbitOnlyTraceDelayPenalty,
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
        if (bestMoveScore < 0) return -Infinity;
        return scoreAiResourceBundle(resolvedReward.gain || {})
          + Math.max(0.5, aiNumber(resolvedReward.movementPoints || 1) * 0.85)
          + bestMoveScore * 0.75;
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
      const best = listAiBorrowTechCandidates(player)[0] || null;
      const bestScore = Math.max(0, aiNumber(best?.score));
      return bestScore >= 5 ? bestScore : -Infinity;
    }

    function listAiIndustryHuanyuMoveCandidates() {
      return listAiEffectMoveCandidates({
        id: "industryMove",
        free: true,
        poolRemaining: 1,
        industryHuanyuMove: true,
      })
        .filter((candidate) => !(state.industryFreeMoveState?.movedRocketIds || []).includes(candidate.rocketId));
    }

    function scoreAiIndustryHuanyuMoves() {
      const candidates = listAiIndustryHuanyuMoveCandidates()
        .sort((left, right) => Number(right.score || 0) - Number(left.score || 0));
      const positiveCandidates = candidates.filter((candidate) => aiNumber(candidate.score) > 0);
      if (!positiveCandidates.length) return -Infinity;
      const firstMove = positiveCandidates[0] || null;
      const secondMove = firstMove
        ? positiveCandidates.find((candidate) => String(candidate.rocketId) !== String(firstMove.rocketId)) || null
        : null;
      const plannedMoves = [firstMove, secondMove].filter(Boolean);
      const ownsOrange2 = players.playerOwnsTech(getCurrentPlayer(), "orange2", createActionContext());
      const asteroidStops = plannedMoves.filter((candidate) => (
        candidate
        && isAiAsteroidCoordinate(candidate.to)
        && Math.max(0, aiNumber(candidate.valueBreakdown?.landingDirectScoreGain)) <= 0
      )).length;
      const asteroidStrandingPenalty = ownsOrange2
        ? 0
        : asteroidStops >= 2 ? 24 : asteroidStops === 1 ? 8 : 0;
      return 3
        + Math.max(0, Number(firstMove?.score || 0))
        + Math.max(0, Number(secondMove?.score || 0)) * 0.45
        - asteroidStrandingPenalty;
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
        score = scoreAiIndustryHuanyuMoves();
      } else if (abilityId === "mission_publicity_pick_income") {
        score = players.canAfford(player, { publicity: industry.PUBLICITY_PICK_COST || 2 })
          ? scoreAiIndustryPublicPick(player, "industry_mission_pick") - 3
          : -Infinity;
      } else if (abilityId === "fenwick_publicity_pick_corner") {
        score = players.canAfford(player, { publicity: industry.FENWICK_PUBLICITY_PICK_COST || 1 })
          ? scoreAiIndustryPublicPick(player, "industry_fenwick_pick") - 3
          : -Infinity;
      } else if (abilityId === "deepspace_swap_cards") {
        score = scoreAiIndustryDeepspaceSwap(player);
      } else if (abilityId === "strategy_pick_card") {
        score = scoreAiIndustryPublicPick(player, "industry_strategy_pick");
      }
      const finalSecondMarkNoDirectSetupPenalty = scoreAiFinalSecondMarkNoDirectSetupPenalty(player, {
        actionId: "industry",
        directScoreGain: 0,
        setupScore: Math.max(0, aiNumber(score)),
        consumesHand: abilityId === "deepspace_swap_cards",
        consumesLastHand: abilityId === "deepspace_swap_cards"
          && Math.max(0, aiNumber(player.resources?.handSize ?? (player.hand || []).length)) <= 1,
        noCashoutRoute: true,
      });
      score -= finalSecondMarkNoDirectSetupPenalty;
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
          finalSecondMarkNoDirectSetupPenalty,
        },
      };
    }

    function scoreAiSecondMarkAnalyzeReloadDataValue(player = getCurrentPlayer(), placementSlot = 0) {
      if (!player || getAiRoundNumber() < FINAL_ROUND_NUMBER) return 0;
      const currentScore = Math.max(0, aiNumber(player.resources?.score));
      if (currentScore < 45 || currentScore >= 50 || countAiFinalMarksForPlayer(player) !== 1) return 0;
      if (aiNumber(player.resources?.energy) < getAiAnalyzeEnergyCost(player)) return 0;
      const requiredSlot = data.ANALYZE_REQUIRED_COMPUTER_SLOT || 6;
      const placedCount = Math.max(0, (data.listComputerPlacedTokens?.(player) || []).length);
      const availableData = Math.max(0, Math.round(aiNumber(player.resources?.availableData)));
      if (placedCount >= requiredSlot || placedCount + availableData < requiredSlot) return 0;
      const bestBlueTraceScore = getAiBestRevealedAlienTraceDirectScore(player, "blue");
      if (currentScore + bestBlueTraceScore < 50) return 0;
      const slot = Math.max(1, Math.round(aiNumber(placementSlot)));
      const remainingPlacements = Math.max(1, requiredSlot - placedCount);
      return Math.min(24, 13 + Math.max(0, 7 - remainingPlacements) * 1.2 + Math.min(4, slot * 0.25));
    }

    function scoreAiDataPlacementChoice(choice, player = getCurrentPlayer()) {
      if (!choice) return -Infinity;
      const target = choice.target || null;
      const placementSlot = Math.max(0, Math.round(aiNumber(choice.placementSlot)));
      if (target === data.PLACEMENT_KIND_COMPUTER) {
        const analyzeReadyBonus = placementSlot >= (data.ANALYZE_REQUIRED_COMPUTER_SLOT || 6) ? 9 : 0;
        const bonusValue = scoreAiDataPlacementBonusValue(choice, player);
        const engineProgressValue = scoreAiDataEngineProgressValue(placementSlot, player);
        const secondMarkAnalyzeReloadValue = scoreAiSecondMarkAnalyzeReloadDataValue(player, placementSlot);
        const finalIncomeRiskPenalty = scoreAiFinalThresholdIncomePlacementPenalty(choice, player);
        return applyAiStrategyWeight(
          7
            + placementSlot * 0.8
            + bonusValue * 0.85
            + engineProgressValue
            + analyzeReadyBonus
            + secondMarkAnalyzeReloadValue
            + getAiMapDemand(getAiStrategyDemand(player).actions, "analyze") * 0.08,
          "task",
          0.35,
        ) - finalIncomeRiskPenalty;
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
          directScoreGain: getAiDataPlacementDirectScoreGain(choice, player),
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

    function getAiPendingDecisionPlayer(pending = null) {
      return getPendingOwnerPlayer(pending, pending?.effect || getCurrentActionEffect?.() || null);
    }

    function queryAiButtons(selector) {
      return [...(els.scanTargetActions?.querySelectorAll(selector) || [])]
        .filter((button) => button && !button.disabled);
    }

    function chooseFirstAiButton(selector) {
      return queryAiButtons(selector)[0] || null;
    }

    function scoreAiHandCornerChoice(choice, counts = {}) {
      if (choice === "move") return aiNumber(counts.move) * AI_RESOURCE_VALUES.movement;
      if (choice === "data") return aiNumber(counts.data) * AI_RESOURCE_VALUES.availableData;
      if (choice === "publicity") return aiNumber(counts.publicity) * AI_RESOURCE_VALUES.publicity;
      return -Infinity;
    }

    function chooseAiHandCornerChoice(pending) {
      return queryAiButtons("[data-hand-corner-choice]")
        .map((button, index) => ({
          button,
          choice: button.dataset.handCornerChoice,
          index,
          score: scoreAiHandCornerChoice(button.dataset.handCornerChoice, pending?.counts || {}),
        }))
        .filter((entry) => Number.isFinite(entry.score))
        .sort((left, right) => right.score - left.score || left.index - right.index)[0] || null;
    }

    function getAiIncomeGainValue(card) {
      const gain = cards.getIncomeGainForCard?.(card) || null;
      if (!gain) return 0;
      return scoreAiResourceBundle(gain);
    }

    function chooseAiDiscardAnyIncomeCards(pending, player) {
      const pendingChoices = new Set((pending?.choices || []).map((card) => card?.id).filter(Boolean));
      const hand = (player?.hand || []).filter((card) => !pendingChoices.size || pendingChoices.has(card.id));
      return hand
        .map((card, index) => ({
          card,
          index,
          score: getAiIncomeGainValue(card) - Math.max(0, scoreAiCardCornerOpportunity(card)) * 0.15,
        }))
        .filter((entry) => entry.card?.id && entry.score > 0)
        .sort((left, right) => right.score - left.score || left.index - right.index)
        .map((entry) => entry.card);
    }

    function scoreAiPayCreditReward(effect, player) {
      const reward = effect?.options?.reward || null;
      if (!reward) return 0;
      if (reward.type === "gain_resources") {
        return scoreAiResourceBundle(reward.options?.gain || {});
      }
      return 0;
    }

    function chooseAiDiscardCornerRepeatCard(pending, player) {
      return (pending?.choices || player?.hand || [])
        .map((card, index) => ({
          card,
          index,
          score: scoreAiCardCornerOpportunity(card) - Math.max(0, getCardPrice(card)) * 0.1,
        }))
        .filter((entry) => entry.card?.id && Number.isFinite(entry.score))
        .sort((left, right) => right.score - left.score || left.index - right.index)[0]?.card || null;
    }

    function chooseAiProbeSectorScanChoices(pending) {
      const maxTargets = Math.max(1, Math.round(aiNumber(pending?.effect?.options?.maxTargets || 1)));
      return (pending?.choices || [])
        .map((choice, index) => {
          const sectorX = choice?.sector?.x;
          const scanScore = sectorX == null
            ? 0
            : getBestAiNebulaChoiceScore(buildSectorScanChoicesForX(sectorX), {
              player: getAiPendingDecisionPlayer(pending),
              pendingType: "probe_sector_scan",
              gainData: pending?.effect?.options?.gainData,
            });
          return {
            choice,
            index,
            score: Number.isFinite(scanScore) ? scanScore : 0,
          };
        })
        .filter((entry) => entry.choice?.rocket?.id != null)
        .sort((left, right) => right.score - left.score || left.index - right.index)
        .slice(0, maxTargets)
        .map((entry) => entry.choice);
    }

    function chooseAiProbeLocationRewardButton() {
      return queryAiButtons("[data-probe-location-reward-rocket-id]")
        .map((button, index) => {
          const dataMatch = String(button.textContent || "").match(/(\d+)\s*数据/);
          return {
            button,
            index,
            score: dataMatch ? Number(dataMatch[1]) * AI_RESOURCE_VALUES.availableData : 0,
          };
        })
        .sort((left, right) => right.score - left.score || left.index - right.index)[0]?.button || null;
    }

    function runAiDataPlacementDecision() {
      if (!els.dataPlaceOverlay || els.dataPlaceOverlay.hidden) return null;
      const pending = state.pendingDataPlaceAction || null;
      const player = getAiPendingDecisionPlayer(pending);
      if (!isAiAutoBattlePlayer(player?.id)) {
        return { ok: false, blocked: true, message: `${player?.colorLabel || "当前玩家"}需要人工选择数据放置` };
      }
      const selected = chooseAiDataPlacementOptionFromButtons(
        els.dataPlaceActions?.querySelectorAll("[data-place-target]") || [],
        player,
      );
      if (!selected) {
        return { ok: false, blocked: true, message: "AI 没有可用数据放置目标" };
      }
      recordAiAutoBattleLog("data-placement", `${player.colorLabel}AI 放置数据`, {
        logPlayerId: player.id,
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
      const currentPlayer = getPendingOwnerPlayer(state.pendingMovePayment);
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
      const effect = getCurrentActionEffect?.() || state.pendingMovePayment.cardMoveEffectContext?.effect || null;
      const nextEffect = getAiNextActionEffect();
      const to = from
        ? {
          x: solar.mod8(from.x + aiNumber(state.pendingMovePayment.deltaX)),
          y: Math.min(
            rocketActions.SECTOR_RING_MAX,
            Math.max(rocketActions.SECTOR_RING_MIN, aiNumber(from.y) + aiNumber(state.pendingMovePayment.deltaY)),
          ),
        }
        : null;
      const routeScore = scoreAiMoveTowardTargets(from, to, currentPlayer, {
        rocket,
        effect,
        nextEffect,
      });
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
      const result = confirmMovePayment({ automated: true });
      if (result?.ok) incrementAiMoveCountThisTurn(currentPlayer.id);
      return result || { ok: false, blocked: true, message: "AI 移动支付未产生结果" };
    }

    function runAiLandTargetDecision() {
      if (!els.landTargetOverlay || els.landTargetOverlay.hidden) return null;
      const pending = state.pendingLandTargetAction || null;
      const player = getAiPendingDecisionPlayer(pending);
      if (!isAiAutoBattlePlayer(player?.id)) {
        return { ok: false, blocked: true, message: `${player?.colorLabel || "当前玩家"}需要人工选择登陆目标` };
      }
      const optionCount = els.landTargetSelect?.options?.length || 0;
      if (optionCount <= 0) {
        return { ok: false, blocked: true, message: "AI 没有可选登陆目标" };
      }
      const options = typeof pending?.getOptions === "function"
        ? pending.getOptions()
        : abilities.planet.getLandOptions(createActionContext());
      const selected = options?.ok
        ? chooseAiLandChoice(options.choices || [], player)
        : null;
      const selectedIndex = Math.min(
        optionCount - 1,
        Math.max(0, selected?.index ?? 0),
      );
      els.landTargetSelect.value = String(selectedIndex);
      recordAiAutoBattleLog("land-target", `${player.colorLabel}AI 选择登陆目标 ${selectedIndex + 1}`, {
        logPlayerId: player.id,
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

    function runAiProbeSectorScanDecision() {
      const pending = state.pendingProbeSectorScanAction || null;
      if (!pending) return null;
      const player = getAiPendingDecisionPlayer(pending);
      if (!isAiAutoBattlePlayer(player?.id)) {
        return { ok: false, blocked: true, message: `${player?.colorLabel || "当前玩家"}需要人工选择探测器扇区扫描` };
      }
      const selectedChoices = chooseAiProbeSectorScanChoices(pending);
      if (!selectedChoices.length) {
        return { ok: false, blocked: true, message: "AI 没有可选探测器扇区扫描目标" };
      }
      const maxTargets = Math.max(1, Math.round(aiNumber(pending.effect?.options?.maxTargets || 1)));
      recordAiAutoBattleLog("probe-sector-scan", `${player.colorLabel}AI 选择探测器扇区扫描`, {
        logPlayerId: player.id,
        selectedRocketIds: selectedChoices.map((choice) => choice.rocket?.id),
        maxTargets,
      });
      let result = null;
      for (const choice of selectedChoices) {
        result = handleProbeSectorScanChoice(choice.rocket.id);
        if (maxTargets === 1) return result;
        if (result?.ok === false) return result;
      }
      return confirmProbeSectorScanSelection();
    }

    function runAiProbeLocationRewardDecision() {
      const pending = state.pendingProbeLocationRewardAction || null;
      if (!pending) return null;
      const player = getAiPendingDecisionPlayer(pending);
      if (!isAiAutoBattlePlayer(player?.id)) {
        return { ok: false, blocked: true, message: `${player?.colorLabel || "当前玩家"}需要人工选择探测器位置奖励` };
      }
      const button = chooseAiProbeLocationRewardButton();
      const rocketId = button?.dataset?.probeLocationRewardRocketId
        || pending.choices?.[0]?.rocket?.id
        || null;
      if (rocketId == null) {
        return { ok: false, blocked: true, message: "AI 没有可选探测器位置奖励目标" };
      }
      recordAiAutoBattleLog("probe-location-reward", `${player.colorLabel}AI 选择探测器位置奖励`, {
        logPlayerId: player.id,
        rocketId,
        label: button?.textContent || "",
      });
      return handleProbeLocationRewardChoice(rocketId);
    }

    function runAiRareScanTargetDecision(pending, player) {
      const pendingType = pending?.type || null;
      if (pendingType === "remove_planet_marker") {
        const button = chooseFirstAiButton("[data-planet-marker-choice]");
        const choiceId = button?.dataset?.planetMarkerChoice || pending.choices?.[0]?.id || null;
        if (!choiceId) return { ok: false, blocked: true, message: "AI 没有可移除的星球标记" };
        recordAiAutoBattleLog("rare-scan-target", `${player.colorLabel}AI 移除星球标记`, {
          logPlayerId: player.id,
          choiceId,
          label: button?.textContent || "",
        });
        return handleRemovePlanetMarkerChoice(choiceId);
      }

      if (pendingType === "hand_corner_reward") {
        const selected = chooseAiHandCornerChoice(pending);
        const choice = selected?.choice || null;
        if (!choice) return { ok: false, blocked: true, message: "AI 没有可选手牌角标奖励" };
        recordAiAutoBattleLog("rare-scan-target", `${player.colorLabel}AI 选择手牌角标奖励`, {
          logPlayerId: player.id,
          choice,
          score: selected.score,
        });
        return handleHandCornerChoice(choice);
      }

      if (pendingType === "discard_any_income") {
        const selectedCards = chooseAiDiscardAnyIncomeCards(pending, player);
        for (const card of selectedCards) {
          const result = handleDiscardIncomeCardChoice(card.id);
          if (result?.ok === false) return result;
        }
        recordAiAutoBattleLog("rare-scan-target", `${player.colorLabel}AI 确认收入弃牌`, {
          logPlayerId: player.id,
          selectedCardIds: selectedCards.map((card) => card.id),
        });
        return confirmDiscardAnyForIncome();
      }

      if (pendingType === "pay_credit_reward") {
        const rewardValue = scoreAiPayCreditReward(pending.effect, player);
        const canPay = typeof players.canAfford === "function"
          ? players.canAfford(player, { credits: 1 })
          : aiNumber(player?.resources?.credits) > 0;
        const choice = canPay && rewardValue >= AI_RESOURCE_VALUES.credits * 0.85 ? "pay" : "skip";
        recordAiAutoBattleLog("rare-scan-target", `${player.colorLabel}AI ${choice === "pay" ? "支付信用" : "跳过信用支付"}`, {
          logPlayerId: player.id,
          rewardValue,
          creditValue: AI_RESOURCE_VALUES.credits,
          choice,
        });
        return handlePayCreditChoice(choice);
      }

      if (pendingType === "discard_corner_repeat") {
        const selectedCard = chooseAiDiscardCornerRepeatCard(pending, player);
        const cardId = selectedCard?.id || chooseFirstAiButton("[data-discard-corner-card-id]")?.dataset?.discardCornerCardId || null;
        if (!cardId) return { ok: false, blocked: true, message: "AI 没有可重复角标的弃牌" };
        recordAiAutoBattleLog("rare-scan-target", `${player.colorLabel}AI 选择重复角标弃牌`, {
          logPlayerId: player.id,
          cardId,
        });
        return handleDiscardCornerRepeatChoice(cardId);
      }

      if (pendingType === "remove_orbit_to_probe") {
        const button = chooseFirstAiButton("[data-remove-orbit-to-probe]");
        const choiceId = button?.dataset?.removeOrbitToProbe || pending.choices?.[0]?.id || null;
        if (!choiceId) return { ok: false, blocked: true, message: "AI 没有可移除的环绕标记" };
        recordAiAutoBattleLog("rare-scan-target", `${player.colorLabel}AI 移除环绕放置探测器`, {
          logPlayerId: player.id,
          choiceId,
          label: button?.textContent || "",
        });
        return handleRemoveOrbitToProbeChoice(choiceId);
      }

      if (pendingType === "return_unfinished_task") {
        const selected = (pending.choices || [])
          .map((card, index) => ({ card, index, price: getCardPrice(card) }))
          .sort((left, right) => aiNumber(left.price) - aiNumber(right.price) || left.index - right.index)[0]?.card || null;
        const cardId = selected?.id || chooseFirstAiButton("[data-return-task-card-id]")?.dataset?.returnTaskCardId || null;
        if (!cardId) return { ok: false, blocked: true, message: "AI 没有可返回手牌的任务卡" };
        recordAiAutoBattleLog("rare-scan-target", `${player.colorLabel}AI 返回未完成任务卡`, {
          logPlayerId: player.id,
          cardId,
        });
        return handleReturnUnfinishedTaskChoice(cardId);
      }

      return null;
    }

    function runAiScanTargetDecision() {
      if (!els.scanTargetOverlay || els.scanTargetOverlay.hidden) return null;
      const probeSectorResult = runAiProbeSectorScanDecision();
      if (probeSectorResult) return probeSectorResult;
      const probeLocationResult = runAiProbeLocationRewardDecision();
      if (probeLocationResult) return probeLocationResult;

      const pending = state.pendingScanTargetAction || null;
      const pendingType = pending?.type || null;
      if (!pendingType) return null;
      const player = getAiPendingDecisionPlayer(pending);
      if (!isAiAutoBattlePlayer(player?.id)) {
        return { ok: false, blocked: true, message: `${player?.colorLabel || "当前玩家"}需要人工选择扫描目标` };
      }

      if (pendingType === "optional_hand_scan") {
        const hasScannableHandCard = (player?.hand || [])
          .some((card) => card && getPublicScanChoicesForCard(card).ok);
        const choice = hasScannableHandCard ? "start" : "skip";
        recordAiAutoBattleLog("hand-scan", `${player.colorLabel}AI ${choice === "start" ? "开始" : "跳过"}可选手牌扫描`, {
          logPlayerId: player.id,
          choice,
          effectId: pending.effect?.id || null,
        });
        return handleOptionalHandScanChoice(choice);
      }

      if (pendingType === "conditional_sector_scan") {
        const button = chooseAiScanTargetButton(
          queryAiButtons("[data-conditional-sector-x]"),
          {
            player,
            pendingType,
            gainData: pending.effect?.options?.gainData,
          },
        );
        if (!button) {
          return { ok: false, blocked: true, message: "AI 没有可选条件扇区" };
        }
        recordAiAutoBattleLog("scan-target", `${player.colorLabel}AI 选择条件扇区扫描`, {
          logPlayerId: player.id,
          pendingType,
          sectorX: button.dataset.conditionalSectorX || null,
          label: button.textContent || "",
        });
        return handleConditionalSectorChoice(button.dataset.conditionalSectorX);
      }

      const rareResult = runAiRareScanTargetDecision(pending, player);
      if (rareResult) return rareResult;

      if (!["sector_scan", "public_scan", "hand_scan"].includes(pendingType)) {
        return null;
      }
      const button = chooseAiScanTargetButton(
        queryAiButtons(".scan-target-option-button")
          .filter((item) => item.dataset.nebulaId != null),
        {
          player,
          pendingType,
          gainData: pending.gainData,
        },
      );
      if (!button) {
        if (isActionEffectFlowActive()) {
          const effect = getCurrentActionEffect?.() || null;
          recordAiAutoBattleLog("scan-target", `${player.colorLabel}AI 跳过无目标扫描`, {
            logPlayerId: player.id,
            pendingType,
            effectId: effect?.id || null,
            effectType: effect?.type || null,
          });
          closeScanTargetPicker?.({
            forcePublicScanQueueClose: true,
            forceYichangdianCornerClose: true,
          });
          skipCurrentActionEffect?.();
          return { ok: true, progressed: true, skipped: true, message: "AI 已跳过无可选目标扫描" };
        }
        return { ok: false, blocked: true, message: "AI 没有可选扫描目标" };
      }
      recordAiAutoBattleLog("scan-target", `${player.colorLabel}AI 选择扫描目标`, {
        logPlayerId: player.id,
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
      const nextEffect = options.nextEffect || null;
      const landingRequiredThisStep = isAiLandingEffect(nextEffect);
      const originPlanet = getAiPlanetAtCoordinate(from);
      const destinationPlanet = getAiPlanetAtCoordinate(to);
      const isB49PublicityMoveFollowup = /b49-visit-publicity-move-followup-pay-publicity-move/.test(String(effect?.id || ""));
      if (
        isB49PublicityMoveFollowup
        && !landingRequiredThisStep
        && originPlanet?.planetId
        && originPlanet.planetId !== "earth"
        && (
          canAiPlanetAcceptLanding(originPlanet.planetId, currentPlayer)
          || canAiPlanetAcceptOrbit(originPlanet.planetId)
        )
      ) {
        return null;
      }
      if (
        isB49PublicityMoveFollowup
        && !landingRequiredThisStep
        && destinationPlanet?.planetId
        && destinationPlanet.planetId !== "earth"
      ) {
        return null;
      }
      if (
        effect?.type === cardEffects.EFFECT_TYPES.CARD_MOVE
        && remainingPoolAfterStep > 0
        && !canAiContinueCardMoveAfterStep(rocket, to, remainingPoolAfterStep, effect, currentPlayer)
      ) {
        return null;
      }
      const paymentCost = paymentRequired > 0
        ? scoreAiMovePaymentCost(currentPlayer, paymentRequired)
        : 0;
      if (isAiChongFossilToken(rocket)) {
        return buildAiChongTransportMoveCandidate({
          id: options.id || "effectMove",
          kind: "effect",
          rocket,
          direction,
          index,
          player: currentPlayer,
          from,
          to,
          terrainRequired,
          paymentRequired,
          paymentCost,
          free: options.free,
          effect,
          nextEffect,
        });
      }
      const landingScore = landingRequiredThisStep
        ? scoreAiLandingAfterMove(to, nextEffect, currentPlayer)
        : { ok: true, score: 0, planet: null };
      if (!landingScore.ok) return null;
      const routeScore = scoreAiMoveTowardTargets(from, to, currentPlayer, {
        rocket,
        effect,
        nextEffect,
      });
      const finalSecondMarkNoDirectSetupPenalty = scoreAiFinalSecondMarkNoDirectSetupPenalty(currentPlayer, {
        actionId: options.id || "effectMove",
        directScoreGain: 0,
        followupDirectScore: landingScore.directScoreGain,
        setupScore: routeScore.score,
        consumesHand: false,
        noCashoutRoute: Math.max(0, aiNumber(landingScore.directScoreGain)) <= 0
          && routeScore.target?.kind === "planet",
      });
      const movementGain = applyAiStrategyWeight(applyAiStrategyWeight(routeScore.score, "route", 0.7), "move", 0.8) * 0.75
        + direction.score * 0.08
        + scoreAiMoveArrivalRewardValue(to, currentPlayer, { free: paymentRequired <= 0 }) * 0.85
        + applyAiStrategyWeight(landingScore.score, "orbitLand", 0.6);
      const nearestActionablePlanetPenalty = scoreAiNearestActionablePlanetTimingPenalty({
        player: currentPlayer,
        effect,
        nextEffect,
        from,
        to,
        direction,
        routeScore,
        followupScore: landingScore.score,
        remainingPoolAfterStep,
        industryHuanyuMove: options.industryHuanyuMove,
      });
      const pathPenalty = scoreAiMovementPathPenalty({
        player: currentPlayer,
        effect,
        nextEffect,
        from,
        to,
        direction,
        requiredMovePoints: terrainRequired,
        routeScore,
        followupScore: landingScore.score,
        remainingPoolAfterStep,
        nearestActionablePlanetPenalty,
        industryHuanyuMove: options.industryHuanyuMove,
      });
      const movementCost = paymentCost + pathPenalty + finalSecondMarkNoDirectSetupPenalty;
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
          nearestActionablePlanetPenalty,
          finalSecondMarkNoDirectSetupPenalty,
          movementCost,
          routeScore: routeScore.score,
          landingScore: landingScore.score,
          landingDirectScoreGain: landingScore.directScoreGain || 0,
          terrainRequired,
          paymentRequired,
          remainingPoolAfterStep,
          industryHuanyuMove: isAiIndustryHuanyuMoveContext({ ...options, effect }),
        },
      };
    }

    function isAiIndustryHuanyuMoveEffect(effect) {
      return Boolean(
        effect?.options?.industryHuanyuMoveGroupId
        && effect.options?.requireDifferentRocketInGroup,
      );
    }

    function isAiIndustryHuanyuMoveContext(options = {}) {
      return Boolean(options.industryHuanyuMove || isAiIndustryHuanyuMoveEffect(options.effect));
    }

    function getAiCompletedIndustryHuanyuMoveRocketIds(effect) {
      const groupId = effect?.options?.industryHuanyuMoveGroupId || null;
      if (!groupId || !state.pendingActionEffectFlow?.effects?.length) return new Set();
      const used = new Set();
      for (const candidate of state.pendingActionEffectFlow.effects) {
        if (!candidate || candidate === effect || candidate.id === effect.id) continue;
        if (candidate.options?.industryHuanyuMoveGroupId !== groupId) continue;
        if (candidate.status !== "completed" || candidate.result?.skipped) continue;
        const rocketId = Math.round(Number(
          candidate.result?.payload?.rocketId
          ?? candidate.result?.rocket?.id
          ?? candidate.result?.rocketId,
        ));
        if (Number.isInteger(rocketId)) used.add(rocketId);
      }
      return used;
    }

    function listAiEffectMoveCandidates(options = {}) {
      const currentPlayer = getCurrentPlayer();
      if (!currentPlayer) return [];
      const effect = options.effect || getCurrentActionEffect?.() || null;
      const usedHuanyuRocketIds = isAiIndustryHuanyuMoveEffect(effect)
        ? getAiCompletedIndustryHuanyuMoveRocketIds(effect)
        : null;
      return getMovableTokensForPlayer(currentPlayer.id)
        .filter((rocket) => !usedHuanyuRocketIds?.has(Number(rocket.id)))
        .flatMap((rocket, index) => AI_MOVE_DIRECTIONS
          .map((direction) => buildAiEffectMoveCandidate(rocket, direction, index, {
            ...options,
            effect,
          }))
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
      const candidates = listAiIndustryHuanyuMoveCandidates();
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

    function listAiAlienStateTraceTargets(options = {}) {
      const pickerMode = String(state.alienTracePickerState?.mode || "");
      const allowPendingFallback = Boolean(options.allowPendingFallback && state.pendingAlienTraceAction);
      if (
        pickerMode !== "debug-direct"
        && pickerMode !== "trace-board"
        && !pickerMode.endsWith("-grid")
        && !allowPendingFallback
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
      if (target?.kind === "picker" && button?.dataset?.alienPickerStep === "fangzhou-use") {
        return "fangzhou-use";
      }
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
      const positionLadder = scoreAiRevealedAlienGridPosition(pos);
      if (mode === "yichangdian-grid") {
        return 1.4 + positionLadder * 0.55 + (pos >= 4 ? 1.2 : 0);
      }
      if (mode === "fangzhou-grid") {
        if (label.includes("解锁")) return 10 + positionLadder * 0.4;
        return 3 + positionLadder;
      }
      if (mode === "banrenma-grid") return 3 + positionLadder;
      if (mode === "aomomo-grid") return 3 + positionLadder;
      if (mode === "chong-grid" || mode === "amiba-grid" || mode === "runezu-grid") return 2.5 + positionLadder;
      if (mode === "jiuzhe-grid") {
        return 0.8 + positionLadder * 0.75;
      }
      return 0;
    }

    function scoreAiRevealedAlienGridPosition(position) {
      const pos = Math.max(0, Math.round(aiNumber(position)));
      if (pos >= 5) return 8.5;
      if (pos === 4) return 6.5;
      if (pos === 3) return 4.5;
      if (pos === 2) return 3;
      if (pos === 1) return 1.5;
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

    function getAiBestSimpleGridTraceDirectScore(alienModule, mode, alienSlotId, traceType, options = {}) {
      if (!alienModule || !traceType) return 0;
      const grid = alienModule.getTraceGrid?.(alienGameState, alienSlotId);
      return getAiAlienModuleTracePositions(alienModule, traceType).reduce((best, rawPosition) => {
        const position = Number(rawPosition);
        if (options.stackPosition !== position && grid?.[traceType]?.[position]) return best;
        const reward = getAiAlienTraceTargetReward(mode, traceType, position);
        return Math.max(best, Math.max(0, aiNumber(reward?.gain?.score)));
      }, 0);
    }

    function getAiBestCheckedGridTraceDirectScore(alienModule, mode, alienSlotId, traceType, canPlace) {
      if (!alienModule || !traceType || typeof canPlace !== "function") return 0;
      return getAiAlienModuleTracePositions(alienModule, traceType).reduce((best, rawPosition) => {
        const position = Number(rawPosition);
        if (!canPlace(traceType, position)) return best;
        const reward = getAiAlienTraceTargetReward(mode, traceType, position);
        return Math.max(best, Math.max(0, aiNumber(reward?.gain?.score)));
      }, 0);
    }

    function getAiBestBanrenmaTraceDirectScore(alienSlotId, traceType, player) {
      if (!banrenma?.isBanrenmaRevealedSlot?.(alienGameState, alienSlotId)) return 0;
      const grid = banrenma.getTraceGrid?.(alienGameState, alienSlotId);
      const availableData = getAiAvailableDataTokenCount(player);
      return getAiBestCheckedGridTraceDirectScore(banrenma, "banrenma-grid", alienSlotId, traceType, (item, position) => {
        const reward = banrenma.getTraceReward?.(item, Number(position));
        const requiredData = Math.max(0, Math.round(aiNumber(reward?.payData)));
        if (requiredData > availableData) return false;
        return Number(position) === 1 || !grid?.[item]?.[position];
      });
    }

    function getAiBestRevealedAlienTraceDirectScoreForSlot(player, alienSlotId, traceType) {
      if (jiuzhe?.isJiuzheRevealedSlot?.(alienGameState, alienSlotId)) {
        return getAiBestSimpleGridTraceDirectScore(jiuzhe, "jiuzhe-grid", alienSlotId, traceType);
      }
      if (yichangdian?.isYichangdianRevealedSlot?.(alienGameState, alienSlotId)) {
        return getAiBestSimpleGridTraceDirectScore(yichangdian, "yichangdian-grid", alienSlotId, traceType, { stackPosition: 1 });
      }
      if (fangzhou?.isFangzhouRevealedSlot?.(alienGameState, alienSlotId)) {
        return getAiBestCheckedGridTraceDirectScore(fangzhou, "fangzhou-grid", alienSlotId, traceType, (item, position) => (
          fangzhou.canPlaceFangzhouTrace?.(alienGameState, alienSlotId, item, position, player)?.ok
        ));
      }
      if (banrenma?.isBanrenmaRevealedSlot?.(alienGameState, alienSlotId)) {
        return getAiBestBanrenmaTraceDirectScore(alienSlotId, traceType, player);
      }
      if (chong?.isChongRevealedSlot?.(alienGameState, alienSlotId)) {
        return getAiBestCheckedGridTraceDirectScore(chong, "chong-grid", alienSlotId, traceType, (item, position) => (
          chong.canPlaceChongTrace?.(alienGameState, alienSlotId, item, position, player)?.ok
        ));
      }
      if (amiba?.isAmibaRevealedSlot?.(alienGameState, alienSlotId)) {
        return getAiBestCheckedGridTraceDirectScore(amiba, "amiba-grid", alienSlotId, traceType, (item, position) => (
          amiba.canPlaceAmibaTrace?.(alienGameState, alienSlotId, item, position, player)?.ok
        ));
      }
      if (aomomo?.isAomomoRevealedSlot?.(alienGameState, alienSlotId)) {
        return getAiBestCheckedGridTraceDirectScore(aomomo, "aomomo-grid", alienSlotId, traceType, (item, position) => (
          aomomo.canPlaceAomomoTrace?.(alienGameState, alienSlotId, item, position, player)?.ok
        ));
      }
      if (runezu?.isRunezuRevealedSlot?.(alienGameState, alienSlotId)) {
        return getAiBestCheckedGridTraceDirectScore(runezu, "runezu-grid", alienSlotId, traceType, (item, position) => (
          runezu.canPlaceRunezuTrace?.(alienGameState, alienSlotId, item, position, player)?.ok
        ));
      }
      return 0;
    }

    function hasAiFeasibleRevealedAlienTraceTarget(alienSlotId, allowedTraceTypes, player) {
      if (jiuzhe?.isJiuzheRevealedSlot?.(alienGameState, alienSlotId)) {
        return hasAiFeasibleSimpleGridTraceTarget(jiuzhe, alienSlotId, allowedTraceTypes);
      }
      if (yichangdian?.isYichangdianRevealedSlot?.(alienGameState, alienSlotId)) {
        return hasAiFeasibleSimpleGridTraceTarget(yichangdian, alienSlotId, allowedTraceTypes, { stackPosition: 1 });
      }
      if (fangzhou?.isFangzhouRevealedSlot?.(alienGameState, alienSlotId)) {
        const canPlaceOnPanel = hasAiFeasibleGridTraceTarget(fangzhou, alienSlotId, allowedTraceTypes, (traceType, position) => (
          fangzhou.canPlaceFangzhouTrace?.(alienGameState, alienSlotId, traceType, position, player)?.ok
        ));
        const canUnlockCard = (allowedTraceTypes || []).some((traceType) => (
          fangzhou.canUnlockCard2ForTrace?.(alienGameState, player, traceType)
        ));
        return canPlaceOnPanel || canUnlockCard;
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
      const fangzhouUseChoice = target.button.dataset.fangzhouUse || null;
      const isFangzhouUnlockChoice = mode === "fangzhou-use" && fangzhouUseChoice === "unlock";
      const scoringMode = mode === "fangzhou-use" && fangzhouUseChoice === "place" && position != null
        ? "fangzhou-grid"
        : mode;
      const rawReward = isFangzhouUnlockChoice
        ? fangzhou?.getCard2UnlockTraceReward?.()
        : getAiAlienTraceTargetReward(scoringMode, traceType, position);
      const reward = getAiAlienTraceRewardForValuation(scoringMode, rawReward, player);
      const demand = getAiStrategyDemand(player);
      const traceDemand = traceType ? getAiMapDemand(demand.traceTypes, traceType) : 0;
      const alienSlot = Number(target.button.dataset.alienSlot || state.alienTracePickerState?.selectedAlienSlotId);
      const hiddenFirstTraceColorLost = Number.isFinite(alienSlot)
        && isAiOpenHiddenFirstTraceTarget(alienSlot, traceType)
        && isAiHiddenFirstTraceColorLost(traceType, player);
      const forcedPendingStateExtraTrace = Boolean(
        state.pendingAlienTraceAction
        && target.kind === "state-slot"
        && target.button.dataset.stateTraceKind === "extra"
      );
      if (
        target.kind === "state-slot"
        && mode !== "debug-direct"
        && !forcedPendingStateExtraTrace
        && Number.isFinite(alienSlot)
        && isAiHiddenFirstTraceTakenByOpponent(alienSlot, traceType, player)
      ) {
        return -Infinity;
      }
      if (
        target.kind === "picker"
        && mode === "fangzhou-use"
        && fangzhouUseChoice === "place"
        && target.button.dataset.fangzhouPlaceKind === "state"
        && Number.isFinite(alienSlot)
        && isAiHiddenFirstTraceTakenByOpponent(alienSlot, traceType, player)
      ) {
        return -Infinity;
      }
      if (pickerMode.endsWith("-grid") && target.kind === "picker") return -Infinity;
      if (
        target.kind === "picker"
        && mode !== "fangzhou-use"
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
        mode: scoringMode,
        position,
        label,
        reward,
      });
      if (
        Number.isFinite(alienSlot)
        && isAiHiddenFirstTraceTakenByOpponent(alienSlot, traceType, player)
      ) {
        score -= 12;
      }

      if (target.kind === "grid-slot") score += 12;
      if (target.kind === "picker") score += 8;
      if (target.kind === "state-slot") score += 3;
      if (
        hiddenFirstTraceColorLost
        && (
          target.kind === "state-slot"
          || (
            target.kind === "picker"
            && mode === "fangzhou-use"
            && fangzhouUseChoice === "place"
            && target.button.dataset.fangzhouPlaceKind === "state"
          )
        )
      ) {
        score -= 14;
      }
      score += traceDemand * 0.45;
      score += ({ pink: 4, blue: 3.5, yellow: 3 })[traceType] || 0;
      score += scoreAiAlienGridPosition(scoringMode, traceType, position, label);
      if (label.includes("首标记 2/3")) score += 10;
      if (label.includes("首标记 1/3")) score += 4;
      if (label.includes("未揭示")) score += 3;
      if (label.includes("得分") || label.includes("分数")) score += 3;
      if (label.includes("精选")) score += 4.5;
      if (label.includes("牌")) score += 4.5 * getAiAlienCardConversionMultiplier(player);
      if (label.includes("信用")) score += 2;
      if (label.includes("数据") || label.includes("扫描")) score += 1.5;
      if (label.includes("解锁")) score += 8;
      if (reward?.pickAlienCard) {
        score += 4 * getAiAlienCardConversionMultiplier(player);
        score -= scoreAiLateAlienCardConversionPenalty(player);
      }
      if (reward?.drawCards) score += Math.max(0, aiNumber(reward.drawCards)) * 1.8;
      if (reward?.blindDraw) score += Math.max(0, aiNumber(reward.blindDraw)) * 1.4;
      if (isFangzhouUnlockChoice) score += scoreAiFangzhouUnlockChoiceValue(player, traceType);
      score += scoreAiBanrenmaTraceTimingValue(scoringMode, reward, player, position);
      score += scoreAiAomomoTraceTimingValue(scoringMode, reward, player, position);
      score += scoreAiYichangdianTraceTimingValue(scoringMode, reward, player, position, traceType, alienSlot);
      if (target.kind === "grid-slot" || (mode === "fangzhou-use" && fangzhouUseChoice === "place") || isFangzhouUnlockChoice) {
        const directScore = Math.max(0, aiNumber(reward?.gain?.score));
        const pointConversionPenalty = scoreAiHighCostPointConversionPenalty(player, {
          actionId: "alienTrace",
          directScore,
          payData: reward?.payData,
          highScoreTarget: directScore >= 15 && aiNumber(reward?.payData) >= 3,
          engineReward: Boolean(reward?.pickAlienCard || reward?.drawCards || reward?.blindDraw),
        });
        if (pointConversionPenalty > 0) score -= pointConversionPenalty;
        if (directScore > 0) {
          const threshold = getAiNextMissingFinalScoreThreshold(player);
          const currentScore = Math.max(0, aiNumber(player?.resources?.score));
          if (threshold && currentScore < threshold && getAiRoundNumber() >= FINAL_ROUND_NUMBER - 1) {
            score += currentScore + directScore >= threshold
              ? (threshold <= 50 ? 16 : 12)
              : Math.min(threshold <= 50 ? 10 : 7, directScore * (threshold <= 50 ? 0.9 : 0.55));
          }
          score += scoreAiPaceValueForDirectScore(directScore, player, {
            baseWeight: getAiRoundNumber() >= FINAL_ROUND_NUMBER ? 0.75 : 0.45,
            pressureWeight: getAiRoundNumber() >= FINAL_ROUND_NUMBER ? 0.4 : 0.22,
          });
          score += scoreAiSecondFinalMarkNudgeValue(directScore, player, { weight: 1.15 });
          score += scoreAiThirdFinalMarkCashoutValue(directScore, player, { weight: 0.85 });
        }
      }
      if (isFangzhouUnlockChoice) {
        const threshold = getAiNextMissingFinalScoreThreshold(player);
        const currentScore = Math.max(0, aiNumber(player?.resources?.score));
        const directScore = Math.max(0, aiNumber(reward?.gain?.score));
        if (threshold && threshold <= 50 && currentScore >= 45 && currentScore < threshold && currentScore + directScore < threshold) {
          score -= 5;
        }
      }

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
        if (!targets.length && state.pendingAlienTraceAction) {
          targets = listAiAlienStateTraceTargets({ allowPendingFallback: true });
        }
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
      const explicitPlayerId = pending?.playerId || pending?.targetPlayerId || pending?.player?.id || null;
      const explicitPlayerColor = pending?.playerColor || pending?.targetPlayerColor || pending?.player?.color || null;
      const ownerPlayerId = getEffectOwnerPlayer(pending?.effect)?.id
        || state.pendingActionEffectFlow?.playerId
        || playerState.currentPlayerId;
      const explicitColorPlayer = explicitPlayerColor ? getPlayerByColor(explicitPlayerColor) : null;
      return getPlayerById(explicitPlayerId)
        || explicitColorPlayer
        || getPlayerById(ownerPlayerId)
        || getCurrentPlayer();
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

    function scoreAiChongFossilUseOption(option, player) {
      if (option.choice === "cancel") return -100;
      const reward = chong?.getFossilReward?.(option.choice);
      if (!reward) return option.score ?? 0;
      return scoreAiAlienRewardBundle(reward, player)
        + scoreAiChongPanelUnlockValue(player) * 0.35;
    }

    function scoreAiAmibaSymbolUseOption(option, player) {
      if (option.choice === "cancel") return -100;
      const entry = amiba?.getSymbolEntry?.(alienGameState, option.choice);
      return scoreAiAmibaSymbolEntryValue(entry, player);
    }

    function scoreAiAmibaTraceRemovalUseOption(option, flow, player) {
      if (option.choice === "cancel") return -100;
      const [traceType, positionText] = String(option.choice || "").split(":");
      const position = Number(positionText);
      const match = (amiba?.listPlayerTraceOptions?.(alienGameState, flow.pending?.alienSlotId, player) || [])
        .find((item) => item.traceType === traceType && Number(item.position) === position);
      if (!match) return -Infinity;
      const traceLoss = position >= 3 ? 2 : 1;
      return scoreAiAmibaRegionRewardValue(match.region, player) - traceLoss;
    }

    function scoreAiRunezuFaceSymbolUseOption(option, flow, player) {
      if (option.choice === "cancel") return -100;
      return scoreAiRunezuFaceSymbolPlacementChoice(flow.pending?.position, option.choice, player);
    }

    function scoreAiRunezuSymbolBranchUseOption(option, flow, player) {
      if (option.choice === "cancel") return -100;
      const branch = (flow.pending?.branches || [])[Number(option.choice)];
      if (!branch) return -Infinity;
      return (branch.symbolIds || []).reduce((total, symbolId) => (
        total + scoreAiRunezuSymbolRewardValue(symbolId, player)
      ), 0);
    }

    function enrichAiAlienUseOptions(options, flow) {
      let enriched = enrichAiJiuzheCardOptions(options, flow);
      if (!["chong-fossil", "amiba-symbol", "amiba-trace-removal", "runezu-face-symbol", "runezu-symbol-branch"].includes(flow.type)) {
        return enriched;
      }
      const player = getAiAlienPendingPlayer(flow.pending);
      return enriched.map((option) => {
        let score = option.score;
        if (flow.type === "chong-fossil") score = scoreAiChongFossilUseOption(option, player);
        if (flow.type === "amiba-symbol") score = scoreAiAmibaSymbolUseOption(option, player);
        if (flow.type === "amiba-trace-removal") score = scoreAiAmibaTraceRemovalUseOption(option, flow, player);
        if (flow.type === "runezu-face-symbol") score = scoreAiRunezuFaceSymbolUseOption(option, flow, player);
        if (flow.type === "runezu-symbol-branch") score = scoreAiRunezuSymbolBranchUseOption(option, flow, player);
        return { ...option, score };
      });
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
      options = enrichAiAlienUseOptions(options, flow);
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
      return moveRocket(action.deltaX, action.deltaY, action.rocketId, { automated: true });
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
      candidate.directScoreGain = getAiResearchTechDirectScoreGain(candidate);
      candidate.valueBreakdown = {
        lateTechCatchupValue: scoreAiLateTechEngineCatchupValue(candidate, getCurrentPlayer()),
        lowTechCatchupValue: scoreAiLowTechBoardCatchupValue(candidate, getCurrentPlayer()),
      };
      if (!safety.ok) candidate.score -= 1000;
      return candidate;
    }

    function scoreAiBorrowedTechImmediateValue(candidate, player = getCurrentPlayer()) {
      if (!candidate || !player) return -Infinity;
      const techType = candidate.techType || "";
      const tileId = candidate.tileId || "";
      const demand = getAiStrategyDemand(player);
      const planScore = Math.max(0, aiNumber(candidate.plan?.score));
      let value = 1.5 + planScore * 1.15;
      const context = createActionContext();

      if (tileId === "orange1") {
        const launchCheck = actions.canExecute("launch", context);
        if (launchCheck.ok) value += 2.5 + getAiMapDemand(demand.actions, "launch") * 0.12;
      }
      if (tileId === "orange2") {
        const bestMoveScore = listAiMoveCandidates()
          .reduce((best, move) => Math.max(best, aiNumber(move.score)), 0);
        value += Math.min(7, Math.max(0, bestMoveScore) * 0.18)
          + getAiMapDemand(demand.actions, "move") * 0.1;
      }
      if (tileId === "orange3" || tileId === "orange4") {
        const landCheck = actions.canExecute("land", context);
        if (landCheck.ok) {
          value += 3.5
            + getAiMapDemand(demand.actions, "land") * 0.12
            + getAiMapDemand(demand.planetIds, landCheck.planet?.planetId) * 0.08;
        }
      }
      if (techType === "purple") {
        const scanCheck = scanEffects.canExecuteScan(player, { standardAction: true });
        if (scanCheck?.ok) {
          value += 3.25
            + getAiMapDemand(demand.actions, "scan") * 0.12
            + sumAiDemandMap(demand.scanColors) * 0.08
            + Math.max(0, 1 - aiNumber(player.resources?.additionalPublicScan)) * 0.75;
        }
      }

      const currentScore = Math.max(0, aiNumber(player.resources?.score));
      const nextThreshold = getAiNextMissingFinalScoreThreshold(player);
      if (getAiRoundNumber() >= FINAL_ROUND_NUMBER && nextThreshold && currentScore < nextThreshold) {
        value -= Math.min(6, Math.max(1, nextThreshold - currentScore) * 0.45);
      }
      return roundAiScore(value);
    }

    function buildAiBorrowTechCandidate(tileId, player = getCurrentPlayer()) {
      const stack = tech.getStack?.(techGameState.board, tileId) || null;
      const candidate = {
        tileId,
        techType: stack?.techType || tech.getTechType?.(tileId) || null,
        stackIndex: tech.getStackIndex?.(tileId) || null,
        bonusId: stack?.bonusId || null,
        firstTake: false,
        remaining: stack?.remaining ?? null,
        finalFormulaDeltas: {},
        directScoreGain: 0,
      };
      const check = tech.resolver.canTakeTile(
        techGameState.board,
        player?.techState,
        tileId,
        { techTypes: ["orange", "purple"] },
      );
      candidate.available = check.ok;
      candidate.reason = check.message || null;
      candidate.plan = scoreAiResearchTechRoutePlan(candidate, player);
      candidate.score = scoreAiBorrowedTechImmediateValue(candidate, player);
      if (!check.ok) candidate.score -= 1000;
      return candidate;
    }

    function listAiBorrowTechCandidates(player = getCurrentPlayer()) {
      if (!player) return [];
      createActionContext().ensurePlayerTechState(player);
      return tech.listTakeableTiles(
        techGameState.board,
        player.techState,
        { techTypes: ["orange", "purple"] },
      )
        .map((tileId) => buildAiBorrowTechCandidate(tileId, player))
        .filter((candidate) => candidate.available !== false)
        .sort((left, right) => aiNumber(right.score) - aiNumber(left.score));
    }

    function listAiResearchTechCandidates(options = null) {
      const currentPlayer = getCurrentPlayer();
      if (!currentPlayer) return [];
      createActionContext().ensurePlayerTechState(currentPlayer);
      if (!currentPlayer.techState) return [];

      const selectionOptions = options || getResearchTechSelectionOptionsForEffect();
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

    function getAiResearchTechCandidateExecutionCheck(candidate, player = getCurrentPlayer(), selectionOptionsOverride = null) {
      const tileId = candidate?.tileId || null;
      if (!tileId) return { ok: false, message: "科技候选缺少 tileId" };
      if (!player) return { ok: false, message: "没有当前玩家" };
      createActionContext().ensurePlayerTechState(player);
      if (!player.techState) return { ok: false, message: "玩家科技状态未初始化" };

      if (techGameState.ui.industryBorrowMode) {
        return tech.resolver.canTakeTile(
          techGameState.board,
          player.techState,
          tileId,
          { techTypes: ["orange", "purple"] },
        );
      }

      const selectionOptions = selectionOptionsOverride || getAiResearchTechSelectionOptionsForEffect();
      if (selectionOptions.researchedByOthersOnly && !isTechTileOwnedByOtherPlayer(tileId)) {
        return { ok: false, message: "这张牌只能选择其他玩家已研究过的科技" };
      }
      const allowedTechTypes = tech.resolver.normalizeTechTypeFilter(selectionOptions)
        || tech.resolver.normalizeTechTypeFilter({ techTypes: techGameState.ui.allowedTechTypes })
        || null;
      return tech.resolver.canTakeTile(
        techGameState.board,
        player.techState,
        tileId,
        allowedTechTypes ? { techTypes: allowedTechTypes } : {},
      );
    }

    function selectExecutableAiResearchTechCandidate(
      candidates = [],
      selected = null,
      player = getCurrentPlayer(),
      selectionOptions = null,
    ) {
      const ordered = [];
      if (selected) ordered.push(selected);
      for (const candidate of candidates) {
        if (!candidate?.tileId) continue;
        if (ordered.some((item) => item?.tileId === candidate.tileId)) continue;
        ordered.push(candidate);
      }

      let firstFailure = null;
      for (const candidate of ordered) {
        const check = getAiResearchTechCandidateExecutionCheck(candidate, player, selectionOptions);
        if (check.ok) return { candidate, check };
        if (!firstFailure) firstFailure = { candidate, check };
      }
      return {
        candidate: null,
        check: firstFailure?.check || { ok: false, message: "没有可研究科技候选" },
      };
    }

    function runAiResearchTechSelectionDecision(effect) {
      const isResearchSelectionEffect = effect?.type === "research_tech_select"
        || effect?.type === cardEffects.EFFECT_TYPES.RESEARCH_TECH;
      if (!isResearchSelectionEffect && !isTechTilePickingActive()) return null;
      const currentPlayer = getCurrentPlayer();
      if (!isAiAutoBattlePlayer(currentPlayer?.id)) {
        return { ok: false, blocked: true, message: `${currentPlayer?.colorLabel || "当前玩家"}需要人工选择科技片` };
      }
      const selectionOptions = getAiResearchTechSelectionOptionsForEffect(effect);

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

      const candidates = techGameState.ui.industryBorrowMode
        ? listAiBorrowTechCandidates(currentPlayer)
        : listAiResearchTechCandidates(selectionOptions);
      const policySelected = ai?.policy?.chooseResearchTechTile?.(candidates, {
        currentPlayer,
        turnState,
        techGameState,
        effect,
      }) || null;
      const policyCheck = policySelected
        ? getAiResearchTechCandidateExecutionCheck(policySelected, currentPlayer, selectionOptions)
        : null;
      let selected = policySelected || candidates[0] || null;
      const executable = selectExecutableAiResearchTechCandidate(candidates, selected, currentPlayer, selectionOptions);
      if (!executable.candidate && selected?.tileId) {
        recordAiAutoBattleLog("tech-placement-reject", `${currentPlayer.colorLabel}AI 科技候选失效：${selected.tileId}`, {
          selected,
          reason: executable.check?.message || null,
        });
      }
      selected = executable.candidate;
      if (!selected?.tileId) {
        const message = `${effect?.label || "选择科技"}：${executable.check?.message || "没有可研究科技候选"}，已跳过`;
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
      if (policySelected?.tileId && policySelected.tileId !== selected.tileId) {
        recordAiAutoBattleLog("tech-placement-retarget", `${currentPlayer.colorLabel}AI 改选科技 ${selected.tileId}`, {
          rejected: policySelected,
          selected,
          reason: policyCheck?.message || null,
        });
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
        candidates.push(...listAiLateResourceRecoveryTradeCandidates(currentPlayer));
        candidates.push(...listAiMoveCandidates());
        candidates.push(...listAiDataPlacementCandidates(currentPlayer));
        candidates.push(...listAiRunezuFaceSymbolQuickCandidates(currentPlayer));
        candidates.push(...listAiCardCornerQuickCandidates(currentPlayer));
        candidates.push({
          id: "end-turn",
          kind: "end-turn",
          available: true,
          reason: null,
          score: scoreAiPassAction(currentPlayer),
        });
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
      const finalSecondMarkExtraLaunchPenalty = launchCheck.ok
        ? scoreAiFinalSecondMarkExtraLaunchPenalty(currentPlayer, postLaunchMovePlan)
        : 0;
      const noRouteLaunchPenalty = launchCheck.ok
        ? scoreAiNoRouteLaunchPenalty(currentPlayer, postLaunchMovePlan)
        : 0;
      const launchCost = scoreAiLaunchPaymentCost();
      const launchReservePenalty = launchCheck.ok
        ? scoreAiResourceReservePenaltyForCost(currentPlayer, getAiLaunchPaymentCost(), { actionId: "launch" })
        : 0;
      const launchGain = launchCheck.ok
        ? scoreAiLaunchAction(currentPlayer)
          + applyAiStrategyWeight(Math.max(0, aiNumber(postLaunchMovePlan?.score)), "move", 0.45)
          - lateLaunchPenalty
          - extraLaunchPacePenalty
          - finalSecondMarkExtraLaunchPenalty
          - noRouteLaunchPenalty
        : 0;
      const launchCandidate = {
        id: "launch",
        kind: "main",
        available: launchCheck.ok,
        reason: launchCheck.message || null,
        plan: postLaunchMovePlan?.score > 0 ? postLaunchMovePlan : null,
        gain: launchGain,
        cost: launchCost + launchReservePenalty,
        score: launchGain - launchCost - launchReservePenalty,
        valueBreakdown: {
          launchGain,
          launchCost,
          launchReservePenalty,
          postLaunchMovePlanScore: postLaunchMovePlan?.score || 0,
          lateLaunchPenalty,
          extraLaunchPacePenalty,
          finalSecondMarkExtraLaunchPenalty,
          noRouteLaunchPenalty,
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
        finalMarkCashoutIncluded: true,
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
        finalMarkCashoutIncluded: true,
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
        directScoreGain: Math.max(0, aiNumber(bestTechCandidate?.directScoreGain)),
        score: applyAiStrategyWeight(bestTechScore, "engine", 0.5),
        valueBreakdown: {
          directScoreGain: Math.max(0, aiNumber(bestTechCandidate?.directScoreGain)),
          bestTechTileId: bestTechCandidate?.tileId || null,
          bestTechType: bestTechCandidate?.techType || null,
          bestTechBonusId: bestTechCandidate?.bonusId || null,
        },
      });
      const scanCheck = scanEffects.canExecuteScan(getCurrentPlayer(), { standardAction: true });
      const preMoveCandidates = listAiMoveCandidates();
      const bestMoveCandidate = preMoveCandidates.reduce((best, candidate) => (
        aiNumber(candidate?.score) > aiNumber(best?.score) ? candidate : best
      ), null);
      const bestMoveScore = Math.max(0, aiNumber(bestMoveCandidate?.score));
      const analyzeCheck = canAiAnalyzeData(currentPlayer);
      const analyzeScore = analyzeCheck.ok ? scoreAiAnalyzeAction(currentPlayer) : 0;
      const immediatePlanetActionScore = Math.max(
        orbitCandidate.available ? Number(orbitCandidate.score || 0) : 0,
        landCandidate.available ? Number(landCandidate.score || 0) : 0,
      );
      let scanScore = scanCheck.ok ? scoreAiScanAction(currentPlayer) : 0;
      const scanDirectScoreGain = scanCheck.ok ? getAiScanDirectScoreGain(currentPlayer) : 0;
      const scanPriorityFloor = scanCheck.ok ? scoreAiScanPriorityFloor(currentPlayer) : 0;
      const scanCurrentScore = Math.max(0, aiNumber(currentPlayer?.resources?.score));
      const scanNextThreshold = getAiNextMissingFinalScoreThreshold(currentPlayer);
      const scanScoreToThreshold = scanNextThreshold ? Math.max(1, scanNextThreshold - scanCurrentScore) : Infinity;
      const scanFinalThresholdMiss = scanCheck.ok
        && getAiRoundNumber() >= FINAL_ROUND_NUMBER
        && scanNextThreshold
        && scanCurrentScore < scanNextThreshold
        && scanScoreToThreshold <= 3
        && scanCurrentScore + scanDirectScoreGain < scanNextThreshold;
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
      if (
        getAiRoundNumber() >= 3
        && Math.max(0, aiNumber(currentPlayer?.resources?.score)) < 25
        && launchCandidate.available
        && Number(launchCandidate.score || 0) >= 10
      ) {
        scanScore = Math.min(scanScore, Math.max(0, Number(launchCandidate.score || 0) - 2));
      }
      const bestEarlyMoveScore = getAiRoundNumber() <= 2 ? bestMoveScore : 0;
      if (bestEarlyMoveScore >= 10) {
        scanScore = Math.max(
          scanPriorityFloor,
          Math.min(scanScore, Math.max(0, bestEarlyMoveScore - 3)),
        );
      }
      const routeCashoutMoveScore = getAiRoundNumber() >= 3
        && Math.max(0, aiNumber(currentPlayer?.resources?.energy)) <= 3
        && bestMoveScore >= 16
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
      if (scanFinalThresholdMiss) {
        scanScore = Math.min(scanScore, Math.max(0, scanDirectScoreGain) * 2);
      }
      const scanScoreCapReason = scanFinalThresholdMiss
        ? "终局临门扫描直接分不足"
        : scanCheck.ok && immediatePlanetActionScore >= 12
        ? "优先兑现当前位置的环绕/登陆"
          : scanCheck.ok && getAiRoundNumber() <= 2 && launchCandidate.available && Number(launchCandidate.score || 0) >= 12
            ? "优先建立火箭数量"
            : scanCheck.ok
              && getAiRoundNumber() >= 3
              && Math.max(0, aiNumber(currentPlayer?.resources?.score)) < 25
              && launchCandidate.available
              && Number(launchCandidate.score || 0) >= 10
                ? "低于25分时优先发射建立得分路线"
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
        directScoreGain: scanDirectScoreGain,
        scoreCapReason: scanScoreCapReason,
        valueBreakdown: {
          directScoreGain: scanDirectScoreGain,
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
      const bestPlayCardBreakdown = bestPlayCardCandidate?.valueBreakdown || {};
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
        finalFormulaDeltas: bestPlayCardCandidate?.finalFormulaDeltas || null,
        directScoreGain: Math.max(0, aiNumber(bestPlayCardCandidate?.directScoreGain)),
        finalMarkCashoutIncluded: true,
        score: applyAiStrategyWeight(bestPlayCardScore, "engine", 0.5),
        valueBreakdown: {
          directScoreGain: Math.max(0, aiNumber(bestPlayCardCandidate?.directScoreGain)),
          c2Type3ProgressValue: Math.max(0, aiNumber(bestPlayCardBreakdown.c2Type3ProgressValue)),
          cFinalTaskProgressValue: Math.max(0, aiNumber(bestPlayCardBreakdown.cFinalTaskProgressValue)),
          endGameExpectedScore: Math.max(0, aiNumber(bestPlayCardBreakdown.endGameExpectedScore)),
          playCardConversionPressure: Math.max(0, aiNumber(bestPlayCardBreakdown.playCardConversionPressure)),
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
      candidates.push(...listAiEmergencyAnalyzeEnergyTradeCandidates(currentPlayer));
      candidates.push(...listAiFinalAnalyzeEnergyTradeCandidates(currentPlayer));
      candidates.push(...listAiThirdFinalMarkResourceTradeCandidates(currentPlayer));
      candidates.push(...listAiMainUnlockTradeCandidates(currentPlayer, playCardCandidates));
      candidates.push(...listAiLateResourceRecoveryTradeCandidates(currentPlayer));
      candidates.push(...listAiDataPlacementCandidates(currentPlayer));
      candidates.push(...listAiRunezuFaceSymbolQuickCandidates(currentPlayer));
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

    function applyAiTurnActionSelectionPressure(candidates = []) {
      const round = getAiRoundNumber();
      const bestContinuation = (candidates || [])
        .filter((candidate) => (
          candidate?.available !== false
          && candidate.id !== "end-turn"
          && candidate.id !== "pass"
        ))
        .reduce((best, candidate) => {
          const score = aiNumber(candidate.score);
          if (!Number.isFinite(score) || score <= best.score) return best;
          return {
            score,
            id: candidate.id || null,
            kind: candidate.kind || null,
          };
        }, { score: -Infinity, id: null, kind: null });

      return (candidates || []).map((candidate) => {
        if (!candidate || candidate.available === false) return candidate;
        let adjusted = candidate;
        const explicitScore = aiNumber(candidate.score);
        const graphNet = Number(candidate.actionGraph?.net);
        if (
          candidate.kind === "quick"
          && Number.isFinite(explicitScore)
          && explicitScore > 0
          && candidate.actionGraph
          && (!Number.isFinite(graphNet) || graphNet < explicitScore)
        ) {
          adjusted = {
            ...adjusted,
            actionGraph: {
              ...adjusted.actionGraph,
              net: explicitScore,
            },
            selectionAdjustment: {
              ...(adjusted.selectionAdjustment || {}),
              quickScoreFloor: Math.round((explicitScore - (Number.isFinite(graphNet) ? graphNet : 0)) * 100) / 100,
            },
          };
        }

        if (
          (candidate.id === "end-turn" || candidate.id === "pass")
          && Number.isFinite(bestContinuation.score)
          && bestContinuation.score > 1
        ) {
          const pressure = Math.min(
            round >= FINAL_ROUND_NUMBER ? 24 : 16,
            Math.max(0, bestContinuation.score) * (round >= FINAL_ROUND_NUMBER ? 1.25 : 0.9)
              + (bestContinuation.score >= 6 ? 3 : 1),
          );
          const currentScore = Number.isFinite(explicitScore) ? explicitScore : 0;
          const currentNet = Number(adjusted.actionGraph?.net);
          adjusted = {
            ...adjusted,
            score: currentScore - pressure,
            actionGraph: adjusted.actionGraph
              ? {
                ...adjusted.actionGraph,
                net: (Number.isFinite(currentNet) ? currentNet : currentScore) - pressure,
              }
              : adjusted.actionGraph,
            selectionAdjustment: {
              ...(adjusted.selectionAdjustment || {}),
              continuationPenalty: Math.round(pressure * 100) / 100,
              bestContinuation,
              originalScore: Math.round(currentScore * 100) / 100,
            },
          };
        }
        return adjusted;
      });
    }

    function executeAiTurnAction(action, currentPlayer = getCurrentPlayer()) {
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
      if (action.id === "runezuFaceSymbol") {
        return runAiRunezuFaceSymbolQuickActionDecision(action);
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
        return confirmDataPlacement(action.target, action.blueSlot);
      }
      if (action.id === "quickTrade") {
        return runQuickTrade(action.tradeId);
      }
      if (action.id === "pass") {
        return passForCurrentPlayer();
      }
      return { ok: false, message: `AI 尚不支持行动 ${action.id}` };
    }

    function shouldRetryAiTurnAction(action, result) {
      if (!action || action.id === "end-turn" || action.id === "pass") return false;
      return result?.ok === false && !result.blocked && !result.progressed;
    }

    function rejectAiTurnActionCandidate(candidates, action, result) {
      return (candidates || []).map((candidate) => (
        candidate === action
          ? {
            ...candidate,
            available: false,
            reason: result?.message || candidate.reason || "AI 执行前二次校验失败",
            rejectedByAiExecution: true,
          }
          : candidate
      ));
    }

    function runAiTurnActionDecision() {
      const currentPlayer = getCurrentPlayer();
      if (!isAiAutoBattlePlayer(currentPlayer?.id)) {
        return { ok: false, blocked: true, message: `${currentPlayer?.colorLabel || "当前玩家"}不是电脑玩家` };
      }
      const rawCandidates = enumerateAiTurnActions();
      const markedFinalFormulas = getAiMarkedFinalFormulaEntries(currentPlayer);
      const traceCompetition = getAiTraceCompetitionState(currentPlayer);
      const graphState = {
        playerState,
        turnState,
        alienGameState,
        finalScoringState,
        currentPlayer,
        aiMarkedFinalFormulas: markedFinalFormulas,
        aiTraceCompetition: traceCompetition,
      };
      const graphCandidates = ai?.actionGraph?.buildActionGraph
        ? ai.actionGraph.buildActionGraph(rawCandidates, graphState, currentPlayer?.id, {
          markedFormulas: markedFinalFormulas,
          hasMarkedFinalTile: markedFinalFormulas.length > 0,
          traceCompetition,
        })
        : null;
      const graphAdjustedCandidates = Array.isArray(graphCandidates) && graphCandidates.length === rawCandidates.length
        ? graphCandidates.map((candidate, index) => {
          const adjustedCandidate = adjustAiActionGraphCandidateForStyle(
            rawCandidates[index],
            adjustAiActionGraphCandidate(rawCandidates[index], candidate, currentPlayer),
            currentPlayer,
            markedFinalFormulas,
          );
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
      const candidates = applyAiTurnActionSelectionPressure(graphAdjustedCandidates);
      let selectableCandidates = candidates;
      const rejectedActions = [];
      const maxAttempts = Math.max(1, candidates.length);

      for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
        const action = ai?.policy?.chooseTurnAction?.(selectableCandidates, {
          playerState,
          turnState,
          currentPlayer,
        }) || null;
        if (!action) {
          if (!rawCandidates.length && state.actionHistoryHasSession && !state.pendingActionExecuted) {
            const recovery = recoverPendingActionFromOpenHistoryForAi?.();
            if (recovery?.ok) {
              endCurrentTurn();
              recordAiAutoBattleLog("turn-action", `${currentPlayer.colorLabel}AI 恢复并结束当前行动`, {
                recovery,
                sessionInfo: state.actionHistorySessionInfo || null,
              });
              return {
                ok: true,
                progressed: true,
                action: { id: "end-turn-recovered" },
                recovery,
              };
            }
          }
          return {
            ok: false,
            blocked: true,
            message: rejectedActions.length ? "AI 候选均执行失败" : "AI 没有可执行行动",
            candidates: selectableCandidates,
            rejectedActions,
          };
        }
        recordAiAutoBattleLog("turn-action", `${currentPlayer.colorLabel}AI 执行 ${action.id}`, {
          action,
          candidates: selectableCandidates,
        });
        const result = executeAiTurnAction(action, currentPlayer);
        if (shouldRetryAiTurnAction(action, result)) {
          rejectedActions.push({
            id: action.id || null,
            reason: result?.message || null,
            action,
          });
          recordAiAutoBattleLog("turn-action-retry", `${currentPlayer.colorLabel}AI 剔除失效行动 ${action.id}`, {
            action,
            result,
          });
          selectableCandidates = rejectAiTurnActionCandidate(selectableCandidates, action, result);
          continue;
        }
        return result;
      }

      return {
        ok: false,
        blocked: true,
        message: "AI 候选均执行失败",
        candidates: selectableCandidates,
        rejectedActions,
      };
    }

    function runAiActionEffectStep() {
      if (!state.pendingActionEffectFlow) return null;
      const effect = getCurrentActionEffect();
      const playerId = getEffectOwnerPlayer(effect)?.id || state.pendingActionEffectFlow.playerId || playerState.currentPlayerId;
      if (playerId && !isAiAutoBattlePlayer(playerId)) {
        return { ok: false, blocked: true, message: `${getPlayerLabelById(playerId)}需要人工处理效果` };
      }
      if (!effect) return null;
      if (effect.status && effect.status !== "active") {
        recordAiAutoBattleLog("effect", `AI 推进已${effect.status === "completed" ? "完成" : "处理"}效果：${effect.label || effect.type}`, {
          logPlayerId: playerId || null,
          effectId: effect.id || null,
          effectType: effect.type || null,
          effectStatus: effect.status,
        });
        activateNextActionEffect?.();
        return { ok: true, progressed: true, advancedCompletedEffect: true };
      }
      if (
        effect.type === cardEffects.EFFECT_TYPES.CARD_MOVE
        || effect.type === cardEffects.EFFECT_TYPES.FREE_MOVE
      ) {
        const nextEffect = getAiNextActionEffect();
        const effectPlayer = getEffectOwnerPlayer(effect) || getCurrentPlayer();
        const movableTokens = effectPlayer?.id ? getMovableTokensForPlayer(effectPlayer.id) : [];
        if (!movableTokens.length) {
          if (effect.type === cardEffects.EFFECT_TYPES.CARD_MOVE && isAiLandingEffect(nextEffect)) {
            return { ok: false, blocked: true, message: `${effect.label || "卡牌移动"}：没有可移动的飞船完成后续登陆` };
          }
          const message = `${effect.label || "移动效果"}：没有可移动的飞船，已跳过`;
          recordAiAutoBattleLog("move-path-skip", `${getPlayerLabelById(playerId)}AI 跳过移动效果`, {
            effectId: effect.id || null,
            effectType: effect.type || null,
            playerId: effectPlayer?.id || null,
            message,
          });
          skipCurrentActionEffect?.();
          return { ok: true, progressed: true, skipped: true, message };
        }
      }
      if (effect.type === cardEffects.EFFECT_TYPES.CARD_MOVE) {
        const nextEffect = getAiNextActionEffect();
        const candidates = listAiEffectMoveCandidates({
          id: "cardMove",
          effect,
          poolRemaining: effect?.options?.movementPoints ?? 1,
          nextEffect,
        });
        if (!candidates.length) {
          if (isAiLandingEffect(nextEffect)) {
            return { ok: false, blocked: true, message: `${effect.label || "卡牌移动"}：没有可移动的飞船完成后续登陆` };
          }
          const message = `${effect.label || "卡牌移动"}：没有可用移动路径，已跳过`;
          recordAiAutoBattleLog("move-path-skip", `${getPlayerLabelById(playerId)}AI 跳过卡牌移动效果`, {
            effectId: effect.id || null,
            effectType: effect.type || null,
            message,
          });
          skipCurrentActionEffect?.();
          return { ok: true, progressed: true, skipped: true, message };
        }
      }
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

        const alienUseResult = runAiAlienUseDecision();
        if (alienUseResult) return alienUseResult;

        const alienTraceResult = runAiAlienTraceDecision();
        if (alienTraceResult) return alienTraceResult;

        if (!isActionEffectFlowActive()) {
          const earlyReadyBanrenmaResult = runAiReadyBanrenmaOpportunityOpenDecision();
          if (earlyReadyBanrenmaResult) return earlyReadyBanrenmaResult;
        }

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

        if (isActionEffectFlowActive() && !hasActivePendingSubFlow()) {
          const activeEffectResult = runAiActionEffectStep();
          if (activeEffectResult) return activeEffectResult;
        }

        const readyBanrenmaResult = runAiReadyBanrenmaOpportunityOpenDecision();
        if (readyBanrenmaResult) return readyBanrenmaResult;

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

    function waitAiAutoBattleDelay(delayMs, options = {}) {
      const delay = Math.max(0, Math.round(Number(delayMs) || 0));
      if (delay <= 0 && !options.forceYield) return Promise.resolve();
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
      const yieldEverySteps = Math.max(0, Math.round(Number(options.yieldEverySteps ?? 80) || 0));
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
        if (typeof options.onStep === "function") {
          options.onStep({
            steps: summary.steps,
            roundNumber: turnState.roundNumber,
            turnNumber: turnState.turnNumber,
            currentPlayerId: playerState.currentPlayerId,
          });
        }
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
        await waitAiAutoBattleDelay(delayMs, {
          forceYield: Math.max(0, Math.round(Number(delayMs) || 0)) <= 0
            && yieldEverySteps > 0
            && summary.steps % yieldEverySteps === 0,
        });
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

    function getAiCandidateRankScore(candidate = {}) {
      const graphNet = Number(candidate.actionGraph?.net);
      if (Number.isFinite(graphNet)) return graphNet;
      const explicitScore = Number(candidate.score);
      return Number.isFinite(explicitScore) ? explicitScore : 0;
    }

    function summarizeAiTurnActionCandidate(candidate = {}) {
      const breakdown = candidate.breakdown || candidate.valueBreakdown || null;
      const compactBreakdown = breakdown
        ? Object.fromEntries(Object.entries(breakdown).filter(([, value]) => (
          Number.isFinite(Number(value)) || typeof value === "string" || typeof value === "boolean"
        )).map(([key, value]) => [
          key,
          Number.isFinite(Number(value)) ? roundAiScore(value) : value,
        ]))
        : null;
      return {
        id: candidate.id || null,
        tradeId: candidate.tradeId || null,
        label: candidate.label || candidate.cardLabel || candidate.planetName || null,
        score: roundAiScore(getAiCandidateRankScore(candidate)),
        directScoreGain: roundAiScore(candidate.directScoreGain || 0),
        finalMarginal: roundAiScore(candidate.actionGraph?.finalMarginal ?? candidate.finalMarginal ?? 0),
        goalBonus: roundAiScore(candidate.actionGraph?.goalBonus ?? candidate.goalBonus ?? 0),
        reason: candidate.reason || null,
        breakdown: compactBreakdown,
      };
    }

    function buildAiLowMarkPlayerDiagnostics(report = {}) {
      const players = Array.isArray(report.playerResults) ? report.playerResults : [];
      const logs = Array.isArray(report.logs) ? report.logs : [];
      const lowPlayers = [...players]
        .filter((player) => (
          Number.isFinite(Number(player.finalMarkCount))
          && (aiNumber(player.finalMarkCount) < 3 || aiNumber(player.baseScore) < 70)
        ))
        .sort((left, right) => (
          aiNumber(left.finalMarkCount) - aiNumber(right.finalMarkCount)
          || aiNumber(left.baseScore) - aiNumber(right.baseScore)
          || aiNumber(left.finalScore) - aiNumber(right.finalScore)
        ));
      return lowPlayers.map((lowPlayer) => {
        const lowLogs = logs.filter((entry) => (
          String(entry.playerId || "") === String(lowPlayer.playerId || "")
          || (lowPlayer.playerLabel && String(entry.message || "").includes(lowPlayer.playerLabel))
        ));
        const turnActionLogs = lowLogs.filter((entry) => entry.type === "turn-action");
        const playCardTail = lowLogs
          .filter((entry) => (
            entry.type === "play-card"
            || entry.type === "card-corner"
            || entry.type === "alien-trace"
            || entry.type === "scan-target"
          ))
          .slice(-16)
          .map((entry) => ({
            type: entry.type,
            roundNumber: entry.roundNumber,
            turnNumber: entry.turnNumber,
            message: entry.message,
            details: (entry.type === "alien-trace" || entry.type === "scan-target") ? entry.details : undefined,
          }));
        const actionCounts = turnActionLogs.reduce((counts, entry) => {
          const actionId = entry.details?.action?.id || "unknown";
          counts[actionId] = (counts[actionId] || 0) + 1;
          return counts;
        }, {});
        const selectedActionTail = turnActionLogs.slice(-40).map((entry) => {
          const candidates = Array.isArray(entry.details?.candidates)
            ? [...entry.details.candidates]
              .filter((candidate) => candidate?.available !== false)
              .sort((left, right) => getAiCandidateRankScore(right) - getAiCandidateRankScore(left))
              .slice(0, 3)
              .map(summarizeAiTurnActionCandidate)
            : [];
          return {
            roundNumber: entry.roundNumber,
            turnNumber: entry.turnNumber,
            action: summarizeAiTurnActionCandidate(entry.details?.action || {}),
            resources: entry.playerResources || null,
            topCandidates: candidates,
          };
        });

        return {
          playerId: lowPlayer.playerId || null,
          playerLabel: lowPlayer.playerLabel || null,
          finalScore: lowPlayer.finalScore,
          baseScore: lowPlayer.baseScore,
          tileScore: lowPlayer.tileScore,
          finalMarkCount: lowPlayer.finalMarkCount,
          finalFormulas: lowPlayer.finalFormulas || [],
          resources: lowPlayer.resources || null,
          income: lowPlayer.income || null,
          actionCounts,
          passCount: actionCounts.pass || 0,
          selectedActionTail,
          playCardTail,
        };
      });
    }

    function compactAiAutoBattleSample(report, gameIndex) {
      const analysis = report?.analysis || null;
      const lowMarkPlayerDiagnosticsList = buildAiLowMarkPlayerDiagnostics(report);
      return {
        gameIndex,
        summary: report?.lastSummary || null,
        seed: report?.lastSummary?.seed || null,
        bugCount: Array.isArray(report?.bugs) ? report.bugs.length : 0,
        playerResults: report?.playerResults || [],
        pendingState: report?.pendingState || null,
        lowMarkPlayerDiagnostics: lowMarkPlayerDiagnosticsList[0] || null,
        lowMarkPlayerDiagnosticsList,
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
      createAiControlSnapshot,
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
      isAiAutomationPaused,
      isAiAutoBattlePlayer,
      listCardTriggerFreeMoveCandidates,
      recordAiAutoBattleLog,
      resetAiStrategyWeights,
      restoreAiControlSnapshot,
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
