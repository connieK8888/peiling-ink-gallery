// Display-only transport and diffusion of background pigment.
export class InkDiffusion {
  constructor(width, height, source) {
    this.width=width; this.height=height; this.source=source;
    this.current=new Float32Array(width*height); this.next=new Float32Array(width*height);
  }
  reset() { this.current.fill(0); this.next.fill(0); }
  step(dt,time) {
    const w=this.width,h=this.height,a=this.current,b=this.next,speed=Math.min(dt,.05)*18;
    const pulse=.5+.5*(Math.sin(time*.42)+1)/2;
    for(let y=1;y<h-1;y++) for(let x=1;x<w-1;x++) {
      const vx=Math.sin(y*.085+time*.23)*.8+Math.cos((x+y)*.05)*.35;
      const vy=Math.cos(x*.075-time*.2)*.65-Math.sin((x-y)*.06)*.35;
      const sx=Math.max(0,Math.min(w-1.001,x-vx*speed)),sy=Math.max(0,Math.min(h-1.001,y-vy*speed));
      const ix=Math.floor(sx),iy=Math.floor(sy),fx=sx-ix,fy=sy-iy,p=iy*w+ix;
      const transported=(a[p]*(1-fx)+a[p+1]*fx)*(1-fy)+(a[p+w]*(1-fx)+a[p+w+1]*fx)*fy;
      const i=y*w+x,laplacian=(a[i-1]+a[i+1]+a[i-w]+a[i+w])/4;
      b[i]=Math.min(1,Math.max(0,(transported*.77+laplacian*.23)*.992+this.source[i]*dt*2.4*pulse*(.25+.75*Math.pow(Math.max(0,Math.sin(x*.055+y*.035+time*.55)),2))));
    }
    this.current=b;this.next=a;
  }
  pixels(target,strength) {
    for(let i=0;i<this.current.length;i++) {
      target[i*4]=58;target[i*4+1]=57;target[i*4+2]=47;
      target[i*4+3]=Math.round(Math.min(1,this.current[i])*Math.max(0,Math.min(1,strength))*180);
    }
  }
}

export function prepareWriting(paths) {
  let total=0;
  const strokes=paths.map(points=>{
    let length=0;const lengths=[0];
    for(let i=1;i<points.length;i++){length+=Math.hypot(points[i][0]-points[i-1][0],points[i][1]-points[i-1][1]);lengths.push(length);}
    const weight=Math.max(.012,Math.pow(length,.8)),start=total;total+=weight;
    return {points,lengths,length,weight,start};
  });
  return {strokes,total};
}

export function drawWriting(context,source,mask,plan,progress) {
  const w=source.width,h=source.height;context.clearRect(0,0,w,h);
  if(progress>=1){context.drawImage(source,0,0);return;}
  if(progress<=0)return;
  const c=mask.getContext('2d');c.clearRect(0,0,w,h);c.fillStyle='#fff';c.strokeStyle='#fff';c.lineCap='round';
  const target=progress*plan.total;
  for(const stroke of plan.strokes){
    if(target<=stroke.start)break;
    const fraction=Math.min(1,(target-stroke.start)/stroke.weight),length=stroke.length*fraction,points=stroke.points;
    for(let i=1;i<points.length;i++){
      if(stroke.lengths[i-1]>length)break;
      const a=points[i-1],b=points[i],f=Math.min(1,(length-stroke.lengths[i-1])/Math.max(.000001,stroke.lengths[i]-stroke.lengths[i-1]));
      const x=a[0]+(b[0]-a[0])*f,y=a[1]+(b[1]-a[1])*f;
      c.lineWidth=(a[2]+b[2])*w+3;c.beginPath();c.moveTo(a[0]*w,a[1]*h);c.lineTo(x*w,y*h);c.stroke();
    }
  }
  context.save();context.drawImage(source,0,0);context.globalCompositeOperation='destination-in';context.drawImage(mask,0,0);context.restore();
}

// Concentrated drops make the moving boundary visible on ordinary screens.
export function createInkSources(width, height) {
  const source = new Float32Array(width * height);
  const drops = [[.76, .24], [.91, .59], [.7, .83]];
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    for (const [cx, cy] of drops) {
      const d = (x / width - cx) ** 2 + (y / height - cy) ** 2;
      source[y * width + x] += Math.exp(-d / .003);
    }
  }
  return source;
}

// Each drop grows into a broad pool before it disperses; staggered cycles keep
// the effect visible without flashing the entire background at once.
export function updateInkSources(source, width, height, time) {
  const drops = [[.76,.24,0],[.91,.59,4],[.7,.83,8]].map(([x,y,offset])=>{
    const age=(time+offset)%16;
    return {x,y,radius:.018+.105*Math.min(1,age/6),amount:Math.sin(Math.PI*Math.min(1,age/13))**2};
  });
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    let value=0;
    for(const drop of drops){
      const d=(x/width-drop.x)**2+(y/height-drop.y)**2;
      const distance=Math.sqrt(d),r=drop.radius;
      const core=.6*Math.exp(-d/(r*r));
      const outer=.6*Math.exp(-Math.pow((distance-r*.85)/(r*.14),2));
      const inner=.25*Math.exp(-Math.pow((distance-r*.48)/(r*.12),2));
      value+=(core+outer+inner)*drop.amount;
    }
    source[y*width+x]=value;
  }
}
