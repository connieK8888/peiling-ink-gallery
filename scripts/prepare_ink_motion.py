"""Prepare a display-only reveal mask from the original Wang scan.

Run with the primary Python runtime (Pillow, NumPy, SciPy). The photograph is
never modified. Skeleton paths approximate a reveal order, not historical pen
trajectory or verified Chinese stroke order.
"""
from pathlib import Path
import json
import numpy as np
from PIL import Image
from scipy.ndimage import distance_transform_edt, label

ROOT = Path(__file__).resolve().parents[1]
CROP = [.65, .195, .945, .34]
im = Image.open(ROOT / 'dist/assets/leaf-1-3.webp').convert('RGB')
w, h = im.size
box = tuple(round(v * (w if i % 2 == 0 else h)) for i, v in enumerate(CROP))
rgb = np.array(im.crop(box))
height, width = rgb.shape[:2]
gray = rgb @ np.array([.2126, .7152, .0722])
mask = gray < 160
radius = distance_transform_edt(mask)


def thin(binary):
    a = np.pad(binary, 1).astype(bool)
    while True:
        count = 0
        for phase in (0, 1):
            p = [a[:-2, 1:-1], a[:-2, 2:], a[1:-1, 2:], a[2:, 2:],
                 a[2:, 1:-1], a[2:, :-2], a[1:-1, :-2], a[:-2, :-2]]
            n = sum(x.astype(np.uint8) for x in p)
            transitions = sum((~p[i] & p[(i + 1) % 8]).astype(np.uint8) for i in range(8))
            if phase == 0:
                keep = ~(p[0] & p[2] & p[4]) & ~(p[2] & p[4] & p[6])
            else:
                keep = ~(p[0] & p[2] & p[6]) & ~(p[0] & p[4] & p[6])
            remove = a[1:-1, 1:-1] & (n >= 2) & (n <= 6) & (transitions == 1) & keep
            count += int(remove.sum())
            a[1:-1, 1:-1][remove] = False
        if not count:
            return a[1:-1, 1:-1]


paths = []
# 楓, then 林; these bounds select complete glyphs in the right-hand column.
for low, high in [(0, .52), (.52, 1)]:
    glyph = mask.copy()
    glyph[:round(low * height)] = False
    glyph[round(high * height):] = False
    skeleton = thin(glyph)
    components, total = label(skeleton, structure=np.ones((3, 3)))
    for index in range(1, total + 1):
        points = set(zip(*np.where(components == index)))
        if len(points) < 3:
            continue
        graph = {p: sorted((q for dy in (-1, 0, 1) for dx in (-1, 0, 1)
                            if (dy or dx) and (q := (p[0] + dy, p[1] + dx)) in points
                            and not (dy and dx and ((p[0] + dy, p[1]) in points or (p[0], p[1] + dx) in points)))) for p in points}
        visited = set()
        routes = []
        starts = sorted(points, key=lambda p: (len(graph[p]) == 2, p[0], p[1]))
        for start in starts:
            for neighbour in graph[start]:
                edge = tuple(sorted((start, neighbour)))
                if edge in visited:
                    continue
                route = [start, neighbour]
                visited.add(edge)
                previous, current = start, neighbour
                while len(graph[current]) == 2:
                    following = next(p for p in graph[current] if p != previous)
                    edge = tuple(sorted((current, following)))
                    if edge in visited:
                        break
                    visited.add(edge)
                    route.append(following)
                    previous, current = current, following
                # Prefer a top-to-bottom / left-to-right reveal within each path.
                if route[-1] < route[0]:
                    route.reverse()
                routes.append(route)
        routes.sort(key=lambda r: (int(np.mean([p[1] for p in r]) > width * .48), min(p[0] for p in r), min(p[1] for p in r)))
        for route in routes:
            coords = [[round(x / width, 5), round(y / height, 5), round((radius[y, x] + 2.5) / width, 5)] for y, x in route]
            paths.append(coords)

data = {'src': 'assets/leaf-1-3.webp', 'crop': CROP,
        'label': '第七頁・楓林局部', 'duration': 14, 'paths': paths,
        'method': 'Raster-derived reveal paths; illustrative order, not recorded brush movements.'}
target = ROOT / 'dist/data/wang-writing.json'
target.write_text(json.dumps(data, ensure_ascii=False, separators=(',', ':')) + '\n')
print(f'{target.name}: {width} × {height}, {len(paths)} reveal paths')
