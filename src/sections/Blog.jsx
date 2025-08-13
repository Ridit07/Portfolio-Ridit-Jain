import { useEffect, useMemo, useState } from "react";
import { SectionTitle } from "../components/ui.jsx";
import GitHubCalendar from "../components/GitHubCalendar.jsx";


const GITHUB_USER   = "Ridit07";
const LEETCODE_USER = "ridit_jain19";       
const LINKEDIN_URL  = "https://www.linkedin.com/in/ridit-jain-479230214/";

const GH_TOKEN = import.meta.env.VITE_GH_TOKEN || "";

async function gh(url) {
  const r = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
      ...(GH_TOKEN ? { Authorization: `Bearer ${GH_TOKEN}` } : {}),
    },
  });
  if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
  return r.json();
}

const startOfDay = (d) => {
  const x = new Date(d);
  x.setHours(0,0,0,0);
  return x;
};
const fmtISO = (d) => startOfDay(d).toISOString().slice(0,10);

function countGithubDaily(events, days = 180) {
  const today = startOfDay(new Date());
  const start = new Date(today); start.setDate(start.getDate() - (days-1));
  const map = new Map(); 

  for (let i=0;i<days;i++){
    const d = new Date(start); d.setDate(start.getDate()+i);
    map.set(fmtISO(d), 0);
  }

  for (const e of events) {
    const day = fmtISO(e.created_at);
    if (!map.has(day)) continue;
    let inc = 0;
    switch (e.type) {
      case "PushEvent":            inc = (e.payload?.commits?.length || 1); break;
      case "PullRequestEvent":     inc = (e.payload?.action === "opened" || e.payload?.action === "merged") ? 1 : 0; break;
      case "IssuesEvent":          inc = (e.payload?.action === "opened") ? 1 : 0; break;
      case "IssueCommentEvent":    inc = 0; break;
      case "CreateEvent":          inc = 1; break;
      case "ReleaseEvent":         inc = 1; break;
      default:                     inc = 0;
    }
    if (inc) map.set(day, map.get(day) + inc);
  }
  return map;
}

function buildWeeks(dailyMap, days) {
  const today = startOfDay(new Date());
  const start = new Date(today); start.setDate(start.getDate() - (days-1));

  const alignedStart = new Date(start);
  const deltaToSun = alignedStart.getDay(); 
  alignedStart.setDate(alignedStart.getDate() - deltaToSun);

  const weeks = [];
  let cursor = new Date(alignedStart);
  while (cursor <= today) {
    const col = [];
    for (let r=0;r<7;r++){
      const iso = fmtISO(cursor);
      col.push({
        date: new Date(cursor),
        iso,
        value: dailyMap.get(iso) ?? null, 
      });
      cursor.setDate(cursor.getDate()+1);
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

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setErr("");
        const [user, repos] = await Promise.all([
          gh(`https://api.github.com/users/${GITHUB_USER}`),
          gh(`https://api.github.com/users/${GITHUB_USER}/repos?per_page=100&sort=updated`)
        ]);
        if (!alive) return;
        setGhUser(user);
        setGhRepos(repos);

        const pages = await Promise.all([
          gh(`https://api.github.com/users/${GITHUB_USER}/events/public?per_page=100&page=1`),
          gh(`https://api.github.com/users/${GITHUB_USER}/events/public?per_page=100&page=2`).catch(()=>[]),
          gh(`https://api.github.com/users/${GITHUB_USER}/events/public?per_page=100&page=3`).catch(()=>[]),
        ]);
        if (!alive) return;
        setGhEvents([].concat(...pages));
      } catch (e) {
        if (!alive) return;
        setErr(e.message || "Failed to fetch stats.");
      }
    })();
    return () => { alive = false; };
  }, []);

  const stars = useMemo(() => ghRepos.reduce((s,r)=>s+(r.stargazers_count||0),0), [ghRepos]);
  const reposCount = ghRepos.length;
  const langs = useMemo(() => {
    const m = new Map();
    ghRepos.forEach(r => {
      if (!r.language) return;
      m.set(r.language, (m.get(r.language) || 0) + 1);
    });
    return [...m.entries()].sort((a,b)=>b[1]-a[1]).slice(0,7);
  }, [ghRepos]);

  const daily = useMemo(() => countGithubDaily(ghEvents, days), [ghEvents, days]);
  const weeks = useMemo(() => buildWeeks(daily, days), [daily, days]);
  const maxVal = useMemo(() => Math.max(1, ...Array.from(daily.values())), [daily]);

  return (
    <section>
      <SectionTitle title="Activity & Stats" />


      {err && (
        <div className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm">
          {err} {!GH_TOKEN && " Tip: add VITE_GH_TOKEN in .env for higher rate limits."}
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

      <GitHubCalendar login="Ridit07" />

      <div className="mt-6 grid gap-5 md:grid-cols-2">
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
            <p className="mt-2 text-sm text-zinc-400">
              This calendar shows my LeetCode streak/solves.
            </p>
          </div>
        </div>

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
                      <span className="text-zinc-200">{lang}</span>
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
                  title={`${cell.iso}${cell.value!=null ? ` • ${cell.value} contributions` : ""}`}
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
