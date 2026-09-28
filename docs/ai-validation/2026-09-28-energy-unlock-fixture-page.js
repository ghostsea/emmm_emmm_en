(() => {
 const api=window.SetiRandomizer,c=window.__setiSmokeContext,ai=window.__smokeController,assert=(x,m)=>{if(!x)throw Error(m);};
 api.configureAiAutoBattle({reset:true,activePlayerCount:4,suppressAutoSchedule:true});
 api.restoreRecoverySnapshot(window.__energyUnlockFixture);
 Object.assign(c.rocketState,structuredClone(window.__energyUnlockFixture.state.rocketState));
 c.rocketState.playerRocketSequences=Object.fromEntries(window.__energyUnlockSequences.map(([id,used])=>[id,new Set(used)]));
 Object.assign(c.cardTaskState,structuredClone(window.__energyUnlockFixture.state.cardTaskState));
 c.techGameState.ui.industryBorrowMode=false;
 const p=c.getCurrentPlayer(),target=p.hand.find(x=>x.cardId==='banrenma_9.webp');
 assert(target&&p.resources.score===31&&p.resources.credits===5&&p.resources.energy===0,'exact fixed17 state');
 const snapshot=api.createRecoverySnapshot(),before=structuredClone(p.resources),random=Math.random;let calls=0,plans,again;
 Math.random=()=>{calls++;return random();};
 try{plans=['cards-for-energy','credits-for-energy'].map(id=>ai.buildAiMainUnlockTradeCandidate(p,id));again=['cards-for-energy','credits-for-energy'].map(id=>ai.buildAiMainUnlockTradeCandidate(p,id));}finally{Math.random=random;}
 assert(!calls&&JSON.stringify(snapshot)===JSON.stringify(api.createRecoverySnapshot())&&JSON.stringify(plans)===JSON.stringify(again),'readonly repeat valuation');
 if(!plans[0])return {snapshot,before,plans,randomCalls:calls,executed:false};
 const plan=plans[0];assert(p.hand[plan.preserveHandIndex].id===target.id,'same target card');
 assert(c.runQuickTrade(plan.tradeId,{preserveHandIndex:plan.preserveHandIndex}).ok,'trade');
 for(let i=0;c.state.pendingDiscardAction&&i<10;i++){const step=api.runAiAutoBattleStep();assert(!step.blocked&&i<9,'discard');}
 assert(p.hand.length===1&&p.hand[0].id===target.id&&p.resources.energy===1&&p.resources.credits===5,'two other cards buy energy');
 const afterTrade=structuredClone(p.resources);assert(api.beginPlayCardSelection().ok&&api.playHandCard(0).ok,'pay actual alien energy');
 const afterPayment=structuredClone(p.resources);assert(afterPayment.energy===0,'paid one energy');
 for(let i=0;i<100;i++){const pending=api.getAiAutoBattleProgress().pendingState;if(!pending.actionEffectFlowActive&&!Object.entries(pending).some(([k,v])=>k.startsWith('pending')&&v))break;const step=api.runAiAutoBattleStep();assert(!step.blocked&&i<99,'effects finish '+JSON.stringify({i,step,pending}));}
 assert(p.reservedCards.some(x=>x.id===target.id),'half-human card retained');assert(api.endCurrentTurn().ok,'commit');
 const entries=c.getActionLogEntries({includeRecovery:true,readOnlyInternal:true}).slice(-1),bugs=api.getAiAutoBattleReport({includeAnalysis:false,includeDiagnostics:false}).bugs;assert(!bugs.length,'bugs');
 return{scope:'Exact current-policy fixed17 snapshot: compare readonly energy-unlock plans, then force planned trade and card to verify payment/target preservation and effect execution. This is not an autonomous full-game score estimate.',snapshot,before,plans,randomCalls:calls,executed:true,afterTrade,afterPayment,after:structuredClone(p.resources),entries,bugs};
})()
