const fs=require('fs'),assert=require('node:assert/strict'),crypto=require('crypto'),d='tmp/ai-20260905/';
const clean=v=>Array.isArray(v)?v.map(clean):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).filter(([k])=>!['createdAt','placedAt'].includes(k)).map(([k,x])=>[k,clean(x)])):v;
(async()=>{while(!fs.existsSync(d+'resourcezero-queue-complete.json'))await new Promise(r=>setTimeout(r,5000));
 const q=JSON.parse(fs.readFileSync(d+'resourcezero-queue-complete.json'));assert.equal(q.completed.length,48);assert.equal(q.failures.length,0);
 const rows=[];for(let i=1;i<=24;i++){
  const files=['strategyreserve-base-'+i+'.json','resourcezero-base-'+i+'.json'],bytes=files.map(f=>fs.readFileSync(d+f)),[old,r]=bytes.map(b=>JSON.parse(b));
  assert(r.summary.ok&&r.summary.gameEnded&&r.summary.bugCount===0);assert.equal(r.options.seed,old.options.seed);assert.equal(r.options.alienSeed,old.options.alienSeed);
  assert.deepEqual(r.summary.playerScores,old.summary.playerScores);assert.equal(r.summary.steps,old.summary.steps);assert.deepEqual(clean(r.result.logs),clean(old.result.logs));
  rows.push({case:i,files,sha256:bytes.map(b=>crypto.createHash('sha256').update(b).digest('hex')),steps:r.summary.steps,scores:r.summary.playerScores,semanticLogs:r.result.logs.length});
 }
 fs.writeFileSync(d+'resourcezero-baseline-semantic-replay.json',JSON.stringify({scope:'All24 current accepted baseline replays compared to original parser23 files. Same complete semantic AI logs excluding wall-clock timestamps, scores and steps. Parser25 source/report changes are not treated as strategy changes.',cases:24,rows},null,2)+'\n');console.log('All24 baseline semantic replays identical');
})().catch(e=>{console.error(e);process.exitCode=1;});
