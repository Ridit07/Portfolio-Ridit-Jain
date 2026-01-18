// components/GitHubCalendar.jsx
import { useEffect, useMemo, useState } from "react";

// LocalStorage with TTL (+version for future invalidation)
const VERSION = "v2"; // bump to invalidate old cache once
const hasLS = () => typeof window !== "undefined" && !!window.localStorage;
const saveWithTTL = (key, value, ttlMs) => { if (!hasLS()) return; try { localStorage.setItem(key, JSON.stringify({ value, expiry: Date.now() + ttlMs })); } catch { } };
const loadWithTTL = (key) => {
  if (!hasLS()) return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { value, expiry } = JSON.parse(raw);
    if (!expiry || Date.now() > expiry) { localStorage.removeItem(key); return null; }
    return value;
  } catch { return null; }
};
const lsGet = (k) => { try { return hasLS() ? localStorage.getItem(k) : null; } catch { return null; } };
const lsSet = (k, v) => { try { if (hasLS()) localStorage.setItem(k, v); } catch { } };

const CAL_TTL_MS = 60 * 60 * 1000; // 1 hour
const CACHE_KEY = (login, days) => `gh_calendar_${VERSION}_${login}_${days}`;
const ETAG_KEY = (login, days) => `gh_calendar_${VERSION}_${login}_${days}_etag`;

const IS_DEV = typeof import.meta !== "undefined" && import.meta.env && import.meta.env.DEV;
const API_BASE = (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_API_BASE) ? import.meta.env.VITE_API_BASE : "";

export default function GitHubCalendar({ login, days = 365 }) {
  const [weeks, setWeeks] = useState([]);
  const [total, setTotal] = useState(0);
  const [err, setErr] = useState("");
  const [warn, setWarn] = useState("");
  const [loading, setLoad] = useState(true);

  useEffect(() => {
    let alive = true;
    const controller = new AbortController();

    const CK = CACHE_KEY(login, days);
    const EK = ETAG_KEY(login, days);

    // 1) Instant paint from LS (if any)
    const cached = loadWithTTL(CK);
    if (cached && alive) {
      setWeeks(cached.weeks || []);
      setTotal(cached.total || 0);
      setWarn(cached.warning || "");
      setLoad(false);
    }

    // 2) Background refresh — honor ETag to get 304s
    (async () => {
      try {
        setErr("");

        const url = `${API_BASE}/api/github/calendar?login=${encodeURIComponent(login)}&days=${days}` +
          (IS_DEV ? `&ts=${Date.now()}` : ""); // bust cache only in dev

        const etag = lsGet(EK);
        const res = await fetch(url, {
          ...(IS_DEV ? { cache: "no-cache" } : {}),     // allow CDN in prod
          signal: controller.signal,
          headers: {
            Accept: "application/json",
            ...(etag ? { "If-None-Match": etag } : {}),
          }
        });

        if (res.status === 304) {
          // Nothing changed — keep current state (from LS) and exit quietly
          if (alive) setLoad(false);
          return;
        }

        const ct = res.headers.get("content-type") || "";
        if (!ct.includes("application/json")) {
          const preview = await res.text().catch(() => "");
          throw new Error(`Calendar API did not return JSON (got ${ct || "unknown"}). ${preview.slice(0, 120)}…`);
        }

        const json = await res.json();
        if (!alive) return;

        if (!res.ok || json.error) {
          const msg = json.error || `${res.status} ${res.statusText}`;
          // Nicer message if upstream rate limit ever bubbles up
          const pretty = /rate.?limit/i.test(msg)
            ? "GitHub rate limit hit upstream. Showing cached data if available; try again later."
            : msg;
          throw new Error(pretty);
        }

        const nextWeeks = Array.isArray(json.weeks) ? json.weeks : [];
        const nextTotal = Number.isFinite(json.total) ? json.total : 0;
        const nextWarn = json.warning || "";

        setWeeks(nextWeeks);
        setTotal(nextTotal);
        setWarn(nextWarn);
        setLoad(false);

        const newEtag = res.headers.get("etag");
        if (newEtag) lsSet(EK, newEtag);

        saveWithTTL(
          CK,
          { weeks: nextWeeks, total: nextTotal, warning: nextWarn, fetchedAt: json._fetched_at || Date.now() },
          CAL_TTL_MS
        );
      } catch (e) {
        if (!alive || controller.signal.aborted) return;
        setErr(e.message || "Failed to load GitHub contributions.");
        setLoad(false);
      }
    })();

    return () => { alive = false; controller.abort(); };
  }, [login, days]);

  const legend = useMemo(() => {
    const counts = weeks.flatMap(w => (w.contributionDays || []).map(d => d.contributionCount || 0));
    if (counts.length === 0) return [0, 0, 0, 0];
    const sorted = counts.slice().sort((a, b) => a - b);
    const q = (p) => sorted[Math.floor(p * (sorted.length - 1))] || 0;
    return [q(0.20), q(0.40), q(0.60), q(0.80)];
  }, [weeks]);

  const monthSegments = useMemo(() => {
    if (!weeks.length) return [];
    const labelOf = (iso) => new Date(iso).toLocaleString(undefined, { month: "short" });

    let segs = [];
    let start = 0;
    let curMonth = new Date(weeks[0].firstDay).getMonth();
    let curLabel = labelOf(weeks[0].firstDay);

    for (let i = 1; i < weeks.length; i++) {
      const m = new Date(weeks[i].firstDay).getMonth();
      if (m !== curMonth) {
        segs.push({ label: curLabel, span: i - start });
        start = i;
        curMonth = m;
        curLabel = labelOf(weeks[i].firstDay);
      }
    }
    segs.push({ label: curLabel, span: weeks.length - start });
    return segs;
  }, [weeks]);

  return (
    <section className="mt-6 rounded-2xl bg-[#0f1115] border border-white/10 p-5">
      <div className="flex items-baseline justify-between">
        <h4 className="text-xl font-semibold">GitHub Contributions</h4>
        <span className="text-sm text-zinc-400">{total} in the last {days} days</span>
      </div>

      {err && (
        <div className="mt-4 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm">
          {err}
        </div>
      )}

      {!err && warn && (
        <div className="mt-4 rounded-md border border-yellow-500/30 bg-yellow-500/10 px-3 py-2 text-xs">
          {warn}
        </div>
      )}

      {!err && (
        <>
          {loading && weeks.length === 0 && (
            <div className="mt-4 text-sm text-zinc-400">Loading calendar…</div>
          )}

          {weeks.length > 0 && (
            <>
              <div className="mt-4 overflow-x-auto" aria-hidden="true">
                <div className="min-w-[680px]">
                  <div
                    className="grid text-[10px] text-zinc-400"
                    style={{ gridTemplateColumns: `repeat(${weeks.length}, 12px)`, columnGap: "3px" }}
                  >
                    {monthSegments.map((seg, i) => (
                      <div key={i} className="truncate" style={{ gridColumn: `span ${seg.span}` }}>
                        {seg.label}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-1 overflow-x-auto">
                <div className="flex gap-[3px] min-w-[680px]" key={weeks[0]?.firstDay || "cal"}>
                  {weeks.map((w, i) => (
                    <div key={(w.firstDay || "") + i} className="flex flex-col gap-[3px]">
                      {(w.contributionDays || []).map((d, idx) => {
                        const c = d.contributionCount || 0;
                        const bg =
                          d.color ||
                          (c === 0 ? "rgba(255,255,255,.08)" :
                            c <= legend[0] ? "#0e4429" :
                              c <= legend[1] ? "#006d32" :
                                c <= legend[2] ? "#26a641" :
                                  c <= legend[3] ? "#39d353" : "#56f28a");
                        return (
                          <div
                            key={(d.date || idx) + ":" + idx}
                            title={`${d.date}: ${c} contribution${c === 1 ? "" : "s"}`}
                            className="h-[12px] w-[12px] rounded-[3px] border border-black/20"
                            style={{ background: bg }}
                            aria-label={`${d.date} ${c} contributions`}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </>
      )}

      <p className="mt-3 text-xs text-zinc-500">
        Source: server-side GitHub GraphQL (token on server). Cached locally for 1h; CDN-cached in production for 10m. Uses ETag to avoid re-downloads.
      </p>
    </section>
  );
}
