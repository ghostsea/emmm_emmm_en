const assert = require("node:assert/strict");
const solar = require("./core");

const baseline = solar.createBaselineState();
const snapshot = solar.createSolarSnapshot(baseline);

function baseRow(wheelId, y) {
  return Array.from({ length: 8 }, (_, x) => {
    const cell = solar.getBaseWheelCell(wheelId, x, y);
    if (cell.kind === solar.layout.CONTENT_KIND.PLANET) return cell.label;
    if (cell.kind === solar.layout.CONTENT_KIND.ASTEROID) return "小行星";
    if (cell.kind === solar.layout.CONTENT_KIND.COMET) return "彗星";
    if (cell.kind === solar.layout.CONTENT_KIND.HOLE) return "镂空";
    if (cell.kind === solar.layout.CONTENT_KIND.EMPTY_SPACE) return "空白";
    return cell.kind;
  });
}

assert.deepEqual(baseRow(1, 1), ["镂空", "水星", "空白", "金星", "镂空", "地球", "空白", "镂空"]);
assert.deepEqual(baseRow(2, 1), ["镂空", "镂空", "空白", "小行星", "空白", "小行星", "空白", "镂空"]);
assert.deepEqual(baseRow(2, 2), ["镂空", "镂空", "火星", "镂空", "镂空", "空白", "小行星", "镂空"]);
assert.deepEqual(baseRow(3, 1), ["空白", "彗星", "小行星", "镂空", "镂空", "空白", "小行星", "小行星"]);
assert.deepEqual(baseRow(3, 2), ["彗星", "镂空", "空白", "镂空", "小行星", "空白", "镂空", "小行星"]);
assert.deepEqual(baseRow(3, 3), ["镂空", "镂空", "空白", "木星", "空白", "镂空", "镂空", "土星"]);
assert.deepEqual(baseRow(4, 1), ["小行星", "彗星", "空白", "小行星", "小行星", "空白", "彗星", "彗星"]);
assert.deepEqual(baseRow(4, 2), ["空白", "彗星", "小行星", "空白", "彗星", "空白", "小行星", "空白"]);
assert.deepEqual(baseRow(4, 3), ["空白", "小行星", "彗星", "小行星", "小行星", "空白", "空白", "小行星"]);
assert.deepEqual(baseRow(4, 4), ["天王星", "空白", "空白", "海王星", "空白", "彗星", "空白", "彗星"]);

assert.equal(snapshot.statistics.planetCount, 8);
assert.equal(snapshot.statistics.nebulaCount, 8);
assert.equal(snapshot.coordinateSystem.xAxes[0].description, "中线上方偏右的第一块扇形");
assert.deepEqual(
  snapshot.nebulaRelations.map((relation) => relation.clockwiseOffset),
  [1, 1, 1, 1],
);
assert.deepEqual(
  snapshot.nebulaRelations.map((relation) => relation.displayText),
  [
    "[天狼星A 巴纳德]-[7,0]",
    "[南河三 织女一]-[5,6]",
    "[室女座61 绘架座β]-[1,2]",
    "[开普勒22 比邻星]-[3,4]",
  ],
);
assert.deepEqual(snapshot.statistics.visibleMeaningfulContentCounts, {
  星球: 8,
  小行星: 5,
  彗星: 4,
  星云: 8,
});

assert.equal(solar.GLOBAL_COORDINATE_SYSTEM.size, 1000);
assert.deepEqual(solar.solarGridToGlobalPoint(0, 0), { x: 500, y: 500 });
const topRightGlobal = solar.solarGridToGlobalPoint(0, 1);
assert.ok(topRightGlobal.x > 500);
assert.ok(topRightGlobal.y < 500);
assert.deepEqual(solar.solarGridToGlobalPoint(5, 1), { x: 432.07, y: 528.14 });
assert.deepEqual(solar.solarGridToPolarPoint(5, 1), { radius: 73.53, angleDegrees: 157.5 });
assert.deepEqual(
  solar.globalPointToPolarPoint(solar.solarGridToGlobalPoint(5, 1)),
  { radius: 73.53, angleDegrees: 157.5 },
);
assert.deepEqual(solar.polarToGlobalPoint(73.53, 157.5), { x: 432.07, y: 528.14 });
assert.equal(solar.collectSolarCellBoundaries().length, 41);
const earthCellBoundary = solar.getSolarCellBoundary(5, 1);
assert.deepEqual(earthCellBoundary.radiusRange, { inner: 50, outer: 119.35 });
assert.deepEqual(earthCellBoundary.angleRangeDegrees, { start: 135, center: 157.5, end: 180 });
assert.deepEqual(earthCellBoundary.polarBoundary, {
  innerRadius: 50,
  outerRadius: 119.35,
  startAngleDegrees: 135,
  endAngleDegrees: 180,
});
assert.deepEqual(earthCellBoundary.boundingBox, {
  minX: 380.65,
  minY: 500,
  maxX: 464.64,
  maxY: 584.39,
});
assert.equal(solar.collectSectorCoordinateBoundaries().length, 40);
assert.deepEqual(solar.getSectorCoordinateBoundary(0, 1).polarBoundary, {
  innerRadius: 50,
  outerRadius: 119.35,
  startAngleDegrees: -90,
  endAngleDegrees: -45,
});
assert.deepEqual(solar.getSectorCoordinateBoundary(7, 4).polarBoundary, {
  innerRadius: 262.15,
  outerRadius: 332.15,
  startAngleDegrees: 225,
  endAngleDegrees: 270,
});
assert.deepEqual(solar.getSectorCoordinateBoundary(0, 5).polarBoundary, {
  innerRadius: 332.15,
  outerRadius: 500,
  startAngleDegrees: -90,
  endAngleDegrees: -45,
});
assert.deepEqual(solar.getSectorCoordinateBoundary(7, 5).polarBoundary, {
  innerRadius: 332.15,
  outerRadius: 500,
  startAngleDegrees: 225,
  endAngleDegrees: 270,
});
assert.deepEqual(solar.getSectorCoordinateBoundary(5, 1).polarBoundary, {
  innerRadius: 50,
  outerRadius: 119.35,
  startAngleDegrees: 135,
  endAngleDegrees: 180,
});
assert.deepEqual(
  solar.resolveSectorCoordinateFromPolarPoint({ radius: 73.53, angleDegrees: 164.62 }).sectorCoordinate,
  { x: 5, y: 1 },
);
assert.deepEqual(
  solar.resolveSectorCoordinateFromGlobalPoint({ x: 429.1, y: 519.5 }).sectorCoordinate,
  { x: 5, y: 1 },
);
assert.deepEqual(
  solar.resolveSectorCoordinateFromPolarPoint({ radius: 165.16, angleDegrees: 14.45 }).sectorCoordinate,
  { x: 2, y: 2 },
);
assert.deepEqual(
  solar.resolveSectorCoordinateFromPolarPoint({ radius: 232.05, angleDegrees: 67.49 }).sectorCoordinate,
  { x: 3, y: 3 },
);
assert.deepEqual(
  solar.resolveSectorCoordinateFromPolarPoint({ radius: 303.67, angleDegrees: 65.49 }).sectorCoordinate,
  { x: 3, y: 4 },
);
assert.deepEqual(
  solar.resolveSectorCoordinateFromPolarPoint({ radius: 485, angleDegrees: -67.5 }).sectorCoordinate,
  { x: 0, y: 5 },
);
assert.equal(
  solar.resolveSectorCoordinateFromPolarPoint({ radius: 30, angleDegrees: 157.5 }).sectorCoordinate,
  null,
);

const earthLaunchSlots = solar.getSectorLaunchSlots(5, 1);
assert.equal(earthLaunchSlots.length, 9);
assert.equal(earthLaunchSlots.length, solar.LAUNCH_SLOTS_PER_SECTOR);
// 行优先编号：4 号为中心，0 号为内侧角；优先顺序为中心->四角->四边
assert.deepEqual(solar.LAUNCH_SLOT_PRIORITY, [4, 0, 2, 6, 8, 1, 3, 5, 7]);
const earthCenter = solar.getSectorLaunchSlot(5, 1, 4);
assert.deepEqual([earthCenter.radialRow, earthCenter.angularColumn], [1, 1]);
assert.equal(earthCenter.angleDegrees, 157.5);
const earthSlot0 = solar.getSectorLaunchSlot(5, 1, 0);
assert.deepEqual([earthSlot0.radialRow, earthSlot0.angularColumn], [0, 0]);
// 中心槽位半径应落在 ring1 边界内侧，绝不贴边
const ring1 = solar.getSectorCoordinateBoundary(5, 1).polarBoundary;
assert.ok(earthCenter.radius > ring1.innerRadius && earthCenter.radius < ring1.outerRadius);
assert.equal(earthCenter.radius, 84.68);
// 所有槽位都应解析回本扇区
for (const slot of earthLaunchSlots) {
  const resolved = solar.resolveSectorCoordinateFromPolarPoint({
    radius: slot.radius,
    angleDegrees: slot.angleDegrees,
  });
  assert.deepEqual(resolved.sectorCoordinate, { x: 5, y: 1 });
}
// 越靠近太阳，同槽位的角向间距（弧长）越小：ring1 应比 ring4 更紧凑
const innerCols = solar.getSectorLaunchSlots(5, 1);
const outerCols = solar.getSectorLaunchSlots(5, 4);
const arc = (slots) => {
  const left = slots.find((s) => s.angularColumn === 0 && s.radialRow === 1);
  const right = slots.find((s) => s.angularColumn === 2 && s.radialRow === 1);
  const dr = (right.angleDegrees - left.angleDegrees) * Math.PI / 180;
  return Math.abs(dr) * ((left.radius + right.radius) / 2);
};
assert.ok(arc(innerCols) < arc(outerCols));
// 槽位索引应当回绕（mod 9）
assert.deepEqual(solar.getSectorLaunchSlot(5, 1, 9), solar.getSectorLaunchSlot(5, 1, 0));

let rotation = solar.normalizeRotationState([0, 0, 0, 0, 0], 0);
assert.deepEqual(solar.getNextOrbitWheelIds(rotation.rotationCount), [1]);
rotation = solar.applySolarOrbitRotation(rotation);
assert.equal(rotation.wheel1Steps, -1);
assert.equal(rotation.wheel2Steps, 0);
assert.equal(rotation.rotationCount, 1);

assert.deepEqual(solar.getNextOrbitWheelIds(rotation.rotationCount), [1, 2]);
rotation = solar.applySolarOrbitRotation(rotation);
assert.equal(rotation.wheel1Steps, -2);
assert.equal(rotation.wheel2Steps, -1);
assert.equal(rotation.wheel3Steps, 0);
assert.equal(rotation.rotationCount, 2);

assert.deepEqual(solar.getNextOrbitWheelIds(rotation.rotationCount), [1, 2, 3]);
rotation = solar.applySolarOrbitRotation(rotation);
assert.equal(rotation.wheel1Steps, -3);
assert.equal(rotation.wheel2Steps, -2);
assert.equal(rotation.wheel3Steps, -1);
assert.equal(rotation.rotationCount, 3);

const sun = solar.resolveVisibleContent(0, 0, baseline);
assert.equal(sun.content.kind, "sun");

const nebula = solar.resolveVisibleContent(0, 5, baseline);
assert.equal(nebula.content.kind, "nebula");
assert.equal(nebula.content.sectorId, 2);

const mercury = snapshot.planetLocations.find((planet) => planet.planetId === "mercury");
assert.deepEqual([mercury.x, mercury.y], [1, 1]);
const uranus = snapshot.planetLocations.find((planet) => planet.planetId === "uranus");
assert.deepEqual([uranus.x, uranus.y], [0, 4]);

const rotated = solar.createSolarSnapshot({
  ...baseline,
  rotation,
  wheelSteps: solar.rotationToWheelSteps(rotation),
});
const rotatedMercury = rotated.planetLocations.find((planet) => planet.planetId === "mercury");
assert.deepEqual([rotatedMercury.x, rotatedMercury.y], [6, 1]);

console.log("solar-system-core tests passed");
