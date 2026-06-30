(function (root, factory) {
  "use strict";

  const api = factory(root);

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.SetiAppEvents = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function (root) {
  "use strict";

  function bindAppEvents(context) {
    if (!context || !context.els) {
      throw new Error("bindAppEvents requires app context");
    }

    const {
      window: windowRef = root,
      document: documentRef = root.document,
      state,
      els,
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
      rocketState,
      techGameState,
      techRenderContext,
      alienGameState,
      randomizeAll,
      startNewGameFromStartScreen,
      continueGameFromStartScreen,
      syncStartScreenDebugOption,
      handleStartAlienOptionChange,
      handleStartIndustryOptionChange,
      handleMainActionButtonClick,
      cancelTechSelection,
      confirmLandTargetPicker,
      cancelLandTargetPicker,
      toggleQuickPanel,
      passForCurrentPlayer,
      endCurrentTurn,
      undoPendingAction,
      runQuickTrade,
      runPlaceDataToComputer,
      confirmDataPlacement,
      cancelDataPlacePicker,
      skipPendingDataPlacement,
      handleDebugQuickSectorScanChoice,
      handleJiuzheCardChoice,
      handleJiuzheOpportunitySkip,
      handleYichangdianCardGainChoice,
      handleBanrenmaCardGainChoice,
      handleChongCardGainChoice,
      handleChongFossilChoice,
      handleChongTaskCompletionChoice,
      handleAmibaCardGainChoice,
      handleAomomoCardGainChoice,
      handleAmibaSymbolChoice,
      handleAmibaTraceRemovalChoice,
      handleRunezuCardGainChoice,
      handleRunezuFaceSymbolChoice,
      handleRunezuSymbolBranchChoice,
      handleBanrenmaBonusChoice,
      handleBanrenmaCardConditionChoice,
      handleYichangdianCornerChoice,
      handleCardTriggerChoice,
      cancelCardTriggerChoice,
      confirmCardTaskCompletion,
      handleProbeSectorScanChoice,
      confirmProbeSectorScanSelection,
      handleProbeLocationRewardChoice,
      handleOptionalHandScanChoice,
      handleDrawnHandScanSkip,
      handleRemovePlanetMarkerChoice,
      handleHandCornerChoice,
      handleConditionalSectorChoice,
      handleDiscardIncomeCardChoice,
      confirmDiscardAnyForIncome,
      handlePayCreditChoice,
      handleFundamentalismExchangeChoice,
      handleDiscardCornerRepeatChoice,
      handleRemoveOrbitToProbeChoice,
      handleReturnUnfinishedTaskChoice,
      confirmStrategyPassiveSlotChoice,
      cancelStrategyPassiveSlotChoice,
      confirmScanTarget,
      closeBanrenmaOpportunityDialog,
      closeJiuzheCardDialog,
      closeScanTargetPicker,
      beginJiuzheTraceGridPlacement,
      beginBanrenmaTraceGridPlacement,
      routeFangzhouAlienTraceGain,
      beginChongTraceGridPlacement,
      beginAmibaTraceGridPlacement,
      beginAomomoTraceGridPlacement,
      beginRunezuTraceGridPlacement,
      beginYichangdianTraceGridPlacement,
      renderAlienTracePickerColorStep,
      openFangzhouTraceUseChoice,
      handleFangzhouTraceDestinationChoice,
      handleFangzhouUnlockTraceChoice,
      confirmFangzhouCard2Unlock,
      beginFangzhouTraceGridPlacement,
      confirmAlienRevealNotice,
      handleStateTraceSlotPlacement,
      handleFangzhouTraceSlotPlacement,
      confirmAlienTracePlacement,
      closeAlienTracePicker,
      confirmBanrenmaTracePlacement,
      confirmYichangdianTracePlacement,
      confirmFangzhouTracePlacement,
      confirmChongTracePlacement,
      confirmAmibaTracePlacement,
      confirmAomomoTracePlacement,
      confirmRunezuTracePlacement,
      openRunezuFaceSymbolPlacement,
      confirmJiuzheTracePlacement,
      handleScanAction4Choice,
      closeScanAction4Picker,
      handleActionEffectButtonClick,
      skipCurrentActionEffect,
      executeFreeMoveForCardTrigger,
      executeIndustryFreeMove,
      executeFreeMoveForCardCorner,
      executeFreeMoveForScanAction4,
      executeCardMoveForEffect,
      moveRocket,
      handleBoardPointerDown,
      handleFinalScoreTileClick,
      openFinalResultDialog,
      downloadActionLogMarkdown,
      minimizeFinalResultDialog,
      closeFinalResultDialog,
      setDebugOpen,
      setDebugPlayerMenuOpen,
      switchCurrentPlayerColor,
      rotateSolarOrbit,
      settleCardTasksAfterEffect,
      addDebugIncome,
      promptDebugGainCard,
      addDebugScore,
      toggleSectorWinDebug,
      toggleDebugAlienTraceMode,
      isDebugAlienTraceMode,
      revealJiuzheForDebug,
      focusJiuzheDebugCalibration,
      revealYichangdianForDebug,
      focusYichangdianDebugCalibration,
      revealFangzhouForDebug,
      focusFangzhouDebugCalibration,
      revealBanrenmaForDebug,
      focusBanrenmaDebugCalibration,
      revealChongForDebug,
      focusChongDebugCalibration,
      revealAmibaForDebug,
      focusAmibaDebugCalibration,
      revealAomomoForDebug,
      focusAomomoDebugCalibration,
      revealRunezuForDebug,
      openFangzhouCard1Dialog,
      handlePublicBlindDrawClick,
      handlePublicCardClick,
      selectPassReserveCard,
      confirmPassReserveSelection,
      dismissPassReserveSelectionOverlay,
      cancelCardSelection,
      confirmPublicScanSelection,
      cancelDiscardSelection,
      confirmPlayCardSelection,
      cancelPlayCardSelection,
      confirmCardCornerQuickAction,
      cancelHandScanSelection,
      getCurrentPlayer,
      isAiAutomationInputLocked,
      blockManualAiAutomationInput,
      openJiuzheCardDialog,
      openBanrenmaCardConditionCompletionPicker,
      openCardTaskCompletionPicker,
      confirmMovePayment,
      cancelMovePaymentSelection,
      isDiscardSelectionActive,
      handleHandCardDiscard,
      isMovePaymentSelectionActive,
      handleHandCardMovePayment,
      isHandScanSelectionActive,
      handleHandScanCardClick,
      isIndustryFutureSpanHandSelectionActive,
      handleIndustryFutureSpanHandClick,
      isIndustryHandSelectionActive,
      handleIndustryDeepspaceHandClick,
      isPlayCardSelectionActive,
      handlePlayCardSelect,
      handleHandCardCornerQuickAction,
      toggleCheatMode,
      confirmTechBlueSlotChoice,
      closeTechBlueSlotPicker,
      renderStateReadout,
      syncTechRenderContext,
      handleSupplyTechTileClick,
      setLogOpen,
      setReportTab,
      renderAlienPanels,
      renderSectorNebulaDataBoard,
      logAomomoDebugCoordinates,
      resize,
    } = context;

    if (!state) {
      throw new Error("bindAppEvents requires mutable app state accessors");
    }

    els.startScreenStartButton?.addEventListener("click", startNewGameFromStartScreen);
    els.startScreenContinueButton?.addEventListener("click", () => {
      if (els.startScreenContinueButton.disabled) return;
      continueGameFromStartScreen();
    });
    els.startDebugEnabled?.addEventListener("change", syncStartScreenDebugOption);
    els.startAlienOptions?.addEventListener("change", handleStartAlienOptionChange);
    els.startIndustryOptions?.addEventListener("change", handleStartIndustryOptionChange);
    els.spinButton?.addEventListener("click", randomizeAll);
    els.actionBarMain?.addEventListener("click", handleMainActionButtonClick);
    els.techSelectionCancel?.addEventListener("click", cancelTechSelection);
    els.landTargetConfirm?.addEventListener("click", confirmLandTargetPicker);
    els.landTargetCancel?.addEventListener("click", cancelLandTargetPicker);
    els.landTargetOverlay?.addEventListener("click", (event) => {
      if (event.target === els.landTargetOverlay) cancelLandTargetPicker();
    });
    els.actionQuickButton.addEventListener("click", toggleQuickPanel);
    els.actionPassButton?.addEventListener("click", () => {
      if (els.actionPassButton.disabled) return;
      passForCurrentPlayer();
    });
    els.actionConfirmButton?.addEventListener("click", () => {
      if (els.actionConfirmButton.disabled) return;
      endCurrentTurn();
    });
    els.actionUndoButton?.addEventListener("click", () => {
      if (els.actionUndoButton.disabled) return;
      undoPendingAction();
    });
    els.finalResultButton?.addEventListener("click", openFinalResultDialog);
    els.finalResultDownloadLog?.addEventListener("click", () => downloadActionLogMarkdown({ allowIncomplete: true }));
    els.finalResultMinimize?.addEventListener("click", minimizeFinalResultDialog);
    els.finalResultOverlay?.addEventListener("click", (event) => {
      if (event.target === els.finalResultOverlay) closeFinalResultDialog();
    });
    els.quickActionsTrades.addEventListener("click", (event) => {
      const button = event.target.closest("[data-quick-trade]");
      if (!button || button.disabled) return;
      runQuickTrade(button.dataset.quickTrade);
    });
    els.playerBoardDataLayer?.addEventListener("click", (event) => {
      const token = event.target.closest(".data-token-pool");
      if (!token) return;
      runPlaceDataToComputer();
    });
    els.dataPlaceActions?.addEventListener("click", (event) => {
      const skipButton = event.target.closest("[data-place-skip]");
      if (skipButton && !skipButton.disabled) {
        skipPendingDataPlacement();
        return;
      }
      const button = event.target.closest("[data-place-target]");
      if (!button) return;
      confirmDataPlacement(button.dataset.placeTarget, button.dataset.blueSlot);
    });
    els.dataPlaceCancel?.addEventListener("click", cancelDataPlacePicker);
    els.dataPlaceOverlay?.addEventListener("click", (event) => {
      if (event.target === els.dataPlaceOverlay) {
        cancelDataPlacePicker();
      }
    });
    els.scanTargetActions?.addEventListener("click", (event) => {
      const debugSectorButton = event.target.closest("[data-debug-sector-scan-step]");
      if (debugSectorButton && !debugSectorButton.disabled) {
        handleDebugQuickSectorScanChoice(debugSectorButton);
        return;
      }

      const jiuzheChoice = event.target.closest("[data-jiuzhe-card-choice]");
      if (jiuzheChoice && !jiuzheChoice.disabled) {
        handleJiuzheCardChoice(jiuzheChoice.dataset.jiuzheCardChoice);
        return;
      }

      const jiuzheSkip = event.target.closest("[data-jiuzhe-opportunity-skip]");
      if (jiuzheSkip && !jiuzheSkip.disabled) {
        handleJiuzheOpportunitySkip();
        return;
      }

      const yichangdianGain = event.target.closest("[data-yichangdian-card-gain]");
      if (yichangdianGain && !yichangdianGain.disabled) {
        handleYichangdianCardGainChoice(yichangdianGain.dataset.yichangdianCardGain);
        return;
      }

      const banrenmaGain = event.target.closest("[data-banrenma-card-gain]");
      if (banrenmaGain && !banrenmaGain.disabled) {
        handleBanrenmaCardGainChoice(banrenmaGain.dataset.banrenmaCardGain);
        return;
      }

      const chongGain = event.target.closest("[data-chong-card-gain]");
      if (chongGain && !chongGain.disabled) {
        handleChongCardGainChoice(chongGain.dataset.chongCardGain);
        return;
      }

      const chongFossil = event.target.closest("[data-chong-fossil-choice]");
      if (chongFossil && !chongFossil.disabled) {
        handleChongFossilChoice(chongFossil.dataset.chongFossilChoice);
        return;
      }

      const chongTask = event.target.closest("[data-chong-task-complete]");
      if (chongTask && !chongTask.disabled) {
        handleChongTaskCompletionChoice(chongTask.dataset.chongTaskComplete);
        return;
      }

      const amibaGain = event.target.closest("[data-amiba-card-gain]");
      if (amibaGain && !amibaGain.disabled) {
        handleAmibaCardGainChoice(amibaGain.dataset.amibaCardGain);
        return;
      }

      const aomomoGain = event.target.closest("[data-aomomo-card-gain]");
      if (aomomoGain && !aomomoGain.disabled) {
        handleAomomoCardGainChoice(aomomoGain.dataset.aomomoCardGain);
        return;
      }

      const amibaSymbol = event.target.closest("[data-amiba-symbol-choice]");
      if (amibaSymbol && !amibaSymbol.disabled) {
        handleAmibaSymbolChoice(amibaSymbol.dataset.amibaSymbolChoice);
        return;
      }

      const amibaTraceRemove = event.target.closest("[data-amiba-trace-remove]");
      if (amibaTraceRemove && !amibaTraceRemove.disabled) {
        handleAmibaTraceRemovalChoice(amibaTraceRemove.dataset.amibaTraceRemove);
        return;
      }

      const runezuGain = event.target.closest("[data-runezu-card-gain]");
      if (runezuGain && !runezuGain.disabled) {
        handleRunezuCardGainChoice(runezuGain.dataset.runezuCardGain);
        return;
      }

      const runezuFaceSymbol = event.target.closest("[data-runezu-face-symbol-choice]");
      if (runezuFaceSymbol && !runezuFaceSymbol.disabled) {
        handleRunezuFaceSymbolChoice(runezuFaceSymbol.dataset.runezuFaceSymbolChoice);
        return;
      }

      const runezuBranch = event.target.closest("[data-runezu-symbol-branch]");
      if (runezuBranch && !runezuBranch.disabled) {
        handleRunezuSymbolBranchChoice(runezuBranch.dataset.runezuSymbolBranch);
        return;
      }

      const banrenmaBonus = event.target.closest("[data-banrenma-bonus-choice]");
      if (banrenmaBonus && !banrenmaBonus.disabled) {
        handleBanrenmaBonusChoice(banrenmaBonus.dataset.banrenmaBonusChoice);
        return;
      }

      const banrenmaCard = event.target.closest("[data-banrenma-card-choice]");
      if (banrenmaCard && !banrenmaCard.disabled) {
        handleBanrenmaCardConditionChoice(banrenmaCard.dataset.banrenmaCardChoice);
        return;
      }

      const yichangdianCorner = event.target.closest("[data-yichangdian-corner-card-id]");
      if (yichangdianCorner && !yichangdianCorner.disabled) {
        handleYichangdianCornerChoice(yichangdianCorner.dataset.yichangdianCornerCardId);
        return;
      }

      const cardTriggerButton = event.target.closest("[data-card-trigger-choice]");
      if (cardTriggerButton && !cardTriggerButton.disabled) {
        handleCardTriggerChoice(cardTriggerButton.dataset.cardTriggerChoice);
        return;
      }

      const cardTaskButton = event.target.closest("[data-card-task-complete]");
      if (cardTaskButton && !cardTaskButton.disabled) {
        confirmCardTaskCompletion(cardTaskButton.dataset.cardTaskComplete);
        return;
      }

      const probeScanButton = event.target.closest("[data-probe-scan-rocket-id]");
      if (probeScanButton && !probeScanButton.disabled) {
        handleProbeSectorScanChoice(probeScanButton.dataset.probeScanRocketId);
        return;
      }

      const probeScanConfirm = event.target.closest("[data-probe-scan-confirm]");
      if (probeScanConfirm && !probeScanConfirm.disabled) {
        confirmProbeSectorScanSelection();
        return;
      }

      const probeLocationReward = event.target.closest("[data-probe-location-reward-rocket-id]");
      if (probeLocationReward && !probeLocationReward.disabled) {
        handleProbeLocationRewardChoice(probeLocationReward.dataset.probeLocationRewardRocketId);
        return;
      }

      const optionalHandScan = event.target.closest("[data-optional-hand-scan]");
      if (optionalHandScan && !optionalHandScan.disabled) {
        handleOptionalHandScanChoice(optionalHandScan.dataset.optionalHandScan);
        return;
      }

      const drawnHandScanSkip = event.target.closest("[data-drawn-hand-scan-skip]");
      if (drawnHandScanSkip && !drawnHandScanSkip.disabled) {
        handleDrawnHandScanSkip();
        return;
      }

      const planetMarkerChoice = event.target.closest("[data-planet-marker-choice]");
      if (planetMarkerChoice && !planetMarkerChoice.disabled) {
        handleRemovePlanetMarkerChoice(planetMarkerChoice.dataset.planetMarkerChoice);
        return;
      }

      const handCornerChoice = event.target.closest("[data-hand-corner-choice]");
      if (handCornerChoice && !handCornerChoice.disabled) {
        handleHandCornerChoice(handCornerChoice.dataset.handCornerChoice);
        return;
      }

      const conditionalSector = event.target.closest("[data-conditional-sector-x]");
      if (conditionalSector && !conditionalSector.disabled) {
        handleConditionalSectorChoice(conditionalSector.dataset.conditionalSectorX);
        return;
      }

      const discardIncomeCard = event.target.closest("[data-discard-income-card-id]");
      if (discardIncomeCard && !discardIncomeCard.disabled) {
        handleDiscardIncomeCardChoice(discardIncomeCard.dataset.discardIncomeCardId);
        return;
      }

      const discardIncomeConfirm = event.target.closest("[data-discard-income-confirm]");
      if (discardIncomeConfirm && !discardIncomeConfirm.disabled) {
        confirmDiscardAnyForIncome();
        return;
      }

      const payCreditChoice = event.target.closest("[data-pay-credit-choice]");
      if (payCreditChoice && !payCreditChoice.disabled) {
        handlePayCreditChoice(payCreditChoice.dataset.payCreditChoice);
        return;
      }

      const fundamentalismExchange = event.target.closest("[data-fundamentalism-exchange]");
      if (fundamentalismExchange && !fundamentalismExchange.disabled) {
        handleFundamentalismExchangeChoice(fundamentalismExchange.dataset.fundamentalismExchange);
        return;
      }

      const discardCornerCard = event.target.closest("[data-discard-corner-card-id]");
      if (discardCornerCard && !discardCornerCard.disabled) {
        handleDiscardCornerRepeatChoice(discardCornerCard.dataset.discardCornerCardId);
        return;
      }

      const removeOrbitToProbe = event.target.closest("[data-remove-orbit-to-probe]");
      if (removeOrbitToProbe && !removeOrbitToProbe.disabled) {
        handleRemoveOrbitToProbeChoice(removeOrbitToProbe.dataset.removeOrbitToProbe);
        return;
      }

      const returnTaskCard = event.target.closest("[data-return-task-card-id]");
      if (returnTaskCard && !returnTaskCard.disabled) {
        handleReturnUnfinishedTaskChoice(returnTaskCard.dataset.returnTaskCardId);
        return;
      }

      const strategySlotChoice = event.target.closest("[data-strategy-slot-choice]");
      if (strategySlotChoice && !strategySlotChoice.disabled) {
        confirmStrategyPassiveSlotChoice(strategySlotChoice.dataset.strategySlotChoice);
        return;
      }

      const button = event.target.closest("[data-nebula-id]");
      if (!button || button.disabled || !button.dataset.nebulaId) return;
      confirmScanTarget(button.dataset.nebulaId, button.dataset.sectorX);
    });
    els.scanTargetCancel?.addEventListener("click", () => {
      if (state.pendingChongTaskCompletion) {
        handleChongTaskCompletionChoice("cancel");
        return;
      }
      if (state.pendingChongFossilChoice) {
        handleChongFossilChoice("cancel");
        return;
      }
      if (state.pendingChongCardGain) {
        handleChongCardGainChoice("cancel");
        return;
      }
      if (state.pendingAmibaTraceRemoval) {
        handleAmibaTraceRemovalChoice("cancel");
        return;
      }
      if (state.pendingAmibaSymbolChoice) {
        handleAmibaSymbolChoice("cancel");
        return;
      }
      if (state.pendingAmibaCardGain) {
        handleAmibaCardGainChoice("cancel");
        return;
      }
      if (state.pendingAomomoCardGain) {
        handleAomomoCardGainChoice("cancel");
        return;
      }
      if (state.pendingRunezuFaceSymbolPlacement) {
        handleRunezuFaceSymbolChoice("cancel");
        return;
      }
      if (state.pendingRunezuSymbolBranch) {
        handleRunezuSymbolBranchChoice("cancel");
        return;
      }
      if (state.pendingRunezuCardGain) {
        handleRunezuCardGainChoice("cancel");
        return;
      }
      if (state.pendingBanrenmaCardGain) {
        handleBanrenmaCardGainChoice("cancel");
        return;
      }
      if (state.pendingBanrenmaOpportunity) {
        closeBanrenmaOpportunityDialog();
        return;
      }
      if (state.pendingYichangdianCardGain) {
        handleYichangdianCardGainChoice("cancel");
        return;
      }
      if (state.pendingJiuzheCardPlay?.reason === "view") {
        closeJiuzheCardDialog();
        return;
      }
      if (state.pendingJiuzheCardPlay) {
        return;
      }
      if (state.pendingStrategyPassiveSlotChoice) {
        cancelStrategyPassiveSlotChoice();
        return;
      }
      if (state.pendingCardTriggerAction) {
        cancelCardTriggerChoice();
        return;
      }
      if (state.pendingScanTargetAction?.type === "hand_scan" && state.pendingScanTargetAction.discardDrawnOnSkip) {
        handleDrawnHandScanSkip();
        return;
      }
      closeScanTargetPicker();
    });
    els.scanTargetOverlay?.addEventListener("click", (event) => {
      if (event.target === els.scanTargetOverlay) {
        if (state.pendingChongTaskCompletion) {
          handleChongTaskCompletionChoice("cancel");
          return;
        }
        if (state.pendingChongFossilChoice) {
          handleChongFossilChoice("cancel");
          return;
        }
        if (state.pendingChongCardGain) {
          handleChongCardGainChoice("cancel");
          return;
        }
        if (state.pendingAmibaTraceRemoval) {
          handleAmibaTraceRemovalChoice("cancel");
          return;
        }
        if (state.pendingAmibaSymbolChoice) {
          handleAmibaSymbolChoice("cancel");
          return;
        }
        if (state.pendingAmibaCardGain) {
          handleAmibaCardGainChoice("cancel");
          return;
        }
        if (state.pendingAomomoCardGain) {
          handleAomomoCardGainChoice("cancel");
          return;
        }
        if (state.pendingRunezuFaceSymbolPlacement) {
          handleRunezuFaceSymbolChoice("cancel");
          return;
        }
        if (state.pendingRunezuSymbolBranch) {
          handleRunezuSymbolBranchChoice("cancel");
          return;
        }
        if (state.pendingRunezuCardGain) {
          handleRunezuCardGainChoice("cancel");
          return;
        }
        if (state.pendingBanrenmaCardGain) {
          handleBanrenmaCardGainChoice("cancel");
          return;
        }
        if (state.pendingBanrenmaOpportunity) {
          closeBanrenmaOpportunityDialog();
          return;
        }
        if (state.pendingYichangdianCardGain) {
          handleYichangdianCardGainChoice("cancel");
          return;
        }
        if (state.pendingJiuzheCardPlay?.reason === "view") {
          closeJiuzheCardDialog();
          return;
        }
        if (state.pendingJiuzheCardPlay) {
          return;
        }
        if (state.pendingStrategyPassiveSlotChoice) {
          cancelStrategyPassiveSlotChoice();
          return;
        }
        if (state.pendingCardTriggerAction) {
          cancelCardTriggerChoice();
          return;
        }
        if (state.pendingScanTargetAction?.type === "hand_scan" && state.pendingScanTargetAction.discardDrawnOnSkip) {
          handleDrawnHandScanSkip();
          return;
        }
        closeScanTargetPicker();
      }
    });
    els.alienTraceActions?.addEventListener("click", (event) => {
      const revealConfirmButton = event.target.closest("[data-alien-reveal-confirm]");
      if (revealConfirmButton && !revealConfirmButton.disabled) {
        confirmAlienRevealNotice();
        return;
      }

      const button = event.target.closest("[data-alien-picker-step][data-alien-slot]");
      if (!button || button.disabled) return;

      const alienSlotId = Number(button.dataset.alienSlot);
      const pickerStep = button.dataset.alienPickerStep;
      const allowedTraceTypes = state.alienTracePickerState?.allowedTraceTypes || aliens.TRACE_TYPES;
      const alienSlot = aliens.getAlienSlot(alienGameState, alienSlotId);
      const useJiuzheGrid = jiuzhe?.isJiuzheRevealedSlot?.(alienGameState, alienSlotId)
        || (alienSlot?.revealed && alienSlot.alienId === aliens.JIUZHE_ALIEN_ID);
      const useYichangdianGrid = yichangdian?.isYichangdianRevealedSlot?.(alienGameState, alienSlotId)
        || (alienSlot?.revealed && alienSlot.alienId === aliens.YICHANGDIAN_ALIEN_ID);
      const useFangzhouGrid = fangzhou?.isFangzhouRevealedSlot?.(alienGameState, alienSlotId)
        || (alienSlot?.revealed && alienSlot.alienId === aliens.FANGZHOU_ALIEN_ID);
      const useBanrenmaGrid = banrenma?.isBanrenmaRevealedSlot?.(alienGameState, alienSlotId)
        || (alienSlot?.revealed && alienSlot.alienId === aliens.BANRENMA_ALIEN_ID);
      const useChongGrid = chong?.isChongRevealedSlot?.(alienGameState, alienSlotId)
        || (alienSlot?.revealed && alienSlot.alienId === aliens.CHONG_ALIEN_ID);
      const useAmibaGrid = amiba?.isAmibaRevealedSlot?.(alienGameState, alienSlotId)
        || (alienSlot?.revealed && alienSlot.alienId === aliens.AMIBA_ALIEN_ID);
      const useAomomoGrid = aomomo?.isAomomoRevealedSlot?.(alienGameState, alienSlotId)
        || (alienSlot?.revealed && alienSlot.alienId === aliens.AOMOMO_ALIEN_ID);
      const useRunezuGrid = runezu?.isRunezuRevealedSlot?.(alienGameState, alienSlotId)
        || (alienSlot?.revealed && alienSlot.alienId === aliens.RUNEZU_ALIEN_ID);

      if (pickerStep === "alien") {
        if (useJiuzheGrid) {
          beginJiuzheTraceGridPlacement(alienSlotId);
          return;
        }
        if (useBanrenmaGrid) {
          beginBanrenmaTraceGridPlacement(alienSlotId);
          return;
        }
        if (useFangzhouGrid) {
          routeFangzhouAlienTraceGain(alienSlotId);
          return;
        }
        if (useChongGrid) {
          beginChongTraceGridPlacement(alienSlotId);
          return;
        }
        if (useAmibaGrid) {
          beginAmibaTraceGridPlacement(alienSlotId);
          return;
        }
        if (useAomomoGrid) {
          beginAomomoTraceGridPlacement(alienSlotId);
          return;
        }
        if (useRunezuGrid) {
          beginRunezuTraceGridPlacement(alienSlotId);
          return;
        }
        if (useYichangdianGrid) {
          beginYichangdianTraceGridPlacement(alienSlotId);
          return;
        }
        if (allowedTraceTypes.length === 1) {
          confirmAlienTracePlacement(alienSlotId, allowedTraceTypes[0]);
          return;
        }
        state.alienTracePickerState = { ...state.alienTracePickerState, selectedAlienSlotId: alienSlotId };
        renderAlienTracePickerColorStep(alienSlotId);
        return;
      }

      if (pickerStep === "fangzhou-color" && button.dataset.traceType) {
        openFangzhouTraceUseChoice(alienSlotId, button.dataset.traceType);
        return;
      }

      if (pickerStep === "fangzhou-destination") {
        handleFangzhouTraceDestinationChoice(
          button.dataset.fangzhouDestination,
          button.dataset.traceType || null,
        );
        return;
      }

      if (pickerStep === "fangzhou-unlock-color" && button.dataset.traceType) {
        handleFangzhouUnlockTraceChoice(button.dataset.traceType);
        return;
      }

      if (pickerStep === "fangzhou-use" && button.dataset.traceType) {
        if (button.dataset.fangzhouUse === "unlock") {
          confirmFangzhouCard2Unlock(alienSlotId, button.dataset.traceType);
          return;
        }
        if (button.dataset.fangzhouPlaceKind === "state") {
          confirmAlienTracePlacement(alienSlotId, button.dataset.traceType);
          return;
        }
        if (button.dataset.fangzhouPlaceKind === "fangzhou-trace") {
          confirmFangzhouTracePlacement(
            alienSlotId,
            button.dataset.traceType,
            Number(button.dataset.fangzhouPosition),
          );
          return;
        }
        beginFangzhouTraceGridPlacement(alienSlotId, button.dataset.traceType);
        return;
      }

      if (pickerStep === "color" && button.dataset.traceType) {
        confirmAlienTracePlacement(alienSlotId, button.dataset.traceType);
      }
    });
    els.alienTraceCancel?.addEventListener("click", () => {
      if (state.pendingAlienRevealConfirmation) return;
      closeAlienTracePicker();
    });
    els.alienTraceOverlay?.addEventListener("click", (event) => {
      if (event.target === els.alienTraceOverlay) {
        if (state.pendingAlienRevealConfirmation) return;
        closeAlienTracePicker();
      }
    });
    els.alienTraceLayers?.forEach((layer) => {
      layer.addEventListener("click", (event) => {
        const button = event.target.closest("[data-state-trace-slot]");
        if (!button || button.disabled || !button.classList.contains("is-placeable")) return;
        handleStateTraceSlotPlacement(
          Number(button.dataset.alienSlot),
          button.dataset.traceType,
        );
      });
    });
    els.alienJiuzheTraceLayers?.forEach((layer) => {
      layer.addEventListener("click", (event) => {
        const banrenmaButton = event.target.closest("[data-banrenma-trace-slot]");
        if (banrenmaButton && !banrenmaButton.disabled && banrenmaButton.classList.contains("is-placeable")) {
          confirmBanrenmaTracePlacement(
            Number(banrenmaButton.dataset.alienSlot),
            banrenmaButton.dataset.traceType,
            Number(banrenmaButton.dataset.banrenmaPosition),
          );
          return;
        }
        const yichangdianButton = event.target.closest("[data-yichangdian-trace-slot]");
        if (yichangdianButton && !yichangdianButton.disabled && yichangdianButton.classList.contains("is-placeable")) {
          confirmYichangdianTracePlacement(
            Number(yichangdianButton.dataset.alienSlot),
            yichangdianButton.dataset.traceType,
            Number(yichangdianButton.dataset.yichangdianPosition),
          );
          return;
        }
        const fangzhouButton = event.target.closest("[data-fangzhou-trace-slot]");
        if (fangzhouButton && !fangzhouButton.disabled && fangzhouButton.classList.contains("is-placeable")) {
          handleFangzhouTraceSlotPlacement(
            Number(fangzhouButton.dataset.alienSlot),
            fangzhouButton.dataset.traceType,
            Number(fangzhouButton.dataset.fangzhouPosition),
          );
          return;
        }
        const chongButton = event.target.closest("[data-chong-trace-slot]");
        if (chongButton && !chongButton.disabled && chongButton.classList.contains("is-placeable")) {
          confirmChongTracePlacement(
            Number(chongButton.dataset.alienSlot),
            chongButton.dataset.traceType,
            Number(chongButton.dataset.chongPosition),
          );
          return;
        }
        const amibaButton = event.target.closest("[data-amiba-trace-slot]");
        if (amibaButton && !amibaButton.disabled && amibaButton.classList.contains("is-placeable")) {
          confirmAmibaTracePlacement(
            Number(amibaButton.dataset.alienSlot),
            amibaButton.dataset.traceType,
            Number(amibaButton.dataset.amibaPosition),
          );
          return;
        }
        const aomomoButton = event.target.closest("[data-aomomo-trace-slot]");
        if (aomomoButton && !aomomoButton.disabled && aomomoButton.classList.contains("is-placeable")) {
          confirmAomomoTracePlacement(
            Number(aomomoButton.dataset.alienSlot),
            aomomoButton.dataset.traceType,
            Number(aomomoButton.dataset.aomomoPosition),
          );
          return;
        }
        const runezuButton = event.target.closest("[data-runezu-trace-slot]");
        if (runezuButton && !runezuButton.disabled && runezuButton.classList.contains("is-placeable")) {
          confirmRunezuTracePlacement(
            Number(runezuButton.dataset.alienSlot),
            runezuButton.dataset.traceType,
            Number(runezuButton.dataset.runezuPosition),
          );
          return;
        }
        const runezuFaceButton = event.target.closest("[data-runezu-face-symbol-slot]");
        if (runezuFaceButton && !runezuFaceButton.disabled && runezuFaceButton.classList.contains("is-placeable")) {
          openRunezuFaceSymbolPlacement(
            Number(runezuFaceButton.dataset.alienSlot),
            Number(runezuFaceButton.dataset.runezuFaceSymbolPosition),
          );
          return;
        }
        const button = event.target.closest("[data-jiuzhe-trace-slot]");
        if (!button || button.disabled || !button.classList.contains("is-placeable")) return;
        confirmJiuzheTracePlacement(
          Number(button.dataset.alienSlot),
          button.dataset.traceType,
          Number(button.dataset.jiuzhePosition),
        );
      });
    });
    els.scanAction4Actions?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-scan-action4-choice]");
      if (!button || button.disabled) return;
      handleScanAction4Choice(button.dataset.scanAction4Choice);
    });
    els.scanAction4Cancel?.addEventListener("click", closeScanAction4Picker);
    els.scanAction4Overlay?.addEventListener("click", (event) => {
      if (event.target === els.scanAction4Overlay) {
        closeScanAction4Picker();
      }
    });
    els.actionEffectList?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-effect-index]");
      if (!button || button.disabled) return;
      handleActionEffectButtonClick(Number(button.dataset.effectIndex));
    });
    els.actionEffectSkipButton?.addEventListener("click", skipCurrentActionEffect);
    els.tokenLayer?.addEventListener("click", (event) => {
      if (event.target.closest(".rocket-token")) {
        event.stopPropagation();
      }
    });
    els.moveArrowLayer?.addEventListener("pointerdown", (event) => {
      const button = event.target.closest("[data-move-x]");
      if (!button || state.moveHighlightRocketId == null) return;
      event.stopPropagation();
      event.preventDefault();
      if (isAiAutomationInputLocked?.()) {
        blockManualAiAutomationInput?.("电脑玩家自动移动中");
        return;
      }
      if (state.pendingCardTriggerFreeMove) {
        executeFreeMoveForCardTrigger(
          Number(button.dataset.moveX),
          Number(button.dataset.moveY),
          state.moveHighlightRocketId,
        );
        return;
      }
      if (state.industryFreeMoveState) {
        executeIndustryFreeMove(
          Number(button.dataset.moveX),
          Number(button.dataset.moveY),
          state.moveHighlightRocketId,
        );
        return;
      }
      if (state.pendingCardCornerFreeMove) {
        executeFreeMoveForCardCorner(
          Number(button.dataset.moveX),
          Number(button.dataset.moveY),
          state.moveHighlightRocketId,
        );
        return;
      }
      if (state.pendingActionEffectFlow?.freeMoveMode) {
        executeFreeMoveForScanAction4(
          Number(button.dataset.moveX),
          Number(button.dataset.moveY),
          state.moveHighlightRocketId,
        );
        return;
      }
      if (state.pendingActionEffectFlow?.cardMoveEffect) {
        executeCardMoveForEffect(
          Number(button.dataset.moveX),
          Number(button.dataset.moveY),
          state.moveHighlightRocketId,
        );
        return;
      }
      moveRocket(Number(button.dataset.moveX), Number(button.dataset.moveY), state.moveHighlightRocketId);
    });
    els.wheelWrap.addEventListener("pointerdown", handleBoardPointerDown);
    els.finalScoreGrid?.addEventListener("click", (event) => {
      const tile = event.target.closest(".final-score-tile-wrap[data-final-id]");
      if (!tile || tile.disabled) return;
      handleFinalScoreTileClick(tile.dataset.finalId);
    });
    els.debugToggle.addEventListener("click", () => {
      setDebugOpen(els.appWrap.classList.contains("debug-collapsed"));
    });
    els.debugPlayerSwitchButton?.addEventListener("click", () => {
      setDebugPlayerMenuOpen(els.debugPlayerMenu?.hidden);
    });
    els.debugPlayerMenu?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-player-color]");
      if (!button) return;
      switchCurrentPlayerColor(button.dataset.playerColor);
    });
    els.debugRotateButton.addEventListener("click", () => {
      const result = rotateSolarOrbit(1);
      settleCardTasksAfterEffect({ events: result.events, render: true });
    });
    els.debugIncomeButton.addEventListener("click", addDebugIncome);
    els.debugGainCardButton?.addEventListener("click", promptDebugGainCard);
    els.debugScoreButton?.addEventListener("click", addDebugScore);
    els.debugSectorWinButton?.addEventListener("click", toggleSectorWinDebug);
    els.debugAlienTraceButton?.addEventListener("click", toggleDebugAlienTraceMode);
    els.reservedCardFan?.addEventListener("click", (event) => {
      const unlockButton = event.target.closest("[data-fangzhou-unlock]");
      if (!unlockButton || unlockButton.disabled || !isDebugAlienTraceMode()) return;
      const traceType = unlockButton.dataset.fangzhouUnlock;
      const alienSlotId = alienGameState.fangzhou?.revealedSlotId || 2;
      confirmFangzhouCard2Unlock(alienSlotId, traceType);
    });
    els.debugJiuzheButton?.addEventListener("click", () => {
      const result = revealJiuzheForDebug();
      if (result?.ok) focusJiuzheDebugCalibration(1);
    });
    els.debugYichangdianButton?.addEventListener("click", () => {
      const result = revealYichangdianForDebug();
      if (result?.ok) focusYichangdianDebugCalibration(1);
    });
    els.debugFangzhouButton?.addEventListener("click", () => {
      const result = revealFangzhouForDebug();
      if (result?.ok) focusFangzhouDebugCalibration(1);
    });
    els.debugBanrenmaButton?.addEventListener("click", () => {
      const result = revealBanrenmaForDebug();
      if (result?.ok) focusBanrenmaDebugCalibration(1);
    });
    els.debugChongButton?.addEventListener("click", () => {
      const result = revealChongForDebug();
      if (result?.ok) focusChongDebugCalibration(1);
    });
    els.debugAmibaButton?.addEventListener("click", () => {
      const result = revealAmibaForDebug();
      if (result?.ok) focusAmibaDebugCalibration(1);
    });
    els.debugAomomoButton?.addEventListener("click", () => {
      const result = revealAomomoForDebug();
      if (result?.ok) focusAomomoDebugCalibration(1);
    });
    els.debugRunezuButton?.addEventListener("click", () => {
      revealRunezuForDebug();
    });
    documentRef.addEventListener("click", (event) => {
      const viewButton = event.target.closest("[data-fangzhou-card-view]");
      if (!viewButton) return;
      openFangzhouCard1Dialog(Number(viewButton.dataset.fangzhouCardView));
    });
    els.publicBlindDrawButton?.addEventListener("click", handlePublicBlindDrawClick);
    els.publicCardRow?.addEventListener("click", (event) => {
      const target = event.target.closest("[data-public-slot]");
      if (!target) return;
      handlePublicCardClick(Number(target.dataset.publicSlot));
    });
    els.passReserveSelectionGrid?.addEventListener("click", (event) => {
      const target = event.target.closest("[data-pass-reserve-card-id]");
      if (!target) return;
      selectPassReserveCard(target.dataset.passReserveCardId);
    });
    els.passReserveSelectionConfirm?.addEventListener("click", () => {
      if (els.passReserveSelectionConfirm.disabled) return;
      confirmPassReserveSelection();
    });
    els.passReserveSelectionOverlay?.addEventListener("click", (event) => {
      if (event.target === els.passReserveSelectionOverlay) {
        dismissPassReserveSelectionOverlay();
      }
    });
    els.cardSelectionCancel?.addEventListener("click", cancelCardSelection);
    els.cardSelectionBackdrop?.addEventListener("click", cancelCardSelection);
    els.publicScanConfirm?.addEventListener("click", confirmPublicScanSelection);
    els.discardSelectionCancel?.addEventListener("click", cancelDiscardSelection);
    els.discardSelectionBackdrop?.addEventListener("click", cancelDiscardSelection);
    els.playCardActionButton?.addEventListener("click", confirmPlayCardSelection);
    els.playCardSelectionCancel?.addEventListener("click", cancelPlayCardSelection);
    els.cardCornerActionButton?.addEventListener("click", confirmCardCornerQuickAction);
    els.handScanCancel?.addEventListener("click", cancelHandScanSelection);
    els.reservedCardFan?.addEventListener("click", (event) => {
      const jiuzheButton = event.target.closest("[data-jiuzhe-cards]");
      if (jiuzheButton) {
        openJiuzheCardDialog(getCurrentPlayer());
        return;
      }
      const banrenmaButton = event.target.closest("[data-banrenma-reserved-index]");
      if (banrenmaButton && !banrenmaButton.disabled) {
        const currentPlayer = getCurrentPlayer();
        const card = currentPlayer?.reservedCards?.[Number(banrenmaButton.dataset.banrenmaReservedIndex)];
        if (card) openBanrenmaCardConditionCompletionPicker(card);
        return;
      }
      const button = event.target.closest("[data-reserved-index]");
      if (!button || button.disabled) return;
      const currentPlayer = getCurrentPlayer();
      const card = currentPlayer?.reservedCards?.[Number(button.dataset.reservedIndex)];
      if (card) openCardTaskCompletionPicker(card);
    });
    els.movePaymentConfirm?.addEventListener("click", confirmMovePayment);
    els.movePaymentCancel?.addEventListener("click", cancelMovePaymentSelection);
    els.playerHandFan?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-hand-index]");
      if (!button || button.disabled) return;
      if (isDiscardSelectionActive()) {
        handleHandCardDiscard(Number(button.dataset.handIndex));
        return;
      }
      if (isMovePaymentSelectionActive()) {
        handleHandCardMovePayment(Number(button.dataset.handIndex));
        return;
      }
      if (isHandScanSelectionActive()) {
        handleHandScanCardClick(Number(button.dataset.handIndex));
        return;
      }
      if (isIndustryFutureSpanHandSelectionActive()) {
        handleIndustryFutureSpanHandClick(Number(button.dataset.handIndex));
        return;
      }
      if (isIndustryHandSelectionActive()) {
        handleIndustryDeepspaceHandClick(Number(button.dataset.handIndex));
        return;
      }
      if (isPlayCardSelectionActive()) {
        handlePlayCardSelect(Number(button.dataset.handIndex));
        return;
      }
      handleHandCardCornerQuickAction(Number(button.dataset.handIndex));
    });
    els.debugCheatButton?.addEventListener("click", toggleCheatMode);
    els.techBlueSlotActions?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-blue-slot]");
      if (!button) return;
      confirmTechBlueSlotChoice(Number(button.dataset.blueSlot));
    });
    els.techBlueSlotCancel?.addEventListener("click", () => {
      closeTechBlueSlotPicker();
      renderStateReadout();
    });
    els.techBlueSlotOverlay?.addEventListener("click", (event) => {
      if (event.target === els.techBlueSlotOverlay) {
        closeTechBlueSlotPicker();
        renderStateReadout();
      }
    });
    syncTechRenderContext();
    tech.bindSupplyTileClicks(techGameState, techRenderContext, els.techTiles, {
      onTileClick: handleSupplyTechTileClick,
    });
    els.logToggle.addEventListener("click", () => {
      setLogOpen(els.appWrap.classList.contains("log-collapsed"));
    });
    els.stateLogTab?.addEventListener("click", () => {
      setReportTab("state");
    });
    els.actionLogTab?.addEventListener("click", () => {
      setReportTab("action");
    });
    aliens.bindAlienTraceDragging?.({
      onPositionChange: (payload) => {
        rocketState.statusNote = payload?.message || "外星人坐标已更新";
        if (payload?.message) console.info("[外星人坐标拖动]", payload.message, payload);
        renderAlienPanels();
        renderStateReadout();
      },
    });
    data.bindNebulaDataDragging?.({
      onPositionChange: (payload) => {
        rocketState.statusNote = payload?.message || "星云数据坐标已更新";
        if (payload?.message) console.info("[星云数据坐标拖动]", payload.message, payload);
        if (payload?.nebulaId === aomomo?.NEBULA_ID) {
          console.info(
            "[奥陌陌调试坐标]",
            `数据槽 ${payload.slotIndex} = 盘面(${payload.percentX}%, ${payload.percentY}%)`
            + ` radial=${payload.radialFraction} angular=${payload.angularFraction}`,
          );
          logAomomoDebugCoordinates();
        }
        renderSectorNebulaDataBoard();
        renderStateReadout();
      },
      onSectorWinPositionChange: (payload) => {
        rocketState.statusNote = payload?.message || "扇区胜利坐标已更新";
        if (payload?.message) console.info("[扇区胜利坐标]", payload.message, payload);
        renderSectorNebulaDataBoard();
        renderStateReadout();
      },
    });
    windowRef.addEventListener("keydown", (event) => {
      if (event.key !== "Escape" || els.finalResultOverlay?.hidden) return;
      closeFinalResultDialog();
    });
    windowRef.addEventListener("resize", resize);
  }

  return { bindAppEvents };
});
