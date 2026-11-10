import http from 'node:http';
import {readFileSync,writeFileSync,mkdirSync,renameSync,existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {action,view} from './game.mjs';
const root=path.dirname(fileURLToPath(import.meta.url));
const dir=path.resolve(process.env.DATA_DIR||path.join(root,'data'));mkdirSync(dir,{recursive:true});
const file=path.join(dir,'table.json');
let g=existsSync(file)?JSON.parse(readFileSync(file,'utf8')):{players:[],phase:'lobby',log:[]};
g.players.forEach((p,i)=>{p.team ||= i%2?'green':'blue';});
if(g.phase==='playing'&&!g.turnOrder)g.turnOrder=[0,1,2,3];
g.hostToken ||= g.players.find(p=>p.token)?.token;
const heartbeatMs=Number(process.env.HEARTBEAT_TIMEOUT_MS||60000);
const closeGraceMs=Number(process.env.CLOSE_GRACE_MS||10000);
const seen=new Map(g.players.filter(p=>p.token).map(p=>[p.token,{at:Date.now()}]));
const save=()=>{writeFileSync(file+'.tmp',JSON.stringify(g),{mode:0o600});renameSync(file+'.tmp',file);};
function release(token){
 const i=g.players.findIndex(p=>p.token===token);if(i<0)return;
 seen.delete(token);
 if(g.phase==='lobby')g.players.splice(i,1);
 else g.players[i]={name:'',team:g.players[i].team,vacant:true};
 if(g.hostToken===token)g.hostToken=g.players.find(p=>p.token)?.token;
 if(!g.players.some(p=>p.token))g={players:[],phase:'lobby',log:[]};
 save();
}
function sweep(){const now=Date.now();for(const [token,p] of seen)if(now-p.at>heartbeatMs||(p.closeAt&&now>p.closeAt))release(token);}
setInterval(sweep,1000).unref();
const send=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
const server=http.createServer(async(req,res)=>{
res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','same-origin');res.setHeader('X-Frame-Options','DENY');
if(req.url==='/healthz'){res.writeHead(200,{'Content-Type':'text/plain'});return res.end('ok');}
let url;try{url=new URL(req.url,'http://localhost');}catch{return send(res,400,{error:'Invalid URL.'});}
if(url.pathname==='/api/game'){
 if(req.method!=='POST')return send(res,405,{error:'POST required.'});
 if(req.headers.origin&&req.headers.origin!==`${req.headers['x-forwarded-proto']||'http'}://${req.headers.host}`)return send(res,403,{error:'請求來源不符，請從遊戲網址操作。'});
 try{
 let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>8192)return send(res,413,{error:'Request too large.'});}
 const b=JSON.parse(raw);if(typeof b.token!=='string'||b.token.length<20||b.token.length>100)throw Error('玩家連線資料無效，請重新整理。');
 // No awaits between reading state and saving: seat assignment and moves are serialized.
 sweep();
 if(b.action==='disconnect'){const p=seen.get(b.token);if(p)p.closeAt=Date.now()+closeGraceMs;return send(res,200,{ok:true});}
 if(b.action==='leave'){release(b.token);return send(res,200,{reset:true});}
 const next=structuredClone(g);
 if(b.action==='reset'){if(next.hostToken!==b.token)throw Error('只有房主可以重設遊戲桌。');g={players:[],phase:'lobby',log:[]};seen.clear();save();return send(res,200,{reset:true});}
 if(b.action==='join'){
   if(!next.players.some(p=>p.token===b.token)){
    if(next.players.filter(p=>!p.vacant).length>=4)throw Error('四個座位已滿。');
    if(!['blue','green'].includes(b.team))throw Error('請選擇藍隊或綠隊。');
    if(next.players.filter((p,i)=>!p.vacant&&(p.team||(i%2?'green':'blue'))===b.team).length>=2)throw Error((b.team==='blue'?'藍隊':'綠隊')+'已滿，請選擇另一隊。');
    if(typeof b.name!=='string'||!b.name.trim())throw Error('請輸入你的名字。');
    const player={name:b.name.trim().slice(0,24),token:b.token,team:b.team};
    const vacant=next.players.findIndex(p=>p.vacant&&p.team===b.team);
    if(vacant>=0)next.players[vacant]=player;else if(next.phase==='lobby')next.players.push(player);else throw Error('請選擇有空位的隊伍。');
    next.hostToken ||= b.token;
   }
 }else{
   if(!next.players.some(p=>p.token===b.token))throw Error('請輸入名字並加入遊戲。');
   if(b.action!=='state')action(next,b.token,b);
 }
 seen.set(b.token,{at:Date.now()});
 if(b.action!=='state'){g=next;save();}
 return send(res,200,view(g,b.token));
 }catch(e){return send(res,400,{error:e.message||'無效的操作。'});}
}
if(req.method!=='GET'&&req.method!=='HEAD')return send(res,405,{error:'Method not allowed.'});
const files={'/':'index.html','/app.js':'app.js','/app.css':'app.css'};const f=files[url.pathname];
if(!f)return send(res,404,{error:'Not found.'});
try{const bytes=readFileSync(path.join(root,'public',f));res.writeHead(200,{'Content-Type':f.endsWith('.html')?'text/html; charset=utf-8':f.endsWith('.css')?'text/css; charset=utf-8':'text/javascript; charset=utf-8','Cache-Control':'no-cache'});res.end(req.method==='HEAD'?undefined:bytes);}catch{return send(res,500,{error:'Missing frontend build.'});}
});
server.listen(Number(process.env.PORT||3000),process.env.HOST||'0.0.0.0',()=>console.log('Private Sequence Table listening on port '+server.address().port));
