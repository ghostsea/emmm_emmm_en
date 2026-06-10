(function () {
  "use strict";

  const solar = window.SetiSolarSystem;

  /** 与官网 main.js 一致的每层转盘随机偏移基数 */
  const WHEEL_OFFSETS = [0, 0, 20, 11, 4];
  const ROCKET_IMAGE_SRC = "../assets/tokens/rocket.png";
  const ROCKET_IMAGE_SCALE = 0.08;
  const SECTOR_RING_MIN = 1;
  const SECTOR_RING_MAX = 4;

  const state = solar.createBaselineState();
  const rocketState = {
    nextRocketId: 1,
    activeRocketId: null,
    draggingRocketId: null,
    draggingRocketElement: null,
    rockets: [],
    savedCoordinates: [],
    lastSavedFilename: null,
    statusNote: null,
  };

  const els = {
    appWrap: document.querySelector(".app-wrap"),
    boardShell: document.getElementById("board-shell"),
    reportDock: document.getElementById("report-dock"),
    wheelWrap: document.getElementById("wheel-wrap"),
    tokenLayer: document.getElementById("token-layer"),
    buttonWrap: document.getElementById("button-wrap"),
    wheels: {
      1: document.getElementById("wheel-1"),
      2: document.getElementById("wheel-2"),
      3: document.getElementById("wheel-3"),
      4: document.getElementById("wheel-4"),
    },
    sectorWraps: {
      1: document.getElementById("sector-wrap-1"),
      2: document.getElementById("sector-wrap-2"),
      3: document.getElementById("sector-wrap-3"),
      4: document.getElementById("sector-wrap-4"),
    },
    spinButton: document.getElementById("spin-button"),
    debugToggle: document.getElementById("debug-toggle"),
    debugRotateButton: document.getElementById("debug-rotate-button"),
    debugLaunchButton: document.getElementById("debug-launch-button"),
    debugSaveButton: document.getElementById("debug-save-button"),
    debugMovePad: document.getElementById("debug-move-pad"),
    debugReadout: document.getElementById("debug-readout"),
    logToggle: document.getElementById("log-toggle"),
    stateReadout: document.getElementById("state-readout"),
  };

  function resize() {
    const h = window.innerHeight;
    const chrome = els.buttonWrap.offsetHeight + 12;
    const boardWidth = els.boardShell.clientWidth || window.innerWidth;
    const boardHeight = h - chrome - 16;
    const boardSize = Math.floor(Math.max(220, Math.min(boardWidth, boardHeight)));
    els.wheelWrap.style.width = `${boardSize}px`;
    els.wheelWrap.style.height = `${boardSize}px`;
    els.buttonWrap.style.width = `${boardSize}px`;
  }

  function setLogOpen(open) {
    els.appWrap.classList.toggle("log-collapsed", !open);
    els.logToggle.setAttribute("aria-expanded", String(open));
    resize();
  }

  function setDebugOpen(open) {
    els.appWrap.classList.toggle("debug-collapsed", !open);
    els.debugToggle.setAttribute("aria-expanded", String(open));
    resize();
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

  function getBoardPointFromClientPosition(clientX, clientY) {
    const rect = els.wheelWrap.getBoundingClientRect();
    const size = solar.GLOBAL_COORDINATE_SYSTEM.size;

    return normalizeBoardPoint({
      x: ((clientX - rect.left) / rect.width) * size,
      y: ((clientY - rect.top) / rect.height) * size,
    });
  }

  function formatBoardPoint(point) {
    return `[${point.x.toFixed(2)},${point.y.toFixed(2)}]`;
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

  function getPolarPointFromClientPosition(clientX, clientY) {
    return getPolarPointFromBoardPoint(getBoardPointFromClientPosition(clientX, clientY));
  }

  function formatPolarPoint(point) {
    return `[r=${point.radius.toFixed(2)},a=${point.angleDegrees.toFixed(2)}]`;
  }

  function formatSectorCoordinate(resolution) {
    if (!resolution?.sectorCoordinate) return "无";
    return `[${resolution.sectorCoordinate.x},${resolution.sectorCoordinate.y}]`;
  }

  function createRocketSnapshot(rocket) {
    const polar = normalizePolarPoint(rocket);
    const board = getBoardPointFromPolarPoint(polar);
    const sectorResolution = solar.resolveSectorCoordinateFromGlobalPoint(board);

    return {
      id: rocket.id,
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

  function createTimestampSlug(date) {
    const pad = (value) => String(value).padStart(2, "0");
    return [
      date.getFullYear(),
      pad(date.getMonth() + 1),
      pad(date.getDate()),
      "-",
      pad(date.getHours()),
      pad(date.getMinutes()),
      pad(date.getSeconds()),
    ].join("");
  }

  function createRocketCoordinatePayload() {
    return {
      version: 1,
      coordinateSystem: {
        ...solar.GLOBAL_COORDINATE_SYSTEM,
        primary: "polar",
        boardUnit: "0..1000",
      },
      savedAt: new Date().toISOString(),
      rockets: rocketState.savedCoordinates.map((rocket) => ({ ...rocket })),
    };
  }

  function downloadJson(filename, payload) {
    const json = `${JSON.stringify(payload, null, 2)}\n`;
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  function getEarthSectorCoordinate() {
    const snapshot = solar.createSolarSnapshot(state);
    const earth = snapshot.planetLocations.find((planet) => planet.planetId === "earth");

    if (!earth) {
      throw new Error("Earth position was not found in the current solar snapshot");
    }

    return { x: earth.x, y: earth.y };
  }

  function sectorKey(sectorX, sectorY) {
    return `${sectorX},${sectorY}`;
  }

  /** 状态记录器：扫描当前火箭，得到「每个扇区 -> 已占用槽位」的实时占用表。 */
  function getSectorOccupancy(excludeRocketId) {
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

  function getOccupiedSlotIndices(sectorX, sectorY, excludeRocketId) {
    const slots = getSectorOccupancy(excludeRocketId).get(sectorKey(sectorX, sectorY));
    return slots ? new Set(slots.keys()) : new Set();
  }

  /** 按优先顺序（中心->四角->四边）返回该扇区第一个空闲槽位；满了返回 null。 */
  function findAvailableSlotIndex(sectorX, sectorY, excludeRocketId) {
    const occupied = getOccupiedSlotIndices(sectorX, sectorY, excludeRocketId);
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
  function placeRocketByPriority(rocket, sectorX, sectorY) {
    const slotIndex = findAvailableSlotIndex(sectorX, sectorY, rocket.id);
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

  function setRocketAssetSize() {
    const image = new Image();
    image.addEventListener("load", () => {
      const width = Math.max(1, Math.round(image.naturalWidth * ROCKET_IMAGE_SCALE));
      els.tokenLayer.style.setProperty("--rocket-width", `${width}px`);
    });
    image.src = ROCKET_IMAGE_SRC;
  }

  function renderRocketElement(rocket) {
    let element = document.getElementById(`rocket-${rocket.id}`);
    if (!element) {
      element = document.createElement("img");
      element.className = "rocket-token";
      element.id = `rocket-${rocket.id}`;
      element.src = ROCKET_IMAGE_SRC;
      element.alt = `火箭 ${rocket.id}`;
      element.draggable = false;
      element.dataset.rocketId = String(rocket.id);
      element.addEventListener("pointerdown", handleRocketPointerDown);
      element.addEventListener("pointermove", handleRocketPointerMove);
      element.addEventListener("pointerup", handleRocketPointerUp);
      element.addEventListener("pointercancel", handleRocketPointerUp);
      els.tokenLayer.appendChild(element);
    }

    const boardPoint = getBoardPointFromPolarPoint(rocket);
    element.style.left = `${boardPoint.x / 10}%`;
    element.style.top = `${boardPoint.y / 10}%`;
    element.classList.toggle("is-dragging", rocketState.draggingRocketId === rocket.id);
  }

  function renderRockets() {
    rocketState.rockets.forEach(renderRocketElement);
  }

  function renderDebugReadout() {
    const activeRocket = rocketState.rockets.find((rocket) => rocket.id === rocketState.activeRocketId);
    const rocketLines = rocketState.rockets.length
      ? rocketState.rockets.map((rocket) => {
        const marker = rocket.id === rocketState.activeRocketId ? "*" : " ";
        const snapshot = createRocketSnapshot(rocket);
        const slot = snapshot.slotSectorCoordinate
          ? ` 扇区[${snapshot.slotSectorCoordinate.x},${snapshot.slotSectorCoordinate.y}]#${snapshot.slotIndex}`
          : "";
        return `${marker}R${rocket.id} ${formatPolarPoint(snapshot.polar)} ${formatBoardPoint(snapshot.board)}${slot}`;
      })
      : ["无"];
    const savedLines = rocketState.savedCoordinates.length
      ? rocketState.savedCoordinates.map((rocket) => (
        `R${rocket.id} ${formatPolarPoint(rocket.polar)} ${formatBoardPoint(rocket.board)} -> ${formatSectorCoordinate(rocket)}`
      ))
      : ["无"];
    const sectorLines = rocketState.rockets.length
      ? rocketState.rockets.map((rocket) => {
        const snapshot = createRocketSnapshot(rocket);
        return `R${rocket.id} 中心${formatBoardPoint(snapshot.board)} -> ${formatSectorCoordinate(snapshot)}`;
      })
      : ["无"];
    const occupancy = getSectorOccupancy();
    const occupancyLines = occupancy.size
      ? [...occupancy.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, slots]) => {
          const indices = [...slots.keys()].sort((a, b) => a - b).join(",");
          return `扇区[${key}] 占用#${indices}`;
        })
      : ["无"];

    els.debugReadout.textContent = [
      `坐标系 polar board-${solar.GLOBAL_COORDINATE_SYSTEM.size}`,
      activeRocket
        ? `当前 R${activeRocket.id} ${formatPolarPoint(activeRocket)} ${formatBoardPoint(getBoardPointFromPolarPoint(activeRocket))} -> ${formatSectorCoordinate(createRocketSnapshot(activeRocket))}`
        : "当前 无",
      rocketState.statusNote ? `提示 ${rocketState.statusNote}` : "提示 无",
      rocketState.lastSavedFilename ? `最近保存 ${rocketState.lastSavedFilename}` : "最近保存 无",
      "",
      "火箭坐标",
      ...rocketLines,
      "",
      "扇区占用",
      ...occupancyLines,
      "",
      "位置判定",
      ...sectorLines,
      "",
      "已保存",
      ...savedLines,
    ].join("\n");
  }

  function launchRocket() {
    const earthSector = getEarthSectorCoordinate();
    const rocket = { id: rocketState.nextRocketId };

    if (!placeRocketByPriority(rocket, earthSector.x, earthSector.y)) {
      rocketState.statusNote = `地球扇区[${earthSector.x},${earthSector.y}]已满，无法发射`;
      renderDebugReadout();
      return;
    }
    rocket.launchGrid = { ...earthSector };
    rocket.launchSectorCoordinate = { ...earthSector };

    rocketState.nextRocketId += 1;
    rocketState.activeRocketId = rocket.id;
    rocketState.rockets.push(rocket);
    rocketState.statusNote = `发射 R${rocket.id} -> 扇区[${rocket.sectorX},${rocket.sectorY}]#${rocket.slotIndex}`;
    renderRocketElement(rocket);
    renderDebugReadout();
  }

  function moveActiveRocket(deltaX, deltaY) {
    const rocket = rocketState.rockets.find((item) => item.id === rocketState.activeRocketId);
    if (!rocket) return;

    const current = getRocketSectorCoordinate(rocket);
    const sectorX = solar.mod8(current.x + Number(deltaX || 0));
    const sectorY = clamp(current.y + Number(deltaY || 0), SECTOR_RING_MIN, SECTOR_RING_MAX);

    if (sectorX === rocket.sectorX && sectorY === rocket.sectorY) {
      rocketState.statusNote = `R${rocket.id} 已在边界，无法继续移动`;
      renderDebugReadout();
      return;
    }

    if (!placeRocketByPriority(rocket, sectorX, sectorY)) {
      rocketState.statusNote = `扇区[${sectorX},${sectorY}]已满，R${rocket.id} 保持原位`;
      renderDebugReadout();
      return;
    }

    rocketState.statusNote = `R${rocket.id} -> 扇区[${rocket.sectorX},${rocket.sectorY}]#${rocket.slotIndex}`;
    renderRocketElement(rocket);
    renderDebugReadout();
  }

  function updateRocketPositionFromPointer(event) {
    const rocket = rocketState.rockets.find((item) => item.id === rocketState.activeRocketId);
    if (!rocket) return;

    const point = getPolarPointFromClientPosition(event.clientX, event.clientY);
    rocket.radius = point.radius;
    rocket.angleDegrees = point.angleDegrees;
    const resolution = solar.resolveSectorCoordinateFromGlobalPoint(getBoardPointFromPolarPoint(point));
    if (resolution.sectorCoordinate) {
      rocket.sectorX = resolution.sectorCoordinate.x;
      rocket.sectorY = resolution.sectorCoordinate.y;
    }
    renderRocketElement(rocket);
    renderDebugReadout();
  }

  function handleRocketPointerDown(event) {
    const rocketId = Number(event.currentTarget.dataset.rocketId);
    rocketState.activeRocketId = rocketId;
    rocketState.draggingRocketId = rocketId;
    rocketState.draggingRocketElement = event.currentTarget;
    if (event.currentTarget.setPointerCapture) {
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    updateRocketPositionFromPointer(event);
    event.preventDefault();
  }

  function handleRocketPointerMove(event) {
    if (!rocketState.draggingRocketId) return;

    updateRocketPositionFromPointer(event);
  }

  function handleRocketPointerUp(event) {
    const rocketId = rocketState.draggingRocketId;
    if (!rocketId) return;

    if (rocketState.draggingRocketElement?.releasePointerCapture) {
      try {
        rocketState.draggingRocketElement.releasePointerCapture(event.pointerId);
      } catch (error) {
        // Pointer capture may already be released by the browser.
      }
    }
    rocketState.draggingRocketId = null;
    rocketState.draggingRocketElement = null;
    const rocket = rocketState.rockets.find((item) => item.id === rocketId);
    if (rocket) renderRocketElement(rocket);
    renderDebugReadout();
  }

  function saveRocketCoordinates() {
    rocketState.savedCoordinates = rocketState.rockets.map(createRocketSnapshot);
    const filename = `seti-rocket-coordinates-${createTimestampSlug(new Date())}.json`;
    rocketState.lastSavedFilename = filename;
    downloadJson(filename, createRocketCoordinatePayload());
    renderDebugReadout();
  }

  function stepsToTransform(steps) {
    const rotation = steps * (Math.PI / 4);
    return `rotate(${rotation}rad)`;
  }

  function renderWheels() {
    for (let w = 1; w <= 4; w += 1) {
      els.wheels[w].style.transform = stepsToTransform(state.wheelSteps[w]);
    }
  }

  function renderSectors() {
    for (let slot = 1; slot <= 4; slot += 1) {
      const wrap = els.sectorWraps[slot];
      wrap.innerHTML = "";
      const sectorId = state.sectorBySlot[slot];
      if (!sectorId) continue;

      const sector = document.createElement("div");
      sector.className = `sector sector-${sectorId}`;
      wrap.appendChild(sector);
    }
  }

  function renderStateReadout() {
    const snapshot = solar.createSolarSnapshot(state);
    const axisLine = "坐标轴 x0=中线上方偏右第一块，顺时针递增";
    const wheelLine = [1, 2, 3, 4]
      .map((w) => `W${w}=${solar.mod8(state.wheelSteps[w])}`)
      .join("  ");
    const planetLine = snapshot.planetLocations
      .map((planet) => `${planet.name}[${planet.x},${planet.y}]`)
      .join("  ");
    const nebulaLine = snapshot.nebulaRelations
      .map((relation) => relation.displayText)
      .join("  ");
    const visibleCounts = Object.entries(snapshot.statistics.visibleMeaningfulContentCounts)
      .map(([label, count]) => `${label}=${count}`)
      .join("  ");
    els.stateReadout.textContent = [
      axisLine,
      `版图位置 ${wheelLine}`,
      `行星 ${planetLine}`,
      `星云 ${nebulaLine}`,
      `可见统计 ${visibleCounts}`,
      "",
      "可见坐标",
      formatVisibleCoordinateGroups(snapshot.visibleCoordinateGroups),
    ].join("\n");
  }

  function formatNamedCoordinates(items) {
    if (!items.length) return "无";
    return items.map((item) => {
      const label = item.kind === solar.layout.CONTENT_KIND.PLANET ? `${item.label}` : "";
      return `${label}[${item.x},${item.y}]`;
    }).join("  ");
  }

  function formatVisibleCoordinateGroups(groups) {
    return [
      `可见星球坐标 ${formatNamedCoordinates(groups.planets)}`,
      `小行星坐标 ${formatNamedCoordinates(groups.asteroids)}`,
      `彗星坐标 ${formatNamedCoordinates(groups.comets)}`,
    ].join("\n");
  }

  /** 官网 randomizeWheels 的无动画版：直接累加步数并渲染 */
  function randomizeWheels() {
    for (let w = 1; w <= 4; w += 1) {
      const delta = Math.floor(Math.random() * 8 + WHEEL_OFFSETS[w]);
      state.wheelSteps[w] -= delta;
    }
    state.rotation = solar.normalizeRotationState(state.wheelSteps, 0);
    renderWheels();
  }

  /** 官网 randomizeSectors 逻辑：将 4 个扇区洗牌分配到 4 个外边槽位 */
  function randomizeSectors() {
    const pool = [1, 2, 3, 4];
    while (pool.length) {
      const slotId = pool.length;
      const pickIndex = Math.floor(Math.random() * pool.length);
      const sectorId = pool.splice(pickIndex, 1)[0];
      state.sectorBySlot[slotId] = sectorId;
    }
    renderSectors();
  }

  function randomizeAll() {
    els.spinButton.classList.remove("pulsin");
    randomizeWheels();
    randomizeSectors();
    renderStateReadout();
  }

  function getSetupState() {
    return solar.createSetupState(state);
  }

  function rotateSolarOrbit(count) {
    state.rotation = solar.applySolarOrbitRotation(state.rotation, count || 1);
    state.wheelSteps = solar.rotationToWheelSteps(state.rotation);
    renderWheels();
    renderStateReadout();
  }

  els.spinButton.addEventListener("click", randomizeAll);
  els.debugToggle.addEventListener("click", () => {
    setDebugOpen(els.appWrap.classList.contains("debug-collapsed"));
  });
  els.debugRotateButton.addEventListener("click", () => {
    rotateSolarOrbit(1);
  });
  els.debugLaunchButton.addEventListener("click", launchRocket);
  els.debugSaveButton.addEventListener("click", saveRocketCoordinates);
  els.debugMovePad.addEventListener("click", (event) => {
    const button = event.target.closest("[data-move-x]");
    if (!button) return;
    moveActiveRocket(Number(button.dataset.moveX), Number(button.dataset.moveY));
  });
  els.logToggle.addEventListener("click", () => {
    setLogOpen(els.appWrap.classList.contains("log-collapsed"));
  });
  window.addEventListener("resize", resize);
  window.addEventListener("pointermove", handleRocketPointerMove);
  window.addEventListener("pointerup", handleRocketPointerUp);
  window.addEventListener("pointercancel", handleRocketPointerUp);

  setRocketAssetSize();
  resize();
  renderWheels();
  renderSectors();
  renderStateReadout();
  renderRockets();
  renderDebugReadout();

  window.SetiRandomizer = {
    randomize: randomizeAll,
    rotateSolarOrbit,
    launchRocket,
    moveActiveRocket,
    getSectorLaunchSlots: (x, y) => solar.getSectorLaunchSlots(x, y),
    getSectorLaunchSlot: (x, y, slotIndex) => solar.getSectorLaunchSlot(x, y, slotIndex),
    getSectorOccupancy: () => Object.fromEntries(
      [...getSectorOccupancy().entries()].map(([key, slots]) => [
        key,
        [...slots.keys()].sort((a, b) => a - b),
      ]),
    ),
    saveRocketCoordinates,
    screenToBoardPoint: (clientX, clientY) => getBoardPointFromClientPosition(clientX, clientY),
    screenToPolarPoint: (clientX, clientY) => getPolarPointFromClientPosition(clientX, clientY),
    solarGridToGlobalPoint: (x, y) => solar.solarGridToGlobalPoint(x, y),
    solarGridToPolarPoint: (x, y) => solar.solarGridToPolarPoint(x, y),
    polarToGlobalPoint: (radius, angleDegrees) => solar.polarToGlobalPoint(radius, angleDegrees),
    globalPointToPolarPoint: (point) => solar.globalPointToPolarPoint(point),
    getSolarCellBoundary: (x, y) => solar.getSolarCellBoundary(x, y),
    getSolarCellBoundaries: () => solar.collectSolarCellBoundaries(),
    getSectorCoordinateBoundary: (x, y) => solar.getSectorCoordinateBoundary(x, y),
    getSectorCoordinateBoundaries: () => solar.collectSectorCoordinateBoundaries(),
    resolveSectorCoordinateFromPolarPoint: (point) => solar.resolveSectorCoordinateFromPolarPoint(point),
    resolveSectorCoordinateFromGlobalPoint: (point) => solar.resolveSectorCoordinateFromGlobalPoint(point),
    resolveVisibleContent: (x, y) => solar.resolveVisibleContent(x, y, state),
    getSolarSnapshot: () => solar.createSolarSnapshot(state),
    getWheelCoordinateReport: () => solar.collectWheelCoordinateReport(state),
    getVisibleCoordinateReport: () => solar.collectVisibleCoordinateReport(state),
    getVisibleCoordinateGroups: () => solar.collectVisibleCoordinateGroups(state),
    getRocketCoordinates: () => structuredClone(rocketState.rockets.map(createRocketSnapshot)),
    getSavedRocketCoordinates: () => structuredClone(rocketState.savedCoordinates),
    getState: () => structuredClone({
      ...state,
      rockets: rocketState.rockets.map(createRocketSnapshot),
      savedRocketCoordinates: rocketState.savedCoordinates,
      setup: getSetupState(),
      solarSystem: solar.createSolarSnapshot(state),
    }),
    getSetupState,
  };
})();
