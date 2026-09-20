(() => {
 const api=window.SetiRandomizer,c=window.__setiSmokeContext;
 function assert(value,message){if(!value)throw Error(message);}
 api.configureAiAutoBattle({reset:true,seed:'codex-free-launch-scene:1',activePlayerCount:4,suppressAutoSchedule:true});
 let begin;for(let i=0;i<180;i++){begin=api.beginPlayCardSelection();if(begin?.ok)break;api.runAiAutoBattleStep();}assert(begin?.ok,'setup');api.cancelPlayCardSelection();
 const p=api.playerState.players.find(p=>p.id===api.playerState.currentPlayerId);
 p.initialSelection.industry={id:'industry:寰宇超动力',label:'寰宇超动力'};
 p.techState.ownedTiles={orange1:true};p.techState.disabledTiles={};p.reservedCards=[];
 c.solarState.rotation={wheel1Steps:0,wheel2Steps:3,wheel3Steps:0,wheel4Steps:0,rotationCount:0};
 c.rocketState.rockets=c.rocketState.rockets.filter(r=>r.playerId!==p.id);
 const card=SetiCardCatalog.map(q=>SetiCards.createCardInstance(q)).find(q=>{
  const model=c.cardEffects.getCardModel(q);return q.price===1&&model?.playEffects?.length===1&&model.playEffects[0].type==='launch';
 });
 assert(card,'one-credit launch card');p.hand=[card];
 Object.assign(p.resources,{credits:1,energy:3,publicity:0,score:35,availableData:0,handSize:1});
 p.dataState={poolTokens:[],placedTokens:[],discardedCount:0};
 const policy=c.ai.policy,old=policy.chooseTurnAction;let choice;
 policy.chooseTurnAction=(cs,...args)=>{choice=cs.find(x=>x.id==='playCard');return choice||old(cs,...args);};
 const first=api.runAiAutoBattleStep();policy.chooseTurnAction=old;
 assert(first.ok&&choice,'play candidate');
 for(let n=0;n<120;n++){
  const q=api.getAiAutoBattleProgress().pendingState;
  if(!p.hand.some(q=>q.id===card.id)&&!q.actionEffectFlowActive&&!Object.entries(q).some(([k,v])=>k.startsWith('pending')&&v))break;
  const step=api.runAiAutoBattleStep();assert(!step?.blocked,'blocked '+JSON.stringify(step));assert(n<119,'undrained');
 }
 assert(c.rocketState.rockets.filter(r=>r.playerId===p.id).length===1,'actual launch');
 assert(p.resources.credits===0,'only card credit payment');
 const beforeMove={...p.resources},rocket=c.rocketState.rockets.find(r=>r.playerId===p.id);
 const projected=choice.plan?.postLaunchMovePlan;
 const direction=projected?.direction||'out';
 const delta={out:[0,1],in:[0,-1],cw:[1,0],ccw:[-1,0]}[direction];
 const next=c.moveRocket(delta[0],delta[1],rocket.id,{automated:true});
 assert(next?.ok,'previewed movement must be executable');
 for(let n=0;n<80;n++){
  const q=api.getAiAutoBattleProgress().pendingState;
  if(!q.actionEffectFlowActive&&!Object.entries(q).some(([k,v])=>k.startsWith('pending')&&v))break;
  const step=api.runAiAutoBattleStep();assert(!step?.blocked,'move blocked '+JSON.stringify(step));assert(n<79,'move undrained');
 }
 if(projected){
  assert(p.resources.credits===projected.projectedResourcesAfterLaunchMove.credits,'credit preview mismatch');
  assert(p.resources.energy===projected.projectedResourcesAfterLaunchMove.energy,'energy preview mismatch');
  assert(p.resources.handSize===projected.projectedResourcesAfterLaunchMove.handSize,'hand preview mismatch');
 }
 const report=api.getAiAutoBattleReport({includeAnalysis:false,includeDiagnostics:false});
 return {card:{id:card.cardId,price:card.price},candidate:choice,first,beforeMove,afterMove:{...p.resources},rocket:structuredClone(rocket),next,bugs:report.bugs,pending:api.getAiAutoBattleProgress().pendingState,logs:report.logs.slice(-5)};
})()
