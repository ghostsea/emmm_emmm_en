'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),effects=require('../game/cards/effects');
const source=fs.readFileSync(require.resolve('./ai-controller'),'utf8'),start=source.indexOf('    function applyAiTriggerSetupOrder('),end=source.indexOf('\n    function ',start+10);assert(start>=0&&end>start);
const engine={id:'engine',cardId:'b_120.webp',price:1},follow={id:'follow',cardId:'b_124.webp',price:1};
const player={id:'player-blue',resources:{credits:2,energy:2,publicity:7},hand:[engine,follow]};
const cardCandidate={id:'playCard',kind:'main',available:true,reservesAfterPlay:true,cardId:engine.cardId,cardInstanceId:'engine',score:4};
const main={id:'playCard',kind:'main',available:true,cardId:follow.cardId,cardInstanceId:'follow',score:30,actionGraph:{net:30},playableCards:[cardCandidate]};
const c={structuredClone,turnState:{},cardEffects:effects,aiNumber:x=>Number(x)||0,
 ai:{policy:{chooseTurnAction:xs=>xs.filter(x=>x.available!==false).sort((a,b)=>(b.actionGraph?.net??b.score)-(a.actionGraph?.net??a.score))[0]}},
 getAiCandidateRankScore:a=>a.actionGraph?.net??a.score,
 createAiPlayerAfterDeterministicCardSetup:(card,p)=>({...p,hand:p.hand.filter(h=>h!==card),resources:{...p.resources,credits:p.resources.credits-card.price}}),
 getCardPlayCost:card=>({credits:card.price}),getCardPrice:card=>card.price,
 buildAiPlayCardCandidate:(card,_index,p)=>p.resources.credits>=card.price?{cardId:card.cardId}:null,
 players:{canAfford:(p,cost)=>Object.entries(cost).every(([k,v])=>(p.resources[k]||0)>=v)},
 scoreAiEffectValue:e=>e.type==='gain_resources'?Object.values(e.options.gain).reduce((a,b)=>a+b,0):3,
 getAiResearchTechPublicityCostForPlayer:()=>7,industry:{getStandardLaunchCost:()=>({credits:1})},scanEffects:{getStandardScanCost:()=>({credits:1,energy:2})},
};vm.createContext(c);vm.runInContext(source.slice(start,end),c);
const apply=(xs,p)=>c.applyAiTriggerSetupOrder(xs,p,c.ai.policy.chooseTurnAction(xs));
const before=JSON.stringify(player),result=apply([main],player)[0];
assert.equal(result.cardInstanceId,'engine');assert.equal(result.triggerSetupOrder.followupCardInstanceId,'follow');assert.equal(result.triggerSetupOrder.resourcesAfterBothPayments.credits,0);assert.equal(result.triggerSetupOrder.rewardValue,2);assert.equal(result.actionGraph.net,32);assert.equal(JSON.stringify(player),before,'read only including consumed slots');
assert.equal(apply([main],{...player,resources:{...player.resources,credits:1}})[0],main,'no future income borrowed');
const consumed={...engine,cardEffectState:{modelCardId:engine.cardId,consumedTriggerIds:['b120-price1-score']}};assert.equal(apply([main],{...player,hand:[consumed,follow]})[0],main,'consumed slot not valued');
const quick={id:'move',kind:'quick',score:50};assert.equal(apply([main,quick],player)[0],main,'do not preempt a selected quick action');
assert.equal(apply([{...main,playableCards:[{...cardCandidate,score:-1}]}],player)[0].cardInstanceId,'follow','do not add an unprofitable setup');
const researchEngine={id:'engine',cardId:'b_80.webp',price:1},research={id:'researchTech',kind:'main',available:true,score:40,takeable:[{techType:'orange',available:true},{techType:'blue',available:true}]};
const play={...main,cardInstanceId:'engine',score:2,actionGraph:{net:2},playableCards:[{...cardCandidate,cardId:'b_80.webp'}]};
const researchResult=apply([play,research],{...player,hand:[researchEngine]})[0];assert.equal(researchResult.triggerSetupOrder.rewardValue,1,'minimum across possible tech colors');assert.equal(researchResult.triggerSetupOrder.resourcesAfterBothPayments.publicity,0);
assert.equal(apply([play,research],{...player,hand:[researchEngine],resources:{...player.resources,publicity:6}})[0],play,'insufficient research budget');
console.log('ai-trigger-setup-order.test.js: all tests passed');


// Existing cards compete for the same event; no new reward is guaranteed.
const incumbent={id:'incumbent',cardId:'b_120.webp',price:1};
const competition={...player,reservedCards:[incumbent]},snapshot=JSON.stringify(competition);
assert.equal(apply([main],competition)[0],main,'existing first matching slot owns the event');
assert.equal(JSON.stringify(competition),snapshot,'preview does not initialize or consume actual incumbent state');
const exhausted={...incumbent,cardEffectState:{modelCardId:'b_120.webp',consumedTriggerIds:['b120-price1-score']}};
assert.equal(apply([main],{...player,reservedCards:[exhausted]})[0].cardInstanceId,'engine','consumed unrelated slots do not block setup');
const otherEvent={id:'research-old',cardId:'b_80.webp'};
assert.equal(apply([main],{...player,reservedCards:[otherEvent]})[0].cardInstanceId,'engine','unrelated event is not competition');
