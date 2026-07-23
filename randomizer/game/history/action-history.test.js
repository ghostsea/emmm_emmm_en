"use strict";

const assert = require("node:assert/strict");
const actionHistory = require("./action-history");

const history = actionHistory.createActionHistory();
let value = 0;

history.beginSession("scan", "扫描行动");
history.beginStep({ label: "消耗资源", effectIndex: -1, type: "action_start" });
history.record({
  label: "消耗 1 信用点",
  describe: "退还 1 信用点",
  undo() {
    value -= 1;
  },
});
history.endStep();

history.beginStep({ label: "扇区扫描", effectId: "scan-sector", effectIndex: 0, type: "effect" });
history.record({
  label: "替换星云数据",
  describe: "恢复星云数据",
  undo() {
    value -= 10;
  },
});
history.endStep();

assert.equal(value, 0);
const undoEffect = history.undoLastStep();
assert.equal(undoEffect.ok, true);
assert.equal(undoEffect.step.effectId, "scan-sector");
assert.equal(value, -10);

const undoCost = history.undoLastStep();
assert.equal(undoCost.ok, true);
assert.equal(value, -11);

const completedFlows = actionHistory.createCompletedEffectFlowRegistry();
const firstFlow = {
  historyFlowId: "scan-flow-1",
  historySource: "main",
  effects: [{ id: "scan-sector", type: "scan", status: "completed" }],
};
const secondFlow = {
  historyFlowId: "scan-flow-2",
  historySource: "main",
  effects: [{ id: "scan-sector", type: "scan", status: "completed" }],
};
const firstFlowStep = {
  id: "first-flow-step",
  effectFlowId: firstFlow.historyFlowId,
  effectId: "scan-sector",
  effectIndex: 0,
  effectType: "scan",
};
const secondFlowStep = {
  id: "second-flow-step",
  effectFlowId: secondFlow.historyFlowId,
  effectId: "scan-sector",
  effectIndex: 0,
  effectType: "scan",
};
const outsideQueueTriggerStep = {
  id: "outside-trigger-step",
  type: "card_event_bonus",
  effectIndex: null,
};
assert.equal(completedFlows.remember("main", firstFlow), true);
assert.equal(completedFlows.remember("main", secondFlow), true);
assert.equal(completedFlows.count("main"), 2);
assert.equal(
  completedFlows.take("main", outsideQueueTriggerStep),
  null,
  "queue-external triggers must not consume a completed effect flow",
);
assert.equal(completedFlows.count("main"), 2);
assert.equal(
  completedFlows.take("main", secondFlowStep),
  secondFlow,
  "same-shaped effects must restore the exact flow instance",
);
assert.equal(completedFlows.peek("main", firstFlowStep), firstFlow);
assert.equal(completedFlows.take("main", firstFlowStep), firstFlow);
assert.equal(completedFlows.has("main"), false);

history.beginSession("launch", "发射");
history.beginStep({ label: "发射", effectIndex: 0 });
history.record({
  label: "发射火箭",
  undo() {
    value += 5;
  },
});
history.endStep();
const rollback = history.rollbackSession();
assert.equal(rollback.ok, true);
assert.equal(value, -6);
assert.equal(history.hasSession(), false);

const incremental = actionHistory.createActionHistory();
incremental.beginSession("place-data", "放置数据");
incremental.beginStep({ type: "action", label: "放置数据" });
incremental.record({
  label: "放置 1",
  undo() {
    value += 1;
  },
});
incremental.endStep();
incremental.beginStep({ type: "action", label: "放置数据" });
incremental.record({
  label: "放置 2",
  undo() {
    value += 2;
  },
});
incremental.endStep();
assert.equal(incremental.getSessionInfo()?.stepCount, 2);
const undoPlacement = incremental.undoLastStep();
assert.equal(undoPlacement.ok, true);
assert.equal(value, -4);
assert.equal(incremental.getSessionInfo()?.stepCount, 1);
assert.equal(incremental.peekLastUndoableStep()?.label, "放置数据");

const barrierHistory = actionHistory.createActionHistory();
barrierHistory.beginSession("mixed", "交错行动");
barrierHistory.beginStep({
  source: "main",
  type: "effect",
  label: "主行动 A",
  effectFlowId: "barrier-test-flow",
});
barrierHistory.record({
  label: "A",
  undo() {
    value += 100;
  },
});
const stepA = barrierHistory.endStep();
assert.ok(stepA.id, "step should have id");
assert.equal(stepA.source, "main");
assert.equal(stepA.effectFlowId, "barrier-test-flow");
assert.equal(barrierHistory.listSteps()[0].effectFlowId, "barrier-test-flow");
barrierHistory.beginStep({
  source: "quick",
  type: "effect",
  label: "不可撤销翻牌",
  undoable: false,
  irreversibleCode: "hidden_card_reveal",
  irreversibleReason: "翻出新牌",
});
const barrierStep = barrierHistory.endStep();
assert.equal(barrierStep.undoable, false);
assert.equal(barrierHistory.hasIrreversibleBarrier(), true);
assert.equal(barrierHistory.hasUndoableStep(), false, "barrier blocks previous undoable steps");
assert.equal(barrierHistory.peekLastUndoableStep(), null);
const blockedUndo = barrierHistory.undoLastStep();
assert.equal(blockedUndo.ok, false);
assert.match(blockedUndo.message, /不可撤销/);

barrierHistory.beginStep({ source: "quick", type: "effect", label: "屏障后快速行动" });
barrierHistory.record({
  label: "after",
  undo() {
    value += 7;
  },
});
const afterBarrier = barrierHistory.endStep();
assert.ok(afterBarrier.id);
assert.equal(barrierHistory.hasUndoableStep(), true);
assert.equal(barrierHistory.peekLastUndoableStep()?.id, afterBarrier.id);
const undoAfterBarrier = barrierHistory.undoLastStep();
assert.equal(undoAfterBarrier.ok, true);
assert.equal(undoAfterBarrier.step.id, afterBarrier.id);
assert.equal(value, 3);
assert.equal(barrierHistory.hasUndoableStep(), false);

const rollbackBlocked = barrierHistory.rollbackSession();
assert.equal(rollbackBlocked.ok, false);
assert.equal(rollbackBlocked.blockedBy.id, barrierStep.id);

const atomicRollbackHistory = actionHistory.createActionHistory();
let atomicValue = 0;
atomicRollbackHistory.beginSession("orbit", "火星环绕");
atomicRollbackHistory.beginStep({ source: "main", type: "action_start", label: "环绕火星" });
atomicRollbackHistory.record({
  label: "撤销环绕",
  undo() {
    atomicValue -= 100;
  },
});
atomicRollbackHistory.endStep();
atomicRollbackHistory.beginStep({
  source: "main",
  type: "irreversible",
  label: "精选 1 张卡牌",
  undoable: false,
  irreversibleCode: "hidden_card_reveal",
  irreversibleReason: "公共牌补牌翻出新牌",
});
const atomicBarrier = atomicRollbackHistory.endStep();
atomicRollbackHistory.beginStep({ source: "main", type: "effect", label: "获得 1 次收入" });
atomicRollbackHistory.record({
  label: "撤销收入",
  undo() {
    atomicValue += 1;
  },
});
const atomicIncome = atomicRollbackHistory.endStep();
assert.equal(atomicRollbackHistory.hasIrreversibleBarrier(), true);
assert.equal(atomicRollbackHistory.hasUndoableStep(), true);
const atomicRollback = atomicRollbackHistory.rollbackSession();
assert.equal(atomicRollback.ok, false);
assert.equal(atomicRollback.blockedBy.id, atomicBarrier.id);
assert.equal(atomicValue, 0, "rollback must not partially undo steps after a barrier");
const atomicIncomeUndo = atomicRollbackHistory.undoLastStep();
assert.equal(atomicIncomeUndo.ok, true);
assert.equal(atomicIncomeUndo.step.id, atomicIncome.id);
assert.equal(atomicValue, 1);

const fangzhouLikeHistory = actionHistory.createActionHistory();
const fangzhouLikeState = {
  cardInHand: false,
  credits: 0,
  launched: false,
};
fangzhouLikeHistory.beginSession("playCard", "打牌行动");
fangzhouLikeHistory.beginStep({ source: "main", type: "action_start", label: "打出方舟解锁牌" });
fangzhouLikeHistory.record({
  label: "恢复打牌前状态",
  undo() {
    fangzhouLikeState.cardInHand = true;
    fangzhouLikeState.credits = 2;
  },
});
fangzhouLikeHistory.endStep();
fangzhouLikeHistory.beginStep({
  source: "main",
  type: "irreversible",
  label: "方舟奖励牌",
  undoable: false,
  irreversibleCode: "fangzhou_card1_flip",
  irreversibleReason: "方舟奖励牌翻开新牌",
});
const fangzhouBarrier = fangzhouLikeHistory.endStep();
assert.equal(fangzhouLikeHistory.hasUndoableStep(), false);
fangzhouLikeState.launched = true;
fangzhouLikeHistory.beginStep({ source: "main", type: "effect", label: "方舟奖励：发射" });
fangzhouLikeHistory.record({
  label: "撤销发射",
  undo() {
    fangzhouLikeState.launched = false;
  },
});
fangzhouLikeHistory.endStep();
assert.equal(fangzhouLikeHistory.hasUndoableStep(), true);
const undoFangzhouReward = fangzhouLikeHistory.undoLastStep();
assert.equal(undoFangzhouReward.ok, true);
assert.deepEqual(fangzhouLikeState, { cardInHand: false, credits: 0, launched: false });
const blockedFangzhouPlayUndo = fangzhouLikeHistory.undoLastStep();
assert.equal(blockedFangzhouPlayUndo.ok, false);
assert.equal(blockedFangzhouPlayUndo.blockedBy.id, fangzhouBarrier.id);
assert.deepEqual(fangzhouLikeState, { cardInHand: false, credits: 0, launched: false });

const futureSpanLikeHistory = actionHistory.createActionHistory();
const futureSpanLikeState = {
  futureSpan: { card: { id: "future-card" }, targetScore: 30, playing: false },
  cardResolved: false,
};
const beforeFutureSpanPlay = structuredClone(futureSpanLikeState);
futureSpanLikeHistory.beginSession("playCard", "打牌行动");
futureSpanLikeHistory.beginStep({ source: "main", type: "action_start", label: "打出未来跨度目标牌" });
futureSpanLikeHistory.record({
  label: "恢复打牌前状态",
  undo() {
    Object.assign(futureSpanLikeState, structuredClone(beforeFutureSpanPlay));
  },
});
futureSpanLikeHistory.endStep();
futureSpanLikeState.futureSpan.playing = true;
futureSpanLikeHistory.beginStep({
  source: "main",
  type: "irreversible",
  label: "未来跨度目标牌翻出新信息",
  undoable: false,
  irreversibleCode: "hidden_card_reveal",
  irreversibleReason: "翻出新牌",
});
const futureSpanBarrier = futureSpanLikeHistory.endStep();
futureSpanLikeState.futureSpan = { card: null, targetScore: null, playing: false };
futureSpanLikeState.cardResolved = true;
futureSpanLikeHistory.beginStep({ source: "main", type: "effect", label: "屏障后奖励" });
futureSpanLikeHistory.record({
  label: "撤销屏障后奖励",
  undo() {
    futureSpanLikeState.cardResolved = false;
  },
});
futureSpanLikeHistory.endStep();
assert.equal(futureSpanLikeHistory.hasUndoableStep(), true);
const undoFutureSpanReward = futureSpanLikeHistory.undoLastStep();
assert.equal(undoFutureSpanReward.ok, true);
assert.deepEqual(
  futureSpanLikeState.futureSpan,
  { card: null, targetScore: null, playing: false },
  "Future Span release should stay complete when only post-barrier effects are undone",
);
const blockedFutureSpanPlayUndo = futureSpanLikeHistory.undoLastStep();
assert.equal(blockedFutureSpanPlayUndo.ok, false);
assert.equal(blockedFutureSpanPlayUndo.blockedBy.id, futureSpanBarrier.id);

console.log("action-history.test.js: all tests passed");
