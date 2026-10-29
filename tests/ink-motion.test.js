import test from 'node:test';
import assert from 'node:assert/strict';
import { InkDiffusion, prepareWriting, drawWriting } from '../dist/static/js/ink-motion.js';

test('pigment spreads away from its source, evolves and resets without changing letter pixels',()=>{
  const w=24,h=24,source=new Float32Array(w*h);source[12*w+12]=1;
  const flow=new InkDiffusion(w,h,source);
  for(let i=0;i<120;i++)flow.step(1/30,i/30);
  assert.ok(flow.current[12*w+12]>0);
  assert.ok(flow.current.some((value,i)=>i!==12*w+12&&value>0),'pigment transported beyond its injection point');
  assert.ok(flow.current.every(x=>Number.isFinite(x)&&x>=0&&x<=1));
  const previous=flow.current.slice();for(let i=120;i<180;i++)flow.step(1/30,i/30);
  assert.ok(flow.current.some((x,i)=>x!==previous[i]));
  const pixels=new Uint8ClampedArray(w*h*4);flow.pixels(pixels,0);assert.ok(pixels.filter((_,i)=>i%4===3).every(x=>x===0));
  flow.reset();assert.ok(flow.current.every(x=>x===0));
});

test('writing starts blank, ends with the unmasked original and retains a progressive stroke plan',()=>{
  const plan=prepareWriting([[[0,0,.02],[.5,.5,.03]],[[.5,.6,.02],[1,1,.04]]]);
  assert.ok(plan.strokes[1].start>0);assert.ok(plan.total>0);
  const operations=[],ctx={clearRect(){operations.push('clear');},drawImage(src){operations.push(src);}};
  const original={width:100,height:180};
  drawWriting(ctx,original,null,plan,0);assert.deepEqual(operations,['clear']);
  operations.length=0;drawWriting(ctx,original,null,plan,1);assert.deepEqual(operations,['clear',original]);
});
