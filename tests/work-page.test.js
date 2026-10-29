import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

class Element {
  constructor(id) {
    this.id = id;
    this.attributes = {};
    this.children = [];
    this.dataset = {};
    this.style = {};
    this.hidden = false;
    this.offsetLeft = 0;
    this.offsetWidth = 72;
    this.clientWidth = 900;
  }
  setAttribute(key, value) { this.attributes[key] = value; }
  getAttribute(key) { return this.attributes[key]; }
  append(...children) { this.children.push(...children); }
  replaceChildren(...children) { this.children = children; }
  addEventListener() {}
  getBoundingClientRect() { return { width: 900, height: 600, left: 0, top: 0 }; }
  getContext() { return new Proxy({}, { get: () => () => {} }); }
  querySelectorAll() { return this.children; }
  querySelector() { return this.children.find((child) => child.attributes['aria-pressed'] === 'true'); }
  scrollTo() {}
  focus() {}
}

const catalog = JSON.parse(await readFile(new URL('../dist/data/artworks.json', import.meta.url), 'utf8'));
for (const art of catalog.flatMap(art => [art, ...(art.aliases || []).map(alias => ({ ...art, id: alias }))])) {
  const id = art.id;
  test(`work page initializes from the shared catalog: ${id}`, async () => {
    const elements = new Map();
    const get = (key) => {
      if (!elements.has(key)) elements.set(key, new Element(key));
      return elements.get(key);
    };
    const tabs = ['intro', 'note', 'info'].map((name) => {
      const element = get(`tab-${name}`);
      element.setAttribute('aria-controls', `panel-${name}`);
      return element;
    });
    globalThis.document = {
      getElementById: get,
      createElement: (name) => new Element(name),
      querySelectorAll: () => tabs,
    };
    globalThis.window = { addEventListener() {} };
    globalThis.location = { search: `?art=${id}` };
    globalThis.devicePixelRatio = 1;
    globalThis.requestAnimationFrame = () => 1;
    globalThis.cancelAnimationFrame = () => {};
    globalThis.ResizeObserver = class { observe() {} disconnect() {} };
    globalThis.matchMedia = () => ({ matches: true });
    globalThis.Image = class {
      constructor() { this.naturalWidth = 1000; this.naturalHeight = 2000; }
      set src(value) { this.url = value; queueMicrotask(() => this.onload?.()); }
    };
    globalThis.fetch = async (url) => ({
      ok: true,
      json: async () => JSON.parse(await readFile(new URL(`../dist/${url}`, import.meta.url), 'utf8')),
    });
    await import(`../dist/static/js/work.js?case=${id}`);
    // Initialization reads two local JSON files, then schedules image loading.
    for (let attempt = 0; attempt < 30 && !get('viewer-title').textContent; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 2));
    }
    for (let attempt = 0; id === 'wang' && attempt < 30 && get('leaf-counter').value !== '1 / 18'; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 2));
    }
    assert.equal(get('viewer-title').textContent, art.title);
    assert.equal(get('other-works').children.length, 3);
    assert.equal(get('work-to-studio').hidden, !art.studio);
    assert.equal(get('note-section').hidden, !(art.views?.[0]?.note || art.note));
    if (art.views?.length) {
      assert.equal(get('leaf-strip').children.length, art.views.length);
      assert.equal(get('leaf-counter').value, '1 / ' + art.views.length);
      assert.equal(get('previous-leaf').disabled, true);
      const meta = () => get('work-meta').textContent;
      if (id === 'shusu') {
        assert.match(meta(), /2012年/);
        assert.match(get('artist-note').textContent, /初臨/);
      }
      get('next-leaf').onclick();
      assert.equal(get('leaf-counter').value, '2 / ' + art.views.length);
      if (id === 'shusu') {
        assert.match(meta(), /2021年/);
        assert.equal(get('note-section').hidden, true);
        get('next-leaf').onclick();
        assert.match(meta(), /2026年/);
        assert.match(meta(), /35 × 135/);
        assert.match(get('artist-note').textContent, /秋季雲展/);
        get('previous-leaf').onclick();
      }
      if (id === 'jiuhua') assert.equal(get('artist-note').textContent, '臨習此帖的初稿。');
      get('previous-leaf').onclick();
      assert.equal(get('previous-leaf').disabled, true);
    }
    if (id === 'wang') {
      assert.equal(get('leaf-strip').children.length, 19);
      assert.equal(get('leaf-counter').value, '1 / 18');
      assert.equal(get('leaf-strip').children[1].children[0].src, 'assets/leaf-0-4.webp');
      get('next-leaf').onclick();
      assert.equal(get('leaf-counter').value, '2 / 18');
      get('previous-leaf').onclick();
      assert.equal(get('leaf-counter').value, '1 / 18');
      get('previous-leaf').onclick();
      assert.equal(get('leaf-counter').value, '全幅');
      for (let step = 0; step < 16; step += 1) get('next-leaf').onclick();
      assert.equal(get('image-caption').textContent, '冊頁封面');
      assert.equal(get('leaf-strip').children[16].children[1].textContent, '冊頁封面');
      get('next-leaf').onclick();
      assert.equal(get('image-caption').textContent, '冊頁展開・近觀');
      get('next-leaf').onclick();
      assert.equal(get('image-caption').textContent, '冊頁展開・全景');
      assert.equal(get('next-leaf').disabled, true);
      get('previous-leaf').onclick();
      assert.equal(get('image-caption').textContent, '冊頁展開・近觀');
    }
  });
}
