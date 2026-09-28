const fs=require('fs'),path=require('path'),{spawn}=require('child_process'),assert=require('node:assert/strict');
const d=path.resolve('tmp/ai-20260905'),p='playopportunity',read=n=>JSON.parse(fs.readFileSync(path.join(d,n)));
const failed=read(p+'-queue-complete.json');
assert.equal(failed.failures.length,1);assert.equal(failed.failures[0].model,'base');assert.equal(failed.failures[0].n,6);
assert(!fs.existsSync(path.join(d,p+'-base-6.json')),'Do not overwrite a game result');
assert(fs.readFileSync(path.join(d,p+'-base-6.json.log'),'utf8').includes('startup={"readyState":"complete","hasSetiRandomizer":false,"hasBatch":false,"bodyText":""}'));
fs.copyFileSync(path.join(d,p+'-queue-complete.json'),path.join(d,p+'-startup-failed-queue.json'));
fs.copyFileSync(path.join(d,p+'-base-6.json.log'),path.join(d,p+'-base-6-startup-failure.log'));
const pending=[['base',6],...failed.pending],active=new Set(),completed=[...failed.completed],failures=[];
(async()=>{
 while((pending.length&&!failures.length)||active.size){
  while(pending.length&&active.size<2&&!failures.length){
   const [model,n]=pending.shift(),fd=fs.openSync(path.join(d,p+'-recovery-'+model+'-'+n+'.log'),'w');
   const child=spawn(process.execPath,[path.join(d,p+'-run.cjs'),model,String(n)],{stdio:['ignore',fd,fd],windowsHide:true});active.add(child);console.log('LAUNCHED',model,n,child.pid);
   let settled=false;const finish=(code,error)=>{if(settled)return;settled=true;active.delete(child);fs.closeSync(fd);(code===0&&!error?completed:failures).push({model,n,code,error});console.log('FINISHED',model,n,code,error||'');};child.on('exit',code=>finish(code));child.on('error',e=>finish(null,String(e)));
  }
  if(active.size)await new Promise(r=>setTimeout(r,5000));
 }
 const result={completedAt:new Date().toISOString(),completed,failures,pending,recovery:{originalFailure:p+'-startup-failed-queue.json',failedBeforeGame:true,retriedSameFrozenSeedAndModel:true,workerLimit:2,reason:'Browser startup returned empty page before game API loaded. Original logs retained; no game result existed. Reduce concurrent browsers; no source, seed or game option changes.'}};
 fs.writeFileSync(path.join(d,p+'-queue-complete.json'),JSON.stringify(result,null,2)+'\n');fs.writeFileSync(path.join(d,p+'-recovery-complete.json'),JSON.stringify(result,null,2)+'\n');if(failures.length)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1;});
