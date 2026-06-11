const assert = require("node:assert/strict");
const basicCards = require("./basic-cards");

const picked = basicCards.pickRandomBasicCards(10, () => 0);
assert.equal(picked.length, 10);
assert.equal(picked[0].src, "../assets/cards/basic/split/b_1.webp");
assert.equal(picked[0].faceUp, true);

const unique = new Set(basicCards.pickRandomBasicCards(10, () => 0.5).map((card) => card.cardIndex));
assert.equal(unique.size, 10);

const drawn = basicCards.pickRandomBasicCard([1, 2, 3], () => 0);
assert.equal(drawn.cardIndex, 4);

console.log("basic card tests passed");
