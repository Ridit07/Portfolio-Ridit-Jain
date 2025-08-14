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

// simple in-memory memo between warm invocations
globalThis.__CATALOG_MEMO ||= { key: "", at: 0, data: null };

export default async function handler(req, res) {
  try {
    const user = req.query.user || process.env.GH_USER;
    if (!user) return res.status(400).json({ error: "Missing ?user" });

    const token = process.env.GH_TOKEN;
    if (!token) return res.status(500).json({ error: "Server missing GH_TOKEN" });

    const refresh = req.query.refresh === "1";
    const memoKey = `${user}:${process.env.MAX_REPOS || 100}`;
    const memoTTLms = 10 * 60 * 1000; // 10 min server memo

    if (!refresh && globalThis.__CATALOG_MEMO.key === memoKey) {
      const age = Date.now() - globalThis.__CATALOG_MEMO.at;
      if (globalThis.__CATALOG_MEMO.data && age < memoTTLms) {
        res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");
        return res.status(200).json(globalThis.__CATALOG_MEMO.data);
      }
    }

    const first = Number(process.env.MAX_REPOS || 100);
    const data = await ghGraphQL(token, query, { login: user, first });
    const u = data?.data?.user;
    if (!u) throw new Error("No user from GraphQL");

    const repos = (u.repositories?.nodes || []).map(mapRepo);
    const pinned = (u.pinnedItems?.nodes || []).map(r => mapRepo(r).full_name.toLowerCase());

    const payload = {
      user,
      fetched_at: new Date().toISOString(),
      repos,
      pinned,
    };

    // memoize for warm invocations
    globalThis.__CATALOG_MEMO = { key: memoKey, at: Date.now(), data: payload };

    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");
    return res.status(200).json(payload);
  } catch (e) {
    return res.status(500).json({ error: e.message || "Internal error" });
  }
}
