import { frameLayout } from './frame-layout.js';
import { scrollStyles, scrollLayout, drawHangingScroll } from './scroll.js';
import {
  loadArtworks,
  loadImage as imageLoad
} from './data.js';
import {
  woodMaterials,
  drawWoodFrame,
  paintWoodFrame,
  paintWoodSamples
} from './wood.js';

const $ = (id) => document.getElementById(id);
let artworks = {};
document.querySelector('.studio-controls').addEventListener('submit', (event) => event.preventDefault());

let mount = 'frame';
let scrollStyle = 'classic';
let preview = 'detail';
let frame = 'oak',
  mat = 'ivory';
const frameColors = {
    dark: '#493d30',
    oak: '#b99462', white: '#ded8ca', gold: '#a48955'
  },
  matColors = {
    ivory: '#f4eedf',
    gray: '#c6c2b8'
  },
  sceneLabels = {
    living: '北歐客廳',
    study: '北歐書房',
    entry: '北歐玄關'
  };

function updateMountOptions(art) {
  const img = $('room-art-image');
  const loaded = img.complete && img.naturalWidth && img.getAttribute('src') === art.overview;
  const horizontal = art.studioOrientation === 'landscape'
    || (!art.studioOrientation && /橫幅|橫式/.test(art.format || ''))
    || (loaded && img.naturalWidth > img.naturalHeight);
  if (horizontal) mount = 'frame';
  for (const button of $('mounts').querySelectorAll('button')) {
    const unavailable = horizontal && button.dataset.mount === 'scroll';
    button.hidden = unavailable;
    button.disabled = unavailable;
    button.classList.toggle('active', button.dataset.mount === mount);
    button.setAttribute('aria-pressed', String(button.dataset.mount === mount));
  }
}

function updateStudio() {
  const key = $('studio-art').value;
  if (!artworks[key]) return;
  if ($('room-art-image').getAttribute('src') !== artworks[key].overview) $('room-art-image').src = artworks[key].overview;
  $('room-art-image').alt = artworks[key].title + '・裝裱搭配示意';
  updateMountOptions(artworks[key]);
  $('room').className = 'room ' + $('scene').value + (preview === 'detail' ? ' is-detail' : '');
  $('space-options').hidden = preview !== 'space';
  $('room-art').classList.toggle('is-scroll', mount === 'scroll');
  $('wood-options').hidden = mount === 'scroll';
  $('scroll-options').hidden = mount !== 'scroll';
  $('mat').hidden = mount === 'scroll';
  $('frame-material').hidden = mount === 'scroll';
  $('scroll-material').hidden = mount !== 'scroll';
  $('room-art').style.width = '';
  $('room-art').style.borderWidth = '';
  $('mat').style.padding = '';
  $('room-art').style.borderColor = 'transparent';
  $('room-art').style.background = mount === 'scroll' ? 'transparent' : frameColors[frame];
  $('mat').style.background = matColors[mat];
  const size = +$('art-size').value;
  $('room-art').style.height = artworks[key].studioHeight * size / 100 + '%';
  $('room-art').style.top = artworks[key].studioTop + '%';
  $('room-art').style.left = (preview === 'detail' ? 50 : $('art-position').value) + '%';
  $('size-output').value = size + '%';
  $('room-label').textContent = preview === 'detail' ? '裝裱預覽' : sceneLabels[$('scene').value] + '・AI 場景示意';
  $('mat-width-output').value = $('mat-width').value + '%';
  const matName = mat === 'ivory' ? '米白' : '暖灰';
  $('mount-caption').textContent = artworks[key].title + '｜' + (mount === 'scroll' ? scrollStyles[scrollStyle].name + '掛軸' : woodMaterials[frame].name) + '・' + matName + (mount === 'frame' ? '襯紙' : '裱料');
  $('studio-status').textContent = '';
  requestAnimationFrame(paintMount);
}
for (const id of ['studio-art', 'scene', 'art-size', 'art-position', 'mat-width']) $(id).addEventListener('input', updateStudio);
for (const [id, attr] of [
    ['mounts', 'mount'],
    ['scroll-styles', 'scroll'],
    ['frames', 'frame'],
    ['mats', 'mat']
  ]) $(id).querySelectorAll('button').forEach(b => b.onclick = () => {
  if (b.disabled || b.hidden) return;
  if (attr === 'mount') mount = b.dataset.mount;
  else if (attr === 'scroll') scrollStyle = b.dataset.scroll;
  else if (attr === 'frame') frame = b.dataset.frame;
  else mat = b.dataset.mat;
  $(id).querySelectorAll('button').forEach(x => {
    x.classList.toggle('active', x === b);
    x.setAttribute('aria-pressed', String(x === b))
  });
  updateStudio()
});

function paintMount() {
  const img = $('room-art-image'), key = $('studio-art').value;
  if (!artworks[key] || !img.complete || !img.naturalWidth || img.getAttribute('src') !== artworks[key].overview) return;
  const room = $('room'), host = $('room-art');
  const left = preview === 'detail' ? 50 : +$('art-position').value;
  const availableWidth = room.clientWidth * Math.min(left, 100 - left) / 50 - 32;
  const targetHeight = preview === 'detail' ? room.clientHeight * .82
    : Math.min(room.clientHeight * .82, room.clientHeight * artworks[key].studioHeight * +$('art-size').value / 10000);
  host.style.top = preview === 'detail' ? '8%' : Math.min(artworks[key].studioTop, 12) + '%';
  if (mount === 'frame') {
    const layout = frameLayout(img.naturalWidth, img.naturalHeight, targetHeight, availableWidth,
      +$('mat-width').value / 100, woodMaterials[frame].railRatio);
    if (!layout) return;
    host.style.width = layout.width + 'px';
    host.style.height = layout.height + 'px';
    host.style.borderWidth = layout.rail + 'px';
    host.style.setProperty('--frame-rail', layout.rail + 'px');
    $('mat').style.padding = layout.mat + 'px';
    paintWoodFrame(frame);
    return;
  }
  const initial = scrollLayout(img.naturalWidth, img.naturalHeight, targetHeight, scrollStyle);
  const fit = Math.min(1, availableWidth / initial.width);
  const w = initial.width * fit, h = initial.height * fit;
  host.style.setProperty('--frame-rail', '0px');
  host.style.width = w + 'px';
  host.style.height = h + 'px';
  host.setAttribute('aria-label', scrollStyles[scrollStyle].name + '掛軸裝裱預覽');
  const surface = $('scroll-material'), dpr = Math.min(devicePixelRatio || 1, 2);
  surface.width = Math.round(w * dpr);
  surface.height = Math.round(h * dpr);
  const c = surface.getContext('2d');
  c.scale(dpr, dpr);
  drawHangingScroll(c, img, 0, 0, w, h, mat, scrollStyle);
}
for (const button of $('preview-modes').querySelectorAll('button')) button.onclick = () => {
  preview = button.dataset.preview;
  for (const item of $('preview-modes').querySelectorAll('button')) {
    item.classList.toggle('active', item === button);
    item.setAttribute('aria-pressed', String(item === button));
  }
  updateStudio();
};
$('room-art-image').addEventListener('load', updateStudio);

function drawCover(c, image, x, y, w, h) {
  const scale = Math.max(w / image.naturalWidth, h / image.naturalHeight),
    sw = w / scale,
    sh = h / scale;
  c.drawImage(image, (image.naturalWidth - sw) / 2, (image.naturalHeight - sh) / 2, sw, sh, x, y, w, h)
}
$('save-preview').onclick = async () => {
  const button = $('save-preview');
  button.disabled = true;
  try {
    const key = $('studio-art').value,
      scene = $('scene').value,
      selectedMount = mount,
      selectedScroll = scrollStyle,
      selectedFrame = frame,
      selectedMat = mat,
      selectedPreview = preview,
      selectedMatWidth = $('mat-width').value;
    // Capture the current arrangement so the downloaded composition matches the preview.
    const roomRect = $('room').getBoundingClientRect(),
      frameRect = $('room-art').getBoundingClientRect(),
      imgRect = $('room-art-image').getBoundingClientRect();
    const scale = 1600 / roomRect.width,
      sceneHeight = Math.round(roomRect.height * scale),
      rail = parseFloat(getComputedStyle($('room-art')).borderTopWidth) * scale;
    const rect = r => ({
      x: (r.left - roomRect.left) * scale,
      y: (r.top - roomRect.top) * scale,
      w: r.width * scale,
      h: r.height * scale
    });
    const fr = rect(frameRect),
      ir = rect(imgRect);
    const [img, bg] = await Promise.all([imageLoad(artworks[key].overview), imageLoad('assets/room-' + scene + '.webp')]);
    const out = document.createElement('canvas');
    out.width = 1600;
    out.height = sceneHeight + 210;
    const c = out.getContext('2d');
    if (selectedPreview === 'space') drawCover(c, bg, 0, 0, 1600, sceneHeight);
    else { c.fillStyle = '#e9e5dc'; c.fillRect(0, 0, 1600, sceneHeight); }
    if (selectedMount === 'scroll') {
      c.save();
      c.shadowColor = '#241c1a40';
      c.shadowBlur = 12;
      c.shadowOffsetX = 5;
      c.shadowOffsetY = 8;
      drawHangingScroll(c, img, fr.x, fr.y, fr.w, fr.h, selectedMat, selectedScroll);
      c.restore();
    } else {
      c.save();
      c.shadowColor = '#241c1a40';
      c.shadowBlur = 16;
      c.shadowOffsetX = 10;
      c.shadowOffsetY = 14;
      c.fillStyle = frameColors[selectedFrame];
      c.fillRect(fr.x, fr.y, fr.w, fr.h);
      c.restore();
      c.fillStyle = matColors[selectedMat];
      c.fillRect(fr.x + rail, fr.y + rail, fr.w - 2 * rail, fr.h - 2 * rail);
      c.drawImage(img, ir.x, ir.y, ir.w, ir.h);
      drawWoodFrame(c, fr.x, fr.y, fr.w, fr.h, rail, selectedFrame);
    }
    c.fillStyle = '#f5f1e8';
    c.fillRect(0, sceneHeight, 1600, 210);
    c.fillStyle = '#302e28';
    c.font = '32px serif';
    c.fillText('墨境｜培玲書法雲展', 65, sceneHeight + 55);
    c.font = '24px sans-serif';
    const mn = {
      ivory: '米白',
      gray: '暖灰'
    };
    c.fillText(`${artworks[key].title} · ${selectedPreview === 'space' ? sceneLabels[scene] : '裝裱預覽'} · ${selectedMount === 'scroll' ? '掛軸・' + scrollStyles[selectedScroll].name + '／' + mn[selectedMat] + '裱料' : woodMaterials[selectedFrame].name + '／' + mn[selectedMat] + '襯紙 ' + selectedMatWidth + '%'}`, 65, sceneHeight + 105);
    c.fillStyle = '#746d60';
    c.font = '20px sans-serif';
    c.fillText('AI 場景與裝裱搭配示意，非實際尺寸預覽；作品著作權屬創作者所有。', 65, sceneHeight + 157);
    out.toBlob(blob => {
      if (!blob) {
        $('studio-status').textContent = '無法輸出，請再試一次。';
        return
      }
      const url = URL.createObjectURL(blob),
        a = document.createElement('a');
      a.href = url;
      a.download = 'peiling-art-preview.png';
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      $('studio-status').textContent = '搭配紀錄已下載，包含目前的場景與裝裱選擇。'
    }, 'image/png');
  } catch (e) {
    $('studio-status').textContent = '暫時無法輸出，請稍後重試。'
  } finally {
    button.disabled = false
  }
};

async function initializeStudio() {
  const catalog = await loadArtworks();
  const available = catalog.filter((art) => art.studio);
  artworks = Object.fromEntries(available.map((art) => [art.id, art]));
  for (const art of available) {
    const option = document.createElement('option');
    option.value = art.id;
    option.textContent = art.title;
    $('studio-art').append(option);
  }
  const requested = new URLSearchParams(location.search).get('studio');
  if (Object.hasOwn(artworks, requested)) $('studio-art').value = requested;
  if (!available.length) throw new Error('目前沒有可試掛作品');
  paintWoodSamples();
  new ResizeObserver(() => requestAnimationFrame(paintMount)).observe($('room'));
  new ResizeObserver(() => { if (mount === 'frame') paintWoodFrame(frame); }).observe($('room-art'));
  updateStudio();
}
initializeStudio().catch(() => {
  $('save-preview').disabled = true;
  $('studio-status').textContent = '試掛資料暫時無法載入，請稍後重試。';
});
