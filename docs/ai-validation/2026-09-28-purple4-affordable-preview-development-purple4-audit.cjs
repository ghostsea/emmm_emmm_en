const fs=require('fs'),assert=require('node:assert/strict'),crypto=require('crypto'),path=require('path'),d='tmp/ai-20260905/',p=process.argv[2]||'purple4preview';
const s=JSON.parse(fs.readFileSync(d+p+'-suite.json')),complete=JSON.parse(fs.readFileSync(d+p+'-complete.json'));
assert.equal(complete.report.pairs.length,s.plannedPairs);const flow=require(path.resolve(d+s.models.base.root+'/randomizer/game/ai/resource-flow.js')),scan=require('../../tools/analyze_ai_scan_transactions.js');
const rows=[],manifest=[];
for(const [i,pair]of s.pairs.entries())for(const side of ['baseline','candidate']){
 const raw=fs.readFileSync(d+pair[side]),run=JSON.parse(raw),ls=run.result.logs;
 assert.equal(run.options.seed,pair.seed);assert.equal(run.options.alienSeed,pair.alienSeed);
 manifest.push({file:pair[side],sha256:crypto.createHash('sha256').update(raw).digest('hex')});
 for(const tx of scan.analyzeRun(run,i+1,side,flow)){
  const index=ls.findIndex(l=>l.id===tx.logId),decision=ls[index],preview=decision.details.action.valueBreakdown?.scanAction4Preview;
  const after=[];for(const l of ls.slice(index+1)){
   if(l.playerId!==decision.playerId)continue;
   if(l.roundNumber!==decision.roundNumber||l.rawTurnNumber!==decision.rawTurnNumber)break;
   if(l.type==='turn-action'&&['main','pass'].includes(l.details?.action?.kind))break;
   if(['scan-action-4','scan-action-4-skip'].includes(l.type))after.push(l);
  }
  if(!after.length&&!preview)continue;
  assert.equal(after.length,1,'one purple4 node per standard scan');const node=after[0],selected=node.details?.selected;
  if(side==='candidate'){
   assert(preview,'selected purple4 scan must record preview');assert(!preview.nested&&!preview.unavailable,'top level legal scan');
   assert(Math.abs(preview.score-Math.max(0,...preview.choices.map(c=>c.score)))<1e-8,'exclusive max');
   assert.equal(preview.resourcesAfterScanPayment.energy,decision.playerResources.energy-tx.payment.energy,'actual scan energy deducted');
   assert.equal(preview.resourcesAfterScanPayment.credits,decision.playerResources.credits-tx.payment.credits,'actual company credit cost deducted');
   if(preview.choices.some(c=>c.choice==='launch'))assert(preview.resourcesAfterScanPayment.energy>=1,'launch affordable');
  }
  const selectedChoice=node.type==='scan-action-4-skip'?'skip':selected.choice;
  const events=run.result.resourceFlow.events.filter(e=>e.playerId===decision.playerId&&e.entryId===tx.entryId&&e.pace==='main');
  const launches=events.filter(e=>/^发射\/移动：发射 /.test(e.sourceDetail)),moves=events.filter(e=>/^发射\/移动：已累加 1 移动/.test(e.sourceDetail));
  assert.equal(launches.length,Number(selectedChoice==='launch'),'actual launch effect');
  assert.equal(moves.length,Number(selectedChoice==='move'),'actual movement grant');
  if(selectedChoice==='launch')assert.equal(launches[0].resourceDeltas.energy,-1,'actual launch extra1 energy');
  const positiveTypes=preview?[...new Set(preview.choices.filter(c=>c.score>0).map(c=>c.choice))]:null;
  rows.push({case:i+1,side,company:tx.company,player:tx.player,round:tx.round,rawTurn:tx.rawTurn,scanLog:tx.logId,nodeLog:node.id,entryId:tx.entryId,previewScore:preview?.score??null,positivePreviewTypes:positiveTypes,afterScanPayment:preview?.resourcesAfterScanPayment??null,nodeResources:node.playerResources,actualChoice:selectedChoice,actualExtraLaunchEnergy:launches.length,actualMovementGrant:moves.length,nodeCreditsDifference:preview?node.playerResources.credits-preview.resourcesAfterScanPayment.credits:null,nodeEnergyDifference:preview?node.playerResources.energy-preview.resourcesAfterScanPayment.energy:null,positivePreviewThenSkip:preview?preview.score>0&&selectedChoice==='skip':null,zeroPreviewThenAct:preview?preview.score===0&&selectedChoice!=='skip':null});
 }
}
const groups={};for(const side of ['baseline','candidate'])groups[side]=Object.fromEntries([...new Set(rows.filter(r=>r.side===side).map(r=>r.company))].map(c=>{const rs=rows.filter(r=>r.side===side&&r.company===c);return[c,{nodes:rs.length,launch:rs.filter(r=>r.actualChoice==='launch').length,move:rs.filter(r=>r.actualChoice==='move').length,skip:rs.filter(r=>r.actualChoice==='skip').length,positivePreviewThenSkip:rs.filter(r=>r.positivePreviewThenSkip).length,zeroPreviewThenAct:rs.filter(r=>r.zeroPreviewThenAct).length,nodeCreditsOrEnergyChanged:rs.filter(r=>(r.nodeCreditsDifference||r.nodeEnergyDifference)).length}]}));
const report={scope:'Complete paired standard scans only. Scan-payment matching reuses ordinal transaction audit; node followup restricted to same player/round/rawTurn before next main decision. Each observed purple4 selection matches exactly one actual extra1energy launch or1movement grant in the paid scan transaction. Candidate top-level preview must deduct actual scan cost and use exclusive max. Resource changes before node and preview/actual differences are descriptive, not causal score effects. Movement grant is not proof of final route payoff; zero-score choices may execute. Does not infer hypothetical outcomes for scans never chosen.',groups,rows,manifest};
fs.writeFileSync(d+p+'-purple4-followup.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(groups,null,2));
