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

console.log("aliens/placement.test.js ok");
