(function (root, factory) {
  "use strict";

  let actions = root.SetiActions;

  if (!actions && typeof require === "function") {
    actions = require("../actions");
  }

  const api = factory(actions);

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.SetiAILegalActions = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function (actions) {
  "use strict";

  const DEFAULT_ACTION_IDS = Object.freeze(["launch", "orbit", "land", "researchTech", "pass"]);
  const DECISION_LEVELS = Object.freeze({
    TURN: "turn",
    SUBFLOW: "subflow",
  });

  function normalizeActionIds(actionIds = []) {
    const seen = new Set();
    const result = [];
    for (const actionId of actionIds) {
      const normalized = String(actionId || "").trim();
      if (!normalized || seen.has(normalized)) continue;
      seen.add(normalized);
      result.push(normalized);
    }
    return result;
  }

  function buildLegalActionEntry(actionId, context, options = {}) {
    const check = typeof options.canExecute === "function"
      ? options.canExecute(actionId, context)
      : typeof actions?.canExecute === "function"
        ? actions.canExecute(actionId, context)
        : null;
    return {
      id: actionId,
      kind: options.kind || (actionId === "pass" ? "pass" : actionId === "launch" || actionId === "orbit" || actionId === "land" || actionId === "researchTech" ? "main" : "quick"),
      label: options.label || actions?.getAction?.(actionId)?.label || actionId,
      available: Boolean(check?.ok),
      reason: check?.message || null,
      ...check,
    };
  }

  function buildLegalActionList(context, options = {}) {
    const actionIds = normalizeActionIds(options.actionIds || DEFAULT_ACTION_IDS);
    return actionIds.map((actionId) => buildLegalActionEntry(actionId, context, options));
  }

  function buildLegalActionMask(context, options = {}) {
    return buildLegalActionList(context, options).reduce((mask, entry) => {
      mask[entry.id] = entry.available;
      return mask;
    }, {});
  }

  function normalizeDecisionLevel(level) {
    return String(level || DECISION_LEVELS.TURN).toLowerCase() === DECISION_LEVELS.SUBFLOW
      ? DECISION_LEVELS.SUBFLOW
      : DECISION_LEVELS.TURN;
  }

  function buildSubflowActionList(options = {}) {
    const choices = Array.isArray(options.subflowChoices) ? options.subflowChoices : [];
    return choices.map((choice, index) => ({
      id: String(choice?.id || choice?.choice || `subflow-${index + 1}`),
      kind: "subflow",
      decisionType: String(options.decisionType || "subflow"),
      label: String(choice?.label || choice?.name || choice?.id || `subflow-${index + 1}`),
      available: choice?.available !== false,
      reason: choice?.reason || null,
      params: choice?.params || null,
      meta: choice?.meta || null,
      ...choice,
    }));
  }

  function buildDecisionActionList(context, options = {}) {
    const level = normalizeDecisionLevel(options.decisionLevel);
    if (level === DECISION_LEVELS.SUBFLOW) {
      return buildSubflowActionList(options);
    }
    return buildLegalActionList(context, options);
  }

  function buildDecisionActionMask(context, options = {}) {
    return buildDecisionActionList(context, options).reduce((mask, entry) => {
      mask[entry.id] = entry.available !== false;
      return mask;
    }, {});
  }

  return Object.freeze({
    DEFAULT_ACTION_IDS,
    DECISION_LEVELS,
    normalizeActionIds,
    buildLegalActionEntry,
    buildLegalActionList,
    buildLegalActionMask,
    normalizeDecisionLevel,
    buildSubflowActionList,
    buildDecisionActionList,
    buildDecisionActionMask,
  });
});
