(() => {
 const api=window.SetiRandomizer,c=window.__setiSmokeContext,ai=window.__smokeController,rows=[];
 for(const round of [1,4])for(const cardId of ['b_42.webp','b_47.webp','b_79.webp']){
  api.configureAiAutoBattle({reset:true,activePlayerCount:4,suppressAutoSchedule:true});
  let begin;for(let i=0;i<180;i++){begin=api.beginPlayCardSelection();if(begin?.ok)break;api.runAiAutoBattleStep();}if(!begin?.ok)throw Error('setup');api.cancelPlayCardSelection();
  const p=c.getCurrentPlayer();p.initialSelection.industry={id:'industry:寰宇超动力',label:'寰宇超动力'};
  c.turnState.roundNumber=round;p.income={credits:5,energy:3,handSize:2};p.reservedCards=[];
  const card=c.cards.createCardInstance(SetiCardCatalog.find(x=>x.card_id===cardId));p.hand=[card];
  Object.assign(p.resources,{credits:8,energy:3,publicity:0,availableData:0,handSize:1,score:0});
  const beforeSnapshot=JSON.stringify(api.createRecoverySnapshot()),random=Math.random;let randomCalls=0;
  Math.random=()=>{randomCalls++;return random();};let first,second;
  try{first=ai.buildAiPlayCardCandidate(card,0,p);second=ai.buildAiPlayCardCandidate(card,0,p);}finally{Math.random=random;}
  if(randomCalls||beforeSnapshot!==JSON.stringify(api.createRecoverySnapshot())||JSON.stringify(first)!==JSON.stringify(second))throw Error('valuation mutation');
  const profile=first?.valueBreakdown.huanyuSelfIncome;if(!profile||profile.futurePayouts.length!==4-round)throw Error('profile missing');
  const company=p.initialSelection.industry;
  for(const other of ['作弊实验室','宇宙大战略集团']){p.initialSelection.industry={id:'industry:'+other,label:other};if(ai.getAiHuanyuSelfIncomeProfile(card,p)!==null)throw Error('scope');}p.initialSelection.industry=company;
  const before={resources:structuredClone(p.resources),income:structuredClone(p.income)},price=first.price;
  if(!api.beginPlayCardSelection().ok||!api.playHandCard(0).ok)throw Error('play');
  const paid=structuredClone(p.resources);if(paid.credits!==8-price)throw Error('payment');
  for(let i=0;i<60;i++){const q=api.getAiAutoBattleProgress().pendingState;if(!q.actionEffectFlowActive&&!Object.entries(q).some(([k,v])=>k.startsWith('pending')&&v))break;const step=api.runAiAutoBattleStep();if(step.blocked||i===59)throw Error('blocked effects');}
  for(const key of ['credits','energy','handSize'])if(p.income[key]!==before.income[key]+(profile.gain[key]||0))throw Error('income '+key);
  if(p.resources.credits!==8-price+(profile.gain.credits||0))throw Error('credit receipt');
  if(p.resources.energy!==3+(cardId==='b_42.webp'?2:0)+(profile.gain.energy||0))throw Error('energy receipt');
  if(p.hand.length!==(profile.gain.handSize||0)||p.hand.some(x=>x.id===card.id))throw Error('self tuck must not consume second card');
  const report=api.getAiAutoBattleReport({includeAnalysis:false,includeDiagnostics:false});if(report.bugs.length)throw Error('bug');
  rows.push({round,cardId,instance:card.id,randomCalls,profile,candidate:first,before,paid,after:{resources:structuredClone(p.resources),income:structuredClone(p.income),hand:p.hand.map(x=>({id:x.id,cardId:x.cardId}))},tail:report.logs.slice(-5)});
 }
 return {scope:'Six controlled real browser cases, R1/R4 self tuck three normal cards: readonly repeated candidate model, actual play cost, immediate reward, income track and no extra hand discard. Future payouts are modeled, not observed here. Forced play validates runtime, not score uplift.',rows};
})()
