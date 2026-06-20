(function (root, factory) {
  "use strict";

  const api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.SetiHistoryTransactions = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function () {
  "use strict";

  const HISTORY_SOURCE_MAIN = "main";
  const HISTORY_SOURCE_QUICK = "quick";

  function cloneSlice(value) {
    return value == null ? value : structuredClone(value);
  }

  function restoreObject(target, snapshot) {
    if (!target || snapshot == null) return;
    for (const key of Object.keys(target)) {
      delete target[key];
    }
    Object.assign(target, structuredClone(snapshot));
  }

  function createRestoreSlicesCommand(context, keys, label) {
    const sliceKeys = Array.isArray(keys) ? keys.filter(Boolean) : [];
    const snapshots = {};
    for (const key of sliceKeys) {
      snapshots[key] = cloneSlice(context?.[key]);
    }
    return {
      label: label || "组合状态恢复",
      describe: label || `恢复 ${sliceKeys.join(", ")}`,
      undo() {
        for (const key of sliceKeys) {
          restoreObject(context?.[key], snapshots[key]);
        }
      },
    };
  }

  function normalizeIrreversible(input = {}) {
    if (input.irreversible) return input.irreversible;
    if (input.undoable === false) {
      return {
        code: "manual_irreversible",
        reason: input.reason || input.message || "该步骤产生不可撤销影响",
      };
    }
    return null;
  }

  function recordAbilityResult(result, history) {
    if (!result?.commands?.length || !history?.record) return 0;
    let count = 0;
    for (const command of result.commands) {
      history.record(command);
      count += 1;
    }
    return count;
  }

  function markIrreversible(history, options = {}) {
    if (!history?.beginStep || !history?.endStep) return null;
    const irreversible = normalizeIrreversible(options) || {};
    history.beginStep({
      source: options.source || null,
      type: options.type || "irreversible",
      label: options.label || "不可撤销步骤",
      effectIndex: options.effectIndex ?? null,
      effectType: options.effectType || null,
      undoable: false,
      irreversibleCode: options.code || irreversible.code || "irreversible",
      irreversibleReason: options.reason || irreversible.reason || "该步骤产生不可撤销影响",
    });
    return history.endStep();
  }

  function recordStep(history, options = {}) {
    if (!history?.beginStep || !history?.endStep) {
      return { ok: false, message: "没有可用的历史会话" };
    }
    history.beginStep({
      source: options.source || null,
      type: options.type || "effect",
      label: options.label || "效果",
      effectIndex: options.effectIndex ?? null,
      effectType: options.effectType || null,
    });

    const result = typeof options.run === "function" ? options.run() : { ok: true };
    if (result?.ok === false) {
      history.undoLastStep();
      return result;
    }
    recordAbilityResult(result, history);

    const irreversible = normalizeIrreversible(result);
    if (irreversible) {
      const current = history.endStep();
      if (current) {
        current.undoable = false;
        current.irreversibleCode = irreversible.code || "irreversible";
        current.irreversibleReason = irreversible.reason || result.message || "该步骤产生不可撤销影响";
      }
      return { ...(result || {}), step: current };
    }

    return { ...(result || {}), step: history.endStep() };
  }

  function recordMainStep(options = {}) {
    return recordStep(options.history, {
      ...options,
      source: HISTORY_SOURCE_MAIN,
    });
  }

  function recordQuickStep(options = {}) {
    return recordStep(options.history, {
      ...options,
      source: HISTORY_SOURCE_QUICK,
    });
  }

  return Object.freeze({
    HISTORY_SOURCE_MAIN,
    HISTORY_SOURCE_QUICK,
    createRestoreSlicesCommand,
    recordAbilityResult,
    markIrreversible,
    recordMainStep,
    recordQuickStep,
  });
});
