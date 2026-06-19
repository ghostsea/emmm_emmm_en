/* eslint-disable no-console */
"use strict";

const assert = require("node:assert/strict");
const placement = require("./placement");
const fangzhou = require("./fangzhou");
const queue = require("./fangzhou-card1-queue");

function nodeTypes(effect) {
  return queue.buildCard1EffectQueue(effect, "测试").map((node) => node.type);
}

function gainIcons(effect) {
  return queue.buildCard1EffectQueue(effect, "测试")
    .filter((node) => node.type === queue.PLANET_REWARD_TYPES.GAIN_RESOURCES)
    .map((node) => node.icon);
}

const expectations = Object.freeze({
  0: {
    basic: ["gain_resources", "gain_resources"],
    advanced: ["gain_resources", "alien_trace"],
  },
  1: {
    basic: ["gain_resources", "draw_cards"],
    advanced: ["draw_cards", "card_scan_action"],
  },
  2: {
    basic: ["gain_resources"],
    advanced: ["gain_resources", "alien_trace"],
  },
  3: {
    basic: ["gain_resources", "fangzhou_additional_public_scan"],
    advanced: [
      "card_scan_color_choice",
      "card_scan_color_choice",
      "card_scan_color_choice",
      "card_any_sector_scan",
    ],
  },
  4: {
    basic: ["gain_resources"],
    advanced: ["gain_data", "card_research_tech"],
  },
  5: {
    basic: ["gain_resources", "gain_resources"],
    advanced: ["gain_resources", "fangzhou_additional_public_scan"],
  },
  6: {
    basic: ["gain_resources", "gain_resources"],
    advanced: ["alien_trace", "fangzhou_launch"],
  },
  7: {
    basic: ["gain_resources", "draw_cards"],
    advanced: ["gain_resources", "gain_resources", "gain_resources", "gain_data", "pick_card"],
  },
  8: {
    basic: ["gain_resources", "gain_resources"],
    advanced: ["fangzhou_launch", "card_move"],
  },
});

for (const definition of fangzhou.CARD1_DEFINITIONS) {
  const expected = expectations[definition.index];
  assert.ok(expected, `缺少 card1 ${definition.index} 的队列期望`);

  const basicTypes = nodeTypes(definition.basic);
  assert.deepEqual(
    basicTypes,
    expected.basic,
    `card1 ${definition.index} 基础奖励队列不完整：${basicTypes.join(", ")}`,
  );

  const advancedTypes = nodeTypes(definition.advanced);
  assert.deepEqual(
    advancedTypes,
    expected.advanced,
    `card1 ${definition.index} 高级奖励队列不完整：${advancedTypes.join(", ")}`,
  );
}

assert.deepEqual(
  gainIcons(fangzhou.CARD1_BY_INDEX[6].basic),
  ["score", "credits"],
  "card1 6 基础奖励应分别显示分数与信用点",
);

assert.deepEqual(
  gainIcons(fangzhou.CARD1_BY_INDEX[0].basic),
  ["score", "energy"],
  "card1 0 基础奖励应分别显示分数与能量",
);

assert.deepEqual(
  gainIcons(fangzhou.CARD1_BY_INDEX[8].basic),
  ["score", "publicity"],
  "card1 8 基础奖励应分别显示分数与宣传",
);

const card3BasicScan = queue.buildCard1EffectQueue(fangzhou.CARD1_BY_INDEX[3].basic, "测试")
  .find((node) => node.type === queue.CUSTOM_TYPES.ADDITIONAL_PUBLIC_SCAN);
assert.equal(card3BasicScan?.icon, "additional_public_scan", "额外弃牌扫描应使用 token 图标");

const card3Advanced = queue.buildCard1EffectQueue(fangzhou.CARD1_BY_INDEX[3].advanced, "测试");
for (const node of card3Advanced) {
  if (node.type === queue.CARD_EFFECT_TYPES.SCAN_COLOR_CHOICE
    || node.type === queue.CARD_EFFECT_TYPES.ANY_SECTOR_SCAN) {
    assert.equal(node.options?.gainData, true, "card1 3 高级扇区扫描应获得数据");
  }
}

const card8Move = queue.buildCard1EffectQueue(fangzhou.CARD1_BY_INDEX[8].advanced, "测试")
  .find((node) => node.type === queue.CARD_EFFECT_TYPES.CARD_MOVE);
assert.equal(card8Move?.options?.movementPoints, 3);

console.log("fangzhou-card1-queue.test.js: all tests passed");
