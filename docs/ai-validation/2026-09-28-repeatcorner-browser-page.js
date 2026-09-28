(() => {
 const api=window.SetiRandomizer,c=window.__setiSmokeContext,ai=window.__smokeController;
 const assert=(x,m)=>{if(!x)throw Error(m);},rows=[];
 const nativePolicy=c.ai.policy.chooseTurnAction;
 for(const test of [{name:'publicity',kind:'publicity',pool:0},{name:'publicity-cap',kind:'publicity',pool:0,publicity:8},{name:'data-room',kind:'data',pool:0},
  {name:'data-overflow',kind:'data',pool:5},{name:'movement',kind:'move',pool:0}]){
  api.configureAiAutoBattle({reset:true,activePlayerCount:4,suppressAutoSchedule:true});
  api.restoreRecoverySnapshot(window.__repeatFixture);
  Object.assign(c.rocketState,structuredClone(window.__repeatFixture.state.rocketState));
  for(const player of api.playerState.players)c.rocketState.playerRocketSequences[player.id]=new Set(c.rocketState.rockets.filter(r=>r.playerId===player.id&&Number.isInteger(r.playerSequence)).map(r=>r.playerSequence));
  Object.assign(c.cardTaskState,structuredClone(window.__repeatFixture.state.cardTaskState));
  c.techGameState.ui.industryBorrowMode=false;
  const p=api.playerState.players.find(p=>p.id===api.playerState.currentPlayerId);
  p.initialSelection.industry={id:'industry:宇宙大战略集团',label:'宇宙大战略集团'};
  p.industryStrategyPassiveSlots={yellow:true,red:true,blue:true};
  c.turnState.roundNumber=3;p.industryGrandStrategyRoundStartRound=3;
  Object.assign(p.resources,{score:59,credits:3,energy:6,publicity:test.publicity??3,availableData:test.pool,handSize:2,additionalPublicScan:0});
  const card=SetiCards.createCardInstance(SetiCardCatalog.find(x=>x.card_id==='dlc_20.png'));card.id='repeat-source';
  const entry=SetiCardCatalog.find(x=>{
   if(!x.card_id?.startsWith('b_'))return false;
   const candidate=SetiCards.createCardInstance(x),r=SetiCards.getDiscardActionRewardForCard(candidate),m=SetiCards.getDiscardActionMoveRewardForCard(candidate);
   return test.kind==='move'?m?.movementPoints===1:test.kind==='data'?r?.dataCount===1:r?.gain?.publicity===1;
  });
  assert(entry,'corner card found');const discard=SetiCards.createCardInstance(entry);discard.id='repeat-discard';p.hand=[card,discard];
  p.techState=SetiPlayerTech.createPlayerTechState({});
  p.dataState={poolTokens:Array.from({length:test.pool},(_,i)=>({id:'pool-'+i,slotIndex:i+1,index:i+1})),placedTokens:[],discardedCount:0};
  if(test.kind==='move')c.rocketActions.launchRocketAtSector(c.rocketState,{x:2,y:2},{playerId:p.id,color:p.color});
  c.ai.policy.chooseTurnAction=nativePolicy;
  const beforePreview=JSON.stringify({player:p,rockets:c.rocketState,solar:c.solarState});
  const raw=ai.buildAiPlayCardCandidate(card,0,p);assert(raw||test.name==='publicity-cap'||!ai.rankAiRepeatCornerChoices,'candidate must support legal '+test.name);
  assert(JSON.stringify({player:p,rockets:c.rocketState,solar:c.solarState})===beforePreview,'preview mutated live state');
  const preview=raw?.valueBreakdown.repeatCornerPreview||null;if(preview)assert(preview.cardInstanceId===discard.id,'preview identity');
  const before=structuredClone(p.resources),startRocket=structuredClone(c.rocketState),actions=[];
  const begin=c.beginPlayCardSelection(),pay=c.handlePlayCardSelect(0);assert(begin.ok,'begin forced play');assert(pay.ok,'select forced card');assert(c.confirmPlayCardSelection().ok,'confirm forced card');
  const afterPayment=structuredClone(p.resources);assert(afterPayment.credits===2,'actual cost1 '+JSON.stringify({before,afterPayment,card,pay,pending:api.getAiAutoBattleProgress().pendingState}));
  let steps=0;
  for(;steps<100;steps++){
   const q=api.getAiAutoBattleProgress().pendingState;
   if(!q.actionEffectFlowActive&&!Object.entries(q).some(([k,v])=>k.startsWith('pending')&&v))break;
   const move=c.state.pendingActionEffectFlow?.cardMoveEffect;
   const stepBefore=move?{effect:{id:move.effect?.id,label:move.effect?.label,options:move.effect?.options},pool:move.poolRemaining,rockets:structuredClone(c.rocketState.rockets),resources:structuredClone(p.resources)}:null;
   const step=api.runAiAutoBattleStep();assert(!step.blocked,'blocked '+JSON.stringify(step));
   if(stepBefore)actions.push({before:stepBefore,after:{rockets:structuredClone(c.rocketState.rockets),resources:structuredClone(p.resources)},step:JSON.parse(JSON.stringify(step))});
  }
  assert(steps<100,'unfinished');assert(!p.hand.some(x=>x.id===card.id||x.id===discard.id),'both physical cards consumed '+test.name+':'+JSON.stringify({hand:p.hand,pending:api.getAiAutoBattleProgress().pendingState,log:api.getActionLog()}));
  if(test.kind==='publicity')assert(p.resources.publicity===Math.min(10,(test.publicity??3)+4),'one fixed plus three publicity corners');
  if(test.kind==='data')assert(p.resources.availableData===Math.min(6,test.pool+3),'data capacity');
  if(test.kind==='move'){
   const direct=actions.filter(x=>x.before.effect.id.startsWith('dlc20-repeat-corner-move-'));
   assert(JSON.stringify(direct.map(x=>x.before.pool))==='[3,2,1]','consume exactly three pool points');
   assert(direct.every(x=>x.step.payload.requiredMovePoints===1&&Object.keys(x.step.cost||{}).length===0),'no extra move payment');
   if(preview)assert(JSON.stringify(direct[0].step.payload.to)===JSON.stringify(preview.bestMove.to),'predicted first destination');
  }
  const bugs=api.getAiAutoBattleReport({includeAnalysis:false,includeDiagnostics:false}).bugs;assert(!bugs.length,'bugs');
  rows.push({test,discardCard:discard.cardId,before,afterPayment,after:structuredClone(p.resources),preview,rawScore:raw?.score??null,
   startRocket,endRocket:structuredClone(c.rocketState),actions,steps,bugs,log:api.getActionLog()});
 }
 c.ai.policy.chooseTurnAction=nativePolicy;
 return {rows,scope:'Forced legal DLC20 play; actual discard and movement use candidate policy. Resource cap, physical cards, fee and pooled movement verified. Movement valuation forecasts one step and nominal pool only, not later visit/landing rewards.'};
})()
