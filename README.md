# 墨境｜培玲書法雲展

康培玲的書法與水墨作品網站。這份專案整理於 2026-10-24，畫面與目前公開初版一致，包含 **17 組作品、516 張高解析圖塊，以及花氣帖有聲影片**。

使用 HTML、CSS、JavaScript，沒有框架、沒有前端套件安裝或編譯步驟。`dist/` 是直接可部署的網站，也是這份專案的主要原始碼，修改這裡會直接改變畫面。

目前公開網址：https://ink-cloud-gallery-peiling.m200-3-2011.chatgpt.site/

## 第一次開啟

1. 解壓縮完整資料夾，以 VS Code 的「檔案 → 開啟資料夾」開啟專案根目錄。
2. 在 VS Code 安裝 Live Server 擴充功能。本專案已設定網站根目錄為 `/dist`。
3. 對 `dist/index.html` 按右鍵，選「Open with Live Server」。之後修改、儲存即可預覽。

也可以在專案根目錄開終端機，以 Python 3 啟動：

```sh
python3 -m http.server 8000 --directory dist
```

瀏覽器開啟 http://localhost:8000 。按 `Control+C` 停止伺服器。不要直接雙擊 HTML：作品資料使用 JSON 與 JavaScript 模組，需透過 HTTP 讀取。

**瀏覽網站不需要 Python、Node.js 或 ChatGPT 帳號。** 開發時上述工具才依用途使用。

## 從哪裡修改

| 想做的事 | 修改位置 |
| --- | --- |
| 作品名稱、年份、釋文、心得、分類、精選順序 | `dist/data/artworks.json` |
| 首頁主視覺、序言、關於我、聯絡信箱 | `dist/index.html` |
| 全站字體、顏色、共用字級與容器 | `dist/static/css/base.css` |
| 首頁區塊、作品入口與裝裱室排版 | `dist/static/css/index.css` |
| 作品大圖與展籤排版 | `dist/static/css/work.css` |
| 大圖縮放、拖曳 | `dist/static/js/art-viewer.js` |
| 試框、掛軸、場景與下載 | `dist/static/js/studio.js`、`scroll.js`、`wood.js` |
| 花氣帖影片與重播 | `dist/depth.html`、`dist/static/js/depth.js` |
| 作品影像、場景、印章、影片 | `dist/assets/` |

CSS 依 `reset.css → base.css → 各頁專用 CSS` 載入；HTML 保留 viewport。全域規則統一維護，不把同一份樣式貼到多個頁面。各模組依功能分工，作品內容以 JSON 為單一來源。

## 文件

- [維護說明與新增作品](docs/MAINTENANCE.md)
- [上傳 GitHub、設定 GitHub Pages](docs/GITHUB.md)
- [用這個專案學 Codex](docs/CODEX-BEGINNER.md)
- [Codex 專案工作規範](AGENTS.md)
- [歷次設計紀錄](docs/CHANGELOG-archive.md)：歷史資料，已被後續修改取代的段落不作為現在操作說明。

## 檢查

安裝 Node.js 22 或更新版本與 Python 3 後，在專案根目錄執行：

```sh
python3 scripts/check_site.py
node --test
```

也可使用 `npm run check`、`npm test`、`npm run serve`；不需要 `npm install`，沒有 `npm run build`。只有處理新圖片的 Python 工具需要另外安裝 `requirements.txt`。

## 目前功能與範圍

- 首頁、分類展廳、作品詳情、全幅縮放、冊頁切換。
- 「筆墨走進日常」目前只開放王鐸唐詩與蜀素帖兩件試用；橫幅只提供框裱。
- 花氣帖使用單一 20 秒 MP4，內含配樂。播完停留最後畫面，中央三角形重播；瀏覽器若限制有聲自動播放，點中央鍵啟動。
- 山水作品採可縮放全景；舊山水實驗連結保留導向原作。
- 尚未串接 Google 試算表、帳號、付款、訂單或會員。
- 專案包含目前網頁使用的影像與影片；原始高解析 TIFF、原始拍攝全集、Word／Pages 私人作品表不在此交付範圍。

網站可以獨立部署到 GitHub Pages 等靜態主機。上傳 GitHub 是保存程式碼；啟用 Pages 才會產生另一個可公開瀏覽的網址。目前公開網站仍可繼續使用。
