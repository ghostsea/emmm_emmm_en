"use strict";

// Browser-runner fixture only. Keep the sampled identities in this closure so
// the normal state and AI cannot inspect a species before its legal reveal.
function installIndependentAlienSeed(seed) {
  let installed;
  Object.defineProperty(globalThis, "SetiAlienRandomizer", {
    configurable: true,
    get: () => installed,
    set(api) {
      installed = Object.freeze({
        ...api,
        revealRandomAlien(state, slotId) {
          const legal = api.pickRandomAlienIdForReveal(state, slotId, () => 0);
          if (!legal.ok) return legal;
          const pool = api.getAlienRevealPool(state);
          let hash = 2166136261;
          for (const char of `${seed}:${JSON.stringify(pool)}`) {
            hash = Math.imul(hash ^ char.charCodeAt(0), 16777619) >>> 0;
          }
          const random = () => {
            hash = (hash + 0x6d2b79f5) >>> 0;
            let value = Math.imul(hash ^ (hash >>> 15), hash | 1);
            value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
            return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
          };
          const order = pool.slice();
          for (let index = order.length - 1; index > 0; index -= 1) {
            const other = Math.floor(random() * (index + 1));
            [order[index], order[other]] = [order[other], order[index]];
          }
          const slotIndex = globalThis.SetiAlienPlacement.ALIEN_SLOT_IDS
            .findIndex((id) => Number(id) === Number(slotId));
          const index = legal.pool.indexOf(order[slotIndex]);
          if (index < 0) throw new Error("Independent alien seed conflicts with the current reveal state");
          return api.revealRandomAlien(state, slotId, () => (index + 0.5) / legal.pool.length);
        },
      });
    },
  });
}

function buildIndependentAlienSeedScript(seed) {
  return `(${installIndependentAlienSeed.toString()})(${JSON.stringify(String(seed))});`;
}

module.exports = { buildIndependentAlienSeedScript };
