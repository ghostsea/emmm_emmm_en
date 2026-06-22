const assert = require("assert");

const evaluator = require("./evaluator");
const policy = require("./policy");

assert.equal(evaluator.getResourceValue({ credits: 1, energy: 1, publicity: 1 }), 7);
assert.equal(evaluator.getRemainingIncomeMultiplier(1), 4);
assert.equal(evaluator.getRemainingIncomeMultiplier(4), 1);

const offer = {
  industryOptions: [
    { id: "industry:a.png", label: "异星实验室" },
    { id: "industry:b.png", label: "赫利昂联合体" },
  ],
  initialOptions: [
    { id: "initial:1", label: "初始牌 1" },
    { id: "initial:16", label: "初始牌 16" },
    { id: "initial:21", label: "初始牌 21" },
  ],
};
const decision = policy.chooseInitialSelection(offer, { roundNumber: 1 });
assert.ok(decision.industry);
assert.equal(decision.initialCards.length, 2);

assert.equal(policy.chooseTurnAction([
  { id: "pass", available: true },
  { id: "launch", available: true },
])?.id, "launch");
assert.equal(policy.chooseTurnAction([
  { id: "pass", available: true },
  { id: "researchTech", available: true, takeable: [{ tileId: "purple1" }] },
])?.id, "researchTech");
assert.equal(policy.chooseTurnAction([
  { id: "end-turn", available: true },
])?.id, "end-turn");
assert.equal(policy.chooseTurnAction([
  { id: "end-turn", available: true },
  { id: "move", available: true, score: 2 },
])?.id, "move");
assert.equal(policy.chooseTurnAction([
  { id: "move", available: true, score: 5 },
  { id: "orbit", available: true },
])?.id, "orbit");
assert.equal(policy.chooseTurnAction([
  { id: "pass", available: true },
  { id: "scan", available: true },
])?.id, "scan");
assert.equal(policy.chooseTurnAction([
  { id: "scan", available: true },
  { id: "playCard", available: true, playableCards: [{ price: 2, score: 4 }] },
])?.id, "playCard");
assert.equal(policy.chooseResearchTechTile([
  { tileId: "blue4", techType: "blue", bonusId: "bonus_1m", firstTake: false },
  { tileId: "orange1", techType: "orange", bonusId: "bonus_3f", firstTake: true },
])?.tileId, "orange1");
assert.equal(policy.choosePlayCard([
  { cardId: "low.webp", price: 1, score: 1 },
  { cardId: "better.webp", price: 4, score: 5 },
])?.cardId, "better.webp");
assert.equal(policy.chooseBlueTechSlot([3, 1, 2]), 1);
assert.equal(policy.chooseBlueTechSlot([2, 0]), 0);
assert.deepEqual(policy.chooseMovePaymentIndexes([
  { label: "普通牌" },
  { label: "移动牌 A" },
  { label: "移动牌 B" },
], {
  requiredMovePoints: 2,
  availableEnergy: 1,
  moveCardIndexes: [2, 1],
}), [1]);
assert.deepEqual(policy.chooseDiscardIndexes([{ label: "b" }, { label: "a" }], 1), [1]);

console.log("ai.test.js: all tests passed");
