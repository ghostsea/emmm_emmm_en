(function (root, factory) {
  "use strict";

  let placement = root.SetiAlienPlacement;

  if (typeof require === "function") {
    placement = placement || require("./placement");
  }

  const api = factory(placement);

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.SetiAlienJiuzhe = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function (placement) {
  "use strict";

  const ALIEN_ID = "九折";
  const CARD_BACK_SRC = "../assets/aliens/九折/cards/back.png";
  const THREAT_ICON_SRC = "../assets/aliens/九折/Threat.webp";
  const CARD_BASE_PATH = "../assets/aliens/九折/cards";
  const TRACE_TYPES = Object.freeze(["pink", "yellow", "blue"]);
  const TRACE_POSITIONS = Object.freeze([1, 2, 3, 4, 5]);
  const TRACE_POSITION_COUNT = 5;
  const INCOME_KEYS = Object.freeze(["credits", "energy", "handSize", "publicity", "availableData", "additionalPublicScan"]);
  let lazyInitialCardsModule = null;
  let lazyInitialCardsModuleResolved = false;

  const TRACE_REWARDS = Object.freeze({
    pink: Object.freeze({
      1: Object.freeze({ gain: Object.freeze({ score: 3, publicity: 1 }), dataCount: 0, pickCard: false, threat: 1 }),
      2: Object.freeze({ gain: Object.freeze({ score: 4, credits: 1 }), dataCount: 0, pickCard: false, threat: 2 }),
      3: Object.freeze({ gain: Object.freeze({ score: 5, credits: 1 }), dataCount: 0, pickCard: false, threat: 2 }),
      4: Object.freeze({ gain: Object.freeze({ score: 7, credits: 1 }), dataCount: 0, pickCard: false, threat: 3 }),
      5: Object.freeze({ gain: Object.freeze({ score: 9, credits: 1 }), dataCount: 0, pickCard: false, threat: 3 }),
    }),
    yellow: Object.freeze({
      1: Object.freeze({ gain: Object.freeze({ score: 3, publicity: 1 }), dataCount: 0, pickCard: false, threat: 1 }),
      2: Object.freeze({ gain: Object.freeze({ score: 1, energy: 1 }), dataCount: 0, pickCard: true, threat: 2 }),
      3: Object.freeze({ gain: Object.freeze({ score: 2, energy: 1 }), dataCount: 0, pickCard: true, threat: 2 }),
      4: Object.freeze({ gain: Object.freeze({ score: 4, energy: 1 }), dataCount: 0, pickCard: true, threat: 3 }),
      5: Object.freeze({ gain: Object.freeze({ score: 6, energy: 1 }), dataCount: 0, pickCard: true, threat: 3 }),
    }),
    blue: Object.freeze({
      1: Object.freeze({ gain: Object.freeze({ score: 3, publicity: 1 }), dataCount: 0, pickCard: false, threat: 1 }),
      2: Object.freeze({ gain: Object.freeze({ score: 1, publicity: 1 }), dataCount: 1, pickCard: false, threat: 2 }),
      3: Object.freeze({ gain: Object.freeze({ score: 2, publicity: 1 }), dataCount: 1, pickCard: false, threat: 2 }),
      4: Object.freeze({ gain: Object.freeze({ score: 4, publicity: 1 }), dataCount: 1, pickCard: false, threat: 3 }),
      5: Object.freeze({ gain: Object.freeze({ score: 6, publicity: 1 }), dataCount: 1, pickCard: false, threat: 3 }),
    }),
  });

  const CARD_DEFINITIONS = Object.freeze([
    Object.freeze({ index: 0, threat: 0, score: 7, condition: Object.freeze({ type: "jiuzheTraceCount", count: 6 }), label: "九折有6个痕迹" }),
    Object.freeze({ index: 1, threat: 2, score: 10, condition: Object.freeze({ type: "samePlanetOrbitOrLand", count: 3 }), label: "同一星球3个环绕或登陆" }),
    Object.freeze({ index: 2, threat: 4, score: 12, condition: Object.freeze({ type: "sectorWinsByColor", color: "blue", count: 2 }), label: "完成2个蓝色扇区" }),
    Object.freeze({ index: 3, threat: 7, score: 15, condition: Object.freeze({ type: "techCount", techType: "purple", count: 3 }), label: "拥有3个紫色科技" }),
    Object.freeze({ index: 4, threat: 3, score: 9, condition: Object.freeze({ type: "techCount", techType: "blue", count: 3 }), label: "拥有3个蓝色科技" }),
    Object.freeze({ index: 5, threat: 8, score: 18, condition: Object.freeze({ type: "incomeIncreaseCount", count: 8 }), label: "收入增加8次" }),
    Object.freeze({ index: 6, threat: 5, score: 14, condition: Object.freeze({ type: "sectorWinsByColor", color: "black", count: 2 }), label: "完成2个黑色扇区" }),
    Object.freeze({ index: 7, threat: 7, score: 16, condition: Object.freeze({ type: "landingCount", count: 4 }), label: "拥有4个登陆" }),
    Object.freeze({ index: 8, threat: 1, score: 8, condition: Object.freeze({ type: "sameColorTraceCount", count: 5 }), label: "拥有5个相同颜色外星人痕迹" }),
    Object.freeze({ index: 9, threat: 9, score: 20, condition: Object.freeze({ type: "otherAlienTraceCount", count: 6 }), label: "另一个外星人有6个痕迹" }),
    Object.freeze({ index: 10, threat: 3, score: 11, condition: Object.freeze({ type: "orbitCount", count: 3 }), label: "拥有3个环绕" }),
    Object.freeze({ index: 11, threat: 4, score: 12, condition: Object.freeze({ type: "sectorWinsByColor", color: "red", count: 2 }), label: "完成2个红色扇区" }),
    Object.freeze({ index: 12, threat: 6, score: 14, condition: Object.freeze({ type: "techCount", techType: "orange", count: 3 }), label: "拥有3个橙色科技" }),
    Object.freeze({ index: 13, threat: 4, score: 12, condition: Object.freeze({ type: "completedTasks", count: 5 }), label: "完成5张任务牌" }),
    Object.freeze({ index: 14, threat: 4, score: 12, condition: Object.freeze({ type: "sectorWinsByColor", color: "yellow", count: 2 }), label: "完成2个黄色扇区" }),
  ]);

  const CARD_BY_INDEX = Object.freeze(Object.fromEntries(CARD_DEFINITIONS.map((card) => [card.index, card])));

  const NEBULA_IDS_BY_COLOR = Object.freeze({
    yellow: Object.freeze(["sector-4-a", "sector-3-a"]),
    red: Object.freeze(["sector-2-b", "sector-3-b"]),
    blue: Object.freeze(["sector-2-a", "sector-1-a"]),
    black: Object.freeze(["sector-1-b", "sector-4-b"]),
  });

  function createTraceGrid() {
    const grid = {};
    for (const traceType of TRACE_TYPES) {
      grid[traceType] = {};
      for (const position of TRACE_POSITIONS) {
        grid[traceType][position] = null;
      }
    }
    return grid;
  }

  function createPlayerJiuzheState() {
    return {
      cards: [],
      revealPlaysRemaining: 0,
      freeThresholdUsed: false,
      freeThresholdDeclined: false,
      paidThresholdUsed: false,
      paidThresholdDeclined: false,
    };
  }

  function createJiuzheState() {
    return {
      revealedSlotId: null,
      revealedByPlayerId: null,
      revealedByPlayerColor: null,
      freeScoreThreshold: null,
      paidScoreThreshold: null,
      traceSlotsByAlienSlotId: {},
      playerCardsById: {},
      playerThreatById: {},
      playerThreatByColor: {},
      cardsDealt: false,
      revealInitialized: false,
    };
  }

  function ensureJiuzheState(alienState) {
    if (!alienState.jiuzhe || typeof alienState.jiuzhe !== "object") {
      alienState.jiuzhe = createJiuzheState();
    }
    if (!alienState.jiuzhe.traceSlotsByAlienSlotId) alienState.jiuzhe.traceSlotsByAlienSlotId = {};
    if (!alienState.jiuzhe.playerCardsById) alienState.jiuzhe.playerCardsById = {};
    if (!alienState.jiuzhe.playerThreatById) alienState.jiuzhe.playerThreatById = {};
    if (!alienState.jiuzhe.playerThreatByColor) alienState.jiuzhe.playerThreatByColor = {};
    if (typeof alienState.jiuzhe.revealInitialized !== "boolean") {
      alienState.jiuzhe.revealInitialized = false;
    }
    return alienState.jiuzhe;
  }

  function ensureTraceGrid(alienState, alienSlotId) {
    const jiuzhe = ensureJiuzheState(alienState);
    const key = String(alienSlotId);
    if (!jiuzhe.traceSlotsByAlienSlotId[key]) {
      jiuzhe.traceSlotsByAlienSlotId[key] = createTraceGrid();
    }
    return jiuzhe.traceSlotsByAlienSlotId[key];
  }

  function getTraceGrid(alienState, alienSlotId) {
    return alienState?.jiuzhe?.traceSlotsByAlienSlotId?.[String(alienSlotId)] || null;
  }

  function getPlayerKey(player) {
    return player?.id || player?.playerId || player?.color || player?.playerColor || null;
  }

  function getPlayerColor(player) {
    return player?.color || player?.playerColor || null;
  }

  function getPlayerKeys(player) {
    return new Set([player?.id, player?.playerId, player?.color, player?.playerColor].filter(Boolean));
  }

  function getPlayerJiuzheState(alienState, player, create = true) {
    const playerId = getPlayerKey(player);
    if (!playerId) return null;
    const jiuzhe = ensureJiuzheState(alienState);
    if (!jiuzhe.playerCardsById[playerId] && create) {
      jiuzhe.playerCardsById[playerId] = createPlayerJiuzheState();
    }
    return jiuzhe.playerCardsById[playerId] || null;
  }

  function getTraceReward(traceType, position) {
    return TRACE_REWARDS[traceType]?.[position] || null;
  }

  function cloneReward(reward) {
    if (!reward) return null;
    return {
      gain: { ...(reward.gain || {}) },
      dataCount: reward.dataCount || 0,
      pickCard: Boolean(reward.pickCard),
      threat: reward.threat || 0,
    };
  }

  function isJiuzheAlienSlot(alienState, alienSlotId) {
    const slot = alienState?.aliens?.[alienSlotId];
    return slot?.alienId === ALIEN_ID || slot?.assignedAlienId === ALIEN_ID;
  }

  function isJiuzheRevealedSlot(alienState, alienSlotId) {
    const slot = alienState?.aliens?.[alienSlotId];
    return Boolean(slot?.revealed && slot.alienId === ALIEN_ID);
  }

  function addThreat(alienState, player, amount) {
    const threat = Math.max(0, Math.round(Number(amount) || 0));
    if (!threat) return 0;
    const jiuzhe = ensureJiuzheState(alienState);
    const playerId = getPlayerKey(player);
    const playerColor = getPlayerColor(player);
    if (playerId) {
      jiuzhe.playerThreatById[playerId] = (Number(jiuzhe.playerThreatById[playerId]) || 0) + threat;
    }
    if (playerColor) {
      jiuzhe.playerThreatByColor[playerColor] = (Number(jiuzhe.playerThreatByColor[playerColor]) || 0) + threat;
    }
    return threat;
  }

  function getThreat(alienState, player) {
    const playerId = getPlayerKey(player);
    const playerColor = getPlayerColor(player);
    const byId = playerId ? Number(alienState?.jiuzhe?.playerThreatById?.[playerId]) || 0 : 0;
    const byColor = playerColor ? Number(alienState?.jiuzhe?.playerThreatByColor?.[playerColor]) || 0 : 0;
    return Math.max(byId, byColor);
  }

  function normalizePosition(position) {
    const value = Math.round(Number(position));
    return TRACE_POSITIONS.includes(value) ? value : null;
  }

  function validateTraceTarget(traceType, position) {
    const normalizedPosition = normalizePosition(position);
    if (!TRACE_TYPES.includes(traceType)) {
      return { ok: false, message: `九折不支持的痕迹颜色 ${traceType}` };
    }
    if (!normalizedPosition) {
      return { ok: false, message: `九折不支持的痕迹位置 ${position}` };
    }
    return { ok: true, position: normalizedPosition };
  }

  function createTraceEntry(player, traceType, position, options = {}) {
    return {
      traceType,
      position,
      playerId: player?.id || player?.playerId || null,
      playerColor: getPlayerColor(player),
      playerLabel: player?.colorLabel || player?.name || player?.playerLabel || null,
      debugOnly: Boolean(options.debugOnly),
      rewardApplied: Boolean(options.rewardApplied),
      placedAt: options.placedAt || Date.now(),
    };
  }

  function placeJiuzheTrace(alienState, alienSlotId, traceType, position, player, options = {}) {
    if (!isJiuzheRevealedSlot(alienState, alienSlotId) && !options.debugOnly) {
      return { ok: false, message: "九折尚未揭示，不能放置九折痕迹" };
    }

    const validation = validateTraceTarget(traceType, position);
    if (!validation.ok) return validation;

    const grid = ensureTraceGrid(alienState, alienSlotId);
    const current = grid[traceType][validation.position];
    if (current) {
      return {
        ok: false,
        message: `${placement.getTraceTypeLabel(traceType)} ${validation.position} 号位已经有痕迹`,
      };
    }

    const reward = cloneReward(getTraceReward(traceType, validation.position));
    const entry = createTraceEntry(player, traceType, validation.position, {
      debugOnly: options.debugOnly,
      rewardApplied: Boolean(!options.debugOnly && reward),
      placedAt: options.placedAt,
    });
    grid[traceType][validation.position] = entry;

    if (!options.debugOnly && reward?.threat) {
      addThreat(alienState, player, reward.threat);
    }

    return {
      ok: true,
      entry,
      reward,
      message: `九折：放置${placement.getTraceTypeLabel(traceType)} ${validation.position} 号位`,
    };
  }

  function migrateFirstTracesToJiuzhe(alienState, alienSlotId, options = {}) {
    const slot = alienState?.aliens?.[alienSlotId];
    const migrated = [];
    if (!slot?.traces) return migrated;
    const grid = ensureTraceGrid(alienState, alienSlotId);

    for (const traceType of TRACE_TYPES) {
      const traceSlot = slot.traces[traceType];
      if (!traceSlot?.firstPlaced || grid[traceType][1]) continue;
      const player = {
        id: traceSlot.ownerPlayerId || null,
        color: traceSlot.ownerPlayerColor || null,
        colorLabel: traceSlot.ownerPlayerLabel || null,
      };
      const reward = cloneReward(getTraceReward(traceType, 1));
      const entry = createTraceEntry(player, traceType, 1, {
        debugOnly: false,
        rewardApplied: Boolean(options.applyRewards && reward),
      });
      grid[traceType][1] = entry;
      if (options.applyRewards && reward?.threat) {
        addThreat(alienState, player, reward.threat);
      }
      migrated.push({ traceType, position: 1, entry, reward: options.applyRewards ? reward : null });
    }
    return migrated;
  }

  function countRevealOpportunitiesByPlayer(alienState, alienSlotId, activePlayers = []) {
    const slot = alienState?.aliens?.[alienSlotId];
    const counts = {};
    if (!slot?.traces) return counts;

    for (const traceType of TRACE_TYPES) {
      const traceSlot = slot.traces[traceType];
      if (!traceSlot?.firstPlaced) continue;

      const ownerColor = traceSlot.ownerPlayerColor || null;
      const ownerPlayer = activePlayers.find((player) => (
        player.id === traceSlot.ownerPlayerId
        || player.color === ownerColor
      ));
      const playerKey = getPlayerKey(ownerPlayer)
        || traceSlot.ownerPlayerId
        || ownerColor;
      if (!playerKey) continue;
      counts[playerKey] = (counts[playerKey] || 0) + 1;
    }

    return counts;
  }

  function shuffle(items, random = Math.random) {
    const result = [...items];
    for (let index = result.length - 1; index > 0; index -= 1) {
      const pickIndex = Math.floor(random() * (index + 1));
      [result[index], result[pickIndex]] = [result[pickIndex], result[index]];
    }
    return result;
  }

  function getCardSrc(index) {
    return `${CARD_BASE_PATH}/${index}.webp`;
  }

  function createPlayerCard(index) {
    const definition = CARD_BY_INDEX[index];
    return {
      index,
      id: `jiuzhe-card-${index}`,
      src: getCardSrc(index),
      threat: definition?.threat || 0,
      score: definition?.score || 0,
      condition: definition?.condition || null,
      label: definition?.label || `九折牌 ${index}`,
      played: false,
    };
  }

  function dealJiuzheCards(alienState, players, random = Math.random) {
    const jiuzhe = ensureJiuzheState(alienState);
    if (jiuzhe.cardsDealt) {
      return { ok: true, alreadyDealt: true, message: "九折牌已经发放" };
    }

    const targetPlayers = (players || []).filter((player) => getPlayerKey(player));
    const deck = shuffle(CARD_DEFINITIONS.map((card) => card.index), random);
    for (const player of targetPlayers) {
      const playerState = getPlayerJiuzheState(alienState, player, true);
      playerState.cards = deck.splice(0, 3).map(createPlayerCard);
    }
    jiuzhe.cardsDealt = true;
    return { ok: true, message: `九折：已给 ${targetPlayers.length} 名玩家各发 3 张牌` };
  }

  function getPlayerScore(player) {
    const score = Number(player?.resources?.score);
    return Number.isFinite(score) ? score : 0;
  }

  function getRevealThresholdBaseScore(activePlayers, fallbackPlayer) {
    const players = (activePlayers || []).filter(Boolean);
    if (!players.length) return getPlayerScore(fallbackPlayer);
    return players.reduce((highest, player) => Math.max(highest, getPlayerScore(player)), 0);
  }

  function initializeJiuzheReveal(alienState, alienSlotId, triggerPlayer, activePlayers, random = Math.random) {
    const jiuzhe = ensureJiuzheState(alienState);
    if (jiuzhe.revealInitialized) {
      return {
        ok: true,
        alreadyInitialized: true,
        dealResult: { ok: true, alreadyDealt: true, message: "九折已初始化" },
        freeScoreThreshold: jiuzhe.freeScoreThreshold,
        paidScoreThreshold: jiuzhe.paidScoreThreshold,
        message: `九折已展示：免费打出阈值 ${jiuzhe.freeScoreThreshold} 分，1信用点阈值 ${jiuzhe.paidScoreThreshold} 分`,
      };
    }

    jiuzhe.revealedSlotId = Number(alienSlotId);
    jiuzhe.revealedByPlayerId = triggerPlayer?.id || null;
    jiuzhe.revealedByPlayerColor = getPlayerColor(triggerPlayer);
    const thresholdBaseScore = getRevealThresholdBaseScore(activePlayers, triggerPlayer);
    jiuzhe.freeScoreThreshold = thresholdBaseScore + 20;
    jiuzhe.paidScoreThreshold = thresholdBaseScore + 40;
    jiuzhe.revealInitialized = true;
    delete jiuzhe.traceSlotsByAlienSlotId[String(alienSlotId)];

    const revealOpportunityCounts = countRevealOpportunitiesByPlayer(alienState, alienSlotId, activePlayers || []);
    const dealResult = dealJiuzheCards(alienState, activePlayers, random);

    for (const player of activePlayers || []) {
      const playerId = getPlayerKey(player);
      if (!playerId) continue;
      const playerState = getPlayerJiuzheState(alienState, player, true);
      playerState.revealPlaysRemaining = revealOpportunityCounts[playerId] || 0;
    }

    return {
      ok: true,
      migrated: [],
      revealOpportunityCounts,
      dealResult,
      freeScoreThreshold: jiuzhe.freeScoreThreshold,
      paidScoreThreshold: jiuzhe.paidScoreThreshold,
      message: `九折已展示：免费打出阈值 ${jiuzhe.freeScoreThreshold} 分，1信用点阈值 ${jiuzhe.paidScoreThreshold} 分`,
    };
  }

  function getPlayerJiuzheCards(alienState, player) {
    return getPlayerJiuzheState(alienState, player, false)?.cards || [];
  }

  function countPlayedCards(alienState, player) {
    return getPlayerJiuzheCards(alienState, player).filter((card) => card.played).length;
  }

  function getUnplayedCards(alienState, player) {
    return getPlayerJiuzheCards(alienState, player).filter((card) => !card.played);
  }

  function getJiuzheCard(alienState, player, cardIndex) {
    const index = Math.round(Number(cardIndex));
    return getPlayerJiuzheCards(alienState, player).find((card) => card.index === index) || null;
  }

  function playJiuzheCard(alienState, player, cardIndex, options = {}) {
    const card = getJiuzheCard(alienState, player, cardIndex);
    if (!card) return { ok: false, message: "没有这张九折牌" };
    if (card.played) return { ok: false, message: "这张九折牌已经打出" };

    card.played = true;
    card.playedBy = options.reason || "manual";
    addThreat(alienState, player, card.threat || 0);

    const playerState = getPlayerJiuzheState(alienState, player, true);
    if (options.reason === "reveal") {
      playerState.revealPlaysRemaining = Math.max(0, (playerState.revealPlaysRemaining || 0) - 1);
    } else if (options.reason === "freeThreshold") {
      playerState.freeThresholdUsed = true;
    } else if (options.reason === "paidThreshold") {
      playerState.paidThresholdUsed = true;
    }

    return {
      ok: true,
      card,
      message: `打出九折牌 ${card.index}，威胁度 +${card.threat || 0}`,
    };
  }

  function declineOpportunity(alienState, player, reason) {
    const playerState = getPlayerJiuzheState(alienState, player, true);
    if (!playerState) return { ok: false, message: "没有玩家九折状态" };
    if (reason === "reveal") {
      playerState.revealPlaysRemaining = Math.max(0, (playerState.revealPlaysRemaining || 0) - 1);
    } else if (reason === "freeThreshold") {
      playerState.freeThresholdDeclined = true;
    } else if (reason === "paidThreshold") {
      playerState.paidThresholdDeclined = true;
    }
    return { ok: true, message: "已放弃九折打出机会" };
  }

  function getPendingOpportunity(alienState, player) {
    const jiuzhe = alienState?.jiuzhe;
    const playerState = getPlayerJiuzheState(alienState, player, false);
    if (!jiuzhe || !playerState || !getUnplayedCards(alienState, player).length) return null;

    if ((playerState.revealPlaysRemaining || 0) > 0) {
      return { reason: "reveal", cost: {}, label: "九折展示：免费打出", remaining: playerState.revealPlaysRemaining };
    }

    const score = Number(player?.resources?.score) || 0;
    if (
      jiuzhe.freeScoreThreshold != null
      && score >= jiuzhe.freeScoreThreshold
      && !playerState.freeThresholdUsed
      && !playerState.freeThresholdDeclined
    ) {
      return { reason: "freeThreshold", cost: {}, label: `达到 ${jiuzhe.freeScoreThreshold} 分：免费打出` };
    }

    if (
      jiuzhe.paidScoreThreshold != null
      && score >= jiuzhe.paidScoreThreshold
      && !playerState.paidThresholdUsed
      && !playerState.paidThresholdDeclined
    ) {
      return { reason: "paidThreshold", cost: { credits: 1 }, label: `达到 ${jiuzhe.paidScoreThreshold} 分：1信用点打出` };
    }

    return null;
  }

  function seedDebugTraceGrid(alienState, alienSlotId, player) {
    ensureJiuzheState(alienState);
    ensureTraceGrid(alienState, alienSlotId);
    const placed = [];
    for (const traceType of TRACE_TYPES) {
      for (const position of TRACE_POSITIONS) {
        const result = placeJiuzheTrace(alienState, alienSlotId, traceType, position, player, {
          debugOnly: true,
          placedAt: 0,
        });
        if (result.ok) placed.push(result.entry);
      }
    }
    return placed;
  }

  function markerBelongsToPlayer(marker, playerKeys) {
    return playerKeys.has(marker?.playerId)
      || playerKeys.has(marker?.ownerPlayerId)
      || playerKeys.has(marker?.color)
      || playerKeys.has(marker?.playerColor)
      || playerKeys.has(marker?.ownerPlayerColor);
  }

  function getStateExtraTraceMarker(traceSlot, extraIndex) {
    const markers = Array.isArray(traceSlot?.extraMarkers) ? traceSlot.extraMarkers : [];
    return markers[extraIndex] || { ownerPlayerColor: traceSlot?.ownerPlayerColor || null };
  }

  function countSectorWinsByColor(player, nebulaDataState, color) {
    const sectorIds = NEBULA_IDS_BY_COLOR[color] || [];
    const playerKeys = getPlayerKeys(player);
    let count = 0;
    for (const key of playerKeys) {
      for (const win of nebulaDataState?.sectorSettlements?.winsByPlayerId?.[key] || []) {
        if (sectorIds.includes(win.sectorId)) count += 1;
      }
    }
    return count;
  }

  function countOwnedTech(player, techType) {
    const ownedTiles = player?.techState?.ownedTiles || {};
    return Object.keys(ownedTiles).filter((tileId) => ownedTiles[tileId] && String(tileId).startsWith(techType)).length;
  }

  function countOrbitMarkers(player, planetStatsState) {
    const playerKeys = getPlayerKeys(player);
    let count = 0;
    for (const planet of Object.values(planetStatsState?.planets || {})) {
      count += (planet.orbitMarkers || []).filter((marker) => markerBelongsToPlayer(marker, playerKeys)).length;
    }
    return count;
  }

  function countPlutoMarkers(player, context = {}, kind = "all") {
    const playerKeys = getPlayerKeys(player);
    return (context?.plutoMarkers || []).filter((marker) => {
      if (!markerBelongsToPlayer(marker, playerKeys)) return false;
      if (kind === "orbit") return marker.kind === "orbit";
      if (kind === "land") return marker.kind === "land";
      return marker.kind === "orbit" || marker.kind === "land";
    }).length;
  }

  function countLandingMarkers(player, planetStatsState, context = {}) {
    const playerKeys = getPlayerKeys(player);
    let count = countPlutoMarkers(player, context, "land");
    for (const planet of Object.values(planetStatsState?.planets || {})) {
      count += (planet.landingMarkers || []).filter((marker) => markerBelongsToPlayer(marker, playerKeys)).length;
      count += (planet.satelliteLandings || []).filter((marker) => markerBelongsToPlayer(marker, playerKeys)).length;
    }
    return count;
  }

  function maxSamePlanetOrbitOrLand(player, planetStatsState, context = {}) {
    const playerKeys = getPlayerKeys(player);
    let max = countPlutoMarkers(player, context, "all");
    for (const planet of Object.values(planetStatsState?.planets || {})) {
      const count = [
        ...(planet.orbitMarkers || []),
        ...(planet.landingMarkers || []),
        ...(planet.satelliteLandings || []),
      ].filter((marker) => markerBelongsToPlayer(marker, playerKeys)).length;
      max = Math.max(max, count);
    }
    return max;
  }

  function normalizeIncomeMap(income) {
    const source = income || {};
    const result = {};
    for (const key of INCOME_KEYS) {
      result[key] = Math.max(0, Math.round(Number(source[key]) || 0));
    }
    return result;
  }

  function getInitialCardsModule(context = {}) {
    if (context?.initialCards?.getIndustryEffect) return context.initialCards;
    if (typeof context?.getInitialCardsModule === "function") {
      const module = context.getInitialCardsModule();
      if (module?.getIndustryEffect) return module;
    }
    if (typeof globalThis !== "undefined" && globalThis.SetiInitialCards?.getIndustryEffect) {
      return globalThis.SetiInitialCards;
    }
    if (!lazyInitialCardsModuleResolved && typeof require === "function") {
      lazyInitialCardsModuleResolved = true;
      try {
        lazyInitialCardsModule = require("../initial-cards");
      } catch (_error) {
        lazyInitialCardsModule = null;
      }
    }
    return lazyInitialCardsModule;
  }

  function getCompanyBaseIncome(player, context = {}) {
    if (typeof context?.getPlayerCompanyBaseIncome === "function") {
      return normalizeIncomeMap(context.getPlayerCompanyBaseIncome(player));
    }
    if (context?.companyBaseIncome) return normalizeIncomeMap(context.companyBaseIncome);
    if (player?.companyBaseIncome) return normalizeIncomeMap(player.companyBaseIncome);
    if (player?.initialSelection?.companyBaseIncome) return normalizeIncomeMap(player.initialSelection.companyBaseIncome);

    const initialCards = getInitialCardsModule(context);
    const industryEffect = initialCards?.getIndustryEffect?.(player?.initialSelection?.industry);
    return normalizeIncomeMap(industryEffect?.baseIncome || null);
  }

  function countIncomeIncreases(player, context = {}) {
    const income = normalizeIncomeMap(player?.income);
    const companyBaseIncome = getCompanyBaseIncome(player, context);
    return INCOME_KEYS.reduce((total, key) => (
      total + Math.max(0, income[key] - (companyBaseIncome[key] || 0))
    ), 0);
  }

  function countJiuzheTraces(alienState, player, alienSlotId = alienState?.jiuzhe?.revealedSlotId) {
    const grid = getTraceGrid(alienState, alienSlotId);
    const playerKeys = getPlayerKeys(player);
    let count = 0;
    for (const traceType of TRACE_TYPES) {
      for (const position of TRACE_POSITIONS) {
        const entry = grid?.[traceType]?.[position];
        if (entry && markerBelongsToPlayer(entry, playerKeys)) count += 1;
      }
    }
    return count;
  }

  function getPanelThreat(alienState, player, alienSlotId = alienState?.jiuzhe?.revealedSlotId) {
    const grid = getTraceGrid(alienState, alienSlotId);
    if (!grid) return 0;
    const playerKeys = getPlayerKeys(player);
    let total = 0;
    for (const traceType of TRACE_TYPES) {
      for (const position of TRACE_POSITIONS) {
        const entry = grid[traceType][position];
        if (!entry || entry.debugOnly || !markerBelongsToPlayer(entry, playerKeys)) continue;
        total += getTraceReward(traceType, position)?.threat || 0;
      }
    }
    return total;
  }

  function countGenericTraceMarkers(player, alienGameState, traceType, options = {}) {
    const playerKeys = getPlayerKeys(player);
    let count = 0;
    for (const [slotId, slot] of Object.entries(alienGameState?.aliens || {})) {
      if (options.excludeSlotId != null && Number(slotId) === Number(options.excludeSlotId)) continue;
      const traceSlot = slot?.traces?.[traceType];
      if (!traceSlot?.firstPlaced) continue;
      if (markerBelongsToPlayer(traceSlot, playerKeys)) count += 1;
      const extraCount = Math.max(0, Math.round(Number(traceSlot.extraCount) || 0));
      for (let index = 0; index < extraCount; index += 1) {
        if (markerBelongsToPlayer(getStateExtraTraceMarker(traceSlot, index), playerKeys)) {
          count += 1;
        }
      }
    }
    return count;
  }

  function countAllTraceMarkersByColor(player, alienState, traceType) {
    const revealedSlotId = alienState?.jiuzhe?.revealedSlotId;
    let count = countGenericTraceMarkers(player, alienState, traceType, { excludeSlotId: revealedSlotId });
    const grid = getTraceGrid(alienState, revealedSlotId);
    if (grid?.[traceType]) {
      const playerKeys = getPlayerKeys(player);
      count += TRACE_POSITIONS.filter((position) => {
        const entry = grid[traceType][position];
        return entry && markerBelongsToPlayer(entry, playerKeys);
      }).length;
    }
    return count;
  }

  function countOtherAlienTraces(player, alienState) {
    const revealedSlotId = alienState?.jiuzhe?.revealedSlotId;
    let count = 0;
    for (const traceType of TRACE_TYPES) {
      count += countGenericTraceMarkers(player, alienState, traceType, { excludeSlotId: revealedSlotId });
    }
    return count;
  }

  function isCardConditionMet(cardOrDefinition, player, context = {}) {
    const definition = typeof cardOrDefinition?.index === "number"
      ? (CARD_BY_INDEX[cardOrDefinition.index] || cardOrDefinition)
      : CARD_BY_INDEX[Number(cardOrDefinition)];
    const condition = definition?.condition;
    if (!condition) return false;

    switch (condition.type) {
      case "jiuzheTraceCount":
        return countJiuzheTraces(context.alienGameState, player) >= condition.count;
      case "samePlanetOrbitOrLand":
        return maxSamePlanetOrbitOrLand(player, context.planetStatsState, context) >= condition.count;
      case "sectorWinsByColor":
        return countSectorWinsByColor(player, context.nebulaDataState, condition.color) >= condition.count;
      case "techCount":
        return countOwnedTech(player, condition.techType) >= condition.count;
      case "incomeIncreaseCount":
      case "totalIncome":
        return countIncomeIncreases(player, context) >= condition.count;
      case "landingCount":
        return countLandingMarkers(player, context.planetStatsState, context) >= condition.count;
      case "sameColorTraceCount":
        return TRACE_TYPES.some((traceType) => countAllTraceMarkersByColor(player, context.alienGameState, traceType) >= condition.count);
      case "otherAlienTraceCount":
        return countOtherAlienTraces(player, context.alienGameState) >= condition.count;
      case "orbitCount":
        return countOrbitMarkers(player, context.planetStatsState) + countPlutoMarkers(player, context, "orbit") >= condition.count;
      case "completedTasks":
        return (Number(player?.completedTaskCount) || 0) >= condition.count;
      default:
        return false;
    }
  }

  function scorePlayedCards(alienState, player, context = {}) {
    const cards = getPlayerJiuzheCards(alienState, player);
    const scoredCards = [];
    let total = 0;
    for (const card of cards) {
      if (!card.played) continue;
      const achieved = isCardConditionMet(card, player, { ...context, alienGameState: context.alienGameState || alienState });
      const score = achieved ? (Number(card.score) || 0) : 0;
      total += score;
      scoredCards.push({ cardIndex: card.index, achieved, score, threat: card.threat || 0 });
    }
    return { total, cards: scoredCards };
  }

  function getHighestThreatPlayers(alienState, players) {
    let highest = 0;
    const entries = [];
    for (const player of players || []) {
      const threat = getThreat(alienState, player);
      highest = Math.max(highest, threat);
      entries.push({ player, threat });
    }
    if (highest <= 0) return { highest: 0, playerIds: [], playerColors: [] };
    return {
      highest,
      playerIds: entries.filter((entry) => entry.threat === highest).map((entry) => entry.player.id).filter(Boolean),
      playerColors: entries.filter((entry) => entry.threat === highest).map((entry) => entry.player.color).filter(Boolean),
    };
  }

  function shouldApplyThreatPenalty(alienState, player, players) {
    const highest = getHighestThreatPlayers(alienState, players);
    if (highest.highest <= 0) return false;
    return highest.playerIds.includes(player?.id) || highest.playerColors.includes(player?.color);
  }

  function formatTraceLabel(traceType, position) {
    return `${placement.getTraceTypeLabel(traceType)} ${position}号位`;
  }

  return Object.freeze({
    ALIEN_ID,
    CARD_BACK_SRC,
    THREAT_ICON_SRC,
    CARD_BASE_PATH,
    TRACE_TYPES,
    TRACE_POSITIONS,
    TRACE_POSITION_COUNT,
    TRACE_REWARDS,
    CARD_DEFINITIONS,
    CARD_BY_INDEX,
    createJiuzheState,
    ensureJiuzheState,
    ensureTraceGrid,
    getTraceGrid,
    getTraceReward,
    isJiuzheAlienSlot,
    isJiuzheRevealedSlot,
    addThreat,
    getThreat,
    getPanelThreat,
    placeJiuzheTrace,
    migrateFirstTracesToJiuzhe,
    countRevealOpportunitiesByPlayer,
    initializeJiuzheReveal,
    dealJiuzheCards,
    getCardSrc,
    getPlayerJiuzheState,
    getPlayerJiuzheCards,
    countPlayedCards,
    getUnplayedCards,
    getJiuzheCard,
    playJiuzheCard,
    declineOpportunity,
    getPendingOpportunity,
    seedDebugTraceGrid,
    countSectorWinsByColor,
    countOwnedTech,
    countOrbitMarkers,
    countLandingMarkers,
    getCompanyBaseIncome,
    countIncomeIncreases,
    countJiuzheTraces,
    countAllTraceMarkersByColor,
    countOtherAlienTraces,
    isCardConditionMet,
    scorePlayedCards,
    getHighestThreatPlayers,
    shouldApplyThreatPenalty,
    formatTraceLabel,
  });
});
