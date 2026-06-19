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

  root.SetiPlayerTech = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function (catalog) {
  "use strict";

  const BLUE_BOARD_SLOTS = [1, 2, 3, 4];

  function migrateOwnedTiles(source = {}) {
    const ownedTiles = {};

    if (source.ownedTiles && typeof source.ownedTiles === "object") {
      for (const tileId of catalog.TECH_TILE_IDS) {
        if (source.ownedTiles[tileId]) ownedTiles[tileId] = true;
      }
    }

    const legacy = source.ownedTileByType;
    if (legacy && typeof legacy === "object") {
      for (const techType of catalog.TECH_TYPES) {
        const tileId = legacy[techType];
        if (tileId && catalog.TECH_TILE_IDS.includes(tileId)) {
          ownedTiles[tileId] = true;
        }
      }
    }

    return ownedTiles;
  }

  function migrateDisabledTiles(source = {}, ownedTiles = {}) {
    const disabledTiles = {};

    if (source.disabledTiles && typeof source.disabledTiles === "object") {
      for (const tileId of catalog.TECH_TILE_IDS) {
        if (ownedTiles[tileId] && source.disabledTiles[tileId]) {
          disabledTiles[tileId] = true;
        }
      }
    }

    return disabledTiles;
  }

  function migrateBlueBoardSlots(source = {}, ownedTiles = {}) {
    const blueBoardSlots = {};

    if (source.blueBoardSlots && typeof source.blueBoardSlots === "object") {
      for (const [tileId, slot] of Object.entries(source.blueBoardSlots)) {
        const normalizedSlot = Number(slot);
        if (ownedTiles[tileId] && BLUE_BOARD_SLOTS.includes(normalizedSlot)) {
          blueBoardSlots[tileId] = normalizedSlot;
        }
      }
    }

    if (Number.isInteger(source.blueBoardSlot) && ownedTiles.blue) {
      blueBoardSlots.blue = source.blueBoardSlot;
    }

    return blueBoardSlots;
  }

  function createPlayerTechState(source = {}) {
    const ownedTiles = migrateOwnedTiles(source);
    return {
      ownedTiles,
      disabledTiles: migrateDisabledTiles(source, ownedTiles),
      blueBoardSlots: migrateBlueBoardSlots(source, ownedTiles),
    };
  }

  function normalizePlayerTechState(source) {
    return createPlayerTechState(source || {});
  }

  function playerOwnsTile(playerTech, tileId) {
    return Boolean(playerTech?.ownedTiles?.[tileId]);
  }

  function isTileDisabled(playerTech, tileId) {
    return Boolean(playerTech?.disabledTiles?.[tileId]);
  }

  function playerHasActiveTile(playerTech, tileId) {
    return playerOwnsTile(playerTech, tileId) && !isTileDisabled(playerTech, tileId);
  }

  function getOccupiedBlueSlots(playerTech) {
    const occupied = new Set();
    for (const tileId of catalog.TILE_IDS_BY_TYPE.blue) {
      if (!playerHasActiveTile(playerTech, tileId)) continue;
      const slot = Number(playerTech?.blueBoardSlots?.[tileId]);
      if (BLUE_BOARD_SLOTS.includes(slot)) occupied.add(slot);
    }
    return occupied;
  }

  function getAvailableBlueSlots(playerTech) {
    const occupied = getOccupiedBlueSlots(playerTech);
    return BLUE_BOARD_SLOTS.filter((slot) => !occupied.has(slot));
  }

  function getBlueBoardSlot(playerTech, tileId) {
    if (catalog.getTechType(tileId) !== "blue") return null;
    const slot = Number(playerTech?.blueBoardSlots?.[tileId]);
    return BLUE_BOARD_SLOTS.includes(slot) ? slot : null;
  }

  function canPlayerTakeTile(playerTech, tileId) {
    if (!catalog.TECH_TILE_IDS.includes(tileId) || playerOwnsTile(playerTech, tileId)) {
      return false;
    }
    if (catalog.getTechType(tileId) === "blue" && getAvailableBlueSlots(playerTech).length === 0) {
      return false;
    }
    return true;
  }

  function recordPlayerTake(playerTech, tileId, blueSlot = null) {
    if (!catalog.TECH_TILE_IDS.includes(tileId)) {
      return { ok: false, message: `未知科技板块 ${tileId}` };
    }
    if (playerOwnsTile(playerTech, tileId)) {
      return {
        ok: false,
        message: isTileDisabled(playerTech, tileId) ? `${tileId} 已在版图（已失效）` : `已拥有 ${tileId}`,
      };
    }

    const techType = catalog.getTechType(tileId);
    let resolvedBlueSlot = null;

    if (techType === "blue") {
      resolvedBlueSlot = Number(blueSlot);
      const availableSlots = getAvailableBlueSlots(playerTech);
      if (!availableSlots.includes(resolvedBlueSlot)) {
        return { ok: false, message: `蓝色科技位置 ${blueSlot} 不可用` };
      }
      if (!playerTech.blueBoardSlots) playerTech.blueBoardSlots = {};
      playerTech.blueBoardSlots[tileId] = resolvedBlueSlot;
    }

    if (!playerTech.ownedTiles) playerTech.ownedTiles = {};
    playerTech.ownedTiles[tileId] = true;
    return { ok: true, tileId, techType, blueSlot: resolvedBlueSlot };
  }

  function listOwnedTileIds(playerTech) {
    return catalog.TECH_TILE_IDS.filter((tileId) => playerOwnsTile(playerTech, tileId));
  }

  function listActiveOwnedTileIds(playerTech) {
    return catalog.TECH_TILE_IDS.filter((tileId) => playerHasActiveTile(playerTech, tileId));
  }

  function removePlayerTile(playerTech, tileId) {
    if (!catalog.TECH_TILE_IDS.includes(tileId)) {
      return { ok: false, message: `未知科技板块 ${tileId}` };
    }
    if (!playerOwnsTile(playerTech, tileId)) {
      return { ok: false, message: `未拥有 ${tileId}` };
    }
    if (isTileDisabled(playerTech, tileId)) {
      return { ok: false, message: `${tileId} 已失效` };
    }
    const techType = catalog.getTechType(tileId);
    if (techType === "blue") {
      return { ok: false, message: "不能移除蓝色科技" };
    }
    if (!playerTech.disabledTiles) playerTech.disabledTiles = {};
    playerTech.disabledTiles[tileId] = true;
    return { ok: true, tileId, techType, disabled: true };
  }

  return Object.freeze({
    createPlayerTechState,
    normalizePlayerTechState,
    playerOwnsTile,
    playerHasActiveTile,
    isTileDisabled,
    canPlayerTakeTile,
    recordPlayerTake,
    removePlayerTile,
    listOwnedTileIds,
    listActiveOwnedTileIds,
    getAvailableBlueSlots,
    getBlueBoardSlot,
  });
});
