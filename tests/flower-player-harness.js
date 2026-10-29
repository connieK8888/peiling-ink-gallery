export async function mountPlayer({query='',blocked=false,reduced=false}={}){
 const nodes=new Map(),documentEvents={},windowEvents={};let destination=null;
 class Element{
  constructor(){this.hidden=false;this.attributes={};this.events={};this.paused=true;this.ended=false;this._time=0;this.playCalls=0;}
  setAttribute(k,v){this.attributes[k]=v;}
  addEventListener(k,fn){(this.events[k]??=[]).push(fn);}
  emit(k,event={}){for(const fn of this.events[k]||[])fn(event);}
  play(){this.playCalls++;if(blocked)return Promise.reject(new Error('NotAllowedError'));this.paused=false;this.emit('playing');return Promise.resolve();}
  pause(){this.paused=true;this.emit('pause');}
  set currentTime(t){this._time=t;this.ended=false;}get currentTime(){return this._time;}
  click(){this.emit('click');}
 }
 const get=id=>{if(!nodes.has(id))nodes.set(id,new Element());return nodes.get(id);};
 globalThis.document={hidden:false,getElementById:get,addEventListener:(k,fn)=>documentEvents[k]=fn};
 globalThis.window={addEventListener:(k,fn)=>windowEvents[k]=fn};
 globalThis.location={search:query,replace:url=>destination=url};
 globalThis.matchMedia=()=>({matches:reduced});
 await import(`../dist/static/js/depth.js?player-test=${Math.random()}`);
 await Promise.resolve();await Promise.resolve();
 return {video:get('flower-video'),button:get('flower-play'),player:get('flower-player'),status:get('flower-video-status'),documentEvents,windowEvents,setBlocked:v=>blocked=v,destination:()=>destination};
}
