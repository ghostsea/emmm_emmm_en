const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),Module=require('node:module');
const d='tmp/ai-20260905/';
if(process.argv[2]){
 const file=path.resolve(process.argv[2],'randomizer/app/ai-controller.test.js');
 const needle='  assert.equal(cashoutScanCandidate.valueBreakdown?.analyzeCashoutGraphCap, true);';
 let source=fs.readFileSync(file,'utf8');if(!source.includes(needle))throw Error('fixture anchor absent');
 source=source.replace(needle,`console.log(JSON.stringify({action:cashoutSelectedAction?.id,result:cashoutResult,scan:{score:cashoutScanCandidate.score,net:cashoutScanCandidate.actionGraph?.net,cap:cashoutScanCandidate.valueBreakdown?.analyzeCashoutGraphCap,style:cashoutScanCandidate.breakdown?.aiStyleMultiplier},analyze:{score:cashoutAnalyzeCandidate.score,net:cashoutAnalyzeCandidate.actionGraph?.net,style:cashoutAnalyzeCandidate.breakdown?.aiStyleMultiplier}}));process.exit(0);`);
 const m=new Module(file,module);m.filename=file;m.paths=Module._nodeModulePaths(path.dirname(file));m._compile(source,file);
}else{
 const run=root=>JSON.parse(cp.execFileSync(process.execPath,[__filename,root],{encoding:'utf8'}).trim().split('\n').pop());
 const baseline=run(d+'card-trade-ledger28'),candidate=run(d+'weak-company-blue-lifecycle');
 if(baseline.action!=='analyze'||candidate.action!=='scan')throw Error('Expected isolated regression not reproduced; apply archived patch first');
 const result={status:'rejected-before-full-game-testing',scope:'Only suppress opening-style multiplier in round4; final formula and threshold multipliers unchanged. Existing meaningful ready-analysis fixture fails. Keep its action/ranking assertions; do not add a new company/state exception or widen graph cap without separate evidence.',baseline,candidate,explanation:'Removing the balanced-style analysis bonus raises scan versus analyze gap above the existing <=1 cap gate. Candidate selects scan rather than ready analysis. Scan execution is not wired in this unit fixture (result null); no claim of actual resource expenditure or whole-game score loss.'};
 fs.writeFileSync('docs/ai-validation/2026-09-28-final-style-preflight-regression.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
}
