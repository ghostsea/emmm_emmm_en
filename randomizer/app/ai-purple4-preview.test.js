"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const source = fs.readFileSync(path.join(__dirname, "ai-controller.js"), "utf8");
const start = source.indexOf("    let aiScanAction4PreviewDepth = 0;");
const end = source.indexOf("    function runAiScanAction4Decision()", start);
assert(start > 0 && end > start);
let rocketCount = 0, moveScore = 12, throwMove = false, recurse = false, nested;
const player = { id: "p", resources: { credits: 3, energy: 2 } };
const sandbox = {
  getCurrentPlayer: () => player, aiNumber: value => Number(value) || 0,
  scanEffects: { getStandardScanCost: p => ({ credits: p.freeCreditScan ? 0 : 1, energy: 2 }),
    SCAN_ACTION_4_LAUNCH_ENERGY: 1, EFFECT_TYPES: { SCAN_ACTION_4: "scan_action_4" } },
  createAiPlayerAfterResourceGain: (p, gain) => ({ ...p, resources: Object.fromEntries(Object.entries(p.resources).map(([k, v]) => [k, v + (gain[k] || 0)])) }),
  abilities: { rocket: { getRocketLimitForPlayer: () => 2 } }, createActionContext: () => ({}), rocketState: {},
  rocketActions: { getRocketsForPlayer: () => Array.from({ length: rocketCount }) },
  players: { canAfford: (p, cost) => Object.entries(cost).every(([k, v]) => (p.resources[k] || 0) >= v) },
  getCurrentActionEffect: () => ({ options: { skipCost: true } }),
  scoreAiLaunchAction: () => 20, scoreAiResourceBundle: cost => (cost.energy || 0) * 6,
  listAiEffectMoveCandidates: options => {
    assert.equal(options.free, true); assert.equal(options.poolRemaining, 1);
    assert.equal(options.player.resources.energy, player.resources.energy - 2, "movement uses resources after scan payment");
    assert.equal(options.effect.type, "scan_action_4", "preview does not inherit an unrelated active effect");
    if (throwMove) throw Error("move probe");
    if (recurse) nested = sandbox.getAiScanAction4RewardPreview(options.player);
    return rocketCount ? [{ score: moveScore, rocketId: 1 }] : [];
  },
};
vm.createContext(sandbox);
vm.runInContext(source.slice(start, end), sandbox);
const before = JSON.stringify(player);
let preview = sandbox.getAiScanAction4RewardPreview(player);
assert.equal(preview.score, 0, "no rocket and no energy after scan means neither branch is available");
assert.equal(preview.choices.length, 0);
assert.equal(JSON.stringify(player), before, "preview is read only");
player.resources.energy = 3;
preview = sandbox.getAiScanAction4RewardPreview(player);
assert.equal(preview.score, (20 - 6) * 0.45, "launch pays its extra energy");
rocketCount = 1;
preview = sandbox.getAiScanAction4RewardPreview(player);
assert.equal(preview.choices.length, 2);
assert.equal(preview.score, Math.max(14 * 0.45, 12 * 0.35), "mutually exclusive choices use max, not sum");
player.resources.energy = 2;
assert.equal(sandbox.getAiScanAction4RewardPreview(player).score, 12 * 0.35, "free movement still works at zero remaining energy");
rocketCount = 2; player.resources.energy = 5;
assert.equal(sandbox.getAiScanAction4RewardPreview(player).choices.length, 1, "rocket limit excludes launch");
rocketCount = 0; player.resources.energy = 2;
assert.equal(sandbox.getAiScanAction4RewardPreview(player, { effect: { type: "scan_action_4", options: { skipCost: true } } }).score, 20 * 0.45);
player.resources.credits = 0;
assert.equal(sandbox.getAiScanAction4RewardPreview(player).unavailable, true);
player.freeCreditScan = true; player.resources.energy = 3;
assert.equal(sandbox.getAiScanAction4RewardPreview(player).score, 14 * 0.45, "company scan fee is respected");
recurse = true;
sandbox.getAiScanAction4RewardPreview(player);
assert.equal(nested.nested, true); assert.equal(nested.score, 0);
recurse = false; throwMove = true;
assert.throws(() => sandbox.getAiScanAction4RewardPreview(player), /move probe/);
throwMove = false;
assert.equal(sandbox.getAiScanAction4RewardPreview(player).score, 14 * 0.45, "preview depth is restored after errors");
console.log("Purple4 affordable exclusive preview tests passed");

// Exercise the main scan scorer, not just the preview helper.
player.resources.credits = 3; player.resources.energy = 2; player.freeCreditScan = false; rocketCount = 0;
let includePurple = false;
const scoreContext = { ...sandbox, getAiScanAction4RewardPreview: sandbox.getAiScanAction4RewardPreview,
  FINAL_ROUND_NUMBER: 4, getAiRoundNumber: () => 3, turnState: { roundNumber: 3, turnNumber: 5 },
  scanEffects: { ...sandbox.scanEffects, buildScanEffectQueue: () => includePurple ? [{ type: 'scan_action_4' }] : [] },
  listAiMoveCandidates: () => [], scoreAiEarlyScanEngineValue: () => 0, scoreAiB2SectorScanRecoveryValue: () => 0,
  getAiStrategyDemand: () => ({ traceTypes: {} }), sumAiDemandMap: () => 0,
  scoreAiResourceReservePenaltyForCost: () => 0, scoreAiLateScanResourceDrainPenalty: () => 0,
  countAiStandardScansThisRound: () => 1,
  data: { listComputerPlacedTokens: () => [1,2,3,4,5,6], ANALYZE_REQUIRED_COMPUTER_SLOT: 6 },
  getAiScanDirectScoreGain: () => 1, countAiTraceMarkersForPlayer: () => 2, getAiAvailableDataRoom: () => 4,
  canAiGrandStrategyOpenAnalyzeWithProjectedScanData: () => true, hasAiAnalyzeReadyDataSlot: () => true,
  scoreAiHighScorePushValue: () => 0, scoreAiLowEngineCatchupValue: () => 0, getAiLiveScorePaceDeficit: () => 0,
  applyAiStrategyWeight: value => value,
};
vm.createContext(scoreContext);
const mainStart = source.indexOf('    function scoreAiScanAction('), mainEnd = source.indexOf('    function getAiPlayEffectsForCard(', mainStart);
vm.runInContext(source.slice(mainStart, mainEnd), scoreContext);
const withoutPurple = scoreContext.scoreAiScanAction(player);
includePurple = true;
assert.equal(scoreContext.scoreAiScanAction(player), withoutPurple, 'an unavailable purple4 branch must add no main-action value');
console.log('Purple4 main scan integration tests passed');
