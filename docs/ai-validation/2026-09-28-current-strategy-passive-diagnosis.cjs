const fs=require('fs'),assert=require('node:assert/strict'),d='tmp/ai-20260905/';
const s=JSON.parse(fs.readFileSync(d+'probeabsolute64-suite.json'));
const plays=[],receipts=[],penalties=[],industry=[];
for(const[i,pair]of s.pairs.entries()){
 const run=JSON.parse(fs.readFileSync(d+pair.candidate));assert(run.summary.ok&&run.summary.gameEnded&&!run.summary.bugCount);
 const r=run.result, ids=new Set(r.playerResults.filter(p=>p.companyLabel==='宇宙大战略集团').map(p=>p.playerId));assert.equal(ids.size,1);
 const rewards=r.resourceFlow.events.filter(e=>ids.has(e.playerId)&&/宇宙战略集团：(?:黄色|红色|蓝色)奖励槽/.test(e.sourceDetail||''));
 receipts.push(...rewards.map(e=>({case:i+1,player:e.playerId,round:e.roundNumber,turn:e.turnNumber,entry:e.entryId,step:e.stepIndex,text:e.sourceDetail,gain:e.resourceDeltas})));
 for(const l of r.logs.filter(l=>ids.has(l.playerId))){
  if(l.type==='play-card'){
   const a=l.details.selected,payment=r.resourceFlow.events.find(e=>e.playerId===l.playerId&&e.roundNumber===l.roundNumber&&e.turnNumber===l.turnNumber&&e.cards?.some(c=>c.key===a.cardInstanceId&&c.change==='play'));assert(payment);
   const reward=rewards.filter(e=>e.entryId===payment.entryId&&e.stepIndex>payment.stepIndex);
   plays.push({case:i+1,player:l.playerId,round:l.roundNumber,turn:l.turnNumber,card:a.cardId,instance:a.cardInstanceId,passiveValue:a.valueBreakdown?.strategyPassivePlayValue||0,penalty:a.valueBreakdown?.grandStrategyCreditBottleneckPenalty||0,resources:l.playerResources,rewards:reward.map(e=>({entry:e.entryId,step:e.stepIndex,text:e.sourceDetail,gain:e.resourceDeltas}))});
  }
  if(l.type==='turn-action'){
   for(const a of l.details.candidates||[])if(a.valueBreakdown?.grandStrategyCreditBottleneckPenalty>0)penalties.push({case:i+1,round:l.roundNumber,turn:l.turnNumber,card:a.cardId,score:a.score,penalty:a.valueBreakdown.grandStrategyCreditBottleneckPenalty,chosen:l.details.action.id,resources:l.playerResources});
   if(l.details.action.id==='industry')industry.push({case:i+1,round:l.roundNumber,turn:l.turnNumber,action:l.details.action,resources:l.playerResources});
  }
 }
}
const keys=plays.flatMap(p=>p.rewards.map(r=>[p.case,p.player,r.entry,r.step].join(':')));assert.equal(new Set(keys).size,keys.length);assert.equal(keys.length,receipts.length);
for(const r of receipts)assert(keys.includes([r.case,r.player,r.entry,r.step].join(':')));
const bySlot=Object.fromEntries(['黄色','红色','蓝色'].map((label,i)=>{const rows=receipts.filter(r=>r.text.includes(label+'奖励槽')),resource=['credits','publicity','availableData'][i];return[label,{receipts:rows.length,zeroResourceGain:rows.filter(r=>!Object.values(r.gain).some(n=>Number(n)>0)).length,oneResourceReceipts:rows.filter(r=>r.gain[resource]===1).length}]}));
const summary={games:64,plays:plays.length,positivePassivePreview:plays.filter(p=>p.passiveValue>0).length,positivePreviewWithoutReceipt:plays.filter(p=>p.passiveValue>0&&!p.rewards.length).length,receipts:receipts.length,bySlot,recordedPenaltyCandidates:penalties.length,selectedPenalizedPlays:plays.filter(p=>p.penalty>0).length,industryUses:industry.length};
const out={scope:'All64 completed current-default probe candidate games. Selected plays joined to exact payment and subsequent same-transaction company receipts; only candidates retained in logs are audited for historical credit bottleneck penalties. Seen seeds are now diagnostic data, not future holdout.',summary,plays,receipts,penalties,industry};
fs.writeFileSync(d+'current-strategy-passive-diagnosis.json',JSON.stringify(out,null,2)+'\n');console.log(JSON.stringify({summary,missing:plays.filter(p=>p.passiveValue>0&&!p.rewards.length).slice(0,8),zero:receipts.filter(r=>!Object.values(r.gain).some(n=>Number(n)>0)).slice(0,8),penalties:penalties.slice(0,4)},null,2));
