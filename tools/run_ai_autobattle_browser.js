#!/usr/bin/env node
"use strict";

const fs = require("fs");
const http = require("http");
const os = require("os");
const path = require("path");
const { spawn, spawnSync } = require("child_process");

const REPO_ROOT = path.resolve(__dirname, "..");
const DEFAULT_CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const DEFAULT_CDP_TIMEOUT_MS = 45000;

function parseArgs(argv) {
  const options = {
    seed: "ai-v2-baseline",
    games: 5,
    activePlayerCount: 2,
    maxSteps: 2500,
    stopBeforeRound: null,
    maxMovesPerTurn: null,
    stepDelayMs: 0,
    maxBugRepeats: 1,
    sequenceWindowTurns: 6,
    yieldEverySteps: 20,
    stopOnBlocked: true,
    headless: true,
    single: false,
    out: null,
    chrome: process.env.CHROME_PATH || DEFAULT_CHROME,
    strategyWeights: null,
    strategyTuning: null,
    mergeStrategyWeights: true,
    resetStrategyWeights: false,
    includeState: false,
    timeoutMs: null,
    tmpRoot: process.env.SETI_AI_TMP_ROOT || os.tmpdir(),
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) continue;
    const [rawKey, inlineValue] = arg.slice(2).split("=");
    const value = inlineValue != null ? inlineValue : argv[index + 1];
    if (inlineValue == null && value != null && !String(value).startsWith("--")) index += 1;
    switch (rawKey) {
      case "seed":
        options.seed = value;
        break;
      case "games":
      case "activePlayerCount":
      case "maxSteps":
      case "stopBeforeRound":
      case "maxMovesPerTurn":
      case "stepDelayMs":
      case "maxBugRepeats":
      case "timeoutMs":
        options[rawKey] = Number(value);
        break;
      case "sequenceWindowTurns":
        options.sequenceWindowTurns = value === "all" ? "all" : Number(value);
        break;
      case "yieldEverySteps":
        options.yieldEverySteps = Number(value);
        break;
      case "stopOnBlocked":
        options.stopOnBlocked = value !== "false";
        break;
      case "strategyWeights":
        options.strategyWeights = JSON.parse(value);
        break;
      case "strategyTuning":
        options.strategyTuning = JSON.parse(value);
        break;
      case "mergeStrategyWeights":
        options.mergeStrategyWeights = value !== "false";
        break;
      case "resetStrategyWeights":
        options.resetStrategyWeights = true;
        if (inlineValue == null && value != null && !String(value).startsWith("--")) index -= 1;
        break;
      case "includeState":
        options.includeState = true;
        if (inlineValue == null && value != null && !String(value).startsWith("--")) index -= 1;
        break;
      case "headed":
        options.headless = false;
        if (inlineValue == null && value != null && !String(value).startsWith("--")) index -= 1;
        break;
      case "single":
        options.single = true;
        if (inlineValue == null && value != null && !String(value).startsWith("--")) index -= 1;
        break;
      case "chrome":
        options.chrome = value;
        break;
      case "out":
        options.out = value;
        break;
      case "tmpRoot":
        options.tmpRoot = value;
        break;
      default:
        throw new Error(`Unknown option --${rawKey}`);
    }
  }
  return options;
}

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".html") return "text/html; charset=utf-8";
  if (ext === ".js") return "application/javascript; charset=utf-8";
  if (ext === ".css") return "text/css; charset=utf-8";
  if (ext === ".json") return "application/json; charset=utf-8";
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".svg") return "image/svg+xml";
  return "application/octet-stream";
}

function startStaticServer(rootDir) {
  const server = http.createServer((request, response) => {
    const url = new URL(request.url, "http://127.0.0.1");
    const decoded = decodeURIComponent(url.pathname);
    const relative = decoded === "/" ? "randomizer/index.html" : decoded.replace(/^\/+/, "");
    const filePath = path.resolve(rootDir, relative);
    if (!filePath.startsWith(rootDir)) {
      response.writeHead(403);
      response.end("Forbidden");
      return;
    }
    fs.readFile(filePath, (error, data) => {
      if (error) {
        response.writeHead(404);
        response.end("Not found");
        return;
      }
      response.writeHead(200, { "content-type": getContentType(filePath) });
      response.end(data);
    });
  });
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      server.off("error", reject);
      resolve({
        server,
        port: server.address().port,
      });
    });
  });
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForJson(url, timeoutMs = 10000) {
  const deadline = Date.now() + timeoutMs;
  let lastError = null;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(2000) });
      if (response.ok) return response.json();
      lastError = new Error(`HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await delay(100);
  }
  throw lastError || new Error(`Timed out waiting for ${url}`);
}

async function waitFor(predicate, timeoutMs = 10000, intervalMs = 100) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const value = await predicate();
    if (value) return value;
    await delay(intervalMs);
  }
  return null;
}

class CdpClient {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.nextId = 1;
    this.pending = new Map();
    this.events = new Map();
  }

  async open() {
    await new Promise((resolve, reject) => {
      this.ws.addEventListener("open", resolve, { once: true });
      this.ws.addEventListener("error", reject, { once: true });
    });
    this.ws.addEventListener("message", (event) => this.handleMessage(event));
  }

  handleMessage(event) {
    const message = JSON.parse(event.data);
    if (message.id && this.pending.has(message.id)) {
      const { resolve, reject, timer } = this.pending.get(message.id);
      this.pending.delete(message.id);
      clearTimeout(timer);
      if (message.error) reject(new Error(message.error.message || JSON.stringify(message.error)));
      else resolve(message.result);
      return;
    }
    if (message.method && this.events.has(message.method)) {
      for (const listener of this.events.get(message.method)) listener(message.params || {});
    }
  }

  send(method, params = {}, timeoutMs = DEFAULT_CDP_TIMEOUT_MS) {
    const id = this.nextId++;
    const payload = JSON.stringify({ id, method, params });
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`CDP ${method} timed out after ${timeoutMs}ms`));
      }, timeoutMs);
      this.pending.set(id, { resolve, reject, timer });
      this.ws.send(payload);
    });
  }

  on(method, listener) {
    if (!this.events.has(method)) this.events.set(method, []);
    this.events.get(method).push(listener);
  }

  close() {
    this.ws.close();
  }
}

async function launchChrome(chromePath, remoteDebuggingPort, userDataDir, headless) {
  if (!fs.existsSync(chromePath)) {
    throw new Error(`Chrome not found: ${chromePath}`);
  }
  const args = [
    `--remote-debugging-port=${remoteDebuggingPort}`,
    `--user-data-dir=${userDataDir}`,
    "--disable-background-networking",
    "--disable-accelerated-2d-canvas",
    "--disable-accelerated-video-decode",
    "--disable-default-apps",
    "--disable-extensions",
    "--disable-gpu",
    "--disable-gpu-compositing",
    "--disable-gpu-rasterization",
    "--disable-gpu-sandbox",
    "--disable-features=CanvasOopRasterization,DawnGraphite,DefaultANGLEVulkan,SkiaGraphite,UseDawn,Vulkan,WebGPU,WebGPUDeveloperFeatures",
    "--disable-sync",
    "--disable-vulkan",
    "--in-process-gpu",
    "--use-angle=swiftshader",
    "--no-first-run",
    "--no-default-browser-check",
    "--no-sandbox",
    "about:blank",
  ];
  if (headless) args.unshift("--headless=new");
  const child = spawn(chromePath, args, {
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });
  let stderr = "";
  child.stderr.on("data", (chunk) => {
    stderr += chunk.toString();
  });
  child.stdout.resume();
  child.once("exit", (code) => {
    if (code && stderr) process.stderr.write(stderr);
  });
  return child;
}

async function getPageWebSocket(debugPort) {
  const list = await waitForJson(`http://127.0.0.1:${debugPort}/json/list`, 15000);
  const page = list.find((target) => target.type === "page" && target.webSocketDebuggerUrl);
  if (!page) throw new Error("No Chrome page target found");
  return page.webSocketDebuggerUrl;
}

function buildBatchStartExpression(pageOptions) {
  return `(() => {
    window.__setiAiBatchState = {
      done: false,
      result: null,
      error: null,
      progress: null,
      startedAt: Date.now(),
    };
    window.__setiAiBatchPromise = (async () => {
      let progressTimer = null;
      const updateProgress = () => {
        try {
          const report = window.SetiRandomizer?.getAiAutoBattleReport?.();
          window.__setiAiBatchState.progress = report
            ? {
              lastSummary: report.lastSummary || null,
              logCount: Array.isArray(report.logs) ? report.logs.length : 0,
              bugCount: Array.isArray(report.bugs) ? report.bugs.length : 0,
              pendingState: report.pendingState || null,
              tailLogs: Array.isArray(report.logs) ? report.logs.slice(-3) : [],
            }
            : null;
        } catch (error) {
          window.__setiAiBatchState.progress = {
            error: error?.message || String(error),
          };
        }
      };
      try {
        const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
        const started = Date.now();
        while (!window.SetiRandomizer?.runAiAutoBattleBatch) {
          if (Date.now() - started > 15000) {
            throw new Error("SetiRandomizer.runAiAutoBattleBatch not available");
          }
          await wait(100);
        }
        progressTimer = window.setInterval(updateProgress, 1000);
        updateProgress();
        await wait(0);
        const result = await window.SetiRandomizer.${pageOptions.single ? "startAiAutoBattle" : "runAiAutoBattleBatch"}(${JSON.stringify(pageOptions)});
        window.__setiAiBatchState.result = JSON.stringify(result);
      } catch (error) {
        window.__setiAiBatchState.error = {
          message: error?.message || String(error),
          stack: error?.stack || null,
        };
      } finally {
        if (progressTimer != null) window.clearInterval(progressTimer);
        updateProgress();
        window.__setiAiBatchState.done = true;
        window.__setiAiBatchState.finishedAt = Date.now();
      }
    })();
    return true;
  })()`;
}

async function runPageBatch(cdp, batchOptions, timeoutMs) {
  const started = await cdp.send("Runtime.evaluate", {
    expression: buildBatchStartExpression(batchOptions),
    returnByValue: true,
  });
  if (started.exceptionDetails) {
    throw new Error(started.exceptionDetails.text || "Runtime batch start failed");
  }

  const deadline = Date.now() + timeoutMs;
  let state = null;
  while (Date.now() < deadline) {
    const poll = await cdp.send("Runtime.evaluate", {
      expression: "JSON.stringify(window.__setiAiBatchState || null)",
      returnByValue: true,
    });
    if (poll.exceptionDetails) {
      throw new Error(poll.exceptionDetails.text || "Runtime batch poll failed");
    }
    state = poll.result?.value ? JSON.parse(poll.result.value) : null;
    if (state?.done) break;
    await delay(500);
  }

  if (!state?.done) {
    throw new Error(`Timed out waiting for AI auto battle result: ${JSON.stringify(state?.progress || null)}`);
  }
  if (state.error) {
    throw new Error(state.error.stack || state.error.message || "AI auto battle failed");
  }
  if (!state.result) {
    throw new Error("AI auto battle finished without a result");
  }
  return JSON.parse(state.result);
}

async function getPageAiDebugState(cdp) {
  const state = await cdp.send("Runtime.evaluate", {
    expression: "JSON.stringify(window.SetiRandomizer?.getAiDebugState?.() || null)",
    returnByValue: true,
  });
  if (state.exceptionDetails) {
    throw new Error(state.exceptionDetails.text || "Runtime debug state read failed");
  }
  return state.result?.value ? JSON.parse(state.result.value) : null;
}

function summarizeResult(result) {
  const getScoreForPlayer = (player, stoppedBeforeRound = null) => Number(
    stoppedBeforeRound
      ? player.resources?.score ?? player.baseScore ?? player.score ?? 0
      : player.finalScore || player.totalScore || player.score || player.resources?.score || 0,
  );
  if (Array.isArray(result.logs) && result.lastSummary) {
    const stoppedBeforeRound = Number(result.lastSummary.stoppedBeforeRound || 0) || null;
    const scores = (result.playerResults || []).map((player) => getScoreForPlayer(player, stoppedBeforeRound));
    return {
      ok: Boolean(result.lastSummary.ok && !result.lastSummary.blocked && (result.lastSummary.gameEnded || stoppedBeforeRound)),
      single: true,
      blocked: Boolean(result.lastSummary.blocked),
      gameEnded: Boolean(result.lastSummary.gameEnded),
      stoppedBeforeRound,
      steps: result.lastSummary.steps,
      maxScore: scores.length ? Math.max(...scores) : 0,
      minPlayerScore: scores.length ? Math.min(...scores) : 0,
      allPlayersAtLeast70: scores.length > 0 && scores.every((score) => score >= 70),
      playerScores: scores,
      bugCount: Array.isArray(result.bugs) ? result.bugs.length : 0,
      actionCounts: result.analysis?.actionCounts || null,
      opportunities: result.analysis?.opportunities || null,
      message: result.lastSummary.message || null,
    };
  }
  const playerScores = [];
  const minimumPlayerScores = [];
  for (const sample of result.samples || []) {
    const stoppedBeforeRound = Number(sample.summary?.stoppedBeforeRound || 0) || null;
    const sampleScores = [];
    for (const player of sample.playerResults || []) {
      const score = getScoreForPlayer(player, stoppedBeforeRound);
      playerScores.push(score);
      sampleScores.push(score);
    }
    minimumPlayerScores.push(sampleScores.length ? Math.min(...sampleScores) : 0);
  }
  const winnerScores = (result.samples || []).map((sample) => {
    const stoppedBeforeRound = Number(sample.summary?.stoppedBeforeRound || 0) || null;
    const scores = (sample.playerResults || []).map((player) => getScoreForPlayer(player, stoppedBeforeRound));
    return scores.length ? Math.max(...scores) : 0;
  });
  const stoppedBeforeRound = (result.samples || []).find((sample) => sample.summary?.stoppedBeforeRound)
    ?.summary?.stoppedBeforeRound || null;
  return {
    ok: Boolean(result.ok),
    gamesRequested: result.gamesRequested,
    gamesRun: result.gamesRun,
    stoppedEarly: Boolean(result.stoppedEarly),
    stoppedBeforeRound,
    blockedGames: (result.samples || []).filter((sample) => sample.summary?.blocked || sample.bugCount > 0).length,
    maxScore: playerScores.length ? Math.max(...playerScores) : 0,
    maxWinnerScore: winnerScores.length ? Math.max(...winnerScores) : 0,
    bestMinimumPlayerScore: minimumPlayerScores.length ? Math.max(...minimumPlayerScores) : 0,
    averageMinimumPlayerScore: minimumPlayerScores.length
      ? Math.round((minimumPlayerScores.reduce((total, score) => total + score, 0) / minimumPlayerScores.length) * 1000) / 1000
      : 0,
    averageWinnerScore: winnerScores.length
      ? Math.round((winnerScores.reduce((total, score) => total + score, 0) / winnerScores.length) * 1000) / 1000
      : 0,
    winnerScores,
    minimumPlayerScores,
    gamesAllPlayersAtLeast70: minimumPlayerScores.filter((score) => score >= 70).length,
    actionCounts: result.summary?.actionCounts || null,
    opportunities: result.summary?.opportunities || null,
    bugCounts: result.summary?.bugCounts || null,
    topScoreGaps: result.summary?.topScoreGaps || null,
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const debugPort = 10000 + Math.floor(Math.random() * 30000);
  const tmpRoot = path.resolve(options.tmpRoot || os.tmpdir());
  fs.mkdirSync(tmpRoot, { recursive: true });
  const userDataDir = fs.mkdtempSync(path.join(tmpRoot, "seti-ai-chrome-"));
  const { server, port: httpPort } = await startStaticServer(REPO_ROOT);
  const chrome = await launchChrome(options.chrome, debugPort, userDataDir, options.headless);
  let cdp = null;
  const pageUrl = `http://127.0.0.1:${httpPort}/randomizer/index.html?aiRun=${Date.now()}`;
  const consoleMessages = [];

  try {
    const wsUrl = await getPageWebSocket(debugPort);
    cdp = new CdpClient(wsUrl);
    await cdp.open();
    cdp.on("Runtime.consoleAPICalled", (params) => {
      consoleMessages.push({
        type: params.type,
        text: (params.args || []).map((arg) => arg.value ?? arg.description ?? "").join(" "),
      });
    });
    await cdp.send("Page.enable");
    await cdp.send("Network.enable");
    await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
    await cdp.send("Runtime.enable");
    await cdp.send("Page.navigate", { url: pageUrl });
    const pageReady = await waitFor(async () => {
      const ready = await cdp.send("Runtime.evaluate", {
        expression: "document.readyState === 'complete' && Boolean(window.SetiRandomizer?.runAiAutoBattleBatch)",
        returnByValue: true,
      });
      return ready.result?.value === true;
    }, 60000);
    if (!pageReady) {
      throw new Error("Timed out waiting for SetiRandomizer.runAiAutoBattleBatch");
    }

    const batchOptions = {
      seed: options.seed,
      games: options.games,
      activePlayerCount: options.activePlayerCount,
      maxSteps: options.maxSteps,
      stopBeforeRound: options.stopBeforeRound || undefined,
      maxMovesPerTurn: options.maxMovesPerTurn || undefined,
      stepDelayMs: options.stepDelayMs,
      maxBugRepeats: options.maxBugRepeats,
      sequenceWindowTurns: options.sequenceWindowTurns,
      yieldEverySteps: options.yieldEverySteps,
      stopOnBlocked: options.stopOnBlocked,
      strategyWeights: options.strategyWeights || undefined,
      strategyTuning: options.strategyTuning || undefined,
      mergeStrategyWeights: options.strategyWeights ? options.mergeStrategyWeights : undefined,
      resetStrategyWeights: options.resetStrategyWeights || undefined,
      single: options.single,
      reset: options.single ? true : undefined,
    };
    const timeoutMs = options.timeoutMs || Math.max(300000, options.games * options.maxSteps * 180);
    const result = await runPageBatch(cdp, batchOptions, timeoutMs);
    const debugState = options.includeState ? await getPageAiDebugState(cdp) : null;
    const summary = summarizeResult(result);
    const output = {
      options: batchOptions,
      pageUrl,
      summary,
      result,
      consoleMessages: consoleMessages.slice(-50),
    };
    if (options.includeState) output.debugState = debugState;
    if (options.out) {
      fs.mkdirSync(path.dirname(path.resolve(options.out)), { recursive: true });
      fs.writeFileSync(options.out, JSON.stringify(output, null, 2));
    }
    process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
  } finally {
    if (cdp) cdp.close();
    server.close();
    if (chrome.pid && process.platform === "win32") {
      const killResult = spawnSync("taskkill", ["/PID", String(chrome.pid), "/T", "/F"], {
        stdio: "ignore",
        timeout: 5000,
      });
      if (killResult.error) chrome.kill();
    } else {
      chrome.kill();
    }
    chrome.stdout?.destroy?.();
    chrome.stderr?.destroy?.();
    chrome.unref?.();
    for (let attempt = 0; attempt < 10; attempt += 1) {
      try {
        fs.rmSync(userDataDir, { recursive: true, force: true });
        break;
      } catch (error) {
        if (attempt === 9) {
          process.stderr.write(`Warning: could not remove temp Chrome profile ${userDataDir}: ${error.message}\n`);
          break;
        }
        await delay(200);
      }
    }
  }
}

main().catch((error) => {
  console.error(error.stack || error.message || String(error));
  process.exitCode = 1;
});
