(() => {
 const api=window.SetiRandomizer,c=window.__setiSmokeContext,assert=(v,m)=>{if(!v)throw Error(m);};
 api.configureAiAutoBattle({reset:true,seed:'codex-huanyu-launch-free-followup:1',activePlayerCount:4,suppressAutoSchedule:true});
 let begin;for(let n=0;n<180;n++){begin=api.beginPlayCardSelection();if(begin?.ok)break;api.runAiAutoBattleStep();}assert(begin?.ok,'setup');api.cancelPlayCardSelection();
 const p=api.playerState.players.find(p=>p.id===api.playerState.currentPlayerId);
 p.initialSelection.industry={id:'industry:寰宇超动力',label:'寰宇超动力'};p.industryRoundMarkRound=0;p.industryRoundMarkTurn=0;
 p.techState.ownedTiles={orange1:true};p.techState.disabledTiles={};p.reservedCards=[];p.hand=[];
 c.solarState.rotation={wheel1Steps:0,wheel2Steps:3,wheel3Steps:0,wheel4Steps:0,rotationCount:0};
 c.rocketState.rockets=c.rocketState.rockets.filter(r=>r.playerId!==p.id);
 Object.assign(p.resources,{credits:4,energy:1,publicity:0,score:35,availableData:0,handSize:0});p.dataState={poolTokens:[],placedTokens:[],discardedCount:0};
 const policy=c.ai.policy,old=policy.chooseTurnAction;let choice,selected;
 policy.chooseTurnAction=(cs,...args)=>{choice=cs.find(x=>x.id==='launch'&&x.available);selected=old(cs,...args);return selected;};
 const first=api.runAiAutoBattleStep();policy.chooseTurnAction=old;if(selected?.id!=='launch')return {selected,launch:choice,first};assert(choice&&first.ok,'launch legal');
 const drain=()=>{for(let n=0;n<100;n++){const pending=api.getAiAutoBattleProgress().pendingState;if(!pending.actionEffectFlowActive&&!Object.entries(pending).some(([k,v])=>k.startsWith('pending')&&v))return;const step=api.runAiAutoBattleStep();assert(!step?.blocked,'blocked '+JSON.stringify(step));}throw Error('undrained');};
 drain();assert(p.resources.credits===2&&p.resources.energy===1,'actual launch payment');
 const rocket=c.rocketState.rockets.find(r=>r.playerId===p.id),before=structuredClone(rocket);
 const next=api.runAiAutoBattleStep();assert(next?.ok!==false,'next action');const chosen=api.getAiAutoBattleReport({includeAnalysis:false,includeDiagnostics:false}).logs.filter(l=>l.type==='turn-action').at(-1);assert(chosen?.details?.action?.id==='industry','autonomous company move');drain();
 assert(p.resources.energy===1,'no energy spent for industry move');
 assert(rocket.sectorX!==before.sectorX||rocket.sectorY!==before.sectorY,'company moved launched rocket');
 return {company:p.initialSelection.industry,choice,first,before,after:structuredClone(rocket),resources:{...p.resources},orbitCheck:c.actions.canExecute('orbit',c.createActionContext()),logs:api.getAiAutoBattleReport({includeAnalysis:false,includeDiagnostics:false}).logs.slice(-10),pending:api.getAiAutoBattleProgress().pendingState};
})()
