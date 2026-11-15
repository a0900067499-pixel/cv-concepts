/* ==========================================================
   像素之後 — 全站共用腳本
   讀取 data/concepts.json，自動產生：
   - 頂部導覽、頁尾
   - 首頁的分類與概念卡片
   - 概念頁的分類色、標籤、目錄、相關概念、上一頁／下一頁
   新增概念時「不需要」修改這支檔案。
   ========================================================== */

(async function () {
  const body = document.body;
  const root = body.dataset.root || ".";
  const page = body.dataset.page;

  let data;
  try {
    const res = await fetch(`${root}/data/concepts.json`);
    data = await res.json();
  } catch (err) {
    console.error("[site] 無法讀取 data/concepts.json。請用本機伺服器開啟（python3 -m http.server）。", err);
    return;
  }

  const cats = Object.fromEntries(data.categories.map((c) => [c.id, c]));
  const concepts = [...data.concepts].sort((a, b) => a.order - b.order);
  const bySlug = Object.fromEntries(concepts.map((c) => [c.slug, c]));
  const url = (slug) => `${root}/concepts/${slug}.html`;
  const pad = (n) => String(n).padStart(2, "0");
  const levelText = (n) => ["", "入門", "進階", "深入"][n] || "";

  renderHeader();
  renderFooter();
  if (page === "home") renderHome();
  if (page === "concept") renderConcept();

  function renderHeader() {
    const el = document.getElementById("site-header");
    if (!el) return;
    el.className = "site-header";
    el.innerHTML = `
      <div class="inner">
        <a class="brand" href="${root}/index.html">
          <span class="brand-mark">${"<i></i>".repeat(9)}</span>${data.site.title}
        </a>
        <nav class="site-nav">
          ${data.categories.map((c) => `<a href="${root}/index.html#${c.id}">${c.name}</a>`).join("")}
          <a href="${data.site.repo}">GitHub</a>
        </nav>
      </div>`;
  }

  function renderFooter() {
    const el = document.getElementById("site-footer");
    if (!el) return;
    el.className = "site-footer";
    el.innerHTML = `
      <div class="inner">
        <span>${data.site.title} · 共 ${concepts.length} 個概念</span>
        <span>內容依 <a href="${data.site.repo}/blob/main/AGENTS.md">AGENTS.md</a> 規則撰寫</span>
      </div>`;
  }

  function renderHome() {
    const strip = document.getElementById("pixel-strip");
    if (strip) {
      strip.innerHTML = Array.from({ length: 16 }, (_, i) => {
        const v = Math.round((i / 15) * 235 + 10);
        return `<span style="background: rgb(${v},${v},${v})"></span>`;
      }).join("");
    }
    const mount = document.getElementById("catalog");
    mount.innerHTML = data.categories.map((cat) => {
      const items = concepts.filter((c) => c.category === cat.id);
      if (!items.length) return "";
      return `
        <section class="category" id="${cat.id}" style="--cat:${cat.color}">
          <div class="category-head"><h2>${cat.name}</h2><p>${cat.description}</p></div>
          <div class="card-grid">
            ${items.map((c) => `
              <a class="card" href="${url(c.slug)}">
                <span class="num">${pad(c.order)} · ${levelText(c.level)}</span>
                <h3>${c.title}</h3>
                <span class="en">${c.en}</span>
                <p>${c.summary}</p>
              </a>`).join("")}
          </div>
        </section>`;
    }).join("");
  }

  function renderConcept() {
    const me = bySlug[body.dataset.slug];
    if (!me) {
      console.error(`[site] data-slug="${body.dataset.slug}" 不在 concepts.json 裡。`);
      return;
    }
    const cat = cats[me.category];
    body.style.setProperty("--cat", cat.color);
    document.title = `${me.title}｜${data.site.title}`;

    const crumb = document.getElementById("breadcrumb");
    if (crumb) crumb.innerHTML = `<a href="${root}/index.html">首頁</a> / <a href="${root}/index.html#${cat.id}">${cat.name}</a> / ${pad(me.order)}`;

    const meta = document.getElementById("meta");
    if (meta) meta.innerHTML = `
      <span class="tag cat">${cat.name}</span>
      <span class="tag">${levelText(me.level)}</span>
      <span class="tag">更新於 ${me.updated}</span>`;

    // 章節編號 + 目錄
    const sections = [...document.querySelectorAll("article section[id]")];
    sections.forEach((s, i) => s.querySelector("h2")?.setAttribute("data-index", pad(i + 1)));
    const toc = document.getElementById("toc");
    if (toc) {
      toc.innerHTML = `<p>本頁目錄</p><ol>${sections.map((s) =>
        `<li><a href="#${s.id}" data-target="${s.id}">${s.querySelector("h2").textContent}</a></li>`).join("")}</ol>`;
      const links = [...toc.querySelectorAll("a")];
      const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) links.forEach((a) => a.classList.toggle("active", a.dataset.target === e.target.id));
        });
      }, { rootMargin: "-30% 0px -60% 0px" });
      sections.forEach((s) => io.observe(s));
    }

    const related = document.getElementById("related-list");
    if (related) related.innerHTML = me.related
      .filter((s) => bySlug[s])
      .map((s) => `<a href="${url(s)}">${bySlug[s].title} <span class="term">${bySlug[s].en}</span></a>`).join("");

    const pager = document.getElementById("pager");
    if (pager) {
      const i = concepts.indexOf(me);
      const prev = concepts[i - 1], next = concepts[i + 1];
      pager.className = "pager";
      pager.innerHTML =
        (prev ? `<a class="prev" href="${url(prev.slug)}"><small>← 上一個</small>${prev.title}</a>` : "") +
        (next ? `<a class="next" href="${url(next.slug)}"><small>下一個 →</small>${next.title}</a>` : "");
    }
  }
})();
