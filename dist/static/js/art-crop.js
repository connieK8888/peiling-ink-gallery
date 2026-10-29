// Non-destructive display crop: coordinates select pixels from the original photo.
// The source file, ink, inscriptions and seals are never redrawn or overwritten.
export function sourceRect(image, crop) {
  const w = image.naturalWidth || image.width, h = image.naturalHeight || image.height;
  if (!crop) return { x: 0, y: 0, w, h };
  const [left, top, right, bottom] = crop;
  if (crop.length !== 4 || !crop.every(Number.isFinite) || left < 0 || top < 0 || right > 1 || bottom > 1 || left >= right || top >= bottom) throw new Error('無效的作品裁邊範圍');
  const x = Math.round(left * w), y = Math.round(top * h);
  return { x, y, w: Math.round(right * w) - x, h: Math.round(bottom * h) - y };
}

export function drawArtwork(c, image, rect, x, y, w, h) {
  c.save();
  c.drawImage(image, rect.x, rect.y, rect.w, rect.h, x, y, w, h);
  c.restore();
}
