# 維護與作品上架

## 程式分工

| 資料夾 | 用途 |
| --- | --- |
| dist/*.html | 首頁、展廳、作品詳情、花氣帖影片、舊山水連結 |
| dist/static/css | reset、共用樣式、各頁樣式 |
| dist/static/js | 縮放器、作品卡片、展籤、框裱、掛軸、木紋、影片等模組 |
| dist/data | 作品目錄、王鐸冊頁／高解析圖塊座標 |
| dist/assets | 作品影像、圖塊、場景、印章、聲音、影片 |
| scripts | 檢查、產生新影像、透視校正與動畫準備工具 |
| tests | 無第三方 JS 測試套件的 Node 內建測試 |
| docs | 維護、GitHub、Codex 入門與歷史紀錄 |

目前 CSS 已有共用變數與響應式規則。維護時延續現有斷點，不為統一命名而大幅重寫已核可畫面。每個頁面有自己的 CSS，不將所有樣式塞進 index.html。

## 修改既有作品

開啟 dist/data/artworks.json。用 id 或 title 找作品，修改目標欄位。JSON 的字串必須用英文雙引號，陣列項目間用逗號，最後一筆後面沒有逗號。

| 欄位 | 用途 |
| --- | --- |
| id | 固定作品代號，已分享的網址依賴它，不隨意改名 |
| title、year、script、size、material | 名稱與備存資料；保留現有欄位格式 |
| transcription、note、supplement | 完整釋文、心得、補充資料 |
| displayTranscription、displayNote | 若存在，公開展籤優先顯示的精選文字 |
| transcriptionExcerpt | 是否把公開釋文標記為節錄，全文時移除或 false |
| exhibitionCategory | 行書、隸書、楷書泥金心經、水墨畫 |
| featuredOrder | 首頁精選順序；不需精選時省略此欄位 |
| overview | 點入作品後的主圖 |
| poster | 入口縮圖來源、局部焦點、縮放與替代文字 |
| views、supplementalViews | 同作版本或補充照片；每個版本保留自己的說明 |
| studio | 是否出現在試裱選單；不能只因上架就設為 true |
| studioOrientation | portrait 或 landscape；橫幅不提供掛軸 |

畫面精選與完整資料不同時，保留原始欄位，使用 display 欄位精簡。雪景隸書已指定全文，不設節錄。修改後重新整理作品頁與展廳，確認名稱、圖片、分頁與展籤都正確。

## 新增作品

1. 準備完整作品圖及入口圖，放 dist/assets/works/新的英文代號/。
2. 複製目錄中最接近的作品資料作為範本，換成唯一 id、真實資料與相對路徑。沒有的資訊留空，不推測年份與尺寸。
3. 一般單張照片使用 pages: null；高解析圖塊需要另外生成並設定 pyramid、tileBase。不要把其他作品的圖塊路徑留在新作品上。
4. 設定分類，必要時加入精選排序；保留原作落款與原框裱，只裁去環境雜邊。
5. 含既有實體框、掛軸，或尚未備妥畫心的照片，先設 studio: false。
6. 執行檢查、預覽，再 commit。相同作品的新照片／不同時期版本，先判斷是否併入 views。

只有製作新影像才需要：

```sh
python3 -m pip install -r requirements.txt
python3 scripts/prepare_artwork.py originals/new-work.tif --id new-work --tiles
```

工具不改寫原始掃描檔，會產生網站影像與圖塊資訊，但不自動新增作品資料或發布。originals/ 已從 Git 排除，原始檔另外妥善保存。雪景隸書幾何校正工具另外使用 NumPy，執行該工具時安裝 numpy；一般預覽與檢查不需要它。

## 花氣帖

- 已發布影片：dist/assets/video/flower-ink-music-20s.mp4，20 秒、內含配樂。
- 播放程式：dist/static/js/depth.js；外觀：dist/static/css/depth.css。
- 封面：dist/assets/video/flower-poster.jpg。
- 保持單一影片與中央播放／重播，不加多種播放模式。有聲自動播放受瀏覽器限制時用同一播放鍵啟動。
- music 為作者提供的 Kaazoom〈The Last Dynasty〉節選；沒有隨附原曲授權文件，本專案未另行認定其授權條款。

## 保留的實驗來源

ink-depth、ink-motion、motion-layout、landscape-scene 等模組及相關影像保留為原始渲染／實驗紀錄。現行花氣帖頁播放 MP4；landscape.html 導向可縮放原作。不要從舊測試名稱誤認現行網站仍使用山水立體動畫或王鐸筆順動畫。

## 每次修改

先建立可回復的 Git 紀錄；範圍明確地修改；檢查資料與互動；瀏覽桌機和窄畫面；確認後 commit。除非處理新問題，不要反覆執行已通過且未受影響的測試。

目前沒有後台資料庫、Google 試算表或付款；未來新增時應保留作品資料讀取模組的界面，另外處理登入與伺服器機密，不把憑證寫在前端。
