const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('node:assert/strict'),d='tmp/ai-20260905/';
const read=f=>JSON.parse(fs.readFileSync(d+f+'.json')),hash=f=>crypto.createHash('sha256').update(fs.readFileSync(d+f)).digest('hex');
const pairs=[],inputs=[],seen=new Set(),suites={};
for(const prefix of ['corner','marker']){
 const abs=read(prefix+'absolute64-suite'),inc=read(prefix+'incremental64-suite');suites[prefix]={abs,inc};
 const q=read(prefix+'fresh-triple-queue-complete');assert.equal(q.completed.length,192);assert.equal(q.failures.length,0);assert.equal(q.pending.length,0);
 for(const name of [prefix+'absolute64',prefix+'incremental64']){const payment=read(name+'-payment-amounts');assert.equal(payment.summary.issues.length,0);}
 for(let i=0;i<64;i++){
  const a=abs.pairs[i],b=inc.pairs[i];assert.equal(a.seed,b.seed);assert.equal(a.alienSeed,b.alienSeed);assert(!seen.has(a.seed));seen.add(a.seed);
  const x=JSON.parse(fs.readFileSync(d+a.baseline)),y=JSON.parse(fs.readFileSync(d+b.baseline));
  for(const run of [x,y]){assert.equal(run.options.seed,a.seed);assert.equal(run.options.alienSeed,a.alienSeed);assert.equal(run.options.alienRandomMode,'independent-slots-v1');assert(run.summary.ok&&run.summary.gameEnded&&!run.summary.bugCount&&!run.summary.blocked);}
  inputs.push({cohort:prefix,case:i+1,original:a.baseline,current:b.baseline,originalSha256:hash(a.baseline),currentSha256:hash(b.baseline)});
  const compact=r=>({options:r.options,summary:r.summary,result:{playerResults:r.result.playerResults}});pairs.push({seed:a.seed,baseline:compact(x),candidate:compact(y)});
 }
}
const sourceDifferences={};
for(const [role,key]of [['original','abs'],['current','inc']]){
 const oldModel=suites.corner[key].models.base,newModel=suites.marker[key].models.base,old=oldModel.hashes,fresh=newModel.hashes;
 const diff=[...new Set([...Object.keys(old),...Object.keys(fresh)])].filter(f=>old[f]!==fresh[f]);
 const details=diff.map(file=>{
  const oldFile=path.join(oldModel.root,file),newFile=path.join(newModel.root,file);
  assert.equal(hash(oldFile),old[file],'old frozen source '+file);assert.equal(hash(newFile),fresh[file],'new frozen source '+file);
  const oldText=fs.readFileSync(d+oldFile,'utf8'),newText=fs.readFileSync(d+newFile,'utf8');
  return {file,onlyLineEndings:oldText.replace(/\r\n/g,'\n')===newText.replace(/\r\n/g,'\n')};
 });
 assert.deepEqual(details.filter(x=>!x.onlyLineEndings).map(x=>x.file),['randomizer/game/ai/resource-flow.js','randomizer/game/ai/resource-flow.test.js','randomizer/index.html']);
 sourceDifferences[role]=details;
}
const report=require('../../tools/compare_ai_score_reports').comparePairs(pairs);
const result={scope:'Pooled all128 distinct complete paired current011-vs-original f542 games from two already frozen64-game cohorts. Only original and current arms, not either b48/marker candidate. Policy sources identical across cohorts except CRLF/LF, parser25/26 and index cache; every differing source rechecked against frozen hashes and line-ending-only differences recorded. Aggregate raw scores, do not add historical mean effects or select the more favorable cohort. This is a current target audit, not a new holdout for another model tuned after seeing these results. Company/low/high scores included; fresh validation still required for new candidates.',pairs:128,inputs,sourceDifferences,report};
fs.writeFileSync('docs/ai-validation/2026-09-28-current-original-pooled128.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({delta:report.delta,se:report.pairedGameMeanDeltaStandardError,companies:report.companies},null,2));
