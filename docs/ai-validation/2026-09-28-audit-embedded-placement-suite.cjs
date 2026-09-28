const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('node:assert/strict'),d='tmp/ai-20260905/',p=process.argv[2];
const repair=require(path.resolve(d+'embedded-placement-ledger/tools/repair_ai_embedded_placement_resources')).repairEmbeddedPlacementResources;
const s=JSON.parse(fs.readFileSync(d+p+'-suite.json')),inputs=[],changes=[],playerChanges=[],correctedSeats={baseline:[],candidate:[]};
for(const [i,pair]of s.pairs.entries())for(const side of ['baseline','candidate']){
 const bytes=fs.readFileSync(d+pair[side]),r=JSON.parse(bytes),fixed=repair(r);
 inputs.push({case:i+1,side,file:pair[side],sha256:crypto.createHash('sha256').update(bytes).digest('hex')});
 changes.push(...fixed.changes.map(x=>({case:i+1,side,...x})));
 correctedSeats[side].push(...fixed.resourceFlow.players);
 for(const a of r.result.resourceFlow.players){
  const b=fixed.resourceFlow.players.find(x=>x.playerId===a.playerId);assert(b);assert.deepEqual(b.endingInventory,a.endingInventory);assert.equal(b.finalScore,a.finalScore);assert.equal(b.productiveMainActionCount,a.productiveMainActionCount);
  const fields=['blue1CreditGain','blue2EnergyGain','setupGain','incomeGain','nonIncomeGain','spent','dataPlacementCount','analysisActionCount','fullDataCycleCount'];
  const diff=Object.fromEntries(fields.filter(k=>JSON.stringify(a[k])!==JSON.stringify(b[k])).map(k=>[k,{before:a[k],after:b[k]}]));
  if(Object.keys(diff).length)playerChanges.push({case:i+1,side,player:a.playerId,company:a.industryId,diff});
 }
}
assert.equal(inputs.length,s.pairs.length*2);
const avg=(xs,fn)=>xs.reduce((n,x)=>n+fn(x),0)/xs.length,keys=['credits','energy','publicity','availableData','handSize'];
const summarize=xs=>({seats:xs.length,score:avg(xs,x=>x.finalScore),mainActions:avg(xs,x=>x.productiveMainActionCount),analysis:avg(xs,x=>x.analysisActionCount),blue1:avg(xs,x=>x.blue1CreditGain),blue2:avg(xs,x=>x.blue2EnergyGain),mainPerCreditEnergySpent:avg(xs,x=>x.productiveMainActionCount/(x.spent.credits+x.spent.energy)),cardsPlayed:avg(xs,x=>x.cardUse.played),newCardsPlayed:avg(xs,x=>x.cardUse.playedFromGains),resources:Object.fromEntries(['setupGain','incomeGain','nonIncomeGain','spent','endingInventory'].map(k=>[k,Object.fromEntries(keys.map(j=>[j,avg(xs,x=>x[k][j])]))]))});
const groups=Object.fromEntries(Object.entries(correctedSeats).map(([side,xs])=>[side,{all:summarize(xs),companies:Object.fromEntries([...new Set(xs.map(x=>x.industryId))].map(c=>[c,summarize(xs.filter(x=>x.industryId===c))]))}]));
const parserFiles=['randomizer/game/ai/resource-flow.js','tools/repair_ai_embedded_placement_resources.js'];
const parserHashes=Object.fromEntries(parserFiles.map(f=>[f,crypto.createHash('sha256').update(fs.readFileSync(d+'embedded-placement-ledger/'+f)).digest('hex')]));
const report={scope:'All complete paired inputs repaired separately using parser27 and unique same-entry snapshot compensation. Original files/scores/end inventory/main action counts unchanged. Gross resource totals, attribution and placement counts can change. Score is excluded from resource reconciliation; explicit duplicate score is corrected without fabricating compensation, actual finalScore is preserved. No altered policy or new game outcomes.',parserCommit:'4ed6c2120a221b3450e24659e685e8a3e26bc2b6',parserHashes,inputs,summary:{games:inputs.length,changes:changes.length,changedPlayerRows:playerChanges.length,issues:[]},groups,changes,playerChanges};
fs.writeFileSync(d+p+'-embedded-placement-corrected.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({summary:report.summary,playerChanges},null,2));
