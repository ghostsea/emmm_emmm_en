#!/usr/bin/env node
"use strict";

const fs = require("fs");
const http = require("http");
const path = require("path");

const cudaLibraryPath = require("./cuda-library-path");

cudaLibraryPath.ensureCudaLibraryPathAtProcessStart(__filename, process.argv.slice(2));
process.env.SETI_ENTITY_MODEL_SERVER_DISABLE_CLIENT = "1";

const behaviorCloning = require("../randomizer/game/ai/behavior-cloning");

function numeric(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function numberOption(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function parseArgs(argv = []) {
  const options = {
    host: process.env.SETI_ENTITY_MODEL_SERVER_HOST || "127.0.0.1",
    port: Math.max(0, Math.round(numberOption(process.env.SETI_ENTITY_MODEL_SERVER_PORT, 0))),
    batchSize: Math.max(1, Math.round(numberOption(process.env.SETI_ENTITY_MODEL_BATCH_SIZE, 16))),
    batchDelayMs: Math.max(0, Math.round(numberOption(process.env.SETI_ENTITY_MODEL_BATCH_DELAY_MS, 2))),
    maxConcurrentBatches: Math.max(1, Math.round(numberOption(process.env.SETI_ENTITY_MODEL_MAX_CONCURRENT_BATCHES, 1))),
    cudaRetryCount: Math.max(0, Math.round(numberOption(process.env.SETI_ENTITY_MODEL_CUDA_RETRY_COUNT, 2))),
    cudaRetryDelayMs: Math.max(0, Math.round(numberOption(process.env.SETI_ENTITY_MODEL_CUDA_RETRY_DELAY_MS, 100))),
    idleExitMs: Math.max(1000, Math.round(numberOption(process.env.SETI_ENTITY_MODEL_IDLE_EXIT_MS, 120000))),
    logBatches: String(process.env.SETI_ENTITY_MODEL_BATCH_LOG || "1") !== "0",
    logRequests: String(process.env.SETI_ENTITY_MODEL_REQUEST_LOG || "1") !== "0",
    heartbeatIntervalMs: Math.max(1000, Math.round(numberOption(process.env.SETI_ENTITY_MODEL_HEARTBEAT_MS, 5000))),
    runtimeLogPath: String(process.env.SETI_AI_RUNTIME_LOG_PATH || "").trim(),
    requestBodyLimitBytes: Math.max(1024, Math.round(numberOption(process.env.SETI_ENTITY_MODEL_BODY_LIMIT_BYTES, 16 * 1024 * 1024))),
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) continue;
    const [key, inlineValue] = arg.slice(2).split("=");
    const value = inlineValue != null ? inlineValue : argv[index + 1];
    if (inlineValue == null && value != null && !String(value).startsWith("--")) index += 1;
    if (key === "host") options.host = String(value || options.host);
    else if (key === "port") options.port = Math.max(0, Math.round(numberOption(value, 0)));
    else if (key === "batchSize") options.batchSize = Math.max(1, Math.round(numberOption(value, options.batchSize)));
    else if (key === "batchDelayMs") options.batchDelayMs = Math.max(0, Math.round(numberOption(value, options.batchDelayMs)));
    else if (key === "maxConcurrentBatches") options.maxConcurrentBatches = Math.max(1, Math.round(numberOption(value, options.maxConcurrentBatches)));
    else if (key === "cudaRetryCount") options.cudaRetryCount = Math.max(0, Math.round(numberOption(value, options.cudaRetryCount)));
    else if (key === "cudaRetryDelayMs") options.cudaRetryDelayMs = Math.max(0, Math.round(numberOption(value, options.cudaRetryDelayMs)));
    else if (key === "idleExitMs") options.idleExitMs = Math.max(1000, Math.round(numberOption(value, options.idleExitMs)));
    else if (key === "logBatches") options.logBatches = String(value) !== "false" && String(value) !== "0";
    else if (key === "logRequests") options.logRequests = String(value) !== "false" && String(value) !== "0";
    else if (key === "heartbeatMs") options.heartbeatIntervalMs = Math.max(1000, Math.round(numberOption(value, options.heartbeatIntervalMs)));
    else if (key === "runtimeLogPath") options.runtimeLogPath = String(value || "").trim();
    else if (key === "bodyLimitBytes") options.requestBodyLimitBytes = Math.max(1024, Math.round(numberOption(value, options.requestBodyLimitBytes)));
    else throw new Error(`Unknown option --${key}`);
  }

  return options;
}

function sendJson(response, statusCode, payload) {
  const body = JSON.stringify(payload || {});
  response.writeHead(statusCode, {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "content-type",
    "content-type": "application/json",
    "content-length": Buffer.byteLength(body),
  });
  response.end(body);
}

function readRequestJson(request, limitBytes) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;
    request.on("data", (chunk) => {
      total += chunk.length;
      if (total > limitBytes) {
        reject(new Error("request body too large"));
        request.destroy();
        return;
      }
      chunks.push(chunk);
    });
    request.on("end", () => {
      try {
        const text = Buffer.concat(chunks).toString("utf8");
        resolve(text ? JSON.parse(text) : {});
      } catch (error) {
        reject(error);
      }
    });
    request.on("error", reject);
  });
}

function appendRuntimeLogLine(filePath, entry = {}) {
  if (!filePath) return;
  const resolved = path.resolve(filePath);
  fs.mkdirSync(path.dirname(resolved), { recursive: true });
  fs.appendFileSync(resolved, `${JSON.stringify(entry)}\n`, "utf8");
}

function normalizeRequest(payload = {}) {
  if (!payload.model || typeof payload.model !== "object") throw new Error("missing model");
  if (!Array.isArray(payload.candidates)) throw new Error("missing candidates");
  return {
    modelKey: String(payload.modelKey || "default"),
    model: payload.model,
    candidates: payload.candidates,
    context: payload.context || {},
    options: {
      ...(payload.options || {}),
      disableModelServer: true,
      executionProviders: Array.isArray(payload.options?.executionProviders) && payload.options.executionProviders.length
        ? payload.options.executionProviders
        : ["cuda"],
    },
  };
}

function createBatcher(options = {}) {
  const pending = [];
  let flushTimer = null;
  let activeFlushes = 0;
  let totalRequests = 0;
  let totalBatches = 0;
  let totalErrors = 0;
  let fallbackRequests = 0;
  let totalRetries = 0;
  let lastRequestAt = Date.now();
  let lastFlushAt = 0;

  function isTransientCudaError(error) {
    const message = String(error?.message || error || "").toLowerCase();
    return message.includes("cuda failure 999")
      || message.includes("cudamemcpyasync")
      || message.includes("cudamemcpy")
      || (message.includes("cuda") && message.includes("unknown error"));
  }

  function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, Math.max(0, ms)));
  }

  function clearSessionsForRequests(requests = []) {
    for (const request of requests) {
      if (typeof behaviorCloning.clearOnnxSession === "function") {
        behaviorCloning.clearOnnxSession(request.model, request.options || {});
      }
    }
  }

  async function runRequestsWithRetry(requests, timing) {
    let lastError = null;
    for (let attempt = 0; attempt <= options.cudaRetryCount; attempt += 1) {
      try {
        return {
          results: await behaviorCloning.evaluateEntityTransformerOnnxBatch(requests, {
            disableModelServer: true,
            timing,
          }),
          retries: attempt,
        };
      } catch (error) {
        lastError = error;
        if (!isTransientCudaError(error) || attempt >= options.cudaRetryCount) throw error;
        totalRetries += 1;
        clearSessionsForRequests(requests);
        if (options.cudaRetryDelayMs > 0) {
          // eslint-disable-next-line no-await-in-loop
          await delay(options.cudaRetryDelayMs * (attempt + 1));
        }
      }
    }
    throw lastError;
  }

  async function runGroup(group) {
    const requests = group.map((item) => item.request);
    const timing = { contextMs: 0, tensorMs: 0, runMs: 0, decodeMs: 0 };
    try {
      const run = await runRequestsWithRetry(requests, timing);
      return { results: run.results, timing, fallback: 0, retries: run.retries };
    } catch (error) {
      if (group.length <= 1) throw error;
      fallbackRequests += group.length;
      const results = [];
      const fallbackTiming = { contextMs: 0, tensorMs: 0, runMs: 0, decodeMs: 0 };
      let fallbackRetries = 0;
      for (const request of requests) {
        const singleTiming = { contextMs: 0, tensorMs: 0, runMs: 0, decodeMs: 0 };
        // eslint-disable-next-line no-await-in-loop
        const singleRun = await runRequestsWithRetry([request], singleTiming);
        const single = singleRun.results;
        fallbackRetries += singleRun.retries || 0;
        fallbackTiming.contextMs += singleTiming.contextMs || 0;
        fallbackTiming.tensorMs += singleTiming.tensorMs || 0;
        fallbackTiming.runMs += singleTiming.runMs || 0;
        fallbackTiming.decodeMs += singleTiming.decodeMs || 0;
        results.push(single[0] || null);
      }
      return { results, timing: fallbackTiming, fallback: group.length, retries: fallbackRetries };
    }
  }

  async function runBatch(batch) {
    activeFlushes += 1;
    const startedAt = Date.now();
    totalBatches += 1;
    lastFlushAt = Date.now();
    let groupSizes = [];
    const phaseTiming = { contextMs: 0, tensorMs: 0, runMs: 0, decodeMs: 0 };
    const fallbackBefore = fallbackRequests;
    let retryDelta = 0;
    try {
      const grouped = new Map();
      for (const item of batch) {
        const key = item.request.modelKey;
        if (!grouped.has(key)) grouped.set(key, []);
        grouped.get(key).push(item);
      }
      groupSizes = Array.from(grouped.values()).map((group) => group.length);
      for (const group of grouped.values()) {
        // eslint-disable-next-line no-await-in-loop
        const groupResult = await runGroup(group);
        const results = groupResult.results || [];
        const timing = groupResult.timing || {};
        phaseTiming.contextMs += timing.contextMs || 0;
        phaseTiming.tensorMs += timing.tensorMs || 0;
        phaseTiming.runMs += timing.runMs || 0;
        phaseTiming.decodeMs += timing.decodeMs || 0;
        retryDelta += groupResult.retries || 0;
        for (let index = 0; index < group.length; index += 1) {
          group[index].resolve(results[index] || null);
        }
      }
    } catch (error) {
      totalErrors += batch.length;
      for (const item of batch) item.reject(error);
    } finally {
      if (options.logBatches) {
        const fallbackDelta = fallbackRequests - fallbackBefore;
        const batched = groupSizes.some((size) => size > 1) && fallbackDelta === 0;
        const maxGroupSize = groupSizes.reduce((best, size) => Math.max(best, size), 0);
        console.error(
          `[entity-model-server] batch flush requests=${batch.length} groups=${groupSizes.join("+") || "0"}`
          + ` fallback=${fallbackDelta} retries=${retryDelta} batched=${batched ? 1 : 0} maxGroupSize=${maxGroupSize}`
          + ` durationMs=${Date.now() - startedAt}`
          + ` contextMs=${phaseTiming.contextMs} tensorMs=${phaseTiming.tensorMs}`
          + ` runMs=${phaseTiming.runMs} decodeMs=${phaseTiming.decodeMs}`
          + ` inFlight=${activeFlushes - 1}/${options.maxConcurrentBatches}`
          + ` totalRequests=${totalRequests} totalBatches=${totalBatches}`,
        );
      }
      activeFlushes -= 1;
      if (pending.length) scheduleFlush();
    }
  }

  function flush() {
    if (flushTimer) {
      clearTimeout(flushTimer);
      flushTimer = null;
    }
    while (pending.length && activeFlushes < options.maxConcurrentBatches) {
      const batch = pending.splice(0, options.batchSize);
      runBatch(batch);
    }
  }

  function scheduleFlush() {
    if (pending.length >= options.batchSize) {
      setImmediate(flush);
      return;
    }
    if (!flushTimer) {
      flushTimer = setTimeout(flush, Math.max(0, options.batchDelayMs));
    }
  }

  function enqueue(request) {
    totalRequests += 1;
    lastRequestAt = Date.now();
    return new Promise((resolve, reject) => {
      pending.push({ request, resolve, reject });
      if (options.logRequests) {
        const stats = getStats();
        console.error(
          `[entity-model-server] enqueue modelKey=${request.modelKey} candidates=${Array.isArray(request.candidates) ? request.candidates.length : 0}`
          + ` pending=${stats.pending} activeFlushes=${stats.activeFlushes}`,
        );
      }
      scheduleFlush();
    });
  }

  function getStats() {
    return {
      pending: pending.length,
      flushing: activeFlushes > 0,
      activeFlushes,
      totalRequests,
      totalBatches,
      totalErrors,
      fallbackRequests,
      totalRetries,
      lastRequestAt,
      lastFlushAt,
      batchSize: options.batchSize,
      batchDelayMs: options.batchDelayMs,
      maxConcurrentBatches: options.maxConcurrentBatches,
    };
  }

  return { enqueue, flush, getStats };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const batcher = createBatcher(options);
  let lastActivityAt = Date.now();
  let shuttingDown = false;
  let requestSeq = 0;

  const server = http.createServer(async (request, response) => {
    lastActivityAt = Date.now();
    if (options.logRequests) {
      console.error(`[entity-model-server] http ${request.method} ${request.url}`);
    }
    if (request.method === "OPTIONS") {
      response.writeHead(204, {
        "access-control-allow-origin": "*",
        "access-control-allow-methods": "GET,POST,OPTIONS",
        "access-control-allow-headers": "content-type",
        "access-control-max-age": "86400",
      });
      response.end();
      return;
    }
    if (request.method === "GET" && request.url === "/health") {
      if (options.logRequests) {
        const stats = batcher.getStats();
        console.error(
          `[entity-model-server] health pending=${stats.pending} activeFlushes=${stats.activeFlushes}`
          + ` totalRequests=${stats.totalRequests} totalBatches=${stats.totalBatches}`,
        );
      }
      sendJson(response, 200, {
        ok: true,
        pid: process.pid,
        uptimeMs: Math.round(process.uptime() * 1000),
        stats: batcher.getStats(),
      });
      return;
    }
    if (request.method === "POST" && request.url === "/runtime-log") {
      try {
        const payload = await readRequestJson(request, options.requestBodyLimitBytes);
        appendRuntimeLogLine(options.runtimeLogPath, {
          ts: new Date().toISOString(),
          pid: process.pid,
          type: "runtime-log",
          payload,
        });
        sendJson(response, 200, { ok: true });
      } catch (error) {
        sendJson(response, 500, { ok: false, error: error?.message || String(error) });
      }
      return;
    }
    if (request.method !== "POST" || request.url !== "/infer") {
      sendJson(response, 404, { ok: false, error: "not found" });
      return;
    }
    const requestId = ++requestSeq;
    const requestStartedAt = Date.now();
    if (options.logRequests) {
      const stats = batcher.getStats();
      console.error(`[entity-model-server] request#${requestId} recv pending=${stats.pending} activeFlushes=${stats.activeFlushes}`);
    }
    try {
      const payload = await readRequestJson(request, options.requestBodyLimitBytes);
      if (options.logRequests) {
        const bodyLength = Number(request.headers["content-length"] || 0) || 0;
        console.error(`[entity-model-server] request#${requestId} parsed bytes=${bodyLength} modelKey=${String(payload?.modelKey || "default")}`);
      }
      const inferenceRequest = normalizeRequest(payload);
      const result = await batcher.enqueue(inferenceRequest);
      if (options.logRequests) {
        console.error(`[entity-model-server] request#${requestId} done ms=${Date.now() - requestStartedAt}`);
      }
      sendJson(response, 200, { ok: true, result });
    } catch (error) {
      if (options.logRequests) {
        console.error(`[entity-model-server] request#${requestId} error ms=${Date.now() - requestStartedAt} message=${error?.message || String(error)}`);
      }
      sendJson(response, 500, { ok: false, error: error?.message || String(error) });
    }
  });

  const idleTimer = setInterval(() => {
    if (shuttingDown) return;
    const stats = batcher.getStats();
    const idleFor = Date.now() - Math.max(lastActivityAt, stats.lastRequestAt || 0, stats.lastFlushAt || 0);
    if (!stats.pending && !stats.flushing && idleFor >= options.idleExitMs) {
      shuttingDown = true;
      console.error(`[entity-model-server] idle for ${idleFor}ms, exiting`);
      server.close(() => process.exit(0));
      setTimeout(() => process.exit(0), 5000).unref();
    }
  }, Math.min(5000, Math.max(1000, Math.floor(options.idleExitMs / 4))));
  idleTimer.unref();

  const heartbeatTimer = setInterval(() => {
    if (shuttingDown) return;
    const stats = batcher.getStats();
    console.error(
      `[entity-model-server] heartbeat pending=${stats.pending} activeFlushes=${stats.activeFlushes}`
      + ` totalRequests=${stats.totalRequests} totalBatches=${stats.totalBatches}`
      + ` totalErrors=${stats.totalErrors} fallbackRequests=${stats.fallbackRequests}`
      + ` totalRetries=${stats.totalRetries}`,
    );
  }, options.heartbeatIntervalMs);
  heartbeatTimer.unref();

  for (const signal of ["SIGINT", "SIGTERM"]) {
    process.on(signal, () => {
      shuttingDown = true;
      server.close(() => process.exit(0));
      setTimeout(() => process.exit(0), 5000).unref();
    });
  }

  await new Promise((resolve) => server.listen(options.port, options.host, resolve));
  const address = server.address();
  const url = `http://${address.address}:${address.port}`;
  console.error(`[entity-model-server] listening ${url} batchSize=${options.batchSize} batchDelayMs=${options.batchDelayMs} maxConcurrentBatches=${options.maxConcurrentBatches} idleExitMs=${options.idleExitMs} logRequests=${options.logRequests ? 1 : 0} heartbeatMs=${options.heartbeatIntervalMs} runtimeLogPath=${options.runtimeLogPath || "<disabled>"}`);
  console.log(JSON.stringify({ ok: true, url, pid: process.pid }));
}

main().catch((error) => {
  console.error(error && error.stack ? error.stack : error);
  process.exit(1);
});
