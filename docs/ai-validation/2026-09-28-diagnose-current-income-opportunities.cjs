const fs=require('fs'),crypto=require('crypto'),assert=require('node:assert/strict'),d='tmp/ai-20260905/',out='docs/ai-validation/2026-09-28-current-income-opportunities';
const suite=JSON.parse(fs.readFileSync(d+'bluelifecycle-suite.json')),inputs=[],opportunities=[],incomeEvents=[],plays=[];
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
for(const [i,pair] of suite.pairs.entries()){
 const b=fs.readFileSync(d+pair.baseline),r=JSON.parse(b);assert(r.summary.ok&&r.summary.gameEnded&&!r.summary.bugCount&&!r.summary.blocked);assert.equal(r.options.seed,pair.seed);
 inputs.push({case:i+1,file:pair.baseline,sha256:hash(b)});
 for(const p of r.result.playerResults){
  const logs=r.result.logs.filter(x=>x.playerId===p.playerId),events=r.result.resourceFlow.events.filter(x=>x.playerId===p.playerId),seen=new Map();
  const context={case:i+1,playerId:p.playerId,company:p.companyLabel,finalScore:p.finalScore};
  for(const e of events)if(Object.values(e.incomeDeltas||{}).some(x=>x>0))incomeEvents.push({...context,entry:e.entryId,step:e.stepIndex,round:e.roundNumber,pace:e.pace,main:e.mainActionType,source:e.sourceCategory,isDataPlacement:Boolean(e.isDataPlacement),text:e.sourceDetail,gain:e.incomeDeltas,cards:e.cards});
  for(const l of logs.filter(x=>x.type==='play-card')){const s=l.details.selected;plays.push({...context,round:l.roundNumber,log:l.id,card:s.cardId,instance:s.cardInstanceId,label:s.cardLabel,effects:s.effectTypes,score:s.score});}
  for(const l of logs.filter(x=>x.type==='turn-action')){
   const group=(l.details.candidates||[]).find(x=>x.id==='playCard');
   for(const c of group?.playableCards||[]){
    if(!(c.effectTypes||[]).some(x=>/income/.test(x)))continue;
    assert(c.cardInstanceId);
    if(!seen.has(c.cardInstanceId))seen.set(c.cardInstanceId,{...context,instance:c.cardInstanceId,card:c.cardId,label:c.cardLabel,effects:c.effectTypes,observations:[]});
    seen.get(c.cardInstanceId).observations.push({round:l.roundNumber,turn:l.turnNumber,log:l.id,resources:l.playerResources,price:c.price,score:c.score,breakdown:c.valueBreakdown,chosenAction:l.details.action.id,chosenCard:l.details.action.cardInstanceId||null,chosenMain:l.details.action.kind==='main',playGroupSelectedCard:group.cardInstanceId,playGroupScore:group.score,chosenScore:l.details.action.score});
   }
  }
  for(const o of seen.values()){
   o.actualPlays=plays.filter(x=>x.case===i+1&&x.playerId===p.playerId&&x.instance===o.instance);
   o.cardEvents=events.flatMap(e=>(e.cards||[]).filter(c=>c.key===o.instance).map(c=>({entry:e.entryId,step:e.stepIndex,round:e.roundNumber,pace:e.pace,source:e.sourceCategory,change:c.change,text:e.sourceDetail})));
   o.finalInHand=(p.handCards||[]).some(c=>c.id===o.instance);
   o.firstRound=o.observations[0].round;o.bestScore=Math.max(...o.observations.map(x=>x.score));
   opportunities.push(o);
  }
 }
}
assert.equal(inputs.length,24);
const groups={};
for(const company of [...new Set(opportunities.map(x=>x.company))]){
 const os=opportunities.filter(x=>x.company===company),inc=incomeEvents.filter(x=>x.company===company);
 groups[company]={seats:company==='作弊实验室'?48:24,dataPlacementIncomeEvents:inc.filter(x=>x.isDataPlacement).length,cardLabeledIncomeThatIsDataPlacement:inc.filter(x=>x.source==="card"&&x.isDataPlacement).length,uniqueIncomeNamedEffectCardsObserved:os.length,played:os.filter(x=>x.actualPlays.length).length,firstObservedByRound:Object.fromEntries([1,2,3,4].map(n=>[n,os.filter(x=>x.firstRound===n).length])),positiveAtLeastOnce:os.filter(x=>x.bestScore>0).length,positiveNeverPlayed:os.filter(x=>x.bestScore>0&&!x.actualPlays.length).length,finalInHand:os.filter(x=>x.finalInHand).length,byCard:Object.fromEntries([...new Set(os.map(x=>x.card))].map(card=>{const xs=os.filter(x=>x.card===card);return [card,{label:xs[0].label,effects:xs[0].effects,instances:xs.length,played:xs.filter(x=>x.actualPlays.length).length,positive:xs.filter(x=>x.bestScore>0).length,meanBestScore:xs.reduce((a,x)=>a+x.bestScore,0)/xs.length}];})),incomeEventsBySource:Object.fromEntries([...new Set(inc.map(x=>x.source))].map(source=>{const xs=inc.filter(x=>x.source===source);return [source,{events:xs.length,gain:Object.fromEntries([...new Set(xs.flatMap(x=>Object.keys(x.gain)))].map(k=>[k,xs.reduce((a,x)=>a+(x.gain[k]||0),0)]))}];}))};
}
const output={scope:'All24 current-policy parser26 fixed baseline games, no fresh holdout outcomes. Only legal playable-card candidates with an effect type containing income are observed; this includes immediate-only icon effects and excludes triggered income without a playQueue income effect. It is not an exhaustive income-card catalog. Deduplicate by game/player/physical card instance. A positive card score need not beat another action; chosen action and all visible observations are retained. Actual income-track increases counted independently from events and never inferred from effect names. No future income/score counterfactual is claimed.',inputs,groups,opportunities,incomeEvents,plays};
fs.writeFileSync(out+'.json',JSON.stringify(output,null,2)+'\n');console.log(JSON.stringify(groups,null,2));
