"use strict";

const assert = require("node:assert/strict");
const gameRandom = require("./random.js");

assert.equal(gameRandom.normalizeDateKey(new Date(2026, 6, 16, 23, 59)), "2026-07-16");
assert.equal(gameRandom.createDailySeed("2026-07-16"), "seti-daily-v1:2026-07-16");
assert.equal(Math.random, gameRandom.random);

gameRandom.useDailyRandom("2026-07-16");
const firstSequence = Array.from({ length: 8 }, () => Math.random());
gameRandom.useDailyRandom("2026-07-16");
const repeatedSequence = Array.from({ length: 8 }, () => Math.random());
assert.deepEqual(repeatedSequence, firstSequence);

gameRandom.useDailyRandom("2026-07-17");
const nextDaySequence = Array.from({ length: 8 }, () => Math.random());
assert.notDeepEqual(nextDaySequence, firstSequence);

gameRandom.useDailyRandom("2026-07-16");
Math.random();
Math.random();
const snapshot = gameRandom.getSnapshot();
const expectedNextValue = Math.random();
gameRandom.useNativeRandom();
gameRandom.restoreSnapshot(snapshot);
assert.equal(Math.random(), expectedNextValue);
assert.equal(gameRandom.getSnapshot().calls, snapshot.calls + 1);

gameRandom.useNativeRandom();
assert.equal(gameRandom.getSnapshot().mode, "native");
gameRandom.restoreNativeMathRandom();

console.log("game random tests passed");
