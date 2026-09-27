const fs=require('fs'),assert=require('node:assert/strict'),crypto=require('crypto'),d='tmp/ai-20260905/',p='readyanalyze';
const s=JSON.parse(fs.readFileSync(d+p+'-suite.json')),full=JSON.parse(fs.readFileSync(d+p+'-complete.json'));
assert.equal(full.report.pairs.length,s.pairs.length);
const rows=[],manifest=[];
for(const [i,pair]of s.pairs.entries())for(const side of ['baseline','candidate']){
 const raw=fs.readFileSync(d+pair[side]),run=JSON.parse(raw),r=run.result;
 assert(run.summary.ok&&run.summary.gameEnded&&!run.summary.blocked&&!run.summary.bugCount);
 assert.equal(run.options.seed,pair.seed);assert.equal(run.options.alienSeed,pair.alienSeed);
 manifest.push({file:pair[side],side,sha256:crypto.createHash('sha256').update(raw).digest('hex')});
 const key=x=>[x.playerId,x.roundNumber,x.turnNumber].join('|');
 const decisions=new Map(),entries=new Map(),analysisByLog=new Map();
 for(const l of r.logs)if(l.type==='turn-action'&&l.details?.action?.id==='analyze'){const k=key(l);if(!decisions.has(k))decisions.set(k,[]);decisions.get(k).push(l);}
 for(const e of r.resourceFlow.events)if(e.mainActionType==='analyze'&&e.pace==='main'&&e.sourceCategory==='analysis'&&e.resourceDeltas.energy===-1){const k=key(e);if(!entries.has(k))entries.set(k,[]);assert(!entries.get(k).some(v=>v.entryId===e.entryId),'duplicate analysis payment');entries.get(k).push(e);}
 assert.deepEqual([...decisions.keys()].sort(),[...entries.keys()].sort(),'analysis decision/payment groups');
 for(const [k,ls]of decisions){const es=entries.get(k);assert.equal(ls.length,es.length,'analysis decisions/payment count '+k);ls.forEach((l,n)=>analysisByLog.set(l.id,es[n]));}
 for(const [li,l]of r.logs.entries()){
  const a=l.details?.action,b=a?.valueBreakdown;
  if(l.type!=='turn-action'||!b?.resourceLockMainUnlockTrade||b.unlockedMainAction?.actionId!=='analyze')continue;
  const next=r.logs.slice(li+1).filter(x=>x.playerId===l.playerId&&x.roundNumber===l.roundNumber&&x.rawTurnNumber===l.rawTurnNumber);
  const nextMain=next.find(x=>x.type==='turn-action'&&x.details?.action?.kind==='main');
  const matched=nextMain?.details.action.id==='analyze'?analysisByLog.get(nextMain.id):null;
  const events=matched?[matched]:[];
  const payment=events.reduce((v,e)=>v+Math.max(0,-(e.resourceDeltas.energy||0)),0);
  const ready=Boolean(b.readyAnalyzeTradeUnlock),old=Boolean(b.grandStrategyRoundOneAnalyzeUnlock);
  if(ready){assert.equal(a.tradeId,'cards-for-energy');assert.equal(b.handSize,2);assert.equal(b.handAfterTrade,0);assert(b.unlockedMainAction.score>=28);assert(b.discardCost<=6);}
  rows.push({case:i+1,side,file:pair[side],log:l.id,company:r.resourceFlow.players.find(x=>x.playerId===l.playerId)?.industryId,round:l.roundNumber,turn:l.turnNumber,rawTurn:l.rawTurnNumber,analysisDecisionLog:nextMain?.id||null,analysisEntryId:matched?.entryId||null,resources:l.playerResources,trade:a.tradeId,readyAnalyzeTradeUnlock:ready,legacyGrandWindow:old,discardCost:b.discardCost,predictedAnalysisValue:b.unlockedMainAction.score,nextMain:nextMain?.details.action.id||null,actualAnalysis:events.length>0,analysisEnergySpent:payment});
 }
}
const summary=Object.fromEntries(['baseline','candidate'].map(side=>{const rs=rows.filter(x=>x.side===side);return [side,{plans:rs.length,readyOrLegacyPlans:rs.filter(x=>x.readyAnalyzeTradeUnlock||x.legacyGrandWindow).length,actualAnalysis:rs.filter(x=>x.actualAnalysis).length,paidOneEnergy:rs.filter(x=>x.analysisEnergySpent===1).length,byCompany:Object.fromEntries([...new Set(rs.map(x=>x.company))].map(c=>[c,rs.filter(x=>x.company===c).length])),unrealized:rs.filter(x=>!x.actualAnalysis)}];}));
fs.writeFileSync(d+p+'-analysis-followup.json',JSON.stringify({scope:'Complete both-policy analysis-unlock decisions and same-player/round/raw-turn next main analysis. Payment entries pair one-to-one with all analysis decisions by display group and ordinal; counts and unique entries are asserted. New ready-window conditions are checked; a different next action is recorded rather than automatically called a bug. Counts are descriptive, not causal attribution or guaranteed full score gain.',summary,rows,manifest},null,2)+'\n');console.log(JSON.stringify(summary,null,2));
