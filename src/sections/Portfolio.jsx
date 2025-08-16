import { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { SectionTitle } from "../components/ui.jsx";
import "../styles/portfolio.css";

const GITHUB_USER = "Ridit07";

const CATEGORY_RULES = [
  { label: "AI/ML",           match: /(ml|ai|llm|pytorch|tensorflow|cv|vision|nlp|langchain|yolo)/i },
  { label: "Applications",    match: /(flutter|android|kotlin|ios|desktop|cli|electron)/i },
  { label: "Web development", match: /(web|react|next|node|express|django|flask|vite|go|grpc)/i },
];

function categorize({ topics = [], language = "", description = "" }) {
  const hay = [...topics, language, description].join(" ").toLowerCase();
  for (const rule of CATEGORY_RULES) if (rule.match.test(hay)) return rule.label;
  return "Misc";
}



/** Prefer repo/portfolio.png; else fall back to GitHub OpenGraph image */
const rawPNG = (owner, repo, v = "1") =>
  `https://raw.githubusercontent.com/${owner}/${repo}/HEAD/portfolio.png?v=${encodeURIComponent(v)}`;
const ogImage = (owner, repo, v = "1") =>
  `https://opengraph.githubassets.com/portfolio-${encodeURIComponent(v)}/${owner}/${repo}`;

const README_CACHE = new Map();

// async function fetchCatalog(username) {
//   const res = await fetch(`/api/github/catalog?user=${encodeURIComponent(username)}`);
//   if (!res.ok) throw new Error(`Catalog ${res.status} ${res.statusText}`);
//   return res.json(); // { repos, pinned }
// }

async function fetchCatalogStatic() {
  const res = await fetch(`/github-catalog.json?v=${Date.now()}`, { cache: "no-cache" });
  if (!res.ok) throw new Error(`Static catalog ${res.status} ${res.statusText}`);
  return res.json();
}


async function fetchCatalogAPI(username, { refresh = false } = {}) {
  const url = `/api/github/catalog?user=${encodeURIComponent(username)}${refresh ? "&refresh=1" : ""}`;
  const res = await fetch(url, { cache: "no-cache" });
  if (!res.ok) throw new Error(`API catalog ${res.status} ${res.statusText}`);
  return res.json(); // { repos, pinned, asset_version, readmes? }
}

async function fetchReadmeServer(owner, repo, signal) {
  const res = await fetch(
    `/api/github/readme?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}`,
    { signal }
  );
  if (!res.ok) throw new Error(`README ${res.status} ${res.statusText}`);
  const { markdown } = await res.json();
  return markdown || "";
}

async function fetchReadmeClient(owner, repo, signal) {
  const key = `${owner}/${repo}`.toLowerCase();

  // 1) in-memory cache
  if (README_CACHE.has(key)) return README_CACHE.get(key);

  // 2) localStorage cache
  const ls = loadReadmesCache(GITHUB_USER);
  const mdLS = ls?.md?.[key];
  if (mdLS != null) {
    README_CACHE.set(key, mdLS);
    return mdLS;
  }

  // 3) fallback to static JSON (if it contains readmes)
  try {
    // NOTE: use no-cache in dev to avoid stale copies; switch to force-cache if you prefer
    const res = await fetch("/github-catalog.json", { cache: "no-cache", signal });
    if (res.ok) {
      const j = await res.json(); // { readmes? }
      const mdStatic = j?.readmes?.[key];
      if (typeof mdStatic === "string") {
        README_CACHE.set(key, mdStatic);

        // merge-save into LS for next time
        const curr = loadReadmesCache(GITHUB_USER);
        const merged = { ...(curr?.md || {}), [key]: mdStatic };
        saveReadmesCache(GITHUB_USER, merged, j?.asset_version || "1");

        return mdStatic;
      }
    }
  } catch (_) {
    // ignore fetch errors here; we have one more fallback
  }

  // 4) last resort: server API
  const md = await fetchReadmeServer(owner, repo, signal);
  README_CACHE.set(key, md);

  // merge-save to LS for future fast loads
  const merged = { ...(ls?.md || {}), [key]: md };
  saveReadmesCache(GITHUB_USER, merged, lsGet(ASSET_VERSION_KEY(GITHUB_USER)) || "1");

  return md;
}



/** tiny localStorage cache for the catalog (10 minutes) */
const hasLS = () => typeof window !== "undefined" && !!window.localStorage;
const lsGet = (k) => { try { return hasLS() ? localStorage.getItem(k) : null; } catch { return null; } };
const lsSet = (k, v) => { try { if (hasLS()) localStorage.setItem(k, v); } catch {} };

const CATALOG_CACHE_KEY = (u) => `gh_catalog_${u}`;
const READMES_CACHE_KEY = (u) => `gh_readmes_${u}`;
const ASSET_VERSION_KEY = (u) => `gh_assets_v_${u}`;

const CATALOG_TTL_MS = 10 * 60 * 1000;
const READMES_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days



function loadCatalogCache(user) {
  try {
    const s = lsGet(CATALOG_CACHE_KEY(user));
    if (!s) return null;
    const j = JSON.parse(s);
    if (Date.now() - j.t > CATALOG_TTL_MS) return null;
    return j.data;
  } catch { return null; }
}

function saveCatalogCache(user, data) {
  try { lsSet(CATALOG_CACHE_KEY(user), JSON.stringify({ t: Date.now(), data })); } catch {}
}

function loadReadmesCache(user) {
  try {
    const s = lsGet(READMES_CACHE_KEY(user));
    if (!s) return null;
    const j = JSON.parse(s); // { t, v, md: { "owner/repo": "markdown" } }
    if (Date.now() - j.t > READMES_TTL_MS) return null;
    return j;
  } catch { return null; }
}
function saveReadmesCache(user, mdMap, v) {
  try { lsSet(READMES_CACHE_KEY(user), JSON.stringify({ t: Date.now(), v, md: mdMap })); } catch {}
}

function mergeReadmesIntoCaches(user, readmes, v) {
  if (!readmes) return;
  // in-memory
  for (const [key, md] of Object.entries(readmes)) README_CACHE.set(key, md || "");
  // localStorage (merge)
  const cur = loadReadmesCache(user);
  const merged = { ...(cur?.md || {}), ...readmes };
  saveReadmesCache(user, merged, v);
  // remember version
lsSet(ASSET_VERSION_KEY(user), String(v || "1"));
}
function getAssetVersion(user) {
  return lsGet(ASSET_VERSION_KEY(user)) || "1";
}


const getRefreshFlag = () => {
  try {
    const u = new URL(window.location.href);
    return u.searchParams.get("refresh") === "1";
  } catch {
    return false;
  }
};

/** ====== Component ====== */
export default function Portfolio() {
  const [tab, setTab] = useState("All");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [items, setItems] = useState([]);
  const [modal, setModal] = useState(null);
  const [assetVersion, setAssetVersion] = useState(() => getAssetVersion(GITHUB_USER));

  useEffect(() => {
    let alive = true;
  
    (async () => {
      try {
        let dataLoaded = false;
        const forceRefresh = getRefreshFlag();
  
        // 1) localStorage (fresh if TTL not expired)
        const cached = loadCatalogCache(GITHUB_USER);
        if (cached && alive) {
          const v = cached.asset_version || getAssetVersion(GITHUB_USER);
          setAssetVersion(v);
          mergeReadmesIntoCaches(GITHUB_USER, cached.readmes, v);
          const prepared = prepareItems(cached.repos, v);
          const ordered  = orderPinned(prepared, cached.pinned);
          setItems(ordered);
          dataLoaded = true;

         // backgroundVersionCheck(GITHUB_USER, setItems, setAssetVersion);

        }
  
        // 2) static fallback (only if no LS cache)
        let staticData = null;
        if (!dataLoaded) {
          staticData = await fetchCatalogStatic().catch(() => null);
          if (staticData && alive) {
            const v = staticData.asset_version || getAssetVersion(GITHUB_USER);
            setAssetVersion(v);
            mergeReadmesIntoCaches(GITHUB_USER, staticData.readmes, v);
            const prepared = prepareItems(staticData.repos, v);
            const ordered  = orderPinned(prepared, staticData.pinned);
            setItems(ordered);
            dataLoaded = true;

         //   backgroundVersionCheck(GITHUB_USER, setItems, setAssetVersion);

          }
        }
  
        // 3) live API — only if nothing loaded OR explicitly forced
        if (!dataLoaded || forceRefresh) {
          setErr("");
          const apiData = await fetchCatalogAPI(GITHUB_USER, { refresh: forceRefresh });
          if (!alive) return;
  
          const v = apiData.asset_version || getAssetVersion(GITHUB_USER);
          setAssetVersion(v);
          mergeReadmesIntoCaches(GITHUB_USER, apiData.readmes, v);
  
          const prepared = prepareItems(apiData.repos, v);
          const ordered  = orderPinned(prepared, apiData.pinned);
          setItems(ordered);
  
          saveCatalogCache(GITHUB_USER, apiData);
          lsSet(ASSET_VERSION_KEY(GITHUB_USER), String(v));
        }
  
        // finish loading state once anything above settles
        if (alive) setLoading(false);
      } catch (e) {
        if (!alive) return;
        setErr(e.message || "Failed to load GitHub projects.");
        setLoading(false);
      }
    })();
  
    return () => { alive = false; };
  }, []);
  

  // ---------- RENDER (this was missing) ----------
  const tabs = useMemo(() => {
    const set = new Set(items.map(i => i.cat));
    return ["All", ...Array.from(set)];
  }, [items]);

  const filtered = useMemo(
    () => (tab === "All" ? items : items.filter(i => i.cat === tab)),
    [items, tab]
  );

  return (
    <section className="px-4 md:px-6">
      <SectionTitle title="Projects" subtitle={`GitHub · assets v${assetVersion}`} />

      {/* Tabs */}
      <div className="mt-3 mb-5 flex flex-wrap gap-2">
        {tabs.map(t => (
          <button
            key={t}
            className={`btn ${t === tab ? "btn-acc" : ""}`}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Error */}
      {err && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {err}
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          : filtered.map(repo => (
              <ProjectCard
                key={repo.id}
                p={repo}
                onOpen={() => setModal(repo)}
              />
            ))}
      </div>

      {/* Modal */}
      {modal && (
        <Modal onClose={() => setModal(null)}>
          <QuickLook repo={modal} />
        </Modal>
      )}
    </section>
  );
}


/** ===== helpers to prep/sort items ===== */
function prepareItems(repos, assetVersion = "1") {
  return repos.map((r) => {
    const cat = categorize({
      topics: r.topics || [],
      language: r.language,
      description: r.description || "",
    });
    const v = assetVersion || "1";
    return {
      ...r,
      cat,
      blurb: r.description || "No description yet.",
      imgPreferred: rawPNG(r.owner, r.name, v),
      imgFallback: ogImage(r.owner, r.name, v),
    };
  });
}

function orderPinned(list, pinnedList = []) {
  const pinnedSet = new Set((pinnedList || []).map((x) => x.toLowerCase()));
  const indexMap = new Map((pinnedList || []).map((n, i) => [n.toLowerCase(), i]));
  const P = [];
  const O = [];
  for (const r of list) {
    const key = r.full_name.toLowerCase();
    if (pinnedSet.has(key)) P.push(r);
    else O.push(r);
  }
  P.sort((a, b) => indexMap.get(a.full_name.toLowerCase()) - indexMap.get(b.full_name.toLowerCase()));
  O.sort((a, b) => b.stargazers_count - a.stargazers_count);
  return [...P, ...O];
}

/** ===== Cards / Modal ===== */
function ProjectCard({ p, onOpen }) {
  const stop = (e) => e.stopPropagation();
  return (
    <article
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onOpen()}
      className="group h-full flex flex-col cursor-pointer rounded-2xl bg-[#0f1115] border border-white/10 overflow-hidden hover:border-white/20 focus:outline-none focus:ring-2 focus:ring-white/10 transition"
    >
      <img
        loading="lazy"
        src={p.imgPreferred}
        alt={`${p.name} preview`}
        className="h-40 w-full object-cover"
        onError={(e) => {
          e.currentTarget.onerror = null;
          e.currentTarget.src = p.imgFallback;
        }}
      />

      <div className="p-4 flex flex-col flex-1">
        <p className="text-xs text-zinc-400">{p.cat}</p>

        <div className="mt-1 flex items-center gap-2">
          <span className="font-medium hover:underline">{p.name}</span>
          {p.stargazers_count > 0 && (
            <span className="text-[11px] text-zinc-400 border border-white/10 rounded-full px-1.5 py-0.5">
              ★ {p.stargazers_count}
            </span>
          )}
        </div>

        <p className="mt-1 text-sm text-zinc-300">{p.blurb}</p>

        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          {p.topics?.slice(0, 6).map((t) => (
            <span key={t} className="rounded-xl border border-white/10 bg-white/5 px-2 py-1">
              {t}
            </span>
          ))}
          {!p.topics?.length && p.language && (
            <span className="rounded-xl border border-white/10 bg-white/5 px-2 py-1">
              {p.language}
            </span>
          )}
        </div>

        <div className="mt-auto pt-4 flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onOpen(); }}
            className="btn btn-acc"
          >
            Quick look
          </button>
          <a
            href={p.html_url}
            target="_blank"
            rel="noreferrer"
            onClick={stop}
            className="btn"
          >
            GitHub
          </a>
          {p.homepage && (
            <a
              href={p.homepage}
              target="_blank"
              rel="noreferrer"
              onClick={stop}
              className="btn"
            >
              Live
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl bg-[#0f1115] border border-white/10 overflow-hidden animate-pulse">
      <div className="h-40 w-full bg-white/5" />
      <div className="p-4 space-y-2">
        <div className="h-3 w-24 bg-white/5 rounded" />
        <div className="h-4 w-40 bg-white/5 rounded" />
        <div className="h-3 w-full bg-white/5 rounded" />
        <div className="h-3 w-2/3 bg-white/5 rounded" />
      </div>
    </div>
  );
}

function Modal({ children, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm grid place-items-center p-3"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="w-[min(900px,95vw)] max-h-[85vh] overflow-hidden rounded-2xl border border-white/10 bg-[#0f1115]"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

function QuickLook({ repo }) {
  const [md, setMd] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    setErr("");
    setMd("");

    fetchReadmeClient(repo.owner, repo.name, ctrl.signal)
      .then((text) => setMd(text || ""))
      .catch((e) => {
        if (e.name !== "AbortError") setErr(e.message || "Failed to load README.");
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false);
      });

    return () => ctrl.abort();
  }, [repo.owner, repo.name]);

  return (
    <>
      {/* header */}
      <div className="flex items-center justify-between px-4 md:px-5 py-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-md overflow-hidden border border-white/10 bg-white/5">
            <img
              src={repo.imgPreferred}
              alt=""
              className="h-full w-full object-cover"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = repo.imgFallback;
              }}
            />
          </div>
          <div>
            <div className="font-semibold">{repo.name}</div>
            <div className="text-xs text-zinc-400">{repo.full_name}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {repo.homepage && (
            <a href={repo.homepage} target="_blank" rel="noreferrer" className="btn">Live</a>
          )}
          <a href={repo.html_url} target="_blank" rel="noreferrer" className="btn btn-acc">GitHub</a>
        </div>
      </div>

      {/* content */}
      <div className="px-4 md:px-5 py-4 overflow-auto max-h-[calc(85vh-56px)]">
        {loading && <div className="text-sm text-zinc-400">Loading README…</div>}
        {!loading && err && <div className="text-sm text-red-300">{err}</div>}
        {!loading && !err && md && (
          <div className="markdown">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {md}
            </ReactMarkdown>
          </div>
        )}
        {!loading && !err && !md && (
          <p className="text-sm text-zinc-300">No README found for this repository.</p>
        )}
      </div>
    </>
  );
}
