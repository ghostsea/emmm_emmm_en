"use strict";
const fs = require("node:fs");
const path = require("node:path");
const { normalizeStructuredActionLog, summarizeResourceEvents } = require("../randomizer/game/ai/resource-flow");

function repairCardTradeResources(run) {
  if (!run.summary?.ok || !run.summary.gameEnded || run.summary.blocked || run.summary.bugCount !== 0) throw Error("Completed zero-bug run required");
  const ledger = run.result?.resourceFlow;
  if (!ledger?.events || !ledger.players?.length) throw Error("Resource ledger required");
  const events = structuredClone(ledger.events), changes = [];
  for (const event of events) {
    if (event.syntheticSnapshotInference || !/^快速交易：\s*2\s*张牌\s*→\s*1\s*(信用点|能量)(?:；资源：[^；]+)?$/.test(event.sourceDetail || "")) continue;
    const [parsed] = normalizeStructuredActionLog([{ id: event.entryId, playerId: event.playerId,
      actionType: event.mainActionType, steps: [{ source: event.pace, text: event.sourceDetail }] }]);
    const adjustments = [];
    for (const [key, value] of Object.entries(parsed.resourceDeltas)) {
      const delta = value - (event.resourceDeltas[key] || 0);
      if (!delta) continue;
      const matches = events.filter(e => e.syntheticSnapshotInference && e.entryId === event.entryId
        && e.playerId === event.playerId && e.gameId === event.gameId
        && Math.sign(e.resourceDeltas?.[key]) === Math.sign(delta)
        && Math.abs(e.resourceDeltas[key]) >= Math.abs(delta));
      if (matches.length !== 1) throw Error(`No unique sufficient compensation: ${event.entryId}/${event.playerId}/${key}`);
      const compensation = matches[0], before = compensation.resourceDeltas[key];
      compensation.resourceDeltas[key] -= delta;
      if (!compensation.resourceDeltas[key]) delete compensation.resourceDeltas[key];
      adjustments.push({ key, oldExplicit: event.resourceDeltas[key] || 0, newExplicit: value,
        oldCompensation: before, newCompensation: compensation.resourceDeltas[key] || 0 });
      event.resourceDeltas[key] = value;
    }
    if (adjustments.length) {
      event.sourceCategory = "trade_conversion";
      changes.push({ entryId: event.entryId, playerId: event.playerId, stepIndex: event.stepIndex,
        text: event.sourceDetail, adjustments });
    }
  }
  const cleaned = events.filter(e => !e.syntheticSnapshotInference || Object.keys(e.resourceDeltas).length || Object.keys(e.incomeDeltas || {}).length || e.cards?.length);
  const summary = summarizeResourceEvents(cleaned, {
    endingInventories: Object.fromEntries(ledger.players.map(p => [p.playerId, p.endingInventory])),
    productiveMainActionCounts: Object.fromEntries(ledger.players.map(p => [p.playerId, p.productiveMainActionCount])),
  });
  if (summary.players.some(p => Object.keys(p.balanceResiduals || {}).length)) throw Error("Corrected ledger does not close");
  return { method: "card-trade-with-unique-snapshot-compensation-v1", changes,
    scope: "Completed two-card credit/energy trade labels only. Move missing explicit deltas from unique sufficient same-entry/player snapshot compensation. Card identities with unknown purpose remain unknown; do not rewrite input or claim net income/alien resource causality.",
    resourceFlow: { ...summary, events: cleaned } };
}
module.exports = { repairCardTradeResources };
if (require.main === module) {
  const [input, output] = process.argv.slice(2);
  if (!input || !output || path.resolve(input) === path.resolve(output)) throw Error("Distinct input and output paths required");
  const result = repairCardTradeResources(JSON.parse(fs.readFileSync(input)));
  fs.writeFileSync(output, JSON.stringify(result, null, 2) + "\n");
  console.log(JSON.stringify({ changes: result.changes.length }));
}
