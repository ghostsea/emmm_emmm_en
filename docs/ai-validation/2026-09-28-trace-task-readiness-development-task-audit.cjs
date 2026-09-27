const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('node:assert/strict'),d='tmp/ai-20260905/',p=process.argv[2]||'traceready';
const read=f=>JSON.parse(fs.readFileSync(f)),s=read(d+p+'-suite.json'),full=read(d+p+'-complete.json');
assert.equal(full.report.pairs.length,s.plannedPairs);
const effects=require(path.resolve(d,s.models.candidate.root,'randomizer/game/cards/effects'));
const types=new Set(['allAliensHaveTrace','allAliensHavePlayerTrace','singleAlienTraceSet','yichangdianAllTraceTypes','aomomoAllTraceTypes','aomomoFossilSpendingTrace']);
const affected=Object.fromEntries(Object.entries(effects.MODELS).map(([id,m])=>[id,(m.tasks||[]).filter(t=>types.has(t.condition?.type))]).filter(([,ts])=>ts.length));
const rows=[],allTasks=[],manifest=[],replays=[];
const hash=raw=>crypto.createHash('sha256').update(raw).digest('hex');
for(const [i,pair]of s.pairs.entries())for(const side of ['baseline','candidate']){
 const file=pair[side],raw=fs.readFileSync(d+file),run=JSON.parse(raw),r=run.result,logs=r.logs,events=r.resourceFlow.events;
 assert(run.summary.ok&&run.summary.gameEnded&&!run.summary.blocked&&!run.summary.bugCount);
 assert.equal(run.options.seed,pair.seed);assert.equal(run.options.alienSeed,pair.alienSeed);
 manifest.push({file,sha256:hash(raw)});
 if(side==='baseline'){
  const oldFile='scanindependent-base-'+(i+1)+'.json',old=read(d+oldFile);
  assert.equal(old.options.seed,pair.seed);assert.equal(old.options.alienSeed,pair.alienSeed);
  assert.deepEqual(run.summary.playerScores,old.summary.playerScores,'shared parser must not change policy scores');
  assert.equal(run.summary.steps,old.summary.steps,'shared parser must not change step count');
  replays.push({case:i+1,file,oldFile,scores:run.summary.playerScores,steps:run.summary.steps,oldSha256:hash(fs.readFileSync(d+oldFile))});
 }
 for(const ready of logs.filter(l=>l.type==='card-task-ready'&&Object.values(affected).flat().some(t=>t.id===l.details?.taskId))){
  const confirms=logs.filter(l=>l.type==='card-task'&&l.playerId===ready.playerId&&l.roundNumber===ready.roundNumber&&l.rawTurnNumber===ready.rawTurnNumber&&l.id>ready.id&&l.details?.cardLabel===ready.details.cardLabel);
  assert.equal(confirms.length,1,'unique actual completion for ready trace task');
  const c=confirms[0],payout=events.filter(e=>e.playerId===c.playerId&&e.roundNumber===c.roundNumber&&e.turnNumber===c.turnNumber&&e.sourceDetail==='完成任务：'+c.details.cardLabel);
  assert.equal(payout.length,1,'task confirmation appears in actual history');
  const subsequent=logs.filter(l=>l.type==='turn-action'&&l.playerId===c.playerId&&l.roundNumber===c.roundNumber&&l.id>c.id&&l.details?.action?.kind==='main'&&l.details.action.id!=='pass');
  allTasks.push({case:i+1,side,file,player:c.playerId,company:payout[0].industryId,taskId:ready.details.taskId,cardLabel:c.details.cardLabel,round:c.roundNumber,rawTurn:c.rawTurnNumber,readyLogId:ready.id,confirmLogId:c.id,historyEntry:payout[0].entryId,historyStep:payout[0].stepIndex,subsequentSameRoundMainActions:subsequent.length});
 }
 for(const play of logs.filter(l=>l.type==='play-card'&&affected[l.details?.selected?.cardId])){
  const selected=play.details.selected,decisions=logs.filter(l=>l.type==='turn-action'&&l.playerId===play.playerId&&l.roundNumber===play.roundNumber&&l.rawTurnNumber===play.rawTurnNumber&&l.id<play.id&&l.details?.action?.id==='playCard');
  if(!decisions.length)continue;
  const decision=decisions.at(-1);assert.equal(decision.details.action.cardInstanceId,selected.cardInstanceId);
  const payment=events.filter(e=>e.playerId===play.playerId&&e.roundNumber===play.roundNumber&&e.turnNumber===play.turnNumber&&e.cards?.some(c=>c.key===selected.cardInstanceId&&c.change==='play'));
  assert.equal(payment.length,1,'actual paid card instance');
  const tasks=allTasks.filter(t=>t.file===file&&t.player===play.playerId&&t.confirmLogId>play.id&&affected[selected.cardId].some(x=>x.id===t.taskId));
  const immediate=tasks.filter(t=>t.round===play.roundNumber&&t.rawTurn===play.rawTurnNumber),predicted=selected.valueBreakdown.readyTaskCashoutCount||0;
  if(predicted>0)assert(immediate.length>=predicted,'forecast immediate task must actually be completed in same turn');
  rows.push({case:i+1,side,file,player:play.playerId,company:payment[0].industryId,cardId:selected.cardId,cardInstance:selected.cardInstanceId,round:play.roundNumber,rawTurn:play.rawTurnNumber,decisionLogId:decision.id,playLogId:play.id,paymentEntry:payment[0].entryId,predictedImmediateCount:predicted,predictedImmediateValue:selected.valueBreakdown.readyTaskCashoutValue,actualImmediateTaskIds:immediate.map(t=>t.taskId),laterTasks:tasks.filter(t=>!immediate.includes(t)).map(t=>({taskId:t.taskId,round:t.round,rawTurn:t.rawTurn}))});
 }
}
const sum=(xs,f)=>xs.reduce((a,x)=>a+f(x),0),groups={};
for(const side of ['baseline','candidate']){
 groups[side]={};
 for(const company of ['all',...new Set([...rows,...allTasks].map(x=>x.company))]){
  const xs=rows.filter(x=>x.side===side&&(company==='all'||x.company===company)),ts=allTasks.filter(x=>x.side===side&&(company==='all'||x.company===company));
  groups[side][company]={paidPlays:xs.length,predictedImmediate:sum(xs,x=>x.predictedImmediateCount),actualImmediate:sum(xs,x=>x.actualImmediateTaskIds.length),later:sum(xs,x=>x.laterTasks.length),totalTraceTasksCompleted:ts.length,earlyTraceTasksCompleted:ts.filter(x=>x.round<=2).length,byCard:Object.fromEntries(Object.keys(affected).map(id=>[id,{paidPlays:xs.filter(x=>x.cardId===id).length,immediate:sum(xs.filter(x=>x.cardId===id),x=>x.actualImmediateTaskIds.length)}]))};
 }
}
const sourceDifferences=s.runtimeDifferences.map(file=>{const a=fs.readFileSync(d+s.models.base.root+'/'+file,'utf8'),b=fs.readFileSync(d+s.models.candidate.root+'/'+file,'utf8');return {file,onlyLineEndings:a.replace(/\r\n/g,'\n')===b.replace(/\r\n/g,'\n')};});
const report={scope:'Complete paired games only. Six catalog cards with affected trace tasks; top-level paid instances matched to same owner/round/raw-turn decision. Every predicted immediate task is required to complete in that same turn and have a real history completion. Later completion and same-round subsequent main action counts are descriptive, not proof that task resources causally funded those actions. Shared parser baseline replay requires all24 exact scores/steps, with new corrected ledgers. Special trace types with no catalog card remain unit/API coverage only.',models:Object.fromEntries(Object.entries(s.models).map(([k,m])=>[k,m.commit])),pairs:s.pairs.length,affected,groups,rows,allTasks,baselineReplay:replays,sourceDifferences,manifest};
fs.writeFileSync(d+p+'-trace-task-realization.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({groups,sourceDifferences},null,2));
