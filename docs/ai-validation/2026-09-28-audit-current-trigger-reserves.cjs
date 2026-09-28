const fs=require('node:fs'),crypto=require('node:crypto'),assert=require('node:assert/strict');
require('../../randomizer/game/card-catalog.js');
const effects=require('../../randomizer/game/cards/effects.js');
const dir='tmp/ai-20260905/',out='docs/ai-validation/2026-09-28-current-trigger-reserves';
const sha=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const rows=[],inputs=[],unmapped=new Set();
for(let n=1;n<=24;n++){
 const file=dir+`tradeledger28v2-candidate-${n}.json`,run=JSON.parse(fs.readFileSync(file)),r=run.result;
 assert(run.summary.ok&&run.summary.gameEnded&&!run.summary.blocked&&run.summary.bugCount===0);
 inputs.push({file,sha256:sha(file)});
 const exposures=new Map();
 for(const l of r.logs){
  if(l.type!=='turn-action')continue;
  for(const c of l.details.candidates?.find(x=>x.id==='playCard')?.playableCards||[]){
   if(!c.available)continue;
   const model=effects.getCardModel({cardId:c.cardId});
   if(!model){unmapped.add(c.cardId);continue;}
   if(!model.triggers?.length)continue;
   const key=l.playerId+':'+c.cardInstanceId;
   if(!exposures.has(key))exposures.set(key,{player:l.playerId,instance:c.cardInstanceId,cardId:c.cardId,label:c.cardLabel,model,observations:[]});
   exposures.get(key).observations.push({log:l.id,round:l.roundNumber,turn:l.turnNumber,resources:l.playerResources,score:c.score,cost:c.cost,cornerOpportunity:c.valueBreakdown?.cornerOpportunity,selectedMain:l.details.action.id});
  }
 }
 const plays=r.logs.filter(l=>l.type==='play-card');
 const labelOwners=new Map();
 for(const l of plays){
  const c=l.details.selected,model=effects.getCardModel({cardId:c.cardId});
  for(const t of model?.triggers||[]){
   const key=l.playerId+':'+t.effect?.label;if(!t.effect?.label)continue;
   if(!labelOwners.has(key))labelOwners.set(key,new Set());
   labelOwners.get(key).add(c.cardInstanceId);
  }
 }
 for(const e of exposures.values()){
  const selected=plays.filter(l=>l.playerId===e.player&&l.details.selected?.cardInstanceId===e.instance);
  assert(selected.length<=1,'duplicate played instance');
  const play=selected[0],allSameLabel=plays.filter(l=>l.playerId===e.player&&l.details.selected?.cardLabel===e.label);
  const uniqueLabel=allSameLabel.length===1;
  const triggers=play&&uniqueLabel?r.logs.filter(l=>l.type==='card-trigger'&&l.playerId===e.player&&l.id>play.id&&l.details.cardLabel===e.label):[];
  const payment=play?r.resourceFlow.events.find(x=>x.playerId===e.player&&(x.cards||[]).some(c=>c.key===e.instance&&c.change==='play')):null;
  if(play)assert(payment,'play needs actual receipt');
  const distinctLabels=[...new Set(e.model.triggers.map(t=>t.effect?.label).filter(Boolean))];
  const uniquelyOwnedLabels=distinctLabels.filter(label=>labelOwners.get(e.player+':'+label)?.size===1);
  const receipts=play?r.resourceFlow.events.filter(x=>x.playerId===e.player&&x.entryId>=payment.entryId&&uniquelyOwnedLabels.some(label=>x.sourceDetail.startsWith(label+'：')||x.sourceDetail.startsWith('卡牌触发：'+label))):[];
  const next=play?r.logs.find(l=>l.id>play.id&&l.playerId===e.player&&l.type==='turn-action'&&['main','pass'].includes(l.details.action.kind)):null;
  rows.push({case:n,company:r.playerResults.find(p=>p.playerId===e.player).companyLabel,player:e.player,instance:e.instance,cardId:e.cardId,label:e.label,
   slots:e.model.triggers.map(t=>({id:t.id,event:t.event,effect:t.effect})),
   pureTrigger:!e.model.playEffects?.length&&!e.model.tasks?.length&&!e.model.endGameScoring,
   fixedReserveTerm:4+(e.model.tasks?.length||0)*3.6+e.model.triggers.length*2,
   observations:e.observations,played:Boolean(play),play:play?{log:play.id,round:play.roundNumber,turn:play.turnNumber,resources:play.playerResources,score:play.details.selected.score,paymentEntry:payment.entryId,cost:play.details.selected.cost}:null,
   labelUniqueAmongPlayed:uniqueLabel,triggerChoiceCount:play&&uniqueLabel?triggers.length:null,
   triggerChoices:triggers.map(l=>({log:l.id,round:l.roundNumber,turn:l.turnNumber,message:l.message,effectType:l.details.effectType})),
   uniquelyOwnedLabels,receiptEvidence:receipts.map(x=>({entry:x.entryId,step:x.stepIndex,detail:x.sourceDetail,resourceDeltas:x.resourceDeltas})),
   nextMain:next?{round:next.roundNumber,id:next.details.action.id}:null,
   retainedAtEnd:r.playerResults.find(p=>p.playerId===e.player).reservedCards.some(c=>c.id===e.instance)});
 }
}
const summarize=rs=>({exposedInstances:rs.length,played:rs.filter(r=>r.played).length,unplayed:rs.filter(r=>!r.played).length,
 playedByRound:Object.fromEntries([1,2,3,4].map(round=>[round,rs.filter(r=>r.play?.round===round).length])),
 uniqueLabelPlayed:rs.filter(r=>r.played&&r.labelUniqueAmongPlayed).length,
 playedWithTriggerChoice:rs.filter(r=>r.triggerChoiceCount>0).length,
 playedWithoutTriggerChoice:rs.filter(r=>r.triggerChoiceCount===0).length,
 triggerChoices:rs.reduce((n,r)=>n+(r.triggerChoiceCount||0),0),
 playedWithReceiptEvidence:rs.filter(r=>r.played&&r.receiptEvidence.length).length,
 playedWithoutChoiceOrReceiptEvidence:rs.filter(r=>r.triggerChoiceCount===0&&!r.receiptEvidence.length).length,
 finalRoundPlayed:rs.filter(r=>r.play?.round===4).length,
 finalRoundNoTriggerChoice:rs.filter(r=>r.play?.round===4&&r.triggerChoiceCount===0).length});
const result={scope:'Complete24 accepted current011/parser28 fixed games, unique available hand-card instances with modeled trigger slots. No fresh validation outcomes read. Payment confirms card play. Single matching triggers execute automatically without card-trigger chooser logs. Unique card label joins connect later chooser observations. Separately list same-player subsequent receipts whose exact effect-label prefix belongs to only one played trigger-card instance. Receipt counts are not consumed-slot counts; a flow can have multiple receipts and labels can overlap unrelated effects. No chooser/receipt is absence of telemetry, not proof of no rewards. Unplayed opportunities are not guaranteed counterfactual gains. Alien models absent from this offline loader are listed and excluded. Fixed reserve term is one component only, not total card score.',
 controllerSha256:sha('randomizer/app/ai-controller.js'),inputs,unmappedCardIds:[...unmapped].sort(),summary:summarize(rows),companies:Object.fromEntries([...new Set(rows.map(r=>r.company))].map(c=>[c,summarize(rows.filter(r=>r.company===c))])),
 cards:Object.fromEntries([...new Set(rows.map(r=>r.cardId))].map(c=>[c,{label:rows.find(r=>r.cardId===c).label,...summarize(rows.filter(r=>r.cardId===c))}])),rows};
fs.writeFileSync(out+'.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({summary:result.summary,companies:result.companies,unmappedCardIds:result.unmappedCardIds},null,2));
