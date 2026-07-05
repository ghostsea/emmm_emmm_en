(function (root, factory) {
  "use strict";

  let seed = root.SetiAISeed;
  let observation = root.SetiAIObservation;
  let actions = root.SetiActions;
  let legalActions = root.SetiAILegalActions;

  if ((!seed || !observation || !actions || !legalActions) && typeof require === "function") {
    seed = seed || require("./seed");
    observation = observation || require("./observation");
    actions = actions || require("../actions");
    legalActions = legalActions || require("./legal-actions");
  }

  const api = factory(seed, observation, actions, legalActions);

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.SetiAIEnvironment = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function (seed, observation, actions, legalActions) {
  "use strict";

  function createHeadlessEnvironment(adapter = {}, options = {}) {
    let currentSeed = seed.normalizeSeedInput(options.seed ?? adapter.seed ?? "seti-ai");
    let random = seed.createSeededRandom(currentSeed);

    function getState() {
      if (typeof adapter.getState === "function") return adapter.getState();
      return adapter.state || {};
    }

    function getCurrentPlayerId(overridePlayerId = null) {
      if (overridePlayerId) return overridePlayerId;
      if (typeof adapter.getCurrentPlayerId === "function") return adapter.getCurrentPlayerId();
      return getState().currentPlayerId || getState().playerState?.currentPlayerId || null;
    }

    function createActionContext(playerId = getCurrentPlayerId()) {
      if (typeof adapter.createContext === "function") {
        return adapter.createContext(playerId, { seed: currentSeed, random, state: getState() });
      }
      if (typeof adapter.getContext === "function") {
        return adapter.getContext(playerId, { seed: currentSeed, random, state: getState() });
      }
      return adapter.context || null;
    }

    function buildLegalActions(playerId = getCurrentPlayerId()) {
      if (typeof adapter.getLegalActions === "function") {
        return adapter.getLegalActions(playerId, { seed: currentSeed, random, state: getState() });
      }

      const context = createActionContext(playerId);
      if (!context) return [];

      const listBuilder = legalActions?.buildLegalActionList;
      if (typeof listBuilder === "function") {
        return listBuilder(context, {
          actionIds: options.actionIds,
          canExecute: adapter.canExecuteAction,
          kind: options.kind,
        });
      }

      const actionIds = Array.isArray(options.actionIds) && options.actionIds.length
        ? options.actionIds
        : ["launch", "orbit", "land", "researchTech", "pass"];
      return actionIds.map((actionId) => {
        const check = typeof adapter.canExecuteAction === "function"
          ? adapter.canExecuteAction(actionId, context)
          : typeof actions.canExecute === "function"
            ? actions.canExecute(actionId, context)
            : null;
        return {
          id: actionId,
          available: Boolean(check?.ok),
          reason: check?.message || null,
          ...check,
        };
      });
    }

    function buildLegalActionMask(playerId = getCurrentPlayerId()) {
      if (typeof adapter.getLegalActionMask === "function") {
        return adapter.getLegalActionMask(playerId, { seed: currentSeed, random, state: getState() });
      }
      const entries = buildLegalActions(playerId);
      if (entries.length) {
        return entries.reduce((mask, entry) => {
          mask[entry.id] = entry.available;
          return mask;
        }, {});
      }
      const context = createActionContext(playerId);
      if (!context || typeof legalActions?.buildLegalActionMask !== "function") return {};
      return legalActions.buildLegalActionMask(context, {
        actionIds: options.actionIds,
        canExecute: adapter.canExecuteAction,
      });
    }

    function buildObservation(playerId = getCurrentPlayerId(), observationOptions = {}) {
      return observation.buildObservation(getState(), playerId, observationOptions);
    }

    function reset(resetOptions = {}) {
      currentSeed = seed.normalizeSeedInput(resetOptions.seed ?? currentSeed);
      random = seed.createSeededRandom(currentSeed);
      const result = typeof adapter.reset === "function"
        ? adapter.reset({ ...resetOptions, seed: currentSeed, random })
        : { ok: true };
      return {
        ...result,
        seed: currentSeed,
        observation: buildObservation(resetOptions.playerId, resetOptions.observationOptions),
        legalActions: buildLegalActions(resetOptions.playerId),
        legalActionMask: buildLegalActionMask(resetOptions.playerId),
      };
    }

    function step(action, stepOptions = {}) {
      const payload = { ...stepOptions, seed: currentSeed, random };
      const result = typeof adapter.step === "function"
        ? adapter.step(action, payload)
        : typeof adapter.dispatch === "function"
          ? adapter.dispatch(action, payload)
          : typeof adapter.execute === "function"
            ? adapter.execute(action, payload)
            : { ok: false, message: "headless environment adapter does not implement step/dispatch/execute" };
      const playerId = stepOptions.playerId || result?.playerId || getCurrentPlayerId();
      return {
        ...result,
        seed: currentSeed,
        observation: buildObservation(playerId, stepOptions.observationOptions),
        legalActions: buildLegalActions(playerId),
        legalActionMask: buildLegalActionMask(playerId),
      };
    }

    function setSeed(nextSeed) {
      currentSeed = seed.normalizeSeedInput(nextSeed);
      random = seed.createSeededRandom(currentSeed);
      return currentSeed;
    }

    return Object.freeze({
      reset,
      step,
      observe: buildObservation,
      legalActions: buildLegalActions,
      legalActionMask: buildLegalActionMask,
      createActionContext,
      getState,
      getSeed: () => currentSeed,
      setSeed,
      random: () => random(),
    });
  }

  return Object.freeze({
    createHeadlessEnvironment,
  });
});
