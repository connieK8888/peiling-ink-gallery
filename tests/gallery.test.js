import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const catalog = JSON.parse(await readFile(new URL('../dist/data/artworks.json', import.meta.url), 'utf8'));
for (const view of ['featured', 'all']) {
  test(`gallery ${view} uses real artwork links and selected focal crops`, async () => {
    class Element {
      constructor() { this.children = []; this.style = { setProperty() {} }; this.dataset = {}; }
      setAttribute() {}
      append(...items) { this.children.push(...items); }
      replaceChildren(...items) { this.children = items; }
    }
    const gallery = new Element(), count = new Element();
    gallery.dataset.view = view;
    globalThis.document = { getElementById: id => id === 'art-gallery' ? gallery : count, createElement: () => new Element() };
    globalThis.fetch = async () => ({ ok: true, json: async () => catalog });
    await import(`../dist/static/js/gallery.js?view=${view}`);
    await new Promise(resolve => setTimeout(resolve, 0));
    const expected = view === 'featured' ? catalog.filter(a => Number.isInteger(a.featuredOrder)).sort((a,b) => a.featuredOrder-b.featuredOrder) : catalog;
    let cards = gallery.children;
    if (view === 'all') {
      assert.deepEqual(gallery.children.map(section => section.children[0].textContent), ['行書', '隸書', '楷書泥金心經', '水墨畫']);
      assert.deepEqual(gallery.children.map(section => section.children[1].children.length), ['行書', '隸書', '楷書泥金心經', '水墨畫'].map(category => catalog.filter(art => art.exhibitionCategory === category).length));
      cards = gallery.children.flatMap(section => section.children[1].children);
      assert.equal(new Set(cards.map(card => card.children[0].href)).size, catalog.length);
    }
    assert.equal(cards.length, view === 'featured' ? 6 : catalog.length);
    assert.equal(count.textContent, String(catalog.length));
    for (const [i, card] of cards.entries()) {
      const link = card.children[0], img = link.children[0];
      assert.equal(link.children.length, 2);
      assert.ok(!link.children.some(child => child.textContent === '作品局部'));
      assert.equal(link.href, expected[i].motion?.introUrl || `work.html?art=${expected[i].id}`);
      assert.equal(img.style.objectPosition, expected[i].poster.position);
      assert.equal(img.style.transformOrigin, expected[i].poster.origin);
      assert.equal(img.loading, 'lazy');
    }
  });
}
