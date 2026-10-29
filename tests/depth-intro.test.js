import test from 'node:test';
import assert from 'node:assert/strict';
import {mountPlayer} from './flower-player-harness.js';

test('gallery intro stays on the completed video with replay, rather than redirecting automatically',async()=>{
 const p=await mountPlayer({query:'?art=flower&intro=1'});
 p.video.currentTime=20;p.video.ended=true;p.video.paused=true;p.video.emit('ended');
 assert.equal(p.destination(),null);assert.equal(p.button.hidden,false);assert.equal(p.button.attributes['aria-label'],'重播影片與音樂');
});

test('reduced-motion visitors start with the play key; old Wang links open its original viewer without sound',async()=>{
 const reduced=await mountPlayer({reduced:true});assert.equal(reduced.video.playCalls,0);assert.equal(reduced.button.hidden,false);
 const wang=await mountPlayer({query:'?art=wang'});assert.equal(wang.video.playCalls,0);assert.equal(wang.destination(),'work.html?art=wang');
});
