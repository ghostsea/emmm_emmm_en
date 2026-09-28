const fs=require('fs'),crypto=require('crypto'),assert=require('node:assert/strict');
const d='tmp/ai-20260905/',read=f=>JSON.parse(fs.readFileSync(d+f));
const repair=require('./embedded-placement-ledger/tools/repair_ai_embedded_placement_resources').repairEmbeddedPlacementResources;
const normalize=v=>Array.isArray(v)?v.map(normalize):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).filter(([k,x])=>!(['placedAt','createdAt','updatedAt'].includes(k)&&typeof x==='string'&&/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d/.test(x))).map(([k,x])=>[k,normalize(x)])):v;
const action=l=>normalize({type:l.type,player:l.playerId,round:l.roundNumber,turn:l.turnNumber,rawTurn:l.rawTurnNumber,resources:l.playerResources,details:l.details});
const hash=f=>crypto.createHash('sha256').update(fs.readFileSync(d+f)).digest('hex');
const rows=[];
for(const n of [8,9]){
 const oldFile=`bluelifecycle-base-${n}.json`,newFile=`embedded-parser27-replay-${n}.json`,a=read(oldFile),b=read(newFile);
 for(const r of [a,b])assert(r.summary.ok&&r.summary.gameEnded&&!r.summary.blocked&&!r.summary.bugCount);
 assert.equal(a.options.seed,b.options.seed);assert.equal(a.options.alienSeed,b.options.alienSeed);
 assert.deepEqual(a.summary.playerScores,b.summary.playerScores);assert.equal(a.summary.steps,b.summary.steps);assert.equal(a.result.logs.length,b.result.logs.length);
 for(let i=0;i<a.result.logs.length;i++)assert.equal(JSON.stringify(action(a.result.logs[i])),JSON.stringify(action(b.result.logs[i])),`trajectory case${n} log${i}`);
 const corrected=repair(a),players=[];
 for(const p of b.result.resourceFlow.players){
  const old=a.result.resourceFlow.players.find(x=>x.playerId===p.playerId),fixed=corrected.resourceFlow.players.find(x=>x.playerId===p.playerId);
  assert.equal(p.finalScore,old.finalScore);assert.deepEqual(p.endingInventory,old.endingInventory);assert.equal(p.productiveMainActionCount,old.productiveMainActionCount);assert.equal(Object.keys(p.balanceResiduals).length,0);
  for(const k of ['blue1CreditGain','blue2EnergyGain','setupGain','incomeGain','nonIncomeGain','spent','dataPlacementCount','analysisActionCount','fullDataCycleCount'])assert.deepEqual(p[k],fixed[k],`${n}/${p.playerId}/${k}`);
  players.push({player:p.playerId,company:p.industryId,score:p.finalScore,mainActions:p.productiveMainActionCount,blue2Before:old.blue2EnergyGain,blue2After:p.blue2EnergyGain,nonIncomeBefore:old.nonIncomeGain,nonIncomeAfter:p.nonIncomeGain,spentBefore:old.spent,spentAfter:p.spent});
 }
 rows.push({case:n,oldFile,newFile,oldSha256:hash(oldFile),newSha256:hash(newFile),scores:b.summary.playerScores,steps:b.summary.steps,logs:b.result.logs.length,changes:corrected.changes.length,players});
}
const report={scope:'Two full real-browser replays of existing fixed cases8/9 with parser27/current011. Every observed decision, resources, details, type/player/round/turn, scores and steps identical to parser26. Only ISO createdAt/updatedAt/placedAt omitted from semantic comparison; statistical resourceFlow is compared separately against independently repaired historical receipts. Covers energy and score duplicate-placement cases, not all possible games.',parserCommit:'4ed6c2120a221b3450e24659e685e8a3e26bc2b6',issues:[],rows};
fs.writeFileSync(d+'embedded-parser27-replay-audit.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(rows.map(x=>({case:x.case,scores:x.scores,steps:x.steps,logs:x.logs,changes:x.changes}))));
