const fs=require('fs'),assert=require('node:assert/strict'),d='tmp/ai-20260905/',out='docs/ai-validation/2026-09-28-';
const smoke=JSON.parse(fs.readFileSync(d+'huanyu-self-income-browser.json'));assert(!smoke.exceptionDetails);assert.equal(smoke.result.value.rows.length,6);assert(smoke.result.value.rows.every(x=>x.randomCalls===0));
const s=JSON.parse(fs.readFileSync(d+'huanyuselfincome-suite.json'));assert.equal(s.pairs.length,24);assert.equal(s.models.candidate.commit,'14db6a409d626cce8fbc6077a5ec8427cd15fbac');
for(const name of ['prepare-huanyu-self-income','freeze-huanyu-self-income','queue-after-cyclefresh','audit-self-income-receipts','finish-huanyuselfincome-post','archive-huanyu-self-income-plan','diagnose-current-income-opportunities','archive-cyclefresh','watch-archive-cyclefresh'])fs.copyFileSync(d+name+'.cjs',out+name+'.cjs');
fs.copyFileSync(d+'huanyu-self-income/docs/ai-validation/2026-09-28-huanyu-self-income-model.md',out+'huanyu-self-income-model.md');
const md=`# 当前收入牌可打机会：固定24组诊断

使用全部24组当前默认、解析器26的基线日志，不读取正在运行的新随机结果。按局、公司席位、实体牌去重，只筛可打候选中效果名含income的牌。这并不是全部“能提高收入的牌”：打牌引发登陆、任务等也可能提高收入，且部分income名称效果只按收入图标给即时资源。

|公司|席位|曾可打实体牌|实际打出|曾正估值但未打|终局仍在手|
|---|---:|---:|---:|---:|---:|
|寰宇|24|15|0|10|1|
|大战略|24|15|2|8|0|
|作弊|48|32|8|14|0|

寰宇15张中，11张为b42/b47/b79的“将本卡放入收入区”，另4张为私营部门投资。此前收益模型没有显式处理本卡入收入区，落入通用card_效果2分；运行时则按本牌收入类型，直接增加收入轨并立即给资源，无需额外弃一张牌。独立候选只补寰宇这三个效果，其余费用、卡牌替代用途和公司模型保持原有计算。候选不是依据10个正值强行打牌：原模型的正值也可能低于另一个合法行动，JSON保留所有观察和所选行动。详见[模型及运行验证](2026-09-28-huanyu-self-income-model.md)。

同时核对收入来源，寰宇77次数据放置收入中有19次发生在打牌回合的独立quick步骤，解析器sourceCategory为card，但isDataPlacement为true；它们不属于打牌主事务的直接收入。报告保留原来源和独立数据放置标志，不能把19次加到打牌收入次数上。此前两名高分玩家的打牌收入提升分别来自毅力号火星车/生活常态/蜻蜓号与私营部门投资，不能据此声称玩家靠上述三张本卡入收入牌取胜。

当前诊断识别的是具体估值缺项，尚未证明提高均分；未知移牌用途保持unknown_removal，不按最后行动猜测。所有源哈希、实体牌去向、逐次估值、实际收入轨事件见[完整JSON](2026-09-28-current-income-opportunities.json)。
`;
fs.writeFileSync(out+'current-income-opportunities.md',md);
fs.appendFileSync('docs/ai-design.md','\n2026-09-28 当前固定24组收入机会诊断：寰宇15张含income效果的可打实体牌均未打出，其中11张b42/b47/b79本卡入收入区被通用2分估值遗漏；不把正估值等同应优先打出。独立候选14db6a40仅补寰宇本卡收入的即时与各轮资源价值、保留费用/替代用途，54测试和6个浏览器真实付款收入场景通过；固定24组已冻结，将在蓝科技192局队列释放后运行，不与蓝科技组合、不读取其部分分数。原收入来源card中的19次寰宇事件实际为独立quick数据放置，按isDataPlacement另列。见[收入机会](ai-validation/2026-09-28-current-income-opportunities.md)、[冻结计划](ai-validation/2026-09-28-huanyu-self-income-development-plan.json)。\n');
console.log({candidate:s.models.candidate.commit,rows:smoke.result.value.rows.length,status:'frozen-awaiting-four-game-worker-release'});
