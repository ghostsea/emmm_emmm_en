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

// A competing route must compete on its own score instead of lowering scan's score.
const begin = source.indexOf('      const scanCheck = scanEffects.canExecuteScan(getCurrentPlayer(), { standardAction: true });');
const stop = source.lastIndexOf('      candidates.push({', source.indexOf('        id: "analyze",', begin));
assert(begin > 0 && stop > begin);
function scanCandidate({ round = 1, competitor = 0, reserve = 0, analyze = false, energy = 8, raw = 50 } = {}) {
  const currentPlayer = { resources: { credits: 5, energy, score: 40, availableData: 2 }, aiDifficulty: 'laughable' };
  const candidates = [];
  vm.runInNewContext(source.slice(begin, stop), {
    currentPlayer, candidates, FINAL_ROUND_NUMBER: 4, AI_DIFFICULTY_WEAK_START: 'weak_start',
    getCurrentPlayer: () => currentPlayer, aiNumber: v => Number(v) || 0,
    scanEffects: { canExecuteScan: () => ({ ok: true }), getStandardScanCost: () => ({ credits: 1, energy: 2 }) },
    listAiMoveCandidates: () => [{ score: competitor }],
    canAiAnalyzeData: () => ({ ok: analyze }), buildAiAnalyzeActionValueBreakdown: () => ({ score: 30, directScoreGain: 5 }),
    launchCandidate: { available: true, score: competitor }, orbitCandidate: { available: true, score: competitor }, landCandidate: { available: true, score: competitor },
    scoreAiScanAction: () => raw, getAiScanDirectScoreGain: () => 5, scoreAiScanPriorityFloor: () => 0,
    getAiNextMissingFinalScoreThreshold: () => null, getAiRoundNumber: () => round,
    shouldAiProtectB2SectorScanFromPlanetCap: () => false, getAiAnalyzeEnergyCost: () => 1,
    scoreAiScanEnergyReservationPenalty: () => reserve, canAiGrandStrategyOpenAnalyzeWithProjectedScanData: () => false,
    buildAiScanActionTargetPreview: () => null,
  });
  return candidates.find(x => x.id === 'scan');
}
for (const round of [1, 3, 4]) for (const competitor of [0, 12, 25, 70]) {
  const scan = scanCandidate({ round, competitor });
  assert.equal(scan.score, 50, 'competitor must not overwrite an independently valued scan');
  assert.equal(scan.scoreCapReason, null);
}
assert.equal(scanCandidate({ reserve: 4 }).score, 46, 'actual reserved energy still matters');
assert.equal(scanCandidate({ round: 3, energy: 2, analyze: true, raw: 35 }).score, 28, 'available analysis competes for the last energy');
console.log('AI scan independent ranking tests passed');
