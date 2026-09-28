const fs=require('fs'),path=require('path'),Module=require('module');
const root=path.resolve('tmp/ai-20260905/strategy-credit-reserve-current'),file=require.resolve(root+'/randomizer/app/ai-controller.js');
const start='    function scoreAiGrandStrategyCreditBottleneckPenalty(',end='    function scoreAiPlayCardValue(';
const old=fs.readFileSync('tmp/ai-20260905/probe-random-candidate/randomizer/app/ai-controller.js','utf8'),current=fs.readFileSync(file,'utf8');
const oldStart=old.indexOf(start),oldEnd=old.indexOf(end,oldStart),newStart=current.indexOf(start),newEnd=current.indexOf(end,newStart);
if([oldStart,oldEnd,newStart,newEnd].some(x=>x<0))throw Error('function boundaries');
const source=current.slice(0,newStart)+old.slice(oldStart,oldEnd)+current.slice(newEnd);
const m=new Module(file,module);m.filename=file;m.paths=Module._nodeModulePaths(path.dirname(file));m._compile(source,file);m.loaded=true;require.cache[file]=m;
require(root+'/randomizer/app/ai-controller.test.js');
