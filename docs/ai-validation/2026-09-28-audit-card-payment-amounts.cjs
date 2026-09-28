const fs=require('fs'),assert=require('node:assert/strict'),d='tmp/ai-20260905/',prefix=process.argv[2],negative=process.argv.includes('--negative-control');assert(prefix);const suite=JSON.parse(fs.readFileSync(d+prefix+'-suite.json')),rows=[];
for(const[i,pair]of suite.pairs.entries()){
 const run=JSON.parse(fs.readFileSync(d+pair.candidate));assert(run.summary.ok&&run.summary.gameEnded&&!run.summary.bugCount);const r=run.result,used=new Set();
 for(const [li,l]of r.logs.entries()){
  const a=l.details?.action;if(l.type!=='turn-action'||a?.id!=='playCard')continue;
  const next=r.logs.slice(li+1).find(x=>x.playerId===l.playerId&&['turn-action','play-card'].includes(x.type)),selected=next?.details?.selected;
  const key=e=>e.playerId+':'+e.entryId+':'+e.stepIndex;
  const payment=selected&&r.resourceFlow.events.find(e=>e.playerId===l.playerId&&e.roundNumber===l.roundNumber&&e.turnNumber===l.turnNumber&&!used.has(key(e))&&e.cards?.some(c=>c.key===selected.cardInstanceId&&c.change==='play'));
  if(payment)used.add(key(payment));
  const expected={...(selected?.cost||a.cost||{})};if(negative&&!rows.length)expected.credits=(Number(expected.credits)||0)+1;
  const actual=payment?.resourceDeltas||{},amounts=Object.fromEntries(['credits','energy','publicity','aomomoFossils'].filter(k=>Number(expected[k])>0||Number(actual[k])<0).map(k=>[k,{expectedSpent:Number(expected[k])||0,actualSpent:Math.max(0,-(Number(actual[k])||0))}]));
  rows.push({case:i+1,player:l.playerId,round:l.roundNumber,turn:l.turnNumber,instance:selected?.cardInstanceId,card:selected?.cardId,uniquePayment:Boolean(payment),entry:payment?.entryId,step:payment?.stepIndex,amounts,matching:payment&&Object.values(amounts).every(v=>Math.abs(v.actualSpent-v.expectedSpent)<1e-9),text:payment?.sourceDetail});
 }
}
const summary={pairs:suite.pairs.length,plays:rows.length,uniquePayments:rows.filter(x=>x.uniquePayment).length,matchingAmounts:rows.filter(x=>x.matching).length,issues:rows.filter(x=>!x.matching)};
fs.writeFileSync(d+prefix+'-payment-amounts'+(negative?'-negative-control':'')+'.json',JSON.stringify({scope:'Exact played card instance, player/round/turn, unused payment step. Compare expected candidate cost with negative actual credit/energy/publicity/fossil payment fields; no step may satisfy two plays. Immediate gains are not treated as costs; any netted-payment mismatch requires review, never silently accepted.',summary,rows},null,2)+'\n');console.log(JSON.stringify(summary,null,2));if(summary.issues.length)process.exitCode=1;
