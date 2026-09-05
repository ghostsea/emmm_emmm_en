"use strict";

const fs = require("node:fs");
const path = require("node:path");

function mean(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function quantile(values, fraction) {
  const sorted = [...values].sort((a, b) => a - b);
  const position = (sorted.length - 1) * fraction;
  const index = Math.floor(position);
  return sorted[index] + (sorted[Math.ceil(position)] - sorted[index]) * (position - index);
}

function validateRun(run, seed) {
  if (run?.options?.seed !== seed) throw new Error(`种子不一致：需要 ${seed}，实际 ${run?.options?.seed}`);
  const summary = run.summary || {};
  if (!summary.ok || !summary.gameEnded || summary.blocked || summary.bugCount !== 0) {
    throw new Error(`${seed} 未正常完成，不能用未完成分数比较收益`);
  }
  const players = run.result?.playerResults;
  if (!Array.isArray(players) || players.length !== run.options.activePlayerCount) {
    throw new Error(`${seed} 席位数不完整`);
  }
  if (new Set(players.map((player) => player.playerId)).size !== players.length
    || players.some((player) => !player.playerId || !Number.isFinite(player.finalScore))) {
    throw new Error(`${seed} 席位或终分无效`);
  }
  return players;
}

function summarize(games) {
  const players = games.flat();
  const scores = players.map((player) => player.finalScore);
  const upper = [...scores].sort((a, b) => b - a).slice(0, Math.ceil(scores.length / 4));
  const companies = [...new Set(players.map((player) => player.companyLabel))];
  return {
    games: games.length,
    seats: players.length,
    mean: mean(scores),
    min: Math.min(...scores),
    p10: quantile(scores, 0.1),
    p25: quantile(scores, 0.25),
    median: quantile(scores, 0.5),
    p75: quantile(scores, 0.75),
    max: Math.max(...scores),
    topQuartileMean: mean(upper),
    winnerMean: mean(games.map((game) => Math.max(...game.map((p) => p.finalScore)))),
    minimumPerGameMean: mean(games.map((game) => Math.min(...game.map((p) => p.finalScore)))),
    seats270Plus: scores.filter((score) => score >= 270).length,
    seats300Plus: scores.filter((score) => score >= 300).length,
    companies: Object.fromEntries(companies.map((company) => {
      const companyScores = players.filter((p) => p.companyLabel === company).map((p) => p.finalScore);
      return [company, { seats: companyScores.length, mean: mean(companyScores), min: Math.min(...companyScores) }];
    })),
  };
}

function comparePairs(pairs) {
  if (!pairs.length) throw new Error("缺少配对对局");
  const seeds = new Set();
  const baselineGames = [];
  const candidateGames = [];
  const rows = pairs.map(({ seed, baseline, candidate }) => {
    if (seeds.has(seed)) throw new Error(`重复种子：${seed}`);
    seeds.add(seed);
    const before = validateRun(baseline, seed);
    const after = validateRun(candidate, seed);
    const afterById = new Map(after.map((p) => [p.playerId, p]));
    if (before.length !== after.length) throw new Error(`${seed} 两版席位数不一致`);
    const seats = before.map((p) => {
      const next = afterById.get(p.playerId);
      if (!next || next.companyLabel !== p.companyLabel) throw new Error(`${seed} 公司或席位不一致`);
      return { playerId: p.playerId, company: p.companyLabel,
        baseline: p.finalScore, candidate: next.finalScore, delta: next.finalScore - p.finalScore };
    });
    baselineGames.push(before);
    candidateGames.push(after);
    return { seed, meanDelta: mean(seats.map((p) => p.delta)), seats };
  });
  const baseline = summarize(baselineGames);
  const candidate = summarize(candidateGames);
  const deltas = rows.map((row) => row.meanDelta);
  const meanDelta = mean(deltas);
  // Seats share cards and board races. Treat a paired game, not each seat,
  // as the independent observation when describing variation.
  const standardError = deltas.length > 1
    ? Math.sqrt(deltas.reduce((sum, delta) => sum + (delta - meanDelta) ** 2, 0)
      / (deltas.length - 1) / deltas.length)
    : null;
  return {
    baseline, candidate,
    companies: Object.fromEntries(Object.entries(baseline.companies).map(([company, before]) => {
      const after = candidate.companies[company];
      return [company, { seats: before.seats, baseline: before.mean, candidate: after.mean,
        meanDelta: after.mean - before.mean, minimumDelta: after.min - before.min }];
    })),
    delta: Object.fromEntries(Object.entries(baseline)
      .filter(([key, value]) => typeof value === "number" && !["games", "seats"].includes(key))
      .map(([key, value]) => [key, candidate[key] - value])),
    pairedGameMeanDeltaStandardError: standardError,
    gamesImproved: deltas.filter((delta) => delta > 0).length,
    gamesRegressed: deltas.filter((delta) => delta < 0).length,
    pairs: rows,
  };
}

function main(argv) {
  const [manifestFile, outputFile] = argv;
  if (!manifestFile) throw new Error("用法：node tools/compare_ai_score_reports.js 配对清单.json [输出.json]");
  const manifestPath = path.resolve(manifestFile);
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const read = (file) => JSON.parse(fs.readFileSync(path.resolve(path.dirname(manifestPath), file), "utf8"));
  const report = comparePairs(manifest.pairs.map((pair) => ({
    seed: pair.seed, baseline: read(pair.baseline), candidate: read(pair.candidate),
  })));
  if (outputFile) fs.writeFileSync(outputFile, JSON.stringify({ ...manifest, report }, null, 2) + "\n");
  console.log(JSON.stringify({ baseline: report.baseline.mean, candidate: report.candidate.mean,
    delta: report.delta, companies: report.companies,
    gamesImproved: report.gamesImproved, gamesRegressed: report.gamesRegressed }, null, 2));
}

module.exports = { comparePairs, validateRun };
if (require.main === module) main(process.argv.slice(2));
