import test from 'node:test';
import assert from 'node:assert/strict';
import { extractInkPixels, depthPose } from '../dist/static/js/ink-depth.js';

test('depth preview separates paper and ink while retaining source colors and translucent dry strokes', () => {
  const pixels = new Uint8ClampedArray([232,225,210,255, 24,22,20,255, 152,152,152,255, 140,40,38,255, 20,20,20,0]);
  extractInkPixels(pixels);
  assert.equal(pixels[3], 0);
  assert.deepEqual([...pixels.slice(4,8)], [24,22,20,255]);
  assert.ok(pixels[11] > 0 && pixels[11] < 255);
  assert.deepEqual([...pixels.slice(12,16)], [140,40,38,255]);
  assert.equal(pixels[19], 0);
});
test('flat comparison removes all tilt, separation and shadow; view angles remain bounded', () => {
  assert.deepEqual(depthPose(.8,.6,80,true), {rx:0,ry:0,lift:0,wash:0,paper:0,shadow:0});
  const pose = depthPose(9,-8,200,false);
  assert.equal(pose.rx,8); assert.equal(pose.ry,11); assert.equal(pose.lift,80);
  assert.equal(depthPose(1,1,-1,false).lift,0);
});

test('local paper estimate removes a photo shade gradient without altering dark stroke RGB',()=>{
  const w=20,h=20,data=new Uint8ClampedArray(w*h*4);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=(y*w+x)*4;data[i]=data[i+1]=data[i+2]=170+Math.round(x/w*45);data[i+3]=255;}
  const i=(10*w+10)*4;data[i]=data[i+1]=data[i+2]=20;
  extractInkPixels(data,{width:w,height:h});
  assert.equal(data[i+3],255);assert.deepEqual([...data.slice(i,i+3)],[20,20,20]);
  assert.equal(data[3],0);assert.equal(data[(19*w+19)*4+3],0);
});
