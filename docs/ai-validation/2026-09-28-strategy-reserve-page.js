(() => {
 const api=window.SetiRandomizer,c=window.__setiSmokeContext,ai=window.__smokeController;
 const assert=(ok,message)=>{if(!ok)throw Error(message);};
 api.configureAiAutoBattle({reset:true,activePlayerCount:4,suppressAutoSchedule:true});
 let setup;for(let n=0;n<180;n++){setup=api.beginPlayCardSelection();if(setup?.ok)break;api.runAiAutoBattleStep();}
 assert(setup?.ok,'setup');api.cancelPlayCardSelection();
 if(window.__strategyReserveFixture){
  api.restoreRecoverySnapshot(window.__strategyReserveFixture);
  // Recovery intentionally remaps rocket IDs; this valuation fixture compares
  // exactly the source identifiers as well as positions and ownership.
  Object.assign(c.rocketState,structuredClone(window.__strategyReserveFixture.state.rocketState));
 }
 c.techGameState.ui.industryBorrowMode=false;
 const p=api.playerState.players.find(p=>p.id===api.playerState.currentPlayerId);
 if(!window.__strategyReserveFixture){
 p.initialSelection.industry={id:'industry:宇宙大战略集团',label:'宇宙大战略集团'};
 p.industryStrategyPassiveSlots={yellow:true,red:true,blue:true};
 c.turnState.roundNumber=3;p.industryGrandStrategyRoundStartRound=3;
 Object.assign(p.resources,{score:59,credits:2,energy:6,publicity:5,availableData:0,handSize:1});
 p.dataState.poolTokens=[];
 p.hand=[SetiCards.createCardInstance(SetiCardCatalog.find(q=>q.card_id==='b_74.webp'))];
 }
 const card=p.hand[0],fixtureSnapshot=api.createRecoverySnapshot();
 const before=structuredClone(p.resources),unchanged=JSON.stringify({resources:p.resources,hand:p.hand,slots:p.industryStrategyPassiveSlots});
 const candidate=ai.buildAiPlayCardCandidate(card,0,p);assert(candidate?.available,'candidate');
 assert(unchanged===JSON.stringify({resources:p.resources,hand:p.hand,slots:p.industryStrategyPassiveSlots}),'preview changes live state');
 assert(candidate.cost.credits===2,'credit cost preserved');
 const begin=api.beginPlayCardSelection(),play=api.playHandCard(0);assert(begin.ok&&play.ok,'play');
 let steps=0;for(;steps<100;steps++){const q=api.getAiAutoBattleProgress().pendingState;if(!q.actionEffectFlowActive&&!Object.entries(q).some(([k,v])=>k.startsWith('pending')&&v))break;const step=api.runAiAutoBattleStep();assert(!step.blocked,'blocked');}
 assert(steps<100,'unfinished');assert(p.resources.credits===0,'actual payment');assert(p.resources.energy===6,'energy unchanged');
 assert(p.resources.publicity===6,'actual publicity');assert(p.resources.availableData===2,'actual data');
 const report=api.getAiAutoBattleReport({includeAnalysis:false,includeDiagnostics:false});assert(!report.bugs.length,'bugs');
 return{fixtureSnapshot,card:card.cardId||card.id,round:c.turnState.roundNumber,previewReadOnly:true,penalty:candidate.valueBreakdown.grandStrategyCreditBottleneckPenalty,candidateScore:candidate.score,cost:candidate.cost,before,after:structuredClone(p.resources),steps,bugs:report.bugs,scope:'Controlled R3 Grand Strategy2C6E b74; manual card selection verifies actual2C payment and1 publicity/2 data. It does not prove a full-game improvement or autonomous top-level ranking.'};
})()
