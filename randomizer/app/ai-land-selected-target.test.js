"use strict";
const fs = require("fs"), path = require("path"), vm = require("vm"), assert = require("assert");
const source = fs.readFileSync(path.join(__dirname, "ai-controller.js"), "utf8");
function extract(from, to) { const start = source.indexOf(`    function ${from}(`); const end = source.indexOf(`    function ${to}(`, start); assert(start >= 0 && end > start); return source.slice(start, end); }
const player = { id: "p" };
const box = { getCurrentPlayer: () => player, aiNumber: n => Number(n) || 0,
  chooseAiLandChoice: choices => choices.length ? { choice: choices.at(-1), index: choices.length - 1 } : null,
  getAiLandDirectScoreGainForTarget: (planetId, target) => planetId === "jupiter" ? (target?.satelliteId === "europa" ? 9 : 7) : planetId === "mars" ? 2 : 0,
};
vm.createContext(box);
vm.runInContext(extract("getAiCardLandChoicePlanetId", "getAiCardLandChoiceRewardEffects") + extract("getAiBestLandDirectScoreGain", "getAiBestSatelliteLandingOpportunity") + extract("resolveAiLandCandidateTarget", "scoreAiLandAction"), box);
const choices = [
  { planetId: "mars", planet: { name: "火星", planetId: "mars" }, energyCost: 2, cost: { energy: 2 }, rocketId: "r1", target: { type: "planet" } },
  { planetId: "jupiter", planet: { name: "木星", planetId: "jupiter" }, energyCost: 1, cost: { energy: 1 }, rocketId: "r2", target: { type: "satellite", satelliteId: "europa" } },
];
const original = { available: true, planetId: "multi-land", energyCost: 2, directScoreGain: 0, choices };
const snapshot = JSON.stringify(original);
const actual = box.resolveAiLandCandidateTarget(original, player);
assert.equal(actual.planetId, "jupiter"); assert.equal(actual.energyCost, 1); assert.equal(actual.directScoreGain, 9);
assert.equal(actual.selectedChoiceIndex, 1); assert.equal(actual.selectedRocketId, "r2"); assert.equal(actual.selectedTarget.satelliteId, "europa");
assert.equal(JSON.stringify(original), snapshot, "preview must not mutate source candidates");
assert.equal(box.getAiBestLandDirectScoreGain("multi-land", [choices[0], { ...choices[1], target: { type: "planet" } }], player), 7);
assert.equal(box.resolveAiLandCandidateTarget({ ...original, choices: [{ ...choices[1], cost: {}, energyCost: 3 }] }, player).energyCost, 0, "explicit free cost beats normal energy fallback");
assert.equal(box.resolveAiLandCandidateTarget({ ...original, choices: [] }, player).planetId, "multi-land");
assert.equal(box.resolveAiLandCandidateTarget({ ...original, available: false }, player).planetId, "multi-land");
for (const choice of [
  { planet: { planetId: "jupiter" }, target: { type: "planet" } },
  { target: { planetId: "jupiter", type: "planet" } },
]) assert.equal(box.getAiBestLandDirectScoreGain("multi-land", [choice], player), 7);
console.log("AI selected landing target tests passed");
