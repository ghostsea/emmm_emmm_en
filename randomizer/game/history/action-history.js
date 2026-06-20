(function (root, factory) {
  "use strict";

  const api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.SetiActionHistory = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function () {
  "use strict";

  let nextHistoryStepId = 1;

  function createStepId() {
    const id = nextHistoryStepId;
    nextHistoryStepId += 1;
    return `history-step-${id}`;
  }

  function normalizeIrreversibleReason(meta = {}) {
    if (meta.irreversibleReason) return String(meta.irreversibleReason);
    if (meta.irreversible?.reason) return String(meta.irreversible.reason);
    if (meta.undoable === false) return "该步骤产生不可撤销影响";
    return null;
  }

  function isStepUndoable(step) {
    return Boolean(step) && step.undoable !== false && !step.irreversibleReason;
  }

  function findLastBarrierIndex(steps) {
    for (let index = steps.length - 1; index >= 0; index -= 1) {
      if (!isStepUndoable(steps[index])) return index;
    }
    return -1;
  }

  function createActionHistory() {
    let session = null;

    function beginSession(actionType, label) {
      session = {
        actionType,
        label: label || actionType,
        steps: [],
        currentStep: null,
      };
      return session;
    }

    function beginStep(meta = {}) {
      if (!session) return null;
      if (session.currentStep) endStep();
      const irreversibleReason = normalizeIrreversibleReason(meta);
      session.currentStep = {
        id: meta.id || createStepId(),
        source: meta.source || null,
        type: meta.type || "effect",
        label: meta.label || "效果",
        effectIndex: meta.effectIndex ?? null,
        effectType: meta.effectType || null,
        undoable: meta.undoable !== false && !irreversibleReason,
        irreversibleCode: meta.irreversibleCode || meta.irreversible?.code || null,
        irreversibleReason,
        commands: [],
      };
      return session.currentStep;
    }

    function record(command) {
      if (!command || typeof command.undo !== "function") {
        throw new Error("命令必须包含 undo 函数");
      }
      if (!session) return 0;
      if (!session.currentStep) {
        beginStep({ label: command.label || "操作" });
      }
      session.currentStep.commands.push({
        label: command.label || "操作",
        describe: command.describe || command.label || "操作",
        undo: command.undo,
      });
      return session.currentStep.commands.length;
    }

    function endStep() {
      if (!session?.currentStep) return null;
      const step = session.currentStep;
      session.steps.push(step);
      session.currentStep = null;
      return step;
    }

    function undoCommands(step) {
      const errors = [];
      for (let index = step.commands.length - 1; index >= 0; index -= 1) {
        try {
          step.commands[index].undo();
        } catch (error) {
          errors.push(error);
        }
      }
      return errors;
    }

    function undoLastStep() {
      if (!session) return { ok: false, message: "没有可撤销的操作" };

      if (session.currentStep) {
        const step = session.currentStep;
        if (!isStepUndoable(step)) {
          return {
            ok: false,
            step,
            blockedBy: step,
            message: step.irreversibleReason
              ? `不可撤销：${step.irreversibleReason}`
              : `不可撤销：${step.label}`,
          };
        }
        undoCommands(step);
        session.currentStep = null;
        return { ok: true, step, message: `已撤销：${step.label}` };
      }

      if (!session.steps.length) {
        return { ok: false, message: "没有可撤销的操作" };
      }

      const barrierIndex = findLastBarrierIndex(session.steps);
      if (barrierIndex === session.steps.length - 1) {
        const blockedBy = session.steps[barrierIndex];
        return {
          ok: false,
          blockedBy,
          message: blockedBy.irreversibleReason
            ? `不可撤销：${blockedBy.irreversibleReason}`
            : `不可撤销：${blockedBy.label}`,
        };
      }

      let undoIndex = -1;
      for (let index = session.steps.length - 1; index > barrierIndex; index -= 1) {
        if (isStepUndoable(session.steps[index])) {
          undoIndex = index;
          break;
        }
      }
      if (undoIndex < 0) {
        return { ok: false, message: "没有可撤销的操作" };
      }

      const [step] = session.steps.splice(undoIndex, 1);
      undoCommands(step);
      return { ok: true, step, message: `已撤销：${step.label}` };
    }

    function rollbackSession() {
      if (!session) return { ok: false, message: "没有进行中的行动" };

      const undone = [];
      if (session.currentStep) {
        if (!isStepUndoable(session.currentStep)) {
          const blockedBy = session.currentStep;
          return {
            ok: false,
            undone,
            blockedBy,
            message: blockedBy.irreversibleReason
              ? `不可撤销：${blockedBy.irreversibleReason}`
              : `不可撤销：${blockedBy.label}`,
          };
        }
        undoCommands(session.currentStep);
        undone.push(session.currentStep);
        session.currentStep = null;
      }

      while (session.steps.length) {
        const latest = session.steps[session.steps.length - 1];
        if (!isStepUndoable(latest)) {
          return {
            ok: false,
            undone,
            blockedBy: latest,
            message: latest.irreversibleReason
              ? `不可撤销：${latest.irreversibleReason}`
              : `不可撤销：${latest.label}`,
          };
        }
        const step = session.steps.pop();
        undoCommands(step);
        undone.push(step);
      }

      const label = session.label;
      session = null;
      return { ok: true, undone, message: `已撤销行动：${label}` };
    }

    function commitSession() {
      session = null;
    }

    function hasSession() {
      return session != null;
    }

    function getSessionInfo() {
      if (!session) return null;
      return {
        actionType: session.actionType,
        label: session.label,
        stepCount: session.steps.length + (session.currentStep ? 1 : 0),
      };
    }

    function hasUndoableStep() {
      if (!session) return false;
      if (session.currentStep && isStepUndoable(session.currentStep)) return true;
      const barrierIndex = findLastBarrierIndex(session.steps);
      for (let index = session.steps.length - 1; index > barrierIndex; index -= 1) {
        if (isStepUndoable(session.steps[index])) return true;
      }
      return false;
    }

    function getTrace() {
      if (!session) return [];
      const lines = [`行动：${session.label}`];
      for (const step of session.steps) {
        const marker = isStepUndoable(step) ? "✓" : "!";
        lines.push(`  ${marker} ${step.label}${step.irreversibleReason ? `（不可撤销：${step.irreversibleReason}）` : ""}`);
        for (const command of step.commands) {
          lines.push(`    · ${command.describe}`);
        }
      }
      if (session.currentStep) {
        lines.push(
          `  → ${session.currentStep.label}（进行中）${
            session.currentStep.irreversibleReason ? `（不可撤销：${session.currentStep.irreversibleReason}）` : ""
          }`,
        );
        for (const command of session.currentStep.commands) {
          lines.push(`    · ${command.describe}`);
        }
      }
      return lines;
    }

    function listSteps() {
      if (!session) return [];
      const steps = [...session.steps];
      if (session.currentStep) steps.push(session.currentStep);
      return steps.map((step) => ({
        id: step.id,
        source: step.source,
        type: step.type,
        label: step.label,
        effectIndex: step.effectIndex,
        effectType: step.effectType,
        undoable: step.undoable,
        irreversibleCode: step.irreversibleCode,
        irreversibleReason: step.irreversibleReason,
        commandCount: step.commands.length,
        commands: step.commands.map((command) => command.describe),
      }));
    }

    return Object.freeze({
      beginSession,
      beginStep,
      record,
      endStep,
      undoLastStep,
      rollbackSession,
      commitSession,
      hasSession,
      getSessionInfo,
      hasUndoableStep,
      getTrace,
      listSteps,
    });
  }

  return Object.freeze({
    createActionHistory,
  });
});
