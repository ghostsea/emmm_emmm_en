(function () {
  "use strict";

  const solar = window.SetiSolarSystem;
  const players = window.SetiPlayers;
  const rocketActions = window.SetiRocketActions;

  /** 与官网 main.js 一致的每层转盘随机偏移基数 */
  const WHEEL_OFFSETS = [0, 0, 20, 11, 4];
  const ROCKET_IMAGE_SCALE = 0.08;

  const solarState = solar.createBaselineState();
  const playerState = players.createPlayerState({
    currentPlayer: { color: players.DEFAULT_PLAYER_COLOR },
  });
  const rocketState = rocketActions.createRocketState();

  const els = {
    appWrap: document.querySelector(".app-wrap"),
    boardShell: document.getElementById("board-shell"),
    playerCommand: document.getElementById("player-command"),
    playerStats: document.getElementById("player-stats"),
    actionLaunchButton: document.getElementById("action-launch-button"),
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
    debugMovePad: document.getElementById("debug-move-pad"),
    logToggle: document.getElementById("log-toggle"),
    stateReadout: document.getElementById("state-readout"),
  };

  function resize() {
    const h = window.innerHeight;
    const chrome = els.playerCommand.offsetHeight + els.buttonWrap.offsetHeight + 24;
    const boardWidth = els.boardShell.clientWidth || window.innerWidth;
    const boardHeight = h - chrome - 16;
    const boardSize = Math.floor(Math.max(220, Math.min(boardWidth, boardHeight)));
    els.playerCommand.style.width = `${boardSize}px`;
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

  function getCurrentPlayer() {
    return players.getCurrentPlayer(playerState);
  }

  function getBoardPointFromClientPosition(clientX, clientY) {
    const rect = els.wheelWrap.getBoundingClientRect();
    const size = solar.GLOBAL_COORDINATE_SYSTEM.size;

    return rocketActions.normalizeBoardPoint({
      x: ((clientX - rect.left) / rect.width) * size,
      y: ((clientY - rect.top) / rect.height) * size,
    });
  }

  function formatBoardPoint(point) {
    return `[${point.x.toFixed(2)},${point.y.toFixed(2)}]`;
  }

  function getPolarPointFromBoardPoint(point) {
    return rocketActions.getPolarPointFromBoardPoint(point);
  }

  function getBoardPointFromPolarPoint(point) {
    return rocketActions.getBoardPointFromPolarPoint(point);
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
    return rocketActions.createRocketSnapshot(rocket);
  }

  function getEarthSectorCoordinate() {
    const snapshot = solar.createSolarSnapshot(solarState);
    const earth = snapshot.planetLocations.find((planet) => planet.planetId === "earth");

    if (!earth) {
      throw new Error("Earth position was not found in the current solar snapshot");
    }

    return { x: earth.x, y: earth.y };
  }

  function setRocketAssetSize() {
    const image = new Image();
    const currentPlayer = getCurrentPlayer();
    const color = players.getPlayerColorDefinition(currentPlayer.color);
    image.addEventListener("load", () => {
      const width = Math.max(1, Math.round(image.naturalWidth * ROCKET_IMAGE_SCALE));
      els.tokenLayer.style.setProperty("--rocket-width", `${width}px`);
    });
    image.src = color.rocketAsset;
  }

  function getRocketColorDefinition(rocket) {
    return players.getPlayerColorDefinition(rocket.color || players.DEFAULT_PLAYER_COLOR);
  }

  function renderRocketElement(rocket) {
    let element = document.getElementById(`rocket-${rocket.id}`);
    const color = getRocketColorDefinition(rocket);

    if (!element) {
      element = document.createElement("img");
      element.className = "rocket-token";
      element.id = `rocket-${rocket.id}`;
      element.draggable = false;
      element.dataset.rocketId = String(rocket.id);
      els.tokenLayer.appendChild(element);
    }

    element.src = color.rocketAsset;
    element.alt = `${color.label}火箭 ${rocket.id}`;
    element.dataset.playerId = rocket.playerId || "";
    element.dataset.playerColor = color.id;
    element.style.setProperty("--rocket-glow", color.glowColor);

    const boardPoint = getBoardPointFromPolarPoint(rocket);
    element.style.left = `${boardPoint.x / 10}%`;
    element.style.top = `${boardPoint.y / 10}%`;
  }

  function renderRockets() {
    rocketState.rockets.forEach(renderRocketElement);
  }

  function createStatText(label, value) {
    const item = document.createElement("span");
    item.className = "player-stat";

    const labelEl = document.createElement("span");
    labelEl.className = "player-stat-label";
    labelEl.textContent = label;

    const valueEl = document.createElement("span");
    valueEl.className = "player-stat-value";
    valueEl.textContent = value;

    item.append(labelEl, valueEl);
    return item;
  }

  function createPlayerNameStat(player, score) {
    const color = players.getPlayerColorDefinition(player.color);
    const item = document.createElement("span");
    const marker = document.createElement("span");
    const name = document.createElement("span");
    const scoreEl = document.createElement("span");

    item.className = "player-stat player-stat-current";
    item.style.setProperty("--player-color", color.uiColor);
    marker.className = "player-color-marker";
    marker.setAttribute("aria-hidden", "true");
    name.className = "player-stat-value";
    name.textContent = player.name;
    scoreEl.className = "player-stat-score";
    scoreEl.textContent = `分数 ${score}`;

    item.append(marker, name, scoreEl);
    return item;
  }

  function createStatSeparator() {
    const item = document.createElement("span");
    item.className = "player-stat-separator";
    item.setAttribute("aria-hidden", "true");
    item.textContent = "|";
    return item;
  }

  function renderPlayerStats() {
    const currentPlayer = getCurrentPlayer();
    const resources = currentPlayer.resources;
    const limits = players.RESOURCE_LIMITS;
    const stats = [
      createPlayerNameStat(currentPlayer, resources.score),
      createStatSeparator(),
      createStatText("信用点", resources.credits),
      createStatText("能量", resources.energy),
      createStatText("宣传", `${resources.publicity}/${limits.publicity}`),
      createStatText("可用数据", `${resources.availableData}/${limits.availableData}`),
      createStatText("手牌", resources.handSize),
    ];

    els.playerStats.replaceChildren(...stats);
  }

  function getPlayerReadoutLines() {
    const currentPlayer = getCurrentPlayer();
    const resources = currentPlayer.resources;
    const limits = players.RESOURCE_LIMITS;

    return [
      "玩家状态",
      `${currentPlayer.name}(${currentPlayer.color}) 信用点=${resources.credits} 能量=${resources.energy} 宣传=${resources.publicity}/${limits.publicity} 可用数据=${resources.availableData}/${limits.availableData} 手牌=${resources.handSize} 分数=${resources.score}`,
    ];
  }

  function getRocketCoordinateReadoutLines() {
    const activeRocket = rocketState.rockets.find((rocket) => rocket.id === rocketState.activeRocketId);
    const rocketLines = rocketState.rockets.length
      ? rocketState.rockets.map((rocket) => {
        const marker = rocket.id === rocketState.activeRocketId ? "*" : " ";
        const snapshot = createRocketSnapshot(rocket);
        const color = getRocketColorDefinition(rocket);
        const slot = snapshot.slotSectorCoordinate
          ? ` 扇区[${snapshot.slotSectorCoordinate.x},${snapshot.slotSectorCoordinate.y}]#${snapshot.slotIndex}`
          : "";
        return `${marker}R${rocket.id} ${color.label} ${formatPolarPoint(snapshot.polar)} ${formatBoardPoint(snapshot.board)}${slot}`;
      })
      : ["无"];
    const sectorLines = rocketState.rockets.length
      ? rocketState.rockets.map((rocket) => {
        const snapshot = createRocketSnapshot(rocket);
        return `R${rocket.id} 中心${formatBoardPoint(snapshot.board)} -> ${formatSectorCoordinate(snapshot)}`;
      })
      : ["无"];
    const occupancy = rocketActions.getSectorOccupancy(rocketState);
    const occupancyLines = occupancy.size
      ? [...occupancy.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, slots]) => {
          const indices = [...slots.keys()].sort((a, b) => a - b).join(",");
          return `扇区[${key}] 占用#${indices}`;
        })
      : ["无"];

    return [
      "火箭坐标",
      `火箭坐标系 polar board-${solar.GLOBAL_COORDINATE_SYSTEM.size}`,
      activeRocket
        ? `当前 R${activeRocket.id} ${formatPolarPoint(activeRocket)} ${formatBoardPoint(getBoardPointFromPolarPoint(activeRocket))} -> ${formatSectorCoordinate(createRocketSnapshot(activeRocket))}`
        : "当前 无",
      rocketState.statusNote ? `提示 ${rocketState.statusNote}` : "提示 无",
      "",
      "已发射",
      ...rocketLines,
      "",
      "扇区占用",
      ...occupancyLines,
      "",
      "位置判定",
      ...sectorLines,
    ];
  }

  function launchRocketForCurrentPlayer() {
    const currentPlayer = getCurrentPlayer();
    const earthSector = getEarthSectorCoordinate();
    const result = rocketActions.launchRocketAtSector(rocketState, earthSector, {
      playerId: currentPlayer.id,
      color: currentPlayer.color,
    });

    if (result.rocket) renderRocketElement(result.rocket);
    renderStateReadout();
  }

  function moveActiveRocket(deltaX, deltaY) {
    const result = rocketActions.moveActiveRocket(rocketState, deltaX, deltaY);
    if (result.rocket) renderRocketElement(result.rocket);
    renderStateReadout();
  }

  function stepsToTransform(steps) {
    const rotation = steps * (Math.PI / 4);
    return `rotate(${rotation}rad)`;
  }

  function renderWheels() {
    for (let w = 1; w <= 4; w += 1) {
      els.wheels[w].style.transform = stepsToTransform(solarState.wheelSteps[w]);
    }
  }

  function renderSectors() {
    for (let slot = 1; slot <= 4; slot += 1) {
      const wrap = els.sectorWraps[slot];
      wrap.innerHTML = "";
      const sectorId = solarState.sectorBySlot[slot];
      if (!sectorId) continue;

      const sector = document.createElement("div");
      sector.className = `sector sector-${sectorId}`;
      wrap.appendChild(sector);
    }
  }

  function renderStateReadout() {
    const snapshot = solar.createSolarSnapshot(solarState);
    const axisLine = "坐标轴 x0=中线上方偏右第一块，顺时针递增";
    const wheelLine = [1, 2, 3, 4]
      .map((w) => `W${w}=${solar.mod8(solarState.wheelSteps[w])}`)
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
      ...getPlayerReadoutLines(),
      "",
      "可见坐标",
      formatVisibleCoordinateGroups(snapshot.visibleCoordinateGroups),
      "",
      ...getRocketCoordinateReadoutLines(),
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
      solarState.wheelSteps[w] -= delta;
    }
    solarState.rotation = solar.normalizeRotationState(solarState.wheelSteps, 0);
    renderWheels();
  }

  /** 官网 randomizeSectors 逻辑：将 4 个扇区洗牌分配到 4 个外边槽位 */
  function randomizeSectors() {
    const pool = [1, 2, 3, 4];
    while (pool.length) {
      const slotId = pool.length;
      const pickIndex = Math.floor(Math.random() * pool.length);
      const sectorId = pool.splice(pickIndex, 1)[0];
      solarState.sectorBySlot[slotId] = sectorId;
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
    return solar.createSetupState(solarState);
  }

  function rotateSolarOrbit(count) {
    solarState.rotation = solar.applySolarOrbitRotation(solarState.rotation, count || 1);
    solarState.wheelSteps = solar.rotationToWheelSteps(solarState.rotation);
    renderWheels();
    renderStateReadout();
  }

  els.spinButton.addEventListener("click", randomizeAll);
  els.actionLaunchButton.addEventListener("click", launchRocketForCurrentPlayer);
  els.debugToggle.addEventListener("click", () => {
    setDebugOpen(els.appWrap.classList.contains("debug-collapsed"));
  });
  els.debugRotateButton.addEventListener("click", () => {
    rotateSolarOrbit(1);
  });
  els.debugLaunchButton.addEventListener("click", launchRocketForCurrentPlayer);
  els.debugMovePad.addEventListener("click", (event) => {
    const button = event.target.closest("[data-move-x]");
    if (!button) return;
    moveActiveRocket(Number(button.dataset.moveX), Number(button.dataset.moveY));
  });
  els.logToggle.addEventListener("click", () => {
    setLogOpen(els.appWrap.classList.contains("log-collapsed"));
  });
  window.addEventListener("resize", resize);

  setRocketAssetSize();
  renderPlayerStats();
  resize();
  renderWheels();
  renderSectors();
  renderStateReadout();
  renderRockets();

  window.SetiRandomizer = {
    randomize: randomizeAll,
    rotateSolarOrbit,
    launchRocket: launchRocketForCurrentPlayer,
    moveActiveRocket,
    getSectorLaunchSlots: (x, y) => solar.getSectorLaunchSlots(x, y),
    getSectorLaunchSlot: (x, y, slotIndex) => solar.getSectorLaunchSlot(x, y, slotIndex),
    getSectorOccupancy: () => rocketActions.serializeSectorOccupancy(rocketState),
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
    resolveVisibleContent: (x, y) => solar.resolveVisibleContent(x, y, solarState),
    getSolarSnapshot: () => solar.createSolarSnapshot(solarState),
    getWheelCoordinateReport: () => solar.collectWheelCoordinateReport(solarState),
    getVisibleCoordinateReport: () => solar.collectVisibleCoordinateReport(solarState),
    getVisibleCoordinateGroups: () => solar.collectVisibleCoordinateGroups(solarState),
    getRocketCoordinates: () => structuredClone(rocketState.rockets.map(createRocketSnapshot)),
    getPlayerState: () => structuredClone(playerState),
    getCurrentPlayer: () => structuredClone(getCurrentPlayer()),
    getState: () => structuredClone({
      ...solarState,
      players: playerState.players,
      currentPlayerId: playerState.currentPlayerId,
      rockets: rocketState.rockets.map(createRocketSnapshot),
      setup: getSetupState(),
      solarSystem: solar.createSolarSnapshot(solarState),
    }),
    getSetupState,
  };
})();
