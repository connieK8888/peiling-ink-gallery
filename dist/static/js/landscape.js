import {loadImage} from './data.js';
import {createLandscapeScene,JOURNEY_DURATION} from './landscape-scene.js?v=3';
const canvas=document.getElementById('journey-canvas'),play=document.getElementById('journey-play'),replay=document.getElementById('journey-replay'),phase=document.getElementById('journey-phase');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const intro=new URLSearchParams(location.search).get('intro')==='1';
let scene,elapsed=0,last=0,frame=0,playing=!reduced.matches,alive=true;
function controls(){play.textContent=playing?'暫停':elapsed>=JOURNEY_DURATION?'已走過山水':'繼續';play.setAttribute('aria-pressed',String(playing));}
function paint(){if(!scene)return;const p=scene.draw(canvas,elapsed);phase.textContent=p.phase;controls();}
function resize(){const r=canvas.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,1.5);canvas.width=Math.max(1,Math.round(r.width*d));canvas.height=Math.max(1,Math.round(r.height*d));paint();}
function stop(){cancelAnimationFrame(frame);frame=0;last=0;}
function schedule(){stop();controls();if(alive&&scene&&playing&&!document.hidden)frame=requestAnimationFrame(tick);}
function tick(time){frame=0;if(!playing||document.hidden||!alive)return;if(!last)last=time;const dt=(time-last)/1000;if(dt>=1/30){elapsed=Math.min(JOURNEY_DURATION,elapsed+Math.min(dt,.1));last=time;paint();}if(elapsed>=JOURNEY_DURATION){playing=false;controls();if(intro)location.replace('work.html?art=landscape');return;}frame=requestAnimationFrame(tick);}
play.addEventListener('click',()=>{if(!scene)return;if(elapsed>=JOURNEY_DURATION)elapsed=0;playing=!playing;paint();schedule();});
replay.addEventListener('click',()=>{if(!scene)return;elapsed=0;playing=true;paint();schedule();});
document.addEventListener('visibilitychange',schedule);
reduced.addEventListener('change',e=>{if(e.matches){playing=false;elapsed=JOURNEY_DURATION;paint();schedule();}});
const observer=new ResizeObserver(resize);observer.observe(canvas);
window.addEventListener('pagehide',e=>{if(!e.persisted){alive=false;stop();observer.disconnect();}});
Promise.all([loadImage('assets/works/landscape/scan-2026.jpg'), ...Array.from({length:3},(_,i)=>loadImage(`assets/works/landscape/journey/third-${i+1}.png`))]).then(([image,...layers])=>{
 if(!alive)return;scene=createLandscapeScene(image,undefined,layers);if(reduced.matches)elapsed=JOURNEY_DURATION;
 document.getElementById('journey-loading').hidden=true;play.disabled=false;replay.disabled=false;resize();document.querySelector('.journey-stage').classList.add('is-ready');schedule();
}).catch(()=>{document.getElementById('journey-loading').textContent='山水暫時無法載入，請由下方連結欣賞原作。';});
