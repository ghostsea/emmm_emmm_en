"use strict";
const assert = require("assert");
const fs = require("fs");
const vm = require("vm");
const path = require("path");
const scanEffects = require("../game/actions/scan-effects");
const source = fs.readFileSync(path.join(__dirname, "ai-controller.js"), "utf8");
const start = source.indexOf("    function scoreAiScanAction(");
const end = source.indexOf("    function getAiPlayEffectsForCard(", start);
let scans = 1, round = 2, backlog = false, reserve = 0, reward = 20;
const player = { resources: { availableData: 2 } };
const sandbox = {
  FINAL_ROUND_NUMBER: 4,
  getCurrentPlayer: () => player,
  getAiRoundNumber: () => round,
  turnState: { roundNumber: 2, turnNumber: 5 },
  scanEffects: {
    ...scanEffects,
    buildScanEffectQueue: () => [{ type: scanEffects.EFFECT_TYPES.EARTH_SECTOR_SCAN }],
  },
  scoreAiResourceBundle: cost => (cost.credits || 0) * 6 + (cost.energy || 0) * 6,
  getBestAiNebulaChoiceScore: () => reward,
  getAiSectorScanChoicesForEffect: () => [],
  scoreAiEarlyScanEngineValue: () => 0,
  scoreAiB2SectorScanRecoveryValue: () => 0,
  getAiStrategyDemand: () => ({ traceTypes: {} }),
  sumAiDemandMap: () => 0,
  scoreAiResourceReservePenaltyForCost: () => reserve,
  scoreAiLateScanResourceDrainPenalty: () => 0,
  countAiStandardScansThisRound: () => scans,
  data: { listComputerPlacedTokens: () => [1, 2, 3, 4, 5, 6], ANALYZE_REQUIRED_COMPUTER_SLOT: 6 },
  getAiScanDirectScoreGain: () => 1,
  countAiTraceMarkersForPlayer: () => 2,
  getAiAvailableDataRoom: () => backlog ? 0 : 4,
  hasAiAnalyzeReadyDataSlot: () => true,
  canAiGrandStrategyOpenAnalyzeWithProjectedScanData: () => true,
  scoreAiHighScorePushValue: () => 0,
  scoreAiLowEngineCatchupValue: () => 0,
  getAiLiveScorePaceDeficit: () => 0,
  applyAiStrategyWeight: value => value,
  aiNumber: value => Number(value) || 0,
};
vm.createContext(sandbox);
vm.runInContext(source.slice(start, end), sandbox);
for (round of [1, 2, 3, 4]) {
  scans = 1;
  const once = sandbox.scoreAiScanAction(player);
  scans = 4;
  assert.equal(sandbox.scoreAiScanAction(player), once, "same current state must not receive an accumulated repeat cost");
}
round = 3; scans = 2;
const useful = sandbox.scoreAiScanAction(player);
backlog = true;
assert(sandbox.scoreAiScanAction(player) < useful, "actual full-pool analysis backlog must still reduce value");
backlog = false; reserve = 5;
assert.equal(sandbox.scoreAiScanAction(player), useful - 5, "actual resource reservation penalty must remain");
reserve = 0; reward = 12;
assert.equal(sandbox.scoreAiScanAction(player), useful - 8, "current scan rewards still determine marginal value");
console.log("AI scan current value tests passed");
