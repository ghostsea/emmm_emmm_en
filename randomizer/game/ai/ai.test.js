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
assert.deepEqual(policy.chooseDiscardIndexes([{ label: "b" }, { label: "a" }], 1), [1]);

console.log("ai.test.js: all tests passed");
