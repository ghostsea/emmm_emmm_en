(function (root, factory) {
  "use strict";

  const api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.SetiPlanetRewards = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function () {
  "use strict";

  const EFFECT_TYPES = Object.freeze({
    GAIN_RESOURCES: "gain_resources",
    GAIN_DATA: "gain_data",
    LAUNCH: "launch",
    DRAW_CARDS: "draw_cards",
    PICK_CARD: "pick_card",
    INCOME: "income",
    SCAN_PLANET_SECTOR: "scan_planet_sector",
    CHOOSE_NEBULA_SCAN: "choose_nebula_scan",
    CHOOSE_COLORED_NEBULA_SCAN: "choose_colored_nebula_scan",
    ALIEN_TRACE: "alien_trace",
    AOMOMO_CARD: "aomomo_card",
  });

  const AOMOMO_PLANET_ID = "aomomo";

  const EFFECT_ICONS = Object.freeze({
    score: "../assets/symbol/effect/score.webp",
    credits: "../assets/symbol/effect/credits.webp",
    energy: "../assets/symbol/effect/energy.webp",
    card: "../assets/symbol/effect/card.webp",
    blind_card: "../assets/symbol/effect/blind_card.webp",
    pick_card: "../assets/symbol/effect/choose_card.webp",
    publicity: "../assets/symbol/effect/publicity.webp",
    data: "../assets/symbol/effect/data.webp",
    launch: "../assets/symbol/effect/launch.webp",
    income: "../assets/symbol/effect/income.webp",
    scan: "../assets/symbol/effect/normal_scan.webp",
    black_scan: "../assets/symbol/effect/black_scan.webp",
    red_scan: "../assets/symbol/effect/red_scan.webp",
    blue_scan: "../assets/symbol/effect/blue_scan.webp",
    yellow_scan: "../assets/symbol/effect/yellow_scan.webp",
    discard: "../assets/symbol/effect/discard.jpg",
    alien_any: "../assets/symbol/effect/alien_any.webp",
    alien_blue: "../assets/symbol/effect/alien_blue.webp",
    alien_pink: "../assets/symbol/effect/alien_pink.webp",
    alien_yellow: "../assets/symbol/effect/alien_yellow.webp",
    aomomoCard: "../assets/aliens/奥陌陌/cards/back.png",
  });

  const PLANET_NAMES = Object.freeze({
    venus: "金星",
    mercury: "水星",
    mars: "火星",
    jupiter: "木星",
    saturn: "土星",
    uranus: "天王星",
    neptune: "海王星",
    aomomo: "奥陌陌",
  });

  const NEBULA_CHOICES = Object.freeze({
    vega_or_pictor: Object.freeze(["sector-1-b", "sector-4-b"]),
    yellow: Object.freeze(["sector-4-a", "sector-3-a"]),
    red: Object.freeze(["sector-2-b", "sector-3-b"]),
    blue: Object.freeze(["sector-2-a", "sector-1-a"]),
  });

  const UNCLEAR_EFFECT_NOTES = Object.freeze([
    "收入按当前原型的收入效果处理：玩家弃 1 张手牌并按该牌收入角标增加收入。",
    "精选按当前原型的精选处理：玩家从公共牌区拿 1 张牌，且允许使用现有盲抽按钮。",
    "外星人标记按当前原型的槽位选择处理：黄色标记限制为 yellow，任意标记允许 yellow/pink/blue。",
    "外星人标记素材使用 alien_*.webp，代码 icon key 与文件名保持一致。",
  ]);

  function resourceEffect(label, gain, icon) {
    return {
      type: EFFECT_TYPES.GAIN_RESOURCES,
      label,
      icon: icon || (gain.score ? "score" : gain.energy ? "energy" : gain.publicity ? "publicity" : "credits"),
      options: { gain: { ...gain } },
    };
  }

  function scoreEffect(score, label) {
    return resourceEffect(label || `获得 ${score} 分`, { score }, "score");
  }

  function publicityEffect(publicity, label) {
    return resourceEffect(label || `获得 ${publicity} 宣传`, { publicity }, "publicity");
  }

  function energyEffect(energy, label) {
    return resourceEffect(label || `获得 ${energy} 能量`, { energy }, "energy");
  }

  function dataEffect(count, label) {
    return {
      type: EFFECT_TYPES.GAIN_DATA,
      label: label || `获得 ${count} 个数据`,
      icon: "data",
      options: { count },
    };
  }

  function launchEffect(options = {}) {
    return {
      type: EFFECT_TYPES.LAUNCH,
      label: options.label || "发射",
      icon: "launch",
      options: {
        skipCost: Boolean(options.skipCost),
        cost: options.cost || {},
        source: options.source || null,
      },
    };
  }

  function drawCardsEffect(count, label) {
    return {
      type: EFFECT_TYPES.DRAW_CARDS,
      label: label || `盲抽 ${count} 张卡牌`,
      icon: "blind_card",
      options: { count },
    };
  }

  function pickCardEffect(label) {
    return {
      type: EFFECT_TYPES.PICK_CARD,
      label: label || "精选 1 张卡牌",
      icon: "pick_card",
      needsUserChoice: true,
      options: { count: 1 },
    };
  }

  function incomeEffects(count, labelPrefix) {
    const total = Math.max(0, Math.round(count));
    return Array.from({ length: total }, (_, index) => ({
      type: EFFECT_TYPES.INCOME,
      label: total > 1 ? `${labelPrefix || "收入"} ${index + 1}/${total}` : (labelPrefix || "获得 1 次收入"),
      icon: "income",
      needsUserChoice: true,
      options: { count: 1 },
    }));
  }

  function scanPlanetSectorEffect(planetId, label) {
    const planetName = PLANET_NAMES[planetId] || planetId;
    return {
      type: EFFECT_TYPES.SCAN_PLANET_SECTOR,
      label: label || `${planetName}扇区扫描`,
      icon: "scan",
      badge: planetName,
      options: { planetId },
    };
  }

  function chooseNebulaScanEffect(label, nebulaIds, icon = "scan") {
    return {
      type: EFFECT_TYPES.CHOOSE_NEBULA_SCAN,
      label,
      icon,
      needsUserChoice: true,
      options: { nebulaIds: [...nebulaIds] },
    };
  }

  function coloredNebulaScanEffect(color, label) {
    return {
      type: EFFECT_TYPES.CHOOSE_COLORED_NEBULA_SCAN,
      label,
      icon: `${color}_scan`,
      needsUserChoice: true,
      options: { color, nebulaIds: [...(NEBULA_CHOICES[color] || [])] },
    };
  }

  function alienTraceEffects(count, traceType, labelPrefix) {
    const total = Math.max(0, Math.round(count));
    return Array.from({ length: total }, (_, index) => ({
      type: EFFECT_TYPES.ALIEN_TRACE,
      label: total > 1 ? `${labelPrefix} ${index + 1}/${total}` : labelPrefix,
      icon: traceType ? `alien_${traceType}` : "alien_any",
      needsUserChoice: true,
      options: { traceType: traceType || null },
    }));
  }

  function aomomoCardEffect(label) {
    return {
      type: EFFECT_TYPES.AOMOMO_CARD,
      label: label || "获得 1 张奥陌陌牌",
      icon: "aomomoCard",
      needsUserChoice: true,
      options: { count: 1 },
    };
  }

  function aomomoFossilScoreEffect(score, fossils, label) {
    return resourceEffect(label, { score, aomomoFossils: fossils }, "score");
  }

  const ORBIT_REWARDS = Object.freeze({
    aomomo: Object.freeze([
      aomomoFossilScoreEffect(10, 1, "奥陌陌环绕：10分+1化石"),
      scanPlanetSectorEffect(AOMOMO_PLANET_ID, "奥陌陌扇区扫描"),
    ]),
    venus: Object.freeze([
      scoreEffect(6, "获得 6 分"),
      ...incomeEffects(1, "获得 1 次收入"),
    ]),
    mercury: Object.freeze([
      drawCardsEffect(1, "盲抽 1 张卡牌"),
      scanPlanetSectorEffect("mercury", "水星扇区扫描 1/2"),
      scanPlanetSectorEffect("mercury", "水星扇区扫描 2/2"),
      ...incomeEffects(1, "获得 1 次收入"),
    ]),
    mars: Object.freeze([
      pickCardEffect("精选 1 张卡牌"),
      scanPlanetSectorEffect("mars", "火星扇区扫描"),
      ...incomeEffects(1, "获得 1 次收入"),
    ]),
    jupiter: Object.freeze([
      dataEffect(1, "获得 1 个数据"),
      scanPlanetSectorEffect("jupiter", "木星扇区扫描"),
      ...incomeEffects(1, "获得 1 次收入"),
    ]),
    saturn: Object.freeze([
      publicityEffect(2, "获得 2 宣传"),
      scanPlanetSectorEffect("saturn", "土星扇区扫描"),
      ...incomeEffects(1, "获得 1 次收入"),
    ]),
    uranus: Object.freeze([
      scoreEffect(8, "获得 8 分"),
      drawCardsEffect(3, "盲抽 3 张卡牌"),
      chooseNebulaScanEffect("织女一/绘架座β扫描", NEBULA_CHOICES.vega_or_pictor, "black_scan"),
    ]),
    neptune: Object.freeze([
      scoreEffect(7, "获得 7 分"),
      dataEffect(4, "获得 4 个数据"),
      chooseNebulaScanEffect("织女一/绘架座β扫描", NEBULA_CHOICES.vega_or_pictor, "black_scan"),
    ]),
  });

  const PLANET_LAND_REWARDS = Object.freeze({
    aomomo: Object.freeze({
      always: Object.freeze([aomomoFossilScoreEffect(9, 2, "奥陌陌登陆：9分+2化石")]),
      dataByLanding: Object.freeze({
        1: Object.freeze([dataEffect(3, "奥陌陌第1次登陆：额外获得 3 个数据")]),
        2: Object.freeze([dataEffect(2, "奥陌陌第2次登陆：额外获得 2 个数据")]),
        3: Object.freeze([dataEffect(1, "奥陌陌第3次登陆：额外获得 1 个数据")]),
      }),
    }),
    venus: Object.freeze({
      firstLanding: Object.freeze([dataEffect(2, "首次登陆：额外获得 2 个数据")]),
      always: Object.freeze([scoreEffect(5, "获得 5 分"), ...alienTraceEffects(1, "yellow", "获得 1 个黄色外星人标记")]),
    }),
    mercury: Object.freeze({
      firstLanding: Object.freeze([dataEffect(3, "首次登陆：额外获得 3 个数据")]),
      always: Object.freeze([scoreEffect(12, "获得 12 分"), ...alienTraceEffects(1, "yellow", "获得 1 个黄色外星人标记")]),
    }),
    mars: Object.freeze({
      firstLanding: Object.freeze([dataEffect(2, "首次登陆：额外获得 2 个数据")]),
      secondLanding: Object.freeze([dataEffect(1, "第二次登陆：额外获得 1 个数据")]),
      always: Object.freeze([scoreEffect(6, "获得 6 分"), ...alienTraceEffects(1, "yellow", "获得 1 个黄色外星人标记")]),
    }),
    jupiter: Object.freeze({
      firstLanding: Object.freeze([dataEffect(2, "首次登陆：额外获得 2 个数据")]),
      always: Object.freeze([scoreEffect(7, "获得 7 分"), ...alienTraceEffects(1, "yellow", "获得 1 个黄色外星人标记")]),
    }),
    saturn: Object.freeze({
      firstLanding: Object.freeze([dataEffect(2, "首次登陆：额外获得 2 个数据")]),
      always: Object.freeze([scoreEffect(8, "获得 8 分"), ...alienTraceEffects(1, "yellow", "获得 1 个黄色外星人标记")]),
    }),
    uranus: Object.freeze({
      firstLanding: Object.freeze([dataEffect(3, "首次登陆：额外获得 3 个数据")]),
      always: Object.freeze([scoreEffect(9, "获得 9 分"), ...alienTraceEffects(1, "yellow", "获得 1 个黄色外星人标记")]),
    }),
    neptune: Object.freeze({
      firstLanding: Object.freeze([dataEffect(3, "首次登陆：额外获得 3 个数据")]),
      always: Object.freeze([scoreEffect(10, "获得 10 分"), ...alienTraceEffects(1, "yellow", "获得 1 个黄色外星人标记")]),
    }),
  });

  const SATELLITE_LAND_REWARDS = Object.freeze({
    "phobos-deimos": Object.freeze([
      scoreEffect(8, "获得 8 分"),
      ...incomeEffects(2, "获得收入"),
    ]),
    io: Object.freeze([
      scoreEffect(10, "获得 10 分"),
      energyEffect(4, "获得 4 能量"),
    ]),
    europa: Object.freeze([
      scoreEffect(7, "获得 7 分"),
      ...alienTraceEffects(2, "yellow", "获得黄色外星人标记"),
    ]),
    ganymede: Object.freeze([
      scoreEffect(12, "获得 12 分"),
      publicityEffect(5, "获得 5 宣传"),
    ]),
    callisto: Object.freeze([
      scoreEffect(13, "获得 13 分"),
      dataEffect(4, "获得 4 个数据"),
    ]),
    enceladus: Object.freeze([
      scoreEffect(13, "获得 13 分"),
      coloredNebulaScanEffect("red", "红色星云扫描"),
      coloredNebulaScanEffect("blue", "蓝色星云扫描"),
      coloredNebulaScanEffect("yellow", "黄色星云扫描"),
    ]),
    titan: Object.freeze([
      scoreEffect(7, "获得 7 分"),
      ...alienTraceEffects(2, null, "获得任意外星人标记"),
    ]),
    triton: Object.freeze([
      scoreEffect(26, "获得 26 分"),
    ]),
    titania: Object.freeze([
      scoreEffect(25, "获得 25 分"),
    ]),
  });

  function cloneEffect(effect, index) {
    return {
      ...effect,
      id: effect.id || `planet-reward-${index}`,
      options: { ...(effect.options || {}) },
      status: "pending",
    };
  }

  function effectHasTarget(effect) {
    return Boolean(
      effect?.playerId
      || effect?.playerColor
      || effect?.options?.playerId
      || effect?.options?.playerColor
      || effect?.options?.targetPlayerId
      || effect?.options?.targetPlayerColor
    );
  }

  function getRewardTargetFromActionResult(result) {
    const event = (result?.events || []).find((item) => (
      item?.playerId || item?.playerColor
    ));
    return {
      playerId: result?.playerId || event?.playerId || null,
      playerColor: result?.playerColor || event?.playerColor || null,
    };
  }

  function assignRewardTarget(effects, result) {
    const target = getRewardTargetFromActionResult(result);
    if (!target.playerId && !target.playerColor) return effects;
    return effects.map((effect) => {
      if (effectHasTarget(effect)) return effect;
      return {
        ...effect,
        options: {
          ...(effect.options || {}),
          targetPlayerId: target.playerId,
          targetPlayerColor: target.playerColor,
        },
      };
    });
  }

  function buildOrbitRewardEffects(planetId, markerSequence) {
    const effects = [];
    if (planetId === AOMOMO_PLANET_ID) {
      if (Number(markerSequence) === 1) {
        effects.push(aomomoCardEffect("奥陌陌首次环绕：获得 1 张奥陌陌牌"));
      }
      effects.push(...(ORBIT_REWARDS[planetId] || []));
      return effects.map(cloneEffect);
    }
    if (Number(markerSequence) === 1) {
      effects.push(scoreEffect(3, "首次环绕：额外获得 3 分"));
    }
    effects.push(...(ORBIT_REWARDS[planetId] || []));
    return effects.map(cloneEffect);
  }

  function buildPlanetLandRewardEffects(planetId, markerSequence) {
    const config = PLANET_LAND_REWARDS[planetId];
    if (!config) return [];
    const sequence = Number(markerSequence);
    const effects = [];
    if (planetId === AOMOMO_PLANET_ID) {
      effects.push(...(config.always || []));
      effects.push(...(config.dataByLanding?.[sequence] || []));
      return effects.map(cloneEffect);
    }
    if (sequence === 1) effects.push(...(config.firstLanding || []));
    if (sequence === 2) effects.push(...(config.secondLanding || []));
    effects.push(...(config.always || []));
    return effects.map(cloneEffect);
  }

  function buildSatelliteLandRewardEffects(satelliteId) {
    return [...(SATELLITE_LAND_REWARDS[satelliteId] || [])].map(cloneEffect);
  }

  function buildLandRewardEffects(result) {
    if (result?.markerKind === "satellite") {
      return buildSatelliteLandRewardEffects(result.satelliteId);
    }
    return buildPlanetLandRewardEffects(
      result?.planetId,
      result?.rewardMarkerSequence ?? result?.markerSequence,
    );
  }

  function buildRewardEffectsForAction(actionId, result) {
    let effects = [];
    if (actionId === "orbit") {
      effects = buildOrbitRewardEffects(result?.planetId, result?.markerSequence);
    } else if (actionId === "land") {
      effects = buildLandRewardEffects(result);
    }
    return assignRewardTarget(effects, result);
  }

  function formatRewardEffectsSummary(effects, options = {}) {
    const separator = options.separator || "；";
    return (effects || [])
      .map((effect) => String(effect?.previewLabel || effect?.label || "").trim())
      .filter(Boolean)
      .join(separator);
  }

  return Object.freeze({
    EFFECT_TYPES,
    EFFECT_ICONS,
    PLANET_NAMES,
    NEBULA_CHOICES,
    UNCLEAR_EFFECT_NOTES,
    ORBIT_REWARDS,
    PLANET_LAND_REWARDS,
    SATELLITE_LAND_REWARDS,
    buildOrbitRewardEffects,
    buildPlanetLandRewardEffects,
    buildSatelliteLandRewardEffects,
    buildLandRewardEffects,
    buildRewardEffectsForAction,
    formatRewardEffectsSummary,
    dataEffect,
    launchEffect,
  });
});
