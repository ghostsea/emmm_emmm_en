const fs=require('fs'),assert=require('node:assert/strict'),d='tmp/ai-20260905/',p='cardgraph';
const read=n=>JSON.parse(fs.readFileSync(d+p+'-'+n+'.json'));
const q=read('queue-complete'),all=read('complete'),r=all.report,rank=read('ranking-audit');
assert.equal(q.completed.length,24);assert.equal(q.failures.length,0);assert.equal(q.pending.length,0);
assert.equal(r.baseline.games,24);assert.equal(r.candidate.games,24);
assert.equal(read('accounting-audit').issues.length,0);
assert.equal(read('runtime-audit').summary.issues.length,0);
assert.equal(read('payment-amounts').summary.issues.length,0);
assert.equal(rank.issues.length,0);
const assessment={phase:'complete-fixed-development',decision:r.delta.mean>0?'positive-development-needs-fresh-validation':'reject-development-no-fresh-validation',
  baseline:'0fc957021a4c6e1af19e378121dfaa9a62f020e9',candidate:'8cd77380da6b7b673ac07caf3e6c0198cb3e94d2',
  newCandidateGames:24,reusedExactBaselineGames:24,report:r,ranking:rank.summary,companies:rank.companies,
  payments:read('payment-amounts').summary,
  approximate95Interval:[r.delta.mean-1.96*r.pairedGameMeanDeltaStandardError,r.delta.mean+1.96*r.pairedGameMeanDeltaStandardError],
  goal:{achieved:false,latestAcceptedDirectFresh64Gain:6.703125,target:10},
  limits:['All seeds already seen; fixed effect is development evidence, not fresh generalization.',
    'Ranking exposes existing graph estimates; it does not establish that graph goal weights are calibrated.',
    'Later cross-action pressure remains after card representative selection; no global optimum claim.',
    'No reserve ablation or company resource changes; keep income/non-income and actual payment comparisons.',
    'Do not add this fixed effect to prior fresh6.703125; direct fresh comparison is required.']};
fs.writeFileSync(d+p+'-assessment.json',JSON.stringify(assessment,null,2)+'\n');
console.log(JSON.stringify({decision:assessment.decision,delta:r.delta,se:r.pairedGameMeanDeltaStandardError,companies:r.companies,ranking:rank.summary,payments:assessment.payments},null,2));
