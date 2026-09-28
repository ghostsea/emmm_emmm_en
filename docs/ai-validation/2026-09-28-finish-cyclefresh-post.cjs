const fs=require('fs'),path=require('path'),cp=require('child_process'),assert=require('node:assert/strict'),d='tmp/ai-20260905/',read=n=>JSON.parse(fs.readFileSync(d+n+'.json'));
(async()=>{
 const prefixes=['cycleabsolute64','cycleincremental64'];
 while(!fs.existsSync(d+'cyclefresh-triple-queue-complete.json')||!prefixes.every(p=>fs.existsSync(d+p+'-payment-amounts.json')))await new Promise(r=>setTimeout(r,5000));
 const q=read('cyclefresh-triple-queue-complete');assert.equal(q.completed.length,192);assert.equal(q.failures.length,0);assert.equal(q.pending.length,0);
 for(const prefix of prefixes)for(const tool of ['audit-cyclefresh-choices.cjs','audit-named-pickup-suite.cjs'])console.log(cp.execFileSync(process.execPath,[d+tool,prefix],{encoding:'utf8',maxBuffer:4000000}));
 const a=read('cycleabsolute64-suite'),b=read('cycleincremental64-suite'),pairs=[];
 for(let i=0;i<64;i++){assert.equal(a.pairs[i].seed,b.pairs[i].seed);assert.equal(a.pairs[i].alienSeed,b.pairs[i].alienSeed);assert.equal(a.pairs[i].candidate,b.pairs[i].candidate);const compact=run=>({options:run.options,summary:run.summary,result:{playerResults:run.result.playerResults}});pairs.push({seed:a.pairs[i].seed,baseline:compact(read(a.pairs[i].baseline.replace(/\.json$/,''))),candidate:compact(read(b.pairs[i].baseline.replace(/\.json$/,'')))});}
 const report=require(path.resolve('tools/compare_ai_score_reports')).comparePairs(pairs);
 fs.writeFileSync(d+'cyclefresh-current-vs-original.json',JSON.stringify({scope:'All64 fresh triples, direct current011 vs original f542 policy, both parser26. No historical mean addition. Shared candidate is counted once.',report},null,2)+'\n');
 for(const p of prefixes){const r=read(p+'-complete').report;console.log(JSON.stringify({comparison:p,delta:r.delta,se:r.pairedGameMeanDeltaStandardError,companies:r.companies},null,2));}
})().catch(e=>{console.error(e);process.exitCode=1;});
