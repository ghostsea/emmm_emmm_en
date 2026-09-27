const fs=require('fs'),assert=require('node:assert/strict'),crypto=require('crypto'),d='tmp/ai-20260905/',prefix=process.argv[2]||'creditunlock';
const s=JSON.parse(fs.readFileSync(d+prefix+'-suite.json')),full=JSON.parse(fs.readFileSync(d+prefix+'-complete.json'));
assert.equal(full.report.pairs.length,s.pairs.length,'complete score collector required');
const rows=[],manifest=[];
for(const [caseIndex,pair]of s.pairs.entries())for(const side of ['baseline','candidate']){
 const file=pair[side],raw=fs.readFileSync(d+file),run=JSON.parse(raw),ls=run.result.logs;
 assert(run.summary.ok&&run.summary.gameEnded&&!run.summary.bugCount&&!run.summary.blocked);
 assert.equal(run.options.seed,pair.seed);assert.equal(run.options.alienSeed,pair.alienSeed);
 manifest.push({file,side,sha256:crypto.createHash('sha256').update(raw).digest('hex')});
 for(let i=0;i<ls.length;i++){
  const l=ls[i],a=l.details?.action;if(l.type!=='turn-action'||!a?.valueBreakdown?.mainUnlockTrade)continue;
  assert(Number.isFinite(l.rawTurnNumber),'trade real turn required');
  const target=a.valueBreakdown.bestPlayCard,same=x=>x.playerId===l.playerId&&x.roundNumber===l.roundNumber&&x.turnNumber===l.turnNumber&&x.rawTurnNumber===l.rawTurnNumber;
  const after=ls.slice(i+1).filter(same),discard=after.find(x=>x.type==='discard');
  const nextMain=after.find(x=>x.type==='turn-action'&&x.details?.action?.kind==='main');
  const play=after.find(x=>x.type==='play-card'),selected=play?.details?.selected;
  const handTrade=a.tradeId==='cards-for-credit',matchingDiscard=handTrade&&discard?.details?.tradeId===a.tradeId&&discard?.details?.pendingType==='trade';
  const stableHand=matchingDiscard&&l.playerResources.handSize===discard.playerResources.handSize;
  const plannedRetained=stableHand?!discard.details.selectedIndexes.includes(target.handIndex):null;
  const paid=selected?run.result.resourceFlow.events.some(e=>e.playerId===l.playerId&&e.roundNumber===l.roundNumber&&e.turnNumber===l.turnNumber&&e.cards?.some(c=>c.change==='play'&&c.key===selected.cardInstanceId)):false;
  rows.push({case:caseIndex+1,side,file,log:l.id,player:l.playerId,company:run.result.resourceFlow.players.find(p=>p.playerId===l.playerId)?.industryId,round:l.roundNumber,turn:l.turnNumber,rawTurn:l.rawTurnNumber,trade:a.tradeId,currentCredits:l.playerResources.credits,handBefore:l.playerResources.handSize,preserveHandIndex:a.preserveHandIndex??null,target,matchingDiscard,stableHand,discardedIndexes:matchingDiscard?discard.details.selectedIndexes:null,plannedRetained,nextMain:nextMain?.details?.action?.id||null,playedCardId:selected?.cardId||null,playedInstance:selected?.cardInstanceId||null,plannedModelPlayed:Boolean(selected&&selected.cardId===target.cardId),actualPlayPaid:paid});
 }
}
const summary={};for(const side of ['baseline','candidate']){const rs=rows.filter(r=>r.side===side);summary[side]={trades:rs.length,cardTrades:rs.filter(r=>r.trade==='cards-for-credit').length,roundOne:rs.filter(r=>r.round===1).length,alreadyHadCredit:rs.filter(r=>r.currentCredits>0).length,targetDiscarded:rs.filter(r=>r.plannedRetained===false).length,unverifiedDiscard:rs.filter(r=>r.trade==='cards-for-credit'&&r.plannedRetained===null).length,plannedModelPlayedSameTurn:rs.filter(r=>r.plannedModelPlayed).length,anySameTurnPaidPlay:rs.filter(r=>r.actualPlayPaid).length,companies:Object.fromEntries([...new Set(rs.map(r=>r.company))].map(c=>[c,{trades:rs.filter(r=>r.company===c).length,plannedModelPlayedSameTurn:rs.filter(r=>r.company===c&&r.plannedModelPlayed).length}]))};}
const candidateRows=rows.filter(r=>r.side==='candidate');assert(candidateRows.every(r=>r.preserveHandIndex===r.target.handIndex),'planned target forwarded');assert.equal(summary.candidate.targetDiscarded,0,'target discarded');assert.equal(summary.candidate.unverifiedDiscard,0,'missing index evidence');
const report={scope:'Full complete suite decision-log followup, both policies. Credit-card trades compare the next matching discard indices only when same-player round/display-turn/raw-turn and pre-discard hand count agree. Explicit retained index is checked for candidate. Later play matches model ID, not necessarily original instance when duplicates exist; actual play payment independently matches its selected instance. A different subsequent action is not by itself a bug. These are mechanism counts, not causal score gains; old parser unknown-use coverage is not used.',summary,rows,manifest};
fs.writeFileSync(d+prefix+'-unlock-followup.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(summary,null,2));
