const fs=require('fs'),assert=require('node:assert/strict'),crypto=require('crypto'),d='tmp/ai-20260905/';
const load=arm=>{const r=JSON.parse(fs.readFileSync(d+'strategy-credit-reserve-'+arm+'-browser.json'));assert(!r.exceptionDetails);assert.equal(r.result.value.bugs.length,0);return r.result.value;};
const a=load('base'),b=load('candidate'),semantic=x=>JSON.parse(JSON.stringify(x,(k,v)=>['createdAt','placedAt'].includes(k)?undefined:v));
assert.deepEqual(semantic(a.fixtureSnapshot.state),semantic(b.fixtureSnapshot.state));assert.deepEqual(a.before,b.before);assert.deepEqual(a.after,b.after);assert.deepEqual(a.cost,b.cost);assert.equal(a.penalty,7);assert.equal(b.penalty,0);assert(Math.abs(b.candidateScore-a.candidateScore-7)<1e-9);
const summary=({fixtureSnapshot,...r})=>r;
const report={scope:'Same complete recovery state after excluding createdAt/placedAt timestamps, same paid b74 instance and resource outcome. Penalty field and candidate score differ by exactly7; no full-game effect-size claim.',fixtureStateSha256:crypto.createHash('sha256').update(JSON.stringify(semantic(a.fixtureSnapshot.state))).digest('hex'),base:summary(a),candidate:summary(b)};
fs.writeFileSync('docs/ai-validation/2026-09-28-strategy-reserve-fixture.json',JSON.stringify(a.fixtureSnapshot,null,2)+'\n');
fs.writeFileSync('docs/ai-validation/2026-09-28-strategy-reserve-browser.json',JSON.stringify(report,null,2)+'\n');console.log({sameState:true,penalty:[a.penalty,b.penalty],score:[a.candidateScore,b.candidateScore],paid:b.cost,resources:b.after});
