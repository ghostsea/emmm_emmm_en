# AI 候选的随机验证复现

## 结构化痕迹奖励候选

当前12组新随机清单为 [结构化痕迹随机计划](2026-09-06-structured-trace-fresh-plan.json)。基线仍为下方的 bb4156ffb14ced7c55841aa3b4bdce79b26b1b8d，候选改为 980984b47c8c2b8646a0f5e85f01283c71b8f1c8（分支 codex/ai-structured-trace-value-20260906）。两侧运行器及独立外星人控制相同，使用清单中的全部12组，不使用旧组合的8组作为新随机验证。当前开发结果 +8.28125 不是已达到目标的结论。

复现时为候选创建独立检出，逐组将下方命令的游戏种子、外星人种子、根目录和输出文件替换为新清单对应值；输出文件名称为 traceverify-base-N.json / traceverify-candidate-N.json。完整24场结束后，再用比较工具读取这份新清单。验收期间不修改候选、不筛选随机局；最高分、各公司和资源统计均与全桌均分一起保留。

## 已停止的收入与末轮转换组合

验收使用冻结后生成的8组种子，见 [清单](2026-09-06-fresh-validation-plan.json)。本文件不表示已通过验收；最终结论需要全部16场正常终局，核对配对分数、公司与资源账。

- 基线提交：`bb4156ffb14ced7c55841aa3b4bdce79b26b1b8d`。
- 候选提交：`e1a6e6f47c72ccc9ebbe38d0a15c0ab9c57817a3`，已推送分支 `codex/ai-income-terminal-validation-20260906`。
- 运行器：基线提交中的 `tools/run_ai_autobattle_browser.js` 与 `tools/ai_alien_seed.js`；SHA-256记录在清单中。
- 默认4席配置，两侧同一游戏种子、同一独立外星人种子；不固定整个游戏的随机消耗顺序。策略改变造成的抽牌或其他随机路径变化仍属于整局结果的一部分。
- 同时最多8场完整Chrome对局，每场超时1800000毫秒。耗时长本身不表示死锁；只有正常终局且无bug的完整结果可以计入均分。

在仓库根目录创建两个检出后，以下以清单中的第1组为例。输出目录需事先存在；实际验证逐组使用清单中的8个种子，不重复生成或筛选种子。

```powershell
git worktree add --detach tmp/reproduce-ai-base bb4156ffb14ced7c55841aa3b4bdce79b26b1b8d
git worktree add --detach tmp/reproduce-ai-candidate e1a6e6f47c72ccc9ebbe38d0a15c0ab9c57817a3
node tmp/reproduce-ai-base/tools/run_ai_autobattle_browser.js --single --seed codex-ai-verify-20260906:ade5b1f264282c81 --alienSeed codex-ai-verify-20260906:ade5b1f264282c81:aliens:v1 --root tmp/reproduce-ai-base --includeLogs --lightweight --timeoutMs 1800000 --out tmp/verify-base-1.json
node tmp/reproduce-ai-base/tools/run_ai_autobattle_browser.js --single --seed codex-ai-verify-20260906:ade5b1f264282c81 --alienSeed codex-ai-verify-20260906:ade5b1f264282c81:aliens:v1 --root tmp/reproduce-ai-candidate --includeLogs --lightweight --timeoutMs 1800000 --out tmp/verify-candidate-1.json
```

把清单复制到结果文件所在目录后，可用 `node tools/compare_ai_score_reports.js 清单路径 输出路径` 比较。工具按玩家ID核对公司与席位，并拒绝种子不一致、外星人控制模式不一致、未结束或带bug的对局。主指标是全部席位的平均终分差；波动按每局配对均分计算标准误，同一局4席不视为独立样本。高分四分位、胜者均分、最高分与低尾分别报告，不以某一席或某个公司增益代替全桌结果。

资源统计读取每份结果的 `result.resourceFlow`：确认所有玩家的 `balanceResiduals` 为空，并检查 `reconciliation` 中的残差与缺失基线。`productiveMainActionCount` 是已确认主行动；收入/非收入/消耗加权排除分数，保留信用、能量、宣传、数据和手牌。净流水闭合不意味着原日志不可见的同步获取与消耗已全部还原，因此不能将此检查称为完整毛流水证明。
