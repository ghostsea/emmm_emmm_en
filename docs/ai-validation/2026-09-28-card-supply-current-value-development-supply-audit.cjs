const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('node:assert/strict');
const d='tmp/ai-20260905/',prefix=process.argv[2]||'cardsupply';
const suite=JSON.parse(fs.readFileSync(d+prefix+'-suite.json'));
assert.equal(JSON.parse(fs.readFileSync(d+prefix+'-complete.json')).report.pairs.length,suite.pairs.length);
const flow=require(path.resolve(d,suite.models.base.root,'randomizer/game/ai/resource-flow'));
const affected=['draw_cards','pick_card','card_scan_nebula','card_any_sector_scan'];
const keys=['credits','energy','handSize','availableData','publicity'],rows=[],manifest=[];
for(const [caseIndex,pair]of suite.pairs.entries())for(const side of ['baseline','candidate']){
 const raw=fs.readFileSync(d+pair[side]),run=JSON.parse(raw),r=run.result;
 assert(run.summary.ok&&run.summary.gameEnded&&!run.summary.bugCount&&!run.summary.blocked);
 assert.equal(run.options.seed,pair.seed);assert.equal(run.options.alienSeed,pair.alienSeed);
 manifest.push({side,file:pair[side],sha256:crypto.createHash('sha256').update(raw).digest('hex')});
 const all=r.resourceFlow.events;
 for(const log of r.logs){
  const selected=log.details?.selected;
  if(log.type!=='play-card'||!selected?.effectTypes?.some(t=>affected.includes(t)))continue;
  assert(Number.isFinite(log.rawTurnNumber));
  const decisions=r.logs.filter(l=>l.type==='turn-action'&&l.playerId===log.playerId&&l.roundNumber===log.roundNumber&&l.rawTurnNumber===log.rawTurnNumber&&l.id<log.id&&l.details?.action?.id==='playCard');
  // Embedded plays have no own top-level paid playCard decision and are outside this audit.
  if(!decisions.length)continue;
  const decision=decisions.at(-1);
  assert.equal(decision.details.action.cardInstanceId,selected.cardInstanceId,'top-level intended instance');
  const payment=all.filter(e=>e.playerId===log.playerId&&e.roundNumber===log.roundNumber&&e.turnNumber===log.turnNumber&&e.cards?.some(c=>c.key===selected.cardInstanceId&&c.change==='play'));
  assert.equal(payment.length,1,'unique actual payment');
  const pay=payment[0],payIndex=all.indexOf(pay),events=all.filter((e,i)=>i>=payIndex&&e.entryId===pay.entryId&&e.playerId===log.playerId&&e.pace==='main');
  const sums=flow.summarizeResourceEvents(events).players[0];assert(sums);
  const gains=events.flatMap(e=>e.cards.filter(c=>c.change==='gain').map(c=>({event:e,card:c})));
  const followups=gains.map(({event,card})=>{
   const changes=all.slice(all.indexOf(event)+1).filter(e=>e.playerId===log.playerId).flatMap(e=>e.cards.filter(c=>c.key===card.key&&c.change!=='gain').map(c=>({change:c.change,entry:e.entryId,round:e.roundNumber,turn:e.turnNumber,source:e.sourceDetail})));
   return {key:card.key,label:card.label,origin:card.origin,gainEntry:event.entryId,gainStep:event.stepIndex,firstRecordedUse:changes[0]||null,changes};
  });
  rows.push({case:caseIndex+1,side,file:pair[side],player:log.playerId,company:r.resourceFlow.players.find(x=>x.playerId===log.playerId)?.industryId,entry:pay.entryId,round:log.roundNumber,turn:log.turnNumber,rawTurn:log.rawTurnNumber,decisionId:decision.id,cardId:selected.cardId,cardInstance:selected.cardInstanceId,effectTypes:selected.effectTypes,knownGains:followups,
   ...Object.fromEntries(['incomeGain','nonIncomeGain','spent'].map(b=>[b,Object.fromEntries(keys.map(k=>[k,sums[b]?.[k]||0]))]))});
 }
}
const sum=(xs,f)=>xs.reduce((s,x)=>s+f(x),0),groups={};
for(const side of ['baseline','candidate']){groups[side]={};for(const company of ['all',...new Set(rows.map(x=>x.company))]){
 const xs=rows.filter(x=>x.side===side&&(company==='all'||x.company===company)),gains=xs.flatMap(x=>x.knownGains);
 const uses=Object.fromEntries([...new Set(gains.map(x=>x.firstRecordedUse?.change||'no_recorded_use'))].map(k=>[k,gains.filter(x=>(x.firstRecordedUse?.change||'no_recorded_use')===k).length]));
 groups[side][company]={plays:xs.length,earlyPlays:xs.filter(x=>x.round<=2).length,uniquePaidEntries:new Set(xs.map(x=>x.file+':'+x.entry+':'+x.player)).size,cards:Object.fromEntries([...new Set(xs.map(x=>x.cardId))].map(c=>[c,xs.filter(x=>x.cardId===c).length])),knownGainedInstances:gains.length,firstRecordedUses:uses,
 ...Object.fromEntries(['incomeGain','nonIncomeGain','spent'].map(b=>[b,Object.fromEntries(keys.map(k=>[k,sum(xs,x=>x[b][k])]))]))};
 assert.equal(groups[side][company].uniquePaidEntries,xs.length,'no duplicate attributed transactions');
}}
const report={scope:'Complete paired games only. Top-level paid plays with ordinary draw/pick or missing scan-class effects, matched by player/round/raw turn and actual instance payment. Resource totals cover main-paced steps after payment within that entry, including other effects, company/task rewards and embedded income. Separate quick actions excluded. Known card instances tracked to first recorded subsequent use; unknown_removal and no_recorded_use are explicitly unresolved, not assumed wasted or ending hand. Card reuse may have later changes. Data/score causality is not attributed to a particular printed effect. All totals are descriptive transaction accounting, not marginal return or causal mechanism proof.',models:Object.fromEntries(Object.entries(suite.models).map(([k,m])=>[k,m.commit])),pairs:suite.pairs.length,groups,rows,manifest};
fs.writeFileSync(d+prefix+'-supply-card-realization.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(groups,null,2));
