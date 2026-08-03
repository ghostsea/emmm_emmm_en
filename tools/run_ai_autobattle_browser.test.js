"use strict";

const assert = require("assert");
const { parseArgs } = require("./run_ai_autobattle_browser.js");

{
  const options = parseArgs(["--single", "--seeds", "fixed:fn"]);
  assert.equal(options.seed, "fixed:fn");
  assert.equal(options.seeds, null);
}

assert.throws(
  () => parseArgs(["--single", "--seeds", "fixed:fn,fixed:fl"]),
  /--single.*one seed/i,
);

assert.throws(
  () => parseArgs(["--single", "--seed", "fixed:fn", "--seeds", "fixed:fn"]),
  /--single.*--seed.*--seeds/i,
);

console.log("run_ai_autobattle_browser.test.js ok");
