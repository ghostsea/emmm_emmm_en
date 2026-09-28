(() => {
 const api=window.SetiRandomizer,c=window.__setiSmokeContext,ai=window.__smokeController;
 api.configureAiAutoBattle({reset:true,activePlayerCount:4,suppressAutoSchedule:true});
 let begin;for(let i=0;i<180;i++){begin=api.beginPlayCardSelection();if(begin?.ok)break;api.runAiAutoBattleStep();}if(!begin?.ok)throw Error('setup');api.cancelPlayCardSelection();
 const p=c.getCurrentPlayer();
 p.initialSelection.industry={id:'industry:寰宇超动力',label:'寰宇超动力'};
 c.turnState.roundNumber=1;
 Object.assign(p.resources,{credits:4,energy:2,publicity:12,availableData:2});
 p.income={...p.income,energy:1};
 p.techState.ownedTiles={};p.techState.disabledTiles={};p.techState.blueBoardSlots={};
 p.dataState={poolTokens:[1,2].map(i=>({id:'lifecycle-'+i,index:i,slotIndex:i})),placedTokens:[],discardedCount:0};
 const originalIndustry=p.initialSelection.industry;
 for(const company of ['作弊实验室','宇宙大战略集团']) {
  p.initialSelection.industry={id:'industry:'+company,label:company};
  if(ai.getAiBlueLifecycleProfile({tileId:'blue1',techType:'blue'},p)!==null)throw Error('other company changed');
 }
 p.initialSelection.industry=originalIndustry;
 const state=()=>JSON.stringify(api.createRecoverySnapshot());
 const before=state();let randomCalls=0;const random=Math.random;
 Math.random=()=>{randomCalls++;return random();};
 let candidates,again;
 try{candidates=['blue1','blue2'].map(id=>ai.buildAiResearchTechCandidate(id));again=['blue1','blue2'].map(id=>ai.buildAiResearchTechCandidate(id));}finally{Math.random=random;}
 if(state()!==before||randomCalls||JSON.stringify(candidates)!==JSON.stringify(again))throw Error('valuation mutates state/RNG');
 if(!candidates.every(x=>x.valueBreakdown.blueLifecycle?.futureRounds.length===3))throw Error('profile missing');
 if(JSON.stringify(candidates[0].valueBreakdown.blueLifecycle.futureRounds.map(x=>x.resourceValue))!=='[6,4.5,4.5]')throw Error('wrong future phases');
 const opening=api.researchTech();if(!opening.ok)throw Error('research failed '+JSON.stringify(opening));
 const policy=c.ai.policy,old=policy.chooseResearchTechTile;let choice;
 policy.chooseResearchTechTile=(cs,opts)=>{choice=old(cs.filter(x=>['blue1','blue2'].includes(x.tileId)),opts);return choice;};
 try{for(let i=0;i<50;i++){const step=api.runAiAutoBattleStep();if(step?.blocked)throw Error('blocked research');if(p.techState.ownedTiles.blue1||p.techState.ownedTiles.blue2)break;}}finally{policy.chooseResearchTechTile=old;}
 if(!choice||!p.techState.ownedTiles[choice.tileId])throw Error('choice not executed');
 const drain=()=>{for(let i=0;i<100;i++){const q=api.getAiAutoBattleProgress().pendingState;if(!q.actionEffectFlowActive&&!Object.entries(q).some(([k,v])=>k.startsWith('pending')&&v))return;const step=api.runAiAutoBattleStep();if(step?.blocked)throw Error('blocked effects');}throw Error('pending effects');};
 drain();
 const afterResearch=structuredClone(p.resources);
 const slot=p.techState.blueBoardSlots[choice.tileId],required={1:1,2:3,3:5,4:6}[slot];
 p.dataState={poolTokens:[{id:'lifecycle-bonus',index:9,slotIndex:1}],placedTokens:Array.from({length:required},(_,i)=>({id:'lifecycle-placed-'+i,index:i+10,placementKind:'computer',placementSlot:i+1})),discardedCount:0};
 p.resources.availableData=1;
 const beforeBonus=structuredClone(p.resources),oldTurn=policy.chooseTurnAction;
 policy.chooseTurnAction=cs=>cs.filter(x=>x.id==='placeData'&&x.target==='blueBonus').sort((a,b)=>b.score-a.score)[0];
 try{const step=api.runAiAutoBattleStep();if(!step.ok)throw Error('bonus placement '+JSON.stringify(step));}finally{policy.chooseTurnAction=oldTurn;}
 drain();
 const key=choice.tileId==='blue1'?'credits':'energy';
 if(p.resources[key]!==beforeBonus[key]+1||p.resources.availableData!==0)throw Error('actual reward/cost mismatch');
 const report=api.getAiAutoBattleReport({includeAnalysis:false,includeDiagnostics:false});
 if(report.bugs.length)throw Error('runtime bugs');
 return {scope:'Read-only repeated real-browser valuation; natural blue1/blue2 comparison inside restricted tech choice; actual purchase and bonus payment. Forced action/fixture validates execution only, not full-game uplift.',randomCalls,candidates,choice,opening,afterResearch,beforeBonus,afterBonus:structuredClone(p.resources),tail:report.logs.slice(-10),bugs:report.bugs};
})()
