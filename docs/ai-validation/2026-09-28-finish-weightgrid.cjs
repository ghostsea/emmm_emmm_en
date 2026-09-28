const fs=require('node:fs'),cp=require('node:child_process'),assert=require('node:assert/strict'),d='tmp/ai-20260905/';
(async()=>{
 while(!fs.existsSync(d+'weightgrid-queue-complete.json'))await new Promise(r=>setTimeout(r,5000));
 const q=JSON.parse(fs.readFileSync(d+'weightgrid-queue-complete.json'));assert.equal(q.completed.length,72);assert.equal(q.failures.length,0);assert.equal(q.pending.length,0);
 for(const p of ['weightgridplay','weightgridscan','weightgridboth'])for(const args of [['collect-'+p+'.cjs'],['audit-'+p+'.cjs'],['audit-'+p+'-runtime.cjs'],[p+'-resource-matrix.cjs'],['audit-weightgrid-configuration.cjs',p],['audit-paired-score-cohorts.cjs',p],['audit-currentcombined-aid.cjs',p],['audit-card-payment-amounts.cjs',p],['audit-scanyield-scans.cjs',p]]){
  const output=cp.execFileSync(process.execPath,[d+args[0],...args.slice(1)],{encoding:'utf8',maxBuffer:10000000});fs.writeFileSync(d+p+'-'+args[0]+'.log',output);console.log('PASS',p,args[0]);
 }
 fs.writeFileSync(d+'weightgrid-audits-complete.json',JSON.stringify({completedAt:new Date().toISOString(),issues:[]},null,2)+'\n');console.log('ALL72 COMPLETE AND AUDITED');
})().catch(e=>{console.error(e);process.exitCode=1;});
