# Auto Frequent Bookmarks

[繁體中文](#繁體中文) | [English](#english)

---

## 繁體中文

自動根據瀏覽歷史，將常用書籤整理到書籤工具列的指定資料夾。

### 下載安裝

**[➜ 前往 Firefox 附加元件頁面安裝](https://addons.mozilla.org/zh-TW/firefox/addon/auto-frequent-bookmarks/)**

### 功能

- 從指定書籤資料夾掃描書籤，查詢瀏覽歷史後排序
- 依「最近造訪時間」、「總造訪次數」或「加權綜合」排序
- 同網域書籤自動合併，只保留造訪最多的代表 URL
- 可設定只顯示最近 N 天內有造訪的書籤（時間篩選）
- 子資料夾預設不遞迴掃描，需明確勾選才納入
- 支援瀏覽器啟動時自動更新、定時自動更新
- 點擊工具列圖示開啟快速書籤 Popup（含搜尋與造訪日期）
- 可設定排除特定網域
- 可置頂指定書籤，永遠排在最前
- 可在輸出資料夾名稱後顯示更新時間

### 設定項目

| 設定 | 說明 |
|------|------|
| 來源資料夾 | 勾選要掃描的書籤資料夾（子資料夾需另外勾選） |
| 排序方式 | 最近造訪時間 / 總造訪次數 / 加權綜合 |
| 最多顯示筆數 | 輸出書籤數量上限 |
| 只顯示最近有造訪 | 不限制 / 1 個月 / 3 個月 / 6 個月 / 1 年 |
| 輸出資料夾名稱 | 書籤工具列上的資料夾名稱 |
| 顯示更新時間 | 在資料夾名稱後附加最後更新時間 |
| 啟動時自動重新整理 | 開啟瀏覽器時自動執行 |
| 定時自動更新 | 每隔指定時間自動執行（15 分鐘 ～ 24 小時） |
| 排除清單 | 不希望出現的網域（每行一個 hostname） |
| 置頂書籤 | 永遠排在最前面的 URL（每行一個完整 URL） |

---

## English

Automatically organizes your frequently visited bookmarks into a dedicated folder on the bookmarks toolbar, based on your browsing history.

### Download

**[➜ Install from Firefox Add-ons](https://addons.mozilla.org/zh-TW/firefox/addon/auto-frequent-bookmarks/)**

### Features

- Scans selected bookmark folders and sorts by browsing history
- Sort by last visit time, total visit count, or weighted score (recency + frequency)
- Merges bookmarks from the same domain, keeping the most-visited URL
- Optional time filter: only show bookmarks visited within the last N days
- Subfolders are not scanned by default — check them explicitly to include
- Supports auto-refresh on browser startup and on a scheduled interval
- Toolbar icon popup for quick access with live search and last-visit dates
- Domain exclusion list to hide unwanted sites
- Pinned bookmarks always appear at the top regardless of sort order
- Optional timestamp appended to the output folder name

### Settings

| Setting | Description |
|---------|-------------|
| Source folders | Check folders to scan (subfolders must be checked separately) |
| Sort mode | Last visit time / Total visit count / Weighted (recency + frequency) |
| Max results | Maximum number of bookmarks to output |
| Recency filter | Off / Last 1 month / 3 months / 6 months / 1 year |
| Output folder name | Name of the folder on the bookmarks toolbar |
| Show timestamp | Append last update time to the folder name |
| Refresh on startup | Auto-run when Firefox starts |
| Auto-refresh interval | Run every N minutes/hours (15 min – 24 hr) |
| Exclusion list | Hostnames to exclude from results (one per line) |
| Pinned bookmarks | URLs that always appear first (one full URL per line) |
