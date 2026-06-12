"use strict";

const assert = require("node:assert/strict");
const chain = require("./chain");

const flow = chain.startAbilityChain("scan", "扫描", [
  { abilityId: "payScanCost", label: "支付", undoable: true },
  { abilityId: "scanSector", label: "扫描", undoable: true },
  { abilityId: "researchTechCommit", label: "不可撤销", undoable: false },
]);

assert.equal(flow.effects.length, 3);
assert.equal(chain.getCurrentChainNode(flow).status, "pending");

let current = chain.activateNext(flow);
assert.equal(current.abilityId, "payScanCost");
assert.equal(current.status, "active");

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
assert.equal(chain.getCurrentChainNode(flow).abilityId, "researchTechCommit");

chain.resolveCurrentChainNode(flow, { ok: true, undoable: false });
assert.equal(flow.completed, true);
assert.equal(chain.undoLastChainStep(flow).ok, true);
assert.equal(chain.getCurrentChainNode(flow).abilityId, "payScanCost");

console.log("chain.test.js: all tests passed");
