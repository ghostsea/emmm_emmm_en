const fs=require('fs'),assert=require('node:assert/strict'),d='tmp/ai-20260905/',p='repeatcorner';
(async()=>{
 while(!fs.existsSync(d+p+'-queue-complete.json'))await new Promise(r=>setTimeout(r,5000));
 const q=JSON.parse(fs.readFileSync(d+p+'-queue-complete.json'));assert.equal(q.completed.length,24);assert.equal(q.failures.length,0);
 const s=JSON.parse(fs.readFileSync(d+p+'-suite.json')),rows=[];
 for(const side of ['baseline','candidate'])for(const [i,pair]of s.pairs.entries()){
  const run=JSON.parse(fs.readFileSync(d+pair[side])),r=run.result;assert(run.summary.gameEnded&&!run.summary.bugCount);
  const used=new Set();
  for(const [li,l]of r.logs.entries()){
   const chosen=l.details?.selected;if(l.type!=='play-card'||chosen?.cardId!=='dlc_20.png')continue;
   const nextPlay=r.logs.findIndex((x,k)=>k>li&&x.playerId===l.playerId&&['turn-action','play-card'].includes(x.type));
   const logs=r.logs.slice(li+1,nextPlay<0?undefined:nextPlay).filter(x=>x.playerId===l.playerId);
   const choice=logs.find(x=>x.type==='rare-scan-target'&&x.details?.repeatCornerPreviews);
   const payment=r.resourceFlow.events.find(e=>e.playerId===l.playerId&&e.roundNumber===l.roundNumber&&e.turnNumber===l.turnNumber
    &&!used.has(e.entryId+':'+e.stepIndex)&&e.cards?.some(c=>c.key===chosen.cardInstanceId&&c.change==='play'));
   assert(payment,'missing actual DLC20 payment');used.add(payment.entryId+':'+payment.stepIndex);
   const transaction=r.resourceFlow.events.filter(e=>e.playerId===l.playerId&&e.entryId===payment.entryId&&e.stepIndex>payment.stepIndex);
   const discard=transaction.find(e=>e.cards?.some(c=>c.key===choice?.details.cardId&&c.change==='discard'));
   if(side==='candidate'){assert(choice,'missing discard decision');assert(discard,'missing actual discard instance');assert.notEqual(choice.details.cardId,chosen.cardInstanceId);}
   const selectedPreview=choice?.details.repeatCornerPreviews.find(x=>x.cardInstanceId===choice.details.cardId)||null;
   const moves=logs.filter(x=>x.type==='move-path'&&String(x.details?.effectId).startsWith('dlc20-repeat-corner-move-'))
    .map(x=>({from:x.details.selected?.from,to:x.details.selected?.to,payment:x.details.selected?.paymentRequired,remaining:x.details.selected?.valueBreakdown?.remainingPoolAfterStep}));
   const mainGain=transaction.filter(e=>String(e.sourceDetail).includes('弃非外星人卡并结算其左上角奖励3次'));
   rows.push({side,case:i+1,player:l.playerId,company:r.playerResults.find(x=>x.playerId===l.playerId).companyLabel,
    round:l.roundNumber,turn:l.turnNumber,instance:chosen.cardInstanceId,payment:{entry:payment.entryId,step:payment.stepIndex,resources:payment.resourceDeltas,text:payment.sourceDetail},
    preview:chosen.valueBreakdown?.repeatCornerPreview||null,selectedPreview,discard:discard||null,
    samePlannedDiscard:chosen.valueBreakdown?.repeatCornerPreview?.cardInstanceId===choice?.details.cardId,moves,
    directCornerEntries:mainGain,transaction});
  }
 }
 const summary=Object.fromEntries(['baseline','candidate'].map(side=>{const rs=rows.filter(x=>x.side===side);return[side,{plays:rs.length,
  plannedDiscardMatches:side==='candidate'?rs.filter(x=>x.samePlannedDiscard).length:null,
  movementCorners:rs.filter(x=>x.selectedPreview?.movementPoints>0).length,directMoveSteps:rs.reduce((n,x)=>n+x.moves.length,0),
  resourceCorners:rs.filter(x=>x.selectedPreview&&!x.selectedPreview.movementPoints).length,
  byCompany:Object.fromEntries([...new Set(rs.map(x=>x.company))].map(c=>[c,rs.filter(x=>x.company===c).length]))}];}));
 const result={scope:'All complete24 pairs. Exact paid DLC20 instance and later discarded second instance matched in the same transaction. Preserve preplay projection versus actual pending-choice rerank, direct movement effect IDs and all receipt texts. Other triggered effects in the transaction are retained but not attributed to DLC20 direct reward; movement forecast is only first-step plus nominal pool, not predicted full payout.',summary,rows};
 fs.writeFileSync(d+p+'-realization.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(summary,null,2));
})().catch(e=>{console.error(e);process.exitCode=1;});
