const fs=require('fs'),assert=require('node:assert/strict'),d='tmp/ai-20260905/',out='docs/ai-validation/2026-09-28-';
const read=n=>JSON.parse(fs.readFileSync(d+n+'.json'));
const compact=r=>({baseline:r.baseline,candidate:r.candidate,delta:r.delta,companies:r.companies,
 pairedGameStandardError:r.pairedGameMeanDeltaStandardError,approximate95Interval:[r.delta.mean-1.96*r.pairedGameMeanDeltaStandardError,r.delta.mean+1.96*r.pairedGameMeanDeltaStandardError],gamesImproved:r.gamesImproved,gamesRegressed:r.gamesRegressed});
const q=read('repeatfresh-triple-queue-complete');assert.equal(q.completed.length,192);assert.equal(q.failures.length,0);assert.equal(q.pending.length,0);
const comparisons={};
for(const p of ['repeatabsolute64','repeatincremental64']){
 const r=read(p+'-complete').report;assert.equal(r.baseline.games,64);assert.equal(r.candidate.games,64);
 const accounting=read(p+'-accounting-audit'),runtime=read(p+'-runtime-audit'),payment=read(p+'-payment-amounts'),receipt=read(p+'-exact-receipts');
 assert.equal(accounting.issues.length,0);assert.equal(runtime.summary.issues.length,0);assert.equal(payment.summary.issues.length,0);assert.equal(receipt.summary.issues.length,0);
 comparisons[p]={...compact(r),paidPlays:payment.summary,exactReceipts:receipt.summary,incomeClassificationCorrection:read(p+'-incomeformula-corrected').summary,
  baselineSelectedHigh:read(p+'-paired-cohorts').baselineHighQuartile,baselineSelectedLow:read(p+'-paired-cohorts').baselineLowQuartile};
 for(const suffix of ['complete','accounting-audit','runtime-audit','configuration-audit','paired-cohorts','aid-audit','payment-amounts','resource-matrix','queue-complete','incomeformula-corrected','exact-receipts'])fs.copyFileSync(d+p+'-'+suffix+'.json',out+p+'-'+suffix+'.json');
 for(const suffix of ['resource-matrix','incomeformula-corrected'])fs.copyFileSync(d+p+'-'+suffix+'.md',out+p+'-'+suffix+'.md');
}
const accepted=read('repeatfresh-current-vs-original');fs.copyFileSync(d+'repeatfresh-current-vs-original.json',out+'repeatfresh-current-vs-original.json');
fs.copyFileSync(d+'repeatfresh-triple-queue-complete.json',out+'repeatfresh-triple-queue-complete.json');
fs.copyFileSync(d+'repeatabsolute64-realization.json',out+'repeatabsolute64-realization.json');
for(const name of ['audit-repeat-receipts','finish-repeatfresh-post','archive-repeatfresh'])fs.copyFileSync(d+name+'.cjs',out+name+'.cjs');
const result={status:'full-validation-complete-pending-policy-review',uniqueNewGames:192,pairs:64,comparisons,acceptedCurrentVsOriginal:compact(accepted.report),
 goal:{target:10,achieved:false,reason:'Do not mark success or change the default solely by archiving a candidate result; policy decision and integration remain separate.'},
 limitations:['All three arms share each game and alien seed; report game-paired uncertainty. Candidate is shared by both comparisons; 192 unique games, not256.',
 'Mean first and high-score distribution second; company and baseline-selected cohorts retained, no seed filtering.',
 'Parser24 frozen reports retain original resource amounts. Separate parser25 classification audit preserves total resources, spending, inventories and action counts.',
 'DLC20 moving-corner forecast is first-step plus nominal pool only. Direct resource receipts use pending-choice caps; follow-on triggered rewards are not all attributed to this card.',
 'Direct original/current comparison is on these same64 fresh triples. Historical mean gains are not added.']};
fs.writeFileSync(out+'repeatfresh-triple-results.json',JSON.stringify(result,null,2)+'\n');
let md='# 三次角标完整随机验证\n\n完整64组、三个冻结版本、192个独立运行全部完成。原始、当前默认、候选共享每组游戏与外星人种子；两个比较复用同一候选，不能计作256局。以下结果尚待默认策略采用决定。\n\n|比较|基线均分|比较版均分|差值|配对SE|高四分位差|每局最低差|\n|---|---:|---:|---:|---:|---:|---:|\n';
for(const [name,r]of [...Object.entries(comparisons),['当前默认对原始',result.acceptedCurrentVsOriginal]])md+='|'+[name,r.baseline.mean,r.candidate.mean,r.delta.mean,r.pairedGameStandardError,r.delta.topQuartileMean,r.delta.minimumPerGameMean].map(x=>typeof x==='number'?x.toFixed(6):x).join('|')+'|\n';
md+='\n收入/非收入请使用对应incomeformula-corrected表。原冻结resource-matrix表保留作复核，收入计数牌分类是旧解析器24口径；总资源、主行动、分析和蓝科技返还逐席相同。高分分布和基线高分同席群体分别报告，不能把它们混为同一指标。\n';
for(const [p,r]of Object.entries(comparisons)){md+='\n## '+p+'\n\n|公司|基线|候选|差值|\n|---|---:|---:|---:|\n';for(const [c,x]of Object.entries(r.companies))md+='|'+[c,x.baseline,x.candidate,x.meanDelta].map(v=>typeof v==='number'?v.toFixed(6):v).join('|')+'|\n';md+='\n最高分'+r.baseline.max+'→'+r.candidate.max+'；300+席位'+r.baseline.seats300Plus+'→'+r.candidate.seats300Plus+'；基线高四分位同席均值差'+r.baselineSelectedHigh.meanDelta.toFixed(6)+'。\n';}
fs.writeFileSync(out+'repeatfresh-triple-results.md',md);console.log(JSON.stringify(result,null,2));
