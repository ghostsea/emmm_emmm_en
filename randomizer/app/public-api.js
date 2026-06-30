(function (root, factory) {
  "use strict";

  const api = factory(root);

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.SetiAppPublicApi = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function (root) {
  "use strict";

  function createPublicApi(context) {
    if (!context) {
      throw new Error("createPublicApi requires app context");
    }

    const {
      structuredClone = root.structuredClone,
      solar,
      rocketActions,
      planetReferenceLayout,
      planetStats,
      abilities,
      tech,
      data,
      aliens,
      solarState,
      alienGameState,
      finalScoringState,
      playerState,
      turnState,
      rocketState,
      planetStatsState,
      techGameState,
      cardState,
      actionHistory,
      setupSelectionState,
      randomizeAll,
      rotateSolarOrbit,
      launchRocketForCurrentPlayer,
      orbitForCurrentPlayer,
      landForCurrentPlayer,
      addDebugIncome,
      addDebugScore,
      executeIncomeForCurrentPlayer,
      addDebugData,
      addDebugCardByInput,
      fillDebugNebulaData,
      toggleSectorWinDebug,
      beginSectorScan,
      openDebugQuickSectorScanPicker,
      runDebugQuickSectorScan,
      beginPublicDeckScan,
      beginHandScan,
      replaceNebulaDataForCurrentPlayer,
      switchCurrentPlayerColor,
      runPlaceDataToComputer,
      analyzeDataForCurrentPlayer,
      handleFinalScoreTileClick,
      openAlienTracePicker,
      maybeRevealAlienAfterTrace,
      getCurrentPlayer,
      handleJiuzheRevealSideEffects,
      handleYichangdianRevealSideEffects,
      handleFangzhouRevealSideEffects,
      handleBanrenmaRevealSideEffects,
      handleChongRevealSideEffects,
      handleAmibaRevealSideEffects,
      handleAomomoRevealSideEffects,
      handleRunezuRevealSideEffects,
      renderAlienPanels,
      renderRockets,
      renderPlayerStats,
      renderStateReadout,
      revealJiuzheForDebug,
      revealYichangdianForDebug,
      revealFangzhouForDebug,
      revealBanrenmaForDebug,
      revealChongForDebug,
      revealAmibaForDebug,
      revealAomomoForDebug,
      revealRunezuForDebug,
      randomizeAliens,
      startInitialSelection,
      configureAiAutoBattle,
      configureAiStrategyWeights,
      resetAiStrategyWeights,
      applyAiStrategyTuning,
      getAiStrategyWeights,
      getAiStrategyTuningHistory,
      clearAiStrategyTuningHistory,
      getAiStrategyTuningRecommendation,
      applyAiStrategyTuningRecommendation,
      runAiAutoBattle,
      runAiAutoBattleBatch,
      runAiStrategyABTest,
      runAiStrategyTuningCycle,
      stopAiAutoBattle,
      runAiAutomationStep,
      getAiAutoBattleReport,
      getAiAutoBattleAnalysis,
      drawCardForCurrentPlayer,
      blindDrawCardForPlayer,
      beginCardSelection,
      beginDiscardSelection,
      beginPlayCardSelection,
      beginIncomeForCurrentPlayer,
      cancelCardSelection,
      cancelDiscardSelection,
      cancelPlayCardSelection,
      pickPublicCardForCurrentPlayer,
      handleHandCardPlay,
      discardCardFromCurrentPlayer,
      undoPendingAction,
      endCurrentTurn,
      passForCurrentPlayer,
      runAction,
      runQuickTrade,
      toggleQuickPanel,
      moveRocket,
      moveActiveRocket,
      getBoardPointFromClientPosition,
      getPolarPointFromClientPosition,
      createRocketSnapshot,
      buildPlanetOrbitLandReferenceData,
      syncPlanetOrbitLandMarkers,
      createActionContext,
      getPlanetsReferencePointFromClientPosition,
      getPlanetsReferenceDimensions,
      renderRocketElement,
      updateActionButtons,
      getRoundOrderPlayerIds,
      getRecoverableActionLog,
      createActionLogRecoveryPackage,
      getActionLogMarkdown,
      downloadActionLogMarkdown,
      createGameRecoverySnapshot,
      applyGameRecoverySnapshot,
      recoverFromActionLog,
      getSetupState,
      toggleCheatMode,
      researchTechForCurrentPlayer,
      finalizeTechTakeResult,
    } = context;

    return {
      randomize: randomizeAll,
      rotateSolarOrbit,
      launchRocket: launchRocketForCurrentPlayer,
      orbitRocket: orbitForCurrentPlayer,
      landRocket: landForCurrentPlayer,
      addDebugIncome,
      addDebugScore,
      executeIncomeForCurrentPlayer,
      addDebugData,
      addDebugCardByInput,
      fillDebugNebulaData,
      toggleSectorWinDebug,
      beginSectorScan,
      openDebugQuickSectorScanPicker,
      runDebugQuickSectorScan,
      beginPublicDeckScan,
      beginHandScan,
      replaceNebulaDataForCurrentPlayer,
      switchCurrentPlayerColor,
      getNebulaSlotLayoutOverrides: () => structuredClone(data.listNebulaSlotLayoutOverrides()),
      getSectorWinMarkerLayoutOverrides: () => structuredClone(data.listSectorWinMarkerLayoutOverrides?.() || []),
      placeDataToComputer: runPlaceDataToComputer,
      analyzeDataForCurrentPlayer,
      getDataSlotLayoutOverrides: () => structuredClone(data.listSlotLayoutOverrides()),
      getAlienTraceLayoutOverrides: () => structuredClone(aliens.listTraceMarkerLayoutOverrides()),
      getAlienExtraTraceLayoutOverrides: () => structuredClone(aliens.listExtraTraceMarkerLayoutOverrides()),
      getJiuzheTraceLayoutOverrides: () => structuredClone(aliens.listJiuzheTraceMarkerLayoutOverrides?.() || []),
      getYichangdianTraceLayoutOverrides: () => structuredClone(aliens.listYichangdianTraceMarkerLayoutOverrides?.() || []),
      getFangzhouTraceLayoutOverrides: () => structuredClone(aliens.listFangzhouTraceMarkerLayoutOverrides?.() || []),
      getChongTraceLayoutOverrides: () => structuredClone(aliens.listChongTraceMarkerLayoutOverrides?.() || []),
      getAmibaTraceLayoutOverrides: () => structuredClone(aliens.listAmibaTraceMarkerLayoutOverrides?.() || []),
      getAmibaSymbolLayoutOverrides: () => structuredClone(aliens.listAmibaSymbolMarkerLayoutOverrides?.() || []),
      getAomomoTraceLayoutOverrides: () => structuredClone(aliens.listAomomoTraceMarkerLayoutOverrides?.() || []),
      getAomomoOrbitLayoutOverrides: () => structuredClone(aliens.listAomomoOrbitMarkerLayoutOverrides?.() || []),
      getAomomoLandingLayoutOverrides: () => structuredClone(aliens.listAomomoLandingMarkerLayoutOverrides?.() || []),
      getRunezuTraceLayoutOverrides: () => structuredClone(aliens.listRunezuTraceMarkerLayoutOverrides?.() || []),
      getRunezuPanelSymbolLayoutOverrides: () => structuredClone(aliens.listRunezuPanelSymbolMarkerLayoutOverrides?.() || []),
      getRunezuFaceSymbolLayoutOverrides: () => structuredClone(aliens.listRunezuFaceSymbolMarkerLayoutOverrides?.() || []),
      getAlienState: () => structuredClone(alienGameState),
      revealJiuzheForDebug,
      revealYichangdianForDebug,
      revealFangzhouForDebug,
      revealBanrenmaForDebug,
      revealChongForDebug,
      revealAmibaForDebug,
      revealAomomoForDebug,
      revealRunezuForDebug,
      getFinalScoringState: () => structuredClone(finalScoringState),
      markFinalScoreTile: handleFinalScoreTileClick,
      openAlienTracePicker,
      placeAlienFirstTrace: (alienSlotId, traceType, playerColor) => {
        const result = aliens.placeFirstTrace(
          alienGameState,
          alienSlotId,
          traceType,
          playerColor || getCurrentPlayer().color,
        );
        const revealResult = maybeRevealAlienAfterTrace(alienSlotId, result);
        const sideEffect = handleJiuzheRevealSideEffects(Number(alienSlotId), revealResult, getCurrentPlayer())
          || handleYichangdianRevealSideEffects(Number(alienSlotId), revealResult, getCurrentPlayer())
          || handleFangzhouRevealSideEffects(Number(alienSlotId), revealResult, getCurrentPlayer())
          || handleBanrenmaRevealSideEffects(Number(alienSlotId), revealResult, getCurrentPlayer())
          || handleChongRevealSideEffects(Number(alienSlotId), revealResult, getCurrentPlayer())
          || handleAmibaRevealSideEffects(Number(alienSlotId), revealResult, getCurrentPlayer())
          || handleAomomoRevealSideEffects(Number(alienSlotId), revealResult, getCurrentPlayer())
          || handleRunezuRevealSideEffects(Number(alienSlotId), revealResult, getCurrentPlayer());
        if (sideEffect?.message) {
          rocketState.statusNote = sideEffect.message;
        }
        renderAlienPanels();
        renderRockets();
        renderPlayerStats();
        renderStateReadout();
        return revealResult || result;
      },
      placeAlienExtraTrace: (alienSlotId, traceType) => {
        const result = aliens.addExtraTrace(alienGameState, alienSlotId, traceType);
        renderAlienPanels();
        renderStateReadout();
        return result;
      },
      revealAlien: (alienSlotId, alienId) => {
        const result = aliens.revealAlien(alienGameState, alienSlotId, alienId);
        const sideEffect = handleJiuzheRevealSideEffects(Number(alienSlotId), result, getCurrentPlayer())
          || handleYichangdianRevealSideEffects(Number(alienSlotId), result, getCurrentPlayer())
          || handleFangzhouRevealSideEffects(Number(alienSlotId), result, getCurrentPlayer())
          || handleBanrenmaRevealSideEffects(Number(alienSlotId), result, getCurrentPlayer())
          || handleChongRevealSideEffects(Number(alienSlotId), result, getCurrentPlayer())
          || handleAmibaRevealSideEffects(Number(alienSlotId), result, getCurrentPlayer())
          || handleAomomoRevealSideEffects(Number(alienSlotId), result, getCurrentPlayer())
          || handleRunezuRevealSideEffects(Number(alienSlotId), result, getCurrentPlayer());
        if (sideEffect?.message) result.message = sideEffect.message;
        renderAlienPanels();
        renderRockets();
        renderPlayerStats();
        renderStateReadout();
        return result;
      },
      randomizeAliens,
      startInitialSelection,
      getInitialSelectionState: () => structuredClone(setupSelectionState),
      configureAiAutoBattle,
      configureAiStrategyWeights,
      resetAiStrategyWeights,
      applyAiStrategyTuning,
      getAiStrategyWeights,
      getAiStrategyTuningHistory,
      clearAiStrategyTuningHistory,
      getAiStrategyTuningRecommendation,
      applyAiStrategyTuningRecommendation,
      startAiAutoBattle: runAiAutoBattle,
      runAiAutoBattleBatch,
      runAiStrategyABTest,
      runAiStrategyTuningCycle,
      stopAiAutoBattle,
      runAiAutoBattleStep: runAiAutomationStep,
      getAiAutoBattleReport,
      getAiAutoBattleAnalysis,
      drawCardForCurrentPlayer,
      blindDrawCardForPlayer,
      beginCardSelection,
      beginDiscardSelection,
      beginPlayCardSelection,
      beginIncomeForCurrentPlayer,
      cancelCardSelection,
      cancelDiscardSelection,
      cancelPlayCardSelection,
      pickPublicCardForCurrentPlayer,
      playHandCard: handleHandCardPlay,
      discardCardFromCurrentPlayer,
      playerState,
      cardState,
      actionHistory,
      undoPendingAction,
      endCurrentTurn,
      passTurn: passForCurrentPlayer,
      runAction,
      runQuickTrade,
      toggleQuickPanel,
      moveRocket,
      moveActiveRocket,
      getSectorLaunchSlots: (x, y) => solar.getSectorLaunchSlots(x, y),
      getSectorLaunchSlot: (x, y, slotIndex) => solar.getSectorLaunchSlot(x, y, slotIndex),
      getSectorOccupancy: () => rocketActions.serializeSectorOccupancy(rocketState),
      screenToBoardPoint: (clientX, clientY) => getBoardPointFromClientPosition(clientX, clientY),
      screenToPolarPoint: (clientX, clientY) => getPolarPointFromClientPosition(clientX, clientY),
      solarGridToGlobalPoint: (x, y) => solar.solarGridToGlobalPoint(x, y),
      solarGridToPolarPoint: (x, y) => solar.solarGridToPolarPoint(x, y),
      polarToGlobalPoint: (radius, angleDegrees) => solar.polarToGlobalPoint(radius, angleDegrees),
      globalPointToPolarPoint: (point) => solar.globalPointToPolarPoint(point),
      getSolarCellBoundary: (x, y) => solar.getSolarCellBoundary(x, y),
      getSolarCellBoundaries: () => solar.collectSolarCellBoundaries(),
      getSectorCoordinateBoundary: (x, y) => solar.getSectorCoordinateBoundary(x, y),
      getSectorCoordinateBoundaries: () => solar.collectSectorCoordinateBoundaries(),
      resolveSectorCoordinateFromPolarPoint: (point) => solar.resolveSectorCoordinateFromPolarPoint(point),
      resolveSectorCoordinateFromGlobalPoint: (point) => solar.resolveSectorCoordinateFromGlobalPoint(point),
      resolveVisibleContent: (x, y) => solar.resolveVisibleContent(x, y, solarState),
      getSolarSnapshot: () => solar.createSolarSnapshot(solarState),
      getWheelCoordinateReport: () => solar.collectWheelCoordinateReport(solarState),
      getVisibleCoordinateReport: () => solar.collectVisibleCoordinateReport(solarState),
      getVisibleCoordinateGroups: () => solar.collectVisibleCoordinateGroups(solarState),
      getRocketCoordinates: () => structuredClone(rocketState.rockets.map(createRocketSnapshot)),
      getPlanetReferenceCenters: () => structuredClone(planetReferenceLayout.PLANET_REFERENCE_CENTERS),
      getPlanetOrbitLandReferenceData: () => structuredClone(buildPlanetOrbitLandReferenceData()),
      getGeneratedPlanetReferencePlacements: () => structuredClone(planetReferenceLayout.listAllOrbitLandSlots()),
      getPlanetOrbitLandMarkers: () => structuredClone(
        planetReferenceLayout.PLANET_ORDER.flatMap((planetId) => {
          const orbitMarkers = planetStats.getPlanetOrbitMarkers(planetStatsState, planetId).map((marker) => ({
            planetId,
            kind: "orbit",
            ...marker,
          }));
          const landingMarkers = planetStats.getPlanetLandingMarkers(planetStatsState, planetId).map((marker) => ({
            planetId,
            kind: "land",
            ...marker,
          }));
          return [...orbitMarkers, ...landingMarkers];
        }),
      ),
      syncPlanetOrbitLandMarkers,
      getSatelliteLandingMarkers: () => structuredClone(
        planetReferenceLayout.PLANETS_WITH_SATELLITES.flatMap((planetId) => (
          planetStats.getSatelliteLandingMarkers(planetStatsState, planetId).map((marker) => ({
            planetId,
            ...marker,
          }))
        )),
      ),
      getLandOptions: () => structuredClone(abilities.planet.getLandOptions(createActionContext())),
      clientToPlanetsReferencePoint: (clientX, clientY) => getPlanetsReferencePointFromClientPosition(clientX, clientY),
      placeRocketAtBoardPoint: (rocketId, x, y) => {
        const result = rocketActions.placeRocketAtBoardPoint(rocketState, rocketId, { x, y });
        if (result.rocket) renderRocketElement(result.rocket);
        updateActionButtons();
        renderStateReadout();
        return result;
      },
      placeRocketAtPlanetsReferencePoint: (rocketId, x, y) => {
        const dimensions = getPlanetsReferenceDimensions();
        const result = rocketActions.placeRocketAtPlanetsReferencePoint(rocketState, rocketId, {
          x,
          y,
          ...dimensions,
        });
        if (result.rocket) renderRocketElement(result.rocket);
        updateActionButtons();
        renderStateReadout();
        return result;
      },
      getPlayerState: () => structuredClone(playerState),
      getTurnState: () => structuredClone({
        ...turnState,
        roundOrderPlayerIds: getRoundOrderPlayerIds(),
        currentPlayerId: playerState.currentPlayerId,
      }),
      getActionLog: (options = {}) => getRecoverableActionLog(options),
      getActionLogRecoveryPackage: createActionLogRecoveryPackage,
      getActionLogMarkdown,
      downloadActionLogMarkdown,
      createRecoverySnapshot: createGameRecoverySnapshot,
      restoreRecoverySnapshot: applyGameRecoverySnapshot,
      recoverFromActionLog,
      getPlanetStatsState: () => structuredClone(planetStatsState),
      getCurrentPlayer: () => structuredClone(getCurrentPlayer()),
      getAiDebugState: () => structuredClone({
        playerState,
        turnState,
        rocketState,
        alienGameState,
        finalScoringState,
        cardState,
        currentPlayerId: playerState.currentPlayerId,
      }),
      getState: () => structuredClone({
        ...solarState,
        players: playerState.players,
        currentPlayerId: playerState.currentPlayerId,
        turnState,
        planetStats: planetStatsState,
        rockets: rocketState.rockets.map(createRocketSnapshot),
        setup: getSetupState(),
        solarSystem: solar.createSolarSnapshot(solarState),
      }),
      getSetupState,
      toggleCheatMode,
      getTechSnapshot: () => tech.getSnapshot(techGameState),
      researchTech: researchTechForCurrentPlayer,
      takeTechTile: (tileId, blueSlot) => {
        const result = blueSlot == null
          ? tech.requestTakeTech(createActionContext(), techGameState, tileId)
          : tech.confirmBlueSlotChoice(createActionContext(), techGameState, tileId, blueSlot);
        if (result.ok && !result.needsBlueSlotChoice) finalizeTechTakeResult(result);
        else renderStateReadout();
        return result;
      },
    };
  }

  return { createPublicApi };
});
