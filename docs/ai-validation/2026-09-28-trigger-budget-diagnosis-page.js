(async()=>{
 const api=SetiRandomizer,c=window.__setiSmokeContext,ctrl=window.__smokeController,old=c.ai.policy.chooseTurnAction,rows=[];
 c.ai.policy.chooseTurnAction=(choices,...args)=>{
  const selected=old(choices,...args);
  // This policy entry point also serves hypothetical move previews, which
  // may legally have no choice. Capture only the real full-turn menu.
  if(!selected||!choices.some(x=>x.id==='playCard')||!choices.some(x=>x.id==='pass'))return selected;
  const p=c.getCurrentPlayer();
  const setup=(p.hand||[]).find(card=>c.cardEffects.getCardModel(card)?.source?.referenceId==='b_120');
  if(setup){
   const candidates=choices.find(x=>x.id==='playCard')?.playableCards||[];
   const cards=(p.hand||[]).map(card=>{
    const price=c.getCardPrice(card),cost=c.getCardPlayCost(card),eventPrice=Math.max(0,Math.round(Number(cost.credits)||0)),candidate=candidates.find(x=>x.cardInstanceId===card.id);
    const matches=c.cardEffects.collectMatchingTriggers(structuredClone(p),{type:'playCard',timing:'after_play_card',price:eventPrice,cardId:card.cardId||card.image,sourceCardInstanceId:card.id});
    return{instance:card.id,cardId:card.cardId||card.image,label:card.cardName||card.name,price,eventPrice,cost,candidate:candidate?{available:candidate.available,score:candidate.score,directScore:candidate.directScoreGain}:null,existingMatches:matches.map(x=>({cardInstance:x.card.id,triggerId:x.trigger.id,effect:x.effect.type}))};
   });
   rows.push({player:p.id,company:p.initialSelection.industry.label,round:c.turnState.roundNumber,rawTurn:c.turnState.turnNumber,resources:structuredClone(p.resources),setupInstance:setup.id,setupCost:c.getCardPlayCost(setup),cards,selected:{id:selected.id,kind:selected.kind},reserved:(p.reservedCards||[]).map(card=>({id:card.id,cardId:card.cardId||card.image,consumed:card.cardEffectState?.consumedTriggerIds||[]}))});
  }
  return selected;
 };
 const result=await api.startAiAutoBattle({reset:true,seed:__SEED__,activePlayerCount:4,maxSteps:2500,stepDelayMs:0,maxBugRepeats:1,yieldEverySteps:20,stopOnBlocked:true,retainAnalysis:false,includeSampleDiagnostics:false,includeLogs:true});
 return{rows,result};
})()
