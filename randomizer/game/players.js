(function (root, factory) {
  "use strict";

  const api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.SetiPlayers = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function () {
  "use strict";

  const PLAYER_COLORS = Object.freeze({
    blue: Object.freeze({
      id: "blue",
      label: "蓝色",
      rocketAsset: "../assets/tokens/rocket-blue.png",
      satelliteAsset: "../assets/tokens/satellite-blue.png",
      landdingAsset: "../assets/tokens/landding-blue.png",
      normalTokenAsset: "../assets/tokens/normal_token-blue.png",
      uiColor: "#4da3ff",
      glowColor: "rgba(77, 163, 255, 0.72)",
    }),
    green: Object.freeze({
      id: "green",
      label: "绿色",
      rocketAsset: "../assets/tokens/rocket-green.png",
      satelliteAsset: "../assets/tokens/satellite-green.png",
      landdingAsset: "../assets/tokens/landding-green.png",
      normalTokenAsset: "../assets/tokens/normal_token-green.png",
      uiColor: "#56d37a",
      glowColor: "rgba(86, 211, 122, 0.72)",
    }),
    brown: Object.freeze({
      id: "brown",
      label: "棕色",
      rocketAsset: "../assets/tokens/rocket-brown.png",
      satelliteAsset: "../assets/tokens/satellite-brown.png",
      landdingAsset: "../assets/tokens/landding-brown.png",
      normalTokenAsset: "../assets/tokens/normal_token-brown.png",
      uiColor: "#b2845a",
      glowColor: "rgba(178, 132, 90, 0.7)",
    }),
    white: Object.freeze({
      id: "white",
      label: "白色",
      rocketAsset: "../assets/tokens/rocket-white.png",
      satelliteAsset: "../assets/tokens/satellite-white.png",
      landdingAsset: "../assets/tokens/landding-white.png",
      normalTokenAsset: "../assets/tokens/normal_token-white.png",
      uiColor: "#f3f5ef",
      glowColor: "rgba(243, 245, 239, 0.74)",
    }),
  });
  const PLAYER_COLOR_IDS = Object.freeze(Object.keys(PLAYER_COLORS));
  const DEFAULT_PLAYER_COLOR = "white";
  const RESOURCE_LIMITS = Object.freeze({
    publicity: 10,
    availableData: 6,
  });
  const DEFAULT_RESOURCES = Object.freeze({
    credits: 10,
    energy: 10,
    publicity: 0,
    availableData: 0,
    handSize: 0,
    score: 0,
  });
  const DEFAULT_INCOME = Object.freeze({
    credits: 0,
    energy: 0,
    handSize: 0,
    publicity: 0,
    availableData: 0,
  });
  const CARD_BACK_SRC = "../assets/cards/card_back.png";
  let handCardSequence = 0;

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function normalizeNumber(value, fallback) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }

  function normalizePlayerColor(color) {
    const key = String(color || DEFAULT_PLAYER_COLOR).toLowerCase();
    return PLAYER_COLORS[key] ? key : DEFAULT_PLAYER_COLOR;
  }

  function createHandCard(index) {
    handCardSequence += 1;
    return {
      id: `hand-card-${handCardSequence}-${index}`,
      src: CARD_BACK_SRC,
      faceUp: false,
    };
  }

  function normalizeHandCard(card, index) {
    const source = card || {};
    const normalized = {
      id: source.id || `hand-card-${index}`,
      src: source.src || CARD_BACK_SRC,
      faceUp: Boolean(source.faceUp),
    };
    if (source.cardId) normalized.cardId = source.cardId;
    if (source.set) normalized.set = source.set;
    if (source.cardName) normalized.cardName = source.cardName;
    if (Number.isInteger(source.price)) normalized.price = source.price;
    if (Number.isInteger(source.cardTypeCode)) normalized.cardTypeCode = source.cardTypeCode;
    if (Number.isInteger(source.discardActionCode)) normalized.discardActionCode = source.discardActionCode;
    if (Number.isInteger(source.scanActionCode)) normalized.scanActionCode = source.scanActionCode;
    if (Number.isInteger(source.incomeCode)) normalized.incomeCode = source.incomeCode;
    if (Number.isInteger(source.cardIndex)) {
      normalized.cardIndex = source.cardIndex;
    }
    return normalized;
  }

  function normalizeHand(sourceHand, handSize) {
    if (Array.isArray(sourceHand) && sourceHand.length > 0) {
      return sourceHand.map(normalizeHandCard);
    }

    const count = Math.max(0, Math.round(normalizeNumber(handSize, 0)));
    return Array.from({ length: count }, (_, index) => createHandCard(index));
  }

  function syncHandSize(player) {
    player.resources.handSize = player.hand.length;
  }

  function normalizeResources(resources) {
    const source = resources || {};
    const result = {};

    for (const [key, fallback] of Object.entries(DEFAULT_RESOURCES)) {
      const value = normalizeNumber(source[key], fallback);
      result[key] = Number.isInteger(value) ? value : Math.round(value * 100) / 100;
    }

    result.publicity = clamp(result.publicity, 0, RESOURCE_LIMITS.publicity);
    result.availableData = clamp(result.availableData, 0, RESOURCE_LIMITS.availableData);

    return result;
  }

  function normalizeIncome(income) {
    const source = income || {};
    const result = {};

    for (const [key, fallback] of Object.entries(DEFAULT_INCOME)) {
      const value = normalizeNumber(source[key], fallback);
      result[key] = Math.max(0, Number.isInteger(value) ? value : Math.round(value * 100) / 100);
    }

    return result;
  }

  function createDefaultPlayerTechState() {
    return { ownedTiles: {}, blueBoardSlots: {} };
  }

  function normalizePlayerTechState(source) {
    const ownedTiles = {};
    const blueBoardSlots = {};

    if (source?.ownedTiles && typeof source.ownedTiles === "object") {
      for (const [tileId, owned] of Object.entries(source.ownedTiles)) {
        if (owned) ownedTiles[tileId] = true;
      }
    }

    const legacy = source?.ownedTileByType;
    if (legacy && typeof legacy === "object") {
      for (const tileId of [legacy.blue, legacy.orange, legacy.purple]) {
        if (tileId) ownedTiles[tileId] = true;
      }
    }

    if (source?.blueBoardSlots && typeof source.blueBoardSlots === "object") {
      for (const [tileId, slot] of Object.entries(source.blueBoardSlots)) {
        const normalizedSlot = Number(slot);
        if (ownedTiles[tileId] && [1, 2, 3, 4].includes(normalizedSlot)) {
          blueBoardSlots[tileId] = normalizedSlot;
        }
      }
    }

    if (Number.isInteger(source?.blueBoardSlot) && ownedTiles.blue) {
      blueBoardSlots.blue = source.blueBoardSlot;
    }

    return { ownedTiles, blueBoardSlots };
  }

  function createPlayer(input) {
    const source = input || {};
    const color = normalizePlayerColor(source.color);
    const definition = PLAYER_COLORS[color];
    const orbitCount = normalizeNumber(source.orbitCount, 0);
    const resources = normalizeResources(source.resources);
    const income = normalizeIncome(source.income);
    const hand = normalizeHand(source.hand, resources.handSize);
    const reservedCards = Array.isArray(source.reservedCards)
      ? source.reservedCards.map(normalizeHandCard)
      : [];

    resources.handSize = hand.length;

    return {
      id: source.id || `player-${color}`,
      color,
      colorLabel: definition.label,
      name: source.name || `${definition.label}玩家`,
      resources,
      income,
      hand,
      reservedCards,
      techState: normalizePlayerTechState(source.techState),
      orbitCount: Number.isInteger(orbitCount) ? orbitCount : Math.round(orbitCount),
    };
  }

  function formatResourceCost(cost) {
    const parts = [];
    if (cost.credits != null) parts.push(`${cost.credits}信用点`);
    if (cost.energy != null) parts.push(`${cost.energy}能量`);
    if (cost.publicity != null) parts.push(`${cost.publicity}宣传`);
    if (cost.handSize != null) parts.push(`${cost.handSize}张牌`);
    return parts.join(" + ");
  }

  function canAfford(player, cost) {
    if (!player) return false;
    const resources = player.resources || {};
    const required = cost || {};

    if (required.credits != null && resources.credits < required.credits) return false;
    if (required.energy != null && resources.energy < required.energy) return false;
    if (required.publicity != null && resources.publicity < required.publicity) return false;
    if (required.handSize != null && resources.handSize < required.handSize) return false;

    return true;
  }

  function spendResources(player, cost) {
    const required = cost || {};
    if (!canAfford(player, required)) {
      return {
        ok: false,
        message: `资源不足，需要 ${formatResourceCost(required)}`,
      };
    }

    if (required.credits != null) player.resources.credits -= required.credits;
    if (required.energy != null) player.resources.energy -= required.energy;
    if (required.publicity != null) {
      player.resources.publicity = clamp(
        player.resources.publicity - required.publicity,
        0,
        RESOURCE_LIMITS.publicity,
      );
    }
    if (required.handSize != null) {
      const removeCount = Math.max(0, Math.round(required.handSize));
      player.hand.splice(-removeCount, removeCount);
      syncHandSize(player);
    }

    return { ok: true, message: null };
  }

  function gainResources(player, gain) {
    const reward = gain || {};
    if (reward.credits != null) player.resources.credits += reward.credits;
    if (reward.energy != null) player.resources.energy += reward.energy;
    if (reward.score != null) player.resources.score += reward.score;
    if (reward.publicity != null) {
      player.resources.publicity = clamp(
        player.resources.publicity + reward.publicity,
        0,
        RESOURCE_LIMITS.publicity,
      );
    }
    if (reward.availableData != null) {
      player.resources.availableData = clamp(
        player.resources.availableData + reward.availableData,
        0,
        RESOURCE_LIMITS.availableData,
      );
    }
    if (reward.handSize != null) {
      const addCount = Math.max(0, Math.round(reward.handSize));
      for (let index = 0; index < addCount; index += 1) {
        player.hand.push(createHandCard(player.hand.length + index));
      }
      syncHandSize(player);
    }
    return player;
  }

  function gainIncome(player, gain) {
    if (!player) return null;
    if (!player.income) player.income = normalizeIncome(null);
    const reward = gain || {};

    for (const key of Object.keys(DEFAULT_INCOME)) {
      if (reward[key] != null) {
        const value = normalizeNumber(reward[key], 0);
        player.income[key] = Math.max(0, (player.income[key] || 0) + value);
      }
    }

    return player.income;
  }

  function incrementPlayerOrbitCount(playerState, playerId) {
    const player = playerState.players.find((item) => item.id === playerId);
    if (!player) return false;
    player.orbitCount += 1;
    return true;
  }

  function createPlayerState(input) {
    const source = input || {};
    const sourcePlayers = Array.isArray(source.players) && source.players.length
      ? source.players
      : [source.currentPlayer || source.player || { color: DEFAULT_PLAYER_COLOR }];
    const normalizedPlayers = sourcePlayers.map(createPlayer);
    const requestedCurrentPlayerId = source.currentPlayerId
      || normalizedPlayers.find((player) => player.color === normalizePlayerColor(source.currentPlayerColor))?.id
      || normalizedPlayers[0].id;
    const currentPlayer = normalizedPlayers.find((player) => player.id === requestedCurrentPlayerId)
      || normalizedPlayers[0];

    return {
      players: normalizedPlayers,
      currentPlayerId: currentPlayer.id,
    };
  }

  function getCurrentPlayer(playerState) {
    if (!playerState || !Array.isArray(playerState.players)) return null;
    return playerState.players.find((player) => player.id === playerState.currentPlayerId)
      || playerState.players[0]
      || null;
  }

  function getPlayerColorDefinition(color) {
    return PLAYER_COLORS[normalizePlayerColor(color)];
  }

  return Object.freeze({
    PLAYER_COLORS,
    PLAYER_COLOR_IDS,
    DEFAULT_PLAYER_COLOR,
    RESOURCE_LIMITS,
    DEFAULT_RESOURCES,
    DEFAULT_INCOME,
    CARD_BACK_SRC,
    normalizePlayerColor,
    normalizeResources,
    normalizeIncome,
    createPlayer,
    createPlayerState,
    getCurrentPlayer,
    getPlayerColorDefinition,
    formatResourceCost,
    createDefaultPlayerTechState,
    normalizePlayerTechState,
    canAfford,
    spendResources,
    gainResources,
    gainIncome,
    incrementPlayerOrbitCount,
  });
});
