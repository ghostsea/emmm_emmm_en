const fs=require('node:fs'),path=require('node:path'),{spawn}=require('node:child_process');
const d=path.resolve('tmp/ai-20260905'),prefixes=['weightgridplay','weightgridscan','weightgridboth'];
(async()=>{
 while(!fs.existsSync(path.join(d,'scanprojectionfresh-extra-complete.json')))await new Promise(r=>setTimeout(r,5000));
 const pending=Array.from({length:24},(_,i)=>prefixes.map(p=>({prefix:p,n:i+1}))).flat(),active=new Set(),completed=[],failures=[];
 while((pending.length&&!failures.length)||active.size){
  while(pending.length&&active.size<4&&!failures.length){
   const job=pending.shift(),fd=fs.openSync(path.join(d,job.prefix+'-queue-'+job.n+'.log'),'w');
   const child=spawn(process.execPath,[path.join(d,'weightgrid-run.cjs'),job.prefix,String(job.n)],{stdio:['ignore',fd,fd],windowsHide:true});active.add(child);console.log('LAUNCHED',job.prefix,job.n,child.pid);let done=false;
   function finish(code,error){if(done)return;done=true;active.delete(child);fs.closeSync(fd);(code===0&&!error?completed:failures).push({...job,code,error});console.log('FINISHED',job.prefix,job.n,code,error||'');}
   child.on('exit',code=>finish(code));child.on('error',e=>finish(null,String(e)));
  }
  if(active.size)await new Promise(r=>setTimeout(r,5000));
 }
 fs.writeFileSync(path.join(d,'weightgrid-queue-complete.json'),JSON.stringify({completedAt:new Date().toISOString(),completed,failures,pending},null,2)+'\n');
 for(const p of prefixes)fs.writeFileSync(path.join(d,p+'-queue-complete.json'),JSON.stringify({completed:completed.filter(x=>x.prefix===p),failures,pending:pending.filter(x=>x.prefix===p)},null,2)+'\n');
 if(failures.length)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1;});
