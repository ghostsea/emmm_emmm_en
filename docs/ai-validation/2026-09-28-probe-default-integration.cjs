const fs = require('node:fs'), path = require('node:path'), cp = require('node:child_process');
const assert = require('node:assert/strict'), crypto = require('node:crypto');
const dir = 'tmp/ai-20260905/';
const suite = JSON.parse(fs.readFileSync(dir + 'probeabsolute64-suite.json'));
const frozen = suite.models.candidate;
const normalize = text => text.replace(/\r\n/g, '\n');
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const source = [];
for (const [file, expected] of Object.entries(frozen.hashes)) {
  const other = dir + frozen.root + '/' + file;
  assert.equal(hash(other), expected, 'frozen file changed: ' + file);
  let currentText = normalize(fs.readFileSync(file,'utf8'));
  let frozenText = normalize(fs.readFileSync(other,'utf8'));
  if (file === 'randomizer/index.html') {
    const cache = /(\.\/app\/ai-controller\.js\?v=)[^"]+/g;
    currentText = currentText.replace(cache, '$1CACHE');
    frozenText = frozenText.replace(cache, '$1CACHE');
  }
  assert.equal(currentText, frozenText, 'main differs from tested candidate: ' + file);
  source.push({ file, mainSha256: hash(file), frozenSha256: expected });
}
const browser = {};
for (const name of ['probe-scan-smoke','probe-move-scan-smoke','probe-scan-exhaustion','probe-owner-smoke']) {
  const file = 'docs/ai-validation/2026-09-28-probe-default-' + name + '.json';
  const result = JSON.parse(fs.readFileSync(file));
  assert(!result.exceptionDetails, name + ' browser exception');
  assert(Array.isArray(result.result?.value) && result.result.value.length > 0);
  for (const row of result.result.value) {
    assert.equal(row.bugs.length, 0);
    if (row.expectedData != null) assert.equal(row.actualData, row.expectedData);
    if (row.candidate) assert(row.candidate.available);
  }
  browser[name] = { cases: result.result.value.length, sha256: hash(file) };
}
const pair = suite.pairs[1], output = dir + 'probe-default-main-replay.json';
assert(!fs.existsSync(output), 'replay output already exists');
cp.execFileSync(process.execPath, ['tools/run_ai_autobattle_browser.js','--single','--seed',pair.seed,
  '--alienSeed',pair.alienSeed,'--root',path.resolve('.'),'--includeLogs','--lightweight',
  '--timeoutMs','1800000','--out',output], { stdio: 'ignore', windowsHide: true });
const main = JSON.parse(fs.readFileSync(output));
const prior = JSON.parse(fs.readFileSync(dir + pair.candidate));
assert(main.summary.ok && main.summary.gameEnded && !main.summary.blocked && main.summary.bugCount === 0);
assert.equal(main.summary.steps, prior.summary.steps);
assert.deepEqual(main.result.playerResults, prior.result.playerResults);
const semantic = logs => JSON.parse(JSON.stringify(logs, (key,value) => ['createdAt','placedAt'].includes(key) ? undefined : value));
assert.deepEqual(semantic(main.result.logs), semantic(prior.result.logs));
const report = { frozenCandidate: frozen.commit, source, browser,
  replay: { seed: pair.seed, alienSeed: pair.alienSeed, steps: main.summary.steps,
    scores: main.summary.playerScores, semanticLogs: main.result.logs.length,
    bugs: main.summary.bugCount, sourceFile: output, sourceSha256: hash(output) },
  scope: 'All frozen model source files match after line-ending normalization and AI-controller cache tag only. Four real-browser scenarios and complete case2 replay agree; semantic log comparison excludes createdAt/placedAt timestamps only.' };
fs.writeFileSync('docs/ai-validation/2026-09-28-probe-default-integration.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({matchedSourceFiles:source.length,browser,replay:report.replay},null,2));
