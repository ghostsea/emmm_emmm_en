const fs=require('fs'),assert=require('node:assert/strict'),d='docs/ai-validation/2026-09-28-',read=n=>JSON.parse(fs.readFileSync(d+n+'.json'));
const r=read('repeatfresh-triple-results'),pooled=read('accepted128-results');assert.equal(r.uniqueNewGames,192);
for(const n of [21,62]){const p=read('repeat-movement-proof-'+n);assert.equal(p.moves.length,3);assert(p.moves.every(x=>x.ok));}
const incremental=r.comparisons.repeatincremental64;
assert.equal(incremental.exactReceipts.resourceReceipts,10);assert.equal(incremental.exactReceipts.movementSteps,6);assert.equal(incremental.paidPlays.uniquePayments,3068);
r.status='deferred-candidate-default-unchanged';
r.decision={candidate:'9e6c8cd9cd7b3f5cc34e176dda1f6deebbccf919',defaultPolicy:'0fc957021a4c6e1af19e378121dfaa9a62f020e9',
 rationale:'Fresh incremental mean +0.125 with paired SE0.519552 is too small and uncertain to justify top-quartile -2.484375, winner -1.9375 and300+ seats30 to28. Fixed+0.208333 is also small. Legal coverage is validated but weaker-company resource-to-analysis conversion does not consistently improve. Keep candidate available without promoting it or claiming a measured negative mean.',
 controls:{uniqueFreshGames:192,candidateActualPayments:3068,dlc20Plays:10,plannedDiscardMatches:10,resourceCorners:8,movementCorners:2,actualMovementSteps:6,
 fullInstrumentedReplays:2,replaysAreNewIndependentSamples:false},
 followup:'Use these finished seeds only as development evidence from now on. Improve concrete resource/action conversion or supported card valuation on existing fixed suites, then generate a new unseen suite for any revised candidate. Do not rerun or subset this holdout seeking a favorable adoption result.'};
r.acceptedPolicyPooled128={meanDelta:pooled.report.delta.mean,pairedGameStandardError:pooled.report.pairedGameMeanDeltaStandardError,companies:pooled.report.companies,
 caveat:'Prior64 was used in adoption, so pooled128 is descriptive and partly selected; the new unchanged-policy replication alone is +4.08984375 SE1.881753. Both blocks included in full, same policy source beyond parser/cache changes.'};
r.goal={target:10,achieved:false,latestIndependentDefaultGain:4.08984375,pooledAcceptedPolicyGain:5.396484375};
fs.writeFileSync(d+'repeatfresh-triple-results.json',JSON.stringify(r,null,2)+'\n');
const md=`# 三次角标候选暂缓采用\n\n完整64组三版本、192局正常结束，0 bug。候选相对当前默认均分229.710938→229.835938，增量+0.125000、配对SE0.519552、近似95%区间[${incremental.approximate95Interval.map(x=>x.toFixed(6)).join(', ')}]。高四分位−2.484375、胜者−1.937500、最高384保持、300+席位30→28；每局最低+0.515625。均分优先，但这一微小且不确定的增益不足以支撑高分段回落，因此暂缓合入，保留实验分支，不将其说成负均分候选。\n\n公司增量：寰宇0，大战略+0.921875，作弊−0.210938。寰宇分析2.750000→2.718750，大战略3.890625→3.843750；两家公司主行动和蓝科技返还也没有共同改善。资源报表已校正收入计数牌分类，保留总资源和原输入哈希。\n\n候选3068次实际付款全部匹配，DLC20共10次（寰宇1、大战略2、作弊7），预估与实际弃牌实体10/10一致，8次资源角标到账匹配，2次移动角标共6步。普通事务只保留合并移动池的最后位置；对此修正了审计假设，并对两局增加只读执行观测的完整重放，6步实际位置/费用/移动池逐一匹配，分数、步数和完整语义决策日志均与原冻结运行一致。两次重放不计入独立样本数。\n\n当前默认相对原始版本的新64组为+4.089844（SE1.881753）；上轮完整64组为+6.703125，两轮相同策略共128组描述性合并为+5.396484（SE1.315965），不是累加历史增益。早先64组参与采用决定，因此合并结果不是完全未经选择的验证集。合并公司差：寰宇+3.312500、大战略−1.265625、作弊+9.769531，弱公司仍是主要缺口。高四分位+12.710938、最高363→384、300+席位39→61，但+10目标尚未完成。\n\n[完整随机比较](2026-09-28-repeatfresh-triple-results.md) · [收入/非收入与行动校正](2026-09-28-repeatincremental64-incomeformula-corrected.md) · [128组同策略描述性合并](2026-09-28-accepted128-results.json)。\n`;
fs.writeFileSync(d+'repeatfresh-assessment.md',md);
const summaryFile=d+'repeatfresh-triple-results.md';let summary=fs.readFileSync(summaryFile,'utf8').replace('以下结果尚待默认策略采用决定。','候选暂缓采用，默认策略保持；见[完整采用判断](2026-09-28-repeatfresh-assessment.md)。');fs.writeFileSync(summaryFile,summary);
console.log({decision:r.status,goal:r.goal});
