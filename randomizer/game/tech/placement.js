(function (root, factory) {
  "use strict";

  let catalog = root.SetiTechCatalog;

  if (!catalog && typeof require === "function") {
    catalog = require("./catalog");
  }

  const api = factory(catalog);

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.SetiTechPlacement = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function (catalog) {
  "use strict";

  const PLAYER_BOARD_LAYOUT = Object.freeze({
    blueSlots: Object.freeze({
      1: Object.freeze({ percentX: 34.69, percentY: 73.84, scalePercent: 36.14 }),
      2: Object.freeze({ percentX: 49.27, percentY: 73.56, scalePercent: 36.14 }),
      3: Object.freeze({ percentX: 63.85, percentY: 74.67, scalePercent: 36.14 }),
      4: Object.freeze({ percentX: 72.05, percentY: 74.39, scalePercent: 36.14 }),
    }),
    orange: Object.freeze({
      orange1: Object.freeze({ percentX: 11.91, percentY: 32.4, scalePercent: 36.14 }),
      orange2: Object.freeze({ percentX: 20.01, percentY: 32.68, scalePercent: 36.14 }),
      orange3: Object.freeze({ percentX: 34.49, percentY: 32.68, scalePercent: 36.14 }),
      orange4: Object.freeze({ percentX: 42.79, percentY: 32.68, scalePercent: 36.14 }),
    }),
    purple: Object.freeze({
      purple1: Object.freeze({ percentX: 61.47, percentY: 32.4, scalePercent: 36.14 }),
      purple2: Object.freeze({ percentX: 75.76, percentY: 32.12, scalePercent: 36.14 }),
      purple3: Object.freeze({ percentX: 83.96, percentY: 31.84, scalePercent: 36.14 }),
      purple4: Object.freeze({ percentX: 92.16, percentY: 32.4, scalePercent: 36.14 }),
    }),
  });

  function getPlacementLayout(tileId, blueSlot = null) {
    const techType = catalog.getTechType(tileId);
    if (techType === "blue") {
      const slot = Number(blueSlot);
      if (![1, 2, 3, 4].includes(slot)) return null;
      return PLAYER_BOARD_LAYOUT.blueSlots[slot] || null;
    }
    if (techType === "orange") return PLAYER_BOARD_LAYOUT.orange[tileId] || null;
    if (techType === "purple") return PLAYER_BOARD_LAYOUT.purple[tileId] || null;
    return null;
  }

  return Object.freeze({
    PLAYER_BOARD_LAYOUT,
    getPlacementLayout,
  });
});
