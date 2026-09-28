const assert = require("node:assert/strict");
const flow = require("./resource-flow");

for (const color of ["粉色", "黄色", "蓝色"]) {
  for (const [position, cost, score] of [[1, 1, 6], [2, 3, 15]]) {
    for (const prefix of ["", "比邻星赢家奖励：白色放置粉色外星人痕迹："]) {
      const initial = { id: "p1", color: "white", resources: { availableData: cost, score: 0 }, hand: [] };
      const text = `${prefix}半人马${color}痕迹 ${position}号位：支付 ${cost} 数据、分数+${score}`;
      const r = flow.analyzeStructuredActionLog([{ id: 1, playerId: "p1", actionType: "scan", steps: [{ source: "main", text }],
        accountingSnapshot: { players: [{ ...initial, resources: { availableData: 0, score } }] } }], { initialPlayerStates: [initial] });
      assert.equal(r.events[0].resourceDeltas.availableData, -cost, text);
      assert.equal(r.events[0].resourceDeltas.score, score);
      assert.equal(r.events.filter(e => e.syntheticSnapshotInference).length, 0);
      assert.equal(r.players[0].grossGain.availableData, 0);
      assert.equal(r.players[0].spent.availableData, cost);
    }
  }
}
for (const text of ["半人马粉色痕迹 2号位：数据不足：需要 3 数据", "半人马粉色痕迹 2号位：取消", "半人马粉色痕迹 2号位：请支付 3 数据"]) {
  const [e] = flow.normalizeStructuredActionLog([{ id: 1, playerId: "p1", steps: [{ source: "main", text }] }]);
  assert.equal(e.resourceDeltas.availableData || 0, 0, "unsuccessful/pending trace is not paid");
}

for (const [label, key, tile] of [["能量", "energy", "blue2"], ["信用点", "credits", "blue1"], ["宣传", "publicity", "blue4"], ["分", "score", "blue4"]]) {
  const initial = { id: "p1", resources: { availableData: 6, [key]: 0 }, hand: [] };
  const placement = `放置数据：序号 15 自数据池槽位1 → 第三列第二行 (63.88%,81.29%)，额外获得 1 ${label}；获得 1 ${label}`;
  const result = flow.analyzeStructuredActionLog([{ id: 1, playerId: "p1", roundNumber: 4, actionType: "playCard",
    steps: [{ source: "main", text: `选择科技：${tile}` },
      { source: "quick", text: `拥有3个蓝色外星人标记：1数据：绿色获得 1/1 个数据；${placement}` }],
    accountingSnapshot: { players: [{ ...initial, resources: { availableData: 6, [key]: 1 } }] },
  }], { initialPlayerStates: [initial] });
  const gain = result.events.find(e => e.sourceDetail.includes("获得 1/1 个数据"));
  const placed = result.events.find(e => e.isDataPlacement);
  assert.equal(gain.resourceDeltas.availableData, 1);
  assert.equal(placed.resourceDeltas.availableData, -1);
  assert.equal(placed.resourceDeltas[key], 1, "description and actual placement reward are one grant");
  assert.equal(result.events.filter(e => e.syntheticSnapshotInference).length, 0);
  assert.equal(result.reconciliation.residualMagnitude, 0);
  if (tile === "blue1") assert.equal(result.players[0].blue1CreditGain, 1);
  if (tile === "blue2") assert.equal(result.players[0].blue2EnergyGain, 1);
}

{
  const initial = { id: "p1", resources: { energy: 0 }, hand: [] };
  const r = flow.analyzeStructuredActionLog([{ id: 1, playerId: "p1", actionType: "playCard",
    steps: [{ source: "main", text: "获得 1 能量；获得 1 能量" }],
    accountingSnapshot: { players: [{ ...initial, resources: { energy: 2 } }] },
  }], { initialPlayerStates: [initial] });
  assert.equal(r.events[0].resourceDeltas.energy, 2, "independent repeated grants must not collapse");
}

for (const [received, requested] of [[0, 1], [1, 1], [2, 3]]) {
  const initial = {id:"p1", resources:{availableData:0}, hand:[]};
  const r = flow.analyzeStructuredActionLog([{id:1,playerId:"p1",actionType:"playCard",steps:[
    {source:"main",text:`获得 ${requested} 数据：白色获得 ${received}/${requested} 个数据`},
  ],accountingSnapshot:{players:[{...initial,resources:{availableData:received}}]}}],{initialPlayerStates:[initial]});
  assert.equal(r.events.find(e=>e.stepIndex===0).resourceDeltas.availableData||0,received,"actual data count precedes capacity denominator");
  assert.equal(r.events.filter(e=>e.syntheticSnapshotInference).length,0);
}

{
  const actor = { id: "actor", color: "white", resources: {}, hand: [] };
  const recipient = { id: "recipient", color: "blue", resources: { availableData: 6, energy: 0 }, hand: [] };
  const r = flow.analyzeStructuredActionLog([{ id: 1, playerId: actor.id, actionType: "analyze", steps: [
    { source: "main", text: "奖励：蓝色获得 2/2 个数据；放置数据：序号 1 自数据池槽位1 → 第一列第二行 (1%,1%)，额外获得 1 能量；获得 1 能量；放置数据：序号 2 自数据池槽位2 → 第一排放置位3 (1%,1%)" },
  ], accountingSnapshot: { players: [actor, { ...recipient, resources: { availableData: 6, energy: 1 } }] } }],
  { initialPlayerStates: [actor, recipient] });
  const direct = r.events.filter(e => !e.syntheticSnapshotInference);
  assert.equal(direct.length, 3);
  assert(direct.every(e => e.playerId === recipient.id), "nested placements keep the named recipient");
  assert.equal(direct.filter(e => e.isDataPlacement).length, 2);
  assert.equal(direct.reduce((n, e) => n + (e.resourceDeltas.availableData || 0), 0), 0);
  assert.equal(r.events.filter(e => e.syntheticSnapshotInference).length, 0);
}

{
  const picked = { id: "picked-data", cardName: "近地小行星研究" };
  for (const text of [
    "精选1张牌并获得其左上角奖励：精选 近地小行星研究；数据+1",
    "精选奖励：获得卡牌：近地小行星研究，公共区已补牌：其它牌；数据+1",
    "快速交易：快速交易精选：近地小行星研究，公共区已补牌：其它牌；数据+1",
    "PASS 预留精选：PASS 精选：近地小行星研究；数据+1",
  ]) {
    const initial = { id: "p1", resources: { handSize: 0, availableData: 0, score: 0 }, hand: [] };
    const result = flow.analyzeStructuredActionLog([{ id: 1, playerId: "p1", roundNumber: 2, actionType: "playCard",
      steps: [{ source: "main", text }, { source: "quick", text: "放置数据：资源：数据-1、分数+2" }],
      accountingSnapshot: { players: [{ ...initial, resources: { handSize: 1, availableData: 0, score: 2 }, hand: [picked] }] },
    }], { initialPlayerStates: [initial] });
    const pickup = result.events.find(e => e.sourceDetail === text);
    const placement = result.events.find(e => e.sourceDetail.startsWith("放置数据"));
    assert.equal(pickup.cards.find(c => c.change === "gain").key, picked.id, "named pickup owns the actual new card");
    assert.equal(pickup.resourceDeltas.handSize, 1, "pickup hand gain must not migrate to later data placement");
    assert.equal(placement.resourceDeltas.handSize || 0, 0);
    assert.equal(result.reconciliation.residualMagnitude, 0);
  }
  const event = (stepIndex, text, gain = 0, cards = []) => ({ gameId: "g", entryId: 1, playerId: "p1", stepIndex,
    sourceDetail: text, sourceCategory: flow.classifySourceCategory({text}), resourceDeltas: gain ? { handSize: gain } : {}, cards });
  const gainCard = { key: "unique", label: "同名牌", change: "gain" };
  const ambiguous = [event(0, "获得卡牌：同名牌"), event(1, "获得卡牌：同名牌"), event(2, "放置数据", 1, [gainCard])];
  assert.deepEqual(flow.reattributeNamedCardPickups(ambiguous), [], "two named targets are ambiguous");
  const paid = [event(0, "获得卡牌：同名牌"), event(1, "打出", -1, [gainCard])];
  assert.deepEqual(flow.reattributeNamedCardPickups(paid), [], "cannot relocate a negative hand payment");
  const explicit = [event(0, "获得卡牌：同名牌"), event(1, "PASS 收入：手牌+1", 1, [gainCard])];
  assert.deepEqual(flow.reattributeNamedCardPickups(explicit), [], "cannot steal an explicitly stated hand reward");
  const netted = [event(0, "获得卡牌：同名牌"), event(1, "放置数据：资源：手牌-1", 0, [gainCard])];
  assert.equal(flow.reattributeNamedCardPickups(netted).length, 1, "separate observed pickup from explicit later payment");
  assert.equal(netted[0].resourceDeltas.handSize, 1);assert.equal(netted[1].resourceDeltas.handSize, -1);
  const two = [event(0, "获得卡牌：甲"), event(1, "获得卡牌：乙"), event(2, "放置数据", 2,
    [{key:"a",label:"甲",change:"gain"},{key:"b",label:"乙",change:"gain"}])];
  assert.equal(flow.reattributeNamedCardPickups(two).length, 2, "separate uniquely named pickups share a later snapshot");
  assert.equal(two[0].resourceDeltas.handSize, 1);assert.equal(two[1].resourceDeltas.handSize, 1);
  assert.equal(two[2].resourceDeltas.handSize || 0, 0);
}

{
  for (const [label, payout, expected] of [
    ["当前每个能量收入：1能量", "能量+7", { energy: 7 }],
    ["当前每个信用收入：3分", "分数+21", { score: 21 }],
    ["每个非默认盲抽收入：1宣传", "宣传+7", { publicity: 7 }],
  ]) {
    const text = `${label}：高于公司默认 7 个，${payout}`;
    const parsed = flow.parseDeltaText(text);
    assert.deepEqual(parsed.resourceDeltas, expected);
    assert.deepEqual(parsed.incomeDeltas, {}, "counting income is not increasing it");
    assert.equal(flow.classifySourceCategory({ text }), "card");
  }
  assert.deepEqual(flow.parseDeltaText("当前每个能量收入：1能量：高于公司默认 0 个，无奖励").incomeDeltas, {});
  assert.deepEqual(flow.parseDeltaText("将本卡放入收入区：能量+1").incomeDeltas, { energy: 1 });
  const initial = { id: "p", resources: { energy: 0 }, income: { energy: 8 }, hand: [] };
  const result = flow.analyzeStructuredActionLog([{ id: 1, roundNumber: 4, playerId: "p", actionType: "playCard",
    steps: [
      { source: "main", text: "当前每个能量收入：1能量：高于公司默认 7 个，能量+7" },
      { source: "main", text: "将本卡放入收入区：能量+1" },
    ], accountingSnapshot: { players: [{ ...initial, resources: { energy: 8 }, income: { energy: 9 } }] },
  }], { initialPlayerStates: [initial] });
  assert.equal(result.players[0].nonIncomeGain.energy, 7);
  assert.equal(result.players[0].incomeGain.energy, 1);
  assert.equal(result.events[0].sourceCategory, "card");
  assert.equal(result.events[1].sourceCategory, "income_upgrade_immediate");
  assert.equal(result.events.filter(e => e.syntheticSnapshotInference).length, 0);
  assert.equal(result.reconciliation.residualMagnitude, 0);
}

{
  for (const [detail, expected, start] of [
    ["宣传+1；宣传+1；宣传+1；资源：宣传+3、手牌-1", { publicity: 3, handSize: -1 }, { publicity: 1, handSize: 1 }],
    ["宣传+1；宣传+1；宣传+1；资源：宣传+1、手牌-1", { publicity: 1, handSize: -1 }, { publicity: 9, handSize: 1 }],
    ["分数+1；分数+1；分数+1；资源：分数+3、数据+2、手牌-1", { score: 3, availableData: 2, handSize: -1 }, { score: 0, availableData: 4, handSize: 1 }],
  ]) {
    const text = `弃非外星人卡并结算其左上角奖励3次：弃掉 角标牌；${detail}`;
    assert.deepEqual(flow.parseDeltaText(text).resourceDeltas, expected);
    const initial = { id: "p", resources: start, hand: [{ id: "corner", label: "角标牌" }] };
    const final = { ...initial, hand: [], resources: { ...start } };
    for (const [key, value] of Object.entries(expected)) final.resources[key] += value;
    const result = flow.analyzeStructuredActionLog([{ id: 1, roundNumber: 3, playerId: "p", actionType: "playCard",
      steps: [{ source: "main", text }], accountingSnapshot: { players: [final] },
    }], { initialPlayerStates: [initial] });
    assert.deepEqual(result.events[0].resourceDeltas, expected);
    assert.equal(result.events.filter(e => e.syntheticSnapshotInference).length, 0,
      "explicit repeated reward must not be repaired by synthetic snapshot gains");
    assert.equal(result.reconciliation.residualMagnitude, 0);
  }
}

{
  const text = "弃牌换1移动 x3：R1 -> 扇区[5,3]#4，橙色2：进入小行星，宣传+1；资源：宣传+3";
  assert.deepEqual(flow.parseDeltaText(text).resourceDeltas, { publicity: 3 });
  assert.equal(flow.parseDeltaText(text).matchedMagnitude, 3);
  assert.deepEqual(flow.parseDeltaText("1移动：R2 -> 扇区[2,1]#0，宣传+1、分数+2；资源：宣传+3、能量-1；收入：能量+1").resourceDeltas,
    { publicity: 3, energy: -1, score: 2 }, "only explicit impact keys override component descriptions");
  assert.equal(flow.parseDeltaText("1移动：R1 -> 扇区[5,3]#4，宣传+1；宣传+3").resourceDeltas.publicity, 4,
    "independent gains without an impact summary remain additive");
  const initial = { id: "p", color: "white", resources: { publicity: 0 }, hand: [] };
  const result = flow.analyzeStructuredActionLog([{ id: 1, roundNumber: 4, playerId: "p", actionType: "playCard",
    steps: [{ source: "main", text }], accountingSnapshot: { players: [{ ...initial, resources: { publicity: 3 } }] },
  }], { initialPlayerStates: [initial] });
  assert.equal(result.events[0].resourceDeltas.publicity, 3);
  assert.equal(result.players[0].nonIncomeGain.publicity, 3);
  assert.equal(result.players[0].spent.publicity, 0, "snapshot reconciliation must not invent spending to cancel a duplicated gain");
  assert.equal(result.reconciliation.residualMagnitude, 0);
}

{
  for (const drawn of [0, 1, 2]) {
    const before = [
      { id: "blue", color: "blue", resources: {}, hand: [] },
      { id: "brown", color: "brown", resources: {}, hand: [] },
    ];
    const after = before.map(p => ({ ...p,
      resources: p.id === "brown" ? { credits: 1 } : {},
      hand: Array.from({ length: p.id === "blue" ? 1 : drawn }, (_, i) => ({ id: p.id + i })),
    }));
    const result = flow.analyzeStructuredActionLog([{
      id: 23, playerId: "brown", actionType: "playCard",
      steps: [
        { source: "main", text: "宇宙战略集团：黄色奖励槽：+1 信用点" },
        { source: "main", text: `回合结束揭示外星人：异常点已展示：异常扇区 4、1、7；异常点揭示发牌：蓝色+1，棕色+${drawn}/2` },
      ], accountingSnapshot: { players: after },
    }], { initialPlayerStates: before });
    const grant = result.events.find(e => e.stepIndex === 1 && e.playerId === "brown");
    assert(grant, "each explicit reveal recipient must have its own event");
    assert.equal(grant.resourceDeltas.handSize || 0, drawn, "count actual draws, not expected entitlement");
    assert.equal(grant.cards.length, drawn);
    assert(grant.cards.every(c => c.origin === "alien"));
    assert.deepEqual(result.events[0].resourceDeltas, { credits: 1 }, "company reward did not grant alien cards");
    assert.equal(result.reconciliation.residualMagnitude, 0);
  }
}

{
  // Actual b36 receipt: brown earns first-trace 3VP/1 publicity plus 1VP
  // for the new blue trace. The trailing impact reports total score 4.
  for (const color of ["蓝色", "黄色", "粉色"]) {
    const text = `获得任意外星人痕迹，并按该颜色痕迹数得分：外星人 2 放置${color}痕迹，三种首标记已满，可揭示；外星人 2首痕迹奖励：3分+1宣传；${color}痕迹痕迹 1 个：分数+1；资源：分数+4`;
    assert.deepEqual(flow.parseDeltaText(text).resourceDeltas, { publicity: 1, score: 4 });
    const before = [
      { id: "blue", color: "blue", resources: { score: 20, publicity: 5 }, hand: [] },
      { id: "brown", color: "brown", resources: { score: 20, publicity: 5 }, hand: [] },
    ];
    const after = before.map(p => p.id === "brown" ? { ...p, resources: { score: 24, publicity: 6 } } : p);
    const result = flow.analyzeStructuredActionLog([{
      id: 23, roundNumber: 1, turnNumber: 5, playerId: "brown", actionType: "playCard",
      steps: [{ source: "main", text }], accountingSnapshot: { players: after },
    }], { initialPlayerStates: before });
    assert.equal(result.events[0].playerId, "brown", "trace color is not reward recipient");
    assert.deepEqual(result.events[0].resourceDeltas, { publicity: 1, score: 4 });
    assert.equal(result.events.length, 1, "no compensating snapshot inference should hide double counting");
    assert.equal(result.reconciliation.residualMagnitude, 0);
  }
  assert.deepEqual(flow.parseDeltaText("蓝色痕迹痕迹 1 个：分数+1；独立奖励：分数+4").resourceDeltas,
    { score: 5 }, "without an impact summary, independent rewards stay additive");
}

{
  const events = [
    { gameId: "incomplete", playerId: "p", sourceCategory: "setup", resourceDeltas: { credits: 2, energy: 3 } },
    { gameId: "incomplete", playerId: "p", sourceCategory: "cost", resourceDeltas: { credits: -3, energy: -2 } },
  ];
  const row = flow.summarizeResourceEvents(events).players[0];
  assert.deepEqual(row.unexplainedResourceDeficits, { credits: 1 });
  assert.equal(row.balanceResiduals, null, "no ending observation is available");
  assert.equal(row.endingInventory.credits, null, "missing resource evidence is not an empty inventory");
  assert.equal(row.utilizationRate.credits, null, "do not report 150% utilization from incomplete history");
  assert.equal(row.endingInventory.energy, 1);
  assert.equal(row.utilizationRate.energy, 2 / 3, "unaffected resources retain their estimate");
  const observed = flow.summarizeResourceEvents(events, { endingInventories: { p: { credits: 0, energy: 1 } } }).players[0];
  assert.equal(observed.endingInventory.credits, 0, "retain explicitly observed ending");
  assert.equal(observed.balanceResiduals.credits, -1);
  assert.equal(observed.utilizationRate.credits, null);
  assert.deepEqual(observed.unexplainedResourceDeficits, {}, "observed mismatch is already represented by balanceResiduals");
}

{
  for (const count of [0, 1, 2, 3]) {
    const text = `每个外星人：2分+1能量：${count} 个外星人，分数+${count * 2}、能量+${count}`;
    assert.deepEqual(flow.parseDeltaText(text).resourceDeltas, count ? { score: count * 2, energy: count } : {});
    const initial = { id: "p", color: "white", resources: { score: 10, energy: 2 }, hand: [], income: {} };
    const result = flow.analyzeStructuredActionLog([{
      id: 1, roundNumber: 2, playerId: "p", actionType: "cardTask",
      steps: [{ source: "quick", text }],
      accountingSnapshot: { players: [{ ...initial, resources: { score: 10 + count * 2, energy: 2 + count } }] },
    }], { initialPlayerStates: [initial] });
    assert.equal(result.players[0].nonIncomeGain.energy, count);
    assert.equal(result.players[0].spent.energy, 0, "formula text must not create compensating inferred consumption");
    assert.equal(result.reconciliation.inferredMagnitude, 0);
    assert.equal(result.reconciliation.residualMagnitude, 0);
  }
  assert.deepEqual(flow.parseDeltaText("奖励：+1能量；额外奖励：能量+2").resourceDeltas, { energy: 3 }, "separate actual gains remain additive");
}

{
  const initial = { id: "p", resources: { credits: 2, energy: 1 }, hand: [], income: {} };
  const result = flow.analyzeStructuredActionLog([{
    id: 1, roundNumber: 4, playerId: "p", actionType: "land",
    steps: [
      { source: "quick", text: "快速交易：2信用点 → 1能量" },
      { source: "main", text: "登陆 奥陌陌，消耗 2能量（橙色3，消耗-1），移除火箭，显示登陆标记#1" },
    ],
    accountingSnapshot: { players: [{ ...initial, resources: { credits: 0, energy: 0 } }] },
  }], { initialPlayerStates: [initial] });
  assert.equal(result.players[0].nonIncomeGain.energy, 1);
  assert.equal(result.players[0].spent.energy, 2, "gross landing cost must not net the preceding trade gain");
  assert.equal(result.players[0].spent.credits, 2);
  assert.equal(result.reconciliation.residualMagnitude, 0);
  assert.equal(result.reconciliation.inferredMagnitude, 0);
  assert.equal(result.events[1].sourceCategory, "alien", "retain actual source attribution");

  const event = (text) => flow.normalizeStructuredActionLog([{ id: 1, playerId: "p", steps: [{ text }] }], {
    initialPlayerStates: [initial],
  })[0];
  assert.deepEqual(event("快速交易：2能量 → 1信用点；资源：能量-2、信用点+1").resourceDeltas, { energy: -2, credits: 1 });
  assert.deepEqual(event("登陆 奥陌陌，消耗 2能量；资源：能量-2").resourceDeltas, { energy: -2 });
  for (const text of ["快速交易：2信用点 → 1能量；请选择", "快速交易：2信用点 → 1能量；失败", "可登陆 奥陌陌，消耗 2能量", "取消登陆 奥陌陌，消耗 2能量"]) {
    assert.deepEqual(event(text).resourceDeltas, {}, text);
  }
}

for (const text of ["获得卡牌：水熊虫研究", "获得卡牌：宇航员训练体验，公共区已补牌：水熊虫研究"]) {
  assert.equal(flow.findAlienIdInLogText(text), null);
  assert.equal(flow.classifySourceCategory({ text }), "card");
}
assert.equal(flow.findAlienIdInLogText("虫族奖励：获得虫3"), "虫");
assert.equal(flow.findAlienIdInLogText("半人马奖励：获得卡牌，公共区已补牌：水熊虫研究"), "半人马");

{
  const solarPanelText = "每个己方太阳系探测器或虫族搬运化石：1能量：2 个探测器，获得 2；资源：能量+2";
  assert.equal(flow.findAlienIdInLogText(solarPanelText), null,
    "an eligible token kind in an ordinary card rule must not invent a revealed alien");
  assert.equal(flow.classifySourceCategory({ text: solarPanelText }), "card");
  assert.equal(flow.findAlienIdInLogText(`虫族奖励；${solarPanelText}`), "虫",
    "keep an independent actual alien source in the same text");
  assert.equal(flow.classifySourceCategory({ text: `虫族奖励；${solarPanelText}` }), "alien");
}

{
  const summarize = (score) => flow.summarizeResourceEvents([
    { gameId: "score-separation", playerId: "p", roundNumber: 1,
      sourceCategory: "setup", resourceDeltas: { credits: 2, score } },
    { gameId: "score-separation", playerId: "p", roundNumber: 1,
      sourceCategory: "card", resourceDeltas: { energy: 2, score } },
    { gameId: "score-separation", playerId: "p", roundNumber: 1,
      sourceCategory: "cost", resourceDeltas: { energy: -1, score: -score } },
  ]);
  const zero = summarize(0);
  const scored = summarize(30);
  assert.equal(scored.resourceWeighting, "spendable-only-v2");
  for (const key of ["setupGainWeighted", "grossGainWeighted", "incomeGainWeighted",
    "nonIncomeGainWeighted", "weightedActionCost"]) {
    assert.equal(scored.players[0][key], zero.players[0][key], key);
  }
  assert.equal(scored.players[0].nonIncomeGain.score, 30, "score remains separately traceable");
  assert.equal(scored.groups.byRound[1].nonIncomeGainWeighted, 6);
  assert.equal(scored.groups.byRound[1].spentWeighted, 3);
}

const analysis = flow.summarizeResourceEvents([
  {
    gameId: "g1", playerId: "p1", playerLabel: "白色", finalScore: 300,
    roundNumber: 0, turnNumber: 0, pace: "setup", sourceCategory: "setup",
    resourceDeltas: { credits: 4, energy: 2, handSize: 2 }, incomeDeltas: {}, confidence: 1,
  },
  {
    gameId: "g1", playerId: "p1", playerLabel: "白色", finalScore: 300,
    roundNumber: 1, turnNumber: 2, pace: "quick", sourceCategory: "income_upgrade_immediate",
    resourceDeltas: { credits: 1, handSize: -1 }, incomeDeltas: { credits: 1 }, confidence: 1,
  },
  {
    gameId: "g1", playerId: "p1", playerLabel: "白色", finalScore: 300,
    roundNumber: 2, turnNumber: 1, pace: "pass", sourceCategory: "pass_income",
    resourceDeltas: { credits: 3, energy: 1 }, incomeDeltas: {}, confidence: 1,
  },
  {
    gameId: "g1", playerId: "p1", playerLabel: "白色", finalScore: 300,
    roundNumber: 2, turnNumber: 3, pace: "quick", sourceCategory: "tech_bonus_blue1",
    resourceDeltas: { credits: 2 }, incomeDeltas: {}, confidence: 1,
  },
  {
    gameId: "g1", playerId: "p1", playerLabel: "白色", finalScore: 300,
    roundNumber: 2, turnNumber: 4, pace: "quick", sourceCategory: "tech_bonus_blue2",
    resourceDeltas: { energy: 2 }, incomeDeltas: {}, confidence: 1,
  },
  {
    gameId: "g1", playerId: "p1", playerLabel: "白色", finalScore: 300,
    roundNumber: 2, turnNumber: 5, pace: "main", sourceCategory: "cost",
    resourceDeltas: { credits: -2, energy: -2 }, incomeDeltas: {}, confidence: 1,
  },
], {
  endingInventories: { p1: { credits: 8, energy: 3, handSize: 1 } },
  productiveMainActionCounts: { p1: 1 },
});

const player = analysis.players[0];
assert.deepEqual(player.setupGain, { score: 0, credits: 4, energy: 2, publicity: 0, availableData: 0, handSize: 2 });
assert.deepEqual(player.incomeGain, { score: 0, credits: 4, energy: 1, publicity: 0, availableData: 0, handSize: 0 });
assert.deepEqual(player.nonIncomeGain, { score: 0, credits: 2, energy: 2, publicity: 0, availableData: 0, handSize: 0 });
assert.deepEqual(player.spent, { score: 0, credits: 2, energy: 2, publicity: 0, availableData: 0, handSize: 1 });
assert.equal(player.blue1CreditGain, 2);
assert.equal(player.blue2EnergyGain, 2);
assert.equal(player.utilizationRate.credits, 0.2);
assert.equal(player.utilizationRate.publicity, null);
assert.equal(player.nonIncomeShare.credits, 1 / 3);
assert.equal(player.incomeGainWeighted, 15);
assert.equal(player.nonIncomeGainWeighted, 12);
assert.equal(player.weightedActionCost, 15);
assert.equal(player.mainActionsPerWeightedCost, 1 / 15);
assert.equal(player.sameRoundReinvestment.credits, 2);
assert.equal(player.sameRoundReinvestment.energy, 2);

const cycleAndCards = flow.summarizeResourceEvents([
  {
    gameId: "g2", playerId: "p2", playerLabel: "蓝色", finalScore: 280,
    roundNumber: 1, turnNumber: 1, pace: "main", sourceCategory: "alien",
    resourceDeltas: { handSize: 1 }, incomeDeltas: {}, confidence: 1,
    cards: [{ key: "alien-card-1", label: "半人马卡牌1", change: "gain", origin: "alien" }],
  },
  {
    gameId: "g2", playerId: "p2", playerLabel: "蓝色", finalScore: 280,
    roundNumber: 1, turnNumber: 2, pace: "main", sourceCategory: "card",
    resourceDeltas: { handSize: -1 }, incomeDeltas: {}, confidence: 1,
    cards: [{ key: "alien-card-1", label: "半人马卡牌1", change: "play", origin: "alien" }],
  },
  { gameId: "g2", playerId: "p2", roundNumber: 1, turnNumber: 3, pace: "main", sourceCategory: "analysis", resourceDeltas: {}, incomeDeltas: {}, confidence: 1 },
  { gameId: "g2", playerId: "p2", roundNumber: 1, turnNumber: 4, pace: "quick", sourceCategory: "data_placement", resourceDeltas: { availableData: -1 }, incomeDeltas: {}, confidence: 1 },
  { gameId: "g2", playerId: "p2", roundNumber: 1, turnNumber: 5, pace: "main", sourceCategory: "analysis", resourceDeltas: {}, incomeDeltas: {}, confidence: 1 },
], { productiveMainActionCounts: { p2: 3 } });
const cyclePlayer = cycleAndCards.players[0];
assert.equal(cyclePlayer.cardUse.gainedInGame, 1);
assert.equal(cyclePlayer.cardUse.playedFromGains, 1);
assert.equal(cyclePlayer.drawToPlayRate, 1);
assert.equal(cyclePlayer.alienCardToPlayRate, 1);
assert.equal(cyclePlayer.dataTurnoverCount, 1);
assert.equal(cyclePlayer.fullDataCycleCount, 1);
assert.equal(cyclePlayer.analysisActionCount, 2);

const repeatedAnalysisEntry = flow.summarizeResourceEvents([
  { gameId: "cycles", playerId: "p", entryId: 65, pace: "main", sourceCategory: "analysis", resourceDeltas: { energy: -1 } },
  { gameId: "cycles", playerId: "p", entryId: 65, pace: "quick", sourceCategory: "data_placement", resourceDeltas: { availableData: -1 } },
  { gameId: "cycles", playerId: "p", entryId: 65, pace: "quick", sourceCategory: "analysis", sourceDetail: "移动" },
  { gameId: "cycles", playerId: "p", entryId: 65, pace: "quick", sourceCategory: "analysis", sourceDetail: "标记终局" },
  { gameId: "cycles", playerId: "p", entryId: 65, pace: "main", sourceCategory: "analysis", sourceDetail: "分析奖励结算" },
  { gameId: "cycles", playerId: "p", entryId: 118, pace: "main", sourceCategory: "analysis", resourceDeltas: { energy: -1 } },
]).players[0];
assert.equal(repeatedAnalysisEntry.analysisActionCount, 2, "one confirmed main entry is one analysis, regardless of its later reward steps");
assert.equal(repeatedAnalysisEntry.dataTurnoverCount, 1, "later steps must not reset the refill window");
assert.equal(repeatedAnalysisEntry.fullDataCycleCount, 1, "only the next distinct analysis completes a cycle");

const revealedAnalysis = flow.summarizeResourceEvents([
  { gameId: "reveal", playerId: "p", entryId: 1, pace: "main", mainActionType: "analyze", sourceCategory: "alien", sourceDetail: "方舟揭示奖励" },
  { gameId: "reveal", playerId: "p", entryId: 1, pace: "quick", sourceCategory: "data_placement" },
  { gameId: "reveal", playerId: "p", entryId: 1, pace: "analyze", sourceCategory: "cost", resourceDeltas: { energy: -1 }, syntheticSnapshotInference: true },
  { gameId: "reveal", playerId: "p", entryId: 2, pace: "main", mainActionType: "analyze", sourceCategory: "alien" },
]).players[0];
assert.equal(revealedAnalysis.analysisActionCount, 2, "confirmed parent action types survive reveal reward text replacing the payment step");
assert.equal(revealedAnalysis.fullDataCycleCount, 1, "recover the analysis boundary before its following placement, not at the later snapshot residual");
const revealEvents = flow.normalizeStructuredActionLog([{
  id: 7, playerId: "p", actionType: "analyze", roundNumber: 1, turnNumber: 1,
  steps: [{ source: "main", text: "方舟奖励：分数+1" }],
}]);
assert.equal(revealEvents[0].mainActionType, "analyze");
const revealReport = flow.summarizeResourceEvents(revealEvents);
assert.equal(revealReport.players[0].analysisActionCount, 1);
assert.equal(revealReport.groups.byRound[1].analysisCount, 1, "round aggregates share the distinct-action definition");
assert.equal(flow.summarizeDataCycles([
  { gameId: "other", playerId: "p", entryId: 3, pace: "analyze", sourceCategory: "alien", sourceDetail: "snapshot hand gain", resourceDeltas: { handSize: 1 } },
]).analysisActionCount, 0, "a different player's analysis can grant this player a card without giving them an analysis action");

const incomeCards = flow.summarizeResourceEvents([
  {
    gameId: "g3", playerId: "p3", playerLabel: "绿色", finalScore: 260,
    roundNumber: 1, turnNumber: 1, pace: "main", sourceCategory: "card",
    resourceDeltas: { handSize: 1 }, incomeDeltas: {}, confidence: 1,
    cards: [{ key: "income-card-1", label: "收益牌", change: "gain", origin: "normal" }],
  },
  {
    gameId: "g3", playerId: "p3", playerLabel: "绿色", finalScore: 260,
    roundNumber: 1, turnNumber: 2, pace: "quick", sourceCategory: "income_upgrade_immediate",
    resourceDeltas: { credits: 1, handSize: -1 }, incomeDeltas: { credits: 1 }, confidence: 1,
    cards: [{ key: "income-card-1", label: "收益牌", change: "income", origin: "normal" }],
  },
]);
assert.equal(incomeCards.players[0].cardUse.incomeFromGains, 1);
assert.equal(incomeCards.players[0].incomeCardConversionRate, 1);

const mixedBlueAndIncome = flow.summarizeResourceEvents([{
  gameId: "g4", playerId: "p4", playerLabel: "棕色", finalScore: 240,
  roundNumber: 2, turnNumber: 2, pace: "quick", sourceCategory: "tech_bonus_blue1",
  resourceDeltas: { credits: 2, handSize: -1 },
  incomeDeltas: { credits: 1 },
  confidence: 1,
}]);
assert.equal(mixedBlueAndIncome.players[0].incomeGain.credits, 1);
assert.equal(mixedBlueAndIncome.players[0].nonIncomeGain.credits, 1);
assert.equal(mixedBlueAndIncome.players[0].blue1CreditGain, 1);
assert.equal(mixedBlueAndIncome.players[0].endingInventory.credits, 2);
assert.equal(mixedBlueAndIncome.players[0].endingInventory.publicity, null);

const conversionDenominator = flow.summarizeResourceEvents([
  ...["a", "b", "unused"].map((key, index) => ({
    gameId: "g5", playerId: "p5", roundNumber: 1, turnNumber: index + 1,
    pace: "quick", sourceCategory: "card", resourceDeltas: { handSize: 1 },
    incomeDeltas: {}, cards: [{ key, label: key, change: "gain", origin: "normal" }],
  })),
  {
    gameId: "g5", playerId: "p5", roundNumber: 1, turnNumber: 4,
    pace: "main", sourceCategory: "card", resourceDeltas: { handSize: -1 },
    incomeDeltas: {}, cards: [{ key: "a", label: "a", change: "play", origin: "normal" }],
  },
  {
    gameId: "g5", playerId: "p5", roundNumber: 1, turnNumber: 5,
    pace: "quick", sourceCategory: "income_upgrade_immediate", resourceDeltas: { handSize: -1 },
    incomeDeltas: {}, cards: [{ key: "b", label: "b", change: "income", origin: "normal" }],
  },
]);
assert.equal(conversionDenominator.players[0].incomeCardConversionRate, 0.5);

assert.deepEqual(
  flow.parseDeltaText("打出：测试牌：资源：信用点-2、手牌-1；收入：信用点+1"),
  {
    resourceDeltas: { credits: -2, handSize: -1 },
    incomeDeltas: { credits: 1 },
    matchedMagnitude: 4,
    duplicateSuppressed: 0,
  },
);
assert.deepEqual(
  flow.parseDeltaText("蓝色奖励槽：+1 信用点；资源：信用点+1"),
  {
    resourceDeltas: { credits: 1 },
    incomeDeltas: {},
    matchedMagnitude: 1,
    duplicateSuppressed: 1,
  },
);
assert.equal(flow.classifySourceCategory({ pace: "setup", text: "选择公司" }), "setup");
assert.equal(flow.classifySourceCategory({ pace: "pass", text: "获得本轮收入" }), "pass_income");
assert.notEqual(flow.classifySourceCategory({ text: "选择科技：blue1" }), "tech_bonus_blue1");
assert.equal(flow.classifySourceCategory({ text: "放置数据：蓝1 +1信用点" }), "tech_bonus_blue1");
assert.equal(flow.classifySourceCategory({ text: "放置数据：蓝2 +1能量" }), "tech_bonus_blue2");
assert.equal(flow.classifySourceCategory({ text: "半人马顶部奖励：外星人牌" }), "alien");
assert.equal(flow.classifySourceCategory({
  actionType: "researchTech",
  text: "获取奖励：3分，首拿 +2分",
}), "tech_bonus_other");
assert.equal(
  flow.classifySourceCategory({ text: "没有可识别来源：资源：信用点+1" }),
  "unclassified",
);

const structuredEntries = [
  {
    id: 1, roundNumber: 1, turnNumber: 1, playerId: "p1", playerLabel: "白色",
    actionType: "playCard", actionLabel: "打牌行动",
    steps: [{
      source: "main",
      text: "打出：测试牌：资源：信用点-1、手牌-1",
      playedCard: { id: "c1", label: "测试牌" },
    }],
    recoverySnapshot: { state: { playerState: { players: [{
      id: "p1",
      resources: { credits: 3, energy: 2, publicity: 0, availableData: 0 },
      hand: [{ id: "c2", label: "剩余牌" }],
      income: {},
    }] } } },
  },
  {
    id: 2, roundNumber: 1, turnNumber: 2, playerId: "p1", playerLabel: "白色",
    actionType: "quick", actionLabel: "快速行动",
    steps: [{ source: "quick", text: "蓝1奖励：资源：信用点+1" }],
    recoverySnapshot: { state: { playerState: { players: [{
      id: "p1",
      resources: { credits: 4, energy: 2, publicity: 0, availableData: 0 },
      hand: [{ id: "c2", label: "剩余牌" }],
      income: {},
    }] } } },
  },
];

const structured = flow.analyzeStructuredActionLog(structuredEntries, {
  gameId: "ai-1",
  initialPlayerStates: {
    p1: {
      resources: { credits: 4, energy: 2 },
      hand: [{ id: "c1" }, { id: "c2" }],
      income: {},
    },
  },
  playerResults: [{ playerId: "p1", playerLabel: "白色", finalScore: 250 }],
});
assert.equal(structured.reconciliation.residualMagnitude, 0);
assert.equal(structured.players[0].blue1CreditGain, 1);
assert.equal(structured.players[0].cardUse.played, 1);
assert.equal(structured.players[0].mainActionsPerWeightedCost, 1 / 6);
assert.equal(JSON.stringify(structured).includes("recoverySnapshot"), false);

const implicitOwnedBlueRewards = flow.summarizeResourceEvents([
  {
    gameId: "blue-owned", entryId: 1, playerId: "p1", playerLabel: "白色",
    roundNumber: 1, sourceCategory: "tech_bonus_other", sourceDetail: "选择科技：blue1",
    resourceDeltas: {}, incomeDeltas: {}, techIds: ["blue1"], cards: [],
  },
  {
    gameId: "blue-owned", entryId: 2, playerId: "p1", playerLabel: "白色",
    roundNumber: 1, sourceCategory: "data_placement", sourceDetail: "放置数据：资源：信用点+1",
    resourceDeltas: { credits: 1, availableData: -1 }, incomeDeltas: {},
    techIds: [], cards: [], isDataPlacement: true,
  },
  {
    gameId: "blue-owned", entryId: 3, playerId: "p1", playerLabel: "白色",
    roundNumber: 1, sourceCategory: "tech_bonus_other", sourceDetail: "选择科技：blue2",
    resourceDeltas: {}, incomeDeltas: {}, techIds: ["blue2"], cards: [],
  },
  {
    gameId: "blue-owned", entryId: 4, playerId: "p1", playerLabel: "白色",
    roundNumber: 1, sourceCategory: "card", sourceDetail: "放置数据：资源：能量+1",
    resourceDeltas: { energy: 1, availableData: -1 }, incomeDeltas: {},
    techIds: [], cards: [], isDataPlacement: true,
  },
]);
assert.equal(implicitOwnedBlueRewards.players[0].blue1CreditGain, 1);
assert.equal(implicitOwnedBlueRewards.players[0].blue2EnergyGain, 1);

const brokenStructuredEvents = structured.events.map((event) => ({ ...event }));
brokenStructuredEvents[0].resourceDeltas = { credits: 0, handSize: -1 };
assert.equal(flow.reconcileStructuredEvents(structuredEntries, brokenStructuredEvents, {
  initialPlayerStates: {
    p1: {
      resources: { credits: 4, energy: 2 },
      hand: [{ id: "c1" }, { id: "c2" }],
      income: {},
    },
  },
}).residuals[0].resourceDeltas.credits, -1);

const crossOwnerStructured = flow.analyzeStructuredActionLog([{
  id: 3, roundNumber: 1, turnNumber: 3, playerId: "p1", playerLabel: "白色",
  actionType: "quick", actionLabel: "快速行动",
  steps: [{ source: "quick", text: "棕色 信用点+1" }],
  recoverySnapshot: { state: { playerState: { players: [
    {
      id: "p1", color: "white",
      resources: { credits: 4, energy: 2, publicity: 0, availableData: 0 },
      hand: [], income: {},
    },
    {
      id: "p2", color: "brown",
      resources: { credits: 5, energy: 2, publicity: 0, availableData: 0 },
      hand: [], income: {},
    },
  ] } } },
}], {
  gameId: "ai-cross-owner",
  initialPlayerStates: {
    p1: { color: "white", resources: { credits: 4, energy: 2 }, hand: [], income: {} },
    p2: { color: "brown", resources: { credits: 4, energy: 2 }, hand: [], income: {} },
  },
});
assert.equal(crossOwnerStructured.reconciliation.residualMagnitude, 0);
assert.equal(crossOwnerStructured.events[0].playerId, "p2");
assert.equal(
  crossOwnerStructured.players.find((candidate) => candidate.playerId === "p2").nonIncomeGain.credits,
  1,
);

const coloredSlotOwner = flow.analyzeStructuredActionLog([{
  id: 31, roundNumber: 1, turnNumber: 3, playerId: "p1", playerLabel: "白色",
  actionType: "quick", actionLabel: "公司奖励",
  steps: [{ source: "quick", text: "宇宙战略集团：蓝色奖励槽：+1 数据" }],
  recoverySnapshot: { state: { playerState: { players: [
    { id: "p1", color: "white", resources: { availableData: 1 }, hand: [], income: {} },
    { id: "p2", color: "blue", resources: { availableData: 0 }, hand: [], income: {} },
  ] } } },
}], {
  gameId: "ai-colored-slot-owner",
  initialPlayerStates: {
    p1: { color: "white", resources: { availableData: 0 }, hand: [], income: {} },
    p2: { color: "blue", resources: { availableData: 0 }, hand: [], income: {} },
  },
});
assert.equal(coloredSlotOwner.reconciliation.residualMagnitude, 0);
assert.equal(coloredSlotOwner.events[0].playerId, "p1");

const setupStructuredEntries = [
  {
    id: 4, roundNumber: 0, turnNumber: 0, playerId: "p1", playerLabel: "白色",
    actionType: "setup", actionLabel: "开局设置",
    steps: [{ source: "setup", text: "发放默认初始手牌" }],
    recoverySnapshot: { state: { playerState: { players: [{
      id: "p1", color: "white", resources: { credits: 4, energy: 2 },
      hand: [{ id: "a" }, { id: "b" }, { id: "c" }, { id: "d" }], income: {},
    }] } } },
  },
  {
    id: 5, roundNumber: 0, turnNumber: 0, playerId: "p1", playerLabel: "白色",
    actionType: "setup", actionLabel: "开局设置",
    steps: [{ source: "setup", text: "未记录的额外开局牌" }],
    recoverySnapshot: { state: { playerState: { players: [{
      id: "p1", color: "white", resources: { credits: 4, energy: 2 },
      hand: [{ id: "a" }, { id: "b" }, { id: "c" }, { id: "d" }, { id: "e" }], income: {},
    }] } } },
  },
];
const setupStructured = flow.analyzeStructuredActionLog(setupStructuredEntries, {
  gameId: "ai-setup",
  initialPlayerStates: {
    p1: { color: "white", resources: { credits: 4, energy: 2 }, hand: [], income: {} },
  },
});
assert.equal(setupStructured.players[0].setupGain.handSize, 5);
assert.equal(setupStructured.reconciliation.residualMagnitude, 0);
assert.equal(JSON.stringify(setupStructured).includes("recoverySnapshot"), false);

const structuredNaturalLanguage = flow.normalizeStructuredActionLog([{
  id: 6, roundNumber: 1, turnNumber: 1, playerId: "p1", playerLabel: "白色",
  actionType: "scan", actionLabel: "扫描行动",
  steps: [
    { source: "main", text: "扫描费用：扫描消耗 1信用点 + 2能量" },
    { source: "main", text: "获取3分：获取奖励：3分，首拿 +2分" },
    { source: "quick", text: "放置数据：资源：能量+1、手牌-1；收入：能量+1" },
    { source: "pass", text: "PASS 收入：信用点+4、能量+2、手牌+1、数据+1" },
    { source: "main", text: "首次环绕：额外获得 3分：白色 分数+3" },
    { source: "quick", text: "获得 1宣传：白色 宣传+1" },
    { source: "quick", text: "卡牌快速行动：弃牌换1宣传：资源：手牌-1" },
    { source: "quick", text: "获得 1 次收入：收入：弃掉 测试牌，信用点+1（已即时获得）" },
  ],
}], { gameId: "ai-natural-language" });
assert.deepEqual(structuredNaturalLanguage[0].resourceDeltas, { credits: -1, energy: -2 });
assert.deepEqual(structuredNaturalLanguage[1].resourceDeltas, { score: 5 });
assert.deepEqual(
  structuredNaturalLanguage[2].resourceDeltas,
  { energy: 1, handSize: -1, availableData: -1 },
);
assert.deepEqual(structuredNaturalLanguage[2].incomeDeltas, { energy: 1 });
assert.deepEqual(
  structuredNaturalLanguage[3].resourceDeltas,
  { credits: 4, energy: 2, handSize: 1, availableData: 1 },
);
assert.deepEqual(structuredNaturalLanguage[3].incomeDeltas, {});
assert.deepEqual(structuredNaturalLanguage[4].resourceDeltas, { score: 3 });
assert.deepEqual(structuredNaturalLanguage[5].resourceDeltas, { publicity: 1 });
assert.deepEqual(structuredNaturalLanguage[6].resourceDeltas, { handSize: -1, publicity: 1 });
assert.deepEqual(structuredNaturalLanguage[7].resourceDeltas, { credits: 1, handSize: -1 });
assert.deepEqual(structuredNaturalLanguage[7].incomeDeltas, { credits: 1 });

const structuredSetupIncome = flow.normalizeStructuredActionLog([{
  id: 61, roundNumber: 1, turnNumber: 1, playerId: "p1", playerLabel: "白色",
  actionType: "setup", actionLabel: "开局设置",
  steps: [{
    source: "setup",
    text: "结算初始效果：白色 测试公司：初始收入水平 credits+3、energy+1、handSize+1；获得 3宣传、2信用点、2能量；收入 +1数据；扫描两次：获得数据；获得数据",
  }],
}], { gameId: "ai-setup-income" });
assert.deepEqual(
  structuredSetupIncome[0].resourceDeltas,
  { publicity: 3, credits: 2, energy: 2, availableData: 3 },
);
assert.deepEqual(
  structuredSetupIncome[0].incomeDeltas,
  { credits: 3, energy: 1, handSize: 1, availableData: 1 },
);
assert.equal(flow.classifySourceCategory({
  pace: "setup",
  text: "作弊实验室：第2轮开始：获得 1能量；盲抽 1/1 张",
}), "industry");

const crossOwnerCardGain = flow.analyzeStructuredActionLog([{
  id: 7, roundNumber: 1, turnNumber: 4, playerId: "p2", playerLabel: "棕色",
  actionType: "alienReveal", actionLabel: "揭示外星人",
  steps: [{ source: "main", text: "虫族揭示发牌：蓝色+1，棕色+1" }],
  recoverySnapshot: { state: { playerState: { players: [
    { id: "p1", color: "blue", resources: {}, hand: [{ id: "alien-blue" }], income: {} },
    { id: "p2", color: "brown", resources: {}, hand: [{ id: "alien-brown" }], income: {} },
  ] } } },
}], {
  gameId: "ai-alien-cross-owner",
  initialPlayerStates: {
    p1: { color: "blue", resources: {}, hand: [], income: {} },
    p2: { color: "brown", resources: {}, hand: [], income: {} },
  },
});
assert.equal(crossOwnerCardGain.reconciliation.residualMagnitude, 0);
for (const playerId of ["p1", "p2"]) {
  const playerFlow = crossOwnerCardGain.players.find((candidate) => candidate.playerId === playerId);
  assert.equal(playerFlow.cardUse.gainedInGame, 1);
  assert.equal(playerFlow.cardUse.alienGainedInGame, 1);
}

{
  const a={id:"played-a",label:"打出的牌"},b={id:"income-b",label:"收入牌"},c={id:"unknown-c",label:"移出牌"};
  const player=(hand,income={})=>({id:"p1",color:"white",hand,resources:{handSize:hand.length,credits:income.credits||0},income});
  const initial=player([]);
  const entries=[
    {id:1,roundNumber:2,playerId:"p1",actionType:"scan",steps:[{source:"main",text:"资源：手牌+3"}],accountingSnapshot:{players:[player([a,b,c])]}},
    {id:2,roundNumber:2,playerId:"p1",actionType:"playCard",steps:[
      {source:"main",text:"打出：打出的牌：资源：手牌-1",playedCard:a},
      {source:"quick",text:"收入：弃掉 收入牌，信用点+1（已即时获得）"},
    ],accountingSnapshot:{players:[player([],{credits:1})]}},
  ];
  const r=flow.analyzeStructuredActionLog(entries,{initialPlayerStates:[initial]});
  const p=r.players[0],unknown=r.events.filter(e=>e.syntheticHandRemoval);
  assert.equal(unknown.length,1);
  assert.deepEqual(unknown[0].cards.map(c=>[c.key,c.change]),[[c.id,"unknown_removal"]]);
  assert.deepEqual(unknown[0].resourceDeltas,{},"identity diagnostics cannot add another payment");
  assert.equal(p.cardUse.playedFromGains,1);
  assert.equal(p.cardUse.incomeFromGains,1);
  assert.equal(p.cardUse.unknownRemovalsFromGains,1);
  assert.equal(p.cardUse.discardedFromGains,0,"an unexplained removal must not be guessed as discard");
  assert.equal(p.cardUse.untracedGains,0);
  assert.equal(p.cardUse.knownRemovalUseRate,2/3);
  assert.equal(p.spent.handSize,3);
  assert.equal(r.reconciliation.residualMagnitude,0);
  const unobserved=flow.analyzeStructuredActionLog(entries.map(({accountingSnapshot,...e})=>e),{initialPlayerStates:[initial]});
  assert.equal(unobserved.events.filter(e=>e.syntheticHandRemoval).length,0,"missing snapshots cannot prove removal identities");
  const partial=flow.analyzeStructuredActionLog([{id:3,roundNumber:2,playerId:"p2",actionType:"scan",steps:[],accountingSnapshot:{players:[{id:"p2",hand:[],resources:{}}]}}],{initialPlayerStates:[player([c]),{id:"p2",hand:[],resources:{}}]});
  assert.equal(partial.events.filter(e=>e.syntheticHandRemoval).length,0,"a player omitted from a partial snapshot has no observed after-hand");
}

const structuredResearchCost = flow.analyzeStructuredActionLog([{
  id: 8, roundNumber: 1, turnNumber: 5, playerId: "p1", playerLabel: "白色",
  actionType: "researchTech", actionLabel: "科技行动",
  steps: [
    { source: "main", text: "科技行动：请选择要研究的科技板块" },
    { source: "main", text: "选择科技：orange4" },
    { source: "main", text: "获得科技片：orange4：获得科技：orange4" },
  ],
  recoverySnapshot: { state: { playerState: { players: [{
    id: "p1", color: "white", resources: { publicity: 1 }, hand: [], income: {},
  }] } } },
}], {
  gameId: "ai-research-cost",
  initialPlayerStates: {
    p1: { color: "white", resources: { publicity: 7 }, hand: [], income: {} },
  },
});
assert.equal(structuredResearchCost.reconciliation.residualMagnitude, 0);
assert.equal(structuredResearchCost.players[0].spent.publicity, 6);
assert.equal(
  structuredResearchCost.events.find((event) => event.syntheticResearchCost).sourceCategory,
  "cost",
);

const structuredMoveInference = flow.analyzeStructuredActionLog([{
  id: 9, roundNumber: 1, turnNumber: 6, playerId: "p1", playerLabel: "白色",
  actionType: "move", actionLabel: "移动",
  steps: [{ source: "main", text: "移动到金星" }],
  recoverySnapshot: { state: { playerState: { players: [{
    id: "p1", color: "white", resources: { energy: 1, publicity: 1 }, hand: [], income: {},
  }] } } },
}], {
  gameId: "ai-move-inference",
  initialPlayerStates: {
    p1: { color: "white", resources: { energy: 2, publicity: 0 }, hand: [], income: {} },
  },
});
assert.equal(structuredMoveInference.reconciliation.residualMagnitude, 0);
assert.equal(structuredMoveInference.players[0].spent.energy, 1);
assert.equal(structuredMoveInference.players[0].nonIncomeGain.publicity, 1);
assert.equal(structuredMoveInference.reconciliation.inferredMagnitude, 2);

const gainedIncomeCard = flow.analyzeStructuredActionLog([
  {
    id: 10, roundNumber: 1, turnNumber: 7, playerId: "p1", playerLabel: "白色",
    actionType: "analyze", actionLabel: "分析数据",
    steps: [{
      source: "main",
      text: "分析：获得虫族牌：收益牌；资源：手牌+1",
    }],
    recoverySnapshot: { state: { playerState: { players: [{
      id: "p1", color: "white", resources: { credits: 0 },
      hand: [{ id: "alien-income-card", label: "收益牌" }], income: {},
    }] } } },
  },
  {
    id: 11, roundNumber: 1, turnNumber: 8, playerId: "p1", playerLabel: "白色",
    actionType: "quick", actionLabel: "收益牌",
    steps: [{
      source: "quick",
      text: "获得 1 次收入：收入：弃掉 收益牌，信用点+1（已即时获得）",
    }],
    recoverySnapshot: { state: { playerState: { players: [{
      id: "p1", color: "white", resources: { credits: 1 }, hand: [], income: { credits: 1 },
    }] } } },
  },
], {
  gameId: "ai-income-card-identity",
  initialPlayerStates: {
    p1: { color: "white", resources: { credits: 0 }, hand: [], income: {} },
  },
});
assert.equal(gainedIncomeCard.reconciliation.residualMagnitude, 0);
assert.equal(gainedIncomeCard.players[0].cardUse.gainedInGame, 1);
assert.equal(gainedIncomeCard.players[0].cardUse.income, 1);
assert.equal(gainedIncomeCard.players[0].cardUse.incomeFromGains, 1);
assert.equal(gainedIncomeCard.players[0].incomeCardConversionRate, 1);

{
  const before = { id: "p1", color: "white", resources: { credits: 2 },
    income: {}, hand: [{ id: "a" }, { id: "b" }] };
  const after = { ...before, resources: { credits: 3 },
    income: { credits: 1, handSize: 1 }, hand: [{ id: "c" }] };
  const entries = [{ id: 1, roundNumber: 1, playerId: "p1", actionType: "initialSelection",
    steps: [{ source: "setup", text: "结算初始效果：白色 获得 2信用点" }],
    accountingSnapshot: { players: [before] },
  }, { id: 2, roundNumber: 1, playerId: "p1", actionType: "initialIncome",
    steps: [
      { source: "setup", text: "白色 初始收入增加：收入：弃掉 a，手牌+1（已即时获得）" },
      { source: "setup", text: "白色 初始收入增加：收入：弃掉 b，信用点+1（已即时获得）" },
    ], recoverySnapshot: { state: { playerState: { players: [after] } } },
  }];
  const result = flow.analyzeStructuredActionLog(entries, {
    initialPlayerStates: { p1: { ...before, resources: {}, hand: [] } },
  });
  const row = result.players[0];
  assert.equal(row.setupGain.credits, 2);
  assert.equal(row.incomeGain.credits, 1);
  assert.equal(row.incomeGain.handSize, 1, "drawing while discarding is a real gross gain");
  assert.equal(row.spent.handSize, 2, "both income cards were consumed despite a replacement draw");
  assert.equal(row.cardUse.gainedInGame, 0, "cards drawn during initial income remain opening cards");
  assert.deepEqual(row.balanceResiduals, {});
  assert.equal(result.reconciliation.residualMagnitude, 0);
  assert.equal(row.mainActionsPerWeightedCost, 0, "setup income is not a productive main action");
  const truncated = flow.analyzeStructuredActionLog(entries.slice(0, 1), {
    initialPlayerStates: { p1: { ...before, resources: {}, hand: [] } },
    endingInventories: { p1: { credits: 3, handSize: 2 } },
  });
  assert.equal(truncated.players[0].balanceResiduals.credits, -1);
  assert.equal(truncated.players[0].utilizationRate.credits, null,
    "a missing opening reward must not produce a purportedly reconciled utilization rate");
  const roundStart = flow.analyzeStructuredActionLog([{
    id: 3, roundNumber: 2, playerId: "p1", actionType: "setup",
    steps: [{ source: "setup", text: "寰宇超动力：第2轮开始：获得 1能量" }],
    accountingSnapshot: { players: [{ ...after, resources: { credits: 3, energy: 2 } }] },
  }], { initialPlayerStates: { p1: after } });
  assert.equal(roundStart.players[0].nonIncomeGain.energy, 2,
    "round-start setup steps participate in resource snapshot reconciliation");
}

{
  const result = flow.analyzeStructuredActionLog([{
    id: 12, roundNumber: 1, turnNumber: 2, playerId: "green", actionType: "analyze",
    steps: [
      { source: "main", playerId: "green", text: "分析数据：绿色 能量-1" },
      { source: "main", playerId: "white", text: "方舟奖励：已抽 1 张" },
      { source: "main", playerId: "white", text: "方舟奖励：信用点+1" },
    ],
  }], { initialPlayerStates: [
    { id: "green", color: "green", resources: { energy: 1 } },
    { id: "white", color: "white", resources: {} },
  ] });
  const green = result.players.find(p => p.playerId === "green");
  const white = result.players.find(p => p.playerId === "white");
  assert.equal(green.analysisActionCount, 1);
  assert.equal(white.analysisActionCount, 0, "receiving an unlabeled reveal reward is not analyzing");
  assert.equal(white.nonIncomeGain.credits, 1);
  assert.equal(green.nonIncomeGain.credits || 0, 0);
  assert.equal(result.events.find(e => e.sourceDetail.includes("已抽")).playerId, "white");
}

{
  const result = flow.analyzeStructuredActionLog([{
    id: 1, roundNumber: 1, playerId: "p1", actionType: "analyze",
    steps: [{ source: "main", text: "方舟奖励 3：额外弃牌扫描 +1：公共弃牌扫描 +1" },
      { source: "main", text: "从弃牌堆获取奖励" }],
  }], { initialPlayerStates: [{ id: "p1", color: "white", resources: {} }] });
  assert.ok(result.events.every(e => e.cards.length === 0), "discard scan and discard pile labels are not a discarded hand card");
}

{
  const initial = { id: "p1", color: "blue", resources: { credits: 3, handSize: 1, publicity: 10 }, hand: [{ id: "played", label: "康奈尔大学" }] };
  const after = { ...initial, resources: { credits: 2, handSize: 1, publicity: 7 }, hand: [{ id: "gained", label: "延期发射" }] };
  const report = flow.analyzeStructuredActionLog([{
    id: 168, roundNumber: 4, turnNumber: 8, playerId: "p1", actionType: "playCard",
    steps: [
      { source: "quick", text: "快速交易：3宣传 → 精选1张牌：快速交易精选：延期发射，公共区已补牌：重组" },
      { source: "main", text: "打出：康奈尔大学：资源：信用点-1、手牌-1" },
    ], accountingSnapshot: { players: [after] },
  }], { initialPlayerStates: [initial] });
  const payment = report.events.find(e => e.sourceDetail.startsWith("打出"));
  const refill = report.events.find(e => e.sourceDetail.includes("快速交易精选"));
  assert.equal(payment.resourceDeltas.handSize, -1, "later card payment must retain its real hand cost");
  assert.equal(refill.resourceDeltas.handSize, 1, "snapshot refill belongs to the unique preceding trade pickup");
  assert.equal(refill.cards.find(c => c.change === "gain")?.key, "gained");
  assert.equal(report.players[0].nonIncomeGain.handSize, 1);
  assert.equal(report.players[0].spent.handSize, 1);
  assert.equal(report.reconciliation.residualMagnitude, 0);
}

{
  for (const text of ["追加蓝色扫描计数；不获得数据", "未获得数据", "无法获得数据", "未能获得数据", "不能获得数据", "不会获得数据", "不再获得数据"]) {
    const report = flow.analyzeStructuredActionLog([{ id: 1, roundNumber: 4, playerId: "p", actionType: "playCard", steps: [{ source: "main", text }] }], { initialPlayerStates: [{ id: "p", resources: {} }] });
    assert.equal(report.players[0].nonIncomeGain.availableData, 0, text);
  }
  const initial = { id: "p", resources: { availableData: 0 } };
  const report = flow.analyzeStructuredActionLog([{
    id: 174, roundNumber: 4, playerId: "p", actionType: "playCard",
    steps: [
      { source: "main", text: "开普勒22 槽位5 替换为蓝色token；获得数据；资源：数据+1" },
      { source: "main", text: "开普勒22 已无未替换数据，追加蓝色扫描计数；不获得数据" },
      { source: "main", text: "开普勒22 已无未替换数据，追加蓝色扫描计数；不获得数据" },
    ], accountingSnapshot: { players: [{ ...initial, resources: { availableData: 1 } }] },
  }], { initialPlayerStates: [initial] });
  assert.equal(report.players[0].nonIncomeGain.availableData, 1);
  assert.equal(report.players[0].spent.availableData, 0, "no phantom snapshot-balancing data cost");
  assert.equal(report.reconciliation.residualMagnitude, 0);
  const mixed = flow.analyzeStructuredActionLog([{ id: 1, playerId: "p", steps: [{ text: "第一次不获得数据；第二次获得数据" }] }], { initialPlayerStates: [initial] });
  assert.equal(mixed.players[0].nonIncomeGain.availableData, 1);
}

console.log("resource-flow.test.js: all tests passed");

{
 const card={id:"fangzhou-card2-p1-yellow-2",label:"方舟黄色痕迹 2"};
 const initial={id:"p1",resources:{handSize:0},hand:[]};
 const make=(discard)=>flow.analyzeStructuredActionLog([{id:1,roundNumber:2,playerId:"p1",actionType:"analyze",steps:[
  {source:"main",text:"解锁方舟黄色痕迹牌；资源：手牌+1",fangzhouCardChanges:[{...card,change:"gain"}]},
  ...(discard?[{source:"quick",text:"卡牌快速行动：方舟基础奖励：资源：手牌-1",fangzhouCardChanges:[{...card,change:"remove"}]}]:[]),
 ],accountingSnapshot:{players:[discard?initial:{...initial,resources:{handSize:1},hand:[card]}]}}],{initialPlayerStates:[initial]});
 for(const discard of [true,false]){const r=make(discard);assert.equal(r.players[0].cardUse.alienGainedInGame,1,"explicit identity must survive a zero-net hand entry and avoid snapshot double count");assert.equal(r.players[0].nonIncomeGain.handSize,1);assert.equal(r.players[0].spent.handSize,discard?1:0);assert.equal(r.reconciliation.residualMagnitude,0);assert.equal(r.events.flatMap(e=>e.cards).filter(c=>c.change==="gain"&&c.key===card.id).length,1);}
}

{
 const card={id:"fangzhou-paid-card",label:"方舟粉色痕迹 2"};
 for(const [text,playedCard,change]of [["弃牌换1移动：资源：手牌-1",null,"move_payment"],["收入：弃掉 方舟粉色痕迹 2，资源：手牌-1",null,"income"],["打出：方舟粉色痕迹 2：资源：手牌-1",card,"play"]]){
  const r=flow.analyzeStructuredActionLog([{id:1,roundNumber:2,playerId:"p1",actionType:"playCard",steps:[{source:"quick",text,playedCard,fangzhouCardChanges:[{...card,change:"remove"}]}]}],{initialPlayerStates:[{id:"p1",resources:{handSize:1},hand:[card]}]});
  const uses=r.events.flatMap(e=>e.cards);assert.equal(uses.length,1);assert.equal(uses[0].key,card.id);assert.equal(uses[0].change,change);
 }
}

{
 const special={id:"fangzhou-explicit",label:"方舟蓝4"},normal={id:"normal-other",label:"普通数据牌"};
 const initial={id:"p1",resources:{handSize:2},hand:[special,normal]};
 const r=flow.analyzeStructuredActionLog([{id:1,roundNumber:2,playerId:"p1",actionType:"analyze",steps:[
  {source:"quick",text:"卡牌快速行动：弃牌换1数据：资源：手牌-1"},
  {source:"quick",text:"放置数据：资源：手牌-1；收入：信用点+1",fangzhouCardChanges:[{...special,change:"remove"}]},
 ],accountingSnapshot:{players:[{...initial,resources:{handSize:0},hand:[]}]}}],{initialPlayerStates:[initial]});
 const uses=r.events.flatMap(e=>e.cards).filter(c=>c.change!=="gain");
 assert.equal(uses.filter(c=>c.key===special.id).length,1,"text fallback must not steal an identity reserved by a later exact transition");
 assert.equal(uses.find(c=>c.key===special.id).change,"income");
  assert.equal(uses.find(c=>c.key===normal.id).change,"discard");
}

{
 const special={id:"fangzhou-mixed",label:"方舟粉色痕迹 1"},normal={id:"new-normal"};
 const initial={id:"p1",resources:{handSize:1},hand:[{id:"consumed"}]};
 const r=flow.analyzeStructuredActionLog([{id:1,roundNumber:2,playerId:"p1",actionType:"scan",steps:[
  {source:"main",text:"解锁方舟粉色痕迹牌；资源：手牌+1",fangzhouCardChanges:[{...special,change:"gain"}]},
  {source:"quick",text:"放置数据：获得卡牌：普通牌"},
 ],accountingSnapshot:{players:[{...initial,resources:{handSize:2},hand:[special,normal]}]}}],{initialPlayerStates:[initial]});
 assert.equal(r.players[0].nonIncomeGain.handSize,2,"explicit identity must not hide a separate normal draw");
 assert.equal(r.players[0].spent.handSize,1,"the removed original card remains a gross cost");
 assert.equal(r.events.flatMap(e=>e.cards).filter(c=>c.change==='gain'&&c.key===special.id).length,1);
 assert.equal(r.reconciliation.residualMagnitude,0);
}


{
  const incomeCard = { id: "card-151-0", cardName: "合同研究" };
  const scanCard = { id: "card-154-0", cardName: "重组" };
  const initial = { id: "p", color: "green", resources: {}, income: {}, hand: [incomeCard, scanCard] };
  const entries = [{ id: 172, roundNumber: 4, playerId: "p", actionType: "scan", steps: [
    { source: "main", text: "手牌扫描 重组：获得数据；弃除手牌 重组；资源：数据+1、手牌-1" },
    { source: "quick", text: "放置数据：资源：信用点+1、手牌-1；收入：信用点+1" },
  ], accountingSnapshot: { players: [{ ...initial, resources: { credits: 1 }, income: { credits: 1 }, hand: [] }] } }];
  const result = flow.analyzeStructuredActionLog(entries, { initialPlayerStates: [initial] });
  const scan = result.events.find(e => e.sourceDetail.startsWith("手牌扫描"));
  assert.equal(scan.cards.find(c => c.change === "discard").key, scanCard.id, "real cardName must match the scan card, regardless of before-hand order");
  assert.equal(scan.cards.find(c => c.change === "discard").label, "重组");
  assert.deepEqual(result.events.filter(e => e.syntheticHandRemoval).flatMap(e => e.cards).map(c => c.key), [incomeCard.id], "unlabeled data-income does not fabricate a known card purpose");
  assert.equal(result.reconciliation.residualMagnitude, 0);

  const anonymized = { ...initial, hand: initial.hand.map(c => ({ id: c.id })) };
  const ambiguous = flow.analyzeStructuredActionLog(entries, { initialPlayerStates: [anonymized] });
  assert.deepEqual(ambiguous.events.filter(e => e.syntheticHandRemoval).flatMap(e => e.cards).map(c => c.key), [incomeCard.id, scanCard.id], "two unlabeled removals must not be assigned by hand order");
  assert.equal(ambiguous.events.find(e => e.sourceDetail.startsWith("手牌扫描")).cards[0].key, "重组", "retain the textual evidence when the instance is unknown");
  assert.equal(ambiguous.reconciliation.residualMagnitude, 0);

  const mismatched = flow.analyzeStructuredActionLog([{ ...entries[0], steps: [entries[0].steps[0]] }], { initialPlayerStates: [{ ...initial, hand: [incomeCard] }] });
  assert.equal(mismatched.events.find(e => e.sourceDetail.startsWith("手牌扫描")).cards[0].key, "重组", "one remaining card with a contradictory known name is not a valid fallback");
  assert.equal(mismatched.events.find(e => e.syntheticHandRemoval).cards[0].key, incomeCard.id);
}

// A completed card-for-resource exchange must remain a trade even when the
// enclosing main action is an alien card that spends the resource immediately.
for (const [label,key] of [['能量','energy'],['信用点','credits']]) {
  const initial={id:'p',resources:{[key]:0,handSize:3},income:{},hand:[{id:'a'},{id:'b'},{id:'target'}]};
  const result=flow.analyzeStructuredActionLog([{id:1,roundNumber:1,playerId:'p',actionType:'playCard',steps:[
    {source:'quick',text:'快速交易：2张牌 → 1'+label},
    {source:'main',text:'打出：半人马卡牌9：资源：'+label+'-1、手牌-1'},
  ],accountingSnapshot:{players:[{...initial,resources:{[key]:0,handSize:0},hand:[]}]}}],{initialPlayerStates:[initial]});
  const trade=result.events.find(e=>e.sourceDetail==='快速交易：2张牌 → 1'+label);
  assert.deepEqual(trade.resourceDeltas,{handSize:-2,[key]:1});
  assert.equal(trade.sourceCategory,'trade_conversion');
  assert.equal(result.players[0].nonIncomeGain[key],1);
  assert.equal(result.players[0].spent[key],1);
  assert.equal(result.players[0].spent.handSize,3);
  assert.equal(result.reconciliation.inferredMagnitude,0,'same-transaction use must not net away the exchange');
  assert.equal(result.reconciliation.residualMagnitude,0);
  const event=text=>flow.normalizeStructuredActionLog([{id:1,playerId:'p',steps:[{source:'quick',text}]}])[0];
  assert.deepEqual(event('快速交易：2张牌 → 1'+label+'；资源：手牌-2、'+label+'+1').resourceDeltas,{handSize:-2,[key]:1},'explicit deltas are not duplicated');
  for(const suffix of ['；失败','；请选择','；取消']) assert.deepEqual(event('快速交易：2张牌 → 1'+label+suffix).resourceDeltas,{},'uncompleted exchange is not a receipt');
  assert.deepEqual(event('快速交易：2张牌 → 精选1张牌').resourceDeltas,{},'selection remains outside deterministic exchange parser');
}

for (const actionLabel of ['分析数据','打出半人马卡牌9','宇宙大战略集团能力','研究科技','获得本轮收入']) {
  for (const text of ['快速交易：2张牌 → 1能量','快速交易：2张牌 → 1信用点','快速交易：2信用点 → 1能量','快速交易：2能量 → 1信用点']) {
    const [e]=flow.normalizeStructuredActionLog([{id:1,playerId:'p',actionType:'researchTech',actionLabel,steps:[{source:'quick',text}]}]);
    assert.equal(e.sourceCategory,'trade_conversion','completed exchange owns its source despite '+actionLabel);
  }
}
