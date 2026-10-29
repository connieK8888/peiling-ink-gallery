// Preserve the painting's upright composition and its bottom-to-top depth order.
export const JOURNEY_DURATION = 36;
export const PAINTING_SIZE = {width:870,height:1865};
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const smooth=(a,b,v)=>{const t=clamp((v-a)/(b-a));return t*t*(3-2*t);};
export function journeyPose(time){
 const t=clamp(time,0,JOURNEY_DURATION);
 return {travel:1.28*smooth(0,25,t),reveal:smooth(25,31,t),veil:smooth(15,24,t)*(1-smooth(26,31,t)),phase:t<8?'入林':t<16?'行至山間':t<26?'見山不是山':'見山仍是山',ended:t>=36};
}
// All rectangles fit inside the stage, even at maximum travel on narrow screens.
export function landscapeLayout(w,h,time){
 const p=journeyPose(time),progress=p.travel/1.28;
 const fit=Math.min(w*.86/870,h*.90/1865),width=870*fit,height=1865*fit;
 const base={x:(w-width)/2,y:(h-height)/2,width,height};
 const planes=[['far',.014,-.003],['middle',.032,.003],['near',.055,.008]].map(([depth,growth,drift])=>{
  const scale=1+growth*progress,pw=width*scale,ph=height*scale;
  return {depth,x:(w-pw)/2,y:(h-ph)/2+height*drift*progress,width:pw,height:ph};
 });
 return {base,planes};
}
export function createLandscapeScene(image,makeCanvas=()=>document.createElement('canvas'),preparedLayers=null){
 const source=makeCanvas();source.width=870;source.height=1865;
 source.getContext('2d').drawImage(image,5,5,870,1865,0,0,870,1865);
 function band(index){
  if(preparedLayers)return preparedLayers[index];
  const layer=makeCanvas();layer.width=870;layer.height=1865;
  const c=layer.getContext('2d');c.drawImage(source,0,0);
  c.globalCompositeOperation='destination-in';
  const mask=c.createLinearGradient(0,0,0,1865),feather=.035;
  const start=index/3,end=(index+1)/3;
  if(index>0){mask.addColorStop(0,'transparent');mask.addColorStop(start-feather,'transparent');mask.addColorStop(start+feather,'#000');}else mask.addColorStop(0,'#000');
  if(index<2){mask.addColorStop(end-feather,'#000');mask.addColorStop(end+feather,'transparent');mask.addColorStop(1,'transparent');}else mask.addColorStop(1,'#000');
  c.fillStyle=mask;c.fillRect(0,0,870,1865);c.globalCompositeOperation='source-over';return layer;
 }
 const layers=[0,1,2].map(band);
 const paper='242,237,219';
 function mist(c,rect,time,strength,level){
  for(let i=0;i<8;i++){
   const x=rect.x+rect.width*((i*.173+time*.002*(i%2?1:-1)+1)%1),y=rect.y+rect.height*(level+.05*Math.sin(i*1.93+time*.12));
   c.save();c.translate(x,y);c.scale(1,.28);const r=rect.width*(.38+.08*Math.sin(i*3));
   const g=c.createRadialGradient(0,0,0,0,0,r);g.addColorStop(0,`rgba(${paper},${strength})`);g.addColorStop(.5,`rgba(${paper},${strength*.6})`);g.addColorStop(1,`rgba(${paper},0)`);c.fillStyle=g;c.fillRect(-r,-r,2*r,2*r);c.restore();
  }
 }
 function draw(canvas,time){
  const c=canvas.getContext('2d'),w=canvas.width,h=canvas.height,p=journeyPose(time),layout=landscapeLayout(w,h,time),b=layout.base;
  c.fillStyle=`rgb(${paper})`;c.fillRect(0,0,w,h);
  // Original underneath the feathered bands preserves the original paper and continuity.
  c.globalAlpha=.48*(1-p.reveal);c.drawImage(source,b.x,b.y,b.width,b.height);c.globalAlpha=1;
  layout.planes.forEach((r,i)=>{c.globalAlpha=1-p.reveal;c.drawImage(layers[i],r.x,r.y,r.width,r.height);c.globalAlpha=1;});
  mist(c,b,time,.06+.27*p.veil,1/3);mist(c,b,time+4,.05+.23*p.veil,2/3);
  c.fillStyle=`rgba(${paper},${p.veil*.60*(1-p.reveal)})`;c.fillRect(b.x,b.y,b.width,b.height);
  if(p.reveal>0){c.fillStyle=`rgba(${paper},${p.reveal})`;c.fillRect(0,0,w,h);c.globalAlpha=p.reveal;c.drawImage(source,b.x,b.y,b.width,b.height);c.globalAlpha=1;}
  return p;
 }
 return {draw,source,layers};
}
