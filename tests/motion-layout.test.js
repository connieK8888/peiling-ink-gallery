import test from 'node:test';
import assert from 'node:assert/strict';
import {motionLayout} from '../dist/static/js/motion-layout.js';

test('side composition keeps authentic glyph proportions and room for ink on desktop and phone',()=>{
  for(const [w,h] of [[1200,760],[800,600],[375,500],[320,430]]){
    const layout=motionLayout(w,h,.76,true),ink=layout.ink;
    assert.ok(layout.width<=w&&layout.height<=h);
    assert.ok(ink.x>=0&&ink.y>=0&&ink.y+ink.height<=layout.height);
    assert.ok(ink.x+ink.width<layout.width*.62,'glyphs remain on one side');
    assert.ok(Math.abs(ink.width/ink.height-.76)<1e-8,'no distortion of original strokes');
  }
});
test('Wang retains the complete static crop rather than the side-composition treatment',()=>{
  const layout=motionLayout(1000,700,.58,false);
  assert.equal(layout.ink.x,0);assert.equal(layout.ink.y,0);
  assert.equal(layout.ink.width,layout.width);assert.equal(layout.ink.height,layout.height);
});
