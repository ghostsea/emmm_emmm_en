const fs=require('fs'),assert=require('node:assert/strict'),d='tmp/ai-20260905/',p='strategyreserve';
const q=JSON.parse(fs.readFileSync(d+p+'-queue-complete.json'));assert.equal(q.completed.length,48);assert.equal(q.failures.length,0);assert.equal(q.pending.length,0);
const s=JSON.parse(fs.readFileSync(d+p+'-suite.json')),rows=[],penalizedPlays={baseline:[],candidate:[]};
const semantic=value=>JSON.stringify(value,(k,v)=>['createdAt','placedAt'].includes(k)?undefined:v);
const event=e=>e?{player:e.playerId,entry:e.entryId,step:e.stepIndex,round:e.roundNumber,turn:e.turnNumber,pace:e.pace,text:e.sourceDetail,action:e.mainActionType,resources:e.resourceDeltas,income:e.incomeDeltas,cards:e.cards,tech:e.techIds}:null;
const first=(a,b,view)=>{let i=0;while(i<Math.min(a.length,b.length)&&semantic(view(a[i]))===semantic(view(b[i])))i++;return{same:i===a.length&&i===b.length,prefix:i,before:view(a[i]),after:view(b[i])};};
const log=l=>l?{id:l.id,type:l.type,player:l.playerId,round:l.roundNumber,turn:l.turnNumber,selected:l.details?.selected||l.details?.action||null}:null;
for(const[i,pair]of s.pairs.entries()){
 const runs={};for(const side of ['baseline','candidate']){runs[side]=JSON.parse(fs.readFileSync(d+pair[side]));const r=runs[side];assert(r.summary.ok&&r.summary.gameEnded&&!r.summary.bugCount);for(const l of r.result.logs){if(l.type!=='play-card')continue;const v=l.details.selected?.valueBreakdown?.grandStrategyCreditBottleneckPenalty||0;if(v>0)penalizedPlays[side].push({case:i+1,player:l.playerId,round:l.roundNumber,turn:l.turnNumber,card:l.details.selected.cardId,instance:l.details.selected.cardInstanceId,penalty:v,resources:l.playerResources});}}
 const a=runs.baseline.result,b=runs.candidate.result;
 const semanticDiff=first(a.logs,b.logs,x=>x),resourceDiff=first(a.resourceFlow.events,b.resourceFlow.events,event);
 const companyId=a.playerResults.find(x=>x.companyLabel==='宇宙大战略集团').playerId;
 const metrics=r=>{const flow=r.resourceFlow.players.find(x=>x.playerId===companyId);return{score:flow.finalScore,main:flow.productiveMainActionCount,analysis:flow.analysisActionCount,blue1:flow.blue1CreditGain,blue2:flow.blue2EnergyGain,played:flow.cardUse.played,income:flow.incomeGain,nonIncome:flow.nonIncomeGain,spent:flow.spent};};
 rows.push({case:i+1,semanticLogsIdentical:semanticDiff.same,semanticPrefix:semanticDiff.prefix,firstLog:{before:log(a.logs[semanticDiff.prefix]),after:log(b.logs[semanticDiff.prefix])},resourceDiff,grandStrategy:{baseline:metrics(a),candidate:metrics(b)},scores:{baseline:runs.baseline.summary.playerScores,candidate:runs.candidate.summary.playerScores}});
}
assert.equal(penalizedPlays.candidate.length,0);
const summary={pairs:24,identicalSemanticLogs:rows.filter(r=>r.semanticLogsIdentical).length,identicalResourceEvents:rows.filter(r=>r.resourceDiff.same).length,identicalFinalScores:rows.filter(r=>semantic(r.scores.baseline)===semantic(r.scores.candidate)).length,baselineSelectedPenalizedPlays:penalizedPlays.baseline.length,candidateSelectedPenalizedPlays:0};
fs.writeFileSync(d+p+'-decision-followup.json',JSON.stringify({scope:'Full24 only. Separate complete semantic-log changes (which can be score metadata) from actual recorded resource/card/tech-step changes. Company total outcomes are descriptive and not attributed causally to one selected card. No intermediate score subset or seed filtering.',summary,penalizedPlays,rows},null,2)+'\n');console.log(JSON.stringify({summary,changedResourceCases:rows.filter(r=>!r.resourceDiff.same).map(r=>r.case)},null,2));
