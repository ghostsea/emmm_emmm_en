"use strict";

const assert = require("node:assert/strict");
const chain = require("./chain");

const flow = chain.startAbilityChain("scan", "扫描", [
  { abilityId: "payScanCost", label: "支付", undoable: true },
  { abilityId: "scanSector", label: "扫描", undoable: true },
  { abilityId: "researchTechRotate", label: "不可撤销", undoable: false },
]);

const ownerFlow = chain.startAbilityChain("owner", "归属", [
  { abilityId: "ownedEffect", playerId: "player-brown" },
  { abilityId: "optionOwnedEffect", options: { playerId: "player-white" } },
]);
assert.equal(ownerFlow.effects[0].playerId, "player-brown");
assert.equal(ownerFlow.effects[1].playerId, "player-white");

const preHistoryCommand = { label: "触发进度", undo() {} };
const metadataFlow = chain.startAbilityChain("metadata", "节点元数据", [
  { abilityId: "reward", preHistoryCommands: [preHistoryCommand] },
]);
assert.equal(metadataFlow.effects[0].preHistoryCommands.length, 1);
assert.equal(metadataFlow.effects[0].preHistoryCommands[0], preHistoryCommand);
assert.equal(metadataFlow.effects[0].preHistoryCommandsApplied, false);

const requiredFlow = chain.startAbilityChain("required", "必须节点", [
  { abilityId: "finishSector", required: true, options: { skippable: false } },
  { abilityId: "requiredOption", options: { required: true } },
]);
assert.equal(requiredFlow.effects[0].required, true);
assert.equal(requiredFlow.effects[0].options.skippable, false);
assert.equal(requiredFlow.effects[1].required, true);

assert.equal(flow.effects.length, 3);
assert.equal(chain.getCurrentChainNode(flow).status, "pending");

let current = chain.activateNext(flow);
assert.equal(current.abilityId, "payScanCost");
assert.equal(current.status, "active");
assert.equal(chain.activateNextIfIdle(flow), null);
assert.equal(chain.getCurrentChainNode(flow).abilityId, "payScanCost");

let resolved = chain.resolveCurrentChainNode(flow, { ok: true, undoable: true });
assert.equal(resolved.ok, true);
assert.equal(flow.effects[0].status, "completed");
assert.equal(chain.getCurrentChainNode(flow).abilityId, "scanSector");

const undone = chain.undoLastChainStep(flow);
assert.equal(undone.ok, true);
assert.equal(chain.getCurrentChainNode(flow).abilityId, "payScanCost");
assert.equal(flow.effects[1].status, "pending");

chain.resolveCurrentChainNode(flow, { ok: true, undoable: true });
assert.equal(chain.getCurrentChainNode(flow).abilityId, "scanSector");
chain.skipCurrentChainNode(flow);
assert.equal(flow.effects[1].status, "skipped");
assert.equal(chain.getCurrentChainNode(flow).abilityId, "researchTechRotate");

chain.resolveCurrentChainNode(flow, { ok: true, undoable: false });
assert.equal(flow.completed, true);
assert.equal(chain.undoLastChainStep(flow).ok, true);
assert.equal(chain.getCurrentChainNode(flow).abilityId, "payScanCost");

const idleFlow = chain.startAbilityChain("inserted", "插入效果", [
  { abilityId: "alreadyDone", status: "completed" },
]);
const sameNamedFlow = chain.startAbilityChain("scan", "另一次扫描", []);
assert.ok(flow.historyFlowId);
assert.notEqual(
  flow.historyFlowId,
  sameNamedFlow.historyFlowId,
  "each effect flow needs a unique history identity",
);
idleFlow.effects.push({ abilityId: "insertedReward", status: "pending" });
idleFlow.currentIndex = 0;
idleFlow.completed = false;
current = chain.activateNextIfIdle(idleFlow);
assert.equal(current.abilityId, "insertedReward");
assert.equal(current.status, "active");

const dynamicFlow = chain.startAbilityChain("dynamic-land", "动态登陆奖励", [
  { id: "b91-land", type: "card_land", label: "毅力号登陆" },
  { id: "tail-effect", type: "gain_resources", label: "后续原有效果" },
]);
chain.activateNext(dynamicFlow);
const insertionSource = chain.createInsertionSource(dynamicFlow);
dynamicFlow.effects.splice(
  1,
  0,
  chain.markInsertedNode({ id: "mercury-data", type: "gain_data", status: "pending" }, insertionSource),
  chain.markInsertedNode({ id: "mercury-score", type: "gain_resources", status: "pending" }, insertionSource),
);
assert.deepEqual(dynamicFlow.effects.map((effect) => effect.id), [
  "b91-land",
  "mercury-data",
  "mercury-score",
  "tail-effect",
]);
const removedDynamicRewards = chain.removeInsertedNodesBySource(dynamicFlow, {
  chainId: "dynamic-land",
  effectId: "b91-land",
  effectIndex: 0,
  effectType: "card_land",
});
assert.equal(removedDynamicRewards, 2);
assert.deepEqual(dynamicFlow.effects.map((effect) => effect.id), ["b91-land", "tail-effect"]);

const moveMergeFlow = chain.startAbilityChain("move-merge", "移动合并", [
  { id: "reward-source", type: "gain_resources", label: "获得奖励" },
  { id: "existing-move", type: "card_move", label: "2移动", options: { movementPoints: 2 } },
  { id: "tail-score", type: "gain_resources", label: "后续分数" },
]);
chain.activateNext(moveMergeFlow);
const moveMergeSource = chain.createInsertionSource(moveMergeFlow);
const mergedMove = chain.mergePendingMovementNode(
  moveMergeFlow,
  { id: "new-move", type: "card_move", status: "pending", options: { movementPoints: 1 } },
  moveMergeSource,
);
assert.equal(mergedMove.merged, true);
assert.equal(mergedMove.target.id, "existing-move");
assert.equal(mergedMove.target.options.movementPoints, 3);
assert.equal(mergedMove.target.badge, "3");
assert.equal(moveMergeFlow.effects.length, 3);

const removedMergedMove = chain.removeInsertedNodesBySource(moveMergeFlow, moveMergeSource);
assert.equal(removedMergedMove, 1);
assert.equal(moveMergeFlow.effects[1].options.movementPoints, 2);
assert.equal(moveMergeFlow.effects[1].badge, "2");

const activeMoveFlow = chain.startAbilityChain("active-move-merge", "进行中移动合并", [
  { id: "active-move", type: "card_move", label: "1移动", options: { movementPoints: 1 } },
]);
chain.activateNext(activeMoveFlow);
const activeMoveMerge = chain.mergePendingMovementNode(
  activeMoveFlow,
  { id: "bonus-move", type: "card_move", status: "pending", options: { movementPoints: 2 } },
);
assert.equal(activeMoveMerge.merged, true);
assert.equal(activeMoveFlow.effects[0].options.movementPoints, 3);

const purpleMoveSource = {
  chainId: "scan",
  effectIndex: 2,
  effectId: "scan-purple4",
  effectType: "scan_action_4",
};
const purpleFirstMoveFlow = chain.startAbilityChain("scan", "紫4先加入移动", [
  {
    id: "scan-movement-pool",
    type: "card_move",
    label: "扫描行动：累计移动",
    options: { movementPoints: 1, scanMovementPoolId: "scan-run-1" },
  },
]);
purpleFirstMoveFlow.effects[0] = chain.markInsertedNode(
  purpleFirstMoveFlow.effects[0],
  purpleMoveSource,
);
const b25AfterPurpleMerge = chain.mergePendingMovementNode(
  purpleFirstMoveFlow,
  {
    id: "b25-red-move",
    type: "card_move",
    status: "pending",
    options: { movementPoints: 1, scanMovementPoolId: "scan-run-1" },
  },
);
assert.equal(b25AfterPurpleMerge.merged, true);
assert.equal(purpleFirstMoveFlow.effects[0].options.movementPoints, 2);
chain.removeInsertedNodesBySource(purpleFirstMoveFlow, purpleMoveSource);
assert.equal(
  purpleFirstMoveFlow.effects.length,
  1,
  "undoing purple4 must preserve a later b_25 contribution in the shared movement pool",
);
assert.equal(purpleFirstMoveFlow.effects[0].options.movementPoints, 1);

const paidMoveFlow = chain.startAbilityChain("paid-move", "带费用移动", [
  { id: "paid-move-1", type: "card_move", options: { movementPoints: 1, cost: { publicity: 1 } } },
]);
chain.activateNext(paidMoveFlow);
assert.equal(chain.mergePendingMovementNode(
  paidMoveFlow,
  { id: "paid-move-2", type: "card_move", status: "pending", options: { movementPoints: 1, cost: { publicity: 1 } } },
).merged, false);

console.log("chain.test.js: all tests passed");
