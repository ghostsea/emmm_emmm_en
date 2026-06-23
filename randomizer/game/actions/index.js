(function (root, factory) {
  "use strict";

  let launch = root.SetiActionLaunch;
  let orbit = root.SetiActionOrbit;
  let land = root.SetiActionLand;
  let researchTech = root.SetiActionResearchTech;

  if ((!launch || !orbit || !land || !researchTech) && typeof require === "function") {
    launch = launch || require("./launch");
    orbit = orbit || require("./orbit");
    land = land || require("./land");
    researchTech = researchTech || require("./research-tech");
  }

  const api = factory(launch, orbit, land, researchTech);

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.SetiActions = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function (launch, orbit, land, researchTech) {
  "use strict";

  const ACTIONS = Object.freeze({
    launch,
    orbit,
    land,
    researchTech,
  });

  const ACTION_ORDER = Object.freeze(["launch", "orbit", "land", "researchTech"]);

  function getAction(actionId) {
    return ACTIONS[actionId] || null;
  }

  function listActions() {
    return ACTION_ORDER.map((actionId) => ACTIONS[actionId]);
  }

  function canExecute(actionId, context) {
    const action = getAction(actionId);
    if (!action) return { ok: false, message: `未知行动: ${actionId}` };
    return action.canExecute(context);
  }

  function execute(actionId, context, options) {
    const action = getAction(actionId);
    if (!action) return { ok: false, actionId, message: `未知行动: ${actionId}` };
    if (actionId === "orbit" || actionId === "land" || actionId === "researchTech") return action.execute(context, options);
    return action.execute(context);
  }

  function getOrbitOptions(context) {
    return typeof orbit.getOrbitOptions === "function"
      ? orbit.getOrbitOptions(context)
      : orbit.canExecute(context);
  }

  function getLandOptions(context) {
    return land.getLandOptions(context);
  }

  return Object.freeze({
    ACTIONS,
    ACTION_ORDER,
    getAction,
    listActions,
    canExecute,
    execute,
    getOrbitOptions,
    getLandOptions,
  });
});
