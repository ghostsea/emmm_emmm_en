const fs=require('fs'),crypto=require('crypto'),assert=require('node:assert/strict'),d='tmp/ai-20260905/',p='weakbluelifecycle',read=f=>JSON.parse(fs.readFileSync(d+f));
const suite=read(p+'-suite.json'),inputs=[],choices=[],acquisitions=[];
for(const [i,pair] of suite.pairs.entries())for(const side of ['baseline','candidate']){
 const bytes=fs.readFileSync(d+pair[side]),run=JSON.parse(bytes),r=run.result;
 assert(run.summary.ok&&run.summary.gameEnded&&!run.summary.bugCount&&!run.summary.blocked);
 assert.equal(run.options.seed,pair.seed);assert.equal(run.options.alienSeed,pair.alienSeed);
 inputs.push({case:i+1,side,file:pair[side],sha256:crypto.createHash('sha256').update(bytes).digest('hex')});
 for(const l of r.logs){
  if(l.type!=='tech-placement')continue;
  const selected=l.details?.selected;if(!selected)continue;
  const player=r.resourceFlow.players.find(x=>x.playerId===l.playerId);
  assert(player);
  const candidates=l.details.candidates||[];
  assert(Array.isArray(l.details.candidates));assert(candidates.some(x=>x.tileId===selected.tileId),'selected tech included in candidate list');
  const summarize=x=>({tile:x.tileId,score:x.score,bonus:x.bonusId,plan:x.plan,blueLifecycle:x.valueBreakdown?.blueLifecycle,blueResourceClosure:x.valueBreakdown?.blueResourceClosure});
  choices.push({case:i+1,side,player:l.playerId,company:player.industryId,round:l.roundNumber,turn:l.turnNumber,log:l.id,resources:l.playerResources,candidateCount:candidates.length,selected:summarize(selected),alternatives:candidates.filter(x=>x.tileId!==selected.tileId).map(summarize)});
  if(!['blue1','blue2'].includes(selected.tileId))continue;
  const actual=player[selected.tileId==='blue1'?'blue1CreditGain':'blue2EnergyGain'],profile=selected.valueBreakdown?.blueLifecycle;
  const expected=profile?profile.currentRewardFraction+profile.futureRounds.reduce((a,x)=>a+x.expectedCycles,0):selected.valueBreakdown?.blueResourceClosure?.expectedTriggerCount;
  acquisitions.push({case:i+1,side,player:l.playerId,company:player.industryId,tile:selected.tileId,round:l.roundNumber,expected,actual,usesNewProfile:Boolean(profile)});
 }
}
assert.equal(inputs.length,48);
const groups=[];
for(const side of ['baseline','candidate'])for(const company of [...new Set(acquisitions.map(x=>x.company))])for(const round of [1,2,3,4]){
 const xs=acquisitions.filter(x=>x.side===side&&x.company===company&&x.round===round);if(!xs.length)continue;
 groups.push({side,company,round,n:xs.length,newProfiles:xs.filter(x=>x.usesNewProfile).length,expected:xs.reduce((a,x)=>a+(x.expected||0),0),actual:xs.reduce((a,x)=>a+x.actual,0)});
}
const output={scope:'All48 games, all technology selections and their recorded alternatives. Same tile is acquired once; whole-game blue1/blue2 receipts compare to acquisition-time predictions. Acquisition-selected comparison is descriptive and includes no counterfactual reward for unselected alternatives. New expected cycles are statistical, not guaranteed data/energy budgets. No partial cohort filtering.',inputs,groups,choices,acquisitions};
fs.writeFileSync(d+p+'-choices.json',JSON.stringify(output,null,2)+'\n');console.log(JSON.stringify({games:inputs.length,choices:choices.length,acquisitions:acquisitions.length,groups},null,2));
