(() => {
 const api=window.SetiRandomizer,c=window.__setiSmokeContext,results=[];
 for(const [id,type,ownership,mode]of [['b_27.webp','pink','first'],['b_32.webp','yellow','extra'],['b_35.webp','blue','first'],['b_35.webp','blue','first','fangzhou']]){
  api.configureAiAutoBattle({reset:true,activePlayerCount:4,suppressAutoSchedule:true});
  let begin;for(let i=0;i<180;i++){begin=api.beginPlayCardSelection();if(begin?.ok)break;api.runAiAutoBattleStep();}if(!begin?.ok)throw Error('setup');api.cancelPlayCardSelection();
  const p=api.playerState.players.find(p=>p.id===api.playerState.currentPlayerId),other=api.playerState.players.find(q=>q.id!==p.id);
  c.alienGameState.aliens=c.aliens.createDefaultAlienState().aliens;
  if(mode==='fangzhou'){const slot=c.alienGameState.aliens[1];slot.revealed=true;slot.alienId=c.fangzhou.ALIEN_ID;slot.assignedAlienId=c.fangzhou.ALIEN_ID;c.alienGameState.fangzhou=c.fangzhou.createFangzhouState();c.fangzhou.initializeFangzhouReveal(c.alienGameState,1,p,api.playerState.players,()=>0.5);}
  const card=SetiCards.createCardInstance(SetiCardCatalog.find(q=>q.card_id===id));p.hand=[card];p.resources.credits=3;p.resources.energy=1;p.resources.handSize=1;p.resources.score=80;
  const traceCalls=[]; const controller=SetiAppAiController.createAiController({...c,ai:{...c.ai,valuation:{...c.ai.valuation,estimateAlienTraceValue(input){const value=c.ai.valuation.estimateAlienTraceValue(input);traceCalls.push({type:input.traceType??null,slot:input.alienSlotId??null,mode:input.mode,position:input.position??null,reward:input.reward??null,value});return value;}}}}),effect=c.cardEffects.buildPlayEffects(card).find(e=>e.type==='alien_trace');
  if(c.getAlienTraceRewardAvailability(effect,p).ok||controller.buildAiPlayCardCandidate(card,0,p))throw Error('same-trace requirement ignored');
  const trace=c.alienGameState.aliens[1].traces[type];trace.firstPlaced=true;trace.ownerPlayerColor=ownership==='first'?p.color:other.color;
  if(ownership==='extra'){trace.extraCount=1;trace.extraMarkers=[{ownerPlayerColor:p.color}];}
  traceCalls.length=0; const availability=c.getAlienTraceRewardAvailability(effect,p),candidate=controller.buildAiPlayCardCandidate(card,0,p);
  if(!availability.ok||!candidate)throw Error('missing legal candidate '+id+' '+JSON.stringify(availability));
  const before=structuredClone(p.resources),countBefore=trace.extraCount;
  begin=api.beginPlayCardSelection();const played=api.playHandCard(0);if(!begin.ok||!played.ok)throw Error('play '+JSON.stringify(played));
  let steps=0;for(;steps<80;steps++){const pending=api.getAiAutoBattleProgress().pendingState;if(!pending.actionEffectFlowActive&&!Object.entries(pending).some(([k,v])=>k.startsWith('pending')&&v))break;const r=api.runAiAutoBattleStep();if(r?.blocked)throw Error('blocked '+JSON.stringify(r));}
  const report=api.getAiAutoBattleReport({includeAnalysis:false,includeDiagnostics:false});
  if(steps>=80||report.bugs.length)throw Error('unfinished '+JSON.stringify(report.bugs));
  if(p.resources.credits!==before.credits-1||(!mode&&(p.resources.score!==before.score+3||trace.extraCount!==countBefore+1)))throw Error('wrong payout '+JSON.stringify({before,after:p.resources,trace,countBefore}));
  const panelTraces=mode==='fangzhou'?c.fangzhou.listTraceEntries(c.alienGameState,1,type).length:0;
  if(mode==='fangzhou'&&panelTraces+trace.extraCount-countBefore!==1)throw Error('trace not placed');
  const actualTrace=report.logs.filter(l=>l.type==='alien-trace').at(-1)?.details;
  if(!actualTrace?.directCardTraceValue||Math.abs(actualTrace.directCardTraceValue.value-candidate.valueBreakdown.effectValue)>0.00001)throw Error('direct trace picker did not use card valuation');
  results.push({actualTrace,traceCalls,effectOptions:effect.options,valueBreakdown:candidate.valueBreakdown,id,type,ownership,mode:mode||'hidden',availability,selectedScore:candidate.score,steps,actual:{credits:p.resources.credits-before.credits,score:p.resources.score-before.score,energy:p.resources.energy-before.energy,data:p.resources.availableData-before.availableData,hand:p.hand.length-1,extraTraces:trace.extraCount-countBefore,panelTraces},bugs:report.bugs});
 }
 return{ok:true,results};
})()
