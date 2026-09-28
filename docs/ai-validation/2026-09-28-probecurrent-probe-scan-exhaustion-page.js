(() => {
 const api=window.SetiRandomizer,c=window.__setiSmokeContext,results=[];
 for(const [cardId,expectedData,targets] of [['b_22.webp',1,1],['b_50.webp',1,3],['b_96.webp',0,1]]) {
  api.configureAiAutoBattle({reset:true,activePlayerCount:4,suppressAutoSchedule:true});
  let begin;for(let i=0;i<180;i++){begin=api.beginPlayCardSelection();if(begin?.ok)break;api.runAiAutoBattleStep();}
  if(!begin?.ok)throw Error('setup');api.cancelPlayCardSelection();
  const p=api.playerState.players.find(p=>p.id===api.playerState.currentPlayerId);
  const sectors=[];for(let x=0;x<8;x++){const choices=c.buildSectorScanChoicesForX(x).filter(q=>q.nebulaId&&!q.disabled);if(choices.length===1&&c.data.listNebulaTokens(c.nebulaDataState,choices[0].nebulaId).filter(t=>!t.replacedByPlayerId).length>=4)sectors.push(x);}
  if(sectors.length<targets)throw Error('not enough open sectors');
  c.rocketState.rockets=[];
  for(let i=0;i<targets;i++){const owner=i===1?api.playerState.players.find(q=>q.id!==p.id):p;const r=c.rocketActions.launchRocketAtSector(c.rocketState,{x:sectors[0],y:3},{playerId:owner.id,color:owner.color});if(!r.ok)throw Error('launch '+JSON.stringify(r));}
  const depleted=c.buildSectorScanChoicesForX(sectors[0]).find(q=>q.nebulaId&&!q.disabled).nebulaId;
  while(c.data.listNebulaTokens(c.nebulaDataState,depleted).filter(t=>!t.replacedByPlayerId).length>1)c.data.replaceNextNebulaDataToken(c.nebulaDataState,depleted,api.playerState.players.find(q=>q.id!==p.id));
  p.hand=[SetiCards.createCardInstance(SetiCardCatalog.find(q=>q.card_id===cardId))];
  p.resources.credits=20;p.resources.energy=10;p.resources.availableData=0;p.resources.handSize=1;p.dataState.poolTokens=[];
  const controller=SetiAppAiController.createAiController(c);
  const candidate=controller.buildAiPlayCardCandidate(p.hand[0],0,p);
  if(!candidate)throw Error("AI excluded "+cardId);
  if(cardId==="b_64.webp"&&candidate.valueBreakdown.probeMoveScanPreview?.scan.scans.length!==2)throw Error("incomplete move preview");
  const before={...p.resources};begin=api.beginPlayCardSelection();const played=api.playHandCard(0);if(!begin.ok||!played.ok)throw Error('play '+JSON.stringify(played));
  let steps=0;for(;steps<90;steps++){const q=api.getAiAutoBattleProgress().pendingState;if(!q.actionEffectFlowActive&&!Object.entries(q).some(([k,v])=>k.startsWith('pending')&&v))break;const r=api.runAiAutoBattleStep();if(r?.blocked)throw Error('blocked '+JSON.stringify(r));}
  const report=api.getAiAutoBattleReport({includeAnalysis:false,includeDiagnostics:false});
  if(steps>=90||report.bugs.length)throw Error('unfinished '+JSON.stringify(report.bugs));
  api.endCurrentTurn();
  const entry=api.getActionLog({includeRecovery:false}).at(-1);
  const scans=(entry?.steps||[]).filter(s=>/槽位\d+.*替换|已无未替换数据.*追加/.test(s.text||''));
  const scanData=scans.reduce((sum,s)=>sum+(SetiAIResourceFlow.parseDeltaText(s.text).resourceDeltas.availableData||0),0);
  if(scanData!==expectedData)throw Error('wrong scan data '+cardId+' '+JSON.stringify({scanData,scans}));
  results.push({candidate,cardId,expectedData,actualData:scanData,totalResourceDataDelta:p.resources.availableData-before.availableData,scans:scans.map(s=>s.text),moves:report.logs.filter(l=>l.type==='move-path').map(l=>l.details.selected),steps,bugs:report.bugs,probeChoices:report.logs.filter(l=>l.type==='probe-sector-scan').map(l=>l.details)});
 }
 return results;
})()
