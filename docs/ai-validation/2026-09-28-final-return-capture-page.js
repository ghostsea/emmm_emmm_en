(async () => {
 const api=window.SetiRandomizer,c=window.__setiSmokeContext;
 const choose=c.ai.policy.chooseTurnAction;
 let fixture=null,candidates=null,selected=null;
 c.ai.policy.chooseTurnAction=(choices,...args)=>{
  const action=choose(choices,...args),p=api.playerState.players.find(p=>p.id===api.playerState.currentPlayerId);
  if(!fixture&&p?.id==='player-brown'&&c.turnState.roundNumber===4&&p.resources.score===93
    &&p.resources.credits===5&&p.resources.energy===0&&action?.id==='quickTrade'&&choices.some(x=>x.id==='playCard')){
   c.techGameState.ui.industryBorrowMode=false;
   fixture=api.createRecoverySnapshot();candidates=structuredClone(choices);selected=structuredClone(action);
   api.stopAiAutoBattle();
  }
  return action;
 };
 const result=await api.startAiAutoBattle({reset:true,seed:'codex-ai-slot-first-random-20260906:6a07740fcd065dd08b8461cc',
  activePlayerCount:4,maxSteps:2000,stepDelayMs:0,maxBugRepeats:1,yieldEverySteps:20,stopOnBlocked:true,
  retainAnalysis:false,includeSampleDiagnostics:false,includeLogs:true});
 if(!fixture)throw Error('case19 fixture not reached');
 if(result.bugs?.length)throw Error('unexpected bugs');
 return{fixture,candidates,selected,steps:result.steps,bugs:result.bugs};
})()
