const fs=require('fs'),assert=require('node:assert/strict'),crypto=require('crypto'),d='tmp/ai-20260905/',proof={cases:[],rows:[],issues:[]};
const stable=x=>Array.isArray(x)?x.map(stable):x&&typeof x==='object'?Object.fromEntries(Object.entries(x).filter(([k])=>!['createdAt','updatedAt','placedAt'].includes(k)).map(([k,v])=>[k,stable(v)])):x;
for(const n of [1,23]){
 const base=JSON.parse(fs.readFileSync(d+`tradeledger28v2-candidate-${n}.json`)),x=JSON.parse(fs.readFileSync(d+`scan-readiness-diagnosis-${n}.json`)).result.value,r=x.result;
 assert(!r.bugs.length);assert.equal(r.logs.length,base.result.logs.length);assert.equal(JSON.stringify(r.playerResults),JSON.stringify(base.result.playerResults));
 for(let i=0;i<r.logs.length;i++)assert(JSON.stringify(stable(r.logs[i]))===JSON.stringify(stable(base.result.logs[i])),`${n}/log${i}`);
 proof.cases.push({case:n,logs:r.logs.length,scores:base.summary.playerScores,fullSemanticReplay:true,source:base.options.seed,inputHash:crypto.createHash('sha256').update(fs.readFileSync(d+`scan-readiness-diagnosis-${n}.json`)).digest('hex')});
 for(const row of x.rows){
  const decision=r.logs.find(l=>l.type==='turn-action'&&l.playerId===row.player&&l.roundNumber===row.round&&l.rawTurnNumber===row.turn&&l.details.action.id===row.selected);
  const fee=row.selected==='scan'&&decision?r.resourceFlow.events.find(e=>e.playerId===row.player&&e.roundNumber===row.round&&e.turnNumber===decision.turnNumber&&/^扫描费用：/.test(e.sourceDetail)):null;
  const events=fee?r.resourceFlow.events.filter(e=>e.playerId===row.player&&e.entryId===fee.entryId):[];
  const next=decision?r.logs.find(l=>l.id>decision.id&&l.playerId===row.player&&l.type==='turn-action'&&l.details.action?.kind==='main'):null;
  proof.rows.push({case:n,player:row.player,company:row.company,round:row.round,rawTurn:row.turn,resources:row.resources,placed:row.placed.length,cost:row.cost,oldProjectedUnlock:row.oldProjectedUnlock,canPayAnalysisAfterScan:row.canPayAnalysisAfterScan,selected:row.selected,scanScore:row.scan.score,decisionMatched:Boolean(decision),actualScanEntry:fee?.entryId||null,actualScanData:fee?events.filter(e=>e.pace==='main'&&/^(?:扇区扫描|水星扇区扫描|公共牌区扫描|手牌扫描)/.test(e.sourceDetail)).reduce((s,e)=>s+Math.max(0,e.resourceDeltas.availableData||0),0):null,nextMain:next?{id:next.details.action.id,round:next.roundNumber,resources:next.playerResources}:null});
 }
}
proof.summary={observations:proof.rows.length,unrecognizedPayable:proof.rows.filter(r=>!r.oldProjectedUnlock&&r.canPayAnalysisAfterScan).length,actualTwoDataThenAnalysis:proof.rows.filter(r=>!r.oldProjectedUnlock&&r.canPayAnalysisAfterScan&&r.actualScanData>=2&&r.nextMain?.id==='analyze'&&r.nextMain.round===r.round)};
proof.limitations=['Read-only replay of two already-seen games, not prevalence estimate or new strength test.','Existing helper only recognizes Grand Strategy round1 with four occupied core cells and two scan-effect types.','Two effect types alone do not prove two data: full sectors, selection, optional costs and blue placements must be checked before any generic replacement.','Actual next-main analysis proves a realized route in these samples, not that scan was optimal or universally guaranteed.'];
fs.writeFileSync(d+'scan-readiness-diagnosis-proof.json',JSON.stringify(proof,null,2)+'\n');console.log(JSON.stringify({cases:proof.cases,summary:proof.summary},null,2));
