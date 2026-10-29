// Fit an off-centre calligraphy group without stretching its original marks.
export function motionLayout(stageWidth, stageHeight, artworkRatio, flower) {
  const compact = stageWidth < 600;
  const ratio = flower ? (compact ? 1.18 : 1.85) : artworkRatio;
  const width = Math.min(stageWidth * .92, stageHeight * .88 * ratio);
  const height = width / ratio;
  if (!flower) return { width, height, ink: { x: 0, y: 0, width, height } };
  const areaWidth = width * (compact ? .57 : .5);
  const inkWidth = Math.min(areaWidth, height * .84 * artworkRatio);
  const inkHeight = inkWidth / artworkRatio;
  return { width, height, ink: {
    x: width * .045 + (areaWidth - inkWidth) / 2,
    y: (height - inkHeight) / 2,
    width: inkWidth, height: inkHeight,
  } };
}
