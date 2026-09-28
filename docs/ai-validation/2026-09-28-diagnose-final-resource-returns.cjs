const fs=require('fs'),crypto=require('crypto'),assert=require('node:assert/strict'),d='tmp/ai-20260905/';
const effects=require('../../randomizer/game/cards/effects'),suite=JSON.parse(fs.readFileSync(d+'bluelifecycle-suite.json')),inputs=[],rows=[];
for(const [i,pair]of suite.pairs.entries()){
 const bytes=fs.readFileSync(d+pair.baseline),r=JSON.parse(bytes);assert(r.summary.ok&&r.summary.gameEnded&&!r.summary.bugCount&&!r.summary.blocked);
 inputs.push({case:i+1,file:pair.baseline,sha256:crypto.createHash('sha256').update(bytes).digest('hex')});
 for(const l of r.result.logs.filter(l=>l.type==='turn-action'&&l.roundNumber===4)){
  for(const c of l.details.candidates?.find(c=>c.id==='playCard')?.playableCards||[]){
   const penalty=c.valueBreakdown?.finalRoundResourceDrainPenalty;if(!(penalty>0))continue;
   const es=effects.buildPlayEffects({cardId:c.cardId,id:c.cardInstanceId});
   const gain=es.filter(e=>e.type==='gain_resources').reduce((a,e)=>({credits:a.credits+(e.options?.gain?.credits||0),energy:a.energy+(e.options?.gain?.energy||0)}),{credits:0,energy:0});
   if(!gain.credits&&!gain.energy)continue;
   const company=r.result.playerResults.find(p=>p.playerId===l.playerId).companyLabel;
   rows.push({case:i+1,player:l.playerId,company,log:l.id,turn:l.turnNumber,rawTurn:l.rawTurnNumber,card:c.cardId,instance:c.cardInstanceId,resources:l.playerResources,cost:c.cost,unconditionalFlatGain:gain,penalty,rawScore:c.score,selected:l.details.action,breakdown:c.valueBreakdown});
  }
 }
}
const result={scope:'All24 current011 fixed games. Enumerate all R4 legal nested card candidates with positive finalRoundResourceDrainPenalty and a flat unconditional gain_resources credit/energy effect. Does not cover conditional, income, alien-specific or queued nested resource gains. Current source calculates penalty from post-payment balances only. This is a diagnostic, not a complete effect simulator or evidence that changing the penalty improves score; remaining effects may change resources further.',inputs,summary:{observations:rows.length,uniqueCards:new Set(rows.map(x=>x.case+'/'+x.player+'/'+x.instance)).size},rows};
fs.writeFileSync('docs/ai-validation/2026-09-28-final-resource-return-diagnosis.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result.summary));
