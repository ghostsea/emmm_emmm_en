(() => {
 const api=window.SetiRandomizer,c=window.__setiSmokeContext,ai=window.__smokeController;
 const assert=(ok,message)=>{if(!ok)throw Error(message);};
 api.configureAiAutoBattle({reset:true,activePlayerCount:4,suppressAutoSchedule:true});
 api.restoreRecoverySnapshot(window.__cardGraphFixture);
 Object.assign(c.rocketState,structuredClone(window.__cardGraphFixture.state.rocketState));
 // Recovery rebuilds this UI task cache for the current player. Preserve the
 // captured cache too, so the comparison does not silently discard a state field.
 Object.assign(c.cardTaskState,structuredClone(window.__cardGraphFixture.state.cardTaskState));
 c.techGameState.ui.industryBorrowMode=false;
 const p=api.playerState.players.find(p=>p.id===api.playerState.currentPlayerId);
 assert(p.id==='player-white'&&p.resources.score===67&&p.resources.credits===2&&p.resources.energy===7,'exact target resources');
 const snapshot=api.createRecoverySnapshot(),before=structuredClone(p.resources);
 const raw=p.hand.map((card,i)=>ai.buildAiPlayCardCandidate(card,i,p)).filter(Boolean);
 const b90=raw.find(card=>card.cardId==='b_90.webp'),amiba=raw.find(card=>card.cardId==='amiba_0.webp');
 assert(b90&&amiba,'both legal alternatives');
 assert(Math.abs(b90.score-23.935782)<1e-6,'baseline b90 raw score reproduced');
 assert(amiba.valueBreakdown.grandStrategyCreditBottleneckPenalty===7,'existing reserve remains enabled');
 const selected=ai.selectAiPlayCardTurnCandidate(raw,p);
 const raised=raw.map(card=>card===amiba?{...card,score:card.score+7}:card);
 const reranked=ai.selectAiPlayCardTurnCandidate(raised,p);
 const unchanged=JSON.stringify(api.createRecoverySnapshot().state,(k,v)=>['createdAt','placedAt'].includes(k)?undefined:v);
 assert(unchanged===JSON.stringify(snapshot.state,(k,v)=>['createdAt','placedAt'].includes(k)?undefined:v),'preview changes game state');
 assert(selected.cardId==='b_90.webp'&&reranked.cardId==='b_90.webp','better graph remains visible after raw competitor increase');
 const g=ai.buildAiAdjustedTurnGraph([reranked],ai.buildAiTurnGraphState(p),p)[0];
 assert(g.actionGraph.net===reranked.cardGraphAlternatives.find(q=>q.cardId==='b_90.webp').net,'graph value survives full hand list');
 const decision=api.runAiAutoBattleStep();assert(!decision.blocked,'turn blocked');
 const paid=api.runAiAutoBattleStep();assert(!paid.blocked,'payment blocked');
 const afterPayment=structuredClone(p.resources);
 assert(afterPayment.credits===before.credits-b90.cost.credits,'actual two-credit payment before scan rewards');
 let steps=0;
 for(;steps<100;steps++){
  const q=api.getAiAutoBattleProgress().pendingState;
  if(steps>0&&!q.actionEffectFlowActive&&!Object.entries(q).some(([k,v])=>k.startsWith('pending')&&v))break;
  const step=api.runAiAutoBattleStep();assert(!step.blocked,'card blocked');
 }
 assert(steps<100,'card did not finish');
 const report=api.getAiAutoBattleReport({includeAnalysis:false,includeDiagnostics:false});
 const turn=report.logs.filter(l=>l.type==='turn-action').at(-1),play=report.logs.filter(l=>l.type==='play-card'&&l.details.selected).at(-1);
 assert(turn?.details.action.cardInstanceId===b90.cardInstanceId,'autonomous turn selection');
 assert(play?.details.selected.cardInstanceId===b90.cardInstanceId,'actual same instance selection');
 assert(!report.bugs.length,'runtime bugs');
 return{snapshot,before,afterPayment,after:structuredClone(p.resources),selected,raisedRawOnly:reranked,
  turn:turn.details.action,play:play.details.selected,steps,bugs:report.bugs,
  scope:'Exact case6 state; reserve remains7. +7 is a local diagnostic copy only, never applied to runtime. Ranking and actual b90 payment are verified, not full-game score benefit.'};
})()
