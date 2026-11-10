import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {once} from 'node:events';
import {BOARD,team} from './game.mjs';
test('private table: no password, four seats, 2v2, deal, privacy, turns, persistence and reset',async()=>{
const dir=mkdtempSync(path.join(tmpdir(),'sequence-test-'));let child;
const start=async()=>{child=spawn(process.execPath,['server.mjs'],{cwd:import.meta.dirname,env:{...process.env,CLOSE_GRACE_MS:'50',DATA_DIR:dir,PORT:'0',HOST:'127.0.0.1'},stdio:['ignore','pipe','pipe']});
// Server prints its assigned listening port, including ephemeral ports used here.
const [buf]=await once(child.stdout,'data');const port=String(buf).match(/port (\d+)/)[1];return 'http://127.0.0.1:'+port;};
try{
let base=await start();const tokens=Array.from({length:5},()=>crypto.randomUUID());
const call=async(action,i=0,extra={})=>{const r=await fetch(base+'/api/game',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action,token:tokens[i],...extra})});return r.json()};
assert.equal((await fetch(base+'/')).status,200);assert.equal((await fetch(base+'/app.js')).status,200);
assert.equal(BOARD.length,100);for(const c of new Set(BOARD.filter(c=>c!=='X')))assert.equal(BOARD.filter(x=>x===c).length,2);
for(let i=0;i<4;i++){let g=await call('join',i,{name:'玩家'+i,team:i<2?'green':'blue'});assert.equal(g.seat,i);assert.equal(g.players[i].team,i<2?'green':'blue');if(i===1)assert((await call('join',4,{name:'額外綠隊',team:'green'})).error);}
assert.deepEqual([0,1,2,3].map(team),['blue','green','blue','green']);assert((await call('join',4,{name:'第五位'})).error);
assert((await call('start',1)).error);let g=await call('start');assert.equal(g.phase,'playing');assert.equal(g.hand.length,6);assert.equal(g.deck,80);assert.deepEqual(g.turnOrder.map(i=>team(i,g)),['blue','green','blue','green']);
for(let i=0;i<4;i++){let v=await call('state',i);assert(!('hands' in v));assert.equal(v.hand.length,6);assert(v.players.every(p=>!p.token));}
assert((await call('play',(g.turn+1)%4,{card:0,cell:1})).error);
const seat=g.turn;const v=await call('state',seat);let played=false;for(let ci=0;ci<v.hand.length&&!played;ci++){const c=v.hand[ci];if(['JS','JH'].includes(c))continue;const cell=BOARD.findIndex(x=>x!=='X'&&(['JC','JD'].includes(c)||c===x));if(cell>=0){g=await call('play',seat,{card:ci,cell});assert(!g.error);assert.equal(g.chips[cell],team(seat,g));assert.equal(g.hand.length,6);played=true;}}assert(played);
await call('disconnect',3);await new Promise(r=>setTimeout(r,1100));
let paused=await call('state');assert.equal(paused.paused,true);assert.equal(paused.players[3].vacant,true);assert(paused.chips.some(Boolean));
let replacement=await call('join',4,{name:'補位玩家',team:'blue'});assert.equal(replacement.seat,3);assert.equal(replacement.paused,false);assert.equal(replacement.hand.length,6);
await call('disconnect',4);await call('state',4);await new Promise(r=>setTimeout(r,1100));assert.equal((await call('state',4)).seat,3);
child.kill();await once(child,'exit');base=await start();g=await call('state');assert.equal(g.phase,'playing');assert(g.chips.some(Boolean));assert((await call('reset',1)).error);assert((await call('reset')).reset);g=await call('join',4,{name:'新玩家',team:'blue'});assert.equal(g.seat,0);assert.equal(g.players.length,1);assert((await call('leave',4)).reset);assert.equal((await call('join',0,{name:'返回',team:'green'})).players.length,1);
}finally{if(child?.exitCode===null){child.kill();await once(child,'exit');}rmSync(dir,{recursive:true,force:true});}
});
