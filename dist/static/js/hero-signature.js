// A downloadable presentation image includes the seal and explicit attribution.
// This is separate from the unmodified artwork scans used in the viewer.
const hero=document.getElementById('home');
const stamp=document.getElementById('hero-author-stamp');
let imageUrl=null,revision=0,timer;
function load(src){return new Promise((resolve,reject)=>{const im=new Image();im.crossOrigin='anonymous';im.onload=()=>resolve(im);im.onerror=reject;im.src=src;});}
if(hero&&stamp){
 stamp.addEventListener('click',event=>{if(!imageUrl)event.preventDefault();});
 Promise.all([load('assets/hero.webp'),load('assets/kang-seal-v1.png'),document.fonts?.ready]).then(([art,seal])=>{
  function render(){
   const version=++revision,rect=hero.getBoundingClientRect(),mark=stamp.getBoundingClientRect();
   const canvas=document.createElement('canvas'),factor=Math.min(2,2400/rect.width);
   canvas.width=Math.round(rect.width*factor);canvas.height=Math.round(rect.height*factor);
   const c=canvas.getContext('2d');c.scale(factor,factor);
   const [px,py]=getComputedStyle(hero.querySelector('.hero-image')).backgroundPosition.split(' ').map(v=>parseFloat(v)/100);
   const zoom=1.04,scale=Math.max(rect.width/art.naturalWidth,rect.height/art.naturalHeight)*zoom;
   const w=art.naturalWidth*scale,h=art.naturalHeight*scale;
   const x=(rect.width-rect.width*zoom)/2+(rect.width*zoom-w)*(Number.isFinite(px)?px:.5);
   const y=(rect.height-rect.height*zoom)/2+(rect.height*zoom-h)*(Number.isFinite(py)?py:.43);
   c.drawImage(art,x,y,w,h);
   c.drawImage(seal,mark.left-rect.left,mark.top-rect.top,mark.width,mark.height);
   const text='康培玲・意臨王鐸書唐詩',fontSize=rect.width<640?14:18,pad=12;
   c.font=`${fontSize}px ${getComputedStyle(document.body).fontFamily}`;
   const tw=c.measureText(text).width,left=rect.width*.05,bottom=rect.height-20;
   c.fillStyle='rgba(245,241,232,.9)';c.fillRect(left-pad,bottom-fontSize-pad,tw+pad*2,fontSize+pad*2);
   c.fillStyle='#632c24';c.fillText(text,left,bottom);
   canvas.toBlob(blob=>{
    if(!blob||version!==revision)return;
    const old=imageUrl;imageUrl=URL.createObjectURL(blob);stamp.href=imageUrl;
    stamp.download='康培玲_意臨王鐸書唐詩_主視覺.webp';stamp.removeAttribute('aria-disabled');
    if(old)URL.revokeObjectURL(old);
   },'image/webp',.95);
  }
  const schedule=()=>{clearTimeout(timer);timer=setTimeout(render,100);};
  new ResizeObserver(schedule).observe(hero);render();
 }).catch(()=>{stamp.title='康培玲原印';stamp.setAttribute('aria-label','康培玲原印');});
}
