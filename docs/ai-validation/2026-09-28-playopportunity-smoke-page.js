(() => {
  const api = window.SetiRandomizer, context = window.__setiSmokeContext;
  api.configureAiAutoBattle({reset:true,activePlayerCount:4,suppressAutoSchedule:true});
  let begin;
  for(let i=0;i<180;i++){begin=api.beginPlayCardSelection();if(begin?.ok)break;api.runAiAutoBattleStep();}
  if(!begin?.ok)throw Error('setup failed');
  api.cancelPlayCardSelection();
  const p=api.playerState.players.find(x=>x.id===api.playerState.currentPlayerId);
  const ctl=SetiAppAiController.createAiController(context), rows=[];
  p.resources.credits=20;p.resources.energy=20;
  for(const catalog of SetiCardCatalog){
    const card=SetiCards.createCardInstance(catalog);p.hand=[card];p.resources.handSize=1;
    const before=JSON.stringify(p),profile=ctl.getAiPlayCardOpportunityProfile(card);
    if(JSON.stringify(p)!==before)throw Error('mutated state');
    const candidate=ctl.buildAiPlayCardCandidate(card,0,p);
    if(!candidate||profile.legacySum-profile.value<1||candidate.effectTypes.some(t=>t!=='gain_resources'))continue;
    if(candidate.valueBreakdown.cornerOpportunity!==profile.value)throw Error('candidate mismatch');
    rows.push({cardId:card.cardId,profile,score:candidate.score,cost:candidate.cost});
    const credits=p.resources.credits,energy=p.resources.energy;
    const started=api.beginPlayCardSelection(),played=api.playHandCard(0);
    if(!started.ok||!played.ok)throw Error('play failed');
    let steps=0;
    for(;steps<100;steps++){
      const pending=api.getAiAutoBattleProgress().pendingState;
      if(!pending.actionEffectFlowActive&&!Object.entries(pending).some(([k,v])=>k.startsWith('pending')&&v))break;
      const result=api.runAiAutoBattleStep();if(result?.blocked)throw Error('blocked');
    }
    const report=api.getAiAutoBattleReport({includeAnalysis:false,includeDiagnostics:false});
    if(steps===100||report.bugs.length)throw Error('runtime failure');
    api.endCurrentTurn();
    return {rows,steps,before:{credits,energy},after:{...p.resources},history:api.getActionLog({includeRecovery:false}).at(-1),bugs:report.bugs};
  }
  throw Error('no actual multi-use card exercised');
})()
