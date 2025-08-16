// api/github/catalog.js
const query = `
  query($login:String!, $first:Int!) {
    user(login: $login) {
      pinnedItems(first: 6, types: REPOSITORY) {
        nodes { ...RepoFrag }
      }
      repositories(
        first: $first,
        privacy: PUBLIC,
        isFork: false,
        orderBy: {field: UPDATED_AT, direction: DESC}
      ) {
        nodes { ...RepoFrag }
      }
    }
  }
  fragment RepoFrag on Repository {
    id
    name
    nameWithOwner
    url
    homepageUrl
    description
    stargazerCount
    owner { login }
    primaryLanguage { name }
    repositoryTopics(first: 25) { nodes { topic { name } } }
  }
`;

function mapRepo(r) {
  return {
    id: r.id,
    name: r.name,
    full_name: r.nameWithOwner,
    html_url: r.url,
    homepage: r.homepageUrl || "",
    description: r.description || "",
    language: r.primaryLanguage?.name || "",
    stargazers_count: r.stargazerCount || 0,
    owner: r.owner?.login || "",
    topics: (r.repositoryTopics?.nodes || []).map(n => n.topic?.name).filter(Boolean),
  };
}

async function ghGraphQL(token, q, variables) {
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": "ridit-portfolio-api",
    },
    body: JSON.stringify({ query: q, variables }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`GraphQL ${res.status} ${res.statusText}: ${t}`);
  }
  return res.json();
}

  
async function fetchReadmeMD(owner, repo, token) {
  // Same logic as readme.js, but inline to avoid extra network hop
  const gh = (url, init = {}) =>
    fetch(url, {
      ...init,
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        ...(init.headers || {}),
      },
    });

  const rr = await gh(`https://api.github.com/repos/${owner}/${repo}/readme`);
  if (rr.status === 404) {
    const candidates = ["README.md", "Readme.md", "readme.md", "README.MD"];
    for (const file of candidates) {
      const raw = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/HEAD/${file}`);
      if (raw.ok) return await raw.text();
    }
    return "";
  }
  if (!rr.ok) {
    // swallow errors for robustness (don’t fail whole catalog)
    return "";
  }
  const j = await rr.json();
  const b64 = (j.content || "").replace(/\n/g, "");
  const bin = Buffer.from(b64, "base64");
  return new TextDecoder("utf-8").decode(bin);
}

// simple in-memory memo between warm invocations
globalThis.__CATALOG_MEMO ||= { key: "", at: 0, data: null };
// asset version only bumps on explicit refresh
globalThis.__ASSET_VERSION ||= String(Date.now());

export default async function handler(req, res) {
  try {
    const user = req.query.user || process.env.GH_USER;
    if (!user) return res.status(400).json({ error: "Missing ?user" });

    const token = process.env.GH_TOKEN;
    if (!token) return res.status(500).json({ error: "Server missing GH_TOKEN" });

    const refresh = req.query.refresh === "1";
    const includeReadmes = req.query.with_readmes === "1";
    const first = Number(process.env.MAX_REPOS || 100);
    const memoKey = `${user}:${first}:${includeReadmes ? "R" : ""}`;
    const memoTTLms = 10 * 60 * 1000; // 10 min server memo

    if (refresh) {
      globalThis.__ASSET_VERSION = String(Date.now());
    }

    if (!refresh && globalThis.__CATALOG_MEMO.key === memoKey) {
      const age = Date.now() - globalThis.__CATALOG_MEMO.at;
      if (globalThis.__CATALOG_MEMO.data && age < memoTTLms) {
        res.setHeader("Cache-Control", "s-maxage=21600, stale-while-revalidate=86400"); // 6h
        return res.status(200).json(globalThis.__CATALOG_MEMO.data);
      }
    }

    const data = await ghGraphQL(token, query, { login: user, first });
    const u = data?.data?.user;
    if (!u) throw new Error("No user from GraphQL");

    const repos = (u.repositories?.nodes || []).map(mapRepo);
    const pinned = (u.pinnedItems?.nodes || []).map(r => mapRepo(r).full_name.toLowerCase());

    const payload = {
      user,
      fetched_at: new Date().toISOString(),
      asset_version: globalThis.__ASSET_VERSION,
      repos,
      pinned,
    };

    if (includeReadmes) {
      const MAX_READMES = Number(process.env.MAX_READMES || 30);
      const preferred = [
        ...new Set([
          ...pinned,
          ...repos.slice(0, MAX_READMES).map(r => r.full_name.toLowerCase()),
        ]),
      ].slice(0, MAX_READMES);

      const readmes = {};
      await Promise.all(
        preferred.map(async (full) => {
          const [owner, repo] = full.split("/");
          try {
            readmes[full] = await fetchReadmeMD(owner, repo, token);
          } catch {
            readmes[full] = "";
          }
        })
      );
      payload.readmes = readmes;
    }

    // memoize
    globalThis.__CATALOG_MEMO = { key: memoKey, at: Date.now(), data: payload };

    res.setHeader("Cache-Control", "s-maxage=21600, stale-while-revalidate=86400"); // 6h at edge
    return res.status(200).json(payload);
  } catch (e) {
    return res.status(500).json({ error: e.message || "Internal error" });
  }
}
