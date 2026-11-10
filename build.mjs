import {build} from 'esbuild';
await build({entryPoints:['source/main.tsx'],bundle:true,minify:true,jsx:'automatic',define:{'process.env.NODE_ENV':'"production"'},outfile:'public/app.js'});
await build({entryPoints:['source/game.ts'],platform:'node',format:'esm',outfile:'game.mjs'});
// Render the actual page during rebuilds to catch runtime failures before packaging.
const {createRequire}=await import('node:module');
const require=createRequire(import.meta.url);
const React=require('react');
const {renderToString}=require('react-dom/server');
const checked=await build({entryPoints:['source/page.tsx'],bundle:true,platform:'node',format:'cjs',jsx:'automatic',external:['react','react/*'],write:false});
const mod={exports:{}};
new Function('require','module','exports',checked.outputFiles[0].text)(require,mod,mod.exports);
const html=renderToString(React.createElement(mod.exports.default));
if(!html.includes('加入遊戲')||(html.match(/class="cell /g)||[]).length!==100)throw new Error('Game page render check failed.');
console.log('Game page render check passed.');
