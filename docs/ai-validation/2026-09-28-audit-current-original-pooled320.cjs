const fs=require('fs'),path=require('path'),crypto=require('crypto'),cp=require('child_process'),assert=require('node:assert/strict'),d='tmp/ai-20260905/';
const read=f=>JSON.parse(fs.readFileSync(d+f+'.json')),hash=f=>crypto.createHash('sha256').update(fs.readFileSync(d+f)).digest('hex');
const pairs=[],inputs=[],seen=new Set(),suites={};
for(const prefix of ['corner','marker','cycle','scanprojection','playweight']){
 const abs=read(prefix+'absolute64-suite'),inc=read(prefix+'incremental64-suite');suites[prefix]={abs,inc};
 const q=read(prefix+'fresh-triple-queue-complete');assert.equal(q.completed.length,192);assert.equal(q.failures.length,0);assert.equal(q.pending.length,0);
 for(const name of [prefix+'absolute64',prefix+'incremental64'])assert.equal(read(name+'-payment-amounts').summary.issues.length,0);
 assert.equal(abs.pairs.length,64);assert.equal(inc.pairs.length,64);
 for(let i=0;i<64;i++){
  const a=abs.pairs[i],b=inc.pairs[i];assert.equal(a.seed,b.seed);assert.equal(a.alienSeed,b.alienSeed);assert(!seen.has(a.seed));seen.add(a.seed);
  const x=JSON.parse(fs.readFileSync(d+a.baseline)),y=JSON.parse(fs.readFileSync(d+b.baseline));
  for(const run of [x,y]){assert.equal(run.options.seed,a.seed);assert.equal(run.options.alienSeed,a.alienSeed);assert.equal(run.options.alienRandomMode,'independent-slots-v1');assert(run.summary.ok&&run.summary.gameEnded&&!run.summary.bugCount&&!run.summary.blocked);}
  inputs.push({cohort:prefix,case:i+1,original:a.baseline,current:b.baseline,originalSha256:hash(a.baseline),currentSha256:hash(b.baseline)});
  const compact=r=>({options:r.options,summary:r.summary,result:{playerResults:r.result.playerResults}});pairs.push({seed:a.seed,baseline:compact(x),candidate:compact(y)});
 }
}
const priorPath='docs/ai-validation/2026-09-28-current-original-pooled256.json',prior=JSON.parse(fs.readFileSync(priorPath));assert.equal(prior.inputs.length,256);for(let i=0;i<256;i++)assert.deepEqual(inputs[i],prior.inputs[i]);const priorEvidence={file:priorPath,sha256:crypto.createHash('sha256').update(fs.readFileSync(priorPath)).digest('hex'),scope:'Reuse completed256 exact input-hash and frozen-source verification; verify new64 frozen runtime sources separately. Old parser28 mixed-line-ending checkout has advanced, so no new claim of its exact byte reconstruction.'};const sourceComparisons=[],sourceRecovery=[];
const sourceCache=new Map();
function frozenSource(model,file){
 const key=model.commit+'/'+file;if(sourceCache.has(key))return sourceCache.get(key);
 const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
 let bytes=fs.readFileSync(path.join(d,model.root,file));
 if(sha(bytes)!==model.hashes[file]){
  const blob=cp.execFileSync('git',['show',model.commit+':'+file],{maxBuffer:15*1024*1024});
  const lf=blob.toString('utf8').replace(/\r\n/g,'\n');
  bytes=[blob,Buffer.from(lf),Buffer.from(lf.replace(/\n/g,'\r\n'))].find(b=>sha(b)===model.hashes[file]);
  if(!bytes&&file.endsWith('.test.js')){
   sourceRecovery.push({commit:model.commit,file,expectedSha256:model.hashes[file],gitBlobSha256:sha(blob),exactBytesRecovered:false,reason:'Non-runtime test checkout had mixed line endings that cannot be reconstructed uniquely. Compare frozen Git test text only; do not claim exact test-file hash recovery.'});
   sourceCache.set(key,blob);return blob;
  }
  assert(bytes,'Frozen commit cannot reproduce recorded runtime source hash '+key);
  sourceRecovery.push({commit:model.commit,file,sha256:sha(bytes),reason:'Mutable checkout advanced after the frozen queue completed; recovered exact recorded hash from frozen Git blob or its line-ending form.'});
 }
 assert.equal(sha(bytes),model.hashes[file]);sourceCache.set(key,bytes);return bytes;
}
for(const [role,key]of [['original','abs'],['current','inc']])for(const cohort of ['playweight']){
 const oldModel=suites.corner[key].models.base,newModel=suites[cohort][key].models.base,old=oldModel.hashes,fresh=newModel.hashes;
 assert.deepEqual(Object.keys(old).sort(),Object.keys(fresh).sort());
 for(const model of [oldModel,newModel])for(const file of Object.keys(model.hashes))frozenSource(model,file);
 const diff=Object.keys(old).filter(f=>old[f]!==fresh[f]),details=diff.map(file=>({file,onlyLineEndings:frozenSource(oldModel,file).toString('utf8').replace(/\r\n/g,'\n')===frozenSource(newModel,file).toString('utf8').replace(/\r\n/g,'\n')}));
 assert.deepEqual(details.filter(x=>!x.onlyLineEndings).map(x=>x.file),['randomizer/game/ai/resource-flow.js','randomizer/game/ai/resource-flow.test.js','randomizer/index.html']);
 sourceComparisons.push({role,cohorts:['corner',cohort],commits:[oldModel.commit,newModel.commit],details});
}
const compare=require('../../tools/compare_ai_score_reports').comparePairs,report=compare(pairs),cohorts=Object.fromEntries(['corner','marker','cycle','scanprojection','playweight'].map((name,i)=>[name,compare(pairs.slice(i*64,(i+1)*64))]));
const result={scope:'All320 distinct complete current011-vs-original f542 pairs from five independently frozen64-game cohorts. Original/current arms only; no b48/marker/blue/scan-projection candidate included. Prior256 completed runtime hash proof retained and every input hash rechecked; new64 runtime hashes verified against frozen sources. Policy sources identical except line endings; parser25/26/28/29 and index cache are the only semantic file differences across cohorts. Aggregate raw paired scores, never add historical gains. This reuses640 existing games and is a current target audit, not a new holdout for later models. Reports cohort differences and company/high/low distributions; resource statistics are deliberately not pooled across parsers.',pairs:320,inputs,priorEvidence,sourceComparisons,sourceRecovery,report,cohorts};
fs.writeFileSync('docs/ai-validation/2026-09-28-current-original-pooled320.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({delta:report.delta,se:report.pairedGameMeanDeltaStandardError,companies:report.companies},null,2));
