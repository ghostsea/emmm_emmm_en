const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const d = 'tmp/ai-20260905/';
const out = 'docs/ai-validation/2026-09-28-';
const read = name => JSON.parse(fs.readFileSync(d + name + '.json'));
const prefixes = ['scanprojectionabsolute64', 'scanprojectionincremental64'];
const q = read('scanprojectionfresh-triple-queue-complete');
assert.equal(q.completed.length, 192);
assert.equal(q.failures.length, 0);
assert.equal(q.pending.length, 0);
assert.equal(new Set(q.completed.map(x => `${x.prefix}:${x.model}:${x.n}`)).size, 192);
assert.equal(read('scanprojectionfresh-extra-complete').issues.length, 0);
const suites = prefixes.map(p => read(p + '-suite'));
const compactRun = run => ({options: run.options, summary: run.summary, result: {playerResults: run.result.playerResults}});
const pairs = suites[0].pairs.map((a, i) => {
  const b = suites[1].pairs[i];
  assert.equal(a.seed, b.seed);
  assert.equal(a.alienSeed, b.alienSeed);
  assert.equal(a.candidate, b.candidate);
  return {seed: a.seed, baseline: compactRun(read(a.baseline.replace(/\.json$/, ''))), candidate: compactRun(read(b.baseline.replace(/\.json$/, '')))};
});
assert.equal(pairs.length, 64);
const currentReport = require(path.resolve('tools/compare_ai_score_reports.js')).comparePairs(pairs);
const current = {scope: 'All64 fresh independent triples, direct current011 versus original f542, both parser28. No historical mean addition.', report: currentReport};
fs.writeFileSync(d + 'scanprojectionfresh-current-vs-original.json', JSON.stringify(current, null, 2) + '\n');
const compact = r => ({baseline: r.baseline, candidate: r.candidate, delta: r.delta, companies: r.companies,
  pairedGameStandardError: r.pairedGameMeanDeltaStandardError,
  approximate95Interval: [r.delta.mean - 1.96*r.pairedGameMeanDeltaStandardError, r.delta.mean + 1.96*r.pairedGameMeanDeltaStandardError],
  gamesImproved: r.gamesImproved, gamesRegressed: r.gamesRegressed});
const comparisons = {};
for (const p of prefixes) {
  const r = read(p + '-complete').report;
  assert.equal(r.baseline.games, 64);
  assert.equal(r.candidate.games, 64);
  const accounting = read(p + '-accounting-audit');
  const runtime = read(p + '-runtime-audit');
  const payment = read(p + '-payment-amounts');
  const scans = read(p + '-scan-audit');
  const followup = read(p + '-followup');
  const configuration = read(p + '-configuration-audit');
  for (const issues of [accounting.issues, runtime.summary.issues, payment.summary.issues, scans.summary.issues, followup.summary.issues]) assert.equal(issues.length, 0);
  assert.equal(configuration.games, 128);
  assert.equal(accounting.seats, 512);
  assert.equal(payment.summary.plays, payment.summary.uniquePayments);
  assert.equal(payment.summary.plays, payment.summary.matchingAmounts);
  comparisons[p] = {...compact(r), paidPlays: payment.summary, scanSummary: scans.summary, projectionFollowup: followup.summary,
    baselineSelectedHigh: read(p + '-paired-cohorts').baselineHighQuartile,
    baselineSelectedLow: read(p + '-paired-cohorts').baselineLowQuartile};
  for (const suffix of ['complete','accounting-audit','runtime-audit','configuration-audit','paired-cohorts','aid-audit','payment-amounts','resource-matrix','queue-complete','scan-audit','followup'])
    fs.copyFileSync(d + p + '-' + suffix + '.json', out + p + '-' + suffix + '.json');
  fs.copyFileSync(d + p + '-resource-matrix.md', out + p + '-resource-matrix.md');
}
assert.deepEqual(comparisons[prefixes[0]].projectionFollowup, comparisons[prefixes[1]].projectionFollowup);
assert.deepEqual(comparisons[prefixes[0]].paidPlays, comparisons[prefixes[1]].paidPlays);
for (const name of ['scanprojectionfresh-current-vs-original','scanprojectionfresh-triple-queue-complete','scanprojectionfresh-extra-complete'])
  fs.copyFileSync(d + name + '.json', out + name + '.json');
for (const name of ['archive-scanprojectionfresh','finish-scanprojectionfresh-extra','audit-scanyield-scans','audit-scanprojection-followup'])
  fs.copyFileSync(d + name + '.cjs', out + name + '.cjs');
const result = {status: 'full-validation-complete-pending-policy-review', uniqueNewGames: 192, pairs: 64, comparisons,
  currentVsOriginal: compact(currentReport),
  limitations: [
    '64 new independent game/alien seed triples; original, current011 and projection90e370b6 all use parser28. Two comparisons share the same candidate arm:192 games, not256.',
    'All cases retained. Source/harness frozen before seed generation. No policy changes, seed deletion, optional stopping or posthoc company-scope tuning during validation.',
    'Reported SE treats each full game as the independent unit, not its four competing seats. Company differences can reflect shared-board effects.',
    'Projection reserves unfilled owned blue slots and real scan/analysis energy. Original repeated-scan penalty and existing five-core-data heuristic remain unchanged.',
    'Selected scan payment and actual data receipts are audited. Unselected positive observations are not executed outcomes. Next-action analysis and same-entry blue returns are temporal associations, not causal attribution.',
    'Candidate card payments and projection followups occur in both reports but are the same unique games; count them once.',
    '+10/+20 must be evaluated directly versus original, without adding historical or fixed-development increments. Policy adoption requires review of complete mean and high-score results.'
  ]};
fs.writeFileSync(out + 'scanprojectionfresh-triple-results.json', JSON.stringify(result, null, 2) + '\n');
const fmt = v => typeof v === 'number' ? v.toFixed(6) : v;
let md = '# 扫描补齐分析预判：完整随机验证\n\n64 组全新独立游戏/外星人种子、三个冻结版本、192 局。两项比较共用候选，全部完成后才生成本报告；策略采用待完整判断。\n\n|比较|基线均分|比较版均分|差值|配对 SE|高四分位分布差|每局最低差|\n|---|---:|---:|---:|---:|---:|---:|\n';
for (const [name, r] of [...Object.entries(comparisons), ['当前默认对原始', result.currentVsOriginal]])
  md += '|' + [name,r.baseline.mean,r.candidate.mean,r.delta.mean,r.pairedGameStandardError,r.delta.topQuartileMean,r.delta.minimumPerGameMean].map(fmt).join('|') + '|\n';
for (const [p,r] of Object.entries(comparisons)) {
  md += '\n## '+p+'\n\n|公司|基线|候选|差值|\n|---|---:|---:|---:|\n';
  for(const [company,x] of Object.entries(r.companies)) md += '|'+[company,x.baseline,x.candidate,x.meanDelta].map(fmt).join('|')+'|\n';
  md += `\n最高分 ${r.baseline.max}→${r.candidate.max}；300+ 席位 ${r.baseline.seats300Plus}→${r.candidate.seats300Plus}；基线高四分位同席差 ${fmt(r.baselineSelectedHigh.meanDelta)}，低四分位同席差 ${fmt(r.baselineSelectedLow.meanDelta)}。\n`;
  const f = r.projectionFollowup;
  md += `\n正向预判 ${f.positiveObservations} 次观察，实际采用 ${f.selectedScans} 次扫描，全部付款与实际数据核验通过；下一次同轮主行动决策可分析 ${f.nextSameRoundAnalyzeAvailable} 次，实际选择分析 ${f.nextSameRoundAnalysis} 次。两份报告共用这些候选执行，不能重复相加。\n`;
}
md += '\n三臂均为解析器28；原始和当前策略的解析器迁移有完整重放证明。公司回合补给、收入、非收入和蓝科技资源分别见资源矩阵；蓝色资源包含于非收入，不再另加到资源总量。账本闭合不代表识别了所有未逐步记录的毛抽牌。上述时序统计不能解释全部终分因果变化。\n';
fs.writeFileSync(out + 'scanprojectionfresh-triple-results.md', md);
console.log(JSON.stringify({status: result.status, comparisons: Object.fromEntries(Object.entries(comparisons).map(([p,r]) => [p,{delta:r.delta,se:r.pairedGameStandardError,companies:r.companies,followup:r.projectionFollowup}])),currentVsOriginal:result.currentVsOriginal},null,2));
