'use strict';
// Shared procedural wood material: consistent on the wall, samples and PNG export.
export const woodMaterials = {
  dark: {
    name: '胡桃木框',
    railRatio: .032,
    base: [101, 70, 48],
    light: 'rgba(255,224,181,.30)',
    edge: '#3d291e',
    seed: 731
  },
  oak: {
    name: '原木細框',
    railRatio: .024,
    base: [185, 145, 94],
    light: 'rgba(255,241,209,.45)',
    edge: '#795634',
    seed: 1149
  },
  white: {
    name: '暖白細框', railRatio: .026, finish: 'paint',
    base: [222, 216, 202], light: 'rgba(255,255,249,.65)', edge: '#a49c8c', seed: 2441
  },
  gold: {
    name: '霧金細框', railRatio: .018, finish: 'metal',
    base: [164, 137, 85], light: 'rgba(255,238,180,.54)', edge: '#766039', seed: 3989
  }
};
const woodTextures = new Map();

function woodTexture(key) {
  if (woodTextures.has(key)) return woodTextures.get(key);
  const m = woodMaterials[key],
    t = document.createElement('canvas');
  t.width = 1200;
  t.height = 160;
  const c = t.getContext('2d');
  let seed = m.seed;
  const rand = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296
  };
  // Broad variation and fine irregular fibres along the length of each rail.
  const pixels = c.createImageData(t.width, t.height);
  const channels = Array.from({
    length: 18
  }, () => ({
    y: rand() * 180 - 10,
    amp: rand() * 9 + 1,
    freq: rand() * .004 + .001,
    phase: rand() * 6.28,
    width: rand() * 5 + 1.5
  }));
  for (let y = 0; y < t.height; y++)
    for (let x = 0; x < t.width; x++) {
      let value = 5 * Math.sin(y * .065) + 3 * Math.sin(y * .37 + x * .0009) + 2 * Math.sin(y * 1.7 + x * .002) + (rand() - .5) * 7;
      for (const f of channels) {
        const d = (y - f.y - Math.sin(x * f.freq + f.phase) * f.amp) / f.width;
        value -= Math.exp(-d * d) * 9
      }
      if (m.finish) value = (rand() - .5) * (m.finish === 'metal' ? 5 : 2) + 2 * Math.sin(y * .07);
      const i = (y * t.width + x) * 4;
      for (let k = 0; k < 3; k++) pixels.data[i + k] = Math.max(0, Math.min(255, m.base[k] + value * (k === 0 ? 1.2 : k === 1 ? 1 : .8)));
      pixels.data[i + 3] = 255;
    }
  c.putImageData(pixels, 0, 0);
  for (let i = 0; i < (m.finish ? 0 : 260); i++) {
    const y = rand() * 160,
      start = rand() * 1200,
      len = rand() * 500 + 30,
      phase = rand() * 6.28;
    c.beginPath();
    c.moveTo(start, y);
    for (let x = start; x < Math.min(1200, start + len); x += 12) c.lineTo(x, y + Math.sin(x * .006 + phase) * 2 + Math.sin(x * .021 + phase) * .5);
    c.strokeStyle = i % 3 ? 'rgba(36,19,8,.12)' : 'rgba(255,235,201,.17)';
    c.lineWidth = rand() * .9 + .3;
    c.stroke();
  }
  for (let i = 0; i < (m.finish ? 0 : 1800); i++) {
    c.fillStyle = `rgba(38,21,9,${rand()*.09})`;
    c.fillRect(rand() * 1200, rand() * 160, rand() * 9 + 1, .35 + rand() * .45)
  }
  woodTextures.set(key, t);
  return t;
}
export function drawWoodFrame(c, x, y, w, h, rail, key) {
  if (w <= rail * 2 || h <= rail * 2) return;
  const texture = woodTexture(key),
    m = woodMaterials[key];
  c.save();
  c.translate(x, y);
  const rails = [{
    x: 0,
    y: 0,
    a: 0,
    len: w
  }, {
    x: w,
    y: 0,
    a: Math.PI / 2,
    len: h
  }, {
    x: w,
    y: h,
    a: Math.PI,
    len: w
  }, {
    x: 0,
    y: h,
    a: -Math.PI / 2,
    len: h
  }];
  rails.forEach((r, i) => {
    c.save();
    c.translate(r.x, r.y);
    c.rotate(r.a);
    c.beginPath();
    c.moveTo(0, 0);
    c.lineTo(r.len, 0);
    c.lineTo(r.len - rail, rail);
    c.lineTo(rail, rail);
    c.closePath();
    c.clip();
    c.drawImage(texture, 0, (i * 31) % 90, texture.width, 70, 0, 0, r.len, rail);
    const bevel = c.createLinearGradient(0, 0, 0, rail);
    bevel.addColorStop(0, m.light);
    bevel.addColorStop(.10, 'rgba(255,244,220,.10)');
    bevel.addColorStop(.24, 'rgba(0,0,0,.04)');
    bevel.addColorStop(.64, 'rgba(255,227,190,.06)');
    bevel.addColorStop(.80, 'rgba(0,0,0,.16)');
    bevel.addColorStop(.90, m.light);
    bevel.addColorStop(1, 'rgba(0,0,0,.45)');
    c.fillStyle = bevel;
    c.fillRect(0, 0, r.len, rail);
    c.restore();
  });
  c.lineWidth = .65;
  c.strokeStyle = m.edge;
  c.strokeRect(.35, .35, w - .7, h - .7);
  c.strokeStyle = 'rgba(37,22,13,.32)';
  c.beginPath();
  c.moveTo(0, 0);
  c.lineTo(rail, rail);
  c.moveTo(w, 0);
  c.lineTo(w - rail, rail);
  c.moveTo(w, h);
  c.lineTo(w - rail, h - rail);
  c.moveTo(0, h);
  c.lineTo(rail, h - rail);
  c.stroke();
  c.strokeStyle = 'rgba(255,239,206,.36)';
  c.strokeRect(rail - .5, rail - .5, w - rail * 2 + 1, h - rail * 2 + 1);
  c.restore();
}
export function paintWoodFrame(key) {
  const host = document.getElementById('room-art'),
    surface = document.getElementById('frame-material');
  if (!host || !surface) return;
  const w = host.offsetWidth,
    h = host.offsetHeight;
  if (!w || !h) return;
  const dpr = Math.min(devicePixelRatio || 1, 2),
    c = surface.getContext('2d');
  surface.width = Math.round(w * dpr);
  surface.height = Math.round(h * dpr);
  c.scale(dpr, dpr);
  drawWoodFrame(c, 0, 0, w, h, parseFloat(getComputedStyle(host).borderTopWidth), key);
  surface.dataset.material = key;
  host.setAttribute('aria-label', woodMaterials[key].name + '裝裱預覽');
}
export function paintWoodSamples() {
  document.querySelectorAll('[data-frame] .wood-sample').forEach(surface => {
    const key = surface.parentElement.dataset.frame,
      c = surface.getContext('2d');
    surface.width = 240;
    surface.height = 65;
    c.drawImage(woodTexture(key), 0, 25, 1200, 100, 0, 0, 240, 65);
    const g = c.createLinearGradient(0, 0, 0, 65);
    g.addColorStop(0, woodMaterials[key].light);
    g.addColorStop(.5, 'transparent');
    g.addColorStop(1, 'rgba(0,0,0,.25)');
    c.fillStyle = g;
    c.fillRect(0, 0, 240, 65)
  })
}
