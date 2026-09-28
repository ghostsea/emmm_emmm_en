const fs=require('fs'),assert=require('node:assert/strict');
const read=name=>JSON.parse(fs.readFileSync('tmp/ai-20260905/'+name+'.json'));
const source=read('cardgraph-case6-fixture'),browser=read('cardgraph-browser');
assert(!source.exceptionDetails&&!browser.exceptionDetails);
const a=source.result.value,b=browser.result.value;
const clean=x=>JSON.parse(JSON.stringify(x,(k,v)=>['createdAt','placedAt'].includes(k)?undefined:v));
assert.deepEqual(clean(a.fixture.state),clean(b.snapshot.state));
assert.equal(b.bugs.length,0);
assert.equal(b.play.valueBreakdown.grandStrategyCreditBottleneckPenalty,0);
assert.equal(b.selected.playableCards.find(c=>c.cardId==='amiba_0.webp').valueBreakdown.grandStrategyCreditBottleneckPenalty,7);
assert.equal(b.play.cardInstanceId,b.turn.cardInstanceId);
assert.equal(b.play.cardId,'b_90.webp');
assert.equal(b.before.credits-b.afterPayment.credits,2);
const raised=b.raisedRawOnly;
assert.equal([...raised.playableCards].sort((a,b)=>b.score-a.score)[0].cardId,'amiba_0.webp');
assert.equal(raised.cardId,'b_90.webp');
assert.equal(raised.cardGraphAlternatives[0].net,51.75);
assert.equal(raised.cardGraphAlternatives.find(x=>x.cardId==='amiba_0.webp').net,36.02);
console.log(JSON.stringify({fullSnapshotSame:true,selected:b.play.cardId,paidCredits:2,
  creditsAfterRewards:b.after.credits,dataGain:b.after.availableData-b.before.availableData,
  scoreGain:b.after.score-b.before.score,rawPreselect:'amiba_0.webp',graphSelect:raised.cardId,
  steps:b.steps,bugs:0},null,2));
