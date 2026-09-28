(() => {
 const api=SetiRandomizer,c=window.__setiSmokeContext,ctrl=window.__smokeController,assert=(v,m)=>{if(!v)throw Error(m)},rows=[];
 for(const company of ['寰宇超动力','宇宙大战略集团','作弊实验室'])for(const round of [2,4]){
  SetiGameRandom.useSeed('scan-projection-proof');SetiGameRandom.installMathRandom();
  api.configureAiAutoBattle({reset:true,activePlayerCount:4,suppressAutoSchedule:true});let begin;
  for(let i=0;i<180;i++){begin=api.beginPlayCardSelection();if(begin?.ok)break;api.runAiAutoBattleStep();}assert(begin?.ok,'setup');api.cancelPlayCardSelection();
  const p=c.getCurrentPlayer();p.initialSelection.industry={...p.initialSelection.industry,id:'industry:'+company,label:company};p.techState={ownedTiles:{},disabledTiles:{},blueBoardSlots:{}};
  c.turnState.roundNumber=round;p.dataState=c.data.createDefaultDataState();
  for(let i=0;i<4;i++){assert(c.data.gainData(p).ok,'fixture data');assert(c.data.placeDataToComputer(p).ok,'fixture core');}
  Object.assign(p.resources,{credits:5,energy:3,availableData:0,score:100});
  const before=structuredClone(p),boardBefore=JSON.stringify(c.nebulaDataState),random=Math.random;let randomCalls=0;Math.random=()=>{randomCalls++;return random();};
  const predicted=ctrl.canAiGrandStrategyOpenAnalyzeWithProjectedScanData(p),profile=ctrl.buildAiScanAnalyzeProjection?.(p)||null;
  Math.random=random;assert(randomCalls===0&&JSON.stringify(p)===JSON.stringify(before)&&JSON.stringify(c.nebulaDataState)===boardBefore,'read-only projection');
  if(profile)assert(profile.canOpenAnalyze&&profile.guaranteedData===2,'actual mandatory scans unlock core');
  const cost=c.scanEffects.getStandardScanCost(p);assert(c.beginScanAction().ok,'paid scan');
  let steps=0;for(;steps<150;steps++){const q=api.getAiAutoBattleProgress().pendingState;if(!q.actionEffectFlowActive&&!Object.entries(q).some(([k,v])=>k.startsWith('pending')&&v))break;const r=api.runAiAutoBattleStep();assert(!r.blocked,'scan blocked');}
  const afterScan=structuredClone(p.resources);assert(afterScan.availableData===2,'two actual scan data');
  while(p.resources.availableData>0){assert(c.confirmDataPlacement('computer').ok,'place scan data into core');}
  const after=structuredClone(p.resources),ready=c.data.canAnalyzeData(p);assert(ready.ok,'paid scan leaves a legal analyze action');
  rows.push({company,round,before,predicted,profile,cost,afterScan,after,ready,steps,randomCalls});
 }
 return {rows,limitation:'Controlled actual scan and core placement, then runtime analyze legality. Does not force subsequent analysis or establish whole-game uplift.'};
})()
