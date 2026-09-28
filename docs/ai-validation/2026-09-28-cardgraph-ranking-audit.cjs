const fs=require('fs'),assert=require('node:assert/strict'),d='tmp/ai-20260905/',p='cardgraph';
const s=JSON.parse(fs.readFileSync(d+p+'-suite.json')),issues=[],plays=[],companies={};
let decisions=0,rankedAlternatives=0,changedRawRepresentative=0,postGraphNetChanges=0;
for(const[i,pair]of s.pairs.entries()){
 const run=JSON.parse(fs.readFileSync(d+pair.candidate));assert(run.summary.ok&&run.summary.gameEnded&&!run.summary.bugCount&&!run.summary.blocked);
 for(const l of run.result.logs){
  if(l.type!=='turn-action')continue;
  const c=l.details?.candidates?.find(c=>c.id==='playCard'&&c.available!==false);
  if(!c)continue;
  decisions++;const ranks=c.cardGraphAlternatives||[],raw=c.playableCards||[];
  const company=run.result.playerResults.find(p=>p.playerId===l.playerId).companyLabel;
  const group=companies[company]||= {decisions:0,rawRepresentativeChanged:0,plays:0,playedAlternative:0};group.decisions++;
  rankedAlternatives+=ranks.length;
  const rawBest=[...raw].sort((a,b)=>b.score-a.score)[0],selected=ranks[0];
  const changed=rawBest?.cardInstanceId!==c.cardInstanceId;
  if(changed){changedRawRepresentative++;group.rawRepresentativeChanged++;}
  const identity=x=>x.cardInstanceId;
  if(!ranks.length||ranks.length!==raw.length||new Set(ranks.map(identity)).size!==ranks.length
    ||JSON.stringify(ranks.map(identity).sort())!==JSON.stringify(raw.map(identity).sort())
    ||selected?.cardInstanceId!==c.cardInstanceId||ranks.some((r,n)=>n>0&&r.net>ranks[n-1].net)){
    issues.push({case:i+1,log:l.id,kind:'lost-or-misranked-card',selected:c.cardInstanceId,ranks,rawIds:raw.map(identity)});
  }
  const mainSelected=l.details.action?.id==='playCard';
  if(c.actionGraph?.net!==selected?.net)postGraphNetChanges++;
  if(mainSelected){group.plays++;if(changed)group.playedAlternative++;
   plays.push({case:i+1,log:l.id,company,player:l.playerId,round:l.roundNumber,turn:l.turnNumber,
    card:c.cardId,instance:c.cardInstanceId,rawBest:rawBest?.cardId,changed,
    rawBestScore:rawBest?.score,graphNet:selected?.net,policyNet:c.actionGraph?.net});
  }
 }
}
const summary={pairs:s.pairs.length,decisions,rankedAlternatives,changedRawRepresentative,postGraphNetChanges,
 plays:plays.length,playedAlternative:plays.filter(p=>p.changed).length,issues:issues.length};
fs.writeFileSync(d+p+'-ranking-audit.json',JSON.stringify({scope:'Every recorded preselection lists all legal hand instances exactly once in descending graph order and picks its first. Later cross-action pressure can modify policy net and is counted, not claimed globally optimal. Actual selected instances and unique payments have separate audits.',summary,companies,issues,plays},null,2)+'\n');
console.log(JSON.stringify(summary,null,2));assert.equal(issues.length,0);
