import test from 'node:test';
import assert from 'node:assert/strict';
import { createArtViewer } from '../dist/static/js/art-viewer.js';

function setup(loadImage) {
  const queue = new Map();
  let nextFrame = 0;
  const drawings = [];
  const context = new Proxy({}, { get: (_, key) => key === 'drawImage'
    ? (...args) => drawings.push(args) : () => {} });
  const listeners = {};
  const canvas = {
    getContext: () => context,
    getBoundingClientRect: () => ({ width: 800, height: 600, left: 0, top: 0 }),
    addEventListener: (name, callback, options) => { listeners[name] = { callback, options }; },
    setPointerCapture() {},
  };
  let disconnected = false;
  globalThis.ResizeObserver = class {
    observe() {}
    disconnect() { disconnected = true; }
  };
  globalThis.devicePixelRatio = 1;
  globalThis.requestAnimationFrame = (callback) => { queue.set(++nextFrame, callback); return nextFrame; };
  globalThis.cancelAnimationFrame = (id) => queue.delete(id);
  const loading = {};
  const zoomLabel = {};
  const viewer = createArtViewer({ canvas, stage: {}, loading, zoomLabel, loadImage });
  const flush = () => { const current = [...queue.values()]; queue.clear(); current.forEach((callback) => callback()); };
  const emit = (name, values = {}) => listeners[name].callback({ preventDefault() {}, ...values });
  return { viewer, flush, emit, drawings, loading, zoomLabel, listeners, disconnected: () => disconnected };
}
const picture = { naturalWidth: 1000, naturalHeight: 2000, width: 1000, height: 2000 };

test('wheel zoom keeps direct interaction and double-click restores the full image', async () => {
  const state = setup(async () => picture);
  await state.viewer.show('sample.webp');
  state.flush();
  assert.equal(state.zoomLabel.textContent, '全幅');
  assert.equal(state.listeners.wheel.options.passive, false);
  state.emit('wheel', { clientX: 400, clientY: 300, deltaY: -500 });
  state.flush();
  assert.notEqual(state.zoomLabel.textContent, '全幅');
  state.emit('dblclick', { clientX: 400, clientY: 300 });
  state.flush();
  assert.equal(state.zoomLabel.textContent, '全幅');
  state.viewer.destroy();
  assert.equal(state.disconnected(), true);
});

test('a slower previous page never replaces the newly selected page', async () => {
  const pending = new Map();
  const state = setup((url) => new Promise((resolve) => pending.set(url, resolve)));
  const first = state.viewer.show('first.webp');
  const second = state.viewer.show('second.webp');
  const secondImage = { ...picture, id: 'second' };
  pending.get('second.webp')(secondImage);
  await second;
  state.flush();
  pending.get('first.webp')({ ...picture, id: 'first' });
  await first;
  state.flush();
  assert.equal(state.drawings[0][0], secondImage);
  assert.equal(state.loading.hidden, true);
  state.viewer.destroy();
});

test('image failures produce a visible message rather than an empty viewer', async () => {
  const state = setup(async () => { throw new Error('offline'); });
  await state.viewer.show('missing.webp');
  assert.equal(state.loading.hidden, false);
  assert.match(state.loading.textContent, /無法讀取/);
  state.viewer.destroy();
});

test('pointer drag pans a zoomed artwork', async () => {
  const state = setup(async () => picture);
  await state.viewer.show('sample.webp');
  state.emit('wheel', { clientX: 400, clientY: 300, deltaY: -700 });
  state.flush();
  const before = state.drawings.filter((draw) => draw[3] > 200).at(-1)[2];
  state.emit('pointerdown', { pointerId: 1, clientX: 400, clientY: 300 });
  state.emit('pointermove', { pointerId: 1, clientX: 400, clientY: 330 });
  state.flush();
  assert.notEqual(state.drawings.filter((draw) => draw[3] > 200).at(-1)[2], before);
  state.viewer.destroy();
});

test('display crop remains fixed during zoom and resets when switching to an uncropped scan', async () => {
  const state = setup(async () => picture);
  await state.viewer.show('photo.jpg', { crop: [.1, .2, .9, .8] });
  state.flush();
  assert.deepEqual(state.drawings.at(-1).slice(1,5), [100,400,800,1200]);
  state.emit('wheel', { clientX: 400, clientY: 300, deltaY: -600 });
  state.flush();
  const cropped = state.drawings.filter(draw => draw.length === 9);
  assert.ok(cropped.length >= 2);
  assert.ok(cropped.every(draw => JSON.stringify(draw.slice(1,5)) === '[100,400,800,1200]'));
  await state.viewer.show('scan.webp');
  state.flush();
  assert.equal(state.drawings.at(-1).length, 5);
  state.viewer.destroy();
});
