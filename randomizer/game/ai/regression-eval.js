(function (root, factory) {
  "use strict";

  const api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.SetiAIRegressionEval = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function () {
  "use strict";

  function numeric(value, fallback = 0) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }

  function buildBenchmarkMetrics(batch = {}) {
    const summary = batch.summary || {};
    const samples = Array.isArray(batch.samples) ? batch.samples : [];
    const gamesRun = Math.max(0, Math.round(numeric(batch.gamesRun, samples.length)));
    const completedGames = Math.max(0, gamesRun - numeric(summary.blockedGames, 0));
    const averageWinnerScore = numeric(summary.averageWinnerScore, 0);
    const completionRate = gamesRun > 0 ? completedGames / gamesRun : 0;
    const averageSteps = samples.length
      ? samples.reduce((total, sample) => total + numeric(sample?.summary?.steps, 0), 0) / samples.length
      : 0;
    const bugCount = samples.reduce((total, sample) => total + Math.max(0, numeric(sample?.bugCount, 0)), 0);

    return {
      gamesRequested: Math.max(0, Math.round(numeric(batch.gamesRequested, gamesRun))),
      gamesRun,
      completedGames,
      blockedGames: Math.max(0, Math.round(numeric(summary.blockedGames, 0))),
      completionRate,
      averageWinnerScore,
      averageSteps,
      bugCount,
      actionCategoryRatios: summary.actionCategoryRatios || {},
      strategyTuning: summary.strategyTuning || null,
    };
  }

  function compareBenchmarkRuns(baselineBatch = {}, tunedBatch = {}) {
    const baseline = buildBenchmarkMetrics(baselineBatch);
    const tuned = buildBenchmarkMetrics(tunedBatch);

    const deltas = {
      completionRate: tuned.completionRate - baseline.completionRate,
      averageWinnerScore: tuned.averageWinnerScore - baseline.averageWinnerScore,
      averageSteps: tuned.averageSteps - baseline.averageSteps,
      bugCount: tuned.bugCount - baseline.bugCount,
      blockedGames: tuned.blockedGames - baseline.blockedGames,
    };

    const improved = (
      deltas.completionRate >= 0
      && deltas.averageWinnerScore >= 0
      && deltas.bugCount <= 0
      && deltas.blockedGames <= 0
    );

    return {
      baseline,
      tuned,
      deltas,
      verdict: {
        improved,
        reason: improved
          ? "tuned run improved or matched completion/score while not increasing bugs"
          : "tuned run regressed in completion, score, or stability",
      },
    };
  }

  function formatBenchmarkReport(comparison = {}) {
    const baseline = comparison.baseline || {};
    const tuned = comparison.tuned || {};
    const deltas = comparison.deltas || {};
    const verdict = comparison.verdict || {};

    return {
      headline: verdict.improved ? "AI benchmark improved" : "AI benchmark regressed",
      verdict,
      metrics: {
        baseline,
        tuned,
        deltas,
      },
    };
  }

  return Object.freeze({
    buildBenchmarkMetrics,
    compareBenchmarkRuns,
    formatBenchmarkReport,
  });
});
