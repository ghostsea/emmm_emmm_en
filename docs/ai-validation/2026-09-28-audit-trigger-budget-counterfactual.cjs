const fs=require('fs'),assert=require('node:assert/strict'),crypto=require('crypto'),d='tmp/ai-20260905/',out='docs/ai-validation/2026-09-28-';
const cases=[2,6,15,16];assert(cases.every(n=>fs.existsSync(d+`trigger-budget-force-${n}-proof.json`)),'All four preregistered counterfactuals required');
const rows=cases.map(n=>{
 const file=d+`trigger-budget-force-${n}-proof.json`,p=JSON.parse(fs.readFileSync(file)),base=JSON.parse(fs.readFileSync(p.input)),after=JSON.parse(fs.readFileSync(p.output));
 assert.equal(crypto.createHash('sha256').update(fs.readFileSync(p.output)).digest('hex'),p.outputSha256);assert(after.summary.ok&&after.summary.gameEnded&&!after.summary.blocked&&after.summary.bugCount===0);
 const playerIndex=base.result.playerResults.findIndex(x=>x.playerId===p.player);assert(playerIndex>=0);
 assert.equal(base.result.playerResults[playerIndex].finalScore,p.baselineScores[playerIndex]);assert.equal(after.result.playerResults[playerIndex].playerId,p.player);
 const card=after.result.playerResults[playerIndex].reservedCards?.find(c=>c.id===p.forced.selected.cardInstanceId);
 const row={case:n,company:p.company,player:p.player,round:p.forced.round,turn:p.forced.turn,resources:p.forced.resources,displacedAction:p.forced.displaced.id,displacedCard:p.forced.displaced.cardInstanceId||null,forcedCard:p.forced.selected.cardInstanceId,alreadySelectedSameCard:p.forced.displaced.cardInstanceId===p.forced.selected.cardInstanceId,identicalPrefixLogs:p.identicalPrefixLogs,scoreBefore:p.baselineScores[playerIndex],scoreAfter:p.scores[playerIndex],playerDelta:p.scoreDeltas[playerIndex],tableMeanDelta:p.scoreDeltas.reduce((s,v)=>s+v,0)/4,allSeatDeltas:p.scoreDeltas,payment:p.payment.resourceDeltas,consumedTriggerIds:card?.cardEffectState?.consumedTriggerIds||null,receiptEvidence:p.receiptEvidence};
 fs.copyFileSync(file,out+`trigger-budget-force-${n}-proof.json`);return row;
});
const report={scope:'All four prespecified single-intervention seen games. Identical pre-intervention semantic logs; exact played entity and actual1-credit payment checked. Company/all-seat scores include shared supply and turn-order effects. Not independent validation, not a new policy, not a +10 result. Returned trigger state may be unavailable; receipt text is supporting evidence, not exact causal attribution.',rows};
fs.writeFileSync(out+'trigger-budget-counterfactuals.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(rows.map(({receiptEvidence,...r})=>({...r,receipts:receiptEvidence.length})),null,2));
