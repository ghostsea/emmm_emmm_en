const fs=require('fs'),assert=require('node:assert/strict'),d='tmp/ai-20260905/',out='docs/ai-validation/2026-09-28-';
const r=JSON.parse(fs.readFileSync(out+'cyclefresh-triple-results.json')),x=r.comparisons.cycleincremental64;
assert.equal(r.uniqueNewGames,192);assert.equal(x.paidPlays.issues.length,0);assert(x.delta.mean<0);
const corrections={};
for(const p of ['cycleabsolute64','cycleincremental64','huanyubluelifecycle']){const v=JSON.parse(fs.readFileSync(d+p+'-embedded-placement-corrected.json'));assert.equal(v.summary.issues.length,0);corrections[p]=v;fs.copyFileSync(d+p+'-embedded-placement-corrected.json',out+p+'-embedded-placement-corrected.json');}
const corrected=corrections.cycleincremental64.groups,h0=corrected.baseline.companies['寰宇超动力'],h1=corrected.candidate.companies['寰宇超动力'];
r.status='not-adopted-fresh-mean-and-weak-company-regression';
r.assessment={incrementalMean:x.delta.mean,pairedSE:x.pairedGameStandardError,reason:'All64 fresh triples complete: mean declines, Huanyu and Grand Strategy decline, per-game minimum declines. Higher top-quartile mean does not satisfy mean-first objective. Do not adopt or combine with self-income candidate.',correctedHuanyu:{baseline:h0,candidate:h1},resourceCorrectionFiles:Object.keys(corrections).map(p=>'2026-09-28-'+p+'-embedded-placement-corrected.json')};
fs.writeFileSync(out+'cyclefresh-triple-results.json',JSON.stringify(r,null,2)+'\n');
fs.writeFileSync(out+'cyclefresh-triple-results.md',fs.readFileSync(out+'cyclefresh-triple-results.md','utf8').replace('策略采用待完整判断。','候选不采用，完整判断与资源修正见[验收说明](2026-09-28-cyclefresh-assessment.md)。'));
const f=x=>x.toFixed(6);
fs.writeFileSync(out+'cyclefresh-assessment.md',`# 寰宇蓝科技循环：完整随机验证后不采用

完整64组、三个冻结版本、192局正常结束，0 bug、0阻塞。候选相对当前默认均分${f(x.baseline.mean)}→${f(x.candidate.mean)}，增量${f(x.delta.mean)}，配对SE${f(x.pairedGameStandardError)}。寰宇${f(x.companies['寰宇超动力'].meanDelta)}、大战略${f(x.companies['宇宙大战略集团'].meanDelta)}、作弊${f(x.companies['作弊实验室'].meanDelta)}。高四分位分布${f(x.delta.topQuartileMean)}、赢家均值${f(x.delta.winnerMean)}，但每局最低均值${f(x.delta.minimumPerGameMean)}；基线高分同席${f(x.baselineSelectedHigh.meanDelta)}、低分同席${f(x.baselineSelectedLow.meanDelta)}。最高${x.baseline.max}→${x.candidate.max}，300+席位${x.baseline.seats300Plus}→${x.candidate.seats300Plus}。按均分第一优先级不采用，不叠加到独立本卡收入候选。

当前/候选两臂${x.paidPlays.uniquePayments}笔唯一实际付款均匹配；${x.choiceCount}次科技选择及${x.blueAcquisitions}次蓝1/2取得完整保留。两项比较的具名补牌复核均无新增修正。开发阶段已先完成全部三种公司范围再冻结寰宇范围，本轮没有换种子、筛公司或提前停止。

修正嵌套放置的重复统计后，寰宇蓝1信用${f(h0.blue1)}→${f(h1.blue1)}，蓝2能量${f(h0.blue2)}→${f(h1.blue2)}；主行动${f(h0.mainActions)}→${f(h1.mainActions)}、分析${f(h0.analysis)}→${f(h1.analysis)}、新获得牌实际打出${f(h0.newCardsPlayed)}→${f(h1.newCardsPlayed)}。信用收入${f(h0.resources.incomeGain.credits)}→${f(h1.resources.incomeGain.credits)}、能量收入${f(h0.resources.incomeGain.energy)}→${f(h1.resources.incomeGain.energy)}。更多蓝1信用未转成更多整局行动；不能把局部循环预测的价值当作终局增量。

本轮统计发现满池奖励内的放置描述与实际收据重复，解析器27在隔离分支修复；原始冻结文件保持。原始/候选128输入有${corrections.cycleabsolute64.summary.changes}处嵌套记录修正，当前/候选128输入有${corrections.cycleincremental64.summary.changes}处，两项共享候选，不能相加为独立局数。信用/能量等重复量仅在同事务唯一充分快照补偿时重归因；分数不参与资源快照补偿，明确重复分数单独去重，真实终局计分保持。修正后的完整公司资源与毛收支见[当前增量补充审计](2026-09-28-cycleincremental64-embedded-placement-corrected.json)。旧资源矩阵和choices里的实际蓝奖励为解析器26原记录，以补充审计为准。

候选相对原始版本${f(r.comparisons.cycleabsolute64.delta.mean)}，当前默认相对原始${f(r.currentVsOriginal.delta.mean)}，均来自本轮直接配对。+10目标仍未完成，不能加上固定组收益或历史其他候选的增量。证据：[完整三版本](2026-09-28-cyclefresh-triple-results.json)、[原始增量补充审计](2026-09-28-cycleabsolute64-embedded-placement-corrected.json)。
`);
fs.copyFileSync(d+'assess-cyclefresh.cjs',out+'assess-cyclefresh.cjs');
fs.copyFileSync(d+'audit-embedded-placement-suite.cjs',out+'audit-embedded-placement-suite.cjs');
fs.appendFileSync('docs/ai-design.md','\n2026-09-28 寰宇蓝色循环3c34全新64组三臂192局完成：相对当前默认均分−1.855469（SE1.630455），寰宇−1.1875、大战略−5.984375、作弊−0.125；高四分位+2.90625但每局最低−4.421875，按均分第一不采用。3039笔当前/候选付款通过；独立补充修正嵌套放置重复资源，修正后寰宇蓝1信用0.90625→1.21875、蓝2能量1→0.859375，主行动29.5625→28.875、分析2.859375→2.734375。原始/候选和当前/候选都保留完整64组，不将局部资源增加视作提分，+10未完成。见[完整验收](ai-validation/2026-09-28-cyclefresh-assessment.md)。\n');
console.log({status:r.status,mean:x.delta.mean,correctedBlue1:[h0.blue1,h1.blue1],main:[h0.mainActions,h1.mainActions]});
