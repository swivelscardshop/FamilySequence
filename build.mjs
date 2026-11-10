import {build} from 'esbuild';
await build({entryPoints:['source/main.tsx'],bundle:true,minify:true,jsx:'automatic',define:{'process.env.NODE_ENV':'"production"'},outfile:'public/app.js'});
await build({entryPoints:['source/game.ts'],platform:'node',format:'esm',outfile:'game.mjs'});
