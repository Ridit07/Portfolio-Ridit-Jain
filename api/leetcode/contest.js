// /api/leetcode/contest.js
export default async function handler(req, res) {
  try {
    const { user = "", debug = "0" } = req.query || {};
    if (!user) return res.status(400).json({ error: "Missing ?user" });

    const query = `
        query userContestRankingInfo($username: String!) {
          userContestRanking(username: $username) {
            rating
            globalRanking
            attendedContestsCount
            topPercentage
          }
          userContestRankingHistory(username: $username) {
            contest { title startTime }
            rating
            ranking
          }
        }
      `;

    const lcRes = await fetch("https://leetcode.com/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Referer": "https://leetcode.com",
        "User-Agent": "Mozilla/5.0",
      },
      body: JSON.stringify({ query, variables: { username: user } }),
    });

    const json = await lcRes.json().catch(() => ({}));

    if (!lcRes.ok || json.errors) {
      const msg = json?.errors?.[0]?.message || `${lcRes.status} ${lcRes.statusText}`;
      if (debug === "1") console.error("LeetCode error:", msg, json);
      return res.status(lcRes.status || 500).json({ error: msg, _debug: debug === "1" ? json : undefined });
    }

    const r = json?.data?.userContestRanking || null;
    const hist = Array.isArray(json?.data?.userContestRankingHistory)
      ? json.data.userContestRankingHistory
      : [];


    const historyAll = hist
      .filter(h => Number.isFinite(h?.rating) && h?.contest?.startTime)
      .map(h => ({
        ts: Number(h.contest.startTime) * 1000,
        rating: Number(h.rating),
        ranking: Number.isFinite(h.ranking) ? Number(h.ranking) : null,
        title: h.contest.title || "",
      }))
      .sort((a, b) => a.ts - b.ts);

    const cutoff = Date.now() - 365 * 24 * 60 * 60 * 1000;
    const history1y = historyAll.filter(p => p.ts >= cutoff);


    const latestRankFromHistory = [...historyAll].reverse().find(p => p.ranking != null)?.ranking ?? null;

    const payload = r
      ? {
        rating: r.rating ?? 0,
        globalRanking: (r.globalRanking ?? latestRankFromHistory ?? null),
        attended: r.attendedContestsCount ?? historyAll.length,
        topPercentage: r.topPercentage ?? null,
        history: history1y,
      }
      : {
        rating: 0,
        globalRanking: latestRankFromHistory,
        attended: historyAll.length,
        topPercentage: null,
        history: history1y,
      };

    res.setHeader("Content-Type", "application/json");
    res.setHeader("Cache-Control", "s-maxage=600, stale-while-revalidate=3600, stale-if-error=86400");
    return res.status(200).json({ ...payload, _fetched_at: Date.now() });
  } catch (e) {
    console.error("API /leetcode/contest crashed:", e);
    return res.status(500).json({ error: e?.message || "Internal error" });
  }
}
