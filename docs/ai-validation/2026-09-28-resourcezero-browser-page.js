(() => {
 const api=window.SetiRandomizer,c=window.__setiSmokeContext,ai=window.__smokeController,rows=[];
 const assert=(x,m)=>{if(!x)throw Error(m);};
 for(const test of [{card:'b_39.webp',key:'availableData',start:6,gain:0},{card:'b_39.webp',key:'availableData',start:5,gain:1},{card:'b_39.webp',key:'availableData',start:0,gain:2},
  {card:'b_67.webp',key:'publicity',start:10,gain:0},{card:'b_67.webp',key:'publicity',start:9,gain:1},{card:'b_67.webp',key:'publicity',start:0,gain:3}]){
  api.configureAiAutoBattle({reset:true,activePlayerCount:4,suppressAutoSchedule:true});api.restoreRecoverySnapshot(window.__resourceZeroFixture);
  const p=api.playerState.players.find(p=>p.id===api.playerState.currentPlayerId);
  p.initialSelection.industry={id:'industry:宇宙大战略集团',label:'宇宙大战略集团'};p.industryStrategyPassiveSlots={yellow:true,red:true,blue:true};p.reservedCards=[];
  c.turnState.roundNumber=1;p.industryGrandStrategyRoundStartRound=1;
  Object.assign(p.resources,{score:0,credits:10,energy:5,publicity:0,availableData:0,handSize:1});p.resources[test.key]=test.start;
  p.techState=SetiPlayerTech.createPlayerTechState({});p.dataState={poolTokens:Array.from({length:p.resources.availableData},(_,i)=>({id:'zero-data-'+i,slotIndex:i+1,index:i+1})),placedTokens:[],discardedCount:0};
  const card=SetiCards.createCardInstance(SetiCardCatalog.find(x=>x.card_id===test.card));card.id='resourcezero-source';p.hand=[card];
  const effect=SetiCardEffects.getCardModel(card).playEffects[0],snapshot=JSON.stringify(p),value=ai.scoreAiEffectValue(effect,{player:p,immediate:true});assert(JSON.stringify(p)===snapshot,'valuation mutated player');
  const before=structuredClone(p.resources);assert(c.beginPlayCardSelection().ok,'begin');assert(c.handlePlayCardSelect(0).ok,'select');assert(c.confirmPlayCardSelection().ok,'confirm');
  const paid=structuredClone(p.resources);assert(paid.credits===before.credits-card.price,'actual payment');
  let n=0;for(;n<80;n++){const q=api.getAiAutoBattleProgress().pendingState;if(!q.actionEffectFlowActive&&!Object.entries(q).some(([k,v])=>k.startsWith('pending')&&v))break;assert(!api.runAiAutoBattleStep().blocked,'blocked');}assert(n<80,'unfinished');
  assert(p.resources[test.key]-before[test.key]===test.gain,'actual cap '+JSON.stringify(test));
  const report=api.getAiAutoBattleReport({includeAnalysis:false,includeDiagnostics:false});assert(!report.bugs.length,'bugs');
  rows.push({test,value,before,paid,after:structuredClone(p.resources),bugs:report.bugs});
 }
 return {rows,scope:'Six forced actual card-payment and reward flows with full/partial/empty publicity/data capacity. Compare old/new runtime outcomes and uncapped valuation; no autonomous whole-game strength claim.'};
})()
