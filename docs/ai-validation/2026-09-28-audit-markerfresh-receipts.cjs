const fs=require('fs'),assert=require('node:assert/strict'),crypto=require('crypto'),d='tmp/ai-20260905/',p='markerabsolute64';
const s=JSON.parse(fs.readFileSync(d+p+'-suite.json')),q=JSON.parse(fs.readFileSync(d+p+'-queue-complete.json'));assert.equal(q.completed.length,128);assert.equal(q.failures.length,0);assert.equal(q.pending.length,0);
const {repairNamedPickupAttribution}=require('../../tools/repair_ai_named_pickup_attribution');
const rows=[],inputs=[];
for(const side of ['baseline','candidate'])for(const[i,pair]of s.pairs.entries()){
 const bytes=fs.readFileSync(d+pair[side]),run=JSON.parse(bytes),fixed=repairNamedPickupAttribution(run),r={...run.result,resourceFlow:fixed.resourceFlow};assert(run.summary.ok&&run.summary.gameEnded&&!run.summary.bugCount&&!run.summary.blocked);inputs.push({side,case:i+1,file:pair[side],sha256:crypto.createHash('sha256').update(bytes).digest('hex'),namedPickupAttributionCorrections:fixed.changes});const used=new Set();
 for(const[li,l]of r.logs.entries()){
  const chosen=l.details?.selected;if(l.type!=='play-card'||chosen?.cardId!=='b_13.webp')continue;
  const next=r.logs.findIndex((x,j)=>j>li&&x.playerId===l.playerId&&['turn-action','play-card'].includes(x.type)),logs=r.logs.slice(li+1,next<0?undefined:next).filter(x=>x.playerId===l.playerId);
  const payments=r.resourceFlow.events.filter(e=>e.playerId===l.playerId&&e.roundNumber===l.roundNumber&&e.turnNumber===l.turnNumber&&!used.has(e.entryId+':'+e.stepIndex)&&e.cards?.some(c=>c.key===chosen.cardInstanceId&&c.change==='play'));assert.equal(payments.length,1);const payment=payments[0];used.add(payment.entryId+':'+payment.stepIndex);
  const transaction=r.resourceFlow.events.filter(e=>e.playerId===l.playerId&&e.entryId===payment.entryId&&e.stepIndex>=payment.stepIndex);
  const find=prefix=>{const xs=transaction.filter(e=>e.sourceDetail.startsWith(prefix));assert.equal(xs.length,1,prefix+' unique receipt');return xs[0];};
  const marker=find('移除己方环绕器：'),score=find('移除环绕器：3分：'),data=find('移除环绕器：1数据：'),pick=find('移除环绕器：精选1张牌：');
  assert.equal(score.resourceDeltas.score,3);
  const availableBeforeData=(l.playerResources.availableData||0)+transaction.filter(e=>e.stepIndex<data.stepIndex).reduce((n,e)=>n+(e.resourceDeltas.availableData||0),0);const dataMatch=data.sourceDetail.match(/获得\s+(\d+)\/(\d+)\s*个数据/);assert(dataMatch,'explicit actual data receipt');assert.equal(Number(dataMatch[2]),1);const actualData=Number(dataMatch[1]);assert.equal(actualData,Math.min(1,Math.max(0,6-availableBeforeData)));
  const previews=chosen.valueBreakdown?.markerRemovalPreviews;assert(previews?.length,'paid decision includes sacrifice estimate');
  const decisions=logs.filter(x=>x.type==='rare-scan-target'&&x.details.markerRemovalPreviews);assert(decisions.length<=1);
  const actualPreviews=decisions[0]?.details.markerRemovalPreviews||previews;assert(actualPreviews.length);if(!decisions.length)assert.equal(previews.length,1,'single marker auto resolution');
  const selected=actualPreviews[0];if(decisions.length)assert.equal(decisions[0].details.choiceId,selected.choice.id);assert(marker.sourceDetail.includes(selected.choice.label),'committed marker matches selected target');
  assert(actualPreviews.every(x=>x.cost>=selected.cost),'minimum loss chosen');assert.equal(selected.cost,selected.scoreLoss+selected.readyTaskLoss);
  const picks=logs.filter(x=>x.type==='pick-card'&&x.details.pendingType==='planet_reward_pick_card');assert.equal(picks.length,1,'one picked card');const target=picks[0].details.card;assert(target?.id);assert.equal(pick.resourceDeltas.handSize,1);assert(pick.cards.some(c=>c.key===target.id&&c.change==='gain'),'exact picked card gained');
  rows.push({side,case:i+1,player:l.playerId,company:r.playerResults.find(x=>x.playerId===l.playerId)?.companyLabel,round:l.roundNumber,turn:l.turnNumber,instance:chosen.cardInstanceId,entry:payment.entryId,preview:previews,actualPreview:selected,marker:marker.sourceDetail,payment:payment.resourceDeltas,score:score.resourceDeltas,actualData,dataReceipt:data.sourceDetail,oldParsedData:data.resourceDeltas,picked:target.id,pick:pick.resourceDeltas});
 }
}
const summary={pairs:64,inputs:128,plays:rows.length,baselinePlays:rows.filter(x=>x.side==='baseline').length,candidatePlays:rows.filter(x=>x.side==='candidate').length,issues:[]};
fs.writeFileSync(d+p+'-exact-receipts.json',JSON.stringify({scope:'All64 fresh pairs: unique paid b13 instance, committed marker label, actual selection minimum cost, direct3 score, data capacity and exact physical picked card. Current score-loss correctness separately checked by browser fixtures; future lost-task value is heuristic, not an observed score. No occurrences is not proof of autonomous strength.',summary,inputs,rows},null,2)+'\n');console.log(summary);
