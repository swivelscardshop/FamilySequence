export function portraitFor(player:any){if(['meiye','white-hat'].includes(player.portrait))return player.portrait;return /^meiye$/i.test((player.name||'').trim())?'meiye':'';}
export function winningPlayers(players:any[],winner:string){return players.filter((p,i)=>!p.vacant&&(p.team||(i%2?'green':'blue'))===winner);}
