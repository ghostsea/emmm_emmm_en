const fs=require('fs'),cp=require('child_process'),assert=require('node:assert/strict'),d='tmp/ai-20260905/';
(async()=>{
 while(!fs.existsSync(d+'cyclefresh-triple-queue-complete.json'))await new Promise(r=>setTimeout(r,5000));
 const q=JSON.parse(fs.readFileSync(d+'cyclefresh-triple-queue-complete.json'));
 assert.equal(q.completed.length,192);assert.equal(q.failures.length,0);assert.equal(q.pending.length,0);
 console.log('START independent fixed self-income queue',new Date().toISOString());
 await new Promise((resolve,reject)=>{const child=cp.spawn(process.execPath,[d+'queue-huanyuselfincome.cjs'],{stdio:'inherit',windowsHide:true});child.on('error',reject);child.on('exit',code=>code===0?resolve():reject(Error('queue exit '+code)));});
})().catch(e=>{console.error(e);process.exitCode=1;});
