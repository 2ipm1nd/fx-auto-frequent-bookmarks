# Auto Frequent Bookmarks

[繁體中文](#繁體中文) | [English](#english)

---

## 繁體中文

自動根據瀏覽歷史，將常用書籤整理並顯示在擴充功能的彈出視窗中。支援 Firefox 與 Google Chrome / Microsoft Edge (跨瀏覽器 Manifest V3 架構)。

### 下載安裝

* **Firefox**：**[➜ 前往 Firefox 附加元件頁面安裝](https://addons.mozilla.org/zh-TW/firefox/addon/auto-frequent-bookmarks/)**
* **Chrome / Edge**：前往 [GitHub Releases](https://github.com/) 下載最新版本的 `chrome-auto-frequent-bookmarks-*.zip`，解壓縮後於瀏覽器載入。

#### 本機開發與載入方式
* **Firefox**：網址列輸入 `about:debugging#/runtime/this-firefox`，點選「載入暫時性附加元件...」，選擇專案目錄中的 `manifest.json`。
* **Chrome / Edge**：網址列輸入 `chrome://extensions/`，開啟右上角「開發人員模式」，點選左上角「載入未封裝項目」，選擇專案目錄。

### 功能

- 從指定書籤資料夾掃描書籤，查詢瀏覽歷史後排序
- 依「最近造訪時間」、「總造訪次數」或「加權綜合」排序
- 同網域書籤自動合併，只保留造訪最多的代表 URL
- 可設定只顯示最近 N 天內有造訪的書籤 (時間篩選)
- 子資料夾預設不遞迴掃描，需明確勾選才納入
- 支援瀏覽器啟動時自動更新、定時自動更新
- 點擊工具列圖示開啟快速書籤 Popup (含搜尋與造訪日期)
- Popup 快速置頂：在 Popup 列表右側提供 SVG 置頂按鈕，滑鼠移上時顯現，可直接點擊進行置頂/取消置頂，並同步更新至瀏覽器書籤列，無需每次進入設定頁
- 可設定排除特定網域
- 可置頂指定書籤，永遠排在最前

### 設定項目

| 設定 | 說明 |
|------|------|
| 來源資料夾 | 勾選要掃描的書籤資料夾 (子資料夾需另外勾選) |
| 排序方式 | 最近造訪時間 / 總造訪次數 / 加權綜合 |
| 最多顯示筆數 | 輸出書籤數量上限 |
| 只顯示最近有造訪 | 不限制 / 1 個月 / 3 個月 / 6 個月 / 1 年 |
| 啟動時自動重新整理 | 開啟瀏覽器時自動執行 |
| 定時自動更新 | 每隔指定時間自動執行 (15 分鐘～24 小時) |
| 排除清單 | 不希望出現的網域 (每行一個 hostname) |
| 置頂書籤 | 永遠排在最前面的 URL (每行一個完整 URL) |

---

## English

Automatically organizes your frequently visited bookmarks and displays them in a quick access popup, based on your browsing history. Supports both Firefox and Google Chrome / Microsoft Edge (Cross-browser Manifest V3 architecture).

### Download & Installation

* **Firefox**: **[➜ Install from Firefox Add-ons](https://addons.mozilla.org/zh-TW/firefox/addon/auto-frequent-bookmarks/)**
* **Chrome / Edge**: Download the latest `chrome-auto-frequent-bookmarks-*.zip` from [GitHub Releases](https://github.com/), unzip it, and load it unpacked.

#### Local Development / Loading
* **Firefox**: Go to `about:debugging#/runtime/this-firefox`, click "Load Temporary Add-on...", and select `manifest.json`.
* **Chrome / Edge**: Go to `chrome://extensions/`, enable "Developer mode", click "Load unpacked", and select the project folder.

### Features

- Scans selected bookmark folders and sorts by browsing history
- Sort by last visit time, total visit count, or weighted score (recency + frequency)
- Merges bookmarks from the same domain, keeping the most-visited URL
- Optional time filter: only show bookmarks visited within the last N days
- Subfolders are not scanned by default - check them explicitly to include
- Supports auto-refresh on browser startup and on a scheduled interval
- Toolbar icon popup for quick access with live search and last-visit dates
- Popup Quick-Pin: Convenient SVG pin buttons on the right side of popup items allow you to pin/unpin bookmarks instantly without opening the options page
- Domain exclusion list to hide unwanted sites
- Pinned bookmarks always appear at the top regardless of sort order

### Settings

| Setting | Description |
|---------|-------------|
| Source folders | Check folders to scan (subfolders must be checked separately) |
| Sort mode | Last visit time / Total visit count / Weighted (recency + frequency) |
| Max results | Maximum number of bookmarks to output |
| Recency filter | Off / Last 1 month / 3 months / 6 months / 1 year |
| Refresh on startup | Auto-run when browser starts |
| Auto-refresh interval | Run every N minutes/hours (15 to 1440 min) |
| Exclusion list | Hostnames to exclude from results (one per line) |
| Pinned bookmarks | URLs that always appear first (one full URL per line) |
