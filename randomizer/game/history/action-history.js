(function (root, factory) {
  "use strict";

  const api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.SetiActionHistory = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function () {
  "use strict";

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
      session.currentStep = {
        type: meta.type || "effect",
        label: meta.label || "效果",
        effectIndex: meta.effectIndex ?? null,
        effectType: meta.effectType || null,
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
        undoCommands(step);
        session.currentStep = null;
        return { ok: true, step, message: `已撤销：${step.label}` };
      }

      if (!session.steps.length) {
        return { ok: false, message: "没有可撤销的操作" };
      }

      const step = session.steps.pop();
      undoCommands(step);
      return { ok: true, step, message: `已撤销：${step.label}` };
    }

    function rollbackSession() {
      if (!session) return { ok: false, message: "没有进行中的行动" };

      const undone = [];
      if (session.currentStep) {
        undoCommands(session.currentStep);
        undone.push(session.currentStep);
        session.currentStep = null;
      }

      while (session.steps.length) {
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
      return Boolean(session.currentStep) || session.steps.length > 0;
    }

    function getTrace() {
      if (!session) return [];
      const lines = [`行动：${session.label}`];
      for (const step of session.steps) {
        lines.push(`  ✓ ${step.label}`);
        for (const command of step.commands) {
          lines.push(`    · ${command.describe}`);
        }
      }
      if (session.currentStep) {
        lines.push(`  → ${session.currentStep.label}（进行中）`);
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
        type: step.type,
        label: step.label,
        effectIndex: step.effectIndex,
        effectType: step.effectType,
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
