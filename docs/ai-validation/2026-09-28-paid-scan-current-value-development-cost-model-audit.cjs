const fs=require('fs'),assert=require('node:assert/strict'),crypto=require('crypto'),d='tmp/ai-20260905/',p=process.argv[2]||'paidscan';
const suite=JSON.parse(fs.readFileSync(d+p+'-suite.json')),full=JSON.parse(fs.readFileSync(d+p+'-complete.json')),scan=JSON.parse(fs.readFileSync(d+p+'-scan-transactions.json'));assert.equal(full.report.pairs.length,suite.plannedPairs);assert.equal(scan.pairs,suite.plannedPairs);
const rows=[];for(const [i,pair]of suite.pairs.entries()){
 const raw=fs.readFileSync(d+pair.candidate),run=JSON.parse(raw);assert.equal(crypto.createHash('sha256').update(raw).digest('hex'),scan.manifest.find(m=>m.side==='candidate'&&m.file===pair.candidate).sha256,'same audited input');assert(run.summary.ok&&run.summary.gameEnded&&!run.summary.bugCount&&!run.summary.blocked);
 const byId=new Map(run.result.logs.map(l=>[l.id,l]));for(const tx of scan.rows.filter(r=>r.case===i+1&&r.side==='candidate')){
 const action=byId.get(tx.logId).details.action,b=action.valueBreakdown,paid=tx.payment.credits>0,expected=paid?'paid-current-value':'discounted-scan-guardrails';assert.equal(b.scanValueModel,expected,'model agrees with actual paid credit');assert(Number.isFinite(b.scanBaseScore));
 if(paid)assert(!/当前位置|火箭数量|发射建立|移动路线/.test(action.scoreCapReason||''),'paid scan must not carry route/launch cap reason');
 rows.push({case:i+1,company:tx.company,player:tx.player,round:tx.round,entryId:tx.entryId,logId:tx.logId,creditPaid:tx.payment.credits,energyPaid:tx.payment.energy,model:b.scanValueModel,baseScore:b.scanBaseScore,selectedScore:action.score,capReason:action.scoreCapReason||null});
 }
}
const groups=Object.fromEntries([...new Set(rows.map(r=>r.company))].map(c=>{const rs=rows.filter(r=>r.company===c);return[c,{scans:rs.length,paidCreditScans:rs.filter(r=>r.creditPaid>0).length,discountedScans:rs.filter(r=>r.creditPaid===0).length}]}));
fs.writeFileSync(d+p+'-cost-model-audit.json',JSON.stringify({scope:'Every selected standard scan in all completed candidate games. Match selected model tag against credit actually charged in its uniquely matched scan transaction. Paid branch cannot report launch/route relative caps. Does not prove alternative unselected actions or final score causality.',groups,rows,inputManifest:scan.manifest.filter(m=>m.side==='candidate')},null,2)+'\n');console.log(JSON.stringify(groups,null,2));
