(function (root, factory) {
  "use strict";

  let observation = root.SetiAIObservation;
  let solar = root.SetiSolarSystem;

  if ((!observation || !solar) && typeof require === "function") {
    observation = require("./observation");
    solar = solar || require("../../solar-system/core");
  }

  const api = factory(observation, solar);

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.SetiAIObservation = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function (observationModule, solarModule) {
  "use strict";

  const ENTITY_TYPES = Object.freeze([
    "GLOBAL",
    "PLAYER",
    "ROCKET",
    "PLANET_OR_SECTOR",
    "TECH_TILE",
    "OWNED_TECH",
    "DATA_TOKEN",
    "DATA_CLUSTER",
    "INDUSTRY",
    "ALIEN",
    "FINAL_SCORING",
    "ACTION",
    "CARD",
  ]);
  const ENTITY_ZONES = Object.freeze([
    "global",
    "players",
    "solar",
    "tech",
    "data",
    "industry",
    "alien",
    "final",
    "actions",
    "cards",
  ]);
  const ENTITY_FLAG_KEYS = Object.freeze([
    "hasPendingState",
    "isCurrentPlayer",
    "passed",
    "launched",
    "orbiting",
    "landed",
    "candidateAvailable",
    "hasActionGraph",
    "faceUp",
    "isPublicCard",
    "isReservedCard",
    "isDiscardCard",
    "isSupplyTech",
    "isOwnedTech",
    "isDisabledTech",
    "isDataPool",
    "isDataPlaced",
    "isDataCluster",
    "isIndustryPassiveUsed",
    "isAlienRevealed",
    "isFinalTile",
  ]);

  const CARD_ZONE = Object.freeze({
    HAND: 1,
    RESERVED: 2,
    PUBLIC: 3,
    DISCARD: 4,
  });

  const TECH_TYPE_CODE = Object.freeze({
    blue: 1,
    orange: 2,
    purple: 3,
  });

  const TECH_BONUS_CODE = Object.freeze({
    bonus_3f: 1,
    bonus_1p: 2,
    bonus_1m: 3,
    bonus_1c: 4,
  });

  const DATA_PLACEMENT_KIND_CODE = Object.freeze({
    pool: 1,
    computer: 2,
    blueBonus: 3,
    nebula: 4,
  });

  const ALIEN_ID_CODE = Object.freeze({
    "九折": 1,
    "半人马": 2,
    "奥陌陌": 3,
    "异常点": 4,
    "方舟": 5,
    "符文族": 6,
    "虫": 7,
    "阿米巴": 8,
  });

  const FINAL_TILE_CODE = Object.freeze({
    a: 1,
    b: 2,
    c: 3,
    d: 4,
  });

  function clone(value) {
    if (value == null) return value;
    if (typeof structuredClone === "function") {
      return structuredClone(value);
    }
    return JSON.parse(JSON.stringify(value));
  }

  function pick(object = {}, keys = []) {
    const result = {};
    for (const key of keys) {
      if (object[key] !== undefined) result[key] = clone(object[key]);
    }
    return result;
  }

  function summarizeResources(resources = {}) {
    return pick(resources, [
      "score",
      "credits",
      "energy",
      "publicity",
      "availableData",
      "handSize",
      "additionalPublicScan",
      "aomomoFossils",
    ]);
  }

  function summarizePlayerPublic(player = {}) {
    return {
      id: player.id || null,
      color: player.color || null,
      colorLabel: player.colorLabel || null,
      name: player.name || null,
      resources: summarizeResources(player.resources || {}),
      handSize: Array.isArray(player.hand) ? player.hand.length : Math.max(0, Math.round(Number(player.resources?.handSize) || 0)),
      reservedCardCount: Array.isArray(player.reservedCards) ? player.reservedCards.length : 0,
      completedTaskCount: Math.max(0, Math.round(Number(player.completedTaskCount) || 0)),
    };
  }

  function summarizePlayerPrivate(player = {}) {
    return {
      id: player.id || null,
      color: player.color || null,
      colorLabel: player.colorLabel || null,
      name: player.name || null,
      resources: summarizeResources(player.resources || {}),
      hand: clone(Array.isArray(player.hand) ? player.hand : []),
      reservedCards: clone(Array.isArray(player.reservedCards) ? player.reservedCards : []),
      techState: clone(player.techState || null),
      openingPlan: clone(player.openingPlan || null),
      initialSelection: clone(player.initialSelection || null),
    };
  }

  function summarizePlayerHidden(player = {}) {
    return {
      id: player.id || null,
      color: player.color || null,
      colorLabel: player.colorLabel || null,
      name: player.name || null,
      resources: summarizeResources(player.resources || {}),
      handSize: Array.isArray(player.hand) ? player.hand.length : Math.max(0, Math.round(Number(player.resources?.handSize) || 0)),
      reservedCardCount: Array.isArray(player.reservedCards) ? player.reservedCards.length : 0,
      completedTaskCount: Math.max(0, Math.round(Number(player.completedTaskCount) || 0)),
    };
  }

  function normalizeNumber(value, fallback = 0) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  function normalizePlayerSeat(players = [], currentPlayerId = null) {
    const ordered = (players || [])
      .map((player, index) => ({
        id: player?.id || null,
        index,
      }))
      .filter((entry) => entry.id);
    const meIndex = ordered.find((entry) => entry.id === currentPlayerId)?.index ?? 0;
    const out = Object.create(null);
    for (const entry of ordered) {
      out[entry.id] = ((entry.index - meIndex) + ordered.length) % Math.max(1, ordered.length);
    }
    return out;
  }

  function toCompactEntity(type, zone, ownerId, slotId, numeric = {}, flags = {}, position = {}) {
    const normalizedType = ENTITY_TYPES.includes(String(type || "").toUpperCase())
      ? String(type || "").toUpperCase()
      : "UNKNOWN";
    const normalizedZone = ENTITY_ZONES.includes(String(zone || "").toLowerCase())
      ? String(zone || "").toLowerCase()
      : "global";
    return {
      type: normalizedType,
      zone: normalizedZone,
      ownerId: ownerId == null ? null : String(ownerId),
      slotId: slotId == null ? null : String(slotId),
      numeric: clone(numeric || {}),
      flags: clone(flags || {}),
      position: clone(position || {}),
    };
  }

  function normalizeRockets(rocketState = null, fallback = null) {
    const raw = rocketState?.rockets ?? fallback;
    if (Array.isArray(raw)) return raw;
    if (raw && typeof raw === "object") return Object.values(raw);
    return [];
  }

  function normalizeLegalActions(candidates = []) {
    return (candidates || [])
      .filter((candidate) => candidate && candidate.available !== false)
      .map((candidate, index) => ({
        id: String(candidate.id || candidate.actionId || "unknown"),
        kind: String(candidate.kind || "unknown"),
        available: true,
        score: normalizeNumber(candidate.score),
        net: normalizeNumber(candidate.net),
        actionGraphNet: normalizeNumber(candidate?.actionGraph?.net),
        actionGraphFinalMarginal: normalizeNumber(candidate?.actionGraph?.finalMarginal),
        costCredits: normalizeNumber(candidate?.cost?.credits),
        costEnergy: normalizeNumber(candidate?.cost?.energy),
        gainCredits: normalizeNumber(candidate?.gain?.credits),
        gainEnergy: normalizeNumber(candidate?.gain?.energy),
        rank: index,
      }));
  }

  function collectPlanetSectorEntities(gameState = {}, turnRound = 0, currentPlayerId = null) {
    const rotation = normalizeNumber(gameState?.solarState?.rotation, 0);
    const planetLocations = typeof solarModule?.collectPlanetLocations === "function"
      ? solarModule.collectPlanetLocations(gameState?.solarState || { rotation: 0, aomomoActive: true })
      : [];
    const planetStatsById = gameState?.planetStats?.planets || {};
    const entities = [];
    for (const planet of planetLocations || []) {
      const planetId = String(planet?.planetId || "unknown");
      const ring = normalizeNumber(planet?.y, 0);
      const sector = normalizeNumber(planet?.x, 0);
      const stats = planetStatsById[planetId] || {};
      entities.push(toCompactEntity(
        "PLANET_OR_SECTOR",
        "solar",
        null,
        `planet:${planetId}`,
        {
          bodyType: 1,
          ring,
          sector,
          relativeAngle: sector * 45,
          rotationOffset: rotation,
          orbitCount: normalizeNumber(stats?.orbits, 0),
          landingCount: normalizeNumber(stats?.landings, 0),
          orbitMarkerCount: Array.isArray(stats?.orbitMarkers) ? stats.orbitMarkers.length : 0,
          landingMarkerCount: Array.isArray(stats?.landingMarkers) ? stats.landingMarkers.length : 0,
          satelliteLandingCount: Array.isArray(stats?.satelliteLandings) ? stats.satelliteLandings.length : 0,
          fixedAfterSetup: Boolean(planet?.fixedAfterSetup) ? 1 : 0,
          roundNumber: turnRound,
        },
        {
          isCurrentPlayer: false,
          hasPendingState: false,
          launched: false,
          orbiting: false,
          landed: false,
          candidateAvailable: false,
          hasActionGraph: false,
          passed: false,
        },
        {
          ring,
          sector,
        },
      ));
    }
    return entities;
  }

  function normalizeCardTypeCode(card = {}) {
    return normalizeNumber(card?.cardTypeCode, -1);
  }

  function buildCardEntity(card = {}, ownerId = null, slotId = "card", zoneCode = 0, zoneLabel = "cards", index = 0) {
    const cardId = String(card?.cardId || card?.id || `${slotId}:${index}`);
    const price = normalizeNumber(card?.price, -1);
    const cardTypeCode = normalizeCardTypeCode(card);
    const discardActionCode = normalizeNumber(card?.discardActionCode, -1);
    const scanActionCode = normalizeNumber(card?.scanActionCode, -1);
    const incomeCode = normalizeNumber(card?.incomeCode, -1);
    return toCompactEntity(
      "CARD",
      "cards",
      ownerId,
      `${slotId}:${cardId}:${index}`,
      {
        zoneCode,
        cardTypeCode,
        price,
        discardActionCode,
        scanActionCode,
        incomeCode,
        faceUpNumeric: card?.faceUp ? 1 : 0,
        zoneIndex: index,
      },
      {
        faceUp: Boolean(card?.faceUp),
        isPublicCard: zoneCode === CARD_ZONE.PUBLIC,
        isReservedCard: zoneCode === CARD_ZONE.RESERVED,
        isDiscardCard: zoneCode === CARD_ZONE.DISCARD,
        isCurrentPlayer: Boolean(ownerId),
        hasPendingState: false,
        passed: false,
        launched: false,
        orbiting: false,
        landed: false,
        candidateAvailable: false,
        hasActionGraph: false,
      },
      {
        ring: zoneCode,
        sector: index,
      },
    );
  }

  function collectCardEntities(gameState = {}, currentPlayerId = null) {
    const entities = [];
    const playerState = gameState.playerState || { players: [] };
    const players = Array.isArray(playerState.players) ? playerState.players : [];
    const currentPlayer = players.find((player) => player?.id === currentPlayerId) || null;

    const handCards = Array.isArray(currentPlayer?.hand) ? currentPlayer.hand : [];
    for (let index = 0; index < handCards.length; index += 1) {
      entities.push(buildCardEntity(handCards[index], currentPlayerId, "hand", CARD_ZONE.HAND, "cards", index));
    }

    const reservedCards = Array.isArray(currentPlayer?.reservedCards) ? currentPlayer.reservedCards : [];
    for (let index = 0; index < reservedCards.length; index += 1) {
      entities.push(buildCardEntity(reservedCards[index], currentPlayerId, "reserved", CARD_ZONE.RESERVED, "cards", index));
    }

    const publicCards = Array.isArray(gameState?.cardState?.publicCards) ? gameState.cardState.publicCards : [];
    for (let index = 0; index < publicCards.length; index += 1) {
      const card = publicCards[index];
      if (!card) continue;
      entities.push(buildCardEntity(card, null, "public", CARD_ZONE.PUBLIC, "cards", index));
    }

    const discardPile = Array.isArray(gameState?.cardState?.discardPile) ? gameState.cardState.discardPile : [];
    const discardLimit = Math.min(8, discardPile.length);
    for (let index = 0; index < discardLimit; index += 1) {
      const card = discardPile[discardPile.length - 1 - index];
      if (!card) continue;
      entities.push(buildCardEntity(card, null, "discard", CARD_ZONE.DISCARD, "cards", index));
    }

    return entities;
  }

  function parseTechTileId(tileId = null) {
    const raw = String(tileId || "");
    const match = raw.match(/^(blue|orange|purple)(\d)$/);
    if (!match) {
      return {
        techType: null,
        techTypeCode: 0,
        stackIndex: -1,
      };
    }
    return {
      techType: match[1],
      techTypeCode: TECH_TYPE_CODE[match[1]] || 0,
      stackIndex: normalizeNumber(match[2], -1),
    };
  }

  function collectTechEntities(gameState = {}, players = [], seatByPlayerId = {}, currentPlayerId = null) {
    const entities = [];
    const techState = gameState?.techState || gameState?.techGameState || null;
    const techBoard = techState?.board || gameState?.techBoardState || null;
    const stacks = techBoard?.stacks && typeof techBoard.stacks === "object"
      ? techBoard.stacks
      : {};

    const stackEntries = Object.entries(stacks)
      .filter(([tileId]) => Boolean(tileId))
      .sort(([a], [b]) => String(a).localeCompare(String(b)));
    for (const [tileId, stack] of stackEntries) {
      const parsed = parseTechTileId(tileId);
      const remaining = normalizeNumber(stack?.remaining, 0);
      const depleted = Boolean(stack?.depleted);
      const bonusCode = TECH_BONUS_CODE[String(stack?.bonusId || "")] || 0;
      entities.push(toCompactEntity(
        "TECH_TILE",
        "tech",
        null,
        `supply:${tileId}`,
        {
          techTypeCode: parsed.techTypeCode,
          stackIndex: normalizeNumber(stack?.stackIndex, parsed.stackIndex),
          remaining,
          bonusCode,
          bonusIndex: normalizeNumber(stack?.bonusIndex, -1),
          firstTakeClaimed: stack?.firstTakeClaimedBy == null ? 0 : 1,
          firstTakeClaimedBySeat: stack?.firstTakeClaimedBy == null
            ? -1
            : normalizeNumber(seatByPlayerId?.[stack.firstTakeClaimedBy], -1),
          availableNumeric: !depleted && remaining > 0 ? 1 : 0,
        },
        {
          isCurrentPlayer: stack?.firstTakeClaimedBy != null && String(stack.firstTakeClaimedBy) === String(currentPlayerId),
          isSupplyTech: !depleted && remaining > 0,
          isOwnedTech: false,
          isDisabledTech: false,
          hasPendingState: false,
          passed: false,
          launched: false,
          orbiting: false,
          landed: false,
          candidateAvailable: false,
          hasActionGraph: false,
        },
        {
          ring: parsed.techTypeCode,
          sector: normalizeNumber(stack?.stackIndex, parsed.stackIndex),
        },
      ));
    }

    for (let playerIndex = 0; playerIndex < players.length; playerIndex += 1) {
      const player = players[playerIndex] || {};
      const playerId = player?.id || null;
      const seat = normalizeNumber(seatByPlayerId?.[playerId], playerIndex);
      const playerTechState = player?.techState || {};
      const ownedTiles = playerTechState?.ownedTiles && typeof playerTechState.ownedTiles === "object"
        ? playerTechState.ownedTiles
        : {};
      const disabledTiles = playerTechState?.disabledTiles && typeof playerTechState.disabledTiles === "object"
        ? playerTechState.disabledTiles
        : {};
      const blueBoardSlots = playerTechState?.blueBoardSlots && typeof playerTechState.blueBoardSlots === "object"
        ? playerTechState.blueBoardSlots
        : {};

      const tileIds = Object.keys(ownedTiles)
        .filter((tileId) => Boolean(ownedTiles[tileId]))
        .sort((a, b) => String(a).localeCompare(String(b)));

      for (const tileId of tileIds) {
        const parsed = parseTechTileId(tileId);
        const disabled = Boolean(disabledTiles[tileId]);
        const blueSlot = normalizeNumber(blueBoardSlots[tileId], -1);
        entities.push(toCompactEntity(
          "OWNED_TECH",
          "tech",
          playerId,
          `owned:${playerId || "unknown"}:${tileId}`,
          {
            seat,
            techTypeCode: parsed.techTypeCode,
            stackIndex: parsed.stackIndex,
            blueBoardSlot: blueSlot,
            disabledNumeric: disabled ? 1 : 0,
          },
          {
            isCurrentPlayer: playerId != null && String(playerId) === String(currentPlayerId),
            isSupplyTech: false,
            isOwnedTech: true,
            isDisabledTech: disabled,
            hasPendingState: false,
            passed: false,
            launched: false,
            orbiting: false,
            landed: false,
            candidateAvailable: false,
            hasActionGraph: false,
          },
          {
            ring: parsed.techTypeCode,
            sector: parsed.stackIndex,
          },
        ));
      }
    }

    return entities;
  }

  function normalizeDataPlacementKind(token = {}) {
    const kind = String(token?.placementKind || "").trim();
    if (kind === "computer") return DATA_PLACEMENT_KIND_CODE.computer;
    if (kind === "blueBonus") return DATA_PLACEMENT_KIND_CODE.blueBonus;
    return DATA_PLACEMENT_KIND_CODE.pool;
  }

  function collectDataEntities(gameState = {}, players = [], seatByPlayerId = {}, currentPlayerId = null) {
    const entities = [];

    for (let playerIndex = 0; playerIndex < players.length; playerIndex += 1) {
      const player = players[playerIndex] || {};
      const playerId = player?.id || null;
      const seat = normalizeNumber(seatByPlayerId?.[playerId], playerIndex);
      const dataState = player?.dataState || {};
      const poolTokens = Array.isArray(dataState?.poolTokens) ? dataState.poolTokens : [];
      const placedTokens = Array.isArray(dataState?.placedTokens) ? dataState.placedTokens : [];

      for (let index = 0; index < poolTokens.length; index += 1) {
        const token = poolTokens[index] || {};
        entities.push(toCompactEntity(
          "DATA_TOKEN",
          "data",
          playerId,
          `data:pool:${playerId || "unknown"}:${token?.id || index}`,
          {
            seat,
            placementKindCode: DATA_PLACEMENT_KIND_CODE.pool,
            tokenIndex: normalizeNumber(token?.index, index + 1),
            poolSlotIndex: normalizeNumber(token?.slotIndex, -1),
            placementSlot: -1,
            blueSlot: -1,
            discardedCount: normalizeNumber(dataState?.discardedCount, 0),
          },
          {
            isCurrentPlayer: playerId != null && String(playerId) === String(currentPlayerId),
            isDataPool: true,
            isDataPlaced: false,
            isDataCluster: false,
            hasPendingState: false,
            passed: false,
            launched: false,
            orbiting: false,
            landed: false,
            candidateAvailable: false,
            hasActionGraph: false,
          },
          {
            ring: DATA_PLACEMENT_KIND_CODE.pool,
            sector: normalizeNumber(token?.slotIndex, index),
          },
        ));
      }

      for (let index = 0; index < placedTokens.length; index += 1) {
        const token = placedTokens[index] || {};
        const kindCode = normalizeDataPlacementKind(token);
        entities.push(toCompactEntity(
          "DATA_TOKEN",
          "data",
          playerId,
          `data:placed:${playerId || "unknown"}:${token?.id || index}`,
          {
            seat,
            placementKindCode: kindCode,
            tokenIndex: normalizeNumber(token?.index, index + 1),
            poolSlotIndex: -1,
            placementSlot: normalizeNumber(token?.placementSlot, -1),
            blueSlot: normalizeNumber(token?.blueSlot, -1),
            discardedCount: normalizeNumber(dataState?.discardedCount, 0),
          },
          {
            isCurrentPlayer: playerId != null && String(playerId) === String(currentPlayerId),
            isDataPool: false,
            isDataPlaced: true,
            isDataCluster: false,
            hasPendingState: false,
            passed: false,
            launched: false,
            orbiting: false,
            landed: false,
            candidateAvailable: false,
            hasActionGraph: false,
          },
          {
            ring: kindCode,
            sector: kindCode === DATA_PLACEMENT_KIND_CODE.blueBonus
              ? normalizeNumber(token?.blueSlot, index)
              : normalizeNumber(token?.placementSlot, index),
          },
        ));
      }
    }

    const nebulaDataState = gameState?.nebulaDataState || gameState?.dataState?.nebulaDataState || null;
    const nebulae = nebulaDataState?.nebulae && typeof nebulaDataState.nebulae === "object"
      ? nebulaDataState.nebulae
      : {};
    const nebulaEntries = Object.entries(nebulae).sort(([a], [b]) => String(a).localeCompare(String(b)));
    for (const [nebulaId, bucket] of nebulaEntries) {
      const tokens = Array.isArray(bucket?.tokens) ? bucket.tokens : [];
      const playerTokenCounts = bucket?.playerTokenCounts && typeof bucket.playerTokenCounts === "object"
        ? bucket.playerTokenCounts
        : {};
      const distinctOwnerCount = Object.keys(playerTokenCounts).length;
      entities.push(toCompactEntity(
        "DATA_CLUSTER",
        "data",
        null,
        `cluster:${nebulaId}`,
        {
          nebulaIdHash: normalizeNumber(String(nebulaId).split("").reduce((sum, ch) => sum + ch.charCodeAt(0), 0), 0),
          tokenCount: tokens.length,
          distinctOwnerCount,
          lastReplacedByCurrentPlayer: bucket?.lastReplacedPlayerId != null && String(bucket.lastReplacedPlayerId) === String(currentPlayerId) ? 1 : 0,
          maxColorTokenCount: Object.values(playerTokenCounts).reduce((max, count) => Math.max(max, normalizeNumber(count, 0)), 0),
        },
        {
          isCurrentPlayer: false,
          isDataPool: false,
          isDataPlaced: false,
          isDataCluster: true,
          hasPendingState: false,
          passed: false,
          launched: false,
          orbiting: false,
          landed: false,
          candidateAvailable: false,
          hasActionGraph: false,
        },
        {
          ring: DATA_PLACEMENT_KIND_CODE.nebula,
          sector: normalizeNumber(tokens.length, 0),
        },
      ));
    }

    return entities;
  }

  function collectIndustryEntities(players = [], seatByPlayerId = {}, currentPlayerId = null) {
    const entities = [];
    for (let playerIndex = 0; playerIndex < players.length; playerIndex += 1) {
      const player = players[playerIndex] || {};
      const playerId = player?.id || null;
      const seat = normalizeNumber(seatByPlayerId?.[playerId], playerIndex);
      const strategySlots = player?.industryStrategyPassiveSlots || {};
      const alienLabPanels = player?.industryAlienLabPanels || {};
      const futureSpan = player?.industryFutureSpan || {};
      const industryCard = player?.initialSelection?.industry || null;
      const label = String(industryCard?.label || industryCard?.id || "");
      const cardHash = normalizeNumber(label.split("").reduce((sum, ch) => sum + ch.charCodeAt(0), 0), 0);
      const strategyMarked = ["yellow", "red", "blue"].reduce((sum, slotId) => sum + (strategySlots?.[slotId] ? 1 : 0), 0);
      const alienLabFaceUp = ["blue", "yellow", "pink"].reduce((sum, panelId) => sum + (alienLabPanels?.[panelId] !== false ? 1 : 0), 0);
      const futureSpanHasCard = futureSpan?.card ? 1 : 0;
      const futureSpanPlaying = futureSpan?.playing ? 1 : 0;
      const futureSpanTargetScore = normalizeNumber(futureSpan?.targetScore, -1);
      entities.push(toCompactEntity(
        "INDUSTRY",
        "industry",
        playerId,
        `industry:${playerId || "unknown"}`,
        {
          seat,
          cardHash,
          strategyMarked,
          alienLabFaceUp,
          futureSpanHasCard,
          futureSpanPlaying,
          futureSpanTargetScore,
          actionMarkedRound: normalizeNumber(player?.industryRoundMarkRound, 0),
          actionMarkedTurn: normalizeNumber(player?.industryRoundMarkTurn, 0),
        },
        {
          isCurrentPlayer: playerId != null && String(playerId) === String(currentPlayerId),
          isIndustryPassiveUsed: strategyMarked > 0 || alienLabFaceUp < 3 || futureSpanHasCard > 0,
          hasPendingState: false,
          passed: false,
          launched: false,
          orbiting: false,
          landed: false,
          candidateAvailable: false,
          hasActionGraph: false,
        },
        {
          ring: 1,
          sector: seat,
        },
      ));
    }
    return entities;
  }

  function collectAlienEntities(gameState = {}, currentPlayerId = null) {
    const entities = [];
    const alienState = gameState?.alienGameState || gameState?.alienState || null;
    const slots = alienState?.aliens && typeof alienState.aliens === "object"
      ? alienState.aliens
      : {};
    const slotEntries = Object.entries(slots).sort(([a], [b]) => Number(a) - Number(b));
    for (const [slotId, slot] of slotEntries) {
      const traces = slot?.traces || {};
      const yellow = traces?.yellow || {};
      const pink = traces?.pink || {};
      const blue = traces?.blue || {};
      const firstPlacedCount = (yellow?.firstPlaced ? 1 : 0) + (pink?.firstPlaced ? 1 : 0) + (blue?.firstPlaced ? 1 : 0);
      const extraCount = normalizeNumber(yellow?.extraCount, 0)
        + normalizeNumber(pink?.extraCount, 0)
        + normalizeNumber(blue?.extraCount, 0);
      const alienId = String(slot?.alienId || slot?.assignedAlienId || "");
      entities.push(toCompactEntity(
        "ALIEN",
        "alien",
        null,
        `alien-slot:${slotId}`,
        {
          slotIndex: normalizeNumber(slotId, -1),
          revealedNumeric: slot?.revealed ? 1 : 0,
          alienIdCode: ALIEN_ID_CODE[alienId] || 0,
          firstPlacedCount,
          extraCount,
          yellowFirstPlaced: yellow?.firstPlaced ? 1 : 0,
          pinkFirstPlaced: pink?.firstPlaced ? 1 : 0,
          blueFirstPlaced: blue?.firstPlaced ? 1 : 0,
          yellowExtraCount: normalizeNumber(yellow?.extraCount, 0),
          pinkExtraCount: normalizeNumber(pink?.extraCount, 0),
          blueExtraCount: normalizeNumber(blue?.extraCount, 0),
          currentPlayerOwnsFirstTrace: [yellow, pink, blue].some((traceSlot) => (
            traceSlot?.ownerPlayerId != null && String(traceSlot.ownerPlayerId) === String(currentPlayerId)
          )) ? 1 : 0,
        },
        {
          isCurrentPlayer: false,
          isAlienRevealed: Boolean(slot?.revealed),
          hasPendingState: false,
          passed: false,
          launched: false,
          orbiting: false,
          landed: false,
          candidateAvailable: false,
          hasActionGraph: false,
        },
        {
          ring: 1,
          sector: normalizeNumber(slotId, 0),
        },
      ));
    }
    return entities;
  }

  function collectFinalScoringEntities(gameState = {}, seatByPlayerId = {}) {
    const entities = [];
    const finalScoringState = gameState?.finalScoringState || null;
    const tiles = finalScoringState?.tiles && typeof finalScoringState.tiles === "object"
      ? finalScoringState.tiles
      : {};
    const pendingMarks = Array.isArray(finalScoringState?.pendingMarks) ? finalScoringState.pendingMarks : [];
    const tileVariants = finalScoringState?.tileVariants && typeof finalScoringState.tileVariants === "object"
      ? finalScoringState.tileVariants
      : {};
    const thresholds = Array.isArray(finalScoringState?.thresholds) ? finalScoringState.thresholds : [];

    const tileEntries = Object.entries(tiles).sort(([a], [b]) => String(a).localeCompare(String(b)));
    for (const [tileId, tile] of tileEntries) {
      const marks = Array.isArray(tile?.marks) ? tile.marks : [];
      const firstSlotCount = marks.filter((mark) => normalizeNumber(mark?.slotIndex, 0) === 1).length;
      const secondSlotCount = marks.filter((mark) => normalizeNumber(mark?.slotIndex, 0) === 2).length;
      const thirdSlotCount = marks.filter((mark) => normalizeNumber(mark?.slotIndex, 0) >= 3).length;
      const lowestThreshold = marks.length
        ? Math.min(...marks.map((mark) => normalizeNumber(mark?.threshold, 9999)))
        : -1;
      const highestThreshold = marks.length
        ? Math.max(...marks.map((mark) => normalizeNumber(mark?.threshold, -1)))
        : -1;
      entities.push(toCompactEntity(
        "FINAL_SCORING",
        "final",
        null,
        `final-tile:${tileId}`,
        {
          tileCode: FINAL_TILE_CODE[String(tileId).toLowerCase()] || 0,
          tileVariant: normalizeNumber(tileVariants?.[tileId], 1),
          markCount: marks.length,
          firstSlotCount,
          secondSlotCount,
          thirdSlotCount,
          lowestThreshold,
          highestThreshold,
          pendingMarkCountForTile: pendingMarks.filter((mark) => String(mark?.tileId || "").toLowerCase() === String(tileId).toLowerCase()).length,
          thresholdCount: thresholds.length,
        },
        {
          isCurrentPlayer: false,
          isFinalTile: true,
          hasPendingState: false,
          passed: false,
          launched: false,
          orbiting: false,
          landed: false,
          candidateAvailable: false,
          hasActionGraph: false,
        },
        {
          ring: 1,
          sector: FINAL_TILE_CODE[String(tileId).toLowerCase()] || 0,
        },
      ));
    }

    if (pendingMarks.length) {
      const minPendingThreshold = Math.min(...pendingMarks.map((mark) => normalizeNumber(mark?.threshold, 9999)));
      const maxPendingThreshold = Math.max(...pendingMarks.map((mark) => normalizeNumber(mark?.threshold, -1)));
      const distinctPendingPlayers = new Set(
        pendingMarks
          .map((mark) => mark?.playerId)
          .filter(Boolean)
          .map((playerId) => String(playerId)),
      );
      const avgPendingSeat = distinctPendingPlayers.size
        ? Array.from(distinctPendingPlayers).reduce((sum, playerId) => sum + normalizeNumber(seatByPlayerId?.[playerId], 0), 0) / distinctPendingPlayers.size
        : -1;
      entities.push(toCompactEntity(
        "FINAL_SCORING",
        "final",
        null,
        "final-pending",
        {
          tileCode: 0,
          tileVariant: 0,
          markCount: pendingMarks.length,
          firstSlotCount: 0,
          secondSlotCount: 0,
          thirdSlotCount: 0,
          lowestThreshold: minPendingThreshold,
          highestThreshold: maxPendingThreshold,
          pendingMarkCountForTile: pendingMarks.length,
          thresholdCount: thresholds.length,
          avgPendingSeat,
        },
        {
          isCurrentPlayer: false,
          isFinalTile: false,
          hasPendingState: true,
          passed: false,
          launched: false,
          orbiting: false,
          landed: false,
          candidateAvailable: false,
          hasActionGraph: false,
        },
        {
          ring: 1,
          sector: 0,
        },
      ));
    }

    return entities;
  }

  function buildCompactEntityObservation(gameState = {}, playerId = null, options = {}) {
    const playerState = gameState.playerState || { players: gameState.players || [], currentPlayerId: gameState.currentPlayerId || null };
    const players = Array.isArray(playerState.players) ? playerState.players : [];
    const currentPlayerId = playerId || playerState.currentPlayerId || null;
    const seatByPlayerId = normalizePlayerSeat(players, currentPlayerId);
    const turnRound = Math.max(0, Math.round(Number(gameState.turnState?.roundNumber ?? gameState.roundNumber) || 0));
    const turnTurn = Math.max(0, Math.round(Number(gameState.turnState?.turnNumber ?? gameState.turnNumber) || 0));
    const pendingState = options?.decisionContext?.pendingState || gameState?.pendingState || null;
    const candidates = Array.isArray(options?.candidates) ? options.candidates : [];

    const entities = [];

    entities.push(toCompactEntity(
      "GLOBAL",
      "global",
      null,
      "global",
      {
        roundNumber: turnRound,
        turnNumber: turnTurn,
        activePlayerCount: Array.isArray(gameState.turnState?.activePlayerIds) ? gameState.turnState.activePlayerIds.length : 0,
        passedPlayerCount: Array.isArray(gameState.turnState?.passedPlayerIds) ? gameState.turnState.passedPlayerIds.length : 0,
        totalRoundEstimate: 5,
        remainingRoundEstimate: Math.max(0, 5 - turnRound),
        finalTileMarkCount: Object.values(gameState?.finalScoringState?.tiles || {}).reduce((sum, tile) => sum + (Array.isArray(tile?.marks) ? tile.marks.length : 0), 0),
        finalPendingCount: Array.isArray(gameState?.finalScoringState?.pendingMarks) ? gameState.finalScoringState.pendingMarks.length : 0,
        revealedAlienSlotCount: Object.values(gameState?.alienGameState?.aliens || {}).filter((slot) => Boolean(slot?.revealed)).length,
        pendingFlagCount: Object.values(pendingState || {}).filter(Boolean).length,
        candidateCount: candidates.length,
      },
      {
        hasPendingState: Boolean(pendingState),
        isCurrentPlayer: false,
        passed: false,
        launched: false,
        orbiting: false,
        landed: false,
        candidateAvailable: false,
        hasActionGraph: false,
      },
    ));

    for (let index = 0; index < players.length; index += 1) {
      const player = players[index] || {};
      const resources = player.resources || {};
      const seat = seatByPlayerId[player.id] ?? index;
      const role = player.id === currentPlayerId ? "self" : (seat === 1 ? "next" : "opponent");
      entities.push(toCompactEntity(
        "PLAYER",
        "players",
        player.id || null,
        `seat-${seat}`,
        {
          seat,
          score: normalizeNumber(resources.score),
          credits: normalizeNumber(resources.credits),
          energy: normalizeNumber(resources.energy),
          publicity: normalizeNumber(resources.publicity),
          availableData: normalizeNumber(resources.availableData),
          handSize: Array.isArray(player.hand) ? player.hand.length : normalizeNumber(resources.handSize),
          reservedCardCount: Array.isArray(player.reservedCards) ? player.reservedCards.length : 0,
          completedTaskCount: normalizeNumber(player.completedTaskCount),
          techOwnedCount: Object.keys(player?.techState?.ownedTiles || {}).filter((tileId) => Boolean(player?.techState?.ownedTiles?.[tileId])).length,
          industryPassiveMarkedCount: ["yellow", "red", "blue"].reduce((sum, slotId) => sum + (player?.industryStrategyPassiveSlots?.[slotId] ? 1 : 0), 0),
          alienLabFaceUpCount: ["blue", "yellow", "pink"].reduce((sum, panelId) => sum + (player?.industryAlienLabPanels?.[panelId] !== false ? 1 : 0), 0),
          futureSpanHasCard: player?.industryFutureSpan?.card ? 1 : 0,
          futureSpanReady: player?.industryFutureSpan?.card && !player?.industryFutureSpan?.playing
            && Number.isFinite(Number(player?.industryFutureSpan?.targetScore))
            && normalizeNumber(resources.score, 0) >= normalizeNumber(player?.industryFutureSpan?.targetScore, 9999)
            ? 1
            : 0,
        },
        {
          isCurrentPlayer: player.id === currentPlayerId,
          role,
          passed: Array.isArray(gameState.turnState?.passedPlayerIds) ? gameState.turnState.passedPlayerIds.includes(player.id) : false,
          hasPendingState: false,
          launched: false,
          orbiting: false,
          landed: false,
          candidateAvailable: false,
          hasActionGraph: false,
        },
      ));
    }

    const rockets = normalizeRockets(gameState.rocketState, gameState.rockets);
    for (const rocket of rockets) {
      if (!rocket || typeof rocket !== "object") continue;
      const rocketId = rocket.id == null ? null : String(rocket.id);
      const ownerId = rocket.playerId || rocket.ownerId || null;
      const ring = normalizeNumber(rocket.ring ?? rocket?.y, 0);
      const sector = normalizeNumber(rocket.sector ?? rocket?.x, 0);
      entities.push(toCompactEntity(
        "ROCKET",
        "solar",
        ownerId,
        rocketId || "rocket",
        {
          ring,
          sector,
          orbitingPlanetId: normalizeNumber(rocket.orbitingPlanetId, -1),
          movePoints: normalizeNumber(rocket.movePoints),
          slotIndex: normalizeNumber(rocket.slotIndex, -1),
          playerSequence: normalizeNumber(rocket.playerSequence, -1),
          movableNumeric: rocket?.movementLocked ? 0 : 1,
          surfaceCode: String(rocket?.surface || "solar-board") === "solar-board" ? 1 : 2,
          sectorX: normalizeNumber(rocket?.sectorX, -1),
          sectorY: normalizeNumber(rocket?.sectorY, -1),
        },
        {
          launched: Boolean(rocket.launched),
          orbiting: Boolean(rocket.orbiting),
          landed: Boolean(rocket.landed),
          isCurrentPlayer: ownerId === currentPlayerId,
          passed: false,
          hasPendingState: false,
          candidateAvailable: false,
          hasActionGraph: false,
        },
        {
          ring,
          sector,
        },
      ));
    }

    const planetEntities = collectPlanetSectorEntities(gameState, turnRound, currentPlayerId);
    entities.push(...planetEntities);

    const techEntities = collectTechEntities(gameState, players, seatByPlayerId, currentPlayerId);
    entities.push(...techEntities);

    const dataEntities = collectDataEntities(gameState, players, seatByPlayerId, currentPlayerId);
    entities.push(...dataEntities);

    const industryEntities = collectIndustryEntities(players, seatByPlayerId, currentPlayerId);
    entities.push(...industryEntities);

    const alienEntities = collectAlienEntities(gameState, currentPlayerId);
    entities.push(...alienEntities);

    const finalScoringEntities = collectFinalScoringEntities(gameState, seatByPlayerId);
    entities.push(...finalScoringEntities);

    const cardEntities = collectCardEntities(gameState, currentPlayerId);
    entities.push(...cardEntities);

    const legalActions = normalizeLegalActions(candidates);
    for (const action of legalActions) {
      entities.push(toCompactEntity(
        "ACTION",
        "actions",
        currentPlayerId,
        `action:${action.id}`,
        {
          rank: normalizeNumber(action.rank, 0),
          score: normalizeNumber(action.score, 0),
          net: normalizeNumber(action.net, 0),
          actionGraphNet: normalizeNumber(action.actionGraphNet, 0),
          actionGraphFinalMarginal: normalizeNumber(action.actionGraphFinalMarginal, 0),
          costCredits: normalizeNumber(action.costCredits, 0),
          costEnergy: normalizeNumber(action.costEnergy, 0),
          gainCredits: normalizeNumber(action.gainCredits, 0),
          gainEnergy: normalizeNumber(action.gainEnergy, 0),
          actionKindHash: normalizeNumber(action.kind.split("").reduce((sum, ch) => sum + ch.charCodeAt(0), 0), 0),
        },
        {
          candidateAvailable: true,
          hasActionGraph: Number.isFinite(Number(action.actionGraphNet)) && Number(action.actionGraphNet) !== 0,
          isCurrentPlayer: true,
          hasPendingState: false,
          passed: false,
          launched: false,
          orbiting: false,
          landed: false,
        },
        {
          ring: 0,
          sector: normalizeNumber(action.rank, 0),
        },
      ));
    }

    const entityStats = {
      entityCount: entities.length,
      playerCount: players.length,
      rocketCount: rockets.length,
      planetOrSectorCount: planetEntities.length,
      techEntityCount: techEntities.length,
      dataEntityCount: dataEntities.length,
      industryEntityCount: industryEntities.length,
      alienEntityCount: alienEntities.length,
      finalScoringEntityCount: finalScoringEntities.length,
      cardEntityCount: cardEntities.length,
      actionEntityCount: legalActions.length,
      legalActionCount: legalActions.length,
    };

    return {
      observationVersion: 3,
      decision: {
        actionLevel: options?.decisionContext?.actionLevel || "turn",
        decisionType: options?.decisionContext?.decisionType || "turn-action",
        pendingScanTargetType: options?.decisionContext?.pendingScanTargetType
          || pendingState?.pendingScanTargetType
          || null,
      },
      globalFeatures: {
        roundNumber: turnRound,
        turnNumber: turnTurn,
        currentPlayerId,
      },
      compactEntities: entities,
      legalActions,
      entityStats,
    };
  }

  function buildObservation(gameState = {}, playerId = null, options = {}) {
    const playerState = gameState.playerState || { players: gameState.players || [], currentPlayerId: gameState.currentPlayerId || null };
    const players = Array.isArray(playerState.players) ? playerState.players : [];
    const currentPlayerId = playerId || playerState.currentPlayerId || null;
    const currentPlayer = players.find((player) => player?.id === currentPlayerId) || null;
    const publicCards = clone(gameState.cardState?.publicCards || []);
    const discardPile = Array.isArray(gameState.cardState?.discardPile) ? clone(gameState.cardState.discardPile) : [];

    const decisionContext = {
      actionLevel: options?.decisionContext?.actionLevel || "turn",
      decisionType: options?.decisionContext?.decisionType || "turn-action",
      pendingState: clone(options?.decisionContext?.pendingState || gameState?.pendingState || null),
      pendingScanTargetType: options?.decisionContext?.pendingScanTargetType
        || options?.decisionContext?.pendingState?.pendingScanTargetType
        || gameState?.pendingState?.pendingScanTargetType
        || null,
    };

    return {
      observationVersion: 2,
      decision: decisionContext,
      public: {
        roundNumber: Math.max(0, Math.round(Number(gameState.turnState?.roundNumber ?? gameState.roundNumber) || 0)),
        turnNumber: Math.max(0, Math.round(Number(gameState.turnState?.turnNumber ?? gameState.turnNumber) || 0)),
        currentPlayerId,
        activePlayerIds: clone(gameState.turnState?.activePlayerIds || []),
        playerOrder: clone(gameState.turnState?.playerOrder || []),
        publicCards,
        discardPile,
        solarSystem: clone(gameState.solarSystem || null),
        rockets: clone(gameState.rockets || gameState.rocketState?.rockets || []),
        planetStats: clone(gameState.planetStats || null),
        players: players.map((player) => summarizePlayerPublic(player)),
      },
      private: currentPlayer ? {
        currentPlayer: summarizePlayerPrivate(currentPlayer),
        setup: clone(gameState.setup || null),
        turnState: clone(gameState.turnState || null),
      } : null,
      hidden: {
        opponents: players
          .filter((player) => player?.id && player.id !== currentPlayerId)
          .map((player) => summarizePlayerHidden(player)),
        currentPlayer: currentPlayer ? summarizePlayerHidden(currentPlayer) : null,
        notes: options.hiddenNotes || null,
      },
    };
  }

  return Object.freeze({
    clone,
    pick,
    summarizeResources,
    summarizePlayerPublic,
    summarizePlayerPrivate,
    summarizePlayerHidden,
    buildObservation,
    buildCompactEntityObservation,
  });
});
