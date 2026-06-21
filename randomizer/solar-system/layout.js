(function (root, factory) {
  "use strict";

  const api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.SetiSolarLayout = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function () {
  "use strict";

  function c(x, y, kind, data) {
    return Object.freeze({
      x,
      y,
      kind,
      ...(data || {}),
    });
  }

  const CONTENT_KIND = Object.freeze({
    SUN: "sun",
    PLANET: "planet",
    ASTEROID: "asteroid",
    COMET: "comet",
    EMPTY_SPACE: "empty_space",
    HOLE: "hole",
    NEBULA: "nebula",
    OUTSIDE_WHEEL: "outside_wheel",
    UNKNOWN: "unknown",
  });

  const CONTENT_KIND_LABELS = Object.freeze({
    [CONTENT_KIND.SUN]: "太阳",
    [CONTENT_KIND.PLANET]: "星球",
    [CONTENT_KIND.ASTEROID]: "小行星",
    [CONTENT_KIND.COMET]: "彗星",
    [CONTENT_KIND.EMPTY_SPACE]: "空格",
    [CONTENT_KIND.HOLE]: "镂空",
    [CONTENT_KIND.NEBULA]: "星云",
    [CONTENT_KIND.OUTSIDE_WHEEL]: "未覆盖",
    [CONTENT_KIND.UNKNOWN]: "未知",
  });

  const X_AXES = Object.freeze([
    Object.freeze({ x: 0, label: "top-right", description: "中线上方偏右的第一块扇形" }),
    Object.freeze({ x: 1, label: "right-upper", description: "右上方第二块扇形" }),
    Object.freeze({ x: 2, label: "right-lower", description: "右下方扇形" }),
    Object.freeze({ x: 3, label: "bottom-right", description: "中线下方偏右的扇形" }),
    Object.freeze({ x: 4, label: "bottom-left", description: "中线下方偏左的扇形" }),
    Object.freeze({ x: 5, label: "left-lower", description: "左下方扇形" }),
    Object.freeze({ x: 6, label: "left-upper", description: "左上方扇形" }),
    Object.freeze({ x: 7, label: "top-left", description: "中线上方偏左的扇形" }),
  ]);

  const RINGS = Object.freeze([
    Object.freeze({ y: 0, label: "sun", description: "太阳系中心" }),
    Object.freeze({ y: 1, label: "inner-planets", description: "地球、水星、金星内圈" }),
    Object.freeze({ y: 2, label: "mars-ring", description: "火星圈" }),
    Object.freeze({ y: 3, label: "gas-giants-ring", description: "木星、土星圈" }),
    Object.freeze({ y: 4, label: "outer-planets-ring", description: "天王星、海王星圈" }),
    Object.freeze({ y: 5, label: "nebula-ring", description: "外层星云扇区" }),
  ]);

  const BASE_SECTOR_BY_SLOT = Object.freeze({
    1: 2,
    2: 1,
    3: 4,
    4: 3,
  });

  const SLOT_DEFINITIONS = Object.freeze({
    1: Object.freeze({ slot: 1, label: "槽1", side: "上方", xCoordinates: Object.freeze([7, 0]) }),
    2: Object.freeze({ slot: 2, label: "槽2", side: "左方", xCoordinates: Object.freeze([5, 6]) }),
    3: Object.freeze({ slot: 3, label: "槽3", side: "右方", xCoordinates: Object.freeze([1, 2]) }),
    4: Object.freeze({ slot: 4, label: "槽4", side: "下方", xCoordinates: Object.freeze([3, 4]) }),
  });

  const SECTOR_SLOT_COORDINATES = Object.freeze({
    1: Object.freeze([
      Object.freeze({ x: 7, y: 5, localIndex: 0, side: "left" }),
      Object.freeze({ x: 0, y: 5, localIndex: 1, side: "right" }),
    ]),
    3: Object.freeze([
      Object.freeze({ x: 1, y: 5, localIndex: 0, side: "upper" }),
      Object.freeze({ x: 2, y: 5, localIndex: 1, side: "lower" }),
    ]),
    4: Object.freeze([
      Object.freeze({ x: 3, y: 5, localIndex: 0, side: "right" }),
      Object.freeze({ x: 4, y: 5, localIndex: 1, side: "left" }),
    ]),
    2: Object.freeze([
      Object.freeze({ x: 5, y: 5, localIndex: 0, side: "lower" }),
      Object.freeze({ x: 6, y: 5, localIndex: 1, side: "upper" }),
    ]),
  });

  const SECTORS = Object.freeze({
    1: Object.freeze({
      id: 1,
      asset: "sector-1.png",
      colorHint: "blue",
      nebulae: Object.freeze([
        Object.freeze({ id: "sector-1-a", label: "南河三", localIndex: 0 }),
        Object.freeze({ id: "sector-1-b", label: "织女一", localIndex: 1 }),
      ]),
    }),
    2: Object.freeze({
      id: 2,
      asset: "sector-2.png",
      colorHint: "red-blue",
      nebulae: Object.freeze([
        Object.freeze({ id: "sector-2-a", label: "天狼星A", localIndex: 0 }),
        Object.freeze({ id: "sector-2-b", label: "巴纳德", localIndex: 1 }),
      ]),
    }),
    3: Object.freeze({
      id: 3,
      asset: "sector-3.png",
      colorHint: "yellow-red",
      nebulae: Object.freeze([
        Object.freeze({ id: "sector-3-a", label: "开普勒22", localIndex: 0 }),
        Object.freeze({ id: "sector-3-b", label: "比邻星", localIndex: 1 }),
      ]),
    }),
    4: Object.freeze({
      id: 4,
      asset: "sector-4.png",
      colorHint: "yellow-gray",
      nebulae: Object.freeze([
        Object.freeze({ id: "sector-4-a", label: "室女座61", localIndex: 0 }),
        Object.freeze({ id: "sector-4-b", label: "绘架座β", localIndex: 1 }),
      ]),
    }),
  });

  const PLANETS = Object.freeze({
    earth: Object.freeze({ id: "earth", name: "地球", ring: 1, fixedAfterSetup: false }),
    mercury: Object.freeze({ id: "mercury", name: "水星", ring: 1, fixedAfterSetup: false }),
    venus: Object.freeze({ id: "venus", name: "金星", ring: 1, fixedAfterSetup: false }),
    mars: Object.freeze({ id: "mars", name: "火星", ring: 2, fixedAfterSetup: false }),
    saturn: Object.freeze({ id: "saturn", name: "土星", ring: 3, fixedAfterSetup: false }),
    jupiter: Object.freeze({ id: "jupiter", name: "木星", ring: 3, fixedAfterSetup: false }),
    aomomo: Object.freeze({ id: "aomomo", name: "奥陌陌", ring: 3, fixedAfterSetup: false, requiresAomomoActive: true }),
    uranus: Object.freeze({ id: "uranus", name: "天王星", ring: 4, fixedAfterSetup: true }),
    neptune: Object.freeze({ id: "neptune", name: "海王星", ring: 4, fixedAfterSetup: true }),
  });

  const WHEELS = Object.freeze({
    1: Object.freeze({
      id: 1,
      label: "wheel1",
      asset: "wheel1.png",
      zOrder: 1,
      rotatesDuringOrbit: true,
      rings: Object.freeze([1]),
      calibration: "visual-draft",
      cells: Object.freeze([
        c(0, 1, CONTENT_KIND.HOLE, { label: "内圈镂空" }),
        c(1, 1, CONTENT_KIND.PLANET, { planetId: "mercury", label: "水星", tags: Object.freeze(["orbit_target"]) }),
        c(2, 1, CONTENT_KIND.EMPTY_SPACE, { label: "内圈空白" }),
        c(3, 1, CONTENT_KIND.PLANET, { planetId: "venus", label: "金星", tags: Object.freeze(["orbit_target"]) }),
        c(4, 1, CONTENT_KIND.HOLE, { label: "内圈镂空" }),
        c(5, 1, CONTENT_KIND.PLANET, { planetId: "earth", label: "地球", tags: Object.freeze(["launch_origin"]) }),
        c(6, 1, CONTENT_KIND.EMPTY_SPACE, { label: "内圈空白" }),
        c(7, 1, CONTENT_KIND.HOLE, { label: "内圈镂空" }),
      ]),
    }),
    2: Object.freeze({
      id: 2,
      label: "wheel2",
      asset: "wheel2.png",
      zOrder: 2,
      rotatesDuringOrbit: true,
      rings: Object.freeze([1, 2]),
      calibration: "visual-draft",
      cells: Object.freeze([
        c(0, 1, CONTENT_KIND.HOLE, { label: "二层内圈镂空" }),
        c(1, 1, CONTENT_KIND.HOLE, { label: "二层内圈镂空" }),
        c(2, 1, CONTENT_KIND.EMPTY_SPACE, { label: "二层内圈空白" }),
        c(3, 1, CONTENT_KIND.ASTEROID, { label: "小行星带", tags: Object.freeze(["extra_exit_cost"]) }),
        c(4, 1, CONTENT_KIND.EMPTY_SPACE, { label: "二层内圈空白" }),
        c(5, 1, CONTENT_KIND.ASTEROID, { label: "小行星带", tags: Object.freeze(["extra_exit_cost"]) }),
        c(6, 1, CONTENT_KIND.EMPTY_SPACE, { label: "二层内圈空白" }),
        c(7, 1, CONTENT_KIND.HOLE, { label: "二层内圈镂空" }),
        c(0, 2, CONTENT_KIND.HOLE, { label: "火星圈镂空" }),
        c(1, 2, CONTENT_KIND.HOLE, { label: "火星圈镂空" }),
        c(2, 2, CONTENT_KIND.PLANET, { planetId: "mars", label: "火星", tags: Object.freeze(["orbit_target", "landing_target"]) }),
        c(3, 2, CONTENT_KIND.HOLE, { label: "火星圈镂空" }),
        c(4, 2, CONTENT_KIND.HOLE, { label: "火星圈镂空" }),
        c(5, 2, CONTENT_KIND.EMPTY_SPACE, { label: "火星圈空白" }),
        c(6, 2, CONTENT_KIND.ASTEROID, { label: "小行星带", tags: Object.freeze(["extra_exit_cost"]) }),
        c(7, 2, CONTENT_KIND.HOLE, { label: "火星圈镂空" }),
      ]),
    }),
    3: Object.freeze({
      id: 3,
      label: "wheel3",
      asset: "wheel3.png",
      zOrder: 3,
      rotatesDuringOrbit: true,
      rings: Object.freeze([1, 2, 3]),
      calibration: "visual-draft",
      cells: Object.freeze([
        c(0, 1, CONTENT_KIND.EMPTY_SPACE, { label: "三层内圈空白" }),
        c(1, 1, CONTENT_KIND.COMET, { label: "彗星" }),
        c(2, 1, CONTENT_KIND.ASTEROID, { label: "小行星带", tags: Object.freeze(["extra_exit_cost"]) }),
        c(3, 1, CONTENT_KIND.HOLE, { label: "三层内圈镂空" }),
        c(4, 1, CONTENT_KIND.HOLE, { label: "三层内圈镂空" }),
        c(5, 1, CONTENT_KIND.EMPTY_SPACE, { label: "三层内圈空白" }),
        c(6, 1, CONTENT_KIND.ASTEROID, { label: "小行星带", tags: Object.freeze(["extra_exit_cost"]) }),
        c(7, 1, CONTENT_KIND.ASTEROID, { label: "小行星带", tags: Object.freeze(["extra_exit_cost"]) }),
        c(0, 2, CONTENT_KIND.COMET, { label: "彗星" }),
        c(1, 2, CONTENT_KIND.HOLE, { label: "中圈镂空" }),
        c(2, 2, CONTENT_KIND.EMPTY_SPACE, { label: "中圈空白" }),
        c(3, 2, CONTENT_KIND.HOLE, { label: "中圈镂空" }),
        c(4, 2, CONTENT_KIND.ASTEROID, { label: "小行星带", tags: Object.freeze(["extra_exit_cost"]) }),
        c(5, 2, CONTENT_KIND.EMPTY_SPACE, { label: "中圈空白" }),
        c(6, 2, CONTENT_KIND.HOLE, { label: "中圈镂空" }),
        c(7, 2, CONTENT_KIND.ASTEROID, { label: "小行星带", tags: Object.freeze(["extra_exit_cost"]) }),
        c(0, 3, CONTENT_KIND.HOLE, { label: "巨行星圈镂空" }),
        c(1, 3, CONTENT_KIND.HOLE, { label: "巨行星圈镂空" }),
        c(2, 3, CONTENT_KIND.EMPTY_SPACE, { label: "巨行星圈空白" }),
        c(3, 3, CONTENT_KIND.PLANET, { planetId: "jupiter", label: "木星", tags: Object.freeze(["orbit_target", "landing_target"]) }),
        c(4, 3, CONTENT_KIND.EMPTY_SPACE, { label: "巨行星圈空白" }),
        c(5, 3, CONTENT_KIND.PLANET, {
          planetId: "aomomo",
          label: "奥陌陌",
          tags: Object.freeze(["orbit_target", "landing_target", "aomomo_scan_sector"]),
          requiresAomomoActive: true,
          inactiveKind: CONTENT_KIND.HOLE,
          inactiveLabel: "巨行星圈镂空",
        }),
        c(6, 3, CONTENT_KIND.HOLE, { label: "巨行星圈镂空" }),
        c(7, 3, CONTENT_KIND.PLANET, { planetId: "saturn", label: "土星", tags: Object.freeze(["orbit_target", "landing_target"]) }),
      ]),
    }),
    4: Object.freeze({
      id: 4,
      label: "wheel4",
      asset: "wheel4.png",
      zOrder: 4,
      rotatesDuringOrbit: false,
      rings: Object.freeze([1, 2, 3, 4]),
      calibration: "visual-draft",
      cells: Object.freeze([
        c(0, 1, CONTENT_KIND.ASTEROID, { label: "小行星带", tags: Object.freeze(["extra_exit_cost"]) }),
        c(1, 1, CONTENT_KIND.COMET, { label: "彗星" }),
        c(2, 1, CONTENT_KIND.EMPTY_SPACE, { label: "底板内圈空白" }),
        c(3, 1, CONTENT_KIND.ASTEROID, { label: "小行星带", tags: Object.freeze(["extra_exit_cost"]) }),
        c(4, 1, CONTENT_KIND.ASTEROID, { label: "小行星带", tags: Object.freeze(["extra_exit_cost"]) }),
        c(5, 1, CONTENT_KIND.EMPTY_SPACE, { label: "底板内圈空白" }),
        c(6, 1, CONTENT_KIND.COMET, { label: "彗星" }),
        c(7, 1, CONTENT_KIND.COMET, { label: "彗星" }),
        c(0, 2, CONTENT_KIND.EMPTY_SPACE, { label: "底板中圈空白" }),
        c(1, 2, CONTENT_KIND.COMET, { label: "彗星" }),
        c(2, 2, CONTENT_KIND.ASTEROID, { label: "小行星带", tags: Object.freeze(["extra_exit_cost"]) }),
        c(3, 2, CONTENT_KIND.EMPTY_SPACE, { label: "底板中圈空白" }),
        c(4, 2, CONTENT_KIND.COMET, { label: "彗星" }),
        c(5, 2, CONTENT_KIND.EMPTY_SPACE, { label: "底板中圈空白" }),
        c(6, 2, CONTENT_KIND.ASTEROID, { label: "小行星带", tags: Object.freeze(["extra_exit_cost"]) }),
        c(7, 2, CONTENT_KIND.EMPTY_SPACE, { label: "底板中圈空白" }),
        c(0, 3, CONTENT_KIND.EMPTY_SPACE, { label: "底板巨行星圈空白" }),
        c(1, 3, CONTENT_KIND.ASTEROID, { label: "小行星带", tags: Object.freeze(["extra_exit_cost"]) }),
        c(2, 3, CONTENT_KIND.COMET, { label: "彗星" }),
        c(3, 3, CONTENT_KIND.ASTEROID, { label: "小行星带", tags: Object.freeze(["extra_exit_cost"]) }),
        c(4, 3, CONTENT_KIND.ASTEROID, { label: "小行星带", tags: Object.freeze(["extra_exit_cost"]) }),
        c(5, 3, CONTENT_KIND.EMPTY_SPACE, { label: "底板巨行星圈空白" }),
        c(6, 3, CONTENT_KIND.EMPTY_SPACE, { label: "底板巨行星圈空白" }),
        c(7, 3, CONTENT_KIND.ASTEROID, { label: "小行星带", tags: Object.freeze(["extra_exit_cost"]) }),
        c(0, 4, CONTENT_KIND.PLANET, { planetId: "uranus", label: "天王星", tags: Object.freeze(["orbit_target", "landing_target"]) }),
        c(1, 4, CONTENT_KIND.EMPTY_SPACE, { label: "外行星圈空白" }),
        c(2, 4, CONTENT_KIND.EMPTY_SPACE, { label: "外行星圈空白" }),
        c(3, 4, CONTENT_KIND.PLANET, { planetId: "neptune", label: "海王星", tags: Object.freeze(["orbit_target", "landing_target"]) }),
        c(4, 4, CONTENT_KIND.EMPTY_SPACE, { label: "外行星圈空白" }),
        c(5, 4, CONTENT_KIND.COMET, { label: "彗星" }),
        c(6, 4, CONTENT_KIND.EMPTY_SPACE, { label: "外行星圈空白" }),
        c(7, 4, CONTENT_KIND.COMET, { label: "彗星" }),
      ]),
    }),
  });

  return Object.freeze({
    CONTENT_KIND,
    CONTENT_KIND_LABELS,
    X_AXES,
    RINGS,
    BASE_SECTOR_BY_SLOT,
    SLOT_DEFINITIONS,
    SECTOR_SLOT_COORDINATES,
    SECTORS,
    PLANETS,
    WHEELS,
  });
});
