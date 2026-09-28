(() => {
 const api=window.SetiRandomizer,c=window.__setiSmokeContext,ai=window.__smokeController,rows=[];
 const assert=(x,m)=>{if(!x)throw Error(m);};
 for(const test of [{round:4,credits:5,energy:0},{round:4,credits:3,energy:1},{round:4,credits:3,energy:8},{round:3,credits:5,energy:0}]){
  api.configureAiAutoBattle({reset:true,activePlayerCount:4,suppressAutoSchedule:true});
  let begin;for(let i=0;i<180;i++){begin=api.beginPlayCardSelection();if(begin?.ok)break;api.runAiAutoBattleStep();}assert(begin?.ok,'setup');api.cancelPlayCardSelection();
  const p=c.getCurrentPlayer();p.initialSelection.industry={id:'industry:宇宙大战略集团',label:'宇宙大战略集团'};
  p.industryStrategyPassiveSlots={yellow:true,red:true,blue:true};c.turnState.roundNumber=test.round;p.industryGrandStrategyRoundStartRound=test.round;
  p.reservedCards=[];p.techState=SetiPlayerTech.createPlayerTechState();
  const card=c.cards.createCardInstance(SetiCardCatalog.find(x=>x.card_id==='b_56.webp'));p.hand=[card];
  Object.assign(p.resources,{score:93,credits:test.credits,energy:test.energy,publicity:5,availableData:4,handSize:1});
  p.dataState={poolTokens:Array.from({length:4},(_,i)=>({id:'return-pool-'+i,index:i+10,slotIndex:i+1})),placedTokens:Array.from({length:6},(_,i)=>({id:'return-computer-'+i,index:i+1,placementKind:'computer',placementSlot:i+1})),discardedCount:0};
  const beforeSnapshot=JSON.stringify(api.createRecoverySnapshot()),random=Math.random;let randomCalls=0;
  Math.random=()=>{randomCalls++;return random();};let candidate,second;
  try{candidate=ai.buildAiPlayCardCandidate(card,0,p);second=ai.buildAiPlayCardCandidate(card,0,p);}finally{Math.random=random;}
  assert(candidate,'legal card');assert(!randomCalls&&beforeSnapshot===JSON.stringify(api.createRecoverySnapshot()),'mutation');assert(JSON.stringify(candidate)===JSON.stringify(second),'repeat drift');
  const before=structuredClone(p.resources);
  assert(api.beginPlayCardSelection().ok&&api.playHandCard(0).ok,'play');
  for(let i=0;p.resources.energy===before.energy&&i<30;i++){const step=api.runAiAutoBattleStep();assert(!step.blocked,'resource step');}
  const afterEnergy=structuredClone(p.resources);assert(afterEnergy.credits===before.credits-3,'actual credit payment');assert(afterEnergy.energy===before.energy+1,'actual immediate energy');
  const analysisReadyAfterEnergy=c.data.canAnalyzeData(p);
  for(let i=0;i<100;i++){const q=api.getAiAutoBattleProgress().pendingState;if(!q.actionEffectFlowActive&&!Object.entries(q).some(([k,v])=>k.startsWith('pending')&&v))break;const step=api.runAiAutoBattleStep();assert(!step.blocked&&i<99,'finish effects');}
  assert(api.endCurrentTurn().ok,'commit');
  const entries=c.getActionLogEntries({includeRecovery:true,readOnlyInternal:true}).slice(-1);
  const bugs=api.getAiAutoBattleReport({includeAnalysis:false,includeDiagnostics:false}).bugs;assert(!bugs.length,'runtime bug');
  rows.push({test,before,afterEnergy,after:structuredClone(p.resources),analysisReadyAfterEnergy,profile:candidate.valueBreakdown.finalCardResourceReturn||null,penalty:candidate.valueBreakdown.finalRoundResourceDrainPenalty,score:candidate.score,randomCalls,entries});
 }
 return {scope:'Four real browser b56 plays: actual3credit payment, immediate1energy, analysis readiness, research effect completion, readonly repeated valuation. Forced same-card execution verifies accounting and pending flow, not automatic preference or whole-game score gain. Initial independent games are not paired complete states.',rows};
})()
