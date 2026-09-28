const fs=require('fs'),assert=require('node:assert/strict');
const d='tmp/ai-20260905/',o='docs/ai-validation/2026-09-28-',p='phasedrawcurrent';
const read=n=>JSON.parse(fs.readFileSync(d+n+'.json'));
const q=read(p+'-queue-complete');assert.equal(q.completed.length,24);assert.equal(q.failures.length,0);assert.equal(q.pending.length,0);
for(const suffix of ['accounting-audit','runtime-audit','payment-amounts']){const r=read(p+'-'+suffix);assert.equal((r.summary||r).issues.length,0);}
const r=read(p+'-complete'),s=read(p+'-suite'),cohorts=read(p+'-paired-cohorts');
const result={decision:'reject-current-phase-draw-candidate',candidate:s.models.candidate.commit,baseline:s.models.base.commit,report:r.report,cohorts,
 rationale:'Full24 fixed mean and all three company means declined. A higher single maximum does not offset lower mean and high-quartile outcomes. No fresh validation or default adoption.',
 proof:{pairs:24,newCandidateGames:24,reusedHashVerifiedBaselineGames:24,nodeTestFiles:54,browserPairs:4,actualPayments:read(p+'-payment-amounts').summary.uniquePayments},
 limitations:['Previously seen development seeds, not a fresh population strength estimate.','Candidate does not contain the separately adopted zero-resource correction.','Initial blind-draw browser fixture lacked fixed RNG; final rerun pins the game RNG and verifies hand identities and random snapshots.'],goal:{achieved:false,target:10}};
fs.writeFileSync(o+p+'-assessment.json',JSON.stringify(result,null,2)+'\n');
for(const suffix of ['complete','accounting-audit','runtime-audit','configuration-audit','paired-cohorts','aid-audit','payment-amounts','resource-matrix','queue-complete'])fs.copyFileSync(d+p+'-'+suffix+'.json',o+p+'-'+suffix+'.json');
fs.copyFileSync(d+p+'-resource-matrix.md',o+p+'-resource-matrix.md');
fs.writeFileSync(o+p+'-assessment.md',`# 当前阶段补牌估值：不采用\n\n完整24组，均分237.041667→232.833333，差−4.208333，按局配对SE ${r.report.pairedGameMeanDeltaStandardError}。寰宇−0.958333、大战略−6.500000、作弊−4.687500；高四分位−7.041667，原基线高四分位同席−18.416667，300+席位16→13。最高分355→369不能抵消整体下降。\n\n寰宇主行动28.292→28.333、分析2.750→2.875；大战略主行动33.500→33.667、分析3.958→4.000。少量增加补牌、用牌和行动并未改善分数，不把这些代理指标当作优化成功。收入、非收入、消耗和终存详见资源矩阵。\n\n54测试、4组真实付费浏览器对照、1179次唯一支付及资源/配置/公司补助核对通过。首次盲抽测试未固定随机源，不能据此声称牌序相同；固定游戏随机源后重跑两版，实际牌实体、随机状态、费用与资源全部一致。\n\n仅已见固定种子开发结果，不作随机总体推断。保留实验分支，不合入默认、不开展该候选的新随机验证，不沿用旧版本固定正值；零到账修正与该候选独立。+10目标仍未完成。\n`);
console.log({decision:result.decision,SE:r.report.pairedGameMeanDeltaStandardError,proof:result.proof});
