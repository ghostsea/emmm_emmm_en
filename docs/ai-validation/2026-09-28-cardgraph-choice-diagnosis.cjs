const fs=require('fs'),assert=require('node:assert/strict'),d='tmp/ai-20260905/',s=JSON.parse(fs.readFileSync(d+'cardgraph-suite.json'));
const rows=[],firstDifferences=[],groups={},cardCounts={};
const event=e=>e?{player:e.playerId,entry:e.entryId,step:e.stepIndex,round:e.roundNumber,turn:e.turnNumber,text:e.sourceDetail,action:e.mainActionType,resources:e.resourceDeltas,income:e.incomeDeltas,cards:e.cards,tech:e.techIds}:null;
for(const[i,pair]of s.pairs.entries()){
 const a=JSON.parse(fs.readFileSync(d+pair.baseline)),b=JSON.parse(fs.readFileSync(d+pair.candidate));
 assert(a.summary.gameEnded&&b.summary.gameEnded&&!a.summary.bugCount&&!b.summary.bugCount);
 let n=0;const ae=a.result.resourceFlow.events,be=b.result.resourceFlow.events;
 while(n<Math.min(ae.length,be.length)&&JSON.stringify(event(ae[n]))===JSON.stringify(event(be[n])))n++;
 firstDifferences.push({case:i+1,prefix:n,baseline:event(ae[n]),candidate:event(be[n]),scores:{baseline:a.summary.playerScores,candidate:b.summary.playerScores}});
 for(const l of b.result.logs){const c=l.details?.action;if(l.type!=='turn-action'||c?.id!=='playCard')continue;
  const raw=c.playableCards||[],best=[...raw].sort((x,y)=>y.score-x.score)[0],selected=raw.find(x=>x.cardInstanceId===c.cardInstanceId);
  if(!best||best.cardInstanceId===c.cardInstanceId)continue;
  const view=x=>({card:x.cardId,label:x.cardLabel,score:x.score,cost:x.cost,plan:x.plan?.actionId,
   type:x.typeCode,effects:x.effectTypes,immediateEffect:x.valueBreakdown?.effectValue,passive:x.valueBreakdown?.passiveValue});
  const company=b.result.playerResults.find(p=>p.playerId===l.playerId).companyLabel;
  const row={case:i+1,player:l.playerId,round:l.roundNumber,turn:l.turnNumber,company,resources:l.playerResources,
   selected:view(selected),rawBest:view(best),graph:c.actionGraph,breakdown:c.breakdown};rows.push(row);
  const key=company+' | '+(selected.plan?.actionId||'no-route');const g=groups[key]||={count:0,creditCostDelta:0,rawScoreSacrificed:0};g.count++;g.creditCostDelta+=(selected.cost?.credits||0)-(best.cost?.credits||0);g.rawScoreSacrificed+=best.score-selected.score;
  cardCounts[selected.cardId]=(cardCounts[selected.cardId]||0)+1;
 }
}
assert.equal(rows.length,123);
fs.writeFileSync(d+'cardgraph-choice-diagnosis.json',JSON.stringify({scope:'All24 complete pairs. 123 actual selected cards differ from raw-best within the candidate run; this is an internal choice diagnostic, not123 causal baseline replacements. First actual resource-event divergence retained for all seeds. No company-subset adoption or attribution of terminal delta to a single choice.',groups,cardCounts,firstDifferences,rows},null,2)+'\n');
console.log(JSON.stringify({groups,cardCounts:Object.entries(cardCounts).sort((a,b)=>b[1]-a[1]).slice(0,12)},null,2));
