const fs=require('fs'),assert=require('node:assert/strict'),crypto=require('crypto'),d='tmp/ai-20260905/',p='cornerabsolute64';
const suite=JSON.parse(fs.readFileSync(d+p+'-suite.json')),q=JSON.parse(fs.readFileSync(d+p+'-queue-complete.json'));assert.equal(q.completed.length,128);assert.equal(q.failures.length,0);
const {repairNamedPickupAttribution}=require('../../tools/repair_ai_named_pickup_attribution');
const rows=[],inputs=[];
for(const side of ['baseline','candidate'])for(const [i,pair]of suite.pairs.entries()){
 const bytes=fs.readFileSync(d+pair[side]),run=JSON.parse(bytes),repaired=repairNamedPickupAttribution(run),r={...run.result,resourceFlow:repaired.resourceFlow};assert(run.summary.gameEnded&&run.summary.bugCount===0&&!run.summary.blocked);
 inputs.push({side,case:i+1,file:pair[side],sha256:crypto.createHash('sha256').update(bytes).digest('hex'),namedPickupAttributionCorrections:repaired.changes});
 const used=new Set();
 for(const [li,l]of r.logs.entries()){
  const chosen=l.details?.selected;if(l.type!=='play-card'||chosen?.cardId!=='b_48.webp')continue;
  const next=r.logs.findIndex((x,j)=>j>li&&x.playerId===l.playerId&&['turn-action','play-card'].includes(x.type));
  const logs=r.logs.slice(li+1,next<0?undefined:next).filter(x=>x.playerId===l.playerId);
  const picks=logs.filter(x=>x.type==='pick-card'&&x.details?.pendingType==='card_pick_corner_reward');assert.equal(picks.length,1);
  const pick=picks[0],target=pick.details.card;assert(target?.id);assert.notEqual(target.id,chosen.cardInstanceId);
  const payments=r.resourceFlow.events.filter(e=>e.playerId===l.playerId&&e.roundNumber===l.roundNumber&&e.turnNumber===l.turnNumber&&!used.has(e.entryId+':'+e.stepIndex)&&e.cards?.some(c=>c.key===chosen.cardInstanceId&&c.change==='play'));
  assert.equal(payments.length,1);const payment=payments[0];used.add(payment.entryId+':'+payment.stepIndex);
  const transaction=r.resourceFlow.events.filter(e=>e.playerId===l.playerId&&e.entryId===payment.entryId&&e.stepIndex>payment.stepIndex);
  const receipts=transaction.filter(e=>/^精选1张牌并获得其左上角奖励[:：]/.test(e.sourceDetail));assert.equal(receipts.length,1,'unique selected-corner receipt');
  const receipt=receipts[0],code=Number(target.discardActionCode),resources=pick.playerResources;
  const requested={0:{publicity:1},1:{availableData:1},2:{},3:{publicity:2},4:{score:1,availableData:1},5:{score:1}}[code];assert(requested,'known corner');
  const expected={handSize:1,...requested};for(const [key,cap]of [['availableData',6],['publicity',10]])if(expected[key])expected[key]=Math.min(expected[key],Math.max(0,cap-(resources[key]||0)));
  for(const key of new Set([...Object.keys(expected),...Object.keys(receipt.resourceDeltas)]))assert.equal(receipt.resourceDeltas[key]||0,expected[key]||0,'direct picked corner '+key);
  assert(receipt.cards.some(c=>c.key===target.id&&c.change==='gain'),'physical picked card gained');
  const moves=logs.filter(x=>x.type==='move-path'&&x.details?.effectId==='card-corner-move-'+target.id).map(x=>x.details.selected);
  if(moves.length){const last=moves.at(-1);assert(transaction.some(e=>e.sourceDetail.includes(last.rocketLabel+' -> 扇区['+last.to.x+','+last.to.y+']')),'actual committed movement');}
  rows.push({side,case:i+1,player:l.playerId,company:r.playerResults.find(x=>x.playerId===l.playerId)?.companyLabel,round:l.roundNumber,turn:l.turnNumber,played:chosen.cardInstanceId,picked:target.id,code,entry:payment.entryId,requested,expected,actual:receipt.resourceDeltas,receipt:receipt.sourceDetail,moves:moves.map(m=>({rocketId:m.rocketId,from:m.from,to:m.to,payment:m.paymentRequired}))});
 }
}
const summary={pairs:64,inputs:128,plays:rows.length,baselinePlays:rows.filter(x=>x.side==='baseline').length,candidatePlays:rows.filter(x=>x.side==='candidate').length,movementSteps:rows.reduce((n,r)=>n+r.moves.length,0),issues:[]};
fs.writeFileSync(d+p+'-exact-receipts.json',JSON.stringify({scope:'All frozen pairs. Unique actual paid b48 instance and selected public card, direct corner receipt amounts from pending-choice resources and caps. Movement committed destination checked separately. Zero occurrences do not validate autonomous gain; browser coverage remains separate.',summary,inputs,rows},null,2)+'\n');console.log(summary);
