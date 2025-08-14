// scripts/build-github-catalog.mjs
// Usage: GH_TOKEN=ghp_xxx node scripts/build-github-catalog.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const GH_TOKEN = process.env.GH_TOKEN;
const GH_USER = process.env.GH_USER || "Ridit07";
const MAX_REPOS = Number(process.env.MAX_REPOS || 100);

if (!GH_TOKEN) {
  console.error("❌ GH_TOKEN is required for build prefetch.");
  process.exit(1);
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outFile = path.join(__dirname, "..", "public", "github-catalog.json");

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

async function ghGraphQL(q, variables) {
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${GH_TOKEN}`,
      "Content-Type": "application/json",
      "User-Agent": "ridit-portfolio-build",
    },
    body: JSON.stringify({ query: q, variables }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`GraphQL ${res.status} ${res.statusText}: ${t}`);
  }
  return res.json();
}

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

(async () => {
  console.log(`⏳ Fetching GitHub catalog for ${GH_USER}…`);
  const data = await ghGraphQL(query, { login: GH_USER, first: MAX_REPOS });
  const user = data?.data?.user;
  if (!user) throw new Error("No user returned from GraphQL");

  const repos = (user.repositories?.nodes || []).map(mapRepo);
  const pinned = (user.pinnedItems?.nodes || []).map(r => mapRepo(r).full_name.toLowerCase());

  const payload = {
    user: GH_USER,
    fetched_at: new Date().toISOString(),
    repos,
    pinned,
  };

  fs.writeFileSync(outFile, JSON.stringify(payload, null, 2));
  console.log(`✅ Wrote ${repos.length} repos to public/github-catalog.json`);
})();
