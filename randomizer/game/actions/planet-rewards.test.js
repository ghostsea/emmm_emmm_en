"use strict";

const assert = require("node:assert/strict");
const rewards = require("./planet-rewards");

{
  const effects = rewards.buildOrbitRewardEffects("mercury", 1);
  assert.equal(effects.length, 5);
  assert.equal(effects[0].label, "首次环绕：额外获得 3 分");
  assert.equal(effects[1].type, rewards.EFFECT_TYPES.DRAW_CARDS);
  assert.equal(effects[1].icon, "blind_card");
  assert.equal(effects[2].type, rewards.EFFECT_TYPES.SCAN_PLANET_SECTOR);
  assert.equal(effects[2].options.planetId, "mercury");
  assert.equal(effects[3].options.planetId, "mercury");
  assert.equal(effects[4].type, rewards.EFFECT_TYPES.INCOME);
}

{
  const effects = rewards.buildOrbitRewardEffects("saturn", 2);
  assert.equal(effects.length, 3);
  assert.equal(effects[0].options.gain.publicity, 2);
  assert.equal(effects[1].options.planetId, "saturn");
  assert.equal(effects[1].icon, "scan");
  assert.equal(effects[1].badge, "土星");
  assert.equal(effects[2].type, rewards.EFFECT_TYPES.INCOME);
}

{
  const firstMars = rewards.buildPlanetLandRewardEffects("mars", 1);
  assert.equal(firstMars[0].options.count, 2);
  assert.equal(firstMars[1].options.gain.score, 6);
  assert.equal(firstMars[2].options.traceType, "yellow");
  assert.equal(
    rewards.formatRewardEffectsSummary(firstMars),
    "首次登陆：额外获得 2 个数据；获得 6 分；获得 1 个黄色外星人标记",
  );

  const secondMars = rewards.buildPlanetLandRewardEffects("mars", 2);
  assert.equal(secondMars[0].options.count, 1);
  assert.equal(secondMars[1].options.gain.score, 6);
  assert.equal(secondMars[2].options.traceType, "yellow");
}

{
  const enceladus = rewards.buildSatelliteLandRewardEffects("enceladus");
  assert.equal(enceladus.length, 4);
  assert.equal(enceladus[0].options.gain.score, 13);
  assert.deepEqual(enceladus.slice(1).map((effect) => effect.options.color), ["red", "blue", "yellow"]);
  assert.deepEqual(enceladus.slice(1).map((effect) => effect.icon), ["red_scan", "blue_scan", "yellow_scan"]);
}

{
  const titan = rewards.buildSatelliteLandRewardEffects("titan");
  assert.equal(titan.length, 3);
  assert.equal(titan[0].options.gain.score, 7);
  assert.equal(titan[1].icon, "alien_any");
  assert.equal(titan[1].options.traceType, null);
  assert.equal(titan[2].options.traceType, null);
}

{
  const titan = rewards.buildRewardEffectsForAction("land", {
    markerKind: "satellite",
    satelliteId: "titan",
    events: [{ type: "land", playerId: "player-blue", playerColor: "blue" }],
  });
  assert.equal(titan.length, 3);
  assert.equal(titan[1].type, rewards.EFFECT_TYPES.ALIEN_TRACE);
  assert.equal(titan[1].options.targetPlayerId, "player-blue");
  assert.equal(titan[1].options.targetPlayerColor, "blue");
  assert.equal(titan[2].options.targetPlayerId, "player-blue");
}

{
  const uranus = rewards.buildOrbitRewardEffects("uranus", 2);
  assert.equal(uranus[2].icon, "black_scan");
}

{
  assert.equal(rewards.formatRewardEffectsSummary([]), "");
}

console.log("planet-rewards.test.js: all tests passed");
