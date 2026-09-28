const fs=require('fs'),path=require('path'),crypto=require('crypto'),cp=require('child_process'),assert=require('node:assert/strict');
const d='tmp/ai-20260905/',p='playopportunity',old=JSON.parse(fs.readFileSync(d+'tradeledger28v2-suite.json'));
const hash=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
assert(!fs.existsSync(d+p+'-suite.json'),'already frozen');
const snapshot=root=>{const cwd=path.resolve(d,root);assert.equal(cp.execFileSync('git',['status','--porcelain'],{cwd,encoding:'utf8'}).trim(),'');const hashes=Object.fromEntries(Object.keys(old.models.candidate.hashes).map(f=>[f,hash(path.join(cwd,f))]));return {root,commit:cp.execFileSync('git',['rev-parse','HEAD'],{cwd,encoding:'utf8'}).trim(),hashes,fingerprint:hash(path.join(cwd,'randomizer/app/ai-controller.js'))};};
const base=snapshot('card-trade-ledger28'),candidate=snapshot('weak-company-blue-lifecycle');
const differences=Object.keys(base.hashes).filter(f=>base.hashes[f]!==candidate.hashes[f]);
const semanticDifferences=differences.filter(f=>fs.readFileSync(path.resolve(d,base.root,f),'utf8').replace(/\r\n/g,'\n')!==fs.readFileSync(path.resolve(d,candidate.root,f),'utf8').replace(/\r\n/g,'\n'));
assert.deepEqual(semanticDifferences.sort(),['randomizer/app/ai-controller.js','randomizer/app/ai-controller.test.js','randomizer/index.html'].sort());
assert.equal(fs.readFileSync(path.resolve(d,base.root,'randomizer/game/ai/resource-flow.js'),'utf8').replace(/\r\n/g,'\n'),fs.readFileSync(path.resolve(d,candidate.root,'randomizer/game/ai/resource-flow.js'),'utf8').replace(/\r\n/g,'\n'));
for(const name of ['scanprojection-run.cjs','collect-scanprojection.cjs','audit-scanprojection.cjs','audit-scanprojection-runtime.cjs','scanprojection-resource-matrix.cjs','finish-scanprojection.cjs','queue-scanprojection.cjs']){
 let code=fs.readFileSync(d+name,'utf8').replaceAll('scanprojection',p).replaceAll('当前版扫描收益完整24组资源对照','打牌机会成本完整24组资源对照');
 if(name.startsWith('queue-'))code=code.replace("[['candidate',i+1]]","[['base',i+1],['candidate',i+1]]").replaceAll('markerfresh-triple','playweightfresh-triple');
 if(name.startsWith('finish-'))code=code.replace('q.completed.length!==24','q.completed.length!==48');
 fs.writeFileSync(d+name.replaceAll('scanprojection',p),code);
}
const harnessFiles=[...new Set([...Object.keys(old.harnessHashes),d+'freeze-playopportunity.cjs',...[p+'-run.cjs','collect-'+p+'.cjs','audit-'+p+'.cjs','audit-'+p+'-runtime.cjs',p+'-resource-matrix.cjs','finish-'+p+'.cjs','queue-'+p+'.cjs'].map(f=>d+f)])];
const rule='Full24 seen fixed development pairs,48 NEW games with both arms parser29 and current default011 weights. Candidate changes only opportunity penalty inside play-card value to maximum of existing corner/scan/income values; shared corner scoring unchanged, no replacement-income subtraction, no weight increase or scan projection. Play-value callers including selection indirectly affected. All24 and runtime/resource/payment audits required, mean first/high-score second, retain company and lower tail. No company gating or optional stopping. Positive development required before genuinely new random validation; no claim toward+10 from development.';
const s={phase:'seen-seed-development',frozenAt:new Date().toISOString(),seedGeneratedAt:old.seedGeneratedAt,plannedPairs:24,minimumPairs:24,newGames:48,reusedBaselineGames:0,rule,scope:rule,models:{base,candidate},runtimeDifferences:differences,semanticDifferences,harnessHashes:Object.fromEntries(harnessFiles.map(f=>[f,hash(f)])),baselineResultHashes:{},pairs:old.pairs.map((x,i)=>({seed:x.seed,alienSeed:x.alienSeed,baseline:p+'-base-'+(i+1)+'.json',candidate:p+'-candidate-'+(i+1)+'.json'}))};
fs.writeFileSync(d+p+'-suite.json',JSON.stringify(s,null,2)+'\n');fs.writeFileSync('docs/ai-validation/2026-09-28-'+p+'-development-plan.json',JSON.stringify(s,null,2)+'\n');
console.log(JSON.stringify({frozenAt:s.frozenAt,newGames:s.newGames,base:base.commit,candidate:candidate.commit}));
