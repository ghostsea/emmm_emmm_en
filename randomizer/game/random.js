(function (root, factory) {
  "use strict";

  const api = factory(root);

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.SetiGameRandom = api;
  api.installMathRandom();
})(typeof globalThis !== "undefined" ? globalThis : window, function (root) {
  "use strict";

  const DAILY_SEED_NAMESPACE = "seti-daily-v1";
  const GAME_SEED_NAMESPACE = "seti-game-v1";
  const RANDOM_STATE_VERSION = 1;
  const nativeMathRandom = root.Math.random;
  const randomState = {
    mode: "native",
    seed: null,
    dateKey: null,
    value: 0,
    calls: 0,
  };

  function hashSeed(seed) {
    const text = String(seed ?? "seti");
    let hash = 2166136261;
    for (let index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function normalizeDateKey(value) {
    if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return value;
    }

    const date = value instanceof Date ? value : new Date(value ?? Date.now());
    if (Number.isNaN(date.getTime())) return null;
    const year = String(date.getFullYear()).padStart(4, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function createDailySeed(value = new Date()) {
    const dateKey = normalizeDateKey(value);
    return dateKey ? `${DAILY_SEED_NAMESPACE}:${dateKey}` : null;
  }

  function createRandomSeed() {
    const timestamp = Date.now().toString(36);
    const entropy = Math.floor(nativeMathRandom() * 0x100000000)
      .toString(36)
      .padStart(7, "0");
    return `${GAME_SEED_NAMESPACE}:${timestamp}:${entropy}`;
  }

  function useNativeRandom() {
    randomState.mode = "native";
    randomState.seed = null;
    randomState.dateKey = null;
    randomState.value = 0;
    randomState.calls = 0;
    return getSnapshot();
  }

  function useSeed(seed, options = {}) {
    const normalizedSeed = String(seed ?? "");
    if (!normalizedSeed) return useNativeRandom();
    randomState.mode = options.mode === "daily" ? "daily" : "seeded";
    randomState.seed = normalizedSeed;
    randomState.dateKey = options.dateKey || null;
    randomState.value = hashSeed(normalizedSeed);
    randomState.calls = 0;
    return getSnapshot();
  }

  function useDailyRandom(value = new Date()) {
    const dateKey = normalizeDateKey(value);
    if (!dateKey) return useNativeRandom();
    return useSeed(`${DAILY_SEED_NAMESPACE}:${dateKey}`, {
      mode: "daily",
      dateKey,
    });
  }

  function random() {
    if (randomState.mode === "native") return nativeMathRandom();
    randomState.value = (randomState.value + 0x6D2B79F5) >>> 0;
    randomState.calls += 1;
    let value = randomState.value;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  }

  function getSnapshot() {
    return {
      version: RANDOM_STATE_VERSION,
      mode: randomState.mode,
      seed: randomState.seed,
      dateKey: randomState.dateKey,
      value: randomState.value >>> 0,
      calls: Math.max(0, Math.round(Number(randomState.calls) || 0)),
    };
  }

  function restoreSnapshot(snapshot) {
    if (!snapshot || (snapshot.mode !== "daily" && snapshot.mode !== "seeded")) {
      return useNativeRandom();
    }
    const seed = String(snapshot.seed || "");
    if (!seed) return useNativeRandom();
    randomState.mode = snapshot.mode;
    randomState.seed = seed;
    randomState.dateKey = snapshot.mode === "daily"
      ? normalizeDateKey(snapshot.dateKey)
      : null;
    randomState.value = Number.isFinite(Number(snapshot.value))
      ? Number(snapshot.value) >>> 0
      : hashSeed(seed);
    randomState.calls = Math.max(0, Math.round(Number(snapshot.calls) || 0));
    return getSnapshot();
  }

  function installMathRandom() {
    root.Math.random = random;
    return random;
  }

  function restoreNativeMathRandom() {
    root.Math.random = nativeMathRandom;
    return nativeMathRandom;
  }

  return {
    DAILY_SEED_NAMESPACE,
    GAME_SEED_NAMESPACE,
    RANDOM_STATE_VERSION,
    hashSeed,
    normalizeDateKey,
    createDailySeed,
    createRandomSeed,
    useNativeRandom,
    useSeed,
    useDailyRandom,
    random,
    getSnapshot,
    restoreSnapshot,
    installMathRandom,
    restoreNativeMathRandom,
  };
});
