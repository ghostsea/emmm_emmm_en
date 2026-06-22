(function (root, factory) {
  "use strict";

  let catalog = root.SetiAlienCatalog;
  let placement = root.SetiAlienPlacement;
  let state = root.SetiAlienState;
  let jiuzhe = root.SetiAlienJiuzhe;
  let yichangdian = root.SetiAlienYichangdian;
  let fangzhou = root.SetiAlienFangzhou;
  let banrenma = root.SetiAlienBanrenma;
  let chong = root.SetiAlienChong;
  let amiba = root.SetiAlienAmiba;
  let aomomo = root.SetiAlienAomomo;
  let runezu = root.SetiAlienRunezu;

  if (typeof require === "function") {
    catalog = catalog || require("./catalog");
    placement = placement || require("./placement");
    state = state || require("./state");
    jiuzhe = jiuzhe || require("./jiuzhe");
    yichangdian = yichangdian || require("./yichangdian");
    fangzhou = fangzhou || require("./fangzhou");
    banrenma = banrenma || require("./banrenma");
    chong = chong || require("./chong");
    amiba = amiba || require("./amiba");
    aomomo = aomomo || require("./aomomo");
    runezu = runezu || require("./runezu");
  }

  const api = factory(catalog, placement, state, jiuzhe, yichangdian, fangzhou, banrenma, chong, amiba, aomomo, runezu);

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.SetiAlienRandomizer = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function (catalog, placement, state, jiuzhe, yichangdian, fangzhou, banrenma, chong, amiba, aomomo, runezu) {
  "use strict";

  function resetAlienSpecificStates(alienState) {
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
    if (chong?.createChongState) {
      alienState.chong = chong.createChongState();
    }
    if (amiba?.createAmibaState) {
      alienState.amiba = amiba.createAmibaState();
    }
    if (aomomo?.createAomomoState) {
      alienState.aomomo = aomomo.createAomomoState();
    }
    if (runezu?.createRunezuState) {
      alienState.runezu = runezu.createRunezuState();
    }
  }

  function randomizeAlienAssignments(alienState) {
    const assignments = {};

    for (const alienSlotId of placement.ALIEN_SLOT_IDS) {
      alienState.aliens[alienSlotId] = state.createDefaultAlienSlotState();
      assignments[alienSlotId] = null;
    }
    resetAlienSpecificStates(alienState);

    return {
      ok: true,
      assignments,
      message: "外星人槽位已重置；主动发现时随机揭示，两个外星人不会重复",
    };
  }

  function getUnavailableAlienIdsForReveal(alienState, alienSlotId) {
    const unavailable = new Set();
    const normalizedSlotId = Number(alienSlotId);
    for (const otherSlotId of placement.ALIEN_SLOT_IDS) {
      if (Number(otherSlotId) === normalizedSlotId) continue;
      const otherSlot = state.getAlienSlot(alienState, otherSlotId);
      if (otherSlot?.alienId) unavailable.add(otherSlot.alienId);
      if (otherSlot?.assignedAlienId) unavailable.add(otherSlot.assignedAlienId);
    }
    return unavailable;
  }

  function pickRandomAlienIdForReveal(alienState, alienSlotId, random = Math.random) {
    const alienSlot = state.getAlienSlot(alienState, alienSlotId);
    if (!alienSlot) {
      return { ok: false, message: `未知外星人槽位 ${alienSlotId}` };
    }
    if (alienSlot.revealed) {
      return { ok: false, message: `${placement.getAlienSlotLabel(alienSlotId)} 已揭示` };
    }
    if (!state.isAlienReadyToReveal(alienSlot)) {
      return { ok: false, message: `${placement.getAlienSlotLabel(alienSlotId)} 尚未集齐三种首标记` };
    }

    const unavailable = getUnavailableAlienIdsForReveal(alienState, alienSlotId);
    const pool = catalog.ALIEN_TYPE_IDS.filter((alienId) => !unavailable.has(alienId));
    if (!pool.length) {
      return { ok: false, message: "外星人池不足以揭示不重复物种" };
    }
    const index = Math.max(0, Math.min(pool.length - 1, Math.floor(random() * pool.length)));
    return { ok: true, alienId: pool[index], pool };
  }

  function revealRandomAlien(alienState, alienSlotId, random = Math.random) {
    const pickResult = pickRandomAlienIdForReveal(alienState, alienSlotId, random);
    if (!pickResult.ok) return pickResult;

    const alienSlot = state.getAlienSlot(alienState, alienSlotId);
    alienSlot.assignedAlienId = pickResult.alienId;
    const revealResult = state.revealAlien(alienState, alienSlotId, pickResult.alienId);
    return {
      ...revealResult,
      pool: pickResult.pool,
    };
  }

  return Object.freeze({
    randomizeAlienAssignments,
    pickRandomAlienIdForReveal,
    revealRandomAlien,
  });
});
