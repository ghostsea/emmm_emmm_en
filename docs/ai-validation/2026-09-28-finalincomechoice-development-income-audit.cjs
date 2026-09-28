const fs=require('fs'),assert=require('node:assert/strict'),crypto=require('crypto'),d='tmp/ai-20260905/',p='finalincomechoice',suite=JSON.parse(fs.readFileSync(d+p+'-suite.json'));
function clean(x){if(Array.isArray(x))return x.map(clean);if(x&&typeof x==='object')return Object.fromEntries(Object.entries(x).filter(([k])=>!['createdAt','placedAt','incomeDiscardPreview'].includes(k)).map(([k,v])=>[k,clean(v)]));return x;}
const rows=[],divergences=[],manifest=[];
for(const [i,pair]of suite.pairs.entries()){
 const a=JSON.parse(fs.readFileSync(d+pair.baseline)),b=JSON.parse(fs.readFileSync(d+pair.candidate));
 assert(b.summary.ok&&b.summary.gameEnded&&!b.summary.bugCount);
 for(const f of [pair.baseline,pair.candidate])manifest.push({file:f,sha256:crypto.createHash('sha256').update(fs.readFileSync(d+f)).digest('hex')});
 let j=0;while(j<Math.min(a.result.logs.length,b.result.logs.length)&&JSON.stringify(clean(a.result.logs[j]))===JSON.stringify(clean(b.result.logs[j])))j++;
 const old=a.result.logs[j],now=b.result.logs[j];
 if(old||now){assert.equal(old?.type,'discard','first differing decision must be income discard '+(i+1));assert.equal(now?.type,'discard');assert.equal(now.roundNumber,4);assert(now.details.incomeDiscardPreview.options.some(o=>o.finalIncomeChoiceSettlement));assert.deepEqual(old.playerResources,now.playerResources);divergences.push({case:i+1,prefixLogs:j,player:now.playerId,round:now.roundNumber,turn:now.turnNumber,baseline:old.details.selectedCards,candidate:now.details.selectedCards,baselinePreview:old.details.incomeDiscardPreview,candidatePreview:now.details.incomeDiscardPreview});}
 for(const l of b.result.logs){
  const preview=l.details?.incomeDiscardPreview;if(!preview)continue;
  const choices=preview.options.filter(o=>o.finalIncomeChoiceSettlement);if(!choices.length)continue;
  assert.equal(l.roundNumber,4);assert.equal(choices.length,preview.options.length);assert.equal(preview.count,1);
  const selected=choices.filter(o=>o.selected);assert.equal(selected.length,1);const x=selected[0],profile=x.finalIncomeChoiceSettlement;
  assert(Math.abs(x.incomeScore-profile.immediateValue)<.00051);assert.equal(x.finalFormulaFit,profile.incomeFinalScoreGain);assert.equal(x.routeEnergyFit,0);
  const card=l.details.selectedCards[0],events=b.result.resourceFlow.events.filter(e=>e.playerId===l.playerId&&e.roundNumber===l.roundNumber&&e.turnNumber===l.turnNumber);
  const direct=events.filter(e=>e.cards.some(q=>q.change==='income'&&q.key===card.cardInstanceId));
  let event=direct[0],evidence='explicit-income-card-instance',immediateVerified=!!event;
  if(!event){
   const removal=events.filter(e=>e.cards.some(q=>q.change==='unknown_removal'&&q.key===card.cardInstanceId));
   const receipts=events.filter(e=>(!removal.length||e.entryId===removal[0].entryId)&&Object.values(e.incomeDeltas).some(x=>x>0));
   const matching=receipts.filter(e=>['credits','energy','handSize'].every(k=>(e.incomeDeltas[k]||0)===(x.incomeGain[k]||0)));
   event=matching.length===1?matching[0]:null;evidence=removal.length===1&&event?'removed-card-instance-plus-income-in-same-transaction':'income-type-only-card-identity-unproven';
   if(!event)evidence='ambiguous-or-missing-income-receipt';
  }else assert.equal(direct.length,1);
  const incomeMatches=!!event&&['credits','energy','handSize'].every(k=>(event.incomeDeltas[k]||0)===(x.incomeGain[k]||0));
  if(immediateVerified&&!incomeMatches){evidence='explicit-income-identity-assignment-contradicts-selected-gain';immediateVerified=false;}
  if(immediateVerified&&!['credits','energy','handSize'].every(k=>(event.resourceDeltas[k]||0)+(k==='handSize'?1:0)===(profile.immediateGain[k]||0))){evidence='immediate-receipt-does-not-isolate-expected-gain';immediateVerified=false;}
  rows.push({case:i+1,company:b.result.playerResults.find(q=>q.playerId===l.playerId).companyLabel,log:l.id,player:l.playerId,turn:l.turnNumber,pendingType:preview.pendingType,selected:{cardId:x.cardId,gain:x.incomeGain,profile,net:x.netAfterDiscard},receipt:{entry:event?.entryId,step:event?.stepIndex,evidence,immediateVerified,resourceDeltas:event?.resourceDeltas,incomeDeltas:event?.incomeDeltas}});
 }
}
const summary={games:suite.pairs.length,firstDifferingIncomeChoices:divergences.length,candidateChoices:rows.length,directImmediateReceipts:rows.filter(r=>r.receipt.immediateVerified).length,otherEvidenceRequiresQualification:rows.filter(r=>!r.receipt.immediateVerified).length,companies:Object.fromEntries([...new Set(rows.map(r=>r.company))].map(c=>{const xs=rows.filter(x=>x.company===c);return[c,{choices:xs.length,types:Object.fromEntries(['credits','energy','handSize'].map(k=>[k,xs.filter(r=>r.selected.gain[k]>0).length])),positiveIncomeScoreMarginal:xs.filter(r=>r.selected.profile.incomeFinalScoreGain>0).length}]}))};
fs.writeFileSync(d+p+'-flow.json',JSON.stringify({scope:'Full fixed24 candidate income choices in round4 with3marks. Explicit income-card-instance receipts reconcile immediate C/E/H with discard hand debit restored. Data-placement history instead joins the selected removed-card instance to the unique same-transaction income upgrade; this proves matching income type, not independent immediate gain attribution. Actual final-income scoring verified in browser/unit tests; no isolated causal score benefit inferred from later divergence.',summary,divergences,rows,manifest},null,2)+'\n');console.log(JSON.stringify(summary,null,2));
