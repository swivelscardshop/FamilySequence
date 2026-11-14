export class VoiceStore{
 constructor(){this.reset();}
 reset(){this.roomId=crypto.randomUUID();this.messages=[];this.clips=new Map();}
 list(){return {roomId:this.roomId,messages:this.messages};}
 add({token,name,team,id,mime,duration,bytes}){
 if(typeof id!=='string'||!/^[a-zA-Z0-9-]{16,80}$/.test(id))throw Error('錄音識別碼無效。');
 if(!Number.isFinite(duration)||duration<.25||duration>31)throw Error('每段語音最長 30 秒。');
 if(bytes.length<12||bytes.length>1100000)throw Error('語音檔案大小不符。');
 mime=String(mime).split(';')[0].toLowerCase();
 const valid=mime==='audio/wav'?bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WAVE':mime==='audio/mp4'?bytes.toString('ascii',4,8)==='ftyp':mime==='audio/webm'?bytes.subarray(0,4).equals(Buffer.from([0x1a,0x45,0xdf,0xa3])):mime==='audio/ogg'?bytes.toString('ascii',0,4)==='OggS':false;
 if(!valid)throw Error('不支援的語音格式。');
 const old=this.clips.get(id);if(old){if(old.token!==token)throw Error('錄音識別碼重複。');return this.messages.find(m=>m.id===id);}
 const message={id,name,team,duration:Math.min(duration,30),createdAt:Date.now()};this.clips.set(id,{token,mime,bytes});this.messages.push(message);
 while(this.messages.length>20)this.clips.delete(this.messages.shift().id);return message;
 }
}
