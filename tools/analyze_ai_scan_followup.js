"use strict";

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

function analyzeRun(run, caseNumber) {
  if (!run.summary?.ok || !run.summary.gameEnded || run.summary.bugCount || run.summary.blocked) {
    throw new Error(`第 ${caseNumber} 组未正常结束`);
  }
  const logs = run.result.logs, players = run.result.playerResults, rows = [];
  for (const [index, event] of logs.entries()) {
    const action = event.details?.action, projection = action?.valueBreakdown?.scanDataProjection;
    if (event.type !== "turn-action" || action?.id !== "scan"
      || !projection?.canOpenAnalyze || !projection.canPayAnalyzeAfterScan) continue;
    const following = logs.slice(index + 1).filter(e => e.playerId === event.playerId && e.roundNumber === event.roundNumber);
    const main = following.filter(e => e.type === "turn-action" && ["main", "pass"].includes(e.details?.action?.kind));
    const first = main[0], firstIndex = first ? following.indexOf(first) : following.length;
    const analyzeIndex = main.findIndex(e => e.details.action.id === "analyze");
    const analyzeCandidate = first?.details.candidates?.find(c => c.id === "analyze");
    const placements = following.slice(0, firstIndex).filter(e => e.type === "turn-action" && e.details?.action?.id === "placeData");
    rows.push({ case: caseNumber, player: event.playerId, company: players.find(p => p.playerId === event.playerId)?.companyLabel,
      round: event.roundNumber, scanLogId: event.id, projection,
      filledSixBeforeNextMain: placements.some(e => e.details.action.target === "computer" && e.details.action.placementSlot === 6),
      bluePlacementBeforeNextMain: placements.some(e => e.details.action.target === "blueBonus"),
      laterSameRoundAnalyze: analyzeIndex >= 0, interveningMainActions: analyzeIndex >= 0 ? analyzeIndex : null,
      eventualAnalysisLogId: analyzeIndex >= 0 ? main[analyzeIndex].id : null,
      firstMain: first && { id: first.details.action.id, logId: first.id, resources: first.playerResources,
        score: first.details.action.score, net: first.details.action.actionGraph?.net },
      analyzeAtFirstMain: analyzeCandidate && { available: analyzeCandidate.available, reason: analyzeCandidate.reason,
        score: analyzeCandidate.score, net: analyzeCandidate.actionGraph?.net, cap: analyzeCandidate.scoreCapReason },
      sequenceBeforeAnalyzeOrRoundEnd: main.slice(0, analyzeIndex >= 0 ? analyzeIndex + 1 : main.length)
        .map(e => ({ id: e.details.action.id, logId: e.id })),
    });
  }
  return rows;
}

function summarize(rows) {
  return Object.fromEntries([...new Set(rows.map(r => r.company))].map(company => {
    const r = rows.filter(x => x.company === company);
    return [company, { forecasts: r.length,
      filledSixBeforeNextMain: r.filter(x => x.filledSixBeforeNextMain).length,
      bluePlacementBeforeNextMain: r.filter(x => x.bluePlacementBeforeNextMain).length,
      nextMainAnalyze: r.filter(x => x.interveningMainActions === 0).length,
      laterSameRoundAnalyze: r.filter(x => x.laterSameRoundAnalyze).length,
      distinctLaterAnalyses: new Set(r.filter(x => x.laterSameRoundAnalyze)
        .map(x => `${x.case}:${x.player}:${x.eventualAnalysisLogId}`)).size,
      noSameRoundStandardAnalyze: r.filter(x => !x.laterSameRoundAnalyze).length,
      analyzeAvailableAtNextMain: r.filter(x => x.analyzeAtFirstMain?.available).length,
    }];
  }));
}

function analyzeSuite(suitePath) {
  const source = fs.readFileSync(suitePath), suite = JSON.parse(source), rows = [], inputs = [];
  if (!suite.plannedPairs || suite.pairs?.length !== suite.plannedPairs) throw new Error("缺少完整预定种子列表");
  const seeds = new Set();
  for (const [index, pair] of suite.pairs.entries()) {
    if (seeds.has(pair.seed)) throw new Error("重复种子");
    seeds.add(pair.seed);
    const input = fs.readFileSync(path.resolve(path.dirname(suitePath), pair.candidate)), run = JSON.parse(input);
    if (run.options?.seed !== pair.seed || run.options?.alienSeed !== pair.alienSeed) throw new Error("种子配置不一致");
    rows.push(...analyzeRun(run, index + 1));
    inputs.push({ file: pair.candidate, sha256: crypto.createHash("sha256").update(input).digest("hex") });
  }
  return { scope: "Complete candidate suite; data-ready and predicted-energy-affordable standard scan forecasts only. Delay is not necessarily a mistake. Overlapping forecasts can point to one later standard analysis; distinctLaterAnalyses deduplicates those outcomes. Effect/card analyses are excluded, so noSameRoundStandardAnalyze is not proof of lost analysis value. Full-six checks cover explicit computer placement decisions before next main only. This is descriptive evidence, not a counterfactual score gain.",
    sourceSuite: path.basename(suitePath), sourceSuiteSha256: crypto.createHash("sha256").update(source).digest("hex"),
    sourceCommit: suite.models?.candidate?.commit, pairs: suite.pairs.length, inputs, groups: summarize(rows), rows };
}

if (require.main === module) {
  const [suitePath, outputPath] = process.argv.slice(2);
  if (!suitePath || !outputPath) throw new Error("用法：node tools/analyze_ai_scan_followup.js <suite.json> <output.json>");
  const result = analyzeSuite(path.resolve(suitePath));
  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2) + "\n");
  console.log(JSON.stringify(result.groups, null, 2));
}
module.exports = { analyzeRun, summarize, analyzeSuite };
