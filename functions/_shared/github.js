const DEFAULT_BASE_BRANCH = "main";
const BRANCH_PREFIX = "recipe-submissions";

export async function createRecipePullRequest(recipe, warnings, env) {
  const owner = env.GITHUB_OWNER || "cjthedj97";
  const repo = env.GITHUB_REPO || "chowdown";
  const base = env.GITHUB_BASE_BRANCH || DEFAULT_BASE_BRANCH;
  const token = env.GITHUB_TOKEN;

  if (!token) {
    throw new Error("GITHUB_TOKEN is not configured.");
  }

  const repoPath = `/repos/${owner}/${repo}`;
  const existing = await github(`${repoPath}/contents/${encodeURIComponentPath(recipe.path)}?ref=${encodeURIComponent(base)}`, {
    token,
    allow404: true
  });

  if (existing && !existing.notFound) {
    throw new Error(`A recipe already exists at ${recipe.path}.`);
  }

  const branch = `${BRANCH_PREFIX}/${recipe.slug}-${Date.now()}`;
  const baseRef = await github(`${repoPath}/git/ref/heads/${base}`, { token });
  const baseSha = baseRef.object.sha;

  await github(`${repoPath}/git/refs`, {
    token,
    method: "POST",
    body: {
      ref: `refs/heads/${branch}`,
      sha: baseSha
    }
  });

  await github(`${repoPath}/contents/${encodeURIComponentPath(recipe.path)}`, {
    token,
    method: "PUT",
    body: {
      message: `Add ${recipe.title} recipe`,
      content: btoaUtf8(recipe.markdown),
      branch
    }
  });

  const validationLines = [
    "✅ Generated recipe Markdown from structured form data",
    "✅ Required fields validated before commit",
    "✅ Spam-check field checked before GitHub write",
    "✅ Turnstile checked before GitHub write",
    "✅ Duplicate filename checked against the base branch"
  ];

  if (warnings && warnings.length) {
    validationLines.push("", "### Warnings", "", ...warnings.map((warning) => `- ${warning}`));
  }

  const prBody = [
    "## Recipe submission",
    "",
    `Adds: ${recipe.title}`,
    "",
    "## Validation",
    "",
    ...validationLines,
    "",
    "## Notes",
    "",
    "This PR was opened by the recipe submission Pages Function. Review the generated Markdown and Cloudflare Pages preview before merging.",
    "",
    "Related roadmap issues: #69, #71, #81, #83"
  ].join("\n");

  const pr = await github(`${repoPath}/pulls`, {
    token,
    method: "POST",
    body: {
      title: `Add ${recipe.title} recipe`,
      head: branch,
      base,
      body: prBody,
      maintainer_can_modify: true
    }
  });

  return {
    number: pr.number,
    title: pr.title,
    url: pr.html_url,
    branch,
    path: recipe.path
  };
}

async function github(path, options) {
  const response = await fetch(`https://api.github.com${path}`, {
    method: options.method || "GET",
    headers: {
      "accept": "application/vnd.github+json",
      "authorization": `Bearer ${options.token}`,
      "content-type": "application/json",
      "user-agent": "recipe-submission-pages-function",
      "x-github-api-version": "2022-11-28"
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  if (options.allow404 && response.status === 404) {
    return { notFound: true };
  }

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message = data && data.message ? data.message : `GitHub API error ${response.status}`;
    throw new Error(message);
  }

  return data;
}

function encodeURIComponentPath(path) {
  return path.split("/").map(encodeURIComponent).join("/");
}

function btoaUtf8(value) {
  return btoa(unescape(encodeURIComponent(value)));
}
