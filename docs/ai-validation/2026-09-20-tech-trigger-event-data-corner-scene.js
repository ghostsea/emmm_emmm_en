(() => {
 const api=window.SetiRandomizer,c=window.__setiSmokeContext;
 function assert(ok,message){if(!ok)throw Error(message);}
 api.configureAiAutoBattle({reset:true,activePlayerCount:4,suppressAutoSchedule:true});
 let begin;for(let i=0;i<180;i++){begin=api.beginPlayCardSelection();if(begin?.ok)break;api.runAiAutoBattleStep();}assert(begin?.ok,'setup');api.cancelPlayCardSelection();
 const p=api.playerState.players.find(p=>p.id===api.playerState.currentPlayerId);
 p.initialSelection.industry={id:'industry:宇宙大战略集团',label:'宇宙大战略集团'};
 p.techState.ownedTiles={};p.techState.disabledTiles={};
 Object.assign(p.resources,{credits:0,energy:0,publicity:0,score:35,availableData:5,handSize:1});
 p.dataState={poolTokens:Array.from({length:5},(_,i)=>({id:'full-'+i,index:i+1,slotIndex:i+1})),placedTokens:[],discardedCount:0};
 const card=SetiCards.createCardInstance(SetiCardCatalog.find(q=>q.card_id==='b_26.webp'));p.reservedCards=[card];
 const hand=SetiCardCatalog.map(q=>SetiCards.createCardInstance(q)).find(q=>{const r=SetiCards.getDiscardActionRewardForCard(q);return r?.dataCount===1;});
 assert(hand,'one-data discard card');p.hand=[hand];
 assert(c.handleHandCardCornerQuickAction(0).ok,'select discard');assert(c.confirmCardCornerQuickAction().ok,'discard');
 for(let n=0;n<100;n++){
  const q=api.getAiAutoBattleProgress().pendingState;if(!q.actionEffectFlowActive&&!Object.entries(q).some(([k,v])=>k.startsWith('pending')&&v))break;
  const step=api.runAiAutoBattleStep();assert(!step?.blocked,'blocked '+JSON.stringify(step));assert(n<99,'undrained');
 }
 const report=api.getAiAutoBattleReport({includeAnalysis:false,includeDiagnostics:false});
 assert(p.dataState.poolTokens.length===6&&p.dataState.placedTokens.length===1,'copied corner must place for space');
 assert(p.dataState.discardedCount===0,'no loss');
 assert(JSON.stringify(card.cardEffectState?.consumedTriggerIds)===JSON.stringify(['b26-data-corner']),'one corner consumed');
 assert(!report.bugs.length,'bugs');
 return {handCard:hand,consumed:card.cardEffectState.consumedTriggerIds,dataState:p.dataState,resources:p.resources,bugs:report.bugs,pending:api.getAiAutoBattleProgress().pendingState};
})()
