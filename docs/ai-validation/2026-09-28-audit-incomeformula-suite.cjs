const fs=require('fs'),path=require('path'),assert=require('assert/strict'),crypto=require('crypto');
const {repairIncomeFormulaClassification:repair}=require(path.resolve('tools/repair_ai_income_formula_classification'));
const d='tmp/ai-20260905/',prefix=process.argv[2];assert(prefix);
const suite=JSON.parse(fs.readFileSync(d+prefix+'-suite.json')),rows=[],players={baseline:[],candidate:[]},original={baseline:[],candidate:[]};
for(const side of ['baseline','candidate'])for(const [i,pair]of suite.pairs.entries()){
 const bytes=fs.readFileSync(d+pair[side]),run=JSON.parse(bytes),before=JSON.stringify(run),out=repair(run);
 assert.equal(JSON.stringify(run),before);
 for(const p of out.resourceFlow.players){const old=run.result.resourceFlow.players.find(x=>x.playerId===p.playerId);
  for(const key of ['setupGain','grossGain','spent','endingInventory','productiveMainActionCount','analysisActionCount','blue1CreditGain','blue2EnergyGain'])assert.deepEqual(p[key],old[key],side+' '+(i+1)+' '+p.playerId+' '+key);
  for(const key of Object.keys(p.incomeGain))assert.equal(p.incomeGain[key]+p.nonIncomeGain[key],old.incomeGain[key]+old.nonIncomeGain[key]);
 }
 rows.push({side,case:i+1,file:pair[side],sha256:crypto.createHash('sha256').update(bytes).digest('hex'),changes:out.changes,compensations:out.compensations});
 players[side].push(...out.resourceFlow.players);original[side].push(...run.result.resourceFlow.players);
}
const mean=xs=>xs.reduce((n,x)=>n+x,0)/xs.length,keys=['credits','energy','publicity','availableData','handSize'];
const summarize=ps=>({seats:ps.length,score:mean(ps.map(p=>p.finalScore)),mainActions:mean(ps.map(p=>p.productiveMainActionCount)),analysis:mean(ps.map(p=>p.analysisActionCount)),
 blue1:mean(ps.map(p=>p.blue1CreditGain)),blue2:mean(ps.map(p=>p.blue2EnergyGain)),resources:Object.fromEntries(['setupGain','incomeGain','nonIncomeGain','spent','endingInventory'].map(bucket=>[bucket,Object.fromEntries(keys.map(k=>[k,mean(ps.map(p=>p[bucket][k]))]))]))});
const groups=Object.fromEntries(Object.keys(players).map(side=>[side,{all:summarize(players[side]),companies:Object.fromEntries([...new Set(players[side].map(p=>p.industryId))].map(c=>[c,summarize(players[side].filter(p=>p.industryId===c))]))}]));
const result={scope:'All complete paired inputs; corrected income-versus-non-income classification using explicit card semantics and matching income snapshot compensation. Total resources, spending, inventories, action/analysis/blue counts unchanged for every seat. Retains original resource amount attribution, including snapshot-derived counted payouts; not a new reconstruction of gross per-step gains.',pairs:suite.pairs.length,
 summary:{games:rows.length,changedGames:rows.filter(r=>r.changes.length).length,changedNodes:rows.reduce((n,r)=>n+r.changes.length,0),compensations:rows.reduce((n,r)=>n+r.compensations.length,0)},groups,rows};
fs.writeFileSync(d+prefix+'-incomeformula-corrected.json',JSON.stringify(result,null,2)+'\n');
let md='# 收入计数牌来源校正后的资源对照\n\n'+result.scope+'\n\n|公司|资源|基线收入|候选收入|基线非收入|候选非收入|\n|---|---|---:|---:|---:|---:|\n';
for(const c of Object.keys(groups.baseline.companies))for(const k of keys){const a=groups.baseline.companies[c].resources,b=groups.candidate.companies[c].resources;md+='|'+[c,k,a.incomeGain[k],b.incomeGain[k],a.nonIncomeGain[k],b.nonIncomeGain[k]].map(x=>typeof x==='number'?x.toFixed(4):x).join('|')+'|\n';}
fs.writeFileSync(d+prefix+'-incomeformula-corrected.md',md);console.log(result.summary);
