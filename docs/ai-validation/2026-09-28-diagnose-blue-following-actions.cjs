const fs=require('fs'),assert=require('node:assert/strict'),crypto=require('crypto'),d='tmp/ai-20260905/',p=process.argv[2],suite=JSON.parse(fs.readFileSync(d+p+'-suite.json')),inputs=[],rows=[],issues=[];
const repair=require('./embedded-placement-ledger/tools/repair_ai_embedded_placement_resources').repairEmbeddedPlacementResources;
for(const [i,pair]of suite.pairs.entries())for(const side of ['baseline','candidate']){
 const bytes=fs.readFileSync(d+pair[side]),r=JSON.parse(bytes);assert(r.summary.ok&&r.summary.gameEnded&&!r.summary.bugCount&&!r.summary.blocked);
 const corrected=repair(r);
 inputs.push({case:i+1,side,file:pair[side],sha256:crypto.createHash('sha256').update(bytes).digest('hex'),embeddedPlacementCorrections:corrected.changes.length});
 for(const player of r.result.playerResults){
  const ls=r.result.logs.filter(l=>l.playerId===player.playerId),rf=corrected.resourceFlow.players.find(x=>x.playerId===player.playerId),counts={credits:0,energy:0};
  for(const [j,l]of ls.entries()){
   const nested=l.type==='data-placement',a=nested?l.details?.selected:l.details?.action;
   if(!(nested||(l.type==='turn-action'&&a?.id==='placeData'))||a?.target!=='blueBonus')continue;
   const after=ls.slice(j+1),nextSnapshot=after.find(x=>x.playerResources),sameRound=after.filter(x=>x.roundNumber===l.roundNumber),nextAction=sameRound.find(x=>x.type==='turn-action'&&(x.details.action.kind==='main'||x.details.action.id==='pass'));
   const description=a.description||'',observedKeys=['credits','energy'].filter(k=>nextSnapshot?.playerResources[k]===l.playerResources[k]+1);
   const key=nested?(observedKeys.length===1?observedKeys[0]:null):/额外获得\s*1\s*信用/.test(description)?'credits':/额外获得\s*1\s*能量/.test(description)?'energy':null;if(!key)continue;
   counts[key]++;
   const exactImmediate=Boolean(nextSnapshot&&nextSnapshot.playerResources[key]===l.playerResources[key]+1&&nextSnapshot.playerResources.availableData===l.playerResources.availableData-(nested?0:1));
   if(!exactImmediate)issues.push({case:i+1,side,player:player.playerId,log:l.id,reason:'next snapshot differs from simple +1 resource/-1 data; inspect additional effects'});
   const between=sameRound.filter(x=>x.type==='turn-action'&&(!nextAction||x.id<nextAction.id)).map(x=>({log:x.id,id:x.details.action.id,kind:x.details.action.kind,resources:x.playerResources}));
   rows.push({case:i+1,side,company:player.companyLabel,player:player.playerId,round:l.roundNumber,turn:l.turnNumber,log:l.id,nestedRewardPlacement:nested,resource:key,before:l.playerResources,after:nextSnapshot?.playerResources,exactImmediate,nextMain:nextAction?{log:nextAction.id,id:nextAction.details.action.id,turn:nextAction.turnNumber,resources:nextAction.playerResources,cost:nextAction.details.action.cost||null}:null,between});
  }
  for(const [key,actual]of Object.entries({credits:rf.blue1CreditGain,energy:rf.blue2EnergyGain}))if(counts[key]!==actual)issues.push({case:i+1,side,player:player.playerId,resource:key,reason:'selected actions versus actual whole-game receipts differ',actions:counts[key],actual});
 }
}
assert.equal(inputs.length,suite.pairs.length*2);
const groups={};
for(const side of ['baseline','candidate'])groups[side]=Object.fromEntries([...new Set(rows.map(x=>x.company))].map(company=>{const xs=rows.filter(x=>x.side===side&&x.company===company);return [company,{bonusActions:xs.length,exactImmediate:xs.filter(x=>x.exactImmediate).length,credit:xs.filter(x=>x.resource==='credits').length,energy:xs.filter(x=>x.resource==='energy').length,sameRoundNextMain:xs.filter(x=>x.nextMain&&x.nextMain.id!=='pass').length,noFurtherMainThisRound:xs.filter(x=>!x.nextMain||x.nextMain.id==='pass').length,nextActionCounts:Object.fromEntries([...new Set(xs.map(x=>x.nextMain?.id||'none'))].map(id=>[id,xs.filter(x=>(x.nextMain?.id||'none')===id).length])),interveningTrades:xs.filter(x=>x.between.some(x=>x.id==='trade')).length}];}));
const result={scope:'Complete paired suite, blue1/blue2 bonus placement actions including nested full-pool reward placements matched against next player-resource snapshot and parser27-corrected whole-game resource totals. Nested placement consumes and replaces one data; net pool count remains unchanged. Follow first same-round main decision; intervening quick actions retained. Actions are decisions in successful complete games, not independent causal outcomes. Several bonuses may precede one main action: do not sum following-main counts as added actions. Fungible inventory and trades mean temporal following does not prove the bonus funded an otherwise impossible action.',inputs,groups,issues,rows};
fs.writeFileSync(d+p+'-blue-following-actions.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({groups,issues},null,2));
