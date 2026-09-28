(() => {
 const api=window.SetiRandomizer,c=window.__setiSmokeContext;
 api.configureAiAutoBattle({reset:true,activePlayerCount:4,suppressAutoSchedule:true});
 let begin;for(let i=0;i<180;i++){begin=api.beginPlayCardSelection();if(begin?.ok)break;api.runAiAutoBattleStep();}
 if(!begin?.ok)throw Error('setup');api.cancelPlayCardSelection();
 const p=api.playerState.players.find(p=>p.id===api.playerState.currentPlayerId);
 c.turnState.roundNumber=4;
 for(const [id,tile]of Object.entries(c.finalScoringState.tiles))tile.marks=['a','b','c'].includes(id)?[{playerId:p.id,slotIndex:1,threshold:70}]:[];
 c.finalScoringState.pendingMarks=[];c.finalScoringState.tileVariants.a=2;
 const base=c.players.normalizeIncome(c.initialCards.getIndustryEffect(p.initialSelection.industry).baseIncome);
 p.income={credits:base.credits+2,energy:base.energy+1,handSize:base.handSize+2};
 p.resources.score=80;p.resources.credits=0;p.resources.energy=0;
 const energyCard=SetiCardCatalog.map(q=>SetiCards.createCardInstance(q)).find(q=>{const g=c.cards.getIncomeGainForCard(q);return g.energy===1&&!g.credits&&!g.handSize;});
 if(!energyCard)throw Error('no energy card');p.hand=[energyCard];p.resources.handSize=1;
 const before=structuredClone(p),controller=SetiAppAiController.createAiController(c);
 const scoreBefore=c.computePlayerFinalScoreBreakdown(p).totalScore;
 const profile=controller.getAiFinalIncomeChoiceSettlement(p,c.cards.getIncomeGainForCard(energyCard));
 if(profile.incomeFinalScoreGain!==11||profile.immediateGain.energy!==1)throw Error('wrong profile '+JSON.stringify({base,profile}));
 if(JSON.stringify(before)!==JSON.stringify(p))throw Error('preview mutated player');
 begin=api.beginIncomeForCurrentPlayer();if(!begin.ok)throw Error('income '+JSON.stringify(begin));
 const step=api.runAiAutoBattleStep();if(!step.ok)throw Error('selection '+JSON.stringify(step));
 const scoreAfter=c.computePlayerFinalScoreBreakdown(p).totalScore;
 if(p.resources.energy!==before.resources.energy+1||p.income.energy!==before.income.energy+1||p.hand.length!==0||scoreAfter-scoreBefore!==11)throw Error('runtime mismatch '+JSON.stringify({before,after:p,scoreBefore,scoreAfter}));
 const report=api.getAiAutoBattleReport({includeAnalysis:false,includeDiagnostics:false});if(report.bugs.length)throw Error('bugs '+JSON.stringify(report.bugs));
 return {ok:true,companyBase:base,cardId:energyCard.cardId||energyCard.id,profile,actual:{immediateEnergy:p.resources.energy-before.resources.energy,incomeEnergy:p.income.energy-before.income.energy,incomeFinalScore:scoreAfter-scoreBefore,discarded:before.hand.length-p.hand.length},bugs:report.bugs};
})()
