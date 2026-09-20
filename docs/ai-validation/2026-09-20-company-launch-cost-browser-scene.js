(() => {
 const api=window.SetiRandomizer,c=window.__setiSmokeContext;
 const assert=(v,m)=>{if(!v)throw Error(m);};
 api.configureAiAutoBattle({reset:true,seed:'codex-company-launch-cost:1',activePlayerCount:4,suppressAutoSchedule:true});
 let begin;for(let n=0;n<180;n++){begin=api.beginPlayCardSelection();if(begin?.ok)break;api.runAiAutoBattleStep();}assert(begin?.ok,'setup');api.cancelPlayCardSelection();
 const p=api.playerState.players.find(p=>p.id===api.playerState.currentPlayerId);
 p.initialSelection.industry={id:'industry:作弊实验室',label:'作弊实验室'};
 p.industryAlienLabPanels={blue:true,yellow:true,pink:true};p.techState.ownedTiles={orange1:true};p.techState.disabledTiles={};p.reservedCards=[];p.hand=[];
 c.solarState.rotation={wheel1Steps:0,wheel2Steps:3,wheel3Steps:0,wheel4Steps:0,rotationCount:0};
 c.rocketState.rockets=c.rocketState.rockets.filter(r=>r.playerId!==p.id);
 Object.assign(p.resources,{credits:1,energy:3,publicity:0,score:35,availableData:0,handSize:0});p.dataState={poolTokens:[],placedTokens:[],discardedCount:0};
 const policy=c.ai.policy,old=policy.chooseTurnAction;let choice;
 policy.chooseTurnAction=(cs,...args)=>{choice=cs.find(x=>x.id==='launch'&&x.available);return choice||old(cs,...args);};
 const first=api.runAiAutoBattleStep();policy.chooseTurnAction=old;assert(choice&&first.ok,'ordinary company launch legal');
 for(let n=0;n<100;n++){const pending=api.getAiAutoBattleProgress().pendingState;if(c.rocketState.rockets.some(r=>r.playerId===p.id)&&!pending.actionEffectFlowActive&&!Object.entries(pending).some(([k,v])=>k.startsWith('pending')&&v))break;const step=api.runAiAutoBattleStep();assert(!step?.blocked,'blocked');assert(n<99,'undrained');}
 assert(c.rocketState.rockets.filter(r=>r.playerId===p.id).length===1,'one launch');assert(p.resources.credits===0,'actual launch costs only one credit');
 const beforeMove={...p.resources},rocket=c.rocketState.rockets.find(r=>r.playerId===p.id);
 const next=c.moveRocket(0,1,rocket.id,{automated:true});assert(next?.ok,'move executable');
 for(let n=0;n<80;n++){const pending=api.getAiAutoBattleProgress().pendingState;if(!pending.actionEffectFlowActive&&!Object.entries(pending).some(([k,v])=>k.startsWith('pending')&&v))break;const step=api.runAiAutoBattleStep();assert(!step?.blocked,'move blocked');assert(n<79,'move undrained');}
 assert(p.resources.energy===2,'one energy move');
 if(choice.plan){assert(choice.plan.direction==='out','preview chooses the tested route');assert(choice.plan.projectedResourcesAfterLaunchMove.credits===p.resources.credits,'credit preview matches');assert(choice.plan.projectedResourcesAfterLaunchMove.energy===p.resources.energy,'energy preview matches');}
 return {company:p.initialSelection.industry,choice,first,beforeMove,afterMove:{...p.resources},next,bugs:api.getAiAutoBattleReport({includeAnalysis:false,includeDiagnostics:false}).bugs};
})()
