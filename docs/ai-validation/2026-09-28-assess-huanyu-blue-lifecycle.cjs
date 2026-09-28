const fs=require('fs'),assert=require('node:assert/strict'),d='tmp/ai-20260905/',out='docs/ai-validation/2026-09-28-',file=out+'huanyubluelifecycle-summary.json',r=JSON.parse(fs.readFileSync(file));
assert.equal(r.pairs,24);assert.equal(r.payments.issues.length,0);r.status='fixed-positive-pending-third-scope-comparison-and-fresh-validation';fs.writeFileSync(file,JSON.stringify(r,null,2)+'\n');
fs.writeFileSync(out+'huanyubluelifecycle-assessment.md',`# 仅寰宇蓝色循环模型：固定改善，尚未采用

完整24组相对同版本基线均分+2.729167（SE3.803749）；寰宇+12.833333、作弊-1.291667、大战略+0.666667。高四分位分布+0.958333、赢家+3.708333、每局最低均值+7.041667；最高355→345，300+席位16→17。基线高分同席-28.666667、低分同席+28.666667，全分布和同席口径都保留，不用单席收益代替总体。

寰宇实际蓝1信用1.333→2.042，蓝2能量0.958→0.875，分析2.750→3.208、主行动28.292→29.750，新取得牌打出8.083→8.417。信用收入15.333→15.458、非收入3.875→5.125；能量收入11.583→12.042、非收入10.333→10.750，非收入数据23.583→26.458。存在资源转为行动的实证变化，但具体因果链仍受共享牌、科技及随机轨迹影响。

24个新候选局与24个已核对的解析器26基线局全部正常终局，0 bug/阻塞。1166笔唯一支付、1995次科技选择、341次蓝1/蓝2取得与实际回流核对通过，具名补牌校正0。全部基线输入哈希复核，无选局。

本版不直接合入默认。第三个固定范围对照已冻结：寰宇与大战略使用同一循环模型，作弊保持原模型，先验与价格公式不变；完整固定结果选择范围后再生成独立随机种子验证。固定数据上+2.73不是总体已达+10，也不与已有策略的+1.56相加。

证据：[摘要](2026-09-28-huanyubluelifecycle-summary.json)、[实际资源](2026-09-28-huanyubluelifecycle-resource-matrix.md)、[两公司冻结计划](2026-09-28-weak-company-blue-lifecycle-development-plan.json)。
`);
for(const name of ['assess-huanyu-blue-lifecycle','freeze-weak-company-blue-lifecycle','queue-weakbluelifecycle','finish-weakbluelifecycle','finish-weakbluelifecycle-post','audit-weak-company-blue-lifecycle-choices'])fs.copyFileSync(d+name+'.cjs',out+name+'.cjs');
for(const name of ['weak-company-blue-lifecycle-browser.json','weak-company-blue-lifecycle-page.js','weak-company-blue-lifecycle-preflight.md'])fs.copyFileSync(d+'weak-company-blue-lifecycle/docs/ai-validation/2026-09-28-'+name,out+name);
fs.copyFileSync(d+'weak-company-blue-lifecycle/docs/ai-validation/2026-09-28-huanyu-scope-reference.json',out+'huanyu-scope-reference.json');
fs.appendFileSync('docs/ai-design.md','\n2026-09-28 仅寰宇循环模型3c34fe09完整24组+2.729167（SE3.803749），寰宇+12.833333，高四分位分布+0.958333但最高355→345、基线高分同席-28.666667；实际蓝1/分析/主行动增加，1166支付无异常，尚不采用。冻结a4f8ada8第三个范围对照，仅寰宇与大战略适用，固定24组完成后选范围再做新随机验证，不叠加历史增益。见[寰宇范围验收](ai-validation/2026-09-28-huanyubluelifecycle-assessment.md)。\n');
