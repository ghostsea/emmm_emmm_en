const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process'),assert=require('node:assert/strict');
const d='tmp/ai-20260905/',old=JSON.parse(fs.readFileSync(d+'tradeledger28v2-suite.json'));
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const model=old.models.candidate,root=path.resolve(d,model.root);
assert.equal(cp.execFileSync('git',['status','--porcelain'],{cwd:root,encoding:'utf8'}).trim(),'');
for(const [f,h]of Object.entries(model.hashes))assert.equal(hash(path.join(root,f)),h);
for(const [f,h]of Object.entries(old.harnessHashes))assert.equal(hash(f),h);
const weights={engine:1.3,playCard:1.44,tech:1.16,scan:1.18,route:.76,move:.74,orbitLand:1,task:1.24,final:1.34,pass:.78};
const variants={weightgridplay:{...weights,playCard:1.6},weightgridscan:{...weights,scan:1.3},weightgridboth:{...weights,playCard:1.6,scan:1.3}};
const frozenAt=new Date().toISOString();
const harnessHashes={...old.harnessHashes,...Object.fromEntries(['freeze-weightgrid.cjs','weightgrid-run.cjs','queue-weightgrid.cjs','audit-weightgrid-configuration.cjs','finish-weightgrid.cjs'].map(f=>[d+f,hash(d+f)]))};
const rule='Bounded2x2 action-weight calibration on complete24 seen development seeds: default011/parser28, playCard1.44 or1.60, scan1.18 or1.30; all other weights/companies/resources/rules identical. Three new candidate arms72 games share24 existing baseline games. Finish all variants/all24 before comparing; no optional stopping, seed deletion, posthoc company scopes or per-case parameters. Mean first, high-score distribution second; report companies, low tail and actual resource conversion. Choose at most one complete positive development variant for fresh independent validation. Do not claim +10 from development or add historical increments. Scan-projection candidate is not included. This is empirical calibration, not evidence the current weights are a rule bug.';
const plans=[];
for(const [p,w]of Object.entries(variants)){
 for(let n=1;n<=24;n++)assert(!fs.existsSync(d+p+'-candidate-'+n+'.json'),'Cannot refreeze after any candidate run');
 const candidate={...model,strategyWeights:w,fingerprint:crypto.createHash('sha256').update(JSON.stringify({hashes:model.hashes,strategyWeights:w})).digest('hex')};
 const s={phase:'seen-seed-development-weight-grid',frozenAt,seedGeneratedAt:old.seedGeneratedAt,plannedPairs:24,minimumPairs:24,newGames:24,reusedBaselineGames:24,rule,scope:rule,models:{base:{...model,strategyWeights:weights},candidate},harnessHashes,expectedStrategyWeights:{baseline:weights,candidate:w},baselineResultHashes:Object.fromEntries(old.pairs.map(x=>[x.candidate,hash(d+x.candidate)])),runtimeDifferences:[],semanticDifferences:[],pairs:old.pairs.map((x,i)=>({seed:x.seed,alienSeed:x.alienSeed,baseline:x.candidate,candidate:p+'-candidate-'+(i+1)+'.json'}))};
 fs.writeFileSync(d+p+'-suite.json',JSON.stringify(s,null,2)+'\n');
 fs.writeFileSync('docs/ai-validation/2026-09-28-'+p+'-development-plan.json',JSON.stringify(s,null,2)+'\n');plans.push({prefix:p,weights:w,sourceCommit:model.commit});
 for(const file of ['collect-scanprojection.cjs','audit-scanprojection.cjs','audit-scanprojection-runtime.cjs','scanprojection-resource-matrix.cjs']){
  let code=fs.readFileSync(d+file,'utf8').replaceAll('scanprojection',p).replaceAll('当前版扫描收益完整24组资源对照','行动权重校准完整24组资源对照');
  if(file.startsWith('collect-'))code=code.replace('const ledger=[];',"for(const [f,h]of Object.entries(s.baselineResultHashes))if(hash(path.join(dir,f))!==h)throw Error('Frozen baseline changed '+f);\nconst ledger=[];");
  fs.writeFileSync(d+file.replaceAll('scanprojection',p),code);
 }
}
fs.writeFileSync('docs/ai-validation/2026-09-28-weightgrid-design.json',JSON.stringify({frozenAt,rule,variants:plans,baseline:weights,newGames:72,uniqueGamesIncludingBaseline:96,selection:'Select only after all72 and audits complete. At most one positive-mean candidate; high-score distribution is secondary, company/low-tail risks retained. Source/default unchanged pending separate fresh validation.'},null,2)+'\n');
console.log(JSON.stringify({frozenAt,variants:plans,newGames:72}));
