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

  root.SetiAIBelief = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function (seedModule) {
  "use strict";

  function normalizeSeed(seed) {
    return seedModule.normalizeSeedInput(seed ?? "seti-belief");
  }

  function numeric(value, fallback = 0) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }

  function clone(value) {
    if (value == null) return value;
    if (typeof structuredClone === "function") return structuredClone(value);
    return JSON.parse(JSON.stringify(value));
  }

  function asArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function cardId(card) {
    if (card == null) return null;
    if (typeof card === "string") return card;
    return card.cardId || card.id || card.label || null;
  }

  function collectKnownCardIds(observation = {}) {
    const known = new Set();
    const publicCards = asArray(observation.public?.publicCards);
    const discardPile = asArray(observation.public?.discardPile);
    const privateHand = asArray(observation.private?.currentPlayer?.hand);
    const privateReserved = asArray(observation.private?.currentPlayer?.reservedCards);

    for (const card of [...publicCards, ...discardPile, ...privateHand, ...privateReserved]) {
      const id = cardId(card);
      if (id) known.add(id);
    }

    return known;
  }

  function normalizeCardPool(cardPool = []) {
    const ids = [];
    for (const card of cardPool || []) {
      const id = cardId(card);
      if (!id) continue;
      ids.push(String(id));
    }
    return ids;
  }

  function buildUnknownCardPool(observation = {}, options = {}) {
    const pool = normalizeCardPool(options.cardPool || []);
    const known = collectKnownCardIds(observation);
    return pool.filter((id) => !known.has(id));
  }

  function popRandom(pool = [], random = Math.random) {
    if (!pool.length) return null;
    const index = Math.floor(random() * pool.length);
    const card = pool[index];
    pool.splice(index, 1);
    return card;
  }

  function takeMany(pool = [], count = 0, random = Math.random) {
    const cards = [];
    for (let index = 0; index < count; index += 1) {
      const picked = popRandom(pool, random);
      cards.push(picked || null);
    }
    return cards;
  }

  function sampleBeliefState(observation = {}, options = {}) {
    const seed = normalizeSeed(options.seed);
    const random = seedModule.createSeededRandom(seed);
    const sampleCount = Math.max(1, Math.round(numeric(options.sampleCount, 1)));
    const includeDrawPilePreview = options.includeDrawPilePreview !== false;
    const drawPilePreviewCount = Math.max(0, Math.round(numeric(options.drawPilePreviewCount, 3)));
    const hiddenOpponents = asArray(observation.hidden?.opponents);
    const unknownPool = buildUnknownCardPool(observation, options);

    const samples = [];
    for (let index = 0; index < sampleCount; index += 1) {
      const samplePool = [...unknownPool];
      const opponents = hiddenOpponents.map((opponent) => {
        const handSize = Math.max(0, Math.round(numeric(opponent.handSize, 0)));
        const reservedCount = Math.max(0, Math.round(numeric(opponent.reservedCardCount, 0)));
        return {
          playerId: opponent.id || null,
          hand: takeMany(samplePool, handSize, random),
          reserved: takeMany(samplePool, reservedCount, random),
        };
      });

      samples.push({
        sampleId: `${seed}:${index + 1}`,
        opponents,
        drawPilePreview: includeDrawPilePreview ? takeMany(samplePool, drawPilePreviewCount, random) : [],
        remainingUnknownCount: samplePool.length,
      });
    }

    return {
      version: 1,
      seed,
      sampleCount,
      unknownPoolSize: unknownPool.length,
      samples,
    };
  }

  function summarizeBeliefSamples(result = {}) {
    const summary = {
      version: result.version || 1,
      seed: result.seed || null,
      sampleCount: Math.max(0, Math.round(numeric(result.sampleCount, 0))),
      unknownPoolSize: Math.max(0, Math.round(numeric(result.unknownPoolSize, 0))),
      opponentHandAverages: {},
    };

    const totals = {};
    for (const sample of asArray(result.samples)) {
      for (const opponent of asArray(sample.opponents)) {
        const key = opponent.playerId || "unknown";
        if (!totals[key]) {
          totals[key] = { hand: 0, reserved: 0, count: 0 };
        }
        totals[key].hand += asArray(opponent.hand).filter(Boolean).length;
        totals[key].reserved += asArray(opponent.reserved).filter(Boolean).length;
        totals[key].count += 1;
      }
    }

    for (const [playerId, metrics] of Object.entries(totals)) {
      summary.opponentHandAverages[playerId] = {
        hand: metrics.count > 0 ? metrics.hand / metrics.count : 0,
        reserved: metrics.count > 0 ? metrics.reserved / metrics.count : 0,
      };
    }

    return summary;
  }

  return Object.freeze({
    buildUnknownCardPool,
    sampleBeliefState,
    summarizeBeliefSamples,
    clone,
  });
});
