const fs=require('fs'),path=require('path'),{spawn}=require('child_process'),assert=require('node:assert/strict'),d=path.resolve('tmp/ai-20260905'),p='bluelifecycle';
const pending=Array.from({length:24},(_,i)=>[['base',i+1],['candidate',i+1]]).flat(),active=new Set(),completed=[],failures=[];
(async()=>{
 const prior=path.join(d,'markerfresh-triple-queue-complete.json');
 console.log('WAITING marker triple queue to release four workers');
 while(!fs.existsSync(prior))await new Promise(r=>setTimeout(r,5000));
 const q=JSON.parse(fs.readFileSync(prior));assert.equal(q.completed.length,192);assert.equal(q.failures.length,0);assert.equal(q.pending.length,0);
 while((pending.length&&!failures.length)||active.size){
  while(pending.length&&active.size<4&&!failures.length){const[model,n]=pending.shift(),fd=fs.openSync(path.join(d,p+'-queue-'+model+'-'+n+'.log'),'w'),child=spawn(process.execPath,[path.join(d,p+'-run.cjs'),model,String(n)],{stdio:['ignore',fd,fd],windowsHide:true});active.add(child);console.log('LAUNCHED',model,n,child.pid);let settled=false;function finish(code,error){if(settled)return;settled=true;active.delete(child);fs.closeSync(fd);(code===0&&!error?completed:failures).push({model,n,code,error});console.log('FINISHED',model,n,code,error||'',new Date().toISOString());}child.on('exit',code=>finish(code));child.on('error',e=>finish(null,String(e)));}
  if(active.size)await new Promise(r=>setTimeout(r,5000));
 }
 fs.writeFileSync(path.join(d,p+'-queue-complete.json'),JSON.stringify({completedAt:new Date().toISOString(),completed,failures,pending},null,2));if(failures.length)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
