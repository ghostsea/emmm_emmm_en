"use strict";

const assert = require("node:assert/strict");

const placement = require("./placement");
const state = require("./state");

const player = { id: "white", color: "white", industryRoundMarkRound: 0 };

assert.equal(placement.hasIndustryActionMarker({ label: "层云核心" }), true);
assert.equal(placement.hasIndustryActionMarker({ label: "异星实验室" }), false);
assert.equal(placement.hasIndustryActionMarker({ label: "作弊实验室" }), false);
assert.equal(placement.getIndustryActionMarkerLayout("寰宇动力").percentY, 78.3);
assert.equal(placement.getIndustryActionMarkerLayout("寰宇超动力").percentY, 78.3);
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
const initialCards = require("../initial-cards");

assert.equal(catalog.hasImplementedActiveAbility("层云核心"), true);
assert.equal(catalog.hasImplementedActiveAbility("未来跨度研究所"), true);
assert.equal(catalog.hasImplementedActiveAbility("作弊实验室"), false);
assert.equal(catalog.hasImplementedActiveAbility("寰宇超动力"), true);
assert.equal(catalog.hasImplementedActiveAbility("原教旨主义"), true);
assert.equal(placement.hasIndustryActionMarker({ label: "原教旨主义" }), true);
assert.equal(placement.getIndustryActionMarkerLayout("原教旨主义").percentY, 73.4);
assert.equal(passives.getRocketLimitBonus({ initialSelection: { industry: { label: "寰宇动力" } } }), 1);
const huanyuSuperdrivePlayer = { initialSelection: { industry: { label: "寰宇超动力" } } };
assert.equal(passives.getRocketLimitBonus(huanyuSuperdrivePlayer), 1);
assert.equal(passives.hasHuanyuSuperdriveRoundStart(huanyuSuperdrivePlayer), true);
assert.equal(passives.shouldLaunchAfterPassWithHuanyuSuperdrive(huanyuSuperdrivePlayer), true);
assert.equal(passives.getResearchPublicityCost({ initialSelection: { industry: { label: "芬威克研究中心" } } }), 5);
const alienLabPlayer = { initialSelection: { industry: { label: "异星实验室" } }, resources: { score: 0 } };
const cheatLabPlayer = { initialSelection: { industry: { label: "作弊实验室" } }, resources: { score: 0 } };
const turingPlayer = {
  id: "white",
  initialSelection: { industry: { label: "图灵系统" } },
  techState: { ownedTiles: {}, disabledTiles: {} },
  industryBorrowedTechTileId: "orange2",
  industryBorrowedTechRound: 2,
  industryBorrowedTechTurn: 4,
};
assert.equal(passives.getBorrowedTechTileId(turingPlayer), "orange2");
assert.equal(passives.getBorrowedTechTileId(turingPlayer, 2, 4), "orange2");
assert.equal(passives.getBorrowedTechTileId(turingPlayer, 2, 5), null);
assert.equal(passives.getBorrowedTechTileId(turingPlayer, 3, 4), null);
assert.equal(passives.getBorrowedTechTileId(turingPlayer, 2), null);
assert.equal(passives.playerHasTechEffect(turingPlayer, "orange2"), true);
assert.equal(passives.playerHasTechEffect(turingPlayer, "orange2", 2, 4), true);
assert.equal(passives.playerHasTechEffect(turingPlayer, "orange2", 2, 5), false);
const turingClear = state.clearTuringBorrowedTech(turingPlayer);
assert.equal(turingClear.cleared, true);
assert.equal(turingPlayer.industryBorrowedTechTileId, null);
assert.equal(turingPlayer.industryBorrowedTechRound, 0);
assert.equal(turingPlayer.industryBorrowedTechTurn, 0);
assert.equal(state.clearTuringBorrowedTech(turingPlayer).cleared, false);
const turingFlow = abilities.buildActiveAbilityFlow(turingPlayer, "图灵系统", 2, 4);
assert.equal(turingFlow.ok, true);
assert.match(turingFlow.message, /橙色或紫色科技/);

assert.equal(passives.getStandardLaunchCost(alienLabPlayer).credits, 1);
assert.equal(passives.getStandardScanCost(alienLabPlayer).energy, 2);
assert.equal(passives.getStandardScanCost(alienLabPlayer).credits, undefined);
assert.equal(passives.getResearchPublicityCost(alienLabPlayer), 4);
state.initializeAlienLabPanels(alienLabPlayer);
assert.equal(state.consumeAlienLabPanel(alienLabPlayer, "blue").changed, true);
assert.equal(passives.getStandardLaunchCost(alienLabPlayer).credits, 2);
assert.equal(state.restoreAlienLabPanelForTrace(alienLabPlayer, "blue").changed, true);
assert.equal(passives.getStandardLaunchCost(alienLabPlayer).credits, 1);

assert.equal(passives.hasPermanentAlienLabPanels(cheatLabPlayer), true);
assert.equal(passives.hasCheatLabRoundStart(cheatLabPlayer), true);
const cheatLabStartup = initialCards.getIndustryEffect("作弊实验室");
assert.equal(cheatLabStartup.blindDraw, 5);
assert.equal(cheatLabStartup.incomeIncreaseCount, 5);
assert.equal(passives.getStandardLaunchCost(cheatLabPlayer).credits, 1);
assert.equal(passives.getStandardScanCost(cheatLabPlayer).energy, 2);
assert.equal(passives.getStandardScanCost(cheatLabPlayer).credits, undefined);
assert.equal(passives.getResearchPublicityCost(cheatLabPlayer), 4);
state.initializeAlienLabPanels(cheatLabPlayer);
assert.equal(state.consumeAlienLabPanel(cheatLabPlayer, "blue").changed, true);
assert.equal(passives.getStandardLaunchCost(cheatLabPlayer).credits, 1);

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
assert.equal(passives.shouldGainPublicityOnType12Play(missionPlayer), true);
assert.equal(passives.getMissionPlayPublicityGain(), 1);
assert.equal(passives.shouldGainPublicityOnType12Play(turingPlayer), false);
const missionFlow = abilities.buildActiveAbilityFlow(missionPlayer, "任务中继站", 1);
assert.equal(missionFlow.ok, true);
assert.equal(missionFlow.flowType, "mission_publicity_pick");
assert.equal(missionFlow.publicityCost, abilities.PUBLICITY_PICK_COST);

const poorMission = { ...missionPlayer, resources: { publicity: 1 } };
const poorFlow = abilities.buildActiveAbilityFlow(poorMission, "任务中继站", 1);
assert.equal(poorFlow.ok, false);

const fundamentalismPlayer = {
  id: "fundamentalism",
  resources: { score: 9, credits: 1, energy: 1 },
  initialSelection: { industry: { label: "原教旨主义" } },
};
assert.equal(passives.hasFundamentalismRoundStartIncome(fundamentalismPlayer), true);
assert.equal(passives.blocksStandardPlayCardAction(fundamentalismPlayer), true);
assert.equal(passives.shouldDoubleDiscardCornerRewards(fundamentalismPlayer), true);
assert.equal(passives.shouldCompleteIncomeTaskCards(fundamentalismPlayer), true);
const fundamentalismFlow = abilities.buildActiveAbilityFlow(fundamentalismPlayer, "原教旨主义", 2);
assert.equal(fundamentalismFlow.ok, true);
assert.equal(fundamentalismFlow.flowType, "fundamentalism_score_exchange");
assert.equal(fundamentalismFlow.exchangeCount, 3);
const fundamentalismNodes = abilities.buildFundamentalismScoreExchangeEffectNodes({
  label: "原教旨主义",
  groupId: "test-fundamentalism",
});
assert.equal(fundamentalismNodes.length, 3);
assert.deepEqual(fundamentalismNodes.map((node) => node.type), [
  "industry_fundamentalism_exchange",
  "industry_fundamentalism_exchange",
  "industry_fundamentalism_exchange",
]);
assert.deepEqual(fundamentalismNodes.map((node) => node.icon), ["score", "score", "score"]);
assert.equal(fundamentalismNodes[0].options.exchangeIndex, 1);
const fundamentalismStartup = initialCards.getIndustryEffect("原教旨主义");
assert.equal(fundamentalismStartup.resources.credits, 2);
assert.equal(fundamentalismStartup.resources.energy, 2);
assert.equal(fundamentalismStartup.resources.publicity, 3);
assert.equal(fundamentalismStartup.blindDraw, 3);
assert.equal(fundamentalismStartup.incomeIncreaseCount, 2);
assert.deepEqual(fundamentalismStartup.baseIncome, { credits: 2, energy: 2 });

const fenwickPlayer = {
  id: "white",
  resources: { publicity: 1 },
  initialSelection: { industry: { label: "芬威克研究中心" } },
};
const fenwickFlow = abilities.buildActiveAbilityFlow(fenwickPlayer, "芬威克研究中心", 1);
assert.equal(fenwickFlow.ok, true);
assert.equal(fenwickFlow.flowType, "fenwick_publicity_pick");
assert.equal(fenwickFlow.publicityCost, abilities.FENWICK_PUBLICITY_PICK_COST);
assert.match(fenwickFlow.message, /消耗 1 宣传/);

const poorFenwick = { ...fenwickPlayer, resources: { publicity: 0 } };
const poorFenwickFlow = abilities.buildActiveAbilityFlow(poorFenwick, "芬威克研究中心", 1);
assert.equal(poorFenwickFlow.ok, false);

const missionCardsStub = {
  getCardLabel: (card) => card.label || "card",
  getIncomeGainForCard: (card) => card.incomeGain || null,
};
const missionPlayersStub = {
  gainResources: (target, gain) => {
    target.resources = target.resources || {};
    for (const [key, value] of Object.entries(gain || {})) {
      target.resources[key] = (target.resources[key] || 0) + value;
    }
    return target;
  },
};
const missionDataStub = {
  gainData: (target, options = {}) => {
    target.resources.availableData = (target.resources.availableData || 0) + 1;
    return { ok: true, source: options.source || null };
  },
};
const missionCreditPlayer = { id: "mission-credit", hand: [], resources: { credits: 0, handSize: 0 } };
const missionCreditIncome = abilities.applyIncomeResourcesFromCard(
  missionCardsStub,
  missionPlayersStub,
  missionDataStub,
  missionCreditPlayer,
  { label: "信用点收入牌", incomeGain: { credits: 1 } },
);
assert.equal(missionCreditIncome.ok, true);
assert.equal(missionCreditPlayer.resources.credits, 1);
assert.match(missionCreditIncome.message, /信用点/);

const missionBlindPlayer = { id: "mission-blind", hand: [], resources: { handSize: 0, availableData: 0 } };
let missionBlindDraws = 0;
const missionBlindIncome = abilities.applyIncomeResourcesFromCard(
  missionCardsStub,
  missionPlayersStub,
  missionDataStub,
  missionBlindPlayer,
  { label: "盲抽收入牌", incomeGain: { handSize: 1 } },
  {
    blindDraw: (target) => {
      missionBlindDraws += 1;
      const drawn = { id: `mission-draw-${missionBlindDraws}` };
      target.hand.push(drawn);
      target.resources.handSize = target.hand.length;
      return { ok: true, card: drawn };
    },
  },
);
assert.equal(missionBlindIncome.ok, true);
assert.equal(missionBlindDraws, 1);
assert.equal(missionBlindPlayer.hand.length, 1);
assert.equal(missionBlindPlayer.resources.handSize, 1);
assert.equal(missionBlindIncome.drawnCards[0].id, "mission-draw-1");
assert.match(missionBlindIncome.message, /盲抽1张/);

const cardsStub = {
  getCardLabel: (card) => card.label || card.src || "card",
  getDiscardActionRewardForCard: (card) => {
    const code = String(card.discardActionCode);
    if (code === "0") return { code: 0, gain: { publicity: 1 }, dataCount: 0, label: "1宣传" };
    if (code === "1") return { code: 1, gain: {}, dataCount: 1, label: "1数据" };
    if (code === "4") return { code: 4, gain: { score: 1 }, dataCount: 1, label: "1数据+1分" };
    return null;
  },
  getDiscardActionMoveRewardForCard: (card) => (
    String(card.discardActionCode) === "5"
      ? { code: 5, movementPoints: 1, gain: { score: 1 }, label: "1移动+1分" }
      : null
  ),
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
assert.equal(abilities.shouldAppendSentinelPlayCornerEffect(cardsStub, sentinelPlayer, 1, 2, playedCard), false);
assert.equal(abilities.shouldAppendSentinelPlayCornerEffect(cardsStub, sentinelPlayer, 2, 1, playedCard), false);
assert.equal(passives.isSentinelCornerArmed(sentinelPlayer, 1, 1), true);
assert.equal(passives.isSentinelCornerArmed(sentinelPlayer, 1, 2), false);
const nodes = abilities.buildSentinelPlayCornerEffectNodes(cardsStub, sentinelPlayer, 1, 1, playedCard);
assert.equal(nodes.length, 1);
assert.equal(nodes[0].type, "industry_sentinel_corner");
assert.equal(nodes[0].icon, "publicity");
assert.equal(
  abilities.buildSentinelPlayCornerEffectNodes(
    cardsStub,
    sentinelPlayer,
    1,
    1,
    { ...playedCard, id: "b-2", discardActionCode: "1" },
  )[0].icon,
  "data",
);
assert.equal(
  abilities.buildSentinelPlayCornerEffectNodes(
    cardsStub,
    sentinelPlayer,
    1,
    1,
    { ...playedCard, id: "b-3", discardActionCode: "4" },
  )[0].icon,
  "data",
);
assert.equal(
  abilities.buildSentinelPlayCornerEffectNodes(
    cardsStub,
    sentinelPlayer,
    1,
    1,
    { ...playedCard, id: "b-4", discardActionCode: "5" },
  )[0].icon,
  "movement",
);
assert.equal(abilities.shouldAppendSentinelPlayCornerEffect(cardsStub, sentinelPlayer, 1, 1, { src: "aliens/x/face.png" }), false);
sentinelPlayer.industryPlayedCardThisRound = true;
sentinelPlayer.industryLastPlayedCardThisRound = playedCard;
sentinelPlayer.industryPlayedCardRound = 1;
sentinelPlayer.industryPlayedCardTurn = 1;
const sentinelClear = state.clearSentinelPlayCornerState(sentinelPlayer);
assert.equal(sentinelClear.cleared, true);
assert.equal(sentinelPlayer.industrySentinelArmedRound, 0);
assert.equal(sentinelPlayer.industrySentinelArmedTurn, 0);
assert.equal(sentinelPlayer.industryPlayedCardThisRound, false);
assert.equal(sentinelPlayer.industryLastPlayedCardThisRound, null);
assert.equal(sentinelPlayer.industryPlayedCardRound, 0);
assert.equal(sentinelPlayer.industryPlayedCardTurn, 0);
assert.equal(state.clearSentinelPlayCornerState(sentinelPlayer).cleared, false);

const huanyuMoveNodes = abilities.buildHuanyuFreeMoveEffectNodes({
  label: "寰宇动力",
  groupId: "test-huanyu",
});
assert.equal(huanyuMoveNodes.length, 2);
assert.deepEqual(huanyuMoveNodes.map((node) => node.type), ["card_move", "card_move"]);
assert.deepEqual(huanyuMoveNodes.map((node) => node.options.movementPoints), [1, 1]);
assert.equal(huanyuMoveNodes[0].options.industryHuanyuMoveGroupId, "test-huanyu");
assert.equal(huanyuMoveNodes[1].options.requireDifferentRocketInGroup, true);
assert.equal(huanyuMoveNodes[1].options.source, "industry");
assert.match(abilities.buildActiveAbilityFlow(
  { initialSelection: { industry: { label: "寰宇动力" } } },
  "寰宇动力",
  1,
).message, /效果栏/);

const stratusCards = [
  { id: "public-1", cardId: "b_1.webp", discardActionCode: 0, label: "公共牌1" },
  { id: "public-2", cardId: "b_2.webp", discardActionCode: 2, label: "公共牌2" },
  { id: "public-3", cardId: "b_3.webp", discardActionCode: 0, label: "公共牌3" },
];
const stratusNodes = abilities.buildStratusPublicCornerEffectNodes({
  ...cardsStub,
  getDiscardActionMoveRewardForCard: (card) => (
    card.discardActionCode === 2 ? { kind: "move", movementPoints: 1, label: "1移动", gain: {} } : null
  ),
}, stratusCards);
assert.equal(stratusNodes.length, 3);
assert.equal(stratusNodes[0].type, "industry_stratus_corner");
assert.equal(stratusNodes[0].options.card.cardId, "b_1.webp");
assert.equal(stratusNodes[1].icon, "movement");
assert.match(abilities.buildActiveAbilityFlow(
  { initialSelection: { industry: { label: "层云核心" } } },
  "层云核心",
  1,
).message, /效果栏/);

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
