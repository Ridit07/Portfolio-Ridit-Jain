// api/github/readme.js
export default async function handler(req, res) {
    try {
      const owner = req.query.owner;
      const repo = req.query.repo;
      if (!owner || !repo) return res.status(400).json({ error: "Missing ?owner & ?repo" });
  
      const token = process.env.GH_TOKEN;
      if (!token) return res.status(500).json({ error: "Server missing GH_TOKEN" });
  
      const gh = (url, init = {}) =>
        fetch(url, {
          ...init,
          headers: {
            Accept: "application/vnd.github+json",
            Authorization: `Bearer ${token}`,
            ...(init.headers || {}),
          },
        });
  
      // Try the JSON /readme (base64)
      const rr = await gh(`https://api.github.com/repos/${owner}/${repo}/readme`);
      if (rr.status === 404) {
        // Fallback to raw
        const candidates = ["README.md", "Readme.md", "readme.md", "README.MD"];
        for (const file of candidates) {
          const raw = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/HEAD/${file}`);
          if (raw.ok) {
            const markdown = await raw.text();
            res.setHeader("Cache-Control", "s-maxage=600, stale-while-revalidate=86400");
            return res.status(200).json({ markdown });
          }
        }
        res.setHeader("Cache-Control", "s-maxage=600, stale-while-revalidate=86400");
        return res.status(200).json({ markdown: "" });
      }
      if (!rr.ok) {
        const t = await rr.text();
        return res.status(rr.status).json({ error: t });
      }
      const j = await rr.json();
      const b64 = (j.content || "").replace(/\n/g, "");
      const bin = Buffer.from(b64, "base64");
      const markdown = new TextDecoder("utf-8").decode(bin);
  
      res.setHeader("Cache-Control", "s-maxage=600, stale-while-revalidate=86400");
      return res.status(200).json({ markdown });
    } catch (e) {
      return res.status(500).json({ error: e.message || "Internal error" });
    }
  }
  