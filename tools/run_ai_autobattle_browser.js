#!/usr/bin/env node
"use strict";

const fs = require("fs");
const http = require("http");
const os = require("os");
const path = require("path");
const { spawn, spawnSync } = require("child_process");

const REPO_ROOT = path.resolve(__dirname, "..");
const DEFAULT_CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

function parseArgs(argv) {
  const options = {
    seed: "ai-v2-baseline",
    games: 5,
    activePlayerCount: 2,
    maxSteps: 2500,
    stepDelayMs: 0,
    maxBugRepeats: 1,
    sequenceWindowTurns: 6,
    stopOnBlocked: true,
    headless: true,
    single: false,
    out: null,
    chrome: process.env.CHROME_PATH || DEFAULT_CHROME,
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
      case "stepDelayMs":
      case "maxBugRepeats":
        options[rawKey] = Number(value);
        break;
      case "sequenceWindowTurns":
        options.sequenceWindowTurns = value === "all" ? "all" : Number(value);
        break;
      case "stopOnBlocked":
        options.stopOnBlocked = value !== "false";
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
      const response = await fetch(url);
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
      const { resolve, reject } = this.pending.get(message.id);
      this.pending.delete(message.id);
      if (message.error) reject(new Error(message.error.message || JSON.stringify(message.error)));
      else resolve(message.result);
      return;
    }
    if (message.method && this.events.has(message.method)) {
      for (const listener of this.events.get(message.method)) listener(message.params || {});
    }
  }

  send(method, params = {}) {
    const id = this.nextId++;
    const payload = JSON.stringify({ id, method, params });
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
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
    "--disable-default-apps",
    "--disable-extensions",
    "--disable-gpu",
    "--disable-sync",
    "--no-first-run",
    "--no-default-browser-check",
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

function buildBatchExpression(pageOptions) {
  return `(async () => {
    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    const started = Date.now();
    while (!window.SetiRandomizer?.runAiAutoBattleBatch) {
      if (Date.now() - started > 15000) {
        throw new Error("SetiRandomizer.runAiAutoBattleBatch not available");
      }
      await wait(100);
    }
    const result = await window.SetiRandomizer.${pageOptions.single ? "startAiAutoBattle" : "runAiAutoBattleBatch"}(${JSON.stringify(pageOptions)});
    return JSON.stringify(result);
  })()`;
}

function summarizeResult(result) {
  if (Array.isArray(result.logs) && result.lastSummary) {
    const scores = (result.playerResults || []).map((player) => Number(player.finalScore || player.totalScore || player.score || 0));
    return {
      ok: Boolean(result.lastSummary.ok && !result.lastSummary.blocked && result.lastSummary.gameEnded),
      single: true,
      blocked: Boolean(result.lastSummary.blocked),
      gameEnded: Boolean(result.lastSummary.gameEnded),
      steps: result.lastSummary.steps,
      maxScore: scores.length ? Math.max(...scores) : 0,
      playerScores: scores,
      bugCount: Array.isArray(result.bugs) ? result.bugs.length : 0,
      actionCounts: result.analysis?.actionCounts || null,
      opportunities: result.analysis?.opportunities || null,
      message: result.lastSummary.message || null,
    };
  }
  const playerScores = [];
  for (const sample of result.samples || []) {
    for (const player of sample.playerResults || []) {
      playerScores.push(Number(player.finalScore || player.totalScore || player.score || 0));
    }
  }
  const winnerScores = (result.samples || []).map((sample) => {
    const scores = (sample.playerResults || []).map((player) => Number(player.finalScore || player.totalScore || player.score || 0));
    return scores.length ? Math.max(...scores) : 0;
  });
  return {
    ok: Boolean(result.ok),
    gamesRequested: result.gamesRequested,
    gamesRun: result.gamesRun,
    stoppedEarly: Boolean(result.stoppedEarly),
    blockedGames: (result.samples || []).filter((sample) => sample.summary?.blocked || sample.bugCount > 0).length,
    maxScore: playerScores.length ? Math.max(...playerScores) : 0,
    maxWinnerScore: winnerScores.length ? Math.max(...winnerScores) : 0,
    averageWinnerScore: winnerScores.length
      ? Math.round((winnerScores.reduce((total, score) => total + score, 0) / winnerScores.length) * 1000) / 1000
      : 0,
    winnerScores,
    actionCounts: result.summary?.actionCounts || null,
    opportunities: result.summary?.opportunities || null,
    bugCounts: result.summary?.bugCounts || null,
    topScoreGaps: result.summary?.topScoreGaps || null,
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const debugPort = 10000 + Math.floor(Math.random() * 30000);
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "seti-ai-chrome-"));
  const { server, port: httpPort } = await startStaticServer(REPO_ROOT);
  const chrome = await launchChrome(options.chrome, debugPort, userDataDir, options.headless);
  const pageUrl = `http://127.0.0.1:${httpPort}/randomizer/index.html`;
  const consoleMessages = [];

  try {
    const wsUrl = await getPageWebSocket(debugPort);
    const cdp = new CdpClient(wsUrl);
    await cdp.open();
    cdp.on("Runtime.consoleAPICalled", (params) => {
      consoleMessages.push({
        type: params.type,
        text: (params.args || []).map((arg) => arg.value ?? arg.description ?? "").join(" "),
      });
    });
    await cdp.send("Page.enable");
    await cdp.send("Runtime.enable");
    await cdp.send("Page.navigate", { url: pageUrl });
    const pageReady = await waitFor(async () => {
      const ready = await cdp.send("Runtime.evaluate", {
        expression: "document.readyState === 'complete' && Boolean(window.SetiRandomizer?.runAiAutoBattleBatch)",
        returnByValue: true,
      });
      return ready.result?.value === true;
    }, 20000);
    if (!pageReady) {
      throw new Error("Timed out waiting for SetiRandomizer.runAiAutoBattleBatch");
    }

    const batchOptions = {
      seed: options.seed,
      games: options.games,
      activePlayerCount: options.activePlayerCount,
      maxSteps: options.maxSteps,
      stepDelayMs: options.stepDelayMs,
      maxBugRepeats: options.maxBugRepeats,
      sequenceWindowTurns: options.sequenceWindowTurns,
      stopOnBlocked: options.stopOnBlocked,
      single: options.single,
      reset: options.single ? true : undefined,
    };
    const evaluation = await cdp.send("Runtime.evaluate", {
      expression: buildBatchExpression(batchOptions),
      awaitPromise: true,
      returnByValue: true,
      timeout: Math.max(30000, options.games * options.maxSteps * 20),
    });
    if (evaluation.exceptionDetails) {
      throw new Error(evaluation.exceptionDetails.text || "Runtime evaluation failed");
    }
    const result = JSON.parse(evaluation.result.value);
    const summary = summarizeResult(result);
    const output = {
      options: batchOptions,
      pageUrl,
      summary,
      result,
      consoleMessages: consoleMessages.slice(-50),
    };
    if (options.out) {
      fs.mkdirSync(path.dirname(path.resolve(options.out)), { recursive: true });
      fs.writeFileSync(options.out, JSON.stringify(output, null, 2));
    }
    process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
    cdp.close();
  } finally {
    server.close();
    if (chrome.pid && process.platform === "win32") {
      spawnSync("taskkill", ["/PID", String(chrome.pid), "/T", "/F"], { stdio: "ignore" });
    } else {
      chrome.kill();
    }
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
