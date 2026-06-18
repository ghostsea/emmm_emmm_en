(function (root, factory) {
  "use strict";

  let placement = root.SetiIndustryPlacement;
  let state = root.SetiIndustryState;
  let catalog = root.SetiIndustryCatalog;
  let passives = root.SetiIndustryPassives;
  let abilities = root.SetiIndustryAbilities;

  if (typeof require === "function") {
    placement = placement || require("./placement");
    state = state || require("./state");
    catalog = catalog || require("./catalog");
    passives = passives || require("./passives");
    abilities = abilities || require("./abilities");
  }

  const api = factory(placement, state, catalog, passives, abilities);

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
) {
  "use strict";

  return Object.freeze({
    ...placement,
    ...state,
    ...catalog,
    ...passives,
    ...abilities,
  });
});
