"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const source = fs.readFileSync(path.join(__dirname, "ai-controller.js"), "utf8");
function load(name, dependencies) {
  const start = source.indexOf(`function ${name}(`);
  assert.ok(start >= 0);
  const body = source.indexOf(") {", start) + 2;
  let depth = 0;
  for (let i = body; i < source.length; i += 1) {
    if (source[i] === "{") depth += 1;
    if (source[i] !== "}") continue;
    depth -= 1;
    if (!depth) return Function(...Object.keys(dependencies), `return (${source.slice(start, i + 1)});`)(...Object.values(dependencies));
  }
  assert.fail(`Unclosed function ${name}`);
}

const payment = options => options?.skipCost ? {} : options?.cost || { credits: 2 };
const number = value => Number(value) || 0;
const project = load("getAiProjectedResourcesAfterLaunchMove", { aiNumber: number, getAiLaunchPaymentCost: payment });
const state = { pendingActionExecuted: true };
const seenMoveResources = [];
const preview = load("scoreAiPostLaunchMovePlan", {
  state, rocketState: {}, players: { canAfford: (p, cost) => Object.entries(cost).every(([key, amount]) => (p.resources[key] || 0) >= amount) },
  getAiLaunchPaymentCost: payment, aiNumber: number,
  getEarthSectorCoordinate: () => ({ x: 0, y: 1 }),
  AI_MOVE_DIRECTIONS: [{ id: "out", label: "向外", deltaX: 0, deltaY: 1, score: 0 }],
  solar: { mod8: x => x % 8 },
  rocketActions: { SECTOR_RING_MAX: 4, SECTOR_RING_MIN: 1, findAvailableSlotIndex: () => 0 },
  getAiRequiredMovePointsFromCoordinate: () => 1,
  canPayForMove: player => { seenMoveResources.push({ ...player.resources }); return { ok: player.resources.energy >= 1 }; },
  scoreAiMoveTowardTargets: () => ({ score: 10, target: { id: "mars" } }),
  applyAiStrategyWeight: value => value,
  shouldAiPreserveEnergyForRouteCashout: () => false,
  estimateAiMovePayment: player => ({ cost: 1, energySpent: 1, cardSpent: 0, remainingEnergy: player.resources.energy - 1 }),
  getAiProjectedResourcesAfterLaunchMove: project,
  scoreAiFollowupMainActionAfterMove: (_to, player) => ({ resources: { ...player.resources } }),
  scoreAiNearestActionablePlanetTimingPenalty: () => 0,
  scoreAiMovementPathPenalty: () => 0,
});

const player = { id: "p", resources: { credits: 0, energy: 2, handSize: 0 } };
const before = structuredClone(player);
assert.equal(preview(player), null, "ordinary launch must still respect an already-used main action");
let result = preview(player, { launchOptions: { skipCost: true }, ignoreMainActionUsed: true });
assert.ok(result, "a free effect can launch at zero credits after the main action");
assert.equal(result.projectedResourcesAfterLaunchMove.credits, 0);
assert.equal(result.projectedResourcesAfterLaunchMove.energy, 1);
assert.deepEqual(player, before, "preview must leave the live player unchanged");

result = preview(player, { launchOptions: { cost: { energy: 1 } }, ignoreMainActionUsed: true });
assert.equal(seenMoveResources.at(-1).energy, 1, "custom launch cost must be paid before movement feasibility");
assert.equal(result.projectedResourcesAfterLaunchMove.energy, 0, "custom cost must be paid exactly once");
assert.equal(result.projectedFollowupMainAction.resources.energy, 0);
assert.equal(preview({ ...player, resources: { credits: 0, energy: 1 } }, {
  launchOptions: { cost: { energy: 1 } }, ignoreMainActionUsed: true,
}), null, "launch payment cannot also fund movement");
assert.equal(preview(player, { launchOptions: { cost: { credits: 1 } }, ignoreMainActionUsed: true }), null);

state.pendingActionExecuted = false;
assert.equal(preview(player), null, "a zero-credit paid launch must remain unavailable");
result = preview({ ...player, resources: { credits: 3, energy: 2 } });
assert.equal(result.projectedResourcesAfterLaunchMove.credits, 1);
assert.equal(result.projectedResourcesAfterLaunchMove.energy, 1);

let passedOptions;
const route = load("scoreAiCardLaunchRouteValue", {
  scoreAiLaunchPaymentCost: options => payment(options).credits || 0,
  scoreAiPostLaunchMovePlan: (_player, options) => { passedOptions = options; return { score: 9 }; },
  aiNumber: number,
});
assert.equal(route({ type: "launch", options: { skipCost: true } }, player).postLaunchMoveScore, 9);
assert.deepEqual(passedOptions, { launchOptions: { skipCost: true }, ignoreMainActionUsed: true });
const played = { id: "launch-card" };
const retained = { id: "movement-card" };
const cardPlayer = { resources: { credits: 2, energy: 2, handSize: 2 }, hand: [played, retained] };
const cardPlayerBefore = structuredClone(cardPlayer);
const afterCardPayment = load("createAiPlayerAfterCardPayment", {
  aiNumber: number, getCardPlayCost: () => ({ credits: 1, energy: 1 }),
});
const paidPlayer = afterCardPayment(played, cardPlayer);
assert.deepEqual(paidPlayer.resources, { credits: 1, energy: 1, handSize: 1 });
assert.deepEqual(paidPlayer.hand, [retained], "the played card cannot also pay movement");
assert.deepEqual(cardPlayer, cardPlayerBefore, "card payment preview must leave the live state unchanged");
assert.equal(afterCardPayment(null, cardPlayer), cardPlayer);
result = preview(paidPlayer, { launchOptions: { skipCost: true }, ignoreMainActionUsed: true });
assert.equal(result.projectedResourcesAfterLaunchMove.credits, 1);
assert.equal(result.projectedResourcesAfterLaunchMove.energy, 0);
assert.equal(result.projectedResourcesAfterLaunchMove.handSize, 1);
console.log("ai-route-preview.test.js: all tests passed");
