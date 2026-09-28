const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('node:assert/strict'),cp=require('child_process');
const loadCorrected=require('./load-trace-corrected.cjs');
const d='tmp/ai-20260905/',out='docs/ai-validation/2026-09-28-',read=f=>JSON.parse(fs.readFileSync(d+f)),hash=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const prefixes=process.argv.slice(2);if(!prefixes.length)prefixes.push('scanprojectionabsolute64','scanprojectionincremental64');
const files=[...new Set(prefixes.flatMap(p=>read(p+'-suite.json').pairs.flatMap(x=>[x.baseline,x.candidate])))],rows=[],issues=[];
for(const file of files){
 const run=read(file);
 try{const fixed=loadCorrected(file,run);const net=es=>{const n={};for(const e of es)for(const [k,v]of Object.entries(e.resourceDeltas||{})){const key=e.playerId+':'+k;n[key]=(n[key]||0)+v;}return n;};assert.deepEqual(net(fixed.resourceFlow.events),net(run.result.resourceFlow.events));
 rows.push({file,sha256:hash(d+file),method:fixed.method,unresolvedCorrection:fixed.unresolvedCorrection,changes:fixed.changes,players:fixed.resourceFlow.players.map(p=>{const b=run.result.resourceFlow.players.find(x=>x.playerId===p.playerId);return{player:p.playerId,company:p.industryId,grossDataBefore:b.grossGain.availableData,grossDataAfter:p.grossGain.availableData,spentDataBefore:b.spent.availableData,spentDataAfter:p.spent.availableData};})});
 }catch(e){issues.push({file,error:e.message});}
}
const summary={uniqueGames:files.length,correctedGames:rows.filter(r=>r.changes.length||r.unresolvedCorrection).length,fullReplays:rows.filter(r=>r.unresolvedCorrection).length,explicitlyRelocatedPayments:rows.reduce((s,r)=>s+r.changes.length,0),grossDataRemoved:rows.reduce((s,r)=>s+r.players.reduce((n,p)=>n+p.grossDataBefore-p.grossDataAfter,0),0),issues};
const tag=prefixes[0].startsWith('scanprojection')?'scanprojectionfresh':'weightgrid';
fs.writeFileSync(out+tag+'-trace-payment-correction.json',JSON.stringify({scope:'Independent parser29 supplement; frozen input hashes and score results unchanged. All event net deltas checked; old resource matrices retain parser28. Unique game count deduplicates shared candidates/baselines.',summary,rows},null,2)+'\n');
console.log(JSON.stringify(summary));assert.equal(issues.length,0);
for(const p of prefixes){
 let code=fs.readFileSync(d+p+'-resource-matrix.cjs','utf8');
 const from='runs[side].push({result:{resourceFlow:{players:r.result.resourceFlow.players}}});';assert(code.includes(from));
 code=code.replace(from,'r.result.resourceFlow=require("./load-trace-corrected.cjs")(pair[side],r).resourceFlow;'+from)
 .replaceAll(p+'-resource-matrix.json',p+'-resource-matrix-parser29.json').replaceAll(p+'-resource-matrix.md',p+'-resource-matrix-parser29.md');
 code=code.replace('scope:suite.rule,groups','resourceParser:29,sourceScope:suite.rule,scope:"Parser29 corrected resource supplement; original game/configuration freeze remains: "+suite.rule,groups');
 fs.writeFileSync(d+p+'-resource-matrix-parser29.cjs',code);cp.execFileSync(process.execPath,[d+p+'-resource-matrix-parser29.cjs'],{stdio:'ignore',windowsHide:true});
 for(const ext of ['json','md'])fs.copyFileSync(d+p+'-resource-matrix-parser29.'+ext,out+p+'-resource-matrix-parser29.'+ext);
 if(p.startsWith('scanprojection')){
  let follow=fs.readFileSync(d+'audit-scanprojection-followup.cjs','utf8');const source='const r=JSON.parse(fs.readFileSync(d+pair.candidate)).result;';assert(follow.includes(source));
  follow=follow.replace(source,'const run=JSON.parse(fs.readFileSync(d+pair.candidate)),r=run.result;r.resourceFlow=require("./load-trace-corrected.cjs")(pair.candidate,run).resourceFlow;').replace("p+'-followup.json'","p+'-followup-parser29.json'");
  fs.writeFileSync(d+'audit-scanprojection-followup-parser29.cjs',follow);cp.execFileSync(process.execPath,[d+'audit-scanprojection-followup-parser29.cjs',p],{stdio:'ignore',windowsHide:true});fs.copyFileSync(d+p+'-followup-parser29.json',out+p+'-followup-parser29.json');
 }
}
if(tag==='scanprojectionfresh'){
 const files=fs.readdirSync('参考行动日志').filter(f=>f.endsWith('.md')).map(f=>path.resolve('参考行动日志',f));
 const before=require('./energy-card-unlock/tools/analyze_reference_action_logs').analyzeReferenceFiles(files),after=require('../../tools/analyze_reference_action_logs').analyzeReferenceFiles(files);
 assert(JSON.stringify({...after,generatedAt:null})===JSON.stringify({...before,generatedAt:null}), 'Human reports differ beyond generation timestamp');
 fs.writeFileSync(out+'trace-parser29-human-proof.json',JSON.stringify({files:files.length,games:after.games.length,seats:after.summary.players.length,allReportsUnchanged:true,scope:'Human reference parser already handles the payment verb; full report equality checked. Missing historical receipts are not filled.',inputs:files.map(f=>({file:f,sha256:hash(f)}))},null,2)+'\n');
}
