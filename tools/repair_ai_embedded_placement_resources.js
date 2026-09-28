"use strict";
const fs = require("node:fs");
const path = require("node:path");
const { normalizeStructuredActionLog, summarizeResourceEvents } = require("../randomizer/game/ai/resource-flow");

function repairEmbeddedPlacementResources(run) {
  if (!run.summary?.ok || !run.summary.gameEnded || run.summary.blocked || run.summary.bugCount !== 0) throw Error("Completed zero-bug run required");
  const ledger = run.result?.resourceFlow;
  if (!ledger?.events || !ledger.players?.length) throw Error("Resource ledger required");
  const events = structuredClone(ledger.events), changes = [];
  for (let index = 0; index < events.length; index += 1) {
    const event = events[index];
    if (event.syntheticSnapshotInference || !/[；;]放置数据：序号\s*\d+/.test(event.sourceDetail || "")) continue;
    const parsed = normalizeStructuredActionLog([{ id: event.entryId, playerId: event.playerId,
      actionType: event.mainActionType, steps: [{ source: event.pace, text: event.sourceDetail }] }]);
    if (parsed.length < 2 || !parsed.some(e => e.isDataPlacement)) throw Error("Expected split placement events");
    const sum = rows => rows.reduce((total, e) => {
      for (const [key, amount] of Object.entries(e.resourceDeltas || {})) total[key] = (total[key] || 0) + amount;
      return total;
    }, {});
    const next = sum(parsed), adjustments = [];
    for (const key of new Set([...Object.keys(event.resourceDeltas), ...Object.keys(next)])) {
      const delta = (next[key] || 0) - (event.resourceDeltas[key] || 0);
      if (!delta) continue;
      // The structured ledger deliberately excludes score from snapshot
      // resource reconciliation. Correct this duplicate explicit score only;
      // finalScore comes from the game's independent scoring result.
      if (key === "score") {
        adjustments.push({ key, oldExplicit: event.resourceDeltas[key] || 0, newExplicit: next[key] || 0,
          noResourceCompensation: true });
        continue;
      }
      const compensations = events.filter(e => e.syntheticSnapshotInference && e.entryId === event.entryId
        && e.playerId === event.playerId && e.gameId === event.gameId
        && Math.sign(e.resourceDeltas?.[key]) === Math.sign(delta)
        && Math.abs(e.resourceDeltas[key]) >= Math.abs(delta));
      if (compensations.length !== 1) throw Error(`No unique snapshot compensation for ${event.entryId}/${event.playerId}/${key}`);
      const comp = compensations[0], before = comp.resourceDeltas[key];
      comp.resourceDeltas[key] -= delta;
      if (!comp.resourceDeltas[key]) delete comp.resourceDeltas[key];
      adjustments.push({ key, oldExplicit: event.resourceDeltas[key] || 0, newExplicit: next[key] || 0,
        oldCompensation: before, newCompensation: comp.resourceDeltas[key] || 0 });
    }
    const replacements = parsed.map((part, i) => ({ ...event,
      stepIndex: event.stepIndex + i / parsed.length, sourceDetail: part.sourceDetail,
      sourceCategory: part.isDataPlacement ? "data_placement"
        : ["data_placement", "tech_bonus_blue1", "tech_bonus_blue2"].includes(event.sourceCategory)
          ? part.sourceCategory : event.sourceCategory,
      isDataPlacement: part.isDataPlacement, resourceDeltas: part.resourceDeltas,
      incomeDeltas: part.incomeDeltas, cards: i === 0 ? event.cards : [], techIds: i === 0 ? event.techIds : [] }));
    changes.push({ entryId: event.entryId, playerId: event.playerId, stepIndex: event.stepIndex,
      text: event.sourceDetail, adjustments, replacementEvents: replacements });
    events.splice(index, 1, ...replacements); index += replacements.length - 1;
  }
  const cleaned = events.filter(e => !e.syntheticSnapshotInference || Object.keys(e.resourceDeltas).length || Object.keys(e.incomeDeltas || {}).length || e.cards?.length);
  const summary = summarizeResourceEvents(cleaned, {
    endingInventories: Object.fromEntries(ledger.players.map(p => [p.playerId, p.endingInventory])),
    productiveMainActionCounts: Object.fromEntries(ledger.players.map(p => [p.playerId, p.productiveMainActionCount])),
  });
  if (summary.players.some(p => Object.keys(p.balanceResiduals || {}).length)) throw Error("Corrected ledger does not close");
  return { method: "embedded-placement-with-unique-snapshot-compensation-v1", changes,
    scope: "Split explicit full-pool reward/placement messages, collapse adjacent duplicate placement bonus description/receipt, and reduce only unique sufficient same-entry snapshot compensation. Original scores, decisions and reports unchanged. Gross income/spending and blue attribution can change.",
    resourceFlow: { ...summary, events: cleaned } };
}
module.exports = { repairEmbeddedPlacementResources };
if (require.main === module) {
  const [input, output] = process.argv.slice(2);
  if (!input || !output || path.resolve(input) === path.resolve(output)) throw Error("Distinct input and output paths required");
  const result = repairEmbeddedPlacementResources(JSON.parse(fs.readFileSync(input)));
  fs.writeFileSync(output, JSON.stringify(result, null, 2) + "\n");
  console.log(JSON.stringify({ changes: result.changes.length }));
}
