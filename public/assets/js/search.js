// ==============================
// SEARCH CONFIG
// ==============================
const SEARCH_SOURCES = [
  { url: "faq.html", type: "FAQ", icon: "fa-solid fa-circle-question" },
 { url: "services.html", type: "Page", icon: "fa-solid fa-grid-2" },
 { url: "cybersecurity.html", type: "Service", icon: "fa-solid fa-file-lines" },
 { url: "ai-tools.html", type: "Service", icon: "fa-solid fa-wand-magic-sparkles" },
 { url: "it-support.html", type: "Service", icon: "fa-solid fa-laptop" },
 { url: "consulting.html", type: "Service", icon: "fa-solid fa-lightbulb" },
 { url: "pricing.html", type: "Page", icon: "fa-solid fa-tags" },
 { url: "about.html", type: "Page", icon: "fa-solid fa-users" },
 { url: "contact.html", type: "Page", icon: "fa-solid fa-envelope" }

];

// ==============================
// FILTER CONFIG
// ==============================
const TYPE_PRIORITY = {
  Page: 1,
  Service: 2,
  FAQ: 3
};

const DEFAULT_TYPE_STATE = {
  Page: true,
  Service: true,
  FAQ: false
};

let ALL_RESULTS = [];
let LAST_QUERY_TERMS = [];

// ==============================
// HELPERS
// ==============================
function getQuery() {
  const params = new URLSearchParams(window.location.search);
  return (params.get("q") || "").trim();
}

function normalize(str) {
  return (str || "").toLowerCase().replace(/\s+/g, " ").trim();
}

function excerpt(text, max = 160) {
  const t = (text || "").replace(/\s+/g, " ").trim();
  return t.length > max ? t.slice(0, max - 1) + "…" : t;
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function highlight(text, terms) {
  if (!terms || !terms.length) return text;
  const safe = terms.filter(Boolean).map(escapeRegExp);
  if (!safe.length) return text;
  const re = new RegExp(`(${safe.join("|")})`, "gi");
  return text.replace(re, `<mark class="search-hit">$1</mark>`);
}

function normalizeUrl(str) {
  return (str || "")
    .toLowerCase()
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function scoreMatch(queryTerms, haystack) {
  const text = normalize(haystack);
  let score = 0;
  queryTerms.forEach(term => {
    if (!term) return;
    const idx = text.indexOf(term);
    if (idx >= 0) {
      score += 10;
      score += Math.max(0, 5 - Math.floor(idx / 80));
    }
  });
  return score;
}

function getCleanBodyText(doc, options = {}) {
  const { forSnippet = false } = options;

  const body = doc.body;
  if (!body) return "";

  const clone = body.cloneNode(true);

  // Elements we never want in search OR snippets
  const baseRemovals = [
    "#preloader",
    "header",
    "nav",
    "footer",
    "script",
    "style",
    "noscript",
    "svg",

    // template-specific junk
    ".fix-area",
    ".offcanvas__info",
    ".offcanvas__overlay",
    ".offcanvas",
    ".mobile-menu",
    ".sidebar",
    ".menu-sidebar",
    ".search-popup",
    ".cookie-banner",
    ".cookie-consent",
    ".newsletter-popup"
  ];

  baseRemovals.forEach(sel => {
    clone.querySelectorAll(sel).forEach(el => el.remove());
  });

  // EXTRA removals for snippet only (remove headings from snippet)
  if (forSnippet) {
    clone.querySelectorAll("h1, h2").forEach(el => el.remove());
  }

  return (clone.innerText || clone.textContent || "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeUrl(str) {
  return (str || "")
    .toLowerCase()
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ==============================
// FILTER HELPERS
// ==============================
function getActiveTypesFromUI() {
  const pills = document.querySelectorAll(".search-filter-pill[data-type]");
  if (!pills.length) {
    return new Set(Object.keys(DEFAULT_TYPE_STATE).filter(t => DEFAULT_TYPE_STATE[t]));
  }

  const active = new Set();
  pills.forEach(p => {
    if (p.classList.contains("is-active")) active.add(p.dataset.type);
  });

  // IMPORTANT (Option A):
  // If the user turns everything off, we return an empty Set.
  return active;
}

function buildTypeCounts(results) {
  const counts = {};
  Object.keys(TYPE_PRIORITY).forEach(t => (counts[t] = 0));
  results.forEach(r => {
    const t = r.type || "Page";
    counts[t] = (counts[t] || 0) + 1;
  });
  return counts;
}

function renderTypePills(results) {
  const wrap = document.getElementById("searchFilterPills");
  if (!wrap) return;

  const counts = buildTypeCounts(results);
  wrap.innerHTML = "";

  Object.keys(TYPE_PRIORITY).forEach(type => {
    const pill = document.createElement("button");
    pill.type = "button";
    pill.className = "search-filter-pill";
    pill.dataset.type = type;

    if (DEFAULT_TYPE_STATE[type]) pill.classList.add("is-active");

    pill.innerHTML = `
      <span>${type}</span>
      <span class="count">${counts[type] || 0}</span>
    `;

    pill.addEventListener("click", () => {
      pill.classList.toggle("is-active");
      applyFiltersAndRender(); // uses LAST_QUERY_TERMS by default
    });

    wrap.appendChild(pill);
  });
}

function applyFiltersAndRender(queryTerms = LAST_QUERY_TERMS, opts = {}) {
  const resultsEl = document.getElementById("searchResults");
  const countEl = document.getElementById("resultCount");
  const { allowAutoExpand = true } = opts;

  let activeTypes = getActiveTypesFromUI();

  // If user turned everything off, keep your current behavior:
  if (activeTypes.size === 0) {
    resultsEl.innerHTML = `
      <div class="col-lg-12 wow fadeInUp">
        <div class="search-result-card">
          <h3>No result types selected</h3>
          <p>Turn on at least one filter (Page, Service, or FAQ) to see results.</p>
        </div>
      </div>
    `;
    if (countEl) countEl.textContent = "0 results";
    return;
  }

  const filterAndSort = (typesSet) => {
    return ALL_RESULTS
      .filter(r => typesSet.has(r.type))
      .sort((a, b) => {
        const ta = TYPE_PRIORITY[a.type] || 99;
        const tb = TYPE_PRIORITY[b.type] || 99;
        if (ta !== tb) return ta - tb;
        return b.score - a.score;
      });
  };

  let filtered = filterAndSort(activeTypes);

  // ✅ Auto-expand filters if defaults yield nothing but other types do have results
  if (allowAutoExpand && filtered.length === 0) {
    const availableTypes = new Set(ALL_RESULTS.map(r => r.type));
    // If there ARE results somewhere else, switch pills to those types
    if (availableTypes.size > 0) {
      setActiveTypesInUI(availableTypes);
      activeTypes = availableTypes;
      filtered = filterAndSort(activeTypes);
    }
  }

  resultsEl.innerHTML = "";

  if (countEl) {
    countEl.textContent = `${filtered.length} result${filtered.length === 1 ? "" : "s"}`;
  }

  if (!filtered.length) {
    resultsEl.innerHTML = `
      <div class="col-lg-12 wow fadeInUp">
        <div class="search-result-card">
          <h3>No results for the selected filters</h3>
          <p>Try turning on another filter (like FAQ) or searching a different keyword.</p>
        </div>
      </div>
    `;
    return;
  }

  filtered.slice(0, 24).forEach(r => {
    resultsEl.appendChild(renderCard(r, queryTerms));
  });

  if (typeof WOW === "function") {
    try { new WOW().init(); } catch (e) {}
  }
}

function setActiveTypesInUI(typesToActivate) {
  const pills = document.querySelectorAll(".search-filter-pill[data-type]");
  pills.forEach(p => {
    const shouldBeActive = typesToActivate.has(p.dataset.type);
    p.classList.toggle("is-active", shouldBeActive);
  });
}


// ==============================
// FETCH + INDEX BUILDERS
// ==============================
async function fetchDoc(url) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch ${url}`);
  const html = await res.text();
  return new DOMParser().parseFromString(html, "text/html");
}

function buildPageEntry(doc, source) {
  const title =
    doc.querySelector("h1")?.textContent ||
    doc.querySelector("h2")?.textContent ||
    doc.querySelector("title")?.textContent ||
    source.url;

  // Search text: includes headings + body content (but cleaned)
  const searchText = getCleanBodyText(doc);

  // Snippet text: cleaned AND headings removed
  const snippetText = getCleanBodyText(doc, { forSnippet: true });

  return [{
    type: source.type,
    icon: source.icon,
    url: source.url,
    href: source.url,
    title: (title || "").trim(),
    text: searchText,                 // used for matching (includes headings)
    snippet: excerpt(snippetText, 220),// used for display (no h1/h2)
    section: ""
  }];
}


function buildFaqEntries(doc, source) {
  const results = [];
  const faqContent = doc.querySelector(".faq-wrapper.style-inner-page .faq-content");
  if (!faqContent) return results;

  let currentSection = "FAQ";

  Array.from(faqContent.children).forEach(node => {
    if (node.tagName === "H2") {
      currentSection = node.textContent.trim();
      return;
    }

    node.querySelectorAll?.(".accordion-item").forEach(item => {
      const btn = item.querySelector(".accordion-button");
      const body = item.querySelector(".accordion-body");
      const q = btn?.textContent.trim();
      const a = body?.textContent.trim();

      const target = btn?.getAttribute("data-bs-target");
      const href = target ? `${source.url}${target}` : source.url;

      if (q) {
        results.push({
          type: source.type,
          icon: source.icon,
          url: source.url,
          href,
          title: q,
          text: a || "",
          section: currentSection
        });
      }
    });
  });

  return results;
}

async function buildIndex() {
  const all = [];

  for (const source of SEARCH_SOURCES) {
    try {
      const doc = await fetchDoc(source.url);
      if (source.url === "faq.html") {
        all.push(...buildFaqEntries(doc, source));
      } else {
        all.push(...buildPageEntry(doc, source));
      }
    } catch (e) {
      console.warn(e.message);
    }
  }
  return all;
}

// ==============================
// RENDER
// ==============================
function renderCard(result, queryTerms) {
  const col = document.createElement("div");
  col.className = "col-lg-12 wow fadeInUp";

  col.innerHTML = `
    <div class="search-result-card">
      <div class="search-result-top">
        <span class="search-badge">
          <i class="${result.icon || "fa-file"}"></i>
          ${result.type}${result.section ? ` • ${result.section}` : ""}
        </span>
        <span class="small">${result.url}</span>
      </div>

      <h3>
        <a href="${result.href}">
          ${highlight(result.title, queryTerms)}
        </a>
      </h3>

      <p>${highlight(result.snippet ? result.snippet : excerpt(result.text, 300), queryTerms)}</p>

      <div class="search-result-actions">
        <a class="link-btn" href="${result.href}">
          View result <i class="fa-solid fa-arrow-up-right"></i>
        </a>
        <span class="small">Relevance: ${result.score}</span>
      </div>
    </div>
  `;

  return col;
}

// ==============================
// MAIN
// ==============================
document.addEventListener("DOMContentLoaded", async () => {
  const q = getQuery();
  const resultsEl = document.getElementById("searchResults");
  const countEl = document.getElementById("resultCount");
  const emptyEl = document.getElementById("searchEmpty");
  const subtitleEl = document.getElementById("searchSubtitle");

  if (!q) {
    if (countEl) countEl.textContent = "Type a keyword to search.";
    if (emptyEl) emptyEl.style.display = "";
    return;
  }

  if (subtitleEl) subtitleEl.textContent = `Showing matches for “${q}”`;
  if (countEl) countEl.textContent = "Searching…";

  const queryTerms = normalize(q).split(" ").filter(Boolean);
  LAST_QUERY_TERMS = queryTerms;

  const index = await buildIndex();

  const results = index
    .map(item => {
      const score =
        scoreMatch(queryTerms, item.title) * 3 +
        scoreMatch(queryTerms, normalizeUrl(item.url)) * 6 +  // URL is a strong signal for nav-intent
        scoreMatch(queryTerms, item.href) * (item.type === "FAQ" ? 0.5 : 2)
        scoreMatch(queryTerms, item.text);

      return { ...item, score };
    })
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score);

  if (!results.length) {
    if (countEl) countEl.textContent = "0 results";
    if (emptyEl) emptyEl.style.display = "";
    return;
  }

  // Keep your page-level empty element hidden once we have results.
  if (emptyEl) emptyEl.style.display = "none";

  ALL_RESULTS = results;

  renderTypePills(ALL_RESULTS);
  applyFiltersAndRender(queryTerms, { allowAutoExpand: true });

  if (typeof WOW === "function") {
    try { new WOW().init(); } catch (e) {}
  }
});
