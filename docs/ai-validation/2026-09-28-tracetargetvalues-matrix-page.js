(() => {
 const api=window.SetiRandomizer,c=window.__setiSmokeContext;
 api.configureAiAutoBattle({reset:true,activePlayerCount:4,suppressAutoSchedule:true});let begin;
 for(let i=0;i<180;i++){begin=api.beginPlayCardSelection();if(begin?.ok)break;api.runAiAutoBattleStep();}if(!begin?.ok)throw Error('setup');api.cancelPlayCardSelection();
 let p=api.playerState.players.find(p=>p.id===api.playerState.currentPlayerId);const rows=[];
 for(const [name,title]of [['jiuzhe','Jiuzhe'],['yichangdian','Yichangdian'],['fangzhou','Fangzhou'],['banrenma','Banrenma'],['chong','Chong'],['amiba','Amiba'],['aomomo','Aomomo'],['runezu','Runezu']]){
  const module=c[name];c.alienGameState.aliens=c.aliens.createDefaultAlienState().aliens;
  c.alienGameState[name]=module['create'+title+'State']();const slot=c.alienGameState.aliens[1];slot.revealed=true;slot.alienId=module.ALIEN_ID;slot.assignedAlienId=module.ALIEN_ID;
  const init=module['initialize'+title+'Reveal'];
  if(['jiuzhe','fangzhou','banrenma'].includes(name))init(c.alienGameState,1,p,api.playerState.players,()=>0.5);
  else if(name==='yichangdian')init(c.alienGameState,1,p,0,()=>0.5);
  else if(name==='runezu')init(c.alienGameState,1,p,{random:()=>0.5});
  else init(c.alienGameState,1,p,()=>0.5);
  p.resources.credits=0;p.resources.energy=0;p.resources.availableData=0;c.data.ensurePlayerDataState(p).poolTokens=[];
  for(const type of module.TRACE_TYPES){slot.traces[type].firstPlaced=true;slot.traces[type].ownerPlayerColor=p.color;}
  const before=JSON.stringify(c.alienGameState),effect={type:'alien_trace',options:{targetRule:'playerHasSameTrace',allowedTraceTypes:['blue']}};
  const a=c.getAlienTraceRewardAvailability(effect,p);if(JSON.stringify(c.alienGameState)!==before)throw Error('preview mutated '+name);
  if(!a.ok||a.targets.some(t=>t.alienSlotId!==1||t.traceType!=='blue'))throw Error('scope '+name);
  if(a.targets.some(t=>(t.reward?.payData||0)>0||(t.reward?.payEnergy||0)>0))throw Error('unaffordable '+name);
  rows.push({name,targets:a.targets});
 }
 // Real b36 payment + first trace + trace-count score. No forced target.
 api.configureAiAutoBattle({reset:true,activePlayerCount:4,suppressAutoSchedule:true});
 for(let i=0;i<180;i++){begin=api.beginPlayCardSelection();if(begin?.ok)break;api.runAiAutoBattleStep();}if(!begin?.ok)throw Error('b36 setup');api.cancelPlayCardSelection();
 p=api.playerState.players.find(p=>p.id===api.playerState.currentPlayerId);
 c.alienGameState.aliens=c.aliens.createDefaultAlienState().aliens;
 const card=SetiCards.createCardInstance(SetiCardCatalog.find(q=>q.card_id==='b_36.webp'));p.hand=[card];Object.assign(p.resources,{credits:3,energy:1,score:80,handSize:1});
 const controller=SetiAppAiController.createAiController(c),before=structuredClone(p.resources),candidate=controller.buildAiPlayCardCandidate(card,0,p);
 if(!candidate)throw Error('missing b36');const selected=candidate.valueBreakdown.directTracePreviews[0].selected;
 if(selected.afterScore!==1||selected.kind!=='state-first')throw Error('count preview');
 begin=api.beginPlayCardSelection();const played=api.playHandCard(0);if(!begin.ok||!played.ok)throw Error('payment');
 let steps=0;for(;steps<80;steps++){const pending=api.getAiAutoBattleProgress().pendingState;if(!pending.actionEffectFlowActive&&!Object.entries(pending).some(([k,v])=>k.startsWith('pending')&&v))break;const r=api.runAiAutoBattleStep();if(r?.blocked)throw Error('blocked');}
 const report=api.getAiAutoBattleReport({includeAnalysis:false,includeDiagnostics:false});if(steps>=80||report.bugs.length)throw Error('unfinished');
 const actual={credits:p.resources.credits-before.credits,score:p.resources.score-before.score};if(actual.credits!==-candidate.cost.credits||actual.score!==selected.directScore)throw Error('actual payoff '+JSON.stringify({selected,actual,cost:candidate.cost,played,logs:report.logs.slice(-8)}));
 return{ok:true,rows,b36:{selected,actual,steps,bugs:report.bugs}};
})()
