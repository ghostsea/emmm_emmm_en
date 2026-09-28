const fs=require('fs'),assert=require('node:assert/strict'),crypto=require('crypto'),d='tmp/ai-20260905/';
const repair=require('./embedded-placement-ledger/tools/repair_ai_embedded_placement_resources').repairEmbeddedPlacementResources;
const read=f=>JSON.parse(fs.readFileSync(d+f)),suite=read('huanyuselfincome-suite.json'),receipts=read('huanyuselfincome-self-income-receipts.json');
const rows=[],inputs=[];
for(const [i,pair]of suite.pairs.entries()){
 const arms={};
 for(const side of ['baseline','candidate']){
  const bytes=fs.readFileSync(d+pair[side]),r=JSON.parse(bytes);assert(r.summary.ok&&r.summary.gameEnded&&!r.summary.bugCount&&!r.summary.blocked);
  inputs.push({case:i+1,side,file:pair[side],sha256:crypto.createHash('sha256').update(bytes).digest('hex')});
  const fixed=repair(r),player=r.result.playerResults.find(p=>p.companyLabel==='寰宇超动力');assert(player);
  const p=fixed.resourceFlow.players.find(p=>p.playerId===player.playerId),logs=r.result.logs.filter(l=>l.playerId===p.playerId);
  const main=logs.filter(l=>l.type==='turn-action'&&l.details.action?.kind==='main'&&l.details.action.id!=='pass');
  arms[side]={score:p.finalScore,player:p.playerId,mainActions:p.productiveMainActionCount,analysis:p.analysisActionCount,played:p.cardUse.played,newCardsPlayed:p.cardUse.playedFromGains,resources:{setup:p.setupGain,income:p.incomeGain,nonIncome:p.nonIncomeGain,spent:p.spent,ending:p.endingInventory},rounds:[1,2,3,4].map(round=>({round,mainActions:main.filter(l=>l.roundNumber===round).map(l=>({log:l.id,id:l.details.action.id,card:l.details.action.cardId||null,resources:l.playerResources}))})),profilePlays:receipts.rows.filter(x=>x.case===i+1&&x.side===side&&x.company==='寰宇超动力')};
 }
 const profilePlays=arms.candidate.profilePlays.filter(x=>x.profile);
 rows.push({case:i+1,meanScoreDelta:(read(pair.candidate).summary.playerScores.reduce((a,x)=>a+x,0)-read(pair.baseline).summary.playerScores.reduce((a,x)=>a+x,0))/4,profilePlays:profilePlays.length,baseline:arms.baseline,candidate:arms.candidate});
}
const result={scope:'All24 paired fixed games; same Huanyu seat per pair and parser27-corrected resource receipts. Lists all3 actual newly modeled self-income plays and whole-game/round main actions. Income changes and score shifts include competitive trajectory changes, not a causal marginal return of an individual card. No fresh/generalization claim.',inputs,rows};
fs.writeFileSync(d+'huanyuselfincome-outcomes.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(rows.filter(x=>x.profilePlays||x.baseline.score!==x.candidate.score).map(x=>({case:x.case,meanScoreDelta:x.meanScoreDelta,plays:x.profilePlays,arms:Object.fromEntries(['baseline','candidate'].map(k=>[k,{score:x[k].score,main:x[k].mainActions,analysis:x[k].analysis,played:x[k].played,income:x[k].resources.income,nonIncome:x[k].resources.nonIncome,ending:x[k].resources.ending}]))})),null,2));
