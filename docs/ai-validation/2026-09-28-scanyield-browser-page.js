(() => {
 const api=SetiRandomizer,c=window.__setiSmokeContext,controller=window.__smokeController,assert=(v,m)=>{if(!v)throw Error(m)},rows=[];
 for(const company of ['寰宇超动力','宇宙大战略集团','作弊实验室']) for(const round of [1,4]) {
  SetiGameRandom.useSeed('codex-scan-yield-current-proof');SetiGameRandom.installMathRandom();
  api.configureAiAutoBattle({reset:true,seed:'codex-scan-yield-current-proof',activePlayerCount:4,suppressAutoSchedule:true});
  let begin;for(let i=0;i<180;i++){begin=api.beginPlayCardSelection();if(begin?.ok)break;api.runAiAutoBattleStep();}assert(begin?.ok,'setup');api.cancelPlayCardSelection();
  const p=c.getCurrentPlayer();p.initialSelection.industry={...p.initialSelection.industry,id:'industry:'+company,label:company};
  c.turnState.roundNumber=round;Object.assign(p.resources,{credits:12,energy:12,availableData:0,score:100});p.dataState=c.data.createDefaultDataState();
  const record=()=>controller.recordAiAutoBattleLog('turn-action','synthetic prior scan count',{action:{id:'scan'}});
  record();const before=structuredClone(p),second=controller.scoreAiScanAction(p);record();record();const fourth=controller.scoreAiScanAction(p);
  assert(JSON.stringify(before)===JSON.stringify(p),'read-only score');assert(Number.isFinite(second)&&Number.isFinite(fourth),'finite');
  const expected=c.scanEffects.getStandardScanCost(p),started=c.beginScanAction();assert(started.ok,'scan legal');
  let steps=0;for(;steps<150;steps++){const q=api.getAiAutoBattleProgress().pendingState;if(!q.actionEffectFlowActive&&!Object.entries(q).some(([k,v])=>k.startsWith('pending')&&v))break;const r=api.runAiAutoBattleStep();assert(!r.blocked,'scan blocked');}
  const report=api.getAiAutoBattleReport({includeAnalysis:false,includeDiagnostics:false});assert(steps<150&&!report.bugs.length,'finished');const after=structuredClone(p.resources);api.endCurrentTurn();
  rows.push({company,round,second,fourth,before,expected,after,steps,bugs:report.bugs,scanTargets:report.logs.filter(l=>l.type==='scan-target').map(l=>l.details),action:api.getActionLog({includeRecovery:false}).at(-1)});
 }
 return {rows,limitation:'Synthetic prior scan histories isolate count penalty at identical current positions. Real scan executed once per fixture; not autonomous whole-game evidence.'};
})()
