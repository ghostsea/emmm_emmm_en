(function (root, factory) {
  "use strict";

  let players = root.SetiPlayers;
  let cards = root.SetiCards;
  let data = root.SetiData;
  let planetStats = root.SetiPlanetStats;
  let aliens = root.SetiAliens;

  if ((!players || !cards || !data || !planetStats || !aliens) && typeof require === "function") {
    players = players || require("./players");
    cards = cards || require("./cards/deck");
    data = data || require("./data");
    planetStats = planetStats || require("./planet-stats");
    aliens = aliens || require("./aliens");
  }

  const api = factory(players, cards, data, planetStats, aliens);

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.SetiInitialCards = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function (
  players,
  cards,
  data,
  planetStats,
  aliens,
) {
  "use strict";

  const INITIAL_CARD_COUNT = 21;
  const NEBULA_BY_KEY = Object.freeze({
    siriusA: "sector-2-a",
    barnard: "sector-2-b",
    vega: "sector-1-b",
    pictorBeta: "sector-4-b",
    virgo61: "sector-4-a",
    procyon: "sector-1-a",
    proxima: "sector-3-b",
    kepler22: "sector-3-a",
  });

  const INITIAL_CARD_EFFECTS = Object.freeze({
    1: Object.freeze({ label: "天狼星A扫描两次", scan: Object.freeze({ nebulaId: NEBULA_BY_KEY.siriusA, count: 2 }) }),
    2: Object.freeze({ label: "3分、1信用点、1盲抽", resources: Object.freeze({ score: 3, credits: 1 }), blindDraw: 1 }),
    3: Object.freeze({
      label: "3分、1盲抽、1宣传、火星环绕器",
      resources: Object.freeze({ score: 3, publicity: 1 }),
      blindDraw: 1,
      orbitPlanetId: "mars",
    }),
    4: Object.freeze({
      label: "3分、1能量、1宣传、金星环绕器",
      resources: Object.freeze({ score: 3, energy: 1, publicity: 1 }),
      orbitPlanetId: "venus",
    }),
    5: Object.freeze({
      label: "4分、2宣传、土星环绕器",
      resources: Object.freeze({ score: 4, publicity: 2 }),
      orbitPlanetId: "saturn",
    }),
    6: Object.freeze({
      label: "织女一扫描一次、1额外公共扫描",
      scan: Object.freeze({ nebulaId: NEBULA_BY_KEY.vega, count: 1 }),
      resources: Object.freeze({ additionalPublicScan: 1 }),
    }),
    7: Object.freeze({
      label: "1数据收入、天王星环绕器",
      income: Object.freeze({ availableData: 1 }),
      orbitPlanetId: "uranus",
    }),
    8: Object.freeze({
      label: "2分、2信用点、1宣传、水星环绕器",
      resources: Object.freeze({ score: 2, credits: 2, publicity: 1 }),
      orbitPlanetId: "mercury",
    }),
    9: Object.freeze({
      label: "1盲抽收入、海王星环绕器",
      income: Object.freeze({ handSize: 1 }),
      orbitPlanetId: "neptune",
    }),
    10: Object.freeze({ label: "外星人2黄色痕迹", alienTrace: Object.freeze({ alienSlotId: 2, traceType: "yellow" }) }),
    11: Object.freeze({ label: "外星人2粉色痕迹", alienTrace: Object.freeze({ alienSlotId: 2, traceType: "pink" }) }),
    12: Object.freeze({ label: "巴纳德扇区扫描两次", scan: Object.freeze({ nebulaId: NEBULA_BY_KEY.barnard, count: 2 }) }),
    13: Object.freeze({ label: "绘架座β扫描两次", scan: Object.freeze({ nebulaId: NEBULA_BY_KEY.pictorBeta, count: 2 }) }),
    14: Object.freeze({ label: "3分、1能量、1盲抽", resources: Object.freeze({ score: 3, energy: 1 }), blindDraw: 1 }),
    15: Object.freeze({
      label: "4分、1额外公共扫描、1宣传",
      resources: Object.freeze({ score: 4, additionalPublicScan: 1, publicity: 1 }),
    }),
    16: Object.freeze({ label: "3分、3宣传", resources: Object.freeze({ score: 3, publicity: 3 }) }),
    17: Object.freeze({ label: "室女座61扫描两次", scan: Object.freeze({ nebulaId: NEBULA_BY_KEY.virgo61, count: 2 }) }),
    18: Object.freeze({ label: "南河三扫描两次", scan: Object.freeze({ nebulaId: NEBULA_BY_KEY.procyon, count: 2 }) }),
    19: Object.freeze({ label: "比邻星扫描两次", scan: Object.freeze({ nebulaId: NEBULA_BY_KEY.proxima, count: 2 }) }),
    20: Object.freeze({ label: "开普勒22扫描两次", scan: Object.freeze({ nebulaId: NEBULA_BY_KEY.kepler22, count: 2 }) }),
    21: Object.freeze({
      label: "3分、1数据、1宣传、木星环绕器",
      resources: Object.freeze({ score: 3, publicity: 1 }),
      dataGain: 1,
      orbitPlanetId: "jupiter",
    }),
  });

  function getInitialCardNumber(card) {
    if (Number.isInteger(card?.number)) return card.number;
    const idMatch = String(card?.id || "").match(/initial:(\d+)/);
    if (idMatch) return Number(idMatch[1]);
    const srcMatch = String(card?.src || "").match(/\/(\d+)\.[a-z0-9]+$/i);
    if (srcMatch) return Number(srcMatch[1]);
    const labelMatch = String(card?.label || "").match(/(\d+)/);
    return labelMatch ? Number(labelMatch[1]) : null;
  }

  function getInitialCardEffect(cardOrNumber) {
    const number = Number.isInteger(cardOrNumber)
      ? cardOrNumber
      : getInitialCardNumber(cardOrNumber);
    return INITIAL_CARD_EFFECTS[number] || null;
  }

  function getPlayerById(context, playerId) {
    return (context?.playerState?.players || []).find((player) => player.id === playerId) || null;
  }

  function getTokenSrc(context, player) {
    if (typeof context?.getPlayerTokenSrc === "function") {
      return context.getPlayerTokenSrc(player);
    }
    return players.getPlayerColorDefinition(player?.color)?.normalTokenAsset || null;
  }

  function pushResult(results, result) {
    if (result) results.push(result);
    return result;
  }

  function applyResources(player, gain, results) {
    if (!gain || !Object.keys(gain).length) return;
    players.gainResources(player, gain);
    const labels = {
      score: "分",
      credits: "信用点",
      energy: "能量",
      publicity: "宣传",
      availableData: "数据",
      additionalPublicScan: "额外公共扫描",
      handSize: "手牌",
    };
    pushResult(results, {
      ok: true,
      type: "resources",
      gain: { ...gain },
      message: `获得 ${
        Object.entries(gain).map(([key, value]) => `${value}${labels[key] || key}`).join("、")
      }`,
    });
  }

  function applyIncome(player, gain, results) {
    if (!gain || !Object.keys(gain).length) return;
    players.gainIncome(player, gain);
    const labels = {
      credits: "信用点",
      energy: "能量",
      handSize: "盲抽",
      publicity: "宣传",
      availableData: "数据",
      additionalPublicScan: "额外公共扫描",
    };
    pushResult(results, {
      ok: true,
      type: "income",
      gain: { ...gain },
      message: `收入 +${Object.entries(gain).map(([key, value]) => `${value}${labels[key] || key}`).join("、")}`,
    });
  }

  function applyDataGain(player, count, results) {
    const target = Math.max(0, Math.round(Number(count) || 0));
    for (let index = 0; index < target; index += 1) {
      const result = data.gainData(player, { source: "initial_card" });
      pushResult(results, {
        ...result,
        type: "data",
      });
    }
  }

  function applyBlindDraw(context, player, count, results) {
    const target = Math.max(0, Math.round(Number(count) || 0));
    for (let index = 0; index < target; index += 1) {
      const result = typeof context?.blindDrawCard === "function"
        ? context.blindDrawCard(player)
        : cards.blindDraw(context.cardState, context.playerState, player);
      pushResult(results, {
        ...result,
        type: "blindDraw",
        message: result.ok
          ? `盲抽 ${cards.getCardLabel(result.card)}`
          : result.message,
      });
    }
  }

  function replaceNextSectorData(context, player, nebulaId) {
    const nextToken = data.getNextReplaceableNebulaToken(context.nebulaDataState, nebulaId);
    const options = {
      playerColor: player.color,
      playerLabel: player.colorLabel,
      playerTokenSrc: getTokenSrc(context, player),
      source: "initial_card",
    };
    if (nextToken) {
      const replaceResult = data.replaceNextNebulaDataToken(
        context.nebulaDataState,
        nebulaId,
        player,
        options,
      );
      if (!replaceResult.ok) return replaceResult;
      const gainResult = data.gainData(player, { source: "initial_card" });
      return {
        ...replaceResult,
        ok: true,
        type: "scan",
        gainedData: gainResult,
        events: [{ type: "signalMarked", nebulaId, playerId: player.id }],
        message: `${replaceResult.message}；${gainResult.ok ? "获得数据" : gainResult.message}`,
      };
    }
    if (typeof data.addSectorExtraMark !== "function") {
      return { ok: false, type: "scan", message: `${data.getNebulaLabel(nebulaId)}没有可替换的数据` };
    }
    const extraResult = data.addSectorExtraMark(context.nebulaDataState, nebulaId, player, options);
    return {
      ...extraResult,
      type: "scan",
      events: extraResult.ok ? [{ type: "signalMarked", nebulaId, playerId: player.id }] : [],
    };
  }

  function applySectorScan(context, player, scan, results, events) {
    if (!scan?.nebulaId) return;
    const count = Math.max(0, Math.round(Number(scan.count) || 0));
    for (let index = 0; index < count; index += 1) {
      const result = replaceNextSectorData(context, player, scan.nebulaId);
      pushResult(results, result);
      for (const event of result.events || []) events.push(event);
      if (!result.ok) break;
    }
  }

  function applyOrbitMarker(context, player, planetId, results) {
    if (!planetId) return;
    const result = planetStats.addPlanetOrbitMarker(context.planetStatsState, planetId, player);
    if (result.ok) {
      players.incrementPlayerOrbitCount(context.playerState, player.id);
    }
    pushResult(results, {
      ...result,
      type: "orbit",
      planetId,
      noReward: true,
      message: result.ok
        ? `${planetId} 放置环绕器#${result.marker.sequence}（不获得环绕奖励）`
        : result.message,
    });
  }

  function applyAlienTrace(context, player, trace, results, events) {
    if (!trace || !context.alienGameState) return;
    const result = aliens.placeFirstTrace(
      context.alienGameState,
      trace.alienSlotId,
      trace.traceType,
      player.color,
    );
    let revealResult = null;
    if (result.ok && result.readyToReveal) {
      revealResult = aliens.revealAlien(context.alienGameState, trace.alienSlotId);
    }
    pushResult(results, {
      ...result,
      type: "alienTrace",
      trace,
      revealed: revealResult || null,
      message: revealResult?.ok ? `${result.message}；${revealResult.message}` : result.message,
    });
    if (result.ok) {
      events.push({
        type: "alienTracePlaced",
        alienSlotId: trace.alienSlotId,
        traceType: trace.traceType,
        playerId: player.id,
      });
    }
  }

  function resolveInitialCardEffect(context, player, card) {
    const number = getInitialCardNumber(card);
    const effect = getInitialCardEffect(number);
    const results = [];
    const events = [];

    if (!player) {
      return { ok: false, cardNumber: number, card, results, events, message: "没有玩家" };
    }
    if (!effect) {
      return { ok: false, cardNumber: number, card, results, events, message: `未知初始牌 ${number || ""}` };
    }

    applyResources(player, effect.resources, results);
    applyIncome(player, effect.income, results);
    applyDataGain(player, effect.dataGain, results);
    applyBlindDraw(context, player, effect.blindDraw, results);
    applySectorScan(context, player, effect.scan, results, events);
    applyOrbitMarker(context, player, effect.orbitPlanetId, results);
    applyAlienTrace(context, player, effect.alienTrace, results, events);

    const failed = results.filter((result) => !result.ok);
    return {
      ok: failed.length === 0,
      cardNumber: number,
      card,
      effect,
      results,
      events,
      message: failed.length
        ? `初始牌${number}：${failed.map((item) => item.message).join("；")}`
        : `初始牌${number}：${effect.label}`,
    };
  }

  function resolveInitialSelections(context, options = {}) {
    const sourcePlayerIds = Array.isArray(options.playerIds) && options.playerIds.length
      ? options.playerIds
      : (context?.playerState?.players || []).map((player) => player.id);
    const originalPlayerId = context?.playerState?.currentPlayerId || null;
    const results = [];
    const events = [];

    for (const playerId of sourcePlayerIds) {
      const player = getPlayerById(context, playerId);
      const selectedInitialCards = player?.initialSelection?.removedInitialCards || [];
      if (!player || !selectedInitialCards.length) continue;

      context.playerState.currentPlayerId = player.id;
      for (const card of selectedInitialCards) {
        const result = resolveInitialCardEffect(context, player, card);
        results.push(result);
        for (const event of result.events || []) events.push(event);
      }
    }

    if (context?.playerState && originalPlayerId) {
      context.playerState.currentPlayerId = originalPlayerId;
    }

    const failed = results.filter((result) => !result.ok);
    return {
      ok: failed.length === 0,
      results,
      events,
      message: results.length
        ? `初始牌结算 ${results.length} 张${failed.length ? `，失败 ${failed.length}` : ""}`
        : "没有需要结算的初始牌",
    };
  }

  return Object.freeze({
    INITIAL_CARD_COUNT,
    INITIAL_CARD_EFFECTS,
    NEBULA_BY_KEY,
    getInitialCardNumber,
    getInitialCardEffect,
    resolveInitialCardEffect,
    resolveInitialSelections,
  });
});
