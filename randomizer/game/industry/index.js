(function (root, factory) {
  "use strict";

  let placement = root.SetiIndustryPlacement;
  let state = root.SetiIndustryState;
  let catalog = root.SetiIndustryCatalog;
  let passives = root.SetiIndustryPassives;
  let abilities = root.SetiIndustryAbilities;
  let render = root.SetiIndustryRender;
  let strategyPassive = root.SetiIndustryStrategyPassive;
  let heliosPassive = root.SetiIndustryHeliosPassive;

  if (typeof require === "function") {
    placement = placement || require("./placement");
    state = state || require("./state");
    catalog = catalog || require("./catalog");
    passives = passives || require("./passives");
    abilities = abilities || require("./abilities");
    render = render || require("./render");
    strategyPassive = strategyPassive || require("./strategy-passive");
    heliosPassive = heliosPassive || require("./helios-passive");
  }

  const api = factory(placement, state, catalog, passives, abilities, render, strategyPassive, heliosPassive);

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.SetiIndustry = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function (
  placement,
  state,
  catalog,
  passives,
  abilities,
  render,
  strategyPassive,
  heliosPassive,
) {
  "use strict";

  function getReadoutLines(player, roundNumber) {
    return [
      ...strategyPassive.getReadoutLines(player, roundNumber),
      ...heliosPassive.getReadoutLines(player),
    ];
  }

  return Object.freeze({
    ...placement,
    ...state,
    ...catalog,
    ...passives,
    ...abilities,
    ...render,
    ...strategyPassive,
    ...heliosPassive,
    getReadoutLines,
  });
});
