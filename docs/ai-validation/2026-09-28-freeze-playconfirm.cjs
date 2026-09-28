const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('node:assert/strict');
const d='tmp/ai-20260905/',out='docs/ai-validation/2026-09-28-',hash=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const read=n=>JSON.parse(fs.readFileSync(d+n+'.json'));
const oldA=read('playweightabsolute64-suite'),oldB=read('playweightincremental64-suite');
const done=JSON.parse(fs.readFileSync(out+'playweightfresh-results.json'));assert.equal(done.rows.length,2);assert.equal(done.issues.length,0);
assert(done.rows.find(x=>x.prefix==='playweightincremental64').delta.mean>0);
const a='playconfirmabsolute64',b='playconfirmincremental64';
for(const p of[a,b])assert(!fs.existsSync(d+p+'-suite.json'),'already frozen');
for(const s of[oldA,oldB])for(const model of Object.values(s.models))for(const[f,h]of Object.entries(model.hashes))assert.equal(hash(path.resolve(d,model.root,f)),h,'source changed '+f);
for(const[f,h]of Object.entries(oldA.harnessHashes))assert.equal(hash(f),h,'harness changed '+f);
for(const[from,to]of[['playweightabsolute64',a],['playweightincremental64',b]])for(const name of [from+'-run.cjs','collect-'+from+'.cjs','audit-'+from+'.cjs','audit-'+from+'-runtime.cjs',from+'-resource-matrix.cjs'])fs.writeFileSync(d+name.replaceAll(from,to),fs.readFileSync(d+name,'utf8').replaceAll(from,to));
let queue=fs.readFileSync(d+'queue-playweightfresh.cjs','utf8').replaceAll('playweight','playconfirm').replace('active.size<4','active.size<2');
queue=queue.replace('(async()=>{',`(async()=>{
 console.log('WAITING complete opportunity development and audits');
 while(!fs.existsSync(path.join(d,'playopportunity-ready-for-next-queue.json')))await new Promise(r=>setTimeout(r,5000));
 const ready=JSON.parse(fs.readFileSync(path.join(d,'playopportunity-ready-for-next-queue.json')));if(!ready.ok)throw Error('predecessor failed');`);
fs.writeFileSync(d+'queue-playconfirmfresh.cjs',queue);
fs.writeFileSync(d+'finish-playconfirmfresh.cjs',fs.readFileSync(d+'finish-playweightfresh.cjs','utf8').replaceAll('playweight','playconfirm'));
fs.writeFileSync(d+'audit-playconfirm-configuration.cjs',fs.readFileSync(d+'audit-playweight-configuration.cjs','utf8'));
const files=[...new Set([...Object.keys(oldA.harnessHashes),d+'freeze-playconfirm.cjs',d+'queue-playconfirmfresh.cjs',d+'finish-playconfirmfresh.cjs',d+'audit-playconfirm-configuration.cjs',...[a,b].flatMap(p=>[p+'-run.cjs','collect-'+p+'.cjs','audit-'+p+'.cjs','audit-'+p+'-runtime.cjs',p+'-resource-matrix.cjs']).map(f=>d+f)])];
const harnessHashes=Object.fromEntries(files.map(f=>[f,hash(f)])),frozenAt=new Date().toISOString();
const pairs=Array.from({length:64},(_,i)=>({seed:'codex-ai-play-confirm-20260928:'+crypto.randomBytes(12).toString('hex'),alienSeed:'codex-ai-play-confirm-aliens-20260928:'+crypto.randomBytes(12).toString('hex'),baseline:a+'-base-'+(i+1)+'.json',candidate:a+'-candidate-'+(i+1)+'.json'})),seedGeneratedAt=new Date().toISOString();
const rule='Predeclared replication after first complete64 positive but uncertain play-weight validation (+2.265625 increment, +9.613281 original). Exactly64 additional independent game/alien seeds,192 games, SAME frozen original/current011/current011+play1.60 sources and configurations/parser29. No weight retuning or opportunity-max combination. Complete all64 and audits; evaluate this cohort AND pooled128 raw paired scores together for +10 target, never add cohort means or report only favorable cohort. No extension based on intermediate results, no company gating or seed deletion. Mean first/high-score second; retain lower tail. Two browser workers following a startup-only failure in unrelated development.';
for(const[p,old,rows]of[[a,oldA,pairs],[b,oldB,pairs.map((x,i)=>({...x,baseline:b+'-base-'+(i+1)+'.json'}))]]){
 const s={...old,phase:'fresh-random-preregistered-replication',frozenAt,seedGeneratedAt,rule,scope:rule,harnessHashes,pairs:rows,companionSuite:(p===a?b:a)+'-suite.json',pooledWith:(p===a?'playweightabsolute64':'playweightincremental64')+'-suite.json',pooledPlannedPairs:128};
 fs.writeFileSync(d+p+'-suite.json',JSON.stringify(s,null,2)+'\n');fs.writeFileSync(out+p+'-fresh-plan.json',JSON.stringify(s,null,2)+'\n');
}
console.log(JSON.stringify({frozenAt,seedGeneratedAt,additionalPairs:64,pooledPlannedPairs:128,newGames:192,rule}));
