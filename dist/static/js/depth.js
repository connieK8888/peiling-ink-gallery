// One video contains both the approved ink animation and its soundtrack.
const video=document.getElementById('flower-video');
const player=document.getElementById('flower-player');
const button=document.getElementById('flower-play');
const status=document.getElementById('flower-video-status');
let request=0,disposed=false,resumeAfterHidden=false;
function showPlay(){
 button.hidden=false;
 button.setAttribute('aria-label',video.ended?'重播影片與音樂':'播放影片與音樂');
}
async function start(){
 if(disposed)return;
 const ticket=++request;
 if(video.ended)video.currentTime=0;
 status.hidden=true;
 try{
  await video.play();
  if(ticket===request&&!video.paused)button.hidden=true;
 }catch{
  // Keep sound enabled: browsers that block autoplay get the same central play key.
  if(ticket===request){video.pause();showPlay();}
 }
}
function pause(){request++;video.pause();showPlay();}
button.addEventListener('click',start);
video.addEventListener('click',()=>video.paused||video.ended?start():pause());
video.addEventListener('playing',()=>{button.hidden=true;status.hidden=true;});
video.addEventListener('pause',showPlay);
video.addEventListener('ended',()=>{request++;showPlay();});
video.addEventListener('error',()=>{button.hidden=true;status.hidden=false;status.textContent='影片暫時無法載入，請由下方連結欣賞原作。';});
player.addEventListener('keydown',event=>{if(event.target===button)return;if(event.key===' '){event.preventDefault();video.paused||video.ended?start():pause();}});
document.addEventListener('visibilitychange',()=>{
 if(document.hidden){resumeAfterHidden=!video.paused&&!video.ended;pause();}
 else if(resumeAfterHidden){resumeAfterHidden=false;start();}
});
window.addEventListener('pagehide',event=>{pause();if(!event.persisted)disposed=true;});
if(new URLSearchParams(location.search).get('art')==='wang')location.replace('work.html?art=wang');
else if(!matchMedia('(prefers-reduced-motion: reduce)').matches)start();
