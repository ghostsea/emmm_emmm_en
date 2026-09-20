"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const industry = require("../game/industry");
const source = fs.readFileSync(path.join(__dirname, "ai-controller.js"), "utf8");
function load(name, next, dependencies) {
  const start = source.indexOf(`function ${name}(`), end = source.indexOf(`function ${next}(`, start);
  assert.ok(start >= 0 && end > start);
  return Function(...Object.keys(dependencies), `return (${source.slice(start, end).trim()});`)(...Object.values(dependencies));
}
let count = 0;
const allowance = load("getAiHuanyuLaunchMoveAllowance", "scoreAiPostLaunchMovePlan", {
  industry, turnState: { roundNumber: 1, turnNumber: 1 }, rocketState: {},
  getAiIndustryCard: p => p.initialSelection.industry,
  rocketActions: { getRocketsForPlayer: () => Array(count).fill({}) },
});
const p = { id: "p", initialSelection: { industry: { id: "industry:寰宇超动力", label: "寰宇超动力" } }, industryRoundMarkRound: 0, resources: { credits: 4, energy: 1, handSize: 0 } };
assert.equal(allowance(p), 1);
count = 1; assert.equal(allowance(p), 1);
count = 2; assert.equal(allowance(p), 0, "do not displace two existing probes' possible moves");
count = 0; p.industryRoundMarkRound = 1; assert.equal(allowance(p), 0, "spent company ability cannot fund preview");
p.industryRoundMarkRound = 0;
assert.equal(allowance({ ...p, initialSelection: { industry: { label: "作弊实验室" } } }), 0);
const number = value => Number(value) || 0;
const project = load("getAiProjectedResourcesAfterLaunchMove", "scoreAiTerminalStagingOnlyLaunchPenalty", { aiNumber: number, getAiLaunchPaymentCost: () => ({ credits: 2 }) });
const state = { pendingActionExecuted: false };
let requiredMovePoints = 1;
const preview = load("scoreAiPostLaunchMovePlan", "createAiPlayerAfterQuickTrade", {
  state, players: { canAfford: player => player.resources.credits >= 2 }, rocketState: {},
  getAiHuanyuLaunchMoveAllowance: allowance, getAiLaunchPaymentCost: () => ({ credits: 2 }),
  getEarthSectorCoordinate: () => ({ x: 0, y: 1 }), AI_MOVE_DIRECTIONS: [{ id: "out", deltaX: 0, deltaY: 1, score: 0 }],
  solar: { mod8: x => x % 8 }, rocketActions: { SECTOR_RING_MAX: 4, SECTOR_RING_MIN: 1, findAvailableSlotIndex: () => 0 },
  getAiRequiredMovePointsFromCoordinate: () => requiredMovePoints, canPayForMove: (player, points) => ({ ok: player.resources.energy >= points }),
  scoreAiMoveTowardTargets: () => ({ score: 10, target: {} }), applyAiStrategyWeight: value => value,
  shouldAiPreserveEnergyForRouteCashout: () => false,
  estimateAiMovePayment: (player, points) => ({ cost: points, energySpent: points, cardSpent: 0, remainingEnergy: player.resources.energy - points }),
  getAiProjectedResourcesAfterLaunchMove: project, scoreAiFollowupMainActionAfterMove: () => ({}),
  scoreAiNearestActionablePlanetTimingPenalty: () => 0, scoreAiMovementPathPenalty: () => 0,
});
let plan = preview(p);
assert.equal(plan.quickActionId, "industry"); assert.equal(plan.providedMovePoints, 1); assert.equal(plan.paidMovePoints, 0);
assert.equal(plan.projectedResourcesAfterLaunchMove.energy, 1); assert.equal(plan.projectedResourcesAfterLaunchMove.credits, 2);
p.industryRoundMarkRound = 1; plan = preview(p);
assert.equal(plan.quickActionId, "move"); assert.equal(plan.projectedResourcesAfterLaunchMove.energy, 0);
assert.equal(p.resources.energy, 1, "preview cannot spend real resources");
p.industryRoundMarkRound = 0; requiredMovePoints = 2; plan = preview(p);
assert.equal(plan.providedMovePoints, 1); assert.equal(plan.paidMovePoints, 1);
assert.equal(plan.projectedResourcesAfterLaunchMove.energy, 0, "the same probe gets only one free movement point");
state.pendingActionExecuted = true; assert.equal(preview(p), null);
console.log("ai-huanyu-launch.test.js: all tests passed");
