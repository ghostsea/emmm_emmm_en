const fs=require('fs'),assert=require('node:assert/strict'),crypto=require('crypto'),d='tmp/ai-20260905/';
function portfolio(row,{positive=false,exclusive=false}={}){
 const budget={...row.resources};for(const[k,v]of Object.entries(row.setupCost))budget[k]=(budget[k]||0)-v;
 if(Object.values(budget).some(v=>v<0))return{setupAffordable:false,slots:0,cards:[],cost:{}};
 const eligible=row.cards.filter(c=>c.instance!==row.setupInstance&&[1,2,3].includes(c.eventPrice??c.cost.credits??0)&&(!positive||(c.candidate?.available&&c.candidate.score>0))&&(!exclusive||!c.existingMatches.length));
 let best={setupAffordable:true,slots:0,cards:[],cost:{}};
 function visit(price,cards,cost){if(price===4){if(cards.length>best.slots)best={setupAffordable:true,slots:cards.length,cards:cards.map(c=>({instance:c.instance,cardId:c.cardId,eventPrice:c.eventPrice??c.cost.credits??0,cost:c.cost,score:c.candidate?.score??null,existingMatches:c.existingMatches})),cost};return;}
  visit(price+1,cards,cost);
  for(const c of eligible.filter(c=>(c.eventPrice??c.cost.credits??0)===price)){const next={...cost};for(const[k,v]of Object.entries(c.cost))next[k]=(next[k]||0)+v;if(Object.entries(next).every(([k,v])=>v<=(budget[k]||0)))visit(price+1,[...cards,c],next);}
 }visit(1,[],{});return{...best,budget};
}
// A printed energy price does not create a credit-price trigger; shared
// budget must fund both cards, not each card independently.
const fixture={resources:{credits:4,energy:4},setupCost:{credits:1},setupInstance:'s',cards:[{instance:'a',cardId:'a',eventPrice:2,cost:{credits:2},existingMatches:[],candidate:{available:true,score:1}},{instance:'b',cardId:'b',eventPrice:3,cost:{credits:3},existingMatches:[],candidate:{available:true,score:1}},{instance:'energy',cardId:'energy',price:1,eventPrice:0,cost:{energy:1},existingMatches:[],candidate:{available:true,score:1}}]};
assert.equal(portfolio(fixture).slots,1);assert(!portfolio(fixture).cards.some(c=>c.instance==='energy'));
const blocked=structuredClone(fixture);blocked.cards.forEach(c=>c.existingMatches=[{triggerId:'old'}]);assert.equal(portfolio(blocked,{exclusive:true}).slots,0);
const proofs=[2,6,15,16].map(n=>JSON.parse(fs.readFileSync(d+`trigger-budget-diagnosis-${n}-proof.json`))),rows=[];
for(const proof of proofs){assert(proof.fullSemanticReplay);for(const [index,row]of proof.rows.entries()){
 // Case2 predates adding eventPrice; it is valid only when printed and
 // actual credit prices are identical for every captured card.
 for(const card of row.cards)if(card.eventPrice==null)assert.equal(card.price,card.cost.credits||0);
 rows.push({case:proof.case,observation:index,player:row.player,company:row.company,round:row.round,rawTurn:row.rawTurn,selected:row.selected,resources:row.resources,setupInstance:row.setupInstance,setupCandidate:row.cards.find(c=>c.instance===row.setupInstance)?.candidate,nominalReserveValue:10,knownHandBudget:portfolio(row),positiveCandidateBudget:portfolio(row,{positive:true}),exclusivePositiveBudget:portfolio(row,{positive:true,exclusive:true})});
}}
const first=rows.filter((r,i)=>rows.findIndex(x=>x.case===r.case&&x.player===r.player&&x.setupInstance===r.setupInstance)===i);
const report={scope:'Four preregistered seen cases:2 Huanyu early high credits,6 actually played,15 Grand Strategy prior counterfactual,16 Huanyu smaller budget. Read-only same-policy replays; not prevalence, optimality or score improvement. Full hand costs are actual credit/energy costs; playCard event price follows runtime credit cost. Joint budget pays setup first and at most one held card per distinct1/2/3 credit-price slot. No future income, draws, refund, company return or reward financing counted. Positive candidate and old-slot exclusion are separate conservative filters, not proofs other cards will never be played. No supported-slot count is substituted for expected utility.',cases:proofs.map(p=>({case:p.case,semanticLogs:p.semanticLogs,scores:p.scores,fullSemanticReplay:p.fullSemanticReplay})),inputs:proofs.map(p=>({file:`trigger-budget-diagnosis-${p.case}-proof.json`,sha256:crypto.createHash('sha256').update(fs.readFileSync(d+`trigger-budget-diagnosis-${p.case}-proof.json`)).digest('hex')})),observations:rows.length,instances:first.length,firstObservations:first,rows};
fs.writeFileSync('docs/ai-validation/2026-09-28-trigger-budget-diagnosis.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({cases:report.cases,observations:rows.length,first:first.map(x=>({case:x.case,round:x.round,company:x.company,score:x.setupCandidate?.score,known:x.knownHandBudget.slots,positive:x.positiveCandidateBudget.slots,exclusive:x.exclusivePositiveBudget.slots,selected:x.selected.id}))},null,2));
