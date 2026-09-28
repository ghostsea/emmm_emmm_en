"use strict";
const { normalizeStructuredActionLog, summarizeResourceEvents } = require("../randomizer/game/ai/resource-flow");

function repairTracePaymentResources(run) {
  if (!run.summary?.ok || !run.summary.gameEnded || run.summary.blocked || run.summary.bugCount !== 0) throw Error("Completed zero-bug run required");
  const ledger = run.result?.resourceFlow;
  if (!ledger?.events || !ledger.players?.length) throw Error("Resource ledger required");
  const events = structuredClone(ledger.events), changes = [];
  for (const event of events) {
    if (event.syntheticSnapshotInference || !/半人马(?:粉色|黄色|蓝色)痕迹\s*[12]号位：支付\s+\d+\s*数据、分数\+\d+/.test(event.sourceDetail || "")) continue;
    const [parsed] = normalizeStructuredActionLog([{ id: event.entryId, playerId: event.playerId,
      actionType: event.mainActionType, steps: [{ source: event.pace, text: event.sourceDetail }] }]);
    const key = "availableData", old = event.resourceDeltas[key] || 0, value = parsed.resourceDeltas[key];
    if (!(value < 0)) throw Error("Expected explicit completed payment");
    const delta = value - old;
    if (!delta) continue;
    const matches = events.filter(e => e.syntheticSnapshotInference && e.entryId === event.entryId
      && e.playerId === event.playerId && e.gameId === event.gameId
      && Math.sign(e.resourceDeltas?.[key]) === Math.sign(delta)
      && Math.abs(e.resourceDeltas[key]) >= Math.abs(delta));
    if (matches.length !== 1) throw Error(`No unique sufficient compensation: ${event.entryId}/${event.playerId}/${key}`);
    const compensation = matches[0], before = compensation.resourceDeltas[key];
    compensation.resourceDeltas[key] -= delta;
    if (!compensation.resourceDeltas[key]) delete compensation.resourceDeltas[key];
    event.resourceDeltas[key] = value;
    changes.push({ entryId: event.entryId, playerId: event.playerId, stepIndex: event.stepIndex,
      text: event.sourceDetail, oldExplicit: old, newExplicit: value,
      oldCompensation: before, newCompensation: compensation.resourceDeltas[key] || 0 });
  }
  const cleaned = events.filter(e => !e.syntheticSnapshotInference || Object.keys(e.resourceDeltas).length || Object.keys(e.incomeDeltas || {}).length || e.cards?.length);
  const summary = summarizeResourceEvents(cleaned, {
    endingInventories: Object.fromEntries(ledger.players.map(p => [p.playerId, p.endingInventory])),
    productiveMainActionCounts: Object.fromEntries(ledger.players.map(p => [p.playerId, p.productiveMainActionCount])),
  });
  if (summary.players.some(p => Object.keys(p.balanceResiduals || {}).length)) throw Error("Corrected ledger does not close");
  return { method: "completed-centauri-trace-payment-with-unique-snapshot-compensation-v1", changes,
    scope: "Completed Centauri trace payments only; relocate unique sufficient same-entry/player snapshot compensation. Preserve input and net balances; gross data gain/spend can decrease.",
    resourceFlow: { ...summary, events: cleaned } };
}
module.exports = { repairTracePaymentResources };
