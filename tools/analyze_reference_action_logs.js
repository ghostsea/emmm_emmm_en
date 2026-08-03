const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const resourceFlow = require("../randomizer/game/ai/resource-flow");

const ENTRY_RE = /^### #(\d+) (.+?) - (.+?) - (.+)$/;
const ROUND_RE = /^第(\d+)轮 第(\d+)回合$/;
const STEP_RE = /^- \[(setup|main|quick)\] (.+)$/;
const SCORE_ROW_RE = /^\|\s*([^|]+?)\s*\|\s*(-?\d+(?:\.\d+)?)\s*\|/;
const ROUTE_ROW_RE = /^\|\s*([^|]+?)\s*\|\s*([^|]*?)\s*\|\s*(\d+)\s*\|\s*(\d+)\s*\|/;
const KNOWN_ALIENS = Object.freeze([
  "九折",
  "异常点",
  "半人马",
  "方舟",
  "虫",
  "阿米巴",
  "奥陌陌",
  "符文族",
]);
const KNOWN_PLAYER_LABELS = Object.freeze(["白色", "棕色", "绿色", "蓝色"]);

function addResourceMaps(...maps) {
  const result = {};
  for (const map of maps) {
    for (const [key, value] of Object.entries(map || {})) {
      const numericValue = Number(value) || 0;
      if (numericValue === 0) continue;
      result[key] = (Number(result[key]) || 0) + numericValue;
    }
  }
  return result;
}

function normalizeMarkdown(markdown) {
  return String(markdown || "").replace(/\r\n?/g, "\n").trim();
}

function hashMarkdown(markdown) {
  const normalized = normalizeMarkdown(markdown);
  const scoreSectionIndex = normalized.indexOf("## 终局分数");
  const stableContent = scoreSectionIndex >= 0 ? normalized.slice(scoreSectionIndex) : normalized;
  return crypto.createHash("sha256").update(stableContent, "utf8").digest("hex");
}

function findKnownAlien(text) {
  return KNOWN_ALIENS.find((alien) => String(text || "").includes(alien)) || null;
}

function findExplicitRecipientDelta(text) {
  const playerAlternation = KNOWN_PLAYER_LABELS.join("|");
  const resourceToken = "(?:分数|信用点|能量|宣传|数据|手牌)\\s*[+-]\\d+(?:\\.\\d+)?";
  const pattern = new RegExp(
    `(${playerAlternation})\\s+(${resourceToken}(?:[、，]\\s*${resourceToken})*)`,
    "g",
  );
  let match;
  let lastMatch = null;
  while ((match = pattern.exec(text))) lastMatch = match;
  return lastMatch ? { playerLabel: lastMatch[1], deltaText: lastMatch[2] } : null;
}

function resolveRecipient(text, entryOwner, playerLabels) {
  const explicit = findExplicitRecipientDelta(text);
  if (explicit) return explicit.playerLabel;
  const knownLabels = playerLabels.join("|");
  const setupRecipient = text.match(new RegExp(`(?:结算初始效果：|^)(?:\\s*)(${knownLabels})(?=\\s|：)`));
  if (setupRecipient) return setupRecipient[1];
  const acquisitionRecipient = text.match(new RegExp(`(?:^|[：；])\\s*(${knownLabels})(?=获得)`));
  if (acquisitionRecipient) return acquisitionRecipient[1];
  return entryOwner;
}

function extractCards(text, sourceCategory) {
  const cards = [];
  const seen = new Set();
  const defaultGainOrigin = sourceCategory === "setup"
    ? "setup"
    : (sourceCategory === "industry" ? "industry" : "normal");

  function pushCard(card) {
    const label = String(card.label || card.key || "未知牌").trim();
    const key = String(card.key || label).trim();
    const identity = `${card.change}:${key}:${card.origin}`;
    if (seen.has(identity)) return;
    seen.add(identity);
    cards.push({ key, label, change: card.change, origin: card.origin });
  }

  const played = text.match(/打出：([^：；，]+)/);
  if (played) {
    pushCard({ key: played[1], label: played[1], change: "play", origin: "normal" });
  }

  const gainedPattern = /获得卡牌：([^，；]+)/g;
  let gained;
  while ((gained = gainedPattern.exec(text))) {
    pushCard({ key: gained[1], label: gained[1], change: "gain", origin: defaultGainOrigin });
  }

  const alienGainPattern = /(?:获得|盲抽)(?:半人马|阿米巴|方舟|九折|异常点|虫|奥陌陌|符文族)牌：([^，；]+)/g;
  let alienGain;
  while ((alienGain = alienGainPattern.exec(text))) {
    pushCard({ key: alienGain[1], label: alienGain[1], change: "gain", origin: "alien" });
  }

  const blindPattern = /盲抽(?!翻出新牌)\s+([^；;]+)/g;
  let blind;
  let blindIndex = 0;
  while ((blind = blindPattern.exec(text))) {
    const progress = blind[1].match(/^(\d+)\/(\d+)\s*张/);
    if (progress) {
      for (let index = 0; index < Number(progress[2]); index += 1) {
        blindIndex += 1;
        pushCard({
          key: `unknown-blind:${blindIndex}:${text}`,
          label: "盲抽未知牌",
          change: "gain",
          origin: defaultGainOrigin,
        });
      }
    } else {
      const label = blind[1].split(/[，；]/)[0].trim();
      pushCard({ key: label, label, change: "gain", origin: defaultGainOrigin });
    }
  }

  const selectedPattern = /(?:PASS\s*精选|快速交易精选|卡牌触发精选)：([^，；]+)/g;
  let selected;
  while ((selected = selectedPattern.exec(text))) {
    pushCard({ key: selected[1], label: selected[1], change: "gain", origin: "normal" });
  }

  const industrySelectedPattern = /(?:宇宙战略集团|宇宙大战略集团)：[^；]*?精选\s+([^，；]+)/g;
  let industrySelected;
  while ((industrySelected = industrySelectedPattern.exec(text))) {
    pushCard({
      key: industrySelected[1],
      label: industrySelected[1],
      change: "gain",
      origin: "industry",
    });
  }

  const income = text.match(/收入：弃掉\s+([^，；]+)/);
  if (income) {
    pushCard({ key: income[1], label: income[1], change: "income", origin: "normal" });
  } else if (/弃牌换1移动/.test(text)) {
    pushCard({ key: `move-payment:${text}`, label: "未知弃牌", change: "move_payment", origin: "normal" });
  } else if (/弃牌|弃掉|弃除手牌/.test(text)) {
    const discarded = text.match(/(?:弃牌|弃掉|弃除手牌)\s*([^，；：]*)/);
    const label = discarded?.[1]?.trim() || "未知弃牌";
    pushCard({ key: label, label, change: "discard", origin: "normal" });
  }
  return cards;
}

const IMPLICIT_RESOURCE_LABELS = Object.freeze({
  分: "score",
  信用点: "credits",
  能量: "energy",
  宣传: "publicity",
  数据: "availableData",
});

function collectUnsignedResources(text) {
  const result = {};
  const tokenPattern = /(\d+(?:\.\d+)?)\s*(信用点|能量|宣传|数据|分)(?![母钟之一二三四五六七八九十])/g;
  let token;
  while ((token = tokenPattern.exec(text))) {
    const key = IMPLICIT_RESOURCE_LABELS[token[2]];
    result[key] = (Number(result[key]) || 0) + Number(token[1]);
  }
  return result;
}

function countBlindDraws(text) {
  let count = 0;
  const pattern = /盲抽(?!翻出新牌)\s+([^；;]+)/g;
  let match;
  while ((match = pattern.exec(text))) {
    const progress = match[1].match(/^(\d+)\/(\d+)\s*张/);
    count += progress ? Number(progress[2]) : 1;
  }
  return count;
}

function countMatches(text, pattern) {
  return [...text.matchAll(pattern)].length;
}

function normalizeReferenceStep(text, context = {}) {
  const fullParsed = resourceFlow.parseDeltaText(text);
  const explicitRecipientDelta = findExplicitRecipientDelta(text);
  const parsed = explicitRecipientDelta && !/(?:资源|收入)\s*[:：]/.test(text)
    ? {
      ...resourceFlow.parseDeltaText(explicitRecipientDelta.deltaText),
      incomeDeltas: fullParsed.incomeDeltas,
    }
    : fullParsed;
  const incomeDeltas = { ...parsed.incomeDeltas };
  const resourceDeltas = addResourceMaps(parsed.resourceDeltas, incomeDeltas);
  const initialIncome = text.match(/初始收入水平\s+([^；;]+)/);
  if (initialIncome) {
    const incomePattern = /(credits|energy|publicity|availableData|handSize)\+(-?\d+(?:\.\d+)?)/g;
    let incomeToken;
    while ((incomeToken = incomePattern.exec(initialIncome[1]))) {
      incomeDeltas[incomeToken[1]] = Number(incomeToken[2]);
    }
  }

  if (context.pace === "setup") {
    const setupGains = {};
    const acquisitionPattern = /获得\s+([^；;]+)/g;
    let acquisition;
    while ((acquisition = acquisitionPattern.exec(text))) {
      Object.assign(setupGains, addResourceMaps(setupGains, collectUnsignedResources(acquisition[1])));
    }
    if (Object.keys(setupGains).length === 0) {
      const reward = text.match(/(?:奖励|效果)：([^；;]+)/);
      if (reward) Object.assign(setupGains, collectUnsignedResources(reward[1]));
    }
    for (const [key, value] of Object.entries(setupGains)) {
      if (!Number(resourceDeltas[key])) resourceDeltas[key] = value;
    }
  }

  const dataProgress = text.match(/获得\s+(?:\d+\/)?(\d+)\s*个数据/);
  if (dataProgress && !Number(resourceDeltas.availableData)) {
    resourceDeltas.availableData = Number(dataProgress[1]);
  }
  if (!Number(resourceDeltas.availableData)) {
    const cardTriggerData = text.match(/卡牌触发[^；;]*?[，：]\s*(\d+)\s*数据/);
    if (cardTriggerData) resourceDeltas.availableData = Number(cardTriggerData[1]);
  }
  if (!Number(resourceDeltas.availableData) && /symbol_\d+/.test(text)) {
    const symbolDataPattern = /symbol_\d+：\s*(\d+)\/(\d+)\s*数据/g;
    let symbolData;
    let symbolDataTotal = 0;
    while ((symbolData = symbolDataPattern.exec(text))) {
      symbolDataTotal += Number(symbolData[2]);
    }
    if (symbolDataTotal > 0) resourceDeltas.availableData = symbolDataTotal;
  }
  const implicitDataGainCount = countMatches(text, /获得数据/g);
  if (implicitDataGainCount > 0 && !Number(resourceDeltas.availableData)) {
    resourceDeltas.availableData = implicitDataGainCount;
  }
  const isDataPlacement = /^放置数据/.test(text);

  const inferredCardGainCount = countBlindDraws(text)
    + countMatches(text, /获得卡牌：/g)
    + countMatches(text, /(?:PASS\s*精选|快速交易精选|卡牌触发精选)：/g);

  const trade = text.match(/快速交易：\s*(\d+)\s*(张牌|信用点|能量|宣传|数据)\s*(?:→|->|＞|>)\s*(?:精选)?\s*(\d+)\s*(张牌|信用点|能量|宣传|数据)/);
  if (trade) {
    const inputKey = trade[2] === "张牌" ? "handSize" : IMPLICIT_RESOURCE_LABELS[trade[2]];
    const outputKey = trade[4] === "张牌" ? "handSize" : IMPLICIT_RESOURCE_LABELS[trade[4]];
    if (!(Number(parsed.resourceDeltas[inputKey]) < 0)) {
      resourceDeltas[inputKey] = (Number(resourceDeltas[inputKey]) || 0) - Number(trade[1]);
    }
    if (!(Number(parsed.resourceDeltas[outputKey]) > 0)) {
      resourceDeltas[outputKey] = (Number(resourceDeltas[outputKey]) || 0) + Number(trade[3]);
    }
    if (resourceDeltas[inputKey] === 0) delete resourceDeltas[inputKey];
    if (resourceDeltas[outputKey] === 0) delete resourceDeltas[outputKey];
  }

  if (inferredCardGainCount > 0 && !(Number(resourceDeltas.handSize) > 0)) {
    resourceDeltas.handSize = (Number(resourceDeltas.handSize) || 0) + inferredCardGainCount;
    if (resourceDeltas.handSize === 0) delete resourceDeltas.handSize;
  }

  const costVerb = text.includes("消耗") ? "消耗" : (/(^|[^可])支付/.test(text) ? "支付" : null);
  if (costVerb) {
    const costPattern = new RegExp(`${costVerb}\\s+([^，；;（）]*)`, "g");
    let costMatch;
    while ((costMatch = costPattern.exec(text))) {
      const tokenPattern = /(\d+(?:\.\d+)?)\s*(信用点|能量|宣传|数据)/g;
      let token;
      while ((token = tokenPattern.exec(costMatch[1]))) {
        const key = IMPLICIT_RESOURCE_LABELS[token[2]];
        if (Number(parsed.resourceDeltas[key]) < 0) continue;
        resourceDeltas[key] = (Number(resourceDeltas[key]) || 0) - Number(token[1]);
        if (resourceDeltas[key] === 0) delete resourceDeltas[key];
      }
    }
  }

  if (/收入：.*(?:弃掉|弃牌)/.test(text) && !(Number(parsed.resourceDeltas.handSize) < 0)) {
    resourceDeltas.handSize = (Number(resourceDeltas.handSize) || 0) - 1;
    if (resourceDeltas.handSize === 0) delete resourceDeltas.handSize;
  }
  if (/PASS.*(?:弃掉|弃牌)/i.test(text) && !(Number(parsed.resourceDeltas.handSize) < 0)) {
    resourceDeltas.handSize = (Number(resourceDeltas.handSize) || 0) - 1;
    if (resourceDeltas.handSize === 0) delete resourceDeltas.handSize;
  }

  let sourceCategory = resourceFlow.classifySourceCategory({
    pace: context.pace,
    text,
    actionLabel: context.actionLabel,
  });
  const ownedTechIds = context.ownedTechIds instanceof Set
    ? context.ownedTechIds
    : new Set(context.ownedTechIds || []);
  if (
    /放置数据|蓝色奖励槽/.test(text)
    && Number(resourceDeltas.credits) > 0
    && (context.selectedTechId === "blue1" || ownedTechIds.has("blue1"))
  ) {
    sourceCategory = "tech_bonus_blue1";
  } else if (
    /放置数据|蓝色奖励槽/.test(text)
    && Number(resourceDeltas.energy) > 0
    && (context.selectedTechId === "blue2" || ownedTechIds.has("blue2"))
  ) {
    sourceCategory = "tech_bonus_blue2";
  } else if (
    sourceCategory === "unclassified"
    && context.previousSourceCategory
    && Object.keys(resourceDeltas).length > 0
  ) {
    sourceCategory = context.previousSourceCategory;
  }

  return {
    resourceDeltas,
    incomeDeltas,
    sourceCategory,
    cards: extractCards(text, sourceCategory),
    isDataPlacement,
    matchedMagnitude: Object.values(resourceDeltas).reduce(
      (total, value) => total + Math.abs(Number(value) || 0),
      0,
    ),
  };
}

function parseReferenceActionLog(markdown, options = {}) {
  const normalized = normalizeMarkdown(markdown);
  const lines = normalized.split("\n");
  const playerResults = [];
  const playerMetadata = {};
  const routeSummary = {};
  const revealedAliens = [];
  const revealedAlienSet = new Set();
  const events = [];
  const playerTechIds = new Map();
  let section = "";
  let entry = null;

  for (const line of lines) {
    if (/^##\s+/.test(line)) {
      section = line.replace(/^##\s+/, "").trim();
      entry = null;
      continue;
    }

    if (section === "终局分数") {
      const scoreMatch = line.match(SCORE_ROW_RE);
      if (scoreMatch && scoreMatch[1] !== "玩家" && !scoreMatch[1].startsWith("---")) {
        const playerLabel = scoreMatch[1].trim();
        playerResults.push({
          playerId: playerLabel,
          playerLabel,
          finalScore: Number(scoreMatch[2]),
        });
        if (!playerMetadata[playerLabel]) playerMetadata[playerLabel] = {};
      }
      continue;
    }

    if (section === "路线摘要") {
      const routeMatch = line.match(ROUTE_ROW_RE);
      if (routeMatch && routeMatch[1] !== "玩家" && !routeMatch[1].startsWith("---")) {
        const playerLabel = routeMatch[1].trim();
        routeSummary[playerLabel] = {
          route: routeMatch[2].trim(),
          mainActionCount: Number(routeMatch[3]),
          quickStepCount: Number(routeMatch[4]),
        };
      }
      continue;
    }

    if (section !== "完整行动流水") continue;
    const entryMatch = line.match(ENTRY_RE);
    if (entryMatch) {
      const roundMatch = entryMatch[2].match(ROUND_RE);
      entry = {
        sequence: Number(entryMatch[1]),
        roundNumber: roundMatch ? Number(roundMatch[1]) : 0,
        turnNumber: roundMatch ? Number(roundMatch[2]) : 0,
        playerLabel: entryMatch[3].trim(),
        actionLabel: entryMatch[4].trim(),
        selectedTechId: null,
        lastClassifiedSourceCategory: null,
      };
      if (!playerMetadata[entry.playerLabel]) playerMetadata[entry.playerLabel] = {};
      continue;
    }
    if (!entry) continue;

    const stepMatch = line.match(STEP_RE);
    if (!stepMatch) continue;
    const pace = stepMatch[1];
    const text = stepMatch[2].trim();
    const companyMatch = text.match(/选择公司：(.+)$/);
    if (companyMatch) {
      playerMetadata[entry.playerLabel].industryId = companyMatch[1].trim();
    }
    const techMatch = text.match(/选择科技：([a-z]+\d+)/i);
    if (techMatch) {
      entry.selectedTechId = techMatch[1].toLowerCase();
      if (!playerTechIds.has(entry.playerLabel)) playerTechIds.set(entry.playerLabel, new Set());
      playerTechIds.get(entry.playerLabel).add(entry.selectedTechId);
    }
    const revealMatch = text.match(/回合结束揭示外星人：(.+?)已揭示/);
    if (revealMatch) {
      const alien = findKnownAlien(revealMatch[1]);
      if (alien && !revealedAlienSet.has(alien)) {
        revealedAlienSet.add(alien);
        revealedAliens.push(alien);
      }
    }

    const playerLabels = [...new Set([...Object.keys(playerMetadata), ...KNOWN_PLAYER_LABELS])];
    const playerLabel = resolveRecipient(text, entry.playerLabel, playerLabels);
    const ownedTechIds = playerTechIds.get(playerLabel) || new Set();
    const normalizedStep = normalizeReferenceStep(text, {
      pace,
      actionLabel: entry.actionLabel,
      selectedTechId: entry.selectedTechId,
      ownedTechIds,
      previousSourceCategory: entry.lastClassifiedSourceCategory,
    });
    if (normalizedStep.isDataPlacement && !(Number(normalizedStep.resourceDeltas.availableData) < 0)) {
      normalizedStep.resourceDeltas.availableData = (
        Number(normalizedStep.resourceDeltas.availableData) || 0
      ) - 1;
      if (normalizedStep.resourceDeltas.availableData === 0) {
        delete normalizedStep.resourceDeltas.availableData;
      }
      normalizedStep.matchedMagnitude = Object.values(normalizedStep.resourceDeltas).reduce(
        (total, value) => total + Math.abs(Number(value) || 0),
        0,
      );
    }
    const sourceCategory = normalizedStep.sourceCategory;
    if (sourceCategory !== "unclassified") {
      entry.lastClassifiedSourceCategory = sourceCategory;
    }
    const alienId = findKnownAlien(text);
    const cards = normalizedStep.cards;
    const hasResourceDelta = normalizedStep.matchedMagnitude > 0;
    if (!hasResourceDelta && sourceCategory === "unclassified" && cards.length === 0) continue;
    const playerResult = playerResults.find((result) => result.playerLabel === playerLabel);
    events.push({
      gameId: options.gameId || options.fileName || "reference-game",
      playerId: playerLabel,
      playerLabel,
      finalScore: Number(playerResult?.finalScore) || 0,
      roundNumber: entry.roundNumber,
      turnNumber: entry.turnNumber,
      pace,
      actionLabel: entry.actionLabel,
      sourceCategory,
      sourceDetail: text,
      isDataPlacement: normalizedStep.isDataPlacement,
      resourceDeltas: normalizedStep.resourceDeltas,
      incomeDeltas: normalizedStep.incomeDeltas,
      cards,
      techIds: entry.selectedTechId ? [entry.selectedTechId] : [],
      alienId,
      industryId: playerMetadata[playerLabel]?.industryId || null,
      confidence: 1,
    });
  }

  const syntheticSetupEvents = playerResults.map((player) => ({
    gameId: options.gameId || options.fileName || "reference-game",
    playerId: player.playerId,
    playerLabel: player.playerLabel,
    finalScore: player.finalScore,
    roundNumber: 0,
    turnNumber: 0,
    pace: "setup",
    actionLabel: "初始选择",
    sourceCategory: "setup",
    sourceDetail: "默认初始手牌",
    resourceDeltas: { handSize: 4 },
    incomeDeltas: {},
    cards: Array.from({ length: 4 }, (_, index) => ({
      key: `setup-hand:${player.playerId}:${index + 1}`,
      label: "默认初始手牌",
      change: "gain",
      origin: "setup",
    })),
    techIds: [],
    alienId: null,
    industryId: playerMetadata[player.playerLabel]?.industryId || null,
    confidence: 1,
  }));

  return {
    gameId: options.gameId || options.fileName || "reference-game",
    fileName: options.fileName || null,
    playerResults,
    playerMetadata,
    routeSummary,
    revealedAliens,
    events: [...syntheticSetupEvents, ...events],
  };
}

function buildProductiveMainActionCounts(games) {
  const result = {};
  for (const game of games) {
    for (const [playerLabel, route] of Object.entries(game.routeSummary || {})) {
      result[`${game.gameId}:${playerLabel}`] = Number(route.mainActionCount) || 0;
    }
  }
  return result;
}

function analyzeReferenceDocuments(documents = [], options = {}) {
  const seenHashes = new Map();
  const duplicateFiles = [];
  const uniqueDocuments = [];
  for (const document of documents) {
    const hash = hashMarkdown(document.markdown);
    if (seenHashes.has(hash)) {
      duplicateFiles.push({ duplicate: document.fileName, original: seenHashes.get(hash) });
      continue;
    }
    seenHashes.set(hash, document.fileName);
    uniqueDocuments.push(document);
  }

  const games = uniqueDocuments.map((document, index) => parseReferenceActionLog(
    document.markdown,
    {
      gameId: document.gameId || `human-${index + 1}`,
      fileName: document.fileName,
    },
  ));
  const events = games.flatMap((game) => game.events);
  const summary = resourceFlow.summarizeResourceEvents(events, {
    endingInventories: options.endingInventories,
    unreconciledResourceKeys: ["publicity", "availableData"],
    productiveMainActionCounts: {
      ...buildProductiveMainActionCounts(games),
      ...(options.productiveMainActionCounts || {}),
    },
  });
  const minCoverage = Number(options.minCoverage);
  if (Number.isFinite(minCoverage) && summary.coverage.weighted < minCoverage) {
    const samples = summary.unclassifiedSamples.slice(0, 10);
    throw new Error(
      `Resource-flow coverage ${summary.coverage.weighted.toFixed(4)} is below ${minCoverage.toFixed(4)}; `
      + `unclassified=${JSON.stringify(samples)}`,
    );
  }

  return {
    generatedAt: new Date().toISOString(),
    inputFiles: documents.map((document) => document.fileName),
    duplicateFiles,
    games,
    summary,
  };
}

function analyzeReferenceFiles(filePaths = [], options = {}) {
  const documents = filePaths.map((filePath) => ({
    fileName: filePath,
    markdown: fs.readFileSync(filePath, "utf8"),
  }));
  return analyzeReferenceDocuments(documents, options);
}

function quantile(values, fraction) {
  if (!values.length) return null;
  const sorted = [...values].sort((left, right) => left - right);
  const position = (sorted.length - 1) * fraction;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (position - lower);
}

function compactCliSummary(result) {
  const scores = result.games.flatMap((game) => game.playerResults.map((player) => player.finalScore));
  const sourceCounts = new Map();
  for (const sample of result.summary.unclassifiedSamples) {
    const key = sample.sourceDetail || "unknown";
    sourceCounts.set(key, (sourceCounts.get(key) || 0) + 1);
  }
  return {
    inputFileCount: result.inputFiles.length,
    duplicateFileCount: result.duplicateFiles.length,
    gameCount: result.games.length,
    playerCount: result.summary.players.length,
    coverage: result.summary.coverage,
    scoreQuartiles: {
      min: quantile(scores, 0),
      p25: quantile(scores, 0.25),
      median: quantile(scores, 0.5),
      p75: quantile(scores, 0.75),
      max: quantile(scores, 1),
    },
    topUnclassified: [...sourceCounts]
      .sort((left, right) => right[1] - left[1])
      .slice(0, 10)
      .map(([sourceDetail, count]) => ({ sourceDetail, count })),
  };
}

function parseCliArgs(argv) {
  const args = { dir: "参考行动日志", out: null, minCoverage: 0 };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--dir") args.dir = argv[++index];
    else if (arg === "--out") args.out = argv[++index];
    else if (arg === "--minCoverage") args.minCoverage = Number(argv[++index]);
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return args;
}

function runCli(argv = process.argv.slice(2)) {
  const args = parseCliArgs(argv);
  const directory = path.resolve(args.dir);
  const filePaths = fs.readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".md"))
    .map((entry) => path.join(directory, entry.name))
    .sort((left, right) => left.localeCompare(right, "zh-CN"));
  const result = analyzeReferenceFiles(filePaths, { minCoverage: args.minCoverage });
  if (args.out) {
    const outputPath = path.resolve(args.out);
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");
  }
  process.stdout.write(`${JSON.stringify(compactCliSummary(result), null, 2)}\n`);
  return result;
}

if (require.main === module) {
  try {
    runCli();
  } catch (error) {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  }
}

module.exports = Object.freeze({
  normalizeReferenceStep,
  parseReferenceActionLog,
  analyzeReferenceDocuments,
  analyzeReferenceFiles,
  compactCliSummary,
  runCli,
});
