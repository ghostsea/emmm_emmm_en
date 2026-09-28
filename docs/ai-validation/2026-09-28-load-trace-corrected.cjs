const fs=require('fs'),crypto=require('crypto'),assert=require('node:assert/strict');
const {repairTracePaymentResources}=require('../../tools/repair_ai_trace_payment_resources');
const d='tmp/ai-20260905/',hash=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
module.exports=function load(file,run){
 try{return repairTracePaymentResources(run);}catch(e){
  const proofs=['trace-parser29-unresolved-replays','weightgrid-parser29-replays'].flatMap(name=>{const f='docs/ai-validation/2026-09-28-'+name+'.json';if(!fs.existsSync(f))return[];const r=JSON.parse(fs.readFileSync(f));assert.equal(r.failures.length,0);return r.rows;});
  const p=proofs.find(x=>x.file===file);if(!p)throw e;
  assert.equal(hash(d+file),p.sourceHash);assert.equal(hash(p.output),p.replayHash);
  const replay=JSON.parse(fs.readFileSync(p.output));
  return{method:'full-semantic-equal-parser29-replay',unresolvedCorrection:e.message,changes:[],resourceFlow:replay.result.resourceFlow};
 }
};
