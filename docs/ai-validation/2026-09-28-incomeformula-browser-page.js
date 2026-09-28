(() => {
 const api=window.SetiRandomizer,c=window.__setiSmokeContext,ai=window.__smokeController,rows=[];
 const assert=(x,m)=>{if(!x)throw Error(m);};
 for(const id of ['b_42.webp','b_47.webp','b_79.webp']){
  api.configureAiAutoBattle({reset:true,activePlayerCount:4,suppressAutoSchedule:true});
  api.restoreRecoverySnapshot(window.__incomeFormulaFixture);
  const p=api.playerState.players.find(p=>p.id===api.playerState.currentPlayerId);
  p.initialSelection.industry={id:'industry:宇宙大战略集团',label:'宇宙大战略集团'};
  p.industryStrategyPassiveSlots={yellow:true,red:true,blue:true};p.reservedCards=[];
  c.turnState.roundNumber=3;p.industryGrandStrategyRoundStartRound=3;
  Object.assign(p.resources,{score:59,credits:10,energy:5,publicity:1,availableData:0,handSize:1});
  const base=c.players.normalizeIncome(c.initialCards.getIndustryEffect(p.initialSelection.industry).baseIncome);
  p.income={...base,credits:base.credits+3,energy:base.energy+3,handSize:base.handSize+2};
  const card=SetiCards.createCardInstance(SetiCardCatalog.find(x=>x.card_id===id));card.id='income-formula-'+id;p.hand=[card];
  const before=structuredClone(p.resources),beforeIncome=structuredClone(p.income);
  assert(c.beginPlayCardSelection().ok,'begin');assert(c.handlePlayCardSelect(0).ok,'select');assert(c.confirmPlayCardSelection().ok,'confirm');
  const paid=structuredClone(p.resources);assert(paid.credits===before.credits-card.price,'fee');
  let n=0;for(;n<60;n++){const q=api.getAiAutoBattleProgress().pendingState;
   if(!q.actionEffectFlowActive&&!Object.entries(q).some(([k,v])=>k.startsWith('pending')&&v))break;
   assert(!api.runAiAutoBattleStep().blocked,'blocked '+id);
  }assert(n<60,'unfinished');
  const after=structuredClone(p.resources),afterIncome=structuredClone(p.income);
  if(id==='b_42.webp'){assert(after.energy-before.energy===4,'3 counted plus1 tuck');assert(afterIncome.energy-beforeIncome.energy===1,'income only1');}
  if(id==='b_47.webp'){assert(after.score-before.score===9,'counted9score');assert(after.credits-before.credits===1-card.price,'tuck1credit');assert(afterIncome.credits-beforeIncome.credits===1,'income only1credit');}
  if(id==='b_79.webp'){assert(after.publicity-before.publicity===4,'2fixed+2counted publicity');assert(afterIncome.handSize-beforeIncome.handSize===1,'tuck1cardincome');}
  assert(c.endCurrentTurn().ok,'end transaction');
  const logs=api.getActionLog(),report=api.getAiAutoBattleReport({includeAnalysis:false,includeDiagnostics:false});
  const events=report.resourceFlow?.events?.filter(e=>e.playerId===p.id&&/高于公司默认|将本卡放入收入区/.test(e.sourceDetail))||[];
  assert(events.length===2,'two parsed actual effect nodes '+JSON.stringify({events,logs}));
  assert(!report.bugs.length,'bugs');
  rows.push({card:id,before,paid,after,beforeIncome,afterIncome,events,steps:n,bugs:report.bugs});
 }
 return {rows,scope:'Real paid card flow and completed action log: count existing income then tuck the played card once. Resources and permanent income checked separately; old/new parser compares classification, not gameplay.'};
})()
