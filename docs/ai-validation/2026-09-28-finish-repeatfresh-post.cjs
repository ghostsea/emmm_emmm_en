const fs=require('fs'),path=require('path'),cp=require('child_process'),assert=require('node:assert/strict');
const d='tmp/ai-20260905/',read=n=>JSON.parse(fs.readFileSync(d+n+'.json'));
(async()=>{
 const prefixes=['repeatabsolute64','repeatincremental64'];
 while(!fs.existsSync(d+'repeatfresh-triple-queue-complete.json')||!prefixes.every(p=>fs.existsSync(d+p+'-payment-amounts.json')))await new Promise(r=>setTimeout(r,5000));
 const q=read('repeatfresh-triple-queue-complete');assert.equal(q.completed.length,192);assert.equal(q.failures.length,0);assert.equal(q.pending.length,0);
 for(const p of prefixes)for(const name of ['audit-incomeformula-suite.cjs','audit-repeat-receipts.cjs']){
  const out=cp.execFileSync(process.execPath,[d+name,p],{encoding:'utf8',maxBuffer:1000000});console.log(p,name,out.trim());
 }
 const absolute=read('repeatabsolute64-suite'),incremental=read('repeatincremental64-suite'),pairs=[];
 for(let i=0;i<64;i++){
  const a=absolute.pairs[i],b=incremental.pairs[i];assert.equal(a.seed,b.seed);assert.equal(a.alienSeed,b.alienSeed);assert.equal(a.candidate,b.candidate);
  const baseline=JSON.parse(fs.readFileSync(d+a.baseline)),candidate=JSON.parse(fs.readFileSync(d+b.baseline));
  const compact=run=>({options:run.options,summary:run.summary,result:{playerResults:run.result.playerResults}});
  pairs.push({seed:a.seed,baseline:compact(baseline),candidate:compact(candidate)});
 }
 const report=require(path.resolve('tools/compare_ai_score_reports')).comparePairs(pairs);
 fs.writeFileSync(d+'repeatfresh-current-vs-original.json',JSON.stringify({scope:'Full same64 triples, reused original/current arms only; independent direct accepted-policy comparison, not subtraction of historical means or standard errors. No additional games.',report},null,2)+'\n');
 for(const p of prefixes){const r=read(p+'-complete').report;console.log(JSON.stringify({comparison:p,delta:r.delta,se:r.pairedGameMeanDeltaStandardError,companies:r.companies},null,2));}
 console.log(JSON.stringify({comparison:'accepted-current-vs-original',delta:report.delta,se:report.pairedGameMeanDeltaStandardError,companies:report.companies},null,2));
})().catch(e=>{console.error(e);process.exitCode=1;});
