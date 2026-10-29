"""Rectify the photographed sheet without synthesizing or redrawing any marks.

Source is retained. Points are just inside the visible paper edge, clockwise.
Output ratio follows the supplied 70 x 135 cm painting size.
"""
from pathlib import Path
import numpy as np
from PIL import Image
ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'dist/assets/works/clerical-poem/original.jpg'
OUTPUT = SOURCE.with_name('rectified-v1.jpg')
width, height = 1024, round(1024 * 135 / 70)
source_corners = [(83, 72), (993, 25), (1145, 1969), (39, 2011)]
dest_corners = [(0, 0), (width, 0), (width, height), (0, height)]
a, b = [], []
for (x, y), (u, v) in zip(dest_corners, source_corners):
    a.extend([[x,y,1,0,0,0,-u*x,-u*y], [0,0,0,x,y,1,-v*x,-v*y]])
    b.extend([u,v])
coeffs = np.linalg.solve(np.array(a, dtype=float), np.array(b, dtype=float))
with Image.open(SOURCE) as original:
    rectified = original.transform((width, height), Image.Transform.PERSPECTIVE,
                                   coeffs, Image.Resampling.BICUBIC)
    rectified.save(OUTPUT, quality=96, subsampling=0)
print(OUTPUT.relative_to(ROOT), rectified.size)
