const DEFAULT_SETTINGS = {
  sourceFolderIds: [],
  sortMode: "lastVisit",
  maxResults: 20,
  maxAgeDays: 0,
  outputFolderName: "🔥 常用書籤",
  refreshOnStartup: true,
  alarmInterval: 0,
};

async function getAllFolders() {
  const folders = [];

  async function traverse(nodeId, depth) {
    let children;
    try {
      children = await browser.bookmarks.getChildren(nodeId);
    } catch {
      return;
    }
    for (const child of children) {
      if (!child.url) {
        folders.push({ id: child.id, title: child.title || "(未命名)", depth });
        await traverse(child.id, depth + 1);
      }
    }
  }

  await traverse("root________", 0);
  return folders;
}

function renderFolderTree(folders, selectedIds) {
  const container = document.getElementById("folder-tree");
  container.innerHTML = "";

  if (folders.length === 0) {
    container.textContent = "找不到任何書籤資料夾。";
    return;
  }

  for (const folder of folders) {
    const label = document.createElement("label");
    label.style.paddingLeft = `${folder.depth * 16}px`;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = folder.id;
    checkbox.checked = selectedIds.includes(folder.id);

    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(folder.title));
    container.appendChild(label);
  }
}

async function loadSettings() {
  return browser.storage.local.get(DEFAULT_SETTINGS);
}

async function saveSettings() {
  const checkboxes = document.querySelectorAll(
    "#folder-tree input[type=checkbox]:checked"
  );
  const sourceFolderIds = Array.from(checkboxes).map((cb) => cb.value);

  const settings = {
    sourceFolderIds,
    sortMode: document.getElementById("sort-mode").value,
    maxResults:
      parseInt(document.getElementById("max-results").value, 10) || 20,
    maxAgeDays:
      parseInt(document.getElementById("max-age-days").value, 10) || 0,
    outputFolderName:
      document.getElementById("output-name").value.trim() || "🔥 常用書籤",
    refreshOnStartup: document.getElementById("refresh-on-startup").checked,
    alarmInterval:
      parseInt(document.getElementById("alarm-interval").value, 10) || 0,
  };

  await browser.storage.local.set(settings);
  // 通知背景腳本同步 alarm 設定
  browser.runtime.sendMessage({ type: "SYNC_ALARM" }).catch(() => {});
  return settings;
}

function showStatus(message, isError = false) {
  const el = document.getElementById("status-message");
  el.textContent = message;
  el.className = isError ? "error" : "success";
  setTimeout(() => {
    el.textContent = "";
    el.className = "";
  }, 4000);
}

document.getElementById("btn-save").addEventListener("click", async () => {
  try {
    await saveSettings();
    showStatus("設定已儲存。");
  } catch (e) {
    showStatus("儲存失敗：" + e.message, true);
  }
});

document.getElementById("btn-refresh").addEventListener("click", async () => {
  try {
    await saveSettings();
    const response = await browser.runtime.sendMessage({ type: "REFRESH" });
    if (response && response.success) {
      showStatus("書籤已重新整理完成。");
    } else {
      showStatus("重新整理失敗：" + (response?.error || "未知錯誤"), true);
    }
  } catch (e) {
    showStatus("錯誤：" + e.message, true);
  }
});

async function init() {
  const [settings, folders] = await Promise.all([
    loadSettings(),
    getAllFolders(),
  ]);

  renderFolderTree(folders, settings.sourceFolderIds);

  document.getElementById("sort-mode").value = settings.sortMode;
  document.getElementById("max-results").value = settings.maxResults;
  document.getElementById("max-age-days").value = settings.maxAgeDays;
  document.getElementById("output-name").value = settings.outputFolderName;
  document.getElementById("refresh-on-startup").checked = settings.refreshOnStartup;
  document.getElementById("alarm-interval").value = settings.alarmInterval;
}

init().catch((err) => console.error("設定頁面初始化錯誤：", err));
