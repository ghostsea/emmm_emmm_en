const fs=require('fs'),crypto=require('crypto'),assert=require('node:assert/strict'),d='tmp/ai-20260905/';
const read=f=>JSON.parse(fs.readFileSync(d+f)),old=read('resourcezero-suite.json'),fresh=read('bluelifecycle-suite.json'),rows=[];
const action=l=>({type:l.type,player:l.playerId,round:l.roundNumber,turn:l.turnNumber,rawTurn:l.rawTurnNumber,resources:l.playerResources,details:l.details});
const hash=f=>crypto.createHash('sha256').update(fs.readFileSync(d+f)).digest('hex');
assert.equal(old.pairs.length,24);assert.equal(fresh.pairs.length,24);
for(let i=0;i<24;i++){
 const a=old.pairs[i],b=fresh.pairs[i];assert.equal(a.seed,b.seed);assert.equal(a.alienSeed,b.alienSeed);
 const x=read(a.candidate),y=read(b.baseline);
 for(const r of [x,y]){assert(r.summary.ok&&r.summary.gameEnded&&!r.summary.blocked&&!r.summary.bugCount);assert.equal(r.options.seed,a.seed);assert.equal(r.options.alienSeed,a.alienSeed);}
 assert.deepEqual(x.summary.playerScores,y.summary.playerScores,'same scores case'+(i+1));
 assert.equal(x.summary.steps,y.summary.steps,'same steps case'+(i+1));
 assert.deepEqual(x.result.logs.map(action),y.result.logs.map(action),'same observed choices/resources case'+(i+1));
 rows.push({case:i+1,old:a.candidate,current:b.baseline,oldSha256:hash(a.candidate),currentSha256:hash(b.baseline),scores:y.summary.playerScores,steps:y.summary.steps,logs:y.result.logs.length});
}
const result={scope:'All24 fixed baseline replays: parser26 vs prior parser25 current011 policy. Exact game/alien seeds, same scores/steps, every log type/player/round/turn/resources/details. Timestamps and resourceFlow statistical parsing intentionally excluded. This proves observed trajectory equivalence for these24 games, not all possible games.',pairs:24,issues:[],rows};
fs.writeFileSync(d+'bluelifecycle-baseline-replay.json',JSON.stringify(result,null,2)+'\n');console.log({pairs:24,issues:0});
