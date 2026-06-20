(function (root, factory) {
  "use strict";

  let catalog = root.SetiAlienCatalog;
  let placement = root.SetiAlienPlacement;
  let state = root.SetiAlienState;
  let jiuzhe = root.SetiAlienJiuzhe;
  let yichangdian = root.SetiAlienYichangdian;
  let fangzhou = root.SetiAlienFangzhou;
  let banrenma = root.SetiAlienBanrenma;
  let amiba = root.SetiAlienAmiba;

  if (typeof require === "function") {
    catalog = catalog || require("./catalog");
    placement = placement || require("./placement");
    state = state || require("./state");
    jiuzhe = jiuzhe || require("./jiuzhe");
    yichangdian = yichangdian || require("./yichangdian");
    fangzhou = fangzhou || require("./fangzhou");
    banrenma = banrenma || require("./banrenma");
    amiba = amiba || require("./amiba");
  }

  const api = factory(catalog, placement, state, jiuzhe, yichangdian, fangzhou, banrenma, amiba);

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.SetiAlienRandomizer = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function (catalog, placement, state, jiuzhe, yichangdian, fangzhou, banrenma, amiba) {
  "use strict";

  function randomizeAlienAssignments(alienState, random = Math.random) {
    const fixedFirstAlienId = jiuzhe?.ALIEN_ID || "九折";
    const fixedSecondAlienId = fangzhou?.ALIEN_ID || "方舟";
    const fixedAssignments = Object.freeze({
      [placement.ALIEN_SLOT_IDS[0]]: fixedFirstAlienId,
      [placement.ALIEN_SLOT_IDS[1]]: fixedSecondAlienId,
    });
    const fixedAlienIds = new Set(Object.values(fixedAssignments));
    const pool = catalog.ALIEN_TYPE_IDS.filter((alienId) => !fixedAlienIds.has(alienId));
    const assignments = {};

    for (const alienSlotId of placement.ALIEN_SLOT_IDS) {
      if (!fixedAssignments[alienSlotId] && !pool.length) {
        throw new Error("外星人池不足以分配到所有槽位");
      }

      const assignedAlienId = fixedAssignments[alienSlotId]
        || pool.splice(Math.floor(random() * pool.length), 1)[0];
      alienState.aliens[alienSlotId] = state.createDefaultAlienSlotState();
      alienState.aliens[alienSlotId].assignedAlienId = assignedAlienId;
      assignments[alienSlotId] = assignedAlienId;
    }

    if (jiuzhe?.createJiuzheState) {
      alienState.jiuzhe = jiuzhe.createJiuzheState();
    }
    if (yichangdian?.createYichangdianState) {
      alienState.yichangdian = yichangdian.createYichangdianState();
    }
    if (fangzhou?.createFangzhouState) {
      alienState.fangzhou = fangzhou.createFangzhouState();
    }
    if (banrenma?.createBanrenmaState) {
      alienState.banrenma = banrenma.createBanrenmaState();
    }
    if (amiba?.createAmibaState) {
      alienState.amiba = amiba.createAmibaState();
    }

    return {
      ok: true,
      assignments,
      message: placement.ALIEN_SLOT_IDS
        .map((alienSlotId) => `${placement.getAlienSlotLabel(alienSlotId)} → ${catalog.getAlienLabel(assignments[alienSlotId])}`)
        .join("；"),
    };
  }

  return Object.freeze({
    randomizeAlienAssignments,
  });
});
