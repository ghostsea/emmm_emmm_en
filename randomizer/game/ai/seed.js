(function (root, factory) {
  "use strict";

  let seed = root.SetiAISeed;

  if (!seed && typeof require === "function") {
    seed = require("./seed");
  }

  const api = factory(seed);

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.SetiAISeed = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function (seedModule) {
  "use strict";

  function normalizeSeedInput(seed) {
    return String(seed ?? "seti-ai");
  }

  function hashSeed(seed) {
    const text = normalizeSeedInput(seed);
    let hash = 2166136261;
    for (let index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function createSeededRandom(seed) {
    let state = hashSeed(seed);
    return function seededRandom() {
      state = (state + 0x6D2B79F5) >>> 0;
      let value = state;
      value = Math.imul(value ^ (value >>> 15), value | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
  }

  function seededShuffle(items = [], seedOrRandom = "seti-ai") {
    const random = typeof seedOrRandom === "function"
      ? seedOrRandom
      : createSeededRandom(seedOrRandom);
    const result = [...items];
    for (let index = result.length - 1; index > 0; index -= 1) {
      const pickIndex = Math.floor(random() * (index + 1));
      [result[index], result[pickIndex]] = [result[pickIndex], result[index]];
    }
    return result;
  }

  return Object.freeze({
    normalizeSeedInput,
    hashSeed,
    createSeededRandom,
    seededShuffle,
  });
});
