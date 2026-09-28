const fs=require('node:fs'),assert=require('node:assert/strict');
const d='tmp/ai-20260905/',out='docs/ai-validation/2026-09-28-',read=n=>JSON.parse(fs.readFileSync(d+n+'.json'));
const q=read('weightgrid-queue-complete');assert.equal(q.completed.length,72);assert.equal(q.failures.length,0);assert.equal(q.pending.length,0);
assert.equal(read('weightgrid-audits-complete').issues.length,0);
const rows=[];
for(const p of ['weightgridplay','weightgridscan','weightgridboth']){
 const r=read(p+'-complete').report,suite=read(p+'-suite');assert.equal(r.baseline.games,24);assert.equal(r.candidate.games,24);
 const a=read(p+'-accounting-audit'),rt=read(p+'-runtime-audit'),pay=read(p+'-payment-amounts'),scan=read(p+'-scan-audit');
 for(const issues of [a.issues,rt.summary.issues,pay.summary.issues,scan.summary.issues])assert.equal(issues.length,0);
 assert.equal(read(p+'-configuration-audit').games,48);assert.equal(a.seats,192);
 rows.push({prefix:p,weights:suite.expectedStrategyWeights.candidate,baseline:r.baseline,candidate:r.candidate,delta:r.delta,companies:r.companies,se:r.pairedGameMeanDeltaStandardError,payment:pay.summary,scan:scan.summary,pairedCohorts:read(p+'-paired-cohorts')});
 for(const suffix of ['complete','accounting-audit','runtime-audit','configuration-audit','payment-amounts','paired-cohorts','resource-matrix','aid-audit','scan-audit','queue-complete'])fs.copyFileSync(d+p+'-'+suffix+'.json',out+p+'-'+suffix+'.json');
 fs.copyFileSync(d+p+'-resource-matrix.md',out+p+'-resource-matrix.md');
}
for(const r of rows)assert.deepEqual(r.baseline,rows[0].baseline);
const report={status:'complete-development-grid-pending-review',newGames:72,uniqueGamesIncludingBaseline:96,rows,limitations:['Full24 seen seed development for each frozen parameter combination; choose at most one positive variant, not a per-company mixture.','Baselines are reused; not144 new games. Source011/parser28 unchanged, actual configured weights audited.','No scan-projection combination tested. Fresh independent validation required before adoption and direct original comparison required for +10/+20.','Company/high/low differences and real resource metrics describe complete runs; more actions are not by themselves score gain.']};
fs.writeFileSync(out+'weightgrid-complete.json',JSON.stringify(report,null,2)+'\n');
let md='# 同版本行动权重完整开发结果\n\n全部三组、72新局完成并通过费用、资源、运行和配置审计；复用同24基线，共96个独立游戏输入。策略选择待完整判断，尚不采用。\n\n|方案|基线均分|候选均分|增量|配对 SE|高四分位分布差|每局最低差|\n|---|---:|---:|---:|---:|---:|---:|\n';
for(const r of rows)md+='|'+[r.prefix,r.baseline.mean,r.candidate.mean,r.delta.mean,r.se,r.delta.topQuartileMean,r.delta.minimumPerGameMean].map(v=>typeof v==='number'?v.toFixed(6):v).join('|')+'|\n';
for(const r of rows){md+='\n## '+r.prefix+'\n\n|公司|均分变化|\n|---|---:|\n';for(const [company,x]of Object.entries(r.companies))md+='|'+company+'|'+x.meanDelta.toFixed(6)+'|\n';md+=`\n最高 ${r.baseline.max}→${r.candidate.max}；300+ 席位 ${r.baseline.seats300Plus}→${r.candidate.seats300Plus}。实际资源与动作见[完整矩阵](2026-09-28-${r.prefix}-resource-matrix.md)。\n`;}
md+='\n固定开发成绩不能用于宣称 +10 达成，不能相加历史候选收益，也不能按本轮分公司结果重新拼装策略。全部默认评分逻辑与游戏资源规则保持，改动仅为冻结配置中的两项权重。\n';
fs.writeFileSync(out+'weightgrid-complete.md',md);
for(const f of ['archive-weightgrid','finish-weightgrid','queue-weightgrid','weightgrid-run','audit-weightgrid-configuration'])fs.copyFileSync(d+f+'.cjs',out+f+'.cjs');
for(const f of ['weightgrid-queue-complete','weightgrid-audits-complete'])fs.copyFileSync(d+f+'.json',out+f+'.json');
console.log(JSON.stringify(rows.map(r=>({prefix:r.prefix,delta:r.delta,se:r.se,companies:r.companies})),null,2));
