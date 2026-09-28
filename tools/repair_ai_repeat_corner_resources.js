"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { parseDeltaText, summarizeResourceEvents } = require("../randomizer/game/ai/resource-flow");

function repairRepeatedCornerResources(run) {
  if (!run.summary?.ok || !run.summary.gameEnded || run.summary.blocked || run.summary.bugCount !== 0) {
    throw new Error("A completed zero-bug report is required");
  }
  const ledger = run.result?.resourceFlow;
  if (!ledger?.events || !ledger.players?.length) throw new Error("Resource ledger is required");
  const events = structuredClone(ledger.events), changes = [];
  for (const event of events) {
    if (!/^弃非外星人卡并结算其左上角奖励\d+次[:：]/.test(event.sourceDetail || "")) continue;
    const groups = [...event.sourceDetail.matchAll(/(?:^|[；;])\s*资源\s*[:：]([^；;\n]+)/g)];
    if (groups.length !== 1) continue;
    const actual = parseDeltaText(`资源：${groups[0][1]}`).resourceDeltas;
    for (const [key, value] of Object.entries(actual)) {
      const previous = Number(event.resourceDeltas[key]) || 0, delta = value - previous;
      if (!delta) continue;
      // The old parser compensated the missed component using this transaction's
      // observed snapshot. Require that evidence before moving the amount back.
      const inferred = events.filter(e => e.syntheticSnapshotInference
        && e.gameId === event.gameId && e.entryId === event.entryId && e.playerId === event.playerId
        && e.sourceCategory === event.sourceCategory && Math.sign(e.resourceDeltas[key]) === Math.sign(delta));
      if (inferred.length !== 1 || Math.abs(inferred[0].resourceDeltas[key]) < Math.abs(delta)) {
        throw new Error(`No unique snapshot compensation for ${event.entryId}/${event.playerId}/${key}`);
      }
      const compensation = inferred[0], oldCompensation = compensation.resourceDeltas[key];
      event.resourceDeltas[key] = value;
      compensation.resourceDeltas[key] -= delta;
      if (compensation.resourceDeltas[key] === 0) delete compensation.resourceDeltas[key];
      changes.push({ entryId: event.entryId, playerId: event.playerId, stepIndex: event.stepIndex, key,
        previous, corrected: value, oldCompensation, newCompensation: compensation.resourceDeltas[key] || 0,
        text: event.sourceDetail });
    }
  }
  const repairedEvents = events.filter(e => !e.syntheticSnapshotInference || Object.keys(e.resourceDeltas).length
    || Object.keys(e.incomeDeltas || {}).length || e.cards?.length);
  const summary = summarizeResourceEvents(repairedEvents, {
    endingInventories: Object.fromEntries(ledger.players.map(p => [p.playerId, p.endingInventory])),
    productiveMainActionCounts: Object.fromEntries(ledger.players.map(p => [p.playerId, p.productiveMainActionCount])),
  });
  if (summary.players.some(p => Object.keys(p.balanceResiduals || {}).length)) throw new Error("Repaired ledger does not close");
  return { method: "repeat-corner-explicit-impact-with-snapshot-compensation-v1", changes,
    scope: "Reattribute explicit corner impact fields only when the same transaction has a unique sufficient snapshot compensation. Original run, scores, decisions and company resources are not edited.",
    resourceFlow: { ...summary, events: repairedEvents } };
}

if (require.main === module) {
  const [input, output] = process.argv.slice(2);
  if (!input || !output || path.resolve(input) === path.resolve(output)) throw new Error("Use distinct input and output JSON paths");
  const report = repairRepeatedCornerResources(JSON.parse(fs.readFileSync(input, "utf8")));
  fs.writeFileSync(output, JSON.stringify(report, null, 2) + "\n");
  console.log(JSON.stringify({ correctedFields: report.changes.length, players: report.resourceFlow.players.length }));
}

module.exports = { repairRepeatedCornerResources };
