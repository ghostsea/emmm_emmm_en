const fs=require('fs'),assert=require('node:assert/strict');
const read=side=>{const r=JSON.parse(fs.readFileSync('tmp/ai-20260905/datagoal-'+side+'-browser.json'));assert(!r.exceptionDetails);return r.result.value;};
const a=read('base'),b=read('candidate'),clean=x=>JSON.parse(JSON.stringify(x,(k,v)=>['createdAt','placedAt'].includes(k)?undefined:v));
assert.equal(a.rows.length,5);assert.equal(b.rows.length,5);
for(let i=0;i<5;i++){
 const old=a.rows[i],now=b.rows[i];
 assert.deepEqual(clean(old.snapshot.state),clean(now.snapshot.state));
 for(const key of ['before','afterPayment','after','actualGain','rawScore','rawEffectValue'])assert.deepEqual(old[key],now[key],key+' '+now.test.name);
 assert.equal(old.blueGoal,0);assert.equal(now.blueGoal,now.test.gain>0?12:0);
 assert.equal(now.support.supported,now.actualGain>0);assert.equal(now.support.requested,now.test.alien?3:2);
 assert.equal(now.before.credits-now.afterPayment.credits,2);assert.equal(now.bugs.length,0);
}
console.log(JSON.stringify({cases:5,fullStatesEqual:true,rawScoresAndRuntimeUnchanged:true,
 casesDetail:b.rows.map((r,i)=>({case:r.test.name,actualGain:r.actualGain,support:r.support,blueGoal:[a.rows[i].blueGoal,r.blueGoal],graphNet:[a.rows[i].actionGraph.net,r.actionGraph.net]}))},null,2));
