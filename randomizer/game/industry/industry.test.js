"use strict";

const assert = require("node:assert/strict");

const placement = require("./placement");
const state = require("./state");

const player = { id: "white", color: "white", industryRoundMarkRound: 0 };

assert.equal(placement.hasIndustryActionMarker({ label: "层云核心" }), true);
assert.equal(placement.hasIndustryActionMarker({ label: "异星实验室" }), false);
assert.equal(placement.getIndustryActionMarkerLayout("寰宇动力").percentY, 78.3);
assert.equal(placement.hasIndustryActionMarker({ label: "未来跨度研究所" }), false);
assert.equal(placement.getIndustryActionMarkerLayout("未来跨度研究所"), null);

let check = state.canMarkIndustryAction(player, 2, { turnNumber: 1 });
assert.equal(check.ok, true);

state.markIndustryAction(player, 2, { turnNumber: 1 });
assert.equal(state.isIndustryActionMarkedThisRound(player, 2, 1), true);
check = state.canMarkIndustryAction(player, 2, { turnNumber: 1 });
assert.equal(check.ok, false);

assert.equal(state.isIndustryActionMarkedThisRound(player, 2, 2), true);
check = state.canMarkIndustryAction(player, 2, { turnNumber: 2 });
assert.equal(check.ok, false);

assert.equal(state.isIndustryActionMarkedThisRound(player, 3, 1), false);
check = state.canMarkIndustryAction(player, 3, { turnNumber: 1 });
assert.equal(check.ok, true);

state.resetPlayerIndustryActionMark(player);
assert.equal(state.isIndustryActionMarkedThisRound(player, 2, 1), false);

const undo = state.createIndustryMarkUndoCommand(player, 0, 0);
state.markIndustryAction(player, 2, { turnNumber: 1 });
undo.undo();
assert.equal(player.industryRoundMarkRound, 0);
assert.equal(player.industryRoundMarkTurn, 0);

const catalog = require("./catalog");
const passives = require("./passives");
const abilities = require("./abilities");

assert.equal(catalog.hasImplementedActiveAbility("层云核心"), true);
assert.equal(catalog.hasImplementedActiveAbility("未来跨度研究所"), false);
assert.equal(passives.getRocketLimitBonus({ initialSelection: { industry: { label: "寰宇动力" } } }), 1);
assert.equal(passives.getResearchPublicityCost({ initialSelection: { industry: { label: "芬威克研究中心" } } }), 5);

const strategyPlayer = {
  id: "white",
  initialSelection: { industry: { label: "宇宙战略集团" } },
};
assert.equal(passives.shouldShowStrategyPassiveMarkers(strategyPlayer), true);
assert.equal(passives.shouldInitializeStrategyPassiveMarkers(strategyPlayer), true);
const strategyInit = state.initializeStrategyPassiveMarkers(strategyPlayer);
assert.equal(strategyInit.ok, true);
assert.equal(strategyPlayer.industryStrategyPassiveSlots.yellow, false);
assert.equal(strategyPlayer.industryStrategyPassiveSlots.red, false);
assert.equal(strategyPlayer.industryStrategyPassiveSlots.blue, false);
assert.equal(passives.shouldInitializeStrategyPassiveMarkers(strategyPlayer), false);
assert.equal(placement.hasStrategyPassiveMarkerSlots("宇宙战略集团"), true);
assert.equal(placement.getStrategyPassiveMarkerLayout("yellow").percentX, 9.71);
assert.equal(placement.getStrategyPassiveMarkerLayout("red").percentY, 51.86);
const yellowPlace = state.placeStrategyPassiveSlot(strategyPlayer, "yellow");
assert.equal(yellowPlace.ok, true);
assert.equal(state.isStrategyPassiveSlotMarked(strategyPlayer, "yellow"), true);
assert.equal(state.placeStrategyPassiveSlot(strategyPlayer, "yellow").ok, false);

const missionPlayer = {
  id: "white",
  resources: { publicity: 3 },
  initialSelection: { industry: { label: "任务中继站" } },
};
const missionFlow = abilities.buildActiveAbilityFlow(missionPlayer, "任务中继站", 1);
assert.equal(missionFlow.ok, true);
assert.equal(missionFlow.flowType, "mission_publicity_pick");

const poorMission = { ...missionPlayer, resources: { publicity: 1 } };
const poorFlow = abilities.buildActiveAbilityFlow(poorMission, "任务中继站", 1);
assert.equal(poorFlow.ok, false);

const cardsStub = {
  getCardLabel: (card) => card.label || card.src || "card",
  getDiscardActionRewardForCard: (card) => (
    card.discardActionCode === "0" ? { kind: "resource", gain: { publicity: 1 }, label: "1宣传" } : null
  ),
  getDiscardActionMoveRewardForCard: () => null,
};

const sentinelPlayer = {
  id: "white",
  industryRoundMarkRound: 1,
  industryRoundMarkTurn: 1,
  industrySentinelArmedRound: 1,
  industrySentinelArmedTurn: 1,
};
const playedCard = { id: "b-1", src: "b_1.webp", discardActionCode: "0", label: "测试牌" };
assert.equal(abilities.shouldAppendSentinelPlayCornerEffect(cardsStub, sentinelPlayer, 1, 1, playedCard), true);
assert.equal(abilities.shouldAppendSentinelPlayCornerEffect(cardsStub, sentinelPlayer, 1, 2, playedCard), true);
assert.equal(abilities.shouldAppendSentinelPlayCornerEffect(cardsStub, sentinelPlayer, 2, 1, playedCard), false);
const nodes = abilities.buildSentinelPlayCornerEffectNodes(cardsStub, sentinelPlayer, 1, 1, playedCard);
assert.equal(nodes.length, 1);
assert.equal(nodes[0].type, "industry_sentinel_corner");
assert.equal(abilities.shouldAppendSentinelPlayCornerEffect(cardsStub, sentinelPlayer, 1, 1, { src: "aliens/x/face.png" }), false);

console.log("industry.test.js: all tests passed");
