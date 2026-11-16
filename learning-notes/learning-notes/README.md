# 學習筆記庫

繁體中文的跨主題筆記網站。目前收錄作業研究的 EDD、Moore–Hodgson 與資料庫的 SQL GROUP BY。

## 開啟網站
直接開啟 `docs/index.html`。修改內容後使用 Node.js 執行 `node build.mjs`。

## 繼續擴充
請 AI 先讀 [AGENTS.md](AGENTS.md)，再於 `notes/` 新增一篇 JSON。重建後會自動產生文章並更新首頁分類。

提示詞範例：「請依照 AGENTS.md 新增一篇統計學筆記，說明樣本平均數，加入一個可手算的例題，再重建網站並檢查連結。」

## GitHub Pages
將此資料夾內的完整專案推送到公開 GitHub 儲存庫，在 Settings → Pages 選擇 Deploy from a branch，使用 main 分支的 /docs 並儲存。部署完成後可從同一頁開啟公開網址。

