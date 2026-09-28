const fs=require('fs'),crypto=require('crypto'),assert=require('node:assert/strict'),d='tmp/ai-20260905/',s=JSON.parse(fs.readFileSync(d+'tradeledger28v2-suite.json'));
const repair=require('./card-trade-ledger28/tools/repair_ai_card_trade_resources').repairCardTradeResources;
const normalize=v=>Array.isArray(v)?v.map(normalize):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).filter(([k,x])=>!(['placedAt','createdAt','updatedAt'].includes(k)&&typeof x==='string'&&/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d/.test(x))).map(([k,x])=>[k,normalize(x)])):v;
const log=l=>normalize({type:l.type,player:l.playerId,round:l.roundNumber,turn:l.turnNumber,rawTurn:l.rawTurnNumber,resources:l.playerResources,details:l.details});
const rows=[],hash=f=>crypto.createHash('sha256').update(fs.readFileSync(d+f)).digest('hex');
for(const [i,pair]of s.pairs.entries()){
 const a=JSON.parse(fs.readFileSync(d+pair.baseline)),b=JSON.parse(fs.readFileSync(d+pair.candidate));
 for(const r of [a,b])assert(r.summary.ok&&r.summary.gameEnded&&!r.summary.bugCount&&!r.summary.blocked);
 assert.equal(a.options.seed,b.options.seed);assert.equal(a.options.alienSeed,b.options.alienSeed);
 assert.deepEqual(a.summary.playerScores,b.summary.playerScores);assert.equal(a.summary.steps,b.summary.steps);assert.equal(a.result.logs.length,b.result.logs.length);
 for(let n=0;n<a.result.logs.length;n++)assert.equal(JSON.stringify(log(a.result.logs[n])),JSON.stringify(log(b.result.logs[n])),`case${i+1} log${n}`);
 let fixed=null,repairLimitation=null;try{fixed=repair(a);}catch(e){repairLimitation=e.message;}
 const players=b.result.resourceFlow.players.map(p=>{
  const old=a.result.resourceFlow.players.find(x=>x.playerId===p.playerId);assert.equal(p.finalScore,old.finalScore);assert.deepEqual(p.endingInventory,old.endingInventory);assert.equal(p.productiveMainActionCount,old.productiveMainActionCount);assert.equal(p.analysisActionCount,old.analysisActionCount);assert.equal(Object.keys(p.balanceResiduals).length,0);
  if(fixed){const q=fixed.resourceFlow.players.find(x=>x.playerId===p.playerId);for(const k of ['setupGain','incomeGain','nonIncomeGain','spent','sourceTotals'])assert.equal(JSON.stringify(p[k]),JSON.stringify(q[k]),`repair case${i+1}/${p.playerId}/${k}`);}
  return {player:p.playerId,company:p.industryId,score:p.finalScore,main:p.productiveMainActionCount,old:{income:old.incomeGain,nonIncome:old.nonIncomeGain,spent:old.spent,sources:old.sourceTotals},current:{income:p.incomeGain,nonIncome:p.nonIncomeGain,spent:p.spent,sources:p.sourceTotals}};
 });
 const trades=b.result.resourceFlow.events.filter(e=>/^快速交易：\s*2\s*张牌\s*→\s*1\s*(信用点|能量)(?:；资源：[^；]+)?$/.test(e.sourceDetail||''));
 for(const t of trades){assert.equal(t.sourceCategory,'trade_conversion');assert.equal(t.resourceDeltas.handSize,-2);assert.equal((t.resourceDeltas.credits||0)+(t.resourceDeltas.energy||0),1);}
 rows.push({case:i+1,baseline:pair.baseline,replay:pair.candidate,baselineSha256:hash(pair.baseline),replaySha256:hash(pair.candidate),scores:b.summary.playerScores,steps:b.summary.steps,logs:b.result.logs.length,explicitTrades:trades.length,repairable:Boolean(fixed),repairLimitation,players});
}
const summary={games:24,logs:rows.reduce((n,x)=>n+x.logs,0),steps:rows.reduce((n,x)=>n+x.steps,0),explicitTrades:rows.reduce((n,x)=>n+x.explicitTrades,0),independentlyRepairableGames:rows.filter(x=>x.repairable).length,oldReportsInsufficientForRepair:rows.filter(x=>!x.repairable).map(x=>({case:x.case,reason:x.repairLimitation})),issues:[]};
fs.writeFileSync(d+'tradeledger28v2-replay-audit.json',JSON.stringify({scope:'Full24 current011 parser28 real-browser replays. Exact observed decision/resource/score trajectory excluding ISO timestamps, all steps and final scores unchanged. Gross/source changes explicitly reported; complete reruns are authoritative when old net snapshots cannot be safely repaired. No original reports overwritten, no policy gain claimed.',summary,rows},null,2)+'\n');console.log(JSON.stringify(summary));
