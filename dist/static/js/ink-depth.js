// Runtime display effect only: sample the artist's photo; never redraw glyphs.
function localMaximum(values, width, height, radius, vertical) {
  const result = new Float32Array(values.length);
  const count = vertical ? width : height, length = vertical ? height : width;
  const stride = vertical ? width : 1, queue = new Int32Array(length);
  for (let line = 0; line < count; line++) {
    const offset = vertical ? line : line * width;
    let head = 0, tail = 0, right = -1;
    for (let index = 0; index < length; index++) {
      const limit = Math.min(length - 1, index + radius);
      while (right < limit) {
        right++;
        while (tail > head && values[offset + queue[tail - 1] * stride] <= values[offset + right * stride]) tail--;
        queue[tail++] = right;
      }
      while (tail > head && queue[head] < index - radius) head++;
      result[offset + index * stride] = values[offset + queue[head] * stride];
    }
  }
  return result;
}

export function extractInkPixels(pixels, dimensions) {
  let paper;
  if (dimensions) {
    const { width, height } = dimensions, light = new Float32Array(width * height);
    for (let i = 0; i < light.length; i++) light[i] = .2126 * pixels[i * 4] + .7152 * pixels[i * 4 + 1] + .0722 * pixels[i * 4 + 2];
    const radius = Math.max(8, Math.round(width * .055));
    paper = localMaximum(localMaximum(light, width, height, radius, false), width, height, radius, true);
  }
  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2];
    const luminance = .2126 * r + .7152 * g + .0722 * b;
    const seal = g < 120 && r > g * 1.45 && r > b * 1.45 && r - g > 28;
    const coverage = seal ? Math.min(1, (210 - luminance) / 65) :
      paper ? Math.pow(Math.max(0, Math.min(1, (paper[i / 4] - luminance - 52) / 55)), 1.4) : Math.min(1, (182 - luminance) / 70);
    pixels[i + 3] = Math.round(pixels[i + 3] * Math.max(0, coverage));
  }
  return pixels;
}

export function depthPose(x, y, amount, flat) {
  const strength = flat ? 0 : Math.max(0, Math.min(100, amount)) / 100;
  if (!strength) return { rx: 0, ry: 0, lift: 0, wash: 0, paper: 0, shadow: 0 };
  return { rx: -Math.max(-1, Math.min(1, y)) * 8 * strength,
    ry: Math.max(-1, Math.min(1, x)) * 11 * strength,
    lift: 80 * strength, wash: -38 * strength, paper: -70 * strength,
    shadow: .22 * strength };
}
