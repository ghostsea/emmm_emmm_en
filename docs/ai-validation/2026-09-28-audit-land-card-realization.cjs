const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('node:assert/strict');
const d='tmp/ai-20260905/',prefix=process.argv[2]||'creditunlock';
const suite=JSON.parse(fs.readFileSync(d+prefix+'-suite.json'));
const complete=JSON.parse(fs.readFileSync(d+prefix+'-complete.json'));
assert.equal(complete.report.pairs.length,suite.pairs.length,'complete suite required');
const flow=require(path.resolve(d,suite.models.base.root,'randomizer/game/ai/resource-flow'));
const keys=['credits','energy','handSize','availableData','publicity'],rows=[],manifest=[];
for(const [caseIndex,pair]of suite.pairs.entries())for(const side of ['baseline','candidate']){
 const raw=fs.readFileSync(d+pair[side]),run=JSON.parse(raw),r=run.result;
 assert(run.summary.ok&&run.summary.gameEnded&&!run.summary.bugCount&&!run.summary.blocked);
 assert.equal(run.options.seed,pair.seed);assert.equal(run.options.alienSeed,pair.alienSeed);
 manifest.push({side,file:pair[side],sha256:crypto.createHash('sha256').update(raw).digest('hex')});
 for(const log of r.logs){
  const selected=log.details?.selected;
  if(log.type!=='play-card'||!selected?.effectTypes?.includes('card_land'))continue;
  const payment=r.resourceFlow.events.filter(e=>e.playerId===log.playerId&&e.roundNumber===log.roundNumber&&e.turnNumber===log.turnNumber&&e.cards?.some(c=>c.key===selected.cardInstanceId&&c.change==='play'));
  assert.equal(payment.length,1,'unique actual payment event');
  const entry=payment[0].entryId;
  const events=r.resourceFlow.events.filter(e=>e.entryId===entry&&e.playerId===log.playerId&&e.pace==='main');
  const sums=flow.summarizeResourceEvents(events).players[0];
  assert(sums,'main transaction resource summary');
  assert(Number.isFinite(log.rawTurnNumber),'land card real turn required');
  const sameTurn=x=>x.playerId===log.playerId&&x.roundNumber===log.roundNumber&&x.turnNumber===log.turnNumber&&x.rawTurnNumber===log.rawTurnNumber;
  const picks=r.logs.filter(x=>sameTurn(x)&&x.type==='land-target');
  const incomeChoices=r.logs.filter(x=>sameTurn(x)&&x.type==='discard'&&x.details?.pendingType==='planet_reward_income');
  rows.push({case:caseIndex+1,side,file:pair[side],player:log.playerId,company:r.resourceFlow.players.find(x=>x.playerId===log.playerId)?.industryId,entry,round:log.roundNumber,turn:log.turnNumber,rawTurn:log.rawTurnNumber,cardId:selected.cardId,cardInstance:selected.cardInstanceId,predictedDirectScore:selected.directScoreGain,
   selectedLandTargets:picks.map(x=>x.details.selected),landingMessages:events.filter(e=>/登陆 .*移除火箭/.test(e.sourceDetail)).map(e=>e.sourceDetail),incomeChoices:incomeChoices.length,
   ...Object.fromEntries(['incomeGain','nonIncomeGain','spent'].map(b=>[b,Object.fromEntries(keys.map(k=>[k,sums[b]?.[k]||0]))]))});
 }
}
const sum=(rs,f)=>rs.reduce((v,x)=>v+f(x),0),groups={};
for(const side of ['baseline','candidate']){const rs=rows.filter(x=>x.side===side);groups[side]={};for(const company of ['all',...new Set(rows.map(x=>x.company))]){const xs=company==='all'?rs:rs.filter(x=>x.company===company);groups[side][company]={plays:xs.length,earlyPlays:xs.filter(x=>x.round<=2).length,incomeChoices:sum(xs,x=>x.incomeChoices),cards:Object.fromEntries([...new Set(xs.map(x=>x.cardId))].map(c=>[c,xs.filter(x=>x.cardId===c).length])),...Object.fromEntries(['incomeGain','nonIncomeGain','spent'].map(b=>[b,Object.fromEntries(keys.map(k=>[k,sum(xs,x=>x[b][k])]))]))};}}
const report={scope:'All explicitly logged card_land plays in both complete paired policies. Every selected instance uniquely matches actual payment. Resource totals cover main-paced steps of that paid card transaction, including embedded immediate income; exclude separate quick actions, setup and later income payouts. Planet income selections use same-player recorded round/display-turn/raw-turn and are descriptive. This is action-chain accounting, not pure printed-card marginal reward or causality. Unknown/unplayed hand cards and alien-specific non-card_land effects are not inferred. Predicted direct scores are retained for diagnosis only; old frozen parsers can misread numeric score labels, so no actual score-return comparison is made. No partial holdout data.',models:Object.fromEntries(Object.entries(suite.models).map(([k,m])=>[k,m.commit])),pairs:suite.pairs.length,groups,rows,manifest};
fs.writeFileSync(d+prefix+'-land-card-realization.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(groups,null,2));
