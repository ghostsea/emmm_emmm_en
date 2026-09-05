"use strict";

const assert = require("assert");
const { parseArgs, parseDevToolsPort } = require("./run_ai_autobattle_browser.js");

assert.equal(parseDevToolsPort("49161\r\n/devtools/browser/example\r\n"), 49161);
for (const value of ["10080", "6000", "0", "65536", "not-a-port"]) {
  assert.throws(() => parseDevToolsPort(value), /Invalid or restricted/);
}

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
