"use strict";
const fs = require("node:fs");
const path = require("node:path");
const { reattributeNamedCardPickups, summarizeResourceEvents } = require("../randomizer/game/ai/resource-flow");

function repairNamedPickupAttribution(run) {
  if (!run.summary?.ok || !run.summary.gameEnded || run.summary.bugCount || run.summary.blocked) throw Error("Completed zero-bug run required");
  const ledger = run.result?.resourceFlow;
  if (!ledger?.events || ledger.reconciliation?.residualMagnitude || ledger.reconciliation?.baselineMissingCount) throw Error("Reconciled event ledger required");
  const events = structuredClone(ledger.events), changes = reattributeNamedCardPickups(events);
  const summary = summarizeResourceEvents(events, {
    endingInventories: Object.fromEntries(ledger.players.map(p => [p.playerId, p.endingInventory])),
    productiveMainActionCounts: Object.fromEntries(ledger.players.map(p => [p.playerId, p.productiveMainActionCount])),
  });
  if (summary.players.some(p => Object.keys(p.balanceResiduals || {}).length)) throw Error("Resource balance changed");
  return { method: "exact-named-pickup-attribution-v1", changes,
    scope: "Relocate an observed physical card and snapshot gain above the explicitly logged delta within the same player/transaction to a unique exact named pickup. Preserve net balance, inventories and raw input. Separating a pickup previously netted against an explicit payment increases gross hand gain and spending equally; income/non-income attribution can change. Ambiguous evidence remains unchanged.",
    resourceFlow: { ...summary, events } };
}
if (require.main === module) {
  const [input, output] = process.argv.slice(2);
  if (!input || !output || path.resolve(input) === path.resolve(output)) throw Error("Separate input and output required");
  const result = repairNamedPickupAttribution(JSON.parse(fs.readFileSync(input, "utf8")));
  fs.writeFileSync(output, JSON.stringify(result, null, 2) + "\n");console.log({ changes: result.changes.length });
}
module.exports = { repairNamedPickupAttribution };
