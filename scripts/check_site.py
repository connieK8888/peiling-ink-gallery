#!/usr/bin/env python3
"""驗證網站連結、作品資料、圖塊、模組與 CSS。無第三方依賴。"""
import json
import math
import re
import subprocess
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / 'dist'


class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = []
        self.references = []
        self.styles = []
        self.viewport = False
        self.inline_handlers = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if 'id' in attrs:
            self.ids.append(attrs['id'])
        if tag == 'meta' and attrs.get('name') == 'viewport':
            self.viewport = True
        if tag == 'link' and attrs.get('rel') == 'stylesheet':
            self.styles.append(attrs['href'])
        for key, value in attrs.items():
            if key.startswith('on'):
                self.inline_handlers.append(key)
            if key in ['src', 'href'] and value:
                self.references.append(value)


def require_file(path):
    assert path.is_file(), f'缺少檔案：{path.relative_to(ROOT)}'


def check():
    pages = {}
    for path in SITE.glob('*.html'):
        page = Page()
        page.feed(path.read_text())
        assert len(page.ids) == len(set(page.ids)), f'{path.name} 有重複 ID'
        assert page.viewport, f'{path.name} 缺少 viewport'
        assert not page.inline_handlers, f'{path.name} 有行內事件處理程式'
        assert page.styles[:2] == ['static/css/reset.css', 'static/css/base.css']
        for reference in page.references:
            parsed = urlsplit(reference)
            if not parsed.scheme and parsed.path:
                require_file(path.parent / parsed.path)
        pages[path.stem] = page
    for path in (SITE / 'static/js').glob('*.js'):
        subprocess.run(['node', '--check', str(path)], check=True, capture_output=True)
        text = path.read_text()
        for reference in re.findall(r"from ['\"]([^'\"]+)['\"]", text):
            require_file(path.parent / urlsplit(reference).path)
        target = pages['work' if path.stem == 'work' else 'index']
        if path.stem in ['work', 'studio', 'gallery']:
            for identifier in re.findall(r"\$\(['\"]([^'\"]+)['\"]\)", text):
                assert identifier in target.ids, f'{path.name} 找不到 #{identifier}'
    for path in (SITE / 'static/css').glob('*.css'):
        text = path.read_text()
        assert text.count('{') == text.count('}'), f'{path.name} 大括號不平衡'
        for reference in re.findall(r'url\([\'\"]?([^\'\"\)]+)', text):
            if not reference.startswith('#'):
                require_file(path.parent / urlsplit(reference).path)
    catalog = json.loads((SITE / 'data/artworks.json').read_text())
    assert catalog and len({art['id'] for art in catalog}) == len(catalog)
    assert all(art.get('exhibitionCategory') in ['行書', '隸書', '楷書泥金心經', '水墨畫'] for art in catalog), '作品缺少有效展廳分類'
    tile_count = 0
    for art in catalog:
        assert re.fullmatch(r'[a-z][a-z0-9-]*', art['id']), '作品代號格式錯誤'
        for field in ['title', 'author', 'year', 'format', 'overview', 'poster', 'description']:
            assert field in art, f'{art["id"]} 缺少 {field}'
        for photo in [art] + (art.get('views', []) + art.get('supplementalViews', [])):
            crop = photo.get('crop')
            if crop:
                assert len(crop) == 4 and all(isinstance(v, (int, float)) for v in crop)
                assert 0 <= crop[0] < crop[2] <= 1 and 0 <= crop[1] < crop[3] <= 1
        require_file(SITE / art['overview'])
        require_file(SITE / art['poster']['src'])
        for view in (art.get('views', []) + art.get('supplementalViews', [])):
            require_file(SITE / view['url'])
            assert view['label']
    featured = [art['featuredOrder'] for art in catalog if art.get('featuredOrder') is not None]
    assert len(featured) == len(set(featured)), '精選順序重複'
    for art in catalog:
        if art['studio']:
            assert 0 < art['studioHeight'] <= 100 and 0 <= art['studioTop'] <= 100
        for reference in {art.get('pages'), art.get('pyramid')} - {None}:
            require_file(SITE / reference)
            metadata = json.loads((SITE / reference).read_text())
            for page in metadata['leaves']:
                require_file(SITE / page['url'])
            assert [p['page'] for p in metadata['leaves']] == list(range(1, len(metadata['leaves']) + 1))
            for level, size in enumerate(metadata['levels']):
                for y in range(math.ceil(size['height'] / metadata['tileSize'])):
                    for x in range(math.ceil(size['width'] / metadata['tileSize'])):
                        require_file(SITE / art['tileBase'] / str(level) / f'{x}_{y}.webp')
                        tile_count += 1
    motion = json.loads((SITE / 'data/wang-writing.json').read_text())
    require_file(SITE / motion['src'])
    assert motion['paths'] and motion['duration'] > 0
    assert all(0 <= v <= 1 for path in motion['paths'] for point in path for v in point), '書寫遮罩超出範圍'
    print(f'通過：{len(pages)} 個頁面、{len(catalog)} 件作品、{tile_count} 張圖塊與所有本機資源。')


if __name__ == '__main__':
    check()
