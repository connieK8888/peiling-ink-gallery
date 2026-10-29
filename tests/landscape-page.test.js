import test from 'node:test';
import assert from 'node:assert/strict';
test('journey pauses and resumes, stops in a hidden tab, then opens the original after completion',async()=>{
 const frames=new Map();let id=0,destination=null;
 class Element{
  constructor(){this.width=1;this.height=1;this.attributes={};this.handlers={};}
  getContext(){return {save(){},restore(){},drawImage(){},beginPath(){},rect(){},lineTo(){},moveTo(){},closePath(){},clip(){},fillRect(){},translate(){},scale(){},putImageData(){},createRadialGradient:()=>({addColorStop(){}}),createLinearGradient:()=>({addColorStop(){}})};}
  setAttribute(k,v){this.attributes[k]=v;}
  addEventListener(k,fn){this.handlers[k]=fn;}
  getBoundingClientRect(){return {width:800,height:450};}
  click(){this.handlers.click?.();}
 }
 const els=new Map(),get=id=>{if(!els.has(id))els.set(id,new Element());return els.get(id);};const handlers={};
 globalThis.document={hidden:false,getElementById:get,createElement:()=>new Element(),querySelector:()=>({classList:{add(){}}}),addEventListener:(k,fn)=>handlers[k]=fn};
 globalThis.window={addEventListener(){}};globalThis.location={search:'?intro=1',replace:url=>destination=url};globalThis.devicePixelRatio=1;
 globalThis.matchMedia=()=>({matches:false,addEventListener(){}});globalThis.ResizeObserver=class{observe(){}};
 globalThis.requestAnimationFrame=fn=>{frames.set(++id,fn);return id;};globalThis.cancelAnimationFrame=id=>frames.delete(id);
 globalThis.Image=class{set src(v){queueMicrotask(()=>this.onload());}};
 await import('../dist/static/js/landscape.js?test');for(let i=0;i<10;i++)await Promise.resolve();
 assert.equal(get('journey-loading').hidden,true);assert.equal(frames.size,1);
 get('journey-play').click();assert.equal(frames.size,0);
 get('journey-play').click();assert.equal(frames.size,1);
 document.hidden=true;handlers.visibilitychange();assert.equal(frames.size,0);assert.equal(destination,null);
 document.hidden=false;handlers.visibilitychange();
 let time=100;for(let i=0;i<1100&&frames.size;i++){const [id,fn]=frames.entries().next().value;frames.delete(id);fn(time);time+=40;}
 assert.equal(destination,'work.html?art=landscape');assert.equal(frames.size,0);assert.equal(get('journey-phase').textContent,'見山仍是山');
 get('journey-replay').click();assert.equal(frames.size,1);assert.equal(get('journey-phase').textContent,'入林');
});
