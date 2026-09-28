const fs=require('fs'),assert=require('node:assert/strict'),crypto=require('crypto'),d='tmp/ai-20260905/',s=JSON.parse(fs.readFileSync(d+'finalreturn-suite.json'));
const rows=[],inputs=[],observations=[],payments=new Set();
for(const [i,pair]of s.pairs.entries()){
 const bytes=fs.readFileSync(d+pair.candidate),r=JSON.parse(bytes);assert(r.summary.ok&&r.summary.gameEnded&&!r.summary.bugCount&&!r.summary.blocked);
 inputs.push({case:i+1,file:pair.candidate,sha256:crypto.createHash('sha256').update(bytes).digest('hex')});
 for(const l of r.result.logs){
  if(l.type==='turn-action')for(const c of l.details.candidates?.find(x=>x.id==='playCard')?.playableCards||[]){
   if(c.valueBreakdown?.finalCardResourceReturn)observations.push({case:i+1,log:l.id,player:l.playerId,company:r.result.playerResults.find(x=>x.playerId===l.playerId).companyLabel,card:c.cardId,instance:c.cardInstanceId,profile:c.valueBreakdown.finalCardResourceReturn,penalty:c.valueBreakdown.finalRoundResourceDrainPenalty,score:c.score,selected:l.details.action});
  }
  const selected=l.type==='play-card'?l.details.selected:null,profile=selected?.valueBreakdown?.finalCardResourceReturn;if(!profile)continue;
  const events=r.result.resourceFlow.events.filter(e=>e.playerId===l.playerId);
  const ps=events.filter(e=>e.pace==='main'&&e.cards?.some(c=>c.key===selected.cardInstanceId&&c.change==='play'));assert.equal(ps.length,1);
  const payment=ps[0],key=[i,l.playerId,payment.entryId].join('/');assert(!payments.has(key));payments.add(key);
  const returns=events.filter(e=>e.entryId===payment.entryId&&e.pace==='main'&&!e.syntheticSnapshotInference&&!e.isDataPlacement&&e.stepIndex>payment.stepIndex&&Object.entries(e.resourceDeltas||{}).some(([k,v])=>['credits','energy'].includes(k)&&v>0));
  const actualGain=Object.fromEntries(['credits','energy'].map(k=>[k,returns.reduce((n,e)=>n+Math.max(0,e.resourceDeltas[k]||0),0)]));
  for(const k of ['credits','energy'])assert(actualGain[k]>=profile.gain[k],`missing minimum receipt ${key}/${k}`);
  assert.equal(-(payment.resourceDeltas.credits||0),selected.cost?.credits||0);
  const later=r.result.logs.slice(r.result.logs.indexOf(l)+1).filter(x=>x.playerId===l.playerId&&x.type==='turn-action');
  const next=later.find(x=>x.details.action?.kind==='main'||x.details.action?.id==='pass');
  const following=next?{log:next.id,round:next.roundNumber,sameRound:next.roundNumber===l.roundNumber,action:next.details.action.id,resources:next.playerResources,quick:later.slice(0,later.indexOf(next)).map(x=>({log:x.id,action:x.details.action.id,resources:x.playerResources}))}:null;
  rows.push({case:i+1,log:l.id,player:l.playerId,company:r.result.playerResults.find(x=>x.playerId===l.playerId).companyLabel,card:selected.cardId,instance:selected.cardInstanceId,profile,penalty:selected.valueBreakdown.finalRoundResourceDrainPenalty,entry:payment.entryId,payment:payment.resourceDeltas,actualGain,following,returns:returns.map(e=>({step:e.stepIndex,text:e.sourceDetail,gain:e.resourceDeltas}))});
 }
}
const result={scope:'All24 candidate games. Every actual selected card with a deterministic return profile must have one unique paid main entry and explicit same-player main positive resource receipts at least equal to its guaranteed return. No snapshot inference or independent data placement counted. Additional technology/passive rewards may raise actualGain above the modeled guarantee; this check is not per-effect causal attribution. Full texts retained. All legal profile observations retained, including never played cards.',inputs,summary:{games:24,actualProfilePlays:rows.length,observations:observations.length,uniqueObservedCards:new Set(observations.map(x=>[x.case,x.player,x.instance].join('/'))).size,issues:[]},rows,observations};
fs.writeFileSync(d+'finalreturn-return-receipts.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result.summary));
