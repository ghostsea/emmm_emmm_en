const fs=require('fs'),assert=require('node:assert/strict'),d='tmp/ai-20260905/',p=process.argv[2]||'scanprojection',suite=JSON.parse(fs.readFileSync(d+p+'-suite.json')),rows=[],issues=[];
const scanAudit=JSON.parse(fs.readFileSync(d+p+'-scan-audit.json'));
assert.equal(scanAudit.summary.issues.length,0);
for(const [i,pair]of suite.pairs.entries()){
 const r=JSON.parse(fs.readFileSync(d+pair.candidate)).result;
 const actions=r.logs.filter(l=>l.type==='turn-action');
 for(const l of actions){
  const scan=l.details.candidates?.find(x=>x.id==='scan'),profile=scan?.valueBreakdown?.scanAnalyzeProjection;
  if(!scan?.available||!profile?.canOpenAnalyze)continue;
  const selected=l.details.action.id==='scan',matched=selected?scanAudit.rows.find(x=>x.case===i+1&&x.side==='candidate'&&x.log===l.id):null;
  const fee=matched?r.resourceFlow.events.find(e=>e.entryId===matched.entry&&e.playerId===l.playerId&&/^扫描费用：扫描消耗 /.test(e.sourceDetail)):null;
  const events=fee?r.resourceFlow.events.filter(e=>e.entryId===fee.entryId&&e.playerId===fee.playerId):[];
  const actualMainData=selected?events.filter(e=>e.pace==='main').reduce((sum,e)=>sum+Math.max(0,e.resourceDeltas.availableData||0),0):null;
  const mandatoryData=selected?events.filter(e=>e.pace==='main'&&/^(?:扇区扫描|公共牌区扫描)/.test(e.sourceDetail)).reduce((sum,e)=>sum+Math.max(0,e.resourceDeltas.availableData||0),0):null;
  const next=selected?actions.find(x=>x.id>l.id&&x.playerId===l.playerId&&x.details.action.kind==='main'):null;
  const row={case:i+1,log:l.id,company:r.playerResults.find(x=>x.playerId===l.playerId).companyLabel,player:l.playerId,round:l.roundNumber,turn:l.turnNumber,selected,profile,actualMainData,mandatoryData,scanEntry:fee?.entryId||null,nextMain:next?{id:next.details.action.id,round:next.roundNumber,resources:next.playerResources,analyzeAvailable:next.details.candidates?.find(x=>x.id==='analyze')?.available}:null};rows.push(row);
  if(selected){if(!fee)issues.push({case:i+1,log:l.id,issue:'no scan payment'});else for(const k of ['credits','energy'])if(-(fee.resourceDeltas[k]||0)!==(profile.cost[k]||0))issues.push({case:i+1,log:l.id,issue:'scan payment '+k});if(actualMainData<profile.guaranteedData)issues.push({case:i+1,log:l.id,issue:'data below projection',expected:profile.guaranteedData,actual:actualMainData});}
 }
}
const selected=rows.filter(r=>r.selected),summary={pairs:suite.pairs.length,positiveObservations:rows.length,selectedScans:selected.length,selectedByCompany:Object.fromEntries([...new Set(rows.map(r=>r.company))].map(c=>[c,selected.filter(r=>r.company===c).length])),nextSameRoundAnalysis:selected.filter(r=>r.nextMain?.id==='analyze'&&r.nextMain.round===r.round).length,nextSameRoundAnalyzeAvailable:selected.filter(r=>r.nextMain?.analyzeAvailable&&r.nextMain.round===r.round).length,issues};
fs.writeFileSync(d+p+'-followup.json',JSON.stringify({scope:'All positive logged scan projections, actual selected scan payment and total main-step data receipts. Mandatory scan data is listed separately; additional main rewards may fill capacity. Next analysis is descriptive and not a guarantee or causal score estimate. Unselected positive candidates are observations only.',summary,rows},null,2)+'\n');console.log(JSON.stringify(summary,null,2));assert.equal(issues.length,0);
