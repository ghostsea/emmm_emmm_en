const fs=require('fs'),path=require('path'),Module=require('module');
const root=path.resolve('tmp/ai-20260905/card-graph-ranking-current'),file=require.resolve(root+'/randomizer/app/ai-controller.js');
const current=fs.readFileSync(file,'utf8'),start=current.indexOf('    function selectAiPlayCardTurnCandidate('),end=current.indexOf('    function enumerateAiTurnActions()',start);
if(start<0||end<0)throw Error('function boundaries');
const oldSelection=`    function selectAiPlayCardTurnCandidate(playCardCandidates = [], currentPlayer = getCurrentPlayer()) {
      const legal = playCardCandidates.filter(candidate => candidate?.available !== false);
      const selected = [...legal].sort((a,b) => Number(b.score || 0) - Number(a.score || 0))[0] || null;
      return buildAiPlayCardTurnCandidate(selected, legal, currentPlayer);
    }

`;
const m=new Module(file,module);m.filename=file;m.paths=Module._nodeModulePaths(path.dirname(file));
m._compile(current.slice(0,start)+oldSelection+current.slice(end),file);m.loaded=true;require.cache[file]=m;
require(root+'/randomizer/app/ai-controller.test.js');
