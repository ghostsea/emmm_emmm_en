(() => {
 const api=window.SetiRandomizer,c=window.__setiSmokeContext;
 api.configureAiAutoBattle({reset:true,activePlayerCount:4,suppressAutoSchedule:true});
 let begin;for(let i=0;i<180;i++){begin=api.beginPlayCardSelection();if(begin?.ok)break;api.runAiAutoBattleStep();}if(!begin?.ok)throw Error('setup');api.cancelPlayCardSelection();
 const p=api.playerState.players.find(p=>p.id===api.playerState.currentPlayerId);
 p.initialSelection.industry={id:'industry:宇宙大战略集团',label:'宇宙大战略集团'};
 p.techState.ownedTiles={orange1:true};p.techState.disabledTiles={};
 Object.assign(p.resources,{credits:0,energy:0,publicity:10,score:35,availableData:6,handSize:0});p.hand=[];
 p.dataState={poolTokens:Array.from({length:6},(_,i)=>({id:'full-'+i,index:i+1,slotIndex:i+1})),placedTokens:[],discardedCount:0};
 const card=SetiCards.createCardInstance(SetiCardCatalog.find(q=>q.card_id==='dlc_26.png'));const picked=SetiCards.createCardInstance(SetiCardCatalog.find(q=>q.card_id==='b_80.webp'));p.reservedCards=[card,picked];
 const stack=c.tech.getStack(c.techGameState.board,'blue2');stack.bonusQueue[stack.bonusIndex]='bonus_1p';stack.bonusId='bonus_1p';
 const policy=c.ai.policy,old=policy.chooseTurnAction,oldTech=policy.chooseResearchTechTile;
 policy.chooseTurnAction=cs=>cs.find(x=>x.id==='researchTech')||old(cs);
 policy.chooseResearchTechTile=cs=>cs.find(x=>x.tileId==='blue2')||oldTech(cs);
 const first=api.runAiAutoBattleStep();if(!first.ok)throw Error('research failed');
 for(let n=0;n<120;n++){
  const q=api.getAiAutoBattleProgress().pendingState;if(p.techState.ownedTiles.blue2&&!q.actionEffectFlowActive&&!Object.entries(q).some(([k,v])=>k.startsWith('pending')&&v))break;
  const step=api.runAiAutoBattleStep();if(step?.blocked)throw Error('blocked '+JSON.stringify(step));if(n===119)throw Error('undrained');
 }
 policy.chooseTurnAction=old;policy.chooseResearchTechTile=oldTech;
 const report=api.getAiAutoBattleReport({includeAnalysis:false,includeDiagnostics:false});
 const chosen=report.logs.filter(l=>l.type==='card-trigger').at(-1);
 return {pickedConsumed:picked.cardEffectState?.consumedTriggerIds,chosen,hand:p.hand.map(q=>q.id),scope:'Force legal blue2 research with a full6 data pool and unconsumed dlc26. Inspect real trigger receipt, placement and discard counters rather than assuming pool delta equals gain.',first,resources:p.resources,dataState:p.dataState,consumed:card.cardEffectState?.consumedTriggerIds,bugs:report.bugs,pending:api.getAiAutoBattleProgress().pendingState,logs:report.logs.slice(-14)};
})()
