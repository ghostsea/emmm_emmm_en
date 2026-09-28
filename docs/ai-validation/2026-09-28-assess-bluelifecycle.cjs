const fs=require('fs'),assert=require('node:assert/strict'),d='tmp/ai-20260905/',out='docs/ai-validation/2026-09-28-',file=out+'bluelifecycle-summary.json',r=JSON.parse(fs.readFileSync(file));
assert.equal(r.pairs,24);assert.equal(r.payments.issues.length,0);assert.equal(r.baselineReplay.issues.length,0);
r.status='not-adopted-tiny-table-gain-large-high-score-regression';r.next='Company-scope ablation, Huanyu only3c34fe09; does not attribute parent Huanyu gain to its own blue income.';fs.writeFileSync(file,JSON.stringify(r,null,2)+'\n');
fs.writeFileSync(out+'bluelifecycle-assessment.md',`# 全公司蓝色循环模型：固定24组不采用

48个完整新对局，均分237.041667→237.354167，+0.312500（配对SE4.670731）。寰宇187.041667→215.208333（+28.166667），作弊277.458333→266.250000（-11.208333），大战略206.208333→201.708333（-4.500000）。高四分位分布-13.125000、赢家均值-6.791667，基线高分同席-38.875000，300+席位16→10。最低均值+16.666667、基线低分同席+32.333333，最高355→372。高分与其他公司损失不能被单一最高分或寰宇增幅遮蔽，本版不采用，也不进入随机验收。

实际资源说明不能仅靠多拿蓝资源判断：寰宇蓝1信用1.333→0.958，蓝2能量0.958不变，主行动28.292→30.167，分析2.750→3.000；作弊蓝1/蓝2增加到2.729/2.896，但主行动42.167→41.333、分析4.833→4.604，得分反而下降。共享牌和科技竞争会改变其他公司机会，寰宇+28.17不能直接归因为自身蓝色循环模型。

1175笔唯一实际支付核对全部通过，0 bug/阻塞；1974次科技选择保留全部候选（含合法只剩一项的情况），339次蓝1/蓝2取得对应完整实际回流。两臂解析器26，具名补牌校正为0；全部24局基线与先前当前策略的分数、步数及逐条行动/资源/候选完全一致。重跑必然不同的嵌套placedAt/createdAt/updatedAt仅在ISO时间戳形式时剔除，数字状态与评分保留。

下一步只缩小模型适用范围到寰宇，其他公司恢复旧评分，使用同一先验和公式，完整24组进行范围对照。这是开发集上的后续检验，不是假定公司间独立，也不把历史试验收益相加。

证据：[完整摘要](2026-09-28-bluelifecycle-summary.json)、[实际资源](2026-09-28-bluelifecycle-resource-matrix.md)、[逐次科技选择](2026-09-28-bluelifecycle-choices.json)、[24局基线逐行动等价](2026-09-28-bluelifecycle-baseline-replay.json)。
`);
for(const name of ['assess-bluelifecycle','freeze-huanyu-blue-lifecycle','queue-huanyubluelifecycle','finish-huanyubluelifecycle','finish-huanyubluelifecycle-post','audit-huanyu-blue-lifecycle-choices'])fs.copyFileSync(d+name+'.cjs',out+name+'.cjs');
for(const name of ['huanyu-blue-lifecycle-browser.json','huanyu-blue-lifecycle-page.js','huanyu-blue-lifecycle-preflight.md'])fs.copyFileSync(d+'huanyu-blue-lifecycle/docs/ai-validation/2026-09-28-'+name,out+name);
fs.appendFileSync('docs/ai-design.md','\n2026-09-28 全公司蓝色循环模型完整24组仅+0.3125（SE4.670731），寰宇+28.1667、作弊-11.2083、大战略-4.5，高四分位分布-13.125，故不采用。寰宇实际蓝1减少、蓝2不变，不把提分归因蓝色资源；冻结3c34fe09仅寰宇范围对照，完整24组进行中。1175支付、1974科技选择及24局基线逐行动等价通过。见[完整验收](ai-validation/2026-09-28-bluelifecycle-assessment.md)。\n');
