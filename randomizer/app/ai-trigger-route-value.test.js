const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require.resolve('./ai-controller'), 'utf8');
function extract(name) { const start=source.indexOf('    function '+name+'('); const end=source.indexOf('\n    function ',start+10); assert(start>=0&&end>start); return source.slice(start,end); }
const context={
  aiNumber:v=>Number(v)||0, rocketState:{}, state:{pendingActionExecuted:true},
  getAiLaunchPaymentCost:o=>o?.skipCost?{}:(o?.cost||{credits:2}),
  players:{canAfford:(p,c)=>Object.entries(c).every(([k,v])=>(p.resources[k]||0)>=v)},
  getEarthSectorCoordinate:()=>({x:0,y:1}),AI_MOVE_DIRECTIONS:[{id:'right',deltaX:1,deltaY:0,score:0}],
  solar:{mod8:x=>(x+8)%8},rocketActions:{SECTOR_RING_MIN:1,SECTOR_RING_MAX:4,findAvailableSlotIndex:()=>0},
  getAiRequiredMovePointsFromCoordinate:()=>1,canPayForMove:(p,n)=>({ok:p.resources.energy>=n}),
  scoreAiMoveTowardTargets:()=>({score:20,target:{kind:'planet',id:'mars'}}),applyAiStrategyWeight:v=>v,
  shouldAiPreserveEnergyForRouteCashout:()=>false,
  estimateAiMovePayment:p=>({remainingEnergy:p.resources.energy-1,energySpent:1,cardSpent:0,cost:5}),
  scoreAiFollowupMainActionAfterMove:(_to,p)=>p.resources.energy>=1?{actionId:'orbit',resources:{...p.resources},score:10}:null,
  scoreAiNearestActionablePlanetTimingPenalty:()=>0,scoreAiMovementPathPenalty:()=>0,
};
vm.createContext(context);vm.runInContext(extract('getAiProjectedResourcesAfterLaunchMove')+extract('scoreAiPostLaunchMovePlan'),context);
const player={resources:{credits:0,energy:4,publicity:0,handSize:0},hand:[]},before=JSON.stringify(player);
assert.equal(context.scoreAiPostLaunchMovePlan(player),null,'ordinary launch remains blocked after main action');
assert.equal(context.scoreAiPostLaunchMovePlan(player,{ignoreMainActionUsed:true}),null,'ordinary launch still requires credit');
const free=context.scoreAiPostLaunchMovePlan(player,{ignoreMainActionUsed:true,launchOptions:{skipCost:true,cost:{}}});
assert(free&&free.score>0,'free trigger launch has a legal paid move route with zero credit');
assert.equal(free.projectedResourcesAfterLaunchMove.credits,0);
assert.equal(free.projectedResourcesAfterLaunchMove.energy,3);
assert.equal(free.projectedFollowupMainAction.actionId,'orbit');
assert.equal(JSON.stringify(player),before,'preview is read-only');
const paid=context.scoreAiPostLaunchMovePlan({...player,resources:{...player.resources,credits:4}},{ignoreMainActionUsed:true,launchOptions:{cost:{credits:1}}});
assert.equal(paid.projectedResourcesAfterLaunchMove.credits,3,'use the actual trigger cost');
assert.equal(context.scoreAiPostLaunchMovePlan({...player,resources:{...player.resources,energy:0}},{ignoreMainActionUsed:true,launchOptions:{skipCost:true}}),null,'no future energy is invented');
console.log('ai-trigger-route-value.test.js: all tests passed');

const rank={aiNumber:v=>Number(v)||0,cardEffects:{EFFECT_TYPES:{CARD_CORNER_EVENT_REWARD:'corner'},areAllTriggersConsumed:()=>false},
 scoreAiEffectValue:()=>6,scoreAiCardTriggerDataReward:()=>0,scoreAiPostLaunchMovePlan:(_p,o)=>{assert.equal(o.ignoreMainActionUsed,true);assert.equal(o.launchOptions.skipCost,true);return {score:11};},scoreAiLaunchPaymentCost:()=>0,
 cardTriggerNeedsFreeMove:m=>m.effect.type==='card_free_move',listCardTriggerFreeMoveCandidates:()=>[{score:-2,available:true},{score:17,available:false},{score:4,available:true}],
};vm.createContext(rank);vm.runInContext(extract('scoreAiCardTriggerChoice'),rank);
assert.equal(rank.scoreAiCardTriggerChoice({effect:{type:'launch',options:{skipCost:true}}},player).rewardValue,11);
assert.equal(rank.scoreAiCardTriggerChoice({effect:{type:'card_free_move'}},player).rewardValue,4,'only available actual move candidates are valued');
rank.listCardTriggerFreeMoveCandidates=()=>[{score:-2,available:true}];
assert.equal(rank.scoreAiCardTriggerChoice({effect:{type:'card_free_move'}},player).rewardValue,0,'a negative move is not a fixed positive reward');

assert.equal(context.scoreAiPostLaunchMovePlan({...player,resources:{...player.resources,energy:1}},{ignoreMainActionUsed:true,launchOptions:{cost:{energy:1}}}),null,'pay launch before checking movement affordability');
const paidEnergy=context.scoreAiPostLaunchMovePlan(player,{ignoreMainActionUsed:true,launchOptions:{cost:{energy:1}}});
assert.equal(paidEnergy.projectedResourcesAfterLaunchMove.energy,2,'launch energy and move energy are each paid once');
