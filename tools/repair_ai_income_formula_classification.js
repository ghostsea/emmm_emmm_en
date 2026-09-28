"use strict";
const fs = require("node:fs");
const path = require("node:path");
const { parseDeltaText, summarizeResourceEvents } = require("../randomizer/game/ai/resource-flow");
const counted = /^(?:当前每个能量收入|当前每个信用收入|每个非默认盲抽收入)\s*[:：]/;
const tucked = /^将本卡放入收入区\s*[:：]/;

function repairIncomeFormulaClassification(run) {
  if (!run.summary?.ok || !run.summary.gameEnded || run.summary.blocked || run.summary.bugCount !== 0) {
    throw new Error("A completed zero-bug run is required");
  }
  const ledger = run.result?.resourceFlow;
  if (!ledger?.events || ledger.reconciliation?.residualMagnitude !== 0 || ledger.reconciliation?.baselineMissingCount !== 0) {
    throw new Error("A snapshot-reconciled ledger is required");
  }
  const events = structuredClone(ledger.events), changes = [], groups = new Map();
  for (const event of events) {
    const isCounted = counted.test(event.sourceDetail || "");
    if (!isCounted && !tucked.test(event.sourceDetail || "")) continue;
    const income = isCounted ? {} : parseDeltaText(event.sourceDetail).incomeDeltas;
    const category = isCounted ? "card" : "income_upgrade_immediate";
    const before = { sourceCategory: event.sourceCategory, incomeDeltas: { ...event.incomeDeltas } };
    if (JSON.stringify(income) === JSON.stringify(event.incomeDeltas) && category === event.sourceCategory) continue;
    const groupKey = JSON.stringify([event.gameId, event.entryId, event.playerId]);
    if (!groups.has(groupKey)) groups.set(groupKey, { event, delta: {} });
    const delta = groups.get(groupKey).delta;
    for (const key of new Set([...Object.keys(income), ...Object.keys(event.incomeDeltas)])) {
      delta[key] = (delta[key] || 0) + (income[key] || 0) - (event.incomeDeltas[key] || 0);
    }
    event.incomeDeltas = income;
    event.sourceCategory = category;
    changes.push({ entryId: event.entryId, stepIndex: event.stepIndex, playerId: event.playerId,
      text: event.sourceDetail, before, after: { sourceCategory: category, incomeDeltas: income } });
  }
  const compensations = [];
  for (const { event, delta } of groups.values()) for (const [key, value] of Object.entries(delta)) {
    if (!value) continue;
    const matches = events.filter(e => e.syntheticSnapshotInference && e.gameId === event.gameId
      && e.entryId === event.entryId && e.playerId === event.playerId
      && Math.sign(e.incomeDeltas[key]) === Math.sign(value));
    if (matches.length !== 1 || Math.abs(matches[0].incomeDeltas[key]) < Math.abs(value)) {
      throw new Error(`No unique income snapshot compensation: ${event.entryId}/${event.playerId}/${key}`);
    }
    const inferred = matches[0], before = inferred.incomeDeltas[key];
    inferred.incomeDeltas[key] -= value;
    if (!inferred.incomeDeltas[key]) delete inferred.incomeDeltas[key];
    compensations.push({ entryId: event.entryId, playerId: event.playerId, key, before, after: inferred.incomeDeltas[key] || 0 });
  }
  const repairedEvents = events.filter(e => !e.syntheticSnapshotInference || Object.keys(e.resourceDeltas).length
    || Object.keys(e.incomeDeltas).length || e.cards?.length);
  const summary = summarizeResourceEvents(repairedEvents, {
    endingInventories: Object.fromEntries(ledger.players.map(p => [p.playerId, p.endingInventory])),
    productiveMainActionCounts: Object.fromEntries(ledger.players.map(p => [p.playerId, p.productiveMainActionCount])),
  });
  if (summary.players.some(p => Object.keys(p.balanceResiduals || {}).length)) throw new Error("Resource balance changed");
  return { method: "income-formula-classification-v1", changes, compensations,
    scope: "Correct income-versus-non-income classification for three counted-income labels and actual tuck-to-income nodes. Preserve all original resource amounts, including existing resource snapshot inferences; this is not a reconstruction of missing per-step gross payouts. Require unique sufficient income snapshot compensation, preserve original files and productive action counts.",
    resourceFlow: { ...summary, events: repairedEvents } };
}
if (require.main === module) {
  const [input, output] = process.argv.slice(2);
  if (!input || !output || path.resolve(input) === path.resolve(output)) throw new Error("Use separate input/output files");
  const result = repairIncomeFormulaClassification(JSON.parse(fs.readFileSync(input, "utf8")));
  fs.writeFileSync(output, JSON.stringify(result, null, 2) + "\n");
  console.log(JSON.stringify({ changes: result.changes.length, compensations: result.compensations.length }));
}
module.exports = { repairIncomeFormulaClassification };
