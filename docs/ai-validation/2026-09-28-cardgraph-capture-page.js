(async () => {
 const api=window.SetiRandomizer,c=window.__setiSmokeContext;
 const choose=c.ai.policy.chooseTurnAction;
 let fixture=null,candidates=null,selected=null;
 c.ai.policy.chooseTurnAction=(choices,...args)=>{
  const action=choose(choices,...args),p=api.playerState.players.find(p=>p.id===api.playerState.currentPlayerId);
  if(!fixture&&p?.id==='player-white'&&c.turnState.roundNumber===3&&p.resources.score===67
    &&p.resources.credits===2&&p.resources.energy===7&&p.resources.handSize===5&&action?.id==='playCard'&&action.cardId==='b_90.webp'){
   c.techGameState.ui.industryBorrowMode=false;
   fixture=api.createRecoverySnapshot();candidates=structuredClone(choices);selected=structuredClone(action);
   api.stopAiAutoBattle();
  }
  return action;
 };
 const result=await api.startAiAutoBattle({reset:true,seed:'codex-ai-slot-first-random-20260906:deba464147520c426c26e127',
  activePlayerCount:4,maxSteps:2000,stepDelayMs:0,maxBugRepeats:1,yieldEverySteps:20,stopOnBlocked:true,
  retainAnalysis:false,includeSampleDiagnostics:false,includeLogs:true});
 if(!fixture)throw Error('case6 fixture not reached');
 if(result.bugs?.length)throw Error('unexpected bugs');
 return{fixture,candidates,selected,steps:result.steps,bugs:result.bugs};
})()
