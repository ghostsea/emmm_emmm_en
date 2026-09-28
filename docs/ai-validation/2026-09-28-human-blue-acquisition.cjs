const fs = require('node:fs'), crypto = require('node:crypto'), assert = require('node:assert/strict');
const dir = 'tmp/ai-20260905/';
const human = JSON.parse(fs.readFileSync(dir + 'human-movement-impact.json'));
const suite = JSON.parse(fs.readFileSync(dir + 'probecurrent-suite.json'));
const rows = [];
function add(model, game, player, events, sourceFile = null) {
  const first = {};
  for (const event of events.filter(e => e.playerId === player.playerId)) {
    for (const id of event.techIds || []) {
      if (/^blue[1-4]$/.test(id) && !first[id]) first[id] = {
        round: event.roundNumber, turn: event.turnNumber, entry: event.entryId,
        contextText: event.sourceDetail
      };
    }
  }
  rows.push({ model, game, sourceFile, player: player.playerId, company: player.industryId,
    score: player.finalScore, blue1: player.blue1CreditGain,
    blue2: player.blue2EnergyGain, analyses: player.analysisActionCount,
    cycles: player.fullDataCycleCount, first });
}
for (const game of human.games) {
  for (const player of human.humanSummary.players.filter(p => p.gameId === game.gameId)) {
    add('human', game.gameId, player, game.events, game.fileName);
  }
}
for (const pair of suite.pairs) {
  const run = JSON.parse(fs.readFileSync(dir + pair.baseline));
  assert(run.summary.ok && run.summary.gameEnded && !run.summary.bugCount);
  assert.equal(run.options.seed, pair.seed);
  for (const player of run.result.resourceFlow.players) {
    add('current-default-fixed24', pair.seed, player, run.result.resourceFlow.events);
  }
}
assert.equal(rows.filter(r => r.model !== 'human').length, 96);
const avg = values => values.length ? values.reduce((a,b) => a+b,0) / values.length : null;
const groups = {};
for (const row of rows) (groups[row.model + '/' + row.company] ||= []).push(row);
const summary = Object.fromEntries(Object.entries(groups).map(([key, group]) => [key, {
  seats: group.length, blue1: avg(group.map(r => r.blue1)), blue2: avg(group.map(r => r.blue2)),
  analyses: avg(group.map(r => r.analyses)),
  tech: Object.fromEntries(['blue1','blue2'].map(id => {
    const owners = group.filter(r => r.first[id]);
    return [id, { owners: owners.length, byRound2: owners.filter(r => r.first[id].round <= 2).length,
      meanFirstLoggedRound: avg(owners.map(r => r.first[id].round)) }];
  }))
}]));
assert.equal(rows.filter(r => r.model === 'human').length, 17);
const newPlayers = rows.filter(r => r.model === 'human' && /20260909-231236|20260919-223731/.test(r.sourceFile));
assert.equal(newPlayers.length, 2);
for (const player of newPlayers) {
  let header = null;
  const direct = {};
  const raw = fs.readFileSync(player.sourceFile, 'utf8');
  player.sourceSha256 = crypto.createHash('sha256').update(raw).digest('hex');
  const lines = raw.split(/\r?\n/);
  for (const [index, text] of lines.entries()) {
    if (text.startsWith('### #')) header = text.match(/^### #(\d+) 第(\d+)轮 第(\d+)回合 - 白色 - /);
    const tech = text.match(/获得科技片：\s*(blue[1-4])/);
    if (header && tech && !direct[tech[1]]) direct[tech[1]] = {
      entry: Number(header[1]), round: Number(header[2]), turn: Number(header[3]),
      line: index + 1, text
    };
  }
  assert.deepEqual(Object.keys(direct).sort(), Object.keys(player.first).sort());
  for (const [id, proof] of Object.entries(direct)) {
    for (const key of ['entry','round','turn']) assert.equal(player.first[id][key], proof[key]);
    player.first[id].directAcquisition = proof;
  }
}
const result = {
  scope: 'First logged blue-tech acquisition with source text, deduplicated per seat. All current human logs and complete current-default fixed24; no in-progress fresh scores read.',
  baselineCommit: suite.models.base.commit,
  humanReportSha256: crypto.createHash('sha256').update(fs.readFileSync(dir+'human-movement-impact.json')).digest('hex'),
  limitations: ['Human and AI companies, rules versions and seeds differ; descriptive comparison only.',
    'Missing historical starting tech or rewards remain unknown, not zero. First logged appearance is not proof of optimal acquisition time.',
    'AI fixed24 uses parser22 and human parser23. The movement-publicity correction does not affect tech identity or blue credit/energy receipts.'],
  newPlayers, summary, rows
};
fs.writeFileSync('docs/ai-validation/2026-09-28-human-blue-acquisition.json', JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({newPlayers, currentDefault: Object.fromEntries(Object.entries(summary).filter(([k]) => k.startsWith('current-default')))},null,2));
