"use strict";

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const assert = require("node:assert/strict");
const defaultFlow = require("../randomizer/game/ai/resource-flow");
const keys = ["credits", "energy", "handSize", "availableData", "publicity"];
const groupKey = e => [e.playerId, e.roundNumber, e.turnNumber].join("|");
const hash = data => crypto.createHash("sha256").update(data).digest("hex");

function analyzeRun(run, caseNumber, side, flow = defaultFlow) {
  assert(run.summary?.ok && run.summary.gameEnded && !run.summary.blocked && !run.summary.bugCount, "complete successful game required");
  const { logs, resourceFlow } = run.result;
  const events = resourceFlow.events, decisions = new Map(), payments = new Map(), matched = new Map();
  for (const log of logs) {
    if (log.type !== "turn-action" || log.details?.action?.id !== "scan") continue;
    const key = groupKey(log);
    if (!decisions.has(key)) decisions.set(key, []);
    decisions.get(key).push(log);
  }
  for (const event of events) {
    if (event.mainActionType !== "scan" || event.pace !== "main" || event.sourceCategory !== "cost"
      || !String(event.sourceDetail).includes("扫描费用")) continue;
    const key = groupKey(event);
    if (!payments.has(key)) payments.set(key, []);
    assert(!payments.get(key).some(e => e.entryId === event.entryId), "duplicate scan payment");
    payments.get(key).push(event);
  }
  assert.deepEqual([...decisions.keys()].sort(), [...payments.keys()].sort(), "scan decision/payment groups");
  for (const [key, group] of decisions) {
    const paid = payments.get(key);
    assert.equal(group.length, paid.length, "scan decision/payment count " + key);
    group.forEach((log, index) => matched.set(log.id, paid[index]));
  }
  const ordinals = new Map(), rows = [];
  for (const [index, log] of logs.entries()) {
    const payment = matched.get(log.id);
    if (!payment) continue;
    const roundKey = [log.playerId, log.roundNumber].join("|");
    const ordinal = (ordinals.get(roundKey) || 0) + 1;
    ordinals.set(roundKey, ordinal);
    const afterPayment = events.filter(e => e.playerId === log.playerId && e.entryId === payment.entryId && e.stepIndex >= payment.stepIndex);
    const main = afterPayment.filter(e => e.pace === "main");
    const direct = flow.summarizeResourceEvents(main).players[0];
    assert(direct, "scan transaction summary");
    const priorTech = new Set(events.slice(0, events.indexOf(payment)).filter(e => e.playerId === log.playerId).flatMap(e => e.techIds || []));
    const blue = flow.summarizeBlueTechRewards([{ techIds: [...priorTech] }, ...afterPayment]);
    const laterMain = logs.slice(index + 1).filter(e => e.playerId === log.playerId && e.roundNumber === log.roundNumber
      && e.type === "turn-action" && ["main", "pass"].includes(e.details?.action?.kind));
    const analysisIndex = laterMain.findIndex(e => e.details.action.id === "analyze");
    rows.push({ case: caseNumber, side, player: log.playerId,
      company: resourceFlow.players.find(p => p.playerId === log.playerId)?.industryId,
      logId: log.id, entryId: payment.entryId, round: log.roundNumber, displayTurn: log.turnNumber, rawTurn: log.rawTurnNumber,
      ordinal, before: log.playerResources, selectedScore: log.details.action.score, capReason: log.details.action.scoreCapReason || null,
      payment: Object.fromEntries(keys.map(k => [k, Math.max(0, -(payment.resourceDeltas?.[k] || 0))])),
      mainResources: Object.fromEntries(["incomeGain", "nonIncomeGain", "spent"].map(bucket => [bucket, Object.fromEntries(keys.map(k => [k, direct[bucket]?.[k] || 0]))])),
      sameTransactionBlueRewardsAfterPayment: blue,
      nextMain: laterMain[0]?.details.action.id || null,
      laterSameRoundAnalysisLogId: analysisIndex >= 0 ? laterMain[analysisIndex].id : null,
      interveningMainActions: analysisIndex >= 0 ? analysisIndex : null,
    });
  }
  return rows;
}

function summarize(rows) {
  const result = {};
  for (const side of [...new Set(rows.map(r => r.side))]) {
    result[side] = {};
    for (const company of [...new Set(rows.filter(r => r.side === side).map(r => r.company))]) {
      const rs = rows.filter(r => r.side === side && r.company === company);
      const sum = fn => rs.reduce((n, r) => n + fn(r), 0);
      result[side][company] = { scans: rs.length, thirdOrLater: sum(r => Number(r.ordinal >= 3)),
        mainResources: Object.fromEntries(["incomeGain", "nonIncomeGain", "spent"].map(bucket => [bucket, Object.fromEntries(keys.map(k => [k, sum(r => r.mainResources[bucket][k])]))])),
        sameTransactionBlueCredit: sum(r => r.sameTransactionBlueRewardsAfterPayment.blue1CreditGain),
        sameTransactionBlueEnergy: sum(r => r.sameTransactionBlueRewardsAfterPayment.blue2EnergyGain),
        nextMainAnalysis: sum(r => Number(r.nextMain === "analyze")),
        laterSameRoundAnalysis: sum(r => Number(r.laterSameRoundAnalysisLogId !== null)),
        distinctLaterAnalyses: new Set(rs.filter(r => r.laterSameRoundAnalysisLogId !== null).map(r => [r.case, r.player, r.laterSameRoundAnalysisLogId].join("|"))).size,
      };
    }
  }
  return result;
}

function analyzeSuite(suiteFile) {
  const source = fs.readFileSync(suiteFile), suite = JSON.parse(source), dir = path.dirname(suiteFile);
  assert(suite.plannedPairs && suite.pairs.length === suite.plannedPairs, "full planned pairs required");
  assert.equal(new Set(suite.pairs.map(p => p.seed)).size, suite.plannedPairs, "unique seeds");
  for (const model of Object.values(suite.models)) for (const [file, expected] of Object.entries(model.hashes)) {
    assert.equal(hash(fs.readFileSync(path.resolve(dir, model.root, file))), expected, "frozen source " + file);
  }
  const flow = require(path.resolve(dir, suite.models.base.root, "randomizer/game/ai/resource-flow.js"));
  const rows = [], manifest = [];
  for (const [index, pair] of suite.pairs.entries()) for (const side of ["baseline", "candidate"]) {
    const file = path.resolve(dir, pair[side]), raw = fs.readFileSync(file), run = JSON.parse(raw);
    assert.equal(run.options.seed, pair.seed); assert.equal(run.options.alienSeed, pair.alienSeed);
    rows.push(...analyzeRun(run, index + 1, side, flow));
    manifest.push({ file: pair[side], side, sha256: hash(raw) });
  }
  return { scope: "All standard scan decisions in both complete arms, matched to unique paid transactions by player/round/display-turn and ordinal. Main resources exclude separate quick actions. Blue rewards cover only the same transaction after scan payment, with prior technology ownership and embedded income excluded; this is temporal association, not proof that the rewarded data came from this scan. Later same-round standard analysis may follow multiple scans and is deduplicated. No final-score attribution or inference about unlogged effects.",
    sourceSuiteSha256: hash(source), models: Object.fromEntries(Object.entries(suite.models).map(([k, m]) => [k, m.commit])),
    pairs: suite.pairs.length, groups: summarize(rows), rows, manifest };
}

if (require.main === module) {
  const [input, output] = process.argv.slice(2);
  if (!input || !output) throw new Error("Usage: node tools/analyze_ai_scan_transactions.js suite.json output.json");
  const result = analyzeSuite(path.resolve(input));
  fs.writeFileSync(output, JSON.stringify(result, null, 2) + "\n");
  console.log(JSON.stringify(result.groups, null, 2));
}
module.exports = { analyzeRun, analyzeSuite, summarize };
