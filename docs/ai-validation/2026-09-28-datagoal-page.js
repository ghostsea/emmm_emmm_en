(() => {
 const api=window.SetiRandomizer,c=window.__setiSmokeContext,ai=window.__smokeController;
 const assert=(x,m)=>{if(!x)throw Error(m);},rows=[];
 for(const test of [{name:'room',pool:0,placed:0,gain:2},{name:'overflow-computer',pool:6,placed:5,gain:1},
  {name:'blocked-full',pool:6,placed:6,gain:0},{name:'overflow-blue',pool:6,placed:6,blue:true,gain:1},
  {name:'amiba-direct-data',pool:0,placed:0,alien:true,gain:3}]){
  api.configureAiAutoBattle({reset:true,activePlayerCount:4,suppressAutoSchedule:true});
  api.restoreRecoverySnapshot(window.__dataGoalFixture);
  Object.assign(c.rocketState,structuredClone(window.__dataGoalFixture.state.rocketState));
  Object.assign(c.cardTaskState,structuredClone(window.__dataGoalFixture.state.cardTaskState));
  c.techGameState.ui.industryBorrowMode=false;
  const p=api.playerState.players.find(p=>p.id===api.playerState.currentPlayerId);
  p.initialSelection.industry={id:'industry:宇宙大战略集团',label:'宇宙大战略集团'};
  p.industryStrategyPassiveSlots={yellow:true,red:true,blue:true};
  c.turnState.roundNumber=3;p.industryGrandStrategyRoundStartRound=3;
  Object.assign(p.resources,{score:59,credits:2,energy:6,publicity:5,availableData:test.pool,handSize:1,additionalPublicScan:0});
  const card=test.alien?structuredClone(p.hand.find(x=>x.cardId==='amiba_0.webp'))
   :SetiCards.createCardInstance(SetiCardCatalog.find(x=>x.card_id==='b_74.webp'));
  card.id=test.alien?'data-goal-amiba0':'data-goal-b74';p.hand=[card];
  p.techState=SetiPlayerTech.createPlayerTechState(test.blue?{ownedTiles:{blue1:true},blueBoardSlots:{blue1:2}}:{});
  p.dataState={poolTokens:Array.from({length:test.pool},(_,i)=>({id:'pool-'+i,slotIndex:i+1,index:i+1})),
   placedTokens:Array.from({length:test.placed},(_,i)=>({id:'placed-'+i,placementKind:'computer',placementSlot:i+1,index:i+10})),discardedCount:0};
  const raw=ai.buildAiPlayCardCandidate(card,0,p);assert(raw?.available,'legal '+test.name);
  const snapshot=api.createRecoverySnapshot(),before=structuredClone(p.resources),beforeTotal=p.dataState.poolTokens.length+p.dataState.placedTokens.length;
  let action=null;
  c.ai.policy.chooseTurnAction=choices=>{action=structuredClone(choices.find(x=>x.id==='playCard'&&x.available));return action;};
  assert(!api.runAiAutoBattleStep().blocked,'turn '+test.name);assert(action?.cardId===card.cardId,'top candidate');
  assert(!api.runAiAutoBattleStep().blocked,'payment '+test.name);const afterPayment=structuredClone(p.resources);assert(afterPayment.credits===0,'pay2 before reward');
  let steps=0;for(;steps<100;steps++){
   const q=api.getAiAutoBattleProgress().pendingState;
   if(!q.actionEffectFlowActive&&!Object.entries(q).some(([k,v])=>k.startsWith('pending')&&v))break;
   const step=api.runAiAutoBattleStep();assert(!step.blocked,'effect '+test.name);
  }
  assert(steps<100,'unfinished');const actualGain=p.dataState.poolTokens.length+p.dataState.placedTokens.length-beforeTotal;
  assert(test.alien?actualGain>=3&&actualGain<=4:actualGain===test.gain,'actual gain '+test.name+':'+actualGain);
  const bugs=api.getAiAutoBattleReport({includeAnalysis:false,includeDiagnostics:false}).bugs;assert(!bugs.length,'bugs');
  const blueGoal=SetiAIGoals.scoreCandidateForGoals(action,[{id:SetiAIGoals.GOAL_IDS.GRAB_TRACE_BLUE,value:12,priority:1,feasibility:1}]);
  rows.push({test,snapshot,before,afterPayment,after:structuredClone(p.resources),actualGain,rawScore:raw.score,
   rawEffectValue:raw.valueBreakdown.effectValue,support:action.valueBreakdown.directDataGoalSupport||null,blueGoal,actionGraph:action.actionGraph,steps,bugs});
 }
 return {rows,scope:'Four exact-state b74 cases plus Amiba0. Force the same legal play in both arms to compare goal metadata and actual fee/data/overflow; not autonomous action ranking or full-game improvement. Full pool can legally auto-place into computer/blue before gaining data. Amiba symbol reward is separate from its3 direct data.'};
})()
