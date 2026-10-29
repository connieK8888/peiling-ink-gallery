import test from 'node:test';
import assert from 'node:assert/strict';
import {mountPlayer} from './flower-player-harness.js';
import {readFile} from 'node:fs/promises';

test('single sound-enabled video attempts autoplay, pauses, resumes, and shows central replay after ending',async()=>{
 const {video,button,documentEvents,windowEvents}=await mountPlayer();
 assert.equal(video.playCalls,1);assert.equal(video.paused,false);assert.equal(button.hidden,true);
 video.currentTime=8;video.click();assert.equal(video.paused,true);assert.equal(button.hidden,false);
 button.click();await Promise.resolve();assert.equal(video.currentTime,8);assert.equal(video.paused,false);
 document.hidden=true;documentEvents.visibilitychange();assert.equal(video.paused,true);
 document.hidden=false;documentEvents.visibilitychange();await Promise.resolve();assert.equal(video.currentTime,8);assert.equal(video.paused,false);
 video.currentTime=20;video.ended=true;video.paused=true;video.emit('ended');
 assert.equal(button.hidden,false);assert.equal(button.attributes['aria-label'],'重播影片與音樂');
 button.click();await Promise.resolve();assert.equal(video.currentTime,0);assert.equal(button.hidden,true);
 windowEvents.pagehide({persisted:false});assert.equal(video.paused,true);
});

test('autoplay restriction exposes the same play key and never switches to a silent version',async()=>{
 const p=await mountPlayer({blocked:true});assert.equal(p.video.paused,true);assert.equal(p.button.hidden,false);assert.notEqual(p.video.muted,true);
 p.setBlocked(false);p.button.click();await Promise.resolve();assert.equal(p.video.paused,false);assert.equal(p.button.hidden,true);
 const html=await readFile(new URL('../dist/depth.html',import.meta.url),'utf8');
 assert.match(html,/flower-ink-music-20s\.mp4/);assert.doesNotMatch(html,/music-toggle|replay-motion|flat-view|depth-amount|<audio/);
});
