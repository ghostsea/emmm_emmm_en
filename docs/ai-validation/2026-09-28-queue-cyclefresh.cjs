const fs=require('fs'),path=require('path'),{spawn}=require('child_process'),d=path.resolve('tmp/ai-20260905'),a='cycleabsolute64',b='cycleincremental64';
for(const p of[a,b])for(const suffix of ['-suite.json','-run.cjs'])if(!fs.existsSync(path.join(d,p+suffix)))throw Error('Freeze/preflight incomplete: '+p+suffix);
const pending=Array.from({length:64},(_,i)=>[[a,'base',i+1],[a,'candidate',i+1],[b,'base',i+1]]).flat(),active=new Set(),completed=[],failures=[];
(async()=>{
 while((pending.length&&!failures.length)||active.size){
  while(pending.length&&active.size<4&&!failures.length){const[p,model,n]=pending.shift(),fd=fs.openSync(path.join(d,p+'-queue-'+model+'-'+n+'.log'),'w'),child=spawn(process.execPath,[path.join(d,p+'-run.cjs'),model,String(n)],{stdio:['ignore',fd,fd],windowsHide:true});active.add(child);console.log('LAUNCHED',p,model,n,child.pid);let settled=false;function finish(code,error){if(settled)return;settled=true;active.delete(child);fs.closeSync(fd);(code===0&&!error?completed:failures).push({prefix:p,model,n,code,error});console.log('FINISHED',p,model,n,code,error||'',new Date().toISOString());}child.on('exit',code=>finish(code));child.on('error',e=>finish(null,String(e)));}
  if(active.size)await new Promise(r=>setTimeout(r,5000));
 }
 for(const p of[a,b])fs.writeFileSync(path.join(d,p+'-queue-complete.json'),JSON.stringify({completedAt:new Date().toISOString(),completed:completed.filter(x=>x.prefix===p),failures,pending:pending.filter(x=>x[0]===p)},null,2));
 fs.writeFileSync(path.join(d,'cyclefresh-triple-queue-complete.json'),JSON.stringify({completed,failures,pending},null,2));if(failures.length)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
