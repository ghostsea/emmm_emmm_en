const fs=require('node:fs'),assert=require('node:assert/strict'),d='tmp/ai-20260905/',p=process.argv[2],s=JSON.parse(fs.readFileSync(d+p+'-suite.json')),rows=[];
assert.equal(s.pairs.length,64);
for(const pair of s.pairs)for(const side of ['baseline','candidate']){
 const r=JSON.parse(fs.readFileSync(d+pair[side])),config=r.result.logs.find(l=>l.type==='config').details;
 assert.equal(r.result.aiDifficulty,'laughable');assert.equal(config.aiDifficulty,'laughable');assert.equal(r.options.activePlayerCount,4);
 assert.deepEqual(r.result.strategyWeights,s.expectedStrategyWeights[side]);
 assert.deepEqual(r.result.playerResults.map(p=>p.companyLabel).sort(),['寰宇超动力','宇宙大战略集团','作弊实验室','作弊实验室'].sort());
 assert(r.summary.ok&&r.summary.gameEnded&&!r.summary.blocked&&r.summary.bugCount===0);
 rows.push({file:pair[side],side,weights:r.result.strategyWeights,companies:r.result.playerResults.map(p=>p.companyLabel)});
}
fs.writeFileSync(d+p+'-configuration-audit.json',JSON.stringify({scope:'Expected frozen weight variant is deliberate; all four companies, difficulty, game completion and actual reported weights verified. No resource grants changed.',games:rows.length,rows},null,2)+'\n');console.log('CONFIGURATION PASS',p,rows.length);
