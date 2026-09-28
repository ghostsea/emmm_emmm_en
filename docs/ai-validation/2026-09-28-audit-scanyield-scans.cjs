const fs=require('fs'),assert=require('node:assert/strict'),d='tmp/ai-20260905/',p=process.argv[2]||'scanyield',suite=JSON.parse(fs.readFileSync(d+p+'-suite.json')),rows=[],issues=[];
const {summarizeBlueTechRewards}=require('../../randomizer/game/ai/resource-flow');
for(const [caseIndex,pair] of suite.pairs.entries())for(const side of ['baseline','candidate']){
 const r=JSON.parse(fs.readFileSync(d+pair[side]));assert(r.summary.ok&&r.summary.gameEnded&&!r.summary.bugCount);
 const fees=r.result.resourceFlow.events.filter(e=>/^扫描费用：扫描消耗 /.test(e.sourceDetail)&&e.pace==='main');
 const actions=r.result.logs.filter(l=>l.type==='turn-action'&&l.details.action?.kind==='main'),scans=actions.filter(l=>l.details.action.id==='scan'),used=new Set(),counts={};
 for(const l of scans){
  const company=r.result.playerResults.find(x=>x.playerId===l.playerId).companyLabel,key=l.playerId+'/'+l.roundNumber;
  const matches=fees.filter(e=>!used.has(e)&&e.playerId===l.playerId&&e.roundNumber===l.roundNumber&&e.turnNumber===l.turnNumber);const e=matches[0];
  if(!e){issues.push({case:caseIndex+1,side,log:l.id,issue:'no paid scan'});continue;}used.add(e);
  const expected={credits:company==='作弊实验室'?0:1,energy:2};for(const k of Object.keys(expected))if(-(e.resourceDeltas[k]||0)!==expected[k])issues.push({case:caseIndex+1,side,log:l.id,issue:'payment '+k});
  const events=r.result.resourceFlow.events.filter(x=>x.entryId===e.entryId&&x.playerId===e.playerId),receipts=events.filter(x=>x.pace==='main'&&/^(?:扇区扫描|水星扇区扫描|公共牌区扫描|手牌扫描)/.test(x.sourceDetail));
  const playerEvents=r.result.resourceFlow.events.filter(x=>x.playerId===e.playerId);
  const blueBefore=summarizeBlueTechRewards(playerEvents.filter(x=>x.entryId<e.entryId));
  const blueAfter=summarizeBlueTechRewards(playerEvents.filter(x=>x.entryId<=e.entryId));
  const next=actions.find(x=>x.id>l.id&&x.playerId===l.playerId);
  rows.push({case:caseIndex+1,side,company,player:l.playerId,round:l.roundNumber,turn:l.turnNumber,log:l.id,entry:e.entryId,ordinal:counts[key]=(counts[key]||0)+1,cost:expected,data:receipts.reduce((s,x)=>s+Math.max(0,x.resourceDeltas.availableData||0),0),slotScore:receipts.reduce((s,x)=>s+Math.max(0,x.resourceDeltas.score||0),0),sameEntryBlueCredits:blueAfter.blue1CreditGain-blueBefore.blue1CreditGain,sameEntryBlueEnergy:blueAfter.blue2EnergyGain-blueBefore.blue2EnergyGain,nextMain:next?{id:next.details.action.id,round:next.roundNumber,turn:next.turnNumber}:null,receipts:receipts.map(x=>x.sourceDetail)});
 }
 if(used.size!==fees.length)issues.push({case:caseIndex+1,side,issue:'unmatched scan fee',used:used.size,fees:fees.length});
}
const companies=[...new Set(rows.map(r=>r.company))],summary={pairs:suite.pairs.length,issues,groups:{}};
for(const side of ['baseline','candidate'])summary.groups[side]=Object.fromEntries(companies.map(company=>{const rs=rows.filter(r=>r.company===company&&r.side===side);const sum=k=>rs.reduce((s,r)=>s+r[k],0);return[company,{scans:rs.length,secondOrLater:rs.filter(r=>r.ordinal>=2).length,thirdOrLater:rs.filter(r=>r.ordinal>=3).length,data:sum('data'),slotScore:sum('slotScore'),sameEntryBlueCredits:sum('sameEntryBlueCredits'),sameEntryBlueEnergy:sum('sameEntryBlueEnergy'),nextMainAnalysisSameRound:rs.filter(r=>r.nextMain?.id==='analyze'&&r.nextMain.round===r.round).length}];}));
fs.writeFileSync(d+p+'-scan-audit.json',JSON.stringify({scope:'All selected standard scans matched one-to-one to an actual main-action payment. Data/slot points include explicit scan receipts only. Blue returns are same-entry association and next-analysis is temporal association, neither is causal attribution. Whole-game resources and scores reported separately.',summary,rows},null,2)+'\n');console.log(JSON.stringify(summary,null,2));assert.equal(issues.length,0);
