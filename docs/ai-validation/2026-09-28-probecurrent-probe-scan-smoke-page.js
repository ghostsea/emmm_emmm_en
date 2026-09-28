(() => {
 const api=window.SetiRandomizer,c=window.__setiSmokeContext,results=[];
 for(const [cardId,expectedData,targets] of [['b_22.webp',2,1],['b_50.webp',3,3],['b_96.webp',0,1]]) {
  api.configureAiAutoBattle({reset:true,activePlayerCount:4,suppressAutoSchedule:true});
  let begin;for(let i=0;i<180;i++){begin=api.beginPlayCardSelection();if(begin?.ok)break;api.runAiAutoBattleStep();}
  if(!begin?.ok)throw Error('setup');api.cancelPlayCardSelection();
  const p=api.playerState.players.find(p=>p.id===api.playerState.currentPlayerId);
  const sectors=[];for(let x=0;x<8;x++){const choices=c.buildSectorScanChoicesForX(x).filter(q=>q.nebulaId&&!q.disabled);if(choices.length===1&&c.data.listNebulaTokens(c.nebulaDataState,choices[0].nebulaId).filter(t=>!t.replacedByPlayerId).length>=4)sectors.push(x);}
  if(sectors.length<targets)throw Error('not enough open sectors');
  c.rocketState.rockets=[];
  for(let i=0;i<targets;i++){const owner=i===1?api.playerState.players.find(q=>q.id!==p.id):p;const r=c.rocketActions.launchRocketAtSector(c.rocketState,{x:sectors[i],y:3},{playerId:owner.id,color:owner.color});if(!r.ok)throw Error('launch '+JSON.stringify(r));}
  p.hand=[SetiCards.createCardInstance(SetiCardCatalog.find(q=>q.card_id===cardId))];
  p.resources.credits=20;p.resources.energy=10;p.resources.availableData=0;p.resources.handSize=1;p.dataState.poolTokens=[];
  const before={...p.resources};begin=api.beginPlayCardSelection();const played=api.playHandCard(0);if(!begin.ok||!played.ok)throw Error('play '+JSON.stringify(played));
  let steps=0;for(;steps<90;steps++){const q=api.getAiAutoBattleProgress().pendingState;if(!q.actionEffectFlowActive&&!Object.entries(q).some(([k,v])=>k.startsWith('pending')&&v))break;const r=api.runAiAutoBattleStep();if(r?.blocked)throw Error('blocked '+JSON.stringify(r));}
  const report=api.getAiAutoBattleReport({includeAnalysis:false,includeDiagnostics:false});
  if(steps>=90||report.bugs.length)throw Error('unfinished '+JSON.stringify(report.bugs));
  if(p.resources.availableData-before.availableData!==expectedData)throw Error('wrong data '+cardId+' '+JSON.stringify(p.resources));
  results.push({cardId,expectedData,actualData:p.resources.availableData-before.availableData,steps,bugs:report.bugs,probeChoices:report.logs.filter(l=>l.type==='probe-sector-scan').map(l=>l.details)});
 }
 return results;
})()
