(() => {
 const api=window.SetiRandomizer,c=window.__setiSmokeContext;
 api.configureAiAutoBattle({reset:true,activePlayerCount:4,suppressAutoSchedule:true});
 let begin;for(let i=0;i<180;i++){begin=api.beginPlayCardSelection();if(begin?.ok)break;api.runAiAutoBattleStep();}if(!begin?.ok)throw Error('setup');api.cancelPlayCardSelection();
 const p=c.getCurrentPlayer();p.initialSelection.industry={id:'industry:寰宇超动力',label:'寰宇超动力'};
 p.hand=[c.cards.createCardInstance(SetiCardCatalog.find(x=>x.card_id==='b_65.webp'))];p.reservedCards=[];
 p.techState.ownedTiles={blue2:true};p.techState.disabledTiles={};p.techState.blueBoardSlots={blue2:1};
 p.dataState={poolTokens:Array.from({length:6},(_,i)=>({id:'embedded-pool-'+i,index:i+10,slotIndex:i+1})),placedTokens:[{id:'embedded-placed',index:1,placementKind:'computer',placementSlot:1}],discardedCount:0};
 Object.assign(p.resources,{credits:10,energy:0,publicity:0,availableData:6,handSize:1,score:0});
 const before=structuredClone(p);
 if(!api.beginPlayCardSelection().ok||!api.playHandCard(0).ok)throw Error('play');
 let placed=false;
 for(let i=0;i<80;i++){
  const q=api.getAiAutoBattleProgress().pendingState;
  if(q.pendingDataPlacement){
   const buttons=[...c.els.dataPlaceActions.querySelectorAll('[data-place-target]')];
   const button=buttons.find(x=>x.dataset.placeTarget==='blueBonus'&&Number(x.dataset.blueSlot||x.dataset.placeBlueSlot)===1)||buttons.find(x=>x.dataset.placeTarget==='blueBonus');
   if(!button)throw Error('blue reward unavailable');button.click();placed=true;
  }else{const step=api.runAiAutoBattleStep();if(step.blocked)throw Error('blocked');}
  if(placed&&p.resources.energy===1)break;if(i===79)throw Error('receipt timeout');
 }
 if(p.resources.energy!==1||p.resources.availableData!==6)throw Error('actual reward mismatch');
 const afterPlacement=structuredClone(p);
 for(let i=0;i<100;i++){const q=api.getAiAutoBattleProgress().pendingState;if(!q.actionEffectFlowActive&&!Object.entries(q).some(([k,v])=>k.startsWith('pending')&&v))break;const step=api.runAiAutoBattleStep();if(step.blocked||i===99)throw Error('finish effect');}
 if(!api.endCurrentTurn().ok)throw Error('commit turn');
 const entries=c.getActionLogEntries({includeRecovery:true,readOnlyInternal:true}).slice(-1);
 const report=c.ai.resourceFlow.analyzeStructuredActionLog(entries,{initialPlayerStates:[before]});
 const bonus=report.events.find(x=>x.isDataPlacement&&x.resourceDeltas.energy===1);
 if(!bonus||bonus.resourceDeltas.availableData!==-1)throw Error('split receipt absent');
 if(!report.events.some(x=>x.resourceDeltas.availableData===1))throw Error('gross data gain absent');
 return {scope:"Actual full-pool b65 gain1data forces a blue2 placement: energy0 to1 and pool6 to6, captured in afterPlacement. Remaining card technology effects then complete and the turn is committed. Raw committed history and isolated before snapshot retained for old/new parser comparison.",player:p.id,before,afterPlacement,after:structuredClone(p),entries,events:report.events};
})()
