(() => {
 const api=window.SetiRandomizer,c=window.__setiSmokeContext,ai=window.__smokeController,assert=(x,m)=>{if(!x)throw Error(m);};
 api.configureAiAutoBattle({reset:true,activePlayerCount:4,suppressAutoSchedule:true});
 api.restoreRecoverySnapshot(window.__finalReturnFixture);
 Object.assign(c.rocketState,structuredClone(window.__finalReturnFixture.state.rocketState));
 Object.assign(c.cardTaskState,structuredClone(window.__finalReturnFixture.state.cardTaskState));
 c.techGameState.ui.industryBorrowMode=false;
 const p=c.getCurrentPlayer(),index=p.hand.findIndex(x=>x.cardId==='b_56.webp');assert(p.id==='player-brown'&&p.resources.credits===5&&p.resources.energy===0&&index>=0,'exact case19');
 const snapshot=api.createRecoverySnapshot(),before=structuredClone(p.resources),random=Math.random;let randomCalls=0,card,again;
 Math.random=()=>{randomCalls++;return random();};
 try{card=ai.buildAiPlayCardCandidate(p.hand[index],index,p);again=ai.buildAiPlayCardCandidate(p.hand[index],index,p);}finally{Math.random=random;}
 assert(card&&card.directScoreGain===0,'zero-direct-score card must exercise penalty');
 assert(!randomCalls&&JSON.stringify(card)===JSON.stringify(again)&&JSON.stringify(snapshot)===JSON.stringify(api.createRecoverySnapshot()),'read-only repeated valuation');
 assert(api.beginPlayCardSelection().ok&&api.playHandCard(index).ok,'actual play');
 for(let i=0;p.resources.energy===0&&i<30;i++){const step=api.runAiAutoBattleStep();assert(!step.blocked,'energy grant');}
 const afterEnergy=structuredClone(p.resources),ready=c.data.canAnalyzeData(p);assert(afterEnergy.credits===2&&afterEnergy.energy===1,'actual resources');assert(ready.ok,'analysis payable after card energy');
 for(let i=0;i<100;i++){const q=api.getAiAutoBattleProgress().pendingState;if(!q.actionEffectFlowActive&&!Object.entries(q).some(([k,v])=>k.startsWith('pending')&&v))break;const step=api.runAiAutoBattleStep();assert(!step.blocked&&i<99,'finish tech');}
 const after=structuredClone(p.resources);assert(api.endCurrentTurn().ok,'commit');
 const entries=c.getActionLogEntries({includeRecovery:true,readOnlyInternal:true}).slice(-1),bugs=api.getAiAutoBattleReport({includeAnalysis:false,includeDiagnostics:false}).bugs;assert(!bugs.length,'bugs');
 return {scope:'Exact captured current-policy fixed19 decision state, forced same physical b56 play for before/after model comparison. Runtime payment/energy/research and analysis affordability verified; no forced subsequent analysis or whole-game uplift claim.',snapshot,card,before,afterEnergy,after,ready,entries,randomCalls,bugs};
})()
