const fs=require('fs'),cp=require('child_process'),d='tmp/ai-20260905/';
(async()=>{
 const expected=['cyclefresh-current-vs-original.json','cycleabsolute64-named-pickup-corrected.json','cycleincremental64-named-pickup-corrected.json','cycleabsolute64-choices.json','cycleincremental64-choices.json'];
 while(!expected.every(f=>fs.existsSync(d+f)))await new Promise(resolve=>setTimeout(resolve,5000));
 console.log(cp.execFileSync(process.execPath,[d+'archive-cyclefresh.cjs'],{encoding:'utf8',maxBuffer:4000000}));
})().catch(e=>{console.error(e);process.exitCode=1;});
