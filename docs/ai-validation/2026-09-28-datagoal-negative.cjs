const fs=require('fs'),path=require('path'),Module=require('module');
const root=path.resolve('tmp/ai-20260905/data-goal-support-current'),file=require.resolve(root+'/randomizer/app/ai-controller.js');
const text=fs.readFileSync(file,'utf8'),line='          directDataGoalSupport: bestPlayCardBreakdown.directDataGoalSupport || null,';
if(!text.includes(line))throw Error('wrapper not found');
const m=new Module(file,module);m.filename=file;m.paths=Module._nodeModulePaths(path.dirname(file));
m._compile(text.replace(line,''),file);m.loaded=true;require.cache[file]=m;require(root+'/randomizer/app/ai-controller.test.js');
