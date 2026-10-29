import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { scrollStyles, scrollLayout } from '../dist/static/js/scroll.js';

test('scroll preserves portrait and landscape artwork proportions inside the mounting', () => {
  for (const [w, h] of [[6890, 13327], [960, 264]]) {
    for (const style of Object.keys(scrollStyles)) {
    const layout = scrollLayout(w, h, 600, style);
    assert.ok(Math.abs(layout.art.w / layout.art.h - w / h) < 1e-9);
    assert.ok(layout.art.x > layout.body.x);
    assert.ok(layout.art.x + layout.art.w < layout.body.x + layout.body.w);
    assert.ok(layout.art.y + layout.art.h < layout.body.y + layout.body.h);
    if (style === 'classic') assert.ok(layout.art.y - layout.body.y > layout.body.y + layout.body.h - layout.art.y - layout.art.h);
    }
  }
});

test('studio switches frame/scroll, resizes, exports the scroll, then restores the wood frame', async () => {
  const calls = [], elements = new Map();
  const context = new Proxy({}, { get: (_, key) => {
    if (key === 'createLinearGradient') return () => ({ addColorStop() {} });
    if (key === 'createImageData') return (w, h) => ({ data: new Uint8ClampedArray(w * h * 4) });
    return (...args) => calls.push([key, ...args]);
  }});
  class Element {
    constructor(id) {
      this.id = id; this.value = ''; this.style = {}; this.dataset = {}; this.children = [];
      this.attributes = {}; this.events = {}; this.clientWidth = 900; this.clientHeight = 600;
      this.offsetWidth = 150; this.offsetHeight = 240;
      this.classList = { toggle() {} };
    }
    getContext() { return context; }
    setAttribute(k, v) { this.attributes[k] = v; }
    getAttribute(k) { return this.attributes[k]; }
    addEventListener(k, f) { this.events[k] = f; }
    querySelectorAll() { return this.children; }
    append(child) { this.children.push(child); if (!this.value) this.value = child.value; }
    getBoundingClientRect() { return { left: 0, top: 0, width: 900, height: 600 }; }
    toBlob(callback) { callback(new Blob()); }
    click() { calls.push(['download', this.download]); }
    set src(v) {
      this.attributes.src = v; this._src = v; this.complete = true;
      this.naturalWidth = 1000; this.naturalHeight = 2000;
      queueMicrotask(() => { this.events.load?.(); this.onload?.(); });
    }
    get src() { return this._src; }
  }
  const get = (id) => {
    if (!elements.has(id)) elements.set(id, new Element(id));
    return elements.get(id);
  };
  for (const [group, key, values] of [['scroll-styles','scroll',['classic','rounded','offset','bevel']], ['mounts','mount',['frame','scroll']], ['frames','frame',['dark','oak']], ['mats','mat',['ivory','gray']]]) {
    get(group).children = values.map((value) => { const b = new Element(value); b.dataset[key] = value; return b; });
  }
  get('art-size').value = '100'; get('art-position').value = '50'; get('scene').value = 'living';
  globalThis.document = { getElementById: get, querySelector: () => get('studio-controls'), querySelectorAll: () => [], createElement: (tag) => new Element(tag) };
  globalThis.location = { search: '' };
  globalThis.devicePixelRatio = 1;
  globalThis.getComputedStyle = () => ({ borderTopWidth: '14' });
  globalThis.requestAnimationFrame = (f) => { f(); return 1; };
  globalThis.ResizeObserver = class { observe() {} };
  globalThis.Image = class extends Element { constructor() { super('image'); } };
  globalThis.fetch = async (url) => ({ ok: true, json: async () => JSON.parse(await readFile(new URL('../dist/' + url, import.meta.url), 'utf8')) });
  await import('../dist/static/js/studio.js');
  for (let i = 0; i < 30 && !get('room-art-image').src; i++) await new Promise(resolve => setTimeout(resolve, 5));
  assert.ok(get('room-art-image').src);
  get('mounts').children[1].onclick();
  assert.equal(get('wood-options').hidden, true);
  assert.equal(get('mat').hidden, true);
  assert.equal(get('scroll-material').hidden, false);
  const firstHeight = parseFloat(get('room-art').style.height);
  get('art-size').value = '135'; get('art-size').events.input();
  assert.ok(parseFloat(get('room-art').style.height) > firstHeight);
  get('mats').children[1].onclick();
  assert.equal(get('scroll-options').hidden, false);
  for (const button of get('scroll-styles').children) {
    button.onclick();
    await get('save-preview').onclick();
    assert.ok(calls.some(([key, text]) => key === 'fillText' && String(text).includes('掛軸・' + scrollStyles[button.dataset.scroll].name + '／暖灰裱料')));
  }
  assert.ok(calls.some(([key]) => key === 'download'));
  get('mounts').children[0].onclick();
  assert.equal(get('wood-options').hidden, false);
  assert.equal(get('scroll-options').hidden, true);
  assert.equal(get('mat').hidden, false);
  assert.equal(get('scroll-material').hidden, true);
  assert.equal(get('room-art').style.width, '');
  assert.ok(get('room-art').style.height.endsWith('%'));
  // Switching from a vertical scroll to a horizontal work must clear scroll state.
  get('mounts').children[1].onclick();
  get('studio-art').value = 'shusu'; get('studio-art').events.input();
  assert.equal(get('mounts').children[1].hidden, true);
  assert.equal(get('mounts').children[1].disabled, true);
  assert.equal(get('mounts').children[0].attributes['aria-pressed'], 'true');
  assert.equal(get('scroll-options').hidden, true);
  assert.equal(get('scroll-material').hidden, true);
  assert.equal(get('wood-options').hidden, false);
  get('mounts').children[1].onclick();
  assert.equal(get('scroll-material').hidden, true);
  await get('save-preview').onclick();
  assert.ok(calls.some(([key,text]) => key === 'fillText' && String(text).includes('臨蜀素帖') && String(text).includes('框／')));
  get('studio-art').value = 'wang'; get('studio-art').events.input();
  assert.equal(get('mounts').children[1].hidden, false);
  assert.equal(get('mounts').children[1].disabled, false);
  get('mounts').children[1].onclick();
  assert.equal(get('scroll-material').hidden, false);

});
