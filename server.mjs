import http from 'node:http';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {action,view} from './game.mjs';
import {VoiceStore} from './voice-store.mjs';
const voice=new VoiceStore();
const root=path.dirname(fileURLToPath(import.meta.url));
// Each server process starts with a clean table; old disk snapshots are never loaded.
let g={players:[],phase:'lobby',log:[]};
const heartbeatMs=Number(process.env.HEARTBEAT_TIMEOUT_MS||900000);
const closeGraceMs=Number(process.env.CLOSE_GRACE_MS||900000);
const seen=new Map(g.players.filter(p=>p.token).map(p=>[p.token,{at:Date.now()}]));

function release(token){
 const i=g.players.findIndex(p=>p.token===token);if(i<0)return;
 seen.delete(token);
 if(g.phase==='lobby')g.players.splice(i,1);
 else g.players[i]={name:'',team:g.players[i].team,vacant:true};
 if(g.hostToken===token)g.hostToken=g.players.find(p=>p.token)?.token;
 if(!g.players.some(p=>p.token)){g={players:[],phase:'lobby',log:[]};voice.reset();}
 
}
function sweep(){const now=Date.now();for(const [token,p] of seen)if(p.closeAt?now>p.closeAt:now-p.at>heartbeatMs)release(token);}
setInterval(sweep,1000).unref();
const send=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
const server=http.createServer(async(req,res)=>{
res.setHeader('Cache-Control','no-store, max-age=0');res.setHeader('Pragma','no-cache');res.setHeader('Expires','0');
res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','same-origin');res.setHeader('X-Frame-Options','DENY');
if(req.url==='/healthz'){res.writeHead(200,{'Content-Type':'text/plain'});return res.end('ok');}
let url;try{url=new URL(req.url,'http://localhost');}catch{return send(res,400,{error:'Invalid URL.'});}
if(url.pathname==='/api/voice'||url.pathname.startsWith('/api/voice/')){
 sweep();const token=req.headers['x-player-token'];let player=g.players.find(p=>p.token===token);
 if(!player||!token)return send(res,403,{error:'請先加入遊戲。'});
 if(req.headers.origin&&req.headers.origin!==`${req.headers['x-forwarded-proto']||'http'}://${req.headers.host}`)return send(res,403,{error:'請求來源不符。'});
 if(req.method==='GET'){
 if(url.pathname==='/api/voice')return send(res,200,voice.list());
 const clip=voice.clips.get(url.pathname.slice('/api/voice/'.length));if(!clip)return send(res,404,{error:'語音已清除。'});
 res.writeHead(200,{'Content-Type':clip.mime,'Content-Length':clip.bytes.length,'Cache-Control':'no-store'});return res.end(clip.bytes);
 }
 if(req.method!=='POST'||url.pathname!=='/api/voice')return send(res,405,{error:'Method not allowed.'});
 const roomId=voice.roomId;if(req.headers['x-room-id']!==roomId)return send(res,409,{error:'遊戲桌已重設，請重新錄音。'});
 try{const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>1100000)return send(res,413,{error:'每段語音最長 30 秒，檔案不可超過 1.1 MB。'});chunks.push(chunk);}
 player=g.players.find(p=>p.token===token);if(!player||voice.roomId!==roomId)return send(res,409,{error:'你已離開或遊戲桌已重設。'});
 const message=voice.add({token,name:player.name,team:player.team,id:req.headers['x-message-id'],mime:req.headers['content-type'],duration:Number(req.headers['x-duration']),bytes:Buffer.concat(chunks)});
 return send(res,200,{message});}catch(e){return send(res,400,{error:e.message});}
}
if(url.pathname==='/api/game'){
 if(req.method!=='POST')return send(res,405,{error:'POST required.'});
 if(req.headers.origin&&req.headers.origin!==`${req.headers['x-forwarded-proto']||'http'}://${req.headers.host}`)return send(res,403,{error:'請求來源不符，請從遊戲網址操作。'});
 try{
 let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>8192)return send(res,413,{error:'Request too large.'});}
 const b=JSON.parse(raw);if(typeof b.token!=='string'||b.token.length<20||b.token.length>100)throw Error('玩家連線資料無效，請重新整理。');
 // No awaits between reading state and saving: seat assignment and moves are serialized.
 sweep();
 if(b.action==='disconnect'||b.action==='away'){const p=seen.get(b.token);if(p)p.closeAt=Date.now()+closeGraceMs;const player=g.players.find(p=>p.token===b.token);if(player)player.away=true;return send(res,200,{ok:true});}
 if(b.action==='leave'){release(b.token);return send(res,200,{reset:true});}
 if(b.action==='newgame'){g={players:[],phase:'lobby',log:[]};seen.clear();voice.reset();return send(res,200,{reset:true});}
 const next=structuredClone(g);
 if(b.action==='reset'){if(next.hostToken!==b.token)throw Error('只有房主可以重設遊戲桌。');g={players:[],phase:'lobby',log:[]};seen.clear();voice.reset();return send(res,200,{reset:true});}
 if(b.action==='join'){
   if(!next.players.some(p=>p.token===b.token)){
    if(next.players.filter(p=>!p.vacant).length>=4)throw Error('四個座位已滿。');
    if(!['blue','green'].includes(b.team))throw Error('請選擇藍隊或綠隊。');
    if(next.players.filter((p,i)=>!p.vacant&&(p.team||(i%2?'green':'blue'))===b.team).length>=2)throw Error((b.team==='blue'?'藍隊':'綠隊')+'已滿，請選擇另一隊。');
    if(typeof b.name!=='string'||!b.name.trim())throw Error('請輸入你的名字。');
    const player={name:b.name.trim().slice(0,24),token:b.token,team:b.team,portrait:['meiye','white-hat'].includes(b.portrait)?b.portrait:''};
    const vacant=next.players.findIndex(p=>p.vacant&&p.team===b.team);
    if(vacant>=0)next.players[vacant]=player;else if(next.phase==='lobby')next.players.push(player);else throw Error('請選擇有空位的隊伍。');
    next.hostToken ||= b.token;
   }
 }else{
   if(!next.players.some(p=>p.token===b.token))throw Error('請輸入名字並加入遊戲。');
   next.players.find(p=>p.token===b.token).away=false;if(b.action!=='state')action(next,b.token,b);
 }
 seen.set(b.token,{at:Date.now()});
 g=next;
 return send(res,200,view(g,b.token));
 }catch(e){return send(res,400,{error:e.message||'無效的操作。'});}
}
if(req.method!=='GET'&&req.method!=='HEAD')return send(res,405,{error:'Method not allowed.'});
const files={'/':'index.html','/app.js':'app.js','/app.css':'app.css','/balloon-photo.jpg':'balloon-photo.jpg'};const f=files[url.pathname];
if(!f)return send(res,404,{error:'Not found.'});
try{const bytes=readFileSync(path.join(root,'public',f));res.writeHead(200,{'Content-Type':f.endsWith('.jpg')?'image/jpeg':f.endsWith('.html')?'text/html; charset=utf-8':f.endsWith('.css')?'text/css; charset=utf-8':'text/javascript; charset=utf-8','Cache-Control':'no-store, max-age=0'});res.end(req.method==='HEAD'?undefined:bytes);}catch{return send(res,500,{error:'Missing frontend build.'});}
});
server.listen(Number(process.env.PORT||3000),process.env.HOST||'0.0.0.0',()=>console.log('Sequence Table listening on port '+server.address().port));
