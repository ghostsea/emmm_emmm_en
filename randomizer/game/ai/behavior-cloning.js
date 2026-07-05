(function (root, factory) {
  "use strict";

  const api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.SetiAIBehaviorCloning = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function () {
  "use strict";

  let nodePath = null;
  let nodeFs = null;
  let nodeHttp = null;
  let nodeHttps = null;
  let nodeOrt = null;
  if (typeof require === "function") {
    try {
      nodePath = require("path");
    } catch (_error) {
      nodePath = null;
    }
    try {
      nodeFs = require("fs");
    } catch (_error) {
      nodeFs = null;
    }
    try {
      nodeHttp = require("http");
    } catch (_error) {
      nodeHttp = null;
    }
    try {
      nodeHttps = require("https");
    } catch (_error) {
      nodeHttps = null;
    }
    try {
      nodeOrt = require("onnxruntime-node");
    } catch (_error) {
      nodeOrt = null;
    }
  }

  const onnxSessionCache = new Map();

  function numeric(value, fallback = 0) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }

  function hashText(input = "") {
    const text = String(input);
    let hash = 2166136261;
    for (let index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function stableStringify(value) {
    if (value == null || typeof value !== "object") return JSON.stringify(value);
    if (Array.isArray(value)) return `[${value.map((entry) => stableStringify(entry)).join(",")}]`;
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(",")}}`;
  }

  function createEntityModelDescriptor(model = {}) {
    return {
      modelType: model.modelType || null,
      roundBucketSize: model.roundBucketSize || null,
      roundBucketCount: model.roundBucketCount || null,
      vocab: model.vocab || null,
      network: model.network || null,
      onnx: model.onnx || null,
      actionVocab: model.actionVocab || null,
    };
  }

  function createEntityModelKey(model = {}) {
    return String(hashText(stableStringify(createEntityModelDescriptor(model))));
  }

  function getEntityModelServerUrl(options = {}) {
    if (options.disableModelServer) return "";
    const runtimeUrl = String(
      options.modelServerUrl
      || (typeof process !== "undefined" ? process.env.SETI_ENTITY_MODEL_SERVER_URL : "")
      || (typeof globalThis !== "undefined" ? globalThis.SETI_ENTITY_MODEL_SERVER_URL : "")
      || "",
    ).trim();
    if (typeof process !== "undefined" && String(process.env.SETI_ENTITY_MODEL_SERVER_DISABLE_CLIENT || "") === "1") return "";
    return runtimeUrl;
  }

  function postJson(urlText = "", payload = {}, options = {}) {
    return new Promise((resolve, reject) => {
      if (!urlText) {
        reject(new Error("Model server client is unavailable"));
        return;
      }
      if (!nodeHttp && !nodeHttps) {
        if (typeof fetch === "function") {
          let targetUrl = urlText;
          try {
            const parsed = new URL(urlText);
            parsed.pathname = `${parsed.pathname.replace(/\/$/, "")}${options.path || "/infer"}`;
            targetUrl = parsed.toString();
          } catch (_error) {
            targetUrl = `${String(urlText).replace(/\/$/, "")}${options.path || "/infer"}`;
          }
          fetch(targetUrl, {
            method: "POST",
            headers: {
              "content-type": "application/json",
            },
            body: JSON.stringify(payload || {}),
          }).then(async (response) => {
            const data = await response.json().catch(() => null);
            if (!response.ok || data?.ok === false) {
              throw new Error(data?.error || `Model server request failed with status ${response.status}`);
            }
            resolve(data);
          }).catch(reject);
          return;
        }
        reject(new Error("Model server client is unavailable"));
        return;
      }
      let parsed;
      try {
        parsed = new URL(urlText);
      } catch (error) {
        reject(error);
        return;
      }
      const body = JSON.stringify(payload || {});
      const transport = parsed.protocol === "https:" ? nodeHttps : nodeHttp;
      const request = transport.request({
        hostname: parsed.hostname,
        port: parsed.port,
        path: `${parsed.pathname.replace(/\/$/, "")}${options.path || "/infer"}`,
        method: "POST",
        headers: {
          "content-type": "application/json",
          "content-length": Buffer.byteLength(body),
        },
        timeout: Math.max(1000, Math.round(numeric(options.timeoutMs, 60000))),
      }, (response) => {
        const chunks = [];
        response.on("data", (chunk) => chunks.push(chunk));
        response.on("end", () => {
          const text = Buffer.concat(chunks).toString("utf8");
          let data = null;
          try {
            data = text ? JSON.parse(text) : null;
          } catch (error) {
            reject(error);
            return;
          }
          if (response.statusCode < 200 || response.statusCode >= 300 || data?.ok === false) {
            reject(new Error(data?.error || `Model server request failed with status ${response.statusCode}`));
            return;
          }
          resolve(data);
        });
      });
      request.on("timeout", () => {
        request.destroy(new Error("Model server request timed out"));
      });
      request.on("error", reject);
      request.write(body);
      request.end();
    });
  }

  async function evaluateEntityTransformerViaServer(model = {}, candidates = [], context = {}, options = {}) {
    const serverUrl = getEntityModelServerUrl(options);
    if (!serverUrl) return null;
    const response = await postJson(serverUrl, {
      modelKey: createEntityModelKey(model),
      model: createEntityModelDescriptor(model),
      candidates,
      context,
      options: {
        ...options,
        disableModelServer: true,
      },
    }, {
      path: "/infer",
      timeoutMs: options.modelServerTimeoutMs || 120000,
    });
    return response?.result || null;
  }

  function normalizeCandidateIds(candidates = []) {
    const ids = [];
    for (const candidate of candidates || []) {
      if (!candidate || candidate.available === false) continue;
      const id = String(candidate.id || candidate.actionId || "").trim();
      if (!id) continue;
      ids.push(id);
    }
    ids.sort();
    return ids;
  }

  function buildContextKey(entry = {}, options = {}) {
    const candidateIds = normalizeCandidateIds(entry.candidates || []);
    const roundBucketSize = Math.max(1, Math.round(numeric(options.roundBucketSize, 2)));
    const roundNumber = Math.max(0, Math.round(numeric(entry.roundNumber, 0)));
    const roundBucket = Math.floor(roundNumber / roundBucketSize);
    return `${roundBucket}|${candidateIds.join(",")}`;
  }

  function extractBehaviorCloneRecords(samples = [], options = {}) {
    const records = [];
    for (let index = 0; index < (samples || []).length; index += 1) {
      const sample = samples[index] || {};
      const targetActionId = sample.policyTargetV2?.id
        ? String(sample.policyTargetV2.id)
        : sample.policyTarget?.id
          ? String(sample.policyTarget.id)
          : "";
      const actionLevel = String(sample.actionLevel || sample.policyTargetV2?.actionLevel || "turn");
      if (actionLevel !== "turn") continue;
      if (sample.logType !== "turn-action" || !targetActionId) continue;
      const candidateIds = normalizeCandidateIds(sample.candidates || []);
      if (!candidateIds.length || !candidateIds.includes(targetActionId)) continue;
      records.push({
        recordId: sample.sampleId || `record-${index + 1}`,
        targetActionId,
        candidateIds,
        contextKey: buildContextKey({ ...sample, candidates: sample.candidates || [] }, options),
        roundNumber: Math.max(0, Math.round(numeric(sample.roundNumber, 0))),
        turnNumber: Math.max(0, Math.round(numeric(sample.turnNumber, 0))),
      });
    }
    return records;
  }

  function pickBestAction(counts = {}, candidates = []) {
    let bestAction = null;
    let bestScore = -Infinity;
    const sortedCandidates = [...candidates].sort();
    for (const actionId of sortedCandidates) {
      const score = numeric(counts[actionId], 0);
      if (score > bestScore) {
        bestScore = score;
        bestAction = actionId;
      }
    }
    return bestAction;
  }

  function buildPyTorchFeatureContext(model = {}, candidates = [], context = {}, options = {}) {
    const actionVocab = Array.isArray(model.actionVocab) ? model.actionVocab : [];
    const candidateVocab = Array.isArray(model.candidateVocab) ? model.candidateVocab : [];
    const actionIndexById = Object.create(null);
    const candidateIndexById = Object.create(null);
    for (let i = 0; i < actionVocab.length; i += 1) actionIndexById[actionVocab[i]] = i;
    for (let i = 0; i < candidateVocab.length; i += 1) candidateIndexById[candidateVocab[i]] = i;

    const roundBucketSize = Math.max(1, Math.round(numeric(options.roundBucketSize ?? model.roundBucketSize, 2)));
    const roundNumber = Math.max(0, Math.round(numeric(context.roundNumber, 0)));
    const maxBucket = Math.max(0, Math.round(numeric(model.roundBucketCount, 1)) - 1);
    const roundBucket = Math.min(maxBucket, Math.floor(roundNumber / roundBucketSize));

    const candidateIds = normalizeCandidateIds(candidates);
    const allowedActionIndexes = [];
    const candidateFeatureIndexes = [];
    for (const candidateId of candidateIds) {
      if (actionIndexById[candidateId] !== undefined) allowedActionIndexes.push(actionIndexById[candidateId]);
      if (candidateIndexById[candidateId] !== undefined) candidateFeatureIndexes.push(candidateIndexById[candidateId]);
    }

    return {
      actionVocab,
      allowedActionIndexes,
      candidateFeatureIndexes,
      roundBucket,
    };
  }

  function predictPyTorchLinearAction(model = {}, candidates = [], context = {}, options = {}) {
    const weights = model.weights || {};
    const actionBias = Array.isArray(weights.actionBias) ? weights.actionBias : [];
    const roundWeights = Array.isArray(weights.roundWeights) ? weights.roundWeights : [];
    const candidateWeights = Array.isArray(weights.candidateWeights) ? weights.candidateWeights : [];
    const featureCtx = buildPyTorchFeatureContext(model, candidates, context, options);
    if (!featureCtx.allowedActionIndexes.length || !featureCtx.actionVocab.length || !actionBias.length) return null;

    let bestIndex = -1;
    let bestScore = -Infinity;
    const allowedSet = new Set(featureCtx.allowedActionIndexes);
    for (let actionIndex = 0; actionIndex < featureCtx.actionVocab.length; actionIndex += 1) {
      if (!allowedSet.has(actionIndex)) continue;
      let score = numeric(actionBias[actionIndex], 0);
      const roundRow = roundWeights[actionIndex] || [];
      score += numeric(roundRow[featureCtx.roundBucket], 0);
      const candidateRow = candidateWeights[actionIndex] || [];
      for (const candidateIndex of featureCtx.candidateFeatureIndexes) {
        score += numeric(candidateRow[candidateIndex], 0);
      }
      if (score > bestScore) {
        bestScore = score;
        bestIndex = actionIndex;
      }
    }
    if (bestIndex < 0) return null;
    return String(featureCtx.actionVocab[bestIndex] || "") || null;
  }

  function layerNorm(vector = [], gamma = [], beta = [], epsilon = 1e-5) {
    if (!vector.length) return [];
    const mean = vector.reduce((sum, value) => sum + value, 0) / vector.length;
    let variance = 0;
    for (let index = 0; index < vector.length; index += 1) {
      const delta = vector[index] - mean;
      variance += delta * delta;
    }
    variance /= vector.length;
    const inv = 1 / Math.sqrt(variance + epsilon);
    const out = new Array(vector.length);
    for (let index = 0; index < vector.length; index += 1) {
      const scale = numeric(gamma[index], 1);
      const shift = numeric(beta[index], 0);
      out[index] = ((vector[index] - mean) * inv * scale) + shift;
    }
    return out;
  }

  function reluVec(vector = []) {
    return vector.map((value) => (value > 0 ? value : 0));
  }

  function linearVec(matrix = [], bias = [], input = []) {
    const out = new Array(matrix.length);
    for (let rowIndex = 0; rowIndex < matrix.length; rowIndex += 1) {
      const row = matrix[rowIndex] || [];
      let sum = numeric(bias[rowIndex], 0);
      const size = Math.min(row.length, input.length);
      for (let colIndex = 0; colIndex < size; colIndex += 1) {
        sum += numeric(row[colIndex], 0) * numeric(input[colIndex], 0);
      }
      out[rowIndex] = sum;
    }
    return out;
  }

  function softmaxAllowed(logits = [], allowedIndexes = [], temperature = 1) {
    const tau = Math.max(1e-3, numeric(temperature, 1));
    const probs = new Array(logits.length).fill(0);
    if (!Array.isArray(allowedIndexes) || !allowedIndexes.length) return probs;
    let maxLogit = -Infinity;
    for (const index of allowedIndexes) {
      maxLogit = Math.max(maxLogit, numeric(logits[index], -Infinity));
    }
    if (!Number.isFinite(maxLogit)) {
      const uniform = 1 / allowedIndexes.length;
      for (const index of allowedIndexes) probs[index] = uniform;
      return probs;
    }
    const expByIndex = new Map();
    let total = 0;
    for (const index of allowedIndexes) {
      const shifted = (numeric(logits[index], -Infinity) - maxLogit) / tau;
      const value = Number.isFinite(shifted) ? Math.exp(Math.max(-60, Math.min(60, shifted))) : 0;
      expByIndex.set(index, value);
      total += value;
    }
    if (total <= 0) {
      const uniform = 1 / allowedIndexes.length;
      for (const index of allowedIndexes) probs[index] = uniform;
      return probs;
    }
    for (const index of allowedIndexes) {
      probs[index] = numeric(expByIndex.get(index), 0) / total;
    }
    return probs;
  }

  function buildHeadEvalResult(featureCtx = {}, logits = [], value = 0, options = {}) {
    const allowedActionIndexes = Array.isArray(featureCtx.allowedActionIndexes) ? featureCtx.allowedActionIndexes : [];
    const probabilities = softmaxAllowed(logits, allowedActionIndexes, options.temperature ?? 1);
    const probabilityByActionId = {};
    for (let index = 0; index < probabilities.length; index += 1) {
      const actionId = String(featureCtx.actionVocab?.[index] || "").trim();
      if (!actionId) continue;
      probabilityByActionId[actionId] = numeric(probabilities[index], 0);
    }

    let bestIndex = -1;
    let bestScore = -Infinity;
    for (const index of allowedActionIndexes) {
      const score = numeric(logits[index], -Infinity);
      if (score > bestScore) {
        bestScore = score;
        bestIndex = index;
      }
    }

    const actionId = bestIndex >= 0 ? String(featureCtx.actionVocab?.[bestIndex] || "") || null : null;
    const rawValue = numeric(value, 0);
    const normalizedValue = Math.max(-1, Math.min(1, rawValue));
    return {
      actionId,
      logits,
      probabilities,
      probabilityByActionId,
      value: rawValue,
      normalizedValue,
    };
  }

  function normalizeCompactEntities(observation = {}, maxEntities = 192) {
    const entities = Array.isArray(observation?.compactEntities) ? observation.compactEntities : [];
    return entities.slice(0, Math.max(1, Math.round(numeric(maxEntities, 192))));
  }

  function buildEntityFeatureContext(model = {}, candidates = [], context = {}, options = {}) {
    const actionVocab = Array.isArray(model?.vocab?.actionVocab)
      ? model.vocab.actionVocab
      : (Array.isArray(model?.actionVocab) ? model.actionVocab : []);
    const actionIndexById = Object.create(null);
    for (let i = 0; i < actionVocab.length; i += 1) actionIndexById[actionVocab[i]] = i;

    const maxCandidateActions = Math.max(1, Math.round(numeric(model?.network?.maxCandidateActions, options.maxCandidateActions || 40)));
    const candidateIds = normalizeCandidateIds(candidates).slice(0, maxCandidateActions);
    const allowedActionIndexes = [];
    for (const actionId of candidateIds) {
      if (actionIndexById[actionId] !== undefined) {
        allowedActionIndexes.push(actionIndexById[actionId]);
      } else {
        allowedActionIndexes.push(0);
      }
    }

    const observation = context?.observation || null;
    const entities = normalizeCompactEntities(observation, model?.network?.maxStateEntities || options.maxStateEntities || 192);

    return {
      actionVocab,
      candidateIds,
      allowedActionIndexes,
      entities,
      maxStateEntities: Math.max(1, Math.round(numeric(model?.network?.maxStateEntities, options.maxStateEntities || 192))),
      maxCandidateActions,
      numericDim: Math.max(1, Math.round(numeric(model?.network?.numericDim, 10))),
      entityTypeVocab: Array.isArray(model?.vocab?.entityTypeVocab) ? model.vocab.entityTypeVocab : [],
      ownerVocab: Array.isArray(model?.vocab?.ownerVocab) ? model.vocab.ownerVocab : [],
      zoneVocab: Array.isArray(model?.vocab?.zoneVocab) ? model.vocab.zoneVocab : [],
      slotVocab: Array.isArray(model?.vocab?.slotVocab) ? model.vocab.slotVocab : [],
    };
  }

  function buildEntityIndexMaps(featureCtx = {}) {
    const entityTypeIndexById = Object.create(null);
    const ownerIndexById = Object.create(null);
    const zoneIndexById = Object.create(null);
    const slotIndexById = Object.create(null);
    for (let i = 0; i < featureCtx.entityTypeVocab.length; i += 1) entityTypeIndexById[featureCtx.entityTypeVocab[i]] = i;
    for (let i = 0; i < featureCtx.ownerVocab.length; i += 1) ownerIndexById[featureCtx.ownerVocab[i]] = i;
    for (let i = 0; i < featureCtx.zoneVocab.length; i += 1) zoneIndexById[featureCtx.zoneVocab[i]] = i;
    for (let i = 0; i < featureCtx.slotVocab.length; i += 1) slotIndexById[featureCtx.slotVocab[i]] = i;
    return {
      entityTypeIndexById,
      ownerIndexById,
      zoneIndexById,
      slotIndexById,
    };
  }

  function fillEntityInputTensors(featureCtx = {}, tensors = {}, offsets = {}, indexMaps = null) {
    const maps = indexMaps || buildEntityIndexMaps(featureCtx);
    const maxStateEntities = featureCtx.maxStateEntities;
    const maxCandidateActions = featureCtx.maxCandidateActions;
    const numericDim = featureCtx.numericDim;
    const entityOffset = Math.max(0, Math.round(numeric(offsets.entityOffset, 0)));
    const numericOffset = Math.max(0, Math.round(numeric(offsets.numericOffset, 0)));
    const candidateOffset = Math.max(0, Math.round(numeric(offsets.candidateOffset, 0)));

    const {
      entityTypeIds,
      ownerIds,
      zoneIds,
      slotIds,
      numericFeatures,
      entityMask,
      candidateActionIndexes,
      candidateMask,
    } = tensors;

    for (let i = 0; i < Math.min(maxStateEntities, featureCtx.entities.length); i += 1) {
      const entity = featureCtx.entities[i] || {};
      const typeId = String(entity.type || "UNKNOWN").toUpperCase();
      const ownerId = String(entity.ownerId || "NONE");
      const zoneId = String(entity.zone || "global").toLowerCase();
      const slotId = String(entity.slotId || "none");
      const entityCursor = entityOffset + i;
      entityTypeIds[entityCursor] = BigInt(maps.entityTypeIndexById[typeId] ?? 0);
      ownerIds[entityCursor] = BigInt(maps.ownerIndexById[ownerId] ?? 0);
      zoneIds[entityCursor] = BigInt(maps.zoneIndexById[zoneId] ?? 0);
      slotIds[entityCursor] = BigInt(maps.slotIndexById[slotId] ?? 0);
      entityMask[entityCursor] = 1;

      const numericObj = entity && typeof entity.numeric === "object" && entity.numeric !== null ? entity.numeric : {};
      const flagObj = entity && typeof entity.flags === "object" && entity.flags !== null ? entity.flags : {};
      const posObj = entity && typeof entity.position === "object" && entity.position !== null ? entity.position : {};

      const numericKeys = Object.keys(numericObj).sort();
      const flagKeys = Object.keys(flagObj).sort();
      let cursor = numericOffset + (i * numericDim);
      for (let j = 0; j < numericKeys.length && j < numericDim; j += 1) {
        numericFeatures[cursor + j] = numeric(numericObj[numericKeys[j]], 0);
      }
      const flagStart = Math.min(numericDim, numericKeys.length);
      for (let j = 0; j < flagKeys.length && (flagStart + j) < numericDim; j += 1) {
        const v = flagObj[flagKeys[j]];
        numericFeatures[cursor + flagStart + j] = (typeof v === "string")
          ? ((v.toLowerCase() === "true" || v.toLowerCase() === "self" || v.toLowerCase() === "next") ? 1 : 0)
          : (v ? 1 : 0);
      }
      if (numericDim >= 2) {
        numericFeatures[cursor + numericDim - 2] = numeric(posObj.ring, 0);
        numericFeatures[cursor + numericDim - 1] = numeric(posObj.sector, 0);
      }
    }

    for (let i = 0; i < Math.min(maxCandidateActions, featureCtx.allowedActionIndexes.length); i += 1) {
      candidateActionIndexes[candidateOffset + i] = BigInt(featureCtx.allowedActionIndexes[i]);
      candidateMask[candidateOffset + i] = 1;
    }
  }

  function buildEntityInputTensors(featureCtx = {}) {
    const maxStateEntities = featureCtx.maxStateEntities;
    const maxCandidateActions = featureCtx.maxCandidateActions;
    const numericDim = featureCtx.numericDim;
    const indexMaps = buildEntityIndexMaps(featureCtx);

    const entityTypeIds = new BigInt64Array(maxStateEntities);
    const ownerIds = new BigInt64Array(maxStateEntities);
    const zoneIds = new BigInt64Array(maxStateEntities);
    const slotIds = new BigInt64Array(maxStateEntities);
    const numericFeatures = new Float32Array(maxStateEntities * numericDim);
    const entityMask = new Float32Array(maxStateEntities);

    const candidateActionIndexes = new BigInt64Array(maxCandidateActions);
    const candidateMask = new Float32Array(maxCandidateActions);

    fillEntityInputTensors(featureCtx, {
      entityTypeIds,
      ownerIds,
      zoneIds,
      slotIds,
      numericFeatures,
      entityMask,
      candidateActionIndexes,
      candidateMask,
    }, {}, indexMaps);

    return {
      entityTypeIds,
      ownerIds,
      zoneIds,
      slotIds,
      numericFeatures,
      entityMask,
      candidateActionIndexes,
      candidateMask,
    };
  }

  async function evaluateEntityTransformerOnnx(model = {}, candidates = [], context = {}, options = {}) {
    const serverUrl = getEntityModelServerUrl(options);
    if (serverUrl) {
      const serverResult = await evaluateEntityTransformerViaServer(model, candidates, context, options);
      if (serverResult) return serverResult;
      throw new Error("Entity transformer model server returned no result");
    }

    const session = await getOrCreateOnnxSession(model, options);
    if (!session || !nodeOrt?.Tensor) return null;

    const featureCtx = buildEntityFeatureContext(model, candidates, context, options);
    if (!featureCtx.candidateIds.length || !featureCtx.actionVocab.length) return null;

    const tensors = buildEntityInputTensors(featureCtx);
    const inputNames = model?.onnx?.inputNames || [
      "entity_type_ids",
      "owner_ids",
      "zone_ids",
      "slot_ids",
      "numeric_features",
      "entity_mask",
      "candidate_action_indexes",
      "candidate_mask",
    ];

    const feeds = {
      [inputNames[0] || "entity_type_ids"]: new nodeOrt.Tensor("int64", tensors.entityTypeIds, [1, featureCtx.maxStateEntities]),
      [inputNames[1] || "owner_ids"]: new nodeOrt.Tensor("int64", tensors.ownerIds, [1, featureCtx.maxStateEntities]),
      [inputNames[2] || "zone_ids"]: new nodeOrt.Tensor("int64", tensors.zoneIds, [1, featureCtx.maxStateEntities]),
      [inputNames[3] || "slot_ids"]: new nodeOrt.Tensor("int64", tensors.slotIds, [1, featureCtx.maxStateEntities]),
      [inputNames[4] || "numeric_features"]: new nodeOrt.Tensor("float32", tensors.numericFeatures, [1, featureCtx.maxStateEntities, featureCtx.numericDim]),
      [inputNames[5] || "entity_mask"]: new nodeOrt.Tensor("float32", tensors.entityMask, [1, featureCtx.maxStateEntities]),
      [inputNames[6] || "candidate_action_indexes"]: new nodeOrt.Tensor("int64", tensors.candidateActionIndexes, [1, featureCtx.maxCandidateActions]),
      [inputNames[7] || "candidate_mask"]: new nodeOrt.Tensor("float32", tensors.candidateMask, [1, featureCtx.maxCandidateActions]),
    };

    const outputs = await session.run(feeds);
    const policyTensor = outputs?.policy_logits;
    const valueTensor = outputs?.value;
    if (!policyTensor?.data || !policyTensor.data.length) return null;

    const logits = Array.from(policyTensor.data).map((value) => numeric(value, 0));
    const allowedCandidateIndexes = [];
    for (let i = 0; i < featureCtx.candidateIds.length; i += 1) allowedCandidateIndexes.push(i);

    let bestCandidateIndex = -1;
    let bestScore = -Infinity;
    for (const idx of allowedCandidateIndexes) {
      const score = numeric(logits[idx], -Infinity);
      if (score > bestScore) {
        bestScore = score;
        bestCandidateIndex = idx;
      }
    }
    if (bestCandidateIndex < 0) return null;

    const probs = softmaxAllowed(logits, allowedCandidateIndexes, options.temperature ?? 1);
    const probabilityByActionId = {};
    for (let i = 0; i < featureCtx.candidateIds.length; i += 1) {
      probabilityByActionId[featureCtx.candidateIds[i]] = numeric(probs[i], 0);
    }

    const value = Array.isArray(valueTensor?.data) || valueTensor?.data?.length
      ? numeric(valueTensor.data[0], 0)
      : 0;

    return {
      actionId: featureCtx.candidateIds[bestCandidateIndex] || null,
      logits,
      probabilities: probs,
      probabilityByActionId,
      value,
      normalizedValue: Math.max(-1, Math.min(1, value)),
      source: "entity-transformer-onnx",
      onnxPath: resolveOnnxFilePath(model, options),
      candidateIds: featureCtx.candidateIds,
    };
  }

  async function evaluateEntityTransformerOnnxBatch(requests = [], options = {}) {
    const timing = options.timing && typeof options.timing === "object" ? options.timing : null;
    const startedAt = Date.now();
    const normalizedRequests = (requests || []).filter((request) => request?.model && Array.isArray(request?.candidates));
    if (!normalizedRequests.length) return [];
    const first = normalizedRequests[0];
    const firstOptions = {
      ...(first.options || {}),
      ...options,
      disableModelServer: true,
    };
    const session = await getOrCreateOnnxSession(first.model, firstOptions);
    if (!session || !nodeOrt?.Tensor) return normalizedRequests.map(() => null);

    const featureContexts = normalizedRequests.map((request) => buildEntityFeatureContext(
      request.model,
      request.candidates,
      request.context || {},
      { ...(request.options || {}), ...options },
    ));
    if (timing) timing.contextMs = (timing.contextMs || 0) + (Date.now() - startedAt);
    const validShape = featureContexts.every((featureCtx) => (
      featureCtx.candidateIds.length
      && featureCtx.actionVocab.length
      && featureCtx.maxStateEntities === featureContexts[0].maxStateEntities
      && featureCtx.maxCandidateActions === featureContexts[0].maxCandidateActions
      && featureCtx.numericDim === featureContexts[0].numericDim
    ));
    if (!validShape) {
      const results = [];
      for (const request of normalizedRequests) {
        // eslint-disable-next-line no-await-in-loop
        results.push(await evaluateEntityTransformerOnnx(
          request.model,
          request.candidates,
          request.context || {},
          { ...(request.options || {}), ...options, disableModelServer: true },
        ));
      }
      return results;
    }

    const tensorStartedAt = Date.now();
    const batchSize = featureContexts.length;
    const maxStateEntities = featureContexts[0].maxStateEntities;
    const maxCandidateActions = featureContexts[0].maxCandidateActions;
    const numericDim = featureContexts[0].numericDim;
    const entityTypeIds = new BigInt64Array(batchSize * maxStateEntities);
    const ownerIds = new BigInt64Array(batchSize * maxStateEntities);
    const zoneIds = new BigInt64Array(batchSize * maxStateEntities);
    const slotIds = new BigInt64Array(batchSize * maxStateEntities);
    const numericFeatures = new Float32Array(batchSize * maxStateEntities * numericDim);
    const entityMask = new Float32Array(batchSize * maxStateEntities);
    const candidateActionIndexes = new BigInt64Array(batchSize * maxCandidateActions);
    const candidateMask = new Float32Array(batchSize * maxCandidateActions);
    const indexMaps = buildEntityIndexMaps(featureContexts[0]);

    for (let batchIndex = 0; batchIndex < batchSize; batchIndex += 1) {
      fillEntityInputTensors(featureContexts[batchIndex], {
        entityTypeIds,
        ownerIds,
        zoneIds,
        slotIds,
        numericFeatures,
        entityMask,
        candidateActionIndexes,
        candidateMask,
      }, {
        entityOffset: batchIndex * maxStateEntities,
        numericOffset: batchIndex * maxStateEntities * numericDim,
        candidateOffset: batchIndex * maxCandidateActions,
      }, indexMaps);
    }

    const inputNames = first.model?.onnx?.inputNames || [
      "entity_type_ids",
      "owner_ids",
      "zone_ids",
      "slot_ids",
      "numeric_features",
      "entity_mask",
      "candidate_action_indexes",
      "candidate_mask",
    ];
    const feeds = {
      [inputNames[0] || "entity_type_ids"]: new nodeOrt.Tensor("int64", entityTypeIds, [batchSize, maxStateEntities]),
      [inputNames[1] || "owner_ids"]: new nodeOrt.Tensor("int64", ownerIds, [batchSize, maxStateEntities]),
      [inputNames[2] || "zone_ids"]: new nodeOrt.Tensor("int64", zoneIds, [batchSize, maxStateEntities]),
      [inputNames[3] || "slot_ids"]: new nodeOrt.Tensor("int64", slotIds, [batchSize, maxStateEntities]),
      [inputNames[4] || "numeric_features"]: new nodeOrt.Tensor("float32", numericFeatures, [batchSize, maxStateEntities, numericDim]),
      [inputNames[5] || "entity_mask"]: new nodeOrt.Tensor("float32", entityMask, [batchSize, maxStateEntities]),
      [inputNames[6] || "candidate_action_indexes"]: new nodeOrt.Tensor("int64", candidateActionIndexes, [batchSize, maxCandidateActions]),
      [inputNames[7] || "candidate_mask"]: new nodeOrt.Tensor("float32", candidateMask, [batchSize, maxCandidateActions]),
    };
    if (timing) timing.tensorMs = (timing.tensorMs || 0) + (Date.now() - tensorStartedAt);

    const runStartedAt = Date.now();
    const outputs = await session.run(feeds);
    if (timing) timing.runMs = (timing.runMs || 0) + (Date.now() - runStartedAt);
    const decodeStartedAt = Date.now();
    const policyData = outputs?.policy_logits?.data;
    const valueData = outputs?.value?.data;
    if (!policyData || !policyData.length) return normalizedRequests.map(() => null);

    const results = [];
    for (let batchIndex = 0; batchIndex < batchSize; batchIndex += 1) {
      const featureCtx = featureContexts[batchIndex];
      const logits = Array.from(policyData.slice(batchIndex * maxCandidateActions, (batchIndex + 1) * maxCandidateActions)).map((value) => numeric(value, 0));
      const allowedCandidateIndexes = [];
      for (let i = 0; i < featureCtx.candidateIds.length; i += 1) allowedCandidateIndexes.push(i);
      let bestCandidateIndex = -1;
      let bestScore = -Infinity;
      for (const idx of allowedCandidateIndexes) {
        const score = numeric(logits[idx], -Infinity);
        if (score > bestScore) {
          bestScore = score;
          bestCandidateIndex = idx;
        }
      }
      if (bestCandidateIndex < 0) {
        results.push(null);
        continue;
      }
      const requestOptions = normalizedRequests[batchIndex].options || {};
      const probs = softmaxAllowed(logits, allowedCandidateIndexes, requestOptions.temperature ?? options.temperature ?? 1);
      const probabilityByActionId = {};
      for (let i = 0; i < featureCtx.candidateIds.length; i += 1) {
        probabilityByActionId[featureCtx.candidateIds[i]] = numeric(probs[i], 0);
      }
      const value = valueData?.length ? numeric(valueData[batchIndex], 0) : 0;
      results.push({
        actionId: featureCtx.candidateIds[bestCandidateIndex] || null,
        logits,
        probabilities: probs,
        probabilityByActionId,
        value,
        normalizedValue: Math.max(-1, Math.min(1, value)),
        source: "entity-transformer-onnx-batch",
        onnxPath: resolveOnnxFilePath(first.model, firstOptions),
        candidateIds: featureCtx.candidateIds,
      });
    }
    if (timing) timing.decodeMs = (timing.decodeMs || 0) + (Date.now() - decodeStartedAt);
    return results;
  }

  function reshape2D(flat = [], rows = 0, cols = 0) {
    if (!Array.isArray(flat) || rows <= 0 || cols <= 0 || flat.length !== rows * cols) return null;
    const matrix = [];
    for (let row = 0; row < rows; row += 1) {
      matrix.push(flat.slice(row * cols, (row + 1) * cols).map((value) => numeric(value, 0)));
    }
    return matrix;
  }

  function readFlatArray(state = {}, key = "", length = 0) {
    const values = Array.isArray(state[key]) ? state[key] : null;
    if (!values || values.length !== length) return null;
    return values.map((value) => numeric(value, 0));
  }

  function buildTinyResNetFeatureContext(model = {}, candidates = [], context = {}, options = {}) {
    const actionVocab = Array.isArray(model.actionVocab) ? model.actionVocab : [];
    const candidateVocab = Array.isArray(model.candidateVocab) ? model.candidateVocab : [];
    const actionIndexById = Object.create(null);
    const candidateIndexById = Object.create(null);
    for (let i = 0; i < actionVocab.length; i += 1) actionIndexById[actionVocab[i]] = i;
    for (let i = 0; i < candidateVocab.length; i += 1) candidateIndexById[candidateVocab[i]] = i;

    const roundBucketSize = Math.max(1, Math.round(numeric(options.roundBucketSize ?? model.roundBucketSize, 2)));
    const roundNumber = Math.max(0, Math.round(numeric(context.roundNumber, 0)));
    const maxBucket = Math.max(0, Math.round(numeric(model.roundBucketCount, 1)) - 1);
    const roundBucket = Math.min(maxBucket, Math.floor(roundNumber / roundBucketSize));

    const candidateIds = normalizeCandidateIds(candidates);
    const allowedActionIndexes = [];
    const candidateFeatureIndexes = [];
    for (const candidateId of candidateIds) {
      if (actionIndexById[candidateId] !== undefined) allowedActionIndexes.push(actionIndexById[candidateId]);
      if (candidateIndexById[candidateId] !== undefined) candidateFeatureIndexes.push(candidateIndexById[candidateId]);
    }

    return {
      actionVocab,
      candidateVocab,
      allowedActionIndexes,
      candidateFeatureIndexes,
      roundBucket,
      roundNumber,
      turnNumber: Math.max(0, Math.round(numeric(context.turnNumber, 0))),
    };
  }

  function buildTinyResNetInputVector(model = {}, featureCtx = {}) {
    const candidateCount = featureCtx.candidateVocab.length;
    const roundBucketCount = Math.max(1, Math.round(numeric(model.roundBucketCount, 1)));
    const configuredInputDim = Math.max(1, Math.round(numeric(model?.network?.inputDim, candidateCount + roundBucketCount + 4)));
    const vector = new Array(configuredInputDim).fill(0);

    for (const index of featureCtx.candidateFeatureIndexes) {
      if (index >= 0 && index < candidateCount && index < vector.length) vector[index] = 1;
    }
    const bucketOffset = candidateCount;
    const bucketIndex = bucketOffset + featureCtx.roundBucket;
    if (bucketIndex >= 0 && bucketIndex < vector.length) vector[bucketIndex] = 1;

    const scalarOffset = candidateCount + roundBucketCount;
    if (scalarOffset + 0 < vector.length) vector[scalarOffset + 0] = featureCtx.allowedActionIndexes.length / 32;
    if (scalarOffset + 1 < vector.length) vector[scalarOffset + 1] = featureCtx.candidateFeatureIndexes.length / 32;
    if (scalarOffset + 2 < vector.length) vector[scalarOffset + 2] = featureCtx.roundNumber / 10;
    if (scalarOffset + 3 < vector.length) vector[scalarOffset + 3] = featureCtx.turnNumber / 120;
    return vector;
  }

  function predictTinyResnetAction(model = {}, candidates = [], context = {}, options = {}) {
    const state = model?.weights?.state || {};
    const actionCount = Array.isArray(model.actionVocab) ? model.actionVocab.length : 0;
    const channels = Math.max(1, Math.round(numeric(model?.network?.channels, 0)));
    const roundBucketCount = Math.max(1, Math.round(numeric(model.roundBucketCount, 1)));
    const inputDim = Math.max(1, Math.round(numeric(model?.network?.inputDim, 0)));
    if (!actionCount || !channels || !inputDim) return null;

    const featureCtx = buildTinyResNetFeatureContext(model, candidates, context, options);
    if (!featureCtx.allowedActionIndexes.length || !featureCtx.actionVocab.length) return null;
    const input = buildTinyResNetInputVector(model, featureCtx);
    if (!input.length) return null;

    const inputProjWeight = reshape2D(readFlatArray(state, "input_proj.weight", channels * inputDim), channels, inputDim);
    const inputProjBias = readFlatArray(state, "input_proj.bias", channels);
    const inputNormWeight = readFlatArray(state, "shared_norm.weight", channels);
    const inputNormBias = readFlatArray(state, "shared_norm.bias", channels);
    const policyHeadWeight = reshape2D(readFlatArray(state, "policy_head.weight", actionCount * channels), actionCount, channels);
    const policyHeadBias = readFlatArray(state, "policy_head.bias", actionCount);
    if (!inputProjWeight || !inputProjBias || !inputNormWeight || !inputNormBias || !policyHeadWeight || !policyHeadBias) {
      return null;
    }

    let hidden = linearVec(inputProjWeight, inputProjBias, input);

    const blocks = Math.max(1, Math.round(numeric(model?.network?.blocks, 1)));
    for (let blockIndex = 0; blockIndex < blocks; blockIndex += 1) {
      const p = `blocks.${blockIndex}`;
      const ln1W = readFlatArray(state, `${p}.norm1.weight`, channels);
      const ln1B = readFlatArray(state, `${p}.norm1.bias`, channels);
      const fc1W = reshape2D(readFlatArray(state, `${p}.fc1.weight`, channels * channels), channels, channels);
      const fc1B = readFlatArray(state, `${p}.fc1.bias`, channels);
      const ln2W = readFlatArray(state, `${p}.norm2.weight`, channels);
      const ln2B = readFlatArray(state, `${p}.norm2.bias`, channels);
      const fc2W = reshape2D(readFlatArray(state, `${p}.fc2.weight`, channels * channels), channels, channels);
      const fc2B = readFlatArray(state, `${p}.fc2.bias`, channels);
      if (!ln1W || !ln1B || !fc1W || !fc1B || !ln2W || !ln2B || !fc2W || !fc2B) continue;

      const residual = hidden;
      const y1 = linearVec(fc1W, fc1B, reluVec(layerNorm(hidden, ln1W, ln1B)));
      const y2 = linearVec(fc2W, fc2B, reluVec(layerNorm(y1, ln2W, ln2B)));
      hidden = residual.map((value, index) => value + numeric(y2[index], 0));
    }

    hidden = reluVec(layerNorm(hidden, inputNormWeight, inputNormBias));
    const logits = linearVec(policyHeadWeight, policyHeadBias, hidden);

    let bestIndex = -1;
    let bestScore = -Infinity;
    const allowedSet = new Set(featureCtx.allowedActionIndexes);
    for (let actionIndex = 0; actionIndex < logits.length; actionIndex += 1) {
      if (!allowedSet.has(actionIndex)) continue;
      const score = numeric(logits[actionIndex], -Infinity);
      if (score > bestScore) {
        bestScore = score;
        bestIndex = actionIndex;
      }
    }
    if (bestIndex < 0) return null;
    return String(featureCtx.actionVocab[bestIndex] || "") || null;
  }

  function evaluateTinyResnetHeads(model = {}, candidates = [], context = {}, options = {}) {
    const state = model?.weights?.state || {};
    const actionCount = Array.isArray(model.actionVocab) ? model.actionVocab.length : 0;
    const channels = Math.max(1, Math.round(numeric(model?.network?.channels, 0)));
    const inputDim = Math.max(1, Math.round(numeric(model?.network?.inputDim, 0)));
    if (!actionCount || !channels || !inputDim) return null;

    const featureCtx = buildTinyResNetFeatureContext(model, candidates, context, options);
    if (!featureCtx.allowedActionIndexes.length || !featureCtx.actionVocab.length) return null;
    const input = buildTinyResNetInputVector(model, featureCtx);
    if (!input.length) return null;

    const inputProjWeight = reshape2D(readFlatArray(state, "input_proj.weight", channels * inputDim), channels, inputDim);
    const inputProjBias = readFlatArray(state, "input_proj.bias", channels);
    const inputNormWeight = readFlatArray(state, "shared_norm.weight", channels);
    const inputNormBias = readFlatArray(state, "shared_norm.bias", channels);
    const policyHeadWeight = reshape2D(readFlatArray(state, "policy_head.weight", actionCount * channels), actionCount, channels);
    const policyHeadBias = readFlatArray(state, "policy_head.bias", actionCount);
    const valueHead0Weight = reshape2D(readFlatArray(state, "value_head.0.weight", Math.max(1, Math.floor(channels / 2)) * channels), Math.max(1, Math.floor(channels / 2)), channels);
    const valueHead0Bias = readFlatArray(state, "value_head.0.bias", Math.max(1, Math.floor(channels / 2)));
    const valueHead3Weight = reshape2D(readFlatArray(state, "value_head.3.weight", Math.max(1, Math.floor(channels / 2))), 1, Math.max(1, Math.floor(channels / 2)));
    const valueHead3Bias = readFlatArray(state, "value_head.3.bias", 1);
    if (
      !inputProjWeight || !inputProjBias || !inputNormWeight || !inputNormBias || !policyHeadWeight || !policyHeadBias
      || !valueHead0Weight || !valueHead0Bias || !valueHead3Weight || !valueHead3Bias
    ) {
      return null;
    }

    let hidden = linearVec(inputProjWeight, inputProjBias, input);
    const blocks = Math.max(1, Math.round(numeric(model?.network?.blocks, 1)));
    for (let blockIndex = 0; blockIndex < blocks; blockIndex += 1) {
      const p = `blocks.${blockIndex}`;
      const ln1W = readFlatArray(state, `${p}.norm1.weight`, channels);
      const ln1B = readFlatArray(state, `${p}.norm1.bias`, channels);
      const fc1W = reshape2D(readFlatArray(state, `${p}.fc1.weight`, channels * channels), channels, channels);
      const fc1B = readFlatArray(state, `${p}.fc1.bias`, channels);
      const ln2W = readFlatArray(state, `${p}.norm2.weight`, channels);
      const ln2B = readFlatArray(state, `${p}.norm2.bias`, channels);
      const fc2W = reshape2D(readFlatArray(state, `${p}.fc2.weight`, channels * channels), channels, channels);
      const fc2B = readFlatArray(state, `${p}.fc2.bias`, channels);
      if (!ln1W || !ln1B || !fc1W || !fc1B || !ln2W || !ln2B || !fc2W || !fc2B) continue;

      const residual = hidden;
      const y1 = linearVec(fc1W, fc1B, reluVec(layerNorm(hidden, ln1W, ln1B)));
      const y2 = linearVec(fc2W, fc2B, reluVec(layerNorm(y1, ln2W, ln2B)));
      hidden = residual.map((value, index) => value + numeric(y2[index], 0));
    }

    hidden = reluVec(layerNorm(hidden, inputNormWeight, inputNormBias));
    const logits = linearVec(policyHeadWeight, policyHeadBias, hidden);
    const valueHidden = reluVec(linearVec(valueHead0Weight, valueHead0Bias, hidden));
    const valueLinear = linearVec(valueHead3Weight, valueHead3Bias, valueHidden);
    const value = Math.tanh(numeric(valueLinear[0], 0));

    return {
      ...buildHeadEvalResult(featureCtx, logits, value, options),
      input,
      source: "tiny-resnet-js",
    };
  }

  function resolveOnnxFilePath(model = {}, options = {}) {
    if (options.onnxPath && nodePath) return nodePath.resolve(String(options.onnxPath));
    const fileName = String(model?.onnx?.fileName || "").trim();
    if (!fileName || !nodePath || typeof __dirname !== "string") return null;
    return nodePath.resolve(__dirname, fileName);
  }

  function resolveOnnxRuntimePackageRoot() {
    if (!nodePath || typeof require !== "function") return null;
    try {
      return nodePath.dirname(require.resolve("onnxruntime-node/package.json"));
    } catch (_error) {
      return null;
    }
  }

  function resolveOnnxRuntimeBinaryDir() {
    const packageRoot = resolveOnnxRuntimePackageRoot();
    if (!packageRoot || !nodePath || typeof process === "undefined") return null;
    return nodePath.join(packageRoot, "bin", "napi-v6", process.platform, process.arch);
  }

  function getOnnxRuntimeDiagnostics(model = {}, options = {}) {
    const binaryDir = resolveOnnxRuntimeBinaryDir();
    const providerFiles = [
      "libonnxruntime.so.1",
      "libonnxruntime_providers_cuda.so",
      "libonnxruntime_providers_shared.so",
      "libonnxruntime_providers_tensorrt.so",
    ].map((fileName) => {
      const filePath = binaryDir && nodePath ? nodePath.join(binaryDir, fileName) : null;
      return {
        fileName,
        filePath,
        exists: Boolean(filePath && nodeFs?.existsSync(filePath)),
      };
    });
    return {
      nodeOrtAvailable: Boolean(nodeOrt?.InferenceSession),
      tensorAvailable: Boolean(nodeOrt?.Tensor),
      packageRoot: resolveOnnxRuntimePackageRoot(),
      binaryDir,
      modelPath: resolveOnnxFilePath(model, options),
      requestedProviders: getOnnxExecutionProviders(options),
      providerFiles,
    };
  }

  function getOnnxExecutionProviders(options = {}) {
    const requested = Array.isArray(options.executionProviders) ? options.executionProviders.filter(Boolean) : [];
    if (requested.length) return requested;
    if (typeof process !== "undefined") {
      const envProviders = String(process.env.SETI_ONNX_EXECUTION_PROVIDERS || "")
        .split(",")
        .map((provider) => provider.trim())
        .filter(Boolean);
      if (envProviders.length) return envProviders;
      if (String(process.env.SETI_ONNX_USE_CUDA || "") === "1") return ["cuda", "cpu"];
    }
    return ["cpu"];
  }

  function getOnnxSessionCacheKey(model = {}, options = {}) {
    const filePath = resolveOnnxFilePath(model, options);
    if (!filePath) return "";
    return `${filePath}|${getOnnxExecutionProviders(options).join(",")}`;
  }

  function clearOnnxSession(model = {}, options = {}) {
    const cacheKey = getOnnxSessionCacheKey(model, options);
    if (cacheKey) onnxSessionCache.delete(cacheKey);
  }

  async function getOrCreateOnnxSession(model = {}, options = {}) {
    if (!nodeOrt?.InferenceSession) return null;
    const filePath = resolveOnnxFilePath(model, options);
    if (!filePath) return null;
    const cacheKey = getOnnxSessionCacheKey(model, options);
    if (!onnxSessionCache.has(cacheKey)) {
      const promise = nodeOrt.InferenceSession.create(filePath, {
        executionProviders: getOnnxExecutionProviders(options),
        graphOptimizationLevel: "all",
      }).catch((error) => {
        onnxSessionCache.delete(cacheKey);
        throw error;
      });
      onnxSessionCache.set(cacheKey, promise);
    }
    return onnxSessionCache.get(cacheKey);
  }

  async function evaluateTinyResnetOnnx(model = {}, candidates = [], context = {}, options = {}) {
    const session = await getOrCreateOnnxSession(model, options);
    if (!session || !nodeOrt?.Tensor) return null;

    const featureCtx = buildTinyResNetFeatureContext(model, candidates, context, options);
    if (!featureCtx.allowedActionIndexes.length || !featureCtx.actionVocab.length) return null;

    const input = buildTinyResNetInputVector(model, featureCtx);
    const inputName = String(model?.onnx?.inputName || "input");
    const tensor = new nodeOrt.Tensor("float32", Float32Array.from(input), [1, input.length]);
    const outputs = await session.run({ [inputName]: tensor });
    const policyTensor = outputs?.policy_logits;
    const valueTensor = outputs?.value;
    if (!policyTensor?.data || !policyTensor.data.length) return null;

    const logits = Array.from(policyTensor.data).map((value) => numeric(value, 0));
    let bestIndex = -1;
    let bestScore = -Infinity;
    const allowedSet = new Set(featureCtx.allowedActionIndexes);
    for (let index = 0; index < logits.length; index += 1) {
      if (!allowedSet.has(index)) continue;
      if (logits[index] > bestScore) {
        bestScore = logits[index];
        bestIndex = index;
      }
    }
    if (bestIndex < 0) return null;
    const value = Array.isArray(valueTensor?.data) || valueTensor?.data?.length
      ? numeric(valueTensor.data[0], 0)
      : 0;
    return {
      ...buildHeadEvalResult(featureCtx, logits, value, options),
      input,
      onnxPath: resolveOnnxFilePath(model, options),
      source: "tiny-resnet-onnx",
    };
  }

  async function evaluateBehaviorCloneHeadsAsync(model = {}, candidates = [], context = {}, options = {}) {
    const candidateIds = normalizeCandidateIds(candidates);
    if (!candidateIds.length) return null;
    if (model && model.modelType === "pytorch-entity-transformer-v1") {
      const serverResult = await evaluateEntityTransformerViaServer(model, candidates, context, options);
      if (serverResult) return serverResult;
      throw new Error("Entity transformer requires model server inference, but no result was returned");
    }
    if (!(model && model.modelType === "pytorch-tiny-resnet-v1" && model?.weights?.state)) return null;
    return evaluateTinyResnetHeads(model, candidates, context, options);
  }

  function evaluateBehaviorCloneHeads(model = {}, candidates = [], context = {}, options = {}) {
    const candidateIds = normalizeCandidateIds(candidates);
    if (!candidateIds.length) return null;
    if (model && model.modelType === "pytorch-entity-transformer-v1") {
      throw new Error("Entity transformer requires async ONNX inference; sync JS fallback is disabled");
    }
    if (!(model && model.modelType === "pytorch-tiny-resnet-v1" && model?.weights?.state)) return null;
    return evaluateTinyResnetHeads(model, candidates, context, options);
  }

  async function predictBehaviorCloneActionAsync(model = {}, candidates = [], context = {}, options = {}) {
    const candidateIds = normalizeCandidateIds(candidates);
    if (!candidateIds.length) return null;

    if (model && model.modelType === "pytorch-entity-transformer-v1") {
      const serverResult = await evaluateEntityTransformerViaServer(model, candidates, context, options);
      if (serverResult?.actionId) return serverResult.actionId;
      throw new Error("Entity transformer requires model server inference, but no action was produced");
    }

    if (model && model.modelType === "pytorch-tiny-resnet-v1" && model?.weights?.state) {
      return predictTinyResnetAction(model, candidates, context, options);
    }

    return predictBehaviorCloneAction(model, candidates, context, options);
  }

  function shouldUseValidation(record, options = {}) {
    const validationRatio = Math.max(0, Math.min(0.5, numeric(options.validationRatio, 0.2)));
    if (validationRatio <= 0) return false;
    const seedText = String(options.seed || "seti-bc-split");
    const value = hashText(`${seedText}:${record.recordId}`) / 4294967295;
    return value < validationRatio;
  }

  function trainBehaviorCloneModel(records = [], options = {}) {
    const contextCounts = {};
    const actionCounts = {};
    const trainRecords = [];
    const validationRecords = [];

    for (const record of records || []) {
      if (!record || !record.targetActionId || !Array.isArray(record.candidateIds)) continue;
      if (shouldUseValidation(record, options)) {
        validationRecords.push(record);
        continue;
      }
      trainRecords.push(record);
      actionCounts[record.targetActionId] = (actionCounts[record.targetActionId] || 0) + 1;
      if (!contextCounts[record.contextKey]) contextCounts[record.contextKey] = {};
      contextCounts[record.contextKey][record.targetActionId] = (contextCounts[record.contextKey][record.targetActionId] || 0) + 1;
    }

    const model = {
      version: 1,
      trainedAt: options.trainedAt || new Date().toISOString(),
      totalRecords: records.length,
      trainRecordCount: trainRecords.length,
      validationRecordCount: validationRecords.length,
      contextCounts,
      actionCounts,
    };

    const trainEval = evaluateBehaviorCloneModel(model, trainRecords);
    const validationEval = evaluateBehaviorCloneModel(model, validationRecords);

    return {
      model,
      metrics: {
        trainAccuracy: trainEval.accuracy,
        validationAccuracy: validationEval.accuracy,
        trainCount: trainEval.count,
        validationCount: validationEval.count,
      },
    };
  }

  function predictBehaviorCloneAction(model = {}, candidates = [], context = {}, options = {}) {
    const candidateIds = normalizeCandidateIds(candidates);
    if (!candidateIds.length) return null;

    if (model && model.modelType === "pytorch-entity-transformer-v1") {
      throw new Error("Entity transformer requires async ONNX inference; sync JS fallback is disabled");
    }

    if (model && model.modelType === "pytorch-tiny-resnet-v1" && model?.weights?.state) {
      const tinyPick = predictTinyResnetAction(model, candidates, context, options);
      if (tinyPick) return tinyPick;
    }

    if (model && model.modelType === "pytorch-linear-v1" && model.weights) {
      const pytorchPick = predictPyTorchLinearAction(model, candidates, context, options);
      if (pytorchPick) return pytorchPick;
    }

    const contextKey = buildContextKey({ ...context, candidates }, options);
    const contextCounts = model.contextCounts?.[contextKey] || {};
    const bestFromContext = pickBestAction(contextCounts, candidateIds);
    if (bestFromContext) return bestFromContext;

    const actionCounts = model.actionCounts || {};
    const bestGlobal = pickBestAction(actionCounts, candidateIds);
    return bestGlobal || candidateIds[0] || null;
  }

  function evaluateBehaviorCloneModel(model = {}, records = [], options = {}) {
    let correct = 0;
    let count = 0;
    for (const record of records || []) {
      const predicted = predictBehaviorCloneAction(model, record.candidateIds.map((id) => ({ id, available: true })), {
        roundNumber: record.roundNumber,
      }, options);
      if (!predicted) continue;
      count += 1;
      if (predicted === record.targetActionId) correct += 1;
    }
    return {
      count,
      correct,
      accuracy: count > 0 ? correct / count : 0,
    };
  }

  function summarizeBehaviorCloneRecords(records = []) {
    const byAction = {};
    const byContext = {};
    for (const record of records || []) {
      byAction[record.targetActionId] = (byAction[record.targetActionId] || 0) + 1;
      byContext[record.contextKey] = (byContext[record.contextKey] || 0) + 1;
    }
    return {
      count: records.length,
      actionCount: Object.keys(byAction).length,
      contextCount: Object.keys(byContext).length,
      byAction,
    };
  }

  return Object.freeze({
    buildContextKey,
    extractBehaviorCloneRecords,
    trainBehaviorCloneModel,
    predictBehaviorCloneAction,
    predictBehaviorCloneActionAsync,
    evaluateEntityTransformerOnnxBatch,
    evaluateBehaviorCloneHeads,
    evaluateBehaviorCloneHeadsAsync,
    evaluateBehaviorCloneModel,
    summarizeBehaviorCloneRecords,
    clearOnnxSession,
    getOnnxRuntimeDiagnostics,
  });
});
