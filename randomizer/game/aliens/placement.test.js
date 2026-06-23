"use strict";

const placement = require("./placement");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const anchor = { percentX: 50, percentY: 72, scalePercent: 14 };
const origin = placement.getExtraTraceGridOriginCenter(anchor);
const anchorAgain = placement.getExtraTraceGridCenter(anchor, 4);
const first = placement.getExtraTraceGridCenter(anchor, 0);
const second = placement.getExtraTraceGridCenter(anchor, 1);

assert(first.percentX < anchor.percentX, "first extra should be left of anchor");
assert(first.percentY < anchor.percentY, "first extra should be above anchor");
assert(anchorAgain.percentX === anchor.percentX && anchorAgain.percentY === anchor.percentY,
  "grid index 4 should match anchor (row2 col2)");

const rebuiltAnchor = placement.getExtraTraceAnchorFromGridCenter(first, 0, anchor);
assert(rebuiltAnchor.percentX === anchor.percentX && rebuiltAnchor.percentY === anchor.percentY,
  "dragging first cell should rebuild anchor");

assert(second.percentX > first.percentX, "second extra should be to the right of first");

for (const traceType of ["pink", "yellow", "blue"]) {
  for (let position = 1; position <= 5; position += 1) {
    const layout = placement.getJiuzheTraceMarkerLayout(1, traceType, position);
    assert(layout && Number.isFinite(layout.percentX) && Number.isFinite(layout.percentY),
      `Jiuzhe ${traceType} ${position} should have a layout`);
  }
}

assert(placement.JIUZHE_TRACE_TOKEN_DISPLAY_SCALE === placement.YICHANGDIAN_TRACE_TOKEN_DISPLAY_SCALE,
  "Jiuzhe token scale should match Yichangdian");
assert(placement.getJiuzheTraceMarkerLayout(1, "pink", 1).percentX === 18.43,
  "Jiuzhe pink column should use aligned X");
assert(placement.getJiuzheTraceMarkerLayout(1, "yellow", 5).percentY === 89.46,
  "Jiuzhe yellow fifth marker should use calibrated Y");
assert(placement.getJiuzheTraceMarkerLayout(1, "blue", 4).percentX === 81.14,
  "Jiuzhe blue column should use aligned X");

for (const traceType of ["pink", "yellow", "blue"]) {
  for (let position = 1; position <= 5; position += 1) {
    const layout = placement.getYichangdianTraceMarkerLayout(2, traceType, position);
    assert(layout && Number.isFinite(layout.percentX) && Number.isFinite(layout.percentY),
      `Yichangdian ${traceType} ${position} should have a layout`);
  }
}

const yBase = placement.getYichangdianTraceMarkerLayout(1, "pink", 1);
const yStacked = placement.getYichangdianStackTraceMarkerLayout(yBase, 2);
assert(yStacked.percentY < yBase.percentY, "Yichangdian position 1 stack should move upward");
const rebuiltYBase = placement.getYichangdianBaseFromStackTraceMarkerLayout(yStacked, 2);
assert(rebuiltYBase.percentY === yBase.percentY,
  "dragging a stacked Yichangdian marker should rebuild the base coordinate");
assert(placement.getYichangdianTraceMarkerLayout(1, "pink", 1).percentY === 34.44,
  "Yichangdian revealed face pink first slot should keep calibrated Y");
assert(placement.getYichangdianTraceMarkerLayout(1, "yellow", 5).percentY === 82.3,
  "Yichangdian revealed face yellow fifth slot should keep calibrated Y");
assert(placement.getYichangdianTraceMarkerLayout(2, "blue", 1).percentX === 80.62,
  "Yichangdian revealed face slot 2 blue column should keep calibrated X");
assert(placement.getYichangdianTraceMarkerLayout(1, "pink", 1).percentY
  !== placement.getAlienTraceMarkerLayout(1, "pink").percentY,
  "Yichangdian revealed face layout must not fall back to unrevealed state layout");

for (const traceType of ["pink", "yellow", "blue"]) {
  for (let position = 1; position <= 4; position += 1) {
    const layout = placement.getFangzhouTraceMarkerLayout(2, traceType, position);
    assert(layout && Number.isFinite(layout.percentX) && Number.isFinite(layout.percentY),
      `Fangzhou ${traceType} ${position} should have a layout`);
  }
}
assert(placement.getFangzhouTraceMarkerLayout(2, "pink", 1).percentX === 20.69,
  "Fangzhou pink column should use aligned X");
assert(placement.getFangzhouTraceMarkerLayout(2, "yellow", 2).percentX === 50.44,
  "Fangzhou yellow column should use aligned X");
assert(placement.getFangzhouTraceMarkerLayout(2, "blue", 4).percentX === 79.51,
  "Fangzhou blue column should use aligned X");

for (const traceType of ["pink", "yellow"]) {
  for (let position = 1; position <= 4; position += 1) {
    const layout = placement.getChongTraceMarkerLayout(2, traceType, position);
    assert(layout && Number.isFinite(layout.percentX) && Number.isFinite(layout.percentY),
      `Chong ${traceType} ${position} should have a layout`);
  }
}
for (let position = 1; position <= 9; position += 1) {
  const layout = placement.getChongTraceMarkerLayout(2, "blue", position);
  assert(layout && Number.isFinite(layout.percentX) && Number.isFinite(layout.percentY),
    `Chong blue ${position} should have a layout`);
}
assert(placement.CHONG_TRACE_TOKEN_DISPLAY_SCALE > 0, "Chong token scale should be positive");

for (const traceType of ["pink", "yellow", "blue"]) {
  for (let position = 1; position <= 4; position += 1) {
    const layout = placement.getAmibaTraceMarkerLayout(1, traceType, position);
    assert(layout && Number.isFinite(layout.percentX) && Number.isFinite(layout.percentY),
      `Amiba ${traceType} ${position} should have a layout`);
  }
}
for (const slotId of [
  "orange_1",
  "orange_2",
  "blue_1",
  "blue_2",
  "red_1",
  "red_2",
  "orange_3",
  "blue_3",
  "red_3",
]) {
  const layout = placement.getAmibaSymbolMarkerLayout(1, slotId);
  assert(layout && Number.isFinite(layout.percentX) && Number.isFinite(layout.percentY),
    `Amiba symbol slot ${slotId} should have a layout`);
}
assert(placement.AMIBA_SYMBOL_DISPLAY_SCALE === 3.0,
  "Amiba symbol display scale should be enlarged for calibration");
assert(placement.getAmibaSymbolMarkerLayout(1, "blue_1").percentX > 80,
  "Amiba outer blue slot should align with the right blue circle");
assert(placement.getAmibaSymbolMarkerLayout(1, "orange_3").percentY < 30,
  "Amiba inner orange slot should align with the upper-center orange circle");
assert(placement.getAmibaTraceMarkerLayout(1, "pink", 1).percentY > 55,
  "Amiba trace marker defaults should sit lower on the face art");
assert(placement.getAmibaTraceMarkerLayout(1, "yellow", 4).percentY > 88,
  "Amiba yellow lower trace marker should align with the bottom column");
assert(placement.getAmibaTraceMarkerLayout(1, "pink", 1).percentX === 19.9,
  "Amiba pink trace markers should be vertically aligned");
assert(placement.getAmibaTraceMarkerLayout(1, "yellow", 2).percentX === 49.4,
  "Amiba yellow trace markers should be vertically aligned");
assert(placement.getAmibaTraceMarkerLayout(1, "blue", 3).percentX === 80.0,
  "Amiba blue trace markers should be vertically aligned");

console.log("aliens/placement.test.js ok");
