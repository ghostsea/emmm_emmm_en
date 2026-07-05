(function (root, factory) {
  "use strict";

  let seed = root.SetiAISeed;
  let mcts = root.SetiAIMcts;
  let dataRecorder = root.SetiAIDataRecorder;

  if ((!seed || !mcts || !dataRecorder) && typeof require === "function") {
    seed = seed || require("./seed");
    mcts = mcts || require("./mcts");
    dataRecorder = dataRecorder || require("./data-recorder");
  }

  const api = factory(seed, mcts, dataRecorder);

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.SetiAISelfPlay = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function (seedModule, mctsModule, dataRecorderModule) {
  "use strict";

  function numeric(value, fallback = 0) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }

  function clone(value) {
    if (value == null) return value;
    if (typeof structuredClone === "function") return structuredClone(value);
    return JSON.parse(JSON.stringify(value));
  }

  function createEpisodeSeed(baseSeed, episodeIndex) {
    return `${seedModule.normalizeSeedInput(baseSeed)}:episode-${episodeIndex + 1}`;
  }

  function buildEpisodeSummary(report = {}) {
    const winner = Array.isArray(report.playerResults)
      ? [...report.playerResults].sort((left, right) => numeric(right.finalScore, 0) - numeric(left.finalScore, 0))[0] || null
      : null;
    return {
      seed: report.lastSummary?.seed || null,
      stepCount: numeric(report.lastSummary?.steps, 0),
      ok: report.lastSummary?.ok !== false,
      blocked: Boolean(report.lastSummary?.blocked),
      gameEnded: Boolean(report.lastSummary?.gameEnded),
      winnerId: winner?.playerId || null,
      winnerScore: numeric(winner?.finalScore, 0),
      sampleCount: numeric(report.trainingDataset?.sampleCount, 0),
    };
  }

  function summarizeSelfPlayBatch(episodes = []) {
    const summary = {
      episodeCount: episodes.length,
      completedCount: 0,
      blockedCount: 0,
      averageSteps: 0,
      averageWinnerScore: 0,
      totalSamples: 0,
      winnerCounts: {},
    };

    if (!episodes.length) return summary;

    let totalSteps = 0;
    let totalWinnerScore = 0;
    let winnerScoreCount = 0;

    for (const episode of episodes) {
      if (episode.ok && episode.gameEnded) summary.completedCount += 1;
      if (episode.blocked) summary.blockedCount += 1;
      totalSteps += numeric(episode.stepCount, 0);
      summary.totalSamples += numeric(episode.sampleCount, 0);
      if (episode.winnerId) {
        summary.winnerCounts[episode.winnerId] = (summary.winnerCounts[episode.winnerId] || 0) + 1;
      }
      if (Number.isFinite(Number(episode.winnerScore))) {
        totalWinnerScore += numeric(episode.winnerScore, 0);
        winnerScoreCount += 1;
      }
    }

    summary.averageSteps = totalSteps / episodes.length;
    summary.averageWinnerScore = winnerScoreCount > 0 ? totalWinnerScore / winnerScoreCount : 0;
    return summary;
  }

  function runSelfPlayBatch(adapter = {}, options = {}) {
    const episodeCount = Math.max(1, Math.round(numeric(options.episodeCount, 8)));
    const baseSeed = seedModule.normalizeSeedInput(options.seed || "seti-self-play");
    const episodes = [];

    for (let index = 0; index < episodeCount; index += 1) {
      const episodeSeed = createEpisodeSeed(baseSeed, index);
      const planner = mctsModule.createMctsPlanner({
        seed: episodeSeed,
        simulations: options.simulations,
        maxDepth: options.maxDepth,
        cpuct: options.cpuct,
        rolloutDepth: options.rolloutDepth,
      });

      const report = typeof adapter.runEpisode === "function"
        ? adapter.runEpisode({
          seed: episodeSeed,
          planner,
          episodeIndex: index,
          options,
        })
        : {
          lastSummary: {
            seed: episodeSeed,
            steps: 0,
            ok: false,
            blocked: true,
            gameEnded: false,
            message: "self-play adapter missing runEpisode",
          },
          logs: [],
          playerResults: [],
        };

      const trainingDataset = dataRecorderModule.buildTrainingDataset(report, {
        seed: episodeSeed,
        generatedAt: options.generatedAt,
      });
      const summary = buildEpisodeSummary({
        ...report,
        trainingDataset,
      });

      episodes.push({
        ...summary,
        report: options.includeReports ? clone(report) : undefined,
        trainingDataset: options.includeDatasets ? trainingDataset : undefined,
      });
    }

    return {
      version: 1,
      seed: baseSeed,
      episodeCount,
      episodes,
      summary: summarizeSelfPlayBatch(episodes),
    };
  }

  return Object.freeze({
    createEpisodeSeed,
    summarizeSelfPlayBatch,
    runSelfPlayBatch,
  });
});
