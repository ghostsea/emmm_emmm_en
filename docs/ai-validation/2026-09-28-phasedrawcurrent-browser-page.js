(() => {
 const api=SetiRandomizer,c=window.__setiSmokeContext,ai=window.__smokeController,rows=[],assert=(x,m)=>{if(!x)throw Error(m);};
 for(const round of [1,4])for(const [cardId,count,price]of [['b_83.webp',3,2],['b_122.webp',1,1]]){
  api.configureAiAutoBattle({reset:true,activePlayerCount:4,suppressAutoSchedule:true});api.restoreRecoverySnapshot(window.__phaseDrawFixture);
  SetiGameRandom.useSeed('phase-draw-browser:'+round+':'+cardId);SetiGameRandom.installMathRandom();
  const p=c.getCurrentPlayer();p.initialSelection.industry={id:'industry:宇宙大战略集团',label:'宇宙大战略集团'};p.industryStrategyPassiveSlots={yellow:true,red:true,blue:true};p.industryGrandStrategyRoundStartRound=round;
  c.turnState.roundNumber=round;p.reservedCards=[];const card=c.cards.createCardInstance(SetiCardCatalog.find(x=>x.card_id===cardId));card.id='phase-draw-source';p.hand=[card];Object.assign(p.resources,{credits:10,energy:3,publicity:1,availableData:0,handSize:1,score:50});
  const snapshot=JSON.stringify(p),randomBefore=SetiGameRandom.getSnapshot(),effect=SetiCardEffects.getCardModel(card).playEffects[0],value=ai.scoreAiEffectValue(effect,{player:p});assert(JSON.stringify(p)===snapshot,'readonly');assert(JSON.stringify(SetiGameRandom.getSnapshot())===JSON.stringify(randomBefore),'valuation consumes randomness');
  const before=structuredClone(p.resources);assert(c.beginPlayCardSelection().ok,'begin');assert(c.handlePlayCardSelect(0).ok,'select');assert(c.confirmPlayCardSelection().ok,'pay');const paid=structuredClone(p.resources);assert(paid.credits===10-price,'actual price');
  let fallbackUsed=false,n=0;for(;n<70;n++){const q=api.getAiAutoBattleProgress().pendingState;
   if(q.pendingCardSelection&&cardId==='b_122.webp'){assert(api.drawCardForCurrentPlayer({fromSelection:true}).ok,'blind fallback');fallbackUsed=true;continue;}
   if(!q.actionEffectFlowActive&&!Object.entries(q).some(([k,v])=>k.startsWith('pending')&&v))break;
   assert(!api.runAiAutoBattleStep().blocked,'blocked');
  }assert(n<70,'unfinished');assert(p.hand.length===count,'actual count');assert(cardId!=='b_122.webp'||fallbackUsed,'blind fallback selected');
  const bugs=api.getAiAutoBattleReport({includeAnalysis:false,includeDiagnostics:false}).bugs;assert(!bugs.length,'bugs');rows.push({round,cardId,count,price,before,paid,after:structuredClone(p.resources),hand:p.hand.map(x=>({id:x.id,cardId:x.cardId})),value,fallbackUsed,bugs,randomBefore,randomAfter:SetiGameRandom.getSnapshot()});
 }
 return {scope:'Same restored fixture, real card83 pays2 draws3 and card122 pays1 selects blind fallback; round1 and4, actual payment and resulting cards checked separately from phase value.',rows};
})()
