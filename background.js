const DEFAULT_SETTINGS = {
  sourceFolderIds: [],
  sortMode: "lastVisit", // "lastVisit" | "visitCount" | "weighted"
  maxResults: 20,
  maxAgeDays: 0, // 0 = 不限制，其他為天數
  outputFolderName: "🔥 常用書籤",
  refreshOnStartup: true,
  alarmInterval: 0, // 0 = 關閉，其他為分鐘數
  excludedDomains: [], // 排除的 hostname 清單
  pinnedUrls: [],      // 永遠置頂的 URL 清單
  showTimestamp: false, // 是否在資料夾名稱後顯示更新時間
};

const TOOLBAR_ID = "toolbar_____";

async function readSettings() {
  const stored = await browser.storage.local.get(DEFAULT_SETTINGS);
  return { ...DEFAULT_SETTINGS, ...stored };
}

async function collectBookmarks(folderIds) {
  const folderSet = new Set(folderIds);
  const results = [];

  async function traverse(nodeId) {
    let children;
    try {
      children = await browser.bookmarks.getChildren(nodeId);
    } catch (e) {
      console.warn(`無法讀取資料夾 ${nodeId}:`, e);
      return;
    }
    for (const child of children) {
      if (child.url) {
        results.push({ id: child.id, title: child.title, url: child.url });
      } else if (folderSet.has(child.id)) {
        await traverse(child.id);
      }
    }
  }

  for (const id of folderIds) {
    await traverse(id);
  }

  // 依 URL 去重
  const seen = new Set();
  return results.filter((b) => {
    if (seen.has(b.url)) return false;
    seen.add(b.url);
    return true;
  });
}

async function queryVisits(bookmarks) {
  const visitMap = new Map();
  for (const bookmark of bookmarks) {
    try {
      const visits = await browser.history.getVisits({ url: bookmark.url });
      if (visits.length === 0) {
        visitMap.set(bookmark.url, { visitCount: 0, lastVisitTime: 0 });
      } else {
        const lastVisitTime = Math.max(...visits.map((v) => v.visitTime));
        visitMap.set(bookmark.url, {
          visitCount: visits.length,
          lastVisitTime,
        });
      }
    } catch (e) {
      visitMap.set(bookmark.url, { visitCount: 0, lastVisitTime: 0 });
    }
  }
  return visitMap;
}

function extractHostname(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

function groupByDomain(bookmarks, visitMap) {
  const domainMap = new Map();

  for (const bookmark of bookmarks) {
    const hostname = extractHostname(bookmark.url);
    const visits = visitMap.get(bookmark.url) || {
      visitCount: 0,
      lastVisitTime: 0,
    };

    if (!domainMap.has(hostname)) {
      domainMap.set(hostname, {
        hostname,
        entries: [],
        totalVisits: 0,
        lastVisitTime: 0,
      });
    }

    const group = domainMap.get(hostname);
    group.entries.push({ ...bookmark, ...visits });
    group.totalVisits += visits.visitCount;
    group.lastVisitTime = Math.max(group.lastVisitTime, visits.lastVisitTime);
  }

  const groups = [];
  for (const [hostname, group] of domainMap) {
    const representative = group.entries.reduce(
      (best, b) => (b.visitCount > best.visitCount ? b : best),
      group.entries[0]
    );

    groups.push({
      hostname,
      representativeUrl: representative.url,
      title: representative.title || hostname,
      totalVisits: group.totalVisits,
      lastVisitTime: group.lastVisitTime,
    });
  }

  return groups;
}

function weightedScore(totalVisits, lastVisitTime, halfLifeDays = 30) {
  const daysSince = (Date.now() - lastVisitTime) / 86400000;
  return totalVisits * Math.exp(-daysSince / halfLifeDays);
}

function applyPinnedUrls(groups, pinnedUrls) {
  if (!pinnedUrls.length) return groups;
  const pinnedSet = new Set(pinnedUrls);
  const urlToGroup = new Map(groups.map((g) => [g.representativeUrl, g]));
  const pinned = pinnedUrls.map((url) => urlToGroup.get(url)).filter(Boolean);
  const rest = groups.filter((g) => !pinnedSet.has(g.representativeUrl));
  return [...pinned, ...rest];
}

async function findOrCreateOutputFolder(name) {
  // 優先用 storage 裡記住的 ID，讓資料夾可以被移動到任意位置
  const { outputFolderId } = await browser.storage.local.get({ outputFolderId: null });
  if (outputFolderId) {
    try {
      const nodes = await browser.bookmarks.get(outputFolderId);
      if (nodes && nodes.length > 0 && !nodes[0].url) {
        return outputFolderId;
      }
    } catch {
      // ID 對應的資料夾已被刪除，繼續往下重建
    }
  }

  // 找不到已存的 ID，改用名稱在工具列搜尋
  const toolbarChildren = await browser.bookmarks.getChildren(TOOLBAR_ID);
  const existing = toolbarChildren.find(
    (n) => !n.url && (n.title === name || n.title.startsWith(name + "（"))
  );
  if (existing) {
    await browser.storage.local.set({ outputFolderId: existing.id });
    return existing.id;
  }

  // 完全找不到，在工具列新建
  const created = await browser.bookmarks.create({
    parentId: TOOLBAR_ID,
    title: name,
  });
  await browser.storage.local.set({ outputFolderId: created.id });
  return created.id;
}

async function clearFolder(folderId) {
  const children = await browser.bookmarks.getChildren(folderId);
  for (const child of children) {
    await browser.bookmarks.removeTree(child.id);
  }
}

async function writeBookmarks(folderId, groups) {
  for (const group of groups) {
    await browser.bookmarks.create({
      parentId: folderId,
      title: group.title,
      url: group.representativeUrl,
    });
  }
}

async function runPipeline() {
  const settings = await readSettings();

  if (settings.sourceFolderIds.length === 0) {
    console.info("尚未設定來源資料夾，略過重新整理。");
    return;
  }

  const bookmarks = await collectBookmarks(settings.sourceFolderIds);

  if (bookmarks.length === 0) {
    console.info("來源資料夾內沒有書籤。");
    return;
  }

  const visitMap = await queryVisits(bookmarks);
  let groups = groupByDomain(bookmarks, visitMap);

  // 排除黑名單網域
  const excludedSet = new Set(
    (settings.excludedDomains || []).map((d) => d.trim().toLowerCase()).filter(Boolean)
  );
  if (excludedSet.size > 0) {
    groups = groups.filter((g) => !excludedSet.has(g.hostname));
  }

  if (settings.maxAgeDays > 0) {
    const cutoff = Date.now() - settings.maxAgeDays * 86400000;
    groups = groups.filter((g) => g.lastVisitTime > 0 && g.lastVisitTime >= cutoff);
  }

  if (settings.sortMode === "visitCount") {
    groups.sort((a, b) => b.totalVisits - a.totalVisits);
  } else if (settings.sortMode === "weighted") {
    groups.sort(
      (a, b) =>
        weightedScore(b.totalVisits, b.lastVisitTime) -
        weightedScore(a.totalVisits, a.lastVisitTime)
    );
  } else {
    groups.sort((a, b) => b.lastVisitTime - a.lastVisitTime);
  }

  // 置頂書籤（在 slice 前處理，確保置頂項目不被截掉）
  groups = applyPinnedUrls(groups, settings.pinnedUrls || []);

  const topGroups = groups.slice(0, settings.maxResults);

  const folderId = await findOrCreateOutputFolder(settings.outputFolderName);

  // 更新資料夾標題（含時間戳記）
  let folderTitle = settings.outputFolderName;
  if (settings.showTimestamp) {
    const now = new Date();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const hh = String(now.getHours()).padStart(2, "0");
    const min = String(now.getMinutes()).padStart(2, "0");
    folderTitle = `${settings.outputFolderName}（${mm}/${dd} ${hh}:${min}）`;
  }
  await browser.bookmarks.update(folderId, { title: folderTitle });

  await clearFolder(folderId);
  await writeBookmarks(folderId, topGroups);

  // 快取結果供 popup 使用
  await browser.storage.local.set({
    cachedBookmarks: topGroups.map((g) => ({
      title: g.title,
      url: g.representativeUrl,
      totalVisits: g.totalVisits,
      lastVisitTime: g.lastVisitTime,
    })),
    cachedAt: Date.now(),
  });

  console.info(`Auto Frequent Bookmarks：已寫入 ${topGroups.length} 筆。`);
}

async function syncAlarm(settings) {
  await browser.alarms.clear("autoRefresh");
  if (settings.alarmInterval > 0) {
    browser.alarms.create("autoRefresh", {
      periodInMinutes: settings.alarmInterval,
    });
  }
}

browser.runtime.onInstalled.addListener(() => {
  runPipeline().catch((err) => console.error("Pipeline 安裝後首次執行錯誤：", err));
});

browser.runtime.onStartup.addListener(async () => {
  const settings = await readSettings();
  if (settings.refreshOnStartup) {
    runPipeline().catch((err) => console.error("Pipeline 啟動錯誤：", err));
  }
  // 瀏覽器重開後 alarm 會消失，需重新建立
  await syncAlarm(settings);
});

browser.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "autoRefresh") {
    runPipeline().catch((err) => console.error("Pipeline 定時執行錯誤：", err));
  }
});

browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "REFRESH") {
    runPipeline()
      .then(() => sendResponse({ success: true }))
      .catch((err) => {
        console.error("Pipeline 手動重新整理錯誤：", err);
        sendResponse({ success: false, error: err.message });
      });
    return true;
  }
  if (message.type === "SYNC_ALARM") {
    readSettings().then(syncAlarm).catch(console.error);
    return false;
  }
});
