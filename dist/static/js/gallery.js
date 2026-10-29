import {
  loadArtworks
} from './data.js';

const numerals = ['壹', '貳', '參', '肆', '伍', '陸', '柒', '捌', '玖', '拾', '拾壹', '拾貳', '拾參', '拾肆', '拾伍', '拾陸', '拾柒'];
const gallery = document.getElementById('art-gallery');
const exhibitionCategories = ['行書', '隸書', '楷書泥金心經', '水墨畫'];

/** 卡片內容均來自作品資料，新增作品不必複製 HTML。 */
function createArtworkCard(art, index) {
  const card = document.createElement('article');
  card.className = 'art-card';
  const link = document.createElement('a');
  link.className = `art-image ${art.poster.className}`;
  link.href = art.motion?.introUrl || `work.html?art=${encodeURIComponent(art.id)}`;
  link.setAttribute('aria-label', `欣賞${art.title}`);

  const image = document.createElement('img');
  image.src = art.poster.src;
  image.alt = art.poster.alt;
  image.loading = 'lazy';
  if (art.poster.position) image.style.objectPosition = art.poster.position;
  if (art.poster.origin) image.style.transformOrigin = art.poster.origin;
  if (art.poster.scale) {
    link.style.setProperty('--poster-scale', art.poster.scale);
  }
  const action = document.createElement('span');
  action.className = 'image-action';
  action.textContent = art.motion?.introUrl ? '墨韻開場・入內賞全幅 ↗' : '入內賞全幅 ↗';
  link.append(image, action);

  const meta = document.createElement('div');
  meta.className = 'art-meta';
  const number = document.createElement('span');
  number.className = 'art-number';
  number.textContent = numerals[index] || String(index + 1);
  const details = document.createElement('div');
  const title = document.createElement('h3');
  title.textContent = art.title;
  const caption = document.createElement('p');
  caption.textContent = art.caption;
  details.append(title, caption);
  for (const text of art.tags || []) {
    const tag = document.createElement('span');
    tag.className = 'tag';
    tag.textContent = text;
    details.append(tag);
  }
  meta.append(number, details);
  card.append(link, meta);
  return card;
}

loadArtworks().then((artworks) => {
  const selected = gallery.dataset.view === 'featured'
    ? artworks.filter(art => Number.isInteger(art.featuredOrder)).sort((a, b) => a.featuredOrder - b.featuredOrder)
    : artworks;
  if (gallery.dataset.view === 'featured') {
    gallery.replaceChildren(...selected.map(createArtworkCard));
  } else {
    let artworkIndex = 0;
    const sections = exhibitionCategories.map((category, index) => {
      const entries = selected.filter(art => art.exhibitionCategory === category);
      if (!entries.length) return null;
      const section = document.createElement('section');
      section.className = 'collection-group';
      const heading = document.createElement('h2');
      heading.id = `collection-group-${index + 1}`;
      heading.textContent = category;
      section.setAttribute('aria-labelledby', heading.id);
      const grid = document.createElement('div');
      grid.className = 'art-grid poster-grid';
      entries.forEach(art => grid.append(createArtworkCard(art, artworkIndex++)));
      section.append(heading, grid);
      return section;
    }).filter(Boolean);
    gallery.replaceChildren(...sections);
  }
  const count = document.getElementById('catalog-count');
  if (count) count.textContent = String(artworks.length);
}).catch(() => {
  gallery.textContent = '作品暫時無法載入，請稍後重新整理。';
});
