/** 裝框尺寸的唯一計算：完整畫心、等寬襯紙與框條，縮小到預覽範圍內。 */
export function frameLayout(imageWidth, imageHeight, targetHeight, maxWidth, matRatio = .1, railRatio = .025) {
  if (![imageWidth, imageHeight, targetHeight, maxWidth].every(v => Number.isFinite(v) && v > 0)) return null;
  const short = Math.min(imageWidth, imageHeight);
  const mat = short * Math.max(0, matRatio), rail = short * railRatio;
  const outerWidth = imageWidth + 2 * (mat + rail);
  const outerHeight = imageHeight + 2 * (mat + rail);
  const scale = Math.min(targetHeight / outerHeight, maxWidth / outerWidth);
  return { width: outerWidth * scale, height: outerHeight * scale, rail: rail * scale,
    mat: mat * scale, artWidth: imageWidth * scale, artHeight: imageHeight * scale };
}
