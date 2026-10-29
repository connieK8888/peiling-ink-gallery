import test from 'node:test';
import assert from 'node:assert/strict';
import {journeyPose,JOURNEY_DURATION} from '../dist/static/js/landscape-scene.js';
test('journey moves through near scenery, mist, then returns to the authentic full painting',()=>{
  let prior=0;
  for(let t=0;t<=JOURNEY_DURATION;t+=.25){const p=journeyPose(t);assert.ok(p.travel>=prior);prior=p.travel;for(const k of ['veil','reveal'])assert.ok(p[k]>=0&&p[k]<=1);assert.ok(p.travel<1.7,'camera never crosses the nearest picture plane');}
  assert.equal(journeyPose(0).phase,'入林');assert.equal(journeyPose(17).phase,'見山不是山');
  assert.equal(journeyPose(24).veil,1);assert.equal(journeyPose(31).reveal,1);assert.equal(journeyPose(36).veil,0);assert.equal(journeyPose(36).ended,true);assert.equal(journeyPose(-5).travel,0);
});

test('upright near/middle/far planes remain inside desktop and phone stages throughout the journey',async()=>{
 const {landscapeLayout}=await import('../dist/static/js/landscape-scene.js');
 for(const [w,h] of [[400,858],[280,600],[870,1865]])for(let t=0;t<=36;t+=.5){
  const {base,planes}=landscapeLayout(w,h,t);
  for(const r of [base,...planes]){assert.ok(r.x>=0&&r.y>=0);assert.ok(r.x+r.width<=w&&r.y+r.height<=h);assert.ok(Math.abs(r.width/r.height-870/1865)<1e-10);}
  assert.deepEqual(planes.map(p=>p.depth),['far','middle','near']);
 }
});
