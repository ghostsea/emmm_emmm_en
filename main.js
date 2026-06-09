/** 每层转盘随机步进下限（步长 45°，即 π/4 rad） */
const WHEEL_STEP_OFFSET = { 1: 0, 2: 20, 3: 11, 4: 4 };

function shuffle(items) {
  const arr = items.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function randomWheelSteps(wheel) {
  return Math.floor(Math.random() * 8 + WHEEL_STEP_OFFSET[wheel]);
}

function setWheelRotation(wrap, steps) {
  wrap.dataset.rotation = steps;
  wrap.style.transform = `rotate(${steps * Math.PI / 4}rad)`;
}

function randomizeWheels() {
  for (const wrap of document.querySelectorAll(".fly-wrap[data-wheel]")) {
    const wheel = Number(wrap.dataset.wheel);
    const prev = Number(wrap.dataset.rotation || 0);
    setWheelRotation(wrap, prev - randomWheelSteps(wheel));
  }
}

function renderSector(slot, sectorId) {
  const wrap = document.getElementById(`sector-wrap-${slot}`);
  wrap.replaceChildren();
  const sector = document.createElement("div");
  sector.className = `sector sector-${sectorId}`;
  wrap.appendChild(sector);
}

function randomizeSectors() {
  const assignment = shuffle([1, 2, 3, 4]);
  assignment.forEach((sectorId, index) => renderSector(index + 1, sectorId));
}

function randomize() {
  randomizeWheels();
  randomizeSectors();
}

function resize() {
  const { innerWidth: w, innerHeight: h } = window;
  const maxAspect = 0.5;
  const targetW = w / h > maxAspect ? h * maxAspect : w;
  document.querySelector(".app-wrap").style.width = `${targetW}px`;
}

window.addEventListener("resize", resize);
document.querySelector(".set-button").addEventListener("click", randomize);
resize();
randomize();
