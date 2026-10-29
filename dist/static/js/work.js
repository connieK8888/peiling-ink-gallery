import { sourceRect, drawArtwork } from './art-crop.js';
import {
  loadArtworks,
  loadJson,
  loadImage
} from './data.js';
import {
  createArtViewer
} from './art-viewer.js';

const $ = (id) => document.getElementById(id);
const viewer = createArtViewer({
  canvas: $('art-canvas'),
  stage: $('viewer-stage'),
  loading: $('viewer-loading'),
  zoomLabel: $('zoom-label'),
});
let artwork;
let pages;
let pageIndex = -1;

function showPage(index) {
  if (!pages) return;
  const first = pages.viewOnly ? 0 : -1;
  pageIndex = Math.max(first, Math.min(pages.leaves.length - 1, index));
  const strip = $('leaf-strip');
  for (const button of strip.querySelectorAll('button')) {
    button.setAttribute('aria-pressed', String(Number(button.dataset.leaf) === pageIndex));
  }
  $('previous-leaf').disabled = pageIndex === first;
  $('next-leaf').disabled = pageIndex === pages.leaves.length - 1;
  if (pageIndex === -1) {
    showDetails();
    $('image-caption').textContent = '完整作品';
    $('leaf-counter').value = '全幅';
    viewer.show(artwork.overview, {
      pyramid: pages,
      tileBase: artwork.tileBase,
      crop: artwork.crop
    });
  } else {
    const page = pages.leaves[pageIndex];
    showDetails(pages.viewOnly || page.size ? page : {});
    $('image-caption').textContent = page.label;
    $('leaf-counter').value = `${pageIndex + 1} / ${pages.leaves.length}`;
    viewer.show(page.url, { crop: page.crop });
  }
  const selected = strip.querySelector('[aria-pressed="true"]');
  if (selected) {
    strip.scrollTo({
      left: Math.max(0, selected.offsetLeft - (strip.clientWidth - selected.offsetWidth) / 2),
      behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
    });
  }
}

function addThumbnail(src, label, index, accessibleLabel, crop) {
  const button = document.createElement('button');
  button.type = 'button';
  button.dataset.leaf = index;
  button.setAttribute('aria-label', accessibleLabel);
  button.setAttribute('aria-pressed', 'false');
  const image = document.createElement(crop ? 'canvas' : 'img');
  if (crop) {
    image.setAttribute('aria-hidden', 'true');
    loadImage(src).then(loaded => {
      const rect = sourceRect(loaded, crop);
      image.width = Math.max(1, Math.round(200 * rect.w / rect.h));
      image.height = 200;
      drawArtwork(image.getContext('2d'), loaded, rect, 0, 0, image.width, image.height);
    }).catch(() => { button.title = '縮圖暫時無法載入，仍可點選觀看'; });
  } else {
    image.src = src;
    image.alt = '';
    image.loading = 'lazy';
  }
  const caption = document.createElement('span');
  caption.textContent = label;
  button.append(image, caption);
  button.addEventListener('click', () => showPage(index));
  $('leaf-strip').append(button);
}

function showFacts(details) {
  const year = details.year?.match(/\d{4}/)?.[0];
  const script = details.script?.split('（')[0] || ({ '水墨畫': '水墨', '楷書泥金心經': '楷書', '隸書': '隸書', '行書': '行書' }[details.exhibitionCategory]);
  const size = details.size?.replace(/寬\s*/, '').replace(/×\s*高\s*/, '× ');
  $('work-meta').textContent = [year ? `${year}年` : details.year, script, size, details.material].filter(Boolean).join(' · ');
}

function showDetails(view = {}) {
  const details = { ...artwork, ...view };
  const transcription = details.displayTranscription ?? details.transcription;
  const note = details.displayNote ?? details.note;
  $('transcription-section').hidden = !transcription;
  $('transcription-label').textContent = details.transcriptionExcerpt ? '釋文節錄' : '釋文';
  $('work-transcription').textContent = transcription || '';
  $('artist-note').textContent = note || '';
  $('note-section').hidden = !note;
  showFacts(details);
}

$('previous-leaf').onclick = () => showPage(pageIndex - 1);
$('next-leaf').onclick = () => showPage(pageIndex + 1);
window.addEventListener('pagehide', (event) => {
  if (!event.persisted) viewer.destroy();
});

async function initialize() {
  const artworks = await loadArtworks();
  const selectedId = new URLSearchParams(location.search).get('art');
  artwork = artworks.find((entry) => entry.id === selectedId || entry.aliases?.includes(selectedId)) || artworks[0];
  document.title = `${artwork.title}｜墨境・培玲書法雲展`;
  $('viewer-title').textContent = artwork.title;
  $('work-artist').textContent = artwork.author;
  $('work-medium').textContent = artwork.medium;
  const motionLink = $('work-motion-link');
  motionLink.hidden = !artwork.motion;
  if (artwork.motion) {
    motionLink.href = artwork.motion.url;
    motionLink.textContent = artwork.motion.label;
  }
  $('work-to-studio').hidden = !artwork.studio;
  $('work-to-studio').href = `index.html?studio=${encodeURIComponent(artwork.id)}#studio`;
  showDetails();
  const position = artworks.findIndex(entry => entry.id === artwork.id);
  const neighbours = [artworks[(position - 1 + artworks.length) % artworks.length], artworks[(position + 1) % artworks.length]];
  neighbours.forEach((entry, index) => {
    const link = document.createElement('a');
    link.href = `work.html?art=${encodeURIComponent(entry.id)}`;
    link.textContent = index === 0 ? `← ${entry.title}` : `${entry.title} →`;
    $('other-works').append(link);
  });
  const all = document.createElement('a');
  all.href = 'collection.html';
  all.textContent = '全部作品 ↗';
  $('other-works').append(all);
  if (artwork.views?.length) {
    pages = { viewOnly: true, leaves: artwork.views.map((view, index) => ({ ...view, page: index + 1 })) };
    $('leaf-section').hidden = false;
    $('leaf-section').setAttribute('aria-label', '作品照片切換');
    pages.leaves.forEach((view, index) => addThumbnail(view.url, view.label, index, view.label, view.crop));
    showPage(0);
    return;
  }
  if (artwork.pages) {
    try {
      pages = await loadJson(artwork.pages);
      if (!pages.leaves?.length) throw new Error('缺少分頁');
      // Append physical album photographs without changing scan page order or cached metadata.
      pages = { ...pages, leaves: [...pages.leaves, ...(artwork.supplementalViews || [])] };
      $('leaf-section').hidden = false;
      addThumbnail(artwork.overview, '全幅', -1, '返回完整作品', artwork.crop);
      pages.leaves.forEach((page, index) => {
        addThumbnail(page.url, page.page ? `第${page.page}頁` : page.label, index, page.label, page.crop);
      });
      showPage(0);
      return;
    } catch {
      // If page metadata is unavailable, the complete artwork can still be viewed.
    }
  }
  $('image-caption').textContent = '完整作品';
  let pyramid = null;
  if (artwork.pyramid) {
    try {
      pyramid = await loadJson(artwork.pyramid);
    } catch {
      /* Overview remains available. */ }
  }
  await viewer.show(artwork.overview, {
    pyramid,
    tileBase: artwork.tileBase,
    crop: artwork.crop
  });
}

initialize().catch(() => {
  $('viewer-loading').hidden = false;
  $('viewer-loading').textContent = '作品暫時無法載入，請重新整理後重試。';
});
