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
  const ROCKET_SURFACE = Object.freeze({
    SOLAR: "solar-board",
    PLANETS_REFERENCE: "planets-reference",
  });

  function createRocketState() {
    return {
      nextRocketId: 1,
      activeRocketId: null,
      rockets: [],
      playerRocketSequences: {},
      statusNote: null,
    };
  }

  function getPlayerRocketSequenceSet(rocketState, playerId) {
    if (!playerId) return null;
    if (!rocketState.playerRocketSequences[playerId]) {
      rocketState.playerRocketSequences[playerId] = new Set();
    }
    return rocketState.playerRocketSequences[playerId];
  }

  function allocatePlayerRocketSequence(rocketState, playerId) {
    const used = getPlayerRocketSequenceSet(rocketState, playerId);
    if (!used) return null;

    let sequence = 1;
    while (used.has(sequence)) sequence += 1;
    used.add(sequence);
    return sequence;
  }

  function releasePlayerRocketSequence(rocketState, playerId, sequence) {
    const used = rocketState.playerRocketSequences?.[playerId];
    if (!used || !Number.isInteger(sequence)) return;
    used.delete(sequence);
  }

  function isControllablePlayerRocket(rocket) {
    if (!rocket?.playerId) return false;
    if (getRocketSurface(rocket) !== ROCKET_SURFACE.SOLAR) return false;
    if (rocket.referencePlacement?.isPlanetMarker) return false;
    return true;
  }

  function formatRocketLabel(rocket) {
    if (Number.isInteger(rocket?.playerSequence)) {
      return `R${rocket.playerSequence}`;
    }
    return `R${rocket?.id ?? "?"}`;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function roundBoardCoordinate(value) {
    return Math.round(Number(value) * 100) / 100;
  }

  function getRocketSurface(rocket) {
    return rocket?.surface || ROCKET_SURFACE.SOLAR;
  }

  function hasPolarPoint(point) {
    return Number.isFinite(Number(point?.radius)) && Number.isFinite(Number(point?.angleDegrees));
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

  function normalizePlanetsReferencePoint(point) {
    const width = Math.max(1, roundBoardCoordinate(Number(point.width || point.assetWidth || 1)));
    const height = Math.max(1, roundBoardCoordinate(Number(point.height || point.assetHeight || 1)));
    const percentX = point.percentX == null
      ? (Number(point.x || 0) / width) * 100
      : Number(point.percentX);
    const percentY = point.percentY == null
      ? (Number(point.y || 0) / height) * 100
      : Number(point.percentY);
    const normalizedPercentX = roundBoardCoordinate(clamp(percentX, 0, 100));
    const normalizedPercentY = roundBoardCoordinate(clamp(percentY, 0, 100));
    const x = point.x == null
      ? (normalizedPercentX / 100) * width
      : Number(point.x);
    const y = point.y == null
      ? (normalizedPercentY / 100) * height
      : Number(point.y);

    return {
      x: roundBoardCoordinate(clamp(x, 0, width)),
      y: roundBoardCoordinate(clamp(y, 0, height)),
      percentX: normalizedPercentX,
      percentY: normalizedPercentY,
      width,
      height,
    };
  }

  function sectorKey(sectorX, sectorY) {
    return `${sectorX},${sectorY}`;
  }

  function createRocketSnapshot(rocket) {
    const surface = getRocketSurface(rocket);
    const polar = hasPolarPoint(rocket) ? normalizePolarPoint(rocket) : null;
    const board = polar ? getBoardPointFromPolarPoint(polar) : null;
    const sectorResolution = surface === ROCKET_SURFACE.SOLAR && board
      ? solar.resolveSectorCoordinateFromGlobalPoint(board)
      : { sectorCoordinate: null, reason: surface === ROCKET_SURFACE.SOLAR ? "missing-polar" : "reference-surface" };

    return {
      id: rocket.id,
      playerId: rocket.playerId || null,
      playerSequence: Number.isInteger(rocket.playerSequence) ? rocket.playerSequence : null,
      color: rocket.color || null,
      surface,
      polar,
      board,
      sectorCoordinate: sectorResolution.sectorCoordinate,
      sectorReason: sectorResolution.reason || null,
      slotIndex: Number.isInteger(rocket.slotIndex) ? rocket.slotIndex : null,
      slotSectorCoordinate: surface === ROCKET_SURFACE.SOLAR
      && Number.isInteger(rocket.sectorX)
      && Number.isInteger(rocket.sectorY)
      && Number.isInteger(rocket.slotIndex)
        ? { x: rocket.sectorX, y: rocket.sectorY }
        : null,
      launchGrid: rocket.launchGrid ? { ...rocket.launchGrid } : null,
      launchSectorCoordinate: rocket.launchSectorCoordinate ? { ...rocket.launchSectorCoordinate } : null,
      planetsReference: rocket.planetsReference ? { ...rocket.planetsReference } : null,
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
    rocket.surface = ROCKET_SURFACE.SOLAR;
    rocket.planetsReference = null;
    rocket.sectorX = sectorX;
    rocket.sectorY = sectorY;
    rocket.slotIndex = slot.slotIndex;
    rocket.radius = slot.radius;
    rocket.angleDegrees = slot.angleDegrees;
    return rocket;
  }

  function clearRocketSectorSlot(rocket) {
    rocket.sectorX = null;
    rocket.sectorY = null;
    rocket.slotIndex = null;
  }

  function assignRocketToBoardPoint(rocket, boardPoint) {
    const board = normalizeBoardPoint(boardPoint);
    const polar = getPolarPointFromBoardPoint(board);
    const resolution = solar.resolveSectorCoordinateFromGlobalPoint(board);

    rocket.surface = ROCKET_SURFACE.SOLAR;
    rocket.planetsReference = null;
    rocket.radius = polar.radius;
    rocket.angleDegrees = polar.angleDegrees;
    rocket.slotIndex = null;

    if (resolution.sectorCoordinate) {
      rocket.sectorX = resolution.sectorCoordinate.x;
      rocket.sectorY = resolution.sectorCoordinate.y;
    } else {
      clearRocketSectorSlot(rocket);
    }

    return rocket;
  }

  function assignRocketToPlanetsReferencePoint(rocket, point) {
    rocket.surface = ROCKET_SURFACE.PLANETS_REFERENCE;
    rocket.planetsReference = normalizePlanetsReferencePoint(point);
    rocket.radius = null;
    rocket.angleDegrees = null;
    clearRocketSectorSlot(rocket);
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
    if (getRocketSurface(rocket) !== ROCKET_SURFACE.SOLAR) return null;
    if (Number.isInteger(rocket.sectorX) && Number.isInteger(rocket.sectorY)) {
      return { x: rocket.sectorX, y: rocket.sectorY };
    }
    if (!hasPolarPoint(rocket)) return null;
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
    rocket.playerSequence = allocatePlayerRocketSequence(rocketState, rocket.playerId);
    rocketState.nextRocketId += 1;
    rocketState.activeRocketId = rocket.id;
    rocketState.rockets.push(rocket);

    const message = `发射 ${formatRocketLabel(rocket)} -> 扇区[${rocket.sectorX},${rocket.sectorY}]#${rocket.slotIndex}`;
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
    return rocketState.rockets
      .filter(isControllablePlayerRocket)
      .filter((rocket) => !playerId || rocket.playerId === playerId)
      .sort((left, right) => left.playerSequence - right.playerSequence);
  }

  function canMoveRocket(rocketState, rocketId, deltaX, deltaY) {
    const rocket = rocketState.rockets.find((item) => item.id === rocketId);
    if (!rocket) {
      const message = `火箭 R${rocketId} 不存在`;
      return { ok: false, rocket: null, message };
    }

    const current = getRocketSectorCoordinate(rocket);
    if (!current) {
      const message = `R${rocket.id} 不在主盘扇区内，无法用快捷按钮移动`;
      return { ok: false, rocket, message };
    }

    const sectorX = solar.mod8(current.x + Number(deltaX || 0));
    const sectorY = clamp(current.y + Number(deltaY || 0), SECTOR_RING_MIN, SECTOR_RING_MAX);

    if (sectorX === rocket.sectorX && sectorY === rocket.sectorY) {
      const message = `R${rocket.id} 已在边界，无法继续移动`;
      return { ok: false, rocket, message };
    }

    if (findAvailableSlotIndex(rocketState, sectorX, sectorY, rocket.id) === null) {
      const message = `扇区[${sectorX},${sectorY}]已满，R${rocket.id} 无法移动`;
      return { ok: false, rocket, message };
    }

    return { ok: true, rocket, message: null };
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
    if (!current) {
      const message = `R${rocket.id} 不在主盘扇区内，无法用快捷按钮移动`;
      rocketState.statusNote = message;
      return { ok: false, rocket, message };
    }
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

  function placeRocketAtBoardPoint(rocketState, rocketId, boardPoint) {
    const activation = setActiveRocket(rocketState, rocketId);
    if (!activation.ok) return activation;

    assignRocketToBoardPoint(activation.rocket, boardPoint);
    const snapshot = createRocketSnapshot(activation.rocket);
    const sectorText = snapshot.sectorCoordinate
      ? ` -> 扇区[${snapshot.sectorCoordinate.x},${snapshot.sectorCoordinate.y}]`
      : " -> 主盘扇区外";
    const message = `手动放置 R${activation.rocket.id} 主盘[${snapshot.board.x},${snapshot.board.y}]${sectorText}`;
    rocketState.statusNote = message;
    return { ok: true, rocket: activation.rocket, message };
  }

  function placeRocketAtPlanetsReferencePoint(rocketState, rocketId, point) {
    const activation = setActiveRocket(rocketState, rocketId);
    if (!activation.ok) return activation;

    assignRocketToPlanetsReferencePoint(activation.rocket, point);
    const reference = activation.rocket.planetsReference;
    const message = `手动放置 R${activation.rocket.id} planets贴图[${reference.x},${reference.y}] (${reference.percentX}%,${reference.percentY}%)`;
    rocketState.statusNote = message;
    return { ok: true, rocket: activation.rocket, message };
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

    const removedRocket = rocketState.rockets[index];
    if (isControllablePlayerRocket(removedRocket)) {
      releasePlayerRocketSequence(
        rocketState,
        removedRocket.playerId,
        removedRocket.playerSequence,
      );
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
    ROCKET_SURFACE,
    createRocketState,
    normalizeBoardPoint,
    normalizePolarPoint,
    normalizePlanetsReferencePoint,
    getRocketSurface,
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
    isControllablePlayerRocket,
    formatRocketLabel,
    removeRocket,
    placeRocketAtBoardPoint,
    placeRocketAtPlanetsReferencePoint,
    launchRocketAtSector,
    canMoveRocket,
    moveRocket,
    moveActiveRocket,
    serializeSectorOccupancy,
  });
});
