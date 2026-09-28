const fs=require('fs'),assert=require('node:assert/strict'),d='tmp/ai-20260905/',p='datagoal';
(async()=>{
 while(!fs.existsSync(d+p+'-queue-complete.json'))await new Promise(r=>setTimeout(r,5000));
 const q=JSON.parse(fs.readFileSync(d+p+'-queue-complete.json'));assert.equal(q.completed.length,24);assert.equal(q.failures.length,0);
 const s=JSON.parse(fs.readFileSync(d+p+'-suite.json')),rows=[],summary={};
 for(const side of ['baseline','candidate']){
  for(const[i,pair]of s.pairs.entries()){
   const run=JSON.parse(fs.readFileSync(d+pair[side])),r=run.result;assert(run.summary.gameEnded&&!run.summary.bugCount);
   const used=new Set();
   for(const[li,l]of r.logs.entries()){
    const a=l.details?.action;if(l.type!=='turn-action'||a?.id!=='playCard'||!a.effectTypes?.includes('gain_data'))continue;
    const next=r.logs.slice(li+1).find(x=>x.playerId===l.playerId&&['turn-action','play-card'].includes(x.type)),selected=next?.details?.selected;
    assert(selected);assert.equal(a.cardInstanceId,selected.cardInstanceId);
    const payment=r.resourceFlow.events.find(e=>e.playerId===l.playerId&&e.roundNumber===l.roundNumber&&e.turnNumber===l.turnNumber&&!used.has(e.entryId+':'+e.stepIndex)&&e.cards?.some(c=>c.key===selected.cardInstanceId&&c.change==='play'));
    assert(payment);used.add(payment.entryId+':'+payment.stepIndex);
    const receipts=r.resourceFlow.events.filter(e=>e.playerId===l.playerId&&e.entryId===payment.entryId&&e.stepIndex>payment.stepIndex)
     .flatMap(e=>{const m=String(e.sourceDetail||'').match(/获得\s*(\d+)\s*\/\s*(\d+)\s*个数据/);return m?[{entry:e.entryId,step:e.stepIndex,gained:Number(m[1]),requested:Number(m[2]),text:e.sourceDetail}]:[];});
    const support=a.valueBreakdown?.directDataGoalSupport||null;
    if(side==='candidate')assert.deepEqual(support,selected.valueBreakdown.directDataGoalSupport,'wrapper/actual selected support mismatch');
    rows.push({side,case:i+1,player:l.playerId,company:r.playerResults.find(p=>p.playerId===l.playerId).companyLabel,
     round:l.roundNumber,turn:l.turnNumber,card:a.cardId,instance:a.cardInstanceId,entry:payment.entryId,
     resources:l.playerResources,support,receipts,receiptData:receipts.reduce((n,r)=>n+r.gained,0),
     noRecordedReceipt:receipts.length===0,positiveSupportedWithoutData:!!support?.supported&&!receipts.some(r=>r.gained>0)});
   }
  }
  const rs=rows.filter(r=>r.side===side);summary[side]={plays:rs.length,receiptData:rs.reduce((n,r)=>n+r.receiptData,0),
   supported:side==='candidate'?rs.filter(r=>r.support?.supported).length:null,fullPoolAutoPlace:side==='candidate'?rs.filter(r=>r.support?.canAutoPlace).length:null,
   zeroReceipt:rs.filter(r=>!r.receiptData).length,missingReceipt:rs.filter(r=>r.noRecordedReceipt).length,
   supportedWithoutData:side==='candidate'?rs.filter(r=>r.positiveSupportedWithoutData).length:null,
   companies:Object.fromEntries([...new Set(rs.map(r=>r.company))].map(c=>{const xs=rs.filter(r=>r.company===c);return[c,{plays:xs.length,data:xs.reduce((n,r)=>n+r.receiptData,0),alienPlays:xs.filter(r=>!/^b_|^dlc_/.test(r.card)).length}];}))};
 }
 const result={scope:'All24 complete pairs. Match chosen exact card and unique payment, then explicit gained/requested data receipts for that player after payment in the same transaction. Receipts may include other automatic effects within that transaction; not claimed exact isolated-card attribution. Missing/zero/positive-support-without-data cases retained for review. requested is capacity support input, not guaranteed gain.',summary,rows};
 fs.writeFileSync(d+p+'-data-receipts.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(summary,null,2));
})().catch(e=>{console.error(e);process.exitCode=1;});
