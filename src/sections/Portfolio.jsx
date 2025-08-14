import { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { SectionTitle } from "../components/ui.jsx";
import "../styles/portfolio.css";

/** ====== CONFIG ====== */
const GITHUB_USER = "Ridit07";

/** Category mapping rules (same as before) */
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
const rawPNG = (owner, repo) =>
  `https://raw.githubusercontent.com/${owner}/${repo}/HEAD/portfolio.png`;
const ogImage = (owner, repo) =>
  `https://opengraph.githubassets.com/${Date.now()}/${owner}/${repo}`;

/** ====== Client helpers (no token on the client!) ====== */
const README_CACHE = new Map();

async function fetchCatalog(username) {
  const res = await fetch(`/api/github/catalog?user=${encodeURIComponent(username)}`);
  if (!res.ok) throw new Error(`Catalog ${res.status} ${res.statusText}`);
  return res.json(); // { repos, pinned }
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
  if (README_CACHE.has(key)) return README_CACHE.get(key);
  const md = await fetchReadmeServer(owner, repo, signal);
  README_CACHE.set(key, md);
  return md;
}

/** tiny localStorage cache for the catalog (10 minutes) */
const CATALOG_CACHE_KEY = (u) => `gh_catalog_${u}`;
const CATALOG_TTL_MS = 10 * 60 * 1000;
function loadCatalogCache(user) {
  try {
    const s = localStorage.getItem(CATALOG_CACHE_KEY(user));
    if (!s) return null;
    const j = JSON.parse(s);
    if (Date.now() - j.t > CATALOG_TTL_MS) return null;
    return j.data; // { repos, pinned }
  } catch {
    return null;
  }
}
function saveCatalogCache(user, data) {
  try {
    localStorage.setItem(
      CATALOG_CACHE_KEY(user),
      JSON.stringify({ t: Date.now(), data })
    );
  } catch {}
}

/** ====== Component ====== */
export default function Portfolio() {
  const [tab, setTab] = useState("All");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [items, setItems] = useState([]);
  const [modal, setModal] = useState(null); // selected repo

  useEffect(() => {
    let alive = true;

    // 1) Try cache first for instant UI
    const cached = loadCatalogCache(GITHUB_USER);
    if (cached) {
      const prepared = prepareItems(cached.repos);
      const ordered = orderPinned(prepared, cached.pinned);
      setItems(ordered);
      setLoading(false);
    }

    // 2) Always refresh in background
    (async () => {
      setErr("");
      if (!cached) setLoading(true);
      try {
        const data = await fetchCatalog(GITHUB_USER); // { repos, pinned }
        if (!alive) return;
        saveCatalogCache(GITHUB_USER, data);

        const prepared = prepareItems(data.repos);
        const ordered = orderPinned(prepared, data.pinned);
        setItems(ordered);
      } catch (e) {
        if (!alive) return;
        setErr(e.message || "Failed to load GitHub projects.");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();

    return () => { alive = false; };
  }, []);

  const filters = useMemo(() => {
    const cats = new Set(items.map(i => i.cat));
    return ["All", ...Array.from(cats)];
  }, [items]);

  const shown = useMemo(
    () => items.filter(p => tab === "All" || p.cat === tab),
    [items, tab]
  );

  return (
    <section>
      <SectionTitle title="Portfolio" />

      {/* Filters */}
      <div className="mt-4 flex flex-wrap gap-2 text-sm">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setTab(f)}
            className={`rounded-full px-4 py-2 border transition ${
              tab === f
                ? "border-[color:var(--acc)] text-white bg-white/5"
                : "border-white/10 text-zinc-300 hover:bg-white/5"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Error */}
      {err && (
        <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm">
          {err}
        </div>
      )}

      {/* Grid */}
      <div className="mt-6 grid gap-5 md:grid-cols-3 items-stretch">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          : shown.map((p) => (
              <ProjectCard key={p.id} p={p} onOpen={() => setModal(p)} />
            ))}
      </div>

      {/* Modal (README loads inside) */}
      {modal && (
        <Modal onClose={() => setModal(null)}>
          <QuickLook repo={modal} />
        </Modal>
      )}
    </section>
  );
}

/** ===== helpers to prep/sort items ===== */
function prepareItems(repos) {
  return repos.map((r) => {
    const cat = categorize({
      topics: r.topics || [],
      language: r.language,
      description: r.description || "",
    });
    return {
      ...r,
      cat,
      blurb: r.description || "No description yet.",
      imgPreferred: rawPNG(r.owner, r.name),
      imgFallback: ogImage(r.owner, r.name),
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
