'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require.resolve('./ai-controller'),'utf8');
function extract(name){const start=source.indexOf('    function '+name+'('),end=source.indexOf('\n    function ',start+10);assert(start>=0&&end>start);return source.slice(start,end);}
const card={cardEffectState:{completedTaskIds:[]},model:{tasks:[{id:'mars',condition:{type:'planetOrbitOrLand',planetId:'mars'},rewards:[]}]}};
const player={reservedCards:[card],hand:[],visits:1};let demands=0;
const c={cardEffects:{getCardModel:card=>card.model},endGameScoring:{},aiNumber:n=>Number(n)||0,roundAiScore:n=>n,
 getAiTaskConditionCurrentCount:(condition,p)=>condition.type==='planetOrbitOrLand'?p.visits:null,
 scoreAiTaskRouteCompletionValue:()=>23,getAiTaskDirectScoreReward:()=>4,
 resolveAiCardEndGameRule:()=>null,addAiTaskConditionDemand:()=>demands++,
 createAiPlayerAfterDeterministicCardSetup:(_card,p)=>p,getAiTaskRewardValue:()=>4,
 scoreAiCFinalTaskProgressValue:()=>0,getAiRoundNumber:()=>2,FINAL_ROUND_NUMBER:5,
 scoreAiThresholdPressureForScoreGain:()=>0,
};vm.createContext(c);
for(const name of ['summarizeAiTaskCondition','listAiUncompletedCardTasksForPlayer','getAiPendingTaskRouteCashout','addAiCardModelDemand','getAiReadyHandTaskCashout'])vm.runInContext(extract(name),c);
const before=JSON.stringify(player);
assert.equal(c.listAiUncompletedCardTasksForPlayer(player).length,1,'ready task remains uncompleted until collected');
assert.equal(c.getAiPendingTaskRouteCashout(player,()=>true).value,0,'ready Mars reward is not earned by another trip');
c.addAiCardModelDemand({},card,card.model,1,player,{});assert.equal(demands,0,'ready reserved task adds no enabling demand');
assert.equal(c.getAiReadyHandTaskCashout(card,card.model,player).directScore,4,'actual ready reward is preserved');
assert.equal(JSON.stringify(player),before,'valuation does not consume task or mutate player');
player.visits=0;
assert.equal(c.getAiPendingTaskRouteCashout(player,()=>true).value,23,'unmet route still carries reward');
assert.equal(c.getAiPendingTaskRouteCashout(player,()=>false).value,0,'unrelated route receives no reward');
c.addAiCardModelDemand({},card,card.model,1,player,{});assert.equal(demands,1);
card.model.tasks[0].condition={type:'futureUnknownCondition'};
assert.equal(c.getAiPendingTaskRouteCashout(player,()=>true).value,23,'unknown is not assumed ready');
c.addAiCardModelDemand({},card,card.model,1,player,{});assert.equal(demands,2);
card.model.tasks[0].condition={type:'planetOrbitOrLand',planetId:'mars'};player.visits=1;player.reservedCards=[];player.hand=[card];
c.addAiCardModelDemand({},card,card.model,.35,player,{});assert.equal(demands,3,'hand demand stays unchanged because playing can change conditions');
card.cardEffectState.completedTaskIds=['mars'];player.reservedCards=[card];
assert.equal(c.getAiPendingTaskRouteCashout(player,()=>true).count,0);
assert.equal(c.getAiReadyHandTaskCashout(card,card.model,player).count,0,'completed reward cannot be claimed again');
console.log('ai-ready-task-marginal.test.js: all tests passed');
