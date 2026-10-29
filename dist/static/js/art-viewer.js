import { sourceRect, drawArtwork } from './art-crop.js';
import {
  loadImage as defaultLoadImage
} from './data.js';

/**
 * 單一作品觀看器：滾輪、雙指縮放、拖曳與高解析圖塊。
 * 不依賴作品名稱或 HTML 的固定 ID，其他頁面可重用。
 */
export function createArtViewer({
  canvas,
  stage,
  loading,
  zoomLabel,
  loadImage = defaultLoadImage
}) {
  const context = canvas.getContext('2d');
  const events = new AbortController();
  const tileCache = new Map();
  const pointers = new Map();
  let image = null;
  let crop = null;
  let rect = null;
  let pyramid = null;
  let tileBase = '';
  let width = 0;
  let height = 0;
  let viewWidth = 0;
  let viewHeight = 0;
  let scale = 1;
  let fitScale = 1;
  let offsetX = 0;
  let offsetY = 0;
  let frameRequest = 0;
  let loadSequence = 0;
  let gesture = null;

  function schedule() {
    if (frameRequest) return;
    frameRequest = requestAnimationFrame(() => {
      frameRequest = 0;
      render();
    });
  }

  function fit() {
    if (!width || !viewWidth) return;
    fitScale = Math.min(viewWidth / width, viewHeight / height) * 0.92;
    scale = fitScale;
    offsetX = (viewWidth - width * scale) / 2;
    offsetY = (viewHeight - height * scale) / 2;
    schedule();
  }

  function resize() {
    const bounds = canvas.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    const oldWidth = viewWidth;
    const oldHeight = viewHeight;
    viewWidth = bounds.width;
    viewHeight = bounds.height;
    const ratio = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(viewWidth * ratio);
    canvas.height = Math.round(viewHeight * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    if (oldWidth && width) {
      offsetX += (viewWidth - oldWidth) / 2;
      offsetY += (viewHeight - oldHeight) / 2;
      fitScale = Math.min(viewWidth / width, viewHeight / height) * 0.92;
      schedule();
    } else {
      fit();
    }
  }

  function constrain() {
    const margin = 40;
    offsetX = width * scale <= viewWidth ?
      (viewWidth - width * scale) / 2 :
      Math.min(margin, Math.max(viewWidth - width * scale - margin, offsetX));
    offsetY = height * scale <= viewHeight ?
      (viewHeight - height * scale) / 2 :
      Math.min(margin, Math.max(viewHeight - height * scale - margin, offsetY));
  }

  function zoom(factor, x = viewWidth / 2, y = viewHeight / 2) {
    if (!image) return;
    const nextScale = Math.min(Math.max(scale * factor, fitScale), Math.max(fitScale, 2));
    const ratio = nextScale / scale;
    offsetX = x - (x - offsetX) * ratio;
    offsetY = y - (y - offsetY) * ratio;
    scale = nextScale;
    constrain();
    schedule();
  }

  function getTile(level, x, y) {
    const key = `${tileBase}${level}/${x}_${y}.webp`;
    if (tileCache.has(key)) return tileCache.get(key);
    const tile = {
      image: null
    };
    tileCache.set(key, tile);
    loadImage(key).then((loaded) => {
      tile.image = loaded;
      schedule();
    }).catch(() => {
      // The overview remains visible if an individual high-resolution tile fails.
    });
    if (tileCache.size > 700) tileCache.delete(tileCache.keys().next().value);
    return tile;
  }

  function drawTiles() {
    const target = scale * Math.min(devicePixelRatio || 1, 2);
    let level = pyramid.levels.findIndex((entry) => entry.scale >= target);
    if (level < 0) level = pyramid.levels.length - 1;
    const layer = pyramid.levels[level];
    const tileSize = pyramid.tileSize;
    const firstX = Math.max(0, Math.floor(-offsetX / scale * layer.scale / tileSize));
    const lastX = Math.min(Math.ceil(layer.width / tileSize) - 1,
      Math.floor((viewWidth - offsetX) / scale * layer.scale / tileSize));
    const firstY = Math.max(0, Math.floor(-offsetY / scale * layer.scale / tileSize));
    const lastY = Math.min(Math.ceil(layer.height / tileSize) - 1,
      Math.floor((viewHeight - offsetY) / scale * layer.scale / tileSize));
    for (let y = firstY; y <= lastY; y += 1) {
      for (let x = firstX; x <= lastX; x += 1) {
        const tile = getTile(level, x, y);
        if (!tile.image) continue;
        context.drawImage(tile.image,
          offsetX + x * tileSize / layer.scale * scale,
          offsetY + y * tileSize / layer.scale * scale,
          tile.image.width / layer.scale * scale + 0.25,
          tile.image.height / layer.scale * scale + 0.25);
      }
    }
  }

  function drawNavigator() {
    const mapWidth = Math.min(70, viewWidth * 0.13);
    const mapHeight = mapWidth * height / width;
    if (mapHeight >= viewHeight * 0.45 || scale <= fitScale * 1.15) return;
    const x = viewWidth - mapWidth - 14;
    const y = viewHeight - mapHeight - 14;
    context.fillStyle = '#f5f1e8ee';
    context.fillRect(x - 4, y - 4, mapWidth + 8, mapHeight + 8);
    if (crop) drawArtwork(context, image, rect, x, y, mapWidth, mapHeight);
    else context.drawImage(image, x, y, mapWidth, mapHeight);
    context.strokeStyle = '#8e3e30';
    context.lineWidth = 1.5;
    const sourceX = Math.max(0, -offsetX / scale);
    const sourceY = Math.max(0, -offsetY / scale);
    context.strokeRect(
      x + sourceX / width * mapWidth,
      y + sourceY / height * mapHeight,
      Math.min(width - sourceX, viewWidth / scale) / width * mapWidth,
      Math.min(height - sourceY, viewHeight / scale) / height * mapHeight);
  }

  function render() {
    context.clearRect(0, 0, viewWidth, viewHeight);
    if (!image) return;
    context.imageSmoothingEnabled = true;
    if (crop) drawArtwork(context, image, rect, offsetX, offsetY, width * scale, height * scale);
    else context.drawImage(image, offsetX, offsetY, width * scale, height * scale);
    if (pyramid) drawTiles();
    drawNavigator();
    if (zoomLabel) {
      zoomLabel.textContent = Math.abs(scale / fitScale - 1) < 0.02 ?
        '全幅' : `${Math.round(scale / fitScale * 100)}%`;
    }
  }

  async function show(src, options = {}) {
    const sequence = ++loadSequence;
    image = null;
    pyramid = null;
    loading.hidden = false;
    loading.textContent = '正在展開作品…';
    context.clearRect(0, 0, viewWidth, viewHeight);
    try {
      const loaded = await loadImage(src);
      if (sequence !== loadSequence) return;
      crop = options.crop || null;
      rect = sourceRect(loaded, crop);
      image = loaded;
      pyramid = !crop && options.pyramid?.levels?.length ? options.pyramid : null;
      tileBase = options.tileBase || '';
      width = pyramid ? pyramid.width : rect.w;
      height = pyramid ? pyramid.height : rect.h;
      resize();
      fit();
      loading.hidden = true;
    } catch {
      if (sequence === loadSequence) {
        loading.textContent = '影像暫時無法讀取，請重新整理後重試。';
      }
    }
  }

  function position(event) {
    const bounds = canvas.getBoundingClientRect();
    return {
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top
    };
  }

  function updateGesture() {
    const points = [...pointers.values()];
    gesture = points.length === 2 ? {
      distance: Math.hypot(points[1].x - points[0].x, points[1].y - points[0].y),
      x: (points[0].x + points[1].x) / 2,
      y: (points[0].y + points[1].y) / 2,
    } : null;
  }

  const listen = (name, handler, options = {}) => {
    canvas.addEventListener(name, handler, {
      ...options,
      signal: events.signal
    });
  };
  listen('wheel', (event) => {
    event.preventDefault();
    const point = position(event);
    zoom(Math.exp(-event.deltaY * 0.0015), point.x, point.y);
  }, {
    passive: false
  });
  listen('dblclick', (event) => {
    if (scale > fitScale * 1.15) fit();
    else {
      const point = position(event);
      zoom(2, point.x, point.y);
    }
  });
  listen('pointerdown', (event) => {
    canvas.setPointerCapture(event.pointerId);
    pointers.set(event.pointerId, position(event));
    updateGesture();
  });
  listen('pointermove', (event) => {
    if (!pointers.has(event.pointerId) || !image) return;
    const old = pointers.get(event.pointerId);
    const point = position(event);
    pointers.set(event.pointerId, point);
    if (pointers.size === 1) {
      offsetX += point.x - old.x;
      offsetY += point.y - old.y;
      constrain();
      schedule();
    } else if (pointers.size === 2) {
      const points = [...pointers.values()];
      const distance = Math.hypot(points[1].x - points[0].x, points[1].y - points[0].y);
      const x = (points[0].x + points[1].x) / 2;
      const y = (points[0].y + points[1].y) / 2;
      if (gesture?.distance) {
        zoom(distance / gesture.distance, gesture.x, gesture.y);
        offsetX += x - gesture.x;
        offsetY += y - gesture.y;
        constrain();
        schedule();
      }
      updateGesture();
    }
  });
  for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    listen(name, (event) => {
      pointers.delete(event.pointerId);
      updateGesture();
    });
  }
  listen('keydown', (event) => {
    const movement = {
      ArrowLeft: [40, 0],
      ArrowRight: [-40, 0],
      ArrowUp: [0, 40],
      ArrowDown: [0, -40]
    } [event.key];
    if (movement || ['+', '=', '-', '0'].includes(event.key)) event.preventDefault();
    if (event.key === '+' || event.key === '=') zoom(1.4);
    else if (event.key === '-') zoom(1 / 1.4);
    else if (event.key === '0') fit();
    else if (movement) {
      offsetX += movement[0];
      offsetY += movement[1];
      constrain();
      schedule();
    }
  });

  const observer = new ResizeObserver(resize);
  observer.observe(stage);
  resize();
  return {
    show,
    fit,
    destroy() {
      loadSequence += 1;
      events.abort();
      observer.disconnect();
      pointers.clear();
      tileCache.clear();
      if (frameRequest) cancelAnimationFrame(frameRequest);
    },
  };
}
