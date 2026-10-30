import test from 'node:test';
import assert from 'node:assert/strict';
import {frameLayout} from '../dist/static/js/frame-layout.js';
import {woodMaterials} from '../dist/static/js/wood.js';

test('every frame preserves the full artwork and equal mat, within portrait and narrow landscape previews', () => {
  for (const [iw, ih] of [[6890,13327], [960,264]]) for (const width of [180,300,650]) {
    for (const material of Object.values(woodMaterials)) for (const mat of [.04,.1,.18]) {
      const l=frameLayout(iw,ih,360,width,mat,material.railRatio);
      assert.ok(l.width <= width + 1e-8 && l.height <= 360 + 1e-8);
      assert.ok(Math.abs(l.artWidth/l.artHeight-iw/ih) < 1e-9);
      assert.ok(Math.abs(l.width-l.artWidth-2*l.mat-2*l.rail) < 1e-8);
      assert.ok(Math.abs(l.height-l.artHeight-2*l.mat-2*l.rail) < 1e-8);
    }
  }
  assert.equal(frameLayout(0,100,300,300),null);
});
