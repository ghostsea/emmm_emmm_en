const fs=require('fs'),assert=require('node:assert/strict'),crypto=require('crypto'),d='tmp/ai-20260905/',prefix=process.argv[2]||'aliencount';
const suite=JSON.parse(fs.readFileSync(d+prefix+'-suite.json')),complete=JSON.parse(fs.readFileSync(d+prefix+'-complete.json')),flow=require('../../randomizer/game/ai/resource-flow');
assert.equal(complete.report.pairs.length,suite.plannedPairs);
const rows=[],manifest=[];
for(const [index,pair]of suite.pairs.entries())for(const side of ['baseline','candidate']){
 const raw=fs.readFileSync(d+pair[side]),run=JSON.parse(raw),r=run.result;assert(run.summary.ok&&run.summary.gameEnded&&!run.summary.bugCount&&!run.summary.blocked);assert.equal(run.options.seed,pair.seed);assert.equal(run.options.alienSeed,pair.alienSeed);
 manifest.push({file:pair[side],sha256:crypto.createHash('sha256').update(raw).digest('hex')});
 const events=r.resourceFlow.events.filter(e=>/^每个外星人[:：].*个外星人/.test(e.sourceDetail));
 const confirmations=r.logs.filter(l=>l.type==='card-task'&&l.details?.effectTypes?.includes('card_count_aliens_resource'));
 assert.equal(events.length,confirmations.length,'all task payouts accounted');
 for(const event of events){
  const logs=confirmations.filter(l=>l.playerId===event.playerId&&l.roundNumber===event.roundNumber&&l.turnNumber===event.turnNumber);assert.equal(logs.length,1,'unique same owner/round/turn task');const log=logs[0];assert.equal(log.details.logPlayerId,event.playerId);
  const count=Number(event.sourceDetail.match(/[:：]\s*(\d+)\s*个外星人[，,]/)?.[1]);assert(Number.isInteger(count));
  const parsed=flow.parseDeltaText(event.sourceDetail).resourceDeltas;assert.equal(parsed.score,count*2);assert.equal(parsed.energy,count);
  const ready=r.logs.filter(l=>l.type==='card-task-ready'&&l.playerId===log.playerId&&l.rawTurnNumber===log.rawTurnNumber&&l.roundNumber===log.roundNumber&&l.id<log.id&&l.details?.taskId==='b46-all-pink-task').at(-1);assert(ready);
  rows.push({case:index+1,side,file:pair[side],owner:event.playerId,company:event.industryId,round:event.roundNumber,turn:event.turnNumber,rawTurn:log.rawTurnNumber,entry:event.entryId,step:event.stepIndex,taskValue:ready.details.score,alienCount:count,source:event.sourceDetail,reportedOldResourceDeltas:event.resourceDeltas,correctedTextResourceDeltas:parsed});
 }
}
const report={scope:'Complete fixed games; each b46 task confirmation uniquely matches same owner/round/display-turn payout and actual normalized log amount. Frozen reward valuation sources untouched. New shared parser is applied separately to original text, not rewriting old aggregate buckets or inferring complete corrected AI ledgers without snapshots. Runtime4score2energy verified independently in controlled browser. No causal score/resource conversion claim.',pairs:suite.plannedPairs,models:Object.fromEntries(Object.entries(suite.models).map(([k,m])=>[k,m.commit])),parserSha256:crypto.createHash('sha256').update(fs.readFileSync('randomizer/game/ai/resource-flow.js')).digest('hex'),counts:Object.fromEntries(['baseline','candidate'].map(side=>[side,rows.filter(x=>x.side===side).length])),rows,manifest};
fs.writeFileSync(d+prefix+'-reward-payouts.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({counts:report.counts,rows},null,2));
