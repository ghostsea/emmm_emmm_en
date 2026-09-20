"use strict";
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const cardEffects = require("../game/cards/effects");
const source = fs.readFileSync(path.join(__dirname, "ai-controller.js"), "utf8");
const start = source.indexOf("    function scoreAiLiveTriggerCashout(");
const end = source.indexOf("    function scoreAiPlayCardValue(", start);
assert(start >= 0 && end > start);
const box = {
  cardEffects, aiNumber: n => Number(n) || 0,
  AI_RESOURCE_VALUES: { handSize: 5.4 },
  scoreAiResourceBundle: gain => (gain.credits || 0) * 6 + (gain.energy || 0) * 6.2 + (gain.score || 0),
};
vm.createContext(box);
vm.runInContext(source.slice(start, end), box);
const card = (cardId, consumed = []) => ({ id: cardId, cardId, cardEffectState: { modelCardId: cardId, consumedTriggerIds: consumed } });
const score = (event, reservedCards) => box.scoreAiLiveTriggerCashout(event, { resources: {}, reservedCards });
const station = card("b_57.webp");
const before = JSON.stringify(station);
assert.equal(score({ type: "launch" }, [station]), 6, "one slot, not all three launch slots");
assert.equal(JSON.stringify(station), before, "valuation must not initialize or consume live card state");
assert.equal(score({ type: "launch" }, [card("b_57.webp", ["b57-launch-credit"])]), 3);
assert.equal(score({ type: "launch" }, [card("b_57.webp", ["b57-launch-credit", "b57-launch-pick"])]), 5);
assert.equal(score({ type: "launch", sourceCardInstanceId: station.id }, [station]), 0);
assert.equal(score({ type: "launch" }, []), 0);
const nasa = card("b_80.webp");
assert.equal(score({ type: "researchTech", techType: "orange" }, [nasa]), 6.2);
assert.equal(score({ type: "researchTech", techType: "blue" }, [nasa]), 3);
assert.equal(score({ type: "researchTech", techType: "purple" }, [nasa]), 0, "capped publicity requires post-action state");
assert.equal(score({ type: "researchTech", techType: "orange" }, [card("b_80.webp", ["b80-orange-tech-energy"])]), 0);
assert.equal(score({ type: "playCard", price: 1, timing: "after_play_card", cardId: "b_1.webp", sourceCardInstanceId: "other" }, [card("b_120.webp")]), 2);
assert.equal(score({ type: "playCard", price: 1, cardId: "b_1.webp" }, [card("b_120.webp")]), 0, "event timing must match");
assert.equal(score({ type: "playCard", price: 2, timing: "after_play_card", cardId: "b_1.webp" }, [card("b_120.webp")]), 3);
assert.equal(score({ type: "scanAction" }, [card("b_111.webp")]), 0, "do not skip first data slot to a later reward");
assert.equal(score({ type: "scanAction" }, [card("b_111.webp", ["b111-scan-data"])]), 5.4);
assert.equal(score({ type: "scanAction" }, [card("b_111.webp", ["b111-scan-data", "b111-scan-draw"])]), 4);
assert.equal(score({ type: "launch" }, [card("b_20.webp"), station]), 0, "do not assume earlier movement slot is skipped");
const fresh = { id: "fresh", cardId: "b_57.webp" };
assert.equal(score({ type: "launch" }, [fresh]), 6);
assert(!Object.hasOwn(fresh, "cardEffectState"));
console.log("AI live trigger cashout tests passed");
