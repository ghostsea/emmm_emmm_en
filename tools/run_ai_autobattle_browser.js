#!/usr/bin/env node
"use strict";

const fs = require("fs");
const http = require("http");
const os = require("os");
const path = require("path");
const { spawn, spawnSync } = require("child_process");
const { buildIndependentAlienSeedScript } = require("./ai_alien_seed.js");

const REPO_ROOT = path.resolve(__dirname, "..");
const DEFAULT_CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const DEFAULT_CDP_TIMEOUT_MS = 45000;
const MAX_BATCH_CDP_EVALUATE_TIMEOUT_MS = 300000;
// Both Chromium navigation and Node's fetch must accept the debugging endpoint.
const CHROMIUM_RESTRICTED_PORTS = new Set([
  1, 7, 9, 11, 13, 15, 17, 19, 20, 21, 22, 23, 25, 37, 42, 43, 53, 69, 77, 79,
  87, 95, 101, 102, 103, 104, 109, 110, 111, 113, 115, 117, 119, 123, 135, 137,
  139, 143, 161, 179, 389, 427, 465, 512, 513, 514, 515, 526, 530, 531, 532, 540,
  548, 554, 556, 563, 587, 601, 636, 989, 990, 993, 995, 1719, 1720, 1723, 2049,
  3659, 4045, 4190, 5060, 5061, 6000, 6566, 6679, 6697, 10080,
  ...Array.from({ length: 5 }, (_item, index) => 6665 + index),
]);

class AiAutoBattleTimeoutError extends Error {
  constructor(message, state = null) {
    super(message);
    this.name = "AiAutoBattleTimeoutError";
    this.state = state;
  }
}

function getBatchCdpEvaluateTimeoutMs(timeoutMs) {
  const budgetMs = Number.isFinite(timeoutMs) && timeoutMs > 0
    ? timeoutMs
    : DEFAULT_CDP_TIMEOUT_MS;
  return Math.max(DEFAULT_CDP_TIMEOUT_MS, Math.min(MAX_BATCH_CDP_EVALUATE_TIMEOUT_MS, budgetMs));
}

function parseArgs(argv) {
  let seedOptionSeen = false;
  let seedsOptionSeen = false;
  const options = {
    seed: "ai-v2-baseline",
    alienSeed: null,
    seeds: null,
    games: 5,
    activePlayerCount: 4,
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
    aiDifficulty: null,
    includeState: false,
    includeLogs: false,
    lightweight: false,
    sampleDiagnostics: false,
    timeoutMs: null,
    tmpRoot: process.env.SETI_AI_TMP_ROOT || os.tmpdir(),
    root: REPO_ROOT,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) continue;
    const [rawKey, inlineValue] = arg.slice(2).split("=");
    const value = inlineValue != null ? inlineValue : argv[index + 1];
    if (inlineValue == null && value != null && !String(value).startsWith("--")) index += 1;
    switch (rawKey) {
      case "seed":
        seedOptionSeen = true;
        options.seed = value;
        break;
      case "alienSeed":
        if (!value || String(value).startsWith("--")) throw new Error("--alienSeed requires a value");
        options.alienSeed = String(value);
        break;
      case "seeds":
        seedsOptionSeen = true;
        options.seeds = String(value || "")
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);
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
      case "aiDifficulty":
        options.aiDifficulty = value;
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
      case "includeLogs":
        options.includeLogs = true;
        if (inlineValue == null && value != null && !String(value).startsWith("--")) index -= 1;
        break;
      case "lightweight":
        options.lightweight = true;
        if (inlineValue == null && value != null && !String(value).startsWith("--")) index -= 1;
        break;
      case "sampleDiagnostics":
        options.sampleDiagnostics = true;
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
      case "root":
        options.root = value;
        break;
      default:
        throw new Error(`Unknown option --${rawKey}`);
    }
  }
  if (options.single && seedOptionSeen && seedsOptionSeen) {
    throw new Error("--single accepts either --seed or --seeds, not both");
  }
  if (options.single && seedsOptionSeen) {
    if (options.seeds.length !== 1) {
      throw new Error("--single requires exactly one seed when using --seeds");
    }
    [options.seed] = options.seeds;
    options.seeds = null;
  }
  if (options.alienSeed !== null && !options.single) throw new Error("--alienSeed requires --single");
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

async function startStaticServer(rootDir) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
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
    const port = await new Promise((resolve, reject) => {
      server.once("error", reject);
      server.listen(0, "127.0.0.1", () => {
        server.off("error", reject);
        resolve(server.address().port);
      });
    });
    if (!CHROMIUM_RESTRICTED_PORTS.has(port)) {
      return { server, port };
    }
    await new Promise((resolve) => server.close(resolve));
  }
  throw new Error("Unable to bind a Chromium-safe local server port");
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

function waitForChildExit(child, timeoutMs = 5000) {
  if (!child || child.exitCode != null || child.signalCode != null) return Promise.resolve(true);
  return new Promise((resolve) => {
    const onExit = () => {
      clearTimeout(timer);
      resolve(true);
    };
    const timer = setTimeout(() => {
      child.off("exit", onExit);
      resolve(false);
    }, timeoutMs);
    child.once("exit", onExit);
  });
}

async function terminateChrome(chrome) {
  if (!chrome?.pid || await waitForChildExit(chrome, 100)) return true;
  if (process.platform === "win32") {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      spawnSync("taskkill", ["/PID", String(chrome.pid), "/T", "/F"], {
        stdio: "ignore",
        timeout: 15000,
        windowsHide: true,
      });
      if (await waitForChildExit(chrome, 1500)) return true;
    }
  }
  try {
    chrome.kill("SIGKILL");
  } catch (_error) {
    // The process may have exited between the last check and this fallback.
  }
  return waitForChildExit(chrome, 3000);
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
          const progress = window.SetiRandomizer?.getAiAutoBattleProgress?.();
          window.__setiAiBatchState.progress = progress
            ? {
              lastSummary: progress.lastSummary || null,
              logCount: Number(progress.logCount) || 0,
              bugCount: Number(progress.bugCount) || 0,
              pendingState: progress.pendingState || null,
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
  const batchEvaluateTimeoutMs = getBatchCdpEvaluateTimeoutMs(timeoutMs);
  const started = await cdp.send("Runtime.evaluate", {
    expression: buildBatchStartExpression(batchOptions),
    returnByValue: true,
  }, batchEvaluateTimeoutMs);
  if (started.exceptionDetails) {
    throw new Error(started.exceptionDetails.text || "Runtime batch start failed");
  }

  const deadline = Date.now() + timeoutMs;
  let state = null;
  let lastPollError = null;
  while (Date.now() < deadline) {
    const remainingMs = Math.max(1000, deadline - Date.now());
    // Busy AI turns can starve CDP evaluation; keep a usable poll window even near the outer deadline.
    const pollTimeoutMs = Math.min(batchEvaluateTimeoutMs, Math.max(DEFAULT_CDP_TIMEOUT_MS, remainingMs));
    let poll = null;
    try {
      poll = await cdp.send("Runtime.evaluate", {
        expression: "JSON.stringify(window.__setiAiBatchState || null)",
        returnByValue: true,
      }, pollTimeoutMs);
    } catch (error) {
      lastPollError = error;
      await delay(1000);
      continue;
    }
    if (poll.exceptionDetails) {
      throw new Error(poll.exceptionDetails.text || "Runtime batch poll failed");
    }
    lastPollError = null;
    state = poll.result?.value ? JSON.parse(poll.result.value) : null;
    if (state?.done) break;
    await delay(500);
  }

  if (!state?.done) {
    const pollErrorText = lastPollError ? `; last poll error: ${lastPollError.message || String(lastPollError)}` : "";
    throw new AiAutoBattleTimeoutError(
      `Timed out waiting for AI auto battle result: ${JSON.stringify(state?.progress || null)}${pollErrorText}`,
      state,
    );
  }
  if (state.error) {
    throw new Error(state.error.stack || state.error.message || "AI auto battle failed");
  }
  if (!state.result) {
    throw new Error("AI auto battle finished without a result");
  }
  return JSON.parse(state.result);
}

function writeJsonOutput(filePath, output) {
  if (!filePath) return;
  fs.mkdirSync(path.dirname(path.resolve(filePath)), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(output, null, 2));
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
      resourceFlow: result.resourceFlow?.headline || result.resourceFlow?.coverage || null,
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
    resourceFlow: result.resourceFlow?.headline || result.resourceFlow?.coverage || null,
  };
}

function summarizeTimeoutState(state = null, error = null) {
  const progress = state?.progress || {};
  const lastSummary = progress.lastSummary || {};
  return {
    ok: false,
    timedOut: true,
    single: null,
    blocked: Boolean(lastSummary.blocked),
    gameEnded: Boolean(lastSummary.gameEnded),
    stoppedBeforeRound: lastSummary.stoppedBeforeRound || null,
    steps: lastSummary.steps || null,
    logCount: Number(progress.logCount || 0),
    bugCount: Number(progress.bugCount || 0),
    pendingState: progress.pendingState || null,
    message: error?.message || "Timed out waiting for AI auto battle result",
  };
}

function parseDevToolsPort(text) {
  const port = Number(String(text).split(/\r?\n/, 1)[0]);
  if (!Number.isInteger(port) || port <= 0 || port > 65535 || CHROMIUM_RESTRICTED_PORTS.has(port)) {
    const error = new Error(`Invalid or restricted Chrome debugging port: ${port}`);
    if (CHROMIUM_RESTRICTED_PORTS.has(port)) error.code = "CHROME_RESTRICTED_DEBUG_PORT";
    throw error;
  }
  return port;
}

async function getChromeDebugPort(userDataDir, readPortFile = (file) => fs.readFileSync(file, "utf8")) {
  const portFile = path.join(userDataDir, "DevToolsActivePort");
  const port = await waitFor(() => {
    try {
      const text = readPortFile(portFile);
      return text.trim() ? parseDevToolsPort(text) : null;
    } catch (error) {
      if (error.code === "ENOENT" || error.code === "EBUSY") return null;
      throw error;
    }
  });
  if (!port) throw new Error("Chrome did not publish its debugging port before startup timed out");
  return port;
}

async function launchChromeWithSafeDebugPort(options, userDataDir, overrides = {}) {
  const runtime = { launchChrome, getChromeDebugPort, terminateChrome,
    clearPortFile: () => fs.rmSync(path.join(userDataDir, "DevToolsActivePort"), { force: true }),
    ...overrides };
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const chrome = await runtime.launchChrome(options.chrome, 0, userDataDir, options.headless);
    try {
      const debugPort = await runtime.getChromeDebugPort(userDataDir);
      return { chrome, debugPort };
    } catch (error) {
      const exited = await runtime.terminateChrome(chrome);
      chrome.stdout?.destroy?.();
      chrome.stderr?.destroy?.();
      chrome.unref?.();
      if (!exited) throw new Error(`Could not stop failed Chrome startup ${chrome.pid}`, { cause: error });
      if (error.code !== "CHROME_RESTRICTED_DEBUG_PORT" || attempt === 4) throw error;
      runtime.clearPortFile();
    }
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const tmpRoot = path.resolve(options.tmpRoot || os.tmpdir());
  const repoRoot = path.resolve(options.root || REPO_ROOT);
  if (!fs.existsSync(path.join(repoRoot, "randomizer", "index.html"))) {
    throw new Error(`Invalid repository root: ${repoRoot}`);
  }
  fs.mkdirSync(tmpRoot, { recursive: true });
  const userDataDir = fs.mkdtempSync(path.join(tmpRoot, "seti-ai-chrome-"));
  const { server, port: httpPort } = await startStaticServer(repoRoot);
  // Chrome binds an OS-selected free port and publishes it in this fresh profile.
  // Random ports could collide or select fetch-blocked ports such as 10080.
  let chrome = null;
  let cdp = null;
  const pageUrl = `http://127.0.0.1:${httpPort}/randomizer/index.html?aiRun=${Date.now()}`;
  const consoleMessages = [];

  try {
    const started = await launchChromeWithSafeDebugPort(options, userDataDir);
    chrome = started.chrome;
    const debugPort = started.debugPort;
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
    if (options.alienSeed !== null) {
      await cdp.send("Page.addScriptToEvaluateOnNewDocument", {
        source: buildIndependentAlienSeedScript(options.alienSeed),
      });
    }
    await cdp.send("Page.navigate", { url: pageUrl });
    const pageReady = await waitFor(async () => {
      const ready = await cdp.send("Runtime.evaluate", {
        expression: "document.readyState === 'complete' && Boolean(window.SetiRandomizer?.runAiAutoBattleBatch)",
        returnByValue: true,
      });
      return ready.result?.value === true;
    }, 60000);
    if (!pageReady) {
      const startupState = await cdp.send("Runtime.evaluate", {
        expression: `JSON.stringify({
          readyState: document.readyState,
          hasSetiRandomizer: Boolean(window.SetiRandomizer),
          hasBatch: Boolean(window.SetiRandomizer?.runAiAutoBattleBatch),
          bodyText: String(document.body?.innerText || "").slice(0, 500),
        })`,
        returnByValue: true,
      }).catch(() => null);
      throw new Error(
        `Timed out waiting for SetiRandomizer.runAiAutoBattleBatch; startup=${startupState?.result?.value || "unavailable"}; console=${JSON.stringify(consoleMessages.slice(-10))}`,
      );
    }

    const batchOptions = {
      seed: options.seed,
      ...(options.alienSeed !== null ? { alienSeed: options.alienSeed, alienRandomMode: "independent-slots-v1" } : {}),
      seeds: options.seeds?.length ? options.seeds : undefined,
      games: options.games,
      activePlayerCount: options.activePlayerCount,
      aiDifficulty: options.aiDifficulty || undefined,
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
      includeLogs: options.includeLogs || undefined,
      retainAnalysis: options.lightweight || options.sampleDiagnostics ? false : undefined,
      includeSampleDiagnostics: options.lightweight ? false : options.sampleDiagnostics ? true : undefined,
      single: options.single,
      reset: options.single ? true : undefined,
    };
    const timeoutMs = options.timeoutMs || Math.max(300000, options.games * options.maxSteps * 180);
    try {
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
      writeJsonOutput(options.out, output);
      process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
    } catch (error) {
      if (error instanceof AiAutoBattleTimeoutError) {
        writeJsonOutput(options.out, {
          options: batchOptions,
          pageUrl,
          summary: summarizeTimeoutState(error.state, error),
          result: null,
          partialState: error.state || null,
          error: {
            name: error.name,
            message: error.message,
            stack: error.stack || null,
          },
          consoleMessages: consoleMessages.slice(-50),
        });
      }
      throw error;
    }
  } finally {
    if (cdp) {
      await cdp.send("Browser.close", {}, 5000).catch(() => null);
      cdp.close();
    }
    server.close();
    const chromeExited = chrome ? await terminateChrome(chrome) : true;
    if (!chromeExited) {
      process.stderr.write(`Warning: could not confirm Chrome process ${chrome.pid} exited\n`);
    }
    chrome?.stdout?.destroy?.();
    chrome?.stderr?.destroy?.();
    chrome?.unref?.();
    const cleanupAttempts = 20;
    for (let attempt = 0; attempt < cleanupAttempts; attempt += 1) {
      try {
        fs.rmSync(userDataDir, { recursive: true, force: true });
        break;
      } catch (error) {
        if (attempt === cleanupAttempts - 1) {
          process.stderr.write(`Warning: could not remove temp Chrome profile ${userDataDir}: ${error.message}\n`);
          break;
        }
        await delay(500);
      }
    }
  }
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error.stack || error.message || String(error));
      process.exit(1);
    });
}

module.exports = {
  parseArgs,
  parseDevToolsPort,
  getChromeDebugPort,
  launchChromeWithSafeDebugPort,
};
