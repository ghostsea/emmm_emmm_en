const fs=require('fs'),cp=require('child_process'),path=require('path'),Module=require('module'),assert=require('node:assert/strict');
const filename=path.resolve('randomizer/game/ai/resource-flow.js'),source=fs.readFileSync(filename,'utf8'),current=require(filename);
function compile(s){const m=new Module(filename,module);m.filename=filename;m.paths=Module._nodeModulePaths(path.dirname(filename));m._compile(s,filename);m.loaded=true;return m;}
if(process.argv[2]==='negative'){
 require.cache[filename]=compile(source.replace('function getMovementResourceSummary(text) {','function getMovementResourceSummary(text) { return null;'));
 require('../../randomizer/game/ai/resource-flow.test.js');
}else{
 const negative=cp.spawnSync(process.execPath,[__filename,'negative'],{encoding:'utf8'});assert(negative.status!==0&&negative.stderr.includes('AssertionError'));
 const old=compile(cp.execFileSync('git',['show','61c915ea:randomizer/game/ai/resource-flow.js'],{encoding:'utf8'})).exports;
 const changed=[];let lines=0;
 for(const file of fs.readdirSync('参考行动日志').filter(f=>f.endsWith('.md'))){for(const [i,text]of fs.readFileSync('参考行动日志/'+file,'utf8').split(/\r?\n/).entries()){if(!text.startsWith('- ['))continue;lines++;const before=old.parseDeltaText(text).resourceDeltas,after=current.parseDeltaText(text).resourceDeltas;if(JSON.stringify(before)!==JSON.stringify(after))changed.push({file,line:i+1,text,before,after});}}
 const base=[];let aiEvents=0;
 for(let i=1;i<=24;i++){const r=JSON.parse(fs.readFileSync('tmp/ai-20260905/tracetargetvalues-base-'+i+'.json'));for(const e of r.result.resourceFlow.events){aiEvents++;const before=old.parseDeltaText(e.sourceDetail).resourceDeltas,after=current.parseDeltaText(e.sourceDetail).resourceDeltas;if(JSON.stringify(before)!==JSON.stringify(after))base.push({case:i,player:e.playerId,entry:e.entryId,text:e.sourceDetail,before,after});}}
 const out={scope:'Text-only parser22 vs parser23 delta audit, not complete ledger reanalysis. Movement impact values are total before/after deltas for keys present; other keys are preserved. Full-game replay separately required for runtime equivalence.',negativeControl:{exit:negative.status,error:negative.stderr.slice(0,1800)},humanLines:lines,changedHumanLines:changed.length,changed,aiEvents,changedAiEvents:base.length,base};
 fs.writeFileSync('docs/ai-validation/2026-09-28-movement-impact-diagnostic.json',JSON.stringify(out,null,2)+'\n');console.log({human:changed.length,ai:base.length,cases:[...new Set(base.map(x=>x.case))]});
}
