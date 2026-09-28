const fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),crypto=require('crypto');
const {repairRepeatedCornerResources}=require(path.resolve('tools/repair_ai_repeat_corner_resources'));
const d='tmp/ai-20260905/',prefix=process.argv[2];assert(prefix);
const suite=JSON.parse(fs.readFileSync(d+prefix+'-suite.json')),rows=[],inputs=[];
for(const side of ['baseline','candidate'])for(const [i,pair]of suite.pairs.entries()){
 const bytes=fs.readFileSync(d+pair[side]),run=JSON.parse(bytes),r=run.result;
 assert(run.summary.gameEnded&&run.summary.bugCount===0&&!run.summary.blocked);
 const ledger=repairRepeatedCornerResources(run).resourceFlow;
 inputs.push({side,case:i+1,file:pair[side],sha256:crypto.createHash('sha256').update(bytes).digest('hex')});
 const used=new Set();
 for(const [li,l]of r.logs.entries()){
  const chosen=l.details?.selected;if(l.type!=='play-card'||chosen?.cardId!=='dlc_20.png')continue;
  const next=r.logs.findIndex((x,j)=>j>li&&x.playerId===l.playerId&&['turn-action','play-card'].includes(x.type));
  const logs=r.logs.slice(li+1,next<0?undefined:next).filter(x=>x.playerId===l.playerId);
  const choice=logs.find(x=>x.type==='rare-scan-target'&&x.details?.repeatCornerPreviews);
  const preview=choice?.details.repeatCornerPreviews.find(x=>x.cardInstanceId===choice.details.cardId);
  const payments=ledger.events.filter(e=>e.playerId===l.playerId&&e.roundNumber===l.roundNumber&&e.turnNumber===l.turnNumber
   &&!used.has(e.entryId+':'+e.stepIndex)&&e.cards?.some(c=>c.key===chosen.cardInstanceId&&c.change==='play'));
  assert.equal(payments.length,1,'unique actual DLC20 payment');const payment=payments[0];used.add(payment.entryId+':'+payment.stepIndex);
  const transaction=ledger.events.filter(e=>e.playerId===l.playerId&&e.entryId===payment.entryId&&e.stepIndex>payment.stepIndex);
  if(!preview){assert.equal(side,'baseline','candidate must record actual pending choice');rows.push({side,case:i+1,player:l.playerId,coverage:'baseline has no repeat preview'});continue;}
  assert.equal(preview.repeat,3);assert.notEqual(preview.cardInstanceId,chosen.cardInstanceId);
  const direct=transaction.filter(e=>/^弃非外星人卡并结算其左上角奖励3次[:：]/.test(e.sourceDetail));
  assert.equal(direct.length,1,'unique direct corner receipt');const receipt=direct[0];
  assert(receipt.cards.some(c=>c.key===preview.cardInstanceId&&c.change==='discard'));
  assert.equal(receipt.resourceDeltas.handSize,-1,'second physical instance consumed');
  const keys=new Set([...Object.keys(preview.actualGain),...Object.keys(receipt.resourceDeltas)]);keys.delete('handSize');
  for(const key of keys)assert.equal(receipt.resourceDeltas[key]||0,preview.actualGain[key]||0,'actual pending preview resource '+key);
  const effectId='dlc20-repeat-corner-move-'+preview.cardInstanceId;
  const moves=logs.filter(x=>x.type==='move-path'&&x.details?.effectId===effectId).map(x=>x.details.selected);
  let pool=preview.movementPoints;for(const m of moves){assert(pool>0);const expected= Math.max(0,pool-m.terrainRequired);
   assert.equal(m.paymentRequired,Math.max(0,m.terrainRequired-pool));assert.equal(m.valueBreakdown.remainingPoolAfterStep,expected);pool=expected;}
  const first=preview.bestMove&&moves[0];
  const firstStepMatches=first?['rocketId','from','to','direction','paymentRequired'].every(k=>JSON.stringify(first[k])===JSON.stringify(preview.bestMove[k])):null;
  const movementReceipts=transaction.filter(e=>/R\d+ -> 扇区\[/.test(e.sourceDetail)).map(e=>({step:e.stepIndex,text:e.sourceDetail,resources:e.resourceDeltas}));
  // A decision log is not an execution receipt. Match coordinates in committed
  // transaction text, without attributing unrelated triggered movement rewards.
  let receiptText=movementReceipts.map(e=>e.text).join('\n'),cursor=0;
  for(const m of moves){const target='扇区['+m.to.x+','+m.to.y+']';const found=receiptText.indexOf(target,cursor);assert(found>=0,'executed movement target '+target);cursor=found+target.length;}
  rows.push({side,case:i+1,player:l.playerId,company:r.playerResults.find(x=>x.playerId===l.playerId).companyLabel,
   round:l.roundNumber,turn:l.turnNumber,entry:payment.entryId,playedInstance:chosen.cardInstanceId,discardedInstance:preview.cardInstanceId,
   plannedDiscardMatches:chosen.valueBreakdown?.repeatCornerPreview?.cardInstanceId===preview.cardInstanceId,
   requested:preview.requestedGain,expected:preview.actualGain,actual:receipt.resourceDeltas,movementPoints:preview.movementPoints,
   moves:moves.map(m=>({rocketId:m.rocketId,from:m.from,to:m.to,payment:m.paymentRequired,remaining:m.valueBreakdown.remainingPoolAfterStep})),
   firstStepMatches,remainingPool:pool,movementReceipts,directReceipt:receipt.sourceDetail});
 }
}
const checked=rows.filter(r=>r.expected),summary={pairs:suite.pairs.length,inputs:inputs.length,plays:rows.length,resourceReceipts:checked.length,
 movementCorners:checked.filter(r=>r.movementPoints>0).length,movementSteps:checked.reduce((n,r)=>n+r.moves.length,0),
 firstStepMatches:checked.filter(r=>r.firstStepMatches===true).length,firstStepMismatches:checked.filter(r=>r.firstStepMatches===false).length,
 plannedDiscardChanges:checked.filter(r=>!r.plannedDiscardMatches).length,issues:[]};
fs.writeFileSync(d+prefix+'-exact-receipts.json',JSON.stringify({scope:'All complete pairs. Unique actual paid and discarded card identities; direct corner amounts checked against actual pending-choice preview after caps. Old parser23 input only reattributed with explicit matching snapshot compensation. Movement decisions checked for pool arithmetic and ordered destination text in committed transaction; decision pool is not an independent actual pool snapshot. No whole-route reward forecast or attribution of triggered movement to DLC20.',summary,inputs,rows},null,2)+'\n');
console.log(summary);
