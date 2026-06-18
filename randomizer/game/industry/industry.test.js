"use strict";

const assert = require("node:assert/strict");

const placement = require("./placement");
const state = require("./state");

const player = { id: "white", color: "white", industryRoundMarkRound: 0 };

assert.equal(placement.hasIndustryActionMarker({ label: "层云核心" }), true);
assert.equal(placement.hasIndustryActionMarker({ label: "异星实验室" }), false);
assert.equal(placement.getIndustryActionMarkerLayout("寰宇动力").percentY, 78.3);
assert.equal(placement.getIndustryActionMarkerLayout("未来跨度研究所").percentX, 11.2);

let check = state.canMarkIndustryAction(player, 2);
assert.equal(check.ok, true);

state.markIndustryAction(player, 2);
assert.equal(state.isIndustryActionMarkedThisRound(player, 2), true);
check = state.canMarkIndustryAction(player, 2);
assert.equal(check.ok, false);

assert.equal(state.isIndustryActionMarkedThisRound(player, 3), false);
check = state.canMarkIndustryAction(player, 3);
assert.equal(check.ok, true);

state.resetPlayerIndustryActionMark(player);
assert.equal(state.isIndustryActionMarkedThisRound(player, 2), false);

const undo = state.createIndustryMarkUndoCommand(player, 0);
state.markIndustryAction(player, 2);
undo.undo();
assert.equal(player.industryRoundMarkRound, 0);

console.log("industry.test.js: all tests passed");
