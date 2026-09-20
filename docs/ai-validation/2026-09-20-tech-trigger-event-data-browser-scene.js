(() => {
 const api=window.SetiRandomizer,c=window.__setiSmokeContext,out=[];
 function assert(ok,message){if(!ok)throw Error(message);}
 for(const initialData of [0,5,6])for(const bonusId of ['bonus_1p','bonus_1c']){
  api.configureAiAutoBattle({reset:true,activePlayerCount:4,suppressAutoSchedule:true});
  let begin;for(let i=0;i<180;i++){begin=api.beginPlayCardSelection();if(begin?.ok)break;api.runAiAutoBattleStep();}
  assert(begin?.ok,'setup');api.cancelPlayCardSelection();
  const p=api.playerState.players.find(p=>p.id===api.playerState.currentPlayerId);
  p.initialSelection.industry={id:'industry:宇宙大战略集团',label:'宇宙大战略集团'};
  p.techState.ownedTiles={orange1:true};p.techState.disabledTiles={};
  Object.assign(p.resources,{credits:0,energy:0,publicity:10,score:35,availableData:initialData,handSize:0});p.hand=[];
  p.dataState={poolTokens:Array.from({length:initialData},(_,i)=>({id:'full-'+i,index:i+1,slotIndex:i+1})),placedTokens:[],discardedCount:0};
  const card=SetiCards.createCardInstance(SetiCardCatalog.find(q=>q.card_id==='dlc_26.png'));p.reservedCards=[card];
  const stack=c.tech.getStack(c.techGameState.board,'blue2');stack.bonusQueue[stack.bonusIndex]=bonusId;stack.bonusId=bonusId;
  const policy=c.ai.policy,old=policy.chooseTurnAction,oldTech=policy.chooseResearchTechTile;
  policy.chooseTurnAction=cs=>cs.find(x=>x.id==='researchTech')||old(cs);
  policy.chooseResearchTechTile=cs=>cs.find(x=>x.tileId==='blue2')||oldTech(cs);
  assert(api.runAiAutoBattleStep().ok,'research start');
  for(let n=0;n<120;n++){
   const q=api.getAiAutoBattleProgress().pendingState;
   if(p.techState.ownedTiles.blue2&&!q.actionEffectFlowActive&&!Object.entries(q).some(([k,v])=>k.startsWith('pending')&&v))break;
   const step=api.runAiAutoBattleStep();assert(!step?.blocked,'blocked '+JSON.stringify(step));assert(n<119,'undrained');
  }
  policy.chooseTurnAction=old;policy.chooseResearchTechTile=oldTech;
  const report=api.getAiAutoBattleReport({includeAnalysis:false,includeDiagnostics:false});
  const consumed=card.cardEffectState?.consumedTriggerIds||[];
  const pool=p.dataState.poolTokens.length,placed=p.dataState.placedTokens.length;
  assert(consumed.length===1,'one research must consume exactly one slot '+JSON.stringify(consumed));
  assert(pool+placed===initialData+1,'exactly one data award');
  assert(p.dataState.discardedCount===0,'reward discarded');
  assert(placed===Math.max(0,initialData+1-6),'overflow placement count');
  assert(!report.bugs.length,'reported bugs');
  assert(bonusId!=='bonus_1c'||p.hand.length===1,'public card bonus completed');
  out.push({initialData,bonusId,pool,placed,consumed,discarded:p.dataState.discardedCount,hand:p.hand.length,bugs:report.bugs,pending:api.getAiAutoBattleProgress().pendingState});
 }
 return {scenarios:out};
})()
