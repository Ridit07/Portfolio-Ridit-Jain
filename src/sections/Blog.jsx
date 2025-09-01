import { useEffect, useMemo, useState, useRef } from "react";
import { SectionTitle } from "../components/ui.jsx";
import GitHubCalendar from "../components/GitHubCalendar.jsx";


const GITHUB_USER = "Ridit07";
const LEETCODE_USER = "ridit_jain19";
const LINKEDIN_URL = "https://www.linkedin.com/in/ridit-jain-479230214/";

//const GH_TOKEN = import.meta.env.VITE_GH_TOKEN || "";

const GH_VER = "v1";
const GH_CACHE_KEY = (u) => `gh_stats_${GH_VER}_${u}`;
const GH_TTL_MS = 60 * 60 * 1000; // 1 hour

const LC_VER = "v3";
const LC_CACHE_KEY = (u) => `lc_contest_${LC_VER}_${u}`;
const LC_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours (contests are weekly)


const hasLS = () => typeof window !== "undefined" && !!window.localStorage;
const lsGet = (k) => { try { return hasLS() ? localStorage.getItem(k) : null; } catch { return null; } };
const lsSet = (k, v) => { try { if (hasLS()) localStorage.setItem(k, v); } catch { } };
const lsDel = (k) => { try { if (hasLS()) localStorage.removeItem(k); } catch { } };

function loadGhStatsCache(user) {
  try {
    const raw = lsGet(GH_CACHE_KEY(user));
    if (!raw) return null;
    const j = JSON.parse(raw); // { t, data }
    if (Date.now() - j.t > GH_TTL_MS) { lsDel(GH_CACHE_KEY(user)); return null; }
    return j.data;
  } catch { return null; }
}
function saveGhStatsCache(user, data) {
  try { lsSet(GH_CACHE_KEY(user), JSON.stringify({ t: Date.now(), data })); } catch { }
}


function loadLcContestCache(user) {
  try {
    const raw = lsGet(LC_CACHE_KEY(user));
    if (!raw) return null;
    const j = JSON.parse(raw); // { t, data }
    if (Date.now() - j.t > LC_TTL_MS) { lsDel(LC_CACHE_KEY(user)); return null; }
    return j.data;
  } catch { return null; }
}
function saveLcContestCache(user, data) {
  try { lsSet(LC_CACHE_KEY(user), JSON.stringify({ t: Date.now(), data })); } catch { }
}


// const getRefreshFlag = () => {
//   try {
//     const u = new URL(window.location.href);
//     return u.searchParams.get("refresh") === "1";
//   } catch {
//     return false;
//   }
// };


async function ghPublic(url) {
  const r = await fetch(url, { headers: { Accept: "application/vnd.github+json" } });
  if (!r.ok) {
    const text = await r.text().catch(() => "");
    throw new Error(`${r.status} ${r.statusText}${text ? ` – ${text.slice(0, 120)}` : ""}`);
  }
  return r.json();
}

async function fetchGhStats(user) {
  // user + repos
  const [u, repos] = await Promise.all([
    ghPublic(`https://api.github.com/users/${user}`),
    ghPublic(`https://api.github.com/users/${user}/repos?per_page=100&sort=updated`),
  ]);
  // events pages (best-effort)
  const pages = await Promise.all([
    ghPublic(`https://api.github.com/users/${user}/events/public?per_page=100&page=1`).catch(() => []),
    ghPublic(`https://api.github.com/users/${user}/events/public?per_page=100&page=2`).catch(() => []),
    ghPublic(`https://api.github.com/users/${user}/events/public?per_page=100&page=3`).catch(() => []),
  ]);
  return { user: u, repos, events: pages.flat() };
}


async function fetchLcContest(user) {
  const res = await fetch(`/api/leetcode/contest?user=${encodeURIComponent(user)}`, { headers: { Accept: "application/json" } });
  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("application/json")) {
    const text = await res.text().catch(() => "");
    throw new Error(`LeetCode Contest API did not return JSON (got ${ct || "unknown"}). ${text.slice(0, 120)}…`);
  }
  const json = await res.json();
  if (!res.ok || json.error) throw new Error(json.error || `${res.status} ${res.statusText}`);
  return json; // { rating, ranking, attended, topPercentage, _fetched_at }
}


// async function gh(url) {
//   const r = await fetch(url, {
//     headers: {
//       Accept: "application/vnd.github+json",
//       ...(GH_TOKEN ? { Authorization: `Bearer ${GH_TOKEN}` } : {}),
//     },
//   });
//   if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
//   return r.json();
// }

const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const fmtISO = (d) => startOfDay(d).toISOString().slice(0, 10);

function countGithubDaily(events, days = 180) {
  const today = startOfDay(new Date());
  const start = new Date(today); start.setDate(start.getDate() - (days - 1));
  const map = new Map();
  for (let i = 0; i < days; i++) {
    const d = new Date(start); d.setDate(start.getDate() + i);
    map.set(fmtISO(d), 0);
  }
  for (const e of events) {
    const day = fmtISO(e.created_at);
    if (!map.has(day)) continue;
    let inc = 0;
    switch (e.type) {
      case "PushEvent": inc = (e.payload?.commits?.length || 1); break;
      case "PullRequestEvent": inc = (e.payload?.action === "opened" || e.payload?.action === "merged") ? 1 : 0; break;
      case "IssuesEvent": inc = (e.payload?.action === "opened") ? 1 : 0; break;
      case "CreateEvent":
      case "ReleaseEvent": inc = 1; break;
      default: inc = 0;
    }
    if (inc) map.set(day, map.get(day) + inc);
  }
  return map;
}

function buildWeeks(dailyMap, days) {
  const today = startOfDay(new Date());
  const start = new Date(today); start.setDate(start.getDate() - (days - 1));
  const alignedStart = new Date(start);
  const deltaToSun = alignedStart.getDay();
  alignedStart.setDate(alignedStart.getDate() - deltaToSun);
  const weeks = [];
  let cursor = new Date(alignedStart);
  while (cursor <= today) {
    const col = [];
    for (let r = 0; r < 7; r++) {
      const iso = fmtISO(cursor);
      col.push({ date: new Date(cursor), iso, value: dailyMap.get(iso) ?? null });
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(col);
  }
  return weeks;
}



export default function Blog() {
  const [days, setDays] = useState(180);
  const [ghUser, setGhUser] = useState(null);
  const [ghRepos, setGhRepos] = useState([]);
  const [ghEvents, setGhEvents] = useState([]);
  const [err, setErr] = useState("");

  const [lc, setLc] = useState(null);
  const [lcErr, setLcErr] = useState("");


  useEffect(() => {
    let alive = true;

    const cached = loadGhStatsCache(GITHUB_USER);
    if (cached && alive) {
      setGhUser(cached.user);
      setGhRepos(cached.repos || []);
      setGhEvents(cached.events || []);
    }


    (async () => {
      try {
        const fresh = await fetchGhStats(GITHUB_USER);
        if (!alive) return;
        setGhUser(fresh.user);
        setGhRepos(fresh.repos);
        setGhEvents(fresh.events);
        saveGhStatsCache(GITHUB_USER, fresh);
        setErr(""); // clear any previous error
      } catch (e) {
        if (!alive) return;
        // keep whatever we had (maybe cached), show soft error
        setErr(e.message || "Failed to refresh GitHub stats.");
      }
    })();

    const lcCached = loadLcContestCache(LEETCODE_USER);
    if (lcCached && alive) setLc(lcCached);
    // background refresh LC contest
    (async () => {
      try {
        const fresh = await fetchLcContest(LEETCODE_USER);
        if (!alive) return;
        setLc(fresh);
        saveLcContestCache(LEETCODE_USER, fresh);
        setLcErr("");
      } catch (e) {
        if (!alive) return;
        setLcErr(e.message || "Failed to load LeetCode contest stats.");
      }
    })();


    return () => { alive = false; };
  }, []);



  const stars = useMemo(() => ghRepos.reduce((s, r) => s + (r.stargazers_count || 0), 0), [ghRepos]);
  const reposCount = ghRepos.length;
  const langs = useMemo(() => {
    const m = new Map();
    ghRepos.forEach(r => { if (r.language) m.set(r.language, (m.get(r.language) || 0) + 1); });
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 7);
  }, [ghRepos]);

  const daily = useMemo(() => countGithubDaily(ghEvents, days), [ghEvents, days]);
  const weeks = useMemo(() => buildWeeks(daily, days), [daily, days]);
  const maxVal = useMemo(() => Math.max(1, ...Array.from(daily.values())), [daily]);

  const topPctText = lc?.topPercentage != null ? `${Number(lc.topPercentage).toFixed(2)}%` : "—";
  const ratingText = lc?.rating ? Math.round(lc.rating).toLocaleString() : "—";
  const rankText = lc?.ranking != null ? Number(lc.ranking).toLocaleString() : "—";
  const attended = lc?.attended ?? 0;


  return (
    <section>
      <SectionTitle title="Activity & Stats" />

      {err && (
        <div className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm">
          {err}
        </div>
      )}

      <div className="mt-5 grid gap-3 md:grid-cols-4">
        <StatCard label="GitHub Repos" value={reposCount || "—"} />
        <StatCard label="GitHub Stars" value={stars || "—"} />
        <StatCard label="Followers" value={ghUser?.followers ?? "—"} />
        <a href={LINKEDIN_URL} target="_blank" rel="noreferrer" className="block">
          <StatCard label="LinkedIn" value="View profile →" />
        </a>
      </div>

      <GitHubCalendar login={GITHUB_USER} />

      <div className="mt-6">
  <LeetCodeContestCard lc={lc} lcErr={lcErr} />
</div>

      {/* --- three-up row: LeetCode Activity, Contest Stats, Top Languages --- */}
      <div className="mt-6 grid gap-5 md:grid-cols-2">
  {/* LeetCode Activity (unchanged) */}
  <div className="rounded-2xl bg-[#0f1115] border border-white/10 overflow-hidden">
    <div className="flex items-center justify-between px-4 md:px-5 py-3 border-b border-white/10">
      <h4 className="text-lg font-semibold">LeetCode Activity</h4>
      <a
        className="text-xs rounded-full px-3 py-1 border border-white/10 bg-white/5 hover:bg-white/10"
        href={`https://leetcode.com/${LEETCODE_USER}/`} target="_blank" rel="noreferrer"
      >
        Profile
      </a>
    </div>
    <div className="p-4">
      <img
        alt="LeetCode heatmap"
        className="w-full rounded-xl border border-white/10"
        src={`https://leetcard.jacoblin.cool/${LEETCODE_USER}?theme=dark&ext=heatmap`}
        onError={(e)=>{ e.currentTarget.style.display="none"; }}
        loading="lazy"
      />
      <p className="mt-2 text-sm text-zinc-400">This calendar shows my LeetCode streak/solves.</p>
    </div>
  </div>

  {/* Top Languages (unchanged) */}
  <div className="rounded-2xl bg-[#0f1115] border border-white/10 overflow-hidden">
    <div className="flex items-center justify-between px-4 md:px-5 py-3 border-b border-white/10">
      <h4 className="text-lg font-semibold">Top Languages (by repo)</h4>
      <a
        className="text-xs rounded-full px-3 py-1 border border-white/10 bg-white/5 hover:bg-white/10"
        href={`https://github.com/${GITHUB_USER}?tab=repositories`} target="_blank" rel="noreferrer"
      >
        See repos
      </a>
    </div>
    <div className="p-4">
      {langs.length === 0 ? (
        <p className="text-sm text-zinc-400">No language data yet.</p>
      ) : (
        <div className="space-y-3">
          {langs.map(([lang,count]) => (
            <div key={lang}>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-2 00">{lang}</span>
                <span className="text-zinc-400">{count}</span>
              </div>
              <div className="h-2 rounded-full bg-white/5 border border-white/10 overflow-hidden">
                <div className="h-full" style={{
                  width: `${(count / langs[0][1]) * 100}%`,
                  background: "linear-gradient(90deg, #1f9d55, #10b981)"
                }} />
              </div>
            </div>
          ))}
        </div>
      )}
      <p className="mt-2 text-xs text-zinc-400">Approximation using the primary language each repo reports.</p>
    </div>
  </div>
</div>


      {/* existing images row unchanged */}
      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <a href={`https://github.com/${GITHUB_USER}`} target="_blank" rel="noreferrer" className="block">
          <img
            loading="lazy"
            className="w-full rounded-2xl border border-white/10"
            alt="GitHub stats"
            src={`https://github-readme-stats.vercel.app/api?username=${GITHUB_USER}&show_icons=true&theme=dark&hide_border=true`}
          />
        </a>
        <a href={`https://github.com/${GITHUB_USER}`} target="_blank" rel="noreferrer" className="block">
          <img
            loading="lazy"
            className="w-full rounded-2xl border border-white/10"
            alt="GitHub activity graph"
            src={`https://github-readme-activity-graph.vercel.app/graph?username=${GITHUB_USER}&theme=github-dark&hide_border=true`}
          />
        </a>
      </div>
    </section>
  );
}


function StatCard({ label, value }) {
  return (
    <div className="rounded-2xl bg-[#0f1115] border border-white/10 p-4">
      <div className="text-xs text-zinc-400">{label}</div>
      <div className="mt-1 text-xl font-semibold">{value}</div>
    </div>
  );
}

function Heatmap({ weeks, maxVal }) {
  const bucket = (v) => {
    if (v === null) return -1;
    if (v <= 0) return 0;
    const q1 = Math.max(1, Math.ceil(maxVal * 0.25));
    const q2 = Math.max(2, Math.ceil(maxVal * 0.5));
    const q3 = Math.max(3, Math.ceil(maxVal * 0.75));
    if (v <= q1) return 1;
    if (v <= q2) return 2;
    if (v <= q3) return 3;
    return 4;
  };

  const colors = {
    "-1": "transparent",
    "0": "rgba(255,255,255,.06)",
    "1": "#0d3d2b",
    "2": "#146b3a",
    "3": "#1ea05a",
    "4": "#34d399",
  };

  return (
    <div className="mt-4 overflow-x-auto">
      <div className="inline-flex gap-1">
        {weeks.map((col, ci) => (
          <div key={ci} className="flex flex-col gap-1">
            {col.map((cell, ri) => {
              const b = bucket(cell.value);
              return (
                <div
                  key={ri}
                  title={`${cell.iso}${cell.value != null ? ` • ${cell.value} contributions` : ""}`}
                  className="h-3 w-3 rounded-[4px] border border-white/10"
                  style={{ background: colors[b] }}
                />
              );
            })}
          </div>
        ))}
      </div>
      <div className="mt-2 text-xs text-zinc-400">Green dots = more activity.</div>
    </div>
  );
}

// function SmallStat({ label, value }) {
//   return (
//     <div className="rounded-xl bg-white/5 border border-white/10 p-3">
//       <div className="text-[10px] uppercase tracking-wide text-zinc-400">{label}</div>
//       <div className="mt-1 font-medium">{value}</div>
//     </div>
//   );
// }


function SmallStat({ label, value }) {
  const v = typeof value === "function" ? value() : value;
  return (
    <div className="rounded-xl bg-white/5 border border-white/10 p-3">
      <div className="text-[10px] uppercase tracking-wide text-zinc-400">{label}</div>
      <div className="mt-1 font-medium">{v}</div>
    </div>
  );
}

function ContestSparkline({ history = [] }) {
  const svgRef = useRef(null);
  const [hover, setHover] = useState(null); // { i, x, y }

  const w = 600, h = 120, pad = 10;
  const isEmpty = !history || history.length === 0;

  // Always run this hook
  const { points, minX, maxX } = useMemo(() => {
    const xs = (history || []).map(p => p.ts);
    const ys = (history || []).map(p => p.rating);

    const minX = xs.length ? Math.min(...xs) : 0;
    const maxX = xs.length ? Math.max(...xs) : 1;
    const minYv = ys.length ? Math.min(...ys) : 0;
    const maxYv = ys.length ? Math.max(...ys) : 1;

    const yPad = Math.max(10, (maxYv - minYv) * 0.1);
    const y0 = minYv - yPad, y1 = maxYv + yPad;

    const sx = (t, W = w) => pad + ((t - minX) / Math.max(1, (maxX - minX))) * (W - pad * 2);
    const sy = (v, H = h) => H - pad - ((v - y0) / Math.max(1, (y1 - y0))) * (H - pad * 2);

    const pts = (history || []).map(p => ({
      ...p,
      x: (W) => sx(p.ts, W ?? w),
      y: (H) => sy(p.rating, H ?? h),
    }));

    return { points: pts, minX, maxX };
  }, [history]);

  // Always run this hook
  const pathD = useMemo(() => {
    if (!points.length) return "";
    return points.map((p, i) => `${i ? "L" : "M"} ${p.x()} ${p.y()}`).join(" ");
  }, [points]);

  const firstLabel = useMemo(
    () => (history?.length ? new Date(history[0].ts).toLocaleString(undefined, { month: "short", year: "numeric" }) : ""),
    [history]
  );
  const lastLabel = useMemo(
    () => (history?.length ? new Date(history[history.length - 1].ts).toLocaleString(undefined, { month: "short", year: "numeric" }) : ""),
    [history]
  );

  const onMove = (e) => {
    if (!points.length) return;
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const W = rect.width, H = rect.height;
    const x = e.clientX - rect.left;

    const t = minX + ((x - pad) / Math.max(1, (W - pad * 2))) * (maxX - minX);

    // nearest index by ts
    let best = 0, bestDist = Infinity;
    for (let i = 0; i < history.length; i++) {
      const d = Math.abs(history[i].ts - t);
      if (d < bestDist) { best = i; bestDist = d; }
    }

    const px = points[best].x(W);
    const py = points[best].y(H);
    setHover({ i: best, x: px, y: py });
  };

  const onLeave = () => setHover(null);

  const hoverPoint = hover ? history[hover.i] : null;
  const hoverLabel = hoverPoint
    ? `${new Date(hoverPoint.ts).toLocaleDateString()} • ${Math.round(hoverPoint.rating)}${hoverPoint.title ? ` • ${hoverPoint.title}` : ""}`
    : "";

  return (
    <div className="relative">
      <div className="text-xs uppercase tracking-wide text-zinc-400 mb-1">Rating Trend (1y)</div>

      {isEmpty ? (
        <div className="text-xs text-zinc-400">No contest history in the last year.</div>
      ) : (
        <>
          <svg
            ref={svgRef}
            width="100%"
            viewBox={`0 0 ${w} ${h}`}
            role="img"
            aria-label="LeetCode rating history"
            onMouseMove={onMove}
            onMouseLeave={onLeave}
          >
            <path d={pathD} fill="none" stroke="#f59e0b" strokeWidth="2" />
            {/* last point */}
            {points.length > 0 && (
              <circle cx={points[points.length - 1].x()} cy={points[points.length - 1].y()} r="3.5" fill="#ffffff" stroke="#f59e0b" strokeWidth="2" />
            )}
            {/* hover guides */}
            {hover && (
              <>
                <line x1={hover.x} x2={hover.x} y1={pad} y2={h - pad} stroke="rgba(255,255,255,0.25)" strokeDasharray="4 4" />
                <circle cx={hover.x} cy={hover.y} r="4" fill="#ffffff" stroke="#f59e0b" strokeWidth="2" />
              </>
            )}
          </svg>

          {/* tooltip */}
          {hover && (
            <div
              className="pointer-events-none absolute -translate-x-1/2 -translate-y-3 rounded-md bg-black/80 px-2 py-1 text-xs text-white shadow"
              style={{ left: hover.x, top: hover.y }}
            >
              {hoverLabel}
            </div>
          )}

          <div className="mt-1 flex justify-between text-[11px] text-zinc-400">
            <span>{firstLabel}</span>
            <span>{lastLabel}</span>
          </div>
        </>
      )}
    </div>
  );
}


function ContestHistogram({ topPercentage }) {
  const ref = useRef(null);
  const [hover, setHover] = useState(null); // {i, leftPx}

  const bins = 20;
  const gap = 6;

  // bell-ish distribution
  const heights = useMemo(() => {
    return Array.from({ length: bins }, (_, i) => {
      const mu = bins * 0.45;
      const sigma = bins * 0.15;
      const z = (i - mu) / sigma;
      return Math.max(3, Math.round(30 * Math.exp(-0.5 * z * z)));
    });
  }, []);

  const bucketFromTop = (tp) => {
    if (tp == null || tp <= 0 || tp > 100) return null;
    return Math.max(0, Math.min(bins - 1, Math.floor((100 - tp) / (100 / bins))));
  };

  const idx = bucketFromTop(topPercentage);

  const pctRange = (i) => {
    const high = Math.max(0, 100 - (i)   * (100 / bins));   // inclusive high (better)
    const low  = Math.max(0, 100 - (i+1) * (100 / bins));   // exclusive low
    return { low, high };
  };

  const tipText = (i) => {
    const { low, high } = pctRange(i);
    const range = `${high.toFixed(0)}–${low.toFixed(0)}%`;
    return i === idx && topPercentage != null
      ? `You • Top ${Number(topPercentage).toFixed(2)}% • Bucket ${i+1}/${bins} (${range})`
      : `Bucket ${i+1}/${bins} (${range})`;
  };

  const onEnter = (i, e) => {
    const box = ref.current?.getBoundingClientRect();
    if (!box) return;
    const w = box.width;
    const barW = (w - (bins - 1) * gap) / bins;
    const left = i * (barW + gap) + barW / 2;
    setHover({ i, leftPx: left });
  };

  const onLeave = () => setHover(null);

  return (
    <div ref={ref} className="relative">
      <div className="text-xs uppercase tracking-wide text-zinc-400 mb-1">Top % Bucket</div>
      <div className="flex items-end h-[96px] gap-[6px]" onMouseLeave={onLeave}>
        {heights.map((h, i) => (
          <div
            key={i}
            className="w-[10px] rounded-[3px] transition-opacity"
            title={tipText(i)}
            onMouseEnter={(e)=>onEnter(i, e)}
            style={{
              height: `${h}px`,
              background: i === idx ? "#f59e0b" : "rgba(255,255,255,0.14)",
              opacity: hover && hover.i !== i ? 0.6 : 1,
            }}
          />
        ))}
      </div>
      {hover && (
        <div
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-2 rounded-md bg-black/80 px-2 py-1 text-xs text-white shadow"
          style={{ left: hover.leftPx, top: 0 }}
        >
          {tipText(hover.i)}
        </div>
      )}
    </div>
  );
}

function LeetCodeContestCard({ lc, lcErr }) {
  const topPct = lc?.topPercentage != null ? `${Number(lc.topPercentage).toFixed(2)}%` : "—";
  const rating = lc?.rating ? Math.round(lc.rating).toLocaleString() : "—";
  const globalRank = (() => {
    const gr = lc?.globalRanking;
    if (gr == null) return "—";
    const tp = lc?.topPercentage;
    const approxTotal = (tp != null && tp > 0) ? Math.round((gr * 100) / tp) : null;
    return approxTotal ? `${Number(gr).toLocaleString()}/${approxTotal.toLocaleString()}` : Number(gr).toLocaleString();
  })();
  const attended = lc?.attended ?? 0;

  return (
    <div className="rounded-2xl bg-[#0f1115] border border-white/10 overflow-hidden">
      <div className="flex items-center justify-between px-4 md:px-5 py-3 border-b border-white/10">
        <h4 className="text-lg font-semibold">LeetCode Contest</h4>
        <a
          className="text-xs rounded-full px-3 py-1 border border-white/10 bg-white/5 hover:bg-white/10"
          href={`https://leetcode.com/${LEETCODE_USER}/`} target="_blank" rel="noreferrer"
        >
          Profile
        </a>
      </div>

      <div className="p-4 md:p-5">
        {lcErr && (
          <div className="mb-3 rounded-md border border-yellow-500/30 bg-yellow-500/10 px-3 py-2 text-xs">
            {lcErr}
          </div>
        )}

        {/* header stats */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-xs uppercase tracking-wide text-zinc-400">Contest Rating</div>
            <div className="text-3xl md:text-4xl font-semibold">{rating}</div>
          </div>
          <div className="text-right">
            <div className="text-xs uppercase tracking-wide text-zinc-400">Top</div>
            <div className="text-xl md:text-2xl font-semibold">{topPct}</div>
          </div>
        </div>

        {/* charts */}
        <div className="mt-4 grid grid-cols-12 gap-4">
          <div className="col-span-12 md:col-span-8 rounded-xl bg-white/5 border border-white/10 p-3 md:p-4">
            <ContestSparkline history={lc?.history || []} />
          </div>
          <div className="col-span-12 md:col-span-4 rounded-xl bg-white/5 border border-white/10 p-3 md:p-4">
            <ContestHistogram topPercentage={lc?.topPercentage} />
          </div>
        </div>

        {/* small stats */}
        <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
          <SmallStat label="Global Rank" value={globalRank} />
          <SmallStat label="Attended" value={attended} />
          <SmallStat label="Updated" value={lc ? new Date(lc._fetched_at).toLocaleDateString() : "—"} />
        </div>

        <p className="mt-2 text-xs text-zinc-500">
          Data via LeetCode GraphQL • cached for ~6h. Histogram is an approximation; highlighted bar reflects your top % bucket.
        </p>
      </div>
    </div>
  );
}
