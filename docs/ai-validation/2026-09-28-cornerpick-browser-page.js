(() => {
 const api=SetiRandomizer,c=window.__setiSmokeContext,ai=window.__smokeController,rows=[],assert=(x,m)=>{if(!x)throw Error(m);};
 for(const test of [{code:1,data:0,pub:0},{code:1,data:6,pub:0},{code:2,data:0,pub:0},{code:2,data:0,pub:0,move:true},{code:0,data:0,pub:0},{code:0,data:0,pub:10}]){
  api.configureAiAutoBattle({reset:true,activePlayerCount:4,suppressAutoSchedule:true});api.restoreRecoverySnapshot(window.__cornerPickFixture);
  SetiGameRandom.useSeed('corner-pick-browser:'+JSON.stringify(test));SetiGameRandom.installMathRandom();
  const p=c.getCurrentPlayer();p.initialSelection.industry={id:'industry:宇宙大战略集团',label:'宇宙大战略集团'};p.industryStrategyPassiveSlots={yellow:true,red:true,blue:true};p.reservedCards=[];c.turnState.roundNumber=2;p.industryGrandStrategyRoundStartRound=2;
  Object.assign(p.resources,{credits:10,energy:5,publicity:test.pub,availableData:test.data,score:50,handSize:1});p.techState=SetiPlayerTech.createPlayerTechState({});p.dataState={poolTokens:Array.from({length:test.data},(_,i)=>({id:'corner-data-'+i,slotIndex:i+1,index:i+1})),placedTokens:[],discardedCount:0};
  if(test.move){const rocket=c.rocketState.rockets.find(r=>r.surface==="solar-board");rocket.playerId=p.id;rocket.color=p.color;}
  const source=SetiCards.createCardInstance(SetiCardCatalog.find(x=>x.card_id==='b_48.webp'));source.id='corner-pick-source';p.hand=[source];
  const target=SetiCards.createCardInstance(SetiCardCatalog.find(x=>x.card_id==='b_48.webp'));target.id='corner-pick-target';target.discardActionCode=test.code;c.cardState.publicCards=[target,{...target,id:"corner-pick-target-2"},{...target,id:"corner-pick-target-3"}];
  const effect=SetiCardEffects.getCardModel(source).playEffects[0],before=structuredClone(p.resources),stateBefore=JSON.stringify({p,cards:c.cardState}),randomBefore=SetiGameRandom.getSnapshot();
  const candidate=ai.buildAiPlayCardCandidate(source,0,p),value=ai.scoreAiEffectValue(effect,{player:p});assert(JSON.stringify({p,cards:c.cardState})===stateBefore,'readonly');assert(JSON.stringify(SetiGameRandom.getSnapshot())===JSON.stringify(randomBefore),'no preview RNG');
  const rocketsBefore=structuredClone(c.rocketState.rockets);
  assert(c.beginPlayCardSelection().ok,'begin');assert(c.handlePlayCardSelect(0).ok,'select');assert(c.confirmPlayCardSelection().ok,'pay');const paid=structuredClone(p.resources);assert(paid.credits===10-source.price,'actual cost');
  let n=0;for(;n<90;n++){const q=api.getAiAutoBattleProgress().pendingState;if(!q.actionEffectFlowActive&&!Object.entries(q).some(([k,v])=>k.startsWith('pending')&&v))break;assert(!api.runAiAutoBattleStep().blocked,'blocked');}assert(n<90,'unfinished');assert(p.hand.some(x=>x.id===target.id),'picked card retained '+JSON.stringify({test,target,hand:p.hand,logs:api.getAiAutoBattleReport({includeAnalysis:false,includeDiagnostics:false}).logs.slice(-5)}));assert(!p.hand.some(x=>x.id===source.id),'source left hand');
  const report=api.getAiAutoBattleReport({includeAnalysis:false,includeDiagnostics:false});assert(!report.bugs.length,'bugs');
  rows.push({test,available:Boolean(candidate),value,effectValue:candidate?.valueBreakdown?.effectValue??null,before,paid,after:structuredClone(p.resources),hand:p.hand.map(x=>({id:x.id,cardId:x.cardId})),rocketsBefore,rocketsAfter:structuredClone(c.rocketState.rockets),randomBefore,randomAfter:SetiGameRandom.getSnapshot(),logs:report.logs,bugs:report.bugs});
 }
 return {rows};
})()
