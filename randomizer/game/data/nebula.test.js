const assert = require("node:assert/strict");

require("./nebula-placement");
require("./nebula-state");
require("./index");

const data = require("./index");

assert.equal(data.getNebulaCapacity("sector-2-a"), 6);
assert.equal(data.getNebulaCapacity("sector-3-b"), 6);
assert.equal(data.getNebulaCapacity("sector-1-a"), 5);
assert.equal(data.getNebulaCapacity("sector-2-b"), 5);
assert.equal(data.getNebulaCapacity("sector-1-b"), 4);

const siriusLocal = data.sectorImageToNebulaLocal("sector-2-a", 21.26, 62.05);
assert.equal(siriusLocal.percentX, 42.52);
assert.equal(siriusLocal.percentY, 62.05);

const barnardLocal = data.sectorImageToNebulaLocal("sector-2-b", 59.77, 41.52);
assert.equal(barnardLocal.percentX, 19.54);
assert.equal(barnardLocal.percentY, 41.52);

const siriusBack = data.nebulaLocalToSectorImage("sector-2-a", 42.52, 62.05);
assert.equal(siriusBack.percentX, 21.26);
assert.equal(siriusBack.percentY, 62.05);

const siriusSlot1 = data.getNebulaDataSlotLayout("sector-2-a", 1);
assert.equal(siriusSlot1.percentX, 42.52);
assert.equal(siriusSlot1.percentY, 62.05);

const barnardSlot5 = data.getNebulaDataSlotLayout("sector-2-b", 5);
assert.equal(barnardSlot5.percentX, 48.28);
assert.equal(barnardSlot5.percentY, 54.35);

const nebulaDataState = data.createDefaultNebulaDataState();

const siriusFill = data.fillNebulaData(nebulaDataState, "sector-2-a", { source: "debug" });
assert.equal(siriusFill.ok, true);
assert.equal(siriusFill.added.length, 6);
assert.equal(data.listNebulaTokens(nebulaDataState, "sector-2-a").length, 6);

const siriusOverflow = data.fillNebulaData(nebulaDataState, "sector-2-a", { source: "debug" });
assert.equal(siriusOverflow.ok, false);

const vegaFill = data.fillNebulaData(nebulaDataState, "sector-1-b", { source: "debug" });
assert.equal(vegaFill.ok, true);
assert.equal(vegaFill.added.length, 4);

const allFill = data.fillAllNebulaData(nebulaDataState, { source: "debug" });
assert.equal(allFill.ok, true);
assert.equal(data.listAllNebulaTokens(nebulaDataState).length, 42);

for (const nebulaId of data.NEBULA_IDS) {
  const capacity = data.getNebulaCapacity(nebulaId);
  const tokens = data.listNebulaTokens(nebulaDataState, nebulaId);
  assert.equal(tokens.length, capacity, `${nebulaId} should have ${capacity} tokens`);
  for (const token of tokens) {
    const layout = data.getNebulaDataSlotLayout(nebulaId, token.slotIndex);
    assert.ok(layout, `${nebulaId} slot ${token.slotIndex} has layout`);
    assert.equal(token.percentX, layout.percentX);
    assert.equal(token.percentY, layout.percentY);
  }
}

const emptyReadout = data.getNebulaReadoutLines(data.createDefaultNebulaDataState());
assert.ok(emptyReadout.some((line) => line.includes("星云数据")));
assert.equal(emptyReadout.filter((line) => line.startsWith("[")).length, data.NEBULA_IDS.length);
assert.ok(emptyReadout.some((line) => line.includes("[南河三] 0/5")));
assert.ok(emptyReadout.some((line) => line.includes("局部坐标")));

const readout = data.getNebulaReadoutLines(nebulaDataState);
assert.ok(readout.some((line) => line.includes("[天狼星A] 6/6")));
assert.ok(readout.some((line) => line.includes("序号") && line.includes("局部坐标")));

data.updateNebulaTokenPosition(nebulaDataState, "sector-2-a", 1, {
  percentX: 12.34,
  percentY: 56.78,
});
const moved = data.listNebulaTokens(nebulaDataState, "sector-2-a").find((token) => token.slotIndex === 1);
assert.equal(moved.percentX, 12.34);
assert.equal(moved.percentY, 56.78);

console.log("nebula.test.js: all tests passed");
