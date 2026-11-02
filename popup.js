const api = globalThis.browser ?? globalThis.chrome;

let allBookmarks = [];
let pinnedUrls = [];
function createSvgIcon(isFilled) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("width", "14");
  svg.setAttribute("height", "14");
  svg.style.pointerEvents = "none";
  if (isFilled) {
    svg.setAttribute("fill", "currentColor");
  } else {
    svg.setAttribute("fill", "none");
  }
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "2");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");

  const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
  line.setAttribute("x1", "12");
  line.setAttribute("y1", "17");
  line.setAttribute("x2", "12");
  line.setAttribute("y2", "22");
  svg.appendChild(line);

  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", "M5 17h14v-1.76a2 2 0 0 0-.44-1.24l-2.12-2.65A2 2 0 0 1 16 10.11V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v5.11a2 2 0 0 1-.44 1.24L5.44 14a2 2 0 0 0-.44 1.24Z");
  svg.appendChild(path);

  return svg;
}

function formatAge(cachedAt) {
  if (!cachedAt) return "";
  const mins = Math.round((Date.now() - cachedAt) / 60000);
  if (mins < 1) return "剛剛更新";
  if (mins < 60) return `${mins} 分鐘前更新`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} 小時前更新`;
  return `${Math.round(hrs / 24)} 天前更新`;
}

function renderList(bookmarks) {
  const list = document.getElementById("bookmark-list");
  list.innerHTML = "";

  if (bookmarks.length === 0) {
    const empty = document.createElement("div");
    empty.id = "empty-msg";
    empty.textContent = allBookmarks.length === 0
      ? "尚未產生常用書籤，請至設定頁執行整理。"
      : "找不到符合的書籤。";
    list.appendChild(empty);
    return;
  }

  for (const bm of bookmarks) {
    const itemDiv = document.createElement("div");
    itemDiv.className = "bookmark-item";

    const a = document.createElement("a");
    a.href = bm.url;
    a.title = bm.url;

    const favicon = document.createElement("img");
    favicon.src = `https://www.google.com/s2/favicons?sz=16&domain_url=${encodeURIComponent(bm.url)}`;
    favicon.width = 16;
    favicon.height = 16;
    favicon.onerror = () => { favicon.style.visibility = "hidden"; };

    const title = document.createElement("span");
    title.className = "bm-title";
    title.textContent = bm.title || bm.url;

    const date = document.createElement("span");
    date.className = "bm-date";
    date.textContent = formatDate(bm.lastVisitTime);

    a.appendChild(favicon);
    a.appendChild(title);
    a.appendChild(date);

    a.addEventListener("click", (e) => {
      e.preventDefault();
      api.tabs.create({ url: bm.url });
      window.close();
    });

    const isPinned = pinnedUrls.includes(bm.url);
    const pinBtn = document.createElement("button");
    pinBtn.className = "bm-pin-btn";
    if (isPinned) {
      pinBtn.classList.add("pinned");
      pinBtn.appendChild(createSvgIcon(true));
      pinBtn.title = "取消置頂";
    } else {
      pinBtn.appendChild(createSvgIcon(false));
      pinBtn.title = "置頂此分頁";
    }

    pinBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();

      pinBtn.classList.add("loading");

      let currentPinned = [...pinnedUrls];
      if (isPinned) {
        currentPinned = currentPinned.filter((url) => url !== bm.url);
      } else {
        currentPinned.push(bm.url);
      }

      pinnedUrls = currentPinned;
      await api.storage.local.set({ pinnedUrls: currentPinned });

      try {
        const response = await api.runtime.sendMessage({ type: "REFRESH" });
        if (response && response.success) {
          const { cachedBookmarks, cachedAt } = await api.storage.local.get({
            cachedBookmarks: [],
            cachedAt: null,
          });
          allBookmarks = cachedBookmarks || [];
          renderList(filterBookmarks(document.getElementById("search").value));
          document.getElementById("cached-at").textContent = formatAge(cachedAt);
        } else {
          console.error("重新整理失敗：", response?.error);
          pinBtn.classList.remove("loading");
        }
      } catch (err) {
        console.error("呼叫 Pipeline 錯誤：", err);
        pinBtn.classList.remove("loading");
      }
    });

    itemDiv.appendChild(a);
    itemDiv.appendChild(pinBtn);
    list.appendChild(itemDiv);
  }
}

function formatDate(lastVisitTime) {
  if (!lastVisitTime) return "";
  const d = new Date(lastVisitTime);
  const now = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  if (d.getFullYear() === now.getFullYear()) return `${mm}/${dd}`;
  return `${d.getFullYear()}/${mm}/${dd}`;
}

function filterBookmarks(query) {
  let filtered = allBookmarks;
  if (query) {
    const q = query.toLowerCase();
    filtered = allBookmarks.filter(
      (bm) =>
        bm.title.toLowerCase().includes(q) ||
        bm.url.toLowerCase().includes(q)
    );
  }
  return [...filtered].sort((a, b) => {
    const aPinned = pinnedUrls.includes(a.url);
    const bPinned = pinnedUrls.includes(b.url);
    if (aPinned && !bPinned) return -1;
    if (!aPinned && bPinned) return 1;
    return 0;
  });
}

document.getElementById("search").addEventListener("input", (e) => {
  renderList(filterBookmarks(e.target.value));
});

document.getElementById("open-options").addEventListener("click", (e) => {
  e.preventDefault();
  api.runtime.openOptionsPage();
  window.close();
});

async function init() {
  const { cachedBookmarks, cachedAt, pinnedUrls: storedPinned } = await api.storage.local.get({
    cachedBookmarks: [],
    cachedAt: null,
    pinnedUrls: [],
  });

  allBookmarks = cachedBookmarks || [];
  pinnedUrls = storedPinned || [];
  renderList(filterBookmarks(""));

  document.getElementById("cached-at").textContent = formatAge(cachedAt);
  document.getElementById("search").focus();
}

init().catch(console.error);
