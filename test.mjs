import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {once} from 'node:events';
import {BOARD,team} from './game.mjs';
test('private table: no password, four seats, 2v2, deal, privacy, turns, fresh sessions and new game',async()=>{
const dir=mkdtempSync(path.join(tmpdir(),'sequence-test-'));let child;
const start=async()=>{child=spawn(process.execPath,['server.mjs'],{cwd:import.meta.dirname,env:{...process.env,CLOSE_GRACE_MS:'50',DATA_DIR:dir,PORT:'0',HOST:'127.0.0.1'},stdio:['ignore','pipe','pipe']});
// Server prints its assigned listening port, including ephemeral ports used here.
const [buf]=await once(child.stdout,'data');const port=String(buf).match(/port (\d+)/)[1];return 'http://127.0.0.1:'+port;};
try{
let base=await start();const tokens=Array.from({length:5},()=>crypto.randomUUID());
const call=async(action,i=0,extra={})=>{const r=await fetch(base+'/api/game',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action,token:tokens[i],...extra})});return r.json()};
assert.equal((await fetch(base+'/')).status,200);assert.match((await fetch(base+'/')).headers.get('cache-control'),/no-store/);assert.equal((await fetch(base+'/app.js')).status,200);
assert.equal(BOARD.length,100);for(const c of new Set(BOARD.filter(c=>c!=='X')))assert.equal(BOARD.filter(x=>x===c).length,2);
for(let i=0;i<4;i++){let g=await call('join',i,{name:'玩家'+i,team:i<2?'green':'blue'});assert.equal(g.seat,i);assert.equal(g.players[i].team,i<2?'green':'blue');if(i===1)assert((await call('join',4,{name:'額外綠隊',team:'green'})).error);}
assert.deepEqual([0,1,2,3].map(team),['blue','green','blue','green']);assert((await call('join',4,{name:'第五位'})).error);
assert((await call('start',1)).error);let g=await call('start');assert.equal(g.phase,'playing');assert.equal(g.hand.length,6);assert.equal(g.deck,80);assert.deepEqual(g.turnOrder.map(i=>team(i,g)),['blue','green','blue','green']);
for(let i=0;i<4;i++){let v=await call('state',i);assert(!('hands' in v));assert.equal(v.hand.length,6);assert(v.players.every(p=>!p.token));}
const sortingSeat=(g.turn+1)%4;
const before=await call('state',sortingSeat);const otherBefore=await call('state',g.turn);
const arranged=await call('reorder',sortingSeat,{order:[5,0,1,2,3,4]});
assert.deepEqual(arranged.hand,[before.hand[5],...before.hand.slice(0,5)]);assert.equal(arranged.turn,before.turn);assert.deepEqual(arranged.chips,before.chips);
assert.deepEqual((await call('state',g.turn)).hand,otherBefore.hand);
assert((await call('reorder',sortingSeat,{order:[0,0,1,2,3,4]})).error);
assert.deepEqual((await call('state',sortingSeat)).hand,arranged.hand);assert((await call('reorder',sortingSeat,{order:[5,4,3,2,1,0],expectedHand:['stale']})).error);
assert((await call('play',(g.turn+1)%4,{card:0,cell:1})).error);
const seat=g.turn;const v=await call('state',seat);let played=false;for(let ci=0;ci<v.hand.length&&!played;ci++){const c=v.hand[ci];if(['JS','JH'].includes(c))continue;const cell=BOARD.findIndex(x=>x!=='X'&&(['JC','JD'].includes(c)||c===x));if(cell>=0){g=await call('play',seat,{card:ci,cell});assert(!g.error);assert.equal(g.chips[cell],team(seat,g));assert.equal(g.hand.length,6);played=true;}}assert(played);
await call('disconnect',3);await new Promise(r=>setTimeout(r,1100));
let paused=await call('state');assert.equal(paused.paused,true);assert.equal(paused.players[3].vacant,true);assert(paused.chips.some(Boolean));
let replacement=await call('join',4,{name:'補位玩家',team:'blue'});assert.equal(replacement.seat,3);assert.equal(replacement.paused,false);assert.equal(replacement.hand.length,6);
await call('disconnect',4);await call('state',4);await new Promise(r=>setTimeout(r,1100));assert.equal((await call('state',4)).seat,3);
assert((await call('newgame',3)).reset); // Former player can clear a full/stuck table.
assert((await call('state',0)).error);
for(let i=0;i<4;i++)assert.equal((await call('join',i,{name:'新局'+i,team:i<2?'blue':'green'})).seat,i);
g=await call('start');assert.equal(g.phase,'playing');assert(g.chips.every(c=>c===null));
child.kill();await once(child,'exit');base=await start();assert((await call('state',0)).error);
g=await call('join',4,{name:'重新開始',team:'blue'});assert.equal(g.seat,0);assert.equal(g.players.length,1);assert.equal(g.phase,'lobby');assert(!g.chips);
assert((await call('leave',4)).reset);assert.equal((await call('join',0,{name:'返回',team:'green'})).players.length,1);
assert((await call('leave',0)).reset);assert.equal((await call('join',1,{name:'全員離開後',team:'green'})).players.length,1);
}finally{if(child?.exitCode===null){child.kill();await once(child,'exit');}rmSync(dir,{recursive:true,force:true});}
});
