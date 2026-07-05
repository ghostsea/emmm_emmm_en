(function (root, factory) {
  "use strict";

  const api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.SetiAIDataRecorder = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function () {
  "use strict";

  const DEFAULT_LOG_TYPES = Object.freeze([
    "turn-action",
    "play-card",
    "scan-target",
    "land-target",
    "move",
    "move-path",
    "tech-placement",
    "final-score-mark",
    "alien-trace",
    "alien-use",
    "data-placement",
    "move-payment",
  ]);

  const TRAINING_DATASET_SCHEMA_VERSION = 3;

  function numeric(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
  }

  function clone(value) {
    if (value == null) return value;
    if (typeof structuredClone === "function") return structuredClone(value);
    return JSON.parse(JSON.stringify(value));
  }

  function normalizeLogTypes(types) {
    if (!Array.isArray(types) || !types.length) return [...DEFAULT_LOG_TYPES];
    return [...new Set(types.map((type) => String(type || "").trim()).filter(Boolean))];
  }

  function buildPlayerResultIndex(playerResults = []) {
    const sorted = [...(playerResults || [])]
      .sort((left, right) => numeric(right.finalScore) - numeric(left.finalScore));
    const rankByPlayer = {};
    sorted.forEach((entry, index) => {
      const key = entry.playerId || entry.playerLabel || `player-${index + 1}`;
      rankByPlayer[key] = index + 1;
    });
    return rankByPlayer;
  }

  function getPlayerResultEntry(playerResults = [], playerId, playerLabel) {
    const key = playerId || playerLabel || null;
    if (!key) return null;
    return (playerResults || []).find((entry) => (
      entry.playerId === playerId
      || (entry.playerLabel && entry.playerLabel === playerLabel)
    )) || null;
  }

  function getPolicyTarget(entry = {}) {
    const action = entry?.details?.action || null;
    if (!action) return null;
    const target = {
      id: action.id || null,
      kind: action.kind || null,
    };
    if (action.direction != null) target.direction = action.direction;
    if (action.rocketId != null) target.rocketId = action.rocketId;
    if (action.cardId != null) target.cardId = action.cardId;
    if (action.cardInstanceId != null) target.cardInstanceId = action.cardInstanceId;
    if (action.tileId != null) target.tileId = action.tileId;
    if (action.planetId != null) target.planetId = action.planetId;
    return target;
  }

  function toDecisionLevel(entry = {}) {
    return entry?.type === "turn-action" ? "turn" : "subflow";
  }

  function toDecisionType(entry = {}) {
    if (!entry?.type) return null;
    return entry.type === "turn-action" ? "turn-action" : String(entry.type);
  }

  function getPolicyTargetV2(entry = {}, fallbackIndex = 0) {
    const base = getPolicyTarget(entry) || {};
    return {
      ...base,
      actionLevel: toDecisionLevel(entry),
      decisionType: toDecisionType(entry),
      targetKey: `${base.kind || "unknown"}:${base.id || fallbackIndex}`,
    };
  }

  function buildObservationEnvelope(entry = {}, context = {}) {
    return {
      version: 2,
      decisionContext: {
        actionLevel: toDecisionLevel(entry),
        decisionType: toDecisionType(entry),
        pendingState: clone(entry?.details?.pendingState || context?.pendingState || null),
        pendingScanTargetType: entry?.details?.pendingScanTargetType
          || entry?.details?.pendingState?.pendingScanTargetType
          || context?.pendingState?.pendingScanTargetType
          || null,
      },
      observation: clone(entry?.details?.observation || null),
      legalActions: Array.isArray(entry?.details?.candidates) ? clone(entry.details.candidates) : null,
    };
  }

  function buildTrainingSample(entry, context = {}) {
    const playerResult = getPlayerResultEntry(context.playerResults, entry.playerId, entry.playerLabel);
    const playerKey = entry.playerId || entry.playerLabel || "unknown";
    const policyTarget = getPolicyTarget(entry);
    const policyTargetV2 = getPolicyTargetV2(entry, context.stepIndex);
    return {
      schemaVersion: TRAINING_DATASET_SCHEMA_VERSION,
      sampleId: `${context.seed || "seed"}:${context.stepIndex}`,
      seed: context.seed || null,
      stepIndex: context.stepIndex,
      logType: entry.type || "unknown",
      actionLevel: policyTargetV2.actionLevel,
      decisionType: policyTargetV2.decisionType,
      roundNumber: numeric(entry.roundNumber),
      turnNumber: numeric(entry.turnNumber),
      playerId: entry.playerId || null,
      playerLabel: entry.playerLabel || null,
      playerKey,
      policyTarget,
      policyTargetV2,
      candidates: Array.isArray(entry?.details?.candidates) ? clone(entry.details.candidates) : null,
      details: clone(entry?.details || null),
      observationEnvelope: buildObservationEnvelope(entry, {
        pendingState: context?.lastSummary?.pendingState || null,
      }),
      finalScore: numeric(playerResult?.finalScore),
      finalRank: numeric(context.rankByPlayer[playerKey]),
      gameEnded: Boolean(context.lastSummary?.gameEnded),
      blocked: Boolean(context.lastSummary?.blocked),
      ok: context.lastSummary?.ok !== false,
    };
  }

  function buildTrainingDataset(report = {}, options = {}) {
    const logTypes = new Set(normalizeLogTypes(options.logTypes));
    const logs = Array.isArray(report.logs) ? report.logs : [];
    const playerResults = Array.isArray(report.playerResults) ? report.playerResults : [];
    const rankByPlayer = buildPlayerResultIndex(playerResults);
    const seed = report?.lastSummary?.seed ?? options.seed ?? null;

    const samples = [];
    for (let index = 0; index < logs.length; index += 1) {
      const entry = logs[index];
      if (!logTypes.has(entry?.type)) continue;
      samples.push(buildTrainingSample(entry, {
        seed,
        stepIndex: index + 1,
        playerResults,
        rankByPlayer,
        lastSummary: report?.lastSummary || null,
      }));
    }

    return {
      version: TRAINING_DATASET_SCHEMA_VERSION,
      seed,
      generatedAt: options.generatedAt || new Date().toISOString(),
      lastSummary: clone(report?.lastSummary || null),
      playerResults: clone(playerResults),
      sampleCount: samples.length,
      samples,
    };
  }

  function stringifyTrainingDatasetJsonl(dataset = {}) {
    return (dataset.samples || [])
      .map((sample) => JSON.stringify(sample))
      .join("\n");
  }

  function summarizeTrainingDataset(dataset = {}) {
    const byType = {};
    const byPlayer = {};
    for (const sample of dataset.samples || []) {
      byType[sample.logType] = (byType[sample.logType] || 0) + 1;
      const key = sample.playerId || sample.playerLabel || "unknown";
      byPlayer[key] = (byPlayer[key] || 0) + 1;
    }
    return {
      version: dataset.version || 1,
      seed: dataset.seed || null,
      sampleCount: numeric(dataset.sampleCount || (dataset.samples || []).length),
      byType,
      byPlayer,
      gameEnded: Boolean(dataset.lastSummary?.gameEnded),
      blocked: Boolean(dataset.lastSummary?.blocked),
      ok: dataset.lastSummary?.ok !== false,
    };
  }

  return Object.freeze({
    DEFAULT_LOG_TYPES,
    buildTrainingDataset,
    stringifyTrainingDatasetJsonl,
    summarizeTrainingDataset,
  });
});
