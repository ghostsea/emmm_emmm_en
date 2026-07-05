#!/usr/bin/env node
"use strict";

const assert = require("assert");
const path = require("path");
const cudaLibraryPath = require("./cuda-library-path");

cudaLibraryPath.ensureCudaLibraryPathAtProcessStart(__filename, process.argv.slice(2));

const behaviorCloning = require("../randomizer/game/ai/behavior-cloning");

function getExecutionProviders() {
  const providers = String(process.env.SETI_ONNX_EXECUTION_PROVIDERS || "cpu")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
  return providers.length ? providers : ["cpu"];
}

async function main() {
  const modelPath = path.resolve(process.argv[2] || "tools/_tmp_entity_model.json");
  // eslint-disable-next-line import/no-dynamic-require, global-require
  const model = require(modelPath);

  assert.equal(model.modelType, "pytorch-entity-transformer-v1", "Expected entity-transformer modelType");

  const actionVocab = Array.isArray(model?.vocab?.actionVocab) ? model.vocab.actionVocab : [];
  const fallbackCandidates = ["launch", "scan", "pass"];
  const candidateIds = fallbackCandidates.filter((id) => actionVocab.includes(id));
  while (candidateIds.length < 3 && actionVocab[candidateIds.length]) {
    if (!candidateIds.includes(actionVocab[candidateIds.length])) {
      candidateIds.push(actionVocab[candidateIds.length]);
    }
  }
  assert.ok(candidateIds.length >= 2, "Expected at least 2 candidate actions from model vocab");

  const candidates = candidateIds.map((id, idx) => ({
    id,
    kind: "main",
    available: true,
    score: Math.max(0, 4 - idx),
    net: Math.max(0, 2 - idx),
  }));

  const observation = {
    observationVersion: 3,
    compactEntities: [
      {
        type: "GLOBAL",
        ownerId: "NONE",
        zone: "global",
        slotId: "global",
        numeric: { roundNumber: 1, turnNumber: 1, candidateCount: 3 },
        flags: { hasPendingState: false },
        position: { ring: 0, sector: 0 },
      },
      {
        type: "PLAYER",
        ownerId: "player-white",
        zone: "players",
        slotId: "seat-0",
        numeric: { seat: 0, score: 12, credits: 3, energy: 2, publicity: 1, availableData: 0, handSize: 4 },
        flags: { isCurrentPlayer: true, passed: false, role: "self" },
        position: { ring: 0, sector: 0 },
      },
      {
        type: "PLAYER",
        ownerId: "player-blue",
        zone: "players",
        slotId: "seat-1",
        numeric: { seat: 1, score: 10, credits: 2, energy: 1, publicity: 1, availableData: 1, handSize: 3 },
        flags: { isCurrentPlayer: false, passed: false, role: "next" },
        position: { ring: 0, sector: 0 },
      },
      {
        type: "ROCKET",
        ownerId: "player-white",
        zone: "solar",
        slotId: "rocket-1",
        numeric: { ring: 1, sector: 2, orbitingPlanetId: -1, movePoints: 1 },
        flags: { launched: true, orbiting: false, landed: false },
        position: { ring: 1, sector: 2 },
      },
    ],
  };

  const result = await behaviorCloning.evaluateBehaviorCloneHeadsAsync(
    model,
    candidates,
    {
      roundNumber: 1,
      turnNumber: 1,
      observation,
    },
    {
      onnxPath: path.resolve("tools/_tmp_entity_model.onnx"),
      executionProviders: getExecutionProviders(),
    },
  );

  assert.ok(result, "Expected non-null entity ONNX inference result");
  assert.ok(result.actionId, "Expected predicted action id");
  assert.ok(Number.isFinite(Number(result.value)), "Expected finite value output");
  assert.ok(Number.isFinite(Number(result.normalizedValue)), "Expected finite normalized value");
  assert.ok(result.probabilityByActionId && typeof result.probabilityByActionId === "object", "Expected probabilityByActionId object");
  assert.ok(Object.keys(result.probabilityByActionId).length > 0, "Expected non-empty probability map");

  const selectedProb = Number(result.probabilityByActionId[result.actionId] || 0);
  assert.ok(selectedProb >= 0 && selectedProb <= 1, "Predicted action probability must be in [0, 1]");

  console.log(JSON.stringify({
    ok: true,
    actionId: result.actionId,
    normalizedValue: result.normalizedValue,
    source: result.source || null,
    probabilityByActionId: result.probabilityByActionId,
  }, null, 2));
}

main().catch((error) => {
  console.error("smoke_entity_onnx_inference failed:", error && error.stack ? error.stack : error);
  process.exit(1);
});
