// /api/github.js
export default async function handler(req, res) {
    try {
        const path = req.query.path || "/rate_limit"; // e.g. /users/Ridit07
        const url = `https://api.github.com${path}`;
        const token = process.env.GH_TOKEN;
        if (!token) return res.status(500).json({ error: "GH_TOKEN not configured" });

        const ifNoneMatch = req.headers["if-none-match"];
        const ghRes = await fetch(url, {
            headers: {
                Accept: "application/vnd.github+json",
                Authorization: `Bearer ${token}`,
                ...(ifNoneMatch ? { "If-None-Match": ifNoneMatch } : {}),
            },
        });

        // forward useful headers
        ["etag", "x-ratelimit-limit", "x-ratelimit-remaining", "x-ratelimit-reset"].forEach(h => {
            const v = ghRes.headers.get(h);
            if (v) res.setHeader(h, v);
        });

        if (ghRes.status === 304) {
            res.status(304).end();
            return;
        }

        const text = await ghRes.text();
        res.status(ghRes.status).send(text);
    } catch (e) {
        res.status(500).json({ error: e.message || "Proxy error" });
    }
}
