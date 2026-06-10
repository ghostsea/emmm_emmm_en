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
