const fs=require('fs'),cp=require('child_process'),assert=require('node:assert/strict'),d='tmp/ai-20260905/',p='huanyuselfincome';
(async()=>{
 while(!fs.existsSync(d+p+'-payment-amounts.json'))await new Promise(r=>setTimeout(r,5000));
 const q=JSON.parse(fs.readFileSync(d+p+'-queue-complete.json'));assert.equal(q.completed.length,24);assert.equal(q.failures.length,0);assert.equal(q.pending.length,0);
 for(const tool of ['audit-self-income-receipts.cjs','audit-named-pickup-suite.cjs'])console.log(cp.execFileSync(process.execPath,[d+tool,p],{encoding:'utf8',maxBuffer:4000000}));
})().catch(e=>{console.error(e);process.exitCode=1;});
