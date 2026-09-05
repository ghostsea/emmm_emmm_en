"use strict";

const assert = require("assert");
const { parseArgs, parseDevToolsPort, getChromeDebugPort, launchChromeWithSafeDebugPort } = require("./run_ai_autobattle_browser.js");

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

async function testStartupRetry() {
  let portReads = 0;
  assert.equal(await getChromeDebugPort("unused-test-profile", () => {
    portReads += 1;
    if (portReads <= 2) {
      const error = new Error("port file not ready");
      error.code = portReads === 1 ? "ENOENT" : "EBUSY";
      throw error;
    }
    return "49161\r\n/devtools/browser/example";
  }), 49161, "wait for Chrome to finish creating and writing its Windows port file");
  assert.equal(portReads, 3);
  const events = [];
  let launches = 0;
  const runtime = {
    launchChrome: async () => { events.push("launch"); launches += 1; return { pid: launches }; },
    getChromeDebugPort: async () => parseDevToolsPort(launches === 1 ? "10080" : "49161"),
    terminateChrome: async () => { events.push("stop"); return true; },
    clearPortFile: () => events.push("clear"),
  };
  const started = await launchChromeWithSafeDebugPort({}, "unused-test-profile", runtime);
  assert.equal(started.debugPort, 49161);
  assert.equal(started.chrome.pid, 2);
  assert.deepEqual(events, ["launch", "stop", "clear", "launch"],
    "stop the failed browser and remove its stale port before retrying");
  launches = 0;
  await assert.rejects(launchChromeWithSafeDebugPort({}, "unused-test-profile", {
    ...runtime, getChromeDebugPort: async () => { throw new Error("startup timeout"); },
  }), /startup timeout/);
  assert.equal(launches, 1, "unrelated startup failures must not be silently retried");
  launches = 0;
  await assert.rejects(launchChromeWithSafeDebugPort({}, "unused-test-profile", {
    ...runtime, getChromeDebugPort: async () => parseDevToolsPort("10080"),
  }), /restricted/);
  assert.equal(launches, 5, "restricted-port retries must be bounded");
}
testStartupRetry().then(() => console.log("run_ai_autobattle_browser.test.js ok"))
  .catch((error) => { console.error(error); process.exitCode = 1; });
