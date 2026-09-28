(async()=>{
 const api=SetiRandomizer,c=window.__setiSmokeContext,ctrl=window.__smokeController,old=c.ai.policy.chooseTurnAction,rows=[];
 c.ai.policy.chooseTurnAction=(choices,...args)=>{
  const selected=old(choices,...args),p=c.getCurrentPlayer(),scan=choices.find(x=>x.id==='scan');
  if(scan?.available&&c.data.listComputerPlacedTokens(p).length===4){
   const cost=c.scanEffects.getStandardScanCost(p),projected=ctrl.canAiGrandStrategyOpenAnalyzeWithProjectedScanData(p);
   rows.push({player:p.id,company:p.initialSelection.industry.label,round:c.turnState.roundNumber,turn:c.turnState.turnNumber,resources:structuredClone(p.resources),placed:structuredClone(c.data.listComputerPlacedTokens(p)),cost,canPayAnalysisAfterScan:p.resources.energy-(cost.energy||0)>=(c.industry?.canAnalyzeWithoutEnergy?.(p)?0:1),oldProjectedUnlock:projected,selected:selected.id,scan:structuredClone(scan),effects:c.scanEffects.buildScanEffectQueue(p,{fullScanAction:true,turnState:c.turnState,roundNumber:c.turnState.roundNumber,turnNumber:c.turnState.turnNumber})});
  }
  return selected;
 };
 const result=await api.startAiAutoBattle({reset:true,seed:__SEED__,activePlayerCount:4,maxSteps:2500,stepDelayMs:0,maxBugRepeats:1,yieldEverySteps:20,stopOnBlocked:true,retainAnalysis:false,includeSampleDiagnostics:false,includeLogs:true});
 return {rows,result};
})()
