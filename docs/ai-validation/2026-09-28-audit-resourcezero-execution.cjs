const fs=require('fs'),assert=require('node:assert/strict'),d='tmp/ai-20260905/';
const s=JSON.parse(fs.readFileSync(d+'resourcezero-suite.json')),rows=[];
for(const [i,p]of s.pairs.entries()){
 const a=JSON.parse(fs.readFileSync(d+p.baseline)),b=JSON.parse(fs.readFileSync(d+p.candidate));
 assert(a.summary.gameEnded&&b.summary.gameEnded&&a.summary.bugCount===0&&b.summary.bugCount===0);
 assert.deepEqual(a.summary.playerScores,b.summary.playerScores);assert.equal(a.summary.steps,b.summary.steps);
 assert.deepEqual(a.result.resourceFlow.events,b.result.resourceFlow.events,'actual resource/card/movement transaction events '+(i+1));
 const brief=r=>r.logs.map(l=>({type:l.type,round:l.roundNumber,turn:l.turnNumber,player:l.playerId,message:l.message}));
 assert.deepEqual(brief(a.result),brief(b.result),'decision types/identities/messages '+(i+1));
 let valueChanges=0;for(let j=0;j<a.result.logs.length;j++)if(JSON.stringify(a.result.logs[j].details)!==JSON.stringify(b.result.logs[j].details))valueChanges++;
 rows.push({case:i+1,scores:b.summary.playerScores,steps:b.summary.steps,resourceEvents:b.result.resourceFlow.events.length,decisionMessages:b.result.logs.length,changedDetailNodes:valueChanges});
}
fs.writeFileSync(d+'resourcezero-execution-equivalence.json',JSON.stringify({scope:'All24 complete pairs: exact actual resource/card/transaction events and decision type/player/round/turn/messages equal; scores and step counts equal. Heuristic detail differences counted separately, not erased from original files. Observed fixed equivalence is not universal policy equivalence or evidence of positive score gain.',pairs:24,rows},null,2)+'\n');console.log({pairs:24,changedDetailNodes:rows.reduce((n,x)=>n+x.changedDetailNodes,0)});
