const fs=require('fs'),assert=require('node:assert/strict'),d='tmp/ai-20260905/',o='docs/ai-validation/2026-09-28-';
const a=JSON.parse(fs.readFileSync(d+'cornerabsolute64-suite.json')),b=JSON.parse(fs.readFileSync(d+'cornerincremental64-suite.json'));
const identity=x=>x&&Object.fromEntries(['id','choice','tileId','cardId','cardInstanceId','handIndex','rocketId','direction','target','choiceId','slotIndex','tradeId','planetId','abilityId','dataId','slotId','from','to'].filter(k=>x[k]!==undefined).map(k=>[k,x[k]]));
function signature(l){const q=l.details||{};return {type:l.type,player:l.playerId,round:l.roundNumber,turn:l.turnNumber,message:l.message,resources:l.playerResources,board:l.scoreboard,action:identity(q.action),selected:identity(q.selected),selectedIndexes:q.selectedIndexes,selectedCards:q.selectedCards?.map(identity),slotIndex:q.slotIndex,card:identity(q.card),choiceId:q.choiceId};}
const rows=[];
for(let i=0;i<64;i++){
 assert.equal(a.pairs[i].seed,b.pairs[i].seed);const ra=JSON.parse(fs.readFileSync(d+a.pairs[i].baseline)).result,rb=JSON.parse(fs.readFileSync(d+b.pairs[i].baseline)).result;
 const logsA=ra.logs.filter(x=>!['config','start','finish'].includes(x.type)),logsB=rb.logs.filter(x=>!['config','start','finish'].includes(x.type));let j=0;while(j<Math.min(logsA.length,logsB.length)&&JSON.stringify(signature(logsA[j]))===JSON.stringify(signature(logsB[j])))j++;
 const huanyu=rb.playerResults.find(x=>x.companyLabel==='寰宇超动力'),old=ra.playerResults.find(x=>x.playerId===huanyu.playerId);
 const rec={case:i+1,huanyuDelta:huanyu.finalScore-old.finalScore,equalPrefix:j,original:logsA[j],current:logsB[j]};
 if(rec.current)rec.actorCompany=rb.playerResults.find(x=>x.playerId===rec.current.playerId)?.companyLabel;
 rows.push(rec);
}
const counts={};for(const r of rows){const k=r.original?.type+' → '+r.current?.type+' / '+r.actorCompany;counts[k]=(counts[k]||0)+1;}
fs.writeFileSync(o+'current-first-divergence.json',JSON.stringify({scope:'Full64 old/new log prefixes, compare actual selection identities, resource snapshots and messages, ignore numerical candidate valuations. This locates first observed behavioral/state divergence; not an isolated causal score estimate. All cases retained.',counts,rows},null,2)+'\n');
console.log(counts);console.log(rows.map(r=>({case:r.case,delta:r.huanyuDelta,actor:r.actorCompany,round:r.current?.roundNumber,turn:r.current?.turnNumber,old:r.original?.message,new:r.current?.message,oldSelected:identity(r.original?.details?.selected||r.original?.details?.action),newSelected:identity(r.current?.details?.selected||r.current?.details?.action),oldDiscard:r.original?.details?.selectedCards,newDiscard:r.current?.details?.selectedCards})));
