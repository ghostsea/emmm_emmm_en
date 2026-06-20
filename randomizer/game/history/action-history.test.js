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

history.beginStep({ label: "扇区扫描", effectIndex: 0, type: "effect" });
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
assert.equal(value, -10);

const undoCost = history.undoLastStep();
assert.equal(undoCost.ok, true);
assert.equal(value, -11);

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

const barrierHistory = actionHistory.createActionHistory();
barrierHistory.beginSession("mixed", "交错行动");
barrierHistory.beginStep({ source: "main", type: "effect", label: "主行动 A" });
barrierHistory.record({
  label: "A",
  undo() {
    value += 100;
  },
});
const stepA = barrierHistory.endStep();
assert.ok(stepA.id, "step should have id");
assert.equal(stepA.source, "main");
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
assert.equal(barrierHistory.hasUndoableStep(), false, "barrier blocks previous undoable steps");
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
const undoAfterBarrier = barrierHistory.undoLastStep();
assert.equal(undoAfterBarrier.ok, true);
assert.equal(undoAfterBarrier.step.id, afterBarrier.id);
assert.equal(value, 3);
assert.equal(barrierHistory.hasUndoableStep(), false);

const rollbackBlocked = barrierHistory.rollbackSession();
assert.equal(rollbackBlocked.ok, false);
assert.equal(rollbackBlocked.blockedBy.id, barrierStep.id);

console.log("action-history.test.js: all tests passed");
