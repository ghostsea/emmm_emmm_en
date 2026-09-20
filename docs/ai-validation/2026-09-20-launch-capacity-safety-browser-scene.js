(() => {
 const api=window.SetiRandomizer,c=window.__setiSmokeContext,assert=(v,m)=>{if(!v)throw Error(m);},rows=[];
 for(const cardId of ['b_116.webp','b_37.webp']){
  api.configureAiAutoBattle({reset:true,seed:'codex-launch-full-sector:'+cardId,activePlayerCount:4,suppressAutoSchedule:true});
  let begin;for(let n=0;n<180;n++){begin=api.beginPlayCardSelection();if(begin?.ok)break;api.runAiAutoBattleStep();}assert(begin?.ok,'setup');api.cancelPlayCardSelection();
  const p=api.playerState.players.find(p=>p.id===api.playerState.currentPlayerId),other=api.playerState.players.find(q=>q.id!==p.id);
  p.initialSelection.industry={id:'industry:作弊实验室',label:'作弊实验室'};p.reservedCards=[];p.techState.ownedTiles={orange1:true};p.techState.disabledTiles={};
  c.solarState.rotation={wheel1Steps:0,wheel2Steps:3,wheel3Steps:0,wheel4Steps:0,rotationCount:0};c.rocketState.rockets=[];
  const own=c.rocketActions.launchRocketAtSector(c.rocketState,{x:5,y:2},{playerId:p.id,color:p.color});assert(own.ok,'fixture own rocket');
  let filled=0;while(c.rocketActions.findAvailableSlotIndex(c.rocketState,5,1)!==null){assert(++filled<20,'slot count');assert(c.rocketActions.launchRocketAtSector(c.rocketState,{x:5,y:1},{playerId:other.id,color:other.color}).ok,'fill slot');}
  const card=SetiCardCatalog.map(q=>SetiCards.createCardInstance(q)).find(q=>q.cardId===cardId);assert(card,'card');p.hand=[card];Object.assign(p.resources,{credits:10,energy:3,score:35,publicity:0,availableData:0,handSize:1});
  assert(api.beginPlayCardSelection()?.ok,'begin fixture play');const count=c.rocketState.rockets.length,start=api.playHandCard(0);assert(start?.ok,'play card '+JSON.stringify(start));let blocked=null;
  for(let n=0;n<100;n++){const pending=api.getAiAutoBattleProgress().pendingState;if(!pending.actionEffectFlowActive&&!Object.entries(pending).some(([k,v])=>k.startsWith('pending')&&v))break;const step=api.runAiAutoBattleStep();if(step?.blocked||step?.ok===false){blocked=step;break;}assert(n<99,'undrained');}
  const logs=api.getAiAutoBattleReport({includeAnalysis:false,includeDiagnostics:false}).logs;
  const skips=logs.filter(l=>l.type==='effect-skip'&&l.details?.reason==='sector-full');
  if(!blocked){assert(c.rocketState.rockets.length===count,'no phantom rocket');assert(skips.length===(cardId==='b_37.webp'?2:1),'all optional launch nodes skipped once');}
  rows.push({cardId,filled,blocked,skips:skips.map(l=>({message:l.message,details:l.details})),rocketCountBefore:count,rocketCountAfter:c.rocketState.rockets.length,resources:{...p.resources},pending:api.getAiAutoBattleProgress().pendingState,last:logs.slice(-8).map(l=>({type:l.type,message:l.message}))});
 }
 return {rows};
})()
