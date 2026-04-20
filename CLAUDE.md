# fx-auto-frequent-bookmarks

Firefox WebExtension，在瀏覽器啟動時自動從指定書籤資料夾讀取書籤、查詢瀏覽歷史、合併同網域書籤、排序後寫入書籤工具列的指定資料夾。

## 技術規格

- Manifest V2（browser.history 在 MV2 最穩定）
- background.js persistent: true（確保 onStartup 不漏觸發）
- 純 vanilla JS，無外部依賴
- 最低支援 Firefox 140

## 檔案結構

```
├── manifest.json          # MV2，權限：bookmarks/history/storage/alarms
├── background.js          # 核心 pipeline 邏輯
├── options/
│   ├── options.html       # 設定頁面
│   ├── options.js         # 設定頁面邏輯
│   └── options.css        # 樣式
├── icons/
│   ├── icon-48.png
│   └── icon-96.png
├── .web-ext-config.json
└── .github/workflows/
    └── release.yml        # 推 v* tag 自動簽署並建立 GitHub Release
```

## 核心邏輯（background.js）

```
onStartup / onInstalled / onMessage("REFRESH") / alarms.onAlarm
  → readSettings()
  → collectBookmarks(folderIds)   # 遞迴 getChildren，URL 去重
  → queryVisits(bookmarks)        # 循序呼叫 history.getVisits
  → groupByDomain(bookmarks, map) # 依 hostname 分組，選代表 URL
  → 排序（lastVisitTime 或 totalVisits）
  → slice(0, maxResults)
  → findOrCreateOutputFolder()    # 用 storage 記住 ID，支援資料夾移動
  → clearFolder()
  → writeBookmarks()
```

## 設定項目（storage.local）

| 鍵 | 預設值 | 說明 |
|---|---|---|
| sourceFolderIds | [] | 來源書籤資料夾 ID 陣列 |
| sortMode | "lastVisit" | "lastVisit" 或 "visitCount" |
| maxResults | 20 | 最多輸出筆數 |
| outputFolderName | "🔥 常用書籤" | 輸出資料夾名稱 |
| refreshOnStartup | true | 瀏覽器啟動時是否執行 |
| alarmInterval | 0 | 定時更新間隔（分鐘），0 為關閉 |
| outputFolderId | null | 輸出資料夾 ID（記住以支援移動） |

## AMO 發布資訊

- 擴充套件 ID：`fx-auto-frequent-bookmarks@local`（AMO 登記後無法更改）
- Listed 版本：等待審核中
- Self-hosted 版本：已簽署，可下載安裝

## GitHub Actions 發版流程

```bash
# 更新功能後直接推 tag，版本號自動同步進 manifest.json
git tag v1.x.x
git push origin v1.x.x
```

所需 GitHub Secrets：`AMO_JWT_ISSUER`、`AMO_JWT_SECRET`

## 重要設計決策

- **TOOLBAR_ID = "toolbar_____"**（5 個底線，共 12 字元，這個很容易打錯）
- outputFolderId 存進 storage，讓輸出資料夾可以被使用者自由移動
- 同網域書籤合併：選造訪次數最多的 URL 為代表
- alarms 在瀏覽器重開後會消失，因此 onStartup 時重新建立
