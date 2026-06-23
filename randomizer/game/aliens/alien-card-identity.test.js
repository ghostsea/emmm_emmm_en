"use strict";

const assert = require("node:assert/strict");
const yichangdian = require("./yichangdian");
const banrenma = require("./banrenma");
const chong = require("./chong");
const amiba = require("./amiba");
const aomomo = require("./aomomo");
const runezu = require("./runezu");

const yichangdianCard = yichangdian.createAlienCard(5, 1);

for (const alienModule of [banrenma, chong, amiba, aomomo, runezu]) {
  assert.equal(
    alienModule.getCardDefinition(yichangdianCard),
    null,
    `${alienModule.ALIEN_ID} should not resolve an 异常点 card by alienCardId`,
  );
}

assert.equal(banrenma.isBanrenmaCard(yichangdianCard), false);
assert.equal(chong.isChongCard(yichangdianCard), false);
assert.equal(amiba.isAmibaCard(yichangdianCard), false);
assert.equal(aomomo.isAomomoCard(yichangdianCard), false);
assert.equal(runezu.isRunezuCard(yichangdianCard), false);

assert.equal(runezu.getCardDefinition(runezu.createAlienCard(5, 1)).index, 5);
assert.equal(chong.getCardDefinition(chong.createAlienCard(2, 1)).index, 2);

console.log("alien-card-identity.test.js: all tests passed");
