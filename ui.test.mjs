import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const React=require('react');const {renderToString}=require('react-dom/server');
test('jack eyes and labels, hidden in-game scores, recurring voice and cleanup',async()=>{
 const compiled=await build({entryPoints:['source/page.tsx'],bundle:true,platform:'node',format:'cjs',jsx:'automatic',external:['react','react/*'],write:false});
 const effects=[];let stateIndex=0;const g={roundId:'test',turnSerial:4,phase:'playing',seat:0,turn:0,paused:false,hostSeat:0,players:[{name:'玩家',team:'blue'}],hand:['JC','JD','JH','JS','AS','2H'],chips:Array(100).fill(null),lines:{blue:[],green:[]}};
 g.chips[1]='blue';
 const states=[true,g,'','blue',null,'',false,false,'player-token',true,false];const shim={...React,useState:()=>[states[stateIndex++],()=>{}],useRef:value=>({current:value}),useEffect:(fn,deps)=>effects.push({fn,deps})};
 const mod={exports:{}};new Function('require','module','exports',compiled.outputFiles[0].text)(id=>id==='react'?shim:require(id),mod,mod.exports);
 const html=renderToString(React.createElement(mod.exports.default));
 assert.equal((html.match(/class="jack-eye"/g)||[]).length,6);assert(html.includes('雙眼 J'));assert(html.includes('單眼 J'));assert(html.includes('任意放置'));assert(html.includes('移除對方'));assert(!html.includes('class="panel score"'));assert(html.includes('class="chip-card"'));assert(html.includes('2<!-- -->♠'));
 const originals={window:global.window,document:global.document,SpeechSynthesisUtterance:global.SpeechSynthesisUtterance,setTimeout:global.setTimeout,clearTimeout:global.clearTimeout,setInterval:global.setInterval,clearInterval:global.clearInterval};
 let spoken=[],cancelled=0;const intervals=new Map();let next=1;
 try{
 global.window={speechSynthesis:{cancel(){cancelled++},resume(){},getVoices:()=>[{lang:'zh-TW'}],speak(u){spoken.push(u.text);u.onstart?.();}}};global.document={visibilityState:'visible'};global.SpeechSynthesisUtterance=class{constructor(text){this.text=text}};
 global.setTimeout=()=>next++;global.clearTimeout=()=>{};global.setInterval=(fn,ms)=>{assert.equal(ms,20000);const id=next++;intervals.set(id,fn);return id;};global.clearInterval=id=>intervals.delete(id);
 const reminder=effects.find(e=>e.fn.toString().includes('setInterval')&&e.deps?.[0]==='test:4:0');assert(reminder);const cleanup=reminder.fn();assert.deepEqual(spoken,['輪到你了，請出牌']);
 const tick=[...intervals.values()][0];tick();tick();assert.equal(spoken.length,3);
 global.document.visibilityState='hidden';tick();assert.equal(spoken.length,3);
 cleanup();assert.equal(intervals.size,0);assert(cancelled>0);
 }finally{for(const [key,value] of Object.entries(originals)){if(value===undefined)delete global[key];else global[key]=value;}}
});

test('drop target uses stationary slots across a row and a wrapped hand',async()=>{
const compiled=await build({entryPoints:['source/hand-order.ts'],platform:'node',format:'cjs',write:false});const mod={exports:{}};new Function('module','exports',compiled.outputFiles[0].text)(mod,mod.exports);
const slots=Array.from({length:6},(_,i)=>({left:i*60,top:0,width:50,height:75}));assert.equal(mod.exports.dropTarget(slots,205,35),3);assert.equal(mod.exports.dropTarget(slots,5,35),0);assert.equal(mod.exports.dropTarget(slots,900,35),5);
const wrapped=slots.map((r,i)=>({...r,left:(i%3)*60,top:Math.floor(i/3)*90}));assert.equal(mod.exports.dropTarget(wrapped,85,110),4);
});
