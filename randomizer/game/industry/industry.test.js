"use strict";

const assert = require("node:assert/strict");

const placement = require("./placement");
const state = require("./state");

const player = { id: "white", color: "white", industryRoundMarkRound: 0 };

assert.equal(placement.hasIndustryActionMarker({ label: "层云核心" }), true);
assert.equal(placement.hasIndustryActionMarker({ label: "异星实验室" }), false);
assert.equal(placement.getIndustryActionMarkerLayout("寰宇动力").percentY, 78.3);
assert.equal(placement.hasIndustryActionMarker({ label: "未来跨度研究所" }), true);
assert.equal(placement.getIndustryActionMarkerLayout("未来跨度研究所").percentY, 84.0);

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
assert.equal(catalog.hasImplementedActiveAbility("未来跨度研究所"), true);
assert.equal(passives.getRocketLimitBonus({ initialSelection: { industry: { label: "寰宇动力" } } }), 1);
assert.equal(passives.getResearchPublicityCost({ initialSelection: { industry: { label: "芬威克研究中心" } } }), 5);
const alienLabPlayer = { initialSelection: { industry: { label: "异星实验室" } }, resources: { score: 0 } };
const turingPlayer = {
  id: "white",
  initialSelection: { industry: { label: "图灵系统" } },
  techState: { ownedTiles: {}, disabledTiles: {} },
  industryBorrowedTechTileId: "orange2",
  industryBorrowedTechRound: 2,
  industryBorrowedTechTurn: 4,
};
assert.equal(passives.getBorrowedTechTileId(turingPlayer, 2, 4), "orange2");
assert.equal(passives.getBorrowedTechTileId(turingPlayer, 2, 5), null);
assert.equal(passives.getBorrowedTechTileId(turingPlayer, 3, 4), null);
assert.equal(passives.getBorrowedTechTileId(turingPlayer, 2), null);
assert.equal(passives.playerHasTechEffect(turingPlayer, "orange2", 2, 4), true);
assert.equal(passives.playerHasTechEffect(turingPlayer, "orange2", 2, 5), false);
const turingClear = state.clearTuringBorrowedTech(turingPlayer);
assert.equal(turingClear.cleared, true);
assert.equal(turingPlayer.industryBorrowedTechTileId, null);
assert.equal(turingPlayer.industryBorrowedTechRound, 0);
assert.equal(turingPlayer.industryBorrowedTechTurn, 0);
assert.equal(state.clearTuringBorrowedTech(turingPlayer).cleared, false);

assert.equal(passives.getStandardLaunchCost(alienLabPlayer).credits, 1);
assert.equal(passives.getStandardScanCost(alienLabPlayer).energy, 2);
assert.equal(passives.getStandardScanCost(alienLabPlayer).credits, undefined);
assert.equal(passives.getResearchPublicityCost(alienLabPlayer), 4);
state.initializeAlienLabPanels(alienLabPlayer);
assert.equal(state.consumeAlienLabPanel(alienLabPlayer, "blue").changed, true);
assert.equal(passives.getStandardLaunchCost(alienLabPlayer).credits, 2);
assert.equal(state.restoreAlienLabPanelForTrace(alienLabPlayer, "blue").changed, true);
assert.equal(passives.getStandardLaunchCost(alienLabPlayer).credits, 1);

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

const futurePlayer = {
  id: "white",
  resources: { score: 10 },
  initialSelection: { industry: { label: "未来跨度研究所" } },
  hand: [{ id: "future-card", cardId: "b_1.webp", price: 2, src: "../assets/cards/base/split/b_1.webp" }],
};
assert.equal(passives.shouldShowFutureSpanPanel(futurePlayer), true);
state.initializeFutureSpanState(futurePlayer);
assert.equal(state.canParkFutureSpanCard(futurePlayer).ok, true);
const park = state.parkFutureSpanCard(futurePlayer, futurePlayer.hand[0], 35);
assert.equal(park.ok, true);
assert.equal(state.isFutureSpanCardReady(futurePlayer), false);
const futureFlow = abilities.buildActiveAbilityFlow(futurePlayer, "未来跨度研究所", 1);
assert.equal(futureFlow.ok, true);
assert.equal(futureFlow.flowType, "future_span_pick");
assert.equal(state.advanceFutureSpanTarget(futurePlayer, 3).targetScore, 38);
futurePlayer.resources.score = 38;
assert.equal(state.isFutureSpanCardReady(futurePlayer), true);
assert.equal(abilities.buildActiveAbilityFlow(futurePlayer, "未来跨度研究所", 1).ok, false);
state.markFutureSpanPlaying(futurePlayer);
state.clearFutureSpanState(futurePlayer);
assert.equal(state.hasFutureSpanCard(futurePlayer), false);

console.log("industry.test.js: all tests passed");
