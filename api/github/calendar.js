// /api/github/calendar.js
export default async function handler(req, res) {
  try {
    const { login = "", days = "365", debug = "0" } = req.query || {};
    if (!login) return res.status(400).json({ error: "Missing ?login" });

    // Load token
    const GH_TOKEN = process.env.GH_TOKEN;
    if (!GH_TOKEN) return res.status(500).json({ error: "GH_TOKEN not configured on server" });

    // ---- UTC-safe inclusive window: [from..to]
    const daysInt = Number.isFinite(parseInt(days, 10)) ? parseInt(days, 10) : 365;
    const toUtc = new Date();
    toUtc.setUTCHours(23, 59, 59, 999);                 // inclusive end of today (UTC)
    const fromUtc = new Date(toUtc);
    fromUtc.setUTCDate(toUtc.getUTCDate() - daysInt + 1);
    fromUtc.setUTCHours(0, 0, 0, 0);

    const query = `
      query($login:String!, $from:DateTime!, $to:DateTime!) {
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
      return res
        .status(ghRes.status || 500)
        .json({
          error: msg,
          details: debug === "1" ? json?.errors?.[0]?.extensions : undefined,
          _debug: debug === "1" ? json : undefined,
        });
    }

    const user = json?.data?.user;
    if (!user) {
      const hint = "GitHub returned null user. Common cause: fine-grained PAT lacks GraphQL. Use a CLASSIC PAT.";
      if (debug === "1") console.error(hint, json);
      // Cache empty safely too
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Cache-Control", "s-maxage=600, stale-while-revalidate=3600, stale-if-error=86400");
      return res.status(200).json({ total: 0, weeks: [], warning: hint, _fetched_at: Date.now(), _debug: debug === "1" ? json : undefined });
    }

    const cal = user.contributionsCollection?.contributionCalendar;
    const total = cal?.totalContributions ?? 0;
    const weeks = Array.isArray(cal?.weeks) ? cal.weeks : [];

    // CDN caching (Vercel) + resilience on upstream hiccups
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Cache-Control", "s-maxage=600, stale-while-revalidate=3600, stale-if-error=86400");

    const tokenHint = (process.env.GH_TOKEN || "").startsWith("github_pat_")
      ? "Fine-grained PATs often lack GraphQL access. Use a classic PAT (no scopes needed for public data)."
      : undefined;

    return res.status(200).json({
      total,
      weeks,
      _fetched_at: Date.now(),
      warning: (!weeks.length && total === 0) ? (tokenHint || "Calendar is empty; check token/permissions.") : undefined,
      _debug: debug === "1" ? json : undefined,
    });
  } catch (e) {
    console.error("API /github/calendar crashed:", e);
    return res.status(500).json({ error: e?.message || "Internal error" });
  }
}
