(function () {
  "use strict";

  /** 与官网 main.js 一致的每层转盘随机偏移基数 */
  const WHEEL_OFFSETS = [0, 0, 20, 11, 4];

  const SECTOR_NAMES = ["", "红", "蓝", "绿", "黄"];

  const state = {
    wheelSteps: [0, 0, 0, 0, 0],
    sectorBySlot: { 1: null, 2: null, 3: null, 4: null },
  };

  const els = {
    appWrap: document.querySelector(".app-wrap"),
    boardShell: document.getElementById("board-shell"),
    wheelWrap: document.getElementById("wheel-wrap"),
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
    stateReadout: document.getElementById("state-readout"),
  };

  function resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const cutoff = 0.82;
    let appW = w;
    if (w / h > cutoff) {
      appW = h * cutoff;
    }
    appW = Math.floor(appW);
    els.appWrap.style.width = `${appW}px`;

    const chrome = els.buttonWrap.offsetHeight
      + els.stateReadout.offsetHeight
      + 8;
    const baseSize = Math.min(appW, h - chrome);
    const boardSize = Math.floor(Math.min(baseSize * 1.2, appW, h - 4));
    els.wheelWrap.style.width = `${boardSize}px`;
    els.wheelWrap.style.height = `${boardSize}px`;
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
    const wheelLine = [1, 2, 3, 4]
      .map((w) => `W${w}=${mod8(state.wheelSteps[w])}`)
      .join("  ");
    const sectorLine = [1, 2, 3, 4]
      .map((slot) => {
        const id = state.sectorBySlot[slot];
        return `槽${slot}→${id ? SECTOR_NAMES[id] : "—"}`;
      })
      .join("  ");
    els.stateReadout.textContent = `${wheelLine}\n${sectorLine}`;
  }

  function mod8(n) {
    return ((n % 8) + 8) % 8;
  }

  /** 官网 randomizeWheels 的无动画版：直接累加步数并渲染 */
  function randomizeWheels() {
    for (let w = 1; w <= 4; w += 1) {
      const delta = Math.floor(Math.random() * 8 + WHEEL_OFFSETS[w]);
      state.wheelSteps[w] -= delta;
    }
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
    return {
      solarRotationInitial: {
        wheel1Steps: mod8(state.wheelSteps[1]),
        wheel2Steps: mod8(state.wheelSteps[2]),
        wheel3Steps: mod8(state.wheelSteps[3]),
        wheel4Steps: mod8(state.wheelSteps[4]),
        rotationCount: 0,
      },
      sectorAssignment: {
        slot1: state.sectorBySlot[1],
        slot2: state.sectorBySlot[2],
        slot3: state.sectorBySlot[3],
        slot4: state.sectorBySlot[4],
      },
    };
  }

  els.spinButton.addEventListener("click", randomizeAll);
  window.addEventListener("resize", resize);

  resize();
  renderWheels();
  renderSectors();
  renderStateReadout();

  window.SetiRandomizer = {
    randomize: randomizeAll,
    getState: () => structuredClone({ ...state, setup: getSetupState() }),
    getSetupState,
  };
})();
