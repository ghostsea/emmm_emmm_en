(() => {
 const api=window.SetiRandomizer,ctl=window.__smokeController;
 api.configureAiAutoBattle({reset:true,activePlayerCount:4,aiDifficulty:'laughable',suppressAutoSchedule:true});
 const expected={engine:1.3,playCard:1.6,tech:1.16,scan:1.18,route:.76,move:.74,orbitLand:1,task:1.24,final:1.34,pass:.78};
 const defaults=ctl.getAiStrategyWeights();
 for(const[k,v]of Object.entries(expected))if(defaults[k]!==v)throw Error('default '+k);
 const manual=ctl.configureAiStrategyWeights({playCard:1.44},{merge:true}).weights;
 if(manual.playCard!==1.44)throw Error('manual override');
 ctl.resetAiStrategyWeights();
 api.configureAiAutoBattle({reset:true,activePlayerCount:4,aiDifficulty:'weak_start',suppressAutoSchedule:true});
 const weak=ctl.getAiStrategyWeights();if(weak.playCard!==1.4)throw Error('weak_start changed');
 api.configureAiAutoBattle({reset:true,activePlayerCount:4,aiDifficulty:'laughable',suppressAutoSchedule:true});
 const restored=ctl.getAiStrategyWeights();for(const[k,v]of Object.entries(expected))if(restored[k]!==v)throw Error('restore '+k);
 return {defaults,manual,weak,restored};
})()
