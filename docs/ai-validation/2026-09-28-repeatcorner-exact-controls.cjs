const fs=require('fs'),cp=require('child_process'),assert=require('assert/strict');const d='tmp/ai-20260905/';
const control=`const fs=require('fs'),orig=fs.readFileSync;fs.readFileSync=function(file,...args){const data=orig.call(this,file,...args);if(String(file).endsWith('repeatcorner-candidate-1.json')){const r=JSON.parse(data);const log=r.result.logs.find(x=>x.type==='rare-scan-target'&&x.details?.repeatCornerPreviews);const p=log.details.repeatCornerPreviews.find(x=>x.cardInstanceId===log.details.cardId);p.actualGain.publicity+=1;const text=JSON.stringify(r);return typeof data==='string'?text:Buffer.from(text);}return data;};process.argv[2]='repeatcorner';require('./audit-repeat-receipts.cjs');`;
fs.writeFileSync(d+'repeat-exact-negative.cjs',control);
const negative=cp.spawnSync(process.execPath,[d+'repeat-exact-negative.cjs'],{encoding:'utf8'});
assert.notEqual(negative.status,0);assert.match(negative.stderr,/actual pending preview resource publicity/);
const rows=JSON.parse(fs.readFileSync(d+'repeat-browser.json')).result.value.rows,proof=[];
for(const row of rows){
 assert.equal(row.bugs.length,0);const expectedFixedPublicity=Math.min(1,10-row.afterPayment.publicity);
 if(!row.test.name.startsWith('movement')){
  if(row.preview)for(const [key,n]of Object.entries(row.preview.actualGain))assert.equal(row.after[key]-row.afterPayment[key],n+(key==='publicity'?expectedFixedPublicity:0));
  else assert.equal(row.after.publicity-row.afterPayment.publicity,2);
  proof.push({name:row.test.name,actualBefore:row.afterPayment,actualAfter:row.after,preview:row.preview});continue;
 }
 const direct=row.actions.filter(x=>x.before.effect.id==='dlc20-repeat-corner-move-repeat-discard'),triggered=row.actions.filter(x=>!x.before.effect.id.startsWith('dlc20-repeat-corner-move-'));
 assert.equal(direct.length,3);assert.equal(triggered.length,1);assert.equal(triggered[0].before.effect.id,'b2-free-move');
 for(const [i,x]of direct.entries()){
  assert(x.step.ok);assert.equal(x.before.pool,3-i);assert.deepEqual(x.step.cost,{});
  const p=x.step.payload,after=x.after.rockets.find(r=>r.id===p.rocketId);
  assert.deepEqual({x:after.sectorX,y:after.sectorY},p.to);
  if(i===0){assert.equal(p.rocketId,row.preview.bestMove.rocketId);assert.deepEqual(p.from,row.preview.bestMove.from);assert.deepEqual(p.to,row.preview.bestMove.to);}
  if(i<2)assert.equal(p.poolRemaining,2-i);
 }
 proof.push({name:row.test.name,preview:row.preview,direct:direct.map(x=>({pool:x.before.pool,rocket:x.step.payload.rocketId,from:x.step.payload.from,to:x.step.payload.to,cost:x.step.cost,rewards:x.step.payload.rewards})),triggered:triggered.map(x=>({effect:x.before.effect.id,rewards:x.step.payload.rewards})),actualBefore:row.afterPayment,actualAfter:row.after});
}
const result={scope:'Existing five actual browser fixtures independently checked against post-payment receipts and actual movement results. Does not add autonomous movement coverage.',negativeControl:{exitCode:negative.status,expectedFailure:'actual pending preview resource publicity'},rows:proof};
fs.writeFileSync(d+'repeat-exact-controls.json',JSON.stringify(result,null,2)+'\n');console.log('five actual browser controls and wrong receipt negative control passed');
