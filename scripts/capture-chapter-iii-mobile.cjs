const fs=require('fs'),path=require('path'),{execFileSync}=require('child_process');
const adb=path.join(process.env.LOCALAPPDATA,'Android/Sdk/platform-tools/adb.exe');
const root=path.resolve(__dirname,'../artifacts/chapter-iii');
function run(args){return execFileSync(adb,['-s','emulator-5554',...args],{maxBuffer:12*1024*1024});}
const [action,...args]=process.argv.slice(2);
function hierarchy(){
 for(let n=0;n<4;n++){
  let result;try{result=run(['shell','uiautomator','dump','/sdcard/lunas-capture.xml']).toString();}catch{continue;}
  if(!result.includes('dumped'))continue;
  const xml=run(['shell','cat','/sdcard/lunas-capture.xml']).toString();
  if(xml.includes('<hierarchy'))return xml;
 }
 throw new Error('No fresh Android UI hierarchy; refusing stale inspection/capture.');
}
function center(node){const b=node.match(/bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/);return [String(Math.round((+b[1]+ +b[3])/2)),String(Math.round((+b[2]+ +b[4])/2))];}
if(action==='tap-label'){
 let node;
 for(let attempt=0;attempt<6&&!node;attempt++){
 const nodes=[...hierarchy().matchAll(/<node\b[^>]+/g)].map(m=>m[0]);
 const label=n=>n.match(/content-desc="([^"]*)"/)?.[1]||n.match(/text="([^"]*)"/)?.[1]||'';
 const matching=nodes.filter(n=>label(n).includes(args.join(' ')));
 node=matching.find(n=>label(n)===args.join(' ')&&n.includes('clickable="true"'))||matching.find(n=>n.includes('clickable="true"'))||matching[0];
 }
 if(!node)throw new Error('Requested UI label is not present');
 run(['shell','input','tap',...center(node)]);
}
if(action==='field'){
 let fields=[];
 for(let attempt=0;attempt<6&&!fields[Number(args[0])];attempt++)fields=[...hierarchy().matchAll(/<node\b[^>]+/g)].map(m=>m[0]).filter(n=>n.includes('class="android.widget.EditText"'));
 if(!fields[Number(args[0])])throw new Error('Requested input field is not present');
 run(['shell','input','tap',...center(fields[Number(args[0])])]);
}
if(action==='tap')run(['shell','input','tap',...args]);
if(action==='back')run(['shell','input','keyevent','4']);
if(action==='swipe')run(['shell','input','swipe','540','1950','540','650','400']);
if(action==='text')run(['shell','input','text',args.join(' ')]);
if(action==='password'){
 const pw=process.env.LUNAS_CAPTURE_PASSWORD||fs.readFileSync(path.resolve(__dirname,'../lunas_backend/scripts/seed-dagupan-data.js'),'utf8').match(/DAGUPAN_SEED_PASSWORD \|\| '([^']+)'/)[1];
 run(['shell','input','text',pw]);
}
if(action==='inspect'){
 const xml=hierarchy();
 for(const node of xml.matchAll(/<node\b[^>]+/g)){
  const label=node[0].match(/content-desc="([^"]*)"/)?.[1];const cls=node[0].match(/class="([^"]*)"/)?.[1];const bounds=node[0].match(/bounds="([^"]*)"/)?.[1];
  if(label||cls==='android.widget.EditText')console.log(label||cls,bounds);
 }
}
if(action==='capture'){
 hierarchy();
 const [folder,name,role,seeded='Yes']=args;
 const file=name+'.png',dest=path.join(root,'screenshots',folder,file);fs.mkdirSync(path.dirname(dest),{recursive:true});
 fs.writeFileSync(dest,run(['exec-out','screencap','-p']));
 const rowsFile=path.join(root,'mobile-metadata.json'),rows=(fs.existsSync(rowsFile)?JSON.parse(fs.readFileSync(rowsFile)):[]).filter(r=>r.filename!==file||r.folder!==folder);
 rows.push({filename:file,folder,role,feature:name.replaceAll('_',' '),route:'Native Android / '+name,incident:'',seeded,accountRole:role,sequence:rows.length+1,section:name,width:1080,height:2400,subsection:'B. System Implementation and Functional Evaluation',caption:`LUNAS ${name.replaceAll('_',' ')} on the native Android application.`,timestamp:new Date().toISOString(),status:'Captured',notes:'Native emulator-5554 viewport. Local synthetic account; no real repairs implied.'});
 fs.writeFileSync(rowsFile,JSON.stringify(rows,null,2));console.log('Captured',file);
}
