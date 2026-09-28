const fs=require('fs'),assert=require('node:assert/strict'),d='tmp/ai-20260905/',out='docs/ai-validation/2026-09-28-';
const r=JSON.parse(fs.readFileSync(out+'markerfresh-triple-results.json')),x=r.comparisons.markerincremental64,p=JSON.parse(fs.readFileSync(out+'current-original-pooled128.json')).report;
assert.equal(x.paidPlays.issues.length,0);assert.equal(r.exactB13Receipts.issues.length,0);assert.equal(r.uniqueNewGames,192);
r.status='not-adopted-small-uncertain-gain-and-huanyu-high-seat-regression';
r.assessment={incrementalMean:x.delta.mean,pairedSE:x.pairedGameStandardError,huanyuMean:x.companies['寰宇超动力'].meanDelta,baselineHighSameSeat:x.baselineSelectedHigh.meanDelta,reason:'64 fresh pairs give small uncertain incremental uplift, Huanyu and baseline-selected high seats regress. Keep isolated experiment; do not adopt or combine with blue lifecycle. Actual seven b13 receipts correct; correctness is not strength.'};
fs.writeFileSync(out+'markerfresh-triple-results.json',JSON.stringify(r,null,2)+'\n');
fs.writeFileSync(out+'markerfresh-triple-results.md',fs.readFileSync(out+'markerfresh-triple-results.md','utf8').replace('策略采用仍待完整判断。','本候选不采用，判断详见[完整验收](2026-09-28-markerfresh-assessment.md)。'));
fs.writeFileSync(out+'markerfresh-assessment.md',`# 标记移除候选：完整随机验证后不采用

64组192局全部正常终局，0 bug、0阻塞。候选对当前默认均分230.878906→231.269531，增量+0.390625，配对SE1.042810，近似95%区间[-1.653283,2.434533]。寰宇-1.093750、大战略+0.171875、作弊+1.242188。高四分位分布均值+1.250000，但赢家均值-0.859375、每局最低均值-0.765625；基线高分同席-6.375000、低分同席+6.984375。最高394不变，300+席位26不变。完整分布显示增益小且不稳定，弱公司与原高分席位仍有回落，因此本版不采用、不叠加到蓝科技候选。

3063笔唯一打牌支付全部匹配实际金额；b13实际打出7次，其中作弊6次、寰宇1次。逐次核对牺牲标记、最小损失选择、3分、实际1/1数据和精选实体，全部通过；没有用模型分代替实际收入。两项解析器26对照的具名补牌复核均0新增修正。未来任务损失仍为启发式，账本闭合不等于重建全部抽多张再消费的毛收入。

本批候选相对原始版本+5.023438，当前默认相对原始+4.632813。这两项不代表b13本身提高5分。另将上一批与本批全部128个独立种子的当前默认/原始结果逐局合并，检查源代码只差换行、统计解析器和缓存标签后，均分增量+1.564453（SE1.581667）；作弊+4.246094、寰宇-3.875000、大战略+1.640625。高四分位分布+4.218750、赢家均值+5.593750，每局最低均值-1.062500。仍未达到+10，后续继续优先改善寰宇和整体均分。

证据：[完整三版本结果](2026-09-28-markerfresh-triple-results.json)、[资源矩阵](2026-09-28-markerincremental64-resource-matrix.md)、[实际b13收据](2026-09-28-markerabsolute64-exact-receipts.json)、[128组直接配对](2026-09-28-current-original-pooled128.json)。128组只合并两批相同策略的原始分数，不含两个实验候选，也不叠加历史增量。
`);
for(const name of ['assess-markerfresh','audit-current-original-pooled128','audit-bluelifecycle-baseline-replay'])fs.copyFileSync(d+name+'.cjs',out+name+'.cjs');
fs.appendFileSync('docs/ai-design.md','\n2026-09-28 标记移除随机64组192局完成：当前默认增量+0.390625（SE1.042810），寰宇-1.093750、基线高分同席-6.375；3063笔支付与7次b13实际收据无异常，因小幅不确定增益和弱公司/高分回落不采用。两批相同默认策略完整128组对原始直接合并为+1.564453（SE1.581667），寰宇-3.875，未达到+10，不叠加实验收益。见[完整验收](ai-validation/2026-09-28-markerfresh-assessment.md)。\n');
console.log({status:r.status,incremental:x.delta.mean,pooled:p.delta.mean});
