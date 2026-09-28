const fs=require('fs'),crypto=require('crypto'),assert=require('node:assert/strict'),vm=require('vm');
const parser=require('../../tools/analyze_reference_action_logs'),effects=require('../../randomizer/game/cards/effects');
const context={};vm.runInNewContext(fs.readFileSync('randomizer/game/card-catalog.js','utf8'),context);
const catalog=context.SetiCardCatalog,source=fs.readFileSync('randomizer/app/ai-controller.js','utf8');
const block=source.match(/const unsupportedTypes = new Set\(\[([\s\S]*?)\]\);/)[1];
const unsupported=['alien_trace',...[...block.matchAll(/EFFECT_TYPES\.(\w+)/g)].map(m=>effects.EFFECT_TYPES[m[1]])];
const games=[];
for(const file of ['seti-action-log-20260909-231236.md','seti-action-log-20260919-223731.md']){
 const raw=fs.readFileSync('参考行动日志/'+file,'utf8'),r=parser.parseReferenceActionLog(raw),rows=[];
 for(const e of r.events.filter(e=>e.playerId==='白色'&&e.cards?.some(c=>c.change==='play'))){
  const label=e.cards.find(c=>c.change==='play').label,matches=catalog.filter(c=>c.card_name===label);assert(matches.length<=1);
  const card=matches[0],model=card?effects.getCardModel({cardId:card.card_id}):null;
  const types=[...new Set((model?.playEffects||[]).map(e=>e.type))];
  const receipts=r.events.filter(x=>x.playerId==='白色'&&x.entryId===e.entryId&&x.stepIndex>e.stepIndex);
  const sum=events=>events.reduce((out,x)=>{for(const[k,v]of Object.entries(x.resourceDeltas||{}))if(v>0)out[k]=(out[k]||0)+v;return out;},{});
  rows.push({entry:e.entryId,round:e.roundNumber,turn:e.turnNumber,label,cardId:card?.card_id||null,modelFound:Boolean(model),types,unconditionallyUnsupported:types.filter(t=>unsupported.includes(t)),payment:e.resourceDeltas,mainPositiveReceipts:sum(receipts.filter(x=>x.pace==='main')),quickPositiveReceipts:sum(receipts.filter(x=>x.pace==='quick')),receipts:receipts.map(x=>({pace:x.pace,text:x.sourceDetail,resources:x.resourceDeltas,income:x.incomeDeltas}))});
 }
 const score=r.playerResults.find(x=>x.playerId==='白色').finalScore;
 assert.equal(rows.length,score===296?18:22);
 games.push({file,sha256:crypto.createHash('sha256').update(raw).digest('hex'),company:r.playerMetadata['白色'].industryId,score,plays:rows.length,matchedCatalog:rows.filter(x=>x.cardId).length,unsupportedPlayedCards:rows.filter(x=>x.unconditionallyUnsupported.length).map(({receipts,...rest})=>rest),rows});
}
const report={scope:'Two selected legacy human games; white seats only. Exact card-name matching against current catalog; alien or unmatched cards remain unknown. Unsupported checks are current unconditional type gates, not a full legal-play audit. Main and quick gains after payment are within that entry and may include visits, alien rewards and task triggers; not card-face-only or net causal gains. Cannot infer AI will hold the same cards or get the same shared rewards. Parser23; no new games.',defaultCommit:'61c915ea',unsupportedTypes:unsupported,games};
fs.writeFileSync('docs/ai-validation/2026-09-28-new-human-card-coverage.json',JSON.stringify(report,null,2)+'\n');
console.log(games.map(g=>({file:g.file,plays:g.plays,matched:g.matchedCatalog,unsupported:g.unsupportedPlayedCards.map(r=>({id:r.cardId,label:r.label,types:r.unconditionallyUnsupported,main:r.mainPositiveReceipts,quick:r.quickPositiveReceipts}))})));
