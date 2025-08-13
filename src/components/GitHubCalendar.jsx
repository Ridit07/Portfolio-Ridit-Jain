import { useEffect, useMemo, useState } from "react";

const GH_TOKEN = import.meta.env.VITE_GH_TOKEN || "";

async function ghQL(query, variables) {
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      ...(GH_TOKEN ? { Authorization: `Bearer ${GH_TOKEN}` } : {}),
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (!res.ok || json.errors) {
    throw new Error(json?.errors?.[0]?.message || `${res.status} ${res.statusText}`);
  }
  return json.data;
}

export default function GitHubCalendar({ login }) {
  const [weeks, setWeeks] = useState([]);
  const [total, setTotal] = useState(0);
  const [err, setErr] = useState("");

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        setErr("");
        const to = new Date();
        const from = new Date(to);
        from.setDate(to.getDate() - 364); 

        const query = `
          query($login:String!, $from:DateTime!, $to:DateTime!) {
            user(login:$login) {
              contributionsCollection(from:$from, to:$to) {
                contributionCalendar {
                  totalContributions
                  weeks {
                    firstDay
                    contributionDays {
                      date
                      weekday
                      contributionCount
                      color
                    }
                  }
                }
              }
            }
          }
        `;

        const d = await ghQL(query, {
          login,
          from: from.toISOString(),
          to: to.toISOString(),
        });

        if (!live) return;
        const cal = d.user.contributionsCollection.contributionCalendar;
        setWeeks(cal.weeks || []);
        setTotal(cal.totalContributions || 0);
      } catch (e) {
        if (!live) return;
        setErr(e.message || "Failed to load GitHub contributions.");
      }
    })();
    return () => { live = false; };
  }, [login]);

  const legend = useMemo(() => {
    const counts = weeks.flatMap(w => w.contributionDays.map(d => d.contributionCount));
    const sorted = counts.slice().sort((a, b) => a - b);
    const q = (p) => sorted[Math.floor(p * (sorted.length - 1))] || 0;
    return [q(0.20), q(0.40), q(0.60), q(0.80)];
  }, [weeks]);

  return (
    <section className="mt-6 rounded-2xl bg-[#0f1115] border border-white/10 p-5">
      <div className="flex items-baseline justify-between">
        <h4 className="text-xl font-semibold">GitHub Contributions</h4>
        <span className="text-sm text-zinc-400">{total} in the last year</span>
      </div>

      {err ? (
        <div className="mt-4 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm">
          {err} {!GH_TOKEN && " (Tip: VITE_GH_TOKEN is required for the calendar.)"}
        </div>
      ) : (
        <>
          <div className="mt-4 overflow-x-auto">
            <div className="flex gap-[3px] min-w-[680px]">
              {weeks.map((w, i) => (
                <div key={w.firstDay + i} className="flex flex-col gap-[3px]">
                  {w.contributionDays.map((d, idx) => {
                    const c = d.contributionCount;
                    const bg = d.color || (
                      c === 0 ? "rgba(255,255,255,.08)" :
                      c <= legend[0] ? "#0e4429" :
                      c <= legend[1] ? "#006d32" :
                      c <= legend[2] ? "#26a641" :
                      c <= legend[3] ? "#39d353" : "#56f28a"
                    );
                    return (
                      <div
                        key={d.date + idx}
                        title={`${d.date}: ${c} contribution${c === 1 ? "" : "s"}`}
                        className="h-[12px] w-[12px] rounded-[3px] border border-black/20"
                        style={{ background: c === 0 ? "rgba(255,255,255,.06)" : bg }}
                        aria-label={`${d.date} ${c} contributions`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 text-xs text-zinc-400">
            Less
            <span className="h-3 w-3 rounded-[3px] border border-white/10 bg-white/10" />
            <span className="h-3 w-3 rounded-[3px]" style={{ background: "#0e4429" }} />
            <span className="h-3 w-3 rounded-[3px]" style={{ background: "#006d32" }} />
            <span className="h-3 w-3 rounded-[3px]" style={{ background: "#26a641" }} />
            <span className="h-3 w-3 rounded-[3px]" style={{ background: "#39d353" }} />
            More
          </div>

          <p className="mt-3 text-xs text-zinc-500">
            Source: GitHub GraphQL contributions calendar (real data).
          </p>
        </>
      )}
    </section>
  );
}
