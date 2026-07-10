// scripts/build-github-catalog.mjs
// Usage: GH_TOKEN=ghp_xxx node scripts/build-github-catalog.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import 'dotenv/config';


const GH_TOKEN = process.env.GH_TOKEN;
const GH_USER = process.env.GH_USER || "Ridit07";
const MAX_REPOS = Number(process.env.MAX_REPOS || 100);
const MAX_READMES = Number(process.env.MAX_READMES || 30);
const INCLUDE_READMES = process.env.INCLUDE_READMES === "1";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outFile = path.join(__dirname, "..", "public", "github-catalog.json");

// If we can't refresh the catalog (missing/expired token, API error), fall back
// to the catalog already committed at public/github-catalog.json so the build
// still succeeds instead of hard-failing CI.
function bailOrKeepExisting(reason) {
  if (fs.existsSync(outFile)) {
    console.warn(`⚠️  ${reason}`);
    console.warn(`↩️  Keeping existing catalog at public/github-catalog.json (skipping refresh).`);
    process.exit(0);
  }
  console.error(`❌ ${reason}`);
  console.error(`   No existing public/github-catalog.json to fall back to.`);
  process.exit(1);
}

if (!GH_TOKEN) {
  bailOrKeepExisting("GH_TOKEN is not set — cannot refresh GitHub catalog.");
}

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
  let data;
  try {
    data = await ghGraphQL(query, { login: GH_USER, first: MAX_REPOS });
  } catch (err) {
    bailOrKeepExisting(`GitHub API request failed: ${err.message}`);
  }
  const user = data?.data?.user;
  if (!user) bailOrKeepExisting("No user returned from GitHub GraphQL API.");

  const repos = (user.repositories?.nodes || []).map(mapRepo);
  const pinned = (user.pinnedItems?.nodes || []).map(r => mapRepo(r).full_name.toLowerCase());

  const payload = {
    user: GH_USER,
    fetched_at: new Date().toISOString(),
    asset_version: String(Date.now()), // <= lets you version images on client
    repos,
    pinned,
  };

  if (INCLUDE_READMES) {
    const preferred = [
      ...new Set([
        ...pinned,
        ...repos.slice(0, MAX_READMES).map(r => r.full_name.toLowerCase()),
      ]),
    ].slice(0, MAX_READMES);

    async function fetchReadmeMD(owner, repo) {
      const rr = await fetch(`https://api.github.com/repos/${owner}/${repo}/readme`, {
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${GH_TOKEN}`,
          "User-Agent": "ridit-portfolio-build",
        },
      });
      if (rr.status === 404) {
        const candidates = ["README.md", "Readme.md", "readme.md", "README.MD"];
        for (const file of candidates) {
          const raw = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/HEAD/${file}`);
          if (raw.ok) return await raw.text();
        }
        return "";
      }
      if (!rr.ok) return "";
      const j = await rr.json();
      const b64 = (j.content || "").replace(/\n/g, "");
      return Buffer.from(b64, "base64").toString("utf-8");
    }

    const readmes = {};
    for (const full of preferred) {
      const [owner, repo] = full.split("/");
      try { readmes[full] = await fetchReadmeMD(owner, repo); }
      catch { readmes[full] = ""; }
    }
    payload.readmes = readmes;
  }


  fs.writeFileSync(outFile, JSON.stringify(payload, null, 2));
  console.log(`✅ Wrote ${repos.length} repos to public/github-catalog.json`);
})();
