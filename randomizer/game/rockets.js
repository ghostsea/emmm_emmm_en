(function (root, factory) {
  "use strict";

  let solar = root.SetiSolarSystem;
  if (!solar && typeof require === "function") {
    solar = require("../solar-system/core");
  }

  const api = factory(solar);

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.SetiRocketActions = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function (solar) {
  "use strict";

  if (!solar) {
    throw new Error("SetiSolarSystem is required before SetiRocketActions");
  }

  const SECTOR_RING_MIN = 1;
  const SECTOR_RING_MAX = 4;

  function createRocketState() {
    return {
      nextRocketId: 1,
      activeRocketId: null,
      rockets: [],
      statusNote: null,
    };
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function roundBoardCoordinate(value) {
    return Math.round(Number(value) * 100) / 100;
  }

  function normalizeBoardPoint(point) {
    const size = solar.GLOBAL_COORDINATE_SYSTEM.size;
    return {
      x: roundBoardCoordinate(clamp(Number(point.x), 0, size)),
      y: roundBoardCoordinate(clamp(Number(point.y), 0, size)),
    };
  }

  function normalizePolarPoint(point) {
    const maxRadius = solar.GLOBAL_COORDINATE_SYSTEM.size / 2;
    return {
      radius: roundBoardCoordinate(clamp(Number(point.radius), 0, maxRadius)),
      angleDegrees: roundBoardCoordinate(Number(point.angleDegrees)),
    };
  }

  function getPolarPointFromBoardPoint(point) {
    return normalizePolarPoint(solar.globalPointToPolarPoint(point));
  }

  function getBoardPointFromPolarPoint(point) {
    return normalizeBoardPoint(solar.polarToGlobalPoint(point.radius, point.angleDegrees));
  }

  function sectorKey(sectorX, sectorY) {
    return `${sectorX},${sectorY}`;
  }

  function createRocketSnapshot(rocket) {
    const polar = normalizePolarPoint(rocket);
    const board = getBoardPointFromPolarPoint(polar);
    const sectorResolution = solar.resolveSectorCoordinateFromGlobalPoint(board);

    return {
      id: rocket.id,
      playerId: rocket.playerId || null,
      color: rocket.color || null,
      polar,
      board,
      sectorCoordinate: sectorResolution.sectorCoordinate,
      sectorReason: sectorResolution.reason || null,
      slotIndex: Number.isInteger(rocket.slotIndex) ? rocket.slotIndex : null,
      slotSectorCoordinate: Number.isInteger(rocket.sectorX) && Number.isInteger(rocket.sectorY)
        ? { x: rocket.sectorX, y: rocket.sectorY }
        : null,
      launchGrid: rocket.launchGrid ? { ...rocket.launchGrid } : null,
      launchSectorCoordinate: rocket.launchSectorCoordinate ? { ...rocket.launchSectorCoordinate } : null,
    };
  }

  /** 状态记录器：扫描当前火箭，得到「每个扇区 -> 已占用槽位」的实时占用表。 */
  function getSectorOccupancy(rocketState, excludeRocketId) {
    const occupancy = new Map();
    for (const rocket of rocketState.rockets) {
      if (rocket.id === excludeRocketId) continue;
      if (!Number.isInteger(rocket.sectorX) || !Number.isInteger(rocket.sectorY)) continue;
      if (!Number.isInteger(rocket.slotIndex)) continue;
      const key = sectorKey(rocket.sectorX, rocket.sectorY);
      if (!occupancy.has(key)) occupancy.set(key, new Map());
      occupancy.get(key).set(rocket.slotIndex, rocket.id);
    }
    return occupancy;
  }

  function getOccupiedSlotIndices(rocketState, sectorX, sectorY, excludeRocketId) {
    const slots = getSectorOccupancy(rocketState, excludeRocketId).get(sectorKey(sectorX, sectorY));
    return slots ? new Set(slots.keys()) : new Set();
  }

  /** 按优先顺序（中心->四角->四边）返回该扇区第一个空闲槽位；满了返回 null。 */
  function findAvailableSlotIndex(rocketState, sectorX, sectorY, excludeRocketId) {
    const occupied = getOccupiedSlotIndices(rocketState, sectorX, sectorY, excludeRocketId);
    for (const slotIndex of solar.LAUNCH_SLOT_PRIORITY) {
      if (!occupied.has(slotIndex)) return slotIndex;
    }
    return null;
  }

  function assignRocketToSlot(rocket, sectorX, sectorY, slotIndex) {
    const slot = solar.getSectorLaunchSlot(sectorX, sectorY, slotIndex);
    rocket.sectorX = sectorX;
    rocket.sectorY = sectorY;
    rocket.slotIndex = slot.slotIndex;
    rocket.radius = slot.radius;
    rocket.angleDegrees = slot.angleDegrees;
    return rocket;
  }

  /** 把火箭放进目标扇区的优先空位；扇区已满则不放置并返回 false。 */
  function placeRocketByPriority(rocketState, rocket, sectorX, sectorY) {
    const slotIndex = findAvailableSlotIndex(rocketState, sectorX, sectorY, rocket.id);
    if (slotIndex === null) return false;
    assignRocketToSlot(rocket, sectorX, sectorY, slotIndex);
    return true;
  }

  function getRocketSectorCoordinate(rocket) {
    if (Number.isInteger(rocket.sectorX) && Number.isInteger(rocket.sectorY)) {
      return { x: rocket.sectorX, y: rocket.sectorY };
    }
    const resolution = solar.resolveSectorCoordinateFromGlobalPoint(getBoardPointFromPolarPoint(rocket));
    return resolution.sectorCoordinate || { x: 0, y: SECTOR_RING_MIN };
  }

  function launchRocketAtSector(rocketState, sectorCoordinate, input) {
    const source = input || {};
    const sectorX = solar.mod8(sectorCoordinate.x);
    const sectorY = clamp(Number(sectorCoordinate.y), SECTOR_RING_MIN, SECTOR_RING_MAX);
    const rocket = {
      id: rocketState.nextRocketId,
      playerId: source.playerId || null,
      color: source.color || null,
    };

    if (!placeRocketByPriority(rocketState, rocket, sectorX, sectorY)) {
      const message = `扇区[${sectorX},${sectorY}]已满，无法发射`;
      rocketState.statusNote = message;
      return { ok: false, rocket: null, message };
    }

    rocket.launchGrid = { x: sectorX, y: sectorY };
    rocket.launchSectorCoordinate = { x: sectorX, y: sectorY };
    rocketState.nextRocketId += 1;
    rocketState.activeRocketId = rocket.id;
    rocketState.rockets.push(rocket);

    const message = `发射 R${rocket.id} -> 扇区[${rocket.sectorX},${rocket.sectorY}]#${rocket.slotIndex}`;
    rocketState.statusNote = message;
    return { ok: true, rocket, message };
  }

  function setActiveRocket(rocketState, rocketId) {
    const rocket = rocketState.rockets.find((item) => item.id === rocketId);
    if (!rocket) {
      const message = `火箭 R${rocketId} 不存在`;
      rocketState.statusNote = message;
      return { ok: false, rocket: null, message };
    }

    rocketState.activeRocketId = rocket.id;
    return { ok: true, rocket, message: null };
  }

  function getRocketsForPlayer(rocketState, playerId) {
    if (!playerId) return [...rocketState.rockets];
    return rocketState.rockets.filter((rocket) => rocket.playerId === playerId);
  }

  function moveRocket(rocketState, rocketId, deltaX, deltaY) {
    const activation = setActiveRocket(rocketState, rocketId);
    if (!activation.ok) return activation;
    return moveActiveRocket(rocketState, deltaX, deltaY);
  }

  function moveActiveRocket(rocketState, deltaX, deltaY) {
    const rocket = rocketState.rockets.find((item) => item.id === rocketState.activeRocketId);
    if (!rocket) {
      const message = "没有可移动的当前火箭";
      rocketState.statusNote = message;
      return { ok: false, rocket: null, message };
    }

    const current = getRocketSectorCoordinate(rocket);
    const sectorX = solar.mod8(current.x + Number(deltaX || 0));
    const sectorY = clamp(current.y + Number(deltaY || 0), SECTOR_RING_MIN, SECTOR_RING_MAX);

    if (sectorX === rocket.sectorX && sectorY === rocket.sectorY) {
      const message = `R${rocket.id} 已在边界，无法继续移动`;
      rocketState.statusNote = message;
      return { ok: false, rocket, message };
    }

    if (!placeRocketByPriority(rocketState, rocket, sectorX, sectorY)) {
      const message = `扇区[${sectorX},${sectorY}]已满，R${rocket.id} 保持原位`;
      rocketState.statusNote = message;
      return { ok: false, rocket, message };
    }

    const message = `R${rocket.id} -> 扇区[${rocket.sectorX},${rocket.sectorY}]#${rocket.slotIndex}`;
    rocketState.statusNote = message;
    return { ok: true, rocket, message };
  }

  function getActiveRocket(rocketState) {
    if (!rocketState?.activeRocketId) return null;
    return rocketState.rockets.find((rocket) => rocket.id === rocketState.activeRocketId) || null;
  }

  function removeRocket(rocketState, rocketId) {
    const index = rocketState.rockets.findIndex((rocket) => rocket.id === rocketId);
    if (index === -1) {
      const message = `火箭 R${rocketId} 不存在`;
      rocketState.statusNote = message;
      return { ok: false, rocketId, message };
    }

    rocketState.rockets.splice(index, 1);
    if (rocketState.activeRocketId === rocketId) {
      const next = rocketState.rockets[rocketState.rockets.length - 1];
      rocketState.activeRocketId = next ? next.id : null;
    }

    const message = `移除 R${rocketId}`;
    rocketState.statusNote = message;
    return { ok: true, rocketId, message };
  }

  function serializeSectorOccupancy(rocketState) {
    return Object.fromEntries(
      [...getSectorOccupancy(rocketState).entries()].map(([key, slots]) => [
        key,
        [...slots.keys()].sort((a, b) => a - b),
      ]),
    );
  }

  return Object.freeze({
    SECTOR_RING_MIN,
    SECTOR_RING_MAX,
    createRocketState,
    normalizeBoardPoint,
    normalizePolarPoint,
    getPolarPointFromBoardPoint,
    getBoardPointFromPolarPoint,
    createRocketSnapshot,
    getSectorOccupancy,
    getOccupiedSlotIndices,
    findAvailableSlotIndex,
    assignRocketToSlot,
    placeRocketByPriority,
    getRocketSectorCoordinate,
    getActiveRocket,
    setActiveRocket,
    getRocketsForPlayer,
    removeRocket,
    launchRocketAtSector,
    moveRocket,
    moveActiveRocket,
    serializeSectorOccupancy,
  });
});
