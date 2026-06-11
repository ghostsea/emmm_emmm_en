(function (root, factory) {
  "use strict";

  const api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.SetiBasicCards = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function () {
  "use strict";

  const BASIC_CARD_COUNT = 140;
  const BASIC_CARD_BASE_PATH = "../assets/cards/basic/split/b_";

  function getBasicCardSrc(cardIndex) {
    return `${BASIC_CARD_BASE_PATH}${cardIndex}.webp`;
  }

  function createBasicHandCard(cardIndex, sequence) {
    return {
      id: `basic-${cardIndex}-${sequence}`,
      src: getBasicCardSrc(cardIndex),
      faceUp: true,
      cardIndex,
    };
  }

  function buildBasicCardPool(excludeCardIndexes) {
    const excluded = new Set(Array.isArray(excludeCardIndexes) ? excludeCardIndexes : []);
    const pool = [];

    for (let cardIndex = 1; cardIndex <= BASIC_CARD_COUNT; cardIndex += 1) {
      if (!excluded.has(cardIndex)) pool.push(cardIndex);
    }

    return pool;
  }

  function pickRandomBasicCard(excludeCardIndexes, random = Math.random) {
    const pool = buildBasicCardPool(excludeCardIndexes);
    if (!pool.length) return null;

    const pickIndex = Math.floor(random() * pool.length);
    return createBasicHandCard(pool[pickIndex], pickIndex);
  }

  function pickRandomBasicCards(count, random = Math.random) {
    const pool = buildBasicCardPool();
    const picked = [];
    const target = Math.max(0, Math.round(count));

    for (let index = 0; index < target && pool.length > 0; index += 1) {
      const pickIndex = Math.floor(random() * pool.length);
      picked.push(createBasicHandCard(pool.splice(pickIndex, 1)[0], index));
    }

    return picked;
  }

  return Object.freeze({
    BASIC_CARD_COUNT,
    BASIC_CARD_BASE_PATH,
    getBasicCardSrc,
    createBasicHandCard,
    pickRandomBasicCard,
    pickRandomBasicCards,
  });
});
