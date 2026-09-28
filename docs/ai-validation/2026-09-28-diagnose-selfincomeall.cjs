const fs=require('fs'),assert=require('node:assert/strict'),crypto=require('crypto'),d='tmp/ai-20260905/',p='selfincomeall';
const suite=JSON.parse(fs.readFileSync(d+p+'-suite.json')),receipts=JSON.parse(fs.readFileSync(d+p+'-self-income-receipts.json')),rows=[],inputs=[],observations=[];
for(const [i,pair]of suite.pairs.entries())for(const side of ['baseline','candidate']){
 const bytes=fs.readFileSync(d+pair[side]),r=JSON.parse(bytes);assert(r.summary.ok&&r.summary.gameEnded&&!r.summary.bugCount&&!r.summary.blocked);
 inputs.push({case:i+1,side,file:pair[side],sha256:crypto.createHash('sha256').update(bytes).digest('hex')});
 if(side==='candidate')for(const l of r.result.logs.filter(l=>l.type==='turn-action'))for(const c of l.details.candidates?.find(x=>x.id==='playCard')?.playableCards||[]){
  const profile=c.valueBreakdown?.selfIncome;if(profile)observations.push({case:i+1,log:l.id,player:l.playerId,company:r.result.playerResults.find(x=>x.playerId===l.playerId).companyLabel,round:l.roundNumber,card:c.cardId,instance:c.cardInstanceId,profile,selected:l.details.action?.id});
 }
 for(const player of r.result.resourceFlow.players){
  const logs=r.result.logs.filter(l=>l.playerId===player.playerId),own=receipts.rows.filter(x=>x.case===i+1&&x.side===side&&x.player===player.playerId);
  rows.push({case:i+1,side,player:player.playerId,company:r.result.playerResults.find(x=>x.playerId===player.playerId).companyLabel,score:player.finalScore,mainActions:player.productiveMainActionCount,analysis:player.analysisActionCount,selfIncomePlays:own.map(x=>({card:x.card,round:x.round,resource:x.resource,profile:x.profile})),resources:{setup:player.setupGain,income:player.incomeGain,nonIncome:player.nonIncomeGain,spent:player.spent,ending:player.endingInventory},following:own.map(x=>{const at=logs.findIndex(l=>l.id===x.log),later=logs.slice(at+1).filter(l=>l.type==='turn-action'),next=later.find(l=>l.details.action?.kind==='main'||l.details.action?.id==='pass');return {log:x.log,round:x.round,next:next?{log:next.id,round:next.roundNumber,sameRound:x.round===next.roundNumber,action:next.details.action.id}:null};})});
 }
}
const summary={games:inputs.length,seats:rows.length,observations:observations.length,uniqueObservedCards:new Set(observations.map(x=>[x.case,x.player,x.instance].join('/'))).size,profilePlays:receipts.summary.profilePlays,issues:[]};
fs.writeFileSync(d+p+'-outcomes.json',JSON.stringify({scope:'All24 fixed pairs, parser27 both arms. Self-tuck immediate receipts linked to subsequent main action or pass, and full-game resources reported for every company. Following action is temporal association, not causal extra action; competition and card choices affect future income. No future payout or historical gains added to score.',summary,inputs,rows,observations},null,2)+'\n');console.log(JSON.stringify(summary));
