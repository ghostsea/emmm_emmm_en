const assert = require("assert");
const {
  getActiveClasses,
  getSurfaceLabel,
  isSurfaceActive,
} = require("./settlement-minimize.js");

function makeClassList(values = []) {
  const set = new Set(values);
  return {
    contains(value) {
      return set.has(value);
    },
  };
}

{
  const surface = {
    hidden: true,
    dataset: {
      settlementActiveClasses: "discard-selection-active play-card-selection-active",
    },
  };
  const appWrap = { classList: makeClassList(["discard-selection-active"]) };
  assert.deepStrictEqual(getActiveClasses(surface), [
    "discard-selection-active",
    "play-card-selection-active",
  ]);
  assert.strictEqual(isSurfaceActive(surface, appWrap), true);
}

{
  const surface = {
    hidden: false,
    dataset: {},
  };
  assert.strictEqual(isSurfaceActive(surface, { classList: makeClassList() }), true);
  surface.hidden = true;
  assert.strictEqual(isSurfaceActive(surface, { classList: makeClassList() }), false);
}

{
  const title = { textContent: "扇区扫描" };
  const surface = {
    dataset: {},
    querySelector() {
      return {
        getAttribute(name) {
          return name === "aria-labelledby" ? "scan-title" : null;
        },
      };
    },
    getAttribute() {
      return null;
    },
  };
  const documentRef = {
    getElementById(id) {
      return id === "scan-title" ? title : null;
    },
  };
  assert.strictEqual(getSurfaceLabel(surface, documentRef), "扇区扫描");
}

console.log("settlement minimize tests passed");
