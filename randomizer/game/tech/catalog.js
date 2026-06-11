(function (root, factory) {
  "use strict";

  const api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.SetiTechCatalog = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function () {
  "use strict";

  const TECH_TYPES = Object.freeze(["blue", "orange", "purple"]);
  const PIECES_PER_SLOT = 4;
  const PIECES_PER_TYPE = PIECES_PER_SLOT;

  const TECH_TYPE_LABELS = Object.freeze({
    blue: "探测器科技",
    orange: "望远镜科技",
    purple: "计算机科技",
  });

  const STACK_INDEX_BY_TILE = Object.freeze(
    Object.fromEntries(
      TECH_TYPES.flatMap((type) => [1, 2, 3, 4].map((index) => [`${type}${index}`, index])),
    ),
  );

  const TILE_IDS_BY_TYPE = Object.freeze(
    Object.fromEntries(
      TECH_TYPES.map((type) => [type, Object.freeze([1, 2, 3, 4].map((index) => `${type}${index}`))]),
    ),
  );

  const TECH_TILE_IDS = Object.freeze(TECH_TYPES.flatMap((type) => [...TILE_IDS_BY_TYPE[type]]));

  const BONUS_IDS = Object.freeze(["bonus_3f", "bonus_1p", "bonus_1m", "bonus_1c"]);

  const BONUS_LABELS = Object.freeze({
    bonus_3f: "3 分",
    bonus_1p: "1 能量",
    bonus_1m: "1 宣传",
    bonus_1c: "1 张手牌",
  });

  const BONUS_EFFECTS = Object.freeze({
    bonus_3f: Object.freeze({ score: 3 }),
    bonus_1p: Object.freeze({ energy: 1 }),
    bonus_1m: Object.freeze({ publicity: 1 }),
    bonus_1c: Object.freeze({ drawCard: 1 }),
  });

  const FIRST_TAKE_TYPE_SCORE = 2;
  const RESEARCH_PUBLICITY_COST = 6;

  function getTechType(tileId) {
    const match = String(tileId || "").match(/^(blue|orange|purple)\d$/);
    return match ? match[1] : null;
  }

  function getStackIndex(tileId) {
    return STACK_INDEX_BY_TILE[tileId] || null;
  }

  function shuffleBonusIds(random = Math.random) {
    const pool = [...BONUS_IDS];
    for (let index = pool.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(random() * (index + 1));
      [pool[index], pool[swapIndex]] = [pool[swapIndex], pool[index]];
    }
    return pool;
  }

  return Object.freeze({
    TECH_TYPES,
    PIECES_PER_SLOT,
    PIECES_PER_TYPE,
    TECH_TYPE_LABELS,
    TECH_TILE_IDS,
    TILE_IDS_BY_TYPE,
    BONUS_IDS,
    BONUS_LABELS,
    BONUS_EFFECTS,
    FIRST_TAKE_TYPE_SCORE,
    RESEARCH_PUBLICITY_COST,
    getTechType,
    getStackIndex,
    shuffleBonusIds,
  });
});
