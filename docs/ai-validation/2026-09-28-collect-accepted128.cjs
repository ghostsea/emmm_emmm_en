const fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),crypto=require('crypto'),d='tmp/ai-20260905/';
const read=n=>JSON.parse(fs.readFileSync(d+n+'.json'));
const audit=read('accepted128-source-audit');for(const row of audit.rows)assert.deepEqual(row.changed,['randomizer/game/ai/resource-flow.js','randomizer/game/ai/resource-flow.test.js','randomizer/index.html']);
const q=read('repeatfresh-triple-queue-complete');assert.equal(q.completed.length,192);assert.equal(q.failures.length,0);
const old=read('probeabsolute64-suite'),original=read('repeatabsolute64-suite'),current=read('repeatincremental64-suite'),pairs=[],inputs=[];
const compact=file=>{const bytes=fs.readFileSync(d+file),r=JSON.parse(bytes);inputs.push({file,sha256:crypto.createHash('sha256').update(bytes).digest('hex')});return {options:r.options,summary:r.summary,result:{playerResults:r.result.playerResults}};};
assert.equal(old.pairs.length,64);assert.equal(original.pairs.length,64);assert.equal(current.pairs.length,64);
for(const p of old.pairs)pairs.push({seed:p.seed,baseline:compact(p.baseline),candidate:compact(p.candidate)});
for(let i=0;i<64;i++){const a=original.pairs[i],b=current.pairs[i];assert.equal(a.seed,b.seed);assert.equal(a.alienSeed,b.alienSeed);pairs.push({seed:a.seed,baseline:compact(a.baseline),candidate:compact(b.baseline)});}
const report=require(path.resolve('tools/compare_ai_score_reports')).comparePairs(pairs);
const result={scope:'All128 independent paired games of the same original and accepted-default policies, two complete64 blocks. The earlier block helped select the accepted policy and is not a new untouched holdout for that policy. Pooled descriptive precision, not a wholly selection-free confirmation. Current DLC20 candidate excluded; no historical mean increments added. Source differences limited to parser migration/cache/test; semantic replay checked at freeze.',report,sourceAudit:audit,inputs,
 blocks:[{source:'probeabsolute64',pairs:64,role:'earlier adopted-policy validation'}, {source:'repeatfresh-current-vs-original',pairs:64,role:'new independent replication of unchanged accepted policy'}]};
fs.writeFileSync(d+'accepted128-results.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({meanDelta:report.delta.mean,se:report.pairedGameMeanDeltaStandardError,companies:report.companies},null,2));
