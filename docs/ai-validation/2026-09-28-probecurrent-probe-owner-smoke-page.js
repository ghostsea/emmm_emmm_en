(() => {
 const api=window.SetiRandomizer,results=[];
 for(const [cardId,minimumData] of [['b_50.webp',3]]) {
 api.configureAiAutoBattle({reset:true,activePlayerCount:4,suppressAutoSchedule:true});
 let begin;for(let i=0;i<180;i++){begin=api.beginPlayCardSelection();if(begin?.ok)break;api.runAiAutoBattleStep();}
 if(!begin?.ok)throw Error('setup '+JSON.stringify(begin));api.cancelPlayCardSelection();
 const snap=api.createRecoverySnapshot(),pid=snap.state.playerState.currentPlayerId;
 const owner=snap.state.playerState.players.find(p=>p.id===pid);
 snap.state.rocketState.rockets=[];
 const other=snap.state.playerState.players.find(p=>p.id!==pid);
 for(const x of [0,2,4])SetiRocketActions.launchRocketAtSector(snap.state.rocketState,{x,y:2},{playerId:x===4?other.id:pid,color:x===4?other.color:owner.color});
 api.restoreRecoverySnapshot(snap);
 const p=api.playerState.players.find(p=>p.id===pid);
 p.hand=[SetiCards.createCardInstance(SetiCardCatalog.find(c=>c.card_id===cardId))];
 p.resources.credits=10;p.resources.energy=10;p.resources.handSize=1;p.resources.availableData=0;p.dataState.poolTokens=[];
 const before=structuredClone(p.resources);begin=api.beginPlayCardSelection();const play=api.playHandCard(0);
 if(!begin?.ok||!play?.ok)throw Error('play '+JSON.stringify({begin,play}));
 for(let i=0;i<120;i++){const q=api.getAiAutoBattleProgress().pendingState;if(!q.actionEffectFlowActive&&!Object.entries(q).some(([k,v])=>k.startsWith('pending')&&v))break;const step=api.runAiAutoBattleStep();if(step?.ok===false)throw Error('step '+JSON.stringify(step));}
 const report=api.getAiAutoBattleReport({includeAnalysis:false,includeDiagnostics:false});
 if(report.pendingState.actionEffectFlowActive)throw Error('Unfinished effect flow');
 if(p.resources.availableData<minimumData)throw Error('Too little data '+JSON.stringify({cardId,before,after:p.resources}));
 if(report.bugs.length)throw Error('Runtime bug');
 results.push({cardId,before,after:structuredClone(p.resources),probeChoices:report.logs.filter(l=>l.type==='probe-sector-scan'),bugs:report.bugs});
 }
 return results;
})()
