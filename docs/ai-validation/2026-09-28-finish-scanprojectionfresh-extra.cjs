const fs=require('fs'),cp=require('child_process'),d='tmp/ai-20260905/';
(async()=>{
 for(const p of ['scanprojectionabsolute64','scanprojectionincremental64']){
  while(!fs.existsSync(d+p+'-payment-amounts.json'))await new Promise(r=>setTimeout(r,5000));
  for(const args of [['audit-scanyield-scans.cjs',p],['audit-scanprojection-followup.cjs',p]]){
   const output=cp.execFileSync(process.execPath,[d+args[0],...args.slice(1)],{encoding:'utf8',maxBuffer:2000000});fs.writeFileSync(d+p+'-'+args[0]+'.log',output);console.log('PASS',...args);
  }
 }
 fs.writeFileSync(d+'scanprojectionfresh-extra-complete.json',JSON.stringify({completedAt:new Date().toISOString(),issues:[]},null,2)+'\n');console.log('ALL EXTRA AUDITS COMPLETE');
})().catch(e=>{console.error(e);process.exitCode=1;});
