// api/github/catalog.js
export default async function handler(req, res) {
    try {
      const user = req.query.user;
      if (!user) return res.status(400).json({ error: "Missing ?user" });
  
      const token = process.env.GH_TOKEN;
      if (!token) return res.status(500).json({ error: "Server missing GH_TOKEN" });
  
      const gh = (url, init={}) =>
        fetch(url, {
          ...init,
          headers: {
            Accept: "application/vnd.github+json",
            Authorization: `Bearer ${token}`,
            ...(init.headers || {}),
          },
        });
  
      // 1) Repos (public, non-forks)
      const reposResp = await gh(`https://api.github.com/users/${user}/repos?per_page=100&sort=updated`);
      if (!reposResp.ok) {
        const t = await reposResp.text();
        return res.status(reposResp.status).json({ error: t });
      }
      const rawRepos = await reposResp.json();
      const base = rawRepos
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
          owner: r.owner?.login || user,
        }));
  
      // 2) Topics (concurrency-limited)
      async function pMap(list, mapper, concurrency = 8) {
        const out = new Array(list.length);
        let i = 0;
        const workers = Array.from({ length: Math.min(concurrency, list.length) }, async () => {
          while (true) {
            const idx = i++;
            if (idx >= list.length) return;
            out[idx] = await mapper(list[idx], idx);
          }
        });
        await Promise.all(workers);
        return out;
      }
  
      const reposWithTopics = await pMap(base, async (r) => {
        try {
          const tResp = await gh(`https://api.github.com/repos/${r.owner}/${r.name}/topics`);
          const tJson = tResp.ok ? await tResp.json() : { names: [] };
          return { ...r, topics: tJson.names || [] };
        } catch {
          return { ...r, topics: [] };
        }
      }, 8);
  
      // 3) Pinned via GraphQL
      const gql = `
        query($login:String!) {
          user(login: $login) {
            pinnedItems(first: 6, types: REPOSITORY) {
              nodes { ... on Repository { name owner { login } } }
            }
          }
        }
      `;
      const gqlResp = await gh("https://api.github.com/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: gql, variables: { login: user } }),
      });
      const gqlJson = gqlResp.ok ? await gqlResp.json() : null;
      const pinned = gqlJson?.data?.user?.pinnedItems?.nodes?.map(n => `${n.owner.login}/${n.name}`.toLowerCase()) || [];
  
      // Cache at the edge (optional)
      res.setHeader("Cache-Control", "s-maxage=600, stale-while-revalidate=86400");
      return res.status(200).json({ repos: reposWithTopics, pinned });
    } catch (e) {
      return res.status(500).json({ error: e.message || "Internal error" });
    }
  }
  