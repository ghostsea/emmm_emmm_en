const fs=require('fs'),assert=require('node:assert/strict'),crypto=require('crypto'),d='tmp/ai-20260905/',p=process.argv[2],suite=JSON.parse(fs.readFileSync(d+p+'-suite.json')),rows=[],inputs=[];
const resourceByCard={'b_42.webp':'energy','b_47.webp':'credits','b_79.webp':'handSize'};
for(const [i,pair]of suite.pairs.entries())for(const side of ['baseline','candidate']){
 const bytes=fs.readFileSync(d+pair[side]),r=JSON.parse(bytes);assert(r.summary.ok&&r.summary.gameEnded&&!r.summary.bugCount&&!r.summary.blocked);
 inputs.push({case:i+1,side,file:pair[side],sha256:crypto.createHash('sha256').update(bytes).digest('hex')});
 for(const l of r.result.logs.filter(x=>x.type==='play-card'&&resourceByCard[x.details.selected.cardId])){
  const s=l.details.selected,key=resourceByCard[s.cardId],events=r.result.resourceFlow.events.filter(e=>e.playerId===l.playerId);
  const payments=events.filter(e=>e.pace==='main'&&e.cards?.some(c=>c.key===s.cardInstanceId&&c.change==='play'));assert.equal(payments.length,1);
  const es=events.filter(e=>e.entryId===payments[0].entryId&&e.pace==='main'&&/^将本卡放入收入区[:：]/.test(e.sourceDetail));assert.equal(es.length,1);
  const e=es[0],company=r.result.playerResults.find(x=>x.playerId===l.playerId).companyLabel;
  assert.equal(e.incomeDeltas[key],1);assert.equal(e.resourceDeltas[key],1);assert(!(e.cards||[]).some(c=>['discard','income'].includes(c.change)));
  const profile=s.valueBreakdown.selfIncome;
  if(p==='selfincomeall'&&side==='candidate'){assert(profile);assert.equal(profile.gain[key],1);assert.equal(profile.futurePayouts.length,4-l.roundNumber);}
  rows.push({case:i+1,side,company,player:l.playerId,round:l.roundNumber,log:l.id,card:s.cardId,instance:s.cardInstanceId,entry:e.entryId,step:e.stepIndex,resource:key,income:e.incomeDeltas,immediate:e.resourceDeltas,text:e.sourceDetail,profile});
 }
}
assert.equal(inputs.length,48);
const summary={games:inputs.length,actualPlays:rows.length,profilePlays:rows.filter(x=>x.profile).length,issues:[],counts:Object.fromEntries(['baseline','candidate'].map(side=>[side,Object.fromEntries([...new Set(rows.map(x=>x.company))].map(c=>[c,rows.filter(x=>x.side===side&&x.company===c).length]))]))};
fs.writeFileSync(d+p+'-self-income-receipts.json',JSON.stringify({scope:'All48 full fixed inputs. Unique physical-card payment entry plus same-entry main self-tuck step: actual+1 income, actual+1 immediate matching resource, no second card discard. Future payout model is reported but these receipt assertions do not prove extra future actions or causally attribute aggregate round income.',inputs,summary,rows},null,2)+'\n');console.log(JSON.stringify(summary));
