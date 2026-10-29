#!/usr/bin/env python3
"""從掃描原檔建立網頁影像。原檔只讀，不會改寫。詳見 README。"""
import argparse
import json
import math
import re
from pathlib import Path

from PIL import Image


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('image', type=Path)
    parser.add_argument('--id', required=True, help='作品英文代號，例如 new-work')
    parser.add_argument('--tiles', action='store_true', help='建立高解析分層圖塊')
    parser.add_argument('--page-boxes', type=Path,
                        help='按閱讀順序排列的裁切框 JSON：[[left,top,right,bottom], ...]')
    parser.add_argument('--poster-box', nargs=4, type=int, metavar=('L', 'T', 'R', 'B'))
    parser.add_argument('--output', type=Path,
                        default=Path(__file__).resolve().parents[1] / 'dist')
    args = parser.parse_args()
    if not re.fullmatch(r'[a-z][a-z0-9-]*', args.id):
        parser.error('--id 只能包含小寫英文、數字與連字號')
    asset_dir = args.output / 'assets' / 'works' / args.id
    data_dir = args.output / 'data'
    if asset_dir.exists() or (data_dir / f'{args.id}-pages.json').exists():
        parser.error('作品代號已存在；請使用新的代號，避免覆蓋現有影像')
    # Allow large, user-supplied scans while preserving a finite safety ceiling.
    Image.MAX_IMAGE_PIXELS = 200_000_000
    with Image.open(args.image) as original:
        image = original.convert('RGB')
    width, height = image.size
    boxes = json.loads(args.page_boxes.read_text()) if args.page_boxes else []
    for box in boxes + ([args.poster_box] if args.poster_box else []):
        if (len(box) != 4 or not all(isinstance(v, int) for v in box)
                or not (0 <= box[0] < box[2] <= width and 0 <= box[1] < box[3] <= height)):
            parser.error(f'裁切範圍不符合影像尺寸：{box}')
    asset_dir.mkdir(parents=True)
    data_dir.mkdir(parents=True, exist_ok=True)
    overview = image.copy()
    overview.thumbnail((1400, 2200))
    overview.save(asset_dir / 'overview.webp', quality=88)
    poster = image.crop(args.poster_box) if args.poster_box else image.copy()
    poster.thumbnail((1800, 1800))
    poster.save(asset_dir / 'poster.webp', quality=90)
    relative = f'assets/works/{args.id}/'
    metadata = {'width': width, 'height': height, 'tileSize': 512, 'levels': [], 'leaves': []}
    if args.tiles:
        max_level = max(0, math.ceil(math.log2(max(width, height) / 256)))
        for level in range(max_level + 1):
            scale = 2 ** (level - max_level)
            size = (math.ceil(width * scale), math.ceil(height * scale))
            layer = image.resize(size, Image.Resampling.LANCZOS)
            folder = asset_dir / 'tiles' / str(level)
            folder.mkdir(parents=True)
            for y in range(math.ceil(size[1] / 512)):
                for x in range(math.ceil(size[0] / 512)):
                    layer.crop((x * 512, y * 512, min((x + 1) * 512, size[0]),
                                min((y + 1) * 512, size[1]))).save(folder / f'{x}_{y}.webp', quality=90)
            metadata['levels'].append({'width': size[0], 'height': size[1], 'scale': scale})
    for index, box in enumerate(boxes, 1):
        page = image.crop(box)
        page.thumbnail((1600, 4000))
        page.save(asset_dir / f'page-{index}.webp', quality=90)
        metadata['leaves'].append({'url': relative + f'page-{index}.webp',
                                   'page': index, 'label': f'第{index}頁'})
    if args.tiles or boxes:
        (data_dir / f'{args.id}-pages.json').write_text(
            json.dumps(metadata, ensure_ascii=False, indent=2) + '\n')
    print(f'影像已建立：{asset_dir}')
    print('請將作品資料加入 dist/data/artworks.json；程式不會自動發布。')


if __name__ == '__main__':
    main()
