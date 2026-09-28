const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('node:assert/strict'),d='tmp/ai-20260905/';
const files=fs.readdirSync('参考行动日志',{withFileTypes:true}).filter(x=>x.isFile()&&x.name.endsWith('.md')).map(x=>path.resolve('参考行动日志',x.name)).sort();assert(files.length>=18);
const before=require('../../tools/analyze_reference_action_logs').analyzeReferenceFiles(files),after=require('./card-trade-ledger28/tools/analyze_reference_action_logs').analyzeReferenceFiles(files);
const changes=[],players=[];assert.equal(before.games.length,after.games.length);
for(const [i,a]of before.games.entries()){
 const b=after.games[i];assert.equal(a.gameId,b.gameId);assert.equal(a.events.length,b.events.length);
 for(const [j,x]of a.events.entries()){
  const y=b.events[j];for(const key of Object.keys(x).filter(k=>k!=='sourceCategory'))assert.equal(JSON.stringify(x[key]),JSON.stringify(y[key]),`${a.fileName} event${j}/${key}`);
  if(x.sourceCategory!==y.sourceCategory)changes.push({file:a.fileName,event:j,player:x.playerId,text:x.sourceDetail,from:x.sourceCategory,to:y.sourceCategory,resources:y.resourceDeltas});
 }
}
for(const a of before.summary.players){
 const b=after.summary.players.find(x=>x.gameId===a.gameId&&x.playerId===a.playerId);assert(b);
 for(const key of ['finalScore','grossGain','spent','productiveMainActionCount','analysisActionCount','blue1CreditGain','blue2EnergyGain','cardUse'])assert.equal(JSON.stringify(a[key]),JSON.stringify(b[key]),`${a.gameId}/${a.playerId}/${key}`);
 players.push({gameId:a.gameId,player:a.playerId,score:b.finalScore,sourceChanged:JSON.stringify(a.sourceTotals)!==JSON.stringify(b.sourceTotals),before:{income:a.incomeGain,nonIncome:a.nonIncomeGain,sources:a.sourceTotals},after:{income:b.incomeGain,nonIncome:b.nonIncomeGain,sources:b.sourceTotals}});
}
const summary={files:files.length,games:after.games.length,seats:players.length,eventsReclassified:changes.length,seatsWithSourceChanges:players.filter(p=>p.sourceChanged).length,seatsWithIncomeChanges:players.filter(p=>JSON.stringify(p.before.income)!==JSON.stringify(p.after.income)).length,totalsAndActionsUnchanged:true,issues:[]};
fs.writeFileSync(d+'card-trade-human-v2-proof.json',JSON.stringify({scope:'All reference files; only event source categories change. Final scores, resource gross/spending, actual card usage, main actions, analysis and blue rewards verified unchanged per seat. Income/nonincome/source bucket changes explicitly retained; no filling of missing historical resources.',summary,changes,players,inputs:files.map(f=>({file:f,sha256:crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex')}))},null,2)+'\n');console.log(JSON.stringify(summary));
