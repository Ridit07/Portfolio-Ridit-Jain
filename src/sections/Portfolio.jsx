import { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { SectionTitle } from "../components/ui.jsx";
import "../styles/portfolio.css";


const GITHUB_USER = "Ridit07";    
const MAX_REPOS   = 50;
const READ_README = true;          
const README_WORDS = 60;          
const GH_TOKEN = import.meta.env.VITE_GH_TOKEN || ""; 

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

const rawPNG = (owner, repo) =>
  `https://raw.githubusercontent.com/${owner}/${repo}/HEAD/portfolio.png`;
const ogImage = (owner, repo) =>
  `https://opengraph.githubassets.com/${Date.now()}/${owner}/${repo}`;

async function gh(url, body) {
  const init = {
    method: body ? "POST" : "GET",
    headers: {
      Accept: "application/vnd.github+json",
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(GH_TOKEN ? { Authorization: `Bearer ${GH_TOKEN}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  };
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

async function fetchPinned(username) {
  if (!GH_TOKEN) return [];
  const query = `
    query($login:String!) {
      user(login: $login) {
        pinnedItems(first: 6, types: REPOSITORY) {
          nodes { ... on Repository { name owner { login } } }
        }
      }
    }
  `;
  const data = await gh("https://api.github.com/graphql", {
    query,
    variables: { login: username },
  });
  const nodes = data?.data?.user?.pinnedItems?.nodes || [];
  return nodes.map(n => `${n.owner.login}/${n.name}`.toLowerCase());
}

async function fetchRepos(username) {
  const repos = await gh(
    `https://api.github.com/users/${username}/repos?per_page=${MAX_REPOS}&sort=updated`
  );
  return repos
    .filter(r => !r.fork)
    .map(r => ({
      id: r.id,
      name: r.name,
      full_name: r.full_name,
      html_url: r.html_url,
      homepage: r.homepage || "",
      description: r.description || "", 
      language: r.language || "",
      stargazers_count: r.stargazers_count || 0,
      owner: r.owner?.login || username,
    }));
}

function b64ToUtf8(b64) {
  const bin = atob(b64.replace(/\n/g, ""));
  const bytes = Uint8Array.from(bin, c => c.charCodeAt(0));
  return new TextDecoder("utf-8").decode(bytes);
}

function extractReadme(b64, words = README_WORDS) {
  const md = b64ToUtf8(b64);
  const plain = md
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[#>*_`]|!\[[^\]]*\]\([^)]+\)|\[[^\]]*\]\([^)]+\)/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const excerpt = plain.split(" ").slice(0, words).join(" ");
  return {
    blurb: excerpt && excerpt.length > 20 ? `${excerpt}…` : "",
    full: md, 
  };
}

async function enrichRepo(repo) {
  const [topicsRes, readmeRes] = await Promise.allSettled([
    gh(`https://api.github.com/repos/${repo.owner}/${repo.name}/topics`),
    READ_README ? gh(`https://api.github.com/repos/${repo.owner}/${repo.name}/readme`) : Promise.resolve({}),
  ]);

  const topics = topicsRes.status === "fulfilled" ? (topicsRes.value?.names || []) : [];

  let cardDesc = repo.description || "";
  let readmeFull = "";
  if (READ_README && readmeRes.status === "fulfilled" && readmeRes.value?.content) {
    const { blurb, full } = extractReadme(readmeRes.value.content, README_WORDS);
    readmeFull = full;
    if (!cardDesc && blurb) cardDesc = blurb;
  }

  const cat = categorize({ topics, language: repo.language, description: cardDesc });

  return {
    ...repo,
    topics,
    cat,
    blurb: cardDesc || "No description yet.",
    readme: readmeFull,              
    imgPreferred: rawPNG(repo.owner, repo.name),
    imgFallback: ogImage(repo.owner, repo.name),
  };
}

export default function Portfolio() {
  const [tab, setTab] = useState("All");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [items, setItems] = useState([]);
  const [modal, setModal] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setErr("");
      setLoading(true);
      try {
        const [base, pinnedList] = await Promise.all([
          fetchRepos(GITHUB_USER),
          fetchPinned(GITHUB_USER).catch(() => []),
        ]);

        const enriched = await Promise.all(base.map(enrichRepo));

        const pinnedSet = new Set(pinnedList);
        const indexMap = new Map(pinnedList.map((n, i) => [n, i]));
        const pinned = [];
        const others = [];
        for (const r of enriched) {
          const key = r.full_name.toLowerCase();
          if (pinnedSet.has(key)) pinned.push(r);
          else others.push(r);
        }
        pinned.sort((a, b) => indexMap.get(a.full_name.toLowerCase()) - indexMap.get(b.full_name.toLowerCase()));
        others.sort((a, b) => b.stargazers_count - a.stargazers_count);

        if (!alive) return;
        setItems([...pinned, ...others]);
      } catch (e) {
        if (!alive) return;
        setErr(e.message || "Failed to load GitHub projects.");
      } finally {
        if (alive) setLoading(false);
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

      {err && (
        <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm">
          {err} {!GH_TOKEN && " Tip: add VITE_GH_TOKEN in .env to fetch pinned repos and lift rate limits."}
        </div>
      )}

<div className="mt-6 grid gap-5 md:grid-cols-3 items-stretch">

        {loading
          ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          : shown.map((p) => (
              <ProjectCard key={p.id} p={p} onOpen={() => setModal(p)} />
            ))}
      </div>

      {modal && (
        <Modal onClose={() => setModal(null)}>
          <QuickLook repo={modal} />
        </Modal>
      )}

  
    </section>
  );
}

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
  return (
    <>
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
            <a
              href={repo.homepage}
              target="_blank"
              rel="noreferrer"
              className="btn"
            >
              Live
            </a>
          )}
          <a
            href={repo.html_url}
            target="_blank"
            rel="noreferrer"
            className="btn btn-acc"
          >
            GitHub
          </a>
        </div>
      </div>

      <div className="px-4 md:px-5 py-4 overflow-auto max-h-[calc(85vh-56px)]">
        {repo.readme ? (
          <div className="markdown">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {repo.readme}
            </ReactMarkdown>
          </div>
        ) : (
          <p className="text-sm text-zinc-300">No README found for this repository.</p>
        )}
      </div>
    </>
  );
}
