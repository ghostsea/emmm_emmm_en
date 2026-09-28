const fs=require('fs'),assert=require('node:assert/strict'),d='tmp/ai-20260905/',p='repeatcorner';
const read=n=>JSON.parse(fs.readFileSync(d+p+'-'+n+'.json'));
const q=read('queue-complete'),all=read('complete'),r=all.report,receipts=read('realization');
assert.equal(q.completed.length,24);assert.equal(q.failures.length,0);assert.equal(q.pending.length,0);
assert.equal(r.baseline.games,24);assert.equal(r.candidate.games,24);
assert.equal(read('accounting-audit').issues.length,0);assert.equal(read('runtime-audit').summary.issues.length,0);
assert.equal(read('payment-amounts').summary.issues.length,0);
const report={decision:r.delta.mean>0?'positive-fixed-development-needs-fresh-validation':'reject-fixed-development-no-fresh-validation',baseline:'0fc957021a4c6e1af19e378121dfaa9a62f020e9',
 candidate:'294381a8b892f608137db01df33355774dbfc73f',newGames:24,reusedBaselineGames:24,report:r,
 receipts:receipts.summary,payments:read('payment-amounts').summary,
 approximate95Interval:[r.delta.mean-1.96*r.pairedGameMeanDeltaStandardError,r.delta.mean+1.96*r.pairedGameMeanDeltaStandardError],
 goal:{achieved:false,target:10,latestAcceptedDirectFresh64Gain:6.703125},
 limitations:['Previously seen fixed seeds; no fresh generalization estimate.',
  'New legal coverage and corner ranking share existing resource and one-step movement weights; no full multi-step forecast.',
  'Explicit receipts count whole post-payment transaction, including triggered nodes; not isolated direct-card attribution.',
  'Full table mean has priority; company breakdowns are diagnostic, not posthoc adoption gates.',
  'Frozen parser23 direct repeated publicity entries say1 instead of3; separate parser24 audit reattributes matching synthetic2, all resource aggregates unchanged.',
  'Do not add fixed effects to earlier fresh6.703125; defaults remain unchanged.']};
fs.writeFileSync(d+p+'-assessment.json',JSON.stringify(report,null,2)+'\n');
for(const name of ['assessment','complete','accounting-audit','runtime-audit','configuration-audit','paired-cohorts','aid-audit','payment-amounts','resource-matrix','queue-complete','realization'])fs.copyFileSync(d+p+'-'+name+'.json','docs/ai-validation/2026-09-28-'+p+'-'+name+'.json');
fs.copyFileSync(d+p+'-resource-matrix.md','docs/ai-validation/2026-09-28-'+p+'-resource-matrix.md');
console.log(JSON.stringify({delta:r.delta.mean,se:r.pairedGameMeanDeltaStandardError,payments:report.payments,receipts:report.receipts},null,2));
