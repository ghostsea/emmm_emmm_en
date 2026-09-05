"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { summarizeResourceEvents } = require("../randomizer/game/ai/resource-flow");

const RESOURCE_KEYS = ["credits", "energy", "publicity", "availableData", "handSize"];

// Old action logs dropped initial-income steps. Recover their resource amounts
// only when the AI decision and the following observed scoreboard agree.
// This does not reconstruct missing card identities or other hidden gross flows.
function repairInitialResources(run) {
  if (!run.summary?.gameEnded || run.summary.blocked || run.summary.bugCount !== 0) {
    throw new Error("A completed, unblocked, zero-bug single game is required");
  }
  const result = run.result;
  const logs = result?.logs || [];
  const ledger = result?.resourceFlow;
  if (!ledger?.events || !ledger.players?.length) throw new Error("Resource events are required");
  if (ledger.events.some(event => /初始收入增加/.test(event.sourceDetail || ""))) {
    throw new Error("Initial income is already recorded; refusing duplicate repair");
  }
  const isInitialDiscard = entry => entry.type === "discard" && entry.details?.pendingType === "initial_income";
  const firstIndex = logs.findIndex(isInitialDiscard);
  if (firstIndex < 0) throw new Error("Initial-income decisions are unavailable");
  const opening = logs[firstIndex].scoreboard;
  if (!Array.isArray(opening) || opening.length !== ledger.players.length) {
    throw new Error("Complete opening scoreboard is required");
  }
  const gameId = ledger.players[0].gameId;
  const playerBase = playerId => {
    const player = result.playerResults.find(row => row.playerId === playerId);
    if (!player) throw new Error(`Missing player result: ${playerId}`);
    return { gameId, playerId, playerLabel: player.playerLabel, finalScore: player.finalScore,
      industryId: player.companyLabel, roundNumber: 1, turnNumber: 0, pace: "setup", cards: [], techIds: [] };
  };
  const repairedEvents = [];
  let verifiedInitialDiscards = 0;
  for (let index = firstIndex; index < logs.length; index += 1) {
    const entry = logs[index];
    if (!isInitialDiscard(entry)) continue;
    const selectedIndexes = entry.details.selectedIndexes;
    if (!Array.isArray(selectedIndexes) || selectedIndexes.length !== 1) {
      throw new Error("Expected one initial-income card");
    }
    const gain = entry.details.incomeGainByIndex?.[selectedIndexes[0]];
    if (!gain) throw new Error(`Missing selected income gain at decision ${entry.id}`);
    const after = logs.slice(index + 1).find(next => next.scoreboard?.some(player => player.playerId === entry.playerId))
      ?.scoreboard.find(player => player.playerId === entry.playerId);
    if (!after) throw new Error(`Missing observed result after decision ${entry.id}`);
    for (const key of RESOURCE_KEYS) {
      if (!Number.isFinite(entry.playerResources?.[key]) || !Number.isFinite(after[key])) {
        throw new Error(`Incomplete ${key} observation at decision ${entry.id}`);
      }
      let expected = entry.playerResources[key] + (Number(gain[key]) || 0) - (key === "handSize" ? 1 : 0);
      if (key === "availableData") expected = Math.min(6, expected);
      if (after[key] !== expected) throw new Error(`Unverified ${key} reward at decision ${entry.id}`);
    }
    verifiedInitialDiscards += 1;
    const base = { ...playerBase(entry.playerId), entryId: `verified-initial-${entry.id}`,
      sourceCategory: "income_upgrade_immediate", incomeDeltas: {} };
    repairedEvents.push({ ...base, sourceDetail: "Verified initial income card cost", resourceDeltas: { handSize: -1 } });
    repairedEvents.push({ ...base, sourceDetail: "Verified initial income reward",
      resourceDeltas: { ...gain }, incomeDeltas: { ...gain } });
  }
  const openingEvents = opening.map(player => {
    if (RESOURCE_KEYS.some(key => !Number.isFinite(player[key]))) throw new Error("Incomplete opening resources");
    return { ...playerBase(player.playerId), entryId: "observed-opening", sourceCategory: "setup",
      sourceDetail: "Observed resources before first initial-income decision",
      resourceDeltas: Object.fromEntries(RESOURCE_KEYS.map(key => [key, player[key]])), incomeDeltas: {} };
  });
  // The old last-setup snapshot was taken after income choices. Replace its
  // resource estimates with the observed pre-income balance, preserving originals on disk.
  const events = ledger.events.map(event => ({ ...event,
    resourceDeltas: event.roundNumber === 1 && event.sourceCategory === "setup" ? {} : { ...event.resourceDeltas },
  }));
  const summary = summarizeResourceEvents([...openingEvents, ...events, ...repairedEvents], {
    endingInventories: Object.fromEntries(ledger.players.map(player => [player.playerId, player.endingInventory])),
  });
  return {
    method: "observed-initial-resource-repair-v1", gameId, verifiedInitialDiscards,
    caveat: "Only resource totals are repaired. Original card-identity rates and hidden gross flows are not reconstructed. Nonempty balanceResiduals remain unresolved.",
    players: summary.players.map(player => ({ playerId: player.playerId, company: player.industryId,
      finalScore: player.finalScore, setupGain: player.setupGain, incomeGain: player.incomeGain,
      nonIncomeGain: player.nonIncomeGain, spent: player.spent, endingInventory: player.endingInventory,
      initialIncomeGain: Object.fromEntries(RESOURCE_KEYS.map(key => [key, repairedEvents
        .filter(event => event.playerId === player.playerId && event.sourceDetail === "Verified initial income reward")
        .reduce((total, event) => total + (Number(event.resourceDeltas[key]) || 0), 0)])),
      initialIncomeCardCost: repairedEvents.filter(event => event.playerId === player.playerId
        && event.sourceDetail === "Verified initial income card cost").length,
      balanceResiduals: player.balanceResiduals })),
  };
}

if (require.main === module) {
  const [input, output] = process.argv.slice(2);
  if (!input || !output || path.resolve(input) === path.resolve(output)) throw new Error("用法：node tools/repair_ai_initial_resources.js 旧单局报告.json 新资源报告.json");
  const report = repairInitialResources(JSON.parse(fs.readFileSync(input, "utf8")));
  fs.writeFileSync(output, JSON.stringify(report, null, 2) + "\n");
  console.log(JSON.stringify({ gameId: report.gameId, verifiedInitialDiscards: report.verifiedInitialDiscards,
    unresolvedPlayers: report.players.filter(player => Object.keys(player.balanceResiduals || {}).length).length }));
}

module.exports = { repairInitialResources };
