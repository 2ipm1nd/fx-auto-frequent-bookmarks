const DEFAULT_SETTINGS = {
  sourceFolderIds: [],
  sortMode: "lastVisit", // "lastVisit" | "visitCount"
  maxResults: 20,
  outputFolderName: "🔥 常用書籤",
};

const TOOLBAR_ID = "toolbar_____";

async function readSettings() {
  const stored = await browser.storage.local.get(DEFAULT_SETTINGS);
  return { ...DEFAULT_SETTINGS, ...stored };
}

async function collectBookmarks(folderIds) {
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
      } else {
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

async function findOrCreateOutputFolder(name) {
  const toolbarChildren = await browser.bookmarks.getChildren(TOOLBAR_ID);
  const existing = toolbarChildren.find((n) => !n.url && n.title === name);
  if (existing) return existing.id;

  const created = await browser.bookmarks.create({
    parentId: TOOLBAR_ID,
    title: name,
  });
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
  const groups = groupByDomain(bookmarks, visitMap);

  if (settings.sortMode === "visitCount") {
    groups.sort((a, b) => b.totalVisits - a.totalVisits);
  } else {
    groups.sort((a, b) => b.lastVisitTime - a.lastVisitTime);
  }

  const topGroups = groups.slice(0, settings.maxResults);

  const folderId = await findOrCreateOutputFolder(settings.outputFolderName);
  await clearFolder(folderId);
  await writeBookmarks(folderId, topGroups);

  console.info(`Auto Frequent Bookmarks：已寫入 ${topGroups.length} 筆。`);
}

browser.runtime.onStartup.addListener(() => {
  runPipeline().catch((err) =>
    console.error("Pipeline 啟動錯誤：", err)
  );
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
});
