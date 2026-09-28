const fs=require('fs'),cp=require('child_process'),d='tmp/ai-20260905/',p='weakbluelifecycle';
async function main(){
 while(!fs.existsSync(d+p+'-queue-complete.json'))await new Promise(r=>setTimeout(r,5000));
 while(!JSON.parse(fs.readFileSync(d+p+'-suite.json')).pairs.every(pair=>fs.existsSync(d+pair.baseline)&&fs.existsSync(d+pair.candidate)))await new Promise(r=>setTimeout(r,5000));
 const q=JSON.parse(fs.readFileSync(d+p+'-queue-complete.json'));if(q.completed.length!==24||q.failures.length||q.pending.length)throw Error('incomplete');
 for(const args of [['collect-'+p+'.cjs'],['audit-'+p+'.cjs'],['audit-'+p+'-runtime.cjs'],[p+'-resource-matrix.cjs'],['audit-scan-configuration.cjs',p],['audit-paired-score-cohorts.cjs',p],['audit-currentcombined-aid.cjs',p],['audit-card-payment-amounts.cjs',p]]){
  const output=cp.execFileSync(process.execPath,[d+args[0],...args.slice(1)],{encoding:'utf8',maxBuffer:10000000});fs.writeFileSync(d+p+'-audit-'+args[0]+'.log',output);console.log('PASS',args.join(' '));
 }
 const r=JSON.parse(fs.readFileSync(d+p+'-complete.json')).report;console.log(JSON.stringify({delta:r.delta,baseline:r.baseline,candidate:r.candidate,companies:r.companies},null,2));
}
main().catch(e=>{console.error(e);process.exitCode=1;});
