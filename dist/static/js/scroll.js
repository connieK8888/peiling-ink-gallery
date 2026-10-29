// Shared hanging-scroll geometry and rendering for the room and PNG download.
// The artwork image is drawn whole: no cropping, recolouring or generated strokes.
export const scrollStyles = {
  classic: { name: '素雅留白' },
  rounded: { name: '圓角襯底', reference: 'IMG_8864.JPG' },
  offset: { name: '錯位疊襯', reference: 'IMG_8862.JPG' },
  bevel: { name: '立體折邊', reference: 'IMG_8869.JPG' }
};

export function scrollLayout(imageWidth, imageHeight, height, style = 'classic') {
  const creative = style !== 'classic';
  const artHeight = height * (creative ? .54 : .66);
  const artWidth = artHeight * imageWidth / imageHeight;
  return {
    width: artWidth + height * (creative ? .23 : .11),
    height,
    body: { x: height * .02, y: height * .055, w: artWidth + height * (creative ? .19 : .07), h: height * .92 },
    art: { x: height * (creative ? .115 : .055), y: height * (creative ? .255 : .215), w: artWidth, h: artHeight },
    rod: height * .025
  };
}

const fabrics = { ivory: '#e5d9bc', gray: '#bdbfb2' };

export function drawHangingScroll(c, image, x, y, width, height, mat, style = 'classic') {
  const layout = scrollLayout(image.naturalWidth || image.width, image.naturalHeight || image.height, height, style);
  c.save();
  c.translate(x, y);
  c.scale(width / layout.width, 1);
  const b = layout.body, a = layout.art;
  // A fine hanging cord, attached at the two ends of the upper stave.
  c.strokeStyle = '#7b684b';
  c.lineWidth = Math.max(.6, height * .0025);
  c.beginPath();
  c.moveTo(b.x + b.w * .12, b.y);
  c.quadraticCurveTo(layout.width / 2, -height * .035, b.x + b.w * .88, b.y);
  c.stroke();
  c.fillStyle = fabrics[mat] || fabrics.ivory;
  c.fillRect(b.x, b.y, b.w, b.h);
  // Subtle woven threads and soft edge light suggest silk mounting fabric.
  c.save();
  c.beginPath();
  c.rect(b.x, b.y, b.w, b.h);
  c.clip();
  for (let line = 0; line < 240; line++) {
    c.fillStyle = line % 3 ? '#ffffff14' : '#55492b14';
    c.fillRect(b.x, b.y + b.h * line / 240, b.w, Math.max(.2, height * .0007));
  }
  for (let line = 0; line < 100; line++) {
    c.fillStyle = '#ffffff0c';
    c.fillRect(b.x + b.w * line / 100, b.y, Math.max(.2, height * .0005), b.h);
  }
  const edge = c.createLinearGradient(b.x, 0, b.x + b.w, 0);
  edge.addColorStop(0, '#52472b24');
  edge.addColorStop(.04, '#ffffff12');
  edge.addColorStop(.96, '#ffffff08');
  edge.addColorStop(1, '#52472b24');
  c.fillStyle = edge;
  c.fillRect(b.x, b.y, b.w, b.h);
  c.restore();
  drawCreativeMount(c, a, height, mat, style);
  c.drawImage(image, a.x, a.y, a.w, a.h);
  c.strokeStyle = '#82704b55';
  c.lineWidth = Math.max(.4, height * .001);
  c.strokeRect(a.x, a.y, a.w, a.h);
  // Warm wooden upper stave and cylindrical lower roller with projecting ends.
  for (const [rx, ry, rw, rh] of [
    [b.x, b.y, b.w, layout.rod * .3],
    [0, height - layout.rod, layout.width, layout.rod]
  ]) {
    const wood = c.createLinearGradient(0, ry, 0, ry + rh);
    wood.addColorStop(0, '#735037');
    wood.addColorStop(.3, '#b38b5b');
    wood.addColorStop(.65, '#795237');
    wood.addColorStop(1, '#4c3324');
    c.fillStyle = wood;
    c.fillRect(rx, ry, rw, rh);
  }
  c.fillStyle = '#513725';
  c.fillRect(0, height - layout.rod * 1.07, height * .014, layout.rod * 1.14);
  c.fillRect(layout.width - height * .014, height - layout.rod * 1.07, height * .014, layout.rod * 1.14);
  c.restore();
}

function drawCreativeMount(c, a, height, mat, style) {
  if (style === 'classic') return;
  const pad = height * .048;
  const panel = { x: a.x - pad, y: a.y - pad * 1.9, w: a.w + pad * 2, h: a.h + pad * 3.1 };
  c.save();
  if (style === 'rounded' || style === 'offset') {
    if (style === 'offset') {
      // Two visible, staggered backing panels; the painting itself remains intact.
      panel.x -= height * .012;
      panel.y -= height * .025;
      panel.w -= height * .006;
      panel.h -= height * .025;
    }
    c.beginPath();
    c.roundRect(panel.x, panel.y, panel.w, panel.h, height * .025);
    c.fillStyle = style === 'rounded'
      ? (mat === 'gray' ? '#90998e' : '#cbb68b')
      : (mat === 'gray' ? '#e3e4d9' : '#f1e7d1');
    c.fill();
    c.strokeStyle = '#f9f1debb';
    c.lineWidth = Math.max(.5, height * .0015);
    c.stroke();
    if (style === 'offset') {
      c.fillStyle = mat === 'gray' ? '#a7afa2' : '#d1ba90';
      c.fillRect(a.x - pad * .24, a.y - pad * .24, a.w + pad * .48, a.h + pad * .48);
      c.strokeStyle = '#fff7e0aa';
      c.strokeRect(a.x - pad * .24, a.y - pad * .24, a.w + pad * .48, a.h + pad * .48);
    }
  } else if (style === 'bevel') {
    // Flat geometric folds suggest a raised painting without cropping its edges.
    const d = height * .028;
    const polygon = (points, color) => {
      c.beginPath();
      points.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y));
      c.closePath(); c.fillStyle = color; c.fill();
    };
    polygon([[a.x,a.y],[a.x+d,a.y-d],[a.x+a.w+d,a.y-d],[a.x+a.w,a.y]], '#d8d6ca');
    polygon([[a.x+a.w,a.y],[a.x+a.w+d,a.y-d],[a.x+a.w+d,a.y+a.h-d],[a.x+a.w,a.y+a.h]], '#7b8178');
    polygon([[a.x,a.y+a.h],[a.x+a.w,a.y+a.h],[a.x+a.w+d,a.y+a.h-d],[a.x+d,a.y+a.h-d]], '#969a90');
    c.fillStyle = '#b7b9ab';
    c.fillRect(a.x - height * .002, a.y - height * .002, a.w + height * .004, a.h + height * .004);
  }
  c.restore();
}
