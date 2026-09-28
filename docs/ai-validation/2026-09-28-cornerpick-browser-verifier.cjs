const fs=require('fs'),assert=require('node:assert/strict'),cp=require('child_process'),d='tmp/ai-20260905/';
const a=JSON.parse(fs.readFileSync(d+'cornerpick-browser-base.json')).result.value.rows,b=JSON.parse(fs.readFileSync(d+'cornerpick-browser-candidate.json')).result.value.rows;
assert.equal(a.length,6);assert.equal(b.length,6);
for(let i=0;i<a.length;i++){
 for(const field of ['test','before','paid','after','hand','rocketsBefore','rocketsAfter','randomBefore','randomAfter','bugs'])assert.deepEqual(a[i][field],b[i][field],field+' '+i);
 assert.equal(a[i].available,false);assert.equal(b[i].available,true);assert.equal(b[i].value,b[i].effectValue);
 assert.equal(b[i].value,[4.5,3,3,4.5,4.5,3][i]);
}
assert.notDeepEqual(b[3].rocketsBefore,b[3].rocketsAfter);
const proof={scope:'Six forced actual b48 payment and public-corner flows. Same fixed random stream and retained card identity. Zero/positive data/publicity capacity, unavailable and actual movement. Preview nominal movement value does not include visitation triggers.',pairs:6,rows:b.map((r,i)=>({test:r.test,oldAvailable:a[i].available,newAvailable:r.available,oldValue:a[i].value,newValue:r.value,before:r.before,paid:r.paid,after:r.after,hand:r.hand,moved:JSON.stringify(r.rocketsBefore)!==JSON.stringify(r.rocketsAfter)}))};
fs.writeFileSync(d+'cornerpick-browser-proof.json',JSON.stringify(proof,null,2)+'\n');
const root=d+'hand-count-after-play',file=root+'/randomizer/app/ai-controller.js',saved=fs.readFileSync(file);
try{fs.writeFileSync(file,cp.execFileSync('git',['show','c7e160ce87a8e00ee9d4b429f61b8b198dbd1e37:randomizer/app/ai-controller.js'],{cwd:root,maxBuffer:8000000}));const r=cp.spawnSync(process.execPath,['randomizer/app/ai-controller.test.js'],{cwd:root,encoding:'utf8'});fs.writeFileSync(d+'cornerpick-negative.log',r.stdout+r.stderr);assert.notEqual(r.status,0);assert(r.stderr.includes('b48 must have a playable public target'));}finally{fs.writeFileSync(file,saved);}
console.log('PASS 6 actual browser pairs and old unsupported-card negative control');
