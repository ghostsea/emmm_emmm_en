const fs=require('fs'),cp=require('child_process'),assert=require('node:assert/strict');
const d='tmp/ai-20260905/',out='docs/ai-validation/2026-09-28-',prefixes=['playweightabsolute64','playweightincremental64'],read=n=>JSON.parse(fs.readFileSync(d+n+'.json'));
(async()=>{
 while(!fs.existsSync(d+'playweightfresh-triple-queue-complete.json'))await new Promise(r=>setTimeout(r,5000));
 const q=read('playweightfresh-triple-queue-complete');assert.equal(q.completed.length,192);assert.equal(q.failures.length,0);assert.equal(q.pending.length,0);
 const rows=[];
 for(const p of prefixes){
  for(const args of [['collect-'+p+'.cjs'],['audit-'+p+'.cjs'],['audit-'+p+'-runtime.cjs'],[p+'-resource-matrix.cjs'],['audit-playweight-configuration.cjs',p],['audit-paired-score-cohorts.cjs',p],['audit-currentcombined-aid.cjs',p],['audit-card-payment-amounts.cjs',p],['audit-scanyield-scans.cjs',p]]){const log=cp.execFileSync(process.execPath,[d+args[0],...args.slice(1)],{encoding:'utf8',maxBuffer:10000000});fs.writeFileSync(d+p+'-'+args[0]+'.log',log);console.log('PASS',p,args[0]);}
  const r=read(p+'-complete').report;rows.push({prefix:p,baseline:r.baseline,candidate:r.candidate,delta:r.delta,se:r.pairedGameMeanDeltaStandardError,companies:r.companies});
  for(const suffix of ['complete','accounting-audit','runtime-audit','configuration-audit','paired-cohorts','aid-audit','payment-amounts','scan-audit','resource-matrix','queue-complete'])fs.copyFileSync(d+p+'-'+suffix+'.json',out+p+'-'+suffix+'.json');fs.copyFileSync(d+p+'-resource-matrix.md',out+p+'-resource-matrix.md');
 }
 const suites=prefixes.map(readPrefix=>read(readPrefix+'-suite')),compact=r=>({options:r.options,summary:r.summary,result:{playerResults:r.result.playerResults}}),pairs=suites[0].pairs.map((x,i)=>{const y=suites[1].pairs[i];assert.equal(x.seed,y.seed);assert.equal(x.alienSeed,y.alienSeed);return{seed:x.seed,baseline:compact(JSON.parse(fs.readFileSync(d+x.baseline))),candidate:compact(JSON.parse(fs.readFileSync(d+y.baseline)))};});
 const direct=require('../../tools/compare_ai_score_reports').comparePairs(pairs);
 fs.writeFileSync(out+'playweightfresh-current-vs-original.json',JSON.stringify({scope:'Direct current-original same64;128 of existing192 games, no extra games.',report:direct},null,2)+'\n');
 fs.writeFileSync(out+'playweightfresh-results.json',JSON.stringify({completedAt:new Date().toISOString(),status:'complete-pending-review',newGames:192,rows,issues:[]},null,2)+'\n');fs.copyFileSync(d+'playweightfresh-triple-queue-complete.json',out+'playweightfresh-triple-queue-complete.json');
 console.log(JSON.stringify(rows,null,2));
})().catch(e=>{console.error(e);process.exitCode=1;});
