const fs=require('fs'),path=require('path'),d='tmp/ai-20260905/';
const a=JSON.parse(fs.readFileSync(d+'probeabsolute64-suite.json')),b=JSON.parse(fs.readFileSync(d+'repeatabsolute64-suite.json')),c=JSON.parse(fs.readFileSync(d+'repeatincremental64-suite.json'));
console.log(Object.keys(a.models),Object.keys(b.models),Object.keys(c.models));
const norm=p=>fs.readFileSync(p,'utf8').replace(/\r\n/g,'\n');
const rows=[];for(const [old,next]of [[a.models.base,b.models.base],[a.models.candidate,c.models.base]]){
 const changed=[];for(const f of Object.keys(old.hashes)){if(!fs.existsSync(path.join(d,next.root,f))||norm(path.join(d,old.root,f))!==norm(path.join(d,next.root,f)))changed.push(f);}
 rows.push({old:old.commit,next:next.commit,changed});
}
console.log(JSON.stringify(rows,null,2));fs.writeFileSync(d+'accepted128-source-audit.json',JSON.stringify({scope:'Prior64 and fresh64 accepted-policy arms; changed source paths are parser24 migration only, with semantic replay proof already frozen before fresh seeds.',rows},null,2)+'\n');
