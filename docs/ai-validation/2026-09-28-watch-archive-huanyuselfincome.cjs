const fs=require('fs'),cp=require('child_process'),d='tmp/ai-20260905/';
(async()=>{
 while(!fs.existsSync(d+'huanyuselfincome-named-pickup-corrected.json'))await new Promise(r=>setTimeout(r,5000));
 console.log(cp.execFileSync(process.execPath,[d+'archive-huanyuselfincome.cjs'],{encoding:'utf8',maxBuffer:4000000}));
})().catch(e=>{console.error(e);process.exitCode=1;});
