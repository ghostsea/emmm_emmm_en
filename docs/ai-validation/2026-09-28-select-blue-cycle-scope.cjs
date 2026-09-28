const fs=require('fs'),assert=require('node:assert/strict'),d='tmp/ai-20260905/',out='docs/ai-validation/2026-09-28-';
const scopes={};
assert(!fs.existsSync(out+'blue-cycle-scope-selection.json'),'scope selection must not be rewritten after freeze');
for(const p of ['bluelifecycle','huanyubluelifecycle','weakbluelifecycle']){
 const r=JSON.parse(fs.readFileSync(d+p+'-complete.json')).report,s=JSON.parse(fs.readFileSync(d+p+'-suite.json'));
 assert.equal(r.pairs.length,24);
 for(const suffix of ['accounting-audit','runtime-audit','payment-amounts','named-pickup-corrected']){const x=JSON.parse(fs.readFileSync(d+p+'-'+suffix+'.json'));assert.equal((x.summary||x).issues.length,0);}
 scopes[p]={candidate:s.models.candidate.commit,meanDelta:r.delta.mean,pairedSE:r.pairedGameMeanDeltaStandardError,topQuartileDelta:r.delta.topQuartileMean,winnerDelta:r.delta.winnerMean,minimumPerGameDelta:r.delta.minimumPerGameMean,maximumDelta:r.delta.max,companies:r.companies};
}
const selectedPrefix='huanyubluelifecycle';assert(Object.values(scopes).every(x=>x.meanDelta<=scopes[selectedPrefix].meanDelta));
const selection={selectedAt:new Date().toISOString(),selectedPrefix,selectedCommit:scopes[selectedPrefix].candidate,scopes,reason:'All three scopes completed on the same full24 known development seeds. Huanyu-only has the highest table mean and better distribution high/winner means; all-company is nearly flat with high losses, Huanyu+Grand is negative. This is development-set selection, not independent evidence. Freeze scope before generating64 new game/alien seeds; do not reselect company scope on fresh results.',freshPlan:{pairs:64,arms:3,newGames:192,baseline:'original f542 and current011, both parser26',stopRule:'Complete all64 triples and audits. No optional stopping, seed filtering, or tuning during run.'}};
fs.writeFileSync(out+'blue-cycle-scope-selection.json',JSON.stringify(selection,null,2)+'\n');
const selectedFile=out+'huanyubluelifecycle-summary.json',selectedSummary=JSON.parse(fs.readFileSync(selectedFile));selectedSummary.status='selected-for-fresh-random-validation-not-adopted';fs.writeFileSync(selectedFile,JSON.stringify(selectedSummary,null,2)+'\n');
const file=out+'weakbluelifecycle-summary.json',summary=JSON.parse(fs.readFileSync(file));summary.status='not-adopted-negative-mean-and-large-high-score-regression';fs.writeFileSync(file,JSON.stringify(summary,null,2)+'\n');
fs.writeFileSync(out+'weakbluelifecycle-assessment.md',`# 两家弱公司范围：固定24组否决

完整24组均分-3.625000（SE3.999972），寰宇+14.583333、作弊-12.270833、大战略-4.541667。虽然作弊仍用原模型，它的得分仍明显改变，进一步说明共享盘面公司的效果不能独立相加。高四分位分布-20.083333、赢家-9.291667，最高355→334，绝对最低129→109，300+席位16→5；最低均值+4.791667不能抵消总体退化，本版不采用。

固定开发比较的三个适用范围已全部完成：全公司+0.312500、仅寰宇+2.729167、寰宇与大战略-3.625000。选择仅寰宇3c34fe09进入新随机验证，仍未合入默认。选择基于完整24组全桌均分与高分分布，不只取寰宇单席改善；不再扩张或缩小范围以迎合随后随机成绩。

下一轮冻结原始f542、当前011和仅寰宇候选三个版本、全新64组192局，两项比较共享候选臂。完整审计后直接计算当前和原始基线上的收益，不叠加历史增量。

证据：[完整结果](2026-09-28-weakbluelifecycle-summary.json)、[资源与行动](2026-09-28-weakbluelifecycle-resource-matrix.md)、[范围选择记录](2026-09-28-blue-cycle-scope-selection.json)。
`);
fs.copyFileSync(d+'select-blue-cycle-scope.cjs',out+'select-blue-cycle-scope.cjs');
fs.appendFileSync('docs/ai-design.md','\n2026-09-28 两弱公司循环范围a4f8ada8完整24组-3.625（SE3.999972）、高四分位-20.0833，否决。三个固定范围比较后选仅寰宇3c34fe09，冻结后生成64组全新种子，与原始/当前默认三臂192局直接对照；随机期间不再选择范围或调参。见[选择记录](ai-validation/2026-09-28-blue-cycle-scope-selection.json)与[两公司验收](ai-validation/2026-09-28-weakbluelifecycle-assessment.md)。\n');
console.log({selectedPrefix,selectedCommit:selection.selectedCommit,scopes});
