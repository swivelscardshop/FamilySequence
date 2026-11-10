export const BOARD = (`X 2S 3S 4S 5S 6S 7S 8S 9S X
6C 5C 4C 3C 2C AH KH QH 10H 10S
7C AS 2D 3D 4D 5D 6D 7D 9H QS
8C KS 6C 5C 4C 3C 2C 8D 8H KS
9C QS 7C 6H 5H 4H AH 9D 7H AS
10C 10S 8C 7H 2H 3H KH 10D 6H 2D
QC 9S 9C 8H 9H 10H QH QD 5H 3D
KC 8S 10C QC KC AC AD KD 4H 4D
AC 7S 6S 5S 4S 3S 2S 2H 3H 5D
X AD KD QD 10D 9D 8D 7D 6D X`).split(/\s+/);
export const team=(s:number,g?:any)=>g?.players?.[s]?.team||(s%2?'green':'blue');
export function shuffle(a:any[]){for(let i=a.length-1;i>0;i--){let j=crypto.getRandomValues(new Uint32Array(1))[0]%(i+1);[a[i],a[j]]=[a[j],a[i]];}return a;}
export function deal(g:any){g.deck=shuffle(Array.from({length:2},()=>['S','H','D','C'].flatMap(s=>['A','2','3','4','5','6','7','8','9','10','J','Q','K'].map(r=>r+s))).flat());g.discard=[];g.hands=g.players.map(()=>g.deck.splice(0,6));g.chips=Array(100).fill(null);g.lines={blue:[],green:[]};g.turn=crypto.getRandomValues(new Uint32Array(1))[0]%4;g.turnOrder=[0,1].flatMap(k=>['blue','green'].map(t=>g.players.map((p:any,i:number)=>team(i,g)===t?i:-1).filter((i:number)=>i>=0)[k]));g.phase='playing';g.exchanged=false;g.log=['已發牌，遊戲開始！'];g.winner=null;}
export function draw(g:any){if(!g.deck.length){g.deck=shuffle(g.discard.splice(0));}return g.deck.pop();}
export function legal(g:any,seat:number,card:string,i:number){if(BOARD[i]==='X'||i<0||i>99)return false;if(card==='JH'||card==='JS')return g.chips[i]&&g.chips[i]!==team(seat,g)&&!Object.values(g.lines).flat(2).includes(i);return !g.chips[i]&&(['JC','JD'].includes(card)||BOARD[i]===card);}
export function sequences(g:any,color:string){const old=g.lines[color];for(const [dr,dc] of [[0,1],[1,0],[1,1],[1,-1]])for(let r=0;r<10;r++)for(let c=0;c<10;c++){const cells=Array.from({length:5},(_,k)=>[r+dr*k,c+dc*k]);if(cells.some(([y,x])=>y<0||x<0||y>9||x>9))continue;const line=cells.map(([y,x])=>y*10+x);if(line.every(i=>BOARD[i]==='X'||g.chips[i]===color)&&old.every((l:number[])=>l.filter(i=>line.includes(i)).length<=1)){old.push(line);if(old.length===2)return;}}}
export function action(g:any,token:string,b:any){let s=g.players.findIndex((p:any)=>p.token===token);if(s<0)throw Error('請先加入遊戲。');if(b.action==='start'||b.action==='rematch'){if(s!==0)throw Error('只有房主可以發牌。');if(g.players.length!==4)throw Error('需要四位玩家入座。');if(b.action==='rematch'&&g.phase!=='finished')throw Error('請先完成本局。');if(b.action==='start'&&g.phase!=='lobby')throw Error('遊戲已經開始。');deal(g);return;}
if(g.phase!=='playing'||s!==g.turn)throw Error('請等待你的回合。');const card=g.hands[s][b.card];if(!card)throw Error('請先選擇一張手牌。');if(b.action==='exchange'){if(card[0]==='J'||BOARD.some((v,i)=>v===card&&!g.chips[i]))throw Error('這張牌不是死牌。');if(g.exchanged)throw Error('每回合只能更換一張死牌。');g.discard.push(card);g.hands[s].splice(b.card,1,draw(g));g.exchanged=true;g.log.unshift(g.players[s].name+' 更換了一張死牌。');return;}
if(b.action!=='play'||!legal(g,s,card,b.cell))throw Error('請選擇發光的格子。');g.chips[b.cell]=['JH','JS'].includes(card)?null:team(s,g);g.discard.push(card);g.hands[s].splice(b.card,1);const next=draw(g);if(next)g.hands[s].push(next);sequences(g,team(s,g));g.log.unshift(g.players[s].name+' 打出了 '+card+'.');g.log=g.log.slice(0,12);if(g.lines[team(s,g)].length>=2){g.winner=team(s,g);g.phase='finished';}else if(g.chips.every((v:any,i:number)=>v||BOARD[i]==='X')){g.phase='finished';g.winner='draw';}else g.turn=g.turnOrder[(g.turnOrder.indexOf(g.turn)+1)%4];g.exchanged=false;}
export function view(g:any,token:string){const seat=g.players.findIndex((p:any)=>p.token===token);return {...g,players:g.players.map((p:any)=>({name:p.name,team:team(g.players.indexOf(p),g)})),deck:g.deck?.length||0,hands:undefined,hand:g.hands?.[seat]||[],seat,discard:g.discard?.slice(-1)||[]};}
