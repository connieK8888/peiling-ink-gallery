/** 共用資料載入。資料路徑以網頁所在位置為基準，適用於子目錄部署。 */
const requests = new Map();

export function loadJson(url) {
  if (!requests.has(url)) {
    const request = fetch(url).then((response) => {
      if (!response.ok) throw new Error(`資料讀取失敗：${url}`);
      return response.json();
    }).catch((error) => {
      requests.delete(url);
      throw error;
    });
    requests.set(url, request);
  }
  return requests.get(url);
}

export const loadArtworks = () => loadJson('data/artworks.json');

export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('影像載入失敗'));
    image.src = src;
  });
}
