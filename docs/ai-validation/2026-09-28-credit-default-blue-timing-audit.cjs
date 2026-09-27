const fs = require('fs'), assert = require('node:assert/strict');
const dir = 'tmp/ai-20260905/', prefix = 'creditabsolute64';
const suite = JSON.parse(fs.readFileSync(dir + prefix + '-suite.json')), rows = [];
for (const [index, pair] of suite.pairs.entries()) for (const arm of ['candidate']) {
  const result = JSON.parse(fs.readFileSync(dir + pair[arm])).result;
  for (const player of result.resourceFlow.players) {
    const events = result.logs.filter(e => e.playerId === player.playerId), slots = {}, acquired = {}, analysis = [];
    for (const e of events) {
      const tileId = e.details?.selected?.tileId;
      if (e.type === 'tech-placement' && /^blue[1-4]$/.test(tileId || '')) {
        const remaining = [1, 2, 3, 4].filter(slot => !slots[slot]);
        acquired[tileId] ||= { round: e.roundNumber, turn: e.turnNumber, logId: e.id, slot: null };
        // The runtime places the fourth blue tile automatically, without a
        // separate slot-choice event. All preceding slots are known here.
        if (remaining.length === 1) {
          slots[remaining[0]] = tileId;
          acquired[tileId].slot = remaining[0];
          acquired[tileId].automaticLastSlot = true;
        }
      }
      if (e.type === 'tech-placement' && e.details.blueSlot) {
        slots[e.details.blueSlot] = e.details.tileId;
        acquired[e.details.tileId] ||= { round: e.roundNumber, turn: e.turnNumber, logId: e.id, slot: e.details.blueSlot };
        acquired[e.details.tileId].slot = e.details.blueSlot;
      }
      if (e.type === 'turn-action' && e.details.action.id === 'analyze') {
        analysis.push({ logId: e.id, round: e.roundNumber, turn: e.turnNumber, resources: e.playerResources,
          ownedResourceTechs: ['blue1', 'blue2'].filter(t => acquired[t]),
          availableResourcePlacements: e.details.candidates.filter(c => c.available && c.id === 'placeData' && c.target === 'blueBonus' && ['blue1', 'blue2'].includes(slots[c.blueSlot])).map(c => ({ tileId: slots[c.blueSlot], slot: c.blueSlot, score: c.score, net: c.actionGraph?.net, gain: c.gain, cost: c.cost })),
        });
      }
    }
    const ledgerTechs = [...new Set(result.resourceFlow.events.filter(e => e.playerId === player.playerId).flatMap(e => e.techIds).filter(t => /^blue[1-4]$/.test(t)))].sort();
    assert.deepEqual(Object.keys(acquired).sort(), ledgerTechs, 'logged acquisition must match actual ledger techs');
    rows.push({ case: index + 1, arm, player: player.playerId, company: player.industryId, score: player.finalScore,
      main: player.productiveMainActionCount, analysisCount: player.analysisActionCount,
      blue1Credit: player.blue1CreditGain, blue2Energy: player.blue2EnergyGain, acquired, standardAnalysis: analysis,
      dataGained: player.grossGain.availableData, dataSpent: player.spent.availableData,
    });
  }
}
const mean = a => a.length ? a.reduce((s, v) => s + v, 0) / a.length : null;
const summary = {};
for (const arm of ['candidate']) for (const company of [...new Set(rows.map(r => r.company))]) {
  const r = rows.filter(x => x.arm === arm && x.company === company), analysis = r.flatMap(x => x.standardAnalysis);
  summary[arm + ':' + company] = { seats: r.length, meanScore: mean(r.map(x => x.score)), main: mean(r.map(x => x.main)),
    analyze: mean(r.map(x => x.analysisCount)), meanDataGained: mean(r.map(x => x.dataGained)),
    blue: Object.fromEntries(['blue1', 'blue2'].map(t => {
      const owners = r.filter(x => x.acquired[t]), reward = t === 'blue1' ? 'blue1Credit' : 'blue2Energy';
      return [t, { owners: owners.length, firstRoundOwners: owners.filter(x => x.acquired[t].round === 1).length,
        meanAcquisitionRound: mean(owners.map(x => x.acquired[t].round)), meanSlot: mean(owners.map(x => x.acquired[t].slot)),
        meanRewardAllSeats: mean(r.map(x => x[reward])), meanRewardOwners: mean(owners.map(x => x[reward])),
        standardAnalysesAfterAcquisition: analysis.filter(x => x.ownedResourceTechs.includes(t)).length,
      }];
    })),
    standardAnalyses: analysis.length,
    analysesWithAvailableResourcePlacement: analysis.filter(x => x.availableResourcePlacements.length).length,
    analysesWithNoPoolData: analysis.filter(x => x.resources.availableData === 0).length,
  };
}
assert.equal(rows.length, suite.pairs.length * 4);
fs.writeFileSync(dir + prefix + '-blue-timing.json', JSON.stringify({ scope: 'Full current accepted credit8f64 candidate games. Acquisition comes from blue-tech selection and placement logs, reconciled against actual ledger tech IDs; the last remaining board slot auto-places and is inferred from the three preceding placements. Bonus type follows tile identity, not board slot. Resource receipts use the existing structured ledger. Only standard analyze decisions are inspected for currently available blue resource placement; card/effect analyses are excluded. A skipped available placement is an opportunity for investigation, not proof that pre-filling is optimal; spending data has displacement costs.', summary, rows }, null, 2) + '\n');
console.log(JSON.stringify(summary, null, 2));
