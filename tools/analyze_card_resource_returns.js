"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { RESOURCE_VALUES, SPENDABLE_RESOURCE_KEYS } = require("../randomizer/game/ai/resource-flow");
const { validateRun } = require("./compare_ai_score_reports");

const zeroResources = () => Object.fromEntries(SPENDABLE_RESOURCE_KEYS.map((key) => [key, 0]));
const weighted = (resources) => SPENDABLE_RESOURCE_KEYS.reduce((sum, key) => sum + resources[key] * RESOURCE_VALUES[key], 0);
const sum = (rows, key) => rows.reduce((total, row) => total + row[key], 0);

function summarizeCardReturns(games) {
  const actions = [];
  const players = [];
  for (const game of games) {
    for (const player of game.players) {
      const entries = new Map();
      for (const event of game.events) {
        if (event.playerId !== player.playerId || event.entryId == null) continue;
        if (event.pace !== "main" && !(event.syntheticSnapshotInference && event.pace === "playCard")) continue;
        if (!entries.has(event.entryId)) entries.set(event.entryId, []);
        entries.get(event.entryId).push(event);
      }
      const playerActions = [];
      for (const [entryId, events] of entries) {
        const playedCards = events.filter((event) => event.pace === "main")
          .flatMap((event) => (event.cards || []).filter((card) => card.change === "play"));
        if (!playedCards.length) continue;
        const gain = zeroResources(), cost = zeroResources(), incomeIncrease = {};
        const snapshotGain = zeroResources(), snapshotCost = zeroResources();
        let directScore = 0;
        for (const event of events) {
          // Entry snapshots can span quick steps too. Expose their residual separately;
          // without step-level evidence it is not a confirmed cost of the played card.
          if (event.syntheticSnapshotInference) {
            for (const key of SPENDABLE_RESOURCE_KEYS) {
              const delta = Number(event.resourceDeltas?.[key]) || 0;
              snapshotGain[key] += Math.max(0, delta);
              snapshotCost[key] += Math.max(0, -delta);
            }
            continue;
          }
          for (const key of SPENDABLE_RESOURCE_KEYS) {
            const delta = Number(event.resourceDeltas?.[key]) || 0;
            gain[key] += Math.max(0, delta);
            cost[key] += Math.max(0, -delta);
          }
          directScore += Math.max(0, Number(event.resourceDeltas?.score) || 0);
          for (const [key, value] of Object.entries(event.incomeDeltas || {})) {
            incomeIncrease[key] = (incomeIncrease[key] || 0) + Math.max(0, Number(value) || 0);
          }
        }
        playerActions.push({ gameId: game.gameId, entryId, playerId: player.playerId, company: player.company,
          roundNumber: events[0].roundNumber, cards: playedCards.map((card) => card.label || card.key),
          gain, cost, incomeIncrease, directScore, gainWeighted: weighted(gain), costWeighted: weighted(cost),
          snapshotGain, snapshotCost, snapshotGainWeighted: weighted(snapshotGain), snapshotCostWeighted: weighted(snapshotCost),
          hasResourceReturn: Object.values(gain).some((value) => value > 0),
          hasIncomeIncrease: Object.values(incomeIncrease).some((value) => value > 0) });
      }
      actions.push(...playerActions);
      players.push({ gameId: game.gameId, playerId: player.playerId, company: player.company,
        cardMainActions: playerActions.length,
        resourceReturningActions: playerActions.filter((action) => action.hasResourceReturn).length,
        incomeIncreasingActions: playerActions.filter((action) => action.hasIncomeIncrease).length,
        gainWeighted: sum(playerActions, "gainWeighted"), costWeighted: sum(playerActions, "costWeighted"),
        directScore: sum(playerActions, "directScore"),
        snapshotGainWeighted: sum(playerActions, "snapshotGainWeighted"), snapshotCostWeighted: sum(playerActions, "snapshotCostWeighted") });
    }
  }
  function summarize(rows) {
    const keys = ["cardMainActions", "resourceReturningActions", "incomeIncreasingActions", "gainWeighted", "costWeighted", "directScore", "snapshotGainWeighted", "snapshotCostWeighted"];
    return { players: rows.length, perPlayer: Object.fromEntries(keys.map((key) => [key, rows.length ? sum(rows, key) / rows.length : null])) };
  }
  return { allPlayers: summarize(players), byCompany: Object.fromEntries([...new Set(players.map((p) => p.company))]
    .map((company) => [company, summarize(players.filter((p) => p.company === company))])), players, actions };
}

function main(manifestFile, outputFile) {
  if (!manifestFile || !outputFile) throw Error("用法：node tools/analyze_card_resource_returns.js 清单.json 输出.json");
  const manifestPath = path.resolve(manifestFile);
  const read = (file) => JSON.parse(fs.readFileSync(path.resolve(path.dirname(manifestPath), file), "utf8"));
  const manifest = read(path.basename(manifestPath));
  const reference = read(manifest.reference);
  const humanId = reference.humanPlayerLabel || "白色";
  const humanGames = reference.games.map((game) => ({ gameId: game.gameId, events: game.events,
    players: game.playerResults.filter((player) => player.playerId === humanId)
      .map((player) => ({ playerId: player.playerId, company: game.playerMetadata[player.playerId]?.industryId || "unknown" })) }));
  const aiGames = manifest.ai.map((file) => {
    const run = read(file);
    return { gameId: run.options.seed, events: run.result.resourceFlow.events,
      players: validateRun(run, run.options.seed).map((player) => ({ playerId: player.playerId, company: player.companyLabel })) };
  });
  const report = {
    definition: "按玩家与行动entryId分组，仅统计含实际打出牌记录的main流水。包含该打牌行动触发的即时后续奖励，排除同回合独立quick流水；收入轨增量另列，不折成未来资源。不是卡牌固有类型分类，也不包含尚未兑现的任务或终局收益。",
    limitations: ["旧真人日志存在资源获取缺项，计数和收益仅代表可见流水。", "资源成本含打出的手牌及后续收入弃牌；净资源流不能替代整局得分。", "同一打牌条目的快照推算余量单列为snapshotGain/snapshotCost；它可能跨越快速步骤，不能直接归为卡牌收益或成本。"],
    resourceWeights: Object.fromEntries(SPENDABLE_RESOURCE_KEYS.map((key) => [key, RESOURCE_VALUES[key]])),
    reference: summarizeCardReturns(humanGames), ai: summarizeCardReturns(aiGames),
  };
  fs.writeFileSync(outputFile, JSON.stringify(report, null, 2) + "\n");
  console.log(JSON.stringify({ reference: report.reference.allPlayers, ai: report.ai.allPlayers, aiCompanies: report.ai.byCompany }, null, 2));
}

module.exports = { summarizeCardReturns };
if (require.main === module) main(...process.argv.slice(2));
