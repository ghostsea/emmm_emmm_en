"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const source = fs.readFileSync(path.join(__dirname, "ai-controller.js"), "utf8");
const start = source.indexOf("function getAiFullSectorOptionalLaunchProfile(");
const end = source.indexOf("function getAiCappedOptionalLaunchProfile(", start);
assert.ok(start >= 0 && end > start);
let available = null, checked;
const resolve = Function("getEarthSectorCoordinate", "rocketActions", "rocketState", `return (${source.slice(start, end).trim()});`)(
  () => ({ x: 7, y: 1 }), { findAvailableSlotIndex: (_s, x, y) => { checked = { x, y }; return available; } }, {},
);
const effect = { type: "launch", options: { skipCost: true } };
assert.deepEqual(resolve(effect), { coordinate: { x: 7, y: 1 }, reason: "sector-full" });
assert.equal(resolve({ ...effect, required: true }), null);
assert.equal(resolve({ ...effect, options: { skippable: false } }), null);
assert.ok(resolve({ ...effect, options: { ignoreRocketLimit: true } }), "physical slots apply even when probe count is ignored");
resolve({ ...effect, options: { sectorCoordinate: { x: 3, y: 2 } } });
assert.deepEqual(checked, { x: 3, y: 2 }, "honor an explicit launch sector");
available = 0;
assert.equal(resolve(effect), null, "slot zero is a valid free slot");
assert.equal(resolve({ type: "gain_resources" }), null);
console.log("ai-launch-capacity.test.js: all tests passed");
