let allBookmarks = [];

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
      browser.tabs.create({ url: bm.url });
      window.close();
    });

    list.appendChild(a);
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
  if (!query) return allBookmarks;
  const q = query.toLowerCase();
  return allBookmarks.filter(
    (bm) =>
      bm.title.toLowerCase().includes(q) ||
      bm.url.toLowerCase().includes(q)
  );
}

document.getElementById("search").addEventListener("input", (e) => {
  renderList(filterBookmarks(e.target.value));
});

document.getElementById("open-options").addEventListener("click", (e) => {
  e.preventDefault();
  browser.runtime.openOptionsPage();
  window.close();
});

async function init() {
  const { cachedBookmarks, cachedAt } = await browser.storage.local.get({
    cachedBookmarks: [],
    cachedAt: null,
  });

  allBookmarks = cachedBookmarks || [];
  renderList(allBookmarks);

  document.getElementById("cached-at").textContent = formatAge(cachedAt);
  document.getElementById("search").focus();
}

init().catch(console.error);
