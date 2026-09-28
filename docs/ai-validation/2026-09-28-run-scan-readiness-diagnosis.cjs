const fs=require('fs'),cp=require('child_process'),assert=require('node:assert/strict'),d='tmp/ai-20260905/',n=Number(process.argv[2]);assert([1,23].includes(n));const old=JSON.parse(fs.readFileSync(d+`tradeledger28v2-candidate-${n}.json`));
const stem='scan-readiness-diagnosis-'+n;
fs.writeFileSync(d+stem+'-page.js',fs.readFileSync(d+'scan-readiness-diagnosis-page.js','utf8').replace('__SEED__',JSON.stringify(old.options.seed)));
fs.writeFileSync(d+stem+'-smoke.cjs',fs.readFileSync(d+'scanyield-smoke.cjs','utf8').replace('codex-ai-slot-first-aliens-20260906:7b535ce4a3073aaa0c8bf0a7',old.options.alienSeed));
const r=cp.spawnSync(process.execPath,[d+stem+'-smoke.cjs','.',d+stem+'-page.js',d+stem+'.json'],{encoding:'utf8',maxBuffer:2000000});assert.equal(r.status,0,r.stderr||r.stdout);
const x=JSON.parse(fs.readFileSync(d+stem+'.json')).result.value;assert(!x.result.bugs?.length);const report=x.result.report||x.result;
const scores=report.playerResults?.map(p=>p.finalScore??p.score);console.log(JSON.stringify({case:n,keys:Object.keys(x.result),rows:x.rows.length,examples:x.rows.filter(x=>x.canPayAnalysisAfterScan&&!x.oldProjectedUnlock).map(x=>({company:x.company,round:x.round,resources:x.resources,selected:x.selected,scanScore:x.scan.score,effects:x.effects.map(e=>e.type)})),scores}));
