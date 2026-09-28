const fs=require('fs'),cp=require('child_process'),d='tmp/ai-20260905/';
(async()=>{
 while(!fs.existsSync(d+'probefresh-triple-queue-complete.json'))await new Promise(r=>setTimeout(r,5000));
 const q=JSON.parse(fs.readFileSync(d+'probefresh-triple-queue-complete.json'));if(q.completed.length!==192||q.failures.length||q.pending.length)throw Error('Incomplete192');
 for(const p of ['probeabsolute64','probeincremental64']){const output=cp.execFileSync(process.execPath,[d+'audit-card-payment-amounts.cjs',p],{encoding:'utf8',maxBuffer:10000000});fs.writeFileSync(d+p+'-payment-amounts.log',output);console.log('PASS',p);}
})().catch(e=>{console.error(e);process.exitCode=1});
