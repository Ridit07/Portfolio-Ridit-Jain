// /api/github/calendar.js
import crypto from "crypto";

export default async function handler(req, res) {
  try {
    const { login = "", days = "365", debug = "0" } = req.query || {};
    if (!login) return res.status(400).json({ error: "Missing ?login" });

    const GH_TOKEN = process.env.GH_TOKEN;
    if (!GH_TOKEN) return res.status(500).json({ error: "GH_TOKEN not configured on server" });

    const n = parseInt(days, 10);
    const daysInt = Number.isFinite(n) ? Math.min(365, Math.max(1, n)) : 365;

    const toUtc = new Date();
    toUtc.setUTCHours(23, 59, 59, 999);
    const fromUtc = new Date(toUtc);
    fromUtc.setUTCDate(toUtc.getUTCDate() - daysInt + 1);
    fromUtc.setUTCHours(0, 0, 0, 0);

    const query = `
      query($login:String!, $from:DateTime!, $to:DateTime!) {
        rateLimit {
          cost
          remaining
          resetAt
          used
        }
        user(login:$login) {
          login
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

    const ghRes = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: {
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${GH_TOKEN}`,
      },
      body: JSON.stringify({
        query,
        variables: { login, from: fromUtc.toISOString(), to: toUtc.toISOString() },
      }),
    });

    const json = await ghRes.json().catch(() => ({}));

    if (!ghRes.ok || json.errors) {
      const msg = json?.errors?.[0]?.message || `${ghRes.status} ${ghRes.statusText}`;
      if (debug === "1") console.error("GraphQL error:", msg, json);
      return res.status(ghRes.status || 500).json({
        error: msg,
        details: debug === "1" ? json?.errors?.[0]?.extensions : undefined,
        rateLimit: json?.data?.rateLimit,
        _debug: debug === "1" ? json : undefined,
      });
    }

    const user = json?.data?.user;
    const rl = json?.data?.rateLimit;

    const tokenHint = (process.env.GH_TOKEN || "").startsWith("github_pat_")
      ? "If data is empty: fine-grained PATs may lack GraphQL access. Prefer a classic PAT (no scopes needed for public data)."
      : undefined;

    const cal = user?.contributionsCollection?.contributionCalendar;
    const total = cal?.totalContributions ?? 0;
    const weeks = Array.isArray(cal?.weeks) ? cal.weeks : [];

    const payload = {
      total,
      weeks,
      _fetched_at: Date.now(),
      warning: (!weeks.length && total === 0) ? tokenHint : undefined,
      rateLimit: rl ? { remaining: rl.remaining, resetAt: rl.resetAt, cost: rl.cost, used: rl.used } : undefined,
    };
    const bodyStr = JSON.stringify(payload);
    const etag = `"W/${crypto.createHash("sha1").update(bodyStr).digest("hex")}"`;

    const inm = req.headers["if-none-match"];
    if (inm && inm === etag) {
      res.statusCode = 304;
      res.setHeader("ETag", etag);
      res.setHeader("Cache-Control", "s-maxage=600, stale-while-revalidate=3600, stale-if-error=86400");
      return res.end();
    }

    res.setHeader("Content-Type", "application/json");
    res.setHeader("Cache-Control", "s-maxage=600, stale-while-revalidate=3600, stale-if-error=86400");
    res.setHeader("ETag", etag);

    return res.status(200).send(bodyStr);
  } catch (e) {
    console.error("API /github/calendar crashed:", e);
    return res.status(500).json({ error: e?.message || "Internal error" });
  }
}
