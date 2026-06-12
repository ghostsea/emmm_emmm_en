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

console.log("aliens/placement.test.js ok");
