# 在 Mac 上把專案放到 GitHub

這份下載包沒有原網站的 Git 歷史、遠端認證或 Sites 專案身分設定，適合在你自己的 GitHub 建立一份獨立專案。原公開網站仍然運作。先在 VS Code 開啟包含 README.md 與 dist/ 的最外層資料夾。

## 建立自己的儲存庫

1. 登入 GitHub，建立名為 peiling-ink-gallery 的新 repository。為了照下列步驟一次推上去，建立空白 repository，不先加入 README、License 或 .gitignore。
2. 回到 VS Code，開啟「原始檔控制」，選「初始化存放庫」。檢查檔案清單，輸入「保存書法雲展初版」，提交（Commit）。
3. 選「發布分支」或新增遠端，連到你剛建立的 repository。VS Code 若要求登入 GitHub，依畫面完成。
4. Push 完成後，回 GitHub 檢查 README、dist、docs 與測試是否都在。

若改用終端機，先切到解壓縮的專案資料夾，再依序執行：

```sh
git init
git add .
git commit -m "保存書法雲展初版"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/peiling-ink-gallery.git
git push -u origin main
```

YOUR_USERNAME 要換成你的 GitHub 帳號，網址也可直接從 GitHub 的 Code 按鈕複製。如果資料夾原本已有自己的 Git repo，先用 git status 與 git remote -v 確認，不重複初始化／新增 origin。未安裝 Git 時，macOS 可能提示安裝命令列工具；依系統提示處理。第一次 commit 可能要求設定 Git 姓名與 email，填自己希望出現在提交紀錄上的資料。

## 要不要啟用網站

只有 push 是保存程式碼。若想讓 GitHub 也提供一個公開網站：

1. Repository → Settings → Pages。
2. 在 Build and deployment 的 Source 選 GitHub Actions。
3. 本專案已提供 .github/workflows/pages.yml，將檢查、測試後發布 dist/。如第一次 push 時尚未啟用 Pages，在 Actions 選 Deploy gallery to GitHub Pages → Run workflow。
4. 執行成功後，Pages 顯示你的實際網址，一般形式為 https://YOUR_USERNAME.github.io/peiling-ink-gallery/。
5. 檢查首頁、作品全圖、冊頁、試裱下載與花氣帖有聲影片。

Workflow 預設 main 分支；若用其他主分支名稱，須同步修改。使用 GitHub Actions 部署時不要另設從 repository 根目錄發布；真正網站在 dist/。檢查通過不等於已在你的 GitHub 成功部署，仍需完成 repository 設定並確認 Actions 結果。

一般 GitHub Free 帳號使用 public repository 提供 Pages；private repository 的 Pages 可用性依帳號方案而定。完整上傳程式碼與啟用 Pages 是兩個不同決定。

## 分享短網址

目前網址可貼到 Bitly 這類短網址服務，產生較短的分享連結；短網址只是轉到原網站。自選尾碼是否可用依服務方案與名稱是否已被使用而定，本專案尚未建立任何短網址。

長期若想固定品牌網址，可以另購自己的網域，再指向選定的主機；GitHub Pages 支援自訂網域，但需另外設定 DNS。現在分享原網址即可，不影響網站功能。

## 日後更新

在本機修改 → HTTP 預覽 → 執行檢查 → 查看差異 → commit → push。若啟用這份 Pages workflow，push main 後會自動執行檢查與發布。

你在 GitHub 的改動不會自動同步回目前 chatgpt.site 網站；兩個主機各自部署。正式選定一個主要網站後，再統一分享網址。

官方參考（查核於 2026-10-24）：
- https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
- https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages
- https://bitly.com/pages/products/url-shortener-cp
